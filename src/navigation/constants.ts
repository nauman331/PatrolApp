/**
 * Route names for Auth Stack
 * Use these constants instead of string literals throughout the app
 */
export const AUTH_ROUTES = {
    SPLASH: 'Splash',
    ONBOARDING: 'Onboarding',
    LOGIN: 'Login',
} as const;

/**
 * Route names for Guard Stack
 */
import type { GuardNavigationProp, ManagerNavigationProp } from './types';
import {
  getActiveShiftSession,
  promptCheckInRequired,
} from '../services/activeShiftSession';

export const GUARD_ROUTES = {
    DASHBOARD: 'GuardDashboard',
    SHIFTS: 'Shifts',
    SHIFT_SIGN_IN: 'ShiftSignIn',
    ONGOING_SHIFT: 'OngoingShift',
    PATROL_TIMELINE: 'PatrolTimeline',
    ADD_PATROL_REPORT: 'AddPatrolReport',
    INCIDENTS: 'Incidents',
    ADD_INCIDENT: 'AddIncident',
    VIEW_INCIDENT: 'ViewIncidentReport',
    SOPS: 'GuardSops',
    PDF_VIEWER: 'PdfViewer',
    PROFILE: 'Profile',
    PRIVACY_POLICY: 'PrivacyPolicy',
    TERMS_CONDITIONS: 'TermsConditions',
} as const;

/** Bottom tab order: Home, Patrol, Incidents, Shifts, Profile */
export const GUARD_BOTTOM_TAB_ROUTES = [
    GUARD_ROUTES.DASHBOARD,
    GUARD_ROUTES.PATROL_TIMELINE,
    GUARD_ROUTES.INCIDENTS,
    GUARD_ROUTES.SHIFTS,
    GUARD_ROUTES.PROFILE,
] as const;

export function navigateGuardBottomTab(
    navigation: GuardNavigationProp,
    index: number,
): void {
    const routeName = GUARD_BOTTOM_TAB_ROUTES[index];
    if (!routeName) return;

    // Navigate to the MainTabs host with the target screen as a parameter
    // This ensures we stay on the same mounted Tab controller
    (navigation as any).navigate('MainTabs', { screen: routeName });
}

/**
 * Route names for Manager Stack
 */
export const MANAGER_ROUTES = {
    DASHBOARD: 'ManagerDashboard',
    GUARDS: 'ManagerGuards',
    GUARD_DETAILS: 'ManagerGuardDetails',
    GUARD_ATTENDANCE: 'ManagerGuardAttendance',
    REPORTS: 'ManagerReports',
    SHIFT_REPORT: 'ManagerShiftReport',
    INCIDENT_DETAIL: 'ManagerIncidentDetail',
    ROSTER: 'ManagerRoster',
    ROSTER_DETAIL: 'ManagerRosterDetail',
    SITE_DETAIL: 'ManagerSiteDetail',
    PROFILE: 'ManagerProfile',
    PRIVACY_POLICY: 'PrivacyPolicy',
    TERMS_CONDITIONS: 'TermsConditions',
} as const;

export const MANAGER_BOTTOM_TAB_ROUTES = [
    MANAGER_ROUTES.DASHBOARD,
    MANAGER_ROUTES.GUARDS,
    MANAGER_ROUTES.REPORTS,
    MANAGER_ROUTES.ROSTER,
    MANAGER_ROUTES.PROFILE,
] as const;

export function navigateManagerBottomTab(
    navigation: ManagerNavigationProp,
    index: number,
): void {
    const routeName = MANAGER_BOTTOM_TAB_ROUTES[index];
    if (!routeName) return;

    (navigation as any).navigate('ManagerTabs', { screen: routeName });
}

/**
 * Root Stack route names
 */
export const ROOT_ROUTES = {
    LOADING: 'Loading',
    AUTH: 'Auth',
    GUARD_APP: 'GuardApp',
    MANAGER_APP: 'ManagerApp',
} as const;

/**
 * Navigate to guard dashboard
 */
export const navigateToGuardApp = () => ({
    stack: ROOT_ROUTES.GUARD_APP,
    screen: GUARD_ROUTES.DASHBOARD,
});

/**
 * Navigate to manager dashboard
 */
export const navigateToManagerApp = () => ({
    stack: ROOT_ROUTES.MANAGER_APP,
    screen: MANAGER_ROUTES.DASHBOARD,
});
