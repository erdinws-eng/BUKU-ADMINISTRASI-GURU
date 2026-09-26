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
  Download,
  Sparkles
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { printWebDocument } from '../../utils/printHelper';
import {
  computeClassGradeRecap,
  getSavedNilaisForFilter
} from '../../utils/nilaiHelper';

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
    saveNilaiBatch,
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
      nilais
        .filter((n) => !n.guruId || n.guruId === currentTeacher.id)
        .forEach((n) => n.kelas && set.add(n.kelas.trim()));
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
      nilais
        .filter((n) => !n.guruId || n.guruId === currentTeacher.id)
        .forEach((n) => n.mapel && set.add(n.mapel.trim()));
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

  // Saved class/mapel pairs that have actual grades recorded
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

  // Read last active filter from Nilai Siswa or find first class/mapel with saved grades
  const initialFilter = useMemo(() => {
    try {
      const sessionFilterStr =
        sessionStorage.getItem('BAG_session_nilai_filter') ||
        localStorage.getItem('BAG_active_nilai_filter');
      if (sessionFilterStr) {
        const parsed = JSON.parse(sessionFilterStr);
        if (parsed && parsed.kelas && parsed.mapel) {
          // Verify if this filter has saved grades, or if we should use it directly
          return {
            kelas: parsed.kelas as string,
            mapel: parsed.mapel as string,
            semester: (parsed.semester || schoolSettings.activeSemester || 'Ganjil') as 'Ganjil' | 'Genap'
          };
        }
      }
    } catch {
      // ignore
    }

    // Check if there is any saved grade group for this teacher
    if (savedGradeGroups.length > 0) {
      return {
        kelas: savedGradeGroups[0].kelas,
        mapel: savedGradeGroups[0].mapel,
        semester: savedGradeGroups[0].semester
      };
    }

    return {
      kelas: availableClasses[0] || '7A',
      mapel:
        currentTeacher?.mapel && currentTeacher.mapel !== 'Mata Pelajaran'
          ? currentTeacher.mapel.split(',')[0].trim()
          : availableMapels[0] || 'Informatika',
      semester: (schoolSettings.activeSemester || 'Ganjil') as 'Ganjil' | 'Genap'
    };
  }, []);

  const [selectedClass, setSelectedClass] = useState<string>(initialFilter.kelas);
  const [selectedMapel, setSelectedMapel] = useState<string>(initialFilter.mapel);
  const [selectedSemester, setSelectedSemester] = useState<'Ganjil' | 'Genap'>(initialFilter.semester);

  // If nilais finishes hydrating from cloud and current filter has no grades while another savedGradeGroup does, sync to it if user hasn't explicitly picked a session filter
  React.useEffect(() => {
    if (savedGradeGroups.length > 0) {
      const hasCurrent =
        getSavedNilaisForFilter(nilais, selectedClass, selectedMapel, selectedSemester, currentTeacher?.id).length > 0;
      if (!hasCurrent && !sessionStorage.getItem('BAG_session_nilai_filter')) {
        const first = savedGradeGroups[0];
        setSelectedClass(first.kelas);
        setSelectedMapel(first.mapel);
        setSelectedSemester(first.semester);
      }
    }
  }, [savedGradeGroups.length]);

  // Save filter changes back to BAG_active_nilai_filter & BAG_session_nilai_filter so both menus stay in sync
  React.useEffect(() => {
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

  // Single Source of Truth: mengambil & mengumpulkan data nilai persis dari Menu Nilai Siswa
  const recapData = useMemo(
    () =>
      computeClassGradeRecap({
        siswas,
        nilais,
        kelas: selectedClass,
        mapel: targetMapel,
        semester: selectedSemester,
        guruId: currentTeacher?.id,
        kkm: schoolSettings.kkmDefault
      }),
    [siswas, nilais, selectedClass, targetMapel, selectedSemester, currentTeacher?.id, schoolSettings.kkmDefault]
  );

  const assessmentCols = useMemo(
    () => ({
      formatif: recapData.formatifCols,
      sumatif: recapData.sumatifCols
    }),
    [recapData.formatifCols, recapData.sumatifCols]
  );

  const gradeRecap = recapData.rows;
  const gradedList = recapData.gradedList;
  const avgClassGrade = recapData.classAvg;
  const passRate = recapData.passRate;

  // Rename an assessment column inline & sync to localStorage + AppContext
  const handleRenameColumn = (colId: string, newName: string) => {
    const nextCols = recapData.columns.map((c) => (c.id === colId ? { ...c, nama: newName } : c));
    const activeKey = `nilai_cols_${selectedClass.trim()}_${targetMapel.trim()}_${selectedSemester}`;
    try {
      localStorage.setItem(activeKey, JSON.stringify(nextCols));
    } catch {
      // ignore
    }

    const savedForClass = getSavedNilaisForFilter(
      nilais,
      selectedClass,
      targetMapel,
      selectedSemester,
      currentTeacher?.id
    );
    if (savedForClass.length > 0) {
      const updatedItems = savedForClass.map((item) => ({
        ...item,
        assessmentCols: nextCols
      }));
      saveNilaiBatch(updatedItems);
    }
  };

  const handleBlurColumnName = (col: { id: string; nama: string; jenis: 'formatif' | 'sumatif' }, index: number) => {
    if (!col.nama || !col.nama.trim()) {
      const fallbackName = `${col.jenis === 'sumatif' ? 'Sumatif' : 'Formatif'} ${index + 1}`;
      handleRenameColumn(col.id, fallbackName);
    }
  };

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
        subtitle={`Mata Pelajaran: ${targetMapel} | Tahun Ajaran: ${schoolSettings.academicYear} (Semester ${selectedSemester})`}
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
                  onChange={(e) => {
                    const newKelas = e.target.value;
                    setSelectedClass(newKelas);
                    const hasCurrent =
                      getSavedNilaisForFilter(nilais, newKelas, selectedMapel, selectedSemester, currentTeacher?.id)
                        .length > 0;
                    if (!hasCurrent) {
                      const matchedGroup = savedGradeGroups.find((g) => g.kelas === newKelas);
                      if (matchedGroup && availableMapels.includes(matchedGroup.mapel)) {
                        setSelectedMapel(matchedGroup.mapel);
                        setSelectedSemester(matchedGroup.semester);
                      }
                    }
                  }}
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

              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">Semester:</span>
                <select
                  id="select-semester-rekap"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value as 'Ganjil' | 'Genap')}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="Ganjil">Ganjil</option>
                  <option value="Genap">Genap</option>
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
              value: gradedList.length > 0 ? `${recapData.passedCount} (${passRate}%)` : '-',
              helper: gradedList.length > 0 ? `${recapData.passedCount} dari ${gradedList.length} Siswa Dinilai` : `Total ${gradeRecap.length} Siswa`
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
                {savedGradeGroups.length > 0 && (
                  <div className="w-full flex flex-wrap items-center justify-center gap-2 mb-1">
                    {savedGradeGroups.map((grp) => (
                      <button
                        key={`${grp.kelas}_${grp.mapel}_${grp.semester}`}
                        type="button"
                        onClick={() => {
                          setSelectedClass(grp.kelas);
                          setSelectedMapel(grp.mapel);
                          setSelectedSemester(grp.semester);
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                        <span>
                          Lihat Leger Tersimpan: Kelas {grp.kelas} • {grp.mapel} ({grp.count} Siswa)
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const payload = JSON.stringify({
                      kelas: selectedClass,
                      mapel: targetMapel,
                      semester: selectedSemester
                    });
                    try {
                      localStorage.setItem('BAG_active_nilai_filter', payload);
                      sessionStorage.setItem('BAG_session_nilai_filter', payload);
                    } catch {
                      // ignore
                    }
                    setActiveMenu('guru-nilai');
                  }}
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

                      {/* BARIS 3: NAMA-NAMA PENILAIAN SESUAI YANG DIISI DI MENU NILAI SISWA (BISA DIUBAH LANGSUNG) */}
                      {(assessmentCols.formatif.length > 0 || assessmentCols.sumatif.length > 0) && (
                        <tr className="border-b border-slate-200 bg-slate-100/60 text-[11px] font-semibold text-slate-700">
                          {/* Di bawah Formatif */}
                          {assessmentCols.formatif.map((col: any, idx: number) => (
                            <th
                              key={col.id}
                              className="px-2.5 py-2 text-center border-r border-slate-200 bg-emerald-50/40"
                              title="Klik untuk mengubah nama penilaian"
                            >
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
                                placeholder={`Formatif ${idx + 1}`}
                                className="w-full min-w-[95px] max-w-[150px] mx-auto rounded-lg border border-transparent hover:border-slate-300 focus:border-emerald-500 bg-white/70 focus:bg-white px-2 py-1 text-center font-bold text-slate-800 text-[11px] leading-tight focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                              />
                            </th>
                          ))}
                          {/* Di bawah Sumatif */}
                          {assessmentCols.sumatif.map((col: any, idx: number) => (
                            <th
                              key={col.id}
                              className={`px-2.5 py-2 text-center bg-blue-50/40 ${
                                idx < assessmentCols.sumatif.length - 1 ? 'border-r border-slate-200' : ''
                              }`}
                              title="Klik untuk mengubah nama penilaian"
                            >
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
                                placeholder={`Sumatif ${idx + 1}`}
                                className="w-full min-w-[95px] max-w-[150px] mx-auto rounded-lg border border-transparent hover:border-slate-300 focus:border-blue-500 bg-white/70 focus:bg-white px-2 py-1 text-center font-bold text-slate-800 text-[11px] leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                              />
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
                          {assessmentCols.formatif.map((col: any) => {
                            const score = item.formatifScores[col.id];
                            return (
                              <td
                                key={col.id}
                                className="px-2.5 py-2.5 text-center border-r border-slate-100 font-semibold bg-emerald-50/20"
                              >
                                {typeof score === 'number' && score > 0 ? score : '-'}
                              </td>
                            );
                          })}

                          {/* Kolom Nilai Sumatif (Hanya jika ada) */}
                          {assessmentCols.sumatif.map((col: any, sIdx: number) => {
                            const score = item.sumatifScores[col.id];
                            return (
                              <td
                                key={col.id}
                                className={`px-2.5 py-2.5 text-center font-semibold bg-blue-50/20 ${
                                  sIdx < assessmentCols.sumatif.length - 1 ? 'border-r border-slate-100' : ''
                                }`}
                              >
                                {typeof score === 'number' && score > 0 ? score : '-'}
                              </td>
                            );
                          })}

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
