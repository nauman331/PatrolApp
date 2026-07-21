import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/Splashscreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import { AuthStackParamList } from './types';
import { AUTH_ROUTES } from './constants';
import { Colors } from '../theme';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Auth Navigation Stack
 * Contains unauthenticated user flows (Splash, Login, Signup)
 * This stack is displayed when no user is logged in
 */
export function AuthNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: Colors.bg,
                },
            }}
            initialRouteName={AUTH_ROUTES.ONBOARDING}
        >
            <Stack.Screen
                name={AUTH_ROUTES.ONBOARDING}
                component={OnboardingScreen}
            />
            <Stack.Screen
                name={AUTH_ROUTES.LOGIN}
                component={LoginScreen}
            />
        </Stack.Navigator>
    );
}

export default AuthNavigator;
