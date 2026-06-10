import { Alert, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import type { MappedIncident } from './incidentsMapper';
import { buildIncidentReportPdf } from './incidentPdfGenerator';

/** Generate a PDF on-device from the full incident report and save to Downloads. */
export async function downloadIncidentPdf(incident: MappedIncident): Promise<void> {
  try {
    const savedRef = await buildIncidentReportPdf(incident);
    const fileName = `incident-report-${incident.id}.pdf`;

    if (Platform.OS === 'android') {
      const openTarget = savedRef.startsWith('content://')
        ? savedRef
        : `file://${savedRef}`;
      try {
        await ReactNativeBlobUtil.android.actionViewIntent(
          openTarget,
          'application/pdf',
        );
      } catch {
        // Opening is optional; file is already in Downloads.
      }
      Alert.alert(
        'PDF saved',
        `Report #${incident.id} saved.\nOpen Files → Downloads → PatrolApp → ${fileName}`,
      );
      return;
    }

    await ReactNativeBlobUtil.ios.openDocument(savedRef);
    Alert.alert('PDF saved', `Report #${incident.id} is ready to view or share.`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown error while saving PDF';
    Alert.alert('Could not create PDF', message);
  }
}
