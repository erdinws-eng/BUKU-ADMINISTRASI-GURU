import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Siswa } from '../../types';
import * as XLSX from 'xlsx';
import {
  Search,
  Plus,
  Printer,
  Edit2,
  Trash2,
  X,
  GraduationCap,
  FileSpreadsheet,
  Download,
  DownloadCloud,
  Users,
  Cloud,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { ImportExcelSiswaModal } from '../shared/ImportExcelSiswaModal';
import { printWebDocument } from '../../utils/printHelper';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';

export const MasterDataSiswa: React.FC = () => {
  const {
    currentUser,
    currentTeacher,
    siswas,
    jadwals,
    addSiswa,
    addSiswaBatch,
    updateSiswa,
    deleteSiswa,
    schoolSettings,
    supabaseSyncStatus,
    lastSyncedAt,
    syncWithSupabase,
    pullDataFromSupabase,
    showToast,
    showFeedbackModal
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  // Compute school classes dynamically
  const defaultSchoolClasses = ['7A', '7B', '8A', '8B', '9A', '9B'];
  const allSchoolClasses = Array.from(
    new Set([
      ...defaultSchoolClasses,
      ...siswas.map((s) => s.kelas),
      ...jadwals.map((j) => j.kelas)
    ].filter(Boolean))
  ).sort();

  const availableClasses = isAdmin
    ? allSchoolClasses
    : (currentTeacher?.kelasDiampu?.length ? currentTeacher.kelasDiampu : allSchoolClasses);

  const [selectedKelas, setSelectedKelas] = useState<string>(isAdmin ? 'SEMUA' : (availableClasses[0] || '7A'));
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);

  const [formData, setFormData] = useState({
    nisn: '',
    nama: '',
    gender: 'L' as 'L' | 'P',
    kelas: availableClasses[0] || '7A'
  });

  const classStudents = selectedKelas === 'SEMUA'
    ? siswas
    : siswas.filter((s) => s.kelas === selectedKelas);

  const filteredStudents = classStudents.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.nama.toLowerCase().includes(q) ||
      s.nisn.includes(q)
    );
  });

  const countL = classStudents.filter((s) => s.gender === 'L').length;
  const countP = classStudents.filter((s) => s.gender === 'P').length;

  const handleOpenAdd = () => {
    setEditingSiswa(null);
    setFormData({
      nisn: `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      nama: '',
      gender: 'L',
      kelas: selectedKelas === 'SEMUA' ? (availableClasses[0] || '7A') : selectedKelas
    });
    setShowModal(true);
  };

  const handleOpenEdit = (s: Siswa) => {
    setEditingSiswa(s);
    setFormData({
      nisn: s.nisn,
      nama: s.nama,
      gender: s.gender,
      kelas: s.kelas
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.nisn.trim()) {
      showToast('error', 'Data Belum Lengkap', 'Mohon lengkapi Nama Siswa dan NISN.');
      return;
    }

    if (editingSiswa) {
      updateSiswa(editingSiswa.id, {
        nisn: formData.nisn.trim(),
        nama: formData.nama.trim(),
        gender: formData.gender,
        kelas: formData.kelas
      });
      showToast('success', 'Data Siswa Diperbarui!', `Data ${formData.nama} disimpan & disinkronkan ke Supabase Cloud.`);
    } else {
      addSiswa({
        nisn: formData.nisn.trim(),
        nama: formData.nama.trim(),
        gender: formData.gender,
        kelas: formData.kelas,
        status: 'Aktif'
      });
      showToast('success', 'Siswa Berhasil Ditambahkan!', `${formData.nama} disimpan & disinkronkan ke Supabase Cloud.`);
    }

    setShowModal(false);
    // Langsung dorong ke Supabase
    setTimeout(() => {
      syncWithSupabase(true);
    }, 400);
  };

  const handleDelete = (id: string, nama: string) => {
    showFeedbackModal({
      type: 'warning',
      title: 'Hapus Peserta Didik?',
      message: `Data peserta didik "${nama}" akan dihapus dari data induk kesiswaan dan database Cloud.`,
      confirmText: 'Ya, Hapus Siswa',
      cancelText: 'Batal',
      onConfirm: () => {
        deleteSiswa(id);
        showToast('info', 'Siswa Dihapus', `Data ${nama} telah dihapus & disinkronkan ke Cloud.`);
        setTimeout(() => {
          syncWithSupabase(true);
        }, 400);
      }
    });
  };

  const handleExportExcel = () => {
    if (filteredStudents.length === 0) {
      showToast('warning', 'Tidak Ada Data', 'Tidak ada data siswa untuk diekspor.');
      return;
    }

    const exportRows = filteredStudents.map((s, idx) => ({
      'NO': idx + 1,
      'NISN': s.nisn,
      'Nama Siswa': s.nama,
      'Jenis Kelamin': s.gender,
      'Kelas': s.kelas
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet['!cols'] = [
      { wch: 6 },  // NO
      { wch: 18 }, // NISN
      { wch: 32 }, // Nama Siswa
      { wch: 16 }, // Jenis Kelamin
      { wch: 12 }  // Kelas
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

    const fileName = `Data_Siswa_${selectedKelas === 'SEMUA' ? 'Semua_Kelas' : `Kelas_${selectedKelas}`}_${schoolSettings.academicYear.replace(/[/\\?%*:|"<>]/g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    showToast('success', 'Excel Berhasil Diunduh!', `${exportRows.length} data siswa diekspor ke ${fileName}.`);
  };

  return (
    <div className="space-y-6">
      <PrintHeader
        title={selectedKelas === 'SEMUA' ? 'BUKU INDUK & DAFTAR PESERTA DIDIK (SEMUA KELAS)' : `BUKU INDUK & DAFTAR PESERTA DIDIK KELAS ${selectedKelas}`}
        subtitle={`${isAdmin ? 'Administrator Sekolah / Pengelola Kesiswaan' : `Wali Kelas / Guru Pengampu: ${currentTeacher?.nama}, ${currentTeacher?.gelar || ''}`} | Tahun Ajaran ${schoolSettings.academicYear}`}
      />

      {/* Screen Controls with PageHeader */}
      <div className="no-print">
        <PageHeader
          title="Master Data Siswa"
          subtitle="Daftar buku induk peserta didik, NISN, manajemen rombongan belajar, dan import data Excel."
          badge="Kesiswaan"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-sync-supabase-siswa"
                onClick={async () => {
                  showToast('info', 'Menyinkronkan...', 'Mengunggah data siswa ke Supabase Cloud...');
                  const ok = await syncWithSupabase(true);
                  if (ok) {
                    showToast('success', 'Tersinkron ke Supabase Cloud!', `Data ${siswas.length} siswa tersimpan di cloud Supabase.`);
                  } else {
                    showToast('error', 'Gagal Sinkron', 'Tidak dapat menghubungi Supabase. Cek koneksi internet.');
                  }
                }}
                disabled={supabaseSyncStatus === 'syncing'}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-xs transition cursor-pointer ${
                  supabaseSyncStatus === 'saved'
                    ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-100/80'
                    : supabaseSyncStatus === 'syncing'
                    ? 'border-blue-200 bg-blue-50 text-blue-700 animate-pulse'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
                title="Status sinkronisasi Supabase Cloud"
              >
                {supabaseSyncStatus === 'syncing' ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                ) : supabaseSyncStatus === 'saved' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Cloud className="h-4 w-4 text-slate-500" />
                )}
                <span>
                  {supabaseSyncStatus === 'syncing'
                    ? 'Menyimpan...'
                    : supabaseSyncStatus === 'saved'
                    ? 'Supabase Cloud: Tersimpan'
                    : 'Sinkron Supabase'}
                </span>
                {lastSyncedAt && <span className="text-[10px] text-emerald-600 opacity-75 font-mono">({lastSyncedAt})</span>}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-pull-supabase-siswa"
                onClick={async () => {
                  showToast('info', 'Mengunduh Data...', 'Menarik data siswa terbaru dari Supabase Cloud...');
                  const ok = await pullDataFromSupabase();
                  if (ok) {
                    showToast('success', 'Data Diperbarui!', 'Data siswa dari Supabase Cloud berhasil diselaraskan ke browser ini.');
                  } else {
                    showToast('error', 'Gagal Menarik Data', 'Data di Supabase masih kosong atau koneksi gagal.');
                  }
                }}
                disabled={supabaseSyncStatus === 'syncing'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100/80 shadow-xs transition cursor-pointer"
                title="Tarik data siswa dari database Supabase Cloud (Berguna saat membuka di domain Vercel)"
              >
                <DownloadCloud className="h-4 w-4 text-blue-600" />
                <span>Tarik dari Cloud</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-import-excel-siswa"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500 bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition cursor-pointer"
                title="Impor data siswa massal wajib dari berkas Microsoft Excel (.xlsx / .xls)"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-100" />
                <span>Import Excel</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-export-excel-siswa"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
                title="Unduh daftar siswa saat ini ke dalam berkas Excel .xlsx"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export Excel</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-print-siswa"
                onClick={() => printWebDocument({ title: selectedKelas === 'SEMUA' ? 'Daftar Siswa Semua Kelas' : `Daftar Siswa Kelas ${selectedKelas}` })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span className="hidden sm:inline">Cetak Daftar Siswa</span>
                <span className="sm:hidden">Cetak</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-add-siswa"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:from-teal-700 hover:to-emerald-800 shadow-xs transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Siswa</span>
              </motion.button>
            </div>
          }
          stats={[
            { label: 'Total Peserta Didik', value: `${classStudents.length} Siswa`, helper: selectedKelas === 'SEMUA' ? 'Semua rombel' : `Kelas ${selectedKelas}` },
            { label: 'Siswa Laki-laki (L)', value: `${countL} Siswa`, helper: `${Math.round((countL / (classStudents.length || 1)) * 100)}% komposisi` },
            { label: 'Siswa Perempuan (P)', value: `${countP} Siswa`, helper: `${Math.round((countP / (classStudents.length || 1)) * 100)}% komposisi` },
            { label: 'Rombel Aktif', value: selectedKelas === 'SEMUA' ? 'Semua Kelas' : `Kelas ${selectedKelas}`, helper: 'Filter aktif' }
          ]}
        />
      </div>

      {/* Filter and search bar */}
      <div className="no-print flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 mr-2">Pilih Kelas:</label>
            <select
              id="select-kelas-siswa"
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-bold focus:border-emerald-500 focus:outline-none shadow-2xs"
            >
              <option value="SEMUA">Semua Kelas ({siswas.length} Siswa)</option>
              {availableClasses.map((k) => {
                const totalInK = siswas.filter((s) => s.kelas === k).length;
                return (
                  <option key={k} value={k}>
                    Kelas {k} ({totalInK} Siswa)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama / NISN / NIS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none w-56 sm:w-64"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Menampilkan <strong>{filteredStudents.length}</strong> dari <strong>{classStudents.length}</strong> siswa</span>
        </div>
      </div>

      {/* Student Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
              <tr>
                <th className="px-4 py-3.5 text-center w-12">No</th>
                <th className="px-4 py-3.5 w-36">NISN</th>
                <th className="px-4 py-3.5">Nama Lengkap Siswa</th>
                <th className="px-4 py-3.5 text-center w-24">Kelas</th>
                <th className="px-4 py-3.5 text-center w-28">L/P</th>
                <th className="no-print px-4 py-3.5 text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="font-bold text-slate-700">Tidak ada data siswa ditemukan</p>
                      <p className="text-slate-500 max-w-sm">
                        {searchTerm ? 'Coba ganti kata kunci pencarian Anda.' : `Belum ada data siswa untuk ${selectedKelas === 'SEMUA' ? 'seluruh rombel' : `kelas ${selectedKelas}`}.`}
                      </p>
                      {!searchTerm && (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => setShowImportModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            <span>Import dari Excel</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tambah Manual</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((siswa, index) => (
                  <tr key={siswa.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {siswa.nisn}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900">{siswa.nama}</span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                        {siswa.kelas.startsWith('Kelas') ? siswa.kelas : `Kelas ${siswa.kelas}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          siswa.gender === 'L'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-pink-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {siswa.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="no-print px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(siswa)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
                          title="Ubah Siswa"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(siswa.id, siswa.nama)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          title="Hapus Siswa"
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

      {/* Modal Add/Edit Siswa */}
      {showModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {editingSiswa ? 'Ubah Data Peserta Didik' : 'Tambah Peserta Didik Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap sesuai akta / raport"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">NISN *</label>
                <input
                  type="text"
                  required
                  placeholder="10 digit NISN"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Jenis Kelamin *</label>
                  <div className="flex gap-4 pt-1.5">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="gender"
                        value="L"
                        checked={formData.gender === 'L'}
                        onChange={() => setFormData({ ...formData, gender: 'L' })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Laki-laki (L)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="gender"
                        value="P"
                        checked={formData.gender === 'P'}
                        onChange={() => setFormData({ ...formData, gender: 'P' })}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Perempuan (P)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Kelas / Rombel *</label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    {availableClasses.map((k) => (
                      <option key={k} value={k}>
                        Kelas {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-xs transition cursor-pointer"
                >
                  {editingSiswa ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ImportExcelSiswaModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        defaultKelas={selectedKelas}
        availableClasses={availableClasses}
        onApply={(siswaList, replaceForClass) => {
          addSiswaBatch(siswaList, replaceForClass);
          showToast('success', 'Import Berhasil!', `${siswaList.length} data siswa berhasil disimpan & disinkronkan ke Supabase Cloud.`);
          setTimeout(() => {
            syncWithSupabase(true);
          }, 400);
        }}
      />
    </div>
  );
};
