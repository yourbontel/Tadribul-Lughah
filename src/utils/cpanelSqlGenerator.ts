import {
  ProgramTrack,
  ClassSchedule,
  RegistrationRecord
} from '../data/arabicAcademyData';

function escapeSql(val: string | number | boolean | undefined | null): string {
  if (val === undefined || val === null) return 'NULL';
  if (typeof val === 'number') return String(Math.round(val));
  if (typeof val === 'boolean') return val ? '1' : '0';
  const cleaned = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, '\\n');
  return `'${cleaned}'`;
}

export interface CpanelDbConfig {
  dbHost: string;
  dbName: string;
  dbUser: string;
  dbPassPlaceholder: string;
  apiEndpointUrl: string;
}

export function generateCpanelSqlDump(
  programs: ProgramTrack[],
  schedules: ClassSchedule[],
  registrations: RegistrationRecord[]
): string {
  const timestamp = new Date().toISOString();

  const lines: string[] = [
    '-- ============================================================================',
    '-- TADRIBUL LUGHAH — DATABASE SQL DUMP UNTUK CPANEL (MySQL / MariaDB)',
    `-- Digenerate pada: ${timestamp}`,
    '-- Cara Pakai di cPanel:',
    '-- 1. Buka cPanel > MySQL Databases > Buat Database & User baru.',
    '-- 2. Buka cPanel > phpMyAdmin > Pilih database Anda > Klik tab "Import".',
    '-- 3. Unggah file .sql ini lalu klik "Import / Go".',
    '-- ============================================================================',
    '',
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS = 0;',
    '',
    '-- ----------------------------------------------------------------------------',
    '-- 1. TABEL KURIKULUM LEVEL (programs)',
    '-- ----------------------------------------------------------------------------',
    'CREATE TABLE IF NOT EXISTS `programs` (',
    '  `id` VARCHAR(64) NOT NULL,',
    '  `code` VARCHAR(32) NOT NULL,',
    '  `index_number` VARCHAR(10) NOT NULL,',
    '  `level_number` INT NOT NULL,',
    '  `title` VARCHAR(200) NOT NULL,',
    '  `arabic_title` VARCHAR(200) NOT NULL,',
    '  `category` ENUM(\'nahwu\', \'shorof\') NOT NULL DEFAULT \'nahwu\',',
    '  `category_label` VARCHAR(100) NOT NULL,',
    '  `schedule_days` VARCHAR(100) NOT NULL,',
    '  `schedule_time` VARCHAR(100) NOT NULL DEFAULT \'20.00 – 22.00 WIB\',',
    '  `level_recommendation` VARCHAR(255) NOT NULL,',
    '  `duration_weeks` INT NOT NULL DEFAULT 8,',
    '  `sessions_count` INT NOT NULL DEFAULT 16,',
    '  `session_minutes` INT NOT NULL DEFAULT 120,',
    '  `tuition_idr` INT NOT NULL DEFAULT 510000,',
    '  `summary` TEXT NOT NULL,',
    '  `target_outcome` TEXT NOT NULL,',
    '  `kitab_reference` VARCHAR(255) NOT NULL,',
    '  `featured_span` TINYINT(1) NOT NULL DEFAULT 0,',
    '  `registration_open` TINYINT(1) NOT NULL DEFAULT 1,',
    '  `angkatan` VARCHAR(100) NOT NULL DEFAULT \'Angkatan 1\',',
    '  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,',
    '  PRIMARY KEY (`id`),',
    '  KEY `idx_programs_level` (`level_number`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    '',
    '-- Data Kurikulum Level 1–4 Tadribul Lughah',
    'INSERT INTO `programs` (`id`, `code`, `index_number`, `level_number`, `title`, `arabic_title`, `category`, `category_label`, `schedule_days`, `schedule_time`, `level_recommendation`, `duration_weeks`, `sessions_count`, `session_minutes`, `tuition_idr`, `summary`, `target_outcome`, `kitab_reference`, `featured_span`, `registration_open`, `angkatan`) VALUES'
  ];

  const programValues = programs.map(
    (p) =>
      `(${escapeSql(p.id)}, ${escapeSql(p.code)}, ${escapeSql(p.indexNumber)}, ${escapeSql(p.levelNumber)}, ${escapeSql(p.title)}, ${escapeSql(p.arabicTitle)}, ${escapeSql(p.category)}, ${escapeSql(p.categoryLabel)}, ${escapeSql(p.scheduleDays)}, ${escapeSql(p.scheduleTime)}, ${escapeSql(p.levelRecommendation)}, ${escapeSql(p.durationWeeks)}, ${escapeSql(p.sessionsCount)}, ${escapeSql(p.sessionMinutes)}, ${escapeSql(p.tuitionIDR)}, ${escapeSql(p.summary)}, ${escapeSql(p.targetOutcome)}, ${escapeSql(p.kitabReference)}, ${escapeSql(Boolean(p.featuredSpan))}, ${escapeSql(p.registrationOpen !== false)}, ${escapeSql(p.angkatan || 'Angkatan 1')})`
  );

  lines.push(
    programValues.join(',\n') +
      '\nON DUPLICATE KEY UPDATE\n  `title` = VALUES(`title`),\n  `arabic_title` = VALUES(`arabic_title`),\n  `category` = VALUES(`category`),\n  `category_label` = VALUES(`category_label`),\n  `schedule_days` = VALUES(`schedule_days`),\n  `schedule_time` = VALUES(`schedule_time`),\n  `level_recommendation` = VALUES(`level_recommendation`),\n  `duration_weeks` = VALUES(`duration_weeks`),\n  `sessions_count` = VALUES(`sessions_count`),\n  `tuition_idr` = VALUES(`tuition_idr`),\n  `summary` = VALUES(`summary`),\n  `target_outcome` = VALUES(`target_outcome`),\n  `kitab_reference` = VALUES(`kitab_reference`),\n  `registration_open` = VALUES(`registration_open`),\n  `angkatan` = VALUES(`angkatan`);'
  );

  lines.push(
    '',
    '-- ----------------------------------------------------------------------------',
    '-- 2. TABEL JADWAL KELAS MALAM ONLINE (schedules)',
    '-- ----------------------------------------------------------------------------',
    'CREATE TABLE IF NOT EXISTS `schedules` (',
    '  `id` VARCHAR(64) NOT NULL,',
    '  `batch_code` VARCHAR(64) NOT NULL,',
    '  `program_id` VARCHAR(64) NOT NULL,',
    '  `level_number` INT NOT NULL,',
    '  `program_name` VARCHAR(200) NOT NULL,',
    '  `level_name` VARCHAR(120) NOT NULL,',
    '  `mode_label` VARCHAR(120) NOT NULL DEFAULT \'Online Live Interaktif (Zoom)\',',
    '  `days` VARCHAR(100) NOT NULL,',
    '  `time_wib` VARCHAR(100) NOT NULL DEFAULT \'20.00 – 22.00 WIB\',',
    '  `start_date` VARCHAR(100) NOT NULL,',
    '  `instructor` VARCHAR(160) NOT NULL,',
    '  `capacity` INT NOT NULL DEFAULT 25,',
    '  `enrolled` INT NOT NULL DEFAULT 0,',
    '  `fee_idr` INT NOT NULL DEFAULT 510000,',
    '  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,',
    '  PRIMARY KEY (`id`),',
    '  KEY `idx_schedules_program` (`program_id`),',
    '  CONSTRAINT `fk_schedules_program` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;',
    '',
    '-- Data Jadwal Kelas Malam Online (20.00 – 22.00 WIB)',
    'INSERT INTO `schedules` (`id`, `batch_code`, `program_id`, `level_number`, `program_name`, `level_name`, `mode_label`, `days`, `time_wib`, `start_date`, `instructor`, `capacity`, `enrolled`, `fee_idr`) VALUES'
  );

  const scheduleValues = schedules.map(
    (s) =>
      `(${escapeSql(s.id)}, ${escapeSql(s.batchCode)}, ${escapeSql(s.programId)}, ${escapeSql(s.levelNumber)}, ${escapeSql(s.programName)}, ${escapeSql(s.levelName)}, ${escapeSql(s.modeLabel)}, ${escapeSql(s.days)}, ${escapeSql(s.timeWIB)}, ${escapeSql(s.startDate)}, ${escapeSql(s.instructor)}, ${escapeSql(s.capacity)}, ${escapeSql(s.enrolled)}, ${escapeSql(s.feeIDR)})`
  );

  lines.push(
    scheduleValues.join(',\n') +
      '\nON DUPLICATE KEY UPDATE\n  `batch_code` = VALUES(`batch_code`),\n  `program_name` = VALUES(`program_name`),\n  `days` = VALUES(`days`),\n  `time_wib` = VALUES(`time_wib`),\n  `start_date` = VALUES(`start_date`),\n  `instructor` = VALUES(`instructor`),\n  `capacity` = VALUES(`capacity`),\n  `enrolled` = VALUES(`enrolled`),\n  `fee_idr` = VALUES(`fee_idr`);'
  );

  lines.push(
    '',
    '-- ----------------------------------------------------------------------------',
    '-- 3. TABEL PENDAFTAR PESERTA DIDIK (registrations)',
    '-- ----------------------------------------------------------------------------',
    'CREATE TABLE IF NOT EXISTS `registrations` (',
    '  `registration_number` VARCHAR(64) NOT NULL,',
    '  `full_name` VARCHAR(140) NOT NULL,',
    '  `gender` VARCHAR(32) NOT NULL DEFAULT \'Laki-laki\',',
    '  `email` VARCHAR(160) NOT NULL,',
    '  `whatsapp` VARCHAR(48) NOT NULL,',
    '  `occupation` VARCHAR(120) NOT NULL,',
    '  `city` VARCHAR(120) NOT NULL,',
    '  `selected_program_id` VARCHAR(64) NOT NULL,',
    '  `selected_program_name` VARCHAR(200) NOT NULL,',
    '  `selected_schedule_id` VARCHAR(64) NOT NULL,',
    '  `selected_schedule_summary` VARCHAR(255) NOT NULL,',
    '  `learning_goal` TEXT NOT NULL,',
    '  `total_tuition_idr` INT NOT NULL DEFAULT 510000,',
    '  `registered_at` VARCHAR(100) NOT NULL,',
    '  `status` VARCHAR(120) NOT NULL DEFAULT \'Terverifikasi — Menunggu Orientasi\',',
    '  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,',
    '  PRIMARY KEY (`registration_number`),',
    '  KEY `idx_registrations_program` (`selected_program_id`),',
    '  KEY `idx_registrations_schedule` (`selected_schedule_id`)',
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;'
  );

  if (registrations.length > 0) {
    lines.push(
      '',
      '-- Data Pendaftar Tadribul Lughah',
      'INSERT INTO `registrations` (`registration_number`, `full_name`, `gender`, `email`, `whatsapp`, `occupation`, `city`, `selected_program_id`, `selected_program_name`, `selected_schedule_id`, `selected_schedule_summary`, `learning_goal`, `total_tuition_idr`, `registered_at`, `status`) VALUES'
    );
    const regValues = registrations.map(
      (r) =>
        `(${escapeSql(r.registrationNumber)}, ${escapeSql(r.fullName)}, ${escapeSql(r.gender || 'Laki-laki')}, ${escapeSql(r.email)}, ${escapeSql(r.whatsapp)}, ${escapeSql(r.occupation)}, ${escapeSql(r.city)}, ${escapeSql(r.selectedProgramId)}, ${escapeSql(r.selectedProgramName)}, ${escapeSql(r.selectedScheduleId)}, ${escapeSql(r.selectedScheduleSummary)}, ${escapeSql(r.learningGoal)}, ${escapeSql(r.totalTuitionIDR)}, ${escapeSql(r.registeredAt)}, ${escapeSql(r.status)})`
    );
    lines.push(
      regValues.join(',\n') +
        '\nON DUPLICATE KEY UPDATE\n  `full_name` = VALUES(`full_name`),\n  `gender` = VALUES(`gender`),\n  `email` = VALUES(`email`),\n  `whatsapp` = VALUES(`whatsapp`),\n  `city` = VALUES(`city`),\n  `occupation` = VALUES(`occupation`),\n  `selected_program_id` = VALUES(`selected_program_id`),\n  `selected_program_name` = VALUES(`selected_program_name`),\n  `selected_schedule_id` = VALUES(`selected_schedule_id`),\n  `selected_schedule_summary` = VALUES(`selected_schedule_summary`),\n  `learning_goal` = VALUES(`learning_goal`),\n  `total_tuition_idr` = VALUES(`total_tuition_idr`),\n  `status` = VALUES(`status`);'
    );
  }

  lines.push('', 'SET FOREIGN_KEY_CHECKS = 1;', '');
  return lines.join('\n');
}

export function generateCpanelPhpApi(config: CpanelDbConfig): string {
  return `<?php
/**
 * ============================================================================
 * TADRIBUL LUGHAH — REST API BRIDGE UNTUK MYSQL DI CPANEL (api.php)
 * ============================================================================
 * Cara Pemasangan di cPanel:
 * 1. Simpan file ini sebagai \`public_html/api.php\` di File Manager cPanel Anda.
 * 2. Sesuaikan DB_NAME, DB_USER, dan DB_PASS di bawah ini sesuai MySQL cPanel.
 * 3. Masukkan URL \`https://domain-anda.com/api.php\` pada tab "Database SQL cPanel"
 *    di Panel Superadmin Tadribul Lughah.
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Superadmin-Email");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('DB_HOST', '${config.dbHost || 'localhost'}');
define('DB_NAME', '${config.dbName || 'cpaneluser_tadribullughah'}');
define('DB_USER', '${config.dbUser || 'cpaneluser_admin'}');
define('DB_PASS', '${config.dbPassPlaceholder || 'GANTI_PASSWORD_MYSQL_CPANEL_ANDA'}');
define('SUPERADMIN_EMAIL', 'mazharhajid@gmail.com');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Koneksi MySQL cPanel gagal: " . $e->getMessage()]);
    exit;
}

$entity = $_GET['entity'] ?? 'all';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// GET semua data (Kurikulum, Jadwal, dan Pendaftar)
if ($method === 'GET') {
    $programs = $pdo->query("SELECT * FROM programs ORDER BY level_number ASC")->fetchAll();
    $schedules = $pdo->query("SELECT * FROM schedules ORDER BY level_number ASC")->fetchAll();
    $registrations = $pdo->query("SELECT * FROM registrations ORDER BY created_at DESC")->fetchAll();
    echo json_encode([
        "status" => "ok",
        "programs" => $programs,
        "schedules" => $schedules,
        "registrations" => $registrations
    ]);
    exit;
}

// POST pendaftaran peserta baru atau update dari Superadmin
if ($method === 'POST') {
    if ($entity === 'registration') {
        $stmt = $pdo->prepare("
            INSERT INTO registrations (
                registration_number, full_name, gender, email, whatsapp, occupation, city,
                selected_program_id, selected_program_name, selected_schedule_id,
                selected_schedule_summary, learning_goal, total_tuition_idr, registered_at, status
            ) VALUES (
                :registrationNumber, :fullName, :gender, :email, :whatsapp, :occupation, :city,
                :selectedProgramId, :selectedProgramName, :selectedScheduleId,
                :selectedScheduleSummary, :learningGoal, :totalTuitionIDR, :registeredAt, :status
            )
            ON DUPLICATE KEY UPDATE
                full_name = VALUES(full_name),
                gender = VALUES(gender),
                email = VALUES(email),
                whatsapp = VALUES(whatsapp),
                city = VALUES(city),
                occupation = VALUES(occupation),
                selected_program_id = VALUES(selected_program_id),
                selected_program_name = VALUES(selected_program_name),
                selected_schedule_summary = VALUES(selected_schedule_summary),
                learning_goal = VALUES(learning_goal),
                total_tuition_idr = VALUES(total_tuition_idr),
                status = VALUES(status)
        ");
        $stmt->execute([
            ':registrationNumber' => $input['registrationNumber'],
            ':fullName' => $input['fullName'],
            ':gender' => $input['gender'] ?? 'Laki-laki',
            ':email' => $input['email'],
            ':whatsapp' => $input['whatsapp'],
            ':occupation' => $input['occupation'],
            ':city' => $input['city'],
            ':selectedProgramId' => $input['selectedProgramId'],
            ':selectedProgramName' => $input['selectedProgramName'],
            ':selectedScheduleId' => $input['selectedScheduleId'],
            ':selectedScheduleSummary' => $input['selectedScheduleSummary'],
            ':learningGoal' => $input['learningGoal'],
            ':totalTuitionIDR' => (int)($input['totalTuitionIDR'] ?? 510000),
            ':registeredAt' => $input['registeredAt'],
            ':status' => $input['status'] ?? 'Terverifikasi — Menunggu Orientasi',
        ]);
        echo json_encode(["status" => "saved", "registrationNumber" => $input['registrationNumber']]);
        exit;
    }

    if ($entity === 'program') {
        $stmt = $pdo->prepare("
            UPDATE programs SET
                title = :title,
                arabic_title = :arabicTitle,
                category = :category,
                category_label = :categoryLabel,
                schedule_days = :scheduleDays,
                schedule_time = :scheduleTime,
                level_recommendation = :levelRecommendation,
                duration_weeks = :durationWeeks,
                sessions_count = :sessionsCount,
                tuition_idr = :tuitionIDR,
                summary = :summary,
                target_outcome = :targetOutcome,
                kitab_reference = :kitabReference,
                registration_open = :registrationOpen,
                angkatan = :angkatan
            WHERE id = :id
        ");
        $stmt->execute([
            ':id' => $input['id'],
            ':title' => $input['title'],
            ':arabicTitle' => $input['arabicTitle'],
            ':category' => $input['category'],
            ':categoryLabel' => $input['categoryLabel'],
            ':scheduleDays' => $input['scheduleDays'],
            ':scheduleTime' => $input['scheduleTime'],
            ':levelRecommendation' => $input['levelRecommendation'],
            ':durationWeeks' => (int)$input['durationWeeks'],
            ':sessionsCount' => (int)$input['sessionsCount'],
            ':tuitionIDR' => (int)$input['tuitionIDR'],
            ':summary' => $input['summary'],
            ':targetOutcome' => $input['targetOutcome'],
            ':kitabReference' => $input['kitabReference'],
            ':registrationOpen' => (!isset($input['registrationOpen']) || $input['registrationOpen'] !== false) ? 1 : 0,
            ':angkatan' => $input['angkatan'] ?? 'Angkatan 1',
        ]);
        echo json_encode(["status" => "updated", "id" => $input['id']]);
        exit;
    }

    if ($entity === 'schedule') {
        $stmt = $pdo->prepare("
            INSERT INTO schedules (
                id, batch_code, program_id, level_number, program_name, level_name,
                mode_label, days, time_wib, start_date, instructor, capacity, enrolled, fee_idr
            ) VALUES (
                :id, :batchCode, :programId, :levelNumber, :programName, :levelName,
                :modeLabel, :days, :timeWIB, :startDate, :instructor, :capacity, :enrolled, :feeIDR
            )
            ON DUPLICATE KEY UPDATE
                batch_code = VALUES(batch_code),
                program_id = VALUES(program_id),
                level_number = VALUES(level_number),
                program_name = VALUES(program_name),
                days = VALUES(days),
                time_wib = VALUES(time_wib),
                start_date = VALUES(start_date),
                instructor = VALUES(instructor),
                capacity = VALUES(capacity),
                enrolled = VALUES(enrolled),
                fee_idr = VALUES(fee_idr)
        ");
        $stmt->execute([
            ':id' => $input['id'],
            ':batchCode' => $input['batchCode'],
            ':programId' => $input['programId'],
            ':levelNumber' => (int)$input['levelNumber'],
            ':programName' => $input['programName'],
            ':levelName' => $input['levelName'],
            ':modeLabel' => $input['modeLabel'],
            ':days' => $input['days'],
            ':timeWIB' => $input['timeWIB'],
            ':startDate' => $input['startDate'],
            ':instructor' => $input['instructor'],
            ':capacity' => (int)$input['capacity'],
            ':enrolled' => (int)$input['enrolled'],
            ':feeIDR' => (int)$input['feeIDR'],
        ]);
        echo json_encode(["status" => "saved", "id" => $input['id']]);
        exit;
    }
}

echo json_encode(["status" => "ready"]);
`;
}
