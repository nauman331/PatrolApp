import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radii, Spacing } from '../theme';
import { Eye, EyeOff } from 'lucide-react-native';
import AppLogo from '../components/AppLogo';
import AuthKeyboardScroll, {
  AuthKeyboardScrollHandle,
} from '../components/AuthKeyboardScroll';
import { useAuthNavigation } from '../navigation/utils';
import { AUTH_ROUTES } from '../navigation/constants';
import type { AuthStackScreenProps } from '../navigation/types';

type SignupScreenProps = AuthStackScreenProps<'Signup'>;

export default function SignupScreen({ }: SignupScreenProps) {
  const navigation = useAuthNavigation();
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const keyboardScrollRef = useRef<AuthKeyboardScrollHandle>(null);
  const nameFieldRef = useRef<View>(null);
  const emailFieldRef = useRef<View>(null);
  const passwordFieldRef = useRef<View>(null);
  const confirmPasswordFieldRef = useRef<View>(null);
  const phoneFieldRef = useRef<View>(null);

  const scrollToField = (fieldRef: React.RefObject<View | null>) => {
    keyboardScrollRef.current?.scrollToField(fieldRef);
  };

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSignup = async () => {
    // Validation
    if (!form.name || !form.email || !form.password || !form.confirmPassword || !form.phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      // 👉 API call here
      console.log('Signup Data:', form);

      // 👉 after success, navigate back to login
      Alert.alert('Success', 'Account created successfully. Please log in.', [
        { text: 'OK', onPress: () => navigation.navigate(AUTH_ROUTES.LOGIN) }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Sign up failed. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.headerStart}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <AuthKeyboardScroll ref={keyboardScrollRef} wrapFullScreen={false}>
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <AppLogo variant="splash" centered={false} />
            </View>
            <Text style={styles.headerTitle}>Create Account</Text>
            <Text style={styles.headerSub}>
              Join and start managing patrols
            </Text>
          </View>

          <View style={styles.body}>
            {/* Name */}
            <Text style={styles.label}>FULL NAME</Text>
            <View ref={nameFieldRef} collapsable={false} style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#888"
                value={form.name}
                onChangeText={v => handleChange('name', v)}
                onFocus={() => scrollToField(nameFieldRef)}
                underlineColorAndroid="transparent"
              />
            </View>

            {/* Email */}
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View ref={emailFieldRef} collapsable={false} style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="email@company.com"
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={v => handleChange('email', v)}
                onFocus={() => scrollToField(emailFieldRef)}
                underlineColorAndroid="transparent"
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>PASSWORD</Text>
            <View ref={passwordFieldRef} collapsable={false} style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#888"
                secureTextEntry={!showPass}
                value={form.password}
                onChangeText={v => handleChange('password', v)}
                onFocus={() => scrollToField(passwordFieldRef)}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                {showPass ? (
                  <Eye size={18} color={Colors.textSecondary} />
                ) : (
                  <EyeOff size={18} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text style={styles.label}>CONFIRM PASSWORD</Text>
            <View
              ref={confirmPasswordFieldRef}
              collapsable={false}
              style={styles.inputWrap}
            >
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirmPass}
                value={form.confirmPassword}
                onChangeText={v => handleChange('confirmPassword', v)}
                onFocus={() => scrollToField(confirmPasswordFieldRef)}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPass(!showConfirmPass)}
              >
                {showConfirmPass ? (
                  <Eye size={18} color={Colors.textSecondary} />
                ) : (
                  <EyeOff size={18} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Phone */}
            <Text style={styles.label}>PHONE (optional)</Text>
            <View ref={phoneFieldRef} collapsable={false} style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={v => handleChange('phone', v)}
                onFocus={() => scrollToField(phoneFieldRef)}
                underlineColorAndroid="transparent"
              />
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              style={styles.signupBtn}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.signupBtnText}>
                {loading ? 'Creating...' : 'CREATE ACCOUNT'}
              </Text>
            </TouchableOpacity>

            {/* Navigate to Login */}
            <TouchableOpacity
              style={styles.loginWrap}
              onPress={() => navigation.navigate(AUTH_ROUTES.LOGIN)}
              disabled={loading}
            >
              <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={{ color: Colors.accent }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </AuthKeyboardScroll>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    backgroundColor: Colors.headerStart,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  logoWrap: {
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
  },

  headerSub: {
    fontSize: 12,
    color: Colors.textOnDarkMuted,
    marginTop: 5,
  },

  body: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
    padding: Spacing.lg,
    paddingTop: 30,
  },

  label: {
    fontSize: FontSizes.xs,
    color: '#666',
    marginBottom: 10,
    fontWeight: '700',
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 20,
    overflow: 'hidden',
  },

  input: {
    flex: 1,
    fontSize: 12,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgInput,
    padding: 0,
  },

  signupBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: 15,
    alignItems: 'center',
  },

  signupBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },

  loginWrap: {
    alignItems: 'center',
    marginTop: 20,
  },

  loginText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
