export interface ProgramTrack {
  id: string;
  code: string;
  indexNumber: string;
  levelNumber: number;
  title: string;
  arabicTitle: string;
  category: 'nahwu' | 'shorof';
  categoryLabel: string;
  scheduleDays: string;
  scheduleTime: string;
  levelRecommendation: string;
  durationWeeks: number;
  sessionsCount: number;
  sessionMinutes: number;
  tuitionIDR: number;
  summary: string;
  targetOutcome: string;
  kitabReference: string;
  image?: string;
  featuredSpan?: boolean;
  registrationOpen?: boolean;
  angkatan?: string;
  startDate?: string;
  modeLabel?: string;
  modules: {
    weekRange: string;
    topic: string;
    arabicTerm: string;
    outcome: string;
  }[];
}

export interface ClassSchedule {
  id: string;
  batchCode: string;
  programId: string;
  levelNumber: number;
  programName: string;
  levelName: string;
  modeLabel: string;
  days: string;
  timeWIB: string;
  startDate: string;
  instructor: string;
  capacity: number;
  enrolled: number;
  feeIDR: number;
  meetingLink?: string; // Tautan Google Meet / Zoom resmi khusus peserta
  meetingPlatform?: 'Google Meet' | 'Zoom' | 'Lainnya' | string;
  meetingNotes?: string; // Catatan tambahan (misal Passcode / Meeting ID / Petunjuk)
  angkatan?: string; // Misal: Angkatan 1, Angkatan 2
  className?: string; // Misal: Kelas 1, Kelas 2 (untuk 1 angkatan dengan banyak kelas)
  registrationOpen?: boolean; // Status buka/tutup pendaftaran khusus kelas/angkatan ini
}

export interface RegistrationRecord {
  registrationNumber: string;
  fullName: string;
  gender?: 'Laki-laki' | 'Perempuan' | string;
  email: string;
  whatsapp: string;
  occupation: string;
  city: string;
  selectedProgramId: string;
  selectedProgramName: string;
  selectedScheduleId: string;
  selectedScheduleSummary: string;
  learningGoal: string;
  totalTuitionIDR: number;
  paidTuitionIDR?: number; // Jumlah yang sudah dibayar (IDR)
  installmentPaidCount?: number; // Jumlah cicilan yang sudah lunas (0-6)
  paymentPlan?: 'lunas' | 'cicilan'; // Skema pembayaran
  lastPaymentDate?: string; // Tanggal pembayaran terakhir
  registeredAt: string;
  status?: string;
}

export const HERO_IMAGE_PATH = '/src/assets/images/hero_arabic_academy_1794208634346.jpg';
export const TURATS_IMAGE_PATH = '/src/assets/images/program_classical_turats_1794208633759.jpg';
export const HIWAR_IMAGE_PATH = '/src/assets/images/program_modern_hiwar_1794208635088.jpg';

export interface Level1MateriRow {
  no: string;
  pekan: string;
  code: string;
  title: string;
  category: 'Pengantar' | 'Pembahasan Isim' | 'Pembahasan Fi’il';
  arabicTerm: string;
}

export const LEVEL_1_MATERI_TABLE: Level1MateriRow[] = [
  {
    no: '00',
    pekan: 'Pekan 1',
    code: 'MUQODDIMAH',
    title: 'MUQODDIMAH PENGENALAN PROGRAM TADRIBAT',
    category: 'Pengantar',
    arabicTerm: 'مُقَدِّمَةُ بَرْنَامَجِ التَّدْرِيبَات'
  },
  {
    no: '01',
    pekan: 'Pekan 2',
    code: 'MATERI 1',
    title: 'MATERI 1: KATA DALAM BAHASA ARAB DAN MACAM-MACAMNYA',
    category: 'Pengantar',
    arabicTerm: 'الكَلِمَةُ وَأَقْسَامُهَا'
  },
  {
    no: '02',
    pekan: 'Pekan 3',
    code: 'MATERI 2',
    title: 'MATERI 2: ISIM DITINJAU DARI KAIDAH SHARAF',
    category: 'Pembahasan Isim',
    arabicTerm: 'الاسْمُ بِاعْتِبَارِ الصَّرْف'
  },
  {
    no: '03',
    pekan: 'Pekan 4',
    code: 'MATERI 3',
    title: 'MATERI 3: ISIM DITINJAU DARI BANGUNANNYA',
    category: 'Pembahasan Isim',
    arabicTerm: 'الاسْمُ بِاعْتِبَارِ بِنْيَتِهِ'
  },
  {
    no: '04',
    pekan: 'Pekan 5',
    code: 'MATERI 4',
    title: 'MATERI 4: ISIM DITINJAU DARI JENISNYA',
    category: 'Pembahasan Isim',
    arabicTerm: 'الاسْمُ بِاعْتِبَارِ نَوْعِهِ (المُذَكَّرُ وَالمُؤَنَّث)'
  },
  {
    no: '05',
    pekan: 'Pekan 6',
    code: 'MATERI 5',
    title: 'MATERI 5: ISIM DITINJAU DARI JENISNYA BAGIAN 2',
    category: 'Pembahasan Isim',
    arabicTerm: 'تَابِعُ المُذَكَّرِ وَالمُؤَنَّث'
  },
  {
    no: '06',
    pekan: 'Pekan 7',
    code: 'MATERI 6',
    title: 'MATERI 6: ISIM DITINJAU DARI JUMLAHNYA',
    category: 'Pembahasan Isim',
    arabicTerm: 'الاسْمُ بِاعْتِبَارِ عَدَدِهِ (المُفْرَد وَالمُثَنَّى وَالجَمْع)'
  },
  {
    no: '07',
    pekan: 'Pekan 8',
    code: 'MATERI 7',
    title: 'MATERI 7: ISIM DITINJAU DARI KEJELASANNYA',
    category: 'Pembahasan Isim',
    arabicTerm: 'الاسْمُ بِاعْتِبَارِ تَعْيِينِهِ (النَّكِرَة وَالمَعْرِفَة)'
  },
  {
    no: '08',
    pekan: 'Pekan 9',
    code: 'MATERI 8',
    title: 'MATERI 8: ISIM DITINJAU DARI PERUBAHAN AKHIRANNYA',
    category: 'Pembahasan Isim',
    arabicTerm: 'الاسْمُ بِاعْتِبَارِ الإِعْرَابِ وَالبِنَاء'
  },
  {
    no: '09',
    pekan: 'Pekan 10',
    code: 'MATERI 9',
    title: 'MATERI 9: ISIM DITINJAU DARI PENYUSUNANNYA',
    category: 'Pembahasan Isim',
    arabicTerm: 'الاسْمُ بِاعْتِبَارِ تَرْكِيبِهِ'
  },
  {
    no: '10',
    pekan: 'Pekan 11',
    code: 'MATERI 10',
    title: 'MATERI 10: ISIM DITINJAU DARI PENGECILANNYA',
    category: 'Pembahasan Isim',
    arabicTerm: 'الاسْمُ بِاعْتِبَارِ التَّصْغِير'
  },
  {
    no: '11',
    pekan: 'Pekan 12',
    code: 'MATERI 11',
    title: 'MATERI 11: ISIM DITINJAU DARI NISBAHNYA',
    category: 'Pembahasan Isim',
    arabicTerm: 'الاسْمُ بِاعْتِبَارِ النِّسْبَة'
  },
  {
    no: '12',
    pekan: 'Pekan 13',
    code: 'MATERI 12',
    title: 'MATERI 12: FIIL DITINJAU DARI BANGUNAN HURUF AKHIRNYA',
    category: 'Pembahasan Fi’il',
    arabicTerm: 'الفِعْلُ بِاعْتِبَارِ الصِّحَّةِ وَالاعْتِلَال'
  },
  {
    no: '13',
    pekan: 'Pekan 14',
    code: 'MATERI 13',
    title: 'MATERI 13: FIIL DITINJAU DARI PENYUSUNANNYA',
    category: 'Pembahasan Fi’il',
    arabicTerm: 'الفِعْلُ بِاعْتِبَارِ التَّجَرُّدِ وَالزِّيَادَة'
  },
  {
    no: '14',
    pekan: 'Pekan 15',
    code: 'MATERI 14',
    title: "MATERI 14: Fi'il Ditinjau dari Waktu Kejadiannya",
    category: 'Pembahasan Fi’il',
    arabicTerm: 'الفِعْلُ بِاعْتِبَارِ زَمَنِ وُقُوعِهِ'
  },
  {
    no: '14a',
    pekan: 'Pekan 16',
    code: 'MATERI 14a',
    title: "MATERI 14a: Fi'il Ditinjau dari Waktunya (Fi'il madhi)",
    category: 'Pembahasan Fi’il',
    arabicTerm: 'الفِعْلُ المَاضِي'
  },
  {
    no: '14b',
    pekan: 'Pekan 17',
    code: 'Materi 14.b',
    title: "Materi 14.b: Fi'il Ditinjau dari Waktunya (Fi'il mudhari')",
    category: 'Pembahasan Fi’il',
    arabicTerm: 'الفِعْلُ المُضَارِع'
  },
  {
    no: '14c',
    pekan: 'Pekan 18',
    code: 'Materi 14.c',
    title: "Materi 14.c: Fi'il Ditinjau dari Waktu Kejadiannya (Fi'il Amr)",
    category: 'Pembahasan Fi’il',
    arabicTerm: 'فِعْلُ الأَمْر'
  },
  {
    no: '15',
    pekan: 'Pekan 19',
    code: 'Materi 15',
    title: "Materi 15 : Fi'il Ditinjau dari objeknya",
    category: 'Pembahasan Fi’il',
    arabicTerm: 'الفِعْلُ بِاعْتِبَارِ مَعْمُولِهِ (اللَّازِم وَالمُتَعَدِّي)'
  },
  {
    no: '16',
    pekan: 'Pekan 20',
    code: 'Materi 16',
    title: "Materi 16: Fi'il Ditinjau dari Subjeknya",
    category: 'Pembahasan Fi’il',
    arabicTerm: 'الفِعْلُ بِاعْتِبَارِ فَاعِلِهِ (المَعْلُوم وَالمَجْهُول)'
  },
  {
    no: '17',
    pekan: 'Pekan 21',
    code: 'Materi 17',
    title: "Materi 17: Fi'il Ditinjau dari Tashrifnya",
    category: 'Pembahasan Fi’il',
    arabicTerm: 'الفِعْلُ بِاعْتِبَارِ التَّصَرُّفِ وَالجُمُود'
  },
  {
    no: '18',
    pekan: 'Pekan 22',
    code: 'Materi 18',
    title: 'Materi 18: Fiil ditinjau dari perubahannya',
    category: 'Pembahasan Fi’il',
    arabicTerm: 'الفِعْلُ بِاعْتِبَارِ الإِعْرَابِ وَالبِنَاء'
  }
];

export const PROGRAM_TRACKS: ProgramTrack[] = [
  {
    id: 'tl-level-1',
    code: 'TL-LV1',
    indexNumber: '01',
    levelNumber: 1,
    title: 'Tadribul Lughah Level 1 — Nahwu Dasar (Al-Mabadi’ An-Nahwiyyah)',
    arabicTitle: 'تَدْرِيبُ اللُّغَةِ — المُسْتَوَى الأَوَّلُ: النَّحْوُ الأَسَاسِيّ',
    category: 'nahwu',
    categoryLabel: 'Level 1 · Nahwu Dasar',
    scheduleDays: 'Kamis & Jumat',
    scheduleTime: '20.00 – 22.00 WIB',
    levelRecommendation: 'Pemula / Belum pernah belajar kaidah Nahwu secara terstruktur',
    durationWeeks: 22,
    sessionsCount: 44,
    sessionMinutes: 120,
    tuitionIDR: 510000,
    summary:
      'Pondasi utama dalam kurikulum Tadribul Lughah (1 pekan 1 materi selama 22 pekan) yang membahas tuntas Muqoddimah Program Tadribat, macam-macam kata dalam bahasa Arab, tinjauan komprehensif Isim (Materi 2–11), hingga tinjauan komprehensif Fi’il (Materi 12–18).',
    targetOutcome:
      'Menguasai klasifikasi lengkap Isim dan Fi’il dari berbagai tinjauan kaidah bahasa Arab secara sistematis.',
    kitabReference: 'Modul Tadribul Lughah Jilid 1 (Muqoddimah & Materi 1–18)',
    image: HIWAR_IMAGE_PATH,
    featuredSpan: true,
    registrationOpen: true,
    angkatan: 'Angkatan 1',
    startDate: '19 November 2026',
    modules: LEVEL_1_MATERI_TABLE.map((item) => ({
      weekRange: `${item.pekan} (${item.code})`,
      topic: item.title,
      arabicTerm: item.arabicTerm,
      outcome: `Kategori: ${item.category}`
    }))
  },
  {
    id: 'tl-level-2',
    code: 'TL-LV2',
    indexNumber: '02',
    levelNumber: 2,
    title: 'Tadribul Lughah Level 2 — Nahwu Menengah (Marfu’at & Manshubat)',
    arabicTitle: 'تَدْرِيبُ اللُّغَةِ — المُسْتَوَى الثَّانِي: النَّحْوُ المُتَوَسِّط',
    category: 'nahwu',
    categoryLabel: 'Level 2 · Nahwu Menengah',
    scheduleDays: 'Selasa & Rabu',
    scheduleTime: '20.00 – 22.00 WIB',
    levelRecommendation: 'Lulusan Tadribul Lughah Level 1 / Memahami Mubtada’-Khabar & Fa’il',
    durationWeeks: 8,
    sessionsCount: 16,
    sessionMinutes: 120,
    tuitionIDR: 510000,
    summary:
      'Tahap kedua kurikulum Nahwu Tadribul Lughah yang mengupas tuntas amil-amil perusak Mubtada’-Khabar (Kana & Inna), Na’ibul Fa’il, serta seluruh bab Manshubatul Asma’ (kata benda berstatus Nashab) dalam kalimat.',
    targetOutcome:
      'Mampu menganalisis kalimat majemuk yang memuat Kana, Inna, Maf’ul Bih, Maf’ul Muthlaq, Maf’ul Li Ajlih, Zharaf, Hal, dan Tamyiz.',
    kitabReference: 'Modul Tadribul Lughah Jilid 2 (Nawasikh & Manshubatul Asma’)',
    featuredSpan: false,
    registrationOpen: true,
    angkatan: 'Angkatan 1',
    startDate: '17 November 2026',
    modules: [
      {
        weekRange: 'Pekan 1–2',
        topic: 'Na’ibul Fa’il (Kalimat Pasif) & Nawasikh: Kana wa Akhawatuha serta Inna wa Akhawatuha',
        arabicTerm: 'نَائِبُ الفَاعِلِ وَكَانَ وَإِنَّ وَأَخَوَاتُهُمَا',
        outcome: 'Tepat mengubah harakat Mubtada’ dan Khabar ketika dimasuki Kana atau Inna.'
      },
      {
        weekRange: 'Pekan 3–4',
        topic: 'Maf’ul Bih (Objek), Maf’ul Muthlaq, dan Maf’ul Li Ajlih (Keterangan Tujuan)',
        arabicTerm: 'المَفْعُولُ بِهِ وَالمُطْلَقُ وَلِأَجْلِهِ',
        outcome: 'Mengidentifikasi ragam objek dan keterangan alasan dalam wacana Arab.'
      },
      {
        weekRange: 'Pekan 5–6',
        topic: 'Maf’ul Fih (Zharaf Zaman & Makan) serta Maf’ul Ma’ah',
        arabicTerm: 'ظَرْفُ الزَّمَانِ وَالمَكَانِ',
        outcome: 'Menentukan keterangan waktu dan tempat beserta hukum I’rab-nya.'
      },
      {
        weekRange: 'Pekan 7–8',
        topic: 'Al-Hal (Keterangan Keadaan), At-Tamyiz, dan Al-Mustatsna (Pengecualian)',
        arabicTerm: 'الحَالُ وَالتَّمْيِيزُ وَالاسْتِثْنَاءُ',
        outcome: 'Mampu membedah struktur kalimat menengah secara lengkap dalam latihan Tadribat.'
      }
    ]
  },
  {
    id: 'tl-level-3',
    code: 'TL-LV3',
    indexNumber: '03',
    levelNumber: 3,
    title: 'Tadribul Lughah Level 3 — Nahwu Lanjutan (Majrurat, Tawabi’ & Tathbiq I’rab)',
    arabicTitle: 'تَدْرِيبُ اللُّغَةِ — المُسْتَوَى الثَّالِثُ: النَّحْوُ المُتَقَدِّم وَالتَّطْبِيق',
    category: 'nahwu',
    categoryLabel: 'Level 3 · Nahwu Lanjutan',
    scheduleDays: 'Sabtu & Ahad',
    scheduleTime: '20.00 – 22.00 WIB',
    levelRecommendation: 'Lulusan Tadribul Lughah Level 2 / Menguasai Marfu’at & Manshubat',
    durationWeeks: 8,
    sessionsCount: 16,
    sessionMinutes: 120,
    tuitionIDR: 510000,
    summary:
      'Puncak pembelajaran Nahwu di Tadribul Lughah yang memfokuskan pada Majrurat (Huruf Jar & Idhafah), Tawabi’ (Na’at, ’Athaf, Taukid, Badal), I’rab Fi’il Mudhari’ (Nashab, Jazm, Syarat), dan praktik langsung membaca teks tanpa harakat.',
    targetOutcome:
      'Tuntas menguasai seluruh peta konsep ilmu Nahwu dan terampil meng-i’rab kalimat lengkap pada teks Arab gundul maupun ayat Al-Qur’an.',
    kitabReference: 'Modul Tadribul Lughah Jilid 3 & Matan Al-Ajurrumiyyah Tathbiqi',
    featuredSpan: false,
    registrationOpen: true,
    angkatan: 'Angkatan 1',
    startDate: '21 November 2026',
    modules: [
      {
        weekRange: 'Pekan 1–2',
        topic: 'Majruratul Asma’: Huruf Jar, Susunan Idhafah (Mudhaf-Mudhaf Ilaih) & Isim Ghairu Munsharif',
        arabicTerm: 'المَجْرُورَاتُ وَالمَمْنُوعُ مِنَ الصَّرْف',
        outcome: 'Memahami aturan kasrah dan kata benda yang tidak menerima tanwin.'
      },
      {
        weekRange: 'Pekan 3–4',
        topic: 'At-Tawabi’ (Kata Pengikut): Na’at (Sifat), ’Athaf, Taukid, dan Badal',
        arabicTerm: 'التَّوَابِعُ: النَّعْتُ وَالعَطْفُ وَالتَّوْكِيدُ وَالبَدَل',
        outcome: 'Mampu melacak keterkaitan I’rab antar-kata yang berurutan dalam paragraf panjang.'
      },
      {
        weekRange: 'Pekan 5–6',
        topic: 'I’rab Fi’il Mudhari’: Nawashib, Jawazim, Uslub Syarat, dan Af’alul Khamsah',
        arabicTerm: 'نَوَاصِبُ وَجَوَازِمُ الفِعْلِ المُضَارِع',
        outcome: 'Tepat menganalisis perubahan akhir kata kerja sekarang/akan datang.'
      },
      {
        weekRange: 'Pekan 7–8',
        topic: 'Tadribat I’rab Komprehensif: Praktik Baca & Bedah Teks Tanpa Harakat',
        arabicTerm: 'التَّدْرِيبَاتُ الإِعْرَابِيَّةُ الشَّامِلَة',
        outcome: 'Ujian komprehensif Nahwu (Level 1–3) sebagai syarat kelulusan kaidah sintaksis.'
      }
    ]
  },
  {
    id: 'tl-level-4',
    code: 'TL-LV4',
    indexNumber: '04',
    levelNumber: 4,
    title: 'Tadribul Lughah Level 4 — Shorof & Tashrif Aplikatif (Ilmu Ash-Sharf)',
    arabicTitle: 'تَدْرِيبُ اللُّغَةِ — المُسْتَوَى الرَّابِعُ: الصَّرْفُ وَالتَّصْرِيفُ التَّطْبِيقِيّ',
    category: 'shorof',
    categoryLabel: 'Level 4 · Ilmu Shorof',
    scheduleDays: 'Sabtu & Ahad',
    scheduleTime: '20.00 – 22.00 WIB',
    levelRecommendation: 'Lulusan Nahwu (Level 1–3) atau peserta yang ingin membedah pola pembentukan kata',
    durationWeeks: 8,
    sessionsCount: 16,
    sessionMinutes: 120,
    tuitionIDR: 510000,
    summary:
      'Level khusus dalam Tadribul Lughah yang mengupas anatomi dan perubahan bentuk kata (Morfologi Arab). Mencakup Mizan Sharfi, 6 Bab Tsulatsi Mujarrad, Tsulatsi Mazid, Tashrif Istilahi (10–12 Shighat), Tashrif Lughawi (14 Dhamir), serta kaidah I’lal & Ibdal.',
    targetOutcome:
      'Mampu men-tashrif kata kerja Shahih maupun Mu’tal secara lancar, menemukan akar kata di kamus, dan memahami perubahan harakat internal kata.',
    kitabReference: 'Modul Tadribul Lughah Jilid 4 (Tashrif Istilahi, Lughawi & Amtsilah)',
    image: TURATS_IMAGE_PATH,
    featuredSpan: true,
    registrationOpen: true,
    angkatan: 'Angkatan 1',
    startDate: '21 November 2026',
    modules: [
      {
        weekRange: 'Pekan 1–2',
        topic: 'Al-Mizan Ash-Sharfi & 6 Bab Fi’il Tsulatsi Mujarrad (فَعَلَ - يَفْعُلُ dsb.)',
        arabicTerm: 'المِيزَانُ الصَّرْفِيُّ وَأَبْوَابُ الثُّلَاثِيِّ المُجَرَّد',
        outcome: 'Mengenali Fa’ Fi’il, ’Ain Fi’il, dan Lam Fi’il serta pola dasar kata kerja 3 huruf.'
      },
      {
        weekRange: 'Pekan 3–4',
        topic: 'Fi’il Tsulatsi Mazid (Tambahan 1, 2, dan 3 Huruf) & Makna Fungsional Tiap Wazan',
        arabicTerm: 'أَوْزَانُ الثُّلَاثِيِّ المَزِيدِ وَمَعَانِيهَا',
        outcome: 'Memahami perubahan makna dari فَعَلَ menjadi فَعَّلَ, أَفْعَلَ, فَاعَلَ, hingga اِسْتَفْعَلَ.'
      },
      {
        weekRange: 'Pekan 5–6',
        topic: 'Tashrif Istilahi & Tashrif Lughawi Lengkap (14 Dhamir)',
        arabicTerm: 'التَّصْرِيفُ الاصْطِلَاحِيُّ وَاللُّغَوِيُّ',
        outcome: 'Lancar mengubah kata dari Fi’il Madhi, Mudhari’, Masdar, Isim Fa’il, Isim Maf’ul, hingga Isim Alat.'
      },
      {
        weekRange: 'Pekan 7–8',
        topic: 'Aqsamul Bina’ (Shahih, Mudha’af, Mahmuz, Mu’tal: Mitsal, Ajwaf, Naqish) & Kaidah I’lal',
        arabicTerm: 'أَقْسَامُ البِنَاءِ وَقَوَاعِدُ الإِعْلَال',
        outcome: 'Mampu menjelaskan perubahan kata berhuruf ’illat (seperti قَالَ - يَقُولُ dan رَمَى - يَرْمِي).'
      }
    ]
  }
];

export const CLASS_SCHEDULES: ClassSchedule[] = [
  {
    id: 'sch-lv1-malam',
    batchCode: 'TL-LV1-MLM',
    programId: 'tl-level-1',
    levelNumber: 1,
    programName: 'Tadribul Lughah Level 1 — Nahwu Dasar',
    levelName: 'Level 1 (Nahwu Dasar)',
    modeLabel: 'Online Live Interaktif (Zoom)',
    days: 'Kamis & Jumat',
    timeWIB: '20.00 – 22.00 WIB',
    startDate: '19 November 2026',
    instructor: 'Ust. Ahmad Fauzan, Lc., M.A.',
    capacity: 25,
    enrolled: 1,
    feeIDR: 510000
  },
  {
    id: 'sch-lv2-malam',
    batchCode: 'TL-LV2-MLM',
    programId: 'tl-level-2',
    levelNumber: 2,
    programName: 'Tadribul Lughah Level 2 — Nahwu Menengah',
    levelName: 'Level 2 (Nahwu Menengah)',
    modeLabel: 'Online Live Interaktif (Zoom)',
    days: 'Selasa & Rabu',
    timeWIB: '20.00 – 22.00 WIB',
    startDate: '17 November 2026',
    instructor: 'KH. Luqmanul Hakim, Lc., M.Ag.',
    capacity: 25,
    enrolled: 1,
    feeIDR: 510000
  },
  {
    id: 'sch-lv3-malam',
    batchCode: 'TL-LV3-MLM',
    programId: 'tl-level-3',
    levelNumber: 3,
    programName: 'Tadribul Lughah Level 3 — Nahwu Lanjutan',
    levelName: 'Level 3 (Nahwu Lanjutan)',
    modeLabel: 'Online Live Interaktif (Zoom)',
    days: 'Sabtu & Ahad',
    timeWIB: '20.00 – 22.00 WIB',
    startDate: '21 November 2026',
    instructor: 'KH. Luqmanul Hakim, Lc., M.Ag.',
    capacity: 25,
    enrolled: 0,
    feeIDR: 510000
  },
  {
    id: 'sch-lv4-malam',
    batchCode: 'TL-LV4-MLM',
    programId: 'tl-level-4',
    levelNumber: 4,
    programName: 'Tadribul Lughah Level 4 — Shorof & Tashrif Aplikatif',
    levelName: 'Level 4 (Ilmu Shorof)',
    modeLabel: 'Online Live Interaktif (Zoom)',
    days: 'Sabtu & Ahad',
    timeWIB: '20.00 – 22.00 WIB',
    startDate: '21 November 2026',
    instructor: 'Syaikh Dr. Ahmad Al-Manshur & Tim Shorof',
    capacity: 25,
    enrolled: 1,
    feeIDR: 510000
  }
];

export const INITIAL_REGISTRATIONS: RegistrationRecord[] = [
  {
    registrationNumber: 'TL-2026-8419',
    fullName: 'Rizky Pratama Wijaya',
    gender: 'Laki-laki',
    email: 'rizky.wijaya@alumni.ui.ac.id',
    whatsapp: '0812-8841-9023',
    occupation: 'Peneliti & Dosen Muda',
    city: 'Depok',
    selectedProgramId: 'tl-level-2',
    selectedProgramName: 'Tadribul Lughah Level 2 — Nahwu Menengah (Marfu’at & Manshubat)',
    selectedScheduleId: 'sch-lv2-malam',
    selectedScheduleSummary: 'TL-LV2-MLM · Selasa & Rabu (20.00 – 22.00 WIB) · Online',
    learningGoal: 'Memantapkan penguasaan bab Manshubat dan Nawasikh setelah lulus Level 1.',
    totalTuitionIDR: 510000,
    paidTuitionIDR: 170000,
    installmentPaidCount: 2,
    paymentPlan: 'cicilan',
    lastPaymentDate: '08 November 2026, 09:40 WIB',
    registeredAt: '08 November 2026, 09:40 WIB',
    status: 'Terverifikasi — Menunggu Orientasi'
  },
  {
    registrationNumber: 'TL-2026-8452',
    fullName: 'Siti Aisyah Nurhaliza',
    gender: 'Perempuan',
    email: 'aisyah.nurhaliza@gmail.com',
    whatsapp: '0813-9201-4418',
    occupation: 'Dokter Umum',
    city: 'Jakarta Selatan',
    selectedProgramId: 'tl-level-1',
    selectedProgramName: 'Tadribul Lughah Level 1 — Nahwu Dasar (Angkatan 1)',
    selectedScheduleId: 'sch-lv1-malam',
    selectedScheduleSummary: 'TL-LV1-MLM · Kamis & Jumat (20.00 – 22.00 WIB) · Online',
    learningGoal: 'Membangun pondasi Nahwu dari nol agar memahami struktur ayat Al-Qur’an.',
    totalTuitionIDR: 510000,
    paidTuitionIDR: 510000,
    installmentPaidCount: 6,
    paymentPlan: 'lunas',
    lastPaymentDate: '15 Oktober 2026, 14:15 WIB',
    registeredAt: '01 Oktober 2026, 14:15 WIB',
    status: 'Terverifikasi — Lulus Angkatan 1'
  },
  {
    registrationNumber: 'TL-2026-8453',
    fullName: 'Siti Aisyah Nurhaliza',
    gender: 'Perempuan',
    email: 'aisyah.nurhaliza@gmail.com',
    whatsapp: '0813-9201-4418',
    occupation: 'Dokter Umum',
    city: 'Jakarta Selatan',
    selectedProgramId: 'tl-level-1',
    selectedProgramName: 'Tadribul Lughah Level 1 — Nahwu Dasar (Angkatan 2 · Daftar Ulang)',
    selectedScheduleId: 'sch-lv1-pagi',
    selectedScheduleSummary: 'TL-LV1-PAGI · Sabtu & Ahad (05.30 – 07.30 WIB) · Online',
    learningGoal: 'Memperdalam dan mengulang kembali materi Nahwu Dasar di Angkatan 2 agar semakin mutqin.',
    totalTuitionIDR: 510000,
    paidTuitionIDR: 170000,
    installmentPaidCount: 2,
    paymentPlan: 'cicilan',
    lastPaymentDate: '08 November 2026, 14:15 WIB',
    registeredAt: '08 November 2026, 14:15 WIB',
    status: 'Terverifikasi — Menunggu Orientasi'
  },
  {
    registrationNumber: 'TL-2026-8477',
    fullName: 'Muhammad Farhan Al-Farisi',
    gender: 'Laki-laki',
    email: 'farhan.alfarisi@ugm.ac.id',
    whatsapp: '0857-2109-3381',
    occupation: 'Mahasiswa S2',
    city: 'Yogyakarta',
    selectedProgramId: 'tl-level-4',
    selectedProgramName: 'Tadribul Lughah Level 4 — Shorof & Tashrif Aplikatif (Ilmu Ash-Sharf)',
    selectedScheduleId: 'sch-lv4-malam',
    selectedScheduleSummary: 'TL-LV4-MLM · Sabtu & Ahad (20.00 – 22.00 WIB) · Online',
    learningGoal: 'Menguasai Tashrif Istilahi, Lughawi, dan kaidah I’lal setelah menamatkan Nahwu Level 1–3.',
    totalTuitionIDR: 510000,
    paidTuitionIDR: 510000,
    installmentPaidCount: 6,
    paymentPlan: 'lunas',
    lastPaymentDate: '08 November 2026, 18:20 WIB',
    registeredAt: '08 November 2026, 18:20 WIB',
    status: 'Terverifikasi — Menunggu Orientasi'
  }
];

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount);
}

const REG_OPEN_STORAGE_KEY = 'tadribul_lughah_reg_open_map_v1';
const ANGKATAN_STORAGE_KEY = 'tadribul_lughah_angkatan_map_v1';
const START_DATE_STORAGE_KEY = 'tadribul_lughah_start_date_map_v1';
const MEETING_LINK_STORAGE_KEY = 'tadribul_lughah_meeting_link_map_v1';
const MEETING_PLATFORM_STORAGE_KEY = 'tadribul_lughah_meeting_platform_map_v1';
const MEETING_NOTES_STORAGE_KEY = 'tadribul_lughah_meeting_notes_map_v1';
const SCHEDULE_OVERRIDES_STORAGE_KEY = 'tadribul_lughah_schedule_overrides_v1';
const DELETED_SCHEDULES_STORAGE_KEY = 'tadribul_lughah_deleted_schedules_v1';

export const DEFAULT_PROGRAM_START_DATES: Record<string, string> = {
  'tl-level-1': '19 November 2026',
  'tl-level-2': '17 November 2026',
  'tl-level-3': '21 November 2026',
  'tl-level-4': '21 November 2026'
};

function parseLevelNum(raw: string): number {
  const match = raw.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

function setCanonicalProgramKeys(
  regMap: Record<string, boolean>,
  angkatanMap: Record<string, string>,
  startDateMap: Record<string, string>,
  meetingLinkMap: Record<string, string>,
  meetingPlatformMap: Record<string, string>,
  meetingNotesMap: Record<string, string>,
  key: string,
  isOpen?: boolean,
  angkatan?: string,
  startDate?: string,
  meetingLink?: string,
  meetingPlatform?: string,
  meetingNotes?: string
) {
  const num = parseLevelNum(key);
  const aliases = [
    key,
    `tl-level-${num}`,
    `level-${num}`,
    String(num),
    `TL-LV${num}`
  ];
  for (const alias of aliases) {
    if (typeof isOpen === 'boolean') {
      regMap[alias] = isOpen;
    }
    if (typeof angkatan === 'string' && angkatan.trim()) {
      angkatanMap[alias] = angkatan.trim();
    }
    if (typeof startDate === 'string' && startDate.trim()) {
      startDateMap[alias] = startDate.trim();
    }
    if (typeof meetingLink === 'string') {
      meetingLinkMap[alias] = meetingLink.trim();
    }
    if (typeof meetingPlatform === 'string' && meetingPlatform.trim()) {
      meetingPlatformMap[alias] = meetingPlatform.trim();
    }
    if (typeof meetingNotes === 'string') {
      meetingNotesMap[alias] = meetingNotes.trim();
    }
  }
}

export function getStoredScheduleOverrides(): Record<string, ClassSchedule> {
  try {
    const raw = localStorage.getItem(SCHEDULE_OVERRIDES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, ClassSchedule>;
      }
    }
  } catch {
    // Ignore
  }
  return {};
}

export function getStoredDeletedScheduleIds(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(DELETED_SCHEDULES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, boolean>;
      }
    }
  } catch {
    // Ignore
  }
  return {};
}

export function saveScheduleOverride(sch: ClassSchedule): void {
  if (typeof window === 'undefined' || !sch?.id) return;
  try {
    const overrides = getStoredScheduleOverrides();
    overrides[sch.id] = { ...sch };
    localStorage.setItem(SCHEDULE_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));

    const deleted = getStoredDeletedScheduleIds();
    if (deleted[sch.id]) {
      delete deleted[sch.id];
      localStorage.setItem(DELETED_SCHEDULES_STORAGE_KEY, JSON.stringify(deleted));
    }

    const startDateMap = getStoredStartDateMap();
    const meetingLinkMap = getStoredMeetingLinkMap();
    const meetingPlatformMap = getStoredMeetingPlatformMap();
    const meetingNotesMap = getStoredMeetingNotesMap();
    const regMap = getStoredRegistrationOpenMap();

    if (sch.startDate && sch.startDate.trim()) {
      startDateMap[sch.id] = sch.startDate.trim();
    }
    if (typeof sch.meetingLink === 'string') {
      meetingLinkMap[sch.id] = sch.meetingLink.trim();
    }
    if (typeof sch.meetingPlatform === 'string' && sch.meetingPlatform.trim()) {
      meetingPlatformMap[sch.id] = sch.meetingPlatform.trim();
    }
    if (typeof sch.meetingNotes === 'string') {
      meetingNotesMap[sch.id] = sch.meetingNotes.trim();
    }
    if (typeof sch.registrationOpen === 'boolean') {
      regMap[sch.id] = sch.registrationOpen;
    }

    localStorage.setItem(START_DATE_STORAGE_KEY, JSON.stringify(startDateMap));
    localStorage.setItem(MEETING_LINK_STORAGE_KEY, JSON.stringify(meetingLinkMap));
    localStorage.setItem(MEETING_PLATFORM_STORAGE_KEY, JSON.stringify(meetingPlatformMap));
    localStorage.setItem(MEETING_NOTES_STORAGE_KEY, JSON.stringify(meetingNotesMap));
    localStorage.setItem(REG_OPEN_STORAGE_KEY, JSON.stringify(regMap));

    window.dispatchEvent(new Event('program-open-updated'));
    window.dispatchEvent(new Event('storage'));

    const payload: Record<string, unknown> = {
      [`schedule:${sch.id}`]: {
        ...sch,
        registrationOpen: sch.registrationOpen !== false
      },
      [`deleted_schedule:${sch.id}`]: { deleted: false },
      [sch.id]: {
        startDate: sch.startDate || '',
        meetingLink: (sch.meetingLink || '').trim(),
        meetingPlatform: (sch.meetingPlatform || 'Google Meet').trim(),
        meetingNotes: (sch.meetingNotes || '').trim(),
        registrationOpen: sch.registrationOpen !== false
      }
    };

    fetch('./api.php?entity=program_states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch((e) => console.warn('Sync schedule override notice:', e));
  } catch {
    // Ignore storage write errors
  }
}

export function deleteScheduleOverride(scheduleId: string): void {
  if (typeof window === 'undefined' || !scheduleId) return;
  try {
    const overrides = getStoredScheduleOverrides();
    if (overrides[scheduleId]) {
      delete overrides[scheduleId];
      localStorage.setItem(SCHEDULE_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
    }

    const deleted = getStoredDeletedScheduleIds();
    deleted[scheduleId] = true;
    localStorage.setItem(DELETED_SCHEDULES_STORAGE_KEY, JSON.stringify(deleted));

    window.dispatchEvent(new Event('program-open-updated'));
    window.dispatchEvent(new Event('storage'));

    fetch('./api.php?entity=program_states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        [`deleted_schedule:${scheduleId}`]: { deleted: true }
      })
    }).catch((e) => console.warn('Sync delete schedule notice:', e));
  } catch {
    // Ignore
  }
}

export function getStoredRegistrationOpenMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(REG_OPEN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, boolean>;
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return {};
}

export function getStoredAngkatanMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ANGKATAN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, string>;
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return {};
}

export function getStoredStartDateMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(START_DATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, string>;
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return {};
}

export function getStoredMeetingLinkMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(MEETING_LINK_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, string>;
      }
    }
  } catch {
    // Ignore
  }
  return {};
}

export function getStoredMeetingPlatformMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(MEETING_PLATFORM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, string>;
      }
    }
  } catch {
    // Ignore
  }
  return {};
}

export function getStoredMeetingNotesMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(MEETING_NOTES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, string>;
      }
    }
  } catch {
    // Ignore
  }
  return {};
}

function applyServerProgramStatesMap(serverData: Record<string, unknown>): void {
  const regMap = getStoredRegistrationOpenMap();
  const angkatanMap = getStoredAngkatanMap();
  const startDateMap = getStoredStartDateMap();
  const meetingLinkMap = getStoredMeetingLinkMap();
  const meetingPlatformMap = getStoredMeetingPlatformMap();
  const meetingNotesMap = getStoredMeetingNotesMap();
  const scheduleOverrides = getStoredScheduleOverrides();
  const deletedSchedules = getStoredDeletedScheduleIds();

  for (const [key, state] of Object.entries(serverData)) {
    if (!state || typeof state !== 'object') continue;

    if (key.startsWith('schedule:')) {
      const sch = state as ClassSchedule;
      const schId = sch.id || key.slice('schedule:'.length);
      if (schId) {
        scheduleOverrides[schId] = { ...sch, id: schId };
        if (sch.startDate && sch.startDate.trim()) startDateMap[schId] = sch.startDate.trim();
        if (typeof sch.meetingLink === 'string') meetingLinkMap[schId] = sch.meetingLink.trim();
        if (typeof sch.meetingPlatform === 'string' && sch.meetingPlatform.trim()) {
          meetingPlatformMap[schId] = sch.meetingPlatform.trim();
        }
        if (typeof sch.meetingNotes === 'string') meetingNotesMap[schId] = sch.meetingNotes.trim();
        if (typeof sch.registrationOpen === 'boolean') regMap[schId] = sch.registrationOpen;
      }
      continue;
    }

    if (key.startsWith('deleted_schedule:')) {
      const schId = key.slice('deleted_schedule:'.length);
      const delObj = state as { deleted?: boolean };
      if (schId) {
        if (delObj.deleted) {
          deletedSchedules[schId] = true;
        } else {
          delete deletedSchedules[schId];
        }
      }
      continue;
    }

    const s = state as {
      registrationOpen?: boolean;
      angkatan?: string;
      startDate?: string;
      meetingLink?: string;
      meetingPlatform?: string;
      meetingNotes?: string;
    };

    if (key.startsWith('sch-')) {
      if (typeof s.registrationOpen === 'boolean') {
        regMap[key] = s.registrationOpen;
      }
      if (typeof s.startDate === 'string' && s.startDate.trim()) {
        startDateMap[key] = s.startDate.trim();
      }
      if (typeof s.meetingLink === 'string') {
        meetingLinkMap[key] = s.meetingLink.trim();
      }
      if (typeof s.meetingPlatform === 'string' && s.meetingPlatform.trim()) {
        meetingPlatformMap[key] = s.meetingPlatform.trim();
      }
      if (typeof s.meetingNotes === 'string') {
        meetingNotesMap[key] = s.meetingNotes.trim();
      }
      continue;
    }

    setCanonicalProgramKeys(
      regMap,
      angkatanMap,
      startDateMap,
      meetingLinkMap,
      meetingPlatformMap,
      meetingNotesMap,
      key,
      typeof s.registrationOpen === 'boolean' ? s.registrationOpen : undefined,
      typeof s.angkatan === 'string' && s.angkatan.trim() ? s.angkatan.trim() : undefined,
      typeof s.startDate === 'string' && s.startDate.trim() ? s.startDate.trim() : undefined,
      typeof s.meetingLink === 'string' ? s.meetingLink.trim() : undefined,
      typeof s.meetingPlatform === 'string' && s.meetingPlatform.trim() ? s.meetingPlatform.trim() : undefined,
      typeof s.meetingNotes === 'string' ? s.meetingNotes.trim() : undefined
    );
  }

  localStorage.setItem(REG_OPEN_STORAGE_KEY, JSON.stringify(regMap));
  localStorage.setItem(ANGKATAN_STORAGE_KEY, JSON.stringify(angkatanMap));
  localStorage.setItem(START_DATE_STORAGE_KEY, JSON.stringify(startDateMap));
  localStorage.setItem(MEETING_LINK_STORAGE_KEY, JSON.stringify(meetingLinkMap));
  localStorage.setItem(MEETING_PLATFORM_STORAGE_KEY, JSON.stringify(meetingPlatformMap));
  localStorage.setItem(MEETING_NOTES_STORAGE_KEY, JSON.stringify(meetingNotesMap));
  localStorage.setItem(SCHEDULE_OVERRIDES_STORAGE_KEY, JSON.stringify(scheduleOverrides));
  localStorage.setItem(DELETED_SCHEDULES_STORAGE_KEY, JSON.stringify(deletedSchedules));
  window.dispatchEvent(new Event('program-open-updated'));
  window.dispatchEvent(new Event('storage'));
}

export async function syncProgramStatesFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  const cacheBuster = `_t=${Date.now()}`;
  try {
    const res = await fetch(`./api.php?entity=program_states&${cacheBuster}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && typeof serverData === 'object' && Object.keys(serverData).length > 0) {
        applyServerProgramStatesMap(serverData as Record<string, unknown>);
        return;
      }
    }
  } catch {
    // If api.php fails, fallback to program_states.json
  }

  try {
    const resJson = await fetch(`./program_states.json?${cacheBuster}`, {
      cache: 'no-store'
    });
    if (resJson.ok) {
      const jsonData = await resJson.json();
      if (jsonData && typeof jsonData === 'object' && Object.keys(jsonData).length > 0) {
        applyServerProgramStatesMap(jsonData as Record<string, unknown>);
      }
    }
  } catch {
    // Ignore fallback errors
  }
}

export function saveProgramFullState(
  programId: string,
  state: {
    registrationOpen?: boolean;
    angkatan?: string;
    startDate?: string;
    meetingLink?: string;
    meetingPlatform?: string;
    meetingNotes?: string;
  }
): void {
  try {
    const regMap = getStoredRegistrationOpenMap();
    const angkatanMap = getStoredAngkatanMap();
    const startDateMap = getStoredStartDateMap();
    const meetingLinkMap = getStoredMeetingLinkMap();
    const meetingPlatformMap = getStoredMeetingPlatformMap();
    const meetingNotesMap = getStoredMeetingNotesMap();

    setCanonicalProgramKeys(
      regMap,
      angkatanMap,
      startDateMap,
      meetingLinkMap,
      meetingPlatformMap,
      meetingNotesMap,
      programId,
      state.registrationOpen,
      state.angkatan,
      state.startDate,
      state.meetingLink,
      state.meetingPlatform,
      state.meetingNotes
    );

    localStorage.setItem(REG_OPEN_STORAGE_KEY, JSON.stringify(regMap));
    localStorage.setItem(ANGKATAN_STORAGE_KEY, JSON.stringify(angkatanMap));
    localStorage.setItem(START_DATE_STORAGE_KEY, JSON.stringify(startDateMap));
    localStorage.setItem(MEETING_LINK_STORAGE_KEY, JSON.stringify(meetingLinkMap));
    localStorage.setItem(MEETING_PLATFORM_STORAGE_KEY, JSON.stringify(meetingPlatformMap));
    localStorage.setItem(MEETING_NOTES_STORAGE_KEY, JSON.stringify(meetingNotesMap));
    window.dispatchEvent(new Event('program-open-updated'));
    window.dispatchEvent(new Event('storage'));

    const payload: Record<
      string,
      {
        registrationOpen: boolean;
        angkatan: string;
        startDate: string;
        meetingLink?: string;
        meetingPlatform?: string;
        meetingNotes?: string;
      }
    > = {};
    for (let i = 1; i <= 4; i++) {
      const id = `tl-level-${i}`;
      payload[id] = {
        registrationOpen: typeof regMap[id] === 'boolean' ? regMap[id] : true,
        angkatan: angkatanMap[id] || 'Angkatan 1',
        startDate: startDateMap[id] || DEFAULT_PROGRAM_START_DATES[id] || '19 November 2026',
        meetingLink: meetingLinkMap[id] || '',
        meetingPlatform: meetingPlatformMap[id] || 'Google Meet',
        meetingNotes: meetingNotesMap[id] || ''
      };
    }

    fetch('./api.php?entity=program_states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch((e) => console.warn('Sync program state notice:', e));
  } catch {
    // Ignore storage write errors
  }
}

export function saveProgramRegistrationOpenState(
  programId: string,
  isOpen: boolean
): void {
  saveProgramFullState(programId, { registrationOpen: isOpen });
}

export function saveProgramAngkatanState(
  programId: string,
  angkatan: string
): void {
  saveProgramFullState(programId, { angkatan });
}

export function saveProgramStartDate(
  programId: string,
  startDate: string
): void {
  saveProgramFullState(programId, { startDate });
}

export function saveProgramMeetingDetails(
  programId: string,
  details: { meetingLink?: string; meetingPlatform?: string; meetingNotes?: string }
): void {
  saveProgramFullState(programId, details);
}

export function applyRegistrationOpenOverrides(
  tracks: ProgramTrack[]
): ProgramTrack[] {
  const regMap = getStoredRegistrationOpenMap();
  const angkatanMap = getStoredAngkatanMap();
  const startDateMap = getStoredStartDateMap();
  return tracks.map((t) => {
    // Check multiple candidate keys for robust matching across ID variations
    const candidateKeys = [
      t.id,
      `tl-level-${t.levelNumber}`,
      `level-${t.levelNumber}`,
      String(t.levelNumber),
      t.code
    ];

    let resolvedOpen: boolean = t.registrationOpen !== false;
    for (const key of candidateKeys) {
      if (typeof regMap[key] === 'boolean') {
        resolvedOpen = regMap[key];
        break;
      }
    }

    let resolvedAngkatan: string = t.angkatan || 'Angkatan 1';
    for (const key of candidateKeys) {
      if (typeof angkatanMap[key] === 'string' && angkatanMap[key].trim()) {
        resolvedAngkatan = angkatanMap[key].trim();
        break;
      }
    }

    let resolvedStartDate: string = t.startDate || DEFAULT_PROGRAM_START_DATES[t.id] || '19 November 2026';
    for (const key of candidateKeys) {
      if (typeof startDateMap[key] === 'string' && startDateMap[key].trim()) {
        resolvedStartDate = startDateMap[key].trim();
        break;
      }
    }

    return {
      ...t,
      registrationOpen: resolvedOpen,
      angkatan: resolvedAngkatan,
      startDate: resolvedStartDate
    };
  });
}

export function isScheduleRegistrationOpen(
  sch?: ClassSchedule,
  prog?: ProgramTrack
): boolean {
  if (typeof sch?.registrationOpen === 'boolean') {
    return sch.registrationOpen;
  }
  return sch ? true : prog?.registrationOpen !== false;
}

export function isProgramHasAnyOpenSchedule(
  prog: ProgramTrack,
  schedules: ClassSchedule[]
): boolean {
  const matching = schedules.filter((s) => s.programId === prog.id);
  if (matching.length === 0) {
    return prog.registrationOpen !== false;
  }
  return matching.some((s) => isScheduleRegistrationOpen(s, prog));
}

export function applyScheduleStartDateOverrides(
  schedules: ClassSchedule[]
): ClassSchedule[] {
  const startDateMap = getStoredStartDateMap();
  const meetingLinkMap = getStoredMeetingLinkMap();
  const meetingPlatformMap = getStoredMeetingPlatformMap();
  const meetingNotesMap = getStoredMeetingNotesMap();
  const regMap = getStoredRegistrationOpenMap();
  const scheduleOverrides = getStoredScheduleOverrides();
  const deletedMap = getStoredDeletedScheduleIds();

  // Merge base schedules + custom/saved schedule overrides without losing multi-class entries
  const mergedById = new Map<string, ClassSchedule>();
  for (const sch of schedules) {
    if (deletedMap[sch.id]) continue;
    const ov = scheduleOverrides[sch.id];
    mergedById.set(sch.id, ov ? { ...sch, ...ov } : { ...sch });
  }
  for (const [ovId, ovSch] of Object.entries(scheduleOverrides)) {
    if (deletedMap[ovId] || !ovSch || !ovSch.id) continue;
    if (!mergedById.has(ovId)) {
      mergedById.set(ovId, { ...ovSch });
    }
  }

  return Array.from(mergedById.values())
    .map((sch) => {
      const ov = scheduleOverrides[sch.id];
      const fallbackKeys = [
        sch.programId,
        `tl-level-${sch.levelNumber}`,
        `level-${sch.levelNumber}`,
        String(sch.levelNumber),
        sch.batchCode
      ];

      let resolvedStartDate = '';
      if (ov?.startDate && ov.startDate.trim()) {
        resolvedStartDate = ov.startDate.trim();
      } else if (typeof startDateMap[sch.id] === 'string' && startDateMap[sch.id].trim()) {
        resolvedStartDate = startDateMap[sch.id].trim();
      } else {
        for (const key of fallbackKeys) {
          if (typeof startDateMap[key] === 'string' && startDateMap[key].trim()) {
            resolvedStartDate = startDateMap[key].trim();
            break;
          }
        }
      }
      if (!resolvedStartDate) resolvedStartDate = sch.startDate;

      let resolvedMeetingLink = '';
      if (ov && typeof ov.meetingLink === 'string') {
        resolvedMeetingLink = ov.meetingLink.trim();
      } else if (typeof meetingLinkMap[sch.id] === 'string') {
        resolvedMeetingLink = meetingLinkMap[sch.id].trim();
      } else if (sch.meetingLink && sch.meetingLink.trim()) {
        resolvedMeetingLink = sch.meetingLink.trim();
      } else {
        for (const key of fallbackKeys) {
          if (typeof meetingLinkMap[key] === 'string' && meetingLinkMap[key].trim()) {
            resolvedMeetingLink = meetingLinkMap[key].trim();
            break;
          }
        }
      }

      let resolvedPlatform = '';
      if (ov?.meetingPlatform && ov.meetingPlatform.trim()) {
        resolvedPlatform = ov.meetingPlatform.trim();
      } else if (typeof meetingPlatformMap[sch.id] === 'string' && meetingPlatformMap[sch.id].trim()) {
        resolvedPlatform = meetingPlatformMap[sch.id].trim();
      } else if (sch.meetingPlatform && sch.meetingPlatform.trim()) {
        resolvedPlatform = sch.meetingPlatform.trim();
      } else {
        for (const key of fallbackKeys) {
          if (typeof meetingPlatformMap[key] === 'string' && meetingPlatformMap[key].trim()) {
            resolvedPlatform = meetingPlatformMap[key].trim();
            break;
          }
        }
      }
      if (!resolvedPlatform) resolvedPlatform = 'Google Meet';

      let resolvedNotes = '';
      if (ov && typeof ov.meetingNotes === 'string') {
        resolvedNotes = ov.meetingNotes.trim();
      } else if (typeof meetingNotesMap[sch.id] === 'string') {
        resolvedNotes = meetingNotesMap[sch.id].trim();
      } else if (sch.meetingNotes && sch.meetingNotes.trim()) {
        resolvedNotes = sch.meetingNotes.trim();
      } else {
        for (const key of fallbackKeys) {
          if (typeof meetingNotesMap[key] === 'string' && meetingNotesMap[key].trim()) {
            resolvedNotes = meetingNotesMap[key].trim();
            break;
          }
        }
      }

      let resolvedRegOpen = true;
      if (typeof ov?.registrationOpen === 'boolean') {
        resolvedRegOpen = ov.registrationOpen;
      } else if (typeof regMap[sch.id] === 'boolean') {
        resolvedRegOpen = regMap[sch.id];
      } else if (typeof sch.registrationOpen === 'boolean') {
        resolvedRegOpen = sch.registrationOpen;
      }

      return {
        ...sch,
        startDate: resolvedStartDate,
        meetingLink: resolvedMeetingLink,
        meetingPlatform: resolvedPlatform,
        meetingNotes: resolvedNotes,
        registrationOpen: resolvedRegOpen
      };
    })
    .sort((a, b) => a.levelNumber - b.levelNumber);
}

export interface ProgramOnlineMeeting {
  sessionNumber: number;
  pekanNumber: number;
  title: string;
  arabicTitle?: string;
  category?: string;
  dayLabel: string;
  timeWIB: string;
  dateStr: string;
}

export function parseIndonesianDate(dateStr?: string): Date {
  if (!dateStr) return new Date(2026, 10, 19);
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10) || 19;
    const monthNames: Record<string, number> = {
      januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
      juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
    };
    const mStr = parts[1].toLowerCase();
    const month = monthNames[mStr] !== undefined ? monthNames[mStr] : 10;
    const year = parseInt(parts[2], 10) || 2026;
    return new Date(year, month, day);
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date(2026, 10, 19) : parsed;
}

export function getModulePekanNumber(weekRange?: string, fallbackIdx: number = 0): number {
  if (!weekRange) return fallbackIdx + 1;
  const match = weekRange.match(/Pekan\s*(\d+)/i);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }
  return fallbackIdx + 1;
}

const INDONESIAN_WEEKDAY_MAP: Record<string, number> = {
  minggu: 0,
  ahad: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  "jum'at": 5,
  sabtu: 6
};

function getDayOffsetsForSchedule(baseDate: Date, daysArray: string[]): number[] {
  if (daysArray.length === 0) return [0];
  const baseWeekday = baseDate.getDay();
  const firstIdx = INDONESIAN_WEEKDAY_MAP[daysArray[0].toLowerCase()];
  const firstOffset = firstIdx !== undefined ? (firstIdx - baseWeekday + 7) % 7 : 0;
  const anchorWeekday = firstIdx !== undefined ? firstIdx : baseWeekday;

  return daysArray.map((dayName, idx) => {
    if (idx === 0) return firstOffset;
    const dIdx = INDONESIAN_WEEKDAY_MAP[dayName.toLowerCase()];
    if (dIdx === undefined) return firstOffset + idx;
    const diffFromFirst = (dIdx - anchorWeekday + 7) % 7;
    return firstOffset + (diffFromFirst === 0 ? idx : diffFromFirst);
  });
}

export function buildProgramMeetings(
  program: ProgramTrack,
  schedule?: ClassSchedule
): ProgramOnlineMeeting[] {
  const baseDate = parseIndonesianDate(schedule?.startDate || program.startDate);
  const timeWIB = schedule?.timeWIB || program.scheduleTime || '20.00 – 22.00 WIB';
  const scheduleDaysStr = schedule?.days || program.scheduleDays || 'Kamis & Jumat';

  const daysArray = scheduleDaysStr
    .split(/[&,]+|\bdan\b/i)
    .map((d) => d.trim())
    .filter(Boolean);
  const activeDays = daysArray.length > 0 ? daysArray : ['Kamis'];
  const primaryDay = activeDays[0] || 'Kamis';
  const dayOffsets = getDayOffsetsForSchedule(baseDate, activeDays);

  const formatDateIndo = (d: Date) =>
    new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d);

  const meetings: ProgramOnlineMeeting[] = [];
  const totalWeeks = program.durationWeeks || (program.modules?.length ? program.modules.length : 8);

  // Jika 1 modul mewakili 1 pekan kurikulum (seperti Level 1: 22 pekan modul × jumlah hari kelas per pekan, misal Kamis & Jumat = 44 sesi)
  if (program.modules && program.modules.length >= totalWeeks) {
    program.modules.slice(0, totalWeeks).forEach((mod, weekIdx) => {
      const pekanNumber = getModulePekanNumber(mod.weekRange, weekIdx);

      activeDays.forEach((dayName, daySlotIdx) => {
        const sessionNumber = meetings.length + 1;
        const addDays = weekIdx * 7 + (dayOffsets[daySlotIdx] ?? daySlotIdx);
        const meetingDate = new Date(baseDate.getTime() + addDays * 24 * 60 * 60 * 1000);

        meetings.push({
          sessionNumber,
          pekanNumber,
          title:
            activeDays.length > 1
              ? `${mod.topic} (Pertemuan ${dayName})`
              : mod.topic,
          arabicTitle: mod.arabicTerm,
          category: mod.outcome?.replace(/^Kategori:\s*/i, ''),
          dayLabel: dayName || primaryDay,
          timeWIB,
          dateStr: formatDateIndo(meetingDate)
        });
      });
    });
  } else {
    // Untuk Level 2–4 (8 pekan × 2 pertemuan per pekan = 16 sesi)
    const slotsPerWeek = activeDays.length;
    const totalSessions = Math.max(
      program.sessionsCount || totalWeeks * slotsPerWeek,
      totalWeeks * slotsPerWeek
    );
    const modules = program.modules || [];

    for (let i = 0; i < totalSessions; i++) {
      const sessionNumber = i + 1;
      const weekIdx = Math.floor(i / slotsPerWeek);
      const dayOffsetInWeek = i % slotsPerWeek;
      const pekanNumber = weekIdx + 1;
      const dayLabel = activeDays[dayOffsetInWeek] || primaryDay;

      const modIdx = Math.min(
        Math.floor(i / Math.max(1, Math.ceil(totalSessions / Math.max(modules.length, 1)))),
        modules.length - 1
      );
      const mod = modules[modIdx];

      const addDays = weekIdx * 7 + (dayOffsets[dayOffsetInWeek] ?? dayOffsetInWeek);
      const meetingDate = new Date(baseDate.getTime() + addDays * 24 * 60 * 60 * 1000);

      meetings.push({
        sessionNumber,
        pekanNumber,
        title: mod
          ? `${mod.topic} (Pertemuan ${dayLabel} · Sesi ${sessionNumber})`
          : `Pertemuan ${sessionNumber} (${dayLabel}): Pendalaman Materi Kaidah`,
        arabicTitle: mod?.arabicTerm,
        category: mod?.outcome,
        dayLabel,
        timeWIB,
        dateStr: formatDateIndo(meetingDate)
      });
    }
  }

  return meetings;
}

/**
 * Memformat nomor WhatsApp / telepon Indonesia secara otomatis dengan tanda hubung `-`.
 * Contoh: "089670731527" -> "0896-7073-1527", "+6289670731527" -> "+62-896-7073-1527".
 */
export function formatWhatsAppNumber(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('+62')) {
    const restDigits = trimmed.slice(3).replace(/\D/g, '').slice(0, 13);
    if (!restDigits) return '+62';
    if (restDigits.length <= 3) return `+62-${restDigits}`;
    if (restDigits.length <= 7) return `+62-${restDigits.slice(0, 3)}-${restDigits.slice(3)}`;
    if (restDigits.length <= 12) return `+62-${restDigits.slice(0, 3)}-${restDigits.slice(3, 7)}-${restDigits.slice(7)}`;
    return `+62-${restDigits.slice(0, 3)}-${restDigits.slice(3, 7)}-${restDigits.slice(7, 11)}-${restDigits.slice(11)}`;
  }

  const digits = trimmed.replace(/\D/g, '').slice(0, 15);
  if (!digits) return '';
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  if (digits.length <= 13) return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Mengambil jadwal utama/rekomendasi untuk suatu program level (mengutamakan jadwal terbuka & cocok angkatan program).
 */
export function getPreferredScheduleForProgram(
  prog: ProgramTrack,
  allSchedules: ClassSchedule[] = CLASS_SCHEDULES
): ClassSchedule {
  const progSchedules = allSchedules.filter((s) => s.programId === prog.id);
  const openProgSchedules = progSchedules.filter((s) => isScheduleRegistrationOpen(s, prog));
  const progAngkatan = (prog.angkatan || '').replace(/\s+/g, ' ').trim().toLowerCase();

  return (
    openProgSchedules.find((s) => (s.angkatan || '').replace(/\s+/g, ' ').trim().toLowerCase() === progAngkatan) ||
    openProgSchedules[0] ||
    progSchedules.find((s) => (s.angkatan || '').replace(/\s+/g, ' ').trim().toLowerCase() === progAngkatan) ||
    progSchedules[0] ||
    allSchedules[0] ||
    CLASS_SCHEDULES[0]
  );
}

/**
 * Mengambil label Angkatan dari sebuah RegistrationRecord secara konsisten.
 */
export function getRegistrationAngkatanLabel(
  reg: Pick<RegistrationRecord, 'selectedProgramName' | 'selectedScheduleSummary' | 'selectedScheduleId' | 'selectedProgramId'>,
  schedules: ClassSchedule[] = CLASS_SCHEDULES,
  programs: ProgramTrack[] = PROGRAM_TRACKS
): string {
  const fromProgName = reg.selectedProgramName?.match(/(Angkatan\s*\d+)/i)?.[1];
  if (fromProgName) return fromProgName.replace(/\s+/g, ' ').trim();
  const fromSummary = reg.selectedScheduleSummary?.match(/(Angkatan\s*\d+)/i)?.[1];
  if (fromSummary) return fromSummary.replace(/\s+/g, ' ').trim();
  const sch = schedules.find((s) => s.id === reg.selectedScheduleId);
  if (sch?.angkatan?.trim()) return sch.angkatan.replace(/\s+/g, ' ').trim();
  const prog = programs.find((p) => p.id === (reg.selectedProgramId || sch?.programId));
  return prog?.angkatan?.replace(/\s+/g, ' ').trim() || 'Angkatan 1';
}

/**
 * Mengecek apakah peserta sudah terdaftar di level dan angkatan yang sama.
 */
export function findExistingBatchEnrollment(
  registrations: RegistrationRecord[],
  programId: string,
  targetAngkatan: string,
  schedules: ClassSchedule[] = CLASS_SCHEDULES,
  programs: ProgramTrack[] = PROGRAM_TRACKS
): RegistrationRecord | undefined {
  const normAngkatan = (targetAngkatan || 'Angkatan 1').replace(/\s+/g, ' ').trim().toLowerCase();
  return registrations.find((r) => {
    if (!r || r.selectedProgramId !== programId) return false;
    const regAngkatan = getRegistrationAngkatanLabel(r, schedules, programs).toLowerCase();
    return regAngkatan === normAngkatan;
  });
}

/**
 * Mengembalikan jadwal terbuka di angkatan yang belum pernah didaftari oleh peserta pada level tersebut.
 * Mengembalikan null jika semua angkatan yang terbuka sudah didaftari (atau semua jadwal ditutup).
 */
export function getNextAvailableOpenScheduleForProgram(
  prog: ProgramTrack,
  allSchedules: ClassSchedule[],
  existingRegistrations: RegistrationRecord[],
  allPrograms: ProgramTrack[] = PROGRAM_TRACKS
): ClassSchedule | null {
  const progSchedules = allSchedules.filter((s) => s.programId === prog.id);
  const openProgSchedules = progSchedules.filter((s) => isScheduleRegistrationOpen(s, prog));
  if (openProgSchedules.length === 0) return null;

  const progAngkatan = (prog.angkatan || 'Angkatan 1').replace(/\s+/g, ' ').trim().toLowerCase();
  const unjoinedOpen = openProgSchedules.filter((sch) => {
    const schAngkatan = sch.angkatan?.trim() || prog.angkatan || 'Angkatan 1';
    return !findExistingBatchEnrollment(
      existingRegistrations,
      prog.id,
      schAngkatan,
      allSchedules,
      allPrograms
    );
  });

  if (unjoinedOpen.length === 0) return null;
  return (
    unjoinedOpen.find(
      (s) => (s.angkatan || '').replace(/\s+/g, ' ').trim().toLowerCase() === progAngkatan
    ) || unjoinedOpen[0]
  );
}





