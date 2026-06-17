import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const ACTIVE_SHIFT_KEY = 'activeShiftSession';

export interface ActiveShiftSession {
  rosterId: string | number;
  site: string;
  zones: string;
  signInTime: string;
  shiftId?: string;
  siteId?: string | number;
}

export async function saveActiveShiftSession(
  session: ActiveShiftSession,
): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_SHIFT_KEY, JSON.stringify(session));
}

export async function getActiveShiftSession(): Promise<ActiveShiftSession | null> {
  const raw = await AsyncStorage.getItem(ACTIVE_SHIFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ActiveShiftSession;
    if (parsed?.rosterId == null || !parsed.signInTime) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearActiveShiftSession(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_SHIFT_KEY);
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
