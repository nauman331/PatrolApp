import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    ManagerGuardDetailsScreen,
    ManagerGuardAttendanceScreen,
    ManagerShiftReportScreen,
    ManagerIncidentDetailScreen,
    ManagerRosterDetailScreen,
    ManagerSiteDetailScreen,
} from '../screens/manager';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import { ManagerStackParamList } from './types';
import { MANAGER_ROUTES } from './constants';
import { Colors } from '../theme';
import ManagerTabs from './ManagerTabs';

const Stack = createNativeStackNavigator<ManagerStackParamList>();

/**
 * Manager Navigation Stack
 * Optimized with stable ManagerTabs container
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
            {/* Tab Host */}
            <Stack.Screen
                name="ManagerTabs"
                component={ManagerTabs}
                options={{ animation: 'none' }}
            />

            {/* Tab Routes mapping to the host */}
            <Stack.Screen name={MANAGER_ROUTES.DASHBOARD} component={ManagerTabs} options={{ animation: 'none' }} />
            <Stack.Screen name={MANAGER_ROUTES.GUARDS} component={ManagerTabs} options={{ animation: 'none' }} />
            <Stack.Screen name={MANAGER_ROUTES.REPORTS} component={ManagerTabs} options={{ animation: 'none' }} />
            <Stack.Screen name={MANAGER_ROUTES.ROSTER} component={ManagerTabs} options={{ animation: 'none' }} />
            <Stack.Screen name={MANAGER_ROUTES.PROFILE} component={ManagerTabs} options={{ animation: 'none' }} />

            {/* Stack Screens */}
            <Stack.Screen name={MANAGER_ROUTES.GUARD_DETAILS} component={ManagerGuardDetailsScreen} />
            <Stack.Screen name={MANAGER_ROUTES.GUARD_ATTENDANCE} component={ManagerGuardAttendanceScreen} />
            <Stack.Screen name={MANAGER_ROUTES.SHIFT_REPORT} component={ManagerShiftReportScreen} />
            <Stack.Screen name={MANAGER_ROUTES.INCIDENT_DETAIL} component={ManagerIncidentDetailScreen} />
            <Stack.Screen name={MANAGER_ROUTES.ROSTER_DETAIL} component={ManagerRosterDetailScreen} />
            <Stack.Screen name={MANAGER_ROUTES.SITE_DETAIL} component={ManagerSiteDetailScreen} />
            <Stack.Screen name={MANAGER_ROUTES.PRIVACY_POLICY} component={PrivacyPolicyScreen} />
            <Stack.Screen name={MANAGER_ROUTES.TERMS_CONDITIONS} component={TermsConditionsScreen} />
        </Stack.Navigator>
    );
}

export default ManagerNavigator;
