import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  GraduationCap,
  BookOpenCheck,
  CheckCircle2,
  PieChart,
  AlertCircle,
  Download
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { printWebDocument } from '../../utils/printHelper';

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

export const RekapLaporan: React.FC = () => {
  const {
    currentTeacher,
    siswas,
    absensis,
    nilais,
    jurnals,
    jadwals,
    protas,
    schoolSettings,
    showToast,
    mapels,
    setActiveMenu
  } = useApp();

  const [activeTab, setActiveTab] = useState<'absensi' | 'nilai' | 'jurnal'>('nilai');

  // Available classes: strictly classes taught by current teacher
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
      nilais.filter((n) => n.guruId === currentTeacher.id).forEach((n) => n.kelas && set.add(n.kelas.trim()));
    }
    // Fallback only if teacher profile has no classes configured at all
    if (set.size === 0) {
      if (siswas && siswas.length > 0) {
        siswas.forEach((s) => s.kelas && set.add(s.kelas));
      }
      if (set.size === 0) {
        ['7A', '7B', '8A', '8B', '9A', '9B'].forEach((k) => set.add(k));
      }
    }
    return Array.from(set).sort();
  }, [currentTeacher?.kelasDiampu, currentTeacher?.id, jadwals, nilais, siswas]);

  const [selectedClass, setSelectedClass] = useState<string>(availableClasses[0] || '7A');

  // Available subjects: strictly subjects taught by current teacher
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
      nilais.filter((n) => n.guruId === currentTeacher.id).forEach((n) => n.mapel && set.add(n.mapel.trim()));
    }
    // Fallback only if teacher has no subject configured at all
    if (set.size === 0) {
      if (mapels && mapels.length > 0) {
        mapels.forEach((m) => m.nama && set.add(m.nama.trim()));
      }
      STANDARD_MAPEL_LIST.forEach((m) => set.add(m));
    }
    return Array.from(set).filter(Boolean);
  }, [currentTeacher?.mapelList, currentTeacher?.mapel, currentTeacher?.id, jadwals, nilais, mapels]);

  const [selectedMapel, setSelectedMapel] = useState<string>(() => {
    if (currentTeacher?.mapel && currentTeacher.mapel !== 'Mata Pelajaran') {
      return currentTeacher.mapel.split(',')[0].trim();
    }
    return 'Informatika';
  });

  // Keep selectedClass synchronized with teacher's assigned classes
  React.useEffect(() => {
    if (availableClasses.length > 0 && !availableClasses.includes(selectedClass)) {
      setSelectedClass(availableClasses[0]);
    }
  }, [availableClasses, selectedClass]);

  // Keep selectedMapel synchronized with teacher's assigned subjects
  React.useEffect(() => {
    if (availableMapels.length > 0 && !availableMapels.includes(selectedMapel)) {
      setSelectedMapel(availableMapels[0]);
    }
  }, [availableMapels, selectedMapel]);

  const classStudents = useMemo(() => {
    return siswas
      .filter((s) => s.kelas === selectedClass)
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
  }, [siswas, selectedClass]);
  const teacherAbsensis = absensis.filter(
    (a) => a.guruId === currentTeacher?.id && a.kelas === selectedClass
  );

  // Target Mata Pelajaran
  const targetMapel = selectedMapel || currentTeacher?.mapel || availableMapels[0] || '';

  // Ambil konfigurasi penilaian formatif & sumatif SESUAI YANG DIATUR/DISIMPAN OLEH GURU
  // PENTING: Jika guru hanya membuat sumatif (tanpa formatif), formatif HARUS KOSONG ([]).
  // Jangan sekali-kali menginjeksi default formatif jika guru hanya menginput sumatif!
  const assessmentCols = useMemo(() => {
    try {
      const activeKey = `nilai_cols_${selectedClass}_${targetMapel}_${schoolSettings.activeSemester}`;
      const raw = localStorage.getItem(activeKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const formatif = parsed.filter((c: any) => c.jenis === 'formatif');
          const sumatif = parsed.filter((c: any) => c.jenis === 'sumatif');
          return {
            formatif,
            sumatif
          };
        }
      }

      // Cek apakah ada key tanpa suffix semester
      const matchPrefix = `nilai_cols_${selectedClass}_${targetMapel}`;
      const matchingKeys = Object.keys(localStorage).filter((k) => k.startsWith(matchPrefix));
      if (matchingKeys.length > 0) {
        const raw2 = localStorage.getItem(matchingKeys[0]);
        if (raw2) {
          const parsed2 = JSON.parse(raw2);
          if (Array.isArray(parsed2) && parsed2.length > 0) {
            const formatif = parsed2.filter((c: any) => c.jenis === 'formatif');
            const sumatif = parsed2.filter((c: any) => c.jenis === 'sumatif');
            return {
              formatif,
              sumatif
            };
          }
        }
      }
    } catch {
      // fallback
    }

    // Jika tidak ada konfigurasi di localStorage, periksa langsung data `nilais` yang tersimpan
    const savedForClass = nilais.filter(
      (item) =>
        item.kelas === selectedClass &&
        (!targetMapel || item.mapel === targetMapel) &&
        item.semester === schoolSettings.activeSemester
    );

    if (savedForClass.length > 0) {
      const formatifCols: Array<{ id: string; nama: string; jenis: 'formatif' }> = [];
      const sumatifCols: Array<{ id: string; nama: string; jenis: 'sumatif' }> = [];
      const seenColIds = new Set<string>();

      savedForClass.forEach((item) => {
        const hasCustom = item.customScores && Object.keys(item.customScores).length > 0;
        if (hasCustom) {
          Object.keys(item.customScores!).forEach((k) => {
            if (!seenColIds.has(k)) {
              seenColIds.add(k);
              const lower = k.toLowerCase();
              if (lower.startsWith('sumatif') || lower.startsWith('sts') || lower.startsWith('sas')) {
                const label = k.startsWith('sumatif_') ? 'Sumatif' : k.toUpperCase();
                sumatifCols.push({ id: k, nama: label, jenis: 'sumatif' });
              } else if (lower.startsWith('formatif')) {
                const label = k.startsWith('formatif_') ? 'Formatif' : k.toUpperCase();
                formatifCols.push({ id: k, nama: label, jenis: 'formatif' });
              }
            }
          });
        } else {
          // Legacy fields: Hanya tambahkan jika customScores TIDAK ADA sama sekali
          if (typeof item.formatif1 === 'number' && item.formatif1 > 0 && !seenColIds.has('formatif1')) {
            seenColIds.add('formatif1');
            formatifCols.push({ id: 'formatif1', nama: 'Formatif 1 (TP 1)', jenis: 'formatif' });
          }
          if (typeof item.formatif2 === 'number' && item.formatif2 > 0 && !seenColIds.has('formatif2')) {
            seenColIds.add('formatif2');
            formatifCols.push({ id: 'formatif2', nama: 'Formatif 2 (TP 2)', jenis: 'formatif' });
          }
          if (typeof item.formatif3 === 'number' && item.formatif3 > 0 && !seenColIds.has('formatif3')) {
            seenColIds.add('formatif3');
            formatifCols.push({ id: 'formatif3', nama: 'Formatif 3 (TP 3)', jenis: 'formatif' });
          }
          if (typeof item.sts === 'number' && item.sts > 0 && !seenColIds.has('sts')) {
            seenColIds.add('sts');
            sumatifCols.push({ id: 'sts', nama: 'STS', jenis: 'sumatif' });
          }
          if (typeof item.sas === 'number' && item.sas > 0 && !seenColIds.has('sas')) {
            seenColIds.add('sas');
            sumatifCols.push({ id: 'sas', nama: 'SAS', jenis: 'sumatif' });
          }
        }
      });

      if (formatifCols.length > 0 || sumatifCols.length > 0) {
        return {
          formatif: formatifCols,
          sumatif: sumatifCols
        };
      }
    }

    // Default Kurikulum Merdeka HANYA jika kelas belum memiliki data sama sekali
    return {
      formatif: [
        { id: 'formatif1', nama: 'Formatif 1 (TP 1)', jenis: 'formatif' },
        { id: 'formatif2', nama: 'Formatif 2 (TP 2)', jenis: 'formatif' },
        { id: 'formatif3', nama: 'Formatif 3 (TP 3)', jenis: 'formatif' },
      ],
      sumatif: [
        { id: 'sts', nama: 'STS', jenis: 'sumatif' },
        { id: 'sas', nama: 'SAS', jenis: 'sumatif' },
      ]
    };
  }, [selectedClass, targetMapel, schoolSettings.activeSemester, nilais]);

  // Compute attendance stats per student
  const attendanceRecap = classStudents.map((siswa) => {
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alpa = 0;

    teacherAbsensis.forEach((sesi) => {
      const rec = sesi.records.find((r) => r.siswaId === siswa.id);
      if (rec) {
        if (rec.status === 'Hadir') hadir++;
        else if (rec.status === 'Sakit') sakit++;
        else if (rec.status === 'Izin') izin++;
        else if (rec.status === 'Alpa') alpa++;
      }
    });

    const totalSessions = teacherAbsensis.length || 1;
    const percent = Math.round((hadir / totalSessions) * 100);

    return {
      siswa,
      hadir,
      sakit,
      izin,
      alpa,
      totalSessions: teacherAbsensis.length,
      percent
    };
  });

  // Compute grade recap for class sesuai kolom formatif & sumatif yang diisi di menu nilai siswa
  const gradeRecap = classStudents.map((siswa) => {
    const n = nilais.find(
      (item) =>
        item.siswaId === siswa.id &&
        item.kelas === selectedClass &&
        (!targetMapel || item.mapel === targetMapel) &&
        item.semester === schoolSettings.activeSemester &&
        (!item.guruId || !currentTeacher?.id || item.guruId === currentTeacher.id)
    );

    // Nilai tiap kolom Formatif (HANYA MENCARI NILAI FORMATIF, TIDAK BOLEH MENGAMBIL NILAI SUMATIF)
    const formatifScores: Record<string, number | undefined> = {};
    assessmentCols.formatif.forEach((col: any) => {
      let val: number | undefined = undefined;
      if (n) {
        if (n.customScores && Object.keys(n.customScores).length > 0) {
          if (n.customScores[col.id] !== undefined) {
            const rawV = n.customScores[col.id];
            if (typeof rawV === 'number') val = rawV;
          }
        } else {
          if (col.id === 'formatif1' && typeof n.formatif1 === 'number' && n.formatif1 > 0) {
            val = n.formatif1;
          } else if (col.id === 'formatif2' && typeof n.formatif2 === 'number' && n.formatif2 > 0) {
            val = n.formatif2;
          } else if (col.id === 'formatif3' && typeof n.formatif3 === 'number' && n.formatif3 > 0) {
            val = n.formatif3;
          }
        }
      }
      formatifScores[col.id] = val;
    });

    // Nilai tiap kolom Sumatif (HANYA MENCARI NILAI SUMATIF)
    const sumatifScores: Record<string, number | undefined> = {};
    assessmentCols.sumatif.forEach((col: any, sIdx: number) => {
      let val: number | undefined = undefined;
      if (n) {
        if (n.customScores && n.customScores[col.id] !== undefined) {
          const rawV = n.customScores[col.id];
          if (typeof rawV === 'number') val = rawV;
        } else if ((col.id === 'sts' || col.nama.toLowerCase().includes('sts') || sIdx === 0) && typeof n.sts === 'number' && n.sts > 0) {
          val = n.sts;
        } else if ((col.id === 'sas' || col.nama.toLowerCase().includes('sas') || sIdx === 1) && typeof n.sas === 'number' && n.sas > 0) {
          val = n.sas;
        }
      }
      sumatifScores[col.id] = val;
    });

    // Periksa apakah siswa memiliki nilai yang valid terinput
    const fVals = Object.values(formatifScores).filter((v): v is number => typeof v === 'number' && v > 0);
    const sVals = Object.values(sumatifScores).filter((v): v is number => typeof v === 'number' && v > 0);
    const hasScore = fVals.length > 0 || sVals.length > 0;

    if (!hasScore) {
      return {
        siswa,
        hasScore: false,
        formatifScores,
        sumatifScores,
        avgF: 0,
        stsVal: 0,
        sasVal: 0,
        finalScore: 0,
        isPassed: false
      };
    }

    let finalScore = 0;
    const avgF = fVals.length > 0 ? Math.round(fVals.reduce((a, b) => a + b, 0) / fVals.length) : 0;
    const stsVal = (typeof sumatifScores['sts'] === 'number' ? sumatifScores['sts'] : undefined) ?? sVals[0] ?? 0;
    const sasVal = (typeof sumatifScores['sas'] === 'number' ? sumatifScores['sas'] : undefined) ?? sVals[1] ?? stsVal;

    if (fVals.length > 0 && sVals.length > 0) {
      // Guru mengisi Formatif dan Sumatif -> pembobotan resmi Kurikulum Merdeka
      const wF = schoolSettings.gradingWeight.formatif / 100;
      const wSts = schoolSettings.gradingWeight.sts / 100;
      const wSas = schoolSettings.gradingWeight.sas / 100;
      finalScore = Math.round(avgF * wF + stsVal * wSts + sasVal * wSas);
    } else if (sVals.length > 0) {
      // Guru HANYA mengisi Sumatif -> nilai akhir adalah rerata nilai sumatif
      finalScore = Math.round(sVals.reduce((a, b) => a + b, 0) / sVals.length);
    } else if (fVals.length > 0) {
      // Guru HANYA mengisi Formatif -> nilai akhir adalah rerata formatif
      finalScore = avgF;
    }

    return {
      siswa,
      hasScore: true,
      formatifScores,
      sumatifScores,
      avgF,
      stsVal,
      sasVal,
      finalScore,
      isPassed: finalScore >= schoolSettings.kkmDefault
    };
  });

  // Sort grade recap: students with recorded scores on top, ordered by score descending
  gradeRecap.sort((a, b) => {
    if (a.hasScore && !b.hasScore) return -1;
    if (!a.hasScore && b.hasScore) return 1;
    return b.finalScore - a.finalScore;
  });

  const gradedList = gradeRecap.filter((g) => g.hasScore);
  const avgClassGrade = gradedList.length > 0
    ? Math.round(gradedList.reduce((sum, g) => sum + g.finalScore, 0) / gradedList.length)
    : 0;
  const passRate = gradedList.length > 0
    ? Math.round((gradedList.filter((g) => g.isPassed).length / gradedList.length) * 100)
    : 0;
  const avgAttendanceRate = Math.round(
    attendanceRecap.reduce((sum, a) => sum + a.percent, 0) / (attendanceRecap.length || 1)
  );

  // Journal recap for class
  const classJurnals = jurnals.filter(
    (j) => j.guruId === currentTeacher?.id && j.kelas === selectedClass
  );

  // Handler Ekspor ke Excel (.xlsx resmi - bukan CSV)
  const handleExportExcel = () => {
    try {
      if (activeTab === 'absensi') {
        // Ekspor Rekap Presensi Siswa ke Excel
        const wb = XLSX.utils.book_new();
        const rows: any[][] = [];

        rows.push([schoolSettings.schoolName.toUpperCase()]);
        rows.push([`REKAPITULASI PRESENSI SISWA KELAS ${selectedClass}`]);
        rows.push([`Mata Pelajaran: ${targetMapel} | Tahun Ajaran: ${schoolSettings.academicYear} (${schoolSettings.activeSemester})`]);
        rows.push([`Guru Pengampu: ${currentTeacher?.nama || '-'} (NIP. ${currentTeacher?.nip || '-'})`]);
        rows.push([`Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`]);
        rows.push([]);

        // Header
        rows.push(['No', 'NISN', 'Nama Lengkap Siswa', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Total Pertemuan', 'Persentase Kehadiran (%)', 'Keterangan']);

        attendanceRecap.forEach((item, idx) => {
          rows.push([
            idx + 1,
            item.siswa.nisn,
            item.siswa.nama,
            item.hadir,
            item.sakit,
            item.izin,
            item.alpa,
            item.totalSessions,
            item.percent,
            item.percent >= 85 ? 'Baik' : item.percent >= 75 ? 'Cukup' : 'Perlu Perhatian'
          ]);
        });

        rows.push([]);
        rows.push(['Rata-Rata Kehadiran Kelas', '', '', '', '', '', '', '', `${avgAttendanceRate}%`]);

        const ws = XLSX.utils.aoa_to_sheet(rows);

        ws['!cols'] = [
          { wch: 6 },
          { wch: 16 },
          { wch: 32 },
          { wch: 10 },
          { wch: 10 },
          { wch: 10 },
          { wch: 10 },
          { wch: 18 },
          { wch: 24 },
          { wch: 20 },
        ];

        XLSX.utils.book_append_sheet(wb, ws, `Presensi_${selectedClass}`);
        const filename = `Rekap_Presensi_Kelas_${selectedClass}_${targetMapel.replace(/[^a-zA-Z0-9]/g, '_')}_${schoolSettings.activeSemester}.xlsx`;
        XLSX.writeFile(wb, filename);

        showToast(
          'success',
          'Berhasil Ekspor Excel (.xlsx)!',
          `File presensi kelas ${selectedClass} berhasil diunduh dalam format Excel: ${filename}`
        );
        return;
      }

      // Default / Tab Nilai: Ekspor LEGER NILAI SISWA (Kurikulum Merdeka 3 Baris Header)
      if (gradedList.length === 0) {
        showToast(
          'warning',
          'Belum Ada Nilai Tersimpan',
          `Tidak ada data penilaian untuk diekspor pada kelas ${selectedClass} (${targetMapel}). Silakan input nilai terlebih dahulu.`
        );
        return;
      }

      const wb = XLSX.utils.book_new();
      const rows: any[][] = [];

      // Kop Laporan
      rows.push([schoolSettings.schoolName.toUpperCase()]);
      rows.push([`LAPORAN HASIL PENILAIAN SISWA (LEGER NILAI) KELAS ${selectedClass}`]);
      rows.push([`Mata Pelajaran: ${targetMapel} | Tahun Ajaran: ${schoolSettings.academicYear} (${schoolSettings.activeSemester})`]);
      rows.push([`Guru Pengampu: ${currentTeacher?.nama || '-'} (NIP. ${currentTeacher?.nip || '-'})`]);
      rows.push([`KKM Ketuntasan: ${schoolSettings.kkmDefault} | Tanggal Unduh: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}`]);
      rows.push([]);

      // BARIS 1: NO, NISN, NAMA SISWA, PENILAIAN (spanning formatif + sumatif), NILAI AKHIR, STATUS KKM
      const row1: any[] = ['No', 'NISN', 'Nama Lengkap Siswa'];
      const totalEvalCols = assessmentCols.formatif.length + assessmentCols.sumatif.length;
      if (totalEvalCols > 0) {
        row1.push('PENILAIAN');
        for (let i = 1; i < totalEvalCols; i++) {
          row1.push('');
        }
      } else {
        row1.push('PENILAIAN');
      }
      row1.push('Nilai Akhir');
      row1.push('Status KKM');
      rows.push(row1);

      // BARIS 2: Blank for No/NISN/Nama, FORMATIF (spanning if exists), SUMATIF (spanning if exists), blank for NA/Status
      const row2: any[] = ['', '', ''];
      const fLen = assessmentCols.formatif.length;
      const sLen = assessmentCols.sumatif.length;
      if (fLen > 0) {
        row2.push('FORMATIF');
        for (let i = 1; i < fLen; i++) {
          row2.push('');
        }
      }
      if (sLen > 0) {
        row2.push('SUMATIF');
        for (let i = 1; i < sLen; i++) {
          row2.push('');
        }
      }
      if (fLen === 0 && sLen === 0) {
        row2.push('-');
      }
      row2.push('');
      row2.push('');
      rows.push(row2);

      // BARIS 3: Blank for No/NISN/Nama, Formatif items, Sumatif items, blank for NA/Status
      const row3: any[] = ['', '', ''];
      assessmentCols.formatif.forEach((c: any) => row3.push(c.nama));
      assessmentCols.sumatif.forEach((c: any) => row3.push(c.nama));
      if (fLen === 0 && sLen === 0) {
        row3.push('-');
      }
      row3.push('');
      row3.push('');
      rows.push(row3);

      // DATA SISWA
      gradeRecap.forEach((item, idx) => {
        const studentRow: any[] = [
          idx + 1,
          item.siswa.nisn,
          item.siswa.nama
        ];

        // Formatif scores
        assessmentCols.formatif.forEach((c: any) => {
          const score = item.formatifScores[c.id];
          studentRow.push(typeof score === 'number' && score > 0 ? score : (item.hasScore ? 0 : '-'));
        });

        // Sumatif scores
        assessmentCols.sumatif.forEach((c: any) => {
          const score = item.sumatifScores[c.id];
          studentRow.push(typeof score === 'number' && score > 0 ? score : (item.hasScore ? 0 : '-'));
        });

        if (fLen === 0 && sLen === 0) {
          studentRow.push('-');
        }

        // Nilai Akhir & Status
        studentRow.push(item.hasScore ? item.finalScore : '-');
        studentRow.push(item.hasScore ? (item.isPassed ? 'Tuntas' : 'Belum Tuntas (Bimbingan)') : 'Belum Dinilai');

        rows.push(studentRow);
      });

      // STATISTIK KELAS DI BAGIAN BAWAH
      rows.push([]);
      rows.push(['STATISTIK PENILAIAN KELAS', '', '']);
      rows.push(['Rata-Rata Nilai Akhir Kelas', '', '', '', '', '', '', '', avgClassGrade]);
      rows.push(['Persentase Ketuntasan Belajar', '', '', '', '', '', '', '', `${passRate}%`]);
      rows.push(['Jumlah Siswa Tuntas (>= KKM)', '', '', '', '', '', '', '', gradedList.filter((g) => g.isPassed).length]);
      rows.push(['Jumlah Siswa Belum Tuntas (< KKM)', '', '', '', '', '', '', '', gradedList.filter((g) => !g.isPassed).length]);

      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Setup merges for headers
      const startEvalCol = 3;
      const evalWidth = Math.max(1, fLen + sLen);
      const naCol = startEvalCol + evalWidth;
      const statusCol = naCol + 1;

      const merges: any[] = [
        // Title lines
        { s: { r: 0, c: 0 }, e: { r: 0, c: statusCol } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: statusCol } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: statusCol } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: statusCol } },
        { s: { r: 4, c: 0 }, e: { r: 4, c: statusCol } },

        // Table headers merges
        { s: { r: 6, c: 0 }, e: { r: 8, c: 0 } }, // No
        { s: { r: 6, c: 1 }, e: { r: 8, c: 1 } }, // NISN
        { s: { r: 6, c: 2 }, e: { r: 8, c: 2 } }, // Nama Siswa
        { s: { r: 6, c: naCol }, e: { r: 8, c: naCol } }, // Nilai Akhir
        { s: { r: 6, c: statusCol }, e: { r: 8, c: statusCol } }, // Status KKM
      ];

      if (fLen + sLen > 0) {
        merges.push({ s: { r: 6, c: startEvalCol }, e: { r: 6, c: naCol - 1 } }); // PENILAIAN
      } else {
        merges.push({ s: { r: 6, c: startEvalCol }, e: { r: 8, c: startEvalCol } });
      }

      if (fLen > 0) {
        merges.push({ s: { r: 7, c: startEvalCol }, e: { r: 7, c: startEvalCol + fLen - 1 } }); // FORMATIF
      }
      if (sLen > 0) {
        merges.push({ s: { r: 7, c: startEvalCol + fLen }, e: { r: 7, c: startEvalCol + fLen + sLen - 1 } }); // SUMATIF
      }

      ws['!merges'] = merges;

      // Auto column widths
      const colWidths: Array<{ wch: number }> = [
        { wch: 6 },
        { wch: 16 },
        { wch: 32 }
      ];
      assessmentCols.formatif.forEach((c: any) => colWidths.push({ wch: Math.max(16, c.nama.length + 3) }));
      assessmentCols.sumatif.forEach((c: any) => colWidths.push({ wch: Math.max(16, c.nama.length + 3) }));
      colWidths.push({ wch: 14 });
      colWidths.push({ wch: 24 });

      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, `Leger_${selectedClass}`);
      const filename = `Leger_Nilai_Kelas_${selectedClass}_${targetMapel.replace(/[^a-zA-Z0-9]/g, '_')}_${schoolSettings.activeSemester}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast(
        'success',
        'Berhasil Ekspor Excel (.xlsx)!',
        `Leger nilai kelas ${selectedClass} berhasil diekspor ke file Excel: ${filename}`
      );
    } catch (err: any) {
      console.error('Export Excel error:', err);
      showToast('error', 'Gagal Ekspor Excel', err?.message || 'Terjadi kendala saat membuat file Excel.');
    }
  };

  return (
    <div className="space-y-6">
      <PrintHeader
        title={
          activeTab === 'absensi'
            ? `LAPORAN REKAPITULASI PRESENSI SISWA KELAS ${selectedClass}`
            : activeTab === 'nilai'
            ? `LAPORAN HASIL PENILAIAN SISWA (LEGER) KELAS ${selectedClass}`
            : `REKAPITULASI KETERCAPAIAN JURNAL MENGAJAR KELAS ${selectedClass}`
        }
        subtitle={`Mata Pelajaran: ${targetMapel} | Tahun Ajaran: ${schoolSettings.academicYear} (${schoolSettings.activeSemester})`}
      />

      {/* Screen Controls with PageHeader */}
      <div className="no-print">
        <PageHeader
          title="Rekap dan Laporan"
          subtitle="Laporan rekapitulasi kehadiran, leger nilai kumulatif, dan ketercapaian jurnal mengajar resmi."
          badge="Laporan Pendidikan"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Pilih Kelas:</span>
                <select
                  id="select-kelas-rekap"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {availableClasses.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Mata Pelajaran:</span>
                <select
                  id="select-mapel-rekap"
                  value={selectedMapel}
                  onChange={(e) => setSelectedMapel(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[200px]"
                >
                  {availableMapels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-export-excel-rekap"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition cursor-pointer"
                title="Unduh berkas Excel resmi (.xlsx - bukan CSV)"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Ekspor Excel (.xlsx)</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-print-laporan"
                onClick={() =>
                  printWebDocument({
                    title: `Rekap Laporan ${
                      activeTab === 'nilai'
                        ? `Leger Nilai Siswa Kelas ${selectedClass}`
                        : activeTab === 'absensi'
                        ? `Kehadiran Siswa Kelas ${selectedClass}`
                        : `Jurnal Mengajar Kelas ${selectedClass}`
                    }`,
                    paperOrientation: activeTab === 'nilai' ? 'landscape' : 'portrait'
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Cetak Laporan Resmi</span>
              </motion.button>
            </div>
          }
          stats={[
            {
              label: 'Rata-Rata Nilai',
              value: gradedList.length > 0 ? `${avgClassGrade}` : '-',
              helper: gradedList.length > 0 ? `KKM: ${schoolSettings.kkmDefault}` : 'Belum ada nilai'
            },
            {
              label: 'Ketuntasan Belajar',
              value: gradedList.length > 0 ? `${passRate}%` : '-',
              helper: `${gradedList.filter((g) => g.isPassed).length} dari ${gradeRecap.length} Siswa`
            },
            {
              label: 'Presensi Rata-Rata',
              value: `${avgAttendanceRate}%`,
              helper: `${teacherAbsensis.length} Sesi Terlaksana`
            },
            {
              label: 'Jurnal Kelas',
              value: `${classJurnals.length} Sesi`,
              helper: `Kelas ${selectedClass}`
            }
          ]}
        />
      </div>

      {/* Tab Switcher */}
      <div className="no-print flex rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
        <div className="flex w-full sm:w-auto rounded-lg bg-slate-100 p-1">
          <button
            id="tab-laporan-nilai"
            onClick={() => setActiveTab('nilai')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === 'nilai'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Rekap Nilai Siswa</span>
          </button>

          <button
            id="tab-laporan-absensi"
            onClick={() => setActiveTab('absensi')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === 'absensi'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Rekap Absensi Siswa</span>
          </button>

          <button
            id="tab-laporan-jurnal"
            onClick={() => setActiveTab('jurnal')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === 'jurnal'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpenCheck className="h-4 w-4" />
            <span>Ketercapaian Jurnal</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Rekap Nilai Siswa */}
      {activeTab === 'nilai' && (
        <div className="space-y-4">
          {gradedList.length === 0 ? (
            <div className="no-print rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4 border border-amber-200 shadow-2xs">
                <GraduationCap className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Belum Ada Data Penilaian Kelas {selectedClass}
              </h3>
              <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Tabel nilai disembunyikan karena belum ada penilaian yang diisi atau disimpan untuk kelas <span className="font-bold text-slate-700">{selectedClass}</span> pada mata pelajaran <span className="font-bold text-slate-700">{targetMapel}</span>.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveMenu('guru-nilai')}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-sm shadow-emerald-200"
                >
                  <BookOpenCheck className="h-4 w-4" />
                  <span>Input Nilai di Menu Nilai Siswa</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Action Toolbar for Leger Nilai */}
              <div className="no-print flex flex-wrap items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Leger Penilaian Siswa
                  </span>
                  <span className="text-xs text-slate-500">
                    Kelas {selectedClass} • {targetMapel} ({gradedList.length} Siswa Terisi)
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  id="btn-export-excel-leger"
                  onClick={handleExportExcel}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
                  title="Unduh leger nilai siswa ke format file Excel (.xlsx)"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Ekspor Leger ke Excel (.xlsx)</span>
                </motion.button>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="border-b border-slate-200 bg-slate-50 font-bold tracking-wider text-slate-700">
                      {/* BARIS 1: NO, NISN, NAMA SISWA, PENILAIAN, NILAI AKHIR, STATUS */}
                      <tr className="border-b border-slate-200">
                        <th rowSpan={3} className="px-3 py-3 text-center border-r border-slate-200 w-12 uppercase">
                          No
                        </th>
                        <th rowSpan={3} className="px-3.5 py-3 text-left border-r border-slate-200 w-32 uppercase">
                          NISN
                        </th>
                        <th rowSpan={3} className="px-4 py-3 text-left border-r border-slate-200 min-w-[190px] uppercase">
                          Nama Siswa
                        </th>
                        {assessmentCols.formatif.length + assessmentCols.sumatif.length > 0 ? (
                          <th
                            colSpan={assessmentCols.formatif.length + assessmentCols.sumatif.length}
                            className="px-3 py-2 text-center bg-emerald-50/90 text-emerald-950 border-b border-slate-200 font-extrabold uppercase tracking-wider text-[11px]"
                          >
                            Penilaian
                          </th>
                        ) : (
                          <th
                            rowSpan={3}
                            className="px-3 py-2 text-center bg-slate-100 text-slate-500 border-r border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]"
                          >
                            Penilaian (Belum Diinput)
                          </th>
                        )}
                        <th rowSpan={3} className="px-3 py-3 text-center font-bold bg-emerald-100/60 text-emerald-900 border-l border-r border-slate-200 w-28 uppercase">
                          Nilai Akhir
                        </th>
                        <th rowSpan={3} className="px-3 py-3 text-center w-24 uppercase">
                          Status
                        </th>
                      </tr>

                      {/* BARIS 2: FORMATIF | SUMATIF (HANYA DITAMPILKAN JIKA KOLOM ADA) */}
                      {(assessmentCols.formatif.length > 0 || assessmentCols.sumatif.length > 0) && (
                        <tr className="border-b border-slate-200 text-[11px] font-bold">
                          {assessmentCols.formatif.length > 0 && (
                            <th
                              colSpan={assessmentCols.formatif.length}
                              className={`px-3 py-1.5 text-center bg-emerald-100/80 text-emerald-900 border-b border-slate-200 uppercase tracking-wide ${
                                assessmentCols.sumatif.length > 0 ? 'border-r' : ''
                              }`}
                            >
                              FORMATIF
                            </th>
                          )}
                          {assessmentCols.sumatif.length > 0 && (
                            <th
                              colSpan={assessmentCols.sumatif.length}
                              className="px-3 py-1.5 text-center bg-blue-100/80 text-blue-900 border-b border-slate-200 uppercase tracking-wide"
                            >
                              SUMATIF
                            </th>
                          )}
                        </tr>
                      )}

                      {/* BARIS 3: NAMA-NAMA PENILAIAN SESUAI YANG DIISI DI MENU NILAI SISWA */}
                      {(assessmentCols.formatif.length > 0 || assessmentCols.sumatif.length > 0) && (
                        <tr className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-semibold text-slate-700">
                          {/* Di bawah Formatif */}
                          {assessmentCols.formatif.map((col: any) => (
                            <th
                              key={col.id}
                              className="px-2.5 py-2 text-center border-r border-slate-200 bg-emerald-50/40"
                              title={col.nama}
                            >
                              <span className="line-clamp-2 max-w-[120px] mx-auto">{col.nama}</span>
                            </th>
                          ))}
                          {/* Di bawah Sumatif */}
                          {assessmentCols.sumatif.map((col: any, idx: number) => (
                            <th
                              key={col.id}
                              className={`px-2.5 py-2 text-center bg-blue-50/40 ${
                                idx < assessmentCols.sumatif.length - 1 ? 'border-r border-slate-200' : ''
                              }`}
                              title={col.nama}
                            >
                              <span className="line-clamp-2 max-w-[120px] mx-auto">{col.nama}</span>
                            </th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {gradeRecap.map((item, idx) => (
                        <tr key={item.siswa.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-3.5 py-2.5 text-center font-bold text-slate-400 border-r border-slate-100">
                            {idx + 1}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-xs font-semibold text-slate-600 border-r border-slate-100 whitespace-nowrap">
                            {item.siswa.nisn || '-'}
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-900 border-r border-slate-100 whitespace-nowrap">
                            {item.siswa.nama}
                          </td>

                          {/* Kolom Nilai Formatif (Hanya jika ada) */}
                          {assessmentCols.formatif.map((col: any) => (
                            <td
                              key={col.id}
                              className="px-2.5 py-2.5 text-center border-r border-slate-100 font-semibold bg-emerald-50/20"
                            >
                              {item.formatifScores[col.id] !== undefined ? item.formatifScores[col.id] : '-'}
                            </td>
                          ))}

                          {/* Kolom Nilai Sumatif (Hanya jika ada) */}
                          {assessmentCols.sumatif.map((col: any, sIdx: number) => (
                            <td
                              key={col.id}
                              className={`px-2.5 py-2.5 text-center font-semibold bg-blue-50/20 ${
                                sIdx < assessmentCols.sumatif.length - 1 ? 'border-r border-slate-100' : ''
                              }`}
                            >
                              {item.sumatifScores[col.id] !== undefined ? item.sumatifScores[col.id] : '-'}
                            </td>
                          ))}

                          {assessmentCols.formatif.length + assessmentCols.sumatif.length === 0 && (
                            <td className="px-3 py-2.5 text-center text-slate-400 font-semibold border-r border-slate-100">
                              -
                            </td>
                          )}

                          {/* Nilai Akhir */}
                          <td className="px-3 py-2.5 text-center font-bold text-sm bg-emerald-50/40 text-emerald-800 border-l border-r border-slate-100">
                            {item.hasScore ? item.finalScore : <span className="text-slate-400 font-semibold">-</span>}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            {item.hasScore ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  item.isPassed
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {item.isPassed ? 'Tuntas' : 'Remedial'}
                              </span>
                            ) : (
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                Belum Dinilai
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: Rekap Absensi Siswa */}
      {activeTab === 'absensi' && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3.5 py-3 text-center">No</th>
                  <th className="px-3.5 py-3">NISN</th>
                  <th className="px-3.5 py-3">Nama Siswa</th>
                  <th className="px-2 py-3 text-center">L/P</th>
                  <th className="px-3 py-3 text-center text-emerald-700 bg-emerald-50/50">Hadir (H)</th>
                  <th className="px-3 py-3 text-center text-amber-700 bg-amber-50/50">Sakit (S)</th>
                  <th className="px-3 py-3 text-center text-blue-700 bg-blue-50/50">Izin (I)</th>
                  <th className="px-3 py-3 text-center text-rose-700 bg-rose-50/50">Alpa (A)</th>
                  <th className="px-3 py-3 text-center">Total Pertemuan</th>
                  <th className="px-3 py-3 text-center font-bold">% Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendanceRecap.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-xs text-slate-400">
                      Belum ada data kehadiran siswa di kelas {selectedClass}.
                    </td>
                  </tr>
                ) : (
                  attendanceRecap.map((item, idx) => (
                  <tr key={item.siswa.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-3.5 py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {item.siswa.nisn}
                    </td>
                    <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                      {item.siswa.nama}
                    </td>
                    <td className="px-2 py-2.5 text-center font-semibold text-slate-500">
                      {item.siswa.gender}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-emerald-700">{item.hadir}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-amber-600">{item.sakit}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-blue-600">{item.izin}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-rose-600">{item.alpa}</td>
                    <td className="px-3 py-2.5 text-center text-slate-600">{item.totalSessions}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`font-bold ${item.percent >= 85 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {item.percent}%
                      </span>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Ketercapaian Jurnal Tatap Muka */}
      {activeTab === 'jurnal' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              Daftar Realisasi Jurnal Mengajar Kelas {selectedClass}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Total sesi tatap muka terlaksana: <span className="font-bold text-slate-800">{classJurnals.length} Pertemuan</span>
            </p>

            <div className="space-y-3">
              {classJurnals.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada jurnal untuk kelas {selectedClass}.</p>
              ) : (
                classJurnals.map((j, i) => (
                  <div key={j.id} className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Pertemuan {i + 1} | {j.tanggal} (Jam {j.jamKe})
                      </span>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Hadir: {j.jumlahHadir}/{j.totalSiswa} Siswa
                      </span>
                    </div>
                    <p className="mt-1 font-semibold text-slate-800">{j.babOrTujuan}</p>
                    <p className="mt-0.5 text-slate-600">{j.kegiatanPembelajaran}</p>
                    {j.hambatanCatatan && (
                      <p className="mt-1 text-slate-500 italic">Catatan: {j.hambatanCatatan}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <PrintSignatures />
    </div>
  );
};
