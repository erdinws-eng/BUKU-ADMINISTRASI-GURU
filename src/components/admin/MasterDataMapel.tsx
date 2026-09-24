import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MataPelajaran } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Printer,
  Sparkles,
  CheckCircle2,
  X,
  Layers,
  GraduationCap,
  Users
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { printWebDocument } from '../../utils/printHelper';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';

export const MasterDataMapel: React.FC = () => {
  const {
    mapels,
    addMapel,
    updateMapel,
    deleteMapel,
    deleteAllMapel,
    resetMapelToDefault,
    gurus,
    schoolSettings,
    showToast,
    showFeedbackModal,
    syncWithSupabase
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [editingMapel, setEditingMapel] = useState<MataPelajaran | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    kode: string;
    nama: string;
    kategori: MataPelajaran['kategori'];
    tingkatKelas: string[];
    kkm: number;
    keterangan: string;
  }>({
    kode: '',
    nama: '',
    kategori: 'Umum',
    tingkatKelas: ['7', '8', '9'],
    kkm: schoolSettings.kkmDefault || 75,
    keterangan: ''
  });

  // Filtered Mapel
  const filteredMapels = mapels.filter((m) => {
    const matchSearch =
      m.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.keterangan && m.keterangan.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchKategori = filterKategori === 'Semua' || m.kategori === filterKategori;
    return matchSearch && matchKategori;
  });

  // Helper: Find teachers teaching a subject
  const getTeachersForMapel = (mapelNama: string, mapelKode: string) => {
    return gurus.filter((g) => {
      const guruMapels = g.mapelList && g.mapelList.length > 0
        ? g.mapelList
        : g.mapel.split(',').map((x) => x.trim());
      return guruMapels.some(
        (m) =>
          m.toLowerCase() === mapelNama.toLowerCase() ||
          m.toLowerCase() === mapelKode.toLowerCase() ||
          m.toLowerCase().includes(mapelNama.toLowerCase()) ||
          mapelNama.toLowerCase().includes(m.toLowerCase())
      );
    });
  };

  const handleOpenAdd = () => {
    setEditingMapel(null);
    setFormData({
      kode: '',
      nama: '',
      kategori: 'Umum',
      tingkatKelas: ['7', '8', '9'],
      kkm: schoolSettings.kkmDefault || 75,
      keterangan: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (m: MataPelajaran) => {
    setEditingMapel(m);
    setFormData({
      kode: m.kode,
      nama: m.nama,
      kategori: m.kategori,
      tingkatKelas: m.tingkatKelas && m.tingkatKelas.length > 0 ? m.tingkatKelas : ['7', '8', '9'],
      kkm: m.kkm ?? (schoolSettings.kkmDefault || 75),
      keterangan: m.keterangan || ''
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.kode.trim()) {
      alert('Mohon isi kode dan nama mata pelajaran.');
      return;
    }

    if (editingMapel) {
      updateMapel(editingMapel.id, {
        kode: formData.kode.trim().toUpperCase(),
        nama: formData.nama.trim(),
        kategori: formData.kategori,
        tingkatKelas: formData.tingkatKelas,
        kkm: Number(formData.kkm) || 75,
        keterangan: formData.keterangan.trim()
      });
      showToast('success', 'Mata Pelajaran Diperbarui!', `Mata pelajaran ${formData.nama} (${formData.kode}) telah diperbarui.`);
    } else {
      addMapel({
        kode: formData.kode.trim().toUpperCase(),
        nama: formData.nama.trim(),
        kategori: formData.kategori,
        tingkatKelas: formData.tingkatKelas,
        kkm: Number(formData.kkm) || 75,
        keterangan: formData.keterangan.trim()
      });
      showToast('success', 'Mata Pelajaran Ditambahkan!', `Mata pelajaran baru ${formData.nama} (${formData.kode}) berhasil disimpan.`);
    }

    setShowModal(false);
  };

  const handleDelete = (m: MataPelajaran) => {
    showFeedbackModal({
      type: 'warning',
      title: 'Hapus Mata Pelajaran?',
      message: `Mata pelajaran "${m.nama}" (${m.kode}) akan dihapus dari kurikulum sekolah.`,
      confirmText: 'Ya, Hapus Mapel',
      cancelText: 'Batal',
      onConfirm: () => {
        deleteMapel(m.id);
        showToast('info', 'Mata Pelajaran Dihapus', `${m.nama} telah dihapus.`);
      }
    });
  };

  const handleToggleTingkat = (tingkat: string) => {
    setFormData((prev) => {
      const exists = prev.tingkatKelas.includes(tingkat);
      const next = exists
        ? prev.tingkatKelas.filter((t) => t !== tingkat)
        : [...prev.tingkatKelas, tingkat].sort();
      return { ...prev, tingkatKelas: next };
    });
  };

  const handleResetToStandard = () => {
    showFeedbackModal({
      type: 'warning',
      title: 'Inisialisasi Standar Kurikulum?',
      message: 'Muat ulang 12 daftar mata pelajaran standar Kurikulum Nasional? Konfigurasi mapel saat ini akan digantikan dengan standar resmi.',
      confirmText: 'Ya, Inisialisasi',
      cancelText: 'Batal',
      onConfirm: () => {
        resetMapelToDefault();
        showToast('success', 'Kurikulum Diinisialisasi!', '12 mata pelajaran standar nasional berhasil dimuat ke sistem.');
      }
    });
  };

  const handleOpenDeleteAll = () => {
    if (mapels.length === 0) {
      showToast('warning', 'Data Mapel Kosong', 'Tidak ada data mata pelajaran yang tersimpan di sistem.');
      return;
    }

    showFeedbackModal({
      type: 'warning',
      title: 'Hapus Seluruh Mata Pelajaran?',
      message: `PERINGATAN: Anda akan menghapus seluruh (${mapels.length}) data mata pelajaran dari sistem dan database Supabase Cloud. Tindakan ini tidak dapat dibatalkan. Lanjutkan?`,
      confirmText: `Ya, Hapus Semua (${mapels.length} Mapel)`,
      cancelText: 'Batalkan',
      onConfirm: async () => {
        try {
          const count = mapels.length;
          deleteAllMapel();
          showToast('success', 'Data Mapel Dihapus', `Seluruh mata pelajaran (${count} mapel) berhasil dibersihkan.`);
          await syncWithSupabase(true);
        } catch (err: any) {
          showToast('error', 'Gagal Menghapus', err.message || 'Terjadi kesalahan sistem.');
        }
      }
    });
  };

  // Stats
  const totalMapel = mapels.length;
  const umumMapel = mapels.filter((m) => m.kategori === 'Umum').length;
  const muatanLokalMapel = mapels.filter((m) => m.kategori === 'Muatan Lokal' || m.kategori === 'Pilihan').length;
  const avgKkm =
    mapels.length > 0
      ? Math.round(
          mapels.reduce((acc, m) => acc + (m.kkm ?? schoolSettings.kkmDefault ?? 75), 0) / mapels.length
        )
      : schoolSettings.kkmDefault || 75;

  return (
    <div className="space-y-6">
      <PrintHeader
        title="DAFTAR MATA PELAJARAN & STRUKTUR KURIKULUM"
        subtitle={`Kurikulum: ${schoolSettings.curriculum} | Tahun Ajaran: ${schoolSettings.academicYear}`}
      />

      {/* Screen Header Controls with PageHeader */}
      <div className="no-print">
        <PageHeader
          title="Master Data Mata Pelajaran"
          subtitle="Kelola daftar mata pelajaran, kode kurikulum, kategori, tingkat kelas, dan standar KKTP/KKM."
          badge="Kurikulum Sekolah"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {mapels.length === 0 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  id="btn-seed-standard-mapel"
                  onClick={handleResetToStandard}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-xs cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span>Inisialisasi Standar Kurikulum</span>
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                id="btn-print-mapel"
                onClick={() =>
                  printWebDocument({
                    title: `Master Data Mata Pelajaran - ${schoolSettings.schoolName}`,
                    paperOrientation: 'portrait'
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Cetak Dokumen</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                id="btn-delete-all-mapel"
                onClick={handleOpenDeleteAll}
                disabled={mapels.length === 0}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 shadow-2xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Hapus seluruh mata pelajaran dari kurikulum sekolah dan database Supabase Cloud"
              >
                <Trash2 className="h-4 w-4 text-rose-600" />
                <span>Hapus Semua</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                id="btn-tambah-mapel"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 text-xs font-bold text-white hover:from-amber-700 hover:to-orange-700 transition shadow-md shadow-amber-200 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Mata Pelajaran</span>
              </motion.button>
            </div>
          }
          stats={[
            { label: 'Total Mata Pelajaran', value: `${totalMapel} Mapel`, helper: 'Terdaftar di kurikulum' },
            { label: 'Kelompok Umum', value: `${umumMapel} Mapel`, helper: 'Mata pelajaran inti' },
            { label: 'Mulok & Pilihan', value: `${muatanLokalMapel} Mapel`, helper: 'Muatan lokal & minat' },
            { label: 'Rata-rata KKTP / KKM', value: `${avgKkm}`, helper: `Standar: ${schoolSettings.kkmDefault}` }
          ]}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="no-print flex flex-col sm:flex-row gap-3 items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode atau nama mapel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-medium text-slate-500">Kategori:</span>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Umum">Umum (Wajib)</option>
            <option value="Pilihan">Pilihan</option>
            <option value="Muatan Lokal">Muatan Lokal</option>
            <option value="Kejuruan">Kejuruan</option>
          </select>

          {mapels.length > 0 && (
            <button
              type="button"
              onClick={handleResetToStandard}
              title="Reset kembali ke daftar standar kurikulum"
              className="text-[11px] text-slate-500 hover:text-indigo-600 underline ml-1 cursor-pointer"
            >
              Reset Standar
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      {filteredMapels.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {searchTerm || filterKategori !== 'Semua'
              ? 'Tidak Ada Mata Pelajaran yang Cocok'
              : 'Belum Ada Mata Pelajaran'}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            {searchTerm || filterKategori !== 'Semua'
              ? 'Silakan ubah filter pencarian atau kata kunci.'
              : 'Mata pelajaran belum ditambahkan. Klik tombol di bawah untuk menambah manual atau muat 12 mapel standar nasional.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Mata Pelajaran</span>
            </button>
            <button
              type="button"
              onClick={handleResetToStandard}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Inisialisasi Standar Kurikulum</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-12">No</th>
                  <th className="px-4 py-3 w-28">Kode Mapel</th>
                  <th className="px-4 py-3">Nama Mata Pelajaran</th>
                  <th className="px-4 py-3 w-32">Kategori</th>
                  <th className="px-4 py-3 w-36">Tingkat Kelas</th>
                  <th className="px-4 py-3 text-center w-24">KKTP / KKM</th>
                  <th className="px-4 py-3">Guru Pengampu</th>
                  <th className="no-print px-4 py-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMapels.map((m, idx) => {
                  const assignedTeachers = getTeachersForMapel(m.nama, m.kode);

                  const kategoriBadgeColor =
                    m.kategori === 'Umum'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : m.kategori === 'Muatan Lokal'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : m.kategori === 'Pilihan'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3 text-center font-medium text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-xs font-mono font-bold text-slate-800">
                          {m.kode}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div>{m.nama}</div>
                        {m.keterangan && (
                          <div className="text-[11px] font-normal text-slate-400 mt-0.5">
                            {m.keterangan}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${kategoriBadgeColor}`}
                        >
                          {m.kategori}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {m.tingkatKelas && m.tingkatKelas.length > 0 ? (
                            m.tingkatKelas.map((tk) => (
                              <span
                                key={tk}
                                className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700"
                              >
                                Kelas {tk}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[11px]">Semua Kelas</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-extrabold text-emerald-800">
                          {m.kkm ?? schoolSettings.kkmDefault ?? 75}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {assignedTeachers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedTeachers.map((g) => (
                              <span
                                key={g.id}
                                className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-800"
                                title={`NIP: ${g.nip || '-'}`}
                              >
                                <Users className="h-3 w-3 text-indigo-500" />
                                <span>{g.nama}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            Belum ada guru dialokasikan
                          </span>
                        )}
                      </td>
                      <td className="no-print px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(m)}
                            title="Edit Mata Pelajaran"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m)}
                            title="Hapus Mata Pelajaran"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Signature Footer */}
      <PrintSignatures />

      {/* Modal Form Tambah / Edit Mata Pelajaran */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-50 to-indigo-50/40">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  Definisikan kode, nama, dan parameter kurikulum mata pelajaran
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Mapel *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: MAT"
                    value={formData.kode}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Singkatan/Kode</span>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Mata Pelajaran *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Matematika"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Nama lengkap resmi</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori / Kelompok *
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value as MataPelajaran['kategori'] })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="Umum">Umum (Wajib Nasional)</option>
                    <option value="Pilihan">Pilihan / Peminatan</option>
                    <option value="Muatan Lokal">Muatan Lokal</option>
                    <option value="Kejuruan">Kejuruan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Standar KKM / KKTP *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={formData.kkm}
                    onChange={(e) => setFormData({ ...formData, kkm: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Nilai kriteria ketuntasan</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tingkat Kelas yang Mengikuti Mapel Ini
                </label>
                <div className="flex flex-wrap gap-2">
                  {['7', '8', '9', '10', '11', '12'].map((tingkat) => {
                    const selected = formData.tingkatKelas.includes(tingkat);
                    return (
                      <button
                        key={tingkat}
                        type="button"
                        onClick={() => handleToggleTingkat(tingkat)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
                          selected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
                        <span>Kelas {tingkat}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Klik untuk memilih jenjang kelas yang mempelajari mata pelajaran ini.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan / Ruang Lingkup (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="misal: Kelompok Mapel Wajib, Alokasi 4 JP/Minggu"
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-mapel-modal"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition cursor-pointer"
                >
                  {editingMapel ? 'Simpan Perubahan' : 'Tambah Mata Pelajaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
