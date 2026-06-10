import React, { type ComponentType, type ReactNode } from 'react';

import {

  View,

  Text,

  TouchableOpacity,

  StyleSheet,

  ScrollView,

  StatusBar,

  Image,

  Linking,

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

} from 'lucide-react-native';

import { Colors, FontSizes, Radii, Shadows } from '../theme';

import { useGuardNavigation } from '../navigation/utils';

import type { GuardStackScreenProps } from '../navigation/types';

import { useAppSelector } from '../store/hooks';

import { selectIncidentById } from '../store/slices/incidentsSlice';

import type { MappedIncident } from '../services/incidentsMapper';

import { downloadIncidentPdf } from '../services/incidentPdfDownload';



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



function FieldGrid({

  entries,

}: {

  entries: { label: string; value: string }[];

}) {

  if (!entries.length) return null;



  return (

    <View style={styles.fieldGrid}>

      {entries.map(item => (

        <View style={styles.fieldCell} key={item.label}>

          <Text style={styles.fieldLabel} numberOfLines={1}>

            {item.label}

          </Text>

          <Text style={styles.fieldValue}>{item.value}</Text>

        </View>

      ))}

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

  const route = useRoute<ViewIncidentRoute>();

  const incident = useAppSelector(selectIncidentById(route.params.incidentId));



  if (!incident) {

    return (

      <View style={styles.container}>

        <SafeAreaView style={styles.safeTop} edges={['top']}>

          <View style={styles.header}>

            <TouchableOpacity onPress={() => navigation.goBack()}>

              <ArrowLeft size={20} color={Colors.white} />

            </TouchableOpacity>

            <Text style={styles.headerTitle}>Incident Report</Text>

            <View style={{ width: 20 }} />

          </View>

        </SafeAreaView>

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
    { label: 'Created', value: incident.createdAt ?? '' },
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



      <SafeAreaView style={styles.safeTop} edges={['top']}>

        <View style={styles.header}>

          <TouchableOpacity onPress={() => navigation.goBack()}>

            <ArrowLeft size={20} color={Colors.white} />

          </TouchableOpacity>

          <Text style={styles.headerTitle}>Incident Report</Text>

          <View style={{ width: 20 }} />

        </View>

      </SafeAreaView>



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

              <Text style={styles.injuryDetail} numberOfLines={3}>

                {incident.injuryDetail}

              </Text>

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
                <Text style={styles.metaChipText}>{incident.incidentDate}</Text>
              </View>
              <View style={styles.metaChip}>
                <Clock size={11} color={Colors.accent} />
                <Text style={styles.metaChipText}>{incident.incidentTime}</Text>
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

                        if (photo.uri) Linking.openURL(photo.uri);

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



          {incident.id ? (

            <TouchableOpacity

              style={styles.pdfBtn}

              onPress={() => downloadIncidentPdf(incident)}

            >

              <Text style={styles.pdfBtnText}>Download PDF</Text>

            </TouchableOpacity>

          ) : null}

        </ScrollView>

      </SafeAreaView>

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

    flexWrap: 'wrap',

    marginHorizontal: -4,

  },

  photoCell: {

    width: '33.33%',

    paddingHorizontal: 4,

    paddingBottom: 8,

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

  pdfBtnText: {

    color: Colors.white,

    fontWeight: '800',

    fontSize: FontSizes.sm,

  },

});


