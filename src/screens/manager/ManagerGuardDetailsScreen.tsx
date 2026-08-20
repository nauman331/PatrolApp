import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { SectionHeader } from '../../components';
import {
  MapPin,
  Clock,
  Footprints,
  Phone,
  Mail,
  ChevronRight,
  Shield,
  AlertTriangle,
  LogIn,
  LogOut,
  Camera,
} from 'lucide-react-native';
import { useManagerNavigation } from '../../navigation/utils';
import { MANAGER_ROUTES } from '../../navigation/constants';
import type { ManagerStackScreenProps } from '../../navigation/types';
import { ManagerStackHeader, ManagerStackListLayout, ManagerStackShell, sharedStyles } from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import ImageViewerModal from '../../components/ImageViewerModal';
import {
  ManagerGuardDetailFixedShimmer,
  ManagerGuardDetailListShimmer,
} from '../../components/Shimmer';
import {
  getManagerGuardDetail,
  mapManagerStatusColor,
  mapSeverityColor,
  type ManagerGuardDetailData,
} from '../../services/managerApi';

type Props = ManagerStackScreenProps<'ManagerGuardDetails'>;

export default function ManagerGuardDetailsScreen({ route }: Props) {
  const navigation = useManagerNavigation();
  const {
    guardId,
    name: routeName,
    rosterId,
    siteName: routeSiteName,
    statusText: routeStatusText,
  } = route.params ?? {};
  const [data, setData] = useState<ManagerGuardDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!guardId) {
      setError('Guard not found');
      setLoading(false);
      return;
    }

    setError(null);
    const result = await getManagerGuardDetail(guardId, rosterId);

    if (result.success && result.data) {
      setData(result.data);
    } else {
      setData(null);
      setError(result.message ?? 'Failed to load guard details');
    }

    setLoading(false);
    setRefreshing(false);
  }, [guardId, rosterId]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail();
  }, [fetchDetail]);

  const guard = data?.guard;
  const name = guard?.name ?? routeName ?? 'Guard';
  const shift = data?.today_shift;
  const attendance = data?.attendance;
  const stats = data?.stats;

  const isOnDuty = !!attendance?.signin_time && !attendance?.signout_time;
  const statusLabel = isOnDuty
    ? routeStatusText || 'On Duty'
    : shift?.status_label ?? 'Off Duty';
  const statusColor = isOnDuty
    ? Colors.success
    : shift
    ? mapManagerStatusColor(shift.status_color)
    : Colors.textMuted;

  const showShimmer = loading && !data;

  const subtitle = `Guard Details · ${statusLabel}`;

  const patrols = data?.patrols ?? [];
  const incidents = data?.incidents ?? [];
  const patrolRowCount = patrols.length === 0 ? 1 : patrols.length;
  // 0: Fixed section (Profile, stats, etc.), 1: Patrols header, 2..N: Patrols, N+1: Incidents header
  const stickyIndices = showShimmer ? undefined : [1, 2 + patrolRowCount];

  return (
    <ManagerStackShell
      header={<ManagerStackHeader title={name} subtitle={subtitle} />}
    >
      <ManagerStackListLayout
        refreshing={refreshing}
        onRefresh={onRefresh}
        stickyHeaderIndices={stickyIndices}
      >
        {showShimmer ? (
          <>
            <ManagerGuardDetailFixedShimmer />
            <ManagerGuardDetailListShimmer />
          </>
        ) : (
          <>
            <View style={{ paddingBottom: 8 }}>
              {error ? <AuthErrorBanner message={error} /> : null}

              {/* Profile Card */}
              <View style={[styles.profileCard, Shadows.card]}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {guard?.initials ??
                        name
                          .split(' ')
                          .map(p => p[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.profileName}>{name}</Text>
                <Text style={styles.profileRole}>Security Guard</Text>

                {shift || isOnDuty ? (
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: `${statusColor}14`,
                        borderColor: `${statusColor}33`,
                      },
                    ]}
                  >
                    <View
                      style={[styles.statusDot, { backgroundColor: statusColor }]}
                    />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Info Grid Tiles */}
              <View style={[styles.infoGridCard, Shadows.card]}>
                <View style={styles.infoTile}>
                  <View style={styles.infoIconBox}>
                    <MapPin size={15} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Site</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {shift?.site_name ?? routeSiteName ?? 'No shift today'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoTile}>
                  <View style={styles.infoIconBox}>
                    <Clock size={15} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Shift</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {shift?.shift_time && shift.shift_time !== 'Off Duty'
                        ? shift.shift_time
                        : isOnDuty
                        ? statusLabel
                        : '—'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoTile}>
                  <View style={styles.infoIconBox}>
                    <Footprints size={15} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>Patrols</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {stats
                        ? `${stats.patrols_completed}/${stats.patrols_total} done`
                        : '—'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoTile}>
                  <View style={styles.infoIconBox}>
                    <Shield size={15} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>License</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>
                      {guard?.security_license_no ?? '—'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats Row Bar */}
              {stats ? (
                <View style={[styles.statsRowCard, Shadows.card]}>
                  <View style={styles.statCell}>
                    <Text style={styles.statNum}>{stats.nfc_scans_completed}</Text>
                    <Text style={styles.statLabel}>NFC Scans</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statCell}>
                    <Text style={styles.statNum}>{stats.incidents_today}</Text>
                    <Text style={styles.statLabel}>Incidents</Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statCell}>
                    <Text style={styles.statNum}>
                      {stats.nfc_scans_total > 0
                        ? `${Math.round((stats.nfc_scans_completed / stats.nfc_scans_total) * 100)}%`
                        : '—'}
                    </Text>
                    <Text style={styles.statLabel}>NFC Rate</Text>
                  </View>
                </View>
              ) : null}

              {/* Contact Card */}
              <SectionHeader title="Contact Information" />
              <View style={[styles.contactCard, Shadows.card]}>
                <TouchableOpacity
                  style={styles.contactRow}
                  activeOpacity={guard?.phone ? 0.7 : 1}
                  onPress={() => guard?.phone && Linking.openURL(`tel:${guard.phone}`)}
                >
                  <View style={styles.contactIconWrap}>
                    <Phone size={14} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSubLabel}>Phone</Text>
                    <Text style={styles.contactValueText}>{guard?.phone ?? '—'}</Text>
                  </View>
                  {guard?.phone ? <ChevronRight size={15} color={Colors.textMuted} /> : null}
                </TouchableOpacity>

                <View style={styles.contactDivider} />

                <TouchableOpacity
                  style={styles.contactRow}
                  activeOpacity={guard?.email ? 0.7 : 1}
                  onPress={() => guard?.email && Linking.openURL(`mailto:${guard.email}`)}
                >
                  <View style={styles.contactIconWrap}>
                    <Mail size={14} color={Colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactSubLabel}>Email</Text>
                    <Text style={styles.contactValueText}>{guard?.email ?? '—'}</Text>
                  </View>
                  {guard?.email ? <ChevronRight size={15} color={Colors.textMuted} /> : null}
                </TouchableOpacity>
              </View>

              {/* Attendance Section */}
              {attendance ? (
                <>
                  <SectionHeader title="Today's Attendance" />
                  <View style={[styles.attendanceCard, Shadows.card]}>
                    <View style={styles.attendanceTimeRow}>
                      <View style={styles.attendanceTimeCell}>
                        <View style={styles.timeBadgeHeader}>
                          <LogIn size={13} color={Colors.success} />
                          <Text style={styles.timeBadgeLabel}>Sign In</Text>
                        </View>
                        <Text style={styles.timeBadgeValue}>
                          {attendance.signin_time ?? '—'}
                        </Text>
                      </View>

                      <View style={styles.attendanceTimeCell}>
                        <View style={styles.timeBadgeHeader}>
                          <LogOut size={13} color={Colors.warning} />
                          <Text style={styles.timeBadgeLabel}>Sign Out</Text>
                        </View>
                        <Text style={styles.timeBadgeValue}>
                          {attendance.signout_time ?? '—'}
                        </Text>
                      </View>
                    </View>

                    {attendance.last_location ? (
                      <View style={styles.locationSubBox}>
                        <MapPin size={13} color={Colors.accent} />
                        <Text style={styles.attendanceSubText} numberOfLines={1}>
                          Last: {attendance.last_location}
                          {attendance.last_location_time
                            ? ` (${attendance.last_location_time})`
                            : ''}
                        </Text>
                      </View>
                    ) : null}

                    {attendance.signin_selfie || attendance.signout_selfie ? (
                      <View style={styles.selfiesContainer}>
                        {attendance.signin_selfie ? (
                          <View style={styles.selfieWrap}>
                            <View style={styles.selfieCap}>
                              <Camera size={11} color={Colors.accent} />
                              <Text style={styles.selfieCapText}>Sign In Selfie</Text>
                            </View>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => {
                                setViewerUri(attendance.signin_selfie);
                                setViewerVisible(true);
                              }}
                            >
                              <Image
                                source={{ uri: attendance.signin_selfie }}
                                style={styles.selfieImg}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          </View>
                        ) : null}

                        {attendance.signout_selfie ? (
                          <View style={styles.selfieWrap}>
                            <View style={styles.selfieCap}>
                              <Camera size={11} color={Colors.accent} />
                              <Text style={styles.selfieCapText}>Sign Out Selfie</Text>
                            </View>
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => {
                                setViewerUri(attendance.signout_selfie);
                                setViewerVisible(true);
                              }}
                            >
                              <Image
                                source={{ uri: attendance.signout_selfie }}
                                style={styles.selfieImg}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </>
              ) : null}
            </View>

            {/* Patrols Section */}
            <View style={sharedStyles.stickySectionHeader}>
              <SectionHeader title="Patrols Today" />
            </View>

            {patrols.length === 0 ? (
              <View style={[styles.emptyCard, Shadows.card]}>
                <Text style={styles.emptyText}>No patrols today.</Text>
              </View>
            ) : (
              patrols.map(patrol => (
                <View key={patrol.id} style={[styles.logRow, Shadows.card]}>
                  <View
                    style={[
                      styles.logDotBar,
                      {
                        backgroundColor:
                          patrol.status === 'end'
                            ? Colors.success
                            : Colors.accent,
                      },
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logEvent}>
                      Patrol · {patrol.scanners_completed}/{patrol.scanners_total} scanners
                    </Text>
                    <Text style={styles.logTime}>
                      {patrol.started_at}
                      {patrol.completed_at ? ` – ${patrol.completed_at}` : ''}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusTag,
                      {
                        backgroundColor:
                          patrol.status === 'end'
                            ? Colors.successLight
                            : Colors.accentAlpha12,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusTagText,
                        {
                          color:
                            patrol.status === 'end'
                              ? Colors.success
                              : Colors.accent,
                        },
                      ]}
                    >
                      {patrol.status === 'end' ? 'Completed' : 'In Progress'}
                    </Text>
                  </View>
                </View>
              ))
            )}

            {/* Incidents Section */}
            <View style={sharedStyles.stickySectionHeader}>
              <SectionHeader title="Incidents Today" />
            </View>
            {incidents.length === 0 ? (
              <View style={[styles.emptyCard, Shadows.card]}>
                <Text style={styles.emptyText}>No incidents today.</Text>
              </View>
            ) : (
              incidents.map(inc => (
                <TouchableOpacity
                  key={inc.id}
                  style={[styles.logRow, Shadows.card]}
                  onPress={() =>
                    navigation.navigate(MANAGER_ROUTES.INCIDENT_DETAIL, {
                      incidentId: inc.id,
                    })
                  }
                >
                  <View
                    style={[
                      styles.logIconBox,
                      { backgroundColor: `${mapSeverityColor(inc.severity)}18` },
                    ]}
                  >
                    <AlertTriangle
                      size={14}
                      color={mapSeverityColor(inc.severity)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.logEvent}>{inc.title}</Text>
                    <Text style={styles.logTime}>
                      {inc.location} · {inc.time}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ))
            )}

            {/* View Activity History Button */}
            <TouchableOpacity
              style={[styles.actionBtn, Shadows.card]}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate(MANAGER_ROUTES.GUARD_ATTENDANCE, {
                  guardId,
                  name,
                })
              }
            >
              <Text style={styles.actionText}>View Activity History</Text>
              <ChevronRight size={18} color={Colors.accent} />
            </TouchableOpacity>
          </>
        )}
      </ManagerStackListLayout>

      <ImageViewerModal
        visible={viewerVisible}
        uri={viewerUri}
        onClose={() => setViewerVisible(false)}
      />
    </ManagerStackShell>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  profileCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarWrap: {
    marginBottom: 10,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.accentAlpha25,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: Colors.accent },
  profileName: { fontSize: 19, fontWeight: '800', color: Colors.textPrimary },
  profileRole: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: FontSizes.xs, fontWeight: '700' },

  infoGridCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoTile: {
    width: '48.5%',
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.md,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 9, fontWeight: '600', color: Colors.textMuted },
  infoValue: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginTop: 1 },

  statsRowCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2, fontWeight: '500' },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border },

  contactCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  contactIconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactSubLabel: { fontSize: 9, fontWeight: '600', color: Colors.textMuted },
  contactValueText: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, marginTop: 1 },
  contactDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 8 },

  attendanceCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attendanceTimeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  attendanceTimeCell: {
    flex: 1,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  timeBadgeLabel: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  timeBadgeValue: { fontSize: 12, fontWeight: '800', color: Colors.textPrimary },
  locationSubBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attendanceSubText: { fontSize: 11, color: Colors.textSecondary, flex: 1 },
  selfiesContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  selfieWrap: { flex: 1 },
  selfieCap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  selfieCapText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  selfieImg: {
    width: '100%',
    height: 110,
    borderRadius: Radii.md,
  },

  logRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logDotBar: { width: 4, height: 28, borderRadius: 2 },
  logIconBox: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logEvent: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  logTime: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  statusTagText: { fontSize: 10, fontWeight: '700' },

  actionBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.accentAlpha25,
  },
  actionText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
});
