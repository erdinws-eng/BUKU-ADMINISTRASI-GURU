import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, AlertTriangle, AlertOctagon, Loader2, Sparkles } from 'lucide-react';

export type FeedbackType = 'success' | 'error' | 'warning' | 'loading' | 'info';

export interface ToastItem {
  id: string;
  type: FeedbackType;
  title: string;
  message?: string;
  duration?: number;
}

export interface FeedbackModalState {
  isOpen: boolean;
  type: FeedbackType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  autoCloseMs?: number;
}

// ============================================================================
// 1. ANIMATED ICONS
// ============================================================================

export const AnimatedSuccessIcon: React.FC<{ size?: number }> = ({ size = 64 }) => {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Pulse wave behind icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.6 }}
        animate={{ scale: [0.8, 1.4, 1.6], opacity: [0.6, 0.2, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full bg-emerald-400"
      />

      {/* Main green circle */}
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 260 }}
        className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/30 text-white"
      >
        <svg
          viewBox="0 0 52 52"
          className="w-1/2 h-1/2 stroke-white stroke-[4] fill-none stroke-linecap-round stroke-linejoin-round"
        >
          <motion.path
            d="M14 27 l8 8 l16 -16"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
          />
        </svg>
      </motion.div>

      {/* Sparkle decorative dots */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            x: Math.cos((deg * Math.PI) / 180) * (size * 0.65),
            y: Math.sin((deg * Math.PI) / 180) * (size * 0.65)
          }}
          transition={{ duration: 0.7, delay: 0.2 + i * 0.04, ease: 'easeOut' }}
          className="absolute h-1.5 w-1.5 rounded-full bg-emerald-400"
        />
      ))}
    </div>
  );
};

export const AnimatedErrorIcon: React.FC<{ size?: number }> = ({ size = 64 }) => {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Shockwave ripple */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0.7 }}
        animate={{ scale: [0.8, 1.35, 1.5], opacity: [0.7, 0.2, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full bg-rose-400"
      />

      {/* Main red circle with shake */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{
          scale: 1,
          x: [0, -7, 7, -5, 5, -2, 2, 0]
        }}
        transition={{
          scale: { type: 'spring', damping: 12, stiffness: 220 },
          x: { duration: 0.55, delay: 0.1 }
        }}
        className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-rose-600 to-red-500 shadow-lg shadow-rose-500/30 text-white"
      >
        <svg
          viewBox="0 0 52 52"
          className="w-1/2 h-1/2 stroke-white stroke-[4] fill-none stroke-linecap-round stroke-linejoin-round"
        >
          <motion.path
            d="M16 16 L36 36"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          />
          <motion.path
            d="M36 16 L16 36"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.28 }}
          />
        </svg>
      </motion.div>
    </div>
  );
};

export const AnimatedWarningIcon: React.FC<{ size?: number }> = ({ size = 64 }) => {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Amber alert glow */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0.7 }}
        animate={{ scale: [0.9, 1.3, 1.5], opacity: [0.7, 0.25, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full bg-amber-400"
      />

      {/* Warning rounded shield/circle */}
      <motion.div
        initial={{ scale: 0, y: -10 }}
        animate={{
          scale: 1,
          y: [0, -3, 0],
          rotate: [0, -2, 2, 0]
        }}
        transition={{
          scale: { type: 'spring', damping: 13, stiffness: 240 },
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }
        }}
        className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 shadow-lg shadow-amber-500/30 text-white"
      >
        <AlertTriangle className="h-1/2 w-1/2 stroke-[2.5] text-amber-950" />
      </motion.div>
    </div>
  );
};

export const AnimatedLoadingSpinner: React.FC<{ size?: number; label?: string }> = ({ size = 64, label }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Soft rotating outer gradient ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-sky-400 to-teal-300 opacity-80 blur-xs"
        />

        {/* Center backdrop mask */}
        <div className="absolute inset-1 rounded-full bg-white dark:bg-slate-900" />

        {/* Primary rotating arc */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
          className="relative flex h-full w-full items-center justify-center"
        >
          <svg className="h-full w-full" viewBox="0 0 50 50">
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="4"
            />
            <motion.circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="#4F46E5"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="90, 150"
              strokeDashoffset="0"
            />
          </svg>
        </motion.div>

        {/* Center pulsating core */}
        <motion.div
          animate={{ scale: [0.75, 1, 0.75], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute h-3 w-3 rounded-full bg-indigo-600 shadow-sm"
        />
      </div>
      {label && (
        <motion.p
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs font-semibold text-slate-700 tracking-wide"
        >
          {label}
        </motion.p>
      )}
    </div>
  );
};

// ============================================================================
// 2. ANIMATED FEEDBACK MODAL (Popup Dialog)
// ============================================================================

export const FeedbackModal: React.FC<{
  isOpen: boolean;
  type: FeedbackType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onClose: () => void;
}> = ({
  isOpen,
  type,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onClose
}) => {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <AnimatedSuccessIcon size={64} />;
      case 'error':
        return <AnimatedErrorIcon size={64} />;
      case 'warning':
        return <AnimatedWarningIcon size={64} />;
      case 'loading':
        return <AnimatedLoadingSpinner size={64} label="Memproses data..." />;
      default:
        return <AnimatedSuccessIcon size={64} />;
    }
  };

  const getHeaderColors = () => {
    switch (type) {
      case 'success':
        return {
          titleColor: 'text-emerald-900',
          btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
        };
      case 'error':
        return {
          titleColor: 'text-rose-900',
          btnColor: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
        };
      case 'warning':
        return {
          titleColor: 'text-amber-950',
          btnColor: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
        };
      case 'loading':
        return {
          titleColor: 'text-indigo-900',
          btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
        };
      default:
        return {
          titleColor: 'text-slate-900',
          btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        };
    }
  };

  const colors = getHeaderColors();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={type !== 'loading' ? onClose : undefined}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl text-center"
        >
          {/* Top Close Button (disabled in loading) */}
          {type !== 'loading' && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Icon Presentation */}
          <div className="flex justify-center mb-4 mt-1">
            {renderIcon()}
          </div>

          {/* Title & Message */}
          <h3 className={`text-base sm:text-lg font-bold ${colors.titleColor}`}>
            {title}
          </h3>

          {message && (
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
              {message}
            </p>
          )}

          {/* Actions */}
          {type !== 'loading' && (
            <div className="mt-6 flex items-center justify-center gap-2.5">
              {cancelText && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  {cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                className={`w-full rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer ${colors.btnColor}`}
              >
                {confirmText || (type === 'error' ? 'Tutup' : 'Mengerti')}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ============================================================================
// 3. TOAST NOTIFICATION STACK
// ============================================================================

export const ToastNotificationItem: React.FC<{
  item: ToastItem;
  onDismiss: (id: string) => void;
}> = ({ item, onDismiss }) => {
  useEffect(() => {
    if (item.type === 'loading') return; // Don't auto-dismiss loading
    const timer = setTimeout(() => {
      onDismiss(item.id);
    }, item.duration || 3800);
    return () => clearTimeout(timer);
  }, [item, onDismiss]);

  const getStyle = () => {
    switch (item.type) {
      case 'success':
        return {
          border: 'border-emerald-200',
          bg: 'bg-white',
          iconBg: 'bg-emerald-100 text-emerald-700',
          title: 'text-emerald-950',
          bar: 'bg-emerald-500',
          icon: <Check className="h-4 w-4 stroke-[3]" />
        };
      case 'error':
        return {
          border: 'border-rose-200',
          bg: 'bg-white',
          iconBg: 'bg-rose-100 text-rose-700',
          title: 'text-rose-950',
          bar: 'bg-rose-500',
          icon: <AlertOctagon className="h-4 w-4" />
        };
      case 'warning':
        return {
          border: 'border-amber-200',
          bg: 'bg-white',
          iconBg: 'bg-amber-100 text-amber-800',
          title: 'text-amber-950',
          bar: 'bg-amber-500',
          icon: <AlertTriangle className="h-4 w-4" />
        };
      case 'loading':
        return {
          border: 'border-indigo-200',
          bg: 'bg-white',
          iconBg: 'bg-indigo-100 text-indigo-700',
          title: 'text-indigo-950',
          bar: 'bg-indigo-500',
          icon: <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
        };
      default:
        return {
          border: 'border-slate-200',
          bg: 'bg-white',
          iconBg: 'bg-slate-100 text-slate-700',
          title: 'text-slate-900',
          bar: 'bg-slate-500',
          icon: <Sparkles className="h-4 w-4" />
        };
    }
  };

  const style = getStyle();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className={`relative flex w-80 max-w-[calc(100vw-32px)] items-start gap-3 rounded-2xl border ${style.border} ${style.bg} p-3.5 shadow-xl shadow-slate-200/70 overflow-hidden`}
    >
      {/* Icon Badge */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${style.iconBg}`}>
        {style.icon}
      </div>

      {/* Text Info */}
      <div className="flex-1 overflow-hidden pr-2">
        <p className={`text-xs font-bold leading-snug ${style.title}`}>{item.title}</p>
        {item.message && (
          <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{item.message}</p>
        )}
      </div>

      {/* Dismiss Button */}
      <button
        onClick={() => onDismiss(item.id)}
        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
        title="Tutup notifikasi"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Animated bottom progress line */}
      {item.type !== 'loading' && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: (item.duration || 3800) / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 h-0.5 ${style.bar}`}
        />
      )}
    </motion.div>
  );
};

export const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 pointer-events-none sm:right-6">
      <div className="flex flex-col gap-2.5 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastNotificationItem key={toast.id} item={toast} onDismiss={onDismiss} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================================================
// 4. INTERACTIVE ANIMATION TESTER MODAL (Tester UI requested by user)
// ============================================================================

export const AnimationTesterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  triggerToast: (type: FeedbackType, title: string, message?: string) => void;
  triggerModal: (type: FeedbackType, title: string, message?: string) => void;
}> = ({ isOpen, onClose, triggerToast, triggerModal }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Uji Animasi UI/UX Sistem</h3>
              <p className="text-xs text-slate-500">Pratinjau animasi Berhasil, Gagal, Peringatan & Loading</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Test Cards Grid */}
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">
              1. Uji Tampilan Modal Animasi Penuh (Dialog Layar):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() =>
                  triggerModal(
                    'success',
                    'Data Berhasil Disimpan!',
                    'Perubahan penilaian, absensi, atau modul ajar telah berhasil diperbarui ke sistem.'
                  )
                }
                className="flex flex-col items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-emerald-800 hover:bg-emerald-100 transition cursor-pointer group shadow-2xs"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white group-hover:scale-110 transition">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
                <span className="text-xs font-bold">Berhasil</span>
                <span className="text-[10px] text-emerald-600">Pop-up Sukses</span>
              </button>

              <button
                onClick={() =>
                  triggerModal(
                    'error',
                    'Gagal Menyimpan Data!',
                    'Terjadi kesalahan input atau koneksi. Silakan periksa kembali kelengkapan formulir Anda.'
                  )
                }
                className="flex flex-col items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-rose-800 hover:bg-rose-100 transition cursor-pointer group shadow-2xs"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white group-hover:scale-110 transition">
                  <X className="h-4 w-4 stroke-[3]" />
                </div>
                <span className="text-xs font-bold">Gagal</span>
                <span className="text-[10px] text-rose-600">Pop-up Error</span>
              </button>

              <button
                onClick={() =>
                  triggerModal(
                    'warning',
                    'Peringatan Pengisian!',
                    'Mata pelajaran belum terisi lengkap atau bobot penilaian belum mencapai total 100%.'
                  )
                }
                className="flex flex-col items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-amber-800 hover:bg-amber-100 transition cursor-pointer group shadow-2xs"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white group-hover:scale-110 transition">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold">Peringatan</span>
                <span className="text-[10px] text-amber-700">Pop-up Alert</span>
              </button>

              <button
                onClick={() => {
                  triggerModal('loading', 'Menyinkronkan Data...', 'Mohon tunggu, sistem sedang memproses dokumen Anda.');
                  setTimeout(() => {
                    triggerModal('success', 'Sinkronisasi Selesai!', 'Semua berkas dan nilai telah terintegrasi rapi.');
                  }, 2200);
                }}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3 text-indigo-800 hover:bg-indigo-100 transition cursor-pointer group shadow-2xs"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white group-hover:scale-110 transition">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <span className="text-xs font-bold">Loading</span>
                <span className="text-[10px] text-indigo-600">Proses & Auto-Done</span>
              </button>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">
              2. Uji Notifikasi Toast Mengambang (Pojok Kanan Atas):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() =>
                  triggerToast('success', 'Nilai Formatif Disimpan', '32 siswa kelas 7A berhasil diperbarui.')
                }
                className="rounded-xl border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/50 p-2.5 text-left text-xs transition cursor-pointer shadow-2xs"
              >
                <p className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Toast Berhasil
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Notifikasi aksi berhasil</p>
              </button>

              <button
                onClick={() =>
                  triggerToast('error', 'Gagal Mengunggah Berkas', 'Format file harus berupa format .xlsx atau .xls')
                }
                className="rounded-xl border border-slate-200 bg-white hover:border-rose-400 hover:bg-rose-50/50 p-2.5 text-left text-xs transition cursor-pointer shadow-2xs"
              >
                <p className="font-bold text-rose-700 flex items-center gap-1">
                  <X className="h-3 w-3" /> Toast Gagal
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Notifikasi kegagalan</p>
              </button>

              <button
                onClick={() =>
                  triggerToast('warning', 'KKTP Belum Diatur', 'Mata pelajaran ini masih menggunakan batas standar (75).')
                }
                className="rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/50 p-2.5 text-left text-xs transition cursor-pointer shadow-2xs"
              >
                <p className="font-bold text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Toast Peringatan
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Notifikasi hati-hati</p>
              </button>

              <button
                onClick={() => {
                  triggerToast('loading', 'Menyiapkan Cetak Raport...', 'Menghitung nilai akhir dan predikat capaian...');
                  setTimeout(() => {
                    triggerToast('success', 'Dokumen Siap Dicetak', 'Pratinjau cetak telah siap dibuka.');
                  }, 2400);
                }}
                className="rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 p-2.5 text-left text-xs transition cursor-pointer shadow-2xs"
              >
                <p className="font-bold text-indigo-700 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Toast Loading
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Notifikasi berputar</p>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer"
          >
            Tutup Pengujian
          </button>
        </div>
      </motion.div>
    </div>
  );
};
