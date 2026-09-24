import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { motion, AnimatePresence } from 'motion/react';
import {
  ToastContainer,
  FeedbackModal
} from './components/shared/AnimatedFeedback';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MasterDataGuru } from './components/admin/MasterDataGuru';
import { MasterDataMapel } from './components/admin/MasterDataMapel';
import { MasterDataSiswa } from './components/admin/MasterDataSiswa';
import { PengaturanAplikasi } from './components/admin/PengaturanAplikasi';
import { ManajemenAkun } from './components/admin/ManajemenAkun';

// Guru & Shared Views
import { GuruDashboard } from './components/guru/GuruDashboard';
import { JadwalMengajar } from './components/guru/JadwalMengajar';
import { JurnalMengajar } from './components/guru/JurnalMengajar';
import { AbsensiSiswa } from './components/guru/AbsensiSiswa';
import { NilaiSiswa } from './components/guru/NilaiSiswa';
import { RekapLaporan } from './components/guru/RekapLaporan';
import { ProgramSemester } from './components/guru/ProgramSemester';
import { ProgramTahunan } from './components/guru/ProgramTahunan';
import { ModulAjarLKPD } from './components/guru/ModulAjarLKPD';

const AppContent: React.FC = () => {
  const {
    currentUser,
    activeMenu,
    toasts,
    dismissToast,
    feedbackModal,
    closeFeedbackModal
  } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  // If user is not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView />;
  }

  const renderActiveView = () => {
    switch (activeMenu) {
      // Admin Menus
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'admin-jadwal':
        return <JadwalMengajar />;
      case 'admin-users':
        return <ManajemenAkun />;
      case 'admin-guru':
        return <MasterDataGuru />;
      case 'admin-mapel':
        return <MasterDataMapel />;
      case 'admin-siswa':
        return <MasterDataSiswa />;
      case 'admin-logo':
        return <PengaturanAplikasi focusLogo={true} />;
      case 'admin-settings':
        return <PengaturanAplikasi />;

      // Guru Menus
      case 'guru-dashboard':
        return <GuruDashboard />;
      case 'guru-jadwal':
        return <JadwalMengajar />;
      case 'guru-jurnal':
        return <JurnalMengajar />;
      case 'guru-absensi':
        return <AbsensiSiswa />;
      case 'guru-nilai':
        return <NilaiSiswa />;
      case 'guru-rekap':
        return <RekapLaporan />;
      case 'guru-promes':
        return <ProgramSemester />;
      case 'guru-prota':
        return <ProgramTahunan />;
      case 'guru-modul':
        return <ModulAjarLKPD />;
      case 'guru-siswa':
        return <MasterDataSiswa />;

      default:
        return currentUser.role === 'admin' ? <AdminDashboard /> : <GuruDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global Animated Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Global Animated Feedback Modal (Success, Error, Warning, Loading) */}
      {feedbackModal && (
        <FeedbackModal
          isOpen={feedbackModal.isOpen}
          type={feedbackModal.type}
          title={feedbackModal.title}
          message={feedbackModal.message}
          confirmText={feedbackModal.confirmText}
          cancelText={feedbackModal.cancelText}
          onConfirm={feedbackModal.onConfirm}
          onClose={closeFeedbackModal}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
