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
import {
  ChevronRight,
  Footprints,
  AlertTriangle,
  Search,
} from 'lucide-react-native';
import { useManagerNavigation } from '../../navigation/utils';
import { MANAGER_ROUTES } from '../../navigation/constants';
import {
  ManagerCompactTabShell,
  ManagerListLayout,
  MANAGER_TAB_INDEX,
  sharedStyles,
} from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import { ManagerReportsShimmer } from '../../components/Shimmer';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  isDateThisWeek,
  isDateToday,
  todayIso,
} from './managerDateFilters';
import {
  getManagerIncidentReports,
  getManagerPatrolReports,
  mapSeverityColor,
  type ManagerIncidentReportItem,
  type ManagerPatrolReportItem,
  type ManagerPeriod,
} from '../../services/managerApi';

type ReportTab = 'patrol' | 'incident';

const DATE_FILTERS = ['Today', 'This Week', 'This Month', 'Custom'] as const;
type DateFilter = (typeof DATE_FILTERS)[number];

function apiPeriodForFilter(filter: DateFilter): ManagerPeriod {
  if (filter === 'This Month') return 'this_month';
  if (filter === 'Custom') return 'custom';
  return 'this_week';
}

function isFrontendDateFilter(filter: DateFilter): boolean {
  return filter === 'Today' || filter === 'This Week';
}

export default function ManagerReportsScreen() {
  const navigation = useManagerNavigation();
  const [tab, setTab] = useState<ReportTab>('patrol');
  const [dateFilter, setDateFilter] = useState<DateFilter>('Today');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const [patrolReports, setPatrolReports] = useState<ManagerPatrolReportItem[]>(
    [],
  );
  const [incidentReports, setIncidentReports] = useState<
    ManagerIncidentReportItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodLabel, setPeriodLabel] = useState('');

  const apiPeriod = apiPeriodForFilter(dateFilter);

  const fetchReports = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1 && !append) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const params = {
        period: apiPeriod,
        search: debouncedSearch,
        page: pageNum,
        per_page: apiPeriod === 'this_week' ? 50 : 10,
        ...(apiPeriod === 'custom'
          ? { start_date: todayIso(), end_date: todayIso() }
          : {}),
      };

      const result =
        tab === 'patrol'
          ? await getManagerPatrolReports(params)
          : await getManagerIncidentReports(params);

      if (result.success && result.data) {
        if (tab === 'patrol') {
          const patrolData = result.data as { reports: ManagerPatrolReportItem[] };
          setPatrolReports(prev =>
            append ? [...prev, ...patrolData.reports] : patrolData.reports,
          );
        } else {
          const incidentData = result.data as {
            reports: ManagerIncidentReportItem[];
          };
          setIncidentReports(prev =>
            append ? [...prev, ...incidentData.reports] : incidentData.reports,
          );
        }
        setPeriodLabel(
          `${result.data.start_date} – ${result.data.end_date}`,
        );
        setHasMore(result.pagination?.has_more ?? false);
        setPage(pageNum);
      } else {
        if (!append) {
          setPatrolReports([]);
          setIncidentReports([]);
        }
        setError(result.message ?? 'Failed to load reports');
      }

      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    },
    [apiPeriod, debouncedSearch, tab],
  );

  useEffect(() => {
    fetchReports(1, false);
  }, [fetchReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReports(1, false);
  }, [fetchReports]);

  const loadMore = useCallback(() => {
    if (isFrontendDateFilter(dateFilter)) return;
    if (!loadingMore && hasMore && !loading) {
      fetchReports(page + 1, true);
    }
  }, [dateFilter, fetchReports, hasMore, loading, loadingMore, page]);

  const filteredPatrolReports = useMemo(() => {
    if (dateFilter === 'Today') {
      return patrolReports.filter(r => isDateToday(r.date));
    }
    if (dateFilter === 'This Week') {
      return patrolReports.filter(r => isDateThisWeek(r.date));
    }
    return patrolReports;
  }, [dateFilter, patrolReports]);

  const filteredIncidentReports = useMemo(() => {
    if (dateFilter === 'Today') {
      return incidentReports.filter(r => isDateToday(r.date));
    }
    if (dateFilter === 'This Week') {
      return incidentReports.filter(r => isDateThisWeek(r.date));
    }
    return incidentReports;
  }, [dateFilter, incidentReports]);

  const activeReports =
    tab === 'patrol' ? filteredPatrolReports : filteredIncidentReports;

  const showShimmer =
    loading &&
    (tab === 'patrol' ? patrolReports.length === 0 : incidentReports.length === 0);

  const handleDateFilter = (filter: DateFilter) => {
    setDateFilter(filter);
    if (!isFrontendDateFilter(filter)) {
      setLoading(true);
    }
  };

  const subtitle = useMemo(() => {
    if (dateFilter === 'Today') return "Today's reports";
    if (dateFilter === 'This Week') return "This week's reports";
    if (periodLabel) return periodLabel;
    return 'Patrol & incident reports across all sites';
  }, [dateFilter, periodLabel]);

  return (
    <ManagerCompactTabShell
      activeIndex={MANAGER_TAB_INDEX.REPORTS}
      title="Reports"
      subtitle={subtitle}
    >
      <ManagerListLayout
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={loadMore}
        toolbar={
          <>
            {error ? <AuthErrorBanner message={error} /> : null}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, tab === 'patrol' && styles.tabActive]}
                onPress={() => {
                  setTab('patrol');
                  setLoading(true);
                }}
              >
                <Footprints
                  size={14}
                  color={tab === 'patrol' ? Colors.accent : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabText,
                    tab === 'patrol' && styles.tabTextActive,
                  ]}
                >
                  Patrol Reports
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, tab === 'incident' && styles.tabActive]}
                onPress={() => {
                  setTab('incident');
                  setLoading(true);
                }}
              >
                <AlertTriangle
                  size={14}
                  color={tab === 'incident' ? Colors.accent : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabText,
                    tab === 'incident' && styles.tabTextActive,
                  ]}
                >
                  Incident Reports
                </Text>
              </TouchableOpacity>
            </View>
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
              {DATE_FILTERS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[
                    sharedStyles.chip,
                    dateFilter === f && sharedStyles.chipActive,
                  ]}
                  onPress={() => handleDateFilter(f)}
                >
                  <Text
                    style={[
                      sharedStyles.chipText,
                      dateFilter === f && sharedStyles.chipTextActive,
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
      >
        {showShimmer ? (
          <ManagerReportsShimmer variant={tab} />
        ) : activeReports.length === 0 ? (
          <Text style={styles.emptyText}>No reports found.</Text>
        ) : tab === 'patrol' ? (
          filteredPatrolReports.map((r, index) => (
            <TouchableOpacity
              key={`${r.guard_id}-${r.site_id}-${r.date}-${index}`}
              style={[styles.reportRow, Shadows.card]}
              onPress={() =>
                navigation.navigate(MANAGER_ROUTES.SHIFT_REPORT, {
                  guardId: r.guard_id,
                  siteId: r.site_id,
                  date: r.date,
                  guardName: r.guard_name,
                  site: r.site_name,
                })
              }
            >
              <View style={styles.reportIcon}>
                <Footprints size={16} color={Colors.accent} />
              </View>
              <View style={styles.reportBody}>
                <Text style={styles.reportTitle}>{r.guard_name}</Text>
                <Text style={styles.reportSub}>{r.location_date}</Text>
                <Text style={styles.reportMeta}>{r.summary_text}</Text>
              </View>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))
        ) : (
          filteredIncidentReports.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[styles.reportRow, Shadows.card]}
              onPress={() =>
                navigation.navigate(MANAGER_ROUTES.INCIDENT_DETAIL, {
                  incidentId: r.id,
                })
              }
            >
              <View
                style={[
                  styles.reportIcon,
                  { backgroundColor: `${mapSeverityColor(r.severity)}18` },
                ]}
              >
                <AlertTriangle
                  size={16}
                  color={mapSeverityColor(r.severity)}
                />
              </View>
              <View style={styles.reportBody}>
                <Text style={styles.reportTitle}>{r.title}</Text>
                <Text style={styles.reportSub}>{r.location_date}</Text>
                <Text style={styles.reportMeta}>
                  {r.guard_name} ·{' '}
                  <Text
                    style={{
                      color: mapSeverityColor(r.severity),
                      fontWeight: '700',
                    }}
                  >
                    {r.severity.toUpperCase()}
                  </Text>
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>
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
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgCard,
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
  },
  loadMore: { marginVertical: 12 },
  reportRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reportIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  reportBody: { flex: 1, minWidth: 0 },
  reportTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  reportSub: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  reportMeta: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
