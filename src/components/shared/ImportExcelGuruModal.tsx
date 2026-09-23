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
  AlertTriangle
} from 'lucide-react';
import { Guru } from '../../types';

interface ImportExcelGuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (guruList: Omit<Guru, 'id'>[], replaceExisting?: boolean) => void;
}

interface ParsedGuruRow {
  nip: string;
  nama: string;
  gelar: string;
  email: string;
  phone: string;
  mapel: string;
  kelasDiampu: string[];
  statusKepegawaian: Guru['statusKepegawaian'];
  statusAktif: boolean;
  alamat?: string;
  isValid: boolean;
  note?: string;
}

export const ImportExcelGuruModal: React.FC<ImportExcelGuruModalProps> = ({
  isOpen,
  onClose,
  onApply
}) => {
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedGuruRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download template .xlsx for teachers
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'NIP': '198503152010011005',
        'Nama Guru': 'Hendra Setiawan',
        'Gelar': 'S.Pd.',
        'Mata Pelajaran': 'Matematika',
        'Kelas Diampu': '7A, 7B, 8A',
        'Status Kepegawaian': 'PNS',
        'Email': 'hendra.setiawan@smp.sch.id',
        'No HP': '081234567801'
      },
      {
        'NIP': '199008222019022010',
        'Nama Guru': 'Dewi Sartika',
        'Gelar': 'M.Pd.',
        'Mata Pelajaran': 'Bahasa Indonesia',
        'Kelas Diampu': '7A, 7B, 9A',
        'Status Kepegawaian': 'PPPK',
        'Email': 'dewi.sartika@smp.sch.id',
        'No HP': '081234567802'
      },
      {
        'NIP': '',
        'Nama Guru': 'Rian Pratama',
        'Gelar': 'S.Pd.',
        'Mata Pelajaran': 'Ilmu Pengetahuan Alam (IPA)',
        'Kelas Diampu': '8A, 8B',
        'Status Kepegawaian': 'GTT',
        'Email': 'rian.pratama@gmail.com',
        'No HP': '081398765432'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [
      { wch: 22 }, // NIP
      { wch: 25 }, // Nama
      { wch: 10 }, // Gelar
      { wch: 28 }, // Mapel
      { wch: 16 }, // Kelas Diampu
      { wch: 18 }, // Status
      { wch: 28 }, // Email
      { wch: 16 }  // No HP
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Guru');

    XLSX.writeFile(workbook, 'Template_Import_Master_Guru.xlsx');
  };

  // 2. Parse uploaded file
  const processFile = (file: File) => {
    setErrorMsg(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          throw new Error('Gagal membaca isi berkas.');
        }

        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('Berkas Excel tidak memiliki sheet yang dapat dibaca.');
        }

        const sheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rawJson.length === 0) {
          throw new Error('Lembar kerja kosong atau tidak ada baris data yang ditemukan.');
        }

        const findField = (row: any, candidates: string[]) => {
          const keys = Object.keys(row);
          for (const cand of candidates) {
            const match = keys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === cand.toLowerCase().replace(/[^a-z0-9]/g, ''));
            if (match && row[match] !== undefined && row[match] !== '') {
              return String(row[match]).trim();
            }
          }
          return '';
        };

        const rows: ParsedGuruRow[] = rawJson.map((row) => {
          const rawNip = findField(row, ['nip', 'nomorindukpegawai', 'idpegawai']);
          const rawNama = findField(row, ['namaguru', 'nama', 'namalengkap', 'pendidik']);
          const rawGelar = findField(row, ['gelar', 'title', 'gelardepanbelakang']) || 'S.Pd';
          const rawMapel = findField(row, ['matapelajaran', 'mapel', 'bidangstudi', 'pengampu']);
          const rawKelas = findField(row, ['kelasdiampu', 'kelas', 'rombel', 'rombeldiampu']);
          const rawStatus = findField(row, ['statuskepegawaian', 'status', 'kepegawaian']).toUpperCase();
          const rawEmail = findField(row, ['email', 'surel', 'e-mail']);
          const rawPhone = findField(row, ['nohp', 'nomorhp', 'telepon', 'whatsapp', 'phone']);

          // Parse classes: e.g. "7A, 7B" -> ["7A", "7B"]
          let parsedKelas: string[] = ['7A'];
          if (rawKelas) {
            parsedKelas = rawKelas
              .split(/[,;\-\/]+/)
              .map((k) => k.trim().toUpperCase())
              .filter((k) => k.length > 0);
          }

          // Parse employment status
          let statusKepegawaian: Guru['statusKepegawaian'] = 'PNS';
          if (rawStatus.includes('PPPK')) {
            statusKepegawaian = 'PPPK';
          } else if (rawStatus.includes('GTT')) {
            statusKepegawaian = 'GTT';
          } else if (rawStatus.includes('HONOR')) {
            statusKepegawaian = 'Honor Sekolah';
          }

          const isValid = rawNama.length > 0 && rawMapel.length > 0;
          let note = '';
          if (!rawNama) note = 'Nama guru wajib diisi';
          else if (!rawMapel) note = 'Mata pelajaran wajib diisi';

          return {
            nip: rawNip || '-',
            nama: rawNama,
            gelar: rawGelar,
            email: rawEmail || `${rawNama.toLowerCase().replace(/\s+/g, '.')}@sekolah.sch.id`,
            phone: rawPhone || '081234567890',
            mapel: rawMapel,
            kelasDiampu: parsedKelas.length > 0 ? parsedKelas : ['7A'],
            statusKepegawaian,
            statusAktif: true,
            isValid,
            note
          };
        });

        const validRows = rows.filter((r) => r.isValid);
        if (validRows.length === 0) {
          throw new Error('Tidak ditemukan data guru yang valid. Pastikan header memuat kolom "Nama Guru" dan "Mata Pelajaran".');
        }

        setParsedRows(rows);
      } catch (err: any) {
        console.error('Error parsing Excel Guru:', err);
        setErrorMsg(err?.message || 'Terjadi kesalahan saat membaca berkas Excel.');
        setParsedRows([]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApply = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('Tidak ada data guru valid yang dapat disimpan.');
      return;
    }

    const payload: Omit<Guru, 'id'>[] = validRows.map((r) => ({
      nip: r.nip,
      nama: r.nama,
      gelar: r.gelar,
      email: r.email,
      phone: r.phone,
      mapel: r.mapel,
      kelasDiampu: r.kelasDiampu,
      statusKepegawaian: r.statusKepegawaian,
      statusAktif: r.statusAktif,
      alamat: ''
    }));

    onApply(payload, importMode === 'replace');
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
              <FileSpreadsheet className="h-5 w-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Import Master Data Guru dari Excel (.xlsx / .csv)
              </h3>
              <p className="text-xs text-indigo-100">
                Unggah data pendidik, NIP, gelar, mata pelajaran, dan penugasan kelas secara massal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-semibold">Perhatian</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Template Action Banner */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
            <div className="text-xs text-indigo-950">
              <span className="font-bold">Format Excel Rekomendasi:</span> Kolom NIP, Nama Guru, Gelar, Mapel, Kelas Diampu, Status Kepegawaian, Email, dan No HP.
            </div>

            <button
              type="button"
              id="btn-download-template-guru"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 transition shadow-2xs shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>Unduh Format Excel Guru</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/60'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/40 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-3">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 mb-1">
              {fileName ? fileName : 'Pilih atau Tarik Berkas Excel Guru ke Sini'}
            </p>
            <p className="text-xs text-slate-500 max-w-md">
              Mendukung format berkas <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong>. Sistem akan membaca informasi guru secara otomatis.
            </p>
          </div>

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Terbaca: {validCount} Guru Valid
                  </span>
                </div>

                {/* Mode options */}
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="guruImportMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Gabungkan (Lewati NIP ganda)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-rose-700 font-semibold">
                    <input
                      type="radio"
                      name="guruImportMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>Ganti seluruh data guru</span>
                  </label>
                </div>
              </div>

              {/* Table preview */}
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">No</th>
                      <th className="py-2 px-3">NIP</th>
                      <th className="py-2 px-3">Nama & Gelar</th>
                      <th className="py-2 px-3">Mata Pelajaran</th>
                      <th className="py-2 px-3">Kelas Diampu</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Validitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={row.isValid ? 'hover:bg-slate-50/80' : 'bg-rose-50/60'}>
                        <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {row.nip}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-800">
                          {row.nama ? `${row.nama}, ${row.gelar}` : <span className="text-rose-500 italic">Nama kosong</span>}
                        </td>
                        <td className="py-2 px-3 font-medium text-indigo-700">
                          {row.mapel || <span className="text-rose-500 italic">Mapel kosong</span>}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          <div className="flex flex-wrap gap-1">
                            {row.kelasDiampu.map((k) => (
                              <span key={k} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                                {k}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                            {row.statusKepegawaian}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Siap</span>
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

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="button"
              id="btn-confirm-import-guru"
              onClick={handleApply}
              disabled={validCount === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 active:scale-95 disabled:opacity-50 transition"
            >
              <FileCheck className="h-4 w-4" />
              <span>Terapkan & Simpan {validCount > 0 ? `(${validCount}) Guru` : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
