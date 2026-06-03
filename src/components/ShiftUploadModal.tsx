import * as XLSX from 'xlsx';

function ShiftUploadModal({ onClose, onImport }: { onClose: () => void; onImport: (shifts: ParsedShift[]) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [shifts, setShifts] = useState<ParsedShift[]>([]);

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target!.result, { type: 'array', cellDates: true });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      const parsed = rows.map(mapRow).filter(r => r.staffName && r.siteName);
      setShifts(parsed);
    };
    reader.readAsArrayBuffer(f);
  };
  // ... render dropzone + preview table + "Import" button
}