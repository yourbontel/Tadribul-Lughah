import {
  INITIAL_REGISTRATIONS,
  RegistrationRecord
} from '../data/arabicAcademyData';

export const STUDENT_ACCOUNTS_STORAGE_KEY = 'tl_student_accounts_v1';
export const STUDENT_SESSION_STORAGE_KEY = 'tl_student_verified_session_v1';

export interface StudentAccount {
  registrationNumber: string;
  fullName: string;
  gender?: 'Laki-laki' | 'Perempuan';
  email: string;
  whatsapp: string;
  city?: string;
  occupation?: string;
  password: string;
  enrolledProgramIds?: string[];
  enrolledRegistrationNumbers?: string[];
  completedModuleKeys: string[];
  createdAt: string;
}

export interface StudentSessionPayload {
  registrationNumber: string;
  email: string;
  fullName: string;
  loginAt: string;
}

const DEFAULT_STUDENT_ACCOUNTS: StudentAccount[] = INITIAL_REGISTRATIONS.map(
  (reg) => ({
    registrationNumber: reg.registrationNumber,
    fullName: reg.fullName,
    gender: (reg.gender as 'Laki-laki' | 'Perempuan') || 'Laki-laki',
    email: reg.email.toLowerCase(),
    whatsapp: reg.whatsapp,
    city: reg.city || 'Indonesia',
    occupation: reg.occupation || 'Pelajar Terdaftar',
    // Default initial password for pre-registered sample students is their registration number (e.g. TL-2026-8419) or 'pelajar123'
    password: reg.registrationNumber,
    enrolledProgramIds: [reg.selectedProgramId],
    enrolledRegistrationNumbers: [reg.registrationNumber],
    completedModuleKeys: [`${reg.selectedProgramId}-0`],
    createdAt: reg.registeredAt
  })
);

export function getStudentAccounts(): StudentAccount[] {
  try {
    const raw = localStorage.getItem(STUDENT_ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default accounts are merged so existing sample registrations always have accounts
        const map = new Map<string, StudentAccount>();
        for (const def of DEFAULT_STUDENT_ACCOUNTS) {
          map.set(def.registrationNumber.toUpperCase(), def);
        }
        for (const item of parsed) {
          if (item && item.registrationNumber) {
            map.set(String(item.registrationNumber).toUpperCase(), item);
          }
        }
        return Array.from(map.values());
      }
    }
  } catch {
    // Fallback
  }
  return DEFAULT_STUDENT_ACCOUNTS;
}

export function saveStudentAccount(account: StudentAccount): void {
  const existing = getStudentAccounts();
  const normalizedRegNo = account.registrationNumber.trim().toUpperCase();
  const normalizedEmail = account.email.trim().toLowerCase();

  const updated = existing.filter(
    (a) =>
      a.registrationNumber.toUpperCase() !== normalizedRegNo &&
      a.email.toLowerCase() !== normalizedEmail
  );
  updated.unshift({
    ...account,
    registrationNumber: normalizedRegNo,
    email: normalizedEmail
  });

  try {
    localStorage.setItem(STUDENT_ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
}

export function getActiveStudentSession(): StudentSessionPayload | null {
  try {
    const raw = sessionStorage.getItem(STUDENT_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudentSessionPayload;
    if (parsed && parsed.registrationNumber && parsed.email) {
      return parsed;
    }
  } catch {
    // Ignore
  }
  return null;
}

export function setActiveStudentSession(session: StudentSessionPayload): void {
  try {
    sessionStorage.setItem(
      STUDENT_SESSION_STORAGE_KEY,
      JSON.stringify(session)
    );
  } catch {
    // Ignore
  }
}

export function clearActiveStudentSession(): void {
  try {
    sessionStorage.removeItem(STUDENT_SESSION_STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function registerNewStudentAccount(params: {
  fullName: string;
  gender: 'Laki-laki' | 'Perempuan';
  email: string;
  whatsapp: string;
  city: string;
  occupation: string;
  password: string;
}): { ok: true; account: StudentAccount } | { ok: false; reason: string } {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPass = params.password.trim();
  const cleanName = params.fullName.trim();

  if (!cleanName || cleanName.length < 3) {
    return {
      ok: false,
      reason: 'Nama Lengkap minimal 3 karakter sesuai identitas.'
    };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return {
      ok: false,
      reason: 'Format email tidak valid (contoh: nama@domain.com).'
    };
  }
  const phoneDigits = params.whatsapp.replace(/\D/g, '');
  if (phoneDigits.length < 9) {
    return {
      ok: false,
      reason: 'Nomor WhatsApp minimal 9 digit angka.'
    };
  }
  if (!params.city || params.city.trim().length < 2) {
    return {
      ok: false,
      reason: 'Mohon isi Kota Domisili Anda.'
    };
  }
  if (cleanPass.length < 6) {
    return {
      ok: false,
      reason: 'Kata sandi akun minimal 6 karakter.'
    };
  }

  const existingAccounts = getStudentAccounts();
  const alreadyExists = existingAccounts.find(
    (a) => a.email.toLowerCase() === cleanEmail
  );
  if (alreadyExists) {
    return {
      ok: false,
      reason: `Email "${cleanEmail}" sudah memiliki akun. Silakan masuk dengan kata sandi Anda untuk mendaftar program.`
    };
  }

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const userRegNo = `TL-2026-${randomDigits}`;
  const nowStr =
    new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date()) + ' WIB';

  const newAcc: StudentAccount = {
    registrationNumber: userRegNo,
    fullName: cleanName,
    gender: params.gender,
    email: cleanEmail,
    whatsapp: params.whatsapp.trim(),
    city: params.city.trim(),
    occupation: params.occupation.trim() || 'Pelajar Terdaftar',
    password: cleanPass,
    enrolledProgramIds: [],
    enrolledRegistrationNumbers: [],
    completedModuleKeys: [],
    createdAt: nowStr
  };

  saveStudentAccount(newAcc);
  setActiveStudentSession({
    registrationNumber: userRegNo,
    email: cleanEmail,
    fullName: cleanName,
    loginAt: new Date().toISOString()
  });

  return { ok: true, account: newAcc };
}

export function loginStudentAccount(
  identifier: string,
  passwordInput: string
): { ok: true; account: StudentAccount } | { ok: false; reason: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanId || !cleanPass) {
    return {
      ok: false,
      reason: 'Masukkan Email atau Nomor Registrasi beserta Kata Sandi Akun.'
    };
  }

  const accounts = getStudentAccounts();
  const matchedAccount = accounts.find(
    (a) =>
      a.email.toLowerCase() === cleanId ||
      a.registrationNumber.toLowerCase() === cleanId
  );

  if (!matchedAccount) {
    return {
      ok: false,
      reason:
        'Akun pelajar tidak ditemukan. Silakan buat akun pelajar baru terlebih dahulu sebelum mendaftar program.'
    };
  }

  const isPasswordMatch =
    matchedAccount.password === cleanPass ||
    matchedAccount.password.toLowerCase() === cleanPass.toLowerCase() ||
    cleanPass.toUpperCase() === matchedAccount.registrationNumber.toUpperCase();

  if (!isPasswordMatch) {
    return {
      ok: false,
      reason: 'Kata sandi akun pelajar tidak sesuai.'
    };
  }

  setActiveStudentSession({
    registrationNumber: matchedAccount.registrationNumber,
    email: matchedAccount.email,
    fullName: matchedAccount.fullName,
    loginAt: new Date().toISOString()
  });

  return { ok: true, account: matchedAccount };
}

export function enrollStudentInProgram(
  accountEmail: string,
  programId: string,
  registrationNumber: string
): void {
  const accounts = getStudentAccounts();
  const normEmail = accountEmail.trim().toLowerCase();
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === normEmail);
  if (idx !== -1) {
    const acc = accounts[idx];
    const enrolledProgramIds = acc.enrolledProgramIds || [];
    const enrolledRegistrationNumbers = acc.enrolledRegistrationNumbers || [];
    if (!enrolledProgramIds.includes(programId)) {
      enrolledProgramIds.push(programId);
    }
    if (!enrolledRegistrationNumbers.includes(registrationNumber)) {
      enrolledRegistrationNumbers.push(registrationNumber);
    }
    acc.enrolledProgramIds = enrolledProgramIds;
    acc.enrolledRegistrationNumbers = enrolledRegistrationNumbers;
    saveStudentAccount(acc);
  }
}

export function getStudentRegistrations(
  studentEmailOrRegNo: string,
  allRegistrations: RegistrationRecord[]
): RegistrationRecord[] {
  const clean = studentEmailOrRegNo.trim().toLowerCase();
  const accounts = getStudentAccounts();
  const matchedAcc = accounts.find(
    (a) =>
      a.email.toLowerCase() === clean ||
      a.registrationNumber.toLowerCase() === clean
  );

  const targetEmail = matchedAcc ? matchedAcc.email.toLowerCase() : clean;
  const targetRegNos = new Set<string>();
  if (matchedAcc) {
    targetRegNos.add(matchedAcc.registrationNumber.toUpperCase());
    if (matchedAcc.enrolledRegistrationNumbers) {
      for (const rn of matchedAcc.enrolledRegistrationNumbers) {
        targetRegNos.add(rn.toUpperCase());
      }
    }
  }

  const merged = loadMergedRegistrations(allRegistrations);
  return merged.filter((r) => {
    if (!r) return false;
    if (r.email && r.email.toLowerCase() === targetEmail) return true;
    if (targetRegNos.has(r.registrationNumber.toUpperCase())) return true;
    return false;
  });
}

export function loadMergedRegistrations(
  externalRegistrations?: RegistrationRecord[]
): RegistrationRecord[] {
  const list: RegistrationRecord[] = [];
  const seen = new Set<string>();

  const addAll = (items: RegistrationRecord[]) => {
    for (const item of items) {
      if (!item || !item.registrationNumber) continue;
      const key = item.registrationNumber.toUpperCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    }
  };

  if (externalRegistrations && externalRegistrations.length > 0) {
    addAll(externalRegistrations);
  }

  try {
    const saved = localStorage.getItem('tadribul_lughah_registrations_v3');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        addAll(parsed);
      }
    }
  } catch {
    // Ignore
  }

  addAll(INITIAL_REGISTRATIONS);
  return list;
}

export function authenticateStudentCredentials(
  identifier: string,
  passwordInput: string,
  externalRegistrations?: RegistrationRecord[]
):
  | { ok: true; account: StudentAccount; registration: RegistrationRecord }
  | { ok: false; reason: string } {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  if (!cleanId || !cleanPass) {
    return {
      ok: false,
      reason: 'Masukkan Email / Nomor Registrasi beserta Kata Sandi Akun Pelajar.'
    };
  }

  const registrations = loadMergedRegistrations(externalRegistrations);
  const accounts = getStudentAccounts();

  // Find matching registration by registrationNumber or email
  const matchedReg = registrations.find(
    (r) =>
      r.registrationNumber.toLowerCase() === cleanId ||
      (r.email &&
        r.email.toLowerCase() !== 'terlindungi (privat)' &&
        r.email.toLowerCase() === cleanId)
  );

  // Also check in accounts list in case email was masked in public status doc
  const matchedAccount = accounts.find(
    (a) =>
      a.registrationNumber.toLowerCase() === cleanId ||
      a.email.toLowerCase() === cleanId
  );

  if (!matchedReg && !matchedAccount) {
    return {
      ok: false,
      reason:
        'Data tidak ditemukan. Anda harus terdaftar sebagai peserta Tadribul Lughah terlebih dahulu sebelum dapat mengakses halaman pelajar (pelajar.html).'
    };
  }

  const regNo = (
    matchedAccount?.registrationNumber ||
    matchedReg?.registrationNumber ||
    ''
  ).toUpperCase();

  const account = accounts.find(
    (a) => a.registrationNumber.toUpperCase() === regNo
  );

  if (!account) {
    return {
      ok: false,
      reason: `Nomor Registrasi ${regNo} sudah terdaftar sebagai peserta, namun belum mengaktifkan akun pelajar. Silakan klik tab "Aktivasi Akun Pelajar" di bawah untuk membuat kata sandi akun Anda.`
    };
  }

  // Verify password (accept account password, or registrationNumber for initial demo convenience)
  const isPasswordMatch =
    account.password === cleanPass ||
    account.password.toLowerCase() === cleanPass.toLowerCase() ||
    cleanPass.toUpperCase() === account.registrationNumber.toUpperCase();

  if (!isPasswordMatch) {
    return {
      ok: false,
      reason:
        'Kata sandi akun pelajar tidak sesuai. Gunakan kata sandi yang Anda buat saat pendaftaran atau gunakan Nomor Registrasi Anda.'
    };
  }

  const finalRegistration: RegistrationRecord = matchedReg || {
    registrationNumber: account.registrationNumber,
    fullName: account.fullName,
    email: account.email,
    whatsapp: account.whatsapp,
    occupation: 'Pelajar Terdaftar',
    city: 'Indonesia',
    selectedProgramId: 'tl-level-1',
    selectedProgramName:
      'Tadribul Lughah Level 1 — Nahwu Dasar (Al-Mabadi’ An-Nahwiyyah)',
    selectedScheduleId: 'sch-lv1-malam',
    selectedScheduleSummary:
      'TL-LV1-MLM · Kamis & Jumat (20.00 – 22.00 WIB) · Online',
    learningGoal: 'Menguasai kaidah Nahwu dan Shorof secara sistematis.',
    totalTuitionIDR: 510000,
    registeredAt: account.createdAt,
    status: 'Terverifikasi — Menunggu Orientasi'
  };

  return {
    ok: true,
    account,
    registration: finalRegistration
  };
}

export function activateStudentAccountForRegisteredLearner(params: {
  registrationNumber: string;
  email: string;
  password: string;
  externalRegistrations?: RegistrationRecord[];
}):
  | { ok: true; account: StudentAccount; registration: RegistrationRecord }
  | { ok: false; reason: string } {
  const cleanRegNo = params.registrationNumber.trim().toUpperCase();
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPassword = params.password.trim();

  if (!cleanRegNo.startsWith('TL-')) {
    return {
      ok: false,
      reason:
        'Format Nomor Registrasi tidak valid (contoh yang benar: TL-2026-8419). Anda harus mendaftar program terlebih dahulu di halaman Pendaftaran.'
    };
  }

  if (cleanPassword.length < 6) {
    return {
      ok: false,
      reason: 'Kata sandi akun pelajar minimal harus terdiri dari 6 karakter.'
    };
  }

  const registrations = loadMergedRegistrations(params.externalRegistrations);
  const matchedReg = registrations.find(
    (r) => r.registrationNumber.toUpperCase() === cleanRegNo
  );

  if (!matchedReg) {
    return {
      ok: false,
      reason: `Nomor Registrasi "${cleanRegNo}" belum terdaftar di database peserta Tadribul Lughah. Silakan daftar terlebih dahulu melalui Formulir Pendaftaran di index.html.`
    };
  }

  // If the registration has a non-masked email, check that it matches
  if (
    matchedReg.email &&
    matchedReg.email.toLowerCase() !== 'terlindungi (privat)' &&
    matchedReg.email.toLowerCase() !== cleanEmail
  ) {
    return {
      ok: false,
      reason: `Email yang Anda masukkan tidak sesuai dengan email yang terdaftar pada Nomor Registrasi ${cleanRegNo}.`
    };
  }

  const newAccount: StudentAccount = {
    registrationNumber: matchedReg.registrationNumber,
    fullName: matchedReg.fullName,
    email: cleanEmail,
    whatsapp: matchedReg.whatsapp,
    password: cleanPassword,
    completedModuleKeys: [`${matchedReg.selectedProgramId}-0`],
    createdAt: new Date().toISOString()
  };

  saveStudentAccount(newAccount);

  return {
    ok: true,
    account: newAccount,
    registration: {
      ...matchedReg,
      email: cleanEmail
    }
  };
}
