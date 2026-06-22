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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import { NavBar } from '../components';
import { ProfileShimmer } from '../components/Shimmer';
import {
  AlertTriangle,
  Home,
  Route,
  User,
  ClipboardList,
  FileText,
  ChevronRight,
  Shield,
  Trash2,
} from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchGuardIncidents, selectIncidents } from '../store/slices/incidentsSlice';
import { logout } from '../services/authApi';
import { useNavigation } from '@react-navigation/native';
import { GUARD_ROUTES, MANAGER_ROUTES, navigateGuardBottomTab, navigateManagerBottomTab } from '../navigation/constants';
import { buildManagerNavItems } from '../screens/manager/managerShared';
import {
  deleteUserAccount,
  fetchUserProfile,
  updateUserProfile,
  type UserProfile,
} from '../services/userApi';
import { formatFullDisplayDate } from '../services/guardJobsMapper';

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
}: ProfileFieldProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      {isEditing && editable && keyName ? (
        <View style={styles.inputBox}>
          <TextInput
            value={form[keyName]}
            onChangeText={text => onChangeField(keyName, text)}
            style={styles.input}
            keyboardType={keyboardType}
            autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          />
        </View>
      ) : (
        <Text style={styles.value}>{value || '—'}</Text>
      )}
    </View>
  );
}

export default function ProfileScreen({ onLogout }: Props) {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const userRole = useAppSelector(state => state.auth?.userRole ?? 'guard');
  const guardId = useAppSelector(state => state.auth?.guardId ?? null);
  const incidents = useAppSelector(selectIncidents);

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
              if (onLogout) {
                onLogout();
                return;
              }
              await logout();
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
          if (onLogout) {
            onLogout();
            return;
          }
          await logout();
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
      navigation.navigate(MANAGER_ROUTES.REPORTS);
      return;
    }
    navigation.navigate(GUARD_ROUTES.INCIDENTS);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.hdrRow}>
            <Text style={styles.hdrTitle}>Profile</Text>
            {!loading && !loadError ? (
              <TouchableOpacity
                onPress={handleEditPress}
                disabled={saving || deleting}
              >
                <Text style={styles.editText}>
                  {isEditing ? 'Cancel' : 'Edit'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}
          </View>
          <Text style={styles.hdrSub}>{formatFullDisplayDate()}</Text>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.safeBody} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
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
                <View style={styles.avatarContainer}>
                  <Image
                    source={require('../../assets/dummy.jpg')}
                    style={styles.avatar}
                  />
                </View>

                <View style={styles.card}>
                  {/* <Text style={styles.sectionTitle}>Profile Info</Text> */}

                  <ProfileField
                    label="Full Name"
                    value={form.name}
                    keyName="name"
                    isEditing={isEditing}
                    form={form}
                    onChangeField={handleChangeField}
                  />
                  <ProfileField
                    label="Security License No."
                    value={form.security_license_no}
                    keyName="security_license_no"
                    isEditing={isEditing}
                    form={form}
                    onChangeField={handleChangeField}
                  />

                  <ProfileField
                    label="Email"
                    value={form.email}
                    keyName="email"
                    keyboardType="email-address"
                    isEditing={isEditing}
                    form={form}
                    onChangeField={handleChangeField}
                  />
                  <ProfileField
                    label="Phone"
                    value={form.phone}
                    keyName="phone"
                    keyboardType="phone-pad"
                    isEditing={isEditing}
                    form={form}
                    onChangeField={handleChangeField}
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
                      />

                      <ProfileField
                        label="Role"
                        value={formatUserType(profile?.user_type ?? '')}
                        editable={false}
                        isEditing={isEditing}
                        form={form}
                        onChangeField={handleChangeField}
                      />
                    </>
                  )}
                </View>



                {isEditing && (
                  <View style={styles.saveWrap}>
                    <TouchableOpacity
                      style={[styles.saveBtn, saving && styles.btnDisabled]}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.saveText}>Save Changes</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

              

                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Quick Actions</Text>

                  <TouchableOpacity style={styles.actionRow} onPress={handleViewReports}>
                    <View style={styles.actionLeft}>
                      <View style={styles.box}>
                        <ClipboardList size={18} color={Colors.accent} />
                      </View>
                      <Text style={styles.actionText}>View Reports</Text>
                    </View>
                    <ChevronRight size={18} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => navigateTo(privacyRoute)}
                  >
                    <View style={styles.actionLeft}>
                      <View style={styles.box}>
                        <Shield size={18} color={Colors.accent} />
                      </View>
                      <Text style={styles.actionText}>Privacy Policy</Text>
                    </View>
                    <ChevronRight size={18} color="#999" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionRow, styles.actionRowLast]}
                    onPress={() => navigateTo(termsRoute)}
                  >
                    <View style={styles.actionLeft}>
                      <View style={styles.box}>
                        <FileText size={18} color={Colors.accent} />
                      </View>
                      <Text style={styles.actionText}>Terms & Conditions</Text>
                    </View>
                    <ChevronRight size={18} color="#999" />
                  </TouchableOpacity>
                </View>



                <View style={styles.card}>
                  <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.card}>
                  <TouchableOpacity
                    style={[styles.deleteBtn, deleting && styles.btnDisabled]}
                    onPress={handleDeleteAccount}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <ActivityIndicator color={Colors.danger} size="small" />
                    ) : (
                      <>
                        <Trash2 size={18} color={Colors.danger} />
                        <Text style={styles.deleteText}>Delete Account</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        <NavBar
          variant={userRole === 'manager' ? 'mgr' : 'light'}
          items={
            userRole === 'manager'
              ? buildManagerNavItems(4)
              : [
                  { icon: Home, label: 'Home' },
                  { icon: Route, label: 'Patrol' },
                  { icon: AlertTriangle, label: 'Incidents' },
                  { icon: ClipboardList, label: 'Shifts' },
                  { icon: User, label: 'Profile', active: true },
                ]
          }
          onPress={i => {
            if (userRole === 'manager') {
              navigateManagerBottomTab(navigation, i);
              return;
            }

            navigateGuardBottomTab(navigation, i);
          }}
        />
      </SafeAreaView>
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
    paddingTop: 8,
    paddingBottom: 22,
  },
  hdrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  hdrTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  hdrSub: { fontSize: FontSizes.xs, color: 'rgba(255,255,255,0.35)' },
  editText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#f5c2d0',
  },
  headerSpacer: { width: 40 },

  keyboardAvoid: { flex: 1 },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 36,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  box: {
    height: 35,
    width: 35,
    borderRadius: 10,
    padding: 9,
    backgroundColor: Colors.accentAlpha30,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 60,
    borderWidth: 1,
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 0,
    ...Shadows.card,
  },

  label: {
    fontSize: FontSizes.xs,
    color: '#666',
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#555',
    marginBottom: 12,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.accent,
  },
  statLabel: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
    textAlign: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textPrimary,
  },

  logoutBtn: {
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: Radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dangerLight,
    padding: 16,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  deleteText: {
    color: Colors.danger,
    fontWeight: '700',
    fontSize: 16,
  },
  saveWrap: {
    alignItems: 'flex-end',
    marginBottom: 14,
  },

  saveBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 130,
    alignItems: 'center',
  },

  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
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
    paddingHorizontal: 10,
  },

  input: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    paddingVertical: 6,
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
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FontSizes.md,
  },
});
