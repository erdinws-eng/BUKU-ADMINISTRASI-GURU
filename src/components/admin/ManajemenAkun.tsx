import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAccount, AdminType } from '../../types';
import {
  UserCog,
  Shield,
  GraduationCap,
  Plus,
  Search,
  KeyRound,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Printer,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Sparkles,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  School
} from 'lucide-react';
import { printWebDocument } from '../../utils/printHelper';
import { PageHeader } from '../shared/PageHeader';
import { motion } from 'motion/react';

export const ManajemenAkun: React.FC = () => {
  const {
    users,
    currentUser,
    gurus,
    schoolSettings,
    addUser,
    updateUser,
    deleteUser,
    resetPasswordUser,
    toggleUserStatus,
    syncTeacherAccounts,
    login,
    showToast,
    showFeedbackModal
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'admin' | 'guru'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [resetModalUser, setResetModalUser] = useState<UserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPasswordMap, setShowPasswordMap] = useState<{ [id: string]: boolean }>({});

  // Form states for creating/editing user
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'admin' as 'admin' | 'guru',
    adminType: 'Admin Tata Usaha' as AdminType,
    teacherId: '',
    statusAktif: true
  });

  const handleOpenAddModal = (roleType: 'admin' | 'guru' = 'admin') => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      phone: '',
      password: roleType === 'admin' ? 'admin123' : 'guru123',
      role: roleType,
      adminType: 'Admin Tata Usaha',
      teacherId: gurus[0]?.id || '',
      statusAktif: true
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      password: user.password || '',
      role: user.role,
      adminType: user.adminType || 'Admin Tata Usaha',
      teacherId: user.teacherId || '',
      statusAktif: user.statusAktif !== false
    });
    setShowAddModal(true);
  };

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim()) {
      showToast('warning', 'Data Belum Lengkap', 'Nama dan Username akun wajib diisi.');
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name,
        username: formData.username.toLowerCase().trim(),
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        adminType: formData.role === 'admin' ? formData.adminType : undefined,
        teacherId: formData.role === 'guru' ? formData.teacherId : undefined,
        statusAktif: formData.statusAktif,
        ...(formData.password ? { password: formData.password } : {})
      });
      showToast('success', 'Akun Diperbarui', `Akun "${formData.name}" berhasil diperbarui.`);
    } else {
      addUser({
        name: formData.name,
        username: formData.username.toLowerCase().trim(),
        email: formData.email || `${formData.username.toLowerCase().trim()}@${schoolSettings.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '')}.sch.id`,
        phone: formData.phone,
        password: formData.password || (formData.role === 'admin' ? 'admin123' : 'guru123'),
        role: formData.role,
        adminType: formData.role === 'admin' ? formData.adminType : undefined,
        teacherId: formData.role === 'guru' ? formData.teacherId : undefined,
        statusAktif: formData.statusAktif
      });
      showToast('success', 'Akun Dibuat', `Akun baru "${formData.name}" berhasil diterbitkan.`);
    }

    setShowAddModal(false);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    if (!newPasswordInput.trim()) {
      showToast('warning', 'Kata Sandi Kosong', 'Kata sandi baru tidak boleh kosong.');
      return;
    }
    resetPasswordUser(resetModalUser.id, newPasswordInput.trim());
    showToast('success', 'Kata Sandi Diperbarui', `Kata sandi untuk akun "${resetModalUser.name}" berhasil diubah.`);
    setResetModalUser(null);
    setNewPasswordInput('');
  };

  const handleSyncGurus = () => {
    const result = syncTeacherAccounts();
    if (result.createdCount > 0) {
      showToast('success', 'Akun Guru Diterbitkan', `Berhasil menerbitkan ${result.createdCount} akun login baru untuk guru.`);
    } else {
      showToast('info', 'Semua Guru Terdaftar', 'Semua guru yang ada di Master Data Guru sudah memiliki akun login aktif.');
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrintCredentials = () => {
    printWebDocument({ title: 'Rekap Kredensial dan Akun Pengguna' });
  };

  // Filtering
  const filteredUsers = users.filter((u) => {
    if (activeTab === 'admin' && u.role !== 'admin') return false;
    if (activeTab === 'guru' && u.role !== 'guru') return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchUser = u.username.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchPhone = (u.phone || '').toLowerCase().includes(q);
      const linkedGuru = gurus.find((g) => g.id === u.teacherId);
      const matchMapel = linkedGuru ? linkedGuru.mapel.toLowerCase().includes(q) : false;
      return matchName || matchUser || matchEmail || matchPhone || matchMapel;
    }
    return true;
  });

  const adminUsersCount = users.filter((u) => u.role === 'admin').length;
  const guruUsersCount = users.filter((u) => u.role === 'guru').length;
  const activeCount = users.filter((u) => u.statusAktif !== false).length;
  const gurusWithoutAccount = gurus.filter(
    (g) => !users.some((u) => u.teacherId === g.id)
  );

  return (
    <div className="space-y-6">
      {/* Official Print Header (for printing credentials) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-800 pb-4 text-center">
        <h2 className="text-base font-bold uppercase tracking-wider text-slate-900">
          {schoolSettings.schoolName}
        </h2>
        <p className="text-xs text-slate-700">{schoolSettings.address}</p>
        <p className="text-xs text-slate-700">NPSN: {schoolSettings.npsn}</p>
        <div className="mt-3 border-t border-slate-400 pt-2">
          <h3 className="text-sm font-bold uppercase tracking-wide">
            Daftar Akun Pengguna & Kredensial Login
          </h3>
          <p className="text-xs text-slate-600">
            Tahun Ajaran {schoolSettings.academicYear} | Dicetak pada:{' '}
            {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Screen Controls with PageHeader */}
      <div className="no-print">
        <PageHeader
          title="Kelola Akun Admin & Guru"
          subtitle="Atur hak akses pengguna, terbitkan kredensial login guru, reset kata sandi, dan kelola administrator sekolah."
          badge="Pusat Kendali Pengguna"
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-print-user-cards"
                onClick={handlePrintCredentials}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
              >
                <Printer className="h-4 w-4 text-slate-500" />
                <span>Cetak Rekap Kredensial</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-add-admin-account"
                onClick={() => handleOpenAddModal('admin')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-xs cursor-pointer"
              >
                <Shield className="h-4 w-4 text-indigo-600" />
                <span>+ Akun Admin</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="btn-add-guru-account"
                onClick={() => handleOpenAddModal('guru')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200 transition cursor-pointer"
              >
                <GraduationCap className="h-4 w-4" />
                <span>+ Akun Guru</span>
              </motion.button>
            </div>
          }
          stats={[
            { label: 'Total Akun Terdaftar', value: `${users.length} Akun`, helper: `${activeCount} berstatus aktif` },
            { label: 'Akun Administrator', value: `${adminUsersCount} Akun`, helper: 'TU, Kurikulum & Kepsek' },
            { label: 'Akun Guru Pengampu', value: `${guruUsersCount} Akun`, helper: `Dari ${gurus.length} tenaga pendidik` },
            { label: 'Status Sistem', value: `${Math.round((activeCount / (users.length || 1)) * 100)}% Aktif`, helper: `${users.length - activeCount} Nonaktif` }
          ]}
        />
      </div>

      {/* Notice if any guru does not have an account yet */}
      {gurusWithoutAccount.length > 0 && (
        <div className="no-print rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Terdapat {gurusWithoutAccount.length} guru di Master Data yang belum memiliki akun login!
              </p>
              <p className="text-xs text-amber-700">
                Guru: {gurusWithoutAccount.map((g) => g.nama).join(', ')}. Anda dapat membuat akun login otomatis untuk mereka sekarang.
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            id="btn-sync-all-gurus"
            onClick={handleSyncGurus}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Terbitkan Akun Guru Otomatis</span>
          </motion.button>
        </div>
      )}

      {/* Main Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/70 p-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-200/60 p-1">
            <button
              id="tab-filter-all"
              onClick={() => setActiveTab('all')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Akun ({users.length})
            </button>
            <button
              id="tab-filter-admin"
              onClick={() => setActiveTab('admin')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin ({adminUsersCount})
            </button>
            <button
              id="tab-filter-guru"
              onClick={() => setActiveTab('guru')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'guru'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Guru ({guruUsersCount})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="input-search-users"
              type="text"
              placeholder="Cari nama, username, email, mapel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Role & Hak Akses</th>
                <th className="py-3.5 px-4">Username & Sandi</th>
                <th className="py-3.5 px-4">Kontak / Email</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="no-print py-3.5 px-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada akun yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isAdmin = user.role === 'admin';
                  const linkedGuru = gurus.find((g) => g.id === user.teacherId);
                  const isCurrent = currentUser?.id === user.id;
                  const isPassVisible = showPasswordMap[user.id] || false;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isCurrent ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      {/* User identity */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-xs text-white shadow-xs ${
                              isAdmin
                                ? 'bg-indigo-600 shadow-indigo-200'
                                : 'bg-emerald-600 shadow-emerald-200'
                            }`}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900">{user.name}</p>
                              {isCurrent && (
                                <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-700">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role & Access */}
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                            <Shield className="h-3.5 w-3.5 text-indigo-600" />
                            <span>{user.adminType || 'Administrator'}</span>
                          </div>
                        ) : (
                          <div>
                            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                              <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Guru Mata Pelajaran</span>
                            </div>
                            {linkedGuru && (
                              <p className="mt-1 text-[11px] text-slate-600">
                                Mapel: <span className="font-semibold text-slate-800">{linkedGuru.mapel}</span> (Kelas: {linkedGuru.kelasDiampu.join(', ')})
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Username & Password */}
                      <td className="py-3 px-4">
                        <p className="font-mono font-semibold text-slate-800">@{user.username}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                          <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {isPassVisible ? user.password || '******' : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="no-print p-0.5 text-slate-400 hover:text-slate-600 transition"
                            title={isPassVisible ? 'Sembunyikan Sandi' : 'Lihat Sandi'}
                          >
                            {isPassVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Contact & Email */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="flex items-center gap-1 text-[11px] text-slate-600">
                            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{user.email}</span>
                          </p>
                          {user.phone && (
                            <p className="flex items-center gap-1 text-[11px] text-slate-600">
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                              <span>{user.phone}</span>
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(user.id)}
                          className={`no-print inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                            user.statusAktif !== false
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Klik untuk ubah status aktif/nonaktif"
                        >
                          {user.statusAktif !== false ? (
                            <>
                              <UserCheck className="h-3 w-3 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 text-rose-600" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                        {/* Printable badge */}
                        <span className="hidden print:inline text-[11px] font-semibold">
                          {user.statusAktif !== false ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="no-print py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Impersonate / Login as */}
                          <button
                            id={`btn-impersonate-${user.id}`}
                            onClick={() => {
                              login(user);
                              showToast('info', 'Beralih Akun', `Beralih ke akun "${user.name}"`);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                            title="Masuk sebagai pengguna ini"
                          >
                            <span>Masuk</span>
                            <ArrowRight className="h-3 w-3 text-slate-400" />
                          </button>

                          {/* Reset Password */}
                          <button
                            id={`btn-reset-pass-${user.id}`}
                            onClick={() => {
                              setResetModalUser(user);
                              setNewPasswordInput(user.role === 'admin' ? 'admin123' : 'guru123');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-700 transition"
                            title="Reset Kata Sandi"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit User */}
                          <button
                            id={`btn-edit-user-${user.id}`}
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 transition"
                            title="Ubah Profil Akun"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            id={`btn-delete-user-${user.id}`}
                            onClick={() => {
                              if (isCurrent) {
                                showToast('warning', 'Aksi Tidak Diizinkan', 'Anda tidak dapat menghapus akun admin yang sedang Anda gunakan saat ini.');
                                return;
                              }
                              showFeedbackModal({
                                type: 'warning',
                                title: 'Hapus Akun Pengguna?',
                                message: `Akun login "${user.name}" (${user.username}) akan dihapus dari sistem sekolah.`,
                                confirmText: 'Ya, Hapus Akun',
                                cancelText: 'Batal',
                                onConfirm: () => {
                                  deleteUser(user.id);
                                  showToast('info', 'Akun Dihapus', `Akun "${user.name}" telah dihapus.`);
                                }
                              });
                            }}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg transition ${
                              isCurrent
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:bg-rose-50 hover:text-rose-700'
                            }`}
                            title={isCurrent ? 'Akun aktif saat ini' : 'Hapus Akun'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${formData.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {formData.role === 'admin' ? <Shield className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser ? 'Ubah Akun Pengguna' : 'Tambah Akun Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formData.role === 'admin' ? 'Akun Pengelola Administrator' : 'Akun Login Guru Pengampu'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="mt-4 space-y-4 text-xs">
              {/* Role selector if adding new */}
              {!editingUser && (
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin', password: 'admin123' })}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition ${
                      formData.role === 'admin'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Akun Administrator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'guru', password: 'guru123' })}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition ${
                      formData.role === 'guru'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>Akun Guru</span>
                  </button>
                </div>
              )}

              {/* If Role is Guru, allow selecting existing Guru from Master Data */}
              {formData.role === 'guru' && (
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Hubungkan dengan Profil Guru (Master Data)
                  </label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => {
                      const selected = gurus.find((g) => g.id === e.target.value);
                      if (selected) {
                        setFormData({
                          ...formData,
                          teacherId: selected.id,
                          name: `${selected.nama}, ${selected.gelar}`,
                          email: selected.email,
                          phone: selected.phone,
                          username: selected.nama.toLowerCase().replace(/[^a-z0-9]/g, '')
                        });
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="">-- Buat Profil Guru Bebas / Tidak Terhubung --</option>
                    {gurus.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nama}, {g.gelar} ({g.mapel}) - NIP: {g.nip}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* If Role is Admin, select Admin Type */}
              {formData.role === 'admin' && (
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">
                    Tipe / Jabatan Administrator
                  </label>
                  <select
                    value={formData.adminType}
                    onChange={(e) => setFormData({ ...formData, adminType: e.target.value as AdminType })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Super Admin">Super Admin (Akses Penuh)</option>
                    <option value="Admin Tata Usaha">Admin Tata Usaha (Kelola Data & Arsip)</option>
                    <option value="Admin Kurikulum">Admin Kurikulum (Jadwal & Kalender Akademik)</option>
                    <option value="Kepala Sekolah">Kepala Sekolah (Monitoring & Pengesahan)</option>
                    <option value="Operator Dapodik">Operator Dapodik / IT</option>
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block font-semibold text-slate-700">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Siti Rahmawati, S.Pd / Admin TU"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Username Login</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. sitirahma / admin_tu"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Kata Sandi</label>
                  <input
                    type="text"
                    placeholder={editingUser ? '(Biarkan jika tidak diubah)' : 'Kata sandi akun'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. guru@sekolah.sch.id"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-slate-700">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    placeholder="e.g. 0812-3456-7890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="checkbox-status-aktif"
                  checked={formData.statusAktif}
                  onChange={(e) => setFormData({ ...formData, statusAktif: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="checkbox-status-aktif" className="text-xs text-slate-700 font-medium">
                  Akun aktif dan diizinkan masuk ke sistem
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-save-user-modal"
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-sm transition ${
                    formData.role === 'admin'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {editingUser ? 'Simpan Perubahan' : 'Terbitkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-scale-up">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Kata Sandi</h3>
                <p className="text-xs text-slate-500">Akun: {resetModalUser.name}</p>
              </div>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold text-slate-700">
                  Kata Sandi Baru
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan kata sandi baru"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs text-slate-800 font-mono focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Pastikan untuk menyampaikan kata sandi ini kepada pemilik akun bersangkutan.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-confirm-reset-pass"
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition shadow-xs"
                >
                  Perbarui Kata Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
