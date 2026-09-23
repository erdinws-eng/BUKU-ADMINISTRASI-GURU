import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusKehadiran, AbsensiDetail, SesiAbsensi } from '../../types';
import {
  ClipboardCheck,
  CheckCircle2,
  Calendar,
  Save,
  Printer,
  UserCheck,
  Clock,
  History,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';
import { printWebDocument } from '../../utils/printHelper';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';

export const AbsensiSiswa: React.FC = () => {
  const {
    currentTeacher,
    siswas,
    absensis,
    saveAbsensi,
    deleteAbsensi,
    showToast,
    showFeedbackModal
  } = useApp();

  const availableClasses = currentTeacher?.kelasDiampu || ['7A'];
  const [selectedClass, setSelectedClass] = useState<string>(availableClasses[0] || '7A');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().slice(0, 10));
  const [jamKe, setJamKe] = useState('1 - 2');
  const [pertemuanKe, setPertemuanKe] = useState(1);
  const [catatan, setCatatan] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Student list for current class
  const classStudents = siswas.filter((s) => s.kelas === selectedClass);

  // Attendance state for current session
  const [records, setRecords] = useState<Record<string, { status: StatusKehadiran; keterangan: string }>>({});

  // Check if there is already an existing session for this teacher, date, and class
  const existingSession = absensis.find(
    (a) =>
      a.guruId === currentTeacher?.id &&
      a.kelas === selectedClass &&
      a.tanggal === tanggal
  );

  useEffect(() => {
    if (existingSession) {
      const map: Record<string, { status: StatusKehadiran; keterangan: string }> = {};
      existingSession.records.forEach((r) => {
        map[r.siswaId] = { status: r.status, keterangan: r.keterangan || '' };
      });
      // Fill missing
      classStudents.forEach((s) => {
        if (!map[s.id]) {
          map[s.id] = { status: 'Hadir', keterangan: '' };
        }
      });
      setRecords(map);
      setJamKe(existingSession.jamKe || '1 - 2');
      setPertemuanKe(existingSession.pertemuanKe || 1);
      setCatatan(existingSession.catatan || '');
    } else {
      // Default all to Hadir
      const map: Record<string, { status: StatusKehadiran; keterangan: string }> = {};
      classStudents.forEach((s) => {
        map[s.id] = { status: 'Hadir', keterangan: '' };
      });
      setRecords(map);
      setCatatan('');
    }
  }, [selectedClass, tanggal, existingSession?.id, classStudents.length]);

  const handleMarkAllHadir = () => {
    const map: Record<string, { status: StatusKehadiran; keterangan: string }> = {};
    classStudents.forEach((s) => {
      map[s.id] = { status: 'Hadir', keterangan: '' };
    });
    setRecords(map);
    showToast('info', 'Semua Siswa Ditandai Hadir', `Status seluruh ${classStudents.length} siswa kelas ${selectedClass} diatur ke Hadir.`);
  };

  const setStudentStatus = (siswaId: string, status: StatusKehadiran) => {
    setRecords((prev) => ({
      ...prev,
      [siswaId]: {
        status,
        keterangan: prev[siswaId]?.keterangan || ''
      }
    }));
  };

  // Counters
  const countHadir = classStudents.filter((s) => records[s.id]?.status === 'Hadir').length;
  const countSakit = classStudents.filter((s) => records[s.id]?.status === 'Sakit').length;
  const countIzin = classStudents.filter((s) => records[s.id]?.status === 'Izin').length;
  const countAlpa = classStudents.filter((s) => records[s.id]?.status === 'Alpa').length;
  const totalCount = classStudents.length || 1;
  const percentHadir = Math.round((countHadir / totalCount) * 100);

  const handleSaveAbsensi = () => {
    const recordList: AbsensiDetail[] = classStudents.map((s) => ({
      siswaId: s.id,
      status: records[s.id]?.status || 'Hadir',
      keterangan: records[s.id]?.keterangan || ''
    }));

    saveAbsensi(
      {
        guruId: currentTeacher?.id || 'guru-1',
        tanggal,
        kelas: selectedClass,
        mapel: currentTeacher?.mapel || 'Matematika',
        jamKe,
        pertemuanKe: Number(pertemuanKe),
        catatan,
        records: recordList
      },
      existingSession?.id
    );

    setSavedSuccess(true);
    showToast(
      'success',
      'Presensi Berhasil Disimpan!',
      `Tercatat ${countHadir} hadir, ${countSakit} sakit, ${countIzin} izin, ${countAlpa} alpa untuk kelas ${selectedClass}.`
    );
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Recent attendance history for this teacher
  const teacherHistory = absensis
    .filter((a) => a.guruId === currentTeacher?.id)
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  return (
    <div className="space-y-6">
      <PrintHeader
        title={`DAFTAR PRESENSI & ABSENSI SISWA KELAS ${selectedClass}`}
        subtitle={`Tanggal: ${tanggal} | Pertemuan Ke-${pertemuanKe} | Mapel: ${currentTeacher?.mapel}`}
      />

      {/* Screen Controls with PageHeader */}
      <div className="no-print">
        <PageHeader
          title="Absensi Siswa Harian"
          subtitle="Input presensi tatap muka per kelas, tandai status Hadir, Sakit, Izin, atau Alpa."
          badge="Kegiatan Belajar"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-print-absensi"
                onClick={() => printWebDocument({ title: `Presensi Siswa Kelas ${selectedClass}` })}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Cetak Presensi</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-save-absensi"
                onClick={handleSaveAbsensi}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200 transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Presensi</span>
              </motion.button>
            </div>
          }
          stats={[
            { label: 'Kehadiran Kelas', value: `${percentHadir}%`, helper: `${countHadir} dari ${classStudents.length} siswa` },
            { label: 'Sakit / Izin', value: `${countSakit + countIzin} Siswa`, helper: `S: ${countSakit} | I: ${countIzin}` },
            { label: 'Tanpa Keterangan', value: `${countAlpa} Siswa`, helper: countAlpa > 0 ? 'Perlu konfirmasi' : 'Nihil' },
            { label: 'Pertemuan', value: `Ke-${pertemuanKe}`, helper: `Jam ${jamKe}` }
          ]}
        />
      </div>

      {savedSuccess && (
        <div className="no-print flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Presensi tanggal {tanggal} untuk kelas {selectedClass} berhasil disimpan ke basis data!</span>
        </div>
      )}

      {/* Filter Selection Panel */}
      <div className="no-print rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Pilih Kelas Binaan</label>
            <select
              id="select-kelas-absensi"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 font-semibold focus:border-emerald-500 focus:bg-white focus:outline-none"
            >
              {availableClasses.map((k) => (
                <option key={k} value={k}>
                  Kelas {k}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Tanggal Pertemuan</label>
            <input
              id="input-tanggal-absensi"
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Jam Ke-</label>
            <input
              type="text"
              placeholder="1 - 2"
              value={jamKe}
              onChange={(e) => setJamKe(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Pertemuan Ke-</label>
            <input
              type="number"
              min={1}
              value={pertemuanKe}
              onChange={(e) => setPertemuanKe(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Real-time counters & Mark all button */}
        <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Rekap Sesi Ini:</span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200">
              Hadir: {countHadir}
            </span>
            <span className="rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-700 border border-amber-200">
              Sakit: {countSakit}
            </span>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 font-bold text-blue-700 border border-blue-200">
              Izin: {countIzin}
            </span>
            <span className="rounded-md bg-rose-50 px-2 py-0.5 font-bold text-rose-700 border border-rose-200">
              Alpa: {countAlpa}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
              Persentase: {percentHadir}%
            </span>
          </div>

          <button
            type="button"
            id="btn-mark-all-hadir"
            onClick={handleMarkAllHadir}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
          >
            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Tandai Semua Hadir</span>
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3 text-center">No</th>
                <th className="px-4 py-3">NISN</th>
                <th className="px-4 py-3">Nama Peserta Didik</th>
                <th className="px-4 py-3 text-center">L/P</th>
                <th className="px-4 py-3 text-center">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    Tidak ada siswa terdaftar di kelas {selectedClass}.
                  </td>
                </tr>
              ) : (
                classStudents.map((siswa, index) => {
                  const currentStatus = records[siswa.id]?.status || 'Hadir';

                  return (
                    <tr key={siswa.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 text-center font-semibold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {siswa.nisn}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900">{siswa.nama}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-600">
                        {siswa.gender}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {/* Interactive Status Selector Buttons */}
                        <div className="no-print inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                          {(['Hadir', 'Sakit', 'Izin', 'Alpa'] as StatusKehadiran[]).map((st) => {
                            const isSelected = currentStatus === st;
                            let activeClass = '';
                            if (isSelected) {
                              if (st === 'Hadir') activeClass = 'bg-emerald-600 text-white font-bold shadow-xs';
                              else if (st === 'Sakit') activeClass = 'bg-amber-500 text-white font-bold shadow-xs';
                              else if (st === 'Izin') activeClass = 'bg-blue-600 text-white font-bold shadow-xs';
                              else if (st === 'Alpa') activeClass = 'bg-rose-600 text-white font-bold shadow-xs';
                            } else {
                              activeClass = 'text-slate-600 hover:text-slate-900';
                            }

                            return (
                              <button
                                key={st}
                                type="button"
                                id={`btn-status-${siswa.id}-${st.toLowerCase()}`}
                                onClick={() => setStudentStatus(siswa.id, st)}
                                className={`rounded-md px-2.5 py-1 text-xs transition ${activeClass}`}
                              >
                                {st.charAt(0)}
                              </button>
                            );
                          })}
                        </div>

                        {/* Print Only Badge */}
                        <span className="print-only font-bold">
                          {currentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PrintSignatures />

      {/* History Presensi */}
      <div className="no-print rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-800">
              Riwayat Presensi Tersimpan ({teacherHistory.length} Sesi)
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {teacherHistory.map((sesi) => {
            const hCount = sesi.records.filter((r) => r.status === 'Hadir').length;
            const sCount = sesi.records.filter((r) => r.status === 'Sakit').length;
            const iCount = sesi.records.filter((r) => r.status === 'Izin').length;
            const aCount = sesi.records.filter((r) => r.status === 'Alpa').length;

            return (
              <div
                key={sesi.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 hover:border-emerald-300 transition"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-800">{sesi.tanggal}</span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                      Kelas {sesi.kelas}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    H: {hCount} | S: {sCount} | I: {iCount} | A: {aCount}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedClass(sesi.kelas);
                      setTanggal(sesi.tanggal);
                    }}
                    className="rounded-lg bg-white border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Buka
                  </button>
                  <button
                    onClick={() => {
                      showFeedbackModal({
                        type: 'warning',
                        title: 'Hapus Sesi Presensi?',
                        message: `Sesi presensi kelas ${sesi.kelas} tanggal ${sesi.tanggal} akan dihapus secara permanen.`,
                        confirmText: 'Ya, Hapus Presensi',
                        cancelText: 'Batal',
                        onConfirm: () => {
                          deleteAbsensi(sesi.id);
                          showToast('info', 'Sesi Presensi Dihapus', `Data presensi kelas ${sesi.kelas} (${sesi.tanggal}) telah dihapus.`);
                        }
                      });
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
