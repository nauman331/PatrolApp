import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearActiveShiftSession } from './activeShiftSession';
import { sendGuardOtp, verifyGuardOtp } from './guardApi';

export { API_BASE_URL, API_URL } from '../config/env';

export async function loginGuardWithOtp(
  phone: string,
  otp?: string,
): Promise<{ success: boolean; message?: string; token?: string }> {
  const normalizedPhone = phone.trim();
  if (!normalizedPhone) {
    return { success: false, message: 'Please enter your phone number' };
  }

  if (!otp?.trim()) {
    return sendGuardOtp(normalizedPhone);
  }

  return verifyGuardOtp(normalizedPhone, otp.trim());
}

/** Legacy email/password login (manager or other flows) */
export async function login(email: string, password: string) {
  return loginGuardWithOtp(email, password);
}

export async function logout() {
  await AsyncStorage.removeItem('authToken');
  await AsyncStorage.removeItem('guardId');
  await clearActiveShiftSession();
}

export async function getAuthToken() {
  return await AsyncStorage.getItem('authToken');
}

/** @alias sendGuardOtp */
export { sendGuardOtp as sendOtpToPhone } from './guardApi';
