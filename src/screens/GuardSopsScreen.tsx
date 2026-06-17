import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Shield,
  Siren,
} from 'lucide-react-native';
import { useGuardNavigation } from '../navigation/utils';

type SopItem = {
  id: string;
  title: string;
  category: string;
  summary: string;
  updated: string;
};

const DUMMY_SOPS: SopItem[] = [
  {
    id: '1',
    title: 'Site Access Control',
    category: 'Security',
    summary:
      'Verify visitor IDs, log entries, and escort unauthorized persons off premises immediately.',
    updated: '12 Apr 2026',
  },
  {
    id: '2',
    title: 'Patrol Route Checklist',
    category: 'Patrol',
    summary:
      'Follow assigned route sequence, scan NFC tags at each checkpoint, and report anomalies.',
    updated: '10 Apr 2026',
  },
  {
    id: '3',
    title: 'Incident Reporting',
    category: 'Incidents',
    summary:
      'Secure the area, notify supervisor, capture photos, and submit incident report within 30 minutes.',
    updated: '08 Apr 2026',
  },
  {
    id: '4',
    title: 'Emergency Evacuation',
    category: 'Emergency',
    summary:
      'Activate alarm, guide occupants to assembly point, and coordinate with emergency services.',
    updated: '05 Apr 2026',
  },
  {
    id: '5',
    title: 'Shift Handover',
    category: 'Operations',
    summary:
      'Brief incoming guard on active incidents, keys, equipment status, and pending tasks.',
    updated: '01 Apr 2026',
  },
  {
    id: '6',
    title: 'Use of Force Policy',
    category: 'Security',
    summary:
      'Use minimum force necessary. De-escalate first. Document all incidents involving physical contact.',
    updated: '28 Mar 2026',
  },
];

const categoryIcon: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Security: Shield,
  Patrol: ClipboardList,
  Incidents: Siren,
  Emergency: Siren,
  Operations: BookOpen,
};

export default function GuardSopsScreen() {
  const navigation = useGuardNavigation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openSop = (sop: SopItem) => {
    setExpandedId(prev => (prev === sop.id ? null : sop.id));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.hdrTitle}>Standard Procedures</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.safeBody} edges={['bottom']}>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>
            Review site SOPs before starting your shift. Tap a procedure to read details.
          </Text>

          {DUMMY_SOPS.map(sop => {
            const Icon = categoryIcon[sop.category] ?? BookOpen;
            const expanded = expandedId === sop.id;

            return (
              <TouchableOpacity
                key={sop.id}
                style={[styles.card, Shadows.card]}
                activeOpacity={0.88}
                onPress={() => openSop(sop)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconWrap}>
                    <Icon size={16} color={Colors.accent} />
                  </View>
                  <View style={styles.cardMain}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {sop.title}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.category}>{sop.category}</Text>
                      <Text style={styles.updated}>Updated {sop.updated}</Text>
                    </View>
                  </View>
                  <ChevronRight
                    size={18}
                    color={Colors.textMuted}
                    style={expanded ? styles.chevronOpen : undefined}
                  />
                </View>
                {expanded ? (
                  <Text style={styles.summary}>{sop.summary}</Text>
                ) : (
                  <Text style={styles.summaryPreview} numberOfLines={2}>
                    {sop.summary}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={() =>
              Alert.alert('Coming soon', 'SOP document downloads will be available soon.')
            }
          >
            <Text style={styles.downloadText}>Download All SOPs (PDF)</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.headerStart },
  safeTop: { backgroundColor: Colors.headerStart },
  safeBody: { flex: 1, backgroundColor: Colors.bgAlt },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hdrTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
  },
  headerSpacer: { width: 36 },
  body: { flex: 1 },
  bodyContent: { padding: 14, paddingBottom: 28 },
  intro: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  category: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.accent,
  },
  updated: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  summaryPreview: {
    marginTop: 10,
    marginLeft: 46,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  summary: {
    marginTop: 10,
    marginLeft: 46,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  downloadBtn: {
    marginTop: 8,
    backgroundColor: Colors.accent,
    borderRadius: Radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  downloadText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },
});
