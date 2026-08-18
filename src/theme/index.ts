// ============================================================
// THEME — Change ACCENT or DARK_BG to restyle the entire app
// ============================================================

export const Colors = {
  // ── Brand / Accent ──────────────────────────────────────
  accent: '#6A89A7', // primary CTA, badges, highlights
  accentLight: '#BDDDFC', // soft tint backgrounds
  accentDark: '#384959', // pressed states
  accentAlpha12: 'rgba(106, 137, 167, 0.12)',
  accentAlpha25: 'rgba(106, 137, 167, 0.25)',
  accentAlpha30: 'rgba(106, 137, 167, 0.30)',

  // ── Neutral / Background ─────────────────────────────────
  bg: '#BDDDFC', // main screen background
  bgAlt: '#f4f7f9', // secondary/alt background
  bgCard: '#FFFFFF', // card surfaces
  bgInput: '#FFFFFF', // input fields

  // ── Dark surfaces (patrol timeline / report) ─────────────
  darkBg: '#384959',
  darkCard: '#FFFFFF',
  darkBorder: '#E8E8F0',

  // ── Header gradients ─────────────────────────────────────
  headerStart: '#384959',
  headerEnd: '#6A89A7',
  mgrHeaderStart: '#384959',
  mgrHeaderEnd: '#6A89A7',

  // ── Text ─────────────────────────────────────────────────
  textPrimary: '#384959',
  textSecondary: '#6A89A7',
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
  info: '#88BDF2',
  infoLight: '#BDDDFC',

  // ── Borders & dividers ───────────────────────────────────
  border: '#E8E8F0',
  borderDark: '#384959',

  // ── Navigation ───────────────────────────────────────────
  navBg: '#FFFFFF',
  navBgDark: '#FFFFFF',
  navBgMgr: '#FFFFFF',
  navActive: '#6A89A7',
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
