import { Alert, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import { type ManagerIncidentDetailData, type ManagerPatrolReportDetailData } from './managerApi';
import { buildIncidentReportPdf } from './incidentPdfGenerator';
import { buildPatrolReportPdf } from './patrolPdfGenerator';
import { type MappedIncident } from './incidentsMapper';

function mapManagerIncidentToMapped(data: ManagerIncidentDetailData): MappedIncident {
  return {
    id: data.id,
    guardId: data.guard_id,
    siteName: data.site_name,
    incidentDate: data.incident_date || data.date,
    incidentTime: data.incident_time || data.time,
    injuryType: data.injury_type || data.title,
    injuryDetail: data.injury_detail || data.summary_text,
    severity: (data.severity?.toUpperCase() as any) || 'MEDIUM',
    peopleInvolved: (data.people_involved || []) as Record<string, unknown>[],
    vehicles: (data.vehicle || []) as Record<string, unknown>[],
    emergencyServices: (data.emergency_services || {}) as unknown as Record<string, unknown>,
    witnesses: (data.witness || []) as Record<string, unknown>[],
    peopleCount: data.people_involved?.length || 0,
    vehiclesCount: data.vehicle?.length || 0,
    witnessesCount: data.witness?.length || 0,
    photos: (data.photos || []).map(p => ({ imgPath: p.url, timestamp: p.timestamp, uri: p.url })),
    signature: data.signature || undefined,
    signatureUri: data.signature || undefined,
    createdAt: data.created_at,
    displayDateTime: data.location_date,
  };
}

export type DownloadProgressCallback = (progress: { received: number; total: number } | null) => void;

export type EmailOptions = {
  recipient?: string;
  subject?: string;
  body?: string;
};

function isUserCancelError(err: any): boolean {
  if (!err) return false;
  const msg = typeof err === 'string' ? err : err.message || err.error || '';
  const code = err.code || '';
  return (
    msg.includes('User did not share') ||
    msg.includes('User cancelled') ||
    msg.includes('CANCELLED') ||
    msg.includes('dismissed') ||
    code === 'ECANCELLED500' ||
    code === 'CANCELLED'
  );
}

/**
 * Ensures a filesystem path or URI has a valid scheme (file:// or content:// or data:).
 * Does not double-prepend file:// if a scheme is already present.
 */
export function ensureValidUri(filePath: string): string | null {
  if (!filePath || typeof filePath !== 'string') return null;
  const trimmed = filePath.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('content://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  return `file://${trimmed}`;
}

export async function shareReport(
  type: 'patrol' | 'incident',
  data: any,
  action: 'download' | 'share' | 'email',
  onProgress?: DownloadProgressCallback,
  onModalOpen?: () => void,
  emailOptions?: EmailOptions,
): Promise<boolean | string> {
  try {
    if (!data) {
      Alert.alert('Error', 'Report data is unavailable.');
      return false;
    }

    let fileName: string;
    let title: string;
    let messageBody = '';

    if (type === 'incident') {
      fileName = `Incident_Report_${data.id}.pdf`;
      title = `Incident Report #${data.id} - ${data.site_name}`;
      messageBody = `Please find attached the Incident Report.\n\nIncident: ${data.title}\nSite: ${data.site_name}\nGuard: ${data.guard_name}\nSeverity: ${data.severity}\nDate: ${data.location_date}`;
    } else {
      fileName = `Patrol_Report_${data.guard?.id || 'report'}_${data.date || 'date'}.pdf`;
      title = `Patrol Report: ${data.site?.name || ''} - ${data.guard?.name || ''}`;
      messageBody = `Please find attached the Patrol Report.\n\nGuard: ${data.guard?.name || ''}\nSite: ${data.site?.name || ''}\nDate: ${data.date_label || ''}\nCompliance: ${data.summary?.compliance_percentage || 0}%`;
    }

    const cacheDir = ReactNativeBlobUtil.fs.dirs.CacheDir;
    const cachePath = `${cacheDir}/${fileName}`;
    const cleanCachePath = cachePath.replace(/^file:\/\//, '');

    let filePath = cachePath;
    let fileExists = false;

    try {
      fileExists = await ReactNativeBlobUtil.fs.exists(cleanCachePath);
    } catch {
      fileExists = false;
    }

    if (fileExists) {
      if (onProgress) onProgress({ received: 100, total: 100 });
      filePath = cachePath;
    } else {
      if (type === 'incident') {
        const mapped = mapManagerIncidentToMapped(data as ManagerIncidentDetailData);
        const res = await buildIncidentReportPdf(mapped, onProgress);
        filePath = res.cachePath || res.filePath;
      } else {
        const res = await buildPatrolReportPdf(data as ManagerPatrolReportDetailData, onProgress);
        filePath = res.cachePath || res.filePath;
      }
    }

    const cleanPath = (filePath || '').replace(/^file:\/\//, '');

    // Validate file existence
    if (!cleanPath) {
      console.error('Report file validation failed: file path is empty.');
      Alert.alert('Error', 'Unable to prepare report file. Please try again.');
      return false;
    }

    const exists = await ReactNativeBlobUtil.fs.exists(cleanPath);
    if (!exists) {
      console.error('Report file validation failed: file does not exist at', cleanPath);
      Alert.alert('Error', 'Unable to prepare report file. Please try again.');
      return false;
    }

    if (action === 'download') {
      if (Platform.OS === 'ios') {
        try {
          await ReactNativeBlobUtil.ios.openDocument(cleanPath);
        } catch (e) {
          console.warn('iOS openDocument preview on download warning:', e);
        }
      }
      return cleanPath;
    }

    // Convert & Validate URI & MIME type
    const shareUri = ensureValidUri(cleanPath);
    if (!shareUri) {
      console.error('Report share URI validation failed for path:', cleanPath);
      Alert.alert('Error', 'Unable to format valid share URI.');
      return false;
    }

    const mimeType = 'application/pdf';

    if (__DEV__) {
      console.log('Report file path:', cleanPath);
      console.log('Report share URI:', shareUri);
      console.log('Report MIME type:', mimeType);
    }

    onModalOpen?.();

    if (action === 'email') {
      const emailSubject = emailOptions?.subject || title;
      const emailMessage = emailOptions?.body || messageBody;
      const recipient = emailOptions?.recipient;

      const emailShareOptions: any = {
        title: emailSubject,
        subject: emailSubject,
        message: emailMessage,
        url: shareUri,
        type: mimeType,
        filename: fileName,
        useInternalStorage: true,
        failOnCancel: false,
        social: Share.Social.EMAIL,
        ...(recipient ? { email: recipient, recipient: recipient } : {}),
      };

      try {
        await Share.shareSingle(emailShareOptions);
        return true;
      } catch (err: any) {
        if (isUserCancelError(err)) {
          return true;
        }
        console.warn('Share.shareSingle EMAIL failed, trying Share.open fallback:', err);
        try {
          await Share.open(emailShareOptions);
          return true;
        } catch (openErr: any) {
          if (isUserCancelError(openErr)) {
            return true;
          }
          console.warn('Email action failed:', openErr);
          Alert.alert(
            'Email Client Error',
            'Could not open an email app. Please ensure an email client is installed and configured on your device.',
          );
          return false;
        }
      }
    }

    // Default action: 'share'
    const shareOptions: any = {
      title: title,
      subject: title,
      message: messageBody,
      url: shareUri,
      type: mimeType,
      filename: fileName,
      useInternalStorage: true,
      failOnCancel: false,
    };

    try {
      await Share.open(shareOptions);
      return true;
    } catch (err: any) {
      if (isUserCancelError(err)) {
        return true;
      }
      console.warn('Share action failed:', err);
      Alert.alert(
        'Share Error',
        'Unable to share the report. Please try again.',
      );
      return false;
    }
  } catch (err: any) {
    if (isUserCancelError(err)) {
      return true;
    }
    console.error('Report action failed:', err);
    if (action !== 'download') {
      Alert.alert(
        'Error',
        'Unable to share the report. Please try again.',
      );
    }
    return false;
  }
}
