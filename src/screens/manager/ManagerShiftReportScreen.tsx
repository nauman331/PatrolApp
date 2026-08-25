import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { SectionHeader } from '../../components';
import { MapPin, Clock, Footprints, Share2, Mail } from 'lucide-react-native';
import type { ManagerStackScreenProps } from '../../navigation/types';
import {
  ManagerStackHeader,
  ManagerStackListLayout,
  ManagerStackShell,
} from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import { formatDateTimeFull } from '../../utils';
import {
  ManagerShiftReportFixedShimmer,
  ManagerShiftReportListShimmer,
} from '../../components/Shimmer';
import {
  getManagerPatrolReportDetail,
  type ManagerPatrolReportDetailData,
} from '../../services/managerApi';
import { formatFullDisplayDate } from '../../services/guardJobsMapper';
import { shareReport } from '../../services/managerReportActions';
import { DownloadButton } from '../../components/DownloadButton';

type Props = ManagerStackScreenProps<'ManagerShiftReport'>;

export default function ManagerShiftReportScreen({ route }: Props) {
  const navigation = useNavigation<any>();
  const {
    guardId,
    siteId,
    date: routeDate,
    guardName: routeGuardName,
    site: routeSite,
  } = route.params ?? {};

  const [data, setData] = useState<ManagerPatrolReportDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sharing, setSharing] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isBusy = sharing || emailing || downloading;

  const handleShare = useCallback(async () => {
    if (isBusy || !data) return;
    setSharing(true);
    try {
      await shareReport(
        'patrol',
        data,
        'share',
        undefined,
        () => setSharing(false),
      );
    } catch (err) {
      console.error('Share patrol report failed:', err);
    } finally {
      setSharing(false);
    }
  }, [data, isBusy]);

  const handleEmail = useCallback(async () => {
    if (isBusy || !data) return;
    setEmailing(true);
    try {
      await shareReport(
        'patrol',
        data,
        'email',
        undefined,
        () => setEmailing(false),
      );
    } catch (err) {
      console.error('Email patrol report failed:', err);
    } finally {
      setEmailing(false);
    }
  }, [data, isBusy]);

  const displayDate = routeDate || new Date().toISOString().slice(0, 10);

  const fetchDetail = useCallback(async (dateStr: string) => {
    if (!guardId || !siteId) {
      setError('Missing guard or site parameters');
      setLoading(false);
      return;
    }

    setError(null);
    const result = await getManagerPatrolReportDetail(guardId, siteId, dateStr);

    if (result.success && result.data) {
      setData(result.data);
    } else {
      setData(null);
      setError(result.message ?? 'Failed to load patrol report');
    }

    setLoading(false);
    setRefreshing(false);
  }, [guardId, siteId]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail(displayDate);
    }, [fetchDetail, displayDate]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail(displayDate);
  }, [fetchDetail, displayDate]);

  const guardName = data?.guard.name ?? routeGuardName ?? 'Guard';
  const siteName = data?.site.name ?? routeSite ?? 'Site';
  const summary = data?.summary;
  const patrols = data?.patrols ?? [];
  const showShimmer = loading && !data;

  const summaryCards = summary
    ? [
        { value: String(summary.patrols_count), label: 'Patrols', highlight: false },
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
          subtitle={`${siteName} · ${guardName}${data?.date ? ` · ${formatFullDisplayDate(data.date)}` : ''}`}
        />
      }
    >
      <ManagerStackListLayout
        refreshing={refreshing}
        onRefresh={onRefresh}
        fixedContent={
          <View style={{ marginHorizontal: -4 }}>
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
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {s.value}
                      </Text>
                      <Text style={styles.sumLabel} numberOfLines={1}>
                        {s.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {data ? (
                  <View style={styles.actionRow}>
                    <DownloadButton
                      label="Download"
                      style={{ flex: 1 }}
                      disabled={isBusy}
                      onDownload={async (onProgress) => {
                        setDownloading(true);
                        try {
                          return await shareReport('patrol', data, 'download', onProgress);
                        } finally {
                          setDownloading(false);
                        }
                      }}
                    />
                    <TouchableOpacity
                      style={[styles.actionBtn, Shadows.card, isBusy && styles.actionBtnDisabled]}
                      onPress={handleShare}
                      disabled={isBusy}
                    >
                      {sharing ? (
                        <ActivityIndicator size="small" color={Colors.accent} />
                      ) : (
                        <>
                          <Share2 size={16} color={Colors.accent} />
                          <Text style={styles.actionBtnText}>Share</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, Shadows.card, isBusy && styles.actionBtnDisabled]}
                      onPress={handleEmail}
                      disabled={isBusy}
                    >
                      {emailing ? (
                        <ActivityIndicator size="small" color={Colors.accent} />
                      ) : (
                        <>
                          <Mail size={16} color={Colors.accent} />
                          <Text style={styles.actionBtnText}>Email</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}

                {data?.site.address ? (
                  <TouchableOpacity
                    style={[styles.siteCard, Shadows.card]}
                    onPress={() => navigation.navigate('ManagerSiteDetail', { siteId: data.site.id })}
                  >
                    <MapPin size={14} color={Colors.accent} />
                    <Text style={styles.siteAddress} numberOfLines={1}>{data.site.address}</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
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
                      {formatDateTimeFull(patrol.started_at)}
                      {patrol.completed_at ? ` – ${formatDateTimeFull(patrol.completed_at)}` : ''}
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
                          {scanner.scan_at ? formatDateTimeFull(scanner.scan_at) : 'Not scanned'}
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
  summaryRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 10,
    marginTop: 10,
  },
  sumCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderWidth: 1.2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  sumCardHL: {
    borderColor: Colors.accentAlpha25,
    backgroundColor: Colors.accentLight,
  },
  sumNum: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  sumNumHL: { color: Colors.accent },
  sumLabel: { fontSize: 8.5, color: Colors.textMuted, marginTop: 2, fontWeight: '600' },
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgCard,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionBtnDisabled: {
    opacity: 0.7,
  },
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
