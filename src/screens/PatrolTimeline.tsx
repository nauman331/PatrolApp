import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, StatusBar,
} from 'react-native';
import { Colors, FontSizes, Radii, Spacing, Shadows } from '../theme';
import { NavBar } from '../components';
import {
  AlertTriangle,
  ClipboardList,
  Home,
  Route,
  User,
  Camera,
  Mic,
  Radio,
  CheckCircle,
  Clock,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES } from '../navigation/constants';

type EntryType = 'done' | 'incident' | 'now' | 'pending';

interface TimelineEntry {
  type: EntryType;
  location: string;
  time: string;
  desc?: string;
  tags?: { label: string; style: 'nfc' | 'photo' | 'voice' | 'incident' | 'normal' }[];
  hasPhoto?: boolean;
  photoCaption?: string;
}

const ENTRIES: TimelineEntry[] = [
  {
    type: 'done',
    location: 'Gate A – North Entrance',
    time: '07:02 AM',
    desc: 'All clear. No suspicious activity. CCTV functional. All doors secured.',
    tags: [
      { label: 'NFC', style: 'nfc' },
      { label: '3 Photos', style: 'photo' },
      { label: 'All Clear', style: 'normal' },
    ],
  },
  {
    type: 'done',
    location: 'Parking Level B2',
    time: '08:05 AM',
    hasPhoto: true,
    photoCaption: '16 Apr 2026 08:05 · Mall of Lahore',
    tags: [
      { label: '2 Photos', style: 'photo' },
      { label: 'Voice', style: 'voice' },
      { label: 'Routine', style: 'normal' },
    ],
  },
  {
    type: 'incident',
    location: 'Food Court – Level 2',
    time: '08:47 AM',
    desc: 'Altercation between two individuals near stall 14. Security intervened. Police notified.',
    tags: [
      { label: 'Incident', style: 'incident' },
      { label: '5 Photos', style: 'photo' },
    ],
  },
  {
    type: 'now',
    location: 'Rooftop Access',
    time: '09:00 AM – NOW',
    desc: 'Patrol due. Proceed to checkpoint and submit report.',
  },
  {
    type: 'pending',
    location: 'East Exit – Gate D',
    time: '10:00 AM',
    desc: 'Scheduled patrol pending.',
  },
];

const dotColors: Record<EntryType, string> = {
  done: Colors.success,
  incident: Colors.danger,
  now: Colors.accent,
  pending: '#444',
};

const tagStyles: Record<string, { bg: string; color: string }> = {
  nfc: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa' },
  photo: { bg: 'rgba(46,125,82,0.12)', color: '#4ade80' },
  voice: { bg: 'rgba(139,92,246,0.12)', color: '#a78bfa' },
  incident: { bg: 'rgba(229,62,62,0.12)', color: '#f87171' },
  normal: { bg: 'rgba(0,0,0,0.06)', color: '#888' },
};

export default function PatrolTimeline() {
  const navigation = useGuardNavigation();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.safe}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Patrol Reports</Text>
            <Text style={styles.headerSub}>Mall of Lahore · Apr 16, 2026</Text>
          </View>

          <TouchableOpacity style={styles.addBtn}>
            <Text style={styles.addBtnText} onPress={() => navigation.navigate(GUARD_ROUTES.ADD_PATROL_REPORT)}>
              + Add
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.timeline}>
            <View style={styles.verticalLine} />

            {ENTRIES.map((entry, i) => {
              const isNow = entry.type === 'now';
              const isIncident = entry.type === 'incident';
              const isPending = entry.type === 'pending';

              return (
                <View key={i} style={[styles.tlRow, isPending && { opacity: 0.45 }]}>
                  {/* DOT */}
                  <View style={styles.dotCol}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: dotColors[entry.type] },
                        isNow && styles.dotNowGlow,
                      ]}
                    />
                  </View>

                  {/* CARD */}
                  <View style={[
                    styles.card,
                    isNow && styles.cardNow,
                    isIncident && styles.cardIncident,
                  ]}>

                    <View style={styles.cardTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <MapPin size={14} color={Colors.textPrimary} />
                        <Text style={styles.cardLoc}>{entry.location}</Text>
                      </View>

                      <View style={styles.timeTag}>
                        <Clock size={12} color={Colors.accent} />
                        <Text style={styles.timeTagText}>{entry.time}</Text>
                      </View>
                    </View>

                    {entry.hasPhoto && (
                      <>
                        <View style={styles.photoPlaceholder}>
                          <Camera size={28} color={Colors.textMuted} />
                        </View>
                        {entry.photoCaption && (
                          <Text style={styles.photoCaption}>{entry.photoCaption}</Text>
                        )}
                      </>
                    )}

                    {entry.desc && (
                      <Text style={styles.cardDesc}>{entry.desc}</Text>
                    )}

                    {entry.tags && (
                      <View style={styles.tagsRow}>
                        {entry.tags.map((tag, ti) => (
                          <View key={ti} style={[styles.tag, { backgroundColor: tagStyles[tag.style].bg }]}>
                            <Text style={[styles.tagText, { color: tagStyles[tag.style].color }]}>
                              {tag.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* NOW ACTIONS */}
                    {isNow && (
                      <View style={styles.nowActions}>
                        <TouchableOpacity style={styles.nowBtn}>
                          <Camera size={16} color={Colors.textPrimary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.nowBtn}>
                          <Radio size={16} color={Colors.textPrimary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.nowBtn}>
                          <Mic size={16} color={Colors.textPrimary} />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.nowBtn, styles.nowBtnPrimary]}>
                          <CheckCircle size={16} color={Colors.white} />
                        </TouchableOpacity>
                      </View>
                    )}

                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* NAVBAR */}
        <NavBar
          variant="light"
          items={[
            { icon: Home, label: 'Home' },
            { icon: Route, label: 'Patrol', active: true },
            { icon: AlertTriangle, label: 'Incidents' },
            { icon: ClipboardList, label: 'Shifts' },
            { icon: User, label: 'Profile' },
          ]}
          onPress={(i) => {
            const screens = [
              GUARD_ROUTES.DASHBOARD,
              GUARD_ROUTES.PATROL_TIMELINE,
              GUARD_ROUTES.INCIDENTS,
              GUARD_ROUTES.SHIFTS,
              GUARD_ROUTES.PROFILE,
            ];
            navigation.navigate(screens[i]);
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 2 },
  addBtn: {
    backgroundColor: Colors.accent, borderRadius: 10,
    paddingHorizontal: 13, paddingVertical: 9,
  },
  addBtnText: { fontSize: 11, fontWeight: '700', color: Colors.white },

  scroll: { flex: 1 },
  timeline: { padding: 18, position: 'relative' },
  verticalLine: {
    position: 'absolute', left: 30, top: 0, bottom: 0,
    width: 2, backgroundColor: Colors.border,
  },

  tlRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  dotCol: { width: 22, alignItems: 'center', paddingTop: 4 },
  dot: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.bg,
  },
  dotNowGlow: {
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 6, elevation: 4,
  },

  card: {
    flex: 1, backgroundColor: Colors.bgAlt,
    borderRadius: Radii.lg, padding: 12,
    borderWidth: 1.5, borderColor: Colors.border,
    ...Shadows.card,
  },
  cardNow: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accentAlpha25,
  },
  cardIncident: {
    backgroundColor: 'rgba(229,62,62,0.04)',
    borderColor: 'rgba(229,62,62,0.25)',
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 7,
  },
  cardLoc: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  timeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accentAlpha12,
    borderRadius: 5, paddingHorizontal: 7, paddingVertical: 5,
  },
  timeTagText: { fontSize: FontSizes.xs, color: Colors.accent, fontWeight: '700' },
  cardDesc: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16, marginBottom: 8 },
  photoPlaceholder: {
    height: 60, backgroundColor: Colors.border, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', marginBottom: 7,
  },
  photoCaption: { fontSize: FontSizes.xs, color: '#aaa', textAlign: 'center', marginBottom: 7 },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: FontSizes.xs, fontWeight: '700' },

  nowActions: { flexDirection: 'row', gap: 6, marginTop: 9 },
  nowBtn: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 9, paddingVertical: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  nowBtnPrimary: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  nowBtnPrimaryText: { fontSize: FontSizes.xs, fontWeight: '700', color: Colors.white },
});
