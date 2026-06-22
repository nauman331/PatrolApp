import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_LOGIN_KEY = 'savedLogin';

export type SavedLogin = {
  role: 'guard' | 'manager';
  remember: boolean;
  phone?: string;
  email?: string;
  password?: string;
};

export async function saveSavedLogin(data: SavedLogin): Promise<void> {
  if (!data.remember) {
    await AsyncStorage.removeItem(SAVED_LOGIN_KEY);
    return;
  }
  await AsyncStorage.setItem(SAVED_LOGIN_KEY, JSON.stringify(data));
}

export async function getSavedLogin(): Promise<SavedLogin | null> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_LOGIN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedLogin;
  } catch {
    return null;
  }
}

export async function clearSavedLogin(): Promise<void> {
  await AsyncStorage.removeItem(SAVED_LOGIN_KEY);
}

export async function syncAuthTokensToStorage(
  token: string | null | undefined,
  guardId: string | null | undefined,
): Promise<void> {
  if (token) {
    await AsyncStorage.setItem('authToken', token);
  } else {
    await AsyncStorage.removeItem('authToken');
  }
  if (guardId) {
    await AsyncStorage.setItem('guardId', guardId);
  } else {
    await AsyncStorage.removeItem('guardId');
  }
}
