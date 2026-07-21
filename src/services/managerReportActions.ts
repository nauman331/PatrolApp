import { Alert, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
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
    severity: (data.severity.toUpperCase() as any) || 'MEDIUM',
    peopleInvolved: (data.people_involved || []) as Record<string, unknown>[],
    vehicles: (data.vehicle || []) as Record<string, unknown>[],
    emergencyServices: (data.emergency_services || {}) as Record<string, unknown>,
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

export async function shareReport(type: 'patrol' | 'incident', data: any, action: 'download' | 'share' | 'email') {
  try {
    let filePath: string;
    let fileName: string;

    if (type === 'incident') {
      const mapped = mapManagerIncidentToMapped(data as ManagerIncidentDetailData);
      filePath = await buildIncidentReportPdf(mapped);
      fileName = `incident-report-${data.id}.pdf`;
    } else {
      filePath = await buildPatrolReportPdf(data as ManagerPatrolReportDetailData);
      fileName = `patrol-report-${data.guard.id}-${data.date}.pdf`;
    }

    if (action === 'download') {
      if (Platform.OS === 'android') {
         Alert.alert('Success', `Report saved to Downloads as ${fileName}`);
      } else {
         await ReactNativeBlobUtil.ios.openDocument(filePath);
      }
      return;
    }

    // For share and email, we use the same open/preview mechanism since we don't have react-native-share
    // On iOS openDocument provides share options.
    // On Android we can use actionViewIntent which opens the PDF, then user can share from there.

    if (Platform.OS === 'ios') {
      await ReactNativeBlobUtil.ios.openDocument(filePath);
    } else {
      const openTarget = filePath.startsWith('content://') ? filePath : `file://${filePath}`;
      await ReactNativeBlobUtil.android.actionViewIntent(openTarget, 'application/pdf');
    }

  } catch (err) {
    console.error('Report action failed', err);
    Alert.alert('Error', 'Failed to process report action');
  }
}
