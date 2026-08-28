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
  FileText,
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  Mail,
  Ban,
  Lock,
  MapPin,
  Camera,
  Server,
  UserX,
  Cpu,
  Scale,
  Search,
  X,
} from 'lucide-react-native';

const SECTIONS = [
  { id: 'sec-1', number: '01', title: 'About Report Pro' },
  { id: 'sec-2', number: '02', title: 'Eligibility and Authorized Use' },
  { id: 'sec-3', number: '03', title: 'Account Registration and Security' },
  { id: 'sec-4', number: '04', title: 'Patrol and Shift Activities' },
  { id: 'sec-5', number: '05', title: 'Incident Reports and User-Submitted Content' },
  { id: 'sec-6', number: '06', title: 'Location and GPS Features' },
  { id: 'sec-7', number: '07', title: 'Photos, Documents and Signatures' },
  { id: 'sec-8', number: '08', title: 'Prohibited Activities' },
  { id: 'sec-9', number: '09', title: 'Organization and Administrator Access' },
  { id: 'sec-10', number: '10', title: 'Intellectual Property' },
  { id: 'sec-11', number: '11', title: 'User Content and Data' },
  { id: 'sec-12', number: '12', title: 'Third-Party Services' },
  { id: 'sec-13', number: '13', title: 'Availability of the Service' },
  { id: 'sec-14', number: '14', title: 'Device and Network Requirements' },
  { id: 'sec-15', number: '15', title: 'Accuracy of Information' },
  { id: 'sec-16', number: '16', title: 'Limitation of Liability' },
  { id: 'sec-17', number: '17', title: 'Indemnification' },
  { id: 'sec-18', number: '18', title: 'Account Suspension or Termination' },
  { id: 'sec-19', number: '19', title: 'Changes to the App' },
  { id: 'sec-20', number: '20', title: 'Changes to These Terms' },
  { id: 'sec-21', number: '21', title: 'Privacy' },
  { id: 'sec-22', number: '22', title: 'Governing Law' },
  { id: 'sec-23', number: '23', title: 'Contact Us' },
  { id: 'sec-24', number: '24', title: 'Acceptance of These Terms' },
];

export default function TermsConditionsScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');

  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@reportpro.com.au').catch(() => {});
  };

  const handlePrivacyPress = () => {
    navigation.navigate('PrivacyPolicy');
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
          <Text style={styles.title}>Terms & Conditions</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={16} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search terms sections..."
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
                <FileText size={24} color={Colors.accent} />
              </View>

              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>Report Pro Terms & Conditions</Text>
                <Text style={styles.heroSub}>Last updated: June 2026</Text>
              </View>
            </View>

            <Text style={styles.introText}>
              These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of the Report Pro mobile application (&quot;App&quot;), operated by Report Pro (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
            </Text>

            <View style={styles.acknowledgeBanner}>
              <Text style={styles.acknowledgeText}>
                By downloading, accessing, registering for, or using Report Pro, you agree to these Terms and Conditions. If you do not agree with these Terms, you should not use the App.
              </Text>
            </View>
          </View>

          {/* Section 1 */}
          {matchesSearch("About Report Pro Operational Platform Patrol Shift Security") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>01</Text>
                </View>
                <Text style={styles.sectionTitle}>About Report Pro</Text>
              </View>

              <Text style={styles.bodyText}>
                Report Pro is an operational platform designed to assist security personnel, organizations, managers, and authorized users with activities such as patrol management, shift management, incident reporting, checkpoint verification, and operational record keeping.
              </Text>

              <View style={styles.noticeBox}>
                <Text style={styles.bodyTextMuted}>
                  The App is provided as a technology and reporting tool. It does not replace professional judgment, organizational procedures, security training, or applicable legal requirements.
                </Text>
              </View>
            </View>
          )}

          {/* Section 2 */}
          {matchesSearch("Eligibility Authorized Use Security Personnel Account Responsibilities") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>02</Text>
                </View>
                <Text style={styles.sectionTitle}>Eligibility and Authorized Use</Text>
              </View>

              <Text style={styles.sectionLead}>
                Report Pro is intended for use by authorized security personnel, employees, managers, supervisors, administrators, and other users approved by an organization using the platform.
              </Text>

              <Text style={styles.subCardIntroBold}>You agree to:</Text>
              {[
                "Use the App only for legitimate and authorized purposes.",
                "Provide accurate information when creating or using an account.",
                "Follow your organization's policies and procedures.",
                "Comply with all applicable laws and regulations.",
                "Use the App only within the scope of your assigned responsibilities.",
              ].map((rule, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <CheckCircle2 size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{rule}</Text>
                </View>
              ))}

              <View style={styles.noticeBox}>
                <Text style={styles.bodyTextBold}>
                  You must not allow another person to use your account unless specifically authorized by your organization.
                </Text>
              </View>
            </View>
          )}

          {/* Section 3 */}
          {matchesSearch("Account Registration Security Credentials Password Confidential Suspend") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>03</Text>
                </View>
                <Text style={styles.sectionTitle}>Account Registration and Security</Text>
              </View>

              <Text style={styles.sectionLead}>
                Certain features require an account and login credentials. You are responsible for:
              </Text>

              {[
                "Keeping your username, password, PIN, or other authentication information confidential.",
                "Providing accurate and current account information.",
                "Taking reasonable steps to prevent unauthorized access to your account.",
                "Immediately reporting suspected unauthorized access or security issues.",
                "Logging out or securing your device when necessary.",
              ].map((item, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Lock size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}

              <Text style={styles.bodyText}>
                You are responsible for activity performed through your account to the extent permitted by applicable law.
              </Text>

              <Text style={styles.bodyTextMuted}>
                We may suspend or restrict an account if we reasonably believe it has been compromised, misused, or used in violation of these Terms.
              </Text>
            </View>
          )}

          {/* Section 4 */}
          {matchesSearch("Patrol Shift Activities Scanning Checkpoint Timestamps False Records") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>04</Text>
                </View>
                <Text style={styles.sectionTitle}>Patrol and Shift Activities</Text>
              </View>

              <Text style={styles.sectionLead}>
                Report Pro may provide features for recording and managing security shifts and patrol activities. Depending on your organization&apos;s configuration, these features may include:
              </Text>

              <View style={styles.gridContainer}>
                {[
                  "Shift start and end records.",
                  "Patrol activity.",
                  "Location verification.",
                  "NFC or checkpoint scanning.",
                  "Patrol timestamps.",
                  "Incident reporting.",
                  "Photos and supporting evidence.",
                  "Manager or supervisor review.",
                ].map((feature, idx) => (
                  <View key={idx} style={styles.gridBox}>
                    <CheckCircle2 size={14} color={Colors.accent} style={{ marginRight: 6 }} />
                    <Text style={styles.gridBoxText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.bodyTextBold}>
                You are responsible for using these features honestly and in accordance with your organization&apos;s procedures.
              </Text>

              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  The App should not be used to intentionally create false, misleading, incomplete, or fraudulent operational records.
                </Text>
              </View>
            </View>
          )}

          {/* Section 5 */}
          {matchesSearch("Incident Reports User Content Submitted False Fraudulent Impersonate") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>05</Text>
                </View>
                <Text style={styles.sectionTitle}>Incident Reports and User-Submitted Content</Text>
              </View>

              <Text style={styles.sectionLead}>
                Users may submit incident reports, descriptions, photographs, signatures, documents, and other information through the App. You are responsible for ensuring that information you submit is:
              </Text>

              {[
                "Accurate to the best of your knowledge.",
                "Relevant to the applicable incident or operational activity.",
                "Submitted in good faith.",
                "Not intentionally misleading or fraudulent.",
                "Lawful and authorized for submission.",
              ].map((req, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <CheckCircle2 size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{req}</Text>
                </View>
              ))}

              <View style={styles.noticeBox}>
                <Text style={styles.bodyTextBold}>
                  You must not knowingly submit false incident reports, manipulate records, impersonate another person, or intentionally alter information for an improper purpose.
                </Text>
              </View>

              <Text style={styles.bodyTextMuted}>
                Your organization may review, approve, modify, retain, or act upon information submitted through the App in accordance with its policies.
              </Text>
            </View>
          )}

          {/* Section 6 */}
          {matchesSearch("Location GPS Features Accuracy Patrol Verification Operating System") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>06</Text>
                </View>
                <Text style={styles.sectionTitle}>Location and GPS Features</Text>
              </View>

              <Text style={styles.sectionLead}>
                Certain Report Pro features may require access to your device&apos;s location. Location functionality may be used for purposes such as:
              </Text>

              {[
                "Verifying patrol activity.",
                "Recording checkpoint or patrol locations.",
                "Confirming shift-related activities.",
                "Supporting operational reporting.",
                "Providing security management functionality.",
              ].map((loc, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <MapPin size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{loc}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextBold}>
                You are responsible for ensuring that location services and required permissions are enabled when your assigned duties require them.
              </Text>

              <Text style={styles.bodyTextMuted}>
                Report Pro cannot guarantee that GPS or location information will always be available or accurate because location accuracy may depend on your device, network availability, environmental conditions, and operating system.
              </Text>
            </View>
          )}

          {/* Section 7 */}
          {matchesSearch("Photos Documents Signatures Upload Prohibited Illegal Malware Infringe") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>07</Text>
                </View>
                <Text style={styles.sectionTitle}>Photos, Documents and Signatures</Text>
              </View>

              <Text style={styles.bodyText}>
                The App may allow users to capture or upload photographs, documents, signatures, and other supporting information. You agree that you will only upload or submit content that you are legally authorized to use and submit.
              </Text>

              <Text style={styles.warningLead}>You must not use the App to upload:</Text>
              {[
                "Illegal content.",
                "Malicious software.",
                "Content intended to harm another person.",
                "Content that infringes another person's intellectual property rights.",
                "Content that you are not authorized to collect or share.",
              ].map((noharm, idx) => (
                <View key={idx} style={styles.prohibitedRow}>
                  <Ban size={14} color={Colors.danger} style={styles.bulletIcon} />
                  <Text style={styles.prohibitedText}>{noharm}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextMuted}>
                Your organization may establish additional rules regarding what information may be uploaded through the App.
              </Text>
            </View>
          )}

          {/* Section 8 */}
          {matchesSearch("Prohibited Activities Unlawful Fraud Reverse Engineer Malware Overload") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>08</Text>
                </View>
                <Text style={styles.sectionTitle}>Prohibited Activities</Text>
              </View>

              <Text style={styles.warningLead}>You must not:</Text>
              {[
                "Use the App for unlawful or fraudulent purposes.",
                "Attempt to access accounts, records, or information belonging to another user without authorization.",
                "Circumvent or disable security features.",
                "Reverse engineer, decompile, or attempt to extract source code from the App except where expressly permitted by applicable law.",
                "Introduce malware, viruses, or other harmful code.",
                "Interfere with the operation or availability of the App.",
                "Attempt to gain unauthorized access to our systems or servers.",
                "Use automated methods to abuse or overload the service.",
                "Create false or fraudulent patrol or incident records.",
                "Impersonate another user or organization.",
                "Use information obtained through the App for unauthorized purposes.",
                "Attempt to manipulate, delete, or alter records without appropriate authorization.",
              ].map((p, idx) => (
                <View key={idx} style={styles.prohibitedRow}>
                  <AlertOctagon size={14} color={Colors.danger} style={styles.bulletIcon} />
                  <Text style={styles.prohibitedText}>{p}</Text>
                </View>
              ))}

              <View style={styles.noticeBox}>
                <Text style={styles.bodyTextBold}>
                  We may take appropriate action, including restricting or terminating access, where prohibited activity is detected.
                </Text>
              </View>
            </View>
          )}

          {/* Section 9 */}
          {matchesSearch("Organization Administrator Access Employer Supervisors View Records") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>09</Text>
                </View>
                <Text style={styles.sectionTitle}>Organization and Administrator Access</Text>
              </View>

              <Text style={styles.sectionLead}>
                If you use Report Pro through an employer or organization, your organization may have administrative access to information associated with your account and work activities. Authorized administrators may be able to view information such as:
              </Text>

              {[
                "Profile information.",
                "Shift information.",
                "Patrol records.",
                "Incident reports.",
                "Location information associated with operational activities.",
                "Uploaded photographs and documents.",
                "Checkpoint or NFC records.",
              ].map((info, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <CheckCircle2 size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{info}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextMuted}>
                Your use of the App may therefore be subject to additional policies, agreements, or instructions provided by your employer or organization.
              </Text>
            </View>
          )}

          {/* Section 10 */}
          {matchesSearch("Intellectual Property Software Design Logo Copyright Trademarks") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>10</Text>
                </View>
                <Text style={styles.sectionTitle}>Intellectual Property</Text>
              </View>

              <Text style={styles.bodyText}>
                The Report Pro application, including its software, interface, design, logos, graphics, features, text, and other materials, may be protected by applicable intellectual property laws.
              </Text>

              <Text style={styles.subCardIntroBold}>Except where expressly permitted, you may not:</Text>
              {[
                "Copy the App or its design.",
                "Reproduce or distribute application materials.",
                "Modify or create derivative works.",
                "Sell, license, or commercially exploit the App without authorization.",
                "Remove copyright, trademark, or other proprietary notices.",
              ].map((ip, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <ShieldAlert size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{ip}</Text>
                </View>
              ))}

              <View style={styles.noticeBox}>
                <Text style={styles.bodyTextBold}>
                  These Terms do not transfer ownership of the App or its intellectual property to you.
                </Text>
              </View>
            </View>
          )}

          {/* Section 11 */}
          {matchesSearch("User Content Data Rights License Grant Organization Retention") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>11</Text>
                </View>
                <Text style={styles.sectionTitle}>User Content and Data</Text>
              </View>

              <Text style={styles.bodyText}>
                You retain any rights you may have in content that you are legally entitled to submit through the App.
              </Text>
              <Text style={styles.bodyTextMuted}>
                By submitting content through Report Pro, you grant us and applicable service providers the permissions reasonably necessary to store, process, transmit, display, and otherwise handle that content for the purpose of providing the App and its services.
              </Text>

              <View style={styles.noticeBox}>
                <Text style={styles.bodyTextBold}>
                  Where your organization controls the relevant operational information, your organization&apos;s policies and agreements may determine how that information is managed and retained.
                </Text>
              </View>
            </View>
          )}

          {/* Section 12 */}
          {matchesSearch("Third-Party Services Hosting Infrastructure Interruptions Outages") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>12</Text>
                </View>
                <Text style={styles.sectionTitle}>Third-Party Services</Text>
              </View>

              <Text style={styles.bodyTextMuted}>
                Report Pro may use third-party services to provide functionality such as hosting, authentication, notifications, file storage, analytics, security, and technical infrastructure.
              </Text>
              <Text style={styles.bodyTextMuted}>
                Third-party services may be subject to their own terms and privacy policies.
              </Text>

              <View style={styles.noticeBox}>
                <Text style={styles.bodyTextBold}>
                  We are not responsible for third-party services that are outside our reasonable control, including interruptions, changes, or failures caused by those services.
                </Text>
              </View>
            </View>
          )}

          {/* Section 13 */}
          {matchesSearch("Availability of Service Outages Maintenance Errors Guarantee") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>13</Text>
                </View>
                <Text style={styles.sectionTitle}>Availability of the Service</Text>
              </View>

              <Text style={styles.sectionLead}>
                We aim to keep Report Pro available and functioning reliably, but we do not guarantee that the App will always be:
              </Text>

              {[
                "Available without interruption.",
                "Free from errors.",
                "Compatible with every device or operating system.",
                "Free from temporary outages or technical problems.",
              ].map((avail, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <CheckCircle2 size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{avail}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextMuted}>
                Access may be temporarily unavailable because of maintenance, updates, network problems, device issues, security incidents, third-party service failures, or circumstances beyond our reasonable control.
              </Text>
            </View>
          )}

          {/* Section 14 */}
          {matchesSearch("Device Network Requirements Internet Connectivity SMS Mobile Data") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>14</Text>
                </View>
                <Text style={styles.sectionTitle}>Device and Network Requirements</Text>
              </View>

              <Text style={styles.sectionLead}>Your ability to use Report Pro may depend on:</Text>

              {[
                "A compatible mobile device.",
                "A supported operating system.",
                "Internet or mobile network connectivity.",
                "Required device permissions.",
                "Sufficient device storage and resources.",
              ].map((req, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <Cpu size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{req}</Text>
                </View>
              ))}

              <Text style={styles.bodyText}>
                You are responsible for maintaining your device, internet connection, and operating system as necessary to use the App.
              </Text>

              <Text style={styles.bodyTextMuted}>
                Standard mobile network, internet, SMS, or other provider charges may apply depending on your service provider.
              </Text>
            </View>
          )}

          {/* Section 15 */}
          {matchesSearch("Accuracy of Information Decisions Operational Review GPS") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>15</Text>
                </View>
                <Text style={styles.sectionTitle}>Accuracy of Information</Text>
              </View>

              <Text style={styles.bodyText}>
                Report Pro provides tools for recording and managing information. We do not guarantee that all information entered by users, received from devices, or generated through the App will always be complete, accurate, or available.
              </Text>

              <Text style={styles.bodyTextMuted}>
                For example, location information may be affected by GPS accuracy, network availability, device configuration, or environmental conditions.
              </Text>

              <View style={styles.noticeBox}>
                <Text style={styles.bodyTextBold}>
                  Users and organizations remain responsible for reviewing important information and making appropriate operational decisions.
                </Text>
              </View>
            </View>
          )}

          {/* Section 16 */}
          {matchesSearch("Limitation of Liability Loss Direct Indirect Special Consequential") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>16</Text>
                </View>
                <Text style={styles.sectionTitle}>Limitation of Liability</Text>
              </View>

              <Text style={styles.bodyTextBold}>
                To the maximum extent permitted by applicable law, Report Pro and its operators, employees, service providers, and affiliates will not be responsible for indirect, incidental, special, consequential, or similar losses arising from the use of or inability to use the App.
              </Text>

              <Text style={styles.subCardIntroBold}>This may include losses resulting from:</Text>
              {[
                "Device failure.",
                "Internet or network outages.",
                "GPS or location inaccuracies.",
                "Third-party service interruptions.",
                "Incorrect information entered by users.",
                "Lost or delayed notifications.",
                "Unauthorized account access resulting from compromised user credentials.",
                "Decisions made based on incomplete or inaccurate information.",
              ].map((loss, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <ShieldAlert size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{loss}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextMuted}>
                Nothing in these Terms excludes or limits liability where such exclusion or limitation is prohibited by applicable law.
              </Text>
            </View>
          )}

          {/* Section 17 */}
          {matchesSearch("Indemnification Claims Losses Misuse Violation Account Activity") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>17</Text>
                </View>
                <Text style={styles.sectionTitle}>Indemnification</Text>
              </View>

              <Text style={styles.bodyText}>
                To the extent permitted by applicable law, you agree to be responsible for claims, losses, damages, liabilities, and reasonable expenses arising from your misuse of the App, violation of these Terms, unlawful activity, or unauthorized content submitted through your account.
              </Text>
            </View>
          )}

          {/* Section 18 */}
          {matchesSearch("Account Suspension Termination Restrict Access Violation Organization") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>18</Text>
                </View>
                <Text style={styles.sectionTitle}>Account Suspension or Termination</Text>
              </View>

              <Text style={styles.sectionLead}>
                We or your organization may suspend, restrict, or terminate access to the App where reasonably necessary, including if:
              </Text>

              {[
                "You violate these Terms.",
                "Your organization removes your authorization.",
                "Your account is suspected of unauthorized use.",
                "Your use creates a security or operational risk.",
                "Required by law or regulatory authorities.",
                "The service or a particular feature is discontinued.",
              ].map((term, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <UserX size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{term}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextMuted}>
                Termination or suspension may result in loss of access to certain application features and information.
              </Text>

              <Text style={styles.bodyText}>
                Where applicable, information may continue to be retained according to our Privacy Policy, your organization&apos;s requirements, or applicable law.
              </Text>
            </View>
          )}

          {/* Section 19 */}
          {matchesSearch("Changes to the App Features Modifications Updates Security Bugs") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>19</Text>
                </View>
                <Text style={styles.sectionTitle}>Changes to the App</Text>
              </View>

              <Text style={styles.sectionLead}>
                We may modify, update, add, or remove features from Report Pro from time to time. Updates may be required to:
              </Text>

              {[
                "Improve security.",
                "Fix bugs.",
                "Improve performance.",
                "Add new functionality.",
                "Maintain compatibility.",
                "Meet legal or technical requirements.",
              ].map((up, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <CheckCircle2 size={14} color={Colors.accent} style={styles.bulletIcon} />
                  <Text style={styles.bulletText}>{up}</Text>
                </View>
              ))}

              <Text style={styles.bodyTextMuted}>
                Some updates may be required before you can continue using certain features.
              </Text>
            </View>
          )}

          {/* Section 20 */}
          {matchesSearch("Changes to These Terms Revised Acceptance Continued Use") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>20</Text>
                </View>
                <Text style={styles.sectionTitle}>Changes to These Terms</Text>
              </View>

              <Text style={styles.bodyText}>
                We may update these Terms and Conditions from time to time.
              </Text>

              <Text style={styles.bodyTextMuted}>
                When changes are made, we may update the &quot;Last Updated&quot; date and make the revised Terms available through the App or other appropriate channels.
              </Text>

              <View style={styles.noticeBox}>
                <Text style={styles.bodyTextBold}>
                  Your continued use of Report Pro after the updated Terms become effective may constitute acceptance of the revised Terms, to the extent permitted by applicable law.
                </Text>
              </View>
            </View>
          )}

          {/* Section 21 */}
          {matchesSearch("Privacy Policy Personal Information Data Handling Rights") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>21</Text>
                </View>
                <Text style={styles.sectionTitle}>Privacy</Text>
              </View>

              <Text style={styles.bodyText}>
                Your use of Report Pro is also subject to our Privacy Policy, which explains how personal information, location information, photographs, documents, and other data may be collected and processed.
              </Text>

              <TouchableOpacity onPress={handlePrivacyPress} style={{ marginTop: 6 }}>
                <Text style={styles.linkText}>You should review the Privacy Policy before using the App →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Section 22 */}
          {matchesSearch("Governing Law Jurisdiction Invalid Provisions Enforceable") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>22</Text>
                </View>
                <Text style={styles.sectionTitle}>Governing Law</Text>
              </View>

              <Text style={styles.bodyText}>
                These Terms are intended to operate in accordance with applicable laws and regulations.
              </Text>

              <Text style={styles.bodyTextMuted}>
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue to apply to the extent permitted by law.
              </Text>
            </View>
          )}

          {/* Section 23 */}
          {matchesSearch("Contact Us Email Questions Employer Site Administrator Manager") && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>23</Text>
                </View>
                <Text style={styles.sectionTitle}>Contact Us</Text>
              </View>

              <Text style={styles.bodyText}>
                If you have questions regarding these Terms and Conditions, the operation of Report Pro, or your account, please contact us.
              </Text>

              <TouchableOpacity style={styles.emailCard} onPress={handleEmailPress} activeOpacity={0.7}>
                <Mail size={20} color={Colors.accent} style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.emailLabel}>Email Support</Text>
                  <Text style={styles.emailValue}>support@reportpro.com.au</Text>
                </View>
              </TouchableOpacity>

              <Text style={styles.bodyTextMuted}>
                For employment-related questions, account permissions, patrol assignments, or organization-specific policies, you may also contact your employer, site administrator, or authorized manager.
              </Text>
            </View>
          )}

          {/* Section 24 */}
          {matchesSearch("Acceptance of These Terms Downloading Accessing Registering Discontinue") && (
            <View style={[styles.sectionCard, styles.acceptanceCard]}>
              <View style={styles.sectionHeader}>
                <View style={styles.numberBadge}>
                  <Text style={styles.numberBadgeText}>24</Text>
                </View>
                <Text style={styles.sectionTitle}>Acceptance of These Terms</Text>
              </View>

              <Text style={styles.bodyTextBold}>
                By downloading, accessing, registering for, or using Report Pro, you confirm that you have read and understood these Terms and Conditions and agree to comply with them.
              </Text>

              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  If you do not agree with these Terms, you should discontinue use of the App.
                </Text>
              </View>

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

  prohibitedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.dangerLight || '#fde8e8',
    borderRadius: Radii.sm,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.danger || '#e53e3e',
  },
  prohibitedText: {
    flex: 1,
    fontSize: FontSizes.base,
    color: Colors.danger || '#e53e3e',
    fontWeight: '600',
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

  noticeBox: {
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.md,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  warningBox: {
    backgroundColor: Colors.dangerLight || '#fde8e8',
    borderRadius: Radii.md,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.danger || '#e53e3e',
  },
  warningLead: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.danger || '#e53e3e',
    marginTop: 4,
    marginBottom: 8,
  },
  warningText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.danger || '#e53e3e',
    lineHeight: 18,
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
  linkText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.accent,
    textDecorationLine: 'underline',
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

