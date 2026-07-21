import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
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
  FileText,
} from 'lucide-react-native';
import { useGuardNavigation } from '../navigation/utils';
import { getActiveShiftSession } from '../services/activeShiftSession';
import { STORAGE_BASE_URL } from '../config/env';
import { GUARD_ROUTES } from '../navigation/constants';
import { getGuardDashboardData } from '../services/guardApi';
import { SopListShimmer } from '../components/Shimmer';

type SopItem = {
  id: string;
  title: string;
  category: string;
  url: string;
};

export default function GuardSopsScreen() {
  const navigation = useGuardNavigation();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<SopItem[]>([]);

  useEffect(() => {
    (async () => {
      let siteInfo: any = null;

      // 1. Try active session first
      const session = await getActiveShiftSession();
      if (session?.siteInfo) {
        siteInfo = session.siteInfo;
      }

      // 2. Always fetch dashboard data to get the most recent SOPs if session doesn't have them
      // or if we want to ensure we have the latest links
      const dash = await getGuardDashboardData();
      if (dash.success && dash.data?.today_jobs?.length) {
        const jobs = dash.data.today_jobs;
        // Find active shift first, then ready, then just the first one
        const activeJob =
          jobs.find((j: any) => String(j.status).toLowerCase() === 'active') ||
          jobs.find((j: any) => String(j.status).toLowerCase() === 'ready') ||
          jobs[0];

        if (activeJob) {
          const apiSiteInfo = {
            emergency_procedures: activeJob.emergency_procedures,
            patrol_checkpoints: activeJob.patrol_checkpoints,
            incident_reporting_guide: activeJob.incident_reporting_guide,
            nfc_scan_protocol: activeJob.nfc_scan_protocol,
            site_map: activeJob.site_map,
            work_instruction: activeJob.work_instruction,
            health_safety_policy: activeJob.health_safety_policy,
          };

          // If session doesn't have info, or API has more/different info, use API
          if (!siteInfo || Object.values(apiSiteInfo).some(v => v && !siteInfo[v as string])) {
            siteInfo = { ...siteInfo, ...apiSiteInfo };
          }
        }
      }

      if (siteInfo) {
        const info = siteInfo as Record<string, any>;
        const list: SopItem[] = [];

        const docConfig = [
          {
            key: 'emergency_procedures',
            title: 'Emergency Procedures',
            category: 'Emergency',
          },
          {
            key: 'patrol_checkpoints',
            title: 'Patrol Checkpoints',
            category: 'Patrol',
          },
          {
            key: 'incident_reporting_guide',
            title: 'Incident Reporting Guide',
            category: 'Incidents',
          },
          {
            key: 'nfc_scan_protocol',
            title: 'NFC Scan Protocol',
            category: 'Security',
          },
          {
            key: 'site_map',
            title: 'Site Map',
            category: 'Patrol',
          },
          {
            key: 'work_instruction',
            title: 'Work Instruction',
            category: 'Security',
          },
          {
            key: 'health_safety_policy',
            title: 'Health & Safety Policy',
            category: 'Security',
          },
        ];

        docConfig.forEach(cfg => {
          const val = info[cfg.key];
          if (val && typeof val === 'string' && val.trim()) {
            list.push({
              id: cfg.key,
              title: cfg.title,
              category: cfg.category,
              url: val.startsWith('http') ? val : `${STORAGE_BASE_URL}/${val}`,
            });
          }
        });

        // Also catch any other fields that look like documents but aren't in our config
        Object.entries(info).forEach(([key, val]) => {
          if (
            key === 'site_id' ||
            typeof val !== 'string' ||
            !val ||
            docConfig.some(c => c.key === key)
          ) {
            return;
          }

          const lowerVal = val.toLowerCase();
          const lowerKey = key.toLowerCase();

          if (
            lowerVal.endsWith('.pdf') ||
            lowerVal.endsWith('.doc') ||
            lowerVal.endsWith('.docx') ||
            lowerKey.includes('_doc') ||
            lowerKey.includes('_guide') ||
            lowerKey.includes('_manual') ||
            lowerKey.includes('procedures')
          ) {
            const title = key
              .split('_')
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');
            list.push({
              id: key,
              title,
              category: 'Other',
              url: val.startsWith('http') ? val : `${STORAGE_BASE_URL}/${val}`,
            });
          }
        });

        setDocs(list);
      }
      setLoading(false);
    })();
  }, []);

  const openDoc = (doc: SopItem) => {
    navigation.navigate(GUARD_ROUTES.PDF_VIEWER, {
      uri: doc.url,
      title: doc.title,
    });
  };

  const categoryIcon: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
    Security: Shield,
    Patrol: ClipboardList,
    Incidents: Siren,
    Emergency: Siren,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.hdrTitle}>SOP Documents</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.safeBody} edges={['bottom']}>
        {loading ? (
          <View style={styles.bodyContent}>
            <SopListShimmer count={5} />
          </View>
        ) : (
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {docs.length > 0 ? (
              <>
                <Text style={styles.intro}>
                  Review site SOPs and procedures for your current active site.
                </Text>

                {docs.map(doc => {
                  const Icon = categoryIcon[doc.category] ?? FileText;
                  return (
                    <TouchableOpacity
                      key={doc.id}
                      style={[styles.card, Shadows.card]}
                      activeOpacity={0.8}
                      onPress={() => openDoc(doc)}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.iconWrap}>
                          <Icon size={18} color={Colors.accent} />
                        </View>
                        <View style={styles.cardMain}>
                          <Text style={styles.cardTitle} numberOfLines={2}>
                            {doc.title}
                          </Text>
                          <Text style={styles.category}>{doc.category}</Text>
                        </View>
                        <ChevronRight size={20} color={Colors.textMuted} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            ) : (
              <View style={styles.empty}>
                <FileText size={48} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No SOP documents available for this site.</Text>
              </View>
            )}
          </ScrollView>
        )}
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  bodyContent: { padding: 14, paddingBottom: 28 },
  intro: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMain: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
