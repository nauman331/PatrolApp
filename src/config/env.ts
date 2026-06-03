import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

const DEFAULT_BASE_URL = 'https://apis-nfc.arrowbyte.com.au';

/** API host without trailing slash */
export const API_BASE_URL = (
  ENV_API_BASE_URL?.trim() || DEFAULT_BASE_URL
).replace(/\/$/, '');

/** Prefix for Laravel `/api/...` routes */
export const API_URL = `${API_BASE_URL}/api`;
