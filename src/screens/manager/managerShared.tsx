import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  type ViewStyle,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { Colors, FontSizes, Radii, Shadows, Spacing } from '../../theme';
import { NavBar } from '../../components';
import { useManagerNavigation } from '../../navigation/utils';
import { navigateManagerBottomTab } from '../../navigation/constants';
import { formatFullDisplayDate } from '../../services/guardJobsMapper';

export const MANAGER_PAGE_BG = Colors.bgAlt;

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
}

/** Legacy shell — prefer ManagerCompactTabShell for tab screens. */
export function ManagerTabShell({ activeIndex, children }: ManagerTabShellProps) {
  return (
    <View style={sharedStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />
      <SafeAreaView style={sharedStyles.safe} edges={['top', 'bottom']}>
        {children}
        <ManagerNavBar activeIndex={activeIndex} />
      </SafeAreaView>
    </View>
  );
}

interface ManagerPageHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ManagerPageHeader({
  title,
  subtitle,
  right,
}: ManagerPageHeaderProps) {
  return (
    <View style={sharedStyles.pageHeader}>
      <View style={sharedStyles.pageHdrRow}>
        <Text style={sharedStyles.pageHdrTitle}>{title}</Text>
        {right ?? <View style={sharedStyles.headerSpacer} />}
      </View>
      <Text style={sharedStyles.pageHdrSub}>
        {subtitle ?? formatFullDisplayDate()}
      </Text>
    </View>
  );
}

interface ManagerCompactTabShellProps {
  activeIndex: number;
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export function ManagerCompactTabShell({
  activeIndex,
  title,
  subtitle,
  headerRight,
  children,
}: ManagerCompactTabShellProps) {
  return (
    <View style={sharedStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />
      <SafeAreaView style={sharedStyles.safeTop} edges={['top']}>
        <ManagerPageHeader
          title={title}
          subtitle={subtitle}
          right={headerRight}
        />
      </SafeAreaView>
      <SafeAreaView style={sharedStyles.safeBody} edges={['bottom']}>
        <View style={sharedStyles.tabBody}>{children}</View>
        <ManagerNavBar activeIndex={activeIndex} />
      </SafeAreaView>
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
    <View style={sharedStyles.pageHeader}>
      <View style={sharedStyles.pageHdrRow}>
        <View style={sharedStyles.stackLeft}>
          <TouchableOpacity
            style={sharedStyles.stackBackBtn}
            onPress={onBack ?? (() => navigation.goBack())}
          >
            <ArrowLeft size={18} color={Colors.white} />
          </TouchableOpacity>
          <View style={sharedStyles.stackTitleWrap}>
            <Text style={sharedStyles.pageHdrTitle}>{title}</Text>
            {subtitle ? (
              <Text style={sharedStyles.pageHdrSub}>{subtitle}</Text>
            ) : null}
          </View>
        </View>
        {rightAction}
      </View>
    </View>
  );
}

interface ManagerStackShellProps {
  header: React.ReactNode;
  children: React.ReactNode;
}

export function ManagerStackShell({ header, children }: ManagerStackShellProps) {
  return (
    <View style={sharedStyles.stackContainer}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />
      <SafeAreaView style={sharedStyles.safeTop} edges={['top']}>
        {header}
      </SafeAreaView>
      <SafeAreaView style={sharedStyles.safeBody} edges={['bottom']}>
        {children}
      </SafeAreaView>
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

interface ManagerListLayoutProps {
  toolbar?: React.ReactNode;
  /** Pinned block above the scroll area (e.g. calendar grid). */
  fixedContent?: React.ReactNode;
  /** Pinned section title above the scrollable list rows. */
  listHeader?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  stickyHeaderIndices?: number[];
  children: React.ReactNode;
}

/** Fixed toolbar + optional fixed block + scrollable list body only. */
export function ManagerListLayout({
  toolbar,
  fixedContent,
  listHeader,
  refreshing = false,
  onRefresh,
  onEndReached,
  stickyHeaderIndices,
  children,
}: ManagerListLayoutProps) {
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!onEndReached) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 80) {
      onEndReached();
    }
  };

  return (
    <View style={sharedStyles.listScreen}>
      {toolbar ? (
        <View style={sharedStyles.listToolbar}>{toolbar}</View>
      ) : null}
      {fixedContent ? (
        <View style={sharedStyles.listFixed}>{fixedContent}</View>
      ) : null}
      {listHeader ? (
        <View style={sharedStyles.listHeader}>{listHeader}</View>
      ) : null}
      <ScrollView
        style={sharedStyles.listScroll}
        contentContainerStyle={sharedStyles.listScrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={stickyHeaderIndices}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {children}
      </ScrollView>
    </View>
  );
}

interface ManagerStackListLayoutProps {
  fixedContent?: React.ReactNode;
  listHeader?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  stickyHeaderIndices?: number[];
  children: React.ReactNode;
}

/** Stack screens: optional fixed top section + scrollable remainder. */
export function ManagerStackListLayout({
  fixedContent,
  listHeader,
  refreshing = false,
  onRefresh,
  stickyHeaderIndices,
  children,
}: ManagerStackListLayoutProps) {
  return (
    <View style={sharedStyles.listScreen}>
      {fixedContent ? (
        <View style={sharedStyles.listFixed}>{fixedContent}</View>
      ) : null}
      {listHeader ? (
        <View style={sharedStyles.listHeader}>{listHeader}</View>
      ) : null}
      <ScrollView
        style={sharedStyles.listScroll}
        contentContainerStyle={sharedStyles.listScrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={stickyHeaderIndices}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

export const sharedStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.headerStart },
  stackContainer: { flex: 1, backgroundColor: Colors.headerStart },
  safe: { flex: 1, backgroundColor: MANAGER_PAGE_BG },
  safeTop: { backgroundColor: Colors.headerStart },
  safeBody: { flex: 1, backgroundColor: MANAGER_PAGE_BG },
  /** Use on ScrollView contentContainerStyle — no flex (avoids list stuck at bottom). */
  scrollContent: { padding: 14, paddingBottom: 16, flexGrow: 0 },
  /** Use on flex child Views that should fill remaining space. */
  body: { padding: 14, flex: 1 },

  tabBody: { flex: 1 },

  listScreen: { flex: 1 },
  listToolbar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xs,
    backgroundColor: MANAGER_PAGE_BG,
  },
  listFixed: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    backgroundColor: MANAGER_PAGE_BG,
  },
  listHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    backgroundColor: MANAGER_PAGE_BG,
  },
  stickySectionHeader: {
    backgroundColor: MANAGER_PAGE_BG,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  listScroll: { flex: 1 },
  listScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexGrow: 0,
  },

  pageHeader: {
    backgroundColor: Colors.headerStart,
    paddingHorizontal: 18,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radii.xl,
    borderBottomRightRadius: Radii.xl,
  },
  pageHdrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  pageHdrTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  pageHdrSub: { fontSize: FontSizes.xs, color: 'rgba(255,255,255,0.35)' },
  headerSpacer: { width: 40 },

  stackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  stackBackBtn: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackTitleWrap: { flex: 1, minWidth: 0 },

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
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentAlpha25,
  },
  chipText: { fontSize: FontSizes.xs, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.accent },
});
