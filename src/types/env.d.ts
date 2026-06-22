declare module '@env' {
  export const API_BASE_URL: string;
  /** Optional override for the full `/api` prefix (defaults to API_BASE_URL/api) */
  export const API_URL: string;
  /** PC LAN IP for local Laravel on a physical Android device (e.g. 192.168.1.10) */
  export const DEV_MACHINE_IP: string;
  export const INCIDENT_ASSETS_BASE_URL: string;
}
