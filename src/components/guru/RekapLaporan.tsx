import React, { useState } from 'react';
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

  const classStudents = siswas.filter((s) => s.kelas === selectedClass);
  const teacherAbsensis = absensis.filter(
    (a) => a.guruId === currentTeacher?.id && a.kelas === selectedClass
  );

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

  // Compute grade recap for class
  const gradeRecap = classStudents.map((siswa) => {
    const n = nilais.find(
      (item) =>
        item.siswaId === siswa.id &&
        item.kelas === selectedClass &&
        item.mapel === currentTeacher?.mapel &&
        (!item.guruId || !currentTeacher?.id || item.guruId === currentTeacher.id)
    );

    const f1 = n?.formatif1 || 80;
    const f2 = n?.formatif2 || 80;
    const f3 = n?.formatif3 || 80;
    const sts = n?.sts || 80;
    const sas = n?.sas || 80;

    const avgF = Math.round((f1 + f2 + f3) / 3);
    const wF = schoolSettings.gradingWeight.formatif / 100;
    const wSts = schoolSettings.gradingWeight.sts / 100;
    const wSas = schoolSettings.gradingWeight.sas / 100;

    const finalScore = Math.round(avgF * wF + sts * wSts + sas * wSas);

    let pred = 'B';
    if (finalScore >= 90) pred = 'A';
    else if (finalScore >= 80) pred = 'B';
    else if (finalScore >= 70) pred = 'C';
    else pred = 'D';

    return {
      siswa,
      f1,
      f2,
      f3,
      avgF,
      sts,
      sas,
      finalScore,
      pred,
      isPassed: finalScore >= schoolSettings.kkmDefault,
      deskripsi: n?.deskripsiCapaian || 'Mencapai kriteria ketuntasan materi.'
    };
  });

  // Sort grade recap descending by final score
  gradeRecap.sort((a, b) => b.finalScore - a.finalScore);

  const avgClassGrade = Math.round(
    gradeRecap.reduce((sum, g) => sum + g.finalScore, 0) / (gradeRecap.length || 1)
  );
  const passRate = Math.round(
    (gradeRecap.filter((g) => g.isPassed).length / (gradeRecap.length || 1)) * 100
  );
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
        subtitle={`Mata Pelajaran: ${currentTeacher?.mapel} | Tahun Ajaran: ${schoolSettings.academicYear} (${schoolSettings.activeSemester})`}
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

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-print-laporan"
                onClick={() =>
                  printWebDocument({
                    title: `Rekap Laporan ${
                      activeTab === 'nilai'
                        ? 'Leger Nilai Siswa'
                        : activeTab === 'absensi'
                        ? 'Kehadiran Siswa'
                        : 'Jurnal Mengajar'
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
            { label: 'Rata-Rata Nilai', value: `${avgClassGrade}`, helper: `KKM: ${schoolSettings.kkmDefault}` },
            { label: 'Ketuntasan Belajar', value: `${passRate}%`, helper: `${gradeRecap.filter(g => g.isPassed).length} dari ${gradeRecap.length} Siswa` },
            { label: 'Presensi Rata-Rata', value: `${avgAttendanceRate}%`, helper: `${teacherAbsensis.length} Sesi Terlaksana` },
            { label: 'Jurnal Kelas', value: `${classJurnals.length} Sesi`, helper: `Kelas ${selectedClass}` }
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
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-bold tracking-wider text-slate-700">
                <tr>
                  <th rowSpan={2} className="px-3 py-3 text-center border-r border-slate-200 w-12 uppercase">No</th>
                  <th rowSpan={2} className="px-3.5 py-3 text-left border-r border-slate-200 w-32 uppercase">NISN</th>
                  <th rowSpan={2} className="px-4 py-3 text-left border-r border-slate-200 min-w-[190px] uppercase">Nama Siswa</th>
                  <th colSpan={7} className="px-3 py-2 text-center bg-emerald-50/80 text-emerald-900 border-b border-slate-200 font-bold uppercase tracking-wider">
                    Penilaian
                  </th>
                </tr>
                <tr className="bg-slate-50/90 text-[11px] font-semibold text-slate-600">
                  <th className="px-2 py-2 text-center">Rata Formatif</th>
                  <th className="px-2 py-2 text-center">STS</th>
                  <th className="px-2 py-2 text-center">SAS</th>
                  <th className="px-3 py-2 text-center font-bold bg-emerald-100/50 text-emerald-900">Nilai Akhir</th>
                  <th className="px-2 py-2 text-center">Predikat</th>
                  <th className="px-3 py-2 text-center">Status</th>
                  <th className="px-4 py-2">Deskripsi Capaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {gradeRecap.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-xs text-slate-400">
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
                    <td className="px-2 py-2.5 text-center">{item.avgF}</td>
                    <td className="px-2 py-2.5 text-center">{item.sts}</td>
                    <td className="px-2 py-2.5 text-center">{item.sas}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-sm bg-emerald-50/40 text-emerald-800">
                      {item.finalScore}
                    </td>
                    <td className="px-2 py-2.5 text-center">
                      <span className="font-bold">{item.pred}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          item.isPassed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.isPassed ? 'Tuntas' : 'Remedial'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 text-[11px]">
                      {item.deskripsi}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
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
