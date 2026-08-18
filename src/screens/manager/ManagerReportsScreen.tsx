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
  Calendar,
  Filter,
} from 'lucide-react-native';
import { useManagerNavigation } from '../../navigation/utils';
import { MANAGER_ROUTES } from '../../navigation/constants';
import { ManagerCalendarModal } from './ManagerCalendarModal';
import {
  ManagerCompactTabShell,
  ManagerListLayout,
  MANAGER_TAB_INDEX,
  sharedStyles,
} from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import { ManagerReportsShimmer } from '../../components/Shimmer';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { formatDate } from '../../utils';
import {
  ManagerMultiFilterModal,
  ManagerSearchableFilterModal,
} from '../../components/ManagerFilterModals';
import {
  getManagerGuardsSites,
  mapSeverityColor,
  type ManagerFilterGuard,
  type ManagerFilterSite,
  type ManagerIncidentReportItem,
  type ManagerPatrolReportItem,
  type ManagerPeriod,
} from '../../services/managerApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchManagerIncidentReports,
  fetchManagerPatrolReports,
  selectManagerIncidentReports,
  selectManagerPatrolReports,
  selectLoadingIncidents,
  selectLoadingPatrols,
  selectReportsFilters,
  setTab,
  setDateFilter,
  setSearch,
  setSelectedGuardIds,
  setSelectedSiteIds,
  setCustomDates,
  resetFilters,
  type DateFilter,
} from '../../store/slices/managerReportsSlice';

const DATE_FILTERS = ['Today', 'This Week', 'This Month', 'Custom'] as const;

function apiPeriodForFilter(filter: DateFilter): ManagerPeriod {
  if (filter === 'Today') return 'today';
  if (filter === 'This Week') return 'this_week';
  if (filter === 'This Month') return 'this_month';
  if (filter === 'Custom') return 'custom';
  return 'today';
}

export default function ManagerReportsScreen() {
  const navigation = useManagerNavigation();
  const dispatch = useAppDispatch();

  const {
    tab,
    dateFilter,
    search,
    selectedGuardIds,
    selectedSiteIds,
    startDate: startDateStr,
    endDate: endDateStr
  } = useAppSelector(selectReportsFilters);

  const startDate = useMemo(() => new Date(startDateStr), [startDateStr]);
  const endDate = useMemo(() => new Date(endDateStr), [endDateStr]);

  const debouncedSearch = useDebouncedValue(search, 400);

  const patrolReportsData = useAppSelector(selectManagerPatrolReports);
  const incidentReportsData = useAppSelector(selectManagerIncidentReports);
  const loadingPatrols = useAppSelector(selectLoadingPatrols);
  const loadingIncidents = useAppSelector(selectLoadingIncidents);

  const patrolReports = patrolReportsData?.reports ?? [];
  const incidentReports = incidentReportsData?.reports ?? [];

  const [guards, setGuards] = useState<ManagerFilterGuard[]>([]);
  const [sites, setSites] = useState<ManagerFilterSite[]>([]);
  const [showGuardFilter, setShowGuardFilter] = useState(false);
  const [showSiteFilter, setShowSiteFilter] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodLabel, setPeriodLabel] = useState('');

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const apiPeriod = apiPeriodForFilter(dateFilter);

  useEffect(() => {
    async function loadFilters() {
      const res = await getManagerGuardsSites();
      if (res.success && res.data) {
        setGuards(res.data.guards);
        setSites(res.data.sites);
      }
    }
    loadFilters();
  }, []);

  const fetchReportsData = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum !== 1) setLoadingMore(true);
      setError(null);

      const params = {
        period: apiPeriod,
        search: debouncedSearch,
        page: pageNum,
        per_page: 10,
        guard_ids: selectedGuardIds,
        site_ids: selectedSiteIds,
        ...(apiPeriod === 'custom'
          ? {
              start_date: startDateStr.slice(0, 10),
              end_date: endDateStr.slice(0, 10),
            }
          : {}),
      };

      const result =
        tab === 'patrol'
          ? await dispatch(fetchManagerPatrolReports(params))
          : await dispatch(fetchManagerIncidentReports(params));

      if (fetchManagerPatrolReports.fulfilled.match(result) || fetchManagerIncidentReports.fulfilled.match(result)) {
        const data = result.payload as any;
        setPeriodLabel(
          `${formatDate(data?.start_date ?? '')} – ${formatDate(data?.end_date ?? '')}`,
        );
        setHasMore(data?.pagination?.has_more ?? false);
        setPage(pageNum);
      } else {
        setError(result.payload as string ?? 'Failed to load reports');
      }

      setLoadingMore(false);
      setRefreshing(false);
    },
    [
      apiPeriod,
      debouncedSearch,
      tab,
      startDateStr,
      endDateStr,
      selectedGuardIds,
      selectedSiteIds,
      dispatch
    ],
  );

  useEffect(() => {
    fetchReportsData(1, false);
  }, [fetchReportsData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReportsData(1, false);
  }, [fetchReportsData]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    if (tab === 'patrol') {
       if (!loadingPatrols) fetchReportsData(page + 1, true);
    } else {
       if (!loadingIncidents) fetchReportsData(page + 1, true);
    }
  }, [fetchReportsData, hasMore, loadingPatrols, loadingIncidents, loadingMore, page, tab]);

  const activeReports =
    tab === 'patrol' ? patrolReports : incidentReports;

  const showShimmer =
    (tab === 'patrol' && loadingPatrols && patrolReports.length === 0) ||
    (tab === 'incident' && loadingIncidents && incidentReports.length === 0);

  const handleDateFilter = (filter: DateFilter) => {
    dispatch(setDateFilter(filter));
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
                  if (tab !== 'patrol') dispatch(setTab('patrol'));
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
                  if (tab !== 'incident') dispatch(setTab('incident'));
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
                placeholder="Search..."
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={(v) => dispatch(setSearch(v))}
              />
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  (selectedGuardIds.length > 0 || selectedSiteIds.length > 0) &&
                    styles.filterBtnActive,
                ]}
                onPress={() => setShowAllFilters(true)}
              >
                <Filter
                  size={16}
                  color={
                    selectedGuardIds.length > 0 || selectedSiteIds.length > 0
                      ? Colors.accent
                      : Colors.textMuted
                  }
                />
                {(selectedGuardIds.length > 0 || selectedSiteIds.length > 0) && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {selectedGuardIds.length + selectedSiteIds.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <View style={[sharedStyles.chipRow, { flexWrap: 'nowrap', gap: 3, marginBottom: 12 }]}>
              {DATE_FILTERS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[
                    sharedStyles.chip,
                    { flex: 1, paddingHorizontal: 2, paddingVertical: 5, alignItems: 'center' },
                    dateFilter === f && sharedStyles.chipActive,
                  ]}
                  onPress={() => handleDateFilter(f)}
                >
                  <Text
                    style={[
                      sharedStyles.chipText,
                      { fontSize: 8, textAlign: 'center' },
                      dateFilter === f && sharedStyles.chipTextActive,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  sharedStyles.chip,
                  { flex: 1, paddingHorizontal: 2, paddingVertical: 5, alignItems: 'center' },
                  selectedGuardIds.length > 0 && sharedStyles.chipActive,
                ]}
                onPress={() => setShowGuardFilter(true)}
              >
                <Text
                  style={[
                    sharedStyles.chipText,
                    { fontSize: 8, textAlign: 'center' },
                    selectedGuardIds.length > 0 && sharedStyles.chipTextActive,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  Guards{selectedGuardIds.length > 0 ? `(${selectedGuardIds.length})` : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  sharedStyles.chip,
                  { flex: 1, paddingHorizontal: 2, paddingVertical: 5, alignItems: 'center' },
                  selectedSiteIds.length > 0 && sharedStyles.chipActive,
                ]}
                onPress={() => setShowSiteFilter(true)}
              >
                <Text
                  style={[
                    sharedStyles.chipText,
                    { fontSize: 8, textAlign: 'center' },
                    selectedSiteIds.length > 0 && sharedStyles.chipTextActive,
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  Sites{selectedSiteIds.length > 0 ? `(${selectedSiteIds.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {dateFilter === 'Custom' && (
              <View style={styles.customDateRow}>
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Calendar size={14} color={Colors.accent} />
                  <Text style={styles.datePickerText}>
                    From: {formatDate(startDate)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={() => setShowEndPicker(true)}
                >
                  <Calendar size={14} color={Colors.accent} />
                  <Text style={styles.datePickerText}>
                    To: {formatDate(endDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
      >
        {showShimmer ? (
          <ManagerReportsShimmer variant={tab} />
        ) : activeReports.length === 0 ? (
          <Text style={styles.emptyText}>No reports found.</Text>
        ) : tab === 'patrol' ? (
          patrolReports.map((r: ManagerPatrolReportItem, index: number) => (
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
          incidentReports.map((r: ManagerIncidentReportItem) => (
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
        {(loadingMore || (refreshing && !showShimmer)) ? (
          <ActivityIndicator color={Colors.accent} style={styles.loadMore} />
        ) : null}
      </ManagerListLayout>

      {showStartPicker && (
        <ManagerCalendarModal
          visible={showStartPicker}
          selectedDate={startDate}
          onClose={() => setShowStartPicker(false)}
          onSelectDate={(date) => {
            dispatch(setCustomDates({ startDate: date.toISOString(), endDate: endDateStr }));
            setShowStartPicker(false);
          }}
        />
      )}
      {showEndPicker && (
        <ManagerCalendarModal
          visible={showEndPicker}
          selectedDate={endDate}
          onClose={() => setShowEndPicker(false)}
          onSelectDate={(date) => {
            dispatch(setCustomDates({ startDate: startDateStr, endDate: date.toISOString() }));
            setShowEndPicker(false);
          }}
        />
      )}

      {showGuardFilter && (
        <ManagerSearchableFilterModal
          visible={showGuardFilter}
          title="Guards"
          data={guards}
          selectedIds={selectedGuardIds}
          onClose={() => setShowGuardFilter(false)}
          onApply={ids => {
            dispatch(setSelectedGuardIds(ids));
            setShowGuardFilter(false);
          }}
          onClear={() => {
            dispatch(setSelectedGuardIds([]));
            setShowGuardFilter(false);
          }}
        />
      )}
      {showSiteFilter && (
        <ManagerSearchableFilterModal
          visible={showSiteFilter}
          title="Sites"
          data={sites}
          selectedIds={selectedSiteIds}
          onClose={() => setShowSiteFilter(false)}
          onApply={ids => {
            dispatch(setSelectedSiteIds(ids));
            setShowSiteFilter(false);
          }}
          onClear={() => {
            dispatch(setSelectedSiteIds([]));
            setShowSiteFilter(false);
          }}
        />
      )}
      {showAllFilters && (
        <ManagerMultiFilterModal
          visible={showAllFilters}
          guards={guards}
          sites={sites}
          selectedGuardIds={selectedGuardIds}
          selectedSiteIds={selectedSiteIds}
          onClose={() => setShowAllFilters(false)}
          onApply={(gIds, sIds) => {
            dispatch(setSelectedGuardIds(gIds));
            dispatch(setSelectedSiteIds(sIds));
            setShowAllFilters(false);
          }}
          onClear={() => {
            dispatch(resetFilters());
            setShowAllFilters(false);
          }}
        />
      )}
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
  filterBtn: {
    padding: 8,
    borderRadius: Radii.sm,
    backgroundColor: Colors.bgAlt,
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: Colors.accentLight,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  customDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  datePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  datePickerText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
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
