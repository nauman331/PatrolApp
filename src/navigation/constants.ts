/**
 * Route names for Auth Stack
 * Use these constants instead of string literals throughout the app
 */
export const AUTH_ROUTES = {
    SPLASH: 'Splash',
    LOGIN: 'Login',
    SIGNUP: 'Signup',
} as const;

/**
 * Route names for Guard Stack
 */
export const GUARD_ROUTES = {
    DASHBOARD: 'GuardDashboard',
    SHIFTS: 'Shifts',
    SHIFT_SIGN_IN: 'ShiftSignIn',
    PATROL_TIMELINE: 'PatrolTimeline',
    ADD_PATROL_REPORT: 'AddPatrolReport',
    INCIDENTS: 'Incidents',
    ADD_INCIDENT: 'AddIncident',
    PROFILE: 'Profile',
} as const;

/**
 * Route names for Manager Stack
 */
export const MANAGER_ROUTES = {
    DASHBOARD: 'ManagerDashboard',
    SHIFT_REPORT: 'ShiftReport',
    PROFILE: 'Profile',
} as const;

/**
 * Root Stack route names
 */
export const ROOT_ROUTES = {
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
