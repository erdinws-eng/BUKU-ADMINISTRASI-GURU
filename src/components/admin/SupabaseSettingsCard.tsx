import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Code2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Server,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  testSupabaseConnection,
  pushAllToSupabase,
  pullAllFromSupabase,
  SUPABASE_SETUP_SQL,
  ConnectionTestResult
} from '../../lib/supabaseService';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../lib/supabase';

export const SupabaseSettingsCard: React.FC = () => {
  const {
    schoolSettings,
    users,
    gurus,
    siswas,
    mapels,
    jadwals,
    jurnals,
    absensis,
    nilais,
    protas,
    promesList,
    modulAjars,
    lkpds,
    updateSchoolSettings,
    showToast,
    showFeedbackModal
  } = useApp();

  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Auto test connection on mount
  useEffect(() => {
    handleTestConnection(true);
  }, []);

  const handleTestConnection = async (silent = false) => {
    setIsTesting(true);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (!silent) {
        if (res.success) {
          if (res.tableExists === false) {
            showToast('warning', 'Supabase Terhubung', res.message, 5000);
          } else {
            showToast('success', 'Koneksi Supabase Berhasil!', res.message);
          }
        } else {
          showToast('error', 'Koneksi Supabase Gagal', res.message, 5000);
        }
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Gagal menghubungi Supabase'
      });
      if (!silent) {
        showToast('error', 'Koneksi Gagal', err.message);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handlePushToSupabase = async () => {
    setIsSyncing(true);
    try {
      const payload = {
        schoolSettings,
        users,
        gurus,
        siswas,
        mapels,
        jadwals,
        jurnals,
        absensis,
        nilais,
        protas,
        promesList,
        modulAjars,
        lkpds
      };

      const result = await pushAllToSupabase(payload);
      if (result.success) {
        showToast('success', 'Sinkronisasi Berhasil!', result.message, 4500);
        // Re-check connection to ensure table state is refreshed
        handleTestConnection(true);
      } else {
        showToast('error', 'Sinkronisasi Gagal', result.message, 6000);
      }
    } catch (err: any) {
      showToast('error', 'Gagal Mengunggah', err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSupabase = async () => {
    showFeedbackModal({
      type: 'warning',
      title: 'Tarik & Pulihkan Data dari Supabase?',
      message:
        'Data lokal saat ini akan diperbarui dengan data snapshot terbaru yang ada di database Supabase Cloud. Lanjutkan proses pemulihan?',
      confirmText: 'Ya, Tarik Data',
      cancelText: 'Batalkan',
      onConfirm: async () => {
        setIsPulling(true);
        try {
          const result = await pullAllFromSupabase();
          if (result.success && result.data) {
            const d = result.data;
            if (d.schoolSettings) updateSchoolSettings(d.schoolSettings);
            // Simpan ke storage melalui reload halus atau notifikasi
            localStorage.setItem('schoolSettings', JSON.stringify(d.schoolSettings || schoolSettings));
            if (d.users) localStorage.setItem('users', JSON.stringify(d.users));
            if (d.gurus) localStorage.setItem('gurus', JSON.stringify(d.gurus));
            if (d.siswas) localStorage.setItem('siswas', JSON.stringify(d.siswas));
            if (d.mapels) localStorage.setItem('mapels', JSON.stringify(d.mapels));
            if (d.jadwals) localStorage.setItem('jadwals', JSON.stringify(d.jadwals));
            if (d.jurnals) localStorage.setItem('jurnals', JSON.stringify(d.jurnals));
            if (d.absensis) localStorage.setItem('absensis', JSON.stringify(d.absensis));
            if (d.nilais) localStorage.setItem('nilais', JSON.stringify(d.nilais));
            if (d.protas) localStorage.setItem('protas', JSON.stringify(d.protas));
            if (d.promesList) localStorage.setItem('promesList', JSON.stringify(d.promesList));
            if (d.modulAjars) localStorage.setItem('modulAjars', JSON.stringify(d.modulAjars));
            if (d.lkpds) localStorage.setItem('lkpds', JSON.stringify(d.lkpds));

            showToast(
              'success',
              'Data Supabase Dipulihkan!',
              'Seluruh data berhasil diselaraskan dari database Supabase Cloud. Halaman akan menyegarkan data.',
              4000
            );

            // Trigger reload to refresh context from local storage
            setTimeout(() => {
              window.location.reload();
            }, 1200);
          } else {
            showToast('error', 'Gagal Menarik Data', result.message, 5000);
          }
        } catch (err: any) {
          showToast('error', 'Kesalahan Unduh', err.message);
        } finally {
          setIsPulling(false);
        }
      }
    });
  };

  const copyToClipboard = (text: string, type: 'sql' | 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
      showToast('info', 'Kode Disalin', 'Script SQL berhasil disalin ke clipboard.');
    } else if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
      showToast('info', 'URL Disalin', 'Endpoint Supabase URL berhasil disalin.');
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      showToast('info', 'Anon Key Disalin', 'Supabase Anon Key berhasil disalin.');
    }
  };

  const projectId = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 shadow-2xs">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">
                Setup Database Supabase (Cloud PostgreSQL)
              </h2>
              <span className="rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 border border-emerald-200">
                PostgreSQL Cloud
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Penyimpanan cloud terpusat untuk sinkronisasi data guru, siswa, jurnal, nilai, dan kurikulum secara realtime.
            </p>
          </div>
        </div>

        {/* Real-time Status Badge */}
        <div className="flex items-center gap-2">
          {isTesting ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-500" />
              <span>Memeriksa...</span>
            </span>
          ) : testResult?.success ? (
            testResult.tableExists === false ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>Terhubung (Tabel Belum Siap)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Database Siap ({testResult.latencyMs}ms)</span>
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              <span>Belum Terhubung</span>
            </span>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            id="btn-test-supabase"
            onClick={() => handleTestConnection(false)}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer disabled:opacity-60"
            title="Uji kembali koneksi ke server Supabase"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
            <span>Tes Koneksi</span>
          </motion.button>
        </div>
      </div>

      {/* Connection Info Boxes */}
      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Project API URL */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 lg:col-span-6">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-slate-500" />
              <span>Supabase API URL</span>
            </span>
            <button
              type="button"
              id="btn-copy-supabase-url"
              onClick={() => copyToClipboard(SUPABASE_URL, 'url')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              {copiedUrl ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{copiedUrl ? 'Tersalin' : 'Salin URL'}</span>
            </button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 shadow-2xs">
            <span className="truncate">{SUPABASE_URL}</span>
            <span className="ml-2 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
              REST v1
            </span>
          </div>
        </div>

        {/* Project Anon Key */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 lg:col-span-6">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Supabase Public Anon Key (JWT)</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-toggle-show-key"
                onClick={() => setShowKey(!showKey)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                <span>{showKey ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>
              <button
                type="button"
                id="btn-copy-supabase-key"
                onClick={() => copyToClipboard(SUPABASE_ANON_KEY, 'key')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                {copiedKey ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copiedKey ? 'Tersalin' : 'Salin Key'}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-800 shadow-2xs">
            <span className="truncate">
              {showKey ? SUPABASE_ANON_KEY : `${SUPABASE_ANON_KEY.substring(0, 16)}••••••••••••••••••••••••${SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 12)}`}
            </span>
            <span className="ml-2 shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Database Setup Notice if table not created */}
      {testResult && testResult.tableExists === false && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-amber-900">
                Langkah Inisialisasi: Buat Tabel di Dasbor Supabase
              </h3>
              <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                Koneksi ke endpoint project berhasil, namun tabel <code>app_sync_store</code> belum dibuat. 
                Cukup salin script SQL yang telah disiapkan lalu tempel dan jalankan di menu <strong>SQL Editor</strong> Supabase Anda.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  id="btn-open-sql-modal-notice"
                  onClick={() => setShowSqlModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-amber-900 transition cursor-pointer"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Lihat & Salin Script SQL</span>
                </motion.button>
                <a
                  href={`https://supabase.com/dashboard/project/${projectId}/sql/new`}
                  target="_blank"
                  rel="noreferrer"
                  id="link-goto-supabase-sql"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                >
                  <span>Buka SQL Editor Supabase</span>
                  <ExternalLink className="h-3 w-3 text-amber-700" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Synchronization Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
        <div>
          <h3 className="text-xs font-bold text-slate-800">
            Sinkronisasi Cloud Data Sekolah
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cadangkan data administrasi lokal Anda ke Supabase atau pulihkan data dari cloud ke perangkat ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Push Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            id="btn-push-supabase"
            onClick={handlePushToSupabase}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-200 hover:from-emerald-700 hover:to-teal-700 transition cursor-pointer disabled:opacity-60"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            <span>{isSyncing ? 'Mengunggah ke Cloud...' : 'Unggah / Sinkronkan ke Supabase'}</span>
          </motion.button>

          {/* Pull Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            id="btn-pull-supabase"
            onClick={handlePullFromSupabase}
            disabled={isPulling}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer disabled:opacity-60"
          >
            {isPulling ? (
              <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />
            ) : (
              <DownloadCloud className="h-4 w-4 text-slate-600" />
            )}
            <span>{isPulling ? 'Menarik Data...' : 'Tarik / Pulihkan dari Cloud'}</span>
          </motion.button>

          {/* SQL Script View Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            id="btn-open-sql-modal"
            onClick={() => setShowSqlModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <Code2 className="h-4 w-4 text-indigo-600" />
            <span>Script SQL</span>
          </motion.button>

          {/* Open Supabase Dashboard */}
          <a
            href={`https://supabase.com/dashboard/project/${projectId}`}
            target="_blank"
            rel="noreferrer"
            id="link-open-supabase-dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            <span>Dasbor</span>
          </a>
        </div>
      </div>

      {/* SQL Script Modal */}
      <AnimatePresence>
        {showSqlModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <Code2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Script SQL Setup Tabel Supabase
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Jalankan skrip ini sekali di menu SQL Editor pada dasbor Supabase Anda.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-close-sql-modal"
                  onClick={() => setShowSqlModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">
                    Skema Tabel (PostgreSQL + RLS Policies):
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    id="btn-copy-sql-in-modal"
                    onClick={() => copyToClipboard(SUPABASE_SETUP_SQL, 'sql')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition cursor-pointer"
                  >
                    {copiedSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedSql ? 'Berhasil Disalin!' : 'Salin Kode SQL'}</span>
                  </motion.button>
                </div>

                <div className="relative max-h-80 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-300">
                  <pre className="whitespace-pre-wrap">{SUPABASE_SETUP_SQL}</pre>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700 mb-1">Cara Menjalankan di Supabase:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-600">
                    <li>Klik tombol <strong>"Salin Kode SQL"</strong> di atas.</li>
                    <li>
                      Buka dasbor project Anda di{' '}
                      <a
                        href={`https://supabase.com/dashboard/project/${projectId}/sql/new`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-indigo-600 underline"
                      >
                        SQL Editor Supabase
                      </a>.
                    </li>
                    <li>Tempel (Paste) skrip ke dalam editor, lalu klik tombol hijau <strong>"RUN"</strong>.</li>
                    <li>Selesai! Database siap digunakan untuk sinkronisasi data online.</li>
                  </ol>
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-3">
                <button
                  type="button"
                  id="btn-done-sql-modal"
                  onClick={() => setShowSqlModal(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
