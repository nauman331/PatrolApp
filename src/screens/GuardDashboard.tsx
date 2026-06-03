import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radii, Spacing, Shadows } from '../theme';
import { NavBar, SectionHeader, StatCard, PatrolItem } from '../components';
import {
  DashboardShiftShimmer,
  PatrolListShimmer,
} from '../components/Shimmer';
import {
  Bell,
  User,
  ClipboardList,
  AlertTriangle,
  Camera,
  Radio,
  Shield,
  Home,
  Route,
  Footprints,
  CheckCircle,
} from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { clearAuth } from '../store/slices/authSlice';
import { logout } from '../services/authApi';
import { getGuardMyJobs } from '../services/guardApi';
import {
  findActiveShift,
  mapApiJobToShift,
  type MappedShift,
} from '../services/guardJobsMapper';
import {
  getActiveShiftSession,
  type ActiveShiftSession,
} from '../services/activeShiftSession';
import { useFocusEffect } from '@react-navigation/native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES } from '../navigation/constants';
import type { GuardStackParamList } from '../navigation/types';

interface QuickAction {
  icon: any;
  label: string;
  screen: keyof GuardStackParamList;
  bg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: Camera,
    label: 'Patrol Report',
    screen: GUARD_ROUTES.ADD_PATROL_REPORT,
    bg: Colors.accentLight,
  },
  {
    icon: AlertTriangle,
    label: 'Incident',
    screen: GUARD_ROUTES.ADD_INCIDENT,
    bg: Colors.dangerLight,
  },
  {
    icon: ClipboardList,
    label: 'View SOP',
    screen: GUARD_ROUTES.SHIFTS,
    bg: Colors.infoLight,
  },
  {
    icon: Radio,
    label: 'NFC Scan',
    screen: GUARD_ROUTES.PATROL_TIMELINE,
    bg: Colors.successLight,
  },
];
export default function GuardDashboard() {
  const navigation = useGuardNavigation();
  const dispatch = useDispatch();
  const [jobsLoading, setJobsLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<MappedShift | null>(null);
  const [todayPatrols, setTodayPatrols] = useState<MappedShift[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveShiftSession | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      getActiveShiftSession().then(setActiveSession);
    }, []),
  );

  const hasOngoingShift =
    activeSession != null || activeShift?.status === 'active';

  useEffect(() => {
    let mounted = true;
    (async () => {
      setJobsLoading(true);
      const result = await getGuardMyJobs();
      if (!mounted) return;

      if (!result.data?.length) {
        setTodayPatrols([]);
        setActiveShift(null);
        setJobsLoading(false);
        return;
      }

      setActiveShift(findActiveShift(result.data));

      const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const mappedToday = result.data
        .filter((job: any) => {
          const d =
            job?.shift_date ??
            job?.date ??
            job?.shiftDate ??
            job?.scheduled_date;
          return typeof d === 'string' ? d === localToday : false;
        })
        .map(mapApiJobToShift)
        .filter((shift): shift is MappedShift => Boolean(shift));

      const fallbackMapped = result.data
        .map(mapApiJobToShift)
        .filter((shift): shift is MappedShift => Boolean(shift));

      setTodayPatrols((mappedToday.length > 0 ? mappedToday : fallbackMapped).slice(0, 3));
      setJobsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.headerStart}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerDecor} />
            <View style={styles.topRow}>
              <View style={styles.guardInfo}>
                <TouchableOpacity onPress={() => navigation.navigate(GUARD_ROUTES.PROFILE)}>
                  <View style={styles.avatar}>
                    <User size={18} color="white" />
                  </View>
                </TouchableOpacity>
                <View>
                  <Text style={styles.guardName}>Ahmed Khan</Text>
                  <Text style={styles.guardRole}>Security Guard</Text>
                </View>
              </View>
              <View style={styles.notifBtn}>
                <Bell size={20} color="white" />
                <View style={styles.notifDot} />
              </View>
            </View>
            <Text style={styles.greet}>
              Good Morning,{'\n'}
              <Text style={styles.greetAccent}>Ahmed!</Text>
            </Text>
            <Text style={styles.greetSub}>Thursday, 16 April 2026</Text>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Shift Card */}
            {jobsLoading ? (
              <DashboardShiftShimmer />
            ) : (
            <TouchableOpacity
              style={[styles.shiftCard, Shadows.card]}
              activeOpacity={0.9}
              onPress={openOngoingShift}
              disabled={!hasOngoingShift}
            >
              <View>
                <Text style={styles.shiftLbl}>ACTIVE SHIFT</Text>
                <Text style={styles.shiftSite}>
                  {activeShift?.site ?? 'Mall of Lahore'}
                </Text>
                <Text style={styles.shiftTime}>
                  {activeShift?.time ?? '06:00 AM – 02:00 PM'}
                </Text>
              </View>
              <View style={styles.shiftRight}>
                <View style={styles.onBadge}>
                  <Text style={styles.onBadgeText}>● ON DUTY</Text>
                </View>
                {hasOngoingShift ? (
                  <TouchableOpacity
                    style={styles.signOutBtn}
                    onPress={openOngoingShift}
                  >
                    <Text style={styles.signOutText}>CONTINUE</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.signOutBtn}
                    onPress={() => {
                      Alert.alert(
                        'Sign Out',
                        'Are you sure you want to sign out?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Yes',
                            onPress: async () => {
                              await logout();
                              dispatch(clearAuth());
                            },
                          },
                        ],
                      );
                    }}
                  >
                    <Text style={styles.signOutText}>SIGN OUT</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
            )}

            {/* Stats */}
            <View style={styles.statsGrid}>
              <StatCard
                icon={Footprints}
                value="6"
                label="Patrols Done"
                bgColor={Colors.accentLight}
              />

              <StatCard
                icon={AlertTriangle}
                value="1"
                label="Incidents"
                bgColor={Colors.dangerLight}
              />

              <StatCard
                icon={Radio}
                value="8"
                label="NFC Scans"
                bgColor={Colors.infoLight}
              />

              <StatCard
                icon={CheckCircle}
                value="92%"
                label="Compliance"
                bgColor={Colors.successLight}
              />
            </View>

            {/* Quick Actions */}
            <SectionHeader title="Quick Actions" />
            <View style={styles.qaGrid}>
              {QUICK_ACTIONS.map((qa, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.qaCard, Shadows.card]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate(qa.screen)}
                >
                  <View style={[styles.qaIcon, { backgroundColor: qa.bg }]}>
                    <qa.icon size={16} color="#000" />
                  </View>
                  <Text style={styles.qaLabel}>{qa.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Today's Patrols */}
            <TouchableOpacity onPress={() => navigation.navigate(GUARD_ROUTES.PATROL_TIMELINE)}>
              <SectionHeader title="Today's Patrols" action="See All" />
            </TouchableOpacity>
            {jobsLoading ? (
              <PatrolListShimmer count={3} />
            ) : todayPatrols.length > 0 ? (
              todayPatrols.map(patrol => (
                <PatrolItem
                  key={String(patrol.rosterId)}
                  location={patrol.site}
                  time={patrol.time}
                  status={patrol.status === 'done' ? 'done' : 'pending'}
                />
              ))
            ) : (
              <Text style={styles.patrolMetaText}>No patrols found.</Text>
            )}
          </View>
        </ScrollView>

        <NavBar
          items={[
            { icon: Home, label: 'Home', active: true },
            { icon: Route, label: 'Patrol' },
            { icon: AlertTriangle, label: 'Incidents' },
            { icon: ClipboardList, label: 'Shifts' },
            { icon: User, label: 'Profile' },
          ]}
          onPress={i => {
            const screens = [
              GUARD_ROUTES.DASHBOARD,
              GUARD_ROUTES.PATROL_TIMELINE,
              GUARD_ROUTES.INCIDENTS,
              GUARD_ROUTES.SHIFTS,
              GUARD_ROUTES.PROFILE,
            ];
            navigation.navigate(screens[i]);
          }}
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
  guardInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '800', color: Colors.white },
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
  greetAccent: { color: Colors.accent },
  greetSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 },

  body: { padding: Spacing.md, marginTop: -10 },

  shiftCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 14,
    marginTop: 6,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  shiftTime: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  shiftRight: { alignItems: 'flex-end', gap: 8 },
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
  signOutBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  signOutText: { fontSize: 11, fontWeight: '700', color: Colors.white },

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
  patrolMetaText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 10,
  },
});
