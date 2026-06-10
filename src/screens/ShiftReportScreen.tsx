import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Colors, FontSizes, Radii, Spacing, Shadows } from '../theme';
import { NavBar, SectionHeader } from '../components';
import { BarChart2, Home, MapPin, Settings } from 'lucide-react-native';
import { useManagerNavigation } from '../navigation/utils';
import { MANAGER_ROUTES, navigateManagerBottomTab } from '../navigation/constants';

import { Calendar } from 'lucide-react-native';

const SUMMARY = [
  { value: '6', label: 'Patrols', highlight: true },
  { value: '3', label: 'Incidents', highlight: false },
  { value: '11', label: 'Photos', highlight: false },
  { value: '92%', label: 'Compliance', highlight: false },
];

const BARS = [
  { label: '5AM', height: 35, color: Colors.border },
  { label: '6AM', height: 55, color: Colors.accent },
  { label: '7AM', height: 48, color: Colors.accent },
  { label: '8AM', height: 65, color: Colors.accent },
  { label: '9AM', height: 28, color: Colors.danger },
  { label: '10AM', height: 18, color: Colors.border },
  { label: '11AM', height: 10, color: Colors.border },
];

const PHOTOS = [
  '07:02 AM',
  '07:04 AM',
  '08:05 AM',
  '08:47 AM',
  '08:49 AM',
  '08:51 AM',
];

const ACTIVITY_LOG = [
  { dot: Colors.success, text: 'Sign In — Selfie Verified', time: '06:01 AM' },
  { dot: Colors.accent, text: 'Patrol — Gate A NFC Scan', time: '07:02 AM' },
  { dot: Colors.danger, text: 'Incident Filed — Food Court', time: '08:47 AM' },
  { dot: Colors.info, text: 'Voice Note Submitted', time: '08:55 AM' },
];

export default function ShiftReportScreen() {
  const navigation = useManagerNavigation();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.hdrLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Shift Report</Text>
              <Text style={styles.headerSub}>
                Mall of Lahore · Apr 16, 2026
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.exportBtn}>
            <Text style={styles.exportText}>↑ Export</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.body}>
            {/* Summary cards */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.summaryRow}>
                {SUMMARY.map((s, i) => (
                  <View
                    key={i}
                    style={[
                      styles.sumCard,
                      s.highlight && styles.sumCardHL,
                      Shadows.card,
                    ]}
                  >
                    <Text
                      style={[styles.sumNum, s.highlight && styles.sumNumHL]}
                    >
                      {s.value}
                    </Text>
                    <Text style={styles.sumLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* Bar Chart */}
            <View style={[styles.chartSection, Shadows.card]}>
              <Text style={styles.chartTitle}>Hourly Patrol Activity</Text>
              <View style={styles.barChart}>
                {BARS.map((bar, i) => (
                  <View key={i} style={styles.barCol}>
                    <View
                      style={[
                        styles.bar,
                        { height: bar.height, backgroundColor: bar.color },
                      ]}
                    />
                    <Text style={styles.barLabel}>{bar.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Photos */}
            <SectionHeader title="Photo Evidence" action="Gallery" />
            <View style={styles.photoGrid}>
              {PHOTOS.map((ts, i) => (
                <View key={i} style={styles.photoItem}>
                  <Text style={{ fontSize: 16, opacity: 0.45 }}>📸</Text>
                  <Text style={styles.photoTs}>{ts}</Text>
                </View>
              ))}
            </View>

            {/* Activity Log */}
            <View style={[styles.logSection, Shadows.card]}>
              <Text style={styles.logTitle}>Activity Log</Text>
              {ACTIVITY_LOG.map((row, i) => (
                <View
                  key={i}
                  style={[
                    styles.logRow,
                    i < ACTIVITY_LOG.length - 1 && styles.logRowBorder,
                  ]}
                >
                  <View style={styles.logLeft}>
                    <View
                      style={[styles.logDot, { backgroundColor: row.dot }]}
                    />
                    <Text style={styles.logText}>{row.text}</Text>
                  </View>
                  <Text style={styles.logTime}>{row.time}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        <NavBar
          variant="light"
          items={[
            { icon: Home, label: 'Overview' },
            { icon: BarChart2, label: 'Reports', active: true },
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
  container: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 14,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hdrLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: {
    width: 30,
    height: 30,
    backgroundColor: Colors.bgAlt,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 13, color: '#666' },
  headerTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  exportBtn: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentAlpha25,
    borderRadius: Radii.sm,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  exportText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.accent,
  },

  body: { padding: 14 },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  sumCard: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.lg,
    padding: 12,
    paddingHorizontal: 14,
    minWidth: 90,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sumCardHL: {
    borderColor: Colors.accentAlpha25,
    backgroundColor: Colors.accentLight,
  },
  sumNum: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  sumNumHL: { color: Colors.accent },
  sumLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },

  chartSection: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  barChart: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'flex-end',
    height: 80,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 3 },
  bar: { width: '100%', borderRadius: 3 },
  barLabel: { fontSize: FontSizes.xs, color: Colors.textMuted },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 14,
  },
  photoItem: {
    width: '31%',
    height: 64,
    backgroundColor: Colors.bgAlt,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTs: {
    position: 'absolute',
    bottom: 4,
    fontSize: 8,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  logSection: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  logTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  logRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  logLeft: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logDot: { width: 6, height: 6, borderRadius: 3 },
  logText: { fontSize: 11, color: Colors.textSecondary },
  logTime: { fontSize: FontSizes.xs, color: Colors.textMuted },
});
