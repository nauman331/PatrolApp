export type ShiftStatus = 'active' | 'upcoming' | 'done';

export interface MappedShift {
  site: string;
  id: string;
  rosterId: string | number;
  siteId?: string | number;
  shiftDate?: string;
  time: string;
  date?: string;
  zones: string;
  status: ShiftStatus;
  progress?: number;
  progressLabel?: string;
}

export interface IncidentJobContext {
  rosterId: string | number;
  siteId: string | number;
  siteName: string;
  shiftDate?: string;
  siteAddress?: string;
}

export interface ShiftGroup {
  group: string;
  items: MappedShift[];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return '';
}

function pickId(value: unknown): string | number | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

function mapStatus(raw: unknown): ShiftStatus {
  const s = String(raw ?? '').toLowerCase();
  if (
    ['active', 'in_progress', 'in-progress', 'ongoing', 'checked_in'].includes(
      s,
    )
  ) {
    return 'active';
  }
  if (['done', 'completed', 'finished', 'closed'].includes(s)) {
    return 'done';
  }
  if (['scheduled', 'upcoming', 'pending'].includes(s)) {
    return 'upcoming';
  }
  return 'upcoming';
}

function formatTimeRange(job: Record<string, unknown>): string {
  const start = pickString(
    job.start_datetime,
    job.start_time,
    job.shift_start,
    job.start_at,
    job.from_time,
  );
  const end = pickString(
    job.end_datetime,
    job.end_time,
    job.shift_end,
    job.end_at,
    job.to_time,
  );
  if (start && end) return `${start} – ${end}`;
  return start || end || '—';
}

function formatGroupLabel(dateValue: unknown): string {
  if (!dateValue) return 'Scheduled';
  const parsed = new Date(String(dateValue));
  if (Number.isNaN(parsed.getTime())) return String(dateValue);
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function mapApiJobToShift(job: unknown): MappedShift | null {
  const row = asRecord(job);
  if (!row) return null;

  const rosterId = pickId(
    row.roster_id ?? row.rosterId ?? row.id ?? row.job_id ?? row.shift_id,
  );
  if (rosterId === undefined) return null;

  const location = asRecord(row.location);
  const site = pickString(
    row.site_name,
    row.site,
    row.location_name,
    location?.name,
    row.title,
    'Site',
  );

  const zones = pickString(
    row.site_address,
    row.zones,
    row.zone_names,
    row.location_address,
    location?.address,
  );

  const status = mapStatus(row.status ?? row.shift_status ?? row.state);
  const shiftDateRaw = pickString(
    row.shift_date,
    row.date,
    row.scheduled_date,
    row.start_date,
  );
  const siteId = pickId(row.site_id ?? row.siteId);
  const progress =
    typeof row.progress === 'number'
      ? row.progress
      : typeof row.completion_percent === 'number'
        ? row.completion_percent
        : undefined;

  return {
    site,
    id: pickString(row.reference, row.shift_code, row.code) || `#${rosterId}`,
    rosterId,
    siteId: siteId != null ? siteId : undefined,
    shiftDate: shiftDateRaw || undefined,
    time: formatTimeRange(row),
    date: shiftDateRaw ? formatGroupLabel(shiftDateRaw) : undefined,
    zones: zones || 'All Zones',
    status,
    progress,
    progressLabel:
      typeof row.progress_label === 'string'
        ? row.progress_label
        : progress !== undefined
          ? `${progress}%`
          : undefined,
  };
}

export function mapJobToIncidentContext(
  job: unknown,
): IncidentJobContext | null {
  const row = asRecord(job);
  if (!row) return null;

  const rosterId = pickId(row.roster_id ?? row.rosterId ?? row.id);
  const siteId = pickId(row.site_id ?? row.siteId);
  if (rosterId === undefined || siteId === undefined) return null;

  return {
    rosterId,
    siteId,
    siteName: pickString(row.site_name, row.site, row.title, 'Site'),
    shiftDate: pickString(row.shift_date, row.date, row.scheduled_date),
    siteAddress: pickString(row.site_address, row.zones) || undefined,
  };
}

export function findIncidentContextByRoster(
  jobs: unknown[],
  rosterId: string | number,
): IncidentJobContext | null {
  for (const job of jobs) {
    const row = asRecord(job);
    if (!row) continue;
    const rid = row.roster_id ?? row.rosterId ?? row.id;
    if (rid != null && String(rid) === String(rosterId)) {
      return mapJobToIncidentContext(job);
    }
  }
  return null;
}

export function groupShiftsByDate(jobs: unknown[]): ShiftGroup[] {
  const groups = new Map<string, MappedShift[]>();

  for (const job of jobs) {
    const shift = mapApiJobToShift(job);
    if (!shift) continue;
    const row = asRecord(job)!;
    const label = formatGroupLabel(
      row.date ?? row.shift_date ?? row.scheduled_date ?? row.start_date,
    );
    const list = groups.get(label) ?? [];
    list.push(shift);
    groups.set(label, list);
  }

  return Array.from(groups.entries()).map(([group, items]) => ({
    group,
    items,
  }));
}

export function findActiveShift(jobs: unknown[]): MappedShift | null {
  const mapped = jobs
    .map(mapApiJobToShift)
    .filter((s): s is MappedShift => Boolean(s));
  return mapped.find(s => s.status === 'active') ?? mapped[0] ?? null;
}

export interface ActiveShiftRef {
  rosterId: string | number;
  shiftId?: string;
  site?: string;
}

export function shiftMatchesActiveRef(
  shift: Pick<MappedShift, 'rosterId' | 'id'>,
  active: ActiveShiftRef,
): boolean {
  if (String(active.rosterId) === String(shift.rosterId)) return true;
  if (active.shiftId != null && String(active.shiftId) === String(shift.id)) {
    return true;
  }
  return false;
}

export function isThisShiftOngoing(
  shift: MappedShift,
  session: ActiveShiftRef | null,
): boolean {
  if (session) {
    return shiftMatchesActiveRef(shift, session);
  }
  return shift.status === 'active';
}

export function findBlockingActiveShift(
  jobs: unknown[],
  forShift: MappedShift,
  session: ActiveShiftRef | null,
): MappedShift | ActiveShiftRef | null {
  if (session && !shiftMatchesActiveRef(forShift, session)) {
    return session;
  }

  const mapped = jobs
    .map(mapApiJobToShift)
    .filter((s): s is MappedShift => Boolean(s));

  return (
    mapped.find(
      s =>
        s.status === 'active' && !shiftMatchesActiveRef(forShift, s),
    ) ?? null
  );
}
