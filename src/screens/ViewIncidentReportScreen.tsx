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

  ScrollView,

  StatusBar,

  Image,

  Linking,

  ActivityIndicator,

  type NativeSyntheticEvent,

  type TextLayoutEventData,

  type StyleProp,

  type TextStyle,

  type ViewStyle,

} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useRoute } from '@react-navigation/native';

import {

  ArrowLeft,

  CalendarDays,

  Clock,

  FileText,

  MapPin,

  ShieldAlert,

  Users,

  Car,

  Eye,

  Siren,

  PenLine,

  ChevronDown,

  ChevronUp,

} from 'lucide-react-native';

import { Colors, FontSizes, Radii, Shadows } from '../theme';

import { useGuardNavigation, useSafeAreaTopInset } from '../navigation/utils';

import type { GuardStackScreenProps } from '../navigation/types';

import { useAppSelector } from '../store/hooks';

import { selectIncidentById } from '../store/slices/incidentsSlice';

import {
  getIncidentListMeta,
  formatAppDateTime,
  type MappedIncident,
} from '../services/incidentsMapper';

import { downloadIncidentPdf } from '../services/incidentPdfDownload';
import ImageViewerModal from '../components/ImageViewerModal';
import { DownloadButton } from '../components/DownloadButton';

type ViewIncidentRoute = GuardStackScreenProps<'ViewIncidentReport'>['route'];



function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}



function getRecordEntries(record: Record<string, unknown>) {

  return Object.entries(record).filter(

    ([, v]) => v != null && String(v).trim() !== '',

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



export default function ViewIncidentReportScreen() {

  const navigation = useGuardNavigation();
  const topInset = useSafeAreaTopInset();

  const route = useRoute<ViewIncidentRoute>();

  const incident = useAppSelector(selectIncidentById(route.params.incidentId));

  const [isGenerating, setIsGenerating] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDownloadPdf = async () => {
    if (!incident || isGenerating) return;
    setIsGenerating(true);
    try {
      await downloadIncidentPdf(incident);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!incident) {

    return (

      <View style={styles.container}>

        <View style={[styles.safeTop, { paddingTop: topInset }]}>

          <View style={styles.header}>

            <TouchableOpacity onPress={() => navigation.goBack()}>

              <ArrowLeft size={20} color={Colors.white} />

            </TouchableOpacity>

            <Text style={styles.headerTitle}>Incident Report</Text>

            <View style={{ width: 20 }} />

          </View>

        </View>

        <SafeAreaView style={styles.safeBody} edges={['bottom']}>

          <View style={styles.missingBox}>

            <Text style={styles.missingText}>Report not found.</Text>

            <TouchableOpacity onPress={() => navigation.goBack()}>

              <Text style={styles.linkText}>Go back</Text>

            </TouchableOpacity>

          </View>

        </SafeAreaView>

      </View>

    );

  }



  const emergency = incident.emergencyServices as Record<string, unknown>;

  const emergencyEntries = [

    { label: 'Type', value: String(emergency.emergency_type ?? '') },

    { label: 'Address', value: String(emergency.address ?? '') },

    { label: 'Detail', value: String(emergency.emergency_detail ?? '') },

  ].filter(e => e.value.trim());



  const peopleCount = incident.peopleCount ?? incident.peopleInvolved.length;
  const vehiclesCount = incident.vehiclesCount ?? incident.vehicles.length;
  const witnessesCount = incident.witnessesCount ?? incident.witnesses.length;

  const summaryEntries = [
    { label: 'Report ID', value: String(incident.id) },
    { label: 'People involved', value: String(peopleCount) },
    { label: 'Vehicles', value: String(vehiclesCount) },
    { label: 'Witnesses', value: String(witnessesCount) },
    { label: 'Injury type', value: incident.injuryType },
    { label: 'Details', value: incident.injuryDetail },
    { label: 'Created', value: formatAppDateTime(incident.createdAt) },
  ].filter(
    e =>
      e.label === 'People involved' ||
      e.label === 'Vehicles' ||
      e.label === 'Witnesses' ||
      e.label === 'Report ID' ||
      e.value.trim().length > 0,
  );



  return (

    <View style={styles.container}>

      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />



      <View style={[styles.safeTop, { paddingTop: topInset }]}>

        <View style={styles.header}>

          <TouchableOpacity onPress={() => navigation.goBack()}>

            <ArrowLeft size={20} color={Colors.white} />

          </TouchableOpacity>

          <Text style={styles.headerTitle}>Incident Report</Text>

          <View style={{ width: 20 }} />

        </View>

      </View>



      <SafeAreaView style={styles.safeBody} edges={['bottom']}>

        <ScrollView

          style={styles.body}

          contentContainerStyle={styles.bodyContent}

          showsVerticalScrollIndicator={false}

        >

          <View style={[styles.heroCard, Shadows.card]}>

            <Text style={styles.siteName} numberOfLines={2}>

              {incident.siteName}

            </Text>

            <Text style={styles.injuryType}>{incident.injuryType}</Text>

            {incident.injuryDetail ? (

              <ExpandableText

                text={incident.injuryDetail}

                numberOfLines={2}

                style={styles.injuryDetail}

                containerStyle={styles.injuryDetailWrap}

              />

            ) : null}

            <View style={styles.heroMeta}>
              <View style={styles.metaChip}>
                <Users size={11} color={Colors.accent} />
                <Text style={styles.metaChipText}>
                  {peopleCount} {peopleCount === 1 ? 'person' : 'people'}
                </Text>
              </View>
              <View style={styles.metaChip}>
                <Car size={11} color={Colors.accent} />
                <Text style={styles.metaChipText}>
                  {vehiclesCount}{' '}
                  {vehiclesCount === 1 ? 'vehicle' : 'vehicles'}
                </Text>
              </View>
              <View style={styles.metaChip}>
                <Eye size={11} color={Colors.accent} />
                <Text style={styles.metaChipText}>
                  {witnessesCount}{' '}
                  {witnessesCount === 1 ? 'witness' : 'witnesses'}
                </Text>
              </View>
              <View style={styles.metaChip}>
                <CalendarDays size={11} color={Colors.accent} />
                <Text style={styles.metaChipText}>
                  {formatAppDateTime(incident.incidentDate, incident.incidentTime)}
                </Text>
              </View>
              <View style={styles.metaChip}>
                <MapPin size={11} color={Colors.accent} />
                <Text style={styles.metaChipText}>
                  Roster {incident.rosterId ?? '—'}
                </Text>
              </View>
            </View>

          </View>



          {summaryEntries.length > 0 ? (

            <SectionCard title="Summary" icon={FileText}>

              <FieldGrid entries={summaryEntries} />

            </SectionCard>

          ) : null}



          {incident.peopleInvolved.length > 0 ? (

            <SectionCard
              title={`People Involved (${peopleCount})`}
              icon={Users}
            >

              <RecordList records={incident.peopleInvolved} />

            </SectionCard>

          ) : null}



          {incident.vehicles.length > 0 ? (

            <SectionCard title={`Vehicles (${vehiclesCount})`} icon={Car}>

              <RecordList records={incident.vehicles} />

            </SectionCard>

          ) : null}



          {incident.witnesses.length > 0 ? (
            <SectionCard title={`Witnesses (${witnessesCount})`} icon={Eye}>

              <RecordList records={incident.witnesses} />

            </SectionCard>

          ) : null}



          {emergencyEntries.length > 0 ? (

            <SectionCard title="Emergency Services" icon={Siren}>

              <FieldGrid entries={emergencyEntries} />

            </SectionCard>

          ) : null}



          {incident.photos.length > 0 ? (

            <SectionCard title="Photos" icon={ShieldAlert}>

              <View style={styles.photoGrid}>

                {incident.photos.map(

                  (photo: MappedIncident['photos'][number], i: number) => (

                    <TouchableOpacity

                      key={`${photo.imgPath}-${i}`}

                      style={styles.photoCell}

                      onPress={() => {

                        if (photo.uri) {
                          setSelectedImage(photo.uri);
                          setViewerVisible(true);
                        }

                      }}

                      disabled={!photo.uri}

                    >

                      {photo.uri ? (

                        <Image

                          source={{ uri: photo.uri }}

                          style={styles.photo}

                          resizeMode="cover"

                        />

                      ) : (

                        <View style={styles.photoPlaceholder}>

                          <Text

                            style={styles.photoPlaceholderText}

                            numberOfLines={2}

                          >

                            {photo.imgPath}

                          </Text>

                        </View>

                      )}

                    </TouchableOpacity>

                  ),

                )}

              </View>

            </SectionCard>

          ) : null}



          {incident.signatureUri ? (

            <SectionCard title="Signature" icon={PenLine}>

              <Image

                source={{ uri: incident.signatureUri }}

                style={styles.signatureImage}

                resizeMode="contain"

              />

            </SectionCard>

          ) : incident.signature ? (

            <SectionCard title="Signature" icon={PenLine}>

              <Text style={styles.fieldValue}>{incident.signature}</Text>

            </SectionCard>

          ) : null}



        </ScrollView>

      </SafeAreaView>

      <ImageViewerModal
        visible={viewerVisible}
        uri={selectedImage}
        onClose={() => setViewerVisible(false)}
      />

    </View>

  );

}



const GRID_GAP = 8;



const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: Colors.headerStart },

  safeTop: { backgroundColor: Colors.headerStart },

  safeBody: { flex: 1, backgroundColor: Colors.bgAlt },

  header: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: 16,

    paddingVertical: 12,

    backgroundColor: Colors.headerStart,

  },

  headerTitle: {

    fontSize: 17,

    fontWeight: '800',

    color: Colors.white,

  },

  body: { flex: 1 },

  bodyContent: { padding: 14, paddingBottom: 24 },

  missingBox: {

    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    gap: 12,

  },

  missingText: { fontSize: FontSizes.md, color: Colors.textPrimary },

  linkText: { color: Colors.accent, fontWeight: '700' },

  heroCard: {

    backgroundColor: Colors.bgCard,

    borderRadius: Radii.lg,

    padding: 14,

    marginBottom: 10,

  },

  siteName: {

    fontSize: FontSizes.lg,

    fontWeight: '800',

    color: Colors.textPrimary,

    marginBottom: 4,

  },

  injuryType: {

    fontSize: FontSizes.sm,

    fontWeight: '700',

    color: Colors.accent,

    marginBottom: 6,

  },

  injuryDetail: {

    fontSize: FontSizes.sm,

    color: Colors.textSecondary,

    lineHeight: 18,

    marginBottom: 10,

  },

  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },

  metaChip: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    backgroundColor: Colors.bgAlt,

    paddingHorizontal: 8,

    paddingVertical: 5,

    borderRadius: Radii.pill,

  },

  metaChipText: {

    fontSize: FontSizes.xs,

    color: Colors.textSecondary,

    fontWeight: '600',

  },

  card: {

    backgroundColor: Colors.bgCard,

    borderRadius: Radii.lg,

    padding: 12,

    marginBottom: 10,

  },

  cardHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8,

    marginBottom: 10,

  },

  cardIconWrap: {

    width: 28,

    height: 28,

    borderRadius: 8,

    backgroundColor: Colors.accentLight,

    alignItems: 'center',

    justifyContent: 'center',

  },

  cardTitle: {

    fontSize: FontSizes.sm,

    fontWeight: '800',

    color: Colors.textPrimary,

  },

  fieldGrid: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    marginHorizontal: -GRID_GAP / 2,

  },

  fieldCell: {

    width: '50%',

    paddingHorizontal: GRID_GAP / 2,

    paddingBottom: GRID_GAP,

  },

  fieldCellFull: {

    width: '100%',

  },

  expandableContainer: {

    width: '100%',

  },

  expandToggleBtn: {

    flexDirection: 'row',

    alignItems: 'center',

    alignSelf: 'flex-start',

    gap: 3,

    marginTop: 3,

    paddingVertical: 1,

  },

  expandToggleText: {

    fontSize: FontSizes.xs,

    fontWeight: '700',

    color: Colors.accent,

  },

  expandToggleTextInline: {

    fontSize: FontSizes.xs,

    fontWeight: '700',

    color: Colors.accent,

  },

  hiddenMeasureText: {

    position: 'absolute',

    opacity: 0,

    zIndex: -1,

  },

  injuryDetailWrap: {

    marginBottom: 10,

  },

  fieldLabel: {

    fontSize: FontSizes.xs,

    color: Colors.textMuted,

    fontWeight: '600',

    marginBottom: 2,

  },

  fieldValue: {

    fontSize: FontSizes.sm,

    color: Colors.textPrimary,

    fontWeight: '600',

    lineHeight: 17,

  },

  recordList: {

    gap: 0,

  },

  recordItem: {},

  recordItemSpaced: {

    borderTopWidth: 1,

    borderTopColor: Colors.border,

    paddingTop: 10,

    marginTop: 2,

  },

  photoGrid: {

    flexDirection: 'row',

    marginHorizontal: -4,

  },

  photoCell: {

    flex: 1,

    paddingHorizontal: 4,

  },

  photo: {

    width: '100%',

    aspectRatio: 1,

    borderRadius: Radii.sm,

    backgroundColor: Colors.bgAlt,

  },

  photoPlaceholder: {

    width: '100%',

    aspectRatio: 1,

    borderRadius: Radii.sm,

    backgroundColor: Colors.bgAlt,

    alignItems: 'center',

    justifyContent: 'center',

    padding: 6,

  },

  photoPlaceholderText: {

    fontSize: 9,

    color: Colors.textMuted,

    textAlign: 'center',

  },

  signatureImage: {

    width: '100%',

    height: 96,

    backgroundColor: Colors.bgAlt,

    borderRadius: Radii.md,

  },

  pdfBtn: {

    backgroundColor: Colors.accent,

    borderRadius: Radii.lg,

    paddingVertical: 13,

    alignItems: 'center',

    marginTop: 2,

  },

  pdfBtnDisabled: {
    opacity: 0.7,
  },

  loaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  pdfBtnText: {

    color: Colors.white,

    fontWeight: '800',

    fontSize: FontSizes.sm,

  },

});


