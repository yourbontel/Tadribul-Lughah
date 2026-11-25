export interface MutholaahItem {
  id: string;
  season: 1 | 2;
  numberLabel: string;
  title?: string;
  instruction: string;
  arabic: string;
  translation: string;
}

export interface MutholaahSeasonMeta {
  season: 1 | 2;
  title: string;
  subtitle: string;
  pages: string;
  description: string;
  tasks: string[];
}

export const MUTHOLAAH_SEASONS: MutholaahSeasonMeta[] = [
  {
    season: 1,
    title: 'Season 1',
    subtitle: 'Dasar & Pengenalan Isim',
    pages: 'Halaman 42–48',
    description:
      'Teks-teks berbahasa Arab pada sesi ini banyak mengambil faidah dari kitab "Durus al-Lughah Li Ghair An-Nathiqhina bihaa". Umumnya kata-kata yang disusun dalam sesi pertama ini masih tergolong mudah, berharakat & digunakan dalam keseharian (familiar).',
    tasks: [
      'Bacalah teks (bahan bacaan) pada setiap materi pelajaran dengan suara yang lantang sesuai dengan kriteria membaca yang baik.',
      'Tulis ulang teks-teksnya guna menajamkan kemampuan menulis bahasa Arab, baiknya dibantu teman atau guru dalam mendiktekannya.',
      'Terjemahkan dengan baik dan benar.',
      'Analisis kaidah-kaidah mukhtarat atau tata bahasa yang tertera pada judul masing-masing teks dengan merujuk kepada buku Durus al-Lughat al-Arabiyyah dan Mukhtarat.'
    ]
  },
  {
    season: 2,
    title: 'Season 2',
    subtitle: 'Pengembangan Kalimat & Fi\'il',
    pages: 'Halaman 91–105',
    description:
      'Teks-teks berbahasa Arab pada sesi ini banyak mengambil faidah dari kitab "Durus al-Lughah Li Ghair An-Nathiqhina bihaa" dan buku-buku muthalaah lainnya. Umumnya kata-kata yang disusun masih tergolong ringan, mudah kemudian tingkat menengah, serta mulai banyak menggunakan kata kerja dalam pola-pola kalimatnya.',
    tasks: [
      'Bacalah teks (bahan bacaan) pada setiap materi pelajaran dengan suara yang lantang sesuai dengan kriteria membaca yang baik.',
      'Tulis ulang teks-teksnya guna menajamkan kemampuan menulis bahasa Arab, baiknya dibantu teman atau guru dalam mendiktekannya.',
      'Terjemahkan dengan baik dan benar.',
      'Analisis kaidah-kaidah mukhtarat atau tata bahasa yang tertera pada judul masing-masing teks dengan merujuk kepada buku Durus al-Lughat al-Arabiyyah dan Mukhtarat.'
    ]
  }
];

export const MUTHOLAAH_LEVEL_1_ITEMS: MutholaahItem[] = [
  // ==================== SEASON 1 ====================
  {
    id: 's1-1',
    season: 1,
    numberLabel: '1',
    instruction: 'Perhatikan kata-kata yang beralif lam dan yang tidak beralif lam.',
    arabic:
      'الْكِتَابُ جَدِيدٌ وَالْقَلَمُ قَدِيمٌ، الْبَيْتُ قَرِيبٌ وَالْمَسْجِدُ بَعِيدٌ. الْمَاءُ بَارِدٌ وَاللَّبَنُ حَارٌّ. الْحِمَارُ صَغِيرٌ وَالْحِصَانُ كَبِيرٌ. الْحَجَرُ ثَقِيلٌ وَالْوَرَقُ خَفِيفٌ وَالْمِنْدِيلُ وَسِخٌ.',
    translation:
      'Buku itu baru dan pena itu lama, rumah itu dekat dan masjid itu jauh. Air itu dingin dan susu itu panas. Keledai itu kecil dan kuda itu besar. Batu itu berat, kertas itu ringan, dan saputangan itu kotor.'
  },
  {
    id: 's1-2',
    season: 1,
    numberLabel: '2',
    instruction: 'Perhatikan huruf jar dan isim setelahnya.',
    arabic:
      'أَنَا مِنَ الْيَابَانِ وَأَنْتَ مِنَ الصِّينِ. هُوَ مِنَ الْهِنْدِ وَهِيَ مِنَ الْفِلِبِّينِ. خَرَجَ الْمُدَرِّسُ مِنَ الْفَصْلِ وَذَهَبَ إِلَى الْمُدِيرِ. خَرَجَ حَامِدٌ مِنَ الْغُرْفَةِ وَذَهَبَ إِلَى الْحَمَّامِ.',
    translation:
      'Saya dari Jepang dan kamu dari Cina. Dia (lk) dari India dan dia (pr) dari Filipina. Guru itu keluar dari kelas dan pergi ke kepala sekolah. Hamid keluar dari kamar dan pergi ke kamar mandi.'
  },
  {
    id: 's1-3',
    season: 1,
    numberLabel: '3',
    instruction: 'Perhatikan kata-kata yang digaris bawahi!',
    arabic:
      'الْوَلَدُ صَغِيرٌ وَالرَّجُلُ كَبِيرٌ. هَذَا الْوَلَدُ طَالِبٌ وَذَلِكَ الرَّجُلُ مُدَرِّسٌ. الطَّالِبُ جَالِسٌ وَالْمُدَرِّسُ قَائِمٌ. اسْمُ الطَّالِبِ مَحْمُودٌ وَاسْمُ الْمُدَرِّسِ سَعِيدٌ.',
    translation:
      'Anak laki-laki itu kecil dan pria dewasa itu besar. Anak laki-laki ini adalah pelajar dan pria itu adalah guru. Pelajar itu duduk dan guru itu berdiri. Nama pelajar itu Mahmud dan nama guru itu Said.'
  },
  {
    id: 's1-4',
    season: 1,
    numberLabel: '4',
    instruction: 'Ingatlah kembali pelajaran isim mudzakar dan muannats.',
    arabic:
      'الْبِنْتُ صَغِيرَةٌ وَالْمَرْأَةُ كَبِيرَةٌ. هَذِهِ الْبِنْتُ طَالِبَةٌ وَتِلْكَ الْمَرْأَةُ مُمَرِّضَةٌ. الْبَيْتُ لِلْبِنْتِ وَذَلِكَ لِلْمَرْأَةِ. بَيْتُ الْبِنْتِ أَمَامَ الْمَدْرَسَةِ وَبَيْتُ الْمَرْأَةِ خَلْفَ الْمَصْنَعِ.',
    translation:
      'Anak perempuan itu kecil dan wanita itu besar. Anak perempuan ini adalah pelajar (pr) dan wanita itu adalah perawat. Rumah itu milik anak perempuan dan itu milik wanita tersebut. Rumah anak perempuan itu di depan sekolah dan rumah wanita itu di belakang pabrik.'
  },
  {
    id: 's1-5',
    season: 1,
    numberLabel: '5',
    instruction: 'Bacalah dan perhatikan perbedaan alif lam syamsiah & qomariah.',
    arabic:
      'الْبَيْتُ. الدِّيكُ. الْمُدَرِّسُ. الْبَابُ. الطَّالِبُ. السُّكَّرُ. الدَّفْتَرُ. الْأَخُ. الرَّسُولُ. الْوَجْهُ. الصَّدِيقُ. الْقُرْآنُ. الصَّلَاةُ. الْكَعْبَةُ. الرَّأْسُ. الْإِصْبَعُ. الصَّابُونُ. الظُّفْرُ. الْفَجْرُ. الظُّهْرُ. الْعَصْرُ. الْمَغْرِبُ. الْعِشَاءُ. الضَّيْفُ. الزَّهْرَةُ. الْقَمَرُ. الشَّمْسُ.',
    translation:
      'Rumah. Ayam jantan. Guru. Pintu. Pelajar. Gula. Buku tulis. Saudara laki-laki. Rasul. Wajah. Teman. Al-Qur\'an. Shalat. Ka\'bah. Kepala. Jari. Sabun. Kuku. Subuh (Fajar). Dzuhur. Ashar. Maghrib. Isya. Tamu. Bunga. Bulan. Matahari.'
  },
  {
    id: 's1-6',
    season: 1,
    numberLabel: '6',
    instruction: 'Perhatikan kata-kata yang digaris bawahi!',
    arabic:
      'هَذَا رَجُلٌ وَذَلِكَ رَجُلٌ. هَذَا الرَّجُلُ تَاجِرٌ وَذَلِكَ الرَّجُلُ طَبِيبٌ. اسْمُ التَّاجِرِ مَحْمُودٌ وَاسْمُ الطَّبِيبِ سَعِيدٌ. هَذَا الْبَيْتُ لِلتَّاجِرِ وَذَلِكَ الْبَيْتُ لِلطَّبِيبِ. بَيْتُ التَّاجِرِ أَمَامَ الْمَسْجِدِ وَبَيْتُ الطَّبِيبِ خَلْفَ الْمَدْرَسَةِ. لِمَنْ هَذِهِ السَّيَّارَةُ وَلِمَنْ تِلْكَ؟ هَذِهِ السَّيَّارَةُ لِلطَّبِيبِ وَتِلْكَ لِلتَّاجِرِ. هَذِهِ السَّيَّارَةُ مِنَ الْيَابَانِ وَتِلْكَ مِنْ أَمْرِيكَا.',
    translation:
      'Ini seorang pria dan itu seorang pria. Pria ini adalah pedagang dan pria itu adalah dokter. Nama pedagang itu Mahmud dan nama dokter itu Said. Rumah ini milik pedagang itu dan rumah itu milik dokter itu. Rumah pedagang itu di depan masjid dan rumah dokter itu di belakang sekolah. Milik siapa mobil ini dan milik siapa itu? Mobil ini milik dokter dan itu milik pedagang. Mobil ini dari Jepang dan itu dari Amerika.'
  },
  {
    id: 's1-7',
    season: 1,
    numberLabel: '7',
    instruction: 'Telaah baik-baik kaidah yang dalam teks-teks berikut!',
    arabic:
      'هَذَا بَيْتِي. بَيْتِي أَمَامَ الْمَسْجِدِ. بَيْتِي جَمِيلٌ. فِيهِ حَدِيقَةٌ صَغِيرَةٌ. هَذِهِ غُرْفَتِي. فِيهَا نَافِذَةٌ كَبِيرَةٌ وَمِرْوَحَةٌ جَمِيلَةٌ. هَذَا سَرِيرِي وَهَذَا كُرْسِيِّي وَهَذَا مَكْتَبِي. سَاعَتِي وَقَلَمِي وَكِتَابِي عَلَى الْمَكْتَبِ. وَحَقِيبَتِي تَحْتَ الْمَكْتَبِ. نَافِذَةُ غُرْفَتِي مَفْتُوحَةٌ. هَذِهِ غُرْفَةُ أَخِي، وَتِلْكَ غُرْفَةُ أُخْتِي. غُرْفَةُ أَخِي كَبِيرَةٌ وَغُرْفَةُ أُخْتِي صَغِيرَةٌ. غُرْفَةُ أَخِي أَمَامَ غُرْفَتِي وَغُرْفَةُ أُخْتِي أَمَامَ الْمَطْبَخِ. لِي أَخٌ وَاحِدٌ اسْمُهُ أُسَامَةُ، وَلِي أُخْتٌ وَاحِدَةٌ اسْمُهَا سُعَادُ. أَبِي وَأُمِّي فِي تِلْكَ الْغُرْفَةِ الْكَبِيرَةِ. أَنَا أُحِبُّ أَبِي وَأُمِّي، وَأُحِبُّ أَخِي وَأُخْتِي.',
    translation:
      'Ini rumahku. Rumahku di depan masjid. Rumahku indah. Di dalamnya ada taman kecil. Ini kamarku. Di dalamnya ada jendela besar dan kipas angin yang bagus. Ini ranjangku, ini kursiku, dan ini mejaku. Jam tanganku, penaku, dan bukuku di atas meja. Dan tasku di bawah meja. Jendela kamarku terbuka. Ini kamar saudara laki-lakiku, dan itu kamar saudara perempuanku. Kamar saudara laki-lakiku besar dan kamar saudara perempuanku kecil. Kamar saudara laki-lakiku di depan kamarku dan kamar saudara perempuanku di depan dapur. Saya punya satu saudara laki-laki namanya Usamah, dan saya punya satu saudara perempuan namanya Suad. Ayah dan ibuku berada di kamar yang besar itu. Saya mencintai ayah dan ibuku, dan saya mencintai saudara laki-laki dan saudara perempuanku.'
  },
  {
    id: 's1-8',
    season: 1,
    numberLabel: '8',
    instruction: 'Hafalkan kosa kata nama hari dan nama bulan.',
    arabic:
      'أَيَّامُ الْأُسْبُوعِ هِيَ: السَّبْتُ، الْأَحَدُ، الْإِثْنَانِ، الثُّلَاثَاءُ، الْأَرْبِعَاءُ، الْخَمِيسُ، الْجُمُعَةُ. وَالشُّهُورُ الْعَرَبِيَّةُ هِيَ: الْمُحَرَّمُ، صَفَرٌ، رَبِيعٌ الْأَوَّلُ، رَبِيعُ الثَّانِي، جُمَادَى الْأُولَى، جُمَادَى الثَّانِيَةُ، رَجَبٌ، شَعْبَانُ، رَمَضَانُ، شَوَّالٌ، ذُو الْقَعْدَةِ، ذُو الْحِجَّةِ.',
    translation:
      'Hari-hari dalam sepekan adalah: Sabtu, Ahad (Minggu), Senin, Selasa, Rabu, Kamis, Jumat. Dan bulan-bulan Arab (Hijriah) adalah: Muharram, Shafar, Rabiul Awal, Rabiul Tsani, Jumadil Ula, Jumadil Tsaniyah, Rajab, Sya\'ban, Ramadhan, Syawal, Dzulqa\'dah, Dzulhijjah.'
  },
  {
    id: 's1-9',
    season: 1,
    numberLabel: '9',
    instruction: 'Perhatikan garis bawah & harokat akhir nama laki-laki & perempuan.',
    arabic:
      'هَذَا ابْنُ حَامِدٍ وَهَذِهِ بِنْتُ يَاسِرٍ. ابْنُ حَامِدٍ جَالِسٌ وَبِنْتُ يَاسِرٍ وَاقِفَةٌ. هَذِهِ آمِنَةُ، هَذَا طَبِيبٌ. تِلْكَ فَاطِمَةُ، وَتِلْكَ مُمَرِّضَةٌ. هَذِهِ مِنَ الْهِنْدِ وَتِلْكَ مِنَ الْيَابَانِ. هَذِهِ طَوِيلَةٌ وَذَلِكَ قَصِيرٌ.',
    translation:
      'Ini anak laki-laki Hamid dan ini anak perempuan Yasir. Anak laki-laki Hamid duduk dan anak perempuan Yasir berdiri. Ini Aminah, ini seorang dokter (lk). Itu Fatimah, dan itu seorang perawat (pr). Ini dari India dan itu dari Jepang. Ini (pr) tinggi dan itu (lk) pendek.'
  },
  {
    id: 's1-10',
    season: 1,
    numberLabel: '10',
    instruction: 'Perhatikan kembali beberapa huruf jar dan isim setelahnya.',
    arabic:
      'الْمَدْرَسَةُ، فِي الْمَدْرَسَةِ، فِي الْبَيْتِ، الْبَيْتُ، الْغُرْفَةُ، الْحَمَّامُ، فِي الْمَطْبَخِ، الْمَكْتَبُ، عَلَى الْمَكْتَبِ، عَلَى الْكُرْسِيِّ، السَّرِيرُ، عَلَى الْكِتَابِ، فِي الْمَسْجِدِ.\nالْغُرْفَةُ، مِنَ الْغُرْفَةِ، مِنَ الْحَمَّامِ، الْمِرْحَاضُ، إِلَى الْمِرْحَاضِ، الْيَابَانُ، الْفِلِبِّينُ، مِنَ الْهِنْدِ، إِلَى الصِّينِ.',
    translation:
      'Sekolah, di dalam sekolah, di dalam rumah, rumah, kamar, kamar mandi, di dalam dapur, meja, di atas meja, di atas kursi, ranjang, di atas buku, di dalam masjid.\nKamar, dari kamar, dari kamar mandi, toilet, ke toilet, Jepang, Filipina, dari India, ke Cina.'
  },
  {
    id: 's1-11',
    season: 1,
    numberLabel: '5*',
    instruction: 'Perhatikan kata ganti yang bersambung dengan isim dan yang tidak. (penomoran kembali ke 5 pada buku)',
    arabic:
      'هُمْ طُلَّابٌ جُدُدٌ. هُمْ زُمَلَائِي. هُمْ فِي فَصْلِي. هُمْ مُجْتَهِدُونَ. أَسْمَاؤُهُمْ: يَاسِرٌ وَزَكَرِيَّا وَمُوسَى وَعَبْدُ اللَّهِ. بَعْضُهُمْ مِنَ الصِّينِ وَبَعْضُهُمْ مِنَ الْيَابَانِ، وَبَعْضُهُمْ مِنْ أَمْرِيكَا.',
    translation:
      'Mereka adalah para pelajar baru. Mereka adalah teman-temanku. Mereka berada di kelasku. Mereka rajin-rajin. Nama-nama mereka: Yasir, Zakaria, Musa, dan Abdullah. Sebagian mereka dari Cina, sebagian dari Jepang, dan sebagian lagi dari Amerika.'
  },
  {
    id: 's1-12',
    season: 1,
    numberLabel: '6*',
    instruction: 'Perhatikan kata ganti yang bersambung dengan isim dan yang tidak.',
    arabic:
      'هِيَ أُخْتُنَا. اسْمُهَا لَيْلَى. بَيْتُنَا الْجَدِيدُ قَرِيبٌ مِنَ الْمَطَارِ. نَحْنُ طُلَّابٌ. أَنَا فِي كُلِّيَّةِ الْهَنْدَسَةِ، وَلَيْلَى فِي كُلِّيَّةِ الطِّبِّ، وَإِبْرَاهِيمُ فِي كُلِّيَّةِ الشَّرِيعَةِ، وَيُوسُفُ فِي كُلِّيَّةِ التِّجَارَةِ.',
    translation:
      'Dia adalah saudara perempuan kami. Namanya Laila. Rumah baru kami dekat dari bandara. Kami adalah para pelajar. Saya di fakultas teknik, Laila di fakultas kedokteran, Ibrahim di fakultas syariah, dan Yusuf di fakultas perdagangan/ekonomi.'
  },
  {
    id: 's1-13',
    season: 1,
    numberLabel: '7*',
    instruction: 'Perhatikan kata-kata yang digaris bawahi!',
    arabic:
      'الْفَتَى الَّذِي فِي سَيَّارَتِنَا زَمِيلِي. هُوَ مِنْ إِنْكِلْتَرَا. اسْمُهُ وِلْيَمُ. هُوَ نَصْرَانِيٌّ. أَبُوهُ أُسْتَاذِي. اسْمُهُ الدُّكْتُورُ إِدْوَرْدُ (يَهْدِيهُمَا اللَّهُ إِلَى الْإِسْلَامِ).',
    translation:
      'Pemuda yang berada di dalam mobil kami itu adalah temanku. Dia dari Inggris. Namanya William. Dia seorang Nasrani. Ayahnya adalah guruku (dosenku). Namanya Doktor Edward (semoga Allah memberi hidayah kepada keduanya menuju Islam).'
  },
  {
    id: 's1-14',
    season: 1,
    numberLabel: '8*',
    instruction: 'Perhatikan kata-kata yang digaris bawahi!',
    arabic:
      'فِي فَصْلِي عَشَرَةُ طُلَّابٍ جُدُدٍ. كُلُّهُمْ مِنْ بِلَادٍ مُخْتَلِفَةٍ. مِنْهُمْ ثَلَاثَةُ طُلَّابٍ مِنَ الْفِلِبِّينِ، وَأَرْبَعَةُ طُلَّابٍ مِنَ الْيَابَانِ، وَطَالِبَانِ مِنَ الصِّينِ، وَطَالِبٌ وَاحِدٌ مِنْ مَالِيزِيَا، وَسَبْعَةُ طُلَّابٍ مِنْ أَمْرِيكَا. وَفِيهِ أَيْضًا خَمْسَةُ طُلَّابٍ مِنْ إِنْكِلْتَرَا، وَثَمَانِيَةُ طُلَّابٍ مِنْ أَلْمَانِيَا، وَسِتَّةُ طُلَّابٍ مِنْ فَرَنْسَا، وَتِسْعَةُ طُلَّابٍ مِنَ الْيُونَانِ.',
    translation:
      'Di kelasku ada sepuluh pelajar baru. Semuanya dari negara yang berbeda-beda. Di antara mereka ada tiga pelajar dari Filipina, empat pelajar dari Jepang, dua pelajar dari Cina, satu pelajar dari Malaysia, dan tujuh pelajar dari Amerika. Di dalamnya juga ada lima pelajar dari Inggris, delapan pelajar dari Jerman, enam pelajar dari Prancis, dan sembilan pelajar dari Yunani.'
  },
  {
    id: 's1-15',
    season: 1,
    numberLabel: '9*',
    instruction: 'Perhatikan isim-isim ma\'rifat & nakirah pada teks berikut ini!',
    arabic:
      'اسْمِي مُحَمَّدٌ. أَنَا طَالِبٌ بِالْجَامِعَةِ، أَنَا طَالِبٌ جَدِيدٌ، أَنَا مِنَ الْهِنْدِ. لُغَتِي الْأُرْدِيَّةُ هِيَ لُغَةٌ سَهْلَةٌ. وَهُوَ زَمِيلِي. هُوَ مِنَ الْيَابَانِ. اسْمُهُ حَمْزَةُ. لُغَتُهُ الْيَابَانِيَّةُ، وَهِيَ لُغَةٌ صَعْبَةٌ. أَبِي فِي الْكُوَيْتِ. هُوَ طَبِيبٌ شَهِيرٌ. أُمِّي أَيْضًا فِي الْكُوَيْتِ مَعَ أَبِي. هِيَ مُدَرِّسَةٌ هُنَاكَ. لِي أَخٌ وَاحِدٌ، اسْمُهُ أُسَامَةُ، وَهُوَ مَعِي هُنَا فِي الْمَدِينَةِ الْمُنَوَّرَةِ. وَلِي أُخْتٌ وَاحِدَةٌ اسْمُهَا زَيْنَبُ، وَهِيَ فِي الْعِرَاقِ مَعَ زَوْجِهَا. زَوْجُهَا مُهَنْدِسٌ.',
    translation:
      'Namaku Muhammad. Saya mahasiswa di universitas, saya mahasiswa baru, saya dari India. Bahasaku bahasa Urdu, ia adalah bahasa yang mudah. Dan dia temanku. Dia dari Jepang. Namanya Hamzah. Bahasanya bahasa Jepang, dan ia adalah bahasa yang sulit. Ayahku di Kuwait. Beliau seorang dokter terkenal. Ibuku juga di Kuwait bersama ayahku. Beliau seorang guru di sana. Saya punya satu saudara laki-laki, namanya Usamah, dan dia bersamaku di sini di Madinah Al-Munawwarah. Dan saya punya satu saudara perempuan namanya Zainab, dan dia di Irak bersama suaminya. Suaminya seorang insinyur.'
  },
  {
    id: 's1-16',
    season: 1,
    numberLabel: '10*',
    instruction: 'Perhatikan isim-isim ma\'rifat pada teks berikut ini!',
    arabic:
      'الْمُدَرِّسُ فِي الْفَصْلِ. وَالْمُدَرِّسُ الْجَدِيدُ عِنْدَ الْمُدِيرِ. الرَّجُلُ الطَّوِيلُ الَّذِي خَرَجَ الْآنَ مِنَ الْمَدْرَسَةِ هُوَ الْمُدِيرُ الْجَدِيدُ. وَالْوَلَدُ الصَّغِيرُ الَّذِي خَرَجَ الْآنَ مِنَ الْفَصْلِ هُوَ ابْنُ الْمُدِيرِ الْجَدِيدِ. وَتِلْكَ السَّيَّارَةُ الْجَمِيلَةُ هِيَ لِلْمُدِيرِ الْجَدِيدِ.',
    translation:
      'Guru itu berada di dalam kelas. Dan guru yang baru berada di sisi kepala sekolah. Pria tinggi yang baru saja keluar dari sekolah itu adalah kepala sekolah yang baru. Dan anak kecil yang baru saja keluar dari kelas itu adalah putra kepala sekolah yang baru. Dan mobil yang bagus itu adalah milik kepala sekolah yang baru.'
  },
  {
    id: 's1-17',
    season: 1,
    numberLabel: '11*',
    instruction: 'Kosa kata pada tangan manusia.',
    arabic:
      'لِي يَدَانِ: يُمْنَى وَيُسْرَى. فِي كُلِّ يَدٍ خَمْسُ أَصَابِعَ، هِيَ: السَّبَّابَةُ، الْوُسْطَى، الْبِنْصِرُ، الْخِنْصِرُ.',
    translation:
      'Saya memiliki dua tangan: kanan dan kiri. Pada setiap tangan ada lima jari, yaitu: (ibu jari/jempol), jari telunjuk, jari tengah, jari manis, dan jari kelingking.'
  },
  {
    id: 's1-18',
    season: 1,
    numberLabel: '12*',
    instruction: 'Jama\' Muannats Salim.',
    arabic:
      'هَؤُلَاءِ الْفَتَيَاتُ زَمِيلَاتِي. هُنَّ طَبِيبَاتٌ مِنْ أَمْرِيكَا. هُنَّ أَخَوَاتٌ. أَبُوهُنَّ الشَّيْخُ بِلَالٌ، وَهُوَ طَبِيبٌ، وَأُمُّهُنَّ أُسْتَاذَتِي. بَيْتُهُنَّ قَرِيبٌ مِنَ الْمَدْرَسَةِ.',
    translation:
      'Para pemudi ini adalah teman-temanku. Mereka adalah para dokter (pr) dari Amerika. Mereka bersaudara. Ayah mereka adalah Syekh Bilal, beliau seorang dokter, dan ibu mereka adalah guruku (pr). Rumah mereka dekat dari sekolah.'
  },
  {
    id: 's1-19',
    season: 1,
    numberLabel: '13*',
    instruction: 'Perhatikan kata-kata yang digaris bawahi!',
    arabic:
      'حَامِدٌ طَبِيبٌ. زَوْجَتُهُ مُدَرِّسَةٌ. اسْمُهَا آمِنَةُ. حَامِدٌ لَهُ أَرْبَعَةُ أَبْنَاءٍ. هُمْ: حَمْزَةُ وَعُثْمَانُ وَأَحْمَدُ وَإِبْرَاهِيمُ. أَحْمَدُ وَحَمْزَةُ طَالِبَانِ. أَحْمَدُ طَالِبٌ مُجْتَهِدٌ وَحَمْزَةُ طَالِبٌ كَسْلَانُ.',
    translation:
      'Hamid seorang dokter. Istrinya seorang guru. Namanya Aminah. Hamid memiliki empat anak laki-laki. Mereka adalah: Hamzah, Utsman, Ahmad, dan Ibrahim. Ahmad dan Hamzah adalah dua orang pelajar. Ahmad pelajar yang rajin sedangkan Hamzah pelajar yang pemalas.'
  },
  {
    id: 's1-20',
    season: 1,
    numberLabel: '14*',
    instruction: 'Perhatikan isim-isim ditinjau dari bangunan akhirnya.',
    arabic:
      'نَحْنُ أَبْنَاءُ الْقَاضِي مُوسَى. هُوَ مَرِيضٌ، هُوَ الْآنَ فِي الْمُسْتَشْفَى. هَذِهِ الطِّفْلَةُ الَّتِي مَعَنَا هِيَ أُخْتُنَا. اسْمُهَا لَيْلَى. بَيْتُنَا الْجَدِيدُ قَرِيبٌ مِنَ الْمَطَارِ.\nنَحْنُ مُسْلِمُونَ. اللَّهُ رَبُّنَا وَالْإِسْلَامُ دِينُنَا وَالنَّبِيُّ مُحَمَّدٌ رَسُولُنَا، هَادٍ لَنَا، وَالْقُرْآنُ الْكَرِيمُ كِتَابُنَا وَالْكَعْبَةُ قِبْلَتُنَا فِيهَا حَجَرٌ أَسْوَدُ وَالْعَرَبِيَّةُ لُغَتُنَا.',
    translation:
      'Kami adalah anak-anak dari hakim Musa. Beliau sedang sakit, beliau sekarang di rumah sakit. Anak kecil (pr) yang bersama kami ini adalah saudara perempuan kami. Namanya Laila. Rumah baru kami dekat dari bandara.\nKami adalah kaum muslimin. Allah Tuhan kami, Islam agama kami, Nabi Muhammad rasul kami yang menjadi pemberi petunjuk bagi kami, Al-Qur\'an Al-Karim kitab kami, Ka\'bah kiblat kami yang di dalamnya terdapat Hajar Aswad (batu hitam), dan bahasa Arab adalah bahasa kami.'
  },
  {
    id: 's1-21',
    season: 1,
    numberLabel: '15*',
    title: 'أُسْرَةُ حَامِدٍ',
    instruction:
      'Perhatikan semua isim dibawah ini dengan meninjau dari bangunan, jenis, jumlah, kejelasan, harokat akhir, penyusun, pengecilan dan nisbahnya. Buatlah tabel yang menentukan pembagiannya.',
    arabic:
      'أُسْرَةُ حَامِدٍ\nحَامِدٌ مُحَامٍ عَرَبِيٌّ. زَوْجَتُهُ مُدَرِّسَةٌ. اسْمُهَا آمِنَةُ. حَامِدٌ لَهُ أَرْبَعَةُ أَبْنَاءٍ. هُمْ: حَمْزَةُ وَزَيْنَبُ وَأَحْمَدُ وَفَاطِمَةُ. وَكُلُّهُمْ مُسْلِمُونَ أَغْنِيَاءُ.\nأَحْمَدُ وَحَمْزَةُ طَالِبَانِ. أَحْمَدُ طَالِبٌ مُجْتَهِدٌ وَحَمْزَةُ طَالِبٌ كَسْلَانُ. زَيْنَبُ وَفَاطِمَةُ طَالِبَتَانِ أَيْضًا. زَيْنَبُ طَالِبَةٌ مُجْتَهِدَةٌ وَفَاطِمَةُ طَالِبَةٌ كَسْلَى.\nقَالَ أَحْمَدُ: عِنْدِي خَمْسَةُ أَقْلَامٍ: هَذَا قَلَمٌ أَحْمَرُ، وَهَذَا قَلَمٌ أَزْرَقُ، وَهَذَا قَلَمٌ أَخْضَرُ، وَهَذَا قَلَمٌ أَسْوَدُ، وَهَذَا قَلَمٌ أَصْفَرُ. وَهَذَا كُتَيِّبٌ مَدْرَسِيٌّ لِي. وَعِنْدِي خَمْسَةُ مَفَاتِيحَ.\nقَالَ حَمْزَةُ: عِنْدِي مَفَاتِيحُ كَثِيرَةٌ أَيْضًا. هَذَا مِفْتَاحُ الْغُرْفَةِ، وَهَذَا مِفْتَاحُ الْحَقِيبَةِ، وَهَذَا مِفْتَاحُ السَّيَّارَةِ. هَذَا الْمِفْتَاحُ أَحْسَنُ مِنْ مِفْتَاحِكَ.\nقَالَتْ زَيْنَبُ: عِنْدِي مَنَادِيلُ كَثِيرَةٌ. هَذَا أَبْيَضُ، وَهَذَا أَصْفَرُ، وَهَذَا أَحْمَرُ، وَهَذَا أَزْرَقُ. قَالَتْ لَهَا فَاطِمَةُ: أَعِنْدَكِ مِنْدِيلٌ أَخْضَرُ؟ قَالَتْ: لَا. مَا عِنْدِي مِنْدِيلٌ أَخْضَرُ.\nقَالَ حَامِدٌ: يَا أَبْنَائِي، فِي بَلَدِنَا مَسَاجِدُ وَمَدَارِسُ كَثِيرَةٌ، وَفَنَادِقُ قَلِيلَةٌ. فِي هَذَا الشَّارِعِ ثَلَاثَةُ مَسَاجِدَ. ذَهَبْتُ إِلَى بَغْدَادَ وَتُرْكِيَا، فِي إِصْطَنْبُولَ مَسَاجِدُ كَثِيرَةٌ أَيْضًا.',
    translation:
      'Keluarga Hamid\nHamid adalah seorang pengacara Arab. Istrinya seorang guru. Namanya Aminah. Hamid memiliki empat orang anak. Mereka adalah: Hamzah, Zainab, Ahmad, dan Fatimah. Dan mereka semua adalah orang-orang muslim yang kaya.\nAhmad dan Hamzah adalah dua pelajar. Ahmad pelajar yang rajin sedangkan Hamzah pelajar yang pemalas. Zainab dan Fatimah juga dua pelajar (pr). Zainab pelajar (pr) yang rajin sedangkan Fatimah pelajar (pr) yang pemalas.\nAhmad berkata: "Saya punya lima pena: ini pena merah, ini pena biru, ini pena hijau, ini pena hitam, dan ini pena kuning. Dan ini buku kecil (buku saku) sekolah milikku. Dan saya punya lima kunci."\nHamzah berkata: "Saya juga punya banyak kunci. Ini kunci kamar, ini kunci tas, dan ini kunci mobil. Kunci ini lebih bagus daripada kuncimu."\nZainab berkata: "Saya punya banyak saputangan. Ini putih, ini kuning, ini merah, dan ini biru." Fatimah bertanya kepadanya: "Apakah kamu punya saputangan hijau?" Dia menjawab: "Tidak. Saya tidak punya saputangan hijau."\nHamid berkata: "Wahai anak-anakku, di negeri kita ada banyak masjid dan sekolah, dan sedikit hotel. Di jalan ini ada tiga masjid. Saya telah pergi ke Baghdad dan Turki, di Istanbul juga ada banyak masjid."'
  },
  {
    id: 's1-22',
    season: 1,
    numberLabel: '16*',
    title: 'مَدْرَسَتِي',
    instruction:
      'Perhatikan semua isim dibawah ini dengan meninjau dari bangunan, jenis, jumlah, kejelasan, harokat akhir, penyusun, pengecilan dan nisbahnya. Buatlah tabel yang menentukan pembagiannya.',
    arabic:
      'مَدْرَسَتِي\nهَذِهِ مَدْرَسَتِي. هِيَ قَرِيبَةٌ مِنَ الْمَسْجِدِ. هِيَ مَدْرَسَةٌ كَبِيرَةٌ لَهَا ثَلَاثَةُ أَبْوَابٍ. أَبْوَابُهَا مَفْتُوحَةٌ الْآنَ.\nفِي الْمَدْرَسَةِ فُصُولٌ كَثِيرَةٌ. هَذَا فَصْلُنَا. وَهُوَ فَصْلٌ وَاسِعٌ. فِيهِ نَافِذَتَانِ كَبِيرَتَانِ. وَفِيهِ مَكَاتِبُ وَكَرَاسِيُّ. وَفِيهِ سَبُّورَةٌ كَبِيرَةٌ. هَذَا مَكْتَبُ الْمُدَرِّسِ وَذَاكَ كُرْسِيُّهُ. وَتِلْكَ مَكَاتِبُ الطُّلَّابِ وَكَرَاسِيُّهُمْ. مَكْتَبُ الْمُدَرِّسِ كَبِيرٌ وَمَكَاتِبُ الطُّلَّابِ صَغِيرَةٌ.\nفِي فَصْلِنَا عَشَرَةُ طُلَّابٍ. وَهُمْ مِنْ بِلَادٍ مُخْتَلِفَةٍ. هَذَا مُحَمَّدٌ وَهُوَ مِنَ الْيَابَانِ. وَهَذَا خَالِدٌ وَهُوَ مِنَ الصِّينِ. وَهَذَا أَحْمَدُ وَهُوَ مِنَ الْهِنْدِ. وَهَذَا إِبْرَاهِيمُ وَهُوَ مِنْ غَانَا. وَهَذَا إِسْمَاعِيلُ وَهُوَ مِنْ نِيجِيرِيَا. وَهَذَا يُوسُفُ وَهُوَ مِنْ إِنْكِلْتَرَا. وَهَذَا بَيْرَمُ وَهُوَ مِنْ تُرْكِيَا وَهُوَ تُرْكِيٌّ. وَهَذَا عَمَّارٌ وَهُوَ مِنْ مَالِيزِيَا. وَهَذَا عَلِيٌّ وَهُوَ مِنْ أَمْرِيكَا. وَهَذَا أَبُو بَكْرٍ وَهُوَ مِنَ الْيُونَانِ.\nهُمْ مِنْ بِلَادٍ مُخْتَلِفَةٍ، وَلُغَاتُهُمْ مُخْتَلِفَةٌ وَأَلْوَانُهُمْ مُخْتَلِفَةٌ. وَلَكِنَّ دِينَهُمْ وَاحِدٌ، وَرَبُّهُمْ وَاحِدٌ، وَنَبِيُّهُمْ وَاحِدٌ، وَقِبْلَتُهُمْ وَاحِدَةٌ. هُمْ مُسْلِمُونَ. وَالْمُسْلِمُونَ إِخْوَةٌ. هَذَا مُدَرِّسُنَا. اسْمُهُ الشَّيْخُ بِلَالٌ. وَهُوَ مِنَ الْمَدِينَةِ. وَهُوَ رَجُلٌ صَالِحٌ. نَحْنُ نُحِبُّهُ كَثِيرًا.',
    translation:
      'Sekolahku\nIni sekolahku. Sekolah ini dekat dari masjid. Ini adalah sekolah yang besar, memiliki tiga pintu. Pintu-pintunya terbuka sekarang.\nDi sekolah ada banyak kelas. Ini kelas kami. Ia adalah kelas yang luas. Di dalamnya ada dua jendela yang besar. Di dalamnya ada meja-meja dan kursi-kursi. Dan di dalamnya ada papan tulis yang besar. Ini meja guru dan itu kursinya. Dan itu meja-meja para siswa beserta kursi-kursi mereka. Meja guru besar sedangkan meja-meja para siswa kecil.\nDi kelas kami ada sepuluh siswa. Mereka berasal dari negara yang berbeda-beda. Ini Muhammad dan dia dari Jepang. Ini Khalid dan dia dari Cina. Ini Ahmad dan dia dari India. Ini Ibrahim dan dia dari Ghana. Ini Ismail dan dia dari Nigeria. Ini Yusuf dan dia dari Inggris. Ini Bairam, dia dari Turki dan dia orang Turki. Ini Ammar dan dia dari Malaysia. Ini Ali dan dia dari Amerika. Dan ini Abu Bakar dan dia dari Yunani.\nMereka berasal dari negara yang berbeda-beda, bahasa mereka berbeda-beda, dan warna kulit mereka berbeda-beda. Akan tetapi agama mereka satu, Tuhan mereka satu, Nabi mereka satu, dan kiblat mereka satu. Mereka adalah kaum muslimin. Dan kaum muslimin itu bersaudara. Ini guru kami. Namanya Syekh Bilal. Beliau dari Madinah. Beliau adalah pria yang saleh. Kami sangat mencintai beliau.'
  },

  // ==================== SEASON 2 ====================
  {
    id: 's2-1',
    season: 2,
    numberLabel: '1',
    instruction: 'Perhatikan kata-kata yang digaris bawahi! Jelaskan pada temanmu!',
    arabic:
      'دَخَلَ الْمُدِيرُ الصَّفَّ وَمَعَهُ مُدَرِّسٌ جَدِيدٌ. وَقَفَ التَّلَامِيذُ وَالْمُدِيرُ قَالَ: هَذَا مُدَرِّسُ اللُّغَةِ الْعَرَبِيَّةِ الْجَدِيدُ اسْمُهُ حَسَنٌ وَهُوَ سُعُودِيٌّ؛ جَاءَ مِنَ السُّعُودِيَّةِ، وَهُوَ مُدَرِّسٌ جَدِيدٌ. خَرَجَ الْمُدِيرُ مِنَ الصَّفِّ وَجَلَسَ التَّلَامِيذُ عَلَى الْكُرْسِيِّ. قَالَ الْمُدَرِّسُ: اللُّغَةُ الْعَرَبِيَّةُ أَرْبَعُ حِصَصٍ فِي الْأُسْبُوعِ وَحِصَّةُ الْيَوْمِ قِرَاءَةٌ.',
    translation:
      'Kepala sekolah masuk ke kelas dan bersamanya ada seorang guru baru. Para murid berdiri lalu kepala sekolah berkata: "Ini guru bahasa Arab yang baru, namanya Hasan dan beliau berkebangsaan Saudi; beliau datang dari Arab Saudi, dan beliau adalah guru baru." Kepala sekolah keluar dari kelas dan para murid duduk di atas kursi. Guru berkata: "Pelajaran bahasa Arab ada empat jam pelajaran dalam sepekan, dan pelajaran hari ini adalah membaca (qiraah)."'
  },
  {
    id: 's2-2',
    season: 2,
    numberLabel: '2',
    instruction: 'Perhatikan kata-kata yang digaris bawahi! Jelaskan pada temanmu!',
    arabic:
      'أَبُوكَ ذَهَبَ إِلَى السُّوقِ. أُمُّكَ ذَهَبَتْ إِلَى خَالَتِكَ زَيْنَبَ. وَإِخْوَتُكَ ذَهَبُوا إِلَى الْجَامِعَةِ. وَأَخَوَاتُكَ ذَهَبْنَ إِلَى الْمَدْرَسَةِ. أَمَّا أَنَا ذَهَبْتُ إِلَى الْمَدْرَسَةِ الْيَوْمَ وَرَجَعْتُ بَعْدَ الْحِصَّةِ الْأُولَى، لِأَنَّنِي مَرِيضٌ.',
    translation:
      'Ayahmu pergi ke pasar. Ibumu pergi ke tempat bibimu (dari pihak ibu) Zainab. Saudara-saudara laki-lakimu pergi ke universitas. Saudara-saudara perempuanmu pergi ke sekolah. Adapun saya pergi ke sekolah hari ini dan pulang setelah jam pelajaran pertama, karena saya sakit.'
  },
  {
    id: 's2-3',
    season: 2,
    numberLabel: '3',
    instruction: 'Baca dan harakatilah teks & perhatikan kata-kata yang digaris bawahi!',
    arabic:
      'رَجَعْتُ مِنَ الْمَدْرَسَةِ قَبْلَ نِصْفِ سَاعَةٍ، قَرَأْتُ الْيَوْمَ دَرْسًا جَدِيدًا فِي الْفِقْهِ، وَفَهِمْتُهُ جَيِّدًا. قَرَأْتُ سُورَةَ الرَّحْمَنِ وَحَفِظْتُهَا. فَفَرِحَ بِي الْمُدَرِّسُ كَثِيرًا وَقَالَ: إِنَّكَ أَحْسَنُ طَالِبٍ فِي الْفَصْلِ، زَادَكَ اللَّهُ عِلْمًا يَا بُنَيَّ.',
    translation:
      'Saya pulang dari sekolah setengah jam yang lalu, hari ini saya membaca pelajaran baru dalam ilmu fikih dan memahaminya dengan baik. Saya membaca surah Ar-Rahman dan menghafalnya. Maka guru sangat senang kepadaku dan berkata: "Sesungguhnya kamu adalah pelajar terbaik di kelas, semoga Allah menambah ilmu kepadamu wahai anakku."'
  },
  {
    id: 's2-4',
    season: 2,
    numberLabel: '4',
    instruction: 'Baca dan lengkapi harakatnya & analisis kata-kata yang digaris bawahi!',
    arabic:
      'يَا عَلِيُّ، لَا تَظُنَّ أَنَّنِي غَافِلٌ عَمَّا تَعْمَلُ. إِنَّكَ لَا تَكْتُبُ الدَّرْسَ. إِنَّمَا كَتَبْتَ رِسَالَةً. أَلَيْسَ كَذَلِكَ؟ اكْتُبِ الدَّرْسَ، أَرْجُو أَنْ لَنْ تَعُودَ لِمِثْلِهِ أَبَدًا، أَفَهِمْتَ؟',
    translation:
      'Wahai Ali, jangan kamu kira bahwa saya lalai terhadap apa yang kamu lakukan. Sesungguhnya kamu tidak menulis pelajaran. Kamu hanya menulis surat. Bukankah demikian? Tulislah pelajaran! Saya berharap kamu tidak akan mengulangi hal seperti itu lagi selamanya, apakah kamu paham?'
  },
  {
    id: 's2-5',
    season: 2,
    numberLabel: '5',
    instruction: 'Baca dan lengkapi harakatnya & analisis kata-kata yang digaris bawahi!',
    arabic:
      'كَتَبَ الْمُدَرِّسُ الْأَسْئِلَةَ عَلَى السَّبُّورَةِ. وَلَكِنْ مَا كَتَبَ فَيْصَلٌ الْأَجْوِبَةَ لِأَنَّهُ مَا فَهِمَ الْأَسْئِلَةَ. وَمَا كَتَبَ حَمْزَةُ الْأَجْوِبَةَ لِأَنَّ قَلَمَهُ مَكْسُورٌ.',
    translation:
      'Guru menulis soal-soal di atas papan tulis. Akan tetapi Faisal tidak menulis jawabannya karena dia tidak memahami soal-soal tersebut. Dan Hamzah tidak menulis jawabannya karena penanya patah.'
  },
  {
    id: 's2-6',
    season: 2,
    numberLabel: '6',
    instruction: 'Baca dan lengkapi harakatnya & analisis kata-kata yang digaris bawahi!',
    arabic:
      'ذَهَبْنَا إِلَى الْمَلْعَبِ، وَلَعِبْنَا الْيَوْمَ كُرَةَ الْقَدَمِ. لَعِبْنَا كُرَةَ السَّلَّةِ فِي الْأُسْبُوعِ الْمَاضِي. ذَهَبْنَا أَيْضًا إِلَى الْمَكْتَبَةِ، قَرَأْنَا الصُّحُفَ وَسَمِعْنَا الْأَخْبَارَ مِنَ الْإِذَاعَةِ، سَمِعْنَا مِنْ ثَلَاثِ إِذَاعَاتٍ: مِنْ إِذَاعَةِ الرِّيَاضِ وَإِذَاعَةِ الْقَاهِرَةِ وَإِذَاعَةِ لَنْدَنَ.',
    translation:
      'Kami pergi ke lapangan, dan hari ini kami bermain sepak bola. Kami bermain bola basket pada pekan lalu. Kami juga pergi ke perpustakaan, kami membaca surat kabar dan mendengarkan berita dari siaran radio; kami mendengar dari tiga stasiun radio: radio Riyadh, radio Kairo, dan radio London.'
  },
  {
    id: 's2-7',
    season: 2,
    numberLabel: '7',
    instruction: 'Baca dan lengkapi harakatnya & analisis kata-kata yang digaris bawahi!',
    arabic:
      'هِشَامٌ يَذْهَبُ مَعَ وَالِدِهِ إِلَى السُّوقِ مَسَاءَ الثُّلَاثَاءِ، هِشَامٌ يُسَاعِدُ وَالِدَهُ وَيَحْمِلُ مَعَهُ الْأَشْيَاءَ. الْوَالِدُ يَأْخُذُ مَعَهُ حَقِيبَةً كَبِيرَةً وَهِشَامٌ يَأْخُذُ مَعَهُ حَقِيبَةً صَغِيرَةً، الْوَالِدُ يَشْتَرِي صَحِيفَةً وَمَجَلَّةً وَزُجَاجَةَ حِبْرٍ.',
    translation:
      'Hisyam pergi bersama ayahnya ke pasar pada Selasa sore, Hisyam membantu ayahnya dan membawa barang-barang bersamanya. Sang ayah membawa tas besar dan Hisyam membawa tas kecil, sang ayah membeli koran, majalah, dan sebotol tinta.'
  },
  {
    id: 's2-8',
    season: 2,
    numberLabel: '8',
    instruction: 'Baca dan lengkapi harakatnya & analisis kata-kata yang digaris bawahi!',
    arabic:
      'خَرَجْتُ مِنَ الْمَدْرَسَةِ بَعْدَ صَلَاةِ الظُّهْرِ. أَنَا حَفِظْتُ سُورَةَ الْحَدِيدِ الْيَوْمَ وَهِيَ أَطْوَلُ مِنْ سُورَةِ الرَّحْمَنِ. وَكَذَلِكَ حَفِظْتُ سِتَّ عَشْرَةَ آيَةً مِنْ سُورَةِ النَّبَأِ. وَقَرَأْتُ مَجَلَّةً أَيْضًا مِنْ بَاكِسْتَانَ اسْمُهَا "الْإِسْلَامُ". هِيَ بِاللُّغَةِ الْإِنْكِلِيزِيَّةِ.',
    translation:
      'Saya keluar dari sekolah setelah shalat Dzuhur. Hari ini saya menghafal surah Al-Hadid dan ia lebih panjang daripada surah Ar-Rahman. Demikian juga saya menghafal enam belas ayat dari surah An-Naba\'. Dan saya juga membaca sebuah majalah dari Pakistan yang bernama "Al-Islam". Majalah itu berbahasa Inggris.'
  },
  {
    id: 's2-9',
    season: 2,
    numberLabel: '9',
    instruction: 'Baca dan lengkapi harakatnya & analisis kata-kata yang digaris bawahi!',
    arabic:
      'دَخَلَ الْمُدَرِّسُ الْفَصْلَ وَوَجَدَ فِيهِ خَمْسَةَ عَشَرَ طَالِبًا فَقَطْ، فَقَالَ لَهُمْ: أَيْنَ الطُّلَّابُ الْجُدُدُ الْخَمْسَةُ الَّذِينَ جَاءُوا أَمْسِ؟ قَالَ عَلِيٌّ: حَضَرُوا الْيَوْمَ وَخَرَجُوا قَبْلَ قَلِيلٍ. أَظُنُّ أَنَّهُمْ ذَهَبُوا إِلَى الْمُدِيرِ. رَجَعَ الطُّلَّابُ الْخَمْسَةُ بَعْدَ قَلِيلٍ، فَقَالَ لَهُمُ الْمُدَرِّسُ: إِلَى الْمُدِيرِ ذَهَبْتُمْ؟ قَالُوا: نَعَمْ. ذَهَبْنَا إِلَيْهِ لِأَنَّنَا مَا وَجَدْنَا أَسْمَاءَنَا فِي الْقَائِمَةِ.',
    translation:
      'Guru masuk ke kelas dan mendapati di dalamnya hanya ada lima belas siswa, lalu beliau berkata kepada mereka: "Di mana lima siswa baru yang datang kemarin?" Ali menjawab: "Mereka hadir hari ini dan keluar baru saja. Saya kira mereka pergi menemui kepala sekolah." Kelima siswa itu kembali tidak lama kemudian, lalu guru bertanya kepada mereka: "Apakah kalian pergi ke kepala sekolah?" Mereka menjawab: "Ya. Kami pergi menemuinya karena kami tidak menemukan nama-nama kami di dalam daftar."'
  },
  {
    id: 's2-10',
    season: 2,
    numberLabel: '10',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'حَامِدٌ يَذْهَبُ دَائِمًا إِلَى السُّوقِ بَعْدَ صَلَاةِ الْفَجْرِ. يَرْجِعُ فِي السَّاعَةِ السَّابِعَةِ، وَأَحْيَانًا فِي السَّاعَةِ الثَّامِنَةِ. فِي الْبَيْتِ يَقْرَأُ الصُّحُفَ وَيَسْمَعُ الْأَخْبَارَ مِنَ الْإِذَاعَةِ. يَذْهَبُ إِلَى الْمَصْنَعِ فِي السَّاعَةِ التَّاسِعَةِ وَالنِّصْفِ. يَرْجِعُ فِي السَّاعَةِ الْوَاحِدَةِ وَالنِّصْفِ أَوِ الثَّانِيَةِ.',
    translation:
      'Hamid selalu pergi ke pasar setelah shalat Subuh. Dia pulang pada pukul tujuh, dan terkadang pada pukul delapan. Di rumah dia membaca surat kabar dan mendengarkan berita dari radio. Dia pergi ke pabrik pada pukul setengah sepuluh (09.30). Dia pulang pada pukul setengah dua (13.30) atau pukul dua.'
  },
  {
    id: 's2-11',
    season: 2,
    numberLabel: '11',
    instruction: 'Baca dan lengkapi harakatnya & analisis kata yang digaris bawahi!',
    arabic:
      'السَّاعَةُ تُبَيِّنُ الْوَقْتَ لِدُخُولِ الْمَدْرَسَةِ وَلِلطَّعَامِ وَلِلنَّوْمِ. نَدْخُلُ الْمَدْرَسَةَ فِي السَّاعَةِ السَّابِعَةِ، وَنَسْتَرِيحُ فِي مُنْتَصَفِ السَّاعَةِ التَّاسِعَةِ، وَنَخْرُجُ فِي مُنْتَصَفِ السَّاعَةِ الْوَاحِدَةِ، وَنَتَغَدَّى فِي مُنْتَصَفِ السَّاعَةِ الثَّانِيَةِ ظُهْرًا، وَنَتَعَشَّى فِي السَّاعَةِ السَّابِعَةِ مَسَاءً، وَنَنَامُ فِي السَّاعَةِ الْعَاشِرَةِ لَيْلًا، وَنَصْحُو فِي مُنْتَصَفِ السَّاعَةِ الرَّابِعَةِ فَجْرًا.',
    translation:
      'Jam menunjukkan waktu untuk masuk sekolah, makan, dan tidur. Kami masuk sekolah pada pukul tujuh, beristirahat pada pukul sembilan lewat setengah (09.30), keluar (pulang) pada pukul satu lewat setengah (13.30), makan siang pada pukul dua lewat setengah (14.30) siang, makan malam pada pukul tujuh malam, tidur pada pukul sepuluh malam, dan bangun pada pukul empat lewat setengah (04.30) subuh.'
  },
  {
    id: 's2-12',
    season: 2,
    numberLabel: '12',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'هِشَامٌ يَشْتَرِي مِسْطَرَةً وَطَبَاشِيرَ وَعُلْبَةَ أَلْوَانٍ، عَلِيٌّ يَحْمِلُ السُّكَّرَ وَالدَّجَاجَ وَالزَّيْتَ، وَهِشَامٌ يَحْمِلُ الْحَلْوَى وَالْفَاكِهَةَ وَالشَّايَ، عَلِيٌّ يَحْمِلُ أَشْيَاءَ كَثِيرَةً وَهِشَامٌ يَحْمِلُ أَشْيَاءَ كَثِيرَةً.',
    translation:
      'Hisyam membeli penggaris, kapur tulis, dan sekotak cat warna; Ali membawa gula, ayam, dan minyak, sedangkan Hisyam membawa manisan, buah-buahan, dan teh; Ali membawa banyak barang dan Hisyam juga membawa banyak barang.'
  },
  {
    id: 's2-13',
    season: 2,
    numberLabel: '13',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'قَالَ الْمُدَرِّسُ لِعَلِيٍّ: اقْرَأِ الدَّرْسَ يَا عَلِيُّ. وَقَالَ لِهِشَامٍ: افْتَحِ النَّوَافِذَ، ثُمَّ قَالَ لِحَامِدٍ: اذْهَبْ إِلَى الْحَمَّامِ وَاغْسِلْ يَدَيْكَ. وَقَالَ لِعَلِيٍّ: احْفَظْ سُورَةَ النَّبَأِ.',
    translation:
      'Guru berkata kepada Ali: "Bacalah pelajaran wahai Ali!" Dan beliau berkata kepada Hisyam: "Bukalah jendela-jendela itu!" Kemudian beliau berkata kepada Hamid: "Pergilah ke kamar mandi dan cucilah kedua tanganmu!" Dan beliau berkata kepada Ali: "Hafalkanlah surah An-Naba\'!"'
  },
  {
    id: 's2-14',
    season: 2,
    numberLabel: '14',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'تَحَدَّثَ طَالِبٌ عَنْ نَفْسِهِ، فَقَالَ: اسْمِي خَالِدٌ، أَنَا مِنْ سُورَابَايَا، أُرِيدُ أَنْ أَتَعَلَّمَ اللُّغَةَ الْعَرَبِيَّةَ بِهَذَا الْمَعْهَدِ، وَالْآنَ الْحَمْدُ لِلَّهِ قَدْ تَعَلَّمْتُ كَثِيرًا مِنَ الْعُلُومِ، وَسَأَعُودُ إِلَى مَدِينَتِي لِأُعَلِّمَ النَّاسَ الْإِسْلَامَ وَاللُّغَةَ الْعَرَبِيَّةَ.',
    translation:
      'Seorang pelajar bercerita tentang dirinya, ia berkata: "Namaku Khalid, saya dari Surabaya, saya ingin belajar bahasa Arab di ma\'had (lembaga) ini, dan sekarang alhamdulillah saya telah mempelajari banyak ilmu, dan saya akan kembali ke kotaku untuk mengajarkan Islam dan bahasa Arab kepada masyarakat."'
  },
  {
    id: 's2-15',
    season: 2,
    numberLabel: '15',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'حَجَّ زُمَلَائِي كُلُّهُمْ وَلَكِنَّنِي مَا حَجَجْتُ هَذَا الْعَامَ. مَرِضْتُ أَيَّامَ الْحَجِّ فَبَقِيتُ هُنَا بِالْمَدِينَةِ الْمُنَوَّرَةِ. لَكِنَّنِي حَجَجْتُ قَبْلَ هَذَا خَمْسَ مَرَّاتٍ وَالْحَمْدُ لِلَّهِ.',
    translation:
      'Semua temanku telah menunaikan haji, akan tetapi saya belum berhaji tahun ini. Saya sakit pada hari-hari haji sehingga saya tetap tinggal di sini di Madinah Al-Munawwarah. Namun sebelumnya saya sudah berhaji lima kali, alhamdulillah.'
  },
  {
    id: 's2-16',
    season: 2,
    numberLabel: '16',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'أَنَا أَشُمُّ رَائِحَةً كَرِيهَةً. أَمَا تَشُمُّونَ رَائِحَةً يَا إِخْوَانُ؟ أَظُنُّهَا مِنَ الْحَمَّامِ. إِنَّ الْقُمَامَةَ الَّتِي رَمَاهَا أَحَدُ النَّاسِ سَدَّتِ الْبَالُوعَةَ.',
    translation:
      'Saya mencium bau yang tidak sedap. Tidakkah kalian mencium bau wahai saudara-saudara? Saya kira bau itu berasal dari kamar mandi. Sesungguhnya sampah yang dibuang oleh seseorang telah menyumbat saluran pembuangan.'
  },
  {
    id: 's2-17',
    season: 2,
    numberLabel: '17',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'يَرِنُّ الْجَرَسُ فَيَقُومُ مَرْوَانُ يَفْتَحُ الْبَابَ وَتَدْخُلُ أَخَوَاتُهُ، هُنَّ ذَهَبْنَ لِزِيَارَةِ الْمُدِيرَةِ. مَشَيْنَ لِأَنَّ بَيْتَ الْمُدِيرَةِ قَرِيبٌ مِنْ مَدْرَسَتِهِنَّ. هُوَ بَيْنَ الْمَسْجِدِ وَالْمَدْرَسَةِ. وَجَدْنَهَا، جَلَسْنَ عِنْدَهَا ثُلُثَ سَاعَةٍ وَخَرَجْنَ مِنْ بَيْتِهَا فِي السَّاعَةِ الْخَامِسَةِ.',
    translation:
      'Bel berbunyi, lalu Marwan berdiri membuka pintu dan masuklah saudara-saudara perempuannya; mereka pergi untuk mengunjungi ibu kepala sekolah. Mereka berjalan kaki karena rumah ibu kepala sekolah dekat dari sekolah mereka. Rumah itu berada di antara masjid dan sekolah. Mereka menemuinya, duduk bersamanya selama sepertiga jam (20 menit), dan keluar dari rumahnya pada pukul lima.'
  },
  {
    id: 's2-18',
    season: 2,
    numberLabel: '18',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'إِخْوَتِي كُلُّهُمْ يَدْرُسُونَ فِي الْجَامِعَةِ. عِيسَى – وَهُوَ أَكْبَرُ مِنِّي – يَدْرُسُ فِي كُلِّيَّةِ الطِّبِّ. وَإِبْرَاهِيمُ يَدْرُسُ فِي كُلِّيَّةِ التِّجَارَةِ. وَإِسْحَاقُ يَدْرُسُ فِي كُلِّيَّةِ الْآدَابِ. وَإِسْمَاعِيلُ يَدْرُسُ فِي كُلِّيَّةِ الْعُلُومِ. وَهَؤُلَاءِ الثَّلَاثَةُ أَصْغَرُ مِنِّي. وَأَمَّا الْأَخَوَاتُ فَيَدْرُسْنَ فِي الْمَدْرَسَةِ الْمُتَوَسِّطَةِ. زَيْنَبُ تَدْرُسُ فِي السَّنَةِ الْأُولَى وَسَلْمَى تَدْرُسُ فِي السَّنَةِ الثَّانِيَةِ وَلَيْلَى تَدْرُسُ فِي السَّنَةِ الثَّالِثَةِ.',
    translation:
      'Semua saudara laki-lakiku kuliah di universitas. Isa — dia lebih tua dariku — belajar di fakultas kedokteran. Ibrahim belajar di fakultas perdagangan. Ishaq belajar di fakultas sastra. Ismail belajar di fakultas sains. Ketiga orang ini lebih muda dariku. Adapun saudara-saudara perempuan, mereka belajar di sekolah menengah pertama (SMP). Zainab belajar di kelas satu, Salma di kelas dua, dan Laila di kelas tiga.'
  },
  {
    id: 's2-19',
    season: 2,
    numberLabel: '19',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'هَؤُلَاءِ الْفِتْيَةُ الَّذِينَ مَعِي يَسْكُنُونَ فِي مَهَاجِعِ الْجَامِعَةِ. أَمَّا أَنَا فَأَسْكُنُ مَعَ قَرِيبٍ لِي. أَدْرُسُ فِي كُلِّيَّةِ الْهَنْدَسَةِ. هَؤُلَاءِ يَدْرُسُونَ كُلِّيَّةَ الطِّبِّ. أَنَا مُتَزَوِّجٌ، وَهَؤُلَاءِ لَيْسُوا بِمُتَزَوِّجِينَ.',
    translation:
      'Para pemuda yang bersamaku ini tinggal di asrama universitas. Adapun saya tinggal bersama seorang kerabatku. Saya belajar di fakultas teknik. Mereka ini belajar di fakultas kedokteran. Saya sudah menikah, sedangkan mereka belum menikah.'
  },
  {
    id: 's2-20',
    season: 2,
    numberLabel: '20',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'نَدْرُسُ الْآنَ حَدِيثًا. أَكْتُبُهُ عَلَى السَّبُّورَةِ. فَاكْتُبُوهُ فِي دَفَاتِرِكُمْ. (يَكْتُبُ) "عَنْ أَنَسٍ رَضِيَ اللَّهُ عَنْهُ قَالَ: مَا مَسِسْتُ دِيبَاجًا وَلَا حَرِيرًا أَلْيَنَ مِنْ كَفِّ رَسُولِ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ وَلَا شَمِمْتُ رَائِحَةً قَطُّ أَطْيَبَ مِنْ رَائِحَةِ رَسُولِ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ..." (بَعْدَ هُنَيْهَةٍ) كَتَبْتُمْ يَا أَبْنَائِي؟',
    translation:
      'Sekarang kita mempelajari sebuah hadits. Saya menuliskannya di papan tulis. Maka tulislah ia di buku catatan kalian! (Beliau menulis): "Dari Anas radhiyallahu \'anhu berkata: Aku tidak pernah menyentuh sutra tebal maupun sutra halus yang lebih lembut daripada telapak tangan Rasulullah shallallahu \'alaihi wa sallam, dan aku tidak pernah mencium aroma sama sekali yang lebih harum daripada aroma Rasulullah shallallahu \'alaihi wa sallam..." (Setelah beberapa saat) "Apakah kalian sudah menulis, wahai anak-anakku?"'
  },
  {
    id: 's2-21',
    season: 2,
    numberLabel: '21',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'عَبْدُ اللَّهِ يَدْرُسُ بِجَامِعَةِ الرِّيَاضِ وَإِخْوَتُهُ أَيْضًا يَدْرُسُونَ بِجَامِعَةِ الرِّيَاضِ. وَأَخَوَاتُهُ يَدْرُسْنَ بِالْمَدْرَسَةِ الْمُتَوَسِّطَةِ. زَيْنَبُ تَدْرُسُ فِي السَّنَةِ الْأُولَى.',
    translation:
      'Abdullah kuliah di Universitas Riyadh dan saudara-saudara laki-lakinya juga kuliah di Universitas Riyadh. Sedangkan saudara-saudara perempuannya belajar di sekolah menengah pertama. Zainab belajar di kelas satu.'
  },
  {
    id: 's2-22',
    season: 2,
    numberLabel: '22',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'إِنْدُونِيسِيَا هِيَ وَطَنِي الْعَزِيزُ، أُحِبُّهَا حُبَّ أَبِي وَأُمِّي. الْوَطَنُ هُوَ الْأَرْضُ الَّتِي يُولَدُ الْإِنْسَانُ فِيهَا وَيَسْتَوْطِنُهَا. كُلُّ فَرْدٍ يُحِبُّ وَطَنَهُ، لِأَنَّهُ سَعِيدٌ بِسَعَادَتِهِ وَشَقِيٌّ بِشَقَائِهِ. وَحُبُّ الْوَطَنِ أَنْ يَقُومَ كُلُّ فَرْدٍ بِوَاجِبِهِ، فَالتِّلْمِيذُ يَجِدُّ فِي تَحْصِيلِ الْعُلُومِ، وَالْوَالِدُ يُحْسِنُ تَرْبِيَةَ ابْنِهِ، وَالزَّارِعُ يَجْتَهِدُ فِي عَمَلِهِ، وَالصَّانِعُ يُتْقِنُ صِنَاعَتَهُ. الْوَلَدُ النَّجِيبُ يَجْتَهِدُ صَغِيرًا لِيَكُونَ نَافِعًا لِوَطَنِهِ كَبِيرًا.',
    translation:
      'Indonesia adalah tanah airku yang tercinta, aku mencintainya seperti mencintai ayah dan ibuku. Tanah air adalah bumi tempat manusia dilahirkan dan menetap. Setiap individu mencintai tanah airnya, karena ia bahagia dengan kebahagiaannya dan sedih dengan kesedihannya. Cinta tanah air adalah setiap individu menunaikan kewajibannya; maka murid bersungguh-sungguh dalam menuntut ilmu, orang tua memperbaiki pendidikan anaknya, petani bersungguh-sungguh dalam pekerjaannya, dan perajin/pekerja menyempurnakan karyanya. Anak yang cerdas bersungguh-sungguh sejak kecil agar bermanfaat bagi tanah airnya ketika dewasa.'
  },
  {
    id: 's2-23',
    season: 2,
    numberLabel: '23',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'اسْتَيْقَظَ عُمَرُ مِنَ النَّوْمِ مُبَكِّرًا يَوْمَ الْأَحَدِ، فَقَامَ مِنَ السَّرِيرِ وَرَتَّبَهُ، ثُمَّ تَوَضَّأَ وَلَبِسَ ثَوْبَهُ وَذَهَبَ إِلَى الْمَسْجِدِ لِأَدَاءِ صَلَاةِ الْفَجْرِ مَعَ الْجَمَاعَةِ. وَبَعْدَ الصَّلَاةِ جَلَسَ يَذْكُرُ اللَّهَ تَعَالَى وَيَقْرَأُ الْقُرْآنَ الْكَرِيمَ إِلَى أَنْ تَطْلُعَ الشَّمْسُ، فَصَلَّى صَلَاةَ الشُّرُوقِ رَكْعَتَيْنِ ثُمَّ عَادَ إِلَى مَنْزِلِهِ وَخَلَعَ ثَوْبَهُ.',
    translation:
      'Umar bangun tidur pagi-pagi sekali pada hari Ahad, lalu ia bangkit dari ranjang dan merapikannya, kemudian berwudhu, mengenakan pakaiannya, dan pergi ke masjid untuk menunaikan shalat Subuh berjamaah. Setelah shalat ia duduk berdzikir kepada Allah Ta\'ala dan membaca Al-Qur\'an Al-Karim hingga matahari terbit, lalu ia shalat Syuruq dua rakaat kemudian pulang ke rumahnya dan melepas pakaiannya.'
  },
  {
    id: 's2-24',
    season: 2,
    numberLabel: '24',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'الْمُعَلِّمُ يُعَلِّمُ التَّلَامِيذَ. التَّلَامِيذُ يَتَعَلَّمُونَ الْعُلُومَ. الْأُمُّ تُرَبِّي الْأَطْفَالَ. الْأَبُ يُنْفِقُ عَلَى الْأُسْرَةِ. الْوَلَدُ يَحْتَرِمُ الْوَالِدَيْنِ، وَيُعَظِّمُ الْمُدَرِّسِينَ. الْبَوَّابُ يَحْرُسُ الْبَابَ. الْخَادِمُ يَقْضِي اللَّوَازِمَ. الْخَادِمَةُ تَكْنُسُ الْبَيْتَ وَتُنَظِّفُ الْأَثَاثَ. الطَّبَّاخَةُ تُهَيِّئُ الطَّعَامَ. الْبُسْتَانِيُّ يُحَافِظُ عَلَى الْبُسْتَانِ. الْحُوذِيُّ يَسُوقُ الْعَرَبَةَ. الْبَزَّازُ يَبِيعُ الثِّيَابَ.',
    translation:
      'Guru mengajar para murid. Para murid mempelajari ilmu-ilmu. Ibu mendidik anak-anak. Ayah menafkahi keluarga. Anak menghormati kedua orang tua dan memuliakan para guru. Penjaga pintu menjaga pintu. Pelayan memenuhi kebutuhan-kebutuhan. Pelayan wanita menyapu rumah dan membersihkan perabotan. Koki wanita menyiapkan makanan. Tukang kebun menjaga kebun. Kusir mengendarai kereta kuda. Pedagang kain menjual pakaian.'
  },
  {
    id: 's2-25',
    season: 2,
    numberLabel: '25',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'تَحَدَّثَ مَرْوَانُ عَنْ نَفْسِهِ: أَيْنَ الْكِتَابُ ذُو الْغِلَافِ الْأَحْمَرِ الَّذِي كَانَ فِي غُرْفَتِي، أَنَا أَخَذْتُهُ الْبَارِحَةَ مِنْ مَكْتَبَتِي وَقَرَأْتُ نِصْفَهُ. وَأَيْنَ الْمَجَلَّةُ ذَاتُ الْغِلَافِ الْأَصْفَرِ الَّتِي كَانَتْ تَحْتَ ذَاكَ الْكِتَابِ. هَلْ أَخَذَهَا السَّارِقُ؟',
    translation:
      'Marwan berbicara tentang dirinya: "Di mana buku bersampul merah yang ada di kamarku? Tadi malam aku mengambilnya dari rak bukuku dan membaca setengahnya. Dan di mana majalah bersampul kuning yang berada di bawah buku itu? Apakah pencuri telah mengambilnya?"'
  },
  {
    id: 's2-26',
    season: 2,
    numberLabel: '26',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'يُفْتَحُ الْمَطْعَمُ كُلَّ يَوْمٍ السَّاعَةَ السَّادِسَةَ إِلَّا رُبُعًا. وَالْيَوْمَ فُتِحَ مُتَأَخِّرًا، فُتِحَ السَّاعَةَ السَّادِسَةَ.',
    translation:
      'Restoran itu dibuka setiap hari pada pukul enam kurang seperempat (05.45). Dan hari ini dibuka terlambat, dibuka pada pukul enam tepat (06.00).'
  },
  {
    id: 's2-27',
    season: 2,
    numberLabel: '27',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'سُرِقَ كِتَابِي الْبَارِحَةَ مِنْ غُرْفَتِي وَأَنَا غَائِبَةٌ عَنْهَا. وَسُرِقَتْ مَعَهُ أَشْيَاءُ أُخَرُ: سَاعَتِي وَحِذَائِي وَمُعْظَمُ مَلَابِسِي. عَوَّضَنِي اللَّهُ مِنْهَا.',
    translation:
      'Bukuku dicuri tadi malam dari kamarku saat aku sedang tidak ada di dalamnya. Dan dicuri bersamanya benda-benda lain: jam tanganku, sepatuku, dan sebagian besar pakaianku. Semoga Allah menggantikannya untukku.'
  },
  {
    id: 's2-28',
    season: 2,
    numberLabel: '28',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'يُصْنَعُ الْكِتَابُ مِنَ الْوَرَقِ. يُصْنَعُ الْوَرَقُ مِنَ الْخِرَقِ. يُصْنَعُ الْمَكْتَبُ مِنَ الْخَشَبِ. يُصْنَعُ السُّكَّرُ مِنَ الْقَصَبِ. تُصْنَعُ الْمَلَابِسُ مِنَ الْقُطْنِ. يُصْنَعُ الشَّمْعُ مِنَ الدُّهْنِ. يُصْنَعُ الصَّابُونُ مِنَ الزَّيْتِ. يُصْنَعُ الْحِذَاءُ مِنَ الْجِلْدِ. يُصْنَعُ الْكُوبُ مِنَ الزُّجَاجِ. يُصْنَعُ الزُّجَاجُ مِنَ الرِّمَالِ.',
    translation:
      'Buku dibuat dari kertas. Kertas dibuat dari kain perca. Meja dibuat dari kayu. Gula dibuat dari tebu. Pakaian dibuat dari kapas. Lilin dibuat dari lemak. Sabun dibuat dari minyak. Sepatu dibuat dari kulit. Gelas dibuat dari kaca. Kaca dibuat dari pasir.'
  },
  {
    id: 's2-29',
    season: 2,
    numberLabel: '29',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'مَا جَاءَتِ الْمُدِيرَةُ الْيَوْمَ. أَنَا مَا رَأَيْتُهَا الْيَوْمَ، أَظُنُّ أَنَّهَا ذَهَبَتْ إِلَى مَكَّةَ. إِنَّكِ مُدِيرَةٌ مُجْتَهِدَةٌ. أَنَا مَسْرُورَةٌ بِهَا.',
    translation:
      'Ibu kepala sekolah tidak datang hari ini. Saya tidak melihatnya hari ini, saya kira beliau pergi ke Makkah. Sesungguhnya engkau adalah kepala sekolah yang rajin. Saya merasa senang dengannya.'
  },
  {
    id: 's2-30',
    season: 2,
    numberLabel: '30',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'يَوْمُ الْأَحَدِ هُوَ يَوْمُ الْعُطْلَةِ الْأُسْبُوعِيَّةِ، قَامَ عُمَرُ بِتَنْظِيفِ غُرْفَتِهِ وَتَرْتِيبِهَا، فَتَحَ النَّافِذَةَ لِيَدْخُلَ ضَوْءُ الشَّمْسِ وَيَتَغَيَّرَ الْهَوَاءُ، ثُمَّ كَنَسَهَا وَمَسَحَهَا وَرَتَّبَهَا أَحْسَنَ تَرْتِيبٍ. وَبَعْدَ ذَلِكَ سَاعَدَ عُمَرُ وَالِدَيْهِ فِي تَنْظِيفِ الْبَيْتِ وَتَرْتِيبِهِ، وَمَعَهُ أَخُوهُ الصَّغِيرُ وَأُخْتُهُ الصَّغِيرَةُ، حَتَّى يَصِيرَ الْبَيْتُ نَظِيفًا وَمُرَتَّبًا.',
    translation:
      'Hari Ahad adalah hari libur mingguan. Umar membersihkan dan merapikan kamarnya; ia membuka jendela agar cahaya matahari masuk dan udara berganti, kemudian menyapunya, mengepelnya, dan merapikannya dengan sebaik-baik penataan. Setelah itu Umar membantu kedua orang tuanya membersihkan dan merapikan rumah, bersamanya adik laki-laki dan adik perempuannya, hingga rumah menjadi bersih dan rapi.'
  },
  {
    id: 's2-31',
    season: 2,
    numberLabel: '31',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'الْمُدَرِّسُ: أَنَا أُحِبُّكَ كَثِيرًا يَا هَاشِمُ. إِنَّكَ طَالِبٌ ذَكِيٌّ وَمُجْتَهِدٌ وَذُو خُلُقٍ. إِنَّ سَاعَتَكَ جَمِيلَةٌ، أَغَالِيَةٌ هِيَ أَمْ رَخِيصَةٌ؟\nهَاشِمٌ: وَأَنَا أُحِبُّكَ كَثِيرًا يَا أُسْتَاذُ، لَعَلَّكَ بِخَيْرٍ. هَذِهِ سَاعَةٌ رَخِيصَةٌ جِدًّا. إِنَّهَا بِمِائَةِ رُوبِيَّةٍ فَقَطْ يَا أُسْتَاذِي.',
    translation:
      'Guru: "Saya sangat menyayangimu wahai Hasyim. Sesungguhnya kamu pelajar yang cerdas, rajin, dan berakhlak baik. Jam tanganmu bagus, apakah ia mahal atau murah?"\nHasyim: "Saya juga sangat menyayangi Bapak wahai Ustadz, semoga Bapak dalam keadaan baik. Ini jam tangan yang sangat murah. Harganya hanya seratus rupee wahai Ustadzku."'
  },
  {
    id: 's2-32',
    season: 2,
    numberLabel: '32',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'الْكَلْبُ حَيَوَانٌ أَمِينٌ، يَحْرُسُ الْمَنَازِلَ وَالْمَزَارِعَ، وَيُسَاعِدُ الصَّيَّادَ وَقْتَ الصَّيْدِ، وَيُحِبُّ صَاحِبَهُ وَيُطِيعُهُ.',
    translation:
      'Anjing adalah hewan yang setia, ia menjaga rumah-rumah dan ladang-ladang, membantu pemburu saat berburu, serta mencintai dan menaati pemiliknya.'
  },
  {
    id: 's2-33',
    season: 2,
    numberLabel: '33',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'خَلَقَ اللَّهُ الْأَشْجَارَ، وَخَلَقَ فِي الْأَشْجَارِ الْأَوْرَاقَ وَالْأَزْهَارَ، وَالْأَزْهَارُ كَثِيرَةُ الْأَنْوَاعِ، وَأَلْوَانُهَا مُخْتَلِفَةٌ، فَمِنْهَا الْأَحْمَرُ، وَمِنْهَا الْأَصْفَرُ، وَمِنْهَا الْأَبْيَضُ، وَرَوَائِحُهَا عَطِرَةٌ، وَأَشْكَالُهَا بَدِيعَةٌ. فَوَائِدُ الْأَزْهَارِ كَثِيرَةٌ، فَمِنْهَا تَخْرُجُ الثِّمَارُ، وَالشَّرَابُ، وَالْعِطْرُ، وَالدَّوَاءُ. نَحْنُ نُحِبُّ الْأَزْهَارَ.',
    translation:
      'Allah menciptakan pepohonan, dan menciptakan pada pepohonan itu dedaunan dan bunga-bunga. Bunga-bunga itu banyak jenisnya dan warnanya bermacam-macam; di antaranya ada yang merah, ada yang kuning, dan ada yang putih. Aromanya harum dan bentuknya indah. Manfaat bunga sangat banyak; darinya keluar buah-buahan, minuman, parfum, dan obat-obatan. Kami menyukai bunga-bunga.'
  },
  {
    id: 's2-34',
    season: 2,
    numberLabel: '34',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'اسْمِي هِشَامٌ. أَنَا مِنَ الْوِلَايَاتِ الْمُتَّحِدَةِ. إِنِّي مِنْ نِيُويُورْكَ. إِنِّي مُتَزَوِّجٌ، زَوْجَتِي لَيْسَتْ بِمُسْلِمَةٍ. لِي سِتَّةُ أَبْنَاءٍ، بَعْضُهُمْ تُجَّارٌ وَبَعْضُهُمْ مُهَنْدِسُونَ. وَلِي خَمْسُ بَنَاتٍ، بَعْضُهُنَّ فِي الْمَدْرَسَةِ الِابْتِدَائِيَّةِ وَبَعْضُهُنَّ فِي الْمَدْرَسَةِ الْمُتَوَسِّطَةِ.',
    translation:
      'Namaku Hisyam. Saya berasal dari Amerika Serikat. Saya dari New York. Saya sudah menikah, istri saya bukan seorang muslimah. Saya memiliki enam anak laki-laki, sebagian mereka pedagang dan sebagian lagi insinyur. Dan saya memiliki lima anak perempuan, sebagian mereka di sekolah dasar (SD) dan sebagian lagi di sekolah menengah pertama (SMP).'
  },
  {
    id: 's2-35',
    season: 2,
    numberLabel: '35',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'جَلَسَ الْمُدَرِّسُ وَقَالَ: أَقَرَأْتُمْ دَرْسَ الْأَمْسِ يَا أَبْنَائِي؟ قَالَ الطُّلَّابُ: نَعَمْ. قَرَأْنَاهُ وَكَتَبْنَاهُ وَحَفِظْنَاهُ. قَالَ الْمُدَرِّسُ: أَفَهِمْتُمُوهُ؟ قَالُوا: نَعَمْ. فَهِمْنَاهُ جَيِّدًا. مَا أَسْهَلَ هَذَا الدَّرْسَ!\nقَالَ عَبْدُ الرَّحْمَنِ: أَنَا مَا فَهِمْتُ فِيهِ ثَلَاثَ كَلِمَاتٍ. قَالَ الْمُدَرِّسُ: مَا هِيَ؟ قَالَ عَبْدُ الرَّحْمَنِ: قَرَأْنَا فِي الدَّرْسِ هَذِهِ الْجُمْلَةَ: "عَادَ جَدِّي مِنَ الْخُرْطُومِ". فَمَا مَعْنَى هَذِهِ الْكَلِمَاتِ الثَّلَاثِ؟ قَالَ الْمُدَرِّسُ: (عَادَ) مَعْنَاهَا (رَجَعَ)، وَ(الْجَدُّ) مَعْنَاهَا (أَبُو الْأَبِ أَوْ أَبُو الْأُمِّ)، وَ(الْخُرْطُومُ) (عَاصِمَةُ السُّودَانِ). أَفَهِمْتَ؟ قَالَ عَبْدُ الرَّحْمَنِ: الْآنَ فَهِمْتُ.',
    translation:
      'Guru duduk dan berkata: "Apakah kalian sudah membaca pelajaran kemarin wahai anak-anakku?" Para siswa menjawab: "Ya. Kami sudah membacanya, menulisnya, dan menghafalnya." Guru bertanya: "Apakah kalian memahaminya?" Mereka menjawab: "Ya. Kami memahaminya dengan baik. Betapa mudahnya pelajaran ini!"\nAbdurrahman berkata: "Saya belum memahami tiga kata di dalamnya." Guru bertanya: "Apa saja itu?" Abdurrahman berkata: "Kami membaca kalimat ini dalam pelajaran: \'Kakekku pulang dari Khartoum.\' Apa arti ketiga kata ini?" Guru menjelaskan: "(\'Ada) artinya (kembali/pulang), (Al-Jadd) artinya (ayahnya ayah atau ayahnya ibu/kakek), dan (Al-Khartoum) adalah (ibukota Sudan). Apakah kamu paham?" Abdurrahman menjawab: "Sekarang saya paham."'
  },
  {
    id: 's2-36',
    season: 2,
    numberLabel: '36',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'قَالَ حَامِدٌ: مَاذَا تَفْعَلِينَ يَا أُمَّ أَحْمَدَ؟ أَجَابَتْ أُمُّ أَحْمَدَ: أَبْحَثُ عَنِ الدَّوَاءِ الَّذِي أَخَذْتُهُ مِنَ الْمُسْتَشْفَى أَمْسِ. قَالَ: هُوَ عَلَى الْمَكْتَبِ فِي غُرْفَتِي، كَيْفَ حَالُكِ الْيَوْمَ؟ لَعَلَّكِ الْيَوْمَ أَحْسَنُ. قَالَتْ: نَعَمْ، أَنَا الْيَوْمَ أَحْسَنُ وَالْحَمْدُ لِلَّهِ. قَالَ: مَتَى تَذْهَبِينَ إِلَى الْمُسْتَشْفَى؟ وَقَالَتْ: سَأَذْهَبُ بَعْدَ سَاعَةٍ إِنْ شَاءَ اللَّهُ.',
    translation:
      'Hamid berkata: "Apa yang sedang engkau lakukan wahai Ummu Ahmad?" Ummu Ahmad menjawab: "Saya sedang mencari obat yang saya ambil dari rumah sakit kemarin." Hamid berkata: "Obat itu ada di atas meja di kamarku, bagaimana keadaanmu hari ini? Semoga hari ini engkau lebih baik." Ia menjawab: "Ya, hari ini saya lebih baik, alhamdulillah." Hamid bertanya: "Kapan engkau pergi ke rumah sakit?" Ia menjawab: "Saya akan pergi sejam lagi insya Allah."'
  },
  {
    id: 's2-37',
    season: 2,
    numberLabel: '37',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'تَجِدُونَ الْمُعْجَمَ فِي الْمَكْتَبَةِ الْكَبِيرَةِ الَّتِي أَمَامَ الْمَسْجِدِ. تَجِدُونَ فِيهَا مَعَاجِمَ عَرَبِيَّةً وَأَجْنَبِيَّةً وَمَصَاحِفَ مِنْ بِلَادٍ مُخْتَلِفَةٍ وَصُحُفًا مِنْ أَنْحَاءِ الْعَالَمِ.',
    translation:
      'Kalian akan menemukan kamus di perpustakaan besar yang berada di depan masjid. Di dalamnya kalian akan menemukan kamus-kamus bahasa Arab dan bahasa asing, mushaf-mushaf dari berbagai negeri, serta surat kabar dari penjuru dunia.'
  },
  {
    id: 's2-38',
    season: 2,
    numberLabel: '38',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'أَبِي الْعَزِيزُ... بَارَكَ اللَّهُ فِيكُمْ. السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ.\nأُرْسِلُ إِلَيْكُمْ رِسَالَتِي بَعْدَ أَنْ وَصَلْتُ إِلَى جَاكَرْتَا، وَالْتَحَقْتُ بِمَعْهَدِ تَعْلِيمِ اللُّغَةِ الْعَرَبِيَّةِ وَالْعُلُومِ الْإِسْلَامِيَّةِ. الْمَعْهَدُ نَظِيفٌ، وَالْمُدَرِّسُونَ مَاهِرُونَ، وَالْكُتُبُ مُفِيدَةٌ، وَأَنَا سَعِيدٌ؛ لِأَنِّي أَدْرُسُ مَعَ زُمَلَائِي فِي الْفَصْلِ، وَهُمْ حَضَرُوا مِنْ مُدُنٍ مُخْتَلِفَةٍ لِلدِّرَاسَةِ فِي الْمَعْهَدِ.\nأَبِي الْعَزِيزُ، أَنَا بِخَيْرٍ وَالْحَمْدُ لِلَّهِ، وَأَرْجُو أَنْ تَدْعُوَ اللَّهَ لِي بِالْخَيْرِ، وَإِنْ شَاءَ اللَّهُ سَأَتَعَلَّمُ كَثِيرًا مِنَ اللُّغَةِ الْعَرَبِيَّةِ وَالْعُلُومِ الْإِسْلَامِيَّةِ، وَسَأَعُودُ إِلَى مَدِينَتِي لِأُعَلِّمَ مَا تَعَلَّمْتُهُ لِلنَّاسِ، بَلِّغْ أُمِّي سَلَامِي.',
    translation:
      'Ayahku tercinta... semoga Allah memberkahi kalian. Assalamu\'alaikum warahmatullahi wabarakatuh.\nSaya mengirimkan suratku kepada kalian setelah saya tiba di Jakarta dan bergabung dengan Ma\'had Pengajaran Bahasa Arab dan Ilmu-ilmu Islam. Ma\'hadnya bersih, para pengajarnya mahir, buku-bukunya bermanfaat, dan saya senang; karena saya belajar bersama teman-temanku di kelas, dan mereka datang dari kota-kota yang berbeda untuk belajar di ma\'had.\nAyahku tercinta, saya dalam keadaan baik alhamdulillah, dan saya berharap Ayah mendoakan kebaikan untukku kepada Allah. Insya Allah saya akan mempelajari banyak hal tentang bahasa Arab dan ilmu-ilmu Islam, dan saya akan kembali ke kotaku untuk mengajarkan apa yang telah saya pelajari kepada masyarakat. Sampaikan salamku kepada Ibu.'
  },
  {
    id: 's2-39',
    season: 2,
    numberLabel: '39',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'قَامَ الْمُدَرِّسُ لِيَكْتُبَ عَلَى السَّبُّورَةِ، يَرْسُمُ عَلَى السَّبُّورَةِ أَشْيَاءَ وَيَسْأَلُ كُلًّا مِنَ الطُّلَّابِ: مَاذَا تَرَى عَلَى السَّبُّورَةِ؟ وَيُجِيبُ الطَّالِبُ وَيَقُولُ: أَرَى قَلَمًا وَكِتَابًا.',
    translation:
      'Guru berdiri untuk menulis di papan tulis, beliau menggambar beberapa benda di papan tulis dan bertanya kepada setiap siswa: "Apa yang kamu lihat di papan tulis?" Siswa menjawab dan berkata: "Saya melihat sebuah pena dan sebuah buku."'
  },
  {
    id: 's2-40',
    season: 2,
    numberLabel: '40',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'طَرَقَ وَلَدٌ بَابَ أَحَدِ أَصْحَابِهِ، فَقَالَ: مَنْ بِالْبَابِ؟ أَجَابَهُ: أَنَا. فَقَالَ لَهُ: اذْهَبْ، فَإِنِّي لَا أَعْرِفُ أَحَدًا مِنْ أَصْحَابِي اسْمُهُ أَنَا.',
    translation:
      'Seorang anak mengetuk pintu salah satu temannya, lalu temannya berkata: "Siapa di pintu?" Ia menjawabnya: "Saya." Lalu temannya berkata kepadanya: "Pergilah, karena sesungguhnya aku tidak mengenal seorang pun dari teman-temanku yang bernama \'Saya\'."'
  },
  {
    id: 's2-41',
    season: 2,
    numberLabel: '41',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'يَا أُسْتَاذُ، أَنَا أُرِيدُ أَنْ أَجْلِسَ هُنَا أَمَامَكَ. مَقْعَدِي بَعِيدٌ عَنْكَ. وَمِنْ هُنَاكَ لَا أَرَى مَا تَكْتُبُ عَلَى السَّبُّورَةِ. يُمْكِنُنِي أَنْ أَجْلِسَ هُنَا الْآنَ. هَذَا مَقْعَدُ حَمْزَةَ. وَهُوَ غَائِبٌ مُنْذُ أُسْبُوعٍ.',
    translation:
      'Wahai Ustadz, saya ingin duduk di sini di depan Bapak. Tempat duduk saya jauh dari Bapak. Dari sana saya tidak dapat melihat apa yang Bapak tulis di papan tulis. Saya bisa duduk di sini sekarang. Ini tempat duduk Hamzah. Dan dia tidak hadir sejak sepekan yang lalu.'
  },
  {
    id: 's2-42',
    season: 2,
    numberLabel: '42',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'مَحْمُودٌ طَالِبٌ مُجْتَهِدٌ، لَهُ أُخْتٌ اسْمُهَا سُعَادُ، وَسُعَادُ طَالِبَةٌ مُجْتَهِدَةٌ أَيْضًا.\nكَوَّنَ مَحْمُودٌ جَمَاعَةً لِمُسَاعَدَةِ الطُّلَّابِ الْفُقَرَاءِ، اشْتَرَكَ فِيهَا خَالِدٌ وَعَلِيٌّ، جَمَعَ مَحْمُودٌ نُقُودًا كَثِيرَةً لِمُسَاعَدَةِ هَؤُلَاءِ الطُّلَّابِ، وَسَلَّمَ مَحْمُودٌ تِلْكَ النُّقُودَ لِلْمُدِيرِ، وَوَزَّعَ الْمُدِيرُ النُّقُودَ عَلَى التَّلَامِيذِ الْفُقَرَاءِ.\nوَكَوَّنَتْ سُعَادُ جَمَاعَةً مِنَ الطَّالِبَاتِ لِمُسَاعَدَةِ الطَّالِبَاتِ الْفَقِيرَاتِ، اشْتَرَكَتْ فِيهَا فَاطِمَةُ وَلَيْلَى، جَمَعَتْ سُعَادُ نُقُودًا كَثِيرَةً لِمُسَاعَدَةِ هَؤُلَاءِ الطَّالِبَاتِ الْفَقِيرَاتِ، وَسَلَّمَتْ سُعَادُ تِلْكَ النُّقُودَ لِلْمُدِيرَةِ، وَوَزَّعَتِ الْمُدِيرَةُ النُّقُودَ عَلَى التِّلْمِيذَاتِ الْفَقِيرَاتِ.\nعَلِمَ الْوَالِدُ بِمَا فَعَلَهُ ابْنُهُ مَحْمُودٌ وَابْنَتُهُ سُعَادُ، فَفَرِحَ بِهِمَا وَشَكَرَهُمَا.',
    translation:
      'Mahmud adalah pelajar yang rajin, ia memiliki saudara perempuan bernama Suad, dan Suad juga pelajar yang rajin.\nMahmud membentuk sebuah kelompok untuk membantu para pelajar yang miskin, di dalamnya bergabung Khalid dan Ali. Mahmud mengumpulkan banyak uang untuk membantu para pelajar tersebut, lalu Mahmud menyerahkan uang itu kepada kepala sekolah, dan kepala sekolah membagikan uang itu kepada para murid yang miskin.\nDan Suad membentuk sebuah kelompok dari para siswi untuk membantu para siswi yang miskin, di dalamnya bergabung Fatimah dan Laila. Suad mengumpulkan banyak uang untuk membantu para siswi miskin tersebut, lalu Suad menyerahkan uang itu kepada ibu kepala sekolah, dan ibu kepala sekolah membagikan uang itu kepada para siswi yang miskin.\nSang ayah mengetahui apa yang dilakukan oleh putranya Mahmud dan putrinya Suad, maka beliau pun gembira dengan keduanya dan berterima kasih kepada keduanya.'
  },
  {
    id: 's2-43',
    season: 2,
    numberLabel: '43',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'أَقْسَامُ الْكَلِمَةِ: الِاسْمُ وَالْفِعْلُ وَالْحَرْفُ. الِاسْمُ نَحْوُ: كِتَابٍ، وَقَلَمٍ، وَطَالِبٍ، وَرَجُلٍ، وَمُدَرِّسٍ. وَالْفِعْلُ نَحْوُ: خَرَجَ، وَسَجَدَ، وَيَجْلِسُ، وَيَغْسِلُ، وَاكْتُبْ، وَاقْرَأْ. وَالْحَرْفُ نَحْوُ: فِي، وَإِلَى، وَمِنْ، وَنَعَمْ، وَلَا، وَلَنْ، وَلَمْ، وَالسِّينُ كَمَا فِي "سَآكُلُ".',
    translation:
      'Pembagian kata: Isim (kata benda), Fi\'il (kata kerja), dan Harf (kata tugas/huruf). Isim contohnya: kitab, qalam, thalib, rajul, mudarris. Fi\'il contohnya: kharaja, sajada, yajlisu, yaghsilu, uktub, iqra\'. Dan Harf contohnya: fi, ila, min, na\'am, la, lan, lam, serta huruf sin seperti dalam kata "sa-akulu" (aku akan makan).'
  },
  {
    id: 's2-44',
    season: 2,
    numberLabel: '44',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'فَتَحَ الْمُدَرِّسُ كِتَابَهُ وَقَرَأَ دَرْسًا جَدِيدًا: "خَلَقَ اللَّهُ الشَّمْسَ وَالْقَمَرَ وَالنُّجُومَ وَالْأَرْضَ وَالْبِحَارَ، وَخَلَقَ كُلَّ شَيْءٍ، وَخَلَقَ الْإِنْسَانَ مِنْ طِينٍ..." ثُمَّ قَامَ وَكَتَبَ هَذَا الدَّرْسَ عَلَى السَّبُّورَةِ.\nرَفَعَ مُحَمَّدٌ يَدَهُ وَقَالَ: مَا مَعْنَى (الطِّينِ) يَا أُسْتَاذُ؟ قَالَ الْمُدَرِّسُ: الطِّينُ مَعْنَاهُ (التُّرَابُ الْمُخْتَلِطُ بِالْمَاءِ). وَرَفَعَ فَيْصَلٌ يَدَهُ، فَقَالَ لَهُ الْمُدَرِّسُ: أَعِنْدَكَ سُؤَالٌ يَا فَيْصَلُ؟ قَالَ فَيْصَلٌ: نَعَمْ، عِنْدِي سُؤَالٌ. الْبِحَارُ جَمْعُ الْبَحْرِ؟ قَالَ الْمُدَرِّسُ: نَعَمْ، هُوَ كَذَلِكَ. قَامَ الْحَسَنُ وَقَالَ: مَا جَمْعُ (السَّمَاءِ) يَا أُسْتَاذُ؟ قَالَ الْمُدَرِّسُ: جَمْعُهَا (سَمَاوَاتٌ).',
    translation:
      'Guru membuka bukunya dan membacakan pelajaran baru: "Allah menciptakan matahari, bulan, bintang-bintang, bumi, dan lautan; Dia menciptakan segala sesuatu, dan Dia menciptakan manusia dari tanah liat..." Kemudian beliau berdiri dan menulis pelajaran ini di papan tulis.\nMuhammad mengangkat tangannya dan bertanya: "Apa arti (ath-thin) wahai Ustadz?" Guru menjawab: "Ath-thin artinya (tanah yang bercampur dengan air)." Faisal mengangkat tangannya, lalu guru berkata kepadanya: "Apakah kamu punya pertanyaan wahai Faisal?" Faisal berkata: "Ya, saya punya pertanyaan. Apakah al-bihar itu jamak dari al-bahr?" Guru menjawab: "Ya, benar demikian." Al-Hasan berdiri dan bertanya: "Apa bentuk jamak dari (as-sama\') wahai Ustadz?" Guru menjawab: "Bentuk jamaknya adalah (samawat)."'
  },
  {
    id: 's2-45',
    season: 2,
    numberLabel: '45',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'سَأَشْرَحُ لَكُمْ هَذَا الدَّرْسَ مَرَّةً أُخْرَى الْآنَ. اسْمَعُوا: الْجُمْلَةُ الِاسْمِيَّةُ هِيَ الْجُمْلَةُ الَّتِي أَوَّلُهَا اسْمٌ، نَحْوُ: "السَّيَّارَةُ جَمِيلَةٌ. حَامِدٌ مَرِيضٌ. آمِنَةُ مُجْتَهِدَةٌ". فَكُلُّ جُمْلَةٍ مِنْ هَذِهِ الْجُمَلِ أَوَّلُهَا اسْمٌ، وَهُوَ "الْمُبْتَدَأُ"، وَالْجُزْءُ الثَّانِي هُوَ "الْخَبَرُ".\nالْمُبْتَدَأُ وَالْخَبَرُ مَرْفُوعَانِ. أَمَّا الْجُمْلَةُ الْفِعْلِيَّةُ فَهِيَ الْجُمْلَةُ الَّتِي أَوَّلُهَا فِعْلٌ، نَحْوُ: "دَخَلَ الْمُدَرِّسُ. قَالَ الْمُدِيرُ. يَكْتُبُ الطَّالِبُ". فَفِي كُلِّ جُمْلَةٍ مِنْ هَذِهِ الْجُمَلِ كَلِمَتَانِ. الْكَلِمَةُ الْأُولَى فِعْلٌ وَالْكَلِمَةُ الثَّانِيَةُ اسْمٌ. وَهَذَا الِاسْمُ الَّذِي يَأْتِي بَعْدَ الْفِعْلِ اسْمُهُ "الْفَاعِلُ". الْفَاعِلُ مَرْفُوعٌ. أَفَهِمْتُمْ؟',
    translation:
      'Saya akan menjelaskan pelajaran ini kepada kalian sekali lagi sekarang. Dengarkanlah: Jumlah Ismiyyah adalah kalimat yang diawali oleh isim, contohnya: "As-sayyaratu jamilatun. Hamidun maridhun. Aminatu mujtahidatun." Setiap kalimat dari kalimat-kalimat ini awalnya adalah isim, yaitu "Mubtada\'", dan bagian keduanya adalah "Khabar".\nMubtada\' dan Khabar keduanya marfu\'. Adapun Jumlah Fi\'liyyah adalah kalimat yang diawali oleh fi\'il, contohnya: "Dakhala al-mudarrisu. Qala al-mudiru. Yaktubu ath-thalibu." Pada setiap kalimat ini terdapat dua kata. Kata pertama adalah fi\'il dan kata kedua adalah isim. Dan isim yang datang setelah fi\'il ini namanya adalah "Fa\'il". Fa\'il itu marfu\'. Apakah kalian paham?'
  },
  {
    id: 's2-46',
    season: 2,
    numberLabel: '46',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'الشَّمْسُ تَطْلُعُ وَقْتَ الصَّبَاحِ، وَتَغْرُبُ وَقْتَ الْمَسَاءِ، الْمُعَلِّمُ أَمَامِي، الْحَائِطُ خَلْفِي، الْبَابُ عَلَى يَمِينِي، الشُّبَّاكُ عَلَى يَسَارِي، السَّمَاءُ فَوْقَ رَأْسِي، الْأَرْضُ تَحْتَ قَدَمِي.',
    translation:
      'Matahari terbit pada waktu pagi, dan terbenam pada waktu sore. Guru di depanku, dinding di belakangku, pintu di sebelah kananku, jendela di sebelah kiriku, langit di atas kepalaku, dan bumi di bawah kakiku.'
  },
  {
    id: 's2-47',
    season: 2,
    numberLabel: '47',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'مُحَمَّدٌ وَعَلِيٌّ طَالِبَانِ فِي مَعْهَدِ تَعْلِيمِ اللُّغَةِ الْعَرَبِيَّةِ. هُمَا يَتَعَلَّمَانِ فِي الْمَعْهَدِ، هُمَا مُجْتَهِدَانِ فِي تَعَلُّمِهِمَا، وَفِي مَعْهَدِهِمَا طُلَّابٌ كَثِيرُونَ مِنْهُمْ طَالِبَانِ مِنَ السُّودَانِ، وَطَالِبَانِ مِنْ بَاكِسْتَانَ، وَثَلَاثَةُ طُلَّابٍ مِنْ مَالِيزِيَا، وَخَمْسَةُ طُلَّابٍ مِنْ سُومَطْرَا، وَعِشْرُونَ طَالِبًا مِنْ جَاكَرْتَا. هُمْ طُلَّابٌ مَاهِرُونَ وَمُجْتَهِدُونَ.',
    translation:
      'Muhammad dan Ali adalah dua pelajar di Ma\'had Pengajaran Bahasa Arab. Keduanya belajar di ma\'had, keduanya bersungguh-sungguh dalam belajar, dan di ma\'had mereka berdua ada banyak pelajar: di antaranya dua pelajar dari Sudan, dua pelajar dari Pakistan, tiga pelajar dari Malaysia, lima pelajar dari Sumatra, dan dua puluh pelajar dari Jakarta. Mereka adalah pelajar-pelajar yang pandai dan rajin.'
  },
  {
    id: 's2-48',
    season: 2,
    numberLabel: '48',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'كَانَ حَاجٌّ يَسِيرُ فِي شَارِعِ الْحَرَمِ بِمَكَّةَ الْمُكَرَّمَةِ، فَرَأَى غُلَامًا يَبِيعُ الصُّحُفَ؛ فَنَادَاهُ قَائِلًا: يَا غُلَامُ أَعْطِنِي صَحِيفَةً، وَوَضَعَ الْحَاجُّ يَدَهُ فِي جَيْبِهِ وَيَأْخُذُ وَرَقَةً بِخَمْسِينَ رِيَالًا؛ فَأَخَذَهَا الْغُلَامُ وَانْصَرَفَ، وَغَابَ طَوِيلًا، وَظَنَّ الْحَاجُّ أَنَّهُ قَدْ هَرَبَ بِالرِّيَالَاتِ، فَرَجَعَ الْحَاجُّ إِلَى الْفُنْدُقِ الَّذِي يَنْزِلُ فِيهِ.\nوَفِي الْيَوْمِ التَّالِي كَانَ الْحَاجُّ فِي طَرِيقِهِ إِلَى الْحَرَمِ؛ فَأَسْرَعَ الْغُلَامُ إِلَيْهِ قَائِلًا: هَذِهِ نُقُودُكَ الَّتِي تَرَكْتَهَا مَعِي أَمْسِ، فَعَجِبَ الْحَاجُّ لِأَمَانَتِهِ، وَسَأَلَهُ: مَا اسْمُكَ؟ فَقَالَ: أَنَا أَحْمَدُ، وَهَذَا أَخِي عَلِيٌّ، يُسَاعِدُنِي فِي عَمَلِي، وَنَحْنُ نَسْكُنُ بِجِوَارِ الْحَرَمِ الشَّرِيفِ، فَقَالَ الْحَاجُّ: هَذِهِ الْأَخْلَاقُ إِسْلَامِيَّةٌ، فَهَذَا الدِّينُ الَّذِي يُعَلِّمُنَا الْأَخْلَاقَ.',
    translation:
      'Seorang jamaah haji sedang berjalan di jalan Masjidil Haram di Makkah Al-Mukarramah, lalu ia melihat seorang anak laki-laki menjual koran; ia pun memanggilnya seraya berkata: "Wahai nak, berikan aku satu koran." Jamaah haji itu memasukkan tangannya ke saku dan mengambil selembar uang lima puluh riyal; anak itu mengambilnya lalu pergi dan menghilang cukup lama, hingga jamaah haji itu mengira anak tersebut telah kabur membawa uang riyal itu, lalu ia kembali ke hotel tempat ia menginap.\nPada keesokan harinya, jamaah haji itu sedang dalam perjalanan menuju Masjidil Haram; tiba-tiba anak itu bergegas menghampirinya seraya berkata: "Ini uangmu yang kamu titipkan padaku kemarin." Jamaah haji itu pun takjub akan kejujurannya, lalu bertanya: "Siapa namamu?" Ia menjawab: "Saya Ahmad, dan ini saudaraku Ali yang membantuku bekerja, kami tinggal di sekitar Masjidil Haram yang mulia." Jamaah haji itu berkata: "Inilah akhlak Islami, inilah agama yang mengajarkan akhlak kepada kita."'
  },
  {
    id: 's2-49',
    season: 2,
    numberLabel: '49',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'يَا أَبَتِ، أَنْتَ اشْتَرَيْتَ لِي مِلَفًّا قَبْلَ أُسْبُوعٍ. أُرِيدُ الْآنَ مِلَفًّا آخَرَ. وَأُرِيدُ حَقِيبَةً أَيْضًا، عِنْدِي حَقِيبَةٌ حَمْرَاءُ. أُرِيدُ حَقِيبَةً أُخْرَى سَوْدَاءَ. وَكَذَلِكَ أُرِيدُ مُصْحَفًا ذَا حَرْفٍ كَبِيرٍ وَمُعْجَمًا إِنْكِلِيزِيًّا وَمِسْطَرَةً صَغِيرَةً.',
    translation:
      'Wahai Ayahku, Ayah telah membelikan map untukku sepekan yang lalu. Sekarang saya ingin map yang lain. Saya juga ingin sebuah tas; saya sudah punya tas merah, saya ingin tas lain yang berwarna hitam. Begitu pula saya ingin mushaf yang hurufnya besar, kamus bahasa Inggris, dan penggaris kecil.'
  },
  {
    id: 's2-50',
    season: 2,
    numberLabel: '50',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'لَمْ يَخْلُقِ اللَّهُ حَيَوَانًا بِغَيْرِ سِلَاحٍ لِلدِّفَاعِ عَنْ نَفْسِهِ، فَقَدْ خَلَقَ اللَّهُ لِكُلِّ حَيَوَانٍ سِلَاحًا يُنَاسِبُهُ، فَالْأَسَدُ لَهُ نَابٌ، وَلِلْفِيلِ خُرْطُومٌ، وَلِلثَّوْرِ قَرْنٌ.\nوَقَدْ يَظُنُّ الْإِنْسَانُ أَنَّ الطُّيُورَ الصَّغِيرَةَ لَيْسَ لَهَا سِلَاحٌ، وَلَكِنَّهُ إِذَا نَظَرَ إِلَى الْحَمَامِ وَالْعَصَافِيرِ؛ عَرَفَ أَنَّهَا تَسْتَطِيعُ أَنْ تَطِيرَ بِسُرْعَةٍ، وَتَنْجُوَ بِنَفْسِهَا.',
    translation:
      'Allah tidak menciptakan satu hewan pun tanpa senjata untuk membela dirinya; sungguh Allah telah menciptakan bagi setiap hewan senjata yang sesuai dengannya: singa memiliki taring, gajah memiliki belalai, dan banteng memiliki tanduk.\nTerkadang manusia mengira bahwa burung-burung kecil tidak memiliki senjata, akan tetapi jika ia melihat merpati dan burung pipit, ia akan tahu bahwa mereka mampu terbang dengan cepat dan menyelamatkan dirinya.'
  },
  {
    id: 's2-51',
    season: 2,
    numberLabel: '51',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'يَقُولُ أَحْمَدُ لِصَدِيقِهِ لُقْمَانَ: اُنْظُرْ يَا لُقْمَانُ إِلَى السَّمَاءِ، السَّحَابُ لَوْنُهُ أَسْوَدُ جِدًّا. وَهَا هُوَ ذَا الْبَرْقُ يَلْمَعُ. اسْمَعْ هَذَا صَوْتُ الرَّعْدِ. الْآنَ أَصْبَحَ الْجَوُّ مُظْلِمًا. هَيَّا بِنَا نَعُودُ إِلَى الْبَيْتِ، سَيَنْزِلُ الْمَطَرُ بَعْدَ قَلِيلٍ. هَا نَزَلَ الْمَطَرُ، وَالْآنَ انْشُرْ مِظَلَّتَكَ يَا صَدِيقِي.',
    translation:
      'Ahmad berkata kepada temannya Luqman: "Lihatlah wahai Luqman ke langit, awan warnanya sangat hitam. Dan lihatlah kilat itu menyambar. Dengarkan, ini suara guntur. Sekarang cuaca menjadi gelap. Ayo kita pulang ke rumah, sebentar lagi hujan akan turun. Nah, hujan sudah turun, sekarang bukalah payungmu wahai temanku!"'
  },
  {
    id: 's2-52',
    season: 2,
    numberLabel: '52',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'رَأَى مُحَمَّدٌ وَإِخْوَتُهُ فِي الطَّرِيقِ الْمَنَاظِرَ الْجَمِيلَةَ مِنَ الْجِبَالِ وَالْأَشْجَارِ وَالْأَنْهَارِ. وَوَصَلُوا فِي الْبَحْرِ بَعْدَ صَلَاةِ الظُّهْرِ، فَكَانَتْ رِحْلَةً طَوِيلَةً تَسْتَغْرِقُ ثَلَاثَ سَاعَاتٍ مِنْ بَيْتِ جَدِّهِمْ. ثُمَّ صَلَّوْا صَلَاةَ الظُّهْرِ وَتَنَاوَلُوا طَعَامَ الْغَدَاءِ الَّذِي حَمَلُوهُ مِنَ الْبَيْتِ.',
    translation:
      'Muhammad dan saudara-saudaranya melihat pemandangan yang indah di perjalanan berupa gunung-gunung, pepohonan, dan sungai-sungai. Mereka tiba di pantai (laut) setelah shalat Dzuhur; perjalanan itu cukup panjang memakan waktu tiga jam dari rumah kakek mereka. Kemudian mereka melaksanakan shalat Dzuhur dan menyantap makan siang yang mereka bawa dari rumah.'
  },
  {
    id: 's2-53',
    season: 2,
    numberLabel: '53',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'كَانَ مُحَمَّدٌ نَائِمًا فِي فِرَاشِهِ وَالسَّاعَةُ عَشْرٌ. وَاللَّيْلُ كُلُّهُ ظَلَامٌ وَبَرْدٌ. وَالدُّنْيَا سَاكِنَةٌ. لَيْسَ فِيهَا إِلَّا صَوْتُ الْخَفِيرِ فِي الشَّارِعِ. ثُمَّ سَمِعَ مُحَمَّدٌ صُرَاخًا فِي الْخَارِجِ. فَقَامَ مِنْ فِرَاشِهِ، وَفَتَحَ الشُّبَّاكَ وَأَطَلَّ مِنْهُ. فَرَأَى حَرِيقًا فِي بَيْتِ جَارِهِ، وَهُوَ بَيْتُ صَاحِبِهِ إِبْرَاهِيمَ الَّذِي يَلْعَبُ مَعَهُ كُلَّ يَوْمٍ. فَنَزَلَ يَجْرِي لِيَنْظُرَهُ فَمَا وَجَدَهُ. فَدَخَلَ الْبَيْتَ فِي وَسَطِ النَّارِ، وَوَصَلَ إِلَى غُرْفَةِ إِبْرَاهِيمَ وَنَادَاهُ. فَقَامَ إِبْرَاهِيمُ مَرْعُوبًا. فَأَخَذَ مُحَمَّدٌ بِيَدِهِ، وَنَزَلَ بِهِ إِلَى الشَّارِعِ. فَرَآهُ جَمِيعُ الْوَاقِفِينَ وَفَرِحُوا بِهِ وَمَدَحُوهُ، لِأَنَّهُ خَلَّصَ صَاحِبَهُ.',
    translation:
      'Muhammad sedang tidur di tempat tidurnya pada pukul sepuluh. Malam itu seluruhnya gelap dan dingin. Dunia terasa sunyi. Tidak ada suara selain suara penjaga malam di jalan. Kemudian Muhammad mendengar teriakan di luar. Ia pun bangkit dari tempat tidurnya, membuka jendela dan menengok keluar. Ia melihat kebakaran di rumah tetangganya, yaitu rumah sahabatnya Ibrahim yang bermain bersamanya setiap hari. Ia segera turun berlari untuk mencarinya namun tidak menemukannya. Ia pun masuk ke dalam rumah di tengah kobaran api, sampai ke kamar Ibrahim dan memanggilnya. Ibrahim bangkit dalam keadaan ketakutan. Muhammad menggandeng tangannya dan membawanya turun ke jalan. Semua orang yang berdiri di sana melihatnya, mereka bergembira dan memujinya karena ia telah menyelamatkan sahabatnya.'
  },
  {
    id: 's2-54',
    season: 2,
    numberLabel: '54',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'فِي الْبُلْدَانِ الْإِسْلَامِيَّةِ جَامِعَاتٌ كَثِيرَةٌ لِنَشْرِ الْعِلْمِ بَيْنَ الْمُسْلِمِينَ وَالْمُسْلِمَاتِ، يَدْرُسُ فِيهَا كَثِيرٌ مِنَ الطُّلَّابِ وَالطَّالِبَاتِ، يَأْتُونَ مِنْ مُخْتَلِفِ الْبِلَادِ وَالْمُدُنِ وَالْقُرَى، بَعْدَ إِتْمَامِ تَعْلِيمِهِمْ بِالْمَعَاهِدِ وَالْمَدَارِسِ، يَقُومُ بِالتَّدْرِيسِ فِيهَا كَثِيرٌ مِنَ الْمُدَرِّسِينَ وَالْمُدَرِّسَاتِ.',
    translation:
      'Di negeri-negeri Islam terdapat banyak universitas untuk menyebarkan ilmu di kalangan kaum muslimin dan muslimat; di dalamnya belajar banyak mahasiswa dan mahasiswi yang datang dari berbagai negeri, kota, dan desa setelah menyelesaikan pendidikan mereka di ma\'had dan sekolah-sekolah, dan di sana mengajar pula banyak dosen laki-laki dan perempuan.'
  },
  {
    id: 's2-55',
    season: 2,
    numberLabel: '55',
    instruction: 'Baca dan lengkapi harakat & analisis kata-kata yang digaris bawahi!',
    arabic:
      'قَالَ الْمُدَرِّسُ: أَيْنَ تَذْهَبُ يَا أَبَا بَكْرٍ؟ أَجَابَ أَبُو بَكْرٍ: أَذْهَبُ إِلَى الْمُدِيرِ. قَالَ: لَا تَخْرُجْ مِنَ الْفَصْلِ الْآنَ. اذْهَبْ إِلَيْهِ بَعْدَ الدَّرْسِ. قَالَ: نَعَمْ، يَا أُسْتَاذُ، أَآخُذُ هَذِهِ الدَّفَاتِرَ يَا أُسْتَاذُ؟ قَالَ: لَا، لَا تَأْخُذْهَا (يَنْظُرُ إِلَى دَفْتَرٍ) يَا عَبْدَ الرَّحِيمِ، لَا تَكْتُبِ الْأَجْوِبَةَ بِالْقَلَمِ الْأَحْمَرِ. الْمُدَرِّسُ هُوَ الَّذِي يَكْتُبُ بِالْقَلَمِ الْأَحْمَرِ.',
    translation:
      'Guru berkata: "Mau pergi ke mana wahai Abu Bakar?" Abu Bakar menjawab: "Saya hendak pergi menemui kepala sekolah." Guru berkata: "Jangan keluar dari kelas sekarang. Pergilah menemuinya setelah pelajaran." Abu Bakar berkata: "Baik, wahai Ustadz. Apakah saya bawa buku-buku tulis ini wahai Ustadz?" Guru menjawab: "Tidak, jangan membawanya." (Beliau melihat ke sebuah buku tulis) "Wahai Abdurrahim, jangan menulis jawaban dengan pena merah. Gurulah yang menulis dengan pena merah."'
  }
];
