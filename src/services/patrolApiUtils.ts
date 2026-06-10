import type { PatrollingReport, PatrolScanner } from './guardApi';

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeScanner(raw: unknown): PatrolScanner | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = toNumber(row.id, NaN);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    patrolling_report_id: toNumber(row.patrolling_report_id),
    name: String(row.name ?? 'Checkpoint'),
    value: String(row.value ?? ''),
    status: String(row.status ?? 'incomplete'),
    scan_at:
      row.scan_at == null || row.scan_at === ''
        ? null
        : String(row.scan_at),
    coordinates:
      row.coordinates == null || row.coordinates === ''
        ? null
        : String(row.coordinates),
    created_at:
      typeof row.created_at === 'string' ? row.created_at : undefined,
    updated_at:
      typeof row.updated_at === 'string' ? row.updated_at : undefined,
  };
}

export function normalizePatrollingReport(
  raw: unknown,
): PatrollingReport | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const id = toNumber(row.id, NaN);
  if (!Number.isFinite(id)) return null;

  const scanners = Array.isArray(row.scanners)
    ? row.scanners
        .map(normalizeScanner)
        .filter((s): s is PatrolScanner => Boolean(s))
    : [];

  return {
    id,
    site_id: (row.site_id ?? '') as string | number,
    roster_id: (row.roster_id ?? '') as string | number,
    guard_id: (row.guard_id ?? '') as string | number,
    coordinates: String(row.coordinates ?? ''),
    scanner_count: toNumber(row.scanner_count, scanners.length),
    status: String(row.status ?? 'start'),
    started_at: String(row.started_at ?? ''),
    completed_at:
      row.completed_at == null || row.completed_at === ''
        ? null
        : String(row.completed_at),
    created_at:
      typeof row.created_at === 'string' ? row.created_at : undefined,
    updated_at:
      typeof row.updated_at === 'string' ? row.updated_at : undefined,
    scanners,
  };
}

export function normalizePatrollingReports(raw: unknown): PatrollingReport[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizePatrollingReport)
    .filter((r): r is PatrollingReport => Boolean(r));
}
