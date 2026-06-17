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
import AppLogo from '../components/AppLogo';
import AuthKeyboardScroll, {
  AuthKeyboardScrollHandle,
} from '../components/AuthKeyboardScroll';
import { Mail, Shield, User, KeyRound, Eye, EyeOff, Lock } from 'lucide-react-native';
import { sendGuardOtp, verifyGuardOtp } from '../services/guardApi';
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
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null); // TODO: remove — dev-only OTP display
  const [loading, setLoading] = useState(false);
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [showManagerPass, setShowManagerPass] = useState(false);
  const [rememberManager, setRememberManager] = useState(false);
  const keyboardScrollRef = useRef<AuthKeyboardScrollHandle>(null);
  const phoneFieldRef = useRef<View>(null);
  const otpFieldRef = useRef<View>(null);
  const managerEmailFieldRef = useRef<View>(null);
  const managerPasswordFieldRef = useRef<View>(null);

  const scrollToField = (fieldRef: React.RefObject<View | null>) => {
    keyboardScrollRef.current?.scrollToField(fieldRef);
  };

  const resetManagerForm = () => {
    setManagerEmail('');
    setManagerPassword('');
    setShowManagerPass(false);
  };

  const resetOtpFlow = () => {
    setOtpSent(false);
    setOtp('');
    setDevOtp(null);
  };

  const resetFormsForRole = (nextRole: 'guard' | 'manager') => {
    if (nextRole === 'guard') {
      resetManagerForm();
    } else {
      resetOtpFlow();
      setPhone('');
    }
  };

  const handleGuardSubmit = async () => {
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    if (!otpSent) {
      try {
        setLoading(true);
        const res = await sendGuardOtp(normalizedPhone);
        if (res.success) {
          setOtpSent(true);
          if (res.otp != null) {
            setDevOtp(String(res.otp));
          }
          Alert.alert('OTP Sent', res.message || 'Enter the OTP sent to your phone.');
        } else {
          Alert.alert('Error', res.message || 'Failed to send OTP');
        }
      } catch {
        Alert.alert('Error', 'Something went wrong');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    try {
      setLoading(true);
      const res = await verifyGuardOtp(normalizedPhone, otp.trim());
      if (res.success) {
        dispatch(
          setAuth({
            role: 'guard',
            token: res.token ?? null,
            guardId: res.guardId ?? null,
          }),
        );
      } else {
        Alert.alert('Error', res.message || 'Invalid OTP');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleManagerSubmit = async () => {
    const email = managerEmail.trim();
    const password = managerPassword.trim();

    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      setLoading(true);
      // TODO: replace with manager login API when available
      dispatch(
        setAuth({
          role: 'manager',
          token: null,
          guardId: null,
        }),
      );
    } catch {
      Alert.alert('Error', 'Something went wrong');
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
            <Text style={styles.headerTitle}>Welcome Back</Text>
            <Text style={styles.headerSub}>
              Sign in to continue your patrol
            </Text>
          </View>

          <View style={styles.body}>
            {/* Role Tabs (keep only Guard active flow, Manager optional) */}
            <View style={styles.roleTabs}>
              <TouchableOpacity
                style={[
                  styles.roleTab,
                  role === 'guard' && styles.roleTabActive,
                ]}
                onPress={() => {
                  setRole('guard');
                  resetFormsForRole('guard');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Shield
                    size={16}
                    color={role === 'guard' ? Colors.white : Colors.textSecondary}
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
                onPress={() => {
                  setRole('manager');
                  resetFormsForRole('manager');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <User
                    size={16}
                    color={role === 'manager' ? Colors.white : Colors.textSecondary}
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

            {/* Only Guard uses OTP login */}
            {role === 'guard' && (
              <>
                <Text style={styles.label}>PHONE NUMBER</Text>

                <View
                  ref={phoneFieldRef}
                  collapsable={false}
                  style={styles.inputWrap}
                >
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={value => {
                      setPhone(value);
                      if (otpSent) resetOtpFlow();
                    }}
                    onFocus={() => scrollToField(phoneFieldRef)}
                    placeholder="923350964001"
                    placeholderTextColor="#888"
                    keyboardType="phone-pad"
                    editable={!loading}
                    underlineColorAndroid="transparent"
                  />
                  <Mail size={18} color={Colors.textSecondary} />
                </View>

                {otpSent && (
                  <>
                    {devOtp != null && (
                      <Text style={styles.devOtpBanner}>
                        OTP: {devOtp}
                      </Text>
                    )}
                    <Text style={styles.label}>ENTER OTP</Text>
                    <View
                      ref={otpFieldRef}
                      collapsable={false}
                      style={styles.inputWrap}
                    >
                      <TextInput
                        style={styles.input}
                        value={otp}
                        onChangeText={setOtp}
                        onFocus={() => scrollToField(otpFieldRef)}
                        placeholder="123456"
                        placeholderTextColor="#888"
                        keyboardType="number-pad"
                        maxLength={6}
                        editable={!loading}
                        underlineColorAndroid="transparent"
                      />
                      <KeyRound size={18} color={Colors.textSecondary} />
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={handleGuardSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.loginBtnText}>
                    {loading
                      ? otpSent
                        ? 'Verifying...'
                        : 'Sending OTP...'
                      : otpSent
                        ? 'VERIFY'
                        : 'SEND OTP'}
                  </Text>
                </TouchableOpacity>

                {otpSent && (
                  <TouchableOpacity
                    style={styles.resendWrap}
                    onPress={resetOtpFlow}
                    disabled={loading}
                  >
                    <Text style={styles.resendText}>Change phone number</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {role === 'manager' && (
              <>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <View
                  ref={managerEmailFieldRef}
                  collapsable={false}
                  style={styles.inputWrap}
                >
                  <TextInput
                    style={styles.input}
                    value={managerEmail}
                    onChangeText={setManagerEmail}
                    onFocus={() => scrollToField(managerEmailFieldRef)}
                    placeholder="manager@company.com"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    underlineColorAndroid="transparent"
                  />
                  <Mail size={18} color={Colors.textSecondary} />
                </View>

                <Text style={styles.label}>PASSWORD</Text>
                <View
                  ref={managerPasswordFieldRef}
                  collapsable={false}
                  style={styles.inputWrap}
                >
                  <TextInput
                    style={styles.input}
                    value={managerPassword}
                    onChangeText={setManagerPassword}
                    onFocus={() => scrollToField(managerPasswordFieldRef)}
                    placeholder="••••••••"
                    placeholderTextColor="#888"
                    secureTextEntry={!showManagerPass}
                    editable={!loading}
                    underlineColorAndroid="transparent"
                  />
                  <TouchableOpacity
                    onPress={() => setShowManagerPass(!showManagerPass)}
                    disabled={loading}
                  >
                    {showManagerPass ? (
                      <Eye size={18} color={Colors.textSecondary} />
                    ) : (
                      <EyeOff size={18} color={Colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>

                <View style={styles.managerRow}>
                  <TouchableOpacity
                    style={styles.rememberRow}
                    onPress={() => setRememberManager(!rememberManager)}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        rememberManager && styles.checkboxActive,
                      ]}
                    >
                      {rememberManager ? (
                        <Text style={styles.checkmark}>✓</Text>
                      ) : null}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity disabled={loading} activeOpacity={0.8}>
                    <Text style={styles.forgot}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={handleManagerSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <View style={styles.managerBtnInner}>
                    <Lock size={16} color={Colors.white} />
                    <Text style={styles.loginBtnText}>
                      {loading ? 'Signing in...' : 'SIGN IN'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            )}

            {role === 'guard' && (
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
            )}
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
    marginBottom: 4,
  },
  headerSub: { fontSize: 11, color: Colors.textOnDarkMuted },

  body: {
    flexGrow: 1,
    backgroundColor: Colors.bg,
    padding: Spacing.lg,
    paddingTop: 30,
  },

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
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgInput,
    padding: 0,
  },
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
  },

  managerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  managerBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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

  devOtpBanner: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.accent,
    letterSpacing: 4,
    textAlign: 'center',
    marginBottom: 8,
  },

  resendWrap: {
    alignItems: 'center',
    marginTop: 14,
  },

  resendText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '600',
  },
});
