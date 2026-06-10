import React, { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { NfcScanModal } from '../components/NfcScanModal';
import {
  guardScanNfcWithVariants,
  guardTodayPatrolling,
  type PatrollingReport,
  type PatrolScanner,
  type ScanNfcPayload,
} from '../services/guardApi';
import {
  getNfcCapability,
  getNfcUidVariants,
  openNfcSettings,
  readNfcUid,
  stopNfc,
} from '../services/nfcReader';
import {
  buildUidVariants,
  findActiveReportForRoster,
  findMatchingScanner,
  findScannedGateName,
} from '../services/patrolUtils';

export type PatrolScanContext = Pick<
  ScanNfcPayload,
  'patrolling_report_id' | 'roster_id' | 'guard_id'
> & {
  report?: PatrollingReport | null;
};

type UsePatrolNfcScanOptions = {
  getCoordinates: () => Promise<string>;
  getScanContext?: () => PatrolScanContext | null;
  onSuccess?: (report: PatrollingReport, gateName: string | null) => void;
  requireActivePatrol?: boolean;
  hasActivePatrol?: () => boolean;
};

async function resolveScanContext(
  context: PatrolScanContext | null,
): Promise<PatrollingReport | null> {
  if (context?.report) return context.report;

  const guardId = context?.guard_id;
  const rosterId = context?.roster_id;
  if (!guardId && rosterId == null) return null;

  const today = await guardTodayPatrolling(guardId);
  return findActiveReportForRoster(today.data?.reports ?? [], rosterId);
}

async function submitTagUidToApi(
  tagUid: string,
  coordinates: string,
  report: PatrollingReport | null,
  context: PatrolScanContext | null,
): Promise<ReturnType<typeof guardScanNfcWithVariants>> {
  const resolvedReport = report ?? (await resolveScanContext(context));
  const variants = [
    ...new Set([...buildUidVariants(tagUid), ...getNfcUidVariants(tagUid)]),
  ];

  return guardScanNfcWithVariants(variants, coordinates, {
    patrolling_report_id:
      context?.patrolling_report_id ?? resolvedReport?.id,
    roster_id: context?.roster_id ?? resolvedReport?.roster_id,
    guard_id: context?.guard_id ?? resolvedReport?.guard_id,
  });
}

function isTimeoutError(message: string): boolean {
  return message.toLowerCase().includes('timed out');
}

export function usePatrolNfcScan({
  getCoordinates,
  getScanContext,
  onSuccess,
  requireActivePatrol = true,
  hasActivePatrol,
}: UsePatrolNfcScanOptions) {
  const [scanning, setScanning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gateHint, setGateHint] = useState<string | null>(null);
  const [statusHint, setStatusHint] = useState<string | null>(null);
  const [showNfcSettings, setShowNfcSettings] = useState(false);

  const scanningRef = useRef(false);
  const listenCancelledRef = useRef(false);
  const gateHintRef = useRef<string | null>(null);

  const resetScanState = useCallback(() => {
    scanningRef.current = false;
    setScanning(false);
    setModalVisible(false);
    setIsListening(false);
    setIsSubmitting(false);
    setGateHint(null);
    setStatusHint(null);
    setShowNfcSettings(false);
    gateHintRef.current = null;
  }, []);

  const closeModal = useCallback(() => {
    listenCancelledRef.current = true;
    resetScanState();
    stopNfc();
  }, [resetScanState]);

  const submitTagUid = useCallback(
    async (tagUid: string): Promise<boolean> => {
      const uid = tagUid.trim();
      if (!uid) return false;

      const coordinates = (await getCoordinates()).trim();
      if (!coordinates) {
        Alert.alert(
          'Location required',
          'GPS coordinates are needed for NFC scan.',
        );
        return false;
      }

      const context = getScanContext?.() ?? null;
      const report = context?.report ?? (await resolveScanContext(context));
      setIsSubmitting(true);
      setIsListening(false);
      stopNfc();

      const result = await submitTagUidToApi(uid, coordinates, report, context);

      if (!result.success) {
        Alert.alert(
          'Scan failed',
          result.message ??
            'Tag not recognized. Hold your phone on the physical NFC tag and try again.',
        );
        return false;
      }

      const responseReport = result.data;
      const hint = gateHintRef.current;

      if (!responseReport) {
        Alert.alert('Scan successful', result.message ?? 'NFC tag scanned.');
        return true;
      }

      const gateName =
        findScannedGateName(responseReport, uid) ??
        findMatchingScanner(responseReport, uid)?.name ??
        hint ??
        null;

      Alert.alert(
        'Scan successful',
        gateName
          ? `${gateName} scanned successfully.`
          : (result.message ?? 'NFC tag scanned successfully.'),
      );
      onSuccess?.(responseReport, gateName);
      return true;
    },
    [getCoordinates, getScanContext, onSuccess],
  );

  const startHardwareListen = useCallback(async () => {
    listenCancelledRef.current = false;
    setIsListening(true);
    setIsSubmitting(false);

    while (!listenCancelledRef.current) {
      try {
        const uid = await readNfcUid();
        if (listenCancelledRef.current) return;

        const success = await submitTagUid(uid);
        if (listenCancelledRef.current) return;

        if (success) {
          closeModal();
          return;
        }

        setIsSubmitting(false);
        setIsListening(true);
      } catch (error: unknown) {
        if (listenCancelledRef.current) return;

        const message =
          error instanceof Error
            ? error.message
            : 'Could not read NFC tag. Hold your phone closer to the tag.';

        if (isTimeoutError(message)) {
          continue;
        }

        if (message.toLowerCase().includes('nfc is turned off')) {
          setStatusHint(message);
          setShowNfcSettings(true);
          setIsListening(true);
          continue;
        }

        setStatusHint(message);
        setIsListening(true);
      }
    }
  }, [submitTagUid, closeModal]);

  const openScanner = useCallback(
    async (hint?: string) => {
      if (scanningRef.current) return;

      if (requireActivePatrol && hasActivePatrol && !hasActivePatrol()) {
        Alert.alert(
          'No active patrol',
          'Start patrolling first from your ongoing shift, then scan NFC checkpoints.',
        );
        return;
      }

      const capability = await getNfcCapability();
      const needsSettings =
        capability.capability === 'disabled' ||
        capability.capability === 'unsupported' ||
        capability.capability === 'unavailable';

      scanningRef.current = true;
      setScanning(true);
      setModalVisible(true);
      setGateHint(hint ?? null);
      gateHintRef.current = hint ?? null;
      setStatusHint(
        needsSettings
          ? (capability.message ??
              'Enable NFC in your phone settings, then hold the phone on the tag.')
          : null,
      );
      setShowNfcSettings(needsSettings);

      startHardwareListen();
    },
    [requireActivePatrol, hasActivePatrol, startHardwareListen],
  );

  const handleScanCheckpoint = useCallback(
    (scanner: PatrolScanner) => {
      openScanner(scanner.name);
    },
    [openScanner],
  );

  const handleCancelModal = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const handleOpenSettings = useCallback(() => {
    openNfcSettings();
  }, []);

  const scanModal = (
    <NfcScanModal
      visible={modalVisible}
      isListening={isListening}
      isSubmitting={isSubmitting}
      gateHint={gateHint}
      statusHint={statusHint}
      onCancel={handleCancelModal}
      onOpenSettings={showNfcSettings ? handleOpenSettings : undefined}
    />
  );

  return {
    scanning,
    handleScan: () => openScanner(),
    handleScanCheckpoint,
    scanModal,
  };
}
