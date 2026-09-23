import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProtaItem } from '../../types';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';
import {
  CalendarRange,
  Plus,
  Printer,
  Edit2,
  Trash2,
  X,
  Save,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { GenerateProtaModal } from './ai/GenerateProtaModal';
import { printWebDocument } from '../../utils/printHelper';

export const ProgramTahunan: React.FC = () => {
  const {
    currentTeacher,
    protas,
    addProta,
    addProtaBatch,
    updateProta,
    deleteProta,
    schoolSettings,
    showToast,
    showFeedbackModal
  } = useApp();

  const [selectedKelas, setSelectedKelas] = useState('7');
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProtaItem | null>(null);

  const [formData, setFormData] = useState({
    semester: 'Ganjil' as 'Ganjil' | 'Genap',
    bab: '',
    capaianPembelajaran: '',
    alokasiWaktuJP: 20,
    keterangan: ''
  });

  const teacherProtas = protas.filter(
    (p) => p.guruId === currentTeacher?.id && p.kelas === selectedKelas
  );

  const ganjilItems = teacherProtas.filter((p) => p.semester === 'Ganjil');
  const genapItems = teacherProtas.filter((p) => p.semester === 'Genap');

  const totalGanjilJP = ganjilItems.reduce((s, i) => s + Number(i.alokasiWaktuJP || 0), 0);
  const totalGenapJP = genapItems.reduce((s, i) => s + Number(i.alokasiWaktuJP || 0), 0);
  const totalYearJP = totalGanjilJP + totalGenapJP;

  const handleOpenAdd = (defaultSem: 'Ganjil' | 'Genap' = 'Ganjil') => {
    setEditingItem(null);
    setFormData({
      semester: defaultSem,
      bab: '',
      capaianPembelajaran: '',
      alokasiWaktuJP: 20,
      keterangan: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item: ProtaItem) => {
    setEditingItem(item);
    setFormData({
      semester: item.semester,
      bab: item.bab,
      capaianPembelajaran: item.capaianPembelajaran,
      alokasiWaktuJP: item.alokasiWaktuJP,
      keterangan: item.keterangan || ''
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bab.trim() || !formData.capaianPembelajaran.trim()) {
      showToast('warning', 'Data Belum Lengkap', 'Mohon lengkapi Bab/Lingkup Materi dan Capaian Pembelajaran.');
      return;
    }

    if (editingItem) {
      updateProta(editingItem.id, {
        semester: formData.semester,
        bab: formData.bab,
        capaianPembelajaran: formData.capaianPembelajaran,
        alokasiWaktuJP: Number(formData.alokasiWaktuJP),
        keterangan: formData.keterangan
      });
      showToast('success', 'Prota Diperbarui', `Materi "${formData.bab}" berhasil diperbarui.`);
    } else {
      addProta({
        guruId: currentTeacher?.id || 'guru-1',
        mapel: currentTeacher?.mapel || 'Matematika',
        kelas: selectedKelas,
        semester: formData.semester,
        bab: formData.bab,
        capaianPembelajaran: formData.capaianPembelajaran,
        alokasiWaktuJP: Number(formData.alokasiWaktuJP),
        keterangan: formData.keterangan
      });
      showToast('success', 'Prota Ditambahkan', `Materi "${formData.bab}" berhasil ditambahkan ke Prota.`);
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const item = protas.find((p) => p.id === id);
    showFeedbackModal({
      type: 'warning',
      title: 'Hapus Rencana Prota?',
      message: `Rencana pembelajaran untuk "${item?.bab || 'materi ini'}" akan dihapus dari Program Tahunan.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: () => {
        deleteProta(id);
        showToast('info', 'Prota Dihapus', 'Baris capaian materi telah dihapus dari Prota.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <PrintHeader
        title={`PROGRAM TAHUNAN (PROTA) TAHUN AJARAN ${schoolSettings.academicYear}`}
        subtitle={`Mata Pelajaran: ${currentTeacher?.mapel} | Fase D (Kelas ${selectedKelas}) | Guru: ${currentTeacher?.nama}, ${currentTeacher?.gelar}`}
      />

      {/* Screen Controls with PageHeader */}
      <div className="no-print">
        <PageHeader
          title="Program Tahunan (Prota)"
          subtitle="Rencana alokasi jam tatap muka dan distribusi capaian pembelajaran (CP) selama satu tahun ajaran penuh."
          badge="Perangkat Kurikulum"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Tingkat Kelas:</span>
                <select
                  id="select-prota-kelas"
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
                id="btn-print-prota"
                onClick={() => printWebDocument({ title: `Program Tahunan (Prota) Kelas ${selectedKelas} - ${currentTeacher?.mapel || ''}` })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Cetak Prota</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-ai-prota"
                onClick={() => setShowAIModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200 transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Generate Otomatis (AI)</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-add-prota"
                onClick={() => handleOpenAdd('Ganjil')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Materi</span>
              </motion.button>
            </div>
          }
          stats={[
            { label: 'Total Alokasi Pembelajaran', value: `${totalYearJP} JP`, helper: `${teacherProtas.length} Materi / Capaian` },
            { label: 'Semester Ganjil', value: `${totalGanjilJP} JP`, helper: `${ganjilItems.length} Materi Pokok` },
            { label: 'Semester Genap', value: `${totalGenapJP} JP`, helper: `${genapItems.length} Materi Pokok` },
            { label: 'Tingkat & Mapel', value: `Kelas ${selectedKelas}`, helper: currentTeacher?.mapel || 'Kurikulum Merdeka' }
          ]}
        />
      </div>

      {/* Prota Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3.5 py-3 text-center w-12">No</th>
                <th className="px-3.5 py-3 text-center w-24">Semester</th>
                <th className="px-3.5 py-3 min-w-[180px]">Bab / Lingkup Materi</th>
                <th className="px-4 py-3 min-w-[320px]">Capaian Pembelajaran (CP) / Elemen</th>
                <th className="px-3 py-3 text-center w-24">Alokasi Waktu</th>
                <th className="px-3.5 py-3 min-w-[140px]">Keterangan</th>
                <th className="no-print px-3.5 py-3 text-right w-16">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {/* Semester Ganjil Section */}
              <tr className="bg-slate-100/60 font-bold text-slate-800">
                <td colSpan={7} className="px-4 py-2 text-xs uppercase tracking-wide text-emerald-800">
                  SEMESTER 1 (GANJIL) | Subtotal: {totalGanjilJP} JP
                </td>
              </tr>
              {ganjilItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-xs text-slate-400">
                    Belum ada data untuk Semester Ganjil.
                  </td>
                </tr>
              ) : (
                ganjilItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3.5 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-3.5 py-3 text-center">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                        {item.semester}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-bold text-slate-900">{item.bab}</td>
                    <td className="px-4 py-3 text-slate-600 leading-relaxed">
                      {item.capaianPembelajaran}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-800 bg-emerald-50/30">
                      {item.alokasiWaktuJP} JP
                    </td>
                    <td className="px-3.5 py-3 text-slate-500 text-[11px]">
                      {item.keterangan || '-'}
                    </td>
                    <td className="no-print px-3.5 py-3 text-right whitespace-nowrap">
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

              {/* Semester Genap Section */}
              <tr className="bg-slate-100/60 font-bold text-slate-800">
                <td colSpan={7} className="px-4 py-2 text-xs uppercase tracking-wide text-emerald-800">
                  SEMESTER 2 (GENAP) | Subtotal: {totalGenapJP} JP
                </td>
              </tr>
              {genapItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-xs text-slate-400">
                    Belum ada data untuk Semester Genap.
                  </td>
                </tr>
              ) : (
                genapItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3.5 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-3.5 py-3 text-center">
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                        {item.semester}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 font-bold text-slate-900">{item.bab}</td>
                    <td className="px-4 py-3 text-slate-600 leading-relaxed">
                      {item.capaianPembelajaran}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-800 bg-emerald-50/30">
                      {item.alokasiWaktuJP} JP
                    </td>
                    <td className="px-3.5 py-3 text-slate-500 text-[11px]">
                      {item.keterangan || '-'}
                    </td>
                    <td className="no-print px-3.5 py-3 text-right whitespace-nowrap">
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

              {/* Total Row */}
              <tr className="bg-emerald-100/50 font-bold text-emerald-950">
                <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider text-xs">
                  TOTAL ALOKASI WAKTU 1 TAHUN AJARAN:
                </td>
                <td className="px-3 py-3 text-center text-sm font-extrabold text-emerald-800">
                  {totalYearJP} JP
                </td>
                <td colSpan={2} className="px-3 py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <PrintSignatures />

      {/* Modal Add/Edit Prota */}
      {showModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-800">
                {editingItem ? 'Ubah Bab Prota' : 'Tambah Bab Program Tahunan'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Ganjil">Semester Ganjil</option>
                    <option value="Genap">Semester Genap</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Alokasi Waktu (JP)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.alokasiWaktuJP}
                    onChange={(e) => setFormData({ ...formData, alokasiWaktuJP: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Bab / Lingkup Materi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bab 1: Bilangan Bulat dan Pecahan"
                  value={formData.bab}
                  onChange={(e) => setFormData({ ...formData, bab: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Capaian Pembelajaran (CP) / Elemen *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Uraian Capaian Pembelajaran peserta didik pada bab ini..."
                  value={formData.capaianPembelajaran}
                  onChange={(e) => setFormData({ ...formData, capaianPembelajaran: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Keterangan / Target Bulan</label>
                <input
                  type="text"
                  placeholder="misal: Juli - September"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
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
                  id="btn-save-prota"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Bab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      <GenerateProtaModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        defaultMapel={currentTeacher?.mapel || 'Matematika'}
        defaultKelas={selectedKelas}
        onApply={(items, replace) => addProtaBatch(items, replace)}
      />
    </div>
  );
};
