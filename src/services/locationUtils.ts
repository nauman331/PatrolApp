import Geolocation from '@react-native-community/geolocation';

export type LocationFix = {
  coordinates: string;
  displayName: string;
};

export function truncateLocationName(name: string, maxLength = 52): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 3).trim()}...`;
}

export async function resolveLocationDisplayName(
  latitude: number,
  longitude: number,
  fallback?: string,
): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PatrolApp/1.0' },
    });
    if (!response.ok) {
      throw new Error('Reverse geocode failed');
    }
    const data = (await response.json()) as {
      display_name?: string;
      name?: string;
    };
    const resolved = data.display_name ?? data.name ?? fallback;
    if (resolved) {
      return truncateLocationName(String(resolved));
    }
  } catch {
    // fall through to fallback
  }

  if (fallback?.trim()) {
    return truncateLocationName(fallback.trim());
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export function getCurrentPosition(
  enableHighAccuracy: boolean,
): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      err => reject(err),
      { enableHighAccuracy, timeout: 20000, maximumAge: 5000 },
    );
  });
}

export async function fetchLocationFix(
  enableHighAccuracy: boolean,
  fallbackName?: string,
): Promise<LocationFix> {
  const { latitude, longitude } = await getCurrentPosition(enableHighAccuracy);
  const coordinates = `${latitude},${longitude}`;
  const displayName = await resolveLocationDisplayName(
    latitude,
    longitude,
    fallbackName,
  );
  return { coordinates, displayName };
}

export function formatCaptureTimestamp(date = new Date()): string {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
