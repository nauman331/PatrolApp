import type { ManagerPeriod } from '../../services/managerApi';

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isDateToday(dateStr: string): boolean {
  return dateStr === todayIso();
}

export function isDateThisWeek(dateStr: string): boolean {
  const reportDate = new Date(`${dateStr}T12:00:00`);
  const now = new Date();
  const weekStart = new Date(now);
  const mondayOffset = (now.getDay() + 6) % 7;
  weekStart.setDate(now.getDate() - mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return reportDate >= weekStart && reportDate <= weekEnd;
}

export type WeekPeriodFilter = 'Today' | 'This Week' | 'This Month';

export function apiPeriodForWeekFilter(filter: WeekPeriodFilter): ManagerPeriod {
  return filter === 'This Month' ? 'this_month' : 'this_week';
}

export function isFrontendWeekFilter(filter: WeekPeriodFilter): boolean {
  return filter === 'Today' || filter === 'This Week';
}
