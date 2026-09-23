import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { JadwalMengajar as IJadwal } from '../../types';
import {
  Calendar,
  Clock,
  Plus,
  Printer,
  Download,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  BookOpenCheck,
  ClipboardCheck,
  Building2,
  CalendarDays,
  LayoutGrid,
  List,
  Sparkles,
  MapPin,
  X,
  User,
  GraduationCap,
  ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';
import { PrintHeader, PrintSignatures } from '../shared/PrintHeader';

export const JadwalMengajar: React.FC = () => {
  const {
    currentUser,
    currentTeacher,
    gurus,
    jadwals,
    addJadwal,
    updateJadwal,
    deleteJadwal,
    setActiveMenu,
    schoolSettings,
    showToast,
    showFeedbackModal
  } = useApp();

  const isAdmin = currentUser?.role === 'admin';

  // Days list
  const daysList: Array<IJadwal['hari']> = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Current day determination
  const dayNamesIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const realToday = dayNamesIndo[new Date().getDay()] || 'Senin';
  const todayHighlight = realToday === 'Minggu' ? 'Senin' : realToday;

  // View settings
  const [selectedDay, setSelectedDay] = useState<string>('Semua');
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [selectedGuruFilter, setSelectedGuruFilter] = useState<string>(
    isAdmin ? 'Semua' : (currentTeacher?.id || 'Semua')
  );
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<IJadwal | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Print Preview Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTeacherFilter, setPrintTeacherFilter] = useState<string>('Semua');
  const [printFormatMode, setPrintFormatMode] = useState<'table' | 'matrix'>('table');

  // Form State
  const [formData, setFormData] = useState({
    guruId: currentTeacher?.id || gurus[0]?.id || 'guru-1',
    hari: 'Senin' as IJadwal['hari'],
    jamKe: '1 - 2',
    waktu: '07.30 - 09.00',
    kelas: currentTeacher?.kelasDiampu[0] || '7A',
    mapel: currentTeacher?.mapel || 'Matematika',
    ruang: 'R. Kelas 7A'
  });

  // Filter schedules based on user role and filters
  const effectiveJadwals = jadwals.filter((j) => {
    // Guru mode default filter to own schedule unless explicitly filtering
    if (!isAdmin && selectedGuruFilter === (currentTeacher?.id || 'guru-1')) {
      if (j.guruId !== currentTeacher?.id) return false;
    } else if (selectedGuruFilter !== 'Semua') {
      if (j.guruId !== selectedGuruFilter) return false;
    }

    if (selectedDay !== 'Semua' && j.hari !== selectedDay) return false;
    if (selectedKelasFilter !== 'Semua' && j.kelas !== selectedKelasFilter) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const guru = gurus.find((g) => g.id === j.guruId);
      const matchMapel = j.mapel.toLowerCase().includes(q);
      const matchKelas = j.kelas.toLowerCase().includes(q);
      const matchRuang = j.ruang.toLowerCase().includes(q);
      const matchGuru = guru ? guru.nama.toLowerCase().includes(q) : false;
      return matchMapel || matchKelas || matchRuang || matchGuru;
    }

    return true;
  });

  // Available classes for filter
  const allClasses = Array.from(new Set(jadwals.map((j) => j.kelas))).sort();

  // Statistics for current selected teacher or all
  const targetTeacherId = !isAdmin ? currentTeacher?.id : (selectedGuruFilter !== 'Semua' ? selectedGuruFilter : null);
  const statsJadwals = targetTeacherId
    ? jadwals.filter((j) => j.guruId === targetTeacherId)
    : jadwals;

  const totalSesi = statsJadwals.length;
  // Standard JP calculation: each 1-2 is 2 JP, 3-4 is 2 JP, etc.
  const totalJP = totalSesi * 2;
  const taughtClasses = Array.from(new Set(statsJadwals.map((j) => j.kelas)));
  const activeDaysCount = Array.from(new Set(statsJadwals.map((j) => j.hari))).length;

  const todaySessions = statsJadwals.filter((j) => j.hari === todayHighlight);

  const handleOpenAdd = (defaultHari?: IJadwal['hari'], defaultJam?: string) => {
    setEditingJadwal(null);
    const targetGuru = gurus.find((g) => g.id === (targetTeacherId || currentTeacher?.id)) || gurus[0];
    const defaultKelas = targetGuru?.kelasDiampu?.[0] || '7A';
    setFormData({
      guruId: targetGuru?.id || 'guru-1',
      hari: defaultHari || (todayHighlight as IJadwal['hari']) || 'Senin',
      jamKe: defaultJam || '1 - 2',
      waktu: defaultJam === '3 - 4' ? '09.15 - 10.45' : '07.30 - 09.00',
      kelas: defaultKelas,
      mapel: targetGuru?.mapel || 'Mata Pelajaran',
      ruang: `R. Kelas ${defaultKelas}`
    });
    setShowModal(true);
  };

  const handleOpenEdit = (jadwal: IJadwal) => {
    setEditingJadwal(jadwal);
    setFormData({
      guruId: jadwal.guruId,
      hari: jadwal.hari,
      jamKe: jadwal.jamKe,
      waktu: jadwal.waktu,
      kelas: jadwal.kelas,
      mapel: jadwal.mapel,
      ruang: jadwal.ruang
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    const jadwalToDelete = jadwals.find((j) => j.id === id);
    showFeedbackModal({
      type: 'warning',
      title: 'Hapus Jadwal Mengajar?',
      message: `Sesi ${jadwalToDelete?.mapel || 'mengajar'} pada hari ${jadwalToDelete?.hari || ''} (${jadwalToDelete?.jamKe || ''}) akan dihapus.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      onConfirm: () => {
        deleteJadwal(id);
        showToast('info', 'Jadwal Dihapus', 'Jadwal sesi mengajar telah dihapus dari sistem.');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJadwal) {
      updateJadwal(editingJadwal.id, formData);
      showToast('success', 'Jadwal Diperbarui', `Jadwal ${formData.mapel} kelas ${formData.kelas} berhasil disimpan.`);
    } else {
      addJadwal(formData);
      showToast('success', 'Jadwal Ditambahkan', `Jadwal baru ${formData.mapel} berhasil ditambahkan.`);
    }
    setShowModal(false);
  };

  // Standard time slots for matrix
  const timeSlots = [
    { jamKe: '1 - 2', waktu: '07.30 - 09.00' },
    { jamKe: '3 - 4', waktu: '09.15 - 10.45' },
    { jamKe: 'Istirahat', waktu: '10.45 - 11.15', isBreak: true },
    { jamKe: '5 - 6', waktu: '11.15 - 12.45' },
    { jamKe: '7 - 8', waktu: '13.15 - 14.45' }
  ];

  const handleTriggerPrint = () => {
    const printableList = printTeacherFilter !== 'Semua'
      ? jadwals.filter((j) => j.guruId === printTeacherFilter)
      : jadwals;

    const teacher = printTeacherFilter !== 'Semua' ? gurus.find((g) => g.id === printTeacherFilter) : null;
    const teacherName = teacher
      ? `${teacher.nama}${teacher.gelar ? `, ${teacher.gelar}` : ''}`
      : `${currentTeacher?.nama || 'Guru Pengampu'}, ${currentTeacher?.gelar || ''}`;
    const teacherNip = teacher ? teacher.nip : (currentTeacher?.nip || '-');

    const todayDateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let contentHtml = '';
    if (printableList.length === 0) {
      contentHtml = `
        <div style="text-align: center; padding: 40px 20px; border: 2px dashed #94a3b8; border-radius: 8px; margin: 24px 0; color: #475569;">
          <p style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">Belum Ada Data Jadwal Mengajar Terdaftar</p>
          <p style="font-size: 12px; margin: 0;">Silakan tambahkan jadwal mengajar terlebih dahulu pada aplikasi.</p>
        </div>
      `;
    } else if (printFormatMode === 'table') {
      const rows = printableList.map((j, i) => {
        const g = gurus.find((guru) => guru.id === j.guruId);
        return `
          <tr>
            <td style="text-align: center;">${i + 1}</td>
            <td style="font-weight: 600; text-align: center;">${j.hari}</td>
            <td style="text-align: center;">${j.jamKe}</td>
            <td style="text-align: center;">${j.waktu}</td>
            <td style="font-weight: 600;">${j.mapel}</td>
            <td style="font-weight: bold; text-align: center;">${j.kelas}</td>
            <td style="text-align: center;">${j.ruang}</td>
            <td>${g ? `${g.nama}${g.gelar ? `, ${g.gelar}` : ''}` : '-'}</td>
          </tr>
        `;
      }).join('');

      contentHtml = `
        <table class="doc-table">
          <thead>
            <tr>
              <th style="width: 36px;">No</th>
              <th>Hari</th>
              <th>Jam Ke</th>
              <th>Waktu</th>
              <th>Mata Pelajaran</th>
              <th>Kelas</th>
              <th>Ruang</th>
              <th>Guru Pengampu</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc; font-weight: 600;">
              <td colspan="5" style="text-align: right; padding: 8px;">Total Pertemuan & Beban Mengajar:</td>
              <td colspan="3" style="text-align: left; padding: 8px; color: #065f46; font-weight: bold;">
                ${printableList.length} Sesi Pertemuan (${printableList.length * 2} JP / Minggu)
              </td>
            </tr>
          </tfoot>
        </table>
      `;
    } else {
      // Matrix format
      const headerDays = daysList.map((d) => `<th>${d}</th>`).join('');
      const rows = timeSlots.map((slot) => {
        if (slot.isBreak) {
          return `
            <tr style="background-color: #f1f5f9; font-weight: bold; text-align: center; color: #334155;">
              <td style="background-color: #e2e8f0; padding: 6px;">
                ${slot.jamKe}<br><span style="font-size: 9px; font-weight: normal;">${slot.waktu}</span>
              </td>
              <td colspan="${daysList.length}" style="letter-spacing: 1px; font-size: 10px; padding: 6px; text-transform: uppercase;">
                ISTIRAHAT / SHOLAT
              </td>
            </tr>
          `;
        }
        const dayCols = daysList.map((day) => {
          const matching = printableList.filter((j) => j.hari === day && j.jamKe === slot.jamKe);
          if (matching.length > 0) {
            const items = matching.map((m) => {
              const g = gurus.find((guru) => guru.id === m.guruId);
              return `
                <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px 5px; margin-bottom: 3px; text-align: left;">
                  <div style="font-weight: bold; color: #0f172a; font-size: 10px;">${m.mapel}</div>
                  <div style="color: #047857; font-weight: 600; font-size: 9px;">Kls ${m.kelas} | ${m.ruang}</div>
                  ${printTeacherFilter === 'Semua' && g ? `<div style="color: #64748b; font-size: 9px;">${g.nama}</div>` : ''}
                </div>
              `;
            }).join('');
            return `<td style="vertical-align: top;">${items}</td>`;
          }
          return `<td style="color: #cbd5e1; text-align: center;">-</td>`;
        }).join('');

        return `
          <tr>
            <td style="font-weight: bold; text-align: center; background-color: #f8fafc; white-space: nowrap;">
              Jam ${slot.jamKe}<br><span style="font-size: 9px; font-weight: normal; color: #64748b;">${slot.waktu}</span>
            </td>
            ${dayCols}
          </tr>
        `;
      }).join('');

      contentHtml = `
        <table class="doc-table matrix-table">
          <thead>
            <tr>
              <th style="width: 75px;">Waktu / Jam</th>
              ${headerDays}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    }

    const schoolTitle = schoolSettings.schoolName ? schoolSettings.schoolName.toUpperCase() : 'SEKOLAH';
    const subDesc = printTeacherFilter !== 'Semua' && teacher
      ? `Guru Pengampu: ${teacher.nama}${teacher.gelar ? `, ${teacher.gelar}` : ''} | Mapel: ${teacher.mapel} | NIP: ${teacher.nip}`
      : `Tahun Ajaran: ${schoolSettings.academicYear} | Semester: ${schoolSettings.activeSemester}`;

    const printDocHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Pratinjau Cetak Jadwal Pelajaran - ${schoolSettings.schoolName}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0f172a;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .screen-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .screen-toolbar-title {
      font-size: 14px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .screen-toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-action-print {
      background: #059669;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);
    }
    .btn-action-print:hover {
      background: #047857;
    }
    .btn-action-close {
      background: #334155;
      color: #f8fafc;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-action-close:hover {
      background: #475569;
    }
    .paper-container {
      padding: 24px 16px 48px;
      display: flex;
      justify-content: center;
    }
    .paper-sheet {
      background: #ffffff;
      width: 210mm;
      min-height: 297mm;
      padding: 18mm 16mm 20mm;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border-radius: 4px;
    }
    .kop-wrapper {
      border-bottom: 3px double #0f172a;
      padding-bottom: 12px;
      margin-bottom: 18px;
      text-align: center;
      position: relative;
    }
    .kop-logo {
      position: absolute;
      left: 6px;
      top: 2px;
      width: 58px;
      height: 58px;
      border: 2px solid #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 13px;
      border-radius: 6px;
      background: #f8fafc;
    }
    .kop-dinas {
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0;
      color: #1e293b;
    }
    .kop-sekolah {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin: 3px 0;
      color: #000000;
    }
    .kop-alamat {
      font-size: 11px;
      color: #334155;
      margin: 2px 0;
    }
    .kop-meta {
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      margin-top: 2px;
    }
    .doc-heading {
      text-align: center;
      margin-bottom: 18px;
    }
    .doc-title {
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      text-decoration: underline;
      margin: 0 0 4px 0;
      letter-spacing: 0.5px;
    }
    .doc-subtitle {
      font-size: 11px;
      font-weight: 600;
      color: #334155;
      margin: 0;
    }
    .doc-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 8px;
    }
    .doc-table th, .doc-table td {
      border: 1px solid #1e293b;
      padding: 6px 8px;
    }
    .doc-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: center;
      color: #0f172a;
    }
    .matrix-table th, .matrix-table td {
      padding: 4px 6px;
      font-size: 10px;
    }
    .signature-section {
      margin-top: 36px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      page-break-inside: avoid;
    }
    .sig-col {
      width: 44%;
      text-align: center;
    }
    .sig-space {
      height: 60px;
    }
    .sig-name {
      font-weight: bold;
      text-decoration: underline;
    }
    .sig-nip {
      font-size: 10px;
      color: #334155;
    }
    @media print {
      body {
        background: transparent !important;
      }
      .screen-toolbar {
        display: none !important;
      }
      .paper-container {
        padding: 0 !important;
      }
      .paper-sheet {
        box-shadow: none !important;
        border-radius: 0 !important;
        width: 100% !important;
        padding: 0 !important;
        min-height: auto !important;
      }
      @page {
        size: A4 portrait;
        margin: 15mm 12mm 15mm 12mm;
      }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <div class="screen-toolbar-title">
      <span>📄 Pratinjau Cetak Web Jadwal Pelajaran</span>
      <span style="font-size: 12px; font-weight: normal; opacity: 0.85;">— ${schoolSettings.schoolName}</span>
    </div>
    <div class="screen-toolbar-actions">
      <button class="btn-action-print" onclick="window.print()">
        🖨️ Cetak / Simpan PDF
      </button>
      <button class="btn-action-close" onclick="window.close()">
        ✕ Tutup
      </button>
    </div>
  </div>

  <div class="paper-container">
    <div class="paper-sheet">
      <div class="kop-wrapper">
        <div class="kop-logo">KEMDIKBUD</div>
        <p class="kop-dinas">PEMERINTAH PROVINSI / KABUPATEN DINAS PENDIDIKAN</p>
        <h1 class="kop-sekolah">${schoolTitle}</h1>
        <p class="kop-alamat">${schoolSettings.address || 'Alamat Resmi Sekolah'}</p>
        <p class="kop-meta">NPSN: ${schoolSettings.npsn || '10203040'} | Kurikulum: ${schoolSettings.curriculum || 'Kurikulum Merdeka'}</p>
      </div>

      <div class="doc-heading">
        <h2 class="doc-title">JADWAL PELAJARAN DAN MENGAJAR GURU</h2>
        <p class="doc-subtitle">${subDesc}</p>
      </div>

      ${contentHtml}

      <div class="signature-section">
        <div class="sig-col">
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <div class="sig-space"></div>
          <p class="sig-name">${schoolSettings.headmasterName || 'Drs. H. Ahmad Sudrajat, M.Pd'}</p>
          <p class="sig-nip">NIP. ${schoolSettings.headmasterNip || '19750814 200003 1 004'}</p>
        </div>
        <div class="sig-col">
          <p>${schoolSettings.address ? schoolSettings.address.split(',')[0] : 'Kota'}, ${todayDateStr}</p>
          <p>${printTeacherFilter !== 'Semua' ? 'Guru Mata Pelajaran' : 'Wakil Kepala Bidang Kurikulum'}</p>
          <div class="sig-space"></div>
          <p class="sig-name">${teacherName}</p>
          <p class="sig-nip">NIP. ${teacherNip}</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch(e) {
          console.warn('Auto print trigger notice:', e);
        }
      }, 350);
    });
  </script>
</body>
</html>`;

    try {
      const printWindow = window.open('', '_blank');
      if (printWindow && printWindow.document) {
        printWindow.document.open();
        printWindow.document.write(printDocHtml);
        printWindow.document.close();
      } else {
        const blob = new Blob([printDocHtml], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.rel = 'noopener,noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      }
    } catch (err) {
      console.warn('Failed to open new print window, falling back to window.print:', err);
      window.print();
    }
  };

  const handleExportExcel = () => {
    const targetList = printTeacherFilter !== 'Semua'
      ? jadwals.filter((j) => j.guruId === printTeacherFilter)
      : jadwals;

    if (targetList.length === 0) {
      showToast('warning', 'Data Kosong', 'Belum ada data jadwal mengajar yang dapat diekspor ke Excel.');
      return;
    }

    const targetGuru = printTeacherFilter !== 'Semua' ? gurus.find((g) => g.id === printTeacherFilter) : null;
    const wb = XLSX.utils.book_new();

    // 1. Sheet: Daftar Jadwal
    const tableData: (string | number)[][] = [
      [schoolSettings.schoolName ? schoolSettings.schoolName.toUpperCase() : 'SEKOLAH'],
      ['JADWAL PELAJARAN DAN MENGAJAR GURU'],
      [`Tahun Ajaran: ${schoolSettings.academicYear} | Semester: ${schoolSettings.activeSemester}`],
      targetGuru ? [`Guru Pengampu: ${targetGuru.nama}${targetGuru.gelar ? `, ${targetGuru.gelar}` : ''} | Mapel: ${targetGuru.mapel}`] : ['Semua Guru dan Mata Pelajaran'],
      [],
      ['No', 'Hari', 'Jam Ke', 'Waktu', 'Mata Pelajaran', 'Kelas', 'Ruang', 'Guru Pengampu']
    ];

    targetList.forEach((j, i) => {
      const g = gurus.find((guru) => guru.id === j.guruId);
      tableData.push([
        i + 1,
        j.hari,
        j.jamKe,
        j.waktu,
        j.mapel,
        j.kelas,
        j.ruang,
        g ? `${g.nama}${g.gelar ? `, ${g.gelar}` : ''}` : '-'
      ]);
    });

    const wsTable = XLSX.utils.aoa_to_sheet(tableData);
    wsTable['!cols'] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 10 },
      { wch: 18 },
      { wch: 28 },
      { wch: 10 },
      { wch: 16 },
      { wch: 28 }
    ];
    XLSX.utils.book_append_sheet(wb, wsTable, 'Daftar Jadwal');

    // 2. Sheet: Matriks Mingguan
    const matrixData: (string | number)[][] = [
      [schoolSettings.schoolName ? schoolSettings.schoolName.toUpperCase() : 'SEKOLAH'],
      ['MATRIKS JADWAL PELAJARAN MINGGUAN'],
      [`Tahun Ajaran: ${schoolSettings.academicYear} | Semester: ${schoolSettings.activeSemester}`],
      [],
      ['Jam Ke', 'Waktu', ...daysList]
    ];

    timeSlots.forEach((slot) => {
      if (slot.isBreak) {
        matrixData.push([slot.jamKe, slot.waktu, ...daysList.map(() => 'ISTIRAHAT')]);
      } else {
        const row: (string | number)[] = [slot.jamKe, slot.waktu];
        daysList.forEach((day) => {
          const matching = targetList.filter((j) => j.hari === day && j.jamKe === slot.jamKe);
          if (matching.length > 0) {
            row.push(matching.map((m) => `${m.mapel} (${m.kelas})`).join('; '));
          } else {
            row.push('-');
          }
        });
        matrixData.push(row);
      }
    });

    const wsMatrix = XLSX.utils.aoa_to_sheet(matrixData);
    wsMatrix['!cols'] = [
      { wch: 10 },
      { wch: 18 },
      ...daysList.map(() => ({ wch: 26 }))
    ];
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matriks Mingguan');

    const safeYear = schoolSettings.academicYear.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Jadwal_Pelajaran_${safeYear}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Official Print Header: STRICTLY HIDDEN ON SCREEN, ONLY VISIBLE WHEN PRINTING */}
      <PrintHeader
        title="JADWAL PELAJARAN DAN MENGAJAR GURU"
        subtitle={
          targetTeacherId
            ? `Nama Guru: ${gurus.find((g) => g.id === targetTeacherId)?.nama}, ${gurus.find((g) => g.id === targetTeacherId)?.gelar} | Mapel: ${gurus.find((g) => g.id === targetTeacherId)?.mapel}`
            : `Tahun Ajaran ${schoolSettings.academicYear} - Semester ${schoolSettings.activeSemester}`
        }
      />

      {/* Screen Header Controls with Smooth Animated Entry */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="no-print flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Manajemen Jadwal Tatap Muka & Jam Pelajaran</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">
            Jadwal Mengajar
          </h1>
          <p className="text-xs text-slate-500">
            Atur alokasi jam mengajar mingguan, ruang kelas tatap muka, dan sinkronisasi langsung dengan buku jurnal & presensi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              id="btn-view-cards"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kartu Sesi</span>
            </button>
            <button
              id="btn-view-matrix"
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                viewMode === 'matrix'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Matriks Mingguan</span>
            </button>
          </div>

          {/* Print Button */}
          <button
            id="btn-print-jadwal"
            onClick={() => {
              setPrintTeacherFilter(targetTeacherId || 'Semua');
              setShowPrintModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer"
            title="Buka pratinjau & cetak jadwal resmi dengan kop sekolah"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Cetak Jadwal</span>
          </button>

          {/* Add Schedule Button */}
          <button
            id="btn-tambah-jadwal"
            onClick={() => handleOpenAdd()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Jadwal</span>
          </button>
        </div>
      </motion.div>

      {/* Success Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="no-print flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 border border-emerald-200 shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards (Vibrant, Colorful, Glassmorphism) */}
      <div className="no-print grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Beban Mengajar - Emerald/Teal */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/60 p-4.5 shadow-xs hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/10 transition group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 group-hover:text-emerald-800">
              Beban Mengajar
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-xs shadow-emerald-300">
              <Clock className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-emerald-950">{totalJP}</span>
            <span className="text-xs font-bold text-emerald-700">JP / Minggu</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>{totalJP >= 24 ? 'Standar Sertifikasi (≥24 JP)' : `${24 - totalJP} JP lagi untuk sertifikasi`}</span>
          </div>
        </motion.div>

        {/* Card 2: Total Pertemuan - Indigo/Purple */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 p-4.5 shadow-xs hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/10 transition group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 group-hover:text-indigo-800">
              Total Pertemuan
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xs shadow-indigo-300">
              <CalendarDays className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-indigo-950">{totalSesi}</span>
            <span className="text-xs font-bold text-indigo-700">Sesi Tatap Muka</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-900">
            <span>Terbagi dalam {activeDaysCount} hari aktif</span>
          </div>
        </motion.div>

        {/* Card 3: Kelas Ampuan - Amber/Orange */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 via-white to-orange-50/60 p-4.5 shadow-xs hover:border-amber-300 hover:shadow-md hover:shadow-amber-500/10 transition group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 group-hover:text-amber-800">
              Kelas Ampuan
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs shadow-amber-300">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-amber-950">{taughtClasses.length}</span>
            <span className="text-xs font-bold text-amber-700">Rombel Kelas</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 truncate max-w-full">
            <span>{taughtClasses.join(', ') || 'Belum ada kelas'}</span>
          </div>
        </motion.div>

        {/* Card 4: Jadwal Hari Ini - Rose/Pink */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.15 }}
          className="relative overflow-hidden rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50/90 via-white to-pink-50/60 p-4.5 shadow-xs hover:border-rose-300 hover:shadow-md hover:shadow-rose-500/10 transition group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-600" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 group-hover:text-rose-800">
              Hari Ini: {todayHighlight}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xs shadow-rose-300">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-rose-950">{todaySessions.length}</span>
            <span className="text-xs font-bold text-rose-700">Sesi Terjadwal</span>
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 px-2.5 py-0.5 text-[11px] font-semibold text-rose-900 truncate max-w-full">
            <span>{todaySessions.length > 0 ? `Pertama: Kls ${todaySessions[0]?.kelas} (${todaySessions[0]?.waktu})` : 'Tidak ada jadwal hari ini'}</span>
          </div>
        </motion.div>
      </div>

      {/* Filter and Day Selector Bar */}
      <div className="no-print rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3.5">
        {/* Day Selector Pill Tabs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Pilih Hari Pembelajaran:
            </span>
            {selectedDay !== 'Semua' && (
              <button
                onClick={() => setSelectedDay('Semua')}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Lihat Semua Hari
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              id="day-filter-semua"
              onClick={() => setSelectedDay('Semua')}
              className={`relative rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                selectedDay === 'Semua'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Hari ({statsJadwals.length})
            </button>

            {daysList.map((day) => {
              const countDay = statsJadwals.filter((j) => j.hari === day).length;
              const isToday = day === todayHighlight;
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  id={`day-filter-${day.toLowerCase()}`}
                  onClick={() => setSelectedDay(day)}
                  className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                      : isToday
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      Hari Ini
                    </span>
                  )}
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {countDay}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter Controls: Guru, Kelas, Search */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 border-t border-slate-100 pt-3">
          {/* Guru Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">
              Guru Pengampu
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              {isAdmin ? (
                <select
                  id="select-filter-guru-jadwal"
                  value={selectedGuruFilter}
                  onChange={(e) => setSelectedGuruFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-8.5 pr-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
                >
                  <option value="Semua">Semua Guru ({gurus.length} Pendidik)</option>
                  {gurus.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama}, {g.gelar} — {g.mapel}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50/70 pl-8.5 pr-3 py-1.5 text-xs font-semibold text-emerald-900 truncate">
                  {currentTeacher?.nama}, {currentTeacher?.gelar} ({currentTeacher?.mapel})
                </div>
              )}
            </div>
          </div>

          {/* Kelas Filter */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">
              Filter Kelas
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <select
                id="select-filter-kelas-jadwal"
                value={selectedKelasFilter}
                onChange={(e) => setSelectedKelasFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-8.5 pr-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              >
                <option value="Semua">Semua Kelas ({allClasses.length} Rombel)</option>
                {allClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-slate-500">
              Cari Mapel / Ruang / Guru
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                id="input-search-jadwal"
                type="text"
                placeholder="Cari mata pelajaran, ruang, nama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-8.5 pr-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: Cards & Timeline View */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {effectiveJadwals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-700">Tidak Ada Jadwal Mengajar Ditemukan</h3>
              <p className="mt-1 text-xs text-slate-400">
                Tidak ada data jadwal untuk kriteria hari atau filter pencarian yang dipilih.
              </p>
              <button
                onClick={() => handleOpenAdd(selectedDay !== 'Semua' ? (selectedDay as IJadwal['hari']) : 'Senin')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
              >
                <Plus className="h-4 w-4" />
                <span>Tambahkan Jadwal Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {effectiveJadwals.map((item, idx) => {
                  const guru = gurus.find((g) => g.id === item.guruId);
                  const isToday = item.hari === todayHighlight;

                  // Colorful theme per card based on index
                  const colorThemes = [
                    { border: 'border-emerald-200/90', bg: 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40', badge: 'bg-emerald-600 text-white', classTag: 'bg-emerald-100/90 text-emerald-800 border-emerald-200/80', bar: 'from-emerald-500 to-teal-500' },
                    { border: 'border-sky-200/90', bg: 'bg-gradient-to-br from-sky-50/70 via-white to-blue-50/40', badge: 'bg-sky-600 text-white', classTag: 'bg-sky-100/90 text-sky-800 border-sky-200/80', bar: 'from-sky-500 to-blue-500' },
                    { border: 'border-purple-200/90', bg: 'bg-gradient-to-br from-purple-50/70 via-white to-fuchsia-50/40', badge: 'bg-purple-600 text-white', classTag: 'bg-purple-100/90 text-purple-800 border-purple-200/80', bar: 'from-purple-500 to-fuchsia-500' },
                    { border: 'border-amber-200/90', bg: 'bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40', badge: 'bg-amber-600 text-white', classTag: 'bg-amber-100/90 text-amber-900 border-amber-200/80', bar: 'from-amber-500 to-orange-500' },
                    { border: 'border-rose-200/90', bg: 'bg-gradient-to-br from-rose-50/70 via-white to-pink-50/40', badge: 'bg-rose-600 text-white', classTag: 'bg-rose-100/90 text-rose-800 border-rose-200/80', bar: 'from-rose-500 to-pink-500' },
                    { border: 'border-indigo-200/90', bg: 'bg-gradient-to-br from-indigo-50/70 via-white to-violet-50/40', badge: 'bg-indigo-600 text-white', classTag: 'bg-indigo-100/90 text-indigo-800 border-indigo-200/80', bar: 'from-indigo-500 to-violet-500' },
                  ];
                  const theme = colorThemes[idx % colorThemes.length];

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      whileHover={{ y: -3 }}
                      className={`group relative flex flex-col justify-between rounded-2xl border ${theme.bg} ${
                        isToday
                          ? 'border-emerald-400 ring-2 ring-emerald-300/60 shadow-md shadow-emerald-500/10'
                          : `${theme.border} hover:shadow-md transition-all`
                      } p-5 shadow-xs overflow-hidden`}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.bar}`} />

                      {/* Header row: Day & Time */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-lg px-2.5 py-1 text-xs font-black shadow-2xs ${
                                isToday ? 'bg-emerald-600 text-white' : theme.badge
                              }`}
                            >
                              {item.hari}
                            </span>
                            <span className="rounded-lg bg-white/90 px-2 py-1 text-[11px] font-bold text-slate-700 border border-slate-200 shadow-2xs">
                              Jam {item.jamKe}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-400">
                            <button
                              id={`btn-edit-jadwal-${item.id}`}
                              onClick={() => handleOpenEdit(item)}
                              className="rounded-lg p-1 hover:bg-white hover:text-slate-700 transition"
                              title="Edit Jadwal"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              id={`btn-delete-jadwal-${item.id}`}
                              onClick={() => handleDelete(item.id)}
                              className="rounded-lg p-1 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Hapus Jadwal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Subject & Class */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                              {item.mapel}
                            </h3>
                            <p className="text-xs font-semibold text-slate-600 mt-0.5">
                              {guru ? `${guru.nama}, ${guru.gelar}` : 'Guru Pengampu'}
                            </p>
                          </div>

                          <span className={`rounded-xl border px-3 py-1 text-xs font-black shrink-0 ${theme.classTag}`}>
                            Kelas {item.kelas}
                          </span>
                        </div>

                        {/* Time & Room details */}
                        <div className="mt-4 space-y-1.5 border-t border-slate-200/60 pt-3 text-xs text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span className="font-bold text-slate-800">{item.waktu} WIB</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            <span>{item.ruang}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Quick-Action Buttons */}
                      <div className="mt-4 flex items-center gap-2 border-t border-slate-200/60 pt-3">
                        <button
                          id={`btn-jadwal-jurnal-${item.id}`}
                          onClick={() => setActiveMenu('guru-jurnal')}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-1.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 shadow-2xs transition cursor-pointer"
                          title="Buka Jurnal Mengajar untuk kelas ini"
                        >
                          <BookOpenCheck className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Buka Jurnal</span>
                        </button>

                        <button
                          id={`btn-jadwal-absensi-${item.id}`}
                          onClick={() => setActiveMenu('guru-absensi')}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-1.5 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-2xs shadow-emerald-300 transition cursor-pointer"
                          title="Input Absensi Kelas"
                        >
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          <span>Presensi</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Weekly Matrix Grid View */}
      {viewMode === 'matrix' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/80 p-4">
            <h3 className="text-sm font-bold text-slate-800">
              Matriks Jadwal Pelajaran Mingguan
            </h3>
            <p className="text-xs text-slate-500">
              Peta jadwal terpadu per jam pelajaran dari Senin hingga Sabtu. Klik slot kosong untuk menambah jadwal.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3 w-28 text-center border-r border-slate-200">Jam / Waktu</th>
                  {daysList.map((day) => {
                    const isToday = day === todayHighlight;
                    return (
                      <th
                        key={day}
                        className={`p-3 min-w-[170px] text-center border-r border-slate-200 last:border-r-0 ${
                          isToday ? 'bg-emerald-100/70 text-emerald-900' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <span>{day}</span>
                          {isToday && (
                            <span className="rounded-full bg-emerald-600 px-1.5 py-0.2 text-[9px] text-white font-bold">
                              Hari Ini
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {timeSlots.map((slot) => {
                  if (slot.isBreak) {
                    return (
                      <tr key={slot.jamKe} className="bg-amber-50/60 text-center font-semibold text-amber-800">
                        <td className="p-2 border-r border-slate-200 text-[11px]">
                          {slot.waktu}
                        </td>
                        <td colSpan={6} className="p-2 text-center text-xs tracking-wide">
                          ISTIRAHAT & SHOLAT DZUHUR BERJAMAAH
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={slot.jamKe} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 border-r border-slate-200 text-center bg-slate-50/50">
                        <p className="font-bold text-slate-800">Jam {slot.jamKe}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{slot.waktu}</p>
                      </td>

                      {daysList.map((day) => {
                        const items = effectiveJadwals.filter(
                          (j) => j.hari === day && j.jamKe.replace(/\s+/g, '') === slot.jamKe.replace(/\s+/g, '')
                        );
                        const isToday = day === todayHighlight;

                        return (
                          <td
                            key={day}
                            className={`p-2.5 border-r border-slate-200 last:border-r-0 align-top ${
                              isToday ? 'bg-emerald-50/20' : ''
                            }`}
                          >
                            {items.length > 0 ? (
                              <div className="space-y-2">
                                {items.map((jItem) => {
                                  const guru = gurus.find((g) => g.id === jItem.guruId);
                                  return (
                                    <div
                                      key={jItem.id}
                                      className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs hover:shadow-xs transition"
                                    >
                                      <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="font-bold text-emerald-950 truncate">
                                          {jItem.mapel}
                                        </span>
                                        <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                                          {jItem.kelas}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-600 truncate">
                                        {guru ? guru.nama : 'Guru'}
                                      </p>
                                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {jItem.ruang}
                                      </p>
                                      <div className="mt-2 flex items-center justify-end gap-1 border-t border-emerald-200/50 pt-1">
                                        <button
                                          onClick={() => handleOpenEdit(jItem)}
                                          className="text-[10px] font-semibold text-emerald-700 hover:underline"
                                        >
                                          Edit
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button
                                          onClick={() => handleDelete(jItem.id)}
                                          className="text-[10px] font-semibold text-rose-600 hover:underline"
                                        >
                                          Hapus
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenAdd(day, slot.jamKe)}
                                className="group flex h-16 w-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition"
                                title={`Jadwalkan sesi pada ${day} Jam ${slot.jamKe}`}
                              >
                                <Plus className="h-4 w-4 text-slate-300 group-hover:text-emerald-600 transition" />
                                <span className="text-[10px] text-slate-400 group-hover:text-emerald-700">
                                  Kosong
                                </span>
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Printable Schedule Table (ONLY VISIBLE ON PRINT) */}
      <div className="hidden print:block print-only mt-4">
        <table className="w-full border-collapse border border-slate-800 text-xs">
          <thead>
            <tr className="bg-slate-200 text-center font-bold">
              <th className="border border-slate-800 p-2">No</th>
              <th className="border border-slate-800 p-2">Hari</th>
              <th className="border border-slate-800 p-2">Jam Ke</th>
              <th className="border border-slate-800 p-2">Waktu</th>
              <th className="border border-slate-800 p-2">Mata Pelajaran</th>
              <th className="border border-slate-800 p-2">Kelas</th>
              <th className="border border-slate-800 p-2">Ruang</th>
              <th className="border border-slate-800 p-2">Guru Pengampu</th>
            </tr>
          </thead>
          <tbody>
            {statsJadwals.map((j, i) => {
              const guru = gurus.find((g) => g.id === j.guruId);
              return (
                <tr key={j.id} className="text-center">
                  <td className="border border-slate-800 p-1.5">{i + 1}</td>
                  <td className="border border-slate-800 p-1.5 font-semibold">{j.hari}</td>
                  <td className="border border-slate-800 p-1.5">{j.jamKe}</td>
                  <td className="border border-slate-800 p-1.5">{j.waktu}</td>
                  <td className="border border-slate-800 p-1.5 text-left font-semibold">{j.mapel}</td>
                  <td className="border border-slate-800 p-1.5 font-bold">{j.kelas}</td>
                  <td className="border border-slate-800 p-1.5">{j.ruang}</td>
                  <td className="border border-slate-800 p-1.5 text-left">
                    {guru ? `${guru.nama}, ${guru.gelar}` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Official Signatures for Printed Schedule: STRICTLY HIDDEN ON SCREEN */}
        <PrintSignatures
          teacherName={
            targetTeacherId
              ? `${gurus.find((g) => g.id === targetTeacherId)?.nama}, ${gurus.find((g) => g.id === targetTeacherId)?.gelar}`
              : undefined
          }
          teacherNip={
            targetTeacherId
              ? gurus.find((g) => g.id === targetTeacherId)?.nip
              : undefined
          }
        />
      </div>

      {/* Modal Add/Edit Jadwal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {editingJadwal ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar Baru'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Alokasi jadwal tatap muka di kelas untuk guru pengampu
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Guru Pengampu */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Guru Pengampu & Mata Pelajaran
                  </label>
                  <select
                    value={formData.guruId}
                    onChange={(e) => {
                      const selGuru = gurus.find((g) => g.id === e.target.value);
                      setFormData({
                        ...formData,
                        guruId: e.target.value,
                        mapel: selGuru?.mapel || formData.mapel,
                        kelas: selGuru?.kelasDiampu[0] || formData.kelas
                      });
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    {gurus.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama}, {g.gelar} — {g.mapel}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Hari */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Hari Pembelajaran
                    </label>
                    <select
                      value={formData.hari}
                      onChange={(e) => setFormData({ ...formData, hari: e.target.value as IJadwal['hari'] })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                    >
                      {daysList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kelas */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Rombongan Belajar (Kelas)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 7A, 7B, 8A"
                      value={formData.kelas}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          kelas: e.target.value,
                          ruang: formData.ruang.startsWith('R. Kelas') ? `R. Kelas ${e.target.value}` : formData.ruang
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Jam Ke */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Jam Ke-
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 1 - 2"
                      value={formData.jamKe}
                      onChange={(e) => setFormData({ ...formData, jamKe: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Waktu */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Rentang Waktu (WIB)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 07.30 - 09.00"
                      value={formData.waktu}
                      onChange={(e) => setFormData({ ...formData, waktu: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Mata Pelajaran */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Mata Pelajaran
                    </label>
                    <input
                      type="text"
                      value={formData.mapel}
                      onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Ruang */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Ruang Belajar / Laboratorium
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: R. Kelas 7A, Lab Komputer"
                      value={formData.ruang}
                      onChange={(e) => setFormData({ ...formData, ruang: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200 transition"
                  >
                    {editingJadwal ? 'Simpan Perubahan' : 'Tambahkan Jadwal'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Pratinjau & Cetak Dokumen Resmi Jadwal */}
      <AnimatePresence>
        {showPrintModal && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl my-6 flex flex-col max-h-[90vh]"
            >
              {/* Modal Top Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/90 px-6 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Pratinjau & Cetak Jadwal Pelajaran
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Format resmi dokumen sekolah dilengkapi kop dinas dan lembar pengesahan
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter Guru */}
                  <select
                    id="select-print-teacher"
                    value={printTeacherFilter}
                    onChange={(e) => setPrintTeacherFilter(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none shadow-xs"
                  >
                    <option value="Semua">Semua Jadwal ({jadwals.length})</option>
                    {gurus.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama} ({g.mapel})
                      </option>
                    ))}
                  </select>

                  {/* Format switcher */}
                  <div className="flex rounded-xl border border-slate-200 bg-slate-200/60 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPrintFormatMode('table')}
                      className={`rounded-lg px-2.5 py-1 transition ${
                        printFormatMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Daftar Tabel
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintFormatMode('matrix')}
                      className={`rounded-lg px-2.5 py-1 transition ${
                        printFormatMode === 'matrix' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Matriks Mingguan
                    </button>
                  </div>

                  {/* Download Excel */}
                  <button
                    type="button"
                    id="btn-print-export-csv"
                    onClick={handleExportExcel}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs cursor-pointer"
                    title="Unduh format berkas Microsoft Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>Ekspor Excel (.xlsx)</span>
                  </button>

                  {/* Buka Pratinjau Print Web */}
                  <button
                    type="button"
                    id="btn-print-trigger-action"
                    onClick={handleTriggerPrint}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm shadow-emerald-200 cursor-pointer"
                    title="Buka Pratinjau Print Web resmi dan dialog cetak dokumen"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Pratinjau Print Web</span>
                  </button>

                  {/* Close */}
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(false)}
                    className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                    title="Tutup"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Printable Document Paper Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
                <div className="mx-auto max-w-3xl rounded-xl border border-slate-200/80 bg-white p-8 shadow-sm">
                  {/* Kop Surat */}
                  <PrintHeader
                    title="JADWAL PELAJARAN DAN MENGAJAR GURU"
                    subtitle={
                      printTeacherFilter !== 'Semua'
                        ? `Guru Pengampu: ${gurus.find((g) => g.id === printTeacherFilter)?.nama}${gurus.find((g) => g.id === printTeacherFilter)?.gelar ? `, ${gurus.find((g) => g.id === printTeacherFilter)?.gelar}` : ''} | Mapel: ${gurus.find((g) => g.id === printTeacherFilter)?.mapel}`
                        : `Tahun Ajaran ${schoolSettings.academicYear} — Semester ${schoolSettings.activeSemester}`
                    }
                    showOnScreen={true}
                  />

                  {/* Document Content */}
                  {(() => {
                    const printableList = printTeacherFilter !== 'Semua'
                      ? jadwals.filter((j) => j.guruId === printTeacherFilter)
                      : jadwals;

                    if (printableList.length === 0) {
                      return (
                        <div className="my-8 rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                          <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-700">Belum Ada Data Jadwal Mengajar Terdaftar</p>
                          <p className="mt-1 text-slate-400">
                            Silakan tambahkan jadwal mengajar terlebih dahulu melalui tombol <strong>Tambah Jadwal</strong> pada halaman utama.
                          </p>
                        </div>
                      );
                    }

                    if (printFormatMode === 'table') {
                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-slate-700 text-xs">
                            <thead>
                              <tr className="bg-slate-100 text-slate-800 font-bold text-center">
                                <th className="border border-slate-700 p-2 w-10">No</th>
                                <th className="border border-slate-700 p-2">Hari</th>
                                <th className="border border-slate-700 p-2">Jam Ke</th>
                                <th className="border border-slate-700 p-2">Waktu</th>
                                <th className="border border-slate-700 p-2 text-left">Mata Pelajaran</th>
                                <th className="border border-slate-700 p-2">Kelas</th>
                                <th className="border border-slate-700 p-2">Ruang</th>
                                <th className="border border-slate-700 p-2 text-left">Guru Pengampu</th>
                              </tr>
                            </thead>
                            <tbody>
                              {printableList.map((j, i) => {
                                const guru = gurus.find((g) => g.id === j.guruId);
                                return (
                                  <tr key={j.id} className="text-center hover:bg-slate-50/50">
                                    <td className="border border-slate-700 p-1.5">{i + 1}</td>
                                    <td className="border border-slate-700 p-1.5 font-semibold">{j.hari}</td>
                                    <td className="border border-slate-700 p-1.5">{j.jamKe}</td>
                                    <td className="border border-slate-700 p-1.5">{j.waktu}</td>
                                    <td className="border border-slate-700 p-1.5 text-left font-semibold">{j.mapel}</td>
                                    <td className="border border-slate-700 p-1.5 font-bold">{j.kelas}</td>
                                    <td className="border border-slate-700 p-1.5">{j.ruang}</td>
                                    <td className="border border-slate-700 p-1.5 text-left">
                                      {guru ? `${guru.nama}${guru.gelar ? `, ${guru.gelar}` : ''}` : '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            <tfoot>
                              <tr className="bg-slate-50 font-semibold text-slate-700">
                                <td colSpan={5} className="border border-slate-700 p-2 text-right">
                                  Total Pertemuan & Beban Mengajar:
                                </td>
                                <td colSpan={3} className="border border-slate-700 p-2 text-left font-bold text-emerald-800">
                                  {printableList.length} Sesi Pertemuan ({printableList.length * 2} JP / Minggu)
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      );
                    }

                    // Matrix Mode
                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-slate-700 text-[11px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-800 font-bold text-center">
                              <th className="border border-slate-700 p-2 w-24">Waktu / Jam</th>
                              {daysList.map((day) => (
                                <th key={day} className="border border-slate-700 p-2">
                                  {day}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {timeSlots.map((slot) => {
                              if (slot.isBreak) {
                                return (
                                  <tr key={slot.jamKe} className="bg-slate-100/80 text-center font-bold text-slate-600">
                                    <td className="border border-slate-700 p-1.5 bg-slate-200">
                                      {slot.jamKe}
                                      <span className="block text-[9px] font-normal">{slot.waktu}</span>
                                    </td>
                                    <td colSpan={daysList.length} className="border border-slate-700 p-1.5 tracking-wider uppercase text-[10px]">
                                      Istirahat / Sholat
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr key={slot.jamKe} className="align-top">
                                  <td className="border border-slate-700 p-1.5 bg-slate-50 font-bold text-center whitespace-nowrap">
                                    Jam {slot.jamKe}
                                    <span className="block text-[9px] font-normal text-slate-500">{slot.waktu}</span>
                                  </td>
                                  {daysList.map((day) => {
                                    const matching = printableList.filter(
                                      (j) => j.hari === day && j.jamKe === slot.jamKe
                                    );

                                    return (
                                      <td key={day} className="border border-slate-700 p-1 text-center min-w-[100px]">
                                        {matching.length > 0 ? (
                                          <div className="space-y-1">
                                            {matching.map((m) => {
                                              const g = gurus.find((guru) => guru.id === m.guruId);
                                              return (
                                                <div key={m.id} className="rounded border border-slate-300 bg-slate-50 p-1 text-left leading-tight">
                                                  <div className="font-bold text-slate-900 truncate">{m.mapel}</div>
                                                  <div className="text-[10px] text-emerald-800 font-semibold">Kls {m.kelas} | {m.ruang}</div>
                                                  {printTeacherFilter === 'Semua' && g && (
                                                    <div className="text-[9px] text-slate-500 truncate">{g.nama}</div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <span className="text-slate-300 text-[10px]">-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}

                  {/* Pengesahan Tanda Tangan */}
                  <PrintSignatures
                    teacherName={
                      printTeacherFilter !== 'Semua'
                        ? `${gurus.find((g) => g.id === printTeacherFilter)?.nama}${gurus.find((g) => g.id === printTeacherFilter)?.gelar ? `, ${gurus.find((g) => g.id === printTeacherFilter)?.gelar}` : ''}`
                        : undefined
                    }
                    teacherNip={
                      printTeacherFilter !== 'Semua'
                        ? gurus.find((g) => g.id === printTeacherFilter)?.nip
                        : undefined
                    }
                    showOnScreen={true}
                  />
                </div>
              </div>

              {/* Modal Bottom Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-3">
                <p className="text-xs text-slate-500">
                  Tip: Pastikan opsi <em>Background graphics / Grafis latar belakang</em> dicentang pada dialog cetak printer Anda.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPrintModal(false)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleTriggerPrint}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm shadow-emerald-200 cursor-pointer"
                    title="Buka Pratinjau Print Web resmi dan dialog cetak dokumen"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Buka Pratinjau Print Web</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
