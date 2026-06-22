import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';
import type { ManagerStackScreenProps } from '../../navigation/types';
import { ManagerStackHeader, ManagerStackListLayout, ManagerStackShell, sharedStyles } from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import {
  ManagerAttendanceListShimmer,
  ManagerAttendanceSummaryShimmer,
} from '../../components/Shimmer';
import {
  getManagerGuardAttendance,
  mapManagerStatusColor,
  type ManagerAttendanceData,
} from '../../services/managerApi';

type Props = ManagerStackScreenProps<'ManagerGuardAttendance'>;

const statusIcons = {
  present: CheckCircle,
  late: Clock,
  absent: XCircle,
};

export default function ManagerGuardAttendanceScreen({ route }: Props) {
  const { guardId, name: routeName } = route.params ?? {};
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<ManagerAttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthOptions = useMemo(() => {
    const options: { month: number; year: number; label: string }[] = [];
    for (let i = -5; i <= 0; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      options.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      });
    }
    return options.reverse();
  }, [now]);

  const fetchAttendance = useCallback(async () => {
    if (!guardId) {
      setError('Guard not found');
      setLoading(false);
      return;
    }

    setError(null);
    const result = await getManagerGuardAttendance(guardId, month, year);

    if (result.success && result.data) {
      setData(result.data);
    } else {
      setData(null);
      setError(result.message ?? 'Failed to load attendance');
    }

    setLoading(false);
    setRefreshing(false);
  }, [guardId, month, year]);

  useEffect(() => {
    setLoading(true);
    fetchAttendance();
  }, [fetchAttendance]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAttendance();
  }, [fetchAttendance]);

  const name = data?.guard.name ?? routeName ?? 'Guard';
  const summary = data?.summary;
  const records = data?.records ?? [];
  const showShimmer = loading && !data;

  return (
    <ManagerStackShell
      header={<ManagerStackHeader title="Attendance" subtitle={name} />}
    >
      <ManagerStackListLayout
        refreshing={refreshing}
        onRefresh={onRefresh}
        fixedContent={
          <>
            {error ? <AuthErrorBanner message={error} /> : null}
            <View style={sharedStyles.chipRow}>
              {monthOptions.map(opt => {
                const active = opt.month === month && opt.year === year;
                return (
                  <TouchableOpacity
                    key={`${opt.year}-${opt.month}`}
                    style={[
                      sharedStyles.chip,
                      active && sharedStyles.chipActive,
                    ]}
                    onPress={() => {
                      setMonth(opt.month);
                      setYear(opt.year);
                      setLoading(true);
                    }}
                  >
                    <Text
                      style={[
                        sharedStyles.chipText,
                        active && sharedStyles.chipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {showShimmer ? (
              <ManagerAttendanceSummaryShimmer />
            ) : (
              <View style={styles.summaryRow}>
                <View style={[styles.sumCard, Shadows.card]}>
                  <Text style={[styles.sumNum, { color: Colors.success }]}>
                    {summary?.present ?? 0}
                  </Text>
                  <Text style={styles.sumLabel}>Present</Text>
                </View>
                <View style={[styles.sumCard, Shadows.card]}>
                  <Text style={[styles.sumNum, { color: Colors.warning }]}>
                    {summary?.late ?? 0}
                  </Text>
                  <Text style={styles.sumLabel}>Late</Text>
                </View>
                <View style={[styles.sumCard, Shadows.card]}>
                  <Text style={[styles.sumNum, { color: Colors.danger }]}>
                    {summary?.absent ?? 0}
                  </Text>
                  <Text style={styles.sumLabel}>Absent</Text>
                </View>
              </View>
            )}
          </>
        }
      >
        {showShimmer ? (
          <ManagerAttendanceListShimmer />
        ) : records.length === 0 ? (
          <Text style={styles.emptyText}>No attendance records.</Text>
        ) : (
          records.map(row => {
            const statusKey = row.status as keyof typeof statusIcons;
            const Icon = statusIcons[statusKey] ?? Clock;
            const color = mapManagerStatusColor(row.status_color);

            return (
              <View
                key={`${row.roster_id}-${row.date}`}
                style={[styles.row, Shadows.card]}
              >
                <View style={styles.rowLeft}>
                  <Text style={styles.date}>{row.date_label}</Text>
                  <Text style={styles.site}>{row.site_name}</Text>
                  <Text style={styles.shift}>{row.shift_time}</Text>
                  <Text style={styles.times}>
                    In: {row.checkin_time ?? '—'} · Out:{' '}
                    {row.checkout_time ?? '—'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${color}18` },
                  ]}
                >
                  <Icon size={14} color={color} />
                  <Text style={[styles.statusText, { color }]}>
                    {row.status_label}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ManagerStackListLayout>
    </ManagerStackShell>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  sumCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    alignItems: 'center',
  },
  sumNum: { fontSize: 22, fontWeight: '800' },
  sumLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  row: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flex: 1, paddingRight: 8 },
  date: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  site: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  shift: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 1 },
  times: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 3 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  statusText: { fontSize: 9, fontWeight: '700' },
});
