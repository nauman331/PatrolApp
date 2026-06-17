import React, { useState } from 'react';
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
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';
import type { ManagerStackScreenProps } from '../../navigation/types';
import { ManagerStackHeader, MANAGER_PAGE_BG, sharedStyles } from './managerShared';

type Props = ManagerStackScreenProps<'ManagerGuardAttendance'>;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] as const;

const ATTENDANCE = [
  { date: 'Mon, 14 Apr', shift: '06:00 – 14:00', checkIn: '05:58 AM', checkOut: '14:02 PM', status: 'present' as const },
  { date: 'Sun, 13 Apr', shift: '06:00 – 14:00', checkIn: '06:05 AM', checkOut: '14:00 PM', status: 'late' as const },
  { date: 'Sat, 12 Apr', shift: '06:00 – 14:00', checkIn: '—', checkOut: '—', status: 'absent' as const },
  { date: 'Fri, 11 Apr', shift: '06:00 – 14:00', checkIn: '05:55 AM', checkOut: '14:01 PM', status: 'present' as const },
  { date: 'Thu, 10 Apr', shift: '06:00 – 14:00', checkIn: '06:00 AM', checkOut: '14:00 PM', status: 'present' as const },
];

const statusConfig = {
  present: { label: 'Present', color: Colors.success, icon: CheckCircle },
  late: { label: 'Late', color: Colors.warning, icon: Clock },
  absent: { label: 'Absent', color: Colors.danger, icon: XCircle },
};

export default function ManagerGuardAttendanceScreen({ route }: Props) {
  const { name = 'Guard' } = route.params ?? {};
  const [month, setMonth] = useState<(typeof MONTHS)[number]>('Apr');

  const present = ATTENDANCE.filter(a => a.status === 'present').length;
  const late = ATTENDANCE.filter(a => a.status === 'late').length;
  const absent = ATTENDANCE.filter(a => a.status === 'absent').length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ManagerStackHeader
          title="Attendance"
          subtitle={name}
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.body}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={sharedStyles.chipRow}>
                {MONTHS.map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      sharedStyles.chip,
                      month === m && sharedStyles.chipActive,
                    ]}
                    onPress={() => setMonth(m)}
                  >
                    <Text
                      style={[
                        sharedStyles.chipText,
                        month === m && sharedStyles.chipTextActive,
                      ]}
                    >
                      {m} 2026
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.summaryRow}>
              <View style={[styles.sumCard, Shadows.card]}>
                <Text style={[styles.sumNum, { color: Colors.success }]}>{present}</Text>
                <Text style={styles.sumLabel}>Present</Text>
              </View>
              <View style={[styles.sumCard, Shadows.card]}>
                <Text style={[styles.sumNum, { color: Colors.warning }]}>{late}</Text>
                <Text style={styles.sumLabel}>Late</Text>
              </View>
              <View style={[styles.sumCard, Shadows.card]}>
                <Text style={[styles.sumNum, { color: Colors.danger }]}>{absent}</Text>
                <Text style={styles.sumLabel}>Absent</Text>
              </View>
            </View>

            {ATTENDANCE.map((row, i) => {
              const cfg = statusConfig[row.status];
              const Icon = cfg.icon;
              return (
                <View key={i} style={[styles.row, Shadows.card]}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.date}>{row.date}</Text>
                    <Text style={styles.shift}>{row.shift}</Text>
                    <Text style={styles.times}>
                      In: {row.checkIn} · Out: {row.checkOut}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}18` }]}>
                    <Icon size={14} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </View>
                </View>
              );
            })}
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

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  sumCard: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    alignItems: 'center',
  },
  sumNum: { fontSize: 22, fontWeight: '800' },
  sumLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },

  row: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flex: 1 },
  date: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  shift: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  times: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 3 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  statusText: { fontSize: 9, fontWeight: '700' },
});
