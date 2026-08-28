import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSizes, Radii, Shadows } from '../theme';
import { useNavigation } from '@react-navigation/native';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Camera,
  Folder,
  Bell,
  Mail,
  Lock,
  Server,
  UserCheck,
  Search,
  X,
} from 'lucide-react-native';

const SECTIONS = [
  { id: 'sec-1', number: '01', title: 'Information We Collect' },
  { id: 'sec-2', number: '02', title: 'Photos, Documents and Other Content' },
  { id: 'sec-3', number: '03', title: 'Device and Technical Information' },
  { id: 'sec-4', number: '04', title: 'How We Use Your Information' },
  { id: 'sec-5', number: '05', title: 'How We Share Your Information' },
  { id: 'sec-6', number: '06', title: 'Data Security' },
  { id: 'sec-7', number: '07', title: 'Data Retention' },
  { id: 'sec-8', number: '08', title: 'Account and Data Deletion' },
  { id: 'sec-9', number: '09', title: 'Your Privacy Rights' },
  { id: 'sec-10', number: '10', title: 'Permissions Used by the App' },
  { id: 'sec-11', number: '11', title: 'Notifications and Communications' },
  { id: 'sec-12', number: '12', title: 'Third-Party Services' },
  { id: 'sec-13', number: '13', title: 'Children\'s Privacy' },
  { id: 'sec-14', number: '14', title: 'International Data Processing' },
  { id: 'sec-15', number: '15', title: 'Changes to This Privacy Policy' },
  { id: 'sec-16', number: '16', title: 'Contact Us' },
  { id: 'sec-17', number: '17', title: 'Acceptance' },
];

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@reportpro.com.au').catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.bgAlt} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Privacy Policy</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={16} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search policy sections..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <X size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro Card */}
          <View style={styles.introCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIcon}>
                <Shield size={24} color={Colors.accent} />
              </View>

              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>Report Pro Privacy Policy</Text>
                <Text style={styles.heroSub}>Last updated: June 2026</Text>
              </View>
            </View>

            <Text style={styles.introText}>
              Report Pro (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, or &quot;Report Pro&quot;) is committed to protecting the privacy and security of information provided by users of the Report Pro mobile application (&quot;App&quot;). This Privacy Policy explains what information we collect, why we collect it, how we use and protect it, when it may be shared, and the choices available to you.
            </Text>

            <View style={styles.acknowledgeBanner}>
              <Text style={styles.acknowledgeText}>
                By using Report Pro, you acknowledge that you have read and understood this Privacy Policy.
              </Text>
            </View>
          </View>

          {/* Section 1 */}
          {matchesSearch("Information We Collect Account Personal Patrol Operational Location GPS") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>01</Text>
                </View>
                <Text style={styles.sectionTitle}>Information We Collect</Text>
              </View>

              <Text style={styles.sectionLead}>
                We may collect different types of information depending on how you use the App and the features enabled by your organization.
              </Text>

              {/* 1.1 Account & Personal Info */}
              <View style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <UserCheck size={16} color={Colors.accent} />
                  <Text style={styles.subCardTitle}>Account and Personal Information</Text>
                </View>
                <Text style={styles.subCardIntro}>When you create or use an account, we may collect information such as:</Text>
                {[
                  "Full name",
                  "Email address",
                  "Phone number",
                  "Employee or user identification details",
                  "Security licence or professional licence information",
                  "Organization, site, or employer information",
                  "Login and authentication information",
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <CheckCircle2 size={14} color={Colors.accent} style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* 1.2 Patrol & Operational Info */}
              <View style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <ShieldCheck size={16} color={Colors.accent} />
                  <Text style={styles.subCardTitle}>Patrol and Operational Information</Text>
                </View>
                <Text style={styles.subCardIntro}>When using patrol and security management features, we may collect:</Text>
                {[
                  "Patrol records",
                  "Shift information",
                  "Check-in and check-out information",
                  "Patrol activity",
                  "Incident reports",
                  "Incident descriptions and notes",
                  "Date and time information",
                  "NFC or checkpoint scan information",
                  "Supervisor or manager review information",
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <CheckCircle2 size={14} color={Colors.accent} style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* 1.3 Location Info */}
              <View style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <MapPin size={16} color={Colors.accent} />
                  <Text style={styles.subCardTitle}>Location Information</Text>
                </View>
                <Text style={styles.bodyText}>
                  Report Pro may collect your device&apos;s location information when location-based features are enabled and when you are performing activities that require location verification.
                </Text>
                <Text style={styles.subCardIntroBold}>Location information may include:</Text>
                {[
                  "GPS coordinates",
                  "Location timestamps",
                  "Patrol/checkpoint locations",
                  "Location information associated with shift or patrol activities",
                ].map((item, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <CheckCircle2 size={14} color={Colors.accent} style={styles.bulletIcon} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ))}
                <Text style={styles.bodyTextMuted}>
                  Location data is used to verify patrol activities, support checkpoint verification, record relevant operational events, and help organizations manage security operations.
                </Text>
                <Text style={styles.bodyTextBold}>
                  Report Pro does not use location information for purposes unrelated to the application&apos;s operational functionality.
                </Text>
                <Text style={styles.bodyTextMuted}>
                  You can manage location permissions through your device settings. If location access is disabled, some patrol or location-dependent features may not function correctly.
                </Text>
              </View>
            </View>
          )}

          {/* Section 2 */}
          {matchesSearch("Photos Documents Content Signatures Evidence Upload Camera") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>02</Text>
                </View>
                <Text style={styles.sectionTitle}>Photos, Documents and Other Content</Text>
              </View>

              <Text style={styles.sectionLead}>
                The App may allow users to upload or capture information required for security and incident reporting, including:
              </Text>

              <View style={styles.gridContainer}>
                {[
                  "Photographs",
                  "Incident evidence",
                  "Signatures",
                  "Identification documents",
                  "Supporting documents",
                  "Other files or information submitted by the user",
                ].map((item, idx) => (
                  <View key={idx} style={styles.gridBox}>
                    <Camera size={14} color={Colors.accent} style={{ marginRight: 6 }} />
                    <Text style={styles.gridBoxText}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.bodyTextMuted}>
                This information is used to create, maintain, and manage operational records and reports. Users should only upload information that is relevant to the purpose for which the feature is being used and that they are authorized to provide.
              </Text>
            </View>
          )}

          {/* Section 3 */}
          {matchesSearch("Device Technical Information System Model Crash Diagnostic Server") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>03</Text>
                </View>
                <Text style={styles.sectionTitle}>Device and Technical Information</Text>
              </View>

              <Text style={styles.sectionLead}>
                When you use the App, certain technical information may be collected automatically to help us provide and secure the service.
              </Text>

              <View style={styles.gridContainer}>
                {[
                  "Device type and model",
                  "Operating system and version",
                  "App version",
                  "Device identifiers where required for application functionality",
                  "Network information",
                  "Crash information",
                  "Error logs",
                  "Basic diagnostic information",
                ].map((item, idx) => (
                  <View key={idx} style={styles.gridBox}>
                    <Server size={14} color={Colors.accent} style={{ marginRight: 6 }} />
                    <Text style={styles.gridBoxText}>{item}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.bodyTextMuted}>
                This information may be used to troubleshoot technical problems, improve application performance, maintain security, and prevent misuse.
              </Text>
            </View>
          )}

          {/* Section 4 */}
          {matchesSearch("How We Use Your Information Account Patrol Shifts Support") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>04</Text>
                </View>
                <Text style={styles.sectionTitle}>How We Use Your Information</Text>
              </View>

              <Text style={styles.sectionLead}>
                We may use the information we collect for the following purposes:
              </Text>

              {[
                "Creating and managing user accounts.",
                "Authenticating users and maintaining account security.",
                "Managing employee and security personnel records.",
                "Managing shifts and patrol assignments.",
                "Recording patrol and checkpoint activity.",
                "Verifying location-based patrol activities.",
                "Recording and managing security incidents.",
                "Creating incident and shift reports.",
                "Allowing authorized managers and administrators to review operational information.",
                "Sending notifications related to shifts, patrols, incidents, and account activity.",
                "Providing customer support.",
                "Troubleshooting and resolving technical issues.",
                "Monitoring and improving application performance.",
                "Protecting the App against unauthorized access, fraud, or misuse.",
                "Maintaining appropriate business and operational records.",
                "Complying with applicable laws and legal requirements.",
              ].map((use, idx) => (
                <View key={idx} style={styles.numberedRow}>
                  <View style={styles.indexCircle}>
                    <Text style={styles.indexCircleText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.numberedRowText}>{use}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextMuted}>
                We do not use your personal information for purposes that are incompatible with the purpose for which it was collected unless permitted or required by applicable law.
              </Text>
            </View>
          )}

          {/* Section 5 */}
          {matchesSearch("How We Share Your Information Organization Service Providers Legal") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>05</Text>
                </View>
                <Text style={styles.sectionTitle}>How We Share Your Information</Text>
              </View>

              <Text style={styles.highlightLead}>
                We do not sell, rent, or trade your personal information to third parties.
              </Text>

              <Text style={styles.sectionLead}>
                Your information may be shared or made accessible when necessary to provide the App&apos;s services. This may include sharing information with:
              </Text>

              <View style={styles.subCard}>
                <Text style={styles.subCardTitleBold}>Your Organization</Text>
                <Text style={styles.bodyTextMuted}>
                  If you use Report Pro through an employer, security company, or other organization, authorized administrators, managers, or supervisors within that organization may have access to information related to your work activities.
                </Text>
                <Text style={styles.bodyTextMuted}>
                  This may include patrol records, incident reports, shift information, attendance information, and location information collected as part of authorized work activities.
                </Text>
              </View>

              <View style={styles.subCard}>
                <Text style={styles.subCardTitleBold}>Service Providers</Text>
                <Text style={styles.bodyTextMuted}>We may use trusted third-party service providers for services such as:</Text>
                <View style={styles.tagWrap}>
                  {[
                    "Cloud hosting",
                    "Database storage",
                    "Authentication",
                    "File storage",
                    "Email delivery",
                    "Notifications",
                    "Application monitoring",
                    "Security and technical support",
                  ].map((sp, idx) => (
                    <View key={idx} style={styles.tagItem}>
                      <Text style={styles.tagText}>{sp}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.bodyTextMuted}>
                  These providers may process information only as necessary to provide their services to us.
                </Text>
              </View>

              <View style={styles.subCard}>
                <Text style={styles.subCardTitleBold}>Legal Requirements</Text>
                <Text style={styles.bodyTextMuted}>
                  We may disclose information if required to do so by law, regulation, court order, legal process, or governmental authority, or when reasonably necessary to protect the rights, safety, security, or property of Report Pro, its users, or other parties.
                </Text>
              </View>
            </View>
          )}

          {/* Section 6 */}
          {matchesSearch("Data Security Encrypted Safeguards Transmission Access Lock") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>06</Text>
                </View>
                <Text style={styles.sectionTitle}>Data Security</Text>
              </View>

              <Text style={styles.sectionLead}>
                We take reasonable measures to protect information stored and processed through Report Pro. Security measures may include:
              </Text>

              {[
                "Encrypted network communications.",
                "Secure authentication mechanisms.",
                "Access controls and authorization.",
                "Restricted administrative access.",
                "Secure storage practices.",
                "Monitoring for unauthorized access or suspicious activity.",
                "Technical safeguards designed to protect information from unauthorized disclosure or modification.",
              ].map((sec, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Lock size={14} color={Colors.success} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{sec}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextMuted}>
                Although we take reasonable steps to protect your information, no method of electronic transmission, internet communication, or storage can be guaranteed to be completely secure.
              </Text>
            </View>
          )}

          {/* Section 7 */}
          {matchesSearch("Data Retention Period Operational Records Delete") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>07</Text>
                </View>
                <Text style={styles.sectionTitle}>Data Retention</Text>
              </View>

              <Text style={styles.sectionLead}>We retain information for as long as reasonably necessary to:</Text>

              {[
                "Provide the App and its services.",
                "Maintain operational and security records.",
                "Support your organization.",
                "Resolve disputes and technical issues.",
                "Prevent fraud or misuse.",
                "Comply with legal, regulatory, accounting, or reporting obligations.",
              ].map((ret, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <CheckCircle2 size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{ret}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextMuted}>
                Because Report Pro may be used by organizations to maintain security and incident records, certain information may need to be retained for a period determined by the organization or applicable legal requirements.
              </Text>
              <Text style={styles.bodyTextBold}>
                When information is no longer required, it may be deleted, anonymized, or securely disposed of where appropriate.
              </Text>
            </View>
          )}

          {/* Section 8 */}
          {matchesSearch("Account Data Deletion Request Contact Remove") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>08</Text>
                </View>
                <Text style={styles.sectionTitle}>Account and Data Deletion</Text>
              </View>

              <Text style={styles.bodyText}>
                If you would like your account or personal information to be deleted, you may contact your organization or site administrator, or contact Report Pro using the contact information provided in this Privacy Policy.
              </Text>
              <Text style={styles.bodyTextMuted}>
                Some information may not be immediately deleted where retention is required for legitimate business purposes, security records, legal obligations, dispute resolution, or other requirements permitted by applicable law.
              </Text>
              <Text style={styles.bodyTextBold}>
                Where deletion is requested and legally permitted, we will take reasonable steps to process the request.
              </Text>
            </View>
          )}

          {/* Section 9 */}
          {matchesSearch("Your Privacy Rights Access Correction Deletion Permissions") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>09</Text>
                </View>
                <Text style={styles.sectionTitle}>Your Privacy Rights</Text>
              </View>

              <Text style={styles.sectionLead}>
                Depending on your location and applicable privacy laws, you may have certain rights regarding your personal information. These rights may include:
              </Text>

              {[
                "The right to request access to your personal information.",
                "The right to request correction of inaccurate or incomplete information.",
                "The right to request deletion of certain personal information.",
                "The right to request information about how your data is collected and used.",
                "The right to withdraw certain permissions through your device settings.",
                "The right to raise a privacy-related complaint or concern.",
              ].map((right, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <ShieldCheck size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{right}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextMuted}>
                Some requests may be subject to legal, contractual, or operational limitations.
              </Text>

              <View style={styles.noticeBox}>
                <Text style={styles.bodyText}>
                  If your Report Pro account is managed by an organization, you may need to contact that organization first because it may control certain employee and operational information.
                </Text>
              </View>
            </View>
          )}

          {/* Section 10 */}
          {matchesSearch("Permissions Used by App Location Camera Photos Files Notifications") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>10</Text>
                </View>
                <Text style={styles.sectionTitle}>Permissions Used by the App</Text>
              </View>

              <Text style={styles.sectionLead}>
                Report Pro may request access to certain device permissions depending on the features you use. These may include:
              </Text>

              <View style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <MapPin size={16} color={Colors.accent} />
                  <Text style={styles.subCardTitle}>Location</Text>
                </View>
                <Text style={styles.bodyTextMuted}>
                  Used for patrol tracking, checkpoint verification, shift-related location records, and other location-based security functionality.
                </Text>
              </View>

              <View style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <Camera size={16} color={Colors.accent} />
                  <Text style={styles.subCardTitle}>Camera</Text>
                </View>
                <Text style={styles.bodyTextMuted}>
                  Used when you choose to capture photographs or other visual information for incident reports or operational records.
                </Text>
              </View>

              <View style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <Folder size={16} color={Colors.accent} />
                  <Text style={styles.subCardTitle}>Photos and Files</Text>
                </View>
                <Text style={styles.bodyTextMuted}>
                  Used when you choose to upload photographs, documents, or other files to the App.
                </Text>
              </View>

              <View style={styles.subCard}>
                <View style={styles.subCardHeader}>
                  <Bell size={16} color={Colors.accent} />
                  <Text style={styles.subCardTitle}>Notifications</Text>
                </View>
                <Text style={styles.bodyTextMuted}>
                  Used to provide important updates relating to shifts, patrol activities, incidents, assignments, or other application events.
                </Text>
              </View>

              <Text style={styles.bodyTextMuted}>
                You can manage available permissions through your device settings. Disabling certain permissions may affect the availability of related features.
              </Text>
            </View>
          )}

          {/* Section 11 */}
          {matchesSearch("Notifications Communications Shift Patrol Incident Assignments") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>11</Text>
                </View>
                <Text style={styles.sectionTitle}>Notifications and Communications</Text>
              </View>

              <Text style={styles.sectionLead}>Report Pro may send notifications relating to:</Text>

              {[
                "Shift assignments",
                "Patrol activities",
                "Incident reports",
                "Important account information",
                "Operational updates",
                "System or security notifications",
              ].map((notif, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Bell size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{notif}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextMuted}>
                These notifications are intended to support the application&apos;s operational functionality. You may be able to control notification permissions through your device settings.
              </Text>
            </View>
          )}

          {/* Section 12 */}
          {matchesSearch("Third Party Services Hosting Analytics Security Providers") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>12</Text>
                </View>
                <Text style={styles.sectionTitle}>Third-Party Services</Text>
              </View>

              <Text style={styles.bodyText}>
                Report Pro may rely on third-party services to provide hosting, authentication, storage, notifications, analytics, security, or other technical functionality.
              </Text>
              <Text style={styles.bodyTextMuted}>
                Third-party providers may process limited information as necessary to provide these services.
              </Text>

              <View style={styles.noticeBox}>
                <Text style={styles.bodyTextBold}>
                  We expect applicable service providers to maintain appropriate security and privacy practices. Their processing of information may also be governed by their own privacy policies and terms.
                </Text>
              </View>
            </View>
          )}

          {/* Section 13 */}
          {matchesSearch("Children Privacy Age Minor Authorized Personnel") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>13</Text>
                </View>
                <Text style={styles.sectionTitle}>Children&apos;s Privacy</Text>
              </View>

              <Text style={styles.bodyText}>
                Report Pro is intended for use by authorized employees, security personnel, managers, and other users associated with organizations using the platform.
              </Text>
              <Text style={styles.bodyTextBold}>The App is not directed toward children.</Text>
              <Text style={styles.bodyTextMuted}>
                We do not knowingly collect personal information from children for purposes unrelated to providing the application&apos;s services. If you believe that a child has provided personal information to us without appropriate authorization, please contact us so that we can investigate and take appropriate action.
              </Text>
            </View>
          )}

          {/* Section 14 */}
          {matchesSearch("International Data Processing Country Transfer Safeguards") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>14</Text>
                </View>
                <Text style={styles.sectionTitle}>International Data Processing</Text>
              </View>

              <Text style={styles.bodyTextMuted}>
                Depending on the hosting infrastructure and service providers used by Report Pro or your organization, your information may be stored or processed in countries other than the country where you live.
              </Text>

              <View style={styles.noticeBox}>
                <Text style={styles.bodyTextBold}>
                  Where required by applicable law, appropriate safeguards will be considered for international transfers and processing of personal information.
                </Text>
              </View>
            </View>
          )}

          {/* Section 15 */}
          {matchesSearch("Changes to This Privacy Policy Update Last Updated") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>15</Text>
                </View>
                <Text style={styles.sectionTitle}>Changes to This Privacy Policy</Text>
              </View>

              <Text style={styles.sectionLead}>
                We may update this Privacy Policy from time to time to reflect changes in:
              </Text>

              {[
                "The App or its features.",
                "Our data handling practices.",
                "Security practices.",
                "Legal or regulatory requirements.",
              ].map((chg, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <CheckCircle2 size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{chg}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextMuted}>
                When we make changes, we will update the &quot;Last Updated&quot; date at the beginning of this Privacy Policy.
              </Text>
              <Text style={styles.bodyTextBold}>
                We encourage users to periodically review this Privacy Policy to remain informed about how their information is handled.
              </Text>
            </View>
          )}

          {/* Section 16 */}
          {matchesSearch("Contact Us Email Questions Support Organization Manager") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>16</Text>
                </View>
                <Text style={styles.sectionTitle}>Contact Us</Text>
              </View>

              <Text style={styles.bodyText}>
                If you have questions, concerns, or requests regarding this Privacy Policy or the handling of your personal information, please contact us.
              </Text>

              <TouchableOpacity style={styles.emailCard} onPress={handleEmailPress} activeOpacity={0.7}>
                <Mail size={20} color={Colors.accent} style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.emailLabel}>Email Support</Text>
                  <Text style={styles.emailValue}>support@reportpro.com.au</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.bodyTextMuted}>
                You may also contact your employer, organization administrator, or site administrator regarding information collected and managed as part of your employment or security duties.
              </Text>
            </View>
          )}

          {/* Section 17 */}
          {matchesSearch("Acceptance Agree Acknowledge Terms Policy") && (
            <View style={[styles.sectionCard, styles.acceptanceCard]}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>17</Text>
                </View>
                <Text style={styles.sectionTitle}>Acceptance</Text>
              </View>

              <Text style={styles.bodyTextBold}>
                By accessing or using Report Pro, you acknowledge that you have read and understood this Privacy Policy and agree to the collection and use of information as described above, subject to applicable law and your organization&apos;s policies.
              </Text>

              <View style={styles.footerDivider} />

              <View style={styles.footerRow}>
                <Text style={styles.footerBrand}>Report Pro</Text>
                <TouchableOpacity onPress={handleEmailPress}>
                  <Text style={styles.footerEmail}>support@reportpro.com.au</Text>
                </TouchableOpacity>
                <Text style={styles.footerDate}>Last Updated: June 2026</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgAlt },
  safe: { flex: 1, backgroundColor: Colors.bgAlt },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.bgAlt,
  },
  backButton: {
    padding: 4,
  },
  back: { fontSize: 24, fontWeight: 'bold', color: Colors.textPrimary },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  headerSpacer: { width: 28 },

  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },

  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32 },

  introCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: Colors.accentAlpha12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  heroSub: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  introText: {
    fontSize: FontSizes.base,
    lineHeight: 18,
    color: Colors.textPrimary,
    fontWeight: '500',
    marginBottom: 12,
  },
  acknowledgeBanner: {
    backgroundColor: Colors.accentAlpha12,
    borderWidth: 1,
    borderColor: Colors.accentAlpha25,
    borderRadius: Radii.md,
    padding: 12,
  },
  acknowledgeText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 18,
  },

  sectionCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  numberBadge: {
    width: 32,
    height: 32,
    borderRadius: Radii.sm,
    backgroundColor: Colors.accentAlpha12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  numberBadgeText: {
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: Colors.accent,
  },
  sectionTitle: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionLead: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 10,
  },
  highlightLead: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },

  subCard: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.md,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  subCardTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 6,
  },
  subCardTitleBold: {
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subCardIntro: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  subCardIntroBold: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 6,
    marginBottom: 6,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingRight: 8,
  },
  bulletIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    lineHeight: 17,
  },

  numberedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.sm,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  indexCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.accentAlpha25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  indexCircleText: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  numberedRowText: {
    flex: 1,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    lineHeight: 18,
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 8,
  },
  gridBox: {
    width: '48%',
    margin: '1%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridBoxText: {
    flex: 1,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 6,
  },
  tagItem: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },

  noticeBox: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.md,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.md,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emailLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  emailValue: {
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: Colors.accent,
    marginTop: 2,
  },

  bodyText: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    lineHeight: 18,
    marginBottom: 6,
  },
  bodyTextMuted: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 6,
  },
  bodyTextBold: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 6,
  },

  acceptanceCard: {
    backgroundColor: Colors.bgCard,
  },
  footerDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: 'column',
    gap: 4,
  },
  footerBrand: {
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  footerEmail: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.accent,
  },
  footerDate: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

