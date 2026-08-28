import { Platform, PermissionsAndroid, AppState, AppStateStatus } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  formatted: string; // "latitude,longitude"
}

export type LocationModalType = 'disclosure' | 'location_disabled' | 'permission_denied' | null;

export interface LocationModalState {
  type: LocationModalType;
  visible: boolean;
  onContinue?: () => void;
  onCancel?: () => void;
}

class LocationService {
  private lastKnownLocation: LocationData | null = null;
  private watchId: number | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private readonly REFRESH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
  private isTracking = false;

  private modalListeners: Array<(state: LocationModalState) => void> = [];
  private currentModalState: LocationModalState = { type: null, visible: false };
  private appStateSubscription: any = null;
  private isRequestingPermission = false;

  constructor() {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'auto',
    });

    this.setupAppStateListener();
  }

  public subscribeModalState(listener: (state: LocationModalState) => void) {
    this.modalListeners.push(listener);
    listener(this.currentModalState);
    return () => {
      this.modalListeners = this.modalListeners.filter((l) => l !== listener);
    };
  }

  public setModalState(state: LocationModalState) {
    this.currentModalState = state;
    this.modalListeners.forEach((listener) => listener(state));
  }

  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        this.onAppForeground();
      }
    });
  }

  private async onAppForeground() {
    if (this.currentModalState.type === 'location_disabled') {
      const isEnabled = await this.checkLocationEnabled();
      if (isEnabled) {
        this.setModalState({ type: null, visible: false });
        if (this.isTracking) {
          this.refreshLocation();
        }
      }
    }
  }

  /**
   * Checks if foreground location permissions are already granted without showing prompts.
   */
  async hasForegroundPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const fine = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const coarse = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );
        return fine || coarse;
      } catch {
        return false;
      }
    }
    return true;
  }

  /**
   * Performs Play Store compliant location permission flow:
   * 1. Check if permission already granted -> return true.
   * 2. If not granted -> show Prominent Disclosure Modal.
   * 3. User taps Continue -> trigger native permission request (FINE & COARSE).
   * 4. If foreground granted on Android 10+ (API 29+), request ACCESS_BACKGROUND_LOCATION.
   */
  async requestPermissionWithDisclosure(): Promise<boolean> {
    const alreadyGranted = await this.hasForegroundPermission();
    if (alreadyGranted) {
      return true;
    }

    if (this.isRequestingPermission) {
      return false;
    }
    this.isRequestingPermission = true;

    return new Promise((resolve) => {
      this.setModalState({
        type: 'disclosure',
        visible: true,
        onContinue: async () => {
          this.setModalState({ type: null, visible: false });
          const granted = await this.executeNativePermissionRequest();
          this.isRequestingPermission = false;
          resolve(granted);
        },
        onCancel: () => {
          this.setModalState({ type: null, visible: false });
          this.isRequestingPermission = false;
          resolve(false);
        },
      });
    });
  }

  private async executeNativePermissionRequest(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const fgGranted =
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED ||
          granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;

        if (fgGranted) {
          // On Android 10+ (API Level >= 29), request background location separately
          const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
          if (apiLevel >= 29) {
            const hasBg = await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
            );
            if (!hasBg) {
              try {
                await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION
                );
              } catch (bgErr) {
                // Background permission request optional fallback
              }
            }
          }
          return true;
        } else {
          const isNeverAskAgain =
            granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN &&
            granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;

          if (isNeverAskAgain) {
            this.setModalState({ type: 'permission_denied', visible: true });
          }
          return false;
        }
      } catch (err) {
        return false;
      }
    } else {
      return new Promise((resolve) => {
        Geolocation.requestAuthorization(
          () => resolve(true),
          () => resolve(false)
        );
      });
    }
  }

  /**
   * Checks if location permissions are granted.
   * Prompts user with disclosure if not already granted.
   */
  async checkLocationPermission(): Promise<boolean> {
    return this.requestPermissionWithDisclosure();
  }

  /**
   * Alias for checkLocationPermission to maintain backward compatibility
   */
  async checkPermission(): Promise<'granted' | 'denied' | 'unavailable' | 'blocked'> {
    const granted = await this.checkLocationPermission();
    return granted ? 'granted' : 'denied';
  }

  /**
   * Checks if GPS/Location services are enabled on the device.
   */
  async checkLocationEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          if (error.code === 2) {
            resolve(false);
          } else {
            resolve(true);
          }
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 10000 }
      );
    });
  }

  /**
   * Starts automatic location tracking.
   * Fetches immediately and then every 2 minutes.
   */
  async startLocationTracking() {
    if (this.isTracking) return;
    this.isTracking = true;

    const hasPermission = await this.checkLocationPermission();
    if (!hasPermission) {
      this.isTracking = false;
      return;
    }

    // Initial fetch
    this.refreshLocation();

    // 2-minute refresh timer
    this.refreshTimer = setInterval(() => {
      this.refreshLocation();
    }, this.REFRESH_INTERVAL_MS);

    // Continuous watch for better accuracy
    this.watchId = Geolocation.watchPosition(
      (position) => this.updateCache(position),
      (error) => {
        if (error.code === 2) {
          this.handleLocationOff();
        }
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 10000,
        fastestInterval: 5000,
      }
    );
  }

  /**
   * Alias for startLocationTracking
   */
  startTracking() {
    this.startLocationTracking();
  }

  /**
   * Stops all location tracking and clears timers.
   */
  stopLocationTracking() {
    this.isTracking = false;
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Alias for stopLocationTracking
   */
  stopTracking() {
    this.stopLocationTracking();
  }

  private async refreshLocation() {
    Geolocation.getCurrentPosition(
      (position) => this.updateCache(position),
      (error) => {
        if (error.code === 2) {
          this.handleLocationOff();
        } else {
          this.refreshLocationLowAccuracy();
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }

  private refreshLocationLowAccuracy() {
    Geolocation.getCurrentPosition(
      (position) => this.updateCache(position),
      () => { }, // Silent fail
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  private updateCache(position: any) {
    const { latitude, longitude, accuracy } = position.coords;
    this.lastKnownLocation = {
      latitude,
      longitude,
      accuracy,
      timestamp: position.timestamp,
      formatted: `${latitude},${longitude}`,
    };
  }

  private handleLocationOff() {
    if (this.currentModalState.type !== 'location_disabled') {
      this.setModalState({
        type: 'location_disabled',
        visible: true,
      });
    }
  }

  /**
   * Returns the latest cached location data.
   */
  getLatestLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  /**
   * Returns the formatted "lat,long" string.
   * If no cache exists, it attempts to fetch it.
   */
  async getFormattedLocation(): Promise<string> {
    if (this.lastKnownLocation) {
      if (Date.now() - this.lastKnownLocation.timestamp > 5 * 60 * 1000) {
        this.refreshLocation();
      }
      return this.lastKnownLocation.formatted;
    }

    const hasPermission = await this.hasForegroundPermission();
    if (!hasPermission) return '';

    return new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => {
          this.updateCache(position);
          resolve(this.lastKnownLocation?.formatted || '');
        },
        async (error) => {
          if (error.code === 2) {
            this.handleLocationOff();
            resolve('');
          } else {
            Geolocation.getCurrentPosition(
              (pos) => {
                this.updateCache(pos);
                resolve(this.lastKnownLocation?.formatted || '');
              },
              () => resolve(''),
              { enableHighAccuracy: false, timeout: 10000 }
            );
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    });
  }

  /**
   * Backward compatibility alias for getFormattedLocation
   */
  async getCoordinatesString(): Promise<string> {
    return this.getFormattedLocation();
  }

  /**
   * Returns the current location as an object.
   * Useful for backward compatibility.
   */
  async getCurrentLocation(): Promise<LocationData> {
    const formatted = await this.getFormattedLocation();
    if (this.lastKnownLocation) return this.lastKnownLocation;

    throw new Error('Could not fetch location');
  }
}

export const locationService = new LocationService();
export default locationService;

