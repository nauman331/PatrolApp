import { Alert, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import type { MappedIncident } from './incidentsMapper';
import { buildIncidentReportPdf } from './incidentPdfGenerator';

export type DownloadProgressCallback = (progress: { received: number; total: number } | null) => void;

export async function openPdfFile(filePath: string): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const openTarget = filePath.startsWith('content://') || filePath.startsWith('file://')
        ? filePath
        : `file://${filePath}`;
      try {
        await ReactNativeBlobUtil.android.actionViewIntent(
          openTarget,
          'application/pdf',
        );
      } catch {
        // Opening is optional; file is already in Downloads.
      }
      return true;
    }

    await ReactNativeBlobUtil.ios.openDocument(filePath);
    return true;
  } catch (err) {
    console.error('openPdfFile failed:', err);
    return false;
  }
}

/** Generate a PDF on-device from the full incident report and save to Downloads. */
export async function downloadIncidentPdf(
  incident: MappedIncident,
  onProgress?: DownloadProgressCallback,
): Promise<string | boolean> {
  try {
    const res = await buildIncidentReportPdf(incident, onProgress);
    const savedRef = res.filePath;

    await openPdfFile(savedRef);
    return savedRef;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown error while saving PDF';
    console.error('downloadIncidentPdf failed:', message);
    return false;
  }
}
