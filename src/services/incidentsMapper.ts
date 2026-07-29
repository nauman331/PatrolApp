import { INCIDENT_ASSETS_BASE_URL } from '../config/env';
import { formatFullDisplayDate } from './guardJobsMapper';

export type IncidentSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface MappedIncident {
  id: number;
  jobId?: number;
  guardId?: number;
  rosterId?: number;
  siteName: string;
  incidentDate: string;
  incidentTime: string;
  injuryType: string;
  injuryDetail: string;
  severity: IncidentSeverity;
  pdf?: string | null;
  peopleInvolved: Record<string, unknown>[];
  vehicles: Record<string, unknown>[];
  emergencyServices: Record<string, unknown>;
  witnesses: Record<string, unknown>[];
  peopleCount: number;
  vehiclesCount: number;
  witnessesCount: number;
  photos: { imgPath: string; timestamp: string; uri?: string }[];
  signature?: string;
  signatureUri?: string;
  createdAt?: string;
  updatedAt?: string;
  displayDateTime: string;
}

function parseJsonField<T>(value: unknown, fallback: T): T {
  if (value == null || value === '') return fallback;
  if (Array.isArray(value)) return value as T;
  if (typeof value === 'object') return value as T;
  if (typeof value !== 'string') return fallback;
  try {
    const parsed = JSON.parse(value);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
}

/** API may return a single object or an array for people/vehicles/witnesses. */
function normalizeRecordArray(value: unknown): Record<string, unknown>[] {
  const parsed = parseJsonField<unknown>(value, []);
  if (Array.isArray(parsed)) {
    return parsed.filter(
      (item): item is Record<string, unknown> =>
        item != null && typeof item === 'object' && !Array.isArray(item),
    );
  }
  if (parsed && typeof parsed === 'object') {
    return [parsed as Record<string, unknown>];
  }
  return [];
}

function cleanText(value: unknown): string {
  if (value == null) return '';
  const text = String(value).trim();
  return text.replace(/^"+|"+$/g, '').replace(/\\"/g, '"');
}

export function getIncidentAssetUrl(path?: string | null): string | undefined {
  if (!path?.trim()) return undefined;
  const trimmed = path.trim();
  if (trimmed.startsWith('data:') || trimmed.startsWith('http')) {
    return trimmed;
  }
  const normalized = trimmed.replace(/^\//, '');
  return `${INCIDENT_ASSETS_BASE_URL}/${normalized}`;
}

function parsePdfPath(value: unknown): string | null {
  if (value == null) return null;
  let text = cleanText(value);
  if (!text) return null;
  if (
    (text.startsWith('{') || text.startsWith('[') || text.startsWith('"')) &&
    text.length > 1
  ) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string' && parsed.trim()) {
        text = cleanText(parsed);
      }
    } catch {
      // keep raw string
    }
  }
  return text || null;
}

function readNumericField(record: Record<string, unknown>, keys: string[]): number {
  for (const key of keys) {
    const raw = record[key];
    if (raw == null || raw === '') continue;
    const n = Number(raw);
    if (!Number.isNaN(n) && n >= 0) return n;
  }
  return 0;
}

function countPeopleInvolved(people: Record<string, unknown>[]): number {
  if (!people.length) return 0;
  let maxDeclared = 0;
  for (const person of people) {
    maxDeclared = Math.max(
      maxDeclared,
      readNumericField(person, [
        'peopleCount',
        'PeopleCount',
        'people_count',
      ]),
    );
  }
  return maxDeclared > 0 ? maxDeclared : people.length;
}

function countListRecords(
  records: Record<string, unknown>[],
  countKeys: string[],
): number {
  if (!records.length) return 0;
  let maxDeclared = 0;
  for (const record of records) {
    maxDeclared = Math.max(maxDeclared, readNumericField(record, countKeys));
  }
  return maxDeclared > 0 ? maxDeclared : records.length;
}

function mapSeverity(injuryType: string): IncidentSeverity {
  const lower = injuryType.toLowerCase();
  if (lower.includes('major') || lower.includes('high')) return 'HIGH';
  if (lower.includes('minor') || lower.includes('low')) return 'LOW';
  return 'MEDIUM';
}

export function formatAppDateTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr && !timeStr) return '—';

  let prefix = '';
  let cleanDate = dateStr?.trim() || '';
  const cleanTime = timeStr?.trim() || '';

  // Handle strings like "Site Name - Jul 9, 2026"
  if (cleanDate.includes(' - ')) {
    const lastIndex = cleanDate.lastIndexOf(' - ');
    const possiblePrefix = cleanDate.substring(0, lastIndex);
    const possibleDate = cleanDate.substring(lastIndex + 3).trim();

    // If the part after " - " looks like it might contain a date (has numbers or month name)
    if (possibleDate.match(/[a-zA-Z]{3}/) || possibleDate.match(/\d/)) {
      prefix = possiblePrefix + ' - ';
      cleanDate = possibleDate;
    }
  }

  // Show time if time is explicitly provided or if the date string contains a time separator
  const hasExplicitTime = cleanTime.length > 0 || cleanDate.includes(':');

  let d: Date | null = null;

  const tryParse = (str: string) => {
    if (!str) return null;
    let parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;

    // Fix for some Android versions/environments that don't like dashes in date strings
    parsed = new Date(str.replace(/-/g, '/'));
    if (!isNaN(parsed.getTime())) return parsed;

    // Handle DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);

      let hours = 0,
        mins = 0;
      const timeMatch = str.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        mins = parseInt(timeMatch[2], 10);
      }

      parsed = new Date(year, month, day, hours, mins, 0);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Handle MMM D, YYYY or MMM D YYYY (e.g. Jul, 9 2026 or Jul 9 2026)
    const mdyMatch = str.match(/^([a-zA-Z]{3})[ ,]+(\d{1,2})[ ,]+(\d{4})/);
    if (mdyMatch) {
      const monthStr = mdyMatch[1].toLowerCase();
      const day = parseInt(mdyMatch[2], 10);
      const year = parseInt(mdyMatch[3], 10);
      const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };

      if (months[monthStr] !== undefined) {
        let hours = 0, mins = 0;
        const timeMatch = str.match(/(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          hours = parseInt(timeMatch[1], 10);
          mins = parseInt(timeMatch[2], 10);
        }
        parsed = new Date(year, months[monthStr], day, hours, mins, 0);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }

    return null;
  };

  if (cleanDate && cleanTime) {
    d = tryParse(`${cleanDate.replace(/-/g, '/')} ${cleanTime}`);
  }

  if (!d || isNaN(d.getTime())) {
    d = tryParse(cleanDate || cleanTime);
  }

  if (!d || isNaN(d.getTime())) {
    return cleanDate || cleanTime || '—';
  }

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  if (!hasExplicitTime) {
    return `${prefix}${dd}/${mm}/${yyyy}`;
  }

  let h = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const hh = String(h).padStart(2, '0');

  return `${prefix}${dd}/${mm}/${yyyy} ${hh}:${mins} ${ampm}`;
}

export function mapApiIncident(raw: unknown): MappedIncident | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = row.id;
  if (id == null) return null;

  const injuryType = cleanText(row.injury_type ?? row.injuryType ?? 'Incident');
  const photosRaw = parseJsonField<
    Array<{ imgPath?: string; timestamp?: string }>
  >(row.photo ?? row.photos, []);

  const photos = photosRaw.map(photo => {
    const imgPath = cleanText(photo?.imgPath);
    return {
      imgPath,
      timestamp: cleanText(photo?.timestamp),
      uri: getIncidentAssetUrl(imgPath),
    };
  });

  const signature = cleanText(row.signature);
  const peopleInvolved = normalizeRecordArray(row.people_involved);
  const vehicles = normalizeRecordArray(
    row.vehicle ?? row.vehicles ?? row.Vehicle,
  );
  const witnesses = normalizeRecordArray(
    row.wittness ?? row.witness ?? row.witnesses ?? row.Wittness,
  );

  const rowPeopleCount = Number(row.people_count);
  const peopleCount =
    row.people_count != null && !Number.isNaN(rowPeopleCount)
      ? rowPeopleCount
      : countPeopleInvolved(peopleInvolved);

  const rowVehicleCount = Number(row.vehicle_count);
  const vehiclesCount =
    row.vehicle_count != null && !Number.isNaN(rowVehicleCount)
      ? rowVehicleCount
      : countListRecords(vehicles, [
          'vehiclesCount',
          'vehicle_count',
          'VehiclesCount',
        ]);

  const rowWitnessCount = Number(row.witness_count);
  const witnessesCount =
    row.witness_count != null && !Number.isNaN(rowWitnessCount)
      ? rowWitnessCount
      : countListRecords(witnesses, [
          'witnessesCount',
          'witness_count',
          'WitnessCount',
          'wittness_count',
        ]);

  return {
    id: Number(id),
    jobId: row.job_id != null ? Number(row.job_id) : undefined,
    guardId: row.guard_id != null ? Number(row.guard_id) : undefined,
    rosterId: row.roster_id != null ? Number(row.roster_id) : undefined,
    siteName: cleanText(row.site_name ?? row.siteName ?? 'Site'),
    incidentDate: cleanText(row.incident_date ?? row.date),
    incidentTime: cleanText(row.incident_time ?? row.time),
    injuryType,
    injuryDetail: cleanText(row.injury_detail ?? row.incident_detail),
    severity: mapSeverity(injuryType),
    pdf: parsePdfPath(row.pdf),
    peopleInvolved,
    vehicles,
    emergencyServices: parseJsonField(row.emergency_services, {}),
    witnesses,
    peopleCount,
    vehiclesCount,
    witnessesCount,
    photos,
    signature: signature || undefined,
    signatureUri: getIncidentAssetUrl(signature),
    createdAt: cleanText(row.created_at),
    updatedAt: cleanText(row.updated_at),
    displayDateTime: formatAppDateTime(
      cleanText(row.incident_date ?? row.date),
      cleanText(row.incident_time ?? row.time),
    ),
  };
}

export function mapApiIncidents(list: unknown[]): MappedIncident[] {
  return list
    .map(mapApiIncident)
    .filter((item): item is MappedIncident => Boolean(item));
}

export function getIncidentListMeta(incidents: MappedIncident[]): {
  count: number;
  subtitle: string;
} {
  const count = incidents.length;
  const latest = incidents[0];
  const site = latest?.siteName?.split(',')[0]?.trim() ?? 'Your reports';
  const dateLabel = formatFullDisplayDate(latest?.incidentDate);
  return {
    count,
    subtitle: `${site} · ${dateLabel}`,
  };
}
