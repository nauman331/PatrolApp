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
    let title: string;
    let messageBody = '';

    if (type === 'incident') {
      const mapped = mapManagerIncidentToMapped(data as ManagerIncidentDetailData);
      filePath = await buildIncidentReportPdf(mapped);
      fileName = `Incident_Report_${data.id}.pdf`;
      title = `Incident Report #${data.id} - ${data.site_name}`;
      messageBody = `Please find attached the Incident Report.\n\nIncident: ${data.title}\nSite: ${data.site_name}\nGuard: ${data.guard_name}\nSeverity: ${data.severity}\nDate: ${data.location_date}`;
    } else {
      filePath = await buildPatrolReportPdf(data as ManagerPatrolReportDetailData);
      fileName = `Patrol_Report_${data.guard.id}_${data.date}.pdf`;
      title = `Patrol Report: ${data.site.name} - ${data.guard.name}`;
      messageBody = `Please find attached the Patrol Report.\n\nGuard: ${data.guard.name}\nSite: ${data.site.name}\nDate: ${data.date_label}\nCompliance: ${data.summary.compliance_percentage}%`;
    }

    const fileUri = (Platform.OS === 'android' && !filePath.startsWith('content://'))
        ? `file://${filePath}`
        : filePath;

    if (action === 'download') {
      if (Platform.OS === 'android') {
         Alert.alert('Success', `Report saved to Downloads as ${fileName}`);
      } else {
         await ReactNativeBlobUtil.ios.openDocument(filePath);
      }
      return;
    }

    const shareOptions: any = {
      title: title,
      subject: title,
      message: messageBody,
      url: fileUri,
      type: 'application/pdf',
      failOnCancel: false,
    };

    if (action === 'email') {
        // This targets ONLY email applications (Gmail, Outlook, Mail, etc.)
        try {
            await Share.shareSingle({
                ...shareOptions,
                social: Share.Social.EMAIL,
            });
            return;
        } catch (err) {
            console.log('Direct email failed, falling back to general share chooser');
            // If direct email fails (no default app), we allow it to fall through to Share.open
        }
    }

    // Opens the Share Modal for WhatsApp and other apps
    try {
        await Share.open(shareOptions);
    } catch (err: any) {
        if (err?.message?.includes('User did not share') || err?.message?.includes('User cancelled')) {
            return;
        }
        throw err;
    }

  } catch (err) {
    if (err instanceof Error && (err.message.includes('User did not share') || err.message.includes('User cancelled'))) {
        return;
    }
    console.error('Report action failed', err);
    Alert.alert('Error', 'Could not complete the action. Please ensure you have the required apps installed.');
  }
}
