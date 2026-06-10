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

import { Colors, FontSizes, Radii, Spacing, Shadows } from '../theme';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {
  CalendarDays,
  Camera,
  FileText,
  MapPin,
  PenLine,
} from 'lucide-react-native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES } from '../navigation/constants';

export default function AddPatrolReport() {
  const navigation = useGuardNavigation();
  const [photos, setPhotos] = useState<string[]>([]);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [form, setForm] = useState({
    location: '',
    details: '',
  });

  const handleAddPhoto = () => {
    // 👉 later connect camera
    setPhotos(prev => [...prev, 'https://via.placeholder.com/100']);
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
          <Text style={styles.title}>New Patrol Report</Text>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Location Card */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <MapPin size={12} color={Colors.accent} style={styles.icon} />
              <Text style={styles.label}>Location</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter location"
              value={form.location}
              onChangeText={v => setForm({ ...form, location: v })}
            />
          </View>
          {/* Date & Time */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <CalendarDays
                size={12}
                color={Colors.accent}
                style={styles.icon}
              />
              <Text style={styles.label}>Date & Time</Text>
            </View>

            {/* Date */}
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{date.toDateString()}</Text>
            </TouchableOpacity>

            {/* Time */}
            <TouchableOpacity
              style={[styles.input, { marginTop: 10 }]}
              onPress={() => setShowTimePicker(true)}
            >
              <Text>
                {date.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          </View>
          {/* Details Card */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <FileText size={12} color={Colors.accent} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Patrol Details
              </Text>
            </View>

            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Write patrol observations..."
              multiline
              value={form.details}
              onChangeText={v => setForm({ ...form, details: v })}
            />
          </View>

          {/* Photos Section */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Camera size={12} color={Colors.accent} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Incident Photos
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.map((p, i) => (
                <Image key={i} source={{ uri: p }} style={styles.photo} />
              ))}

              <TouchableOpacity
                style={styles.addPhotoBtn}
                onPress={handleAddPhoto}
              >
                <Text style={{ fontSize: 22 }}>＋</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Signature Section */}
          <View style={styles.card}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <PenLine size={12} color={Colors.accent} style={styles.icon} />
              <Text style={[styles.label, { color: Colors.textSecondary }]}>
                Signature
              </Text>
            </View>

            <View style={styles.signatureBox}>
              <Text style={{ color: '#aaa' }}>Draw signature here</Text>
            </View>

            <TouchableOpacity style={styles.clearBtn}>
              <Text style={styles.clearText}>Clear Signature</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => navigation.navigate(GUARD_ROUTES.PATROL_TIMELINE)}
          >
            <Text style={styles.submitText}>Submit Report</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) setDate(selectedTime);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    padding: 18,
    paddingBottom: 14,
  },

  back: { fontSize: 18 },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginLeft: 60,
  },

  body: { padding: 16 },

  card: {
    // backgroundColor: Colors.bgAlt,
    backgroundColor: '#f4efef',
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#791f3d',
    ...Shadows.card,
  },

  label: {
    fontSize: FontSizes.xs,
    color: '#666',
    marginBottom: 8,
    fontWeight: '700',
  },
  icon: {
    marginBottom: 7,
  },

  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: Radii.md,
    padding: 10,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  photo: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: Colors.bgInput,
  },

  addPhotoBtn: {
    width: 70,
    height: 70,
    borderRadius: 10,
    borderWidth: 1.5,

    alignItems: 'center',
    justifyContent: 'center',

    borderColor: '#ccc',
  },

  signatureBox: {
    height: 120,
    borderWidth: 1.5,

    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,

    borderColor: '#ccc',
    backgroundColor: Colors.bgInput,
  },

  clearBtn: {
    alignSelf: 'flex-end',
  },

  clearText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
  },

  footer: {
    flexDirection: 'row',
    padding: 14,
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
  },

  cancelBtn: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: 14,
    alignItems: 'center',
  },

  submitBtn: {
    flex: 2,
    marginLeft: 8,
    backgroundColor: Colors.accent,
    borderRadius: Radii.md,
    padding: 14,
    alignItems: 'center',
  },

  cancelText: { color: '#666', fontWeight: '600' },
  submitText: { color: Colors.white, fontWeight: '700' },
});
