import { LEVEL_1_MATERI_TABLE } from './arabicAcademyData';

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
  points?: number; // Bobot nilai per soal (default: 100 / total soal)
}

export interface VocabularyWord {
  ar: string;
  id: string;
  type: string;
}

export interface ScoreGradeInfo {
  arabic: string;
  label: string;
  color: string;
  badgeColor: string;
  borderRing: string;
  desc: string;
}

export function getScoreGradeInfo(score: number): ScoreGradeInfo {
  if (score >= 100) {
    return {
      arabic: 'مُمْتَازٌ مُرْتَفِعٌ',
      label: 'Mumtaz Murtafi\' (Sempurna 100)',
      color: 'text-amber-900 bg-amber-50 border-amber-300',
      badgeColor: 'bg-amber-600 text-white',
      borderRing: 'border-amber-400 ring-2 ring-amber-200',
      desc: 'Maa syaa Allah! Nilai sempurna 100 tanpa kesalahan. Penguasaan kaidah sangat istimewa.'
    };
  }
  if (score >= 85) {
    return {
      arabic: 'مُمْتَازٌ',
      label: 'Mumtaz (Sangat Memuaskan / A)',
      color: 'text-emerald-950 bg-emerald-50 border-emerald-300',
      badgeColor: 'bg-emerald-700 text-white',
      borderRing: 'border-emerald-400 ring-2 ring-emerald-200',
      desc: 'Barakallahu fiik! Pemahaman kaidah dan penguasaan materi sangat baik.'
    };
  }
  if (score >= 75) {
    return {
      arabic: 'جَيِّدٌ جِدًّا',
      label: 'Jayyid Jiddan (Sangat Baik / B+)',
      color: 'text-teal-950 bg-teal-50 border-teal-300',
      badgeColor: 'bg-teal-700 text-white',
      borderRing: 'border-teal-400 ring-2 ring-teal-200',
      desc: 'Alhamdulillah, capaian sangat baik dan tuntas melampaui batas KKM.'
    };
  }
  if (score >= 70) {
    return {
      arabic: 'جَيِّدٌ',
      label: 'Jayyid (Baik / Lulus KKM)',
      color: 'text-blue-950 bg-blue-50 border-blue-300',
      badgeColor: 'bg-blue-700 text-white',
      borderRing: 'border-blue-400 ring-2 ring-blue-200',
      desc: 'Memenuhi Kriteria Ketuntasan Minimal (KKM 70). Pertahankan dan terus tingkatkan!'
    };
  }
  if (score >= 50) {
    return {
      arabic: 'مَقْبُولٌ',
      label: 'Maqbul (Cukup / Perlu Penguatan)',
      color: 'text-amber-950 bg-amber-50 border-amber-300',
      badgeColor: 'bg-amber-700 text-white',
      borderRing: 'border-amber-300',
      desc: 'Belum mencapai standar KKM (70). Disarankan membaca kembali bab kaidah materi pekanan.'
    };
  }
  return {
    arabic: 'رَاسِبٌ / إِعَادَة',
    label: 'I\'adah (Belum Memenuhi KKM)',
    color: 'text-rose-950 bg-rose-50 border-rose-300',
    badgeColor: 'bg-rose-700 text-white',
    borderRing: 'border-rose-400 ring-2 ring-rose-200',
    desc: 'Nilai di bawah batas kelulusan KKM. Harap pelajari ulang video materi dan rangkuman kaidah.'
  };
}

export interface WeeklyAudioItem {
  id: string;
  title: string;
  arabicTitle?: string;
  driveUrl: string;
  duration?: string;
  notes?: string;
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
  passingScore?: number; // KKM Standar Kelulusan Latihan (default 70)
  vocabularies?: VocabularyWord[];
  videoDriveUrl?: string;
  videoTitle?: string;
  videoInstructor?: string;
  youtubeVideoId?: string;
  youtubeTitle?: string;
  youtubeChannel?: string;
  audioDriveUrl?: string;
  audioTitle?: string;
  audioItems?: WeeklyAudioItem[];
  isUnlocked?: boolean; // Status pembukaan akses materi per pekan oleh Superadmin
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
    youtubeVideoId: '8k1YZS6T2HE',
    youtubeTitle: '_Perkenalan Tadribat_',
    youtubeChannel: 'Aboezza_Official',
    targetOutcome:
      "Memahami urgensi ilmu Nahwu dalam memahami Al-Qur'an, adab thalabul ilmi, dan menguasai 4 rukun Kalam (Lafadz, Murakkab, Mufid, Bil Wadh'i).",
    summary:
      "Video Perkenalan Program Tadribat bersama Ustadz Irham Maulana (Abu Izza) membahas pengantar lengkap Program Bahasa Arab Tadribat Mukhtarot Durusul Lughah: mulai dari ta'aruf pengajar dan profil penulis kitab rujukan Ustadz Aunur Rofiq bin Ghufron, pengenalan dua buku utama (kitab materi Mukhtarot Durusul Lughah dan buku latihan/LKS Tadribat), hingga metode belajar sistematis berjenjang yang berfokus pada kemahiran membaca dan menerjemahkan teks Arab melalui kaidah dasar Nahwu dan Shorof untuk memahami Al-Qur'an, Sunnah, dan kitab para ulama.",
    points: [
      "Ta'aruf pengajar program: Ustadz Irham Maulana (Abu Izza), alumni Fakultas Syariah LIPIA Jakarta & pengampu program Ngopi Syar'i",
      "Pengenalan 2 buku pegangan: kitab materi Mukhtarot Durusul Lughah dan buku LKS latihan Tadribat Mukhtarot Durusul Lughah",
      "Profil penulis kitab rujukan: Ustadz Aunur Rofiq bin Ghufron (alumni Univ. Islam Imam Muhammad bin Saud Riyadh & pengasuh Ponpes Al-Furqon Gresik)",
      "Konsep & jenjang pembelajaran online: disusun sistematis, mudah, sederhana, berjenjang (dasar, menengah, lanjutan), dan kaya latihan terapan",
      "Fokus kemahiran & niat belajar: memprioritaskan kemampuan membaca serta menerjemahkan dengan kaidah Nahwu-Shorof guna memahami Al-Qur'an, Hadits, dan kitab ulama"
    ],
    rules: [
      "Ilmu Nahwu (عِلْمُ النَّحْوِ): kaidah dasar tata bahasa Arab untuk mengetahui keadaan akhir kata dan susunan kalimat agar tepat saat membaca teks Arab.",
      "Ilmu Shorof (عِلْمُ الصَّرْفِ): kaidah dasar perubahan bentuk kata dalam bahasa Arab untuk mengenali akar kata, jenis kata, dan ketepatan makna terjemah.",
      "Keterpaduan Materi & Latihan (مُخْتَارَاتٌ وَتَدْرِيبَاتٌ): pemahaman kaidah Nahwu-Shorof harus diiringi latihan terapan (LKS Tadribat) agar mahir membaca (قِرَاءَةٌ) dan menerjemahkan (تَرْجَمَةٌ).",
      "Jenjang Kemahiran Bertahap: pembelajaran bahasa Arab dibagi menjadi tingkat dasar, menengah, dan lanjutan mulai dari pemula hingga mampu menelaah Al-Qur'an, As-Sunnah, dan kitab ulama."
    ],
    examples: [
      {
        ar: 'تَدْرِيبَاتُ مُخْتَارَاتِ دُرُوسِ اللُّغَةِ العَرَبِيَّةِ',
        tr: 'Latihan-latihan Pilihan Pelajaran Bahasa Arab',
        breakdown: 'Nama resmi dua buku pegangan dan program yang dijelaskan dalam video: Mukhtarot (materi pilihan Nahwu-Shorof) dan Tadribat (lembar kerja latihan santri).'
      },
      {
        ar: 'النَّحْوُ وَالصَّرْفُ أَسَاسُ فَهْمِ القُرْآنِ وَالسُّنَّةِ',
        tr: 'Ilmu Nahwu dan Shorof adalah dasar untuk memahami Al-Qur\'an dan As-Sunnah.',
        breakdown: 'Menggambarkan fokus kurikulum kitab Mukhtarot yang memadukan kaidah Nahwu dan Shorof sebagai bekal memahami sumber ajaran Islam serta kitab ulama.'
      },
      {
        ar: 'أَتَعَلَّمُ اللُّغَةَ العَرَبِيَّةَ لِأَقْرَأَ وَأُتَرْجِمَ',
        tr: 'Saya belajar bahasa Arab agar mampu membaca dan menerjemahkan.',
        breakdown: 'Menegaskan target utama program yang disampaikan pemateri: dari beragam kemahiran bahasa, program ini berfokus pada kemahiran membaca dan menerjemahkan teks Arab.'
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
      { ar: 'مُقَدِّمَةٌ', id: 'Pengantar / Pembukaan', type: 'Isim' },
      { ar: 'تَدْرِيبَاتٌ', id: 'Latihan-latihan terapan', type: 'Isim' },
      { ar: 'مُخْتَارَاتٌ', id: 'Pilihan-pilihan (materi terpilih)', type: 'Isim' },
      { ar: 'تَعَارُفٌ', id: 'Perkenalan', type: 'Isim' },
      { ar: 'قِرَاءَةٌ', id: 'Membaca / Kemahiran membaca', type: 'Isim' },
      { ar: 'تَرْجَمَةٌ', id: 'Terjemahan / Menerjemahkan', type: 'Isim' }
    ]
  },
  2: {
    pekanNumber: 2,
    moduleIndex: 0,
    title: 'Pekan 2: Pembagian Kata (Isim, Fi\'il, dan Huruf)',
    arabicTitle: 'أَقْسَامُ الكَلَامِ: الاِسْمُ وَالفِعْلُ وَالحَرْفُ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 1: Aqsamul Kalam)",
    youtubeVideoId: 'fnhresggtGo',
    youtubeTitle: '_Tadribat Mukhtarat 1_',
    youtubeChannel: 'Aboezza_Official',
    targetOutcome:
      "Mampu mengidentifikasi dan memilah setiap kata dalam teks Arab ke dalam 3 unsur: Isim, Fi'il, atau Huruf.",
    summary:
      "Video Tadribat Mukhtarat 1 bersama Ustadz Irham Maulana (Abu Izza) mengawali materi Bab 1 kitab Mukhtarot dengan motivasi Imam Asy-Syafi'i tentang kedudukan mulia bahasa Arab sebagai kunci memahami Al-Qur'an, As-Sunnah, dan ilmu syar'i, kemudian membahas perbedaan mendasar antara Al-Kalimah (kata) dan Al-Jumlah (kalimat sempurna), serta membedah tiga unsur tunggal penyusun seluruh kata dalam bahasa Arab: Isim (tidak terikat waktu), Fi'il (kata kerja yang terikat waktu telah/sedang/akan), dan Huruf Ma'nawi (kata tugas penghubung makna).",
    points: [
      "Motivasi Imam Asy-Syafi'i (nukilan Ibnu Taimiyah): bahasa Arab adalah bahasa Al-Qur'an & Nabi ﷺ sekaligus kunci memahami ilmu syar'i tanpa putus asa",
      "Perbedaan istilah: Al-Kalimah (الكَلِمَةُ) bermakna kata tunggal dari huruf hijaiyah, sedangkan Al-Jumlah (الجُمْلَةُ) bermakna susunan kata berarti sempurna",
      "Isim (الاِسْمُ): kata bermakna mandiri yang tidak terikat waktu (telah/sedang/akan), meliputi kata benda, nama, sifat, kata ganti, dan tempat",
      "Fi'il (الفِعْلُ): kata kerja yang terikat dimensi waktu (telah lampau maupun sedang/akan dikerjakan), seperti ذَهَبَ – يَذْهَبُ dan رَجَعَ – يَرْجِعُ",
      "Huruf Ma'nawi (الحَرْفُ): kata tugas (bukan huruf hijaiyah) yang maknanya baru jelas saat bersambung dengan Isim atau Fi'il, seperti فِي، إِلَى، مِنْ، عَلَى"
    ],
    rules: [
      "Al-Kalimah vs Al-Jumlah: Al-Kalimah adalah satu kata bermakna yang tersusun dari huruf hijaiyah (مَسْجِدٌ), sedangkan Al-Jumlah adalah rangkaian kata yang memberi pemahaman sempurna.",
      "Pembagian Kata Bahasa Arab: Seluruh kata dalam Al-Qur'an, Hadits, dan kitab Arab hanya terbagi menjadi tiga jenis: Isim (الاِسْمُ), Fi'il (الفِعْلُ), dan Huruf (الحَرْفُ).",
      "Ciri Pembeda Isim & Fi'il: Jika sebuah kata bisa diberi makna 'telah/sedang/akan' maka ia Fi'il; jika tidak terikat waktu maka ia Isim.",
      "Hakikat Huruf Ma'nawi: Huruf kata tugas tidak dapat berdiri sendiri memahamkan pendengar sebelum dirangkaikan dengan Isim atau Fi'il (contoh: فِي، إِلَى، عَلَى، مِنْ، هَلْ، قَدْ)."
    ],
    examples: [
      {
        ar: 'مُحَمَّدٌ ذَهَبَ إِلَى المَسْجِدِ',
        tr: 'Muhammad pergi ke masjid.',
        breakdown: 'Contoh Al-Jumlah (kalimat sempurna) yang tersusun dari 4 kata (Al-Kalimah): مُحَمَّدٌ (Isim), ذَهَبَ (Fi\'il), إِلَى (Huruf), dan المَسْجِدِ (Isim).'
      },
      {
        ar: 'الكِتَابُ — الأَسَدُ — البَيْتُ — شَجَرَةٌ',
        tr: 'Buku — Singa — Rumah — Pohon',
        breakdown: 'Contoh Isim berupa kata benda (benda mati maupun makhluk hidup) karena memiliki makna namun tidak dapat diberi imbuhan waktu telah, sedang, atau akan.'
      },
      {
        ar: 'صَغِيرٌ — كَبِيرٌ — ثَقِيلٌ — هُوَ',
        tr: 'Kecil — Besar — Berat — Dia',
        breakdown: 'Contoh Isim selain kata benda: meliputi kata sifat (صَغِيرٌ، كَبِيرٌ، ثَقِيلٌ) dan kata ganti/dhamir (هُوَ) yang semuanya tidak terikat waktu.'
      },
      {
        ar: 'رَجَعَ / يَرْجِعُ — جَلَسَ / يَجْلِسُ — سَمِعَ / يَسْمَعُ',
        tr: 'Telah/sedang kembali — Telah/sedang duduk — Telah/sedang mendengar',
        breakdown: 'Contoh Fi\'il (kata kerja): bentuk pertama bermakna "telah" (lampau) dan bentuk kedua bermakna "sedang/akan".'
      },
      {
        ar: 'ذَهَبَ / يَذْهَبُ — خَرَجَ / يَخْرُجُ — دَخَلَ / يَدْخُلُ',
        tr: 'Telah/sedang pergi — Telah/sedang keluar — Telah/sedang masuk',
        breakdown: 'Contoh lanjutan pasangan Fi\'il yang menunjukkan perbuatan dan terikat oleh dimensi waktu lampau maupun sekarang/akan datang.'
      },
      {
        ar: 'فِي — إِلَى — عَلَى — مِنْ — هَلْ — قَدْ',
        tr: 'Di dalam — Ke — Di atas — Dari — Apakah — Sungguh',
        breakdown: 'Contoh Huruf Ma\'nawi (kata tugas): tidak berdiri sendiri dalam makna, melainkan berfungsi saat bersambung dengan Isim atau Fi\'il.'
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
      { ar: 'الكَلِمَةُ', id: 'Kata tunggal (susunan huruf hijaiyah bermakna)', type: 'Isim' },
      { ar: 'الجُمْلَةُ', id: 'Kalimat sempurna (susunan beberapa kata)', type: 'Isim' },
      { ar: 'الكِتَابُ', id: 'Buku / Kitab', type: 'Isim' },
      { ar: 'الأَسَدُ', id: 'Singa', type: 'Isim' },
      { ar: 'المَسْجِدُ', id: 'Masjid', type: 'Isim' },
      { ar: 'كَبِيرٌ', id: 'Besar (kata sifat)', type: 'Isim' },
      { ar: 'رَجَعَ', id: 'Telah kembali', type: "Fi'il" },
      { ar: 'جَلَسَ', id: 'Telah duduk', type: "Fi'il" },
      { ar: 'خَرَجَ', id: 'Telah keluar', type: "Fi'il" },
      { ar: 'إِلَى', id: 'Ke / Menuju (kata tugas)', type: 'Huruf' }
    ]
  },
  3: {
    pekanNumber: 3,
    moduleIndex: 0,
    title: 'Pekan 3: Karakteristik & Tanda-Tanda Isim',
    arabicTitle: 'عَلَامَاتُ الاِسْمِ (الخَفْضُ، التَّنْوِينُ، الأَلِفُ وَاللَّامُ، وَحُرُوفُ الجَرِّ)',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 2: 'Alamatul Ismi)",
    youtubeVideoId: 'fvQTM8PDihg',
    youtubeTitle: '_Tadribat Mukhtarat 2_',
    youtubeChannel: 'Aboezza_Official',
    targetOutcome:
      "Mampu mendeteksi kata Isim secara cepat menggunakan 4 tanda khas: Khafdh/Kasrah, Tanwin, Alif Lam, dan Huruf Jar.",
    summary:
      "Video Tadribat Mukhtarat 2 bersama Ustadz Irham Maulana (Abu Izza) diawali dengan nasihat Umar bin Khattab radhiyallahu 'anhu tentang urgensi mempelajari bahasa Arab sebagai bagian dari agama, lalu membahas materi Bab 2 kitab Mukhtarot: pengenalan dasar Ilmu Shorof (perubahan kata dasar menjadi kata jadian), konsep Wazan (ف – ع – ل) beserta tiga pola pokok fi'il tsulatsi (فَعَلَ، فَعِلَ، فَعُلَ), serta teknik membedakan huruf asli dan huruf tambahan guna mencari kata dasar di kamus bahasa Arab seperti Kamus Al-Munawwir.",
    points: [
      "Urgensi bahasa Arab (perkataan Umar bin Khattab r.a.): تَعَلَّمُوا العَرَبِيَّةَ فَإِنَّهَا مِنْ دِينِكُمْ (bagian dari ibadah dan agama seorang muslim)",
      "Pengertian Ilmu Shorof: ilmu tentang perubahan satu kata dasar menjadi berbagai kata jadian/turunan (contoh: عِلْمٌ dan دَرْسٌ)",
      "Konsep Wazan (timbangan/pola dasar) menggunakan 3 huruf pokok: Fa' Fi'il (ف), 'Ain Fi'il (ع), dan Lam Fi'il (ل)",
      "Tiga pola wazan pokok 3 huruf asli berdasarkan harakat 'Ain Fi'il: فَعَلَ (fathah), فَعِلَ (kasrah), dan فَعُلَ (dhammah)",
      "Teknik membedakan huruf asli dan huruf tambahan guna mencari akar kata di Kamus Al-Munawwir (contoh: مَدْرَسَةٌ dicari pada huruf د)"
    ],
    rules: [
      "Definisi Ilmu Shorof: Shorof adalah perubahan bentuk kata dari satu kata dasar menjadi berbagai kata jadian yang mengubah makna turunannya.",
      "Rumus Wazan Tsulatsi: Mayoritas kata dasar Arab tersusun dari 3 huruf asli yang ditimbang dengan pola Fa' Fi'il (ف), 'Ain Fi'il (ع), dan Lam Fi'il (ل).",
      "Tiga Wazan Pokok Kata Kerja Dasar: Pola 1 فَعَلَ (contoh: رَجَعَ، دَرَسَ، جَلَسَ، ذَهَبَ), Pola 2 فَعِلَ (contoh: عَلِمَ، شَرِبَ، سَمِعَ), Pola 3 فَعُلَ (contoh: كَرُمَ، حَسُنَ، شَرُفَ).",
      "Kaidah Pencarian Kamus: Kata jadian yang berimbuhan huruf tambahan (seperti مَدْرَسَةٌ، مَعْلُومٌ، يَجْلِسُ) wajib dikembalikan ke 3 huruf asalnya sebelum dicari di kamus."
    ],
    examples: [
      {
        ar: 'عِلْمٌ ← عَالِمٌ — مَعْلُومٌ — عُلَمَاءُ — تَعْلِيمٌ',
        tr: 'Ilmu ← Orang berilmu — Perkara yang diketahui — Para ulama — Pembelajaran',
        breakdown: 'Contoh perubahan Ilmu Shorof dari 3 huruf asli ع-ل-م: penambahan huruf seperti ا (عَالِمٌ), م dan و (مَعْلُومٌ), serta ت dan ي (تَعْلِيمٌ) melahirkan kata jadian dengan makna baru.'
      },
      {
        ar: 'دَرْسٌ ← مُدَرِّسٌ — دِرَاسَةٌ — مَدْرَسَةٌ — دُرُوسٌ',
        tr: 'Pelajaran ← Pengajar — Pembelajaran — Sekolah — Pelajaran-pelajaran',
        breakdown: 'Contoh kata dasar د-ر-س yang berubah menjadi beragam kata turunan (pelaku, kegiatan, tempat, bentuk jamak) melalui penambahan huruf di awal, tengah, atau akhir kata.'
      },
      {
        ar: 'فَعَلَ: رَجَعَ — دَرَسَ — جَلَسَ — كَتَبَ — سَفَرَ — ذَهَبَ',
        tr: "Pola Fa'ala: Kembali — Belajar — Duduk — Menulis — Bepergian — Pergi",
        breakdown: "Contoh wazan pokok pertama (فَعَلَ) dengan 'Ain Fi'il berharakat fathah; ketiga huruf penyusunnya merupakan huruf asli (Fa' Fi'il, 'Ain Fi'il, Lam Fi'il)."
      },
      {
        ar: 'فَعِلَ: عَلِمَ — شَرِبَ — سَمِعَ — عَمِلَ',
        tr: "Pola Fa'ila: Mengetahui — Minum — Mendengar — Beramal",
        breakdown: "Contoh wazan pokok kedua (فَعِلَ) dengan 'Ain Fi'il berharakat kasrah (tidak dibaca fathah), yang ketetapan harakatnya dirujuk melalui kamus bahasa Arab."
      },
      {
        ar: 'فَعُلَ: كَرُمَ — حَسُنَ — شَرُفَ',
        tr: "Pola Fa'ula: Mulia — Baik — Terhormat",
        breakdown: "Contoh wazan pokok ketiga (فَعُلَ) dengan 'Ain Fi'il berharakat dhammah, yang umumnya menunjukkan makna sifat tetap/karakter."
      },
      {
        ar: 'المَدْرَسَةُ (د – ر – س) ← يَرْجِعُ (ر – ج – ع)',
        tr: 'Sekolah (asal: د-ر-س, tambahan: ال، م، ة) ← Sedang kembali (asal: ر-ج-ع, tambahan: ي)',
        breakdown: 'Penerapan pemilahan huruf asli dan huruf tambahan untuk mencari arti kata di Kamus Al-Munawwir: المَدْرَسَةُ dicari di huruf د, dan يَرْجِعُ dicari di huruf ر.'
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
      { ar: 'عِلْمٌ', id: 'Ilmu / Pengetahuan', type: 'Isim' },
      { ar: 'عَالِمٌ', id: 'Orang yang berilmu / berpengetahuan', type: 'Isim' },
      { ar: 'مَعْلُومٌ', id: 'Perkara yang diketahui', type: 'Isim' },
      { ar: 'دَرْسٌ', id: 'Pelajaran', type: 'Isim' },
      { ar: 'مُدَرِّسٌ', id: 'Pengajar / Guru', type: 'Isim' },
      { ar: 'مَدْرَسَةٌ', id: 'Sekolah / Tempat belajar', type: 'Isim' },
      { ar: 'ذَهَبَ', id: 'Telah pergi (pola فَعَلَ)', type: "Fi'il" },
      { ar: 'سَمِعَ', id: 'Telah mendengar (pola فَعِلَ)', type: "Fi'il" },
      { ar: 'شَرِبَ', id: 'Telah minum (pola فَعِلَ)', type: "Fi'il" },
      { ar: 'كَرُمَ', id: 'Mulia (pola فَعُلَ)', type: "Fi'il" }
    ]
  },
  4: {
    pekanNumber: 4,
    moduleIndex: 1,
    title: 'Pekan 4: Isim Shahih, Maqshur, Manqush, dan Mamdud',
    arabicTitle: 'بِنْيَةُ الاِسْمِ: الصَّحِيحُ، المَقْصُورُ، المَنْقُوصُ، وَالمَمْدُودُ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 4)",
    youtubeVideoId: 'kuw9BKUZEGc',
    youtubeTitle: '_Tadribat Mukhtarat 3_',
    youtubeChannel: 'Aboezza_Official',
    targetOutcome: 'Mengenal struktur huruf akhir isim untuk menentukan kaidah penulisan dan tanda harakat.',
    summary:
      "Video Tadribat Mukhtarat 3 bersama Ustadz Irham Maulana (Abu Izza) diawali dengan kutipan Imam Asy-Syafi'i tentang keutamaan menguasai ilmu Nahwu sebagai kunci memahami seluruh ilmu syar'i, kemudian membedah pembagian Isim ditinjau dari bangunan huruf akhirnya menjadi empat jenis: Isim Maqshur (akhiran alif setelah fathah), Isim Manqush (akhiran ya' setelah kasrah berikut hukum pembuangan ya' saat tanpa ال), Isim Mamdud (akhiran hamzah setelah alif), dan Isim Shahih (selain ketiga jenis tersebut).",
    points: [
      "Mutiara hikmah Imam Asy-Syafi'i & Imam As-Suyuthi: menguasai ilmu Nahwu memudahkan pemahaman seluruh ilmu syar'i (Al-Qur'an, Hadits, Tafsir, dan Fikih)",
      "Isim Maqshur (المَقْصُورُ): isim berakhiran huruf alif tegak (ا) atau bengkok (ى) yang huruf sebelumnya berharakat fathah (contoh: العَصَا, المُرْتَضَى, مُسْتَشْفًى)",
      "Isim Manqush (المَنْقُوصُ): isim berakhiran huruf ya' (ي) setelah kasrah serta kaidah penghilangan ya' menjadi kasrahtain saat tanpa ال pada keadaan rafa'/jar (contoh: القَاضِي ← قَاضٍ)",
      "Isim Mamdud (المَمْدُودُ): isim berakhiran huruf hamzah (ء) yang didahului oleh huruf alif tambahan (contoh: حَمْرَاءُ, سَمَاءٌ, بِنَاءٌ)",
      "Isim Shahih (الصَّحِيحُ): isim terbanyak yang huruf akhirnya bukan alif maqshur, ya' manqush, maupun hamzah mamdud (contoh: نَجْمٌ, فَاطِمَةُ, رِجَالٌ)"
    ],
    rules: [
      "Isim Maqshur (المَقْصُورُ): setiap isim yang diakhiri alif (ا / ى) setelah harakat fathah; jika tanpa ال tetap ditulis alifnya dan dibaca tanwin fathah (seperti عَصًا، مُسْتَشْفًى).",
      "Isim Manqush (المَنْقُوصُ): setiap isim yang diakhiri ya' (ي) setelah harakat kasrah; jika tanpa ال dalam keadaan dhammah/kasrah huruf ya' dibuang dan diganti kasrahtain (قَاضٍ، هَادٍ), sedangkan saat fathah huruf ya' tetap muncul (قَاضِيًا، هَادِيًا).",
      "Isim Mamdud (المَمْدُودُ): setiap isim yang huruf akhirnya hamzah (ء) dan tepat sebelumnya terdapat alif tambahan (contoh: سَمَاءٌ، بِنَاءٌ، حَمْرَاءُ).",
      "Isim Shahih (الصَّحِيحُ): setiap isim yang tidak memenuhi ciri akhir Maqshur, Manqush, maupun Mamdud (contoh: نَجْمٌ، الشَّجَرَةُ، اللَّبَنُ)."
    ],
    examples: [
      {
        ar: 'العَصَا ← عَصًا | المُرْتَضَى ← مُرْتَضًى',
        tr: 'Tongkat — Orang yang diridhai (Isim Maqshur beralif tegak & bengkok)',
        breakdown: 'Keduanya diakhiri huruf alif (tegak pada العَصَا dan bengkok pada المُرْتَضَى) dengan harakat fathah sebelumnya; saat tanpa ال dibaca tanwin fathah dan alif tetap tertulis.'
      },
      {
        ar: 'مُسْتَشْفًى — فَتًى — الدُّنْيَا',
        tr: 'Rumah sakit — Pemuda — Dunia (Isim Maqshur)',
        breakdown: 'Contoh lanjutan Isim Maqshur: فَتًى dan مُسْتَشْفًى dibaca dengan tanwin fathah karena tanpa ال, sedangkan الدُّنْيَا diakhiri alif tegak setelah fathah.'
      },
      {
        ar: 'القَاضِي ← قَاضٍ | الهَادِي ← هَادٍ',
        tr: "Hakim — Pemberi petunjuk (Isim Manqush saat dhammah/kasrah tanpa ال)",
        breakdown: "Diakhiri huruf ي setelah kasrah; ketika ال dibuang dan berkeadaan rafa' (dhammah) atau jar (kasrah), huruf ي dihilangkan lalu diberi kasrahtain."
      },
      {
        ar: 'الدَّاعِي / المُرَبِّي ← دَاعِيًا / مُرَبِّيًا',
        tr: 'Penyeru / Pendidik (Isim Manqush saat nashab/fathah tanpa ال)',
        breakdown: 'Keistimewaan Isim Manqush: ketika berposisi nashab (fathah) meski tanpa ال, huruf ي tidak dibuang melainkan tetap dimunculkan dan difathah-tanwinkan.'
      },
      {
        ar: 'حَمْرَاءُ — سَمَاءٌ — بِنَاءٌ',
        tr: 'Merah — Langit — Bangunan (Isim Mamdud)',
        breakdown: 'Ketiganya disebut Isim Mamdud karena huruf akhirnya adalah hamzah (ء) yang didahului oleh alif tambahan (ا).'
      },
      {
        ar: 'نَجْمٌ — فَاطِمَةُ — الحِصَانُ — الشَّجَرَةُ — اللَّبَنُ — رِجَالٌ',
        tr: 'Bintang — Fatimah — Kuda — Pohon — Susu — Para laki-laki (Isim Shahih)',
        breakdown: "Kelompok isim terbanyak (Isim Shahih) karena tidak diakhiri alif maqshur setelah fathah, ya' manqush setelah kasrah, maupun hamzah mamdud setelah alif."
      }
    ],
    vocabularies: [
      { ar: 'العَصَا', id: 'Tongkat (Isim Maqshur)', type: 'Isim' },
      { ar: 'مُسْتَشْفًى', id: 'Rumah sakit (Isim Maqshur)', type: 'Isim' },
      { ar: 'القَاضِي', id: 'Hakim (Isim Manqush)', type: 'Isim' },
      { ar: 'الهَادِي', id: 'Pemberi petunjuk (Isim Manqush)', type: 'Isim' },
      { ar: 'المُرَبِّي', id: 'Pendidik / Pengasuh (Isim Manqush)', type: 'Isim' },
      { ar: 'سَمَاءٌ', id: 'Langit (Isim Mamdud)', type: 'Isim' },
      { ar: 'بِنَاءٌ', id: 'Bangunan (Isim Mamdud)', type: 'Isim' },
      { ar: 'نَجْمٌ', id: 'Bintang (Isim Shahih)', type: 'Isim' },
      { ar: 'الشَّجَرَةُ', id: 'Pohon (Isim Shahih)', type: 'Isim' },
      { ar: 'اللَّبَنُ', id: 'Susu (Isim Shahih)', type: 'Isim' }
    ]
  },
  5: {
    pekanNumber: 5,
    moduleIndex: 1,
    title: 'Pekan 5: Isim Mudzakkar (Maskulin)',
    arabicTitle: 'الاِسْمُ المُذَكَّرُ (الحَقِيقِيُّ وَالمَجَازِيُّ)',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 5)",
    youtubeVideoId: 'oWj7vmvBZ0A',
    youtubeTitle: '_Tadribat Mukhtarat 4_',
    youtubeChannel: 'Aboezza_Official',
    targetOutcome: 'Memahami kaidah isim maskulin dan penyesuaian kata tunjuk serta kata sifat.',
    summary:
      "Video Tadribat Mukhtarat 4 bersama Ustadz Irham Maulana (Abu Izza) membahas Pasal ke-2 kitab Mukhtarot tentang pembagian Isim ditinjau dari jenisnya menjadi Mudzakkar (laki-laki/maskulin) dan Mu'annats (perempuan/feminin). Pembahasan mencakup pembedaan Mudzakkar & Mu'annats Haqiqi (manusia dan hewan) serta Majazi (benda mati), tiga tanda lafazh Mu'annats (ta' marbuthah, alif maqshurah, alif mamdudah), Isim Mu'annats tanpa tanda yang dibuktikan dengan kata tunjuk هَذِهِ (seperti شَمْسٌ dan أَرْضٌ), serta catatan nama laki-laki yang berakhir ta' marbuthah.",
    points: [
      "Penggolongan Isim dari jenisnya: seluruh isim dalam bahasa Arab terbagi menjadi Mudzakkar (maskulin) atau Mu'annats (feminin)",
      "Mudzakkar Haqiqi vs Majazi: Haqiqi untuk manusia/hewan jantan (طَالِبٌ، ثَوْرٌ), sedangkan Majazi untuk benda tak berjenis kelamin (قَلَمٌ، بَابٌ)",
      "Mu'annats Haqiqi vs Majazi: Haqiqi untuk manusia/hewan betina (طَالِبَةٌ، بَقَرَةٌ), sedangkan Majazi untuk benda seperti شَجَرَةٌ dan مَكْتَبَةٌ",
      "Tiga tanda huruf akhir Isim Mu'annats: Ta' Marbuthah (ة), Alif Maqshurah (صُغْرَى، كُبْرَى), dan Alif Mamdudah (حَمْرَاءُ، سَوْدَاءُ)",
      "Mu'annats Sima'i & Pengecualian: kata tanpa tanda namun tetap Mu'annats (شَمْسٌ، أَرْضٌ، نَارٌ memakai هَذِهِ), serta nama laki-laki berakhiran ة (حَمْزَةُ، طَلْحَةُ)"
    ],
    rules: [
      "Isim Mudzakkar (المُذَكَّرُ): terbagi dua yaitu Haqiqi (manusia/hewan jantan seperti رَجُلٌ، ثَوْرٌ) dan Majazi (benda yang digolongkan maskulin seperti كِتَابٌ، كُرْسِيٌّ).",
      "Isim Mu'annats (المُؤَنَّثُ): terbagi dua yaitu Haqiqi (manusia/hewan betina seperti فَاطِمَةُ، بَقَرَةٌ) dan Majazi (benda bertanda feminin seperti سَبُّورَةٌ، سَيَّارَةٌ).",
      "Tiga Tanda Mu'annats & Kata Tunjuk: Ciri utama Mu'annats adalah ة / ى / اء; penyesuaiannya memakai هَذَا untuk Mudzakkar dan هَذِهِ untuk Mu'annats.",
      "Kaidah Khusus: Sebagian kata tanpa tanda tetap Mu'annats secara penggunaan Arab (هَذِهِ شَمْسٌ، هَذِهِ أَرْضٌ), dan nama laki-laki berakhiran ة (مُعَاوِيَةُ، حَمْزَةُ) tetap dihukumi Mudzakkar."
    ],
    examples: [
      {
        ar: 'طَالِبٌ — مُحَمَّدٌ — ثَوْرٌ — رَجُلٌ',
        tr: 'Santri — Muhammad — Sapi jantan — Laki-laki dewasa (Mudzakkar Haqiqi)',
        breakdown: 'Termasuk Mudzakkar Haqiqi karena menunjuk manusia dan hewan yang secara nyata memiliki jenis kelamin laki-laki/jantan.'
      },
      {
        ar: 'الكُرْسِيُّ — قَلَمٌ — كِتَابٌ — بَابٌ',
        tr: 'Kursi — Pena — Buku — Pintu (Mudzakkar Majazi)',
        breakdown: 'Termasuk Mudzakkar Majazi karena bukan manusia/hewan dan tidak berjenis kelamin, tetapi digolongkan sebagai kata maskulin dalam bahasa Arab.'
      },
      {
        ar: 'طَالِبَةٌ — فَاطِمَةُ — بَقَرَةٌ',
        tr: "Santriwati — Fatimah — Sapi betina (Mu'annats Haqiqi)",
        breakdown: "Pasangan feminin dari Mudzakkar Haqiqi (طَالِبٌ ← طَالِبَةٌ، ثَوْرٌ ← بَقَرَةٌ) yang secara hakiki berjenis kelamin perempuan/betina."
      },
      {
        ar: 'شَجَرَةٌ — سَبُّورَةٌ — مَكْتَبَةٌ — سَيَّارَةٌ',
        tr: "Pohon — Papan tulis — Perpustakaan — Mobil (Mu'annats Majazi)",
        breakdown: "Benda mati/tumbuhan yang tidak berjenis kelamin namun digolongkan Mu'annats Majazi karena berakhiran tanda terkuat feminin, yaitu Ta' Marbuthah (ة)."
      },
      {
        ar: 'صُغْرَى — كُبْرَى — حُسْنَى | حَمْرَاءُ — سَوْدَاءُ',
        tr: 'Lebih kecil/besar/terbaik (Alif Maqshurah) | Merah/Hitam (Alif Mamdudah)',
        breakdown: "Contoh Isim Mu'annats selain Ta' Marbuthah: kelompok pertama berakhiran Alif Maqshurah (ى) dan kelompok kedua berakhiran Alif Mamdudah (اء)."
      },
      {
        ar: 'هَذِهِ شَمْسٌ — هَذِهِ أَرْضٌ | حَمْزَةُ — مُعَاوِيَةُ',
        tr: "Ini matahari — Ini bumi (Mu'annats tanpa tanda) | Hamzah — Mu'awiyah (Mudzakkar ber-ة)",
        breakdown: 'شَمْسٌ dan أَرْضٌ tetap memakai هَذِهِ walau tanpa tanda feminin; sebaliknya حَمْزَةُ dan مُعَاوِيَةُ tetap Mudzakkar karena merujuk nama laki-laki meski berakhiran ة.'
      }
    ],
    vocabularies: [
      { ar: 'ثَوْرٌ', id: 'Sapi jantan (Mudzakkar Haqiqi)', type: 'Isim' },
      { ar: 'بَقَرَةٌ', id: "Sapi betina (Mu'annats Haqiqi)", type: 'Isim' },
      { ar: 'قَلَمٌ', id: 'Pena (Mudzakkar Majazi)', type: 'Isim' },
      { ar: 'بَابٌ', id: 'Pintu (Mudzakkar Majazi)', type: 'Isim' },
      { ar: 'سَبُّورَةٌ', id: "Papan tulis (Mu'annats Majazi)", type: 'Isim' },
      { ar: 'مَكْتَبَةٌ', id: "Perpustakaan (Mu'annats Majazi)", type: 'Isim' },
      { ar: 'سَيَّارَةٌ', id: "Mobil (Mu'annats Majazi)", type: 'Isim' },
      { ar: 'شَمْسٌ', id: "Matahari (Mu'annats tanpa tanda)", type: 'Isim' },
      { ar: 'أَرْضٌ', id: "Bumi (Mu'annats tanpa tanda)", type: 'Isim' },
      { ar: 'نَارٌ', id: "Api (Mu'annats tanpa tanda)", type: 'Isim' }
    ]
  },
  6: {
    pekanNumber: 6,
    moduleIndex: 1,
    title: 'Pekan 6: Isim Mu\'annats (Feminin) & Tanda-Tandanya',
    arabicTitle: 'الاِسْمُ المُؤَنَّثُ وَعَلَامَاتُ التَّأْنِيثِ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 6)",
    youtubeVideoId: 'Od2aJ6iENVA',
    youtubeTitle: '_Tadribat Mukhtarat 5_',
    youtubeChannel: 'Aboezza_Official',
    targetOutcome: 'Mampu mendeteksi isim mu\'annats melalui ta\' marbuthah, alif maqshurah, alif mamdudah, dan makna sima\'i.',
    summary:
      "Video Tadribat Mukhtarat 5 bersama Ustadz Irham Maulana (Abu Izza) diawali mutiara hikmah Ibnu Taimiyah bahwa bahasa Arab adalah syiar Islam dan kaum muslimin, lalu mengupas secara mendalam 7 ketentuan tanda Isim Mu'annats beserta pengecualiannya: Ta' Marbuthah, Alif Maqshurah berwazan فُعْلَى dan فَعْلَى, Alif Mamdudah berwazan فَعْلَاءُ (warna/sifat), sifat serta nama khusus wanita, anggota tubuh berpasangan, jamak benda tidak berakal (jamak ghairu 'aqil), serta kata dan sifat tertentu yang boleh dihukumi Mudzakkar maupun Mu'annats.",
    points: [
      "Mutiara hikmah Ibnu Taimiyah (لِسَانُ العَرَبِ شِعَارُ الإِسْلَامِ وَأَهْلِهِ): mempelajari bahasa Arab bagian dari mengagungkan syiar Allah",
      "Ketentuan Ta' Marbuthah (ة): berlaku pada sifat/pelaku (مُدَرِّسٌ ← مُدَرِّسَةٌ), namun nama laki-laki tetap Mudzakkar dan hewan tertentu beda kata (جَمَلٌ ↔ نَاقَةٌ)",
      "Ketentuan Alif Maqshurah (ى): hanya menandai Mu'annats jika sifat berwazan فُعْلَى (صُغْرَى، كُبْرَى) atau فَعْلَى (كَسْلَى، غَضْبَى), bukan kata benda seperti مُسْتَشْفَى",
      "Ketentuan Alif Mamdudah (اء): menandai Mu'annats pada sifat berwazan فَعْلَاءُ dengan alif-hamzah tambahan (حَمْرَاءُ، سَوْدَاءُ), bukan hamzah asli seperti مَاءٌ",
      "Isim Mu'annats tanpa tanda: sifat khusus wanita (حَامِلٌ، حَائِضٌ، أُخْتٌ), anggota tubuh berpasangan (عَيْنٌ، يَدٌ، رِجْلٌ), jamak tak berakal (كُتُبٌ), serta kata netral (صَبُورٌ، طَرِيقٌ)"
    ],
    rules: [
      "Syarat Ta' Marbuthah & Pasangan Alami: ة menandai Mu'annats jika bukan nama laki-laki; pada sebagian hewan pasangan jantan-betinanya memiliki kosakata tersendiri (ثَوْرٌ/بَقَرَةٌ, جَمَلٌ/نَاقَةٌ).",
      "Wazan Alif Maqshurah Mu'annats: Sifat berwazan فُعْلَى (pasangan أَفْعَلُ: أَكْبَرُ ← كُبْرَى) dan فَعْلَى (pasangan فَعْلَانُ: كَسْلَانُ ← كَسْلَى) adalah Mu'annats, sedangkan benda seperti مُسْتَشْفَى tetap Mudzakkar.",
      "Wazan Alif Mamdudah & Sifat Khusus Wanita: Sifat berwazan فَعْلَاءُ (pasangan أَفْعَلُ: أَحْمَرُ ← حَمْرَاءُ) dan sifat khusus wanita (حَامِلٌ، حَائِضٌ، مُرْضِعٌ) termasuk Mu'annats tanpa perlu ة.",
      "Anggota Tubuh Ganda & Jamak Ghairu 'Aqil: Anggota badan berpasangan (عَيْنٌ، أُذُنٌ، يَدٌ، رِجْلٌ) serta jamak benda/hewan/tumbuhan tidak berakal (كُتُبٌ، بُيُوتٌ، أَخْلَاقٌ) dihukumi Mu'annats (memakai هَذِهِ)."
    ],
    examples: [
      {
        ar: 'مُدَرِّسٌ ← مُدَرِّسَةٌ | جَمَلٌ ↔ نَاقَةٌ',
        tr: 'Pak Guru ← Bu Guru | Unta jantan ↔ Unta betina',
        breakdown: "Kata sifat/pelaku cukup ditambah ة untuk menjadi Mu'annats (مُدَرِّسَةٌ), sedangkan nama jenis hewan tertentu memiliki pasangan kata yang berbeda (جَمَلٌ dan نَاقَةٌ, serta ثَوْرٌ dan بَقَرَةٌ)."
      },
      {
        ar: 'أَكْبَرُ ← كُبْرَى | أَحْسَنُ ← حُسْنَى | مُسْتَشْفَى (مُذَكَّرٌ)',
        tr: 'Terbesar (lk/pr) — Terbaik (lk/pr) — Rumah sakit (Mudzakkar)',
        breakdown: "كُبْرَى dan حُسْنَى adalah Mu'annats karena mengikuti wazan فُعْلَى (pasangan أَفْعَلُ); sedangkan مُسْتَشْفَى tetap Mudzakkar walau berakhiran alif maqshurah."
      },
      {
        ar: 'عَطْشَانُ ← عَطْشَى | كَسْلَانُ ← كَسْلَى | غَضْبَانُ ← غَضْبَى',
        tr: 'Haus (lk/pr) — Malas (lk/pr) — Marah (lk/pr)',
        breakdown: "Pasangan sifat berwazan فَعْلَانُ (Mudzakkar) dan فَعْلَى (Mu'annats) yang diakhiri Alif Maqshurah (contoh: رَجُلٌ كَسْلَانُ dan اِمْرَأَةٌ كَسْلَى)."
      },
      {
        ar: 'الحَجَرُ الأَسْوَدُ | الحَبَّةُ السَّوْدَاءُ | مَاءٌ (مُذَكَّرٌ)',
        tr: 'Hajar Aswad (Batu Hitam) | Habbatussauda (Jintan Hitam) | Air (Mudzakkar)',
        breakdown: "الأَسْوَدُ mengikuti sifat الحَجَرُ (Mudzakkar), sedangkan السَّوْدَاءُ (wazan فَعْلَاءُ) mengikuti الحَبَّةُ (Mu'annats); adapun مَاءٌ bukan Mu'annats karena hamzahnya asli."
      },
      {
        ar: 'اِمْرَأَةٌ حَامِلٌ — حَائِضٌ — مُرْضِعٌ | هَذِهِ عَيْنٌ — رِجْلٌ — يَدٌ',
        tr: 'Wanita hamil, haid, menyusui | Ini mata, kaki, tangan',
        breakdown: "Sifat khusus wanita tidak memerlukan ة; demikian pula anggota tubuh yang berpasangan (عَيْنٌ، رِجْلٌ، يَدٌ، أُذُنٌ) otomatis dihukumi Mu'annats."
      },
      {
        ar: 'هَذَا كِتَابٌ ← هَذِهِ كُتُبٌ | أَخْلَاقٌ حَسَنَةٌ | رَجُلٌ وَامْرَأَةٌ صَبُورٌ',
        tr: 'Ini buku ← Ini buku-buku | Akhlak yang baik | Pria/wanita yang penyabar',
        breakdown: "Jamak tidak berakal (كُتُبٌ، أَخْلَاقٌ) berubah hukumnya menjadi Mu'annats; sementara sifat berwazan فَعُولٌ (صَبُورٌ) dan فَعِيلٌ (قَتِيلٌ) berlaku sama bagi Mudzakkar maupun Mu'annats."
      }
    ],
    vocabularies: [
      { ar: 'نَاقَةٌ', id: 'Unta betina (pasangan جَمَلٌ)', type: 'Isim' },
      { ar: 'كُبْرَى', id: "Terbesar / lebih besar (mu'annats أَكْبَرُ)", type: 'Isim' },
      { ar: 'دُنْيَا', id: "Dunia / lebih dekat (mu'annats أَدْنَى)", type: 'Isim' },
      { ar: 'كَسْلَى', id: "Malas (mu'annats كَسْلَانُ)", type: 'Isim' },
      { ar: 'حَمْرَاءُ', id: "Merah (mu'annats أَحْمَرُ)", type: 'Isim' },
      { ar: 'سَوْدَاءُ', id: "Hitam (mu'annats أَسْوَدُ)", type: 'Isim' },
      { ar: 'حَامِلٌ', id: 'Wanita yang hamil (khusus perempuan)', type: 'Isim' },
      { ar: 'عَيْنٌ', id: 'Mata (anggota tubuh berpasangan)', type: 'Isim' },
      { ar: 'كُتُبٌ', id: 'Buku-buku (jamak tidak berakal)', type: 'Isim' },
      { ar: 'صَبُورٌ', id: 'Penyabar (berlaku untuk lk & pr)', type: 'Isim' }
    ]
  },
  7: {
    pekanNumber: 7,
    moduleIndex: 2,
    title: 'Pekan 7: Isim Mufrad, Mutsanna & Jamak (Al-\'Adad)',
    arabicTitle: 'العَدَدُ: المُفْرَدُ وَالمُثَنَّى وَالجَمْعُ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 7)",
    youtubeVideoId: 'qcGkHoq7ObM',
    youtubeTitle: '_Tadribat Mukhtarat 6_',
    youtubeChannel: 'Aboezza_Official',
    targetOutcome: 'Mampu membedakan dan membentuk Isim Mufrad, Mutsanna, serta tiga jenis Jamak (Mudzakkar Salim, Mu\'annats Salim, dan Taksir).',
    summary:
      "Video Tadribat Mukhtarat 6 bersama Ustadz Irham Maulana (Abu Izza) membahas Pasal ke-3 kitab Mukhtarot tentang pembagian Isim ditinjau dari jumlahnya (Al-'Adad): Mufrad (tunggal/satu), Mutsanna (dua), dan Jamak (lebih dari dua). Isim Jamak kemudian dirinci menjadi tiga kategori: Jamak Mudzakkar Salim (khusus laki-laki berakal dengan tambahan ـُونَ/ـِينَ), Jamak Mu'annats Salim (untuk perempuan dengan tambahan ـَاتٌ/ـَاتٍ), serta Jamak Taksir yang bentuk mufradnya berubah/pecah sehingga wajib merujuk kamus.",
    points: [
      "Pasal ke-3 kitab Mukhtarot: setiap Isim ditinjau dari bilangannya terbagi menjadi Mufrad (satu), Mutsanna (dua), dan Jamak (lebih dari dua)",
      "Isim Mufrad (المُفْرَدُ): menunjukkan jumlah satu/tunggal, mencakup Mudzakkar maupun Mu'annats (مُدَرِّسٌ، طَالِبٌ، بَقَرَةٌ، مُدَرِّسَةٌ)",
      "Isim Mutsanna (المُثَنَّى): menunjukkan jumlah dua dengan pola selalu beraturan, menambah ـَانِ atau ـَيْنِ (huruf sebelumnya difathahkan)",
      "Jamak Salim (السَّالِمُ): mufradnya selamat dari perubahan; terbagi Jamak Mudzakkar Salim (ـُونَ/ـِينَ untuk berakal) dan Mu'annats Salim (ـَاتٌ/ـَاتٍ)",
      "Jamak Taksir (جَمْعُ التَّكْسِيرِ): jamak yang bentuk mufradnya pecah/berubah tanpa pola baku (umumnya benda mati & sebagian berakal) dan harus melihat kamus"
    ],
    rules: [
      "Isim Mufrad & Mutsanna: Mufrad bermakna tunggal; Mutsanna bermakna dua yang dibentuk secara baku dengan menambah Alif-Nun kasrah (ـَانِ) atau Ya'-Nun kasrah (ـَيْنِ) setelah fathah.",
      "Jamak Mudzakkar Salim (جَمْعُ المُذَكَّرِ السَّالِمُ): Khusus untuk mudzakkar berakal lebih dari dua; struktur mufrad tetap selamat lalu ditambah Wawu-Nun fathah (ـُونَ) atau Ya'-Nun fathah (ـِينَ).",
      "Jamak Mu'annats Salim (جَمْعُ المُؤَنَّثِ السَّالِمُ): Untuk mu'annats lebih dari dua; ta' marbuthah asalnya dibuang/dibuka lalu ditambah Alif dan Ta' maftuhah (ـَاتٌ / ـَاتٍ, tidak berharakat fathah).",
      "Jamak Taksir (جَمْعُ التَّكْسِيرِ): Menunjukkan lebih dari dua dengan perubahan/pecahnya bentuk mufrad; tidak punya rumus tunggal sehingga bentuknya merujuk pada kamus bahasa Arab."
    ],
    examples: [
      {
        ar: 'مُدَرِّسٌ — طَالِبٌ — ثَوْرٌ | مُدَرِّسَةٌ — طَالِبَةٌ — بَقَرَةٌ',
        tr: 'Pak Guru — Santri — Sapi jantan | Ibu Guru — Santriwati — Sapi betina (Mufrad)',
        breakdown: "Isim Mufrad menunjukkan makna tunggal (satu), berlaku baik untuk jenis Mudzakkar maupun Mu'annats."
      },
      {
        ar: 'مُدَرِّسَانِ / مُدَرِّسَيْنِ | طَالِبَتَانِ / طَالِبَتَيْنِ | بَقَرَتَانِ',
        tr: 'Dua Pak Guru | Dua Santriwati | Dua ekor sapi betina (Mutsanna)',
        breakdown: "Isim Mutsanna dibentuk secara beraturan dengan menambah akhiran Alif + Nun kasrah (ـَانِ) atau Ya' sukun + Nun kasrah (ـَيْنِ) yang didahului harakat fathah."
      },
      {
        ar: 'مُسْلِمُونَ / مُسْلِمِينَ | مُدَرِّسُونَ | الصَّالِحُونَ | المُجَاهِدُونَ',
        tr: 'Kaum muslimin — Para guru — Orang-orang saleh — Para pejuang',
        breakdown: "Jamak Mudzakkar Salim khusus untuk laki-laki berakal; kata tunggalnya (مُسْلِمٌ، مُدَرِّسٌ) tetap selamat/utuh lalu ditambah ـُونَ atau ـِينَ."
      },
      {
        ar: 'مُدَرِّسَاتٌ | مُسْلِمَاتٌ | صَالِحَاتٌ | مُؤْمِنَاتٌ',
        tr: 'Para ibu guru — Kaum muslimat — Wanita-wanita salihah — Wanita-wanita mukminah',
        breakdown: "Jamak Mu'annats Salim dibentuk dengan membuang ta' marbuthah (مُؤْمِنَةٌ ← مُؤْمِنَاتٌ) lalu menambah akhiran Alif dan Ta' maftuhah (ـَاتٌ / ـَاتٍ)."
      },
      {
        ar: 'كِتَابٌ ← كُتُبٌ | قَلَمٌ ← أَقْلَامٌ | مَسْجِدٌ ← مَسَاجِدُ',
        tr: 'Buku ← Buku-buku | Pena ← Pena-pena | Masjid ← Masjid-masjid',
        breakdown: "Benda mati tidak berakal tidak memakai Jamak Mudzakkar Salim, melainkan Jamak Taksir yang susunan huruf mufradnya berubah/pecah."
      },
      {
        ar: 'عَالِمٌ ← عُلَمَاءُ | رَسُولٌ ← رُسُلٌ | اِمْرَأَةٌ ← نِسَاءٌ',
        tr: 'Orang berilmu ← Para ulama | Rasul ← Para rasul | Wanita ← Para wanita',
        breakdown: "Sebagian isim berakal juga memiliki bentuk Jamak Taksir yang berubah dari mufradnya (seperti اِمْرَأَةٌ menjadi نِسَاءٌ) dan diketahui melalui kamus."
      }
    ],
    vocabularies: [
      { ar: 'مُدَرِّسٌ', id: 'Seorang guru (Mufrad) / مُدَرِّسُونَ (Jamak)', type: 'Isim' },
      { ar: 'طَالِبَةٌ', id: 'Seorang santriwati (Mufrad) / طَالِبَتَانِ (Mutsanna)', type: 'Isim' },
      { ar: 'مُسْلِمُونَ', id: 'Kaum muslimin (Jamak Mudzakkar Salim)', type: 'Isim' },
      { ar: 'صَالِحَاتٌ', id: "Wanita-wanita salihah (Jamak Mu'annats Salim)", type: 'Isim' },
      { ar: 'مُؤْمِنَاتٌ', id: "Wanita-wanita mukminah (dari مُؤْمِنَةٌ)", type: 'Isim' },
      { ar: 'أَقْلَامٌ', id: 'Pena-pena (Jamak Taksir dari قَلَمٌ)', type: 'Isim' },
      { ar: 'مَسَاجِدُ', id: 'Masjid-masjid (Jamak Taksir dari مَسْجِدٌ)', type: 'Isim' },
      { ar: 'عُلَمَاءُ', id: 'Para ulama (Jamak Taksir dari عَالِمٌ)', type: 'Isim' },
      { ar: 'رُسُلٌ', id: 'Para rasul (Jamak Taksir dari رَسُولٌ)', type: 'Isim' },
      { ar: 'نِسَاءٌ', id: 'Para wanita (Jamak Taksir dari اِمْرَأَةٌ)', type: 'Isim' }
    ]
  },
  8: {
    pekanNumber: 8,
    moduleIndex: 2,
    title: 'Pekan 8: Isim Nakirah & 7 Macam Isim Ma\'rifah',
    arabicTitle: 'النَّكِرَةُ وَالمَعْرِفَةُ وَأَقْسَامُ المَعَارِفِ السَّبْعَةِ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 8–9)",
    youtubeVideoId: 'gCklkRDz0x4',
    youtubeTitle: '_Tadribat Mukhtarat 7_',
    youtubeChannel: 'Aboezza_Official',
    targetOutcome: 'Mampu membedakan Isim Nakirah (umum) dan 7 kategori Isim Ma\'rifah (khusus) beserta kaidah Idhafah.',
    summary:
      "Video Tadribat Mukhtarat 7 bersama Ustadz Irham Maulana (Abu Izza) diawali nasihat wajibnya menuntut ilmu agama dan mempelajari bahasa Arab sebagai sarana memahami Al-Qur'an, Hadits, serta bacaan shalat, lalu membahas Pasal ke-4 kitab Mukhtarot tentang Isim ditinjau dari kejelasannya: Isim Nakirah (bersifat umum) dan Isim Ma'rifah (tertentu/spesifik) beserta 7 kategorinya: Alif Lam (ال), Dhamir, Isim Isyarah, Isim Maushul, Munada, 'Alam, dan Mudhaf kepada Ma'rifah.",
    points: [
      "Nasihat pembuka: menuntut ilmu (termasuk bahasa Arab bagi penuntut ilmu, da'i, dan pemahaman shalat) wajib sesuai kebutuhan masing-masing",
      "Isim Nakirah (النَّكِرَةُ): kata benda bersifat umum dan belum tertunjuk bendanya secara spesifik seperti بَيْتٌ، كِتَابٌ، بَابٌ",
      "Isim Ma'rifah (المَعْرِفَةُ): kata benda yang sudah spesifik/diketahui pembicara dan pendengar, terdiri atas 7 kategori utama",
      "6 Ma'rifah pertama: ber-Alif Lam (المُدَرِّسُ), Dhamir (هُوَ), Isim Isyarah (هَذَا), Isim Maushul (الَّذِي), Munada (يَا أَحْمَدُ), dan 'Alam (مَكَّةُ)",
      "Ma'rifah ke-7 (Mudhaf ke Ma'rifah): isim nakirah menjadi ma'rifah bila disandarkan pada salah satu dari 6 ma'rifah di atas (قَلَمُ مُحَمَّدٍ)"
    ],
    rules: [
      "Nakirah vs Ma'rifah: Setiap isim yang tidak termasuk dalam 7 kategori Ma'rifah dihukumi sebagai Isim Nakirah (umum/belum tentu).",
      "Tanda Terkuat & Kata Tunjuk/Sambung: Alif Lam (ال) menandai Ma'rifah; Dhamir, Isyarah (هَذَا/ذَلِكَ/هَؤُلَاءِ), dan Maushul (الَّذِي/الَّتِي) selalu Ma'rifah.",
      "Munada & 'Alam: Isim yang dipanggil setelah huruf nida' (يَا + مُنَادَى) serta seluruh nama diri, gelar, tempat, kota, sungai, dan laut ('Alam) berstatus Ma'rifah.",
      "Kaidah Idhafah (Mudhaf & Mudhaf Ilaih): Dalam susunan penyandaran kepada Ma'rifah, kata pertama (Mudhaf) menjadi Ma'rifah tanpa tanwin dan kata kedua (Mudhaf Ilaih) selalu majrur (قَلَمُ مُحَمَّدٍ)."
    ],
    examples: [
      {
        ar: 'بَيْتٌ — كِتَابٌ — بَابٌ | البَيْتُ — الكِتَابُ — بَابُ المَسْجِدِ',
        tr: 'Rumah — Buku — Pintu (Nakirah) | Rumah itu — Buku itu — Pintu masjid (Ma\'rifah)',
        breakdown: "Kata bertanwin tanpa penunjuk (بَيْتٌ، كِتَابٌ، بَابٌ) masih umum (Nakirah), sedangkan penambahan ال atau penyandaran menjadikannya spesifik (Ma'rifah)."
      },
      {
        ar: 'مُدَرِّسٌ ← المُدَرِّسُ | طَالِبٌ ← الطَّالِبُ | بَقَرَةٌ ← البَقَرَةُ',
        tr: 'Seorang guru ← Pak guru itu | Seorang siswa ← Siswa itu | Sapi ← Sapi itu',
        breakdown: "Alif Lam (ال) adalah tanda Ma'rifah paling umum yang mengubah Isim Nakirah menjadi tertentu/diketahui."
      },
      {
        ar: 'هُوَ مُحَمَّدٌ — هُوَ طَالِبٌ | هَذَا كِتَابٌ — هَذِهِ سَبُّورَةٌ — ذَلِكَ رَجُلٌ',
        tr: 'Dia Muhammad — Dia siswa | Ini buku — Ini papan tulis — Itu laki-laki',
        breakdown: "Isim Dhamir (هُوَ، هِيَ، أَنْتَ) dan Isim Isyarah (هَذَا، هَذِهِ، ذَلِكَ، تِلْكَ، هَؤُلَاءِ، أُولَئِكَ) termasuk Isim Ma'rifah karena penunjukannya sudah jelas."
      },
      {
        ar: 'الرَّجُلُ الَّذِي فِي الفَصْلِ طَالِبٌ | يَا أَيُّهَا الَّذِينَ آمَنُوا',
        tr: 'Laki-laki yang ada di kelas itu adalah siswa | Wahai orang-orang yang beriman',
        breakdown: "Isim Maushul (الَّذِي، الَّذَانِ، الَّذِينَ، الَّتِي، اللَّتَانِ، اللَّاتِي) berfungsi sebagai kata penghubung ('yang') dan berstatus Ma'rifah."
      },
      {
        ar: 'يَا أَحْمَدُ — يَا رَسُولَ اللهِ | مَكَّةُ — أَبُو بَكْرٍ — نَهْرُ النِّيلِ — البَحْرُ الأَحْمَرُ',
        tr: 'Wahai Ahmad — Wahai Rasulullah | Makkah — Abu Bakar — Sungai Nil — Laut Merah',
        breakdown: "Munada setelah huruf panggilan (يَا) serta seluruh nama ('Alam) orang, kunyah, kota, sungai, dan laut tergolong Isim Ma'rifah."
      },
      {
        ar: 'قَلَمُ مُحَمَّدٍ — مَعْهَدُنَا — كِتَابُ اللهِ — صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ',
        tr: 'Pena Muhammad — Pesantren kita — Kitab Allah — Jalan orang-orang yang Engkau beri nikmat',
        breakdown: "Isim Nakirah (قَلَمٌ، مَعْهَدٌ، كِتَابٌ، صِرَاطٌ) menjadi Ma'rifah karena diidhafahkan ke Ma'rifah; Mudhaf kehilangan tanwinnya dan Mudhaf Ilaih wajib majrur."
      }
    ],
    vocabularies: [
      { ar: 'بَيْتٌ', id: 'Rumah (contoh Isim Nakirah)', type: 'Isim' },
      { ar: 'بَابٌ', id: 'Pintu (contoh Isim Nakirah)', type: 'Isim' },
      { ar: 'المُدَرِّسُ', id: 'Guru itu (Ma\'rifah dengan Alif Lam)', type: 'Isim' },
      { ar: 'سَبُّورَةٌ', id: 'Papan tulis (هَذِهِ سَبُّورَةٌ)', type: 'Isim' },
      { ar: 'الَّذِي', id: 'Yang (Isim Maushul tunggal mudzakkar)', type: 'Isim' },
      { ar: 'يَا رَسُولَ اللهِ', id: 'Wahai Rasulullah (contoh Munada Ma\'rifah)', type: 'Isim' },
      { ar: 'مَكَّةُ', id: 'Makkah (contoh Isim \'Alam nama kota)', type: 'Isim' },
      { ar: 'نَهْرُ النِّيلِ', id: 'Sungai Nil (contoh Isim \'Alam nama tempat)', type: 'Isim' },
      { ar: 'قَلَمُ مُحَمَّدٍ', id: 'Pena Muhammad (Mudhaf ke \'Alam)', type: 'Isim' },
      { ar: 'مَعْهَدُنَا', id: 'Pesantren kita (Mudhaf ke Dhamir نَا)', type: 'Isim' }
    ]
  },
  9: {
    pekanNumber: 9,
    moduleIndex: 2,
    title: 'Pekan 9: Isim Mu\'rab & 8 Macam Isim Mabni',
    arabicTitle: 'الإِعْرَابُ وَالبِنَاءُ: الاِسْمُ المُعْرَبُ وَالمَبْنِيُّ',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 10–11)",
    youtubeVideoId: 'YMeHholNbVM',
    youtubeTitle: '_Tadribat Mukhtarat 8_',
    youtubeChannel: 'Aboezza_Official',
    targetOutcome: 'Mampu membedakan Isim Mu\'rab (berubah harakat akhir) dan 8 kelompok Isim Mabni (tetap harakat akhir).',
    summary:
      "Video Tadribat Mukhtarat 8 bersama Ustadz Irham Maulana (Abu Izza) membahas Pasal ke-5 kitab Mukhtarot tentang pembagian Isim ditinjau dari perubahan harakat akhirnya: Isim Mu'rab (harakat akhir berubah sesuai posisi kalimat, merupakan hukum asal semua isim) dan Isim Mabni (harakat akhir tetap tidak berubah). Dijelaskan pula 8 kelompok Isim Mabni agar pelajar mudah mengenali Isim Mu'rab selain ke-8 kelompok tersebut: Dhamir, Isyarah, Maushul, Syarat, Istifham, Isim Fi'il, sebagian Zharaf, dan bilangan 11–19 selain 12.",
    points: [
      "Pasal ke-5 kitab Mukhtarot: pembagian Isim berdasarkan perubahan harakat akhir menjadi Isim Mu'rab (berubah) dan Isim Mabni (tetap)",
      "Isim Mu'rab (المُعْرَبُ): hukum asal isim yang harakat akhirnya berubah mengikuti kedudukan/amil (اللهُ أَكْبَرُ ← إِنَّ اللهَ ← بِسْمِ اللهِ)",
      "Isim Mabni (المَبْنِيُّ): harakat akhirnya tetap di semua posisi kalimat meski didahului amil seperti إِنَّ atau huruf jar (هَذَا ← بِهَذَا)",
      "Lima kelompok awal Mabni: Isim Dhamir (هُوَ، أَنْتَ), Isyarah (هَذَا، ذَلِكَ), Maushul (الَّذِي), Syarat (مَنْ، مَا، مَتَى), dan Istifham (أَيْنَ، كَيْفَ)",
      "Tiga kelompok akhir Mabni: Isim Fi'il (هَيْهَاتَ، آمِينَ), sebagian Zharaf (حَيْثُ، الآنَ، أَمْسِ), serta bilangan 11–19 kecuali 12 (أَحَدَ عَشَرَ)"
    ],
    rules: [
      "Hukum Asal Mu'rab vs Mabni: Semua isim pada dasarnya Mu'rab kecuali jika termasuk ke dalam 8 kategori Isim Mabni.",
      "Ketahanan Harakat Isim Mabni: Huruf jar (إِلَى، مِنْ، بِـ) tetap bekerja secara makna, tetapi harakat akhir Isim Mabni tidak berubah (إِلَى أَيْنَ، مِنْ حَيْثُ).",
      "Pembedaan Syarat & Istifham: Kata seperti مَنْ، مَا، مَتَى bisa menjadi Isim Syarat jika menuntut dua kalimat sebab-akibat, atau Istifham jika untuk bertanya.",
      "Zharaf Mabni & Isim Fi'il: Zharaf tertentu tetap harakatnya (حَيْثُ dhammah, الآنَ fathah, أَمْسِ kasrah), sedangkan Isim Fi'il bermakna fi'il dengan akhir tetap (هَيْهَاتَ، آمِينَ).",
      "Bilangan Belasan 11–19: Kedua bagian bilangan 11 serta 13–19 selalu mabni fathah (أَحَدَ عَشَرَ), kecuali bilangan 12 yang bagian pertamanya Mu'rab (اِثْنَا عَشَرَ / اِثْنَيْ عَشَرَ)."
    ],
    examples: [
      {
        ar: 'اللهُ أَكْبَرُ — إِنَّ اللهَ — بِسْمِ اللهِ | هَذَا أَكْبَرُ — إِنَّ هَذَا — بِهَذَا',
        tr: 'Allah Maha Besar — Sesungguhnya Allah — Dengan nama Allah | Ini lebih besar — Sungguh ini — Dengan ini',
        breakdown: "Lafazh الله berubah harakat akhirnya (-u, -a, -i) sehingga disebut Mu'rab, sedangkan هَذَا tetap konstan dalam segala posisi sehingga disebut Mabni."
      },
      {
        ar: 'هُوَ — أَنْتَ — أَنَا — نَحْنُ | ذَلِكَ — تِلْكَ | الَّذِي — الَّذِينَ — الَّتِي',
        tr: 'Dia, Kamu, Saya, Kami (Dhamir) | Itu (Isyarah) | Yang (Maushul)',
        breakdown: "Tiga kelompok Mabni pertama (Dhamir, Isyarah, Maushul) selalu mempertahankan bentuk akhirnya di posisi subjek, objek, maupun setelah huruf jar."
      },
      {
        ar: 'مَنْ يَجْتَهِدْ يَنْجَحْ | مَا تَفْعَلُوا مِنْ خَيْرٍ تَجِدُوهُ',
        tr: 'Barang siapa bersungguh-sungguh pasti berhasil | Kebaikan apa saja yang kalian lakukan pasti mendapat balasannya',
        breakdown: "Isim Syarat (مَنْ، مَا، مَتَى، أَيْنَمَا) menghubungkan kalimat syarat dan jawab syarat (sebab-akibat) serta bersifat Mabni."
      },
      {
        ar: 'مَنْ هُوَ؟ — مَتَى تَذْهَبُ؟ — إِلَى أَيْنَ؟ — مَعَ مَنْ؟',
        tr: 'Siapa dia? — Kapan engkau pergi? — Ke mana? — Bersama siapa?',
        breakdown: "Isim Istifham (kata tanya) tetap Mabni; meskipun didahului huruf jar إِلَى atau مَعَ, harakat أَيْنَ tetap fathah dan مَنْ tetap sukun."
      },
      {
        ar: 'هَيْهَاتَ (بَعُدَ) — آمِينَ (اِسْتَجِبْ) | مِنْ حَيْثُ — إِلَى الآنَ — أَمْسِ',
        tr: 'Jauh sekali — Kabulkanlah (Isim Fi\'il) | Dari mana saja — Hingga kini — Kemarin (Zharaf Mabni)',
        breakdown: "Isim Fi'il memiliki makna kata kerja namun berstatus isim mabni; sementara sebagian Zharaf seperti حَيْثُ، الآنَ، أَمْسِ tidak pernah berubah harakat akhirnya."
      },
      {
        ar: 'جَاءَ أَحَدَ عَشَرَ — رَأَيْتُ أَحَدَ عَشَرَ | جَاءَ اِثْنَا عَشَرَ — رَأَيْتُ اِثْنَيْ عَشَرَ',
        tr: 'Sebelas orang datang — Saya melihat sebelas | Dua belas datang — Saya melihat dua belas',
        breakdown: "Bilangan 11 dan 13–19 tetap mabni fathah pada kedua katanya (أَحَدَ عَشَرَ), sedangkan bilangan 12 bagian pertamanya Mu'rab (اِثْنَا menjadi اِثْنَيْ saat objek)."
      }
    ],
    vocabularies: [
      { ar: 'مُعْرَبٌ', id: 'Isim yang harakat akhirnya dapat berubah', type: 'Isim' },
      { ar: 'مَبْنِيٌّ', id: 'Isim yang harakat akhirnya selalu tetap', type: 'Isim' },
      { ar: 'مَنْ', id: 'Barang siapa (Syarat) / Siapa (Istifham)', type: 'Isim' },
      { ar: 'مَتَى', id: 'Kapan pun (Syarat) / Kapan (Istifham)', type: 'Isim' },
      { ar: 'أَيْنَ', id: 'Di mana (Isim Istifham mabni fathah)', type: 'Isim' },
      { ar: 'هَيْهَاتَ', id: 'Jauh sekali / mustahil (Isim Fi\'il Madhi)', type: 'Isim' },
      { ar: 'آمِينَ', id: 'Kabulkanlah / اِسْتَجِبْ (Isim Fi\'il Amr)', type: 'Isim' },
      { ar: 'حَيْثُ', id: 'Di mana / sekiranya (Zharaf mabni dhammah)', type: 'Isim' },
      { ar: 'الآنَ', id: 'Sekarang (Zharaf mabni fathah)', type: 'Isim' },
      { ar: 'أَحَدَ عَشَرَ', id: 'Sebelas (bilangan 11–19 mabni fathah kecuali 12)', type: 'Isim' }
    ]
  },
  10: {
    pekanNumber: 10,
    moduleIndex: 3,
    title: 'Pekan 10: Isim Jamid & Isim Musytaq (Tasrif Istilahi)',
    arabicTitle: 'الاِسْمُ الجَامِدُ وَالمُشْتَقُّ وَأَقْسَامُهُمَا',
    kitabReference: "Al-Mabadi' An-Nahwiyyah — Jilid 1 (Bab 12)",
    youtubeVideoId: 'Ds55SPtnfM8',
    youtubeTitle: '_Tadribat Mukhtarat 9_',
    youtubeChannel: 'Aboezza_Official',
    targetOutcome: 'Mampu membedakan Isim Jamid (Isim Dzat & Mashdar) dengan Isim Musytaq (Fa\'il, Maf\'ul, Tafdhil, Zaman, Makan, Alat, Shifah Musyabbahah).',
    summary:
      "Video Tadribat Mukhtarat 9 bersama Ustadz Irham Maulana (Abu Izza) membahas Pasal ke-6 kitab Mukhtarot tentang pembagian Isim ditinjau dari penyusunnya atau asal-usulnya, diawali pengenalan Tasrif Istilahi (perubahan kata secara menyamping berdasarkan wazan ف-ع-ل). Isim terbagi menjadi Isim Jamid (berdiri sendiri, terbagi atas Isim Dzat yang tidak menurunkan kata lain dan Mashdar yang menjadi sumber kata turunan) serta Isim Musytaq (kata turunan dari Mashdar), mencakup Isim Fa'il, Isim Maf'ul, Isim Tafdhil, Isim Zaman, Isim Makan, Isim Alat, dan Shifah Musyabbahah.",
    points: [
      "Pengantar Tasrif Istilahi: perubahan satu kata secara menyamping mengikuti pola/wazan (ف-ع-ل) untuk melahirkan kata-kata turunan",
      "Isim Jamid (الجَامِدُ): isim yang berdiri sendiri dan bukan turunan dari kata lain, terbagi menjadi Isim Dzat dan Mashdar",
      "Isim Dzat vs Mashdar: Isim Dzat (بَيْتٌ، رَجُلٌ، بَابٌ) tidak menurunkan kata baru, sedangkan Mashdar (عِلْمٌ، كِتَابَةٌ) menjadi kata dasar turunan",
      "Isim Musytaq (المُشْتَقُّ): kata turunan dari Mashdar berupa Isim Fa'il (pelaku), Isim Maf'ul (objek), dan Isim Tafdhil (lebih/paling)",
      "Bentuk Musytaq lainnya: Isim Zaman (waktu), Isim Makan (tempat), Isim Alat (perkakas), dan Shifah Musyabbahah (sifat yang tetap)"
    ],
    rules: [
      "Isim Jamid vs Musytaq: Jamid adalah kata asli yang tidak diturunkan dari kata lain (Dzat atau Mashdar), sedangkan Musytaq adalah kata turunan yang berasal dari Mashdar.",
      "Rumus Isim Fa'il: Dari fi'il 3 huruf berwazan فَاعِلٌ (نَاصِرٌ، عَالِمٌ); dari 4+ huruf mengganti huruf mudhara'ah dengan مُـ dan mengkasrahkan huruf sebelum akhir (مُجَاهِدٌ).",
      "Rumus Isim Maf'ul: Dari fi'il 3 huruf berwazan مَفْعُولٌ (مَنْصُورٌ، مَعْلُومٌ); dari 4+ huruf sama seperti Isim Fa'il tetapi huruf sebelum akhir difathahkan (مُجَاهَدٌ).",
      "Tafdhil, Zaman, Makan & Alat: Isim Tafdhil berpola أَفْعَلُ (أَعْلَمُ، أَكْبَرُ); Isim Zaman/Makan berawalan مَـ (مَوْعِدٌ، مَدْرَسَةٌ); Isim Alat umumnya berawalan مِـ kasrah (مِفْتَاحٌ).",
      "Shifah Musyabbahah: Kata sifat turunan (sering dari fi'il berwazan فَعُلَ) yang menyerupai Isim Fa'il tetapi menunjukkan sifat yang menetap (حَسَنٌ، جَوْعَانُ، أَعْمَى)."
    ],
    examples: [
      {
        ar: 'بَيْتٌ — رَجُلٌ — بَابٌ (اِسْمُ ذَاتٍ) | كِتَابَةٌ — عِلْمٌ — قِرَاءَةٌ (مَصْدَرٌ)',
        tr: 'Rumah — Laki-laki — Pintu (Isim Dzat) | Penulisan — Ilmu — Bacaan (Mashdar)',
        breakdown: "Keduanya tergolong Isim Jamid; bedanya Isim Dzat tidak memiliki kata turunan, sedangkan Mashdar melahirkan berbagai kata turunan dalam tasrif."
      },
      {
        ar: 'حَكَمَ ← حَاكِمٌ | عَلِمَ ← عَالِمٌ | جَاهَدَ يُجَاهِدُ ← مُجَاهِدٌ | دَرَّسَ ← مُدَرِّسٌ',
        tr: 'Hakim (yang menghukumi) | Alim (yang berilmu) | Mujahid (yang berjihad) | Mudarris (yang mengajar)',
        breakdown: "Contoh Isim Fa'il (makna pelaku): fi'il 3 huruf mengikuti wazan فَاعِلٌ, sedangkan fi'il 4+ huruf memakai awalan مُـ dengan huruf sebelum akhir kasrah."
      },
      {
        ar: 'حَكَمَ ← مَحْكُومٌ | نَصَرَ ← مَنْصُورٌ | عَلِمَ ← مَعْلُومٌ | جَاهَدَ ← مُجَاهَدٌ',
        tr: 'Yang dihukumi — Yang ditolong — Yang diketahui — Yang diperjuangkan',
        breakdown: "Contoh Isim Maf'ul (makna objek): fi'il 3 huruf berwazan مَفْعُولٌ, sedangkan 4+ huruf berawalan مُـ dengan huruf sebelum akhir fathah."
      },
      {
        ar: 'عَلِمَ ← أَعْلَمُ | كَبُرَ ← أَكْبَرُ | حَسُنَ ← أَحْسَنُ',
        tr: 'Lebih/paling mengetahui — Lebih/paling besar — Lebih/paling baik',
        breakdown: "Isim Tafdhil mengikuti wazan أَفْعَلُ untuk menyatakan perbandingan lebih atau paling (superlatif)."
      },
      {
        ar: 'مَوْعِدٌ — مَغْرِبٌ (اِسْمُ زَمَانٍ) | مَلْعَبٌ — مَكْتَبٌ — مَحْكَمَةٌ — مَدْرَسَةٌ (اِسْمُ مَكَانٍ)',
        tr: 'Waktu janji — Waktu terbenam (Zaman) | Tempat main — Meja tulis — Pengadilan — Sekolah (Makan)',
        breakdown: "Isim Zaman menunjukkan waktu terjadinya perbuatan, sedangkan Isim Makan menunjukkan lokasi/tempat terjadinya perbuatan."
      },
      {
        ar: 'مِصْبَاحٌ — مِفْتَاحٌ — مِلْعَقَةٌ (اِسْمُ آلَةٍ) | جَوْعَانُ — حَسَنٌ — سَهْلٌ — أَعْمَى (صِفَةٌ مُشَبَّهَةٌ)',
        tr: 'Lampu — Kunci — Sendok (Alat) | Lapar — Baik — Mudah — Buta (Shifah Musyabbahah)',
        breakdown: "Isim Alat menunjukkan sarana/perkakas pekerjaan, sedangkan Shifah Musyabbahah menunjukkan sifat yang melekat/tetap pada diri."
      }
    ],
    vocabularies: [
      { ar: 'كِتَابَةٌ', id: 'Penulisan (Mashdar asal kata كَتَبَ/كَاتِبٌ)', type: 'Isim' },
      { ar: 'حَاكِمٌ', id: "Hakim / yang menghukumi (Isim Fa'il)", type: 'Isim' },
      { ar: 'مُجَاهِدٌ', id: "Yang berjihad (Isim Fa'il 4 huruf)", type: 'Isim' },
      { ar: 'مَعْلُومٌ', id: "Yang diketahui (Isim Maf'ul dari عَلِمَ)", type: 'Isim' },
      { ar: 'أَعْلَمُ', id: 'Lebih / paling mengetahui (Isim Tafdhil)', type: 'Isim' },
      { ar: 'مَوْعِدٌ', id: 'Waktu perjanjian (Isim Zaman)', type: 'Isim' },
      { ar: 'مَلْعَبٌ', id: 'Tempat bermain / lapangan (Isim Makan)', type: 'Isim' },
      { ar: 'مِفْتَاحٌ', id: 'Kunci / alat pembuka (Isim Alat)', type: 'Isim' },
      { ar: 'مِصْبَاحٌ', id: 'Lampu / alat penerang (Isim Alat)', type: 'Isim' },
      { ar: 'جَوْعَانُ', id: 'Lapar (Shifah Musyabbahah / sifat tetap)', type: 'Isim' }
    ]
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

export function extractOptionalYouTubeId(input?: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';

  // 1. Standar YouTube formats: watch, embed, v, live, shorts, youtu.be
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([\w-]{11})/i
  );
  if (match && match[1]) {
    return match[1];
  }

  // 2. Query param v=
  const vMatch = trimmed.match(/[?&]v=([\w-]{11})/i);
  if (vMatch && vMatch[1]) {
    return vMatch[1];
  }

  // 3. Exact 11 character ID
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return '';
}

export function extractYouTubeId(input: string): string {
  return extractOptionalYouTubeId(input) || input.trim() || 'fC9zKq38_54';
}

export function isValidYouTubeVideoInput(input?: string): boolean {
  return extractOptionalYouTubeId(input).length === 11;
}

export interface GoogleDriveMediaInfo {
  isGoogleDrive: boolean;
  fileId: string;
  previewUrl: string;
  viewUrl: string;
  directUrl: string;
}

export type GoogleDriveAudioInfo = GoogleDriveMediaInfo;
export type GoogleDriveVideoInfo = GoogleDriveMediaInfo;

/**
 * Ekstrak File ID Google Drive dari berbagai format URL (/file/d/<ID>/view, open?id=<ID>, uc?id=<ID>, /preview)
 * atau File ID mentah.
 */
export function extractGoogleDriveFileId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Format: https://drive.google.com/file/d/<ID>/view... atau /preview
  const filePathMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/i);
  if (filePathMatch && filePathMatch[1]) {
    return filePathMatch[1];
  }

  // Format: ?id=<ID> atau &id=<ID> (open?id=..., uc?id=..., docs.google.com/...)
  const queryIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/i);
  if (queryIdMatch && queryIdMatch[1]) {
    return queryIdMatch[1];
  }

  // Format Google Drive File ID mentah (tidak mengandung spasi/protocol; Drive ID >= 20 karakter)
  if (!/^https?:\/\//i.test(trimmed) && /^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  return '';
}

export function getGoogleDriveMediaInfo(input: string): GoogleDriveMediaInfo {
  const trimmed = (input || '').trim();
  const fileId = extractGoogleDriveFileId(trimmed);
  if (fileId) {
    return {
      isGoogleDrive: true,
      fileId,
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      viewUrl: `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
      directUrl: `https://drive.google.com/uc?export=download&id=${fileId}`
    };
  }
  return {
    isGoogleDrive: false,
    fileId: '',
    previewUrl: '',
    viewUrl: trimmed,
    directUrl: trimmed
  };
}

export const getGoogleDriveAudioInfo = getGoogleDriveMediaInfo;

export function getPekanYouTubeId(pekan?: Partial<WeeklyPekanData> | null): string {
  if (!pekan) return '';
  return extractOptionalYouTubeId(pekan.youtubeVideoId);
}

export function getPekanVideoSource(pekan?: Partial<WeeklyPekanData> | null): string {
  return getPekanYouTubeId(pekan);
}

export function getNormalizedPekanAudioItems(pekan?: Partial<WeeklyPekanData> | null): WeeklyAudioItem[] {
  if (!pekan) return [];
  const items: WeeklyAudioItem[] = Array.isArray(pekan.audioItems)
    ? pekan.audioItems.filter((item) => item && item.driveUrl && item.driveUrl.trim().length > 0)
    : [];

  if (items.length > 0) {
    return items;
  }

  if (pekan.audioDriveUrl && pekan.audioDriveUrl.trim().length > 0) {
    return [
      {
        id: `pekan-${pekan.pekanNumber || 1}-main-audio`,
        title: (pekan.audioTitle || '').trim() || `Audio Mendengar (Istima') — Pekan ${pekan.pekanNumber || 1}`,
        arabicTitle: pekan.arabicTitle || 'دَرْسُ الاسْتِمَاعِ',
        driveUrl: pekan.audioDriveUrl.trim()
      }
    ];
  }

  return [];
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

export interface MateriSyncResult {
  syncedToServer: boolean;
  error?: string;
}

function normalizeServerMateriMap(raw: unknown): Record<string, WeeklyPekanData> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const result: Record<string, WeeklyPekanData> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = v as WeeklyPekanData;
    }
  }
  return result;
}

export async function syncCustomMateriFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  const cacheBuster = `_t=${Date.now()}`;
  try {
    const res = await fetch(`./api.php?entity=materi&${cacheBuster}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (res.ok) {
      const serverData = normalizeServerMateriMap(await res.json());
      if (serverData !== null) {
        // Server (custom_materi.json via api.php) adalah sumber kebenaran bersama antar-perangkat
        localStorage.setItem(CUSTOM_MATERI_STORAGE_KEY, JSON.stringify(serverData));
        window.dispatchEvent(new Event('materi-updated'));
        window.dispatchEvent(new Event('storage'));
        return;
      }
    }
  } catch {
    // If api.php is unreachable, fallback to custom_materi.json
  }

  try {
    const resJson = await fetch(`./custom_materi.json?${cacheBuster}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (resJson.ok) {
      const jsonData = normalizeServerMateriMap(await resJson.json());
      if (jsonData !== null && Object.keys(jsonData).length > 0) {
        localStorage.setItem(CUSTOM_MATERI_STORAGE_KEY, JSON.stringify(jsonData));
        window.dispatchEvent(new Event('materi-updated'));
        window.dispatchEvent(new Event('storage'));
      }
    }
  } catch {
    // Ignore fallback errors
  }
}

async function postCustomMateriToApi(
  querySuffix: string,
  bodyPayload: Record<string, unknown>,
  fallbackError: string
): Promise<MateriSyncResult> {
  try {
    const res = await fetch(`./api.php?entity=materi${querySuffix}&_t=${Date.now()}`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      body: JSON.stringify(bodyPayload)
    });
    const text = await res.text();
    let parsed: { status?: string; message?: string } | null = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
    if (!res.ok || !parsed || parsed.status !== 'ok') {
      const msg = parsed?.message || `HTTP ${res.status} — ${fallbackError}`;
      console.warn('Sync to cPanel api.php failed:', msg);
      return { syncedToServer: false, error: msg };
    }
    return { syncedToServer: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Sync to cPanel api.php notice:', msg);
    return { syncedToServer: false, error: msg };
  }
}

export async function saveCustomMateriOverride(
  programId: string,
  pekanNumber: number,
  data: WeeklyPekanData
): Promise<MateriSyncResult> {
  if (typeof window === 'undefined') {
    return { syncedToServer: false, error: 'Browser window unavailable' };
  }
  const key = `${programId}-pekan-${pekanNumber}`;
  const payload: WeeklyPekanData = {
    ...data,
    pekanNumber,
    youtubeVideoId: extractOptionalYouTubeId(data.youtubeVideoId) || (data.youtubeVideoId || '').trim(),
    youtubeTitle: (data.youtubeTitle || data.videoTitle || '').trim(),
    youtubeChannel: (data.youtubeChannel || data.videoInstructor || '').trim(),
    videoDriveUrl: '',
    videoTitle: '',
    videoInstructor: ''
  };
  try {
    const current = getAllCustomMateriOverrides();
    current[key] = payload;
    localStorage.setItem(CUSTOM_MATERI_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('materi-updated'));
  } catch (err) {
    console.error('Failed to save local custom materi cache:', err);
  }

  return postCustomMateriToApi('', { [key]: payload }, 'gagal menyimpan ke server cPanel (api.php)');
}

export async function resetCustomMateriOverride(
  programId: string,
  pekanNumber: number
): Promise<MateriSyncResult> {
  if (typeof window === 'undefined') {
    return { syncedToServer: false, error: 'Browser window unavailable' };
  }
  const key = `${programId}-pekan-${pekanNumber}`;
  try {
    const current = getAllCustomMateriOverrides();
    delete current[key];
    localStorage.setItem(CUSTOM_MATERI_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('materi-updated'));
  } catch (err) {
    console.error('Failed to reset custom materi override:', err);
  }

  return postCustomMateriToApi(
    `&action=delete&key=${encodeURIComponent(key)}`,
    { action: 'delete', key },
    'gagal mereset materi di server cPanel'
  );
}

export const PEKAN_UNLOCK_STORAGE_KEY = 'tadribul_lughah_pekan_unlock_map_v1';

function parseLevelNum(raw: string): number {
  const match = String(raw || '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

export function getAllPekanUnlockStates(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PEKAN_UNLOCK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function hasScheduleUnlockConfig(
  map: Record<string, boolean>,
  scheduleId: string
): boolean {
  const prefix = `${scheduleId}-pekan-`;
  return Object.keys(map).some(
    (k) => k.startsWith(prefix) && typeof map[k] === 'boolean'
  );
}

export function isPekanUnlocked(
  programId: string,
  pekanNumber: number,
  scheduleId?: string
): boolean {
  const num = Math.max(1, pekanNumber || 1);
  const progId = programId || 'tl-level-1';
  const levelNum = parseLevelNum(progId);
  const map = getAllPekanUnlockStates();
  const cleanScheduleId = (scheduleId || '').trim();

  if (cleanScheduleId) {
    const schedKey = `${cleanScheduleId}-pekan-${num}`;
    if (typeof map[schedKey] === 'boolean') {
      return map[schedKey];
    }
    // If this schedule already has explicit per-schedule settings for other pekans,
    // do not leak another schedule's or legacy program state; default to Pekan 1 ON.
    if (hasScheduleUnlockConfig(map, cleanScheduleId)) {
      return num === 1;
    }
  }

  const candidateKeys = [
    `${progId}-pekan-${num}`,
    `tl-level-${levelNum}-pekan-${num}`,
    `level-${levelNum}-pekan-${num}`,
    `${levelNum}-pekan-${num}`
  ];

  for (const k of candidateKeys) {
    if (typeof map[k] === 'boolean') {
      return map[k];
    }
  }

  const overrides = getAllCustomMateriOverrides();
  const materiKey = `${progId}-pekan-${num}`;
  if (overrides[materiKey] && typeof overrides[materiKey].isUnlocked === 'boolean') {
    return overrides[materiKey].isUnlocked!;
  }

  // Default: Pekan 1 is open (Muqaddimah), subsequent pekans locked until Superadmin unlocks
  return num === 1;
}

export function savePekanUnlockState(
  programId: string,
  pekanNumber: number,
  isUnlocked: boolean,
  scheduleId?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const num = Math.max(1, pekanNumber || 1);
    const progId = programId || 'tl-level-1';
    const levelNum = parseLevelNum(progId);
    const current = getAllPekanUnlockStates();
    const cleanScheduleId = (scheduleId || '').trim();
    const payload: Record<string, boolean> = {};

    if (cleanScheduleId) {
      const totalPekans = getProgramTotalPekan(progId);
      if (!hasScheduleUnlockConfig(current, cleanScheduleId)) {
        for (let i = 1; i <= totalPekans; i++) {
          const fallbackOpen = isPekanUnlocked(progId, i);
          const schedKey = `${cleanScheduleId}-pekan-${i}`;
          current[schedKey] = fallbackOpen;
          payload[schedKey] = fallbackOpen;
        }
      }
      const targetKey = `${cleanScheduleId}-pekan-${num}`;
      current[targetKey] = isUnlocked;
      payload[targetKey] = isUnlocked;
    } else {
      const keys = [
        `${progId}-pekan-${num}`,
        `tl-level-${levelNum}-pekan-${num}`,
        `level-${levelNum}-pekan-${num}`,
        `${levelNum}-pekan-${num}`
      ];
      for (const k of keys) {
        current[k] = isUnlocked;
      }
      payload[`${progId}-pekan-${num}`] = isUnlocked;
    }

    localStorage.setItem(PEKAN_UNLOCK_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('pekan-unlock-updated'));
    window.dispatchEvent(new Event('storage'));

    // Asynchronously push to cPanel api.php
    try {
      fetch('./api.php?entity=pekan_unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch((e) => console.warn('Pekan unlock sync warning:', e));
    } catch {
      // Ignore background fetch error
    }
  } catch (err) {
    console.error('Failed to save pekan unlock state:', err);
  }
}

export function getProgramTotalPekan(programId: string): number {
  return programId === 'tl-level-1' ? 22 : 16;
}

export function setPekanUnlockBatch(
  programId: string,
  maxPekanOpen: number,
  totalPekans: number = getProgramTotalPekan(programId || 'tl-level-1'),
  scheduleId?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const progId = programId || 'tl-level-1';
    const levelNum = parseLevelNum(progId);
    const current = getAllPekanUnlockStates();
    const cleanScheduleId = (scheduleId || '').trim();
    const payload: Record<string, boolean> = {};

    for (let i = 1; i <= totalPekans; i++) {
      const isOpen = i <= maxPekanOpen;
      if (cleanScheduleId) {
        const k = `${cleanScheduleId}-pekan-${i}`;
        current[k] = isOpen;
        payload[k] = isOpen;
      } else {
        const keys = [
          `${progId}-pekan-${i}`,
          `tl-level-${levelNum}-pekan-${i}`,
          `level-${levelNum}-pekan-${i}`,
          `${levelNum}-pekan-${i}`
        ];
        for (const k of keys) {
          current[k] = isOpen;
        }
        payload[`${progId}-pekan-${i}`] = isOpen;
      }
    }

    localStorage.setItem(PEKAN_UNLOCK_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('pekan-unlock-updated'));
    window.dispatchEvent(new Event('storage'));

    try {
      fetch('./api.php?entity=pekan_unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch((e) => console.warn('Batch pekan unlock sync warning:', e));
    } catch {
      // Ignore background fetch error
    }
  } catch (err) {
    console.error('Failed to set batch pekan unlock:', err);
  }
}

export function setAllPekansUnlockState(
  programId: string,
  isUnlocked: boolean,
  totalPekans: number = getProgramTotalPekan(programId || 'tl-level-1'),
  scheduleId?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const progId = programId || 'tl-level-1';
    const levelNum = parseLevelNum(progId);
    const current = getAllPekanUnlockStates();
    const cleanScheduleId = (scheduleId || '').trim();
    const payload: Record<string, boolean> = {};

    for (let i = 1; i <= totalPekans; i++) {
      if (cleanScheduleId) {
        const k = `${cleanScheduleId}-pekan-${i}`;
        current[k] = isUnlocked;
        payload[k] = isUnlocked;
      } else {
        const keys = [
          `${progId}-pekan-${i}`,
          `tl-level-${levelNum}-pekan-${i}`,
          `level-${levelNum}-pekan-${i}`,
          `${levelNum}-pekan-${i}`
        ];
        for (const k of keys) {
          current[k] = isUnlocked;
        }
        payload[`${progId}-pekan-${i}`] = isUnlocked;
      }
    }

    localStorage.setItem(PEKAN_UNLOCK_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('pekan-unlock-updated'));
    window.dispatchEvent(new Event('storage'));

    try {
      fetch('./api.php?entity=pekan_unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch((e) => console.warn('All pekan unlock sync warning:', e));
    } catch {
      // Ignore background fetch error
    }
  } catch (err) {
    console.error('Failed to set all pekans unlock:', err);
  }
}

export async function syncPekanUnlockFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  const cacheBuster = `_t=${Date.now()}`;
  try {
    const res = await fetch(`./api.php?entity=pekan_unlock&${cacheBuster}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && typeof serverData === 'object' && Object.keys(serverData).length > 0) {
        const current = getAllPekanUnlockStates();
        const merged = { ...current, ...serverData };
        localStorage.setItem(PEKAN_UNLOCK_STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new Event('pekan-unlock-updated'));
        window.dispatchEvent(new Event('storage'));
        return;
      }
    }
  } catch {
    // If api.php fails, fallback to pekan_unlock.json
  }

  try {
    const resJson = await fetch(`./pekan_unlock.json?${cacheBuster}`, {
      cache: 'no-store'
    });
    if (resJson.ok) {
      const jsonData = await resJson.json();
      if (jsonData && typeof jsonData === 'object' && Object.keys(jsonData).length > 0) {
        const current = getAllPekanUnlockStates();
        const merged = { ...current, ...jsonData };
        localStorage.setItem(PEKAN_UNLOCK_STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new Event('pekan-unlock-updated'));
        window.dispatchEvent(new Event('storage'));
      }
    }
  } catch {
    // Ignore fallback errors
  }
}

export function getWeeklyPekanContent(
  programId: string,
  pekanNumber: number,
  scheduleId?: string
): WeeklyPekanData {
  const safeProgId = programId || 'tl-level-1';
  const maxPekan = getProgramTotalPekan(safeProgId);
  const safePekan = Math.max(1, Math.min(maxPekan, pekanNumber || 1));
  const key = `${safeProgId}-pekan-${safePekan}`;
  const unlocked = isPekanUnlocked(safeProgId, safePekan, scheduleId);

  // Check if superadmin has saved custom overrides for this pekan
  const overrides = getAllCustomMateriOverrides();
  if (overrides[key]) {
    return {
      ...overrides[key],
      isUnlocked: unlocked
    };
  }

  if (safeProgId === 'tl-level-1') {
    if (LEVEL_1_PEKAN_MAP[safePekan]) {
      return {
        ...LEVEL_1_PEKAN_MAP[safePekan],
        isUnlocked: unlocked
      };
    }
    // Dynamic generation for Pekan 13–22 in Level 1 from LEVEL_1_MATERI_TABLE
    const tableItem = LEVEL_1_MATERI_TABLE[safePekan - 1];
    if (tableItem) {
      return {
        pekanNumber: safePekan,
        moduleIndex: safePekan - 1,
        title: `${tableItem.pekan}: ${tableItem.title}`,
        arabicTitle: tableItem.arabicTerm,
        kitabReference: `Modul Tadribul Lughah Jilid 1 — ${tableItem.code}`,
        youtubeVideoId: '',
        youtubeTitle: `${tableItem.title} (${tableItem.arabicTerm})`,
        youtubeChannel: 'Tadribul Lughah Official',
        targetOutcome: `Memahami dan menguasai kaidah ${tableItem.title} (${tableItem.category}) secara menyeluruh dan aplikatif.`,
        summary: `Pembahasan silabus kurikulum Tadribul Lughah Level 1 pada ${tableItem.pekan} (${tableItem.code}) yang mendalami kaidah ${tableItem.title} (${tableItem.arabicTerm}).`,
        points: [
          `Pengenalan konsep dasar ${tableItem.title}`,
          `Kaidah penulisan dan tanda identifikasi ${tableItem.arabicTerm}`,
          `Contoh kalimat aplikatif dari ayat-ayat Al-Qur'an dan percakapan harian`,
          `Latihan pembentukan dan analisis struktur kalimat (I'rab & Shighah)`
        ],
        rules: [
          `Definisi & Konsep Kaidah: Memahami esensi ${tableItem.title} (${tableItem.arabicTerm}) dan fungsinya dalam struktur tata bahasa fusha.`,
          `Kaidah Aplikatif & Ketentuan I'rab: Penerapan praktis kaidah ${tableItem.arabicTerm} pada pola kalimat sempurna (Jumlah Mufidah).`,
          `Ketentuan Karakteristik & Ciri: Mengenal tanda-tanda identifikasi kaidah dalam kategori ${tableItem.category}.`
        ],
        examples: [
          {
            ar: 'قَرَأَ الطَّالِبُ الكِتَابَ قِرَاءَةً صَحِيحَةً',
            tr: 'Siswa itu membaca buku dengan bacaan yang benar.',
            breakdown: `Aplikasi kaidah ${tableItem.arabicTerm} dalam jumlah mufidah.`
          },
          {
            ar: 'يَتَعَلَّمُ المُسْلِمُونَ اللُّغَةَ العَرَبِيَّةَ لِفَهْمِ القُرْآنِ',
            tr: 'Kaum muslimin mempelajari bahasa Arab untuk memahami Al-Qur’an.',
            breakdown: 'Contoh kalimat aplikatif kaidah bahasa Arab terstruktur.'
          }
        ],
        quizzes: [
          {
            id: 1,
            question: `Apa pokok bahasan utama pada materi ${tableItem.title}?`,
            arabicPrompt: tableItem.arabicTerm,
            options: [
              `Kaidah seputar ${tableItem.arabicTerm}`,
              'Pembahasan tanda baca umum',
              'Pengenalan huruf hijaiyyah',
              'Sejarah perkembangan bahasa'
            ],
            correctIndex: 0,
            explanation: `Materi ${tableItem.code} berfokus secara spesifik pada kaidah ${tableItem.title} (${tableItem.arabicTerm}).`
          },
          {
            id: 2,
            question: `Termasuk dalam kategori apakah pembahasan ${tableItem.code}?`,
            arabicPrompt: tableItem.category,
            options: [
              tableItem.category,
              'Ilmu Balaghah Lanjutan',
              'Ilmu Bayan',
              'Khat & Imla'
            ],
            correctIndex: 0,
            explanation: `Sesuai silabus resmi Tadribul Lughah Level 1, materi ini masuk ke dalam ${tableItem.category}.`
          }
        ],
        vocabularies: [
          { ar: 'دَرْسٌ', id: 'Pelajaran', type: 'Isim' },
          { ar: 'قَاعِدَةٌ', id: 'Kaidah / Hukum', type: 'Isim' },
          { ar: 'فَهْمٌ', id: 'Pemahaman', type: 'Isim' },
          { ar: 'تَطْبِيقٌ', id: 'Aplikasi / Penerapan', type: 'Isim' }
        ],
        isUnlocked: unlocked
      };
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
    youtubeVideoId: '',
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
    ],
    isUnlocked: unlocked
  };
}

export function getProgramPekanList(
  programId: string,
  scheduleId?: string
): WeeklyPekanData[] {
  const result: WeeklyPekanData[] = [];
  const total = getProgramTotalPekan(programId);
  for (let i = 1; i <= total; i++) {
    result.push(getWeeklyPekanContent(programId, i, scheduleId));
  }
  return result;
}
