import axios from 'axios';
import { store } from '../store';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://apis-nfc.arrowbyte.com.au/api';

const apiClient = axios.create({ baseURL: API_BASE });

apiClient.interceptors.request.use((config) => {
  const state = store.getState();
  const token = state.auth?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function previewExcelImport(file: File) {
  try {
    const formData = new FormData();
    formData.append('excel', file, file.name);

    console.group('%c📤 IMPORT PREVIEW REQUEST', 'color:#6366f1;font-weight:bold');
    console.log('URL', `${API_BASE}/import-preview`);
    console.log('Field name', 'excel');
    console.log('File name', file.name);
    console.log('File size', `${(file.size/1024).toFixed(1)} KB`);
    console.groupEnd();

    const response = await apiClient.post('/import-preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    console.log('%c✅ PREVIEW RESPONSE', 'color:green;font-weight:bold', response.data);
    return response.data;
  } catch (error: any) {
    console.group('%c❌ PREVIEW ERROR', 'color:red;font-weight:bold');
    console.log('Status', error.response?.status);
    console.log('Message', error.response?.data);
    console.groupEnd();
    const serverMsg = error.response?.data?.message || error.response?.data?.error;
    throw new Error(serverMsg || 'Failed to preview Excel file');
  }
}

export async function confirmExcelImport(rows: any[]) {
  try {
    const state = store.getState();
    const user_id = state.auth?.user?.id;

    const payload = { user_id,rows};

    console.group('%c📤 IMPORT CONFIRM REQUEST', 'color:#6366f1;font-weight:bold');
    console.log('URL', `${API_BASE}/import-confirm`);
    console.log('User ID', user_id);
    console.log('Rows count', rows.length);
    console.log('Payload', payload);
    console.groupEnd();

    const response = await apiClient.post('/import-confirm', payload);

    console.log('%c✅ CONFIRM RESPONSE', 'color:green;font-weight:bold', response.data);
    return response.data;
  } catch (error: any) {
    console.group('%c❌ CONFIRM ERROR', 'color:red;font-weight:bold');
    console.log('Status', error.response?.status);
    console.log('Message', error.response?.data);
    console.groupEnd();
    throw new Error(error.response?.data?.message || 'Failed to import');
  }
}

export async function getRosterCalendar(siteId?: number, from?: string, to?: string) {
  try {
    const params = new URLSearchParams();
    
    // Only add site_id if it's provided and not 0 (0 means all sites)
    if (siteId && siteId > 0) {
      params.append('site_id', String(siteId));
    }
    
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const response = await apiClient.get(`/roster-calendar?${params.toString()}`);

    // Return raw response.data — normalization handled in the view
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch roster calendar');
  }
}


// export async function getRosters() {
//   try {

//     const response = await apiClient.get(`/roster-calendar`);

//     // Return raw response.data — normalization handled in the view
//     return response.data;
//   } catch (error: any) {
//     throw new Error(error.response?.data?.message || 'Failed to fetch roster calendar');
//   }
// }