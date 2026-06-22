import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  StatusBar,
  Alert,
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
  findBlockingActiveShift,
  isThisShiftOngoing,
  formatFullDisplayDate,
  mapAndSortShifts,
  filterShiftsByStatus,
  groupShiftsList,
  type MappedShift,
  type ShiftGroup,
  type ShiftStatus,
  type ShiftListFilter,
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

type ShiftListItem =
  | { type: 'header'; key: string; label: string }
  | { type: 'shift'; key: string; shift: Shift };

const PAGE_SIZE = 10;
const SCROLL_LOAD_THRESHOLD = 120;

const leftBarColor: Record<ShiftStatus, string> = {
  active: Colors.accent,
  done: Colors.success,
  upcoming: Colors.info,
  ready: Colors.warning,
  missed: Colors.danger,
};

const badgeConfig: Record<
  ShiftStatus,
  { bg: string; color: string; label: string }
> = {
  active: { bg: Colors.accentLight, color: Colors.accent, label: '● ACTIVE' },
  done: { bg: Colors.successLight, color: Colors.success, label: '✓ DONE' },
  upcoming: { bg: Colors.infoLight, color: Colors.info, label: 'UPCOMING' },
  ready: { bg: Colors.warningLight, color: '#c05621', label: 'READY' },
  missed: { bg: Colors.dangerLight, color: Colors.danger, label: 'MISSED' },
};

const FILTERS: ShiftListFilter[] = [
  'All',
  'Active',
  'Ready',
  'Upcoming',
  'Completed',
  'Missed',
];

function truncateSiteName(site: string, maxWords = 6): string {
  const words = site.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return site;
  return `${words.slice(0, maxWords).join(' ')}...`;
}

function buildListItems(groups: ShiftGroup[]): ShiftListItem[] {
  const items: ShiftListItem[] = [];
  for (const group of groups) {
    items.push({
      type: 'header',
      key: `header-${group.group}`,
      label: group.group,
    });
    for (const shift of group.items) {
      items.push({
        type: 'shift',
        key: `shift-${shift.rosterId}-${shift.id}`,
        shift,
      });
    }
  }
  return items;
}

export default function ShiftsScreen() {
  const navigation = useGuardNavigation();
  const dispatch = useAppDispatch();
  const jobsRaw = useAppSelector(selectJobsItems);
  const loading = useAppSelector(selectJobsLoading);
  const [activeFilter, setActiveFilter] = useState<ShiftListFilter>('All');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeSession, setActiveSession] = useState<ActiveShiftSession | null>(
    null,
  );
  const loadingMoreRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchGuardJobs());
      getActiveShiftSession().then(setActiveSession);
    }, [dispatch]),
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    loadingMoreRef.current = false;
  }, [activeFilter, jobsRaw]);

  const sortedShifts = useMemo(
    () => mapAndSortShifts(jobsRaw),
    [jobsRaw],
  );

  const shiftsWithSession = useMemo(() => {
    if (!activeSession) return sortedShifts;
    return sortedShifts.map(shift =>
      isThisShiftOngoing(shift, activeSession)
        ? { ...shift, status: 'active' as ShiftStatus }
        : shift,
    );
  }, [sortedShifts, activeSession]);

  const filteredShifts = useMemo(
    () => filterShiftsByStatus(shiftsWithSession, activeFilter),
    [shiftsWithSession, activeFilter],
  );

  const visibleShifts = useMemo(
    () => filteredShifts.slice(0, visibleCount),
    [filteredShifts, visibleCount],
  );

  const shifts = useMemo(
    () => groupShiftsList(visibleShifts),
    [visibleShifts],
  );

  const listItems = useMemo(() => buildListItems(shifts), [shifts]);

  const hasMore = visibleCount < filteredShifts.length;

  const loadMore = useCallback(() => {
    if (loading || loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredShifts.length));
    requestAnimationFrame(() => {
      loadingMoreRef.current = false;
    });
  }, [loading, hasMore, filteredShifts.length]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } =
        event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      if (distanceFromBottom <= SCROLL_LOAD_THRESHOLD) {
        loadMore();
      }
    },
    [loadMore],
  );

  const handleOngoing = async (shift: Shift) => {
    const session = activeSession ?? (await getActiveShiftSession());
    navigation.navigate(GUARD_ROUTES.ONGOING_SHIFT, {
      rosterId: session?.rosterId ?? shift.rosterId,
      site: session?.site ?? shift.site,
      zones: session?.zones ?? shift.zones,
      signInTime: session?.signInTime ?? new Date().toISOString(),
      shiftId: session?.shiftId ?? shift.id,
      siteId: session?.siteId ?? shift.siteId,
    });
  };

  const handleSignIn = async (shift: Shift) => {
    const session = activeSession ?? (await getActiveShiftSession());

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
      status: 'ready',
    });
  };

  const shiftCount = sortedShifts.length;

  const renderShiftCard = (shift: Shift) => {
    const badge = badgeConfig[shift.status] ?? badgeConfig.upcoming;
    const showOngoing = shift.status === 'active';
    const showSignIn = shift.status === 'ready';

    return (
      <View
        style={[
          styles.shiftItem,
          Shadows.card,
          { borderLeftColor: leftBarColor[shift.status] ?? leftBarColor.upcoming },
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
          </View>
          <View style={[styles.siBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.siBadgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        <View style={styles.siMeta}>
          <View style={styles.metaRow}>
            <Clock size={12} color={Colors.textSecondary} />
            <Text style={styles.siMetaItem}>{shift.time}</Text>
          </View>

          <View style={styles.metaRow}>
            <MapPin size={12} color={Colors.textSecondary} />
            <Text style={styles.siMetaItem}>{shift.zones}</Text>
          </View>

          {shift.date ? (
            <View style={styles.metaRow}>
              <CalendarDays size={12} color={Colors.textSecondary} />
              <Text style={styles.siMetaItem}>{shift.date}</Text>
            </View>
          ) : null}
        </View>

        {shift.progress !== undefined && (
          <View style={styles.progressWrap}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLbl}>
                {shift.status === 'done' ? 'Compliance' : 'Patrol Progress'}
              </Text>
              <Text
                style={[
                  styles.progressVal,
                  {
                    color:
                      shift.status === 'done' ? Colors.success : Colors.accent,
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
                      shift.status === 'done' ? Colors.success : Colors.accent,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {showOngoing && (
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => handleOngoing(shift)}
          >
            <View style={styles.signInRow}>
              <CheckCircle size={16} color="#fff" />
              <Text style={styles.signInText}>  Ongoing</Text>
            </View>
          </TouchableOpacity>
        )}

        {showSignIn && (
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => handleSignIn(shift)}
          >
            <View style={styles.signInRow}>
              <Camera size={16} color="#fff" />
              <Text style={styles.signInText}>  Sign In</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderListItem = ({ item }: { item: ShiftListItem }) => {
    if (item.type === 'header') {
      return <Text style={styles.groupLabel}>{item.label}</Text>;
    }
    return renderShiftCard(item.shift);
  };

  const listHeader = (
    <>
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

      {loading ? <ShiftListShimmer count={5} /> : null}

      {!loading && filteredShifts.length === 0 ? (
        <View style={styles.loaderWrap}>
          <Text style={styles.loaderText}>No shifts found.</Text>
        </View>
      ) : null}
    </>
  );

  const listFooter = !loading && hasMore ? (
    <View style={styles.footerLoader}>
      <ActivityIndicator size="small" color={Colors.accent} />
      <Text style={styles.footerLoaderText}>Loading more shifts...</Text>
    </View>
  ) : !loading && filteredShifts.length > 0 && !hasMore ? (
    <Text style={styles.endHint}>
      Showing all {filteredShifts.length} shift
      {filteredShifts.length === 1 ? '' : 's'}
    </Text>
  ) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.hdrRow}>
            <Text style={styles.hdrTitle}>My Shifts</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>
                {loading ? '...' : `${shiftCount} SHIFTS`}
              </Text>
            </View>
          </View>
          <Text style={styles.hdrSub}>{formatFullDisplayDate()}</Text>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.safeBody} edges={['bottom']}>
        <FlatList
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          data={loading ? [] : listItems}
          keyExtractor={item => item.key}
          renderItem={renderListItem}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
        />

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
  container: { flex: 1, backgroundColor: Colors.headerStart },
  safeTop: { backgroundColor: Colors.headerStart },
  safeBody: { flex: 1, backgroundColor: Colors.bgAlt },

  header: {
    backgroundColor: Colors.headerStart,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 22,
  },
  hdrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  hdrTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  countBadge: {
    backgroundColor: 'rgba(121,31,61,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(121,31,61,0.3)',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#f5c2d0',
  },
  hdrSub: { fontSize: FontSizes.xs, color: 'rgba(255,255,255,0.35)' },
  filterRow: { flexDirection: 'row', gap: 6, paddingBottom: 12, marginTop: 4 },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 14, paddingBottom: 14 },
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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

  signInBtn: {
    marginTop: 14,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  signInRow: { flexDirection: 'row', alignItems: 'center' },
  signInText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  footerLoaderText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  endHint: {
    textAlign: 'center',
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 12,
    fontWeight: '600',
  },
});
