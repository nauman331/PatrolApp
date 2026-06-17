import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { SectionHeader } from '../../components';
import { MapPin, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  ManagerTabShell,
  ManagerHeader,
  MANAGER_TAB_INDEX,
  sharedStyles,
} from './managerShared';

type RosterTab = 'calendar' | 'shifts' | 'sites';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
const HIGHLIGHT_DAYS = [16, 17, 18, 22];

const SHIFT_ASSIGNMENTS = [
  { guard: 'Ahmed Khan', site: 'Mall of Lahore', shift: '06:00 – 14:00', zone: 'All Zones' },
  { guard: 'Muhammad Raza', site: 'DHA Clinic Block', shift: '06:00 – 14:00', zone: 'Ground Floor' },
  { guard: 'Zara Ali', site: 'Packages Mall', shift: '14:00 – 22:00', zone: 'Parking + L2' },
  { guard: 'Ali Raza', site: 'Mall of Lahore', shift: '14:00 – 22:00', zone: 'Food Court' },
];

const SITE_ASSIGNMENTS = [
  { site: 'Mall of Lahore', guards: 4, shifts: '3 shifts/day', lead: 'Ahmed Khan' },
  { site: 'Packages Mall', guards: 3, shifts: '2 shifts/day', lead: 'Zara Ali' },
  { site: 'DHA Clinic Block', guards: 2, shifts: '2 shifts/day', lead: 'Muhammad Raza' },
];

export default function ManagerRosterScreen() {
  const [tab, setTab] = useState<RosterTab>('calendar');
  const [monthLabel] = useState('April 2026');

  return (
    <ManagerTabShell activeIndex={MANAGER_TAB_INDEX.ROSTER}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <ManagerHeader
          title="Roster"
          subtitle="Shift & site assignments"
        />

        <View style={[sharedStyles.body, { marginTop: -10 }]}>
          <View style={styles.tabRow}>
            {(
              [
                { key: 'calendar', label: 'Calendar' },
                { key: 'shifts', label: 'Shifts' },
                { key: 'sites', label: 'Sites' },
              ] as const
            ).map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tab, tab === t.key && styles.tabActive]}
                onPress={() => setTab(t.key)}
              >
                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'calendar' && (
            <>
              <View style={[styles.calendarHeader, Shadows.card]}>
                <TouchableOpacity>
                  <ChevronLeft size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{monthLabel}</Text>
                <TouchableOpacity>
                  <ChevronRight size={18} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.calendar, Shadows.card]}>
                <View style={styles.weekRow}>
                  {WEEK_DAYS.map(d => (
                    <Text key={d} style={styles.weekDay}>
                      {d}
                    </Text>
                  ))}
                </View>
                <View style={styles.daysGrid}>
                  {CALENDAR_DAYS.map(day => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayCell,
                        day === 16 && styles.dayToday,
                        HIGHLIGHT_DAYS.includes(day) && styles.dayHasShift,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          day === 16 && styles.dayTextToday,
                          HIGHLIGHT_DAYS.includes(day) && styles.dayTextShift,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <SectionHeader title="Today's Shifts" action="Apr 16" />
              {SHIFT_ASSIGNMENTS.slice(0, 2).map((s, i) => (
                <View key={i} style={[styles.shiftRow, Shadows.card]}>
                  <View style={styles.shiftIcon}>
                    <Clock size={14} color="#1a56db" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shiftGuard}>{s.guard}</Text>
                    <Text style={styles.shiftMeta}>
                      {s.site} · {s.shift}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {tab === 'shifts' && (
            <>
              <SectionHeader title="Shift Assignments" action="This Week" />
              {SHIFT_ASSIGNMENTS.map((s, i) => (
                <View key={i} style={[styles.shiftRow, Shadows.card]}>
                  <View style={styles.shiftIcon}>
                    <Users size={14} color="#1a56db" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shiftGuard}>{s.guard}</Text>
                    <Text style={styles.shiftMeta}>
                      {s.site} · {s.shift}
                    </Text>
                    <Text style={styles.shiftZone}>{s.zone}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {tab === 'sites' && (
            <>
              <SectionHeader title="Site Assignments" action="3 Sites" />
              {SITE_ASSIGNMENTS.map((s, i) => (
                <View key={i} style={[styles.siteRow, Shadows.card]}>
                  <View style={styles.siteIcon}>
                    <MapPin size={16} color="#1a56db" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.siteName}>{s.site}</Text>
                    <Text style={styles.siteMeta}>
                      {s.guards} guards · {s.shifts}
                    </Text>
                    <Text style={styles.siteLead}>Lead: {s.lead}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </ManagerTabShell>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radii.md,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.infoLight, borderColor: '#93c5fd' },
  tabText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.textMuted },
  tabTextActive: { color: '#1a56db' },

  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 10,
  },
  monthLabel: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },

  calendar: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 12,
    marginBottom: 14,
  },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    backgroundColor: '#1a56db',
    borderRadius: 20,
  },
  dayHasShift: {},
  dayText: { fontSize: 12, color: Colors.textPrimary },
  dayTextToday: { color: '#fff', fontWeight: '800' },
  dayTextShift: { fontWeight: '700', color: '#1a56db' },

  shiftRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shiftIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftGuard: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  shiftMeta: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  shiftZone: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },

  siteRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  siteIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  siteMeta: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  siteLead: { fontSize: FontSizes.xs, color: '#1a56db', marginTop: 2, fontWeight: '600' },
});
