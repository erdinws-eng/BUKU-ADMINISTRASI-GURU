import { supabase, SUPABASE_URL } from './supabase';
import {
  SchoolSettings,
  Guru,
  Siswa,
  MataPelajaran,
  JadwalMengajar,
  JurnalMengajar,
  SesiAbsensi,
  NilaiSiswaItem,
  ProtaItem,
  PromesItem,
  ModulAjar,
  LKPDItem,
  UserAccount
} from '../types';

export interface SupabaseSyncPayload {
  schoolSettings: SchoolSettings;
  users: UserAccount[];
  gurus: Guru[];
  siswas: Siswa[];
  mapels: MataPelajaran[];
  jadwals: JadwalMengajar[];
  jurnals: JurnalMengajar[];
  absensis: SesiAbsensi[];
  nilais: NilaiSiswaItem[];
  protas: ProtaItem[];
  promesList: PromesItem[];
  modulAjars: ModulAjar[];
  lkpds: LKPDItem[];
  timestamp?: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  tableExists?: boolean;
  errorCode?: string;
}

// SQL Script ready to copy-paste into Supabase SQL Editor
export const SUPABASE_SETUP_SQL = `-- SCRIPT SETUP DATABASE BUKU ADMINISTRASI GURU (SUPABASE)
-- Salin dan jalankan seluruh kode ini di menu "SQL Editor" pada dasbor Supabase Anda.

-- 1. TABEL PENYIMPANAN SINKRONISASI UTAMA (JSONB Cloud Store)
CREATE TABLE IF NOT EXISTS app_sync_store (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nonaktifkan atau atur kebijakan RLS agar klien aplikasi dapat membaca dan menulis data
ALTER TABLE app_sync_store ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses: Memungkinkan operasi baca dan tulis menggunakan anon key
DROP POLICY IF EXISTS "Akses Baca Publik app_sync_store" ON app_sync_store;
CREATE POLICY "Akses Baca Publik app_sync_store" ON app_sync_store
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Akses Tulis Publik app_sync_store" ON app_sync_store;
CREATE POLICY "Akses Tulis Publik app_sync_store" ON app_sync_store
  FOR ALL USING (true) WITH CHECK (true);

-- 2. TABEL LOG AKTIVITAS SINKRONISASI
CREATE TABLE IF NOT EXISTS app_sync_logs (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_name TEXT,
  total_records INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses Log Publik" ON app_sync_logs;
CREATE POLICY "Akses Log Publik" ON app_sync_logs
  FOR ALL USING (true) WITH CHECK (true);

-- 3. INSERT DATA AWAL PENANDA KONEKSI
INSERT INTO app_sync_store (id, category, payload, updated_at)
VALUES (
  'connection_probe',
  'system',
  '{"status": "ready", "appName": "Buku Administrasi Guru", "version": "1.0.0"}'::jsonb,
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET payload = EXCLUDED.payload, updated_at = NOW();
`;

/**
 * Tes konektivitas langsung ke endpoint Supabase
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const startTime = performance.now();
  try {
    // 1. Coba query ke app_sync_store
    const { data, error } = await supabase
      .from('app_sync_store')
      .select('id')
      .limit(1);

    const latencyMs = Math.round(performance.now() - startTime);

    if (error) {
      // Jika tabel belum ada (PostgreSQL error 42P01)
      if (error.code === '42P01' || error.message.includes('relation "app_sync_store" does not exist') || error.message.includes('app_sync_store')) {
        return {
          success: true,
          tableExists: false,
          latencyMs,
          message: 'Terhubung ke server Supabase, namun tabel "app_sync_store" belum dibuat di database. Harap jalankan script SQL yang disediakan.',
          errorCode: error.code
        };
      }
      return {
        success: false,
        tableExists: false,
        latencyMs,
        message: `Gagal mengakses database: ${error.message} (${error.code || 'UNKNOWN'})`,
        errorCode: error.code
      };
    }

    return {
      success: true,
      tableExists: true,
      latencyMs,
      message: `Berhasil terhubung ke Supabase! (Latensi: ${latencyMs}ms, Tabel: Siap)`
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      success: false,
      tableExists: false,
      latencyMs,
      message: `Koneksi gagal: ${err.message || 'Tidak dapat menghubungi endpoint Supabase'}`
    };
  }
}

/**
 * Upload & sinkronkan seluruh data aplikasi ke Supabase
 */
export async function pushAllToSupabase(payload: SupabaseSyncPayload): Promise<{ success: boolean; message: string }> {
  try {
    const timestamp = new Date().toISOString();
    
    // Simpan snapshot lengkap ke app_sync_store dengan id 'latest_snapshot'
    const fullSnapshot = {
      ...payload,
      timestamp
    };

    const { error } = await supabase
      .from('app_sync_store')
      .upsert(
        {
          id: 'latest_snapshot',
          category: 'full_backup',
          payload: fullSnapshot,
          updated_at: timestamp
        },
        { onConflict: 'id' }
      );

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        throw new Error('Tabel database Supabase belum diinisialisasi. Silakan jalankan Script SQL di SQL Editor Supabase terlebih dahulu.');
      }
      throw new Error(error.message);
    }

    // Juga catat log sinkronisasi
    await supabase.from('app_sync_logs').insert({
      event_type: 'PUSH_SNAPSHOT',
      user_name: payload.schoolSettings.headmasterName || 'Admin',
      total_records:
        payload.gurus.length +
        payload.siswas.length +
        payload.jurnals.length +
        payload.absensis.length +
        payload.nilais.length
    }).select().maybeSingle();

    return {
      success: true,
      message: `Semua data (${payload.gurus.length} guru, ${payload.siswas.length} siswa, ${payload.jurnals.length} jurnal) berhasil disinkronkan ke Supabase Cloud!`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Terjadi kesalahan saat mengunggah data ke Supabase.'
    };
  }
}

/**
 * Tarik data terbaru dari Supabase untuk diimpor ke aplikasi
 */
export async function pullAllFromSupabase(): Promise<{
  success: boolean;
  data?: SupabaseSyncPayload;
  message: string;
}> {
  try {
    const { data, error } = await supabase
      .from('app_sync_store')
      .select('payload, updated_at')
      .eq('id', 'latest_snapshot')
      .maybeSingle();

    if (error) {
      if (error.code === '42P01') {
        throw new Error('Tabel app_sync_store belum dibuat di Supabase.');
      }
      throw new Error(error.message);
    }

    if (!data || !data.payload) {
      return {
        success: false,
        message: 'Belum ada data cadangan di Supabase. Silakan lakukan "Unggah / Sinkronkan Data" terlebih dahulu.'
      };
    }

    return {
      success: true,
      data: data.payload as SupabaseSyncPayload,
      message: `Data berhasil diunduh dari Supabase (Pembaruan terakhir: ${new Date(data.updated_at).toLocaleString('id-ID')})`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Gagal mengunduh data dari Supabase.'
    };
  }
}
