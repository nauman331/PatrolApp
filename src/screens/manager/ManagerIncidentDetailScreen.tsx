import React, {
  type ComponentType,
  type ReactNode,
  useState,
  useCallback,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  ActivityIndicator,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSizes, Radii, Shadows } from '../../theme';
import {
  AlertTriangle,
  MapPin,
  Phone,
  Clock,
  User,
  Share2,
  Mail,
  CalendarDays,
  FileText,
  ShieldAlert,
  Users,
  Car,
  Eye,
  Siren,
  PenLine,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react-native';
import type { ManagerStackScreenProps } from '../../navigation/types';
import { ManagerStackHeader, ManagerStackListLayout, ManagerStackShell } from './managerShared';
import AuthErrorBanner from '../../components/AuthErrorBanner';
import ImageViewerModal from '../../components/ImageViewerModal';
import {
  ManagerIncidentDetailBodyShimmer,
  ManagerIncidentDetailHeaderShimmer,
} from '../../components/Shimmer';
import {
  getManagerIncidentDetail,
  mapSeverityColor,
  type ManagerIncidentDetailData,
} from '../../services/managerApi';
import { formatAppDateTime } from '../../services/incidentsMapper';
import { shareReport } from '../../services/managerReportActions';
import { DownloadButton } from '../../components/DownloadButton';

type Props = ManagerStackScreenProps<'ManagerIncidentDetail'>;

function capitalizeWord(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function isIdKey(key: string): boolean {
  const norm = key.trim().toLowerCase();
  return (
    norm === 'id' ||
    norm === 'guard_id' ||
    norm === 'guardid' ||
    norm === 'report_id' ||
    norm === 'reportid' ||
    norm === 'incident_id' ||
    norm === 'incidentid' ||
    norm === 'roster_id' ||
    norm === 'rosterid' ||
    norm === 'user_id' ||
    norm === 'userid' ||
    norm === 'job_id' ||
    norm === 'jobid' ||
    norm === 'site_id' ||
    norm === 'siteid' ||
    norm.endsWith('_id') ||
    norm.endsWith(' id')
  );
}

function getRecordEntries(record: Record<string, unknown>) {
  return Object.entries(record).filter(
    ([k, v]) => v != null && String(v).trim() !== '' && !isIdKey(k),
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  children: ReactNode;
}) {
  return (
    <View style={[styles.card, Shadows.card]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardIconWrap}>
          <Icon size={15} color={Colors.accent} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const LONG_FIELD_LABELS = [
  'description',
  'details',
  'notes',
  'action taken',
  'comments',
  'location details',
  'witness information',
  'other details',
  'address',
  'emergency detail',
  'statement',
  'damage details',
  'injury detail',
  'summary',
];

function isFullWidthField(label: string, value: string): boolean {
  const normLabel = label.toLowerCase().trim();
  if (LONG_FIELD_LABELS.some(l => normLabel.includes(l))) {
    return true;
  }
  if (value.length > 35 || value.includes('\n')) {
    return true;
  }
  return false;
}

function computeFallbackTruncation(text: string, limit: number = 65): string {
  const clean = text.replace(/[\r\n]+/g, ' ');
  if (clean.length <= limit) return clean;
  let sliced = clean.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > limit - 15 && lastSpace > 0) {
    sliced = sliced.slice(0, lastSpace);
  }
  return sliced.trimEnd() + '... ';
}

interface ExpandableTextProps {
  text: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

function ExpandableText({
  text,
  numberOfLines = 2,
  style,
  containerStyle,
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLikelyLong = Boolean(text && (text.length > 70 || text.includes('\n')));

  const [canExpand, setCanExpand] = useState(isLikelyLong);
  const [truncatedText, setTruncatedText] = useState<string | null>(() => {
    if (!text || !isLikelyLong) return null;
    return computeFallbackTruncation(text);
  });
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
    setMeasured(false);
    const long = Boolean(text && (text.length > 70 || text.includes('\n')));
    setCanExpand(long);
    setTruncatedText(long ? computeFallbackTruncation(text) : null);
  }, [text]);

  const handleTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      if (measured || isExpanded) return;
      const lines = e.nativeEvent.lines;
      if (!lines || lines.length === 0) return;

      if (lines.length > numberOfLines) {
        setCanExpand(true);
        setMeasured(true);

        const line1 = lines[0]?.text || '';
        const line2 = lines[1]?.text || '';

        const l1Clean = line1.replace(/[\r\n]+/g, ' ');
        const l2Clean = line2.replace(/[\r\n]+/g, ' ');

        const reserveChars = 14;
        let l2Trimmed = l2Clean.slice(0, Math.max(0, l2Clean.length - reserveChars));
        const lastSpace = l2Trimmed.lastIndexOf(' ');
        if (lastSpace > l2Trimmed.length - 10 && lastSpace > 0) {
          l2Trimmed = l2Trimmed.slice(0, lastSpace);
        }

        const preview = (l1Clean + l2Trimmed).trimEnd() + '... ';
        setTruncatedText(preview);
      } else {
        setCanExpand(false);
        setMeasured(true);
        setTruncatedText(null);
      }
    },
    [measured, isExpanded, numberOfLines],
  );

  if (!text || !text.trim()) {
    return null;
  }

  if (!canExpand) {
    return (
      <View style={[styles.expandableContainer, containerStyle]}>
        <Text style={style} onTextLayout={handleTextLayout}>
          {text}
        </Text>
      </View>
    );
  }

  if (isExpanded) {
    return (
      <View style={[styles.expandableContainer, containerStyle]}>
        <Text style={style}>{text}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsExpanded(false)}
          style={styles.expandToggleBtn}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.expandToggleText}>View Less</Text>
          <ChevronUp size={12} color={Colors.accent} />
        </TouchableOpacity>
      </View>
    );
  }

  const displayText = truncatedText ?? computeFallbackTruncation(text);

  return (
    <View style={[styles.expandableContainer, containerStyle]}>
      {!measured && (
        <Text
          style={[style, styles.hiddenMeasureText]}
          onTextLayout={handleTextLayout}
        >
          {text}
        </Text>
      )}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setIsExpanded(true)}
      >
        <Text style={style} numberOfLines={2}>
          {displayText}
          <Text style={styles.expandToggleTextInline}>
            {'View More'}
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function FieldGrid({
  entries,
}: {
  entries: { label: string; value: string }[];
}) {
  if (!entries.length) return null;

  return (
    <View style={styles.fieldGrid}>
      {entries.map(item => {
        const fullWidth = isFullWidthField(item.label, item.value);
        return (
          <View
            style={[styles.fieldCell, fullWidth && styles.fieldCellFull]}
            key={item.label}
          >
            <Text style={styles.fieldLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <ExpandableText text={item.value} style={styles.fieldValue} />
          </View>
        );
      })}
    </View>
  );
}

function RecordFields({ record }: { record: Record<string, unknown> }) {
  const entries = getRecordEntries(record).map(([key, val]) => ({
    label: formatFieldLabel(key),
    value: String(val),
  }));

  return <FieldGrid entries={entries} />;
}

function RecordList({ records }: { records: Record<string, unknown>[] }) {
  const blocks = records
    .map(record => getRecordEntries(record))
    .filter(entries => entries.length > 0);

  if (!blocks.length) return null;

  return (
    <View style={styles.recordList}>
      {blocks.map((entries, index) => (
        <View
          key={index}
          style={[styles.recordItem, index > 0 && styles.recordItemSpaced]}
        >
          <FieldGrid
            entries={entries.map(([key, val]) => ({
              label: formatFieldLabel(key),
              value: String(val),
            }))}
          />
        </View>
      ))}
    </View>
  );
}

function parseRecordArray(data: unknown): Record<string, unknown>[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.filter(
      item => item && typeof item === 'object' && !Array.isArray(item),
    ) as Record<string, unknown>[];
  }
  if (typeof data === 'object') {
    return [data as Record<string, unknown>];
  }
  return [];
}

export default function ManagerIncidentDetailScreen({ route }: Props) {
  const { incidentId } = route.params;
  const [data, setData] = useState<ManagerIncidentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const [sharing, setSharing] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isBusy = sharing || emailing || downloading;

  const handleShare = useCallback(async () => {
    if (isBusy || !data) return;
    setSharing(true);
    try {
      await shareReport(
        'incident',
        data,
        'share',
        undefined,
        () => setSharing(false),
      );
    } catch (err) {
      console.error('Share incident report failed:', err);
    } finally {
      setSharing(false);
    }
  }, [data, isBusy]);

  const handleEmail = useCallback(async () => {
    if (isBusy || !data) return;
    setEmailing(true);
    try {
      await shareReport(
        'incident',
        data,
        'email',
        undefined,
        () => setEmailing(false),
      );
    } catch (err) {
      console.error('Email incident report failed:', err);
    } finally {
      setEmailing(false);
    }
  }, [data, isBusy]);

  const fetchDetail = useCallback(async () => {
    setError(null);
    const result = await getManagerIncidentDetail(incidentId);

    if (result.success && result.data) {
      setData(result.data);
    } else {
      setData(null);
      setError(result.message ?? 'Failed to load incident');
    }

    setLoading(false);
    setRefreshing(false);
  }, [incidentId]);

  useFocusEffect(
    useCallback(() => {
      fetchDetail();
    }, [fetchDetail]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail();
  }, [fetchDetail]);

  const severityColor = data ? mapSeverityColor(data.severity) : Colors.textMuted;
  const showShimmer = loading && !data;

  const peopleInvolved = data ? parseRecordArray(data.people_involved) : [];
  const vehicles = data ? parseRecordArray(data.vehicle) : [];
  const witnesses = data ? parseRecordArray(data.witness) : [];
  const emergencyServices = data ? parseRecordArray(data.emergency_services) : [];

  const summaryEntries = data
    ? [
      { label: 'Incident Title', value: data.title },
      {
        label: 'Incident Date',
        value: formatAppDateTime(data.incident_date || data.location_date, data.incident_time || data.time),
      },
      { label: 'Severity', value: capitalizeWord(data.severity || 'Medium') },
      { label: 'Guard Name', value: data.guard_name },
      { label: 'Guard Phone', value: data.guard_phone },
      { label: 'Site Name', value: data.site_name },
      { label: 'Injury Type', value: data.injury_type },
      { label: 'Reported Date', value: formatAppDateTime(data.created_at) },
    ].filter(e => e.value != null && String(e.value).trim() !== '')
    : [];

  return (
    <ManagerStackShell
      header={
        <ManagerStackHeader
          title="Incident Report"
          subtitle={data ? formatAppDateTime(data.location_date) : 'Incident Report'}
        />
      }
    >
      <ManagerStackListLayout
        refreshing={refreshing}
        onRefresh={onRefresh}
        fixedContent={
          <>
            {error ? <AuthErrorBanner message={error} /> : null}
            {showShimmer ? (
              <View style={{ marginTop: 18 }}>
                <ManagerIncidentDetailHeaderShimmer />
              </View>
            ) : data ? (
              <View style={[styles.heroCard, Shadows.card, { borderLeftColor: severityColor }]}>
                <View style={styles.heroTopLine}>
                  <View style={[styles.severityBadge, { backgroundColor: `${severityColor}18` }]}>
                    <Text style={[styles.severityText, { color: severityColor }]}>
                      {capitalizeWord(data.severity || 'Medium')}
                    </Text>
                  </View>
                  <Text style={styles.siteName} numberOfLines={1}>
                    {data.site_name}
                  </Text>
                </View>

                <View style={styles.heroTitleRow}>
                  <View style={[styles.iconWrap, { backgroundColor: `${severityColor}18` }]}>
                    <AlertTriangle size={16} color={severityColor} />
                  </View>
                  <Text style={styles.heroTitle}>{data.title}</Text>
                </View>

                {data.injury_type ? (
                  <Text style={styles.injuryType}>{formatFieldLabel(data.injury_type)}</Text>
                ) : null}

                {data.injury_detail ? (
                  <ExpandableText
                    text={data.injury_detail}
                    numberOfLines={2}
                    style={styles.injuryDetail}
                    containerStyle={styles.injuryDetailWrap}
                  />
                ) : data.summary_text ? (
                  <ExpandableText
                    text={data.summary_text}
                    numberOfLines={2}
                    style={styles.injuryDetail}
                    containerStyle={styles.injuryDetailWrap}
                  />
                ) : null}

                <View style={styles.heroMeta}>
                  <View style={styles.metaChip}>
                    <Users size={11} color={Colors.accent} />
                    <Text style={styles.metaChipText}>
                      {peopleInvolved.length} {peopleInvolved.length === 1 ? 'person' : 'people'}
                    </Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Car size={11} color={Colors.accent} />
                    <Text style={styles.metaChipText}>
                      {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'}
                    </Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Eye size={11} color={Colors.accent} />
                    <Text style={styles.metaChipText}>
                      {witnesses.length} {witnesses.length === 1 ? 'witness' : 'witnesses'}
                    </Text>
                  </View>
                  <View style={styles.metaChip}>
                    <CalendarDays size={11} color={Colors.accent} />
                    <Text style={styles.metaChipText}>
                      {formatAppDateTime(data.incident_date || data.location_date, data.incident_time || data.time)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {data ? (
              <View style={styles.actionRow}>
                <DownloadButton
                  label="Download"
                  style={{ flex: 1 }}
                  disabled={isBusy}
                  onDownload={async (onProgress) => {
                    setDownloading(true);
                    try {
                      return await shareReport('incident', data, 'download', onProgress);
                    } finally {
                      setDownloading(false);
                    }
                  }}
                />
                <TouchableOpacity
                  style={[styles.actionBtn, Shadows.card, isBusy && styles.actionBtnDisabled]}
                  onPress={handleShare}
                  disabled={isBusy}
                  activeOpacity={0.8}
                >
                  {sharing ? (
                    <ActivityIndicator size="small" color={Colors.accent} />
                  ) : (
                    <>
                      <Share2 size={15} color={Colors.accent} />
                      <Text style={styles.actionBtnText}>Share</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, Shadows.card, isBusy && styles.actionBtnDisabled]}
                  onPress={handleEmail}
                  disabled={isBusy}
                  activeOpacity={0.8}
                >
                  {emailing ? (
                    <ActivityIndicator size="small" color={Colors.accent} />
                  ) : (
                    <>
                      <Mail size={15} color={Colors.accent} />
                      <Text style={styles.actionBtnText}>Email</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        }
      >
        {showShimmer ? (
          <ManagerIncidentDetailBodyShimmer />
        ) : data ? (
          <>
            {summaryEntries.length > 0 ? (
              <SectionCard title="Summary" icon={FileText}>
                <FieldGrid entries={summaryEntries} />
              </SectionCard>
            ) : null}

            <SectionCard title="Guard Information" icon={User}>
              <View style={styles.guardInfoBox}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconBox}>
                    <User size={13} color={Colors.accent} />
                  </View>
                  <Text style={styles.detailText}>{data.guard_name}</Text>
                </View>

                {data.guard_phone ? (
                  <TouchableOpacity
                    style={styles.detailRow}
                    onPress={() => Linking.openURL(`tel:${data.guard_phone}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.detailIconBox}>
                      <Phone size={13} color={Colors.accent} />
                    </View>
                    <Text style={[styles.detailText, { color: Colors.accent }]}>
                      {data.guard_phone}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.detailRow}>
                  <View style={styles.detailIconBox}>
                    <MapPin size={13} color={Colors.accent} />
                  </View>
                  <Text style={styles.detailText}>{data.site_name}</Text>
                </View>
              </View>
            </SectionCard>

            {peopleInvolved.length > 0 ? (
              <SectionCard
                title={`People Involved (${peopleInvolved.length})`}
                icon={Users}
              >
                <RecordList records={peopleInvolved} />
              </SectionCard>
            ) : null}

            {vehicles.length > 0 ? (
              <SectionCard
                title={`Vehicles (${vehicles.length})`}
                icon={Car}
              >
                <RecordList records={vehicles} />
              </SectionCard>
            ) : null}

            {witnesses.length > 0 ? (
              <SectionCard
                title={`Witnesses (${witnesses.length})`}
                icon={Eye}
              >
                <RecordList records={witnesses} />
              </SectionCard>
            ) : null}

            {emergencyServices.length > 0 ? (
              <SectionCard title="Emergency Services" icon={Siren}>
                <RecordList records={emergencyServices} />
              </SectionCard>
            ) : null}

            {(data.photos ?? []).length > 0 ? (
              <SectionCard title="Photos" icon={ShieldAlert}>
                <View style={styles.photoGrid}>
                  {data.photos.map((photo, index) => (
                    <TouchableOpacity
                      key={`${photo.url}-${index}`}
                      style={styles.photoCell}
                      onPress={() => {
                        if (photo.url) {
                          setViewerUri(photo.url);
                          setViewerVisible(true);
                        }
                      }}
                      disabled={!photo.url}
                      activeOpacity={0.8}
                    >
                      {photo.url ? (
                        <Image
                          source={{ uri: photo.url }}
                          style={styles.photo}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.photoPlaceholder}>
                          <Text
                            style={styles.photoPlaceholderText}
                            numberOfLines={2}
                          >
                            No Image
                          </Text>
                        </View>
                      )}
                      {photo.timestamp ? (
                        <Text style={styles.photoTs} numberOfLines={1}>
                          {formatAppDateTime(photo.timestamp)}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              </SectionCard>
            ) : null}

            {data.signature ? (
              <SectionCard title="Signature" icon={PenLine}>
                <View style={styles.signatureCardContainer}>
                  <View style={styles.signatureHeaderBadge}>
                    <CheckCircle2 size={12} color={Colors.success} />
                    <Text style={styles.signatureBadgeText}>Verified Signature</Text>
                  </View>
                  <Image
                    source={{ uri: data.signature }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                </View>
              </SectionCard>
            ) : null}

            <Text style={styles.createdAt}>
              Reported {formatAppDateTime(data.created_at)}
            </Text>
          </>
        ) : null}
      </ManagerStackListLayout>

      <ImageViewerModal
        visible={viewerVisible}
        uri={viewerUri}
        onClose={() => setViewerVisible(false)}
      />
    </ManagerStackShell>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    marginTop: 14,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  siteName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    flex: 1,
    textAlign: 'right',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  severityText: {
    fontSize: 9,
    fontWeight: '800',
  },
  injuryType: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.accent,
    marginTop: 2,
    marginBottom: 4,
  },
  injuryDetailWrap: {
    marginTop: 2,
    marginBottom: 8,
  },
  injuryDetail: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.pill,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgCard,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionBtnDisabled: {
    opacity: 0.7,
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardIconWrap: {
    width: 26,
    height: 26,
    borderRadius: Radii.sm,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  guardInfoBox: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldCell: {
    width: '48.5%',
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldCellFull: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  recordList: {
    gap: 8,
  },
  recordItem: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.md,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recordItemSpaced: {
    marginTop: 4,
  },

  expandableContainer: {
    width: '100%',
  },
  hiddenMeasureText: {
    position: 'absolute',
    opacity: 0,
    left: -9999,
  },
  expandToggleTextInline: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: 11,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
  },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoCell: {
    width: '31%',
    height: 84,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  photoPlaceholderText: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  photoTs: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    fontSize: 8,
    color: Colors.white,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 2,
  },

  signatureCardContainer: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.md,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  signatureHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  signatureBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
  signatureImage: {
    width: '100%',
    height: 100,
    borderRadius: Radii.sm,
    backgroundColor: Colors.white,
  },

  createdAt: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
});
