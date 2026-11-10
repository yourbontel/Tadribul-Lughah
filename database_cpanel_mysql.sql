-- ============================================================================
-- TADRIBUL LUGHAH — DATABASE SQL UNTUK CPANEL (MySQL / MariaDB / phpMyAdmin)
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABEL KURIKULUM LEVEL (programs)
CREATE TABLE IF NOT EXISTS `programs` (
  `id` VARCHAR(64) NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `index_number` VARCHAR(10) NOT NULL,
  `level_number` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `arabic_title` VARCHAR(200) NOT NULL,
  `category` ENUM('nahwu', 'shorof') NOT NULL DEFAULT 'nahwu',
  `category_label` VARCHAR(100) NOT NULL,
  `schedule_days` VARCHAR(100) NOT NULL,
  `schedule_time` VARCHAR(100) NOT NULL DEFAULT '20.00 – 22.00 WIB',
  `level_recommendation` VARCHAR(255) NOT NULL,
  `duration_weeks` INT NOT NULL DEFAULT 8,
  `sessions_count` INT NOT NULL DEFAULT 16,
  `session_minutes` INT NOT NULL DEFAULT 120,
  `tuition_idr` INT NOT NULL DEFAULT 85000,
  `summary` TEXT NOT NULL,
  `target_outcome` TEXT NOT NULL,
  `kitab_reference` VARCHAR(255) NOT NULL,
  `featured_span` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_programs_level` (`level_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `programs` (`id`, `code`, `index_number`, `level_number`, `title`, `arabic_title`, `category`, `category_label`, `schedule_days`, `schedule_time`, `level_recommendation`, `duration_weeks`, `sessions_count`, `session_minutes`, `tuition_idr`, `summary`, `target_outcome`, `kitab_reference`, `featured_span`) VALUES
('tl-level-1', 'TL-LV1', '01', 1, 'Tadribul Lughah Level 1 — Nahwu Dasar (Al-Mabadi’ An-Nahwiyyah)', 'تَدْرِيبُ اللُّغَةِ — المُسْتَوَى الأَوَّلُ: النَّحْوُ الأَسَاسِيّ', 'nahwu', 'Level 1 · Nahwu Dasar', 'Kamis & Jumat', '20.00 – 22.00 WIB', 'Pemula / Belum pernah belajar kaidah Nahwu secara terstruktur', 8, 16, 120, 85000, 'Pondasi utama dalam kurikulum Tadribul Lughah untuk mengenal jenis kata (Isim, Fi’il, Harf), tanda-tanda I’rab dasar, pembagian Isim (Mufrad, Mutsanna, Jamak), serta menyusun kalimat dasar Jumlah Ismiyyah dan Jumlah Fi’liyyah.', 'Mampu membedakan komponen kalimat, menentukan Mubtada’-Khabar serta Fi’il-Fa’il dengan tanda harakat akhir yang tepat.', 'Modul Tadribul Lughah Jilid 1 (Fondasi Nahwu & Latihan Kalimat)', 1),
('tl-level-2', 'TL-LV2', '02', 2, 'Tadribul Lughah Level 2 — Nahwu Menengah (Marfu’at & Manshubat)', 'تَدْرِيبُ اللُّغَةِ — المُسْتَوَى الثَّانِي: النَّحْوُ المُتَوَسِّط', 'nahwu', 'Level 2 · Nahwu Menengah', 'Selasa & Rabu', '20.00 – 22.00 WIB', 'Lulusan Tadribul Lughah Level 1 / Memahami Mubtada’-Khabar & Fa’il', 8, 16, 120, 85000, 'Tahap kedua kurikulum Nahwu Tadribul Lughah yang mengupas tuntas amil-amil perusak Mubtada’-Khabar (Kana & Inna), Na’ibul Fa’il, serta seluruh bab Manshubatul Asma’ (kata benda berstatus Nashab) dalam kalimat.', 'Mampu menganalisis kalimat majemuk yang memuat Kana, Inna, Maf’ul Bih, Maf’ul Muthlaq, Maf’ul Li Ajlih, Zharaf, Hal, dan Tamyiz.', 'Modul Tadribul Lughah Jilid 2 (Nawasikh & Manshubatul Asma’)', 0),
('tl-level-3', 'TL-LV3', '03', 3, 'Tadribul Lughah Level 3 — Nahwu Lanjutan (Majrurat, Tawabi’ & Tathbiq I’rab)', 'تَدْرِيبُ اللُّغَةِ — المُسْتَوَى الثَّالِثُ: النَّحْوُ المُتَقَدِّم وَالتَّطْبِيق', 'nahwu', 'Level 3 · Nahwu Lanjutan', 'Sabtu & Ahad', '20.00 – 22.00 WIB', 'Lulusan Tadribul Lughah Level 2 / Menguasai Marfu’at & Manshubat', 8, 16, 120, 85000, 'Puncak pembelajaran Nahwu di Tadribul Lughah yang memfokuskan pada Majrurat (Huruf Jar & Idhafah), Tawabi’ (Na’at, ’Athaf, Taukid, Badal), I’rab Fi’il Mudhari’ (Nashab, Jazm, Syarat), dan praktik langsung membaca teks tanpa harakat.', 'Tuntas menguasai seluruh peta konsep ilmu Nahwu dan terampil meng-i’rab kalimat lengkap pada teks Arab gundul maupun ayat Al-Qur’an.', 'Modul Tadribul Lughah Jilid 3 & Matan Al-Ajurrumiyyah Tathbiqi', 0),
('tl-level-4', 'TL-LV4', '04', 4, 'Tadribul Lughah Level 4 — Shorof & Tashrif Aplikatif (Ilmu Ash-Sharf)', 'تَدْرِيبُ اللُّغَةِ — المُسْتَوَى الرَّابِعُ: الصَّرْفُ وَالتَّصْرِيفُ التَّطْبِيقِيّ', 'shorof', 'Level 4 · Ilmu Shorof', 'Sabtu & Ahad', '20.00 – 22.00 WIB', 'Lulusan Nahwu (Level 1–3) atau peserta yang ingin membedah pola pembentukan kata', 8, 16, 120, 85000, 'Level khusus dalam Tadribul Lughah yang mengupas anatomi dan perubahan bentuk kata (Morfologi Arab). Mencakup Mizan Sharfi, 6 Bab Tsulatsi Mujarrad, Tsulatsi Mazid, Tashrif Istilahi (10–12 Shighat), Tashrif Lughawi (14 Dhamir), serta kaidah I’lal & Ibdal.', 'Mampu men-tashrif kata kerja Shahih maupun Mu’tal secara lancar, menemukan akar kata di kamus, dan memahami perubahan harakat internal kata.', 'Modul Tadribul Lughah Jilid 4 (Tashrif Istilahi, Lughawi & Amtsilah)', 1)
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`), `tuition_idr` = VALUES(`tuition_idr`);

-- 2. TABEL JADWAL KELAS MALAM ONLINE (schedules)
CREATE TABLE IF NOT EXISTS `schedules` (
  `id` VARCHAR(64) NOT NULL,
  `batch_code` VARCHAR(64) NOT NULL,
  `program_id` VARCHAR(64) NOT NULL,
  `level_number` INT NOT NULL,
  `program_name` VARCHAR(200) NOT NULL,
  `level_name` VARCHAR(120) NOT NULL,
  `mode_label` VARCHAR(120) NOT NULL DEFAULT 'Online Live Interaktif (Zoom)',
  `days` VARCHAR(100) NOT NULL,
  `time_wib` VARCHAR(100) NOT NULL DEFAULT '20.00 – 22.00 WIB',
  `start_date` VARCHAR(100) NOT NULL,
  `instructor` VARCHAR(160) NOT NULL,
  `capacity` INT NOT NULL DEFAULT 25,
  `enrolled` INT NOT NULL DEFAULT 0,
  `fee_idr` INT NOT NULL DEFAULT 85000,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_schedules_program` (`program_id`),
  CONSTRAINT `fk_schedules_program` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `schedules` (`id`, `batch_code`, `program_id`, `level_number`, `program_name`, `level_name`, `mode_label`, `days`, `time_wib`, `start_date`, `instructor`, `capacity`, `enrolled`, `fee_idr`) VALUES
('sch-lv1-malam', 'TL-LV1-MLM', 'tl-level-1', 1, 'Tadribul Lughah Level 1 — Nahwu Dasar', 'Level 1 (Nahwu Dasar)', 'Online Live Interaktif (Zoom)', 'Kamis & Jumat', '20.00 – 22.00 WIB', '19 November 2026', 'Ust. Ahmad Fauzan, Lc., M.A.', 25, 18, 85000),
('sch-lv2-malam', 'TL-LV2-MLM', 'tl-level-2', 2, 'Tadribul Lughah Level 2 — Nahwu Menengah', 'Level 2 (Nahwu Menengah)', 'Online Live Interaktif (Zoom)', 'Selasa & Rabu', '20.00 – 22.00 WIB', '17 November 2026', 'KH. Luqmanul Hakim, Lc., M.Ag.', 25, 19, 85000),
('sch-lv3-malam', 'TL-LV3-MLM', 'tl-level-3', 3, 'Tadribul Lughah Level 3 — Nahwu Lanjutan', 'Level 3 (Nahwu Lanjutan)', 'Online Live Interaktif (Zoom)', 'Sabtu & Ahad', '20.00 – 22.00 WIB', '21 November 2026', 'KH. Luqmanul Hakim, Lc., M.Ag.', 25, 16, 85000),
('sch-lv4-malam', 'TL-LV4-MLM', 'tl-level-4', 4, 'Tadribul Lughah Level 4 — Shorof & Tashrif Aplikatif', 'Level 4 (Ilmu Shorof)', 'Online Live Interaktif (Zoom)', 'Sabtu & Ahad', '20.00 – 22.00 WIB', '21 November 2026', 'Syaikh Dr. Ahmad Al-Manshur & Tim Shorof', 25, 20, 85000)
ON DUPLICATE KEY UPDATE `batch_code` = VALUES(`batch_code`), `fee_idr` = VALUES(`fee_idr`);

-- 3. TABEL PENDAFTAR PESERTA DIDIK (registrations)
CREATE TABLE IF NOT EXISTS `registrations` (
  `registration_number` VARCHAR(64) NOT NULL,
  `full_name` VARCHAR(140) NOT NULL,
  `email` VARCHAR(160) NOT NULL,
  `whatsapp` VARCHAR(48) NOT NULL,
  `occupation` VARCHAR(120) NOT NULL,
  `city` VARCHAR(120) NOT NULL,
  `selected_program_id` VARCHAR(64) NOT NULL,
  `selected_program_name` VARCHAR(200) NOT NULL,
  `selected_schedule_id` VARCHAR(64) NOT NULL,
  `selected_schedule_summary` VARCHAR(255) NOT NULL,
  `learning_goal` TEXT NOT NULL,
  `total_tuition_idr` INT NOT NULL DEFAULT 85000,
  `registered_at` VARCHAR(100) NOT NULL,
  `status` VARCHAR(120) NOT NULL DEFAULT 'Terverifikasi — Menunggu Orientasi',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`registration_number`),
  KEY `idx_registrations_program` (`selected_program_id`),
  KEY `idx_registrations_schedule` (`selected_schedule_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
