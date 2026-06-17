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
  isNfcUserCancelledError,
  openNfcSettings,
  readNfcTag,
  stopNfc,
  NfcDisabledError,
  NfcUnsupportedError,
  type NfcTagInfo,
} from '../services/nfcReader';
import {
  buildUidVariants,
  findActiveReportForRoster,
  findMatchingScanner,
  findScannedGateName,
  isScannerComplete,
} from '../services/patrolUtils';

export type PatrolScanContext = Pick<
  ScanNfcPayload,
  'patrolling_report_id' | 'patrolling_id' | 'scanner_id' | 'roster_id' | 'guard_id'
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

  const today = await guardTodayPatrolling(guardId, rosterId);
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
    patrolling_id:
      context?.patrolling_id ??
      context?.patrolling_report_id ??
      resolvedReport?.id,
    scanner_id: context?.scanner_id,
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
  const [pendingTag, setPendingTag] = useState<NfcTagInfo | null>(null);

  const scanningRef = useRef(false);
  const listenCancelledRef = useRef(false);
  const gateHintRef = useRef<string | null>(null);
  const pendingTagRef = useRef<NfcTagInfo | null>(null);
  const pendingScannerRef = useRef<PatrolScanner | null>(null);

  const resetScanState = useCallback(() => {
    scanningRef.current = false;
    setScanning(false);
    setModalVisible(false);
    setIsListening(false);
    setIsSubmitting(false);
    setGateHint(null);
    setStatusHint(null);
    setShowNfcSettings(false);
    setPendingTag(null);
    pendingTagRef.current = null;
    pendingScannerRef.current = null;
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

      setIsSubmitting(true);
      setIsListening(false);
      stopNfc();

      const coordinates = (await getCoordinates()).trim();
      if (!coordinates) {
        setIsSubmitting(false);
        Alert.alert(
          'Location required',
          'GPS coordinates are needed for NFC scan.',
        );
        return false;
      }

      const context = getScanContext?.() ?? null;
      const scanner = pendingScannerRef.current;
      const report = context?.report ?? (await resolveScanContext(context));

      const scanContext: PatrolScanContext | null = context
        ? {
            ...context,
            patrolling_id:
              context.patrolling_id ??
              context.patrolling_report_id ??
              report?.id,
            scanner_id: context.scanner_id ?? scanner?.id,
          }
        : report
          ? {
              patrolling_id: report.id,
              scanner_id: scanner?.id,
              roster_id: report.roster_id,
              guard_id: report.guard_id,
            }
          : null;

      const result = await submitTagUidToApi(
        uid,
        coordinates,
        report,
        scanContext,
      );

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
    setPendingTag(null);
    pendingTagRef.current = null;
    setStatusHint(null);
    setShowNfcSettings(false);
    setIsListening(true);
    setIsSubmitting(false);

    while (!listenCancelledRef.current) {
      try {
        const tag = await readNfcTag();
        if (listenCancelledRef.current) return;

        stopNfc();
        pendingTagRef.current = tag;
        setPendingTag(tag);
        setIsListening(false);
        setStatusHint(null);
        return;
      } catch (error: unknown) {
        if (listenCancelledRef.current) return;

        const message =
          error instanceof Error
            ? error.message
            : 'Could not read NFC tag. Hold your phone closer to the tag.';

        if (isTimeoutError(message)) {
          continue;
        }

        if (isNfcUserCancelledError(message)) {
          setIsListening(false);
          return;
        }

        if (
          error instanceof NfcUnsupportedError ||
          error instanceof NfcDisabledError
        ) {
          setStatusHint(message);
          setShowNfcSettings(error instanceof NfcDisabledError);
          setIsListening(false);
          return;
        }

        setStatusHint(message);
        setIsListening(false);
        return;
      }
    }
  }, []);

  const handleConfirmTag = useCallback(async () => {
    const tag = pendingTagRef.current;
    if (!tag) return;

    try {
      const success = await submitTagUid(tag.uid);
      if (success) {
        closeModal();
        return;
      }
    } catch (error: unknown) {
      Alert.alert(
        'Scan failed',
        error instanceof Error
          ? error.message
          : 'Could not submit NFC scan. Try again.',
      );
    }

    setIsSubmitting(false);
    pendingTagRef.current = null;
    setPendingTag(null);
    setIsListening(false);
  }, [submitTagUid, closeModal]);

  const handleRescan = useCallback(() => {
    startHardwareListen();
  }, [startHardwareListen]);

  const openScanner = useCallback(
    async (scanner?: PatrolScanner) => {
      if (scanningRef.current) return;

      if (requireActivePatrol && hasActivePatrol && !hasActivePatrol()) {
        return;
      }

      scanningRef.current = true;
      setScanning(true);
      setModalVisible(true);
      setGateHint(scanner?.name ?? null);
      gateHintRef.current = scanner?.name ?? null;
      pendingScannerRef.current = scanner ?? null;
      setPendingTag(null);
      pendingTagRef.current = null;
      setStatusHint(null);
      setShowNfcSettings(false);
      setIsSubmitting(false);

      const capability = await getNfcCapability();
      if (capability.capability !== 'ready') {
        setStatusHint(
          capability.message ??
            'Enable NFC in your phone settings, then hold the phone on the tag.',
        );
        setShowNfcSettings(capability.capability === 'disabled');
        setIsListening(false);
        return;
      }

      startHardwareListen();
    },
    [requireActivePatrol, hasActivePatrol, startHardwareListen],
  );

  const handleScanCheckpoint = useCallback(
    (scanner: PatrolScanner) => {
      if (isScannerComplete(scanner)) return;
      openScanner(scanner);
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
      tagInfo={pendingTag}
      onCancel={handleCancelModal}
      onConfirm={handleConfirmTag}
      onRescan={handleRescan}
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
