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

export function SelfieWatermarkProcessor({ job, onComplete, onError }: Props) {
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const jobIdRef = useRef(0);

  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!job?.sourceUri) {
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

  return null;
}
