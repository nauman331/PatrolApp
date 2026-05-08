// ============================================================
// THEME — Change ACCENT or DARK_BG to restyle the entire app
// ============================================================

export const Colors = {
  // ── Brand / Accent ──────────────────────────────────────
  accent: '#791f3d', // primary CTA, badges, highlights
  accentLight: '#f5e8ec', // soft tint backgrounds
  accentDark: '#5a1630', // pressed states
  accentAlpha12: 'rgba(121,31,61,0.12)',
  accentAlpha25: 'rgba(121,31,61,0.25)',
  accentAlpha30: 'rgba(121,31,61,0.30)',

  // ── Neutral / Background ─────────────────────────────────
  bg: '#FFFFFF', // main screen background
  bgAlt: '#e9e5e5', // secondary/alt background
  bgCard: '#FFFFFF', // card surfaces
  bgInput: '#fefefe', // input fields

  // ── Dark surfaces (patrol timeline / report) ─────────────
  darkBg: '#FFFFFF',
  darkCard: '#F7F8FC',
  darkBorder: '#E8E8F0',

  // ── Header gradients ─────────────────────────────────────
  headerStart: '#1a1a2e',
  headerEnd: '#0f3460',
  mgrHeaderStart: '#0f3460',
  mgrHeaderEnd: '#1a1a2e',

  // ── Text ─────────────────────────────────────────────────
  textPrimary: '#1a1a2e',
  textSecondary: '#888888',
  textMuted: '#BBBBBB',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: 'rgba(255,255,255,0.45)',

  // ── Status ───────────────────────────────────────────────
  success: '#2e7d52',
  successLight: '#e8f8f0',
  warning: '#f59e0b',
  warningLight: '#fff7ed',
  danger: '#e53e3e',
  dangerLight: '#fde8e8',
  info: '#3b82f6',
  infoLight: '#e8f0fe',

  // ── Borders & dividers ───────────────────────────────────
  border: '#E8E8F0',
  borderDark: '#2a2a35',

  // ── Navigation ───────────────────────────────────────────
  navBg: '#FFFFFF',
  navBgDark: '#FFFFFF',
  navBgMgr: '#F0F4FF',
  navActive: '#791f3d',
  navInactive: '#BBBBBB',

  // ── Misc ─────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const FontFamilies = {
  heading: 'System', // replace with custom font if loaded
  body: 'System',
};

export const FontSizes = {
  xs: 9,
  sm: 10,
  base: 12,
  md: 13,
  lg: 15,
  xl: 17,
  '2xl': 20,
  '3xl': 24,
  '4xl': 30,
};

export const Radii = {
  sm: 9,
  md: 12,
  lg: 16,
  xl: 18,
  pill: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
};
