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

function resolveIosSourceUri(job: SelfieWatermarkJob): string {
  if (job.base64?.trim()) {
    const cleaned = job.base64.replace(/^data:image\/\w+;base64,/, '').trim();
    return `data:image/jpeg;base64,${cleaned}`;
  }
  return job.sourceUri;
}

function IOSWatermarkCanvas({
  job,
  onComplete,
  onError,
}: {
  job: SelfieWatermarkJob;
  onComplete: (uri: string) => void;
  onError: (error: Error) => void;
}) {
  const viewRef = useRef<ViewShot>(null);
  const [imageReady, setImageReady] = useState(false);
  const capturedRef = useRef(false);

  const sourceUri = useMemo(() => resolveIosSourceUri(job), [job]);
  const aspectRatio =
    job.width && job.height && job.width > 0 ? job.height / job.width : 4 / 3;
  const captureHeight = Math.round(CAPTURE_WIDTH * aspectRatio);

  useEffect(() => {
    setImageReady(false);
    capturedRef.current = false;
  }, [job.sourceUri, job.base64, job.timestamp]);

  useEffect(() => {
    if (!imageReady || capturedRef.current) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
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
        onComplete(
          uri.startsWith('file://') || uri.startsWith('content://')
            ? uri
            : uri.startsWith('/')
              ? `file://${uri}`
              : uri,
        );
      } catch (error) {
        if (!cancelled && !capturedRef.current) {
          onError(
            error instanceof Error
              ? error
              : new Error('Could not capture watermarked selfie'),
          );
        }
      }
    }, 120);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [imageReady, onComplete, onError]);

  return (
    <View pointerEvents="none" style={styles.offscreen}>
      <ViewShot
        ref={viewRef}
        options={{ format: 'jpg', quality: 0.92, result: 'tmpfile' }}
        style={{ width: CAPTURE_WIDTH, height: captureHeight }}
      >
        <Image
          source={{ uri: sourceUri }}
          style={{ width: CAPTURE_WIDTH, height: captureHeight }}
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
  const jobIdRef = useRef(0);

  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  useEffect(() => {
    if (Platform.OS === 'ios' || !job?.sourceUri) {
      return;
    }

    const currentJobId = ++jobIdRef.current;
    let cancelled = false;

    (async () => {
      try {
        const uri = await applySelfieWatermark(job);
        if (!cancelled && currentJobId === jobIdRef.current) {
          onCompleteRef.current(uri);
        }
      } catch (error) {
        if (!cancelled && currentJobId === jobIdRef.current) {
          onErrorRef.current(
            error instanceof Error
              ? error
              : new Error('Watermark failed'),
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [job]);

  if (Platform.OS === 'ios' && job?.sourceUri) {
    return (
      <IOSWatermarkCanvas
        job={job}
        onComplete={uri => onCompleteRef.current(uri)}
        onError={error => onErrorRef.current(error)}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top: -10000,
    left: 0,
    opacity: 0,
    width: CAPTURE_WIDTH,
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
