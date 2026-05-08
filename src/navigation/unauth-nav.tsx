import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GuardDashboard from '../screens/GuardDashboard';
import ShiftsScreen from '../screens/ShiftsScreen';
import ShiftSignInScreen from '../screens/ShiftSignInScreen';
import PatrolTimeline from '../screens/PatrolTimeline';
import AddPatrolReport from '../screens/AddPatrolReport';
import IncidentsScreen from '../screens/IncidentsScreen';
import AddIncidentScreen from '../screens/AddIncidentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { GuardStackParamList } from './types';
import { GUARD_ROUTES, AUTH_ROUTES, ROOT_ROUTES } from './constants';
import { Colors } from '../theme';

const Stack = createNativeStackNavigator<GuardStackParamList>();

/**
 * Guard Navigation Stack
 * Contains all screens accessible to guard users
 * Includes dashboard, shifts, patrol timeline, incidents, and profile
 */
export function GuardNavigator() {
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
                name={GUARD_ROUTES.DASHBOARD}
                component={GuardDashboard}
                options={{
                    animationEnabled: false,
                }}
            />
            <Stack.Screen
                name={GUARD_ROUTES.SHIFTS}
                component={ShiftsScreen}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name={GUARD_ROUTES.SHIFT_SIGN_IN}
                component={ShiftSignInScreen}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name={GUARD_ROUTES.PATROL_TIMELINE}
                component={PatrolTimeline}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name={GUARD_ROUTES.ADD_PATROL_REPORT}
                component={AddPatrolReport}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name={GUARD_ROUTES.INCIDENTS}
                component={IncidentsScreen}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name={GUARD_ROUTES.ADD_INCIDENT}
                component={AddIncidentScreen}
                options={{
                    animationEnabled: true,
                }}
            />
            <Stack.Screen
                name={GUARD_ROUTES.PROFILE}
                component={ProfileScreen}
                options={{
                    animationEnabled: true,
                }}
            />
        </Stack.Navigator>
    );
}

export default GuardNavigator;
