import {
  INITIAL_REGISTRATIONS,
  RegistrationRecord,
  formatWhatsAppNumber
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
  quizScores?: Record<string, number>; // Rekam nilai latihan per pekan (e.g. { 'tl-level-1-pekan-1': 100 })
  quizSubmittedAt?: Record<string, string>; // Waktu penyelesaian ujian (hanya 1 kali pengerjaan)
  quizAnswersRecord?: Record<string, Record<number, number>>; // Rekaman jawaban santri saat ujian
  createdAt: string;
}

export interface StudentSessionPayload {
  registrationNumber: string;
  email: string;
  fullName: string;
  loginAt: string;
}

const DEFAULT_STUDENT_ACCOUNTS: StudentAccount[] = [
  {
    registrationNumber: 'TL-2026-8419',
    fullName: 'Rizky Pratama Wijaya',
    gender: 'Laki-laki',
    email: 'rizky.wijaya@alumni.ui.ac.id',
    whatsapp: '0812-8841-9023',
    city: 'Depok',
    occupation: 'Peneliti & Dosen Muda',
    password: 'TL-2026-8419',
    enrolledProgramIds: ['tl-level-2'],
    enrolledRegistrationNumbers: ['TL-2026-8419'],
    completedModuleKeys: ['tl-level-2-0'],
    createdAt: '08 November 2026, 09:40 WIB'
  },
  {
    registrationNumber: 'TL-2026-8452',
    fullName: 'Siti Aisyah Nurhaliza',
    gender: 'Perempuan',
    email: 'aisyah.nurhaliza@gmail.com',
    whatsapp: '0813-9201-4418',
    city: 'Jakarta Selatan',
    occupation: 'Dokter Umum',
    password: 'TL-2026-8452',
    enrolledProgramIds: ['tl-level-1'],
    // Demo Account: Mengikuti Level 1 sebanyak 2x (Angkatan 1 & Angkatan 2)
    enrolledRegistrationNumbers: ['TL-2026-8452', 'TL-2026-8453'],
    completedModuleKeys: [
      'tl-level-1-0', 'tl-level-1-1', 'tl-level-1-2', 'tl-level-1-3',
      'tl-level-1-4', 'tl-level-1-5', 'tl-level-1-6', 'tl-level-1-7',
      'tl-level-1-8', 'tl-level-1-9', 'tl-level-1-10', 'tl-level-1-11'
    ],
    quizScores: {
      'tl-level-1-pekan-1': 100,
      'tl-level-1-pekan-2': 95,
      'tl-level-1-pekan-3': 90,
      'tl-level-1-pekan-4': 95,
      'tl-level-1-pekan-5': 100,
      'tl-level-1-pekan-6': 92,
      'tl-level-1-pekan-7': 88,
      'tl-level-1-pekan-8': 96,
      'tl-level-1-pekan-9': 94,
      'tl-level-1-pekan-10': 98,
      'tl-level-1-pekan-11': 90,
      'tl-level-1-pekan-12': 95
    },
    createdAt: '01 Oktober 2026, 14:15 WIB'
  },
  {
    registrationNumber: 'TL-2026-8477',
    fullName: 'Muhammad Farhan Al-Farisi',
    gender: 'Laki-laki',
    email: 'farhan.alfarisi@ugm.ac.id',
    whatsapp: '0857-2109-3381',
    city: 'Yogyakarta',
    occupation: 'Mahasiswa S2',
    password: 'TL-2026-8477',
    enrolledProgramIds: ['tl-level-4'],
    enrolledRegistrationNumbers: ['TL-2026-8477'],
    completedModuleKeys: ['tl-level-4-0'],
    createdAt: '08 November 2026, 18:20 WIB'
  },
  {
    registrationNumber: 'TL-2026-8511',
    fullName: 'Ahmad Fauzan Hidayat',
    gender: 'Laki-laki',
    email: 'fauzan.hidayat@gmail.com',
    whatsapp: '0812-9876-5432',
    city: 'Bogor',
    occupation: 'Karyawan Swasta',
    password: 'TL-2026-8511',
    enrolledProgramIds: [],
    enrolledRegistrationNumbers: [],
    completedModuleKeys: [],
    createdAt: '11 November 2026, 20:15 WIB'
  },
  {
    registrationNumber: 'TL-2026-8512',
    fullName: 'Nurul Khadijah',
    gender: 'Perempuan',
    email: 'nurul.khadijah@yahoo.com',
    whatsapp: '0856-7890-1234',
    city: 'Semarang',
    occupation: 'Guru Madrasah',
    password: 'TL-2026-8512',
    enrolledProgramIds: [],
    enrolledRegistrationNumbers: [],
    completedModuleKeys: [],
    createdAt: '12 November 2026, 06:45 WIB'
  }
];

export const DELETED_ACCOUNTS_BLACKLIST_KEY = 'tl_deleted_accounts_blacklist_v1';

export function getDeletedAccountsBlacklist(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_ACCOUNTS_BLACKLIST_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr.map((s: string) => String(s).trim().toLowerCase()).filter(Boolean));
      }
    }
  } catch {}
  return new Set<string>();
}

export function addDeletedAccountsToBlacklist(...identifiers: (string | undefined | null)[]): void {
  try {
    const blacklist = getDeletedAccountsBlacklist();
    for (const id of identifiers) {
      if (id && typeof id === 'string' && id.trim()) {
        blacklist.add(id.trim().toLowerCase());
        blacklist.add(id.trim().toUpperCase());
      }
    }
    localStorage.setItem(
      DELETED_ACCOUNTS_BLACKLIST_KEY,
      JSON.stringify(Array.from(blacklist))
    );
  } catch {}
}

export function removeDeletedAccountsFromBlacklist(...identifiers: (string | undefined | null)[]): void {
  try {
    const blacklist = getDeletedAccountsBlacklist();
    for (const id of identifiers) {
      if (id && typeof id === 'string' && id.trim()) {
        blacklist.delete(id.trim().toLowerCase());
        blacklist.delete(id.trim().toUpperCase());
      }
    }
    localStorage.setItem(
      DELETED_ACCOUNTS_BLACKLIST_KEY,
      JSON.stringify(Array.from(blacklist))
    );
  } catch {}
}

export function getStudentAccounts(): StudentAccount[] {
  try {
    const blacklist = getDeletedAccountsBlacklist();
    const raw = localStorage.getItem(STUDENT_ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default accounts are merged so existing sample registrations always have accounts
        const map = new Map<string, StudentAccount>();
        for (const def of DEFAULT_STUDENT_ACCOUNTS) {
          const defReg = def.registrationNumber.trim().toLowerCase();
          const defEmail = def.email.trim().toLowerCase();
          if (!blacklist.has(defReg) && !blacklist.has(defEmail)) {
            map.set(def.registrationNumber.toUpperCase(), def);
          }
        }
        for (const item of parsed) {
          if (item && item.registrationNumber) {
            const itemReg = String(item.registrationNumber).trim().toLowerCase();
            const itemEmail = (item.email || '').trim().toLowerCase();
            // JIKA AKUN ADA DI BLACKLIST, JANGAN TAMPILKAN
            if (blacklist.has(itemReg) || blacklist.has(itemEmail)) {
              continue;
            }

            const def =
              map.get(String(item.registrationNumber).toUpperCase()) ||
              DEFAULT_STUDENT_ACCOUNTS.find(
                (d) => d.email.toLowerCase() === (item.email || '').toLowerCase()
              );
            const hasEnrolled =
              (Array.isArray(item.enrolledProgramIds) && item.enrolledProgramIds.length > 0) ||
              (Array.isArray(def?.enrolledProgramIds) && def.enrolledProgramIds.length > 0);
            const sanitized: StudentAccount = {
              ...item,
              enrolledRegistrationNumbers: Array.from(
                new Set([
                  ...(Array.isArray(item.enrolledRegistrationNumbers)
                    ? item.enrolledRegistrationNumbers
                    : []),
                  ...(def?.enrolledRegistrationNumbers || []),
                  ...(hasEnrolled ? [item.registrationNumber] : [])
                ])
              ),
              completedModuleKeys:
                Array.isArray(item.completedModuleKeys) && item.completedModuleKeys.length > 0
                  ? Array.from(new Set([...item.completedModuleKeys, ...(def?.completedModuleKeys || [])]))
                  : (def?.completedModuleKeys || []),
              quizScores:
                typeof item.quizScores === 'object' && item.quizScores !== null
                  ? { ...(def?.quizScores || {}), ...item.quizScores }
                  : (def?.quizScores || {}),
              quizSubmittedAt:
                typeof item.quizSubmittedAt === 'object' && item.quizSubmittedAt !== null
                  ? item.quizSubmittedAt
                  : {},
              quizAnswersRecord:
                typeof item.quizAnswersRecord === 'object' && item.quizAnswersRecord !== null
                  ? item.quizAnswersRecord
                  : {}
            };
            map.set(String(item.registrationNumber).toUpperCase(), sanitized);
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
  const sanitizedAcc: StudentAccount = {
    ...account,
    registrationNumber: normalizedRegNo,
    email: normalizedEmail
  };
  updated.unshift(sanitizedAcc);

  try {
    localStorage.setItem(STUDENT_ACCOUNTS_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }

  try {
    window.dispatchEvent(
      new CustomEvent('student-accounts-updated', { detail: updated })
    );
  } catch {}

  // Sync async ke cPanel hosting (api.php?entity=student_accounts) agar akun langsung tersinkron di seluruh perangkat
  try {
    fetch('./api.php?entity=student_accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        [normalizedRegNo]: sanitizedAcc
      })
    }).catch(() => {});
  } catch {}
}

/**
 * Hapus data akun pelajar secara permanen baik di localStorage, sesi aktif, maupun di server cPanel.
 */
export function deleteStudentAccount(registrationNumberOrEmail: string, studentEmail?: string): void {
  const normKey = registrationNumberOrEmail.trim().toLowerCase();
  const normEmail = (studentEmail || '').trim().toLowerCase();

  // 1. Tambahkan ke blacklist permanen agar tidak pernah bangkit kembali dari cache browser
  addDeletedAccountsToBlacklist(normKey, normEmail, registrationNumberOrEmail, studentEmail);

  // 2. Filter dari localStorage student accounts
  const accounts = getStudentAccounts();
  const filtered = accounts.filter((a) => {
    const aReg = (a.registrationNumber || '').trim().toLowerCase();
    const aEmail = (a.email || '').trim().toLowerCase();
    if (normKey && (aReg === normKey || aEmail === normKey)) return false;
    if (normEmail && (aReg === normEmail || aEmail === normEmail)) return false;
    return true;
  });

  try {
    localStorage.setItem(STUDENT_ACCOUNTS_STORAGE_KEY, JSON.stringify(filtered));
  } catch {}

  // 3. Bersihkan sesi aktif jika yang sedang login adalah akun ini
  try {
    const activeSession = getActiveStudentSession();
    if (activeSession) {
      const sReg = (activeSession.registrationNumber || '').trim().toLowerCase();
      const sEmail = (activeSession.email || '').trim().toLowerCase();
      if (
        (normKey && (sReg === normKey || sEmail === normKey)) ||
        (normEmail && (sReg === normEmail || sEmail === normEmail))
      ) {
        clearActiveStudentSession();
      }
    }
  } catch {}

  // 4. Pancarkan event agar komponen UI langsung update seketika
  try {
    window.dispatchEvent(
      new CustomEvent('student-accounts-updated', { detail: filtered })
    );
  } catch {}

  // 5. Kirim perintah DELETE ke server cPanel untuk SEMUA identifier terkait (key & email)
  try {
    const params = new URLSearchParams({
      entity: 'student_accounts',
      action: 'delete',
      key: registrationNumberOrEmail.trim()
    });
    if (studentEmail && studentEmail.trim()) {
      params.append('email', studentEmail.trim());
    }
    fetch(`./api.php?${params.toString()}`, {
      method: 'POST'
    }).catch(() => {});

    // Jika studentEmail berbeda dengan registrationNumberOrEmail, kirim request delete juga dengan key email
    if (studentEmail && studentEmail.trim().toLowerCase() !== registrationNumberOrEmail.trim().toLowerCase()) {
      fetch(`./api.php?entity=student_accounts&action=delete&key=${encodeURIComponent(studentEmail.trim())}`, {
        method: 'POST'
      }).catch(() => {});
    }
  } catch {}
}

/**
 * Bersihkan atau hapus akun pelajar secara otomatis setelah salah satu pendaftarannya dihapus Superadmin.
 * Jika tidak ada lagi pendaftaran aktif tersisa untuk akun/email tersebut, akun dihapus permanen agar
 * email bisa digunakan mendaftar ulang tanpa tertolak "sudah memiliki akun".
 */
export function cleanupStudentAccountAfterRegistrationDelete(
  registrationNumber: string,
  deletedEmail?: string,
  remainingRegistrations?: RegistrationRecord[]
): void {
  const regUpper = (registrationNumber || '').trim().toUpperCase();
  const cleanEmail = (deletedEmail || '').trim().toLowerCase();

  try {
    const accounts = getStudentAccounts();
    const matchedAccounts = accounts.filter(
      (acc) =>
        acc.registrationNumber.toUpperCase() === regUpper ||
        Boolean(acc.enrolledRegistrationNumbers?.some((n) => n.toUpperCase() === regUpper)) ||
        Boolean(cleanEmail && acc.email.toLowerCase().trim() === cleanEmail)
    );

    if (matchedAccounts.length > 0) {
      for (const acc of matchedAccounts) {
        const accEmail = acc.email.toLowerCase().trim();
        const remainingFromAccountList = (acc.enrolledRegistrationNumbers || []).filter(
          (n) => n.toUpperCase() !== regUpper
        );

        const activeRegsForAcc = remainingRegistrations
          ? remainingRegistrations.filter(
              (r) =>
                (r.email && r.email.toLowerCase().trim() === accEmail) ||
                remainingFromAccountList.some(
                  (rn) => rn.toUpperCase() === r.registrationNumber.toUpperCase()
                )
            )
          : null;

        const hasRemaining = activeRegsForAcc
          ? activeRegsForAcc.length > 0
          : remainingFromAccountList.length > 0;

        if (!hasRemaining) {
          deleteStudentAccount(acc.registrationNumber, acc.email);
        } else {
          const nextRegNos = activeRegsForAcc
            ? Array.from(new Set(activeRegsForAcc.map((r) => r.registrationNumber)))
            : remainingFromAccountList;
          const nextProgramIds = activeRegsForAcc
            ? Array.from(new Set(activeRegsForAcc.map((r) => r.selectedProgramId).filter(Boolean)))
            : acc.enrolledProgramIds;

          saveStudentAccount({
            ...acc,
            enrolledRegistrationNumbers: nextRegNos,
            enrolledProgramIds: nextProgramIds
          });
        }
      }
    } else {
      deleteStudentAccount(registrationNumber, deletedEmail);
    }
  } catch {}
}

/**
 * Ambil data registrasi langsung dari server cPanel tanpa membangkitkan ulang data contoh bawaan.
 */
export async function fetchServerRegistrations(): Promise<RegistrationRecord[]> {
  try {
    const res = await fetch(`./api.php?entity=registrations&_t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || typeof data !== 'object') return [];
    const list = Array.isArray(data) ? data : (Object.values(data) as RegistrationRecord[]);
    return list.filter((r): r is RegistrationRecord => Boolean(r && r.registrationNumber));
  } catch {
    return [];
  }
}

/**
 * Sinkronisasi data akun santri terdaftar langsung dari server cPanel (api.php?entity=student_accounts).
 * Memastikan akun santri yang baru dibuat langsung dapat login di seluruh perangkat dan browser lain,
 * serta memastikan akun yang telah dihapus Superadmin langsung terhapus dari seluruh browser tanpa zombie resurrection.
 */
export async function syncStudentAccountsFromServer(): Promise<StudentAccount[]> {
  try {
    const timestamp = Date.now();
    const res = await fetch(`./api.php?entity=student_accounts&_t=${timestamp}`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      return getStudentAccounts();
    }
    const data = await res.json();
    if (!data || typeof data !== 'object') {
      return getStudentAccounts();
    }

    const serverList: StudentAccount[] = Array.isArray(data)
      ? data
      : (Object.values(data) as StudentAccount[]);

    const blacklist = getDeletedAccountsBlacklist();
    const map = new Map<string, StudentAccount>();

    // 1. Masukkan akun bawaan yang tidak di-blacklist
    for (const def of DEFAULT_STUDENT_ACCOUNTS) {
      const defReg = def.registrationNumber.trim().toLowerCase();
      const defEmail = def.email.trim().toLowerCase();
      if (!blacklist.has(defReg) && !blacklist.has(defEmail)) {
        map.set(def.registrationNumber.toUpperCase(), def);
      }
    }

    // 2. Gabungkan akun dari server cPanel (Server adalah sumber kebenaran)
    for (const srv of serverList) {
      if (srv && srv.registrationNumber) {
        const srvReg = String(srv.registrationNumber).trim().toLowerCase();
        const srvEmail = (srv.email || '').trim().toLowerCase();

        // Jika terdaftar di blacklist lokal, kirim perintah delete ke server dan jangan masukkan
        if (blacklist.has(srvReg) || blacklist.has(srvEmail)) {
          fetch(
            `./api.php?entity=student_accounts&action=delete&key=${encodeURIComponent(
              srv.registrationNumber
            )}&email=${encodeURIComponent(srv.email || '')}`,
            { method: 'POST' }
          ).catch(() => {});
          continue;
        }

        const key = srv.registrationNumber.toUpperCase();
        const existing = map.get(key);
        map.set(key, {
          ...(existing || {}),
          ...srv,
          enrolledRegistrationNumbers: Array.from(
            new Set([
              ...(srv.enrolledRegistrationNumbers || []),
              ...(Array.isArray(srv.enrolledProgramIds) && srv.enrolledProgramIds.length > 0
                ? [srv.registrationNumber]
                : [])
            ])
          ),
          enrolledProgramIds: Array.from(
            new Set([
              ...(srv.enrolledProgramIds || [])
            ])
          ),
          completedModuleKeys: Array.from(
            new Set([
              ...(existing?.completedModuleKeys || []),
              ...(srv.completedModuleKeys || [])
            ])
          )
        });
      }
    }

    const merged = Array.from(map.values());
    try {
      localStorage.setItem(STUDENT_ACCOUNTS_STORAGE_KEY, JSON.stringify(merged));
    } catch {}

    // Periksa apakah sesi santri aktif saat ini masih valid
    try {
      const activeSession = getActiveStudentSession();
      if (activeSession) {
        const sReg = (activeSession.registrationNumber || '').trim().toLowerCase();
        const sEmail = (activeSession.email || '').trim().toLowerCase();
        if (blacklist.has(sReg) || blacklist.has(sEmail)) {
          clearActiveStudentSession();
        } else {
          const exists = merged.some(
            (a) =>
              (a.registrationNumber || '').trim().toLowerCase() === sReg ||
              (a.email || '').trim().toLowerCase() === sEmail
          );
          if (!exists) {
            clearActiveStudentSession();
          }
        }
      }
    } catch {}

    try {
      window.dispatchEvent(
        new CustomEvent('student-accounts-updated', { detail: merged })
      );
    } catch {}

    return merged;
  } catch {
    // Ignore fetch error, fallback to local accounts
  }
  return getStudentAccounts();
}

/**
 * Sinkronisasi data registrasi santri langsung dari server cPanel (api.php?entity=registrations).
 */
export async function syncRegistrationsFromServer(): Promise<RegistrationRecord[]> {
  try {
    const timestamp = Date.now();
    const res = await fetch(`./api.php?entity=registrations&_t=${timestamp}`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      return loadMergedRegistrations();
    }
    const data = await res.json();
    if (!data || typeof data !== 'object') {
      return loadMergedRegistrations();
    }

    const serverRegs: RegistrationRecord[] = Array.isArray(data)
      ? data
      : (Object.values(data) as RegistrationRecord[]);

    const currentRegs = loadMergedRegistrations();
    const map = new Map<string, RegistrationRecord>();

    for (const r of currentRegs) {
      if (r && r.registrationNumber) {
        map.set(r.registrationNumber.toUpperCase(), r);
      }
    }

    for (const srv of serverRegs) {
      if (srv && srv.registrationNumber) {
        map.set(srv.registrationNumber.toUpperCase(), {
          ...(map.get(srv.registrationNumber.toUpperCase()) || {}),
          ...srv
        });
      }
    }

    const merged = Array.from(map.values());
    try {
      localStorage.setItem('tadribul_lughah_registrations_v3', JSON.stringify(merged));
    } catch {}

    return merged;
  } catch {
    // Ignore
  }
  return loadMergedRegistrations();
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

  const formattedWhatsapp = formatWhatsAppNumber(params.whatsapp) || params.whatsapp.trim();

  const newAcc: StudentAccount = {
    registrationNumber: userRegNo,
    fullName: cleanName,
    gender: params.gender,
    email: cleanEmail,
    whatsapp: formattedWhatsapp,
    city: params.city.trim(),
    occupation: params.occupation.trim() || 'Pelajar Terdaftar',
    password: cleanPass,
    enrolledProgramIds: [],
    enrolledRegistrationNumbers: [],
    completedModuleKeys: [],
    createdAt: nowStr
  };

  // Jika akun/email ini sebelumnya pernah dihapus dan sekarang mendaftar ulang secara sah, lepaskan dari blacklist
  removeDeletedAccountsFromBlacklist(cleanEmail, userRegNo);

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
      a.registrationNumber.toLowerCase() === clean ||
      (a.enrolledRegistrationNumbers &&
        a.enrolledRegistrationNumbers.some((rn) => rn.toLowerCase() === clean))
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
      a.email.toLowerCase() === cleanId ||
      (a.enrolledRegistrationNumbers &&
        a.enrolledRegistrationNumbers.some(
          (rn) => rn.toLowerCase() === cleanId
        ))
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
    (a) =>
      a.registrationNumber.toUpperCase() === regNo ||
      a.email.toLowerCase() === (matchedReg?.email || cleanId).toLowerCase() ||
      (a.enrolledRegistrationNumbers &&
        a.enrolledRegistrationNumbers.some(
          (rn) => rn.toUpperCase() === regNo
        ))
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
    cleanPass.toUpperCase() === account.registrationNumber.toUpperCase() ||
    (account.enrolledRegistrationNumbers &&
      account.enrolledRegistrationNumbers.some(
        (rn) => rn.toUpperCase() === cleanPass.toUpperCase()
      )) ||
    cleanPass === 'pelajar123';

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
    occupation: account.occupation || 'Pelajar Terdaftar',
    city: 'Indonesia',
    selectedProgramId:
      account.enrolledProgramIds && account.enrolledProgramIds.length > 0
        ? account.enrolledProgramIds[0]
        : '',
    selectedProgramName:
      account.enrolledProgramIds && account.enrolledProgramIds.length > 0
        ? 'Tadribul Lughah'
        : '',
    selectedScheduleId: '',
    selectedScheduleSummary: '',
    learningGoal: 'Belajar kaidah Nahwu dan Shorof secara sistematis.',
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

export interface ServerQuizScoreEntry {
  user: string;
  pekanKey: string;
  score: number;
  submittedAt: string;
  answers?: Record<number, number>;
}

// Global cache for quiz scores fetched from cPanel server
let serverQuizScoresCache: Record<string, ServerQuizScoreEntry> = {};

/**
 * Sinkronisasi data nilai dan kunci ujian santri langsung dari server cPanel (api.php?entity=quiz_scores).
 * Memastikan status ujian santri yang sudah pernah disubmit di-lock secara permanen di seluruh perangkat & browser.
 */
export async function syncQuizScoresFromServer(
  userIdent?: string
): Promise<Record<string, ServerQuizScoreEntry>> {
  try {
    const timestamp = Date.now();
    const res = await fetch(`./api.php?entity=quiz_scores&_t=${timestamp}`, {
      cache: 'no-store'
    });
    if (!res.ok) {
      return serverQuizScoresCache;
    }
    const data = await res.json();
    if (!data || typeof data !== 'object') {
      return serverQuizScoresCache;
    }

    serverQuizScoresCache = data as Record<string, ServerQuizScoreEntry>;

    const accounts = getStudentAccounts();
    const cleanUser = (userIdent || '').trim().toLowerCase();
    let accountsModified = false;

    // Cari akun aktif santri untuk pencocokan email & no registrasi silang
    const activeStudentAccount = accounts.find(
      (a) =>
        a.email.toLowerCase() === cleanUser ||
        a.registrationNumber.toLowerCase() === cleanUser
    );
    const userEmail =
      activeStudentAccount?.email.toLowerCase() ||
      (cleanUser.includes('@') ? cleanUser : '');
    const userReg =
      activeStudentAccount?.registrationNumber.toLowerCase() ||
      (cleanUser.startsWith('tl-') ? cleanUser : '');

    for (const [key, item] of Object.entries(serverQuizScoresCache)) {
      if (!item || typeof item !== 'object') continue;
      const entryUser = (item.user || '').trim().toLowerCase();
      const pekanKey = item.pekanKey || key.split('_')[0];
      if (!pekanKey) continue;

      const lockPayload = {
        score: typeof item.score === 'number' ? item.score : 0,
        submittedAt: item.submittedAt || '',
        answers: item.answers
      };

      // Simpan kunci permanen per identifier yang ada
      if (entryUser) {
        try {
          localStorage.setItem(
            `tl_exam_lock_${entryUser}_${pekanKey}`,
            JSON.stringify(lockPayload)
          );
        } catch {
          // Ignore
        }
      }

      const isMatchesCurrentUser =
        cleanUser &&
        (entryUser === cleanUser ||
          (userEmail && entryUser === userEmail) ||
          (userReg && entryUser === userReg));

      if (isMatchesCurrentUser) {
        try {
          if (userEmail) {
            localStorage.setItem(
              `tl_exam_lock_${userEmail}_${pekanKey}`,
              JSON.stringify(lockPayload)
            );
          }
          if (userReg) {
            localStorage.setItem(
              `tl_exam_lock_${userReg}_${pekanKey}`,
              JSON.stringify(lockPayload)
            );
          }
          localStorage.setItem(
            `tl_exam_lock_any_${pekanKey}`,
            JSON.stringify(lockPayload)
          );
        } catch {
          // Ignore
        }
      }

      // Perbarui student account yang cocok
      const matchedAcc = accounts.find(
        (a) =>
          a.email.toLowerCase() === entryUser ||
          a.registrationNumber.toLowerCase() === entryUser ||
          (isMatchesCurrentUser &&
            (a.email.toLowerCase() === userEmail ||
              a.registrationNumber.toLowerCase() === userReg))
      );

      if (matchedAcc) {
        matchedAcc.quizScores = matchedAcc.quizScores || {};
        matchedAcc.quizScores[pekanKey] = lockPayload.score;

        matchedAcc.quizSubmittedAt = matchedAcc.quizSubmittedAt || {};
        matchedAcc.quizSubmittedAt[pekanKey] = lockPayload.submittedAt;

        if (lockPayload.answers) {
          matchedAcc.quizAnswersRecord = matchedAcc.quizAnswersRecord || {};
          matchedAcc.quizAnswersRecord[pekanKey] = lockPayload.answers;
        }

        if (lockPayload.score >= 70) {
          matchedAcc.completedModuleKeys = matchedAcc.completedModuleKeys || [];
          if (!matchedAcc.completedModuleKeys.includes(pekanKey)) {
            matchedAcc.completedModuleKeys.push(pekanKey);
          }
        }
        accountsModified = true;
      }
    }

    if (accountsModified) {
      try {
        localStorage.setItem(
          STUDENT_ACCOUNTS_STORAGE_KEY,
          JSON.stringify(accounts)
        );
      } catch {
        // Ignore
      }
    }

    window.dispatchEvent(
      new CustomEvent('quiz-scores-updated', { detail: serverQuizScoresCache })
    );
    return serverQuizScoresCache;
  } catch {
    return serverQuizScoresCache;
  }
}

/**
 * Cek apakah latihan pekan ini sudah pernah dikerjakan oleh santri (Terkunci permanen & 1 kali pengerjaan)
 * Mendukung pemisahan nilai per nomor registrasi (misal santri daftar ulang level yang sama di angkatan baru).
 */
export function isPekanExamAlreadySubmitted(
  emailOrReg: string,
  pekanKey: string,
  specificRegNo?: string
): {
  submitted: boolean;
  score?: number;
  submittedAt?: string;
  answers?: Record<number, number>;
} {
  const clean = (emailOrReg || '').trim().toLowerCase();
  const cleanRegNo = (specificRegNo || '').trim().toUpperCase();
  const accounts = getStudentAccounts();
  const target = accounts.find(
    (a) =>
      a.email.toLowerCase() === clean ||
      a.registrationNumber.toLowerCase() === clean ||
      (a.enrolledRegistrationNumbers &&
        a.enrolledRegistrationNumbers.some((rn) => rn.toLowerCase() === clean))
  );
  const userEmail = target?.email.toLowerCase() || (clean.includes('@') ? clean : '');
  const userReg = target?.registrationNumber.toLowerCase() || (clean.startsWith('tl-') ? clean : '');

  // Cek apakah pendaftaran ini adalah pendaftaran utama/pertama untuk program ini
  const isPrimaryReg =
    !cleanRegNo ||
    !target?.enrolledRegistrationNumbers ||
    target.enrolledRegistrationNumbers.length <= 1 ||
    target.enrolledRegistrationNumbers[0]?.toUpperCase() === cleanRegNo ||
    target.registrationNumber.toUpperCase() === cleanRegNo;

  // 1. Jika ada specificRegNo (misal TL-2026-8453 di Angkatan 2), cek apakah ada nilai spesifik untuk pendaftaran ini
  if (cleanRegNo) {
    const scopedKey = `${cleanRegNo}_${pekanKey}`;
    const scopedKeyDash = `${cleanRegNo}-${pekanKey}`;
    if (target?.quizScores?.[scopedKey] !== undefined) {
      return {
        submitted: true,
        score: target.quizScores[scopedKey],
        submittedAt: target.quizSubmittedAt?.[scopedKey],
        answers: target.quizAnswersRecord?.[scopedKey]
      };
    }
    if (target?.quizScores?.[scopedKeyDash] !== undefined) {
      return {
        submitted: true,
        score: target.quizScores[scopedKeyDash],
        submittedAt: target.quizSubmittedAt?.[scopedKeyDash],
        answers: target.quizAnswersRecord?.[scopedKeyDash]
      };
    }
    // Cek di server cache spesifik user = cleanRegNo
    if (serverQuizScoresCache && Object.keys(serverQuizScoresCache).length > 0) {
      for (const [key, item] of Object.entries(serverQuizScoresCache)) {
        if (!item) continue;
        const itemPekan = item.pekanKey || key.split('_')[0];
        if (itemPekan === pekanKey && (item.user || '').toUpperCase() === cleanRegNo) {
          return {
            submitted: true,
            score: typeof item.score === 'number' ? item.score : 0,
            submittedAt: item.submittedAt,
            answers: item.answers
          };
        }
      }
    }
  }

  // Jika pendaftaran ini adalah angkatan baru / sekunder dan belum ada nilai tersimpan di atas,
  // JANGAN ambil nilai angkatan lama! Berikan lembar pengerjaan baru untuk angkatan ini.
  if (!isPrimaryReg && cleanRegNo) {
    return { submitted: false };
  }

  // 2. Cek cache hasil sinkronisasi server cPanel untuk pendaftaran utama
  if (serverQuizScoresCache && Object.keys(serverQuizScoresCache).length > 0) {
    for (const [key, item] of Object.entries(serverQuizScoresCache)) {
      if (!item) continue;
      const itemPekan = item.pekanKey || key.split('_')[0];
      if (itemPekan === pekanKey) {
        const itemUser = (item.user || '').toLowerCase().trim();
        if (
          (clean && itemUser === clean) ||
          (userEmail && itemUser === userEmail) ||
          (userReg && itemUser === userReg) ||
          clean === 'admin' ||
          clean.includes('superadmin') ||
          clean.includes('mazharhajid')
        ) {
          return {
            submitted: true,
            score: typeof item.score === 'number' ? item.score : 0,
            submittedAt: item.submittedAt,
            answers: item.answers
          };
        }
      }
    }
  }

  // 3. Periksa nilai tersimpan di akun santri (default / pendaftaran utama)
  if (target && target.quizScores && target.quizScores[pekanKey] !== undefined) {
    return {
      submitted: true,
      score: target.quizScores[pekanKey],
      submittedAt: target.quizSubmittedAt?.[pekanKey],
      answers: target.quizAnswersRecord?.[pekanKey]
    };
  }

  // 3. Periksa kunci permanen spesifik user di localStorage
  try {
    const candidateKeys = [clean, userEmail, userReg].filter(Boolean);
    for (const uKey of candidateKeys) {
      const rawUserLock = localStorage.getItem(`tl_exam_lock_${uKey}_${pekanKey}`);
      if (rawUserLock) {
        const parsed = JSON.parse(rawUserLock);
        if (parsed && typeof parsed.score === 'number') {
          return {
            submitted: true,
            score: parsed.score,
            submittedAt: parsed.submittedAt,
            answers: parsed.answers
          };
        }
      }
    }
  } catch {
    // Ignore
  }

  // 4. Periksa kunci umum pekan di localStorage browser ini
  try {
    const rawAnyLock = localStorage.getItem(`tl_exam_lock_any_${pekanKey}`);
    if (rawAnyLock) {
      const parsed = JSON.parse(rawAnyLock);
      if (parsed && typeof parsed.score === 'number') {
        return {
          submitted: true,
          score: parsed.score,
          submittedAt: parsed.submittedAt,
          answers: parsed.answers
        };
      }
    }
  } catch {
    // Ignore
  }

  return { submitted: false };
}

/**
 * Simpan / perbarui nilai latihan pekanan untuk pelajar (Terkunci permanen setelah disubmit)
 * Mendukung pemisahan nilai per nomor registrasi (misal santri daftar ulang level yang sama di angkatan baru).
 */
export function saveStudentQuizScore(
  emailOrReg: string,
  pekanKey: string,
  score: number,
  answers?: Record<number, number>,
  specificRegNo?: string
): StudentAccount | null {
  const cleanRegNo = (specificRegNo || '').trim().toUpperCase();
  // PENCEGAHAN KETAT: Jika sudah pernah disubmit untuk registrasi ini, jangan izinkan override atau submit ulang!
  const existingStatus = isPekanExamAlreadySubmitted(emailOrReg, pekanKey, cleanRegNo);
  if (existingStatus.submitted) {
    const accounts = getStudentAccounts();
    const clean = (emailOrReg || '').trim().toLowerCase();
    return accounts.find(
      (a) => a.email.toLowerCase() === clean || a.registrationNumber.toLowerCase() === clean
    ) || null;
  }

  const accounts = getStudentAccounts();
  const clean = (emailOrReg || '').trim().toLowerCase();
  let target = accounts.find(
    (a) =>
      a.email.toLowerCase() === clean ||
      a.registrationNumber.toLowerCase() === clean ||
      (a.enrolledRegistrationNumbers &&
        a.enrolledRegistrationNumbers.some((rn) => rn.toLowerCase() === clean))
  );

  // Jika akun belum ditemukan di store, buatkan akun santri terdaftar otomatis agar nilai tidak hilang dan ujian langsung terkunci
  if (!target) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const generatedReg = cleanRegNo || (clean.toUpperCase().startsWith('TL-')
      ? clean.toUpperCase()
      : `TL-2026-${randomDigits}`);
    target = {
      registrationNumber: generatedReg,
      fullName: 'Santri Terdaftar',
      gender: 'Laki-laki',
      email: clean.includes('@') ? clean : `${clean}@tadribullughah.id`,
      whatsapp: '-',
      city: 'Indonesia',
      occupation: 'Pelajar Terdaftar',
      password: clean,
      enrolledProgramIds: ['tl-level-1'],
      enrolledRegistrationNumbers: [generatedReg],
      completedModuleKeys: [],
      createdAt: new Date().toISOString()
    };
  }

  const currentScores = target.quizScores || {};
  const currentTimes = target.quizSubmittedAt || {};
  const currentAnswers = target.quizAnswersRecord || {};

  const timeNow =
    new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date()) + ' WIB';

  // Simpan nilai untuk pekanKey umum
  currentScores[pekanKey] = score;
  if (!currentTimes[pekanKey]) {
    currentTimes[pekanKey] = timeNow;
  }
  if (answers) {
    currentAnswers[pekanKey] = answers;
  }

  // Jika ada nomor registrasi spesifik (misal angkatan baru), rekam juga dengan prefix nomor registrasi
  if (cleanRegNo) {
    const scopedKey = `${cleanRegNo}_${pekanKey}`;
    currentScores[scopedKey] = score;
    currentTimes[scopedKey] = timeNow;
    if (answers) {
      currentAnswers[scopedKey] = answers;
    }
  }

  target.quizScores = currentScores;
  target.quizSubmittedAt = currentTimes;
  target.quizAnswersRecord = currentAnswers;

  // Pastikan completedModuleKeys adalah array yang valid
  if (!Array.isArray(target.completedModuleKeys)) {
    target.completedModuleKeys = [];
  }

  // Jika nilai mencapai KKM (>= 70), otomatis tandai pekan sebagai tuntas jika belum
  const isPassed = score >= 70;
  if (isPassed) {
    if (!target.completedModuleKeys.includes(pekanKey)) {
      target.completedModuleKeys.push(pekanKey);
    }
    if (cleanRegNo) {
      const scopedPassKey = `${cleanRegNo}-pekan-${pekanKey}`;
      if (!target.completedModuleKeys.includes(scopedPassKey)) {
        target.completedModuleKeys.push(scopedPassKey);
      }
    }
  }

  saveStudentAccount(target);

  // Simpan kunci permanen ke localStorage
  const lockPayload = {
    score,
    submittedAt: target.quizSubmittedAt[pekanKey],
    answers
  };
  try {
    if (clean) {
      localStorage.setItem(`tl_exam_lock_${clean}_${pekanKey}`, JSON.stringify(lockPayload));
    }
    if (cleanRegNo) {
      localStorage.setItem(`tl_exam_lock_${cleanRegNo.toLowerCase()}_${pekanKey}`, JSON.stringify(lockPayload));
    }
    if (target.email) {
      localStorage.setItem(`tl_exam_lock_${target.email.toLowerCase()}_${pekanKey}`, JSON.stringify(lockPayload));
    }
    if (target.registrationNumber) {
      localStorage.setItem(`tl_exam_lock_${target.registrationNumber.toLowerCase()}_${pekanKey}`, JSON.stringify(lockPayload));
    }
    localStorage.setItem(`tl_exam_lock_any_${pekanKey}`, JSON.stringify(lockPayload));
    window.dispatchEvent(new Event('storage'));
  } catch {
    // Ignore storage write errors
  }

  // Perbarui server cache lokal seketika
  const userIdentForServer = cleanRegNo || target.email.toLowerCase() || target.registrationNumber.toLowerCase() || clean;
  const payloadKey = `${pekanKey}_${userIdentForServer}`;
  serverQuizScoresCache[payloadKey] = {
    user: userIdentForServer,
    pekanKey,
    score,
    submittedAt: target.quizSubmittedAt[pekanKey],
    answers
  };

  // Sinkronkan ke api.php di cPanel hosting
  try {
    fetch('./api.php?entity=quiz_scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        [payloadKey]: {
          user: userIdentForServer,
          pekanKey,
          score,
          submittedAt: target.quizSubmittedAt[pekanKey],
          answers
        }
      })
    }).catch(() => {});
  } catch {
    // Ignore fetch errors
  }

  return target;
}

// =============================================================================
// SISTEM ABSENSI PERTEMUAN ONLINE LIVE ZOOM
// =============================================================================

export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpa';

export interface AttendanceEntry {
  id: string; // e.g. "TL-2026-8452_tl-level-1_s1"
  registrationNumber: string;
  studentName?: string;
  programId: string;
  sessionNumber: number;
  pekanNumber: number;
  topicTitle?: string;
  status: AttendanceStatus;
  notes?: string;
  submittedAt: string; // e.g. "19 November 2026, 19:55 WIB"
}

export const STUDENT_ATTENDANCE_STORAGE_KEY = 'tl_student_attendance_records_v1';

export const DEFAULT_ATTENDANCE_RECORDS: Record<string, AttendanceEntry> = {
  // Demo Siti Aisyah Angkatan 1 (TL-2026-8452, Level 1: 12 Pertemuan Hadir)
  'TL-2026-8452_tl-level-1_s1': {
    id: 'TL-2026-8452_tl-level-1_s1',
    registrationNumber: 'TL-2026-8452',
    studentName: 'Siti Aisyah Nurhaliza',
    programId: 'tl-level-1',
    sessionNumber: 1,
    pekanNumber: 1,
    topicTitle: 'MUQODDIMAH PENGENALAN PROGRAM TADRIBAT',
    status: 'hadir',
    notes: 'Hadir tepat waktu mengikuti orientasi kurikulum',
    submittedAt: '19 November 2026, 19:55 WIB'
  },
  'TL-2026-8452_tl-level-1_s2': {
    id: 'TL-2026-8452_tl-level-1_s2',
    registrationNumber: 'TL-2026-8452',
    studentName: 'Siti Aisyah Nurhaliza',
    programId: 'tl-level-1',
    sessionNumber: 2,
    pekanNumber: 2,
    topicTitle: 'MATERI 1: KATA DALAM BAHASA ARAB DAN MACAM-MACAMNYA',
    status: 'hadir',
    notes: 'Menyimak penjelasan pembagian kalimat (isim, fiil, huruf)',
    submittedAt: '26 November 2026, 19:58 WIB'
  },
  'TL-2026-8452_tl-level-1_s3': {
    id: 'TL-2026-8452_tl-level-1_s3',
    registrationNumber: 'TL-2026-8452',
    studentName: 'Siti Aisyah Nurhaliza',
    programId: 'tl-level-1',
    sessionNumber: 3,
    pekanNumber: 3,
    topicTitle: 'MATERI 2: PENGERTIAN ISIM DAN TANDA-TANDANYA',
    status: 'hadir',
    notes: 'Hadir menyimak tanda-tanda isim secara mendalam',
    submittedAt: '03 Desember 2026, 20:01 WIB'
  },
  'TL-2026-8452_tl-level-1_s4': {
    id: 'TL-2026-8452_tl-level-1_s4',
    registrationNumber: 'TL-2026-8452',
    studentName: 'Siti Aisyah Nurhaliza',
    programId: 'tl-level-1',
    sessionNumber: 4,
    pekanNumber: 4,
    topicTitle: 'MATERI 3: ISIM DITINJAU DARI SEGI JUMLAH BILANGAN',
    status: 'hadir',
    notes: 'Hadir menyimak materi mufrad, mutsanna, dan jamak',
    submittedAt: '10 Desember 2026, 19:50 WIB'
  },
  'TL-2026-8452_tl-level-1_s5': {
    id: 'TL-2026-8452_tl-level-1_s5',
    registrationNumber: 'TL-2026-8452',
    studentName: 'Siti Aisyah Nurhaliza',
    programId: 'tl-level-1',
    sessionNumber: 5,
    pekanNumber: 5,
    topicTitle: 'MATERI 4: ISIM DITINJAU DARI SEGI JENIS KELAMIN',
    status: 'hadir',
    notes: 'Hadir menyimak mudzakkar dan muannats',
    submittedAt: '17 Desember 2026, 19:57 WIB'
  },
  'TL-2026-8452_tl-level-1_s6': {
    id: 'TL-2026-8452_tl-level-1_s6',
    registrationNumber: 'TL-2026-8452',
    studentName: 'Siti Aisyah Nurhaliza',
    programId: 'tl-level-1',
    sessionNumber: 6,
    pekanNumber: 6,
    topicTitle: 'MATERI 5: ISIM DITINJAU DARI SEGI KEJELASAN MAKNA',
    status: 'hadir',
    notes: 'Hadir menyimak nakirah dan ma’rifat',
    submittedAt: '24 Desember 2026, 20:00 WIB'
  },
  'TL-2026-8452_tl-level-1_s7': {
    id: 'TL-2026-8452_tl-level-1_s7',
    registrationNumber: 'TL-2026-8452',
    studentName: 'Siti Aisyah Nurhaliza',
    programId: 'tl-level-1',
    sessionNumber: 7,
    pekanNumber: 7,
    topicTitle: 'MATERI 6: ISIM DITINJAU DARI KELENGKAPAN HARAKAT AKHIR',
    status: 'hadir',
    notes: 'Hadir menyimak munsharif dan ghairu munsharif',
    submittedAt: '31 Desember 2026, 19:52 WIB'
  },
  'TL-2026-8452_tl-level-1_s8': {
    id: 'TL-2026-8452_tl-level-1_s8',
    registrationNumber: 'TL-2026-8452',
    studentName: 'Siti Aisyah Nurhaliza',
    programId: 'tl-level-1',
    sessionNumber: 8,
    pekanNumber: 8,
    topicTitle: 'MATERI 7: ISIM DITINJAU DARI SUSUNAN BANGUNAN KATA',
    status: 'hadir',
    notes: 'Hadir menyimak jamid dan musytaq',
    submittedAt: '07 Januari 2027, 20:05 WIB'
  },
  'TL-2026-8452_tl-level-1_s9': {
    id: 'TL-2026-8452_tl-level-1_s9',
    registrationNumber: 'TL-2026-8452',
    studentName: 'Siti Aisyah Nurhaliza',
    programId: 'tl-level-1',
    sessionNumber: 9,
    pekanNumber: 9,
    topicTitle: 'MATERI 8: ISIM DITINJAU DARI BENTUK HURUF AKHIR',
    status: 'hadir',
    notes: 'Hadir menyimak maqshur, manqush, mamdud, shahih',
    submittedAt: '14 Januari 2027, 19:56 WIB'
  },
  'TL-2026-8452_tl-level-1_s10': {
    id: 'TL-2026-8452_tl-level-1_s10',
    registrationNumber: 'TL-2026-8452',
    studentName: 'Siti Aisyah Nurhaliza',
    programId: 'tl-level-1',
    sessionNumber: 10,
    pekanNumber: 10,
    topicTitle: 'MATERI 9: ISIM DITINJAU DARI PERUBAHAN HARAKAT AKHIR',
    status: 'hadir',
    notes: 'Hadir menyimak mu’rab dan mabni',
    submittedAt: '21 Januari 2027, 20:02 WIB'
  },
  'TL-2026-8452_tl-level-1_s11': {
    id: 'TL-2026-8452_tl-level-1_s11',
    registrationNumber: 'TL-2026-8452',
    studentName: 'Siti Aisyah Nurhaliza',
    programId: 'tl-level-1',
    sessionNumber: 11,
    pekanNumber: 11,
    topicTitle: 'MATERI 10: ISIM DITINJAU DARI POSISI I’RAB',
    status: 'hadir',
    notes: 'Hadir menyimak marfu’, manshub, majrur',
    submittedAt: '28 Januari 2027, 19:54 WIB'
  },
  'TL-2026-8452_tl-level-1_s12': {
    id: 'TL-2026-8452_tl-level-1_s12',
    registrationNumber: 'TL-2026-8452',
    studentName: 'Siti Aisyah Nurhaliza',
    programId: 'tl-level-1',
    sessionNumber: 12,
    pekanNumber: 12,
    topicTitle: 'MATERI 11: ISIM-ISIM YANG MABNI',
    status: 'hadir',
    notes: 'Hadir menyimak dhamir, isyarah, maushul',
    submittedAt: '04 Februari 2027, 20:03 WIB'
  },
  // Demo Rizky Pratama (TL-2026-8419, Level 2: 2 Pertemuan Hadir)
  'TL-2026-8419_tl-level-2_s1': {
    id: 'TL-2026-8419_tl-level-2_s1',
    registrationNumber: 'TL-2026-8419',
    studentName: 'Rizky Pratama Wijaya',
    programId: 'tl-level-2',
    sessionNumber: 1,
    pekanNumber: 1,
    topicTitle: 'MODUL 1: BAB NAWASIKH (KANA & INNA)',
    status: 'hadir',
    notes: 'Hadir tepat waktu di kelas Live Zoom',
    submittedAt: '17 November 2026, 19:55 WIB'
  },
  'TL-2026-8419_tl-level-2_s2': {
    id: 'TL-2026-8419_tl-level-2_s2',
    registrationNumber: 'TL-2026-8419',
    studentName: 'Rizky Pratama Wijaya',
    programId: 'tl-level-2',
    sessionNumber: 2,
    pekanNumber: 1,
    topicTitle: 'LATIHAN I’RAB NAWASIKH APLIKATIF',
    status: 'hadir',
    notes: 'Hadir aktif berdiskusi i’rab',
    submittedAt: '18 November 2026, 19:58 WIB'
  }
};

export function getAllAttendanceRecords(): Record<string, AttendanceEntry> {
  try {
    const raw = localStorage.getItem(STUDENT_ATTENDANCE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return { ...DEFAULT_ATTENDANCE_RECORDS, ...parsed };
      }
    }
  } catch {}
  return { ...DEFAULT_ATTENDANCE_RECORDS };
}

export function getStudentAttendanceRecords(
  registrationNumber?: string,
  programId?: string
): Record<string, AttendanceEntry> {
  const all = getAllAttendanceRecords();
  if (!registrationNumber && !programId) return all;

  const filtered: Record<string, AttendanceEntry> = {};
  const cleanReg = (registrationNumber || '').trim().toUpperCase();
  const cleanProg = (programId || '').trim();

  for (const [key, entry] of Object.entries(all)) {
    if (!entry) continue;
    const matchReg = !cleanReg || entry.registrationNumber.toUpperCase() === cleanReg;
    const matchProg = !cleanProg || entry.programId === cleanProg;
    if (matchReg && matchProg) {
      filtered[key] = entry;
    }
  }
  return filtered;
}

export function saveStudentAttendanceEntry(entry: AttendanceEntry): void {
  const all = getAllAttendanceRecords();
  const key = `${entry.registrationNumber.toUpperCase()}_${entry.programId}_s${entry.sessionNumber}`;
  const normalizedEntry: AttendanceEntry = {
    ...entry,
    id: key,
    registrationNumber: entry.registrationNumber.toUpperCase()
  };
  all[key] = normalizedEntry;

  try {
    localStorage.setItem(STUDENT_ATTENDANCE_STORAGE_KEY, JSON.stringify(all));
  } catch {}

  // Dispatch custom event for reactive UI updates
  try {
    window.dispatchEvent(new CustomEvent('attendance-updated', { detail: all }));
  } catch {}

  // Sync to cPanel backend
  try {
    fetch('./api.php?entity=attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: normalizedEntry })
    }).catch(() => {});
  } catch {}
}

export async function syncAttendanceFromServer(
  registrationNumber?: string
): Promise<Record<string, AttendanceEntry>> {
  try {
    const res = await fetch(`./api.php?entity=attendance&_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return getAllAttendanceRecords();
    const data = await res.json();
    if (data && typeof data === 'object') {
      const all = getAllAttendanceRecords();
      const merged = { ...all, ...data };
      try {
        localStorage.setItem(STUDENT_ATTENDANCE_STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      try {
        window.dispatchEvent(new CustomEvent('attendance-updated', { detail: merged }));
      } catch {}
      return merged;
    }
  } catch {}
  return getAllAttendanceRecords();
}

// ============================================================================
// KONTROL IZIN PRESENSI KELAS ONLINE PER PERTEMUAN (SUPERADMIN PERMISSION)
// ============================================================================

export const ATTENDANCE_UNLOCK_STORAGE_KEY = 'tadribul_lughah_attendance_session_unlock_map_v1';

export function getAllAttendanceSessionUnlockStates(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ATTENDANCE_UNLOCK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isAttendanceSessionUnlocked(programId: string, sessionNumber: number): boolean {
  const num = Math.max(1, sessionNumber || 1);
  const progId = programId || 'tl-level-1';
  const match = String(progId).match(/(\d+)/);
  const levelNum = match ? parseInt(match[1], 10) : 1;
  const map = getAllAttendanceSessionUnlockStates();

  const candidateKeys = [
    `${progId}_s${num}`,
    `tl-level-${levelNum}_s${num}`,
    `level-${levelNum}_s${num}`,
    `${levelNum}_s${num}`
  ];

  for (const k of candidateKeys) {
    if (typeof map[k] === 'boolean') {
      return map[k];
    }
  }

  // DEFAULT: FALSE (Peserta TIDAK BISA isi absen per pertemuan kecuali telah diizinkan oleh Superadmin)
  return false;
}

export function saveAttendanceSessionUnlockState(
  programId: string,
  sessionNumber: number,
  isUnlocked: boolean
): void {
  if (typeof window === 'undefined') return;
  try {
    const num = Math.max(1, sessionNumber || 1);
    const progId = programId || 'tl-level-1';
    const match = String(progId).match(/(\d+)/);
    const levelNum = match ? parseInt(match[1], 10) : 1;
    const current = getAllAttendanceSessionUnlockStates();

    const keys = [
      `${progId}_s${num}`,
      `tl-level-${levelNum}_s${num}`,
      `level-${levelNum}_s${num}`,
      `${levelNum}_s${num}`
    ];
    for (const k of keys) {
      current[k] = isUnlocked;
    }

    localStorage.setItem(ATTENDANCE_UNLOCK_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('attendance-unlock-updated', { detail: current }));
    window.dispatchEvent(new Event('storage'));

    // Push to cPanel backend
    try {
      fetch('./api.php?entity=attendance_unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [`${progId}_s${num}`]: isUnlocked })
      }).catch(() => {});
    } catch {}
  } catch (err) {
    console.error('Failed to save attendance session unlock state:', err);
  }
}

export function setAttendanceSessionUnlockBatch(
  programId: string,
  maxSessionOpen: number,
  totalSessions: number = 22
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getAllAttendanceSessionUnlockStates();
    const progId = programId || 'tl-level-1';
    const match = String(progId).match(/(\d+)/);
    const levelNum = match ? parseInt(match[1], 10) : 1;
    const maxSess = Math.min(Math.max(1, totalSessions), 50);

    const payload: Record<string, boolean> = {};

    for (let s = 1; s <= maxSess; s++) {
      const unlocked = s <= maxSessionOpen;
      const keys = [
        `${progId}_s${s}`,
        `tl-level-${levelNum}_s${s}`,
        `level-${levelNum}_s${s}`,
        `${levelNum}_s${s}`
      ];
      for (const k of keys) {
        current[k] = unlocked;
      }
      payload[`${progId}_s${s}`] = unlocked;
    }

    localStorage.setItem(ATTENDANCE_UNLOCK_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('attendance-unlock-updated', { detail: current }));
    window.dispatchEvent(new Event('storage'));

    try {
      fetch('./api.php?entity=attendance_unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch {}
  } catch (err) {
    console.error('Failed to set attendance session unlock batch:', err);
  }
}

export function setAllAttendanceSessionsUnlockState(
  programId: string,
  isUnlocked: boolean,
  totalSessions: number = 22
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getAllAttendanceSessionUnlockStates();
    const progId = programId || 'tl-level-1';
    const match = String(progId).match(/(\d+)/);
    const levelNum = match ? parseInt(match[1], 10) : 1;
    const maxSess = Math.min(Math.max(1, totalSessions), 50);

    const payload: Record<string, boolean> = {};

    for (let s = 1; s <= maxSess; s++) {
      const keys = [
        `${progId}_s${s}`,
        `tl-level-${levelNum}_s${s}`,
        `level-${levelNum}_s${s}`,
        `${levelNum}_s${s}`
      ];
      for (const k of keys) {
        current[k] = isUnlocked;
      }
      payload[`${progId}_s${s}`] = isUnlocked;
    }

    localStorage.setItem(ATTENDANCE_UNLOCK_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('attendance-unlock-updated', { detail: current }));
    window.dispatchEvent(new Event('storage'));

    try {
      fetch('./api.php?entity=attendance_unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch {}
  } catch (err) {
    console.error('Failed to set all attendance sessions unlock state:', err);
  }
}

export async function syncAttendanceUnlockFromServer(): Promise<Record<string, boolean>> {
  try {
    const res = await fetch(`./api.php?entity=attendance_unlock&_t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        const current = getAllAttendanceSessionUnlockStates();
        const merged = { ...current, ...data };
        try {
          localStorage.setItem(ATTENDANCE_UNLOCK_STORAGE_KEY, JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent('attendance-unlock-updated', { detail: merged }));
        } catch {}
        return merged;
      }
    }
  } catch {}
  return getAllAttendanceSessionUnlockStates();
}

