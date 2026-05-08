import {
    NativeStackNavigationProp,
    NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Authentication Stack Parameters
 * Routes: Splash, Login, Signup
 */
export type AuthStackParamList = {
    Splash: undefined;
    Login: undefined;
    Signup: undefined;
};

/**
 * Guard Dashboard Stack Parameters
 * Routes for logged-in guards
 */
export type GuardStackParamList = {
    GuardDashboard: undefined;
    Shifts: undefined;
    ShiftSignIn: { shiftId?: string };
    PatrolTimeline: { shiftId?: string };
    AddPatrolReport: { shiftId?: string };
    Incidents: undefined;
    AddIncident: { shiftId?: string };
    Profile: undefined;
};

/**
 * Manager Dashboard Stack Parameters
 * Routes for logged-in managers
 */
export type ManagerStackParamList = {
    ManagerDashboard: undefined;
    ShiftReport: { shiftId?: string };
    Profile: undefined;
};

/**
 * Root Stack Parameters
 * Combines auth and unauth stacks with loading state
 */
export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    GuardApp: NavigatorScreenParams<GuardStackParamList>;
    ManagerApp: NavigatorScreenParams<ManagerStackParamList>;
};

/**
 * Navigation Props for Auth Stack
 */
export type AuthStackScreenProps<RouteName extends keyof AuthStackParamList> =
    NativeStackScreenProps<AuthStackParamList, RouteName>;

/**
 * Navigation Props for Guard Stack
 */
export type GuardStackScreenProps<RouteName extends keyof GuardStackParamList> =
    NativeStackScreenProps<GuardStackParamList, RouteName>;

/**
 * Navigation Props for Manager Stack
 */
export type ManagerStackScreenProps<RouteName extends keyof ManagerStackParamList> =
    NativeStackScreenProps<ManagerStackParamList, RouteName>;

/**
 * Navigation Props for Root Stack
 */
export type RootStackScreenProps<RouteName extends keyof RootStackParamList> =
    NativeStackScreenProps<RootStackParamList, RouteName>;

/**
 * Type for navigation prop in auth screens
 */
export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

/**
 * Type for navigation prop in guard screens
 */
export type GuardNavigationProp = NativeStackNavigationProp<GuardStackParamList>;

/**
 * Type for navigation prop in manager screens
 */
export type ManagerNavigationProp = NativeStackNavigationProp<ManagerStackParamList>;

/**
 * Type for navigation prop in root
 */
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * User role type
 */
export type UserRole = 'guard' | 'manager' | null;
