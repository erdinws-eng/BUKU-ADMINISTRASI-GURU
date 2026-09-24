import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { getMenuTheme } from '../utils/menuThemes';
import { motion } from 'motion/react';
import {
  BookOpen,
  LogOut,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  UserCog,
  Shield,
  GraduationCap,
  Sparkles,
  Cloud,
  UploadCloud,
  DownloadCloud,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const {
    currentUser,
    currentTeacher,
    schoolSettings,
    gurus,
    users,
    activeMenu,
    setActiveMenu,
    logout,
    switchTeacher,
    resetAllData,
    supabaseSyncStatus,
    lastSyncedAt,
    syncWithSupabase,
    pullDataFromSupabase,
    showToast,
    showFeedbackModal
  } = useApp();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCloudMenu, setShowCloudMenu] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const theme = getMenuTheme(activeMenu);

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl sm:px-6 relative overflow-hidden shadow-[0_4px_24px_-4px_rgba(15,23,42,0.06)] transition-all duration-300">
      {/* 1. Ornamen Garis Gradien Atas (Top Jewel Accent Bar) */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] z-20 transition-all duration-500"
        style={{
          background: isAdmin
            ? 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 30%, #ec4899 65%, #06b6d4 100%)'
            : 'linear-gradient(90deg, #059669 0%, #0d9488 30%, #0284c7 65%, #10b981 100%)'
        }}
      />

      {/* 2. Ornamen Background Ambient Glow & Light Flares */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Ambient Blur Orb 1 - Center Left */}
        <div
          className="absolute -top-10 left-[18%] h-32 w-80 rounded-full blur-3xl opacity-25 transition-all duration-700"
          style={{ backgroundColor: theme.primaryHex }}
        />
        {/* Ambient Blur Orb 2 - Right */}
        <div
          className="absolute -top-12 right-[8%] h-28 w-72 rounded-full blur-3xl opacity-20 transition-all duration-700"
          style={{ backgroundColor: isAdmin ? '#818cf8' : '#34d399' }}
        />

        {/* Ornamen Tekstur Grid Dot Matrix Halus */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.04] text-slate-900"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="header-matrix-dots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="2.5" cy="2.5" r="1.2" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#header-matrix-dots)" />
        </svg>

        {/* Ornamen Garis Gelombang & Titik Konstelasi Estetik (Kanan) */}
        <div className="absolute right-24 top-0 bottom-0 w-64 opacity-[0.07] hidden lg:block">
          <svg viewBox="0 0 240 64" fill="none" className="h-full w-full">
            <path
              d="M0 48 C 60 12, 120 54, 180 20 C 210 4, 230 32, 240 28"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeDasharray="4 4"
              className="text-slate-800"
            />
            <path
              d="M10 60 C 70 28, 130 60, 190 36 C 215 24, 230 40, 240 38"
              stroke="currentColor"
              strokeWidth="1.2"
              className="text-slate-700"
            />
            <circle cx="60" cy="30" r="2.5" fill="currentColor" className="text-slate-800" />
            <circle cx="120" cy="54" r="2" fill="currentColor" className="text-slate-800" />
            <circle cx="180" cy="20" r="3" fill="currentColor" className="text-slate-800" />
          </svg>
        </div>

        {/* Ornamen Reticle Geometris (Kiri Dekat Logo) */}
        <div className="absolute left-64 top-1/2 -translate-y-1/2 opacity-[0.06] hidden xl:block">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <circle cx="22" cy="22" r="18" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="text-slate-800" />
            <circle cx="22" cy="22" r="8" stroke="currentColor" strokeWidth="1" className="text-slate-800" />
            <path d="M22 0V44M0 22H44" stroke="currentColor" strokeWidth="0.8" className="text-slate-800" />
          </svg>
        </div>

        {/* Ornamen Kilauan Sudut Halus */}
        <div className="absolute top-2 right-4 opacity-15 hidden sm:block">
          <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
        </div>
      </div>

      {/* Left side: Sidebar Toggle + School Branding */}
      <div className="relative z-10 flex items-center gap-3">
        <button
          id="btn-toggle-sidebar"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition shadow-2xs cursor-pointer"
          title={sidebarOpen ? 'Tutup / Sembunyikan Sidebar' : 'Buka / Tampilkan Sidebar'}
          aria-label={sidebarOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5 text-slate-700" />
          ) : (
            <PanelLeftOpen className="h-5 w-5 text-emerald-600" />
          )}
        </button>

        <div className="flex items-center gap-2.5">
          <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl shadow-md ring-2 ring-offset-2 ring-offset-white overflow-hidden ${
            schoolSettings.logoUrl
              ? 'bg-white ring-slate-200/90 p-0.5'
              : isAdmin
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-200/80 ring-indigo-500/20 text-white'
                : 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-200/80 ring-emerald-500/20 text-white'
          }`}>
            {schoolSettings.logoUrl ? (
              <img
                src={schoolSettings.logoUrl}
                alt={schoolSettings.schoolName}
                className="h-full w-full object-contain"
              />
            ) : isAdmin ? (
              <Shield className="h-5 w-5" />
            ) : (
              <BookOpen className="h-5 w-5" />
            )}
            {/* Tiny ornament accent dot on icon corner */}
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white shadow-2xs" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 tracking-tight text-sm sm:text-base">
                {schoolSettings.appName || 'Buku Administrasi Guru'}
              </span>
              <span className={`hidden rounded-full px-2 py-0.5 text-xs font-semibold sm:inline-block border shadow-2xs ${
                isAdmin
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isAdmin ? 'Panel Admin' : schoolSettings.curriculum}
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">
              {schoolSettings.schoolName} | TA {schoolSettings.academicYear} ({schoolSettings.activeSemester})
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Actions & User Profile */}
      <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
        {/* Supabase Cloud Quick Sync Status & Action */}
        <div className="relative">
          <button
            id="btn-navbar-cloud-sync"
            onClick={() => setShowCloudMenu(!showCloudMenu)}
            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition cursor-pointer ${
              supabaseSyncStatus === 'saved'
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100/80'
                : supabaseSyncStatus === 'syncing'
                ? 'border-blue-200 bg-blue-50 text-blue-700 animate-pulse'
                : supabaseSyncStatus === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title="Sinkronisasi Cloud Supabase (Akses lintas domain & Vercel)"
          >
            {supabaseSyncStatus === 'syncing' ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
            ) : supabaseSyncStatus === 'saved' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Cloud className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span className="hidden sm:inline">
              {supabaseSyncStatus === 'syncing'
                ? 'Sinkron...'
                : supabaseSyncStatus === 'saved'
                ? 'Cloud Aktif'
                : 'Cloud Sync'}
            </span>
          </button>

          {showCloudMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCloudMenu(false)} />
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-400/30 z-50 animate-scale-up text-xs">
                <div className="border-b border-slate-100 pb-2.5 mb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Supabase Cloud Database</span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">Online</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Sinkronisasi data otomatis antara AI Studio dan domain Vercel.
                  </p>
                  {lastSyncedAt && (
                    <p className="text-[10px] text-emerald-600 mt-1 font-mono font-semibold">
                      Sinkron terakhir: {lastSyncedAt}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    id="btn-cloud-push-navbar"
                    onClick={async () => {
                      setShowCloudMenu(false);
                      showToast('info', 'Menyinkronkan...', 'Mengunggah seluruh data saat ini ke Supabase Cloud...');
                      const ok = await syncWithSupabase(true);
                      if (ok) {
                        showToast('success', 'Tersimpan di Cloud!', 'Data berhasil diunggah ke Supabase Cloud. Sekarang data siap dibuka di Vercel!');
                      } else {
                        showToast('error', 'Gagal Sinkron', 'Tidak dapat terhubung ke Supabase. Periksa internet Anda.');
                      }
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-900 p-2.5 font-semibold transition cursor-pointer text-left"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
                      <UploadCloud className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold leading-tight">Unggah ke Cloud (Push)</p>
                      <span className="text-[10px] text-emerald-700/80 font-normal">Kirim data lokal ini agar muncul di domain Vercel</span>
                    </div>
                  </button>

                  <button
                    id="btn-cloud-pull-navbar"
                    onClick={async () => {
                      setShowCloudMenu(false);
                      showToast('info', 'Mengunduh Data...', 'Menarik data terbaru dari Supabase Cloud...');
                      const ok = await pullDataFromSupabase();
                      if (ok) {
                        showToast('success', 'Data Dipulihkan!', 'Semua data dari Supabase Cloud telah diselaraskan ke browser ini.');
                      } else {
                        showToast('error', 'Gagal Menarik Data', 'Data di cloud belum ditemukan atau koneksi gagal.');
                      }
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-900 p-2.5 font-semibold transition cursor-pointer text-left"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
                      <DownloadCloud className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold leading-tight">Tarik dari Cloud (Pull)</p>
                      <span className="text-[10px] text-blue-700/80 font-normal">Muat data dari Supabase ke domain ini (Vercel)</span>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Badge / Dropdown */}
        <div className="relative">
          <button
            id="btn-user-dropdown"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2.5 hover:bg-slate-50 transition cursor-pointer"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-semibold text-xs text-white ${
              isAdmin ? 'bg-indigo-600' : 'bg-emerald-600'
            }`}>
              {isAdmin ? 'AD' : (currentTeacher?.nama ? currentTeacher.nama.charAt(0) : 'G')}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                {isAdmin ? (currentUser?.name || 'Admin Sekolah') : (currentTeacher?.nama || currentUser?.name || 'Guru Pengampu')}
              </p>
              <div className="flex items-center gap-1">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                  isAdmin ? 'bg-indigo-500' : 'bg-emerald-500'
                }`} />
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide truncate max-w-[130px]">
                  {isAdmin ? (currentUser?.adminType || 'Administrator') : `Guru ${currentTeacher?.mapel || ''}`}
                </span>
              </div>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              {/* Backdrop to dismiss dropdown on click outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl shadow-slate-300/60 z-50 animate-scale-up">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="text-xs font-bold text-slate-800">{currentUser?.name}</p>
                  <p className="text-[11px] text-slate-500">@{currentUser?.username} | {currentUser?.email}</p>
                  <div className={`mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    isAdmin ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {isAdmin ? <ShieldCheck className="h-3 w-3 text-indigo-600" /> : <UserCheck className="h-3 w-3 text-emerald-600" />}
                    <span>{isAdmin ? `Admin: ${currentUser?.adminType || 'Administrator'}` : 'Guru Mata Pelajaran'}</span>
                  </div>
                </div>

                {/* Strict Isolation: In Guru mode, only show Guru's own detailed profile info */}
                {!isAdmin ? (
                  <div className="px-3 py-2.5 space-y-1.5 text-xs border-b border-slate-100 bg-slate-50/50 rounded-xl my-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Informasi Pendidik
                    </p>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-slate-400 text-[11px]">NIP:</span>
                      <span className="font-mono text-[11px] font-semibold">{currentTeacher?.nip || '-'}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-slate-400 text-[11px]">Mata Pelajaran:</span>
                      <span className="font-semibold text-emerald-700">{currentTeacher?.mapel || '-'}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-slate-400 text-[11px]">Kelas Diampu:</span>
                      <span className="font-semibold">{currentTeacher?.kelasDiampu.join(', ') || '-'}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span className="text-slate-400 text-[11px]">Status Kepegawaian:</span>
                      <span className="font-semibold">{currentTeacher?.statusKepegawaian || 'PNS'}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Admin Menu Quick Link */}
                    <div className="px-1 py-1.5 border-b border-slate-100">
                      <button
                        id="dropdown-menu-admin-users"
                        onClick={() => {
                          setActiveMenu('admin-users');
                          setShowUserMenu(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-indigo-800 hover:bg-indigo-50 transition cursor-pointer"
                      >
                        <UserCog className="h-4 w-4 text-indigo-600" />
                        <span>Kelola Akun Pengguna</span>
                      </button>
                    </div>

                    {/* Admin Teacher Inspection Switcher */}
                    <div className="px-2 py-2 max-h-56 overflow-y-auto border-b border-slate-100">
                      <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Inspeksi Buku Guru:
                      </p>
                      {gurus.map((g) => {
                        const isCurrent = currentTeacher?.id === g.id;
                        return (
                          <button
                            key={g.id}
                            onClick={() => {
                              switchTeacher(g.id);
                              setActiveMenu('guru-dashboard');
                              setShowUserMenu(false);
                            }}
                            className={`mt-0.5 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-50 font-bold text-emerald-700'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate">{g.nama} ({g.mapel})</span>
                            {isCurrent && (
                              <span className="text-[10px] text-emerald-600 font-bold">Aktif</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="border-t border-slate-100 pt-2 space-y-1">
                  <button
                    id="btn-reset-data"
                    onClick={() => {
                      setShowUserMenu(false);
                      showFeedbackModal({
                        type: 'warning',
                        title: 'Kosongkan Semua Data?',
                        message: 'Semua data penilaian, absensi, jurnal, dan perangkat ajar akan dibersihkan kembali ke pengaturan awal untuk pengujian.',
                        confirmText: 'Ya, Bersihkan Data',
                        cancelText: 'Batal',
                        onConfirm: () => {
                          resetAllData();
                          showToast('info', 'Data Dibersihkan', 'Semua data telah dikosongkan.');
                        }
                      });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Kosongkan / Bersihkan Data</span>
                  </button>
                  <button
                    id="btn-logout"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white py-2 px-3 text-xs font-bold transition shadow-xs cursor-pointer mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar Akun (Log Out)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dedicated Direct Log Out Button in Navbar Header */}
        <button
          id="btn-header-logout"
          onClick={() => logout()}
          className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 hover:border-rose-600 text-rose-700 hover:text-white px-2.5 sm:px-3 py-2 text-xs font-bold transition shadow-2xs group cursor-pointer"
          title="Keluar dari Akun (Log Out)"
          aria-label="Tombol Log Out"
        >
          <LogOut className="h-4 w-4 text-rose-600 group-hover:text-white transition" />
          <span className="hidden xs:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};

