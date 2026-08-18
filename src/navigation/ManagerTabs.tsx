import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { NavBar } from '../components';
import { Home, Users, ClipboardList, Calendar, User } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

// Import the manager tab screens
import {
    ManagerDashboard,
    ManagerGuardsScreen,
    ManagerReportsScreen,
    ManagerRosterScreen,
} from '../screens/manager';
import ProfileScreen from '../screens/ProfileScreen';

import { MANAGER_BOTTOM_TAB_ROUTES } from './constants';

/**
 * ManagerTabs - Shared Layout for the main Manager application tabs
 */
export default function ManagerTabs() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom || initialWindowMetrics?.insets?.bottom || 0;
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const targetScreen = route.params?.screen || route.name;
    if (targetScreen) {
      const idx = MANAGER_BOTTOM_TAB_ROUTES.indexOf(targetScreen as any);
      if (idx !== -1) {
        setActiveIndex(idx);
        if (route.params?.screen) {
          navigation.setParams({ screen: undefined });
        }
      }
    }
  }, [route.params?.screen, route.name, navigation]);

  const handleTabPress = (index: number) => {
    setActiveIndex(index);
  };

  const renderScreen = (index: number) => {
    const isVisible = activeIndex === index;
    return (
      <View
        key={`mgr-tab-${index}`}
        style={[styles.screenWrapper, !isVisible && styles.hidden]}
        pointerEvents={isVisible ? 'auto' : 'none'}
      >
        {index === 0 && <ManagerDashboard />}
        {index === 1 && <ManagerGuardsScreen />}
        {index === 2 && <ManagerReportsScreen />}
        {index === 3 && <ManagerRosterScreen />}
        {index === 4 && <ProfileScreen />}
      </View>
    );
  };

  const navItems = useMemo(() => [
    { icon: Home, label: 'Dashboard', active: activeIndex === 0 },
    { icon: Users, label: 'Guards', active: activeIndex === 1 },
    { icon: ClipboardList, label: 'Reports', active: activeIndex === 2 },
    { icon: Calendar, label: 'Roster', active: activeIndex === 3 },
    { icon: User, label: 'Profile', active: activeIndex === 4 },
  ], [activeIndex]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />

      <View style={styles.content}>
        {MANAGER_BOTTOM_TAB_ROUTES.map((_, i) => renderScreen(i))}
      </View>

      <View style={[styles.navWrapper, { paddingBottom: bottomInset }]}>
        <NavBar
          variant="mgr"
          items={navItems}
          onPress={handleTabPress}
        />
      </View>
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
    backgroundColor: Colors.navBgMgr,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  }
});
