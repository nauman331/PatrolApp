import type { PatrollingReport, PatrolScanner } from './guardApi';
import { formatNfcUid } from './nfcReader';

export function normalizeNfcCompare(value: string): string {
  return formatNfcUid(value).replace(/[^A-F0-9]/g, '').toUpperCase();
}

export function isScannerComplete(scanner: PatrolScanner): boolean {
  const status = String(scanner.status ?? '').toLowerCase();
  return ['complete', 'completed', 'done', 'scanned'].includes(status);
}

export function getCompletedCount(report: PatrollingReport): number {
  return report.scanners?.filter(isScannerComplete).length ?? 0;
}

const INACTIVE_PATROL_STATUSES = new Set([
  'complete',
  'completed',
  'done',
  'ended',
  'end',
  'finished',
  'finish',
  'closed',
]);

const ACTIVE_PATROL_STATUSES = new Set([
  'start',
  'started',
  'active',
  'in_progress',
  'in progress',
  'ongoing',
]);

export function isPatrolReportActive(report: PatrollingReport): boolean {
  if (report.completed_at) return false;

  const status = String(report.status ?? '').toLowerCase().trim();
  if (INACTIVE_PATROL_STATUSES.has(status)) return false;

  const total = report.scanners?.length ?? report.scanner_count ?? 0;
  if (total > 0 && getCompletedCount(report) >= total) {
    return false;
  }

  return ACTIVE_PATROL_STATUSES.has(status);
}

export function findActiveReportForRoster(
  reports: PatrollingReport[],
  rosterId?: string | number,
): PatrollingReport | null {
  if (rosterId == null) return null;

  return reports
    .filter(
      r =>
        String(r.roster_id) === String(rosterId) && isPatrolReportActive(r),
    )
    .sort((a, b) => Number(b.id) - Number(a.id))[0] ?? null;
}

export function getNextScanner(report: PatrollingReport | null): PatrolScanner | null {
  if (!report?.scanners?.length) return null;
  return report.scanners.find(s => !isScannerComplete(s)) ?? null;
}

export function findScannedGateName(
  report: PatrollingReport,
  nfcUid: string,
): string | null {
  const normalized = normalizeNfcCompare(nfcUid);
  const match = report.scanners?.find(
    s => normalizeNfcCompare(s.value) === normalized,
  );
  return match?.name ?? null;
}

export function findMatchingScanner(
  report: PatrollingReport | null,
  nfcUid: string,
): PatrolScanner | null {
  if (!report?.scanners?.length) return null;
  const normalized = normalizeNfcCompare(nfcUid);
  return (
    report.scanners.find(s => normalizeNfcCompare(s.value) === normalized) ??
    null
  );
}

export function buildUidVariants(uid: string): string[] {
  const formatted = formatNfcUid(uid);
  const parts = formatted.split(':').filter(Boolean);
  const reversed = [...parts].reverse().join(':');
  const plain = parts.join('');
  const candidates = [
    uid.trim(),
    formatted,
    formatted.toLowerCase(),
    reversed,
    reversed.toLowerCase(),
    plain,
    plain.toLowerCase(),
  ];
  return [...new Set(candidates.filter(Boolean))];
}
