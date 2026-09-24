import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';
import {
  Users,
  UserCog,
  GraduationCap,
  CheckCircle2,
  Clock,
  Building2,
  ArrowUpRight,
  FileCheck,
  Shield,
  KeyRound,
  Sparkles
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    schoolSettings,
    gurus,
    siswas,
    jadwals,
    jurnals,
    protas,
    promesList,
    modulAjars,
    users,
    mapels,
    setActiveMenu
  } = useApp();

  const [selectedDay, setSelectedDay] = useState<string>('Senin');

  const activeGurusCount = gurus.filter((g) => g.statusAktif).length;
  const totalClasses = Array.from(new Set(siswas.map((s) => s.kelas))).sort();
  const schedulesToday = jadwals.filter((j) => j.hari === selectedDay);
  const adminUsersCount = users.filter((u) => u.role === 'admin').length;
  const guruUsersCount = users.filter((u) => u.role === 'guru').length;
  const gurusWithoutAccount = gurus.filter(
    (g) => !users.some((u) => u.teacherId === g.id)
  );

  return (
    <div className="space-y-6">
      {/* Header Controls with PageHeader */}
      <div className="no-print">
        <PageHeader
          title={schoolSettings.schoolName}
          subtitle={`Tahun Ajaran ${schoolSettings.academicYear} | Semester ${schoolSettings.activeSemester} | ${schoolSettings.curriculum}`}
          badge="Panel Administrator & Kurikulum"
          stats={[
            { label: 'Tenaga Pendidik', value: `${activeGurusCount} Aktif`, helper: `${gurus.length} Terdata di sistem` },
            { label: 'Peserta Didik', value: `${siswas.length} Siswa`, helper: `${totalClasses.length} Rombel aktif` },
            { label: 'Rombongan Belajar', value: `${totalClasses.length} Kelas`, helper: totalClasses.join(', ') || '-' },
            { label: 'Akun Pengguna', value: `${users.length} Akun`, helper: `${adminUsersCount} Admin, ${guruUsersCount} Guru` }
          ]}
        />
      </div>

      {/* Notice if any guru is missing account */}
      {gurusWithoutAccount.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-xs font-medium">
              <span className="font-bold">{gurusWithoutAccount.length} Guru</span> belum memiliki akun login untuk mengisi nilai & absensi.
            </p>
          </div>
          <button
            id="btn-goto-account-management"
            onClick={() => setActiveMenu('admin-users')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition"
          >
            <span>Buka Manajemen Akun</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards - Rich Colorful Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* User accounts card - Indigo Vibrant */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setActiveMenu('admin-users')}
          className="relative overflow-hidden rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 p-5 shadow-xs hover:shadow-md hover:shadow-indigo-500/10 hover:border-indigo-300 cursor-pointer transition-all group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 group-hover:text-indigo-800">
              Akun Pengguna
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm shadow-indigo-300">
              <UserCog className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-indigo-950">{users.length}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-800">
            <span>{adminUsersCount} Admin | {guruUsersCount} Akun Guru</span>
          </div>
        </motion.div>

        {/* Total Tenaga Pendidik - Emerald Vibrant */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setActiveMenu('admin-guru')}
          className="relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-5 shadow-xs hover:shadow-md hover:shadow-emerald-500/10 hover:border-emerald-300 cursor-pointer transition-all group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 group-hover:text-emerald-800">
              Tenaga Pendidik
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-300">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-emerald-950">{gurus.length}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>{activeGurusCount} Guru Aktif Mengajar</span>
          </div>
        </motion.div>

        {/* Total Peserta Didik - Sky Vibrant */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setActiveMenu('admin-siswa')}
          className="relative overflow-hidden rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/90 via-white to-blue-50/60 p-5 shadow-xs hover:shadow-md hover:shadow-sky-500/10 hover:border-sky-300 cursor-pointer transition-all group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 group-hover:text-sky-800">
              Peserta Didik
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-blue-600 text-white shadow-sm shadow-sky-300">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-sky-950">{siswas.length}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
            <span>{totalClasses.length} Rombongan Belajar</span>
          </div>
        </motion.div>

        {/* Jurnal & Administrasi - Amber Vibrant */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setActiveMenu('guru-jurnal')}
          className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 p-5 shadow-xs hover:shadow-md hover:shadow-amber-500/10 hover:border-amber-300 cursor-pointer transition-all group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 group-hover:text-amber-800">
              Buku Administrasi
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm shadow-amber-300">
              <FileCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-amber-950">{jurnals.length}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
            <span>{protas.length} Prota | {promesList.length} Promes</span>
          </div>
        </motion.div>
      </div>

      {/* Main Grid: Status Kelengkapan & Jadwal Mengajar Sekolah */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Progress Administrasi per Guru */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Status Kelengkapan Berkas Guru</h2>
              <p className="text-xs text-slate-500">Monitoring pengunggahan Prota, Promes, Modul & Jurnal</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              Semester {schoolSettings.activeSemester}
            </span>
          </div>

          <div className="space-y-3">
            {gurus.map((g) => {
              const guruProtas = protas.filter((p) => p.guruId === g.id);
              const guruPromes = promesList.filter((p) => p.guruId === g.id);
              const guruModuls = modulAjars.filter((m) => m.guruId === g.id);
              const guruJurnals = jurnals.filter((j) => j.guruId === g.id);

              return (
                <div
                  key={g.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-slate-300"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800">
                        {g.nama}, {g.gelar}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        NIP: {g.nip} | Mapel: <span className="font-semibold text-slate-700">{g.mapel}</span>
                      </p>
                    </div>
                    <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-700 border border-slate-200">
                      Kelas: {g.kelasDiampu.join(', ')}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-emerald-50/70 p-2 border border-emerald-200/80 shadow-2xs">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Prota</p>
                      <p className={`font-black text-xs mt-0.5 ${guruProtas.length > 0 ? 'text-emerald-900' : 'text-slate-400'}`}>
                        {guruProtas.length > 0 ? `${guruProtas.length} Dokumen` : 'Belum Ada'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-sky-50/70 p-2 border border-sky-200/80 shadow-2xs">
                      <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">Promes</p>
                      <p className={`font-black text-xs mt-0.5 ${guruPromes.length > 0 ? 'text-sky-900' : 'text-slate-400'}`}>
                        {guruPromes.length > 0 ? `${guruPromes.length} Materi` : 'Belum Ada'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-purple-50/70 p-2 border border-purple-200/80 shadow-2xs">
                      <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Modul Ajar</p>
                      <p className={`font-black text-xs mt-0.5 ${guruModuls.length > 0 ? 'text-purple-900' : 'text-slate-400'}`}>
                        {guruModuls.length > 0 ? `${guruModuls.length} Modul` : 'Belum Ada'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-50/70 p-2 border border-amber-200/80 shadow-2xs">
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Jurnal</p>
                      <p className={`font-black text-xs mt-0.5 ${guruJurnals.length > 0 ? 'text-amber-950' : 'text-slate-400'}`}>
                        {guruJurnals.length > 0 ? `${guruJurnals.length} Pertemuan` : 'Belum Ada'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Master Jadwal Mengajar Sekolah */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Master Jadwal Mengajar Sekolah</h2>
              <p className="text-xs text-slate-500">Jadwal operasional kelas dan ruang tatap muka</p>
            </div>
            <button
              onClick={() => setActiveMenu('admin-jadwal')}
              className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
            >
              Kelola &rarr;
            </button>
          </div>

          {/* Day selection */}
          <div className="mb-3 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => (
              <button
                key={day}
                id={`btn-day-${day.toLowerCase()}`}
                onClick={() => setSelectedDay(day)}
                className={`flex-1 rounded-md py-1.5 text-center text-xs font-semibold transition ${
                  selectedDay === day
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {day.substring(0, 3)}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {schedulesToday.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                Tidak ada jadwal pelajaran terjadwal pada hari {selectedDay}.
              </div>
            ) : (
              schedulesToday.map((sch) => {
                const guru = gurus.find((g) => g.id === sch.guruId);
                return (
                  <div
                    key={sch.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 hover:bg-indigo-50/40 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs">
                        <span className="text-[9px] uppercase font-semibold text-slate-400">Jam</span>
                        {sch.jamKe}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-800">{sch.mapel}</span>
                          <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700">
                            Kelas {sch.kelas}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {guru ? `${guru.nama}, ${guru.gelar}` : 'Guru Pengampu'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right text-xs">
                      <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>{sch.waktu}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{sch.ruang}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
