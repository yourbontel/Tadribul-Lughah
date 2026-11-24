import React, { useState, useEffect, useRef } from 'react';
import {
  PROGRAM_TRACKS,
  CLASS_SCHEDULES,
  ProgramTrack,
  ClassSchedule,
  RegistrationRecord,
  formatIDR,
  formatWhatsAppNumber,
  isScheduleRegistrationOpen,
  isProgramHasAnyOpenSchedule,
  getPreferredScheduleForProgram,
  getRegistrationAngkatanLabel,
  findExistingBatchEnrollment,
  getNextAvailableOpenScheduleForProgram
} from '../data/arabicAcademyData';
import { ScheduleClassSelector } from './ScheduleClassSelector';
import {
  EnrollmentConfirmModal,
  PendingEnrollmentConfirmation
} from './EnrollmentConfirmModal';
import {
  CheckCircle2,
  Download,
  Printer,
  UserPlus,
  AlertCircle,
  ArrowRight,
  GraduationCap,
  KeyRound,
  Lock,
  LogIn,
  UserCheck,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Calendar,
  RotateCcw,
  Loader2
} from 'lucide-react';
import {
  StudentAccount,
  getStudentAccounts,
  getActiveStudentSession,
  clearActiveStudentSession,
  registerNewStudentAccount,
  loginStudentAccount,
  enrollStudentInProgram,
  getStudentRegistrations,
  syncStudentAccountsFromServer,
  syncRegistrationsFromServer
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
  mode?: 'form';
  onNavigatePage: (
    page: 'beranda' | 'kurikulum' | 'jadwal' | 'pendaftaran'
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
  const hasManuallySelectedScheduleRef = useRef<boolean>(false);
  const [learningGoal, setLearningGoal] = useState('');

  // Messages & Submitted Confirmation
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] = useState<RegistrationRecord | null>(null);
  const [isSubmittingAccount, setIsSubmittingAccount] = useState<boolean>(false);
  const [pendingConfirmEnrollment, setPendingConfirmEnrollment] =
    useState<PendingEnrollmentConfirmation | null>(null);
  const [invalidField, setInvalidField] = useState<'fullName' | 'email' | 'whatsapp' | 'city' | 'password' | null>(null);

  // Listen for session changes or reload active account
  useEffect(() => {
    syncStudentAccountsFromServer()
      .then((accounts) => {
        const session = getActiveStudentSession();
        if (session) {
          const matched = accounts.find(
            (a) =>
              a.registrationNumber.toUpperCase() ===
                session.registrationNumber.toUpperCase() ||
              a.email.toLowerCase() === session.email.toLowerCase()
          );
          if (matched) {
            setActiveAccount(matched);
          } else {
            setActiveAccount(null);
            clearActiveStudentSession();
          }
        }
      })
      .catch(() => {});
    syncRegistrationsFromServer().catch(() => {});
  }, []);

  // Compute active target program & schedule
  const activeProgram =
    programs.find((p) => p.id === targetedProgramId) ||
    programs[0] ||
    PROGRAM_TRACKS[0];

  const availableSchedulesForProgram = schedules.filter(
    (s) => s.programId === activeProgram.id
  );

  const preferredScheduleForActiveProgram = getPreferredScheduleForProgram(
    activeProgram,
    schedules
  );

  const currentTargetedSchedule = availableSchedulesForProgram.find(
    (s) => s.id === targetedScheduleId
  );

  const activeSchedule =
    (currentTargetedSchedule && isScheduleRegistrationOpen(currentTargetedSchedule, activeProgram)
      ? currentTargetedSchedule
      : null) ||
    preferredScheduleForActiveProgram ||
    availableSchedulesForProgram[0] ||
    schedules[0] ||
    CLASS_SCHEDULES[0];

  useEffect(() => {
    const currentSch = availableSchedulesForProgram.find((s) => s.id === targetedScheduleId);
    const hasOpenSchedule = availableSchedulesForProgram.some((s) =>
      isScheduleRegistrationOpen(s, activeProgram)
    );
    const currentIsOpen = currentSch ? isScheduleRegistrationOpen(currentSch, activeProgram) : false;

    const shouldResetToPreferred =
      !currentSch ||
      (hasOpenSchedule && !currentIsOpen) ||
      !hasManuallySelectedScheduleRef.current;

    if (shouldResetToPreferred && preferredScheduleForActiveProgram?.id) {
      if (preferredScheduleForActiveProgram.id !== targetedScheduleId) {
        setTargetedScheduleId(preferredScheduleForActiveProgram.id);
        onSelectSchedule(preferredScheduleForActiveProgram.id);
      }
    }
  }, [targetedProgramId, programs, schedules]);

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
  const handleRegisterAccount = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setErrorMessage(null);

    // 1. Validasi field nama lengkap
    if (!newFullName.trim()) {
      setInvalidField('fullName');
      setErrorMessage('Nama Lengkap wajib diisi sesuai KTP / Identitas.');
      const el = document.getElementById('acc-fullname');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (newFullName.trim().length < 3) {
      setInvalidField('fullName');
      setErrorMessage('Nama Lengkap minimal 3 karakter sesuai identitas.');
      const el = document.getElementById('acc-fullname');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 2. Validasi field email
    if (!newEmail.trim()) {
      setInvalidField('email');
      setErrorMessage('Alamat Email aktif wajib diisi sebagai identitas login.');
      const el = document.getElementById('acc-email');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      setInvalidField('email');
      setErrorMessage('Format email tidak valid (contoh: nama@domain.com).');
      const el = document.getElementById('acc-email');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 3. Validasi field WhatsApp
    if (!newWhatsapp.trim()) {
      setInvalidField('whatsapp');
      setErrorMessage('Nomor WhatsApp aktif wajib diisi untuk koordinasi kelas.');
      const el = document.getElementById('acc-whatsapp');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const phoneDigits = newWhatsapp.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      setInvalidField('whatsapp');
      setErrorMessage('Nomor WhatsApp minimal 9 digit angka.');
      const el = document.getElementById('acc-whatsapp');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 4. Validasi field Kota
    if (!newCity.trim() || newCity.trim().length < 2) {
      setInvalidField('city');
      setErrorMessage('Kota / Kabupaten Domisili wajib diisi.');
      const el = document.getElementById('acc-city');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // 5. Validasi kata sandi
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      setInvalidField('password');
      setErrorMessage('Kata sandi akun minimal 6 karakter.');
      const el = document.getElementById('acc-password');
      el?.focus();
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setInvalidField(null);
    setIsSubmittingAccount(true);
    try {
      const res = registerNewStudentAccount({
        fullName: newFullName,
        gender: newGender,
        email: newEmail,
        whatsapp: formatWhatsAppNumber(newWhatsapp) || newWhatsapp,
        city: newCity,
        occupation: newOccupation,
        password: newPassword
      });

      if (!res.ok) {
        setErrorMessage(res.reason);
        if (res.reason.includes('sudah memiliki akun')) {
          setInvalidField('email');
        }
        setTimeout(() => {
          const errEl = document.getElementById('account-creation-error-bottom') || document.getElementById('acc-email');
          errEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        return;
      }

      setActiveAccount(res.account);
      setSuccessBanner(
        `Akun Pelajar Anda atas nama "${res.account.fullName}" (${res.account.email}) berhasil dibuat! Silakan lanjutkan memilih program level di bawah ini.`
      );

      // Smooth scroll to Step 2
      setTimeout(() => {
        const step2 = document.getElementById('step-2-program-selection');
        if (step2) {
          step2.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } finally {
      setIsSubmittingAccount(false);
    }
  };

  // Handle Account Login (Step 1)
  const handleLoginAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await syncStudentAccountsFromServer();
      await syncRegistrationsFromServer();
    } catch {}

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

    const progSchedules = schedules.filter((s) => s.programId === programToEnroll.id);
    const preferredSchedule = getPreferredScheduleForProgram(programToEnroll, schedules);
    const targetedSch = progSchedules.find((s) => s.id === targetedScheduleId);
    const chosenSchedule =
      (targetedSch && isScheduleRegistrationOpen(targetedSch, programToEnroll) ? targetedSch : null) ||
      preferredSchedule;
    const targetAngkatan = chosenSchedule.angkatan?.trim() || programToEnroll.angkatan || 'Angkatan 1';

    if (!isScheduleRegistrationOpen(chosenSchedule, programToEnroll)) {
      setErrorMessage(
        `Mohon maaf, pendaftaran untuk Level ${programToEnroll.levelNumber} · ${targetAngkatan} (${chosenSchedule.batchCode}) saat ini sedang ditutup (OFF) oleh Superadmin.`
      );
      return;
    }

    const latestAccountRegs = getStudentRegistrations(activeAccount.email, registrations);
    const duplicateBatch = findExistingBatchEnrollment(
      latestAccountRegs,
      programToEnroll.id,
      targetAngkatan,
      schedules,
      programs
    );
    if (duplicateBatch) {
      setErrorMessage(
        `Anda sudah terdaftar pada ${programToEnroll.title} · ${targetAngkatan} (No. Reg: ${duplicateBatch.registrationNumber}). Setiap peserta hanya dapat mendaftar 1 kali pada level dan angkatan yang sama.`
      );
      return;
    }

    const isReEnrollment = enrolledProgramIds.has(programToEnroll.id);
    setPendingConfirmEnrollment({
      program: programToEnroll,
      schedule: chosenSchedule,
      angkatan: targetAngkatan,
      learningGoal,
      isReEnrollment
    });
  };

  const executeConfirmedEnrollment = () => {
    if (!activeAccount || !pendingConfirmEnrollment) return;
    const {
      program: programToEnroll,
      schedule: chosenSchedule,
      angkatan: targetAngkatan,
      learningGoal: goalText,
      isReEnrollment
    } = pendingConfirmEnrollment;

    const latestAccountRegs = getStudentRegistrations(activeAccount.email, registrations);
    const duplicateBatch = findExistingBatchEnrollment(
      latestAccountRegs,
      programToEnroll.id,
      targetAngkatan,
      schedules,
      programs
    );
    if (duplicateBatch) {
      setPendingConfirmEnrollment(null);
      setErrorMessage(
        `Anda sudah terdaftar pada ${programToEnroll.title} · ${targetAngkatan} (No. Reg: ${duplicateBatch.registrationNumber}). Setiap peserta hanya dapat mendaftar 1 kali pada level dan angkatan yang sama.`
      );
      return;
    }

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
      whatsapp: formatWhatsAppNumber(activeAccount.whatsapp) || activeAccount.whatsapp,
      occupation: activeAccount.occupation || 'Pelajar Terdaftar',
      city: activeAccount.city || 'Indonesia',
      selectedProgramId: programToEnroll.id,
      selectedProgramName: `${programToEnroll.title} (${targetAngkatan})`,
      selectedScheduleId: chosenSchedule.id,
      selectedScheduleSummary: `${chosenSchedule.batchCode} · ${chosenSchedule.days} (${chosenSchedule.timeWIB}) · ${targetAngkatan} · Online`,
      learningGoal:
        (goalText || '').trim() ||
        (isReEnrollment
          ? `Mengulang & memantapkan kaidah di ${targetAngkatan}.`
          : `Menguasai kaidah ${programToEnroll.category === 'shorof' ? 'Shorof' : 'Nahwu'} secara sistematis melalui Tadribul Lughah Level ${programToEnroll.levelNumber} (${targetAngkatan}).`),
      totalTuitionIDR: chosenSchedule?.feeIDR || programToEnroll.tuitionIDR,
      paidTuitionIDR: 0,
      installmentPaidCount: 0,
      paymentPlan: 'cicilan',
      registeredAt: nowStr
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
    setPendingConfirmEnrollment(null);
    setSubmittedRecord(newRecord);
    setSuccessBanner(
      isReEnrollment
        ? `Alhamdulillah! Pendaftaran ulang untuk ${programToEnroll.title} (${targetAngkatan}) berhasil! Nomor Registrasi baru: ${newRegNo}. Seluruh data, nilai, dan riwayat angkatan sebelumnya tetap aman tersimpan di akun Anda.`
        : `Pendaftaran untuk ${programToEnroll.title} berhasil! Nomor Registrasi baru Anda: ${newRegNo}.`
    );
  };

  const handleDownloadReceipt = (rec: RegistrationRecord) => {
    const isLunas = (rec.installmentPaidCount || 0) >= 6 || ((rec.paidTuitionIDR || 0) >= rec.totalTuitionIDR && rec.totalTuitionIDR > 0);
    const payStatusText = isLunas
      ? 'Lunas Penuh (6/6)'
      : (rec.installmentPaidCount || 0) > 0
        ? `Cicilan ${rec.installmentPaidCount}/6 Lunas`
        : 'Belum Lunas (Bulan 1)';

    const content = [
      '==============================================================',
      '        TADRIBUL LUGHAH — BUKTI PENDAFTARAN RESMI             ',
      '==============================================================',
      `Nomor Registrasi   : ${rec.registrationNumber}`,
      `Tanggal Daftar     : ${rec.registeredAt}`,
      `Status Pembayaran  : ${payStatusText}`,
      '--------------------------------------------------------------',
      'DATA AKUN PESERTA DIDIK:',
      `Nama Lengkap       : ${rec.fullName}`,
      `Jenis Kelamin      : ${rec.gender || 'Laki-laki'}`,
      `Email Akun         : ${rec.email}`,
      `Nomor WhatsApp     : ${formatWhatsAppNumber(rec.whatsapp) || rec.whatsapp}`,
      `Profesi / Aktivitas: ${rec.occupation}`,
      `Kota Domisili      : ${rec.city}`,
      '--------------------------------------------------------------',
      'RINCIAN LEVEL & JADWAL KELAS ONLINE:',
      `Level Pilihan      : ${rec.selectedProgramName}`,
      `Angkatan Program   : ${rec.selectedProgramName.match(/(Angkatan\s*\d+)/i)?.[1] || 'Angkatan 1'}`,
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

  const sampleAccounts = getStudentAccounts().slice(0, 3);

  return (
    <section className="py-12 sm:py-16 bg-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-6">
        {/* Page Header (hanya tampil sebelum peserta memiliki/login akun dan sebelum selesai memilih level) */}
        {!submittedRecord && !activeAccount && (
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200">
            <div>
              <p className="text-xs font-semibold text-emerald-800 tracking-wide mb-2 uppercase font-mono">
                Sistem Admisi Pelajar · 1 Akun untuk 4 Program Level
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 tracking-tight font-display">
                Pendaftaran Online Tadribul Lughah (Level 1–4)
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                Pendaftar wajib memiliki <strong>Akun Pelajar</strong> terlebih dahulu. Dengan <strong>1 akun</strong>, Anda dapat mendaftar hingga <strong>4 program level</strong> tanpa perlu membuat akun lagi. Biaya per level <strong>{formatIDR(programs[0]?.tuitionIDR || 510000)}</strong> (cicilan 6x <strong>{formatIDR(Math.round((programs[0]?.tuitionIDR || 510000) / 6))}/bln</strong>). Seluruh kelas online malam (20.00 – 22.00 WIB).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
              <a
                href="./pelajar.html"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                <span>Portal Pelajar (pelajar.html)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="./login.html"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <span>Login Akun</span>
              </a>
            </div>
          </div>
        )}

        {submittedRecord ? (
            /* Confirmation & Digital Student ID Card View */
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 space-y-8">
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
                    <div>
                      <p className="text-xs text-slate-400">
                        Level Program Pilihan
                      </p>
                      <p className="text-sm font-medium mt-0.5">
                        {submittedRecord.selectedProgramName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">
                        Angkatan Pembelajaran
                      </p>
                      <p className="text-sm font-semibold text-emerald-300 mt-0.5">
                        {submittedRecord.selectedProgramName.match(/(Angkatan\s*\d+)/i)?.[1] || 'Angkatan 1'}
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
                    <span className="text-amber-300 font-medium">
                      Status Bayar: {
                        (submittedRecord.installmentPaidCount || 0) >= 6
                          ? '✓ Lunas Penuh (6/6)'
                          : (submittedRecord.installmentPaidCount || 0) > 0
                            ? `Cicilan ${submittedRecord.installmentPaidCount}/6 Lunas`
                            : 'Belum Lunas (Bulan 1)'
                      }
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
                      <span>Angkatan Masuk</span>
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {submittedRecord.selectedProgramName.match(/(Angkatan\s*\d+)/i)?.[1] || 'Angkatan 1'}
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
            <div className={activeAccount ? 'space-y-8' : 'mt-10 space-y-8'}>
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
                              onChange={(e) => {
                                setNewFullName(e.target.value);
                                if (invalidField === 'fullName') setInvalidField(null);
                                if (errorMessage) setErrorMessage(null);
                              }}
                              placeholder="Contoh: Ahmad Zaki Al-Manshur"
                              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none transition-colors text-slate-900 ${
                                invalidField === 'fullName'
                                  ? 'border-rose-500 ring-2 ring-rose-200'
                                  : 'border-slate-300 focus:border-emerald-800'
                              }`}
                            />
                            {invalidField === 'fullName' && (
                              <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Nama Lengkap minimal 3 karakter sesuai identitas</span>
                              </p>
                            )}
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
                              onChange={(e) => {
                                setNewEmail(e.target.value);
                                if (invalidField === 'email') setInvalidField(null);
                                if (errorMessage) setErrorMessage(null);
                              }}
                              placeholder="nama@email.com"
                              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none transition-colors text-slate-900 ${
                                invalidField === 'email'
                                  ? 'border-rose-500 ring-2 ring-rose-200'
                                  : 'border-slate-300 focus:border-emerald-800'
                              }`}
                            />
                            {invalidField === 'email' && (
                              <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Format email tidak valid (contoh: nama@domain.com)</span>
                              </p>
                            )}
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
                              onChange={(e) => {
                                setNewWhatsapp(formatWhatsAppNumber(e.target.value));
                                if (invalidField === 'whatsapp') setInvalidField(null);
                                if (errorMessage) setErrorMessage(null);
                              }}
                              placeholder="0812-3456-7890"
                              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none transition-colors text-slate-900 font-mono tabular-nums ${
                                invalidField === 'whatsapp'
                                  ? 'border-rose-500 ring-2 ring-rose-200'
                                  : 'border-slate-300 focus:border-emerald-800'
                              }`}
                            />
                            {invalidField === 'whatsapp' && (
                              <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Nomor WhatsApp minimal 9 digit angka</span>
                              </p>
                            )}
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
                              onChange={(e) => {
                                setNewCity(e.target.value);
                                if (invalidField === 'city') setInvalidField(null);
                                if (errorMessage) setErrorMessage(null);
                              }}
                              placeholder="Contoh: Jakarta / Bandung / Surabaya"
                              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none transition-colors text-slate-900 ${
                                invalidField === 'city'
                                  ? 'border-rose-500 ring-2 ring-rose-200'
                                  : 'border-slate-300 focus:border-emerald-800'
                              }`}
                            />
                            {invalidField === 'city' && (
                              <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Mohon isi Kota / Kabupaten Domisili Anda</span>
                              </p>
                            )}
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
                              onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (invalidField === 'password') setInvalidField(null);
                                if (errorMessage) setErrorMessage(null);
                              }}
                              placeholder="Minimal 6 karakter"
                              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-lg focus:outline-none transition-colors text-slate-900 ${
                                invalidField === 'password'
                                  ? 'border-rose-500 ring-2 ring-rose-200'
                                  : 'border-slate-300 focus:border-emerald-800'
                              }`}
                            />
                            {invalidField === 'password' ? (
                              <p className="text-xs text-rose-600 mt-1 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>Kata sandi akun minimal 6 karakter</span>
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                <KeyRound className="w-3 h-3 text-emerald-800 shrink-0" />
                                <span>
                                  Digunakan untuk masuk ke akun Anda kapan saja dan mengakses portal belajar (<span className="font-mono">pelajar.html</span>).
                                </span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Error Notification Right Above Action Button */}
                        {errorMessage && (
                          <div
                            id="account-creation-error-bottom"
                            role="alert"
                            className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-rose-950 shadow-xs"
                          >
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div className="flex-1 space-y-1">
                              <p className="font-semibold text-rose-900 leading-snug">{errorMessage}</p>
                              {errorMessage.includes('sudah memiliki akun') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAccountSubMode('login');
                                    setLoginIdentifier(newEmail);
                                    setErrorMessage(null);
                                    setInvalidField(null);
                                  }}
                                  className="mt-2 inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs"
                                >
                                  <LogIn className="w-3.5 h-3.5" />
                                  <span>Klik di sini untuk langsung Masuk dengan kata sandi Anda →</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <p className="text-xs text-slate-500">
                            Setelah akun dibuat, Anda dapat langsung memilih dan mendaftar 1 atau beberapa program level di bawah ini.
                          </p>
                          <button
                            type="submit"
                            id="btn-create-account"
                            disabled={isSubmittingAccount}
                            onClick={(e) => {
                              handleRegisterAccount(e);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs sm:text-sm font-semibold text-white bg-emerald-900 hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed rounded-lg transition-all whitespace-nowrap shrink-0 shadow-md cursor-pointer"
                          >
                            {isSubmittingAccount ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Membuat Akun Pelajar...</span>
                              </>
                            ) : (
                              <>
                                <span>Buat Akun & Lanjut ke Pilihan Program (Level 1–4)</span>
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
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
                            onChange={(e) => {
                              setLoginPassword(e.target.value);
                              if (errorMessage) setErrorMessage(null);
                            }}
                            placeholder="Masukkan kata sandi akun Anda"
                            className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 text-slate-900"
                          />
                        </div>

                        {errorMessage && (
                          <div
                            role="alert"
                            className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start gap-2.5 text-xs text-rose-950 shadow-xs"
                          >
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <p className="font-semibold text-rose-900 leading-snug">{errorMessage}</p>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 active:scale-[0.98] rounded-lg transition-all cursor-pointer"
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
                            {sampleAccounts.map((acc) => {
                              const isMulti = (acc.enrolledRegistrationNumbers?.length || 0) > 1;
                              return (
                                <button
                                  key={acc.registrationNumber}
                                  type="button"
                                  onClick={() => {
                                    setLoginIdentifier(acc.email);
                                    setLoginPassword(acc.password);
                                    setErrorMessage(null);
                                  }}
                                  className={`px-2.5 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer ${
                                    isMulti
                                      ? 'bg-emerald-100 hover:bg-emerald-200 border border-emerald-400 text-emerald-950 font-bold'
                                      : 'bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800'
                                  }`}
                                  title={isMulti ? 'Akun Demo: Terdaftar 2x di Level 1' : undefined}
                                >
                                  {acc.fullName.split(' ')[0]} ({acc.registrationNumber}{isMulti ? ' · Demo 2x Lv 1' : ''})
                                </button>
                              );
                            })}
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
                <div id="step-2-program-selection" className="space-y-8 scroll-mt-24">
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
                          {activeAccount.gender || 'Laki-laki'} · {activeAccount.email} · {formatWhatsAppNumber(activeAccount.whatsapp) || activeAccount.whatsapp} · {activeAccount.city || 'Indonesia'}
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
                        {formatIDR(programs[0]?.tuitionIDR || 510000)}
                      </p>
                      <p className="text-[11px] font-mono text-emerald-300 mt-0.5">
                        Cicilan 6x: {formatIDR(Math.round((programs[0]?.tuitionIDR || 510000) / 6))} / bulan
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
                      const progSchedules = schedules.filter((s) => s.programId === prog.id);
                      const isClosed = !isProgramHasAnyOpenSchedule(prog, schedules);
                      const isSelectedToEnroll = targetedProgramId === prog.id;
                      const nextAvailableSchedule = getNextAvailableOpenScheduleForProgram(
                        prog,
                        schedules,
                        accountRegistrations,
                        programs
                      );

                      const defaultSchedule =
                        (isEnrolled ? nextAvailableSchedule : null) ||
                        getPreferredScheduleForProgram(prog, schedules);
                      const selectedSchForProg = isSelectedToEnroll
                        ? progSchedules.find((s) => s.id === targetedScheduleId)
                        : undefined;
                      const displaySchedule =
                        selectedSchForProg &&
                        (isScheduleRegistrationOpen(selectedSchForProg, prog) || isClosed)
                          ? selectedSchForProg
                          : defaultSchedule;
                      const displayAngkatan =
                        displaySchedule?.angkatan?.trim() || prog.angkatan || 'Angkatan 1';
                      const alreadyEnrolledInDisplayedBatch = findExistingBatchEnrollment(
                        accountRegistrations,
                        prog.id,
                        displayAngkatan,
                        schedules,
                        programs
                      );
                      const displayStartDate =
                        displaySchedule?.startDate || prog.startDate || '19 November 2026';
                      const displayDays = displaySchedule?.days || prog.scheduleDays;
                      const displayTime = displaySchedule?.timeWIB || prog.scheduleTime;

                      return (
                        <div
                          key={prog.id}
                          className={`rounded-xl border transition-all flex flex-col justify-between relative ${
                            isEnrolled
                              ? 'bg-emerald-50/50 border-emerald-300'
                              : isSelectedToEnroll
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
                              <span className="font-medium text-slate-900">
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

                          {/* Card Footer: Status & Actions */}
                          <div className="p-5 sm:p-6 bg-white border-t border-slate-100 space-y-3 rounded-b-xl">
                            {isClosed ? (
                              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center gap-2 font-medium">
                                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                                <span>Pendaftaran Level Ini Sedang Ditutup (OFF) oleh Superadmin</span>
                              </div>
                            ) : isSelectedToEnroll ? (
                              /* Interactive 1-Click Enrollment Expansion for Selected Level */
                              (() => {
                                const activeScheduleAngkatan = displayAngkatan;
                                return (
                              <div className="space-y-3 pt-2">
                                <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-xs flex items-center justify-between">
                                  <span className="text-slate-700 font-medium">Angkatan Pembelajaran:</span>
                                  <span className="font-bold text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                                    {activeScheduleAngkatan}
                                  </span>
                                </div>
                                {isEnrolled && (
                                  <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-medium leading-relaxed">
                                    ℹ️ Anda sedang mendaftar ulang untuk <strong>{prog.title} ({activeScheduleAngkatan})</strong>. Seluruh data kelulusan, nilai, dan bukti angkatan sebelumnya tidak akan terhapus dan tetap tersimpan utuh di akun Anda.
                                  </p>
                                )}
                                <div className="space-y-2">
                                  <label
                                    htmlFor={`sch-select-${prog.id}`}
                                    className="block text-xs font-semibold text-slate-800"
                                  >
                                    Pilih Jadwal Kelas Online (1 Angkatan = 1 Kelas):
                                  </label>
                                  <ScheduleClassSelector
                                    id={`sch-select-${prog.id}`}
                                    schedules={progSchedules.filter((sch) =>
                                      isScheduleRegistrationOpen(sch, prog)
                                    )}
                                    selectedScheduleId={displaySchedule.id}
                                    programAngkatan={prog.angkatan || 'Angkatan 1'}
                                    onSelect={(schId) => {
                                      hasManuallySelectedScheduleRef.current = true;
                                      setTargetedScheduleId(schId);
                                      onSelectSchedule(schId);
                                    }}
                                    isScheduleAlreadyEnrolled={(sch) => {
                                      const schAngkatan =
                                        sch.angkatan?.trim() || prog.angkatan || 'Angkatan 1';
                                      return Boolean(
                                        findExistingBatchEnrollment(
                                          accountRegistrations,
                                          prog.id,
                                          schAngkatan,
                                          schedules,
                                          programs
                                        )
                                      );
                                    }}
                                  />
                                </div>

                                {alreadyEnrolledInDisplayedBatch && (
                                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-[11px] text-amber-950 font-medium">
                                    Anda sudah terdaftar pada Level {prog.levelNumber} · {displayAngkatan} ({alreadyEnrolledInDisplayedBatch.registrationNumber}). Tidak dapat mendaftar dua kali pada level & angkatan yang sama.
                                  </div>
                                )}

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
                                    placeholder={isEnrolled ? "Contoh: Mengulang dan memantapkan kaidah di angkatan baru..." : "Contoh: Menguasai baca kitab gundul..."}
                                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-800"
                                  />
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={Boolean(alreadyEnrolledInDisplayedBatch)}
                                    onClick={() => handleConfirmEnrollment(prog)}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs cursor-pointer"
                                  >
                                    <span>
                                      {isEnrolled
                                        ? `Konfirmasi Daftar Ulang ${activeScheduleAngkatan} (${formatIDR(displaySchedule?.feeIDR || prog.tuitionIDR)})`
                                        : `Konfirmasi Pendaftaran Level ${prog.levelNumber} - ${activeScheduleAngkatan} (${formatIDR(displaySchedule?.feeIDR || prog.tuitionIDR)})`}
                                    </span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTargetedProgramId('');
                                      setErrorMessage(null);
                                    }}
                                    className="px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-300 cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              </div>
                                );
                              })()
                            ) : isEnrolled ? (
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
                                <div className="flex flex-wrap items-center gap-2">
                                  <a
                                    href="./pelajar.html"
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors"
                                  >
                                    <GraduationCap className="w-3.5 h-3.5" />
                                    <span>Buka di Pelajar.html</span>
                                  </a>
                                  {nextAvailableSchedule ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        hasManuallySelectedScheduleRef.current = false;
                                        setTargetedProgramId(prog.id);
                                        onSelectProgram(prog.id);
                                        setTargetedScheduleId(nextAvailableSchedule.id);
                                        onSelectSchedule(nextAvailableSchedule.id);
                                        setErrorMessage(null);
                                      }}
                                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                                      title="Daftar ulang untuk mengikuti kelas di angkatan baru tanpa menghapus data sebelumnya"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>Daftar Ulang ({nextAvailableSchedule.angkatan?.trim() || prog.angkatan || 'Angkatan Baru'})</span>
                                    </button>
                                  ) : (
                                    <span
                                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg"
                                      title="Anda sudah terdaftar pada angkatan aktif untuk level ini"
                                    >
                                      <span>
                                        Terdaftar (
                                        {matchingReg
                                          ? getRegistrationAngkatanLabel(matchingReg, schedules, programs)
                                          : displayAngkatan}
                                        )
                                      </span>
                                    </span>
                                  )}
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
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  hasManuallySelectedScheduleRef.current = false;
                                  setTargetedProgramId(prog.id);
                                  onSelectProgram(prog.id);
                                  const initialSchId = defaultSchedule.id;
                                  setTargetedScheduleId(initialSchId);
                                  onSelectSchedule(initialSchId);
                                }}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-900 rounded-lg transition-colors"
                              >
                                <span>Pilih & Daftar Level {prog.levelNumber} ({defaultSchedule.angkatan?.trim() || prog.angkatan || 'Angkatan 1'}) →</span>
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
          )}
      </div>

      {activeAccount && (
        <EnrollmentConfirmModal
          pending={pendingConfirmEnrollment}
          studentName={activeAccount.fullName}
          studentEmail={activeAccount.email}
          studentWhatsapp={activeAccount.whatsapp}
          onCancel={() => setPendingConfirmEnrollment(null)}
          onConfirm={executeConfirmedEnrollment}
        />
      )}
    </section>
  );
};
