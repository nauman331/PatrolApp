import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  TextInput,
  Image,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import { type Asset } from 'react-native-image-picker';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import {
  ArrowLeft,
  Clock,
  FileText,
  Info,
  Footprints,
  ScanLine,
  Route,
} from 'lucide-react-native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES } from '../navigation/constants';
import type { GuardStackScreenProps } from '../navigation/types';
import type { RootState } from '../store/store';
import { guardJobCheckout } from '../services/guardApi';
import { usePatrolNfcScan } from '../hooks/usePatrolNfcScan';
import {
  clearActiveShiftSession,
  getActiveShiftSession,
  promptCheckInRequired,
  saveActiveShiftSession,
} from '../services/activeShiftSession';
import {
  fetchLocationFix,
  formatCaptureTimestamp,
} from '../services/locationUtils';
import { captureSelfieFromCamera } from '../services/captureSelfie';
import {
  SelfieWatermarkProcessor,
  type SelfieWatermarkJob,
} from '../components/SelfieWatermarkProcessor';

const appLogo = require('../../assets/opg-logo.png');

type OngoingShiftRoute = GuardStackScreenProps<'OngoingShift'>['route'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatElapsed(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatSignInLabel(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${dd}-${mm}-${yyyy} ${hh}:${min}`;
}

function resolveCaptureUri(asset: Asset): string {
  return asset.uri?.trim() ?? '';
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

export default function OngoingShiftScreen() {
  const navigation = useGuardNavigation();
  const route = useRoute<OngoingShiftRoute>();
  const guardId = useSelector((state: RootState) => state.auth?.guardId ?? null);

  const [rosterId, setRosterId] = useState<string | number | undefined>(
    route.params?.rosterId,
  );
  const [site, setSite] = useState(route.params?.site ?? 'Site');
  const [address, setAddress] = useState(route.params?.zones ?? 'All Zones');
  const [signInTime, setSignInTime] = useState(
    route.params?.signInTime ?? new Date().toISOString(),
  );
  const [siteId, setSiteId] = useState<string | number | undefined>(
    route.params?.siteId,
  );

  const [elapsed, setElapsed] = useState('00:00:00');
  const [signoutNotes, setSignoutNotes] = useState('');
  const [signoutSelfie, setSignoutSelfie] = useState<Asset | null>(null);
  const [watermarkJob, setWatermarkJob] = useState<SelfieWatermarkJob | null>(null);
  const [watermarking, setWatermarking] = useState(false);
  const pendingSelfieRef = useRef<Asset | null>(null);
  const [locationCoords, setLocationCoords] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [locationFetched, setLocationFetched] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const locationFallback = site || address || 'Current location';

  const getScanCoordinates = useCallback(async () => {
    let coords = locationCoords.trim();
    if (coords) return coords;

    const allowed = await requestLocationPermission();
    if (!allowed) return '';

    try {
      let fix;
      try {
        fix = await fetchLocationFix(true, locationFallback);
      } catch {
        fix = await fetchLocationFix(false, locationFallback);
      }
      coords = fix.coordinates;
      setLocationCoords(fix.coordinates);
      setLocationLabel(fix.displayName);
      setLocationFetched(true);
    } catch {
      coords = '';
    }
    return coords;
  }, [locationCoords, locationFallback]);

  const { scanning: nfcScanning, handleScan: handleNfcScan, scanModal } =
    usePatrolNfcScan({
    getCoordinates: getScanCoordinates,
    requireActivePatrol: false,
    getScanContext: () => ({
      roster_id: rosterId,
      guard_id: guardId ?? undefined,
    }),
  });

  useEffect(() => {
    (async () => {
      const session = await getActiveShiftSession();
      if (session) {
        setRosterId(session.rosterId);
        setSite(session.site);
        setAddress(session.zones);
        setSignInTime(session.signInTime);
        setSiteId(session.siteId);
      } else if (route.params?.rosterId) {
        await saveActiveShiftSession({
          rosterId: route.params.rosterId,
          site: route.params.site ?? 'Site',
          zones: route.params.zones ?? 'All Zones',
          signInTime: route.params.signInTime ?? new Date().toISOString(),
          shiftId: route.params.shiftId,
          siteId: route.params.siteId,
        });
        setSiteId(route.params.siteId);
      }
    })();
  }, [route.params]);

  useEffect(() => {
    const start = new Date(signInTime).getTime();
    const tick = () => {
      const diff = Date.now() - start;
      setElapsed(formatElapsed(Math.max(0, diff)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [signInTime]);

  const refreshLocation = useCallback(async () => {
    if (locationFetched) {
      return;
    }

    setLocationLoading(true);
    try {
      const allowed = await requestLocationPermission();
      if (!allowed) {
        Alert.alert('Permission required', 'Location permission is needed.');
        return;
      }

      let fix;
      try {
        fix = await fetchLocationFix(true, locationFallback);
      } catch {
        fix = await fetchLocationFix(false, locationFallback);
      }

      setLocationCoords(fix.coordinates);
      setLocationLabel(fix.displayName);
      setLocationFetched(true);
    } catch {
      Alert.alert('Location unavailable', 'Could not get GPS coordinates.');
    } finally {
      setLocationLoading(false);
    }
  }, [locationFetched, locationFallback]);

  useEffect(() => {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'auto',
    });
    refreshLocation();
  }, [refreshLocation]);

  const handleCaptureSelfie = async () => {
    const asset = await captureSelfieFromCamera();
    const captureUri = asset?.uri ? resolveCaptureUri(asset) : '';
    if (captureUri && asset) {
      pendingSelfieRef.current = asset;
      setWatermarking(true);
      setWatermarkJob({
        sourceUri: captureUri,
        timestamp: formatCaptureTimestamp(),
        width: asset.width,
        height: asset.height,
        base64: asset.base64,
      });
    }
  };

  const handleStartPatrolling = async () => {
    const session = await getActiveShiftSession();
    if (!session) {
      promptCheckInRequired(() => navigation.navigate(GUARD_ROUTES.SHIFTS));
      return;
    }
    if (rosterId == null) {
      Alert.alert('Error', 'Missing roster for this shift.');
      return;
    }
    if (String(session.rosterId) !== String(rosterId)) {
      Alert.alert(
        'Shift mismatch',
        'This screen does not match your checked-in shift. Open the correct ongoing shift first.',
      );
      return;
    }
    if (siteId == null) {
      Alert.alert('Error', 'Missing site for this shift.');
      return;
    }

    let coords = locationCoords.trim();
    if (!coords) {
      setLocationLoading(true);
      try {
        const allowed = await requestLocationPermission();
        if (!allowed) {
          Alert.alert(
            'Permission required',
            'Location permission is needed to start patrolling.',
          );
          return;
        }
        let fix;
        try {
          fix = await fetchLocationFix(true, locationFallback);
        } catch {
          fix = await fetchLocationFix(false, locationFallback);
        }
        coords = fix.coordinates;
        setLocationCoords(fix.coordinates);
        setLocationLabel(fix.displayName);
        setLocationFetched(true);
      } catch {
        Alert.alert('Location unavailable', 'Could not get GPS coordinates.');
        return;
      } finally {
        setLocationLoading(false);
      }
    }

    navigation.navigate(GUARD_ROUTES.PATROL_TIMELINE, {
      rosterId,
      siteId,
      site,
      coordinates: coords,
      autoStart: true,
    });
  };

  const handleEndShift = async () => {
    if (rosterId == null) {
      Alert.alert('Error', 'Missing roster for this shift.');
      return;
    }
    if (!locationCoords.trim()) {
      Alert.alert('Error', 'Sign-out location is required.');
      return;
    }
    if (!signoutNotes.trim()) {
      Alert.alert('Error', 'Please add sign-out notes.');
      return;
    }
    if (!signoutSelfie?.uri) {
      Alert.alert('Error', 'Please capture sign-out selfie.');
      return;
    }

    try {
      setCheckingOut(true);
      const result = await guardJobCheckout({
        roster_id: rosterId,
        signout_location: locationCoords.trim(),
        signout_notes: signoutNotes.trim(),
        guard_id: guardId ?? undefined,
        selfie: {
          uri: signoutSelfie.uri,
          type: signoutSelfie.type ?? 'image/jpeg',
          name: signoutSelfie.fileName ?? 'selfie.jpg',
        },
      });

      if (result.success) {
        await clearActiveShiftSession();
        Alert.alert('Success', result.message ?? 'Signed out successfully.', [
          {
            text: 'OK',
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: GUARD_ROUTES.DASHBOARD }],
              }),
          },
        ]);
      } else {
        Alert.alert('Check-out failed', result.message || 'Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong during check-out.');
    } finally {
      setCheckingOut(false);
    }
  };

  const signInLabel = formatSignInLabel(signInTime);

  const handleWatermarkComplete = useCallback((uri: string) => {
    const asset = pendingSelfieRef.current;
    if (asset) {
      setSignoutSelfie({ ...asset, uri });
    }
    pendingSelfieRef.current = null;
    setWatermarkJob(null);
    setWatermarking(false);
  }, []);

  const handleWatermarkError = useCallback(() => {
    Alert.alert('Error', 'Could not apply watermark to selfie.');
    pendingSelfieRef.current = null;
    setWatermarkJob(null);
    setWatermarking(false);
  }, []);

  return (
    <View style={styles.container}>
      <SelfieWatermarkProcessor
        job={watermarkJob}
        onComplete={handleWatermarkComplete}
        onError={handleWatermarkError}
      />
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ongoing Shift</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, styles.timerCard, Shadows.card]}>
            <Text style={styles.timer}>{elapsed}</Text>
            <Text style={styles.timerLbl}>Sign In Time</Text>
            <View style={styles.timePill}>
              <Text style={styles.timePillText}>{signInLabel}</Text>
            </View>
          </View>

          <View style={[styles.card, Shadows.card]}>
            <Text style={styles.siteLbl}>Site</Text>
            <Text style={styles.siteName}>{site}</Text>
            <Text style={styles.siteAddr}>{address}</Text>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridLeft}>
              <View style={[styles.smallCard, Shadows.card]}>
                <Clock size={22} color={Colors.success} />
                <Text style={styles.smallTitle}>Sign In Time</Text>
                <Text style={styles.smallSub}>{signInLabel}</Text>
              </View>
              <View style={[styles.smallCard, Shadows.card]}>
                <FileText size={22} color={Colors.info} />
                <Text style={styles.smallTitle}>SignOut Notes</Text>
                <TextInput
                  style={styles.notesInput}
                  value={signoutNotes}
                  onChangeText={setSignoutNotes}
                  placeholder="End my shift"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.selfieCard, Shadows.card]}
              onPress={handleCaptureSelfie}
              activeOpacity={0.9}
              disabled={watermarking}
            >
              <View style={styles.selfieInner}>
                {watermarking ? (
                  <>
                    <ActivityIndicator size="large" color={Colors.info} />
                    <Text style={styles.selfieHint}>Applying watermark...</Text>
                  </>
                ) : signoutSelfie?.uri ? (
                  <Image
                    source={{ uri: signoutSelfie.uri }}
                    style={styles.selfieImg}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <Image
                      source={appLogo}
                      style={styles.selfiePlaceholderLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.selfieTitle}>SignOut Selfie</Text>
                    <Text style={styles.selfieHint}>Tap to capture</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, Shadows.card]}>
            <Text style={styles.locLbl}>Sign-out location</Text>
            <Text style={styles.locValue} numberOfLines={2}>
              {locationLoading
                ? 'Fetching location...'
                : locationLabel || 'Location not available'}
            </Text>
            <TouchableOpacity
              style={[
                styles.refreshLocBtn,
                (locationLoading || locationFetched) && styles.refreshLocBtnDisabled,
              ]}
              onPress={refreshLocation}
              disabled={locationLoading || locationFetched}
            >
              <Text style={styles.refreshLocText}>
                {locationFetched ? 'Location captured' : 'Refresh location'}
              </Text>
            </TouchableOpacity>
          </View>



          <TouchableOpacity
            style={[styles.actionRow, Shadows.card]}
            onPress={() =>
              navigation.navigate(GUARD_ROUTES.ADD_INCIDENT, {
                rosterId,
                siteId,
                shiftId: route.params?.shiftId,
              })
            }
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.infoLight }]}>
              <Info size={20} color={Colors.info} />
            </View>
            <Text style={styles.actionTitle}>Incident Report</Text>
            <Text style={styles.plusBtn}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, Shadows.card]}
            onPress={handleStartPatrolling}
          >
            <View style={[styles.actionIcon, { backgroundColor: Colors.accentLight }]}>
              <Route size={20} color={Colors.accent} />
            </View>
            <Text style={styles.actionTitle}>Patrolling</Text>
            <Text style={styles.plusBtn}>+</Text>
          </TouchableOpacity>

         

          <TouchableOpacity
            style={[styles.endBtn, checkingOut && styles.endBtnDisabled]}
            activeOpacity={0.85}
            onPress={handleEndShift}
            disabled={checkingOut}
          >
            {checkingOut ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.endBtnText}>END SHIFT</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
        {scanModal}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgAlt },
  safe: { flex: 1 },
  header: {
    backgroundColor: Colors.headerStart,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSpacer: { width: 36 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 28 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 18,
    marginBottom: 14,
  },
  timerCard: { alignItems: 'center' },
  timer: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  timerLbl: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  timePill: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  timePillText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  siteLbl: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  siteName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  siteAddr: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  gridLeft: { flex: 1, gap: 10 },
  smallCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  smallTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  smallSub: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  notesInput: {
    width: '100%',
    marginTop: 8,
    minHeight: 52,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    padding: 8,
    fontSize: FontSizes.xs,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  selfieCard: {
    flex: 1,
    height: 242,
    maxHeight: 242,
    alignSelf: 'flex-start',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    overflow: 'hidden',
  },
  selfieInner: {
    flex: 1,
    borderRadius: Radii.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selfiePlaceholderLogo: {
    width: 72,
    height: 48,
    marginBottom: 8,
  },
  selfieImg: {
    ...StyleSheet.absoluteFill,
    borderRadius: Radii.md,
  },
  selfieTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
    textAlign: 'center',
  },
  selfieHint: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 4,
  },
  locLbl: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  locValue: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 18,
  },
  refreshLocBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshLocBtnDisabled: {
    opacity: 0.55,
  },
  refreshLocText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.accent,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  actionSub: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  plusBtn: {
    fontSize: 22,
    color: Colors.textMuted,
    fontWeight: '300',
    paddingHorizontal: 8,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    borderRadius: Radii.lg,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 10,
    minHeight: 52,
  },
  scanBtnDisabled: { opacity: 0.75 },
  scanBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  endBtn: {
    backgroundColor: '#9CA3AF',
    borderRadius: Radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  endBtnDisabled: { opacity: 0.7 },
  endBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
