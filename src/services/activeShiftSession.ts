import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { combineDateAndTime } from './guardJobsMapper';

const ACTIVE_SHIFT_KEY = 'activeShiftSession';

export interface SiteInfo {
  site_id: number;
  emergency_procedures?: string;
  patrol_checkpoints?: string;
  incident_reporting_guide?: string;
  nfc_scan_protocol?: string;
  site_map?: string;
  work_instruction?: string;
  health_safety_policy?: string;
}

export interface ActiveShiftSession {
  rosterId: string | number;
  site: string;
  zones: string;
  signInTime: string;
  shiftId?: string;
  siteId?: string | number;
  siteInfo?: SiteInfo;
  endTimestamp?: number;
  endTime?: string;
}

let memorySession: ActiveShiftSession | null = null;

export function isSessionExpired(session: ActiveShiftSession | null): boolean {
  if (!session || !session.endTimestamp) return false;
  return Date.now() >= session.endTimestamp;
}

export function getActiveShiftSessionSync(): ActiveShiftSession | null {
  if (memorySession && isSessionExpired(memorySession)) {
    memorySession = null;
    void AsyncStorage.removeItem(ACTIVE_SHIFT_KEY);
    return null;
  }
  return memorySession;
}

export async function saveActiveShiftSession(
  session: ActiveShiftSession,
): Promise<void> {
  let sessionToSave = session;
  if (!sessionToSave.endTimestamp && sessionToSave.endTime && sessionToSave.signInTime) {
    const dateStr = sessionToSave.signInTime.slice(0, 10);
    const calculated = combineDateAndTime(dateStr, sessionToSave.endTime);
    if (calculated != null) {
      sessionToSave = { ...sessionToSave, endTimestamp: calculated };
    }
  }
  memorySession = sessionToSave;
  await AsyncStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(sessionToSave));
}

export async function getActiveShiftSession(): Promise<ActiveShiftSession | null> {
  let session = memorySession;
  if (!session) {
    const raw = await AsyncStorage.getItem(ACTIVE_SHIFT_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as ActiveShiftSession;
      if (parsed?.rosterId == null || !parsed.signInTime) return null;
      session = parsed;
      memorySession = parsed;
    } catch {
      return null;
    }
  }

  if (isSessionExpired(session)) {
    await clearActiveShiftSession();
    return null;
  }

  return session;
}

export async function clearActiveShiftSession(): Promise<void> {
  memorySession = null;
  await AsyncStorage.removeItem(ACTIVE_SHIFT_KEY);
}

export async function patchActiveShiftSession(
  patch: Partial<ActiveShiftSession>,
): Promise<ActiveShiftSession | null> {
  const current = await getActiveShiftSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  await saveActiveShiftSession(next);
  return next;
}

export function promptCheckInRequired(onGoToShifts?: () => void): void {
  Alert.alert(
    'Shift not active',
    'Please check in to a shift first, then you can start patrolling.',
    [
      { text: 'Cancel', style: 'cancel' },
      ...(onGoToShifts
        ? [{ text: 'Go to Shifts', onPress: onGoToShifts }]
        : []),
    ],
  );
}
