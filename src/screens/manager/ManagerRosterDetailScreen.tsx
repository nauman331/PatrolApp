import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import {
  Clock,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react-native';
import type { ManagerStackScreenProps } from '../../navigation/types';
import {
  ManagerStackHeader,
  ManagerStackListLayout,
  ManagerStackShell,
} from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import {
  getManagerRosterDetail,
  type ManagerRosterDetailData,
} from '../../services/managerApi';
import { ManagerRosterListShimmer } from '../../components/Shimmer';
import { formatFullDisplayDate } from '../../services/guardJobsMapper';

type Props = ManagerStackScreenProps<'ManagerRosterDetail'>;

export default function ManagerRosterDetailScreen({ route }: Props) {
  const { rosterId } = route.params;
  const [data, setData] = useState<ManagerRosterDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setError(null);
    const result = await getManagerRosterDetail(rosterId);

    if (result.success && result.data) {
      setData(result.data);
    } else {
      setData(null);
      setError(result.message ?? 'Failed to load roster details');
    }

    setLoading(false);
    setRefreshing(false);
  }, [rosterId]);

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

  const showShimmer = loading && !data;

  return (
    <ManagerStackShell
      header={
        <ManagerStackHeader
          title="Shift Detail"
          subtitle={data ? formatFullDisplayDate(data.roster.shift_date) : 'Loading...'}
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
               <View style={{ marginTop: 12 }}>
                 <ManagerRosterListShimmer variant="shifts" />
               </View>
            ) : data ? (
              <View style={[styles.headerCard, Shadows.card]}>
                <View style={styles.headerTop}>
                  <View style={styles.iconWrap}>
                    <Clock size={18} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{data.roster.site.site_name}</Text>
                    <Text style={styles.subtitle}>
                      {data.roster.guards.name} · {data.roster.start_time.substring(0, 5)} - {data.roster.end_time.substring(0, 5)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: data.roster.status === 'completed' ? Colors.successLight : Colors.warningLight }]}>
                    <Text style={[styles.statusText, { color: data.roster.status === 'completed' ? Colors.success : Colors.warning }]}>
                      {data.roster.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </>
        }
      >
        {showShimmer ? (
            <View style={{ gap: 12 }}>
                <ManagerRosterListShimmer variant="sites" />
                <ManagerRosterListShimmer variant="shifts" />
            </View>
        ) : data ? (
          <>
            <View style={[styles.sectionCard, Shadows.card]}>
              <Text style={styles.sectionTitle}>Shift Information</Text>
              <View style={styles.infoRow}>
                <Clock size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>Date: {formatFullDisplayDate(data.roster.shift_date)}</Text>
              </View>
              <View style={styles.infoRow}>
                <User size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>Guard: {data.roster.guards.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <MapPin size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>Site: {data.roster.site.site_name}</Text>
              </View>
            </View>

            {data.activity && (
              <View style={[styles.sectionCard, Shadows.card]}>
                <Text style={styles.sectionTitle}>Attendance Activity</Text>
                <View style={styles.infoRow}>
                  <CheckCircle2 size={14} color={Colors.success} />
                  <Text style={styles.infoText}>Sign In: {data.activity.signin_time || 'Not signed in'}</Text>
                </View>
                {data.activity.signin_notes && (
                    <Text style={styles.noteText}>Note: {data.activity.signin_notes}</Text>
                )}
                <View style={[styles.infoRow, { marginTop: 8 }]}>
                  <XCircle size={14} color={Colors.danger} />
                  <Text style={styles.infoText}>Sign Out: {data.activity.signout_time || 'Not signed out'}</Text>
                </View>
                {data.activity.signout_notes && (
                    <Text style={styles.noteText}>Note: {data.activity.signout_notes}</Text>
                )}
              </View>
            )}

            {data.patrols.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Patrol Activity</Text>
                {data.patrols.map((patrol, pIdx) => (
                  <View key={patrol.id} style={[styles.patrolCard, Shadows.card]}>
                    <View style={styles.patrolHeader}>
                      <ClipboardList size={14} color={Colors.accent} />
                      <Text style={styles.patrolTitle}>Patrol #{pIdx + 1}</Text>
                    </View>
                    <View style={styles.scannerGrid}>
                      {patrol.scanners.map((scanner) => (
                        <View key={scanner.id} style={styles.scannerItem}>
                          <View style={[styles.scannerStatus, { backgroundColor: scanner.status === 'completed' ? Colors.success : Colors.textMuted }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.scannerName}>{scanner.name}</Text>
                            {scanner.scan_at && (
                                <Text style={styles.scannerTime}>{scanner.scan_at.split(' ')[1]}</Text>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {data.incidents.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Incidents Reported</Text>
                {data.incidents.map((incident) => (
                  <View key={incident.id} style={[styles.incidentCard, Shadows.card]}>
                    <AlertTriangle size={16} color={Colors.danger} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.incidentTitle}>{incident.injury_type}</Text>
                      <Text style={styles.incidentDate}>{formatFullDisplayDate(incident.incident_date)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : null}
      </ManagerStackListLayout>
    </ManagerStackShell>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginTop: 18,
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  statusText: { fontSize: 9, fontWeight: '800' },
  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: { fontSize: 12, color: Colors.textPrimary },
  noteText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 22,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  listSection: { marginBottom: 16 },
  patrolCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
  },
  patrolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 6,
  },
  patrolTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  scannerGrid: { gap: 8 },
  scannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scannerStatus: { width: 8, height: 8, borderRadius: 4 },
  scannerName: { fontSize: 11, color: Colors.textPrimary },
  scannerTime: { fontSize: 10, color: Colors.textMuted },
  incidentCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  incidentTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  incidentDate: { fontSize: 11, color: Colors.textMuted },
});
