import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { SectionHeader } from '../../components';
import {
  MapPin,
  Clock,
  Footprints,
  Phone,
  Mail,
  ChevronRight,
  Shield,
} from 'lucide-react-native';
import { useManagerNavigation } from '../../navigation/utils';
import { MANAGER_ROUTES } from '../../navigation/constants';
import type { ManagerStackScreenProps } from '../../navigation/types';
import { ManagerStackHeader, MANAGER_PAGE_BG } from './managerShared';

type Props = ManagerStackScreenProps<'ManagerGuardDetails'>;

const SHIFT_LOG = [
  { time: '06:01 AM', event: 'Signed In — Selfie Verified', dot: Colors.success },
  { time: '07:02 AM', event: 'Patrol — Gate A NFC', dot: Colors.info },
  { time: '08:15 AM', event: 'Patrol — Food Court', dot: Colors.info },
  { time: '09:00 AM', event: 'Break Started', dot: Colors.warning },
];

export default function ManagerGuardDetailsScreen({ route }: Props) {
  const navigation = useManagerNavigation();
  const { guardId, name = 'Guard' } = route.params ?? {};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ManagerStackHeader
          title={name}
          subtitle="Guard Details · On Duty"
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.body}>
            <View style={[styles.profileCard, Shadows.card]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profileRole}>Security Guard · ID #{guardId ?? '—'}</Text>
              <View style={styles.statusPill}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>On Duty</Text>
              </View>
            </View>

            <View style={[styles.infoGrid, Shadows.card]}>
              <View style={styles.infoItem}>
                <MapPin size={16} color="#1a56db" />
                <Text style={styles.infoLabel}>Site</Text>
                <Text style={styles.infoValue}>Mall of Lahore</Text>
              </View>
              <View style={styles.infoItem}>
                <Clock size={16} color="#1a56db" />
                <Text style={styles.infoLabel}>Shift</Text>
                <Text style={styles.infoValue}>06:00 – 14:00</Text>
              </View>
              <View style={styles.infoItem}>
                <Footprints size={16} color="#1a56db" />
                <Text style={styles.infoLabel}>Patrols</Text>
                <Text style={styles.infoValue}>6 completed</Text>
              </View>
              <View style={styles.infoItem}>
                <Shield size={16} color="#1a56db" />
                <Text style={styles.infoLabel}>License</Text>
                <Text style={styles.infoValue}>SEC-2024-8841</Text>
              </View>
            </View>

            <SectionHeader title="Contact" />
            <View style={[styles.contactRow, Shadows.card]}>
              <Phone size={16} color={Colors.textSecondary} />
              <Text style={styles.contactText}>+92 300 1234567</Text>
            </View>
            <View style={[styles.contactRow, Shadows.card]}>
              <Mail size={16} color={Colors.textSecondary} />
              <Text style={styles.contactText}>
                {name.toLowerCase().replace(' ', '.')}@patrol.app
              </Text>
            </View>

            <SectionHeader title="Shift Status" action="Today" />
            {SHIFT_LOG.map((row, i) => (
              <View key={i} style={[styles.logRow, Shadows.card]}>
                <View style={[styles.logDot, { backgroundColor: row.dot }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.logEvent}>{row.event}</Text>
                  <Text style={styles.logTime}>{row.time}</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.actionBtn, Shadows.card]}
              onPress={() =>
                navigation.navigate(MANAGER_ROUTES.GUARD_ATTENDANCE, {
                  guardId,
                  name,
                })
              }
            >
              <Text style={styles.actionText}>View Attendance History</Text>
              <ChevronRight size={18} color="#1a56db" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MANAGER_PAGE_BG },
  safe: { flex: 1 },
  body: { padding: 14 },

  profileCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#1a56db' },
  profileName: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  profileRole: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  statusText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.success },

  infoGrid: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  infoItem: { width: '46%', gap: 3 },
  infoLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  infoValue: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },

  contactRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 7,
  },
  contactText: { fontSize: 12, color: Colors.textPrimary },

  logRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 7,
  },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logEvent: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
  logTime: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },

  actionBtn: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  actionText: { fontSize: 13, fontWeight: '700', color: '#1a56db' },
});
