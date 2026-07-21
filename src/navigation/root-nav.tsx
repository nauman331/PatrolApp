import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList, UserRole } from './types';
import { ROOT_ROUTES } from './constants';
import { AuthNavigator } from './auth-nav';
import { GuardNavigator } from './unauth-nav';
import { ManagerNavigator } from './manager-nav';

import SplashScreen from '../screens/Splashscreen';

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
    /**
     * Callback when splash screen animation completes
     */
    onSplashFinish?: () => void;
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
export function RootNavigator({
    userRole,
    isLoading = false,
    onSplashFinish,
}: RootNavigatorProps) {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
            }}
        >
            {isLoading ? (
                <Stack.Group screenOptions={{ animation: 'none' }}>
                    <Stack.Screen name={ROOT_ROUTES.LOADING}>
                        {(props) => (
                            <SplashScreen {...(props as any)} onFinish={onSplashFinish} />
                        )}
                    </Stack.Screen>
                </Stack.Group>
            ) : userRole === null ? (
                /**
                 * Auth Stack
                 * Shown when user is not authenticated
                 */
                <Stack.Group screenOptions={{ animation: 'none' }}>
                    <Stack.Screen
                        name={ROOT_ROUTES.AUTH}
                        component={AuthNavigator}
                        options={{ animation: 'none' }}
                    />
                </Stack.Group>
            ) : userRole === 'guard' ? (
                /**
                 * Guard App Stack
                 * Shown when authenticated user is a guard
                 */
                <Stack.Group screenOptions={{ animation: 'none' }}>
                    <Stack.Screen
                        name={ROOT_ROUTES.GUARD_APP}
                        component={GuardNavigator}
                        options={{ animation: 'none' }}
                    />
                </Stack.Group>
            ) : (
                /**
                 * Manager App Stack
                 * Shown when authenticated user is a manager
                 */
                <Stack.Group screenOptions={{ animation: 'none' }}>
                    <Stack.Screen
                        name={ROOT_ROUTES.MANAGER_APP}
                        component={ManagerNavigator}
                        options={{ animation: 'none' }}
                    />
                </Stack.Group>
            )}
        </Stack.Navigator>
    );
}

export default RootNavigator;
