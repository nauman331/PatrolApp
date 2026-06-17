import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radii, Spacing, Shadows } from '../theme';
import { NavBar, SectionHeader, StatCard, PatrolItem } from '../components';
import {
  DashboardShiftShimmer,
  DashboardStatsShimmer,
  ShimmerBox,
  PatrolListShimmer,
} from '../components/Shimmer';
import {
  Bell,
  User,
  ClipboardList,
  AlertTriangle,
  Camera,
  Radio,
  Home,
  Route,
  Footprints,
  ScanLine,
} from 'lucide-react-native';
import {
  findActiveShift,
  mapApiJobToShift,
  type MappedShift,
} from '../services/guardJobsMapper';
import {
  getActiveShiftSession,
  type ActiveShiftSession,
  promptCheckInRequired,
} from '../services/activeShiftSession';
import { useFocusEffect } from '@react-navigation/native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES, navigateGuardBottomTab } from '../navigation/constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchGuardJobs,
  selectJobsItems,
  selectJobsLoading,
} from '../store/slices/jobsSlice';
import {
  getGuardDashboardData,
  type GuardDashboardData,
} from '../services/guardApi';

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
  return part || 'Guard';
}

const PATROL_ITEM_HEIGHT = 67;
const PATROL_LIST_MAX_HEIGHT = PATROL_ITEM_HEIGHT * 3;

export default function GuardDashboard() {
  const navigation = useGuardNavigation();
  const dispatch = useAppDispatch();
  const guardId = useAppSelector(state => state.auth?.guardId ?? null);
  const jobsRaw = useAppSelector(selectJobsItems);
  const jobsLoading = useAppSelector(selectJobsLoading);

  const [dashboard, setDashboard] = useState<GuardDashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<MappedShift | null>(null);
  const [todayPatrols, setTodayPatrols] = useState<MappedShift[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveShiftSession | null>(
    null,
  );
  const appStateRef = useRef(AppState.currentState);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    const result = await getGuardDashboardData(guardId);
    if (result.success && result.data) {
      setDashboard(result.data);
    }
    setDashboardLoading(false);
  }, [guardId]);

  const refreshDashboard = useCallback(() => {
    dispatch(fetchGuardJobs());
    getActiveShiftSession().then(setActiveSession);
    loadDashboard();
  }, [dispatch, loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
    }, [refreshDashboard]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const prev = appStateRef.current;
        appStateRef.current = nextState;
        if (
          (prev === 'background' || prev === 'inactive') &&
          nextState === 'active'
        ) {
          refreshDashboard();
        }
      },
    );
    return () => subscription.remove();
  }, [refreshDashboard]);

  const hasOngoingShift =
    activeSession != null || activeShift?.status === 'active';

  useEffect(() => {
    if (!jobsRaw.length) {
      setTodayPatrols([]);
      setActiveShift(null);
      return;
    }

    setActiveShift(findActiveShift(jobsRaw));

    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const mappedToday = jobsRaw
      .filter((job: any) => {
        const d =
          job?.shift_date ??
          job?.date ??
          job?.shiftDate ??
          job?.scheduled_date;
        return typeof d === 'string' ? d === localToday : false;
      })
      .map(mapApiJobToShift)
      .filter((shift: MappedShift | null): shift is MappedShift =>
        Boolean(shift),
      );

    const fallbackMapped = jobsRaw
      .map(mapApiJobToShift)
      .filter((shift: MappedShift | null): shift is MappedShift =>
        Boolean(shift),
      );

    setTodayPatrols(mappedToday.length > 0 ? mappedToday : fallbackMapped);
  }, [jobsRaw]);

  const guardName = dashboard?.guard.name ?? 'Security Guard';
  const greetingName = firstName(guardName);

  const shiftSite =
    activeSession?.site ?? activeShift?.site ?? 'Active shift site';
  const shiftTime = activeShift?.time ?? '—';

  const openOngoingShift = async () => {
    const session = await getActiveShiftSession();
    if (session) {
      navigation.navigate(GUARD_ROUTES.ONGOING_SHIFT, session);
      return;
    }
    if (activeShift?.status === 'active') {
      navigation.navigate(GUARD_ROUTES.ONGOING_SHIFT, {
        rosterId: activeShift.rosterId,
        site: activeShift.site,
        zones: activeShift.zones,
        signInTime: new Date().toISOString(),
        shiftId: activeShift.id,
      });
    }
  };

  const requireActiveShift = (action: () => void) => {
    if (hasOngoingShift) {
      action();
      return;
    }
    Alert.alert(
      'Shift not active',
      'Please check in to a shift from the Shifts list first.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to Shifts',
          onPress: () => navigation.navigate(GUARD_ROUTES.SHIFTS),
        },
      ],
    );
  };

  const requireCheckedInShift = (action: (session: ActiveShiftSession) => void) => {
    if (activeSession != null) {
      action(activeSession);
      return;
    }
    promptCheckInRequired(() => navigation.navigate(GUARD_ROUTES.SHIFTS));
  };

  const patrolContext = useMemo(
    () => ({
      rosterId: activeSession?.rosterId ?? activeShift?.rosterId,
      siteId: activeSession?.siteId,
      site: activeSession?.site ?? activeShift?.site,
    }),
    [activeSession, activeShift],
  );

  const handleQuickAction = (key: string) => {
    switch (key) {
      case 'patrol':
        requireCheckedInShift(session =>
          navigation.navigate(GUARD_ROUTES.PATROL_TIMELINE, {
            rosterId: session.rosterId,
            siteId: session.siteId,
            site: session.site,
          }),
        );
        break;
      case 'incident':
        requireActiveShift(() =>
          navigation.navigate(GUARD_ROUTES.ADD_INCIDENT, {
            rosterId: patrolContext.rosterId,
            siteId: patrolContext.siteId,
          }),
        );
        break;
      case 'sop':
        navigation.navigate(GUARD_ROUTES.SOPS);
        break;
      case 'nfc':
        requireCheckedInShift(session =>
          navigation.navigate(GUARD_ROUTES.PATROL_TIMELINE, {
            rosterId: session.rosterId,
            siteId: session.siteId,
            site: session.site,
          }),
        );
        break;
      default:
        break;
    }
  };

  const quickActions = [
    {
      key: 'patrol',
      icon: Camera,
      label: 'Patrol Report',
      bg: Colors.accentLight,
    },
    {
      key: 'incident',
      icon: AlertTriangle,
      label: 'Incident',
      bg: Colors.dangerLight,
    },
    {
      key: 'sop',
      icon: ClipboardList,
      label: 'View SOP',
      bg: Colors.infoLight,
    },
    {
      key: 'nfc',
      icon: Radio,
      label: 'NFC Scan',
      bg: Colors.successLight,
    },
  ];

  const statsLoading = dashboardLoading;
  const showShiftShimmer = jobsLoading;
  const showPatrolShimmer = jobsLoading;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.headerStart}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
            <View style={styles.headerDecor} />
            <View style={styles.topRow}>
              <View style={styles.guardInfo}>
                <TouchableOpacity
                  onPress={() => navigation.navigate(GUARD_ROUTES.PROFILE)}
                >
                  <View style={styles.avatar}>
                    <User size={18} color="white" />
                  </View>
                </TouchableOpacity>
                <View style={styles.guardTextWrap}>
                  {dashboardLoading ? (
                    <ShimmerBox width={120} height={13} tone="dark" borderRadius={6} />
                  ) : (
                    <Text style={styles.guardName} numberOfLines={1}>
                      {guardName}
                    </Text>
                  )}
                  <Text style={styles.guardRole}>Security Guard</Text>
                </View>
              </View>
              <View style={styles.notifBtn}>
                <Bell size={20} color="white" />
                <View style={styles.notifDot} />
              </View>
            </View>
            <Text style={styles.greet}>{getTimeGreeting()},</Text>
            {dashboardLoading ? (
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
            <Text style={styles.greetSub}>{formatTodayLabel()}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.bodyUpper}>
            {showShiftShimmer ? (
              <DashboardShiftShimmer />
            ) : hasOngoingShift ? (
              <TouchableOpacity
                style={[styles.shiftCard, Shadows.card]}
                activeOpacity={0.9}
                onPress={openOngoingShift}
              >
                <View style={styles.shiftLeft}>
                  <Text style={styles.shiftLbl}>ACTIVE SHIFT</Text>
                  <Text style={styles.shiftSite} numberOfLines={2}>
                    {shiftSite}
                  </Text>
                  <Text style={styles.shiftTime} numberOfLines={1}>
                    {shiftTime}
                  </Text>
                </View>
                <View style={styles.shiftRight}>
                  <View style={styles.onBadge}>
                    <Text style={styles.onBadgeText}>● ON DUTY</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={openOngoingShift}
                  >
                    <Text style={styles.continueText}>CONTINUE</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.shiftCard, Shadows.card]}>
                <View style={styles.shiftLeft}>
                  <Text style={styles.shiftLbl}>ACTIVE SHIFT</Text>
                  <Text style={styles.shiftEmptyTitle}>No active shift</Text>
                  <Text style={styles.shiftEmptySub}>
                    Check in from the Shifts list to start your duty.
                  </Text>
                </View>
                <View style={styles.shiftRight}>
                  <TouchableOpacity
                    style={styles.viewShiftsBtn}
                    onPress={() => navigation.navigate(GUARD_ROUTES.SHIFTS)}
                  >
                    <Text style={styles.viewShiftsText}>VIEW SHIFTS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {statsLoading ? (
              <DashboardStatsShimmer />
            ) : (
              <View style={styles.statsGrid}>
                <StatCard
                  icon={Footprints}
                  value={String(dashboard?.patrolling_report_count ?? 0)}
                  label="Patrols Done"
                  bgColor={Colors.accentLight}
                />
                <StatCard
                  icon={AlertTriangle}
                  value={String(dashboard?.incident_report_count ?? 0)}
                  label="Incidents"
                  bgColor={Colors.dangerLight}
                />
                <StatCard
                  icon={ScanLine}
                  value={String(dashboard?.scan_nfc_count ?? 0)}
                  label="NFC Scans"
                  bgColor={Colors.infoLight}
                />
                <StatCard
                  icon={Radio}
                  value={String(dashboard?.scanners_count ?? 0)}
                  label="Scanners"
                  bgColor={Colors.successLight}
                />
              </View>
            )}

            <SectionHeader title="Quick Actions" />
            <View style={styles.qaGrid}>
              {quickActions.map(qa => (
                <TouchableOpacity
                  key={qa.key}
                  style={[styles.qaCard, Shadows.card]}
                  activeOpacity={0.8}
                  onPress={() => handleQuickAction(qa.key)}
                >
                  <View style={[styles.qaIcon, { backgroundColor: qa.bg }]}>
                    <qa.icon size={16} color="#000" />
                  </View>
                  <Text style={styles.qaLabel}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate(GUARD_ROUTES.SHIFTS)}
            >
              <SectionHeader title="Today's Patrols" action="See All" />
            </TouchableOpacity>

            {showPatrolShimmer ? (
              <PatrolListShimmer count={3} />
            ) : todayPatrols.length > 0 ? (
              <ScrollView
                style={styles.patrolScroll}
                contentContainerStyle={styles.patrolScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {todayPatrols.map(patrol => (
                  <PatrolItem
                    key={String(patrol.rosterId)}
                    location={patrol.site}
                    time={patrol.time}
                    status={patrol.status === 'done' ? 'done' : 'pending'}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.patrolMetaText}>No patrols found.</Text>
            )}
          </View>
        </View>

        <NavBar
          items={[
            { icon: Home, label: 'Home', active: true },
            { icon: Route, label: 'Patrol' },
            { icon: AlertTriangle, label: 'Incidents' },
            { icon: ClipboardList, label: 'Shifts' },
            { icon: User, label: 'Profile' },
          ]}
          onPress={i => navigateGuardBottomTab(navigation, i)}
        />
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
    paddingBottom: 56,
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
  guardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  guardTextWrap: { flex: 1, minWidth: 0 },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardName: { fontSize: 13, fontWeight: '700', color: Colors.white },
  guardRole: { fontSize: 10, color: Colors.textOnDarkMuted },
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
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 0,
    marginTop: -10,
  },
  bodyUpper: {
    flexGrow: 0,
  },

  shiftCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 14,
    marginTop: 6,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shiftLeft: {
    flex: 1,
    minWidth: 0,
    paddingRight: 4,
  },
  shiftLbl: {
    fontSize: FontSizes.xs,
    color: '#bbb',
    letterSpacing: 1,
    fontWeight: '700',
  },
  shiftSite: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
    lineHeight: 18,
  },
  shiftTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  shiftEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  shiftEmptySub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 15,
  },
  shiftRight: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  onBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
  },
  onBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.success,
    fontWeight: '700',
  },
  continueBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  continueText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  viewShiftsBtn: {
    backgroundColor: Colors.bgAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  viewShiftsText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },

  qaGrid: { flexDirection: 'row', gap: 7, marginBottom: 14 },
  qaCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 5,
  },
  qaIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaLabel: {
    fontSize: 9,
    color: '#666',
    fontWeight: '600',
    textAlign: 'center',
  },

  patrolScroll: {
    maxHeight: PATROL_LIST_MAX_HEIGHT,
  },
  patrolScrollContent: {
    paddingBottom: 0,
  },
  patrolMetaText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 0,
  },
});
