import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Geolocation from '@react-native-community/geolocation';
import {
  launchCamera,
  type Asset,
} from 'react-native-image-picker';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import { NavBar } from '../components';
import {
  AlertTriangle,
  ClipboardList,
  Home,
  Route,
  User,
  Camera,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle,
  FileText,
  RefreshCw,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES } from '../navigation/constants';
import type { GuardStackScreenProps } from '../navigation/types';
import type { RootState } from '../store/store';
import { getGuardMyJobs, guardJobCheckin } from '../services/guardApi';
import { findIncidentContextByRoster } from '../services/guardJobsMapper';
import { saveActiveShiftSession } from '../services/activeShiftSession';

type ShiftSignInRoute = GuardStackScreenProps<'ShiftSignIn'>['route'];

function truncateSiteName(site: string, maxWords = 5): string {
  const words = site.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return site;
  return `${words.slice(0, maxWords).join(' ')}...`;
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

async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
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

export default function ShiftSignInScreen() {
  const navigation = useGuardNavigation();
  const route = useRoute<ShiftSignInRoute>();
  const params = route.params;
  const guardId = useSelector((state: RootState) => state.auth?.guardId ?? null);

  const [checkingIn, setCheckingIn] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [signinNotes, setSigninNotes] = useState('Starting my shift');
  const [selfie, setSelfie] = useState<Asset | null>(null);
  const [resolvedSiteId, setResolvedSiteId] = useState<
    string | number | undefined
  >(params?.siteId);

  useEffect(() => {
    if (params?.siteId || !params?.rosterId) return;
    let mounted = true;
    (async () => {
      const result = await getGuardMyJobs();
      if (!mounted || !result.data?.length) return;
      const ctx = findIncidentContextByRoster(result.data, params.rosterId!);
      if (ctx?.siteId != null) setResolvedSiteId(ctx.siteId);
    })();
    return () => {
      mounted = false;
    };
  }, [params?.rosterId, params?.siteId]);

  useEffect(() => {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'auto',
    });
    Geolocation.requestAuthorization(
      () => {
        // no-op
      },
      () => {
        // no-op
      },
    );
  }, []);

  const shift = {
    site: params?.site ?? 'Site',
    id: params?.shiftId,
    siteId: resolvedSiteId ?? params?.siteId,
    time: params?.time,
    zones: params?.zones,
    status: params?.status,
    rosterId: params?.rosterId,
  };
  const isActiveShift = shift?.status === 'active';

  const refreshLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const allowed = await requestLocationPermission();
      if (!allowed) {
        Alert.alert(
          'Permission required',
          'Location permission is needed to check in.',
        );
        return;
      }
      try {
        const preciseCoords = await getCurrentLocation(true);
        setLocation(preciseCoords);
      } catch {
        // Fallback for devices where GPS fix is slow/blocked.
        const coarseCoords = await getCurrentLocation(false);
        setLocation(coarseCoords);
      }
    } catch (error: any) {
      const code = error?.code ? ` (code ${error.code})` : '';
      Alert.alert(
        `Location unavailable${code}`,
        'Could not get GPS coordinates. Enable location services and try again.',
      );
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  const handleCaptureSelfie = async () => {
    const allowed = await requestCameraPermission();
    if (!allowed) {
      Alert.alert('Permission required', 'Camera permission is needed for selfie.');
      return;
    }

    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'front',
      saveToPhotos: false,
      quality: 0.8,
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Camera error', result.errorMessage ?? 'Could not open camera.');
      return;
    }

    const asset = result.assets?.[0];
    if (asset?.uri) {
      setSelfie(asset);
    }
  };

  const handleCheckIn = async () => {
    if (!shift.rosterId) {
      Alert.alert('Error', 'Missing roster for this shift.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Location is required. Tap refresh to fetch GPS.');
      return;
    }
    if (!signinNotes.trim()) {
      Alert.alert('Error', 'Please add sign-in notes.');
      return;
    }
    if (!selfie?.uri) {
      Alert.alert('Error', 'Please capture a selfie before signing in.');
      return;
    }

    try {
      setCheckingIn(true);
      const result = await guardJobCheckin({
        roster_id: shift.rosterId,
        location: location.trim(),
        signin_notes: signinNotes.trim(),
        guard_id: guardId ?? undefined,
        selfie: {
          uri: selfie.uri,
          type: selfie.type ?? 'image/jpeg',
          name: selfie.fileName ?? 'selfie.jpg',
        },
      });

      if (result.success) {
        const signInTime = new Date().toISOString();
        await saveActiveShiftSession({
          rosterId: shift.rosterId,
          site: shift.site,
          zones: shift.zones,
          signInTime,
          shiftId: shift.id,
          siteId: shift.siteId,
        });
        navigation.replace(GUARD_ROUTES.ONGOING_SHIFT, {
          rosterId: shift.rosterId,
          site: shift.site,
          zones: shift.zones,
          signInTime,
          shiftId: shift.id,
          siteId: shift.siteId,
        });
      } else {
        Alert.alert('Check-in failed', result.message || 'Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong during check-in.');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.decorCircle} />
            <View style={styles.hdrTopRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <ArrowLeft size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
              <Text style={styles.hdrTitle}>Shift Check-In</Text>
            </View>

            <View style={styles.siteBox}>
              <Text style={styles.siteBoxLbl}>CURRENT SITE</Text>
              <Text style={styles.siteBoxName} numberOfLines={2}>
                {truncateSiteName(shift.site)}
              </Text>
              <View style={styles.siteTimeRow}>
                <Clock size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.siteBoxTime}>
                  {shift.time || '—'} · {shift.zones || 'All Zones'}
                </Text>
              </View>
              {shift.id ? (
                <Text style={styles.rosterIdText}>Roster #{shift.rosterId}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.body}>
            {/* Location */}
            <View style={[styles.card, Shadows.card]}>
              <View style={styles.cardTitleRow}>
                <MapPin size={16} color={Colors.accent} />
                <Text style={styles.cardTitle}>GPS Location</Text>
              </View>
              <Text style={styles.locationValue}>
                {locationLoading
                  ? 'Fetching location...'
                  : location || 'Location not available'}
              </Text>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={refreshLocation}
                disabled={locationLoading}
              >
                <RefreshCw size={14} color={Colors.accent} />
                <Text style={styles.secondaryBtnText}>Refresh location</Text>
              </TouchableOpacity>
            </View>

            {/* Sign-in notes */}
            <View style={[styles.card, Shadows.card]}>
              <View style={styles.cardTitleRow}>
                <FileText size={16} color={Colors.accent} />
                <Text style={styles.cardTitle}>Sign-in notes</Text>
              </View>
              <TextInput
                style={styles.notesInput}
                value={signinNotes}
                onChangeText={setSigninNotes}
                placeholder="e.g. Starting my shift"
                placeholderTextColor={Colors.textMuted}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Selfie */}
            <View style={[styles.card, Shadows.card]}>
              <View style={styles.cardTitleRow}>
                <Camera size={16} color={Colors.accent} />
                <Text style={styles.cardTitle}>Selfie (required)</Text>
              </View>

              <TouchableOpacity
                style={styles.camArea}
                onPress={handleCaptureSelfie}
                activeOpacity={0.9}
              >
                {selfie?.uri ? (
                  <Image source={{ uri: selfie.uri }} style={styles.selfiePreview} />
                ) : (
                  <>
                    <Camera size={40} color={Colors.accent} />
                    <Text style={styles.camHint}>Tap to capture selfie</Text>
                  </>
                )}
              </TouchableOpacity>

              {selfie?.uri ? (
                <TouchableOpacity style={styles.retakeBtn} onPress={handleCaptureSelfie}>
                  <Text style={styles.retakeBtnText}>Retake selfie</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.signInBtn, checkingIn && styles.signInBtnDisabled]}
              onPress={handleCheckIn}
              activeOpacity={0.85}
              disabled={checkingIn}
            >
              <View style={styles.signInBtnInner}>
                {checkingIn ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <CheckCircle size={20} color="#fff" />
                )}
                <Text style={styles.signInBtnText}>
                  {checkingIn
                    ? 'SIGNING IN...'
                    : isActiveShift
                      ? 'CONTINUE SHIFT'
                      : 'SIGN IN TO SHIFT'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <NavBar
          variant="light"
          items={[
            { icon: Home, label: 'Home' },
            { icon: Route, label: 'Patrol' },
            { icon: AlertTriangle, label: 'Incidents' },
            { icon: ClipboardList, label: 'Shifts', active: true },
            { icon: User, label: 'Profile' },
          ]}
          onPress={i => {
            const screens = [
              GUARD_ROUTES.DASHBOARD,
              GUARD_ROUTES.PATROL_TIMELINE,
              GUARD_ROUTES.INCIDENTS,
              GUARD_ROUTES.SHIFTS,
              GUARD_ROUTES.PROFILE,
            ];
            navigation.navigate(screens[i]);
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgAlt },
  safe: { flex: 1 },

  header: {
    backgroundColor: Colors.headerStart,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(121,31,61,0.08)',
  },
  hdrTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  backBtn: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hdrTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },

  siteBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.lg,
    padding: 14,
  },
  siteBoxLbl: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  siteBoxName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 6,
  },
  siteTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  siteBoxTime: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.6)',
    flex: 1,
  },
  rosterIdText: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 8,
  },

  body: { padding: 14, paddingBottom: 24 },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 16,
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  locationValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: Colors.accentAlpha25,
    borderRadius: Radii.sm,
    paddingVertical: 10,
    backgroundColor: Colors.accentLight,
  },
  secondaryBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.accent,
  },

  notesInput: {
    minHeight: 88,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: 12,
    fontSize: 13,
    color: Colors.textPrimary,
  },

  camArea: {
    height: 200,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.accent,
  },
  camHint: {
    marginTop: 10,
    fontSize: FontSizes.xs,
    color: Colors.accent,
    fontWeight: '600',
  },
  selfiePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  retakeBtn: {
    marginTop: 10,
    alignSelf: 'center',
  },
  retakeBtnText: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontWeight: '700',
  },

  signInBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  signInBtnDisabled: {
    opacity: 0.7,
  },
  signInBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
