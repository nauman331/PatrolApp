import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Platform,
} from 'react-native';
import { CheckCircle2, ScanLine, X } from 'lucide-react-native';
import { Colors, FontSizes, Radii } from '../theme';
import type { NfcTagInfo } from '../services/nfcReader';

type NfcScanModalProps = {
  visible: boolean;
  isListening: boolean;
  isSubmitting: boolean;
  gateHint?: string | null;
  statusHint?: string | null;
  tagInfo?: NfcTagInfo | null;
  onCancel: () => void;
  onConfirm?: () => void;
  onRescan?: () => void;
  onOpenSettings?: () => void;
};

export function NfcScanModal({
  visible,
  isListening,
  isSubmitting,
  gateHint,
  statusHint,
  tagInfo,
  onCancel,
  onConfirm,
  onRescan,
  onOpenSettings,
}: NfcScanModalProps) {
  const showConfirm = !!tagInfo && !isSubmitting;
  const showRetry =
    !isListening && !isSubmitting && !tagInfo && !!onRescan && !!statusHint;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          {!isSubmitting ? (
            <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
              <X size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}

          <View style={[styles.iconWrap, showConfirm && styles.iconWrapSuccess]}>
            {isSubmitting ? (
              <ActivityIndicator size="large" color={Colors.accent} />
            ) : showConfirm ? (
              <CheckCircle2 size={36} color={Colors.success} />
            ) : (
              <ScanLine size={36} color={Colors.accent} />
            )}
          </View>

          {isSubmitting ? (
            <>
              <Text style={styles.title}>Submitting Scan</Text>
              <Text style={styles.message}>
                Sending checkpoint scan to the server…
              </Text>
              {tagInfo ? (
                <View style={styles.uidBox}>
                  <Text style={styles.uidText}>{tagInfo.uid}</Text>
                </View>
              ) : null}
            </>
          ) : showConfirm ? (
            <>
              <Text style={styles.title}>NFC Tag Detected</Text>
              <Text style={styles.message}>
                Review the tag details, then tap Continue to record this
                checkpoint.
              </Text>

              <View style={styles.uidBox}>
                <Text style={styles.uidLabel}>TAG UID</Text>
                <Text style={styles.uidText}>{tagInfo.uid}</Text>
                {tagInfo.techTypes.length > 0 ? (
                  <Text style={styles.uidMeta}>
                    {tagInfo.techTypes.join(' · ')}
                  </Text>
                ) : tagInfo.type ? (
                  <Text style={styles.uidMeta}>{tagInfo.type}</Text>
                ) : null}
              </View>

              {gateHint ? (
                <Text style={styles.gateHint}>Checkpoint: {gateHint}</Text>
              ) : null}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onConfirm}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </TouchableOpacity>

              {onRescan ? (
                <TouchableOpacity style={styles.secondaryBtn} onPress={onRescan}>
                  <Text style={styles.secondaryBtnText}>Scan Again</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <>
              <Text style={styles.title}>NFC Scanner</Text>
              <Text style={styles.message}>
                Please hold your phone near the NFC tag.
              </Text>

              {gateHint ? (
                <Text style={styles.gateHint}>Checkpoint: {gateHint}</Text>
              ) : null}

              {statusHint ? (
                <Text style={styles.statusHint}>{statusHint}</Text>
              ) : null}

              {isListening ? (
                <>
                  <Text style={styles.subMessage}>
                    Keep the top of your device on the physical NFC tag until
                    the scan completes.
                  </Text>
                  <View style={styles.pulseWrap}>
                    <View style={styles.pulseRing} />
                    <ActivityIndicator color={Colors.accent} />
                  </View>
                </>
              ) : null}

              {showRetry ? (
                <TouchableOpacity style={styles.primaryBtn} onPress={onRescan}>
                  <Text style={styles.primaryBtnText}>Try Again</Text>
                </TouchableOpacity>
              ) : null}

              {onOpenSettings ? (
                <TouchableOpacity
                  style={styles.settingsBtn}
                  onPress={onOpenSettings}
                >
                  <Text style={styles.settingsBtnText}>Open NFC Settings</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}

          {!isSubmitting ? (
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.xl,
    padding: 22,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    zIndex: 2,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconWrapSuccess: {
    backgroundColor: Colors.successLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '600',
  },
  uidBox: {
    alignSelf: 'stretch',
    marginTop: 14,
    backgroundColor: Colors.bgAlt,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  uidLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  uidText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  uidMeta: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  gateHint: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  statusHint: {
    fontSize: FontSizes.xs,
    color: Colors.warning ?? Colors.accent,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  subMessage: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  pulseWrap: {
    marginTop: 20,
    marginBottom: 8,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.accentAlpha25,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    marginTop: 16,
    backgroundColor: Colors.success,
    borderRadius: Radii.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: FontSizes.md,
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    alignSelf: 'stretch',
    marginTop: 10,
    borderRadius: Radii.md,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
  },
  secondaryBtnText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },
  settingsBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.md,
    backgroundColor: Colors.accentLight,
  },
  settingsBtnText: {
    color: Colors.accent,
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },
});
