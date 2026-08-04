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
  formatFullDisplayDate,
  mapApiJobToShift,
  type MappedShift,
} from '../services/guardJobsMapper';
import {
  getActiveShiftSession,
  type ActiveShiftSession,
  promptCheckInRequired,
  saveActiveShiftSession,
} from '../services/activeShiftSession';
import { useFocusEffect } from '@react-navigation/native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES, navigateGuardBottomTab } from '../navigation/constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchGuardDashboard,
  selectDashboardData,
  selectDashboardLoading,
  selectDashboardError,
} from '../store/slices/guardDashboardSlice';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}


function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || 'Guard';
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatElapsed(ms: number) {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function normalizeDate(iso?: string) {
  if (!iso) return new Date();
  const normalized = iso.includes('T') ? iso : iso.replace(' ', 'T');
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date(iso.replace(/-/g, '/'));
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  }
  return d;
}

export default function GuardDashboard() {
  const navigation = useGuardNavigation();
  const dispatch = useAppDispatch();
  const guardId = useAppSelector(state => state.auth?.guardId ?? null);

  const dashboard = useAppSelector(selectDashboardData);
  const dashboardLoading = useAppSelector(selectDashboardLoading);
  const dashboardError = useAppSelector(selectDashboardError);

  const [activeSession, setActiveSession] = useState<ActiveShiftSession | null>(
    null,
  );
  const [elapsed, setElapsed] = useState('00:00:00');
  const appStateRef = useRef(AppState.currentState);

  const loadDashboard = useCallback(async () => {
    // Redux Thunk now handles dashboard loading
    const [resultAction, session] = await Promise.all([
      dispatch(fetchGuardDashboard(guardId)),
      getActiveShiftSession(),
    ]);

    let finalSession = session;

    if (fetchGuardDashboard.fulfilled.match(resultAction)) {
      const data = resultAction.payload;

      // SYNC SESSION: If we have an active shift from API but no local session, save it.
      const apiJobs = data.today_jobs ?? [];
      const apiActiveShift = apiJobs
        .map(mapApiJobToShift)
        .find(shift => shift?.status === 'active');

      if (apiActiveShift) {
        const siteInfo = {
          site_id: Number(apiActiveShift.siteId) || 0,
          emergency_procedures: apiActiveShift.emergency_procedures,
          patrol_checkpoints: apiActiveShift.patrol_checkpoints,
          incident_reporting_guide: apiActiveShift.incident_reporting_guide,
          nfc_scan_protocol: apiActiveShift.nfc_scan_protocol,
          site_map: apiActiveShift.site_map,
          work_instruction: apiActiveShift.work_instruction,
          health_safety_policy: apiActiveShift.health_safety_policy,
        };

        if (!session) {
          const newSession: ActiveShiftSession = {
            rosterId: apiActiveShift.rosterId,
            site: apiActiveShift.site,
            zones: apiActiveShift.zones,
            signInTime: apiActiveShift.signInTime ?? new Date().toISOString(),
            shiftId: String(apiActiveShift.id).startsWith('#')
              ? undefined
              : String(apiActiveShift.id),
            siteId: apiActiveShift.siteId,
            siteInfo,
          };
          await saveActiveShiftSession(newSession);
          finalSession = newSession;
        } else if (!session.siteInfo || JSON.stringify(session.siteInfo) !== JSON.stringify(siteInfo)) {
          // Update existing session with latest site info
          const updatedSession = { ...session, siteInfo };
          await saveActiveShiftSession(updatedSession);
          finalSession = updatedSession;
        }
      }
    }

    setActiveSession(finalSession);
  }, [guardId, dispatch]);

  const refreshDashboard = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

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

  const todayJobs = dashboard?.today_jobs ?? [];

  const todayPatrols = useMemo(
    () =>
      todayJobs
        .map(mapApiJobToShift)
        .filter((shift): shift is MappedShift => Boolean(shift)),
    [todayJobs],
  );

  const activeShift = useMemo(
    () => todayPatrols.find(shift => shift.status === 'active') ?? null,
    [todayPatrols],
  );

  const activeSignInTime = activeShift?.signInTime ?? activeSession?.signInTime;

  useEffect(() => {
    if (!activeSignInTime) {
      setElapsed('00:00:00');
      return;
    }
    const start = normalizeDate(activeSignInTime).getTime();
    const tick = () => {
      const diff = Date.now() - start;
      setElapsed(formatElapsed(diff));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSignInTime]);

  const hasOngoingShift =
    activeSession != null || activeShift?.status === 'active';

  const guardName = dashboard?.guard.name ?? 'Security Guard';
  const greetingName = firstName(guardName);

  const shiftSite =
    activeSession?.site ?? activeShift?.site ?? 'Active shift site';
  const shiftTime = activeShift?.time ?? '—';

  const openOngoingShift = async () => {
    const session = await getActiveShiftSession();
    // Use the API's sign-in time if available, otherwise fallback to local session
    const finalRosterId = activeShift?.rosterId ?? session?.rosterId;
    const finalSignInTime =
      activeShift?.signInTime ?? session?.signInTime ?? new Date().toISOString();

    if (finalRosterId) {
      navigation.navigate(GUARD_ROUTES.ONGOING_SHIFT, {
        rosterId: finalRosterId,
        site: activeShift?.site ?? session?.site ?? 'Site',
        zones: activeShift?.zones ?? session?.zones ?? 'All Zones',
        signInTime: finalSignInTime,
        shiftId: activeShift?.id ?? session?.shiftId,
        siteId: activeShift?.siteId ?? session?.siteId,
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

  const requireCheckedInShift = (
    action: (session: ActiveShiftSession) => void,
  ) => {
    if (activeSession != null) {
      action(activeSession);
      return;
    }

    // Fallback: if we know there's an active shift from API but session state hasn't updated yet
    if (activeShift?.status === 'active') {
      const fallbackSession: ActiveShiftSession = {
        rosterId: activeShift.rosterId,
        site: activeShift.site,
        zones: activeShift.zones,
        signInTime: activeShift.signInTime ?? new Date().toISOString(),
        shiftId: String(activeShift.id).startsWith('#')
          ? undefined
          : String(activeShift.id),
        siteId: activeShift.siteId,
      };
      action(fallbackSession);
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
        requireCheckedInShift(() =>
          navigation.navigate(GUARD_ROUTES.PATROL_TIMELINE),
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
        requireActiveShift(() =>
          navigation.navigate(GUARD_ROUTES.SOPS),
        );
        break;
      case 'nfc':
        requireCheckedInShift(() =>
          navigation.navigate(GUARD_ROUTES.PATROL_TIMELINE),
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
    // {
    //   key: 'nfc',
    //   icon: Radio,
    //   label: 'NFC Scan',
    //   bg: Colors.successLight,
    // },
  ];

  const showShiftShimmer = dashboardLoading;
  const showPatrolShimmer = dashboardLoading;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.headerStart}
      />
      <SafeAreaView style={styles.safe} edges={['top']}>
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
            {/* <View style={styles.notifBtn}>
                <Bell size={20} color="white" />
                <View style={styles.notifDot} />
              </View> */}
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
          <Text style={styles.greetSub}>{formatFullDisplayDate()}</Text>
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
                  <Text style={styles.shiftLbl}>Active Shift • {elapsed}</Text>
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

            {dashboardLoading ? (
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

            <SectionHeader
              title="Today's Shifts"
              action="See All"
              onActionPress={() => navigation.navigate(GUARD_ROUTES.SHIFTS)}
            />

            {showPatrolShimmer ? (
              <PatrolListShimmer count={3} />
            ) : todayPatrols.length > 0 ? (
              <ScrollView
                style={styles.patrolScroll}
                contentContainerStyle={styles.patrolScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {todayPatrols.map((patrol, index) => (
                  <PatrolItem
                    key={String(patrol.rosterId)}
                    location={patrol.site}
                    time={patrol.time}
                    status={patrol.status === 'done' ? 'done' : 'pending'}
                    isLast={index === todayPatrols.length - 1}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.patrolMetaText}>No patrols found.</Text>
            )}
          </View>
        </View>
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
    flex: 1,
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
    flex: 1,
  },
  patrolScrollContent: {
    paddingBottom: Spacing.sm,
  },
  patrolMetaText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 0,
  },
});
