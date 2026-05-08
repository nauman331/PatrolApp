import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Colors, FontSizes, Radii, Spacing, Shadows } from '../theme';
import { NavBar } from '../components';
import {
  AlertTriangle,
  ClipboardList,
  Home,
  Route,
  User,
  Camera,
  Clock,
  MapPin,
  FileText,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react-native';
import { useGuardNavigation } from '../navigation/utils';
import { GUARD_ROUTES } from '../navigation/constants';

interface ShiftData {
  site: string;
  id: string;
  time: string;
  zones: string;
  status: 'active' | 'upcoming';
}

const SOPS = [
  { icon: FileText, label: 'Emergency Procedures' },
  { icon: FileText, label: 'Patrol Checkpoints' },
  { icon: FileText, label: 'Incident Reporting Guide' },
];

export default function ShiftSignInScreen({
  shift,
}: { shift?: ShiftData }) {
  const navigation = useGuardNavigation();
  const isActiveShift = shift?.status === 'active';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.headerStart} />
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.decorCircle} />

            <View style={styles.hdrTopRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <ArrowLeft size={18} color="rgba(255,255,255,0.8)" />
              </TouchableOpacity>
              <Text style={styles.hdrTitle}>
                {isActiveShift ? 'Active Shift' : 'Sign In / Sign Out'}
              </Text>
            </View>

            {/* Site Info */}
            <View style={styles.siteBox}>
              <Text style={styles.siteBoxLbl}>CURRENT SITE</Text>
              <Text style={styles.siteBoxName}>
                {shift?.site || 'Mall of Lahore'}
              </Text>
              <View style={styles.siteTimeRow}>
                <Clock size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.siteBoxTime}>
                  {shift?.time || '06:00 AM – 02:00 PM'} · {shift?.zones || 'Zone A, B, C'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.body}>
            {/* Selfie Verification */}
            <View style={[styles.card, Shadows.card]}>
              <Text style={styles.cardTitle}>
                <Camera size={16} color={Colors.textPrimary} /> Selfie Verification
              </Text>

              {/* Camera preview placeholder */}
              <View style={styles.camArea}>
                <Camera size={48} color="rgba(10, 10, 10, 0.25)" />
                <View />
                <Text style={styles.camHint}>Align your face within the frame</Text>
              </View>

              <View style={styles.camBtns}>
                <TouchableOpacity style={styles.camBtn}>
                  <Text style={styles.camBtnText}>📷 Capture Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.camBtn, styles.camBtnPrimary]}>
                  <Text style={styles.camBtnPrimaryText}>✓ Verify Face</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Site SOPs */}
            <View style={[styles.card, Shadows.card]}>
              <Text style={styles.cardTitle}>
                📋 Site SOPs
              </Text>
              {SOPS.map((sop, i) => (
                <View key={i} style={styles.sopItem}>
                  <View style={styles.sopLeft}>
                    <sop.icon size={18} color={Colors.textPrimary} />
                    <Text style={styles.sopLabel}>{sop.label}</Text>
                  </View>
                  <Text style={styles.sopView}>VIEW</Text>
                </View>
              ))}
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => navigation.navigate(GUARD_ROUTES.PATROL_TIMELINE)}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {isActiveShift ? (
                  <CheckCircle size={20} color="#fff" />
                ) : (
                  <CheckCircle size={20} color="#fff" />
                )}
                <Text style={styles.signInBtnText}>
                  {isActiveShift ? 'CONTINUE SHIFT' : 'SIGN IN TO SHIFT'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <NavBar
          variant="light"
          items={[
            { icon: Home, label: 'Home' },
            { icon: Route, label: 'Patrol' },
            { icon: AlertTriangle, label: 'Incidents' },
            { icon: ClipboardList, label: 'Shifts', active: true },
            { icon: User, label: 'Profile' },
          ]}
          onPress={(i) => {
            const screens = [
              GUARD_ROUTES.DASHBOARD,
              GUARD_ROUTES.PATROL_TIMELINE,
              GUARD_ROUTES.INCIDENTS,
              GUARD_ROUTES.SHIFTS,
              GUARD_ROUTES.PROFILE,
            ];
            navigation.navigate(screens[i]);
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgAlt },
  safe: { flex: 1 },

  header: {
    backgroundColor: Colors.headerStart,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 38,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(121,31,61,0.08)',
  },
  hdrTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  backBtn: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hdrTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.white,
  },

  siteBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.lg,
    padding: 14,
  },
  siteBoxLbl: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  siteBoxName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 6,
  },
  siteTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  siteBoxTime: {
    fontSize: FontSizes.xs,
    color: 'rgba(255,255,255,0.6)',
  },

  body: { padding: 14 },

  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  camArea: {
    height: 160,
    // backgroundColor: Colors.headerStart,
    backgroundColor: '#fff',
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.accent,
  },

  camFrame: {
    position: 'absolute',
    inset: 16,
    borderWidth: 2.5,
    // borderColor: 'rgba(255,255,255,0.3)',
    borderColor: Colors.accent,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  camHint: {
    position: 'absolute',
    bottom: 30,
    fontSize: FontSizes.xs,
    // color: 'rgba(255,255,255,0.35)',
    color: Colors.accent,
    textAlign: 'center',
  },
  camBtns: { flexDirection: 'row', gap: 8 },
  camBtn: {
    flex: 1,
    backgroundColor: Colors.bgAlt,

    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    paddingVertical: 11,
    alignItems: 'center',
  },
  camBtnText: {
    fontSize: FontSizes.xs,
    color: '#666',
    fontWeight: '700',
  },
  camBtnPrimary: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  camBtnPrimaryText: {
    fontSize: FontSizes.xs,
    color: Colors.white,
    fontWeight: '700',
  },

  sopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 7,
  },
  sopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sopLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sopView: {
    fontSize: FontSizes.xs,
    color: Colors.accent,
    fontWeight: '700',
  },

  signInBtn: {
    backgroundColor: Colors.textPrimary,
    borderRadius: Radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  signInBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});