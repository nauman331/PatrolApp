import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import { ProfileShimmer } from '../components/Shimmer';
import {
  ClipboardList,
  FileText,
  ChevronRight,
  Shield,
  Trash2,
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchGuardIncidents } from '../store/slices/incidentsSlice';
import { logout } from '../services/authApi';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaTopInset } from '../navigation/utils';
import { GUARD_ROUTES, MANAGER_ROUTES, navigateGuardBottomTab, navigateManagerBottomTab } from '../navigation/constants';
import {
  deleteUserAccount,
  fetchUserProfile,
  updateUserProfile,
  type UserProfile,
} from '../services/userApi';

interface Props {
  onLogout?: () => void;
}

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  security_license_no: string;
};

function formatMemberSince(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatUserType(userType: string): string {
  if (!userType) return '—';
  return userType.charAt(0).toUpperCase() + userType.slice(1);
}

function profileToForm(profile: UserProfile): ProfileForm {
  return {
    name: profile.name ?? '',
    email: profile.email ?? '',
    phone: profile.phone ?? '',
    security_license_no: profile.security_license_no ?? '',
  };
}

type ProfileFieldProps = {
  label: string;
  value: string;
  isEditing: boolean;
  editable?: boolean;
  keyName?: keyof ProfileForm;
  form: ProfileForm;
  onChangeField: (key: keyof ProfileForm, text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  isSmallScreen?: boolean;
};

function ProfileField({
  label,
  value,
  isEditing,
  editable = true,
  keyName,
  form,
  onChangeField,
  keyboardType = 'default',
  isSmallScreen = false,
}: ProfileFieldProps) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.label, isSmallScreen && styles.labelSmall]}>{label}</Text>
      {isEditing && editable && keyName ? (
        <View style={styles.inputBox}>
          <TextInput
            value={form[keyName]}
            onChangeText={text => onChangeField(keyName, text)}
            style={[styles.input, isSmallScreen && styles.inputSmall]}
            keyboardType={keyboardType}
            autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          />
        </View>
      ) : (
        <Text
          style={[styles.value, isSmallScreen && styles.valueSmall]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {value || '—'}
        </Text>
      )}
    </View>
  );
}

export default function ProfileScreen({ onLogout }: Props) {
  const navigation = useNavigation<any>();
  const topInset = useSafeAreaTopInset();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const dispatch = useAppDispatch();
  const userRole = useAppSelector(state => state.auth?.userRole ?? 'guard');
  const guardId = useAppSelector(state => state.auth?.guardId ?? null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    email: '',
    phone: '',
    security_license_no: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Responsive calculations
  const isSmallScreen = windowWidth < 360;

  // Avatar sizing: scales fluidly between 84px and 110px based on screen width
  const avatarSize = Math.min(Math.max(windowWidth * 0.26, 84), 110);

  // Content bottom padding accounting for safe bottom inset
  const bottomContentPadding = Math.max(insets.bottom + 24, 36);

  const loadProfile = useCallback(async () => {
    if (!guardId) {
      setLoadError('User ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    const result = await fetchUserProfile(guardId);
    if (result.success && result.data) {
      setProfile(result.data);
      setForm(profileToForm(result.data));
    } else {
      setLoadError(result.message ?? 'Failed to load profile');
    }

    setLoading(false);
  }, [guardId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (userRole === 'guard') {
      dispatch(fetchGuardIncidents());
    }
  }, [dispatch, userRole]);

  const handleChangeField = useCallback((key: keyof ProfileForm, text: string) => {
    setForm(prev => ({ ...prev, [key]: text }));
  }, []);

  const hasFormChanges = profile
    ? form.name !== profile.name ||
    form.email !== profile.email ||
    form.phone !== profile.phone ||
    form.security_license_no !== profile.security_license_no
    : false;

  const exitEditMode = () => {
    if (profile) {
      setForm(profileToForm(profile));
    }
    setIsEditing(false);
  };

  const handleEditPress = () => {
    if (isEditing) {
      if (hasFormChanges) {
        Alert.alert(
          'Discard Changes',
          'You have unsaved changes. Discard them?',
          [
            { text: 'Keep Editing', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: exitEditMode },
          ],
        );
      } else {
        exitEditMode();
      }
      return;
    }

    Alert.alert('Edit Profile', 'Do you want to edit your profile information?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit', onPress: () => setIsEditing(true) },
    ]);
  };

  const handleSave = () => {
    if (!profile || !guardId) return;

    Alert.alert('Save Changes', 'Are you sure you want to save your profile changes?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save',
        onPress: async () => {
          setSaving(true);
          const result = await updateUserProfile(guardId, {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            security_license_no: form.security_license_no.trim(),
            status: profile.status,
          });
          setSaving(false);

          if (result.success && result.data) {
            setProfile(result.data);
            setForm(profileToForm(result.data));
            setIsEditing(false);
            Alert.alert('Success', result.message ?? 'Profile updated successfully');
          } else {
            Alert.alert('Error', result.message ?? 'Failed to update profile');
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (!guardId) return;

    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const result = await deleteUserAccount(guardId);
            setDeleting(false);

            if (result.success) {
              await logout();
              if (onLogout) {
                onLogout();
              }
            } else {
              Alert.alert('Error', result.message ?? 'Failed to delete account');
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          if (onLogout) {
            onLogout();
          }
        },
      },
    ]);
  };

  const navigateTo = (screen: string) => {
    navigation.navigate(screen);
  };

  const privacyRoute =
    userRole === 'manager'
      ? MANAGER_ROUTES.PRIVACY_POLICY
      : GUARD_ROUTES.PRIVACY_POLICY;
  const termsRoute =
    userRole === 'manager'
      ? MANAGER_ROUTES.TERMS_CONDITIONS
      : GUARD_ROUTES.TERMS_CONDITIONS;

  const handleViewReports = () => {
    if (userRole === 'manager') {
      navigateManagerBottomTab(navigation, 2);
      return;
    }
    navigateGuardBottomTab(navigation, 2);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />

      {/* Header Container */}
      <View style={[styles.safeTop, { paddingTop: topInset }]}>
        <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
          <View style={styles.hdrRow}>
            <Text style={[styles.hdrTitle, isSmallScreen && styles.hdrTitleSmall]}>Profile</Text>
            {!loading && !loadError ? (
              <TouchableOpacity
                onPress={handleEditPress}
                disabled={saving || deleting}
                style={styles.editBtnTouch}
                activeOpacity={0.7}
              >
                <Text style={styles.editText}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
        </View>
      </View>

      {/* Main Content Body */}
      <View style={styles.safeBody}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            style={styles.body}
            contentContainerStyle={[
              styles.bodyContent,
              {
                paddingHorizontal: isSmallScreen ? 12 : 16,
                paddingBottom: bottomContentPadding,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <ProfileShimmer />
            ) : loadError ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{loadError}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Avatar Section */}
                <View style={styles.avatarContainer}>
                  <Image
                    source={require('../../assets/dummy.jpg')}
                    style={[
                      styles.avatar,
                      {
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius: Radii.pill,
                      },
                    ]}
                    resizeMode="cover"
                  />
                </View>

                {/* Profile Form / Info Card */}
                <View style={[styles.card, isSmallScreen && styles.cardSmall]}>
                  <ProfileField
                    label="Full Name"
                    value={form.name}
                    keyName="name"
                    isEditing={isEditing}
                    form={form}
                    onChangeField={handleChangeField}
                    isSmallScreen={isSmallScreen}
                  />
                  <ProfileField
                    label="Security License No."
                    value={form.security_license_no}
                    keyName="security_license_no"
                    isEditing={isEditing}
                    form={form}
                    onChangeField={handleChangeField}
                    isSmallScreen={isSmallScreen}
                  />

                  <ProfileField
                    label="Email"
                    value={form.email}
                    keyName="email"
                    keyboardType="email-address"
                    isEditing={isEditing}
                    form={form}
                    onChangeField={handleChangeField}
                    isSmallScreen={isSmallScreen}
                  />
                  <ProfileField
                    label="Phone"
                    value={form.phone}
                    keyName="phone"
                    keyboardType="phone-pad"
                    isEditing={isEditing}
                    form={form}
                    onChangeField={handleChangeField}
                    isSmallScreen={isSmallScreen}
                  />

                  {!isEditing && (
                    <>
                      <ProfileField
                        label="Member Since"
                        value={formatMemberSince(profile?.created_at ?? '')}
                        editable={false}
                        isEditing={isEditing}
                        form={form}
                        onChangeField={handleChangeField}
                        isSmallScreen={isSmallScreen}
                      />

                      <ProfileField
                        label="Role"
                        value={formatUserType(profile?.user_type ?? '')}
                        editable={false}
                        isEditing={isEditing}
                        form={form}
                        onChangeField={handleChangeField}
                        isSmallScreen={isSmallScreen}
                      />
                    </>
                  )}
                </View>

                {/* Save Changes Button */}
                {isEditing && (
                  <View style={styles.saveWrap}>
                    <TouchableOpacity
                      style={[
                        styles.saveBtn,
                        isSmallScreen && styles.saveBtnSmall,
                        saving && styles.btnDisabled,
                      ]}
                      onPress={handleSave}
                      disabled={saving}
                      activeOpacity={0.8}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.saveText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Quick Actions Card */}
                <View style={[styles.card, isSmallScreen && styles.cardSmall]}>
                  <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
                    Quick Actions
                  </Text>

                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={handleViewReports}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionLeft}>
                      <View style={styles.box}>
                        <ClipboardList size={18} color={Colors.accent} />
                      </View>
                      <Text style={styles.actionText} numberOfLines={1} ellipsizeMode="tail">
                        View Reports
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => navigateTo(privacyRoute)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionLeft}>
                      <View style={styles.box}>
                        <Shield size={18} color={Colors.accent} />
                      </View>
                      <Text style={styles.actionText} numberOfLines={1} ellipsizeMode="tail">
                        Privacy Policy
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionRow, styles.actionRowLast]}
                    onPress={() => navigateTo(termsRoute)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.actionLeft}>
                      <View style={styles.box}>
                        <FileText size={18} color={Colors.accent} />
                      </View>
                      <Text style={styles.actionText} numberOfLines={1} ellipsizeMode="tail">
                        Terms & Conditions
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#999" />
                  </TouchableOpacity>
                </View>

                {/* Logout Card */}
                <View style={[styles.card, isSmallScreen && styles.cardSmall]}>
                  <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.logoutText, isSmallScreen && styles.btnTextSmall]}>
                      Logout
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Delete Account Card */}
                <View style={[styles.card, isSmallScreen && styles.cardSmall]}>
                  <TouchableOpacity
                    style={[styles.deleteBtn, deleting && styles.btnDisabled]}
                    onPress={handleDeleteAccount}
                    disabled={deleting}
                    activeOpacity={0.8}
                  >
                    {deleting ? (
                      <ActivityIndicator color={Colors.danger} size="small" />
                    ) : (
                      <>
                        <Trash2 size={18} color={Colors.danger} />
                        <Text style={[styles.deleteText, isSmallScreen && styles.btnTextSmall]}>
                          Delete Account
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.headerStart },
  safeTop: { backgroundColor: Colors.headerStart },
  safeBody: { flex: 1, backgroundColor: Colors.bgAlt },

  header: {
    backgroundColor: Colors.headerStart,
    paddingHorizontal: 18,
    paddingTop: 5,
    paddingBottom: 11,
  },
  headerSmall: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 9,
  },
  hdrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  hdrTitle: { fontSize: 18, fontWeight: '800', color: Colors.white },
  hdrTitleSmall: { fontSize: 16 },
  editBtnTouch: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#f5c2d0',
  },
  headerSpacer: { width: 40, height: 40 },

  keyboardAvoid: { flex: 1 },
  body: { flex: 1 },
  bodyContent: {
    paddingTop: 14,
  },

  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  avatar: {
    borderWidth: 1.5,
    borderColor: Colors.border,
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 0,
    ...Shadows.card,
  },
  cardSmall: {
    padding: 12,
    marginBottom: 10,
  },

  fieldWrapper: {
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 10,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  valueSmall: {
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: '#555',
    marginBottom: 10,
  },
  sectionTitleSmall: {
    fontSize: FontSizes.base,
    marginBottom: 8,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  box: {
    height: 36,
    width: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentAlpha12,
    flexShrink: 0,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    flex: 1,
    flexShrink: 1,
  },

  logoutBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    flexShrink: 1,
    textAlign: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  deleteText: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 16,
    flexShrink: 1,
    textAlign: 'center',
  },
  btnTextSmall: {
    fontSize: 14,
  },

  saveWrap: {
    alignItems: 'flex-end',
    marginBottom: 12,
    width: '100%',
  },
  saveBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 130,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnSmall: {
    width: '100%',
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.7,
  },

  inputBox: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginTop: 4,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  inputSmall: {
    fontSize: 13,
  },

  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: Radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fca5a5',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.danger,
    fontWeight: '600',
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radii.md,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSizes.md,
  },
});

