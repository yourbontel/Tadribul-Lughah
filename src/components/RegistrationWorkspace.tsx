import React, { useState, useEffect } from 'react';
import {
  PROGRAM_TRACKS,
  CLASS_SCHEDULES,
  ProgramTrack,
  ClassSchedule,
  RegistrationRecord,
  formatIDR
} from '../data/arabicAcademyData';
import {
  CheckCircle2,
  Download,
  Search,
  Printer,
  UserPlus,
  FileText,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  KeyRound,
  Lock,
  LogIn,
  UserCheck,
  ShieldCheck,
  Sparkles,
  BookOpen
} from 'lucide-react';
import {
  StudentAccount,
  getStudentAccounts,
  getActiveStudentSession,
  clearActiveStudentSession,
  registerNewStudentAccount,
  loginStudentAccount,
  enrollStudentInProgram,
  getStudentRegistrations
} from '../utils/studentAccountStore';

interface RegistrationWorkspaceProps {
  programs?: ProgramTrack[];
  schedules?: ClassSchedule[];
  selectedProgramId: string;
  selectedScheduleId: string;
  registrations: RegistrationRecord[];
  onSelectProgram: (programId: string) => void;
  onSelectSchedule: (scheduleId: string) => void;
  onSubmitRegistration: (newRecord: RegistrationRecord) => void;
  mode: 'form' | 'lookup';
  onNavigatePage: (
    page: 'beranda' | 'kurikulum' | 'jadwal' | 'pendaftaran' | 'cek-status'
  ) => void;
}

export const RegistrationWorkspace: React.FC<RegistrationWorkspaceProps> = ({
  programs = PROGRAM_TRACKS,
  schedules = CLASS_SCHEDULES,
  selectedProgramId,
  selectedScheduleId,
  registrations,
  onSelectProgram,
  onSelectSchedule,
  onSubmitRegistration,
  mode,
  onNavigatePage
}) => {
  // Active Student Account State
  const [activeAccount, setActiveAccount] = useState<StudentAccount | null>(() => {
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

  // Account Gate Sub-mode ('register' = Buat Akun Baru, 'login' = Sudah Punya Akun)
  const [accountSubMode, setAccountSubMode] = useState<'register' | 'login'>('register');

  // Account Creation Form Fields
  const [newFullName, setNewFullName] = useState('');
  const [newGender, setNewGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [newEmail, setNewEmail] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newOccupation, setNewOccupation] = useState('Mahasiswa / Akademisi');
  const [newPassword, setNewPassword] = useState('');

  // Account Login Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Program Enrollment Section State
  const [targetedProgramId, setTargetedProgramId] = useState<string>(selectedProgramId || 'tl-level-1');
  const [targetedScheduleId, setTargetedScheduleId] = useState<string>(selectedScheduleId || 'sch-lv1-malam');
  const [learningGoal, setLearningGoal] = useState('');

  // Messages & Submitted Confirmation
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<RegistrationRecord | null>(null);

  // Lookup State
  const [searchQuery, setSearchQuery] = useState('');

  // Listen for session changes or reload active account
  useEffect(() => {
    const session = getActiveStudentSession();
    if (session) {
      const accounts = getStudentAccounts();
      const matched = accounts.find(
        (a) =>
          a.registrationNumber.toUpperCase() === session.registrationNumber.toUpperCase() ||
          a.email.toLowerCase() === session.email.toLowerCase()
      );
      if (matched) {
        setActiveAccount(matched);
      }
    }
  }, []);

  // Compute active target program & schedule
  const activeProgram =
    programs.find((p) => p.id === targetedProgramId) ||
    programs[0] ||
    PROGRAM_TRACKS[0];

  const availableSchedulesForProgram = schedules.filter(
    (s) => s.programId === activeProgram.id
  );

  const activeSchedule =
    schedules.find((s) => s.id === targetedScheduleId) ||
    availableSchedulesForProgram[0] ||
    schedules[0] ||
    CLASS_SCHEDULES[0];

  useEffect(() => {
    const belongs = availableSchedulesForProgram.some((s) => s.id === targetedScheduleId);
    if (!belongs && availableSchedulesForProgram.length > 0) {
      setTargetedScheduleId(availableSchedulesForProgram[0].id);
      onSelectSchedule(availableSchedulesForProgram[0].id);
    }
  }, [targetedProgramId, schedules]);

  // Registrations associated with the active student account
  const accountRegistrations = activeAccount
    ? getStudentRegistrations(activeAccount.email, registrations)
    : [];

  const enrolledProgramIds = new Set<string>();
  if (activeAccount?.enrolledProgramIds) {
    activeAccount.enrolledProgramIds.forEach((id) => enrolledProgramIds.add(id));
  }
  accountRegistrations.forEach((r) => {
    if (r.selectedProgramId) enrolledProgramIds.add(r.selectedProgramId);
  });

  // Handle Account Registration (Step 1)
  const handleRegisterAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = registerNewStudentAccount({
      fullName: newFullName,
      gender: newGender,
      email: newEmail,
      whatsapp: newWhatsapp,
      city: newCity,
      occupation: newOccupation,
      password: newPassword
    });

    if (!res.ok) {
      setErrorMessage(res.reason);
      return;
    }

    setActiveAccount(res.account);
    setSuccessBanner(
      `Akun Pelajar Anda atas nama "${res.account.fullName}" (${res.account.email}) berhasil dibuat! Silakan lanjutkan memilih program level di bawah ini.`
    );
  };

  // Handle Account Login (Step 1)
  const handleLoginAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = loginStudentAccount(loginIdentifier, loginPassword);
    if (!res.ok) {
      setErrorMessage(res.reason);
      return;
    }

    setActiveAccount(res.account);
    setSuccessBanner(
      `Selamat datang kembali, ${res.account.fullName}! Akun Anda aktif. Anda dapat mendaftar level baru di bawah.`
    );
  };

  // Handle Logout / Switch Account
  const handleSwitchAccount = () => {
    clearActiveStudentSession();
    setActiveAccount(null);
    setSuccessBanner(null);
    setErrorMessage(null);
    setSubmittedRecord(null);
  };

  // Handle Enrolling in a Program (Step 2 - 1 Account for up to 4 Programs)
  const handleConfirmEnrollment = (programToEnroll: ProgramTrack) => {
    setErrorMessage(null);

    if (!activeAccount) {
      setErrorMessage('Anda harus masuk atau membuat akun terlebih dahulu sebelum mendaftar program.');
      return;
    }

    if (programToEnroll.registrationOpen === false) {
      setErrorMessage(
        `Mohon maaf, pendaftaran untuk Level ${programToEnroll.levelNumber} (${programToEnroll.title}) saat ini sedang ditutup (OFF) oleh Superadmin.`
      );
      return;
    }

    if (enrolledProgramIds.has(programToEnroll.id)) {
      setErrorMessage(
        `Akun Anda sudah terdaftar pada ${programToEnroll.title}. Anda tidak perlu mendaftar ulang pada level ini.`
      );
      return;
    }

    const progSchedules = schedules.filter((s) => s.programId === programToEnroll.id);
    const chosenSchedule =
      progSchedules.find((s) => s.id === targetedScheduleId) ||
      progSchedules[0] ||
      schedules[0] ||
      CLASS_SCHEDULES[0];

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
      fullName: activeAccount.fullName,
      gender: activeAccount.gender || 'Laki-laki',
      email: activeAccount.email,
      whatsapp: activeAccount.whatsapp,
      occupation: activeAccount.occupation || 'Pelajar Terdaftar',
      city: activeAccount.city || 'Indonesia',
      selectedProgramId: programToEnroll.id,
      selectedProgramName: programToEnroll.title,
      selectedScheduleId: chosenSchedule.id,
      selectedScheduleSummary: `${chosenSchedule.batchCode} · ${chosenSchedule.days} (${chosenSchedule.timeWIB}) · Online`,
      learningGoal:
        learningGoal.trim() ||
        `Menguasai kaidah ${programToEnroll.category === 'shorof' ? 'Shorof' : 'Nahwu'} secara sistematis melalui Tadribul Lughah Level ${programToEnroll.levelNumber}.`,
      totalTuitionIDR: programToEnroll.tuitionIDR,
      registeredAt: nowStr,
      status: 'Terverifikasi — Menunggu Orientasi'
    };

    // Attach program registration to existing student account
    enrollStudentInProgram(activeAccount.email, programToEnroll.id, newRegNo);

    // Refresh active account in state
    const accounts = getStudentAccounts();
    const updatedAcc = accounts.find((a) => a.email.toLowerCase() === activeAccount.email.toLowerCase());
    if (updatedAcc) {
      setActiveAccount(updatedAcc);
    }

    onSubmitRegistration(newRecord);
    setSubmittedRecord(newRecord);
    setSuccessBanner(
      `Pendaftaran untuk ${programToEnroll.title} berhasil! Nomor Registrasi baru Anda: ${newRegNo}.`
    );
  };

  const handleDownloadReceipt = (rec: RegistrationRecord) => {
    const content = [
      '==============================================================',
      '        TADRIBUL LUGHAH — BUKTI PENDAFTARAN RESMI             ',
      '==============================================================',
      `Nomor Registrasi   : ${rec.registrationNumber}`,
      `Tanggal Daftar     : ${rec.registeredAt}`,
      `Status Pendaftaran : ${rec.status}`,
      '--------------------------------------------------------------',
      'DATA AKUN PESERTA DIDIK:',
      `Nama Lengkap       : ${rec.fullName}`,
      `Jenis Kelamin      : ${rec.gender || 'Laki-laki'}`,
      `Email Akun         : ${rec.email}`,
      `Nomor WhatsApp     : ${rec.whatsapp}`,
      `Profesi / Aktivitas: ${rec.occupation}`,
      `Kota Domisili      : ${rec.city}`,
      '--------------------------------------------------------------',
      'RINCIAN LEVEL & JADWAL KELAS ONLINE:',
      `Level Pilihan      : ${rec.selectedProgramName}`,
      `Kode & Jadwal Kelas: ${rec.selectedScheduleSummary}`,
      `Target Belajar     : ${rec.learningGoal}`,
      '--------------------------------------------------------------',
      'RINCIAN BIAYA PENDIDIKAN:',
      `Biaya per Level    : ${formatIDR(rec.totalTuitionIDR)} / Level`,
      `Cicilan per Bulan  : ${formatIDR(Math.round(rec.totalTuitionIDR / 6))} / Bulan (Dibagi 6 Bulan)`,
      '==============================================================',
      'Simpan bukti pendaftaran ini untuk sesi orientasi kelas online.'
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bukti_Pendaftaran_${rec.registrationNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredRegistrations = registrations.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.registrationNumber.toLowerCase().includes(q) ||
      r.fullName.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.selectedProgramName.toLowerCase().includes(q)
    );
  });

  const sampleAccounts = getStudentAccounts().slice(0, 3);

  return (
    <section className="py-12 sm:py-16 bg-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200">
          <div>
            <p className="text-xs font-semibold text-emerald-800 tracking-wide mb-2 uppercase font-mono">
              {mode === 'form'
                ? 'Sistem Admisi Pelajar · 1 Akun untuk 4 Program Level'
                : 'Direktori & Verifikasi Peserta · Tadribul Lughah'}
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-display">
              {mode === 'form'
                ? 'Pendaftaran Online Tadribul Lughah (Level 1–4)'
                : 'Cek Status Pendaftaran & Nomor Registrasi Peserta'}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              {mode === 'form' ? (
                <>
                  Pendaftar wajib memiliki <strong>Akun Pelajar</strong> terlebih dahulu. Dengan <strong>1 akun</strong>, Anda dapat mendaftar hingga <strong>4 program level</strong> tanpa perlu membuat akun lagi. Biaya per level <strong>Rp 510.000</strong> (cicilan 6x <strong>Rp 85.000/bln</strong>). Seluruh kelas online malam (20.00 – 22.00 WIB).
                </>
              ) : (
                <>
                  Verifikasi status pendaftaran kelas malam online dengan memasukkan Nomor Registrasi (misal: <span className="font-mono">TL-2026-8419</span>) atau nama peserta.
                </>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {mode === 'form' ? (
              <button
                type="button"
                onClick={() => onNavigatePage('cek-status')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                Cek Status Pendaftar ({registrations.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigatePage('pendaftaran')}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Pendaftaran Program Baru
              </button>
            )}
          </div>
        </div>

        {mode === 'form' ? (
          submittedRecord ? (
            /* Confirmation & Digital Student ID Card View */
            <div className="mt-10 bg-white border border-slate-200 rounded-xl p-6 sm:p-10 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-200">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>PENDAFTARAN PROGRAM BERHASIL</span>
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 font-display">
                    Ahlan wa Sahlan, {submittedRecord.fullName}
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Level <strong className="text-slate-900">{submittedRecord.selectedProgramName}</strong> berhasil didaftarkan di bawah akun Anda dengan nomor registrasi{' '}
                    <span className="font-mono font-semibold text-emerald-900">
                      {submittedRecord.registrationNumber}
                    </span>
                    .
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="./pelajar.html"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Buka Portal Pelajar (pelajar.html)</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDownloadReceipt(submittedRecord)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Bukti (.TXT)
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Kartu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedRecord(null);
                      setSuccessBanner(null);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    Daftar Level Lainnya dengan Akun Ini
                  </button>
                </div>
              </div>

              {/* Official Student Card Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 bg-slate-900 text-white rounded-xl p-6 sm:p-8 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                      <p className="text-xs text-emerald-400 font-mono uppercase tracking-wider">
                        Bithaqah Thullabiyyah · Kartu Peserta Resmi
                      </p>
                      <h3 className="text-xl font-semibold mt-1">
                        Program Pembelajaran Bahasa Arab Tadribul Lughah
                      </h3>
                    </div>
                    <p
                      dir="rtl"
                      className="font-arabic text-2xl text-emerald-300 shrink-0"
                    >
                      تَدْرِيبُ اللُّغَةِ
                    </p>
                  </div>

                  <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-slate-400">
                        Nama Lengkap & Jenis Kelamin
                      </p>
                      <p className="text-base font-semibold mt-0.5">
                        {submittedRecord.fullName}
                      </p>
                      <p className="text-xs text-emerald-300 mt-0.5">
                        {submittedRecord.gender || 'Laki-laki'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">
                        Nomor Registrasi Level Ini
                      </p>
                      <p className="text-base font-mono tabular-nums font-semibold text-emerald-300 mt-0.5">
                        {submittedRecord.registrationNumber}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-slate-400">
                        Level Program Pilihan
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {submittedRecord.selectedProgramName}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-slate-400">
                        Jadwal & Kelas Online (20.00 – 22.00 WIB)
                      </p>
                      <p className="text-sm font-mono tabular-nums mt-0.5">
                        {submittedRecord.selectedScheduleSummary}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
                    <span>Terdaftar: {submittedRecord.registeredAt}</span>
                    <span className="text-emerald-300 font-medium">
                      Status: {submittedRecord.status}
                    </span>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5">
                  <h3 className="text-base font-semibold text-slate-900">
                    Rincian Biaya & Orientasi Online
                  </h3>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Moda Pembelajaran</span>
                      <span className="font-medium text-slate-900">
                        100% Online Live (Zoom)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Biaya per Level</span>
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {formatIDR(submittedRecord.totalTuitionIDR)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Cicilan per Bulan (Dibagi 6)</span>
                      <span className="font-mono tabular-nums font-semibold text-emerald-800">
                        {formatIDR(Math.round(submittedRecord.totalTuitionIDR / 6))} / bulan
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-600 leading-relaxed">
                    <p className="font-semibold text-slate-900">
                      Informasi Akun Pelajar Anda:
                    </p>
                    <p>
                      Akun ini dapat digunakan untuk login ke <span className="font-mono text-emerald-900">pelajar.html</span> atau mendaftar level lainnya (Level 1, 2, 3, dan 4) tanpa perlu membuat akun lagi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Registration Flow: Step 1 (Account Gate) -> Step 2 (4 Programs) */
            <div className="mt-10 space-y-8">
              {/* Step Navigation Progress Indicator */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      activeAccount
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-emerald-900 text-white'
                    }`}
                  >
                    {activeAccount ? '✓' : '1'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">
                      Langkah 1: Akun Pelajar
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {activeAccount
                        ? `Terhubung: ${activeAccount.fullName} (${activeAccount.email})`
                        : 'Wajib memiliki akun sebelum memilih program'}
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block flex-1 max-w-[80px] border-t border-slate-300"></div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      activeAccount
                        ? 'bg-emerald-900 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-300'
                    }`}
                  >
                    2
                  </div>
                  <div>
                    <p
                      className={`text-xs font-semibold ${
                        activeAccount ? 'text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      Langkah 2: Pilih Program Level (1–4)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      1 akun untuk hingga 4 program level
                    </p>
                  </div>
                </div>

                {activeAccount && (
                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className="text-xs font-medium text-slate-600 hover:text-rose-700 underline transition-colors shrink-0"
                  >
                    Ganti Akun Pelajar
                  </button>
                )}
              </div>

              {/* Status / Alert Messages */}
              {errorMessage && (
                <div
                  role="alert"
                  className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3 text-xs text-rose-950"
                >
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{errorMessage}</span>
                </div>
              )}

              {successBanner && (
                <div
                  role="status"
                  className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-3 text-xs text-emerald-950"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{successBanner}</span>
                </div>
              )}

              {/* ==============================================================
                  CONDITION 1: NO ACTIVE ACCOUNT -> STEP 1 (MANDATORY ACCOUNT)
                 ============================================================== */}
              {!activeAccount ? (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  {/* Account Gate Top Notice */}
                  <div className="p-6 sm:p-8 bg-slate-900 text-white space-y-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>LANGKAH 1 · WAJIB MEMILIKI AKUN SEBELUM MENDAFTAR</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-display">
                      Buat atau Masuk ke Akun Pelajar Anda
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                      Setiap peserta wajib memiliki <strong>1 Akun Pelajar</strong>. Cukup buat akun 1 kali, dan akun tersebut dapat Anda gunakan untuk mendaftar ke <strong>4 level program</strong> (Level 1 Nahwu Dasar, Level 2 Nahwu Menengah, Level 3 Nahwu Lanjutan, Level 4 Shorof) tanpa harus mengisi data diri atau membuat akun ulang!
                    </p>
                  </div>

                  {/* Sub-mode Switcher */}
                  <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100 p-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountSubMode('register');
                        setErrorMessage(null);
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors ${
                        accountSubMode === 'register'
                          ? 'bg-emerald-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-white/60'
                      }`}
                    >
                      <UserPlus className="w-4 h-4 shrink-0" />
                      <span>1. Buat Akun Pelajar Baru</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAccountSubMode('login');
                        setErrorMessage(null);
                      }}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors ${
                        accountSubMode === 'login'
                          ? 'bg-emerald-900 text-white shadow-xs'
                          : 'text-slate-700 hover:bg-white/60'
                      }`}
                    >
                      <LogIn className="w-4 h-4 shrink-0" />
                      <span>2. Sudah Punya Akun? Masuk</span>
                    </button>
                  </div>

                  <div className="p-6 sm:p-8">
                    {accountSubMode === 'register' ? (
                      /* Form Buat Akun Baru */
                      <form onSubmit={handleRegisterAccount} noValidate className="space-y-6">
                        <div className="pb-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-base font-semibold text-slate-900">
                            Isi Data Akun Pelajar Terlebih Dahulu
                          </h3>
                          <span className="text-xs text-slate-500">
                            Semua kolom bertanda (*) wajib diisi
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label
                              htmlFor="acc-fullname"
                              className="block text-xs font-semibold text-slate-800 mb-1.5"
                            >
                              Nama Lengkap Sesuai KTP / Identitas *
                            </label>
                            <input
                              id="acc-fullname"
                              type="text"
                              required
                              value={newFullName}
                              onChange={(e) => setNewFullName(e.target.value)}
                              placeholder="Contoh: Ahmad Zaki Al-Manshur"
                              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 text-slate-900"
                            />
                          </div>

                          <div>
                            <span className="block text-xs font-semibold text-slate-800 mb-1.5">
                              Jenis Kelamin *
                            </span>
                            <div
                              role="radiogroup"
                              aria-label="Jenis Kelamin"
                              className="grid grid-cols-2 gap-2.5"
                            >
                              {(['Laki-laki', 'Perempuan'] as const).map((option) => {
                                const isChecked = newGender === option;
                                return (
                                  <label
                                    key={option}
                                    className={`flex items-center gap-2.5 px-3.5 py-2.5 text-sm rounded-lg border cursor-pointer transition-colors ${
                                      isChecked
                                        ? 'bg-emerald-50 border-emerald-800 text-emerald-950 font-semibold'
                                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="acc-gender"
                                      value={option}
                                      checked={isChecked}
                                      onChange={() => setNewGender(option)}
                                      className="accent-emerald-900 w-4 h-4 shrink-0"
                                    />
                                    <span>{option}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="acc-email"
                              className="block text-xs font-semibold text-slate-800 mb-1.5"
                            >
                              Alamat Email Aktif (Sebagai Identitas Login) *
                            </label>
                            <input
                              id="acc-email"
                              type="email"
                              required
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="nama@email.com"
                              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 text-slate-900"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="acc-whatsapp"
                              className="block text-xs font-semibold text-slate-800 mb-1.5"
                            >
                              Nomor WhatsApp Aktif (Untuk Info Zoom & Modul) *
                            </label>
                            <input
                              id="acc-whatsapp"
                              type="tel"
                              required
                              value={newWhatsapp}
                              onChange={(e) => setNewWhatsapp(e.target.value)}
                              placeholder="0812-xxxx-xxxx"
                              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 text-slate-900 font-mono tabular-nums"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="acc-city"
                              className="block text-xs font-semibold text-slate-800 mb-1.5"
                            >
                              Kota / Kabupaten Domisili *
                            </label>
                            <input
                              id="acc-city"
                              type="text"
                              required
                              value={newCity}
                              onChange={(e) => setNewCity(e.target.value)}
                              placeholder="Contoh: Jakarta / Bandung / Surabaya"
                              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 text-slate-900"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor="acc-occupation"
                              className="block text-xs font-semibold text-slate-800 mb-1.5"
                            >
                              Latar Belakang / Aktivitas
                            </label>
                            <select
                              id="acc-occupation"
                              value={newOccupation}
                              onChange={(e) => setNewOccupation(e.target.value)}
                              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 text-slate-900"
                            >
                              <option value="Mahasiswa / Akademisi">Mahasiswa / Akademisi</option>
                              <option value="Profesional / Karyawan">Profesional / Karyawan</option>
                              <option value="Guru / Pengajar">Guru / Pengajar</option>
                              <option value="Pelajar / Santri">Pelajar / Santri</option>
                              <option value="Wiraswasta / Umum">Wiraswasta / Umum</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label
                              htmlFor="acc-password"
                              className="block text-xs font-semibold text-slate-800 mb-1.5"
                            >
                              Buat Kata Sandi Akun Pelajar (Minimal 6 Karakter) *
                            </label>
                            <input
                              id="acc-password"
                              type="password"
                              required
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Minimal 6 karakter"
                              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 text-slate-900"
                            />
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                              <KeyRound className="w-3 h-3 text-emerald-800 shrink-0" />
                              <span>
                                Digunakan untuk masuk ke akun Anda kapan saja dan mengakses portal belajar (<span className="font-mono">pelajar.html</span>).
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <p className="text-xs text-slate-500">
                            Setelah akun dibuat, Anda dapat langsung memilih dan mendaftar 1 atau beberapa program level di bawah ini.
                          </p>
                          <button
                            type="submit"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
                          >
                            <span>Buat Akun & Lanjut ke Pilihan Program (Level 1–4)</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    ) : (
                      /* Form Masuk Akun yang Sudah Ada */
                      <form onSubmit={handleLoginAccount} className="space-y-5 max-w-lg">
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-slate-900">
                            Masuk dengan Akun Pelajar Terdaftar
                          </h3>
                          <p className="text-xs text-slate-600">
                            Jika Anda sudah pernah membuat akun atau mendaftar program sebelumnya, silakan masukkan Email atau Nomor Registrasi beserta kata sandi.
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor="exist-id"
                            className="block text-xs font-semibold text-slate-800 mb-1"
                          >
                            Email Pelajar / Nomor Registrasi *
                          </label>
                          <input
                            id="exist-id"
                            type="text"
                            required
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            placeholder="nama@email.com atau TL-2026-xxxx"
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 text-slate-900"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="exist-pass"
                            className="block text-xs font-semibold text-slate-800 mb-1"
                          >
                            Kata Sandi Akun Pelajar *
                          </label>
                          <input
                            id="exist-pass"
                            type="password"
                            required
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Masukkan kata sandi akun Anda"
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 text-slate-900"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Masuk & Lanjut ke Pilihan Program (Level 1–4)</span>
                        </button>

                        {/* Quick fill sample accounts for fast demonstration */}
                        <div className="pt-4 border-t border-slate-200 space-y-2">
                          <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                            Pilih Cepat Akun Terdaftar (Demo / Uji Coba):
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {sampleAccounts.map((acc) => (
                              <button
                                key={acc.registrationNumber}
                                type="button"
                                onClick={() => {
                                  setLoginIdentifier(acc.email);
                                  setLoginPassword(acc.password);
                                  setErrorMessage(null);
                                }}
                                className="px-2.5 py-1 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-800 transition-colors"
                              >
                                {acc.fullName.split(' ')[0]} ({acc.registrationNumber})
                              </button>
                            ))}
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ) : (
                /* ==============================================================
                    CONDITION 2: ACCOUNT IS ACTIVE -> STEP 2 (ENROLL IN 4 LEVELS)
                   ============================================================== */
                <div className="space-y-8">
                  {/* Active Account Identity Card */}
                  <div className="bg-white border border-emerald-300 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-900 text-white flex items-center justify-center shrink-0">
                        <UserCheck className="w-6 h-6 text-emerald-300" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wide">
                            AKUN PELAJAR TERHUBUNG
                          </span>
                          <span className="px-2 py-0.5 text-[11px] font-mono bg-emerald-100 text-emerald-900 rounded-md font-semibold">
                            {activeAccount.registrationNumber}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">
                          {activeAccount.fullName}
                        </h2>
                        <p className="text-xs text-slate-600">
                          {activeAccount.gender || 'Laki-laki'} · {activeAccount.email} · {activeAccount.whatsapp} · {activeAccount.city || 'Indonesia'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                      <a
                        href="./pelajar.html"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Portal Pelajar (pelajar.html)</span>
                      </a>
                      <button
                        type="button"
                        onClick={handleSwitchAccount}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                      >
                        Keluar / Ganti Akun
                      </button>
                    </div>
                  </div>

                  {/* 1 Account for 4 Programs Banner */}
                  <div className="bg-emerald-950 text-white rounded-xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>1 AKUN UNTUK 4 PROGRAM LEVEL SEKALIGUS</span>
                      </div>
                      <h3 className="text-xl font-bold font-display text-white">
                        Daftar Program Level 1 hingga Level 4 Tanpa Buat Akun Lagi
                      </h3>
                      <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                        Akun Anda dapat digunakan untuk mengambil <strong>Level 1 (Nahwu Dasar)</strong>, <strong>Level 2 (Nahwu Menengah)</strong>, <strong>Level 3 (Nahwu Lanjutan)</strong>, dan <strong>Level 4 (Shorof)</strong>. Silakan pilih level yang ingin Anda ikuti di bawah ini.
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-900/60 border border-emerald-800 text-center shrink-0">
                      <p className="text-xs text-emerald-200">Biaya per Level</p>
                      <p className="text-xl font-bold text-white font-mono mt-0.5">
                        Rp 510.000
                      </p>
                      <p className="text-[11px] font-mono text-emerald-300 mt-0.5">
                        Cicilan 6x: Rp 85.000 / bulan
                      </p>
                    </div>
                  </div>

                  {/* 4 Program Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {programs.slice(0, 4).map((prog) => {
                      const isEnrolled = enrolledProgramIds.has(prog.id);
                      const matchingReg = accountRegistrations.find(
                        (r) => r.selectedProgramId === prog.id
                      );
                      const isClosed = prog.registrationOpen === false;
                      const isSelectedToEnroll = targetedProgramId === prog.id;

                      const progSchedules = schedules.filter((s) => s.programId === prog.id);
                      const defaultSchedule = progSchedules[0] || schedules[0] || CLASS_SCHEDULES[0];

                      return (
                        <div
                          key={prog.id}
                          className={`rounded-xl border transition-all flex flex-col justify-between overflow-hidden ${
                            isEnrolled
                              ? 'bg-emerald-50/50 border-emerald-300'
                              : isSelectedToEnroll
                                ? 'bg-white border-emerald-900 ring-2 ring-emerald-800 shadow-md'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="p-5 sm:p-6 border-b border-slate-100 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono font-bold text-emerald-800 px-2.5 py-0.5 rounded-md bg-emerald-100">
                                {prog.code} · {prog.angkatan || 'Angkatan 1'}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                {prog.category === 'shorof' ? 'Morfologi Arab' : 'Sintaksis Nahwu'}
                              </span>
                            </div>

                            <div className="pt-1 flex items-baseline justify-between gap-4">
                              <h4 className="text-base sm:text-lg font-bold text-slate-900">
                                {prog.title}
                              </h4>
                              <span
                                dir="rtl"
                                className="font-arabic text-lg text-slate-600 shrink-0"
                              >
                                {prog.arabicTitle}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2">
                              {prog.summary}
                            </p>
                          </div>

                          {/* Card Body: Schedule & Pricing */}
                          <div className="p-5 sm:p-6 space-y-3 text-xs text-slate-700 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Jadwal Kelas Malam</span>
                              <span className="font-mono font-semibold text-slate-900">
                                {prog.scheduleDays} ({prog.scheduleTime})
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500">Kitab Rujukan</span>
                              <span className="font-medium text-slate-900">
                                {prog.kitabReference}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                              <span className="font-semibold text-slate-900">Biaya Level</span>
                              <div className="text-right">
                                <span className="font-mono font-bold text-emerald-900 text-sm">
                                  {formatIDR(prog.tuitionIDR)}
                                </span>
                                <span className="block text-[11px] font-mono text-slate-500">
                                  Cicilan 6x: {formatIDR(Math.round(prog.tuitionIDR / 6))}/bln
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Status & Actions */}
                          <div className="p-5 sm:p-6 bg-white border-t border-slate-100 space-y-3">
                            {isEnrolled ? (
                              <div className="space-y-3">
                                <div className="p-3 bg-emerald-100/70 border border-emerald-300 rounded-lg flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 text-emerald-950 font-semibold">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
                                    <span>Akun Ini Sudah Terdaftar di Level Ini</span>
                                  </div>
                                  {matchingReg && (
                                    <span className="font-mono font-bold text-emerald-900">
                                      {matchingReg.registrationNumber}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <a
                                    href="./pelajar.html"
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors"
                                  >
                                    <GraduationCap className="w-3.5 h-3.5" />
                                    <span>Buka di Pelajar.html</span>
                                  </a>
                                  {matchingReg && (
                                    <button
                                      type="button"
                                      onClick={() => handleDownloadReceipt(matchingReg)}
                                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Bukti</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : isClosed ? (
                              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center gap-2 font-medium">
                                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                                <span>Pendaftaran Level Ini Sedang Ditutup (OFF) oleh Superadmin</span>
                              </div>
                            ) : isSelectedToEnroll ? (
                              /* Interactive 1-Click Enrollment Expansion for Selected Level */
                              <div className="space-y-3 pt-2">
                                <div className="space-y-2">
                                  <label
                                    htmlFor={`sch-select-${prog.id}`}
                                    className="block text-xs font-semibold text-slate-800"
                                  >
                                    Pilih Jadwal Kelas Online Malam:
                                  </label>
                                  <select
                                    id={`sch-select-${prog.id}`}
                                    value={targetedScheduleId}
                                    onChange={(e) => {
                                      setTargetedScheduleId(e.target.value);
                                      onSelectSchedule(e.target.value);
                                    }}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-800"
                                  >
                                    {progSchedules.map((sch) => (
                                      <option key={sch.id} value={sch.id}>
                                        {sch.batchCode} · Hari {sch.days} ({sch.timeWIB})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label
                                    htmlFor={`goal-${prog.id}`}
                                    className="block text-xs font-semibold text-slate-800"
                                  >
                                    Target Belajar (Opsional):
                                  </label>
                                  <input
                                    id={`goal-${prog.id}`}
                                    type="text"
                                    value={learningGoal}
                                    onChange={(e) => setLearningGoal(e.target.value)}
                                    placeholder="Contoh: Menguasai baca kitab gundul..."
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-800"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleConfirmEnrollment(prog)}
                                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
                                >
                                  <span>Konfirmasi Pendaftaran Level {prog.levelNumber} ({formatIDR(prog.tuitionIDR)})</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetedProgramId(prog.id);
                                  onSelectProgram(prog.id);
                                  if (progSchedules.length > 0) {
                                    setTargetedScheduleId(progSchedules[0].id);
                                    onSelectSchedule(progSchedules[0].id);
                                  }
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-900 rounded-lg transition-colors"
                              >
                                <span>Pilih & Daftar Level {prog.levelNumber} Ini →</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          /* Lookup & Registrant Directory Page */
          <div className="mt-10 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Direktori & Status Verifikasi Peserta Tadribul Lughah
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Ketik Nomor Registrasi, nama peserta, atau level program pada kolom pencarian di samping.
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari No. Registrasi / Nama..."
                  aria-label="Cari nomor registrasi atau nama peserta"
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 text-slate-900"
                />
              </div>
            </div>

            {filteredRegistrations.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-medium text-slate-800">
                  Data pendaftar tidak ditemukan
                </p>
                <p className="text-xs text-slate-500">
                  Periksa kembali Nomor Registrasi atau kata kunci pencarian Anda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 pr-4">No. Registrasi</th>
                      <th className="py-3 px-4">Nama Peserta & Domisili</th>
                      <th className="py-3 px-4">Level & Jadwal Online</th>
                      <th className="py-3 px-4">Biaya Level</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 pl-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {filteredRegistrations.map((rec) => (
                      <tr key={rec.registrationNumber} className="hover:bg-slate-50">
                        <td className="py-4 pr-4 font-mono tabular-nums font-semibold text-emerald-900 whitespace-nowrap">
                          {rec.registrationNumber}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-slate-900">
                            {rec.fullName}
                          </p>
                          <p className="text-slate-500 mt-0.5">
                            {rec.gender || 'Laki-laki'} · {rec.occupation} · {rec.city}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-slate-900">
                            {rec.selectedProgramName}
                          </p>
                          <p className="font-mono tabular-nums text-slate-500 mt-0.5">
                            {rec.selectedScheduleSummary}
                          </p>
                        </td>
                        <td className="py-4 px-4 font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                          {formatIDR(rec.totalTuitionIDR)}
                        </td>
                        <td className="py-4 px-4 text-emerald-800 font-medium">
                          {rec.status}
                        </td>
                        <td className="py-4 pl-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDownloadReceipt(rec)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Unduh Bukti
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
