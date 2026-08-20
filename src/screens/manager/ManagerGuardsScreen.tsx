import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { Search, ChevronRight } from 'lucide-react-native';
import { useManagerNavigation } from '../../navigation/utils';
import { MANAGER_ROUTES } from '../../navigation/constants';
import {
  ManagerCompactTabShell,
  ManagerListLayout,
  MANAGER_TAB_INDEX,
  sharedStyles,
} from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import { ManagerGuardsShimmer } from '../../components/Shimmer';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import {
  guardAvatarPalette,
  mapManagerStatusColor,
  MANAGER_GUARD_FILTERS,
  type ManagerGuardListItem,
} from '../../services/managerApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchManagerGuards,
  selectManagerGuardsData,
  selectManagerGuardsLoading,
  selectGuardsSearch,
  selectGuardsStatusFilter,
  setSearch,
  setStatusFilter,
} from '../../store/slices/managerGuardsSlice';

export default function ManagerGuardsScreen() {
  const navigation = useManagerNavigation();
  const dispatch = useAppDispatch();

  const search = useAppSelector(selectGuardsSearch);
  const statusFilter = useAppSelector(selectGuardsStatusFilter);
  const debouncedQuery = useDebouncedValue(search, 400);

  const guardsData = useAppSelector(selectManagerGuardsData);
  const loading = useAppSelector(selectManagerGuardsLoading);

  const guards = guardsData?.guards ?? [];
  const summary = guardsData?.summary ?? null;

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuardsData = useCallback(async () => {
    setError(null);

    const result = await dispatch(fetchManagerGuards({
      search: debouncedQuery,
      status: 'all', // The API handles the core fetch, we filter locally as per original logic or we could pass statusFilter
      page: 1,
      per_page: 50,
    }));

    if (fetchManagerGuards.rejected.match(result)) {
      setError(result.payload as string ?? 'Failed to load guards');
    }

    setRefreshing(false);
  }, [debouncedQuery, dispatch]);

  useEffect(() => {
    fetchGuardsData();
  }, [fetchGuardsData]);

  const filteredGuards = useMemo(() => {
    return guards.filter((g: ManagerGuardListItem) => {
      if (statusFilter === 'on_duty') return g.status === 'on_duty';
      if (statusFilter === 'off_duty') return g.status === 'off_duty';
      return true;
    });
  }, [guards, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGuardsData();
  }, [fetchGuardsData]);

  const subtitle = summary
    ? `${summary.on_duty} on duty · ${summary.total} total`
    : 'Loading guards...';

  const showShimmer = loading && guards.length === 0;

  return (
    <ManagerCompactTabShell
      activeIndex={MANAGER_TAB_INDEX.GUARDS}
      title="Guards"
      subtitle={subtitle}
    >
      <ManagerListLayout
        refreshing={refreshing}
        onRefresh={onRefresh}
        toolbar={
          <>
            {error ? <AuthErrorBanner message={error} /> : null}
            <View style={[styles.searchRow, Shadows.card]}>
              <Search size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search guards or sites..."
                placeholderTextColor={Colors.textMuted}
                value={search}
                onChangeText={(v) => dispatch(setSearch(v))}
              />
            </View>
            <View style={sharedStyles.chipRow}>
              {MANAGER_GUARD_FILTERS.map(f => (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    sharedStyles.chip,
                    statusFilter === f.value && sharedStyles.chipActive,
                  ]}
                  onPress={() => dispatch(setStatusFilter(f.value))}
                >
                  <Text
                    style={[
                      sharedStyles.chipText,
                      statusFilter === f.value && sharedStyles.chipTextActive,
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        }
      >
        {showShimmer ? (
          <ManagerGuardsShimmer />
        ) : filteredGuards.length === 0 ? (
          <Text style={styles.emptyText}>No guards found.</Text>
        ) : (
          filteredGuards.map((g: ManagerGuardListItem, index: number) => {
            const palette = guardAvatarPalette[index % guardAvatarPalette.length];
            const statusColor = mapManagerStatusColor(g.status_color);

            return (
              <TouchableOpacity
                key={`${g.id}-${g.roster_id}`}
                style={[styles.guardRow, Shadows.card]}
                onPress={() =>
                  navigation.navigate(MANAGER_ROUTES.GUARD_DETAILS, {
                    guardId: String(g.id),
                    name: g.name,
                    rosterId: g.roster_id,
                    siteName: g.site_name,
                    statusText: g.status_label,
                  })
                }
              >
                <View style={[styles.avatar, { backgroundColor: palette.bg }]}>
                  <Text style={[styles.avatarText, { color: palette.color }]}>
                    {g.initials}
                  </Text>
                </View>
                <View style={styles.guardBody}>
                  <Text style={styles.name}>{g.name}</Text>
                  <Text style={styles.site}>{g.site_name}</Text>
                  <Text style={styles.shift}>{g.shift_time}</Text>
                </View>
                <View style={styles.right}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: `${statusColor}18` },
                    ]}
                  >
                    <View
                      style={[styles.dot, { backgroundColor: statusColor }]}
                    />
                    <Text style={[styles.badgeText, { color: statusColor }]}>
                      {g.status_label}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ManagerListLayout>
    </ManagerCompactTabShell>
  );
}

const styles = StyleSheet.create({
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
  guardRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guardBody: { flex: 1, minWidth: 0 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontWeight: '800' },
  name: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  site: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  shift: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 9, fontWeight: '700' },
});
