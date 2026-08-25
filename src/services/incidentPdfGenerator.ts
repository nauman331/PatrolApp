import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Platform, PermissionsAndroid } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type MappedIncident, formatAppDateTime } from './incidentsMapper';

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

const SKIP_DETAIL_KEYS = new Set([
  'peoplecount',
  'people_count',
  'vehiclescount',
  'vehicle_count',
  'witnessescount',
  'witness_count',
  'wittness_count',
]);

type DocX = jsPDF & { lastAutoTable?: { finalY: number } };

type L = {
  doc: DocX;
  y: number;
  pw: number;
  ph: number;
  cw: number;
};

function fmtLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .replace(/\b\w/g, ch => ch.toUpperCase());
}

function txt(value: unknown): string {
  if (value == null) return '—';
  const s = String(value).replace(/[ \t\r]+/g, ' ').trim();
  return s || '—';
}

function recordRows(record: Record<string, unknown>): [string, string][] {
  return Object.entries(record)
    .filter(([key, val]) => {
      if (val == null || txt(val) === '—') return false;
      return !SKIP_DETAIL_KEYS.has(key.toLowerCase());
    })
    .map(([key, val]) => [fmtLabel(key), txt(val)]);
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

export type DownloadProgressCallback = (progress: { received: number; total: number } | null) => void;

async function loadImage(
  uri: string,
  onProgress?: DownloadProgressCallback,
): Promise<string | null> {
  if (uri.startsWith('data:')) {
    return uri;
  }

  const token = await AsyncStorage.getItem('authToken');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const fetchTask = ReactNativeBlobUtil.config({ fileCache: true }).fetch(
      'GET',
      uri,
      headers,
    );

    if (onProgress) {
      fetchTask.progress((received, total) => {
        const rec = Number(received);
        const tot = Number(total);
        if (tot > 0) {
          onProgress({ received: rec, total: tot });
        }
      });
    }

    const res = await fetchTask;
    if (res.info().status < 200 || res.info().status >= 300) return null;
    const base64 = await ReactNativeBlobUtil.fs.readFile(res.path(), 'base64');
    const mime = uri.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

/** Compact top banner — identity only (details live in section 1). */
function drawBanner(l: L, incident: MappedIncident) {
  const h = 56;
  l.doc.setFillColor(...C.navy);
  l.doc.rect(0, 0, l.pw, h, 'F');
  l.doc.setFillColor(...C.accent);
  l.doc.rect(0, h - 3, l.pw, 3, 'F');

  l.doc.setTextColor(...C.white);
  l.doc.setFont('helvetica', 'bold');
  l.doc.setFontSize(18);
  l.doc.text('Incident Report', MARGIN, 28);
  l.doc.setFont('helvetica', 'normal');
  l.doc.setFontSize(10);
  l.doc.text(`#${incident.id}`, MARGIN, 42);

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

function emptyNote(l: L, message: string) {
  space(l, 16);
  l.doc.setFont('helvetica', 'italic');
  l.doc.setFontSize(9);
  l.doc.setTextColor(...C.label);
  l.doc.text(message, MARGIN + 4, l.y);
  l.y += 16;
}

function drawRecordsSection(
  l: L,
  sectionNum: number,
  title: string,
  records: Record<string, unknown>[],
  emptyMsg: string,
  itemLabel: string,
) {
  section(l, sectionNum, title);
  if (!records.length) {
    emptyNote(l, emptyMsg);
    return;
  }

  records.forEach((record, idx) => {
    const rows = recordRows(record);
    if (!rows.length) return;

    if (records.length > 1) {
      space(l, 14);
      l.doc.setFont('helvetica', 'bold');
      l.doc.setFontSize(10);
      l.doc.setTextColor(...C.accent);
      l.doc.text(`${itemLabel} ${idx + 1}`, MARGIN + 2, l.y);
      l.y += 12;
      l.doc.setTextColor(...C.text);
    }

    renderSmartGridTable(l, rows);
    if (idx < records.length - 1) {
      l.y += 4;
    }
  });
}

function drawParagraph(l: L, text: string) {
  space(l, 20);
  l.doc.setFont('helvetica', 'normal');
  l.doc.setFontSize(10);
  const lines = l.doc.splitTextToSize(
    txt(text) === '—' ? 'No description provided.' : txt(text),
    l.cw,
  ) as string[];
  lines.forEach(line => {
    space(l, 14);
    l.doc.text(line, MARGIN, l.y);
    l.y += 13;
  });
  l.y += 6;
}

async function drawPhotos(
  l: L,
  incident: MappedIncident,
  onImageProgress?: (imgIndex: number, progress: { received: number; total: number } | null) => void,
) {
  const photos = incident.photos.filter(p => p.uri || p.imgPath);
  const n = photos.length;
  if (!n) return;

  section(l, 7, `Photos (${n})`);

  const PHOTOS_PER_ROW = 3;
  const PHOTO_GAP = 12;
  const PHOTO_SIZE = (l.cw - PHOTO_GAP * (PHOTOS_PER_ROW - 1)) / PHOTOS_PER_ROW;
  const LABEL_H = 14;
  const ROW_HEIGHT = PHOTO_SIZE + LABEL_H + PHOTO_GAP;

  for (let i = 0; i < n; i++) {
    const photo = photos[i];
    const source = photo.uri || photo.imgPath;
    if (!source) continue;

    const col = i % PHOTOS_PER_ROW;

    if (col === 0) {
      space(l, ROW_HEIGHT);
    }

    const x = MARGIN + col * (PHOTO_SIZE + PHOTO_GAP);
    const rowY = l.y;
    const imageY = rowY + LABEL_H;

    l.doc.setFont('helvetica', 'bold');
    l.doc.setFontSize(8);
    l.doc.setTextColor(...C.label);
    l.doc.text(`Photo ${i + 1}`, x, rowY + 8);

    const dataUri = await loadImage(source, (pData) => onImageProgress?.(i, pData));

    l.doc.setDrawColor(...C.line);
    l.doc.setFillColor(...C.panel);
    l.doc.roundedRect(x, imageY, PHOTO_SIZE, PHOTO_SIZE, 2, 2, 'FD');

    if (dataUri) {
      try {
        l.doc.addImage(
          dataUri,
          dataUri.includes('png') ? 'PNG' : 'JPEG',
          x + 2,
          imageY + 2,
          PHOTO_SIZE - 4,
          PHOTO_SIZE - 4,
        );
      } catch (err) {
        console.warn('PDF: Failed to add image to document', err);
        l.doc.setFont('helvetica', 'normal');
        l.doc.setFontSize(8);
        l.doc.text('Error loading', x + PHOTO_SIZE / 2, imageY + PHOTO_SIZE / 2, { align: 'center' });
      }
    } else {
      l.doc.setFont('helvetica', 'normal');
      l.doc.setFontSize(8);
      l.doc.text('Unavailable', x + PHOTO_SIZE / 2, imageY + PHOTO_SIZE / 2, { align: 'center' });
    }

    if (col === PHOTOS_PER_ROW - 1 || i === n - 1) {
      l.y += ROW_HEIGHT;
    }
  }

  l.y += 10;
}

async function drawSignature(
  l: L,
  incident: MappedIncident,
  onImageProgress?: (imgIndex: number, progress: { received: number; total: number } | null) => void,
) {
  const hasSig = !!(incident.signatureUri || incident.signature);
  if (!hasSig) return;

  section(l, 8, 'Signature');

  if (incident.signatureUri || (incident.signature && incident.signature.startsWith('data:'))) {
    const sigSource = incident.signatureUri || incident.signature!;
    const dataUri = await loadImage(sigSource, (pData) => onImageProgress?.(0, pData));
    if (dataUri) {
      try {
        space(l, 100);
        const w = Math.min(l.cw * 0.6, 300);
        const h = 80;
        l.doc.setDrawColor(...C.line);
        l.doc.setFillColor(...C.white);
        l.doc.roundedRect(MARGIN, l.y, w, h, 2, 2, 'FD');
        l.doc.addImage(
          dataUri,
          dataUri.includes('png') ? 'PNG' : 'JPEG',
          MARGIN + 4,
          l.y + 4,
          w - 8,
          h - 8,
        );
        l.y += h + 15;
        return;
      } catch (err) {
        console.warn('PDF: Failed to add signature image', err);
      }
    }
  }

  // Fallback to text only if NOT a data URI
  const sigText = incident.signature || '';
  if (sigText && !sigText.startsWith('data:')) {
     drawParagraph(l, sigText);
  } else {
     emptyNote(l, 'No signature provided.');
  }
}

function footers(l: L, reportId: number) {
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
      `Report Pro · Report #${reportId} · ${stamp}`,
      l.pw / 2,
      l.ph - 16,
      { align: 'center' },
    );
    l.doc.text(`Page ${p} / ${total}`, l.pw - MARGIN, l.ph - 16, {
      align: 'right',
    });
  }
}

export async function buildIncidentReportPdf(
  incident: MappedIncident,
  onProgress?: DownloadProgressCallback,
): Promise<{ filePath: string; cachePath: string; base64: string }> {
  if (onProgress) onProgress({ received: 5, total: 100 });

  const photos = incident.photos.filter(p => p.uri || p.imgPath);
  const sigSource = incident.signatureUri || incident.signature;
  const isRemoteSig = sigSource && !sigSource.startsWith('data:');
  const remotePhotoCount = photos.filter(p => !((p.uri || p.imgPath)?.startsWith('data:'))).length;
  const totalRemoteImages = remotePhotoCount + (isRemoteSig ? 1 : 0);

  const handleImageProgress = (imgIndex: number, pData: { received: number; total: number } | null) => {
    if (!onProgress) return;
    if (totalRemoteImages <= 0) return;
    let fraction = 0;
    if (pData && pData.total > 0) {
      fraction = Math.min(1, Math.max(0, pData.received / pData.total));
    }
    const overallFraction = (imgIndex + fraction) / totalRemoteImages;
    const pct = Math.round(5 + overallFraction * 80);
    onProgress({ received: Math.min(85, Math.max(5, pct)), total: 100 });
  };

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const l = layout(doc);
  const emergency = incident.emergencyServices as Record<string, unknown>;

  const peopleN = incident.peopleCount ?? incident.peopleInvolved.length;
  const vehiclesN = incident.vehiclesCount ?? incident.vehicles.length;
  const witnessesN = incident.witnessesCount ?? incident.witnesses.length;

  drawBanner(l, incident);

  section(l, 1, 'Overview');
  renderSmartGridTable(l, [
    ['Site', txt(incident.siteName)],
    ['Injury type', txt(incident.injuryType)],
    ['Severity', incident.severity],
    ['Incident Date', formatAppDateTime(incident.incidentDate, incident.incidentTime)],
    ['Roster', String(incident.rosterId ?? '—')],
    ['People', String(peopleN)],
    ['Vehicles', String(vehiclesN)],
    ['Witnesses', String(witnessesN)],
    ...(incident.guardId != null
      ? [['Guard ID', String(incident.guardId)] as [string, string]]
      : []),
    ...(incident.createdAt
      ? [['Recorded', formatAppDateTime(incident.createdAt)] as [string, string]]
      : []),
  ]);

  section(l, 2, 'What happened');
  drawParagraph(l, incident.injuryDetail);

  drawRecordsSection(
    l,
    3,
    `People involved (${peopleN})`,
    incident.peopleInvolved,
    'No people were recorded for this incident.',
    'Person',
  );

  drawRecordsSection(
    l,
    4,
    `Vehicles (${vehiclesN})`,
    incident.vehicles,
    'No vehicles were recorded for this incident.',
    'Vehicle',
  );

  drawRecordsSection(
    l,
    5,
    `Witnesses (${witnessesN})`,
    incident.witnesses,
    'No witnesses were recorded for this incident.',
    'Witness',
  );

  section(l, 6, 'Emergency services');
  const emergRows = recordRows(emergency);
  if (emergRows.length) {
    renderSmartGridTable(l, emergRows);
  } else {
    emptyNote(l, 'No emergency services were called.');
  }

  await drawPhotos(l, incident, (imgIdx, pData) => handleImageProgress(imgIdx, pData));
  await drawSignature(l, incident, (imgIdx, pData) => handleImageProgress(photos.length + imgIdx, pData));
  footers(l, incident.id);

  if (onProgress) onProgress({ received: 85, total: 100 });

  const fileName = `incident-report-${incident.id}.pdf`;
  const pdfBase64 = doc.output('datauristring').split(',')[1];
  const cachePath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;

  if (onProgress) onProgress({ received: 92, total: 100 });

  await ReactNativeBlobUtil.fs.writeFile(cachePath, pdfBase64, 'base64');

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
