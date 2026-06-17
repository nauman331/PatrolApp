import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MappedIncident } from './incidentsMapper';

const MARGIN = 48;
const BOTTOM = 36;
const GAP = 18;

const C = {
  navy: [26, 26, 46] as [number, number, number],
  accent: [121, 31, 61] as [number, number, number],
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
  const s = String(value).replace(/\s+/g, ' ').trim();
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

async function loadImage(uri: string): Promise<string | null> {
  if (uri.startsWith('data:')) {
    return uri;
  }

  const token = await AsyncStorage.getItem('authToken');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await ReactNativeBlobUtil.config({ fileCache: true }).fetch(
      'GET',
      uri,
      headers,
    );
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
  l.doc.text('Patrol App', l.pw - MARGIN, 28, { align: 'right' });
  l.doc.text(
    new Date().toLocaleDateString(),
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

/** Two-column facts table — easy to scan. */
function factsGrid(l: L, rows: [string, string][]) {
  if (!rows.length) return;
  space(l, 30);
  const rowCount = Math.ceil(rows.length / 2);
  const left = rows.slice(0, rowCount);
  const right = rows.slice(rowCount);
  const body: string[][] = [];
  for (let i = 0; i < rowCount; i++) {
    const Lr = left[i];
    const Rr = right[i];
    body.push([
      Lr ? `${Lr[0]}: ${Lr[1]}` : '',
      Rr ? `${Rr[0]}: ${Rr[1]}` : '',
    ]);
  }

  const colHalf = l.cw / 2;
  autoTable(l.doc, {
    startY: l.y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: l.cw,
    theme: 'grid',
    styles: {
      fontSize: 9,
      textColor: C.text,
      cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
      lineColor: C.line,
      lineWidth: 0.4,
      overflow: 'linebreak',
    },
    body,
    columnStyles: {
      0: { cellWidth: colHalf, fillColor: C.panel },
      1: { cellWidth: colHalf },
    },
  });
  afterTable(l);
}

/** Full-width table: two field pairs per row (4 columns). */
function detailTable(l: L, rows: [string, string][]) {
  if (!rows.length) return;
  space(l, 24);

  const body: string[][] = [];
  for (let i = 0; i < rows.length; i += 2) {
    const left = rows[i];
    const right = rows[i + 1];
    body.push([
      left[0],
      left[1],
      right?.[0] ?? '',
      right?.[1] ?? '',
    ]);
  }

  const quarter = l.cw / 4;
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
      valign: 'middle',
    },
    body,
    columnStyles: {
      0: {
        cellWidth: quarter,
        fontStyle: 'bold',
        textColor: C.label,
        fillColor: C.panel,
      },
      1: { cellWidth: quarter },
      2: {
        cellWidth: quarter,
        fontStyle: 'bold',
        textColor: C.label,
        fillColor: C.panel,
      },
      3: { cellWidth: quarter },
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

    detailTable(l, rows);
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

async function drawPhotos(l: L, incident: MappedIncident) {
  const photos = incident.photos.filter(p => p.uri || p.imgPath);
  if (!photos.length) return;

  section(l, 7, `Photos (${photos.length})`);

  const PHOTO_SIZE = 96;
  const PHOTO_GAP = 10;
  const COLS = 3;
  const LABEL_H = 10;
  const rowHeight = LABEL_H + PHOTO_SIZE + PHOTO_GAP;
  const rows = Math.ceil(photos.length / COLS);

  space(l, rows * rowHeight + 16);
  const startY = l.y;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const source = photo.uri || photo.imgPath;
    if (!source) continue;

    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = MARGIN + col * (PHOTO_SIZE + PHOTO_GAP);
    const y = startY + row * rowHeight;

    l.doc.setFont('helvetica', 'bold');
    l.doc.setFontSize(8);
    l.doc.setTextColor(...C.label);
    l.doc.text(`Photo ${i + 1}`, x, y + 8);

    const imageY = y + LABEL_H;
    const dataUri = await loadImage(source);
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
      } catch {
        l.doc.setFont('helvetica', 'normal');
        l.doc.setFontSize(8);
        l.doc.setTextColor(...C.label);
        l.doc.text('Unavailable', x + 18, imageY + PHOTO_SIZE / 2);
      }
    } else {
      l.doc.setFont('helvetica', 'normal');
      l.doc.setFontSize(8);
      l.doc.setTextColor(...C.label);
      l.doc.text('Unavailable', x + 18, imageY + PHOTO_SIZE / 2);
    }
  }

  l.y = startY + rows * rowHeight + 8;
}

async function drawSignature(l: L, incident: MappedIncident) {
  if (!incident.signatureUri && !incident.signature) return;

  section(l, 8, 'Signature');
  space(l, 90);

  if (incident.signatureUri) {
    const dataUri = await loadImage(incident.signatureUri);
    if (dataUri) {
      try {
        const w = Math.min(l.cw * 0.55, 280);
        const h = 70;
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
        l.y += h + 12;
        return;
      } catch {
        /* fall through */
      }
    }
  }

  drawParagraph(l, incident.signature ?? '—');
}

function footers(l: L, reportId: number) {
  const total = l.doc.getNumberOfPages();
  const stamp = new Date().toLocaleString();
  for (let p = 1; p <= total; p++) {
    l.doc.setPage(p);
    l.doc.setDrawColor(...C.line);
    l.doc.line(MARGIN, l.ph - 28, l.pw - MARGIN, l.ph - 28);
    l.doc.setFont('helvetica', 'normal');
    l.doc.setFontSize(8);
    l.doc.setTextColor(...C.label);
    l.doc.text(
      `Patrol App · Report #${reportId} · ${stamp}`,
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
): Promise<string> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const l = layout(doc);
  const emergency = incident.emergencyServices as Record<string, unknown>;

  const peopleN = incident.peopleCount ?? incident.peopleInvolved.length;
  const vehiclesN = incident.vehiclesCount ?? incident.vehicles.length;
  const witnessesN = incident.witnessesCount ?? incident.witnesses.length;

  drawBanner(l, incident);

  section(l, 1, 'Overview');
  factsGrid(l, [
    ['Site', txt(incident.siteName)],
    ['Injury type', txt(incident.injuryType)],
    ['Severity', incident.severity],
    ['Date', txt(incident.incidentDate)],
    ['Time', txt(incident.incidentTime)],
    ['Roster', String(incident.rosterId ?? '—')],
    ['People', String(peopleN)],
    ['Vehicles', String(vehiclesN)],
    ['Witnesses', String(witnessesN)],
    ...(incident.guardId != null
      ? [['Guard ID', String(incident.guardId)] as [string, string]]
      : []),
    ...(incident.createdAt
      ? [['Recorded', txt(incident.createdAt)] as [string, string]]
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
    detailTable(l, emergRows);
  } else {
    emptyNote(l, 'No emergency services were called.');
  }

  await drawPhotos(l, incident);
  await drawSignature(l, incident);
  footers(l, incident.id);

  const fileName = `incident-report-${incident.id}.pdf`;
  const pdfBase64 = doc.output('datauristring').split(',')[1];
  const cachePath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;

  await ReactNativeBlobUtil.fs.writeFile(cachePath, pdfBase64, 'base64');

  if (Platform.OS === 'android') {
    try {
      const contentUri =
        await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
          {
            name: fileName,
            parentFolder: 'PatrolApp',
            mimeType: 'application/pdf',
          },
          'Download',
          cachePath,
        );
      await ReactNativeBlobUtil.fs.unlink(cachePath).catch(() => undefined);
      return contentUri;
    } catch {
      const legacyPath = `${ReactNativeBlobUtil.fs.dirs.LegacyDownloadDir}/${fileName}`;
      await ReactNativeBlobUtil.fs.cp(cachePath, legacyPath);
      await ReactNativeBlobUtil.fs.unlink(cachePath).catch(() => undefined);
      await ReactNativeBlobUtil.fs.scanFile([
        { path: legacyPath, mime: 'application/pdf' },
      ]);
      return legacyPath;
    }
  }

  const filePath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`;
  await ReactNativeBlobUtil.fs.writeFile(filePath, pdfBase64, 'base64');
  await ReactNativeBlobUtil.fs.unlink(cachePath).catch(() => undefined);
  return filePath;
}
