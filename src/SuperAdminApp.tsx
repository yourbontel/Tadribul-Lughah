import React, { useState, useEffect, useRef } from 'react';
import {
  PROGRAM_TRACKS,
  CLASS_SCHEDULES,
  INITIAL_REGISTRATIONS,
  ProgramTrack,
  ClassSchedule,
  RegistrationRecord,
  applyRegistrationOpenOverrides,
  applyScheduleStartDateOverrides,
  saveProgramRegistrationOpenState,
  saveProgramAngkatanState,
  saveProgramFullState,
  saveScheduleOverride,
  deleteScheduleOverride,
  syncProgramStatesFromServer
} from './data/arabicAcademyData';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { CpanelDbConfig } from './utils/cpanelSqlGenerator';
import { SUPERADMIN_SESSION_KEY } from './LoginApp';
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
  SUPERADMIN_EMAIL,
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
import { BookOpen, ExternalLink, ShieldCheck, Lock, Menu } from 'lucide-react';
import {
  cleanupStudentAccountAfterRegistrationDelete,
  fetchServerRegistrations
} from './utils/studentAccountStore';

const STORAGE_KEY = 'tadribul_lughah_registrations_v3';
const CPANEL_CONFIG_KEY = 'tadribul_lughah_cpanel_sql_config_v1';

export default function SuperAdminApp({
  pageMode = 'panel'
}: {
  pageMode?: 'panel' | 'edit-jadwal';
}) {
  const [programs, setPrograms] = useState<ProgramTrack[]>(() =>
    applyRegistrationOpenOverrides(PROGRAM_TRACKS)
  );
  const [schedules, setSchedules] = useState<ClassSchedule[]>(() =>
    applyScheduleStartDateOverrides(CLASS_SCHEDULES)
  );
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
      // Fallback
    }
    return INITIAL_REGISTRATIONS;
  });
  const [privateRegistrations, setPrivateRegistrations] = useState<
    RegistrationRecord[]
  >([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [isNavHidden, setIsNavHidden] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('tl_superadmin_nav_hidden_v1') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('tl_superadmin_nav_hidden_v1', String(isNavHidden));
    } catch {
      // Ignore storage errors
    }
  }, [isNavHidden]);
  const [hasSessionToken, setHasSessionToken] = useState<boolean>(() => {
    try {
      const saved =
        localStorage.getItem(SUPERADMIN_SESSION_KEY) ||
        sessionStorage.getItem(SUPERADMIN_SESSION_KEY);
      if (
        Boolean(saved) &&
        saved!.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
      ) {
        localStorage.setItem(SUPERADMIN_SESSION_KEY, SUPERADMIN_EMAIL);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });
  const hasAutoSeededRef = useRef<boolean>(false);

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

  const isFirebaseSuperAdmin = isUserSuperAdmin(currentUser);
  const isAuthorizedSuperAdmin = isFirebaseSuperAdmin || hasSessionToken;

  useEffect(() => {
    syncProgramStatesFromServer().catch(() => {});
    fetchServerRegistrations()
      .then((serverRegs) => {
        if (serverRegs.length === 0) return;
        setPublicRegistrations((prev) => {
          const map = new Map<string, RegistrationRecord>();
          for (const item of prev) {
            if (item?.registrationNumber) {
              map.set(item.registrationNumber.toUpperCase(), item);
            }
          }
          for (const srv of serverRegs) {
            const key = srv.registrationNumber.toUpperCase();
            map.set(key, { ...(map.get(key) || {}), ...srv });
          }
          return Array.from(map.values());
        });
      })
      .catch(() => {});
    testFirestoreConnection();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthInitialized(true);
      if (user && isUserSuperAdmin(user)) {
        try {
          localStorage.setItem(SUPERADMIN_SESSION_KEY, SUPERADMIN_EMAIL);
          sessionStorage.setItem(SUPERADMIN_SESSION_KEY, SUPERADMIN_EMAIL);
          setHasSessionToken(true);
        } catch {
          // Ignore
        }
      }
    });
    return () => unsubAuth();
  }, []);

  // Strict Route Protection: Redirect non-superadmin visitors immediately to ./login.html
  useEffect(() => {
    if (!authInitialized) return;
    if (!isAuthorizedSuperAdmin) {
      const timer = setTimeout(() => {
        const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
        const targetFile = pageMode === 'edit-jadwal' ? `edit-jadwal.html${currentSearch}` : '';
        const redirectQuery = targetFile
          ? `?role=superadmin&redirect=${encodeURIComponent(targetFile)}`
          : '?role=superadmin';
        window.location.replace(`./login.html${redirectQuery}`);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [authInitialized, isAuthorizedSuperAdmin, pageMode]);

  useEffect(() => {
    if (!isAuthorizedSuperAdmin) return;

    const unsubPrograms = onSnapshot(
      collection(db, 'programs'),
      (snap) => {
        if (!snap.empty) {
          const loaded = snap.docs
            .map((d) =>
              firestoreDocToProgram(d.data() as Record<string, unknown>, d.id)
            )
            .sort((a, b) => a.levelNumber - b.levelNumber);
          setPrograms(applyRegistrationOpenOverrides(loaded));
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
          setSchedules(applyScheduleStartDateOverrides(loaded));
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
  }, [isAuthorizedSuperAdmin]);

  useEffect(() => {
    if (!isFirebaseSuperAdmin) {
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
  }, [isFirebaseSuperAdmin]);

  const activeRegistrations =
    isFirebaseSuperAdmin && privateRegistrations.length > 0
      ? privateRegistrations
      : publicRegistrations;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(publicRegistrations));
    } catch {
      // Ignore storage quota errors
    }
  }, [publicRegistrations]);

  const handleLoginGoogle = async () => {
    setAuthLoading(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (isUserSuperAdmin(res.user)) {
        localStorage.setItem(SUPERADMIN_SESSION_KEY, SUPERADMIN_EMAIL);
        sessionStorage.setItem(SUPERADMIN_SESSION_KEY, SUPERADMIN_EMAIL);
        setHasSessionToken(true);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem(SUPERADMIN_SESSION_KEY);
      sessionStorage.removeItem(SUPERADMIN_SESSION_KEY);
    } catch {
      // Ignore
    }
    setHasSessionToken(false);
    await signOut(auth);
    window.location.replace('./login.html');
  };

  const handleSaveProgram = async (prog: ProgramTrack) => {
    saveProgramFullState(prog.id, {
      registrationOpen: prog.registrationOpen !== false,
      angkatan: prog.angkatan || 'Angkatan 1',
      startDate: prog.startDate || '19 November 2026'
    });
    setPrograms((prev) =>
      prev
        .map((p) => (p.id === prog.id ? prog : p))
        .sort((a, b) => a.levelNumber - b.levelNumber)
    );
    setSchedules((prev) =>
      prev.map((s) =>
        s.programId === prog.id || s.levelNumber === prog.levelNumber
          ? { ...s, startDate: prog.startDate || s.startDate }
          : s
      )
    );
    await syncToCpanelMySql('program', prog);
    const matchingSchedule = schedules.find(
      (s) => s.programId === prog.id || s.levelNumber === prog.levelNumber
    );
    if (matchingSchedule && prog.startDate) {
      const updatedSch = { ...matchingSchedule, startDate: prog.startDate };
      await syncToCpanelMySql('schedule', updatedSch);
    }
    if (isFirebaseSuperAdmin) {
      const path = `programs/${prog.id}`;
      try {
        await setDoc(doc(db, 'programs', prog.id), programToFirestoreDoc(prog));
        if (matchingSchedule && prog.startDate) {
          const updatedSch = { ...matchingSchedule, startDate: prog.startDate };
          await setDoc(doc(db, 'schedules', updatedSch.id), scheduleToFirestoreDoc(updatedSch));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const handleSaveSchedule = async (sch: ClassSchedule) => {
    saveScheduleOverride(sch);
    setSchedules((prev) => {
      const exists = prev.some((s) => s.id === sch.id);
      const updated = exists
        ? prev.map((s) => (s.id === sch.id ? sch : s))
        : [...prev, sch];
      return applyScheduleStartDateOverrides(updated);
    });
    await syncToCpanelMySql('schedule', sch);
    if (isFirebaseSuperAdmin) {
      const path = `schedules/${sch.id}`;
      try {
        await setDoc(
          doc(db, 'schedules', sch.id),
          scheduleToFirestoreDoc(sch)
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    deleteScheduleOverride(scheduleId);
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    if (isFirebaseSuperAdmin) {
      const path = `schedules/${scheduleId}`;
      try {
        await deleteDoc(doc(db, 'schedules', scheduleId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
  };

  const handleSaveRegistration = async (record: RegistrationRecord) => {
    let updatedPublic: RegistrationRecord[] = [];
    setPublicRegistrations((prev) => {
      const exists = prev.some((r) => r.registrationNumber === record.registrationNumber);
      updatedPublic = exists
        ? prev.map((r) => (r.registrationNumber === record.registrationNumber ? record : r))
        : [record, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPublic));
        window.dispatchEvent(new Event('storage'));
      } catch {
        // Ignore storage errors
      }
      return updatedPublic;
    });

    setPrivateRegistrations((prev) => {
      const exists = prev.some((r) => r.registrationNumber === record.registrationNumber);
      return exists
        ? prev.map((r) => (r.registrationNumber === record.registrationNumber ? record : r))
        : [record, ...prev];
    });

    // Sync to cPanel Server JSON API & MySQL
    try {
      fetch('./api.php?entity=registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      }).catch((e) => console.warn('Sync registration notice:', e));
    } catch {
      // Ignore
    }

    await syncToCpanelMySql('registration', record);

    if (isFirebaseSuperAdmin) {
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
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, privatePath);
      }
    }
  };

  const handleDeleteRegistration = async (registrationNumber: string) => {
    const deletedRecord =
      publicRegistrations.find((r) => r.registrationNumber === registrationNumber) ||
      privateRegistrations.find((r) => r.registrationNumber === registrationNumber);
    const remainingPublic = publicRegistrations.filter((r) => r.registrationNumber !== registrationNumber);
    const remainingPrivate = privateRegistrations.filter((r) => r.registrationNumber !== registrationNumber);
    const remainingAll =
      isFirebaseSuperAdmin && privateRegistrations.length > 0 ? remainingPrivate : remainingPublic;

    // 1. Update React state & localStorage
    setPublicRegistrations((prev) => {
      const updated = prev.filter((r) => r.registrationNumber !== registrationNumber);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        localStorage.setItem('tl_registrations_v1', JSON.stringify(updated));
        window.dispatchEvent(new Event('storage'));
      } catch {}
      return updated;
    });
    setPrivateRegistrations((prev) =>
      prev.filter((r) => r.registrationNumber !== registrationNumber)
    );

    // 2. Remove registration from student account, or delete account completely if no other registrations left
    cleanupStudentAccountAfterRegistrationDelete(
      registrationNumber,
      deletedRecord?.email,
      remainingAll
    );

    // 3. Delete from cPanel registrations.json
    try {
      fetch(`./api.php?entity=registrations&action=delete&key=${encodeURIComponent(registrationNumber)}`, {
        method: 'POST'
      }).catch(() => {});
    } catch {}

    // 4. Delete from Firestore
    if (isFirebaseSuperAdmin) {
      const privatePath = `registrations/${registrationNumber}`;
      try {
        await deleteDoc(doc(db, 'registrations', registrationNumber));
        await deleteDoc(doc(db, 'registrationStatuses', registrationNumber));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, privatePath);
      }
    }
  };

  const handleSeedDefaults = async () => {
    setPrograms(PROGRAM_TRACKS);
    setSchedules(CLASS_SCHEDULES);
    setPublicRegistrations(INITIAL_REGISTRATIONS);
    if (isFirebaseSuperAdmin) {
      try {
        for (const prog of PROGRAM_TRACKS) {
          await setDoc(
            doc(db, 'programs', prog.id),
            programToFirestoreDoc(prog)
          );
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
    }
  };

  // Strict Gate: Never render SuperAdminPanel if not authenticated as Superadmin
  if (!authInitialized || !isAuthorizedSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-xs font-mono text-emerald-400">
            {pageMode === 'edit-jadwal' ? 'PROTEKSI PANEL EDIT JADWAL' : 'PROTEKSI PANEL SUPERADMIN'}
          </p>
          <h1 className="text-xl font-semibold text-white">
            Akses Terkunci — Khusus Superadmin
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Halaman ini tidak dapat diakses tanpa otentikasi Superadmin terlebih dahulu. Mengarahkan Anda ke portal login resmi...
          </p>
          <div className="pt-2">
            <a
              href="./login.html?role=superadmin"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              Ke Portal Login →
            </a>
          </div>
        </div>
      </div>
    );
  }

  const effectiveUser =
    currentUser ||
    ({
      email: SUPERADMIN_EMAIL,
      emailVerified: true
    } as User);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract for superadmin.html / edit-jadwal.html */}
      <header className="sticky top-0 z-30 bg-slate-950 text-white border-b border-slate-800">
        <div
          className={`${
            pageMode === 'edit-jadwal' ? 'max-w-[1200px]' : 'max-w-[1380px]'
          } mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 sm:gap-8`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {pageMode !== 'edit-jadwal' && (
              <button
                type="button"
                onClick={() => setIsNavHidden((prev) => !prev)}
                aria-label={isNavHidden ? 'Tampilkan navigasi superadmin' : 'Sembunyikan navigasi superadmin'}
                aria-pressed={!isNavHidden}
                title={isNavHidden ? 'Tampilkan Navigasi' : 'Sembunyikan Navigasi'}
                className="p-1.5 -ml-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm sm:text-base font-bold tracking-tight font-display truncate">
              {pageMode === 'edit-jadwal'
                ? 'Tadribul Lughah · Edit Jadwal Kelas'
                : 'Tadribul Lughah · Panel Superadmin'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-400 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              SESI SUPERADMIN AKTIF
            </span>
            <span>·</span>
            <span>PROTEKSI TERKUNCI</span>
          </div>

          {pageMode === 'edit-jadwal' ? (
            <a
              href="./superadmin.html?tab=schedules"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <span>← Kembali ke Daftar Jadwal</span>
            </a>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <a
                href="./mutolaah.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-950 bg-amber-300 hover:bg-amber-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Muthola'ah Lv.1</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="./index.html"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span>Lihat Beranda</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">
        <SuperAdminPanel
          isOpen={true}
          pageMode={pageMode}
          isNavHidden={isNavHidden}
          onToggleNavHidden={() => setIsNavHidden((prev) => !prev)}
          onNavigateHome={() => {
            window.location.href =
              pageMode === 'edit-jadwal' ? './superadmin.html?tab=schedules' : './index.html';
          }}
          currentUser={effectiveUser}
          isSuperAdmin={true}
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
      </main>
    </div>
  );
}
