export type ShiftStatus = 'active' | 'upcoming' | 'done' | 'timeout';

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
  sortTimestamp: number;
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

function normalizeStatusValue(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const statusByCode: Record<number, ShiftStatus> = {
      0: 'upcoming',
      1: 'active',
      2: 'done',
      3: 'timeout',
      4: 'timeout',
    };
    return statusByCode[raw] ?? String(raw);
  }
  if (typeof raw === 'boolean') return raw ? 'active' : 'upcoming';
  return String(raw).trim().toLowerCase().replace(/\s+/g, '_');
}

function mapStatus(raw: unknown): ShiftStatus {
  const s = normalizeStatusValue(raw);
  if (
    [
      'active',
      'in_progress',
      'in-progress',
      'ongoing',
      'checked_in',
      'checked-in',
      'started',
      'running',
    ].includes(s)
  ) {
    return 'active';
  }
  if (
    [
      'timeout',
      'timed_out',
      'timed-out',
      'time_out',
      'time-out',
      'missed',
      'expired',
      'no_show',
      'no-show',
      'not_checked_in',
      'not-checked-in',
      'past',
      'overdue',
      'late',
      'absent',
    ].includes(s)
  ) {
    return 'timeout';
  }
  if (
    ['done', 'completed', 'finished', 'closed', 'complete', 'ended'].includes(s)
  ) {
    return 'done';
  }
  if (
    ['scheduled', 'upcoming', 'pending', 'assigned', 'open', 'new'].includes(s)
  ) {
    return 'upcoming';
  }
  return 'upcoming';
}

function pickStatus(row: Record<string, unknown>): ShiftStatus {
  const roster = asRecord(row.roster);
  const shift = asRecord(row.shift);
  const apiStatus = mapStatus(
    row.status ??
      row.shift_status ??
      row.state ??
      row.roster_status ??
      row.job_status ??
      row.duty_status ??
      row.attendance_status ??
      roster?.status ??
      shift?.status,
  );
  return resolveShiftStatus(row, apiStatus);
}

function parseFlexibleDate(value: unknown): number | null {
  const str = pickString(value);
  if (!str) return null;

  const direct = new Date(str.includes('T') ? str : str.replace(' ', 'T'));
  if (!Number.isNaN(direct.getTime())) return direct.getTime();

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const endOfDay = new Date(`${str}T23:59:59`);
    if (!Number.isNaN(endOfDay.getTime())) return endOfDay.getTime();
  }

  return null;
}

function combineDateAndTime(dateStr: string, timeStr: string): number | null {
  const dateOnly = dateStr.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;

  const trimmedTime = timeStr.trim();
  const clockMatch = trimmedTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (clockMatch) {
    const iso = `${dateOnly}T${clockMatch[1].padStart(2, '0')}:${clockMatch[2]}:${clockMatch[3] ?? '00'}`;
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }

  const embedded = parseFlexibleDate(trimmedTime);
  if (embedded != null) return embedded;

  return parseFlexibleDate(`${dateOnly}T23:59:59`);
}

function getShiftDateRaw(row: Record<string, unknown>): string {
  return pickString(
    row.shift_date,
    row.date,
    row.scheduled_date,
    row.start_date,
  );
}

function getShiftEndTimestamp(row: Record<string, unknown>): number | null {
  const endDatetime = parseFlexibleDate(
    row.end_datetime ?? row.end_at ?? row.shift_end_datetime,
  );
  if (endDatetime != null) return endDatetime;

  const shiftDate = getShiftDateRaw(row);
  const endTime = pickString(
    row.end_time,
    row.shift_end,
    row.to_time,
    row.endTime,
  );

  if (shiftDate && endTime) {
    return combineDateAndTime(shiftDate, endTime);
  }

  if (shiftDate) {
    return parseFlexibleDate(`${shiftDate}T23:59:59`);
  }

  return null;
}

function hasTruthyCheckField(row: Record<string, unknown>, keys: string[]): boolean {
  for (const key of keys) {
    const value = row[key];
    if (value === true || value === 1 || value === '1') return true;
    if (typeof value === 'string' && value.trim()) return true;
  }
  return false;
}

function resolveShiftStatus(
  row: Record<string, unknown>,
  apiStatus: ShiftStatus,
): ShiftStatus {
  if (
    hasTruthyCheckField(row, [
      'checked_out_at',
      'checkout_time',
      'check_out_time',
      'sign_out_time',
      'checked_out',
      'is_checked_out',
    ])
  ) {
    return 'done';
  }

  if (
    hasTruthyCheckField(row, [
      'checked_in_at',
      'checkin_time',
      'check_in_time',
      'sign_in_time',
      'checked_in',
      'is_checked_in',
    ])
  ) {
    return apiStatus === 'done' ? 'done' : 'active';
  }

  const progress =
    typeof row.progress === 'number'
      ? row.progress
      : typeof row.completion_percent === 'number'
        ? row.completion_percent
        : null;
  if (progress != null && progress >= 100) {
    return 'done';
  }

  if (apiStatus === 'done' || apiStatus === 'timeout') {
    return apiStatus;
  }

  const now = Date.now();
  const endTs = getShiftEndTimestamp(row);

  if (apiStatus === 'active') {
    if (endTs != null && endTs < now) {
      return 'timeout';
    }
    return 'active';
  }

  if (endTs != null && endTs < now) {
    return 'timeout';
  }

  const shiftDate = getShiftDateRaw(row);
  const shiftDateKey = shiftDate.slice(0, 10);
  if (shiftDateKey && /^\d{4}-\d{2}-\d{2}$/.test(shiftDateKey)) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const shiftDayStart = new Date(`${shiftDateKey}T00:00:00`);
    if (
      !Number.isNaN(shiftDayStart.getTime()) &&
      shiftDayStart.getTime() < todayStart.getTime()
    ) {
      return 'timeout';
    }
  }

  return apiStatus;
}

function parseSortTimestamp(row: Record<string, unknown>): number {
  const dateStr = pickString(
    row.start_datetime,
    row.start_at,
    row.shift_date,
    row.date,
    row.scheduled_date,
    row.start_date,
    row.end_datetime,
    row.end_at,
  );
  if (!dateStr) return 0;
  const normalized = dateStr.trim().replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
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
  if (dateValue == null || !String(dateValue).trim()) {
    return 'Scheduled';
  }
  return formatFullDisplayDate(dateValue);
}

export function formatFullDisplayDate(dateValue?: unknown): string {
  if (dateValue != null && String(dateValue).trim()) {
    const normalized = String(dateValue).trim().replace(' ', 'T');
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return String(dateValue);
  }

  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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

  const status = pickStatus(row);
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
    sortTimestamp: parseSortTimestamp(row),
    progress,
    progressLabel:
      typeof row.progress_label === 'string'
        ? row.progress_label
        : progress !== undefined
          ? `${progress}%`
          : undefined,
  };
}

export function sortShiftsLatestFirst(shifts: MappedShift[]): MappedShift[] {
  return [...shifts].sort((a, b) => b.sortTimestamp - a.sortTimestamp);
}

export function mapAndSortShifts(jobs: unknown[]): MappedShift[] {
  const mapped = jobs
    .map(mapApiJobToShift)
    .filter((shift): shift is MappedShift => Boolean(shift));
  return sortShiftsLatestFirst(mapped);
}

export type ShiftListFilter =
  | 'All'
  | 'Active'
  | 'Upcoming'
  | 'Completed'
  | 'Timed Out';

export function filterShiftsByStatus(
  shifts: MappedShift[],
  filter: ShiftListFilter,
): MappedShift[] {
  if (filter === 'All') return shifts;
  if (filter === 'Active') return shifts.filter(s => s.status === 'active');
  if (filter === 'Upcoming') return shifts.filter(s => s.status === 'upcoming');
  if (filter === 'Completed') return shifts.filter(s => s.status === 'done');
  if (filter === 'Timed Out') return shifts.filter(s => s.status === 'timeout');
  return shifts;
}

export function groupShiftsList(shifts: MappedShift[]): ShiftGroup[] {
  const groups = new Map<string, MappedShift[]>();

  for (const shift of shifts) {
    const label = shift.date ?? 'Scheduled';
    const list = groups.get(label) ?? [];
    list.push(shift);
    groups.set(label, list);
  }

  return Array.from(groups.entries())
    .map(([group, items]) => ({
      group,
      items: sortShiftsLatestFirst(items),
      latestTimestamp: Math.max(...items.map(item => item.sortTimestamp)),
    }))
    .sort((a, b) => b.latestTimestamp - a.latestTimestamp)
    .map(({ group, items }) => ({ group, items }));
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
  return groupShiftsList(mapAndSortShifts(jobs));
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
