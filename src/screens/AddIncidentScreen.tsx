import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import {
  AlertTriangle,
  Camera,
  Eye,
  FileText,
  MapPin,
  PenLine,
  ShieldAlert,
  Siren,
  Tag,
  Users,
} from 'lucide-react-native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES } from '../navigation/constants';

export default function AddIncidentScreen() {
  const navigation = useGuardNavigation();
  const [photos, setPhotos] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    location: '',
    incidentType: '',
    customIncidentType: '',
    severity: '' as 'Low' | 'Medium' | 'High',
    peopleInvolved: '',
    numVehicles: '',
    emergencyServices: [] as string[],
    witnessesInvolved: 'NO' as 'YES' | 'NO',
    witnessCount: '',
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

  const handleAddPhoto = () => {
    // TODO: Later connect to camera/gallery
    setPhotos(prev => [...prev, 'https://via.placeholder.com/100']);
  };

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Report Incident</Text>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
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

          {/* Location */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
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

          {/* Incident Type */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
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

          {/* Severity */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <ShieldAlert size={14} color={Colors.warning} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Severity
              </Text>
            </View>
            <View style={styles.row}>
              {['Low', 'Medium', 'High'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.chip,
                    form.severity === s && styles.chipActive,
                  ]}
                  onPress={() =>
                    setForm({
                      ...form,
                      severity: s as 'Low' | 'Medium' | 'High',
                    })
                  }
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

          {/* People & Vehicles */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Users size={14} color={Colors.textMuted} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                People & Vehicles Involved
              </Text>
            </View>
            <View style={styles.twoColumn}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>People Involved</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Number of people"
                  keyboardType="numeric"
                  value={form.peopleInvolved}
                  onChangeText={v => setForm({ ...form, peopleInvolved: v })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Vehicles Involved</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Number of vehicles"
                  keyboardType="numeric"
                  value={form.numVehicles}
                  onChangeText={v => setForm({ ...form, numVehicles: v })}
                />
              </View>
            </View>
          </View>

          {/* Emergency Services */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
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

          {/* Witnesses */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Eye size={14} color={Colors.textMuted} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Were there Witnesses?
              </Text>
            </View>
            <View style={styles.row}>
              {['YES', 'NO'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.sevBtn,
                    form.witnessesInvolved === option && styles.sevActive,
                  ]}
                  onPress={() =>
                    setForm({
                      ...form,
                      witnessesInvolved: option as 'YES' | 'NO',
                    })
                  }
                >
                  <Text
                    style={[
                      styles.sevText,
                      form.witnessesInvolved === option && { color: '#fff' },
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.witnessesInvolved === 'YES' && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.subLabel}>Number of Witnesses</Text>
                <TextInput
                  style={styles.input}
                  placeholder="How many?"
                  keyboardType="numeric"
                  value={form.witnessCount}
                  onChangeText={v => setForm({ ...form, witnessCount: v })}
                />
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
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

          {/* Photos */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Camera size={14} color={Colors.success} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Incident Photos
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 8 }}
            >
              {photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.photo} />
              ))}

              <TouchableOpacity
                style={styles.addPhotoBtn}
                onPress={handleAddPhoto}
              >
                <Text style={styles.addPhotoText}>＋</Text>
              </TouchableOpacity>
            </ScrollView>
            <Text style={styles.helperText}>You can add up to 5 photos</Text>
          </View>

          {/* Signature */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <PenLine size={14} color={Colors.accent} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Signature
              </Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={{ color: '#aaa', fontSize: 14 }}>
                Draw signature here
              </Text>
            </View>
            <TouchableOpacity style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear Signature</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.navigate(GUARD_ROUTES.INCIDENTS)}>
            <Text style={styles.submitText}>Submit Report</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    paddingBottom: 12,
  },
  back: { fontSize: 24, fontWeight: 'bold' },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginLeft: 60,
  },

  body: { flex: 1, padding: 16 },
  icon: {
    marginBottom: 7,
  },

  card: {
    backgroundColor: '#f4efef',
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,

    borderColor: '#791f3d',
    ...Shadows.card,
  },

  label: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#555',
    marginBottom: 10,
  },

  subLabel: {
    fontSize: FontSizes.xs,
    color: '#777',
    marginBottom: 6,
  },

  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.md,
    padding: 10,
    fontSize: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  row: { flexDirection: 'row', gap: 10 },
  twoColumn: { flexDirection: 'row', gap: 12 },

  sevBtn: {
    flex: 1,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  sevActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  sevText: {
    fontSize: 10,
    fontWeight: '400',
    color: Colors.textPrimary,
  },

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
    fontSize: 10,
    color: Colors.textPrimary,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  photo: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgInput,
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  addPhotoText: { fontSize: 28, color: Colors.accent },

  helperText: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
  },

  signatureBox: {
    height: 140,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
    marginBottom: 12,
  },

  clearBtn: { alignSelf: 'flex-end' },
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
    backgroundColor: Colors.bg,
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

  cancelText: { color: '#666', fontWeight: '600', fontSize: 15 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  otherBox: {
    marginTop: 10,
  },
});
