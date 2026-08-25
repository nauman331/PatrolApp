import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Platform, PermissionsAndroid } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { type ManagerPatrolReportDetailData } from './managerApi';
import { formatAppDateTime } from './incidentsMapper';
import { formatDateTimeFull } from '../utils';

const MARGIN = 48;
const BOTTOM = 36;
const GAP = 18;

const C = {
  navy: [56, 73, 89] as [number, number, number],
  accent: [106, 137, 167] as [number, number, number],
  text: [33, 33, 33] as [number, number, number],
  label: [90, 90, 90] as [number, number, number],
  line: [220, 220, 228] as [number, number, number],
  panel: [248, 248, 250] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

type DocX = jsPDF & { lastAutoTable?: { finalY: number } };

type L = {
  doc: DocX;
  y: number;
  pw: number;
  ph: number;
  cw: number;
};

function txt(value: unknown): string {
  if (value == null) return '—';
  const s = String(value).replace(/[ \t\r]+/g, ' ').trim();
  return s || '—';
}

function layout(doc: jsPDF): L {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  return { doc: doc as DocX, y: 0, pw, ph, cw: pw - MARGIN * 2 };
}

function space(l: L, need: number) {
  if (l.y + need <= l.ph - BOTTOM) return;
  l.doc.addPage();
  l.y = MARGIN;
}

function afterTable(l: L) {
  l.y = (l.doc.lastAutoTable?.finalY ?? l.y) + GAP;
}

/** Compact top banner */
function drawBanner(l: L, data: ManagerPatrolReportDetailData) {
  const h = 56;
  l.doc.setFillColor(...C.navy);
  l.doc.rect(0, 0, l.pw, h, 'F');
  l.doc.setFillColor(...C.accent);
  l.doc.rect(0, h - 3, l.pw, 3, 'F');

  l.doc.setTextColor(...C.white);
  l.doc.setFont('helvetica', 'bold');
  l.doc.setFontSize(18);
  l.doc.text('Patrol Report', MARGIN, 28);
  l.doc.setFont('helvetica', 'normal');
  l.doc.setFontSize(10);
  l.doc.text(data.date_label, MARGIN, 42);

  l.doc.setFontSize(9);
  l.doc.text('Report Pro', l.pw - MARGIN, 28, { align: 'right' });
  l.doc.text(
    formatAppDateTime(new Date().toISOString()),
    l.pw - MARGIN,
    42,
    { align: 'right' },
  );

  l.y = h + 22;
  l.doc.setTextColor(...C.text);
}

function section(l: L, number: number, title: string) {
  space(l, 28);
  l.doc.setFont('helvetica', 'bold');
  l.doc.setFontSize(12);
  l.doc.setTextColor(...C.navy);
  l.doc.text(`${number}. ${title}`, MARGIN, l.y);
  l.y += 6;
  l.doc.setDrawColor(...C.accent);
  l.doc.setLineWidth(0.8);
  l.doc.line(MARGIN, l.y, l.pw - MARGIN, l.y);
  l.y += 14;
  l.doc.setTextColor(...C.text);
}

const ALWAYS_LONG_LABELS = new Set([
  'description',
  'details',
  'notes',
  'action taken',
  'comments',
  'location details',
  'witness information',
  'other details',
  'address',
  'address details',
  'emergency detail',
  'statement',
  'damage details',
  'injury detail',
  'summary',
  'instructions',
  'remarks',
  'site address',
]);

function isLongField(label: string, value: string): boolean {
  const normLabel = label.toLowerCase().trim();
  if (Array.from(ALWAYS_LONG_LABELS).some(l => normLabel.includes(l))) {
    return true;
  }
  const strVal = txt(value);
  if (strVal.length > 30 || strVal.includes('\n')) {
    return true;
  }
  return false;
}

/** Smart responsive table — pairs short fields into 2 columns (4 table cols), spans long fields full width (colSpan 3). */
function renderSmartGridTable(l: L, rows: [string, string][]) {
  if (!rows.length) return;
  space(l, 24);

  const body: any[] = [];
  let i = 0;
  while (i < rows.length) {
    const current = rows[i];
    const isCurrentLong = isLongField(current[0], current[1]);

    if (isCurrentLong) {
      body.push([
        current[0],
        { content: current[1], colSpan: 3 },
      ]);
      i++;
    } else {
      const next = rows[i + 1];
      const isNextLong = next ? isLongField(next[0], next[1]) : true;

      if (next && !isNextLong) {
        body.push([
          current[0],
          current[1],
          next[0],
          next[1],
        ]);
        i += 2;
      } else {
        body.push([
          current[0],
          { content: current[1], colSpan: 3 },
        ]);
        i++;
      }
    }
  }

  const colLabelWidth = Math.round(l.cw * 0.22);
  const colValWidth = Math.round((l.cw - colLabelWidth * 2) / 2);

  autoTable(l.doc, {
    startY: l.y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: l.cw,
    theme: 'grid',
    styles: {
      fontSize: 9,
      textColor: C.text,
      cellPadding: { top: 5, bottom: 5, left: 7, right: 7 },
      lineColor: C.line,
      lineWidth: 0.4,
      overflow: 'linebreak',
      valign: 'top',
    },
    body,
    columnStyles: {
      0: {
        cellWidth: colLabelWidth,
        fontStyle: 'bold',
        textColor: C.label,
        fillColor: C.panel,
      },
      1: { cellWidth: colValWidth },
      2: {
        cellWidth: colLabelWidth,
        fontStyle: 'bold',
        textColor: C.label,
        fillColor: C.panel,
      },
      3: { cellWidth: colValWidth },
    },
  });
  afterTable(l);
}

function footers(l: L, reportTitle: string) {
  const total = l.doc.getNumberOfPages();
  const stamp = formatAppDateTime(new Date().toISOString());
  for (let p = 1; p <= total; p++) {
    l.doc.setPage(p);
    l.doc.setDrawColor(...C.line);
    l.doc.line(MARGIN, l.ph - 28, l.pw - MARGIN, l.ph - 28);
    l.doc.setFont('helvetica', 'normal');
    l.doc.setFontSize(8);
    l.doc.setTextColor(...C.label);
    l.doc.text(
      `Report Pro · ${reportTitle} · ${stamp}`,
      l.pw / 2,
      l.ph - 16,
      { align: 'center' },
    );
    l.doc.text(`Page ${p} / ${total}`, l.pw - MARGIN, l.ph - 16, {
      align: 'right',
    });
  }
}

export type DownloadProgressCallback = (progress: { received: number; total: number } | null) => void;

export async function buildPatrolReportPdf(
  data: ManagerPatrolReportDetailData,
  onProgress?: DownloadProgressCallback,
): Promise<{ filePath: string; cachePath: string; base64: string }> {
  if (onProgress) onProgress({ received: 10, total: 100 });
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const l = layout(doc);

  drawBanner(l, data);

  section(l, 1, 'Overview');
  renderSmartGridTable(l, [
    ['Guard', txt(data.guard.name)],
    ['Site', txt(data.site.name)],
    ['Date', txt(data.date_label)],
    ['Compliance', `${data.summary.compliance_percentage}%`],
    ['Total Patrols', String(data.summary.patrols_count)],
    ['Completed', String(data.summary.completed_count)],
    ['NFC Scans', `${data.summary.nfc_scans_completed}/${data.summary.nfc_scans_total}`],
    ['Site Address', txt(data.site.address)],
  ]);

  section(l, 2, 'Patrol Details');
  if (data.patrols.length === 0) {
    l.doc.setFont('helvetica', 'italic');
    l.doc.text('No patrols recorded.', MARGIN, l.y);
    l.y += 20;
  } else {
    data.patrols.forEach((patrol, _idx) => {
      space(l, 40);
      l.doc.setFont('helvetica', 'bold');
      l.doc.setFontSize(10);
      l.doc.setTextColor(...C.accent);
      l.doc.text(`Patrol #${patrol.id} - ${patrol.compliance_percentage}% Compliance`, MARGIN, l.y);
      l.y += 12;
      l.doc.setTextColor(...C.text);
      l.doc.setFont('helvetica', 'normal');
      l.doc.setFontSize(9);
      l.doc.text(`Started: ${formatDateTimeFull(patrol.started_at)}`, MARGIN, l.y);
      l.y += 12;
      if (patrol.completed_at) {
        l.doc.text(`Completed: ${formatDateTimeFull(patrol.completed_at)}`, MARGIN, l.y);
        l.y += 12;
      }
      l.doc.text(`Scanners: ${patrol.scanners_completed}/${patrol.scanners_total}`, MARGIN, l.y);
      l.y += 8;

      const scannerRows = patrol.scanners.map(s => [
        s.name,
        s.status.toUpperCase(),
        s.scan_at ? formatDateTimeFull(s.scan_at) : '—'
      ]);

      autoTable(l.doc, {
        startY: l.y,
        margin: { left: MARGIN, right: MARGIN },
        tableWidth: l.cw,
        theme: 'striped',
        head: [['Scanner Name', 'Status', 'Scan Time']],
        body: scannerRows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: C.navy },
      });
      afterTable(l);
      l.y += 10;
    });
  }

  footers(l, `Patrol Report - ${data.guard.name}`);

  if (onProgress) onProgress({ received: 60, total: 100 });

  const fileName = `patrol-report-${data.guard.id}-${data.date}.pdf`;
  const pdfBase64 = doc.output('datauristring').split(',')[1];
  const cachePath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;

  if (onProgress) onProgress({ received: 85, total: 100 });

  await ReactNativeBlobUtil.fs.writeFile(cachePath, pdfBase64, 'base64');

  if (onProgress) onProgress({ received: 92, total: 100 });

  let savedPath = cachePath;
  if (Platform.OS === 'android') {
    try {
      const contentUri =
        await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: fileName,
            parentFolder: 'Report Pro',
            mimeType: 'application/pdf',
          },
          'Download',
          cachePath,
        );
      savedPath = contentUri || cachePath;
    } catch (err) {
      console.warn('MediaStore save failed, trying legacy downloads:', err);
      const legacyPath = `${ReactNativeBlobUtil.fs.dirs.LegacyDownloadDir}/${fileName}`;
      try {
        if ((Platform.Version as number) <= 28) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission Required',
              message: 'Report Pro needs access to your storage to save the PDF report.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            return { filePath: cachePath, cachePath, base64: pdfBase64 };
          }
        }
        await ReactNativeBlobUtil.fs.cp(cachePath, legacyPath);
        savedPath = legacyPath;
        await ReactNativeBlobUtil.fs.scanFile([{ path: legacyPath, mime: 'application/pdf' }]);
      } catch {
        savedPath = cachePath;
      }
    }
  } else {
    savedPath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`;
    await ReactNativeBlobUtil.fs.writeFile(savedPath, pdfBase64, 'base64');
  }

  if (onProgress) onProgress({ received: 100, total: 100 });

  return { filePath: savedPath, cachePath, base64: pdfBase64 };
}
