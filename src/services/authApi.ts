import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';


export const BASE_URL = 'https://apis-nfc.arrowbyte.com.au/api';


export async function login(email: string, password: string) {
  try {
    const response = await axios.post(`${BASE_URL}/login`, {
      email,
      password,
    });

    console.log('LOGIN FULL RESPONSE:', response.data);

    if (!response.data?.success) {
      return { success: false, message: 'Invalid credentials' };
    }

    // 🔥 FIX HERE
    const token = response.data?.token || response.data?.data?.token;

    if (!token) {
      console.warn('⚠️ No token received from API');

      // still allow login if your app doesn't require token yet
      return { success: true };
    }

    await AsyncStorage.setItem('authToken', token);

    return { success: true };

  } catch (error: any) {
    console.error('Login error:', error?.message || error);
    return { success: false, message: 'Something went wrong' };
  }
}
export async function logout() {
  await AsyncStorage.removeItem('authToken');
}

export async function getAuthToken() {
  return await AsyncStorage.getItem('authToken');
}


