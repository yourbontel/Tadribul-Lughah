export interface LessonItem {
  title: string;
  desc: string;
  points?: string[];
}

export interface ExampleSentence {
  ar: string;
  tr: string;
  breakdown?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  arabicPrompt?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface VocabularyWord {
  ar: string;
  id: string;
  type: string;
}

export interface WeeklyPekanData {
  pekanNumber: number; // 1 to 12
  moduleIndex: number; // 0, 1, 2, 3
  title: string;
  arabicTitle: string;
  kitabReference: string;
  targetOutcome: string;
  summary: string;
  points: string[];
  rules: string[];
  examples: ExampleSentence[];
  quizzes?: QuizQuestion[];
  vocabularies?: VocabularyWord[];
  youtubeVideoId?: string;
  youtubeTitle?: string;
  youtubeChannel?: string;
}

export interface DetailedModuleData {
  babTitle: string;
  arabicBab: string;
  kitabChapter: string;
  intro: string;
  lessons: LessonItem[];
  rules: string[];
  examples: ExampleSentence[];
  quizzes?: QuizQuestion[];
  vocabularies?: VocabularyWord[];
}

export const LEVEL_1_PEKAN_MAP: Record<number, WeeklyPekanData> = {
  1: {
    pekanNumber: 1,
    moduleIndex: 0,
    title: 'Pekan 1: Muqaddimah & Pengenalan Program Tadribat',
    arabicTitle: 'مُقَدِّمَةُ بَرْنَامَجِ التَّدْرِيبَات وَحَقِيقَةُ اللُّغَةِ العَرَبِيَّةِ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Muqaddimah)",
    youtubeVideoId: 'fC9zKq38_54',
    youtubeTitle: 'Muqaddimah Ilmu Nahwu — Rukun Kalam & Hakikat Bahasa Arab',
    youtubeChannel: 'Kajian Tadribul Lughah Official',
    targetOutcome:
      "Memahami urgensi ilmu Nahwu dalam memahami Al-Qur'an, adab thalabul ilmi, dan menguasai 4 rukun Kalam (Lafadz, Murakkab, Mufid, Bil Wadh'i).",
    summary:
      "Materi khusus Muqaddimah Pengenalan Program Tadribat membahas secara mendalam hakikat bahasa Arab, mengapa ilmu Nahwu wajib dipelajari sebelum membaca kitab gundul, serta batas keabsahan kalimat sempurna (Kalam Mufid) menurut kaidah ulama Nahwu.",
    points: [
      "Pengenalan Silabus Program Tadribul Lughah: Nahwu Level 1–3 & Shorof Level 4 secara berjenjang",
      "Keutamaan mempelajari bahasa Arab (Lisanul Qur'an) untuk menjaga lisan dari Al-Lahnu (kesalahan gramatikal)",
      "Definisi Kalam menurut Ulama Nahwu: Al-Lafzhu (ucapan suara berhuruf), Al-Murakkabu (tersusun minimal 2 kata), Al-Mufidu (memberi faedah sempurna), dan Bil Wadh'i (mengikuti pola bahasa Arab)",
      "Perbedaan mendasar antara Al-Qaul (tuturan umum), Al-Kalimah (kata tunggal), Al-Kalam (kalimat sempurna), dan Al-Kalam Al-Majazi",
      "Adab dan kedisiplinan belajar di kelas malam online 20.00 – 22.00 WIB"
    ],
    rules: [
      "Definisi Kalam: هُوَ اللَّفْظُ الْمُرَكَّبُ الْمُفِيدُ بِالْوَضْعِ (Kalam adalah ucapan yang tersusun, memberi faedah sempurna kepada pendengar, dan sesuai kaidah bangsa Arab).",
      "Rukun Kalam ada 4: 1. Lafadz (harus disuarakan dengan huruf hijaiyah), 2. Murakkab (minimal terdiri dari 2 kata atau lebih), 3. Mufid (maknanya tuntas sehingga pendengar dan pembicara merasa cukup tanpa menunggu), 4. Bil Wadh'i (menggunakan bahasa Arab fusha).",
      "Jika suatu ungkapan belum mufid (seperti 'Jika Zaid berdiri...'), maka belum sah dinamakan Kalam menurut istilah ilmu Nahwu."
    ],
    examples: [
      {
        ar: 'قَامَ زَيْدٌ',
        tr: 'Zaid telah berdiri.',
        breakdown: 'Sah sebagai Kalam Mufid karena tersusun dari dua kata (Fi\'il Madhi dan Fa\'il) dan memberi faedah pemahaman sempurna.'
      },
      {
        ar: 'العِلْمُ نُورٌ',
        tr: 'Ilmu itu adalah cahaya.',
        breakdown: 'Sah sebagai Kalam Mufid (Jumlah Ismiyyah: Mubtada\' dan Khobar) yang tuntas maknanya.'
      },
      {
        ar: 'إِنْ قَامَ زَيْدٌ... (Bukan Kalam)',
        tr: 'Jika Zaid berdiri... (Belum sempurna maknanya)',
        breakdown: 'Bukan Kalam Mufid menurut ahli Nahwu, karena maknanya masih menggantung dan pendengar menantikan jawab syaratnya.'
      }
    ],
    quizzes: [
      {
        id: 1,
        question: 'Menurut materi Muqaddimah, manakah empat rukun agar suatu ungkapan sah disebut Kalam?',
        options: [
          'Lafadz, Murakkab, Mufid, dan Bil Wadh\'i',
          'Harus berbahasa asing, panjang, dan bersajak',
          'Cukup satu kata saja tanpa suara',
          'Tersusun dari huruf tanpa perlu makna tuntas'
        ],
        correctIndex: 0,
        explanation: 'Empat pilar Kalam dalam Muqaddimah Nahwu adalah: Al-Lafzhu, Al-Murakkabu, Al-Mufidu, dan Bil Wadh\'i.'
      },
      {
        id: 2,
        question: 'Mengapa ungkapan "إِنْ جَاءَ مُحَمَّدٌ" (Jika Muhammad datang) belum sah dinamakan Kalam?',
        options: [
          'Karena tidak menggunakan huruf hijaiyah',
          'Karena belum Mufid (maknanya masih menggantung bagi pendengar)',
          'Karena Muhammad adalah nama orang',
          'Karena terdiri lebih dari satu kata'
        ],
        correctIndex: 1,
        explanation: 'Ungkapan bersyarat yang belum memiliki jawab syarat belum memberi faedah tuntas (ghairu mufid).'
      }
    ],
    vocabularies: [
      { ar: 'كَلَامٌ', id: 'Kalimat berfaedah sempurna', type: 'Isim' },
      { ar: 'لَفْظٌ', id: 'Ucapan bersuara dengan huruf', type: 'Isim' },
      { ar: 'مُرَكَّبٌ', id: 'Susunan kalimat berangkai', type: 'Isim' },
      { ar: 'مُفِيدٌ', id: 'Memberikan faedah pemahaman', type: 'Isim' },
      { ar: 'مُقَدِّمَةٌ', id: 'Pengantar / Muqaddimah', type: 'Isim' },
      { ar: 'تَدْرِيبَاتٌ', id: 'Latihan-latihan terapan', type: 'Isim' }
    ]
  },
  2: {
    pekanNumber: 2,
    moduleIndex: 0,
    title: 'Pekan 2: Pembagian Kata (Isim, Fi\'il, dan Huruf)',
    arabicTitle: 'أَقْسَامُ الكَلَامِ: الاِسْمُ وَالفِعْلُ وَالحَرْفُ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 1: Aqsamul Kalam)",
    youtubeVideoId: '7X1gX0C8VjA',
    youtubeTitle: 'Pembagian Kalam: Isim, Fi\'il, dan Huruf (Aqsamul Kalam)',
    youtubeChannel: 'Kajian Tadribul Lughah Official',
    targetOutcome:
      "Mampu mengidentifikasi dan memilah setiap kata dalam teks Arab ke dalam 3 unsur: Isim, Fi'il, atau Huruf.",
    summary:
      "Materi pekan ke-2 membedah tiga unsur pembentuk bahasa Arab. Setiap kata tanpa kecuali pasti masuk dalam salah satu dari tiga pilar ini: Isim (nama/sifat), Fi'il (kata kerja berdimensi waktu), atau Huruf (kata tugas penghubung).",
    points: [
      "Isim (اسم): Kata yang menunjukkan makna mandiri tanpa terikat dengan waktu",
      "Fi'il (فعل): Kata yang menunjukkan terjadinya perbuatan dan terikat dengan waktu (lampau, sekarang, atau masa depan)",
      "Huruf (حرف): Kata tugas yang maknanya baru muncul saat disandingkan dengan kata lain",
      "Teknik cepat membedakan isim dan fi'il pada ayat Al-Qur'an"
    ],
    rules: [
      "Pembagian Kata hanya ada 3: وَأَقْسَامُهُ ثَلَاثَةٌ: اسْمٌ، وَفِعْلٌ، وَحَرْفٌ جَاءَ لِمَعْنًى.",
      "Isim tidak memiliki dimensi waktu (contoh: بَيْتٌ, قَلَمٌ, عَالِمٌ).",
      "Fi'il terbagi tiga: Madhi (lampau), Mudhari' (sekarang/akan datang), dan Amr (perintah).",
      "Huruf tidak memiliki tanda isim maupun fi'il, dan berfungsi menghubungkan makna (contoh: فِي, عَلَى, مِنْ, هَلْ)."
    ],
    examples: [
      {
        ar: 'ذَهَبَ عَلِيٌّ إِلَى الْمَسْجِدِ',
        tr: 'Ali telah pergi ke masjid.',
        breakdown: 'ذَهَبَ = Fi\'il (kata kerja lampau), عَلِيٌّ = Isim (nama orang), إِلَى = Huruf (kata tugas), الْمَسْجِدِ = Isim (tempat).'
      },
      {
        ar: 'يَقْرَأُ التِّلْمِيذُ كِتَابًا',
        tr: 'Murid itu sedang membaca buku.',
        breakdown: 'يَقْرَأُ = Fi\'il Mudhari\', التِّلْمِيذُ = Isim, كِتَابًا = Isim.'
      }
    ],
    quizzes: [
      {
        id: 1,
        question: 'Pada kalimat "كَتَبَ زَيْدٌ فِي الدَّفْتَرِ", kata manakah yang merupakan Huruf?',
        arabicPrompt: 'كَتَبَ زَيْدٌ فِي الدَّفْتَرِ',
        options: ['كَتَبَ', 'زَيْدٌ', 'فِي', 'الدَّفْتَرِ'],
        correctIndex: 2,
        explanation: 'فِي (fii) adalah huruf jar yang berfungsi sebagai kata tugas penghubung keterangan tempat.'
      }
    ],
    vocabularies: [
      { ar: 'اسْمٌ', id: 'Kata benda / sifat', type: 'Isim' },
      { ar: 'فِعْلٌ', id: 'Kata kerja', type: 'Isim' },
      { ar: 'حَرْفٌ', id: 'Kata tugas penghubung', type: 'Isim' },
      { ar: 'كِتَابٌ', id: 'Buku / kitab', type: 'Isim' }
    ]
  },
  3: {
    pekanNumber: 3,
    moduleIndex: 0,
    title: 'Pekan 3: Karakteristik & Tanda-Tanda Isim',
    arabicTitle: 'عَلَامَاتُ الاِسْمِ (الخَفْضُ، التَّنْوِينُ، الأَلِفُ وَاللَّامُ، وَحُرُوفُ الجَرِّ)',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 2: 'Alamatul Ismi)",
    youtubeVideoId: '9k1GgM2Y8oE',
    youtubeTitle: 'Karakteristik & Tanda-Tanda Isim (Al-Khafdh, Tanwin, Alif Lam)',
    youtubeChannel: 'Kajian Tadribul Lughah Official',
    targetOutcome:
      "Mampu mendeteksi kata Isim secara cepat menggunakan 4 tanda khas: Khafdh/Kasrah, Tanwin, Alif Lam, dan Huruf Jar.",
    summary:
      "Materi pekan ke-3 mengkaji tanda pengenal mutlak kata Isim. Jika sebuah kata menerima salah satu dari 4 tanda ini, maka kata tersebut dipastikan adalah Isim dan tidak mungkin Fi'il atau Huruf.",
    points: [
      "Tanda 1: Al-Khafdh / Al-Kasrah (خَفْضٌ / كَسْرَةٌ)",
      "Tanda 2: At-Tanwin (تَنْوِينٌ: dhammahtain, fathahtain, kasrahtain)",
      "Tanda 3: Dihubungkan dengan Alif Lam (الأَلِفُ وَاللَّامُ)",
      "Tanda 4: Didahului oleh Huruf-huruf Jar (مِنْ, إِلَى, عَنْ, عَلَى, فِي, رُبَّ, البَاء, الكَاف, اللَّام)",
      "Kaidah larangan bertemunya Alif Lam dan Tanwin pada satu kata"
    ],
    rules: [
      "Kaidah 'Alamatul Isim: فَالاسْمُ يُعْرَفُ بِالْخَفْضِ، وَالتَّنْوِينِ، وَدُخُولِ الأَلِفِ وَاللاَّمِ، وَحُرُوفِ الْخَفْضِ.",
      "Hukum Alif Lam & Tanwin: Tanwin dan Alif Lam tidak boleh berkumpul pada satu isim secara bersamaan (Kaidah: لَا يَجْتَمِعُ الأَلِفُ وَاللَّامُ مَعَ التَّنْوِينِ)."
    ],
    examples: [
      {
        ar: 'مَرَرْتُ بِرَجُلٍ صَالِحٍ',
        tr: 'Saya telah berpapasan dengan seorang laki-laki shalih.',
        breakdown: 'رَجُلٍ adalah isim karena didahului huruf jar (بِـ), berharakat kasrah (khafdh), dan ber-tanwin.'
      },
      {
        ar: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        tr: 'Segala puji bagi Allah, Rabb semesta alam.',
        breakdown: 'الْحَمْدُ adalah isim karena diawali Alif Lam (ال).'
      }
    ],
    quizzes: [
      {
        id: 1,
        question: 'Manakah penulisan kata yang SALAH menurut kaidah Isim?',
        options: ['الْكِتَابُ', 'كِتَابٌ', 'الْكِتَابٌ', 'كِتَابًا'],
        correctIndex: 2,
        explanation: 'Alif Lam dan Tanwin tidak boleh berkumpul pada satu kata (الْكِتَابٌ adalah salah).'
      }
    ],
    vocabularies: [
      { ar: 'خَفْضٌ', id: 'Harakat kasrah / jar', type: 'Isim' },
      { ar: 'تَنْوِينٌ', id: 'Harakat ganda penanda nakirah', type: 'Isim' },
      { ar: 'أَلِفٌ وَلَامٌ', id: 'Huruf Alif Lam ma\'rifah', type: 'Isim' },
      { ar: 'جَرٌّ', id: 'Kondisi i\'rab kasrah', type: 'Isim' }
    ]
  },
  4: {
    pekanNumber: 4,
    moduleIndex: 1,
    title: 'Pekan 4: Isim Shahih, Maqshur, Manqush, dan Mamdud',
    arabicTitle: 'بِنْيَةُ الاِسْمِ: الصَّحِيحُ، المَقْصُورُ، المَنْقُوصُ، وَالمَمْدُودُ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 4)",
    targetOutcome: 'Mengenal struktur huruf akhir isim untuk menentukan kaidah penulisan dan tanda harakat.',
    summary: 'Materi pekan ke-4 mengklasifikasikan kata isim berdasarkan jenis huruf penutupnya.',
    points: ['Isim Shahih', 'Isim Maqshur berakhiran Alif Lazimah', 'Isim Manqush berakhiran Ya Lazimah', 'Isim Mamdud berakhiran Hamzah setelah Alif'],
    rules: ['Isim Shahih menerima harakat dhahirah.', 'Isim Maqshur harakatnya ditakdirkan di atas alif.'],
    examples: [{ ar: 'جَاءَ الفَتَى وَالقَاضِي', tr: 'Pemuda itu dan sang hakim telah datang.' }]
  },
  5: {
    pekanNumber: 5,
    moduleIndex: 1,
    title: 'Pekan 5: Isim Mudzakkar (Maskulin)',
    arabicTitle: 'الاِسْمُ المُذَكَّرُ (الحَقِيقِيُّ وَالمَجَازِيُّ)',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 5)",
    targetOutcome: 'Memahami kaidah isim maskulin dan penyesuaian kata tunjuk serta kata sifat.',
    summary: 'Materi pekan ke-5 mengupas isim mudzakkar haqiqi dan majazi.',
    points: ['Mudzakkar haqiqi untuk manusia/hewan jantan', 'Mudzakkar majazi untuk benda mati'],
    rules: ['Bentuk dasar isim dalam bahasa Arab adalah mudzakkar.'],
    examples: [{ ar: 'هَذَا رَجُلٌ كَرِيمٌ', tr: 'Ini adalah seorang pria yang mulia.' }]
  },
  6: {
    pekanNumber: 6,
    moduleIndex: 1,
    title: 'Pekan 6: Isim Mu\'annats (Feminin) & Tanda-Tandanya',
    arabicTitle: 'الاِسْمُ المُؤَنَّثُ وَعَلَامَاتُ التَّأْنِيثِ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 6)",
    targetOutcome: 'Mampu mendeteksi isim mu\'annats melalui ta\' marbuthah, alif maqshurah, alif mamdudah, dan makna sima\'i.',
    summary: 'Materi pekan ke-6 mengupas tanda feminin gramatikal pada kata isim.',
    points: ['Ta\' Marbuthah (ـة)', 'Alif Maqshurah (ـى)', 'Alif Mamdudah (ـاء)', 'Mu\'annats Majazi (Matahari, bumi, anggota badan berpasangan)'],
    rules: ['Kata benda muannats menggunakan isim isyarah هَذِهِ dan sifat muannats.'],
    examples: [{ ar: 'هَذِهِ مَدْرَسَةٌ كَبِيرَةٌ', tr: 'Ini adalah sekolah yang besar.' }]
  },
  7: {
    pekanNumber: 7,
    moduleIndex: 2,
    title: 'Pekan 7: Isim Mufrad & Mutsanna (Dua)',
    arabicTitle: 'العَدَدُ: المُفْرَدُ وَالمُثَنَّى وَطَرِيقَةُ صِيَاغَتِهِ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 7)",
    targetOutcome: 'Mampu mengubah isim mufrad menjadi mutsanna dengan rumus alif-nun atau ya-nun.',
    summary: 'Materi pekan ke-7 mempelajari pembentukan bilangan ganda dalam bahasa Arab.',
    points: ['Mufrad = tunggal', 'Mutsanna = ditambah alif-nun (ـَانِ) atau ya-nun (ـَيْنِ)'],
    rules: ['Mutsanna marfu dengan alif, manshub dan majrur dengan ya.'],
    examples: [{ ar: 'حَضَرَ الطَّالِبَانِ الِاثْنَانِ', tr: 'Dua orang mahasiswa telah hadir.' }]
  },
  8: {
    pekanNumber: 8,
    moduleIndex: 2,
    title: 'Pekan 8: Jamak Mudzakkar Salim, Mu\'annats Salim & Jamak Taksir',
    arabicTitle: 'أَقْسَامُ الجَمْعِ: المُذَكَّرُ السَّالِمُ وَالمُؤَنَّثُ السَّالِمُ وَالتَّكْسِيرُ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 8–9)",
    targetOutcome: 'Membedakan tiga jenis bentuk jamak dan rumus perubahannya.',
    summary: 'Materi pekan ke-8 mengupas tuntas bentuk jamak teratur dan jamak taksir.',
    points: ['Jamak Mudzakkar Salim (+ ون / ين)', 'Jamak Muannats Salim (+ ات)', 'Jamak Taksir (pecah polanya)'],
    rules: ['Jamak Taksir i\'rabnya seperti isim mufrad.'],
    examples: [{ ar: 'صَلَّى الْمُؤْمِنُونَ فِي المَسَاجِدِ', tr: 'Orang-orang mukmin shalat di masjid-masjid.' }]
  },
  9: {
    pekanNumber: 9,
    moduleIndex: 2,
    title: 'Pekan 9: Isim Nakirah & 6 Macam Isim Ma\'rifah',
    arabicTitle: 'التَّعْيِينُ: النَّكِرَةُ وَأَقْسَامُ المَعْرِفَةِ السِّتَّةِ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 10–11)",
    targetOutcome: 'Mampu membedakan kata umum (nakirah) dan kata khusus (ma\'rifah) beserta 6 jenis ma\'rifah.',
    summary: 'Materi pekan ke-9 mengkaji kejelasan penunjukan makna kata.',
    points: ['Isim Dhamir', 'Isim Alam', 'Isim Isyarah', 'Isim Maushul', 'Isim ber-Alif Lam', 'Isim Mudhaf ke ma\'rifah'],
    rules: ['Asal kata isim adalah nakirah sampai dimasuki penanda ma\'rifah.'],
    examples: [{ ar: 'كَتَبْتُ بِقَلَمِ الْمُعَلِّمِ', tr: 'Saya menulis dengan pena guru itu (mudhaf ma\'rifah).' }]
  },
  10: {
    pekanNumber: 10,
    moduleIndex: 3,
    title: 'Pekan 10: Fi\'il Shahih Akhir vs Mu\'tal Akhir',
    arabicTitle: 'الفِعْلُ: الصَّحِيحُ الآخِرِ وَالمُعْتَلُّ الآخِرِ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 12)",
    targetOutcome: 'Mengenal huruf illah pada akhir fi\'il dan pengaruhnya terhadap i\'rab.',
    summary: 'Materi pekan ke-10 mengkaji kata kerja berhuruf illah (waw, alif, ya).',
    points: ['Fi\'il Shahih', 'Fi\'il Mu\'tal akhir alif, wawu, ya'],
    rules: ['Huruf illah di akhir fi\'il terbuang ketika jazm.'],
    examples: [{ ar: 'يَدْعُو الْمُؤْمِنُ رَبَّهُ', tr: 'Seorang mukmin berdoa kepada Tuhannya.' }]
  },
  11: {
    pekanNumber: 11,
    moduleIndex: 3,
    title: 'Pekan 11: Fi\'il Madhi, Mudhari\', dan Amr',
    arabicTitle: 'أَنْوَاعُ الأَفْعَالِ: المَاضِي وَالمُضَارِعُ وَالأَمْرُ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 13–14)",
    targetOutcome: 'Membedakan tiga dimensi waktu kata kerja dan rumus pembentukannya.',
    summary: 'Materi pekan ke-11 mengkaji fi\'il madhi (mabni), mudhari\' (mu\'rab), dan amr (mabni).',
    points: ['Ciri Fi\'il Madhi: Ta Ta\'nits', 'Ciri Fi\'il Mudhari\': Huruf Mudhara\'ah (أنيت)', 'Ciri Fi\'il Amr: Menuntut perbuatan & Ya Mukhatabah'],
    rules: ['Fi\'il Madhi asalnya mabni fathah, Fi\'il Amr asalnya mabni sukun.'],
    examples: [{ ar: 'اكْتُبْ دَرْسَكَ يَا زَيْدُ', tr: 'Tulislah pelajaranmu wahai Zaid!' }]
  },
  12: {
    pekanNumber: 12,
    moduleIndex: 3,
    title: 'Pekan 12: Pengenalan 4 Keadaan I\'rab',
    arabicTitle: 'مَبَادِئُ الإِعْرَابِ: الرَّفْعُ، النَّصْبُ، الخَفْضُ، وَالجَزْمُ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 15)",
    targetOutcome: 'Menguasai 4 gerbang utama I\'rab dalam tata bahasa Arab sebagai persiapan naik ke Level 2.',
    summary: 'Materi pekan ke-12 mengkaji puncak ilmu Nahwu: konsep perubahan harakat akhir (I\'rab).',
    points: ['Rafa\' (dhommah/pengganti)', 'Nashab (fathah/pengganti)', 'Khafdh/Jar (kasrah/pengganti)', 'Jazm (sukun/pengganti)'],
    rules: ['Isim menerima rafa, nashab, dan jar (tidak ada jazm). Fiil menerima rafa, nashab, dan jazm (tidak ada jar).'],
    examples: [{ ar: 'يَجْلِسُ زَيْدٌ فِي المَسْجِدِ', tr: 'Zaid sedang duduk di dalam masjid.' }]
  }
};

export const CUSTOM_MATERI_STORAGE_KEY = 'tadribul_lughah_custom_materi_v1';

export function extractYouTubeId(input: string): string {
  if (!input) return 'fC9zKq38_54';
  const trimmed = input.trim();
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  if (match && match[1]) {
    return match[1];
  }
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed || 'fC9zKq38_54';
}

export function getAllCustomMateriOverrides(): Record<string, WeeklyPekanData> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CUSTOM_MATERI_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCustomMateriOverride(
  programId: string,
  pekanNumber: number,
  data: WeeklyPekanData
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getAllCustomMateriOverrides();
    const key = `${programId}-pekan-${pekanNumber}`;
    current[key] = {
      ...data,
      pekanNumber,
      youtubeVideoId: extractYouTubeId(data.youtubeVideoId || '')
    };
    localStorage.setItem(CUSTOM_MATERI_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('materi-updated'));
  } catch (err) {
    console.error('Failed to save custom materi override:', err);
  }
}

export function resetCustomMateriOverride(
  programId: string,
  pekanNumber: number
): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getAllCustomMateriOverrides();
    const key = `${programId}-pekan-${pekanNumber}`;
    delete current[key];
    localStorage.setItem(CUSTOM_MATERI_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('materi-updated'));
  } catch (err) {
    console.error('Failed to reset custom materi override:', err);
  }
}

export function getWeeklyPekanContent(
  programId: string,
  pekanNumber: number
): WeeklyPekanData {
  const safePekan = Math.max(1, Math.min(12, pekanNumber || 1));
  const safeProgId = programId || 'tl-level-1';
  const key = `${safeProgId}-pekan-${safePekan}`;

  // Check if superadmin has saved custom overrides for this pekan
  const overrides = getAllCustomMateriOverrides();
  if (overrides[key]) {
    return overrides[key];
  }

  if (safeProgId === 'tl-level-1') {
    if (LEVEL_1_PEKAN_MAP[safePekan]) {
      return LEVEL_1_PEKAN_MAP[safePekan];
    }
  }

  // Fallback for Level 2, 3, 4 with authentic level-specific contents
  const modIdx = Math.floor((safePekan - 1) / 3);
  const titlesLevel2 = [
    'Marfu\'atul Asma & Fa\'il (Pekan 1)',
    'Naibul Fa\'il (Pekan 2)',
    'Pendalaman Subjek Kalimat (Pekan 3)',
    'Mubtada\' dan Khobar (Pekan 4)',
    'Amil Nawasikh: Kaana (Pekan 5)',
    'Amil Nawasikh: Inna (Pekan 6)',
    'Maf\'ul Bih (Pekan 7)',
    'Maf\'ul Fih / Zhorof (Pekan 8)',
    'Haal dan Tamyiz (Pekan 9)',
    'Isim Majrur & Idhafah (Pekan 10)',
    'At-Tawabi\': Na\'at & Athaf (Pekan 11)',
    'At-Tawabi\': Taukid & Badal (Pekan 12)'
  ];

  const titlesLevel4 = [
    'Wazan Tsulatsi Mujarrad Bab 1–2 (Pekan 1)',
    'Wazan Tsulatsi Mujarrad Bab 3–4 (Pekan 2)',
    'Wazan Tsulatsi Mujarrad Bab 5–6 (Pekan 3)',
    'Tashrif Tsulatsi Mazid bi Harfin (Pekan 4)',
    'Tashrif Tsulatsi Mazid bi Harfain (Pekan 5)',
    'Tashrif Tsulatsi Mazid bi Tsalatsah (Pekan 6)',
    'Fi\'il Bina\' Mitsal (Pekan 7)',
    'Fi\'il Bina\' Ajwaf (Pekan 8)',
    'Fi\'il Bina\' Naqis (Pekan 9)',
    'Tashrif Lughawi 14 Dhamir (Pekan 10)',
    'Teknik Membuka Kamus Al-Munawwir (Pekan 11)',
    'Ujian Komprehensif Tashrif (Pekan 12)'
  ];

  const title =
    programId === 'tl-level-4'
      ? titlesLevel4[safePekan - 1] || `Pekan ${safePekan}: Kajian Ilmu Shorof`
      : titlesLevel2[safePekan - 1] || `Pekan ${safePekan}: Pembahasan Materi Level`;

  return {
    pekanNumber: safePekan,
    moduleIndex: modIdx,
    title: `Pekan ${safePekan}: ${title}`,
    arabicTitle: `دِرَاسَةُ الأُسْبُوعِ ${safePekan} · بَرْنَامَجُ تَدْرِيبِ اللُّغَةِ`,
    kitabReference: programId === 'tl-level-4' ? 'Al-Amtsilah At-Tashrifiyyah' : 'Al-Ajurrumiyyah & Mukhtashar Jiddan',
    youtubeVideoId: 'fC9zKq38_54',
    youtubeTitle: `Video Pembahasan Materi ${title}`,
    youtubeChannel: 'Tadribul Lughah Official',
    targetOutcome: `Mampu menguasai materi pekan ke-${safePekan} secara terfokus dan mengaplikasikannya di kelas malam.`,
    summary: `Materi khusus Pekan ke-${safePekan} berfokus pada ${title} dengan pendalaman kaidah, contoh terapan, dan latihan mandiri.`,
    points: [
      `Fokus bahasan khusus Pekan ${safePekan}`,
      'Penerapan kaidah tata bahasa pada teks Arab',
      'Latihan mandiri sebelum sesi live Zoom malam hari'
    ],
    rules: [
      `Kaidah utama Pekan ${safePekan}: Memahami kedudukan kata dan harakat akhir secara presisi.`
    ],
    examples: [
      {
        ar: 'تَعَلَّمْ فَإِنَّ العِلْمَ زَيْنٌ لِأَهْلِهِ',
        tr: 'Belajarlah, sesungguhnya ilmu adalah perhiasan bagi pemiliknya.'
      }
    ],
    vocabularies: [
      { ar: 'دَرْسٌ', id: 'Pelajaran', type: 'Isim' },
      { ar: 'أُسْبُوعٌ', id: 'Pekan / Minggu', type: 'Isim' }
    ]
  };
}

export function getProgramPekanList(programId: string): WeeklyPekanData[] {
  const result: WeeklyPekanData[] = [];
  for (let i = 1; i <= 12; i++) {
    result.push(getWeeklyPekanContent(programId, i));
  }
  return result;
}
