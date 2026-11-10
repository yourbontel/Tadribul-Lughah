import React, { useState, useEffect } from 'react';
import {
  ProgramTrack,
  ClassSchedule,
  RegistrationRecord,
  formatIDR
} from '../data/arabicAcademyData';
import { User, SUPERADMIN_EMAIL } from '../firebase';
import {
  CpanelDbConfig,
  generateCpanelSqlDump,
  generateCpanelPhpApi
} from '../utils/cpanelSqlGenerator';
import {
  buildCpanelReadyZipBlob,
  generateStandaloneLoginHtml,
  generateStandaloneStudentPortalHtml,
  generateStandaloneSuperAdminHtml
} from '../utils/cpanelZipBuilder';
import {
  ShieldCheck,
  LogIn,
  LogOut,
  Save,
  RotateCcw,
  Trash2,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  Users,
  Database,
  Download,
  Copy,
  FileCode,
  FolderArchive,
  Search,
  Filter,
  Eye,
  Phone,
  Mail,
  FileSpreadsheet,
  Check,
  X,
  ExternalLink,
  Lock,
  Video,
  Youtube,
  PlayCircle
} from 'lucide-react';
import {
  WeeklyPekanData,
  getWeeklyPekanContent,
  saveCustomMateriOverride,
  resetCustomMateriOverride,
  extractYouTubeId
} from '../data/moduleContentData';

interface SuperAdminPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateHome?: () => void;
  currentUser: User | null;
  isSuperAdmin: boolean;
  authLoading: boolean;
  onLoginGoogle: () => Promise<void>;
  onLogout: () => Promise<void>;
  programs: ProgramTrack[];
  schedules: ClassSchedule[];
  registrations: RegistrationRecord[];
  onSaveProgram: (program: ProgramTrack) => Promise<void>;
  onSaveSchedule: (schedule: ClassSchedule) => Promise<void>;
  onDeleteSchedule: (scheduleId: string) => Promise<void>;
  onSaveRegistration: (record: RegistrationRecord) => Promise<void>;
  onDeleteRegistration: (registrationNumber: string) => Promise<void>;
  onSeedDefaults: () => Promise<void>;
  cpanelConfig: CpanelDbConfig;
  onSaveCpanelConfig: (config: CpanelDbConfig) => void;
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  isOpen = true,
  onClose,
  onNavigateHome,
  currentUser,
  isSuperAdmin,
  authLoading,
  onLoginGoogle,
  onLogout,
  programs,
  schedules,
  registrations,
  onSaveProgram,
  onSaveSchedule,
  onDeleteSchedule,
  onSaveRegistration,
  onDeleteRegistration,
  onSeedDefaults,
  cpanelConfig,
  onSaveCpanelConfig
}) => {
  const [activeTab, setActiveTab] = useState<
    'programs' | 'schedules' | 'registrations' | 'materi' | 'cpanel-sql'
  >(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p === 'materi') return 'materi';
      if (p === 'schedules') return 'schedules';
      if (p === 'registrations') return 'registrations';
      if (p === 'cpanel-sql') return 'cpanel-sql';
    } catch {
      // Ignored
    }
    return 'programs';
  });

  const [selectedMateriProgramId, setSelectedMateriProgramId] = useState<string>(() => {
    try {
      return new URLSearchParams(window.location.search).get('program') || programs[0]?.id || 'tl-level-1';
    } catch {
      return programs[0]?.id || 'tl-level-1';
    }
  });

  const [selectedMateriPekan, setSelectedMateriPekan] = useState<number>(() => {
    try {
      const p = parseInt(new URLSearchParams(window.location.search).get('pekan') || '1', 10);
      return isNaN(p) || p < 1 || p > 12 ? 1 : p;
    } catch {
      return 1;
    }
  });

  const [editingMateri, setEditingMateri] = useState<WeeklyPekanData>(() =>
    getWeeklyPekanContent('tl-level-1', 1)
  );

  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    programs[0]?.id || 'tl-level-1'
  );
  const [editingProgram, setEditingProgram] = useState<ProgramTrack | null>(
    null
  );

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(
    schedules[0]?.id || 'sch-lv1-malam'
  );
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(
    null
  );

  const [selectedRegNo, setSelectedRegNo] = useState<string>(
    registrations[0]?.registrationNumber || ''
  );
  const [editingRegistration, setEditingRegistration] =
    useState<RegistrationRecord | null>(null);

  // Participant list filtering & modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [localCpanelConfig, setLocalCpanelConfig] =
    useState<CpanelDbConfig>(cpanelConfig);
  const [sqlPreviewMode, setSqlPreviewMode] = useState<
    'sql' | 'php' | 'login-html' | 'pelajar-html' | 'superadmin-html'
  >('sql');

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalCpanelConfig(cpanelConfig);
  }, [cpanelConfig]);

  // Sync selected program editor
  useEffect(() => {
    const found =
      programs.find((p) => p.id === selectedProgramId) || programs[0] || null;
    if (found) {
      setEditingProgram({ ...found });
      setSelectedProgramId(found.id);
    }
  }, [selectedProgramId, programs]);

  // Sync selected schedule editor
  useEffect(() => {
    const found =
      schedules.find((s) => s.id === selectedScheduleId) ||
      schedules[0] ||
      null;
    if (found) {
      setEditingSchedule({ ...found });
      setSelectedScheduleId(found.id);
    }
  }, [selectedScheduleId, schedules]);

  // Sync selected registration editor
  useEffect(() => {
    const found =
      registrations.find((r) => r.registrationNumber === selectedRegNo) ||
      registrations[0] ||
      null;
    if (found) {
      setEditingRegistration({ ...found });
      setSelectedRegNo(found.registrationNumber);
    } else {
      setEditingRegistration(null);
    }
  }, [selectedRegNo, registrations]);

  // Sync selected materi editor
  useEffect(() => {
    setEditingMateri(getWeeklyPekanContent(selectedMateriProgramId, selectedMateriPekan));
  }, [selectedMateriProgramId, selectedMateriPekan]);

  const handleSaveMateri = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      saveCustomMateriOverride(selectedMateriProgramId, selectedMateriPekan, editingMateri);
      showToast(
        'success',
        `Materi & Video YouTube untuk Level ${selectedMateriProgramId} Pekan ${selectedMateriPekan} berhasil disimpan! Halaman materi.html langsung terupdate.`
      );
    } catch (err) {
      showToast('error', `Gagal menyimpan materi: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetMateri = () => {
    if (window.confirm(`Kembalikan materi dan video Pekan ${selectedMateriPekan} ke kurikulum bawaan standar?`)) {
      resetCustomMateriOverride(selectedMateriProgramId, selectedMateriPekan);
      setEditingMateri(getWeeklyPekanContent(selectedMateriProgramId, selectedMateriPekan));
      showToast('success', `Materi Pekan ${selectedMateriPekan} berhasil dikembalikan ke standar awal.`);
    }
  };

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const liveSqlDump = generateCpanelSqlDump(programs, schedules, registrations);
  const livePhpBridge = generateCpanelPhpApi(localCpanelConfig);
  const liveLoginHtml = generateStandaloneLoginHtml();
  const liveStudentHtml = generateStandaloneStudentPortalHtml(
    programs,
    schedules,
    registrations
  );
  const liveSuperAdminHtml = generateStandaloneSuperAdminHtml(
    programs,
    schedules,
    registrations
  );

  const handleDownloadFullZip = () => {
    const zipBlob = buildCpanelReadyZipBlob(
      programs,
      schedules,
      registrations,
      localCpanelConfig
    );
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tadribul_lughah_cpanel_siap_upload.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(
      'success',
      'Paket tadribul_lughah_cpanel_siap_upload.zip berhasil diunduh! Berisi index.html, login.html, pelajar.html, superadmin.html, api.php, database_cpanel_mysql.sql, dan .htaccess.'
    );
  };

  const handleDownloadLoginHtmlFile = () => {
    const blob = new Blob([liveLoginHtml], {
      type: 'text/html;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'login.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(
      'success',
      'File terpisah login.html berhasil diunduh! Unggah ke folder public_html/login.html di cPanel Anda.'
    );
  };

  const handleDownloadStudentHtmlFile = () => {
    const blob = new Blob([liveStudentHtml], {
      type: 'text/html;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pelajar.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(
      'success',
      'File terpisah pelajar.html berhasil diunduh! Unggah ke folder public_html/pelajar.html di cPanel Anda.'
    );
  };

  const handleDownloadSuperAdminHtmlFile = () => {
    const blob = new Blob([liveSuperAdminHtml], {
      type: 'text/html;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'superadmin.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(
      'success',
      'File terpisah superadmin.html berhasil diunduh! Unggah ke folder public_html/superadmin.html di cPanel Anda.'
    );
  };

  const handleDownloadSqlFile = () => {
    const blob = new Blob([liveSqlDump], { type: 'application/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tadribul_lughah_cpanel.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(
      'success',
      'File tadribul_lughah_cpanel.sql berhasil diunduh. Silakan import melalui phpMyAdmin di cPanel Anda.'
    );
  };

  const handleDownloadPhpFile = () => {
    const blob = new Blob([livePhpBridge], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api.php';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(
      'success',
      'File api.php berhasil diunduh. Unggah ke folder public_html/api.php di File Manager cPanel Anda.'
    );
  };

  const handleCopyCode = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', `${label} berhasil disalin ke clipboard.`);
    } catch {
      showToast('error', 'Gagal menyalin ke clipboard.');
    }
  };

  const handleSaveCpanelSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveCpanelConfig(localCpanelConfig);
    showToast(
      'success',
      'Konfigurasi Database MySQL cPanel & Endpoint API berhasil disimpan.'
    );
  };

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await onSaveProgram(editingProgram);
      showToast(
        'success',
        `Perubahan pada ${editingProgram.code} (${editingProgram.angkatan || 'Angkatan 1'} — ${editingProgram.title}) berhasil disimpan dan file SQL cPanel otomatis diperbarui.`
      );
    } catch (err) {
      showToast(
        'error',
        `Gagal menyimpan kurikulum: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleProgramRegistration = async (prog: ProgramTrack) => {
    const nextOpenState = prog.registrationOpen === false ? true : false;
    const updatedProg: ProgramTrack = {
      ...prog,
      registrationOpen: nextOpenState
    };
    setIsSaving(true);
    setStatusMessage(null);
    try {
      if (editingProgram && editingProgram.id === prog.id) {
        setEditingProgram(updatedProg);
      }
      await onSaveProgram(updatedProg);
      showToast(
        'success',
        `Status pendaftaran Level ${prog.levelNumber} (${prog.code}) berhasil diubah menjadi ${
          nextOpenState ? 'ON (Pendaftaran Dibuka)' : 'OFF (Pendaftaran Ditutup)'
        }.`
      );
    } catch (err) {
      showToast(
        'error',
        `Gagal mengubah status pendaftaran: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await onSaveSchedule(editingSchedule);
      showToast(
        'success',
        `Jadwal kelas ${editingSchedule.batchCode} berhasil diperbarui dan disinkronkan ke skrip SQL cPanel.`
      );
    } catch (err) {
      showToast(
        'error',
        `Gagal menyimpan jadwal: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewSchedule = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const defaultProg = programs[0];
    const newSch: ClassSchedule = {
      id: `sch-custom-${randomSuffix}`,
      batchCode: `TL-LV1-B${randomSuffix}`,
      programId: defaultProg?.id || 'tl-level-1',
      levelNumber: defaultProg?.levelNumber || 1,
      programName: defaultProg?.title || 'Tadribul Lughah Level 1',
      levelName: `Level ${defaultProg?.levelNumber || 1}`,
      modeLabel: 'Online Live Interaktif (Zoom)',
      days: defaultProg?.scheduleDays || 'Kamis & Jumat',
      timeWIB: '20.00 – 22.00 WIB',
      startDate: 'Segera Dimulai',
      instructor: 'Ust. Ahmad Fauzan, Lc., M.A.',
      capacity: 25,
      enrolled: 0,
      feeIDR: defaultProg?.tuitionIDR || 510000
    };
    setEditingSchedule(newSch);
  };

  const handleDeleteCurrentSchedule = async () => {
    if (!editingSchedule) return;
    if (schedules.length <= 1) {
      showToast('error', 'Minimal harus ada 1 jadwal kelas aktif.');
      return;
    }
    setIsSaving(true);
    try {
      await onDeleteSchedule(editingSchedule.id);
      showToast(
        'success',
        `Jadwal ${editingSchedule.batchCode} berhasil dihapus.`
      );
    } catch (err) {
      showToast(
        'error',
        `Gagal menghapus jadwal: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegistration) return;

    // Strict Superadmin authorization check for modifying registration status
    const existingRec = registrations.find(
      (r) => r.registrationNumber === editingRegistration.registrationNumber
    );
    if (
      existingRec &&
      existingRec.status !== editingRegistration.status &&
      !isSuperAdmin
    ) {
      showToast(
        'error',
        'Akses ditolak: Hanya Superadmin (mazharhajid@gmail.com) yang berwenang mengubah status verifikasi pendaftaran.'
      );
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);
    try {
      await onSaveRegistration(editingRegistration);
      showToast(
        'success',
        `Data pendaftar ${editingRegistration.registrationNumber} (${editingRegistration.fullName}) berhasil diperbarui.`
      );
    } catch (err) {
      showToast(
        'error',
        `Gagal memperbarui pendaftar: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCurrentRegistration = async () => {
    if (!editingRegistration) return;
    setIsSaving(true);
    try {
      await onDeleteRegistration(editingRegistration.registrationNumber);
      showToast(
        'success',
        `Data pendaftar ${editingRegistration.registrationNumber} telah dihapus.`
      );
    } catch (err) {
      showToast(
        'error',
        `Gagal menghapus pendaftar: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickToggleStatus = async (record: RegistrationRecord) => {
    if (!isSuperAdmin) {
      showToast(
        'error',
        'Akses ditolak: Hanya Superadmin (mazharhajid@gmail.com) yang berhak mengubah status pendaftaran peserta.'
      );
      return;
    }
    const nextStatus = record.status.includes('Terverifikasi')
      ? 'Menunggu Konfirmasi Pembayaran'
      : 'Terverifikasi — Menunggu Orientasi';
    const updated: RegistrationRecord = {
      ...record,
      status: nextStatus as RegistrationRecord['status']
    };
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await onSaveRegistration(updated);
      if (editingRegistration?.registrationNumber === record.registrationNumber) {
        setEditingRegistration(updated);
      }
      showToast(
        'success',
        `Status ${record.fullName} berhasil diubah oleh Superadmin menjadi: ${nextStatus}`
      );
    } catch (err) {
      showToast(
        'error',
        `Gagal mengubah status: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDetailModal = (record: RegistrationRecord) => {
    setEditingRegistration({ ...record });
    setSelectedRegNo(record.registrationNumber);
    setIsDetailModalOpen(true);
  };

  const handleCreateNewRegistration = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const defaultProg = programs[0];
    const defaultSch = schedules[0];
    const nowStr =
      new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date()) + ' WIB';

    const newRecord: RegistrationRecord = {
      registrationNumber: `TL-2026-${randomSuffix}`,
      fullName: '',
      gender: 'Laki-laki',
      email: '',
      whatsapp: '',
      occupation: '',
      city: '',
      selectedProgramId: defaultProg?.id || 'tl-level-1',
      selectedProgramName: defaultProg?.title || 'Tadribul Lughah Level 1',
      selectedScheduleId: defaultSch?.id || 'sch-lv1-malam',
      selectedScheduleSummary: `${defaultSch?.batchCode || 'TL-LV1-M'} · ${defaultSch?.days || 'Kamis & Jumat'} (20.00 – 22.00 WIB)`,
      learningGoal: 'Memperdalam kaidah bahasa Arab dan membaca kitab gundul.',
      totalTuitionIDR: defaultProg?.tuitionIDR || 510000,
      registeredAt: nowStr,
      status: 'Terverifikasi — Menunggu Orientasi'
    };
    setEditingRegistration(newRecord);
    setSelectedRegNo(newRecord.registrationNumber);
    setIsDetailModalOpen(true);
  };

  const filteredRegistrations = registrations.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      r.fullName.toLowerCase().includes(q) ||
      r.registrationNumber.toLowerCase().includes(q) ||
      r.whatsapp.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.selectedProgramName.toLowerCase().includes(q) ||
      (r.gender || 'Laki-laki').toLowerCase().includes(q);

    const matchesLevel =
      filterLevel === 'all' || r.selectedProgramId === filterLevel;

    const matchesStatus =
      filterStatus === 'all' || r.status === filterStatus;

    const matchesGender =
      filterGender === 'all' ||
      (r.gender || 'Laki-laki').toLowerCase() === filterGender.toLowerCase();

    return matchesSearch && matchesLevel && matchesStatus && matchesGender;
  });

  const totalPeserta = registrations.length;
  const totalIkhwan = registrations.filter(
    (r) => (r.gender || 'Laki-laki') === 'Laki-laki'
  ).length;
  const totalAkhwat = registrations.filter(
    (r) => r.gender === 'Perempuan'
  ).length;
  const totalTerverifikasi = registrations.filter((r) =>
    r.status.includes('Terverifikasi')
  ).length;
  const totalMenunggu = registrations.filter(
    (r) => !r.status.includes('Terverifikasi')
  ).length;

  const handleExportCsv = () => {
    const headers = [
      'No Registrasi',
      'Nama Lengkap',
      'Jenis Kelamin',
      'Status Verifikasi',
      'Program Level',
      'Jadwal Kelas',
      'No WhatsApp',
      'Email',
      'Kota',
      'Profesi',
      'Total Biaya (IDR)',
      'Waktu Pendaftaran',
      'Target Belajar'
    ];
    const rows = filteredRegistrations.map((r) => [
      `"${r.registrationNumber}"`,
      `"${r.fullName.replace(/"/g, '""')}"`,
      `"${r.gender || 'Laki-laki'}"`,
      `"${r.status}"`,
      `"${r.selectedProgramName.replace(/"/g, '""')}"`,
      `"${r.selectedScheduleSummary.replace(/"/g, '""')}"`,
      `"${r.whatsapp}"`,
      `"${r.email}"`,
      `"${r.city.replace(/"/g, '""')}"`,
      `"${r.occupation.replace(/"/g, '""')}"`,
      `"${r.totalTuitionIDR}"`,
      `"${r.registeredAt}"`,
      `"${(r.learningGoal || '').replace(/"/g, '""')}"`
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `data_peserta_tadribul_lughah_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(
      'success',
      `Berhasil mengekspor ${filteredRegistrations.length} data peserta ke file CSV.`
    );
  };

  const handleCopyRegistrantList = async () => {
    if (filteredRegistrations.length === 0) {
      showToast('error', 'Tidak ada data peserta yang cocok untuk disalin.');
      return;
    }
    const summaryText = filteredRegistrations
      .map(
        (r, idx) =>
          `${idx + 1}. [${r.registrationNumber}] ${r.fullName} (${r.gender || 'Laki-laki'}) · ${r.selectedProgramName} · WA: ${r.whatsapp} · Domisili: ${r.city} · Status: ${r.status}`
      )
      .join('\n');
    await handleCopyCode(summaryText, 'Daftar ringkas peserta');
  };

  const handleResetDefaults = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await onSeedDefaults();
      showToast(
        'success',
        'Data awal Kurikulum Level 1–4 dan Jadwal Kelas Malam berhasil disinkronkan.'
      );
    } catch (err) {
      showToast(
        'error',
        `Gagal menyinkronkan data: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackAction = () => {
    if (onNavigateHome) {
      onNavigateHome();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <section
      aria-labelledby="superadmin-page-title"
      className="py-10 sm:py-14 bg-[#F8FAFC] min-h-[calc(100vh-140px)]"
    >
      <div className="max-w-[1200px] mx-auto px-6 space-y-8">
        {/* Dedicated Superadmin Page Header */}
        <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>HALAMAN KHUSUS SUPERADMIN · TADRIBUL LUGHAH (#/superadmin)</span>
            </div>
            <h1
              id="superadmin-page-title"
              className="text-2xl sm:text-3xl font-semibold tracking-tight text-white"
            >
              Halaman Superadmin & Database SQL cPanel
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pusat kendali pengeditan Kurikulum Level 1–3 (Ilmu Nahwu) & Level 4 (Ilmu Shorof), Jadwal Kelas Malam Online (20.00 – 22.00 WIB), Verifikasi Peserta, serta pengunduhan paket website <span className="font-mono text-emerald-300">.ZIP</span> & database <span className="font-mono text-emerald-300">.SQL</span> untuk cPanel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleBackAction}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Beranda
            </button>

            {currentUser ? (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-rose-900/80 hover:bg-rose-800 border border-rose-700 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar ({currentUser.email})
              </button>
            ) : (
              <button
                type="button"
                disabled={authLoading}
                onClick={onLoginGoogle}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5" />
                {authLoading ? 'Memproses Login...' : 'Login Google Superadmin'}
              </button>
            )}
          </div>
        </div>

        {/* 4-Column KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
            <span className="text-xs font-mono text-slate-500">
              01. KURIKULUM AKTIF
            </span>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {programs.length} Level
            </p>
            <p className="text-xs text-slate-600">
              Level 1–3 Nahwu & Level 4 Shorof ({formatIDR(programs[0]?.tuitionIDR || 510000)}/Level · Cicilan 6x)
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
            <span className="text-xs font-mono text-slate-500">
              02. JADWAL KELAS MALAM
            </span>
            <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {schedules.length} Kelas
            </p>
            <p className="text-xs text-slate-600">
              Online Zoom · Pukul 20.00 – 22.00 WIB
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5">
            <span className="text-xs font-mono text-slate-500">
              03. DATA PENDAFTAR
            </span>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-900">
              {registrations.length} Peserta
            </p>
            <p className="text-xs text-slate-600">
              Tersinkronisasi ke Database & SQL cPanel
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-slate-500">
                04. PAKET DEPLOY CPANEL
              </span>
              <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
                ZIP + SQL + PHP
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadFullZip}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:underline pt-1"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              Unduh Paket .ZIP Sekarang
            </button>
          </div>
        </div>

        {/* Dedicated Registration ON/OFF Switch Panel for Level 1 to Level 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <p className="text-xs font-mono font-semibold text-emerald-800 uppercase tracking-wider">
                KONTROL STATUS PENDAFTARAN PER LEVEL (ON / OFF)
              </p>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mt-0.5">
                Buka / Tutup Pendaftaran Level 1 s/d Level 4
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Klik tombol <strong>ON / OFF</strong> pada masing-masing level untuk membuka atau menutup pendaftaran peserta baru secara instan.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono shrink-0">
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                ON: {programs.filter((p) => p.registrationOpen !== false).length} Level
              </span>
              <span className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-900 font-semibold">
                OFF: {programs.filter((p) => p.registrationOpen === false).length} Level
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {programs.map((prog) => {
              const isOpen = prog.registrationOpen !== false;
              return (
                <div
                  key={prog.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-colors ${
                    isOpen
                      ? 'bg-emerald-50/40 border-emerald-300'
                      : 'bg-rose-50/40 border-rose-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900">
                        Level {prog.levelNumber} · {prog.angkatan || 'Angkatan 1'}
                      </span>
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                          isOpen
                            ? 'bg-emerald-900 text-white'
                            : 'bg-rose-700 text-white'
                        }`}
                      >
                        {isOpen ? 'ON · DIBUKA' : 'OFF · DITUTUP'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                      {prog.title}
                    </p>
                    <p className="text-[11px] font-mono text-slate-600">
                      {prog.scheduleDays} · {prog.scheduleTime}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSaving || !isSuperAdmin}
                    onClick={() => handleToggleProgramRegistration(prog)}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                      isOpen
                        ? 'bg-rose-700 hover:bg-rose-800 text-white'
                        : 'bg-emerald-900 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    <span>
                      {isOpen
                        ? `Matikan (OFF) Level ${prog.levelNumber}`
                        : `Aktifkan (ON) Level ${prog.levelNumber}`}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Workspace Container */}
        <div className="space-y-6">
          {/* Status Toast */}
          {statusMessage && (
            <div
              role="alert"
              className={`p-4 rounded-lg border flex items-start gap-3 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border-rose-300 text-rose-950'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Top Navigation Bar: CRUD Tabs + SQL cPanel Tab */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveTab('programs')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'programs'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                1. Edit Level & Kurikulum ({programs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('schedules')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'schedules'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                2. Edit Jadwal Kelas ({schedules.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('registrations')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === 'registrations'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                3. Data Pendaftar ({registrations.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('materi')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'materi'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-rose-500 fill-current" />
                4. Edit Video & Materi (materi.html)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cpanel-sql')}
                className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'cpanel-sql'
                    ? 'bg-emerald-900 text-white'
                    : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                5. Database SQL & ZIP cPanel
              </button>
            </div>

            {isSuperAdmin && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleResetDefaults}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Sinkronkan Data Standar
              </button>
            )}
          </div>

          {/* TAB 0: DATABASE SQL CPANEL (MySQL / MariaDB / phpMyAdmin) */}
          {activeTab === 'cpanel-sql' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: cPanel MySQL Settings & One-Click Downloads */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div>
                    <span className="text-xs font-mono font-semibold text-emerald-800">
                      INTEGRASI MYSQL / PHPMYADMIN CPANEL
                    </span>
                    <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                      Unduh File SQL & Bridge API cPanel
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Seluruh data kurikulum Level 1–4, jadwal kelas malam (20.00 – 22.00 WIB), dan data pendaftar dikonversi otomatis ke struktur tabel relasional <strong>MySQL / MariaDB</strong> yang siap di-import ke <strong>phpMyAdmin di cPanel</strong>.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadFullZip}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
                    >
                      <FolderArchive className="w-4 h-4" />
                      Unduh Paket .ZIP (index + login + pelajar + superadmin + SQL)
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDownloadLoginHtmlFile}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        Unduh login.html
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadStudentHtmlFile}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        Unduh pelajar.html
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadSuperAdminHtmlFile}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        Unduh superadmin.html
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleDownloadSqlFile}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh File .SQL Saja
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadPhpFile}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        Unduh api.php Saja
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1.5">
                    <p className="font-semibold text-slate-900">
                      Langkah Pemasangan di cPanel Hosting:
                    </p>
                    <p>
                      1. Masuk ke <strong>cPanel &rarr; MySQL® Databases</strong>, buat database baru dan user MySQL.
                    </p>
                    <p>
                      2. Buka <strong>cPanel &rarr; phpMyAdmin</strong>, pilih database Anda, klik tab <strong>Import</strong>, lalu unggah file <span className="font-mono text-slate-900">tadribul_lughah_cpanel.sql</span>.
                    </p>
                    <p>
                      3. Unggah file <span className="font-mono text-slate-900">api.php</span> ke folder <span className="font-mono text-slate-900">public_html/api.php</span> di cPanel File Manager agar form pendaftaran & edit Superadmin langsung tersimpan ke MySQL cPanel Anda.
                    </p>
                  </div>
                </div>

                {/* cPanel Database Credentials Form */}
                <form
                  onSubmit={handleSaveCpanelSettings}
                  className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      Konfigurasi Koneksi MySQL cPanel
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sesuaikan nama database dan user cPanel Anda agar otomatis tertulis di dalam script <span className="font-mono">api.php</span>.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        MySQL Host cPanel
                      </label>
                      <input
                        type="text"
                        value={localCpanelConfig.dbHost}
                        onChange={(e) =>
                          setLocalCpanelConfig({
                            ...localCpanelConfig,
                            dbHost: e.target.value
                          })
                        }
                        placeholder="localhost"
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Nama Database MySQL (cPanel)
                      </label>
                      <input
                        type="text"
                        value={localCpanelConfig.dbName}
                        onChange={(e) =>
                          setLocalCpanelConfig({
                            ...localCpanelConfig,
                            dbName: e.target.value
                          })
                        }
                        placeholder="contoh: username_tadribullughah"
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Username MySQL (cPanel)
                      </label>
                      <input
                        type="text"
                        value={localCpanelConfig.dbUser}
                        onChange={(e) =>
                          setLocalCpanelConfig({
                            ...localCpanelConfig,
                            dbUser: e.target.value
                          })
                        }
                        placeholder="contoh: username_admin"
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        URL Endpoint api.php di Domain cPanel (Opsional)
                      </label>
                      <input
                        type="url"
                        value={localCpanelConfig.apiEndpointUrl}
                        onChange={(e) =>
                          setLocalCpanelConfig({
                            ...localCpanelConfig,
                            apiEndpointUrl: e.target.value
                          })
                        }
                        placeholder="https://domain-anda.com/api.php"
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Simpan Pengaturan MySQL cPanel
                  </button>
                </form>
              </div>

              {/* Right Column: Live SQL Schema, PHP Bridge, & Separate superadmin.html Preview */}
              <div className="lg:col-span-7 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
                <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSqlPreviewMode('sql')}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors ${
                        sqlPreviewMode === 'sql'
                          ? 'bg-emerald-900 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      database_cpanel_mysql.sql
                    </button>
                    <button
                      type="button"
                      onClick={() => setSqlPreviewMode('php')}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors ${
                        sqlPreviewMode === 'php'
                          ? 'bg-emerald-900 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      api.php
                    </button>
                    <button
                      type="button"
                      onClick={() => setSqlPreviewMode('login-html')}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors ${
                        sqlPreviewMode === 'login-html'
                          ? 'bg-emerald-900 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      login.html
                    </button>
                    <button
                      type="button"
                      onClick={() => setSqlPreviewMode('pelajar-html')}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors ${
                        sqlPreviewMode === 'pelajar-html'
                          ? 'bg-emerald-900 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      pelajar.html
                    </button>
                    <button
                      type="button"
                      onClick={() => setSqlPreviewMode('superadmin-html')}
                      className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors ${
                        sqlPreviewMode === 'superadmin-html'
                          ? 'bg-emerald-900 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      superadmin.html
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopyCode(
                        sqlPreviewMode === 'sql'
                          ? liveSqlDump
                          : sqlPreviewMode === 'php'
                            ? livePhpBridge
                            : sqlPreviewMode === 'login-html'
                              ? liveLoginHtml
                              : sqlPreviewMode === 'pelajar-html'
                                ? liveStudentHtml
                                : liveSuperAdminHtml,
                        sqlPreviewMode === 'sql'
                          ? 'Query SQL cPanel'
                          : sqlPreviewMode === 'php'
                            ? 'Kode PHP API cPanel'
                            : sqlPreviewMode === 'login-html'
                              ? 'Kode File login.html'
                              : sqlPreviewMode === 'pelajar-html'
                                ? 'Kode File pelajar.html'
                                : 'Kode File superadmin.html'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin Kode
                  </button>
                </div>

                <div className="p-4 overflow-x-auto max-h-[540px] overflow-y-auto">
                  <pre className="text-[11px] font-mono leading-relaxed text-slate-200 whitespace-pre">
                    {sqlPreviewMode === 'sql'
                      ? liveSqlDump
                      : sqlPreviewMode === 'php'
                        ? livePhpBridge
                        : sqlPreviewMode === 'login-html'
                          ? liveLoginHtml
                          : sqlPreviewMode === 'pelajar-html'
                            ? liveStudentHtml
                            : liveSuperAdminHtml}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Authentication Gate for Editing Tabs */}
          {activeTab !== 'cpanel-sql' && !currentUser ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-lg mx-auto my-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6 text-emerald-800" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Otentikasi Superadmin Tadribul Lughah
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Masuk menggunakan akun Google Superadmin (
                <span className="font-mono font-semibold text-slate-900">
                  {SUPERADMIN_EMAIL}
                </span>
                ) untuk mengedit kurikulum Level 1–4, mengubah harga atau hari kelas, serta memverifikasi data peserta. Setiap perubahan otomatis memperbarui skrip SQL cPanel.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  disabled={authLoading}
                  onClick={onLoginGoogle}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  {authLoading
                    ? 'Memproses Login...'
                    : 'Login dengan Google Superadmin'}
                </button>
              </div>
            </div>
          ) : activeTab !== 'cpanel-sql' && !isSuperAdmin ? (
            <div className="bg-white border border-rose-200 rounded-xl p-8 text-center max-w-lg mx-auto my-6 space-y-4">
              <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-900">
                Akses Terbatas (Bukan Akun Superadmin)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda saat ini masuk sebagai{' '}
                <span className="font-mono font-semibold text-slate-900">
                  {currentUser?.email}
                </span>
                . Hak akses pengeditan hanya diberikan kepada Superadmin{' '}
                <span className="font-mono font-semibold text-emerald-900">
                  {SUPERADMIN_EMAIL}
                </span>
                .
              </p>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
                Ganti Akun Google
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: EDIT PROGRAMS (LEVEL 1-4) */}
              {activeTab === 'programs' && isSuperAdmin && editingProgram && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Sidebar: Choose Level */}
                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 pb-1">
                      Pilih Level Kurikulum
                    </p>
                    {programs.map((prog) => {
                      const isOpen = prog.registrationOpen !== false;
                      return (
                        <button
                          key={prog.id}
                          type="button"
                          onClick={() => setSelectedProgramId(prog.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedProgramId === prog.id
                              ? 'bg-emerald-50/70 border-emerald-800 text-slate-900'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-mono font-semibold text-emerald-900">
                            <span>
                              {prog.code} · {prog.angkatan || 'Angkatan 1'}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                isOpen
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isOpen ? 'PENDAFTARAN ON' : 'PENDAFTARAN OFF'}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">
                            {prog.title}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {prog.scheduleDays} · {prog.scheduleTime} · {formatIDR(prog.tuitionIDR)}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Form: Edit Level Details */}
                  <form
                    onSubmit={handleProgramSubmit}
                    className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
                  >
                    <div className="pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-mono font-semibold text-emerald-800">
                          EDIT LEVEL {editingProgram.levelNumber} (
                          {editingProgram.code})
                        </span>
                        <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                          {editingProgram.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() =>
                            handleToggleProgramRegistration(editingProgram)
                          }
                          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
                            editingProgram.registrationOpen !== false
                              ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-950 border border-rose-300 hover:bg-rose-200'
                          }`}
                        >
                          <span>
                            Status Pendaftaran:{' '}
                            {editingProgram.registrationOpen !== false
                              ? 'ON (Dibuka)'
                              : 'OFF (Ditutup)'}
                          </span>
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan Level'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Nama Program / Judul Level
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProgram.title}
                          onChange={(e) =>
                            setEditingProgram({
                              ...editingProgram,
                              title: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Judul Bahasa Arab (Teks Arab)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          required
                          value={editingProgram.arabicTitle}
                          onChange={(e) =>
                            setEditingProgram({
                              ...editingProgram,
                              arabicTitle: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-base font-arabic bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Angkatan Berapa (Nomor / Nama Angkatan)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Angkatan 1 / Angkatan 5"
                          value={editingProgram.angkatan || 'Angkatan 1'}
                          onChange={(e) =>
                            setEditingProgram({
                              ...editingProgram,
                              angkatan: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono font-semibold text-emerald-950 bg-emerald-50/40 border border-emerald-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Tentukan angkatan yang sedang dibuka untuk Level {editingProgram.levelNumber} (misal: Angkatan 1, Angkatan 2, dst.).
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Kategori Keilmuan
                        </label>
                        <select
                          value={editingProgram.category}
                          onChange={(e) =>
                            setEditingProgram({
                              ...editingProgram,
                              category: e.target.value as 'nahwu' | 'shorof'
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        >
                          <option value="nahwu">Ilmu Nahwu (Level 1–3)</option>
                          <option value="shorof">Ilmu Shorof (Level 4)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Label Ringkas Level
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProgram.categoryLabel}
                          onChange={(e) =>
                            setEditingProgram({
                              ...editingProgram,
                              categoryLabel: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Hari Kelas Online
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProgram.scheduleDays}
                          onChange={(e) =>
                            setEditingProgram({
                              ...editingProgram,
                              scheduleDays: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Jam Belajar Malam (WIB)
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProgram.scheduleTime}
                          onChange={(e) =>
                            setEditingProgram({
                              ...editingProgram,
                              scheduleTime: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Biaya Pendaftaran per Level (IDR)
                        </label>
                        <input
                          type="number"
                          min={10000}
                          step={5000}
                          required
                          value={editingProgram.tuitionIDR}
                          onChange={(e) =>
                            setEditingProgram({
                              ...editingProgram,
                              tuitionIDR: Number(e.target.value) || 0
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Durasi (Pekan)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={52}
                          required
                          value={editingProgram.durationWeeks}
                          onChange={(e) => {
                            const weeks = Number(e.target.value) || 8;
                            setEditingProgram({
                              ...editingProgram,
                              durationWeeks: weeks,
                              sessionsCount: weeks * 2
                            });
                          }}
                          className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Modul / Kitab Pegangan
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProgram.kitabReference}
                          onChange={(e) =>
                            setEditingProgram({
                              ...editingProgram,
                              kitabReference: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Sasaran Peserta / Prasyarat
                        </label>
                        <input
                          type="text"
                          required
                          value={editingProgram.levelRecommendation}
                          onChange={(e) =>
                            setEditingProgram({
                              ...editingProgram,
                              levelRecommendation: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Ringkasan Materi Level
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={editingProgram.summary}
                          onChange={(e) =>
                            setEditingProgram({
                              ...editingProgram,
                              summary: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Target Capaian Lulusan
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={editingProgram.targetOutcome}
                          onChange={(e) =>
                            setEditingProgram({
                              ...editingProgram,
                              targetOutcome: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 2: EDIT SCHEDULES */}
              {activeTab === 'schedules' && isSuperAdmin && editingSchedule && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Sidebar: Schedule List + Add Button */}
                  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between px-2 pb-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Daftar Jadwal Kelas
                      </p>
                      <button
                        type="button"
                        onClick={handleCreateNewSchedule}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Jadwal Baru
                      </button>
                    </div>

                    {schedules.map((sch) => (
                      <button
                        key={sch.id}
                        type="button"
                        onClick={() => setSelectedScheduleId(sch.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          editingSchedule.id === sch.id
                            ? 'bg-emerald-50/70 border-emerald-800 text-slate-900'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono font-semibold text-emerald-900">
                          <span>{sch.batchCode}</span>
                          <span>{formatIDR(sch.feeIDR)}</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">
                          {sch.programName}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {sch.days} · {sch.timeWIB} (Terisi {sch.enrolled}/
                          {sch.capacity})
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Right Form: Edit Schedule */}
                  <form
                    onSubmit={handleScheduleSubmit}
                    className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
                  >
                    <div className="pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-mono font-semibold text-emerald-800">
                          EDIT JADWAL KELAS ONLINE ({editingSchedule.batchCode})
                        </span>
                        <h3 className="text-base font-semibold text-slate-900 mt-0.5">
                          {editingSchedule.programName}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={handleDeleteCurrentSchedule}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus
                        </button>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {isSaving ? 'Menyimpan...' : 'Simpan Jadwal'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Kode Kelas (Batch Code)
                        </label>
                        <input
                          type="text"
                          required
                          value={editingSchedule.batchCode}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              batchCode: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Terhubung ke Level Program
                        </label>
                        <select
                          value={editingSchedule.programId}
                          onChange={(e) => {
                            const prog = programs.find(
                              (p) => p.id === e.target.value
                            );
                            if (prog) {
                              setEditingSchedule({
                                ...editingSchedule,
                                programId: prog.id,
                                levelNumber: prog.levelNumber,
                                programName: prog.title,
                                levelName: `Level ${prog.levelNumber}`
                              });
                            }
                          }}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        >
                          {programs.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} — {p.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Nama Kelas di Tabel Jadwal
                        </label>
                        <input
                          type="text"
                          required
                          value={editingSchedule.programName}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              programName: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Hari Perkuliahan
                        </label>
                        <input
                          type="text"
                          required
                          value={editingSchedule.days}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              days: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Jam Belajar Malam (WIB)
                        </label>
                        <input
                          type="text"
                          required
                          value={editingSchedule.timeWIB}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              timeWIB: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Tanggal Mulai Kelas
                        </label>
                        <input
                          type="text"
                          required
                          value={editingSchedule.startDate}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              startDate: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Pengajar / Mudarris
                        </label>
                        <input
                          type="text"
                          required
                          value={editingSchedule.instructor}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              instructor: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Kapasitas Maksimal Kursi
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          required
                          value={editingSchedule.capacity}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              capacity: Number(e.target.value) || 25
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Jumlah Peserta Terdaftar Saat Ini
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={editingSchedule.capacity}
                          required
                          value={editingSchedule.enrolled}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              enrolled: Number(e.target.value) || 0
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Biaya Pendaftaran (IDR)
                        </label>
                        <input
                          type="number"
                          min={10000}
                          step={5000}
                          required
                          value={editingSchedule.feeIDR}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              feeIDR: Number(e.target.value) || 510000
                            })
                          }
                          className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Moda Pembelajaran
                        </label>
                        <input
                          type="text"
                          required
                          value={editingSchedule.modeLabel}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              modeLabel: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: MANAGE REGISTRATIONS — LIST DATA PESERTA LENGKAP */}
              {activeTab === 'registrations' && isSuperAdmin && (
                <div className="space-y-6">
                  {/* Top Header & Action Buttons */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-emerald-800 uppercase tracking-wider">
                          LIST & DIREKTORI DATA PESERTA
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-200">
                          {registrations.length} Peserta Terdaftar
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
                        Daftar Peserta Program Tadribul Lughah
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Lihat, cari, filter, verifikasi status, dan kelola data pendaftar Level 1–4. Tersinkronisasi ke Firestore dan MySQL cPanel.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                        Ekspor CSV (.csv)
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyRegistrantList}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        Salin List Ringkas
                      </button>

                      <button
                        type="button"
                        onClick={handleCreateNewRegistration}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Peserta Baru
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-[11px] font-mono text-slate-500 uppercase">Total Peserta</p>
                      <p className="text-xl font-bold font-mono text-slate-900 mt-1">{totalPeserta}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Semua level 1–4</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-[11px] font-mono text-blue-700 uppercase">Laki-laki (Ikhwan)</p>
                      <p className="text-xl font-bold font-mono text-blue-900 mt-1">{totalIkhwan}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Peserta Ikhwan</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-[11px] font-mono text-purple-700 uppercase">Perempuan (Akhwat)</p>
                      <p className="text-xl font-bold font-mono text-purple-900 mt-1">{totalAkhwat}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Peserta Akhwat</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-[11px] font-mono text-emerald-700 uppercase">Terverifikasi</p>
                      <p className="text-xl font-bold font-mono text-emerald-900 mt-1">{totalTerverifikasi}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Siap orientasi / belajar</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 col-span-2 sm:col-span-1">
                      <p className="text-[11px] font-mono text-amber-700 uppercase">Menunggu Konfirmasi</p>
                      <p className="text-xl font-bold font-mono text-amber-900 mt-1">{totalMenunggu}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Perlu konfirmasi bayar</p>
                    </div>
                  </div>

                  {/* Search & Filter Toolbar */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      {/* Search Bar */}
                      <div className="md:col-span-5 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari nama, No. Registrasi, WA, email, kota..."
                          className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 focus:bg-white transition-colors"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filter Level */}
                      <div className="md:col-span-3">
                        <select
                          value={filterLevel}
                          onChange={(e) => setFilterLevel(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        >
                          <option value="all">Semua Program Level</option>
                          {programs.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} — Level {p.levelNumber} ({p.angkatan || 'Angkatan 1'})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter Status */}
                      <div className="md:col-span-2">
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        >
                          <option value="all">Semua Status</option>
                          <option value="Terverifikasi — Menunggu Orientasi">Terverifikasi</option>
                          <option value="Menunggu Konfirmasi Pembayaran">Menunggu Konfirmasi</option>
                        </select>
                      </div>

                      {/* Filter Gender */}
                      <div className="md:col-span-2">
                        <select
                          value={filterGender}
                          onChange={(e) => setFilterGender(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        >
                          <option value="all">Semua Gender</option>
                          <option value="Laki-laki">Laki-laki (Ikhwan)</option>
                          <option value="Perempuan">Perempuan (Akhwat)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>
                        Menampilkan <strong>{filteredRegistrations.length}</strong> dari <strong>{registrations.length}</strong> peserta
                        {searchQuery || filterLevel !== 'all' || filterStatus !== 'all' || filterGender !== 'all' ? ' (terfilter)' : ''}
                      </span>

                      {(searchQuery || filterLevel !== 'all' || filterStatus !== 'all' || filterGender !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setFilterLevel('all');
                            setFilterStatus('all');
                            setFilterGender('all');
                          }}
                          className="text-xs text-rose-700 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset Filter Pencarian
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Main Participants Table */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-900 text-white font-mono text-[11px] uppercase tracking-wider">
                            <th className="py-3 px-4 font-semibold w-12 text-center">No</th>
                            <th className="py-3 px-4 font-semibold">No. Registrasi</th>
                            <th className="py-3 px-4 font-semibold">Nama & Jenis Kelamin</th>
                            <th className="py-3 px-4 font-semibold">Program / Level</th>
                            <th className="py-3 px-4 font-semibold">
                              <div className="flex items-center gap-1.5 whitespace-nowrap">
                                <span>Status Pendaftaran</span>
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 uppercase">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                                  Hanya Superadmin
                                </span>
                              </div>
                            </th>
                            <th className="py-3 px-4 font-semibold">Kontak (WhatsApp / Email)</th>
                            <th className="py-3 px-4 font-semibold">Domisili</th>
                            <th className="py-3 px-4 font-semibold">Biaya</th>
                            <th className="py-3 px-4 font-semibold text-center w-32">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredRegistrations.length > 0 ? (
                            filteredRegistrations.map((r, index) => {
                              const isVerified = r.status.includes('Terverifikasi');
                              const isMale = (r.gender || 'Laki-laki') === 'Laki-laki';
                              const waDigits = r.whatsapp.replace(/[^0-9]/g, '');
                              const formattedWa = waDigits.startsWith('0') ? '62' + waDigits.slice(1) : waDigits;
                              const waUrl = `https://wa.me/${formattedWa}?text=${encodeURIComponent(
                                `Assalamu'alaikum Warahmatullahi Wabarakatuh, Sdr/i ${r.fullName}. Terkait pendaftaran Program Tadribul Lughah (${r.selectedProgramName})...`
                              )}`;

                              return (
                                <tr
                                  key={r.registrationNumber}
                                  className="hover:bg-slate-50/80 transition-colors"
                                >
                                  {/* 1. Sequential Number */}
                                  <td className="py-3 px-4 font-mono text-slate-500 text-center font-medium">
                                    {index + 1}
                                  </td>

                                  {/* 2. Registration Number & Date */}
                                  <td className="py-3 px-4">
                                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                      {r.registrationNumber}
                                    </span>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                      {r.registeredAt || 'Telah Terdaftar'}
                                    </p>
                                  </td>

                                  {/* 3. Name & Gender Badge */}
                                  <td className="py-3 px-4">
                                    <p className="font-semibold text-slate-900 text-sm">
                                      {r.fullName}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                          isMale
                                            ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                            : 'bg-purple-50 text-purple-900 border border-purple-200'
                                        }`}
                                      >
                                        {isMale ? '♂ Laki-laki (Ikhwan)' : '♀ Perempuan (Akhwat)'}
                                      </span>
                                      {r.occupation && (
                                        <span className="text-[11px] text-slate-500">
                                          · {r.occupation}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* 4. Program Level & Schedule */}
                                  <td className="py-3 px-4">
                                    <p className="font-semibold text-slate-900">
                                      {r.selectedProgramName}
                                    </p>
                                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1 font-mono">
                                      {r.selectedScheduleSummary}
                                    </p>
                                  </td>

                                  {/* 5. Status Verifikasi (Hanya Superadmin yang bisa merubah) */}
                                  <td className="py-3 px-4">
                                    {isSuperAdmin ? (
                                      <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => handleQuickToggleStatus(r)}
                                        title="Klik untuk mengubah status verifikasi (Akses Khusus Superadmin: mazharhajid@gmail.com)"
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all text-left shadow-xs cursor-pointer ${
                                          isVerified
                                            ? 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                                            : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100 hover:border-amber-400'
                                        }`}
                                      >
                                        {isVerified ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                        ) : (
                                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                        )}
                                        <span>{r.status}</span>
                                        <span className="text-[9px] font-mono font-bold text-emerald-900 bg-white/90 px-1 py-0.5 rounded border border-emerald-200">
                                          Ubah
                                        </span>
                                      </button>
                                    ) : (
                                      <div
                                        title="Hanya Superadmin yang berwenang mengubah status pendaftaran"
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-not-allowed ${
                                          isVerified
                                            ? 'bg-emerald-50/60 text-emerald-900 border-emerald-200'
                                            : 'bg-amber-50/60 text-amber-900 border-amber-200'
                                        }`}
                                      >
                                        <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                                        <span>{r.status}</span>
                                      </div>
                                    )}
                                  </td>

                                  {/* 6. Contacts (WhatsApp & Email) */}
                                  <td className="py-3 px-4">
                                    <div className="space-y-1">
                                      {r.whatsapp && (
                                        <a
                                          href={waUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 hover:text-emerald-950 hover:underline"
                                        >
                                          <Phone className="w-3 h-3 text-emerald-600" />
                                          <span>{r.whatsapp}</span>
                                        </a>
                                      )}
                                      {r.email && (
                                        <div className="flex items-center gap-1 text-[11px] text-slate-600">
                                          <Mail className="w-3 h-3 text-slate-400" />
                                          <span className="line-clamp-1">{r.email}</span>
                                        </div>
                                      )}
                                    </div>
                                  </td>

                                  {/* 7. City */}
                                  <td className="py-3 px-4 font-medium text-slate-800">
                                    {r.city || '-'}
                                  </td>

                                  {/* 8. Tuition Fee & Installment */}
                                  <td className="py-3 px-4 font-mono">
                                    <span className="font-semibold text-slate-900">
                                      {formatIDR(r.totalTuitionIDR)}
                                    </span>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                      Cicilan: {formatIDR(Math.round(r.totalTuitionIDR / 6))}/bln
                                    </p>
                                  </td>

                                  {/* 9. Actions */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenDetailModal(r)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 transition-colors"
                                        title="Buka & Edit Data Peserta"
                                      >
                                        <Eye className="w-3 h-3" />
                                        Detail
                                      </button>

                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center p-1 text-emerald-800 hover:text-white hover:bg-emerald-800 border border-emerald-300 rounded transition-colors"
                                        title="Chat WhatsApp Peserta"
                                      >
                                        <Phone className="w-3.5 h-3.5" />
                                      </a>

                                      <button
                                        type="button"
                                        disabled={isSaving}
                                        onClick={() => {
                                          if (confirm(`Hapus data pendaftar ${r.fullName} (${r.registrationNumber})?`)) {
                                            onDeleteRegistration(r.registrationNumber);
                                          }
                                        }}
                                        className="inline-flex items-center justify-center p-1 text-rose-700 hover:text-white hover:bg-rose-700 border border-rose-300 rounded transition-colors"
                                        title="Hapus Peserta"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={9} className="py-12 text-center text-slate-500">
                                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-slate-800">
                                  Tidak ada data peserta yang cocok
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Silakan ubah kata kunci pencarian atau reset filter di atas.
                                </p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* MODAL DIALOG: EDIT & DETAIL DATA PESERTA */}
                  {isDetailModalOpen && editingRegistration && (
                    <div
                      role="dialog"
                      aria-modal="true"
                      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
                    >
                      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
                        {/* Modal Header */}
                        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                          <div>
                            <span className="text-[11px] font-mono text-emerald-400">
                              DETAIL & EDIT DATA PESERTA
                            </span>
                            <h3 className="text-base font-semibold text-white mt-0.5">
                              {editingRegistration.fullName || 'Peserta Baru'} — {editingRegistration.registrationNumber}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsDetailModalOpen(false)}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={async (e) => {
                          await handleRegistrationSubmit(e);
                          setIsDetailModalOpen(false);
                        }}>
                          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Nama Lengkap Peserta
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={editingRegistration.fullName}
                                  onChange={(e) =>
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      fullName: e.target.value
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Jenis Kelamin Peserta
                                </label>
                                <select
                                  value={editingRegistration.gender || 'Laki-laki'}
                                  onChange={(e) =>
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      gender: e.target.value
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                >
                                  <option value="Laki-laki">Laki-laki (Ikhwan)</option>
                                  <option value="Perempuan">Perempuan (Akhwat)</option>
                                </select>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-xs font-semibold text-slate-800">
                                    Status Verifikasi Pendaftaran
                                  </label>
                                  <span className="text-[10px] font-mono font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    Khusus Superadmin
                                  </span>
                                </div>
                                <select
                                  disabled={!isSuperAdmin || isSaving}
                                  value={editingRegistration.status}
                                  onChange={(e) =>
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      status: e.target.value as RegistrationRecord['status']
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 font-semibold text-emerald-900 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                                >
                                  <option value="Terverifikasi — Menunggu Orientasi">
                                    Terverifikasi — Menunggu Orientasi
                                  </option>
                                  <option value="Menunggu Konfirmasi Pembayaran">
                                    Menunggu Konfirmasi Pembayaran
                                  </option>
                                </select>
                                {!isSuperAdmin ? (
                                  <p className="text-[11px] text-rose-700 mt-1 flex items-center gap-1 font-medium">
                                    <Lock className="w-3 h-3" />
                                    Hanya Superadmin (mazharhajid@gmail.com) yang berwenang mengubah status pendaftaran ini.
                                  </p>
                                ) : (
                                  <p className="text-[10px] font-mono text-emerald-800 mt-1">
                                    ✓ Akses Superadmin Aktif: Anda berwenang mengubah status verifikasi
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Email Peserta
                                </label>
                                <input
                                  type="email"
                                  required
                                  value={editingRegistration.email}
                                  onChange={(e) =>
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      email: e.target.value
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Nomor WhatsApp
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={editingRegistration.whatsapp}
                                  onChange={(e) =>
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      whatsapp: e.target.value
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Kota Domisili
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={editingRegistration.city}
                                  onChange={(e) =>
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      city: e.target.value
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Profesi / Latar Belakang
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={editingRegistration.occupation}
                                  onChange={(e) =>
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      occupation: e.target.value
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Total Biaya (IDR)
                                </label>
                                <input
                                  type="number"
                                  min={10000}
                                  step={5000}
                                  required
                                  value={editingRegistration.totalTuitionIDR}
                                  onChange={(e) =>
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      totalTuitionIDR: Number(e.target.value) || 510000
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Program Level Pilihan
                                </label>
                                <select
                                  value={editingRegistration.selectedProgramId}
                                  onChange={(e) => {
                                    const prog = programs.find((p) => p.id === e.target.value);
                                    if (prog) {
                                      setEditingRegistration({
                                        ...editingRegistration,
                                        selectedProgramId: prog.id,
                                        selectedProgramName: prog.title,
                                        totalTuitionIDR: prog.tuitionIDR
                                      });
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                >
                                  {programs.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.code} — Level {p.levelNumber} ({p.angkatan || 'Angkatan 1'}) — {p.title}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Ringkasan Jadwal Kelas
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={editingRegistration.selectedScheduleSummary}
                                  onChange={(e) =>
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      selectedScheduleSummary: e.target.value
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Target Pembelajaran Peserta
                                </label>
                                <textarea
                                  rows={2}
                                  required
                                  value={editingRegistration.learningGoal}
                                  onChange={(e) =>
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      learningGoal: e.target.value
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Modal Footer */}
                          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={async () => {
                                if (confirm(`Hapus data pendaftar ${editingRegistration.fullName} (${editingRegistration.registrationNumber})?`)) {
                                  await handleDeleteCurrentRegistration();
                                  setIsDetailModalOpen(false);
                                }
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus Peserta
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setIsDetailModalOpen(false)}
                                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                              >
                                Batal
                              </button>
                              <button
                                type="submit"
                                disabled={isSaving}
                                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                              >
                                <Save className="w-3.5 h-3.5" />
                                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                              </button>
                            </div>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: EDIT VIDEO YOUTUBE & MATERI PEKAN (materi.html) */}
              {activeTab === 'materi' && isSuperAdmin && (
                <div className="space-y-6">
                  {/* Header Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase flex items-center gap-1">
                          <Youtube className="w-3.5 h-3.5 fill-current text-rose-600" />
                          EDITOR VIDEO YOUTUBE & MATERI PEKAN
                        </span>
                        <span className="text-xs font-mono text-slate-400">· Halaman materi.html</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">
                        Kelola Video YouTube & Silabus Pekanan
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                        Superadmin dapat mengubah video pembelajaran YouTube untuk setiap pekan (Pekan 1 Muqaddimah s/d Pekan 12), mengganti link rekaman Zoom pengajar, serta mengedit uraian kaidah dan contoh kalimat. Perubahan langsung tersimpan dan tampil di <strong className="text-slate-900">materi.html</strong>.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <a
                        href={`./materi.html?program=${encodeURIComponent(selectedMateriProgramId)}&pekan=${selectedMateriPekan}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        title="Buka halaman materi.html untuk pekan ini di tab baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Pratinjau di materi.html ↗</span>
                      </a>
                    </div>
                  </div>

                  {/* Level Switcher & Pekan Selector */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                    {/* Choose Level */}
                    <div>
                      <span className="text-xs font-mono font-semibold text-slate-500 uppercase block mb-2">
                        1. Pilih Level Program:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {programs.map((prog) => {
                          const isSelected = prog.id === selectedMateriProgramId;
                          return (
                            <button
                              key={prog.id}
                              type="button"
                              onClick={() => setSelectedMateriProgramId(prog.id)}
                              className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold">
                                  Level {prog.levelNumber} ({prog.code})
                                </span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                  isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {prog.levelNumber === 4 ? 'Shorof' : 'Nahwu'}
                                </span>
                              </div>
                              <p className={`text-xs mt-1 truncate ${isSelected ? 'text-emerald-100' : 'text-slate-600'}`}>
                                {prog.title}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Choose Pekan (1 to 12) */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-semibold text-slate-500 uppercase">
                          2. Pilih Pekan Materi (1 s/d 12):
                        </span>
                        <span className="text-xs font-mono text-emerald-900 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Sedang Mengedit: Pekan ke-{selectedMateriPekan}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
                          const isCurrent = num === selectedMateriPekan;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setSelectedMateriPekan(num)}
                              className={`shrink-0 px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                                isCurrent
                                  ? 'bg-rose-700 text-white border-rose-700 shadow-xs ring-2 ring-rose-200'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <span>Pekan {num}</span>
                              {num === 1 && (
                                <span className={`ml-1 text-[10px] font-mono px-1 rounded ${
                                  isCurrent ? 'bg-rose-800 text-white' : 'bg-emerald-100 text-emerald-900'
                                }`}>
                                  Muqaddimah
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Main Form Editor */}
                  <form onSubmit={handleSaveMateri} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      {/* Left Column: YouTube Video Settings & Live Preview */}
                      <div className="lg:col-span-5 space-y-5">
                        <div className="bg-white border border-rose-200 rounded-xl p-5 space-y-4 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                            <div className="flex items-center gap-2">
                              <Youtube className="w-5 h-5 text-rose-600 fill-current" />
                              <h3 className="text-sm font-bold text-slate-900">
                                Pengaturan Video YouTube
                              </h3>
                            </div>
                            <span className="text-[11px] font-mono text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                              Pekan {selectedMateriPekan}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-800 mb-1">
                                Tautan URL YouTube atau Video ID <span className="text-rose-600">*</span>
                              </label>
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  required
                                  value={editingMateri.youtubeVideoId || ''}
                                  onChange={(e) =>
                                    setEditingMateri({
                                      ...editingMateri,
                                      youtubeVideoId: e.target.value
                                    })
                                  }
                                  placeholder="Contoh: https://www.youtube.com/watch?v=fC9zKq38_54 atau fC9zKq38_54"
                                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-500"
                                />
                                <p className="text-[11px] text-slate-500">
                                  Bisa menempelkan URL YouTube lengkap, link pendek <code className="text-slate-800 font-mono">youtu.be/...</code>, atau 11 karakter Video ID.
                                </p>
                              </div>
                            </div>

                            {/* Live Video Preview Box */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700">Pratinjau Langsung Video:</span>
                                <span className="font-mono text-[11px] text-slate-500">
                                  ID: <strong className="text-rose-700">{extractYouTubeId(editingMateri.youtubeVideoId || '')}</strong>
                                </span>
                              </div>
                              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800 shadow-sm">
                                <iframe
                                  className="w-full h-full"
                                  src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(editingMateri.youtubeVideoId || '')}?rel=0`}
                                  title="Pratinjau Video YouTube"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-800 mb-1">
                                Judul Video YouTube
                              </label>
                              <input
                                type="text"
                                value={editingMateri.youtubeTitle || ''}
                                onChange={(e) =>
                                  setEditingMateri({
                                    ...editingMateri,
                                    youtubeTitle: e.target.value
                                  })
                                }
                                placeholder="Contoh: Muqaddimah Ilmu Nahwu — Rukun Kalam & Hakikat Bahasa Arab"
                                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-800 mb-1">
                                Nama Channel / Pengampu Video
                              </label>
                              <input
                                type="text"
                                value={editingMateri.youtubeChannel || ''}
                                onChange={(e) =>
                                  setEditingMateri({
                                    ...editingMateri,
                                    youtubeChannel: e.target.value
                                  })
                                }
                                placeholder="Contoh: Tadribul Lughah Official"
                                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
                              />
                            </div>

                            <div className="pt-2 flex items-center justify-between text-xs">
                              <a
                                href={`https://www.youtube.com/watch?v=${extractYouTubeId(editingMateri.youtubeVideoId || '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-rose-700 hover:text-rose-900 font-semibold inline-flex items-center gap-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Buka di situs YouTube ↗</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${extractYouTubeId(editingMateri.youtubeVideoId || '')}`);
                                  showToast('success', 'Tautan YouTube berhasil disalin!');
                                }}
                                className="text-slate-600 hover:text-slate-900 font-mono text-[11px] cursor-pointer"
                              >
                                Salin Link
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Lesson Title, Summary, Rules & Points */}
                      <div className="lg:col-span-7 space-y-5">
                        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-emerald-900" />
                              <h3 className="text-sm font-bold text-slate-900">
                                Uraian Silabus & Kaidah Pekan {selectedMateriPekan}
                              </h3>
                            </div>
                            <span className="text-xs font-mono text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              {selectedMateriProgramId}
                            </span>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Judul Materi (Bahasa Indonesia) <span className="text-rose-600">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={editingMateri.title || ''}
                                  onChange={(e) =>
                                    setEditingMateri({
                                      ...editingMateri,
                                      title: e.target.value
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Judul Materi (Bahasa Arab)
                                </label>
                                <input
                                  type="text"
                                  dir="rtl"
                                  value={editingMateri.arabicTitle || ''}
                                  onChange={(e) =>
                                    setEditingMateri({
                                      ...editingMateri,
                                      arabicTitle: e.target.value
                                    })
                                  }
                                  className="w-full px-3 py-2 text-xs font-arabic bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Kitab Rujukan Modul
                                </label>
                                <input
                                  type="text"
                                  value={editingMateri.kitabReference || ''}
                                  onChange={(e) =>
                                    setEditingMateri({
                                      ...editingMateri,
                                      kitabReference: e.target.value
                                    })
                                  }
                                  placeholder="Contoh: Al-Mabadi' An-Nahwiyyah — Jilid 1"
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Target Capaian Santri
                                </label>
                                <input
                                  type="text"
                                  value={editingMateri.targetOutcome || ''}
                                  onChange={(e) =>
                                    setEditingMateri({
                                      ...editingMateri,
                                      targetOutcome: e.target.value
                                    })
                                  }
                                  placeholder="Contoh: Menguasai 4 rukun Kalam secara komprehensif"
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-800 mb-1">
                                Ringkasan / Pengantar Materi Pekan Ini
                              </label>
                              <textarea
                                rows={3}
                                value={editingMateri.summary || ''}
                                onChange={(e) =>
                                  setEditingMateri({
                                    ...editingMateri,
                                    summary: e.target.value
                                  })
                                }
                                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 leading-relaxed"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-slate-800">
                                  Poin-Poin Pembahasan (1 baris per poin)
                                </label>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {(editingMateri.points || []).length} poin
                                </span>
                              </div>
                              <textarea
                                rows={4}
                                value={(editingMateri.points || []).join('\n')}
                                onChange={(e) =>
                                  setEditingMateri({
                                    ...editingMateri,
                                    points: e.target.value.split('\n').filter((l) => l.trim().length > 0)
                                  })
                                }
                                placeholder="Tulis setiap poin pembahasan pada baris baru..."
                                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 leading-relaxed"
                              />
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-semibold text-slate-800">
                                  Kaidah Pokok Tata Bahasa (1 baris per kaidah)
                                </label>
                                <span className="text-[11px] font-mono text-slate-400">
                                  {(editingMateri.rules || []).length} kaidah
                                </span>
                              </div>
                              <textarea
                                rows={4}
                                value={(editingMateri.rules || []).join('\n')}
                                onChange={(e) =>
                                  setEditingMateri({
                                    ...editingMateri,
                                    rules: e.target.value.split('\n').filter((l) => l.trim().length > 0)
                                  })
                                }
                                placeholder="Tulis setiap kaidah nahwu/shorof pada baris baru..."
                                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 leading-relaxed"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                      <div className="text-xs text-slate-600">
                        <span>Sedang mengedit: <strong>Level {selectedMateriProgramId} · Pekan {selectedMateriPekan}</strong></span>
                        <span className="block text-[11px] text-slate-400">Perubahan akan langsung aktif di halaman materi.html bagi seluruh pelajar terdaftar.</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleResetMateri}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset ke Bawaan</span>
                        </button>

                        <button
                          type="submit"
                          disabled={isSaving}
                          className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Materi & Video'}</span>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};
