import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/Splashscreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
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
        >
            <Stack.Screen
                name={AUTH_ROUTES.SPLASH}
                component={SplashScreen}
                options={{
                    animation: 'none',
                }}
            />
            <Stack.Screen
                name={AUTH_ROUTES.LOGIN}
                component={LoginScreen}
                options={{
                }}
            />
            <Stack.Screen
                name={AUTH_ROUTES.SIGNUP}
                component={SignupScreen}
                options={{
                }}
            />
        </Stack.Navigator>
    );
}

export default AuthNavigator;
