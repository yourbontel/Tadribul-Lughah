/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PROGRAM_TRACKS,
  CLASS_SCHEDULES,
  ProgramTrack,
  ClassSchedule,
  formatIDR,
  applyScheduleStartDateOverrides,
  syncProgramStatesFromServer
} from './data/arabicAcademyData';
import {
  getStudentAccounts,
  getStudentRegistrations,
  syncRegistrationsFromServer,
  StudentAccount,
  saveStudentAccount,
  saveStudentQuizScore,
  isPekanExamAlreadySubmitted,
  syncQuizScoresFromServer
} from './utils/studentAccountStore';
import {
  getWeeklyPekanContent,
  getProgramPekanList,
  WeeklyPekanData,
  saveCustomMateriOverride,
  syncCustomMateriFromServer,
  extractOptionalYouTubeId,
  getPekanYouTubeId,
  isValidYouTubeVideoInput,
  isPekanUnlocked,
  savePekanUnlockState,
  syncPekanUnlockFromServer,
  getNormalizedPekanAudioItems
} from './data/moduleContentData';
import { GoogleDriveAudioPlayer } from './components/GoogleDriveAudioPlayer';
import {
  fetchYouTubeMetadata,
  YouTubeVideoMetadata
} from './utils/youtubeVideoMetadata';
import { auth, isUserSuperAdmin, SUPERADMIN_EMAIL } from './firebase';
import { SUPERADMIN_SESSION_KEY } from './LoginApp';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Download,
  GraduationCap,
  HelpCircle,
  ListChecks,
  Lock,
  Unlock,
  Printer,
  Sparkles,
  Video,
  FileText,
  PlayCircle,
  ExternalLink,
  Share2,
  ShieldCheck,
  Settings,
  Edit3,
  Save,
  X,
  Award,
  RotateCcw,
  Trophy,
  Check,
  AlertCircle,
  Plus,
  AlertTriangle,
  ChevronRight,
  Headphones,
  Loader2
} from 'lucide-react';

export function getScoreGradeInfo(score: number) {
  if (score >= 100) {
    return {
      arabic: 'مُمْتَازٌ مُرْتَفِعٌ',
      label: 'Mumtaz Murtafi\' (Sempurna 100)',
      color: 'text-amber-900 bg-amber-50 border-amber-300',
      badgeColor: 'bg-amber-600 text-white',
      borderRing: 'border-amber-400 ring-2 ring-amber-200',
      desc: 'Maa syaa Allah! Nilai sempurna 100 tanpa kesalahan. Penguasaan kaidah sangat istimewa.'
    };
  }
  if (score >= 85) {
    return {
      arabic: 'مُمْتَازٌ',
      label: 'Mumtaz (Sangat Memuaskan / A)',
      color: 'text-emerald-950 bg-emerald-50 border-emerald-300',
      badgeColor: 'bg-emerald-700 text-white',
      borderRing: 'border-emerald-400 ring-2 ring-emerald-200',
      desc: 'Barakallahu fiik! Pemahaman kaidah dan penguasaan materi sangat baik.'
    };
  }
  if (score >= 75) {
    return {
      arabic: 'جَيِّدٌ جِدًّا',
      label: 'Jayyid Jiddan (Sangat Baik / B+)',
      color: 'text-teal-950 bg-teal-50 border-teal-300',
      badgeColor: 'bg-teal-700 text-white',
      borderRing: 'border-teal-400 ring-2 ring-teal-200',
      desc: 'Alhamdulillah, capaian sangat baik dan tuntas melampaui batas KKM.'
    };
  }
  if (score >= 70) {
    return {
      arabic: 'جَيِّدٌ',
      label: 'Jayyid (Baik / Lulus KKM)',
      color: 'text-blue-950 bg-blue-50 border-blue-300',
      badgeColor: 'bg-blue-700 text-white',
      borderRing: 'border-blue-400 ring-2 ring-blue-200',
      desc: 'Memenuhi Kriteria Ketuntasan Minimal (KKM 70). Pertahankan dan terus tingkatkan!'
    };
  }
  if (score >= 50) {
    return {
      arabic: 'مَقْبُولٌ',
      label: 'Maqbul (Cukup / Perlu Penguatan)',
      color: 'text-amber-950 bg-amber-50 border-amber-300',
      badgeColor: 'bg-amber-700 text-white',
      borderRing: 'border-amber-300',
      desc: 'Belum mencapai standar KKM (70). Disarankan membaca kembali bab kaidah dan menyimak rekaman video pemateri.'
    };
  }
  return {
    arabic: 'رَاسِبٌ / إِعَادَة',
    label: 'I\'adah (Perlu Penguatan Materi)',
    color: 'text-rose-950 bg-rose-50 border-rose-300',
    badgeColor: 'bg-rose-700 text-white',
    borderRing: 'border-rose-400 ring-2 ring-rose-200',
    desc: 'Nilai di bawah batas kelulusan. Pelajari kembali materi dan catatan kaidah untuk memperkuat pemahaman.'
  };
}

export default function ModuleReaderApp() {
  const [studentSession, setStudentSession] = useState<{
    email: string;
    fullName: string;
    registrationNumber: string;
  } | null>(null);

  const [studentAccount, setStudentAccount] = useState<StudentAccount | null>(null);
  const [enrolledProgramIds, setEnrolledProgramIds] = useState<string[]>([]);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Check if visitor is verified Superadmin (mazharhajid@gmail.com)
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    try {
      const saved = sessionStorage.getItem(SUPERADMIN_SESSION_KEY);
      return saved === SUPERADMIN_EMAIL;
    } catch {
      return false;
    }
  });

  // Read URL parameters: ?program=tl-level-1&pekan=1&schedule=sch-lv1-malam
  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('program') || 'tl-level-1';
  });

  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('schedule') || '';
  });

  const [enrolledScheduleMap, setEnrolledScheduleMap] = useState<Record<string, string>>({});

  const [selectedPekan, setSelectedPekan] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get('pekan') || '', 10);
    if (!isNaN(p) && p >= 1 && p <= 24) return p;
    const mod = parseInt(params.get('module') || '0', 10);
    return isNaN(mod) ? 1 : mod * 3 + 1;
  });

  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'silabus' | 'kaidah' | 'contoh' | 'kuis' | 'mufradat'>('video');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [materiVersion, setMateriVersion] = useState<number>(0);
  const [showExamConfirmModal, setShowExamConfirmModal] = useState<boolean>(false);

  // Quick edit modal states (EXCLUSIVELY for Superadmin)
  const [isQuickEditOpen, setIsQuickEditOpen] = useState<boolean>(false);
  const [quickEditYoutubeInput, setQuickEditYoutubeInput] = useState<string>('');
  const [quickEditTitle, setQuickEditTitle] = useState<string>('');
  const [quickEditChannel, setQuickEditChannel] = useState<string>('');
  const [isQuickFetchingMeta, setIsQuickFetchingMeta] = useState<boolean>(false);
  const [quickYtMeta, setQuickYtMeta] = useState<YouTubeVideoMetadata | null>(null);
  const [quickInitialYtId, setQuickInitialYtId] = useState<string>('');

  useEffect(() => {
    if (!isQuickEditOpen) return;
    const ytId = extractOptionalYouTubeId(quickEditYoutubeInput);
    if (!ytId || ytId === quickInitialYtId) return;

    const timer = setTimeout(async () => {
      setIsQuickFetchingMeta(true);
      try {
        const meta = await fetchYouTubeMetadata(quickEditYoutubeInput);
        if (meta) {
          setQuickYtMeta(meta);
          if (meta.title) setQuickEditTitle(meta.title);
          if (meta.channel) setQuickEditChannel(meta.channel);
        }
      } finally {
        setIsQuickFetchingMeta(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [isQuickEditOpen, quickEditYoutubeInput, quickInitialYtId]);

  useEffect(() => {
    syncCustomMateriFromServer().catch(() => {});
    syncPekanUnlockFromServer().catch(() => {});
    syncProgramStatesFromServer().catch(() => {});
    const handleMateriUpdated = () => {
      setMateriVersion((v) => v + 1);
    };
    const handlePekanUnlockUpdated = () => {
      setMateriVersion((v) => v + 1);
    };
    const handleProgramStatesUpdated = () => {
      setMateriVersion((v) => v + 1);
    };
    const handleVisibilityRefresh = () => {
      if (document.visibilityState === 'visible') {
        syncCustomMateriFromServer().catch(() => {});
        syncPekanUnlockFromServer().catch(() => {});
        syncProgramStatesFromServer().catch(() => {});
      }
    };
    window.addEventListener('materi-updated', handleMateriUpdated);
    window.addEventListener('pekan-unlock-updated', handlePekanUnlockUpdated);
    window.addEventListener('program-open-updated', handleProgramStatesUpdated);
    window.addEventListener('storage', handleMateriUpdated);
    document.addEventListener('visibilitychange', handleVisibilityRefresh);
    return () => {
      window.removeEventListener('materi-updated', handleMateriUpdated);
      window.removeEventListener('pekan-unlock-updated', handlePekanUnlockUpdated);
      window.removeEventListener('program-open-updated', handleProgramStatesUpdated);
      window.removeEventListener('storage', handleMateriUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    };
  }, []);

  // Listen to Firebase Auth to recognize Superadmin
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && isUserSuperAdmin(user)) {
        setIsSuperAdmin(true);
        try {
          sessionStorage.setItem(SUPERADMIN_SESSION_KEY, SUPERADMIN_EMAIL);
        } catch {
          // Ignore
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('tl_student_verified_session_v1');
    if (!raw) {
      setAuthChecking(false);
      return;
    }

    let isMounted = true;
    const initData = async () => {
      try {
        const parsed = JSON.parse(raw);
        if (isMounted) {
          setStudentSession(parsed);
        }

        const userIdent = parsed.email || parsed.registrationNumber || '';
        // Sinkronkan nilai ujian & registrasi dari server cPanel
        await syncQuizScoresFromServer(userIdent);
        await syncRegistrationsFromServer().catch(() => {});
        await syncProgramStatesFromServer().catch(() => {});

        const accounts = getStudentAccounts();
        const match = accounts.find(
          (a) =>
            a.email.toLowerCase() === (parsed.email || '').toLowerCase() ||
            a.registrationNumber.toUpperCase() === (parsed.registrationNumber || '').toUpperCase()
        );
        if (match && isMounted) {
          setStudentAccount(match);
        }

        // Check all programs student is enrolled in
        const userRegs = getStudentRegistrations(
          parsed.email || parsed.registrationNumber || '',
          []
        );
        const allSchedules = applyScheduleStartDateOverrides(CLASS_SCHEDULES);
        const schedMap: Record<string, string> = {};
        for (const r of userRegs) {
          const matchedSch =
            allSchedules.find((s) => s.id === r.selectedScheduleId) ||
            allSchedules.find(
              (s) => Boolean(r.selectedScheduleSummary) && r.selectedScheduleSummary.includes(s.batchCode)
            ) ||
            allSchedules.find((s) => s.programId === r.selectedProgramId);
          if (r.selectedProgramId && (matchedSch?.id || r.selectedScheduleId)) {
            schedMap[r.selectedProgramId] = matchedSch?.id || r.selectedScheduleId;
          }
        }
        const fromRegs = userRegs.map((r) => r.selectedProgramId);
        const fromAcc = match?.enrolledProgramIds || [];
        const combined = Array.from(new Set([...fromRegs, ...fromAcc]));
        const finalEnrolled =
          combined.length > 0 ? combined : [match?.enrolledProgramIds?.[0] || 'tl-level-1'];
        if (isMounted) {
          setEnrolledScheduleMap(schedMap);
          setEnrolledProgramIds(finalEnrolled);

          // Clamp selected level if student is not enrolled in it
          setSelectedProgramId((prev) => {
            if (!finalEnrolled.includes(prev)) {
              return finalEnrolled[0];
            }
            return prev;
          });
        }
      } catch {
        // Ignored
      } finally {
        if (isMounted) {
          setAuthChecking(false);
        }
      }
    };

    initData();

    const handleScoresUpdate = () => {
      const accounts = getStudentAccounts();
      const rawSess = sessionStorage.getItem('tl_student_verified_session_v1');
      if (rawSess) {
        try {
          const parsed = JSON.parse(rawSess);
          const match = accounts.find(
            (a) =>
              a.email.toLowerCase() === (parsed.email || '').toLowerCase() ||
              a.registrationNumber.toUpperCase() === (parsed.registrationNumber || '').toUpperCase()
          );
          if (match && isMounted) {
            setStudentAccount(match);
          }
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener('quiz-scores-updated', handleScoresUpdate);
    window.addEventListener('storage', handleScoresUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('quiz-scores-updated', handleScoresUpdate);
      window.removeEventListener('storage', handleScoresUpdate);
    };
  }, []);

  const activeProgram =
    PROGRAM_TRACKS.find((p) => p.id === selectedProgramId) || PROGRAM_TRACKS[0];

  const allResolvedSchedules = React.useMemo(
    () => applyScheduleStartDateOverrides(CLASS_SCHEDULES),
    [materiVersion]
  );

  const urlMatchedSchedule = selectedScheduleId
    ? allResolvedSchedules.find((s) => s.id === selectedScheduleId)
    : undefined;

  const enrolledForActive = enrolledScheduleMap[activeProgram.id];
  const activeSchedule =
    (urlMatchedSchedule && urlMatchedSchedule.programId === activeProgram.id
      ? urlMatchedSchedule
      : undefined) ||
    (enrolledForActive
      ? allResolvedSchedules.find((s) => s.id === enrolledForActive)
      : undefined) ||
    allResolvedSchedules.find((s) => s.programId === activeProgram.id) ||
    allResolvedSchedules[0];

  const activeScheduleId =
    (selectedScheduleId && (!urlMatchedSchedule || urlMatchedSchedule.programId === activeProgram.id)
      ? selectedScheduleId
      : '') ||
    enrolledForActive ||
    activeSchedule?.id;

  // Update URL search parameters when pekan changes
  const handleSelectPekan = (progId: string, pekanNum: number) => {
    if (enrolledProgramIds.length > 0 && !enrolledProgramIds.includes(progId)) {
      showToast(`Level ini belum Anda ikuti. Silakan daftar program ini di Portal Pelajar.`);
      return;
    }
    setSelectedProgramId(progId);
    setSelectedPekan(pekanNum);
    setActiveTab('silabus');
    setQuizAnswers({});
    setQuizSubmitted({});

    const nextSchedId =
      progId === activeProgram.id && activeScheduleId
        ? activeScheduleId
        : enrolledScheduleMap[progId] ||
          allResolvedSchedules.find((s) => s.programId === progId)?.id ||
          '';
    if (progId !== activeProgram.id && nextSchedId) {
      setSelectedScheduleId(nextSchedId);
    }

    const schedParam = nextSchedId ? `&schedule=${encodeURIComponent(nextSchedId)}` : '';
    const newUrl = `${window.location.pathname}?program=${encodeURIComponent(progId)}&pekan=${pekanNum}${schedParam}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Get ONLY the data for the selected pekan with auto-reload on materiVersion update!
  const pekanData: WeeklyPekanData = React.useMemo(
    () => getWeeklyPekanContent(activeProgram.id, selectedPekan, activeScheduleId),
    [activeProgram.id, selectedPekan, activeScheduleId, materiVersion]
  );

  const isCurrentPekanOpen = isPekanUnlocked(activeProgram.id, selectedPekan, activeScheduleId);

  const effectiveYouTubeId = getPekanYouTubeId(pekanData);
  const hasPlayableVideo = isValidYouTubeVideoInput(effectiveYouTubeId);
  const youtubeWatchUrl = effectiveYouTubeId
    ? `https://www.youtube.com/watch?v=${effectiveYouTubeId}`
    : '';
  const youtubeEmbedUrl = effectiveYouTubeId
    ? `https://www.youtube.com/embed/${effectiveYouTubeId}?rel=0&modestbranding=1`
    : '';
  const displayVideoTitle =
    pekanData.youtubeTitle || pekanData.videoTitle || `Simak Video Materi: ${pekanData.title}`;
  const displayVideoChannel =
    pekanData.youtubeChannel || pekanData.videoInstructor || 'Tadribul Lughah Official';

  const handleOpenQuickEdit = () => {
    if (!isSuperAdmin) {
      showToast('Akses Ditolak: Hanya Superadmin (mazharhajid@gmail.com) yang diizinkan mengubah link video!');
      return;
    }
    const currentId = getPekanYouTubeId(pekanData);
    setQuickEditYoutubeInput(currentId ? `https://www.youtube.com/watch?v=${currentId}` : '');
    setQuickEditTitle(pekanData.youtubeTitle || pekanData.videoTitle || pekanData.title);
    setQuickEditChannel(pekanData.youtubeChannel || pekanData.videoInstructor || 'Tadribul Lughah Official');
    setQuickYtMeta(null);
    setQuickInitialYtId(currentId);
    setIsQuickEditOpen(true);
  };

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast('Akses Ditolak: Hanya Superadmin yang berwenang menyimpan perubahan!');
      setIsQuickEditOpen(false);
      return;
    }
    const cleanInput = quickEditYoutubeInput.trim();
    const parsedId = extractOptionalYouTubeId(cleanInput) || cleanInput;
    const hadFetchedMeta = Boolean(quickYtMeta && quickYtMeta.videoId === parsedId);
    const freshMeta =
      !hadFetchedMeta && isValidYouTubeVideoInput(cleanInput) && parsedId !== effectiveYouTubeId
        ? await fetchYouTubeMetadata(cleanInput)
        : quickYtMeta;
    const baseUpdated: WeeklyPekanData = {
      ...pekanData,
      youtubeVideoId: parsedId,
      youtubeTitle: hadFetchedMeta ? quickEditTitle : (freshMeta?.title || quickEditTitle),
      youtubeChannel: hadFetchedMeta ? quickEditChannel : (freshMeta?.channel || quickEditChannel),
      videoDriveUrl: '',
      videoTitle: '',
      videoInstructor: ''
    };
    const syncResult = await saveCustomMateriOverride(activeProgram.id, selectedPekan, baseUpdated);
    setMateriVersion((v) => v + 1);
    setIsQuickEditOpen(false);
    if (syncResult.syncedToServer) {
      showToast(`Video YouTube Pekan ${selectedPekan} berhasil diperbarui & disinkronkan ke server!`);
    } else {
      showToast(
        `Video tersimpan di browser ini, tetapi gagal sinkron ke server (${syncResult.error || 'api.php tidak merespons'}).`
      );
    }
  };

  const allPekanList = getProgramPekanList(activeProgram.id, activeScheduleId);

  const pekanCompletionKey = `${activeProgram.id}-pekan-${selectedPekan}`;
  const isPekanDone =
    Array.isArray(studentAccount?.completedModuleKeys) &&
    studentAccount.completedModuleKeys.includes(pekanCompletionKey);

  const handleToggleComplete = () => {
    if (!studentAccount) return;
    const currentCompleted = Array.isArray(studentAccount.completedModuleKeys)
      ? studentAccount.completedModuleKeys
      : [];
    const exists = currentCompleted.includes(pekanCompletionKey);
    const updatedKeys = exists
      ? currentCompleted.filter((k) => k !== pekanCompletionKey)
      : [...currentCompleted, pekanCompletionKey];

    const updatedAccount: StudentAccount = {
      ...studentAccount,
      completedModuleKeys: updatedKeys
    };

    setStudentAccount(updatedAccount);
    saveStudentAccount(updatedAccount);

    if (!exists) {
      showToast(`Barakallahu fiik! Materi Pekan ${selectedPekan} telah ditandai tuntas dipelajari.`);
    } else {
      showToast(`Status materi Pekan ${selectedPekan} diperbarui.`);
    }
  };

  // --- Weekly Quiz & Grading Calculations ---
  const quizzes = pekanData.quizzes || [];
  const totalQuestions = quizzes.length;
  const defaultWeight = 10;
  const totalPossiblePoints = quizzes.reduce((sum, q) => sum + (q.points || defaultWeight), 0);
  const passingThreshold = pekanData.passingScore || 70;

  // Answered questions
  const answeredCount = quizzes.filter((q) => quizSubmitted[q.id]).length;
  const isAllAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  // Earned points
  const earnedPoints = quizzes.reduce((sum, q) => {
    if (quizSubmitted[q.id] && quizAnswers[q.id] === q.correctIndex) {
      return sum + (q.points || defaultWeight);
    }
    return sum;
  }, 0);

  const correctCount = quizzes.filter(
    (q) => quizSubmitted[q.id] && quizAnswers[q.id] === q.correctIndex
  ).length;

  const calculatedScore = totalPossiblePoints > 0
    ? Math.round((earnedPoints / totalPossiblePoints) * 100)
    : 0;

  const submissionStatus = isPekanExamAlreadySubmitted(
    studentSession?.email ||
      studentSession?.registrationNumber ||
      studentAccount?.email ||
      studentAccount?.registrationNumber ||
      '',
    pekanCompletionKey
  );

  const isExamLocked =
    submissionStatus.submitted ||
    studentAccount?.quizScores?.[pekanCompletionKey] !== undefined;

  const savedScore =
    submissionStatus.score ?? studentAccount?.quizScores?.[pekanCompletionKey];

  const hasAttempted = isExamLocked || answeredCount > 0;
  const displayScore = isExamLocked ? (savedScore ?? 0) : calculatedScore;
  const isPassed = displayScore >= passingThreshold;
  const gradeInfo = getScoreGradeInfo(displayScore);

  const submissionDateFormatted =
    submissionStatus.submittedAt || studentAccount?.quizSubmittedAt?.[pekanCompletionKey];

  const handleAnswerOption = (questionId: number, optionIdx: number) => {
    const nextAnswers = { ...quizAnswers, [questionId]: optionIdx };
    const nextSubmitted = { ...quizSubmitted, [questionId]: true };
    setQuizAnswers(nextAnswers);
    setQuizSubmitted(nextSubmitted);

    // If answering the last question, auto-calculate and save score!
    const allDone = quizzes.every((q) => q.id === questionId || nextSubmitted[q.id]);
    if (allDone) {
      const earned = quizzes.reduce((sum, q) => {
        const sel = q.id === questionId ? optionIdx : nextAnswers[q.id];
        return sel === q.correctIndex ? sum + (q.points || defaultWeight) : sum;
      }, 0);
      const score = totalPossiblePoints > 0 ? Math.round((earned / totalPossiblePoints) * 100) : 0;
      const userIdent = studentSession?.email || studentSession?.registrationNumber || studentAccount?.email;
      if (userIdent) {
        const updated = saveStudentQuizScore(userIdent, pekanCompletionKey, score);
        if (updated) {
          setStudentAccount(updated);
        }
      } else if (studentAccount) {
        setStudentAccount((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            quizScores: { ...(prev.quizScores || {}), [pekanCompletionKey]: score }
          };
        });
      }
      showToast(`Alhamdulillah! Latihan selesai dengan nilai: ${score}/100 (${score >= passingThreshold ? 'LULUS KKM' : 'Perlu Penguatan'})`);
    }
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted({});
    showToast('Latihan soal telah direset. Silakan kerjakan kembali untuk menguji pemahaman!');
  };

  const handleSaveScoreToAccount = () => {
    const userIdent = studentSession?.email || studentSession?.registrationNumber || studentAccount?.email;
    if (!userIdent) {
      showToast('Silakan login terlebih dahulu untuk menyimpan nilai ke rapor akun Anda.');
      return;
    }
    const updated = saveStudentQuizScore(userIdent, pekanCompletionKey, displayScore);
    if (updated) {
      setStudentAccount(updated);
      showToast(`Nilai ${displayScore}/100 berhasil disimpan ke rapor profil Anda!`);
    }
  };

  const handleDownloadNotes = () => {
    const lines = [
      '=========================================================================',
      `TADRIBUL LUGHAH — FILE MATERI PEMBELAJARAN (materi.html)`,
      `Level: ${activeProgram.title} (${activeProgram.arabicTitle})`,
      `Angkatan: ${activeProgram.angkatan || 'Angkatan 1'}`,
      `Pekan: Pekan ke-${pekanData.pekanNumber}`,
      `Judul Materi: ${pekanData.title}`,
      `Judul Bahasa Arab: ${pekanData.arabicTitle}`,
      `Kitab Rujukan: ${pekanData.kitabReference}`,
      `Jadwal Kelas: Malam 20.00 – 22.00 WIB (${activeSchedule.days})`,
      `Pengampu: ${activeSchedule.instructor}`,
      '=========================================================================\n',
      'RINGKASAN MATERI KHUSUS PEKAN INI:',
      pekanData.summary,
      '\n-------------------------------------------------------------------------',
      'POIN-POIN PEMBAHASAN PEKAN INI:',
      ...pekanData.points.map((p, i) => `${i + 1}. ${p}`),
      '\n-------------------------------------------------------------------------',
      'KAIDAH NAHWU / SHOROF PEKAN INI:',
      ...pekanData.rules.map((r, i) => `${i + 1}. ${r}`),
      '\n-------------------------------------------------------------------------',
      'CONTOH KALIMAT TERAPAN & I\'ROB:',
      ...pekanData.examples.map(
        (ex, i) => `\n(${i + 1}) ${ex.ar}\n    Arti: ${ex.tr}${ex.breakdown ? `\n    Analisis: ${ex.breakdown}` : ''}`
      ),
      '\n=========================================================================',
      `Diunduh oleh Pelajar: ${studentSession?.fullName || 'Akun Pelajar'} (${studentSession?.registrationNumber || 'Terdaftar'})`,
      `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Materi_${activeProgram.code}_Pekan_${pekanData.pekanNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Rangkuman materi Pekan ${pekanData.pekanNumber} berhasil diunduh!`);
  };

  if (!authChecking && !studentSession && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-white text-slate-900 border border-slate-200 rounded-2xl p-8 space-y-6 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-mono font-semibold text-emerald-900 uppercase tracking-wider">
              HALAMAN TERPISAH: materi.html
            </p>
            <h1 className="text-xl font-bold font-display">
              Akses Khusus Pelajar Terdaftar & Superadmin
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Halaman materi pembelajaran ini terpisah khusus untuk pelajar yang sudah memiliki akun atau Superadmin. Silakan login terlebih dahulu untuk membaca materi.
            </p>
          </div>
          <div className="space-y-2">
            <a
              href="./login.html?role=pelajar"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
            >
              <span>Login Akun Pelajar (login.html) →</span>
            </a>
            <a
              href="./login.html?role=superadmin"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
              <span>Login Superadmin (mazharhajid@gmail.com) →</span>
            </a>
            <a
              href="./index.html"
              className="w-full inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            >
              Kembali ke Beranda Utama
            </a>
          </div>
        </div>
      </div>
    );
  }

  const prevPekan = selectedPekan > 1 ? selectedPekan - 1 : null;
  const nextPekan = selectedPekan < allPekanList.length ? selectedPekan + 1 : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl text-xs flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Halaman Terpisah: materi.html */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[1240px] mx-auto px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href="./pelajar.html"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200 rounded-lg transition-colors shrink-0"
              title="Kembali ke Portal Pelajar"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Kembali ke Portal Pelajar (pelajar.html)</span>
            </a>
            <span className="hidden md:inline text-slate-300">|</span>
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-600">
              <span className="font-semibold text-slate-900">materi.html</span>
              <span>·</span>
              <span className="text-emerald-900 font-semibold">{activeProgram.code} ({activeProgram.category === 'shorof' ? 'Shorof' : 'Nahwu'})</span>
              <span>·</span>
              <span className="text-emerald-900 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Pekan {pekanData.pekanNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleComplete}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isPekanDone
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${isPekanDone ? 'text-emerald-800' : 'text-slate-400'}`} />
              <span>{isPekanDone ? 'Pekan Ini Tuntas ✓' : 'Tandai Tuntas'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadNotes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Rangkuman (.TXT)</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              title="Cetak Halaman Materi"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Header: Level Switcher & Pekan Selector */}
      <section className="bg-white border-b border-slate-200 py-3 shadow-2xs">
        <div className="max-w-[1240px] mx-auto px-6 space-y-3">
          {/* Level Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold mr-1">
                Pilih Level:
              </span>
              {PROGRAM_TRACKS.map((prog) => {
                const isEnrolled =
                  enrolledProgramIds.length === 0 || enrolledProgramIds.includes(prog.id);
                const isSelected = prog.id === activeProgram.id;

                if (!isEnrolled) {
                  return (
                    <button
                      key={prog.id}
                      type="button"
                      disabled
                      title={`Level ${prog.code} (${prog.title}) belum Anda ikuti. Hanya level yang Anda ikuti yang dapat dibuka.`}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-40 inline-flex items-center gap-1 select-none"
                    >
                      <span>{prog.code}</span>
                      <Lock className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  );
                }

                return (
                  <button
                    key={prog.id}
                    type="button"
                    onClick={() => handleSelectPekan(prog.id, 1)}
                    title={`Buka materi ${prog.code} (${prog.title})`}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-800 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    {prog.code} ({prog.levelNumber === 4 ? 'Shorof' : 'Nahwu'})
                  </button>
                );
              })}
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline ml-1">
                (Level yang belum diikuti terkunci 🔒)
              </span>
            </div>

            <span className="text-xs font-mono text-emerald-900 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              Menampilkan Khusus: Pekan ke-{selectedPekan}
            </span>
          </div>

          {/* Pekan Switcher Tabs (dinamis sesuai total pekan per level: 22 Pekan untuk Level 1, 16 Pekan untuk Level 2–4) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 text-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold shrink-0">
                Daftar Pekan:
              </span>
              {allPekanList.map((item) => {
                const isCurrent = item.pekanNumber === selectedPekan;
                const isCompleted =
                  Array.isArray(studentAccount?.completedModuleKeys) &&
                  studentAccount.completedModuleKeys.includes(
                    `${activeProgram.id}-pekan-${item.pekanNumber}`
                  );
                const unlocked = isPekanUnlocked(activeProgram.id, item.pekanNumber, activeScheduleId);
                return (
                  <button
                    key={item.pekanNumber}
                    type="button"
                    onClick={() => handleSelectPekan(activeProgram.id, item.pekanNumber)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                        : isCompleted
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                          : !unlocked && !isSuperAdmin
                            ? 'bg-slate-100/80 text-slate-400 border-slate-200 hover:bg-slate-200/60'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Pekan {item.pekanNumber}</span>
                    {!unlocked && (
                      <span className="text-[10px]" title="Pekan ini belum dibuka oleh Superadmin/Asatidz">
                        🔒
                      </span>
                    )}
                    {item.pekanNumber === 1 && (
                      <span className="text-[10px] font-mono px-1 rounded bg-emerald-800 text-emerald-100">
                        Muqaddimah
                      </span>
                    )}
                    {isCompleted && <span className="text-[10px]">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Container: ONLY displays content related to selectedPekan */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-6 py-8 space-y-8">
        {/* Banner Status Akses Pekan Khusus Superadmin */}
        {isSuperAdmin && (
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
            !isCurrentPekanOpen
              ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg shrink-0 ${!isCurrentPekanOpen ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'}`}>
                {!isCurrentPekanOpen ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-bold font-mono uppercase tracking-wide">
                  {!isCurrentPekanOpen ? `Status Akses Santri: Pekan ${selectedPekan} TERKUNCI 🔒` : `Status Akses Santri: Pekan ${selectedPekan} TERBUKA 🔓`}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {!isCurrentPekanOpen
                    ? 'Santri tidak dapat membuka materi pekan ini sebelum Anda membukanya. Anda sedang melihat pratinjau sebagai Superadmin.'
                    : 'Semua santri yang terdaftar dapat membaca materi dan mengerjakan latihan pekan ini.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!isCurrentPekanOpen ? (
                <button
                  type="button"
                  onClick={async () => {
                    await savePekanUnlockState(activeProgram.id, selectedPekan, true, activeScheduleId);
                    setMateriVersion((v) => v + 1);
                    showToast(`Akses Pekan ${selectedPekan} (${activeSchedule?.batchCode || activeProgram.code}) berhasil DIBUKA (ON) untuk santri!`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg shadow-xs cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Buka Akses Pekan {selectedPekan}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    await savePekanUnlockState(activeProgram.id, selectedPekan, false, activeScheduleId);
                    setMateriVersion((v) => v + 1);
                    showToast(`Akses Pekan ${selectedPekan} (${activeSchedule?.batchCode || activeProgram.code}) telah DIKUNCI (OFF) kembali.`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-white hover:bg-rose-50 border border-rose-300 rounded-lg cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kunci Pekan {selectedPekan}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tampilan Terkunci Jika Santri Mencoba Membuka Pekan yang Belum Dibuka */}
        {!isCurrentPekanOpen && !isSuperAdmin ? (
          <section className="bg-white rounded-2xl border border-amber-200 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm my-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-block">
                Pekan {selectedPekan} Terkunci
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-900">
                Materi Pekan ke-{selectedPekan} Belum Dibuka
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                Afwan, materi pembelajaran, rekaman video, kaidah, dan latihan untuk <strong>Pekan ke-{selectedPekan} ({activeProgram.code} — {activeProgram.title})</strong> belum dibuka oleh Superadmin/Asatidz.
                <br /><br />
                Materi dibuka secara bertahap setiap pekannya sesuai dengan jadwal perkuliahan berjalan.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleSelectPekan(activeProgram.id, 1)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
              >
                <span>← Buka Materi Pekan 1 (Muqaddimah)</span>
              </button>
              <a
                href="./pelajar.html"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <span>Ke Portal Pelajar (pelajar.html) →</span>
              </a>
            </div>
          </section>
        ) : (
          <>
            {/* Focused Hero Banner for Selected Pekan */}
        <section className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-8 relative overflow-hidden shadow-sm">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-emerald-400">
              <span className="bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded text-emerald-300 font-semibold">
                KHUSUS PEKAN {pekanData.pekanNumber} · FILE: materi.html
              </span>
              <span>·</span>
              <span>{activeProgram.code} ({activeProgram.categoryLabel})</span>
              <span>·</span>
              <span>{activeProgram.angkatan || 'Angkatan 1'}</span>
            </div>

            <div className="space-y-2">
              <p
                dir="rtl"
                className="font-arabic text-2xl sm:text-3xl text-emerald-300 leading-relaxed font-semibold"
              >
                {pekanData.arabicTitle}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
                {pekanData.title}
              </h1>
            </div>

            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {pekanData.summary}
            </p>

            <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Rujukan: <strong className="text-white">{pekanData.kitabReference}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Kelas Live: <strong className="text-white">{activeSchedule.timeWIB} ({activeSchedule.days})</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pengampu: <strong className="text-white">{activeSchedule.instructor}</strong></span>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Navigation Tabs */}
        <section className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
          <nav className="flex flex-wrap items-center gap-2">
            {/* Tombol Khusus: Menyimak Video Materi dari YouTube */}
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`flex-1 min-w-[210px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'video'
                  ? 'bg-emerald-900 text-white shadow-sm ring-2 ring-emerald-400'
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              }`}
              title="Simak penjelasan video materi pekan ini langsung dari YouTube"
            >
              <Video className="w-4 h-4 shrink-0" />
              <span>Simak Video Materi (YouTube)</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  activeTab === 'video' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-950'
                }`}
              >
                {hasPlayableVideo ? '▶ HD' : 'Belum Ada'}
              </span>
            </button>

            {(activeProgram.id === 'tl-level-1' || getNormalizedPekanAudioItems(pekanData).length > 0) && (
              <button
                type="button"
                onClick={() => setActiveTab('audio')}
                className={`flex-1 min-w-[210px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'audio'
                    ? 'bg-emerald-900 text-white shadow-sm ring-2 ring-emerald-400'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                }`}
                title="Simak audio pelajaran mendengar (Istima') dari Google Drive"
              >
                <Headphones className="w-4 h-4 shrink-0" />
                <span>Audio Istima&apos; (Google Drive)</span>
                {getNormalizedPekanAudioItems(pekanData).length > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      activeTab === 'audio'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-emerald-200 text-emerald-950'
                    }`}
                  >
                    {getNormalizedPekanAudioItems(pekanData).length}
                  </span>
                )}
              </button>
            )}

            {[
              { id: 'silabus', label: `Uraian Materi Pekan ${pekanData.pekanNumber}`, icon: BookOpen },
              { id: 'kaidah', label: `Kaidah Khusus Pekan ${pekanData.pekanNumber}`, icon: Sparkles },
              { id: 'contoh', label: `Contoh & Amtsilah Pekan ${pekanData.pekanNumber}`, icon: FileText },
              { id: 'kuis', label: `Latihan Pekan ${pekanData.pekanNumber}`, icon: HelpCircle },
              { id: 'mufradat', label: `Kosakata Pekan ${pekanData.pekanNumber}`, icon: ListChecks }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex-1 min-w-[150px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            {/* Tombol Cepat Tonton di YouTube */}
            {hasPlayableVideo && (
              <a
                href={youtubeWatchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg transition-colors shrink-0"
                title="Buka langsung video materi di YouTube"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden xl:inline">Tonton di YouTube ↗</span>
              </a>
            )}

            {/* Tombol Khusus: HANYA TAMPIL UNTUK SUPERADMIN */}
            {isSuperAdmin && (
              <>
                <a
                  href={`./superadmin.html?tab=materi&program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors shrink-0 shadow-2xs"
                  title="Edit materi dan video YouTube ini di Halaman Superadmin (superadmin.html)"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                  <span>Edit di Superadmin ⚙</span>
                </a>

                <button
                  type="button"
                  onClick={handleOpenQuickEdit}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors shrink-0 cursor-pointer"
                  title="Edit cepat link video YouTube materi ini (Khusus Superadmin)"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Edit Cepat Video</span>
                </button>
              </>
            )}
          </nav>
        </section>

        {/* Banner Mode Superadmin jika sedang login sebagai Superadmin */}
        {isSuperAdmin && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 text-amber-950">
              <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <p className="font-bold text-amber-900">
                  Mode Superadmin Aktif ({SUPERADMIN_EMAIL})
                </p>
                <p className="text-[11px] text-amber-800">
                  Hanya Superadmin yang memiliki hak akses untuk mengedit link video YouTube dan konten kurikulum pekan ini.
                </p>
              </div>
            </div>
            <a
              href={`./superadmin.html?tab=materi&program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-900 text-white hover:bg-amber-800 rounded-lg font-semibold text-xs shrink-0 self-start sm:self-auto shadow-xs"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Kelola di superadmin.html →</span>
            </a>
          </div>
        )}

        {/* Tab Audio: Pelajaran Mendengar (Istima') dari Google Drive */}
        {activeTab === 'audio' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Headphones className="w-4 h-4 text-emerald-700" />
                    PELAJARAN MENDENGAR (ISTIMA&apos;) PEKAN {pekanData.pekanNumber}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  Audio Bahasa Arab: {pekanData.title}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Putar rekaman audio pembelajaran (Google Drive) dengan seksama untuk melatih pendengaran Bahasa Arab Anda.
                </p>
              </div>
              <span dir="rtl" className="font-arabic text-xl font-bold text-emerald-900 shrink-0">
                دَرْسُ الاسْتِمَاعِ
              </span>
            </div>

            <GoogleDriveAudioPlayer
              items={getNormalizedPekanAudioItems(pekanData)}
              pekanNumber={pekanData.pekanNumber}
            />
          </section>
        )}

        {/* Tab Video: Video Pembelajaran Langsung dari YouTube */}
        {activeTab === 'video' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-emerald-700" />
                    VIDEO MATERI YOUTUBE PEKAN {pekanData.pekanNumber}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-mono text-slate-500">
                    {displayVideoChannel}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {displayVideoTitle}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Kitab Rujukan: <strong>{pekanData.kitabReference}</strong> · Jadwal Kelas: <strong>{activeSchedule.timeWIB} ({activeSchedule.days})</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {hasPlayableVideo && (
                  <a
                    href={youtubeWatchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Tonton di YouTube ↗</span>
                  </a>
                )}

                {/* Tombol Edit: HANYA TAMPIL JIKA SUPERADMIN */}
                {isSuperAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenQuickEdit}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                      title="Edit video YouTube ini (Khusus Superadmin)"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Video</span>
                    </button>
                    <a
                      href={`./superadmin.html?tab=materi&program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors shadow-2xs"
                      title="Buka panel lengkap Superadmin di superadmin.html"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                      <span className="hidden sm:inline">Halaman Superadmin</span>
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Embedded YouTube Player Container */}
            {hasPlayableVideo ? (
              <div className="w-full bg-slate-950 rounded-2xl overflow-hidden shadow-md border border-slate-800">
                <div className="relative aspect-video w-full">
                  <iframe
                    key={effectiveYouTubeId}
                    className="absolute inset-0 w-full h-full border-0"
                    src={youtubeEmbedUrl}
                    title={displayVideoTitle}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
                <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-mono text-white font-semibold">Video Pembelajaran YouTube</span>
                    {effectiveYouTubeId && (
                      <>
                        <span className="text-slate-500">·</span>
                        <span className="font-mono text-slate-400 truncate max-w-[180px]">
                          ID: {effectiveYouTubeId}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(youtubeWatchUrl);
                        showToast('Tautan video YouTube berhasil disalin!');
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3 h-3 text-slate-400" />
                      <span>Salin Link YouTube</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleComplete}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                        isPekanDone
                          ? 'bg-emerald-800/80 text-emerald-200'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isPekanDone ? 'Sudah Tuntas ✓' : 'Tandai Tuntas'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 sm:p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <Video className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-sm font-bold text-slate-900">
                    Video YouTube Pekan {pekanData.pekanNumber} Belum Diatur
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Superadmin belum menautkan link video YouTube untuk pekan ini. Silakan pelajari{' '}
                    <strong>Uraian Materi</strong>, <strong>Kaidah Khusus</strong>, atau hubungi Asatidz/Admin.
                  </p>
                </div>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={handleOpenQuickEdit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Masukkan Link Video YouTube</span>
                  </button>
                )}
              </div>
            )}

            {/* Video Study Tips & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 bg-[#FBF9F5] space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs font-mono uppercase">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                  <span>1. Siapkan Catatan</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Catat setiap rukun dan definisi yang disampaikan pemateri. Ulangi pelafalan kalimat Arab hingga fasih.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-[#FBF9F5] space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs font-mono uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>2. Pause & Analisis</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hentikan video pada bagian contoh kalimat untuk menebak i'rab dan harakatnya sebelum dijelaskan ustadz.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-[#FBF9F5] space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs font-mono uppercase">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>3. Kerjakan Latihan</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Setelah selesai menyimak video, uji pemahaman Anda pada tab Latihan Pekan dan pelajari Kaidah Khusus.
                </p>
              </div>
            </div>

            {/* Next Steps Buttons */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Selesai Menyimak Video?</span>
                <span className="text-xs text-slate-600">Lanjutkan membaca uraian lengkap silabus atau hafalkan kaidah pekan ini.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('silabus')}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Baca Uraian Silabus →
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('kaidah')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Kaidah Khusus Pekan {pekanData.pekanNumber} →
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Tab 1: Silabus & Uraian Khusus Pekan Ini */}
        {activeTab === 'silabus' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-mono font-semibold text-emerald-900 uppercase tracking-wider">
                BAGIAN 1 · POKOK BAHASAN KHUSUS PEKAN {pekanData.pekanNumber}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {pekanData.title}
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Target Capaian: <strong>{pekanData.targetOutcome}</strong>
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-[#FBF9F5] space-y-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-900 uppercase">
                  Pengantar Pokok Bahasan Pekan {pekanData.pekanNumber}:
                </span>
                <p className="text-sm text-slate-800 leading-relaxed mt-1">
                  {pekanData.summary}
                </p>
              </div>

              {pekanData.points && pekanData.points.length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <p className="text-xs font-semibold text-emerald-900 font-mono uppercase tracking-wider mb-2.5">
                    Poin Pembahasan Khusus Pekan {pekanData.pekanNumber}:
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                    {pekanData.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {pIdx + 1}
                        </span>
                        <span className="leading-relaxed">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Tab 2: Kaidah Inti Khusus Pekan Ini */}
        {activeTab === 'kaidah' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-mono font-semibold text-emerald-900 uppercase tracking-wider">
                BAGIAN 2 · KAIDAH TATA BAHASA PEKAN {pekanData.pekanNumber}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Kaidah Pokok (القَوَاعِدُ المُقَرَّرَةُ لِهَذَا الأُسْبُوعِ)
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Hanya menampilkan kaidah yang berkaitan langsung dengan materi Pekan ke-{pekanData.pekanNumber}.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {pekanData.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-900 text-white font-mono text-sm font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-emerald-950">
                      Kaidah Pekan {pekanData.pekanNumber} #{idx + 1}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                      {rule}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 3: Contoh Khusus Pekan Ini */}
        {activeTab === 'contoh' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-mono font-semibold text-emerald-900 uppercase tracking-wider">
                BAGIAN 3 · CONTOH KALIMAT PEKAN {pekanData.pekanNumber}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Contoh Kalimat Terapan (الأَمْثِلَةُ التَّطْبِيقِيَّةُ)
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Contoh dan bedah tarkib yang sesuai dengan kaidah Pekan ke-{pekanData.pekanNumber}.
              </p>
            </div>

            <div className="space-y-4">
              {pekanData.examples.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-slate-200 bg-[#FBF9F5] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <span className="text-xs font-mono font-semibold text-emerald-900">
                      Contoh Pekan {pekanData.pekanNumber} #{idx + 1}
                    </span>
                    <p
                      dir="rtl"
                      className="font-arabic text-xl sm:text-2xl text-slate-950 font-semibold"
                    >
                      {item.ar}
                    </p>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <p className="text-slate-800">
                      <strong className="text-emerald-950 font-semibold">Arti Terjemahan:</strong> {item.tr}
                    </p>
                    {item.breakdown && (
                      <p className="text-slate-600 bg-white p-3 rounded-lg border border-slate-200 font-mono text-[11px] leading-relaxed">
                        <strong className="text-slate-900">Analisis Kedudukan:</strong> {item.breakdown}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab 4: Latihan & Kuis Khusus Pekan Ini */}
        {activeTab === 'kuis' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <span className="text-xs font-mono font-semibold text-emerald-900 uppercase tracking-wider">
                  BAGIAN 4 · UJI PEMAHAMAN BERBOBOT NILAI PEKAN {pekanData.pekanNumber}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <span>Latihan Soal & Kuis Mandiri</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                    KKM {passingThreshold}
                  </span>
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Evaluasi pemahaman kaidah pekan ini dengan sistem penilaian otomatis, bobot poin, predikat, dan pencatatan ke rapor.
                </p>
              </div>

              {/* Action Button for SuperAdmin */}
              {isSuperAdmin && (
                <a
                  href={`./superadmin.html?tab=materi&program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}#section-latihan`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
                  title="Buat atau edit soal latihan pekan ini di panel Superadmin (superadmin.html)"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-800" />
                  <span>Buat / Kelola Latihan di Superadmin ⚙</span>
                </a>
              )}
            </div>

            {quizzes && quizzes.length > 0 ? (
              <div className="space-y-6">
                {/* JIKA SUDAH DISUBMIT: TAMPILKAN STATUS TERKUNCI & NILAI RAPOR */}
                {isExamLocked ? (
                  <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 space-y-5 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                          <Lock className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                            STATUS: SELESAI DIKERJAKAN & TERKUNCI
                          </span>
                          <h3 className="text-lg font-bold text-white">
                            Rapor Resmi Latihan Pekan {pekanData.pekanNumber}
                          </h3>
                        </div>
                      </div>

                      <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        1 Kali Kesempatan (Selesai)
                      </span>
                    </div>

                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 leading-relaxed">
                      Latihan pekan ini telah Anda selesaikan{' '}
                      {submissionDateFormatted ? `pada ${submissionDateFormatted}` : ''}
                      . Sesuai ketentuan Ma'had, latihan ini bersifat <strong>satu kali pengerjaan</strong> dan <strong>tidak dapat diulang kembali</strong>.
                    </div>

                    {/* Nilai Rapor Mini */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shrink-0">
                          {isPassed ? (
                            <Trophy className="w-7 h-7 text-amber-500" />
                          ) : (
                            <Award className="w-7 h-7 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                            NILAI TERSIMPAN:
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold font-mono text-white">
                              {displayScore}
                            </span>
                            <span className="text-xs font-mono text-slate-400">/ 100</span>
                          </div>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold mt-0.5 ${
                              isPassed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}
                          >
                            {isPassed ? '✓ LULUS KKM' : '✕ BELUM KKM'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1 sm:border-l sm:border-slate-700 sm:pl-4">
                        <span dir="rtl" className="font-arabic text-xl font-bold text-amber-300 block">
                          {gradeInfo.arabic}
                        </span>
                        <p className="text-xs font-semibold text-slate-200">{gradeInfo.label}</p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{gradeInfo.desc}</p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <a
                        href={`./latihan.html?program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}${activeScheduleId ? `&schedule=${encodeURIComponent(activeScheduleId)}` : ''}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-xs"
                      >
                        <span>Buka & Tinjau Hasil Lengkap di Halaman Latihan (latihan.html) →</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  /* JIKA BELUM DISUBMIT: GERBANG UJIAN TERPISAH (LATIHAN.HTML) */
                  <div className="bg-[#FBF9F5] border border-slate-300 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white font-bold">
                          HALAMAN KHUSUS: latihan.html
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                          1 Kali Pengerjaan (Single Attempt)
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                        Ruang Latihan Mandiri Pekan {pekanData.pekanNumber}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                        Ujian evaluasi pekanan ini dilaksanakan secara mandiri pada halaman web terpisah (<strong>latihan.html</strong>). Pastikan Anda telah menguasai materi sebelum memulai.
                      </p>
                    </div>

                    {/* Ringkasan Ketentuan */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Jumlah Soal</span>
                        <span className="text-base font-extrabold font-mono text-slate-900">{totalQuestions} Butir</span>
                        <span className="text-[11px] text-slate-500 block">Pilihan Ganda</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Standar KKM</span>
                        <span className="text-base font-extrabold font-mono text-emerald-900">{passingThreshold} / 100</span>
                        <span className="text-[11px] text-slate-500 block">Batas Kelulusan</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-[10px] font-mono text-slate-500 uppercase block">Ketentuan</span>
                        <span className="text-base font-extrabold font-mono text-rose-700">1 Kali Ujian</span>
                        <span className="text-[11px] text-slate-500 block">Tidak dapat diulang</span>
                      </div>
                    </div>

                    {/* Alert Box Konfirmasi */}
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-amber-950">
                          Perhatian Sebelum Membuka Halaman Ujian:
                        </p>
                        <p className="leading-relaxed">
                          Ketika Anda membuka halaman ujian dan menyelesaikan latihan, jawaban Anda akan langsung dikunci dan <strong>tidak dapat dikerjakan ulang</strong>. Sistem akan menanyakan konfirmasi kepastian kesiapan Anda sebelum soal dimulai.
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setShowExamConfirmModal(true)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                      >
                        <span>Buka Halaman Ujian (latihan.html) →</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <span className="text-[11px] font-mono text-slate-500">
                        File terpisah: <code>latihan.html</code> / <code>ujian.html</code>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : isSuperAdmin ? (
              <div className="p-8 text-center bg-amber-50/80 rounded-2xl border border-amber-300 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6 text-amber-800" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-950">
                    Belum Ada Soal Latihan untuk Pekan ke-{pekanData.pekanNumber}
                  </h4>
                  <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                    Sebagai Superadmin, Anda dapat membuat latihan soal mandiri baru (pilihan ganda, bobot nilai poin, teks Arab, kunci jawaban & pembahasan) untuk pekan ini di halaman panel Superadmin.
                  </p>
                </div>
                <a
                  href={`./superadmin.html?tab=materi&program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}#section-latihan`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Buat Latihan Pekan Ini Sekarang</span>
                </a>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p>Latihan mandiri untuk materi pekan ini akan dibahas langsung bersama Ustadz Pengampu di ruang kelas Zoom.</p>
                <p className="font-semibold text-slate-700">Waktu Kelas Malam: {activeSchedule.timeWIB} ({activeSchedule.days})</p>
              </div>
            )}
          </section>
        )}

        {/* Tab 5: Kosakata Khusus Pekan Ini */}
        {activeTab === 'mufradat' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-mono font-semibold text-emerald-900 uppercase tracking-wider">
                BAGIAN 5 · KOSAKATA PEKAN {pekanData.pekanNumber}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Kosakata Terkait (المُفْرَدَاتُ الخَاصَّةُ)
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Daftar istilah penting yang dipelajari pada Pekan ke-{pekanData.pekanNumber}.
              </p>
            </div>

            {pekanData.vocabularies && pekanData.vocabularies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {pekanData.vocabularies.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 bg-[#FBF9F5] flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold">
                        {v.type}
                      </span>
                      <span dir="rtl" className="font-arabic text-xl font-bold text-slate-950">
                        {v.ar}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium">
                      {v.id}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                Kosakata untuk pekan ini diselaraskan dengan teks kitab rujukan {pekanData.kitabReference}.
              </div>
            )}
          </section>
        )}

        {/* Bottom Pagination & Navigation */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div>
            {prevPekan !== null ? (
              <button
                type="button"
                onClick={() => handleSelectPekan(activeProgram.id, prevPekan)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>← Pekan Sebelumnya (Pekan {prevPekan})</span>
              </button>
            ) : (
              <span className="text-xs font-mono text-slate-400">Pekan pertama (Muqaddimah)</span>
            )}
          </div>

          <a
            href="./pelajar.html"
            className="px-5 py-2.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors"
          >
            ← Kembali ke Portal Pelajar (pelajar.html)
          </a>

          <div>
            {nextPekan !== null ? (
              <button
                type="button"
                onClick={() => handleSelectPekan(activeProgram.id, nextPekan)}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
              >
                <span>Pekan Selanjutnya (Pekan {nextPekan}) →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-xs font-mono text-slate-400">Pekan terakhir pada level ini</span>
            )}
          </div>
        </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-800 text-xs mt-12">
        <div className="max-w-[1240px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <p>
              Halaman Terpisah Khusus Materi Pembelajaran (<span className="font-mono text-slate-200">materi.html</span>) — Tadribul Lughah
            </p>
            <p className="text-[11px] text-slate-500">
              {isSuperAdmin ? (
                <span className="text-amber-400 font-medium">
                  Terotentikasi sebagai Superadmin ({SUPERADMIN_EMAIL}). Hak akses edit link video aktif.
                </span>
              ) : (
                <span>
                  Video dan materi pembelajaran dikelola khusus oleh Superadmin melalui{' '}
                  <a href="./login.html?role=superadmin" className="text-slate-400 hover:text-amber-300 underline">
                    superadmin.html
                  </a>
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a href="./pelajar.html" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Portal Pelajar (pelajar.html)
            </a>
            <span>·</span>
            <a href="./index.html" className="text-slate-400 hover:text-white">
              Website Utama (index.html)
            </a>
          </div>
        </div>
      </footer>

      {/* Quick Edit Video Modal for Superadmin */}
      {isQuickEditOpen && isSuperAdmin && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 block uppercase font-semibold">
                    MODAL EDIT CEPAT VIDEO YOUTUBE
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    Pekan {selectedPekan} ({activeProgram.code})
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickEditOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Link Video YouTube atau Video ID <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickEditYoutubeInput}
                  onChange={(e) => setQuickEditYoutubeInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between gap-2">
                  <span>
                    YouTube ID:{' '}
                    <strong className="font-mono text-emerald-800">
                      {extractOptionalYouTubeId(quickEditYoutubeInput) || '—'}
                    </strong>
                  </span>
                  {isQuickFetchingMeta && (
                    <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Mengambil judul &amp; channel...
                    </span>
                  )}
                </p>
              </div>

              {/* Preview YouTube */}
              {(() => {
                const previewYtId = extractOptionalYouTubeId(quickEditYoutubeInput);
                return (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800 shadow-sm flex items-center justify-center">
                    {previewYtId ? (
                      <iframe
                        key={previewYtId}
                        className="w-full h-full border-0"
                        src={`https://www.youtube.com/embed/${previewYtId}?rel=0`}
                        title="Pratinjau Video YouTube"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-400 text-xs">
                        <Video className="w-8 h-8 mx-auto mb-1.5 text-emerald-400 opacity-70" />
                        <p>Tempel link atau ID YouTube di atas (judul &amp; channel terisi otomatis).</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Judul Video YouTube
                </label>
                <input
                  type="text"
                  value={quickEditTitle}
                  onChange={(e) => setQuickEditTitle(e.target.value)}
                  placeholder="Judul Video Pembahasan"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Nama Channel / Pemateri
                </label>
                <input
                  type="text"
                  value={quickEditChannel}
                  onChange={(e) => setQuickEditChannel(e.target.value)}
                  placeholder="Nama Channel YouTube / Tadribul Lughah Official"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <a
                  href={`./superadmin.html?tab=materi&program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}`}
                  className="text-xs text-amber-800 hover:underline font-semibold flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Editor Lengkap di superadmin.html →</span>
                </a>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsQuickEditOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Video</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Konfirmasi Buka Halaman Ujian (Yakin Ingin Mengerjakan?) */}
      {showExamConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Apakah Anda Yakin Ingin Mengerjakan?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Latihan Pekan ke-{pekanData.pekanNumber} di halaman <code className="font-bold text-slate-800">latihan.html</code> hanya dapat dikerjakan <strong className="text-rose-700">SATU KALI (1 KALI)</strong>. Jika sudah dikerjakan, Anda <strong className="text-rose-700">TIDAK BISA MENGERJAKAN ULANG</strong>.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <p>✓ Level: <strong>{activeProgram.title}</strong></p>
              <p>✓ Pekan: <strong>Pekan ke-{pekanData.pekanNumber} ({totalQuestions} Butir Soal)</strong></p>
              <p>✓ Batas KKM: <strong>{passingThreshold} / 100 Poin</strong></p>
              <p className="text-[11px] text-amber-800 pt-0.5">
                Pastikan koneksi internet stabil dan Anda telah memahami kaidah sebelum memulai.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowExamConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Batal / Pelajari Lagi
              </button>

              <a
                href={`./latihan.html?program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}${activeScheduleId ? `&schedule=${encodeURIComponent(activeScheduleId)}` : ''}`}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
              >
                ✓ Ya, Saya Yakin Mulai Mengerjakan
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
