import React, { useState, useEffect } from 'react';
import {
  PROGRAM_TRACKS,
  CLASS_SCHEDULES,
  ProgramTrack,
  ClassSchedule,
  RegistrationRecord,
  formatIDR,
  applyRegistrationOpenOverrides
} from './data/arabicAcademyData';
import {
  StudentAccount,
  getActiveStudentSession,
  clearActiveStudentSession,
  getStudentAccounts,
  saveStudentAccount,
  loadMergedRegistrations,
  getStudentRegistrations,
  enrollStudentInProgram
} from './utils/studentAccountStore';
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
  CheckCircle2,
  Clock,
  Download,
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
  FileText,
  Eye
} from 'lucide-react';

type PortalTab = 'dashboard' | 'modul' | 'akun';

export default function StudentPortalApp() {
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [programs, setPrograms] = useState<ProgramTrack[]>(() =>
    applyRegistrationOpenOverrides(PROGRAM_TRACKS)
  );
  const [schedules, setSchedules] = useState<ClassSchedule[]>(CLASS_SCHEDULES);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(() =>
    loadMergedRegistrations()
  );

  const [studentAccount, setStudentAccount] = useState<StudentAccount | null>(
    null
  );
  const [studentRegistration, setStudentRegistration] =
    useState<RegistrationRecord | null>(null);

  // Password Update Form State
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordBanner, setPasswordBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Level Switch / Upgrade State
  const [upgradeBanner, setUpgradeBanner] = useState<string | null>(null);
  const [activeEnrolledProgramId, setActiveEnrolledProgramId] = useState<string>('');
  const [openedModuleIndex, setOpenedModuleIndex] = useState<number | null>(null);

  const enrolledRegistrations = studentAccount
    ? getStudentRegistrations(studentAccount.email, registrations)
    : studentRegistration
      ? [studentRegistration]
      : [];

  // Set initial activeEnrolledProgramId
  useEffect(() => {
    if (!activeEnrolledProgramId && enrolledRegistrations.length > 0) {
      setActiveEnrolledProgramId(enrolledRegistrations[0].selectedProgramId);
    }
  }, [enrolledRegistrations, activeEnrolledProgramId]);

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
          setSchedules(loaded);
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
    const verifyAccess = () => {
      const allRegs = loadMergedRegistrations(registrations);
      const allAccounts = getStudentAccounts();
      const session = getActiveStudentSession();

      if (session) {
        const foundAcc = allAccounts.find(
          (a) =>
            a.registrationNumber.toUpperCase() ===
              session.registrationNumber.toUpperCase() ||
            a.email.toLowerCase() === session.email.toLowerCase()
        );
        const foundReg = allRegs.find(
          (r) =>
            r.registrationNumber.toUpperCase() ===
            session.registrationNumber.toUpperCase()
        );

        if (foundAcc && foundReg) {
          setStudentAccount(foundAcc);
          setStudentRegistration({
            ...foundReg,
            email: foundAcc.email || foundReg.email,
            whatsapp: foundAcc.whatsapp || foundReg.whatsapp
          });
          setAuthChecking(false);
          return true;
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

        if (foundAcc && foundReg) {
          setStudentAccount(foundAcc);
          setStudentRegistration({
            ...foundReg,
            email: foundAcc.email
          });
          setAuthChecking(false);
          return;
        }
      }
      setAuthChecking(false);
    });

    return () => unsubAuth();
  }, [registrations]);

  // Automatic redirect to login.html?role=pelajar if not authenticated with a valid registered student account
  useEffect(() => {
    if (!authChecking && (!studentAccount || !studentRegistration)) {
      const timer = setTimeout(() => {
        window.location.replace('./login.html?role=pelajar');
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [authChecking, studentAccount, studentRegistration]);

  const handleLogoutStudent = async () => {
    clearActiveStudentSession();
    try {
      await signOut(auth);
    } catch {
      // Ignore
    }
    window.location.replace('./login.html?role=pelajar');
  };

  // Strict Access Lock Screen if user is not logged in with a Registered Student Account
  if (!studentAccount || !studentRegistration) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-slate-900 px-6">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-8 text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-700">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-wider text-rose-700 font-semibold">
              AKSES TERKUNCI · WAJIB AKUN PELAJAR TERDAFTAR
            </p>
            <h1 className="text-xl font-bold text-slate-900 font-display">
              Halaman pelajar.html Khusus Pelajar yang Sudah Terdaftar & Memiliki Akun
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
              Belum Terdaftar? Daftar Program Dulu (index.html)
            </a>
          </div>
        </div>
      </div>
    );
  }

  const currentRegistration =
    enrolledRegistrations.find((r) => r.selectedProgramId === activeEnrolledProgramId) ||
    studentRegistration;

  const enrolledProgram =
    programs.find((p) => p.id === currentRegistration.selectedProgramId) ||
    programs.find((p) => p.id === studentRegistration.selectedProgramId) ||
    programs[0] ||
    PROGRAM_TRACKS[0];

  const enrolledSchedule =
    schedules.find((s) => s.id === currentRegistration.selectedScheduleId) ||
    schedules.find((s) => s.programId === enrolledProgram.id) ||
    schedules[0] ||
    CLASS_SCHEDULES[0];

  const completedModulesForProgram = enrolledProgram.modules.filter((_, idx) =>
    studentAccount.completedModuleKeys.includes(`${enrolledProgram.id}-${idx}`)
  ).length;
  const totalModulesForProgram = enrolledProgram.modules.length || 4;
  const progressPercentage = Math.round(
    (completedModulesForProgram / totalModulesForProgram) * 100
  );

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
    const key = `${enrolledProgram.id}-${moduleIndex}`;
    const exists = studentAccount.completedModuleKeys.includes(key);
    const updatedKeys = exists
      ? studentAccount.completedModuleKeys.filter((k) => k !== key)
      : [...studentAccount.completedModuleKeys, key];

    const updatedAccount: StudentAccount = {
      ...studentAccount,
      completedModuleKeys: updatedKeys
    };
    setStudentAccount(updatedAccount);
    saveStudentAccount(updatedAccount);
  };

  const handleEnrollAdditionalProgram = async (newProgram: ProgramTrack) => {
    if (!studentAccount) return;
    const matchingSchedule =
      schedules.find((s) => s.programId === newProgram.id) || schedules[0];
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
      selectedProgramName: newProgram.title,
      selectedScheduleId: matchingSchedule.id,
      selectedScheduleSummary: `${matchingSchedule.batchCode} · ${matchingSchedule.days} (${matchingSchedule.timeWIB}) · Online`,
      learningGoal: `Mempelajari ${newProgram.title} dengan akun terdaftar.`,
      totalTuitionIDR: newProgram.tuitionIDR,
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
    } catch {
      // Ignored
    }

    setActiveEnrolledProgramId(newProgram.id);
    setStudentRegistration(newReg);
    setUpgradeBanner(
      `Pendaftaran ${newProgram.title} berhasil ditambahkan ke akun Anda! Nomor Registrasi: ${newRegNo}.`
    );
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
      `Status Kepesertaan : ${studentRegistration.status}`,
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
      {/* Top Bar Contract: 3 Distinct Zones Separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
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

          {/* Zone 2: Primary Portal Navigation */}
          <nav
            aria-label="Navigasi Portal Pelajar"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'text-emerald-900 font-semibold border-b-2 border-emerald-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kelas Malam & Zoom
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('modul')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'modul'
                  ? 'text-emerald-900 font-semibold border-b-2 border-emerald-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Progres Modul ({completedModulesForProgram}/{totalModulesForProgram})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('akun')}
              className={`py-1 transition-colors whitespace-nowrap ${
                activeTab === 'akun'
                  ? 'text-emerald-900 font-semibold border-b-2 border-emerald-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kartu & Akun Pelajar
            </button>
          </nav>

          {/* Zone 3: Student Account Identity + Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-slate-900">
                {studentRegistration.fullName}
              </span>
              <span className="text-[11px] font-mono text-emerald-800">
                {studentRegistration.registrationNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogoutStudent}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Header Bar: Mobile Tabs & Active Student Account Status */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto py-1">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-900 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Kelas Malam
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('modul')}
              className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
                activeTab === 'modul'
                  ? 'bg-emerald-900 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Modul ({completedModulesForProgram}/{totalModulesForProgram})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('akun')}
              className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
                activeTab === 'akun'
                  ? 'bg-emerald-900 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              Kartu & Akun
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
            <UserCheck className="w-4 h-4 text-emerald-800 shrink-0" />
            <span>
              Login Akun Pelajar Terdaftar:{' '}
              <strong className="text-slate-900">
                {studentRegistration.fullName}
              </strong>{' '}
              (<span className="font-mono text-emerald-900">{studentAccount.email}</span>)
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto text-xs">
            <a
              href="./index.html"
              className="font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              ← Ke Halaman Publik (index.html)
            </a>
          </div>
        </div>
      </div>

      {/* Main Student Portal Content */}
      <main className="flex-1 py-10 sm:py-12">
        <div className="max-w-[1200px] mx-auto px-6 space-y-8">
          {/* Multi-Program Level Selector (1 Akun untuk 4 Program) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono mr-1">
                Level Terdaftar Anda ({enrolledRegistrations.length}/4 Level):
              </span>
              {enrolledRegistrations.map((reg) => {
                const prog = programs.find((p) => p.id === reg.selectedProgramId) || programs[0];
                const isActive = reg.selectedProgramId === activeEnrolledProgramId;
                return (
                  <button
                    key={reg.registrationNumber}
                    type="button"
                    onClick={() => {
                      setActiveEnrolledProgramId(reg.selectedProgramId);
                      setStudentRegistration(reg);
                    }}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    <span>{prog.code} ({prog.category === 'shorof' ? 'Shorof' : 'Nahwu'})</span>
                    <span className="font-mono text-[11px] opacity-80">
                      {reg.registrationNumber}
                    </span>
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
                  <span>{currentRegistration.status.toUpperCase()}</span>
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
                      <p className="text-xs text-slate-500">
                        Hari & Jam Kelas Malam
                      </p>
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
                        {enrolledProgram.durationWeeks} Pekan ({enrolledProgram.sessionsCount} Pertemuan)
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-[#FBF9F5] border border-slate-200 space-y-1">
                      <p className="text-xs text-slate-500">
                        Biaya Pendidikan Level {enrolledProgram.levelNumber}
                      </p>
                      <p className="text-sm font-bold text-emerald-900 font-mono tabular-nums">
                        {formatIDR(enrolledProgram.tuitionIDR)} / Level
                      </p>
                      <p className="text-xs font-mono text-slate-700">
                        Cicilan 6x: {formatIDR(Math.round(enrolledProgram.tuitionIDR / 6))} / bulan
                      </p>
                    </div>
                  </div>

                  {/* Interactive Zoom Classroom Access Box */}
                  <div className="p-5 rounded-xl bg-emerald-950 text-white space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                          <Video className="w-4 h-4 shrink-0" />
                          <span>RUANG KELAS LIVE ZOOM · KHUSUS AKUN PELAJAR</span>
                        </div>
                        <h3 className="text-base font-semibold text-white">
                          Tautan Kelas Malam {enrolledProgram.categoryLabel}
                        </h3>
                        <p className="text-xs text-emerald-100/90 leading-relaxed">
                          Ruang Zoom dibuka 15 menit sebelum kelas dimulai (pukul{' '}
                          <span className="font-mono font-semibold text-white">
                            19.45 WIB
                          </span>
                          ) setiap hari{' '}
                          <span className="font-semibold text-white">
                            {enrolledSchedule.days}
                          </span>
                          . Gunakan Nomor Registrasi{' '}
                          <span className="font-mono text-emerald-300">
                            {studentRegistration.registrationNumber}
                          </span>{' '}
                          sebagai format nama peserta Zoom.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('modul')}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0"
                      >
                        Buka Materi & Modul →
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
              TAB 2: PROGRES MODUL & KURIKULUM LEVEL PELAJAR
             ===================================================================== */}
          {activeTab === 'modul' && (
            <div className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-semibold">
                      SILABUS & CEKLIS CAPAIAN BELAJAR MANDIRI
                    </p>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      Modul {enrolledProgram.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      Klik tombol pada setiap pekan untuk menandai materi yang sudah Anda kuasai di kelas malam ({enrolledSchedule.days}, {enrolledSchedule.timeWIB}).
                    </p>
                  </div>
                  <div className="text-xs font-mono font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg shrink-0">
                    Selesai: {completedModulesForProgram} / {totalModulesForProgram} Modul ({progressPercentage}%)
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {enrolledProgram.modules.map((mod, idx) => {
                    const isDone = studentAccount.completedModuleKeys.includes(
                      `${enrolledProgram.id}-${idx}`
                    );
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
                          className="space-y-2.5 cursor-pointer"
                          onClick={() => {
                            window.location.href = `./materi.html?program=${encodeURIComponent(enrolledProgram.id)}&pekan=${idx * 3 + 1}`;
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-semibold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded">
                              {mod.weekRange}
                            </span>
                            <span
                              className="font-arabic text-base font-semibold text-slate-800"
                              dir="rtl"
                            >
                              {mod.arabicTerm}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug hover:text-emerald-900 transition-colors flex items-center justify-between gap-2">
                            <span>{mod.topic}</span>
                            <span className="text-xs font-mono text-emerald-800 font-semibold flex items-center gap-1">
                              <span>Buka Halaman (materi.html)</span>
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                            </span>
                          </h3>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Target: {mod.outcome}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = `./materi.html?program=${encodeURIComponent(enrolledProgram.id)}&pekan=${idx * 3 + 1}`;
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-900 text-white hover:bg-emerald-800 transition-colors shadow-xs"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>
                              {idx === 0
                                ? 'Buka Materi Muqaddimah (Pekan 1) →'
                                : `Buka Materi Pekan ${idx * 3 + 1} →`}
                            </span>
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
                  const details = getModuleStudyContent(enrolledProgram.id, openedModuleIndex);
                  const isDone = studentAccount.completedModuleKeys.includes(
                    `${enrolledProgram.id}-${openedModuleIndex}`
                  );

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

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {programs.map((prog) => {
                    const isCurrent = prog.id === activeEnrolledProgramId;
                    const existingReg = enrolledRegistrations.find(
                      (r) => r.selectedProgramId === prog.id
                    );
                    const isAlreadyEnrolled = Boolean(existingReg);

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
                          <p className="text-[11px] font-mono text-slate-600">
                            {prog.scheduleDays} · {prog.scheduleTime}
                          </p>
                          <p className="text-xs font-mono font-bold text-emerald-900">
                            {formatIDR(prog.tuitionIDR)} / Level
                          </p>
                          <p className="text-[11px] font-mono text-slate-600">
                            Cicilan 6x: {formatIDR(Math.round(prog.tuitionIDR / 6))}/bln
                          </p>
                        </div>

                        {isCurrent ? (
                          <button
                            type="button"
                            disabled
                            className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-900 text-white cursor-default"
                          >
                            Sedang Dibuka
                          </button>
                        ) : isAlreadyEnrolled && existingReg ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveEnrolledProgramId(prog.id);
                              setStudentRegistration(existingReg);
                            }}
                            className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-900 hover:bg-emerald-200 transition-colors border border-emerald-300"
                          >
                            Buka Kelas Ini →
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={prog.registrationOpen === false}
                            onClick={() => handleEnrollAdditionalProgram(prog)}
                            className={`w-full px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                              prog.registrationOpen === false
                                ? 'bg-rose-100 text-rose-900 border border-rose-300 cursor-not-allowed'
                                : 'bg-slate-900 text-white hover:bg-emerald-900'
                            }`}
                          >
                            {prog.registrationOpen === false
                              ? 'Pendaftaran Ditutup (OFF)'
                              : `+ Daftar Level ${prog.levelNumber}`}
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
                        {studentAccount.email} · {studentAccount.whatsapp}
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
                      <p className="text-slate-400">Status Verifikasi</p>
                      <p className="text-emerald-300 font-semibold mt-0.5">
                        {studentRegistration.status}
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

      {/* Institutional Footer */}
      <footer className="bg-slate-950 text-slate-400 py-8 border-t border-slate-800 text-xs">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
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
              onClick={handleLogoutStudent}
              className="text-rose-400 hover:text-rose-300 font-medium"
            >
              Keluar Akun Pelajar
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
