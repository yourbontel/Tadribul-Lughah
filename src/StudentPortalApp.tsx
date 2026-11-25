import React, { useState, useEffect, useRef } from 'react';
import {
  PROGRAM_TRACKS,
  CLASS_SCHEDULES,
  ProgramTrack,
  ClassSchedule,
  RegistrationRecord,
  formatIDR,
  formatWhatsAppNumber,
  applyRegistrationOpenOverrides,
  applyScheduleStartDateOverrides,
  syncProgramStatesFromServer,
  ProgramOnlineMeeting,
  buildProgramMeetings,
  getModulePekanNumber,
  isScheduleRegistrationOpen,
  isProgramHasAnyOpenSchedule,
  getPreferredScheduleForProgram,
  findExistingBatchEnrollment,
  getNextAvailableOpenScheduleForProgram
} from './data/arabicAcademyData';
import {
  StudentAccount,
  getActiveStudentSession,
  clearActiveStudentSession,
  getStudentAccounts,
  saveStudentAccount,
  loadMergedRegistrations,
  getStudentRegistrations,
  enrollStudentInProgram,
  isPekanExamAlreadySubmitted,
  syncQuizScoresFromServer,
  syncStudentAccountsFromServer,
  syncRegistrationsFromServer,
  AttendanceEntry,
  AttendanceStatus,
  getStudentAttendanceRecords,
  saveStudentAttendanceEntry,
  syncAttendanceFromServer,
  isAttendanceSessionUnlocked,
  syncAttendanceUnlockFromServer
} from './utils/studentAccountStore';
import {
  isPekanUnlocked,
  syncPekanUnlockFromServer,
  getWeeklyPekanContent,
  getNormalizedPekanAudioItems,
  syncCustomMateriFromServer
} from './data/moduleContentData';
import { GoogleDriveAudioPlayer } from './components/GoogleDriveAudioPlayer';
import { ScheduleClassSelector } from './components/ScheduleClassSelector';
import {
  EnrollmentConfirmModal,
  PendingEnrollmentConfirmation
} from './components/EnrollmentConfirmModal';
import {
  EnrollmentSuccessInfo,
  EnrollmentSuccessModal
} from './components/EnrollmentSuccessModal';
import { LogoutConfirmModal } from './components/LogoutConfirmModal';
import {
  db,
  auth,
  doc,
  setDoc,
  onSnapshot,
  collection,
  signOut,
  onAuthStateChanged,
  firestoreDocToProgram,
  firestoreDocToSchedule,
  firestoreDocToRegistration,
  registrationToPrivateFirestoreDoc,
  registrationToPublicStatusDoc
} from './firebase';
import {
  BookOpen,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  GraduationCap,
  KeyRound,
  Lock,
  LogOut,
  Printer,
  ShieldAlert,
  UserCheck,
  Video,
  ArrowRight,
  Sparkles,
  X,
  Menu,
  FileText,
  Eye,
  CreditCard,
  Wallet,
  Receipt,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  Headphones
} from 'lucide-react';

type PortalTab = 'dashboard' | 'absensi' | 'modul' | 'pembayaran' | 'akun';

export default function StudentPortalApp() {
  const [activeTab, setActiveTab] = useState<PortalTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'absensi' || tabParam === 'modul' || tabParam === 'pembayaran' || tabParam === 'akun') {
        return tabParam;
      }
    }
    return 'dashboard';
  });
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [programs, setPrograms] = useState<ProgramTrack[]>(() =>
    applyRegistrationOpenOverrides(PROGRAM_TRACKS)
  );
  const [schedules, setSchedules] = useState<ClassSchedule[]>(() =>
    applyScheduleStartDateOverrides(CLASS_SCHEDULES)
  );
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(() =>
    loadMergedRegistrations()
  );

  const [studentAccount, setStudentAccount] = useState<StudentAccount | null>(() => {
    const session = getActiveStudentSession();
    if (!session) return null;
    const accounts = getStudentAccounts();
    return (
      accounts.find(
        (a) =>
          a.registrationNumber.toUpperCase() === session.registrationNumber.toUpperCase() ||
          a.email.toLowerCase() === session.email.toLowerCase()
      ) || null
    );
  });
  const [studentRegistration, setStudentRegistration] =
    useState<RegistrationRecord | null>(() => {
      const session = getActiveStudentSession();
      if (!session) return null;
      const allRegs = loadMergedRegistrations();
      const studentRegs = getStudentRegistrations(
        session.email || session.registrationNumber,
        allRegs
      );
      return studentRegs[0] || null;
    });

  // Password Update Form State
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordBanner, setPasswordBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Level Switch / Upgrade State
  const [upgradeBanner, setUpgradeBanner] = useState<string | null>(null);
  const [upgradeErrorBanner, setUpgradeErrorBanner] = useState<string | null>(null);
  const enrollingRef = useRef<boolean>(false);
  const [pendingLevelId, setPendingLevelId] = useState<string>('tl-level-1');
  const [pendingScheduleId, setPendingScheduleId] = useState<string>('');
  const [pendingLearningGoal, setPendingLearningGoal] = useState<string>('');
  const [pendingEnrollVerify, setPendingEnrollVerify] = useState<
    (PendingEnrollmentConfirmation & { mode: 'direct' | 'additional' }) | null
  >(null);
  const [isConfirmingEnrollModal, setIsConfirmingEnrollModal] = useState<boolean>(false);
  const [enrollmentSuccessModal, setEnrollmentSuccessModal] =
    useState<EnrollmentSuccessInfo | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [activeEnrolledProgramId, setActiveEnrolledProgramId] = useState<string>('');
  const [activeRegistrationNumber, setActiveRegistrationNumber] = useState<string>('');
  const [openedModuleIndex, setOpenedModuleIndex] = useState<number | null>(null);
  const [copiedMeetingLink, setCopiedMeetingLink] = useState<boolean>(false);

  const handleCopyMeetingLink = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedMeetingLink(true);
      setTimeout(() => setCopiedMeetingLink(false), 2500);
    }).catch(() => {});
  };

  const enrolledRegistrations = studentAccount
    ? getStudentRegistrations(studentAccount.email, registrations)
    : studentRegistration
      ? [studentRegistration]
      : [];

  // Set initial activeEnrolledProgramId and activeRegistrationNumber
  useEffect(() => {
    if (!activeRegistrationNumber && enrolledRegistrations.length > 0) {
      setActiveRegistrationNumber(enrolledRegistrations[0].registrationNumber);
      setActiveEnrolledProgramId(enrolledRegistrations[0].selectedProgramId);
    }
  }, [enrolledRegistrations, activeRegistrationNumber]);

  const handleSelectRegistration = (reg: RegistrationRecord) => {
    setActiveRegistrationNumber(reg.registrationNumber);
    setActiveEnrolledProgramId(reg.selectedProgramId);
    setStudentRegistration(reg);
  };

  const [pekanUnlockVersion, setPekanUnlockVersion] = useState<number>(0);
  const [materiVersion, setMateriVersion] = useState<number>(0);
  const [selectedAudioPekan, setSelectedAudioPekan] = useState<number>(1);

  useEffect(() => {
    syncPekanUnlockFromServer().catch(() => {});
    syncCustomMateriFromServer().catch(() => {});
    const handlePekanUnlockUpdated = () => {
      setPekanUnlockVersion((v) => v + 1);
    };
    const handleMateriUpdated = () => {
      setMateriVersion((v) => v + 1);
    };
    window.addEventListener('pekan-unlock-updated', handlePekanUnlockUpdated);
    window.addEventListener('materi-updated', handleMateriUpdated);
    window.addEventListener('storage', handlePekanUnlockUpdated);
    window.addEventListener('storage', handleMateriUpdated);
    return () => {
      window.removeEventListener('pekan-unlock-updated', handlePekanUnlockUpdated);
      window.removeEventListener('materi-updated', handleMateriUpdated);
      window.removeEventListener('storage', handlePekanUnlockUpdated);
      window.removeEventListener('storage', handleMateriUpdated);
    };
  }, []);

  // Attendance State & Sync
  const [attendanceVersion, setAttendanceVersion] = useState<number>(0);
  const [attendanceUnlockVersion, setAttendanceUnlockVersion] = useState<number>(0);
  const [selectedSessionForAbsen, setSelectedSessionForAbsen] = useState<number>(1);
  const [absenStatus, setAbsenStatus] = useState<AttendanceStatus>('hadir');
  const [absenNotes, setAbsenNotes] = useState<string>('');
  const [absenSuccessMsg, setAbsenSuccessMsg] = useState<string | null>(null);
  const [attendanceFilter, setAttendanceFilter] = useState<'semua' | 'hadir' | 'izin-sakit' | 'belum'>('semua');
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState<boolean>(false);
  const [attendanceTargetSession, setAttendanceTargetSession] = useState<number | null>(null);
  const [modalAbsenStatus, setModalAbsenStatus] = useState<AttendanceStatus>('hadir');
  const [modalAbsenNotes, setModalAbsenNotes] = useState<string>('');

  useEffect(() => {
    syncAttendanceFromServer().catch(() => {});
    syncAttendanceUnlockFromServer().catch(() => {});
    const handleAttendanceUpdated = () => {
      setAttendanceVersion((v) => v + 1);
    };
    const handleAttendanceUnlockUpdated = () => {
      setAttendanceUnlockVersion((v) => v + 1);
    };
    window.addEventListener('attendance-updated', handleAttendanceUpdated);
    window.addEventListener('attendance-unlock-updated', handleAttendanceUnlockUpdated);
    window.addEventListener('storage', handleAttendanceUpdated);
    window.addEventListener('storage', handleAttendanceUnlockUpdated);
    return () => {
      window.removeEventListener('attendance-updated', handleAttendanceUpdated);
      window.removeEventListener('attendance-unlock-updated', handleAttendanceUnlockUpdated);
      window.removeEventListener('storage', handleAttendanceUpdated);
      window.removeEventListener('storage', handleAttendanceUnlockUpdated);
    };
  }, []);

  // Sync program open/closed states from cPanel server across all devices
  useEffect(() => {
    const sync = () => {
      syncProgramStatesFromServer().catch(() => {});
    };
    sync();

    const reloadOverrides = () => {
      setPrograms((prev) => applyRegistrationOpenOverrides(prev));
      setSchedules((prev) => applyScheduleStartDateOverrides(prev));
    };

    window.addEventListener('program-open-updated', reloadOverrides);
    window.addEventListener('storage', reloadOverrides);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);

    const interval = setInterval(sync, 6000);

    return () => {
      window.removeEventListener('program-open-updated', reloadOverrides);
      window.removeEventListener('storage', reloadOverrides);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
      clearInterval(interval);
    };
  }, []);

  // Listen to live Firestore programs, schedules, and registrationStatuses
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
      () => {}
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
      () => {}
    );

    const unsubRegs = onSnapshot(
      collection(db, 'registrationStatuses'),
      (snap) => {
        if (!snap.empty) {
          const loaded = snap.docs.map((d) =>
            firestoreDocToRegistration(d.data() as Record<string, unknown>)
          );
          setRegistrations(loadMergedRegistrations(loaded));
        }
      },
      () => {}
    );

    return () => {
      unsubPrograms();
      unsubSchedules();
      unsubRegs();
    };
  }, []);

  // Verify Student Account Session & Registration
  useEffect(() => {
    syncStudentAccountsFromServer().catch(() => {});
    syncRegistrationsFromServer().catch(() => {});

    const session = getActiveStudentSession();
    if (session) {
      syncQuizScoresFromServer(session.email || session.registrationNumber).then(() => {
        const freshAccounts = getStudentAccounts();
        const found = freshAccounts.find(
          (a) =>
            a.registrationNumber.toUpperCase() ===
              session.registrationNumber.toUpperCase() ||
            a.email.toLowerCase() === session.email.toLowerCase()
        );
        if (found) {
          setStudentAccount(found);
        }
      }).catch(() => {});
    }

    const verifyAccess = () => {
      const allRegs = loadMergedRegistrations(registrations);
      const allAccounts = getStudentAccounts();
      const currentSession = getActiveStudentSession();

      if (currentSession) {
        const foundAcc = allAccounts.find(
          (a) =>
            a.registrationNumber.toUpperCase() ===
              currentSession.registrationNumber.toUpperCase() ||
            a.email.toLowerCase() === currentSession.email.toLowerCase() ||
            (a.enrolledRegistrationNumbers &&
              a.enrolledRegistrationNumbers.some(
                (rn) => rn.toUpperCase() === currentSession.registrationNumber.toUpperCase()
              ))
        );
        const foundReg = allRegs.find(
          (r) =>
            r.registrationNumber.toUpperCase() ===
              currentSession.registrationNumber.toUpperCase() ||
            (foundAcc &&
              r.registrationNumber.toUpperCase() ===
                foundAcc.registrationNumber.toUpperCase()) ||
            (foundAcc &&
              r.email &&
              r.email.toLowerCase() === foundAcc.email.toLowerCase())
        );

        const studentRegs = foundAcc ? getStudentRegistrations(foundAcc.email, allRegs) : [];
        const resolvedReg = foundReg || (studentRegs.length > 0 ? studentRegs[0] : null);

        if (foundAcc) {
          setStudentAccount(foundAcc);
          if (resolvedReg) {
            setStudentRegistration({
              ...resolvedReg,
              email: foundAcc.email || resolvedReg.email,
              whatsapp: foundAcc.whatsapp || resolvedReg.whatsapp
            });
          } else {
            setStudentRegistration(null);
          }
          setAuthChecking(false);
          return true;
        } else {
          // Sesi santri sudah tidak berlaku karena akun telah dihapus Superadmin
          clearActiveStudentSession();
          setStudentAccount(null);
          setStudentRegistration(null);
        }
      }
      return false;
    };

    if (verifyAccess()) {
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        const allRegs = loadMergedRegistrations(registrations);
        const allAccounts = getStudentAccounts();
        const emailLower = user.email.toLowerCase();

        const foundAcc = allAccounts.find(
          (a) => a.email.toLowerCase() === emailLower
        );
        const foundReg = allRegs.find(
          (r) =>
            (r.email && r.email.toLowerCase() === emailLower) ||
            (foundAcc &&
              r.registrationNumber.toUpperCase() ===
                foundAcc.registrationNumber.toUpperCase())
        );

        const studentRegs = foundAcc ? getStudentRegistrations(foundAcc.email, allRegs) : [];
        const resolvedReg = foundReg || (studentRegs.length > 0 ? studentRegs[0] : null);

        if (foundAcc) {
          setStudentAccount(foundAcc);
          if (resolvedReg) {
            setStudentRegistration({
              ...resolvedReg,
              email: foundAcc.email
            });
          } else {
            setStudentRegistration(null);
          }
          setAuthChecking(false);
          return;
        }
      }
      setAuthChecking(false);
    });

    return () => unsubAuth();
  }, [registrations]);

  // Automatic redirect to login.html?role=pelajar ONLY if user is not authenticated at all
  useEffect(() => {
    if (!authChecking && !studentAccount) {
      const timer = setTimeout(() => {
        const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
        const redirectParam = currentSearch ? `&redirect=${encodeURIComponent('pelajar.html' + currentSearch)}` : '';
        window.location.replace(`./login.html?role=pelajar${redirectParam}`);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [authChecking, studentAccount]);

  const resolvedCurrentRegForHook =
    (activeRegistrationNumber
      ? enrolledRegistrations.find((r) => r.registrationNumber === activeRegistrationNumber)
      : null) ||
    enrolledRegistrations.find((r) => r.selectedProgramId === activeEnrolledProgramId) ||
    enrolledRegistrations[0] ||
    studentRegistration;

  const resolvedEnrolledProgramIdForHook =
    studentAccount && resolvedCurrentRegForHook
      ? (programs.find((p) => p.id === resolvedCurrentRegForHook.selectedProgramId)?.id ||
          resolvedCurrentRegForHook.selectedProgramId ||
          programs[0]?.id ||
          PROGRAM_TRACKS[0].id)
      : '';

  const openAttendanceModalRef = useRef<(sessionNum: number) => void>(() => {});

  // Auto-switch to attendance tab & open popup modal when URL has ?tab=absensi&session=X from WhatsApp
  useEffect(() => {
    if (typeof window === 'undefined' || !resolvedEnrolledProgramIdForHook) return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const sessParam = parseInt(params.get('session') || params.get('sesi') || '', 10);

    if (tabParam === 'absensi') {
      setActiveTab('absensi');
      if (!isNaN(sessParam) && sessParam > 0) {
        setSelectedSessionForAbsen(sessParam);
        const timer = setTimeout(() => {
          if (isAttendanceSessionUnlocked(resolvedEnrolledProgramIdForHook, sessParam)) {
            openAttendanceModalRef.current(sessParam);
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [resolvedEnrolledProgramIdForHook, attendanceUnlockVersion]);

  const requestLogoutStudent = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutStudent = async () => {
    setIsLoggingOut(true);
    clearActiveStudentSession();
    try {
      await signOut(auth);
    } catch {
      // Ignore
    }
    window.location.replace('./login.html?role=pelajar');
  };

  const handleEnrollLevelDirectly = async (
    programToEnroll: ProgramTrack,
    explicitSchedule?: ClassSchedule,
    customGoal?: string
  ) => {
    if (!studentAccount || enrollingRef.current) return;
    const chosenSchedule =
      (explicitSchedule && isScheduleRegistrationOpen(explicitSchedule, programToEnroll)
        ? explicitSchedule
        : null) || getPreferredScheduleForProgram(programToEnroll, schedules);
    if (!isScheduleRegistrationOpen(chosenSchedule, programToEnroll)) {
      alert(`Mohon maaf, seluruh angkatan pada Level ${programToEnroll.levelNumber} saat ini sedang ditutup (OFF).`);
      return;
    }
    const targetAngkatan = chosenSchedule.angkatan?.trim() || programToEnroll.angkatan || 'Angkatan 1';
    const existingForStudent = getStudentRegistrations(
      studentAccount.email,
      loadMergedRegistrations(registrations)
    );
    const duplicateBatch = findExistingBatchEnrollment(
      existingForStudent,
      programToEnroll.id,
      targetAngkatan,
      schedules,
      programs
    );
    if (duplicateBatch) {
      alert(
        `Anda sudah terdaftar pada ${programToEnroll.title} (${targetAngkatan}) dengan nomor registrasi ${duplicateBatch.registrationNumber}.`
      );
      return;
    }
    enrollingRef.current = true;
    try {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newRegNo = `TL-2026-${randomDigits}`;
    const nowStr = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date()) + ' WIB';

    const newRecord: RegistrationRecord = {
      registrationNumber: newRegNo,
      fullName: studentAccount.fullName,
      gender: studentAccount.gender || 'Laki-laki',
      email: studentAccount.email,
      whatsapp: studentAccount.whatsapp,
      occupation: studentAccount.occupation || 'Pelajar Terdaftar',
      city: studentAccount.city || 'Indonesia',
      selectedProgramId: programToEnroll.id,
      selectedProgramName: `${programToEnroll.title} (${targetAngkatan})`,
      selectedScheduleId: chosenSchedule.id,
      selectedScheduleSummary: `${chosenSchedule.batchCode} · ${chosenSchedule.days} (${chosenSchedule.timeWIB}) · ${targetAngkatan} · Online`,
      learningGoal:
        customGoal?.trim() ||
        `Menguasai kaidah ${programToEnroll.category === 'shorof' ? 'Shorof' : 'Nahwu'} secara sistematis melalui Tadribul Lughah Level ${programToEnroll.levelNumber} (${targetAngkatan}).`,
      totalTuitionIDR: chosenSchedule?.feeIDR || programToEnroll.tuitionIDR,
      registeredAt: nowStr,
      status: 'Terverifikasi — Menunggu Orientasi'
    };

    // Attach program registration to existing student account
    enrollStudentInProgram(studentAccount.email, programToEnroll.id, newRegNo);

    // Save to registrations in localStorage
    const existing = loadMergedRegistrations(registrations);
    const updated = [newRecord, ...existing];
    try {
      localStorage.setItem('tadribul_lughah_registrations_v3', JSON.stringify(updated));
      localStorage.setItem('tl_registrations_v1', JSON.stringify(updated));
    } catch {}

    // Async sync to cPanel server & Firestore
    try {
      fetch('./api.php?entity=registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [newRecord.registrationNumber]: newRecord })
      }).catch(() => {});
    } catch {}

    try {
      await setDoc(
        doc(db, 'registrations', newRecord.registrationNumber),
        registrationToPrivateFirestoreDoc(newRecord)
      );
      await setDoc(
        doc(db, 'registrationStatuses', newRecord.registrationNumber),
        registrationToPublicStatusDoc(newRecord)
      );
    } catch {}

    // Update state to immediately render full portal
    setRegistrations(updated);
    setStudentRegistration(newRecord);
    setActiveRegistrationNumber(newRegNo);
    setActiveEnrolledProgramId(programToEnroll.id);
    setEnrollmentSuccessModal({
      registrationNumber: newRegNo,
      programTitle: programToEnroll.title,
      angkatan: targetAngkatan,
      days: chosenSchedule.days,
      timeWIB: chosenSchedule.timeWIB
    });
    setToastMsg(`Alhamdulillah! Anda telah resmi memilih ${programToEnroll.title}. Silabus materi dan jadwal telah dibuka.`);
    setTimeout(() => setToastMsg(null), 4000);
    } finally {
      enrollingRef.current = false;
    }
  };

  const handleRequestDirectEnrollConfirm = (
    programToEnroll: ProgramTrack,
    explicitSchedule?: ClassSchedule,
    customGoal?: string
  ) => {
    if (!studentAccount) return;
    const chosenSchedule =
      (explicitSchedule && isScheduleRegistrationOpen(explicitSchedule, programToEnroll)
        ? explicitSchedule
        : null) || getPreferredScheduleForProgram(programToEnroll, schedules);
    if (!isScheduleRegistrationOpen(chosenSchedule, programToEnroll)) {
      alert(
        `Mohon maaf, seluruh angkatan pada Level ${programToEnroll.levelNumber} saat ini sedang ditutup (OFF).`
      );
      return;
    }
    const targetAngkatan = chosenSchedule.angkatan?.trim() || programToEnroll.angkatan || 'Angkatan 1';
    const existingForStudent = getStudentRegistrations(
      studentAccount.email,
      loadMergedRegistrations(registrations)
    );
    const duplicateBatch = findExistingBatchEnrollment(
      existingForStudent,
      programToEnroll.id,
      targetAngkatan,
      schedules,
      programs
    );
    if (duplicateBatch) {
      alert(
        `Anda sudah terdaftar pada ${programToEnroll.title} (${targetAngkatan}) dengan nomor registrasi ${duplicateBatch.registrationNumber}.`
      );
      return;
    }
    setPendingEnrollVerify({
      mode: 'direct',
      program: programToEnroll,
      schedule: chosenSchedule,
      angkatan: targetAngkatan,
      learningGoal: customGoal,
      isReEnrollment: false
    });
  };

  const handleRequestAdditionalEnrollConfirm = (
    newProgram: ProgramTrack,
    isReEnrollment?: boolean,
    explicitSchedule?: ClassSchedule | null
  ) => {
    if (!studentAccount) return;
    setUpgradeBanner(null);
    setUpgradeErrorBanner(null);
    const existingForStudent = getStudentRegistrations(
      studentAccount.email,
      loadMergedRegistrations(registrations)
    );
    const matchingSchedule =
      (explicitSchedule && isScheduleRegistrationOpen(explicitSchedule, newProgram)
        ? explicitSchedule
        : null) ||
      (isReEnrollment
        ? getNextAvailableOpenScheduleForProgram(newProgram, schedules, existingForStudent, programs)
        : getPreferredScheduleForProgram(newProgram, schedules));

    if (!matchingSchedule || !isScheduleRegistrationOpen(matchingSchedule, newProgram)) {
      setUpgradeErrorBanner(
        isReEnrollment
          ? `Anda sudah terdaftar pada seluruh angkatan yang sedang dibuka untuk ${newProgram.title} (atau pendaftaran angkatan baru sedang ditutup/OFF).`
          : `Mohon maaf, pendaftaran untuk Level ${newProgram.levelNumber} saat ini sedang ditutup (OFF).`
      );
      return;
    }

    const targetAngkatan = matchingSchedule.angkatan?.trim() || newProgram.angkatan || 'Angkatan 1';
    const duplicateBatch = findExistingBatchEnrollment(
      existingForStudent,
      newProgram.id,
      targetAngkatan,
      schedules,
      programs
    );
    if (duplicateBatch) {
      setUpgradeErrorBanner(
        `Anda sudah terdaftar di ${newProgram.title} (${targetAngkatan}) dengan nomor registrasi ${duplicateBatch.registrationNumber}. Satu akun tidak dapat mendaftar dua kali pada level dan angkatan yang sama.`
      );
      return;
    }

    setPendingEnrollVerify({
      mode: 'additional',
      program: newProgram,
      schedule: matchingSchedule,
      angkatan: targetAngkatan,
      isReEnrollment: Boolean(isReEnrollment)
    });
  };

  const handleExecuteVerifiedEnrollment = async () => {
    if (!pendingEnrollVerify) return;
    setIsConfirmingEnrollModal(true);
    try {
      if (pendingEnrollVerify.mode === 'direct') {
        await handleEnrollLevelDirectly(
          pendingEnrollVerify.program,
          pendingEnrollVerify.schedule,
          pendingEnrollVerify.learningGoal
        );
      } else {
        await handleEnrollAdditionalProgram(
          pendingEnrollVerify.program,
          pendingEnrollVerify.isReEnrollment,
          pendingEnrollVerify.schedule
        );
      }
      setPendingEnrollVerify(null);
    } finally {
      setIsConfirmingEnrollModal(false);
    }
  };

  // 1. Strict Access Lock Screen if user is not logged in with an Account at all
  if (!studentAccount) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-slate-900 px-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-700">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-rose-700 font-semibold">
              AKSES TERKUNCI · WAJIB LOGIN AKUN PELAJAR
            </p>
            <h1 className="text-xl font-bold text-slate-900 font-display">
              Portal Pelajar Khusus Akun Terdaftar
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              {authChecking
                ? 'Memverifikasi akun pelajar terdaftar...'
                : 'Anda belum login menggunakan akun pelajar yang terdaftar. Mengarahkan Anda secara otomatis ke halaman login.html...'}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <a
              href="./login.html?role=pelajar"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span>Login / Aktivasi Akun Pelajar (login.html)</span>
            </a>
            <a
              href="./index.html#/pendaftaran"
              className="w-full inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Belum Memiliki Akun? Buat Akun & Daftar (index.html)
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Account but No Level Selected Yet: Display Level Selection Screen (No Redirect Loop!)
  if (!studentRegistration) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] text-slate-800 flex flex-col font-sans">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="./index.html" className="font-display font-bold text-lg text-emerald-950 tracking-tight">
                Tadribul Lughah
              </a>
              <span className="hidden sm:inline-block text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                PORTAL PELAJAR (pelajar.html)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900">{studentAccount.fullName}</p>
                <p className="text-[11px] font-mono text-slate-500">ID: {studentAccount.registrationNumber}</p>
              </div>
              <button
                type="button"
                onClick={requestLogoutStudent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Welcome Alert */}
          <div className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0 shadow-xs">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase bg-emerald-100 text-emerald-900 rounded-md">
                      AKUN AKTIF TERDAFTAR
                    </span>
                    <span className="text-xs text-slate-500">
                      ID Akun: <span className="font-mono font-semibold text-slate-800">{studentAccount.registrationNumber}</span>
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs text-slate-500">{studentAccount.email}</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                    Ahlan wa Sahlan, {studentAccount.fullName}!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                    Akun Anda telah aktif di sistem Ma'had Tadribul Lughah. Saat ini Anda <strong>belum memilih level pembelajaran</strong>. Silakan tentukan level yang ingin Anda pelajari di bawah ini untuk langsung membuka silabus materi, jadwal halaqah online, materi kitab, dan pencatatan presensi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Program Levels Grid */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Pilih Level Pembelajaran Tersedia
                </h2>
                <p className="text-xs text-slate-500">
                  Satu akun pelajar dapat memilih dan mengikuti hingga 4 level pembelajaran berjenjang secara terstruktur.
                </p>
              </div>
              <a
                href="./index.html#/pendaftaran"
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Buka Formulir Pendaftaran Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {(() => {
              const openPrograms = programs
                .slice(0, 4)
                .filter((prog) => isProgramHasAnyOpenSchedule(prog, schedules));
              if (openPrograms.length === 0) {
                return (
                  <div className="p-6 rounded-xl border border-slate-200 bg-white text-center text-xs sm:text-sm text-slate-600">
                    Saat ini belum ada level pembelajaran yang membuka pendaftaran baru. Silakan cek kembali secara berkala.
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {openPrograms.map((prog) => {
                const progSchedules = schedules.filter((s) => s.programId === prog.id);
                const openProgSchedules = progSchedules.filter((s) =>
                  isScheduleRegistrationOpen(s, prog)
                );
                const isClosed = !isProgramHasAnyOpenSchedule(prog, schedules);
                const isSelectedToEnroll = !isClosed && pendingLevelId === prog.id;

                const defaultSchedule = getPreferredScheduleForProgram(prog, schedules);
                const selectedSchForProg = isSelectedToEnroll
                  ? openProgSchedules.find((s) => s.id === pendingScheduleId)
                  : undefined;
                const displaySchedule = selectedSchForProg || defaultSchedule;
                const displayAngkatan =
                  displaySchedule?.angkatan?.trim() || prog.angkatan || 'Angkatan 1';
                const displayStartDate =
                  displaySchedule?.startDate || prog.startDate || '19 November 2026';
                const displayDays = displaySchedule?.days || prog.scheduleDays;
                const displayTime = displaySchedule?.timeWIB || prog.scheduleTime;

                return (
                  <div
                    key={prog.id}
                    className={`rounded-xl border transition-all flex flex-col justify-between relative ${
                      isSelectedToEnroll
                        ? 'bg-white border-emerald-900 ring-2 ring-emerald-800 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-5 sm:p-6 border-b border-slate-100 space-y-2 rounded-t-xl">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-emerald-800 px-2.5 py-0.5 rounded-md bg-emerald-100">
                          {prog.code} · {displayAngkatan}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {prog.category === 'shorof' ? 'Morfologi Arab' : 'Sintaksis Nahwu'}
                        </span>
                      </div>

                      <div className="pt-1 flex items-baseline justify-between gap-4">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {prog.title}
                        </h3>
                        <span
                          dir="rtl"
                          className="font-arabic text-lg text-slate-600 shrink-0"
                        >
                          {prog.arabicTitle || prog.title}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2">
                        {prog.summary || prog.targetOutcome}
                      </p>
                    </div>

                    {/* Card Body: Schedule & Pricing */}
                    <div className="p-5 sm:p-6 space-y-3 text-xs text-slate-700 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Angkatan Program</span>
                        <span className="font-semibold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-300">
                          {displayAngkatan}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Mulai Program</span>
                        <span className="font-mono font-bold text-emerald-900 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Calendar className="w-3.5 h-3.5 text-emerald-800" />
                          <span>{displayStartDate}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Jadwal Kelas Malam</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {displayDays} ({displayTime})
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Kitab Rujukan</span>
                        <span className="font-medium text-slate-900 text-right">
                          {prog.kitabReference}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                        <span className="font-semibold text-slate-900">Biaya Level</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-900 text-sm">
                            {formatIDR(displaySchedule?.feeIDR || prog.tuitionIDR)}
                          </span>
                          <span className="block text-[11px] font-mono text-slate-500">
                            Cicilan 6x: {formatIDR(Math.round((displaySchedule?.feeIDR || prog.tuitionIDR) / 6))}/bln
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer: Status & Interactive Actions */}
                    <div className="p-5 sm:p-6 bg-white border-t border-slate-100 space-y-3 rounded-b-xl">
                      {isClosed ? (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center gap-2 font-medium">
                          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                          <span>Pendaftaran Level Ini Sedang Ditutup (OFF) oleh Superadmin</span>
                        </div>
                      ) : isSelectedToEnroll ? (
                        <div className="space-y-3 pt-1">
                          <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs flex items-center justify-between">
                            <span className="text-slate-700 font-medium">Angkatan Pembelajaran:</span>
                            <span className="font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                              {displayAngkatan}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor={`portal-sch-select-${prog.id}`}
                              className="block text-xs font-semibold text-slate-800"
                            >
                              Pilih Jadwal Kelas Online (1 Angkatan = 1 Kelas):
                            </label>
                            <ScheduleClassSelector
                              id={`portal-sch-select-${prog.id}`}
                              schedules={openProgSchedules}
                              selectedScheduleId={displaySchedule.id}
                              programAngkatan={prog.angkatan || 'Angkatan 1'}
                              onSelect={(schId) => setPendingScheduleId(schId)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label
                              htmlFor={`portal-goal-${prog.id}`}
                              className="block text-xs font-semibold text-slate-800"
                            >
                              Target Belajar (Opsional):
                            </label>
                            <input
                              id={`portal-goal-${prog.id}`}
                              type="text"
                              value={pendingLearningGoal}
                              onChange={(e) => setPendingLearningGoal(e.target.value)}
                              placeholder="Contoh: Menguasai baca kitab gundul..."
                              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-800"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleRequestDirectEnrollConfirm(prog, displaySchedule, pendingLearningGoal)
                              }
                              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                            >
                              <span>
                                Konfirmasi Pendaftaran Level {prog.levelNumber} – {displayAngkatan} ({formatIDR(displaySchedule?.feeIDR || prog.tuitionIDR)})
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPendingLevelId('');
                                setPendingLearningGoal('');
                              }}
                              className="px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setPendingLevelId(prog.id);
                            setPendingScheduleId(defaultSchedule.id);
                            setPendingLearningGoal('');
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
                        >
                          <span>Pilih &amp; Daftar Level {prog.levelNumber} ({displayAngkatan}) →</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
                </div>
              );
            })()}
          </div>
        </main>

        <EnrollmentConfirmModal
          pending={pendingEnrollVerify}
          studentName={studentAccount.fullName}
          studentEmail={studentAccount.email}
          studentWhatsapp={studentAccount.whatsapp}
          isSubmitting={isConfirmingEnrollModal}
          onCancel={() => setPendingEnrollVerify(null)}
          onConfirm={handleExecuteVerifiedEnrollment}
        />
        <EnrollmentSuccessModal
          success={enrollmentSuccessModal}
          studentName={studentAccount.fullName}
          primaryButtonLabel="Mulai Belajar Sekarang"
          onClose={() => setEnrollmentSuccessModal(null)}
        />
        <LogoutConfirmModal
          isOpen={showLogoutConfirm}
          studentName={studentAccount.fullName}
          isLoading={isLoggingOut}
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogoutStudent}
        />
      </div>
    );
  }

  const currentRegistration =
    (activeRegistrationNumber
      ? enrolledRegistrations.find((r) => r.registrationNumber === activeRegistrationNumber)
      : null) ||
    enrolledRegistrations.find((r) => r.selectedProgramId === activeEnrolledProgramId) ||
    enrolledRegistrations[0] ||
    studentRegistration || {
      registrationNumber: studentAccount.registrationNumber,
      fullName: studentAccount.fullName,
      email: studentAccount.email,
      whatsapp: studentAccount.whatsapp,
      occupation: studentAccount.occupation || 'Pelajar',
      city: studentAccount.city || 'Indonesia',
      selectedProgramId: 'tl-level-1',
      selectedProgramName: 'Tadribul Lughah Level 1 — Nahwu Dasar',
      selectedScheduleId: 'sch-lv1-malam',
      selectedScheduleSummary: 'Kamis & Jumat (20.00 – 22.00 WIB) · Online',
      learningGoal: 'Belajar kaidah bahasa Arab',
      totalTuitionIDR: 510000,
      registeredAt: studentAccount.createdAt,
      status: 'Terverifikasi — Menunggu Orientasi'
    };

  const enrolledProgram =
    programs.find((p) => p.id === currentRegistration.selectedProgramId) ||
    programs.find((p) => p.id === studentRegistration.selectedProgramId) ||
    programs[0] ||
    PROGRAM_TRACKS[0];

  const enrolledSchedule =
    schedules.find((s) => s.id === currentRegistration.selectedScheduleId) ||
    schedules.find(
      (s) =>
        Boolean(currentRegistration.selectedScheduleSummary) &&
        currentRegistration.selectedScheduleSummary.includes(s.batchCode)
    ) ||
    schedules.find((s) => s.programId === enrolledProgram.id) ||
    schedules[0] ||
    CLASS_SCHEDULES[0];

  const matchBatch = currentRegistration.selectedProgramName?.match(/(Angkatan\s*\d+)/i);
  const activeBatchLabel = matchBatch ? matchBatch[1] : (enrolledProgram.angkatan || 'Angkatan 1');
  const isBatchGraduated =
    currentRegistration.status?.toLowerCase().includes('lulus') ||
    (currentRegistration.installmentPaidCount !== undefined &&
      currentRegistration.installmentPaidCount >= 6 &&
      currentRegistration.registrationNumber === 'TL-2026-8452');

  const isModuleDoneForCurrentRegistration = (moduleIdx: number, pekanNum: number): boolean => {
    const regNo = (currentRegistration.registrationNumber || '').toUpperCase();
    const completedKeys = studentAccount?.completedModuleKeys || [];

    // 1. Direct scoped key for this registration (e.g. TL-2026-8453-modul-0)
    if (
      completedKeys.includes(`${regNo}-modul-${moduleIdx}`) ||
      completedKeys.includes(`${regNo}-${enrolledProgram.id}-${moduleIdx}`) ||
      completedKeys.includes(`${regNo}-pekan-${pekanNum}`)
    ) {
      return true;
    }

    // 2. Backward compatibility: if this is the FIRST/primary registration of this program
    const firstRegForProgram = enrolledRegistrations.find(
      (r) => r.selectedProgramId === enrolledProgram.id
    );
    const isFirstRegistration = !firstRegForProgram || firstRegForProgram.registrationNumber.toUpperCase() === regNo;

    if (isFirstRegistration) {
      if (
        completedKeys.includes(`${enrolledProgram.id}-${moduleIdx}`) ||
        completedKeys.includes(`${enrolledProgram.id}-pekan-${pekanNum}`)
      ) {
        return true;
      }
    }

    return false;
  };

  const completedModulesForProgram = enrolledProgram.modules.filter((mod, idx) => {
    const pekanNum = getModulePekanNumber(mod.weekRange, idx);
    const scoreKey = `${enrolledProgram.id}-pekan-${pekanNum}`;
    const examStatus = isPekanExamAlreadySubmitted(
      studentAccount?.email || studentAccount?.registrationNumber || '',
      scoreKey,
      currentRegistration.registrationNumber
    );
    return isModuleDoneForCurrentRegistration(idx, pekanNum) || (examStatus.submitted && (examStatus.score ?? 0) >= 70);
  }).length;
  const totalModulesForProgram = enrolledProgram.modules.length || 4;
  const progressPercentage = Math.round(
    (completedModulesForProgram / totalModulesForProgram) * 100
  );

  // --- Kalkulasi Keuangan & Sisa Cicilan Pendidikan ---
  const totalTuition = currentRegistration.totalTuitionIDR || enrolledProgram.tuitionIDR || 510000;
  const totalInstallmentMonths = 6;
  const monthlyInstallment = Math.round(totalTuition / totalInstallmentMonths); // default Rp 85.000

  // Nominal yang sudah dibayar santri
  const paidTuition = typeof currentRegistration.paidTuitionIDR === 'number'
    ? currentRegistration.paidTuitionIDR
    : 0;

  // Jumlah cicilan yang sudah lunas (0 - 6)
  const paidInstallmentsCount = typeof currentRegistration.installmentPaidCount === 'number'
    ? currentRegistration.installmentPaidCount
    : Math.min(totalInstallmentMonths, Math.floor(paidTuition / (monthlyInstallment || 85000)));

  const basePaidTuition = Math.min(totalTuition, paidInstallmentsCount * monthlyInstallment);
  const extraAmount = Math.max(0, paidTuition - paidInstallmentsCount * monthlyInstallment);
  const remainingInstallmentsCount = Math.max(0, totalInstallmentMonths - paidInstallmentsCount);
  const remainingTuition = remainingInstallmentsCount * monthlyInstallment;
  const isTuitionFullyPaid = paidInstallmentsCount >= totalInstallmentMonths;
  const paymentProgressPercent = Math.min(100, Math.round((paidInstallmentsCount / totalInstallmentMonths) * 100));

  // --- Kalkulasi Pertemuan & Presensi Online Live Zoom ---
  const programMeetings = buildProgramMeetings(enrolledProgram, enrolledSchedule);

  const totalMeetingsCount = programMeetings.length || enrolledProgram.sessionsCount || 22;

  const studentAttendances = getStudentAttendanceRecords(
    (currentRegistration.registrationNumber || '').toUpperCase(),
    enrolledProgram.id
  );

  const attendedCount = programMeetings.filter((m) => {
    const key = `${(currentRegistration.registrationNumber || '').toUpperCase()}_${enrolledProgram.id}_s${m.sessionNumber}`;
    return studentAttendances[key]?.status === 'hadir';
  }).length;

  const excusedCount = programMeetings.filter((m) => {
    const key = `${(currentRegistration.registrationNumber || '').toUpperCase()}_${enrolledProgram.id}_s${m.sessionNumber}`;
    const st = studentAttendances[key]?.status;
    return st === 'izin' || st === 'sakit';
  }).length;

  const sickCount = programMeetings.filter((m) => {
    const key = `${(currentRegistration.registrationNumber || '').toUpperCase()}_${enrolledProgram.id}_s${m.sessionNumber}`;
    return studentAttendances[key]?.status === 'sakit';
  }).length;

  const unattendedCount = Math.max(0, totalMeetingsCount - (attendedCount + excusedCount));

  const attendanceRate = totalMeetingsCount > 0
    ? Math.round((attendedCount / totalMeetingsCount) * 100)
    : 0;

  const isAttendanceQualified = attendanceRate >= 75; // Minimal 75% kehadiran untuk kelulusan

  const handleSelectSessionForAbsen = (sessionNum: number) => {
    setSelectedSessionForAbsen(sessionNum);
    const key = `${(currentRegistration.registrationNumber || '').toUpperCase()}_${enrolledProgram.id}_s${sessionNum}`;
    const existing = studentAttendances[key];
    if (existing) {
      setAbsenStatus(existing.status);
      setAbsenNotes(existing.notes || '');
    } else {
      setAbsenStatus('hadir');
      setAbsenNotes('');
    }
  };

  const handleOpenAttendanceModal = (sessionNum: number) => {
    if (!isAttendanceSessionUnlocked(enrolledProgram.id, sessionNum)) {
      alert(`Mohon maaf, presensi untuk Pertemuan ke-${sessionNum} belum diizinkan / dibuka oleh Superadmin/Pengajar.`);
      return;
    }
    setAttendanceTargetSession(sessionNum);
    setSelectedSessionForAbsen(sessionNum);
    const key = `${(currentRegistration.registrationNumber || '').toUpperCase()}_${enrolledProgram.id}_s${sessionNum}`;
    const existing = studentAttendances[key];
    if (existing) {
      setModalAbsenStatus(existing.status);
      setModalAbsenNotes(existing.notes || '');
    } else {
      setModalAbsenStatus('hadir');
      setModalAbsenNotes('');
    }
    setIsAttendanceModalOpen(true);
  };
  openAttendanceModalRef.current = handleOpenAttendanceModal;

  const handleSaveAttendanceFromModal = () => {
    if (attendanceTargetSession === null) return;
    handleSubmitAttendance(attendanceTargetSession, modalAbsenStatus, modalAbsenNotes);
    setIsAttendanceModalOpen(false);
  };

  const handleSubmitAttendance = (sessionNum: number, status: AttendanceStatus, notes?: string) => {
    if (!isAttendanceSessionUnlocked(enrolledProgram.id, sessionNum)) {
      alert(`Mohon maaf, presensi untuk Pertemuan ke-${sessionNum} belum diizinkan oleh Superadmin.`);
      return;
    }
    const meeting = programMeetings.find((m) => m.sessionNumber === sessionNum);
    const nowStr = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date()) + ' WIB';

    const defaultNote = status === 'hadir'
      ? 'Hadir di kelas Live Zoom'
      : status === 'izin'
        ? (notes?.trim() || 'Izin berhalangan hadir')
        : (notes?.trim() || 'Sakit berhalangan hadir');

    const entry: AttendanceEntry = {
      id: `${(currentRegistration.registrationNumber || '').toUpperCase()}_${enrolledProgram.id}_s${sessionNum}`,
      registrationNumber: (currentRegistration.registrationNumber || '').toUpperCase(),
      studentName: studentRegistration.fullName,
      programId: enrolledProgram.id,
      sessionNumber: sessionNum,
      pekanNumber: meeting?.pekanNumber || sessionNum,
      topicTitle: meeting?.title,
      status,
      notes: notes?.trim() || defaultNote,
      submittedAt: nowStr
    };

    saveStudentAttendanceEntry(entry);
    setAttendanceVersion((v) => v + 1);
    setAbsenSuccessMsg(`Alhamdulillah, presensi Pertemuan ${sessionNum} (${status.toUpperCase()}) berhasil disimpan!`);
    setTimeout(() => setAbsenSuccessMsg(null), 4000);
  };

  const handleDownloadAttendanceReport = () => {
    const regNo = currentRegistration.registrationNumber;
    let report = `========================================================================\n`;
    report += `   MA'HAD AL-BAYAN — TADRIBUL LUGHAH\n`;
    report += `   REKAPITULASI RESMI PRESENSI KEHADIRAN KELAS ONLINE LIVE ZOOM\n`;
    report += `========================================================================\n\n`;
    report += `Identitas Santri:\n`;
    report += `  Nama Lengkap     : ${studentRegistration.fullName}\n`;
    report += `  Nomor Registrasi : ${regNo}\n`;
    report += `  Email / Kontak   : ${studentRegistration.email} / ${studentRegistration.whatsapp}\n`;
    report += `  Program Belajar  : ${enrolledProgram.title}\n`;
    report += `  Jadwal & Angkatan: ${enrolledSchedule.days} (${enrolledSchedule.timeWIB}) · ${activeBatchLabel}\n`;
    report += `  Pengajar         : ${enrolledSchedule.instructor}\n`;
    report += `  Tanggal Cetak    : ${new Date().toLocaleDateString('id-ID')} WIB\n\n`;
    report += `Ringkasan Kehadiran:\n`;
    report += `  Total Pertemuan  : ${totalMeetingsCount} Pertemuan\n`;
    report += `  Jumlah Hadir     : ${attendedCount} Pertemuan\n`;
    report += `  Izin / Sakit     : ${excusedCount} Pertemuan\n`;
    report += `  Persentase Hadir : ${attendanceRate}%\n`;
    report += `  Status Kelulusan : ${isAttendanceQualified ? 'MEMENUHI SYARAT KELULUSAN (MIN. 75%)' : 'BELUM MEMENUHI SYARAT KELULUSAN (MIN. 75%)'}\n\n`;
    report += `------------------------------------------------------------------------\n`;
    report += `RINCIAN KEHADIRAN PER PERTEMUAN:\n`;
    report += `------------------------------------------------------------------------\n`;

    programMeetings.forEach((m) => {
      const key = `${(regNo || '').toUpperCase()}_${enrolledProgram.id}_s${m.sessionNumber}`;
      const rec = studentAttendances[key];
      const statusLabel = rec ? rec.status.toUpperCase() : 'BELUM ABSEN';
      report += `[Pertemuan ${String(m.sessionNumber).padStart(2, '0')}] ${m.dateStr} (${m.timeWIB})\n`;
      report += `  Materi   : ${m.title}\n`;
      report += `  Status   : ${statusLabel}\n`;
      if (rec?.submittedAt) report += `  Dicatat  : ${rec.submittedAt}\n`;
      if (rec?.notes) report += `  Catatan  : ${rec.notes}\n`;
      report += `\n`;
    });

    report += `========================================================================\n`;
    report += `Dicatat secara digital oleh Sistem Presensi Tadribul Lughah Ma'had Al-Bayan.\n`;
    report += `========================================================================\n`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rekap_Presensi_${studentRegistration.fullName.replace(/\s+/g, '_')}_${regNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCopyText = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      showToast(`${label} berhasil disalin ke clipboard!`);
    } catch {
      showToast(`${label}: ${text}`);
    }
  };

  const getConfirmationWaUrl = (amount: number, installmentIndex?: number) => {
    const extraLine =
      extraAmount > 0
        ? `\n- Uang Tambahan / Infak: ${formatIDR(extraAmount)}`
        : '';
    const text = `Bismillah Ustadz / Admin Tadribul Lughah, saya santri terdaftar ingin konfirmasi pembayaran cicilan:\n\n- Nama Lengkap: ${currentRegistration.fullName}\n- Nomor Registrasi: ${currentRegistration.registrationNumber}\n- Program: ${enrolledProgram.title}\n- Keterangan: ${installmentIndex ? `Cicilan ke-${installmentIndex} (Bulan ke-${installmentIndex})` : 'Pembayaran Biaya Belajar'}\n- Nominal Transfer: ${formatIDR(amount)}\n- Total Terbayar Saat Ini: ${formatIDR(paidTuition)} (${paidInstallmentsCount}/${totalInstallmentMonths} Cicilan Lunas)${extraLine}\n- Bank Tujuan: Bank Syariah Indonesia (BSI)\n\nMohon diverifikasi. Syukran wa jazakumullahu khairan.`;
    return `https://wa.me/6281288419023?text=${encodeURIComponent(text)}`;
  };

  const installmentMonthsList = [
    { monthIndex: 1, monthLabel: 'Bulan ke-1 (Pekan 1–4)', note: 'DP / Registrasi Awal Kelas', dueDate: '10 November 2026' },
    { monthIndex: 2, monthLabel: 'Bulan ke-2 (Pekan 5–8)', note: 'Cicilan Pembelajaran Bulan ke-2', dueDate: '10 Desember 2026' },
    { monthIndex: 3, monthLabel: 'Bulan ke-3 (Pekan 9–12)', note: 'Cicilan Pembelajaran Bulan ke-3', dueDate: '10 Januari 2027' },
    { monthIndex: 4, monthLabel: 'Bulan ke-4 (Pekan 13–16)', note: 'Cicilan Pembelajaran Bulan ke-4', dueDate: '10 Februari 2027' },
    { monthIndex: 5, monthLabel: 'Bulan ke-5 (Pekan 17–20)', note: 'Cicilan Pembelajaran Bulan ke-5', dueDate: '10 Maret 2027' },
    { monthIndex: 6, monthLabel: 'Bulan ke-6 (Pekan 21–24)', note: 'Pelunasan Menjelang Ujian & Rapor', dueDate: '10 April 2027' }
  ];

  const getModuleStudyContent = (programId: string, idx: number) => {
    if (programId === 'tl-level-1' || !programId) {
      if (idx === 0) {
        return {
          babTitle: 'Pondasi Ilmu Nahwu & Pembagian Kalam',
          arabicBab: 'مُقَدِّمَةُ بَرْنَامَجِ التَّدْرِيبَات · الكَلِمَةُ وَأَقْسَامُهَا',
          kitabChapter: 'Al-Mabadi\' An-Nahwiyyah — Jilid 1 (Bab 1–3)',
          intro: 'Kalam dalam gramatika bahasa Arab adalah lafadz yang tersusun rapi serta memberikan faedah makna yang sempurna bagi pendengar (مُفِيدٌ بِالْوَضْعِ).',
          lessons: [
            {
              title: 'Pekan 1: Pengenalan Silabus & Hakikat Bahasa Arab',
              desc: 'Tujuan mempelajari Nahwu adalah menjaga lisan dari kesalahan dalam membaca Al-Qur\'an, Hadits, dan kitab-kitab para ulama.'
            },
            {
              title: 'Pekan 2: Pembagian Kata (Isim, Fi\'il, dan Huruf)',
              desc: 'Setiap kata dalam bahasa Arab pasti termasuk dalam salah satu dari tiga kategori: Isim (Kata Benda/Sifat), Fi\'il (Kata Kerja), atau Huruf (Kata Tugas).'
            },
            {
              title: 'Pekan 3: Karakteristik & Tanda-Tanda Isim',
              desc: 'Isim memiliki tanda khas: menerima Kasrah (خَفْضٌ), Tanwin (تَنْوِينٌ), Alif Lam (الأَلِفُ وَاللَّامُ), serta didahului huruf-huruf Jar (حُرُوفُ الجَرِّ).'
            }
          ],
          rules: [
            'Isim (اسم): Kata yang mempunyai makna tersendiri dan tidak terikat dengan waktu lampau, sekarang, atau masa depan (contoh: زَيْدٌ, كِتَابٌ, مَسْجِدٌ).',
            'Fi\'il (فعل): Kata yang menunjukkan terjadinya suatu perbuatan dan terikat dengan dimensi waktu: Madhi (lampau), Mudhari\' (sekarang/akan datang), atau Amr (perintah).',
            'Huruf (حرف): Kata penghubung atau tugas yang tidak memiliki makna mandiri kecuali dirangkaikan dengan isim atau fi\'il (contoh: مِنْ, إِلَى, عَنْ, عَلَى, فِي).'
          ],
          examples: [
            {
              ar: 'جَاءَ زَيْدٌ إِلَى الْمَسْجِدِ',
              tr: 'Zaid telah datang ke masjid (جَاءَ = Fi\'il Madhi, زَيْدٌ = Isim ber-tanwin, إِلَى = Huruf Jar, الْمَسْجِدِ = Isim ber-Alif Lam dan berharokat kasrah).'
            },
            {
              ar: 'كَتَبَ الطَّالِبُ الدَّرْسَ بِالْقَلَمِ',
              tr: 'Pelajar itu telah menulis pelajaran dengan pena.'
            },
            {
              ar: 'قَدْ أَفْلَحَ الْمُؤْمِنُونَ',
              tr: 'Sungguh beruntunglah orang-orang yang beriman (قَدْ = Tanda Fi\'il Madhi أَفْلَحَ).'
            }
          ]
        };
      } else if (idx === 1) {
        return {
          babTitle: 'Pembahasan Isim: Bangunan, Jenis & Tashrif Dasar',
          arabicBab: 'الاسْمُ: بِنْيَتُهُ وَنَوْعُهُ (المُذَكَّرُ وَالمُؤَنَّثُ)',
          kitabChapter: 'Al-Mabadi\' An-Nahwiyyah — Jilid 1 (Bab 4–6)',
          intro: 'Mempelajari klasifikasi isim ditinjau dari susunan huruf akhirnya serta jenis kelamin gramatikal (mudzakkar dan mu\'annats).',
          lessons: [
            {
              title: 'Pekan 4: Isim Shahih, Maqshur, Manqush, dan Mamdud',
              desc: 'Mengenal bentuk huruf akhir isim untuk menentukan kaidah penulisan dan i\'rab di level berikutnya.'
            },
            {
              title: 'Pekan 5: Isim Mudzakkar (Maskulin)',
              desc: 'Kategori kata benda untuk laki-laki, baik manusia, hewan, maupun benda mati yang disepakati secara gramatikal.'
            },
            {
              title: 'Pekan 6: Isim Mu\'annats (Feminin) & Tanda-Tandanya',
              desc: 'Mengenal Ta\' Marbuthah (ـة), Alif Maqshurah (ى), Alif Mamdudah (اء), serta mu\'annats majazi (seperti شَمْسٌ, أَرْضٌ).'
            }
          ],
          rules: [
            'Mudzakkar adalah bentuk asal kata yang tidak memiliki tanda mu\'annats (contoh: مُعَلِّمٌ, بَابٌ, قَلَمٌ).',
            'Mu\'annats Haqiqi menunjukkan perempuan bernyawa (contoh: فَاطِمَةُ, بَقَرَةٌ), sedangkan Mu\'annats Majazi adalah benda yang diberlakukan perempuan oleh orang Arab (contoh: عَيْنٌ, نَفْسٌ).'
          ],
          examples: [
            {
              ar: 'هَذَا كِتَابٌ مُفِيدٌ وَهَذِهِ مَدْرَسَةٌ كَبِيرَةٌ',
              tr: 'Ini adalah kitab yang bermanfaat (Mudzakkar) dan ini adalah sekolah yang besar (Mu\'annats).'
            },
            {
              ar: 'طَلَعَتِ الشَّمْسُ عَلَى الأَرْضِ',
              tr: 'Matahari telah terbit di atas bumi (الشَّمْسُ dan الأَرْضُ mu\'annats majazi).'
            }
          ]
        };
      } else if (idx === 2) {
        return {
          babTitle: 'Isim: Jumlah, Kejelasan & I\'rab Awal',
          arabicBab: 'العَدَدُ وَالتَّعْيِينُ (المُفْرَدُ وَالمُثَنَّى وَالجَمْعُ وَالنَّكِرَةُ وَالمَعْرِفَةُ)',
          kitabChapter: 'Al-Mabadi\' An-Nahwiyyah — Jilid 1 (Bab 7–11)',
          intro: 'Mempelajari pembagian isim dari segi kuantitas bilangan (1, 2, atau jamak) serta status definit (ma\'rifah) dan indefinit (nakirah).',
          lessons: [
            {
              title: 'Pekan 7: Isim Mufrad & Mutsanna (Dua)',
              desc: 'Rumus pembentukan mutsanna dengan menambahkan alif-nun (ـَانِ) atau ya-nun (ـَيْنِ).'
            },
            {
              title: 'Pekan 8: Jamak Mudzakkar Salim, Mu\'annats Salim & Jamak Taksir',
              desc: 'Perubahan bentuk jamak teratur dan jamak yang pecah polanya.'
            },
            {
              title: 'Pekan 9: Isim Nakirah & 6 Macam Isim Ma\'rifah',
              desc: 'Dhamir, Isim Alam, Isim Isyarah, Isim Maushul, Isim ber-Alif Lam, dan Isim Mudhaf.'
            }
          ],
          rules: [
            'Mufrad = 1 (قَلَمٌ), Mutsanna = 2 (قَلَمَانِ), Jamak = 3 atau lebih (أَقْلَامٌ).',
            'Nakirah bersifat umum (رَجُلٌ = seorang lelaki), Ma\'rifah bersifat khusus (الرَّجُلُ = lelaki tersebut).'
          ],
          examples: [
            {
              ar: 'حَضَرَ الْمُعَلِّمَانِ وَالْمُعَلِّمُونَ',
              tr: 'Dua orang guru dan para guru telah hadir.'
            },
            {
              ar: 'قَرَأْتُ كِتَابَ اللهِ فِي الْبَيْتِ',
              tr: 'Saya telah membaca kitab Allah di rumah (كِتَابَ ma\'rifah karena mudhaf kepada lafadz Jalalah).'
            }
          ]
        };
      } else {
        return {
          babTitle: 'Kaidah Fi\'il & Pondasi I\'rab',
          arabicBab: 'الفِعْلُ وَمَبَادِئُ الإِعْرَابِ (المَاضِي وَالمُضَارِعُ وَالأَمْرُ)',
          kitabChapter: 'Al-Mabadi\' An-Nahwiyyah — Jilid 1 (Bab 12–15)',
          intro: 'Memahami perubahan kata kerja (Fi\'il) dan konsep dasar I\'rab sebagai puncak kaidah Nahwu dalam bahasa Arab.',
          lessons: [
            {
              title: 'Pekan 10: Fi\'il Shahih Akhir vs Mu\'tal Akhir',
              desc: 'Kata kerja yang diakhiri huruf shahih atau huruf illah (waw, alif, ya).'
            },
            {
              title: 'Pekan 11: Fi\'il Madhi, Mudhari\', dan Amr',
              desc: 'Mabni dan mu\'rab pada kata kerja dalam kalimat.'
            },
            {
              title: 'Pekan 12: Pengenalan 4 Keadaan I\'rab',
              desc: 'Rafa\' (الرَّفْعُ), Nashab (النَّصْبُ), Khafdh/Jar (الخَفْضُ), dan Jazm (الجَزْمُ).'
            }
          ],
          rules: [
            'Fi\'il Madhi asalnya mabni di atas fathah (كَتَبَ).',
            'Fi\'il Mudhari\' asalnya mu\'rab dan marfu\' dengan dhammah jika tidak didahului amil (يَكْتُبُ).',
            'Fi\'il Amr asalnya mabni di atas sukun (اكْتُبْ).'
          ],
          examples: [
            {
              ar: 'يَكْتُبُ زَيْدٌ رِسَالَةً جَدِيدَةً',
              tr: 'Zaid sedang menulis surat yang baru (يَكْتُبُ = Fi\'il Mudhari\' marfu\').'
            },
            {
              ar: 'لَنْ يَنْجَحَ الْكَسْلَانُ',
              tr: 'Orang yang malas tidak akan berhasil (يَنْجَحَ = Manshub karena didahului لَنْ).'
            }
          ]
        };
      }
    }

    return {
      babTitle: `Silabus Modul ${idx + 1}: ${enrolledProgram.modules[idx]?.topic || 'Materi Inti'}`,
      arabicBab: enrolledProgram.modules[idx]?.arabicTerm || 'دِرَاسَاتٌ نَحْوِيَّةٌ وَصَرْفِيَّةٌ',
      kitabChapter: `${enrolledProgram.kitabReference} (Modul ${idx + 1})`,
      intro: `Modul pekan ${enrolledProgram.modules[idx]?.weekRange || '1–3'} pada program ${enrolledProgram.title}. Target: ${enrolledProgram.modules[idx]?.outcome || 'Menguasai materi'}`,
      lessons: [
        {
          title: `Pertemuan 1: Pengantar Bab ${idx + 1}`,
          desc: 'Penjelasan teori kaidah kitab rujukan dan takhrij kaidah.'
        },
        {
          title: `Pertemuan 2: Bedah Kitab & Qawa\'id`,
          desc: 'Latihan membaca nash kitab gundul dan pengenalan tarakib.'
        },
        {
          title: `Pertemuan 3: Praktik I\'rab / Tashrif Mandiri`,
          desc: 'Tadribat aplikatif dari ayat-ayat Al-Qur\'an dan matan kitab.'
        }
      ],
      rules: [
        'Kaidah dipelajari secara bertahap bersama ustadz pembina pada kelas malam live.',
        'Setiap kaidah dilengkapi dengan contoh i\'rab kalimat lengkap ber-harokat.'
      ],
      examples: [
        {
          ar: 'العِلْمُ يَرْفَعُ بَيْتًا لَا عِمَادَ لَهُ',
          tr: 'Ilmu meninggikan rumah yang tiada bertiang.'
        },
        {
          ar: 'وَالجَهْلُ يَهْدِمُ بَيْتَ العِزِّ وَالشَّرَفِ',
          tr: 'Sedangkan kebodohan meruntuhkan rumah kemuliaan dan kehormatan.'
        }
      ]
    };
  };

  const handleDownloadModuleContent = (mod: {
    weekRange: string;
    topic: string;
    arabicTerm: string;
    outcome: string;
  }) => {
    const details = getModuleStudyContent(enrolledProgram.id, openedModuleIndex ?? 0);
    const content = [
      '==============================================================',
      '      TADRIBUL LUGHAH — DIKTAT & MODUL PEMBELAJARAN           ',
      '==============================================================',
      `Program Level      : ${enrolledProgram.title}`,
      `Kitab Rujukan      : ${enrolledProgram.kitabReference}`,
      `Pekan Pembahasan   : ${mod.weekRange}`,
      `Judul Materi       : ${mod.topic}`,
      `Istilah Arab       : ${mod.arabicTerm}`,
      `Target Capaian     : ${mod.outcome}`,
      `Pelajar Terdaftar  : ${currentRegistration.fullName} (${currentRegistration.registrationNumber})`,
      '--------------------------------------------------------------',
      'RINGKASAN KAIDAH & MATERI PEMBAHASAN:',
      `Pengantar: ${details.intro}`,
      '',
      'Kaidah-Kaidah Utama:',
      ...details.rules.map((r, i) => `  ${i + 1}. ${r}`),
      '',
      'Contoh Kalimat (Al-Amtsilah):',
      ...details.examples.map((ex, i) => `  ${i + 1}. ${ex.ar}\n     Artinya: ${ex.tr}`),
      '==============================================================',
      'Hak Cipta Modul Resmi — Lembaga Tadribul Lughah (pelajar.html)'
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Modul_${mod.weekRange.replace(/\s+/g, '_')}_${enrolledProgram.code}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleToggleModuleComplete = (moduleIndex: number) => {
    if (!studentAccount) return;
    const regNo = (currentRegistration.registrationNumber || '').toUpperCase();
    const primaryKey = `${regNo}-modul-${moduleIndex}`;
    const legacyKey = `${enrolledProgram.id}-${moduleIndex}`;

    const currentCompleted = Array.isArray(studentAccount.completedModuleKeys)
      ? [...studentAccount.completedModuleKeys]
      : [];

    const mod = enrolledProgram.modules[moduleIndex];
    const pekanNum = getModulePekanNumber(mod?.weekRange || '', moduleIndex);
    const isCurrentlyDone = isModuleDoneForCurrentRegistration(moduleIndex, pekanNum);

    const firstRegForProgram = enrolledRegistrations.find(
      (r) => r.selectedProgramId === enrolledProgram.id
    );
    const isFirstRegistration = !firstRegForProgram || firstRegForProgram.registrationNumber.toUpperCase() === regNo;

    let updatedKeys: string[];
    if (isCurrentlyDone) {
      updatedKeys = currentCompleted.filter(
        (k) =>
          k !== primaryKey &&
          k !== `${regNo}-${enrolledProgram.id}-${moduleIndex}` &&
          k !== `${regNo}-pekan-${pekanNum}` &&
          (!isFirstRegistration || (k !== legacyKey && k !== `${enrolledProgram.id}-pekan-${pekanNum}`))
      );
    } else {
      updatedKeys = [...currentCompleted, primaryKey];
    }

    const updatedAccount: StudentAccount = {
      ...studentAccount,
      completedModuleKeys: updatedKeys
    };
    setStudentAccount(updatedAccount);
    saveStudentAccount(updatedAccount);
  };

  const handleEnrollAdditionalProgram = async (
    newProgram: ProgramTrack,
    isReEnrollment?: boolean,
    explicitSchedule?: ClassSchedule | null
  ) => {
    if (!studentAccount || enrollingRef.current) return;
    setUpgradeBanner(null);
    setUpgradeErrorBanner(null);

    const existingForStudent = getStudentRegistrations(
      studentAccount.email,
      loadMergedRegistrations(registrations)
    );
    const matchingSchedule =
      (explicitSchedule && isScheduleRegistrationOpen(explicitSchedule, newProgram)
        ? explicitSchedule
        : null) ||
      (isReEnrollment
        ? getNextAvailableOpenScheduleForProgram(newProgram, schedules, existingForStudent, programs)
        : getPreferredScheduleForProgram(newProgram, schedules));

    if (!matchingSchedule || !isScheduleRegistrationOpen(matchingSchedule, newProgram)) {
      setUpgradeErrorBanner(
        isReEnrollment
          ? `Anda sudah terdaftar pada seluruh angkatan yang sedang dibuka untuk ${newProgram.title} (atau pendaftaran angkatan baru sedang ditutup/OFF).`
          : `Mohon maaf, pendaftaran untuk Level ${newProgram.levelNumber} saat ini sedang ditutup (OFF).`
      );
      return;
    }

    const targetAngkatan = matchingSchedule.angkatan?.trim() || newProgram.angkatan || 'Angkatan 1';
    const duplicateBatch = findExistingBatchEnrollment(
      existingForStudent,
      newProgram.id,
      targetAngkatan,
      schedules,
      programs
    );
    if (duplicateBatch) {
      setUpgradeErrorBanner(
        `Anda sudah terdaftar di ${newProgram.title} (${targetAngkatan}) dengan nomor registrasi ${duplicateBatch.registrationNumber}. Satu akun tidak dapat mendaftar dua kali pada level dan angkatan yang sama.`
      );
      return;
    }

    enrollingRef.current = true;
    try {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newRegNo = `TL-2026-${randomDigits}`;
    const nowStr =
      new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date()) + ' WIB';

    const newReg: RegistrationRecord = {
      registrationNumber: newRegNo,
      fullName: studentAccount.fullName,
      gender: studentAccount.gender || 'Laki-laki',
      email: studentAccount.email,
      whatsapp: studentAccount.whatsapp,
      occupation: studentAccount.occupation || 'Pelajar Terdaftar',
      city: studentAccount.city || 'Indonesia',
      selectedProgramId: newProgram.id,
      selectedProgramName: `${newProgram.title} (${targetAngkatan})`,
      selectedScheduleId: matchingSchedule.id,
      selectedScheduleSummary: `${matchingSchedule.batchCode} · ${matchingSchedule.days} (${matchingSchedule.timeWIB}) · ${targetAngkatan} · Online`,
      learningGoal: isReEnrollment
        ? `Mengulang & memantapkan materi ${newProgram.title} di ${targetAngkatan}.`
        : `Mempelajari ${newProgram.title} (${targetAngkatan}) dengan akun terdaftar.`,
      totalTuitionIDR: matchingSchedule?.feeIDR || newProgram.tuitionIDR,
      registeredAt: nowStr,
      status: 'Terverifikasi — Menunggu Orientasi'
    };

    enrollStudentInProgram(studentAccount.email, newProgram.id, newRegNo);
    const updatedAccounts = getStudentAccounts();
    const freshAcc = updatedAccounts.find(
      (a) => a.email.toLowerCase() === studentAccount.email.toLowerCase()
    );
    if (freshAcc) {
      setStudentAccount(freshAcc);
    }

    try {
      const merged = loadMergedRegistrations(registrations);
      merged.unshift(newReg);
      setRegistrations(merged);
      localStorage.setItem('tadribul_lughah_registrations_v3', JSON.stringify(merged));
      await setDoc(
        doc(db, 'registrations', newReg.registrationNumber),
        registrationToPrivateFirestoreDoc(newReg)
      );
      await setDoc(
        doc(db, 'registrationStatuses', newReg.registrationNumber),
        registrationToPublicStatusDoc(newReg)
      );
      await fetch('./api.php?entity=registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [newReg.registrationNumber]: newReg })
      }).catch(() => {});
    } catch {
      // Ignored
    }

    setActiveRegistrationNumber(newRegNo);
    setActiveEnrolledProgramId(newProgram.id);
    setStudentRegistration(newReg);
    setEnrollmentSuccessModal({
      registrationNumber: newRegNo,
      programTitle: newProgram.title,
      angkatan: targetAngkatan,
      days: matchingSchedule.days,
      timeWIB: matchingSchedule.timeWIB,
      isReEnrollment: Boolean(isReEnrollment)
    });
    setUpgradeBanner(
      isReEnrollment
        ? `Alhamdulillah! Pendaftaran ulang ${newProgram.title} (${targetAngkatan}) berhasil ditambahkan ke akun Anda! Nomor Registrasi baru: ${newRegNo}. Seluruh riwayat dan kelulusan angkatan sebelumnya tetap aman tersimpan di akun Anda.`
        : `Pendaftaran ${newProgram.title} (${targetAngkatan}) berhasil ditambahkan ke akun Anda! Nomor Registrasi: ${newRegNo}.`
    );
    } finally {
      enrollingRef.current = false;
    }
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordBanner(null);

    if (newPassword.trim().length < 6) {
      setPasswordBanner({
        type: 'error',
        text: 'Kata sandi baru minimal harus terdiri dari 6 karakter.'
      });
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordBanner({
        type: 'error',
        text: 'Konfirmasi kata sandi tidak cocok.'
      });
      return;
    }

    const updatedAcc: StudentAccount = {
      ...studentAccount,
      password: newPassword.trim()
    };
    setStudentAccount(updatedAcc);
    saveStudentAccount(updatedAcc);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordBanner({
      type: 'success',
      text: 'Kata sandi akun pelajar Anda berhasil diperbarui.'
    });
  };

  const handleDownloadStudentCard = () => {
    const content = [
      '==============================================================',
      '     KARTU TANDA PELAJAR TERDAFTAR — TADRIBUL LUGHAH          ',
      '==============================================================',
      `Nomor Registrasi   : ${studentRegistration.registrationNumber}`,
      `Nama Lengkap       : ${studentRegistration.fullName}`,
      `Email Akun Pelajar : ${studentAccount.email}`,
      `Nomor WhatsApp     : ${studentAccount.whatsapp}`,
      `Domisili           : ${studentRegistration.city}`,
      `Status Pembayaran : ${isTuitionFullyPaid ? 'Lunas Penuh (6/6)' : paidInstallmentsCount > 0 ? `Cicilan ${paidInstallmentsCount}/6 Lunas` : 'Belum Lunas (Bulan 1)'}`,
      '--------------------------------------------------------------',
      'KELAS MALAM ONLINE YANG DIIKUTI (20.00 – 22.00 WIB):',
      `Level Program      : ${enrolledProgram.title}`,
      `Hari & Jam Belajar : ${enrolledSchedule.days} (${enrolledSchedule.timeWIB})`,
      `Kode Kelas Online  : ${enrolledSchedule.batchCode} — ${enrolledSchedule.modeLabel}`,
      `Pengajar Pengampu  : ${enrolledSchedule.instructor}`,
      `Kitab Rujukan      : ${enrolledProgram.kitabReference}`,
      `Biaya Pendidikan   : ${formatIDR(enrolledProgram.tuitionIDR)} / Level (Cicilan 6x ${formatIDR(Math.round(enrolledProgram.tuitionIDR / 6))}/bln)`,
      `Progres Modul      : ${completedModulesForProgram} dari ${totalModulesForProgram} Modul (${progressPercentage}%)`,
      '==============================================================',
      'Akun Pelajar Resmi — Portal Akademik Tadribul Lughah (pelajar.html)'
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Kartu_Pelajar_${studentRegistration.registrationNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2.5 border border-slate-700 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Brand Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Buka atau tutup menu navigasi"
            >
              {mobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <a
              href="./pelajar.html"
              className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap"
            >
              Tadribul Lughah
            </a>
            <span className="hidden sm:inline-block text-xs font-mono text-emerald-800 border-l border-slate-200 pl-3">
              PORTAL PELAJAR (pelajar.html)
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <a
              href="./index.html"
              className="font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap"
            >
              ← Ke Halaman Publik (index.html)
            </a>
          </div>
        </div>
      </header>

      {/* Mobile Quick Tabs Strip */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            type="button"
            onClick={() => {
              setActiveTab('dashboard');
              setMobileNavOpen(false);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-emerald-900 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            Kelas Malam & Zoom
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('absensi');
              setMobileNavOpen(false);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'absensi'
                ? 'bg-emerald-900 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Absensi {attendedCount}/{totalMeetingsCount}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('modul');
              setMobileNavOpen(false);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              activeTab === 'modul'
                ? 'bg-emerald-900 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            Modul ({completedModulesForProgram}/{totalModulesForProgram})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('pembayaran');
              setMobileNavOpen(false);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'pembayaran'
                ? 'bg-emerald-900 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cicilan</span>
            {!isTuitionFullyPaid && (
              <span className={`px-1.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'pembayaran' ? 'bg-amber-400 text-slate-950' : 'bg-amber-200 text-amber-950'
              }`}>
                {remainingInstallmentsCount}x
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('akun');
              setMobileNavOpen(false);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
              activeTab === 'akun'
                ? 'bg-emerald-900 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            Kartu & Akun
          </button>
        </div>
      </div>

      {/* Portal Layout: Left Sidebar Navigation + Main Content */}
      <div className="flex-1 max-w-[1380px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Sidebar Navigation */}
        <aside
          className={`w-full md:w-72 shrink-0 md:sticky md:top-24 ${
            mobileNavOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            {/* Student Account Summary */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white space-y-2 border-b border-emerald-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-800/80 text-emerald-200 border border-emerald-600/40">
                  Pelajar Terdaftar
                </span>
                <span className="text-[11px] font-mono font-semibold text-emerald-300">
                  {studentRegistration.registrationNumber}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-snug">
                  {studentRegistration.fullName}
                </p>
                <p className="text-[11px] font-mono text-emerald-200/90 truncate">
                  {studentAccount.email}
                </p>
              </div>
            </div>

            {/* Vertical Navigation Links */}
            <nav
              aria-label="Navigasi Portal Pelajar"
              className="p-2.5 space-y-1 text-xs font-medium"
            >
              <button
                type="button"
                onClick={() => {
                  setActiveTab('dashboard');
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-900 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Video className={`w-4 h-4 shrink-0 ${activeTab === 'dashboard' ? 'text-emerald-300' : 'text-emerald-800'}`} />
                  <span>Kelas Malam & Zoom</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('absensi');
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                  activeTab === 'absensi'
                    ? 'bg-emerald-900 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CalendarCheck className={`w-4 h-4 shrink-0 ${activeTab === 'absensi' ? 'text-emerald-300' : 'text-emerald-800'}`} />
                  <span>Absensi Online</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'absensi'
                      ? 'bg-emerald-800 text-emerald-100 border border-emerald-600'
                      : isAttendanceQualified
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {attendedCount}/{totalMeetingsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('modul');
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                  activeTab === 'modul'
                    ? 'bg-emerald-900 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'modul' ? 'text-emerald-300' : 'text-emerald-800'}`} />
                  <span>Progres Modul</span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'modul'
                      ? 'bg-emerald-800 text-emerald-100 border border-emerald-600'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {completedModulesForProgram}/{totalModulesForProgram}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('pembayaran');
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                  activeTab === 'pembayaran'
                    ? 'bg-emerald-900 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CreditCard className={`w-4 h-4 shrink-0 ${activeTab === 'pembayaran' ? 'text-emerald-300' : 'text-emerald-800'}`} />
                  <span>Biaya & Sisa Cicilan</span>
                </span>
                {!isTuitionFullyPaid && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      activeTab === 'pembayaran'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {remainingInstallmentsCount}x
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('akun');
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                  activeTab === 'akun'
                    ? 'bg-emerald-900 text-white font-semibold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <UserCheck className={`w-4 h-4 shrink-0 ${activeTab === 'akun' ? 'text-emerald-300' : 'text-emerald-800'}`} />
                  <span>Kartu & Akun Pelajar</span>
                </span>
              </button>
            </nav>

            {/* Sidebar Bottom Logout */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
              <button
                type="button"
                onClick={requestLogoutStudent}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Student Portal Content */}
        <main className="flex-1 min-w-0 w-full">
          <div className="space-y-8">
          {/* Multi-Program Level & Batch Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono mr-1">
                Riwayat & Kelas Terdaftar ({enrolledRegistrations.length}):
              </span>
              {enrolledRegistrations.map((reg) => {
                const prog = programs.find((p) => p.id === reg.selectedProgramId) || programs[0];
                const isActive = reg.registrationNumber === currentRegistration.registrationNumber;
                const isPaidFull = reg.installmentPaidCount && reg.installmentPaidCount >= 6;
                const matchBatch = reg.selectedProgramName?.match(/(Angkatan\s*\d+)/i);
                const batchLabel = matchBatch ? matchBatch[1] : (prog.angkatan || 'Angkatan 1');
                return (
                  <button
                    key={reg.registrationNumber}
                    type="button"
                    onClick={() => handleSelectRegistration(reg)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-emerald-900 text-white shadow-xs ring-2 ring-emerald-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span>{prog.code}</span>
                    {batchLabel && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {batchLabel}
                      </span>
                    )}
                    <span className="font-mono text-[11px] opacity-90">
                      ({reg.registrationNumber})
                    </span>
                    {isPaidFull ? (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        Lunas ✓
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                        {reg.installmentPaidCount || 0}/6
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('modul')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 hover:text-emerald-800 transition-colors shrink-0"
            >
              <span>+ Daftar / Ambil Level Lainnya (1 Akun untuk 4 Program)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Student Hero Summary Banner */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-xl p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-emerald-400">
                  <span>AKUN PELAJAR TERVERIFIKASI</span>
                  <span>·</span>
                  <span>NO. REG: {currentRegistration.registrationNumber}</span>
                  <span>·</span>
                  <span>
                    {isTuitionFullyPaid
                      ? 'LUNAS PENUH (6/6)'
                      : paidInstallmentsCount > 0
                        ? `CICILAN ${paidInstallmentsCount}/6 LUNAS`
                        : 'BELUM LUNAS (BULAN 1)'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
                  Ahlan wa Sahlan, {currentRegistration.fullName}
                </h1>
                <p className="font-arabic text-xl text-emerald-300" dir="rtl">
                  {enrolledProgram.arabicTitle}
                </p>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  Anda terdaftar aktif pada{' '}
                  <strong className="text-white">{enrolledProgram.title}</strong>.
                  Seluruh sesi dilaksanakan secara{' '}
                  <strong className="text-emerald-300">
                    Online Malam Hari pukul {enrolledSchedule.timeWIB}
                  </strong>{' '}
                  setiap hari{' '}
                  <strong className="text-emerald-300">
                    {enrolledSchedule.days}
                  </strong>
                  .
                </p>
              </div>

              <div className="lg:col-span-4 bg-slate-800/90 border border-slate-700 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">
                    Capaian Modul Level {enrolledProgram.levelNumber}
                  </span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {progressPercentage}% ({completedModulesForProgram}/
                    {totalModulesForProgram} Modul)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 border-t border-slate-700">
                  <span>Jadwal Malam:</span>
                  <span className="font-mono text-white font-semibold">
                    {enrolledSchedule.days} · {enrolledSchedule.timeWIB}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================================
              TAB 1: DASHBOARD KELAS MALAM & RUANG ZOOM
             ===================================================================== */}
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left 8 Cols: Active Class Details & Zoom Access */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-semibold">
                        JADWAL KELAS MALAM AKTIF · {enrolledSchedule.batchCode}
                      </p>
                      <h2 className="text-xl font-bold text-slate-900 mt-1">
                        {enrolledProgram.title}
                      </h2>
                    </div>
                    <span className="text-xs font-mono font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md whitespace-nowrap">
                      {enrolledSchedule.days} · {enrolledSchedule.timeWIB}
                    </span>
                  </div>

                  {/* 4 Key Academic Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-[#FBF9F5] border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          Hari & Jam Kelas Malam
                        </p>
                        <span className="text-[11px] font-mono font-semibold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                          Mulai: {enrolledProgram.startDate || enrolledSchedule.startDate || '19 November 2026'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 font-mono">
                        {enrolledSchedule.days} ({enrolledSchedule.timeWIB})
                      </p>
                      <p className="text-xs text-emerald-800 font-medium">
                        Khusus Kelas Malam (8 Malam – 10 Malam)
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-[#FBF9F5] border border-slate-200 space-y-1">
                      <p className="text-xs text-slate-500">
                        Pengajar Pengampu
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {enrolledSchedule.instructor}
                      </p>
                      <p className="text-xs text-slate-600">
                        {enrolledSchedule.modeLabel}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-[#FBF9F5] border border-slate-200 space-y-1">
                      <p className="text-xs text-slate-500">
                        Kitab & Modul Pegangan
                      </p>
                      <p className="text-sm font-bold text-slate-900">
                        {enrolledProgram.kitabReference}
                      </p>
                      <p className="text-xs text-slate-600">
                        {enrolledProgram.durationWeeks} Pekan ({programMeetings.length || enrolledProgram.sessionsCount} Pertemuan)
                      </p>
                    </div>

                    <div
                      className="p-4 rounded-lg bg-[#FBF9F5] border border-slate-200 space-y-1 cursor-pointer hover:border-emerald-700 transition-colors"
                      onClick={() => setActiveTab('pembayaran')}
                      title="Klik untuk membuka rincian pembayaran & cicilan"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">
                          Biaya & Sisa Cicilan Level {enrolledProgram.levelNumber}
                        </p>
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isTuitionFullyPaid ? 'bg-emerald-100 text-emerald-950' : 'bg-amber-100 text-amber-950'
                        }`}>
                          {isTuitionFullyPaid ? '✓ Lunas' : `${paidInstallmentsCount}/6 Bulan`}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-emerald-900 font-mono tabular-nums">
                        {isTuitionFullyPaid ? `${formatIDR(totalTuition)} (Lunas)` : `Sisa: ${formatIDR(remainingTuition)}`}
                      </p>
                      <p className="text-xs font-mono text-slate-700 flex items-center justify-between">
                        <span>{isTuitionFullyPaid ? 'Tuntas 100%' : `Sisa ${remainingInstallmentsCount}x (@ ${formatIDR(monthlyInstallment)}/bln)`}</span>
                        <span className="text-emerald-800 font-semibold underline text-[11px]">Rincian →</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Biaya & Sisa Cicilan Quick Banner */}
                  <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-950 to-slate-900 text-white space-y-4 shadow-sm border border-emerald-900/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
                          <CreditCard className="w-4 h-4 text-emerald-300" />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                            INFORMASI BIAYA & STATUS CICILAN BELAJAR
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-white">
                            {enrolledProgram.title}
                          </h4>
                        </div>
                      </div>

                      <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
                        isTuitionFullyPaid
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {isTuitionFullyPaid ? '✓ BIAYA LUNAS 100%' : `CICILAN BERJALAN (${paidInstallmentsCount} DARI 6 LUNAS)`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                      <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-1">
                        <span className="text-slate-400 text-[11px] block">Total Biaya Pendidikan:</span>
                        <p className="font-mono font-bold text-white text-base">{formatIDR(totalTuition)}</p>
                        <p className="text-[11px] text-slate-400">Skema cicilan 6x @ {formatIDR(monthlyInstallment)}/bln</p>
                      </div>

                      <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-1">
                        <span className="text-slate-400 text-[11px] block">Jumlah Sudah Dibayar:</span>
                        <p className="font-mono font-bold text-emerald-400 text-base">{formatIDR(paidTuition)}</p>
                        <p className="text-[11px] text-emerald-300/90 font-medium">
                          {paidInstallmentsCount} dari 6 Cicilan Bulanan
                        </p>
                        {extraAmount > 0 && (
                          <p className="text-[10px] text-sky-300 font-semibold">
                            + Uang Tambahan: {formatIDR(extraAmount)}
                          </p>
                        )}
                      </div>

                      <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-1">
                        <span className="text-slate-400 text-[11px] block">Sisa Cicilan Belum Dibayar:</span>
                        <p className={`font-mono font-extrabold text-base ${isTuitionFullyPaid ? 'text-emerald-300' : 'text-amber-400'}`}>
                          {isTuitionFullyPaid ? 'Rp 0 (Tuntas)' : formatIDR(remainingTuition)}
                        </p>
                        <p className="text-[11px] text-amber-200/90">
                          {isTuitionFullyPaid ? 'Bebas tanggungan administrasi' : `Tersisa ${remainingInstallmentsCount} kali cicilan lagi`}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar Pelunasan */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Progres Pelunasan Biaya Belajar ({paymentProgressPercent}%):</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {formatIDR(basePaidTuition)} / {formatIDR(totalTuition)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-300"
                          style={{ width: `${paymentProgressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-emerald-900/60">
                      <p className="text-[11px] text-slate-300">
                        {!isTuitionFullyPaid
                          ? `Jatuh tempo berikutnya: Cicilan ke-${paidInstallmentsCount + 1} sebesar ${formatIDR(monthlyInstallment)}`
                          : 'Alhamdulillah, seluruh pembayaran program telah selesai diverifikasi.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('pembayaran')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Buka Rincian Tagihan & Rekening Pembayaran →</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Google Meet / Zoom Classroom Access Box — KHUSUS PESERTA RESMI */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white space-y-5 border border-emerald-800/80 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-inner">
                          <Video className="w-5 h-5 text-emerald-300 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                              RUANG KELAS TATAP MUKA ONLINE · LIVE INTERAKTIF
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-900/90 text-emerald-200 border border-emerald-700">
                              {enrolledSchedule.meetingPlatform || 'Google Meet'}
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                            Tautan Kelas Malam {enrolledProgram.title}
                          </h3>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Privat Khusus Peserta Terdaftar</span>
                      </span>
                    </div>

                    {/* Instruksi Jadwal & Format Nama */}
                    <p className="text-xs text-emerald-100/90 leading-relaxed">
                      Ruang kelas tatap muka online dibuka <strong>15 menit sebelum perkuliahan dimulai</strong> (pukul <span className="font-mono font-semibold text-white">19.45 WIB</span>) setiap hari <strong className="text-white">{enrolledSchedule.days}</strong> ({enrolledSchedule.timeWIB}). Mohon gunakan format nama akun Zoom/Meet: <span className="font-mono px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700">{studentRegistration.registrationNumber} - {studentAccount?.fullName || studentRegistration.fullName}</span>.
                    </p>

                    {/* Area Tautan Google Meet / Zoom */}
                    {enrolledSchedule.meetingLink && enrolledSchedule.meetingLink.trim() ? (
                      <div className="space-y-3.5 bg-white/5 p-4 sm:p-5 rounded-xl border border-emerald-500/30">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0">
                            <span className="text-[11px] font-mono text-emerald-300 uppercase tracking-wider block font-semibold">
                              Tautan Resmi {enrolledSchedule.meetingPlatform || 'Google Meet'}:
                            </span>
                            <a
                              href={enrolledSchedule.meetingLink.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs sm:text-sm text-emerald-200 hover:text-white underline truncate block mt-0.5"
                              title={enrolledSchedule.meetingLink.trim()}
                            >
                              {enrolledSchedule.meetingLink.trim()}
                            </a>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopyMeetingLink(enrolledSchedule.meetingLink!.trim())}
                              className="px-3 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Salin tautan ke clipboard"
                            >
                              {copiedMeetingLink ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-300 font-bold">Tersalin ✓</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Salin Link</span>
                                </>
                              )}
                            </button>

                            <a
                              href={enrolledSchedule.meetingLink.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap"
                            >
                              <Video className="w-4 h-4 text-slate-950" />
                              <span>Masuk Ruang Kelas Sekarang</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Catatan Tambahan Pengajar / Meeting Passcode jika ada */}
                        {enrolledSchedule.meetingNotes && enrolledSchedule.meetingNotes.trim() && (
                          <div className="pt-3 border-t border-white/10 flex items-start gap-2 text-xs text-amber-200 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                            <span className="font-bold text-amber-300 shrink-0">📌 Catatan / Passcode:</span>
                            <span className="leading-relaxed">{enrolledSchedule.meetingNotes.trim()}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Jika Link Belum Diisi oleh Superadmin */
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-start gap-3 text-xs">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30">
                          <Clock className="w-4 h-4 text-amber-300" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-white">
                            Tautan {enrolledSchedule.meetingPlatform || 'Google Meet / Zoom'} Sedang Disiapkan
                          </p>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            Admin / Pengajar sedang menyiapkan ruang tatap muka online untuk jadwal ini. Tautan resmi akan tampil otomatis di kartu ini menjelang kelas perdana dimulai ({enrolledSchedule.days}, pukul {enrolledSchedule.timeWIB}).
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tombol Aksi Tambahan */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-emerald-900/60">
                      <p className="text-[11px] text-slate-400">
                        Kendala akses ruang kelas? Hubungi Admin Ma'had via WhatsApp untuk bantuan teknis.
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveTab('absensi')}
                          className="px-3.5 py-2 text-xs font-semibold text-emerald-200 bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-700/60 rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span>Presensi Online ({attendedCount}/{totalMeetingsCount})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('modul')}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-900/80 hover:bg-emerald-900 border border-emerald-700/60 rounded-lg transition-colors"
                        >
                          Modul & Silabus →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Presensi Live Zoom Kelas Malam */}
                  <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                          <CalendarCheck className="w-4 h-4 text-emerald-800" />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                            PRESENSI PERTEMUAN ONLINE LIVE ZOOM
                          </span>
                          <h4 className="text-sm sm:text-base font-bold text-slate-900">
                            Kehadiran Kelas Santri · Syarat Kelulusan Min. 75%
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${
                          isAttendanceQualified
                            ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                            : 'bg-amber-100 text-amber-950 border border-amber-300'
                        }`}>
                          {isAttendanceQualified ? '✓ MEMENUHI SYARAT KELULUSAN' : `KEHADIRAN: ${attendanceRate}% (MIN. 75%)`}
                        </span>
                      </div>
                    </div>

                    {/* Grid Stats Kehadiran Ringkas */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-[#FBF9F5] p-3 rounded-lg border border-slate-200 space-y-0.5">
                        <span className="text-slate-500 text-[11px] block">Total Pertemuan:</span>
                        <p className="font-mono font-bold text-slate-900 text-base">{totalMeetingsCount} Sesi</p>
                        <p className="text-[10px] text-slate-500">{enrolledProgram.durationWeeks} Pekan Belajar</p>
                      </div>
                      <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 space-y-0.5">
                        <span className="text-emerald-800 text-[11px] block font-medium">Hadir (حاضر):</span>
                        <p className="font-mono font-bold text-emerald-950 text-base">{attendedCount} Kali</p>
                        <p className="text-[10px] text-emerald-800">Tercatat di sistem</p>
                      </div>
                      <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 space-y-0.5">
                        <span className="text-amber-800 text-[11px] block font-medium">Izin / Sakit:</span>
                        <p className="font-mono font-bold text-amber-950 text-base">{excusedCount} Kali</p>
                        <p className="text-[10px] text-amber-800">Dengan udzur</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-0.5">
                        <span className="text-slate-500 text-[11px] block">Persentase Hadir:</span>
                        <p className={`font-mono font-bold text-base ${isAttendanceQualified ? 'text-emerald-900' : 'text-amber-800'}`}>
                          {attendanceRate}%
                        </p>
                        <p className="text-[10px] text-slate-500">Standar lulus 75%</p>
                      </div>
                    </div>

                    {/* Progress Bar Kehadiran dengan Garis KKM 75% */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>Capaian Kehadiran Santri ({attendanceRate}%):</span>
                        <span className="font-mono font-semibold text-slate-900">
                          {attendedCount} / {totalMeetingsCount} Pertemuan
                        </span>
                      </div>
                      <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isAttendanceQualified ? 'bg-emerald-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                          style={{ left: '75%' }}
                          title="Batas Minimal Kelulusan: 75%"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>0%</span>
                        <span className="text-rose-600 font-bold">Target Minimal: 75%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Action Links & Quick Attendance Button */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                      <p className="text-[11px] text-slate-600">
                        Presensi dibuka setiap jadwal perkuliahan online ({enrolledSchedule.days}, pukul {enrolledSchedule.timeWIB}).
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('absensi')}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Buka Halaman Presensi Lengkap →</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 4 Cols: Quick Student Card & Schedule Reminder */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h3 className="text-sm font-bold text-slate-900">
                      Identitas Akun Pelajar
                    </h3>
                    <GraduationCap className="w-4 h-4 text-emerald-800" />
                  </div>
                  <dl className="space-y-2.5 text-xs">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Nomor Registrasi</dt>
                      <dd className="font-mono font-semibold text-slate-900">
                        {studentRegistration.registrationNumber}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Nama Pelajar</dt>
                      <dd className="font-semibold text-slate-900 text-right">
                        {studentRegistration.fullName}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Email Akun</dt>
                      <dd className="font-mono text-slate-800 text-right break-all">
                        {studentAccount.email}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Domisili</dt>
                      <dd className="text-slate-800 text-right">
                        {studentRegistration.city}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">Tanggal Terdaftar</dt>
                      <dd className="font-mono text-slate-700 text-right">
                        {studentRegistration.registeredAt}
                      </dd>
                    </div>
                  </dl>
                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadStudentCard}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Kartu Pelajar (.TXT)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB: ABSENSI & PRESENSI PERTEMUAN ONLINE LIVE ZOOM
             ===================================================================== */}
          {activeTab === 'absensi' && (
            <div className="space-y-8">
              {/* Absensi Header & Actions */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                  <div className="space-y-1.5">
                    <p className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-semibold">
                      PRESENSI AKADEMIK RESMI · KELAS ONLINE LIVE ZOOM
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        Absensi Pertemuan — {enrolledProgram.title}
                      </h2>
                      {activeBatchLabel && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                          {activeBatchLabel}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded font-mono text-slate-600 bg-slate-100 border border-slate-200">
                        No. Reg: {currentRegistration.registrationNumber}
                      </span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        isAttendanceQualified
                          ? 'bg-emerald-800 text-white'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {isAttendanceQualified ? '✓ Memenuhi Syarat Kelulusan' : '⚠️ Syarat Min. 75%'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Jadwal: <strong>{enrolledSchedule.days}</strong> pukul <strong>{enrolledSchedule.timeWIB}</strong> · Pengajar: <strong>{enrolledSchedule.instructor}</strong>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadAttendanceReport}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Unduh rekap bukti presensi santri format teks resmi"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Rekap (.TXT)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Cetak halaman rekap presensi"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak</span>
                    </button>
                  </div>
                </div>

                {/* Academic Attendance Policy Banner */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/90 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-semibold text-emerald-900">
                        Ketentuan Akademik Kehadiran Perkuliahan Tadribul Lughah:
                      </p>
                      <p className="text-emerald-900/90 leading-relaxed">
                        Santri wajib mencapai minimal <strong>75% kehadiran</strong> ({Math.ceil(totalMeetingsCount * 0.75)} dari {totalMeetingsCount} pertemuan) untuk memenuhi prasyarat evaluasi akhir & diterbitkan <strong>Syahadah Kelulusan Resmi Ma’had Al-Bayan</strong>.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 whitespace-nowrap self-stretch sm:self-auto text-center">
                    Batas Minimum: 75%
                  </span>
                </div>

                {/* 4 Attendance Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="bg-[#FBF9F5] p-4 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Total Pertemuan</span>
                      <Calendar className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-2xl font-bold font-mono text-slate-900">
                      {totalMeetingsCount}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {enrolledProgram.durationWeeks} Pekan Kurikulum
                    </p>
                  </div>

                  <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-1">
                    <div className="flex items-center justify-between text-emerald-800">
                      <span>Hadir (حَاضِرٌ)</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    </div>
                    <p className="text-2xl font-bold font-mono text-emerald-950">
                      {attendedCount}
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      {attendedCount > 0 ? `${Math.round((attendedCount / totalMeetingsCount) * 100)}% dari total sesi` : 'Belum ada presensi'}
                    </p>
                  </div>

                  <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-1">
                    <div className="flex items-center justify-between text-amber-800">
                      <span>Izin / Sakit (بِعُذْرٍ)</span>
                      <Clock className="w-4 h-4 text-amber-700" />
                    </div>
                    <p className="text-2xl font-bold font-mono text-amber-950">
                      {excusedCount}
                    </p>
                    <p className="text-[11px] text-amber-800">
                      {excusedCount > 0 ? `${excusedCount} sesi berhalangan` : 'Nihil udzur'}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Persentase Kehadiran</span>
                      <CalendarCheck className="w-4 h-4 text-emerald-800" />
                    </div>
                    <p className={`text-2xl font-bold font-mono ${isAttendanceQualified ? 'text-emerald-900' : 'text-amber-800'}`}>
                      {attendanceRate}%
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {isAttendanceQualified ? '✓ Syarat Kelulusan Terpenuhi' : `Kurang ${Math.max(0, 75 - attendanceRate)}% dari standar`}
                    </p>
                  </div>
                </div>

                {/* Progress Bar Kehadiran */}
                <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">
                      Progres Kehadiran Perkuliahan Santri:
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {attendedCount} dari {totalMeetingsCount} Pertemuan ({attendanceRate}%)
                    </span>
                  </div>
                  <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isAttendanceQualified ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                      style={{ left: '75%' }}
                      title="KKM Kehadiran 75%"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0%</span>
                    <span className="text-rose-600 font-bold">Ambang Minimal Syahadah: 75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Form Presensi Cepat Santri */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
                <div className="border-b border-slate-200 pb-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold mb-1">
                    <CalendarCheck className="w-4 h-4 text-emerald-800" />
                    <span>FORMULIR PRESENSI MANDIRI KELAS LIVE ZOOM</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Isi / Perbarui Kehadiran Perkuliahan
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Pilih sesi pertemuan yang ingin dicatat, tentukan status kehadiran Anda, dan simpan. Data otomatis tercatat di sistem akademik.
                  </p>
                </div>

                {absenSuccessMsg && (
                  <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span className="font-medium">{absenSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  {/* Select Pertemuan */}
                  <div className="md:col-span-6 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      1. Pilih Pertemuan / Sesi Kelas:
                    </label>
                    <select
                      value={selectedSessionForAbsen}
                      onChange={(e) => handleSelectSessionForAbsen(parseInt(e.target.value, 10))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-800 focus:bg-white"
                    >
                      {programMeetings.map((m) => {
                        const key = `${(currentRegistration.registrationNumber || '').toUpperCase()}_${enrolledProgram.id}_s${m.sessionNumber}`;
                        const rec = studentAttendances[key];
                        const isUnlocked = isAttendanceSessionUnlocked(enrolledProgram.id, m.sessionNumber);
                        const statusTag = rec ? `[${rec.status.toUpperCase()}]` : isUnlocked ? '[BELUM ABSEN]' : '[TERKUNCI]';
                        return (
                          <option key={m.sessionNumber} value={m.sessionNumber}>
                            Pertemuan {m.sessionNumber} · Pekan {m.pekanNumber} ({m.dateStr}) — {statusTag} {m.title.slice(0, 45)}
                          </option>
                        );
                      })}
                    </select>

                    {/* Quick Preview of selected meeting */}
                    {(() => {
                      const curMeeting = programMeetings.find((m) => m.sessionNumber === selectedSessionForAbsen);
                      const key = `${(currentRegistration.registrationNumber || '').toUpperCase()}_${enrolledProgram.id}_s${selectedSessionForAbsen}`;
                      const rec = studentAttendances[key];
                      const isSelectedSessionUnlocked = isAttendanceSessionUnlocked(enrolledProgram.id, selectedSessionForAbsen);
                      if (!curMeeting) return null;
                      return (
                        <div className="space-y-2">
                          <div className="p-3 rounded-lg bg-[#FBF9F5] border border-slate-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-800">
                                Pertemuan {curMeeting.sessionNumber} (Pekan {curMeeting.pekanNumber})
                              </span>
                              {rec ? (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  rec.status === 'hadir'
                                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-950 border border-amber-300'
                                }`}>
                                  Status: {rec.status.toUpperCase()}
                                </span>
                              ) : isSelectedSessionUnlocked ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  Belum Absen
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Lock className="w-3 h-3 text-amber-700" />
                                  Belum Diizinkan
                                </span>
                              )}
                            </div>
                            <p className="text-slate-700 font-medium">{curMeeting.title}</p>
                            {curMeeting.arabicTitle && (
                              <p className="font-arabic text-emerald-800 text-sm" dir="rtl">
                                {curMeeting.arabicTitle}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-500">
                              {curMeeting.dateStr} · {curMeeting.timeWIB}
                            </p>
                            {rec?.submittedAt && (
                              <p className="text-[10px] text-emerald-800 font-mono pt-1 border-t border-slate-200">
                                Tercatat: {rec.submittedAt} {rec.notes ? `(${rec.notes})` : ''}
                              </p>
                            )}
                          </div>

                          {!isSelectedSessionUnlocked && (
                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center gap-2">
                              <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                              <div className="leading-tight">
                                <strong className="block font-semibold">Presensi Belum Diizinkan oleh Superadmin:</strong>
                                <span>Pertemuan ke-{selectedSessionForAbsen} belum dibuka untuk pengisian presensi oleh pengajar. Santri hanya dapat mengisi presensi setelah diizinkan oleh Superadmin.</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Status Selection & Notes */}
                  <div className="md:col-span-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-2">
                        2. Pilih Status Kehadiran:
                      </label>
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setAbsenStatus('hadir')}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            absenStatus === 'hadir'
                              ? 'bg-emerald-50 border-emerald-800 text-emerald-950 ring-2 ring-emerald-800/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">🟢 Hadir</span>
                            {absenStatus === 'hadir' && <Check className="w-3.5 h-3.5 text-emerald-800" />}
                          </div>
                          <p className="text-[10px] font-arabic text-emerald-800">حَاضِرٌ</p>
                          <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                            Live Zoom aktif
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAbsenStatus('izin')}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            absenStatus === 'izin'
                              ? 'bg-amber-50 border-amber-800 text-amber-950 ring-2 ring-amber-800/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">🟡 Izin</span>
                            {absenStatus === 'izin' && <Check className="w-3.5 h-3.5 text-amber-800" />}
                          </div>
                          <p className="text-[10px] font-arabic text-amber-800">مُسْتَأْذِنٌ</p>
                          <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                            Ada udzur syar’i
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAbsenStatus('sakit')}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            absenStatus === 'sakit'
                              ? 'bg-sky-50 border-sky-800 text-sky-950 ring-2 ring-sky-800/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">🔵 Sakit</span>
                            {absenStatus === 'sakit' && <Check className="w-3.5 h-3.5 text-sky-800" />}
                          </div>
                          <p className="text-[10px] font-arabic text-sky-800">مَرِيْضٌ</p>
                          <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                            Kondisi sakit
                          </p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        3. Catatan / Alasan Kehadiran:
                      </label>
                      <input
                        type="text"
                        value={absenNotes}
                        onChange={(e) => setAbsenNotes(e.target.value)}
                        placeholder={
                          absenStatus === 'hadir'
                            ? 'Contoh: Hadir tepat waktu mengikuti pemaparan materi dari Ustadz'
                            : 'Contoh: Izin tugas dinas luar kota / sedang flu & istirahat'
                        }
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-800 focus:bg-white"
                      />
                    </div>

                    {(() => {
                      const isSelectedSessionUnlocked = isAttendanceSessionUnlocked(enrolledProgram.id, selectedSessionForAbsen);
                      const key = `${(currentRegistration.registrationNumber || '').toUpperCase()}_${enrolledProgram.id}_s${selectedSessionForAbsen}`;
                      const rec = studentAttendances[key];

                      if (!isSelectedSessionUnlocked) {
                        return (
                          <button
                            type="button"
                            disabled
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed select-none shadow-none"
                            title="Presensi untuk pertemuan ini belum diizinkan oleh Superadmin"
                          >
                            <Lock className="w-4 h-4 text-slate-400" />
                            <span>Presensi Pertemuan {selectedSessionForAbsen} Belum Dibuka Superadmin</span>
                          </button>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => handleOpenAttendanceModal(selectedSessionForAbsen)}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-xs"
                        >
                          <CalendarClock className="w-4 h-4" />
                          <span>
                            Buka Popup Presensi Pertemuan {selectedSessionForAbsen} ({rec ? 'Ubah Status' : 'Isi Absen'})
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Daftar Seluruh Pertemuan Online */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Daftar Riwayat Presensi Seluruh Pertemuan ({programMeetings.length} Sesi)
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Rincian presensi kehadiran kelas online live Zoom per pertemuan kurikulum.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('semua')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        attendanceFilter === 'semua'
                          ? 'bg-slate-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua ({totalMeetingsCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('hadir')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        attendanceFilter === 'hadir'
                          ? 'bg-emerald-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      🟢 Hadir ({attendedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('izin-sakit')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        attendanceFilter === 'izin-sakit'
                          ? 'bg-amber-900 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      🟡 Izin & Sakit ({excusedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceFilter('belum')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        attendanceFilter === 'belum'
                          ? 'bg-slate-700 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ⚪ Belum Absen ({unattendedCount})
                    </button>
                  </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                        <th className="py-3 pr-4">Sesi & Pekan</th>
                        <th className="py-3 px-4">Topik Pembelajaran</th>
                        <th className="py-3 px-4">Jadwal Perkuliahan</th>
                        <th className="py-3 px-4">Status Presensi</th>
                        <th className="py-3 px-4">Catatan Santri</th>
                        <th className="py-3 pl-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {programMeetings
                        .filter((m) => {
                          const key = `${(currentRegistration.registrationNumber || '').toUpperCase()}_${enrolledProgram.id}_s${m.sessionNumber}`;
                          const rec = studentAttendances[key];
                          if (attendanceFilter === 'hadir') return rec?.status === 'hadir';
                          if (attendanceFilter === 'izin-sakit') return rec?.status === 'izin' || rec?.status === 'sakit';
                          if (attendanceFilter === 'belum') return !rec;
                          return true;
                        })
                        .map((m) => {
                          const key = `${(currentRegistration.registrationNumber || '').toUpperCase()}_${enrolledProgram.id}_s${m.sessionNumber}`;
                          const rec = studentAttendances[key];
                          return (
                            <tr key={m.sessionNumber} className="hover:bg-slate-50 transition-colors">
                              <td className="py-4 pr-4 whitespace-nowrap">
                                <span className="font-mono font-bold text-slate-900 block">
                                  Pertemuan {String(m.sessionNumber).padStart(2, '0')}
                                </span>
                                <span className="text-[11px] font-mono text-emerald-800">
                                  Pekan {m.pekanNumber}
                                </span>
                              </td>

                              <td className="py-4 px-4 max-w-xs">
                                <p className="font-semibold text-slate-900 leading-snug">
                                  {m.title}
                                </p>
                                {m.arabicTitle && (
                                  <p className="font-arabic text-emerald-800 text-sm mt-0.5" dir="rtl">
                                    {m.arabicTitle}
                                  </p>
                                )}
                                {m.category && (
                                  <span className="inline-block mt-1 text-[10px] text-slate-500 font-mono">
                                    {m.category}
                                  </span>
                                )}
                              </td>

                              <td className="py-4 px-4 whitespace-nowrap">
                                <p className="font-medium text-slate-800">
                                  {m.dateStr}
                                </p>
                                <p className="text-slate-500 text-[11px] font-mono mt-0.5">
                                  {m.timeWIB}
                                </p>
                              </td>

                              <td className="py-4 px-4 whitespace-nowrap">
                                {rec ? (
                                  <div className="space-y-0.5">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                      rec.status === 'hadir'
                                        ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                        : rec.status === 'izin'
                                          ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                          : 'bg-sky-100 text-sky-950 border border-sky-300'
                                    }`}>
                                      {rec.status === 'hadir' ? '🟢 Hadir' : rec.status === 'izin' ? '🟡 Izin' : '🔵 Sakit'}
                                    </span>
                                    {rec.submittedAt && (
                                      <p className="text-[10px] text-slate-400 font-mono">
                                        {rec.submittedAt}
                                      </p>
                                    )}
                                  </div>
                                ) : isAttendanceSessionUnlocked(enrolledProgram.id, m.sessionNumber) ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    ⚪ Belum Absen
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
                                    <Lock className="w-3 h-3 text-amber-700" />
                                    Belum Diizinkan
                                  </span>
                                )}
                              </td>

                              <td className="py-4 px-4 text-slate-600 text-[11px] max-w-[200px] truncate">
                                {rec?.notes || '-'}
                              </td>

                              <td className="py-4 pl-4 text-right whitespace-nowrap">
                                {isAttendanceSessionUnlocked(enrolledProgram.id, m.sessionNumber) ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAttendanceModal(m.sessionNumber)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-2xs ${
                                      rec
                                        ? 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200'
                                        : 'bg-emerald-900 hover:bg-emerald-800 text-white shadow-xs'
                                    }`}
                                    title={rec ? 'Klik untuk mengubah status presensi pertemuan ini' : 'Klik untuk mengisi presensi pertemuan ini'}
                                  >
                                    <CalendarClock className="w-3.5 h-3.5" />
                                    <span>{rec ? 'Ubah Status' : 'Isi Absen'}</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed select-none"
                                    title="Pengisian presensi pertemuan ini belum diizinkan oleh Superadmin / Pengajar"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{rec ? 'Terkunci' : 'Belum Dibuka'}</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* =====================================================================
                  POPUP / MODAL FORMULIR PRESENSI SANTRI
                 ===================================================================== */}
              {isAttendanceModalOpen && attendanceTargetSession !== null && (() => {
                const targetMeeting = programMeetings.find((m) => m.sessionNumber === attendanceTargetSession);
                if (!targetMeeting) return null;
                const key = `${(currentRegistration.registrationNumber || '').toUpperCase()}_${enrolledProgram.id}_s${attendanceTargetSession}`;
                const existingRecord = studentAttendances[key];

                return (
                  <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setIsAttendanceModalOpen(false);
                    }}
                  >
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col my-auto animate-in zoom-in-95 duration-150">
                      {/* Modal Header */}
                      <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border-b border-slate-800 flex items-start justify-between gap-4 sticky top-0 z-10 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
                            <CalendarCheck className="w-5 h-5 text-emerald-300" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                                PRESENSI KELAS LIVE ZOOM
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-900 text-emerald-200 border border-emerald-700">
                                Pertemuan {String(targetMeeting.sessionNumber).padStart(2, '0')}
                              </span>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                              {existingRecord ? 'Ubah Status Presensi' : 'Isi Presensi Kehadiran'}
                            </h3>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsAttendanceModalOpen(false)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          title="Tutup Popup"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Body */}
                      <div className="p-5 sm:p-6 space-y-5 text-slate-800 text-xs sm:text-sm leading-relaxed flex-1">
                        {/* Card Rincian Pertemuan */}
                        <div className="p-4 rounded-xl bg-[#FBF9F5] border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono text-emerald-800 font-bold">
                              Pekan ke-{targetMeeting.pekanNumber} · Pertemuan {targetMeeting.sessionNumber}
                            </span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {targetMeeting.dateStr} · {targetMeeting.timeWIB}
                            </span>
                          </div>

                          <p className="font-bold text-slate-900 text-sm leading-snug">
                            {targetMeeting.title}
                          </p>
                          {targetMeeting.arabicTitle && (
                            <p className="font-arabic text-emerald-800 text-base" dir="rtl">
                              {targetMeeting.arabicTitle}
                            </p>
                          )}

                          {/* Status Sebelumnya */}
                          <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="text-slate-500 text-[11px]">Status Saat Ini:</span>
                            {existingRecord ? (
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  existingRecord.status === 'hadir'
                                    ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                    : existingRecord.status === 'izin'
                                      ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                      : 'bg-sky-100 text-sky-950 border border-sky-300'
                                }`}>
                                  {existingRecord.status === 'hadir' ? '🟢 Hadir' : existingRecord.status === 'izin' ? '🟡 Izin' : '🔵 Sakit'}
                                </span>
                                {existingRecord.submittedAt && (
                                  <span className="text-[10px] font-mono text-slate-400">
                                    ({existingRecord.submittedAt})
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                ⚪ Belum Pernah Mengisi
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Pilihan Status Kehadiran (3 Card Besar) */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-800">
                            Pilih Status Kehadiran Anda:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <button
                              type="button"
                              onClick={() => setModalAbsenStatus('hadir')}
                              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                modalAbsenStatus === 'hadir'
                                  ? 'bg-emerald-50 border-emerald-700 text-emerald-950 ring-2 ring-emerald-700/30 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold">🟢 Hadir</span>
                                {modalAbsenStatus === 'hadir' && <Check className="w-4 h-4 text-emerald-800" />}
                              </div>
                              <p className="text-xs font-arabic text-emerald-800 font-semibold">حَاضِرٌ</p>
                              <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                                Mengikuti Live Zoom aktif
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setModalAbsenStatus('izin')}
                              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                modalAbsenStatus === 'izin'
                                  ? 'bg-amber-50 border-amber-700 text-amber-950 ring-2 ring-amber-700/30 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold">🟡 Izin</span>
                                {modalAbsenStatus === 'izin' && <Check className="w-4 h-4 text-amber-800" />}
                              </div>
                              <p className="text-xs font-arabic text-amber-800 font-semibold">مُسْتَأْذِنٌ</p>
                              <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                                Ada udzur / berhalangan
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setModalAbsenStatus('sakit')}
                              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                modalAbsenStatus === 'sakit'
                                  ? 'bg-sky-50 border-sky-700 text-sky-950 ring-2 ring-sky-700/30 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold">🔵 Sakit</span>
                                {modalAbsenStatus === 'sakit' && <Check className="w-4 h-4 text-sky-800" />}
                              </div>
                              <p className="text-xs font-arabic text-sky-800 font-semibold">مَرِيْضٌ</p>
                              <p className="text-[10px] text-slate-500 mt-1 leading-tight">
                                Kondisi fisik sedang sakit
                              </p>
                            </button>
                          </div>
                        </div>

                        {/* Catatan / Alasan Kehadiran */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-800">
                            Catatan / Keterangan Santri (Opsional):
                          </label>
                          <input
                            type="text"
                            value={modalAbsenNotes}
                            onChange={(e) => setModalAbsenNotes(e.target.value)}
                            placeholder={
                              modalAbsenStatus === 'hadir'
                                ? 'Contoh: Hadir tepat waktu mengikuti pemaparan materi dari Ustadz'
                                : modalAbsenStatus === 'izin'
                                  ? 'Contoh: Izin ada tugas kantor luar kota / acara keluarga'
                                  : 'Contoh: Sedang demam & flu, istirahat di rumah'
                            }
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-800 focus:bg-white"
                          />
                        </div>

                        {/* Info Syarat Kelulusan */}
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 flex items-start gap-2">
                          <GraduationCap className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                          <p className="leading-relaxed">
                            <strong>Standar Kelulusan Akademik:</strong> Santri diwajibkan memenuhi minimal <strong>75% kehadiran</strong> kelas Live Zoom untuk dapat mengikuti evaluasi akhir dan memperoleh sertifikat resmi.
                          </p>
                        </div>
                      </div>

                      {/* Modal Footer Actions */}
                      <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 sticky bottom-0">
                        <button
                          type="button"
                          onClick={() => setIsAttendanceModalOpen(false)}
                          className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          disabled={!isAttendanceSessionUnlocked(enrolledProgram.id, targetMeeting.sessionNumber)}
                          onClick={handleSaveAttendanceFromModal}
                          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {isAttendanceSessionUnlocked(enrolledProgram.id, targetMeeting.sessionNumber)
                              ? `Simpan Presensi Pertemuan ${targetMeeting.sessionNumber} (${modalAbsenStatus.toUpperCase()})`
                              : `Presensi Pertemuan ${targetMeeting.sessionNumber} Belum Diizinkan`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* =====================================================================
              TAB 2: PROGRES MODUL & KURIKULUM LEVEL PELAJAR
             ===================================================================== */}
          {activeTab === 'modul' && (
            <div className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                  <div className="space-y-1.5">
                    <p className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-semibold">
                      SILABUS & CEKLIS CAPAIAN BELAJAR MANDIRI
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        Modul {enrolledProgram.title}
                      </h2>
                      {activeBatchLabel && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
                          {activeBatchLabel}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded font-mono text-slate-600 bg-slate-100 border border-slate-200">
                        No. Reg: {currentRegistration.registrationNumber}
                      </span>
                      {isBatchGraduated ? (
                        <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-emerald-800 text-emerald-50">
                          ✓ Lulus & Selesai
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                          Sedang Berjalan (Angkatan Baru)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      {isBatchGraduated
                        ? 'Alhamdulillah, Anda telah menyelesaikan seluruh rangkaian materi dan ujian mandiri pada angkatan ini. Riwayat kelulusan Anda tersimpan rapi.'
                        : `Klik tombol pada setiap pekan untuk menandai materi yang sudah Anda kuasai di kelas ${enrolledSchedule.days} (${enrolledSchedule.timeWIB}). Anda dapat belajar mandiri dari awal lagi untuk angkatan baru ini.`}
                    </p>
                  </div>
                  <div className="text-xs font-mono font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg shrink-0">
                    Selesai: {completedModulesForProgram} / {totalModulesForProgram} Modul ({progressPercentage}%)
                  </div>
                </div>

                {/* Pelajaran Mendengar (Istima') - Audio Google Drive (Level 1 / Program dengan Audio) */}
                {(() => {
                  // Trigger re-render when materi overrides or unlock state update
                  void materiVersion;
                  void pekanUnlockVersion;
                  const maxAudioPekan = enrolledProgram.id === 'tl-level-1' ? 22 : enrolledProgram.modules.length;
                  const pekanAudioEntries = Array.from({ length: maxAudioPekan }, (_, i) => {
                    const pNum = i + 1;
                    const pContent = getWeeklyPekanContent(enrolledProgram.id, pNum, enrolledSchedule?.id);
                    const audioItems = getNormalizedPekanAudioItems(pContent);
                    return {
                      pekanNum: pNum,
                      title: pContent.title,
                      arabicTitle: pContent.arabicTitle,
                      audioItems,
                      isUnlocked: isPekanUnlocked(enrolledProgram.id, pNum, enrolledSchedule?.id)
                    };
                  });
                  const totalAudioTracks = pekanAudioEntries.reduce(
                    (sum, entry) => sum + entry.audioItems.length,
                    0
                  );

                  if (enrolledProgram.id !== 'tl-level-1' && totalAudioTracks === 0) {
                    return null;
                  }

                  const activeAudioEntry =
                    pekanAudioEntries.find((e) => e.pekanNum === selectedAudioPekan) ||
                    pekanAudioEntries[0];

                  return (
                    <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-[#FBF9F5] to-white p-5 sm:p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-900 text-amber-300 flex items-center justify-center shrink-0 shadow-sm">
                            <Headphones className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                                Pelajaran Mendengar (Istima&apos;)
                              </h3>
                              <span className="font-arabic text-base font-bold text-emerald-900">
                                دَرْسُ الاسْتِمَاعِ
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Dengarkan rekaman audio pelajaran Bahasa Arab (sumber Google Drive) sesuai pekan pembelajaran {enrolledProgram.title}.
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] font-mono font-bold px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-900 shrink-0 self-start sm:self-center">
                          {totalAudioTracks > 0
                            ? `${totalAudioTracks} Audio Tersedia`
                            : 'Menunggu Upload Audio'}
                        </span>
                      </div>

                      {/* Pilihan Pekan Audio */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {pekanAudioEntries.map((entry) => {
                          const isSelected = activeAudioEntry?.pekanNum === entry.pekanNum;
                          const hasAudio = entry.audioItems.length > 0;
                          return (
                            <button
                              key={entry.pekanNum}
                              type="button"
                              onClick={() => setSelectedAudioPekan(entry.pekanNum)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap transition-all shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm'
                                  : hasAudio
                                    ? 'bg-white text-emerald-950 border-emerald-300 hover:bg-emerald-50'
                                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {!entry.isUnlocked && <Lock className="w-3 h-3 shrink-0 opacity-75" />}
                              <span>Pekan {entry.pekanNum}</span>
                              {hasAudio && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                    isSelected
                                      ? 'bg-amber-400 text-slate-950 font-bold'
                                      : 'bg-emerald-100 text-emerald-900'
                                  }`}
                                >
                                  {entry.audioItems.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Pemutar Audio Pekan Terpilih */}
                      {activeAudioEntry && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-700">
                            <span className="font-semibold text-emerald-950">
                              Pekan {activeAudioEntry.pekanNum}: {activeAudioEntry.title}
                            </span>
                            {activeAudioEntry.arabicTitle && (
                              <span dir="rtl" className="font-arabic font-bold text-emerald-900">
                                {activeAudioEntry.arabicTitle}
                              </span>
                            )}
                          </div>

                          {!activeAudioEntry.isUnlocked ? (
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-center gap-2.5">
                              <Lock className="w-4 h-4 shrink-0 text-amber-700" />
                              <span>
                                Audio pelajaran mendengar untuk <strong>Pekan {activeAudioEntry.pekanNum}</strong> saat ini masih dikunci oleh Asatidz/Superadmin. Audio akan otomatis aktif saat pekan ini dibuka.
                              </span>
                            </div>
                          ) : (
                            <GoogleDriveAudioPlayer
                              items={activeAudioEntry.audioItems}
                              pekanNumber={activeAudioEntry.pekanNum}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {enrolledProgram.modules.map((mod, idx) => {
                    const pekanNum = getModulePekanNumber(mod.weekRange, idx);
                    const isUnlocked = isPekanUnlocked(enrolledProgram.id, pekanNum, enrolledSchedule?.id);
                    const scoreKey = `${enrolledProgram.id}-pekan-${pekanNum}`;
                    const status = isPekanExamAlreadySubmitted(
                      studentAccount?.email || studentAccount?.registrationNumber || '',
                      scoreKey,
                      currentRegistration.registrationNumber
                    );
                    const quizScore = status.score;
                    const isDone =
                      isModuleDoneForCurrentRegistration(idx, pekanNum) ||
                      (status.submitted && (status.score ?? 0) >= 70);
                    return (
                      <div
                        key={mod.weekRange}
                        className={`p-5 rounded-xl border transition-all flex flex-col justify-between gap-4 ${
                          isDone
                            ? 'bg-emerald-50/60 border-emerald-300'
                            : 'bg-[#FBF9F5] border-slate-200 hover:border-emerald-700 hover:shadow-xs'
                        }`}
                      >
                        <div
                          className={`space-y-2.5 ${
                            !isUnlocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                          }`}
                          onClick={() => {
                            if (!isUnlocked) {
                              showToast(`Materi untuk ${mod.weekRange} (${enrolledSchedule.batchCode}) saat ini masih OFF / dikunci oleh Asatidz. Akses akan dibuka sesuai jadwal kelas Zoom Anda.`);
                              return;
                            }
                            window.location.href = `./materi.html?program=${encodeURIComponent(enrolledProgram.id)}&pekan=${pekanNum}&schedule=${encodeURIComponent(enrolledSchedule.id)}`;
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono font-semibold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded">
                                {mod.weekRange}
                              </span>
                              {!isUnlocked && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  🔒 Belum Dibuka
                                </span>
                              )}
                            </div>
                            <span
                              className="font-arabic text-base font-semibold text-slate-800"
                              dir="rtl"
                            >
                              {mod.arabicTerm}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug hover:text-emerald-900 transition-colors flex items-center justify-between gap-2">
                            <span>{mod.topic}</span>
                            {!isUnlocked ? (
                              <span className="text-xs font-mono text-amber-800 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <Lock className="w-3.5 h-3.5 shrink-0" />
                                <span>Materi Terkunci</span>
                              </span>
                            ) : (
                              <span className="text-xs font-mono text-emerald-800 font-semibold flex items-center gap-1">
                                <span>Buka Halaman (materi.html)</span>
                                <Eye className="w-3.5 h-3.5 shrink-0" />
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Target: {mod.outcome}
                          </p>

                          {quizScore !== undefined ? (
                            <div className="pt-1 flex items-center gap-2 text-[11px] font-mono">
                              <a
                                href={`./latihan.html?program=${encodeURIComponent(enrolledProgram.id)}&pekan=${pekanNum}&schedule=${encodeURIComponent(enrolledSchedule.id)}&reg=${encodeURIComponent(currentRegistration.registrationNumber)}`}
                                onClick={(e) => e.stopPropagation()}
                                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 border transition-all ${
                                  quizScore >= 70
                                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200'
                                    : 'bg-rose-100 text-rose-950 border-rose-300 hover:bg-rose-200'
                                }`}
                                title="Buka rapor dan evaluasi jawaban di latihan.html"
                              >
                                <span>Nilai Latihan:</span>
                                <span className="font-extrabold">{quizScore} / 100</span>
                                <span>{quizScore >= 70 ? '✓ Lulus' : '✕ Belum KKM'}</span>
                                <span className="underline ml-1">Rapor →</span>
                              </a>
                            </div>
                          ) : !isUnlocked ? (
                            <div className="pt-1 flex items-center gap-2 text-[11px] font-mono">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-semibold text-slate-400 bg-slate-100 border border-slate-200" title="Ujian latihan pekan ini belum dibuka oleh Asatidz">
                                <span>🔒 Ujian Mandiri Belum Dibuka</span>
                              </span>
                            </div>
                          ) : (
                            <div className="pt-1 flex items-center gap-2 text-[11px] font-mono">
                              <a
                                href={`./latihan.html?program=${encodeURIComponent(enrolledProgram.id)}&pekan=${pekanNum}&schedule=${encodeURIComponent(enrolledSchedule.id)}&reg=${encodeURIComponent(currentRegistration.registrationNumber)}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors"
                                title="Buka halaman latihan di file terpisah (latihan.html)"
                              >
                                <span>📝 Ujian Mandiri (latihan.html) →</span>
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isUnlocked) {
                                showToast(`Materi untuk ${mod.weekRange} (${enrolledSchedule.batchCode}) saat ini masih dikunci oleh Asatidz.`);
                                return;
                              }
                              window.location.href = `./materi.html?program=${encodeURIComponent(enrolledProgram.id)}&pekan=${pekanNum}&schedule=${encodeURIComponent(enrolledSchedule.id)}`;
                            }}
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors shadow-xs ${
                              !isUnlocked
                                ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-300 cursor-not-allowed'
                                : 'bg-emerald-900 text-white hover:bg-emerald-800 cursor-pointer'
                            }`}
                            title={!isUnlocked ? `Materi Pekan ${pekanNum} masih dikunci oleh Asatidz` : `Buka Materi Pekan ${pekanNum}`}
                          >
                            {!isUnlocked ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-amber-700" />
                                <span>Materi Pekan {pekanNum} (Terkunci)</span>
                              </>
                            ) : (
                              <>
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>
                                  {pekanNum === 1
                                    ? 'Buka Materi Muqaddimah (Pekan 1) →'
                                    : `Buka Materi Pekan ${pekanNum} →`}
                                </span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleModuleComplete(idx);
                            }}
                            title={isDone ? 'Sudah Tuntas' : 'Tandai Selesai'}
                            className={`inline-flex items-center justify-center p-2 text-xs font-semibold rounded-lg transition-colors border ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-emerald-800' : 'text-slate-400'}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Modal Buka Materi & Modul Belajar */}
                {openedModuleIndex !== null && (() => {
                  const mod = enrolledProgram.modules[openedModuleIndex];
                  if (!mod) return null;
                  const openedPekanNum = getModulePekanNumber(mod.weekRange, openedModuleIndex);
                  const details = getModuleStudyContent(enrolledProgram.id, openedModuleIndex);
                  const isDone = isModuleDoneForCurrentRegistration(openedModuleIndex, openedPekanNum);

                  return (
                    <div
                      role="dialog"
                      aria-modal="true"
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto"
                    >
                      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col my-auto">
                        {/* Modal Header */}
                        <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-start justify-between gap-4 sticky top-0 z-10">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-400">
                              <span className="px-2 py-0.5 rounded bg-emerald-900 font-bold">
                                {mod.weekRange}
                              </span>
                              <span>·</span>
                              <span>{enrolledProgram.title}</span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold font-display text-white mt-1">
                              {mod.topic}
                            </h2>
                            <p dir="rtl" className="font-arabic text-xl text-emerald-300 pt-0.5">
                              {details.arabicBab || mod.arabicTerm}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOpenedModuleIndex(null)}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                            aria-label="Tutup Modul"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 sm:p-8 space-y-6 text-slate-800 text-xs sm:text-sm leading-relaxed flex-1">
                          {!isPekanUnlocked(enrolledProgram.id, openedPekanNum, enrolledSchedule?.id) && (
                            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs flex items-center gap-2.5">
                              <Lock className="w-4 h-4 shrink-0 text-amber-800" />
                              <span>
                                <strong>Pemberitahuan Asatidz:</strong> Materi untuk modul {mod.weekRange} ini saat ini berstatus <strong>TERKUNCI</strong> untuk kelas {enrolledSchedule.batchCode}. Asatidz akan membuka akses materi sesuai jadwal perkuliahan berjalan.
                              </span>
                            </div>
                          )}
                          {/* Target Box */}
                          <div className="p-4 rounded-xl bg-[#FBF9F5] border border-slate-200 space-y-1.5">
                            <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-900 uppercase">
                              <BookOpen className="w-4 h-4 text-emerald-800" />
                              <span>Kitab Rujukan: {details.kitabChapter}</span>
                            </div>
                            <p className="text-slate-700">
                              <strong>Target Capaian Pembelajaran:</strong> {mod.outcome}
                            </p>
                            <p className="text-xs text-slate-600 mt-1">
                              {details.intro}
                            </p>
                          </div>

                          {/* Audio Pelajaran Mendengar untuk Pekan Ini */}
                          {(() => {
                            if (!isPekanUnlocked(enrolledProgram.id, openedPekanNum, enrolledSchedule?.id)) return null;
                            const pekanAudioContent = getWeeklyPekanContent(enrolledProgram.id, openedPekanNum, enrolledSchedule?.id);
                            const openedAudioItems = getNormalizedPekanAudioItems(pekanAudioContent);
                            if (openedAudioItems.length === 0) return null;
                            return (
                              <div className="space-y-2.5">
                                <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider text-emerald-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                                  <Headphones className="w-4 h-4 text-emerald-800" />
                                  <span>Pelajaran Mendengar (Istima&apos; — Google Drive)</span>
                                </h3>
                                <GoogleDriveAudioPlayer
                                  items={openedAudioItems}
                                  pekanNumber={openedPekanNum}
                                  compact
                                />
                              </div>
                            );
                          })()}

                          {/* Pekanan Syllabus Breakdown */}
                          <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider text-emerald-900 border-b border-slate-200 pb-2">
                              Materi Perkuliahan Kelas Malam ({mod.weekRange})
                            </h3>
                            <div className="space-y-2.5">
                              {details.lessons.map((lesson, lIdx) => (
                                <div
                                  key={lIdx}
                                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1"
                                >
                                  <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                                    {lesson.title}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {lesson.desc}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Qawa'id / Rules */}
                          <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider text-emerald-900 border-b border-slate-200 pb-2">
                              Kaidah Nahwu & Shorof Penting (الْقَوَاعِدُ)
                            </h3>
                            <ul className="space-y-2 list-disc list-inside text-xs sm:text-sm text-slate-700">
                              {details.rules.map((rule, rIdx) => (
                                <li key={rIdx} className="leading-relaxed">
                                  {rule}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Examples (Al-Amtsilah) */}
                          <div className="space-y-3">
                            <h3 className="text-sm font-bold text-slate-900 uppercase font-mono tracking-wider text-emerald-900 border-b border-slate-200 pb-2">
                              Contoh Kalimat Ber-harokat & Terjemah (الأَمْثِلَةُ)
                            </h3>
                            <div className="space-y-2.5">
                              {details.examples.map((ex, exIdx) => (
                                <div
                                  key={exIdx}
                                  className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1.5"
                                >
                                  <p
                                    dir="rtl"
                                    className="font-arabic text-lg sm:text-xl font-semibold text-emerald-950 text-right leading-loose"
                                  >
                                    {ex.ar}
                                  </p>
                                  <p className="text-xs text-slate-700 italic border-t border-emerald-200/60 pt-1.5">
                                    Artinya: {ex.tr}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Classroom Schedule Notice */}
                          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div>
                              <span className="font-mono text-emerald-400 font-semibold block">
                                KELAS LIVE ZOOM ({enrolledSchedule.days}, {enrolledSchedule.timeWIB})
                              </span>
                              <span className="text-slate-300">
                                Pengampu: {enrolledSchedule.instructor} · Kode: {enrolledSchedule.batchCode}
                              </span>
                            </div>
                            <span className="px-2.5 py-1 rounded bg-emerald-800 text-emerald-100 font-mono text-[11px] shrink-0">
                              {currentRegistration.registrationNumber}
                            </span>
                          </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 sticky bottom-0">
                          <button
                            type="button"
                            onClick={() => handleDownloadModuleContent(mod)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4 text-emerald-800" />
                            <span>Unduh Ringkasan Modul (.TXT)</span>
                          </button>

                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              type="button"
                              onClick={() => {
                                handleToggleModuleComplete(openedModuleIndex);
                              }}
                              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                                isDone
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-emerald-900 text-white hover:bg-emerald-800'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>
                                {isDone ? 'Tuntas Dipelajari ✓' : 'Tandai Selesai'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setOpenedModuleIndex(null)}
                              className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              Tutup
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Switch / Enroll Next Level Directly with Existing Student Account */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-800 font-semibold">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>DAFTAR / AMBIL LEVEL LAINNYA (1 AKUN UNTUK 4 PROGRAM)</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Pilihan Program Kurikulum Tadribul Lughah (Level 1–4)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Dengan 1 akun pelajar Anda (<span className="font-mono text-emerald-900">{studentAccount.email}</span>), Anda dapat mengambil hingga 4 level tanpa membuat akun baru lagi. Biaya per level{' '}
                    <strong>Rp 510.000 / Level</strong> (bisa dicicil per bulan dibagi 6: <strong>Rp 85.000 / bulan</strong>).
                  </p>
                </div>

                {upgradeBanner && (
                  <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                    <span>{upgradeBanner}</span>
                  </div>
                )}

                {upgradeErrorBanner && (
                  <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                    <span>{upgradeErrorBanner}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {programs
                    .filter(
                      (prog) =>
                        prog.id === activeEnrolledProgramId ||
                        enrolledRegistrations.some((r) => r.selectedProgramId === prog.id) ||
                        isProgramHasAnyOpenSchedule(prog, schedules)
                    )
                    .map((prog) => {
                    const isCurrent = prog.id === activeEnrolledProgramId;
                    const progRegs = enrolledRegistrations.filter(
                      (r) => r.selectedProgramId === prog.id
                    );
                    const existingReg = progRegs[0];
                    const isAlreadyEnrolled = Boolean(existingReg);
                    const otherRegs = progRegs.filter(
                      (r) => r.registrationNumber !== currentRegistration.registrationNumber
                    );
                    const preferredSchedule = getPreferredScheduleForProgram(prog, schedules);
                    const nextAvailableSchedule = getNextAvailableOpenScheduleForProgram(
                      prog,
                      schedules,
                      progRegs,
                      programs
                    );
                    const hasAnyOpenSchedule = isProgramHasAnyOpenSchedule(prog, schedules);
                    const displayBatchLabel =
                      nextAvailableSchedule?.angkatan?.trim() ||
                      preferredSchedule?.angkatan?.trim() ||
                      prog.angkatan ||
                      'Angkatan 1';

                    return (
                      <div
                        key={prog.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-4 ${
                          isCurrent
                            ? 'bg-emerald-50/70 border-emerald-800 shadow-xs'
                            : isAlreadyEnrolled
                              ? 'bg-emerald-50/30 border-emerald-300'
                              : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-semibold text-emerald-800">
                              {prog.categoryLabel}
                            </span>
                            {isAlreadyEnrolled && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold">
                                Terdaftar
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {prog.title}
                          </h4>
                          <p className="text-[11px] font-semibold text-emerald-800">
                            {displayBatchLabel}
                          </p>
                          <p className="text-[11px] font-mono text-slate-600">
                            {(nextAvailableSchedule || preferredSchedule)?.days || prog.scheduleDays} · {(nextAvailableSchedule || preferredSchedule)?.timeWIB || prog.scheduleTime}
                          </p>
                          <p className="text-xs font-mono font-bold text-emerald-900">
                            {formatIDR((nextAvailableSchedule || preferredSchedule)?.feeIDR || prog.tuitionIDR)} / Level
                          </p>
                          <p className="text-[11px] font-mono text-slate-600">
                            Cicilan 6x: {formatIDR(Math.round(((nextAvailableSchedule || preferredSchedule)?.feeIDR || prog.tuitionIDR) / 6))}/bln
                          </p>
                        </div>

                        {isCurrent ? (
                          <div className="space-y-1.5 w-full">
                            <button
                              type="button"
                              disabled
                              className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-900 text-white cursor-default"
                            >
                              Sedang Dibuka
                            </button>
                            {otherRegs.map((oReg) => {
                              const oBatch = oReg.selectedProgramName?.match(/(Angkatan\s*\d+)/i)?.[1] || oReg.registrationNumber;
                              return (
                                <button
                                  key={oReg.registrationNumber}
                                  type="button"
                                  onClick={() => handleSelectRegistration(oReg)}
                                  className="w-full px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-100/70 text-emerald-900 hover:bg-emerald-200 transition-colors border border-emerald-300 flex items-center justify-center gap-1 cursor-pointer"
                                  title={`Buka ${oBatch} (${oReg.registrationNumber})`}
                                >
                                  <span>Buka {oBatch} ({oReg.registrationNumber}) →</span>
                                </button>
                              );
                            })}
                            {nextAvailableSchedule ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRequestAdditionalEnrollConfirm(prog, true, nextAvailableSchedule)
                                }
                                className="w-full px-3 py-1.5 text-[11px] font-semibold rounded-lg text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                title="Daftar ulang untuk mengikuti kelas Live Zoom di angkatan baru tanpa menghapus data sebelumnya"
                              >
                                <RotateCcw className="w-3 h-3 text-emerald-700" />
                                <span>Daftar Ulang ({nextAvailableSchedule.angkatan?.trim() || prog.angkatan || 'Angkatan Baru'})</span>
                              </button>
                            ) : (
                              <div className="w-full px-3 py-1.5 text-[11px] font-medium rounded-lg text-emerald-900 bg-emerald-50 border border-emerald-200 text-center">
                                {hasAnyOpenSchedule
                                  ? `✓ Sudah Terdaftar (${displayBatchLabel})`
                                  : 'Pendaftaran Angkatan Baru Ditutup (OFF)'}
                              </div>
                            )}
                          </div>
                        ) : isAlreadyEnrolled && existingReg ? (
                          <div className="space-y-1.5 w-full">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectRegistration(existingReg);
                              }}
                              className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-900 hover:bg-emerald-200 transition-colors border border-emerald-300"
                            >
                              Buka Kelas Ini →
                            </button>
                            {nextAvailableSchedule ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleRequestAdditionalEnrollConfirm(prog, true, nextAvailableSchedule)
                                }
                                className="w-full px-3 py-1.5 text-[11px] font-semibold rounded-lg text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                                title="Daftar ulang untuk mengikuti kelas Live Zoom di angkatan baru tanpa menghapus data sebelumnya"
                              >
                                <RotateCcw className="w-3 h-3 text-emerald-700" />
                                <span>Daftar Ulang ({nextAvailableSchedule.angkatan?.trim() || prog.angkatan || 'Angkatan Baru'})</span>
                              </button>
                            ) : (
                              <div className="w-full px-3 py-1.5 text-[11px] font-medium rounded-lg text-emerald-900 bg-emerald-50 border border-emerald-200 text-center">
                                {hasAnyOpenSchedule
                                  ? `✓ Sudah Terdaftar (${displayBatchLabel})`
                                  : 'Pendaftaran Angkatan Baru Ditutup (OFF)'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={!hasAnyOpenSchedule}
                            onClick={() =>
                              handleRequestAdditionalEnrollConfirm(prog, false, preferredSchedule)
                            }
                            className={`w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                              !hasAnyOpenSchedule
                                ? 'bg-rose-100 text-rose-900 border border-rose-300 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-emerald-900 cursor-pointer'
                            }`}
                          >
                            {!hasAnyOpenSchedule
                              ? 'Pendaftaran Ditutup (OFF)'
                              : `+ Daftar Level ${prog.levelNumber} (${displayBatchLabel})`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB: BIAYA PENDIDIKAN & SISA CICILAN BELAJAR
             ===================================================================== */}
          {activeTab === 'pembayaran' && (
            <div className="space-y-8">
              {/* Toast banner */}
              {toastMsg && (
                <div className="bg-emerald-900 text-white text-xs px-4 py-2.5 rounded-lg flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>{toastMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToastMsg(null)}
                    className="text-emerald-200 hover:text-white font-bold ml-4"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Header Box */}
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-white/10 text-emerald-200 border border-white/15 mb-3">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Sistem Keuangan & Biaya Santri</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
                      Informasi Biaya Pendidikan & Sisa Cicilan
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      Program: <span className="text-emerald-300 font-semibold">{enrolledProgram.title}</span> · Santri: <span className="text-white font-medium">{currentRegistration.fullName}</span> ({currentRegistration.registrationNumber})
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={getConfirmationWaUrl(remainingTuition > 0 ? monthlyInstallment : totalTuition)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Konfirmasi Pembayaran via WA</span>
                    </a>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/15">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                      <span>Total Biaya Level Ini</span>
                      <Receipt className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-xl font-bold font-mono text-white">
                      {formatIDR(totalTuition)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      Skema 6 Bulan (@ {formatIDR(monthlyInstallment)}/bln)
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
                      <span>Sudah Dibayarkan</span>
                      <Wallet className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-300">
                      {formatIDR(paidTuition)}
                    </div>
                    <div className="text-[11px] text-emerald-200/80 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{paidInstallmentsCount} dari {totalInstallmentMonths} cicilan lunas</span>
                    </div>
                    {extraAmount > 0 && (
                      <div className="mt-1.5 inline-block px-2 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-[10px] font-semibold text-sky-200">
                        + Uang Tambahan: {formatIDR(extraAmount)} (tidak memotong bulan berikutnya)
                      </div>
                    )}
                  </div>

                  <div className={`border rounded-xl p-4 ${
                    isTuitionFullyPaid
                      ? 'bg-emerald-950/40 border-emerald-500/30'
                      : 'bg-amber-950/30 border-amber-500/30'
                  }`}>
                    <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                      <span>Sisa Tagihan Belajar</span>
                      <AlertCircle className={`w-4 h-4 ${isTuitionFullyPaid ? 'text-emerald-400' : 'text-amber-400'}`} />
                    </div>
                    <div className={`text-xl font-bold font-mono ${isTuitionFullyPaid ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {formatIDR(remainingTuition)}
                    </div>
                    <div className="text-[11px] mt-1 font-medium">
                      {isTuitionFullyPaid ? (
                        <span className="text-emerald-300">Lunas Sepenuhnya (Alhamdulillah)</span>
                      ) : (
                        <span className="text-amber-300">Sisa {remainingInstallmentsCount}x Cicilan (@ {formatIDR(monthlyInstallment)})</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
                    <span className="font-medium">Kemajuan Pelunasan Biaya ({paymentProgressPercent}%)</span>
                    <span className="font-mono text-emerald-300">{formatIDR(basePaidTuition)} / {formatIDR(totalTuition)}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-white/10">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isTuitionFullyPaid
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                      }`}
                      style={{ width: `${paymentProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {isTuitionFullyPaid
                      ? 'Barakallahu fiikum! Seluruh kewajiban biaya pendidikan Anda untuk tingkatan ini telah berstatus Lunas.'
                      : `Biaya pendidikan di Ma'had Al-Bayan dapat dicicil per bulan santai tanpa bunga dan denda. Sisa cicilan Anda: ${remainingInstallmentsCount} bulan lagi.`}
                  </p>
                </div>
              </div>

              {/* Grid 2 Kolom: Jadwal Cicilan (Kiri) & Info Transfer Bank + Panduan (Kanan) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Kolom Kiri: Rincian Jadwal 6 Bulan Cicilan */}
                <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Jadwal & Riwayat Cicilan 6 Bulan
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Rincian jatuh tempo dan status pelunasan per bulan belajar
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-md bg-slate-100 text-slate-700">
                      Total 6 Bulan / Periode
                    </span>
                  </div>

                  <div className="space-y-3">
                    {installmentMonthsList.map((item) => {
                      const isPaid = item.monthIndex <= paidInstallmentsCount;
                      const isNextDue = item.monthIndex === paidInstallmentsCount + 1 && !isTuitionFullyPaid;
                      const monthExtra = Number(currentRegistration.monthlyExtraPayments?.[String(item.monthIndex)] || 0);
                      const monthDisplayTotal = isPaid ? monthlyInstallment + monthExtra : monthlyInstallment;

                      return (
                        <div
                          key={item.monthIndex}
                          className={`p-4 rounded-xl border transition-all ${
                            isPaid
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : isNextDue
                              ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200'
                              : 'bg-slate-50/50 border-slate-200 opacity-80'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 ${
                                  isPaid
                                    ? 'bg-emerald-800 text-white'
                                    : isNextDue
                                    ? 'bg-amber-700 text-white ring-2 ring-amber-200'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {isPaid ? '✓' : item.monthIndex}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900">
                                    {item.monthLabel}
                                  </span>
                                  {isPaid ? (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      Lunas
                                    </span>
                                  ) : isNextDue ? (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                      Jatuh Tempo Berikutnya
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-200 text-slate-700">
                                      Belum Jatuh Tempo
                                    </span>
                                  )}
                                  {monthExtra > 0 && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-sky-100 text-sky-900 border border-sky-200">
                                      + Kelebihan {formatIDR(monthExtra)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {item.note} · <span className="font-medium text-slate-600">Estimasi: {item.dueDate}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                              <div className="text-right">
                                <span className="text-xs font-mono font-bold text-slate-900">
                                  {formatIDR(monthDisplayTotal)}
                                </span>
                                {monthExtra > 0 && (
                                  <span className="block text-[10px] font-medium text-sky-800">
                                    Pokok {formatIDR(monthlyInstallment)} + {formatIDR(monthExtra)}
                                  </span>
                                )}
                              </div>
                              {isPaid ? (
                                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>Terverifikasi</span>
                                </span>
                              ) : (
                                <a
                                  href={getConfirmationWaUrl(monthlyInstallment, item.monthIndex)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-emerald-800 hover:bg-emerald-900 text-white transition-colors"
                                >
                                  <span>Bayar / Konfirmasi</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Catatan Muamalah */}
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-emerald-800" />
                      <span>Akad & Kebijakan Cicilan Syar'i:</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      1. Ma'had tidak mengenakan denda atau bunga atas keterlambatan cicilan demi menjaga kesucian muamalah.
                    </p>
                    <p className="text-[11px] text-slate-600">
                      2. Santri diperbolehkan melunasi sisa seluruh cicilan sekaligus kapan saja selama masa pembelajaran aktif.
                    </p>
                  </div>
                </div>

                {/* Kolom Kanan: Rekening Resmi Pembayaran & Tata Cara */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Rekening Pembayaran Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
                    <div className="pb-3 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-emerald-800" />
                        <span>Rekening Resmi Ma'had</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Transfer pembayaran cicilan hanya ditujukan ke rekening resmi berikut:
                      </p>
                    </div>

                    {/* Bank 1: BSI */}
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-emerald-950 px-2 py-0.5 rounded bg-emerald-200/80">
                            BSI
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            Bank Syariah Indonesia
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">Kode: 451</span>
                      </div>
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-emerald-200">
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Nomor Rekening</p>
                          <p className="text-sm font-mono font-bold text-slate-900 tracking-wider">
                            7198234551
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText('7198234551', 'No. Rekening BSI')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-800 text-white hover:bg-emerald-900 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Atas Nama: <strong className="text-slate-900">Ma'had Tadribul Lughah Al-Bayan</strong>
                      </p>
                    </div>

                    {/* Bank 2: BCA */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-blue-900 px-2 py-0.5 rounded bg-blue-100">
                            BCA
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            Bank Central Asia
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">Kode: 014</span>
                      </div>
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Nomor Rekening</p>
                          <p className="text-sm font-mono font-bold text-slate-900 tracking-wider">
                            8410294821
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText('8410294821', 'No. Rekening BCA')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 text-white hover:bg-slate-900 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Salin</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Atas Nama: <strong className="text-slate-900">Tadribul Lughah Al-Bayan</strong>
                      </p>
                    </div>
                  </div>

                  {/* Panduan Konfirmasi */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      Cara Konfirmasi Setelah Transfer:
                    </h3>
                    <ol className="text-xs text-slate-600 space-y-2.5 list-decimal pl-4">
                      <li>
                        Transfer nominal cicilan (sebesar <strong className="text-slate-900">{formatIDR(monthlyInstallment)}</strong>) ke rekening BSI atau BCA di atas.
                      </li>
                      <li>
                        Simpan bukti transfer (struk ATM, screenshot m-banking, atau mutasi).
                      </li>
                      <li>
                        Klik tombol hijau <strong>"Konfirmasi via WhatsApp"</strong> di bawah ini atau kirim manual ke nomor resmi <strong className="text-slate-900">+62 812-8841-9023</strong>.
                      </li>
                      <li>
                        Sertakan foto bukti transfer dan nomor registrasi Anda: <strong className="font-mono text-emerald-800">{currentRegistration.registrationNumber}</strong>.
                      </li>
                      <li>
                        Bagian keuangan Ma'had akan memperbarui data cicilan Anda di portal ini dalam waktu maksimal 1x24 jam kerja.
                      </li>
                    </ol>

                    <a
                      href={getConfirmationWaUrl(remainingTuition > 0 ? monthlyInstallment : totalTuition)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Kirim Bukti Pembayaran ke WhatsApp Admin</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================================
              TAB 3: KARTU TANDA PELAJAR & PENGATURAN AKUN
             ===================================================================== */}
          {activeTab === 'akun' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Digital Student ID Card */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-mono text-emerald-800 font-semibold">
                      DOKUMEN AKADEMIK RESMI
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                      Kartu Tanda Pelajar Tadribul Lughah
                    </h2>
                  </div>
                  <BookOpen className="w-5 h-5 text-emerald-800" />
                </div>

                <div className="p-6 rounded-xl bg-slate-900 text-white space-y-5 border border-slate-800">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <p className="text-xs font-mono text-emerald-400">
                        PROGRAM PEMBELAJARAN BAHASA ARAB TADRIBUL LUGHAH
                      </p>
                      <h3 className="text-lg font-bold text-white font-display mt-1">
                        {studentRegistration.fullName}
                      </h3>
                      <p className="text-xs font-mono text-slate-300 mt-0.5">
                        {studentAccount.email} · {formatWhatsAppNumber(studentAccount.whatsapp) || studentAccount.whatsapp}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-md bg-emerald-900 text-emerald-200 font-mono text-xs font-semibold shrink-0">
                      {studentRegistration.registrationNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400">Level Terdaftar</p>
                      <p className="font-semibold text-white mt-0.5">
                        {enrolledProgram.categoryLabel}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Jadwal Kelas Malam Online</p>
                      <p className="font-mono font-semibold text-emerald-300 mt-0.5">
                        {enrolledSchedule.days} ({enrolledSchedule.timeWIB})
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Profesi & Domisili</p>
                      <p className="text-white mt-0.5">
                        {studentRegistration.occupation} — {studentRegistration.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Status Pembayaran</p>
                      <p className="text-emerald-300 font-semibold mt-0.5">
                        {isTuitionFullyPaid
                          ? '✓ Lunas Penuh (6/6)'
                          : paidInstallmentsCount > 0
                            ? `Cicilan ${paidInstallmentsCount}/6 Lunas`
                            : 'Belum Lunas (Bulan 1)'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadStudentCard}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh Kartu Pelajar (.TXT)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Kartu Pelajar</span>
                  </button>
                </div>
              </div>

              {/* Account Security & Password Settings */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200">
                  <KeyRound className="w-5 h-5 text-emerald-800 shrink-0" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Keamanan Akun Pelajar
                    </h3>
                    <p className="text-xs text-slate-500">
                      Perbarui kata sandi untuk akses halaman pelajar.html
                    </p>
                  </div>
                </div>

                {passwordBanner && (
                  <div
                    className={`p-3.5 rounded-lg text-xs font-medium border ${
                      passwordBanner.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {passwordBanner.text}
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email / Nomor Registrasi Akun
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${studentAccount.email} (${studentRegistration.registrationNumber})`}
                      className="w-full px-3.5 py-2 text-xs font-mono bg-slate-100 text-slate-600 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-student-pass"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      Kata Sandi Baru (Minimal 6 Karakter) *
                    </label>
                    <input
                      id="new-student-pass"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan kata sandi baru"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-student-pass"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      Ulangi Kata Sandi Baru *
                    </label>
                    <input
                      id="confirm-student-pass"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Simpan Kata Sandi Akun Pelajar
                  </button>
                </form>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Institutional Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-800 text-xs">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            File Terpisah Portal Pelajar (<span className="font-mono text-slate-200">pelajar.html</span>) — Khusus Pelajar Terdaftar Tadribul Lughah
          </p>
          <div className="flex items-center gap-4">
            <a
              href="./index.html"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Beranda Publik (index.html)
            </a>
            <button
              type="button"
              onClick={requestLogoutStudent}
              className="text-rose-400 hover:text-rose-300 font-medium"
            >
              Keluar Akun Pelajar
            </button>
          </div>
        </div>
      </footer>

      <EnrollmentConfirmModal
        pending={pendingEnrollVerify}
        studentName={studentAccount.fullName}
        studentEmail={studentAccount.email}
        studentWhatsapp={studentAccount.whatsapp}
        isSubmitting={isConfirmingEnrollModal}
        onCancel={() => setPendingEnrollVerify(null)}
        onConfirm={handleExecuteVerifiedEnrollment}
      />
      <EnrollmentSuccessModal
        success={enrollmentSuccessModal}
        studentName={studentAccount.fullName}
        primaryButtonLabel="Mulai Belajar Sekarang"
        onClose={() => setEnrollmentSuccessModal(null)}
      />
      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        studentName={studentAccount.fullName}
        isLoading={isLoggingOut}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutStudent}
      />
    </div>
  );
}
