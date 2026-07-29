import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { SectionHeader } from '../../components';
import {
  MapPin,
  Users,
  Search,
  Clock,
  Filter,
  Calendar,
  X,
  Check,
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
  getManagerGuardsSites,
  getManagerRosterShifts,
  getManagerRosterSites,
  type ManagerFilterGuard,
  type ManagerFilterSite,
  type ManagerPeriod,
  type ManagerShiftAssignment,
  type ManagerSiteAssignment,
} from '../../services/managerApi';
import { formatFullDisplayDate } from '../../services/guardJobsMapper';
import { formatDate } from '../../utils';

type RosterTab = 'shifts' | 'sites';

const PERIOD_FILTERS = [
  'Today',
  'This Week',
  'This Month',
  'Custom',
] as const;
type WeekPeriodFilter = (typeof PERIOD_FILTERS)[number];

function apiPeriodForFilter(filter: WeekPeriodFilter): ManagerPeriod {
  if (filter === 'Today') return 'today';
  if (filter === 'This Week') return 'this_week';
  if (filter === 'This Month') return 'this_month';
  if (filter === 'Custom') return 'custom';
  return 'today';
}

export default function ManagerRosterScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<RosterTab>('shifts');
  const [periodFilter, setPeriodFilter] = useState<WeekPeriodFilter>('Today');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);

  const [shiftsData, setShiftsData] = useState<Awaited<
    ReturnType<typeof getManagerRosterShifts>
  >['data']>(undefined);
  const [sitesData, setSitesData] = useState<Awaited<
    ReturnType<typeof getManagerRosterSites>
  >['data']>(undefined);

  const [guards, setGuards] = useState<ManagerFilterGuard[]>([]);
  const [sites, setSites] = useState<ManagerFilterSite[]>([]);
  const [selectedGuardIds, setSelectedGuardIds] = useState<number[]>([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState<number[]>([]);
  const [showGuardFilter, setShowGuardFilter] = useState(false);
  const [showSiteFilter, setShowSiteFilter] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const apiPeriod = apiPeriodForFilter(periodFilter);

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

  const fetchShifts = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1 && !append) {
        setLoading(true);
        setShiftsData({ assignments: [] } as any);
      } else {
        setLoadingMore(true);
      }
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
              start_date: startDate.toISOString().slice(0, 10),
              end_date: endDate.toISOString().slice(0, 10),
            }
          : {}),
      };

      const result = await getManagerRosterShifts(params);

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
    [
      apiPeriod,
      debouncedSearch,
      selectedGuardIds,
      selectedSiteIds,
      startDate,
      endDate,
    ],
  );

  const fetchSites = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1 && !append) {
        setLoading(true);
        setSitesData({ sites: [] } as any);
      } else {
        setLoadingMore(true);
      }
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
              start_date: startDate.toISOString().slice(0, 10),
              end_date: endDate.toISOString().slice(0, 10),
            }
          : {}),
      };

      const result = await getManagerRosterSites(params);

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
    [
      apiPeriod,
      debouncedSearch,
      selectedGuardIds,
      selectedSiteIds,
      startDate,
      endDate,
    ],
  );

  useEffect(() => {
    fetchShifts(1, false);
    fetchSites(1, false);
  }, [fetchShifts, fetchSites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShifts(1, false);
    fetchSites(1, false);
  }, [fetchShifts, fetchSites]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    if (tab === 'shifts') fetchShifts(page + 1, true);
    else fetchSites(page + 1, true);
  }, [fetchShifts, fetchSites, hasMore, loading, loadingMore, page, tab]);

  const handlePeriodFilter = (filter: WeekPeriodFilter) => {
    setPeriodFilter(filter);
    setLoading(true);
  };

  const showShiftsShimmer = loading && tab === 'shifts';
  const showSitesShimmer = loading && tab === 'sites';

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

  const shiftsToolbar = (
    <>
      <View style={[styles.searchRow, Shadows.card]}>
        <Search size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
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

        {loadingMore ? (
          <ActivityIndicator color={Colors.accent} style={styles.loadMore} />
        ) : null}
      </ManagerListLayout>

      {showStartPicker && (
        <ManagerCalendarModal
          visible={showStartPicker}
          selectedDate={startDate}
          onClose={() => setShowStartPicker(false)}
          onSelectDate={(date) => {
            setStartDate(date);
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
            setEndDate(date);
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
            setSelectedGuardIds(ids);
            setShowGuardFilter(false);
          }}
          onClear={() => {
            setSelectedGuardIds([]);
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
            setSelectedSiteIds(ids);
            setShowSiteFilter(false);
          }}
          onClear={() => {
            setSelectedSiteIds([]);
            setShowSiteFilter(false);
          }}
        />
      )}
      {showAllFilters && (
        <ManagerRosterFiltersModal
          visible={showAllFilters}
          guards={guards}
          sites={sites}
          selectedGuardIds={selectedGuardIds}
          selectedSiteIds={selectedSiteIds}
          onClose={() => setShowAllFilters(false)}
          onApply={(gIds, sIds) => {
            setSelectedGuardIds(gIds);
            setSelectedSiteIds(sIds);
            setShowAllFilters(false);
          }}
          onClear={() => {
            setSelectedGuardIds([]);
            setSelectedSiteIds([]);
            setShowAllFilters(false);
          }}
        />
      )}
    </ManagerCompactTabShell>
  );
}

function ManagerSearchableFilterModal({
  visible,
  title,
  data,
  selectedIds,
  onClose,
  onApply,
  onClear,
}: {
  visible: boolean;
  title: string;
  data: { id: number; name: string }[];
  selectedIds: number[];
  onClose: () => void;
  onApply: (ids: number[]) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>(selectedIds);

  useEffect(() => {
    if (visible) {
      setTempSelectedIds(selectedIds);
      setSearch('');
    }
  }, [visible, selectedIds]);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const s = search.toLowerCase();
    return data.filter(item => item.name.toLowerCase().includes(s));
  }, [data, search]);

  const toggleId = (id: number) => {
    setTempSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{title} Filter</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.searchBox}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={modalStyles.searchInput}
              placeholder={`Search ${title.toLowerCase()}...`}
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView style={modalStyles.content}>
            <View style={modalStyles.chipRow}>
              {filteredData.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    modalStyles.chip,
                    tempSelectedIds.includes(item.id) && modalStyles.chipActive,
                  ]}
                  onPress={() => toggleId(item.id)}
                >
                  <Text
                    style={[
                      modalStyles.chipText,
                      tempSelectedIds.includes(item.id) && modalStyles.chipTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {tempSelectedIds.includes(item.id) && (
                    <Check size={12} color={Colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
              {filteredData.length === 0 && (
                <Text style={modalStyles.emptyText}>No results found.</Text>
              )}
            </View>
          </ScrollView>

          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.resetBtn} onPress={onClear}>
              <Text style={modalStyles.resetBtnText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.applyBtn}
              onPress={() => onApply(tempSelectedIds)}
            >
              <Text style={modalStyles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ManagerRosterFiltersModal({
  visible,
  guards,
  sites,
  selectedGuardIds,
  selectedSiteIds,
  onClose,
  onApply,
  onClear,
}: {
  visible: boolean;
  guards: ManagerFilterGuard[];
  sites: ManagerFilterSite[];
  selectedGuardIds: number[];
  selectedSiteIds: number[];
  onClose: () => void;
  onApply: (guardIds: number[], siteIds: number[]) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState('');
  const [tempGuardIds, setTempGuardIds] = useState<number[]>(selectedGuardIds);
  const [tempSiteIds, setTempSiteIds] = useState<number[]>(selectedSiteIds);

  useEffect(() => {
    if (visible) {
      setTempGuardIds(selectedGuardIds);
      setTempSiteIds(selectedSiteIds);
      setSearch('');
    }
  }, [visible, selectedGuardIds, selectedSiteIds]);

  const filteredGuards = useMemo(() => {
    if (!search) return guards;
    const s = search.toLowerCase();
    return guards.filter(g => g.name.toLowerCase().includes(s));
  }, [guards, search]);

  const filteredSites = useMemo(() => {
    if (!search) return sites;
    const s = search.toLowerCase();
    return sites.filter(s_item => s_item.name.toLowerCase().includes(s));
  }, [sites, search]);

  const toggleGuard = (id: number) => {
    setTempGuardIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const toggleSite = (id: number) => {
    setTempSiteIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={modalStyles.searchBox}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={modalStyles.searchInput}
              placeholder="Search guards or sites..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView style={modalStyles.content}>
            {filteredGuards.length > 0 && (
              <>
                <Text style={modalStyles.sectionTitle}>Guards</Text>
                <View style={modalStyles.chipRow}>
                  {filteredGuards.map(g => (
                    <TouchableOpacity
                      key={g.id}
                      style={[
                        modalStyles.chip,
                        tempGuardIds.includes(g.id) && modalStyles.chipActive,
                      ]}
                      onPress={() => toggleGuard(g.id)}
                    >
                      <Text
                        style={[
                          modalStyles.chipText,
                          tempGuardIds.includes(g.id) && modalStyles.chipTextActive,
                        ]}
                      >
                        {g.name}
                      </Text>
                      {tempGuardIds.includes(g.id) && (
                        <Check size={12} color={Colors.accent} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {filteredSites.length > 0 && (
              <>
                <Text
                  style={[
                    modalStyles.sectionTitle,
                    { marginTop: filteredGuards.length > 0 ? 20 : 0 },
                  ]}
                >
                  Sites
                </Text>
                <View style={modalStyles.chipRow}>
                  {filteredSites.map(s => (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        modalStyles.chip,
                        tempSiteIds.includes(s.id) && modalStyles.chipActive,
                      ]}
                      onPress={() => toggleSite(s.id)}
                    >
                      <Text
                        style={[
                          modalStyles.chipText,
                          tempSiteIds.includes(s.id) && modalStyles.chipTextActive,
                        ]}
                      >
                        {s.name}
                      </Text>
                      {tempSiteIds.includes(s.id) && (
                        <Check size={12} color={Colors.accent} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {filteredGuards.length === 0 && filteredSites.length === 0 && (
              <Text style={modalStyles.emptyText}>No results found.</Text>
            )}
          </ScrollView>

          <View style={modalStyles.footer}>
            <TouchableOpacity style={modalStyles.resetBtn} onPress={onClear}>
              <Text style={modalStyles.resetBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={modalStyles.applyBtn}
              onPress={() => onApply(tempGuardIds, tempSiteIds)}
            >
              <Text style={modalStyles.applyBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgPage,
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  content: { padding: 20, flexGrow: 1 },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 20,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgPage,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentAlpha25,
  },
  chipText: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  chipTextActive: { color: Colors.accent, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetBtnText: { color: Colors.textSecondary, fontWeight: '600' },
  applyBtn: {
    flex: 2,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: Radii.md,
  },
  applyBtnText: { color: Colors.white, fontWeight: '700' },
});

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
    backgroundColor: Colors.bgPage,
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
