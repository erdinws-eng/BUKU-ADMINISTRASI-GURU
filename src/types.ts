export type UserRole = 'admin' | 'guru';

export type AdminType = 'Super Admin' | 'Admin Tata Usaha' | 'Admin Kurikulum' | 'Kepala Sekolah' | 'Operator Dapodik';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email: string;
  teacherId?: string; // If role is guru
  adminType?: AdminType;
  password?: string;
  phone?: string;
  statusAktif?: boolean;
  createdAt?: string;
  lastLogin?: string;
  avatar?: string;
}

export interface SchoolSettings {
  schoolName: string;
  appName?: string; // e.g. "Buku Administrasi Guru"
  appSubtitle?: string; // e.g. "Sistem Informasi Akademik"
  npsn: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  headmasterName: string;
  headmasterNip: string;
  academicYear: string; // e.g. "2025/2026"
  activeSemester: 'Ganjil' | 'Genap';
  curriculum: 'Kurikulum Merdeka' | 'Kurikulum 2013';
  kkmDefault: number; // e.g. 75
  gradingWeight: {
    formatif: number; // e.g. 40%
    sts: number; // e.g. 30%
    sas: number; // e.g. 30%
  };
  logoUrl?: string; // Custom uploaded school logo (data URL or image URL)
  portalFeatures?: string[]; // Bullet features displayed on login screen
}

export interface MataPelajaran {
  id: string;
  kode: string; // e.g. "MAT", "IPA", "BIND"
  nama: string; // e.g. "Matematika", "Ilmu Pengetahuan Alam"
  kategori: 'Umum' | 'Muatan Lokal' | 'Pilihan' | 'Kejuruan';
  tingkatKelas: string[]; // e.g. ['7', '8', '9']
  kkm?: number; // e.g. 75
  keterangan?: string;
}

export interface Guru {
  id: string;
  nip: string;
  nama: string;
  gelar: string;
  email: string;
  phone: string;
  mapel: string;
  mapelList?: string[]; // Multiple subjects supported
  kelasDiampu: string[]; // e.g. ['7A', '7B', '8A']
  statusKepegawaian: 'PNS' | 'PPPK' | 'GTT' | 'Honor Sekolah';
  statusAktif: boolean;
  alamat?: string;
}

export interface Siswa {
  id: string;
  nis?: string;
  nisn: string;
  nama: string;
  gender: 'L' | 'P';
  kelas: string; // e.g. '7A'
  tempatLahir?: string;
  tanggalLahir?: string;
  namaWali?: string;
  kontakWali?: string;
  alamat?: string;
  status?: 'Aktif' | 'Mutasi' | 'Lulus';
}

export interface JadwalMengajar {
  id: string;
  guruId: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jamKe: string; // e.g. "1 - 2"
  waktu: string; // e.g. "07.30 - 09.00"
  kelas: string;
  mapel: string;
  ruang: string;
}

export interface QuickTargetSchedule {
  jadwalId: string;
  kelas: string;
  jamKe: string;
  mapel: string;
  ruang?: string;
  waktu?: string;
  hari?: string;
  guruId?: string;
}

export interface JurnalMengajar {
  id: string;
  guruId: string;
  tanggal: string; // YYYY-MM-DD
  jamKe: string;
  kelas: string;
  mapel: string;
  babOrTujuan: string;
  kegiatanPembelajaran: string;
  hambatanCatatan: string;
  jumlahHadir: number;
  totalSiswa: number;
  status: 'Selesai' | 'Tertunda' | 'Daring/Penugasan';
}

export type StatusKehadiran = 'Hadir' | 'Sakit' | 'Izin' | 'Alpa';

export interface AbsensiDetail {
  siswaId: string;
  status: StatusKehadiran;
  keterangan?: string;
}

export interface SesiAbsensi {
  id: string;
  guruId: string;
  tanggal: string; // YYYY-MM-DD
  kelas: string;
  mapel: string;
  jamKe: string;
  pertemuanKe: number;
  catatan?: string;
  records: AbsensiDetail[];
}

export interface NilaiSiswaItem {
  id: string;
  guruId?: string;
  siswaId: string;
  kelas: string;
  mapel: string;
  semester: 'Ganjil' | 'Genap';
  tahunAjaran: string;
  formatif1: number;
  formatif2: number;
  formatif3: number;
  sts: number; // Sumatif Tengah Semester
  sas: number; // Sumatif Akhir Semester
  deskripsiCapaian?: string;
  customScores?: Record<string, number>;
}

export interface ProtaItem {
  id: string;
  guruId: string;
  mapel: string;
  kelas: string;
  semester: 'Ganjil' | 'Genap';
  bab: string;
  capaianPembelajaran: string;
  alokasiWaktuJP: number;
  keterangan?: string;
}

export interface PromesItem {
  id: string;
  guruId: string;
  mapel: string;
  kelas: string;
  semester: 'Ganjil' | 'Genap';
  tujuanPembelajaran: string;
  materiPokok: string;
  alokasiWaktuJP: number;
  // months for semester: Ganjil = Jul, Ags, Sep, Okt, Nov, Des; Genap = Jan, Feb, Mar, Apr, Mei, Jun
  distribusiBulan: {
    [bulan: string]: number[]; // array of active weeks (e.g. [1, 2])
  };
}

export interface ModulAjar {
  id: string;
  guruId: string;
  mapel: string;
  faseKelas: string; // e.g. "Fase D (Kelas 7)"
  alokasiWaktu: string; // e.g. "2 x 40 menit"
  judulModul: string;
  elemen: string;
  profilPelajarPancasila: string[];
  saranaPrasarana: string;
  targetPesertaDidik: string;
  modelPembelajaran: string;
  tujuanPembelajaran: string[];
  kegiatanPembelajaran: {
    pendahuluan: string;
    inti: string;
    penutup: string;
  };
  asesmen: {
    diagnostik: string;
    formatif: string;
    sumatif: string;
  };
  fileLampiran?: string;
}

export interface LKPDItem {
  id: string;
  guruId: string;
  mapel: string;
  kelas: string;
  judulLKPD: string;
  topik: string;
  petunjukBelajar: string;
  langkahKegiatan: string;
  soalKasus: string;
  rubrikPenilaian: string;
}
