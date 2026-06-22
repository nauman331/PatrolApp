import { Platform } from 'react-native';
import FaceDetection from '@react-native-ml-kit/face-detection';
import ReactNativeBlobUtil from 'react-native-blob-util';
import type { Asset } from 'react-native-image-picker';

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

async function writeBase64ToCache(base64: string): Promise<string | null> {
  const dest = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/face_detect_${Date.now()}.jpg`;
  const cleaned = base64.replace(/^data:image\/\w+;base64,/, '').trim();
  if (!cleaned) {
    return null;
  }

  await ReactNativeBlobUtil.fs.writeFile(dest, cleaned, 'base64');
  if (await ReactNativeBlobUtil.fs.exists(dest)) {
    return normalizeFileUri(dest);
  }
  return null;
}

async function resolveDetectableUri(asset: Asset): Promise<string | null> {
  const rawUri = asset.uri?.trim();
  if (!rawUri) return null;

  if (asset.base64?.trim()) {
    const cached = await writeBase64ToCache(asset.base64);
    if (cached) {
      return cached;
    }
  }

  const normalized = normalizeFileUri(rawUri);

  if (normalized.startsWith('content://')) {
    const dest = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/face_detect_${Date.now()}.jpg`;
    try {
      await ReactNativeBlobUtil.fs.cp(normalized, dest);
      if (await ReactNativeBlobUtil.fs.exists(dest)) {
        return normalizeFileUri(dest);
      }
    } catch {
      // fall through
    }
    return null;
  }

  const path = stripFilePrefix(normalized);
  if (path && (await ReactNativeBlobUtil.fs.exists(path))) {
    if (Platform.OS === 'ios') {
      const dest = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/face_detect_${Date.now()}.jpg`;
      await ReactNativeBlobUtil.fs.cp(path, dest);
      if (await ReactNativeBlobUtil.fs.exists(dest)) {
        return normalizeFileUri(dest);
      }
    }
    return normalized;
  }

  return null;
}

export async function detectFaceInSelfie(asset: Asset): Promise<boolean> {
  const imageUri = await resolveDetectableUri(asset);
  if (!imageUri) {
    return false;
  }

  try {
    const faces = await FaceDetection.detect(imageUri, {
      performanceMode: 'accurate',
      minFaceSize: 0.1,
    });
    return Array.isArray(faces) && faces.length > 0;
  } catch {
    return false;
  }
}
