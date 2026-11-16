/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  PROGRAM_TRACKS,
  CLASS_SCHEDULES,
  ProgramTrack,
  ClassSchedule,
  applyScheduleStartDateOverrides,
  syncProgramStatesFromServer
} from './data/arabicAcademyData';
import {
  getStudentAccounts,
  getStudentRegistrations,
  syncRegistrationsFromServer,
  StudentAccount,
  saveStudentQuizScore,
  isPekanExamAlreadySubmitted,
  syncQuizScoresFromServer
} from './utils/studentAccountStore';
import {
  getWeeklyPekanContent,
  WeeklyPekanData,
  QuizQuestion,
  getScoreGradeInfo,
  syncCustomMateriFromServer,
  isPekanUnlocked,
  syncPekanUnlockFromServer
} from './data/moduleContentData';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Award,
  Trophy,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X
} from 'lucide-react';

export default function LatihanApp() {
  const [studentSession, setStudentSession] = useState<{
    email: string;
    fullName: string;
    registrationNumber: string;
  } | null>(null);

  const [studentAccount, setStudentAccount] = useState<StudentAccount | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Read URL parameters: ?program=tl-level-1&pekan=1&reg=TL-2026-8452
  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('program') || 'tl-level-1';
  });

  const [selectedPekan, setSelectedPekan] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get('pekan') || '', 10);
    return !isNaN(p) && p >= 1 && p <= 24 ? p : 1;
  });

  const selectedRegNo = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('reg') || '';
  }, []);

  const urlScheduleId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('schedule') || '';
  }, []);

  const [enrolledScheduleId, setEnrolledScheduleId] = useState<string>('');
  const [materiVersion, setMateriVersion] = useState<number>(0);

  const activeProgram =
    PROGRAM_TRACKS.find((p) => p.id === selectedProgramId) || PROGRAM_TRACKS[0];

  const allResolvedSchedules = React.useMemo(
    () => applyScheduleStartDateOverrides(CLASS_SCHEDULES),
    [materiVersion]
  );

  const urlMatchedSchedule = urlScheduleId
    ? allResolvedSchedules.find((s) => s.id === urlScheduleId)
    : undefined;

  const activeSchedule =
    (urlMatchedSchedule && urlMatchedSchedule.programId === activeProgram.id
      ? urlMatchedSchedule
      : undefined) ||
    (enrolledScheduleId
      ? allResolvedSchedules.find((s) => s.id === enrolledScheduleId)
      : undefined) ||
    allResolvedSchedules.find((s) => s.programId === activeProgram.id) ||
    allResolvedSchedules[0];

  const activeScheduleId =
    (urlScheduleId && (!urlMatchedSchedule || urlMatchedSchedule.programId === activeProgram.id)
      ? urlScheduleId
      : '') ||
    enrolledScheduleId ||
    activeSchedule?.id;

  const pekanCompletionKey = `${activeProgram.id}-pekan-${selectedPekan}`;

  const isSuperAdmin = Boolean(
    sessionStorage.getItem('tl_superadmin_verified_session_v1') ||
    sessionStorage.getItem('tl_superadmin_authenticated_session_v1') ||
    sessionStorage.getItem('tl_superadmin_session_mazhar')
  );

  const isCurrentPekanUnlocked = isPekanUnlocked(activeProgram.id, selectedPekan, activeScheduleId);

  const pekanData: WeeklyPekanData = React.useMemo(
    () => getWeeklyPekanContent(activeProgram.id, selectedPekan, activeScheduleId),
    [activeProgram.id, selectedPekan, activeScheduleId, materiVersion]
  );

  const quizzes = pekanData.quizzes || [];
  const totalQuestions = quizzes.length;
  const defaultWeight = 10;
  const totalPossiblePoints = quizzes.reduce((sum, q) => sum + (q.points || defaultWeight), 0);
  const passingThreshold = pekanData.passingScore || 70;

  // State: whether student has confirmed starting the exam
  const [isExamStarted, setIsExamStarted] = useState<boolean>(false);
  const [showStartConfirmModal, setShowStartConfirmModal] = useState<boolean>(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);

  // Active quiz answers
  const [activeAnswers, setActiveAnswers] = useState<Record<number, number>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const initAuthAndScores = async () => {
      const raw = sessionStorage.getItem('tl_student_verified_session_v1');
      const superSession = sessionStorage.getItem('tl_superadmin_verified_session_v1');

      if (!raw && !superSession) {
        window.location.replace('./login.html?role=pelajar');
        return;
      }

      try {
        let currentEmail = '';
        let currentReg = '';

        if (raw) {
          const parsed = JSON.parse(raw);
          if (isMounted) {
            setStudentSession(parsed);
          }
          currentEmail = parsed.email || '';
          currentReg = parsed.registrationNumber || '';
        } else if (superSession) {
          if (isMounted) {
            setStudentSession({
              email: superSession,
              fullName: 'Superadmin Ma\'had (Pratinjau Hasil Latihan)',
              registrationNumber: 'ADMIN'
            });
          }
          currentEmail = superSession;
          currentReg = 'ADMIN';
        }

        const userIdent = currentEmail || currentReg || '';
        // Sinkronisasi status nilai, registrasi, jadwal, dan kunci ujian langsung dari cPanel sebelum render
        await syncQuizScoresFromServer(userIdent);
        await syncRegistrationsFromServer().catch(() => {});
        await syncProgramStatesFromServer().catch(() => {});
        await syncPekanUnlockFromServer().catch(() => {});

        const accounts = getStudentAccounts();
        const match = accounts.find(
          (a) =>
            (currentEmail && a.email.toLowerCase() === currentEmail.toLowerCase()) ||
            (currentReg && a.registrationNumber.toUpperCase() === currentReg.toUpperCase())
        );
        if (match && isMounted) {
          setStudentAccount(match);
        }

        if (userIdent) {
          const userRegs = getStudentRegistrations(userIdent, []);
          const resolvedReg =
            (selectedRegNo
              ? userRegs.find((r) => r.registrationNumber.toUpperCase() === selectedRegNo.toUpperCase())
              : undefined) ||
            userRegs.find((r) => r.selectedProgramId === selectedProgramId) ||
            userRegs[0];
          if (resolvedReg && isMounted) {
            const schedulesNow = applyScheduleStartDateOverrides(CLASS_SCHEDULES);
            const matchedSch =
              schedulesNow.find((s) => s.id === resolvedReg.selectedScheduleId) ||
              schedulesNow.find(
                (s) =>
                  Boolean(resolvedReg.selectedScheduleSummary) &&
                  resolvedReg.selectedScheduleSummary.includes(s.batchCode)
              );
            setEnrolledScheduleId(matchedSch?.id || resolvedReg.selectedScheduleId || '');
          }
        }

        // Restore ujian yang sedang berjalan di sesi browser ini jika belum submit
        const savedActive = sessionStorage.getItem(`tl_exam_active_${pekanCompletionKey}`);
        if (savedActive === 'in_progress') {
          const savedAnswers = sessionStorage.getItem(`tl_exam_answers_${pekanCompletionKey}`);
          if (savedAnswers) {
            try {
              setActiveAnswers(JSON.parse(savedAnswers));
            } catch {
              // Ignore
            }
          }
          if (isMounted) {
            setIsExamStarted(true);
          }
        }
      } catch (err) {
        console.error('Gagal inisialisasi sesi ujian:', err);
      } finally {
        if (isMounted) {
          setAuthChecking(false);
        }
      }
    };

    initAuthAndScores();

    const handleScoresUpdate = () => {
      const accounts = getStudentAccounts();
      const raw = sessionStorage.getItem('tl_student_verified_session_v1');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
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

    const handlePekanUnlockUpdated = () => {
      setMateriVersion((v) => v + 1);
    };

    const scheduleQuery = activeScheduleId ? `&schedule=${encodeURIComponent(activeScheduleId)}` : '';
    window.addEventListener('quiz-scores-updated', handleScoresUpdate);
    window.addEventListener('pekan-unlock-updated', handlePekanUnlockUpdated);
    window.addEventListener('program-open-updated', handlePekanUnlockUpdated);
    window.addEventListener('storage', handleScoresUpdate);

    return () => {
      void scheduleQuery;
      isMounted = false;
      window.removeEventListener('quiz-scores-updated', handleScoresUpdate);
      window.removeEventListener('pekan-unlock-updated', handlePekanUnlockUpdated);
      window.removeEventListener('program-open-updated', handlePekanUnlockUpdated);
      window.removeEventListener('storage', handleScoresUpdate);
    };
  }, [pekanCompletionKey, activeScheduleId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    syncCustomMateriFromServer().catch(() => {});
    const handleMateriChange = () => {
      setMateriVersion((v) => v + 1);
    };
    window.addEventListener('materi-updated', handleMateriChange);
    window.addEventListener('storage', handleMateriChange);
    return () => {
      window.removeEventListener('materi-updated', handleMateriChange);
      window.removeEventListener('storage', handleMateriChange);
    };
  }, []);

  // Check if this student has ALREADY submitted this exam (Locked & 1-time attempt enforced!)
  const submissionStatus = isPekanExamAlreadySubmitted(
    studentSession?.email ||
      studentSession?.registrationNumber ||
      studentAccount?.email ||
      studentAccount?.registrationNumber ||
      '',
    pekanCompletionKey,
    selectedRegNo || studentSession?.registrationNumber
  );

  const isAlreadySubmitted =
    submissionStatus.submitted ||
    studentAccount?.quizScores?.[pekanCompletionKey] !== undefined;

  const recordedScore =
    submissionStatus.score ?? studentAccount?.quizScores?.[pekanCompletionKey];

  const recordedSubmissionTime =
    submissionStatus.submittedAt || studentAccount?.quizSubmittedAt?.[pekanCompletionKey];

  const recordedAnswers =
    submissionStatus.answers || studentAccount?.quizAnswersRecord?.[pekanCompletionKey];

  // Number of answered questions in active session
  const answeredCount = Object.keys(activeAnswers).length;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  // Final score for display when submitted
  const effectiveScore = isAlreadySubmitted ? (recordedScore ?? 0) : 0;
  const isPassed = effectiveScore >= passingThreshold;
  const gradeInfo = getScoreGradeInfo(effectiveScore);

  const handleStartExam = () => {
    if (!isCurrentPekanUnlocked && !isSuperAdmin) {
      showToast('Akses Ditolak: Latihan pekan ini belum dibuka oleh Superadmin/Asatidz.');
      return;
    }
    if (isAlreadySubmitted) {
      showToast('Latihan ini sudah pernah dikerjakan dan telah dikunci permanen.');
      return;
    }
    setShowStartConfirmModal(false);
    setIsExamStarted(true);
    try {
      sessionStorage.setItem(`tl_exam_active_${pekanCompletionKey}`, 'in_progress');
    } catch {
      // Ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Sesi latihan dimulai. Kerjakan dengan jujur dan teliti.');
  };

  const handleSubmitExam = async () => {
    setShowSubmitConfirmModal(false);

    if (isAlreadySubmitted) {
      showToast('Latihan ini sudah pernah dikumpulkan dan dikunci permanen.');
      return;
    }

    // Calculate score
    const earned = quizzes.reduce((sum, q) => {
      const chosen = activeAnswers[q.id];
      return chosen === q.correctIndex ? sum + (q.points || defaultWeight) : sum;
    }, 0);

    const calculatedFinalScore =
      totalPossiblePoints > 0 ? Math.round((earned / totalPossiblePoints) * 100) : 0;

    const userIdent =
      studentSession?.email ||
      studentSession?.registrationNumber ||
      studentAccount?.email ||
      studentAccount?.registrationNumber ||
      'santri';

    if (userIdent) {
      const updated = saveStudentQuizScore(
        userIdent,
        pekanCompletionKey,
        calculatedFinalScore,
        activeAnswers,
        selectedRegNo || studentSession?.registrationNumber
      );
      if (updated) {
        setStudentAccount(updated);
      }
      try {
        sessionStorage.removeItem(`tl_exam_active_${pekanCompletionKey}`);
        sessionStorage.removeItem(`tl_exam_answers_${pekanCompletionKey}`);
      } catch {
        // Ignore
      }
      await syncQuizScoresFromServer(userIdent);
    }

    setIsExamStarted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(
      `Alhamdulillah! Nilai ujian Anda: ${calculatedFinalScore} / 100. Hasil telah dikunci resmi di rapor.`
    );
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-6 text-xs text-slate-500 font-mono">
        Memverifikasi akun santri...
      </div>
    );
  }

  if (!isCurrentPekanUnlocked && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-6 text-slate-800 font-sans">
        <div className="max-w-md w-full bg-white border border-amber-300 rounded-2xl p-8 space-y-6 text-center shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-block">
              Pekan {selectedPekan} Terkunci
            </span>
            <h1 className="text-xl font-bold font-display text-slate-900">
              Latihan Pekan ke-{selectedPekan} Belum Dibuka
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Superadmin / Asatidz belum membuka sesi pembelajaran dan latihan untuk <strong>Pekan ke-{selectedPekan} ({activeProgram.code} — {activeProgram.title})</strong>. Sesi latihan mandiri hanya bisa dikerjakan setelah pekan ini resmi dibuka.
            </p>
          </div>
          <div className="space-y-2">
            <a
              href={`./materi.html?program=${encodeURIComponent(activeProgram.id)}&pekan=1${activeScheduleId ? `&schedule=${encodeURIComponent(activeScheduleId)}` : ''}`}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
            >
              <span>← Buka Materi Pekan 1 (Muqaddimah)</span>
            </a>
            <a
              href="./pelajar.html"
              className="w-full inline-flex items-center justify-center px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            >
              Ke Portal Pelajar (pelajar.html)
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2.5 border border-slate-700 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Banner Peringatan Superadmin Jika Pekan Sedang Dikunci */}
      {isSuperAdmin && !isCurrentPekanUnlocked && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-950 px-4 py-2.5 text-xs">
          <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-800 shrink-0" />
              <span>
                <strong>Pratinjau Superadmin:</strong> Pekan {selectedPekan} ({activeProgram.code}) saat ini berstatus <strong>TERKUNCI</strong> untuk santri. Santri tidak dapat membuka atau mengerjakan kuis ini.
              </span>
            </div>
            <a
              href={`./materi.html?program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}${activeScheduleId ? `&schedule=${encodeURIComponent(activeScheduleId)}` : ''}`}
              className="font-bold underline text-amber-900 shrink-0 hover:text-amber-800"
            >
              Buka Kunci di materi.html →
            </a>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href={`./materi.html?program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}${activeScheduleId ? `&schedule=${encodeURIComponent(activeScheduleId)}` : ''}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors border border-slate-700"
              title="Kembali ke halaman materi pembelajaran (materi.html)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Kembali ke Materi</span>
            </a>

            <div className="hidden sm:block h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-emerald-400 font-bold">
                {activeProgram.code}
              </span>
              <span className="text-slate-500">·</span>
              <span className="font-semibold text-slate-200">
                Pekan ke-{pekanData.pekanNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <span className="hidden md:inline text-slate-400">
              Pelajar: <strong className="text-white">{studentSession?.fullName || 'Akun Santri'}</strong>
            </span>
            <span className="font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px]">
              {studentSession?.registrationNumber || 'Terdaftar'}
            </span>
            <a
              href="./pelajar.html"
              className="text-slate-400 hover:text-white transition-colors text-[11px] font-semibold underline underline-offset-2 ml-1"
            >
              Portal Pelajar ↗
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[960px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {/* =====================================================================
            KONDISI 1: SUDAH PERNAH DIKERJAKAN -> TERKUNCI & TIDAK BISA DIULANG
           ===================================================================== */}
        {isAlreadySubmitted ? (
          <div className="space-y-6">
            {/* Banner Kunci Ujian */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                      STATUS UJIAN: SELESAI & TERKUNCI
                    </span>
                    <h1 className="text-lg sm:text-xl font-bold text-white">
                      Rapor Resmi Latihan Pekan ke-{pekanData.pekanNumber}
                    </h1>
                  </div>
                </div>

                <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 self-start sm:self-auto">
                  1 Kali Kesempatan (Selesai)
                </span>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 leading-relaxed">
                <p>
                  <strong>Catatan Akademik:</strong> Anda telah menyelesaikan latihan mandiri ini{' '}
                  {recordedSubmissionTime ? `pada ${recordedSubmissionTime}` : 'sebelumnya'}.
                  Sesuai ketentuan pembelajaran Tadribul Lughah, setiap latihan pekanan hanya dapat dikerjakan <strong>satu kali</strong> dan <strong>tidak dapat diulang kembali</strong>. Nilai di bawah telah dikunci secara permanen di rapor santri Anda.
                </p>
              </div>

              {/* Scorecard Besar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-slate-800/80 rounded-xl p-5 border border-slate-700">
                <div className="md:col-span-5 flex items-center gap-4 border-b md:border-b-0 md:border-r border-slate-700 pb-4 md:pb-0 md:pr-4">
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                    {isPassed ? (
                      <Trophy className="w-9 h-9 text-amber-500" />
                    ) : (
                      <Award className="w-9 h-9 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      NILAI RAPOR AKHIR
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                        {effectiveScore}
                      </span>
                      <span className="text-xs font-mono text-slate-400">/ 100</span>
                    </div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold mt-1 ${
                        isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {isPassed ? '✓ LULUS KKM' : '✕ BELUM MEMENUHI KKM'}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-7 space-y-1.5">
                  <span
                    dir="rtl"
                    className="font-arabic text-2xl font-bold text-amber-300 block"
                  >
                    {gradeInfo.arabic}
                  </span>
                  <p className="text-xs font-semibold text-slate-200">
                    {gradeInfo.label}
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {gradeInfo.desc}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`./materi.html?program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}${activeScheduleId ? `&schedule=${encodeURIComponent(activeScheduleId)}` : ''}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-xl transition-colors shadow-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Kembali ke Uraian Materi Pekan {selectedPekan}</span>
                </a>

                <a
                  href="./pelajar.html"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
                >
                  <span>Ke Portal Pelajar (Semua Modul) →</span>
                </a>
              </div>
            </div>

            {/* Review Jawaban & Pembahasan (Read-Only Mode) */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 space-y-6 shadow-2xs">
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-900">
                    TINJAUAN JAWABAN & PEMBAHASAN LATIHAN
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                    Read-Only (Terkunci)
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  Evaluasi Soal Pekan ke-{pekanData.pekanNumber}: {pekanData.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Berikut adalah jawaban yang Anda berikan, kunci jawaban yang benar, dan pembahasan kaidahnya.
                </p>
              </div>

              <div className="space-y-6">
                {quizzes.map((q, qIdx) => {
                  const studentAnswer = recordedAnswers?.[q.id];
                  const hasAnswered = studentAnswer !== undefined;
                  const isCorrect = hasAnswered && studentAnswer === q.correctIndex;
                  const questionWeight = q.points || defaultWeight;

                  return (
                    <div
                      key={q.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCorrect
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-rose-50/50 border-rose-300'
                      } space-y-4 shadow-2xs`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                            #{qIdx + 1}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-900">
                            Soal #{qIdx + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-semibold shadow-2xs">
                            Bobot: {questionWeight} Poin
                          </span>
                          <span
                            className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                              isCorrect
                                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                : 'bg-rose-100 text-rose-950 border border-rose-300'
                            }`}
                          >
                            {isCorrect
                              ? `+${questionWeight} Poin (Benar ✓)`
                              : '0 Poin (Kurang Tepat ✕)'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {q.question}
                        </h4>
                        {q.arabicPrompt && (
                          <p
                            dir="rtl"
                            className="font-arabic text-xl sm:text-2xl text-slate-950 pt-1 font-semibold leading-relaxed"
                          >
                            {q.arabicPrompt}
                          </p>
                        )}
                      </div>

                      {/* 4 Options Grid (Read Only) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isStudentSelected = studentAnswer === optIdx;
                          const isOptionCorrect = optIdx === q.correctIndex;

                          return (
                            <div
                              key={optIdx}
                              className={`p-3 text-xs rounded-xl border flex items-center gap-2.5 ${
                                isOptionCorrect
                                  ? 'bg-emerald-100 text-emerald-950 border-emerald-500 font-bold ring-1 ring-emerald-400'
                                  : isStudentSelected && !isOptionCorrect
                                    ? 'bg-rose-100 text-rose-950 border-rose-400 font-semibold'
                                    : 'bg-white/80 text-slate-600 border-slate-200 opacity-80'
                              }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 border ${
                                  isOptionCorrect
                                    ? 'bg-emerald-700 text-white border-emerald-700'
                                    : isStudentSelected
                                      ? 'bg-rose-600 text-white border-rose-600'
                                      : 'bg-slate-100 text-slate-600 border-slate-300'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="flex-1 leading-snug">{opt}</span>
                              {isOptionCorrect && (
                                <span className="text-[10px] font-mono text-emerald-800 font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                                  Kunci
                                </span>
                              )}
                              {isStudentSelected && !isOptionCorrect && (
                                <span className="text-[10px] font-mono text-rose-800 font-bold bg-white px-1.5 py-0.5 rounded border border-rose-300">
                                  Pilihan Anda
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pembahasan */}
                      <div
                        className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                        }`}
                      >
                        <strong className="block mb-1 text-slate-900">
                          {isCorrect ? '✓ Jawaban Anda Tepat!' : '✕ Penjelasan Jawaban:'}
                        </strong>
                        <p className="text-slate-800">
                          <strong>Pembahasan: </strong>
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : !isExamStarted ? (
          /* =====================================================================
              KONDISI 2: BELUM DIKERJAKAN & BELUM MULAI -> PANDUAN & KONFIRMASI
             ===================================================================== */
          <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 space-y-8 shadow-xs">
            {/* Header Briefing */}
            <div className="border-b border-slate-200 pb-6 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-bold">
                  {activeProgram.title}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-emerald-900 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                  Pekan ke-{pekanData.pekanNumber}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight pt-1">
                Latihan Soal & Evaluasi Mandiri Pekan {pekanData.pekanNumber}
              </h1>
              <p dir="rtl" className="font-arabic text-xl sm:text-2xl text-emerald-900 pt-1 font-semibold">
                {pekanData.arabicTitle}
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Kitab Rujukan: <strong>{pekanData.kitabReference}</strong> · Pengampu:{' '}
                <strong>{activeSchedule.instructor}</strong>
              </p>
            </div>

            {/* Detail Ketentuan Ujian */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#FBF9F5] border border-slate-200 space-y-1">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                  Jumlah Soal
                </span>
                <p className="text-xl font-extrabold font-mono text-slate-900">
                  {totalQuestions} Butir Soal
                </p>
                <p className="text-xs text-slate-600">Pilihan Ganda (A, B, C, D)</p>
              </div>

              <div className="p-4 rounded-xl bg-[#FBF9F5] border border-slate-200 space-y-1">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                  Standar Kelulusan (KKM)
                </span>
                <p className="text-xl font-extrabold font-mono text-emerald-900">
                  {passingThreshold} / 100 Poin
                </p>
                <p className="text-xs text-slate-600">Otomatis tuntas jika lulus</p>
              </div>

              <div className="p-4 rounded-xl bg-[#FBF9F5] border border-slate-200 space-y-1">
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                  Batas Pengerjaan
                </span>
                <p className="text-xl font-extrabold font-mono text-rose-700">
                  1 Kali Saja
                </p>
                <p className="text-xs text-slate-600">Tidak dapat diulang kembali</p>
              </div>
            </div>

            {/* Kotak Peringatan Penting (Single Attempt) */}
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-950 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                <span>PERINGATAN PENTING SEBELUM MEMULAI LATIHAN:</span>
              </div>
              <ul className="space-y-2 text-xs text-amber-900 list-disc list-inside leading-relaxed">
                <li>
                  Latihan pekanan ini bersifat <strong>SATU KALI PENGERJAAN</strong> (Single Attempt).
                </li>
                <li>
                  Pastikan Anda telah menyimak video materi di <strong>materi.html</strong> dan membaca uraian kaidah sebelum memulai.
                </li>
                <li>
                  Begitu Anda menekan tombol kumpulkan, nilai akan langsung dihitung, dicatat ke rapor santri, dan <strong>sistem tidak mengizinkan pengulangan latihan</strong>.
                </li>
                <li>
                  Hasil ujian akan langsung disertai predikat akademik bahasa Arab (<em>Mumtaz, Jayyid, dll</em>) dan modul pekan ini otomatis tuntas jika memenuhi KKM.
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <a
                href={`./materi.html?program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}${activeScheduleId ? `&schedule=${encodeURIComponent(activeScheduleId)}` : ''}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Belum Siap, Kembali ke Materi</span>
              </a>

              <button
                type="button"
                onClick={() => setShowStartConfirmModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <span>Mulai Kerjakan Latihan Sekarang →</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* =====================================================================
              KONDISI 3: SESI PENGERJAAN AKTIF (IS_EXAM_STARTED)
             ===================================================================== */
          <div className="space-y-6">
            {/* Sticky Header Kemajuan Ujian */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 sticky top-16 z-20 shadow-md flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold block">
                  SESI PENGERJAAN UJIAN AKTIF (PEKAN {pekanData.pekanNumber})
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  Jawab seluruh pertanyaan pilihan ganda dengan teliti.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    Kemajuan Pengerjaan:
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {answeredCount} / {totalQuestions} Terjawab
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSubmitConfirmModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Kirim Jawaban</span>
                </button>
              </div>
            </div>

            {/* Daftar Soal yang Sedang Dikerjakan */}
            <div className="space-y-6">
              {quizzes.map((q, qIdx) => {
                const selectedOpt = activeAnswers[q.id];
                const hasSelected = selectedOpt !== undefined;
                const questionWeight = q.points || defaultWeight;

                return (
                  <div
                    key={q.id}
                    className={`p-6 rounded-2xl border transition-all ${
                      hasSelected
                        ? 'bg-white border-emerald-300 shadow-sm'
                        : 'bg-white border-slate-200'
                    } space-y-4`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-emerald-950 text-white font-mono text-xs font-bold flex items-center justify-center">
                          #{qIdx + 1}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-900">
                          Soal Nomor {qIdx + 1} dari {totalQuestions}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        Bobot: {questionWeight} Poin
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {q.question}
                      </h3>
                      {q.arabicPrompt && (
                        <p
                          dir="rtl"
                          className="font-arabic text-2xl sm:text-3xl text-slate-950 pt-1 font-semibold leading-relaxed"
                        >
                          {q.arabicPrompt}
                        </p>
                      )}
                    </div>

                    {/* 4 Pilihan Jawaban (Radio Style) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = selectedOpt === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => {
                              setActiveAnswers((prev) => {
                                const next = {
                                  ...prev,
                                  [q.id]: optIdx
                                };
                                try {
                                  sessionStorage.setItem(
                                    `tl_exam_answers_${pekanCompletionKey}`,
                                    JSON.stringify(next)
                                  );
                                } catch {
                                  // Ignore
                                }
                                return next;
                              });
                            }}
                            className={`p-3.5 text-xs text-left rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                              isChosen
                                ? 'bg-emerald-950 text-white border-emerald-950 font-semibold shadow-xs ring-2 ring-emerald-300/60'
                                : 'bg-[#FBF9F5] text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 border ${
                                isChosen
                                  ? 'bg-white text-emerald-950 border-white'
                                  : 'bg-white text-slate-700 border-slate-300'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1 leading-snug">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Final Submit Bar */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  {allAnswered ? (
                    <span className="text-emerald-700 flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Semua {totalQuestions} soal telah Anda jawab.
                    </span>
                  ) : (
                    <span className="text-amber-800 flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      Masih ada {totalQuestions - answeredCount} soal yang belum Anda pilih.
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pastikan seluruh jawaban telah Anda yakini sebelum mengumpulkan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Selesaikan & Kumpulkan Jawaban Ujian</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          MODAL 1: KONFIRMASI MULAI UJIAN (YAKIN INGIN MENGERJAKAN?)
         ===================================================================== */}
      {showStartConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Apakah Anda Yakin Ingin Mengerjakan?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Latihan Pekan ke-{pekanData.pekanNumber} hanya dapat dikerjakan{' '}
                  <strong className="text-rose-700">SATU KALI (1 KALI)</strong>. Jika sudah dimulai dan dikumpulkan, Anda{' '}
                  <strong className="text-rose-700">TIDAK BISA MENGERJAKAN ULANG</strong>.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <p>
                ✓ Jumlah Soal: <strong>{totalQuestions} Butir Pilihan Ganda</strong>
              </p>
              <p>
                ✓ Standar Kelulusan KKM: <strong>{passingThreshold} / 100 Poin</strong>
              </p>
              <p>
                ✓ Nilai otomatis masuk ke rapor profil akun Anda.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowStartConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Batal / Pelajari Lagi
              </button>

              <button
                type="button"
                onClick={handleStartExam}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                ✓ Ya, Saya Yakin Mulai Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: KONFIRMASI PENGUMPULAN AKHIR UJIAN
         ===================================================================== */}
      {showSubmitConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi Pengumpulan Jawaban
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Anda telah menjawab <strong>{answeredCount} dari {totalQuestions} soal</strong>.
                  {!allAnswered && (
                    <span className="block text-rose-600 font-semibold mt-1">
                      ⚠️ Perhatian: Terdapat {totalQuestions - answeredCount} soal yang belum dijawab dan akan bernilai 0 poin jika dikumpulkan sekarang.
                    </span>
                  )}
                  Setelah dikumpulkan, latihan ini akan <strong>langsung dikunci</strong> dan Anda tidak dapat mengubah jawaban lagi.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowSubmitConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Periksa Kembali Jawaban
              </button>

              <button
                type="button"
                onClick={handleSubmitExam}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                ✓ Ya, Kumpulkan Jawaban Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
