export interface ParsedShift {
  date: string;
  siteName: string;
  staffName: string;
  start: string;
  end: string;
  totalHours: number | string;
  signinTime: string;
  signoutTime: string;
  notes: string;
}

export interface DefaultShift {
  id: string;
  site: string;
  guard: string;
  time: string;
  status: string;
  color: "emerald" | "brand" | "blue";
}

export interface CalendarDay {
  n: number;
  sub: string;
  color?: string;
  badge?: string;
  today?: boolean;
}

// Excel Import Types
export interface Shift {
  id?: number;
  site_id: number;
  guard_id: number;
  guard_name: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  status: 'ACTIVE' | 'ON_PATROL' | 'BREAK' | 'COMPLETED';
  notes?: string;
}

export interface RosterImportPreview {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  data: Shift[];
  errors?: Array<{
    row: number;
    error: string;
  }>;
}

export interface RosterCalendarEvent {
  id: number;
  guard_id: number;
  guard_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  site_id: number;
}

export interface RosterCalendarData {
  site_id: number;
  month: string; // YYYY-MM
  events: RosterCalendarEvent[];
  guards: Array<{
    id: number;
    name: string;
  }>;
}