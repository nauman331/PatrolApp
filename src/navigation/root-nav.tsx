import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList, UserRole } from './types';
import { ROOT_ROUTES } from './constants';
import { AuthNavigator } from './auth-nav';
import { GuardNavigator } from './unauth-nav';
import { ManagerNavigator } from './manager-nav';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
    /**
     * Current user role: 'guard', 'manager', or null (unauthenticated)
     */
    userRole: UserRole;
    /**
     * Whether authentication state is still being determined (loading)
     */
    isLoading?: boolean;
}

/**
 * Root Navigator
 * Handles the main navigation state and switching between:
 * 1. Auth Stack (unauthenticated users)
 * 2. Guard App Stack (authenticated guard users)
 * 3. Manager App Stack (authenticated manager users)
 *
 * This component bridges the gap between the app's authentication state
 * and the navigation hierarchy.
 */
export function RootNavigator({ userRole, isLoading = false }: RootNavigatorProps) {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animationEnabled: true,
            }}
        >
            {isLoading ? (
                /**
                 * Loading state
                 * Show splash or loading screen while determining auth state
                 * This prevents showing wrong stack briefly
                 */
                <Stack.Group screenOptions={{ animationEnabled: false }}>
                    <Stack.Screen
                        name="Loading"
                        component={LoadingScreen}
                        options={{ animationEnabled: false }}
                    />
                </Stack.Group>
            ) : userRole === null ? (
                /**
                 * Auth Stack
                 * Shown when user is not authenticated
                 */
                <Stack.Group screenOptions={{ animationEnabled: false }}>
                    <Stack.Screen
                        name={ROOT_ROUTES.AUTH}
                        component={AuthNavigator}
                        options={{ animationEnabled: false }}
                    />
                </Stack.Group>
            ) : userRole === 'guard' ? (
                /**
                 * Guard App Stack
                 * Shown when authenticated user is a guard
                 */
                <Stack.Group screenOptions={{ animationEnabled: false }}>
                    <Stack.Screen
                        name={ROOT_ROUTES.GUARD_APP}
                        component={GuardNavigator}
                        options={{ animationEnabled: false }}
                    />
                </Stack.Group>
            ) : (
                /**
                 * Manager App Stack
                 * Shown when authenticated user is a manager
                 */
                <Stack.Group screenOptions={{ animationEnabled: false }}>
                    <Stack.Screen
                        name={ROOT_ROUTES.MANAGER_APP}
                        component={ManagerNavigator}
                        options={{ animationEnabled: false }}
                    />
                </Stack.Group>
            )}
        </Stack.Navigator>
    );
}

/**
 * Loading Screen Component
 * Placeholder while auth state is being determined
 */
function LoadingScreen() {
    return null; // Can be replaced with a proper loading screen
}

export default RootNavigator;
