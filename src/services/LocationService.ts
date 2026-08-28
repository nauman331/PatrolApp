import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  formatted: string; // "latitude,longitude"
}

class LocationService {
  private lastKnownLocation: LocationData | null = null;
  private watchId: number | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private readonly REFRESH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
  private isTracking = false;

  constructor() {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'auto',
    });
  }

  /**
   * Checks if location permissions are granted.
   * Requests them if not already granted.
   */
  async checkLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        return (
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED ||
          granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
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
    // Try High Accuracy first
    Geolocation.getCurrentPosition(
      (position) => this.updateCache(position),
      (error) => {
        if (error.code === 2) {
          this.handleLocationOff();
        } else {
          // Fallback to lower accuracy if high accuracy fails (timeout/unavailable)
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
    Alert.alert(
      'Location Services Disabled',
      'Please enable GPS/Location Services to continue using the app.',
      [{ text: 'OK' }]
    );
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
      // If we have a cache but it's older than 5 minutes, refresh in background
      if (Date.now() - this.lastKnownLocation.timestamp > 5 * 60 * 1000) {
        this.refreshLocation();
      }
      return this.lastKnownLocation.formatted;
    }

    // No cache, attempt immediate fetch
    const hasPermission = await this.checkLocationPermission();
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
            // Try one more time with low accuracy
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
