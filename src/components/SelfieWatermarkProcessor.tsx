import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import {
  resolveWatermarkSourceUri,
  type SelfieWatermarkJob,
} from '../services/applySelfieWatermark';

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

function WatermarkCanvas({
  job,
  onComplete,
  onError,
}: {
  job: SelfieWatermarkJob;
  onComplete: (uri: string) => void;
  onError: (error: Error) => void;
}) {
  const viewRef = useRef<ViewShot>(null);
  const [sourceUri, setSourceUri] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const capturedRef = useRef(false);

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
          onError(
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
  }, [job, onError]);

  useEffect(() => {
    if (!sourceUri || !imageReady || capturedRef.current) {
      return;
    }

    let cancelled = false;

    (async () => {
      await waitForNextFrame();
      await new Promise(resolve => setTimeout(resolve, 250));

      if (cancelled || capturedRef.current) {
        return;
      }

      try {
        const uri = await viewRef.current?.capture?.();
        if (cancelled || capturedRef.current) {
          return;
        }
        if (!uri) {
          onError(new Error('Could not capture watermarked selfie'));
          return;
        }
        capturedRef.current = true;
        onComplete(normalizeCaptureUri(uri));
      } catch (error) {
        if (!cancelled && !capturedRef.current) {
          onError(
            error instanceof Error
              ? error
              : new Error('Could not capture watermarked selfie'),
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sourceUri, imageReady, onComplete, onError]);

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
        collapsable={false}
      >
        <Image
          source={{ uri: sourceUri }}
          style={canvasStyle}
          resizeMode="cover"
          onLoad={() => setImageReady(true)}
          onError={() => onError(new Error('Could not read selfie image'))}
        />
        <Image
          source={appLogo}
          style={styles.logo}
          resizeMode="contain"
        />
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
  offscreen: {
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
    color: '#FFFFFF',
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
