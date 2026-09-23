import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Guru } from '../../types';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  X,
  Check,
  BookOpen,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { ImportExcelGuruModal } from '../shared/ImportExcelGuruModal';
import { printWebDocument } from '../../utils/printHelper';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';

export const MasterDataGuru: React.FC = () => {
  const {
    gurus,
    addGuru,
    addGuruBatch,
    updateGuru,
    deleteGuru,
    jadwals,
    mapels,
    showToast,
    showFeedbackModal
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMapel, setFilterMapel] = useState('Semua');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    gelar: 'S.Pd',
    email: '',
    phone: '',
    mapel: '',
    kelasDiampu: '7A, 7B',
    statusKepegawaian: 'PNS' as Guru['statusKepegawaian'],
    statusAktif: true,
    alamat: ''
  });

  // Multiple subjects support
  const [selectedMapels, setSelectedMapels] = useState<string[]>([]);
  const [customMapelInput, setCustomMapelInput] = useState('');

  // Master available subjects for selection (from master mapels + any already in gurus)
  const masterMapelNames = mapels.map((m) => m.nama);
  const existingGuruMapels = gurus.flatMap((g) =>
    g.mapelList && g.mapelList.length > 0
      ? g.mapelList
      : g.mapel.split(',').map((x) => x.trim()).filter(Boolean)
  );
  const availableMasterMapels = Array.from(new Set([...masterMapelNames, ...existingGuruMapels])).filter(
    (m) => m && m !== 'Mata Pelajaran'
  );

  const availableMapels = Array.from(
    new Set([
      ...gurus.flatMap((g) =>
        g.mapelList && g.mapelList.length > 0
          ? g.mapelList
          : g.mapel.split(',').map((x) => x.trim()).filter(Boolean)
      ),
      ...mapels.map((m) => m.nama)
    ])
  ).filter(Boolean);

  const filteredGurus = gurus.filter((g) => {
    const guruMapels =
      g.mapelList && g.mapelList.length > 0
        ? g.mapelList
        : g.mapel.split(',').map((x) => x.trim()).filter(Boolean);
    const matchSearch =
      g.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.nip.includes(searchTerm) ||
      guruMapels.some((m) => m.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchMapel = filterMapel === 'Semua' || guruMapels.includes(filterMapel);
    return matchSearch && matchMapel;
  });

  const handleToggleMapel = (mapelName: string) => {
    const trimmed = mapelName.trim();
    if (!trimmed) return;
    setSelectedMapels((prev) => {
      const exists = prev.includes(trimmed);
      const next = exists ? prev.filter((m) => m !== trimmed) : [...prev, trimmed];
      setFormData((f) => ({ ...f, mapel: next.join(', ') }));
      return next;
    });
  };

  const handleAddCustomMapel = () => {
    const trimmed = customMapelInput.trim();
    if (!trimmed) return;
    if (!selectedMapels.includes(trimmed)) {
      setSelectedMapels((prev) => {
        const next = [...prev, trimmed];
        setFormData((f) => ({ ...f, mapel: next.join(', ') }));
        return next;
      });
    }
    setCustomMapelInput('');
  };

  const handleOpenAdd = () => {
    setEditingGuru(null);
    setSelectedMapels([]);
    setCustomMapelInput('');
    setFormData({
      nip: '',
      nama: '',
      gelar: 'S.Pd',
      email: '',
      phone: '',
      mapel: '',
      kelasDiampu: '7A, 7B',
      statusKepegawaian: 'PNS',
      statusAktif: true,
      alamat: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (guru: Guru) => {
    setEditingGuru(guru);
    const initialList =
      guru.mapelList && guru.mapelList.length > 0
        ? guru.mapelList
        : guru.mapel
        ? guru.mapel.split(',').map((x) => x.trim()).filter(Boolean)
        : [];
    setSelectedMapels(initialList);
    setCustomMapelInput('');
    setFormData({
      nip: guru.nip,
      nama: guru.nama,
      gelar: guru.gelar,
      email: guru.email,
      phone: guru.phone,
      mapel: initialList.join(', ') || guru.mapel,
      kelasDiampu: guru.kelasDiampu.join(', '),
      statusKepegawaian: guru.statusKepegawaian,
      statusAktif: guru.statusAktif,
      alamat: guru.alamat || ''
    });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      alert('Mohon isi nama lengkap guru.');
      return;
    }

    if (selectedMapels.length === 0) {
      alert('Mohon pilih minimal 1 mata pelajaran yang diampu oleh guru ini.');
      return;
    }

    const mapelString = selectedMapels.join(', ');

    const parsedKelas = formData.kelasDiampu
      .split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    if (editingGuru) {
      updateGuru(editingGuru.id, {
        nip: formData.nip.trim(),
        nama: formData.nama.trim(),
        gelar: formData.gelar.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        mapel: mapelString,
        mapelList: selectedMapels,
        kelasDiampu: parsedKelas,
        statusKepegawaian: formData.statusKepegawaian,
        statusAktif: formData.statusAktif,
        alamat: formData.alamat.trim()
      });
      showToast('success', 'Data Guru Diperbarui!', `Pembaruan data ${formData.nama}, ${formData.gelar} berhasil disimpan.`);
    } else {
      addGuru({
        nip: formData.nip.trim(),
        nama: formData.nama.trim(),
        gelar: formData.gelar.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        mapel: mapelString,
        mapelList: selectedMapels,
        kelasDiampu: parsedKelas,
        statusKepegawaian: formData.statusKepegawaian,
        statusAktif: formData.statusAktif,
        alamat: formData.alamat.trim()
      });
      showToast('success', 'Guru Baru Ditambahkan!', `${formData.nama}, ${formData.gelar} (${mapelString}) berhasil disimpan.`);
    }

    setShowModal(false);
  };

  const handleDelete = (guru: Guru) => {
    showFeedbackModal({
      type: 'warning',
      title: 'Hapus Data Guru?',
      message: `Data guru ${guru.nama}, ${guru.gelar} (${guru.mapel}) akan dihapus secara permanen dari sistem.`,
      confirmText: 'Ya, Hapus Data Guru',
      cancelText: 'Batal',
      onConfirm: () => {
        deleteGuru(guru.id);
        showToast('info', 'Data Guru Dihapus', `${guru.nama} telah dihapus dari sistem.`);
      }
    });
  };

  const pnsCount = gurus.filter((g) => g.statusKepegawaian === 'PNS' || g.statusKepegawaian === 'PPPK').length;
  const honorerCount = gurus.filter((g) => g.statusKepegawaian === 'Honor Sekolah' || g.statusKepegawaian === 'GTT').length;
  const activeCount = gurus.filter((g) => g.statusAktif).length;

  return (
    <div className="space-y-6">
      <PrintHeader
        title="DAFTAR TENAGA PENDIDIK & GURU MAPEL"
        subtitle="Data Induk Guru dan Beban Mengajar"
      />

      {/* Screen Header Controls with PageHeader */}
      <div className="no-print">
        <PageHeader
          title="Master Data Guru"
          subtitle="Kelola data pendidik, NIP, mata pelajaran, status kepegawaian, dan kelas binaan."
          badge="Manajemen Data"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-import-excel-guru"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 shadow-2xs transition cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                <span>Import Excel</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-print-guru"
                onClick={() => printWebDocument({ title: 'Daftar Pendidik dan Tenaga Kependidikan', paperOrientation: 'landscape' })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Cetak Data Guru</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-add-guru"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-3.5 py-2 text-xs font-bold text-white hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-200 transition cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Tambah Guru Baru</span>
              </motion.button>
            </div>
          }
          stats={[
            { label: 'Total Pendidik', value: `${gurus.length} Guru`, helper: 'Tenaga edukator terdaftar' },
            { label: 'PNS & PPPK', value: `${pnsCount} Orang`, helper: `${Math.round((pnsCount / (gurus.length || 1)) * 100)}% dari total guru` },
            { label: 'Honorer / GTT', value: `${honorerCount} Orang`, helper: 'Guru tidak tetap' },
            { label: 'Status Aktif', value: `${activeCount} Aktif`, helper: `${gurus.length - activeCount} Cuti / Nonaktif` }
          ]}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="no-print flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id="input-search-guru"
            type="text"
            placeholder="Cari berdasarkan nama, NIP, atau mata pelajaran..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 shrink-0">Mapel:</label>
          <select
            id="select-filter-mapel"
            value={filterMapel}
            onChange={(e) => setFilterMapel(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none"
          >
            <option value="Semua">Semua Mapel ({gurus.length})</option>
            {availableMapels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Guru Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama & Gelar</th>
                <th className="px-4 py-3">NIP / NUPTK</th>
                <th className="px-4 py-3">Mata Pelajaran</th>
                <th className="px-4 py-3">Kelas Diampu</th>
                <th className="px-4 py-3">Kepegawaian</th>
                <th className="px-4 py-3">Status</th>
                <th className="no-print px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredGurus.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    Tidak ada data guru yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredGurus.map((guru, index) => {
                  const teachingCount = jadwals.filter((j) => j.guruId === guru.id).length;
                  return (
                    <tr key={guru.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-semibold text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">
                          {guru.nama}, {guru.gelar}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {guru.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {guru.nip || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(guru.mapelList && guru.mapelList.length > 0
                            ? guru.mapelList
                            : guru.mapel.split(',').map((x) => x.trim()).filter(Boolean)
                          ).map((m, mIdx) => (
                            <span
                              key={mIdx}
                              className="inline-flex items-center font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 text-[11px]"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {guru.kelasDiampu.map((k) => (
                            <span
                              key={k}
                              className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          {teachingCount} sesi jadwal mingguan
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {guru.statusKepegawaian}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {guru.statusAktif ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <XCircle className="h-3.5 w-3.5" />
                            Non-Aktif
                          </span>
                        )}
                      </td>
                      <td className="no-print px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`btn-edit-guru-${guru.id}`}
                            onClick={() => handleOpenEdit(guru)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition"
                            title="Ubah Data Guru"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            id={`btn-delete-guru-${guru.id}`}
                            onClick={() => handleDelete(guru)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                            title="Hapus Data Guru"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Signatures */}
      <PrintSignatures />

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-800">
                {editingGuru ? 'Ubah Data Guru' : 'Tambah Guru Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: Siti Rahmawati"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Gelar</label>
                  <input
                    type="text"
                    placeholder="S.Pd, M.Pd"
                    value={formData.gelar}
                    onChange={(e) => setFormData({ ...formData, gelar: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">NIP / NUPTK</label>
                <input
                  type="text"
                  placeholder="19840715 200902 2 003"
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Multi-Subject Selection */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Mata Pelajaran yang Diampu <span className="text-rose-500">*</span>
                    <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                      (Bisa pilih lebih dari 1 mata pelajaran)
                    </span>
                  </label>
                  {selectedMapels.length > 0 && (
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200">
                      {selectedMapels.length} Mapel Terpilih
                    </span>
                  )}
                </div>

                {/* List of currently selected subjects */}
                {selectedMapels.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-indigo-100 rounded-xl shadow-2xs">
                    {selectedMapels.map((m) => (
                      <span
                        key={m}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white px-2.5 py-1 text-xs font-semibold shadow-xs"
                      >
                        <BookOpen className="h-3 w-3 text-indigo-200" />
                        <span>{m}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleMapel(m)}
                          className="rounded hover:bg-indigo-700 p-0.5 ml-0.5 cursor-pointer text-indigo-200 hover:text-white"
                          title="Hapus pilihan"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-1.5">
                    <span className="font-semibold">Belum ada mapel dipilih.</span> Silakan klik tombol mata pelajaran di bawah untuk memilih.
                  </div>
                )}

                {/* Subject selection pills from Master Data Mapel */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Klik untuk memilih / membatalkan mata pelajaran:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-white">
                    {availableMasterMapels.map((m) => {
                      const isSelected = selectedMapels.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleToggleMapel(m)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          {isSelected ? (
                            <Check className="h-3 w-3 text-white stroke-[3]" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          )}
                          <span>{m}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input for other / custom subjects */}
                <div className="pt-1">
                  <span className="text-[11px] font-medium text-slate-500 block mb-1">
                    Atau ketik mata pelajaran baru jika tidak ada di daftar:
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="misal: Bahasa Sunda, Robotika, dsb..."
                      value={customMapelInput}
                      onChange={(e) => setCustomMapelInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomMapel();
                        }
                      }}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomMapel}
                      className="rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                    >
                      + Tambahkan
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Kelas yang Diampu (pisahkan koma)
                </label>
                <input
                  type="text"
                  placeholder="misal: 7A, 7B, 8A"
                  value={formData.kelasDiampu}
                  onChange={(e) => setFormData({ ...formData, kelasDiampu: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Status Kepegawaian</label>
                  <select
                    value={formData.statusKepegawaian}
                    onChange={(e) => setFormData({ ...formData, statusKepegawaian: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="PNS">PNS</option>
                    <option value="PPPK">PPPK</option>
                    <option value="GTT">GTT (Guru Tidak Tetap)</option>
                    <option value="Honor Sekolah">Honor Sekolah</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Status Keaktifan</label>
                  <select
                    value={formData.statusAktif ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, statusAktif: e.target.value === 'true' })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="true">Aktif Mengajar</option>
                    <option value="false">Non-Aktif / Cuti</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="0812-xxxx-xxxx"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Email Dinas / Akun Belajar</label>
                  <input
                    type="email"
                    placeholder="guru@sekolah.sch.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Alamat Tempat Tinggal</label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap guru..."
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
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
                  id="btn-save-guru"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
                >
                  {editingGuru ? 'Simpan Perubahan' : 'Tambah Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ImportExcelGuruModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onApply={(guruList, replaceExisting) => {
          addGuruBatch(guruList, replaceExisting);
        }}
      />
    </div>
  );
};
