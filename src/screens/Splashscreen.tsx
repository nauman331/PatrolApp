import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import AppLogo from '../components/AppLogo';
import { AUTH_ROUTES } from '../navigation/constants';
import type { AuthStackScreenProps } from '../navigation/types';
import { Colors, Radii, Shadows } from '../theme';
import { API_URL } from '../config/env';

const SPLASH_DURATION_MS = 2000;
const LOGO_FADE_IN_MS = 650;
const EXIT_FADE_MS = 280;
const SPLASH_BACKGROUND = '#16213e';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PROGRESS_BAR_WIDTH = Math.min(SCREEN_WIDTH * 0.58, 240);

type SplashScreenProps = Partial<AuthStackScreenProps<'Splash'>> & {
  onFinish?: () => void;
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const navigation = useNavigation<any>();
  const [isChecking, setIsChecking] = useState(false);
  const [showError, setShowError] = useState(false);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const startExitAnimation = useCallback(() => {
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: EXIT_FADE_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished: exitFinished }) => {
      if (exitFinished) {
        if (onFinish) {
          onFinish();
        } else {
          try {
            navigation.replace(AUTH_ROUTES.ONBOARDING);
          } catch {
            // ignore if used outside of auth stack
          }
        }
      }
    });
  }, [navigation, onFinish, screenOpacity]);

  const checkConnectivity = useCallback(async () => {
    setIsChecking(true);
    setShowError(false);

    const testConnection = async (url: string, timeout: number) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        // We just care if the request doesn't throw a network error.
        // Even a 404/500 means there is a connection to a server.
        await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' },
        });
        clearTimeout(timeoutId);
        return true;
      } catch (e) {
        return false;
      }
    };

    try {
      // 1. First attempt: Check your API
      const isApiReachable = await testConnection(API_URL, 8000);
      if (isApiReachable) {
        setIsChecking(false);
        startExitAnimation();
        return;
      }

      // 2. Second attempt: Check general internet (fallback)
      // This helps if the API is down or has cleartext issues in dev, but internet is fine.
      const isInternetAvailable = await testConnection('https://www.google.com', 5000);
      if (isInternetAvailable) {
        setIsChecking(false);
        startExitAnimation();
        return;
      }

      // Both failed
      setIsChecking(false);
      setShowError(true);
    } catch (error) {
      setIsChecking(false);
      setShowError(true);
    }
  }, [startExitAnimation]);

  useEffect(() => {
    const logoEntrance = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: LOGO_FADE_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: LOGO_FADE_IN_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const progressFill = Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    logoEntrance.start();
    progressFill.start(({ finished }) => {
      if (!finished) {
        return;
      }
      checkConnectivity();
    });

    return () => {
      logoOpacity.stopAnimation();
      logoScale.stopAnimation();
      progress.stopAnimation();
      screenOpacity.stopAnimation();
    };
  }, [
    checkConnectivity,
    logoOpacity,
    logoScale,
    navigation,
    onFinish,
    progress,
    screenOpacity,
  ]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PROGRESS_BAR_WIDTH],
  });

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={SPLASH_BACKGROUND}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoWrap,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <AppLogo variant="splash" centered={false} />
          </Animated.View>

          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressFill, { width: progressWidth }]}
              />
            </View>
//
          </View>
        </View>
      </SafeAreaView>

      <Modal transparent visible={showError} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconCircle}>
              <WifiOff size={28} color={Colors.accent} />
            </View>
            <Text style={styles.modalTitle}>Connection Error</Text>
            <Text style={styles.modalMessage}>
              This application requires an active internet connection to work.
              Please check your network and try again.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={checkConnectivity}
              activeOpacity={0.8}
            >
              {isChecking ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <RefreshCw size={18} color={Colors.white} />
                  <Text style={styles.retryText}>RETRY</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
  },
  safe: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoWrap: {
    alignItems: 'center',
  },
  progressWrap: {
    marginTop: 28,
    width: PROGRESS_BAR_WIDTH,
    alignItems: 'center',
  },
  progressTrack: {
    width: PROGRESS_BAR_WIDTH,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.accent,
  },
  checkingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: Radii.lg,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    ...Shadows.card,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accentAlpha12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: Radii.md,
    width: '100%',
  },
  retryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
