import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, StatusBar,
} from 'react-native';
import { Colors, FontSizes, Radii, Spacing, Shadows } from '../theme';
import { NavBar, SectionHeader } from '../components';
import {
  Users,
  Footprints,
  AlertTriangle,
  MapPin,
  Bell
} from 'lucide-react-native';
import {
  Home,
  BarChart2,
  Calendar,
  Settings
} from 'lucide-react-native';
import { useManagerNavigation } from '../navigation/utils';
import { MANAGER_ROUTES, navigateManagerBottomTab } from '../navigation/constants';

interface OverviewCard {
  icon: any; // change from string → component
  value: string;
  label: string;
  trend: string;
  trendUp: boolean;
  bg: string;
}

const OVERVIEW: OverviewCard[] = [
  { icon: Users, value: '12', label: 'Guards On Duty', trend: '↑ 2 vs yesterday', trendUp: true, bg: '#eff6ff' },
  { icon: Footprints, value: '48', label: 'Patrols Today', trend: '↑ 87% compliance', trendUp: true, bg: '#fff7ed' },
  { icon: AlertTriangle, value: '3', label: 'Open Incidents', trend: '↑ 1 new today', trendUp: false, bg: '#fef2f2' },
  { icon: MapPin, value: '3', label: 'Active Sites', trend: 'All operational', trendUp: true, bg: '#f0fdf4' },
];

interface Guard {
  initials: string; name: string; site: string;
  status: 'on' | 'idle' | 'off'; patrols: string; avatarBg: string; avatarColor: string;
}

const GUARDS: Guard[] = [
  { initials: 'AK', name: 'Ahmed Khan', site: 'Mall of Lahore', status: 'on', patrols: '6 patrols', avatarBg: '#fff3ed', avatarColor: '#d45a1a' },
  { initials: 'MR', name: 'Muhammad Raza', site: 'DHA Clinic Block', status: 'on', patrols: '4 patrols', avatarBg: '#e8f0fe', avatarColor: '#1a56db' },
  { initials: 'ZA', name: 'Zara Ali', site: 'Packages Mall', status: 'idle', patrols: 'Break', avatarBg: '#fde8e8', avatarColor: '#c53030' },
  { initials: 'HB', name: 'Hassan Baig', site: 'Off Duty', status: 'off', patrols: '—', avatarBg: '#e8f8f0', avatarColor: '#2e7d52' },
];

const statusDotColor = { on: Colors.success, idle: Colors.warning, off: Colors.danger };

export default function ManagerDashboard() {
  const navigation = useManagerNavigation();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.mgrHeaderStart} />
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerDecor} />

            <View style={styles.topRow}>
              <View style={styles.mgrBadge}>
                <Text style={styles.mgrBadgeText}>MANAGER</Text>
              </View>

              <View style={styles.notifBtn}>
                <Bell size={18} color="#fff" />
                <View style={styles.notifDot} />
              </View>
            </View>

            <Text style={styles.greet}>
              Operations View,{'\n'}
              <Text style={styles.greetAccent}>Sara Ahmed</Text>
            </Text>

            <Text style={styles.dateLine}>
              Thursday, 16 April 2026 · 3 Sites Active
            </Text>
          </View>

          {/* Body */}
          <View style={styles.body}>

            {/* Overview Grid */}
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

            {/* Guards */}
            <SectionHeader title="Guards on Duty" action="Roster →" />

            {GUARDS.map((g, i) => (
              <View key={i} style={[styles.guardRow, Shadows.card]}>
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
              </View>
            ))}

          </View>
        </ScrollView>

        {/* Bottom Nav */}
        <NavBar
          variant="mgr"
          items={[
            { icon: Home, label: 'Overview', active: true },
            { icon: BarChart2, label: 'Reports' },
            { icon: Calendar, label: 'Roster' },
            { icon: MapPin, label: 'Sites' },
            { icon: Settings, label: 'Settings' },
          ]}
          onPress={i => navigateManagerBottomTab(navigation, i)}
        />

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff' },
  safe: { flex: 1 },

  header: {
    backgroundColor: Colors.mgrHeaderStart,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 52,
    borderBottomLeftRadius: 26, borderBottomRightRadius: 26, overflow: 'hidden',
  },
  headerDecor: {
    position: 'absolute', top: -30, right: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(59,130,246,0.10)',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  mgrBadge: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
    borderRadius: 7, paddingHorizontal: 9, paddingVertical: 3,
  },
  mgrBadgeText: { fontSize: FontSizes.xs, fontWeight: '700', color: '#60a5fa', letterSpacing: 1 },
  notifBtn: {
    width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  notifDot: {
    width: 8, height: 8, backgroundColor: Colors.accent, borderRadius: 4,
    position: 'absolute', top: 5, right: 5,
    borderWidth: 1.5, borderColor: Colors.mgrHeaderStart,
  },
  greet: { fontSize: 19, fontWeight: '800', color: Colors.white },
  greetAccent: { color: '#60a5fa' },
  dateLine: { fontSize: FontSizes.xs, color: 'rgba(255,255,255,0.35)', marginTop: 3 },

  body: { padding: 14, marginTop: -10 },

  ovGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 14 },
  ovCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radii.lg, padding: 12,
    width: '47%',
  },
  ovIcon: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', marginBottom: 7,
  },
  ovNum: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  ovLabel: { fontSize: FontSizes.xs, color: Colors.textMuted },
  ovTrend: { fontSize: FontSizes.xs, fontWeight: '700', marginTop: 3 },

  guardRow: {
    backgroundColor: Colors.bgCard, borderRadius: Radii.md,
    padding: 12, marginBottom: 7,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  guardAv: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  guardAvText: { fontSize: 12, fontWeight: '800' },
  guardName: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  guardSite: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  guardStatus: { alignItems: 'flex-end' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginBottom: 3 },
  guardPatrols: { fontSize: FontSizes.xs, color: Colors.textMuted },
});
