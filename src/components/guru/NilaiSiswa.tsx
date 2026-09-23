import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { NilaiSiswaItem } from '../../types';
import {
  Save,
  Printer,
  CheckCircle2,
  PlusCircle,
  X,
  Filter,
  GraduationCap,
  Sparkles,
  BookOpen,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { printWebDocument } from '../../utils/printHelper';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';

export interface AssessmentCol {
  id: string;
  nama: string;
  jenis: 'formatif' | 'sumatif';
}

const STANDARD_MAPEL_LIST = [
  'Pendidikan Agama dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam (IPA)',
  'Ilmu Pengetahuan Sosial (IPS)',
  'Bahasa Inggris',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Informatika',
  'Seni Budaya',
  'Prakarya',
  'Muatan Lokal / Bahasa Daerah'
];

export const NilaiSiswa: React.FC = () => {
  const {
    currentTeacher,
    siswas,
    nilais,
    saveNilaiBatch,
    schoolSettings,
    mapels,
    showToast,
    showFeedbackModal
  } = useApp();

  // Available classes computed strictly prioritizing current teacher's classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    if (currentTeacher?.kelasDiampu && currentTeacher.kelasDiampu.length > 0) {
      currentTeacher.kelasDiampu.forEach((k) => k && set.add(k.trim()));
    }
    if (set.size === 0) {
      siswas.forEach((s) => s.kelas && set.add(s.kelas));
    }
    if (set.size === 0) {
      ['7A', '7B', '8A', '8B', '9A', '9B'].forEach((k) => set.add(k));
    }
    return Array.from(set).sort();
  }, [currentTeacher?.kelasDiampu, siswas]);

  // Available subjects prioritizing current teacher's subjects
  const availableMapels = useMemo(() => {
    const set = new Set<string>();
    if (currentTeacher?.mapelList && currentTeacher.mapelList.length > 0) {
      currentTeacher.mapelList.forEach((m) => m && set.add(m.trim()));
    } else if (currentTeacher?.mapel && currentTeacher.mapel.trim() && currentTeacher.mapel !== 'Mata Pelajaran') {
      currentTeacher.mapel.split(',').forEach((m) => m.trim() && set.add(m.trim()));
    }
    if (set.size === 0) {
      if (mapels && mapels.length > 0) {
        mapels.forEach((m) => m.nama && set.add(m.nama.trim()));
      }
      STANDARD_MAPEL_LIST.forEach((m) => set.add(m));
    }
    return Array.from(set).filter(Boolean);
  }, [currentTeacher?.mapelList, currentTeacher?.mapel, mapels]);

  // Filter states - empty by default as requested: "tampilan penilaian siswa kosongkan dulu dan akan muncul setelah mengisi filter kelas dan mata pelajaran"
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>(schoolSettings.activeSemester || 'Ganjil');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Storage key helper for assessment columns configuration per class, mapel, semester
  const configStorageKey = useMemo(() => {
    if (!selectedClass || !selectedMapel) return '';
    return `nilai_cols_${selectedClass}_${selectedMapel}_${selectedSemester}`;
  }, [selectedClass, selectedMapel, selectedSemester]);

  // Assessment columns for the selected class & subject
  const [columns, setColumns] = useState<AssessmentCol[]>([]);

  // Load configured assessment columns from storage ONLY if explicitly saved previously
  useEffect(() => {
    if (!configStorageKey) {
      setColumns([]);
      return;
    }
    try {
      const stored = localStorage.getItem(configStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setColumns(parsed);
          return;
        }
      }
    } catch {
      // fallback
    }

    // Do NOT auto-generate default columns. Wait until teacher creates & saves them.
    setColumns([]);
  }, [configStorageKey]);

  // Save columns helper
  const saveColumnsToStorage = (newCols: AssessmentCol[], key = configStorageKey) => {
    if (!key) return;
    setColumns(newCols);
    try {
      localStorage.setItem(key, JSON.stringify(newCols));
    } catch {
      // ignore
    }
  };

  // Filter students for the selected class
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return siswas.filter((s) => s.kelas === selectedClass);
  }, [siswas, selectedClass]);

  // Local student scores map: studentId -> { [columnId]: score }
  const [studentScores, setStudentScores] = useState<Record<string, Record<string, number>>>({});

  // Sync scores from `nilais` context when class/mapel/semester/columns changes
  useEffect(() => {
    if (!selectedClass || !selectedMapel || columns.length === 0) {
      setStudentScores({});
      return;
    }

    const map: Record<string, Record<string, number>> = {};

    classStudents.forEach((student) => {
      const existing = nilais.find(
        (n) =>
          n.siswaId === student.id &&
          n.kelas === selectedClass &&
          n.mapel === selectedMapel &&
          n.semester === selectedSemester
      );

      const studentScoreObj: Record<string, number> = {};

      if (existing) {
        // Only load scores that were actually saved
        if (existing.customScores) {
          Object.entries(existing.customScores).forEach(([k, v]) => {
            studentScoreObj[k] = typeof v === 'number' ? v : Number(v) || 0;
          });
        }
        if (existing.formatif1 !== undefined) studentScoreObj['formatif1'] = existing.formatif1;
        if (existing.formatif2 !== undefined) studentScoreObj['formatif2'] = existing.formatif2;
        if (existing.formatif3 !== undefined) studentScoreObj['formatif3'] = existing.formatif3;
        if (existing.sts !== undefined) studentScoreObj['sts'] = existing.sts;
        if (existing.sas !== undefined) studentScoreObj['sas'] = existing.sas;
      }

      map[student.id] = studentScoreObj;
    });

    setStudentScores(map);
  }, [selectedClass, selectedMapel, selectedSemester, classStudents.length, nilais, columns]);

  // Inline update grade for a student in a column
  const handleUpdateGrade = (siswaId: string, colId: string, val: number) => {
    const clamped = Math.min(100, Math.max(0, Number(val) || 0));
    setStudentScores((prev) => ({
      ...prev,
      [siswaId]: {
        ...(prev[siswaId] || {}),
        [colId]: clamped
      }
    }));
  };

  // Calculate average score for a student based only on columns with recorded values
  const getStudentAverage = (siswaId: string) => {
    const scores = studentScores[siswaId] || {};
    if (columns.length === 0) return 0;

    let total = 0;
    let count = 0;
    columns.forEach((col) => {
      const val = scores[col.id];
      if (val !== undefined && val !== null && !isNaN(Number(val)) && Number(val) > 0) {
        total += Number(val);
        count += 1;
      }
    });

    return count > 0 ? Math.round(total / count) : 0;
  };

  // Save all grades to AppContext / storage
  const handleSaveAll = () => {
    if (!selectedClass || !selectedMapel) return;

    const itemsToSave: NilaiSiswaItem[] = classStudents.map((student) => {
      const scores = studentScores[student.id] || {};

      const existing = nilais.find(
        (n) =>
          n.siswaId === student.id &&
          n.kelas === selectedClass &&
          n.mapel === selectedMapel &&
          n.semester === selectedSemester &&
          (!n.guruId || !currentTeacher?.id || n.guruId === currentTeacher.id)
      );

      // Map back to formatif/sts/sas for compatibility with reports
      const f1 = scores['formatif1'] ?? (columns[0] ? scores[columns[0].id] : 0) ?? 0;
      const f2 = scores['formatif2'] ?? (columns[1] ? scores[columns[1].id] : f1) ?? 0;
      const f3 = scores['formatif3'] ?? (columns[2] ? scores[columns[2].id] : f2) ?? 0;
      const stsVal = scores['sts'] ?? (columns.find((c) => c.jenis === 'sumatif') ? scores[columns.find((c) => c.jenis === 'sumatif')!.id] : 0) ?? 0;
      const sasVal = scores['sas'] ?? stsVal ?? 0;

      return {
        id: existing ? existing.id : `nil-${student.id}-${Date.now()}`,
        guruId: currentTeacher?.id,
        siswaId: student.id,
        kelas: selectedClass,
        mapel: selectedMapel,
        semester: selectedSemester,
        tahunAjaran: schoolSettings.academicYear,
        formatif1: f1,
        formatif2: f2,
        formatif3: f3,
        sts: stsVal,
        sas: sasVal,
        customScores: scores
      };
    });

    saveNilaiBatch(itemsToSave);
    setSavedSuccess(true);
    showToast(
      'success',
      'Nilai Siswa Berhasil Disimpan!',
      `Tersimpan ${itemsToSave.length} data nilai kelas ${selectedClass} (${selectedMapel}).`
    );
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // -------------------------------------------------------------
  // MODAL "TAMBAH NILAI"
  // Format requested by user:
  // - Kelas
  // - Jenis penilaian (formatif/sumatif)
  // - Jumlah penilaian 1-10
  // Ketika memilih jumlah penilaian -> muncul kolom nama penilaian dan kolom penilaian sesuai jumlah penilaian
  // -------------------------------------------------------------
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalKelas, setModalKelas] = useState<string>('');
  const [modalMapel, setModalMapel] = useState<string>('');
  const [modalJenis, setModalJenis] = useState<'formatif' | 'sumatif'>('formatif');
  const [modalJumlah, setModalJumlah] = useState<number>(3);
  const [modalAssessmentNames, setModalAssessmentNames] = useState<string[]>([]);
  const [modalStudentScores, setModalStudentScores] = useState<Record<string, number[]>>({});
  const [modalDefaultScore, setModalDefaultScore] = useState<number>(80);

  // Helper to generate default assessment names
  const generateDefaultNames = (jenis: 'formatif' | 'sumatif', count: number) => {
    const list: string[] = [];
    for (let i = 1; i <= count; i++) {
      if (jenis === 'formatif') {
        const labels = ['Tugas 1', 'Kuis 1', 'Praktik/LKPD', 'Tugas 2', 'Kuis 2', 'Praktik 2', 'Proyek', 'Portofolio', 'Tugas Mandiri', 'Kuis Akhir'];
        list.push(`Formatif ${i} (${labels[i - 1] || `Tugas ${i}`})`);
      } else {
        const labels = ['UH Bab 1', 'UH Bab 2', 'STS (Tengah Semester)', 'UH Bab 3', 'SAS (Akhir Semester)', 'Ujian Teori', 'Ujian Praktik', 'Sumatif Akhir Lingkup', 'Ujian Sekolah', 'Sumatif Akhir Fase'];
        list.push(`Sumatif ${i} (${labels[i - 1] || `Ulangan ${i}`})`);
      }
    }
    return list;
  };

  // Open modal
  const handleOpenAddModal = () => {
    const targetKelas = selectedClass || availableClasses[0] || '7A';
    const defaultMapel =
      selectedMapel ||
      (currentTeacher?.mapelList && currentTeacher.mapelList.length > 0 ? currentTeacher.mapelList[0] : null) ||
      (currentTeacher?.mapel && currentTeacher.mapel !== 'Mata Pelajaran' ? currentTeacher.mapel.split(',')[0].trim() : null) ||
      availableMapels[0] ||
      'Matematika';

    setModalKelas(targetKelas);
    setModalMapel(defaultMapel);
    setModalJenis('formatif');
    setModalJumlah(3);

    const initialNames = generateDefaultNames('formatif', 3);
    setModalAssessmentNames(initialNames);

    // Initial student scores start clean until teacher inputs them or applies standard score
    const studentsInTargetClass = siswas.filter((s) => s.kelas === targetKelas);
    const scoreMap: Record<string, number[]> = {};
    studentsInTargetClass.forEach((s) => {
      scoreMap[s.id] = new Array(3).fill(0);
    });
    setModalStudentScores(scoreMap);
    setModalDefaultScore(80);

    setShowAddModal(true);
  };

  // Handler when Jumlah Penilaian changes (1 to 10)
  const handleJumlahChange = (newCount: number) => {
    const count = Math.min(10, Math.max(1, newCount));
    setModalJumlah(count);

    // Resize assessment names preserving existing names
    setModalAssessmentNames((prev) => {
      const nextNames: string[] = [];
      const defaultList = generateDefaultNames(modalJenis, count);
      for (let i = 0; i < count; i++) {
        nextNames.push(prev[i] || defaultList[i] || `${modalJenis === 'formatif' ? 'Formatif' : 'Sumatif'} ${i + 1}`);
      }
      return nextNames;
    });

    // Resize student scores preserving existing scores
    setModalStudentScores((prev) => {
      const nextScores: Record<string, number[]> = {};
      const studentsInTargetClass = siswas.filter((s) => s.kelas === modalKelas);

      studentsInTargetClass.forEach((s) => {
        const existingRow = prev[s.id] || [];
        const newRow: number[] = [];
        for (let i = 0; i < count; i++) {
          newRow.push(existingRow[i] !== undefined ? existingRow[i] : 0);
        }
        nextScores[s.id] = newRow;
      });

      return nextScores;
    });
  };

  // Handler when Jenis Penilaian changes
  const handleJenisChange = (newJenis: 'formatif' | 'sumatif') => {
    setModalJenis(newJenis);
    const nextNames = generateDefaultNames(newJenis, modalJumlah);
    setModalAssessmentNames(nextNames);
  };

  // Handler when Modal Kelas changes
  const handleModalKelasChange = (newKelas: string) => {
    setModalKelas(newKelas);
    const studentsInTargetClass = siswas.filter((s) => s.kelas === newKelas);
    const scoreMap: Record<string, number[]> = {};
    studentsInTargetClass.forEach((s) => {
      scoreMap[s.id] = new Array(modalJumlah).fill(0);
    });
    setModalStudentScores(scoreMap);
  };

  // Apply default score to all students in modal
  const handleApplyModalDefaultScore = () => {
    const studentsInTargetClass = siswas.filter((s) => s.kelas === modalKelas);
    const updated: Record<string, number[]> = {};
    studentsInTargetClass.forEach((s) => {
      updated[s.id] = new Array(modalJumlah).fill(modalDefaultScore);
    });
    setModalStudentScores(updated);
  };

  // Submit and save new assessment structure and scores from modal
  const handleSaveModalAssessment = (e: React.FormEvent) => {
    e.preventDefault();

    const targetMapel = modalMapel.trim() || selectedMapel || availableMapels[0] || 'Matematika';

    // Build new assessment columns
    const timestamp = Date.now();
    const newAddedCols: AssessmentCol[] = modalAssessmentNames.map((nama, idx) => ({
      id: `${modalJenis}_${timestamp}_${idx + 1}`,
      nama: nama.trim() || `${modalJenis === 'formatif' ? 'Formatif' : 'Sumatif'} ${idx + 1}`,
      jenis: modalJenis
    }));

    // Target storage key
    const targetKey = `nilai_cols_${modalKelas}_${targetMapel}_${selectedSemester}`;

    // Get existing columns or start fresh
    let combinedCols: AssessmentCol[] = [];
    try {
      const existingStr = localStorage.getItem(targetKey);
      if (existingStr) {
        combinedCols = JSON.parse(existingStr);
      }
    } catch {
      // ignore
    }

    if (!Array.isArray(combinedCols) || combinedCols.length === 0) {
      combinedCols = [...newAddedCols];
    } else {
      combinedCols = [...combinedCols, ...newAddedCols];
    }

    // Persist columns
    saveColumnsToStorage(combinedCols, targetKey);

    // Set active filters to newly created assessment
    setSelectedClass(modalKelas);
    setSelectedMapel(targetMapel);

    // Update student scores
    const studentsInTargetClass = siswas.filter((s) => s.kelas === modalKelas);
    const itemsToSave: NilaiSiswaItem[] = studentsInTargetClass.map((student) => {
      const existing = nilais.find(
        (n) =>
          n.siswaId === student.id &&
          n.kelas === modalKelas &&
          n.mapel === targetMapel &&
          n.semester === selectedSemester
      );

      const currentCustom = { ...(existing?.customScores || {}) };

      // Apply newly inputted scores for these new columns
      newAddedCols.forEach((col, idx) => {
        const studentRow = modalStudentScores[student.id];
        const val = studentRow && studentRow[idx] !== undefined ? studentRow[idx] : 0;
        currentCustom[col.id] = val;
      });

      const f1 = currentCustom['formatif1'] ?? (newAddedCols[0] ? currentCustom[newAddedCols[0].id] : 0);
      const f2 = currentCustom['formatif2'] ?? (newAddedCols[1] ? currentCustom[newAddedCols[1].id] : f1);
      const f3 = currentCustom['formatif3'] ?? (newAddedCols[2] ? currentCustom[newAddedCols[2].id] : f2);
      const sts = currentCustom['sts'] ?? (newAddedCols.find((c) => c.jenis === 'sumatif') ? currentCustom[newAddedCols.find((c) => c.jenis === 'sumatif')!.id] : 0);
      const sas = currentCustom['sas'] ?? sts;

      return {
        id: existing ? existing.id : `nil-${student.id}-${Date.now()}`,
        siswaId: student.id,
        kelas: modalKelas,
        mapel: targetMapel,
        semester: selectedSemester,
        tahunAjaran: schoolSettings.academicYear,
        formatif1: f1,
        formatif2: f2,
        formatif3: f3,
        sts: sts,
        sas: sas,
        customScores: currentCustom
      };
    });

    saveNilaiBatch(itemsToSave);

    // Update local state scores
    setStudentScores((prev) => {
      const next = { ...prev };
      studentsInTargetClass.forEach((s) => {
        const studentRow = next[s.id] || {};
        newAddedCols.forEach((col, idx) => {
          const val = modalStudentScores[s.id]?.[idx] ?? 0;
          studentRow[col.id] = val;
        });
        next[s.id] = studentRow;
      });
      return next;
    });

    setShowAddModal(false);
    setSavedSuccess(true);
    showToast(
      'success',
      'Penilaian Berhasil Ditambahkan!',
      `${newAddedCols.length} kolom ${modalJenis} berhasil dikonfigurasi untuk kelas ${modalKelas}.`
    );
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Delete a column if needed
  const handleDeleteColumn = (colId: string) => {
    const colToDelete = columns.find((c) => c.id === colId);
    showFeedbackModal({
      type: 'warning',
      title: 'Hapus Kolom Penilaian?',
      message: `Kolom "${colToDelete?.nama || 'Penilaian'}" beserta nilai pada kolom ini akan dihapus dari rekap penilaian.`,
      confirmText: 'Ya, Hapus Kolom',
      cancelText: 'Batal',
      onConfirm: () => {
        const nextCols = columns.filter((c) => c.id !== colId);
        saveColumnsToStorage(nextCols);
        showToast('info', 'Kolom Dihapus', `Kolom ${colToDelete?.nama || ''} telah dihapus.`);
      }
    });
  };

  // Summary stats for currently displayed class & subject
  const studentsCount = classStudents.length;
  const avgScoresList = classStudents.map((s) => getStudentAverage(s.id));
  const gradedList = avgScoresList.filter((score) => score > 0);
  const classAvg = gradedList.length > 0 ? Math.round(gradedList.reduce((a, b) => a + b, 0) / gradedList.length) : 0;
  const passedStudents = gradedList.filter((score) => score >= schoolSettings.kkmDefault).length;

  // Determine if both filters are active
  const isFilterActive = Boolean(selectedClass && selectedMapel);

  return (
    <div className="space-y-6">
      {/* Print Document Header */}
      {isFilterActive && columns.length > 0 && (
        <PrintHeader
          title={`DAFTAR NILAI PESERTA DIDIK KELAS ${selectedClass}`}
          subtitle={`Mata Pelajaran: ${selectedMapel} | Semester: ${selectedSemester} | KKM/KKTP: ${schoolSettings.kkmDefault}`}
        />
      )}

      {/* Screen Header with Dynamic Thematic Styling and Live Metrics */}
      <div className="no-print">
        <PageHeader
          title="Penilaian Siswa (Asesmen)"
          subtitle="Input nilai formatif dan sumatif, perolehan rata-rata kelas, dan predikat ketercapaian KKTP."
          badge="Evaluasi & Raport"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-tambah-nilai"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-4 py-2 text-xs font-bold text-white hover:from-fuchsia-700 hover:to-pink-700 shadow-md shadow-fuchsia-200 transition cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Tambah Kolom Nilai</span>
              </motion.button>

              {isFilterActive && columns.length > 0 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    id="btn-save-all-grades"
                    onClick={handleSaveAll}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-fuchsia-600 bg-fuchsia-50 px-3.5 py-2 text-xs font-bold text-fuchsia-900 hover:bg-fuchsia-100 shadow-xs transition cursor-pointer"
                  >
                    <Save className="h-4 w-4 text-fuchsia-700" />
                    <span>Simpan Semua Nilai</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    id="btn-print-nilai"
                    onClick={() =>
                      printWebDocument({
                        title: `Daftar Nilai Siswa Kelas ${selectedClass} - ${selectedMapel}`,
                        paperOrientation: 'landscape'
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
                  >
                    <Printer className="h-4 w-4 text-slate-500" />
                    <span>Cetak Nilai</span>
                  </motion.button>
                </>
              )}
            </div>
          }
          stats={[
            { label: 'Peserta Didik', value: isFilterActive ? `${studentsCount} Siswa` : '-', helper: isFilterActive ? `Kelas ${selectedClass}` : 'Pilih filter' },
            { label: 'Rata-rata Kelas', value: isFilterActive && classAvg ? classAvg : '-', helper: 'Rerata nilai terinput' },
            { label: 'Tuntas KKTP', value: isFilterActive && gradedList.length > 0 ? `${passedStudents} (${Math.round((passedStudents / gradedList.length) * 100)}%)` : '-', helper: `Target KKM: ${schoolSettings.kkmDefault}` },
            { label: 'Kolom Terpasang', value: `${columns.length} Penilaian`, helper: `${columns.filter((c) => c.jenis === 'formatif').length} Formatif, ${columns.filter((c) => c.jenis === 'sumatif').length} Sumatif` }
          ]}
        />
      </div>

      {savedSuccess && (
        <div className="no-print flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Nilai siswa berhasil disimpan dan diperbarui di sistem!</span>
        </div>
      )}

      {/* FILTER BAR: KELAS, MATA PELAJARAN, SEMESTER */}
      <div className="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 pr-1">
              <Filter className="h-4 w-4 text-emerald-600" />
              <span>Filter Data:</span>
            </div>

            {/* Filter Kelas */}
            <div>
              <label htmlFor="select-kelas-filter" className="sr-only">Pilih Kelas</label>
              <select
                id="select-kelas-filter"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition focus:border-emerald-500 focus:outline-none ${
                  selectedClass
                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950'
                    : 'border-amber-300 bg-amber-50/50 text-amber-900 font-semibold'
                }`}
              >
                <option value="">-- Pilih Kelas --</option>
                {availableClasses.map((k) => (
                  <option key={k} value={k}>
                    Kelas {k}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Mata Pelajaran */}
            <div>
              <label htmlFor="select-mapel-filter" className="sr-only">Pilih Mata Pelajaran</label>
              <select
                id="select-mapel-filter"
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition focus:border-emerald-500 focus:outline-none max-w-xs ${
                  selectedMapel
                    ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950'
                    : 'border-amber-300 bg-amber-50/50 text-amber-900 font-semibold'
                }`}
              >
                <option value="">-- Pilih Mata Pelajaran --</option>
                {availableMapels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Semester */}
            <div>
              <select
                id="select-semester-filter"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value as any)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-800 font-medium focus:border-emerald-500 focus:outline-none"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>
          </div>

          {/* Quick Info / Stats */}
          {isFilterActive && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="rounded-lg bg-slate-50 px-2.5 py-1 border border-slate-200">
                <span className="text-slate-500">Siswa: </span>
                <span className="font-bold text-slate-800">{studentsCount}</span>
              </div>
              {columns.length > 0 ? (
                <>
                  <div className="rounded-lg bg-slate-50 px-2.5 py-1 border border-slate-200">
                    <span className="text-slate-500">Rata-rata: </span>
                    <span className="font-bold text-slate-800">{classAvg > 0 ? classAvg : '-'}</span>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-2.5 py-1 border border-emerald-200 text-emerald-800">
                    <span className="font-semibold">Tuntas: </span>
                    <span className="font-bold">
                      {passedStudents}/{studentsCount || 1} Siswa ({Math.round((passedStudents / (studentsCount || 1)) * 100)}%)
                    </span>
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-amber-50 px-2.5 py-1 border border-amber-200 text-amber-800 font-semibold">
                  Belum ada nilai disimpan
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CASE 1: FILTER BELUM LENGKAP -> TAMPILAN PENILAIAN DIKOSONGKAN SESUAI INSTRUKSI */}
      {!isFilterActive ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 p-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200 text-emerald-600 mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            Tampilan Penilaian Belum Ditampilkan
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
            Data penilaian siswa dikosongkan terlebih dahulu. Silakan tentukan <strong>Kelas</strong> dan <strong>Mata Pelajaran</strong> pada filter di atas untuk memuat daftar nilai siswa.
          </p>

          <div className="mt-6 inline-flex flex-col sm:flex-row items-center justify-center gap-3">
            <div className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold border ${
              selectedClass ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-white text-slate-500 border-slate-200'
            }`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                selectedClass ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>1</span>
              <span>Kelas: {selectedClass ? `Kelas ${selectedClass}` : 'Belum dipilih'}</span>
            </div>

            <ChevronRight className="h-4 w-4 text-slate-300 hidden sm:block" />

            <div className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold border ${
              selectedMapel ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-white text-slate-500 border-slate-200'
            }`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                selectedMapel ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>2</span>
              <span>Mata Pelajaran: {selectedMapel || 'Belum dipilih'}</span>
            </div>
          </div>

          {/* Quick Select Button for Teacher */}
          {currentTeacher && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setSelectedClass(availableClasses[0] || '7A');
                  setSelectedMapel(currentTeacher.mapel && currentTeacher.mapel !== 'Mata Pelajaran' ? currentTeacher.mapel : availableMapels[0] || 'Matematika');
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-xs hover:bg-emerald-50 transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Pilih Otomatis: Kelas {availableClasses[0] || '7A'} | {currentTeacher.mapel || 'Matematika'}</span>
              </button>
            </div>
          )}
        </div>
      ) : columns.length === 0 ? (
        /* CASE 2A: FILTER DIPILIH TAPI BELUM ADA NILAI / PENILAIAN TERSIMPAN */
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            Belum Ada Nilai Tersimpan
          </h2>
          <p className="mx-auto mt-1.5 max-w-lg text-xs text-slate-500 leading-relaxed">
            Data penilaian untuk <strong>Kelas {selectedClass}</strong> | <strong>{selectedMapel}</strong> (Semester {selectedSemester}) belum disimpan. Sesuai instruksi, nilai tidak disinkronkan otomatis. Silakan klik tombol <strong>"Tambah Nilai"</strong> untuk menginput penilaian dan nilai siswa.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              id="btn-tambah-nilai-empty"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Tambah Nilai Kelas {selectedClass} Sekarang</span>
            </button>
          </div>
        </div>
      ) : (
        /* CASE 2B: SUDAH ADA PENILAIAN TERSIMPAN -> TAMPILKAN TABEL PENILAIAN SISWA */
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3.5 text-center w-12 border-r border-slate-200">No</th>
                    <th className="px-3.5 py-3.5 text-left w-36 border-r border-slate-200">NISN</th>
                    <th className="px-4 py-3.5 text-left min-w-[200px] border-r border-slate-200">Nama Lengkap Siswa</th>

                    {/* Dynamic Assessment Columns */}
                    {columns.map((col) => (
                      <th
                        key={col.id}
                        className={`px-3 py-3 text-center min-w-[130px] border-r border-slate-200 ${
                          col.jenis === 'formatif' ? 'bg-emerald-50/50' : 'bg-blue-50/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                              col.jenis === 'formatif'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {col.jenis}
                          </span>
                          <span className="font-bold text-slate-800 text-[11px] leading-tight line-clamp-2" title={col.nama}>
                            {col.nama}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(col.id)}
                            title="Hapus kolom ini"
                            className="no-print mt-0.5 text-slate-300 hover:text-rose-500 transition"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </th>
                    ))}

                    <th className="px-3 py-3.5 text-center w-28 bg-emerald-100/60 text-emerald-950 font-bold border-r border-slate-200">
                      Rata-Rata
                    </th>
                    <th className="px-3 py-3.5 text-center w-28 bg-slate-100/60 text-slate-900 font-bold">
                      Status KKM
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 5} className="py-12 text-center text-xs text-slate-400">
                        Tidak ada peserta didik terdaftar di Kelas {selectedClass}.
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((siswa, index) => {
                      const scores = studentScores[siswa.id] || {};
                      const studentAvg = getStudentAverage(siswa.id);
                      const isPassed = studentAvg >= schoolSettings.kkmDefault;

                      return (
                        <tr key={siswa.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-3 py-2.5 text-center font-semibold text-slate-400 border-r border-slate-100">
                            {index + 1}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-xs font-semibold text-slate-600 border-r border-slate-100 whitespace-nowrap">
                            {siswa.nisn || '-'}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                            {siswa.nama}
                          </td>

                          {/* Dynamic Assessment Score Inputs */}
                          {columns.map((col) => {
                            const val = scores[col.id];
                            return (
                              <td
                                key={col.id}
                                className={`px-2 py-2 text-center border-r border-slate-100 ${
                                  col.jenis === 'formatif' ? 'bg-emerald-50/20' : 'bg-blue-50/20'
                                }`}
                              >
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={val !== undefined ? val : ''}
                                  placeholder="0"
                                  onChange={(e) => handleUpdateGrade(siswa.id, col.id, e.target.value === '' ? 0 : Number(e.target.value))}
                                  className="w-16 rounded-lg border border-slate-300 bg-white px-1.5 py-1 text-center font-bold text-xs text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                />
                              </td>
                            );
                          })}

                          {/* Average Column */}
                          <td className="px-3 py-2 text-center border-r border-slate-100 bg-emerald-50/40">
                            {studentAvg > 0 ? (
                              <span
                                className={`text-sm font-extrabold ${
                                  isPassed ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                {studentAvg}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold text-xs">-</span>
                            )}
                          </td>

                          {/* KKM Status */}
                          <td className="px-3 py-2 text-center">
                            {studentAvg > 0 ? (
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isPassed
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {isPassed ? 'Tuntas' : 'Bimbingan'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom table bar */}
            <div className="no-print flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 bg-slate-50/80 px-4 py-3 gap-2">
              <span className="text-xs text-slate-500">
                Nilai dapat langsung diedit pada tabel di atas dan disimpan melalui tombol <strong>Simpan Semua Nilai</strong>.
              </span>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Tambah Penilaian Baru di Kelas Ini</span>
              </button>
            </div>
          </div>

          <PrintSignatures />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MODAL: TAMBAH NILAI */}
      {/* Format: Kelas, Jenis Penilaian (formatif/sumatif), Jumlah Penilaian 1-10 */}
      {/* Ketika memilih jumlah penilaian -> muncul kolom nama penilaian dan kolom penilaian sesuai jumlah */}
      {/* ------------------------------------------------------------------ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl border border-slate-100 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Tambah Penilaian Siswa</h3>
                  <p className="text-xs text-slate-500">
                    Konfigurasi penilaian berdasarkan kelas, jenis, dan jumlah penilaian (1-10).
                  </p>
                </div>
              </div>
              <button
                id="btn-close-modal-add-nilai"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalAssessment} className="mt-4 flex-1 flex flex-col overflow-hidden">
              <div className="space-y-4 pr-1 overflow-y-auto">
                {/* 1. Format: MATA PELAJARAN, KELAS & JENIS PENILAIAN */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Pilihan Mata Pelajaran */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. Mata Pelajaran <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={modalMapel}
                      onChange={(e) => setModalMapel(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    >
                      {availableMapels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pilihan Kelas */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. Kelas <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={modalKelas}
                      onChange={(e) => handleModalKelasChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                    >
                      {availableClasses.map((k) => (
                        <option key={k} value={k}>
                          Kelas {k}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pilihan Jenis Penilaian (Formatif / Sumatif) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      3. Jenis Penilaian <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleJenisChange('formatif')}
                        className={`rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                          modalJenis === 'formatif'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>Formatif</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJenisChange('sumatif')}
                        className={`rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                          modalJenis === 'sumatif'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>Sumatif</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Format: JUMLAH PENILAIAN (1 - 10) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      4. Jumlah Penilaian (1 - 10) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Terpilih: {modalJumlah} Kolom Penilaian
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleJumlahChange(num)}
                        className={`h-9 w-9 rounded-xl font-bold text-xs transition cursor-pointer border ${
                          modalJumlah === num
                            ? modalJenis === 'formatif'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. DOKUMEN / KOLOM NAMA PENILAIAN SESUAI JUMLAH */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Kolom Nama Penilaian ({modalJumlah} Kolom):
                    </span>
                    <span className="text-[10px] text-slate-500 italic">
                      Dapat diubah sesuai nama tugas / ujian Anda
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {modalAssessmentNames.map((nama, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={nama}
                          onChange={(e) => {
                            const val = e.target.value;
                            setModalAssessmentNames((prev) => {
                              const copy = [...prev];
                              copy[idx] = val;
                              return copy;
                            });
                          }}
                          placeholder={`Nama Penilaian ${idx + 1}`}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. KOLOM PENILAIAN SISWA SESUAI JUMLAH PENILAIAN */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <label className="text-xs font-bold text-slate-700">
                      Kolom Penilaian Siswa ({siswas.filter((s) => s.kelas === modalKelas).length} Siswa di Kelas {modalKelas}):
                    </label>

                    {/* Quick fill all */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">Nilai Standar:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={modalDefaultScore}
                        onChange={(e) => setModalDefaultScore(Number(e.target.value))}
                        className="w-14 rounded-lg border border-slate-300 bg-white px-2 py-0.5 text-center text-xs font-bold focus:border-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyModalDefaultScore}
                        className="rounded-lg bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-300 transition cursor-pointer"
                      >
                        Terapkan ke Semua
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 w-10 text-center">No</th>
                          <th className="px-3 py-2 min-w-[140px]">Nama Siswa</th>
                          {modalAssessmentNames.map((name, i) => (
                            <th key={i} className="px-2 py-2 text-center min-w-[70px]" title={name}>
                              P{i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {siswas
                          .filter((s) => s.kelas === modalKelas)
                          .map((siswa, idx) => {
                            const rowScores = modalStudentScores[siswa.id] || [];

                            return (
                              <tr key={siswa.id} className="hover:bg-slate-50">
                                <td className="px-3 py-1.5 text-center text-slate-400">{idx + 1}</td>
                                <td className="px-3 py-1.5 font-medium whitespace-nowrap">{siswa.nama}</td>
                                {modalAssessmentNames.map((_, i) => (
                                  <td key={i} className="px-1.5 py-1.5 text-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={rowScores[i] !== undefined && rowScores[i] > 0 ? rowScores[i] : (rowScores[i] === 0 ? '' : rowScores[i] ?? '')}
                                      placeholder="0"
                                      onChange={(e) => {
                                        const num = e.target.value === '' ? 0 : Number(e.target.value);
                                        setModalStudentScores((prev) => {
                                          const prevRow = prev[siswa.id] || [];
                                          const copy = [...prevRow];
                                          copy[i] = Math.min(100, Math.max(0, num));
                                          return {
                                            ...prev,
                                            [siswa.id]: copy
                                          };
                                        });
                                      }}
                                      className="w-14 rounded-md border border-slate-300 px-1 py-0.5 text-center text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                                    />
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-submit-tambah-nilai"
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan & Terapkan Penilaian</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

