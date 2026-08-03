import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ShiftSignInScreen from '../screens/ShiftSignInScreen';
import OngoingShiftScreen from '../screens/OngoingShiftScreen';
import AddPatrolReport from '../screens/AddPatrolReport';
import AddIncidentScreen from '../screens/AddIncidentScreen';
import ViewIncidentReportScreen from '../screens/ViewIncidentReportScreen';
import GuardSopsScreen from '../screens/GuardSopsScreen';
import PdfViewerScreen from '../screens/PdfViewerScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsConditionsScreen from '../screens/TermsConditionsScreen';
import { GuardStackParamList } from './types';
import { GUARD_ROUTES } from './constants';
import { Colors } from '../theme';
import GuardTabs from './GuardTabs';

const Stack = createNativeStackNavigator<GuardStackParamList>();

/**
 * Guard Navigation Stack
 *
 * Optimized Architecture:
 * 1. GuardTabs: A single persistent screen that hosts the 5 main tabs.
 *    This ensures the NavBar and SafeArea remain mounted and stable.
 * 2. Secondary Screens: Pushed onto the stack over the tabs.
 */
export function GuardNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: Colors.bg,
                },
            }}
        >
            {/*
                Main Tab Host - Replaces individual tab routes to ensure
                the Bottom Tab Bar and SafeArea are mounted only once.
            */}
            <Stack.Screen
                name="MainTabs"
                component={GuardTabs}
                options={{ animation: 'none' }}
            />

            {/*
                We keep the individual tab route names but point them to GuardTabs.
                This prevents breaking existing navigation calls while ensuring
                they all land in the stable tab container.
            */}
            <Stack.Screen name={GUARD_ROUTES.DASHBOARD} component={GuardTabs} options={{ animation: 'none' }} />
            <Stack.Screen name={GUARD_ROUTES.PATROL_TIMELINE} component={GuardTabs} options={{ animation: 'none' }} />
            <Stack.Screen name={GUARD_ROUTES.INCIDENTS} component={GuardTabs} options={{ animation: 'none' }} />
            <Stack.Screen name={GUARD_ROUTES.SHIFTS} component={GuardTabs} options={{ animation: 'none' }} />
            <Stack.Screen name={GUARD_ROUTES.PROFILE} component={GuardTabs} options={{ animation: 'none' }} />

            {/* Stack Screens */}
            <Stack.Screen name={GUARD_ROUTES.SHIFT_SIGN_IN} component={ShiftSignInScreen} />
            <Stack.Screen name={GUARD_ROUTES.ONGOING_SHIFT} component={OngoingShiftScreen} />
            <Stack.Screen name={GUARD_ROUTES.ADD_PATROL_REPORT} component={AddPatrolReport} />
            <Stack.Screen name={GUARD_ROUTES.ADD_INCIDENT} component={AddIncidentScreen} />
            <Stack.Screen name={GUARD_ROUTES.VIEW_INCIDENT} component={ViewIncidentReportScreen} />
            <Stack.Screen name={GUARD_ROUTES.SOPS} component={GuardSopsScreen} />
            <Stack.Screen name={GUARD_ROUTES.PDF_VIEWER} component={PdfViewerScreen} />
            <Stack.Screen name={GUARD_ROUTES.PRIVACY_POLICY} component={PrivacyPolicyScreen} />
            <Stack.Screen name={GUARD_ROUTES.TERMS_CONDITIONS} component={TermsConditionsScreen} />
        </Stack.Navigator>
    );
}

export default GuardNavigator;
