import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { initNfc } from './src/services/nfcReader';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { Provider } from 'react-redux';
import { useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from './src/store/store';
import { Colors } from './src/theme';

/**
 * Navigation Container Component
 * Wraps the RootNavigator with React Navigation setup
 */
function AppNavigator() {
  const userRole = useSelector((state: any) => state?.auth?.userRole ?? null);

  return (
    <NavigationContainer>
      <RootNavigator userRole={userRole} isLoading={false} />
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
  }, []);

  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
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
});