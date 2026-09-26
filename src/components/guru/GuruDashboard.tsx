import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  BookOpenCheck,
  ClipboardCheck,
  GraduationCap,
  Users,
  FileText,
  ArrowRight,
  Sparkles,
  MapPin
} from 'lucide-react';

export const GuruDashboard: React.FC = () => {
  const {
    currentTeacher,
    schoolSettings,
    siswas,
    jadwals,
    jurnals,
    absensis,
    protas,
    promesList,
    modulAjars,
    setActiveMenu,
    openJurnalFromJadwal,
    openAbsensiFromJadwal
  } = useApp();

  const allScheduleDays: Array<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'> = [
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu'
  ];
  const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayName = daysIndo[new Date().getDay()] || 'Senin';
  const effectiveDay = todayName === 'Minggu' ? 'Senin' : todayName;

  const teacherGurusJadwal = jadwals.filter((j) => j.guruId === currentTeacher?.id);

  // Hari disesuaikan dengan hari yang ada pada menu Jadwal Mengajar
  const scheduleDays = React.useMemo(() => {
    const daysWithSchedule = allScheduleDays.filter((day) =>
      teacherGurusJadwal.some((j) => j.hari === day)
    );
    return daysWithSchedule.length > 0 ? daysWithSchedule : allScheduleDays;
  }, [teacherGurusJadwal]);

  const [selectedDay, setSelectedDay] = useState<string>(effectiveDay);

  React.useEffect(() => {
    if (scheduleDays.length > 0 && !scheduleDays.includes(selectedDay as any)) {
      if (scheduleDays.includes(effectiveDay as any)) {
        setSelectedDay(effectiveDay);
      } else {
        setSelectedDay(scheduleDays[0]);
      }
    }
  }, [scheduleDays, selectedDay, effectiveDay]);

  const jadwalsDay = React.useMemo(() => {
    return [...teacherGurusJadwal]
      .filter((j) => j.hari === selectedDay)
      .sort((a, b) => {
        const jamA = parseInt((a.jamKe || '1').split('-')[0].trim(), 10) || 1;
        const jamB = parseInt((b.jamKe || '1').split('-')[0].trim(), 10) || 1;
        return jamA - jamB;
      });
  }, [teacherGurusJadwal, selectedDay]);

  // Filter students taught by this teacher
  const classesTaught = currentTeacher?.kelasDiampu || [];
  const studentsTaught = siswas.filter((s) => classesTaught.includes(s.kelas));

  const teacherJurnals = jurnals.filter((j) => j.guruId === currentTeacher?.id);
  const teacherProtas = protas.filter((p) => p.guruId === currentTeacher?.id);
  const teacherPromes = promesList.filter((p) => p.guruId === currentTeacher?.id);
  const teacherModuls = modulAjars.filter((m) => m.guruId === currentTeacher?.id);

  // Recent attendance overview
  const recentAbsensis = absensis.filter((a) => a.guruId === currentTeacher?.id).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* PageHeader with Welcome, Actions & Metrics */}
      <div className="no-print">
        <PageHeader
          title={`Selamat Bertugas, ${currentTeacher?.nama || 'Bapak/Ibu Guru'}, ${currentTeacher?.gelar || ''}`}
          subtitle={`Guru Pengampu ${currentTeacher?.mapel || '-'} | NIP: ${currentTeacher?.nip || '-'} | Rombongan Belajar Binaan: ${classesTaught.join(', ') || 'Semua Kelas'}`}
          badge="Buku Administrasi Guru Terpadu"
          actions={
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-1 shadow-2xs backdrop-blur-xs">
              <motion.button
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-goto-jurnal-fast"
                onClick={() => setActiveMenu('guru-jurnal')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs hover:border-emerald-300 hover:text-emerald-700 transition cursor-pointer"
                title="Buka & Isi Jurnal Hari Ini"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <BookOpenCheck className="h-3.5 w-3.5" />
                </div>
                <span>Jurnal Mengajar</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-goto-absensi-fast"
                onClick={() => setActiveMenu('guru-absensi')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs hover:border-teal-300 hover:text-teal-700 transition cursor-pointer"
                title="Presensi Siswa Hari Ini"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                  <ClipboardCheck className="h-3.5 w-3.5" />
                </div>
                <span>Presensi Siswa</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-goto-nilai-fast"
                onClick={() => setActiveMenu('guru-nilai')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs hover:border-indigo-300 hover:text-indigo-700 transition cursor-pointer"
                title="Input Nilai Siswa"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <GraduationCap className="h-3.5 w-3.5" />
                </div>
                <span>Buku Nilai</span>
              </motion.button>

              <motion.button
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-goto-jadwal-fast"
                onClick={() => setActiveMenu('guru-jadwal')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs hover:border-amber-300 hover:text-amber-700 transition cursor-pointer"
                title="Jadwal Tatap Muka Guru"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <span>Jadwal</span>
              </motion.button>
            </div>
          }
          stats={[
            { label: 'Siswa Dalam Binaan', value: `${studentsTaught.length} Siswa`, helper: `${classesTaught.length} Rombel (${classesTaught.join(', ')})` },
            { label: 'Jurnal Tatap Muka', value: `${teacherJurnals.length} Sesi`, helper: 'Terekam di buku jurnal' },
            { label: 'Perangkat Kurikulum', value: `${teacherProtas.length + teacherPromes.length + teacherModuls.length} Berkas`, helper: `${teacherProtas.length} Prota, ${teacherPromes.length} Promes, ${teacherModuls.length} Modul` },
            { label: 'Jadwal Mengajar', value: `${teacherGurusJadwal.length} Sesi`, helper: `${teacherGurusJadwal.length * 2} JP per Minggu` }
          ]}
        />
      </div>

      {/* 4 Primary Colorful Highlight Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Siswa Binaan */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setActiveMenu('guru-siswa')}
          className="relative overflow-hidden rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 via-white to-cyan-50/60 p-5 shadow-xs hover:shadow-md hover:shadow-blue-500/10 hover:border-blue-300 cursor-pointer transition-all group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 group-hover:text-blue-800">
              Siswa Binaan
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-sm shadow-blue-300">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-blue-950">{studentsTaught.length}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
            <span>{classesTaught.length} Rombel ({classesTaught.join(', ') || 'Semua'})</span>
          </div>
        </motion.div>

        {/* Card 2: Jurnal Tatap Muka */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setActiveMenu('guru-jurnal')}
          className="relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-5 shadow-xs hover:shadow-md hover:shadow-emerald-500/10 hover:border-emerald-300 cursor-pointer transition-all group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 group-hover:text-emerald-800">
              Jurnal Mengajar
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-300">
              <BookOpenCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-emerald-950">{teacherJurnals.length}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>Terekam di Jurnal Harian</span>
          </div>
        </motion.div>

        {/* Card 3: Perangkat Kurikulum */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setActiveMenu('guru-modul')}
          className="relative overflow-hidden rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-50/90 via-white to-fuchsia-50/60 p-5 shadow-xs hover:shadow-md hover:shadow-purple-500/10 hover:border-purple-300 cursor-pointer transition-all group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-fuchsia-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 group-hover:text-purple-800">
              Perangkat Ajar
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white shadow-sm shadow-purple-300">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-purple-950">
            {teacherProtas.length + teacherPromes.length + teacherModuls.length}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-purple-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-purple-800">
            <span>{teacherProtas.length} Prota | {teacherPromes.length} Promes | {teacherModuls.length} Modul</span>
          </div>
        </motion.div>

        {/* Card 4: Jadwal Mengajar */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setActiveMenu('guru-jadwal')}
          className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 p-5 shadow-xs hover:shadow-md hover:shadow-amber-500/10 hover:border-amber-300 cursor-pointer transition-all group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 group-hover:text-amber-800">
              Alokasi Jam
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm shadow-amber-300">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-black tracking-tight text-amber-950">{teacherGurusJadwal.length * 2} JP</p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
            <span>{teacherGurusJadwal.length} Sesi Pertemuan / Minggu</span>
          </div>
        </motion.div>
      </div>

      {/* Main Row: Jadwal Mengajar Guru + Quick Shortcuts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Jadwal Mengajar Interaktif */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-8">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800">Jadwal Mengajar Tatap Muka</h2>
                <button
                  onClick={() => setActiveMenu('guru-jadwal')}
                  className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200/60"
                >
                  Buka Menu Jadwal &rarr;
                </button>
              </div>
              <p className="text-xs text-slate-500">Pilih hari untuk melihat alokasi kelas dan jam mengajar</p>
            </div>

            {/* Day buttons disesuaikan dengan hari di Menu Jadwal Mengajar */}
            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
              {scheduleDays.map((day) => {
                const countDay = teacherGurusJadwal.filter((j) => j.hari === day).length;
                const isSelected = selectedDay === day;
                const isToday = day === effectiveDay;
                return (
                  <button
                    key={day}
                    id={`btn-jadwal-day-${day.toLowerCase()}`}
                    onClick={() => setSelectedDay(day)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isToday
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>{day}</span>
                    {countDay > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200/80 text-slate-600'
                        }`}
                      >
                        {countDay}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {jadwalsDay.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 bg-slate-50/50">
                Tidak ada jam tatap muka terjadwal untuk hari {selectedDay}.
              </div>
            ) : (
              jadwalsDay.map((sch) => (
                <motion.div
                  key={sch.id}
                  whileHover={{ y: -1 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/60 via-white to-teal-50/40 p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black shadow-xs">
                      <span className="text-[8px] uppercase tracking-wider text-emerald-100">Jam</span>
                      <span className="text-sm font-bold">{sch.jamKe}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{sch.mapel}</span>
                        <span className="rounded-full bg-emerald-100/90 border border-emerald-200/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Kelas {sch.kelas}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-emerald-600" /> {sch.waktu}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600" /> {sch.ruang}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      id={`btn-act-jurnal-${sch.id}`}
                      onClick={() => openJurnalFromJadwal(sch)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 shadow-2xs cursor-pointer transition"
                      title={`Buka & Isi Otomatis Jurnal Kelas ${sch.kelas}`}
                    >
                      <BookOpenCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Buka Jurnal</span>
                    </button>
                    <button
                      id={`btn-act-absensi-${sch.id}`}
                      onClick={() => openAbsensiFromJadwal(sch)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-xs shadow-emerald-200 cursor-pointer transition"
                      title={`Buka Presensi Langsung Siswa Kelas ${sch.kelas}`}
                    >
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      <span>Presensi Siswa</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Navigasi Dokumen Administrasi */}
        <div className="space-y-4 lg:col-span-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 mb-1">Buku Kerja Administrasi</h2>
            <p className="text-xs text-slate-500 mb-3.5">Navigasi langsung ke dokumen & berkas guru</p>

            <div className="space-y-2.5">
              {/* Card 1: Nilai Siswa - Indigo */}
              <motion.button
                whileHover={{ x: 2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                id="btn-shortcut-nilai"
                onClick={() => setActiveMenu('guru-nilai')}
                className="flex w-full items-center justify-between rounded-2xl border border-indigo-200/90 bg-gradient-to-r from-indigo-50/90 via-indigo-50/40 to-white p-3.5 text-left hover:border-indigo-400 hover:shadow-xs transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xs">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-indigo-950">Daftar Nilai Siswa</p>
                    <p className="text-[11px] text-indigo-700/80 font-medium">Formatif, STS, SAS & Leger</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-indigo-400 group-hover:text-indigo-600 transition" />
              </motion.button>

              {/* Card 2: Promes - Sky */}
              <motion.button
                whileHover={{ x: 2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                id="btn-shortcut-promes"
                onClick={() => setActiveMenu('guru-promes')}
                className="flex w-full items-center justify-between rounded-2xl border border-sky-200/90 bg-gradient-to-r from-sky-50/90 via-sky-50/40 to-white p-3.5 text-left hover:border-sky-400 hover:shadow-xs transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-2xs">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-sky-950">Program Semester (Promes)</p>
                    <p className="text-[11px] text-sky-700/80 font-medium">Distribusi alokasi JP per minggu</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-sky-400 group-hover:text-sky-600 transition" />
              </motion.button>

              {/* Card 3: Modul Ajar - Amber */}
              <motion.button
                whileHover={{ x: 2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                id="btn-shortcut-modul"
                onClick={() => setActiveMenu('guru-modul')}
                className="flex w-full items-center justify-between rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/90 via-amber-50/40 to-white p-3.5 text-left hover:border-amber-400 hover:shadow-xs transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-2xs">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-amber-950">Modul Ajar & LKPD</p>
                    <p className="text-[11px] text-amber-800/80 font-medium">Perangkat Ajar Kurikulum Merdeka</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-amber-500 group-hover:text-amber-700 transition" />
              </motion.button>

              {/* Card 4: Presensi Siswa - Rose */}
              <motion.button
                whileHover={{ x: 2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                id="btn-shortcut-absensi"
                onClick={() => setActiveMenu('guru-absensi')}
                className="flex w-full items-center justify-between rounded-2xl border border-rose-200/90 bg-gradient-to-r from-rose-50/90 via-rose-50/40 to-white p-3.5 text-left hover:border-rose-400 hover:shadow-xs transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-2xs">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-rose-950">Presensi & Kehadiran Siswa</p>
                    <p className="text-[11px] text-rose-800/80 font-medium">Catatan Hadir, Sakit, Izin, Alpa</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-rose-400 group-hover:text-rose-600 transition" />
              </motion.button>

              {/* Card 5: Rekap & Laporan - Emerald */}
              <motion.button
                whileHover={{ x: 2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                id="btn-shortcut-rekap"
                onClick={() => setActiveMenu('guru-rekap')}
                className="flex w-full items-center justify-between rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white p-3.5 text-left hover:border-emerald-400 hover:shadow-xs transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xs">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-emerald-950">Rekap & Laporan Resmi</p>
                    <p className="text-[11px] text-emerald-800/80 font-medium">Leger nilai & cetak dokumen PDF</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-emerald-500 group-hover:text-emerald-700 transition" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
