/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  PROGRAM_TRACKS,
  CLASS_SCHEDULES,
  INITIAL_REGISTRATIONS,
  LEVEL_1_MATERI_TABLE,
  HERO_IMAGE_PATH,
  ProgramTrack,
  ClassSchedule,
  RegistrationRecord,
  formatIDR,
  applyRegistrationOpenOverrides,
  saveProgramRegistrationOpenState,
  saveProgramAngkatanState
} from './data/arabicAcademyData';
import { RegistrationWorkspace } from './components/RegistrationWorkspace';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { CpanelDbConfig } from './utils/cpanelSqlGenerator';
import {
  buildCpanelReadyZipBlob,
  generateStandaloneLoginHtml,
  generateStandaloneStudentPortalHtml,
  generateStandaloneMateriHtml,
  generateStandaloneSuperAdminHtml
} from './utils/cpanelZipBuilder';
import {
  db,
  auth,
  googleProvider,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  isUserSuperAdmin,
  testFirestoreConnection,
  handleFirestoreError,
  OperationType,
  programToFirestoreDoc,
  firestoreDocToProgram,
  scheduleToFirestoreDoc,
  firestoreDocToSchedule,
  registrationToPrivateFirestoreDoc,
  registrationToPublicStatusDoc,
  firestoreDocToRegistration
} from './firebase';
import {
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Calendar,
  FolderArchive
} from 'lucide-react';

const STORAGE_KEY = 'tadribul_lughah_registrations_v3';
const CPANEL_CONFIG_KEY = 'tadribul_lughah_cpanel_sql_config_v1';

export type PageRoute =
  | 'beranda'
  | 'kurikulum'
  | 'jadwal'
  | 'pendaftaran'
  | 'cek-status'
  | 'superadmin';

function parseHashToPage(hash: string): PageRoute {
  const cleaned = hash.replace(/^#\/?/, '').toLowerCase();
  if (cleaned === 'kurikulum' || cleaned === 'program-studi') return 'kurikulum';
  if (cleaned === 'jadwal' || cleaned === 'jadwal-biaya') return 'jadwal';
  if (cleaned === 'pendaftaran' || cleaned === 'formulir-pendaftaran')
    return 'pendaftaran';
  if (cleaned === 'cek-status') return 'cek-status';
  if (cleaned === 'superadmin' || cleaned === 'admin') return 'superadmin';
  return 'beranda';
}

export default function App() {
  // Multi-Page Navigation State synced with URL Hash
  const [activePage, setActivePage] = useState<PageRoute>(() =>
    parseHashToPage(window.location.hash)
  );

  useEffect(() => {
    const onHashChange = () => {
      setActivePage(parseHashToPage(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateToPage = (page: PageRoute) => {
    setActivePage(page);
    try {
      window.location.hash = `/${page}`;
    } catch {
      // Ignore hash restrictions in sandboxed environments
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic Firestore-Backed State (with immediate fallback to defaults)
  const [programs, setPrograms] = useState<ProgramTrack[]>(() =>
    applyRegistrationOpenOverrides(PROGRAM_TRACKS)
  );
  const [schedules, setSchedules] = useState<ClassSchedule[]>(CLASS_SCHEDULES);
  const [publicRegistrations, setPublicRegistrations] = useState<
    RegistrationRecord[]
  >(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback to initial registrations
    }
    return INITIAL_REGISTRATIONS;
  });
  const [privateRegistrations, setPrivateRegistrations] = useState<
    RegistrationRecord[]
  >([]);

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const hasAutoSeededRef = useRef<boolean>(false);

  // cPanel MySQL Configuration State
  const [cpanelConfig, setCpanelConfig] = useState<CpanelDbConfig>(() => {
    try {
      const saved = localStorage.getItem(CPANEL_CONFIG_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return {
      dbHost: 'localhost',
      dbName: 'cpaneluser_tadribullughah',
      dbUser: 'cpaneluser_admin',
      dbPassPlaceholder: 'GANTI_PASSWORD_MYSQL_CPANEL',
      apiEndpointUrl: ''
    };
  });

  const handleSaveCpanelConfig = (newCfg: CpanelDbConfig) => {
    setCpanelConfig(newCfg);
    try {
      localStorage.setItem(CPANEL_CONFIG_KEY, JSON.stringify(newCfg));
    } catch {
      // Ignore quota errors
    }
  };

  const syncToCpanelMySql = async (
    entity: 'program' | 'schedule' | 'registration',
    payload: unknown
  ) => {
    const endpoint = cpanelConfig.apiEndpointUrl?.trim();
    if (!endpoint) return;
    try {
      await fetch(`${endpoint}?entity=${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn('cPanel MySQL API sync notice:', err);
    }
  };

  const isSuperAdmin = isUserSuperAdmin(currentUser);

  // Interactive Filter States
  const [programCategoryFilter, setProgramCategoryFilter] = useState<
    'all' | 'nahwu' | 'shorof'
  >('all');
  const [scheduleLevelFilter, setScheduleLevelFilter] = useState<
    'all' | 'lv1' | 'lv2' | 'lv3-4'
  >('all');
  const [expandedSyllabusProgramId, setExpandedSyllabusProgramId] =
    useState<string>('tl-level-1');

  // Registration Shared State
  const [selectedProgramId, setSelectedProgramId] =
    useState<string>('tl-level-1');
  const [selectedScheduleId, setSelectedScheduleId] =
    useState<string>('sch-lv1-malam');

  // Image Error Fallbacks (Zero-Broken-Image Policy)
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Test Firestore connection & listen to Auth state
  useEffect(() => {
    testFirestoreConnection();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubAuth();
  }, []);

  // Real-time listeners for public collections: /programs, /schedules, /registrationStatuses
  useEffect(() => {
    const unsubPrograms = onSnapshot(
      collection(db, 'programs'),
      (snap) => {
        if (!snap.empty) {
          const loaded = snap.docs
            .map((d) =>
              firestoreDocToProgram(d.data() as Record<string, unknown>)
            )
            .sort((a, b) => a.levelNumber - b.levelNumber);
          setPrograms(loaded);
        }
      },
      (error) => {
        console.warn('Programs listener fallback:', error.message);
      }
    );

    const unsubSchedules = onSnapshot(
      collection(db, 'schedules'),
      (snap) => {
        if (!snap.empty) {
          const loaded = snap.docs
            .map((d) =>
              firestoreDocToSchedule(d.data() as Record<string, unknown>)
            )
            .sort((a, b) => a.levelNumber - b.levelNumber);
          setSchedules(loaded);
        }
      },
      (error) => {
        console.warn('Schedules listener fallback:', error.message);
      }
    );

    const unsubPublicStatuses = onSnapshot(
      collection(db, 'registrationStatuses'),
      (snap) => {
        if (!snap.empty) {
          const loaded = snap.docs.map((d) =>
            firestoreDocToRegistration(d.data() as Record<string, unknown>)
          );
          setPublicRegistrations(loaded);
        }
      },
      (error) => {
        console.warn('RegistrationStatuses listener fallback:', error.message);
      }
    );

    return () => {
      unsubPrograms();
      unsubSchedules();
      unsubPublicStatuses();
    };
  }, []);

  // Real-time listener for private PII registrations when logged in as Superadmin
  useEffect(() => {
    if (!isSuperAdmin) {
      setPrivateRegistrations([]);
      return;
    }

    const unsubPrivate = onSnapshot(
      collection(db, 'registrations'),
      (snap) => {
        if (!snap.empty) {
          const loaded = snap.docs.map((d) =>
            firestoreDocToRegistration(d.data() as Record<string, unknown>)
          );
          setPrivateRegistrations(loaded);
        } else if (!hasAutoSeededRef.current) {
          hasAutoSeededRef.current = true;
          handleSeedDefaults().catch((err) =>
            console.warn('Initial seed warning:', err)
          );
        }
      },
      (error) => {
        console.warn('Private registrations listener error:', error.message);
      }
    );

    return () => unsubPrivate();
  }, [isSuperAdmin]);

  const activeRegistrations =
    isSuperAdmin && privateRegistrations.length > 0
      ? privateRegistrations
      : publicRegistrations;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(publicRegistrations));
    } catch {
      // Ignore storage quota errors
    }
  }, [publicRegistrations]);

  // Superadmin CRUD Operations
  const handleLoginGoogle = async () => {
    setAuthLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSaveProgram = async (prog: ProgramTrack) => {
    saveProgramRegistrationOpenState(prog.id, prog.registrationOpen !== false);
    saveProgramAngkatanState(prog.id, prog.angkatan || 'Angkatan 1');
    setPrograms((prev) =>
      prev
        .map((p) => (p.id === prog.id ? prog : p))
        .sort((a, b) => a.levelNumber - b.levelNumber)
    );
    await syncToCpanelMySql('program', prog);
    const path = `programs/${prog.id}`;
    if (isUserSuperAdmin(currentUser)) {
      try {
        await setDoc(doc(db, 'programs', prog.id), programToFirestoreDoc(prog));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const handleSaveSchedule = async (sch: ClassSchedule) => {
    const path = `schedules/${sch.id}`;
    try {
      await setDoc(doc(db, 'schedules', sch.id), scheduleToFirestoreDoc(sch));
      await syncToCpanelMySql('schedule', sch);
      setSchedules((prev) => {
        const exists = prev.some((s) => s.id === sch.id);
        const updated = exists
          ? prev.map((s) => (s.id === sch.id ? sch : s))
          : [...prev, sch];
        return updated.sort((a, b) => a.levelNumber - b.levelNumber);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    const path = `schedules/${scheduleId}`;
    try {
      await deleteDoc(doc(db, 'schedules', scheduleId));
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleSaveRegistration = async (record: RegistrationRecord) => {
    const privatePath = `registrations/${record.registrationNumber}`;
    try {
      await setDoc(
        doc(db, 'registrations', record.registrationNumber),
        registrationToPrivateFirestoreDoc(record)
      );
      await setDoc(
        doc(db, 'registrationStatuses', record.registrationNumber),
        registrationToPublicStatusDoc(record)
      );
      await syncToCpanelMySql('registration', record);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }
  };

  const handleDeleteRegistration = async (registrationNumber: string) => {
    const privatePath = `registrations/${registrationNumber}`;
    try {
      await deleteDoc(doc(db, 'registrations', registrationNumber));
      await deleteDoc(doc(db, 'registrationStatuses', registrationNumber));
      setPublicRegistrations((prev) =>
        prev.filter((r) => r.registrationNumber !== registrationNumber)
      );
      setPrivateRegistrations((prev) =>
        prev.filter((r) => r.registrationNumber !== registrationNumber)
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, privatePath);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      for (const prog of PROGRAM_TRACKS) {
        await setDoc(doc(db, 'programs', prog.id), programToFirestoreDoc(prog));
      }
      for (const sch of CLASS_SCHEDULES) {
        await setDoc(
          doc(db, 'schedules', sch.id),
          scheduleToFirestoreDoc(sch)
        );
      }
      for (const rec of INITIAL_REGISTRATIONS) {
        await setDoc(
          doc(db, 'registrations', rec.registrationNumber),
          registrationToPrivateFirestoreDoc(rec)
        );
        await setDoc(
          doc(db, 'registrationStatuses', rec.registrationNumber),
          registrationToPublicStatusDoc(rec)
        );
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seedDefaults');
    }
  };

  const handleChooseProgram = (programId: string) => {
    setSelectedProgramId(programId);
    const matchingSchedule = schedules.find((s) => s.programId === programId);
    if (matchingSchedule) {
      setSelectedScheduleId(matchingSchedule.id);
    }
    navigateToPage('pendaftaran');
  };

  const handleChooseSchedule = (scheduleId: string, programId: string) => {
    setSelectedProgramId(programId);
    setSelectedScheduleId(scheduleId);
    navigateToPage('pendaftaran');
  };

  const handleAddRegistration = async (newRecord: RegistrationRecord) => {
    setPublicRegistrations((prev) => [newRecord, ...prev]);
    try {
      await syncToCpanelMySql('registration', newRecord);
      await setDoc(
        doc(db, 'registrations', newRecord.registrationNumber),
        registrationToPrivateFirestoreDoc(newRecord)
      );
      await setDoc(
        doc(db, 'registrationStatuses', newRecord.registrationNumber),
        registrationToPublicStatusDoc(newRecord)
      );
    } catch (error) {
      console.warn('Firestore registration sync warning:', error);
    }
  };

  const filteredPrograms = programs.filter((p) =>
    programCategoryFilter === 'all' ? true : p.category === programCategoryFilter
  );

  const filteredSchedules = schedules.filter((s) => {
    if (scheduleLevelFilter === 'all') return true;
    if (scheduleLevelFilter === 'lv1') return s.levelNumber === 1;
    if (scheduleLevelFilter === 'lv2') return s.levelNumber === 2;
    return s.levelNumber === 3 || s.levelNumber === 4;
  });

  const primaryProgramTuition = programs[0]?.tuitionIDR || 85000;

  const navItems: { id: PageRoute; label: string }[] = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'kurikulum', label: 'Kurikulum' },
    { id: 'jadwal', label: 'Jadwal Malam' },
    { id: 'pendaftaran', label: 'Pendaftaran' },
    { id: 'cek-status', label: 'Cek Status' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract: Strictly 1 row, 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#/beranda"
            onClick={(e) => {
              e.preventDefault();
              navigateToPage('beranda');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            Tadribul Lughah
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            aria-label="Navigasi Halaman Utama"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            {navItems.map((item) => {
              const isCurrent = activePage === item.id;
              return (
                <a
                  key={item.id}
                  href={`#/${item.id}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    navigateToPage(item.id);
                  }}
                  className={`transition-colors whitespace-nowrap shrink-0 underline-offset-8 ${
                    isCurrent
                      ? 'text-emerald-900 font-semibold underline decoration-2 decoration-emerald-800'
                      : 'text-slate-600 hover:text-slate-900 hover:underline'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigateToPage('pendaftaran')}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
            >
              Daftar ({formatIDR(primaryProgramTuition)}/Level)
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Header Mobile Page Switcher + Active Page Breadcrumb & Superadmin Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Mobile Horizontal Page Links (visible on small viewports) */}
          <div className="flex md:hidden items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateToPage(item.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                  activePage === item.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
            <a
              href="/pelajar.html"
              className="px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 text-white bg-emerald-900 hover:bg-emerald-800"
            >
              Portal Pelajar
            </a>
            <a
              href="/login.html"
              className="px-2.5 py-1 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 text-emerald-900 bg-emerald-50 hover:bg-emerald-100"
            >
              Login Akun
            </a>
          </div>

          {/* Desktop Page Context Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span>Tadribul Lughah</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-900">
              {activePage === 'beranda' && 'Halaman Beranda'}
              {activePage === 'kurikulum' &&
                'Halaman Kurikulum Level 1–4 (Nahwu & Shorof)'}
              {activePage === 'jadwal' &&
                'Halaman Jadwal Kelas Malam Online (20.00 – 22.00 WIB)'}
              {activePage === 'pendaftaran' &&
                'Halaman Formulir Pendaftaran Online'}
              {activePage === 'cek-status' &&
                'Halaman Cek Status & Direktori Peserta'}
              {activePage === 'superadmin' &&
                'Halaman Khusus Superadmin & Database SQL cPanel'}
            </span>
          </div>

          {/* Quick Download .ZIP cPanel & Dedicated Superadmin Page Trigger */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => {
                const zipBlob = buildCpanelReadyZipBlob(
                  programs,
                  schedules,
                  activeRegistrations,
                  cpanelConfig
                );
                const url = URL.createObjectURL(zipBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'tadribul_lughah_cpanel_siap_upload.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              Unduh Website .ZIP (Siap Upload cPanel)
            </button>

            <a
              href="/pelajar.html"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-emerald-900 text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Halaman Pelajar (pelajar.html)</span>
            </a>

            <a
              href={isSuperAdmin ? '/superadmin.html' : '/login.html'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {isSuperAdmin
                ? 'Panel Superadmin (superadmin.html)'
                : 'Login Akun (login.html)'}
            </a>
          </div>
        </div>
      </div>

      {/* MULTI-PAGE VIEWPORT CONTENT */}
      <main className="flex-1">
        {/* =====================================================================
            HALAMAN 1: BERANDA (HOME PAGE)
           ===================================================================== */}
        {activePage === 'beranda' && (
          <>
            {/* Hero Section: 2-Column Split with items-stretch + Full-Width 4-Column Pillar Strip Below */}
            <section className="py-12 sm:py-16 lg:py-20 bg-white border-b border-slate-200">
              <div className="max-w-[1200px] mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
                  {/* Left Column: Editorial Value Proposition (6 cols) */}
                  <div className="lg:col-span-6 flex flex-col justify-between py-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-4">
                        <span className="font-semibold text-emerald-900">
                          Program Pembelajaran Bahasa Arab Tadribul Lughah
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Kelas Malam 20.00 – 22.00 WIB</span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {formatIDR(primaryProgramTuition)} / Level (Cicilan 6x{' '}
                          {formatIDR(Math.round(primaryProgramTuition / 6))}/bln)
                        </span>
                      </div>

                      <p
                        dir="rtl"
                        className="font-arabic text-2xl sm:text-3xl text-emerald-900 mb-3 text-left"
                      >
                        بَرْنَامَجُ تَدْرِيبِ اللُّغَةِ العَرَبِيَّةِ — النَّحْوُ وَالصَّرْفُ التَّطْبِيقِيّ
                      </p>

                      <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-semibold text-slate-900 tracking-tight leading-[1.15]">
                        Program Tadribul Lughah: Belajar Nahwu (Level 1–3) & Shorof (Level 4) secara Online
                      </h1>

                      <p className="mt-5 text-base text-slate-600 leading-relaxed max-w-xl">
                        Kurikulum bahasa Arab berjenjang yang dilaksanakan secara{' '}
                        <strong>Online Live Interaktif</strong> khusus di{' '}
                        <strong>malam hari pukul 20.00 – 22.00 WIB</strong>{' '}
                        dengan biaya{' '}
                        <strong>
                          {formatIDR(primaryProgramTuition)} per level
                        </strong>{' '}
                        (bisa dicicil per bulan dibagi 6x yaitu{' '}
                        <strong>
                          {formatIDR(Math.round(primaryProgramTuition / 6))} / bulan
                        </strong>
                        ). Menuntaskan kaidah kalimat pada{' '}
                        <strong>Level 1–3 (Nahwu)</strong> dan perubahan bentuk
                        kata pada <strong>Level 4 (Shorof)</strong>.
                      </p>
                    </div>

                    {/* Single Dominant CTA + Secondary Page Exploration Links */}
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <div className="flex flex-wrap items-center gap-4">
                        <button
                          type="button"
                          onClick={() => navigateToPage('pendaftaran')}
                          className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
                        >
                          Daftar Sekarang — {formatIDR(primaryProgramTuition)} / Level
                          <ArrowRight className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => navigateToPage('kurikulum')}
                          className="inline-flex items-center gap-2 px-5 py-3.5 text-sm font-medium text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0"
                        >
                          Buka Halaman Kurikulum
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>
                          Level 1:{' '}
                          {programs[0]?.scheduleDays || 'Kamis & Jumat'} (
                          {programs[0]?.scheduleTime || '20.00 – 22.00 WIB'})
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Level 2:{' '}
                          {programs[1]?.scheduleDays || 'Selasa & Rabu'} (
                          {programs[1]?.scheduleTime || '20.00 – 22.00 WIB'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: High-Impact Architectural Photography (6 cols) */}
                  <div className="lg:col-span-6 relative rounded-xl overflow-hidden border border-slate-200 min-h-[340px] lg:min-h-[460px] bg-slate-900 flex flex-col justify-end">
                    {!brokenImages['hero'] ? (
                      <img
                        src={HERO_IMAGE_PATH}
                        alt="Suasana pembelajaran Program Tadribul Lughah"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, hero: true }))
                        }
                        className="absolute inset-0 w-full h-full lg:h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 flex items-center justify-center p-8 text-center">
                        <div>
                          <BookOpen className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                          <p className="font-arabic text-3xl text-white">
                            بَرْنَامَجُ تَدْرِيبِ اللُّغَةِ
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Measured Contrast Scrim for Media Overlay */}
                    <div className="relative z-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-6 sm:p-8 pt-20 text-white">
                      <p className="text-xs font-mono text-emerald-300">
                        KELAS MALAM ONLINE (20.00 – 22.00 WIB) ·{' '}
                        {formatIDR(primaryProgramTuition).toUpperCase()} PER LEVEL
                      </p>
                      <p className="text-base sm:text-lg font-medium mt-1 leading-snug">
                        Waktu belajar malam hari yang kondusif melalui sesi live interaktif beserta modul PDF dan rekaman ulang setiap pertemuan.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Full-Width 4-Column Curriculum Pillar Strip Below Hero Split */}
                <div className="mt-12 pt-10 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {programs.slice(0, 4).map((prog) => (
                    <div
                      key={prog.id}
                      className="flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <p
                          className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${
                            prog.category === 'shorof'
                              ? 'text-emerald-900'
                              : 'text-slate-900'
                          }`}
                        >
                          Level {prog.levelNumber} ·{' '}
                          {prog.category === 'shorof' ? 'Shorof' : 'Nahwu'}
                        </p>
                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                          <strong className="text-emerald-900">
                            {prog.angkatan || 'Angkatan 1'}
                          </strong>{' '}
                          ·{' '}
                          <strong>
                            {prog.scheduleDays} ({prog.scheduleTime})
                          </strong>{' '}
                          · {prog.title}
                        </p>
                      </div>
                      {prog.registrationOpen === false ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                          Pendaftaran Level {prog.levelNumber} Ditutup (OFF)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleChooseProgram(prog.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:underline underline-offset-4 w-fit"
                        >
                          Daftar Level {prog.levelNumber} ({formatIDR(prog.tuitionIDR)})
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Home Page Section 2: Portal Multi-Halaman Tadribul Lughah */}
            <section className="py-16 bg-[#F8FAFC]">
              <div className="max-w-[1200px] mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-medium text-emerald-800 tracking-wide mb-1.5">
                      Eksplorasi Halaman Portal Tadribul Lughah
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                      Panduan Lengkap Kurikulum, Jadwal Malam, & Admisi Online
                    </h2>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: Halaman Kurikulum */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
                    <div className="space-y-2.5">
                      <span className="text-xs font-mono font-semibold text-emerald-800">
                        01. HALAMAN KURIKULUM
                      </span>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Silabus Level 1–3 Nahwu & Level 4 Shorof
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Pelajari rincian materi per pekan, kitab pegangan, serta target capaian lulusan untuk setiap level Tadribul Lughah.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateToPage('kurikulum')}
                      className="inline-flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <span>Buka Halaman Kurikulum</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card 2: Halaman Jadwal Malam */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
                    <div className="space-y-2.5">
                      <span className="text-xs font-mono font-semibold text-emerald-800">
                        02. HALAMAN JADWAL MALAM
                      </span>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Jadwal Online 20.00 – 22.00 WIB
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Cek jadwal hari perkuliahan (Kamis-Jumat, Selasa-Rabu, Sabtu-Ahad), daftar pengajar, dan sisa kuota kursi tiap kelas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateToPage('jadwal')}
                      className="inline-flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <span>Buka Halaman Jadwal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card 3: Halaman Formulir Pendaftaran */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
                    <div className="space-y-2.5">
                      <span className="text-xs font-mono font-semibold text-emerald-800">
                        03. HALAMAN PENDAFTARAN
                      </span>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Formulir Daftar & Kartu Peserta
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Isi formulir pendaftaran online ({formatIDR(primaryProgramTuition)} / level) dan dapatkan Kartu Peserta Digital secara instan.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateToPage('pendaftaran')}
                      className="inline-flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors"
                    >
                      <span>Buka Formulir Pendaftaran</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card 4: Halaman Cek Status */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
                    <div className="space-y-2.5">
                      <span className="text-xs font-mono font-semibold text-emerald-800">
                        04. HALAMAN CEK STATUS
                      </span>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Verifikasi Nomor Registrasi ({activeRegistrations.length})
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Cek status verifikasi pendaftaran peserta menggunakan Nomor Registrasi (TL-2026-xxxx) dan unduh ulang bukti daftar.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateToPage('cek-status')}
                      className="inline-flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <span>Buka Halaman Cek Status</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Dedicated Separate Files login.html, pelajar.html, & superadmin.html Banner Card */}
                <div className="mt-6 bg-slate-900 text-white border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>05. FILE TERPISAH: PELAJAR TERDAFTAR (pelajar.html) · LOGIN (login.html) · SUPERADMIN (superadmin.html)</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Halaman Khusus Pelajar Terdaftar (<span className="font-mono text-emerald-300">pelajar.html</span>) & Gerbang Login (<span className="font-mono text-emerald-300">login.html</span>)
                    </h3>
                    <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                      Pelajar yang sudah mendaftar dan memiliki akun dapat masuk ke halaman khusus <span className="font-mono text-emerald-300">pelajar.html</span>. Jika Superadmin (<span className="font-mono text-emerald-300">mazharhajid@gmail.com</span>) yang login di <span className="font-mono text-emerald-300">login.html</span>, sistem langsung mengarahkan ke <span className="font-mono text-emerald-300">superadmin.html</span>.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const htmlContent = generateStandaloneStudentPortalHtml(
                          programs,
                          schedules,
                          activeRegistrations
                        );
                        const blob = new Blob([htmlContent], {
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
                      }}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Unduh pelajar.html</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const htmlContent = generateStandaloneLoginHtml();
                        const blob = new Blob([htmlContent], {
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
                      }}
                      className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Unduh login.html</span>
                    </button>

                    <a
                      href="/pelajar.html"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Buka Portal Pelajar (pelajar.html)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* =====================================================================
            HALAMAN 2: KURIKULUM LEVEL 1–4 (CURRICULUM PAGE)
           ===================================================================== */}
        {activePage === 'kurikulum' && (
          <section className="py-12 sm:py-16 bg-[#F8FAFC]">
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-slate-200">
                <div>
                  <p className="text-xs font-medium text-emerald-800 tracking-wide mb-2">
                    Halaman Kurikulum Berjenjang · Tadribul Lughah (Level 1–4)
                  </p>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight">
                    Struktur Kurikulum Level 1–3 Ilmu Nahwu & Level 4 Ilmu Shorof
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
                    Seluruh kelas dilaksanakan secara Online pada malam hari (
                    <strong>20.00 – 22.00 WIB</strong>) dengan biaya{' '}
                    <strong>{formatIDR(primaryProgramTuition)} per level</strong>{' '}
                    (bisa dicicil per bulan dibagi 6:{' '}
                    <strong>
                      {formatIDR(Math.round(primaryProgramTuition / 6))} / bulan
                    </strong>
                    ).
                  </p>
                </div>

                {/* Interactive Category Filter Buttons */}
                <div
                  role="tablist"
                  aria-label="Filter kategori level Tadribul Lughah"
                  className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start lg:self-auto"
                >
                  {[
                    { id: 'all', label: 'Semua Level (1–4)' },
                    { id: 'nahwu', label: 'Level 1–3: Ilmu Nahwu' },
                    { id: 'shorof', label: 'Level 4: Ilmu Shorof' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={programCategoryFilter === tab.id}
                      onClick={() =>
                        setProgramCategoryFilter(
                          tab.id as 'all' | 'nahwu' | 'shorof'
                        )
                      }
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        programCategoryFilter === tab.id
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Asymmetric Bento Grid of Programs */}
              <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {filteredPrograms.map((prog, index) => {
                  let colSpanClass = 'lg:col-span-6';
                  if (filteredPrograms.length === 4) {
                    colSpanClass =
                      index === 0 || index === 3
                        ? 'lg:col-span-7'
                        : 'lg:col-span-5';
                  } else if (filteredPrograms.length === 1) {
                    colSpanClass = 'lg:col-span-12';
                  }

                  const isExpanded = expandedSyllabusProgramId === prog.id;

                  return (
                    <article
                      key={prog.id}
                      className={`${colSpanClass} bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between`}
                    >
                      <div>
                        {prog.image && !brokenImages[prog.id] && (
                          <div className="relative h-52 w-full overflow-hidden border-b border-slate-200 bg-slate-900">
                            <img
                              src={prog.image}
                              alt={prog.title}
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setBrokenImages((prev) => ({
                                  ...prev,
                                  [prog.id]: true
                                }))
                              }
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end justify-between p-5 text-white">
                              <span className="text-xs font-mono">
                                {prog.indexNumber}. {prog.categoryLabel} ·{' '}
                                {prog.scheduleDays} ({prog.scheduleTime})
                              </span>
                              <span
                                dir="rtl"
                                className="font-arabic text-xl text-emerald-200"
                              >
                                {prog.arabicTitle}
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="p-6 sm:p-8">
                          {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums mb-3">
                            <span className="font-semibold text-emerald-900">
                              {prog.indexNumber}. {prog.categoryLabel}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-emerald-800">
                              {prog.angkatan || 'Angkatan 1'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-slate-800">
                              {prog.scheduleDays} ({prog.scheduleTime})
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{prog.sessionsCount} Pertemuan Online</span>
                          </div>

                          {!prog.image && (
                            <p
                              dir="rtl"
                              className="font-arabic text-xl text-emerald-900 mb-2 text-right"
                            >
                              {prog.arabicTitle}
                            </p>
                          )}

                          <h2 className="text-xl font-semibold text-slate-900 leading-snug">
                            {prog.title}
                          </h2>

                          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                            {prog.summary}
                          </p>

                          <div className="mt-5 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                            <p>
                              <span className="font-semibold text-slate-900">
                                Sasaran Peserta:{' '}
                              </span>
                              {prog.levelRecommendation}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-900">
                                Modul Pegangan:{' '}
                              </span>
                              {prog.kitabReference}
                            </p>
                            <p>
                              <span className="font-semibold text-slate-900">
                                Target Capaian:{' '}
                              </span>
                              {prog.targetOutcome}
                            </p>
                          </div>

                          {/* Interactive Syllabus Toggle */}
                          <div className="mt-5">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSyllabusProgramId(
                                  isExpanded ? '' : prog.id
                                )
                              }
                              className="text-xs font-semibold text-emerald-900 hover:underline underline-offset-4 whitespace-nowrap"
                            >
                              {isExpanded
                                ? 'Sembunyikan Rincian Silabus ↑'
                                : `Lihat Silabus ${prog.modules.length} Tahap Pembelajaran ↓`}
                            </button>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                {prog.levelNumber === 1 ? (
                                  <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[380px] overflow-y-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                                        <tr>
                                          <th className="py-2.5 pl-3.5 pr-2 w-12">
                                            No
                                          </th>
                                          <th className="py-2.5 px-2.5 w-24">
                                            Pekan
                                          </th>
                                          <th className="py-2.5 px-2.5">
                                            Daftar Materi Level 1 (1 Pekan 1 Materi)
                                          </th>
                                          <th className="py-2.5 pl-2.5 pr-3.5 text-right">
                                            Pokok Kaidah
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-200 bg-white">
                                        {LEVEL_1_MATERI_TABLE.map((row) => (
                                          <tr
                                            key={row.code}
                                            className="hover:bg-slate-50/80 transition-colors"
                                          >
                                            <td className="py-2.5 pl-3.5 pr-2 font-mono font-semibold text-slate-500">
                                              {row.no}
                                            </td>
                                            <td className="py-2.5 px-2.5 font-mono font-semibold text-emerald-900 whitespace-nowrap">
                                              {row.pekan}
                                            </td>
                                            <td className="py-2.5 px-2.5 font-medium text-slate-900">
                                              {row.title}
                                            </td>
                                            <td
                                              dir="rtl"
                                              className="py-2.5 pl-2.5 pr-3.5 font-arabic text-sm text-emerald-900 text-right whitespace-nowrap"
                                            >
                                              {row.arabicTerm}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {prog.modules.map((mod) => (
                                      <div
                                        key={mod.weekRange}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 last:border-b-0 text-xs"
                                      >
                                        <div>
                                          <span className="font-mono font-semibold text-slate-900">
                                            {mod.weekRange}
                                          </span>{' '}
                                          —{' '}
                                          <span className="font-semibold text-slate-800">
                                            {mod.topic}
                                          </span>
                                          <p className="text-slate-500 mt-0.5">
                                            {mod.outcome}
                                          </p>
                                        </div>
                                        <span
                                          dir="rtl"
                                          className="font-arabic text-base text-emerald-900 shrink-0"
                                        >
                                          {mod.arabicTerm}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Price + Select CTA */}
                      <div
                        className={`px-6 sm:px-8 py-4 ${
                          index === 0
                            ? 'bg-[#EEF4FA] border-t border-[#D6E4F0]'
                            : index === 1
                              ? 'bg-[#EDF7F2] border-t border-[#CDE6DA]'
                              : index === 2
                                ? 'bg-[#FDF2F2] border-t border-[#F2D5D5]'
                                : index === 3
                                  ? 'bg-[#FEFBEB] border-t border-[#F3E5AB]'
                                  : 'bg-slate-50 border-t border-slate-200'
                        } flex flex-wrap items-center justify-between gap-4`}
                      >
                        <div>
                          <span
                            className={`text-xs block ${
                              index <= 3 ? 'text-slate-600' : 'text-slate-500'
                            }`}
                          >
                            Biaya Pendidikan (Bisa Dicicil 6x Per Bulan)
                          </span>
                          <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                            {formatIDR(prog.tuitionIDR)}{' '}
                            <span className="text-xs font-normal text-slate-500">
                              / level
                            </span>
                          </span>
                          <span className="text-[11px] font-mono text-emerald-900 font-semibold block mt-0.5">
                            Cicilan: {formatIDR(Math.round(prog.tuitionIDR / 6))} / bulan (× 6 bulan)
                          </span>
                        </div>

                        {prog.registrationOpen === false ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-rose-900 bg-rose-100 border border-rose-300 rounded-lg cursor-not-allowed whitespace-nowrap shrink-0"
                          >
                            Pendaftaran Ditutup (OFF)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleChooseProgram(prog.id)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-emerald-900 transition-colors whitespace-nowrap shrink-0"
                          >
                            Daftar Level {prog.levelNumber}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Cross-page Footer Bar */}
              <div className="mt-12 p-6 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Ingin melihat rincian hari, pengajar, dan sisa kursi setiap kelas?
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Lanjutkan ke halaman Jadwal Kelas Malam Online (20.00 – 22.00 WIB).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateToPage('jadwal')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Buka Halaman Jadwal Kelas Malam
                </button>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            HALAMAN 3: JADWAL KELAS MALAM (SCHEDULE PAGE)
           ===================================================================== */}
        {activePage === 'jadwal' && (
          <section className="py-12 sm:py-16 bg-white">
            <div className="max-w-[1200px] mx-auto px-6">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-10 border-b border-slate-200">
                <div>
                  <p className="text-xs font-medium text-emerald-800 tracking-wide mb-2">
                    Halaman Jadwal Kelas Online Malam & Biaya Pendaftaran
                  </p>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight">
                    Jadwal Kelas Online Tadribul Lughah (20.00 – 22.00 WIB)
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
                    Seluruh kelas dilaksanakan secara{' '}
                    <strong>
                      Online Live via Zoom pada pukul 20.00 – 22.00 WIB
                    </strong>
                    . Level 1 setiap hari{' '}
                    <strong>
                      {programs[0]?.scheduleDays || 'Kamis & Jumat'}
                    </strong>
                    , dan Level 2 setiap hari{' '}
                    <strong>
                      {programs[1]?.scheduleDays || 'Selasa & Rabu'}
                    </strong>
                    .
                  </p>
                </div>

                {/* Interactive Level Filter */}
                <div
                  role="tablist"
                  aria-label="Filter jadwal berdasarkan level"
                  className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 self-start lg:self-auto"
                >
                  {[
                    { id: 'all', label: `Semua Jadwal (${schedules.length})` },
                    { id: 'lv1', label: 'Level 1' },
                    { id: 'lv2', label: 'Level 2' },
                    { id: 'lv3-4', label: 'Level 3 & 4' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={scheduleLevelFilter === tab.id}
                      onClick={() =>
                        setScheduleLevelFilter(
                          tab.id as 'all' | 'lv1' | 'lv2' | 'lv3-4'
                        )
                      }
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                        scheduleLevelFilter === tab.id
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabular Schedule Matrix */}
              <div className="mt-8 overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 pl-6 pr-4">Kode Kelas</th>
                      <th className="py-3.5 px-4">Level & Materi</th>
                      <th className="py-3.5 px-4">Moda & Pengajar</th>
                      <th className="py-3.5 px-4">Hari & Jam Malam (WIB)</th>
                      <th className="py-3.5 px-4">Sisa Kuota</th>
                      <th className="py-3.5 px-4">Biaya / Level</th>
                      <th className="py-3.5 pl-4 pr-6 text-right">
                        Pendaftaran
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs bg-white">
                    {filteredSchedules.map((sch) => {
                      const remainingSeats = Math.max(
                        0,
                        sch.capacity - sch.enrolled
                      );
                      const isSelected = selectedScheduleId === sch.id;
                      return (
                        <tr
                          key={sch.id}
                          className={
                            isSelected
                              ? 'bg-emerald-50/50'
                              : 'hover:bg-slate-50'
                          }
                        >
                          <td className="py-4 pl-6 pr-4 font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                            {sch.batchCode}
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-semibold text-slate-900">
                              {sch.programName}
                            </p>
                            <p className="text-slate-500 mt-0.5">
                              {sch.levelName} · Mulai {sch.startDate}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-emerald-900">
                              {sch.modeLabel}
                            </p>
                            <p className="text-slate-500 mt-0.5">
                              {sch.instructor}
                            </p>
                          </td>
                          <td className="py-4 px-4 font-mono tabular-nums whitespace-nowrap">
                            <p className="font-semibold text-slate-900">
                              {sch.days}
                            </p>
                            <p className="text-slate-500 mt-0.5">
                              {sch.timeWIB}
                            </p>
                          </td>
                          <td className="py-4 px-4 font-mono tabular-nums whitespace-nowrap">
                            <span className="font-semibold text-emerald-900">
                              Tersisa {remainingSeats} Kursi
                            </span>
                            <span className="block text-slate-400">
                              Terisi {sch.enrolled}/{sch.capacity}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono tabular-nums whitespace-nowrap">
                            <span className="font-semibold text-slate-900 block">
                              {formatIDR(sch.feeIDR)} / level
                            </span>
                            <span className="text-emerald-800 font-medium text-[11px]">
                              Cicilan 6x: {formatIDR(Math.round(sch.feeIDR / 6))}/bln
                            </span>
                          </td>
                          <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                            {programs.find((p) => p.id === sch.programId)
                              ?.registrationOpen === false ? (
                              <button
                                type="button"
                                disabled
                                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-100 text-rose-900 border border-rose-300 cursor-not-allowed whitespace-nowrap shrink-0"
                              >
                                Pendaftaran Ditutup
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleChooseSchedule(sch.id, sch.programId)
                                }
                                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                                  isSelected
                                    ? 'bg-emerald-900 text-white'
                                    : 'bg-slate-900 text-white hover:bg-emerald-900'
                                }`}
                              >
                                {isSelected
                                  ? '✓ Lanjut Daftar'
                                  : 'Pilih & Daftar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Learning Provisions Strip */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="text-xs font-mono font-semibold text-emerald-800">
                    01. WAKTU BELAJAR KONDUSIF
                  </p>
                  <h2 className="text-base font-semibold text-slate-900">
                    Khusus Malam Hari (20.00 – 22.00 WIB)
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dirancang agar dapat diikuti oleh mahasiswa, karyawan, guru, maupun umum setelah selesai beraktivitas harian.
                  </p>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="text-xs font-mono font-semibold text-emerald-800">
                    02. FASILITAS KELAS ONLINE
                  </p>
                  <h2 className="text-base font-semibold text-slate-900">
                    Live Zoom, Rekaman Ulang, & Modul PDF
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Setiap sesi direkam secara penuh sehingga peserta yang berhalangan hadir tetap dapat menyimak ulang penjelasan Ustadz.
                  </p>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <p className="text-xs font-mono font-semibold text-emerald-800">
                    03. BIAYA BISA DICICIL 6 BULAN
                  </p>
                  <h2 className="text-base font-semibold text-slate-900">
                    {formatIDR(primaryProgramTuition)} / Level ({formatIDR(Math.round(primaryProgramTuition / 6))} / Bulan × 6)
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Biaya per level sebesar {formatIDR(primaryProgramTuition)} dapat dicicil per bulan dibagi 6 ({formatIDR(Math.round(primaryProgramTuition / 6))} per bulan), sudah mencakup modul PDF dan evaluasi kenaikan level.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =====================================================================
            HALAMAN 4 & 5: FORMULIR PENDAFTARAN & CEK STATUS PENDAFTAR
           ===================================================================== */}
        {(activePage === 'pendaftaran' || activePage === 'cek-status') && (
          <RegistrationWorkspace
            programs={programs}
            schedules={schedules}
            selectedProgramId={selectedProgramId}
            selectedScheduleId={selectedScheduleId}
            registrations={activeRegistrations}
            onSelectProgram={setSelectedProgramId}
            onSelectSchedule={setSelectedScheduleId}
            onSubmitRegistration={handleAddRegistration}
            mode={activePage === 'pendaftaran' ? 'form' : 'lookup'}
            onNavigatePage={navigateToPage}
          />
        )}

        {/* =====================================================================
            PROTEKSI AKSES SUPERADMIN: REDIRECT KE FILE TERPISAH login.html / superadmin.html
           ===================================================================== */}
        {activePage === 'superadmin' &&
          (isSuperAdmin ? (
            <SuperAdminPanel
              isOpen={true}
              onNavigateHome={() => navigateToPage('beranda')}
              currentUser={currentUser}
              isSuperAdmin={isSuperAdmin}
              authLoading={authLoading}
              onLoginGoogle={handleLoginGoogle}
              onLogout={handleLogout}
              programs={programs}
              schedules={schedules}
              registrations={activeRegistrations}
              onSaveProgram={handleSaveProgram}
              onSaveSchedule={handleSaveSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onSaveRegistration={handleSaveRegistration}
              onDeleteRegistration={handleDeleteRegistration}
              onSeedDefaults={handleSeedDefaults}
              cpanelConfig={cpanelConfig}
              onSaveCpanelConfig={handleSaveCpanelConfig}
            />
          ) : (
            <section className="py-20 bg-[#FBF9F5]">
              <div className="max-w-[540px] mx-auto px-6">
                <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-mono uppercase tracking-wider text-rose-700 font-semibold">
                      AKSES TERKUNCI · WAJIB LOGIN SUPERADMIN
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 font-display">
                      Halaman Superadmin Tidak Dapat Diakses Tanpa Otentikasi
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Halaman <span className="font-mono font-semibold text-slate-900">superadmin.html</span> berada di file terpisah dan dikunci khusus untuk Superadmin (<span className="font-mono font-semibold text-emerald-900">mazharhajid@gmail.com</span>). Silakan login terlebih dahulu melalui halaman <span className="font-mono font-semibold text-slate-900">login.html</span>.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href="/login.html"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Buka Halaman Login (login.html)</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => navigateToPage('beranda')}
                      className="inline-flex items-center justify-center px-4 py-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Kembali ke Beranda
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ))}
      </main>

      {/* Quiet Institutional Footer with Multi-Page Links */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-800">
            <div className="md:col-span-5 space-y-3">
              <p className="text-lg font-bold text-white font-display">
                Program Pembelajaran Bahasa Arab Tadribul Lughah
              </p>
              <p className="font-arabic text-xl text-emerald-400">
                بَرْنَامَجُ تَدْرِيبِ اللُّغَةِ العَرَبِيَّةِ — النَّحْوُ وَالصَّرْفُ
              </p>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Kurikulum Pembelajaran Bahasa Arab Online Terstruktur: Level 1–3 Ilmu Nahwu dan Level 4 Ilmu Shorof ({formatIDR(primaryProgramTuition)} / Level).
              </p>
            </div>

            <div className="md:col-span-4 space-y-2 text-xs">
              <p className="font-semibold text-white">
                Jadwal Kelas Malam Online (20.00 – 22.00 WIB)
              </p>
              <p>
                Level 1 (Nahwu Dasar):{' '}
                {programs[0]?.scheduleDays || 'Kamis & Jumat'} (
                {programs[0]?.scheduleTime || '20.00 – 22.00 WIB'})
              </p>
              <p>
                Level 2 (Nahwu Menengah):{' '}
                {programs[1]?.scheduleDays || 'Selasa & Rabu'} (
                {programs[1]?.scheduleTime || '20.00 – 22.00 WIB'})
              </p>
              <p>
                Level 3 (Nahwu) & Level 4 (Shorof):{' '}
                {programs[2]?.scheduleDays || 'Sabtu & Ahad'} (
                {programs[2]?.scheduleTime || '20.00 – 22.00 WIB'})
              </p>
              <p className="font-mono text-slate-300 pt-1">
                Email: admisi@tadribullughah.or.id · WhatsApp Admin: 0812-7918-4402
              </p>
            </div>

            <div className="md:col-span-3 space-y-2 text-xs">
              <p className="font-semibold text-white">Daftar Halaman Website</p>
              <ul className="space-y-1.5">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => navigateToPage(item.id)}
                      className={`hover:text-white transition-colors ${
                        activePage === item.id ? 'text-white font-semibold' : ''
                      }`}
                    >
                      Halaman {item.label}
                    </button>
                  </li>
                ))}
                <li className="pt-1">
                  <a
                    href="/pelajar.html"
                    className="inline-flex items-center gap-1.5 font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Halaman Pelajar Terdaftar (pelajar.html)
                  </a>
                </li>
                <li>
                  <a
                    href="/login.html"
                    className="inline-flex items-center gap-1.5 font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Halaman Login Akun (login.html)
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              © {new Date().getFullYear()} Program Tadribul Lughah. Seluruh hak cipta dilindungi undang-undang.
            </p>
            <p>
              Kelas Online Malam (20.00 – 22.00 WIB) · Level 1–3 Ilmu Nahwu & Level 4 Ilmu Shorof
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
