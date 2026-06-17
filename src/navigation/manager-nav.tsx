import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ManagerDashboard from '../screens/ManagerDashboard';
import ShiftReportScreen from '../screens/ShiftReportScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
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
                contentStyle: {
                    backgroundColor: Colors.bg,
                },
            }}
        >
            <Stack.Screen
                name={MANAGER_ROUTES.DASHBOARD}
                component={ManagerDashboard}
                options={{
                    animation: 'none',
                }}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.SHIFT_REPORT}
                component={ShiftReportScreen}
                options={{
                }}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.PROFILE}
                component={ProfileScreen}
                options={{
                }}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.PRIVACY_POLICY}
                component={PrivacyPolicyScreen}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.TERMS_CONDITIONS}
                component={TermsConditionsScreen}
            />
        </Stack.Navigator>
    );
}

export default ManagerNavigator;
