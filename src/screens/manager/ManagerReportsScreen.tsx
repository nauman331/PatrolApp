import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import {
  Filter,
  Mail,
  Download,
  ChevronRight,
  Footprints,
  AlertTriangle,
} from 'lucide-react-native';
import { useManagerNavigation } from '../../navigation/utils';
import { MANAGER_ROUTES } from '../../navigation/constants';
import {
  ManagerTabShell,
  ManagerHeader,
  MANAGER_TAB_INDEX,
  sharedStyles,
} from './managerShared';

type ReportTab = 'patrol' | 'incident';

const PATROL_REPORTS = [
  { id: '1', guard: 'Ahmed Khan', site: 'Mall of Lahore', date: 'Apr 16, 2026', patrols: 6, compliance: '92%' },
  { id: '2', guard: 'Muhammad Raza', site: 'DHA Clinic Block', date: 'Apr 16, 2026', patrols: 4, compliance: '88%' },
  { id: '3', guard: 'Zara Ali', site: 'Packages Mall', date: 'Apr 15, 2026', patrols: 5, compliance: '95%' },
];

const INCIDENT_REPORTS = [
  { id: '1', title: 'Food Court Disturbance', site: 'Mall of Lahore', severity: 'HIGH', date: 'Apr 16, 2026', guard: 'Ahmed Khan' },
  { id: '2', title: 'Parking Gate Malfunction', site: 'Packages Mall', severity: 'MEDIUM', date: 'Apr 16, 2026', guard: 'Zara Ali' },
  { id: '3', title: 'Suspicious Activity', site: 'DHA Clinic', severity: 'LOW', date: 'Apr 15, 2026', guard: 'Muhammad Raza' },
];

const DATE_FILTERS = ['Today', 'This Week', 'This Month', 'Custom'] as const;

const sevColor: Record<string, string> = {
  HIGH: Colors.danger,
  MEDIUM: Colors.warning,
  LOW: Colors.success,
};

export default function ManagerReportsScreen() {
  const navigation = useManagerNavigation();
  const [tab, setTab] = useState<ReportTab>('patrol');
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTERS)[number]>('Today');

  return (
    <ManagerTabShell activeIndex={MANAGER_TAB_INDEX.REPORTS}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <ManagerHeader
          title="Reports"
          subtitle="Patrol & incident reports across all sites"
        />

        <View style={[sharedStyles.body, { marginTop: -10 }]}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, tab === 'patrol' && styles.tabActive]}
              onPress={() => setTab('patrol')}
            >
              <Footprints size={14} color={tab === 'patrol' ? '#1a56db' : Colors.textMuted} />
              <Text style={[styles.tabText, tab === 'patrol' && styles.tabTextActive]}>
                Patrol Reports
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'incident' && styles.tabActive]}
              onPress={() => setTab('incident')}
            >
              <AlertTriangle size={14} color={tab === 'incident' ? '#1a56db' : Colors.textMuted} />
              <Text style={[styles.tabText, tab === 'incident' && styles.tabTextActive]}>
                Incident Reports
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toolbar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={sharedStyles.chipRow}>
                {DATE_FILTERS.map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      sharedStyles.chip,
                      dateFilter === f && sharedStyles.chipActive,
                    ]}
                    onPress={() => setDateFilter(f)}
                  >
                    <Text
                      style={[
                        sharedStyles.chipText,
                        dateFilter === f && sharedStyles.chipTextActive,
                      ]}
                    >
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.iconBtn}>
                <Filter size={14} color="#1a56db" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <Download size={14} color="#1a56db" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.emailBtn}>
                <Mail size={14} color="#fff" />
                <Text style={styles.emailText}>Email</Text>
              </TouchableOpacity>
            </View>
          </View>

          {tab === 'patrol'
            ? PATROL_REPORTS.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.reportRow, Shadows.card]}
                  onPress={() =>
                    navigation.navigate(MANAGER_ROUTES.SHIFT_REPORT, {
                      shiftId: r.id,
                      guardName: r.guard,
                      site: r.site,
                    })
                  }
                >
                  <View style={styles.reportIcon}>
                    <Footprints size={16} color="#1a56db" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportTitle}>{r.guard}</Text>
                    <Text style={styles.reportSub}>
                      {r.site} · {r.date}
                    </Text>
                    <Text style={styles.reportMeta}>
                      {r.patrols} patrols · {r.compliance} compliance
                    </Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ))
            : INCIDENT_REPORTS.map(r => (
                <View key={r.id} style={[styles.reportRow, Shadows.card]}>
                  <View
                    style={[
                      styles.reportIcon,
                      { backgroundColor: `${sevColor[r.severity]}18` },
                    ]}
                  >
                    <AlertTriangle size={16} color={sevColor[r.severity]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportTitle}>{r.title}</Text>
                    <Text style={styles.reportSub}>
                      {r.site} · {r.date}
                    </Text>
                    <Text style={styles.reportMeta}>
                      {r.guard} ·{' '}
                      <Text style={{ color: sevColor[r.severity], fontWeight: '700' }}>
                        {r.severity}
                      </Text>
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.exportSmall}>
                    <Download size={14} color="#1a56db" />
                  </TouchableOpacity>
                </View>
              ))}
        </View>
      </ScrollView>
    </ManagerTabShell>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.infoLight,
    borderColor: '#93c5fd',
  },
  tabText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.textMuted },
  tabTextActive: { color: '#1a56db' },

  toolbar: { marginBottom: 12 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1a56db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.sm,
    marginLeft: 'auto',
  },
  emailText: { fontSize: FontSizes.xs, fontWeight: '700', color: '#fff' },

  reportRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reportIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  reportSub: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  reportMeta: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  exportSmall: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
