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
  registeredAt: string;
  status: 'Terverifikasi — Menunggu Orientasi' | 'Menunggu Konfirmasi Pembayaran';
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
    sessionsCount: 22,
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
    enrolled: 18,
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
    enrolled: 19,
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
    enrolled: 16,
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
    enrolled: 20,
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
    selectedProgramName: 'Tadribul Lughah Level 1 — Nahwu Dasar (Al-Mabadi’ An-Nahwiyyah)',
    selectedScheduleId: 'sch-lv1-malam',
    selectedScheduleSummary: 'TL-LV1-MLM · Kamis & Jumat (20.00 – 22.00 WIB) · Online',
    learningGoal: 'Membangun pondasi Nahwu dari nol agar memahami struktur ayat Al-Qur’an.',
    totalTuitionIDR: 510000,
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

export function saveProgramRegistrationOpenState(
  programId: string,
  isOpen: boolean
): void {
  try {
    const current = getStoredRegistrationOpenMap();
    current[programId] = isOpen;
    localStorage.setItem(REG_OPEN_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage write errors
  }
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

export function saveProgramAngkatanState(
  programId: string,
  angkatan: string
): void {
  try {
    const current = getStoredAngkatanMap();
    current[programId] = angkatan.trim() || 'Angkatan 1';
    localStorage.setItem(ANGKATAN_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage write errors
  }
}

export function applyRegistrationOpenOverrides(
  tracks: ProgramTrack[]
): ProgramTrack[] {
  const regMap = getStoredRegistrationOpenMap();
  const angkatanMap = getStoredAngkatanMap();
  return tracks.map((t) => ({
    ...t,
    registrationOpen:
      typeof regMap[t.id] === 'boolean'
        ? regMap[t.id]
        : t.registrationOpen !== false,
    angkatan:
      typeof angkatanMap[t.id] === 'string' && angkatanMap[t.id].trim()
        ? angkatanMap[t.id]
        : t.angkatan || 'Angkatan 1'
  }));
}


