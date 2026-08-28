import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import locationService, { LocationModalState } from '../services/LocationService';
import { Colors, FontSizes, Radii, Shadows, Spacing } from '../theme';

export const LocationModalContainer: React.FC = () => {
  const [modalState, setModalState] = useState<LocationModalState>({
    type: null,
    visible: false,
  });

  useEffect(() => {
    const unsubscribe = locationService.subscribeModalState((state) => {
      setModalState(state);
    });
    return unsubscribe;
  }, []);

  if (!modalState.visible || !modalState.type) {
    return null;
  }

  const handleOpenLocationSettings = () => {
    setModalState({ type: null, visible: false });
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => {
        Linking.openSettings().catch(() => {});
      });
    } else {
      Linking.openSettings().catch(() => {});
    }
  };

  const handleOpenAppSettings = () => {
    setModalState({ type: null, visible: false });
    Linking.openSettings().catch(() => {});
  };

  const handleCancel = () => {
    const cancelCb = modalState.onCancel;
    setModalState({ type: null, visible: false });
    if (cancelCb) cancelCb();
  };

  const handleContinue = () => {
    const continueCb = modalState.onContinue;
    setModalState({ type: null, visible: false });
    if (continueCb) continueCb();
  };

  return (
    <Modal
      visible={modalState.visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>📍</Text>
          </View>

          {modalState.type === 'disclosure' && (
            <>
              <Text style={styles.title}>Why Report Pro needs your location</Text>
              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.bodyText}>
                  Report Pro uses your location to support security patrol operations. Your location is used to record and monitor guard patrol activity and to maintain accurate patrol and incident records. The app may periodically update your location, approximately every 2 minutes, so the latest location is available when required by the application.
                </Text>

                <View style={styles.highlightBox}>
                  <Text style={styles.highlightTitle}>Background Location Use</Text>
                  <Text style={styles.highlightText}>
                    During patrol operations, location updates may continue while the app is running in the background.
                  </Text>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.8}
                onPress={handleContinue}
              >
                <Text style={styles.primaryButtonText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}

          {modalState.type === 'location_disabled' && (
            <>
              <Text style={styles.title}>Location Required</Text>
              <Text style={styles.bodyTextSimple}>
                Report Pro needs location services to support guard patrol operations and maintain accurate patrol records. Please enable location services to continue.
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.8}
                  onPress={handleCancel}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButtonFlex}
                  activeOpacity={0.8}
                  onPress={handleOpenLocationSettings}
                >
                  <Text style={styles.primaryButtonText}>Open Settings</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {modalState.type === 'permission_denied' && (
            <>
              <Text style={styles.title}>Location Permission Required</Text>
              <Text style={styles.bodyTextSimple}>
                Location permission is required for security patrol features. Please grant location access in App Settings.
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.8}
                  onPress={handleCancel}
                >
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryButtonFlex}
                  activeOpacity={0.8}
                  onPress={handleOpenAppSettings}
                >
                  <Text style={styles.primaryButtonText}>Open Settings</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default LocationModalContainer;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.card,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.accentAlpha12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconText: {
    fontSize: 24,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  scrollArea: {
    width: '100%',
    marginVertical: Spacing.sm,
  },
  scrollContent: {
    paddingBottom: Spacing.xs,
  },
  bodyText: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    lineHeight: 19,
    textAlign: 'left',
  },
  bodyTextSimple: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    lineHeight: 19,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  highlightBox: {
    backgroundColor: Colors.accentAlpha12,
    borderColor: Colors.accent,
    borderLeftWidth: 3,
    borderRadius: Radii.sm,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  highlightTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  highlightText: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: Colors.headerStart,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  primaryButtonFlex: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.headerStart,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
    height: 44,
    backgroundColor: Colors.bgAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
});
