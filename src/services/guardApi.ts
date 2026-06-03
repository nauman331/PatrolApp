import apiClient from './api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

function extractJobsList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data;
  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
    const nested = obj.data as Record<string, unknown>;
    if (Array.isArray(nested.jobs)) return nested.jobs;
    if (Array.isArray(nested.data)) return nested.data;
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
