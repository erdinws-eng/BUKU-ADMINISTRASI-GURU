import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, X, FileText, Check } from 'lucide-react';
import { LKPDItem } from '../../../types';

interface GenerateLKPDModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMapel: string;
  defaultKelas: string;
  onApply: (lkpd: Omit<LKPDItem, 'id'>) => void;
}

export const GenerateLKPDModal: React.FC<GenerateLKPDModalProps> = ({
  isOpen,
  onClose,
  defaultMapel,
  defaultKelas,
  onApply
}) => {
  const [mapel, setMapel] = useState(defaultMapel || 'Matematika');
  const [kelas, setKelas] = useState(defaultKelas || '7');
  const [topik, setTopik] = useState('');
  const [activityType, setActivityType] = useState('Diskusi Kelompok & Pemecahan Masalah');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topik.trim()) {
      setError('Mohon isi Topik / Masalah LKPD terlebih dahulu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-lkpd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapel,
          kelas,
          topik,
          activityType,
          notes
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghasilkan Lembar Kerja Peserta Didik.');
      }
      setGeneratedData(data.data || {});
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Terjadi kesalahan saat menghubungi layanan AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedData) return;
    const newLKPD: Omit<LKPDItem, 'id'> = {
      guruId: 'guru-1',
      mapel,
      kelas,
      judulLKPD: generatedData.judulLKPD || `LKPD: ${topik}`,
      topik: generatedData.topik || topik,
      petunjukBelajar: generatedData.petunjukBelajar || '',
      langkahKegiatan: generatedData.langkahKegiatan || '',
      soalKasus: generatedData.soalKasus || '',
      rubrikPenilaian: generatedData.rubrikPenilaian || ''
    };
    onApply(newLKPD);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
              <Sparkles className="h-5 w-5 text-amber-200 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                AI Generator Lembar Kerja Peserta Didik (LKPD)
              </h3>
              <p className="text-xs text-emerald-100">
                Penyusunan aktivitas lembar kerja kontekstual, studi kasus, instruksi, dan rubrik penilaian
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
          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-semibold">Pemberitahuan</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Form Configuration */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topik / Masalah LKPD <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                placeholder="Contoh: Eksplorasi Bangun Datar di Lingkungan Sekolah"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                placeholder="Contoh: Matematika"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Kelas
              </label>
              <select
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipe Kegiatan Belajar
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Diskusi Kelompok & Pemecahan Masalah">Diskusi Kelompok & Pemecahan Masalah</option>
                <option value="Eksplorasi Konsep Berbantuan Alat Peraga">Eksplorasi Konsep Berbantuan Alat Peraga</option>
                <option value="Penyelidikan / Percobaan Sederhana">Penyelidikan / Percobaan Sederhana</option>
                <option value="Studi Kasus Kontekstual Remaja">Studi Kasus Kontekstual Remaja</option>
                <option value="Penugasan Proyek Mini Mandiri">Penugasan Proyek Mini Mandiri</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Petunjuk Khusus / Skenario Soal (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Sertakan data tabel pembelian, minta siswa membuat grafik batang dan simpulan"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex justify-center">
            <button
              type="button"
              id="btn-trigger-ai-lkpd"
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 active:scale-95 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Gemini AI Sedang Merancang LKPD & Studi Kasus...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>{generatedData ? 'Generate Ulang LKPD' : 'Generate LKPD Sekarang'}</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result Preview */}
          {generatedData && (
            <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  ✓
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {generatedData.judulLKPD || `LKPD: ${topik}`}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Topik: {generatedData.topik} | Kelas: {kelas}
                  </p>
                </div>
              </div>

              {/* Preview Sections */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 text-xs space-y-3.5 max-h-64 overflow-y-auto">
                <div>
                  <span className="font-bold text-emerald-800 block mb-1">
                    Petunjuk Belajar:
                  </span>
                  <div className="whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed text-slate-600">
                    {generatedData.petunjukBelajar}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-emerald-800 block mb-1">
                    Langkah Kegiatan:
                  </span>
                  <div className="whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed text-slate-600">
                    {generatedData.langkahKegiatan}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-emerald-800 block mb-1">
                    Soal / Studi Kasus:
                  </span>
                  <div className="whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed text-slate-700 font-medium">
                    {generatedData.soalKasus}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-emerald-800 block mb-1">
                    Rubrik Penilaian:
                  </span>
                  <div className="whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed text-slate-600">
                    {generatedData.rubrikPenilaian}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  id="btn-apply-ai-lkpd"
                  onClick={handleApply}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-95 transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan & Terapkan LKPD</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
