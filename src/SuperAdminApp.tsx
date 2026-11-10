import React, { useState, useEffect, useRef } from 'react';
import {
  PROGRAM_TRACKS,
  CLASS_SCHEDULES,
  INITIAL_REGISTRATIONS,
  ProgramTrack,
  ClassSchedule,
  RegistrationRecord,
  applyRegistrationOpenOverrides,
  saveProgramRegistrationOpenState,
  saveProgramAngkatanState
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
import { ExternalLink, ShieldCheck, Lock } from 'lucide-react';

const STORAGE_KEY = 'tadribul_lughah_registrations_v3';
const CPANEL_CONFIG_KEY = 'tadribul_lughah_cpanel_sql_config_v1';

export default function SuperAdminApp() {
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
  const [hasSessionToken, setHasSessionToken] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem(SUPERADMIN_SESSION_KEY);
      return (
        Boolean(saved) &&
        saved!.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
      );
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
    testFirestoreConnection();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthInitialized(true);
      if (user && isUserSuperAdmin(user)) {
        try {
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
        window.location.replace('./login.html');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [authInitialized, isAuthorizedSuperAdmin]);

  useEffect(() => {
    if (!isAuthorizedSuperAdmin) return;

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
        sessionStorage.setItem(SUPERADMIN_SESSION_KEY, SUPERADMIN_EMAIL);
        setHasSessionToken(true);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem(SUPERADMIN_SESSION_KEY);
    } catch {
      // Ignore
    }
    setHasSessionToken(false);
    await signOut(auth);
    window.location.replace('./login.html');
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
    if (isFirebaseSuperAdmin) {
      const path = `programs/${prog.id}`;
      try {
        await setDoc(doc(db, 'programs', prog.id), programToFirestoreDoc(prog));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
  };

  const handleSaveSchedule = async (sch: ClassSchedule) => {
    setSchedules((prev) => {
      const exists = prev.some((s) => s.id === sch.id);
      const updated = exists
        ? prev.map((s) => (s.id === sch.id ? sch : s))
        : [...prev, sch];
      return updated.sort((a, b) => a.levelNumber - b.levelNumber);
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
    setPublicRegistrations((prev) =>
      prev.map((r) =>
        r.registrationNumber === record.registrationNumber ? record : r
      )
    );
    setPrivateRegistrations((prev) =>
      prev.map((r) =>
        r.registrationNumber === record.registrationNumber ? record : r
      )
    );
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
    setPublicRegistrations((prev) =>
      prev.filter((r) => r.registrationNumber !== registrationNumber)
    );
    setPrivateRegistrations((prev) =>
      prev.filter((r) => r.registrationNumber !== registrationNumber)
    );
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
            PROTEKSI FILE SUPERADMIN.HTML
          </p>
          <h1 className="text-xl font-semibold text-white">
            Akses Terkunci — Khusus Superadmin
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed">
            Halaman <span className="font-mono text-white">superadmin.html</span> tidak dapat diakses secara langsung tanpa login Superadmin terlebih dahulu. Mengarahkan ke halaman <span className="font-mono text-emerald-300">login.html</span>...
          </p>
          <div className="pt-2">
            <a
              href="./login.html"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              Ke Halaman Login (login.html) →
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
      {/* Top Bar Contract for superadmin.html */}
      <header className="sticky top-0 z-30 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-base font-bold tracking-tight font-display whitespace-nowrap">
              Tadribul Lughah · File superadmin.html
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-400">
            <span>TERVERIFIKASI: {SUPERADMIN_EMAIL}</span>
            <span>·</span>
            <span>PROTEKSI AKTIF</span>
          </div>

          <a
            href="./index.html"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <span>Buka Halaman Utama (index.html)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      <main className="flex-1">
        <SuperAdminPanel
          isOpen={true}
          onNavigateHome={() => {
            window.location.href = './index.html';
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
