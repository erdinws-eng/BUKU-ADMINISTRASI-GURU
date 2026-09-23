import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to initialize GoogleGenAI safely
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Clean JSON response from model if wrapped in markdown codeblocks
function extractJsonFromText(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return JSON.parse(cleaned);
}

// Helpers for high-quality structured curriculum fallbacks
function buildFallbackProta(mapel: string, kelas: string, targetJP: number) {
  const subject = mapel || 'Mata Pelajaran';
  return [
    {
      semester: 'Ganjil',
      bab: `Bab 1: Pengenalan Konsep Dasar & Fondasi ${subject}`,
      capaianPembelajaran: `Peserta didik mampu memahami konsep fundamental materi ${subject}, mengidentifikasi pola keteraturan, serta mengaplikasikannya dalam konteks kehidupan nyata secara kritis dan mandiri.`,
      alokasiWaktuJP: 18,
      keterangan: 'Asesmen Formatif (Aktivitas Kelompok) & Sumatif Bab 1'
    },
    {
      semester: 'Ganjil',
      bab: `Bab 2: Operasi & Penerapan Analitis Kontekstual`,
      capaianPembelajaran: `Peserta didik mampu melakukan kalkulasi dan analisis operasional, memecahkan masalah kontekstual, dan mengomunikasikan hasil penyelidikan secara sistematis.`,
      alokasiWaktuJP: 20,
      keterangan: 'Asesmen Formatif (Tugas Terstruktur) & STS Ganjil'
    },
    {
      semester: 'Ganjil',
      bab: `Bab 3: Eksplorasi & Pemecahan Masalah Non-Rutin`,
      capaianPembelajaran: `Peserta didik mampu merumuskan representasi matematis/ilmiah, memecahkan masalah non-rutin, dan merefleksikan solusi yang didapatkan secara bergotong royong.`,
      alokasiWaktuJP: 18,
      keterangan: 'Asesmen Formatif, Proyek Mini & SAS Ganjil'
    },
    {
      semester: 'Genap',
      bab: `Bab 4: Hubungan Relasional & Struktur Lanjutan`,
      capaianPembelajaran: `Peserta didik dapat mengorelasikan keterkaitan antarkonsep ${subject}, menganalisis data empiris, dan menarik simpulan berbasis fakta.`,
      alokasiWaktuJP: 20,
      keterangan: 'Asesmen Formatif & Portofolio Karya'
    },
    {
      semester: 'Genap',
      bab: `Bab 5: Pengukuran, Analisis Visual & Geometri Terapan`,
      capaianPembelajaran: `Peserta didik mampu mengolah, memvisualisasikan, dan menginterpretasikan hubungan spasial atau data kuantitatif secara akurat.`,
      alokasiWaktuJP: 18,
      keterangan: 'Asesmen Formatif & STS Genap'
    },
    {
      semester: 'Genap',
      bab: `Bab 6: Sintesis Akhir & Kolaborasi Proyek Berdampak`,
      capaianPembelajaran: `Peserta didik mampu menyusun laporan sintesis komprehensif, mempresentasikan gagasan solutif, serta menunjukkan internalisasi profil pelajar pancasila.`,
      alokasiWaktuJP: 16,
      keterangan: 'Asesmen Sumatif Akhir Jenjang / SAS Genap'
    }
  ];
}

function buildFallbackPromes(mapel: string, kelas: string, sem: string, months: string[]) {
  const subject = mapel || 'Mata Pelajaran';
  return [
    {
      tujuanPembelajaran: `TP 1: Memahami prinsip awal dan konsep dasar ${subject} secara kritis.`,
      materiPokok: `Konsep Inti & Fondasi ${subject}`,
      alokasiWaktuJP: 10,
      distribusiBulan: { [months[0]]: [3, 4], [months[1]]: [1] }
    },
    {
      tujuanPembelajaran: `TP 2: Menganalisis operasi dan penyelesaian masalah kontekstual berbantuan media konkret.`,
      materiPokok: `Aplikasi & Pemecahan Masalah Kontekstual`,
      alokasiWaktuJP: 12,
      distribusiBulan: { [months[1]]: [2, 3, 4] }
    },
    {
      tujuanPembelajaran: `TP 3: Mengembangkan model representasi dan argumentasi ilmiah berbasis bukti.`,
      materiPokok: `Analisis Data & Hubungan Relasional`,
      alokasiWaktuJP: 10,
      distribusiBulan: { [months[2]]: [1, 2, 3] }
    },
    {
      tujuanPembelajaran: `TP 4: Mengintegrasikan materi dalam proyek kelompok dan asesmen sumatif tengah semester.`,
      materiPokok: `Penguatan Asesmen STS & Refleksi Berkala`,
      alokasiWaktuJP: 8,
      distribusiBulan: { [months[2]]: [4], [months[3]]: [1] }
    },
    {
      tujuanPembelajaran: `TP 5: Melakukan penyelidikan mendalam pada lingkup materi lanjutan semester ${sem}.`,
      materiPokok: `Struktur Lanjutan & Pemodelan Nyata`,
      alokasiWaktuJP: 12,
      distribusiBulan: { [months[3]]: [2, 3, 4], [months[4]]: [1] }
    },
    {
      tujuanPembelajaran: `TP 6: Menyusun portofolio hasil karya dan persiapan asesmen sumatif akhir semester.`,
      materiPokok: `Refleksi Akhir Semester, Remedial & SAS`,
      alokasiWaktuJP: 8,
      distribusiBulan: { [months[4]]: [2, 3], [months[5]]: [1] }
    }
  ];
}

function buildFallbackModul(mapel: string, faseKelas: string, judulModul: string, modelPembelajaran: string, alokasiWaktu: string) {
  const topic = judulModul || `Konsep Esensial ${mapel || 'Pembelajaran'}`;
  return {
    judulModul: topic,
    elemen: mapel === 'Matematika' ? 'Bilangan & Aljabar' : 'Pemahaman Konseptual',
    profilPelajarPancasila: ['Bernalar Kritis', 'Gotong Royong', 'Mandiri'],
    saranaPrasarana: 'Buku Siswa Kemdikbudristek, LCD Proyektor, Papan Tulis, LKPD Interaktif, Gawai/Laptop',
    targetPesertaDidik: 'Peserta didik reguler / tipikal (kemampuan heterogen)',
    modelPembelajaran: modelPembelajaran || 'Problem Based Learning (PBL)',
    tujuanPembelajaran: [
      `1. Melalui orientasi masalah, peserta didik mampu mengidentifikasi karakteristik utama materi ${topic} dengan benar.`,
      `2. Melalui diskusi kelompok terarah, peserta didik mampu menyelesaikan permasalahan kontekstual terkait materi secara teliti.`,
      `3. Melalui presentasi karya, peserta didik mampu mengomunikasikan hasil analisis dan solusi kelompok secara percaya diri.`
    ],
    kegiatanPembelajaran: {
      pendahuluan: '1. Guru menyapa peserta didik, memeriksa kehadiran, dan memimpin doa bersama.\n2. Apersepsi: Guru mengaitkan materi sebelumnya dengan topik nyata di sekitar kehidupan peserta didik.\n3. Guru menyampaikan tujuan pembelajaran, skenario aktivitas kelompok, dan rubrik penilaian yang akan digunakan.',
      inti: 'Fase 1 (Orientasi Masalah): Guru menayangkan infografis/video studi kasus kontekstual yang relevan.\nFase 2 (Mengorganisasikan Peserta Didik): Peserta didik dibagi ke dalam kelompok heterogen 4-5 orang dan menerima LKPD.\nFase 3 (Membimbing Penyelidikan): Guru mendampingi penyelidikan, memfasilitasi scaffolding bagi kelompok yang membutuhkan, dan mendorong penalaran kritis.\nFase 4 (Mengembangkan Karya): Setiap kelompok merumuskan solusi dan menuliskan hasil pada lembar kerja / plano.\nFase 5 (Analisis & Evaluasi): Perwakilan kelompok mempresentasikan hasil, ditanggapi oleh kelompok lain, dan guru mengonfirmasi penguatan konsep.',
      penutup: '1. Peserta didik bersama guru menyimpulkan poin-poin utama materi yang telah dipelajari.\n2. Guru memberikan kuis formatif singkat (3 soal cepat) untuk menguji ketercapaian tujuan.\n3. Refleksi pembelajaran: Peserta didik menyampaikan apa yang paling dipahami dan kendala yang dihadapi.\n4. Guru menyampaikan materi untuk pertemuan berikutnya dan menutup dengan doa.'
    },
    asesmen: {
      diagnostik: 'Tes lisan tanya-jawab di awal pertemuan untuk mengecek kesiapan belajar dan materi prasyarat.',
      formatif: 'Observasi keaktifan diskusi kelompok, penilaian unjuk kerja pengisian LKPD, dan kuis refleksi.',
      sumatif: 'Tes tertulis lingkup materi di akhir bab berupa soal pilihan ganda kompleks dan uraian penalaran.'
    }
  };
}

function buildFallbackLKPD(mapel: string, kelas: string, topik: string, activityType: string) {
  const topic = topik || 'Penerapan Konsep dalam Kehidupan Sehari-hari';
  return {
    judulLKPD: `LKPD: Eksplorasi Kontekstual ${topic}`,
    topik: topic,
    petunjukBelajar: '1. Berdoalah bersama kelompok sebelum memulai aktivitas.\n2. Baca dan pahami setiap instruksi kerja dengan cermat.\n3. Bagi tugas secara adil dan diskusikan setiap jawaban bersama kelompokmu.\n4. Tanyakan kepada guru jika terdapat langkah yang belum dipahami.\n5. Tuliskan hasil penyelidikan secara rapi pada ruang yang disediakan.',
    langkahKegiatan: 'Aktivitas 1: Orientasi Masalah\n- Amati narasi permasalahan kontekstual di bawah ini.\n- Tentukan variabel dan data kunci yang diketahui dan ditanyakan.\n\nAktivitas 2: Eksplorasi & Pemodelan\n- Gunakan alat/media bantu untuk memodelkan permasalahan.\n- Diskusikan strategi pemecahan yang paling tepat.\n\nAktivitas 3: Simpulan & Presentasi\n- Tarik simpulan umum dari pemecahan masalah yang dilakukan.\n- Siapkan 1 perwakilan kelompok untuk memaparkan solusi.',
    soalKasus: `Studi Kasus Kontekstual:\nSebuah tim siswa merencanakan kegiatan festival sekolah terkait ${topic}. Mereka menghadapi tantangan menentukan estimasi alokasi kebutuhan dan distribusi secara efisien.\n\nPertanyaan Penyelidikan:\n1. Analisis dan rumuskan informasi penting yang diketahui dari kasus tersebut!\n2. Uraikan langkah-langkah komputasi atau prosedur analitis kelompok Anda untuk menemukan solusi!\n3. Apa simpulan dan rekomendasi terbaik yang dapat kelompok Anda berikan?`,
    rubrikPenilaian: '1. Aspek Keterampilan Penyelidikan (Skor Maks 40): Kesesuaian prosedur kerja dan ketepatan solusi data.\n2. Aspek Gotong Royong / Kerjasama (Skor Maks 30): Partisipasi aktif setiap anggota kelompok dan saling menghargai pendapat.\n3. Aspek Komunikasi & Penalaran (Skor Maks 30): Kejelasan penyampaian argumen saat presentasi dan keteraturan penulisan laporan.'
  };
}

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString()
  });
});

// 2. AI Generator: Program Tahunan (Prota)
app.post('/api/ai/generate-prota', async (req: Request, res: Response) => {
  const { mapel, kelas, targetJP, notes } = req.body;
  try {
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        success: true,
        source: 'template',
        items: buildFallbackProta(mapel, kelas, targetJP)
      });
    }

    const prompt = `Anda adalah konsultan ahli Kurikulum Merdeka Indonesia jenjang SMP/MTs.
Buatkan rincian Program Tahunan (Prota) resmi yang komprehensif untuk:
- Mata Pelajaran: ${mapel || 'Matematika'}
- Kelas: ${kelas || '7'} (Fase D)
- Total Estimasi Alokasi JP Tahunan: ${targetJP || 110} JP
- Fokus / Permintaan Khusus: ${notes || 'Mencakup seluruh capaian kurikulum merdeka'}

Format output HARUS murni JSON berupa Array Objek tanpa teks pengantar:
[
  {
    "semester": "Ganjil" | "Genap",
    "bab": "Bab X: Judul Bab / Lingkup Materi",
    "capaianPembelajaran": "Deskripsi Capaian Pembelajaran operasional yang mendalam",
    "alokasiWaktuJP": 18,
    "keterangan": "Keterangan asesmen dan proyek"
  }
]
Buat sekitar 3-4 bab untuk Semester Ganjil dan 3-4 bab untuk Semester Genap. Total JP harus mendekati ${targetJP || 110} JP.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = extractJsonFromText(response.text || '[]');
    res.json({ success: true, source: 'gemini', items: parsed });
  } catch (error: any) {
    console.warn('Fallback triggered for generate-prota due to API issue:', error?.message);
    res.json({
      success: true,
      source: 'fallback',
      items: buildFallbackProta(mapel, kelas, targetJP)
    });
  }
});

// 3. AI Generator: Program Semester (Promes)
app.post('/api/ai/generate-promes', async (req: Request, res: Response) => {
  const { mapel, kelas, semester, topics } = req.body;
  const sem = semester === 'Genap' ? 'Genap' : 'Ganjil';
  const months =
    sem === 'Ganjil'
      ? ['Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      : ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'];

  try {
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        success: true,
        source: 'template',
        items: buildFallbackPromes(mapel, kelas, sem, months)
      });
    }

    const prompt = `Anda adalah ahli penyusunan Program Semester (Promes) Kurikulum Merdeka Indonesia.
Buatkan rancangan distribusi Program Semester untuk:
- Mata Pelajaran: ${mapel || 'Matematika'}
- Kelas: ${kelas || '7'}
- Semester: ${sem}
- Bulan yang aktif: ${months.join(', ')}
- Fokus / Topik: ${topics || 'Standar capaian semester ' + sem}

Format output HARUS murni JSON berupa Array Objek tanpa teks pengantar:
[
  {
    "tujuanPembelajaran": "TP X.X Deskripsi Tujuan Pembelajaran yang terukur",
    "materiPokok": "Nama Materi Pokok Pembelajaran",
    "alokasiWaktuJP": 8,
    "distribusiBulan": {
      "${months[0]}": [3, 4],
      "${months[1]}": [1, 2]
    }
  }
]
Ketentuan penting:
- Nama key dalam distribusiBulan HARUS HANYA menggunakan salah satu dari bulan berikut: ${months.join(', ')}.
- Angka dalam array minggu adalah angka integer 1 sampai 5 (minggu ke-1 sampai ke-5 dalam bulan tersebut).
- Hasilkan antara 4 sampai 6 rincian Tujuan Pembelajaran dengan alokasi waktu yang logis.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = extractJsonFromText(response.text || '[]');
    res.json({ success: true, source: 'gemini', items: parsed });
  } catch (error: any) {
    console.warn('Fallback triggered for generate-promes due to API issue:', error?.message);
    res.json({
      success: true,
      source: 'fallback',
      items: buildFallbackPromes(mapel, kelas, sem, months)
    });
  }
});

// 4. AI Generator: Modul Ajar (RPP Merdeka)
app.post('/api/ai/generate-modul', async (req: Request, res: Response) => {
  const { mapel, faseKelas, judulModul, modelPembelajaran, alokasiWaktu, notes } = req.body;
  try {
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        success: true,
        source: 'template',
        data: buildFallbackModul(mapel, faseKelas, judulModul, modelPembelajaran, alokasiWaktu)
      });
    }

    const prompt = `Anda adalah konsultan pendidikan dan pakar Kurikulum Merdeka Indonesia.
Buatkan dokumen Modul Ajar (RPP Merdeka) resmi, mendalam, inspiratif, dan siap terapkan untuk:
- Mata Pelajaran: ${mapel || 'Matematika'}
- Fase / Kelas: ${faseKelas || 'Fase D (Kelas 7)'}
- Judul / Topik Modul: ${judulModul || 'Topik Pembelajaran'}
- Model Pembelajaran: ${modelPembelajaran || 'Problem Based Learning (PBL)'}
- Alokasi Waktu: ${alokasiWaktu || '2 x 40 menit (1 Pertemuan)'}
- Catatan Khusus: ${notes || 'Kembangkan langkah pembelajaran kontekstual berbasis student-centered learning'}

Format output HARUS murni JSON tunggal dengan struktur:
{
  "judulModul": "${judulModul || 'Modul Ajar'}",
  "elemen": "Nama Elemen Kurikulum Merdeka (contoh: Bilangan, Geometri, Pemahaman IPA, Menyimak)",
  "profilPelajarPancasila": ["Bernalar Kritis", "Gotong Royong", "Kreatif"],
  "saranaPrasarana": "Daftar sarana, media, alat, dan bahan konkret",
  "targetPesertaDidik": "Peserta didik reguler / tipikal",
  "modelPembelajaran": "${modelPembelajaran || 'Problem Based Learning (PBL)'}",
  "tujuanPembelajaran": [
    "1. Peserta didik dapat ...",
    "2. Peserta didik dapat ..."
  ],
  "kegiatanPembelajaran": {
    "pendahuluan": "Rincian langkah pendahuluan lengkap (salam, doa, apersepsi, motivasi, tujuan)",
    "inti": "Rincian langkah inti yang runtut sesuai sintaks model pembelajaran terpilih (lengkap dengan interaksi guru-siswa)",
    "penutup": "Rincian penutup (refleksi, rangkuman, asesmen umpan balik, tindak lanjut, doa)"
  },
  "asesmen": {
    "diagnostik": "Bentuk asesmen diagnostik kognitif & non-kognitif awal",
    "formatif": "Bentuk asesmen proses (lembar observasi sikap, lembar ceklist diskusi kelompok)",
    "sumatif": "Bentuk asesmen akhir ketercapaian tujuan pembelajaran"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = extractJsonFromText(response.text || '{}');
    res.json({ success: true, source: 'gemini', data: parsed });
  } catch (error: any) {
    console.warn('Fallback triggered for generate-modul due to API issue:', error?.message);
    res.json({
      success: true,
      source: 'fallback',
      data: buildFallbackModul(mapel, faseKelas, judulModul, modelPembelajaran, alokasiWaktu)
    });
  }
});

// 5. AI Generator: Lembar Kerja Peserta Didik (LKPD)
app.post('/api/ai/generate-lkpd', async (req: Request, res: Response) => {
  const { mapel, kelas, topik, activityType, notes } = req.body;
  try {
    const ai = getGenAI();

    if (!ai) {
      return res.json({
        success: true,
        source: 'template',
        data: buildFallbackLKPD(mapel, kelas, topik, activityType)
      });
    }

    const prompt = `Anda adalah ahli penyusunan Lembar Kerja Peserta Didik (LKPD) Kurikulum Merdeka Indonesia.
Buatkan naskah LKPD interaktif, menantang bernalar kritis, dan kontekstual untuk:
- Mata Pelajaran: ${mapel || 'Matematika'}
- Kelas: ${kelas || '7'}
- Topik / Masalah: ${topik || 'Penerapan Konsep Nyata'}
- Tipe Aktivitas: ${activityType || 'Aktivitas Diskusi Kelompok dan Pemecahan Masalah'}
- Catatan Tambahan: ${notes || 'Gunakan studi kasus nyata yang dekat dengan kehidupan remaja'}

Format output HARUS murni JSON tunggal dengan struktur:
{
  "judulLKPD": "LKPD: ...",
  "topik": "${topik || 'Topik LKPD'}",
  "petunjukBelajar": "Poin-poin petunjuk belajar siswa yang jelas dan santun",
  "langkahKegiatan": "Langkah-langkah kegiatan eksplorasi siswa yang runtut dan interaktif",
  "soalKasus": "Studi kasus nyata / narasi masalah kontekstual beserta pertanyaan pemantik dan tantangan analitis",
  "rubrikPenilaian": "Rubrik penilaian detail (kriteria aspek pemahaman konsep, kerjasama, dan penyajian)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = extractJsonFromText(response.text || '{}');
    res.json({ success: true, source: 'gemini', data: parsed });
  } catch (error: any) {
    console.warn('Fallback triggered for generate-lkpd due to API issue:', error?.message);
    res.json({
      success: true,
      source: 'fallback',
      data: buildFallbackLKPD(mapel, kelas, topik, activityType)
    });
  }
});

// Endpoint status Supabase
app.get('/api/supabase/status', (req: Request, res: Response) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gqivavwopowlwflzhoxe.supabase.co';
  const hasAnonKey = Boolean(process.env.VITE_SUPABASE_ANON_KEY);
  res.json({
    status: 'configured',
    supabaseUrl,
    hasAnonKey
  });
});

// Vite middleware for development & static file serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
