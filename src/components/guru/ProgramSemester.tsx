import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PromesItem } from '../../types';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';
import {
  CalendarDays,
  Plus,
  Printer,
  Edit2,
  Trash2,
  Check,
  X,
  Save,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { GeneratePromesModal } from './ai/GeneratePromesModal';
import { printWebDocument } from '../../utils/printHelper';

export const ProgramSemester: React.FC = () => {
  const {
    currentTeacher,
    promesList,
    addPromes,
    addPromesBatch,
    updatePromes,
    deletePromes,
    schoolSettings,
    showToast,
    showFeedbackModal
  } = useApp();

  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>(schoolSettings.activeSemester);
  const [selectedKelas, setSelectedKelas] = useState('7');
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PromesItem | null>(null);

  // Month lists
  const months =
    selectedSemester === 'Ganjil'
      ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

  // Form state
  const [formData, setFormData] = useState({
    tujuanPembelajaran: '',
    materiPokok: '',
    alokasiWaktuJP: 8,
    distribusiBulan: {} as Record<string, number[]>
  });

  const teacherPromes = promesList.filter(
    (p) => p.guruId === currentTeacher?.id && p.semester === selectedSemester
  );

  const totalJP = teacherPromes.reduce((sum, item) => sum + Number(item.alokasiWaktuJP || 0), 0);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      tujuanPembelajaran: '',
      materiPokok: '',
      alokasiWaktuJP: 8,
      distribusiBulan: {
        [months[0]]: [1, 2]
      }
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: PromesItem) => {
    setEditingItem(item);
    setFormData({
      tujuanPembelajaran: item.tujuanPembelajaran,
      materiPokok: item.materiPokok,
      alokasiWaktuJP: item.alokasiWaktuJP,
      distribusiBulan: item.distribusiBulan || {}
    });
    setShowModal(true);
  };

  const toggleWeekInItem = (promesId: string, month: string, week: number) => {
    const target = teacherPromes.find((p) => p.id === promesId);
    if (!target) return;

    const currentDist = { ...(target.distribusiBulan || {}) };
    const currentMonthWeeks = currentDist[month] ? [...currentDist[month]] : [];

    if (currentMonthWeeks.includes(week)) {
      currentDist[month] = currentMonthWeeks.filter((w) => w !== week);
    } else {
      currentDist[month] = [...currentMonthWeeks, week].sort();
    }

    updatePromes(promesId, { distribusiBulan: currentDist });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tujuanPembelajaran.trim() || !formData.materiPokok.trim()) {
      showToast('warning', 'Data Belum Lengkap', 'Mohon lengkapi Tujuan Pembelajaran dan Materi Pokok.');
      return;
    }

    if (editingItem) {
      updatePromes(editingItem.id, {
        tujuanPembelajaran: formData.tujuanPembelajaran,
        materiPokok: formData.materiPokok,
        alokasiWaktuJP: Number(formData.alokasiWaktuJP),
        distribusiBulan: formData.distribusiBulan
      });
      showToast('success', 'Promes Diperbarui', `Materi "${formData.materiPokok}" berhasil diperbarui.`);
    } else {
      addPromes({
        guruId: currentTeacher?.id || 'guru-1',
        mapel: currentTeacher?.mapel || 'Matematika',
        kelas: selectedKelas,
        semester: selectedSemester,
        tujuanPembelajaran: formData.tujuanPembelajaran,
        materiPokok: formData.materiPokok,
        alokasiWaktuJP: Number(formData.alokasiWaktuJP),
        distribusiBulan: formData.distribusiBulan
      });
      showToast('success', 'Promes Ditambahkan', `Materi "${formData.materiPokok}" berhasil ditambahkan ke Promes.`);
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const item = promesList.find((p) => p.id === id);
    showFeedbackModal({
      type: 'warning',
      title: 'Hapus Rencana Promes?',
      message: `Rencana pembelajaran untuk "${item?.materiPokok || 'materi ini'}" akan dihapus dari Program Semester.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: () => {
        deletePromes(id);
        showToast('info', 'Promes Dihapus', 'Baris capaian materi telah dihapus dari Program Semester.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <PrintHeader
        title={`PROGRAM SEMESTER (${selectedSemester.toUpperCase()}) TAHUN AJARAN ${schoolSettings.academicYear}`}
        subtitle={`Mata Pelajaran: ${currentTeacher?.mapel} | Fase D (Kelas ${selectedKelas}) | Guru: ${currentTeacher?.nama}, ${currentTeacher?.gelar}`}
      />

      {/* Screen Controls with PageHeader */}
      <div className="no-print">
        <PageHeader
          title="Program Semester (Promes)"
          subtitle="Distribusi alokasi waktu dan pemetaan minggu efektif tatap muka per bulan selama semester berjalan."
          badge="Perangkat Kurikulum"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Semester:</span>
                <select
                  id="select-semester-promes"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="Ganjil">Semester Ganjil (Juli - Des)</option>
                  <option value="Genap">Semester Genap (Jan - Jun)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Kelas:</span>
                <select
                  id="select-kelas-promes"
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="7">Kelas 7 (Fase D)</option>
                  <option value="8">Kelas 8 (Fase D)</option>
                  <option value="9">Kelas 9 (Fase D)</option>
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-print-promes"
                onClick={() => printWebDocument({ title: `Program Semester (Promes) Kelas ${selectedKelas} Semester ${selectedSemester}`, paperOrientation: 'landscape' })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Cetak Promes</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-ai-promes"
                onClick={() => setShowAIModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200 transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Generate Otomatis (AI)</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-add-promes"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Materi Promes</span>
              </motion.button>
            </div>
          }
          stats={[
            { label: 'Total Alokasi Semester', value: `${totalJP} JP`, helper: `${teacherPromes.length} Materi Pokok` },
            { label: 'Semester Aktif', value: `Semester ${selectedSemester}`, helper: selectedSemester === 'Ganjil' ? 'Juli - Desember' : 'Januari - Juni' },
            { label: 'Bulan Pembelajaran', value: `${months.length} Bulan`, helper: `${months.length * 5} Minggu Efektif` },
            { label: 'Tingkat & Mapel', value: `Kelas ${selectedKelas}`, helper: currentTeacher?.mapel || 'Kurikulum Merdeka' }
          ]}
        />
      </div>

      {/* Promes Matrix Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700">
              <tr>
                <th rowSpan={2} className="px-3 py-2 text-center border-r border-slate-200 w-10">No</th>
                <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 min-w-[200px]">Tujuan Pembelajaran</th>
                <th rowSpan={2} className="px-3 py-2 border-r border-slate-200 min-w-[160px]">Materi Pokok</th>
                <th rowSpan={2} className="px-2 py-2 text-center border-r border-slate-200 w-12">JP</th>
                {months.map((m) => (
                  <th key={m} colSpan={5} className="px-1 py-1 text-center border-r border-slate-200 uppercase tracking-wider text-[11px] bg-slate-100/80">
                    {m}
                  </th>
                ))}
                <th rowSpan={2} className="no-print px-3 py-2 text-right w-16">Aksi</th>
              </tr>
              <tr className="border-t border-slate-200 text-[10px] text-slate-500">
                {months.map((m) =>
                  [1, 2, 3, 4, 5].map((w) => (
                    <th key={`${m}-${w}`} className="px-1 py-1 text-center border-r border-slate-200 w-6">
                      {w}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {teacherPromes.length === 0 ? (
                <tr>
                  <td colSpan={35} className="py-8 text-center text-xs text-slate-400">
                    Belum ada data Program Semester untuk {selectedSemester}.
                  </td>
                </tr>
              ) : (
                teacherPromes.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3 py-2 text-center font-bold text-slate-400 border-r border-slate-100">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800 border-r border-slate-100">
                      {item.tujuanPembelajaran}
                    </td>
                    <td className="px-3 py-2 text-slate-600 border-r border-slate-100">
                      {item.materiPokok}
                    </td>
                    <td className="px-2 py-2 text-center font-bold text-emerald-800 bg-emerald-50/40 border-r border-slate-100">
                      {item.alokasiWaktuJP}
                    </td>

                    {/* Matrix of weeks */}
                    {months.map((m) =>
                      [1, 2, 3, 4, 5].map((w) => {
                        const activeWeeks = item.distribusiBulan?.[m] || [];
                        const isActive = activeWeeks.includes(w);

                        return (
                          <td
                            key={`${item.id}-${m}-${w}`}
                            onClick={() => toggleWeekInItem(item.id, m, w)}
                            className={`px-1 py-2 text-center cursor-pointer border-r border-slate-100 transition ${
                              isActive
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'hover:bg-slate-100 text-transparent'
                            }`}
                            title={`Klik untuk tandai ${m} Minggu ke-${w}`}
                          >
                            {isActive ? '✓' : '-'}
                          </td>
                        );
                      })
                    )}

                    <td className="no-print px-3 py-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="rounded-md p-1 text-slate-400 hover:text-emerald-600"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-md p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PrintSignatures />

      {/* Modal Add/Edit Promes */}
      {showModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-800">
                {editingItem ? 'Ubah Rincian Promes' : 'Tambah Materi Promes Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Tujuan Pembelajaran (TP) *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 7.1.1 Menyatakan besaran sehari-hari dengan bilangan bulat bertanda"
                  value={formData.tujuanPembelajaran}
                  onChange={(e) => setFormData({ ...formData, tujuanPembelajaran: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Materi Pokok / Lingkup Materi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bilangan Bulat Positif dan Negatif"
                  value={formData.materiPokok}
                  onChange={(e) => setFormData({ ...formData, materiPokok: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Alokasi Waktu (Jam Pelajaran / JP)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.alokasiWaktuJP}
                  onChange={(e) => setFormData({ ...formData, alokasiWaktuJP: Number(e.target.value) })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-promes"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah ke Promes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      <GeneratePromesModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        defaultMapel={currentTeacher?.mapel || 'Matematika'}
        defaultKelas={selectedKelas}
        defaultSemester={selectedSemester}
        onApply={(items, replace) => addPromesBatch(items, replace)}
      />
    </div>
  );
};
