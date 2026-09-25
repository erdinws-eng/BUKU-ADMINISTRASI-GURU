import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { JurnalMengajar as IJurnal } from '../../types';
import {
  BookOpenCheck,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  X
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { printWebDocument } from '../../utils/printHelper';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';

export const JurnalMengajar: React.FC = () => {
  const {
    currentTeacher,
    jurnals,
    addJurnal,
    updateJurnal,
    deleteJurnal,
    siswas,
    showToast,
    showFeedbackModal,
    quickTargetSchedule,
    setQuickTargetSchedule
  } = useApp();

  const [filterKelas, setFilterKelas] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingJurnal, setEditingJurnal] = useState<IJurnal | null>(null);
  const [isAutoFilledFromSchedule, setIsAutoFilledFromSchedule] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    jamKe: '1 - 2',
    kelas: currentTeacher?.kelasDiampu[0] || '7A',
    mapel: currentTeacher?.mapel || 'Matematika',
    babOrTujuan: '',
    kegiatanPembelajaran: '',
    hambatanCatatan: '',
    jumlahHadir: 8,
    totalSiswa: 8,
    status: 'Selesai' as IJurnal['status']
  });

  // Otomatisasi: ketika diklik dari tombol Jadwal Mengajar / Dashboard, langsung mengisi kelas, jam, mapel, dan buka formulir
  useEffect(() => {
    if (quickTargetSchedule) {
      setEditingJurnal(null);
      const targetClass = quickTargetSchedule.kelas;
      const targetCount = siswas.filter((s) => s.kelas === targetClass).length || 8;
      setFormData({
        tanggal: new Date().toISOString().slice(0, 10),
        jamKe: quickTargetSchedule.jamKe || '1 - 2',
        kelas: targetClass,
        mapel: quickTargetSchedule.mapel || currentTeacher?.mapel || 'Matematika',
        babOrTujuan: '',
        kegiatanPembelajaran: '',
        hambatanCatatan: '',
        jumlahHadir: targetCount,
        totalSiswa: targetCount,
        status: 'Selesai'
      });
      setFilterKelas(targetClass);
      setIsAutoFilledFromSchedule(true);
      setShowModal(true);
      showToast(
        'success',
        `Jurnal Kelas ${targetClass} Terisi Otomatis!`,
        `Kelas ${targetClass} (${quickTargetSchedule.mapel}) Jam ${quickTargetSchedule.jamKe} sudah terisi. Guru tinggal mengisi materi dan kegiatan pembelajaran.`
      );
      setQuickTargetSchedule(null);
    }
  }, [quickTargetSchedule, siswas, currentTeacher]);

  const teacherJurnals = jurnals.filter((j) => j.guruId === currentTeacher?.id);

  // Digital Jam Ke- (1 - 10) helper
  const parseDigitalJam = (val: string) => {
    const raw = (val || '1 - 2').trim();
    const parts = raw.split('-').map((p) => parseInt(p.trim(), 10));
    const start = !isNaN(parts[0]) && parts[0] >= 1 && parts[0] <= 10 ? parts[0] : 1;
    const end = parts.length > 1 && !isNaN(parts[1]) && parts[1] >= 1 && parts[1] <= 10 ? parts[1] : start;
    return { start, end };
  };

  const digitalJam = parseDigitalJam(formData.jamKe);

  const handleDigitalJamChange = (newStart: number, newEnd: number) => {
    const validStart = Math.min(10, Math.max(1, newStart));
    const validEnd = Math.min(10, Math.max(1, newEnd));
    const newJamKe = validStart === validEnd ? `${validStart}` : validStart < validEnd ? `${validStart} - ${validEnd}` : `${validEnd} - ${validStart}`;
    setFormData({ ...formData, jamKe: newJamKe });
  };

  const filteredJurnals = teacherJurnals.filter((j) => {
    const matchKelas = filterKelas === 'Semua' || j.kelas === filterKelas;
    const matchSearch =
      j.babOrTujuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.kegiatanPembelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.hambatanCatatan.toLowerCase().includes(searchTerm.toLowerCase());
    return matchKelas && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingJurnal(null);
    setIsAutoFilledFromSchedule(false);
    const defaultKelas = currentTeacher?.kelasDiampu[0] || '7A';
    const totalCount = siswas.filter((s) => s.kelas === defaultKelas).length || 8;
    setFormData({
      tanggal: new Date().toISOString().slice(0, 10),
      jamKe: '1 - 2',
      kelas: defaultKelas,
      mapel: currentTeacher?.mapel || 'Matematika',
      babOrTujuan: '',
      kegiatanPembelajaran: '',
      hambatanCatatan: '',
      jumlahHadir: totalCount,
      totalSiswa: totalCount,
      status: 'Selesai'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (j: IJurnal) => {
    setEditingJurnal(j);
    setIsAutoFilledFromSchedule(false);
    setFormData({
      tanggal: j.tanggal,
      jamKe: j.jamKe,
      kelas: j.kelas,
      mapel: j.mapel,
      babOrTujuan: j.babOrTujuan,
      kegiatanPembelajaran: j.kegiatanPembelajaran,
      hambatanCatatan: j.hambatanCatatan,
      jumlahHadir: j.jumlahHadir,
      totalSiswa: j.totalSiswa,
      status: j.status
    });
    setShowModal(true);
  };

  const handleClassChange = (selectedClass: string) => {
    const count = siswas.filter((s) => s.kelas === selectedClass).length || 8;
    setFormData((prev) => ({
      ...prev,
      kelas: selectedClass,
      totalSiswa: count,
      jumlahHadir: count
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.babOrTujuan.trim() || !formData.kegiatanPembelajaran.trim()) {
      showToast('warning', 'Data Belum Lengkap', 'Mohon lengkapi Bab/Tujuan Pembelajaran dan Uraian Kegiatan.');
      return;
    }

    if (editingJurnal) {
      updateJurnal(editingJurnal.id, {
        tanggal: formData.tanggal,
        jamKe: formData.jamKe,
        kelas: formData.kelas,
        mapel: formData.mapel,
        babOrTujuan: formData.babOrTujuan,
        kegiatanPembelajaran: formData.kegiatanPembelajaran,
        hambatanCatatan: formData.hambatanCatatan,
        jumlahHadir: Number(formData.jumlahHadir),
        totalSiswa: Number(formData.totalSiswa),
        status: formData.status
      });
      showToast('success', 'Jurnal Berhasil Diperbarui!', `Agenda kelas ${formData.kelas} (${formData.tanggal}) telah diperbarui.`);
    } else {
      addJurnal({
        guruId: currentTeacher?.id || 'guru-1',
        tanggal: formData.tanggal,
        jamKe: formData.jamKe,
        kelas: formData.kelas,
        mapel: formData.mapel,
        babOrTujuan: formData.babOrTujuan,
        kegiatanPembelajaran: formData.kegiatanPembelajaran,
        hambatanCatatan: formData.hambatanCatatan,
        jumlahHadir: Number(formData.jumlahHadir),
        totalSiswa: Number(formData.totalSiswa),
        status: formData.status
      });
      showToast('success', 'Jurnal Berhasil Ditambahkan!', `Agenda pembelajaran kelas ${formData.kelas} telah tersimpan.`);
    }

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const target = jurnals.find((j) => j.id === id);
    showFeedbackModal({
      type: 'warning',
      title: 'Hapus Catatan Jurnal?',
      message: `Agenda kelas ${target?.kelas || ''} tanggal ${target?.tanggal || ''} akan dihapus dari buku jurnal.`,
      confirmText: 'Ya, Hapus Jurnal',
      cancelText: 'Batal',
      onConfirm: () => {
        deleteJurnal(id);
        showToast('info', 'Jurnal Dihapus', 'Baris catatan jurnal mengajar telah dihapus.');
      }
    });
  };

  const completedCount = teacherJurnals.filter((j) => j.status === 'Selesai').length;
  const pendingCount = teacherJurnals.filter((j) => j.status === 'Tertunda').length;

  return (
    <div className="space-y-6">
      <PrintHeader
        title="BUKU JURNAL & AGENDA PEMBELAJARAN GURU"
        subtitle={`Mata Pelajaran: ${currentTeacher?.mapel} | Guru: ${currentTeacher?.nama}, ${currentTeacher?.gelar}`}
      />

      {/* Screen Header Controls with PageHeader */}
      <div className="no-print">
        <PageHeader
          title="Jurnal Mengajar Harian"
          subtitle="Catatan agenda kegiatan tatap muka, materi ajar, kehadiran siswa, dan tindak lanjut pembelajaran."
          badge="Kegiatan Belajar"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-print-jurnal"
                onClick={() => printWebDocument({ title: `Jurnal Mengajar Guru - ${currentTeacher?.nama || 'Guru'}` })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Cetak Buku Jurnal</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-add-jurnal"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:from-sky-700 hover:to-blue-700 shadow-md shadow-sky-200 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Isi Jurnal Baru</span>
              </motion.button>
            </div>
          }
          stats={[
            { label: 'Total Sesi Pertemuan', value: `${teacherJurnals.length} Kali`, helper: 'Tatap muka terdata' },
            { label: 'Agenda Selesai', value: `${completedCount} Sesi`, helper: 'Tercapai tuntas' },
            { label: 'Kendala / Ditunda', value: `${pendingCount} Sesi`, helper: pendingCount > 0 ? 'Perlu jam tambahan' : 'Nihil' },
            { label: 'Kelas Diampu', value: `${currentTeacher?.kelasDiampu.length || 0} Rombel`, helper: currentTeacher?.kelasDiampu.join(', ') || '-' }
          ]}
        />
      </div>

      {/* Filter and Search */}
      <div className="no-print flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="input-search-jurnal"
            type="text"
            placeholder="Cari materi pokok, tujuan pembelajaran, atau kegiatan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 shrink-0">Filter Kelas:</label>
          <select
            id="select-filter-kelas-jurnal"
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:bg-white focus:outline-none"
          >
            <option value="Semua">Semua Kelas ({teacherJurnals.length})</option>
            {(currentTeacher?.kelasDiampu || []).map((k) => (
              <option key={k} value={k}>
                Kelas {k}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jurnal Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-3.5 py-3 text-center">No</th>
                <th className="px-3.5 py-3">Hari / Tgl / Jam</th>
                <th className="px-3.5 py-3 text-center">Kelas</th>
                <th className="px-3.5 py-3">Tujuan / Materi Pokok</th>
                <th className="px-3.5 py-3">Kegiatan Pembelajaran</th>
                <th className="px-3.5 py-3">Catatan / Hambatan</th>
                <th className="px-3.5 py-3 text-center">Kehadiran</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="no-print px-3.5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredJurnals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    Belum ada rekaman jurnal mengajar untuk kriteria yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredJurnals.map((jurnal, index) => (
                  <tr key={jurnal.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3.5 py-3 text-center font-semibold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{jurnal.tanggal}</div>
                      <div className="text-[11px] text-slate-500">Jam Ke: {jurnal.jamKe}</div>
                    </td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                        {jurnal.kelas}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 min-w-[180px]">
                      <p className="font-semibold text-slate-800">{jurnal.babOrTujuan}</p>
                    </td>
                    <td className="px-3.5 py-3 min-w-[240px] text-slate-600">
                      <p className="line-clamp-3">{jurnal.kegiatanPembelajaran}</p>
                    </td>
                    <td className="px-3.5 py-3 min-w-[160px] text-slate-500 italic">
                      {jurnal.hambatanCatatan || '-'}
                    </td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <span className="font-semibold text-slate-800">
                        {jurnal.jumlahHadir}/{jurnal.totalSiswa}
                      </span>
                      <span className="block text-[10px] text-emerald-600">
                        ({Math.round((jurnal.jumlahHadir / (jurnal.totalSiswa || 1)) * 100)}%)
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          jurnal.status === 'Selesai'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : jurnal.status === 'Tertunda'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {jurnal.status}
                      </span>
                    </td>
                    <td className="no-print px-3.5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`btn-edit-jurnal-${jurnal.id}`}
                          onClick={() => handleOpenEdit(jurnal)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition"
                          title="Ubah Jurnal"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          id={`btn-delete-jurnal-${jurnal.id}`}
                          onClick={() => handleDelete(jurnal.id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Hapus Jurnal"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  {editingJurnal ? 'Ubah Catatan Jurnal Mengajar' : 'Isi Jurnal Mengajar Baru'}
                </h3>
                {isAutoFilledFromSchedule && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    <Sparkles className="h-3 w-3 text-emerald-600" /> Otomatis Jadwal
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isAutoFilledFromSchedule && (
              <div className="bg-emerald-50/90 border-b border-emerald-100 px-5 py-2 text-xs text-emerald-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Kelas {formData.kelas} ({formData.mapel}) - Jam {formData.jamKe}</strong> terisi otomatis. Anda tinggal mengisi materi dan kegiatan di bawah ini.
                </span>
              </div>
            )}

            <form onSubmit={handleSave} className="p-5 space-y-3.5 max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Tanggal Tatap Muka</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Jam Ke-</label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                      Jam {formData.jamKe || '1 - 2'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <select
                        id="select-jurnal-jam-mulai"
                        value={digitalJam.start}
                        onChange={(e) => handleDigitalJamChange(Number(e.target.value), digitalJam.end)}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-mono font-bold text-slate-800 text-center focus:border-emerald-500 focus:outline-none cursor-pointer"
                        title="Pilih Jam Pelajaran Mulai (1 - 10)"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={`jurnal-jam-start-${num}`} value={num}>
                            Jam {num}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-xs font-bold text-slate-400">s/d</span>
                    <div className="relative flex-1">
                      <select
                        id="select-jurnal-jam-selesai"
                        value={digitalJam.end}
                        onChange={(e) => handleDigitalJamChange(digitalJam.start, Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-mono font-bold text-slate-800 text-center focus:border-emerald-500 focus:outline-none cursor-pointer"
                        title="Pilih Jam Pelajaran Selesai (1 - 10)"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <option key={`jurnal-jam-end-${num}`} value={num}>
                            Jam {num}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Kelas</label>
                  <select
                    value={formData.kelas}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    {(currentTeacher?.kelasDiampu || ['7A']).map((k) => (
                      <option key={k} value={k}>
                        Kelas {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Bab / Capaian / Tujuan Pembelajaran (TP) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bab 1 Bilangan Bulat (Operasi Perkalian & Pembagian Bertanda)"
                  value={formData.babOrTujuan}
                  onChange={(e) => setFormData({ ...formData, babOrTujuan: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Uraian Kegiatan Pembelajaran (Apersepsi, Inti, Evaluasi) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan langkah pembelajaran, diskusi kelompok, praktikum, atau latihan soal yang dilaksanakan..."
                  value={formData.kegiatanPembelajaran}
                  onChange={(e) => setFormData({ ...formData, kegiatanPembelajaran: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Catatan Hambatan & Tindak Lanjut
                </label>
                <textarea
                  rows={2}
                  placeholder="Hambatan peserta didik, remedial yang perlu diberikan, atau kondisi khusus..."
                  value={formData.hambatanCatatan}
                  onChange={(e) => setFormData({ ...formData, hambatanCatatan: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Siswa Hadir</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.jumlahHadir}
                    onChange={(e) => setFormData({ ...formData, jumlahHadir: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Total Siswa</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.totalSiswa}
                    onChange={(e) => setFormData({ ...formData, totalSiswa: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Status KBM</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Selesai">Selesai</option>
                    <option value="Tertunda">Tertunda</option>
                    <option value="Daring/Penugasan">Daring / Penugasan</option>
                  </select>
                </div>
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
                  id="btn-save-jurnal"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  {editingJurnal ? 'Simpan Perubahan' : 'Simpan Jurnal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
