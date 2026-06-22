import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import SignatureCanvas from 'react-native-signature-canvas';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import {
  SelfieWatermarkProcessor,
  type SelfieWatermarkJob,
} from '../components/SelfieWatermarkProcessor';
import ImageViewerModal from '../components/ImageViewerModal';
import { formatCaptureTimestamp } from '../services/locationUtils';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Car,
  Eye,
  FileText,
  MapPin,
  Minus,
  PenLine,
  Plus,
  ShieldAlert,
  Siren,
  Tag,
  Users,
} from 'lucide-react-native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES } from '../navigation/constants';
import type { GuardStackScreenProps } from '../navigation/types';
import type { RootState } from '../store/store';
import { getGuardMyJobs, guardReportIncident } from '../services/guardApi';
import {
  findIncidentContextByRoster,
  type IncidentJobContext,
} from '../services/guardJobsMapper';
import { getActiveShiftSession } from '../services/activeShiftSession';
import { useAppDispatch } from '../store/hooks';
import { fetchGuardIncidents } from '../store/slices/incidentsSlice';

type AddIncidentRoute = GuardStackScreenProps<'AddIncident'>['route'];

const MAX_INCIDENT_PHOTOS = 5;

interface IncidentPhoto {
  uri: string;
  base64: string;
  timestamp: string;
}

const SIGNATURE_PAD_STYLE = `
  .m-signature-pad { box-shadow: none; border: none; margin: 0; background-color: #ffffff; }
  .m-signature-pad--body { border: none; background-color: #ffffff; }
  .m-signature-pad--footer { display: none; margin: 0; }
  body, html {
    width: 100%;
    height: 100%;
    margin: 0;
    background-color: #ffffff !important;
  }
  canvas {
    width: 100% !important;
    height: 100% !important;
    background-color: #ffffff !important;
  }
`;

interface PersonForm {
  name: string;
  email: string;
  phone: string;
  bodyType: string;
  gender: string;
  hair: string;
  height: string;
  weight: string;
  marks: string;
}

interface VehicleForm {
  make: string;
  model: string;
  vehicle_type: string;
  vehicle_rander: string;
}

interface WitnessForm {
  wittness_detail: string;
  wittness_name: string;
  wittness_address: string;
  wittness_email: string;
  wittness_phone: string;
  witness_more_info: string;
}

const injuryTypeBySeverity: Record<'Low' | 'Medium' | 'High', string> = {
  Low: 'Minor injury',
  Medium: 'Moderate injury',
  High: 'Major injury',
};

const emptyPerson = (): PersonForm => ({
  name: '',
  email: '',
  phone: '',
  bodyType: '',
  gender: '',
  hair: '',
  height: '',
  weight: '',
  marks: '',
});

const emptyVehicle = (): VehicleForm => ({
  make: '',
  model: '',
  vehicle_type: '',
  vehicle_rander: '',
});

const emptyWitness = (): WitnessForm => ({
  wittness_detail: '',
  wittness_name: '',
  wittness_address: '',
  wittness_email: '',
  wittness_phone: '',
  witness_more_info: '',
});

function formatApiDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatApiTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatPhotoTimestamp(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${formatApiDate(date)} ${h}:${m}:${s}`;
}

function toDataUri(base64: string, mime = 'image/jpeg'): string {
  if (base64.startsWith('data:')) return base64;
  return `data:${mime};base64,${base64}`;
}

function resizeList<T>(
  list: T[],
  count: number,
  factory: () => T,
): T[] {
  if (count <= list.length) return list.slice(0, count);
  return [
    ...list,
    ...Array.from({ length: count - list.length }, factory),
  ];
}

async function uriToBase64(uri: string): Promise<string> {
  const path = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
  return ReactNativeBlobUtil.fs.readFile(path, 'base64');
}

async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function CounterSection({
  title,
  icon: Icon,
  count,
  onChange,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  count: number;
  onChange: (n: number) => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <Icon size={18} color={Colors.info} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.counterRow}>
        <TouchableOpacity
          style={styles.counterBtn}
          onPress={() => onChange(Math.max(0, count - 1))}
        >
          <Minus size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.counterValue}>{count}</Text>
        <TouchableOpacity
          style={styles.counterBtn}
          onPress={() => onChange(Math.min(10, count + 1))}
        >
          <Plus size={22} color={Colors.info} />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  half,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  half?: boolean;
}) {
  return (
    <View style={[styles.fieldWrap, half && styles.fieldHalf]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType}
      />
    </View>
  );
}

export default function AddIncidentScreen() {
  const navigation = useGuardNavigation();
  const route = useRoute<AddIncidentRoute>();
  const dispatch = useAppDispatch();
  const guardId = useSelector((state: RootState) => state.auth?.guardId ?? null);
  const signatureRef = useRef<any>(null);
  const pendingPhotoRef = useRef<{ timestamp: string } | null>(null);

  const [photos, setPhotos] = useState<IncidentPhoto[]>([]);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [watermarkJob, setWatermarkJob] = useState<SelfieWatermarkJob | null>(null);
  const [watermarking, setWatermarking] = useState(false);
  const [signatureUri, setSignatureUri] = useState('');
  const [signaturePadActive, setSignaturePadActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<IncidentJobContext | null>(
    null,
  );

  const [peopleCount, setPeopleCount] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [witnessCount, setWitnessCount] = useState(0);
  const [peopleForms, setPeopleForms] = useState<PersonForm[]>([]);
  const [vehicleForms, setVehicleForms] = useState<VehicleForm[]>([]);
  const [witnessForms, setWitnessForms] = useState<WitnessForm[]>([]);

  const [form, setForm] = useState({
    title: '',
    location: '',
    incidentType: '',
    customIncidentType: '',
    severity: '' as 'Low' | 'Medium' | 'High' | '',
    emergencyServices: [] as string[],
    details: '',
  });

  const incidentTypes = [
    'Accident',
    'Theft',
    'Assault',
    'Fire',
    'Medical',
    'Vandalism',
    'Other',
  ];
  const emergencyOptions = [
    'Police',
    'Ambulance',
    'Fire Brigade',
    'Traffic Police',
    'None',
  ];

  useEffect(() => {
    let mounted = true;
    (async () => {
      setJobsLoading(true);
      const session = await getActiveShiftSession();
      const result = await getGuardMyJobs();
      if (!mounted) return;

      const rosterFrom =
        route.params?.rosterId ?? session?.rosterId ?? undefined;
      const siteIdFrom =
        route.params?.siteId ?? session?.siteId ?? undefined;

      let resolved: IncidentJobContext | null = null;

      if (rosterFrom != null && result.data?.length) {
        resolved = findIncidentContextByRoster(result.data, rosterFrom);
      }

      if (!resolved && siteIdFrom != null && rosterFrom != null) {
        resolved = {
          rosterId: rosterFrom,
          siteId: siteIdFrom,
          siteName: session?.site ?? 'Site',
          shiftDate: undefined,
          siteAddress: session?.zones,
        };
      }

      if (resolved) {
        setSelectedJob(resolved);
        setForm(prev => ({
          ...prev,
          location: prev.location || resolved?.siteAddress || '',
        }));
      }

      setJobsLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [route.params?.rosterId, route.params?.siteId]);

  const updatePeopleCount = (count: number) => {
    setPeopleCount(count);
    setPeopleForms(prev => resizeList(prev, count, emptyPerson));
  };

  const updateVehicleCount = (count: number) => {
    setVehicleCount(count);
    setVehicleForms(prev => resizeList(prev, count, emptyVehicle));
  };

  const updateWitnessCount = (count: number) => {
    setWitnessCount(count);
    setWitnessForms(prev => resizeList(prev, count, emptyWitness));
  };

  const updatePerson = (index: number, patch: Partial<PersonForm>) => {
    setPeopleForms(prev =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const updateVehicle = (index: number, patch: Partial<VehicleForm>) => {
    setVehicleForms(prev =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const updateWitness = (index: number, patch: Partial<WitnessForm>) => {
    setWitnessForms(prev =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const handleAddPhoto = async () => {
    if (photos.length >= MAX_INCIDENT_PHOTOS || watermarking) {
      return;
    }

    const allowed = await requestCameraPermission();
    if (!allowed) {
      Alert.alert('Permission required', 'Camera permission is needed.');
      return;
    }

    Alert.alert('Add photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await launchCamera({
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1280,
            maxHeight: 1280,
            saveToPhotos: false,
          });
          appendPhotoResult(result);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 1280,
            maxHeight: 1280,
            selectionLimit: 1,
          });
          appendPhotoResult(result);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const startPhotoWatermark = useCallback(
    (asset: { uri?: string; width?: number; height?: number }) => {
      if (!asset.uri) {
        Alert.alert('Error', 'Could not read photo data.');
        return;
      }

      const now = new Date();
      pendingPhotoRef.current = { timestamp: formatPhotoTimestamp(now) };
      setWatermarking(true);
      setWatermarkJob({
        sourceUri: asset.uri,
        timestamp: formatCaptureTimestamp(now),
        width: asset.width,
        height: asset.height,
      });
    },
    [],
  );

  const appendPhotoResult = (result: {
    didCancel?: boolean;
    assets?: Array<{ uri?: string; width?: number; height?: number }>;
  }) => {
    if (result.didCancel) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) {
      Alert.alert('Error', 'Could not read photo data.');
      return;
    }
    startPhotoWatermark(asset);
  };

  const handleWatermarkComplete = useCallback(async (uri: string) => {
    try {
      const base64 = await uriToBase64(uri);
      const pending = pendingPhotoRef.current;
      setPhotos(prev => [
        ...prev,
        {
          uri,
          base64,
          timestamp: pending?.timestamp ?? formatPhotoTimestamp(new Date()),
        },
      ]);
    } catch {
      Alert.alert('Error', 'Could not process photo watermark.');
    } finally {
      pendingPhotoRef.current = null;
      setWatermarkJob(null);
      setWatermarking(false);
    }
  }, []);

  const handleWatermarkError = useCallback(() => {
    Alert.alert('Error', 'Could not apply watermark to photo.');
    pendingPhotoRef.current = null;
    setWatermarkJob(null);
    setWatermarking(false);
  }, []);

  const photosFull = photos.length >= MAX_INCIDENT_PHOTOS;

  const toggleEmergencyService = (service: string) => {
    setForm(prev => {
      const currentServices = prev.emergencyServices || [];
      const isSelected = currentServices.includes(service);
      return {
        ...prev,
        emergencyServices: isSelected
          ? currentServices.filter(s => s !== service)
          : [...currentServices, service],
      };
    });
  };

  const buildPayload = () => {
    const now = new Date();
    const incidentType =
      form.incidentType === 'Other'
        ? form.customIncidentType.trim()
        : form.incidentType;

    const injuryType = form.severity
      ? injuryTypeBySeverity[form.severity]
      : incidentType || 'Incident';

    const incidentDetail = [form.title.trim(), form.details.trim()]
      .filter(Boolean)
      .join('. ');

    return {
      guard_id: guardId ?? '',
      roster_id: selectedJob!.rosterId,
      date: selectedJob?.shiftDate || formatApiDate(now),
      time: formatApiTime(now),
      site_name: selectedJob!.siteName,
      injury_type: injuryType,
      incident_detail: incidentDetail || 'No details provided',
      people_involved: peopleForms.map(person => ({
        peopleCount: peopleCount || 1,
        name: person.name.trim(),
        phone: person.phone.trim(),
        bodyType: person.bodyType.trim(),
        gender: person.gender.trim(),
        hair: person.hair.trim(),
        height: person.height.trim(),
        weight: person.weight.trim(),
        marks: person.marks.trim(),
        email: person.email.trim(),
      })),
      vehicle: vehicleForms.map(vehicle => ({
        make: vehicle.make.trim(),
        model: vehicle.model.trim(),
        vehicle_type: vehicle.vehicle_type.trim(),
        vehicle_rander: vehicle.vehicle_rander.trim(),
      })),
      emergency_services: {
        emergency_type:
          form.emergencyServices.filter(s => s !== 'None').join(', ') || null,
        emergency_detail: null,
        supervisor_name: null,
        position: null,
        address: form.location.trim() || null,
        email: null,
        phone: null,
      },
      wittness: witnessForms.map(witness => ({
        wittness_detail: witness.wittness_detail.trim(),
        wittness_name: witness.wittness_name.trim(),
        wittness_address: witness.wittness_address.trim(),
        wittness_email: witness.wittness_email.trim(),
        wittness_phone: witness.wittness_phone.trim(),
        witness_more_info: witness.witness_more_info.trim(),
      })),
      photo: photos.map(photo => ({
        imgPath: toDataUri(photo.base64),
        timestamp: photo.timestamp,
      })),
      signature: signatureUri.trim() || undefined,
    };
  };

  const handleSubmit = async () => {
    if (jobsLoading) return;

    if (!selectedJob?.siteId) {
      Alert.alert(
        'No active shift',
        'Please sign in to a shift first so site and roster can be linked to this report.',
      );
      return;
    }
    if (!form.incidentType) {
      Alert.alert('Required', 'Please select an incident type.');
      return;
    }
    if (form.incidentType === 'Other' && !form.customIncidentType.trim()) {
      Alert.alert('Required', 'Please enter the incident type.');
      return;
    }
    if (!form.severity) {
      Alert.alert('Required', 'Please select severity / injury type.');
      return;
    }
    if (!form.details.trim()) {
      Alert.alert('Required', 'Please describe the incident.');
      return;
    }
    if (!signatureUri.trim()) {
      Alert.alert('Required', 'Please draw and save your signature.');
      return;
    }
    if (!guardId) {
      Alert.alert('Error', 'Guard session not found. Please log in again.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = buildPayload();
      const result = await guardReportIncident(selectedJob.siteId, payload);

      if (result.success) {
        dispatch(fetchGuardIncidents());
        Alert.alert('Success', result.message ?? 'Incident reported successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate(GUARD_ROUTES.INCIDENTS),
          },
        ]);
      } else {
        Alert.alert('Submit failed', result.message || 'Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong while submitting the report.');
    } finally {
      setSubmitting(false);
    }
  };

  const lockScrollForSignature = () => setSignaturePadActive(true);
  const unlockScrollForSignature = () => setSignaturePadActive(false);

  const handleSaveSignature = () => {
    signatureRef.current?.readSignature();
    unlockScrollForSignature();
  };

  const handleClearSignature = () => {
    if (signatureUri) return;
    signatureRef.current?.clearSignature();
    setSignatureUri('');
    unlockScrollForSignature();
  };

  const handleSignatureOK = (sig: string) => {
    unlockScrollForSignature();
    if (sig?.trim()) {
      setSignatureUri(
        sig.startsWith('data:') ? sig : toDataUri(sig, 'image/png'),
      );
    }
  };

  const signatureSaved = Boolean(signatureUri.trim());

  return (
    <View style={styles.container}>
      <SelfieWatermarkProcessor
        job={watermarkJob}
        onComplete={handleWatermarkComplete}
        onError={handleWatermarkError}
      />
      <ImageViewerModal
        visible={viewerUri != null}
        uri={viewerUri}
        onClose={() => setViewerUri(null)}
      />
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.hdrTitle}>Report Incident</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.safeBody} edges={['bottom']}>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!signaturePadActive}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} color={Colors.danger} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Incident Title
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g., Car collision at Main Street"
              value={form.title}
              onChangeText={v => setForm({ ...form, title: v })}
            />
          </View>

          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} color={Colors.accent} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Location
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Exact address or landmark"
              value={form.location}
              onChangeText={v => setForm({ ...form, location: v })}
            />
          </View>

          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Tag size={14} color={Colors.accent} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Incident Type
              </Text>
            </View>
            <View style={styles.chipContainer}>
              {incidentTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    form.incidentType === type && styles.chipActive,
                  ]}
                  onPress={() =>
                    setForm({
                      ...form,
                      incidentType: type,
                      customIncidentType:
                        type !== 'Other' ? '' : form.customIncidentType,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      form.incidentType === type && styles.chipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.incidentType === 'Other' && (
              <View style={styles.otherBox}>
                <TextInput
                  placeholder="Enter incident type"
                  value={form.customIncidentType}
                  onChangeText={text =>
                    setForm({ ...form, customIncidentType: text })
                  }
                  style={styles.input}
                />
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={14} color={Colors.warning} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Severity / Injury
              </Text>
            </View>
            <View style={styles.row}>
              {(['Low', 'Medium', 'High'] as const).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, form.severity === s && styles.chipActive]}
                  onPress={() => setForm({ ...form, severity: s })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      form.severity === s && { color: '#fff' },
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <CounterSection
            title="People Involved"
            icon={Users}
            count={peopleCount}
            onChange={updatePeopleCount}
          >
            {peopleForms.map((person, index) => (
              <View key={`person-${index}`} style={styles.detailBlock}>
                <Text style={styles.detailTitle}>Detail {index + 1}</Text>
                <Field
                  label="Full Name"
                  value={person.name}
                  onChangeText={v => updatePerson(index, { name: v })}
                  placeholder="Person Name"
                />
                <Field
                  label="Email"
                  value={person.email}
                  onChangeText={v => updatePerson(index, { email: v })}
                  placeholder="Person Email"
                  keyboardType="email-address"
                />
                <Field
                  label="Phone"
                  value={person.phone}
                  onChangeText={v => updatePerson(index, { phone: v })}
                  placeholder="Person Phone"
                  keyboardType="phone-pad"
                />
                <View style={styles.fieldRow}>
                  <Field
                    label="Body Type"
                    value={person.bodyType}
                    onChangeText={v => updatePerson(index, { bodyType: v })}
                    half
                  />
                  <Field
                    label="Gender"
                    value={person.gender}
                    onChangeText={v => updatePerson(index, { gender: v })}
                    half
                  />
                </View>
                <View style={styles.fieldRow}>
                  <Field
                    label="Hair"
                    value={person.hair}
                    onChangeText={v => updatePerson(index, { hair: v })}
                    half
                  />
                  <Field
                    label="Height"
                    value={person.height}
                    onChangeText={v => updatePerson(index, { height: v })}
                    half
                  />
                </View>
                <View style={styles.fieldRow}>
                  <Field
                    label="Weight"
                    value={person.weight}
                    onChangeText={v => updatePerson(index, { weight: v })}
                    half
                  />
                  <Field
                    label="Marks"
                    value={person.marks}
                    onChangeText={v => updatePerson(index, { marks: v })}
                    half
                  />
                </View>
              </View>
            ))}
          </CounterSection>

          <CounterSection
            title="No of Vehicles Involved"
            icon={Car}
            count={vehicleCount}
            onChange={updateVehicleCount}
          >
            {vehicleForms.map((vehicle, index) => (
              <View key={`vehicle-${index}`} style={styles.detailBlock}>
                <Text style={styles.detailTitle}>Detail {index + 1}</Text>
                <Field
                  label="Make"
                  value={vehicle.make}
                  onChangeText={v => updateVehicle(index, { make: v })}
                  placeholder="Make"
                />
                <Field
                  label="Model"
                  value={vehicle.model}
                  onChangeText={v => updateVehicle(index, { model: v })}
                  placeholder="Model"
                />
                <Field
                  label="Vehicle Type"
                  value={vehicle.vehicle_type}
                  onChangeText={v => updateVehicle(index, { vehicle_type: v })}
                  placeholder="Vehicle Type"
                />
                <Field
                  label="Rego Number"
                  value={vehicle.vehicle_rander}
                  onChangeText={v => updateVehicle(index, { vehicle_rander: v })}
                  placeholder="Rego Number"
                />
              </View>
            ))}
          </CounterSection>

          <CounterSection
            title="Witnesses"
            icon={Eye}
            count={witnessCount}
            onChange={updateWitnessCount}
          >
            {witnessForms.map((witness, index) => (
              <View key={`witness-${index}`} style={styles.detailBlock}>
                <Text style={styles.detailTitle}>Detail {index + 1}</Text>
                <Field
                  label="Witness Name"
                  value={witness.wittness_name}
                  onChangeText={v => updateWitness(index, { wittness_name: v })}
                  placeholder="Witness Name"
                />
                <Field
                  label="Witness Detail"
                  value={witness.wittness_detail}
                  onChangeText={v => updateWitness(index, { wittness_detail: v })}
                  placeholder="Witness Detail"
                />
                <Field
                  label="Witness Address"
                  value={witness.wittness_address}
                  onChangeText={v =>
                    updateWitness(index, { wittness_address: v })
                  }
                  placeholder="Witness Address"
                />
                <Field
                  label="Witness Email"
                  value={witness.wittness_email}
                  onChangeText={v => updateWitness(index, { wittness_email: v })}
                  placeholder="Witness Email"
                  keyboardType="email-address"
                />
                <Field
                  label="Witness Phone"
                  value={witness.wittness_phone}
                  onChangeText={v => updateWitness(index, { wittness_phone: v })}
                  placeholder="Witness Phone"
                  keyboardType="phone-pad"
                />
                <Field
                  label="More Info"
                  value={witness.witness_more_info}
                  onChangeText={v =>
                    updateWitness(index, { witness_more_info: v })
                  }
                  placeholder="Additional witness info"
                />
              </View>
            ))}
          </CounterSection>

          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Siren size={14} color={Colors.danger} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Emergency Services Involved
              </Text>
            </View>
            <View style={styles.chipContainer}>
              {emergencyOptions.map(service => {
                const isSelected =
                  form.emergencyServices?.includes(service) || false;
                return (
                  <TouchableOpacity
                    key={service}
                    style={[styles.chip, isSelected && styles.chipActive]}
                    onPress={() => toggleEmergencyService(service)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}
                    >
                      {service}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <FileText size={14} color={Colors.accent} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Incident Details
              </Text>
            </View>
            <TextInput
              style={[styles.input, { height: 110, textAlignVertical: 'top' }]}
              multiline
              placeholder="Describe what happened..."
              value={form.details}
              onChangeText={v => setForm({ ...form, details: v })}
            />
          </View>

          <View style={[styles.card, Shadows.card]}>
            <View style={styles.cardLabelRow}>
              <Camera size={16} color={Colors.success} />
              <Text style={styles.cardLabel}>Incident Photos</Text>
              <Text style={styles.photoCount}>
                {photos.length}/{MAX_INCIDENT_PHOTOS}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photoScroll}
              contentContainerStyle={styles.photoScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.addPhotoBtn,
                  (photosFull || watermarking) && styles.addPhotoBtnDisabled,
                ]}
                onPress={handleAddPhoto}
                disabled={photosFull || watermarking}
                activeOpacity={0.85}
              >
                {watermarking ? (
                  <ActivityIndicator size="small" color={Colors.accent} />
                ) : (
                  <>
                    <Camera size={22} color={Colors.accent} />
                    <Text style={styles.addPhotoLabel}>Add</Text>
                  </>
                )}
              </TouchableOpacity>
              {photos.map((photo, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.85}
                  onPress={() => setViewerUri(photo.uri)}
                >
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.helperText}>
              {photosFull
                ? 'Maximum 5 photos added'
                : 'Tap a photo to view full size. Logo and timestamp are added to each photo'}
            </Text>
          </View>

          <View style={[styles.card, Shadows.card]}>
            <View style={styles.cardLabelRow}>
              <PenLine size={16} color={Colors.accent} />
              <Text style={styles.cardLabel}>
                {signatureSaved ? 'Signature saved' : 'Draw your signature, then tap Save'}
              </Text>
            </View>
            {signatureSaved ? (
              <View style={styles.signatureSavedBox}>
                <View style={styles.signaturePreviewWrap}>
                  <Image
                    source={{ uri: signatureUri }}
                    style={styles.signaturePreview}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.signatureSavedText}>Signature locked</Text>
              </View>
            ) : (
              <>
                <View
                  style={styles.signatureBox}
                  collapsable={false}
                  onStartShouldSetResponder={() => {
                    lockScrollForSignature();
                    return true;
                  }}
                  onMoveShouldSetResponder={() => true}
                  onResponderTerminationRequest={() => false}
                  onResponderRelease={unlockScrollForSignature}
                  onResponderTerminate={unlockScrollForSignature}
                >
                  <SignatureCanvas
                    ref={signatureRef}
                    onOK={handleSignatureOK}
                    onEmpty={() => setSignatureUri('')}
                    onBegin={lockScrollForSignature}
                    onEnd={unlockScrollForSignature}
                    nestedScrollEnabled
                    descriptionText=""
                    clearText=""
                    confirmText=""
                    imageType="image/png"
                    webStyle={SIGNATURE_PAD_STYLE}
                    backgroundColor="#FFFFFF"
                    penColor="#000000"
                  />
                </View>
                <View style={styles.signatureActions}>
                  <TouchableOpacity onPress={handleClearSignature}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveSignature}>
                    <Text style={styles.clearText}>Save Signature</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            disabled={submitting}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || jobsLoading}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.headerStart },
  safeTop: { backgroundColor: Colors.headerStart },
  safeBody: { flex: 1, backgroundColor: Colors.bgAlt },

  header: {
    backgroundColor: Colors.headerStart,
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
  bodyContent: { padding: 14, paddingBottom: 110 },
  icon: { marginBottom: 7 },

  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardLabel: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  photoCount: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
  },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 14,
    ...Shadows.card,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 16,
  },
  counterBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    minWidth: 32,
    textAlign: 'center',
  },

  detailBlock: {
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
  },

  fieldWrap: { marginBottom: 10 },
  fieldHalf: { flex: 1 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.md,
    padding: 12,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  label: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#555',
    marginBottom: 10,
  },

  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.md,
    padding: 10,
    fontSize: FontSizes.sm,
    borderWidth: 1,
    borderColor: '#ccc',
    color: Colors.textPrimary,
  },

  row: { flexDirection: 'row', gap: 10 },

  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgInput,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: FontSizes.xs,
    color: Colors.textPrimary,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  photoScroll: {
    marginTop: 4,
  },
  photoScrollContent: {
    alignItems: 'center',
    gap: 10,
    paddingRight: 4,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
    gap: 4,
  },
  addPhotoBtnDisabled: {
    opacity: 0.45,
    borderColor: Colors.border,
    backgroundColor: Colors.bgAlt,
  },
  addPhotoLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.accent,
  },

  helperText: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
  },

  signatureBox: {
    height: 160,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  signatureSavedBox: {
    height: 160,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  signaturePreviewWrap: {
    width: '100%',
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.sm,
    overflow: 'hidden',
  },
  signaturePreview: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  signatureSavedText: {
    marginTop: 8,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.success,
  },
  signatureActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  clearText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600',
  },

  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgAlt,
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    alignItems: 'center',
    marginRight: 8,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 15,
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },

  cancelText: { color: '#666', fontWeight: '600', fontSize: 15 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  otherBox: {
    marginTop: 10,
  },
});
