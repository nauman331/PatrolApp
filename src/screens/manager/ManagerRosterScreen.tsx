import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { SectionHeader } from '../../components';
import {
  MapPin,
  Search,
  Clock,
  Filter,
  Calendar,
} from 'lucide-react-native';
import {
  ManagerCompactTabShell,
  ManagerListLayout,
  MANAGER_TAB_INDEX,
  sharedStyles,
} from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import {
  ManagerRosterListShimmer,
} from '../../components/Shimmer';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { ManagerCalendarModal } from './ManagerCalendarModal';
import {
  ManagerMultiFilterModal,
  ManagerSearchableFilterModal,
} from '../../components/ManagerFilterModals';
import {
  getManagerGuardsSites,
  type ManagerFilterGuard,
  type ManagerFilterSite,
  type ManagerPeriod,
  type ManagerShiftAssignment,
  type ManagerSiteAssignment,
} from '../../services/managerApi';
import { formatFullDisplayDate } from '../../services/guardJobsMapper';
import { formatDate } from '../../utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchManagerShifts,
  fetchManagerSites,
  selectManagerShifts,
  selectManagerSites,
  selectLoadingShifts,
  selectLoadingSites,
  selectRosterTab,
  selectRosterPeriodFilter,
  selectRosterSearch,
  selectRosterSelectedGuardIds,
  selectRosterSelectedSiteIds,
  selectRosterStartDate,
  selectRosterEndDate,
  setTab,
  setPeriodFilter,
  setSearch,
  setSelectedGuardIds,
  setSelectedSiteIds,
  setCustomDates,
  resetFilters,
  type PeriodFilter,
} from '../../store/slices/managerRosterSlice';

const PERIOD_FILTERS: PeriodFilter[] = ['Today', 'This Week', 'This Month', 'Custom'];

export default function ManagerRosterScreen() {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const tab = useAppSelector(selectRosterTab);
  const periodFilter = useAppSelector(selectRosterPeriodFilter);
  const search = useAppSelector(selectRosterSearch);
  const selectedGuardIds = useAppSelector(selectRosterSelectedGuardIds);
  const selectedSiteIds = useAppSelector(selectRosterSelectedSiteIds);
  const startDateStr = useAppSelector(selectRosterStartDate);
  const endDateStr = useAppSelector(selectRosterEndDate);

  const startDate = useMemo(() => new Date(startDateStr), [startDateStr]);
  const endDate = useMemo(() => new Date(endDateStr), [endDateStr]);

  const debouncedSearch = useDebouncedValue(search, 400);

  const shiftsData = useAppSelector(selectManagerShifts);
  const sitesData = useAppSelector(selectManagerSites);
  const loadingShifts = useAppSelector(selectLoadingShifts);
  const loadingSites = useAppSelector(selectLoadingSites);

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

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const apiPeriod = useMemo(() => {
    if (periodFilter === 'Today') return 'today' as ManagerPeriod;
    if (periodFilter === 'This Week') return 'this_week' as ManagerPeriod;
    if (periodFilter === 'This Month') return 'this_month' as ManagerPeriod;
    if (periodFilter === 'Custom') return 'custom' as ManagerPeriod;
    return 'today' as ManagerPeriod;
  }, [periodFilter]);

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

  const guardIdsKey = selectedGuardIds.join(',');
  const siteIdsKey = selectedSiteIds.join(',');

  const fetchShiftsData = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum !== 1) setLoadingMore(true);
      setError(null);

      const params = {
        period: apiPeriod,
        search: debouncedSearch,
        page: pageNum,
        per_page: 20,
        guard_ids: selectedGuardIds,
        site_ids: selectedSiteIds,
        ...(apiPeriod === 'custom'
          ? {
              start_date: startDateStr.slice(0, 10),
              end_date: endDateStr.slice(0, 10),
            }
          : {}),
      };

      const result = await dispatch(fetchManagerShifts(params));

      if (fetchManagerShifts.fulfilled.match(result)) {
        setHasMore(result.payload.pagination?.has_more ?? false);
        setPage(pageNum);
      } else {
        setError(result.payload as string ?? 'Failed to load shifts');
      }

      setLoadingMore(false);
      setRefreshing(false);
    },
    [
      apiPeriod,
      debouncedSearch,
      guardIdsKey,
      siteIdsKey,
      startDateStr,
      endDateStr,
      dispatch
    ],
  );

  const fetchSitesData = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum !== 1) setLoadingMore(true);
      setError(null);

      const params = {
        period: apiPeriod,
        search: debouncedSearch,
        page: pageNum,
        per_page: 20,
        guard_ids: selectedGuardIds,
        site_ids: selectedSiteIds,
        ...(apiPeriod === 'custom'
          ? {
              start_date: startDateStr.slice(0, 10),
              end_date: endDateStr.slice(0, 10),
            }
          : {}),
      };

      const result = await dispatch(fetchManagerSites(params));

      if (fetchManagerSites.fulfilled.match(result)) {
        setHasMore(result.payload.pagination?.has_more ?? false);
        setPage(pageNum);
      } else {
        setError(result.payload as string ?? 'Failed to load sites');
      }

      setLoadingMore(false);
      setRefreshing(false);
    },
    [
      apiPeriod,
      debouncedSearch,
      guardIdsKey,
      siteIdsKey,
      startDateStr,
      endDateStr,
      dispatch
    ],
  );

  useEffect(() => {
    if (tab === 'shifts') {
      fetchShiftsData(1, false);
    } else {
      fetchSitesData(1, false);
    }
  }, [tab, fetchShiftsData, fetchSitesData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (tab === 'shifts') {
      fetchShiftsData(1, false);
    } else {
      fetchSitesData(1, false);
    }
  }, [tab, fetchShiftsData, fetchSitesData]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    if (tab === 'shifts') {
       if (!loadingShifts) fetchShiftsData(page + 1, true);
    } else {
       if (!loadingSites) fetchSitesData(page + 1, true);
    }
  }, [fetchShiftsData, fetchSitesData, hasMore, loadingShifts, loadingSites, loadingMore, page, tab]);

  const handlePeriodFilter = (filter: PeriodFilter) => {
    Keyboard.dismiss();
    dispatch(setPeriodFilter(filter));
  };

  const showShiftsShimmer = loadingShifts && (shiftsData?.assignments?.length ?? 0) === 0;
  const showSitesShimmer = loadingSites && (sitesData?.sites?.length ?? 0) === 0;

  const subtitle = useMemo(() => {
    if (periodFilter === 'Today') return "Today's assignments";
    if (periodFilter === 'This Week') return "This week's assignments";
    if (tab === 'shifts' && shiftsData?.period_label) return shiftsData.period_label;
    if (tab === 'sites' && sitesData?.period_label) return sitesData.period_label;
    return 'Shift & Site Assignments';
  }, [periodFilter, tab, shiftsData, sitesData]);

  const tabToolbar = (
    <View style={styles.tabRow}>
      {(
        [
          { key: 'shifts', label: 'Shifts' },
          { key: 'sites', label: 'Sites' },
        ] as const
      ).map(t => (
        <TouchableOpacity
          key={t.key}
          style={[styles.tab, tab === t.key && styles.tabActive]}
          onPress={() => {
            Keyboard.dismiss();
            if (tab !== t.key) {
              dispatch(setTab(t.key));
            }
          }}
        >
          <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const shiftsToolbar = (
    <>
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
        {PERIOD_FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[
              sharedStyles.chip,
              { flex: 1, paddingHorizontal: 2, paddingVertical: 5, alignItems: 'center' },
              periodFilter === f && sharedStyles.chipActive,
            ]}
            onPress={() => handlePeriodFilter(f)}
          >
            <Text
              style={[
                sharedStyles.chipText,
                { fontSize: 8, textAlign: 'center' },
                periodFilter === f && sharedStyles.chipTextActive,
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
      {periodFilter === 'Custom' && (
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
  );

  const listHeader =
    tab === 'shifts' ? (
      <SectionHeader
        title="Shift Assignments"
        action={periodFilter === 'Custom' ? '' : periodFilter}
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
        listHeader={listHeader}
      >
        {showShiftsShimmer ? (
          <ManagerRosterListShimmer variant="shifts" />
        ) : showSitesShimmer ? (
          <ManagerRosterListShimmer variant="sites" />
        ) : tab === 'shifts' ? (
          (shiftsData?.assignments ?? []).length === 0 ? (
            <Text style={styles.emptyText}>No shift assignments found.</Text>
          ) : (
            (shiftsData?.assignments ?? []).map((s: ManagerShiftAssignment) => (
              <TouchableOpacity
                key={s.roster_id}
                style={[styles.shiftRow, Shadows.card]}
                onPress={() => navigation.navigate('ManagerRosterDetail', { rosterId: s.roster_id })}
              >
                <View style={styles.shiftIcon}>
                  <Clock size={15} color={Colors.accent} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.shiftGuard}>
                    {s.title || s.site_name || 'Shift Assignment'}
                  </Text>
                  <Text style={styles.shiftMeta}>{s.guard_name} · {s.shift_time} · {formatFullDisplayDate(s.date)}</Text>
                  <Text style={styles.shiftZone}>
                   {s.zone}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : (sitesData?.sites ?? []).length === 0 ? (
          <Text style={styles.emptyText}>No site assignments found.</Text>
        ) : (
          (sitesData?.sites ?? []).map((s: ManagerSiteAssignment) => (
            <TouchableOpacity
              key={s.site_id}
              style={[styles.siteRow, Shadows.card]}
              onPress={() => navigation.navigate('ManagerSiteDetail', { siteId: s.site_id })}
            >
              <View style={styles.siteIcon}>
                <MapPin size={16} color={Colors.accent} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.siteName}>{s.site_name}</Text>
                <Text style={styles.siteMeta}>{s.guards_label}</Text>
                <Text style={styles.siteMeta}>{s.shifts_label}</Text>
                <Text style={styles.siteLead}>{s.lead_label}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        {(loadingMore || (refreshing && !showShiftsShimmer && !showSitesShimmer)) ? (
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
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  loadMore: { marginVertical: 12 },
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
