import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, X, ChevronRight, BookOpen, Layers } from 'lucide-react';
import { ProtaItem } from '../../../types';

interface GenerateProtaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMapel: string;
  defaultKelas: string;
  onApply: (items: Omit<ProtaItem, 'id'>[], replaceExisting: boolean) => void;
}

export const GenerateProtaModal: React.FC<GenerateProtaModalProps> = ({
  isOpen,
  onClose,
  defaultMapel,
  defaultKelas,
  onApply
}) => {
  const [mapel, setMapel] = useState(defaultMapel || 'Matematika');
  const [kelas, setKelas] = useState(defaultKelas || '7');
  const [targetJP, setTargetJP] = useState(110);
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedItems, setGeneratedItems] = useState<any[] | null>(null);
  const [replaceMode, setReplaceMode] = useState(true);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-prota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mapel, kelas, targetJP, notes })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghasilkan Program Tahunan.');
      }
      setGeneratedItems(data.items || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Terjadi kesalahan saat menghubungi layanan AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!generatedItems || generatedItems.length === 0) return;
    const formatted: Omit<ProtaItem, 'id'>[] = generatedItems.map((item) => ({
      guruId: 'guru-1',
      mapel,
      kelas,
      semester: item.semester === 'Genap' ? 'Genap' : 'Ganjil',
      bab: item.bab || 'Bab Materi Baru',
      capaianPembelajaran: item.capaianPembelajaran || '',
      alokasiWaktuJP: Number(item.alokasiWaktuJP) || 18,
      keterangan: item.keterangan || ''
    }));
    onApply(formatted, replaceMode);
    onClose();
  };

  const totalGeneratedJP = (generatedItems || []).reduce(
    (sum, i) => sum + (Number(i.alokasiWaktuJP) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
              <Sparkles className="h-5 w-5 text-amber-200 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                AI Generator Program Tahunan (Prota)
              </h3>
              <p className="text-xs text-emerald-100">
                Otomatisasi penyusunan bab, capaian pembelajaran, & alokasi JP Kurikulum Merdeka
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

        {/* Modal Content */}
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

          {/* Configuration Form */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
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
                <option value="7">Kelas 7 (Fase D)</option>
                <option value="8">Kelas 8 (Fase D)</option>
                <option value="9">Kelas 9 (Fase D)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Total JP / Tahun
              </label>
              <input
                type="number"
                value={targetJP}
                onChange={(e) => setTargetJP(Number(e.target.value))}
                min={36}
                max={280}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instruksi / Catatan Khusus (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Tekankan pada literasi numerasi kontekstual, sertakan proyek mini"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <button
              type="button"
              id="btn-trigger-ai-prota"
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 active:scale-95 disabled:opacity-50 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Gemini AI Sedang Menyusun Prota...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>{generatedItems ? 'Generate Ulang dengan AI' : 'Generate Prota Sekarang'}</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Results Preview */}
          {generatedItems && (
            <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                    ✓
                  </span>
                  <h4 className="text-xs font-bold text-slate-800">
                    Hasil Rekomendasi Prota ({generatedItems.length} Bab Terstruktur)
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    Total: {totalGeneratedJP} JP
                  </span>
                </div>
              </div>

              {/* Table Preview */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 w-16 text-center">Sem.</th>
                      <th className="px-3 py-2 w-48">Bab / Lingkup Materi</th>
                      <th className="px-3 py-2">Capaian Pembelajaran (CP)</th>
                      <th className="px-3 py-2 w-16 text-center">JP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {generatedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-sm font-semibold text-[10px] ${
                              item.semester === 'Genap'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.semester}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-800">{item.bab}</td>
                        <td className="px-3 py-2 text-slate-600 leading-relaxed">
                          {item.capaianPembelajaran}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-emerald-700">
                          {item.alokasiWaktuJP}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Application Options */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={replaceMode}
                    onChange={(e) => setReplaceMode(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Gantikan data Prota lama pada Kelas {kelas}</span>
                </label>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    id="btn-apply-ai-prota"
                    onClick={handleApply}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-95 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Terapkan Hasil ke Prota</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
