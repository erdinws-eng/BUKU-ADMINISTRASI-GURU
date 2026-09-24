import React, { useState, useMemo } from 'react';
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
  PieChart
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { printWebDocument } from '../../utils/printHelper';

export const RekapLaporan: React.FC = () => {
  const {
    currentTeacher,
    siswas,
    absensis,
    nilais,
    jurnals,
    protas,
    schoolSettings
  } = useApp();

  const [activeTab, setActiveTab] = useState<'absensi' | 'nilai' | 'jurnal'>('nilai');
  const availableClasses = currentTeacher?.kelasDiampu || ['7A'];
  const [selectedClass, setSelectedClass] = useState<string>(availableClasses[0] || '7A');

  const availableMapels = useMemo(() => {
    const list: string[] = [];
    if (currentTeacher?.mapelList && currentTeacher.mapelList.length > 0) {
      currentTeacher.mapelList.forEach((m) => m && list.push(m.trim()));
    } else if (currentTeacher?.mapel) {
      currentTeacher.mapel.split(',').forEach((m) => m.trim() && list.push(m.trim()));
    }
    if (list.length === 0) list.push('Mata Pelajaran');
    return Array.from(new Set(list));
  }, [currentTeacher]);

  const [selectedMapel, setSelectedMapel] = useState<string>(availableMapels[0] || currentTeacher?.mapel || '');

  const classStudents = siswas.filter((s) => s.kelas === selectedClass);
  const teacherAbsensis = absensis.filter(
    (a) => a.guruId === currentTeacher?.id && a.kelas === selectedClass
  );

  // Ambil konfigurasi penilaian formatif & sumatif sesuai yang diisi/disimpan di menu Nilai Siswa
  const targetMapel = selectedMapel || currentTeacher?.mapel || availableMapels[0] || '';

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
            formatif: formatif.length > 0 ? formatif : [{ id: 'formatif1', nama: 'Formatif 1', jenis: 'formatif' }],
            sumatif: sumatif.length > 0 ? sumatif : [{ id: 'sts', nama: 'STS', jenis: 'sumatif' }, { id: 'sas', nama: 'SAS', jenis: 'sumatif' }]
          };
        }
      }

      // Cek apakah ada key untuk kelas & mapel ini di semester aktif
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
              formatif: formatif.length > 0 ? formatif : [{ id: 'formatif1', nama: 'Formatif 1', jenis: 'formatif' }],
              sumatif: sumatif.length > 0 ? sumatif : [{ id: 'sts', nama: 'STS', jenis: 'sumatif' }, { id: 'sas', nama: 'SAS', jenis: 'sumatif' }]
            };
          }
        }
      }
    } catch {
      // fallback
    }

    // Default standar Kurikulum Merdeka
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
        (!targetMapel || item.mapel === targetMapel || !item.mapel) &&
        (!item.guruId || !currentTeacher?.id || item.guruId === currentTeacher.id)
    );

    // Periksa apakah siswa ini benar-benar memiliki nilai tersimpan
    const hasRecord = Boolean(
      n &&
        ((n.customScores && Object.keys(n.customScores).length > 0) ||
          (typeof n.formatif1 === 'number' && n.formatif1 > 0) ||
          (typeof n.sts === 'number' && n.sts > 0) ||
          (typeof n.sas === 'number' && n.sas > 0))
    );

    // Nilai tiap kolom Formatif
    const formatifScores: Record<string, number | undefined> = {};
    assessmentCols.formatif.forEach((col: any, idx: number) => {
      let val: number | undefined = undefined;
      if (hasRecord && n) {
        if (n.customScores && n.customScores[col.id] !== undefined) {
          val = Number(n.customScores[col.id]) || 0;
        } else if (col.id === 'formatif1' || idx === 0) {
          val = n.formatif1;
        } else if (col.id === 'formatif2' || idx === 1) {
          val = n.formatif2;
        } else if (col.id === 'formatif3' || idx === 2) {
          val = n.formatif3;
        } else if (n.customScores) {
          const customArr = Object.values(n.customScores);
          if (typeof customArr[idx] === 'number') val = customArr[idx];
        }
      }
      formatifScores[col.id] = val;
    });

    // Nilai tiap kolom Sumatif
    const sumatifScores: Record<string, number | undefined> = {};
    assessmentCols.sumatif.forEach((col: any, idx: number) => {
      let val: number | undefined = undefined;
      if (hasRecord && n) {
        if (n.customScores && n.customScores[col.id] !== undefined) {
          val = Number(n.customScores[col.id]) || 0;
        } else if (col.id === 'sts' || col.nama.toLowerCase().includes('sts') || idx === 0) {
          val = n.sts;
        } else if (col.id === 'sas' || col.nama.toLowerCase().includes('sas') || idx === 1) {
          val = n.sas;
        } else if (n.customScores) {
          const sumatifEntries = Object.entries(n.customScores).filter(([k]) => k.startsWith('sumatif'));
          if (sumatifEntries[idx]) val = Number(sumatifEntries[idx][1]);
        }
      }
      sumatifScores[col.id] = val;
    });

    if (!hasRecord) {
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

    const fVals = Object.values(formatifScores).filter((v): v is number => typeof v === 'number');
    const avgF = fVals.length > 0 ? Math.round(fVals.reduce((a, b) => a + b, 0) / fVals.length) : 0;

    const sVals = Object.values(sumatifScores).filter((v): v is number => typeof v === 'number');
    const stsVal = (typeof sumatifScores['sts'] === 'number' ? sumatifScores['sts'] : undefined) ?? (sVals[0] ?? 0);
    const sasVal = (typeof sumatifScores['sas'] === 'number' ? sumatifScores['sas'] : undefined) ?? (sVals[1] ?? stsVal);

    const wF = schoolSettings.gradingWeight.formatif / 100;
    const wSts = schoolSettings.gradingWeight.sts / 100;
    const wSas = schoolSettings.gradingWeight.sas / 100;

    const finalScore = Math.round(avgF * wF + stsVal * wSts + sasVal * wSas);

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

              {availableMapels.length > 1 && (
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500">Mata Pelajaran:</span>
                  <select
                    id="select-mapel-rekap"
                    value={selectedMapel}
                    onChange={(e) => setSelectedMapel(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[180px]"
                  >
                    {availableMapels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
        <div className="space-y-3">
          {gradedList.length === 0 && (
            <div className="no-print rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
              <span className="flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                Belum ada nilai tersimpan untuk Kelas {selectedClass} ({targetMapel}).
              </span>
              <span className="text-[11px] text-amber-700/90 font-medium">
                Data penilaian tersinkronisasi otomatis dengan menu Nilai Siswa.
              </span>
            </div>
          )}

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
                  <th
                    colSpan={assessmentCols.formatif.length + assessmentCols.sumatif.length}
                    className="px-3 py-2 text-center bg-emerald-50/90 text-emerald-950 border-b border-slate-200 font-extrabold uppercase tracking-wider text-[11px]"
                  >
                    Penilaian
                  </th>
                  <th rowSpan={3} className="px-3 py-3 text-center font-bold bg-emerald-100/60 text-emerald-900 border-l border-r border-slate-200 w-28 uppercase">
                    Nilai Akhir
                  </th>
                  <th rowSpan={3} className="px-3 py-3 text-center w-24 uppercase">
                    Status
                  </th>
                </tr>

                {/* BARIS 2: FORMATIF | SUMATIF */}
                <tr className="border-b border-slate-200 text-[11px] font-bold">
                  <th
                    colSpan={assessmentCols.formatif.length}
                    className="px-3 py-1.5 text-center bg-emerald-100/80 text-emerald-900 border-r border-b border-slate-200 uppercase tracking-wide"
                  >
                    FORMATIF
                  </th>
                  <th
                    colSpan={assessmentCols.sumatif.length}
                    className="px-3 py-1.5 text-center bg-blue-100/80 text-blue-900 border-b border-slate-200 uppercase tracking-wide"
                  >
                    SUMATIF
                  </th>
                </tr>

                {/* BARIS 3: NAMA-NAMA PENILAIAN SESUAI YANG DIISI DI MENU NILAI SISWA */}
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
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {gradeRecap.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5 + assessmentCols.formatif.length + assessmentCols.sumatif.length}
                      className="py-8 text-center text-xs text-slate-400"
                    >
                      Belum ada data siswa atau nilai di kelas {selectedClass}.
                    </td>
                  </tr>
                ) : (
                  gradeRecap.map((item, idx) => (
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

                      {/* Kolom Nilai Formatif */}
                      {assessmentCols.formatif.map((col: any) => (
                        <td
                          key={col.id}
                          className="px-2.5 py-2.5 text-center border-r border-slate-100 font-semibold bg-emerald-50/20"
                        >
                          {item.formatifScores[col.id] !== undefined ? item.formatifScores[col.id] : '-'}
                        </td>
                      ))}

                      {/* Kolom Nilai Sumatif */}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
