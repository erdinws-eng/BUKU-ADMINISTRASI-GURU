import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
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
  AlertTriangle,
  Trash2,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { printWebDocument } from '../../utils/printHelper';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';
import {
  AssessmentCol,
  resolveAssessmentColumns,
  computeClassGradeRecap,
  getSavedNilaisForFilter
} from '../../utils/nilaiHelper';

export type { AssessmentCol };

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
    jadwals,
    saveNilaiBatch,
    deleteNilaiByFilter,
    deleteAllNilai,
    schoolSettings,
    mapels,
    showToast,
    showFeedbackModal
  } = useApp();

  // Available classes computed strictly matching current teacher's classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>();
    // 1. Classes assigned in teacher profile
    if (currentTeacher?.kelasDiampu && currentTeacher.kelasDiampu.length > 0) {
      currentTeacher.kelasDiampu.forEach((k) => k && set.add(k.trim()));
    }
    // 2. Classes from teacher's schedule
    if (jadwals && currentTeacher?.id) {
      jadwals.filter((j) => j.guruId === currentTeacher.id).forEach((j) => j.kelas && set.add(j.kelas.trim()));
    }
    // 3. Classes where teacher recorded grades
    if (nilais && currentTeacher?.id) {
      nilais
        .filter((n) => !n.guruId || n.guruId === currentTeacher.id)
        .forEach((n) => n.kelas && set.add(n.kelas.trim()));
    }
    // Fallback only if teacher profile has no classes configured at all
    if (set.size === 0) {
      siswas.forEach((s) => s.kelas && set.add(s.kelas));
    }
    if (set.size === 0) {
      ['7A', '7B', '8A', '8B', '9A', '9B'].forEach((k) => set.add(k));
    }
    return Array.from(set).sort();
  }, [currentTeacher?.kelasDiampu, currentTeacher?.id, jadwals, nilais, siswas]);

  // Available subjects strictly matching current teacher's subjects
  const availableMapels = useMemo(() => {
    const set = new Set<string>();
    // 1. Subjects assigned in teacher profile
    if (currentTeacher?.mapelList && currentTeacher.mapelList.length > 0) {
      currentTeacher.mapelList.forEach((m) => m && set.add(m.trim()));
    } else if (currentTeacher?.mapel && currentTeacher.mapel.trim() && currentTeacher.mapel !== 'Mata Pelajaran') {
      currentTeacher.mapel.split(',').forEach((m) => m.trim() && set.add(m.trim()));
    }
    // 2. Subjects from teacher's schedule
    if (jadwals && currentTeacher?.id) {
      jadwals.filter((j) => j.guruId === currentTeacher.id).forEach((j) => j.mapel && set.add(j.mapel.trim()));
    }
    // 3. Subjects where teacher recorded grades
    if (nilais && currentTeacher?.id) {
      nilais
        .filter((n) => !n.guruId || n.guruId === currentTeacher.id)
        .forEach((n) => n.mapel && set.add(n.mapel.trim()));
    }
    // Fallback only if teacher has no subject assigned
    if (set.size === 0) {
      if (mapels && mapels.length > 0) {
        mapels.forEach((m) => m.nama && set.add(m.nama.trim()));
      }
      STANDARD_MAPEL_LIST.forEach((m) => set.add(m));
    }
    return Array.from(set).filter(Boolean);
  }, [currentTeacher?.mapelList, currentTeacher?.mapel, currentTeacher?.id, jadwals, nilais, mapels]);

  // Filter states - empty on initial session, preserved when switching between Nilai Siswa and Rekap & Leger Nilai
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    try {
      const s = sessionStorage.getItem('BAG_session_nilai_filter');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed?.kelas) return parsed.kelas;
      }
    } catch {
      // ignore
    }
    return '';
  });
  const [selectedMapel, setSelectedMapel] = useState<string>(() => {
    try {
      const s = sessionStorage.getItem('BAG_session_nilai_filter');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed?.mapel) return parsed.mapel;
      }
    } catch {
      // ignore
    }
    return '';
  });
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>(() => {
    try {
      const s = sessionStorage.getItem('BAG_session_nilai_filter');
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed?.semester === 'Ganjil' || parsed?.semester === 'Genap') return parsed.semester;
      }
    } catch {
      // ignore
    }
    return schoolSettings.activeSemester || 'Ganjil';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Storage key helper for assessment columns configuration per class, mapel, semester
  const configStorageKey = useMemo(() => {
    if (!selectedClass || !selectedMapel) return '';
    return `nilai_cols_${selectedClass}_${selectedMapel}_${selectedSemester}`;
  }, [selectedClass, selectedMapel, selectedSemester]);

  // Assessment columns for the selected class & subject
  const [columns, setColumns] = useState<AssessmentCol[]>([]);

  // Save active filter selection so Rekap & Laporan automatically opens the same class/mapel/semester
  useEffect(() => {
    if (selectedClass && selectedMapel) {
      const payload = JSON.stringify({ kelas: selectedClass, mapel: selectedMapel, semester: selectedSemester });
      try {
        localStorage.setItem('BAG_active_nilai_filter', payload);
        sessionStorage.setItem('BAG_session_nilai_filter', payload);
      } catch {
        // ignore
      }
    }
  }, [selectedClass, selectedMapel, selectedSemester]);

  // Load configured assessment columns using shared single-source-of-truth helper
  useEffect(() => {
    if (!selectedClass || !selectedMapel) {
      setColumns([]);
      return;
    }
    const resolved = resolveAssessmentColumns(
      nilais,
      selectedClass,
      selectedMapel,
      selectedSemester,
      currentTeacher?.id
    );
    setColumns(resolved);
  }, [selectedClass, selectedMapel, selectedSemester, nilais, currentTeacher?.id]);

  // Save columns helper
  const saveColumnsToStorage = (newCols: AssessmentCol[], key = configStorageKey) => {
    if (!key) return;
    setColumns(newCols);
    try {
      if (newCols.length === 0) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newCols));
      }
    } catch {
      // ignore
    }
  };

  // Filter students for the selected class sorted A-Z by name
  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return siswas
      .filter((s) => s.kelas === selectedClass)
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }, [siswas, selectedClass]);

  // Group columns into Formatif and Sumatif
  const formatifCols = useMemo(() => columns.filter((c) => c.jenis === 'formatif'), [columns]);
  const sumatifCols = useMemo(() => columns.filter((c) => c.jenis === 'sumatif'), [columns]);
  const orderedCols = useMemo(() => {
    if (formatifCols.length > 0 && sumatifCols.length > 0) {
      return [...formatifCols, ...sumatifCols];
    }
    return columns;
  }, [columns, formatifCols, sumatifCols]);

  // Local student scores map: studentId -> { [columnId]: score }
  const [studentScores, setStudentScores] = useState<Record<string, Record<string, number>>>({});

  // Sync scores from `nilais` context when class/mapel/semester/columns changes
  useEffect(() => {
    if (!selectedClass || !selectedMapel || columns.length === 0) {
      setStudentScores({});
      return;
    }

    const savedForClass = getSavedNilaisForFilter(
      nilais,
      selectedClass,
      selectedMapel,
      selectedSemester,
      currentTeacher?.id
    );

    const map: Record<string, Record<string, number>> = {};

    classStudents.forEach((student) => {
      let existing: NilaiSiswaItem | undefined = undefined;
      for (let i = savedForClass.length - 1; i >= 0; i--) {
        if (savedForClass[i].siswaId === student.id) {
          existing = savedForClass[i];
          break;
        }
      }

      const studentScoreObj: Record<string, number> = {};

      if (existing) {
        if (existing.customScores && Object.keys(existing.customScores).length > 0) {
          Object.entries(existing.customScores).forEach(([k, v]) => {
            studentScoreObj[k] = typeof v === 'number' ? v : Number(v) || 0;
          });
        } else {
          if (existing.formatif1 !== undefined && existing.formatif1 > 0) studentScoreObj['formatif1'] = existing.formatif1;
          if (existing.formatif2 !== undefined && existing.formatif2 > 0) studentScoreObj['formatif2'] = existing.formatif2;
          if (existing.formatif3 !== undefined && existing.formatif3 > 0) studentScoreObj['formatif3'] = existing.formatif3;
          if (existing.sts !== undefined && existing.sts > 0) studentScoreObj['sts'] = existing.sts;
          if (existing.sas !== undefined && existing.sas > 0) studentScoreObj['sas'] = existing.sas;
        }
      }

      map[student.id] = studentScoreObj;
    });

    setStudentScores(map);
  }, [selectedClass, selectedMapel, selectedSemester, classStudents.length, nilais, columns, currentTeacher?.id]);

  // Helper to build and persist NilaiSiswaItem batch for a given score map and column list
  const persistScoresToContext = (
    targetKelas: string,
    targetMapel: string,
    targetSemester: 'Ganjil' | 'Genap',
    targetCols: AssessmentCol[],
    scoreMap: Record<string, Record<string, number>>
  ) => {
    if (!targetKelas || !targetMapel) return [];
    const targetStudents = siswas
      .filter((s) => s.kelas === targetKelas)
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

    const fCols = targetCols.filter((c) => c.jenis === 'formatif');
    const sCols = targetCols.filter((c) => c.jenis === 'sumatif');

    const itemsToSave: NilaiSiswaItem[] = targetStudents.map((student) => {
      const scores = scoreMap[student.id] || {};
      const existing = nilais.find(
        (n) =>
          n.siswaId === student.id &&
          n.kelas === targetKelas &&
          n.mapel === targetMapel &&
          n.semester === targetSemester &&
          (!n.guruId || !currentTeacher?.id || n.guruId === currentTeacher.id)
      );

      const f1 = fCols.length > 0 ? (scores[fCols[0].id] ?? 0) : 0;
      const f2 = fCols.length > 1 ? (scores[fCols[1].id] ?? 0) : 0;
      const f3 = fCols.length > 2 ? (scores[fCols[2].id] ?? 0) : 0;
      const stsVal = sCols.length > 0 ? (scores[sCols[0].id] ?? 0) : 0;
      const sasVal = sCols.length > 1 ? (scores[sCols[1].id] ?? 0) : 0;

      const filteredCustomScores: Record<string, number> = {};
      targetCols.forEach((col) => {
        if (scores[col.id] !== undefined) {
          filteredCustomScores[col.id] = scores[col.id];
        }
      });

      return {
        id: existing ? existing.id : `nil-${student.id}-${Date.now()}`,
        guruId: currentTeacher?.id,
        siswaId: student.id,
        kelas: targetKelas,
        mapel: targetMapel,
        semester: targetSemester,
        tahunAjaran: schoolSettings.academicYear,
        formatif1: f1,
        formatif2: f2,
        formatif3: f3,
        sts: stsVal,
        sas: sasVal,
        customScores: filteredCustomScores,
        assessmentCols: targetCols
      };
    });

    saveNilaiBatch(itemsToSave);
    return itemsToSave;
  };

  // Inline update grade for a student in a column (auto-synced to AppContext so Rekap & Leger Nilai is always identical)
  const handleUpdateGrade = (siswaId: string, colId: string, val: number) => {
    const clamped = Math.min(100, Math.max(0, Number(val) || 0));
    const nextScores: Record<string, Record<string, number>> = {
      ...studentScores,
      [siswaId]: {
        ...(studentScores[siswaId] || {}),
        [colId]: clamped
      }
    };
    setStudentScores(nextScores);
    if (selectedClass && selectedMapel && columns.length > 0) {
      persistScoresToContext(selectedClass, selectedMapel, selectedSemester, columns, nextScores);
    }
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

    const itemsToSave = persistScoresToContext(
      selectedClass,
      selectedMapel,
      selectedSemester,
      columns,
      studentScores
    );
    setSavedSuccess(true);
    showToast(
      'success',
      'Nilai Siswa Berhasil Disimpan!',
      `Tersimpan ${itemsToSave.length} data nilai kelas ${selectedClass} (${selectedMapel}).`
    );
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Handler Ekspor Leger Nilai ke Excel (.xlsx resmi - bukan CSV)
  const handleExportExcel = () => {
    if (!selectedClass || !selectedMapel || columns.length === 0) {
      showToast('warning', 'Belum Ada Penilaian', 'Silakan tentukan kolom penilaian dan simpan nilai terlebih dahulu sebelum mengekspor.');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      const rows: any[][] = [];

      // Kop & Informasi Laporan
      rows.push([schoolSettings.schoolName.toUpperCase()]);
      rows.push([`LAPORAN LEGER PENILAIAN SISWA KELAS ${selectedClass}`]);
      rows.push([`Mata Pelajaran: ${selectedMapel} | Semester: ${selectedSemester} | Tahun Ajaran: ${schoolSettings.academicYear}`]);
      rows.push([`Guru Pengampu: ${currentTeacher?.nama || '-'} (NIP. ${currentTeacher?.nip || '-'})`]);
      rows.push([`KKM Ketuntasan: ${schoolSettings.kkmDefault} | Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`]);
      rows.push([]);

      // Baris 1: No, NISN, Nama Lengkap Siswa, PENILAIAN (merged), Rata-Rata, Status KKM
      const row1: any[] = ['No', 'NISN', 'Nama Lengkap Siswa'];
      row1.push('PENILAIAN');
      for (let i = 1; i < orderedCols.length; i++) {
        row1.push('');
      }
      row1.push('Rata-Rata');
      row1.push('Status KKM');
      rows.push(row1);

      // Baris 2: Blank for No/NISN/Nama, FORMATIF (merged), SUMATIF (merged), blank for Rata-rata/Status
      const row2: any[] = ['', '', ''];
      if (formatifCols.length > 0) {
        row2.push('FORMATIF');
        for (let i = 1; i < formatifCols.length; i++) row2.push('');
      }
      if (sumatifCols.length > 0) {
        row2.push('SUMATIF');
        for (let i = 1; i < sumatifCols.length; i++) row2.push('');
      }
      row2.push('');
      row2.push('');
      rows.push(row2);

      // Baris 3: Blank for No/NISN/Nama, Sub-kolom formatif, Sub-kolom sumatif, blank for Rata-rata/Status
      const row3: any[] = ['', '', ''];
      orderedCols.forEach((col) => row3.push(col.nama));
      row3.push('');
      row3.push('');
      rows.push(row3);

      // Data Siswa
      classStudents.forEach((s, idx) => {
        const studentRow: any[] = [
          idx + 1,
          s.nisn,
          s.nama
        ];

        orderedCols.forEach((col) => {
          const val = studentScores[s.id]?.[col.id];
          studentRow.push(typeof val === 'number' && val > 0 ? val : (val === 0 ? 0 : '-'));
        });

        const avg = getStudentAverage(s.id);
        studentRow.push(avg > 0 ? avg : '-');
        studentRow.push(avg > 0 ? (avg >= schoolSettings.kkmDefault ? 'Tuntas' : 'Bimbingan') : '-');

        rows.push(studentRow);
      });

      // Statistik di bagian bawah
      rows.push([]);
      rows.push(['STATISTIK KELAS', '', '']);
      rows.push(['Rata-Rata Nilai Akhir Kelas', '', '', '', '', '', '', '', classAvg]);
      rows.push(['Siswa Tuntas (>= KKM)', '', '', '', '', '', '', '', `${passedStudents} Siswa`]);
      rows.push(['Target KKM Sekolah', '', '', '', '', '', '', '', schoolSettings.kkmDefault]);

      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Merges
      const fLen = formatifCols.length;
      const sLen = sumatifCols.length;
      const startCol = 3;
      const avgCol = startCol + orderedCols.length;
      const statusCol = avgCol + 1;

      const merges: any[] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: statusCol } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: statusCol } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: statusCol } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: statusCol } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: statusCol } },

        { s: { r: 6, c: 0 }, e: { r: 8, c: 0 } },
        { s: { r: 6, c: 1 }, e: { r: 8, c: 1 } },
        { s: { r: 6, c: 2 }, e: { r: 8, c: 2 } },
        { s: { r: 6, c: startCol }, e: { r: 6, c: avgCol - 1 } },
        { s: { r: 6, c: avgCol }, e: { r: 8, c: avgCol } },
        { s: { r: 6, c: statusCol }, e: { r: 8, c: statusCol } },
      ];

      if (fLen > 0) {
        merges.push({ s: { r: 7, c: startCol }, e: { r: 7, c: startCol + fLen - 1 } });
      }
      if (sLen > 0) {
        merges.push({ s: { r: 7, c: startCol + fLen }, e: { r: 7, c: avgCol - 1 } });
      }

      ws['!merges'] = merges;

      const colWidths: Array<{ wch: number }> = [
        { wch: 6 },
        { wch: 16 },
        { wch: 32 }
      ];
      orderedCols.forEach((c) => colWidths.push({ wch: Math.max(16, c.nama.length + 3) }));
      colWidths.push({ wch: 14 });
      colWidths.push({ wch: 20 });

      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, `Nilai_${selectedClass}`);
      const filename = `Leger_Nilai_Kelas_${selectedClass}_${selectedMapel.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedSemester}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast(
        'success',
        'Berhasil Ekspor Excel (.xlsx)!',
        `Leger nilai kelas ${selectedClass} berhasil diekspor ke file Excel: ${filename}`
      );
    } catch (err: any) {
      console.error('Export Excel error in NilaiSiswa:', err);
      showToast('error', 'Gagal Ekspor Excel', err?.message || 'Terjadi kesalahan saat mengunduh file Excel.');
    }
  };

  // Check if there are any stored grades for this class and mapel in AppContext
  const hasExistingGrades = useMemo(() => {
    if (!selectedClass || !selectedMapel) return false;
    return nilais.some(
      (n) =>
        n.kelas === selectedClass &&
        n.mapel === selectedMapel &&
        (!n.guruId || !currentTeacher?.id || n.guruId === currentTeacher.id)
    );
  }, [nilais, selectedClass, selectedMapel, currentTeacher]);

  // Modal konfirmasi hapus semua nilai
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Handler Hapus Semua Nilai (sinkron ke Rekap & Laporan)
  const handleDeleteAllGrades = (scope: 'class' | 'all') => {
    if (scope === 'class') {
      // 1. Kosongkan nilai lokal
      setStudentScores({});

      // 2. Hapus kolom & localStorage config untuk kelas & mapel ini
      setColumns([]);
      if (configStorageKey) {
        try {
          localStorage.removeItem(configStorageKey);
        } catch {
          // ignore
        }
      }
      try {
        const prefix = `nilai_cols_${selectedClass}_${selectedMapel}`;
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith(prefix)) {
            localStorage.removeItem(k);
          }
        });
      } catch {
        // ignore
      }

      // 3. Hapus data nilai di AppContext & storage (otomatis tersinkron ke Rekap & Laporan)
      deleteNilaiByFilter(selectedClass, selectedMapel, selectedSemester);

      showToast(
        'success',
        'Nilai Siswa Berhasil Dihapus!',
        `Semua data nilai kelas ${selectedClass} (${selectedMapel}) telah dihapus dan langsung disinkronkan ke Rekap & Laporan.`
      );
    } else {
      // Hapus seluruh nilai semua kelas
      setStudentScores({});
      setColumns([]);
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('nilai_cols_')) {
            localStorage.removeItem(k);
          }
        });
      } catch {
        // ignore
      }
      deleteAllNilai();

      showToast(
        'success',
        'Seluruh Nilai Berhasil Dihapus!',
        'Semua data penilaian di seluruh kelas dan mata pelajaran telah dibersihkan.'
      );
    }

    setShowDeleteConfirmModal(false);
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

    // Get existing active columns from actual saved nilais records (prevents stale ghost columns)
    const existingActiveCols = resolveAssessmentColumns(
      nilais,
      modalKelas,
      targetMapel,
      selectedSemester,
      currentTeacher?.id
    );

    const combinedCols: AssessmentCol[] =
      existingActiveCols.length > 0
        ? [...existingActiveCols, ...newAddedCols]
        : [...newAddedCols];

    // Persist columns
    saveColumnsToStorage(combinedCols, targetKey);

    // Set active filters to newly created assessment
    setSelectedClass(modalKelas);
    setSelectedMapel(targetMapel);
    try {
      localStorage.setItem(
        'BAG_active_nilai_filter',
        JSON.stringify({ kelas: modalKelas, mapel: targetMapel, semester: selectedSemester })
      );
    } catch {
      // ignore
    }

    // Update student scores sorted A-Z
    const studentsInTargetClass = siswas
      .filter((s) => s.kelas === modalKelas)
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

    const itemsToSave: NilaiSiswaItem[] = studentsInTargetClass.map((student) => {
      const existing = nilais.find(
        (n) =>
          n.siswaId === student.id &&
          n.kelas === modalKelas &&
          n.mapel === targetMapel &&
          n.semester === selectedSemester &&
          (!n.guruId || !currentTeacher?.id || n.guruId === currentTeacher.id)
      );

      // Merge saved customScores and any current local studentScores
      const currentCustom: Record<string, number> = {
        ...(existing?.customScores || {}),
        ...(modalKelas === selectedClass && targetMapel === selectedMapel ? (studentScores[student.id] || {}) : {})
      };

      // Apply newly inputted scores for these new columns
      newAddedCols.forEach((col, idx) => {
        const studentRow = modalStudentScores[student.id];
        const val = studentRow && studentRow[idx] !== undefined ? studentRow[idx] : 0;
        currentCustom[col.id] = val;
      });

      const allActiveCols = combinedCols;
      const formatifCols = allActiveCols.filter((c: any) => c.jenis === 'formatif');
      const sumatifCols = allActiveCols.filter((c: any) => c.jenis === 'sumatif');

      const f1 = formatifCols.length > 0 ? (currentCustom[formatifCols[0].id] ?? 0) : 0;
      const f2 = formatifCols.length > 1 ? (currentCustom[formatifCols[1].id] ?? 0) : 0;
      const f3 = formatifCols.length > 2 ? (currentCustom[formatifCols[2].id] ?? 0) : 0;
      const sts = sumatifCols.length > 0 ? (currentCustom[sumatifCols[0].id] ?? 0) : 0;
      const sas = sumatifCols.length > 1 ? (currentCustom[sumatifCols[1].id] ?? 0) : 0;

      // Only keep scores for allActiveCols to avoid residual orphaned scores
      const filteredCustom: Record<string, number> = {};
      allActiveCols.forEach((col) => {
        if (currentCustom[col.id] !== undefined) {
          filteredCustom[col.id] = currentCustom[col.id];
        }
      });

      return {
        id: existing ? existing.id : `nil-${student.id}-${Date.now()}`,
        guruId: currentTeacher?.id,
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
        customScores: filteredCustom,
        assessmentCols: allActiveCols
      };
    });

    saveNilaiBatch(itemsToSave);

    // Update local state scores
    setStudentScores((prev) => {
      const next = { ...prev };
      studentsInTargetClass.forEach((s) => {
        const studentRow = { ...(next[s.id] || {}) };
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

  // Rename a column inline (immediately syncs to localStorage and AppContext so Rekap & Leger Nilai matches)
  const handleRenameColumn = (colId: string, newName: string) => {
    const nextCols = columns.map((c) => (c.id === colId ? { ...c, nama: newName } : c));
    saveColumnsToStorage(nextCols);
    if (selectedClass && selectedMapel && nextCols.length > 0) {
      persistScoresToContext(selectedClass, selectedMapel, selectedSemester, nextCols, studentScores);
    }
  };

  const handleBlurColumnName = (col: AssessmentCol, index: number) => {
    if (!col.nama || !col.nama.trim()) {
      const fallbackName = `${col.jenis === 'sumatif' ? 'Sumatif' : 'Formatif'} ${index + 1}`;
      handleRenameColumn(col.id, fallbackName);
    }
  };

  // Delete a column if needed (immediately syncs to AppContext so Rekap & Leger Nilai matches)
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

        if (nextCols.length === 0) {
          setStudentScores({});
          deleteNilaiByFilter(selectedClass, selectedMapel, selectedSemester);
        } else {
          const updatedScores: Record<string, Record<string, number>> = {};
          Object.entries(studentScores).forEach(([sId, rowObj]) => {
            const copy = { ...rowObj };
            delete copy[colId];
            updatedScores[sId] = copy;
          });
          setStudentScores(updatedScores);
          persistScoresToContext(selectedClass, selectedMapel, selectedSemester, nextCols, updatedScores);
        }

        showToast('info', 'Kolom Dihapus', `Kolom ${colToDelete?.nama || ''} telah dihapus dan disinkronkan.`);
      }
    });
  };

  // Summary stats for currently displayed class & subject using shared single-source-of-truth recap
  const recapData = useMemo(
    () =>
      computeClassGradeRecap({
        siswas,
        nilais,
        kelas: selectedClass,
        mapel: selectedMapel,
        semester: selectedSemester,
        guruId: currentTeacher?.id,
        kkm: schoolSettings.kkmDefault,
        columnsOverride: columns,
        studentScoresOverride: studentScores
      }),
    [siswas, nilais, selectedClass, selectedMapel, selectedSemester, currentTeacher?.id, schoolSettings.kkmDefault, columns, studentScores]
  );

  const studentsCount = recapData.studentsCount;
  const gradedList = recapData.gradedList;
  const classAvg = recapData.classAvg;
  const passedStudents = recapData.passedCount;
  const passRate = recapData.passRate;

  // Saved class/mapel pairs for quick 1-click access
  const savedGradeGroups = useMemo(() => {
    const groups = new Map<string, { kelas: string; mapel: string; semester: 'Ganjil' | 'Genap'; count: number }>();
    nilais.forEach((n) => {
      if (!n.kelas || !n.mapel) return;
      if (n.guruId && currentTeacher?.id && n.guruId !== currentTeacher.id) return;
      const sem = (n.semester || 'Ganjil') as 'Ganjil' | 'Genap';
      const key = `${n.kelas}_${n.mapel}_${sem}`;
      const hasAnyScore =
        (n.customScores && Object.values(n.customScores).some((v) => Number(v) > 0)) ||
        n.formatif1 > 0 ||
        n.formatif2 > 0 ||
        n.formatif3 > 0 ||
        n.sts > 0 ||
        n.sas > 0;
      if (hasAnyScore) {
        const cur = groups.get(key) || { kelas: n.kelas, mapel: n.mapel, semester: sem, count: 0 };
        cur.count += 1;
        groups.set(key, cur);
      }
    });
    return Array.from(groups.values());
  }, [nilais, currentTeacher?.id]);

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

              {isFilterActive && (columns.length > 0 || hasExistingGrades) && (
                <>
                  {columns.length > 0 && (
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
                  )}
                  {columns.length > 0 && (
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
                  )}
                  {columns.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      id="btn-export-excel-nilai"
                      onClick={handleExportExcel}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition cursor-pointer"
                      title="Ekspor nilai siswa ke format Excel asli (.xlsx - bukan CSV)"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Ekspor Excel (.xlsx)</span>
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    id="btn-hapus-semua-nilai"
                    type="button"
                    onClick={() => setShowDeleteConfirmModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 shadow-xs transition cursor-pointer"
                    title="Hapus semua nilai siswa dan kosongkan data"
                  >
                    <Trash2 className="h-4 w-4 text-rose-600" />
                    <span>Hapus Semua Nilai</span>
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
                onChange={(e) => {
                  const newKelas = e.target.value;
                  setSelectedClass(newKelas);
                  if (newKelas) {
                    // If current mapel is empty or has no grades in newKelas, auto-select mapel that has saved grades for newKelas
                    const hasCurrent =
                      selectedMapel &&
                      getSavedNilaisForFilter(nilais, newKelas, selectedMapel, selectedSemester, currentTeacher?.id).length > 0;
                    if (!hasCurrent) {
                      const matchedGroup = savedGradeGroups.find((g) => g.kelas === newKelas);
                      if (matchedGroup && availableMapels.includes(matchedGroup.mapel)) {
                        setSelectedMapel(matchedGroup.mapel);
                        setSelectedSemester(matchedGroup.semester);
                      }
                    }
                  }
                }}
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
                onChange={(e) => {
                  const newMapel = e.target.value;
                  setSelectedMapel(newMapel);
                  if (newMapel && !selectedClass) {
                    const matchedGroup = savedGradeGroups.find((g) => g.mapel === newMapel);
                    if (matchedGroup && availableClasses.includes(matchedGroup.kelas)) {
                      setSelectedClass(matchedGroup.kelas);
                      setSelectedSemester(matchedGroup.semester);
                    }
                  }
                }}
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
                      {passedStudents}/{gradedList.length || 0} Siswa Dinilai ({passRate}%)
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
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              {savedGradeGroups.length > 0 ? (
                savedGradeGroups.map((grp) => (
                  <button
                    key={`${grp.kelas}_${grp.mapel}_${grp.semester}`}
                    type="button"
                    onClick={() => {
                      setSelectedClass(grp.kelas);
                      setSelectedMapel(grp.mapel);
                      setSelectedSemester(grp.semester);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4 text-emerald-100" />
                    <span>
                      Buka Nilai Tersimpan: Kelas {grp.kelas} | {grp.mapel} ({grp.count} Siswa)
                    </span>
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClass(availableClasses[0] || '7A');
                    setSelectedMapel(availableMapels[0] || 'Matematika');
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-xs hover:bg-emerald-50 transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <span>
                    Pilih Otomatis: Kelas {availableClasses[0] || '7A'} | {availableMapels[0] || 'Matematika'}
                  </span>
                </button>
              )}
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
          <div className="no-print flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" /> Kolom Penilaian Aktif
              </span>
              <span className="text-xs text-slate-500">
                {columns.length} kolom ({columns.filter((c) => c.jenis === 'formatif').length} Formatif, {columns.filter((c) => c.jenis === 'sumatif').length} Sumatif)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-table-export-excel"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
                title="Ekspor tabel nilai siswa ini ke file Excel (.xlsx)"
              >
                <Download className="h-3.5 w-3.5 text-emerald-700" />
                <span>Ekspor Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                id="btn-table-hapus-nilai"
                onClick={() => setShowDeleteConfirmModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
                title="Hapus semua nilai siswa dan kosongkan tabel"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                <span>Hapus Semua Nilai</span>
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                  {/* BARIS 1: NO, NISN, NAMA LENGKAP SISWA, PENILAIAN, RATA-RATA, STATUS KKM */}
                  <tr className="border-b border-slate-200">
                    <th rowSpan={3} className="px-3 py-3.5 text-center w-12 border-r border-slate-200">No</th>
                    <th rowSpan={3} className="px-3.5 py-3.5 text-left w-36 border-r border-slate-200">NISN</th>
                    <th rowSpan={3} className="px-4 py-3.5 text-left min-w-[200px] border-r border-slate-200">Nama Lengkap Siswa</th>

                    <th
                      colSpan={orderedCols.length}
                      className="px-3 py-2 text-center bg-emerald-50/90 text-emerald-950 border-b border-slate-200 font-extrabold uppercase tracking-wider text-xs"
                    >
                      Penilaian
                    </th>

                    <th rowSpan={3} className="px-3 py-3.5 text-center w-28 bg-emerald-100/60 text-emerald-950 font-bold border-l border-r border-slate-200">
                      Rata-Rata
                    </th>
                    <th rowSpan={3} className="px-3 py-3.5 text-center w-28 bg-slate-100/60 text-slate-900 font-bold">
                      Status KKM
                    </th>
                  </tr>

                  {/* BARIS 2: FORMATIF | SUMATIF */}
                  <tr className="border-b border-slate-200 text-xs font-bold">
                    {formatifCols.length > 0 && (
                      <th
                        colSpan={formatifCols.length}
                        className={`px-3 py-1.5 text-center bg-emerald-100/80 text-emerald-900 border-b border-slate-200 uppercase tracking-wide ${
                          sumatifCols.length > 0 ? 'border-r' : ''
                        }`}
                      >
                        FORMATIF
                      </th>
                    )}
                    {sumatifCols.length > 0 && (
                      <th
                        colSpan={sumatifCols.length}
                        className="px-3 py-1.5 text-center bg-blue-100/80 text-blue-900 border-b border-slate-200 uppercase tracking-wide"
                      >
                        SUMATIF
                      </th>
                    )}
                  </tr>

                  {/* BARIS 3: NAMA-NAMA PENILAIAN (BISA DIUBAH LANGSUNG) */}
                  <tr className="border-b border-slate-200 text-[11px]">
                    {orderedCols.map((col, idx) => (
                      <th
                        key={col.id}
                        className={`px-2.5 py-2 text-center min-w-[140px] ${
                          idx < orderedCols.length - 1 ? 'border-r border-slate-200' : ''
                        } ${col.jenis === 'formatif' ? 'bg-emerald-50/40' : 'bg-blue-50/40'}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            value={col.nama}
                            onChange={(e) => handleRenameColumn(col.id, e.target.value)}
                            onBlur={() => handleBlurColumnName(col, idx)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            placeholder={`Nama ${col.jenis === 'sumatif' ? 'Sumatif' : 'Formatif'}`}
                            title="Klik untuk mengubah nama penilaian"
                            className="w-full min-w-[95px] max-w-[150px] rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 bg-white/70 focus:bg-white px-2 py-1 text-center font-bold text-slate-800 text-[11px] leading-tight focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteColumn(col.id)}
                            title="Hapus kolom ini"
                            className="no-print shrink-0 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={orderedCols.length + 5} className="py-12 text-center text-xs text-slate-400">
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
                          {orderedCols.map((col) => {
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
                                  value={val !== undefined && val > 0 ? val : ''}
                                  placeholder="-"
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
      {/* MODAL: TAMBAH PENILAIAN SISWA (ENLARGED & SPACIOUS POP-UP) */}
      {/* Format: Kelas, Jenis Penilaian (formatif/sumatif), Jumlah Penilaian 1-10 */}
      {/* ------------------------------------------------------------------ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-5xl xl:max-w-6xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[94vh] flex flex-col my-auto transition-all animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-2xs shrink-0">
                  <PlusCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Tambah Penilaian Siswa</h3>
                  <p className="text-xs text-slate-500">
                    Konfigurasi penilaian berdasarkan mata pelajaran, rombel kelas, jenis (Formatif/Sumatif), dan entri nilai massal peserta didik.
                  </p>
                </div>
              </div>
              <button
                id="btn-close-modal-add-nilai"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                title="Tutup jendela"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalAssessment} className="mt-4 flex-1 flex flex-col overflow-hidden">
              <div className="space-y-4 pr-1 overflow-y-auto custom-scrollbar">
                {/* 1. Configuration Grid: MAPEL, KELAS, JENIS, JUMLAH PENILAIAN */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                  {/* Pilihan Mata Pelajaran */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      1. Mata Pelajaran <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={modalMapel}
                      onChange={(e) => setModalMapel(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none shadow-2xs"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      2. Kelas / Rombel <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={modalKelas}
                      onChange={(e) => handleModalKelasChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none shadow-2xs"
                    >
                      {availableClasses.map((k) => (
                        <option key={k} value={k}>
                          Kelas {k} ({siswas.filter((s) => s.kelas === k).length} Siswa)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pilihan Jenis Penilaian (Formatif / Sumatif) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      3. Jenis Penilaian <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleJenisChange('formatif')}
                        className={`rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                          modalJenis === 'formatif'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>Formatif</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleJenisChange('sumatif')}
                        className={`rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                          modalJenis === 'sumatif'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>Sumatif</span>
                      </button>
                    </div>
                  </div>

                  {/* Pilihan Jumlah Penilaian (1 - 10) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700">
                        4. Jumlah Kolom <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-bold text-emerald-700">
                        {modalJumlah} Kolom
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleJumlahChange(num)}
                          className={`h-8 w-8 rounded-lg font-bold text-xs transition cursor-pointer border ${
                            modalJumlah === num
                              ? modalJenis === 'formatif'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-105'
                                : 'bg-blue-600 text-white border-blue-600 shadow-xs scale-105'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. DOKUMEN / KOLOM NAMA PENILAIAN SESUAI JUMLAH */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-800">
                      Nama / Keterangan Penilaian ({modalJumlah} Kolom Terpilih):
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Sesuaikan nama tugas, kuis, latihan, atau TP materi Anda di bawah ini
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {modalAssessmentNames.map((nama, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/60 p-1.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
                          P{idx + 1}
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
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. KOLOM PENILAIAN SISWA (LEBAR & LEGA) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Entri Nilai Peserta Didik — Kelas {modalKelas}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Total {siswas.filter((s) => s.kelas === modalKelas).length} siswa terdaftar di rombel ini
                      </p>
                    </div>

                    {/* Quick fill all default score */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                      <span className="text-xs font-semibold text-slate-600">Isi Nilai Standar Cepat:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={modalDefaultScore}
                        onChange={(e) => setModalDefaultScore(Number(e.target.value))}
                        className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={handleApplyModalDefaultScore}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-2xs"
                      >
                        Terapkan ke Semua
                      </button>
                    </div>
                  </div>

                  {/* Student Table with Expanded Height and Width */}
                  <div className="max-h-[380px] overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/90 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10 backdrop-blur-xs">
                        <tr>
                          <th className="px-4 py-2.5 w-12 text-center">No</th>
                          <th className="px-4 py-2.5 min-w-[200px]">Nama Lengkap Peserta Didik</th>
                          {modalAssessmentNames.map((name, i) => (
                            <th key={i} className="px-2 py-2.5 text-center min-w-[85px]" title={name}>
                              <div className="flex flex-col items-center">
                                <span className="font-extrabold text-emerald-800">P{i + 1}</span>
                                <span className="text-[10px] font-normal text-slate-500 max-w-[75px] truncate">
                                  {name || `Penilaian ${i + 1}`}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {siswas
                          .filter((s) => s.kelas === modalKelas)
                          .sort((a, b) => a.nama.localeCompare(b.nama, 'id'))
                          .map((siswa, idx) => {
                            const rowScores = modalStudentScores[siswa.id] || [];

                            return (
                              <tr key={siswa.id} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="px-4 py-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                                <td className="px-4 py-2 font-bold text-slate-800 whitespace-nowrap">
                                  {siswa.nama}
                                </td>
                                {modalAssessmentNames.map((_, i) => (
                                  <td key={i} className="px-2 py-1.5 text-center">
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
                                      className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-xs font-extrabold text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
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

              {/* Modal Actions Footer */}
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                    Kelas: {modalKelas}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                    Jenis: {modalJenis === 'formatif' ? 'Formatif' : 'Sumatif'}
                  </span>
                  <span className="rounded-lg bg-emerald-100 px-2.5 py-1 font-bold text-emerald-800">
                    {modalJumlah} Kolom Penilaian
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    id="btn-submit-tambah-nilai"
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Simpan & Terapkan Penilaian</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS SEMUA NILAI */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Semua Nilai Siswa?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tindakan ini akan menghapus nilai siswa yang telah diinput dan mengosongkan kolom penilaian.
                  Data di menu <strong>Rekap & Laporan</strong> akan langsung disinkronkan secara otomatis.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0" /> Informasi Penghapusan & Sinkronisasi:
              </p>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-900/90 font-medium">
                <li>Kelas: <span className="font-bold text-slate-800">{selectedClass || 'Semua'}</span></li>
                <li>Mata Pelajaran: <span className="font-bold text-slate-800">{selectedMapel || 'Semua'}</span></li>
                <li>Semester: <span className="font-bold text-slate-800">{selectedSemester}</span></li>
                <li>Data rekap & leger nilai siswa pada menu Rekap & Laporan akan langsung dikosongkan.</li>
              </ul>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                id="btn-confirm-delete-class-grades"
                onClick={() => handleDeleteAllGrades('class')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm shadow-rose-200 transition cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Hapus Nilai Kelas {selectedClass} ({selectedMapel})</span>
              </button>

              <button
                type="button"
                id="btn-confirm-delete-all-grades"
                onClick={() => handleDeleteAllGrades('all')}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              >
                <span>Hapus Seluruh Data Nilai (Semua Kelas)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

