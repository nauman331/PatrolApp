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
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import { NavBar, Chip } from '../components';
import { ShiftListShimmer } from '../components/Shimmer';
import {
  AlertTriangle,
  ClipboardList,
  Home,
  Route,
  User,
  CalendarDays,
} from 'lucide-react-native';
import { Clock, MapPin, CheckCircle, Camera } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES, navigateGuardBottomTab } from '../navigation/constants';
import {
  groupShiftsByDate,
  findBlockingActiveShift,
  isThisShiftOngoing,
  type MappedShift,
  type ShiftGroup,
  type ShiftStatus,
} from '../services/guardJobsMapper';
import {
  getActiveShiftSession,
  type ActiveShiftSession,
} from '../services/activeShiftSession';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchGuardJobs,
  selectJobsItems,
  selectJobsLoading,
} from '../store/slices/jobsSlice';

type Shift = MappedShift;

const leftBarColor: Record<ShiftStatus, string> = {
  active: Colors.accent,
  done: Colors.success,
  upcoming: Colors.info,
};

const badgeConfig: Record<
  ShiftStatus,
  { bg: string; color: string; label: string }
> = {
  active: { bg: Colors.accentLight, color: Colors.accent, label: '● ACTIVE' },
  done: { bg: Colors.successLight, color: Colors.success, label: '✓ DONE' },
  upcoming: { bg: Colors.infoLight, color: Colors.info, label: 'UPCOMING' },
};

const FILTERS = ['All', 'Active', 'Upcoming', 'Completed'];

function truncateSiteName(site: string, maxWords = 6): string {
  const words = site.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return site;
  return `${words.slice(0, maxWords).join(' ')}...`;
}

export default function ShiftsScreen() {
  const navigation = useGuardNavigation();
  const dispatch = useAppDispatch();
  const jobsRaw = useAppSelector(selectJobsItems);
  const loading = useAppSelector(selectJobsLoading);
  const [activeFilter, setActiveFilter] = useState('All');
  const [shifts, setShifts] = useState<ShiftGroup[]>([]);
  const [activeSession, setActiveSession] = useState<ActiveShiftSession | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchGuardJobs());
      getActiveShiftSession().then(setActiveSession);
    }, [dispatch]),
  );

  useEffect(() => {
    if (!jobsRaw.length) {
      setShifts([]);
      return;
    }
    setShifts(groupShiftsByDate(jobsRaw));
  }, [jobsRaw]);

  const handleShiftAction = async (shift: Shift) => {
    const session = activeSession ?? (await getActiveShiftSession());

    if (isThisShiftOngoing(shift, session)) {
      navigation.navigate(GUARD_ROUTES.ONGOING_SHIFT, {
        rosterId: session?.rosterId ?? shift.rosterId,
        site: session?.site ?? shift.site,
        zones: session?.zones ?? shift.zones,
        signInTime: session?.signInTime ?? new Date().toISOString(),
        shiftId: session?.shiftId ?? shift.id,
        siteId: session?.siteId ?? shift.siteId,
      });
      return;
    }

    const blockingShift = findBlockingActiveShift(jobsRaw, shift, session);
    if (blockingShift) {
      Alert.alert(
        'Shift already active',
        `Another shift is active at ${blockingShift.site ?? 'another site'}. Please end it first, then sign in again.`,
      );
      return;
    }

    navigation.navigate(GUARD_ROUTES.SHIFT_SIGN_IN, {
      shiftId: shift.id,
      rosterId: shift.rosterId,
      siteId: shift.siteId,
      site: shift.site,
      time: shift.time,
      zones: shift.zones,
      status: shift.status === 'done' ? 'upcoming' : shift.status,
    });
  };

  const filteredShifts = shifts.map(group => ({
    ...group,
    items:
      activeFilter === 'All'
        ? group.items
        : group.items.filter(shift => {
          if (activeFilter === 'Active') return shift.status === 'active';
          if (activeFilter === 'Upcoming') return shift.status === 'upcoming';
          if (activeFilter === 'Completed') return shift.status === 'done';
          return true;
        }),
  })).filter(group => group.items.length > 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.backRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Shifts</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {FILTERS.map(f => (
                <Chip
                  key={f}
                  label={f}
                  active={activeFilter === f}
                  onPress={() => setActiveFilter(f)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Shifts List */}
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ShiftListShimmer count={5} />
          ) : filteredShifts.length === 0 ? (
            <View style={styles.loaderWrap}>
              <Text style={styles.loaderText}>No shifts found.</Text>
            </View>
          ) : null}

          {!loading && filteredShifts.map((group, gi) => (
            <View key={gi}>
              <Text style={styles.groupLabel}>{group.group}</Text>
              {group.items.map((shift, si) => {
                const badge = badgeConfig[shift.status];
                const ongoing = isThisShiftOngoing(shift, activeSession);
                const canAction =
                  shift.status !== 'done' && (ongoing || shift.status === 'upcoming');

                return (
                  <View
                    key={si}
                    style={[
                      styles.shiftItem,
                      Shadows.card,
                      { borderLeftColor: leftBarColor[shift.status] },
                    ]}
                  >
                    <View style={styles.siTop}>
                      <View style={styles.siTopLeft}>
                        <Text
                          style={styles.siSite}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {truncateSiteName(shift.site)}
                        </Text>
                        {/* <Text style={styles.siId}>{shift.id}</Text> */}
                      </View>
                      <View
                        style={[styles.siBadge, { backgroundColor: badge.bg }]}
                      >
                        <Text
                          style={[styles.siBadgeText, { color: badge.color }]}
                        >
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.siMeta}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Clock size={12} color={Colors.textSecondary} />
                        <Text style={styles.siMetaItem}>{shift.time}</Text>
                      </View>

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <MapPin size={12} color={Colors.textSecondary} />
                        <Text style={styles.siMetaItem}>{shift.zones}</Text>
                      </View>

                      {shift.date ? (
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <CalendarDays size={12} color={Colors.textSecondary} />
                          <Text style={styles.siMetaItem}>{shift.date}</Text>
                        </View>
                      ) : null}
                    </View>

                    {shift.progress !== undefined && (
                      <View style={styles.progressWrap}>
                        <View style={styles.progressRow}>
                          <Text style={styles.progressLbl}>
                            {shift.status === 'done'
                              ? 'Compliance'
                              : 'Patrol Progress'}
                          </Text>
                          <Text
                            style={[
                              styles.progressVal,
                              {
                                color:
                                  shift.status === 'done'
                                    ? Colors.success
                                    : Colors.accent,
                              },
                            ]}
                          >
                            {shift.progressLabel}
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${shift.progress}%`,
                                backgroundColor:
                                  shift.status === 'done'
                                    ? Colors.success
                                    : Colors.accent,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    )}

                    {canAction && (
                      <TouchableOpacity
                        style={styles.signInBtn}
                        onPress={() => handleShiftAction(shift)}
                      >
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                          {ongoing ? (
                            <CheckCircle size={16} color="#fff" />
                          ) : (
                            <Camera size={16} color="#fff" />
                          )}
                          <Text style={styles.signInText}>
                            {ongoing ? '  Ongoing Shift' : '  Sign In Now'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Bottom Navigation */}
        <NavBar
          variant="light"
          items={[
            { icon: Home, label: 'Home' },
            { icon: Route, label: 'Patrol' },
            { icon: AlertTriangle, label: 'Incidents' },
            { icon: ClipboardList, label: 'Shifts', active: true },
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
    backgroundColor: Colors.bg,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  backBtn: {
    width: 30,
    height: 30,
    backgroundColor: Colors.bgAlt,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 13, color: '#666' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  filterRow: { flexDirection: 'row', gap: 6, paddingBottom: 2 },

  body: { padding: 14 },
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 10,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },

  groupLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },

  shiftItem: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    ...Shadows.card,
  },

  siTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 8,
    gap: 8,
  },
  siTopLeft: {
    flex: 1,
    minWidth: 0,
  },
  siSite: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  siId: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  siBadge: {
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3,
    minWidth: 78,
    alignItems: 'center',
    flexShrink: 0,
  },
  siBadgeText: { fontSize: 10, fontWeight: '700' },

  siMeta: { flexDirection: 'row', gap: 14, paddingLeft: 8, flexWrap: 'wrap' },
  siMetaItem: { fontSize: FontSizes.xs, color: Colors.textSecondary },

  progressWrap: { marginTop: 10, paddingLeft: 8 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLbl: { fontSize: FontSizes.xs, color: Colors.textMuted },
  progressVal: { fontSize: FontSizes.xs, fontWeight: '700' },
  progressBar: {
    height: 3,
    backgroundColor: '#f0f0f5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },

  /* New Sign In Button */
  signInBtn: {
    marginTop: 14,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  signInText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
