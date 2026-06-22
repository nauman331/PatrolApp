import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSizes, Radii, Shadows, Spacing } from '../../theme';
import { SectionHeader, StatCard } from '../../components';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import { ManagerDashboardShimmer, ShimmerBox } from '../../components/Shimmer';
import {
  Bell,
  Users,
  Footprints,
  AlertTriangle,
  MapPin,
  Clock,
  ChevronRight,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { useManagerNavigation } from '../../navigation/utils';
import { MANAGER_ROUTES } from '../../navigation/constants';
import { ManagerNavBar, MANAGER_TAB_INDEX, sharedStyles } from './managerShared';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchManagerDashboard,
  selectManagerDashboard,
  selectManagerDashboardError,
  selectManagerDashboardLoading,
} from '../../store/slices/managerDashboardSlice';
import type {
  ManagerActiveGuard,
  ManagerMissedPatrolAlert,
} from '../../services/managerApi';

type OverviewCard = {
  icon: LucideIcon;
  value: string;
  label: string;
  bgColor: string;
};

const statusDotColor: Record<string, string> = {
  on_duty: Colors.success,
  on: Colors.success,
  idle: Colors.warning,
  break: Colors.warning,
  off_duty: Colors.danger,
  off: Colors.danger,
};

const sevColor: Record<string, string> = {
  high: Colors.danger,
  medium: Colors.warning,
  low: Colors.success,
};

const guardAvatarPalette = [
  { bg: Colors.warningLight, color: Colors.warning },
  { bg: Colors.accentLight, color: Colors.accent },
  { bg: Colors.dangerLight, color: Colors.danger },
  { bg: Colors.successLight, color: Colors.success },
  { bg: Colors.infoLight, color: Colors.info },
];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatTodayLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || 'Manager';
}

function mapGuardStatusDot(guard: ManagerActiveGuard): string {
  if (guard.status_color === 'green') return Colors.success;
  if (guard.status_color === 'yellow' || guard.status_color === 'orange') {
    return Colors.warning;
  }
  if (guard.status_color === 'red') return Colors.danger;
  return statusDotColor[guard.status] ?? Colors.textMuted;
}

function mapSeverityColor(severity: string): string {
  return sevColor[severity.toLowerCase()] ?? Colors.textMuted;
}

function getMissedAlertSubtitle(alert: ManagerMissedPatrolAlert): string {
  return `${alert.location} · ${alert.time}`;
}

export default function ManagerDashboard() {
  const navigation = useManagerNavigation();
  const dispatch = useAppDispatch();
  const dashboard = useAppSelector(selectManagerDashboard);
  const loading = useAppSelector(selectManagerDashboardLoading);
  const error = useAppSelector(selectManagerDashboardError);
  const [refreshing, setRefreshing] = useState(false);

  const refreshDashboard = useCallback(() => {
    dispatch(fetchManagerDashboard());
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchManagerDashboard());
    setRefreshing(false);
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
    }, [refreshDashboard]),
  );

  const managerInfo = dashboard?.manager_info;
  const statistics = dashboard?.statistics;
  const managerName = managerInfo?.name ?? 'Operations Manager';
  const greetingName = firstName(managerName);

  const overviewCards = useMemo<OverviewCard[]>(() => {
    if (!statistics) return [];

    return [
      {
        icon: Users,
        value: String(statistics.guards_on_duty.count),
        label: 'Guards On Duty',
        bgColor: Colors.accentLight,
      },
      {
        icon: Footprints,
        value: String(statistics.patrols_today.count),
        label: 'Patrols Today',
        bgColor: Colors.warningLight,
      },
      {
        icon: AlertTriangle,
        value: String(statistics.open_incidents.count),
        label: 'Open Incidents',
        bgColor: Colors.dangerLight,
      },
      {
        icon: MapPin,
        value: String(statistics.active_sites.count),
        label: 'Active Sites',
        bgColor: Colors.successLight,
      },
    ];
  }, [statistics]);

  const missedAlerts = dashboard?.missed_patrol_alerts ?? [];
  const recentIncidents = dashboard?.recent_incidents ?? [];
  const activeGuards = dashboard?.active_guards ?? [];
  const showContentShimmer = loading && !dashboard;

  const listStickyHeaderIndices = useMemo(() => {
    const alertsCount = missedAlerts.length === 0 ? 1 : missedAlerts.length;
    const incidentsCount =
      recentIncidents.length === 0 ? 1 : recentIncidents.length;
    const incidentsHeaderIndex = 1 + alertsCount;
    const guardsHeaderIndex = incidentsHeaderIndex + 1 + incidentsCount;
    return [0, incidentsHeaderIndex, guardsHeaderIndex];
  }, [missedAlerts.length, recentIncidents.length]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerDecor} />
          <View style={styles.topRow}>
            <View style={styles.managerInfo}>
              <TouchableOpacity
                onPress={() => navigation.navigate(MANAGER_ROUTES.PROFILE)}
              >
                <View style={styles.avatar}>
                  <User size={18} color="white" />
                </View>
              </TouchableOpacity>
              <View style={styles.managerTextWrap}>
                {loading && !dashboard ? (
                  <ShimmerBox width={120} height={13} tone="dark" borderRadius={6} />
                ) : (
                  <Text style={styles.managerName} numberOfLines={1}>
                    {managerName}
                  </Text>
                )}
                <Text style={styles.managerRole}>
                  {managerInfo?.role ?? 'Operations Manager'}
                </Text>
              </View>
            </View>
            <View style={styles.notifBtn}>
              <Bell size={20} color="white" />
              <View style={styles.notifDot} />
            </View>
          </View>
          <Text style={styles.greet}>{getTimeGreeting()},</Text>
          {loading && !dashboard ? (
            <ShimmerBox
              width={110}
              height={24}
              tone="dark"
              borderRadius={8}
              style={styles.greetShimmer}
            />
          ) : (
            <Text style={styles.greetAccent}>{greetingName}!</Text>
          )}
          <Text style={styles.greetSub}>
            {managerInfo?.date_label ?? formatTodayLabel()}
          </Text>
        </View>

        <View style={styles.body}>
          {error ? (
            <View style={styles.errorWrap}>
              <AuthErrorBanner message={error} />
            </View>
          ) : null}

          {showContentShimmer ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              <ManagerDashboardShimmer includeHeader={false} />
            </ScrollView>
          ) : (
            <>
              <View style={styles.statsGrid}>
                {overviewCards.map((item, i) => (
                  <StatCard
                    key={i}
                    icon={item.icon}
                    value={item.value}
                    label={item.label}
                    bgColor={item.bgColor}
                  />
                ))}
              </View>
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                stickyHeaderIndices={listStickyHeaderIndices}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              >
                <View style={sharedStyles.stickySectionHeader}>
                  <SectionHeader
                    title="Missed Patrol Alerts"
                    action="View All →"
                    dark={false}
                  />
                </View>
                {missedAlerts.length === 0 ? (
                  <Text style={styles.emptyText}>No missed patrol alerts.</Text>
                ) : (
                  missedAlerts.map((alert, index) => (
                    <View
                      key={`alert-${alert.guard_name}-${alert.time}-${index}`}
                      style={[styles.alertRow, Shadows.card]}
                    >
                      <View style={styles.alertIcon}>
                        <Clock size={16} color={Colors.danger} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.alertTitle}>{alert.guard_name}</Text>
                        <Text style={styles.alertSub}>
                          {getMissedAlertSubtitle(alert)}
                        </Text>
                      </View>
                      <Text style={styles.alertBadge}>{alert.status}</Text>
                    </View>
                  ))
                )}

                <View style={sharedStyles.stickySectionHeader}>
                  <SectionHeader title="Recent Incidents" action="Reports →" />
                </View>
                {recentIncidents.length === 0 ? (
                  <Text style={styles.emptyText}>No recent incidents.</Text>
                ) : (
                  recentIncidents.map(inc => (
                    <TouchableOpacity
                      key={inc.id}
                      style={[styles.incRow, Shadows.card]}
                      onPress={() =>
                        navigation.navigate(MANAGER_ROUTES.INCIDENT_DETAIL, {
                          incidentId: inc.id,
                        })
                      }
                    >
                      <View
                        style={[
                          styles.sevDot,
                          { backgroundColor: mapSeverityColor(inc.severity) },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.incTitle}>{inc.title}</Text>
                        <Text style={styles.incSub}>
                          {inc.location} · {inc.time}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  ))
                )}

                <View style={sharedStyles.stickySectionHeader}>
                  <SectionHeader title="Active Guards" action="Guards →" />
                </View>
                {activeGuards.length === 0 ? (
                  <Text style={styles.emptyText}>No active guards right now.</Text>
                ) : (
                  activeGuards.map((guard, index) => {
                    const palette =
                      guardAvatarPalette[index % guardAvatarPalette.length];
                    return (
                      <TouchableOpacity
                        key={guard.id}
                        style={[styles.guardRow, Shadows.card]}
                        onPress={() =>
                          navigation.navigate(MANAGER_ROUTES.GUARD_DETAILS, {
                            guardId: String(guard.id),
                            name: guard.name,
                          })
                        }
                      >
                        <View
                          style={[
                            styles.guardAv,
                            { backgroundColor: palette.bg },
                          ]}
                        >
                          <Text
                            style={[styles.guardAvText, { color: palette.color }]}
                          >
                            {guard.initials}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.guardName}>{guard.name}</Text>
                          <Text style={styles.guardSite}>{guard.site_name}</Text>
                        </View>
                        <View style={styles.guardStatus}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: mapGuardStatusDot(guard) },
                            ]}
                          />
                          <Text style={styles.guardPatrols}>
                            {guard.status_text}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </>
          )}
        </View>

        <ManagerNavBar activeIndex={MANAGER_TAB_INDEX.DASHBOARD} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgAlt },
  safe: { flex: 1 },
  header: {
    backgroundColor: Colors.headerStart,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(121,31,61,0.10)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  managerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  managerTextWrap: { flex: 1, minWidth: 0 },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerName: { fontSize: 13, fontWeight: '700', color: Colors.white },
  managerRole: { fontSize: 10, color: Colors.textOnDarkMuted },
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
    borderColor: Colors.headerStart,
  },
  greet: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 28,
  },
  greetAccent: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.accent,
    lineHeight: 28,
    marginTop: 2,
  },
  greetShimmer: {
    marginTop: 4,
    marginBottom: 2,
  },
  greetSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  body: {
    flex: 1,
    paddingTop: Spacing.sm,
    marginTop: 0,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16, flexGrow: 0, paddingHorizontal: Spacing.md },
  errorWrap: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.xs,
    marginBottom: 8,
    paddingHorizontal: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  alertRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  alertSub: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  alertBadge: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.danger,
    letterSpacing: 0.5,
  },
  incRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  incTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  incSub: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  guardRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guardAv: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardAvText: { fontSize: 12, fontWeight: '800' },
  guardName: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  guardSite: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  guardStatus: { alignItems: 'flex-end' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginBottom: 3 },
  guardPatrols: { fontSize: FontSizes.xs, color: Colors.textMuted },
});
