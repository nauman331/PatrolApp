import { Alert, Linking, Platform } from 'react-native';
import {
  launchCamera,
  type Asset,
  type CameraOptions,
  type ImagePickerResponse,
} from 'react-native-image-picker';
import { PermissionsAndroid } from 'react-native';
import { detectFaceInSelfie } from './detectSelfieFace';

export const SELFIE_FACE_REQUIRED_MESSAGE = 'Please take your face selfie.';

const SELFIE_CAMERA_OPTIONS: CameraOptions = {
  mediaType: 'photo',
  cameraType: 'front',
  saveToPhotos: false,
  quality: 0.85,
  maxWidth: 1280,
  maxHeight: 1280,
  presentationStyle: 'fullScreen',
  includeBase64: true,
  ...(Platform.OS === 'android' ? { includeExtra: true } : {}),
};

async function requestAndroidCameraPermission(): Promise<boolean> {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function showCameraError(response: ImagePickerResponse): void {
  if (response.didCancel) {
    return;
  }

  const message =
    response.errorMessage?.trim() ||
    (response.errorCode === 'camera_unavailable'
      ? 'Camera is not available on this device.'
      : response.errorCode === 'permission'
        ? 'Camera permission is required to capture a selfie.'
        : 'Could not open camera.');

  Alert.alert('Camera error', message, [
    { text: 'OK', style: 'cancel' },
    ...(response.errorCode === 'permission'
      ? [{ text: 'Open Settings', onPress: () => Linking.openSettings() }]
      : []),
  ]);
}

export async function captureSelfieFromCamera(): Promise<Asset | null> {
  if (Platform.OS === 'android') {
    const allowed = await requestAndroidCameraPermission();
    if (!allowed) {
      Alert.alert(
        'Permission required',
        'Camera permission is needed for selfie.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return null;
    }
  }

  try {
    const result = await launchCamera(SELFIE_CAMERA_OPTIONS);

    if (result.didCancel) {
      return null;
    }

    if (result.errorCode) {
      showCameraError(result);
      return null;
    }

    const asset = result.assets?.[0];
    if (!asset?.uri?.trim()) {
      Alert.alert('Camera error', 'Could not read captured selfie.');
      return null;
    }

    return asset;
  } catch {
    Alert.alert('Camera error', 'Could not open camera. Please try again.');
    return null;
  }
}

export async function captureFaceSelfieFromCamera(): Promise<Asset | null> {
  const asset = await captureSelfieFromCamera();
  if (!asset?.uri?.trim()) {
    return null;
  }

  const hasFace = await detectFaceInSelfie(asset);
  if (!hasFace) {
    Alert.alert('Invalid Selfie', SELFIE_FACE_REQUIRED_MESSAGE);
    return null;
  }

  return asset;
}
