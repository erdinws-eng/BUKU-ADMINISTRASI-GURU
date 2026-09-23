import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolSettings } from '../../types';
import { PageHeader } from '../shared/PageHeader';
import { SupabaseSettingsCard } from './SupabaseSettingsCard';
import { motion } from 'motion/react';
import {
  Sliders,
  School,
  Save,
  CheckCircle2,
  Calendar,
  Award,
  Database,
  Download,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  UploadCloud,
  Trash2,
  Link as LinkIcon,
  Sparkles,
  Eye,
  FileImage,
  RefreshCw,
  Check,
  BookOpen,
  Plus,
  Phone,
  Mail,
  Globe,
  Layout
} from 'lucide-react';

const PRESET_TUT_WURI_HANDAYANI = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><radialGradient id="kemdikbudGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%2338bdf8"/><stop offset="100%" stop-color="%230284c7"/></radialGradient></defs><polygon points="60,4 115,44 94,112 26,112 5,44" fill="url(%23kemdikbudGrad)" stroke="%23f59e0b" stroke-width="3.5"/><polygon points="60,11 108,46 90,105 30,105 12,46" fill="%230369a1"/><circle cx="60" cy="58" r="34" fill="%23ffffff" stroke="%23f59e0b" stroke-width="2.5"/><path d="M60 28 L64 42 L78 42 L67 51 L71 65 L60 56 L49 65 L53 51 L42 42 L56 42 Z" fill="%23f59e0b"/><path d="M36 75 C45 63 75 63 84 75 C75 80 45 80 36 75 Z" fill="%23dc2626"/><circle cx="60" cy="48" r="4.5" fill="%23f59e0b"/><text x="60" y="94" font-family="system-ui,sans-serif" font-size="7.5" font-weight="900" text-anchor="middle" fill="%230f172a" letter-spacing="0.5">TUT WURI</text><text x="60" y="102" font-family="system-ui,sans-serif" font-size="6.5" font-weight="900" text-anchor="middle" fill="%230284c7" letter-spacing="0.5">HANDAYANI</text></svg>`;

const PRESET_PENDIDIKAN_NASIONAL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" fill="%23065f46" stroke="%23f59e0b" stroke-width="4"/><circle cx="60" cy="60" r="48" fill="%23ffffff"/><path d="M30 52 C30 42 45 38 60 44 C75 38 90 42 90 52 L90 74 C75 69 60 72 60 72 C60 72 45 69 30 74 Z" fill="%23059669"/><path d="M60 44 L60 72" stroke="%23ffffff" stroke-width="2.5"/><path d="M60 25 L64 34 L74 34 L66 40 L70 49 L60 43 L50 49 L54 40 L46 34 L56 34 Z" fill="%23f59e0b"/><text x="60" y="88" font-family="system-ui,sans-serif" font-size="7" font-weight="800" text-anchor="middle" fill="%23065f46" letter-spacing="0.5">PENDIDIKAN</text><text x="60" y="96" font-family="system-ui,sans-serif" font-size="6" font-weight="800" text-anchor="middle" fill="%23d97706" letter-spacing="0.5">NASIONAL</text></svg>`;

interface PengaturanAplikasiProps {
  focusLogo?: boolean;
}

export const PengaturanAplikasi: React.FC<PengaturanAplikasiProps> = ({ focusLogo = false }) => {
  const {
    schoolSettings,
    updateSchoolSettings,
    resetAllData,
    gurus,
    siswas,
    jadwals,
    jurnals,
    absensis,
    nilais,
    protas,
    promesList,
    modulAjars,
    lkpds,
    showToast,
    showFeedbackModal
  } = useApp();

  const [formData, setFormData] = useState<SchoolSettings>(() => ({
    ...schoolSettings,
    appName: schoolSettings.appName || 'Buku Administrasi Guru',
    appSubtitle: schoolSettings.appSubtitle || 'Sistem Informasi Akademik',
    phone: schoolSettings.phone || '',
    email: schoolSettings.email || '',
    website: schoolSettings.website || '',
    portalFeatures:
      schoolSettings.portalFeatures && schoolSettings.portalFeatures.length > 0
        ? schoolSettings.portalFeatures
        : [
            'Perangkat Kurikulum Merdeka & K13',
            'Absensi harian, nilai formatif & sumatif',
            'Jurnal mengajar, Prota, Promes & LKPD',
            'Format cetak resmi berstandar Dinas'
          ]
  }));
  const [newFeatureText, setNewFeatureText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...schoolSettings,
      appName: schoolSettings.appName || prev.appName || 'Buku Administrasi Guru',
      appSubtitle: schoolSettings.appSubtitle || prev.appSubtitle || 'Sistem Informasi Akademik',
      phone: schoolSettings.phone ?? prev.phone ?? '',
      email: schoolSettings.email ?? prev.email ?? '',
      website: schoolSettings.website ?? prev.website ?? '',
      portalFeatures:
        schoolSettings.portalFeatures && schoolSettings.portalFeatures.length > 0
          ? schoolSettings.portalFeatures
          : prev.portalFeatures && prev.portalFeatures.length > 0
          ? prev.portalFeatures
          : [
              'Perangkat Kurikulum Merdeka & K13',
              'Absensi harian, nilai formatif & sumatif',
              'Jurnal mengajar, Prota, Promes & LKPD',
              'Format cetak resmi berstandar Dinas'
            ]
    }));
  }, [schoolSettings]);

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    const updated = [...(formData.portalFeatures || []), newFeatureText.trim()];
    setFormData({ ...formData, portalFeatures: updated });
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index: number) => {
    const updated = (formData.portalFeatures || []).filter((_, i) => i !== index);
    setFormData({ ...formData, portalFeatures: updated });
  };

  const handleResetFeatures = () => {
    const defaults = [
      'Perangkat Kurikulum Merdeka & K13',
      'Absensi harian, nilai formatif & sumatif',
      'Jurnal mengajar, Prota, Promes & LKPD',
      'Format cetak resmi berstandar Dinas'
    ];
    setFormData({ ...formData, portalFeatures: defaults });
    showToast('info', 'Fitur Direset', 'Daftar fitur portal login dikembalikan ke standar.');
  };

  useEffect(() => {
    if (focusLogo && logoSectionRef.current) {
      logoSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusLogo]);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Format Tidak Didukung', 'Harap unggah file gambar (PNG, JPG, WebP, atau SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('warning', 'Ukuran Terlalu Besar', 'Maksimal ukuran file gambar adalah 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      if (file.type === 'image/svg+xml') {
        setFormData((prev) => ({ ...prev, logoUrl: result }));
        updateSchoolSettings({ logoUrl: result });
        showToast('success', 'Logo Diperbarui', 'Logo sekolah format SVG berhasil diunggah.');
        return;
      }

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedDataUrl = canvas.toDataURL('image/png');
          setFormData((prev) => ({ ...prev, logoUrl: optimizedDataUrl }));
          updateSchoolSettings({ logoUrl: optimizedDataUrl });
          showToast('success', 'Logo Diperbarui', 'Logo sekolah berhasil dipasang dan dioptimalkan.');
        } else {
          setFormData((prev) => ({ ...prev, logoUrl: result }));
          updateSchoolSettings({ logoUrl: result });
          showToast('success', 'Logo Diperbarui', 'Logo sekolah berhasil dipasang.');
        }
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // Reset file input so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrl.trim()) {
      showToast('warning', 'Tautan Kosong', 'Harap masukkan URL tautan gambar logo.');
      return;
    }
    setFormData((prev) => ({ ...prev, logoUrl: customUrl.trim() }));
    updateSchoolSettings({ logoUrl: customUrl.trim() });
    setCustomUrl('');
    setShowUrlInput(false);
    showToast('success', 'Logo Ditautkan', 'Logo sekolah dari URL berhasil dipasang.');
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
    updateSchoolSettings({ logoUrl: '' });
    showToast('info', 'Logo Direset', 'Logo sekolah dikembalikan ke lambang standar sistem.');
  };

  const handleApplyPreset = (presetSvg: string, name: string) => {
    setFormData((prev) => ({ ...prev, logoUrl: presetSvg }));
    updateSchoolSettings({ logoUrl: presetSvg });
    showToast('success', 'Preset Diterapkan', `Logo ${name} berhasil diterapkan.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolSettings(formData);
    showToast('success', 'Pengaturan Disimpan!', 'Data identitas satuan pendidikan dan kurikulum berhasil diperbarui.');
  };

  const handleExportBackup = () => {
    const fullBackup = {
      timestamp: new Date().toISOString(),
      schoolSettings: formData,
      gurus,
      siswas,
      jadwals,
      jurnals,
      absensis,
      nilais,
      protas,
      promesList,
      modulAjars,
      lkpds
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `backup-administrasi-guru-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('info', 'Cadangan Diunduh', 'Berkas JSON cadangan data sekolah telah berhasil diunduh.');
  };

  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <div className="no-print">
        <PageHeader
          title="Pengaturan Aplikasi & Kurikulum"
          subtitle="Atur identitas sekolah, kepala sekolah, tahun ajaran aktif, kurikulum nasional, dan standar bobot penilaian."
          badge="Konfigurasi Utama"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                id="btn-export-backup"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Unduh Cadangan</span>
              </motion.button>
            </div>
          }
          stats={[
            { label: 'Kurikulum Acuan', value: schoolSettings.curriculum, helper: 'Fase D / Tingkat SMP' },
            { label: 'Tahun Ajaran', value: schoolSettings.academicYear, helper: `Semester ${schoolSettings.activeSemester}` },
            { label: 'Standar KKTP / KKM', value: `${schoolSettings.kkmDefault}`, helper: 'Skor ketuntasan minimal' },
            { label: 'Status Data', value: 'Terhubung', helper: `${gurus.length} Guru, ${siswas.length} Siswa` }
          ]}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Satuan Pendidikan */}
        <div
          ref={logoSectionRef}
          id="section-upload-logo"
          className={`rounded-2xl border transition-all duration-500 bg-white p-5 sm:p-6 shadow-xs ${
            focusLogo ? 'border-indigo-500 ring-4 ring-indigo-100 shadow-md' : 'border-slate-200/90'
          }`}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Logo Satuan Pendidikan / Lambang Sekolah</h2>
                <p className="text-[11px] text-slate-500">
                  Logo resmi untuk bilah navigasi sistem, halaman masuk aplikasi, dan kop surat cetak dokumen kurikulum.
                </p>
              </div>
            </div>
            {formData.logoUrl && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                <Check className="h-3 w-3" />
                Logo Kustom Aktif
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Logo Preview Box */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-center lg:col-span-4">
              <div className="relative mb-3 flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-2 shadow-2xs">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo Sekolah"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <School className="h-10 w-10 text-slate-300" />
                    <span className="mt-1 text-[10px] font-medium text-slate-400">Logo Standar</span>
                  </div>
                )}
                {formData.logoUrl && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>

              <p className="text-xs font-bold text-slate-800 line-clamp-1">
                {formData.schoolName || 'SMP / SMA Negeri'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {formData.logoUrl ? 'Gambar Logo Satuan Pendidikan' : 'Belum mengunggah logo kustom'}
              </p>

              {formData.logoUrl && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  id="btn-remove-school-logo"
                  onClick={handleRemoveLogo}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus / Reset Logo</span>
                </motion.button>
              )}
            </div>

            {/* Right: Drag-and-Drop & Selection Area */}
            <div className="space-y-4 lg:col-span-8">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/70 scale-[1.01]'
                    : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  id="input-file-logo"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-2">
                  <UploadCloud className="h-6 w-6" />
                </div>

                <p className="text-xs font-bold text-slate-800">
                  Tarik & lepas berkas logo sekolah ke sini
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
                  atau pilih berkas langsung dari perangkat Anda
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    id="btn-trigger-upload-logo"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
                  >
                    <FileImage className="h-3.5 w-3.5" />
                    <span>Pilih Berkas Logo</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    id="btn-toggle-url-logo"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <LinkIcon className="h-3.5 w-3.5 text-slate-500" />
                    <span>Tautkan URL</span>
                  </motion.button>
                </div>

                <p className="mt-3 text-[10px] text-slate-400">
                  Format didukung: <strong>PNG, JPG, WebP, SVG</strong> (Maks. 5 MB). Gambar akan otomatis dioptimalkan.
                </p>
              </div>

              {/* URL Input Form (if toggled) */}
              {showUrlInput && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Masukkan URL Gambar Logo Publik:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      id="input-logo-url"
                      placeholder="https://example.com/logo-sekolah.png"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      id="btn-apply-logo-url"
                      onClick={handleApplyUrl}
                      className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-900 transition cursor-pointer"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Presets for Indonesian Schools */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
                <p className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Preset Lambang Resmi Pendidikan Indonesia:</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    id="btn-preset-tutwuri"
                    onClick={() => handleApplyPreset(PRESET_TUT_WURI_HANDAYANI, 'Tut Wuri Handayani (Kemendikbud)')}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-sky-300 hover:bg-sky-50/50 transition cursor-pointer"
                  >
                    <img
                      src={PRESET_TUT_WURI_HANDAYANI}
                      alt="Tut Wuri Handayani"
                      className="h-4 w-4 object-contain"
                    />
                    <span>Tut Wuri Handayani (Kemendikbud)</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    id="btn-preset-pendidikan-nasional"
                    onClick={() => handleApplyPreset(PRESET_PENDIDIKAN_NASIONAL, 'Pendidikan Nasional')}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 transition cursor-pointer"
                  >
                    <img
                      src={PRESET_PENDIDIKAN_NASIONAL}
                      alt="Pendidikan Nasional"
                      className="h-4 w-4 object-contain"
                    />
                    <span>Lambang Pendidikan Nasional</span>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Strip */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Eye className="h-3.5 w-3.5 text-indigo-600" />
              <span>Simulasi Pratinjau Tampilan Logo:</span>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {/* Preview 1: Di Navbar */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col justify-between">
                <div>
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Pratinjau Di Bilah Navigasi (Header)
                  </span>
                  <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white p-0.5 overflow-hidden shadow-2xs">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Logo"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <School className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">{formData.appName || 'Buku Administrasi Guru'}</span>
                        <span className="shrink-0 rounded bg-indigo-50 px-1 py-0.2 text-[9px] font-bold text-indigo-700 border border-indigo-200">
                          {formData.curriculum === 'Kurikulum Merdeka' ? 'Kurikulum Merdeka' : 'K13'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1">
                        {formData.schoolName || 'SMP / SMA Negeri'} | TA {formData.academicYear}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview 2: Di Kop Surat Resmi */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col justify-between">
                <div>
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Pratinjau Di Kop Surat Cetak Dokumen
                  </span>
                  <div className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-800 shadow-2xs">
                    <div className="flex items-center gap-2.5 border-b border-slate-800 pb-1.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded border border-slate-800 bg-slate-50 p-0.5 overflow-hidden shrink-0">
                        {formData.logoUrl ? (
                          <img
                            src={formData.logoUrl}
                            alt="Logo"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <School className="h-6 w-6 text-slate-700" />
                        )}
                      </div>
                      <div>
                        <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-500">
                          Pemerintah Provinsi / Dinas Pendidikan
                        </p>
                        <p className="text-xs font-bold uppercase tracking-tight text-slate-900 leading-tight line-clamp-1">
                          {formData.schoolName || 'SMP / SMA Negeri'}
                        </p>
                        <p className="text-[9px] text-slate-600 line-clamp-1">
                          NPSN: {formData.npsn || '-'} | {formData.address || 'Alamat Sekolah'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview 3: Di Halaman Masuk (Portal Login) */}
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-900 to-slate-900 p-3 text-white flex flex-col justify-between shadow-2xs">
                <div>
                  <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Pratinjau Di Panel Halaman Masuk
                  </span>
                  <div className="space-y-2 rounded-lg bg-white/10 p-2.5 backdrop-blur-xs border border-white/15">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 p-0.5 overflow-hidden shrink-0">
                        {formData.logoUrl ? (
                          <img src={formData.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-emerald-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight line-clamp-1">{formData.appName || 'Buku Administrasi Guru'}</p>
                        <p className="text-[9px] text-emerald-300 font-medium line-clamp-1">{formData.appSubtitle || 'Sistem Informasi Akademik'}</p>
                      </div>
                    </div>

                    <div className="rounded bg-black/20 p-1.5 text-[10px] border border-white/10">
                      <p className="font-bold line-clamp-1 text-emerald-100">{formData.schoolName || 'SMP / SMA Negeri'}</p>
                      <p className="text-[9px] text-emerald-200/80">NPSN: {formData.npsn || '-'} | {formData.address || 'Alamat Sekolah'}</p>
                    </div>

                    <div className="space-y-1 text-[9px] text-emerald-100/90 pt-0.5">
                      {(formData.portalFeatures || []).slice(0, 2).map((feat, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span className="line-clamp-1">{feat}</span>
                        </div>
                      ))}
                      {(formData.portalFeatures || []).length > 2 && (
                        <p className="text-[8px] text-emerald-300 italic">+{(formData.portalFeatures || []).length - 2} fitur lainnya</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Identitas Satuan Pendidikan */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <School className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Identitas Satuan Pendidikan</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Nama Sekolah</label>
              <input
                id="input-school-name"
                type="text"
                required
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">NPSN (Nomor Pokok Sekolah Nasional)</label>
              <input
                id="input-school-npsn"
                type="text"
                required
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">Alamat Lengkap Sekolah</label>
              <input
                id="input-school-address"
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Telepon / Kontak Satuan Pendidikan</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  id="input-school-phone"
                  type="text"
                  placeholder="(021) 7890123"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Email Resmi Sekolah</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  id="input-school-email"
                  type="email"
                  placeholder="info@sekolah.sch.id"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Nama Kepala Sekolah & Gelar</label>
              <input
                id="input-headmaster-name"
                type="text"
                required
                value={formData.headmasterName}
                onChange={(e) => setFormData({ ...formData, headmasterName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">NIP Kepala Sekolah</label>
              <input
                id="input-headmaster-nip"
                type="text"
                required
                value={formData.headmasterNip}
                onChange={(e) => setFormData({ ...formData, headmasterNip: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Kustomisasi Teks & Branding Halaman Masuk (Portal Login) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Layout className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Tampilan & Branding Halaman Masuk (Portal Login)</h2>
                <p className="text-[11px] text-slate-500">
                  Kustomisasi judul, subjudul, dan daftar poin keunggulan/fitur yang ditampilkan pada panel samping halaman login.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetFeatures}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Reset fitur ke susunan standar"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset Fitur Standar</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Judul Aplikasi / Sistem
                </label>
                <input
                  id="input-app-name"
                  type="text"
                  placeholder="Buku Administrasi Guru"
                  value={formData.appName || ''}
                  onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Tampil sebagai nama utama di banner login dan bilah navigasi atas.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Subjudul / Label Keterangan
                </label>
                <input
                  id="input-app-subtitle"
                  type="text"
                  placeholder="Sistem Informasi Akademik"
                  value={formData.appSubtitle || ''}
                  onChange={(e) => setFormData({ ...formData, appSubtitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Keterangan singkat di bawah judul pada panel samping login.
                </p>
              </div>
            </div>

            {/* Poin Fitur Unggulan Satuan Pendidikan */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <label className="mb-2 block text-xs font-bold text-slate-700">
                Poin Fitur & Layanan Administrasi (Tampil dengan Ikon Ceklis di Halaman Masuk):
              </label>

              <div className="space-y-2 mb-3">
                {(formData.portalFeatures || []).map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-2xs"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => {
                        const updated = [...(formData.portalFeatures || [])];
                        updated[idx] = e.target.value;
                        setFormData({ ...formData, portalFeatures: updated });
                      }}
                      className="flex-1 text-xs text-slate-800 bg-transparent border-none focus:outline-none font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                      title="Hapus poin ini"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {(!formData.portalFeatures || formData.portalFeatures.length === 0) && (
                  <p className="text-xs text-slate-400 italic py-1">
                    Belum ada poin fitur yang ditambahkan. Gunakan kolom di bawah untuk menambahkan poin baru.
                  </p>
                )}
              </div>

              {/* Add New Feature Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: Modul Ajar terintegrasi Kemenag & Kemendikbudristek"
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition cursor-pointer shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Poin</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Periode Akademik & Kurikulum */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Periode Akademik & Kurikulum</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Tahun Ajaran</label>
              <input
                id="input-academic-year"
                type="text"
                required
                placeholder="2025/2026"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Semester Aktif</label>
              <select
                id="select-semester"
                value={formData.activeSemester}
                onChange={(e) => setFormData({ ...formData, activeSemester: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Pilihan Kurikulum</label>
              <select
                id="select-curriculum"
                value={formData.curriculum}
                onChange={(e) => setFormData({ ...formData, curriculum: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="Kurikulum Merdeka">Kurikulum Merdeka (Capaian Pembelajaran)</option>
                <option value="Kurikulum 2013">Kurikulum 2013 (Kompetensi Dasar)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Standar & Bobot Penilaian Siswa */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-800">Standar & Bobot Penilaian Nilai Akhir</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                KKM / KKTP Standar
              </label>
              <input
                id="input-kkm"
                type="number"
                min={50}
                max={100}
                value={formData.kkmDefault}
                onChange={(e) => setFormData({ ...formData, kkmDefault: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-slate-400">Batas Kriteria Ketercapaian</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Bobot Formatif (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.gradingWeight.formatif}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gradingWeight: { ...formData.gradingWeight, formatif: Number(e.target.value) }
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-slate-400">Tugas harian, kuis & proses</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Bobot Sumatif Tengah (STS) (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.gradingWeight.sts}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gradingWeight: { ...formData.gradingWeight, sts: Number(e.target.value) }
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-slate-400">Asesmen Tengah Semester</p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Bobot Sumatif Akhir (SAS) (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.gradingWeight.sas}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gradingWeight: { ...formData.gradingWeight, sas: Number(e.target.value) }
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-slate-400">Asesmen Akhir Semester</p>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-indigo-50/50 p-2 text-[11px] text-indigo-700 font-medium">
            Total Bobot: {formData.gradingWeight.formatif + formData.gradingWeight.sts + formData.gradingWeight.sas}% 
            {formData.gradingWeight.formatif + formData.gradingWeight.sts + formData.gradingWeight.sas !== 100 && (
              <span className="text-rose-600 ml-1 font-bold">(Peringatan: Total bobot sebaiknya bernilai 100%)</span>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            id="btn-save-settings"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-2.5 text-xs font-bold text-white hover:from-slate-900 hover:to-black shadow-md shadow-slate-300 transition cursor-pointer"
          >
            <Save className="h-4 w-4 text-emerald-400" />
            <span>Simpan Perubahan Pengaturan</span>
          </motion.button>
        </div>
      </form>

      {/* Supabase Cloud Database Integration */}
      <SupabaseSettingsCard />

      {/* Data Backup & Reset */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-bold text-slate-800">Manajemen Cadangan Data (Backup & Reset)</h2>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Unduh seluruh data administrasi sekolah (guru, siswa, nilai, jadwal, absensi, prota, promes, modul) ke format berkas JSON untuk arsip offline.
        </p>

        <div className="flex flex-wrap gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            id="btn-export-backup"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Ekspor / Download Cadangan JSON</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            id="btn-reset-default"
            onClick={() => {
              showFeedbackModal({
                type: 'error',
                title: 'Kosongkan Seluruh Data Sistem?',
                message: 'PERINGATAN: Semua data siswa, jadwal, jurnal mengajar, absensi, nilai, dan perangkat kurikulum akan dibersihkan. Tindakan ini tidak dapat dibatalkan.',
                confirmText: 'Ya, Bersihkan Data',
                cancelText: 'Batalkan',
                onConfirm: () => {
                  resetAllData();
                  setFormData({
                    ...schoolSettings,
                    appName: 'Buku Administrasi Guru',
                    appSubtitle: 'Sistem Informasi Akademik',
                    phone: '',
                    email: '',
                    website: '',
                    portalFeatures: [
                      'Perangkat Kurikulum Merdeka & K13',
                      'Absensi harian, nilai formatif & sumatif',
                      'Jurnal mengajar, Prota, Promes & LKPD',
                      'Format cetak resmi berstandar Dinas'
                    ]
                  });
                  showToast('info', 'Data Dibersihkan', 'Semua data administrasi telah dikosongkan.');
                }
              });
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 shadow-xs cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 text-rose-600" />
            <span>Kosongkan & Bersihkan Semua Data</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
