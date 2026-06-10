import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import { NavBar } from '../components';
import { PatrolTimelineShimmer } from '../components/Shimmer';
import {
  AlertTriangle,
  ClipboardList,
  Home,
  Route,
  User,
  ArrowLeft,
  Clock,
  MapPin,
  CheckCircle,
  Radio,
  ScanLine,
} from 'lucide-react-native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES, navigateGuardBottomTab } from '../navigation/constants';
import type { GuardStackScreenProps } from '../navigation/types';
import type { RootState } from '../store/store';
import {
  guardStartPatrol,
  guardTodayPatrolling,
  type PatrollingReport,
  type PatrolScanner,
} from '../services/guardApi';
import {
  findActiveReportForRoster,
  getCompletedCount,
  getNextScanner,
  isScannerComplete,
} from '../services/patrolUtils';
import { usePatrolNfcScan } from '../hooks/usePatrolNfcScan';
import { stopNfc } from '../services/nfcReader';

type PatrolTimelineRoute = GuardStackScreenProps<'PatrolTimeline'>['route'];

type ScannerStatus = 'done' | 'pending' | 'now';

function formatPatrolTime(value?: string | null): string {
  if (!value) return '—';
  const normalized = value.replace(' ', 'T');
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPatrolDate(value?: string | null): string {
  if (!value) {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getScannerUiStatus(
  scanner: PatrolScanner,
  nextScannerId: number | null,
): ScannerStatus {
  if (isScannerComplete(scanner)) return 'done';
  if (scanner.id === nextScannerId) return 'now';
  return 'pending';
}

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);
  return (
    granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED ||
    granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
      PermissionsAndroid.RESULTS.GRANTED
  );
}

function getCurrentLocation(enableHighAccuracy: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        resolve(`${latitude},${longitude}`);
      },
      err => reject(err),
      { enableHighAccuracy, timeout: 20000, maximumAge: 5000 },
    );
  });
}

export default function PatrolTimeline() {
  const navigation = useGuardNavigation();
  const route = useRoute<PatrolTimelineRoute>();
  const guardId = useSelector((state: RootState) => state.auth?.guardId ?? null);

  const rosterId = route.params?.rosterId;
  const siteId = route.params?.siteId;
  const siteName = route.params?.site;
  const coordinates = route.params?.coordinates;
  const autoStart = route.params?.autoStart === true;
  const fromOngoingShift = rosterId != null;

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<PatrollingReport[]>([]);
  const [activeReport, setActiveReport] = useState<PatrollingReport | null>(
    null,
  );
  const [patrolDate, setPatrolDate] = useState<string | null>(null);
  const [lastScannedGate, setLastScannedGate] = useState<string | null>(null);
  const autoStartAttemptedRef = useRef(false);
  const isMountedRef = useRef(true);
  const locationRef = useRef(coordinates ?? '');

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopNfc();
    };
  }, []);

  const loadPatrols = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent && isMountedRef.current) setLoading(true);
      try {
        const result = await guardTodayPatrolling(guardId);
        if (!isMountedRef.current) return null;

        if (!result.success) {
          if (!opts?.silent) {
            Alert.alert('Error', result.message ?? 'Failed to load patrols.');
          }
          setReports([]);
          setActiveReport(null);
          return null;
        }

        const list = result.data?.reports ?? [];
        const active = findActiveReportForRoster(list, rosterId);
        setReports(list);
        setActiveReport(active);
        setPatrolDate(result.data?.date ?? list[0]?.started_at ?? null);
        return { list, active };
      } catch {
        if (!opts?.silent && isMountedRef.current) {
          Alert.alert('Error', 'Failed to load patrols.');
        }
        return null;
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [guardId, rosterId],
  );

  const getScanCoordinates = useCallback(async () => {
    if (locationRef.current.trim()) return locationRef.current.trim();

    const allowed = await requestLocationPermission();
    if (!allowed) return '';

    try {
      const coords = await getCurrentLocation(true);
      locationRef.current = coords;
      return coords;
    } catch {
      try {
        const coords = await getCurrentLocation(false);
        locationRef.current = coords;
        return coords;
      } catch {
        return '';
      }
    }
  }, []);

  const startPatrol = useCallback(async () => {
    if (rosterId == null) {
      Alert.alert('Error', 'Roster is required to start patrolling.');
      return false;
    }
    if (siteId == null) {
      Alert.alert('Error', 'Site is required to start patrolling.');
      return false;
    }

    let coords = coordinates?.trim() || locationRef.current.trim();
    if (!coords) {
      coords = await getScanCoordinates();
    }
    if (!coords) {
      Alert.alert('Error', 'Location is required to start patrolling.');
      return false;
    }

    if (isMountedRef.current) setStarting(true);
    try {
      const result = await guardStartPatrol(rosterId, {
        site_id: siteId,
        guard_id: guardId ?? undefined,
        coordinates: coords,
      });

      if (!isMountedRef.current) return false;

      if (!result.success || !result.data) {
        Alert.alert('Error', result.message ?? 'Failed to start patrol.');
        return false;
      }

      setActiveReport(result.data);
      locationRef.current = coords;
      await loadPatrols({ silent: true });
      return true;
    } catch {
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to start patrol.');
      }
      return false;
    } finally {
      if (isMountedRef.current) setStarting(false);
    }
  }, [
    rosterId,
    siteId,
    coordinates,
    guardId,
    loadPatrols,
    getScanCoordinates,
  ]);

  const activeReportRef = useRef<PatrollingReport | null>(null);
  activeReportRef.current = activeReport;

  const {
    scanning: nfcScanning,
    handleScan: handleNfcScan,
    handleScanCheckpoint,
    scanModal,
  } = usePatrolNfcScan({
    getCoordinates: getScanCoordinates,
    getScanContext: () => {
      const report = activeReportRef.current;
      if (!report) return null;
      return {
        patrolling_report_id: report.id,
        roster_id: report.roster_id ?? rosterId,
        guard_id: report.guard_id ?? guardId ?? undefined,
        report,
      };
    },
    hasActivePatrol: () => activeReportRef.current != null,
    onSuccess: (report, gateName) => {
      if (!isMountedRef.current) return;
      setActiveReport(report);
      setReports(prev => {
        const idx = prev.findIndex(r => r.id === report.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = report;
          return next;
        }
        return [report, ...prev];
      });
      setLastScannedGate(gateName);
    },
  });

  const loadPatrolsRef = useRef(loadPatrols);
  const startPatrolRef = useRef(startPatrol);
  loadPatrolsRef.current = loadPatrols;
  startPatrolRef.current = startPatrol;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        try {
          const loaded = await loadPatrolsRef.current();
          if (cancelled || !isMountedRef.current) return;

          if (
            autoStart &&
            rosterId != null &&
            siteId != null &&
            !autoStartAttemptedRef.current
          ) {
            autoStartAttemptedRef.current = true;
            if (!loaded?.active) {
              await startPatrolRef.current();
            }
          }
        } catch {
          // Prevent unhandled rejection crashes on focus load.
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [autoStart, rosterId, siteId]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPatrols({ silent: true });
  };

  const handleStartNewPatrol = () => {
    if (!fromOngoingShift) {
      Alert.alert(
        'Start from shift',
        'Open your ongoing shift and tap Patrolling to start a patrol round.',
      );
      return;
    }
    startPatrol();
  };

  const nextScanner = getNextScanner(activeReport);
  const nextScannerId = nextScanner?.id ?? null;
  const completedCount = activeReport ? getCompletedCount(activeReport) : 0;
  const totalScanners = activeReport?.scanners?.length ?? 0;
  const progressPct =
    totalScanners > 0 ? Math.round((completedCount / totalScanners) * 100) : 0;
  const allComplete = totalScanners > 0 && completedCount >= totalScanners;

  const historyReports = reports.filter(r => r.id !== activeReport?.id);

  const dotColors: Record<ScannerStatus, string> = {
    done: Colors.success,
    now: Colors.accent,
    pending: Colors.textMuted,
  };

  const showShimmer = loading || starting;

  useEffect(() => {
    if (coordinates?.trim()) {
      locationRef.current = coordinates.trim();
    }
  }, [coordinates]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {fromOngoingShift ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
              >
                <ArrowLeft size={18} color={Colors.white} />
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Patrolling</Text>
              <Text style={styles.headerSub}>
                {siteName ?? 'Today'} · {formatPatrolDate(patrolDate)}
              </Text>
            </View>
          </View>

          {fromOngoingShift ? (
            <TouchableOpacity
              style={[styles.addBtn, starting && styles.addBtnDisabled]}
              onPress={handleStartNewPatrol}
              disabled={starting}
            >
              {starting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.addBtnText}>+ Start</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {showShimmer ? (
          <PatrolTimelineShimmer />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 24 },
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.accent}
              />
            }
          >
            {activeReport ? (
              <View style={[styles.summaryCard, Shadows.card]}>
                <View style={styles.summaryTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.summaryLbl}>
                      Active patrol #{activeReport.id}
                    </Text>
                    <Text style={styles.summaryTime}>
                      Started {formatPatrolTime(activeReport.started_at)}
                    </Text>
                    {nextScanner ? (
                      <Text style={styles.nextGate}>
                        Next: {nextScanner.name}
                      </Text>
                    ) : allComplete ? (
                      <Text style={styles.nextGateDone}>
                        All checkpoints completed
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.progressRing}>
                    <Text style={styles.progressRingVal}>{progressPct}%</Text>
                    <Text style={styles.progressRingLbl}>done</Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${progressPct}%` }]}
                  />
                </View>
                <Text style={styles.progressMeta}>
                  {completedCount} of {totalScanners} NFC checkpoints scanned
                </Text>
              </View>
            ) : (
              <View style={[styles.emptyCard, Shadows.card]}>
                <Route size={28} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No active patrol</Text>
                <Text style={styles.emptySub}>
                  {fromOngoingShift
                    ? 'Tap + Start to begin a new patrol round for this shift.'
                    : 'Start patrolling from your ongoing shift screen.'}
                </Text>
              </View>
            )}

            {lastScannedGate ? (
              <View style={styles.successBanner}>
                <CheckCircle size={16} color={Colors.success} />
                <Text style={styles.successBannerText}>
                  Last scan: {lastScannedGate}
                </Text>
              </View>
            ) : null}

            {Array.isArray(activeReport?.scanners) &&
            activeReport.scanners.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Checkpoints</Text>
                <View style={styles.timeline}>
                  <View style={styles.verticalLine} />
                  {activeReport.scanners.map(scanner => {
                    const status = getScannerUiStatus(scanner, nextScannerId);
                    const isNow = status === 'now';
                    const isPending = status === 'pending';

                    return (
                      <View
                        key={scanner.id}
                        style={[styles.tlRow, isPending && { opacity: 0.6 }]}
                      >
                        <View style={styles.dotCol}>
                          <View
                            style={[
                              styles.dot,
                              { backgroundColor: dotColors[status] },
                              isNow && styles.dotNowGlow,
                            ]}
                          />
                        </View>

                        <View
                          style={[
                            styles.card,
                            isNow && styles.cardNow,
                            status === 'done' && styles.cardDone,
                          ]}
                        >
                          <View style={styles.cardTop}>
                            <View style={styles.cardTopLeft}>
                              <MapPin
                                size={14}
                                color={
                                  status === 'done'
                                    ? Colors.success
                                    : isNow
                                      ? Colors.accent
                                      : Colors.textPrimary
                                }
                              />
                              <Text style={styles.cardLoc}>{scanner.name}</Text>
                            </View>
                            <View
                              style={[
                                styles.statusChip,
                                status === 'done'
                                  ? styles.statusChipDone
                                  : isNow
                                    ? styles.statusChipNow
                                    : styles.statusChipPending,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusChipText,
                                  status === 'done'
                                    ? styles.statusChipTextDone
                                    : isNow
                                      ? styles.statusChipTextNow
                                      : styles.statusChipTextPending,
                                ]}
                              >
                                {status === 'done'
                                  ? 'Scanned'
                                  : isNow
                                    ? 'Scan now'
                                    : 'Pending'}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.nfcValue}>
                            Tap tag at gate to read UID
                          </Text>

                          {scanner.scan_at ? (
                            <View style={styles.doneRow}>
                              <Clock size={12} color={Colors.success} />
                              <Text style={styles.doneText}>
                                Scanned at {formatPatrolTime(scanner.scan_at)}
                              </Text>
                            </View>
                          ) : isNow ? (
                            <>
                              <Text style={styles.scanPrompt}>
                                Hold your phone on the physical NFC tag at this
                                gate, then tap Scan NFC below.
                              </Text>
                              <TouchableOpacity
                                style={styles.scanGateBtn}
                                onPress={() => handleScanCheckpoint(scanner)}
                                disabled={nfcScanning}
                              >
                                <ScanLine size={14} color={Colors.white} />
                                <Text style={styles.scanGateBtnText}>
                                  Scan NFC at {scanner.name}
                                </Text>
                              </TouchableOpacity>
                            </>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {historyReports.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Today&apos;s patrol rounds ({historyReports.length})
                </Text>
                {historyReports.map(report => {
                  const done = getCompletedCount(report);
                  const total =
                    report.scanners?.length ?? report.scanner_count;
                  const pct =
                    total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <View
                      key={report.id}
                      style={[styles.historyCard, Shadows.card]}
                    >
                      <View style={styles.historyTop}>
                        <View style={styles.historyIcon}>
                          <Radio size={16} color={Colors.info} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyTitle}>
                            Patrol #{report.id}
                          </Text>
                          <Text style={styles.historySub}>
                            {formatPatrolTime(report.started_at)} · {done}/
                            {total} gates · {pct}%
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            report.completed_at
                              ? styles.statusDone
                              : styles.statusActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              report.completed_at
                                ? styles.statusDoneText
                                : styles.statusActiveText,
                            ]}
                          >
                            {report.completed_at ? 'Done' : 'Active'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </ScrollView>
        )}

        {activeReport && !allComplete ? (
          <View style={styles.scanDock}>
            <TouchableOpacity
              style={[styles.scanDockBtn, nfcScanning && styles.scanDockBtnDisabled]}
              onPress={handleNfcScan}
              disabled={nfcScanning}
              activeOpacity={0.9}
            >
              {nfcScanning ? (
                <>
                  <ActivityIndicator color={Colors.white} size="small" />
                  <Text style={styles.scanDockText}>Reading NFC tag...</Text>
                </>
              ) : (
                <>
                  <ScanLine size={20} color={Colors.white} />
                  <Text style={styles.scanDockText}>SCAN NFC TAG</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.navWrap}>
          <NavBar
            variant="light"
            items={[
              { icon: Home, label: 'Home' },
              { icon: Route, label: 'Patrol', active: true },
              { icon: AlertTriangle, label: 'Incidents' },
              { icon: ClipboardList, label: 'Shifts' },
              { icon: User, label: 'Profile' },
            ]}
            onPress={i => navigateGuardBottomTab(navigation, i)}
          />
        </View>
        {scanModal}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgAlt },
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.headerStart,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  headerSub: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    minWidth: 72,
    alignItems: 'center',
  },
  addBtnDisabled: { opacity: 0.7 },
  addBtnText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  scroll: { flex: 1 },
  navWrap: { backgroundColor: Colors.bg },
  scrollContent: { paddingTop: 14 },
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 16,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  summaryLbl: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryTime: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  nextGate: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontWeight: '600',
    marginTop: 6,
  },
  nextGateDone: {
    fontSize: FontSizes.sm,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 6,
  },
  progressRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.accent,
    lineHeight: 16,
  },
  progressRingLbl: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.accent,
    textTransform: 'uppercase',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  progressMeta: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: Colors.successLight,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  successBannerText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  emptyCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 28,
    alignItems: 'center',
    gap: 8,
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
    lineHeight: 18,
  },
  section: { paddingHorizontal: 16, paddingBottom: 8 },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  timeline: { position: 'relative' },
  verticalLine: {
    position: 'absolute',
    left: 11,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.border,
  },
  tlRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  dotCol: { width: 24, alignItems: 'center', paddingTop: 4 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  dotNowGlow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardNow: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentAlpha25,
  },
  cardDone: {
    backgroundColor: Colors.successLight,
    borderColor: 'rgba(46,125,82,0.2)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardLoc: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusChip: {
    borderRadius: Radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusChipDone: { backgroundColor: Colors.successLight },
  statusChipNow: { backgroundColor: Colors.accentAlpha12 },
  statusChipPending: { backgroundColor: Colors.bgAlt },
  statusChipText: { fontSize: 10, fontWeight: '700' },
  statusChipTextDone: { color: Colors.success },
  statusChipTextNow: { color: Colors.accent },
  statusChipTextPending: { color: Colors.textMuted },
  nfcValue: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doneText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.success,
  },
  scanPrompt: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
    marginBottom: 8,
  },
  scanGateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: Radii.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  scanGateBtnText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 12,
    marginBottom: 10,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  historySub: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusActive: { backgroundColor: Colors.accentLight },
  statusDone: { backgroundColor: Colors.successLight },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  statusActiveText: { color: Colors.accent },
  statusDoneText: { color: Colors.success },
  scanDock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  scanDockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.success,
    borderRadius: Radii.lg,
    paddingVertical: 15,
    minHeight: 52,
  },
  scanDockBtnDisabled: { opacity: 0.8 },
  scanDockText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
