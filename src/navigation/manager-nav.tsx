import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    ManagerDashboard,
    ManagerGuardsScreen,
    ManagerGuardDetailsScreen,
    ManagerGuardAttendanceScreen,
    ManagerReportsScreen,
    ManagerShiftReportScreen,
    ManagerIncidentDetailScreen,
    ManagerRosterScreen,
} from '../screens/manager';
import ProfileScreen from '../screens/ProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import { ManagerStackParamList } from './types';
import { MANAGER_ROUTES } from './constants';
import { Colors } from '../theme';

const Stack = createNativeStackNavigator<ManagerStackParamList>();

/**
 * Manager Navigation Stack
 * Dashboard, guards, reports, roster, and profile flows
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
                options={{ animation: 'none' }}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.GUARDS}
                component={ManagerGuardsScreen}
                options={{ animation: 'none' }}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.GUARD_DETAILS}
                component={ManagerGuardDetailsScreen}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.GUARD_ATTENDANCE}
                component={ManagerGuardAttendanceScreen}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.REPORTS}
                component={ManagerReportsScreen}
                options={{ animation: 'none' }}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.SHIFT_REPORT}
                component={ManagerShiftReportScreen}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.INCIDENT_DETAIL}
                component={ManagerIncidentDetailScreen}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.ROSTER}
                component={ManagerRosterScreen}
                options={{ animation: 'none' }}
            />
            <Stack.Screen
                name={MANAGER_ROUTES.PROFILE}
                component={ProfileScreen}
                options={{ animation: 'none' }}
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
