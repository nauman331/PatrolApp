import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api-client';
import { API_URL } from '../config/env';
import { Colors } from '../theme';
import {
  extractApiErrorMessage,
  getRequestErrorMessage,
} from '../utils/apiErrors';

// ─── Shared ────────────────────────────────────────────────────────────────

export type ManagerPagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more: boolean;
};

export type ManagerPeriod = 'today' | 'this_week' | 'this_month' | 'custom';

export type ManagerGuardStatusFilter = 'all' | 'on_duty' | 'off_duty';

type ApiResult<T> = {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: ManagerPagination;
};

function isApiSuccess(body: Record<string, unknown>, httpStatus: number): boolean {
  if (body.success === true) return true;
  if (body.code === 200) return true;
  return httpStatus >= 200 && httpStatus < 300 && body.success !== false;
}

function extractData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== 'object') return null;
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (data == null) return null;
  return data as T;
}

function extractPagination(payload: unknown): ManagerPagination | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const pagination = (payload as Record<string, unknown>).pagination;
  if (!pagination || typeof pagination !== 'object') return undefined;
  return pagination as ManagerPagination;
}

async function managerGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  fallbackMessage = 'Request failed',
): Promise<ApiResult<T>> {
  const requestUrl = `${API_URL}${path}`;

  try {
    if (__DEV__) {
      console.log('[PatrolApp] GET', path, params ?? '');
    }

    const response = await apiClient.get(path, { params });
    const body = (response.data ?? {}) as Record<string, unknown>;
    const data = extractData<T>(body);
    const ok = isApiSuccess(body, response.status) && data != null;

    return {
      success: ok,
      data: data ?? undefined,
      pagination: extractPagination(body),
      message: extractApiErrorMessage(
        body,
        ok ? undefined : fallbackMessage,
        { statusCode: response.status },
      ),
    };
  } catch (error: unknown) {
    if (__DEV__) {
      console.warn('[PatrolApp] GET failed:', path, error);
    }
    return {
      success: false,
      message: getRequestErrorMessage(error, fallbackMessage, requestUrl),
    };
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export type ManagerUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  security_license_no: string;
  user_type: string;
  status: string;
};

export type ManagerLoginResult = {
  success: boolean;
  message?: string;
  token?: string;
  managerId?: string;
  data?: ManagerUser;
};

function extractToken(payload: Record<string, unknown>): string | undefined {
  if (typeof payload.token === 'string') return payload.token;
  const data = payload.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const nested = data as Record<string, unknown>;
    if (typeof nested.token === 'string') return nested.token;
    if (typeof nested.access_token === 'string') return nested.access_token;
  }
  return undefined;
}

function extractManagerUser(payload: Record<string, unknown>): ManagerUser | undefined {
  const data = payload.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const user = data as Record<string, unknown>;
    if (user.id != null && typeof user.name === 'string') {
      return data as ManagerUser;
    }
  }
  return undefined;
}

export async function loginManager(
  email: string,
  password: string,
): Promise<ManagerLoginResult> {
  try {
    const response = await apiClient.post('/manager/login', {
      email: email.trim(),
      password,
    });
    const body = (response.data ?? {}) as Record<string, unknown>;
    const token = extractToken(body);
    const user = extractManagerUser(body);
    const managerId = user?.id != null ? String(user.id) : undefined;
    const ok = Boolean(token) || isApiSuccess(body, response.status);

    if (token) {
      await AsyncStorage.setItem('authToken', token);
    }
    if (managerId) {
      await AsyncStorage.setItem('guardId', managerId);
    }

    return {
      success: ok,
      message: extractApiErrorMessage(
        body,
        ok
          ? 'Signed in successfully.'
          : 'Invalid email or password. Please check your credentials and try again.',
        { statusCode: response.status },
      ),
      token,
      managerId,
      data: user,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: getRequestErrorMessage(
        error,
        'Unable to sign in right now. Please try again.',
      ),
    };
  }
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export type ManagerDashboardInfo = {
  role: string;
  name: string;
  date_label: string;
};

export type ManagerDashboardStatistics = {
  guards_on_duty: { count: number };
  patrols_today: { count: number };
  open_incidents: { count: number };
  active_sites: { count: number };
};

export type ManagerMissedPatrolAlert = {
  guard_name: string;
  location: string;
  time: string;
  status: string;
};

export type ManagerRecentIncident = {
  id: number;
  title: string;
  location: string;
  time: string;
  severity: string;
};

export type ManagerActiveGuard = {
  id: number;
  name: string;
  initials: string;
  site_name: string;
  status_text: string;
  status: string;
  status_color: string;
};

export type ManagerDashboardData = {
  manager_info: ManagerDashboardInfo;
  statistics: ManagerDashboardStatistics;
  missed_patrol_alerts: ManagerMissedPatrolAlert[];
  recent_incidents: ManagerRecentIncident[];
  active_guards: ManagerActiveGuard[];
};

export type ManagerDashboardResult = ApiResult<ManagerDashboardData>;

export async function getManagerDashboard(): Promise<ManagerDashboardResult> {
  return managerGet<ManagerDashboardData>(
    '/manager/dashboard',
    undefined,
    'Failed to load dashboard',
  );
}

// ─── Guards ──────────────────────────────────────────────────────────────────

export type ManagerGuardListItem = {
  id: number;
  roster_id: number;
  name: string;
  initials: string;
  site_name: string;
  shift_time: string;
  shift_start: string;
  shift_end: string;
  status: string;
  status_label: string;
  status_color: string;
};

export type ManagerGuardsSummary = {
  on_duty: number;
  off_duty: number;
  total: number;
};

export type ManagerGuardsListData = {
  summary: ManagerGuardsSummary;
  guards: ManagerGuardListItem[];
};

export type GetManagerGuardsParams = {
  search?: string;
  status?: ManagerGuardStatusFilter;
  page?: number;
  per_page?: number;
};

export async function getManagerGuards(
  params: GetManagerGuardsParams = {},
): Promise<ApiResult<ManagerGuardsListData>> {
  const query: Record<string, string | number | undefined> = {
    page: params.page ?? 1,
    per_page: params.per_page ?? 10,
  };
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.status && params.status !== 'all') query.status = params.status;

  return managerGet<ManagerGuardsListData>(
    '/manager/guards',
    query,
    'Failed to load guards',
  );
}

// ─── Guard Detail ────────────────────────────────────────────────────────────

export type ManagerGuardProfile = {
  id: number;
  name: string;
  initials: string;
  phone: string;
  email: string;
  security_license_no: string;
};

export type ManagerTodayShift = {
  roster_id: number;
  site_name: string;
  site_address: string;
  shift_time: string;
  shift_start: string;
  shift_end: string;
  shift_date: string;
  status: string;
  status_label: string;
  status_color: string;
  roster_status: string;
};

export type ManagerGuardAttendanceToday = {
  signin_time: string | null;
  signout_time: string | null;
  signin_location: string | null;
  signout_location: string | null;
  signin_selfie: string | null;
  signout_selfie: string | null;
  last_location: string | null;
  last_location_time: string | null;
};

export type ManagerGuardStats = {
  patrols_total: number;
  patrols_completed: number;
  incidents_today: number;
  nfc_scans_completed: number;
  nfc_scans_total: number;
};

export type ManagerGuardPatrol = {
  id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  scanners_completed: number;
  scanners_total: number;
};

export type ManagerGuardIncident = {
  id: number;
  title: string;
  location: string;
  time: string;
  severity: string;
};

export type ManagerGuardDetailData = {
  guard: ManagerGuardProfile;
  today_shift: ManagerTodayShift | null;
  attendance: ManagerGuardAttendanceToday | null;
  stats: ManagerGuardStats;
  patrols: ManagerGuardPatrol[];
  incidents: ManagerGuardIncident[];
};

export async function getManagerGuardDetail(
  guardId: number | string,
  rosterId?: number,
): Promise<ApiResult<ManagerGuardDetailData>> {
  const params: Record<string, string | number | undefined> = {};
  if (rosterId != null) params.roster_id = rosterId;

  return managerGet<ManagerGuardDetailData>(
    `/manager/guards/${guardId}`,
    params,
    'Failed to load guard details',
  );
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export type ManagerAttendanceRecord = {
  roster_id: number;
  date: string;
  date_label: string;
  site_name: string;
  shift_time: string;
  shift_start: string;
  shift_end: string;
  checkin_time: string | null;
  checkout_time: string | null;
  status: string;
  status_label: string;
  status_color: string;
};

export type ManagerAttendanceSummary = {
  present: number;
  late: number;
  absent: number;
};

export type ManagerAttendanceData = {
  guard: { id: number; name: string; initials: string };
  month: number;
  year: number;
  month_label: string;
  summary: ManagerAttendanceSummary;
  records: ManagerAttendanceRecord[];
};

export async function getManagerGuardAttendance(
  guardId: number | string,
  month?: number,
  year?: number,
): Promise<ApiResult<ManagerAttendanceData>> {
  const params: Record<string, string | number | undefined> = {};
  if (month != null) params.month = month;
  if (year != null) params.year = year;

  return managerGet<ManagerAttendanceData>(
    `/manager/guards/${guardId}/attendance`,
    params,
    'Failed to load attendance',
  );
}

// ─── Reports — Patrol ────────────────────────────────────────────────────────

export type ManagerPatrolReportItem = {
  guard_id: number;
  site_id: number;
  date: string;
  guard_name: string;
  site_name: string;
  date_label: string;
  location_date: string;
  patrols_count: number;
  completed_count: number;
  compliance_percentage: number;
  summary_text: string;
};

export type ManagerPatrolReportsData = {
  period: string;
  start_date: string;
  end_date: string;
  reports: ManagerPatrolReportItem[];
};

export type GetManagerPatrolReportsParams = {
  period?: ManagerPeriod;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
};

export async function getManagerPatrolReports(
  params: GetManagerPatrolReportsParams = {},
): Promise<ApiResult<ManagerPatrolReportsData>> {
  const query: Record<string, string | number | undefined> = {
    period: params.period ?? 'today',
    page: params.page ?? 1,
    per_page: params.per_page ?? 10,
  };
  if (params.start_date) query.start_date = params.start_date;
  if (params.end_date) query.end_date = params.end_date;
  if (params.search?.trim()) query.search = params.search.trim();

  return managerGet<ManagerPatrolReportsData>(
    '/manager/reports/patrols',
    query,
    'Failed to load patrol reports',
  );
}

export type ManagerPatrolScanner = {
  id: number;
  name: string;
  status: string;
  scan_at: string | null;
  coordinates: string | null;
};

export type ManagerPatrolDetailItem = {
  id: number;
  roster_id: number;
  status: string;
  coordinates: string | null;
  started_at: string;
  completed_at: string | null;
  scanner_count: number;
  scanners_completed: number;
  scanners_total: number;
  compliance_percentage: number;
  scanners: ManagerPatrolScanner[];
};

export type ManagerPatrolReportDetailData = {
  guard: { id: number; name: string; phone: string };
  site: { id: number; name: string; address: string };
  date: string;
  date_label: string;
  summary: {
    patrols_count: number;
    completed_count: number;
    compliance_percentage: number;
    nfc_scans_completed: number;
    nfc_scans_total: number;
  };
  patrols: ManagerPatrolDetailItem[];
};

export async function getManagerPatrolReportDetail(
  guardId: number,
  siteId: number,
  date: string,
): Promise<ApiResult<ManagerPatrolReportDetailData>> {
  return managerGet<ManagerPatrolReportDetailData>(
    '/manager/reports/patrols/detail',
    { guard_id: guardId, site_id: siteId, date },
    'Failed to load patrol report',
  );
}

export type ManagerSinglePatrolData = {
  guard: { id: number; name: string; phone: string };
  site: { id: number; name: string; address: string };
  patrol: ManagerPatrolDetailItem;
};

export async function getManagerSinglePatrol(
  patrolId: number | string,
): Promise<ApiResult<ManagerSinglePatrolData>> {
  return managerGet<ManagerSinglePatrolData>(
    `/manager/reports/patrols/${patrolId}`,
    undefined,
    'Failed to load patrol',
  );
}

// ─── Reports — Incidents ─────────────────────────────────────────────────────

export type ManagerIncidentReportItem = {
  id: number;
  guard_id: number;
  guard_name: string;
  site_name: string;
  date: string;
  date_label: string;
  location_date: string;
  title: string;
  time: string;
  severity: string;
  summary_text: string;
};

export type ManagerIncidentReportsData = {
  period: string;
  start_date: string;
  end_date: string;
  reports: ManagerIncidentReportItem[];
};

export type GetManagerIncidentReportsParams = {
  period?: ManagerPeriod;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
};

export async function getManagerIncidentReports(
  params: GetManagerIncidentReportsParams = {},
): Promise<ApiResult<ManagerIncidentReportsData>> {
  const query: Record<string, string | number | undefined> = {
    period: params.period ?? 'today',
    page: params.page ?? 1,
    per_page: params.per_page ?? 10,
  };
  if (params.start_date) query.start_date = params.start_date;
  if (params.end_date) query.end_date = params.end_date;
  if (params.search?.trim()) query.search = params.search.trim();

  return managerGet<ManagerIncidentReportsData>(
    '/manager/reports/incidents',
    query,
    'Failed to load incident reports',
  );
}

export type ManagerIncidentPhoto = {
  url: string;
  timestamp: string;
};

export type ManagerIncidentDetailData = {
  id: number;
  guard_id: number;
  guard_name: string;
  guard_phone: string;
  site_name: string;
  date: string;
  date_label: string;
  location_date: string;
  title: string;
  time: string;
  severity: string;
  summary_text: string;
  roster_id: number;
  job_id: number;
  injury_type: string;
  injury_detail: string;
  incident_date: string;
  incident_time: string;
  people_involved: unknown[];
  vehicle: unknown[];
  emergency_services: unknown[];
  witness: unknown[];
  photos: ManagerIncidentPhoto[];
  signature: string | null;
  created_at: string;
};

export async function getManagerIncidentDetail(
  incidentId: number | string,
): Promise<ApiResult<ManagerIncidentDetailData>> {
  return managerGet<ManagerIncidentDetailData>(
    `/manager/reports/incidents/${incidentId}`,
    undefined,
    'Failed to load incident',
  );
}

// ─── Roster ──────────────────────────────────────────────────────────────────

export type ManagerShiftAssignment = {
  roster_id: number;
  guard_id: number;
  guard_name: string;
  site_id: number;
  site_name: string;
  date: string;
  date_label: string;
  shift_time: string;
  shift_start: string;
  shift_end: string;
  zone: string;
  status: string;
};

export type ManagerRosterShiftsData = {
  period: string;
  period_label: string;
  start_date: string;
  end_date: string;
  assignments: ManagerShiftAssignment[];
};

export type GetManagerRosterShiftsParams = {
  period?: ManagerPeriod;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
};

export async function getManagerRosterShifts(
  params: GetManagerRosterShiftsParams = {},
): Promise<ApiResult<ManagerRosterShiftsData>> {
  const query: Record<string, string | number | undefined> = {
    period: params.period ?? 'this_week',
    page: params.page ?? 1,
    per_page: params.per_page ?? 20,
  };
  if (params.start_date) query.start_date = params.start_date;
  if (params.end_date) query.end_date = params.end_date;
  if (params.search?.trim()) query.search = params.search.trim();

  return managerGet<ManagerRosterShiftsData>(
    '/manager/roster/shifts',
    query,
    'Failed to load shifts',
  );
}

export type ManagerSiteAssignment = {
  site_id: number;
  site_name: string;
  site_address: string;
  guards_count: number;
  guards_label: string;
  shifts_per_day: number;
  shifts_label: string;
  lead_guard_id: number;
  lead_name: string;
  lead_label: string;
  total_shifts: number;
};

export type ManagerRosterSitesData = {
  period: string;
  period_label: string;
  start_date: string;
  end_date: string;
  total_sites: number;
  sites_label: string;
  sites: ManagerSiteAssignment[];
};

export type GetManagerRosterSitesParams = {
  period?: ManagerPeriod;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
};

export async function getManagerRosterSites(
  params: GetManagerRosterSitesParams = {},
): Promise<ApiResult<ManagerRosterSitesData>> {
  const query: Record<string, string | number | undefined> = {
    period: params.period ?? 'this_week',
    page: params.page ?? 1,
    per_page: params.per_page ?? 20,
  };
  if (params.start_date) query.start_date = params.start_date;
  if (params.end_date) query.end_date = params.end_date;
  if (params.search?.trim()) query.search = params.search.trim();

  return managerGet<ManagerRosterSitesData>(
    '/manager/roster/sites',
    query,
    'Failed to load sites',
  );
}

export type ManagerCalendarEvent = {
  roster_id: number;
  guard_id: number;
  guard_name: string;
  site_id: number;
  site_name: string;
  date: string;
  date_label: string;
  shift_time: string;
  shift_start: string;
  shift_end: string;
  zone: string;
  status: string;
  title: string;
  day: number;
};

export type ManagerRosterCalendarData = {
  month: number;
  year: number;
  month_label: string;
  dates_with_shifts: string[];
  total_events: number;
  events: ManagerCalendarEvent[];
};

export async function getManagerRosterCalendar(
  month?: number,
  year?: number,
  siteId?: number,
): Promise<ApiResult<ManagerRosterCalendarData>> {
  const params: Record<string, string | number | undefined> = {};
  if (month != null) params.month = month;
  if (year != null) params.year = year;
  if (siteId != null) params.site_id = siteId;

  return managerGet<ManagerRosterCalendarData>(
    '/manager/roster/calendar',
    params,
    'Failed to load calendar',
  );
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export function mapManagerStatusColor(statusColor: string): string {
  switch (statusColor) {
    case 'green':
      return Colors.success;
    case 'orange':
      return Colors.warning;
    case 'red':
      return Colors.danger;
    case 'grey':
    case 'gray':
      return Colors.textMuted;
    case 'yellow':
      return Colors.warning;
    default:
      return Colors.textMuted;
  }
}

export function mapSeverityColor(severity: string): string {
  switch (severity.toLowerCase()) {
    case 'high':
      return Colors.danger;
    case 'medium':
      return Colors.warning;
    case 'low':
      return Colors.success;
    default:
      return Colors.textMuted;
  }
}

export const MANAGER_DATE_FILTER_TO_PERIOD: Record<string, ManagerPeriod> = {
  Today: 'today',
  'This Week': 'this_week',
  'This Month': 'this_month',
  Custom: 'custom',
};

export const MANAGER_GUARD_FILTERS: { label: string; value: ManagerGuardStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'On Duty', value: 'on_duty' },
  { label: 'Off Duty', value: 'off_duty' },
];

export const guardAvatarPalette = [
  { bg: Colors.warningLight, color: Colors.warning },
  { bg: Colors.accentLight, color: Colors.accent },
  { bg: Colors.dangerLight, color: Colors.danger },
  { bg: Colors.successLight, color: Colors.success },
  { bg: Colors.infoLight, color: Colors.info },
];
