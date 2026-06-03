import * as XLSX from 'xlsx';

export interface ShiftRow {
  id: number;
  title?: string;
  shift_date?: string;
  site_name?: string;
  guard_name?: string;
  guard_phone?: string;
  staff_name?: string;
  staff_phone?: string;
  start?: string;
  start_datetime?: string | null;
  end?: string;
  end_datetime?: string | null;
  state?: string;
  site_id?: number;
}

function formatTime(val?: string | null): string {
  if (!val) return '—';
  // If it's a full datetime, extract time portion
  if (val.includes('T')) return val.split('T')[1]?.slice(0, 5) ?? val;
  return val;
}

function formatDate(val?: string | null): string {
  if (!val) return '—';
  if (val.length >= 10) return val.slice(0, 10);
  return val;
}

export function exportShiftsToExcel(rows: ShiftRow[], filename = 'Shifts_Export') {
  const data = rows.map((r, i) => ({
    '#': i + 1,
    'Shift ID': r.id,
    'Title': r.title ?? '—',
    'Date': formatDate(r.shift_date ?? r.state ?? r.start_datetime),
    'Site': r.site_name ?? '—',
    'Guard Name': r.guard_name ?? r.staff_name ?? '—',
    'Guard Phone': r.guard_phone ?? r.staff_phone ?? '—',
    'Start Time': formatTime(r.start ?? r.start_datetime),
    'End Time': formatTime(r.end ?? r.end_datetime),
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  // Column widths
  ws['!cols'] = [
    { wch: 5 },  // #
    { wch: 10 }, // Shift ID
    { wch: 22 }, // Title
    { wch: 14 }, // Date
    { wch: 22 }, // Site
    { wch: 22 }, // Guard Name
    { wch: 18 }, // Guard Phone
    { wch: 12 }, // Start Time
    { wch: 12 }, // End Time
  ];

  // Style header row bold (basic xlsx styling via !merges not supported without xlsx-style,
  // but we can freeze the top row for usability)
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Shifts');

  // Summary sheet
  const siteCounts: Record<string, number> = {};
  rows.forEach(r => {
    const site = r.site_name ?? 'Unknown';
    siteCounts[site] = (siteCounts[site] ?? 0) + 1;
  });

  const summary = [
    { 'Metric': 'Total Shifts', 'Value': rows.length },
    { 'Metric': 'Export Date', 'Value': new Date().toLocaleDateString() },
    { 'Metric': '', 'Value': '' },
    { 'Metric': 'Shifts by Site', 'Value': '' },
    ...Object.entries(siteCounts).map(([site, count]) => ({ 'Metric': site, 'Value': count })),
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summary);
  wsSummary['!cols'] = [{ wch: 28 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  const ts = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${ts}.xlsx`);
}

export function exportRosterToExcel(rows: ShiftRow[], dateLabel = '', filename = 'Roster_Export') {
  const data = rows.map((r, i) => ({
    '#': i + 1,
    'Shift ID': r.id,
    'Title': r.title ?? '—',
    'Date': formatDate(r.shift_date ?? r.state ?? r.start_datetime),
    'Site': r.site_name ?? '—',
    'Guard / Staff': r.guard_name ?? r.staff_name ?? '—',
    'Phone': r.guard_phone ?? r.staff_phone ?? '—',
    'Start': formatTime(r.start ?? r.start_datetime),
    'End': formatTime(r.end ?? r.end_datetime),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 }, { wch: 10 }, { wch: 22 }, { wch: 14 },
    { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
  ];
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  const wb = XLSX.utils.book_new();
  const sheetName = dateLabel ? `Roster ${dateLabel}` : 'Roster';
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

  const ts = new Date().toISOString().slice(0, 10);
  const label = dateLabel ? `_${dateLabel}` : '';
  XLSX.writeFile(wb, `${filename}${label}_${ts}.xlsx`);
}