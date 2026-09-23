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

export const initialSchoolSettings: SchoolSettings = {
  schoolName: 'SMP / SMA Negeri',
  appName: 'Buku Administrasi Guru',
  appSubtitle: 'Sistem Informasi Akademik',
  npsn: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  headmasterName: '',
  headmasterNip: '',
  academicYear: '2025/2026',
  activeSemester: 'Ganjil',
  curriculum: 'Kurikulum Merdeka',
  kkmDefault: 75,
  gradingWeight: {
    formatif: 40,
    sts: 30,
    sas: 30
  },
  logoUrl: '',
  portalFeatures: [
    'Perangkat Kurikulum Merdeka & K13',
    'Absensi harian, nilai formatif & sumatif',
    'Jurnal mengajar, Prota, Promes & LKPD',
    'Format cetak resmi berstandar Dinas'
  ]
};

export const initialUsers: UserAccount[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    name: 'Administrator',
    role: 'admin',
    adminType: 'Super Admin',
    email: 'admin@sekolah.sch.id',
    phone: '',
    password: 'admin123',
    statusAktif: true,
    createdAt: '2025-07-01',
    lastLogin: '-'
  },
  {
    id: 'usr-guru-1',
    username: 'guru',
    name: 'Guru Pengampu',
    role: 'guru',
    email: 'guru@sekolah.sch.id',
    teacherId: 'guru-1',
    phone: '',
    password: 'guru123',
    statusAktif: true,
    createdAt: '2025-07-01',
    lastLogin: '-'
  }
];

export const initialGurus: Guru[] = [
  {
    id: 'guru-1',
    nip: '',
    nama: 'Guru Pengampu',
    gelar: 'S.Pd',
    email: 'guru@sekolah.sch.id',
    phone: '',
    mapel: 'Mata Pelajaran',
    kelasDiampu: ['7A'],
    statusKepegawaian: 'PNS',
    statusAktif: true,
    alamat: ''
  }
];

// Master Mata Pelajaran Standar Kurikulum Nasional
export const defaultCurriculumMapels: MataPelajaran[] = [
  { id: 'mp-1', kode: 'PAIBP', nama: 'Pendidikan Agama dan Budi Pekerti', kategori: 'Umum', tingkatKelas: ['7', '8', '9'], kkm: 75, keterangan: 'Kelompok Mata Pelajaran Wajib' },
  { id: 'mp-2', kode: 'PPKN', nama: 'Pendidikan Pancasila', kategori: 'Umum', tingkatKelas: ['7', '8', '9'], kkm: 75, keterangan: 'Kelompok Mata Pelajaran Wajib' },
  { id: 'mp-3', kode: 'BIND', nama: 'Bahasa Indonesia', kategori: 'Umum', tingkatKelas: ['7', '8', '9'], kkm: 75, keterangan: 'Kelompok Mata Pelajaran Wajib' },
  { id: 'mp-4', kode: 'MAT', nama: 'Matematika', kategori: 'Umum', tingkatKelas: ['7', '8', '9'], kkm: 75, keterangan: 'Kelompok Mata Pelajaran Wajib' },
  { id: 'mp-5', kode: 'IPA', nama: 'Ilmu Pengetahuan Alam (IPA)', kategori: 'Umum', tingkatKelas: ['7', '8', '9'], kkm: 75, keterangan: 'Kelompok Mata Pelajaran Wajib' },
  { id: 'mp-6', kode: 'IPS', nama: 'Ilmu Pengetahuan Sosial (IPS)', kategori: 'Umum', tingkatKelas: ['7', '8', '9'], kkm: 75, keterangan: 'Kelompok Mata Pelajaran Wajib' },
  { id: 'mp-7', kode: 'BING', nama: 'Bahasa Inggris', kategori: 'Umum', tingkatKelas: ['7', '8', '9'], kkm: 75, keterangan: 'Kelompok Mata Pelajaran Wajib' },
  { id: 'mp-8', kode: 'PJOK', nama: 'Pendidikan Jasmani, Olahraga, dan Kesehatan', kategori: 'Umum', tingkatKelas: ['7', '8', '9'], kkm: 75, keterangan: 'Kelompok Mata Pelajaran Wajib' },
  { id: 'mp-9', kode: 'INFO', nama: 'Informatika', kategori: 'Umum', tingkatKelas: ['7', '8', '9'], kkm: 75, keterangan: 'Kelompok Mata Pelajaran Wajib' },
  { id: 'mp-10', kode: 'SENI', nama: 'Seni dan Prakarya', kategori: 'Pilihan', tingkatKelas: ['7', '8', '9'], kkm: 75, keterangan: 'Seni Rupa, Musik, Tari, atau Teater' },
  { id: 'mp-11', kode: 'MLOK', nama: 'Bahasa Daerah (Muatan Lokal)', kategori: 'Muatan Lokal', tingkatKelas: ['7', '8', '9'], kkm: 75, keterangan: 'Muatan Lokal Daerah' },
  { id: 'mp-12', kode: 'BK', nama: 'Bimbingan dan Konseling', kategori: 'Umum', tingkatKelas: ['7', '8', '9'], kkm: 75, keterangan: 'Layanan Bimbingan Konseling' }
];

export const initialMapels: MataPelajaran[] = defaultCurriculumMapels;

// Operational data is completely empty so the user can input and test everything themselves
export const initialSiswas: Siswa[] = [];
export const initialJadwals: JadwalMengajar[] = [];
export const initialJurnals: JurnalMengajar[] = [];
export const initialAbsensis: SesiAbsensi[] = [];
export const initialNilais: NilaiSiswaItem[] = [];
export const initialProtas: ProtaItem[] = [];
export const initialPromes: PromesItem[] = [];
export const initialModulAjars: ModulAjar[] = [];
export const initialLKPDs: LKPDItem[] = [];
