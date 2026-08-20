import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
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
  ChevronDown,
  ChevronUp,
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
import {
  ManagerRosterDetailBodyShimmer,
  ManagerRosterDetailHeaderShimmer,
} from '../../components/Shimmer';
import { formatFullDisplayDate } from '../../services/guardJobsMapper';
import { API_BASE_URL } from '../../config/env';
import ImageViewerModal from '../../components/ImageViewerModal';

type Props = ManagerStackScreenProps<'ManagerRosterDetail'>;

const formatDateTime = (dtStr: string | null) => {
  if (!dtStr) return '—';
  if (!dtStr.includes(' ')) return formatFullDisplayDate(dtStr);
  const [date, time] = dtStr.split(' ');
  return `${formatFullDisplayDate(date)} ${time.substring(0, 5)}`;
};

export default function ManagerRosterDetailScreen({ route, navigation }: Props) {
  const { rosterId } = route.params;
  const [data, setData] = useState<ManagerRosterDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [expandedPatrols, setExpandedPatrols] = useState<Record<number, boolean>>({});

  const togglePatrol = (id: number) => {
    setExpandedPatrols((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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

  const getFullImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL}/${path}`;
  };

  useFocusEffect(
    useCallback(() => {
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
               <View style={{ marginTop: 18 }}>
                 <ManagerRosterDetailHeaderShimmer />
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
            <ManagerRosterDetailBodyShimmer />
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
                <View style={styles.attendanceGrid}>
                  <View style={styles.attendanceCol}>
                    <View style={styles.infoRow}>
                      <CheckCircle2 size={14} color={Colors.success} />
                      <Text style={styles.infoText}>Sign In</Text>
                    </View>
                    <Text style={styles.attendanceTime}>
                      {formatDateTime(data.activity.signin_time)}
                    </Text>

                    {data.activity.signin_selfie && (
                      <TouchableOpacity
                        onPress={() => setViewerUri(getFullImageUrl(data.activity?.signin_selfie ?? null))}
                        style={styles.selfieWrap}
                      >
                        <Image
                          source={{ uri: getFullImageUrl(data.activity.signin_selfie)! }}
                          style={styles.selfie}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    )}

                    {data.activity.signin_notes && (
                      <Text style={styles.noteText}>Note: {data.activity.signin_notes}</Text>
                    )}
                  </View>

                  <View style={styles.attendanceDivider} />

                  <View style={styles.attendanceCol}>
                    <View style={styles.infoRow}>
                      <XCircle size={14} color={Colors.danger} />
                      <Text style={styles.infoText}>Sign Out</Text>
                    </View>
                    <Text style={styles.attendanceTime}>
                      {formatDateTime(data.activity.signout_time)}
                    </Text>

                    {data.activity.signout_selfie && (
                      <TouchableOpacity
                        onPress={() => setViewerUri(getFullImageUrl(data.activity?.signout_selfie ?? null))}
                        style={styles.selfieWrap}
                      >
                        <Image
                          source={{ uri: getFullImageUrl(data.activity.signout_selfie)! }}
                          style={styles.selfie}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    )}

                    {data.activity.signout_notes && (
                      <Text style={styles.noteText}>Note: {data.activity.signout_notes}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {data.patrols.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Patrol Activity</Text>
                {data.patrols.map((patrol, pIdx) => {
                  const isExpanded = !!expandedPatrols[patrol.id];
                  return (
                    <TouchableOpacity
                      key={patrol.id}
                      style={[styles.patrolCard, Shadows.card]}
                      onPress={() => togglePatrol(patrol.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.patrolHeaderMain}>
                        <View style={styles.patrolIconWrap}>
                          <ClipboardList size={16} color={Colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.patrolTitle}>Patrol #{pIdx + 1}</Text>
                          <Text style={styles.patrolSubtitle}>
                            {patrol.scanners.length} Checkpoints · {patrol.scanners.filter(s => s.status === 'completed').length} Completed
                          </Text>
                        </View>
                        {isExpanded ? (
                          <ChevronUp size={18} color={Colors.textMuted} />
                        ) : (
                          <ChevronDown size={18} color={Colors.textMuted} />
                        )}
                      </View>

                      {isExpanded && (
                        <View style={styles.patrolDetails}>
                          <View style={styles.scannerGrid}>
                            {patrol.scanners.map((scanner) => (
                              <View key={scanner.id} style={styles.scannerItem}>
                                <View
                                  style={[
                                    styles.scannerStatus,
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
                                  {scanner.scan_at && (
                                    <Text style={styles.scannerTime}>
                                      {scanner.scan_at.split(' ')[1]}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {data.incidents.length > 0 && (
              <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Incidents Reported</Text>
                {data.incidents.map((incident) => (
                  <TouchableOpacity
                    key={incident.id}
                    style={[styles.incidentCard, Shadows.card]}
                    onPress={() => navigation.navigate('ManagerIncidentDetail', { incidentId: incident.id })}
                  >
                    <View style={styles.incidentIconWrap}>
                      <AlertTriangle size={16} color={Colors.danger} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.incidentTitle}>{incident.injury_type}</Text>
                      <Text style={styles.incidentDate}>{formatFullDisplayDate(incident.incident_date)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : null}
      </ManagerStackListLayout>

      <ImageViewerModal
        visible={!!viewerUri}
        uri={viewerUri}
        onClose={() => setViewerUri(null)}
      />
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
  attendanceGrid: {
    flexDirection: 'row',
  },
  attendanceCol: {
    flex: 1,
  },
  attendanceDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  attendanceTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginLeft: 22,
  },
  selfieWrap: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.bgAlt,
    marginLeft: 22,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selfie: {
    width: '100%',
    height: '100%',
  },
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
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  patrolHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  patrolIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patrolTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  patrolSubtitle: { fontSize: 11, color: Colors.textMuted },
  patrolDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
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
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  incidentIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  incidentDate: { fontSize: 11, color: Colors.textMuted },
});
