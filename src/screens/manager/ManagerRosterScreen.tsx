import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { SectionHeader } from '../../components';
import {
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react-native';
import {
  ManagerCompactTabShell,
  ManagerListLayout,
  MANAGER_TAB_INDEX,
  sharedStyles,
} from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import {
  ManagerRosterCalendarFixedShimmer,
  ManagerRosterListShimmer,
} from '../../components/Shimmer';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  apiPeriodForWeekFilter,
  isDateThisWeek,
  isDateToday,
  isFrontendWeekFilter,
  type WeekPeriodFilter,
} from './managerDateFilters';
import {
  getManagerRosterCalendar,
  getManagerRosterShifts,
  getManagerRosterSites,
  type ManagerCalendarEvent,
  type ManagerPeriod,
  type ManagerShiftAssignment,
  type ManagerSiteAssignment,
} from '../../services/managerApi';

type RosterTab = 'calendar' | 'shifts' | 'sites';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PERIOD_FILTERS: WeekPeriodFilter[] = ['Today', 'This Week', 'This Month'];

function buildCalendarCells(month: number, year: number) {
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (number | null)[] = [];

  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function ManagerRosterScreen() {
  const now = new Date();
  const [tab, setTab] = useState<RosterTab>('calendar');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [periodFilter, setPeriodFilter] = useState<WeekPeriodFilter>('This Week');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const [calendarData, setCalendarData] = useState<Awaited<
    ReturnType<typeof getManagerRosterCalendar>
  >['data']>(undefined);
  const [shiftsData, setShiftsData] = useState<Awaited<
    ReturnType<typeof getManagerRosterShifts>
  >['data']>(undefined);
  const [sitesData, setSitesData] = useState<Awaited<
    ReturnType<typeof getManagerRosterSites>
  >['data']>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiPeriod: ManagerPeriod = apiPeriodForWeekFilter(periodFilter);

  const fetchCalendar = useCallback(async () => {
    setError(null);
    const result = await getManagerRosterCalendar(month, year);
    if (result.success && result.data) {
      setCalendarData(result.data);
    } else {
      setCalendarData(undefined);
      setError(result.message ?? 'Failed to load calendar');
    }
    setLoading(false);
    setRefreshing(false);
  }, [month, year]);

  const fetchShifts = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1 && !append) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const result = await getManagerRosterShifts({
        period: apiPeriod,
        search: debouncedSearch,
        page: pageNum,
        per_page: apiPeriod === 'this_week' ? 50 : 20,
      });

      if (result.success && result.data) {
        setShiftsData(prev => {
          if (!append || !prev) return result.data!;
          return {
            ...result.data!,
            assignments: [...prev.assignments, ...result.data!.assignments],
          };
        });
        setHasMore(result.pagination?.has_more ?? false);
        setPage(pageNum);
      } else if (!append) {
        setShiftsData(undefined);
        setError(result.message ?? 'Failed to load shifts');
      }

      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    },
    [apiPeriod, debouncedSearch],
  );

  const fetchSites = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1 && !append) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const result = await getManagerRosterSites({
        period: apiPeriod,
        search: debouncedSearch,
        page: pageNum,
        per_page: 20,
      });

      if (result.success && result.data) {
        setSitesData(prev => {
          if (!append || !prev) return result.data!;
          return {
            ...result.data!,
            sites: [...prev.sites, ...result.data!.sites],
          };
        });
        setHasMore(result.pagination?.has_more ?? false);
        setPage(pageNum);
      } else if (!append) {
        setSitesData(undefined);
        setError(result.message ?? 'Failed to load sites');
      }

      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    },
    [apiPeriod, debouncedSearch],
  );

  useEffect(() => {
    setLoading(true);
    if (tab === 'calendar') {
      fetchCalendar();
    } else if (tab === 'shifts') {
      fetchShifts(1, false);
    } else {
      fetchSites(1, false);
    }
  }, [tab, apiPeriod, debouncedSearch, month, year, fetchCalendar, fetchShifts, fetchSites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (tab === 'calendar') fetchCalendar();
    else if (tab === 'shifts') fetchShifts(1, false);
    else fetchSites(1, false);
  }, [fetchCalendar, fetchShifts, fetchSites, tab]);

  const loadMore = useCallback(() => {
    if (tab === 'calendar' || isFrontendWeekFilter(periodFilter)) return;
    if (loadingMore || !hasMore || loading) return;
    if (tab === 'shifts') fetchShifts(page + 1, true);
    else fetchSites(page + 1, true);
  }, [
    fetchShifts,
    fetchSites,
    hasMore,
    loading,
    loadingMore,
    page,
    periodFilter,
    tab,
  ]);

  const handlePeriodFilter = (filter: WeekPeriodFilter) => {
    setPeriodFilter(filter);
    if (!isFrontendWeekFilter(filter)) {
      setLoading(true);
    }
  };

  const changeMonth = useCallback(
    (delta: number) => {
      const d = new Date(year, month - 1 + delta, 1);
      setMonth(d.getMonth() + 1);
      setYear(d.getFullYear());
      setSelectedDay(1);
      setLoading(true);
    },
    [month, year],
  );

  const calendarCells = useMemo(
    () => buildCalendarCells(month, year),
    [month, year],
  );

  const datesWithShifts = useMemo(
    () => new Set(calendarData?.dates_with_shifts ?? []),
    [calendarData],
  );

  const selectedDateKey = dateKey(year, month, selectedDay);
  const dayEvents = useMemo(
    () => (calendarData?.events ?? []).filter(e => e.date === selectedDateKey),
    [calendarData, selectedDateKey],
  );

  const filteredAssignments = useMemo(() => {
    const items = shiftsData?.assignments ?? [];
    if (periodFilter === 'Today') {
      return items.filter(s => isDateToday(s.date));
    }
    if (periodFilter === 'This Week') {
      return items.filter(s => isDateThisWeek(s.date));
    }
    return items;
  }, [periodFilter, shiftsData]);

  const monthLabel =
    calendarData?.month_label ??
    new Date(year, month - 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });

  const showCalendarShimmer = loading && tab === 'calendar' && !calendarData;
  const showShiftsShimmer = loading && tab === 'shifts' && !shiftsData;
  const showSitesShimmer = loading && tab === 'sites' && !sitesData;

  const subtitle =
    tab === 'sites' && sitesData
      ? sitesData.sites_label
      : tab === 'shifts' && shiftsData
        ? shiftsData.period_label
        : 'Shift & site assignments';

  const tabToolbar = (
    <View style={styles.tabRow}>
      {(
        [
          { key: 'calendar', label: 'Calendar' },
          { key: 'shifts', label: 'Shifts' },
          { key: 'sites', label: 'Sites' },
        ] as const
      ).map(t => (
        <TouchableOpacity
          key={t.key}
          style={[styles.tab, tab === t.key && styles.tabActive]}
          onPress={() => {
            setTab(t.key);
            setLoading(true);
          }}
        >
          <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const shiftsToolbar =
    tab !== 'calendar' ? (
      <>
        <View style={[styles.searchRow, Shadows.card]}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search guard or site..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={sharedStyles.chipRow}>
          {PERIOD_FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[
                sharedStyles.chip,
                periodFilter === f && sharedStyles.chipActive,
              ]}
              onPress={() => handlePeriodFilter(f)}
            >
              <Text
                style={[
                  sharedStyles.chipText,
                  periodFilter === f && sharedStyles.chipTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </>
    ) : null;

  const calendarFixed =
    tab === 'calendar' ? (
      showCalendarShimmer ? (
        <ManagerRosterCalendarFixedShimmer />
      ) : (
        <>
          <View style={[styles.calendarHeader, Shadows.card]}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <ChevronLeft size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <ChevronRight size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.calendar, Shadows.card]}>
            <View style={styles.weekRow}>
              {WEEK_DAYS.map(d => (
                <Text key={d} style={styles.weekDay}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.daysGrid}>
              {calendarCells.map((day, index) => {
                if (day == null) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const key = dateKey(year, month, day);
                const hasShift = datesWithShifts.has(key);
                const isSelected = day === selectedDay;
                const isToday =
                  day === now.getDate() &&
                  month === now.getMonth() + 1 &&
                  year === now.getFullYear();

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.dayCell,
                      isSelected && styles.daySelected,
                      isToday && !isSelected && styles.dayToday,
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        hasShift && !isSelected && styles.dayTextShift,
                      ]}
                    >
                      {day}
                    </Text>
                    {hasShift ? <View style={styles.shiftDot} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </>
      )
    ) : null;

  const listHeader =
    tab === 'calendar' ? (
      <SectionHeader
        title="Shifts"
        action={dayEvents[0]?.date_label ?? selectedDateKey}
      />
    ) : tab === 'shifts' ? (
      <SectionHeader
        title="Shift Assignments"
        action={shiftsData?.period_label ?? 'This Week'}
      />
    ) : (
      <SectionHeader
        title="Site Assignments"
        action={sitesData?.sites_label ?? ''}
      />
    );

  return (
    <ManagerCompactTabShell
      activeIndex={MANAGER_TAB_INDEX.ROSTER}
      title="Roster"
      subtitle={subtitle}
    >
      <ManagerListLayout
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={loadMore}
        toolbar={
          <>
            {error ? <AuthErrorBanner message={error} /> : null}
            {tabToolbar}
            {shiftsToolbar}
          </>
        }
        fixedContent={calendarFixed}
        listHeader={listHeader}
      >
        {showCalendarShimmer ? (
          <ManagerRosterListShimmer variant="calendar" count={2} />
        ) : showShiftsShimmer ? (
          <ManagerRosterListShimmer variant="shifts" />
        ) : showSitesShimmer ? (
          <ManagerRosterListShimmer variant="sites" />
        ) : tab === 'calendar' ? (
          dayEvents.length === 0 ? (
            <Text style={styles.emptyText}>No shifts on this day.</Text>
          ) : (
            dayEvents.map((event: ManagerCalendarEvent) => (
              <View key={event.roster_id} style={[styles.shiftRow, Shadows.card]}>
                <View style={styles.shiftIcon}>
                  <Clock size={14} color={Colors.accent} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.shiftGuard}>{event.guard_name}</Text>
                  <Text style={styles.shiftMeta}>
                    {event.site_name} · {event.shift_time}
                  </Text>
                  <Text style={styles.shiftZone}>{event.zone}</Text>
                </View>
              </View>
            ))
          )
        ) : tab === 'shifts' ? (
          filteredAssignments.length === 0 ? (
            <Text style={styles.emptyText}>No shift assignments found.</Text>
          ) : (
            filteredAssignments.map((s: ManagerShiftAssignment) => (
              <View key={s.roster_id} style={[styles.shiftRow, Shadows.card]}>
                <View style={styles.shiftIcon}>
                  <Users size={14} color={Colors.accent} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.shiftGuard}>{s.guard_name}</Text>
                  <Text style={styles.shiftMeta}>
                    {s.site_name} · {s.shift_time}
                  </Text>
                  <Text style={styles.shiftZone}>
                    {s.zone} · {s.date_label}
                  </Text>
                </View>
              </View>
            ))
          )
        ) : (sitesData?.sites ?? []).length === 0 ? (
          <Text style={styles.emptyText}>No site assignments found.</Text>
        ) : (
          (sitesData?.sites ?? []).map((s: ManagerSiteAssignment) => (
            <View key={s.site_id} style={[styles.siteRow, Shadows.card]}>
              <View style={styles.siteIcon}>
                <MapPin size={16} color={Colors.accent} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.siteName}>{s.site_name}</Text>
                <Text style={styles.siteMeta}>{s.guards_label}</Text>
                <Text style={styles.siteMeta}>{s.shifts_label}</Text>
                <Text style={styles.siteLead}>{s.lead_label}</Text>
              </View>
            </View>
          ))
        )}

        {loadingMore ? (
          <ActivityIndicator color={Colors.accent} style={styles.loadMore} />
        ) : null}
      </ManagerListLayout>
    </ManagerCompactTabShell>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentAlpha25,
  },
  tabText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabTextActive: { color: Colors.accent },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    padding: 0,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  loadMore: { marginVertical: 12 },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 10,
  },
  monthLabel: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  calendar: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 12,
    marginBottom: 4,
  },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: {
    backgroundColor: Colors.accent,
    borderRadius: 20,
  },
  dayToday: {
    borderWidth: 1,
    borderColor: Colors.accentAlpha25,
    borderRadius: 20,
  },
  dayText: { fontSize: 12, color: Colors.textPrimary },
  dayTextSelected: { color: Colors.white, fontWeight: '800' },
  dayTextShift: { fontWeight: '700', color: Colors.accent },
  shiftDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginTop: 2,
  },
  shiftRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shiftIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  shiftGuard: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  shiftMeta: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  shiftZone: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  siteRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  siteIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  siteName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  siteMeta: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  siteLead: {
    fontSize: FontSizes.xs,
    color: Colors.accent,
    marginTop: 2,
    fontWeight: '600',
  },
  rowBody: { flex: 1, minWidth: 0 },
});
