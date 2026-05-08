import React, { useState } from 'react';
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
import { NavBar, Chip } from '../components';
import {
  AlertTriangle,
  ClipboardList,
  Home,
  Route,
  User,
} from 'lucide-react-native';
import { Clock, MapPin, CheckCircle, Camera } from 'lucide-react-native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES } from '../navigation/constants';

type ShiftStatus = 'active' | 'upcoming' | 'done';

interface Shift {
  site: string;
  id: string;
  time: string;
  zones: string;
  status: ShiftStatus;
  progress?: number;
  progressLabel?: string;
}

const SHIFTS: { group: string; items: Shift[] }[] = [
  {
    group: 'Today — Apr 16',
    items: [
      {
        site: 'Mall of Lahore',
        id: '#SHF-0416-A',
        time: '06:00 – 14:00',
        zones: 'Zone A, B, C',
        status: 'active',
        progress: 60,
        progressLabel: '6/10',
      },
    ],
  },
  {
    group: 'Tomorrow — Apr 17',
    items: [
      {
        site: 'DHA Clinic Block',
        id: '#SHF-0417-A',
        time: '22:00 – 06:00',
        zones: 'All Zones',
        status: 'upcoming',
      },
    ],
  },
  {
    group: 'Apr 15 — Yesterday',
    items: [
      {
        site: 'Packages Mall',
        id: '#SHF-0415-B',
        time: '14:00 – 22:00',
        zones: '10/10',
        status: 'done',
        progress: 100,
        progressLabel: '100%',
      },
    ],
  },
];

const leftBarColor: Record<ShiftStatus, string> = {
  active: Colors.accent,
  done: Colors.success,
  upcoming: Colors.info,
};

const badgeConfig: Record<
  ShiftStatus,
  { bg: string; color: string; label: string }
> = {
  active: { bg: Colors.accentLight, color: Colors.accent, label: '● ACTIVE' },
  done: { bg: Colors.successLight, color: Colors.success, label: '✓ DONE' },
  upcoming: { bg: Colors.infoLight, color: Colors.info, label: 'UPCOMING' },
};

const FILTERS = ['All', 'Active', 'Upcoming', 'Completed'];

export default function ShiftsScreen() {
  const navigation = useGuardNavigation();
  const [activeFilter, setActiveFilter] = useState('All');

  const handleSignIn = (shift: Shift) => {
    navigation.navigate(GUARD_ROUTES.SHIFT_SIGN_IN, { shiftId: shift.id });
  };

  const filteredShifts = SHIFTS.map(group => ({
    ...group,
    items:
      activeFilter === 'All'
        ? group.items
        : group.items.filter(shift => {
          if (activeFilter === 'Active') return shift.status === 'active';
          if (activeFilter === 'Upcoming') return shift.status === 'upcoming';
          if (activeFilter === 'Completed') return shift.status === 'done';
          return true;
        }),
  })).filter(group => group.items.length > 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.backRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Shifts</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {FILTERS.map(f => (
                <Chip
                  key={f}
                  label={f}
                  active={activeFilter === f}
                  onPress={() => setActiveFilter(f)}
                />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Shifts List */}
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {filteredShifts.map((group, gi) => (
            <View key={gi}>
              <Text style={styles.groupLabel}>{group.group}</Text>
              {group.items.map((shift, si) => {
                const badge = badgeConfig[shift.status];
                const canSignIn =
                  shift.status === 'active' || shift.status === 'upcoming';

                return (
                  <View
                    key={si}
                    style={[
                      styles.shiftItem,
                      Shadows.card,
                      { borderLeftColor: leftBarColor[shift.status] },
                    ]}
                  >
                    <View style={styles.siTop}>
                      <View>
                        <Text style={styles.siSite}>{shift.site}</Text>
                        <Text style={styles.siId}>{shift.id}</Text>
                      </View>
                      <View
                        style={[styles.siBadge, { backgroundColor: badge.bg }]}
                      >
                        <Text
                          style={[styles.siBadgeText, { color: badge.color }]}
                        >
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.siMeta}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Clock size={12} color={Colors.textSecondary} />
                        <Text style={styles.siMetaItem}>{shift.time}</Text>
                      </View>

                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <MapPin size={12} color={Colors.textSecondary} />
                        <Text style={styles.siMetaItem}>{shift.zones}</Text>
                      </View>
                    </View>

                    {shift.progress !== undefined && (
                      <View style={styles.progressWrap}>
                        <View style={styles.progressRow}>
                          <Text style={styles.progressLbl}>
                            {shift.status === 'done'
                              ? 'Compliance'
                              : 'Patrol Progress'}
                          </Text>
                          <Text
                            style={[
                              styles.progressVal,
                              {
                                color:
                                  shift.status === 'done'
                                    ? Colors.success
                                    : Colors.accent,
                              },
                            ]}
                          >
                            {shift.progressLabel}
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${shift.progress}%`,
                                backgroundColor:
                                  shift.status === 'done'
                                    ? Colors.success
                                    : Colors.accent,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    )}

                    {/* Sign In Button - Only for Active & Upcoming */}
                    {canSignIn && (
                      <TouchableOpacity
                        style={styles.signInBtn}
                        onPress={() => handleSignIn(shift)}
                      >
                        <View
                          style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                          {shift.status === 'active' ? (
                            <CheckCircle size={16} color="#fff" />
                          ) : (
                            <Camera size={16} color="#fff" />
                          )}
                          <Text style={styles.signInText}>
                            {shift.status === 'active'
                              ? '  Continue Shift'
                              : '  Sign In Now'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Bottom Navigation */}
        <NavBar
          variant="light"
          items={[
            { icon: Home, label: 'Home' },
            { icon: Route, label: 'Patrol' },
            { icon: AlertTriangle, label: 'Incidents' },
            { icon: ClipboardList, label: 'Shifts', active: true },
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

  header: {
    backgroundColor: Colors.bg,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  backBtn: {
    width: 30,
    height: 30,
    backgroundColor: Colors.bgAlt,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 13, color: '#666' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  filterRow: { flexDirection: 'row', gap: 6, paddingBottom: 2 },

  body: { padding: 14 },

  groupLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#bbb',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },

  shiftItem: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    ...Shadows.card,
  },

  siTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 8,
  },
  siSite: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  siId: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  siBadge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 3 },
  siBadgeText: { fontSize: FontSizes.xs, fontWeight: '700' },

  siMeta: { flexDirection: 'row', gap: 14, paddingLeft: 8 },
  siMetaItem: { fontSize: FontSizes.xs, color: Colors.textSecondary },

  progressWrap: { marginTop: 10, paddingLeft: 8 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLbl: { fontSize: FontSizes.xs, color: Colors.textMuted },
  progressVal: { fontSize: FontSizes.xs, fontWeight: '700' },
  progressBar: {
    height: 3,
    backgroundColor: '#f0f0f5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },

  /* New Sign In Button */
  signInBtn: {
    marginTop: 14,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  signInText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
