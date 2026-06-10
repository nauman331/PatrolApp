import React, { useCallback, useState, type ComponentType } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import { NavBar } from '../components';
import { IncidentListShimmer } from '../components/Shimmer';
import {
  AlertTriangle,
  ClipboardList,
  Home,
  Route,
  User,
  Users,
  Car,
  Eye,
  MapPin,
  Clock,
  ShieldAlert,
  Plus,
  ChevronRight,
  Camera,
  Download,
} from 'lucide-react-native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES, navigateGuardBottomTab } from '../navigation/constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchGuardIncidents,
  selectIncidents,
  selectIncidentsError,
  selectIncidentsLoading,
} from '../store/slices/incidentsSlice';
import {
  getIncidentListMeta,
  type IncidentSeverity,
  type MappedIncident,
} from '../services/incidentsMapper';
import { downloadIncidentPdf } from '../services/incidentPdfDownload';

const sevConfig: Record<
  IncidentSeverity,
  { bg: string; color: string; border: string }
> = {
  HIGH: {
    bg: Colors.dangerLight,
    color: Colors.danger,
    border: Colors.danger,
  },
  MEDIUM: {
    bg: Colors.warningLight,
    color: '#c05621',
    border: Colors.warning,
  },
  LOW: {
    bg: Colors.successLight,
    color: Colors.success,
    border: Colors.success,
  },
};

function MetaChip({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ size?: number; color?: string }>;
  label: string;
}) {
  return (
    <View style={styles.metaChip}>
      <Icon size={12} color={Colors.textSecondary} />
      <Text style={styles.metaChipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export default function IncidentsScreen() {
  const navigation = useGuardNavigation();
  const dispatch = useAppDispatch();
  const incidents = useAppSelector(selectIncidents);
  const loading = useAppSelector(selectIncidentsLoading);
  const error = useAppSelector(selectIncidentsError);
  const meta = getIncidentListMeta(incidents);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchGuardIncidents());
    }, [dispatch]),
  );

  const openReport = (incident: MappedIncident) => {
    navigation.navigate(GUARD_ROUTES.VIEW_INCIDENT, {
      incidentId: incident.id,
    });
  };

  const handleDownloadPdf = async (incident: MappedIncident) => {
    setDownloadingId(incident.id);
    try {
      await downloadIncidentPdf(incident);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.hdrRow}>
            <Text style={styles.hdrTitle}>Incidents</Text>
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>
                {loading ? '...' : `${meta.count} REPORTS`}
              </Text>
            </View>
          </View>
          <Text style={styles.hdrSub}>{meta.subtitle}</Text>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.safeBody} edges={['bottom']}>
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {loading ? (
            <IncidentListShimmer count={3} />
          ) : error ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>Could not load incidents</Text>
              <Text style={styles.emptySub}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => dispatch(fetchGuardIncidents())}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : incidents.length === 0 ? (
            <View style={styles.emptyBox}>
              <ShieldAlert size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No incidents yet</Text>
              <Text style={styles.emptySub}>
                Tap + to report your first incident.
              </Text>
            </View>
          ) : (
            incidents.map((inc: MappedIncident) => {
              const sev = sevConfig[inc.severity];
              const photoCount = inc.photos.length;
              const peopleCount =
                inc.peopleCount ?? inc.peopleInvolved.length;
              const vehiclesCount = inc.vehiclesCount ?? inc.vehicles.length;
              const witnessesCount =
                inc.witnessesCount ?? inc.witnesses.length;
              const isDownloading = downloadingId === inc.id;

              return (
                <View
                  key={inc.id}
                  style={[
                    styles.card,
                    Shadows.card,
                    { borderLeftColor: sev.border },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => openReport(inc)}
                    activeOpacity={0.88}
                  >
                  <View style={styles.cardHeader}>
                    <View style={styles.siteIconWrap}>
                      <MapPin size={16} color={Colors.accent} />
                    </View>
                    <View style={styles.cardHeaderMain}>
                      <Text style={styles.siteName} numberOfLines={2}>
                        {inc.siteName || 'Unknown site'}
                      </Text>
                      <Text style={styles.reportId}>Report #{inc.id}</Text>
                    </View>
                    <View
                      style={[styles.sevBadge, { backgroundColor: sev.bg }]}
                    >
                      <Text style={[styles.sevText, { color: sev.color }]}>
                        {inc.severity}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.typeChip}>
                    <AlertTriangle size={12} color={sev.color} />
                    <Text style={styles.typeChipText} numberOfLines={1}>
                      {inc.injuryType || 'Incident'}
                    </Text>
                  </View>

                  <Text style={styles.description} numberOfLines={2}>
                    {inc.injuryDetail || 'No additional details provided.'}
                  </Text>

                  <View style={styles.metaRow}>
                    <MetaChip
                      icon={Users}
                      label={`${peopleCount} ${peopleCount === 1 ? 'person' : 'people'}`}
                    />
                    <MetaChip
                      icon={Car}
                      label={`${vehiclesCount} ${vehiclesCount === 1 ? 'vehicle' : 'vehicles'}`}
                    />
                    <MetaChip
                      icon={Eye}
                      label={`${witnessesCount} ${witnessesCount === 1 ? 'witness' : 'witnesses'}`}
                    />
                    <MetaChip
                      icon={Clock}
                      label={inc.displayDateTime || '—'}
                    />
                    <MetaChip
                      icon={ClipboardList}
                      label={`Roster ${inc.rosterId ?? '—'}`}
                    />
                    {photoCount > 0 ? (
                      <MetaChip
                        icon={Camera}
                        label={`${photoCount} photo${photoCount === 1 ? '' : 's'}`}
                      />
                    ) : null}
                  </View>

                  </TouchableOpacity>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionView}
                      onPress={() => openReport(inc)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.viewReportText}>View report</Text>
                      <ChevronRight size={16} color={Colors.accent} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionPdf}
                      onPress={() => handleDownloadPdf(inc)}
                      disabled={isDownloading}
                      activeOpacity={0.85}
                    >
                      {isDownloading ? (
                        <ActivityIndicator size="small" color={Colors.white} />
                      ) : (
                        <Download size={14} color={Colors.white} />
                      )}
                      <Text style={styles.actionPdfText}>
                        {isDownloading ? 'Creating PDF…' : 'Download PDF'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate(GUARD_ROUTES.ADD_INCIDENT)}
        >
          <Plus size={22} color="white" />
        </TouchableOpacity>

        <NavBar
          variant="light"
          items={[
            { icon: Home, label: 'Home' },
            { icon: Route, label: 'Patrol' },
            { icon: AlertTriangle, label: 'Incidents', active: true },
            { icon: ClipboardList, label: 'Shifts' },
            { icon: User, label: 'Profile' },
          ]}
          onPress={i => navigateGuardBottomTab(navigation, i)}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.headerStart },
  safeTop: { backgroundColor: Colors.headerStart },
  safeBody: { flex: 1, backgroundColor: Colors.bgAlt },
  fab: {
    position: 'absolute',
    bottom: 97,
    right: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  header: {
    backgroundColor: Colors.headerStart,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 22,
  },
  hdrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  hdrTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  openBadge: {
    backgroundColor: 'rgba(229,62,62,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(229,62,62,0.3)',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  openBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#f87171',
  },
  hdrSub: { fontSize: FontSizes.xs, color: 'rgba(255,255,255,0.35)' },
  body: { flex: 1, padding: 14 },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    marginTop: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  retryText: { color: Colors.white, fontWeight: '700' },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    marginBottom: 12,
    padding: 14,
    paddingLeft: 10,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    paddingLeft: 6,
  },
  siteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderMain: {
    flex: 1,
    minWidth: 0,
  },
  siteName: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  reportId: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  sevBadge: {
    borderRadius: Radii.sm,
    paddingHorizontal: 9,
    paddingVertical: 4,
    minWidth: 52,
    alignItems: 'center',
  },
  sevText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
    marginLeft: 6,
    maxWidth: '100%',
  },
  typeChipText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  description: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: 12,
    paddingLeft: 6,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 6,
    marginBottom: 12,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  metaChipText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    marginTop: 2,
    marginLeft: 6,
    marginRight: 2,
  },
  actionView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    paddingVertical: 9,
    backgroundColor: Colors.bgCard,
  },
  viewReportText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.accent,
  },
  actionPdf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: Radii.sm,
    paddingVertical: 9,
  },
  actionPdfText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.white,
  },
});
