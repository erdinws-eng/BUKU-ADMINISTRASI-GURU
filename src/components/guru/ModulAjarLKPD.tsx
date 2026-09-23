import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ModulAjar, LKPDItem } from '../../types';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';
import {
  FileText,
  BookOpen,
  Plus,
  Printer,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Eye,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { GenerateModulModal } from './ai/GenerateModulModal';
import { GenerateLKPDModal } from './ai/GenerateLKPDModal';
import { printWebDocument } from '../../utils/printHelper';

export const ModulAjarLKPD: React.FC = () => {
  const {
    currentTeacher,
    modulAjars,
    addModulAjar,
    updateModulAjar,
    deleteModulAjar,
    lkpds,
    addLKPD,
    updateLKPD,
    deleteLKPD,
    schoolSettings,
    showToast,
    showFeedbackModal
  } = useApp();

  const teacherModuls = modulAjars.filter((m) => m.guruId === currentTeacher?.id);
  const teacherLKPDs = lkpds.filter((l) => l.guruId === currentTeacher?.id);

  const [selectedModul, setSelectedModul] = useState<ModulAjar | null>(teacherModuls[0] || null);
  const [selectedLKPD, setSelectedLKPD] = useState<LKPDItem | null>(teacherLKPDs[0] || null);

  // Synchronize selection when logged-in teacher changes
  useEffect(() => {
    if (teacherModuls.length > 0) {
      if (!selectedModul || !teacherModuls.some((m) => m.id === selectedModul.id)) {
        setSelectedModul(teacherModuls[0]);
      }
    } else {
      setSelectedModul(null);
    }
  }, [currentTeacher?.id, modulAjars]);

  useEffect(() => {
    if (teacherLKPDs.length > 0) {
      if (!selectedLKPD || !teacherLKPDs.some((l) => l.id === selectedLKPD.id)) {
        setSelectedLKPD(teacherLKPDs[0]);
      }
    } else {
      setSelectedLKPD(null);
    }
  }, [currentTeacher?.id, lkpds]);

  const [activeTab, setActiveTab] = useState<'modul' | 'lkpd'>('modul');
  const [showModulModal, setShowModulModal] = useState(false);
  const [showLKPDModal, setShowLKPDModal] = useState(false);
  const [showAIModulModal, setShowAIModulModal] = useState(false);
  const [showAILKPDModal, setShowAILKPDModal] = useState(false);

  // Modul Form State
  const [modulForm, setModulForm] = useState({
    judulModul: '',
    faseKelas: 'Fase D (Kelas 7)',
    alokasiWaktu: '2 Pertemuan (4 x 40 menit)',
    elemen: '',
    profilPelajarPancasila: 'Bernalar Kritis, Gotong Royong',
    saranaPrasarana: 'Buku Pegangan, LCD Proyektor, Papan Tulis',
    targetPesertaDidik: 'Peserta didik reguler',
    modelPembelajaran: 'Problem Based Learning (PBL)',
    tujuanPembelajaran: '',
    pendahuluan: '',
    inti: '',
    penutup: '',
    diagnostik: '',
    formatif: '',
    sumatif: ''
  });

  // LKPD Form State
  const [lkpdForm, setLkpdForm] = useState({
    judulLKPD: '',
    kelas: '7',
    topik: '',
    petunjukBelajar: '',
    langkahKegiatan: '',
    soalKasus: '',
    rubrikPenilaian: ''
  });

  // Modul Handlers
  const handleOpenAddModul = () => {
    setModulForm({
      judulModul: '',
      faseKelas: 'Fase D (Kelas 7)',
      alokasiWaktu: '2 Pertemuan (4 x 40 menit)',
      elemen: 'Bilangan',
      profilPelajarPancasila: 'Bernalar Kritis, Mandiri',
      saranaPrasarana: 'Buku Siswa, Papan Tulis, LKPD',
      targetPesertaDidik: 'Peserta didik reguler',
      modelPembelajaran: 'Problem Based Learning (PBL)',
      tujuanPembelajaran: 'Peserta didik mampu memahami dan menerapkan konsep...',
      pendahuluan: 'Guru mengucap salam, berdoa, cek kehadiran dan apersepsi.',
      inti: 'Orientasi masalah, diskusi kelompok, presentasi dan tanggapan.',
      penutup: 'Refleksi pembelajaran, kuis evaluasi singkat, dan tindak lanjut.',
      diagnostik: 'Tes lisan tanya jawab singkat materi prasyarat.',
      formatif: 'Observasi keaktifan diskusi kelompok dan pengerjaan LKPD.',
      sumatif: 'Tes tertulis akhir lingkup materi.'
    });
    setShowModulModal(true);
  };

  const handleDeleteModul = (id: string) => {
    const target = modulAjars.find((m) => m.id === id);
    showFeedbackModal({
      type: 'warning',
      title: 'Hapus Modul Ajar?',
      message: `Modul "${target?.judulModul || 'ini'}" akan dihapus dari arsip perangkat ajar.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: () => {
        deleteModulAjar(id);
        if (selectedModul?.id === id) {
          setSelectedModul(null);
        }
        showToast('info', 'Modul Dihapus', 'Dokumen modul ajar berhasil dihapus.');
      }
    });
  };

  const handleDeleteLKPD = (id: string) => {
    const target = lkpds.find((l) => l.id === id);
    showFeedbackModal({
      type: 'warning',
      title: 'Hapus LKPD Siswa?',
      message: `Lembar Kerja Peserta Didik "${target?.judulLKPD || 'ini'}" akan dihapus.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: () => {
        deleteLKPD(id);
        if (selectedLKPD?.id === id) {
          setSelectedLKPD(null);
        }
        showToast('info', 'LKPD Dihapus', 'Lembar kerja peserta didik berhasil dihapus.');
      }
    });
  };

  const handleSaveModul = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modulForm.judulModul.trim()) {
      showToast('warning', 'Judul Wajib Diisi', 'Mohon isi Judul Modul Ajar terlebih dahulu.');
      return;
    }

    const tps = modulForm.tujuanPembelajaran
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const profils = modulForm.profilPelajarPancasila
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    addModulAjar({
      guruId: currentTeacher?.id || 'guru-1',
      mapel: currentTeacher?.mapel || 'Matematika',
      faseKelas: modulForm.faseKelas,
      alokasiWaktu: modulForm.alokasiWaktu,
      judulModul: modulForm.judulModul,
      elemen: modulForm.elemen,
      profilPelajarPancasila: profils,
      saranaPrasarana: modulForm.saranaPrasarana,
      targetPesertaDidik: modulForm.targetPesertaDidik,
      modelPembelajaran: modulForm.modelPembelajaran,
      tujuanPembelajaran: tps,
      kegiatanPembelajaran: {
        pendahuluan: modulForm.pendahuluan,
        inti: modulForm.inti,
        penutup: modulForm.penutup
      },
      asesmen: {
        diagnostik: modulForm.diagnostik,
        formatif: modulForm.formatif,
        sumatif: modulForm.sumatif
      }
    });

    showToast('success', 'Modul Ajar Tersimpan', `Modul "${modulForm.judulModul}" berhasil dibuat.`);
    setShowModulModal(false);
  };

  // LKPD Handlers
  const handleOpenAddLKPD = () => {
    setLkpdForm({
      judulLKPD: '',
      kelas: '7',
      topik: '',
      petunjukBelajar: '1. Berdoalah sebelum mengerjakan.\n2. Diskusikan dengan kelompokmu.\n3. Tulis jawaban dengan teliti.',
      langkahKegiatan: 'Diskusikan bersama kelompok dan peragakan dengan media pembelajaran.',
      soalKasus: 'Studi Kasus 1: ...',
      rubrikPenilaian: 'Kriteria: Ketepatan hasil (50), Kejelasan langkah (30), Kerjasama (20).'
    });
    setShowLKPDModal(true);
  };

  const handleSaveLKPD = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lkpdForm.judulLKPD.trim()) {
      showToast('warning', 'Judul Wajib Diisi', 'Mohon isi Judul LKPD terlebih dahulu.');
      return;
    }

    addLKPD({
      guruId: currentTeacher?.id || 'guru-1',
      mapel: currentTeacher?.mapel || 'Matematika',
      kelas: lkpdForm.kelas,
      judulLKPD: lkpdForm.judulLKPD,
      topik: lkpdForm.topik,
      petunjukBelajar: lkpdForm.petunjukBelajar,
      langkahKegiatan: lkpdForm.langkahKegiatan,
      soalKasus: lkpdForm.soalKasus,
      rubrikPenilaian: lkpdForm.rubrikPenilaian
    });

    showToast('success', 'LKPD Siswa Tersimpan', `LKPD "${lkpdForm.judulLKPD}" berhasil dibuat.`);
    setShowLKPDModal(false);
  };

  return (
    <div className="space-y-6">
      <PrintHeader
        title={
          activeTab === 'modul'
            ? selectedModul?.judulModul || 'MODUL AJAR KURIKULUM MERDEKA'
            : selectedLKPD?.judulLKPD || 'LEMBAR KERJA PESERTA DIDIK (LKPD)'
        }
        subtitle={`Mata Pelajaran: ${currentTeacher?.mapel} | Guru: ${currentTeacher?.nama}, ${currentTeacher?.gelar}`}
      />

      {/* Screen Controls with PageHeader */}
      <div className="no-print">
        <PageHeader
          title="Modul Ajar dan LKPD"
          subtitle="Dokumen perangkat ajar Kurikulum Merdeka: Modul Ajar (RPP) & Lembar Kerja Peserta Didik (LKPD)."
          badge="Perangkat Ajar"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-print-modul"
                onClick={() => printWebDocument({ title: activeTab === 'modul' ? 'Modul Ajar (RPP) Kurikulum Merdeka' : 'Lembar Kerja Peserta Didik (LKPD)' })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Cetak Dokumen</span>
              </motion.button>

              {activeTab === 'modul' ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    id="btn-ai-modul"
                    onClick={() => setShowAIModulModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-200 transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Generate Modul (AI)</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    id="btn-add-modul-modal"
                    onClick={handleOpenAddModul}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Buat Modul Ajar</span>
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    id="btn-ai-lkpd"
                    onClick={() => setShowAILKPDModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-indigo-200 transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Generate LKPD (AI)</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    id="btn-add-lkpd-modal"
                    onClick={handleOpenAddLKPD}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200 transition cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Buat LKPD Baru</span>
                  </motion.button>
                </>
              )}
            </div>
          }
          stats={[
            { label: 'Total Modul Ajar', value: `${teacherModuls.length}`, helper: 'Dokumen RPP Terbit' },
            { label: 'Total LKPD Siswa', value: `${teacherLKPDs.length}`, helper: 'Lembar Aktivitas' },
            { label: 'Mata Pelajaran', value: currentTeacher?.mapel || 'Kurikulum Merdeka', helper: 'Fase D (SMP/MTs)' },
            { label: 'Tipe Pembelajaran', value: 'Berdiferensiasi', helper: 'Profil Pelajar Pancasila' }
          ]}
        />
      </div>

      {/* Tab Switcher */}
      <div className="no-print flex rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
        <div className="flex w-full sm:w-auto rounded-lg bg-slate-100 p-1">
          <button
            id="tab-modul-ajar"
            onClick={() => setActiveTab('modul')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition ${
              activeTab === 'modul'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Modul Ajar ({teacherModuls.length})</span>
          </button>

          <button
            id="tab-lkpd"
            onClick={() => setActiveTab('lkpd')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition ${
              activeTab === 'lkpd'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>LKPD Siswa ({teacherLKPDs.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MODUL AJAR */}
      {activeTab === 'modul' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* List Sidebar on Screen */}
          <div className="no-print space-y-2 lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Daftar Modul Ajar Guru
            </h3>
            {teacherModuls.map((modul, mIdx) => {
              const palettes = [
                { border: 'border-purple-200 hover:border-purple-400', active: 'border-purple-500 bg-purple-50/70 ring-1 ring-purple-400', tag: 'bg-purple-100 text-purple-800' },
                { border: 'border-sky-200 hover:border-sky-400', active: 'border-sky-500 bg-sky-50/70 ring-1 ring-sky-400', tag: 'bg-sky-100 text-sky-800' },
                { border: 'border-emerald-200 hover:border-emerald-400', active: 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-400', tag: 'bg-emerald-100 text-emerald-800' },
                { border: 'border-amber-200 hover:border-amber-400', active: 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-400', tag: 'bg-amber-100 text-amber-800' }
              ];
              const pal = palettes[mIdx % palettes.length];
              const isSelected = selectedModul?.id === modul.id;

              return (
                <div
                  key={modul.id}
                  onClick={() => setSelectedModul(modul)}
                  className={`cursor-pointer rounded-2xl border p-4 text-xs transition-all ${
                    isSelected
                      ? pal.active + ' shadow-sm'
                      : `bg-white ${pal.border} hover:shadow-xs`
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${pal.tag}`}>
                      {modul.faseKelas}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteModul(modul.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Hapus Modul"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-900 mt-1.5 leading-snug">{modul.judulModul}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Elemen: <span className="font-semibold text-slate-700">{modul.elemen}</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">{modul.alokasiWaktu}</p>
                </div>
              );
            })}
          </div>

          {/* Document Content View */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-8">
            {selectedModul ? (
              <div className="space-y-6 text-xs text-slate-800 leading-relaxed">
                <div className="border-b border-slate-100 pb-4">
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {selectedModul.faseKelas}
                  </span>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">{selectedModul.judulModul}</h2>
                  <p className="text-slate-500 mt-0.5">
                    Mata Pelajaran: {selectedModul.mapel} | Elemen: {selectedModul.elemen} | Alokasi: {selectedModul.alokasiWaktu}
                  </p>
                </div>

                {/* Section A: Informasi Umum */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 border-b border-emerald-100 pb-1">
                    A. INFORMASI UMUM
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-slate-700">
                    <div>
                      <span className="font-semibold">Model Pembelajaran: </span>
                      {selectedModul.modelPembelajaran}
                    </div>
                    <div>
                      <span className="font-semibold">Target Siswa: </span>
                      {selectedModul.targetPesertaDidik}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-semibold">Profil Pelajar Pancasila: </span>
                      {selectedModul.profilPelajarPancasila.join(', ')}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-semibold">Sarana & Prasarana: </span>
                      {selectedModul.saranaPrasarana}
                    </div>
                  </div>
                </div>

                {/* Section B: Komponen Inti */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 border-b border-emerald-100 pb-1">
                    B. KOMPONEN INTI & TUJUAN PEMBELAJARAN
                  </h3>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700">
                    {selectedModul.tujuanPembelajaran.map((tp, i) => (
                      <li key={i}>{tp}</li>
                    ))}
                  </ul>
                </div>

                {/* Section C: Langkah Kegiatan Pembelajaran */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 border-b border-emerald-100 pb-1">
                    C. LANGKAH-LANGKAH KEGIATAN PEMBELAJARAN
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                      <p className="font-bold text-slate-800 mb-1">1. Kegiatan Pendahuluan (Apersepsi & Motivasi)</p>
                      <p className="text-slate-600 whitespace-pre-line">{selectedModul.kegiatanPembelajaran.pendahuluan}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                      <p className="font-bold text-slate-800 mb-1">2. Kegiatan Inti (Eksplorasi & Kolaborasi)</p>
                      <p className="text-slate-600 whitespace-pre-line">{selectedModul.kegiatanPembelajaran.inti}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                      <p className="font-bold text-slate-800 mb-1">3. Kegiatan Penutup (Refleksi & Tindak Lanjut)</p>
                      <p className="text-slate-600 whitespace-pre-line">{selectedModul.kegiatanPembelajaran.penutup}</p>
                    </div>
                  </div>
                </div>

                {/* Section D: Asesmen */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2 border-b border-emerald-100 pb-1">
                    D. ASESMEN & EVALUASI
                  </h3>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 p-2.5">
                      <p className="font-bold text-slate-800 mb-0.5">Asesmen Diagnostik</p>
                      <p className="text-[11px] text-slate-600">{selectedModul.asesmen.diagnostik}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2.5">
                      <p className="font-bold text-slate-800 mb-0.5">Asesmen Formatif</p>
                      <p className="text-[11px] text-slate-600">{selectedModul.asesmen.formatif}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-2.5">
                      <p className="font-bold text-slate-800 mb-0.5">Asesmen Sumatif</p>
                      <p className="text-[11px] text-slate-600">{selectedModul.asesmen.sumatif}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Pilih modul dari daftar untuk membaca isi dokumen.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LKPD */}
      {activeTab === 'lkpd' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* List Sidebar on Screen */}
          <div className="no-print space-y-2 lg:col-span-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Daftar LKPD Peserta Didik
            </h3>
            {teacherLKPDs.map((lk, lkIdx) => {
              const palettes = [
                { border: 'border-teal-200 hover:border-teal-400', active: 'border-teal-500 bg-teal-50/70 ring-1 ring-teal-400', tag: 'bg-teal-100 text-teal-800' },
                { border: 'border-rose-200 hover:border-rose-400', active: 'border-rose-500 bg-rose-50/70 ring-1 ring-rose-400', tag: 'bg-rose-100 text-rose-800' },
                { border: 'border-indigo-200 hover:border-indigo-400', active: 'border-indigo-500 bg-indigo-50/70 ring-1 ring-indigo-400', tag: 'bg-indigo-100 text-indigo-800' },
                { border: 'border-amber-200 hover:border-amber-400', active: 'border-amber-500 bg-amber-50/70 ring-1 ring-amber-400', tag: 'bg-amber-100 text-amber-800' }
              ];
              const pal = palettes[lkIdx % palettes.length];
              const isSelected = selectedLKPD?.id === lk.id;

              return (
                <div
                  key={lk.id}
                  onClick={() => setSelectedLKPD(lk)}
                  className={`cursor-pointer rounded-2xl border p-4 text-xs transition-all ${
                    isSelected
                      ? pal.active + ' shadow-sm'
                      : `bg-white ${pal.border} hover:shadow-xs`
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${pal.tag}`}>
                      Kelas {lk.kelas}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLKPD(lk.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Hapus LKPD"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-900 mt-1.5 leading-snug">{lk.judulLKPD}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Topik: <span className="font-semibold text-slate-700">{lk.topik}</span>
                  </p>
                </div>
              );
            })}
          </div>

          {/* Document Content View */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-8">
            {selectedLKPD ? (
              <div className="space-y-5 text-xs text-slate-800 leading-relaxed">
                <div className="border-b border-slate-100 pb-3 text-center">
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    LEMBAR KERJA PESERTA DIDIK (LKPD)
                  </span>
                  <h2 className="mt-2 text-lg font-bold text-slate-900">{selectedLKPD.judulLKPD}</h2>
                  <p className="text-slate-500">
                    Topik: {selectedLKPD.topik} | Mata Pelajaran: {selectedLKPD.mapel} | Kelas {selectedLKPD.kelas}
                  </p>
                </div>

                {/* Identity header box */}
                <div className="rounded-lg border border-slate-200 p-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>Kelompok: ....................................................</div>
                  <div>Nama Anggota: ............................................</div>
                  <div>Kelas: {selectedLKPD.kelas}</div>
                  <div>Tanggal: .......................................................</div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-1">A. Petunjuk Pengerjaan</h3>
                  <div className="rounded-lg bg-slate-50 p-3 whitespace-pre-line text-slate-700 border border-slate-100">
                    {selectedLKPD.petunjukBelajar}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-1">B. Langkah Kegiatan / Praktikum</h3>
                  <div className="rounded-lg bg-slate-50 p-3 whitespace-pre-line text-slate-700 border border-slate-100">
                    {selectedLKPD.langkahKegiatan}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-1">C. Soal & Masalah Pemecahan Kasus</h3>
                  <div className="rounded-lg bg-white p-3 whitespace-pre-line text-slate-800 border-2 border-slate-300 font-medium">
                    {selectedLKPD.soalKasus}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 mb-1">D. Rubrik Penilaian</h3>
                  <div className="rounded-lg bg-slate-50 p-3 whitespace-pre-line text-slate-600 border border-slate-100 text-[11px]">
                    {selectedLKPD.rubrikPenilaian}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Pilih LKPD dari daftar untuk membaca isi lembar kerja.
              </div>
            )}
          </div>
        </div>
      )}

      <PrintSignatures />

      {/* Modal Add Modul */}
      {showModulModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-800">Buat Modul Ajar Baru (Kurikulum Merdeka)</h3>
              <button
                onClick={() => setShowModulModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModul} className="p-5 space-y-3 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Judul Modul Ajar *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Modul Ajar: Bilangan Bulat dan Pecahan"
                  value={modulForm.judulModul}
                  onChange={(e) => setModulForm({ ...modulForm, judulModul: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Fase / Kelas</label>
                  <input
                    type="text"
                    value={modulForm.faseKelas}
                    onChange={(e) => setModulForm({ ...modulForm, faseKelas: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Elemen</label>
                  <input
                    type="text"
                    placeholder="misal: Bilangan, Aljabar, dsb"
                    value={modulForm.elemen}
                    onChange={(e) => setModulForm({ ...modulForm, elemen: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">Tujuan Pembelajaran (1 baris per TP)</label>
                <textarea
                  rows={2}
                  value={modulForm.tujuanPembelajaran}
                  onChange={(e) => setModulForm({ ...modulForm, tujuanPembelajaran: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">Kegiatan Inti</label>
                <textarea
                  rows={2}
                  value={modulForm.inti}
                  onChange={(e) => setModulForm({ ...modulForm, inti: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModulModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
                >
                  Simpan Modul
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add LKPD */}
      {showLKPDModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-bold text-slate-800">Buat LKPD Peserta Didik Baru</h3>
              <button
                onClick={() => setShowLKPDModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLKPD} className="p-5 space-y-3 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">Judul LKPD *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: LKPD 1: Operasi Hitung Bilangan Bulat Positif dan Negatif"
                  value={lkpdForm.judulLKPD}
                  onChange={(e) => setLkpdForm({ ...lkpdForm, judulLKPD: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Topik Pembelajaran</label>
                  <input
                    type="text"
                    placeholder="misal: Garis Bilangan"
                    value={lkpdForm.topik}
                    onChange={(e) => setLkpdForm({ ...lkpdForm, topik: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Tingkat Kelas</label>
                  <select
                    value={lkpdForm.kelas}
                    onChange={(e) => setLkpdForm({ ...lkpdForm, kelas: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="7">Kelas 7</option>
                    <option value="8">Kelas 8</option>
                    <option value="9">Kelas 9</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-slate-700">Soal / Kasus Penyelidikan</label>
                <textarea
                  rows={3}
                  placeholder="Tuliskan soal diskusi atau masalah kontekstual yang harus dipecahkan siswa..."
                  value={lkpdForm.soalKasus}
                  onChange={(e) => setLkpdForm({ ...lkpdForm, soalKasus: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLKPDModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-700"
                >
                  Simpan LKPD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generator Modul Ajar Modal */}
      <GenerateModulModal
        isOpen={showAIModulModal}
        onClose={() => setShowAIModulModal(false)}
        defaultMapel={currentTeacher?.mapel || 'Matematika'}
        onApply={(newModul) => {
          addModulAjar(newModul);
          setSelectedModul({ ...newModul, id: `mod-${Date.now()}` });
        }}
      />

      {/* AI Generator LKPD Modal */}
      <GenerateLKPDModal
        isOpen={showAILKPDModal}
        onClose={() => setShowAILKPDModal(false)}
        defaultMapel={currentTeacher?.mapel || 'Matematika'}
        defaultKelas="7"
        onApply={(newLKPD) => {
          addLKPD(newLKPD);
          setSelectedLKPD({ ...newLKPD, id: `lkpd-${Date.now()}` });
        }}
      />
    </div>
  );
};
