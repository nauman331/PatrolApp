import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Shield,
  FileText,
  ChevronRight,
  LogOut,
  Mail,
  Phone,
  Building2,
} from 'lucide-react-native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearAuth } from '../../store/slices/authSlice';
import { logout } from '../../services/authApi';
import {
  fetchUserProfile,
  type UserProfile,
} from '../../services/userApi';
import { formatFullDisplayDate } from '../../services/guardJobsMapper';
import { useManagerNavigation } from '../../navigation/utils';
import { MANAGER_ROUTES } from '../../navigation/constants';
import {
  ManagerTabShell,
  ManagerHeader,
  MANAGER_TAB_INDEX,
  sharedStyles,
} from './managerShared';

export default function ManagerProfileScreen() {
  const navigation = useManagerNavigation();
  const dispatch = useAppDispatch();
  const guardId = useAppSelector(state => state.auth?.guardId ?? null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!guardId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await fetchUserProfile(guardId);
    if (result.success && result.data) {
      setProfile(result.data);
    }
    setLoading(false);
  }, [guardId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          dispatch(clearAuth());
        },
      },
    ]);
  };

  const displayName = profile?.name ?? 'Sara Ahmed';
  const displayEmail = profile?.email ?? 'sara.ahmed@patrol.app';
  const displayPhone = profile?.phone ?? '+92 300 9876543';

  return (
    <ManagerTabShell activeIndex={MANAGER_TAB_INDEX.PROFILE}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <ManagerHeader
          title="Profile"
          subtitle={formatFullDisplayDate()}
          showNotif={false}
        />

        <View style={[sharedStyles.body, { marginTop: -30 }]}>
          {loading ? (
            <ActivityIndicator color="#1a56db" style={{ marginTop: 40 }} />
          ) : (
            <>
              <View style={[styles.avatarCard, Shadows.card]}>
                <Image
                  source={require('../../../assets/dummy.jpg')}
                  style={styles.avatar}
                />
                <Text style={styles.name}>{displayName}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>Operations Manager</Text>
                </View>
              </View>

              <View style={[styles.infoCard, Shadows.card]}>
                <View style={styles.infoRow}>
                  <Mail size={16} color="#1a56db" />
                  <Text style={styles.infoText}>{displayEmail}</Text>
                </View>
                <View style={[styles.infoRow, styles.infoRowBorder]}>
                  <Phone size={16} color="#1a56db" />
                  <Text style={styles.infoText}>{displayPhone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Building2 size={16} color="#1a56db" />
                  <Text style={styles.infoText}>3 Sites · Lahore Region</Text>
                </View>
              </View>

              <View style={[styles.menuCard, Shadows.card]}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => navigation.navigate(MANAGER_ROUTES.PRIVACY_POLICY)}
                >
                  <View style={styles.menuLeft}>
                    <Shield size={18} color="#1a56db" />
                    <Text style={styles.menuText}>Privacy Policy</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.menuRow, styles.menuRowLast]}
                  onPress={() => navigation.navigate(MANAGER_ROUTES.TERMS_CONDITIONS)}
                >
                  <View style={styles.menuLeft}>
                    <FileText size={18} color="#1a56db" />
                    <Text style={styles.menuText}>Terms & Conditions</Text>
                  </View>
                  <ChevronRight size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.logoutBtn, Shadows.card]}
                onPress={handleLogout}
              >
                <LogOut size={18} color={Colors.danger} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </ManagerTabShell>
  );
}

const styles = StyleSheet.create({
  avatarCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    marginBottom: 10,
  },
  name: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  roleBadge: {
    marginTop: 8,
    backgroundColor: Colors.infoLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  roleText: { fontSize: FontSizes.xs, fontWeight: '700', color: '#1a56db' },

  infoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 4,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  infoText: { fontSize: 12, color: Colors.textPrimary },

  menuCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 4,
    marginBottom: 12,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuRowLast: { borderBottomWidth: 0 },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuText: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },

  logoutBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.dangerLight,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: Colors.danger },
});
