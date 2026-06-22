import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import {
  applySelfieWatermark,
  resolveWatermarkSourceUri,
  type SelfieWatermarkJob,
} from '../services/applySelfieWatermark';
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

function waitForNextFrame(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function IOSNativeWatermark({
  job,
  onComplete,
  onError,
}: {
  job: SelfieWatermarkJob;
  onComplete: (uri: string) => void;
  onError: (error: Error) => void;
}) {
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const uri = await applySelfieWatermark(job);
        if (cancelled) {
          return;
        }
        onCompleteRef.current(normalizeCaptureUri(uri));
      } catch (error) {
        if (!cancelled) {
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
  }, [job]);

  return null;
}

function AndroidWatermarkCanvas({
  job,
  onComplete,
  onError,
}: {
  job: SelfieWatermarkJob;
  onComplete: (uri: string) => void;
  onError: (error: Error) => void;
}) {
  const viewRef = useRef<ViewShot>(null);
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
        const uri = await resolveWatermarkSourceUri(job);
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

    const runMarkerFallback = async (): Promise<boolean> => {
      try {
        const uri = await applySelfieWatermark(job);
        if (cancelled || capturedRef.current) {
          return true;
        }
        capturedRef.current = true;
        onCompleteRef.current(normalizeCaptureUri(uri));
        return true;
      } catch {
        return false;
      }
    };

    (async () => {
      await waitForNextFrame();
      await new Promise<void>(resolve => {
        setTimeout(resolve, 450);
      });

      if (cancelled || capturedRef.current) {
        return;
      }

      try {
        const uri = await viewRef.current?.capture?.();
        if (cancelled || capturedRef.current) {
          return;
        }
        if (uri) {
          capturedRef.current = true;
          onCompleteRef.current(normalizeCaptureUri(uri));
          return;
        }
      } catch {
        // fall through to marker fallback
      }

      const recovered = await runMarkerFallback();
      if (!cancelled && !capturedRef.current && !recovered) {
        onErrorRef.current(new Error('Could not apply watermark to selfie'));
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

  if (!sourceUri) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.offscreen, { height: captureHeight }]}
      collapsable={false}
    >
      <ViewShot
        ref={viewRef}
        options={{ format: 'jpg', quality: 0.92, result: 'tmpfile' }}
        style={canvasStyle}
      >
        <Image
          source={{ uri: sourceUri }}
          style={canvasStyle}
          resizeMode="cover"
          onLoad={() => setImageReady(true)}
          onError={async () => {
            try {
              const uri = await applySelfieWatermark(job);
              if (!capturedRef.current) {
                capturedRef.current = true;
                onCompleteRef.current(normalizeCaptureUri(uri));
              }
            } catch {
              onErrorRef.current(new Error('Could not read selfie image'));
            }
          }}
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

  if (Platform.OS === 'ios') {
    return (
      <IOSNativeWatermark
        job={job}
        onComplete={uri => onCompleteRef.current(uri)}
        onError={error => onErrorRef.current(error)}
      />
    );
  }

  return (
    <AndroidWatermarkCanvas
      job={job}
      onComplete={uri => onCompleteRef.current(uri)}
      onError={error => onErrorRef.current(error)}
    />
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top: 0,
    left: -10000,
    width: CAPTURE_WIDTH,
    opacity: 1,
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
