import React, { useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  isUserSuperAdmin,
  SUPERADMIN_EMAIL
} from './firebase';
import {
  authenticateStudentCredentials,
  setActiveStudentSession,
  getActiveStudentSession,
  clearActiveStudentSession,
  getStudentAccounts,
  loadMergedRegistrations,
  syncStudentAccountsFromServer,
  syncRegistrationsFromServer
} from './utils/studentAccountStore';
import {
  ShieldCheck,
  LogIn,
  Lock,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  LogOut,
  GraduationCap
} from 'lucide-react';

export const SUPERADMIN_SESSION_KEY = 'tl_superadmin_verified_session_v1';

type LoginPortalRole = 'pelajar' | 'superadmin';

export default function LoginApp() {
  const [portalRole, setPortalRole] = useState<LoginPortalRole>(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'superadmin') return 'superadmin';
    if (roleParam === 'pelajar') return 'pelajar';
    return 'pelajar';
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Student Login Inputs
  const [studentIdentifier, setStudentIdentifier] = useState<string>('');
  const [studentPassword, setStudentPassword] = useState<string>('');

  // Superadmin Inputs
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [redirectTarget, setRedirectTarget] = useState<string | null>(null);

  const redirectToSuperAdminPage = () => {
    let target = './superadmin.html';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');
      if (
        redirectParam &&
        !redirectParam.startsWith('http') &&
        (redirectParam.includes('edit-jadwal.html') || redirectParam.includes('superadmin.html'))
      ) {
        target = redirectParam.startsWith('./') ? redirectParam : `./${redirectParam}`;
      }
    }
    setRedirectTarget(target.replace(/^\.\//, ''));
    try {
      sessionStorage.setItem(SUPERADMIN_SESSION_KEY, SUPERADMIN_EMAIL);
    } catch {
      // Ignore storage errors
    }
    window.location.replace(target);
  };

  const redirectToStudentPortalPage = (
    regNo: string,
    email: string,
    fullName: string
  ) => {
    let target = './pelajar.html';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get('redirect');
      if (redirectParam && !redirectParam.startsWith('http') && redirectParam.includes('pelajar.html')) {
        target = redirectParam.startsWith('./') ? redirectParam : `./${redirectParam}`;
      }
    }
    setRedirectTarget(target);
    setActiveStudentSession({
      registrationNumber: regNo,
      email,
      fullName,
      loginAt: new Date().toISOString()
    });
    window.location.replace(target);
  };

  useEffect(() => {
    // Sinkronkan akun & registrasi santri dari server cPanel di latar belakang
    syncStudentAccountsFromServer().catch(() => {});
    syncRegistrationsFromServer().catch(() => {});

    // Check if Superadmin session is already active when on superadmin tab
    try {
      const savedSuperSession = sessionStorage.getItem(SUPERADMIN_SESSION_KEY);
      if (
        portalRole === 'superadmin' &&
        savedSuperSession &&
        savedSuperSession.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()
      ) {
        redirectToSuperAdminPage();
        return;
      }

      const savedStudentSession = getActiveStudentSession();
      if (portalRole === 'pelajar' && savedStudentSession) {
        const accounts = getStudentAccounts();
        const isValid = accounts.some(
          (a) =>
            a.registrationNumber.toUpperCase() ===
              savedStudentSession.registrationNumber.toUpperCase() ||
            a.email.toLowerCase() === savedStudentSession.email.toLowerCase()
        );
        if (isValid) {
          redirectToStudentPortalPage(
            savedStudentSession.registrationNumber,
            savedStudentSession.email,
            savedStudentSession.fullName
          );
          return;
        } else {
          clearActiveStudentSession();
        }
      }
    } catch {
      // Ignore
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecking(false);
      if (user && isUserSuperAdmin(user)) {
        redirectToSuperAdminPage();
      }
    });

    return () => unsub();
  }, [portalRole]);

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = (result.user.email || '').toLowerCase();

      // 1. Always route Superadmin directly to superadmin.html
      if (isUserSuperAdmin(result.user)) {
        redirectToSuperAdminPage();
        return;
      }

      if (portalRole === 'superadmin') {
        setErrorMsg(
          `Akses ditolak: Akun ${result.user.email} bukan akun Superadmin (${SUPERADMIN_EMAIL}). Halaman superadmin.html hanya dapat diakses oleh Superadmin.`
        );
        return;
      }

      // 2. If logging in as Pelajar via Google, check if email is registered & has a student account
      try {
        await syncStudentAccountsFromServer();
        await syncRegistrationsFromServer();
      } catch {}

      const accounts = getStudentAccounts();
      const regs = loadMergedRegistrations();
      const matchedAcc = accounts.find(
        (a) => a.email.toLowerCase() === userEmail
      );
      const matchedReg = regs.find(
        (r) =>
          (r.email && r.email.toLowerCase() === userEmail) ||
          (matchedAcc &&
            r.registrationNumber.toUpperCase() ===
              matchedAcc.registrationNumber.toUpperCase())
      );

      if (matchedAcc) {
        redirectToStudentPortalPage(
          matchedReg?.registrationNumber || matchedAcc.registrationNumber,
          matchedAcc.email,
          matchedReg?.fullName || matchedAcc.fullName
        );
      } else {
        setErrorMsg(
          `Akun Google ${result.user.email} belum terdaftar sebagai pelajar Tadribul Lughah atau belum memiliki akun pelajar. Silakan daftar program terlebih dahulu di halaman Pendaftaran.`
        );
      }
    } catch (err) {
      setErrorMsg(
        `Gagal melakukan login Google: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStudentLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const cleanedId = studentIdentifier.trim();
    const cleanedPass = studentPassword.trim();

    // Auto-detect if Superadmin logs in via the student login form!
    if (
      cleanedId.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase() &&
      cleanedPass.length >= 4
    ) {
      redirectToSuperAdminPage();
      return;
    }

    try {
      await syncStudentAccountsFromServer();
      await syncRegistrationsFromServer();
    } catch {
      // Ignore
    }

    const authResult = authenticateStudentCredentials(cleanedId, cleanedPass);
    if (!authResult.ok) {
      setErrorMsg(authResult.reason);
      setIsSubmitting(false);
      return;
    }

    redirectToStudentPortalPage(
      authResult.registration.registrationNumber,
      authResult.account.email,
      authResult.registration.fullName
    );
  };

  const handleSuperadminFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanedEmail = emailInput.trim().toLowerCase();
    const cleanedPass = passwordInput.trim();

    if (cleanedEmail !== SUPERADMIN_EMAIL.toLowerCase()) {
      setErrorMsg(
        `Akses ditolak! Email "${emailInput}" bukan Superadmin. Hanya Superadmin (${SUPERADMIN_EMAIL}) yang diizinkan masuk ke halaman superadmin.html.`
      );
      return;
    }

    if (cleanedPass.length < 4) {
      setErrorMsg(
        'Masukkan kata sandi / kode akses Superadmin minimal 4 karakter.'
      );
      return;
    }

    redirectToSuperAdminPage();
  };

  const handleSwitchAccount = async () => {
    setErrorMsg(null);
    try {
      sessionStorage.removeItem(SUPERADMIN_SESSION_KEY);
      clearActiveStudentSession();
    } catch {
      // Ignore
    }
    await signOut(auth);
  };

  const sampleAccounts = getStudentAccounts().slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract: 3 Zones Separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
          <a
            href="./index.html"
            className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            Tadribul Lughah
          </a>

          <div className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-500">
            <span>GERBANG LOGIN TERPISAH: /login.html</span>
            <span>·</span>
            <span>PELAJAR (pelajar.html) & SUPERADMIN (superadmin.html)</span>
          </div>

          <a
            href="./index.html"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda (index.html)</span>
          </a>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="flex-1 flex items-center justify-center py-10 px-6">
        <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Role Switcher Header (Pelajar Terdaftar vs Superadmin) */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPortalRole('pelajar');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                portalRole === 'pelajar'
                  ? 'bg-emerald-900 text-white'
                  : 'text-slate-700 hover:bg-white/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Login Pelajar (pelajar.html)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPortalRole('superadmin');
                setErrorMsg(null);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-colors ${
                portalRole === 'superadmin'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-white/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Login Superadmin (superadmin.html)</span>
            </button>
          </div>

          {/* Dark Institutional Header Banner */}
          <div className="bg-slate-900 text-white p-6 sm:p-7 border-b border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                {portalRole === 'pelajar'
                  ? 'AKUN PELAJAR TERDAFTAR · MENUJU PELAJAR.HTML'
                  : 'OTENTIKASI SUPERADMIN · MENUJU SUPERADMIN.HTML'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              {portalRole === 'pelajar'
                ? 'Masuk ke Portal Pelajar Terdaftar'
                : 'Login Khusus Superadmin Tadribul Lughah'}
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              {portalRole === 'pelajar' ? (
                <>
                  Halaman <span className="font-mono text-emerald-300">pelajar.html</span> hanya dapat diakses oleh pelajar yang <strong>sudah terdaftar</strong> dan <strong>memiliki akun</strong>. Jika Superadmin yang login, sistem otomatis mengarahkan ke <span className="font-mono text-emerald-300">superadmin.html</span>.
                </>
              ) : (
                <>
                  Jika Anda login menggunakan akun Superadmin (<span className="font-mono text-emerald-300">{SUPERADMIN_EMAIL}</span>), sistem otomatis mengarahkan langsung ke <span className="font-mono text-emerald-300">superadmin.html</span>.
                </>
              )}
            </p>
          </div>

          <div className="p-6 sm:p-7 space-y-6">
            {redirectTarget ? (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-800 mx-auto" />
                <h2 className="text-base font-semibold text-slate-900">
                  Otentikasi Akun Berhasil
                </h2>
                <p className="text-xs text-slate-600">
                  Mengarahkan Anda secara otomatis ke file terpisah{' '}
                  <span className="font-mono font-semibold text-emerald-900">
                    {redirectTarget}
                  </span>
                  ...
                </p>
              </div>
            ) : (
              <>
                {errorMsg && (
                  <div
                    role="alert"
                    className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-2.5 text-xs"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">
                      {errorMsg}
                    </span>
                  </div>
                )}

                {/* =========================================================
                    PORTAL 1: PELAJAR TERDAFTAR (pelajar.html)
                   ========================================================= */}
                {portalRole === 'pelajar' && (
                  <div className="space-y-5">
                    <form
                      onSubmit={handleStudentLoginSubmit}
                      className="space-y-4"
                    >
                      <div>
                        <label
                          htmlFor="student-id-input"
                          className="block text-xs font-semibold text-slate-800 mb-1"
                        >
                          Email Pelajar Terdaftar / Nomor Registrasi *
                        </label>
                        <input
                          id="student-id-input"
                          type="text"
                          required
                          value={studentIdentifier}
                          onChange={(e) =>
                            setStudentIdentifier(e.target.value)
                          }
                          placeholder="Contoh: TL-2026-8419 atau email Anda"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="student-pass-input"
                          className="block text-xs font-semibold text-slate-800 mb-1"
                        >
                          Kata Sandi Akun Pelajar *
                        </label>
                        <input
                          id="student-pass-input"
                          type="password"
                          required
                          value={studentPassword}
                          onChange={(e) =>
                            setStudentPassword(e.target.value)
                          }
                          placeholder="Masukkan kata sandi akun pelajar"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Masuk ke Halaman Pelajar (pelajar.html)</span>
                      </button>
                    </form>

                    {/* Quick Fill Registered Student Accounts for Easy Testing */}
                    <div className="p-3.5 rounded-lg bg-[#FBF9F5] border border-slate-200 space-y-2.5">
                      <p className="text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold">
                        Pilih Cepat Akun Pelajar yang Sudah Terdaftar:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {sampleAccounts.map((acc) => {
                          const isMulti = (acc.enrolledRegistrationNumbers?.length || 0) > 1;
                          return (
                            <button
                              key={acc.registrationNumber}
                              type="button"
                              onClick={() => {
                                setStudentIdentifier(acc.email);
                                setStudentPassword(acc.password);
                                setErrorMsg(null);
                              }}
                              className={`px-2.5 py-1.5 text-[11px] font-mono rounded-md transition-all cursor-pointer ${
                                isMulti
                                  ? 'bg-emerald-100 border border-emerald-400 text-emerald-950 font-bold hover:bg-emerald-200 shadow-2xs'
                                  : 'bg-white border border-slate-300 hover:border-emerald-800 text-slate-800'
                              }`}
                              title={isMulti ? 'Akun Demo: Sudah pernah menyelesaikan Level 1 di Angkatan 1 & terdaftar kembali di Angkatan 2' : undefined}
                            >
                              {acc.registrationNumber} ({acc.fullName.split(' ')[0]}{isMulti ? ' · Demo Lv 1 2x' : ''})
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal pt-1 border-t border-slate-200">
                        💡 <strong>Akun Demo 2x Lv 1:</strong> Pilih <strong>TL-2026-8452 (Siti · Demo Lv 1 2x)</strong> untuk melihat akun yang sudah lunas & tuntas di Angkatan 1, serta terdaftar aktif di Angkatan 2.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      <span>Belum mendaftar program?</span>
                      <a
                        href="./index.html#/pendaftaran"
                        className="font-semibold text-emerald-900 hover:underline"
                      >
                        Daftar & Buat Akun Pelajar Baru →
                      </a>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    PORTAL 2: SUPERADMIN (superadmin.html)
                   ========================================================= */}
                {portalRole === 'superadmin' && (
                  <div className="space-y-5">
                    {currentUser && !isUserSuperAdmin(currentUser) && (
                      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 space-y-3 text-xs">
                        <p className="font-semibold">
                          Anda sedang login sebagai:{' '}
                          <span className="font-mono">{currentUser.email}</span>
                        </p>
                        <p className="leading-relaxed">
                          Akun ini tidak memiliki hak akses Superadmin. Hanya{' '}
                          <span className="font-mono font-semibold">
                            {SUPERADMIN_EMAIL}
                          </span>{' '}
                          yang dapat mengakses{' '}
                          <span className="font-mono">superadmin.html</span>.
                        </p>
                        <button
                          type="button"
                          onClick={handleSwitchAccount}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Keluar & Ganti Akun Superadmin
                        </button>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <label className="block text-xs font-semibold text-slate-700">
                        Metode 1 — Otentikasi Google Superadmin
                      </label>
                      <button
                        type="button"
                        disabled={isSubmitting || authChecking}
                        onClick={handleGoogleLogin}
                        className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <LogIn className="w-4 h-4" />
                        {isSubmitting
                          ? 'Memverifikasi Akun...'
                          : 'Login dengan Google Superadmin'}
                      </button>
                    </div>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink mx-3 text-[11px] font-mono text-slate-400 uppercase">
                        Atau Kredensial Superadmin
                      </span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <form
                      onSubmit={handleSuperadminFormLogin}
                      className="space-y-4"
                    >
                      <div>
                        <label
                          htmlFor="superadmin-email"
                          className="block text-xs font-semibold text-slate-800 mb-1"
                        >
                          Email Superadmin Terdaftar *
                        </label>
                        <input
                          id="superadmin-email"
                          type="email"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="Masukkan email Superadmin"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="superadmin-pass"
                          className="block text-xs font-semibold text-slate-800 mb-1"
                        >
                          Kata Sandi / Kode Akses Superadmin *
                        </label>
                        <input
                          id="superadmin-pass"
                          type="password"
                          required
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Masuk & Buka superadmin.html
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-800 text-xs">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>
            File Login Terpisah (<span className="font-mono text-slate-200">login.html</span>) — Pelajar (<span className="font-mono text-emerald-400">pelajar.html</span>) & Superadmin (<span className="font-mono text-emerald-400">superadmin.html</span>)
          </p>
          <a
            href="./index.html"
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            ← Kembali ke Halaman Utama (index.html)
          </a>
        </div>
      </footer>
    </div>
  );
}
