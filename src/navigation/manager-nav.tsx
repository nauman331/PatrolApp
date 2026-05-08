import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ManagerDashboard from '../screens/ManagerDashboard';
import ShiftReportScreen from '../screens/ShiftReportScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { ManagerStackParamList } from './types';
import { MANAGER_ROUTES } from './constants';
import { Colors } from '../theme';

const Stack = createNativeStackNavigator<ManagerStackParamList>();

/**
 * Manager Navigation Stack
 * Contains all screens accessible to manager users
 * Includes dashboard, shift reports, and profile
 */
export function ManagerNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animationEnabled: true,
                cardStyle: {
                    backgroundColor: Colors.bg,
                },
            }}
        >
            <Stack.Screen
                name={MANAGER_ROUTES.DASHBOARD}
                component={ManagerDashboard}
                options={{
                    animationEnabled: false,
                }}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.SHIFT_REPORT}
                component={ShiftReportScreen}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.PROFILE}
                component={ProfileScreen}
                options={{
                    animationEnabled: true,
                }}
            />
        </Stack.Navigator>
    );
}

export default ManagerNavigator;
