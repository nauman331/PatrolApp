import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
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
} from 'lucide-react-native';
import { useManagerNavigation } from '../../navigation/utils';
import { MANAGER_ROUTES } from '../../navigation/constants';
import type { ManagerStackScreenProps } from '../../navigation/types';
import { ManagerStackHeader, ManagerStackListLayout, ManagerStackShell, sharedStyles } from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
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
  const { guardId, name: routeName, rosterId } = route.params ?? {};
  const [data, setData] = useState<ManagerGuardDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setLoading(true);
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
  const statusColor = shift
    ? mapManagerStatusColor(shift.status_color)
    : Colors.textMuted;
  const showShimmer = loading && !data;

  const subtitle = shift
    ? `Guard Details · ${shift.status_label}`
    : 'Guard Details';

  const patrols = data?.patrols ?? [];
  const incidents = data?.incidents ?? [];
  const patrolRowCount = patrols.length === 0 ? 1 : patrols.length;
  const incidentsStickyIndex = patrolRowCount;

  return (
    <ManagerStackShell
      header={<ManagerStackHeader title={name} subtitle={subtitle} />}
    >
      <ManagerStackListLayout
        refreshing={refreshing}
        onRefresh={onRefresh}
        fixedContent={
          <>
            {error ? <AuthErrorBanner message={error} /> : null}
            {showShimmer ? (
              <ManagerGuardDetailFixedShimmer />
            ) : (
              <>
                <View style={[styles.profileCard, Shadows.card]}>
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
                  <Text style={styles.profileName}>{name}</Text>
                  <Text style={styles.profileRole}>
                    Security Guard · ID #{guard?.id ?? guardId ?? '—'}
                  </Text>
                  {shift ? (
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: `${statusColor}18` },
                      ]}
                    >
                      <View
                        style={[styles.statusDot, { backgroundColor: statusColor }]}
                      />
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {shift.status_label}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={[styles.infoGrid, Shadows.card]}>
                  <View style={styles.infoItem}>
                    <MapPin size={16} color={Colors.accent} />
                    <Text style={styles.infoLabel}>Site</Text>
                    <Text style={styles.infoValue}>
                      {shift?.site_name ?? 'No shift today'}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Clock size={16} color={Colors.accent} />
                    <Text style={styles.infoLabel}>Shift</Text>
                    <Text style={styles.infoValue}>
                      {shift?.shift_time ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Footprints size={16} color={Colors.accent} />
                    <Text style={styles.infoLabel}>Patrols</Text>
                    <Text style={styles.infoValue}>
                      {stats
                        ? `${stats.patrols_completed}/${stats.patrols_total} completed`
                        : '—'}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Shield size={16} color={Colors.accent} />
                    <Text style={styles.infoLabel}>License</Text>
                    <Text style={styles.infoValue}>
                      {guard?.security_license_no ?? '—'}
                    </Text>
                  </View>
                </View>

                {stats ? (
                  <View style={[styles.statsRow, Shadows.card]}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNum}>{stats.nfc_scans_completed}</Text>
                      <Text style={styles.statLabel}>NFC Scans</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNum}>{stats.incidents_today}</Text>
                      <Text style={styles.statLabel}>Incidents</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statNum}>
                        {stats.nfc_scans_total > 0
                          ? `${Math.round((stats.nfc_scans_completed / stats.nfc_scans_total) * 100)}%`
                          : '—'}
                      </Text>
                      <Text style={styles.statLabel}>NFC Rate</Text>
                    </View>
                  </View>
                ) : null}

                <SectionHeader title="Contact" />
                <View style={[styles.contactRow, Shadows.card]}>
                  <Phone size={16} color={Colors.textSecondary} />
                  <Text style={styles.contactText}>{guard?.phone ?? '—'}</Text>
                </View>
                <View style={[styles.contactRow, Shadows.card]}>
                  <Mail size={16} color={Colors.textSecondary} />
                  <Text style={styles.contactText}>{guard?.email ?? '—'}</Text>
                </View>

                {attendance ? (
                  <>
                    <SectionHeader title="Today's Attendance" />
                    <View style={[styles.attendanceCard, Shadows.card]}>
                      <Text style={styles.attendanceLine}>
                        Sign In: {attendance.signin_time ?? '—'}
                      </Text>
                      <Text style={styles.attendanceLine}>
                        Sign Out: {attendance.signout_time ?? '—'}
                      </Text>
                      {attendance.last_location ? (
                        <Text style={styles.attendanceSub}>
                          Last location: {attendance.last_location}
                          {attendance.last_location_time
                            ? ` · ${attendance.last_location_time}`
                            : ''}
                        </Text>
                      ) : null}
                      {attendance.signin_selfie ? (
                        <Image
                          source={{ uri: attendance.signin_selfie }}
                          style={styles.selfie}
                          resizeMode="cover"
                        />
                      ) : null}
                    </View>
                  </>
                ) : null}
              </>
            )}
          </>
        }
        listHeader={<SectionHeader title="Patrols Today" />}
        stickyHeaderIndices={showShimmer ? undefined : [incidentsStickyIndex]}
      >
        {showShimmer ? (
          <ManagerGuardDetailListShimmer />
        ) : (
          <>
            {patrols.length === 0 ? (
              <Text style={styles.emptyText}>No patrols today.</Text>
            ) : (
              patrols.map(patrol => (
                <View key={patrol.id} style={[styles.logRow, Shadows.card]}>
                  <View
                    style={[
                      styles.logDot,
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
                      Patrol · {patrol.scanners_completed}/{patrol.scanners_total}{' '}
                      scanners
                    </Text>
                    <Text style={styles.logTime}>
                      {patrol.started_at}
                      {patrol.completed_at ? ` – ${patrol.completed_at}` : ''}
                    </Text>
                  </View>
                </View>
              ))
            )}

            <View style={sharedStyles.stickySectionHeader}>
              <SectionHeader title="Incidents Today" />
            </View>
            {incidents.length === 0 ? (
              <Text style={styles.emptyText}>No incidents today.</Text>
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
                  <AlertTriangle
                    size={14}
                    color={mapSeverityColor(inc.severity)}
                  />
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

            <TouchableOpacity
              style={[styles.actionBtn, Shadows.card]}
              onPress={() =>
                navigation.navigate(MANAGER_ROUTES.GUARD_ATTENDANCE, {
                  guardId,
                  name,
                })
              }
            >
              <Text style={styles.actionText}>View Attendance History</Text>
              <ChevronRight size={18} color={Colors.accent} />
            </TouchableOpacity>
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
  profileCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: Colors.accent },
  profileName: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  profileRole: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: FontSizes.xs, fontWeight: '700' },
  infoGrid: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  infoItem: { width: '46%', gap: 3 },
  infoLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  infoValue: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  statsRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: Colors.accent },
  statLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  contactRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 7,
  },
  contactText: { fontSize: 12, color: Colors.textPrimary },
  attendanceCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 12,
  },
  attendanceLine: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  attendanceSub: { fontSize: FontSizes.xs, color: Colors.textMuted },
  selfie: {
    width: '100%',
    height: 120,
    borderRadius: Radii.md,
    marginTop: 10,
  },
  logRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 7,
  },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logEvent: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  logTime: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  actionBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.accentAlpha25,
  },
  actionText: { fontSize: 13, fontWeight: '700', color: Colors.accent },
});
