import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import type { MappedIncident } from './incidentsMapper';
import { buildIncidentReportPdf } from './incidentPdfGenerator';

export type DownloadProgressCallback = (progress: { received: number; total: number } | null) => void;

export async function openPdfFile(filePath: string): Promise<boolean> {
  try {
    if (!filePath || typeof filePath !== 'string') return false;
    const trimmed = filePath.trim();
    if (!trimmed) return false;

    if (Platform.OS === 'android') {
      const openTarget = trimmed.startsWith('content://')
        ? trimmed
        : trimmed.replace(/^file:\/\//, '');

      try {
        const exists = trimmed.startsWith('content://')
          ? true
          : await ReactNativeBlobUtil.fs.exists(openTarget);

        if (!exists) {
          console.warn('Android actionViewIntent target file does not exist:', openTarget);
          return false;
        }

        await ReactNativeBlobUtil.android.actionViewIntent(
          openTarget,
          'application/pdf',
        );
        return true;
      } catch (err) {
        console.warn('Android actionViewIntent failed:', err);
        return false;
      }
    }

    try {
      const cleanPath = trimmed.replace(/^file:\/\//, '');
      const exists = await ReactNativeBlobUtil.fs.exists(cleanPath);
      if (!exists) {
        console.warn('iOS openDocument target file does not exist:', cleanPath);
        return false;
      }
      await ReactNativeBlobUtil.ios.openDocument(cleanPath);
      return true;
    } catch (err) {
      console.warn('iOS openDocument failed:', err);
      return false;
    }
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
    const savedRef = res.cachePath || res.filePath;

    await openPdfFile(savedRef);
    return savedRef;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unknown error while saving PDF';
    console.error('downloadIncidentPdf failed:', message);
    return false;
  }
}
