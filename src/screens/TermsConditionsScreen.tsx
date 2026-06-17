import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { FileText } from 'lucide-react-native';

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    body:
      'By accessing and using PatrolApp, you agree to comply with these Terms and Conditions. If you do not agree, please discontinue use of the application.',
  },
  {
    title: 'Authorized Use',
    body:
      'PatrolApp is intended for licensed security personnel and authorized managers. You must use the app only for legitimate patrol, incident reporting, and shift management activities.',
  },
  {
    title: 'Account Responsibilities',
    body:
      'You are responsible for maintaining the confidentiality of your login credentials, ensuring your profile information is accurate, and promptly reporting unauthorized account access.',
  },
  {
    title: 'Patrol & Incident Data',
    body:
      'All patrol logs, NFC scans, photos, signatures, and incident reports submitted through the app must be truthful and complete. Falsified records may result in account suspension.',
  },
  {
    title: 'Prohibited Conduct',
    body:
      'You may not misuse the app, attempt to access data you are not authorized to view, interfere with system operations, or use the platform for unlawful purposes.',
  },
  {
    title: 'Limitation of Liability',
    body:
      'PatrolApp is provided as an operational tool. Arrowbyte is not liable for losses arising from network outages, device failures, or decisions made based on incomplete data entry.',
  },
  {
    title: 'Changes to Terms',
    body:
      'We may update these terms from time to time. Continued use of the app after updates constitutes acceptance of the revised terms.',
  },
];

export default function TermsConditionsScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Terms & Conditions</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <FileText size={22} color={Colors.accent} />
            </View>
            <Text style={styles.heroTitle}>Terms of Service</Text>
            <Text style={styles.heroSub}>
              Last updated: June 2026
            </Text>
          </View>

          {SECTIONS.map(section => (
            <View key={section.title} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}
        </ScrollView>
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
    justifyContent: 'space-between',
    padding: 15,
    paddingBottom: 12,
  },
  back: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  headerSpacer: { width: 24 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 28 },
  heroCard: {
    backgroundColor: Colors.accentLight,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.accentAlpha25,
    alignItems: 'center',
    ...Shadows.card,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accentAlpha30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: FontSizes.base,
    lineHeight: 18,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
