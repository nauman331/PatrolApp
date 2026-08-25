import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Download, Check, AlertCircle, RefreshCw, Eye } from 'lucide-react-native';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import { openPdfFile } from '../services/incidentPdfDownload';

export type DownloadProgressData = {
  received: number;
  total: number;
} | null;

export type DownloadProgressCallback = (progress: DownloadProgressData) => void;

export type DownloadButtonProps = {
  /** The async function that performs the PDF download. Should report progress via callback if available. */
  onDownload: (onProgress: DownloadProgressCallback) => Promise<boolean | string | { success: boolean; filePath?: string } | void>;
  /** Optional callback when user clicks View PDF */
  onView?: (filePath?: string) => void;
  /** Optional custom button label for idle state. Default: "Download PDF" */
  label?: string;
  /** Optional container style override */
  style?: StyleProp<ViewStyle>;
  /** Optional text style override */
  textStyle?: StyleProp<TextStyle>;
  /** Optional variant: 'full' (full-width block) or 'compact' (action button) */
  variant?: 'full' | 'compact';
  /** Optional flag to disable button during external operations */
  disabled?: boolean;
};

export type DownloadState = 'idle' | 'downloading' | 'success' | 'error';

export function DownloadButton({
  onDownload,
  onView,
  label = 'Download PDF',
  style,
  textStyle,
  variant = 'compact',
  disabled = false,
}: DownloadButtonProps) {
  const [downloadState, setDownloadState] = useState<DownloadState>('idle');
  const [progressData, setProgressData] = useState<DownloadProgressData>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedFilePath, setSavedFilePath] = useState<string | null>(null);

  const isMounted = useRef(true);
  const isDownloadingRef = useRef(false);
  const maxPercentageRef = useRef(0);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Continuous animation for indeterminate progress bar shimmer
  useEffect(() => {
    if (downloadState === 'downloading' && (!progressData || progressData.total <= 0)) {
      const loop = Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      );
      loop.start();
      return () => loop.stop();
    } else {
      animValue.setValue(0);
    }
  }, [downloadState, progressData, animValue]);

  const handlePress = useCallback(async () => {
    if (disabled) return;

    if (downloadState === 'success') {
      if (onView) {
        onView(savedFilePath || undefined);
        return;
      }
      if (savedFilePath) {
        await openPdfFile(savedFilePath);
      }
      return;
    }

    if (isDownloadingRef.current || downloadState === 'downloading') return;

    isDownloadingRef.current = true;
    maxPercentageRef.current = 0;

    if (isMounted.current) {
      setDownloadState('downloading');
      setProgressData({ received: 0, total: 100 });
      setErrorMessage(null);
    }

    try {
      const onProgress: DownloadProgressCallback = (pData) => {
        if (!isMounted.current) return;
        if (!pData || typeof pData.total !== 'number' || pData.total <= 0) return;
        const rawPct = Math.round((pData.received / pData.total) * 100);
        const clampedPct = Math.min(100, Math.max(0, rawPct));
        if (clampedPct >= maxPercentageRef.current) {
          maxPercentageRef.current = clampedPct;
          setProgressData({ received: clampedPct, total: 100 });
        }
      };

      const result = await onDownload(onProgress);

      if (!isMounted.current) return;

      if (result === false) {
        setDownloadState('error');
        setErrorMessage('Download failed. Please try again.');
      } else {
        let path: string | null = null;
        if (typeof result === 'string') {
          path = result;
        } else if (result && typeof result === 'object' && 'filePath' in (result as any) && typeof (result as any).filePath === 'string') {
          path = (result as any).filePath;
        }
        setSavedFilePath(path);
        maxPercentageRef.current = 100;
        setProgressData({ received: 100, total: 100 });
        setDownloadState('success');
      }
    } catch (err: any) {
      if (!isMounted.current) return;
      setDownloadState('error');
      setErrorMessage(err?.message || 'Download failed. Please try again.');
    } finally {
      isDownloadingRef.current = false;
    }
  }, [disabled, downloadState, onDownload, onView, savedFilePath]);

  // Calculate percentage if available
  const hasRealProgress =
    progressData !== null &&
    typeof progressData.total === 'number' &&
    progressData.total > 0 &&
    typeof progressData.received === 'number';

  const percentage = hasRealProgress
    ? Math.min(100, Math.max(0, Math.round((progressData.received / progressData.total) * 100)))
    : null;

  const isDownloading = downloadState === 'downloading';
  const isFull = variant === 'full';

  // Render content based on state
  return (
    <View style={[styles.wrapper, isFull && styles.wrapperFull, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          isFull && styles.buttonFull,
          isDownloading && styles.buttonDownloading,
          downloadState === 'success' && styles.buttonSuccess,
          downloadState === 'error' && styles.buttonError,
          disabled && { opacity: 0.6 },
          downloadState !== 'success' && Shadows.card,
        ]}
        onPress={handlePress}
        disabled={disabled || isDownloading}
        activeOpacity={0.8}
      >
        {downloadState === 'idle' && (
          <View style={styles.row}>
            <Download size={isFull ? 16 : 14} color={Colors.accent} />
            <Text style={[styles.text, textStyle]} numberOfLines={1}>{label}</Text>
          </View>
        )}

        {downloadState === 'downloading' && (
          <View style={styles.downloadingContainer}>
            <View style={styles.row}>
              <ActivityIndicator size="small" color={Colors.accent} />
              <Text style={[styles.textDownloading, textStyle]} numberOfLines={1}>
                {percentage !== null ? `Downloading... ${percentage}%` : 'Downloading...'}
              </Text>
            </View>

            {/* Progress Bar Container */}
            <View style={styles.progressBarTrack}>
              {percentage !== null ? (
                /* Real Progress Bar */
                <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
              ) : (
                /* Indeterminate Progress Shimmer */
                <Animated.View
                  style={[
                    styles.progressBarIndeterminate,
                    {
                      left: animValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-40%', '100%'],
                      }),
                    },
                  ]}
                />
              )}
            </View>
          </View>
        )}

        {downloadState === 'success' && (
          <View style={styles.row}>
            {/* <Check size={isFull ? 16 : 14} color={Colors.success} /> */}
            <Text style={[styles.textSuccess, textStyle]} numberOfLines={1}>Downloaded</Text>
            <View style={styles.divider} />
            {/* <Eye size={isFull ? 16 : 14} color={Colors.accent} /> */}
            <Text style={[styles.textView, textStyle]} numberOfLines={1}>View PDF</Text>
          </View>
        )}

        {downloadState === 'error' && (
          <View style={styles.row}>
            <RefreshCw size={isFull ? 16 : 14} color={Colors.danger} />
            <Text style={[styles.textError, textStyle]} numberOfLines={1}>Retry Download</Text>
          </View>
        )}
      </TouchableOpacity>

      {downloadState === 'error' && errorMessage && (
        <View style={styles.errorBanner}>
          <AlertCircle size={12} color={Colors.danger} />
          <Text style={styles.errorText} numberOfLines={1}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minWidth: 100,
  },
  wrapperFull: {
    width: '100%',
  },
  button: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgCard,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  buttonFull: {
    width: '100%',
    height: 44,
  },
  buttonDownloading: {
    borderColor: Colors.accentAlpha25,
    backgroundColor: Colors.accentLight,
  },
  buttonSuccess: {
    borderColor: 'rgba(56, 161, 105, 0.4)',
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonError: {
    borderColor: 'rgba(229, 62, 62, 0.4)',
    backgroundColor: 'rgba(229, 62, 62, 0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  textDownloading: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
  },
  textSuccess: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  textView: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
  },
  textError: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.danger,
  },
  downloadingContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  progressBarTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(106, 137, 167, 0.2)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 1.5,
  },
  progressBarIndeterminate: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: Colors.accent,
    borderRadius: 1.5,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 10,
    color: Colors.danger,
    fontWeight: '600',
  },
});
