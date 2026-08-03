import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { NavBar } from '../components';
import { Home, Route, AlertTriangle, ClipboardList, User } from 'lucide-react-native';

// Import the tab screens
import GuardDashboard from '../screens/GuardDashboard';
import PatrolTimeline from '../screens/PatrolTimeline';
import IncidentsScreen from '../screens/IncidentsScreen';
import ShiftsScreen from '../screens/ShiftsScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { GUARD_BOTTOM_TAB_ROUTES } from './constants';
import { useRoute } from '@react-navigation/native';

/**
 * GuardTabs - Shared Layout for the main Guard application tabs
 *
 * This component acts as a persistent host for the main navigation screens.
 * By rendering screens inside a single component and switching visibility,
 * we prevent unnecessary re-renders of the NavBar and SafeArea wrappers.
 */
export default function GuardTabs() {
  const route = useRoute<any>();

  // Use local state to manage the active tab
  const [activeIndex, setActiveIndex] = useState(0);

  // Sync state if navigation happens via params (e.g. from navigateGuardBottomTab)
  useEffect(() => {
    const targetScreen = route.params?.screen;
    if (targetScreen) {
        const idx = GUARD_BOTTOM_TAB_ROUTES.indexOf(targetScreen as any);
        if (idx !== -1 && idx !== activeIndex) {
            setActiveIndex(idx);
        }
    }
  }, [route.params?.screen, activeIndex]);

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
  };

  /**
   * We render all screens but only show the active one.
   * This preserves the state of inactive tabs (scroll position, etc).
   */
  const renderScreen = (index: number) => {
    const isVisible = activeIndex === index;

    return (
      <View
        key={`tab-screen-${index}`}
        style={[styles.screenWrapper, !isVisible && styles.hidden]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        {index === 0 && <GuardDashboard />}
        {index === 1 && <PatrolTimeline />}
        {index === 2 && <IncidentsScreen />}
        {index === 3 && <ShiftsScreen />}
        {index === 4 && <ProfileScreen />}
      </View>
    );
  };

  const navItems = useMemo(() => [
    { icon: Home, label: 'Home', active: activeIndex === 0 },
    { icon: Route, label: 'Patrol', active: activeIndex === 1 },
    { icon: AlertTriangle, label: 'Incidents', active: activeIndex === 2 },
    { icon: ClipboardList, label: 'Shifts', active: activeIndex === 3 },
    { icon: User, label: 'Profile', active: activeIndex === 4 },
  ], [activeIndex]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />

      <View style={styles.content}>
        {GUARD_BOTTOM_TAB_ROUTES.map((_, i) => renderScreen(i))}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.navWrapper}>
        <NavBar
          items={navItems}
          onPress={handleTabPress}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgAlt,
  },
  content: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  hidden: {
    display: 'none',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  navWrapper: {
    backgroundColor: Colors.navBg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  }
});
