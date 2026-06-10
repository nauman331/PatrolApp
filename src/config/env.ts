import {
  API_BASE_URL as ENV_API_BASE_URL,
  INCIDENT_ASSETS_BASE_URL as ENV_INCIDENT_ASSETS_BASE_URL,
} from '@env';

const DEFAULT_BASE_URL = 'https://apis-nfc.arrowbyte.com.au';
const DEFAULT_INCIDENT_ASSETS_BASE_URL = `${DEFAULT_BASE_URL}/incident`;

/** API host without trailing slash */
export const API_BASE_URL = (
  ENV_API_BASE_URL?.trim() || DEFAULT_BASE_URL
).replace(/\/$/, '');

/** Base URL for incident photos and signatures (no trailing slash) */
export const INCIDENT_ASSETS_BASE_URL = (
  ENV_INCIDENT_ASSETS_BASE_URL?.trim() || DEFAULT_INCIDENT_ASSETS_BASE_URL
).replace(/\/$/, '');

/** Prefix for Laravel `/api/...` routes */
export const API_URL = `${API_BASE_URL}/api`;
