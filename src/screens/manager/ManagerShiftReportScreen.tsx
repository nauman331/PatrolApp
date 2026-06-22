import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { SectionHeader } from '../../components';
import { MapPin, Clock, Footprints } from 'lucide-react-native';
import type { ManagerStackScreenProps } from '../../navigation/types';
import { ManagerStackHeader, ManagerStackListLayout, ManagerStackShell } from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import {
  ManagerShiftReportFixedShimmer,
  ManagerShiftReportListShimmer,
} from '../../components/Shimmer';
import {
  getManagerPatrolReportDetail,
  type ManagerPatrolReportDetailData,
} from '../../services/managerApi';

type Props = ManagerStackScreenProps<'ManagerShiftReport'>;

export default function ManagerShiftReportScreen({ route }: Props) {
  const {
    guardId,
    siteId,
    date,
    guardName: routeGuardName,
    site: routeSite,
  } = route.params ?? {};

  const [data, setData] = useState<ManagerPatrolReportDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!guardId || !siteId || !date) {
      setError('Missing report parameters');
      setLoading(false);
      return;
    }

    setError(null);
    const result = await getManagerPatrolReportDetail(guardId, siteId, date);

    if (result.success && result.data) {
      setData(result.data);
    } else {
      setData(null);
      setError(result.message ?? 'Failed to load patrol report');
    }

    setLoading(false);
    setRefreshing(false);
  }, [guardId, siteId, date]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDetail();
    }, [fetchDetail]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail();
  }, [fetchDetail]);

  const guardName = data?.guard.name ?? routeGuardName ?? 'Guard';
  const siteName = data?.site.name ?? routeSite ?? 'Site';
  const summary = data?.summary;
  const patrols = data?.patrols ?? [];
  const showShimmer = loading && !data;

  const summaryCards = summary
    ? [
        { value: String(summary.patrols_count), label: 'Patrols', highlight: true },
        {
          value: String(summary.completed_count),
          label: 'Completed',
          highlight: false,
        },
        {
          value: `${summary.compliance_percentage}%`,
          label: 'Compliance',
          highlight: false,
        },
        {
          value: `${summary.nfc_scans_completed}/${summary.nfc_scans_total}`,
          label: 'NFC Scans',
          highlight: false,
        },
      ]
    : [];

  return (
    <ManagerStackShell
      header={
        <ManagerStackHeader
          title="Patrol Report"
          subtitle={`${siteName} · ${guardName}${data?.date_label ? ` · ${data.date_label}` : ''}`}
        />
      }
    >
      <ManagerStackListLayout
        refreshing={refreshing}
        onRefresh={onRefresh}
        fixedContent={
          <>
            {error ? <AuthErrorBanner message={error} /> : null}
            {showShimmer ? (
              <ManagerShiftReportFixedShimmer />
            ) : (
              <>
                <View style={styles.summaryRow}>
                  {summaryCards.map((s, i) => (
                    <View
                      key={i}
                      style={[
                        styles.sumCard,
                        s.highlight && styles.sumCardHL,
                        Shadows.card,
                      ]}
                    >
                      <Text
                        style={[styles.sumNum, s.highlight && styles.sumNumHL]}
                      >
                        {s.value}
                      </Text>
                      <Text style={styles.sumLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                {data?.site.address ? (
                  <View style={[styles.siteCard, Shadows.card]}>
                    <MapPin size={14} color={Colors.accent} />
                    <Text style={styles.siteAddress}>{data.site.address}</Text>
                  </View>
                ) : null}
              </>
            )}
          </>
        }
        listHeader={<SectionHeader title="Patrols" />}
      >
        {showShimmer ? (
          <ManagerShiftReportListShimmer />
        ) : (
          <>
            {patrols.length === 0 ? (
              <Text style={styles.emptyText}>No patrols recorded.</Text>
            ) : (
              patrols.map(patrol => (
                <View key={patrol.id} style={[styles.patrolCard, Shadows.card]}>
                  <View style={styles.patrolHeader}>
                    <Footprints size={14} color={Colors.accent} />
                    <Text style={styles.patrolTitle}>
                      Patrol #{patrol.id} · {patrol.compliance_percentage}%
                      compliance
                    </Text>
                  </View>
                  <View style={styles.patrolMeta}>
                    <Clock size={12} color={Colors.textMuted} />
                    <Text style={styles.patrolTime}>
                      {patrol.started_at}
                      {patrol.completed_at ? ` – ${patrol.completed_at}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.scannerSummary}>
                    {patrol.scanners_completed}/{patrol.scanners_total} scanners
                    completed
                  </Text>

                  {(patrol.scanners ?? []).map(scanner => (
                    <View key={scanner.id} style={styles.scannerRow}>
                      <View
                        style={[
                          styles.scannerDot,
                          {
                            backgroundColor:
                              scanner.status === 'completed'
                                ? Colors.success
                                : Colors.textMuted,
                          },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.scannerName}>{scanner.name}</Text>
                        <Text style={styles.scannerTime}>
                          {scanner.scan_at ?? 'Not scanned'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ManagerStackListLayout>
    </ManagerStackShell>
  );
}

const styles = StyleSheet.create({
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  sumCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 12,
    paddingHorizontal: 14,
    minWidth: 90,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sumCardHL: {
    borderColor: Colors.accentAlpha25,
    backgroundColor: Colors.accentLight,
  },
  sumNum: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  sumNumHL: { color: Colors.accent },
  sumLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  siteCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  siteAddress: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  patrolCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  patrolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  patrolTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  patrolMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  patrolTime: { fontSize: FontSizes.xs, color: Colors.textMuted },
  scannerSummary: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  scannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  scannerDot: { width: 6, height: 6, borderRadius: 3 },
  scannerName: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary },
  scannerTime: { fontSize: FontSizes.xs, color: Colors.textMuted },
});
