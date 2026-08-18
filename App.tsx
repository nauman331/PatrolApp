import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { initNfc } from './src/services/nfcReader';
import locationService from './src/services/LocationService';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './src/store/store';
import type { RootState } from './src/store/store';
import { Colors } from './src/theme';
import { syncAuthTokensToStorage } from './src/services/savedLogin';
import SplashScreen from './src/screens/Splashscreen';

function AuthRehydrationSync() {
  useEffect(() => {
    const syncFromStore = () => {
      const { token, guardId } = store.getState().auth;
      void syncAuthTokensToStorage(token, guardId);
    };

    if (persistor.getState().bootstrapped) {
      syncFromStore();
    }

    const unsubscribe = persistor.subscribe(() => {
      if (persistor.getState().bootstrapped) {
        syncFromStore();
      }
    });

    return unsubscribe;
  }, []);

  return null;
}

/**
 * Navigation Container Component
 * Wraps the RootNavigator with React Navigation setup
 */
function AppNavigator() {
  const [isBooting, setIsBooting] = useState(true);
  const userRole = useSelector(
    (state: RootState) => state?.auth?.userRole ?? null,
  );

  return (
    <NavigationContainer>
      <AuthRehydrationSync />
      <RootNavigator
        userRole={userRole}
        isLoading={isBooting}
        onSplashFinish={() => setIsBooting(false)}
      />
    </NavigationContainer>
  );
}

/**
 * Root App Component
 * Sets up providers and global configuration
 * Structure:
 * - SafeAreaProvider: Handles safe area insets
 * - AuthProvider: Manages authentication state
 * - NavigationContainer: React Navigation root
 */
export default function App() {
  useEffect(() => {
    initNfc();
    locationService.startTracking();
    return () => locationService.stopTracking();
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Provider store={store}>
        <PersistGate
          loading={null}
          persistor={persistor}
        >
          <View style={styles.root}>
            <StatusBar
              barStyle="light-content"
              backgroundColor={Colors.headerStart}
              translucent={false}
            />
            <AppNavigator />
          </View>
        </PersistGate>
      </Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
});