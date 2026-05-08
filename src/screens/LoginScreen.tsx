import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Colors, FontSizes, Radii, Spacing, Shadows } from '../theme';
import { Eye, EyeOff, Mail } from 'lucide-react-native';
import { Shield, User } from 'lucide-react-native';
import { login } from '../services/authApi';
import { useAuthNavigation } from '../navigation/utils';
import { AUTH_ROUTES } from '../navigation/constants';
import type { AuthStackScreenProps } from '../navigation/types';
import { useDispatch } from 'react-redux';
import { setAuth } from '../store/slices/authSlice';

type LoginScreenProps = AuthStackScreenProps<'Login'>;

export default function LoginScreen({ }: LoginScreenProps) {
  const navigation = useAuthNavigation();
  const dispatch = useDispatch();
  const [role, setRole] = useState<'guard' | 'manager'>('guard');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.headerStart}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Shield size={22} color={Colors.accent} />
            </View>
            <Text style={styles.headerTitle}>Welcome Back</Text>
            <Text style={styles.headerSub}>
              Sign in to continue your patrol
            </Text>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Role Tabs */}
            <View style={styles.roleTabs}>
              <TouchableOpacity
                style={[
                  styles.roleTab,
                  role === 'guard' && styles.roleTabActive,
                ]}
                onPress={() => setRole('guard')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Shield
                    size={16}
                    color={
                      role === 'guard' ? Colors.white : Colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.roleTabText,
                      role === 'guard' && styles.roleTabTextActive,
                      { marginLeft: 6 },
                    ]}
                  >
                    Guard
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleTab,
                  role === 'manager' && styles.roleTabActive,
                ]}
                onPress={() => setRole('manager')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <User
                    size={16}
                    color={
                      role === 'manager' ? Colors.white : Colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.roleTabText,
                      role === 'manager' && styles.roleTabTextActive,
                      { marginLeft: 6 },
                    ]}
                  >
                    Manager
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={
                  role === 'guard' ? 'guard@company.com' : 'manager@company.com'
                }
                placeholderTextColor="#888"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Mail size={18} color={Colors.textSecondary} />
            </View>

            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#888"
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                {showPass ? (
                  <Eye size={18} color={Colors.textSecondary} />
                ) : (
                  <EyeOff size={18} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.rememberRow}>
              <TouchableOpacity
                style={[styles.checkbox, remember && styles.checkboxActive]}
                onPress={() => setRemember(!remember)}
              >
                {remember && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>

              <Text style={styles.rememberText}>Remember me</Text>
            </View>
            {/* <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgot}>Forgot Password?</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={async () => {
                if (!email || !password) {
                  Alert.alert('Error', 'Please enter email and password');
                  return;
                }

                try {
                  setLoading(true);

                  console.log('Calling login API with:', email);

                  const res = await login(email, password);

                  console.log('Login response:', res);

                  if (res.success) {
                    dispatch(setAuth({ role, token: null }));
                  } else {
                    Alert.alert('Error', res.message || 'Login failed');
                  }
                } catch (err) {
                  console.error('LOGIN ERROR:', err);
                  Alert.alert('Error', 'Something went wrong');
                } finally {
                  setLoading(false);
                }
              }}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.loginBtnText}>
                {loading ? 'Signing in...' : 'SIGN IN'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signupWrap}
              onPress={() => navigation.navigate(AUTH_ROUTES.SIGNUP)}
              disabled={loading}
            >
              <Text style={styles.signupText}>
                Don’t have an account?{' '}
                <Text style={{ color: Colors.accent }}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
            {/* <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>or continue with</Text>
              <View style={styles.divLine} />
            </View>

            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.socialText}> Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn}>
                <Text style={{ fontSize: 13 }}>🍎</Text>
                <Text style={styles.socialText}> Apple</Text>
              </TouchableOpacity>
            </View> */}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    backgroundColor: Colors.headerStart,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 62,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerIcon: {
    width: 50,
    height: 50,
    backgroundColor: Colors.accentAlpha25,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSub: { fontSize: 11, color: Colors.textOnDarkMuted },

  body: { padding: Spacing.lg, paddingTop: 30 },

  roleTabs: { flexDirection: 'row', gap: 8, marginBottom: 30 },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleTabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  roleTabText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  roleTabTextActive: { color: Colors.white },

  label: {
    fontSize: FontSizes.xs,
    color: '#666',
    letterSpacing: 1.5,
    fontWeight: '700',
    marginBottom: 14,
    textTransform: 'uppercase',
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
  },
  input: { flex: 1, fontSize: 12, color: Colors.textPrimary },
  inputIcon: { fontSize: 13, color: '#888' },

  forgotWrap: { alignItems: 'flex-end', marginBottom: 4 },
  forgot: { fontSize: 11, color: Colors.accent, fontWeight: '600' },

  loginBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  loginBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divText: { fontSize: FontSizes.xs, color: '#aaa' },

  socialRow: { flexDirection: 'row', gap: 8 },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingVertical: 11,
  },
  googleG: { fontSize: 13, fontWeight: '800', color: '#4285f4' },
  socialText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  checkboxActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },

  checkmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
  },

  rememberText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  signupWrap: {
    alignItems: 'center',
    marginTop: 24,
  },

  signupText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
