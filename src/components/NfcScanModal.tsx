import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { ScanLine, X } from 'lucide-react-native';
import { Colors, FontSizes, Radii } from '../theme';

type NfcScanModalProps = {
  visible: boolean;
  isListening: boolean;
  isSubmitting: boolean;
  gateHint?: string | null;
  statusHint?: string | null;
  onCancel: () => void;
  onOpenSettings?: () => void;
};

export function NfcScanModal({
  visible,
  isListening,
  isSubmitting,
  gateHint,
  statusHint,
  onCancel,
  onOpenSettings,
}: NfcScanModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
            <X size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            {isSubmitting ? (
              <ActivityIndicator size="large" color={Colors.accent} />
            ) : (
              <ScanLine size={36} color={Colors.accent} />
            )}
          </View>

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

          {isSubmitting ? (
            <Text style={styles.subMessage}>Submitting scan…</Text>
          ) : (
            <>
              <Text style={styles.subMessage}>
                Keep the top of your device on the physical NFC tag until the
                scan completes.
              </Text>
              {isListening ? (
                <View style={styles.pulseWrap}>
                  <View style={styles.pulseRing} />
                  <ActivityIndicator color={Colors.accent} />
                </View>
              ) : null}
            </>
          )}

          {onOpenSettings ? (
            <TouchableOpacity style={styles.settingsBtn} onPress={onOpenSettings}>
              <Text style={styles.settingsBtnText}>Open NFC Settings</Text>
            </TouchableOpacity>
          ) : null}

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
  gateHint: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    fontWeight: '700',
    marginTop: 8,
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
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },
});
