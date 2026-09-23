import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, X, BookOpen, Layers, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { ModulAjar } from '../../../types';

interface GenerateModulModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMapel: string;
  onApply: (modul: Omit<ModulAjar, 'id'>) => void;
}

export const GenerateModulModal: React.FC<GenerateModulModalProps> = ({
  isOpen,
  onClose,
  defaultMapel,
  onApply
}) => {
  const [mapel, setMapel] = useState(defaultMapel || 'Matematika');
  const [faseKelas, setFaseKelas] = useState('Fase D (Kelas 7)');
  const [judulModul, setJudulModul] = useState('');
  const [modelPembelajaran, setModelPembelajaran] = useState('Problem Based Learning (PBL)');
  const [alokasiWaktu, setAlokasiWaktu] = useState('2 Pertemuan (4 x 40 menit)');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<any | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'info' | 'kegiatan' | 'asesmen'>('kegiatan');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!judulModul.trim()) {
      setError('Mohon tuliskan Judul / Topik Materi Modul Ajar terlebih dahulu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-modul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mapel,
          faseKelas,
          judulModul,
          modelPembelajaran,
          alokasiWaktu,
          notes
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghasilkan Modul Ajar.');
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
    const newModul: Omit<ModulAjar, 'id'> = {
      guruId: 'guru-1',
      mapel,
      faseKelas,
      alokasiWaktu,
      judulModul: generatedData.judulModul || judulModul,
      elemen: generatedData.elemen || 'Pemahaman Konsep',
      profilPelajarPancasila: Array.isArray(generatedData.profilPelajarPancasila)
        ? generatedData.profilPelajarPancasila
        : ['Bernalar Kritis', 'Gotong Royong'],
      saranaPrasarana: generatedData.saranaPrasarana || 'Buku Siswa, LCD Proyektor, LKPD',
      targetPesertaDidik: generatedData.targetPesertaDidik || 'Peserta didik reguler',
      modelPembelajaran: generatedData.modelPembelajaran || modelPembelajaran,
      tujuanPembelajaran: Array.isArray(generatedData.tujuanPembelajaran)
        ? generatedData.tujuanPembelajaran
        : [generatedData.tujuanPembelajaran || 'Tujuan Pembelajaran'],
      kegiatanPembelajaran: {
        pendahuluan: generatedData.kegiatanPembelajaran?.pendahuluan || '',
        inti: generatedData.kegiatanPembelajaran?.inti || '',
        penutup: generatedData.kegiatanPembelajaran?.penutup || ''
      },
      asesmen: {
        diagnostik: generatedData.asesmen?.diagnostik || '',
        formatif: generatedData.asesmen?.formatif || '',
        sumatif: generatedData.asesmen?.sumatif || ''
      }
    };
    onApply(newModul);
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
                AI Generator Modul Ajar (RPP Kurikulum Merdeka)
              </h3>
              <p className="text-xs text-emerald-100">
                Penyusunan modul ajar lengkap: Elemen, TP, sintaks pembelajaran aktif, dan instrumen asesmen
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
                Topik / Judul Materi Modul Ajar <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={judulModul}
                onChange={(e) => setJudulModul(e.target.value)}
                placeholder="Contoh: Operasi Penjumlahan & Perkalian Bilangan Bulat Kontekstual"
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
                Fase & Kelas
              </label>
              <select
                value={faseKelas}
                onChange={(e) => setFaseKelas(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Fase D (Kelas 7)">Fase D (Kelas 7)</option>
                <option value="Fase D (Kelas 8)">Fase D (Kelas 8)</option>
                <option value="Fase D (Kelas 9)">Fase D (Kelas 9)</option>
                <option value="Fase E (Kelas 10)">Fase E (Kelas 10)</option>
                <option value="Fase F (Kelas 11-12)">Fase F (Kelas 11-12)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Model Pembelajaran
              </label>
              <select
                value={modelPembelajaran}
                onChange={(e) => setModelPembelajaran(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                <option value="Discovery Learning">Discovery Learning</option>
                <option value="Inquiry Learning">Inquiry Learning</option>
                <option value="Cooperative Learning">Cooperative Learning</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alokasi Waktu
              </label>
              <input
                type="text"
                value={alokasiWaktu}
                onChange={(e) => setAlokasiWaktu(e.target.value)}
                placeholder="2 Pertemuan (4 x 40 menit)"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Khusus / Pendekatan Diferensiasi (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Tekankan studi kasus kehidupan sehari-hari, gunakan media benda konkret/aplikasi GeoGebra"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex justify-center">
            <button
              type="button"
              id="btn-trigger-ai-modul"
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 active:scale-95 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Gemini AI Sedang Merumuskan Modul Ajar & Sintaks...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>{generatedData ? 'Generate Ulang Modul Ajar' : 'Generate Modul Ajar Sekarang'}</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result Preview */}
          {generatedData && (
            <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      {generatedData.judulModul || judulModul}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Elemen: {generatedData.elemen} | Model: {generatedData.modelPembelajaran}
                    </p>
                  </div>
                </div>

                {/* Sub-tabs preview */}
                <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('kegiatan')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                      activePreviewTab === 'kegiatan'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Langkah Pembelajaran
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('info')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                      activePreviewTab === 'info'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Profil & TP
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab('asesmen')}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition ${
                      activePreviewTab === 'asesmen'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Asesmen
                  </button>
                </div>
              </div>

              {/* Tab Content Preview */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 text-xs space-y-3 max-h-64 overflow-y-auto">
                {activePreviewTab === 'kegiatan' && (
                  <div className="space-y-3 text-slate-700">
                    <div>
                      <h5 className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
                        <span>A. Kegiatan Pendahuluan</span>
                      </h5>
                      <p className="whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed text-slate-600">
                        {generatedData.kegiatanPembelajaran?.pendahuluan}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
                        <span>B. Kegiatan Inti ({generatedData.modelPembelajaran})</span>
                      </h5>
                      <p className="whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed text-slate-600">
                        {generatedData.kegiatanPembelajaran?.inti}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
                        <span>C. Kegiatan Penutup</span>
                      </h5>
                      <p className="whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed text-slate-600">
                        {generatedData.kegiatanPembelajaran?.penutup}
                      </p>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'info' && (
                  <div className="space-y-3 text-slate-700">
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">
                        Profil Pelajar Pancasila:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(generatedData.profilPelajarPancasila) ? (
                          generatedData.profilPelajarPancasila.map((p: string, i: number) => (
                            <span
                              key={i}
                              className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800"
                            >
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-600">{generatedData.profilPelajarPancasila}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">
                        Tujuan Pembelajaran:
                      </span>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        {Array.isArray(generatedData.tujuanPembelajaran) ? (
                          generatedData.tujuanPembelajaran.map((tp: string, i: number) => (
                            <li key={i}>{tp}</li>
                          ))
                        ) : (
                          <li>{generatedData.tujuanPembelajaran}</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">
                        Sarana & Prasarana:
                      </span>
                      <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80">
                        {generatedData.saranaPrasarana}
                      </p>
                    </div>
                  </div>
                )}

                {activePreviewTab === 'asesmen' && (
                  <div className="space-y-3 text-slate-700">
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">1. Asesmen Diagnostik:</span>
                      <p className="bg-white p-2 rounded-lg border border-slate-200/80 text-slate-600">
                        {generatedData.asesmen?.diagnostik}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">2. Asesmen Formatif:</span>
                      <p className="bg-white p-2 rounded-lg border border-slate-200/80 text-slate-600">
                        {generatedData.asesmen?.formatif}
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">3. Asesmen Sumatif:</span>
                      <p className="bg-white p-2 rounded-lg border border-slate-200/80 text-slate-600">
                        {generatedData.asesmen?.sumatif}
                      </p>
                    </div>
                  </div>
                )}
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
                  id="btn-apply-ai-modul"
                  onClick={handleApply}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-95 transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Simpan & Terapkan Modul Ajar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
