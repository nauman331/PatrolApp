import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import { Search, ChevronRight, Filter } from 'lucide-react-native';
import { useManagerNavigation } from '../../navigation/utils';
import { MANAGER_ROUTES } from '../../navigation/constants';
import {
  ManagerTabShell,
  ManagerHeader,
  MANAGER_TAB_INDEX,
  sharedStyles,
} from './managerShared';

type GuardStatus = 'on' | 'idle' | 'off';

interface GuardItem {
  id: string;
  initials: string;
  name: string;
  site: string;
  shift: string;
  status: GuardStatus;
  avatarBg: string;
  avatarColor: string;
}

const GUARDS: GuardItem[] = [
  { id: '1', initials: 'AK', name: 'Ahmed Khan', site: 'Mall of Lahore', shift: '06:00 – 14:00', status: 'on', avatarBg: '#fff3ed', avatarColor: '#d45a1a' },
  { id: '2', initials: 'MR', name: 'Muhammad Raza', site: 'DHA Clinic Block', shift: '06:00 – 14:00', status: 'on', avatarBg: '#e8f0fe', avatarColor: '#1a56db' },
  { id: '3', initials: 'ZA', name: 'Zara Ali', site: 'Packages Mall', shift: '14:00 – 22:00', status: 'idle', avatarBg: '#fde8e8', avatarColor: '#c53030' },
  { id: '4', initials: 'HB', name: 'Hassan Baig', site: 'Packages Mall', shift: '22:00 – 06:00', status: 'off', avatarBg: '#e8f8f0', avatarColor: '#2e7d52' },
  { id: '5', initials: 'AR', name: 'Ali Raza', site: 'Mall of Lahore', shift: '14:00 – 22:00', status: 'on', avatarBg: '#fef3c7', avatarColor: '#b45309' },
];

const FILTERS = ['All', 'On Duty', 'Idle', 'Off Duty'] as const;

const statusLabel: Record<GuardStatus, string> = {
  on: 'On Duty',
  idle: 'On Break',
  off: 'Off Duty',
};

const statusColor: Record<GuardStatus, string> = {
  on: Colors.success,
  idle: Colors.warning,
  off: Colors.textMuted,
};

export default function ManagerGuardsScreen() {
  const navigation = useManagerNavigation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  const filtered = GUARDS.filter(g => {
    const matchesQuery =
      g.name.toLowerCase().includes(query.toLowerCase()) ||
      g.site.toLowerCase().includes(query.toLowerCase());
    const matchesFilter =
      filter === 'All' ||
      (filter === 'On Duty' && g.status === 'on') ||
      (filter === 'Idle' && g.status === 'idle') ||
      (filter === 'Off Duty' && g.status === 'off');
    return matchesQuery && matchesFilter;
  });

  return (
    <ManagerTabShell activeIndex={MANAGER_TAB_INDEX.GUARDS}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <ManagerHeader
          title="Guards"
          subtitle={`${GUARDS.filter(g => g.status === 'on').length} on duty · ${GUARDS.length} total`}
        />

        <View style={[sharedStyles.body, { marginTop: -10 }]}>
          <View style={[styles.searchRow, Shadows.card]}>
            <Search size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search guards or sites..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
            />
            <TouchableOpacity style={styles.filterBtn}>
              <Filter size={14} color="#1a56db" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <View style={sharedStyles.chipRow}>
              {FILTERS.map(f => (
                <TouchableOpacity
                  key={f}
                  style={[
                    sharedStyles.chip,
                    filter === f && sharedStyles.chipActive,
                  ]}
                  onPress={() => setFilter(f)}
                >
                  <Text
                    style={[
                      sharedStyles.chipText,
                      filter === f && sharedStyles.chipTextActive,
                    ]}
                  >
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {filtered.map(g => (
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
              <View style={[styles.avatar, { backgroundColor: g.avatarBg }]}>
                <Text style={[styles.avatarText, { color: g.avatarColor }]}>
                  {g.initials}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{g.name}</Text>
                <Text style={styles.site}>{g.site}</Text>
                <Text style={styles.shift}>{g.shift}</Text>
              </View>
              <View style={styles.right}>
                <View style={[styles.badge, { backgroundColor: `${statusColor[g.status]}18` }]}>
                  <View style={[styles.dot, { backgroundColor: statusColor[g.status] }]} />
                  <Text style={[styles.badgeText, { color: statusColor[g.status] }]}>
                    {statusLabel[g.status]}
                  </Text>
                </View>
                <ChevronRight size={16} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ManagerTabShell>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    padding: 0,
  },
  filterBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: { marginBottom: 4 },
  guardRow: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '800' },
  name: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  site: { fontSize: FontSizes.xs, color: Colors.textMuted, marginTop: 1 },
  shift: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 9, fontWeight: '700' },
});
