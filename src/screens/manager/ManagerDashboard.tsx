import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { SectionHeader } from '../../components';
import {
  Users,
  Footprints,
  AlertTriangle,
  MapPin,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { useManagerNavigation } from '../../navigation/utils';
import { MANAGER_ROUTES } from '../../navigation/constants';
import {
  ManagerTabShell,
  ManagerHeader,
  MANAGER_TAB_INDEX,
  sharedStyles,
} from './managerShared';

const OVERVIEW = [
  { icon: Users, value: '12', label: 'Guards On Duty', trend: '↑ 2 vs yesterday', trendUp: true, bg: '#eff6ff' },
  { icon: Footprints, value: '48', label: 'Patrols Today', trend: '↑ 87% compliance', trendUp: true, bg: '#fff7ed' },
  { icon: AlertTriangle, value: '3', label: 'Open Incidents', trend: '↑ 1 new today', trendUp: false, bg: '#fef2f2' },
  { icon: MapPin, value: '3', label: 'Active Sites', trend: 'All operational', trendUp: true, bg: '#f0fdf4' },
];

const ACTIVE_GUARDS = [
  { id: '1', initials: 'AK', name: 'Ahmed Khan', site: 'Mall of Lahore', status: 'on' as const, patrols: '6 patrols', avatarBg: '#fff3ed', avatarColor: '#d45a1a' },
  { id: '2', initials: 'MR', name: 'Muhammad Raza', site: 'DHA Clinic Block', status: 'on' as const, patrols: '4 patrols', avatarBg: '#e8f0fe', avatarColor: '#1a56db' },
  { id: '3', initials: 'ZA', name: 'Zara Ali', site: 'Packages Mall', status: 'idle' as const, patrols: 'Break', avatarBg: '#fde8e8', avatarColor: '#c53030' },
];

const RECENT_INCIDENTS = [
  { id: 1, title: 'Food Court Disturbance', site: 'Mall of Lahore', severity: 'HIGH', time: '08:47 AM' },
  { id: 2, title: 'Parking Gate Malfunction', site: 'Packages Mall', severity: 'MEDIUM', time: '07:15 AM' },
  { id: 3, title: 'Suspicious Activity', site: 'DHA Clinic', severity: 'LOW', time: '06:30 AM' },
];

const MISSED_ALERTS = [
  { id: 1, guard: 'Hassan Baig', site: 'Packages Mall', slot: '09:00 AM', zone: 'Zone B' },
  { id: 2, guard: 'Ali Raza', site: 'Mall of Lahore', slot: '08:30 AM', zone: 'Roof Access' },
];

const statusDotColor = { on: Colors.success, idle: Colors.warning, off: Colors.danger };

const sevColor: Record<string, string> = {
  HIGH: Colors.danger,
  MEDIUM: Colors.warning,
  LOW: Colors.success,
};

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ManagerDashboard() {
  const navigation = useManagerNavigation();

  return (
    <ManagerTabShell activeIndex={MANAGER_TAB_INDEX.DASHBOARD}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <ManagerHeader
          title={
            <>
              Operations View,{'\n'}
              <Text style={styles.greetAccent}>Sara Ahmed</Text>
            </>
          }
          subtitle={`${formatToday()} · 3 Sites Active`}
        />

        <View style={[sharedStyles.body, { marginTop: -10 }]}>
          <View style={styles.ovGrid}>
            {OVERVIEW.map((item, i) => {
              const Icon = item.icon;
              return (
                <View key={i} style={[styles.ovCard, Shadows.card]}>
                  <View style={[styles.ovIcon, { backgroundColor: item.bg }]}>
                    <Icon size={18} color="#334155" />
                  </View>
                  <Text style={styles.ovNum}>{item.value}</Text>
                  <Text style={styles.ovLabel}>{item.label}</Text>
                  <Text
                    style={[
                      styles.ovTrend,
                      { color: item.trendUp ? Colors.success : Colors.danger },
                    ]}
                  >
                    {item.trend}
                  </Text>
                </View>
              );
            })}
          </View>

          <SectionHeader
            title="Missed Patrol Alerts"
            action="View All →"
            dark={false}
          />
          {MISSED_ALERTS.map(alert => (
            <View key={alert.id} style={[styles.alertRow, Shadows.card]}>
              <View style={styles.alertIcon}>
                <Clock size={16} color={Colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>{alert.guard}</Text>
                <Text style={styles.alertSub}>
                  {alert.site} · {alert.zone} · {alert.slot}
                </Text>
              </View>
              <Text style={styles.alertBadge}>MISSED</Text>
            </View>
          ))}

          <SectionHeader title="Recent Incidents" action="Reports →" />
          {RECENT_INCIDENTS.map(inc => (
            <TouchableOpacity
              key={inc.id}
              style={[styles.incRow, Shadows.card]}
              onPress={() => navigation.navigate(MANAGER_ROUTES.REPORTS)}
            >
              <View
                style={[
                  styles.sevDot,
                  { backgroundColor: sevColor[inc.severity] },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.incTitle}>{inc.title}</Text>
                <Text style={styles.incSub}>
                  {inc.site} · {inc.time}
                </Text>
              </View>
              <ChevronRight size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}

          <SectionHeader
            title="Active Guards"
            action="Guards →"
          />
          {ACTIVE_GUARDS.map(g => (
            <TouchableOpacity
              key={g.id}
              style={[styles.guardRow, Shadows.card]}
              onPress={() =>
                navigation.navigate(MANAGER_ROUTES.GUARD_DETAILS, {
                  guardId: g.id,
                  name: g.name,
                })
              }
            >
              <View style={[styles.guardAv, { backgroundColor: g.avatarBg }]}>
                <Text style={[styles.guardAvText, { color: g.avatarColor }]}>
                  {g.initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.guardName}>{g.name}</Text>
                <Text style={styles.guardSite}>{g.site}</Text>
              </View>
              <View style={styles.guardStatus}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: statusDotColor[g.status] },
                  ]}
                />
                <Text style={styles.guardPatrols}>{g.patrols}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ManagerTabShell>
  );
}

const styles = StyleSheet.create({
  greetAccent: { color: '#60a5fa' },
  ovGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 14 },
  ovCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 12,
    width: '47%',
  },
  ovIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  ovNum: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  ovLabel: { fontSize: FontSizes.xs, color: Colors.textMuted },
  ovTrend: { fontSize: FontSizes.xs, fontWeight: '700', marginTop: 3 },

  alertRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  alertSub: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  alertBadge: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.danger,
    letterSpacing: 0.5,
  },

  incRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  incTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  incSub: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },

  guardRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guardAv: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guardAvText: { fontSize: 12, fontWeight: '800' },
  guardName: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  guardSite: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  guardStatus: { alignItems: 'flex-end' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginBottom: 3 },
  guardPatrols: { fontSize: FontSizes.xs, color: Colors.textMuted },
});
