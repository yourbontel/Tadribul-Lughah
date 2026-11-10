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
  formatIDR
} from './data/arabicAcademyData';
import {
  getStudentAccounts,
  getStudentRegistrations,
  StudentAccount,
  saveStudentAccount
} from './utils/studentAccountStore';
import {
  getWeeklyPekanContent,
  getProgramPekanList,
  WeeklyPekanData,
  saveCustomMateriOverride,
  extractYouTubeId
} from './data/moduleContentData';
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
  Printer,
  Sparkles,
  Video,
  FileText,
  PlayCircle,
  Youtube,
  ExternalLink,
  Share2,
  ShieldCheck,
  Settings,
  Edit3,
  Save,
  X
} from 'lucide-react';

export default function ModuleReaderApp() {
  const [studentSession, setStudentSession] = useState<{
    email: string;
    fullName: string;
    registrationNumber: string;
  } | null>(null);

  const [studentAccount, setStudentAccount] = useState<StudentAccount | null>(null);
  const [enrolledProgramIds, setEnrolledProgramIds] = useState<string[]>([]);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Read URL parameters: ?program=tl-level-1&pekan=1
  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('program') || 'tl-level-1';
  });

  const [selectedPekan, setSelectedPekan] = useState<number>(() => {
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get('pekan') || '', 10);
    if (!isNaN(p) && p >= 1 && p <= 12) return p;
    const mod = parseInt(params.get('module') || '0', 10);
    return isNaN(mod) ? 1 : mod * 3 + 1;
  });

  const [activeTab, setActiveTab] = useState<'video' | 'silabus' | 'kaidah' | 'contoh' | 'kuis' | 'mufradat'>('video');
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState<string>('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState<boolean>(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [materiVersion, setMateriVersion] = useState<number>(0);

  // Quick edit modal states for Superadmin
  const [isQuickEditOpen, setIsQuickEditOpen] = useState<boolean>(false);
  const [quickEditYoutube, setQuickEditYoutube] = useState<string>('');
  const [quickEditTitle, setQuickEditTitle] = useState<string>('');
  const [quickEditChannel, setQuickEditChannel] = useState<string>('');

  useEffect(() => {
    const handleMateriUpdated = () => {
      setMateriVersion((v) => v + 1);
    };
    window.addEventListener('materi-updated', handleMateriUpdated);
    return () => window.removeEventListener('materi-updated', handleMateriUpdated);
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('tl_student_verified_session_v1');
    if (!raw) {
      setAuthChecking(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setStudentSession(parsed);

      const accounts = getStudentAccounts();
      const match = accounts.find(
        (a) => a.email.toLowerCase() === (parsed.email || '').toLowerCase()
      );
      if (match) {
        setStudentAccount(match);
      }

      // Check all programs student is enrolled in
      const userRegs = getStudentRegistrations(
        parsed.email || parsed.registrationNumber || '',
        []
      );
      const fromRegs = userRegs.map((r) => r.selectedProgramId);
      const fromAcc = match?.enrolledProgramIds || [];
      const combined = Array.from(new Set([...fromRegs, ...fromAcc]));
      const finalEnrolled =
        combined.length > 0 ? combined : [match?.enrolledProgramIds?.[0] || 'tl-level-1'];
      setEnrolledProgramIds(finalEnrolled);

      // Clamp selected level if student is not enrolled in it
      setSelectedProgramId((prev) => {
        if (!finalEnrolled.includes(prev)) {
          return finalEnrolled[0];
        }
        return prev;
      });
    } catch {
      // Ignored
    } finally {
      setAuthChecking(false);
    }
  }, []);

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

    const newUrl = `${window.location.pathname}?program=${encodeURIComponent(progId)}&pekan=${pekanNum}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const activeProgram =
    PROGRAM_TRACKS.find((p) => p.id === selectedProgramId) || PROGRAM_TRACKS[0];

  const activeSchedule =
    CLASS_SCHEDULES.find((s) => s.programId === activeProgram.id) ||
    CLASS_SCHEDULES[0];

  // Get ONLY the data for the selected pekan with auto-reload on materiVersion update!
  const pekanData: WeeklyPekanData = React.useMemo(
    () => getWeeklyPekanContent(activeProgram.id, selectedPekan),
    [activeProgram.id, selectedPekan, materiVersion]
  );

  const parseYouTubeId = (input: string): string | null => {
    if (!input) return null;
    const trimmed = input.trim();
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match && match[1]) {
      return match[1];
    }
    if (/^[\w-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    return null;
  };

  const parsedCustom = parseYouTubeId(customYoutubeUrl);
  const effectiveVideoId = parsedCustom || pekanData.youtubeVideoId || 'fC9zKq38_54';

  const handleOpenQuickEdit = () => {
    setQuickEditYoutube(pekanData.youtubeVideoId || '');
    setQuickEditTitle(pekanData.youtubeTitle || pekanData.title);
    setQuickEditChannel(pekanData.youtubeChannel || 'Tadribul Lughah Official');
    setIsQuickEditOpen(true);
  };

  const handleSaveQuickEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: WeeklyPekanData = {
      ...pekanData,
      youtubeVideoId: extractYouTubeId(quickEditYoutube),
      youtubeTitle: quickEditTitle,
      youtubeChannel: quickEditChannel
    };
    saveCustomMateriOverride(activeProgram.id, selectedPekan, updated);
    setIsQuickEditOpen(false);
    showToast(`Video materi Pekan ${selectedPekan} berhasil disimpan oleh Superadmin!`);
  };

  const allPekanList = getProgramPekanList(activeProgram.id);

  const pekanCompletionKey = `${activeProgram.id}-pekan-${selectedPekan}`;
  const isPekanDone =
    studentAccount?.completedModuleKeys.includes(pekanCompletionKey) || false;

  const handleToggleComplete = () => {
    if (!studentAccount) return;
    const exists = studentAccount.completedModuleKeys.includes(pekanCompletionKey);
    const updatedKeys = exists
      ? studentAccount.completedModuleKeys.filter((k) => k !== pekanCompletionKey)
      : [...studentAccount.completedModuleKeys, pekanCompletionKey];

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

  if (!authChecking && !studentSession) {
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
              Akses Khusus Pelajar Terdaftar
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Halaman materi pembelajaran ini terpisah khusus untuk pelajar yang sudah memiliki akun. Silakan login akun terlebih dahulu untuk membaca materi.
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
  const nextPekan = selectedPekan < 12 ? selectedPekan + 1 : null;

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

          {/* Pekan Switcher Tabs (Pekan 1 sampai Pekan 12) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 text-xs">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold shrink-0">
                Daftar Pekan:
              </span>
              {allPekanList.map((item) => {
                const isCurrent = item.pekanNumber === selectedPekan;
                const isCompleted =
                  studentAccount?.completedModuleKeys.includes(
                    `${activeProgram.id}-pekan-${item.pekanNumber}`
                  );
                return (
                  <button
                    key={item.pekanNumber}
                    type="button"
                    onClick={() => handleSelectPekan(activeProgram.id, item.pekanNumber)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                      isCurrent
                        ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
                        : isCompleted
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Pekan {item.pekanNumber}</span>
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
                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
              title="Simak penjelasan video materi pekan ini langsung dari YouTube"
            >
              <Youtube className="w-4 h-4 text-rose-500 fill-current" />
              <span>Simak Video Materi (YouTube)</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  activeTab === 'video' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-900'
                }`}
              >
                ▶ HD
              </span>
            </button>

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

            {/* Tombol Cepat Buka di YouTube */}
            <a
              href={`https://www.youtube.com/watch?v=${effectiveVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors shrink-0"
              title="Buka langsung video materi di tab baru YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden xl:inline">Buka di YouTube ↗</span>
            </a>

            {/* Tombol Khusus: Edit Materi & Video oleh Superadmin */}
            <a
              href={`./superadmin.html?tab=materi&program=${encodeURIComponent(activeProgram.id)}&pekan=${selectedPekan}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors shrink-0 shadow-2xs"
              title="Edit materi dan video YouTube ini di Halaman Superadmin (superadmin.html)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
              <span>Edit di Superadmin ⚙</span>
            </a>

            {/* Quick Edit Modal Trigger */}
            <button
              type="button"
              onClick={handleOpenQuickEdit}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors shrink-0 cursor-pointer"
              title="Edit cepat link video YouTube materi ini"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Edit Cepat Video</span>
            </button>
          </nav>
        </section>

        {/* Tab Video: Video Pembelajaran Langsung dari YouTube */}
        {activeTab === 'video' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Youtube className="w-4 h-4 fill-current text-rose-600" />
                    VIDEO MATERI KHUSUS PEKAN {pekanData.pekanNumber}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-mono text-slate-500">
                    {pekanData.youtubeChannel || 'Tadribul Lughah Official'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {pekanData.youtubeTitle || `Simak Video Materi: ${pekanData.title}`}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Kitab Rujukan: <strong>{pekanData.kitabReference}</strong> · Jadwal Kelas: <strong>{activeSchedule.timeWIB} ({activeSchedule.days})</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href={`https://www.youtube.com/watch?v=${effectiveVideoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Tonton di YouTube ↗</span>
                </a>
                <button
                  type="button"
                  onClick={handleOpenQuickEdit}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                  title="Edit video YouTube ini"
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
                <button
                  type="button"
                  onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Ganti tautan video YouTube jika ustadz memberikan link rekaman khusus"
                >
                  <span>{showCustomUrlInput ? 'Tutup URL' : 'Ganti URL'}</span>
                </button>
              </div>
            </div>

            {/* Custom URL Input if toggled */}
            {showCustomUrlInput && (
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customYoutubeUrl}
                    onChange={(e) => setCustomYoutubeUrl(e.target.value)}
                    placeholder="Masukkan URL atau Video ID YouTube (contoh: https://www.youtube.com/watch?v=...)"
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-rose-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customYoutubeUrl) {
                        showToast('Link video YouTube dikembalikan ke bawaan pekan.');
                      } else {
                        const parsed = parseYouTubeId(customYoutubeUrl);
                        if (parsed) {
                          showToast(`Video YouTube berhasil dimuat: ${parsed}`);
                        } else {
                          showToast('Format tautan YouTube belum dikenali. Menggunakan video bawaan.');
                        }
                      }
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                  >
                    Terapkan Video
                  </button>
                  {customYoutubeUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomYoutubeUrl('');
                        showToast('Kembali ke video bawaan kurikulum.');
                      }}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-rose-800">
                  Fitur ini memungkinkan santri/ustadz mengganti video dengan rekaman Zoom kelas pekan ini yang diunggah ke YouTube.
                </p>
              </div>
            )}

            {/* Embedded YouTube Player Container */}
            <div className="w-full bg-slate-950 rounded-2xl overflow-hidden shadow-md border border-slate-800">
              <div className="relative aspect-video w-full">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${effectiveVideoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`}
                  title={pekanData.youtubeTitle || `Materi Pekan ${pekanData.pekanNumber}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="font-mono text-white font-semibold">Video Streaming YouTube (1080p HD)</span>
                  <span className="text-slate-500">·</span>
                  <span className="font-mono text-slate-400">ID: {effectiveVideoId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${effectiveVideoId}`);
                      showToast('Tautan video YouTube berhasil disalin!');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3 h-3 text-slate-400" />
                    <span>Salin Link</span>
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
            <div className="border-b border-slate-200 pb-4">
              <span className="text-xs font-mono font-semibold text-emerald-900 uppercase tracking-wider">
                BAGIAN 4 · UJI PEMAHAMAN PEKAN {pekanData.pekanNumber}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                Latihan Soal Mandiri (تَمْرِينَاتُ الأُسْبُوعِ)
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Kuis mandiri untuk memastikan Anda telah menguasai materi Pekan ke-{pekanData.pekanNumber}.
              </p>
            </div>

            {pekanData.quizzes && pekanData.quizzes.length > 0 ? (
              <div className="space-y-6">
                {pekanData.quizzes.map((q) => {
                  const selectedOpt = quizAnswers[q.id];
                  const isSubmitted = quizSubmitted[q.id];
                  const isCorrect = isSubmitted && selectedOpt === q.correctIndex;

                  return (
                    <div
                      key={q.id}
                      className="p-5 rounded-xl border border-slate-200 bg-[#FBF9F5] space-y-4"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-semibold text-emerald-900">
                          Soal #{q.id}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {q.question}
                        </h4>
                        {q.arabicPrompt && (
                          <p dir="rtl" className="font-arabic text-xl text-slate-950 pt-1 font-semibold">
                            {q.arabicPrompt}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {q.options.map((opt, optIdx) => {
                          const isOptionSelected = selectedOpt === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => {
                                setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
                                setQuizSubmitted((prev) => ({ ...prev, [q.id]: true }));
                              }}
                              className={`p-3 text-xs text-left rounded-lg border transition-all ${
                                isSubmitted && optIdx === q.correctIndex
                                  ? 'bg-emerald-100 text-emerald-950 border-emerald-500 font-bold'
                                  : isSubmitted && isOptionSelected && !isCorrect
                                    ? 'bg-rose-100 text-rose-950 border-rose-400 font-semibold'
                                    : isOptionSelected
                                      ? 'bg-emerald-900 text-white border-emerald-900 font-semibold'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full border border-current text-[11px] font-mono flex items-center justify-center shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {isSubmitted && (
                        <div
                          className={`p-3.5 rounded-lg text-xs leading-relaxed border ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                              : 'bg-rose-50 border-rose-200 text-rose-950'
                          }`}
                        >
                          <strong className="block mb-1">
                            {isCorrect ? '✓ Jawaban Anda Benar!' : '✕ Jawaban Kurang Tepat.'}
                          </strong>
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
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
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-800 text-xs mt-12">
        <div className="max-w-[1240px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            Halaman Terpisah Khusus Materi Pembelajaran (<span className="font-mono text-slate-200">materi.html</span>) — Tadribul Lughah
          </p>
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
      {isQuickEditOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-rose-500 fill-current" />
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
                  Tautan URL YouTube atau Video ID <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickEditYoutube}
                  onChange={(e) => setQuickEditYoutube(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... atau fC9zKq38_54"
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  ID Terdeteksi: <strong className="font-mono text-rose-700">{extractYouTubeId(quickEditYoutube)}</strong>
                </p>
              </div>

              {/* Preview */}
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-slate-800 shadow-sm">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(quickEditYoutube)}?rel=0`}
                  title="Pratinjau Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Judul Video YouTube
                </label>
                <input
                  type="text"
                  value={quickEditTitle}
                  onChange={(e) => setQuickEditTitle(e.target.value)}
                  placeholder="Judul Video Pembahasan"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Nama Channel / Pengampu
                </label>
                <input
                  type="text"
                  value={quickEditChannel}
                  onChange={(e) => setQuickEditChannel(e.target.value)}
                  placeholder="Tadribul Lughah Official"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
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
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
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
    </div>
  );
}
