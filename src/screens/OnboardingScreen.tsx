import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Colors, FontSizes, Radii } from '../theme';
import AppLogo from '../components/AppLogo';
import { useAuthNavigation } from '../navigation/utils';
import { AUTH_ROUTES } from '../navigation/constants';
import type { AuthStackScreenProps } from '../navigation/types';

const ONBOARDING_BACKGROUND = '#16213e';

type OnboardingScreenProps = AuthStackScreenProps<'Onboarding'>;

export default function OnboardingScreen({}: OnboardingScreenProps) {
  const navigation = useAuthNavigation();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ONBOARDING_BACKGROUND}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.decorTop} />
        <View style={styles.decorBottom} />

        <View style={styles.content}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SHWANIX TECHNOLOGIES</Text>
          </View>

          <View style={styles.logoWrap}>
            <AppLogo variant="splash" centered={false} />
          </View>

          <Text style={styles.title}>
            Guard &amp;{'\n'}
            <Text style={styles.titleAccent}>Manager</Text> Pro
          </Text>

          <Text style={styles.subtitle}>
            Smart patrol management. Real-time monitoring.{'\n'}
            Complete security control for your sites.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate(AUTH_ROUTES.LOGIN)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>GET STARTED</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate(AUTH_ROUTES.LOGIN)}
            activeOpacity={0.85}
          >
            <Text style={styles.outlineBtnText}>SIGN IN</Text>
          </TouchableOpacity>

          {/* <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View> */}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ONBOARDING_BACKGROUND,
  },
  safe: { flex: 1 },
  decorTop: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(121,31,61,0.08)',
  },
  decorBottom: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(99,179,237,0.06)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  badge: {
    backgroundColor: 'rgba(121,31,61,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(121,31,61,0.3)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 32,
  },
  badgeText: {
    color: Colors.accent,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 2,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 14,
  },
  titleAccent: { color: Colors.accent },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },
  outlineBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radii.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },
  outlineBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    fontSize: 13,
  },
  dots: { flexDirection: 'row', gap: 6, marginTop: 28 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    width: 20,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
});
