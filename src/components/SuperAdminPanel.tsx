import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ProgramTrack,
  ClassSchedule,
  RegistrationRecord,
  formatIDR,
  formatWhatsAppNumber,
  saveProgramStartDate,
  saveProgramFullState,
  saveScheduleOverride,
  DEFAULT_PROGRAM_START_DATES,
  buildProgramMeetings,
  ProgramOnlineMeeting,
  isScheduleRegistrationOpen
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
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calendar,
  Users,
  GraduationCap,
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
  Unlock,
  Video,
  PlayCircle,
  HelpCircle,
  ListChecks,
  CreditCard,
  Wallet,
  Receipt,
  Printer,
  TrendingUp,
  Building2,
  ArrowUpRight,
  PieChart,
  UserPlus,
  CalendarCheck,
  CalendarClock,
  MessageCircle,
  Share2,
  Headphones,
  Loader2
} from 'lucide-react';
import {
  WeeklyPekanData,
  WeeklyAudioItem,
  ExampleSentence,
  VocabularyWord,
  QuizQuestion,
  getWeeklyPekanContent,
  getProgramTotalPekan,
  getProgramPekanList,
  saveCustomMateriOverride,
  resetCustomMateriOverride,
  syncCustomMateriFromServer,
  extractOptionalYouTubeId,
  getPekanYouTubeId,
  isValidYouTubeVideoInput,
  getNormalizedPekanAudioItems,
  isPekanUnlocked,
  savePekanUnlockState,
  setPekanUnlockBatch,
  setAllPekansUnlockState,
  syncPekanUnlockFromServer
} from '../data/moduleContentData';
import { GoogleDriveAudioPlayer } from './GoogleDriveAudioPlayer';
import { MateriLimitSelector } from './MateriLimitSelector';
import {
  fetchYouTubeMetadata,
  YouTubeVideoMetadata
} from '../utils/youtubeVideoMetadata';
import { getHolidayInfo } from '../utils/indonesianHolidays';
import {
  StudentAccount,
  getStudentAccounts,
  syncStudentAccountsFromServer,
  deleteStudentAccount,
  enrollStudentInProgram,
  isAttendanceSessionUnlocked,
  saveAttendanceSessionUnlockState,
  setAttendanceSessionUnlockBatch,
  setAllAttendanceSessionsUnlockState,
  syncAttendanceUnlockFromServer
} from '../utils/studentAccountStore';

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
  pageMode?: 'panel' | 'edit-jadwal';
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
  onSaveCpanelConfig,
  pageMode = 'panel'
}) => {
  const [activeTab, setActiveTab] = useState<
    'schedules' | 'kurikulum' | 'registrations' | 'keuangan' | 'materi' | 'cpanel-sql'
  >(() => {
    if (pageMode === 'edit-jadwal') return 'schedules';
    try {
      const p = new URLSearchParams(window.location.search).get('tab');
      if (p === 'keuangan') return 'keuangan';
      if (p === 'materi') return 'materi';
      if (p === 'kurikulum' || p === 'programs') return 'kurikulum';
      if (p === 'schedules') return 'schedules';
      if (p === 'registrations') return 'registrations';
      if (p === 'cpanel-sql') return 'cpanel-sql';
    } catch {
      // Ignored
    }
    return 'schedules';
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
      const params = new URLSearchParams(window.location.search);
      const progId = params.get('program') || programs[0]?.id || 'tl-level-1';
      const maxPekan = getProgramTotalPekan(progId);
      const p = parseInt(params.get('pekan') || '1', 10);
      return isNaN(p) || p < 1 || p > maxPekan ? 1 : p;
    } catch {
      return 1;
    }
  });

  const [editingMateri, setEditingMateri] = useState<WeeklyPekanData>(() =>
    getWeeklyPekanContent('tl-level-1', 1)
  );

  // Sub-Tab inside Tab 4 (Video, Audio, Silabus, Latihan) - tampil satu-satu setelah diklik
  const [materiSubTab, setMateriSubTab] = useState<'video' | 'audio' | 'silabus' | 'latihan'>(() => {
    try {
      if (typeof window !== 'undefined' && window.location.hash === '#section-latihan') {
        return 'latihan';
      }
    } catch {
      // Ignore
    }
    return 'video';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#section-latihan') {
        setMateriSubTab('latihan');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [selectedKurikulumProgramId, setSelectedKurikulumProgramId] = useState<string>(
    programs[0]?.id || 'tl-level-1'
  );
  const [editingKurikulumProgram, setEditingKurikulumProgram] = useState<ProgramTrack | null>(
    programs[0] || null
  );

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(
    schedules[0]?.id || 'sch-lv1-malam'
  );
  const [selectedMateriScheduleId, setSelectedMateriScheduleId] = useState<string>(() => {
    const match = schedules.find((s) => s.programId === selectedMateriProgramId);
    return match?.id || schedules[0]?.id || 'sch-lv1-malam';
  });

  useEffect(() => {
    const matching = schedules.filter((s) => s.programId === selectedMateriProgramId);
    if (matching.length > 0 && !matching.some((s) => s.id === selectedMateriScheduleId)) {
      setSelectedMateriScheduleId(matching[0].id);
    }
  }, [selectedMateriProgramId, schedules, selectedMateriScheduleId]);

  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(
    null
  );
  const [isScheduleEditModalOpen, setIsScheduleEditModalOpen] =
    useState<boolean>(false);
  const [isDeleteScheduleConfirmOpen, setIsDeleteScheduleConfirmOpen] =
    useState<boolean>(false);

  const [selectedRegNo, setSelectedRegNo] = useState<string>(
    registrations[0]?.registrationNumber || ''
  );
  const [editingRegistration, setEditingRegistration] =
    useState<RegistrationRecord | null>(null);

  // Participant list filtering & modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterAngkatan, setFilterAngkatan] = useState('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'unpaid' | 'cicilan' | 'lunas'>('all');
  const [filterGender, setFilterGender] = useState('all');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deletingRegistrationTarget, setDeletingRegistrationTarget] =
    useState<RegistrationRecord | null>(null);
  const [deletingUnselectedTarget, setDeletingUnselectedTarget] =
    useState<StudentAccount | null>(null);

  // Calon Santri Sudah Buat Akun (Belum Memilih Level) States
  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>(() =>
    getStudentAccounts()
  );
  const [registrationsSubView, setRegistrationsSubView] = useState<'selected' | 'unselected'>('selected');
  const [unselectedSearchQuery, setUnselectedSearchQuery] = useState('');
  const [unselectedFilterGender, setUnselectedFilterGender] = useState('all');

  // Modal State: Assign Level untuk Calon Santri Belum Pilih Level
  const [assigningAccount, setAssigningAccount] = useState<StudentAccount | null>(null);
  const [assignLevelId, setAssignLevelId] = useState<string>('tl-level-1');
  const [assignScheduleId, setAssignScheduleId] = useState<string>('sch-lv1-malam');
  const [assignPaymentStatus, setAssignPaymentStatus] = useState<'lunas' | 'cicilan'>('cicilan');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // Sinkronisasi data akun santri dari server hosting cPanel
  useEffect(() => {
    syncStudentAccountsFromServer()
      .then((accs) => {
        setStudentAccounts(accs);
      })
      .catch(() => {});

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<StudentAccount[]>;
      if (custom.detail) {
        setStudentAccounts(custom.detail);
      } else {
        setStudentAccounts(getStudentAccounts());
      }
    };

    window.addEventListener('student-accounts-updated', handleUpdate);
    return () => {
      window.removeEventListener('student-accounts-updated', handleUpdate);
    };
  }, []);

  // Filter akun yang sudah terdaftar tapi BELUM memiliki data aktif di Daftar Peserta (registrations)
  const unselectedStudentAccounts = useMemo(() => {
    const registeredEmails = new Set(
      registrations.map((r) => r.email.toLowerCase().trim())
    );
    const registeredRegNos = new Set(
      registrations.map((r) => r.registrationNumber.toUpperCase().trim())
    );

    return studentAccounts.filter((acc) => {
      // 1. Cek apakah email atau nomor registrasi cocok dengan data registrations aktif
      const accEmail = (acc.email || '').toLowerCase().trim();
      const accRegNo = (acc.registrationNumber || '').toUpperCase().trim();
      if (accEmail && registeredEmails.has(accEmail)) return false;
      if (accRegNo && registeredRegNos.has(accRegNo)) return false;

      // 2. Cek apakah ada nomor registrasi lain dari akun ini yang sudah masuk registrations aktif
      if (Array.isArray(acc.enrolledRegistrationNumbers)) {
        for (const rn of acc.enrolledRegistrationNumbers) {
          if (registeredRegNos.has(rn.toUpperCase().trim())) return false;
        }
      }

      return true;
    });
  }, [studentAccounts, registrations]);

  // Filtered calon santri belum pilih level (berdasarkan search query dan filter gender)
  const filteredUnselectedAccounts = useMemo(() => {
    const q = unselectedSearchQuery.trim().toLowerCase();
    return unselectedStudentAccounts.filter((acc) => {
      const matchGender =
        unselectedFilterGender === 'all' ||
        (acc.gender || 'Laki-laki') === unselectedFilterGender;
      if (!matchGender) return false;

      if (!q) return true;
      return (
        acc.fullName.toLowerCase().includes(q) ||
        acc.registrationNumber.toLowerCase().includes(q) ||
        acc.email.toLowerCase().includes(q) ||
        acc.whatsapp.toLowerCase().includes(q) ||
        (acc.city && acc.city.toLowerCase().includes(q)) ||
        (acc.occupation && acc.occupation.toLowerCase().includes(q))
      );
    });
  }, [unselectedStudentAccounts, unselectedSearchQuery, unselectedFilterGender]);

  const getRegistrationAngkatan = (r: RegistrationRecord): string => {
    const match = r.selectedProgramName?.match(/(Angkatan\s*\d+)/i);
    if (match) return match[1];
    const schedMatch = r.selectedScheduleSummary?.match(/(Angkatan\s*\d+)/i);
    if (schedMatch) return schedMatch[1];
    const prog = programs.find((p) => p.id === r.selectedProgramId);
    return prog?.angkatan || 'Angkatan 1';
  };

  const availableAngkatans = useMemo(() => {
    const set = new Set<string>();
    programs.forEach((p) => {
      if (p.angkatan) set.add(p.angkatan);
    });
    registrations.forEach((r) => {
      const match = r.selectedProgramName?.match(/(Angkatan\s*\d+)/i);
      if (match) set.add(match[1]);
      const schedMatch = r.selectedScheduleSummary?.match(/(Angkatan\s*\d+)/i);
      if (schedMatch) set.add(schedMatch[1]);
    });
    set.add('Angkatan 1');
    set.add('Angkatan 2');
    return Array.from(set).sort();
  }, [programs, registrations]);

  const INDO_MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dateStringToYMD = (dateStr?: string): string => {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 3) {
      const day = parseInt(parts[0], 10);
      const monthNames: Record<string, number> = {
        januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
        juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
      };
      const mStr = parts[1].toLowerCase();
      const month = monthNames[mStr] !== undefined ? monthNames[mStr] : -1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && month !== -1 && !isNaN(year)) {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${year}-${pad(month + 1)}-${pad(day)}`;
      }
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
    }
    return '';
  };

  const ymdToIndonesianDate = (ymd: string): string => {
    if (!ymd) return '';
    const parts = ymd.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      if (month >= 0 && month < 12 && !isNaN(day) && !isNaN(year)) {
        return `${day} ${INDO_MONTH_NAMES[month]} ${year}`;
      }
    }
    return ymd;
  };

  // Participant installment verification state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [verifyingRegistration, setVerifyingRegistration] = useState<RegistrationRecord | null>(null);
  const [paymentCountInput, setPaymentCountInput] = useState<number>(0);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentDateInput, setPaymentDateInput] = useState<string>('');
  const [paymentBankMethod, setPaymentBankMethod] = useState<string>('Bank Syariah Indonesia (BSI)');
  const [paymentAdminNote, setPaymentAdminNote] = useState<string>('');

  // Financial Report filtering state
  const [financeSearch, setFinanceSearch] = useState('');
  const [financeStatusFilter, setFinanceStatusFilter] = useState<'all' | 'lunas' | 'cicilan' | 'unpaid'>('all');
  const [financeLevelFilter, setFinanceLevelFilter] = useState<string>('all');

  // Operational Expense & Foundation Allocation State (Google Plus Rp 175.000/bln & Kas Lembaga 20%)
  const [googleMonthlyFee, setGoogleMonthlyFee] = useState<number>(175000);
  const [googleMonthsCount, setGoogleMonthsCount] = useState<number>(1);

  // Start date state for programs Level 1 - 4
  const [levelStartDates, setLevelStartDates] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    for (const p of programs) {
      initialMap[p.id] = p.startDate || DEFAULT_PROGRAM_START_DATES[p.id] || '19 November 2026';
    }
    return initialMap;
  });

  useEffect(() => {
    setLevelStartDates((prev) => {
      const next = { ...prev };
      for (const p of programs) {
        if (!next[p.id] || p.startDate) {
          next[p.id] = p.startDate || next[p.id] || DEFAULT_PROGRAM_START_DATES[p.id] || '19 November 2026';
        }
      }
      return next;
    });
  }, [programs]);

  // Weekly Lesson Access Control State (Buka / Kunci Materi per Pekan)
  const [pekanUnlockVersion, setPekanUnlockVersion] = useState<number>(0);

  useEffect(() => {
    syncPekanUnlockFromServer().catch(() => {});
    const onUnlockChange = () => setPekanUnlockVersion((v) => v + 1);
    const onVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        syncPekanUnlockFromServer().catch(() => {});
      }
    };
    window.addEventListener('pekan-unlock-updated', onUnlockChange);
    window.addEventListener('storage', onUnlockChange);
    document.addEventListener('visibilitychange', onVisibilityRefresh);
    return () => {
      window.removeEventListener('pekan-unlock-updated', onUnlockChange);
      window.removeEventListener('storage', onUnlockChange);
      document.removeEventListener('visibilitychange', onVisibilityRefresh);
    };
  }, []);

  // Attendance Session Permission Control State (Buka / Kunci Presensi per Pertemuan Kelas Online)
  const [attendanceUnlockVersion, setAttendanceUnlockVersion] = useState<number>(0);

  // Modal State for Sending Attendance Link to WhatsApp Group
  const [whatsappModalData, setWhatsappModalData] = useState<{
    program: ProgramTrack;
    schedule: ClassSchedule;
    meeting: ProgramOnlineMeeting;
    customNote: string;
  } | null>(null);

  useEffect(() => {
    syncAttendanceUnlockFromServer().catch(() => {});
    const onAttendanceUnlockChange = () => setAttendanceUnlockVersion((v) => v + 1);
    window.addEventListener('attendance-unlock-updated', onAttendanceUnlockChange);
    window.addEventListener('storage', onAttendanceUnlockChange);
    return () => {
      window.removeEventListener('attendance-unlock-updated', onAttendanceUnlockChange);
      window.removeEventListener('storage', onAttendanceUnlockChange);
    };
  }, []);

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
  const [materiSaveSuccess, setMateriSaveSuccess] = useState(false);
  const [materiSaveFeedback, setMateriSaveFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    setLocalCpanelConfig(cpanelConfig);
  }, [cpanelConfig]);

  const hasInitializedEditPageRef = useRef<boolean>(false);

  // Sync selected schedule editor
  useEffect(() => {
    if (pageMode === 'edit-jadwal') {
      if (hasInitializedEditPageRef.current || schedules.length === 0) return;
      try {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const urlScheduleId = params.get('scheduleId');
        const sourceId = params.get('sourceId');

        if (action === 'new') {
          const randomSuffix = Math.floor(100 + Math.random() * 900);
          const defaultProg = programs[0];
          const progId = defaultProg?.id || 'tl-level-1';
          const nextAngkatanNum = getNextAngkatanNumber(progId);
          const nextAngkatanLabel = `Angkatan ${nextAngkatanNum}`;
          const resolvedStart = defaultProg?.startDate || levelStartDates[progId] || 'Segera Dimulai';
          setEditingSchedule({
            id: `sch-custom-${randomSuffix}`,
            batchCode: `${defaultProg?.code || 'TL-LV1'}-A${nextAngkatanNum}`,
            programId: progId,
            levelNumber: defaultProg?.levelNumber || 1,
            programName: `${defaultProg?.title || 'Tadribul Lughah Level 1'} — ${nextAngkatanLabel}`,
            levelName: `Level ${defaultProg?.levelNumber || 1}`,
            modeLabel: 'Online Live Interaktif (Zoom)',
            days: defaultProg?.scheduleDays || 'Kamis & Jumat',
            timeWIB: defaultProg?.scheduleTime || '20.00 – 22.00 WIB',
            startDate: resolvedStart,
            instructor: 'Ust. Ahmad Fauzan, Lc., M.A.',
            capacity: 25,
            enrolled: 0,
            feeIDR: defaultProg?.tuitionIDR || 510000,
            angkatan: nextAngkatanLabel,
            className: '',
            registrationOpen: true
          });
          setIsScheduleEditModalOpen(true);
          hasInitializedEditPageRef.current = true;
          return;
        }

        if (action === 'duplicate' && sourceId) {
          const sourceSch = schedules.find((s) => s.id === sourceId);
          if (sourceSch) {
            const nextAngkatanNum = getNextAngkatanNumber(sourceSch.programId);
            const nextAngkatanLabel = `Angkatan ${nextAngkatanNum}`;
            const randomSuffix = Math.floor(100 + Math.random() * 900);
            const targetProg = programs.find((p) => p.id === sourceSch.programId);
            const baseCode = targetProg?.code || `TL-LV${sourceSch.levelNumber}`;
            const baseTitle = sourceSch.programName.replace(/\s*—\s*(Kelas|Angkatan)\s*\d+$/i, '');
            setEditingSchedule({
              ...sourceSch,
              id: `sch-lv${sourceSch.levelNumber}-a${nextAngkatanNum}-${randomSuffix}`,
              batchCode: `${baseCode}-A${nextAngkatanNum}`,
              programName: `${baseTitle} — ${nextAngkatanLabel}`,
              angkatan: nextAngkatanLabel,
              className: '',
              enrolled: 0,
              registrationOpen: true
            });
            setIsScheduleEditModalOpen(true);
            hasInitializedEditPageRef.current = true;
            return;
          }
        }

        if (urlScheduleId) {
          const matched = schedules.find((s) => s.id === urlScheduleId);
          if (matched) {
            const targetProg = programs.find((p) => p.id === matched.programId);
            setSelectedScheduleId(matched.id);
            setEditingSchedule({
              ...matched,
              angkatan: (matched.angkatan || '').trim() || targetProg?.angkatan?.trim() || 'Angkatan 1',
              className: '',
              registrationOpen: matched.registrationOpen !== false
            });
            setIsScheduleEditModalOpen(true);
            hasInitializedEditPageRef.current = true;
            return;
          }
          if (!editingSchedule && schedules[0]) {
            setEditingSchedule({ ...schedules[0], className: '' });
            setIsScheduleEditModalOpen(true);
          }
          return;
        }

        if (schedules[0]) {
          const first = schedules[0];
          const targetProg = programs.find((p) => p.id === first.programId);
          setSelectedScheduleId(first.id);
          setEditingSchedule({
            ...first,
            angkatan: (first.angkatan || '').trim() || targetProg?.angkatan?.trim() || 'Angkatan 1',
            className: '',
            registrationOpen: first.registrationOpen !== false
          });
          setIsScheduleEditModalOpen(true);
          hasInitializedEditPageRef.current = true;
        }
      } catch {
        // Ignore URL parsing errors
      }
      return;
    }

    const found =
      schedules.find((s) => s.id === selectedScheduleId) ||
      schedules[0] ||
      null;
    if (found) {
      setEditingSchedule({ ...found });
      setSelectedScheduleId(found.id);
    }
  }, [selectedScheduleId, schedules, pageMode]);

  // Sync separate Detail Level & Kurikulum editor with programs prop
  useEffect(() => {
    const foundProg =
      programs.find((p) => p.id === selectedKurikulumProgramId) || programs[0] || null;
    if (foundProg) {
      setEditingKurikulumProgram({ ...foundProg });
      setSelectedKurikulumProgramId(foundProg.id);
    }
  }, [selectedKurikulumProgramId, programs]);

  // Real registered participants for currently selected/editing schedule
  const registeredParticipantsForSchedule = useMemo(() => {
    if (!editingSchedule) return [];
    return registrations.filter(
      (r) =>
        r.selectedScheduleId === editingSchedule.id ||
        (r.selectedScheduleSummary && r.selectedScheduleSummary.includes(editingSchedule.batchCode)) ||
        (!r.selectedScheduleId && r.selectedProgramId === editingSchedule.programId)
    );
  }, [editingSchedule, registrations]);

  const scheduleRealEnrolledCount = registeredParticipantsForSchedule.length;

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
  const initialPekanVideoIdRef = useRef<string>('');
  const lastFetchedMetaKeyRef = useRef<string>('');
  const officialMetaRef = useRef<YouTubeVideoMetadata | null>(null);
  const autoMetaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editingMateriRef = useRef<WeeklyPekanData>(editingMateri);
  editingMateriRef.current = editingMateri;

  const [isFetchingYouTubeMeta, setIsFetchingYouTubeMeta] = useState<boolean>(false);
  const [youtubeMetaStatus, setYoutubeMetaStatus] = useState<string | null>(null);
  const [materiSyncVersion, setMateriSyncVersion] = useState<number>(0);
  const lastEditorKeyRef = useRef<string>('');

  useEffect(() => {
    syncCustomMateriFromServer().catch(() => {});
    const onMateriUpdated = () => setMateriSyncVersion((v) => v + 1);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncCustomMateriFromServer().catch(() => {});
      }
    };
    window.addEventListener('materi-updated', onMateriUpdated);
    window.addEventListener('storage', onMateriUpdated);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('materi-updated', onMateriUpdated);
      window.removeEventListener('storage', onMateriUpdated);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const editorKey = `${selectedMateriProgramId}::${selectedMateriPekan}`;
    const switchedTarget = lastEditorKeyRef.current !== editorKey;
    lastEditorKeyRef.current = editorKey;

    const loaded = getWeeklyPekanContent(selectedMateriProgramId, selectedMateriPekan);
    setEditingMateri(loaded);
    initialPekanVideoIdRef.current = getPekanYouTubeId(loaded);
    if (switchedTarget) {
      officialMetaRef.current = null;
      setYoutubeMetaStatus(null);
      if (autoMetaTimerRef.current) {
        clearTimeout(autoMetaTimerRef.current);
        autoMetaTimerRef.current = null;
      }
    }
  }, [selectedMateriProgramId, selectedMateriPekan, materiSyncVersion]);

  const handleFetchYouTubeVideoMeta = async (
    rawYoutubeInput?: string,
    progIdOverride?: string,
    pekanOverride?: number
  ) => {
    const targetProgId = progIdOverride || selectedMateriProgramId;
    const targetPekan = pekanOverride || selectedMateriPekan;
    const targetInput = (rawYoutubeInput ?? editingMateriRef.current.youtubeVideoId ?? '').trim();
    const ytId = extractOptionalYouTubeId(targetInput);
    if (!ytId) return null;

    const metaKey = `${targetProgId}-pekan-${targetPekan}::${ytId}`;
    lastFetchedMetaKeyRef.current = metaKey;
    setIsFetchingYouTubeMeta(true);
    setYoutubeMetaStatus('Mengambil judul & nama channel video dari YouTube...');
    try {
      const meta = await fetchYouTubeMetadata(targetInput);
      if (meta) {
        officialMetaRef.current = meta;
        setEditingMateri((prev) => ({
          ...prev,
          youtubeTitle: meta.title || prev.youtubeTitle,
          youtubeChannel: meta.channel || prev.youtubeChannel
        }));
        setYoutubeMetaStatus(
          `✓ Judul (${meta.title || '-'}) & Channel (${meta.channel || '-'}) terisi otomatis dari YouTube`
        );
        return meta;
      }
      setYoutubeMetaStatus('Video ID dikenali (judul & channel dapat diisi manual jika video unlisted/dibatasi).');
      return null;
    } catch {
      setYoutubeMetaStatus(null);
      return null;
    } finally {
      setIsFetchingYouTubeMeta(false);
    }
  };

  const handleYouTubeInputChangeWithAutoFill = (nextValue: string) => {
    setEditingMateri((prev) => ({
      ...prev,
      youtubeVideoId: nextValue
    }));

    if (autoMetaTimerRef.current) {
      clearTimeout(autoMetaTimerRef.current);
      autoMetaTimerRef.current = null;
    }

    if (!isValidYouTubeVideoInput(nextValue)) return;

    const nextYtId = extractOptionalYouTubeId(nextValue);
    const capturedProgId = selectedMateriProgramId;
    const capturedPekan = selectedMateriPekan;
    const metaKey = `${capturedProgId}-pekan-${capturedPekan}::${nextYtId}`;

    if (
      nextYtId &&
      nextYtId !== initialPekanVideoIdRef.current &&
      lastFetchedMetaKeyRef.current !== metaKey
    ) {
      autoMetaTimerRef.current = setTimeout(() => {
        handleFetchYouTubeVideoMeta(nextValue, capturedProgId, capturedPekan);
      }, 350);
    }
  };

  const handleSaveMateri = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setIsSaving(true);
    setMateriSaveFeedback(null);
    try {
      const rawYt = (editingMateri.youtubeVideoId || '').trim();
      const cleanedYtId = extractOptionalYouTubeId(rawYt) || rawYt;
      const cleanedAudioItems = (editingMateri.audioItems || [])
        .map((item, idx) => ({
          ...item,
          id: item.id || `audio-${Date.now()}-${idx}`,
          title: (item.title || '').trim() || `Audio Mendengar #${idx + 1}`,
          arabicTitle: (item.arabicTitle || '').trim(),
          driveUrl: (item.driveUrl || '').trim(),
          duration: (item.duration || '').trim(),
          notes: (item.notes || '').trim()
        }))
        .filter((item) => item.driveUrl.length > 0);
      const cleanedData: WeeklyPekanData = {
        ...editingMateri,
        youtubeVideoId: cleanedYtId,
        youtubeTitle: (editingMateri.youtubeTitle || editingMateri.videoTitle || '').trim(),
        youtubeChannel: (editingMateri.youtubeChannel || editingMateri.videoInstructor || '').trim(),
        videoDriveUrl: '',
        videoTitle: '',
        videoInstructor: '',
        audioItems: cleanedAudioItems,
        audioDriveUrl: cleanedAudioItems[0]?.driveUrl || '',
        audioTitle: cleanedAudioItems[0]?.title || '',
        pekanNumber: selectedMateriPekan
      };

      const syncResult = await saveCustomMateriOverride(selectedMateriProgramId, selectedMateriPekan, cleanedData);
      setEditingMateri(cleanedData);

      if (syncResult.syncedToServer) {
        setMateriSaveSuccess(true);
        setMateriSaveFeedback({
          type: 'success',
          text: `Materi, Video & Latihan Pekan ke-${selectedMateriPekan} (${selectedMateriProgramId}) berhasil disimpan & tersinkron ke server untuk seluruh perangkat!`
        });

        showToast(
          'success',
          `Materi & Video Pekan ke-${selectedMateriPekan} berhasil tersimpan ke server!`
        );
      } else {
        setMateriSaveSuccess(false);
        const warnText = `Perubahan tersimpan di browser ini, TETAPI gagal sinkron ke server cPanel (${syncResult.error || 'api.php tidak merespons'}). Perangkat lain belum menerima pembaruan ini.`;
        setMateriSaveFeedback({
          type: 'error',
          text: warnText
        });
        showToast('error', warnText);
      }

      setTimeout(() => {
        setMateriSaveSuccess(false);
      }, 4000);
    } catch (err) {
      const errMsg = `Gagal menyimpan materi: ${err instanceof Error ? err.message : String(err)}`;
      setMateriSaveFeedback({
        type: 'error',
        text: errMsg
      });
      showToast('error', errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetMateri = async () => {
    if (window.confirm(`Kembalikan materi, video, dan latihan Pekan ${selectedMateriPekan} ke kurikulum bawaan standar?`)) {
      const syncResult = await resetCustomMateriOverride(selectedMateriProgramId, selectedMateriPekan);
      const standard = getWeeklyPekanContent(selectedMateriProgramId, selectedMateriPekan);
      setEditingMateri(standard);
      if (syncResult.syncedToServer) {
        setMateriSaveSuccess(true);
        setMateriSaveFeedback({
          type: 'success',
          text: `Materi Pekan ${selectedMateriPekan} berhasil dikembalikan ke standar bawaan di seluruh perangkat.`
        });
        showToast('success', `Materi Pekan ${selectedMateriPekan} berhasil dikembalikan ke standar awal.`);
      } else {
        setMateriSaveSuccess(false);
        const warnText = `Reset lokal berhasil, tetapi gagal sinkron ke server (${syncResult.error || 'api.php error'}).`;
        setMateriSaveFeedback({ type: 'error', text: warnText });
        showToast('error', warnText);
      }
      setTimeout(() => {
        setMateriSaveSuccess(false);
      }, 3500);
    }
  };

  // Quiz / Latihan Pekanan Management for SuperAdmin
  const handleAddQuizQuestion = () => {
    const currentList = editingMateri.quizzes || [];
    const nextId = currentList.length > 0 ? Math.max(...currentList.map((q) => q.id || 0)) + 1 : 1;
    const newQ: QuizQuestion = {
      id: nextId,
      question: '',
      arabicPrompt: '',
      options: [
        'Pilihan A',
        'Pilihan B',
        'Pilihan C',
        'Pilihan D'
      ],
      correctIndex: 0,
      explanation: '',
      points: 25
    };
    setEditingMateri({
      ...editingMateri,
      quizzes: [...currentList, newQ]
    });
    showToast('success', `Soal latihan #${nextId} berhasil ditambahkan! Silakan isi pertanyaan, opsi, dan kunci.`);
  };

  const handleUpdateQuizQuestion = (index: number, updated: Partial<QuizQuestion>) => {
    const currentList = [...(editingMateri.quizzes || [])];
    if (!currentList[index]) return;
    currentList[index] = { ...currentList[index], ...updated };
    setEditingMateri({
      ...editingMateri,
      quizzes: currentList
    });
  };

  const handleUpdateQuizOption = (qIndex: number, optIndex: number, value: string) => {
    const currentList = [...(editingMateri.quizzes || [])];
    if (!currentList[qIndex]) return;
    const currentOpts = [...(currentList[qIndex].options || ['', '', '', ''])];
    currentOpts[optIndex] = value;
    currentList[qIndex] = { ...currentList[qIndex], options: currentOpts };
    setEditingMateri({
      ...editingMateri,
      quizzes: currentList
    });
  };

  const handleDeleteQuizQuestion = (index: number) => {
    if (!window.confirm(`Hapus soal latihan #${index + 1}?`)) return;
    const currentList = [...(editingMateri.quizzes || [])];
    currentList.splice(index, 1);
    const reindexed = currentList.map((q, idx) => ({ ...q, id: idx + 1 }));
    setEditingMateri({
      ...editingMateri,
      quizzes: reindexed
    });
    showToast('success', `Soal latihan berhasil dihapus.`);
  };

  const handleMoveQuizQuestion = (index: number, direction: 'up' | 'down') => {
    const currentList = [...(editingMateri.quizzes || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;
    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;
    const reindexed = currentList.map((q, idx) => ({ ...q, id: idx + 1 }));
    setEditingMateri({
      ...editingMateri,
      quizzes: reindexed
    });
  };

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 5500);
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

  const handleSaveLevelStartDate = async (programId: string, newDate: string) => {
    const trimmed = newDate.trim();
    if (!trimmed) {
      showToast('error', 'Tanggal mulai program tidak boleh kosong.');
      return;
    }
    setIsSaving(true);
    try {
      saveProgramStartDate(programId, trimmed);
      const prog = programs.find((p) => p.id === programId);
      if (prog) {
        const updatedProg: ProgramTrack = { ...prog, startDate: trimmed };
        await onSaveProgram(updatedProg);
      }
      const sch = schedules.find(
        (s) => s.programId === programId || (prog && s.levelNumber === prog.levelNumber)
      );
      if (sch) {
        await onSaveSchedule({ ...sch, startDate: trimmed });
      }
      setLevelStartDates((prev) => ({ ...prev, [programId]: trimmed }));
      showToast(
        'success',
        `Jadwal mulai ${prog ? prog.title : programId} berhasil diatur ke "${trimmed}" dan tersinkron ke seluruh sistem!`
      );
    } catch (err) {
      showToast(
        'error',
        `Gagal menyimpan jadwal mulai: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllLevelStartDates = async () => {
    setIsSaving(true);
    try {
      for (const p of programs.slice(0, 4)) {
        const dateVal = (
          levelStartDates[p.id] ||
          p.startDate ||
          DEFAULT_PROGRAM_START_DATES[p.id] ||
          '19 November 2026'
        ).trim();
        saveProgramStartDate(p.id, dateVal);
        const updatedProg: ProgramTrack = { ...p, startDate: dateVal };
        await onSaveProgram(updatedProg);
        const sch = schedules.find(
          (s) => s.programId === p.id || s.levelNumber === p.levelNumber
        );
        if (sch) {
          await onSaveSchedule({ ...sch, startDate: dateVal });
        }
      }
      showToast(
        'success',
        'Seluruh jadwal mulai program Level 1 – 4 berhasil disimpan dan disinkronkan ke cPanel, database, dan portal santri!'
      );
    } catch (err) {
      showToast(
        'error',
        `Gagal menyimpan seluruh jadwal: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formatScheduleToastTag = (scheduleId?: string): string => {
    if (!scheduleId) return '';
    const found = schedules.find((s) => s.id === scheduleId);
    if (!found) return ` [${scheduleId}]`;
    const angkatanTag = found.angkatan?.trim() || 'Angkatan 1';
    return ` [${found.batchCode} · ${angkatanTag}]`;
  };

  const handleTogglePekanUnlock = (
    programId: string,
    pekanNumber: number,
    scheduleId?: string
  ) => {
    const currentlyUnlocked = isPekanUnlocked(programId, pekanNumber, scheduleId);
    const nextState = !currentlyUnlocked;
    savePekanUnlockState(programId, pekanNumber, nextState, scheduleId);
    setPekanUnlockVersion((v) => v + 1);
    const tag = formatScheduleToastTag(scheduleId);
    showToast(
      'success',
      nextState
        ? `Materi Pekan ke-${pekanNumber}${tag} diubah menjadi ON (Dibuka untuk santri kelas ini).`
        : `Materi Pekan ke-${pekanNumber}${tag} diubah menjadi OFF (Ditutup/Dikunci untuk santri kelas ini).`
    );
  };

  const getScheduleMateriProgress = (programId: string, scheduleId?: string) => {
    const pekans = getProgramPekanList(programId, scheduleId);
    const unlockedPekans = pekans.filter((p) =>
      isPekanUnlocked(programId, p.pekanNumber, scheduleId)
    );
    const unlockedCount = unlockedPekans.length;
    const totalCount = pekans.length;
    const highestPekan =
      unlockedPekans.length > 0 ? unlockedPekans[unlockedPekans.length - 1] : null;
    const pct = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
    return { pekans, unlockedCount, totalCount, highestPekan, pct };
  };

  const handleBatchUnlockUpTo = (
    programId: string,
    maxPekan: number,
    scheduleId?: string
  ) => {
    const total = getProgramTotalPekan(programId);
    const clampedMax = Math.max(0, Math.min(total, maxPekan));
    setPekanUnlockBatch(programId, clampedMax, total, scheduleId);
    setPekanUnlockVersion((v) => v + 1);
    const tag = formatScheduleToastTag(scheduleId);
    showToast(
      'success',
      clampedMax <= 0
        ? `Seluruh materi (${total} Pekan)${tag} diubah menjadi OFF (Terkunci).`
        : `Materi Pekan 1 s/d Pekan ${clampedMax}${tag} diset ON (Dibuka). Pekan ${clampedMax + 1} s/d ${total} otomatis OFF.`
    );
  };

  const handleUnlockAllPekans = (programId: string, scheduleId?: string) => {
    const total = getProgramTotalPekan(programId);
    setAllPekansUnlockState(programId, true, total, scheduleId);
    setPekanUnlockVersion((v) => v + 1);
    const tag = formatScheduleToastTag(scheduleId);
    showToast(
      'success',
      `Seluruh materi (Pekan 1 s/d ${total})${tag} berhasil diset ON (Dibuka) untuk santri.`
    );
  };

  const handleLockAllExceptFirst = (programId: string, scheduleId?: string) => {
    const total = getProgramTotalPekan(programId);
    setPekanUnlockBatch(programId, 1, total, scheduleId);
    setPekanUnlockVersion((v) => v + 1);
    const tag = formatScheduleToastTag(scheduleId);
    showToast(
      'success',
      `Hanya Pekan 1${tag} yang ON. Materi Pekan 2 s/d ${total} berhasil diset OFF.`
    );
  };

  const handleToggleAttendanceSessionUnlock = (programId: string, sessionNumber: number) => {
    const isUnlocked = isAttendanceSessionUnlocked(programId, sessionNumber);
    const nextState = !isUnlocked;
    saveAttendanceSessionUnlockState(programId, sessionNumber, nextState);
    setAttendanceUnlockVersion((v) => v + 1);
    showToast(
      'success',
      nextState
        ? `Izin Presensi Pertemuan ke-${sessionNumber} berhasil DIIZINKAN (DIBUKA). Santri sekarang dapat mengisi presensi untuk sesi ini.`
        : `Izin Presensi Pertemuan ke-${sessionNumber} berhasil DIKUNCI (DITUTUP). Santri tidak dapat mengisi presensi sesi ini.`
    );
  };

  const handleBatchUnlockAttendanceUpTo = (programId: string, maxSession: number, totalSessions: number) => {
    setAttendanceSessionUnlockBatch(programId, maxSession, totalSessions);
    setAttendanceUnlockVersion((v) => v + 1);
    showToast(
      'success',
      `Presensi Pertemuan 1 s/d Pertemuan ${maxSession} berhasil DIIZINKAN untuk santri. Pertemuan setelahnya dikunci.`
    );
  };

  const handleUnlockAllAttendanceSessions = (programId: string, totalSessions: number) => {
    setAllAttendanceSessionsUnlockState(programId, true, totalSessions);
    setAttendanceUnlockVersion((v) => v + 1);
    showToast('success', `Seluruh presensi (Pertemuan 1 s/d ${totalSessions}) berhasil DIIZINKAN untuk santri.`);
  };

  const handleLockAllAttendanceSessions = (programId: string, totalSessions: number) => {
    setAllAttendanceSessionsUnlockState(programId, false, totalSessions);
    setAttendanceUnlockVersion((v) => v + 1);
    showToast('success', `Seluruh presensi Pertemuan 1 s/d ${totalSessions} berhasil DIKUNCI (Santri tidak dapat absen).`);
  };

  const getBaseAttendanceUrl = () => {
    if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')) {
      return window.location.origin;
    }
    return 'https://elmumtaz.web-id.id';
  };

  const buildAttendanceWhatsAppText = (
    program: ProgramTrack,
    schedule: ClassSchedule,
    meeting: ProgramOnlineMeeting,
    customNote?: string
  ) => {
    const url = `${getBaseAttendanceUrl()}/pelajar.html?tab=absensi&session=${meeting.sessionNumber}`;
    let text = `*MA'HAD AL-BAYAN — TADRIBUL LUGHAH*\n`;
    text += `*PRESENSI KEHADIRAN KELAS LIVE ONLINE SELESAI*\n\n`;
    text += `Bismillah,\nAlhamdulillah telah selesai sesi tatap muka kelas online:\n\n`;
    text += `📚 *Program:* ${program.title} (${schedule.batchCode || program.code})\n`;
    text += `🗓️ *Sesi:* Pertemuan Ke-${meeting.sessionNumber} (Pekan Ke-${meeting.pekanNumber})\n`;
    text += `📖 *Topik Materi:* ${meeting.title}\n`;
    if (meeting.arabicTitle) {
      text += `   (${meeting.arabicTitle})\n`;
    }
    text += `⏰ *Waktu:* ${meeting.dateStr} · ${meeting.timeWIB}\n`;
    text += `👨‍🏫 *Mudarris:* ${schedule.instructor || 'Ustadz Pengampu'}\n\n`;

    if (customNote && customNote.trim()) {
      text += `📢 *Catatan Pengajar / Admin:*\n${customNote.trim()}\n\n`;
    }

    text += `Kepada seluruh ikhwah/akhawat santri peserta kelas ini, silakan segera mengisi formulir presensi kehadiran melalui tautan resmi berikut:\n\n`;
    text += `👉 *Link Presensi:* \n${url}\n\n`;
    text += `📌 *Petunjuk Presensi:*\n`;
    text += `1. Klik link di atas (login otomatis dengan akun santri Anda).\n`;
    text += `2. Formulir presensi Pertemuan ${meeting.sessionNumber} akan langsung terbuka.\n`;
    text += `3. Pilih status kehadiran (🟢 Hadir / 🟡 Izin / 🔵 Sakit) lalu klik Simpan.\n`;
    text += `4. Kehadiran minimal 75% merupakan syarat kelulusan dan evaluasi akhir.\n\n`;
    text += `Jazakumullahu khairan wa barakallahu fiikum.`;
    return { text, url };
  };

  const handleOpenAttendanceWhatsAppModal = (
    program: ProgramTrack,
    schedule: ClassSchedule,
    meeting: ProgramOnlineMeeting
  ) => {
    if (!isAttendanceSessionUnlocked(program.id, meeting.sessionNumber)) {
      saveAttendanceSessionUnlockState(program.id, meeting.sessionNumber, true);
      setAttendanceUnlockVersion((v) => v + 1);
    }
    setWhatsappModalData({
      program,
      schedule,
      meeting,
      customNote: ''
    });
  };

  const handleQuickCopyAttendanceWA = (
    program: ProgramTrack,
    schedule: ClassSchedule,
    meeting: ProgramOnlineMeeting
  ) => {
    if (!isAttendanceSessionUnlocked(program.id, meeting.sessionNumber)) {
      saveAttendanceSessionUnlockState(program.id, meeting.sessionNumber, true);
      setAttendanceUnlockVersion((v) => v + 1);
    }
    const { text } = buildAttendanceWhatsAppText(program, schedule, meeting);
    navigator.clipboard.writeText(text);
    showToast(
      'success',
      `Teks pengumuman & link presensi Pertemuan ${meeting.sessionNumber} berhasil disalin ke clipboard! Siap ditempel di grup WhatsApp.`
    );
  };

  const handleQuickSendAttendanceWA = (
    program: ProgramTrack,
    schedule: ClassSchedule,
    meeting: ProgramOnlineMeeting
  ) => {
    if (!isAttendanceSessionUnlocked(program.id, meeting.sessionNumber)) {
      saveAttendanceSessionUnlockState(program.id, meeting.sessionNumber, true);
      setAttendanceUnlockVersion((v) => v + 1);
    }
    const { text } = buildAttendanceWhatsAppText(program, schedule, meeting);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    showToast('success', `Membuka WhatsApp untuk mengirim link presensi Pertemuan ${meeting.sessionNumber}...`);
  };

  const handleToggleScheduleRegistration = async (sch: ClassSchedule) => {
    const nextOpenState = !isScheduleRegistrationOpen(sch);
    const angkatanLabel = sch.angkatan?.trim() || 'Angkatan 1';
    const updatedSchedule: ClassSchedule = {
      ...sch,
      registrationOpen: nextOpenState
    };
    setIsSaving(true);
    setStatusMessage(null);
    try {
      if (editingSchedule && editingSchedule.id === sch.id) {
        setEditingSchedule(updatedSchedule);
      }
      saveScheduleOverride(updatedSchedule);
      await onSaveSchedule(updatedSchedule);

      const targetProg =
        programs.find((p) => p.id === sch.programId || p.levelNumber === sch.levelNumber) ||
        programs[0];
      if (targetProg) {
        const sameLevelSchedules = schedules.filter((s) => s.programId === targetProg.id);
        const anyOpenInLevel =
          sameLevelSchedules.length > 0
            ? sameLevelSchedules.some((s) =>
                s.id === sch.id ? nextOpenState : isScheduleRegistrationOpen(s)
              )
            : nextOpenState;
        const syncedProg: ProgramTrack = {
          ...targetProg,
          registrationOpen: anyOpenInLevel
        };
        await onSaveProgram(syncedProg);
      }

      showToast(
        'success',
        `Pendaftaran kelas ${sch.batchCode} (${angkatanLabel}) berhasil diubah menjadi ${
          nextOpenState ? 'ON (Dibuka)' : 'OFF (Ditutup)'
        }. Angkatan lain tidak terpengaruh.`
      );
    } catch (err) {
      showToast(
        'error',
        `Gagal mengubah status pendaftaran kelas: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDetailKurikulumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKurikulumProgram) return;
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const latestProg =
        programs.find((p) => p.id === editingKurikulumProgram.id) || editingKurikulumProgram;
      const resolvedModeLabel =
        (editingKurikulumProgram.modeLabel || '').trim() || 'Online Live Interaktif (Zoom)';
      const progToSave: ProgramTrack = {
        ...latestProg,
        title: editingKurikulumProgram.title,
        arabicTitle: editingKurikulumProgram.arabicTitle,
        category: editingKurikulumProgram.category,
        categoryLabel: editingKurikulumProgram.categoryLabel,
        durationWeeks: editingKurikulumProgram.durationWeeks,
        sessionsCount: editingKurikulumProgram.durationWeeks * 2,
        kitabReference: editingKurikulumProgram.kitabReference,
        levelRecommendation: editingKurikulumProgram.levelRecommendation,
        summary: editingKurikulumProgram.summary,
        targetOutcome: editingKurikulumProgram.targetOutcome,
        scheduleDays: editingKurikulumProgram.scheduleDays,
        scheduleTime: editingKurikulumProgram.scheduleTime,
        tuitionIDR: editingKurikulumProgram.tuitionIDR,
        modeLabel: resolvedModeLabel
      };

      await onSaveProgram(progToSave);
      const levelSchedules = schedules.filter((s) => s.programId === progToSave.id);
      for (const sch of levelSchedules) {
        const syncedSch: ClassSchedule = {
          ...sch,
          feeIDR: progToSave.tuitionIDR,
          modeLabel: resolvedModeLabel
        };
        saveScheduleOverride(syncedSch);
        await onSaveSchedule(syncedSch);
      }

      setEditingKurikulumProgram(progToSave);
      showToast(
        'success',
        `Detail Level & Kurikulum Level ${progToSave.levelNumber} (${progToSave.code}) berhasil disimpan dan disinkronkan ke index.html!`
      );
    } catch (err) {
      showToast(
        'error',
        `Gagal menyimpan detail kurikulum: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const parseAngkatanNumber = (label?: string): number => {
    const match = String(label || '').match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const normalizeAngkatanKey = (label?: string, fallback?: string): string => {
    const cleaned = (label || '').trim() || (fallback || '').trim() || 'Angkatan 1';
    return cleaned.toLowerCase().replace(/\s+/g, ' ');
  };

  const getNextAngkatanNumber = (programId: string, excludeScheduleId?: string): number => {
    const prog = programs.find((p) => p.id === programId);
    const sameLevelSchedules = schedules.filter(
      (s) => s.programId === programId && s.id !== excludeScheduleId
    );
    if (sameLevelSchedules.length === 0) {
      const progNum = parseAngkatanNumber(prog?.angkatan);
      return progNum > 0 ? progNum : 1;
    }
    const maxSchNum = sameLevelSchedules.reduce((max, s) => {
      const n = parseAngkatanNumber(s.angkatan || prog?.angkatan || 'Angkatan 1');
      return n > max ? n : max;
    }, 0);
    return Math.max(1, maxSchNum) + 1;
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const targetProg =
        programs.find((p) => p.id === editingSchedule.programId) || programs[0];
      const resolvedAngkatan =
        (editingSchedule.angkatan || '').trim() ||
        targetProg?.angkatan?.trim() ||
        'Angkatan 1';
      const targetKey = normalizeAngkatanKey(resolvedAngkatan);

      const conflictingSchedule = schedules.find((s) => {
        if (s.programId !== editingSchedule.programId || s.id === editingSchedule.id) {
          return false;
        }
        const existingKey = normalizeAngkatanKey(
          s.angkatan,
          targetProg?.angkatan || 'Angkatan 1'
        );
        return existingKey === targetKey;
      });

      if (conflictingSchedule) {
        const nextSuggested = getNextAngkatanNumber(
          editingSchedule.programId,
          editingSchedule.id
        );
        showToast(
          'error',
          `Aturan 1 Angkatan = 1 Kelas: ${targetProg?.title || 'Level ini'} sudah memiliki jadwal untuk "${resolvedAngkatan}" (${conflictingSchedule.batchCode}). Silakan gunakan angkatan berikutnya (misal: Angkatan ${nextSuggested}).`
        );
        setIsSaving(false);
        return;
      }

      const resolvedStartDate =
        (editingSchedule.startDate || '').trim() ||
        levelStartDates[editingSchedule.programId] ||
        DEFAULT_PROGRAM_START_DATES[editingSchedule.programId] ||
        '19 November 2026';

      const scheduleToSave: ClassSchedule = {
        ...editingSchedule,
        startDate: resolvedStartDate,
        enrolled: scheduleRealEnrolledCount,
        meetingLink: (editingSchedule.meetingLink || '').trim(),
        meetingPlatform: (editingSchedule.meetingPlatform || 'Google Meet').trim(),
        meetingNotes: (editingSchedule.meetingNotes || '').trim(),
        angkatan: resolvedAngkatan,
        className: ''
      };
      saveScheduleOverride(scheduleToSave);
      await onSaveSchedule(scheduleToSave);

      showToast(
        'success',
        `Jadwal kelas ${scheduleToSave.batchCode} (${scheduleToSave.angkatan}) & Tautan ${scheduleToSave.meetingPlatform || 'Google Meet'} berhasil disimpan!`
      );
      if (pageMode === 'edit-jadwal') {
        setSelectedScheduleId(scheduleToSave.id);
        setEditingSchedule(scheduleToSave);
        try {
          window.history.replaceState(
            {},
            '',
            `./edit-jadwal.html?scheduleId=${encodeURIComponent(scheduleToSave.id)}`
          );
        } catch {
          // Ignore
        }
      } else {
        setIsScheduleEditModalOpen(false);
      }
    } catch (err) {
      showToast(
        'error',
        `Gagal menyimpan jadwal: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditScheduleModal = (sch: ClassSchedule) => {
    if (pageMode !== 'edit-jadwal') {
      window.location.href = `./edit-jadwal.html?scheduleId=${encodeURIComponent(sch.id)}`;
      return;
    }
    setSelectedScheduleId(sch.id);
    const targetProg = programs.find((p) => p.id === sch.programId);
    const resolvedStart =
      (sch.startDate || '').trim() ||
      targetProg?.startDate ||
      levelStartDates[sch.programId] ||
      '19 November 2026';
    setEditingSchedule({
      ...sch,
      startDate: resolvedStart,
      angkatan: (sch.angkatan || '').trim() || targetProg?.angkatan?.trim() || 'Angkatan 1',
      className: '',
      registrationOpen: sch.registrationOpen !== false
    });
    setIsDeleteScheduleConfirmOpen(false);
    setIsScheduleEditModalOpen(true);
    try {
      window.history.replaceState(
        {},
        '',
        `./edit-jadwal.html?scheduleId=${encodeURIComponent(sch.id)}`
      );
    } catch {
      // Ignore
    }
  };

  const handleCreateNewSchedule = () => {
    window.location.href = './edit-jadwal.html?action=new';
  };

  const handleAddNextAngkatanSchedule = (sourceSch: ClassSchedule) => {
    window.location.href = `./edit-jadwal.html?action=duplicate&sourceId=${encodeURIComponent(sourceSch.id)}`;
  };

  const handleRequestDeleteSchedule = () => {
    if (!editingSchedule) return;
    if (schedules.length <= 1) {
      showToast('error', 'Minimal harus ada 1 jadwal kelas aktif.');
      return;
    }
    setIsDeleteScheduleConfirmOpen(true);
  };

  const handleDeleteCurrentSchedule = async () => {
    if (!editingSchedule) return;
    if (schedules.length <= 1) {
      setIsDeleteScheduleConfirmOpen(false);
      showToast('error', 'Minimal harus ada 1 jadwal kelas aktif.');
      return;
    }
    setIsSaving(true);
    try {
      await onDeleteSchedule(editingSchedule.id);
      showToast(
        'success',
        `Kelas ${editingSchedule.batchCode}${editingSchedule.angkatan ? ` (${editingSchedule.angkatan})` : ''} berhasil dihapus.`
      );
      setIsDeleteScheduleConfirmOpen(false);
      setIsScheduleEditModalOpen(false);
      if (pageMode === 'edit-jadwal') {
        setTimeout(() => {
          window.location.href = './superadmin.html?tab=schedules';
        }, 450);
      }
    } catch (err) {
      showToast(
        'error',
        `Gagal menghapus kelas: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegistration) return;

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

  const handleConfirmDeleteRegistration = async () => {
    if (!deletingRegistrationTarget) return;
    const target = deletingRegistrationTarget;
    setIsSaving(true);
    try {
      await onDeleteRegistration(target.registrationNumber);
      if (editingRegistration?.registrationNumber === target.registrationNumber) {
        setIsDetailModalOpen(false);
        setEditingRegistration(null);
      }
      setDeletingRegistrationTarget(null);
      showToast(
        'success',
        `Data peserta "${target.fullName}" (${target.registrationNumber}) berhasil dihapus.`
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

  const handleOpenDetailModal = (record: RegistrationRecord) => {
    setEditingRegistration({ ...record });
    setSelectedRegNo(record.registrationNumber);
    setIsDetailModalOpen(true);
  };

  const handleOpenPaymentModal = (record: RegistrationRecord) => {
    setVerifyingRegistration({ ...record });
    const totalTuition = record.totalTuitionIDR || 510000;
    const monthly = Math.round(totalTuition / 6);
    const currentPaid = typeof record.paidTuitionIDR === 'number'
      ? record.paidTuitionIDR
      : 0;
    const currentCount = typeof record.installmentPaidCount === 'number'
      ? record.installmentPaidCount
      : Math.min(6, Math.floor(currentPaid / (monthly || 85000)));

    setPaymentCountInput(currentCount);
    setPaymentAmountInput(currentPaid);

    const nowStr = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date());
    setPaymentDateInput(nowStr);
    setPaymentAdminNote(record.lastPaymentDate || '');
    setIsPaymentModalOpen(true);
  };

  const handleQuickSetInstallment = (count: number) => {
    if (!verifyingRegistration) return;
    const totalTuition = verifyingRegistration.totalTuitionIDR || 510000;
    const monthly = Math.round(totalTuition / 6);
    const clampedCount = Math.max(0, Math.min(6, count));
    const calculatedPaid = clampedCount === 6 ? totalTuition : clampedCount * monthly;
    setPaymentCountInput(clampedCount);
    setPaymentAmountInput(calculatedPaid);
  };

  const handleSavePaymentVerification = async () => {
    if (!verifyingRegistration) return;
    setIsSaving(true);
    setStatusMessage(null);

    const totalTuition = verifyingRegistration.totalTuitionIDR || 510000;
    const isLunas = paymentCountInput >= 6 || paymentAmountInput >= totalTuition;
    const noteStr = `${paymentDateInput} · ${paymentBankMethod}${paymentAdminNote.trim() ? ` (${paymentAdminNote.trim()})` : ''}`;

    const updatedRecord: RegistrationRecord = {
      ...verifyingRegistration,
      paidTuitionIDR: paymentAmountInput,
      installmentPaidCount: paymentCountInput,
      paymentPlan: isLunas ? 'lunas' : 'cicilan',
      lastPaymentDate: noteStr
    };

    try {
      await onSaveRegistration(updatedRecord);
      if (editingRegistration?.registrationNumber === updatedRecord.registrationNumber) {
        setEditingRegistration(updatedRecord);
      }
      setVerifyingRegistration(updatedRecord);
      showToast(
        'success',
        `Pembayaran ${updatedRecord.fullName} (${updatedRecord.registrationNumber}) berhasil diverifikasi: ${paymentCountInput}/6 Cicilan (${formatIDR(paymentAmountInput)}).`
      );
      setIsPaymentModalOpen(false);
    } catch (err) {
      showToast(
        'error',
        `Gagal menyimpan verifikasi pembayaran: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSaving(false);
    }
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
      selectedProgramName: `${defaultProg?.title || 'Tadribul Lughah Level 1'} (${defaultProg?.angkatan || 'Angkatan 1'})`,
      selectedScheduleId: defaultSch?.id || 'sch-lv1-malam',
      selectedScheduleSummary: `${defaultSch?.batchCode || 'TL-LV1-M'} · ${defaultSch?.days || 'Kamis & Jumat'} (20.00 – 22.00 WIB)`,
      learningGoal: 'Memperdalam kaidah bahasa Arab dan membaca kitab gundul.',
      totalTuitionIDR: defaultProg?.tuitionIDR || 510000,
      paidTuitionIDR: 0,
      installmentPaidCount: 0,
      paymentPlan: 'cicilan',
      registeredAt: nowStr
    };
    setEditingRegistration(newRecord);
    setSelectedRegNo(newRecord.registrationNumber);
    setIsDetailModalOpen(true);
  };

  const filteredRegistrations = registrations.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    const angkatan = getRegistrationAngkatan(r);
    const matchesSearch =
      !q ||
      r.fullName.toLowerCase().includes(q) ||
      r.registrationNumber.toLowerCase().includes(q) ||
      r.whatsapp.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.selectedProgramName.toLowerCase().includes(q) ||
      angkatan.toLowerCase().includes(q) ||
      (r.gender || 'Laki-laki').toLowerCase().includes(q);

    const matchesLevel =
      filterLevel === 'all' || r.selectedProgramId === filterLevel;

    const matchesAngkatan =
      filterAngkatan === 'all' ||
      angkatan.toLowerCase() === filterAngkatan.toLowerCase();

    const total = r.totalTuitionIDR || 510000;
    const monthly = Math.round(total / 6);
    const paid = typeof r.paidTuitionIDR === 'number' ? r.paidTuitionIDR : 0;
    const count = typeof r.installmentPaidCount === 'number'
      ? r.installmentPaidCount
      : Math.min(6, Math.floor(paid / (monthly || 85000)));
    const remaining = Math.max(0, total - paid);
    const isLunas = count >= 6 || (paid >= total && total > 0);

    let matchesPayment = true;
    if (filterPayment === 'unpaid') {
      matchesPayment = count === 0 && paid === 0;
    } else if (filterPayment === 'cicilan') {
      matchesPayment = count > 0 && !isLunas;
    } else if (filterPayment === 'lunas') {
      matchesPayment = isLunas;
    }

    const matchesGender =
      filterGender === 'all' ||
      (r.gender || 'Laki-laki').toLowerCase() === filterGender.toLowerCase();

    return matchesSearch && matchesLevel && matchesAngkatan && matchesPayment && matchesGender;
  });

  const totalPeserta = registrations.length;
  const totalIkhwan = registrations.filter(
    (r) => (r.gender || 'Laki-laki') === 'Laki-laki'
  ).length;
  const totalAkhwat = registrations.filter(
    (r) => r.gender === 'Perempuan'
  ).length;
  const totalLunas = registrations.filter((r) => {
    const total = r.totalTuitionIDR || 510000;
    const paid = typeof r.paidTuitionIDR === 'number' ? r.paidTuitionIDR : 0;
    const count = typeof r.installmentPaidCount === 'number' ? r.installmentPaidCount : 0;
    return count >= 6 || (paid >= total && total > 0);
  }).length;
  const totalBelumLunas = registrations.filter((r) => {
    const total = r.totalTuitionIDR || 510000;
    const paid = typeof r.paidTuitionIDR === 'number' ? r.paidTuitionIDR : 0;
    const count = typeof r.installmentPaidCount === 'number' ? r.installmentPaidCount : 0;
    return count === 0 && paid === 0;
  }).length;

  const handleExportCsv = () => {
    const headers = [
      'No Registrasi',
      'Nama Lengkap',
      'Jenis Kelamin',
      'Status Pembayaran',
      'Angkatan',
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
    const rows = filteredRegistrations.map((r) => {
      const total = r.totalTuitionIDR || 510000;
      const paid = typeof r.paidTuitionIDR === 'number' ? r.paidTuitionIDR : 0;
      const count = typeof r.installmentPaidCount === 'number' ? r.installmentPaidCount : 0;
      const isLunas = count >= 6 || (paid >= total && total > 0);
      const payStatusStr = isLunas ? 'Lunas Penuh (6/6)' : count > 0 ? `Cicilan ${count}/6` : 'Belum Lunas (Bulan 1)';

      return [
        `"${r.registrationNumber}"`,
        `"${r.fullName.replace(/"/g, '""')}"`,
        `"${r.gender || 'Laki-laki'}"`,
        `"${payStatusStr}"`,
        `"${getRegistrationAngkatan(r)}"`,
        `"${r.selectedProgramName.replace(/"/g, '""')}"`,
        `"${r.selectedScheduleSummary.replace(/"/g, '""')}"`,
        `"${r.whatsapp}"`,
        `"${r.email}"`,
        `"${r.city.replace(/"/g, '""')}"`,
        `"${r.occupation.replace(/"/g, '""')}"`,
        `"${r.totalTuitionIDR}"`,
        `"${r.registeredAt}"`,
        `"${(r.learningGoal || '').replace(/"/g, '""')}"`
      ];
    });

    const onlyParticipantsCsv =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([onlyParticipantsCsv], { type: 'text/csv;charset=utf-8;' });
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
      .map((r, idx) => {
        const total = r.totalTuitionIDR || 510000;
        const paid = typeof r.paidTuitionIDR === 'number' ? r.paidTuitionIDR : 0;
        const count = typeof r.installmentPaidCount === 'number' ? r.installmentPaidCount : 0;
        const isLunas = count >= 6 || (paid >= total && total > 0);
        const payStatusStr = isLunas ? 'Lunas Penuh (6/6)' : count > 0 ? `Cicilan ${count}/6` : 'Belum Lunas (Bulan 1)';

        return `${idx + 1}. [${r.registrationNumber}] ${r.fullName} (${r.gender || 'Laki-laki'}) · ${getRegistrationAngkatan(r)} · ${r.selectedProgramName} · WA: ${r.whatsapp} · Domisili: ${r.city} · Bayar: ${payStatusStr}`;
      })
      .join('\n');
    await handleCopyCode(summaryText, 'Daftar ringkas peserta');
  };

  // Handlers untuk Calon Santri Belum Memilih Level
  const handleOpenAssignModal = (acc: StudentAccount) => {
    setAssigningAccount(acc);
    const firstProg = programs[0] || null;
    const defaultProgId = firstProg?.id || 'tl-level-1';
    setAssignLevelId(defaultProgId);
    const progScheds = schedules.filter((s) => s.programId === defaultProgId);
    setAssignScheduleId(progScheds[0]?.id || schedules[0]?.id || 'sch-lv1-malam');
    setAssignPaymentStatus('cicilan');
  };

  const handleAssignLevelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningAccount) return;
    setIsAssigning(true);

    try {
      const targetProg = programs.find((p) => p.id === assignLevelId) || programs[0];
      const targetSched = schedules.find((s) => s.id === assignScheduleId) || schedules[0];
      const tuition = targetProg?.tuitionIDR || 510000;
      const isLunas = assignPaymentStatus === 'lunas';
      const targetAngkatan = targetProg?.angkatan || 'Angkatan 1';

      const nowStr =
        new Intl.DateTimeFormat('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }).format(new Date()) + ' WIB';

      const newRecord: RegistrationRecord = {
        registrationNumber: assigningAccount.registrationNumber,
        fullName: assigningAccount.fullName,
        gender: assigningAccount.gender || 'Laki-laki',
        whatsapp: assigningAccount.whatsapp,
        email: assigningAccount.email,
        city: assigningAccount.city || 'Indonesia',
        occupation: assigningAccount.occupation || 'Pelajar Terdaftar',
        selectedProgramId: targetProg.id,
        selectedProgramName: `${targetProg.code} — ${targetProg.title} (${targetAngkatan})`,
        selectedScheduleId: targetSched.id,
        selectedScheduleSummary: `${targetSched.days} (${targetSched.timeWIB}) · Mulai ${targetSched.startDate || 'Segera'}`,
        learningGoal: `Mendaftar ${targetProg.title} (${targetAngkatan})`,
        paymentPlan: isLunas ? 'lunas' : 'cicilan',
        totalTuitionIDR: tuition,
        paidTuitionIDR: isLunas ? tuition : 0,
        installmentPaidCount: isLunas ? 6 : 0,
        registeredAt: nowStr
      };

      await onSaveRegistration(newRecord);
      enrollStudentInProgram(assigningAccount.email, targetProg.id, newRecord.registrationNumber);
      setStudentAccounts(getStudentAccounts());

      showToast(
        'success',
        `Berhasil mendaftarkan calon santri ${assigningAccount.fullName} ke ${targetProg.title} (${targetAngkatan})!`
      );
      setAssigningAccount(null);
    } catch (err) {
      showToast(
        'error',
        `Gagal mendaftarkan level: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteUnselectedAccount = (acc: StudentAccount) => {
    setDeletingUnselectedTarget(acc);
  };

  const handleConfirmDeleteUnselectedAccount = () => {
    if (!deletingUnselectedTarget) return;
    const acc = deletingUnselectedTarget;
    deleteStudentAccount(acc.registrationNumber, acc.email);
    setStudentAccounts(getStudentAccounts());
    setDeletingUnselectedTarget(null);
    showToast(
      'success',
      `Akun calon santri "${acc.fullName}" (${acc.registrationNumber}) telah berhasil dihapus permanen.`
    );
  };

  const handleExportUnselectedCsv = () => {
    if (filteredUnselectedAccounts.length === 0) {
      showToast('error', 'Tidak ada data calon santri yang belum memilih level untuk diekspor.');
      return;
    }

    const headers = [
      'No. Registrasi Akun',
      'Nama Lengkap',
      'Jenis Kelamin',
      'Nomor WhatsApp',
      'Alamat Email',
      'Kota Domisili',
      'Latar Belakang / Profesi',
      'Waktu Buat Akun',
      'Status Level'
    ];

    const rows = filteredUnselectedAccounts.map((acc) => [
      `"${acc.registrationNumber}"`,
      `"${acc.fullName.replace(/"/g, '""')}"`,
      `"${acc.gender || 'Laki-laki'}"`,
      `"${acc.whatsapp}"`,
      `"${acc.email}"`,
      `"${(acc.city || '').replace(/"/g, '""')}"`,
      `"${(acc.occupation || '').replace(/"/g, '""')}"`,
      `"${acc.createdAt || ''}"`,
      '"Belum Memilih Level"'
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
      `calon_santri_belum_pilih_level_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(
      'success',
      `Berhasil mengekspor ${filteredUnselectedAccounts.length} data calon santri belum pilih level ke file CSV.`
    );
  };

  const handleCopyUnselectedWa = async () => {
    if (filteredUnselectedAccounts.length === 0) {
      showToast('error', 'Tidak ada kontak WhatsApp calon santri untuk disalin.');
      return;
    }
    const lines = filteredUnselectedAccounts
      .map((acc, idx) => `${idx + 1}. ${acc.fullName} - ${acc.whatsapp} (${acc.city || 'Domisili'})`)
      .join('\n');
    await handleCopyCode(lines, 'Daftar WhatsApp calon santri belum pilih level');
  };

  const openWhatsAppFollowUp = (acc: StudentAccount) => {
    const waDigits = acc.whatsapp.replace(/[^0-9]/g, '');
    const formattedWa = waDigits.startsWith('0') ? '62' + waDigits.slice(1) : waDigits;
    const msg = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Sdr/i ${acc.fullName}.\n\nKami dari Panitia Tadribul Lughah Ma'had Al-Bayan. Kami melihat Anda telah berhasil membuat akun pelajar (No. Reg: ${acc.registrationNumber}), namun belum menyelesaikan pemilihan program level (Level 1 Nahwu Dasar, Level 2 Nahwu Menengah, Level 3 Nahwu Lanjutan, atau Level 4 Shorof).\n\nApakah ada kendala saat pendaftaran atau ada informasi silabus & jadwal kelas yang ingin ditanyakan? Kami siap membantu proses pendaftaran Anda 😊\n\nJazakumullahu khairan.`;
    window.open(`https://wa.me/${formattedWa}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Financial Statistics & Calculations
  const financialStats = (() => {
    let grossPotential = 0;
    let totalCashCollected = 0;
    let totalReceivables = 0;
    let fullyPaidCount = 0;
    let installmentPayingCount = 0;
    let zeroPaidCount = 0;

    const perProgramStats: Record<string, {
      programId: string;
      title: string;
      levelNumber: number;
      studentsCount: number;
      tuitionFee: number;
      potential: number;
      collected: number;
      receivables: number;
    }> = {};

    for (const prog of programs) {
      perProgramStats[prog.id] = {
        programId: prog.id,
        title: prog.title,
        levelNumber: prog.levelNumber,
        studentsCount: 0,
        tuitionFee: prog.tuitionIDR || 510000,
        potential: 0,
        collected: 0,
        receivables: 0
      };
    }

    let bsiTotal = 0;
    let bcaTotal = 0;
    let cashTotal = 0;

    for (const reg of registrations) {
      const tuition = reg.totalTuitionIDR || 510000;
      grossPotential += tuition;

      const paid = typeof reg.paidTuitionIDR === 'number'
        ? reg.paidTuitionIDR
        : 0;

      totalCashCollected += paid;
      const remaining = Math.max(0, tuition - paid);
      totalReceivables += remaining;

      const count = typeof reg.installmentPaidCount === 'number'
        ? reg.installmentPaidCount
        : Math.min(6, Math.floor(paid / (Math.round(tuition / 6) || 85000)));

      if (count >= 6 || remaining === 0) {
        fullyPaidCount++;
      } else if (count > 0) {
        installmentPayingCount++;
      } else {
        zeroPaidCount++;
      }

      const pId = reg.selectedProgramId || 'tl-level-1';
      if (!perProgramStats[pId]) {
        perProgramStats[pId] = {
          programId: pId,
          title: reg.selectedProgramName || 'Program Level',
          levelNumber: 1,
          studentsCount: 0,
          tuitionFee: tuition,
          potential: 0,
          collected: 0,
          receivables: 0
        };
      }
      perProgramStats[pId].studentsCount++;
      perProgramStats[pId].potential += tuition;
      perProgramStats[pId].collected += paid;
      perProgramStats[pId].receivables += remaining;

      const noteLower = (reg.lastPaymentDate || '').toLowerCase();
      if (noteLower.includes('bca')) {
        bcaTotal += paid;
      } else if (noteLower.includes('cash') || noteLower.includes('tunai')) {
        cashTotal += paid;
      } else {
        bsiTotal += paid;
      }
    }

    const collectionRatePercent = grossPotential > 0
      ? Math.round((totalCashCollected / grossPotential) * 100)
      : 0;

    // Deductions & Foundation Allocation (Permintaan User: Google Plus Rp 175.000/bln lalu potong 20% Kas Lembaga)
    const totalGoogleExpense = Math.max(0, googleMonthlyFee * googleMonthsCount);
    const netAfterGoogle = Math.max(0, totalCashCollected - totalGoogleExpense);
    const kasLembaga20Percent = Math.round(netAfterGoogle * 0.20);
    const sisaKasOperasional80Percent = Math.max(0, netAfterGoogle - kasLembaga20Percent);

    return {
      grossPotential,
      totalCashCollected,
      totalReceivables,
      fullyPaidCount,
      installmentPayingCount,
      zeroPaidCount,
      collectionRatePercent,
      perProgramList: Object.values(perProgramStats).sort((a, b) => a.levelNumber - b.levelNumber),
      bankDistribution: {
        bsiTotal,
        bcaTotal,
        cashTotal
      },
      totalGoogleExpense,
      netAfterGoogle,
      kasLembaga20Percent,
      sisaKasOperasional80Percent,
      googleMonthlyFee,
      googleMonthsCount
    };
  })();

  const filteredFinanceRegistrations = registrations.filter((r) => {
    const q = financeSearch.trim().toLowerCase();
    const angkatan = getRegistrationAngkatan(r);
    const matchesSearch =
      !q ||
      r.fullName.toLowerCase().includes(q) ||
      r.registrationNumber.toLowerCase().includes(q) ||
      (r.whatsapp && r.whatsapp.includes(q)) ||
      angkatan.toLowerCase().includes(q) ||
      (r.email && r.email.toLowerCase().includes(q));

    const tuition = r.totalTuitionIDR || 510000;
    const paid = typeof r.paidTuitionIDR === 'number'
      ? r.paidTuitionIDR
      : 0;
    const count = typeof r.installmentPaidCount === 'number'
      ? r.installmentPaidCount
      : Math.min(6, Math.floor(paid / (Math.round(tuition / 6) || 85000)));
    const remaining = Math.max(0, tuition - paid);

    let matchesStatus = true;
    if (financeStatusFilter === 'lunas') {
      matchesStatus = count >= 6 || remaining === 0;
    } else if (financeStatusFilter === 'cicilan') {
      matchesStatus = count > 0 && count < 6 && remaining > 0;
    } else if (financeStatusFilter === 'unpaid') {
      matchesStatus = count === 0 && paid === 0;
    }

    const matchesLevel =
      financeLevelFilter === 'all' ||
      r.selectedProgramId === financeLevelFilter ||
      (financeLevelFilter === '1' && r.selectedProgramId.includes('1')) ||
      (financeLevelFilter === '2' && r.selectedProgramId.includes('2')) ||
      (financeLevelFilter === '3' && r.selectedProgramId.includes('3')) ||
      (financeLevelFilter === '4' && r.selectedProgramId.includes('4'));

    return matchesSearch && matchesStatus && matchesLevel;
  });

  const handleExportFinancialReportCSV = () => {
    const headers = [
      'No. Registrasi',
      'Nama Santri',
      'Angkatan',
      'Program Level',
      'Total Biaya (IDR)',
      'Sudah Dibayar (IDR)',
      'Sisa Piutang (IDR)',
      'Cicilan Lunas (0-6)',
      'Status Pelunasan',
      'Terakhir Bayar / Rekening',
      'No. WhatsApp'
    ];

    const rows = filteredFinanceRegistrations.map((r) => {
      const tuition = r.totalTuitionIDR || 510000;
      const paid = typeof r.paidTuitionIDR === 'number'
        ? r.paidTuitionIDR
        : 0;
      const remaining = Math.max(0, tuition - paid);
      const count = typeof r.installmentPaidCount === 'number'
        ? r.installmentPaidCount
        : Math.min(6, Math.floor(paid / (Math.round(tuition / 6) || 85000)));
      const lunasStatus = count >= 6 || remaining === 0 ? 'Lunas (6/6)' : count > 0 ? `Cicilan ${count}/6` : 'Belum Lunas (Bulan 1)';
      const angkatan = getRegistrationAngkatan(r);

      return [
        `"${r.registrationNumber}"`,
        `"${r.fullName.replace(/"/g, '""')}"`,
        `"${angkatan}"`,
        `"${r.selectedProgramName.replace(/"/g, '""')}"`,
        `"${tuition}"`,
        `"${paid}"`,
        `"${remaining}"`,
        `"${count}"`,
        `"${lunasStatus}"`,
        `"${(r.lastPaymentDate || '-').replace(/"/g, '""')}"`,
        `"${r.whatsapp}"`
      ];
    });

    const financeSummaryBlock = [
      '========================================================================',
      'REKAPITULASI LAPORAN KEUANGAN & ARUS KAS TADRIBUL LUGHAH AL-BAYAN',
      '========================================================================',
      `Tanggal Unduh         : ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`,
      `Total Kas Masuk (SPP) : ${formatIDR(financialStats.totalCashCollected)}`,
      `Potongan Google Plus  : - ${formatIDR(financialStats.totalGoogleExpense)} (${googleMonthsCount} bulan @ ${formatIDR(googleMonthlyFee)}/bln)`,
      `Subtotal Setelah Beban: ${formatIDR(financialStats.netAfterGoogle)}`,
      `Alokasi Kas Lembaga 20%: ${formatIDR(financialStats.kasLembaga20Percent)} (Dana Kas Yayasan)`,
      `Sisa Kas Bersih 80%   : ${formatIDR(financialStats.sisaKasOperasional80Percent)} (Operasional Kelas & Honor Asatidz)`,
      `Total Piutang Cicilan : ${formatIDR(financialStats.totalReceivables)}`,
      `Santri Terdaftar      : ${registrations.length} orang (${financialStats.fullyPaidCount} Lunas, ${financialStats.installmentPayingCount} Cicil, ${financialStats.zeroPaidCount} Belum Bayar)`,
      '========================================================================',
      ''
    ].join('\r\n');

    const financeCsvContent =
      '\uFEFF' +
      financeSummaryBlock +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
    const blob = new Blob([financeCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `laporan_keuangan_tadribul_lughah_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(
      'success',
      `Berhasil mengekspor Laporan Keuangan (${filteredFinanceRegistrations.length} santri) ke file CSV.`
    );
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
      className={pageMode === 'edit-jadwal' ? 'py-6 sm:py-8 bg-[#F8FAFC] min-h-[calc(100vh-80px)]' : 'py-10 sm:py-14 bg-[#F8FAFC] min-h-[calc(100vh-140px)]'}
    >
      <div className={pageMode === 'edit-jadwal' ? 'max-w-[1200px] mx-auto px-6 space-y-8' : 'max-w-[1380px] mx-auto px-4 sm:px-6 space-y-8'}>
        {pageMode !== 'edit-jadwal' && (
          <>
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
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">
                03. DATA PENDAFTAR
              </span>
              {unselectedStudentAccounts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  +{unselectedStudentAccounts.length} Belum Pilih Lv
                </span>
              )}
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-900">
              {registrations.length} Peserta
            </p>
            <p className="text-xs text-slate-600">
              {unselectedStudentAccounts.length > 0
                ? `${unselectedStudentAccounts.length} akun terdaftar belum memilih level`
                : 'Tersinkronisasi ke Database & SQL cPanel'}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-1.5 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono text-slate-500">
                04. SERVER HOSTING CPANEL
              </span>
              <p className="text-lg font-bold font-mono text-emerald-900 mt-0.5">
                Live di cPanel
              </p>
            </div>
            <a
              href="https://elmumtaz.web-id.id"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:underline pt-1"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka elmumtaz.web-id.id
            </a>
          </div>
        </div>
          </>
        )}

        {/* Main Workspace Container */}
        <div className="space-y-6">
          {/* Status Toast (Top inline + Floating fixed agar selalu terlihat saat scroll) */}
          {statusMessage && (
            <>
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
                <span className="font-medium flex-1">{statusMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setStatusMessage(null)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                  title="Tutup pemberitahuan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div
                role="status"
                aria-live="polite"
                className={`fixed bottom-5 right-5 z-[70] max-w-md w-[calc(100vw-2.5rem)] p-4 rounded-xl border-2 shadow-2xl flex items-start gap-3 text-xs sm:text-sm animate-in fade-in duration-150 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-950 text-white border-emerald-500'
                    : 'bg-rose-950 text-white border-rose-500'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-0.5">
                  <p
                    className={`font-bold text-[11px] uppercase tracking-wider ${
                      statusMessage.type === 'success' ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {statusMessage.type === 'success' ? 'Berhasil Disimpan' : 'Perhatian'}
                  </p>
                  <p className="font-medium leading-snug">{statusMessage.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusMessage(null)}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                  title="Tutup notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Layout Workspace: Navigasi Samping Kiri + Konten Utama */}
          <div className={pageMode !== 'edit-jadwal' ? 'flex flex-col lg:flex-row gap-6 lg:gap-8 items-start' : 'space-y-6'}>
            {pageMode !== 'edit-jadwal' && (
              <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
                  <div className="p-4 bg-slate-900 text-white border-b border-slate-800">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                      NAVIGASI SUPERADMIN
                    </p>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5">
                      Pusat Manajemen Program
                    </p>
                  </div>

                  <nav
                    aria-label="Navigasi Panel Superadmin"
                    className="p-2.5 space-y-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveTab('schedules')}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-left ${
                        activeTab === 'schedules'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span className="truncate">1. Edit Jadwal Kelas</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          activeTab === 'schedules'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {schedules.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('kurikulum')}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-left ${
                        activeTab === 'kurikulum'
                          ? 'bg-amber-900 text-white shadow-xs'
                          : 'text-amber-950 bg-amber-50/80 hover:bg-amber-100 border border-amber-200/80'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <BookOpen className="w-4 h-4 shrink-0" />
                        <span className="leading-snug">2. Detail Level &amp; Kurikulum</span>
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                          activeTab === 'kurikulum'
                            ? 'bg-amber-800 text-amber-100'
                            : 'bg-amber-200/70 text-amber-950'
                        }`}
                      >
                        index
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('registrations')}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-left ${
                        activeTab === 'registrations'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Users className="w-4 h-4 shrink-0" />
                        <span className="truncate">3. Data Pendaftar ({registrations.length})</span>
                      </span>
                      {unselectedStudentAccounts.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-slate-950 shrink-0">
                          +{unselectedStudentAccounts.length}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('keuangan')}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-left ${
                        activeTab === 'keuangan'
                          ? 'bg-emerald-900 text-white shadow-xs'
                          : 'text-emerald-950 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Receipt className={`w-4 h-4 shrink-0 ${activeTab === 'keuangan' ? 'text-emerald-300' : 'text-emerald-700'}`} />
                        <span className="truncate">4. Laporan Keuangan</span>
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0 ${
                          activeTab === 'keuangan'
                            ? 'bg-emerald-800 text-white'
                            : 'bg-emerald-200/80 text-emerald-950'
                        }`}
                      >
                        {formatIDR(financialStats.totalCashCollected)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('materi')}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-left ${
                        activeTab === 'materi'
                          ? 'bg-rose-700 text-white shadow-xs'
                          : 'text-rose-900 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/80'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Video className={`w-4 h-4 shrink-0 ${activeTab === 'materi' ? 'text-rose-200' : 'text-rose-500'} fill-current`} />
                        <span className="leading-snug">5. Video, Materi &amp; Latihan</span>
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                          activeTab === 'materi'
                            ? 'bg-rose-800 text-rose-100'
                            : 'bg-rose-200/70 text-rose-950'
                        }`}
                      >
                        materi
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('cpanel-sql')}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer text-left ${
                        activeTab === 'cpanel-sql'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Database className="w-4 h-4 shrink-0" />
                        <span className="leading-snug">6. Database SQL &amp; ZIP cPanel</span>
                      </span>
                    </button>
                  </nav>

                  {isSuperAdmin && (
                    <div className="p-3 bg-slate-50 border-t border-slate-200">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={handleResetDefaults}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Sinkronkan Data Standar</span>
                      </button>
                    </div>
                  )}
                </div>
              </aside>
            )}

            <div className="flex-1 min-w-0 w-full space-y-6">

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
              {/* TAB 2: EDIT SCHEDULES — GRID CARDS + POPUP MODAL */}
              {activeTab === 'schedules' && isSuperAdmin && (
                <div className="space-y-6">
                  {pageMode !== 'edit-jadwal' && (
                  <>
                  {/* Header Bar */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-mono font-semibold text-emerald-800 uppercase tracking-wider">
                        MANAJEMEN JADWAL &amp; RUANG KELAS ONLINE
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                        Daftar Jadwal Kelas Online ({schedules.length} Jadwal)
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Aturan <strong>1 Angkatan = 1 Kelas</strong>: klik kartu jadwal atau tombol Edit untuk mengatur jadwal Zoom, status pendaftaran (ON/OFF) khusus kelas ini, ON/OFF materi per pekan, dan daftar santri. (Informasi kurikulum publik <strong>index.html</strong> dikelola pada tab terpisah.)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreateNewSchedule}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl transition-colors cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Kelas / Angkatan Baru</span>
                    </button>
                  </div>

                  {/* Responsive Grid of Schedule Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {schedules.map((sch) => {
                      const realEnrolled = registrations.filter(
                        (r) =>
                          r.selectedScheduleId === sch.id ||
                          (r.selectedScheduleSummary && r.selectedScheduleSummary.includes(sch.batchCode)) ||
                          (!r.selectedScheduleId && r.selectedProgramId === sch.programId)
                      ).length;
                      const targetProg =
                        programs.find((p) => p.id === sch.programId || p.levelNumber === sch.levelNumber) ||
                        programs[0];
                      const schMeetings = targetProg ? buildProgramMeetings(targetProg, sch) : [];
                      const unlockedSessionsCount = targetProg
                        ? schMeetings.filter((m) => isAttendanceSessionUnlocked(targetProg.id, m.sessionNumber)).length
                        : 0;
                      const materiProgress = targetProg ? getScheduleMateriProgress(targetProg.id, sch.id) : null;
                      const schHighestNum = materiProgress?.highestPekan?.pekanNumber || 0;
                      const hasMeetingLink = Boolean(sch.meetingLink && sch.meetingLink.trim());
                      const occupancyPct =
                        sch.capacity > 0 ? Math.min(100, Math.round((realEnrolled / sch.capacity) * 100)) : 0;

                      return (
                        <div
                          key={sch.id}
                          onClick={() => handleOpenEditScheduleModal(sch)}
                          className="bg-white border border-slate-200 hover:border-emerald-700 rounded-2xl p-5 space-y-4 transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between group"
                        >
                          <div className="space-y-3">
                            {/* Top Badge Row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                                  {sch.batchCode}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  Level {sch.levelNumber}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                  {sch.angkatan?.trim() || targetProg?.angkatan || 'Angkatan 1'}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                                    isScheduleRegistrationOpen(sch)
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                      : 'bg-rose-50 text-rose-800 border-rose-200'
                                  }`}
                                >
                                  {isScheduleRegistrationOpen(sch) ? 'Daftar: ON' : 'Daftar: OFF'}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                                {formatIDR(sch.feeIDR)}
                              </span>
                            </div>

                            {/* Title */}
                            <div>
                              <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                                {sch.programName}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">{sch.modeLabel}</p>
                            </div>

                            {/* Schedule Details */}
                            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                              <div className="bg-[#FBF9F5] p-2.5 rounded-lg border border-slate-200/70">
                                <span className="text-[10px] text-slate-500 block font-mono uppercase">
                                  Jadwal Malam
                                </span>
                                <span className="font-semibold text-slate-800 block mt-0.5">{sch.days}</span>
                                <span className="text-[11px] font-mono text-emerald-800">{sch.timeWIB}</span>
                              </div>
                              <div className="bg-[#FBF9F5] p-2.5 rounded-lg border border-slate-200/70">
                                <span className="text-[10px] text-slate-500 block font-mono uppercase">
                                  Mulai & Pengajar
                                </span>
                                <span className="font-semibold text-slate-800 block mt-0.5">{sch.startDate}</span>
                                <span className="text-[11px] text-slate-600 truncate block">
                                  {sch.instructor}
                                </span>
                              </div>
                            </div>

                            {/* Occupancy & Direct Per-Class Materi ON/OFF Control */}
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-emerald-800" />
                                  <span>Peserta Terdaftar Riil:</span>
                                </span>
                                <span className="font-mono font-bold text-slate-900">
                                  {realEnrolled} / {sch.capacity} Kursi ({occupancyPct}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-800 rounded-full transition-all"
                                  style={{ width: `${occupancyPct}%` }}
                                />
                              </div>

                              {materiProgress && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="pt-2.5 mt-2 border-t border-slate-100 bg-indigo-50/40 border border-indigo-200/80 rounded-xl p-3 space-y-2.5 cursor-default"
                                >
                                  <div className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-indigo-950 font-bold flex items-center gap-1.5">
                                      <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                                      <span>ON/OFF Materi Kelas Zoom Ini:</span>
                                    </span>
                                    <span className="font-mono font-bold text-indigo-950 bg-white px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                                      {materiProgress.unlockedCount}/{materiProgress.totalCount} Pekan ON
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-indigo-100">
                                    <div
                                      className="h-full bg-indigo-700 rounded-full transition-all"
                                      style={{ width: `${materiProgress.pct}%` }}
                                    />
                                  </div>
                                  <p className="text-[11px] text-slate-700">
                                    {materiProgress.highestPekan ? (
                                      <>
                                        <span className="font-semibold text-emerald-800">
                                          ON s/d Pekan {materiProgress.highestPekan.pekanNumber}
                                        </span>{' '}
                                        {materiProgress.highestPekan.pekanNumber < materiProgress.totalCount && (
                                          <span className="text-rose-700 font-medium">
                                            (Pekan {materiProgress.highestPekan.pekanNumber + 1}+ OFF)
                                          </span>
                                        )}
                                        {' · '}
                                        <span className="truncate">{materiProgress.highestPekan.title}</span>
                                      </>
                                    ) : (
                                      <span className="text-rose-700 font-semibold">
                                        Semua pekan materi saat ini OFF (Terkunci).
                                      </span>
                                    )}
                                  </p>

                                  {/* Quick Selector: Sampai Pekan ke berapa ON, selanjutnya OFF */}
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 text-[11px]">
                                    <span className="font-semibold text-slate-700 shrink-0">
                                      Batas Materi ON:
                                    </span>
                                    <MateriLimitSelector
                                      compact
                                      pekans={materiProgress.pekans}
                                      currentLimit={schHighestNum}
                                      totalCount={materiProgress.totalCount}
                                      onSelectLimit={(maxPekan) =>
                                        handleBatchUnlockUpTo(targetProg.id, maxPekan, sch.id)
                                      }
                                    />
                                  </div>

                                  {/* Clickable P1..Pn ON/OFF Badges right on the Card */}
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {materiProgress.pekans.map((p) => {
                                      const pOpen = isPekanUnlocked(targetProg.id, p.pekanNumber, sch.id);
                                      return (
                                        <button
                                          key={`card-pill-${sch.id}-p${p.pekanNumber}`}
                                          type="button"
                                          onClick={() =>
                                            handleTogglePekanUnlock(targetProg.id, p.pekanNumber, sch.id)
                                          }
                                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer flex items-center gap-0.5 ${
                                            pOpen
                                              ? 'bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800'
                                              : 'bg-white text-slate-500 border-slate-300 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300'
                                          }`}
                                          title={`Pekan ${p.pekanNumber} (${p.title}): ${pOpen ? 'ON — Klik untuk OFF-kan' : 'OFF — Klik untuk ON-kan'} di kelas ${sch.batchCode}`}
                                        >
                                          <span>P{p.pekanNumber}</span>
                                          <span>{pOpen ? '✓' : '✕'}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Badges: Meet/Zoom & Presensi */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {hasMeetingLink ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
                                  <Video className="w-3 h-3 text-emerald-700" />
                                  <span>Link {sch.meetingPlatform || 'Meet/Zoom'} Aktif</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                  <Video className="w-3 h-3 text-amber-600" />
                                  <span>Link Meet/Zoom Belum Diisi</span>
                                </span>
                              )}

                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                <CalendarCheck className="w-3 h-3 text-emerald-800" />
                                <span>
                                  Presensi: {unlockedSessionsCount}/{schMeetings.length} Sesi Dibuka
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddNextAngkatanSchedule(sch);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer shrink-0"
                              title="Buat jadwal kelas baru untuk angkatan selanjutnya di level ini (1 Angkatan = 1 Kelas)"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tambah Angkatan Berikutnya</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditScheduleModal(sch);
                              }}
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-emerald-950 bg-emerald-50 hover:bg-emerald-900 hover:text-white border border-emerald-300 hover:border-emerald-900 rounded-xl transition-all cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Edit Jadwal Kelas & Materi</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </>
                  )}

                  {/* HALAMAN TERPISAH EDIT JADWAL KELAS ONLINE (edit-jadwal.html) */}
                  {(pageMode === 'edit-jadwal'
                    ? Boolean(editingSchedule)
                    : isScheduleEditModalOpen && Boolean(editingSchedule)) &&
                    editingSchedule && (
                    <div
                      role={pageMode === 'edit-jadwal' ? 'region' : 'dialog'}
                      aria-modal={pageMode === 'edit-jadwal' ? undefined : true}
                      className={
                        pageMode === 'edit-jadwal'
                          ? 'w-full'
                          : 'fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150'
                      }
                      onClick={(e) => {
                        if (
                          pageMode !== 'edit-jadwal' &&
                          e.target === e.currentTarget &&
                          !isDeleteScheduleConfirmOpen &&
                          !isSaving
                        ) {
                          setIsScheduleEditModalOpen(false);
                        }
                      }}
                    >
                      <form
                        onSubmit={handleScheduleSubmit}
                        className={
                          pageMode === 'edit-jadwal'
                            ? 'bg-white border border-slate-200 rounded-2xl w-full shadow-sm flex flex-col'
                            : 'bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col my-auto animate-in zoom-in-95 duration-150'
                        }
                      >
                        {/* Form / Modal Header */}
                        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border-b border-slate-800 rounded-t-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
                              <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                                EDIT JADWAL KELAS &amp; MATERI ({editingSchedule.batchCode})
                              </span>
                              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                                {editingSchedule.programName}
                              </h3>
                            </div>
                          </div>

                          {pageMode === 'edit-jadwal' ? (
                            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                              {schedules.length > 1 && (
                                <select
                                  aria-label="Pilih jadwal kelas lain"
                                  value={
                                    schedules.some((s) => s.id === editingSchedule.id)
                                      ? editingSchedule.id
                                      : ''
                                  }
                                  onChange={(e) => {
                                    const chosen = schedules.find((s) => s.id === e.target.value);
                                    if (chosen) handleOpenEditScheduleModal(chosen);
                                  }}
                                  className="px-3 py-2 text-xs bg-slate-900/90 text-white border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-400 cursor-pointer"
                                >
                                  {!schedules.some((s) => s.id === editingSchedule.id) && (
                                    <option value="">+ Jadwal Baru ({editingSchedule.batchCode})</option>
                                  )}
                                  {schedules.map((s) => (
                                    <option key={`hdr-switch-${s.id}`} value={s.id}>
                                      {s.batchCode} · Lv {s.levelNumber} ({s.angkatan || 'Angkatan 1'})
                                    </option>
                                  ))}
                                </select>
                              )}
                              <a
                                href="./superadmin.html?tab=schedules"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Daftar Jadwal</span>
                              </a>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsDeleteScheduleConfirmOpen(false);
                                setIsScheduleEditModalOpen(false);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                              title="Tutup Popup Edit Jadwal"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        {/* Form Scrollable Body */}
                        <div
                          className={
                            pageMode === 'edit-jadwal'
                              ? 'p-5 sm:p-7 space-y-6'
                              : 'p-5 sm:p-6 overflow-y-auto flex-1 space-y-5'
                          }
                        >
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
                              const isNewSchedule = !schedules.some((s) => s.id === editingSchedule.id);
                              const nextNum = getNextAngkatanNumber(prog.id, editingSchedule.id);
                              const nextAngkatanLabel = `Angkatan ${nextNum}`;
                              const hasConflict = schedules.some(
                                (s) =>
                                  s.programId === prog.id &&
                                  s.id !== editingSchedule.id &&
                                  normalizeAngkatanKey(s.angkatan, prog.angkatan || 'Angkatan 1') ===
                                    normalizeAngkatanKey(editingSchedule.angkatan, prog.angkatan || 'Angkatan 1')
                              );
                              const nextStart =
                                prog.startDate || levelStartDates[prog.id] || editingSchedule.startDate;
                              if (isNewSchedule || hasConflict) {
                                setEditingSchedule({
                                  ...editingSchedule,
                                  programId: prog.id,
                                  levelNumber: prog.levelNumber,
                                  programName: `${prog.title} — ${nextAngkatanLabel}`,
                                  levelName: `Level ${prog.levelNumber}`,
                                  batchCode: `${prog.code}-A${nextNum}`,
                                  angkatan: nextAngkatanLabel,
                                  days: isNewSchedule ? prog.scheduleDays : editingSchedule.days,
                                  timeWIB: isNewSchedule ? prog.scheduleTime : editingSchedule.timeWIB,
                                  feeIDR: isNewSchedule ? prog.tuitionIDR : editingSchedule.feeIDR,
                                  startDate: isNewSchedule ? nextStart : editingSchedule.startDate,
                                  className: ''
                                });
                              } else {
                                setEditingSchedule({
                                  ...editingSchedule,
                                  programId: prog.id,
                                  levelNumber: prog.levelNumber,
                                  programName: prog.title,
                                  levelName: `Level ${prog.levelNumber}`,
                                  className: ''
                                });
                              }
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

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Angkatan (Aturan: 1 Angkatan = 1 Kelas)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Angkatan 1 atau Angkatan 2"
                          value={editingSchedule.angkatan || ''}
                          onChange={(e) =>
                            setEditingSchedule({
                              ...editingSchedule,
                              angkatan: e.target.value,
                              className: ''
                            })
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">
                          Setiap angkatan hanya memiliki 1 kelas Zoom. Jika menambah kelas baru di level yang sama, wajib menggunakan angkatan berikutnya (misal Angkatan 2, Angkatan 3).
                        </p>
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
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={dateStringToYMD(editingSchedule.startDate)}
                            onChange={(e) => {
                              const ymd = e.target.value;
                              if (ymd) {
                                setEditingSchedule({
                                  ...editingSchedule,
                                  startDate: ymdToIndonesianDate(ymd)
                                });
                              }
                            }}
                            title="Pilih tanggal dari kalender"
                            className="w-28 px-2 py-2 text-xs font-mono font-medium text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 cursor-pointer shadow-2xs"
                          />
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
                            placeholder="Contoh: 19 November 2026"
                            className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                          />
                        </div>
                        {(() => {
                          const h = getHolidayInfo(editingSchedule.startDate);
                          if (h.isTanggalMerah) {
                            return (
                              <p className="text-[10px] text-rose-700 font-semibold mt-1 flex items-center gap-1">
                                <span>🔴 Tanggal Merah ({h.isHoliday ? h.holidayName : 'Hari Ahad'})</span>
                              </p>
                            );
                          }
                          return null;
                        })()}
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

                      <div className="sm:col-span-2 bg-emerald-50/70 p-4 rounded-xl border border-emerald-300 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-emerald-800" />
                            <span>Jumlah Peserta Terdaftar Saat Ini (Data Riil Pendaftar)</span>
                          </label>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs self-start sm:self-auto">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Sinkron Riil: {scheduleRealEnrolledCount} Santri</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          <div className="sm:col-span-5">
                            <div className="relative">
                              <input
                                type="number"
                                readOnly
                                value={scheduleRealEnrolledCount}
                                className="w-full px-3 py-2 text-sm font-mono font-extrabold text-emerald-950 bg-white border border-emerald-300 rounded-lg shadow-2xs cursor-not-allowed select-none"
                                title="Jumlah peserta terhitung otomatis secara riil dari database pendaftar"
                              />
                              <span className="absolute right-3 top-2.5 text-[11px] font-semibold text-slate-500">
                                Santri Riil
                              </span>
                            </div>
                          </div>

                          <div className="sm:col-span-7 flex items-center justify-between bg-white px-3.5 py-2 rounded-lg border border-emerald-200 text-xs">
                            <div>
                              <span className="text-slate-500 text-[11px] block">Status Keterisian:</span>
                              <span className="font-semibold text-slate-800">
                                {scheduleRealEnrolledCount} dari {editingSchedule.capacity} Kursi Terisi
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-slate-500 text-[11px] block">Sisa Kuota:</span>
                              <span className={`font-mono font-bold ${
                                editingSchedule.capacity - scheduleRealEnrolledCount <= 3 ? 'text-amber-700' : 'text-emerald-800'
                              }`}>
                                {Math.max(0, editingSchedule.capacity - scheduleRealEnrolledCount)} Kursi
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Rincian Nama-Nama Santri yang Terdaftar di Jadwal Kelas Ini */}
                        <div className="pt-2 border-t border-emerald-200/70">
                          <p className="text-[11px] font-bold text-emerald-950 mb-1.5 flex items-center gap-1">
                            <span>👥 Daftar Santri Terdaftar di Kelas Ini ({scheduleRealEnrolledCount} Orang):</span>
                          </p>
                          {registeredParticipantsForSchedule.length > 0 ? (
                            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                              {registeredParticipantsForSchedule.map((p, idx) => (
                                <div
                                  key={`enrolled-student-${p.registrationNumber}-${idx}`}
                                  className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-emerald-200 text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                                      {idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-slate-900 truncate">{p.fullName}</p>
                                      <p className="font-mono text-[10px] text-slate-500">{p.registrationNumber} · {p.city || 'Online'}</p>
                                    </div>
                                  </div>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                                    {p.status || 'Terdaftar'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic bg-white/70 p-2.5 rounded-lg border border-dashed border-emerald-200">
                              Belum ada santri yang terdaftar pada jadwal kelas ini. Jumlah peserta akan otomatis bertambah secara riil saat ada santri yang memilih jadwal ini di formulir pendaftaran.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Section Link Tatap Muka Online (Google Meet / Zoom) — Khusus Peserta */}
                      <div className="sm:col-span-2 bg-gradient-to-br from-emerald-50/90 to-slate-50 p-4 sm:p-5 rounded-xl border border-emerald-300 space-y-4 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Video className="w-4 h-4 text-emerald-200" />
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                                <span>Tautan Ruang Kelas Tatap Muka Online</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  Google Meet / Zoom
                                </span>
                              </h4>
                              <p className="text-[11px] text-slate-600 mt-0.5">
                                Tautan ini <strong className="text-emerald-900">hanya dapat dilihat oleh peserta</strong> yang telah mendaftar dan login di halaman <span className="font-mono text-emerald-950 font-semibold">pelajar.html</span>.
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0 self-start sm:self-auto">
                            <Lock className="w-3 h-3 text-amber-700" />
                            <span>Privat Khusus Peserta</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                          {/* Pilihan Platform */}
                          <div className="sm:col-span-4">
                            <label className="block text-xs font-semibold text-slate-800 mb-1">
                              Platform Tatap Muka
                            </label>
                            <select
                              value={editingSchedule.meetingPlatform || 'Google Meet'}
                              onChange={(e) =>
                                setEditingSchedule({
                                  ...editingSchedule,
                                  meetingPlatform: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 font-medium text-slate-900 cursor-pointer shadow-2xs"
                            >
                              <option value="Google Meet">Google Meet</option>
                              <option value="Zoom">Zoom Meeting</option>
                              <option value="Lainnya">Lainnya (Tautan Khusus)</option>
                            </select>
                          </div>

                          {/* Link Meeting URL */}
                          <div className="sm:col-span-8">
                            <div className="flex items-center justify-between mb-1">
                              <label className="block text-xs font-semibold text-slate-800">
                                Link Pertemuan Online (URL)
                              </label>
                              {editingSchedule.meetingLink && editingSchedule.meetingLink.trim() && (
                                <a
                                  href={editingSchedule.meetingLink.trim()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1 cursor-pointer"
                                  title="Buka link di tab baru untuk menguji tautan"
                                >
                                  <span>Uji Tautan</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <input
                              type="url"
                              placeholder={
                                (editingSchedule.meetingPlatform || 'Google Meet') === 'Google Meet'
                                  ? 'https://meet.google.com/abc-defg-hij'
                                  : 'https://us04web.zoom.us/j/1234567890?pwd=...'
                              }
                              value={editingSchedule.meetingLink || ''}
                              onChange={(e) =>
                                setEditingSchedule({
                                  ...editingSchedule,
                                  meetingLink: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                            />
                          </div>

                          {/* Catatan Tambahan (Passcode / Meeting ID / Panduan Masuk) */}
                          <div className="sm:col-span-12">
                            <label className="block text-xs font-semibold text-slate-800 mb-1">
                              Catatan Tambahan Ruang Kelas (Meeting ID, Passcode, atau Arahan Pengajar)
                            </label>
                            <input
                              type="text"
                              placeholder="Contoh: Meeting ID: 890 1234 5678 · Passcode: bayan2026 (Harap masuk 15 menit sebelum kelas)"
                              value={editingSchedule.meetingNotes || ''}
                              onChange={(e) =>
                                setEditingSchedule({
                                  ...editingSchedule,
                                  meetingNotes: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">
                              💡 Catatan ini akan ditampilkan secara eksklusif kepada peserta terdaftar di kartu kelas pada halaman <span className="font-mono text-slate-700">pelajar.html</span>.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Section Kontrol Status Pendaftaran Khusus Kelas / Angkatan Ini (ON / OFF) */}
                      {(() => {
                        const isOpen = isScheduleRegistrationOpen(editingSchedule);
                        const angkatanLabel = editingSchedule.angkatan?.trim() || 'Angkatan 1';

                        return (
                          <div
                            className={`sm:col-span-2 rounded-xl p-5 border space-y-3.5 shadow-2xs transition-colors ${
                              isOpen
                                ? 'bg-emerald-50/40 border-emerald-300'
                                : 'bg-rose-50/40 border-rose-300'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-xs font-mono font-semibold text-emerald-800 uppercase tracking-wider">
                                    KONTROL STATUS PENDAFTARAN LEVEL {editingSchedule.levelNumber} · {angkatanLabel} (ON / OFF)
                                  </p>
                                  <span
                                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                      isOpen
                                        ? 'bg-emerald-900 text-white'
                                        : 'bg-rose-700 text-white'
                                    }`}
                                  >
                                    {isOpen ? 'ON · DIBUKA' : 'OFF · DITUTUP'}
                                  </span>
                                </div>
                                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                                  {editingSchedule.batchCode} — {editingSchedule.programName}
                                </h4>
                                <p className="text-xs text-slate-600">
                                  Mengatur status buka (<strong>ON</strong>) / tutup (<strong>OFF</strong>) pendaftaran khusus untuk <strong>Level {editingSchedule.levelNumber} {angkatanLabel}</strong> saja. Angkatan lain pada level yang sama tetap independen dan tidak ikut berubah.
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={isSaving || !isSuperAdmin}
                                onClick={() => handleToggleScheduleRegistration(editingSchedule)}
                                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs disabled:opacity-50 ${
                                  isOpen
                                    ? 'bg-rose-700 hover:bg-rose-800 text-white'
                                    : 'bg-emerald-900 hover:bg-emerald-800 text-white'
                                }`}
                              >
                                <span>
                                  {isOpen
                                    ? `Matikan (OFF) ${angkatanLabel}`
                                    : `Aktifkan (ON) ${angkatanLabel}`}
                                </span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Section Kontrol ON/OFF Materi per Pekan dari Jadwal Kelas Zoom */}
                      {(() => {
                        const targetProgram = programs.find((p) => p.id === editingSchedule.programId || p.levelNumber === editingSchedule.levelNumber) || programs[0];
                        const materiProgress = getScheduleMateriProgress(targetProgram.id, editingSchedule.id);
                        const currentHighestNum = materiProgress.highestPekan?.pekanNumber || 0;

                        return (
                          <div className="sm:col-span-2 bg-gradient-to-br from-indigo-50/70 via-white to-[#FBF9F5] p-5 rounded-xl border border-indigo-200 space-y-4 shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-indigo-200/70 pb-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-900 text-indigo-200 flex items-center justify-center shrink-0 shadow-2xs border border-indigo-800">
                                  <BookOpen className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-900">
                                      Kontrol ON/OFF Materi Kelas Zoom Ini
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-950 border border-indigo-300">
                                      {editingSchedule.batchCode} · {editingSchedule.angkatan?.trim() || targetProgram?.angkatan || 'Angkatan 1'} · {materiProgress.unlockedCount}/{materiProgress.totalCount} Pekan ON
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    Atur materi pekan berapa saja yang <strong>ON (Terbuka)</strong> atau <strong>OFF (Dikunci)</strong> khusus untuk Jadwal Kelas Zoom <strong className="text-indigo-950">{editingSchedule.batchCode}</strong> ({editingSchedule.angkatan?.trim() || targetProgram?.angkatan || 'Angkatan 1'}). Setiap angkatan memiliki 1 kelas dengan pengaturan ON/OFF materi tersendiri (misal Level 1 Angkatan 1 sampai Pekan 6, Level 1 Angkatan 2 sampai Pekan 3) di <span className="font-mono text-indigo-950 font-semibold">materi.html</span> &amp; <span className="font-mono text-indigo-950 font-semibold">pelajar.html</span>.
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto shrink-0">
                                {currentHighestNum > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleBatchUnlockUpTo(targetProgram.id, currentHighestNum - 1, editingSchedule.id)}
                                    className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                                    title="Kurangi 1 pekan materi yang dibuka (OFF-kan pekan terakhir)"
                                  >
                                    -1 Pekan
                                  </button>
                                )}
                                {currentHighestNum < materiProgress.totalCount && (
                                  <button
                                    type="button"
                                    onClick={() => handleBatchUnlockUpTo(targetProgram.id, currentHighestNum + 1, editingSchedule.id)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                    title={`ON-kan hingga Pekan ${currentHighestNum + 1}`}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-200" />
                                    <span>Lanjut Pekan {currentHighestNum + 1}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleUnlockAllPekans(targetProgram.id, editingSchedule.id)}
                                  className="px-2.5 py-1.5 text-[11px] font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                                >
                                  ON Semua
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleLockAllExceptFirst(targetProgram.id, editingSchedule.id)}
                                  className="px-2.5 py-1.5 text-[11px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer"
                                >
                                  OFF Kecuali P1
                                </button>
                              </div>
                            </div>

                            {/* Status & Visual Progress Bar */}
                            <div className="bg-white rounded-xl border border-indigo-200/80 p-3.5 space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div className="min-w-0">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-800 font-bold block">
                                    Status Materi Aktif Kelas {editingSchedule.batchCode}:
                                  </span>
                                  {materiProgress.highestPekan ? (
                                    <p className="font-bold text-slate-900 mt-0.5 truncate">
                                      ON s/d Pekan {materiProgress.highestPekan.pekanNumber} — {materiProgress.highestPekan.title}{' '}
                                      {materiProgress.highestPekan.pekanNumber < materiProgress.totalCount && (
                                        <span className="text-rose-700">
                                          (Pekan {materiProgress.highestPekan.pekanNumber + 1}–{materiProgress.totalCount} OFF)
                                        </span>
                                      )}
                                    </p>
                                  ) : (
                                    <p className="font-semibold text-rose-700 mt-0.5">
                                      Semua materi saat ini OFF (Terkunci).
                                    </p>
                                  )}
                                  {materiProgress.highestPekan?.arabicTitle && (
                                    <p className="font-arabic text-sm text-emerald-900 mt-0.5" dir="rtl">
                                      {materiProgress.highestPekan.arabicTitle}
                                    </p>
                                  )}
                                </div>
                                <span className="font-mono font-bold text-sm text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200 shrink-0 self-start sm:self-center">
                                  {materiProgress.pct}%
                                </span>
                              </div>

                              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-700 rounded-full transition-all duration-300"
                                  style={{ width: `${materiProgress.pct}%` }}
                                />
                              </div>

                              <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                                <span className="font-semibold text-slate-700 shrink-0">
                                  Batas Materi ON:
                                </span>
                                <MateriLimitSelector
                                  pekans={materiProgress.pekans}
                                  currentLimit={currentHighestNum}
                                  totalCount={materiProgress.totalCount}
                                  onSelectLimit={(maxPekan) =>
                                    handleBatchUnlockUpTo(targetProgram.id, maxPekan, editingSchedule.id)
                                  }
                                />
                              </div>
                            </div>

                            {/* Compact Checklist Per Pekan (Toggle ON / OFF satuan) */}
                            <div className="max-h-[210px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1">
                              {materiProgress.pekans.map((p) => {
                                const unlocked = isPekanUnlocked(targetProgram.id, p.pekanNumber, editingSchedule.id);
                                return (
                                  <button
                                    key={`sch-materi-item-${editingSchedule.id}-p${p.pekanNumber}`}
                                    type="button"
                                    onClick={() => handleTogglePekanUnlock(targetProgram.id, p.pekanNumber, editingSchedule.id)}
                                    className={`text-left p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all cursor-pointer ${
                                      unlocked
                                        ? 'bg-emerald-50/80 border-emerald-300 hover:bg-emerald-100/70 text-emerald-950'
                                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                                    }`}
                                    title={unlocked ? 'Klik untuk me-nonaktifkan (OFF) materi pekan ini di kelas Zoom ini' : 'Klik untuk mengaktifkan (ON) materi pekan ini di kelas Zoom ini'}
                                  >
                                    <div className="min-w-0">
                                      <span className="font-mono font-bold text-[11px] block">
                                        Pekan {p.pekanNumber}
                                      </span>
                                      <span className="text-[11px] truncate block font-medium">
                                        {p.title}
                                      </span>
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                      unlocked
                                        ? 'bg-emerald-200 text-emerald-950'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}>
                                      {unlocked ? (
                                        <>
                                          <Check className="w-3 h-3" />
                                          <span>ON</span>
                                        </>
                                      ) : (
                                        <>
                                          <Lock className="w-2.5 h-2.5" />
                                          <span>OFF</span>
                                        </>
                                      )}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Section Izin Presensi Kelas Online (Absensi Santri Per Pertemuan) */}
                      {(() => {
                        const targetProgram = programs.find((p) => p.id === editingSchedule.programId || p.levelNumber === editingSchedule.levelNumber) || programs[0];
                        const meetings = buildProgramMeetings(targetProgram, editingSchedule);
                        const totalMeetings = meetings.length;
                        const unlockedCount = meetings.filter((m) => isAttendanceSessionUnlocked(targetProgram.id, m.sessionNumber)).length;
                        const lockedCount = totalMeetings - unlockedCount;

                        return (
                          <div className="sm:col-span-2 bg-gradient-to-br from-white to-[#FBF9F5] p-5 rounded-xl border border-slate-300 space-y-4 shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-950 text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-800">
                                  <CalendarCheck className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h4 className="text-sm font-bold text-slate-900">
                                      Izin Pengisian Presensi Kelas Online (Absensi Santri)
                                    </h4>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                                      {targetProgram.code} · {totalMeetings} Sesi
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                                    Peserta <strong>tidak dapat mengisi atau mengubah presensi</strong> di portal pelajar (<span className="font-mono text-emerald-950 font-bold">pelajar.html</span>) kecuali setelah diizinkan / dibuka oleh Superadmin di bawah ini.
                                  </p>
                                </div>
                              </div>

                              {/* Counter Badge */}
                              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                                  <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>{unlockedCount} Diizinkan</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
                                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                                  <span>{lockedCount} Terkunci</span>
                                </span>
                              </div>
                            </div>

                            {/* Quick Action Toolbar */}
                            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                                <CalendarClock className="w-4 h-4 text-emerald-800" />
                                <span>Aksi Cepat Izin Presensi:</span>
                              </span>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUnlockAllAttendanceSessions(targetProgram.id, totalMeetings)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
                                  title="Izinkan santri mengisi presensi untuk seluruh pertemuan"
                                >
                                  <Unlock className="w-3 h-3 text-emerald-300" />
                                  <span>Buka Semua Sesi ({totalMeetings})</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleLockAllAttendanceSessions(targetProgram.id, totalMeetings)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer"
                                  title="Kunci seluruh pertemuan agar santri tidak dapat mengisi presensi"
                                >
                                  <Lock className="w-3 h-3 text-rose-600" />
                                  <span>Kunci Semua Sesi</span>
                                </button>

                                {/* Quick unlock dropdown / buttons */}
                                <div className="flex items-center gap-1 pl-2 border-l border-slate-300">
                                  <span className="text-[11px] text-slate-500">Buka s/d:</span>
                                  {[1, 2, 4, 8, 12, 16, 22, 32, 44].filter((n) => n <= totalMeetings).map((n) => (
                                    <button
                                      key={`btn-unlock-upto-${n}`}
                                      type="button"
                                      onClick={() => handleBatchUnlockAttendanceUpTo(targetProgram.id, n, totalMeetings)}
                                      className="px-2 py-1 text-[11px] font-mono font-bold rounded bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 transition-colors cursor-pointer"
                                      title={`Buka presensi Pertemuan 1 s/d ${n}, kunci pertemuan setelahnya`}
                                    >
                                      Sesi 1–{n}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Grid of All Sessions */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                                <span>Daftar Sesi Perkuliahan ({totalMeetings} Pertemuan)</span>
                                <span>Status Izin & Aksi</span>
                              </div>

                              <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                                {meetings.map((m) => {
                                  const isUnlocked = isAttendanceSessionUnlocked(targetProgram.id, m.sessionNumber);
                                  return (
                                    <div
                                      key={`adm-att-${targetProgram.id}-s${m.sessionNumber}`}
                                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                                        isUnlocked
                                          ? 'bg-emerald-50/50 border-emerald-300 hover:border-emerald-400'
                                          : 'bg-white border-slate-200 hover:border-slate-300'
                                      }`}
                                    >
                                      <div className="min-w-0 flex items-start gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                                          isUnlocked
                                            ? 'bg-emerald-800 text-white'
                                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                                        }`}>
                                          {String(m.sessionNumber).padStart(2, '0')}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold text-slate-900">
                                              Pertemuan {m.sessionNumber} (Pekan {m.pekanNumber})
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-500">
                                              {m.dateStr} · {m.timeWIB}
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-700 truncate mt-0.5 font-medium">
                                            {m.title}
                                          </p>
                                          {m.arabicTitle && (
                                            <p className="text-xs font-arabic text-emerald-900" dir="rtl">
                                              {m.arabicTitle}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                        {isUnlocked ? (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs">
                                            <Unlock className="w-3.5 h-3.5 text-emerald-700" />
                                            <span>DIIZINKAN</span>
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
                                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                                            <span>TERKUNCI</span>
                                          </span>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleToggleAttendanceSessionUnlock(targetProgram.id, m.sessionNumber)}
                                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-2xs ${
                                            isUnlocked
                                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                                              : 'bg-emerald-900 hover:bg-emerald-800 text-white'
                                          }`}
                                          title={isUnlocked ? 'Klik untuk mengunci presensi sesi ini' : 'Klik untuk mengizinkan presensi sesi ini'}
                                        >
                                          {isUnlocked ? (
                                            <>
                                              <Lock className="w-3 h-3 text-rose-600" />
                                              <span>Kunci</span>
                                            </>
                                          ) : (
                                            <>
                                              <Unlock className="w-3 h-3 text-emerald-300" />
                                              <span>Izinkan</span>
                                            </>
                                          )}
                                        </button>

                                        {/* Tombol Kirim Link ke Grup WA */}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenAttendanceWhatsAppModal(targetProgram, editingSchedule, m)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-lg transition-all cursor-pointer shadow-2xs"
                                          title="Buka dialog pengiriman link absensi pertemuan ini ke grup WhatsApp santri"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                          <span>Kirim ke WA</span>
                                        </button>

                                        {/* Tombol Salin Cepat Format WA */}
                                        <button
                                          type="button"
                                          onClick={() => handleQuickCopyAttendanceWA(targetProgram, editingSchedule, m)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                                          title="Salin teks pesan WhatsApp beserta link presensi ke clipboard"
                                        >
                                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                                          <span className="hidden xl:inline">Salin</span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                          </div>
                        </div>

                        {/* Inline Save Notification right above Footer */}
                        {statusMessage && (
                          <div
                            role="status"
                            className={`px-4 py-3 border-t flex items-center gap-2.5 text-xs font-semibold ${
                              statusMessage.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-rose-50 border-rose-200 text-rose-900'
                            }`}
                          >
                            {statusMessage.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                            )}
                            <span className="flex-1">{statusMessage.text}</span>
                          </div>
                        )}

                        {/* Modal Sticky Footer */}
                        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                          {schedules.some((s) => s.id === editingSchedule.id) ? (
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={handleRequestDeleteSchedule}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Kelas</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              Kelas baru (belum disimpan)
                            </span>
                          )}

                          <div className="flex items-center gap-2.5">
                            {pageMode === 'edit-jadwal' ? (
                              <a
                                href="./superadmin.html?tab=schedules"
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Kembali ke Daftar Jadwal</span>
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsDeleteScheduleConfirmOpen(false);
                                  setIsScheduleEditModalOpen(false);
                                }}
                                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                Tutup
                              </button>
                            )}
                            <button
                              type="submit"
                              disabled={isSaving}
                              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Jadwal'}</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* POPUP VERIFIKASI HAPUS KELAS */}
                  {(pageMode === 'edit-jadwal' || isScheduleEditModalOpen) &&
                    isDeleteScheduleConfirmOpen &&
                    editingSchedule && (
                    <div
                      role="alertdialog"
                      aria-modal="true"
                      aria-labelledby="delete-schedule-confirm-title"
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
                      onClick={(e) => {
                        if (e.target === e.currentTarget && !isSaving) {
                          setIsDeleteScheduleConfirmOpen(false);
                        }
                      }}
                    >
                      <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="p-5 bg-rose-50 border-b border-rose-200 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Trash2 className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700">
                              VERIFIKASI PENGHAPUSAN KELAS
                            </span>
                            <h4
                              id="delete-schedule-confirm-title"
                              className="text-base font-bold text-slate-900 mt-0.5"
                            >
                              Yakin ingin menghapus kelas ini?
                            </h4>
                          </div>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => setIsDeleteScheduleConfirmOpen(false)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Batal & Tutup Verifikasi"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="p-5 space-y-3 text-xs text-slate-700">
                          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500">Kode Kelas:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {editingSchedule.batchCode}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500">Angkatan:</span>
                              <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {editingSchedule.angkatan?.trim() || 'Angkatan 1'}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-slate-500 shrink-0">Nama Kelas:</span>
                              <span className="font-semibold text-slate-900 text-right">
                                {editingSchedule.programName}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-slate-500">Jadwal:</span>
                              <span className="font-medium text-slate-800">
                                {editingSchedule.days} ({editingSchedule.timeWIB})
                              </span>
                            </div>
                          </div>

                          {scheduleRealEnrolledCount > 0 ? (
                            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2 text-amber-950 leading-relaxed">
                              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                              <span>
                                Perhatian: saat ini tercatat ada <strong>{scheduleRealEnrolledCount} santri</strong> yang terhubung ke jadwal kelas ini. Menghapus kelas akan menghilangkan pilihan kelas ini dari daftar jadwal aktif.
                              </span>
                            </div>
                          ) : (
                            <p className="text-slate-600 leading-relaxed">
                              Kelas beserta pengaturan jadwal dan akses kelas Zoom-nya akan dihapus dari daftar jadwal aktif. Tindakan ini tidak dapat dibatalkan.
                            </p>
                          )}
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => setIsDeleteScheduleConfirmOpen(false)}
                            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleDeleteCurrentSchedule}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isSaving ? 'Menghapus...' : 'Ya, Hapus Kelas'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DETAIL LEVEL & KURIKULUM (KHUSUS INFORMASI INDEX.HTML UNTUK CALON PENDAFTAR) */}
              {activeTab === 'kurikulum' && isSuperAdmin && editingKurikulumProgram && (
                <div className="space-y-6">
                  <section
                    id="section-detail-level-kurikulum"
                    className="bg-white border border-amber-200 rounded-2xl overflow-hidden shadow-2xs"
                  >
                    <div className="p-5 sm:p-6 bg-gradient-to-r from-[#FBF9F5] via-amber-50/70 to-white border-b border-amber-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-900 text-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-800">
                            INFORMASI PUBLIK HALAMAN DEPAN (INDEX.HTML)
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                            Pengaturan Detail Level &amp; Kurikulum (Level 1 – Level 4)
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
                            Khusus mengatur informasi kurikulum dan gambaran program yang tampil pada halaman depan &amp; pendaftaran calon santri (<span className="font-mono font-semibold text-amber-950">index.html</span>). Terpisah dari pengaturan jadwal kelas Zoom sehingga tidak mengubah jadwal per angkatan.
                          </p>
                        </div>
                      </div>

                      {/* Level Selector Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {programs.map((prog) => {
                          const isChosen = editingKurikulumProgram.id === prog.id;
                          return (
                            <button
                              key={`kurikulum-pill-${prog.id}`}
                              type="button"
                              onClick={() => setSelectedKurikulumProgramId(prog.id)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                isChosen
                                  ? 'bg-amber-900 text-white border-amber-900 shadow-xs'
                                  : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-50'
                              }`}
                            >
                              Level {prog.levelNumber}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <form onSubmit={handleDetailKurikulumSubmit} className="p-5 sm:p-6 space-y-5">
                      {/* Info Sinkronisasi ke index.html */}
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2 text-amber-950">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-white border border-amber-300">
                            {editingKurikulumProgram.code}
                          </span>
                          <span className="font-semibold">
                            Menampilkan informasi Level {editingKurikulumProgram.levelNumber} kepada calon pendaftar di <span className="font-mono">index.html</span>
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-amber-900">
                          ✓ Sinkron ke index.html saja
                        </span>
                      </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-800 mb-1">
                              Nama Program / Judul Level
                            </label>
                            <input
                              type="text"
                              required
                              value={editingKurikulumProgram.title}
                              onChange={(e) =>
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
                                  title: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-800 mb-1">
                              Judul Bahasa Arab (Teks Arab)
                            </label>
                            <input
                              type="text"
                              dir="rtl"
                              required
                              value={editingKurikulumProgram.arabicTitle}
                              onChange={(e) =>
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
                                  arabicTitle: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 text-base font-arabic bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-800 mb-1">
                              Kategori Keilmuan
                            </label>
                            <select
                              value={editingKurikulumProgram.category}
                              onChange={(e) =>
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
                                  category: e.target.value as 'nahwu' | 'shorof'
                                })
                              }
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                            >
                              <option value="nahwu">Ilmu Nahwu (Level 1–3)</option>
                              <option value="shorof">Ilmu Shorof (Level 4)</option>
                            </select>
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
                              value={editingKurikulumProgram.durationWeeks}
                              onChange={(e) => {
                                const weeks = Number(e.target.value) || 8;
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
                                  durationWeeks: weeks,
                                  sessionsCount: weeks * 2
                                });
                              }}
                              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-800 mb-1">
                              Label Ringkas Level
                            </label>
                            <input
                              type="text"
                              required
                              value={editingKurikulumProgram.categoryLabel}
                              onChange={(e) =>
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
                                  categoryLabel: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-800 mb-1">
                              Modul / Kitab Pegangan
                            </label>
                            <input
                              type="text"
                              required
                              value={editingKurikulumProgram.kitabReference}
                              onChange={(e) =>
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
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
                              value={editingKurikulumProgram.levelRecommendation}
                              onChange={(e) =>
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
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
                              value={editingKurikulumProgram.summary}
                              onChange={(e) =>
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
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
                              value={editingKurikulumProgram.targetOutcome}
                              onChange={(e) =>
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
                                  targetOutcome: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-800 mb-1">
                              Informasi Hari Belajar (Tampil di index.html)
                            </label>
                            <input
                              type="text"
                              required
                              value={editingKurikulumProgram.scheduleDays}
                              onChange={(e) =>
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
                                  scheduleDays: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-800 mb-1">
                              Informasi Jam Belajar WIB (Tampil di index.html)
                            </label>
                            <input
                              type="text"
                              required
                              value={editingKurikulumProgram.scheduleTime}
                              onChange={(e) =>
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
                                  scheduleTime: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-800 mb-1">
                              Biaya Pendaftaran Kelas (IDR)
                            </label>
                            <input
                              type="number"
                              min={10000}
                              step={5000}
                              required
                              value={editingKurikulumProgram.tuitionIDR}
                              onChange={(e) =>
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
                                  tuitionIDR: Number(e.target.value) || 0
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
                              placeholder="Contoh: Online Live Interaktif (Zoom)"
                              value={
                                editingKurikulumProgram.modeLabel ??
                                schedules.find((s) => s.programId === editingKurikulumProgram.id)
                                  ?.modeLabel ??
                                'Online Live Interaktif (Zoom)'
                              }
                              onChange={(e) =>
                                setEditingKurikulumProgram({
                                  ...editingKurikulumProgram,
                                  modeLabel: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-amber-200/70 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[11px] text-slate-500">
                            Menyimpan informasi <strong>Level {editingKurikulumProgram.levelNumber} ({editingKurikulumProgram.code})</strong> khusus untuk halaman depan &amp; pendaftaran (<span className="font-mono">index.html</span>).
                          </span>
                          <button
                            type="submit"
                            disabled={isSaving}
                            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-amber-900 hover:bg-amber-800 rounded-xl transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>
                              {isSaving
                                ? 'Menyimpan...'
                                : `Simpan Info Level ${editingKurikulumProgram.levelNumber} (index.html)`}
                            </span>
                          </button>
                        </div>
                      </form>
                    </section>
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
                        {unselectedStudentAccounts.length > 0 && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            {unselectedStudentAccounts.length} Belum Pilih Level
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold text-slate-900 mt-0.5">
                        Daftar Peserta Program Tadribul Lughah
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Lihat, cari, filter, verifikasi status, dan kelola data pendaftar Level 1–4 serta calon santri yang belum memilih level.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={registrationsSubView === 'unselected' ? handleExportUnselectedCsv : handleExportCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                        {registrationsSubView === 'unselected' ? 'Ekspor CSV Belum Pilih Lv' : 'Ekspor CSV (.csv)'}
                      </button>

                      <button
                        type="button"
                        onClick={registrationsSubView === 'unselected' ? handleCopyUnselectedWa : handleCopyRegistrantList}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        {registrationsSubView === 'unselected' ? 'Salin Kontak WA Belum Pilih' : 'Salin List Ringkas'}
                      </button>

                      <button
                        type="button"
                        onClick={handleCreateNewRegistration}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Peserta Baru
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
                      <p className="text-[11px] font-mono text-emerald-700 uppercase">Lunas Penuh (6/6)</p>
                      <p className="text-xl font-bold font-mono text-emerald-900 mt-1">{totalLunas}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Biaya lunas tuntas</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <p className="text-[11px] font-mono text-rose-700 uppercase">Belum Lunas (Bln 1)</p>
                      <p className="text-xl font-bold font-mono text-rose-900 mt-1">{totalBelumLunas}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Belum ada bayaran</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegistrationsSubView('unselected')}
                      className={`text-left rounded-xl p-4 transition-all cursor-pointer border ${
                        registrationsSubView === 'unselected'
                          ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-300 shadow-xs'
                          : 'bg-amber-50/70 border-amber-300 hover:bg-amber-100/60'
                      }`}
                      title="Klik untuk melihat daftar calon santri yang belum memilih level"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-mono text-amber-800 font-bold uppercase">Belum Pilih Level</p>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      </div>
                      <p className="text-xl font-bold font-mono text-amber-950 mt-1">{unselectedStudentAccounts.length}</p>
                      <p className="text-[11px] text-amber-800 font-medium mt-0.5 flex items-center gap-1">
                        <span>Akun Baru Terdaftar</span>
                        <span>→</span>
                      </p>
                    </button>
                  </div>

                  {/* Sub-view Navigation Bar: 1. Peserta Terdaftar (Sudah Pilih Level) vs 2. Belum Memilih Level */}
                  <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/80 rounded-xl border border-slate-300/80">
                    <button
                      type="button"
                      onClick={() => setRegistrationsSubView('selected')}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        registrationsSubView === 'selected'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-700 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 text-emerald-700" />
                      <span>1. Peserta Sudah Memilih Level</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-900 font-bold">
                        {registrations.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegistrationsSubView('unselected')}
                      className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                        registrationsSubView === 'unselected'
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                          : 'text-amber-900 hover:text-amber-950 hover:bg-amber-100/80'
                      }`}
                    >
                      <UserPlus className="w-4 h-4 text-amber-950" />
                      <span>2. Calon Santri Belum Memilih Level</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        registrationsSubView === 'unselected' ? 'bg-amber-950 text-amber-100' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {unselectedStudentAccounts.length}
                      </span>
                    </button>
                  </div>

                  {/* KONTEN TAB 3: DIBAGI MENJADI 2 SUB-VIEW */}
                  {registrationsSubView === 'unselected' ? (
                    /* ==============================================================
                       SUB-VIEW 2: CALON SANTRI SUDAH BUAT AKUN (BELUM MEMILIH LEVEL)
                       ============================================================== */
                    <div className="space-y-4">
                      {/* Notice Banner Informasional */}
                      <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-xs">
                            <AlertCircle className="w-5 h-5 text-amber-950" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-amber-950">
                              Daftar Calon Santri Sudah Buat Akun (Belum Memilih Level Program)
                            </h3>
                            <p className="text-xs text-amber-900 leading-relaxed max-w-3xl">
                              Calon santri di bawah ini telah berhasil menyelesaikan <strong>Langkah 1: Membuat Akun Pelajar</strong> (nama lengkap, kontak WhatsApp, email aktif, kota domisili, dan kata sandi sudah tersimpan), namun belum menyelesaikan <strong>Langkah 2: Memilih Level Program (Level 1–4)</strong>.
                              Gunakan tombol <strong>Hubungi WA</strong> untuk follow-up dan konsultasi kurikulum ramah, atau klik <strong>Tentukan Level</strong> untuk langsung mendaftarkan peserta ke kelas secara manual.
                            </p>
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCopyUnselectedWa}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-950 bg-amber-200 hover:bg-amber-300 border border-amber-400 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Semua WA ({filteredUnselectedAccounts.length})</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleExportUnselectedCsv}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Ekspor CSV</span>
                          </button>
                        </div>
                      </div>

                      {/* Search & Filter Toolbar for Unselected */}
                      <div className="bg-white border border-slate-200 rounded-xl p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          {/* Search Input */}
                          <div className="sm:col-span-8 relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={unselectedSearchQuery}
                              onChange={(e) => setUnselectedSearchQuery(e.target.value)}
                              placeholder="Cari nama, email, No. Reg Akun, WhatsApp, kota domisili..."
                              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
                            />
                            {unselectedSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setUnselectedSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Filter Gender */}
                          <div className="sm:col-span-4">
                            <select
                              value={unselectedFilterGender}
                              onChange={(e) => setUnselectedFilterGender(e.target.value)}
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600 font-medium"
                            >
                              <option value="all">Semua Jenis Kelamin (Ikhwan & Akhwat)</option>
                              <option value="Laki-laki">Hanya Ikhwan (Laki-laki)</option>
                              <option value="Perempuan">Hanya Akhwat (Perempuan)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 mt-3">
                          <span>
                            Menampilkan <strong>{filteredUnselectedAccounts.length}</strong> dari <strong>{unselectedStudentAccounts.length}</strong> calon santri belum pilih level
                          </span>
                          {(unselectedSearchQuery || unselectedFilterGender !== 'all') && (
                            <button
                              type="button"
                              onClick={() => {
                                setUnselectedSearchQuery('');
                                setUnselectedFilterGender('all');
                              }}
                              className="text-xs text-rose-700 hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Reset Filter
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Table of Unselected Student Accounts */}
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-900 text-white font-mono text-[11px] uppercase tracking-wider">
                                <th className="py-3 px-4 font-semibold w-12 text-center">No</th>
                                <th className="py-3 px-4 font-semibold">No. Registrasi Akun</th>
                                <th className="py-3 px-4 font-semibold">Nama & Gender</th>
                                <th className="py-3 px-4 font-semibold">Kontak (WhatsApp & Email)</th>
                                <th className="py-3 px-4 font-semibold">Domisili & Aktivitas</th>
                                <th className="py-3 px-4 font-semibold">Waktu Buat Akun</th>
                                <th className="py-3 px-4 font-semibold text-center">Status Level</th>
                                <th className="py-3 px-4 font-semibold text-center w-56">Aksi Follow-Up</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {filteredUnselectedAccounts.length > 0 ? (
                                filteredUnselectedAccounts.map((acc, index) => {
                                  const isMale = (acc.gender || 'Laki-laki') === 'Laki-laki';
                                  const waDigits = acc.whatsapp.replace(/[^0-9]/g, '');
                                  const formattedWa = waDigits.startsWith('0') ? '62' + waDigits.slice(1) : waDigits;

                                  return (
                                    <tr key={acc.registrationNumber} className="hover:bg-amber-50/30 transition-colors">
                                      <td className="py-3 px-4 text-center font-mono text-slate-500 font-medium">
                                        {index + 1}
                                      </td>
                                      <td className="py-3 px-4">
                                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                          {acc.registrationNumber}
                                        </span>
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="font-semibold text-slate-900">{acc.fullName}</div>
                                        <div className="mt-0.5">
                                          <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                            isMale ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-purple-50 text-purple-800 border border-purple-200'
                                          }`}>
                                            {acc.gender || 'Laki-laki'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 space-y-1">
                                        <a
                                          href={`https://wa.me/${formattedWa}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 font-mono text-emerald-800 hover:text-emerald-950 font-semibold underline"
                                          title="Buka WhatsApp Chat"
                                        >
                                          <Phone className="w-3 h-3 text-emerald-700" />
                                          <span>{formatWhatsAppNumber(acc.whatsapp) || acc.whatsapp}</span>
                                        </a>
                                        <div className="text-[11px] text-slate-600 flex items-center gap-1 truncate max-w-[200px]" title={acc.email}>
                                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate">{acc.email}</span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="font-medium text-slate-800">{acc.city || 'Indonesia'}</div>
                                        <div className="text-[11px] text-slate-500">{acc.occupation || 'Pelajar Terdaftar'}</div>
                                      </td>
                                      <td className="py-3 px-4 text-slate-600 text-[11px] font-mono">
                                        {acc.createdAt || '-'}
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                                          <AlertCircle className="w-3 h-3 text-amber-700 shrink-0" />
                                          <span>Belum Pilih Level</span>
                                        </span>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                          {/* Hubungi WhatsApp */}
                                          <button
                                            type="button"
                                            onClick={() => openWhatsAppFollowUp(acc)}
                                            title="Kirim pesan WhatsApp follow-up otomatis"
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs cursor-pointer"
                                          >
                                            <Phone className="w-3 h-3" />
                                            <span>Hubungi WA</span>
                                          </button>

                                          {/* Tentukan Level */}
                                          <button
                                            type="button"
                                            onClick={() => handleOpenAssignModal(acc)}
                                            title="Daftarkan calon santri ini ke salah satu level secara manual"
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors shadow-2xs cursor-pointer"
                                          >
                                            <BookOpen className="w-3 h-3 text-emerald-400" />
                                            <span>Tentukan Level</span>
                                          </button>

                                          {/* Hapus Akun */}
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteUnselectedAccount(acc)}
                                            title="Hapus akun calon santri"
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
                                  <td colSpan={8} className="py-12 text-center text-slate-500 space-y-2">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                                    <p className="font-semibold text-slate-800">
                                      Tidak ada calon santri yang belum memilih level!
                                    </p>
                                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                                      {unselectedSearchQuery
                                        ? 'Tidak ditemukan calon santri yang sesuai kata kunci pencarian.'
                                        : 'Alhamdulillah, seluruh calon santri yang memiliki akun telah terdaftar di program level.'}
                                    </p>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ==============================================================
                       SUB-VIEW 1: PESERTA TERDAFTAR (SUDAH MEMILIH LEVEL 1–4)
                       ============================================================== */
                    <>
                      {/* Search & Filter Toolbar */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                      {/* Search Bar */}
                      <div className="lg:col-span-4 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Cari nama, No. Reg, Angkatan, WA, kota..."
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
                      <div className="lg:col-span-3">
                        <select
                          value={filterLevel}
                          onChange={(e) => {
                            if (e.target.value === 'unselected') {
                              setRegistrationsSubView('unselected');
                            } else {
                              setFilterLevel(e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        >
                          <option value="all">Semua Program Level</option>
                          {programs.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} — Level {p.levelNumber} ({p.angkatan || 'Angkatan 1'})
                            </option>
                          ))}
                          <option value="unselected">⚠️ Belum Memilih Level ({unselectedStudentAccounts.length})</option>
                        </select>
                      </div>

                      {/* Filter Angkatan */}
                      <div className="lg:col-span-2">
                        <select
                          value={filterAngkatan}
                          onChange={(e) => setFilterAngkatan(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 font-semibold text-emerald-950"
                        >
                          <option value="all">Semua Angkatan</option>
                          {availableAngkatans.map((ang) => (
                            <option key={ang} value={ang}>
                              {ang}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter Status Pembayaran */}
                      <div className="lg:col-span-2">
                        <select
                          value={filterPayment}
                          onChange={(e) => setFilterPayment(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        >
                          <option value="all">Semua Pembayaran</option>
                          <option value="unpaid">Belum Lunas (Bulan 1)</option>
                          <option value="cicilan">Cicilan Berjalan (1-5)</option>
                          <option value="lunas">Lunas Penuh (6/6)</option>
                        </select>
                      </div>

                      {/* Filter Gender */}
                      <div className="lg:col-span-1">
                        <select
                          value={filterGender}
                          onChange={(e) => setFilterGender(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-slate-50/50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        >
                          <option value="all">Gender</option>
                          <option value="Laki-laki">Ikhwan</option>
                          <option value="Perempuan">Akhwat</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span>
                        Menampilkan <strong>{filteredRegistrations.length}</strong> dari <strong>{registrations.length}</strong> peserta
                        {searchQuery || filterLevel !== 'all' || filterAngkatan !== 'all' || filterPayment !== 'all' || filterGender !== 'all' ? ' (terfilter)' : ''}
                      </span>

                      {(searchQuery || filterLevel !== 'all' || filterAngkatan !== 'all' || filterPayment !== 'all' || filterGender !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setFilterLevel('all');
                            setFilterAngkatan('all');
                            setFilterPayment('all');
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
                            <th className="py-3 px-4 font-semibold text-center">Angkatan</th>
                            <th className="py-3 px-4 font-semibold">Program / Level</th>
                            <th className="py-3 px-4 font-semibold">Kontak (WhatsApp / Email)</th>
                            <th className="py-3 px-4 font-semibold">Domisili</th>
                            <th className="py-3 px-4 font-semibold">Status Pembayaran & Cicilan</th>
                            <th className="py-3 px-4 font-semibold text-center w-40">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {filteredRegistrations.length > 0 ? (
                            filteredRegistrations.map((r, index) => {
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

                                  {/* 4. Angkatan Column */}
                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs whitespace-nowrap">
                                      <GraduationCap className="w-3.5 h-3.5 text-emerald-800" />
                                      <span>{getRegistrationAngkatan(r)}</span>
                                    </span>
                                  </td>

                                  {/* 5. Program Level & Schedule */}
                                  <td className="py-3 px-4">
                                    <p className="font-semibold text-slate-900">
                                      {r.selectedProgramName.includes('Angkatan') ? r.selectedProgramName : `${r.selectedProgramName} (${getRegistrationAngkatan(r)})`}
                                    </p>
                                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1 font-mono">
                                      {r.selectedScheduleSummary}
                                    </p>
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
                                          <span>{formatWhatsAppNumber(r.whatsapp) || r.whatsapp}</span>
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

                                  {/* 8. Tuition Fee & Installment Status */}
                                  <td className="py-3 px-4 font-mono">
                                    {(() => {
                                      const total = r.totalTuitionIDR || 510000;
                                      const monthly = Math.round(total / 6);
                                      const paid = typeof r.paidTuitionIDR === 'number'
                                        ? r.paidTuitionIDR
                                        : 0;
                                      const count = typeof r.installmentPaidCount === 'number'
                                        ? r.installmentPaidCount
                                        : Math.min(6, Math.floor(paid / (monthly || 85000)));
                                      const remaining = Math.max(0, total - paid);
                                      const isLunas = count >= 6 || remaining === 0;

                                      return (
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            {isLunas ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                <Check className="w-3 h-3 text-emerald-700" />
                                                Lunas (6/6)
                                              </span>
                                            ) : count > 0 ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                                <CreditCard className="w-3 h-3 text-amber-700" />
                                                Cicilan {count}/6
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-950 border border-rose-300">
                                                <AlertCircle className="w-3 h-3 text-rose-700 shrink-0" />
                                                <span>Belum Lunas (Bulan 1)</span>
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[11px] text-slate-800">
                                            Terbayar: <strong className="text-emerald-800">{formatIDR(paid)}</strong>
                                          </div>
                                          <div className="text-[10px] text-slate-500">
                                            {isLunas ? `Total: ${formatIDR(total)}` : `Sisa: ${formatIDR(remaining)} (@ ${formatIDR(monthly)}/bln)`}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </td>

                                  {/* 9. Actions */}
                                  <td className="py-3 px-4">
                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPaymentModal(r)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded shadow-xs transition-colors"
                                        title="Verifikasi Pembayaran & Sisa Cicilan Santri"
                                      >
                                        <CreditCard className="w-3 h-3 text-emerald-800" />
                                        <span>Cicilan</span>
                                      </button>

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
                                        onClick={() => setDeletingRegistrationTarget(r)}
                                        className="inline-flex items-center justify-center p-1 text-rose-700 hover:text-white hover:bg-rose-700 border border-rose-300 rounded transition-colors cursor-pointer disabled:opacity-50"
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
                              <td colSpan={10} className="py-12 text-center text-slate-500">
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
                </>
              )}

              {/* MODAL DIALOG: ASSIGN / TENTUKAN LEVEL UNTUK CALON SANTRI */}
              {assigningAccount && (
                <div
                  role="dialog"
                  aria-modal="true"
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
                >
                  <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
                    {/* Modal Header */}
                    <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <h3 className="text-sm font-bold">Tentukan & Daftarkan Level Program</h3>
                          <p className="text-[11px] text-slate-300">
                            Calon Santri: {assigningAccount.fullName} ({assigningAccount.registrationNumber})
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAssigningAccount(null)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Form */}
                    <form onSubmit={handleAssignLevelSubmit} className="p-6 space-y-4">
                      {/* Ringkasan Profil Calon Santri */}
                      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-800">Nama Lengkap:</span>
                          <span className="font-bold text-slate-900">{assigningAccount.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>WhatsApp / Email:</span>
                          <span className="font-mono text-slate-800">{formatWhatsAppNumber(assigningAccount.whatsapp) || assigningAccount.whatsapp} · {assigningAccount.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Domisili:</span>
                          <span>{assigningAccount.city || 'Indonesia'} ({assigningAccount.occupation || 'Pelajar'})</span>
                        </div>
                      </div>

                      {/* Pilihan Level Program */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                          Pilih Level Pembelajaran *
                        </label>
                        <select
                          value={assignLevelId}
                          onChange={(e) => {
                            const newProgId = e.target.value;
                            setAssignLevelId(newProgId);
                            const scheds = schedules.filter((s) => s.programId === newProgId);
                            if (scheds.length > 0) {
                              setAssignScheduleId(scheds[0].id);
                            }
                          }}
                          className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 font-semibold text-slate-900"
                        >
                          {programs.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.code} — {p.title} ({p.angkatan || 'Angkatan 1'}) — {formatIDR(p.tuitionIDR || 510000)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Pilihan Jadwal Kelas */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                          Pilih Jadwal Kelas Zoom *
                        </label>
                        <select
                          value={assignScheduleId}
                          onChange={(e) => setAssignScheduleId(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 text-slate-900"
                        >
                          {schedules
                            .filter((s) => s.programId === assignLevelId)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.days} · {s.timeWIB} (Mulai: {s.startDate || 'Segera'})
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Skema Pembayaran */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                          Skema Pembayaran *
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <label
                            className={`flex items-center gap-2 p-2.5 text-xs rounded-lg border cursor-pointer ${
                              assignPaymentStatus === 'cicilan'
                                ? 'bg-rose-50 border-rose-600 text-rose-950 font-bold'
                                : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="assign-pay"
                              checked={assignPaymentStatus === 'cicilan'}
                              onChange={() => setAssignPaymentStatus('cicilan')}
                              className="accent-rose-800"
                            />
                            <span>Belum Bayar (Cicilan Bulan 1)</span>
                          </label>
                          <label
                            className={`flex items-center gap-2 p-2.5 text-xs rounded-lg border cursor-pointer ${
                              assignPaymentStatus === 'lunas'
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold'
                                : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="assign-pay"
                              checked={assignPaymentStatus === 'lunas'}
                              onChange={() => setAssignPaymentStatus('lunas')}
                              className="accent-emerald-800"
                            />
                            <span>Lunas Langsung (Rp 510.000)</span>
                          </label>
                        </div>
                      </div>

                      {/* Modal Actions */}
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setAssigningAccount(null)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isAssigning}
                          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isAssigning ? 'Menyimpan...' : 'Simpan & Daftarkan Peserta'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

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
                                  type="tel"
                                  required
                                  value={formatWhatsAppNumber(editingRegistration.whatsapp) || editingRegistration.whatsapp}
                                  onChange={(e) =>
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      whatsapp: formatWhatsAppNumber(e.target.value)
                                    })
                                  }
                                  placeholder="0812-3456-7890"
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

                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Sudah Dibayar (IDR)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  step={5000}
                                  value={editingRegistration.paidTuitionIDR ?? 0}
                                  onChange={(e) => {
                                    const val = Number(e.target.value) || 0;
                                    const monthly = Math.round(editingRegistration.totalTuitionIDR / 6);
                                    const autoCount = Math.min(6, Math.floor(val / (monthly || 85000)));
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      paidTuitionIDR: val,
                                      installmentPaidCount: autoCount,
                                      paymentPlan: val >= editingRegistration.totalTuitionIDR ? 'lunas' : 'cicilan'
                                    });
                                  }}
                                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                  placeholder="Contoh: 85000 atau 170000"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-800 mb-1">
                                  Jumlah Cicilan Lunas
                                </label>
                                <select
                                  value={editingRegistration.installmentPaidCount ?? 0}
                                  onChange={(e) => {
                                    const count = Number(e.target.value);
                                    const monthly = Math.round(editingRegistration.totalTuitionIDR / 6);
                                    const calcPaid = count === 6 ? editingRegistration.totalTuitionIDR : count * monthly;
                                    setEditingRegistration({
                                      ...editingRegistration,
                                      installmentPaidCount: count,
                                      paidTuitionIDR: calcPaid,
                                      paymentPlan: count === 6 ? 'lunas' : 'cicilan'
                                    });
                                  }}
                                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                >
                                  <option value={0}>0 dari 6 Cicilan (Belum Bayar)</option>
                                  <option value={1}>1 dari 6 Cicilan (Lunas Bulan 1)</option>
                                  <option value={2}>2 dari 6 Cicilan (Lunas Bulan 2)</option>
                                  <option value={3}>3 dari 6 Cicilan (Lunas Bulan 3)</option>
                                  <option value={4}>4 dari 6 Cicilan (Lunas Bulan 4)</option>
                                  <option value={5}>5 dari 6 Cicilan (Lunas Bulan 5)</option>
                                  <option value={6}>6 dari 6 Cicilan (Lunas 100%)</option>
                                </select>
                              </div>

                              <div className="sm:col-span-2">
                                <div className="flex items-center justify-between mb-1">
                                  <label className="block text-xs font-semibold text-slate-800">
                                    Program Level Pilihan
                                  </label>
                                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                                    <GraduationCap className="w-3.5 h-3.5 text-emerald-800" />
                                    Angkatan: {getRegistrationAngkatan(editingRegistration)}
                                  </span>
                                </div>
                                <select
                                  value={editingRegistration.selectedProgramId}
                                  onChange={(e) => {
                                    const prog = programs.find((p) => p.id === e.target.value);
                                    if (prog) {
                                      setEditingRegistration({
                                        ...editingRegistration,
                                        selectedProgramId: prog.id,
                                        selectedProgramName: `${prog.title} (${prog.angkatan || 'Angkatan 1'})`,
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
                              onClick={() => setDeletingRegistrationTarget(editingRegistration)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
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

              {/* =====================================================================
                  TAB: LAPORAN KEUANGAN & ARUS KAS PEMBELAJARAN
                 ===================================================================== */}
              {activeTab === 'keuangan' && isSuperAdmin && (
                <div className="space-y-6">
                  {/* Top Header Card with Export & Print */}
                  <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-white/10 text-emerald-200 border border-white/15 mb-2">
                          <Receipt className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Laporan Akuntansi & Arus Kas Ma'had</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
                          Laporan Keuangan & Kas Pembelajaran
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 mt-1">
                          Rekapitulasi penerimaan biaya pendidikan (SPP), piutang cicilan, saldo per rekening, dan status pelunasan santri.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={handleExportFinancialReportCSV}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white transition-colors shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Ekspor CSV Keuangan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Laporan</span>
                        </button>
                      </div>
                    </div>

                    {/* 4 KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/15">
                      {/* KPI 1 */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                          <span>Total Potensi Kas</span>
                          <Receipt className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="text-xl font-bold font-mono text-white">
                          {formatIDR(financialStats.grossPotential)}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Total omset dari {registrations.length} santri terdaftar
                        </p>
                      </div>

                      {/* KPI 2 */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
                          <span>Kas Masuk Terverifikasi</span>
                          <Wallet className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-xl font-bold font-mono text-emerald-300">
                          {formatIDR(financialStats.totalCashCollected)}
                        </div>
                        <p className="text-[11px] text-emerald-200/80 mt-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          <span>{financialStats.collectionRatePercent}% dari target terkumpul</span>
                        </p>
                      </div>

                      {/* KPI 3 */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
                          <span>Piutang Sisa Cicilan</span>
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="text-xl font-bold font-mono text-amber-300">
                          {formatIDR(financialStats.totalReceivables)}
                        </div>
                        <p className="text-[11px] text-amber-200/80 mt-1">
                          Kewajiban dari {financialStats.installmentPayingCount + financialStats.zeroPaidCount} santri aktif
                        </p>
                      </div>

                      {/* KPI 4 */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center justify-between text-xs text-teal-300 mb-1">
                          <span>Status Lunas Santri</span>
                          <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        </div>
                        <div className="text-xl font-bold font-mono text-teal-300">
                          {financialStats.fullyPaidCount} <span className="text-xs font-normal text-slate-300">dari {registrations.length} Santri</span>
                        </div>
                        <p className="text-[11px] text-teal-200/80 mt-1">
                          {financialStats.installmentPayingCount} cicil berjalan · {financialStats.zeroPaidCount} belum bayar
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section Alokasi Pengeluaran & Kas Lembaga (Google Plus 175k/bln & Kas Lembaga 20%) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-emerald-50 text-emerald-800 rounded-lg">
                            <PieChart className="w-5 h-5" />
                          </span>
                          <h3 className="text-base font-bold text-slate-900">
                            Alokasi Kas & Perhitungan Beban Operasional Lembaga
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Formula: <span className="font-semibold text-slate-700">[Kas Masuk Terverifikasi]</span> dikurangi <span className="font-semibold text-rose-600">[Langganan Google Plus Rp 175.000/bln]</span>, lalu dialokasikan <span className="font-semibold text-amber-700">20% Kas Lembaga</span> dan <span className="font-semibold text-emerald-700">80% Kas Operasional & Asatidz</span>.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700">
                        <span className="font-semibold text-slate-600">Durasi Google Plus:</span>
                        <select
                          value={googleMonthsCount}
                          onChange={(e) => setGoogleMonthsCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value={1}>1 Bulan (Rp 175.000)</option>
                          <option value={2}>2 Bulan (Rp 350.000)</option>
                          <option value={3}>3 Bulan / 1 Triwulan (Rp 525.000)</option>
                          <option value={4}>4 Bulan (Rp 700.000)</option>
                          <option value={5}>5 Bulan (Rp 875.000)</option>
                          <option value={6}>6 Bulan / 1 Semester (Rp 1.050.000)</option>
                          <option value={12}>12 Bulan / 1 Tahun (Rp 2.100.000)</option>
                        </select>
                      </div>
                    </div>

                    {/* 4 Waterfall Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Step 1: Gross Cash */}
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 relative">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
                          <span>1. Total Kas Masuk</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-semibold">Bruto</span>
                        </div>
                        <div className="text-xl font-black font-mono text-slate-900">
                          {formatIDR(financialStats.totalCashCollected)}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1.5">
                          Dari penerimaan SPP santri yang telah terverifikasi
                        </div>
                      </div>

                      {/* Step 2: Google Plus Deduction */}
                      <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 relative">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 mb-1 flex items-center justify-between">
                          <span>2. Langganan Google Plus</span>
                          <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded font-mono font-semibold">Beban Bulanan</span>
                        </div>
                        <div className="text-xl font-black font-mono text-rose-700">
                          - {formatIDR(financialStats.totalGoogleExpense)}
                        </div>
                        <div className="text-[11px] text-rose-700/80 mt-1.5 flex items-center justify-between">
                          <span>Rp 175.000 × {googleMonthsCount} bulan</span>
                          <span className="font-mono text-[10px] font-semibold text-rose-800">Tiap Bulan</span>
                        </div>
                      </div>

                      {/* Step 3: Kas Lembaga 20% */}
                      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 relative">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 mb-1 flex items-center justify-between">
                          <span>3. Kas Lembaga (20%)</span>
                          <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono font-semibold">Alokasi 20%</span>
                        </div>
                        <div className="text-xl font-black font-mono text-amber-900">
                          {formatIDR(financialStats.kasLembaga20Percent)}
                        </div>
                        <div className="text-[11px] text-amber-800/80 mt-1.5">
                          20% dari saldo bersih setelah Google ({formatIDR(financialStats.netAfterGoogle)})
                        </div>
                      </div>

                      {/* Step 4: Sisa Kas Operasional & Guru 80% */}
                      <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/70 relative">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center justify-between">
                          <span>4. Kas Operasional (80%)</span>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-semibold">Alokasi 80%</span>
                        </div>
                        <div className="text-xl font-black font-mono text-emerald-900">
                          {formatIDR(financialStats.sisaKasOperasional80Percent)}
                        </div>
                        <div className="text-[11px] text-emerald-800/80 mt-1.5">
                          Sisa untuk operasional kelas & honor asatidz
                        </div>
                      </div>
                    </div>

                    {/* Rincian Transparansi Waterfall Bar */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></div>
                        <span className="font-semibold text-slate-800">Transparansi Finansial:</span>
                        <span className="text-slate-600">
                          {formatIDR(financialStats.totalCashCollected)} (Kas Masuk) - {formatIDR(financialStats.totalGoogleExpense)} (Google Plus) = <strong className="text-slate-900">{formatIDR(financialStats.netAfterGoogle)}</strong>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="text-amber-900 font-bold bg-amber-100 px-2.5 py-1 rounded border border-amber-200">
                          🏛️ Kas Lembaga: {formatIDR(financialStats.kasLembaga20Percent)} (20%)
                        </span>
                        <span className="text-emerald-950 font-bold bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200">
                          👥 Operasional & Asatidz: {formatIDR(financialStats.sisaKasOperasional80Percent)} (80%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Breakdown Per Level & Distribusi Rekening */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Kolom Kiri: Breakdown Per Program Level */}
                    <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-emerald-800" />
                            <span>Rekapitulasi Penerimaan per Tingkatan Level</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Pencapaian kas masuk dan piutang berjalan pada masing-masing program kelas
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          {programs.length} Level Aktif
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 font-mono text-[11px] uppercase border-b border-slate-200">
                              <th className="py-2.5 px-3 font-semibold">Tingkatan Level</th>
                              <th className="py-2.5 px-3 font-semibold text-center">Santri</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Potensi Kas</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Kas Terkumpul</th>
                              <th className="py-2.5 px-3 font-semibold text-right">Sisa Piutang</th>
                              <th className="py-2.5 px-3 font-semibold text-center w-28">Progress</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {financialStats.perProgramList.map((prog) => {
                              const percent = prog.potential > 0
                                ? Math.min(100, Math.round((prog.collected / prog.potential) * 100))
                                : 0;
                              return (
                                <tr key={prog.programId} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="py-3 px-3">
                                    <span className="font-bold text-slate-900 block">
                                      Level {prog.levelNumber}
                                    </span>
                                    <span className="text-[11px] text-slate-500 line-clamp-1">
                                      {prog.title}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                                    {prog.studentsCount} orang
                                  </td>
                                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                                    {formatIDR(prog.potential)}
                                  </td>
                                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                                    {formatIDR(prog.collected)}
                                  </td>
                                  <td className="py-3 px-3 text-right font-mono text-amber-800 font-medium">
                                    {formatIDR(prog.receivables)}
                                  </td>
                                  <td className="py-3 px-3 text-center">
                                    <div className="flex items-center gap-1.5 justify-center">
                                      <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                                        <div
                                          className="bg-emerald-600 h-full rounded-full"
                                          style={{ width: `${percent}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-mono font-bold text-slate-700">
                                        {percent}%
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Kolom Kanan: Rekap Distribusi Rekening Bank */}
                    <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-2xs">
                      <div className="pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-emerald-800" />
                          <span>Distribusi Kas Rekening</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Estimasi penerimaan dana per rekening lembaga
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* BSI */}
                        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-emerald-950">
                              BSI (Bank Syariah Indonesia)
                            </span>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                              Utama
                            </span>
                          </div>
                          <div className="text-base font-bold font-mono text-emerald-900">
                            {formatIDR(financialStats.bankDistribution.bsiTotal)}
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Rek: <strong className="font-mono">7198234551</strong> a.n. Ma'had Tadribul Lughah
                          </p>
                        </div>

                        {/* BCA */}
                        <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-blue-950">
                              BCA (Bank Central Asia)
                            </span>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-200 text-blue-900">
                              Opsional
                            </span>
                          </div>
                          <div className="text-base font-bold font-mono text-blue-900">
                            {formatIDR(financialStats.bankDistribution.bcaTotal)}
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Rek: <strong className="font-mono">8410294821</strong> a.n. Tadribul Lughah
                          </p>
                        </div>

                        {/* Kas Tunai */}
                        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-800">
                              Kas Tunai Ma'had (Cash)
                            </span>
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                              Kantor
                            </span>
                          </div>
                          <div className="text-base font-bold font-mono text-slate-900">
                            {formatIDR(financialStats.bankDistribution.cashTotal)}
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Penerimaan langsung di sekretariat ma'had
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-950 text-white rounded-lg flex items-center justify-between text-xs">
                        <span>Total Akumulasi Kas:</span>
                        <strong className="font-mono text-emerald-300 text-sm">
                          {formatIDR(financialStats.totalCashCollected)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Buku Kas / Tabel Rincian Keuangan Santri */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-2xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-emerald-800" />
                          <span>Buku Kas & Riwayat Keuangan Santri</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Menampilkan data keuangan santri secara individual beserta status cicilan dan catatan verifikasi
                        </p>
                      </div>

                      <span className="px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
                        Menampilkan {filteredFinanceRegistrations.length} dari {registrations.length} Santri
                      </span>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={financeSearch}
                          onChange={(e) => setFinanceSearch(e.target.value)}
                          placeholder="Cari santri berdasarkan nama, nomor registrasi, WA..."
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-800 focus:bg-white transition-colors"
                        />
                      </div>

                      {/* Filter Status Pembayaran */}
                      <div className="flex items-center gap-2">
                        <select
                          value={financeStatusFilter}
                          onChange={(e) => setFinanceStatusFilter(e.target.value as any)}
                          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-800 font-medium"
                        >
                          <option value="all">Semua Status Bayar</option>
                          <option value="lunas">✓ Hanya yang Lunas (6/6)</option>
                          <option value="cicilan">⏳ Sedang Mencicil (1-5)</option>
                          <option value="unpaid">✕ Belum Bayar (0)</option>
                        </select>

                        {/* Filter Level */}
                        <select
                          value={financeLevelFilter}
                          onChange={(e) => setFinanceLevelFilter(e.target.value)}
                          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-800 font-medium"
                        >
                          <option value="all">Semua Level</option>
                          <option value="1">Level 1</option>
                          <option value="2">Level 2</option>
                          <option value="3">Level 3</option>
                          <option value="4">Level 4</option>
                        </select>
                      </div>
                    </div>

                    {/* Financial Ledger Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-white font-mono text-[11px] uppercase tracking-wider">
                              <th className="py-3 px-3.5 font-semibold text-center w-12">No</th>
                              <th className="py-3 px-3.5 font-semibold">No. Registrasi</th>
                              <th className="py-3 px-3.5 font-semibold">Nama Santri</th>
                              <th className="py-3 px-3.5 font-semibold">Program Level</th>
                              <th className="py-3 px-3.5 font-semibold text-right">Total Biaya</th>
                              <th className="py-3 px-3.5 font-semibold text-right">Sudah Dibayar</th>
                              <th className="py-3 px-3.5 font-semibold text-right">Sisa Piutang</th>
                              <th className="py-3 px-3.5 font-semibold text-center">Status Cicilan</th>
                              <th className="py-3 px-3.5 font-semibold">Catatan / Verifikasi</th>
                              <th className="py-3 px-3.5 font-semibold text-center w-28">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {filteredFinanceRegistrations.length > 0 ? (
                              filteredFinanceRegistrations.map((r, idx) => {
                                const tuition = r.totalTuitionIDR || 510000;
                                const paid = typeof r.paidTuitionIDR === 'number'
                                  ? r.paidTuitionIDR
                                  : 0;
                                const count = typeof r.installmentPaidCount === 'number'
                                  ? r.installmentPaidCount
                                  : Math.min(6, Math.floor(paid / (Math.round(tuition / 6) || 85000)));
                                const remaining = Math.max(0, tuition - paid);
                                const isLunas = count >= 6 || remaining === 0;

                                return (
                                  <tr key={r.registrationNumber} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-3 px-3.5 text-center font-mono text-slate-500 font-medium">
                                      {idx + 1}
                                    </td>
                                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                        {r.registrationNumber}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3.5">
                                      <span className="font-semibold text-slate-900 block">
                                        {r.fullName}
                                      </span>
                                      <span className="text-[10px] font-mono text-emerald-800">
                                        {formatWhatsAppNumber(r.whatsapp) || r.whatsapp}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3.5 font-medium text-slate-800">
                                      <span className="font-semibold text-slate-900 block">
                                        {r.selectedProgramName.includes('Angkatan') ? r.selectedProgramName : `${r.selectedProgramName} (${getRegistrationAngkatan(r)})`}
                                      </span>
                                      <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                                        <GraduationCap className="w-3 h-3 text-emerald-800" />
                                        {getRegistrationAngkatan(r)}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-900">
                                      {formatIDR(tuition)}
                                    </td>
                                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-800">
                                      {formatIDR(paid)}
                                    </td>
                                    <td className="py-3 px-3.5 text-right font-mono text-amber-800 font-semibold">
                                      {isLunas ? 'Rp 0' : formatIDR(remaining)}
                                    </td>
                                    <td className="py-3 px-3.5 text-center">
                                      {isLunas ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                          <Check className="w-3 h-3 text-emerald-700" />
                                          Lunas (6/6)
                                        </span>
                                      ) : count > 0 ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                          <CreditCard className="w-3 h-3 text-amber-700" />
                                          Cicilan {count}/6
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-950 border border-rose-300">
                                          <AlertCircle className="w-3 h-3 text-rose-700 shrink-0" />
                                          <span>Belum Lunas (Bulan 1)</span>
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-3 px-3.5 text-[11px] text-slate-600 max-w-xs">
                                      <span className="line-clamp-1">
                                        {r.lastPaymentDate || 'Terdaftar'}
                                      </span>
                                    </td>
                                    <td className="py-3 px-3.5 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenPaymentModal(r)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded shadow-xs transition-colors"
                                      >
                                        <CreditCard className="w-3 h-3" />
                                        <span>Verifikasi</span>
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={10} className="py-8 text-center text-slate-500">
                                  <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                  <p className="font-semibold text-slate-700">Tidak ada data keuangan yang cocok</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">Silakan reset kata kunci pencarian atau filter.</p>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'materi' && isSuperAdmin && (
                <div className="space-y-6">
                  {/* Header Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase flex items-center gap-1">
                          <Video className="w-3.5 h-3.5 text-emerald-700" />
                          EDITOR VIDEO YOUTUBE, MATERI & LATIHAN PEKAN
                        </span>
                        <span className="text-xs font-mono text-slate-400">· Halaman materi.html</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">
                        Kelola Video YouTube, Silabus & Latihan Mandiri Pekanan
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
                        Superadmin dapat menautkan video pembelajaran YouTube untuk setiap pekan, mengatur audio mendengar, mengedit silabus, serta <strong className="text-emerald-950 font-bold">membuat dan mengelola latihan soal mandiri</strong>. Perubahan langsung tersimpan dan tampil di <strong className="text-slate-900">materi.html</strong>.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <a
                        href={`./materi.html?program=${encodeURIComponent(selectedMateriProgramId)}&pekan=${selectedMateriPekan}${selectedMateriScheduleId ? `&schedule=${encodeURIComponent(selectedMateriScheduleId)}` : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                        title="Buka halaman materi.html untuk pekan & jadwal kelas ini di tab baru"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Pratinjau di materi.html ↗</span>
                      </a>
                    </div>
                  </div>

                  {/* Level Switcher & Pekan Selector */}
                  {(() => {
                    const totalMateriPekans = getProgramTotalPekan(selectedMateriProgramId);
                    const materiPekanNumbers = Array.from({ length: totalMateriPekans }, (_, i) => i + 1);
                    const schedulesForLevel = schedules.filter(
                      (s) => s.programId === selectedMateriProgramId
                    );
                    const activeMateriSchedule =
                      schedulesForLevel.find((s) => s.id === selectedMateriScheduleId) ||
                      schedulesForLevel[0];
                    const activeSchId = activeMateriSchedule?.id;
                    return (
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
                              onClick={() => {
                                setSelectedMateriProgramId(prog.id);
                                const nextMaxPekan = getProgramTotalPekan(prog.id);
                                setSelectedMateriPekan((prev) => Math.min(prev, nextMaxPekan));
                                const firstSch = schedules.find((s) => s.programId === prog.id);
                                if (firstSch) setSelectedMateriScheduleId(firstSch.id);
                              }}
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

                    {/* Quick Pekan Lock / Unlock Control Matrix (Terkait Jadwal Kelas Zoom) */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-emerald-900" />
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                              Kontrol ON/OFF Materi per Pekan ({programs.find(p => p.id === selectedMateriProgramId)?.code || 'Level'}):
                            </h4>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            Setiap kelas Zoom punya progres ON/OFF materi masing-masing. Anda juga bisa mengaturnya langsung dari tab <strong className="text-emerald-900">2. Edit Jadwal Kelas</strong>.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setActiveTab('schedules')}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded font-bold text-[11px] cursor-pointer flex items-center gap-1"
                          >
                            <Calendar className="w-3 h-3" />
                            <span>Atur di Jadwal Kelas Zoom →</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBatchUnlockUpTo(selectedMateriProgramId, selectedMateriPekan, activeSchId)}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 rounded font-semibold text-[11px] cursor-pointer"
                            title={`Buka Pekan 1 sampai Pekan ${selectedMateriPekan}, matikan sisanya untuk kelas ini`}
                          >
                            🔓 ON s/d Pekan {selectedMateriPekan}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnlockAllPekans(selectedMateriProgramId, activeSchId)}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-900 border border-slate-300 rounded font-semibold text-[11px] cursor-pointer"
                          >
                            ON Semua (1–{totalMateriPekans})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLockAllExceptFirst(selectedMateriProgramId, activeSchId)}
                            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 rounded font-semibold text-[11px] cursor-pointer"
                          >
                            OFF Kecuali Pekan 1
                          </button>
                        </div>
                      </div>

                      {/* Jadwal Kelas Zoom Selector for Level */}
                      {schedulesForLevel.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-white border border-indigo-200 rounded-lg p-2.5 text-xs">
                          <span className="font-bold text-indigo-950 shrink-0 flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-indigo-700" />
                            <span>Jadwal Kelas Zoom Aktif:</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5 flex-1">
                            {schedulesForLevel.map((sch) => {
                              const isChosen = sch.id === activeSchId;
                              const prog = getScheduleMateriProgress(selectedMateriProgramId, sch.id);
                              return (
                                <button
                                  key={`materi-sch-pill-${sch.id}`}
                                  type="button"
                                  onClick={() => setSelectedMateriScheduleId(sch.id)}
                                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    isChosen
                                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-2xs'
                                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-indigo-50'
                                  }`}
                                >
                                  <span className="font-mono">{sch.batchCode}</span>
                                  <span>· {sch.angkatan?.trim() || 'Angkatan 1'}</span>
                                  <span className={`text-[10px] font-mono px-1.5 rounded ${
                                    isChosen ? 'bg-indigo-800 text-indigo-100' : 'bg-white text-indigo-800 border border-indigo-200'
                                  }`}>
                                    s/d P{prog.highestPekan?.pekanNumber || 0}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {materiPekanNumbers.map((num) => {
                          const unlocked = isPekanUnlocked(selectedMateriProgramId, num, activeSchId);
                          return (
                            <div
                              key={`pekan-unlock-card-${num}`}
                              className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between gap-2 transition-all ${
                                unlocked
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold font-mono">Pekan {num}</span>
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                                  unlocked ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {unlocked ? 'ON' : 'OFF'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleTogglePekanUnlock(selectedMateriProgramId, num, activeSchId)}
                                className={`w-full py-1 px-1.5 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                                  unlocked
                                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300'
                                    : 'bg-emerald-800 hover:bg-emerald-700 text-white shadow-2xs'
                                }`}
                              >
                                {unlocked ? (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    <span>Matikan (OFF)</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3 h-3" />
                                    <span>Aktifkan (ON)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Choose Pekan */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-semibold text-slate-500 uppercase">
                          2. Pilih Pekan Materi (1 s/d {totalMateriPekans}):
                        </span>
                        <span className="text-xs font-mono text-emerald-900 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Sedang Mengedit: Pekan ke-{selectedMateriPekan} ({isPekanUnlocked(selectedMateriProgramId, selectedMateriPekan, activeSchId) ? '🔓 ON' : '🔒 OFF'} di {activeMateriSchedule?.batchCode || selectedMateriProgramId})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs">
                        {materiPekanNumbers.map((num) => {
                          const isCurrent = num === selectedMateriPekan;
                          const isUnlocked = isPekanUnlocked(selectedMateriProgramId, num, activeSchId);
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setSelectedMateriPekan(num)}
                              className={`shrink-0 px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                isCurrent
                                  ? 'bg-rose-700 text-white border-rose-700 shadow-xs ring-2 ring-rose-200'
                                  : isUnlocked
                                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 opacity-80'
                              }`}
                            >
                              <span>{isUnlocked ? '🔓' : '🔒'}</span>
                              <span>Pekan {num}</span>
                              <span className={`text-[10px] font-mono px-1 rounded ${
                                isCurrent
                                  ? 'bg-rose-800 text-white'
                                  : isUnlocked
                                    ? 'bg-emerald-200 text-emerald-950'
                                    : 'bg-slate-100 text-slate-500'
                              }`}>
                                {isUnlocked ? 'ON' : 'OFF'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                    );
                  })()}

                  {/* Status Buka/Kunci Akses Pekan Terpilih Banner */}
                  {(() => {
                    const schedulesForLevelBanner = schedules.filter(
                      (s) => s.programId === selectedMateriProgramId
                    );
                    const activeSchBanner =
                      schedulesForLevelBanner.find((s) => s.id === selectedMateriScheduleId) ||
                      schedulesForLevelBanner[0];
                    const activeSchIdBanner = activeSchBanner?.id;
                    const isCurrentlyUnlocked = isPekanUnlocked(selectedMateriProgramId, selectedMateriPekan, activeSchIdBanner);
                    return (
                      <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                        isCurrentlyUnlocked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-rose-50 border-rose-300 text-rose-950'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isCurrentlyUnlocked ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                          }`}>
                            {isCurrentlyUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider">
                                Status Pekan ke-{selectedMateriPekan} ({activeSchBanner?.batchCode || selectedMateriProgramId}):
                              </span>
                              <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded ${
                                isCurrentlyUnlocked ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                              }`}>
                                {isCurrentlyUnlocked ? '🔓 ON (SANTRI DAPAT BELAJAR)' : '🔒 OFF (TERKUNCI UNTUK KELAS INI)'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {isCurrentlyUnlocked
                                ? 'Santri pada jadwal kelas Zoom ini dapat memutar video, membaca kaidah, dan mengikuti latihan pekan ini.'
                                : 'Materi pekan ini berstatus OFF untuk jadwal kelas Zoom terpilih. Ubah status ON/OFF di sini atau dari Tab Jadwal Kelas Zoom.'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTogglePekanUnlock(selectedMateriProgramId, selectedMateriPekan, activeSchIdBanner)}
                          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto ${
                            isCurrentlyUnlocked
                              ? 'bg-rose-700 hover:bg-rose-800 text-white'
                              : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                          }`}
                        >
                          {isCurrentlyUnlocked ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Matikan (OFF) Pekan Ini</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Aktifkan (ON) Pekan Ini</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })()}

                  {/* Sub-Tab Selector: Muncul Satu per Satu setelah Diklik */}
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-wrap gap-2 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setMateriSubTab('video')}
                      className={`flex-1 min-w-[180px] py-3 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        materiSubTab === 'video'
                          ? 'bg-emerald-800 text-white shadow-xs ring-2 ring-emerald-300'
                          : 'bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      <Video className="w-4 h-4 text-emerald-600" />
                      <span>1. Edit Video YouTube</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        materiSubTab === 'video' ? 'bg-emerald-900 text-white' : 'bg-emerald-200/70 text-emerald-950'
                      }`}>
                        {isValidYouTubeVideoInput(editingMateri.youtubeVideoId) ? 'Terhubung' : 'Belum Diatur'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMateriSubTab('audio')}
                      className={`flex-1 min-w-[200px] py-3 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        materiSubTab === 'audio'
                          ? 'bg-teal-800 text-white shadow-xs ring-2 ring-teal-300'
                          : 'bg-teal-50/80 text-teal-900 hover:bg-teal-100 border border-teal-200'
                      }`}
                    >
                      <Headphones className="w-4 h-4 text-teal-600" />
                      <span>2. Audio Mendengar (Drive)</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        materiSubTab === 'audio' ? 'bg-teal-900 text-white' : 'bg-teal-200/80 text-teal-950'
                      }`}>
                        {getNormalizedPekanAudioItems(editingMateri).length} Audio
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMateriSubTab('silabus')}
                      className={`flex-1 min-w-[180px] py-3 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        materiSubTab === 'silabus'
                          ? 'bg-emerald-900 text-white shadow-xs ring-2 ring-emerald-300'
                          : 'bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-emerald-600" />
                      <span>3. Edit Materi & Silabus</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        materiSubTab === 'silabus' ? 'bg-emerald-800 text-white' : 'bg-emerald-200/70 text-emerald-950'
                      }`}>
                        {(editingMateri.points || []).length} Poin · {(editingMateri.rules || []).length} Kaidah
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMateriSubTab('latihan')}
                      className={`flex-1 min-w-[180px] py-3 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        materiSubTab === 'latihan'
                          ? 'bg-indigo-900 text-white shadow-xs ring-2 ring-indigo-300'
                          : 'bg-indigo-50/70 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      <span>4. Buat & Edit Latihan Soal</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        materiSubTab === 'latihan' ? 'bg-indigo-800 text-white' : 'bg-indigo-200/70 text-indigo-950'
                      }`}>
                        {(editingMateri.quizzes || []).length} Soal
                      </span>
                    </button>
                  </div>

                  {/* Main Form Editor */}
                  <form onSubmit={handleSaveMateri} noValidate className="space-y-6">
                    {/* BAGIAN 1: HANYA TAMPIL JIKA SUB-TAB 'video' AKTIF */}
                    {materiSubTab === 'video' && (() => {
                      const youtubeId = extractOptionalYouTubeId(editingMateri.youtubeVideoId);
                      const hasValidYouTube = isValidYouTubeVideoInput(editingMateri.youtubeVideoId);
                      const watchUrl = youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : '';
                      return (
                      <div className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs animate-in fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                              <Video className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900">
                                  Pengaturan Video Materi YouTube
                                </h3>
                                <span className="text-[11px] font-mono text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Pekan {selectedMateriPekan}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Masukkan tautan atau Video ID YouTube untuk video pembelajaran pekan ini. Santri menontonnya langsung di <strong>materi.html</strong>.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {hasValidYouTube && (
                              <a
                                href={watchUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Buka di YouTube ↗</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          <div className="lg:col-span-6 space-y-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-800 mb-1">
                                Tautan Video YouTube atau Video ID (11 karakter) <span className="text-rose-600">*</span>
                              </label>
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editingMateri.youtubeVideoId || ''}
                                  onChange={(e) => handleYouTubeInputChangeWithAutoFill(e.target.value)}
                                  placeholder="Contoh: https://www.youtube.com/watch?v=qnQO687f-cY atau qnQO687f-cY"
                                  className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-600"
                                />
                                <p className="text-[11px] text-slate-500">
                                  Mendukung link <code className="font-mono">youtube.com/watch?v=...</code>, <code className="font-mono">youtu.be/...</code>, atau <code className="font-mono">shorts/...</code>. Judul &amp; nama channel otomatis terisi.
                                </p>
                                {youtubeMetaStatus && (
                                  <p className="text-[11px] font-medium text-emerald-800 flex items-center gap-1.5 pt-0.5">
                                    {isFetchingYouTubeMeta && <Loader2 className="w-3 h-3 animate-spin" />}
                                    <span>{youtubeMetaStatus}</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="block text-xs font-semibold text-slate-800">
                                  Judul Video YouTube
                                </label>
                                <button
                                  type="button"
                                  disabled={isFetchingYouTubeMeta || !hasValidYouTube}
                                  onClick={() => handleFetchYouTubeVideoMeta()}
                                  className="text-[11px] font-semibold text-emerald-800 hover:underline disabled:opacity-40 cursor-pointer"
                                >
                                  Ambil Judul &amp; Channel YouTube
                                </button>
                              </div>
                              <input
                                type="text"
                                value={editingMateri.youtubeTitle || editingMateri.videoTitle || ''}
                                onChange={(e) =>
                                  setEditingMateri({
                                    ...editingMateri,
                                    youtubeTitle: e.target.value
                                  })
                                }
                                placeholder="Contoh: Nahwu Dasar Pelajaran ke-1 — Pekan 1"
                                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-800 mb-1">
                                Nama Channel / Pemateri Video
                              </label>
                              <input
                                type="text"
                                value={editingMateri.youtubeChannel || editingMateri.videoInstructor || ''}
                                onChange={(e) =>
                                  setEditingMateri({
                                    ...editingMateri,
                                    youtubeChannel: e.target.value
                                  })
                                }
                                placeholder="Contoh: MAQI MEDIA CHANNEL / Tadribul Lughah Official"
                                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                              />
                            </div>

                            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                              <span className="text-slate-500 font-mono text-[11px]">
                                YouTube ID:{' '}
                                <strong className="text-emerald-800 font-bold">
                                  {youtubeId || 'Belum ada ID YouTube'}
                                </strong>
                              </span>
                              {hasValidYouTube && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(watchUrl);
                                    showToast('success', 'Tautan video YouTube berhasil disalin!');
                                  }}
                                  className="text-slate-600 hover:text-slate-900 font-mono text-[11px] cursor-pointer"
                                >
                                  Salin Link YouTube
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="lg:col-span-6 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-700">Pratinjau Video YouTube:</span>
                              <span className="text-emerald-700 font-mono text-[11px]">YouTube Embed Preview</span>
                            </div>
                            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-md flex items-center justify-center">
                              {youtubeId ? (
                                <iframe
                                  key={youtubeId}
                                  className="w-full h-full border-0"
                                  src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
                                  title="Pratinjau Video YouTube"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              ) : (
                                <div className="text-center p-6 text-slate-400 text-xs">
                                  <Video className="w-10 h-10 mx-auto mb-2 text-emerald-400 opacity-60" />
                                  <p>Tempelkan link atau Video ID YouTube di sebelah kiri untuk melihat pratinjau langsung.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })()}

                    {/* BAGIAN 2: AUDIO MENDENGAR (ISTIMA' - GOOGLE DRIVE) */}
                    {materiSubTab === 'audio' && (() => {
                      const currentAudioItems: WeeklyAudioItem[] =
                        editingMateri.audioItems && editingMateri.audioItems.length > 0
                          ? editingMateri.audioItems
                          : getNormalizedPekanAudioItems(editingMateri);

                      const updateAudioList = (nextItems: WeeklyAudioItem[]) => {
                        setEditingMateri({
                          ...editingMateri,
                          audioItems: nextItems
                        });
                      };

                      const handleAddAudioItem = () => {
                        const nextNumber = currentAudioItems.length + 1;
                        updateAudioList([
                          ...currentAudioItems,
                          {
                            id: `audio-${selectedMateriPekan}-${Date.now()}`,
                            title: `Pelajaran Mendengar ${nextNumber} — Pekan ${selectedMateriPekan}`,
                            arabicTitle: 'دَرْسُ الاسْتِمَاعِ',
                            driveUrl: '',
                            duration: '',
                            notes: ''
                          }
                        ]);
                      };

                      const handleUpdateAudioField = (
                        index: number,
                        field: keyof WeeklyAudioItem,
                        value: string
                      ) => {
                        const updated = currentAudioItems.map((item, idx) =>
                          idx === index ? { ...item, [field]: value } : item
                        );
                        updateAudioList(updated);
                      };

                      const handleRemoveAudioItem = (index: number) => {
                        updateAudioList(currentAudioItems.filter((_, idx) => idx !== index));
                      };

                      return (
                        <div className="bg-white border border-teal-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs animate-in fade-in">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-100 pb-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
                                <Headphones className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-slate-900">
                                  Pengaturan Audio Mendengar (Istima&apos;) — Google Drive
                                </h3>
                                <p className="text-xs text-slate-500">
                                  Tempel tautan file audio dari Google Drive agar santri dapat mendengarkannya langsung di bagian Materi pada <code className="font-mono">pelajar.html</code> &amp; <code className="font-mono">materi.html</code>.
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddAudioItem}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-xs cursor-pointer transition-colors shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Tambah Audio Google Drive</span>
                            </button>
                          </div>

                          <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 space-y-1">
                            <p className="font-bold">Panduan Link Audio Google Drive:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-teal-900">
                              <li>Pastikan akses berbagi file audio di Google Drive disetel ke <strong>&quot;Siapa saja yang memiliki link / Anyone with the link (Viewer)&quot;</strong>.</li>
                              <li>Salin link bagikan seperti <code className="font-mono bg-white px-1 rounded">https://drive.google.com/file/d/FILE_ID/view?usp=sharing</code> lalu tempel di kolom Tautan Google Drive di bawah.</li>
                            </ul>
                          </div>

                          {currentAudioItems.length === 0 ? (
                            <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-3">
                              <Headphones className="w-8 h-8 text-slate-400 mx-auto" />
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-700">
                                  Belum ada audio mendengar untuk Pekan {selectedMateriPekan} ({selectedMateriProgramId})
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Klik tombol <strong>+ Tambah Audio Google Drive</strong> untuk menambahkan rekaman audio (MP3/M4A/WAV) dari Google Drive.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={handleAddAudioItem}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Audio Pertama</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {currentAudioItems.map((item, idx) => (
                                <div
                                  key={item.id || idx}
                                  className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-mono font-bold text-teal-900 bg-teal-100 px-2.5 py-1 rounded">
                                      TRACK AUDIO #{idx + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveAudioItem(idx)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Hapus</span>
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-bold text-slate-700">
                                        Judul Audio Mendengar *
                                      </label>
                                      <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => handleUpdateAudioField(idx, 'title', e.target.value)}
                                        placeholder="Contoh: Istima' Pekan 1 — Pengenalan Isim & Fi'il"
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-bold text-slate-700">
                                        Judul Arab (Opsional)
                                      </label>
                                      <input
                                        type="text"
                                        dir="rtl"
                                        value={item.arabicTitle || ''}
                                        onChange={(e) => handleUpdateAudioField(idx, 'arabicTitle', e.target.value)}
                                        placeholder="دَرْسُ الاسْتِمَاعِ"
                                        className="w-full px-3 py-2 text-sm font-arabic bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="md:col-span-2 space-y-1">
                                      <label className="text-[11px] font-bold text-slate-700">
                                        Link Audio Google Drive (Share URL / File ID) *
                                      </label>
                                      <input
                                        type="text"
                                        value={item.driveUrl}
                                        onChange={(e) => handleUpdateAudioField(idx, 'driveUrl', e.target.value)}
                                        placeholder="https://drive.google.com/file/d/1AbCDefGhIJkLmNoPQrStUvWxYz/view?usp=sharing"
                                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-bold text-slate-700">
                                        Durasi (Opsional)
                                      </label>
                                      <input
                                        type="text"
                                        value={item.duration || ''}
                                        onChange={(e) => handleUpdateAudioField(idx, 'duration', e.target.value)}
                                        placeholder="Contoh: 05:20"
                                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-700">
                                      Catatan / Instruksi Mendengar untuk Peserta (Opsional)
                                    </label>
                                    <input
                                      type="text"
                                      value={item.notes || ''}
                                      onChange={(e) => handleUpdateAudioField(idx, 'notes', e.target.value)}
                                      placeholder="Contoh: Dengarkan 3 kali lalu catat mufrodat baru yang terdengar."
                                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {getNormalizedPekanAudioItems(editingMateri).length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-teal-100">
                              <p className="text-xs font-bold text-slate-700 uppercase font-mono">
                                Pratinjau Pemutar Audio Google Drive:
                              </p>
                              <GoogleDriveAudioPlayer
                                items={getNormalizedPekanAudioItems(editingMateri)}
                                pekanNumber={selectedMateriPekan}
                                compact
                              />
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* BAGIAN 3: HANYA TAMPIL JIKA SUB-TAB 'silabus' AKTIF */}
                    {materiSubTab === 'silabus' && (
                      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold shrink-0">
                              <BookOpen className="w-5 h-5 text-emerald-900" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900">
                                  Uraian Silabus & Kaidah Pekan {selectedMateriPekan}
                                </h3>
                                <span className="text-xs font-mono text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  {selectedMateriProgramId}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Atur judul kurikulum modul, kitab rujukan, rangkuman, poin pembahasan, dan kaidah pokok untuk Pekan ke-{selectedMateriPekan}.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
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
                                className="w-full px-3.5 py-2 text-xs font-arabic bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
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
                                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
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
                              className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 leading-relaxed"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                rows={5}
                                value={(editingMateri.points || []).join('\n')}
                                onChange={(e) =>
                                  setEditingMateri({
                                    ...editingMateri,
                                    points: e.target.value.split('\n').filter((l) => l.trim().length > 0)
                                  })
                                }
                                placeholder="Tulis setiap poin pembahasan pada baris baru..."
                                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 leading-relaxed"
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
                                rows={5}
                                value={(editingMateri.rules || []).join('\n')}
                                onChange={(e) =>
                                  setEditingMateri({
                                    ...editingMateri,
                                    rules: e.target.value.split('\n').filter((l) => l.trim().length > 0)
                                  })
                                }
                                placeholder="Tulis setiap kaidah nahwu/shorof pada baris baru..."
                                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 leading-relaxed"
                              />
                            </div>
                          </div>

                          {/* Contoh & Amtsilah Editor */}
                          <div className="pt-4 border-t border-slate-200 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">
                                  Contoh &amp; Amtsilah Pekan {selectedMateriPekan} ({(editingMateri.examples || []).length} contoh)
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  Daftar contoh kalimat & i'rab untuk pekan ini (tambah atau ubah secara manual).
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingMateri({
                                    ...editingMateri,
                                    examples: [
                                      ...(editingMateri.examples || []),
                                      { ar: '', tr: '', breakdown: '' }
                                    ]
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer self-start"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Contoh &amp; Amtsilah</span>
                              </button>
                            </div>

                            <div className="space-y-3">
                              {(editingMateri.examples || []).map((ex, exIdx) => (
                                <div
                                  key={exIdx}
                                  className="p-4 rounded-xl border border-slate-200 bg-[#FBF9F5] space-y-2.5"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-mono font-bold text-emerald-900">
                                      CONTOH #{exIdx + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingMateri({
                                          ...editingMateri,
                                          examples: (editingMateri.examples || []).filter(
                                            (_, idx) => idx !== exIdx
                                          )
                                        })
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Hapus</span>
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Kalimat Arab Berharokat
                                      </label>
                                      <input
                                        type="text"
                                        dir="rtl"
                                        value={ex.ar || ''}
                                        onChange={(e) => {
                                          const updated: ExampleSentence[] = (editingMateri.examples || []).map(
                                            (item, idx) =>
                                              idx === exIdx ? { ...item, ar: e.target.value } : item
                                          );
                                          setEditingMateri({ ...editingMateri, examples: updated });
                                        }}
                                        placeholder="العِلْمُ نُورٌ"
                                        className="w-full px-3 py-2 text-sm font-arabic bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                        Terjemahan Bahasa Indonesia
                                      </label>
                                      <input
                                        type="text"
                                        value={ex.tr || ''}
                                        onChange={(e) => {
                                          const updated: ExampleSentence[] = (editingMateri.examples || []).map(
                                            (item, idx) =>
                                              idx === exIdx ? { ...item, tr: e.target.value } : item
                                          );
                                          setEditingMateri({ ...editingMateri, examples: updated });
                                        }}
                                        placeholder="Ilmu adalah cahaya"
                                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                      Analisis Kedudukan / Tarkib
                                    </label>
                                    <input
                                      type="text"
                                      value={ex.breakdown || ''}
                                      onChange={(e) => {
                                        const updated: ExampleSentence[] = (editingMateri.examples || []).map(
                                          (item, idx) =>
                                            idx === exIdx ? { ...item, breakdown: e.target.value } : item
                                        );
                                        setEditingMateri({ ...editingMateri, examples: updated });
                                      }}
                                      placeholder="Al-'Ilmu: Mubtada marfu', Nurun: Khabar marfu'..."
                                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Kosakata / Mufrodat Editor */}
                          <div className="pt-4 border-t border-slate-200 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900">
                                  Kosakata / Mufrodat Pekan {selectedMateriPekan} ({(editingMateri.vocabularies || []).length} kata)
                                </h4>
                                <p className="text-[11px] text-slate-500">
                                  Daftar kosakata (المُفْرَدَاتُ الخَاصَّةُ) untuk membantu hafalan santri pada pekan ini.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingMateri({
                                    ...editingMateri,
                                    vocabularies: [
                                      ...(editingMateri.vocabularies || []),
                                      { ar: '', id: '', type: 'Isim' }
                                    ]
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer self-start"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Tambah Kosakata</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {(editingMateri.vocabularies || []).map((voc, vIdx) => (
                                <div
                                  key={vIdx}
                                  className="p-3.5 rounded-xl border border-slate-200 bg-[#FBF9F5] space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-mono font-bold text-emerald-900">
                                      MUFRODAT #{vIdx + 1}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingMateri({
                                          ...editingMateri,
                                          vocabularies: (editingMateri.vocabularies || []).filter(
                                            (_, idx) => idx !== vIdx
                                          )
                                        })
                                      }
                                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Hapus</span>
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                        Kata Arab Berharokat
                                      </label>
                                      <input
                                        type="text"
                                        dir="rtl"
                                        value={voc.ar || ''}
                                        onChange={(e) => {
                                          const updated: VocabularyWord[] = (editingMateri.vocabularies || []).map(
                                            (item, idx) =>
                                              idx === vIdx ? { ...item, ar: e.target.value } : item
                                          );
                                          setEditingMateri({ ...editingMateri, vocabularies: updated });
                                        }}
                                        placeholder="الكَلِمَةُ"
                                        className="w-full px-2.5 py-1.5 text-sm font-arabic bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                        Jenis Kata / Kategori
                                      </label>
                                      <input
                                        type="text"
                                        value={voc.type || ''}
                                        onChange={(e) => {
                                          const updated: VocabularyWord[] = (editingMateri.vocabularies || []).map(
                                            (item, idx) =>
                                              idx === vIdx ? { ...item, type: e.target.value } : item
                                          );
                                          setEditingMateri({ ...editingMateri, vocabularies: updated });
                                        }}
                                        placeholder="Isim / Fi'il / Harf"
                                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                                      Arti Bahasa Indonesia
                                    </label>
                                    <input
                                      type="text"
                                      value={voc.id || ''}
                                      onChange={(e) => {
                                        const updated: VocabularyWord[] = (editingMateri.vocabularies || []).map(
                                          (item, idx) =>
                                            idx === vIdx ? { ...item, id: e.target.value } : item
                                        );
                                        setEditingMateri({ ...editingMateri, vocabularies: updated });
                                      }}
                                      placeholder="Kata yang tersusun bermakna"
                                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BAGIAN 3: HANYA TAMPIL JIKA SUB-TAB 'latihan' AKTIF */}
                    {materiSubTab === 'latihan' && (
                      <div id="section-latihan" className="bg-white border border-indigo-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs animate-in fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-bold shrink-0">
                              <HelpCircle className="w-5 h-5 text-indigo-900" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-slate-900">
                                  Latihan Mandiri & Kuis Pekanan (تَمْرِينَاتُ الأُسْبُوعِ)
                                </h3>
                                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-950 border border-indigo-300">
                                  {(editingMateri.quizzes || []).length} Soal
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Superadmin dapat membuat atau mengedit soal pilihan ganda mandiri untuk Pekan ke-{selectedMateriPekan}. Santri mengerjakannya pada halaman terpisah <strong className="text-slate-800 font-mono">latihan.html</strong> dengan sistem 1 kali pengerjaan.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <a
                              href={`./latihan.html?program=${encodeURIComponent(selectedMateriProgramId)}&pekan=${selectedMateriPekan}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-indigo-950 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl shadow-2xs transition-colors"
                              title="Buka dan uji halaman latihan santri di tab baru (latihan.html)"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-indigo-700" />
                              <span>Buka latihan.html ↗</span>
                            </a>

                            <button
                              type="button"
                              onClick={handleAddQuizQuestion}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-xl shadow-xs cursor-pointer transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Tambah Soal</span>
                            </button>
                          </div>
                        </div>

                        {/* Pengaturan KKM & Bobot Poin Nilai Latihan */}
                        <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/80 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-indigo-950">
                                Standar Kelulusan (KKM) & Bobot Nilai Pekan {selectedMateriPekan}:
                              </span>
                              <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-950">
                                KKM: {editingMateri.passingScore ?? 70} / 100
                              </span>
                              <span className="text-xs font-mono font-bold bg-indigo-900 text-white px-2 py-0.5 rounded">
                                Total: {(editingMateri.quizzes || []).reduce((acc, q) => acc + (q.points ?? 25), 0)} Poin
                              </span>
                            </div>
                            <p className="text-[11px] text-indigo-900/80">
                              Santri yang mengerjakan latihan akan memperoleh nilai skala 0–100, predikat bahasa Arab (Mumtaz, Jayyid, dll), dan modul otomatis tuntas jika nilai ≥ KKM.
                            </p>
                          </div>

                          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-2xs shrink-0">
                            <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">Batas KKM:</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={editingMateri.passingScore ?? 70}
                              onChange={(e) =>
                                setEditingMateri({
                                  ...editingMateri,
                                  passingScore: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 70))
                                })
                              }
                              className="w-16 px-2 py-1 text-xs font-mono font-bold text-center bg-slate-50 border border-indigo-300 rounded text-indigo-950 focus:outline-none"
                            />
                            <span className="text-xs font-mono text-slate-500">/ 100</span>
                          </div>
                        </div>

                        {/* Questions List */}
                        {(editingMateri.quizzes || []).length === 0 ? (
                          <div className="text-center py-10 px-4 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/40 space-y-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-900 flex items-center justify-center mx-auto">
                              <HelpCircle className="w-6 h-6" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-800">
                                Belum Ada Latihan Soal untuk Pekan ke-{selectedMateriPekan}
                              </p>
                              <p className="text-xs text-slate-500 max-w-md mx-auto">
                                Klik tombol di bawah untuk menambahkan soal latihan pilihan ganda baru lengkap dengan pertanyaan, kalimat Arab, opsi A/B/C/D, kunci jawaban, dan pembahasannya.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleAddQuizQuestion}
                              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-900 hover:bg-indigo-800 rounded-xl cursor-pointer transition-colors shadow-2xs"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Buat Soal Pertama Sekarang</span>
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {(editingMateri.quizzes || []).map((q, qIdx) => (
                              <div
                                key={q.id || qIdx}
                                className="p-5 rounded-2xl border border-slate-200 bg-[#FBF9F5] space-y-4 shadow-2xs"
                              >
                                {/* Header of Question Card */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-3">
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-lg bg-indigo-900 text-white text-xs font-mono font-bold flex items-center justify-center shadow-2xs">
                                      #{qIdx + 1}
                                    </span>
                                    <div>
                                      <span className="text-xs font-bold text-slate-900">
                                        Soal Latihan Pekanan #{qIdx + 1}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-400 block">
                                        Kunci Benar: Pilihan {String.fromCharCode(65 + (q.correctIndex || 0))}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2.5">
                                    {/* Input Bobot Poin Soal */}
                                    <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                      <label className="text-[11px] font-semibold text-slate-600">Bobot:</label>
                                      <input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={q.points ?? 25}
                                        onChange={(e) =>
                                          handleUpdateQuizQuestion(qIdx, {
                                            points: Math.max(1, parseInt(e.target.value, 10) || 10)
                                          })
                                        }
                                        className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold text-center bg-slate-50 border border-slate-300 rounded text-indigo-950 focus:outline-none"
                                      />
                                      <span className="text-[10px] font-mono text-slate-500">Poin</span>
                                    </div>

                                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                                      {qIdx > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => handleMoveQuizQuestion(qIdx, 'up')}
                                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                          title="Geser Soal ke Atas"
                                        >
                                          <ArrowUp className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      {qIdx < (editingMateri.quizzes || []).length - 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleMoveQuizQuestion(qIdx, 'down')}
                                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                          title="Geser Soal ke Bawah"
                                        >
                                          <ArrowDown className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteQuizQuestion(qIdx)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                                        title="Hapus Soal Ini"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Hapus Soal</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Form Fields for this Question */}
                                <div className="space-y-4">
                                  {/* Pertanyaan & Arabic Prompt */}
                                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    <div className="md:col-span-7">
                                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                                        Pertanyaan / Instruksi Soal <span className="text-rose-600">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        required
                                        value={q.question || ''}
                                        onChange={(e) => handleUpdateQuizQuestion(qIdx, { question: e.target.value })}
                                        placeholder="Contoh: Manakah yang merupakan Isim pada kalimat berikut?"
                                        className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-800"
                                      />
                                    </div>

                                    <div className="md:col-span-5">
                                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                                        Teks / Kalimat Arab yang Diuji (Opsional)
                                      </label>
                                      <input
                                        type="text"
                                        dir="rtl"
                                        value={q.arabicPrompt || ''}
                                        onChange={(e) => handleUpdateQuizQuestion(qIdx, { arabicPrompt: e.target.value })}
                                        placeholder="Contoh: كَتَبَ زَيْدٌ فِي الدَّفْتَرِ"
                                        className="w-full px-3.5 py-2 text-xs font-arabic bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-800"
                                      />
                                    </div>
                                  </div>

                                  {/* 4 Options Grid */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-xs font-semibold text-slate-800">
                                        4 Pilihan Jawaban (Klik tombol huruf untuk menandai opsi yang BENAR):
                                      </label>
                                      <span className="text-[11px] font-mono text-indigo-950 font-bold bg-indigo-100 px-2.5 py-0.5 rounded border border-indigo-300">
                                        Kunci Benar: Pilihan {String.fromCharCode(65 + (q.correctIndex || 0))}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      {(q.options && q.options.length >= 4 ? q.options : ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D']).slice(0, 4).map((opt, optIdx) => {
                                        const isCorrect = q.correctIndex === optIdx;
                                        return (
                                          <div
                                            key={optIdx}
                                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                                              isCorrect
                                                ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-300/60 shadow-2xs'
                                                : 'bg-white border-slate-300'
                                            }`}
                                          >
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateQuizQuestion(qIdx, { correctIndex: optIdx })}
                                              className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                                isCorrect
                                                  ? 'bg-emerald-900 text-white shadow-xs'
                                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                              }`}
                                              title="Klik untuk jadikan opsi ini sebagai Kunci Jawaban Benar"
                                            >
                                              {String.fromCharCode(65 + optIdx)}
                                            </button>

                                            <input
                                              type="text"
                                              required
                                              value={opt}
                                              onChange={(e) => handleUpdateQuizOption(qIdx, optIdx, e.target.value)}
                                              placeholder={`Jawaban Pilihan ${String.fromCharCode(65 + optIdx)}`}
                                              className="flex-1 text-xs bg-transparent border-0 focus:outline-none text-slate-900"
                                            />

                                            <button
                                              type="button"
                                              onClick={() => handleUpdateQuizQuestion(qIdx, { correctIndex: optIdx })}
                                              className={`text-[10px] font-mono px-2 py-1 rounded cursor-pointer shrink-0 transition-colors ${
                                                isCorrect
                                                  ? 'bg-emerald-900 text-white font-bold'
                                                  : 'bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200'
                                              }`}
                                            >
                                              {isCorrect ? '✓ Kunci Benar' : 'Pilih Kunci'}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Explanation / Pembahasan */}
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                                      Pembahasan & Alasan Kunci Jawaban (Ditampilkan kepada santri setelah menjawab):
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={q.explanation || ''}
                                      onChange={(e) => handleUpdateQuizQuestion(qIdx, { explanation: e.target.value })}
                                      placeholder="Tuliskan ulasan kaidah atau alasan mengapa jawaban ini tepat..."
                                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-800 leading-relaxed"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step Navigation Bar */}
                    {(() => {
                      const steps: Array<{ id: typeof materiSubTab; label: string; shortLabel: string }> = [
                        { id: 'video', label: 'Langkah 1: Video YouTube', shortLabel: 'Edit Video' },
                        { id: 'audio', label: 'Langkah 2: Audio Mendengar (Google Drive)', shortLabel: 'Audio Mendengar' },
                        { id: 'silabus', label: 'Langkah 3: Silabus & Kaidah', shortLabel: 'Edit Silabus' },
                        { id: 'latihan', label: 'Langkah 4: Latihan Soal & Kuis', shortLabel: 'Latihan Soal' }
                      ];
                      const currentIdx = steps.findIndex((s) => s.id === materiSubTab);
                      const prevStep = currentIdx > 0 ? steps[currentIdx - 1] : null;
                      const nextStep = currentIdx >= 0 && currentIdx < steps.length - 1 ? steps[currentIdx + 1] : null;
                      return (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100/90 border border-slate-200 rounded-xl p-3.5 text-xs">
                          <div>
                            <span className="text-slate-500">Bagian Aktif: </span>
                            <strong className="text-slate-900 font-semibold">
                              {steps[currentIdx]?.label || 'Editor Materi'}
                            </strong>
                          </div>

                          <div className="flex items-center gap-2">
                            {prevStep && (
                              <button
                                type="button"
                                onClick={() => setMateriSubTab(prevStep.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg cursor-pointer transition-colors shadow-2xs"
                              >
                                ← Kembali ({prevStep.shortLabel})
                              </button>
                            )}
                            {nextStep && (
                              <button
                                type="button"
                                onClick={() => setMateriSubTab(nextStep.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors shadow-2xs"
                              >
                                Lanjut ke {nextStep.shortLabel} →
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Bottom Action Bar */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
                      {materiSaveFeedback && (
                        <div
                          role="alert"
                          className={`w-full p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
                            materiSaveFeedback.type === 'success'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-rose-50 border-rose-300 text-rose-950'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {materiSaveFeedback.type === 'success' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
                            )}
                            <span className="leading-relaxed">{materiSaveFeedback.text}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMateriSaveFeedback(null)}
                            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer shrink-0"
                            title="Tutup pesan"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
                            type="button"
                            disabled={isSaving}
                            onClick={handleSaveMateri}
                            className={`inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 ${
                              materiSaveSuccess
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 scale-[1.02]'
                                : 'bg-emerald-900 hover:bg-emerald-800 text-white'
                            }`}
                          >
                            {materiSaveSuccess ? (
                              <>
                                <Check className="w-4 h-4 text-white stroke-[3]" />
                                <span>✓ Berhasil Disimpan!</span>
                              </>
                            ) : isSaving ? (
                              <>
                                <Save className="w-4 h-4 animate-spin" />
                                <span>Menyimpan...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                <span>Simpan Perubahan Materi, Video & Latihan</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
            </div>
          </div>

          {/* =====================================================================
              MODAL DIALOG: VERIFIKASI PEMBAYARAN CICILAN SANTRI (GLOBAL TAB 3 & 4)
             ===================================================================== */}
          {isPaymentModalOpen && verifyingRegistration && (() => {
            const totalTuition = verifyingRegistration.totalTuitionIDR || 510000;
            const monthly = Math.round(totalTuition / 6);
            const paidAmount = paymentAmountInput;
            const paidCount = paymentCountInput;
            const remainingAmount = Math.max(0, totalTuition - paidAmount);
            const isFullyPaid = paidCount >= 6 || remainingAmount === 0;
            const percentPaid = Math.min(100, Math.round((paidAmount / totalTuition) * 100));

            const waDigits = verifyingRegistration.whatsapp.replace(/[^0-9]/g, '');
            const formattedWa = waDigits.startsWith('0') ? '62' + waDigits.slice(1) : waDigits;
            const waNotificationText = `Assalamu'alaikum Warahmatullahi Wabarakatuh, Sdr/i ${verifyingRegistration.fullName} (${verifyingRegistration.registrationNumber}).\n\nAlhamdulillah, pembayaran cicilan belajar Anda untuk program *${verifyingRegistration.selectedProgramName}* telah *DIVERIFIKASI LUNAS* oleh Bagian Keuangan Ma'had Al-Bayan:\n\n- Jumlah Cicilan Lunas: *${paidCount} dari 6 Cicilan*\n- Total Terbayar: *${formatIDR(paidAmount)}*\n- Sisa Tagihan: *${isFullyPaid ? 'LUNAS SEPENUHNYA' : formatIDR(remainingAmount)}*\n- Tanggal Verifikasi: ${paymentDateInput || 'Hari ini'}\n- Rekening Tujuan: ${paymentBankMethod}\n\nData keuangan akun Anda di portal pelajar (pelajar.html) sudah otomatis terupdate. Jazakumullahu khairan.`;
            const waNotificationUrl = `https://wa.me/${formattedWa}?text=${encodeURIComponent(waNotificationText)}`;

            return (
              <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
              >
                <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-emerald-300" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
                          Verifikasi Keuangan & Cicilan Santri
                        </span>
                        <h3 className="text-base font-bold text-white">
                          {verifyingRegistration.fullName} ({verifyingRegistration.registrationNumber})
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                    {/* Profile Info Strip */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Program Terdaftar:</span>
                        <strong className="text-slate-900 font-semibold">{verifyingRegistration.selectedProgramName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Angkatan:</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                          <GraduationCap className="w-3 h-3 text-emerald-800" />
                          {getRegistrationAngkatan(verifyingRegistration)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Kontak WhatsApp:</span>
                        <span className="font-mono text-emerald-800 font-bold">{formatWhatsAppNumber(verifyingRegistration.whatsapp) || verifyingRegistration.whatsapp}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Status Bayar:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isFullyPaid
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : paidCount > 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                        }`}>
                          {isFullyPaid ? '✓ Lunas Penuh (6/6)' : paidCount > 0 ? `Cicilan ${paidCount}/6 Lunas` : 'Belum Lunas (Bulan 1)'}
                        </span>
                      </div>
                    </div>

                    {/* 3 Metric Summary Boxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
                        <span className="text-[11px] text-slate-500 block">Total Biaya Level</span>
                        <strong className="text-base font-mono font-bold text-slate-900">
                          {formatIDR(totalTuition)}
                        </strong>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          6 Bulan @ {formatIDR(monthly)}
                        </span>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                        <span className="text-[11px] text-emerald-800 block">Sudah Diverifikasi</span>
                        <strong className="text-base font-mono font-bold text-emerald-900">
                          {formatIDR(paidAmount)}
                        </strong>
                        <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                          {paidCount} dari 6 Cicilan
                        </span>
                      </div>
                      <div className={`p-3 rounded-xl border ${
                        isFullyPaid
                          ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950'
                          : 'bg-amber-50 border-amber-200 text-amber-950'
                      }`}>
                        <span className="text-[11px] block opacity-80">Sisa Tagihan</span>
                        <strong className="text-base font-mono font-bold">
                          {formatIDR(remainingAmount)}
                        </strong>
                        <span className="text-[10px] block mt-0.5 font-medium">
                          {isFullyPaid ? '✓ Lunas Sepenuhnya' : `Sisa ${6 - paidCount}x Cicilan`}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700">Kemajuan Pelunasan Biaya</span>
                        <span className="font-mono font-bold text-emerald-800">{percentPaid}% ({paidCount}/6 Cicilan)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFullyPaid
                              ? 'bg-emerald-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${percentPaid}%` }}
                        />
                      </div>
                    </div>

                    {/* One-Click Quick Increment Shortcuts */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                      <label className="block text-xs font-bold text-slate-900">
                        Tombol Pintas Verifikasi Cepat (1-Klik):
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickSetInstallment(paidCount + 1)}
                          disabled={paidCount >= 6}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+1 Cicilan (+ {formatIDR(monthly)})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickSetInstallment(6)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-800 text-white hover:bg-teal-900 transition-colors shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Set LUNAS 100% (6 Cicilan)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickSetInstallment(0)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset ke 0</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive 6-Month Installment Cards */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Pilih Status Per Bulan Cicilan (Klik Bulan untuk Menyetel):
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[1, 2, 3, 4, 5, 6].map((month) => {
                          const isMonthPaid = month <= paidCount;
                          return (
                            <button
                              key={month}
                              type="button"
                              onClick={() => handleQuickSetInstallment(month)}
                              className={`p-2.5 rounded-lg border text-left transition-all ${
                                isMonthPaid
                                  ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200 text-emerald-950'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs">Bulan ke-{month}</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                                  isMonthPaid ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {isMonthPaid ? 'Lunas ✓' : 'Belum'}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono mt-1 font-semibold">
                                {formatIDR(monthly)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Form Input Detail Verifikasi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Jumlah Cicilan Lunas (0-6)
                        </label>
                        <select
                          value={paymentCountInput}
                          onChange={(e) => handleQuickSetInstallment(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 font-semibold"
                        >
                          <option value={0}>0 dari 6 Cicilan (Belum Bayar)</option>
                          <option value={1}>1 dari 6 Cicilan ({formatIDR(monthly)})</option>
                          <option value={2}>2 dari 6 Cicilan ({formatIDR(monthly * 2)})</option>
                          <option value={3}>3 dari 6 Cicilan ({formatIDR(monthly * 3)})</option>
                          <option value={4}>4 dari 6 Cicilan ({formatIDR(monthly * 4)})</option>
                          <option value={5}>5 dari 6 Cicilan ({formatIDR(monthly * 5)})</option>
                          <option value={6}>6 dari 6 Cicilan (LUNAS 100% - {formatIDR(totalTuition)})</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Nominal Terbayar (Rp)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={5000}
                          value={paymentAmountInput}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setPaymentAmountInput(val);
                            setPaymentCountInput(Math.min(6, Math.floor(val / (monthly || 85000))));
                          }}
                          className="w-full px-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Tanggal Verifikasi Pembayaran
                        </label>
                        <input
                          type="text"
                          value={paymentDateInput}
                          onChange={(e) => setPaymentDateInput(e.target.value)}
                          placeholder="Contoh: 11 November 2026"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Rekening Tujuan / Metode Pembayaran
                        </label>
                        <select
                          value={paymentBankMethod}
                          onChange={(e) => setPaymentBankMethod(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        >
                          <option value="Bank Syariah Indonesia (BSI Rek 7198234551)">BSI (Rek 7198234551 a.n. Ma'had)</option>
                          <option value="Bank Central Asia (BCA Rek 8410294821)">BCA (Rek 8410294821 a.n. Tadribul Lughah)</option>
                          <option value="Kas Tunai Ma'had (Cash)">Kas Tunai Ma'had (Cash)</option>
                          <option value="Transfer Bank Lain">Transfer Bank Lain</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Catatan Keuangan / Nomor Bukti Transfer (Opsional)
                        </label>
                        <input
                          type="text"
                          value={paymentAdminNote}
                          onChange={(e) => setPaymentAdminNote(e.target.value)}
                          placeholder="Contoh: Mutasi m-banking BSI tanggal 11/11 jam 08:30 telah dicek valid"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>
                    </div>

                    {/* WhatsApp Notification Shortcut */}
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          Kirim Konfirmasi ke WhatsApp Santri
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Format pesan tanda terima pembayaran otomatis telah disiapkan.
                        </p>
                      </div>
                      <a
                        href={waNotificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0 shadow-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Buka WhatsApp</span>
                      </a>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                    >
                      Tutup / Batal
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSavePaymentVerification}
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Menyimpan...' : 'Simpan & Update Pembayaran'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* =====================================================================
              MODAL KONFIRMASI HAPUS PESERTA TERDAFTAR
             ===================================================================== */}
          {deletingRegistrationTarget && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-participant-confirm-title"
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={(e) => {
                if (e.target === e.currentTarget && !isSaving) {
                  setDeletingRegistrationTarget(null);
                }
              }}
            >
              <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="p-5 bg-rose-50 border-b border-rose-200 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700">
                      VERIFIKASI PENGHAPUSAN PESERTA
                    </span>
                    <h4
                      id="delete-participant-confirm-title"
                      className="text-base font-bold text-slate-900 mt-0.5"
                    >
                      Yakin ingin menghapus peserta ini?
                    </h4>
                  </div>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setDeletingRegistrationTarget(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    title="Batal & Tutup"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-3 text-xs text-slate-700">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">No. Registrasi:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {deletingRegistrationTarget.registrationNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Nama Peserta:</span>
                      <span className="font-bold text-slate-900 text-right">
                        {deletingRegistrationTarget.fullName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Angkatan:</span>
                      <span className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {getRegistrationAngkatan(deletingRegistrationTarget)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-slate-500 shrink-0">Program / Level:</span>
                      <span className="font-semibold text-slate-900 text-right">
                        {deletingRegistrationTarget.selectedProgramName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Email / WA:</span>
                      <span className="font-mono text-slate-800 text-right">
                        {deletingRegistrationTarget.email} · {formatWhatsAppNumber(deletingRegistrationTarget.whatsapp) || deletingRegistrationTarget.whatsapp}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-950 leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      Data pendaftaran peserta ini akan dihapus permanen (dan akunnya ikut terhapus jika tidak memiliki pendaftaran kelas lain). Tindakan ini tidak dapat dibatalkan.
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setDeletingRegistrationTarget(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleConfirmDeleteRegistration}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Menghapus...' : 'Ya, Hapus Peserta'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              MODAL KONFIRMASI HAPUS AKUN CALON SANTRI BELUM PILIH LEVEL
             ===================================================================== */}
          {deletingUnselectedTarget && (
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-unselected-confirm-title"
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setDeletingUnselectedTarget(null);
                }
              }}
            >
              <div className="bg-white border border-rose-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
                <div className="p-5 bg-rose-50 border-b border-rose-200 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700">
                      VERIFIKASI PENGHAPUSAN AKUN
                    </span>
                    <h4
                      id="delete-unselected-confirm-title"
                      className="text-base font-bold text-slate-900 mt-0.5"
                    >
                      Yakin ingin menghapus akun calon santri ini?
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeletingUnselectedTarget(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    title="Batal & Tutup"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-3 text-xs text-slate-700">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">No. Reg Akun:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {deletingUnselectedTarget.registrationNumber}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Nama Lengkap:</span>
                      <span className="font-bold text-slate-900 text-right">
                        {deletingUnselectedTarget.fullName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">Email / WA:</span>
                      <span className="font-mono text-slate-800 text-right">
                        {deletingUnselectedTarget.email} · {formatWhatsAppNumber(deletingUnselectedTarget.whatsapp) || deletingUnselectedTarget.whatsapp}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Data akun ini akan dihapus permanen sehingga email tersebut dapat digunakan kembali jika ingin mendaftar ulang dari awal.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeletingUnselectedTarget(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteUnselectedAccount}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Akun</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              MODAL PREVIEW & KIRIM LINK ABSENSI KE GRUP WHATSAPP
             ===================================================================== */}
          {whatsappModalData && (() => {
            const { program, schedule, meeting, customNote } = whatsappModalData;
            const { text: formattedText, url: directAttendanceUrl } = buildAttendanceWhatsAppText(
              program,
              schedule,
              meeting,
              customNote
            );

            return (
              <div
                role="dialog"
                aria-modal="true"
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setWhatsappModalData(null);
                }}
              >
                <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col my-auto animate-in zoom-in-95 duration-150">
                  {/* Modal Header */}
                  <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-[#075E54] to-slate-950 text-white border-b border-emerald-900 flex items-start justify-between gap-4 sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
                        <MessageCircle className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                            KIRIM LINK PRESENSI KE GRUP WHATSAPP
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white">
                            Pertemuan {meeting.sessionNumber}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                          {program.title}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setWhatsappModalData(null)}
                      className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                      title="Tutup Popup"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-5 sm:p-6 space-y-4 text-slate-800 text-xs sm:text-sm leading-relaxed flex-1">
                    {/* Status Izin Sesi */}
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span className="text-xs text-emerald-950 font-semibold">
                          Status Izin Presensi: <strong>DIIZINKAN (TERBUKA)</strong>
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-800">
                        Santri dapat langsung mengisi absen
                      </span>
                    </div>

                    {/* Rincian Sesi */}
                    <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                        <span>Pertemuan Ke-{meeting.sessionNumber} · Pekan Ke-{meeting.pekanNumber}</span>
                        <span>{meeting.dateStr} · {meeting.timeWIB}</span>
                      </div>
                      <p className="font-bold text-slate-900 text-sm">{meeting.title}</p>
                      {meeting.arabicTitle && (
                        <p className="font-arabic text-emerald-900 text-base" dir="rtl">{meeting.arabicTitle}</p>
                      )}
                      <p className="text-[11px] text-slate-600">Pengajar: <strong>{schedule.instructor || 'Ustadz Pengampu'}</strong></p>
                    </div>

                    {/* Catatan Khusus Tambahan (Opsional) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Catatan Khusus Tambahan untuk Peserta (Opsional):
                      </label>
                      <input
                        type="text"
                        value={customNote}
                        onChange={(e) =>
                          setWhatsappModalData({ ...whatsappModalData, customNote: e.target.value })
                        }
                        placeholder="Contoh: Mohon diisi malam ini paling lambat pukul 23.30 WIB ya ikhwah/akhawat"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-800 focus:bg-white"
                      />
                    </div>

                    {/* Tautan Langsung Presensi */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800">
                          Tautan Langsung Presensi Santri:
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(directAttendanceUrl);
                            showToast('success', 'Link presensi berhasil disalin ke clipboard!');
                          }}
                          className="text-[11px] font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Salin Link Saja</span>
                        </button>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-emerald-950 break-all select-all flex items-center justify-between gap-2">
                        <span className="truncate">{directAttendanceUrl}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        💡 Saat santri mengklik tautan ini di WhatsApp, portal santri akan langsung membuka tab absensi dan memunculkan pop-up presensi Pertemuan {meeting.sessionNumber}.
                      </p>
                    </div>

                    {/* Pratinjau Pesan Format WhatsApp (Green Bubble Style) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-800">
                          Pratinjau Pesan Teks WhatsApp:
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(formattedText);
                            showToast('success', 'Seluruh teks pesan WhatsApp berhasil disalin!');
                          }}
                          className="text-[11px] font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Salin Seluruh Teks</span>
                        </button>
                      </div>

                      <div className="bg-[#EFEAE2] p-4 rounded-xl border border-[#DAD3C8] max-h-52 overflow-y-auto shadow-inner text-xs font-sans text-slate-900 whitespace-pre-wrap leading-relaxed select-text">
                        {formattedText}
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 sticky bottom-0">
                    <button
                      type="button"
                      onClick={() => setWhatsappModalData(null)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(formattedText);
                          showToast('success', 'Teks pengumuman & link presensi berhasil disalin! Silakan tempel di grup WhatsApp.');
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Teks</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedText)}`;
                          window.open(waUrl, '_blank');
                          showToast('success', 'Membuka WhatsApp untuk mengirim pesan...');
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-lg transition-all shadow-sm cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        <span>Buka WhatsApp & Kirim</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
};
