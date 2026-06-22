import { Platform } from 'react-native';
import {
  API_BASE_URL as ENV_API_BASE_URL,
  API_URL as ENV_API_URL,
  DEV_MACHINE_IP as ENV_DEV_MACHINE_IP,
  INCIDENT_ASSETS_BASE_URL as ENV_INCIDENT_ASSETS_BASE_URL,
} from '@env';

const ANDROID_EMULATOR_HOST = '10.0.2.2';

function normalizeBaseUrl(raw: string | undefined): string {
  return (raw?.trim() || '').replace(/\/$/, '');
}

function resolveDevHost(baseUrl: string): string {
  if (Platform.OS !== 'android' || !__DEV__) {
    return baseUrl;
  }

  const devMachineIp = normalizeBaseUrl(ENV_DEV_MACHINE_IP);
  const replacement = devMachineIp || ANDROID_EMULATOR_HOST;

  return baseUrl
    .replace(/\/\/localhost/i, `//${replacement}`)
    .replace(/\/\/127\.0\.0\.1/i, `//${replacement}`);
}

const resolvedApiBase = resolveDevHost(normalizeBaseUrl(ENV_API_BASE_URL));

if (!resolvedApiBase) {
  throw new Error(
    'API_BASE_URL is missing. Set it in .env (see .env.example) and restart Metro.',
  );
}

/** API host without trailing slash — set in `.env` */
export const API_BASE_URL = resolvedApiBase;

/** Incident photos and signatures — set in `.env`, or derived from API_BASE_URL */
export const INCIDENT_ASSETS_BASE_URL =
  resolveDevHost(
    normalizeBaseUrl(ENV_INCIDENT_ASSETS_BASE_URL) ||
      `${normalizeBaseUrl(ENV_API_BASE_URL)}/incident`,
  ) || `${API_BASE_URL}/incident`;

/** Prefix for Laravel `/api/...` routes — override with `API_URL` in `.env` if needed */
export const API_URL =
  resolveDevHost(normalizeBaseUrl(ENV_API_URL) || '') ||
  `${API_BASE_URL}/api`;

if (__DEV__) {
  console.log('[PatrolApp] API_BASE_URL:', API_BASE_URL);
  console.log('[PatrolApp] API_URL:', API_URL);
  console.log('[PatrolApp] INCIDENT_ASSETS_BASE_URL:', INCIDENT_ASSETS_BASE_URL);
}
