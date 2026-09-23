import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  UserAccount,
  SchoolSettings,
  Guru,
  Siswa,
  JadwalMengajar,
  JurnalMengajar,
  SesiAbsensi,
  NilaiSiswaItem,
  ProtaItem,
  PromesItem,
  ModulAjar,
  LKPDItem,
  UserRole,
  MataPelajaran
} from '../types';
import {
  initialSchoolSettings,
  initialUsers,
  initialGurus,
  initialMapels,
  defaultCurriculumMapels,
  initialSiswas,
  initialJadwals,
  initialJurnals,
  initialAbsensis,
  initialNilais,
  initialProtas,
  initialPromes,
  initialModulAjars,
  initialLKPDs
} from '../data/initialData';

interface AppContextType {
  currentUser: UserAccount | null;
  currentTeacher: Guru | null;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  login: (user: UserAccount) => void;
  logout: () => void;
  switchTeacher: (guruId: string) => void;
  switchToAdmin: () => void;
  switchToGuru: (guruId?: string) => void;

  // Manajemen Akun Pengguna (Admin & Guru)
  users: UserAccount[];
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (id: string, updates: Partial<UserAccount>) => void;
  deleteUser: (id: string) => void;
  resetPasswordUser: (id: string, newPassword?: string) => void;
  toggleUserStatus: (id: string) => void;
  syncTeacherAccounts: () => { createdCount: number };

  // School Settings
  schoolSettings: SchoolSettings;
  updateSchoolSettings: (settings: Partial<SchoolSettings>) => void;

  // Mata Pelajaran
  mapels: MataPelajaran[];
  addMapel: (mapel: Omit<MataPelajaran, 'id'>) => void;
  addMapelBatch: (mapelList: Omit<MataPelajaran, 'id'>[], replaceExisting?: boolean) => void;
  updateMapel: (id: string, mapel: Partial<MataPelajaran>) => void;
  deleteMapel: (id: string) => void;
  resetMapelToDefault: () => void;

  // Guru
  gurus: Guru[];
  addGuru: (guru: Omit<Guru, 'id'>) => void;
  addGuruBatch: (guruList: Omit<Guru, 'id'>[], replaceExisting?: boolean) => void;
  updateGuru: (id: string, guru: Partial<Guru>) => void;
  deleteGuru: (id: string) => void;

  // Siswa
  siswas: Siswa[];
  addSiswa: (siswa: Omit<Siswa, 'id'>) => void;
  addSiswaBatch: (siswaList: Omit<Siswa, 'id'>[], replaceForClass?: string) => void;
  updateSiswa: (id: string, siswa: Partial<Siswa>) => void;
  deleteSiswa: (id: string) => void;

  // Jadwal
  jadwals: JadwalMengajar[];
  addJadwal: (jadwal: Omit<JadwalMengajar, 'id'>) => void;
  updateJadwal: (id: string, jadwal: Partial<JadwalMengajar>) => void;
  deleteJadwal: (id: string) => void;

  // Jurnal Mengajar
  jurnals: JurnalMengajar[];
  addJurnal: (jurnal: Omit<JurnalMengajar, 'id'>) => void;
  updateJurnal: (id: string, jurnal: Partial<JurnalMengajar>) => void;
  deleteJurnal: (id: string) => void;

  // Absensi
  absensis: SesiAbsensi[];
  saveAbsensi: (sesi: Omit<SesiAbsensi, 'id'>, existingId?: string) => void;
  deleteAbsensi: (id: string) => void;

  // Nilai
  nilais: NilaiSiswaItem[];
  saveNilaiBatch: (items: NilaiSiswaItem[]) => void;
  updateNilai: (id: string, updates: Partial<NilaiSiswaItem>) => void;

  // Prota
  protas: ProtaItem[];
  addProta: (item: Omit<ProtaItem, 'id'>) => void;
  addProtaBatch: (items: Omit<ProtaItem, 'id'>[], replaceExisting?: boolean) => void;
  updateProta: (id: string, item: Partial<ProtaItem>) => void;
  deleteProta: (id: string) => void;

  // Promes
  promesList: PromesItem[];
  addPromes: (item: Omit<PromesItem, 'id'>) => void;
  addPromesBatch: (items: Omit<PromesItem, 'id'>[], replaceExisting?: boolean) => void;
  updatePromes: (id: string, item: Partial<PromesItem>) => void;
  deletePromes: (id: string) => void;

  // Modul Ajar
  modulAjars: ModulAjar[];
  addModulAjar: (item: Omit<ModulAjar, 'id'>) => void;
  updateModulAjar: (id: string, item: Partial<ModulAjar>) => void;
  deleteModulAjar: (id: string) => void;

  // LKPD
  lkpds: LKPDItem[];
  addLKPD: (item: Omit<LKPDItem, 'id'>) => void;
  updateLKPD: (id: string, item: Partial<LKPDItem>) => void;
  deleteLKPD: (id: string) => void;

  // System Utility
  resetAllData: () => void;

  // Animated Feedback & Toast System
  toasts: Array<{ id: string; type: 'success' | 'error' | 'warning' | 'loading' | 'info'; title: string; message?: string; duration?: number }>;
  showToast: (type: 'success' | 'error' | 'warning' | 'loading' | 'info', title: string, message?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  feedbackModal: {
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'loading' | 'info';
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null;
  showFeedbackModal: (modal: {
    type: 'success' | 'error' | 'warning' | 'loading' | 'info';
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => void;
  closeFeedbackModal: () => void;
  isTesterOpen: boolean;
  setIsTesterOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CURRENT_DATA_VERSION = 'BAG_v3_login_active';
try {
  if (typeof window !== 'undefined' && !localStorage.getItem(CURRENT_DATA_VERSION)) {
    // Clear saved session so user arrives at login screen with admin/admin123
    localStorage.removeItem('BAG_currentUser');
    localStorage.setItem(CURRENT_DATA_VERSION, 'true');
  }
} catch (e) {
  console.warn('Storage init error:', e);
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(`BAG_${key}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error(`Error loading BAG_${key}:`, err);
  }
  return fallback;
}

function saveToStorage<T>(key: string, data: T) {
  try {
    localStorage.setItem(`BAG_${key}`, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving BAG_${key}:`, err);
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state: null means not logged in, requiring username & password login
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return loadFromStorage<UserAccount | null>('currentUser', null);
  });

  const [activeMenu, setActiveMenu] = useState<string>(() => {
    return currentUser?.role === 'admin' ? 'admin-dashboard' : 'guru-dashboard';
  });

  // Main data states
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(() =>
    loadFromStorage('schoolSettings', initialSchoolSettings)
  );
  const [users, setUsers] = useState<UserAccount[]>(() => loadFromStorage('users', initialUsers));
  const [mapels, setMapels] = useState<MataPelajaran[]>(() => loadFromStorage('mapels', initialMapels));
  const [gurus, setGurus] = useState<Guru[]>(() => loadFromStorage('gurus', initialGurus));
  const [siswas, setSiswas] = useState<Siswa[]>(() => loadFromStorage('siswas', initialSiswas));
  const [jadwals, setJadwals] = useState<JadwalMengajar[]>(() => loadFromStorage('jadwals', initialJadwals));
  const [jurnals, setJurnals] = useState<JurnalMengajar[]>(() => loadFromStorage('jurnals', initialJurnals));
  const [absensis, setAbsensis] = useState<SesiAbsensi[]>(() => loadFromStorage('absensis', initialAbsensis));
  const [nilais, setNilais] = useState<NilaiSiswaItem[]>(() => loadFromStorage('nilais', initialNilais));
  const [protas, setProtas] = useState<ProtaItem[]>(() => loadFromStorage('protas', initialProtas));
  const [promesList, setPromesList] = useState<PromesItem[]>(() => loadFromStorage('promesList', initialPromes));
  const [modulAjars, setModulAjars] = useState<ModulAjar[]>(() => loadFromStorage('modulAjars', initialModulAjars));
  const [lkpds, setLkpds] = useState<LKPDItem[]>(() => loadFromStorage('lkpds', initialLKPDs));

  // Animated Feedback & Toast states
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'warning' | 'loading' | 'info'; title: string; message?: string; duration?: number }>>([]);
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'loading' | 'info';
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  } | null>(null);
  const [isTesterOpen, setIsTesterOpen] = useState(false);

  const showToast = (type: 'success' | 'error' | 'warning' | 'loading' | 'info', title: string, message?: string, duration = 3800) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showFeedbackModal = (config: {
    type: 'success' | 'error' | 'warning' | 'loading' | 'info';
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }) => {
    setFeedbackModal({
      isOpen: true,
      ...config
    });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal(null);
  };

  // Sync to local storage on changes
  useEffect(() => saveToStorage('currentUser', currentUser), [currentUser]);
  useEffect(() => saveToStorage('users', users), [users]);
  useEffect(() => saveToStorage('schoolSettings', schoolSettings), [schoolSettings]);
  useEffect(() => saveToStorage('mapels', mapels), [mapels]);
  useEffect(() => saveToStorage('gurus', gurus), [gurus]);
  useEffect(() => saveToStorage('siswas', siswas), [siswas]);
  useEffect(() => saveToStorage('jadwals', jadwals), [jadwals]);
  useEffect(() => saveToStorage('jurnals', jurnals), [jurnals]);
  useEffect(() => saveToStorage('absensis', absensis), [absensis]);
  useEffect(() => saveToStorage('nilais', nilais), [nilais]);
  useEffect(() => saveToStorage('protas', protas), [protas]);
  useEffect(() => saveToStorage('promesList', promesList), [promesList]);
  useEffect(() => saveToStorage('modulAjars', modulAjars), [modulAjars]);
  useEffect(() => saveToStorage('lkpds', lkpds), [lkpds]);

  // Isolate currentTeacher strictly per logged-in user when in Guru mode
  const currentTeacher = useMemo(() => {
    if (currentUser?.role === 'guru') {
      if (currentUser.teacherId) {
        const found = gurus.find((g) => g.id === currentUser.teacherId);
        if (found) return found;
      }
      // Fallback matching by email or name
      const foundByEmail = gurus.find(
        (g) => g.email && currentUser.email && g.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (foundByEmail) return foundByEmail;

      const foundByName = gurus.find(
        (g) => g.nama && currentUser.name && g.nama.toLowerCase() === currentUser.name.toLowerCase()
      );
      if (foundByName) return foundByName;

      return gurus[0] || null;
    }

    // When Admin is inspecting or previewing Guru mode
    if (currentUser?.teacherId) {
      return gurus.find((g) => g.id === currentUser.teacherId) || gurus[0] || null;
    }
    return gurus[0] || null;
  }, [currentUser, gurus]);

  const login = (user: UserAccount) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setActiveMenu('admin-dashboard');
    } else {
      setActiveMenu('guru-dashboard');
    }
  };

  const logout = () => {
    setCurrentUser(null);
  };

  // Only allow switching teacher view if current user is an Admin (for inspection purposes)
  const switchTeacher = (guruId: string) => {
    const targetGuru = gurus.find((g) => g.id === guruId);
    if (!targetGuru) return;

    if (currentUser?.role === 'admin') {
      // Admin inspects a specific teacher's panel
      const updatedUser: UserAccount = {
        ...currentUser,
        teacherId: targetGuru.id
      };
      setCurrentUser(updatedUser);
    }
  };

  const switchToAdmin = () => {
    const adminUser = users.find((u) => u.role === 'admin' && u.statusAktif !== false) || initialUsers[0];
    setCurrentUser(adminUser);
    setActiveMenu('admin-dashboard');
  };

  const switchToGuru = (guruId?: string) => {
    const targetGuru = guruId ? gurus.find((g) => g.id === guruId) || gurus[0] : gurus[0];
    if (!targetGuru) {
      alert('Belum ada data guru terdaftar. Silakan tambahkan data guru terlebih dahulu di menu Master Data Guru.');
      return;
    }
    const existingGuruUser = users.find((u) => u.teacherId === targetGuru.id);
    const guruUser: UserAccount = existingGuruUser || {
      id: `usr-${targetGuru.id}`,
      username: targetGuru.nama.toLowerCase().replace(/[^a-z0-9]/g, '') || 'guru',
      name: `${targetGuru.nama}${targetGuru.gelar ? `, ${targetGuru.gelar}` : ''}`,
      role: 'guru',
      email: targetGuru.email,
      phone: targetGuru.phone,
      teacherId: targetGuru.id,
      statusAktif: true
    };
    setCurrentUser(guruUser);
    setActiveMenu('guru-dashboard');
  };

  // User Accounts Handlers (Kelola Akun Admin & Guru)
  const addUser = (userData: Omit<UserAccount, 'id'>) => {
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      statusAktif: userData.statusAktif ?? true,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: '-'
    };
    setUsers((prev) => [newUser, ...prev]);
  };

  const updateUser = (id: string, updates: Partial<UserAccount>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    if (currentUser?.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const resetPasswordUser = (id: string, newPassword = 'password123') => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, password: newPassword } : u))
    );
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, statusAktif: !u.statusAktif } : u))
    );
  };

  const syncTeacherAccounts = () => {
    let createdCount = 0;
    setUsers((prev) => {
      const existingTeacherIds = new Set(prev.filter((u) => u.teacherId).map((u) => u.teacherId));
      const newAccounts: UserAccount[] = [];

      gurus.forEach((guru) => {
        if (!existingTeacherIds.has(guru.id)) {
          const cleanUsername = guru.nama
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 14);
          newAccounts.push({
            id: `usr-${guru.id}-${Date.now()}`,
            username: cleanUsername || `guru${guru.id.replace('guru-', '')}`,
            name: `${guru.nama}, ${guru.gelar}`,
            role: 'guru',
            teacherId: guru.id,
            email: guru.email,
            phone: guru.phone,
            password: 'guru123',
            statusAktif: guru.statusAktif,
            createdAt: new Date().toISOString().split('T')[0],
            lastLogin: '-'
          });
          createdCount++;
        }
      });

      return [...prev, ...newAccounts];
    });
    return { createdCount };
  };

  const updateSchoolSettings = (settings: Partial<SchoolSettings>) => {
    setSchoolSettings((prev) => ({ ...prev, ...settings }));
  };

  // Mata Pelajaran Handlers
  const addMapel = (mapelData: Omit<MataPelajaran, 'id'>) => {
    const newMapel: MataPelajaran = {
      ...mapelData,
      id: `mp-${Date.now()}`
    };
    setMapels((prev) => [...prev, newMapel]);
  };

  const addMapelBatch = (mapelList: Omit<MataPelajaran, 'id'>[], replaceExisting: boolean = false) => {
    const newItems: MataPelajaran[] = mapelList.map((m, idx) => ({
      ...m,
      id: `mp-${Date.now()}-${idx}`
    }));
    if (replaceExisting) {
      setMapels(newItems);
    } else {
      setMapels((prev) => {
        const existingCodes = new Set(prev.map((m) => m.kode.toUpperCase()));
        const nonDup = newItems.filter((m) => !existingCodes.has(m.kode.toUpperCase()));
        return [...prev, ...nonDup];
      });
    }
  };

  const updateMapel = (id: string, updates: Partial<MataPelajaran>) => {
    setMapels((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteMapel = (id: string) => {
    setMapels((prev) => prev.filter((m) => m.id !== id));
  };

  const resetMapelToDefault = () => {
    setMapels(defaultCurriculumMapels);
  };

  // Guru handlers
  const addGuru = (guruData: Omit<Guru, 'id'>) => {
    const newGuru: Guru = {
      ...guruData,
      id: `guru-${Date.now()}`
    };
    setGurus((prev) => [newGuru, ...prev]);
  };

  const addGuruBatch = (guruList: Omit<Guru, 'id'>[], replaceExisting: boolean = false) => {
    const newItems: Guru[] = guruList.map((g, idx) => ({
      ...g,
      id: `guru-${Date.now()}-${idx}`
    }));
    if (replaceExisting) {
      setGurus(newItems);
    } else {
      setGurus((prev) => {
        const existingNIPs = new Set(prev.map((g) => g.nip).filter(Boolean));
        const nonDuplicates = newItems.filter((g) => !g.nip || !existingNIPs.has(g.nip));
        return [...prev, ...nonDuplicates];
      });
    }
  };

  const updateGuru = (id: string, updates: Partial<Guru>) => {
    setGurus((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const deleteGuru = (id: string) => {
    setGurus((prev) => prev.filter((g) => g.id !== id));
  };

  // Siswa handlers
  const addSiswa = (siswaData: Omit<Siswa, 'id'>) => {
    const newSiswa: Siswa = {
      ...siswaData,
      id: `sis-${Date.now()}`
    };
    setSiswas((prev) => [...prev, newSiswa]);
  };

  const addSiswaBatch = (siswaList: Omit<Siswa, 'id'>[], replaceForClass?: string) => {
    const newItems: Siswa[] = siswaList.map((s, idx) => ({
      ...s,
      id: `sis-${Date.now()}-${idx}`
    }));
    if (replaceForClass) {
      setSiswas((prev) => [...prev.filter((s) => s.kelas !== replaceForClass), ...newItems]);
    } else {
      setSiswas((prev) => {
        const existingNISNs = new Set(prev.map((s) => s.nisn).filter(Boolean));
        const nonDuplicates = newItems.filter((s) => !s.nisn || !existingNISNs.has(s.nisn));
        return [...prev, ...nonDuplicates];
      });
    }
  };

  const updateSiswa = (id: string, updates: Partial<Siswa>) => {
    setSiswas((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSiswa = (id: string) => {
    setSiswas((prev) => prev.filter((s) => s.id !== id));
  };

  // Jadwal handlers
  const addJadwal = (jadwalData: Omit<JadwalMengajar, 'id'>) => {
    const newJadwal: JadwalMengajar = {
      ...jadwalData,
      id: `jdw-${Date.now()}`
    };
    setJadwals((prev) => [...prev, newJadwal]);
  };

  const updateJadwal = (id: string, updates: Partial<JadwalMengajar>) => {
    setJadwals((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
  };

  const deleteJadwal = (id: string) => {
    setJadwals((prev) => prev.filter((j) => j.id !== id));
  };

  // Jurnal handlers
  const addJurnal = (jurnalData: Omit<JurnalMengajar, 'id'>) => {
    const newJurnal: JurnalMengajar = {
      ...jurnalData,
      id: `jrn-${Date.now()}`
    };
    setJurnals((prev) => [newJurnal, ...prev]);
  };

  const updateJurnal = (id: string, updates: Partial<JurnalMengajar>) => {
    setJurnals((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
  };

  const deleteJurnal = (id: string) => {
    setJurnals((prev) => prev.filter((j) => j.id !== id));
  };

  // Absensi handlers
  const saveAbsensi = (sesiData: Omit<SesiAbsensi, 'id'>, existingId?: string) => {
    if (existingId) {
      setAbsensis((prev) =>
        prev.map((a) => (a.id === existingId ? { ...a, ...sesiData } : a))
      );
    } else {
      const newAbsensi: SesiAbsensi = {
        ...sesiData,
        id: `abs-${Date.now()}`
      };
      setAbsensis((prev) => [newAbsensi, ...prev]);
    }
  };

  const deleteAbsensi = (id: string) => {
    setAbsensis((prev) => prev.filter((a) => a.id !== id));
  };

  // Nilai handlers
  const saveNilaiBatch = (items: NilaiSiswaItem[]) => {
    setNilais((prev) => {
      const copy = [...prev];
      items.forEach((item) => {
        const idx = copy.findIndex((n) => n.siswaId === item.siswaId && n.mapel === item.mapel && n.semester === item.semester);
        if (idx >= 0) {
          copy[idx] = item;
        } else {
          copy.push(item);
        }
      });
      return copy;
    });
  };

  const updateNilai = (id: string, updates: Partial<NilaiSiswaItem>) => {
    setNilais((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  // Prota handlers
  const addProta = (item: Omit<ProtaItem, 'id'>) => {
    const newItem: ProtaItem = { ...item, id: `prt-${Date.now()}` };
    setProtas((prev) => [...prev, newItem]);
  };

  const addProtaBatch = (items: Omit<ProtaItem, 'id'>[], replaceExisting = false) => {
    setProtas((prev) => {
      let filtered = prev;
      if (replaceExisting && items.length > 0) {
        const { guruId, kelas } = items[0];
        filtered = prev.filter((p) => !(p.guruId === guruId && p.kelas === kelas));
      }
      const newItems: ProtaItem[] = items.map((it, idx) => ({
        ...it,
        id: `prt-${Date.now()}-${idx}`
      }));
      return [...filtered, ...newItems];
    });
  };

  const updateProta = (id: string, updates: Partial<ProtaItem>) => {
    setProtas((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deleteProta = (id: string) => {
    setProtas((prev) => prev.filter((p) => p.id !== id));
  };

  // Promes handlers
  const addPromes = (item: Omit<PromesItem, 'id'>) => {
    const newItem: PromesItem = { ...item, id: `prm-${Date.now()}` };
    setPromesList((prev) => [...prev, newItem]);
  };

  const addPromesBatch = (items: Omit<PromesItem, 'id'>[], replaceExisting = false) => {
    setPromesList((prev) => {
      let filtered = prev;
      if (replaceExisting && items.length > 0) {
        const { guruId, kelas, semester } = items[0];
        filtered = prev.filter((p) => !(p.guruId === guruId && p.kelas === kelas && p.semester === semester));
      }
      const newItems: PromesItem[] = items.map((it, idx) => ({
        ...it,
        id: `prm-${Date.now()}-${idx}`
      }));
      return [...filtered, ...newItems];
    });
  };

  const updatePromes = (id: string, updates: Partial<PromesItem>) => {
    setPromesList((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePromes = (id: string) => {
    setPromesList((prev) => prev.filter((p) => p.id !== id));
  };

  // Modul Ajar handlers
  const addModulAjar = (item: Omit<ModulAjar, 'id'>) => {
    const newItem: ModulAjar = { ...item, id: `mod-${Date.now()}` };
    setModulAjars((prev) => [newItem, ...prev]);
  };

  const updateModulAjar = (id: string, updates: Partial<ModulAjar>) => {
    setModulAjars((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteModulAjar = (id: string) => {
    setModulAjars((prev) => prev.filter((m) => m.id !== id));
  };

  // LKPD handlers
  const addLKPD = (item: Omit<LKPDItem, 'id'>) => {
    const newItem: LKPDItem = { ...item, id: `lkpd-${Date.now()}` };
    setLkpds((prev) => [newItem, ...prev]);
  };

  const updateLKPD = (id: string, updates: Partial<LKPDItem>) => {
    setLkpds((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const deleteLKPD = (id: string) => {
    setLkpds((prev) => prev.filter((l) => l.id !== id));
  };

  // Reset to initial clean data
  const resetAllData = () => {
    localStorage.clear();
    localStorage.setItem(CURRENT_DATA_VERSION, 'true');
    setSchoolSettings(initialSchoolSettings);
    setUsers(initialUsers);
    setMapels(initialMapels);
    setGurus(initialGurus);
    setSiswas(initialSiswas);
    setJadwals(initialJadwals);
    setJurnals(initialJurnals);
    setAbsensis(initialAbsensis);
    setNilais(initialNilais);
    setProtas(initialProtas);
    setPromesList(initialPromes);
    setModulAjars(initialModulAjars);
    setLkpds(initialLKPDs);
    setCurrentUser(initialUsers[0]);
    setActiveMenu('admin-dashboard');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentTeacher,
        activeMenu,
        setActiveMenu,
        login,
        logout,
        switchTeacher,
        switchToAdmin,
        switchToGuru,
        users,
        addUser,
        updateUser,
        deleteUser,
        resetPasswordUser,
        toggleUserStatus,
        syncTeacherAccounts,
        schoolSettings,
        updateSchoolSettings,
        mapels,
        addMapel,
        addMapelBatch,
        updateMapel,
        deleteMapel,
        resetMapelToDefault,
        gurus,
        addGuru,
        addGuruBatch,
        updateGuru,
        deleteGuru,
        siswas,
        addSiswa,
        addSiswaBatch,
        updateSiswa,
        deleteSiswa,
        jadwals,
        addJadwal,
        updateJadwal,
        deleteJadwal,
        jurnals,
        addJurnal,
        updateJurnal,
        deleteJurnal,
        absensis,
        saveAbsensi,
        deleteAbsensi,
        nilais,
        saveNilaiBatch,
        updateNilai,
        protas,
        addProta,
        addProtaBatch,
        updateProta,
        deleteProta,
        promesList,
        addPromes,
        addPromesBatch,
        updatePromes,
        deletePromes,
        modulAjars,
        addModulAjar,
        updateModulAjar,
        deleteModulAjar,
        lkpds,
        addLKPD,
        updateLKPD,
        deleteLKPD,
        resetAllData,
        toasts,
        showToast,
        dismissToast,
        feedbackModal,
        showFeedbackModal,
        closeFeedbackModal,
        isTesterOpen,
        setIsTesterOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
