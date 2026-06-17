import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { NavBar } from '../../components';
import { useManagerNavigation } from '../../navigation/utils';
import { navigateManagerBottomTab } from '../../navigation/constants';

export const MANAGER_PAGE_BG = '#f0f4ff';

export const MANAGER_TAB_INDEX = {
  DASHBOARD: 0,
  GUARDS: 1,
  REPORTS: 2,
  ROSTER: 3,
  PROFILE: 4,
} as const;

import {
  Home,
  Users,
  ClipboardList,
  Calendar,
  User,
} from 'lucide-react-native';

export function buildManagerNavItems(activeIndex: number) {
  const tabs = [
    { icon: Home, label: 'Dashboard' },
    { icon: Users, label: 'Guards' },
    { icon: ClipboardList, label: 'Reports' },
    { icon: Calendar, label: 'Roster' },
    { icon: User, label: 'Profile' },
  ];
  return tabs.map((tab, i) => ({ ...tab, active: i === activeIndex }));
}

interface ManagerNavBarProps {
  activeIndex: number;
}

export function ManagerNavBar({ activeIndex }: ManagerNavBarProps) {
  const navigation = useManagerNavigation();
  return (
    <NavBar
      variant="mgr"
      items={buildManagerNavItems(activeIndex)}
      onPress={i => navigateManagerBottomTab(navigation, i)}
    />
  );
}

interface ManagerTabShellProps {
  activeIndex: number;
  children: React.ReactNode;
  scroll?: boolean;
}

export function ManagerTabShell({
  activeIndex,
  children,
}: ManagerTabShellProps) {
  return (
    <View style={sharedStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.mgrHeaderStart} />
      <SafeAreaView style={sharedStyles.safe} edges={['top', 'bottom']}>
        {children}
        <ManagerNavBar activeIndex={activeIndex} />
      </SafeAreaView>
    </View>
  );
}

interface ManagerHeaderProps {
  badge?: string;
  title: React.ReactNode;
  subtitle?: string;
  showNotif?: boolean;
}

export function ManagerHeader({
  badge = 'MANAGER',
  title,
  subtitle,
  showNotif = true,
}: ManagerHeaderProps) {
  return (
    <View style={sharedStyles.header}>
      <View style={sharedStyles.headerDecor} />
      <View style={sharedStyles.topRow}>
        <View style={sharedStyles.mgrBadge}>
          <Text style={sharedStyles.mgrBadgeText}>{badge}</Text>
        </View>
        {showNotif && (
          <TouchableOpacity style={sharedStyles.notifBtn}>
            <Bell size={18} color="#fff" />
            <View style={sharedStyles.notifDot} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={sharedStyles.greet}>{title}</Text>
      {subtitle ? <Text style={sharedStyles.dateLine}>{subtitle}</Text> : null}
    </View>
  );
}

interface ManagerStackHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ManagerStackHeader({
  title,
  subtitle,
  onBack,
  rightAction,
}: ManagerStackHeaderProps) {
  const navigation = useManagerNavigation();
  return (
    <View style={sharedStyles.stackHeader}>
      <View style={sharedStyles.stackLeft}>
        <TouchableOpacity
          style={sharedStyles.backBtn}
          onPress={onBack ?? (() => navigation.goBack())}
        >
          <ArrowLeft size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={sharedStyles.stackTitle}>{title}</Text>
          {subtitle ? (
            <Text style={sharedStyles.stackSub}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {rightAction}
    </View>
  );
}

export function ManagerCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[sharedStyles.card, Shadows.card, style]}>{children}</View>
  );
}

export const sharedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MANAGER_PAGE_BG },
  safe: { flex: 1 },
  body: { padding: 14, flex: 1 },

  header: {
    backgroundColor: Colors.mgrHeaderStart,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 52,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(59,130,246,0.10)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  mgrBadge: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  mgrBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#60a5fa',
    letterSpacing: 1,
  },
  notifBtn: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    width: 8,
    height: 8,
    backgroundColor: Colors.accent,
    borderRadius: 4,
    position: 'absolute',
    top: 5,
    right: 5,
    borderWidth: 1.5,
    borderColor: Colors.mgrHeaderStart,
  },
  greet: { fontSize: 19, fontWeight: '800', color: Colors.white },
  dateLine: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 3,
  },

  stackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 14,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stackLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 34,
    height: 34,
    backgroundColor: Colors.bgAlt,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  stackSub: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.infoLight,
    borderColor: '#93c5fd',
  },
  chipText: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: '#1a56db' },
});
