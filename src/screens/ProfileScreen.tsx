

import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import { NavBar } from '../components';
import {
  AlertTriangle,
  Home,
  Route,
  User,
  ClipboardList,
  Shield,
  Settings,
  FileText,
  ChevronRight,
} from 'lucide-react-native';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { clearAuth } from '../store/slices/authSlice';
import { logout } from '../services/authApi';
import { useNavigation } from '@react-navigation/native';
import { GUARD_ROUTES, MANAGER_ROUTES } from '../navigation/constants';

interface Props {
  onLogout?: () => void;
  user?: {
    name: string;
    email: string;
    badgeNumber: string;
    role: string;
    joinDate: string;
    totalIncidents: number;
  };
}

export default function ProfileScreen({
  onLogout,
  user,
}: Props) {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const userRole = useSelector((state: any) => state?.auth?.userRole ?? 'guard');

  const currentUser = user || {
    name: 'Alex Rivera',
    email: 'alex.rivera@patrolapp.com',
    badgeNumber: 'P-4782',
    role: 'Senior Security Officer',
    joinDate: 'March 2024',
    totalIncidents: 47,
  };

  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    badgeNumber: currentUser.badgeNumber,
    role: currentUser.role,
    joinDate: currentUser.joinDate,
  });

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
          dispatch(clearAuth());
        },
      },
    ]);
  };

  const Field = ({
    label,
    value,
    keyName,
  }: {
    label: string;
    value: string;
    keyName: keyof typeof form;
  }) => (
    <View>
      <Text style={styles.label}>{label}</Text>

      {isEditing ? (
        <View style={styles.inputBox}>
          <TextInput
            value={form[keyName]}
            onChangeText={text =>
              setForm(prev => ({ ...prev, [keyName]: text }))
            }
            style={styles.input}
          />
        </View>
      ) : (
        <Text style={styles.value}>{value}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Profile</Text>

          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editText}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/dummy.jpg')}
              style={styles.avatar}
            />
          </View>

          {/* PROFILE CARD */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Profile Info</Text>

            <Field label="Full Name" value={form.name} keyName="name" />
            <Field label="Badge Number" value={form.badgeNumber} keyName="badgeNumber" />
            <Field label="Role" value={form.role} keyName="role" />
            <Field label="Email" value={form.email} keyName="email" />
            <Field label="Member Since" value={form.joinDate} keyName="joinDate" />
          </View>


          {/* SAVE BUTTON (BOTTOM RIGHT) */}
          {isEditing && (
            <View style={styles.saveWrap}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.saveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          )}


          {/* STATS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Performance</Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {currentUser.totalIncidents}
                </Text>
                <Text style={styles.statLabel}>Incidents</Text>
              </View>

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>98%</Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
            </View>
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <TouchableOpacity style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <View style={styles.box}>
                  <ClipboardList size={18} color={Colors.accent} />
                </View>
                <Text style={styles.actionText}>View Reports</Text>
              </View>
              <ChevronRight size={18} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <View style={styles.box}>
                  <Shield size={18} color={Colors.accent} />
                </View>
                <Text style={styles.actionText}>Shift History</Text>
              </View>
              <ChevronRight size={18} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <View style={styles.box}>
                  <Settings size={18} color={Colors.accent} />
                </View>
                <Text style={styles.actionText}>Settings</Text>
              </View>
              <ChevronRight size={18} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionRow}>
              <View style={styles.actionLeft}>
                <View style={styles.box}>
                  <FileText size={18} color={Colors.accent} />
                </View>
                <Text style={styles.actionText}>Privacy & Terms</Text>
              </View>
              <ChevronRight size={18} color="#999" />
            </TouchableOpacity>
          </View>


          {/* LOGOUT */}
          <View style={styles.card}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* NAVBAR */}
        <NavBar
          variant="light"
          items={[
            { icon: Home, label: 'Home' },
            { icon: Route, label: 'Patrol' },
            { icon: AlertTriangle, label: 'Incidents' },
            { icon: ClipboardList, label: 'Shifts' },
            { icon: User, label: 'Profile', active: true },
          ]}
          onPress={i => {
            if (userRole === 'manager') {
              const managerScreens = [
                MANAGER_ROUTES.DASHBOARD,
                MANAGER_ROUTES.SHIFT_REPORT,
                MANAGER_ROUTES.SHIFT_REPORT,
                MANAGER_ROUTES.DASHBOARD,
                MANAGER_ROUTES.PROFILE,
              ];
              navigation.navigate(managerScreens[i]);
              return;
            }

            const guardScreens = [
              GUARD_ROUTES.DASHBOARD,
              GUARD_ROUTES.PATROL_TIMELINE,
              GUARD_ROUTES.INCIDENTS,
              GUARD_ROUTES.SHIFTS,
              GUARD_ROUTES.PROFILE,
            ];
            navigation.navigate(guardScreens[i]);
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    paddingBottom: 12,
  },
  back: { fontSize: 24, fontWeight: 'bold' },
  title: {
    fontSize: 18,
    fontWeight: '800',
    // color: Colors.accentAlpha12,
  },
  editText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent,
  },
  box: {
    height: 35,
    width: 35,
    borderRadius: 10,
    // borderWidth: 1,
    // borderColor: Colors.accent,
    padding: 9,
    backgroundColor: Colors.accentAlpha30,
  },

  body: { flex: 1, padding: 16 },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    // borderColor: Colors.accent,
  },
  changePhotoBtn: {
    marginTop: 12,
    backgroundColor: Colors.bgAlt,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  changePhotoText: {
    color: Colors.accent,
    fontWeight: '600',
    fontSize: 13,
  },

  card: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
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
  actionText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textPrimary,
  },
  arrow: {
    fontSize: 18,
    color: '#999',
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
  saveWrap: {
    alignItems: 'flex-end',
    marginBottom: 14,
  },

  saveBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
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
});
