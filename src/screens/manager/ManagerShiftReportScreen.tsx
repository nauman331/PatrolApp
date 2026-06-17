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
import { Mail, Download } from 'lucide-react-native';
import type { ManagerStackScreenProps } from '../../navigation/types';
import { ManagerStackHeader, MANAGER_PAGE_BG } from './managerShared';

type Props = ManagerStackScreenProps<'ManagerShiftReport'>;

const SUMMARY = [
  { value: '6', label: 'Patrols', highlight: true },
  { value: '3', label: 'Incidents', highlight: false },
  { value: '11', label: 'Photos', highlight: false },
  { value: '92%', label: 'Compliance', highlight: false },
];

const BARS = [
  { label: '5AM', height: 35, color: Colors.border },
  { label: '6AM', height: 55, color: '#1a56db' },
  { label: '7AM', height: 48, color: '#1a56db' },
  { label: '8AM', height: 65, color: '#1a56db' },
  { label: '9AM', height: 28, color: Colors.danger },
  { label: '10AM', height: 18, color: Colors.border },
  { label: '11AM', height: 10, color: Colors.border },
];

const PHOTOS = ['07:02 AM', '07:04 AM', '08:05 AM', '08:47 AM', '08:49 AM', '08:51 AM'];

const ACTIVITY_LOG = [
  { dot: Colors.success, text: 'Sign In — Selfie Verified', time: '06:01 AM' },
  { dot: '#1a56db', text: 'Patrol — Gate A NFC Scan', time: '07:02 AM' },
  { dot: Colors.danger, text: 'Incident Filed — Food Court', time: '08:47 AM' },
  { dot: Colors.info, text: 'Voice Note Submitted', time: '08:55 AM' },
];

export default function ManagerShiftReportScreen({ route }: Props) {
  const { guardName = 'Ahmed Khan', site = 'Mall of Lahore' } = route.params ?? {};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ManagerStackHeader
          title="Shift Report"
          subtitle={`${site} · ${guardName}`}
          rightAction={
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.exportBtn}>
                <Download size={14} color="#1a56db" />
                <Text style={styles.exportText}>Export</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.emailBtn}>
                <Mail size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          }
        />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.body}>
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
                    <Text style={[styles.sumNum, s.highlight && styles.sumNumHL]}>
                      {s.value}
                    </Text>
                    <Text style={styles.sumLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>

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

            <SectionHeader title="Photo Evidence" action="Gallery" />
            <View style={styles.photoGrid}>
              {PHOTOS.map((ts, i) => (
                <View key={i} style={styles.photoItem}>
                  <Text style={{ fontSize: 16, opacity: 0.45 }}>📸</Text>
                  <Text style={styles.photoTs}>{ts}</Text>
                </View>
              ))}
            </View>

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
                    <View style={[styles.logDot, { backgroundColor: row.dot }]} />
                    <Text style={styles.logText}>{row.text}</Text>
                  </View>
                  <Text style={styles.logTime}>{row.time}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MANAGER_PAGE_BG },
  safe: { flex: 1 },

  headerActions: { flexDirection: 'row', gap: 6 },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.infoLight,
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  exportText: { fontSize: FontSizes.xs, fontWeight: '700', color: '#1a56db' },
  emailBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#1a56db',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { padding: 14 },
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  sumCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 12,
    paddingHorizontal: 14,
    minWidth: 90,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  sumCardHL: { borderColor: '#93c5fd', backgroundColor: Colors.infoLight },
  sumNum: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  sumNumHL: { color: '#1a56db' },
  sumLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },

  chartSection: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chartTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  barChart: { flexDirection: 'row', gap: 5, alignItems: 'flex-end', height: 80 },
  barCol: { flex: 1, alignItems: 'center', gap: 3 },
  bar: { width: '100%', borderRadius: 3 },
  barLabel: { fontSize: FontSizes.xs, color: Colors.textMuted },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 14 },
  photoItem: {
    width: '31%',
    height: 64,
    backgroundColor: Colors.bgCard,
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
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  logTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
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
