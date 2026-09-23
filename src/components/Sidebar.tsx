import React from 'react';
import { useApp } from '../context/AppContext';
import { getMenuTheme } from '../utils/menuThemes';
import { motion } from 'motion/react';
import {
  Shield,
  UserCheck,
  ChevronRight,
  PanelLeftClose,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const {
    currentUser,
    activeMenu,
    setActiveMenu,
    currentTeacher,
    logout
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  // Grouped Admin Menus
  const adminMenuGroups = [
    {
      groupTitle: 'Pusat Kendali',
      items: [
        { id: 'admin-dashboard', label: 'Dashboard Admin' }
      ]
    },
    {
      groupTitle: 'Akademik & Kesiswaan',
      items: [
        { id: 'admin-jadwal', label: 'Jadwal Pelajaran' },
        { id: 'admin-mapel', label: 'Mata Pelajaran' },
        { id: 'admin-siswa', label: 'Master Data Siswa' }
      ]
    },
    {
      groupTitle: 'Manajemen & Sistem',
      items: [
        { id: 'admin-guru', label: 'Master Data Guru' },
        { id: 'admin-users', label: 'Kelola Akun Pengguna' },
        { id: 'admin-settings', label: 'Pengaturan Aplikasi' }
      ]
    }
  ];

  // Grouped Guru Menus
  const guruMenuGroups = [
    {
      groupTitle: 'Pusat Kerja',
      items: [
        { id: 'guru-dashboard', label: 'Dashboard Guru' }
      ]
    },
    {
      groupTitle: 'Kegiatan Belajar Mengajar',
      items: [
        { id: 'guru-jadwal', label: 'Jadwal Mengajar' },
        { id: 'guru-jurnal', label: 'Jurnal Mengajar' },
        { id: 'guru-absensi', label: 'Absensi Siswa' }
      ]
    },
    {
      groupTitle: 'Evaluasi & Raport',
      items: [
        { id: 'guru-nilai', label: 'Nilai Siswa (Asesmen)' },
        { id: 'guru-rekap', label: 'Rekap & Leger Nilai' }
      ]
    },
    {
      groupTitle: 'Perangkat Pembelajaran',
      items: [
        { id: 'guru-promes', label: 'Program Semester' },
        { id: 'guru-prota', label: 'Program Tahunan' },
        { id: 'guru-modul', label: 'Modul Ajar & LKPD' },
        { id: 'guru-siswa', label: 'Master Data Siswa' }
      ]
    }
  ];

  const menuGroups = isAdmin ? adminMenuGroups : guruMenuGroups;

  const handleSelectMenu = (id: string) => {
    setActiveMenu(id);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`no-print fixed top-16 bottom-0 left-0 z-40 bg-white transition-all duration-300 ease-in-out flex flex-col justify-between overflow-y-auto ${
          sidebarOpen
            ? 'w-68 translate-x-0 border-r border-slate-200 lg:static lg:translate-x-0'
            : '-translate-x-full w-68 lg:w-0 lg:translate-x-0 lg:border-r-0 lg:overflow-hidden lg:opacity-0 lg:pointer-events-none'
        }`}
      >
        <div className="w-68 min-w-[17rem] flex flex-col justify-between min-h-full">
          <div className="p-3">
            {/* Header Role Indicator with Collapse Button */}
            <div className="mb-2.5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/70 p-2.5 shadow-2xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                <div
                  className={`p-2 rounded-xl text-white shadow-xs shrink-0 ${
                    isAdmin
                      ? 'bg-gradient-to-tr from-indigo-700 to-indigo-600'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                  }`}
                >
                  {isAdmin ? <Shield className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </div>
                <div className="overflow-hidden flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {isAdmin ? 'Mode Administrator' : 'Mode Guru Pendidik'}
                  </span>
                  <p className="truncate text-xs font-extrabold text-slate-800">
                    {isAdmin ? 'Tata Usaha / Kurikulum' : currentTeacher?.nama || 'Guru Mapel'}
                  </p>
                </div>
              </div>
              <button
                id="btn-sidebar-collapse"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition cursor-pointer shrink-0"
                title="Tutup / Sembunyikan Sidebar"
                aria-label="Tutup Sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            {/* Grouped Nav List with Distinct Menu Characteristic Colors */}
            <div className="space-y-3.5">
            {menuGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {/* Group Title */}
                <div className="px-2 pt-1 pb-0.5 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {group.groupTitle}
                  </span>
                </div>

                {/* Items */}
                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const theme = getMenuTheme(item.id);
                    const Icon = theme.icon;
                    const isActive = activeMenu === item.id;

                    return (
                      <motion.button
                        key={item.id}
                        id={`nav-item-${item.id}`}
                        onClick={() => handleSelectMenu(item.id)}
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition cursor-pointer ${
                          isActive
                            ? `${theme.sidebarActiveBg} ${theme.sidebarActiveText} ${theme.sidebarActiveShadow} font-bold`
                            : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        {/* Unique Characteristic Icon Box */}
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition ${
                            isActive
                              ? 'bg-white/20 text-white shadow-2xs'
                              : `${theme.iconContainerBg} ${theme.iconContainerText} group-hover:scale-105`
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>

                        {/* Label & Description */}
                        <div className="flex-1 overflow-hidden">
                          <span className="truncate block font-bold text-xs">{item.label}</span>
                        </div>

                        {/* Characteristic colored dot or arrow */}
                        {isActive ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-1.5 w-1.5 rounded-full bg-white shadow-xs"
                          />
                        ) : (
                          <span
                            className="h-1.5 w-1.5 rounded-full opacity-40 group-hover:opacity-100 transition"
                            style={{ backgroundColor: theme.primaryHex }}
                          />
                        )}
                      </motion.button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom active info card */}
        <div className="border-t border-slate-100 p-3 bg-slate-50/60">
          {!isAdmin && currentTeacher && (
            <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 text-xs shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-slate-400">Pendidik Aktif</p>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="font-bold text-slate-800 truncate mt-0.5">
                {currentTeacher.nama}
                {currentTeacher.gelar ? `, ${currentTeacher.gelar}` : ''}
              </p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                Mapel: {currentTeacher.mapel || 'Guru'}
              </p>
            </div>
          )}

          {isAdmin && (
            <div className="rounded-xl border border-indigo-100 bg-white p-2.5 text-xs shadow-2xs">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold text-indigo-500">Akses Penuh</p>
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              </div>
              <p className="font-bold text-slate-800 truncate mt-0.5">Administrator Utama</p>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">Manajemen Berkas & Akun</p>
            </div>
          )}

          {/* Quick Explicit Log Out in Sidebar */}
          <button
            id="btn-sidebar-logout"
            onClick={() => {
              if (window.innerWidth < 1024) setSidebarOpen(false);
              logout();
            }}
            className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 hover:bg-rose-600 hover:border-rose-600 text-rose-700 hover:text-white py-2 px-3 text-xs font-bold transition shadow-2xs group cursor-pointer"
            title="Keluar dari Aplikasi (Log Out)"
          >
            <LogOut className="h-3.5 w-3.5 text-rose-600 group-hover:text-white transition" />
            <span>Keluar Akun (Log Out)</span>
          </button>
        </div>
        </div>
      </aside>
    </>
  );
};
