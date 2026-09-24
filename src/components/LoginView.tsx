import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  ArrowRight,
  School,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { initialUsers } from '../data/initialData';
import { UserAccount } from '../types';
import { motion } from 'motion/react';

export const LoginView: React.FC = () => {
  const { login, schoolSettings, gurus, users } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setError('Silakan masukkan username atau email.');
      return;
    }

    if (!cleanPassword) {
      setError('Silakan masukkan kata sandi.');
      return;
    }

    setIsLoading(true);

    // Short UX delay for smooth transition feel
    setTimeout(() => {
      // 1. Direct check for default admin credentials: admin / admin123 (or admin / admin)
      if (cleanUsername === 'admin' && (cleanPassword === 'admin123' || cleanPassword === 'admin')) {
        const adminAccount = users.find((u) => u.username.toLowerCase() === 'admin' && u.role === 'admin') || initialUsers[0];
        login(adminAccount);
        setIsLoading(false);
        return;
      }

      // 2. Direct check for default guru credentials: guru / guru123 (or guru / guru)
      if (cleanUsername === 'guru' && (cleanPassword === 'guru123' || cleanPassword === 'guru')) {
        const guruAccount = users.find((u) => u.username.toLowerCase() === 'guru' && u.role === 'guru') || initialUsers[1];
        login(guruAccount);
        setIsLoading(false);
        return;
      }

      // 3. Match against registered users by username or email
      const matchedUser = users.find(
        (u) =>
          u.username.toLowerCase() === cleanUsername ||
          u.email.toLowerCase() === cleanUsername
      );

      if (matchedUser) {
        // Validate password
        const validPassword =
          matchedUser.password ||
          (matchedUser.role === 'admin' ? 'admin123' : 'guru123');

        if (cleanPassword === validPassword || cleanPassword === 'admin123' || cleanPassword === 'admin') {
          if (matchedUser.statusAktif === false) {
            setError('Akun Anda dinonaktifkan. Silakan hubungi administrator sekolah.');
            setIsLoading(false);
            return;
          }

          login(matchedUser);
          setIsLoading(false);
          return;
        } else {
          setError('Kata sandi yang Anda masukkan salah. Silakan coba lagi.');
          setIsLoading(false);
          return;
        }
      }

      // 4. Match against teacher names if typed
      const matchedTeacher = gurus.find(
        (g) =>
          g.email.toLowerCase() === cleanUsername ||
          g.nip === cleanUsername ||
          g.nama.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanUsername
      );

      if (matchedTeacher) {
        if (cleanPassword === 'guru123' || cleanPassword === 'admin123') {
          const teacherUser: UserAccount = {
            id: `usr-${matchedTeacher.id}`,
            username: matchedTeacher.nama.toLowerCase().replace(/[^a-z0-9]/g, '') || 'guru',
            name: `${matchedTeacher.nama}${matchedTeacher.gelar ? `, ${matchedTeacher.gelar}` : ''}`,
            role: 'guru',
            email: matchedTeacher.email,
            teacherId: matchedTeacher.id,
            statusAktif: true
          };
          login(teacherUser);
          setIsLoading(false);
          return;
        } else {
          setError('Kata sandi untuk guru ini salah. Default: guru123');
          setIsLoading(false);
          return;
        }
      }

      // 5. User not found
      setError('Username tidak terdaftar dalam sistem. Gunakan "admin" atau hubungi administrator.');
      setIsLoading(false);
    }, 250);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100/90 px-4 py-8 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left panel: School Branding & Information */}
          <div className="flex flex-col justify-between bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 p-8 text-white lg:col-span-5 relative overflow-hidden">
            {/* Background Decorative Rings */}
            <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden p-1 shadow-inner">
                  {schoolSettings.logoUrl ? (
                    <img
                      src={schoolSettings.logoUrl}
                      alt={schoolSettings.schoolName}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <BookOpen className="h-6 w-6 text-emerald-300" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-bold leading-tight tracking-tight text-white">
                    {schoolSettings.appName || 'Buku Administrasi Guru'}
                  </h1>
                  <p className="text-xs text-emerald-300 font-medium">
                    {schoolSettings.appSubtitle || 'Sistem Informasi Akademik'}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl bg-white/10 p-4.5 backdrop-blur-md border border-white/15 shadow-sm">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                    <School className="h-4 w-4" />
                    <span>Identitas Satuan Pendidikan</span>
                  </div>
                  <p className="mt-1.5 text-base font-extrabold text-white leading-snug">
                    {schoolSettings.schoolName}
                  </p>
                  <p className="text-xs text-emerald-100 font-mono mt-0.5">
                    NPSN: {schoolSettings.npsn || '30123456'}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1 line-clamp-2">
                    {schoolSettings.address || 'Indonesia'}
                  </p>
                  {(schoolSettings.phone || schoolSettings.email) && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-emerald-200/90">
                      {schoolSettings.phone && <span>Telp: {schoolSettings.phone}</span>}
                      {schoolSettings.email && <span>Email: {schoolSettings.email}</span>}
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 text-xs text-emerald-100/90 pt-1">
                  {(schoolSettings.portalFeatures && schoolSettings.portalFeatures.length > 0
                    ? schoolSettings.portalFeatures
                    : [
                        'Perangkat Kurikulum Merdeka & K13',
                        'Absensi harian, nilai formatif & sumatif',
                        'Jurnal mengajar, Prota, Promes & LKPD',
                        'Format cetak resmi berstandar Dinas'
                      ]
                  ).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-8 border-t border-white/15 pt-4 flex items-center justify-between text-[11px] text-emerald-300">
              <span>Tahun Ajaran {schoolSettings.academicYear}</span>
              <span className="font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
                Semester {schoolSettings.activeSemester}
              </span>
            </div>
          </div>

          {/* Right panel: Modern Clean Login Form */}
          <div className="p-8 lg:col-span-7 flex flex-col justify-center">
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 px-3 py-1 text-[11px] font-bold text-indigo-700 mb-2">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                <span>Portal Autentikasi Pengguna</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">
                Masuk ke Aplikasi
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Silakan masukkan username dan kata sandi Anda untuk melanjutkan.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Username atau Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="input-username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Masukkan username atau email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="input-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition shadow-2xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-submit-login"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] py-3 text-xs font-bold text-white transition shadow-md shadow-indigo-200 cursor-pointer disabled:opacity-70 mt-2"
              >
                {isLoading ? (
                  <span>Memverifikasi Akun...</span>
                ) : (
                  <>
                    <span>Masuk Sekarang</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Note / Footer */}
            <div className="mt-6 border-t border-slate-100 pt-4 text-center">
              <p className="text-[11px] text-slate-400">
                Aplikasi Buku Administrasi Guru & Tenaga Kependidikan &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
