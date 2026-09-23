import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Users,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Siswa } from '../../types';

interface ImportExcelSiswaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultKelas: string;
  availableClasses?: string[];
  onApply: (siswaList: Omit<Siswa, 'id'>[], replaceForClass?: string) => void;
}

interface ParsedSiswaRow {
  nisn: string;
  nis?: string;
  nama: string;
  gender: 'L' | 'P';
  kelas: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  namaWali?: string;
  kontakWali?: string;
  alamat?: string;
  isValid: boolean;
  note?: string;
}

export const ImportExcelSiswaModal: React.FC<ImportExcelSiswaModalProps> = ({
  isOpen,
  onClose,
  defaultKelas,
  availableClasses = ['7A', '7B', '8A', '8B', '9A', '9B'],
  onApply
}) => {
  const [targetKelas, setTargetKelas] = useState(defaultKelas === 'SEMUA' ? 'MULTI' : (defaultKelas || '7A'));
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedSiswaRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download formatted sample template .xlsx strictly (NO, NISN, Nama Siswa, Jenis Kelamin, Kelas)
  const handleDownloadTemplate = () => {
    const sampleClass = targetKelas === 'MULTI' ? (availableClasses[0] || '7A') : targetKelas;
    const templateData = [
      {
        'NO': 1,
        'NISN': '0081234561',
        'Nama Siswa': 'Ahmad Fadhil Ramadhan',
        'Jenis Kelamin': 'L',
        'Kelas': sampleClass
      },
      {
        'NO': 2,
        'NISN': '0087654321',
        'Nama Siswa': 'Annisa Putri Wardani',
        'Jenis Kelamin': 'P',
        'Kelas': sampleClass
      },
      {
        'NO': 3,
        'NISN': '0092345678',
        'Nama Siswa': 'Bagas Pratama Putra',
        'Jenis Kelamin': 'L',
        'Kelas': sampleClass
      },
      {
        'NO': 4,
        'NISN': '0098765432',
        'Nama Siswa': 'Citra Cantika Dewi',
        'Jenis Kelamin': 'P',
        'Kelas': sampleClass
      },
      {
        'NO': 5,
        'NISN': '0099887766',
        'Nama Siswa': 'Dian Permata Sari',
        'Jenis Kelamin': 'P',
        'Kelas': sampleClass
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 6 },  // NO
      { wch: 18 }, // NISN
      { wch: 32 }, // Nama Siswa
      { wch: 16 }, // Jenis Kelamin
      { wch: 12 }  // Kelas
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

    const downloadName = `Template_Import_Siswa_${targetKelas === 'MULTI' ? 'Multi_Kelas' : `Kelas_${targetKelas}`}.xlsx`;
    XLSX.writeFile(workbook, downloadName);
  };

  // Helper: map a 2D array of strings from Excel into parsed student rows
  const parseRowsFromData = (dataRows: any[][]): ParsedSiswaRow[] => {
    if (dataRows.length < 2) {
      throw new Error('Data di dalam lembar kerja Excel tidak mencukupi (minimal 1 baris judul kolom dan 1 baris data siswa).');
    }

    // Smart Header Finder: look through the first 15 rows for header markers
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(15, dataRows.length); i++) {
      const rowStrings = dataRows[i].map((c) => String(c || '').toLowerCase().trim());
      const hasNameMarker = rowStrings.some((s) =>
        s.includes('nama') || s.includes('siswa') || s.includes('peserta didik') || s.includes('student')
      );
      if (hasNameMarker) {
        headerRowIdx = i;
        break;
      }
    }

    const headers = dataRows[headerRowIdx].map((c) =>
      String(c || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    const getColIndex = (candidates: string[]) => {
      return headers.findIndex((h) => candidates.some((cand) => h.includes(cand)));
    };

    const idxNisn = getColIndex(['nisn', 'nomorinduksiswa', 'noinduk']);
    const idxNis = getColIndex(['nis', 'noabsen', 'nomorabsen']);
    const idxNama = getColIndex(['namasiswa', 'nama', 'namalengkap', 'pesertadidik']);
    const idxGender = getColIndex(['jeniskelamin', 'gender', 'jk', 'lp', 'sex']);
    const idxKelas = getColIndex(['kelas', 'rombel', 'romonganbelajar', 'tingkat']);
    const idxTempat = getColIndex(['tempatlahir', 'tmplahir', 'kota']);
    const idxTanggal = getColIndex(['tanggallahir', 'tgllahir']);
    const idxWali = getColIndex(['namawali', 'wali', 'orangtua', 'namaortu']);
    const idxKontak = getColIndex(['kontakwali', 'nohp', 'telepon', 'hp', 'wa']);
    const idxAlamat = getColIndex(['alamat', 'domisili']);

    if (idxNama === -1) {
      throw new Error('Kolom "Nama Siswa" tidak terdeteksi dalam berkas Excel. Pastikan baris judul memiliki kolom dengan kata "Nama" atau "Nama Siswa".');
    }

    const parsed: ParsedSiswaRow[] = [];

    for (let r = headerRowIdx + 1; r < dataRows.length; r++) {
      const row = dataRows[r];
      if (!row || row.length === 0 || row.every((c) => String(c || '').trim() === '')) {
        continue;
      }

      const rawNama = String(row[idxNama] || '').trim();
      if (!rawNama) continue; // skip row with empty name

      const rawNisn = idxNisn !== -1 ? String(row[idxNisn] || '').replace(/[^0-9]/g, '').trim() : '';
      const rawNis = idxNis !== -1 ? String(row[idxNis] || '').trim() : '';
      const rawGender = idxGender !== -1 ? String(row[idxGender] || '').toUpperCase().trim() : '';
      const rowKelas = idxKelas !== -1 ? String(row[idxKelas] || '').trim() : '';

      // Normalize gender
      let normalizedGender: 'L' | 'P' = 'L';
      if (rawGender.startsWith('P') || rawGender.includes('PEREMPUAN') || rawGender.includes('WANITA')) {
        normalizedGender = 'P';
      } else if (rawGender.startsWith('L') || rawGender.includes('LAKI') || rawGender.includes('PRIA')) {
        normalizedGender = 'L';
      }

      // Determine class
      let assignedKelas = targetKelas === 'MULTI' ? (rowKelas || availableClasses[0] || '7A') : targetKelas;
      if (!assignedKelas && rowKelas) assignedKelas = rowKelas;

      const isValid = rawNama.length >= 2;
      let note = '';
      if (!isValid) note = 'Nama terlalu pendek';
      else if (!rawNisn) note = 'NISN otomatis diisi (acak)';

      parsed.push({
        nisn: rawNisn || `00${Math.floor(10000000 + Math.random() * 90000000)}`,
        nis: rawNis,
        nama: rawNama,
        gender: normalizedGender,
        kelas: assignedKelas,
        tempatLahir: idxTempat !== -1 ? String(row[idxTempat] || '').trim() : '',
        tanggalLahir: idxTanggal !== -1 ? String(row[idxTanggal] || '').trim() : '',
        namaWali: idxWali !== -1 ? String(row[idxWali] || '').trim() : '',
        kontakWali: idxKontak !== -1 ? String(row[idxKontak] || '').trim() : '',
        alamat: idxAlamat !== -1 ? String(row[idxAlamat] || '').trim() : '',
        isValid,
        note
      });
    }

    return parsed;
  };

  // 2. Strict Process File (.xlsx and .xls only, REJECT CSV)
  const processFile = (file: File) => {
    setErrorMsg(null);

    // Enforce Excel ONLY
    const lowerName = file.name.toLowerCase();
    const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

    if (!isExcel) {
      setErrorMsg('Format berkas ditolak! Anda wajib mengunggah berkas Microsoft Excel (.xlsx atau .xls). Berkas format CSV tidak diizinkan.');
      setFileName(null);
      setFileSize(null);
      setParsedRows([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          throw new Error('Gagal membaca isi berkas Excel.');
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('Berkas Excel tidak memiliki lembar kerja (sheet).');
        }

        const sheet = workbook.Sheets[firstSheetName];
        const raw2D: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (raw2D.length === 0) {
          throw new Error('Lembar kerja Excel kosong atau tidak ada data yang ditemukan.');
        }

        const rows = parseRowsFromData(raw2D);
        if (rows.length === 0) {
          throw new Error('Tidak ditemukan baris data siswa yang dapat diolah dari berkas Excel. Pastikan format tabel sesuai template.');
        }

        setParsedRows(rows);
      } catch (err: any) {
        console.error('Error parsing Excel:', err);
        setErrorMsg(err?.message || 'Terjadi kesalahan saat mengolah berkas Excel.');
        setParsedRows([]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleApply = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('Tidak ada data valid yang dapat disimpan.');
      return;
    }

    const payload: Omit<Siswa, 'id'>[] = validRows.map((r) => ({
      nisn: r.nisn,
      nis: r.nis || '',
      nama: r.nama,
      gender: r.gender,
      kelas: r.kelas || (targetKelas === 'MULTI' ? (availableClasses[0] || '7A') : targetKelas),
      tempatLahir: r.tempatLahir || '',
      tanggalLahir: r.tanggalLahir || '',
      namaWali: r.namaWali || '',
      kontakWali: r.kontakWali || '',
      alamat: r.alamat || '',
      status: 'Aktif'
    }));

    const replaceClassArg = (importMode === 'replace' && targetKelas !== 'MULTI') ? targetKelas : undefined;
    onApply(payload, replaceClassArg);
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const countL = parsedRows.filter((r) => r.isValid && r.gender === 'L').length;
  const countP = parsedRows.filter((r) => r.isValid && r.gender === 'P').length;
  const detectedClasses = Array.from(new Set(parsedRows.filter((r) => r.isValid).map((r) => r.kelas))).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-4 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 px-5 sm:px-6 py-4 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs shadow-2xs">
              <FileSpreadsheet className="h-5 w-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  Import Data Siswa dari Excel (.xlsx / .xls)
                </h3>
                <span className="rounded-full bg-emerald-500/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                  Wajib Excel
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Impor massal data siswa wajib menggunakan format Microsoft Excel (.xlsx atau .xls)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
            aria-label="Tutup Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-bold">Format Berkas Ditolak</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Strict Excel notice banner */}
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
            <Info className="h-4 w-4 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <span>
                <strong>Format Kolom Cukup 5 Kolom:</strong> Berkas Excel hanya memerlukan kolom <strong>NO</strong>, <strong>NISN</strong>, <strong>Nama Siswa</strong>, <strong>Jenis Kelamin (L/P)</strong>, dan <strong>Kelas</strong>.
              </span>
            </div>
          </div>

          {/* Config Bar: Target Class & Template Button */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <label className="text-xs font-bold text-slate-700">Rombel / Kelas Sasaran:</label>
              <select
                value={targetKelas}
                onChange={(e) => setTargetKelas(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-hidden shadow-2xs"
              >
                <option value="MULTI">Otomatis dari Kolom Kelas di Excel (Semua Rombel)</option>
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Khusus Kelas {cls}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              id="btn-download-template-siswa"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs cursor-pointer shrink-0"
              title="Unduh contoh template resmi Microsoft Excel (.xlsx)"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Unduh Template Excel (.xlsx)</span>
            </button>
          </div>

          {/* Upload Dropzone (Strictly Excel .xlsx and .xls) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center cursor-pointer transition ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/70 scale-[0.99]'
                : fileName
                ? 'border-emerald-400 bg-emerald-50/30'
                : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-2.5 shadow-2xs">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">
              {fileName ? `${fileName} (${fileSize})` : 'Pilih atau Tarik Berkas Excel (.xlsx / .xls) ke Sini'}
            </p>
            <p className="text-xs text-slate-500 max-w-md">
              Hanya menerima format <strong>Microsoft Excel (.xlsx atau .xls)</strong>. Kolom cukup: <strong>NO</strong>, <strong>NISN</strong>, <strong>Nama Siswa</strong>, <strong>Jenis Kelamin (L/P)</strong>, dan <strong>Kelas</strong>.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
              <Upload className="h-3 w-3" />
              <span>{fileName ? 'Klik untuk Mengganti Berkas Excel' : 'Jelajahi Berkas Excel Komputer'}</span>
            </span>
          </div>

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 border-b border-slate-200 pb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-extrabold text-slate-800">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <span>Terdeteksi di Excel: {validCount} Siswa</span>
                  </span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800">
                    L: {countL}
                  </span>
                  <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-[11px] font-bold text-pink-800">
                    P: {countP}
                  </span>
                  {detectedClasses.length > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                      Rombel: {detectedClasses.join(', ')}
                    </span>
                  )}
                </div>

                {/* Import Mode selection */}
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Tambahkan ke data yang ada</span>
                  </label>
                  {targetKelas !== 'MULTI' && (
                    <label className="flex items-center gap-1.5 cursor-pointer text-rose-700 font-bold">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>Gantikan siswa kelas {targetKelas}</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Table preview */}
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 border-b border-slate-200 font-bold z-10">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">No</th>
                      <th className="py-2 px-3">NISN</th>
                      <th className="py-2 px-3">Nama Lengkap Siswa</th>
                      <th className="py-2 px-3 text-center">L/P</th>
                      <th className="py-2 px-3 text-center">Kelas</th>
                      <th className="py-2 px-3 text-center">Status Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50/80' : 'bg-rose-50/60'}>
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono font-medium text-slate-700">
                          {row.nisn}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-800">
                          {row.nama || <span className="text-rose-500 italic">Nama kosong</span>}
                        </td>
                        <td className="py-2 px-3 text-center font-semibold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                            {row.gender}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-700">
                          {row.kelas}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Valid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-medium text-[11px]">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span>{row.note}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 ? (
              <span>Total baris di Excel: <strong>{parsedRows.length}</strong> (Valid: <strong className="text-emerald-600">{validCount}</strong>)</span>
            ) : (
              <span>Pilih berkas Excel (.xlsx / .xls) untuk mempratinjau data.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              id="btn-confirm-import-siswa"
              onClick={handleApply}
              disabled={validCount === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 active:scale-95 disabled:opacity-50 transition cursor-pointer"
            >
              <FileCheck className="h-4 w-4" />
              <span>Simpan & Terapkan ({validCount} Siswa)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
