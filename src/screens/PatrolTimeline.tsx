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
import { useFocusEffect } from '@react-navigation/native';
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
import type { RootState } from '../store/store';
import {
  guardStartPatrol,
  guardTodayPatrolling,
  getGuardMyJobs,
  type PatrollingReport,
} from '../services/guardApi';
import { findIncidentContextByRoster } from '../services/guardJobsMapper';
import {
  findActiveReportForRoster,
  findRunningReportsForRoster,
  getCompletedCount,
  isPatrolReportActive,
  isScannerComplete,
  resolveSiteIdForPatrol,
} from '../services/patrolUtils';
import { formatFullDisplayDate } from '../services/guardJobsMapper';
import { usePatrolNfcScan } from '../hooks/usePatrolNfcScan';
import { stopNfc } from '../services/nfcReader';
import {
  getActiveShiftSession,
  patchActiveShiftSession,
  type ActiveShiftSession,
  promptCheckInRequired,
} from '../services/activeShiftSession';

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

function isPatrolNotFoundMessage(message?: string | null): boolean {
  if (!message?.trim()) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('not found') ||
    lower.includes('no patrol') ||
    lower.includes('patrol not')
  );
}

export default function PatrolTimeline() {
  const navigation = useGuardNavigation();
  const guardId = useSelector((state: RootState) => state.auth?.guardId ?? null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<PatrollingReport[]>([]);
  const [activeReport, setActiveReport] = useState<PatrollingReport | null>(
    null,
  );
  const [patrolDate, setPatrolDate] = useState<string | null>(null);
  const [lastScannedGate, setLastScannedGate] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveShiftSession | null>(
    null,
  );
  const isMountedRef = useRef(true);
  const locationRef = useRef('');
  const startingRef = useRef(false);
  const activeReportRef = useRef<PatrollingReport | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopNfc();
    };
  }, []);

  useEffect(() => {
    getActiveShiftSession().then(session => {
      if (!isMountedRef.current) return;
      setActiveSession(session);
    });
  }, []);

  const loadPatrols = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setLoading(true);
        setLoadError(null);
      }
      try {
        const session = await getActiveShiftSession();
        if (isMountedRef.current) {
          setActiveSession(session);
        }

        const resolvedRosterId = session?.rosterId;
        if (resolvedRosterId == null) {
          if (isMountedRef.current) {
            setReports([]);
            setActiveReport(null);
            setPatrolDate(null);
            setLoadError(null);
          }
          return { list: [], active: null, session };
        }

        const result = await guardTodayPatrolling(guardId, resolvedRosterId);
        if (!isMountedRef.current) return null;

        if (!result.success) {
          const emptyList = result.data?.reports ?? [];
          setReports([]);
          setActiveReport(null);
          setPatrolDate(result.data?.date ?? null);
          if (isMountedRef.current) {
            setLoadError(
              isPatrolNotFoundMessage(result.message) || emptyList.length === 0
                ? 'Patrol not found.'
                : result.message ?? 'Failed to load patrols.',
            );
          }
          if (
            !opts?.silent &&
            !isPatrolNotFoundMessage(result.message) &&
            emptyList.length > 0
          ) {
            Alert.alert('Error', result.message ?? 'Failed to load patrols.');
          }
          return { list: [], active: null, session };
        }

        const list = result.data?.reports ?? [];
        const running = findRunningReportsForRoster(list, resolvedRosterId);
        const active = running[0] ?? null;
        setReports(list);
        setActiveReport(active);
        setPatrolDate(result.data?.date ?? list[0]?.started_at ?? null);
        if (isMountedRef.current) {
          setLoadError(
            isPatrolNotFoundMessage(result.message) ? 'Patrol not found.' : null,
          );
        }

        const resolvedSiteId = resolveSiteIdForPatrol(
          session?.siteId,
          resolvedRosterId,
          list,
        );
        if (
          session &&
          resolvedSiteId != null &&
          (session.siteId == null || String(session.siteId).trim() === '')
        ) {
          const patched = await patchActiveShiftSession({
            siteId: resolvedSiteId,
          });
          if (patched && isMountedRef.current) {
            setActiveSession(patched);
          }
        }

        return { list, active, session };
      } catch {
        if (!opts?.silent && isMountedRef.current) {
          Alert.alert('Error', 'Failed to load patrols.');
        }
        return null;
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [guardId],
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
    if (startingRef.current) {
      return false;
    }
    if (activeReportRef.current != null) {
      Alert.alert(
        'Patrol in progress',
        'Complete all NFC scans for the current patrol before starting a new one.',
      );
      return false;
    }

    startingRef.current = true;
    if (isMountedRef.current) setStarting(true);

    try {
      const session = await getActiveShiftSession();
      if (!session) {
        promptCheckInRequired(() => navigation.navigate(GUARD_ROUTES.SHIFTS));
        return false;
      }

      const patrolRosterId = session.rosterId;

      const loaded = await loadPatrols({ silent: true });
      const running = findRunningReportsForRoster(
        loaded?.list ?? [],
        patrolRosterId,
      );
      if (running.length > 0) {
        if (isMountedRef.current) {
          setActiveReport(running[0]);
        }
        Alert.alert(
          'Patrol already running',
          running.length > 1
            ? 'You already have patrol rounds in progress. Finish scanning all checkpoints on the latest patrol first.'
            : 'Complete all NFC scans for the current patrol before starting a new one.',
        );
        return false;
      }

      const patrolReports = loaded?.list ?? reports;
      let patrolSiteId = resolveSiteIdForPatrol(
        session.siteId,
        patrolRosterId,
        patrolReports,
      );
      if (patrolSiteId == null) {
        const jobs = await getGuardMyJobs(guardId);
        patrolSiteId = findIncidentContextByRoster(
          jobs.data ?? [],
          patrolRosterId,
        )?.siteId;
      }
      if (patrolSiteId == null) {
        Alert.alert(
          'Error',
          'Site ID not found. Please check in to your shift again.',
        );
        return false;
      }

      if (session.siteId == null || String(session.siteId).trim() === '') {
        const patched = await patchActiveShiftSession({ siteId: patrolSiteId });
        if (patched && isMountedRef.current) {
          setActiveSession(patched);
        }
      }

      let coords = locationRef.current.trim();
      if (!coords) {
        coords = await getScanCoordinates();
      }
      if (!coords) {
        Alert.alert('Error', 'Location is required to start patrolling.');
        return false;
      }

      const result = await guardStartPatrol(patrolRosterId, {
        site_id: patrolSiteId,
        guard_id: guardId ?? undefined,
        coordinates: coords,
      });

      if (!isMountedRef.current) return false;

      if (!result.success || !result.data) {
        if (isMountedRef.current && isPatrolNotFoundMessage(result.message)) {
          setLoadError('Patrol not found.');
        }
        Alert.alert('Error', result.message ?? 'Failed to start patrol.');
        return false;
      }

      setActiveReport(result.data);
      locationRef.current = coords;
      if (result.data.site_id != null) {
        await patchActiveShiftSession({ siteId: result.data.site_id });
        const refreshed = await getActiveShiftSession();
        if (refreshed && isMountedRef.current) {
          setActiveSession(refreshed);
        }
      }
      await loadPatrols({ silent: true });
      return true;
    } catch {
      if (isMountedRef.current) {
        Alert.alert('Error', 'Failed to start patrol.');
      }
      return false;
    } finally {
      startingRef.current = false;
      if (isMountedRef.current) setStarting(false);
    }
  }, [guardId, loadPatrols, getScanCoordinates, navigation, reports]);

  activeReportRef.current = activeReport;

  const loadPatrolsRef = useRef(loadPatrols);
  loadPatrolsRef.current = loadPatrols;

  const {
    scanning: nfcScanning,
    handleScanCheckpoint,
    scanModal,
  } = usePatrolNfcScan({
    getCoordinates: getScanCoordinates,
    getScanContext: () => {
      const report = activeReportRef.current;
      if (!report) return null;
      return {
        patrolling_report_id: report.id,
        patrolling_id: report.id,
        roster_id: report.roster_id ?? activeSession?.rosterId,
        guard_id: report.guard_id ?? guardId ?? undefined,
        report,
      };
    },
    hasActivePatrol: () => activeReportRef.current != null,
    onSuccess: (report, gateName) => {
      if (!isMountedRef.current) return;
      setActiveReport(isPatrolReportActive(report) ? report : null);
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
      loadPatrolsRef.current({ silent: true });
    },
  });

  useFocusEffect(
    useCallback(() => {
      void loadPatrolsRef.current();
    }, []),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPatrols({ silent: true });
  };

  const resolvedRosterId = activeSession?.rosterId;
  const hasCheckedInShift = activeSession != null && resolvedRosterId != null;
  const rosterReports = resolvedRosterId
    ? reports.filter(r => String(r.roster_id) === String(resolvedRosterId))
    : reports;
  const completedRounds = rosterReports.filter(r => !isPatrolReportActive(r));
  const runningRounds = rosterReports.filter(r => isPatrolReportActive(r));
  const hasRunningPatrol = runningRounds.length > 0 || activeReport != null;
  const canStartPatrol =
    hasCheckedInShift && !hasRunningPatrol && !starting && !loading;

  const handleStartNewPatrol = () => {
    if (startingRef.current || starting) {
      return;
    }
    if (!hasCheckedInShift) {
      promptCheckInRequired(() => navigation.navigate(GUARD_ROUTES.SHIFTS));
      return;
    }
    if (hasRunningPatrol) {
      Alert.alert(
        'Patrol already running',
        'Complete all NFC scans for the current patrol before starting a new one.',
      );
      return;
    }
    void startPatrol();
  };

  const completedCount = activeReport ? getCompletedCount(activeReport) : 0;
  const totalScanners = activeReport?.scanners?.length ?? 0;
  const progressPct =
    totalScanners > 0 ? Math.round((completedCount / totalScanners) * 100) : 0;
  const allComplete = totalScanners > 0 && completedCount >= totalScanners;

  const historyReports = rosterReports.filter(r => r.id !== activeReport?.id);
  const extraRunningCount = Math.max(
    0,
    runningRounds.length - (activeReport ? 1 : 0),
  );
  const patrolHeaderDate = formatFullDisplayDate(patrolDate);
  const patrolHeaderSub = [
    activeSession?.site,
    patrolHeaderDate,
  ]
    .filter(Boolean)
    .join(' · ');
  const screenTitle = activeReport ? 'Patrolling' : 'Patrol';

  const showShimmer = loading || starting;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.hdrRow}>
            <View style={styles.hdrTitleWrap}>
              {navigation.canGoBack() ? (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => navigation.goBack()}
                >
                  <ArrowLeft size={18} color={Colors.white} />
                </TouchableOpacity>
              ) : null}
              <Text style={styles.hdrTitle}>{screenTitle}</Text>
            </View>

            <View style={styles.hdrActions}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {loading
                    ? '...'
                    : `${completedRounds.length} done · ${runningRounds.length} running`}
                </Text>
              </View>

              {canStartPatrol ? (
                <TouchableOpacity
                  style={[styles.addBtn, (starting || loading) && styles.addBtnDisabled]}
                  onPress={handleStartNewPatrol}
                  disabled={starting || loading}
                >
                  {starting ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.addBtnText}>+ Start</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <Text style={styles.hdrSub}>{patrolHeaderSub}</Text>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.safeBody} edges={['bottom']}>
        <View style={styles.body}>
        {showShimmer ? (
          <PatrolTimelineShimmer />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.accent}
              />
            }
          >
            {loadError ? (
              <View style={[styles.errorCard, Shadows.card]}>
                <AlertTriangle size={28} color={Colors.danger} />
                <Text style={styles.errorTitle}>{loadError}</Text>
                <Text style={styles.errorSub}>
                  Pull down to refresh or tap retry to load patrol data again.
                </Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => void loadPatrols()}
                >
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {extraRunningCount > 0 ? (
              <View style={styles.warningBanner}>
                <AlertTriangle size={16} color={Colors.warning} />
                <Text style={styles.warningBannerText}>
                  {extraRunningCount + 1} patrols are running. Finish the latest
                  one first — older rounds cannot be scanned until it is complete.
                </Text>
              </View>
            ) : null}

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
                    {allComplete ? (
                      <Text style={styles.nextGateDone}>
                        All checkpoints completed — start a new patrol when ready
                      </Text>
                    ) : (
                      <Text style={styles.nextGate}>
                        {completedCount} of {totalScanners} checkpoints scanned
                      </Text>
                    )}
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
                  {hasCheckedInShift
                    ? 'Tap Start to begin a new patrol round for this shift.'
                    : 'Check in to a shift first, then open patrolling from the ongoing shift screen.'}
                </Text>
                {canStartPatrol ? (
                  <TouchableOpacity
                    style={[
                      styles.startMainBtn,
                      (starting || loading) && styles.addBtnDisabled,
                    ]}
                    onPress={handleStartNewPatrol}
                    disabled={starting || loading}
                  >
                    {starting ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Text style={styles.startMainBtnText}>Start Patrol</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
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
                    const isDone = isScannerComplete(scanner);

                    return (
                      <View key={scanner.id} style={styles.tlRow}>
                        <View style={styles.dotCol}>
                          <View
                            style={[
                              styles.dot,
                              {
                                backgroundColor: isDone
                                  ? Colors.success
                                  : Colors.accent,
                              },
                            ]}
                          />
                        </View>

                        <View
                          style={[
                            styles.card,
                            isDone ? styles.cardDone : styles.cardNow,
                          ]}
                        >
                          <View style={styles.cardTop}>
                            <View style={styles.cardTopLeft}>
                              <MapPin
                                size={14}
                                color={
                                  isDone ? Colors.success : Colors.accent
                                }
                              />
                              <Text style={styles.cardLoc}>{scanner.name}</Text>
                            </View>
                            <View
                              style={[
                                styles.statusChip,
                                isDone
                                  ? styles.statusChipDone
                                  : styles.statusChipNow,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusChipText,
                                  isDone
                                    ? styles.statusChipTextDone
                                    : styles.statusChipTextNow,
                                ]}
                              >
                                {isDone ? 'Done' : 'Ready'}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.nfcValue}>
                            {scanner.value || 'Tap tag at gate to read UID'}
                          </Text>

                          {scanner.scan_at ? (
                            <View style={styles.doneRow}>
                              <Clock size={12} color={Colors.success} />
                              <Text style={styles.doneText}>
                                Scanned at {formatPatrolTime(scanner.scan_at)}
                              </Text>
                            </View>
                          ) : (
                            <>
                              <Text style={styles.scanPrompt}>
                                Hold your phone on the NFC tag at this gate, then
                                tap scan.
                              </Text>
                              <TouchableOpacity
                                style={[
                                  styles.scanGateBtn,
                                  nfcScanning && styles.scanGateBtnDisabled,
                                ]}
                                onPress={() => handleScanCheckpoint(scanner)}
                                disabled={nfcScanning}
                              >
                                <ScanLine size={14} color={Colors.white} />
                                <Text style={styles.scanGateBtnText}>
                                  Scan NFC at {scanner.name}
                                </Text>
                              </TouchableOpacity>
                            </>
                          )}
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
                  const roundActive = isPatrolReportActive(report);
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
                            roundActive
                              ? styles.statusActive
                              : styles.statusDone,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              roundActive
                                ? styles.statusActiveText
                                : styles.statusDoneText,
                            ]}
                          >
                            {roundActive ? 'Running' : 'Completed'}
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
        </View>

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
        {scanModal}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.headerStart },
  safeTop: { backgroundColor: Colors.headerStart },
  safeBody: { flex: 1, backgroundColor: Colors.bgAlt },
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
    gap: 10,
  },
  hdrTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  hdrActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hdrTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  countBadge: {
    backgroundColor: 'rgba(121,31,61,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(121,31,61,0.3)',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#f5c2d0',
  },
  hdrSub: { fontSize: FontSizes.xs, color: 'rgba(255,255,255,0.35)' },
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
  body: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 14, paddingBottom: 24, paddingHorizontal: 14 },
  summaryCard: {
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
    backgroundColor: Colors.warningLight,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warningBannerText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.warning,
    lineHeight: 18,
  },
  emptyCard: {
    marginBottom: 10,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radii.xl,
    padding: 24,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(229,62,62,0.25)',
  },
  errorTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.danger,
    marginTop: 12,
    textAlign: 'center',
  },
  errorSub: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: Colors.danger,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.md,
  },
  retryBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSizes.sm,
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
  startMainBtn: {
    marginTop: 14,
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  startMainBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.white,
  },
  section: { paddingBottom: 8 },
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
  scanGateBtnDisabled: { opacity: 0.6 },
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
});
