import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import ReactNativeBlobUtil from 'react-native-blob-util';
import type { SelfieWatermarkJob } from '../services/applySelfieWatermark';
import { Colors } from '../theme';

export type { SelfieWatermarkJob };

const appLogo = require('../../assets/opg-logo.png');
const CAPTURE_WIDTH = 720;

type Props = {
  job: SelfieWatermarkJob | null;
  onComplete: (uri: string) => void;
  onError: (error: Error) => void;
};

function normalizeCaptureUri(uri: string): string {
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

async function resolveSourceUri(job: SelfieWatermarkJob): Promise<string> {
  const dest = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/wm_src_${Date.now()}.jpg`;

  if (job.base64?.trim()) {
    const cleaned = job.base64.replace(/^data:image\/\w+;base64,/, '').trim();
    if (cleaned) {
      await ReactNativeBlobUtil.fs.writeFile(dest, cleaned, 'base64');
      if (await ReactNativeBlobUtil.fs.exists(dest)) {
        return normalizeFileUri(dest);
      }
    }
  }

  const normalized = normalizeFileUri(job.sourceUri.trim());
  if (!normalized) {
    throw new Error('Could not read selfie image');
  }

  if (normalized.startsWith('content://')) {
    try {
      await ReactNativeBlobUtil.fs.cp(normalized, dest);
      if (await ReactNativeBlobUtil.fs.exists(dest)) {
        return normalizeFileUri(dest);
      }
    } catch {
      // try read as base64 below
    }
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

function waitForNextFrame(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function WatermarkCanvas({
  job,
  onComplete,
  onError,
}: {
  job: SelfieWatermarkJob;
  onComplete: (uri: string) => void;
  onError: (error: Error) => void;
}) {
  const viewRef = useRef<React.ElementRef<typeof ViewShot>>(null);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const capturedRef = useRef(false);

  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  const aspectRatio =
    job.width && job.height && job.width > 0 ? job.height / job.width : 4 / 3;
  const captureHeight = Math.round(CAPTURE_WIDTH * aspectRatio);

  useEffect(() => {
    let cancelled = false;
    capturedRef.current = false;
    setSourceUri(null);
    setImageReady(false);

    (async () => {
      try {
        const uri = await resolveSourceUri(job);
        if (!cancelled) {
          setSourceUri(uri);
        }
      } catch (error) {
        if (!cancelled) {
          onErrorRef.current(
            error instanceof Error
              ? error
              : new Error('Could not read selfie image'),
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [job]);

  useEffect(() => {
    if (!sourceUri || !imageReady || capturedRef.current) {
      return;
    }

    let cancelled = false;

    (async () => {
      await waitForNextFrame();
      await new Promise<void>(resolve => {
        setTimeout(resolve, Platform.OS === 'ios' ? 300 : 450);
      });

      if (cancelled || capturedRef.current) {
        return;
      }

      try {
        const uri = await viewRef.current?.capture?.();
        if (cancelled || capturedRef.current) {
          return;
        }
        if (!uri) {
          onErrorRef.current(new Error('Could not apply watermark to selfie'));
          return;
        }
        capturedRef.current = true;
        onCompleteRef.current(normalizeCaptureUri(uri));
      } catch (error) {
        if (!cancelled && !capturedRef.current) {
          onErrorRef.current(
            error instanceof Error
              ? error
              : new Error('Could not apply watermark to selfie'),
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sourceUri, imageReady, job]);

  const canvasStyle = useMemo(
    () => ({ width: CAPTURE_WIDTH, height: captureHeight }),
    [captureHeight],
  );

  const viewShotOptions = useMemo(
    () => ({
      format: 'jpg' as const,
      quality: 0.92,
      result: 'tmpfile' as const,
      ...(Platform.OS === 'ios' ? { useRenderInContext: true } : {}),
    }),
    [],
  );

  if (!sourceUri) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.captureHost, { height: captureHeight }]}
      collapsable={false}
    >
      <ViewShot ref={viewRef} options={viewShotOptions} style={canvasStyle}>
        <Image
          source={{ uri: sourceUri }}
          style={canvasStyle}
          resizeMode="cover"
          onLoad={() => setImageReady(true)}
          onError={() =>
            onErrorRef.current(new Error('Could not read selfie image'))
          }
        />
        <Image source={appLogo} style={styles.logo} resizeMode="contain" />
        <View style={styles.timestampWrap}>
          <Text style={styles.timestampText}>{job.timestamp}</Text>
        </View>
      </ViewShot>
    </View>
  );
}

export function SelfieWatermarkProcessor({ job, onComplete, onError }: Props) {
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  if (!job?.sourceUri) {
    return null;
  }

  return (
    <WatermarkCanvas
      job={job}
      onComplete={uri => onCompleteRef.current(uri)}
      onError={error => onErrorRef.current(error)}
    />
  );
}

const styles = StyleSheet.create({
  captureHost: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CAPTURE_WIDTH,
    opacity: 0.01,
    zIndex: -1,
  },
  logo: {
    position: 'absolute',
    right: 14,
    bottom: 44,
    width: 72,
    height: 48,
    opacity: 0.85,
  },
  timestampWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    paddingHorizontal: 14,
    alignItems: 'flex-end',
  },
  timestampText: {
    color: Colors.danger,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
