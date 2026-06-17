import { Image, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Marker, {
  ImageFormat,
  TextBackgroundType,
} from 'react-native-image-marker';

const appLogo = require('../../assets/opg-logo.png');

export type SelfieWatermarkJob = {
  sourceUri: string;
  timestamp: string;
  width?: number;
  height?: number;
  base64?: string;
};

const MARKER_QUALITY = 92;
const ANDROID_MARKER_OPTS =
  Platform.OS === 'android' ? { maxSize: 2048 as const } : {};

let cachedLogoUri: string | null = null;

function normalizeFileUri(uri: string): string {
  if (!uri) return uri;
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
    return uri;
  }
  if (uri.startsWith('/')) {
    return `file://${uri}`;
  }
  return uri;
}

function stripFilePrefix(uri: string): string {
  return uri.startsWith('file://') ? uri.slice(7) : uri;
}

async function fileExists(uri: string): Promise<boolean> {
  try {
    return await ReactNativeBlobUtil.fs.exists(stripFilePrefix(normalizeFileUri(uri)));
  } catch {
    return false;
  }
}

async function copyUriToCache(uri: string, base64?: string): Promise<string> {
  const dest = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/wm_src_${Date.now()}.jpg`;

  if (base64?.trim()) {
    const cleaned = base64.replace(/^data:image\/\w+;base64,/, '').trim();
    if (cleaned) {
      await ReactNativeBlobUtil.fs.writeFile(dest, cleaned, 'base64');
      if (await ReactNativeBlobUtil.fs.exists(dest)) {
        return normalizeFileUri(dest);
      }
    }
  }

  const normalized = normalizeFileUri(uri.trim());
  if (!normalized) {
    throw new Error('Could not read selfie image');
  }

  const tryCopyContentUri = async (contentUri: string): Promise<string | null> => {
    try {
      await ReactNativeBlobUtil.fs.cp(contentUri, dest);
      if (await ReactNativeBlobUtil.fs.exists(dest)) {
        return normalizeFileUri(dest);
      }
    } catch {
      // try next method
    }

    try {
      const data = await ReactNativeBlobUtil.fs.readFile(contentUri, 'base64');
      await ReactNativeBlobUtil.fs.writeFile(dest, data, 'base64');
      if (await ReactNativeBlobUtil.fs.exists(dest)) {
        return normalizeFileUri(dest);
      }
    } catch {
      // try next method
    }

    try {
      const response = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: dest,
      }).fetch('GET', contentUri);
      const path = response.path();
      if (path && (await ReactNativeBlobUtil.fs.exists(path))) {
        return normalizeFileUri(path);
      }
    } catch {
      // try next method
    }

    return null;
  };

  if (normalized.startsWith('content://')) {
    const copied = await tryCopyContentUri(normalized);
    if (copied) return copied;
    throw new Error('Could not read selfie image');
  }

  const sourcePath = stripFilePrefix(normalized);
  if (sourcePath && (await ReactNativeBlobUtil.fs.exists(sourcePath))) {
    if (sourcePath !== dest) {
      await ReactNativeBlobUtil.fs.cp(sourcePath, dest);
    }
    return normalizeFileUri(dest);
  }

  throw new Error('Could not read selfie image');
}

async function ensureLogoCacheFile(): Promise<string | null> {
  if (cachedLogoUri && (await fileExists(cachedLogoUri))) {
    return cachedLogoUri;
  }

  const dest = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/opg_logo_watermark.png`;
  const resolved = Image.resolveAssetSource(appLogo);
  if (!resolved?.uri) {
    return null;
  }

  try {
    const { uri } = resolved;

    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      await ReactNativeBlobUtil.config({ path: dest, fileCache: true }).fetch(
        'GET',
        uri,
      );
    } else if (uri.startsWith('file://')) {
      const sourcePath = stripFilePrefix(uri);
      if (await ReactNativeBlobUtil.fs.exists(sourcePath)) {
        await ReactNativeBlobUtil.fs.cp(sourcePath, dest);
      } else {
        await ReactNativeBlobUtil.config({ path: dest, fileCache: true }).fetch(
          'GET',
          uri,
        );
      }
    } else {
      await ReactNativeBlobUtil.config({ path: dest, fileCache: true }).fetch(
        'GET',
        uri,
      );
    }

    if (!(await ReactNativeBlobUtil.fs.exists(dest)) && Platform.OS === 'android') {
      const assetPath = ReactNativeBlobUtil.fs.asset('opg-logo.png');
      const base64 = await ReactNativeBlobUtil.fs.readFile(assetPath, 'base64');
      await ReactNativeBlobUtil.fs.writeFile(dest, base64, 'base64');
    }

    if (!(await ReactNativeBlobUtil.fs.exists(dest))) {
      return null;
    }

    cachedLogoUri = normalizeFileUri(dest);
    return cachedLogoUri;
  } catch {
    return null;
  }
}

async function applyLogoWatermark(
  sourceUri: string,
  stamp: number,
): Promise<string | null> {
  const logoUri = await ensureLogoCacheFile();
  if (!logoUri) {
    return null;
  }

  const markedLogo = await Marker.markImage({
    backgroundImage: {
      src: sourceUri,
      scale: 1,
    },
    watermarkImages: [
      {
        src: logoUri,
        scale: Platform.OS === 'android' ? 0.15 : 0.2,
        alpha: 0.85,
        position: {
          X: 14,
          Y: 44,
        },
      },
    ],
    quality: MARKER_QUALITY,
    filename: `patrol_logo_${stamp}`,
    saveFormat: ImageFormat.jpg,
    ...ANDROID_MARKER_OPTS,
  });

  const normalized = normalizeFileUri(markedLogo);
  if (!(await fileExists(normalized))) {
    return null;
  }
  return normalized;
}

async function applyTimestampWatermark(
  sourceUri: string,
  timestamp: string,
  stamp: number,
): Promise<string> {
  const output = await Marker.markText({
    backgroundImage: {
      src: sourceUri,
      scale: 1,
    },
    watermarkTexts: [
      {
        text: timestamp,
        position: {
          X: 14,
          Y: 14,
        },
        style: {
          color: '#FFFFFF',
          fontSize: 11,
          bold: true,
          textAlign: 'right',
          skewX: 0,
          textBackgroundStyle: {
            type: TextBackgroundType.stretchX,
            color: '#80000000',
            paddingX: 10,
            paddingY: 6,
          },
        },
      },
    ],
    quality: MARKER_QUALITY,
    filename: `patrol_wm_${stamp}`,
    saveFormat: ImageFormat.jpg,
    ...ANDROID_MARKER_OPTS,
  });

  const normalized = normalizeFileUri(output);
  if (!(await fileExists(normalized))) {
    throw new Error('Watermarked image was not saved');
  }
  return normalized;
}

export async function resolveWatermarkSourceUri(
  job: SelfieWatermarkJob,
): Promise<string> {
  if (job.base64?.trim()) {
    const cleaned = job.base64.replace(/^data:image\/\w+;base64,/, '').trim();
    if (cleaned) {
      return `data:image/jpeg;base64,${cleaned}`;
    }
  }

  const normalized = normalizeFileUri(job.sourceUri.trim());
  if (!normalized) {
    throw new Error('Could not read selfie image');
  }

  if (
    Platform.OS === 'ios' &&
    (normalized.startsWith('file://') || normalized.startsWith('data:'))
  ) {
    if (await fileExists(normalized)) {
      return normalized;
    }
  }

  return copyUriToCache(normalized, job.base64);
}

export async function applySelfieWatermark(
  job: SelfieWatermarkJob,
): Promise<string> {
  if (Platform.OS === 'ios') {
    throw new Error('iOS watermark is handled by SelfieWatermarkProcessor');
  }

  const source = await copyUriToCache(job.sourceUri, job.base64);
  const stamp = Date.now();

  let current = source;

  try {
    const withLogo = await applyLogoWatermark(source, stamp);
    if (withLogo) {
      current = withLogo;
    }
  } catch {
    current = source;
  }

  return applyTimestampWatermark(current, job.timestamp, stamp);
}
