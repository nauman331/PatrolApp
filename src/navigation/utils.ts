import { useNavigation } from '@react-navigation/native';
import {
    AuthNavigationProp,
    GuardNavigationProp,
    ManagerNavigationProp,
    RootNavigationProp,
} from './types';

/**
 * Custom hook for auth stack navigation
 * Use in auth screens (Splash, Onboarding, Login, Signup)
 */
export function useAuthNavigation(): AuthNavigationProp {
    return useNavigation<AuthNavigationProp>();
}

/**
 * Custom hook for guard stack navigation
 * Use in guard screens (Dashboard, Shifts, etc.)
 */
export function useGuardNavigation(): GuardNavigationProp {
    return useNavigation<GuardNavigationProp>();
}

/**
 * Custom hook for manager stack navigation
 * Use in manager screens
 */
export function useManagerNavigation(): ManagerNavigationProp {
    return useNavigation<ManagerNavigationProp>();
}

/**
 * Custom hook for root navigation
 * Use in root-level components
 */
export function useRootNavigation(): RootNavigationProp {
    return useNavigation<RootNavigationProp>();
}

/**
 * Navigation helper - Reset to a specific route
 * Useful for clearing navigation stack on logout
 */
export function resetToRoute(
    navigation: AuthNavigationProp | GuardNavigationProp | ManagerNavigationProp,
    routeName: string
) {
    navigation.reset({
        index: 0,
        routes: [{ name: routeName as never }],
    });
}

/**
 * Navigation helper - Navigate with fade animation
 */
export function navigateWithFade(
    navigation: GuardNavigationProp | ManagerNavigationProp,
    screenName: string,
    params?: Record<string, unknown>,
) {
    // Union navigators cannot call .navigate safely; callers pass the correct stack.
    (navigation.navigate as (name: string, p?: Record<string, unknown>) => void)(
        screenName,
        params,
    );
}

/**
 * Navigation helper - Navigate and replace current screen
 * Useful for login flow
 */
export function replaceScreen(
    navigation: AuthNavigationProp | GuardNavigationProp | ManagerNavigationProp,
    screenName: string,
    params?: Record<string, unknown>,
) {
    (navigation.replace as (name: string, p?: Record<string, unknown>) => void)(
        screenName,
        params,
    );
}

/**
 * Navigation helper - Clear all previous screens and show new one
 * Perfect for logout flow
 */
export function resetNavigation(
    navigation: AuthNavigationProp | GuardNavigationProp | ManagerNavigationProp
) {
    navigation.reset({
        index: 0,
        routes: [{ name: 'Splash' as never }],
    });
}
