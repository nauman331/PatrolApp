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
import { Shield } from 'lucide-react-native';

const SECTIONS = [
  {
    title: 'Information We Collect',
    body:
      'PatrolApp collects information you provide when using the app, including your name, email, phone number, security license details, patrol reports, incident records, and location data during active shifts.',
  },
  {
    title: 'How We Use Your Data',
    body:
      'Your information is used to authenticate your account, manage patrol assignments, record incidents, generate shift reports, and improve operational security for your organization.',
  },
  {
    title: 'Data Sharing',
    body:
      'We do not sell your personal data. Information may be shared with your employer, authorized managers, and service providers who help us operate the platform under strict confidentiality obligations.',
  },
  {
    title: 'Data Security',
    body:
      'We use industry-standard safeguards including encrypted connections, secure authentication tokens, and access controls to protect your information from unauthorized access.',
  },
  {
    title: 'Your Rights',
    body:
      'You may request access to, correction of, or deletion of your personal data by contacting your administrator or using the account options available in your profile.',
  },
  {
    title: 'Contact',
    body:
      'For privacy-related questions, contact your site administrator or email support@arrowbyte.com.au.',
  },
];

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bg} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Privacy Policy</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}>
              <Shield size={22} color={Colors.accent} />
            </View>
            <Text style={styles.heroTitle}>Your privacy matters</Text>
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
