import React, { useEffect, useRef } from 'react';
import {
  applySelfieWatermark,
  type SelfieWatermarkJob,
} from '../services/applySelfieWatermark';

export type { SelfieWatermarkJob };

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

function NativeWatermark({
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

export function SelfieWatermarkProcessor({ job, onComplete, onError }: Props) {
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  if (!job?.sourceUri) {
    return null;
  }

  return (
    <NativeWatermark
      job={job}
      onComplete={uri => onCompleteRef.current(uri)}
      onError={error => onErrorRef.current(error)}
    />
  );
}
