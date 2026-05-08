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
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import { NavBar } from '../components';
import {
  AlertTriangle,
  ClipboardList,
  Home,
  Route,
  User,
  Camera,
  MapPin,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Plus,
} from 'lucide-react-native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES } from '../navigation/constants';

interface Incident {
  location: string;
  datetime: string;
  type: string;
  typeColor: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  mapPin: string;
  time: string;
}

const INCIDENTS: Incident[] = [
  {
    location: 'Gate A',
    datetime: '16 Apr 08:47',
    type: 'Altercation',
    typeColor: Colors.danger,
    severity: 'HIGH',
    title: 'Physical Conflict — Food Court',
    mapPin: 'Level 2, Stall 14',
    time: '08:47 AM',
  },
  {
    location: 'Parking B2',
    datetime: '15 Apr 22:10',
    type: 'Suspicious',
    typeColor: Colors.warning,
    severity: 'MEDIUM',
    title: 'Unattended Bag — Parking',
    mapPin: 'B2, Row 4',
    time: '22:10 PM',
  },
];

const sevConfig = {
  HIGH: { bg: Colors.dangerLight, color: Colors.danger },
  MEDIUM: { bg: Colors.warningLight, color: '#c05621' },
  LOW: { bg: Colors.successLight, color: Colors.success },
};

export default function IncidentsScreen() {
  const navigation = useGuardNavigation();
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.headerStart}
      />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.hdrRow}>
            <Text style={styles.hdrTitle}>Incidents</Text>
            <View style={styles.openBadge}>
              <Text style={styles.openBadgeText}>3 OPEN</Text>
            </View>
          </View>
          <Text style={styles.hdrSub}>Mall of Lahore · April 2026</Text>
        </View>

        {/* List */}
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {INCIDENTS.map((inc, i) => {
            const sev = sevConfig[inc.severity];

            return (
              <View key={i} style={[styles.card, Shadows.card]}>
                {/* IMAGE AREA */}
                <View style={styles.imgArea}>
                  <ShieldAlert size={34} color={Colors.headerStart} />

                  <View style={styles.imgOverlay}>
                    <View style={styles.incChip}>
                      <MapPin size={10} color="#fff" />
                      <Text style={styles.incChipText}>{inc.location}</Text>
                    </View>

                    <View style={styles.incChip}>
                      <Clock size={10} color="#fff" />
                      <Text style={styles.incChipText}>{inc.datetime}</Text>
                    </View>
                  </View>
                </View>

                {/* INFO */}
                <View style={styles.info}>
                  <View style={styles.typeRow}>
                    <View style={styles.typeLeft}>
                      <Shield size={10} color={inc.typeColor} />
                      <Text
                        style={[styles.typeLabel, { color: inc.typeColor }]}
                      >
                        {inc.type.toUpperCase()}
                      </Text>
                    </View>

                    <View
                      style={[styles.sevBadge, { backgroundColor: sev.bg }]}
                    >
                      <Text style={[styles.sevText, { color: sev.color }]}>
                        {inc.severity}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.incTitle}>{inc.title}</Text>

                  <View style={styles.metaRow}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <MapPin size={12} color="#888" />
                      <Text style={styles.metaText}>{inc.mapPin}</Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Clock size={12} color="#888" />
                      <Text style={styles.metaText}>{inc.time}</Text>
                    </View>
                  </View>
                </View>

                {/* ACTIONS */}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionOutline}>
                    <Text style={styles.actionOutlineText}>View Report</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionFill}>
                    <Text style={styles.actionFillText}>
                      {i === 0 ? 'Escalate' : 'Resolve'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate(GUARD_ROUTES.ADD_INCIDENT)}
        >
          <Plus size={22} color="white" />
        </TouchableOpacity>

        {/* NAVBAR */}
        <NavBar
          variant="light"
          items={[
            { icon: Home, label: 'Home' },
            { icon: Route, label: 'Patrol' },
            { icon: AlertTriangle, label: 'Incidents', active: true },
            { icon: ClipboardList, label: 'Shifts' },
            { icon: User, label: 'Profile' },
          ]}
          onPress={i => {
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
  container: { flex: 1, backgroundColor: Colors.bgAlt },
  safe: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 97,
    right: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  fabText: {
    fontSize: 26,
    color: Colors.white,
    fontWeight: '700',
  },
  header: {
    backgroundColor: Colors.headerStart,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
  },
  hdrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  hdrTitle: { fontSize: 17, fontWeight: '800', color: Colors.white },
  openBadge: {
    backgroundColor: 'rgba(229,62,62,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(229,62,62,0.3)',
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  openBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#f87171',
  },
  hdrSub: { fontSize: FontSizes.xs, color: 'rgba(255,255,255,0.35)' },

  body: { flex: 1, padding: 14 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    marginBottom: 10,

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.12,
    shadowRadius: 10,

    // Android shadow
    elevation: 10,
  },
  imgArea: {
    height: 110,
    // backgroundColor: Colors.headerStart,
    backgroundColor: '#d0c3c3',
    alignItems: 'center',
    justifyContent: 'center',

  },
  imgEmoji: { fontSize: 32, opacity: 0.25 },
  imgOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 5,

  },
  incChip: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5,
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  incChipText: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
  },

  info: { padding: 12 },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  typeLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  typeDot: { width: 7, height: 7, borderRadius: 4 },
  typeLabel: { fontSize: FontSizes.xs, fontWeight: '700', letterSpacing: 1 },
  sevBadge: { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 2 },
  sevText: { fontSize: FontSizes.xs, fontWeight: '700' },
  incTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  metaRow: { flexDirection: 'row', gap: 10 },
  metaText: { fontSize: FontSizes.xs, color: Colors.textMuted },

  actions: {
    flexDirection: 'row',
    gap: 7,
    padding: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionOutline: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionOutlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  actionFill: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: Radii.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actionFillText: { fontSize: 11, fontWeight: '700', color: Colors.white },
});
