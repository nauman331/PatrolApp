import apiClient from './api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizePatrollingReport, normalizePatrollingReports } from './patrolApiUtils';

export type GuardApiResult<T = void> = {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  otp?: number;
  guardId?: string;
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

function extractMessage(payload: unknown, fallback: string): string {
  if (!payload) return fallback;
  if (typeof payload === 'string' && payload.trim()) return payload.trim();
  if (typeof payload !== 'object') return fallback;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.msg === 'string' && obj.msg.trim()) return obj.msg.trim();
  if (typeof obj.message === 'string' && obj.message.trim()) {
    return obj.message.trim();
  }
  if (typeof obj.error === 'string' && obj.error.trim()) return obj.error.trim();
  if (obj.error && typeof obj.error === 'object' && !Array.isArray(obj.error)) {
    const nested = obj.error as Record<string, unknown>;
    if (typeof nested.message === 'string' && nested.message.trim()) {
      return nested.message.trim();
    }
  }
  return fallback;
}

function toNumberId(value: string | number | undefined | null): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function isWeekGroupEntry(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  const hasRoster =
    row.roster_id != null ||
    row.rosterId != null ||
    row.job_id != null ||
    row.shift_id != null;
  if (hasRoster) return false;
  return (
    Array.isArray(row.shifts) ||
    Array.isArray(row.jobs) ||
    row.week != null ||
    row.week_label != null ||
    row.weekLabel != null ||
    row.week_start != null ||
    row.weekStart != null
  );
}

function flattenWeekJobs(items: unknown[]): unknown[] {
  const flat: unknown[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    if (Array.isArray(row.shifts)) {
      flat.push(...row.shifts);
      continue;
    }
    if (Array.isArray(row.jobs)) {
      flat.push(...row.jobs);
      continue;
    }
    flat.push(item);
  }
  return flat;
}

function extractJobsList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return isWeekGroupEntry(payload[0]) ? flattenWeekJobs(payload) : payload;
  }
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.weeks)) return flattenWeekJobs(obj.weeks);
  if (Array.isArray(obj.data)) {
    return isWeekGroupEntry(obj.data[0])
      ? flattenWeekJobs(obj.data)
      : obj.data;
  }
  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    const nested = obj.data as Record<string, unknown>;
    if (Array.isArray(nested.weeks)) return flattenWeekJobs(nested.weeks);
    if (Array.isArray(nested.jobs)) return nested.jobs;
    if (Array.isArray(nested.data)) {
      return isWeekGroupEntry(nested.data[0])
        ? flattenWeekJobs(nested.data)
        : nested.data;
    }
  }
  if (Array.isArray(obj.jobs)) return obj.jobs;
  return [];
}

function extractGuardId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const obj = payload as Record<string, unknown>;
  const direct = obj.guard_id ?? obj.guardId ?? obj.user_id ?? obj.userId ?? obj.id;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  if (typeof direct === 'number') return String(direct);

  const guard = obj.guard;
  if (guard && typeof guard === 'object' && !Array.isArray(guard)) {
    const guardObj = guard as Record<string, unknown>;
    const guardId = guardObj.id ?? guardObj.guard_id ?? guardObj.guardId;
    if (typeof guardId === 'string' && guardId.trim()) return guardId.trim();
    if (typeof guardId === 'number') return String(guardId);
  }

  const data = obj.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const nested = data as Record<string, unknown>;
    const nestedId =
      nested.guard_id ??
      nested.guardId ??
      nested.user_id ??
      nested.userId ??
      nested.id;
    if (typeof nestedId === 'string' && nestedId.trim()) return nestedId.trim();
    if (typeof nestedId === 'number') return String(nestedId);

    const nestedGuard = nested.guard;
    if (
      nestedGuard &&
      typeof nestedGuard === 'object' &&
      !Array.isArray(nestedGuard)
    ) {
      const nestedGuardObj = nestedGuard as Record<string, unknown>;
      const nestedGuardId =
        nestedGuardObj.id ??
        nestedGuardObj.guard_id ??
        nestedGuardObj.guardId;
      if (typeof nestedGuardId === 'string' && nestedGuardId.trim()) {
        return nestedGuardId.trim();
      }
      if (typeof nestedGuardId === 'number') return String(nestedGuardId);
    }
  }

  return undefined;
}

export async function sendGuardOtp(phone: string): Promise<GuardApiResult> {
  try {
    const response = await apiClient.post('/guard/send-otp', { phone });
    const body = response.data;
    const ok =
      body?.success === true ||
      body?.success === undefined ||
      response.status < 300;
    return {
      success: body?.success === true || ok,
      message: extractMessage(body, 'OTP sent successfully'),
      data: body,
      otp:
        typeof body?.otp === 'number'
          ? body.otp
          : body?.otp != null
            ? Number(body.otp)
            : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      message: extractMessage(
        error?.response?.data,
        error?.message || 'Failed to send OTP',
      ),
    };
  }
}

export async function verifyGuardOtp(
  phone: string,
  otp: string,
): Promise<GuardApiResult> {
  try {
    const response = await apiClient.post('/guard/verify-otp', {
      phone,
      otp,
    });
    const body = response.data ?? {};
    const token = extractToken(body);
    const guardId = extractGuardId(body);
    const ok =
      Boolean(token) ||
      body?.success === true ||
      response.status < 300;

    if (token) {
      await AsyncStorage.setItem('authToken', token);
    }
    if (guardId) {
      await AsyncStorage.setItem('guardId', guardId);
    }

    return {
      success: ok,
      message: extractMessage(body, ok ? 'Login successful' : 'Invalid OTP'),
      token,
      guardId,
      data: body?.data ?? body,
    };
  } catch (error: any) {
    return {
      success: false,
      message: extractMessage(
        error?.response?.data,
        error?.message || 'OTP verification failed',
      ),
    };
  }
}

function extractIncidentsList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.incidents)) return obj.incidents;
  if (Array.isArray(obj.data)) return obj.data;
  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    const nested = obj.data as Record<string, unknown>;
    if (Array.isArray(nested.incidents)) return nested.incidents;
  }
  return [];
}

export async function getGuardMyJobs(
  guardId?: string | number | null,
): Promise<GuardApiResult<unknown[]>> {
  try {
    const storedGuardId = await AsyncStorage.getItem('guardId');
    const resolvedGuardId =
      guardId != null && String(guardId).trim()
        ? String(guardId).trim()
        : storedGuardId?.trim() || undefined;

    const response = await apiClient.get('/guard/my-jobs', {
      params: resolvedGuardId
        ? {
            guard_id: resolvedGuardId,
            guardId: resolvedGuardId,
          }
        : undefined,
    });
    const jobs = extractJobsList(response.data);
    return { success: true, data: jobs };
  } catch (error: any) {
    return {
      success: false,
      message: extractMessage(
        error?.response?.data,
        error?.message || 'Failed to load jobs',
      ),
      data: [],
    };
  }
}

export type GuardDashboardGuard = {
  id: number;
  name: string;
  email: string;
  phone: string;
};

export type GuardDashboardTodayJob = {
  roster_id: number;
  site_name: string;
  site_address: string;
  site_id: number;
  state: string | null;
  start_datetime: string;
  end_datetime: string;
  shift_date: string;
  day_of_week: string;
  status: string;
};

export type GuardDashboardData = {
  patrolling_report_count: number;
  incident_report_count: number;
  scanners_count: number;
  scan_nfc_count: number;
  guard: GuardDashboardGuard;
  today_jobs: GuardDashboardTodayJob[];
};

function extractTodayJobs(raw: Record<string, unknown>): GuardDashboardTodayJob[] {
  const jobs = raw.today_jobs;
  if (!Array.isArray(jobs)) return [];

  return jobs
    .filter(
      (job): job is Record<string, unknown> =>
        Boolean(job && typeof job === 'object' && !Array.isArray(job)),
    )
    .map(job => ({
      roster_id: Number(job.roster_id) || 0,
      site_name: typeof job.site_name === 'string' ? job.site_name : '',
      site_address: typeof job.site_address === 'string' ? job.site_address : '',
      site_id: Number(job.site_id) || 0,
      state: typeof job.state === 'string' ? job.state : null,
      start_datetime:
        typeof job.start_datetime === 'string' ? job.start_datetime : '',
      end_datetime:
        typeof job.end_datetime === 'string' ? job.end_datetime : '',
      shift_date: typeof job.shift_date === 'string' ? job.shift_date : '',
      day_of_week: typeof job.day_of_week === 'string' ? job.day_of_week : '',
      status: typeof job.status === 'string' ? job.status : '',
    }))
    .filter(job => job.roster_id > 0);
}

function extractDashboardData(payload: unknown): GuardDashboardData | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;
  const raw =
    obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)
      ? (obj.data as Record<string, unknown>)
      : obj;

  const guardRaw = raw.guard;
  if (!guardRaw || typeof guardRaw !== 'object' || Array.isArray(guardRaw)) {
    return null;
  }
  const guard = guardRaw as Record<string, unknown>;
  const name = typeof guard.name === 'string' ? guard.name.trim() : '';
  if (!name) return null;

  const scanCount =
    Number(raw.scaned_nfc_count ?? raw.scan_nfc_count ?? raw.scanned_nfc_count) ||
    0;

  return {
    patrolling_report_count: Number(raw.patrolling_report_count) || 0,
    incident_report_count: Number(raw.incident_report_count) || 0,
    scanners_count: Number(raw.scanners_count) || 0,
    scan_nfc_count: scanCount,
    guard: {
      id: Number(guard.id) || 0,
      name,
      email: typeof guard.email === 'string' ? guard.email : '',
      phone: typeof guard.phone === 'string' ? guard.phone : '',
    },
    today_jobs: extractTodayJobs(raw),
  };
}

export async function getGuardDashboardData(
  guardId?: string | number | null,
): Promise<GuardApiResult<GuardDashboardData>> {
  try {
    const storedGuardId = await AsyncStorage.getItem('guardId');
    const resolvedGuardId =
      guardId != null && String(guardId).trim()
        ? String(guardId).trim()
        : storedGuardId?.trim() || undefined;

    if (!resolvedGuardId) {
      return { success: false, message: 'Guard ID is required' };
    }

    const response = await apiClient.get(
      `/guard/dashboard-data/${resolvedGuardId}`,
    );
    const data = extractDashboardData(response.data);
    const ok =
      (response.data?.success === true || response.status < 300) && data != null;

    return {
      success: ok,
      data: data ?? undefined,
      message: extractMessage(
        response.data,
        ok ? 'Dashboard loaded' : 'Failed to load dashboard',
      ),
    };
  } catch (error: any) {
    return {
      success: false,
      message: extractMessage(
        error?.response?.data,
        error?.message || 'Failed to load dashboard',
      ),
    };
  }
}

export async function getGuardMyIncidents(): Promise<
  GuardApiResult<unknown[]>
> {
  try {
    const response = await apiClient.get('/guard/my-incidents');
    const incidents = extractIncidentsList(response.data);
    const ok =
      response.data?.success === true ||
      response.status < 300;
    return {
      success: ok,
      data: incidents,
      message: extractMessage(response.data, 'Incidents loaded'),
    };
  } catch (error: any) {
    return {
      success: false,
      message: extractMessage(
        error?.response?.data,
        error?.message || 'Failed to load incidents',
      ),
      data: [],
    };
  }
}

export interface JobCheckinPayload {
  roster_id: string | number;
  /** Comma-separated lat,lng e.g. "-33.8688,151.2093" */
  location: string;
  signin_notes: string;
  guard_id?: string | number;
  selfie?: {
    uri: string;
    type?: string;
    name?: string;
  };
}

export async function guardJobCheckin(
  payload: JobCheckinPayload,
): Promise<GuardApiResult> {
  try {
    const storedGuardId = await AsyncStorage.getItem('guardId');
    const guardId =
      payload.guard_id != null && String(payload.guard_id).trim()
        ? String(payload.guard_id).trim()
        : storedGuardId?.trim();

    const formData = new FormData();
    formData.append('roster_id', String(payload.roster_id));
    formData.append('location', payload.location);
    formData.append('signin_notes', payload.signin_notes);
    if (guardId) {
      formData.append('guard_id', guardId);
    }

    if (payload.selfie?.uri) {
      formData.append('selfie', {
        uri: payload.selfie.uri,
        type: payload.selfie.type ?? 'image/jpeg',
        name: payload.selfie.name ?? 'selfie.jpg',
      } as unknown as Blob);
    }

    const response = await apiClient.post('/guard/job-checkin', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const body = response.data;
    const ok = body?.success === true || response.status < 300;
    return {
      success: ok,
      message: extractMessage(body, 'Signed in successfully.'),
      data: body?.data ?? body,
    };
  } catch (error: any) {
    return {
      success: false,
      message: extractMessage(
        error?.response?.data,
        error?.message || 'Check-in failed',
      ),
    };
  }
}

export interface JobCheckoutPayload {
  roster_id: string | number;
  signout_location: string;
  signout_notes: string;
  guard_id?: string | number;
  selfie?: {
    uri: string;
    type?: string;
    name?: string;
  };
}

export async function guardJobCheckout(
  payload: JobCheckoutPayload,
): Promise<GuardApiResult> {
  try {
    const storedGuardId = await AsyncStorage.getItem('guardId');
    const guardId =
      payload.guard_id != null && String(payload.guard_id).trim()
        ? String(payload.guard_id).trim()
        : storedGuardId?.trim();

    const formData = new FormData();
    formData.append('roster_id', String(payload.roster_id));
    formData.append('signout_location', payload.signout_location);
    formData.append('signout_notes', payload.signout_notes);
    if (guardId) {
      formData.append('guard_id', guardId);
    }

    if (payload.selfie?.uri) {
      formData.append('selfie', {
        uri: payload.selfie.uri,
        type: payload.selfie.type ?? 'image/jpeg',
        name: payload.selfie.name ?? 'selfie.jpg',
      } as unknown as Blob);
    }

    const response = await apiClient.post('/guard/job-checkout', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const body = response.data;
    const ok = body?.success === true || response.status < 300;
    return {
      success: ok,
      message: extractMessage(body, 'Signed out successfully.'),
      data: body?.data ?? body,
    };
  } catch (error: any) {
    return {
      success: false,
      message: extractMessage(
        error?.response?.data,
        error?.message || 'Check-out failed',
      ),
    };
  }
}

export interface IncidentPerson {
  peopleCount?: number;
  name?: string;
  phone?: string;
  bodyType?: string;
  gender?: string;
  hair?: string;
  height?: string;
  weight?: string;
  marks?: string;
  email?: string;
}

export interface IncidentVehicle {
  make?: string;
  model?: string;
  vehicle_type?: string;
  vehicle_rander?: string;
}

export interface IncidentEmergencyServices {
  emergency_type?: string | null;
  emergency_detail?: string | null;
  supervisor_name?: string | null;
  position?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface IncidentWitness {
  wittness_detail?: string;
  wittness_name?: string;
  wittness_address?: string;
  wittness_email?: string;
  wittness_phone?: string;
  witness_more_info?: string;
}

export interface IncidentPhotoPayload {
  imgPath: string;
  timestamp: string;
}

export interface ReportIncidentPayload {
  guard_id: string | number;
  roster_id: string | number;
  date: string;
  time: string;
  site_name: string;
  injury_type: string;
  incident_detail: string;
  people_involved: IncidentPerson[];
  vehicle: IncidentVehicle[];
  emergency_services: IncidentEmergencyServices;
  wittness: IncidentWitness[];
  photo: IncidentPhotoPayload[];
  signature?: string;
}

export interface PatrolScanner {
  id: number;
  patrolling_report_id: number;
  name: string;
  value: string;
  status: string;
  scan_at: string | null;
  coordinates: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PatrollingReport {
  id: number;
  site_id: number | string;
  roster_id: number | string;
  guard_id: number | string;
  coordinates: string;
  scanner_count: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
  scanners: PatrolScanner[];
}

export interface StartPatrolPayload {
  site_id: string | number;
  guard_id?: string | number;
  coordinates: string;
}

export async function guardStartPatrol(
  rosterId: string | number,
  payload: StartPatrolPayload,
): Promise<GuardApiResult<PatrollingReport>> {
  try {
    const storedGuardId = await AsyncStorage.getItem('guardId');
    const guardId =
      payload.guard_id != null && String(payload.guard_id).trim()
        ? String(payload.guard_id).trim()
        : storedGuardId?.trim();

    const formData = new FormData();
    formData.append('site_id', String(payload.site_id));
    if (guardId) {
      formData.append('guard_id', guardId);
    }
    formData.append('coordinates', payload.coordinates);

    const response = await apiClient.post(
      `/guard/start-patrol/${rosterId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );

    const body = response.data;
    const ok = body?.success === true || response.status < 300;
    const report = normalizePatrollingReport(body?.patrolling_report);
    return {
      success: ok && Boolean(report),
      message: extractMessage(body, 'Patrol started successfully.'),
      data: report ?? undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      message: extractMessage(
        error?.response?.data,
        error?.message || 'Failed to start patrol',
      ),
    };
  }
}

export type TodayPatrollingResult = {
  reports: PatrollingReport[];
  date?: string;
};

export interface ScanNfcPayload {
  nfc_uid: string;
  coordinates: string;
  patrolling_report_id?: string | number;
  /** API field: patrolling report id */
  patrolling_id?: string | number;
  /** API field: scanner row id */
  scanner_id?: string | number;
  roster_id?: string | number;
  guard_id?: string | number;
}

async function postScanNfc(
  payload: ScanNfcPayload,
): Promise<GuardApiResult<PatrollingReport>> {
  const formData = new FormData();
  formData.append('nfc_uid', payload.nfc_uid.trim());
  formData.append('coordinates', payload.coordinates.trim());

  const patrollingId =
    payload.patrolling_id ?? payload.patrolling_report_id;
  if (patrollingId != null) {
    formData.append('patrolling_id', String(patrollingId));
  }
  if (payload.scanner_id != null) {
    formData.append('id', String(payload.scanner_id));
  }
  if (payload.roster_id != null) {
    formData.append('roster_id', String(payload.roster_id));
  }
  if (payload.guard_id != null) {
    formData.append('guard_id', String(payload.guard_id));
  }

  const response = await apiClient.post('/guard/scan-nfc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const body = response.data;
  const ok = body?.success === true;
  const report = normalizePatrollingReport(body?.patrolling_report);
  return {
    success: ok,
    message: extractMessage(body, ok ? 'NFC scanned successfully.' : 'NFC scan failed'),
    data: report ?? undefined,
  };
}

export async function guardScanNfc(
  payload: ScanNfcPayload,
): Promise<GuardApiResult<PatrollingReport>> {
  try {
    return await postScanNfc(payload);
  } catch (error: any) {
    return {
      success: false,
      message: extractMessage(
        error?.response?.data,
        error?.message || 'NFC scan failed',
      ),
    };
  }
}

export async function guardScanNfcWithVariants(
  variants: string[],
  coordinates: string,
  context?: Omit<ScanNfcPayload, 'nfc_uid' | 'coordinates'>,
): Promise<GuardApiResult<PatrollingReport>> {
  let lastResult: GuardApiResult<PatrollingReport> = {
    success: false,
    message: 'NFC scan failed',
  };

  const uniqueVariants = [...new Set(variants.map(v => v.trim()).filter(Boolean))];

  for (const variant of uniqueVariants) {
    try {
      const result = await postScanNfc({
        nfc_uid: variant,
        coordinates,
        ...context,
      });
      if (result.success) {
        return result;
      }
      lastResult = result;
    } catch (error: any) {
      lastResult = {
        success: false,
        message: extractMessage(
          error?.response?.data,
          error?.message || 'NFC scan failed',
        ),
      };
    }
  }

  return lastResult;
}

export async function guardTodayPatrolling(
  guardId?: string | number | null,
  rosterId?: string | number | null,
): Promise<GuardApiResult<TodayPatrollingResult>> {
  try {
    const storedGuardId = await AsyncStorage.getItem('guardId');
    const resolvedGuardId =
      guardId != null && String(guardId).trim()
        ? String(guardId).trim()
        : storedGuardId?.trim();

    if (!resolvedGuardId) {
      return {
        success: false,
        message: 'Guard ID is required.',
        data: { reports: [] },
      };
    }

    const formData = new FormData();
    formData.append('guard_id', resolvedGuardId);
    if (rosterId != null && String(rosterId).trim()) {
      formData.append('roster_id', String(rosterId).trim());
    }

    const response = await apiClient.post('/guard/today-patrolling', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const body = response.data;
    const reports = normalizePatrollingReports(body?.patrolling_reports);
    const ok =
      body?.success === true ||
      response.status < 300 ||
      reports.length === 0;

    return {
      success: ok,
      message: extractMessage(body, 'Patrol reports loaded.'),
      data: {
        reports,
        date: typeof body?.date === 'string' ? body.date : undefined,
      },
    };
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 404) {
      return {
        success: true,
        data: { reports: [] },
      };
    }

    return {
      success: false,
      message: extractMessage(
        error?.response?.data,
        error?.message || 'Failed to load patrol reports',
      ),
      data: { reports: [] },
    };
  }
}

export async function guardReportIncident(
  siteId: string | number,
  payload: ReportIncidentPayload,
): Promise<GuardApiResult> {
  try {
    const storedGuardId = await AsyncStorage.getItem('guardId');
    const guardId =
      payload.guard_id != null && String(payload.guard_id).trim()
        ? String(payload.guard_id).trim()
        : storedGuardId?.trim();

    const body: ReportIncidentPayload = {
      guard_id: toNumberId(guardId) ?? payload.guard_id,
      roster_id: toNumberId(payload.roster_id) ?? payload.roster_id,
      date: payload.date,
      time: payload.time,
      site_name: payload.site_name,
      injury_type: payload.injury_type,
      incident_detail: payload.incident_detail,
      people_involved: payload.people_involved ?? [],
      vehicle: payload.vehicle ?? [],
      emergency_services: payload.emergency_services ?? {
        emergency_type: null,
        emergency_detail: null,
        supervisor_name: null,
        position: null,
        address: null,
        email: null,
        phone: null,
      },
      wittness: payload.wittness ?? [],
      photo: payload.photo ?? [],
    };

    if (payload.signature) {
      body.signature = payload.signature;
    }

    const response = await apiClient.post(
      `/guard/report-incident/${siteId}`,
      body,
      { headers: { 'Content-Type': 'application/json' } },
    );

    const resBody = response.data;
    const ok = resBody?.success === true || response.status < 300;
    return {
      success: ok,
      message: extractMessage(resBody, 'Incident reported successfully!'),
      data: resBody?.data ?? resBody,
    };
  } catch (error: any) {
    return {
      success: false,
      message: extractMessage(
        error?.response?.data,
        error?.message || 'Failed to submit incident report',
      ),
    };
  }
}
