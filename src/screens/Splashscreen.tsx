import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppLogo from '../components/AppLogo';
import { useAuthNavigation } from '../navigation/utils';
import { AUTH_ROUTES } from '../navigation/constants';
import type { AuthStackScreenProps } from '../navigation/types';
import { Colors } from '../theme';

const SPLASH_DURATION_MS = 3000;
const LOGO_FADE_IN_MS = 650;
const EXIT_FADE_MS = 280;
const SPLASH_BACKGROUND = '#16213e';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PROGRESS_BAR_WIDTH = Math.min(SCREEN_WIDTH * 0.58, 240);

type SplashScreenProps = AuthStackScreenProps<'Splash'>;

export default function SplashScreen({}: SplashScreenProps) {
  const navigation = useAuthNavigation();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

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

      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: EXIT_FADE_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished: exitFinished }) => {
        if (exitFinished) {
          navigation.replace(AUTH_ROUTES.ONBOARDING);
        }
      });
    });

    return () => {
      logoOpacity.stopAnimation();
      logoScale.stopAnimation();
      progress.stopAnimation();
      screenOpacity.stopAnimation();
    };
  }, [logoOpacity, logoScale, navigation, progress, screenOpacity]);

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
          </View>
        </View>
      </SafeAreaView>
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
});
