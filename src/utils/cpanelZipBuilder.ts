import {
  ProgramTrack,
  ClassSchedule,
  RegistrationRecord,
  LEVEL_1_MATERI_TABLE
} from '../data/arabicAcademyData';
import {
  CpanelDbConfig,
  generateCpanelSqlDump,
  generateCpanelPhpApi
} from './cpanelSqlGenerator';

interface ZipEntryInput {
  name: string;
  content: string;
}

// Standard CRC-32 Lookup Table for PKZIP
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createZipArchiveBlob(entries: ZipEntryInput[]): Blob {
  const encoder = new TextEncoder();
  const encodedEntries = entries.map((entry) => {
    const nameBytes = encoder.encode(entry.name);
    const dataBytes = encoder.encode(entry.content);
    const crc = crc32(dataBytes);
    return { nameBytes, dataBytes, crc };
  });

  // Calculate total byte size
  let localHeadersAndDataSize = 0;
  let centralDirectorySize = 0;

  for (const item of encodedEntries) {
    localHeadersAndDataSize += 30 + item.nameBytes.length + item.dataBytes.length;
    centralDirectorySize += 46 + item.nameBytes.length;
  }

  const totalSize = localHeadersAndDataSize + centralDirectorySize + 22;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1f) << 11) |
    ((now.getMinutes() & 0x3f) << 5) |
    ((now.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((now.getFullYear() - 1980) & 0x7f) << 9) |
    (((now.getMonth() + 1) & 0x0f) << 5) |
    (now.getDate() & 0x1f);

  let offset = 0;
  const localOffsets: number[] = [];

  // 1. Write Local File Headers + File Data
  for (const item of encodedEntries) {
    localOffsets.push(offset);
    view.setUint32(offset, 0x04034b50, true); // Local file header signature
    view.setUint16(offset + 4, 20, true); // Version needed to extract (2.0)
    view.setUint16(offset + 6, 0x0800, true); // UTF-8 filename flag
    view.setUint16(offset + 8, 0, true); // Compression method (0 = Store)
    view.setUint16(offset + 10, dosTime, true);
    view.setUint16(offset + 12, dosDate, true);
    view.setUint32(offset + 14, item.crc, true);
    view.setUint32(offset + 18, item.dataBytes.length, true); // Compressed size
    view.setUint32(offset + 22, item.dataBytes.length, true); // Uncompressed size
    view.setUint16(offset + 26, item.nameBytes.length, true); // File name length
    view.setUint16(offset + 28, 0, true); // Extra field length
    offset += 30;

    uint8.set(item.nameBytes, offset);
    offset += item.nameBytes.length;

    uint8.set(item.dataBytes, offset);
    offset += item.dataBytes.length;
  }

  const centralDirStart = offset;

  // 2. Write Central Directory File Headers
  for (let i = 0; i < encodedEntries.length; i++) {
    const item = encodedEntries[i];
    view.setUint32(offset, 0x02014b50, true); // Central directory signature
    view.setUint16(offset + 4, 20, true); // Version made by
    view.setUint16(offset + 6, 20, true); // Version needed to extract
    view.setUint16(offset + 8, 0x0800, true); // UTF-8 flag
    view.setUint16(offset + 10, 0, true); // Compression method (0 = Store)
    view.setUint16(offset + 12, dosTime, true);
    view.setUint16(offset + 14, dosDate, true);
    view.setUint32(offset + 16, item.crc, true);
    view.setUint32(offset + 20, item.dataBytes.length, true);
    view.setUint32(offset + 24, item.dataBytes.length, true);
    view.setUint16(offset + 28, item.nameBytes.length, true);
    view.setUint16(offset + 30, 0, true); // Extra field length
    view.setUint16(offset + 32, 0, true); // File comment length
    view.setUint16(offset + 34, 0, true); // Disk number start
    view.setUint16(offset + 36, 0, true); // Internal file attributes
    view.setUint32(offset + 38, 0, true); // External file attributes
    view.setUint32(offset + 42, localOffsets[i], true); // Relative offset of local header
    offset += 46;

    uint8.set(item.nameBytes, offset);
    offset += item.nameBytes.length;
  }

  const centralDirSize = offset - centralDirStart;

  // 3. Write End of Central Directory Record (EOCD)
  view.setUint32(offset, 0x06054b50, true); // EOCD signature
  view.setUint16(offset + 4, 0, true); // Number of this disk
  view.setUint16(offset + 6, 0, true); // Disk where central directory starts
  view.setUint16(offset + 8, encodedEntries.length, true); // Entries on this disk
  view.setUint16(offset + 10, encodedEntries.length, true); // Total entries
  view.setUint32(offset + 12, centralDirSize, true); // Size of central directory
  view.setUint32(offset + 16, centralDirStart, true); // Offset of central directory
  view.setUint16(offset + 20, 0, true); // Comment length

  return new Blob([buffer], { type: 'application/zip' });
}

function generateStandaloneCpanelHtml(
  programs: ProgramTrack[],
  schedules: ClassSchedule[],
  registrations: RegistrationRecord[]
): string {
  const initialDataJson = JSON.stringify({
    programs,
    schedules,
    registrations,
    level1Materi: LEVEL_1_MATERI_TABLE
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tadribul Lughah — Pendaftaran Pembelajaran Bahasa Arab Online (Level 1–4)</title>
  <meta name="description" content="Portal Pendaftaran Program Pembelajaran Bahasa Arab Tadribul Lughah: Level 1–3 Ilmu Nahwu & Level 4 Ilmu Shorof. Kelas Online Malam (20.00 – 22.00 WIB), Rp 510.000 per level (bisa dicicil 6x Rp 85.000/bulan)." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;600&family=Noto+Naskh+Arabic:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8FAFC; color: #0F172A; }
    .font-display { font-family: 'Fraunces', serif; }
    .font-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
    .font-arabic { font-family: 'Noto Naskh Arabic', serif; line-height: 1.8; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <!-- Header 3-Zone Top Bar -->
  <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
    <div class="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
      <a href="#/beranda" onclick="navigate('beranda'); return false;" class="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0">
        Tadribul Lughah
      </a>
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
        <a href="#/beranda" id="nav-beranda" onclick="navigate('beranda'); return false;" class="hover:text-slate-900 whitespace-nowrap">Beranda</a>
        <a href="#/kurikulum" id="nav-kurikulum" onclick="navigate('kurikulum'); return false;" class="hover:text-slate-900 whitespace-nowrap">Kurikulum</a>
        <a href="#/jadwal" id="nav-jadwal" onclick="navigate('jadwal'); return false;" class="hover:text-slate-900 whitespace-nowrap">Jadwal Malam</a>
        <a href="#/pendaftaran" id="nav-pendaftaran" onclick="navigate('pendaftaran'); return false;" class="hover:text-slate-900 whitespace-nowrap">Pendaftaran</a>
        <a href="#/cek-status" id="nav-cek-status" onclick="navigate('cek-status'); return false;" class="hover:text-slate-900 whitespace-nowrap">Cek Status</a>
      </nav>
      <div class="flex items-center gap-3 shrink-0">
        <button type="button" onclick="navigate('pendaftaran')" id="header-cta-btn" class="px-4 py-2 text-xs font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800 transition-colors whitespace-nowrap">
          Daftar Sekarang
        </button>
      </div>
    </div>
  </header>

  <!-- Sub-Header Mobile Nav & Superadmin Bar -->
  <div class="bg-white border-b border-slate-200">
    <div class="max-w-[1200px] mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
      <div class="flex md:hidden items-center gap-1 overflow-x-auto py-1">
        <button onclick="navigate('beranda')" class="px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 hover:bg-slate-100">Beranda</button>
        <button onclick="navigate('kurikulum')" class="px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 hover:bg-slate-100">Kurikulum</button>
        <button onclick="navigate('jadwal')" class="px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 hover:bg-slate-100">Jadwal</button>
        <button onclick="navigate('pendaftaran')" class="px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 hover:bg-slate-100">Daftar</button>
        <button onclick="navigate('cek-status')" class="px-2.5 py-1 text-xs font-medium rounded-md text-slate-700 hover:bg-slate-100">Cek Status</button>
        <a href="./pelajar.html" class="px-2.5 py-1 text-xs font-semibold rounded-md text-emerald-900 bg-emerald-50">Portal Pelajar</a>
        <a href="./login.html" class="px-2.5 py-1 text-xs font-semibold rounded-md text-slate-800 bg-slate-100">Login</a>
      </div>
      <div class="hidden md:flex items-center gap-2 text-xs text-slate-500">
        <span>Tadribul Lughah</span>
        <span>/</span>
        <span id="breadcrumb-label" class="font-semibold text-slate-900">Halaman Beranda</span>
      </div>
      <div class="flex items-center gap-2 ml-auto">
        <a href="./pelajar.html" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-900 rounded-md hover:bg-emerald-800 transition-colors">
          Portal Pelajar (pelajar.html)
        </a>
        <a href="./login.html" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors">
          Login Akun (login.html) →
        </a>
      </div>
    </div>
  </div>

  <!-- Main Multi-Page Container -->
  <main id="app-root" class="flex-1"></main>

  <!-- Footer -->
  <footer class="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
    <div class="max-w-[1200px] mx-auto px-6">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-800">
        <div class="md:col-span-5 space-y-3">
          <p class="text-lg font-bold text-white font-display">Program Pembelajaran Bahasa Arab Tadribul Lughah</p>
          <p class="font-arabic text-xl text-emerald-400">بَرْنَامَجُ تَدْرِيبِ اللُّغَةِ العَرَبِيَّةِ — النَّحْوُ وَالصَّرْفُ</p>
          <p class="text-xs text-slate-400 leading-relaxed max-w-sm">
            Kurikulum Pembelajaran Bahasa Arab Online Terstruktur: Level 1–3 Ilmu Nahwu dan Level 4 Ilmu Shorof.
          </p>
        </div>
        <div class="md:col-span-4 space-y-2 text-xs">
          <p class="font-semibold text-white">Jadwal Kelas Malam Online (20.00 – 22.00 WIB)</p>
          <p>Level 1 (Nahwu Dasar): Kamis & Jumat (20.00 – 22.00 WIB)</p>
          <p>Level 2 (Nahwu Menengah): Selasa & Rabu (20.00 – 22.00 WIB)</p>
          <p>Level 3 (Nahwu) & Level 4 (Shorof): Sabtu & Ahad (20.00 – 22.00 WIB)</p>
          <p class="font-mono text-slate-300 pt-1">Email: admisi@tadribullughah.or.id · WhatsApp Admin: 0812-7918-4402</p>
        </div>
        <div class="md:col-span-3 space-y-2 text-xs">
          <p class="font-semibold text-white">Navigasi Halaman</p>
          <ul class="space-y-1.5">
            <li><button onclick="navigate('beranda')" class="hover:text-white">Halaman Beranda</button></li>
            <li><button onclick="navigate('kurikulum')" class="hover:text-white">Halaman Kurikulum Level 1–4</button></li>
            <li><button onclick="navigate('jadwal')" class="hover:text-white">Halaman Jadwal Kelas Malam</button></li>
            <li><button onclick="navigate('pendaftaran')" class="hover:text-white">Halaman Formulir Pendaftaran</button></li>
            <li><button onclick="navigate('cek-status')" class="hover:text-white">Halaman Cek Status Pendaftar</button></li>
            <li class="pt-1"><a href="./login.html" class="text-emerald-400 hover:text-emerald-300 font-medium">Login Superadmin (login.html) →</a></li>
          </ul>
        </div>
      </div>
      <div class="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <p>© ${new Date().getFullYear()} Program Tadribul Lughah. Seluruh hak cipta dilindungi undang-undang.</p>
        <p>Kelas Online Malam (20.00 – 22.00 WIB) · Level 1–3 Ilmu Nahwu & Level 4 Ilmu Shorof</p>
      </div>
    </div>
  </footer>

  <script>
    const INITIAL_DATA = ${initialDataJson};
    let state = {
      page: 'beranda',
      programs: JSON.parse(localStorage.getItem('tl_cpanel_programs')) || INITIAL_DATA.programs,
      schedules: JSON.parse(localStorage.getItem('tl_cpanel_schedules')) || INITIAL_DATA.schedules,
      registrations: JSON.parse(localStorage.getItem('tl_cpanel_registrations')) || INITIAL_DATA.registrations,
      selectedProgramId: 'tl-level-1',
      selectedScheduleId: 'sch-lv1-malam',
      expandedSyllabusProgramId: 'tl-level-1',
      submittedRecord: null,
      searchQuery: '',
      isAdminAuthenticated: false,
      adminTab: 'programs',
      adminSelectedProgramId: 'tl-level-1'
    };

    function formatIDR(amount) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
    }

    function persistLocal() {
      localStorage.setItem('tl_cpanel_programs', JSON.stringify(state.programs));
      localStorage.setItem('tl_cpanel_schedules', JSON.stringify(state.schedules));
      localStorage.setItem('tl_cpanel_registrations', JSON.stringify(state.registrations));
    }

    // Automatically load live data from ./api.php on cPanel if available
    async function syncFromCpanelApi() {
      try {
        const res = await fetch('./api.php');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.status === 'ok') {
          if (Array.isArray(data.programs) && data.programs.length > 0) {
            state.programs = data.programs.map(p => ({
              id: p.id,
              code: p.code,
              indexNumber: p.index_number,
              levelNumber: Number(p.level_number),
              title: p.title,
              arabicTitle: p.arabic_title,
              category: p.category,
              categoryLabel: p.category_label,
              scheduleDays: p.schedule_days,
              scheduleTime: p.schedule_time,
              levelRecommendation: p.level_recommendation,
              durationWeeks: Number(p.duration_weeks),
              sessionsCount: Number(p.sessions_count),
              sessionMinutes: Number(p.session_minutes),
              tuitionIDR: Number(p.tuition_idr),
              summary: p.summary,
              targetOutcome: p.target_outcome,
              kitabReference: p.kitab_reference,
              registrationOpen: p.registration_open !== undefined ? Boolean(Number(p.registration_open)) : true,
              angkatan: p.angkatan || 'Angkatan 1',
              modules: (INITIAL_DATA.programs.find(ip => ip.id === p.id) || {}).modules || []
            }));
          }
          if (Array.isArray(data.schedules) && data.schedules.length > 0) {
            state.schedules = data.schedules.map(s => ({
              id: s.id,
              batchCode: s.batch_code,
              programId: s.program_id,
              levelNumber: Number(s.level_number),
              programName: s.program_name,
              levelName: s.level_name,
              modeLabel: s.mode_label,
              days: s.days,
              timeWIB: s.time_wib,
              startDate: s.start_date,
              instructor: s.instructor,
              capacity: Number(s.capacity),
              enrolled: Number(s.enrolled),
              feeIDR: Number(s.fee_idr)
            }));
          }
          if (Array.isArray(data.registrations) && data.registrations.length > 0) {
            state.registrations = data.registrations.map(r => ({
              registrationNumber: r.registration_number,
              fullName: r.full_name,
              gender: r.gender || 'Laki-laki',
              email: r.email,
              whatsapp: r.whatsapp,
              occupation: r.occupation,
              city: r.city,
              selectedProgramId: r.selected_program_id,
              selectedProgramName: r.selected_program_name,
              selectedScheduleId: r.selected_schedule_id,
              selectedScheduleSummary: r.selected_schedule_summary,
              learningGoal: r.learning_goal,
              totalTuitionIDR: Number(r.total_tuition_idr),
              registeredAt: r.registered_at,
              status: r.status
            }));
          }
          persistLocal();
          render();
        }
      } catch (e) {
        // Fallback to local state when running offline
      }
    }

    function navigate(page) {
      state.page = page;
      window.location.hash = '/' + page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      render();
    }

    function chooseProgram(progId) {
      state.selectedProgramId = progId;
      const sch = state.schedules.find(s => s.programId === progId);
      if (sch) state.selectedScheduleId = sch.id;
      navigate('pendaftaran');
    }

    function createStudentAccountCpanel(e) {
      e.preventDefault();
      const form = e.target;
      const fullName = form.fullName.value.trim();
      const gender = form.gender.value;
      const email = form.email.value.trim().toLowerCase();
      const whatsapp = form.whatsapp.value.trim();
      const city = form.city.value.trim();
      const occupation = form.occupation.value;
      const password = form.password.value.trim();

      if (fullName.length < 3 || !email.includes('@') || whatsapp.length < 8 || city.length < 2) {
        alert('Mohon lengkapi Nama, Email, Nomor WhatsApp, dan Kota Domisili dengan benar.');
        return;
      }
      if (password.length < 6) {
        alert('Kata Sandi Akun Pelajar minimal 6 karakter.');
        return;
      }

      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const userRegNo = 'TL-2026-' + randomDigits;
      const nowStr = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date()) + ' WIB';

      const accounts = JSON.parse(localStorage.getItem('tl_student_accounts_v1') || '[]');
      const newAcc = {
        registrationNumber: userRegNo,
        fullName,
        gender,
        email,
        whatsapp,
        city,
        occupation,
        password,
        enrolledProgramIds: [],
        completedModuleKeys: [],
        createdAt: nowStr
      };
      accounts.unshift(newAcc);
      localStorage.setItem('tl_student_accounts_v1', JSON.stringify(accounts));
      sessionStorage.setItem('tl_student_verified_session_v1', JSON.stringify({
        registrationNumber: userRegNo,
        email,
        fullName,
        gender,
        city,
        loginAt: new Date().toISOString()
      }));
      render();
    }

    function loginStudentAccountCpanel(e) {
      e.preventDefault();
      const form = e.target;
      const id = form.identifier.value.trim().toLowerCase();
      const pass = form.password.value.trim();
      const accounts = JSON.parse(localStorage.getItem('tl_student_accounts_v1') || '[]');
      const matched = accounts.find(a => (a.email && a.email.toLowerCase() === id) || (a.registrationNumber && a.registrationNumber.toLowerCase() === id));
      if (!matched || matched.password !== pass) {
        alert('Email/Nomor Registrasi atau kata sandi tidak sesuai.');
        return;
      }
      sessionStorage.setItem('tl_student_verified_session_v1', JSON.stringify({
        registrationNumber: matched.registrationNumber,
        email: matched.email,
        fullName: matched.fullName,
        gender: matched.gender || 'Laki-laki',
        city: matched.city || 'Indonesia',
        loginAt: new Date().toISOString()
      }));
      render();
    }

    function logoutStudentCpanel() {
      sessionStorage.removeItem('tl_student_verified_session_v1');
      render();
    }

    function enrollLevelCpanel(programId) {
      const sessionRaw = sessionStorage.getItem('tl_student_verified_session_v1');
      if (!sessionRaw) {
        alert('Silakan masuk atau buat akun terlebih dahulu.');
        return;
      }
      const session = JSON.parse(sessionRaw);
      const prog = state.programs.find(p => p.id === programId) || state.programs[0];
      if (prog.registrationOpen === false) {
        alert('Mohon maaf, pendaftaran untuk Level ' + prog.levelNumber + ' saat ini sedang ditutup (OFF) oleh Superadmin.');
        return;
      }

      const sch = state.schedules.find(s => s.programId === prog.id) || state.schedules[0];
      const regNo = 'TL-2026-' + Math.floor(1000 + Math.random() * 9000);
      const nowStr = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date()) + ' WIB';

      const newRecord = {
        registrationNumber: regNo,
        fullName: session.fullName,
        gender: session.gender || 'Laki-laki',
        email: session.email,
        whatsapp: session.whatsapp || '0812-xxxx-xxxx',
        occupation: 'Pelajar Terdaftar',
        city: session.city || 'Indonesia',
        selectedProgramId: prog.id,
        selectedProgramName: prog.title,
        selectedScheduleId: sch.id,
        selectedScheduleSummary: sch.batchCode + ' · ' + sch.days + ' (' + sch.timeWIB + ') · Online',
        learningGoal: 'Menguasai kaidah Nahwu dan Shorof secara sistematis.',
        totalTuitionIDR: prog.tuitionIDR,
        registeredAt: nowStr,
        status: 'Terverifikasi — Menunggu Orientasi'
      };

      state.registrations.unshift(newRecord);
      localStorage.setItem('tl_cpanel_registrations', JSON.stringify(state.registrations));
      state.submittedRecord = newRecord;
      render();
    }

      state.registrations.unshift(newRecord);
      state.submittedRecord = newRecord;
      persistLocal();

      fetch('./api.php?entity=registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      }).catch(() => {});

      render();
    }

    function loginAdmin(e) {
      e.preventDefault();
      const email = e.target.adminEmail.value.trim().toLowerCase();
      if (email === 'mazharhajid@gmail.com') {
        state.isAdminAuthenticated = true;
        render();
      } else {
        alert('Akses ditolak. Gunakan email Superadmin: mazharhajid@gmail.com');
      }
    }

    function saveAdminProgram(e) {
      e.preventDefault();
      const f = e.target;
      const idx = state.programs.findIndex(p => p.id === state.adminSelectedProgramId);
      if (idx === -1) return;
      const updated = {
        ...state.programs[idx],
        title: f.title.value,
        arabicTitle: f.arabicTitle.value,
        scheduleDays: f.scheduleDays.value,
        scheduleTime: f.scheduleTime.value,
        tuitionIDR: Number(f.tuitionIDR.value) || 510000,
        kitabReference: f.kitabReference.value,
        summary: f.summary.value,
        targetOutcome: f.targetOutcome.value
      };
      state.programs[idx] = updated;
      persistLocal();
      fetch('./api.php?entity=program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
      alert('Perubahan kurikulum berhasil disimpan ke database!');
      render();
    }

    function render() {
      const root = document.getElementById('app-root');
      const primaryFee = state.programs[0]?.tuitionIDR || 510000;
      document.getElementById('header-cta-btn').textContent = 'Daftar (' + formatIDR(primaryFee) + '/Level)';

      ['beranda', 'kurikulum', 'jadwal', 'pendaftaran', 'cek-status'].forEach(id => {
        const el = document.getElementById('nav-' + id);
        if (el) {
          el.className = state.page === id
            ? 'text-emerald-900 font-semibold underline underline-offset-8 decoration-2 whitespace-nowrap'
            : 'text-slate-600 hover:text-slate-900 whitespace-nowrap';
        }
      });

      const labels = {
        'beranda': 'Halaman Beranda',
        'kurikulum': 'Halaman Kurikulum Level 1–4 (Nahwu & Shorof)',
        'jadwal': 'Halaman Jadwal Kelas Malam Online (20.00 – 22.00 WIB)',
        'pendaftaran': 'Halaman Formulir Pendaftaran Online',
        'cek-status': 'Halaman Cek Status & Direktori Peserta',
        'superadmin': 'Halaman Khusus Superadmin (Database MySQL cPanel)'
      };
      document.getElementById('breadcrumb-label').textContent = labels[state.page] || 'Halaman Beranda';

      if (state.page === 'beranda') {
        root.innerHTML = \`
          <section class="py-12 sm:py-16 bg-white border-b border-slate-200">
            <div class="max-w-[1200px] mx-auto px-6">
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
                <div class="lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <p class="text-xs font-semibold text-emerald-900 mb-3">Program Pembelajaran Bahasa Arab Tadribul Lughah · Kelas Malam 20.00 – 22.00 WIB · \${formatIDR(primaryFee)} / Level (Cicilan 6x \${formatIDR(Math.round(primaryFee / 6))}/bln)</p>
                    <p dir="rtl" class="font-arabic text-2xl sm:text-3xl text-emerald-900 mb-3 text-left">بَرْنَامَجُ تَدْرِيبِ اللُّغَةِ العَرَبِيَّةِ — النَّحْوُ وَالصَّرْفُ التَّطْبِيقِيّ</p>
                    <h1 class="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight leading-tight">
                      Program Tadribul Lughah: Belajar Nahwu (Level 1–3) & Shorof (Level 4) secara Online
                    </h1>
                    <p class="mt-4 text-base text-slate-600 leading-relaxed">
                      Kurikulum bahasa Arab berjenjang secara <strong>Online Live Interaktif</strong> khusus di <strong>malam hari pukul 20.00 – 22.00 WIB</strong> dengan biaya <strong>\${formatIDR(primaryFee)} per level</strong> (bisa dicicil per bulan dibagi 6x yaitu <strong>\${formatIDR(Math.round(primaryFee / 6))} / bulan</strong>).
                    </p>
                  </div>
                  <div class="mt-8 pt-6 border-t border-slate-200 flex flex-wrap gap-3">
                    <button onclick="navigate('pendaftaran')" class="px-6 py-3 text-sm font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800">Daftar Sekarang — \${formatIDR(primaryFee)} / Level →</button>
                    <button onclick="navigate('kurikulum')" class="px-5 py-3 text-sm font-medium text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200">Buka Halaman Kurikulum</button>
                  </div>
                </div>
                <div class="lg:col-span-5 bg-slate-900 text-white rounded-xl p-8 flex flex-col justify-between border border-slate-800">
                  <div>
                    <p class="text-xs font-mono text-emerald-400">JADWAL KELAS MALAM ONLINE (ZOOM)</p>
                    <h2 class="text-xl font-semibold mt-2">Waktu Belajar Malam Hari 20.00 – 22.00 WIB</h2>
                    <p class="text-xs text-slate-300 mt-2 leading-relaxed">Seluruh sesi dilengkapi Modul Kitab PDF dan Rekaman Ulang di setiap pertemuan.</p>
                  </div>
                  <div class="space-y-2.5 pt-6 border-t border-slate-800 text-xs font-mono">
                    \${state.programs.map(p => \`
                      <div class="flex justify-between">
                        <span class="text-emerald-300">Level \${p.levelNumber} (\${p.angkatan || 'Angkatan 1'})</span>
                        <span>\${p.scheduleDays} · \${p.scheduleTime}</span>
                      </div>
                    \`).join('')}
                  </div>
                </div>
              </div>
              <div class="mt-12 pt-10 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                \${state.programs.map(p => \`
                  <div class="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <p class="text-xl font-bold font-mono text-slate-900">Level \${p.levelNumber} · \${p.category === 'shorof' ? 'Shorof' : 'Nahwu'}</p>
                      <p class="text-xs text-emerald-900 font-semibold mt-1">\${p.angkatan || 'Angkatan 1'} · \${p.scheduleDays} (\${p.scheduleTime})</p>
                      <p class="text-xs text-slate-700 mt-2">\${p.title}</p>
                    </div>
                    \${p.registrationOpen === false ? \`
                      <span class="mt-4 text-xs font-semibold text-rose-700">Pendaftaran Level \${p.levelNumber} Ditutup (OFF)</span>
                    \` : \`
                      <button onclick="chooseProgram('\${p.id}')" class="mt-4 text-xs font-semibold text-emerald-900 hover:underline text-left">Daftar Level \${p.levelNumber} (\${formatIDR(p.tuitionIDR)}) →</button>
                    \`}
                  </div>
                \`).join('')}
              </div>
            </div>
          </section>
        \`;
        return;
      }

      if (state.page === 'kurikulum') {
        root.innerHTML = \`
          <section class="py-12 max-w-[1200px] mx-auto px-6 space-y-8">
            <div class="border-b border-slate-200 pb-6">
              <p class="text-xs font-semibold text-emerald-800">Halaman Kurikulum Tadribul Lughah</p>
              <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 mt-1">Struktur Kurikulum Level 1–3 Ilmu Nahwu & Level 4 Ilmu Shorof</h1>
              <p class="text-sm text-slate-600 mt-2">Biaya per level <strong>\${formatIDR(primaryFee)}</strong> (bisa dicicil per bulan dibagi 6: <strong>\${formatIDR(Math.round(primaryFee / 6))} / bulan</strong>).</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              \${state.programs.map((p, idx) => {
                const isExpanded = state.expandedSyllabusProgramId === p.id;
                const footerBg = idx === 0
                  ? 'bg-[#EEF4FA] border-t border-[#D6E4F0]'
                  : idx === 1
                    ? 'bg-[#EDF7F2] border-t border-[#CDE6DA]'
                    : idx === 2
                      ? 'bg-[#FDF2F2] border-t border-[#F2D5D5]'
                      : 'bg-[#FEFBEB] border-t border-[#F3E5AB]';
                return \`
                <article class="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between">
                  <div class="p-6">
                    <div class="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 mb-2">
                      <span class="font-semibold text-emerald-900">\${p.code} · \${p.categoryLabel}</span>
                      <span>·</span>
                      <span class="font-semibold text-emerald-800">\${p.angkatan || 'Angkatan 1'}</span>
                      <span>·</span>
                      <span>\${p.scheduleDays} (\${p.scheduleTime})</span>
                    </div>
                    <p dir="rtl" class="font-arabic text-xl text-emerald-900 text-right mb-2">\${p.arabicTitle}</p>
                    <h2 class="text-lg font-semibold text-slate-900">\${p.title}</h2>
                    <p class="text-xs text-slate-600 mt-2 leading-relaxed">\${p.summary}</p>
                    <div class="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                      <p><strong>Modul Pegangan:</strong> \${p.kitabReference}</p>
                      <p><strong>Target Capaian:</strong> \${p.targetOutcome}</p>
                    </div>
                    <div class="mt-4">
                      <button type="button" onclick="state.expandedSyllabusProgramId = state.expandedSyllabusProgramId === '\${p.id}' ? '' : '\${p.id}'; render();" class="text-xs font-semibold text-emerald-900 hover:underline">
                        \${isExpanded ? 'Sembunyikan Rincian Silabus ↑' : 'Lihat Silabus ' + ((p.modules && p.modules.length) || (p.levelNumber === 1 ? 22 : 4)) + ' Tahap Pembelajaran ↓'}
                      </button>
                      \${isExpanded ? \`
                        <div class="mt-4 pt-4 border-t border-slate-200">
                          \${p.levelNumber === 1 ? \`
                            <div class="overflow-x-auto border border-slate-200 rounded-lg max-h-[340px] overflow-y-auto">
                              <table class="w-full text-left border-collapse text-xs">
                                <thead class="sticky top-0 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                                  <tr>
                                    <th class="py-2 pl-3 pr-2 w-10">No</th>
                                    <th class="py-2 px-2 w-24">Pekan</th>
                                    <th class="py-2 px-2">Daftar Materi Level 1 (1 Pekan 1 Materi)</th>
                                    <th class="py-2 pl-2 pr-3 text-right">Pokok Kaidah</th>
                                  </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-200 bg-white">
                                  \${(INITIAL_DATA.level1Materi || []).map(row => \`
                                    <tr class="hover:bg-slate-50">
                                      <td class="py-2 pl-3 pr-2 font-mono font-semibold text-slate-500">\${row.no}</td>
                                      <td class="py-2 px-2 font-mono font-semibold text-emerald-900 whitespace-nowrap">\${row.pekan}</td>
                                      <td class="py-2 px-2 font-medium text-slate-900">\${row.title}</td>
                                      <td dir="rtl" class="py-2 pl-2 pr-3 font-arabic text-sm text-emerald-900 text-right whitespace-nowrap">\${row.arabicTerm}</td>
                                    </tr>
                                  \`).join('')}
                                </tbody>
                              </table>
                            </div>
                          \` : \`
                            <div class="space-y-2.5 text-xs">
                              \${(p.modules || []).map(mod => \`
                                <div class="pb-2 border-b border-slate-100 last:border-b-0 flex justify-between gap-2">
                                  <div>
                                    <span class="font-mono font-semibold text-slate-900">\${mod.weekRange}</span> — <span class="font-semibold text-slate-800">\${mod.topic}</span>
                                    <p class="text-slate-500 mt-0.5">\${mod.outcome}</p>
                                  </div>
                                  <span dir="rtl" class="font-arabic text-sm text-emerald-900 shrink-0">\${mod.arabicTerm}</span>
                                </div>
                              \`).join('')}
                            </div>
                          \`}
                        </div>
                      \` : ''}
                    </div>
                  </div>
                  <div class="px-6 py-4 \${footerBg} flex items-center justify-between gap-4">
                    <div>
                      <span class="text-xs text-slate-600 block">Biaya Pendidikan (Bisa Dicicil 6x Per Bulan)</span>
                      <span class="text-base font-bold font-mono text-slate-900 block">\${formatIDR(p.tuitionIDR)} / level</span>
                      <span class="text-[11px] font-mono text-emerald-900 font-semibold">Cicilan: \${formatIDR(Math.round(p.tuitionIDR / 6))} / bulan (× 6 bulan)</span>
                    </div>
                    \${p.registrationOpen === false ? \`
                      <button disabled class="px-4 py-2 text-xs font-semibold text-rose-900 bg-rose-100 border border-rose-300 rounded-lg cursor-not-allowed">Pendaftaran Ditutup (OFF)</button>
                    \` : \`
                      <button onclick="chooseProgram('\${p.id}')" class="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-900 rounded-lg">Daftar Level \${p.levelNumber} →</button>
                    \`}
                  </div>
                </article>
              \`}).join('')}
            </div>
          </section>
        \`;
        return;
      }

      if (state.page === 'jadwal') {
        root.innerHTML = \`
          <section class="py-12 max-w-[1200px] mx-auto px-6 space-y-8">
            <div class="border-b border-slate-200 pb-6">
              <p class="text-xs font-semibold text-emerald-800">Halaman Jadwal Kelas Malam Online</p>
              <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900 mt-1">Jadwal Kelas Online Tadribul Lughah (20.00 – 22.00 WIB)</h1>
            </div>
            <div class="overflow-x-auto bg-white border border-slate-200 rounded-xl">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                    <th class="py-3.5 pl-6 pr-4">Kode Kelas</th>
                    <th class="py-3.5 px-4">Level & Materi</th>
                    <th class="py-3.5 px-4">Pengajar</th>
                    <th class="py-3.5 px-4">Hari & Jam Malam</th>
                    <th class="py-3.5 px-4">Biaya / Level</th>
                    <th class="py-3.5 pl-4 pr-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  \${state.schedules.map(s => {
                    const parentProg = state.programs.find(p => p.id === s.programId);
                    const isClosed = parentProg && parentProg.registrationOpen === false;
                    return \`
                    <tr class="hover:bg-slate-50">
                      <td class="py-4 pl-6 pr-4 font-mono font-semibold text-slate-900">\${s.batchCode}</td>
                      <td class="py-4 px-4"><strong>\${s.programName}</strong><br><span class="text-slate-500">\${(parentProg && parentProg.angkatan) || 'Angkatan 1'} · Mulai \${s.startDate}</span></td>
                      <td class="py-4 px-4">\${s.instructor}<br><span class="text-emerald-800">\${s.modeLabel}</span></td>
                      <td class="py-4 px-4 font-mono"><strong>\${s.days}</strong><br>\${s.timeWIB}</td>
                      <td class="py-4 px-4 font-mono"><span class="font-semibold block">\${formatIDR(s.feeIDR)} / level</span><span class="text-emerald-800 text-[11px]">Cicilan 6x: \${formatIDR(Math.round(s.feeIDR / 6))}/bln</span></td>
                      <td class="py-4 pl-4 pr-6 text-right">
                        \${isClosed ? \`
                          <button disabled class="px-3.5 py-2 text-xs font-semibold text-rose-900 bg-rose-100 border border-rose-300 rounded-lg cursor-not-allowed">Pendaftaran Ditutup</button>
                        \` : \`
                          <button onclick="chooseProgram('\${s.programId}')" class="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800">Pilih & Daftar</button>
                        \`}
                      </td>
                    </tr>
                  \`}).join('')}
                </tbody>
              </table>
            </div>
          </section>
        \`;
        return;
      }

      if (state.page === 'pendaftaran') {
        const prog = state.programs.find(p => p.id === state.selectedProgramId) || state.programs[0];
        const sch = state.schedules.find(s => s.programId === prog.id) || state.schedules[0];
        if (state.submittedRecord) {
          const rec = state.submittedRecord;
          root.innerHTML = \`
            <section class="py-12 max-w-[900px] mx-auto px-6">
              <div class="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
                <div class="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <p class="text-xs font-semibold text-emerald-800">PENDAFTARAN BERHASIL DITERIMA</p>
                    <h1 class="text-2xl font-semibold text-slate-900 mt-1">Ahlan wa Sahlan, \${rec.fullName}</h1>
                  </div>
                  <button onclick="state.submittedRecord=null; render();" class="px-4 py-2 text-xs font-semibold bg-slate-100 rounded-lg">Daftar Peserta Baru</button>
                </div>
                <div class="bg-slate-900 text-white rounded-xl p-6 space-y-4">
                  <div class="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div>
                      <p class="text-xs font-mono text-emerald-400">KARTU PESERTA RESMI · TADRIBUL LUGHAH</p>
                      <p class="text-lg font-mono font-bold mt-1">\${rec.registrationNumber}</p>
                    </div>
                    <p dir="rtl" class="font-arabic text-2xl text-emerald-300">تَدْرِيبُ اللُّغَةِ</p>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div><span class="text-slate-400 block">Nama & Jenis Kelamin:</span><strong class="text-sm">\${rec.fullName} (\${rec.gender || 'Laki-laki'})</strong></div>
                    <div><span class="text-slate-400 block">Kota Domisili:</span><strong class="text-sm">\${rec.city}</strong></div>
                    <div class="sm:col-span-2"><span class="text-slate-400 block">Level Pilihan:</span><strong class="text-sm">\${rec.selectedProgramName}</strong></div>
                    <div class="sm:col-span-2"><span class="text-slate-400 block">Jadwal Kelas Online:</span><strong class="font-mono">\${rec.selectedScheduleSummary}</strong></div>
                  </div>
                </div>
              </div>
            </section>
          \`;
          return;
        }

        const sessionRaw = sessionStorage.getItem('tl_student_verified_session_v1');
        const session = sessionRaw ? JSON.parse(sessionRaw) : null;

        if (!session) {
          root.innerHTML = \`
            <section class="py-12 max-w-[900px] mx-auto px-6">
              <div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div class="p-6 sm:p-8 bg-slate-900 text-white space-y-2">
                  <p class="text-xs font-mono text-emerald-400 font-semibold uppercase">LANGKAH 1 · WAJIB PUNYA AKUN SEBELUM DAFTAR</p>
                  <h1 class="text-xl sm:text-2xl font-bold font-display">Buat atau Masuk ke Akun Pelajar Anda</h1>
                  <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Setiap pendaftar wajib memiliki akun terlebih dahulu. 1 akun ini dapat Anda gunakan untuk mendaftar hingga <strong>4 program level</strong> (Level 1 Nahwu Dasar s/d Level 4 Shorof) tanpa harus membuat akun lagi! Biaya per level <strong>Rp 510.000</strong> (cicilan 6x <strong>Rp 85.000/bln</strong>).
                  </p>
                </div>

                <div class="p-6 sm:p-8 space-y-8">
                  <form onsubmit="createStudentAccountCpanel(event)" class="space-y-5">
                    <h2 class="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">1. Buat Akun Pelajar Baru</h2>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-semibold mb-1">Nama Lengkap *</label>
                        <input name="fullName" required placeholder="Contoh: Ahmad Zaki Al-Manshur" class="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold mb-1">Jenis Kelamin *</label>
                        <select name="gender" required class="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg">
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-semibold mb-1">Email Aktif *</label>
                        <input name="email" type="email" required placeholder="nama@email.com" class="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold mb-1">Nomor WhatsApp Aktif *</label>
                        <input name="whatsapp" required placeholder="0812-xxxx-xxxx" class="w-full px-3.5 py-2 text-xs font-mono border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold mb-1">Kota Domisili *</label>
                        <input name="city" required placeholder="Jakarta / Bandung / Surabaya" class="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold mb-1">Aktivitas / Latar Belakang</label>
                        <select name="occupation" class="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg">
                          <option value="Mahasiswa / Akademisi">Mahasiswa / Akademisi</option>
                          <option value="Profesional / Karyawan">Profesional / Karyawan</option>
                          <option value="Guru / Pengajar">Guru / Pengajar</option>
                          <option value="Pelajar / Santri">Pelajar / Santri</option>
                          <option value="Wiraswasta / Umum">Wiraswasta / Umum</option>
                        </select>
                      </div>
                      <div class="sm:col-span-2">
                        <label class="block text-xs font-semibold mb-1">Kata Sandi Akun (Min. 6 Karakter) *</label>
                        <input name="password" type="password" required placeholder="Minimal 6 karakter" class="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg" />
                      </div>
                    </div>
                    <button type="submit" class="w-full py-2.5 text-xs font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800 transition-colors">
                      Buat Akun & Lanjut Pilih Program (Level 1–4) →
                    </button>
                  </form>

                  <div class="pt-6 border-t border-slate-200">
                    <form onsubmit="loginStudentAccountCpanel(event)" class="space-y-4 max-w-md">
                      <h2 class="text-sm font-semibold text-slate-900">2. Sudah Punya Akun? Masuk di Sini</h2>
                      <div>
                        <label class="block text-xs font-semibold mb-1">Email / Nomor Registrasi</label>
                        <input name="identifier" required placeholder="nama@email.com atau TL-2026-xxxx" class="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label class="block text-xs font-semibold mb-1">Kata Sandi Akun</label>
                        <input name="password" type="password" required placeholder="Kata sandi akun Anda" class="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg" />
                      </div>
                      <button type="submit" class="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800">
                        Masuk & Lanjut ke Pendaftaran Program →
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </section>
          \`;
          return;
        }

        // Applicant is logged in -> show active profile & 4 level cards
        const userEmailLower = (session.email || '').toLowerCase();
        const myRegs = state.registrations.filter(r => (r.email && r.email.toLowerCase() === userEmailLower) || (r.registrationNumber === session.registrationNumber));
        const enrolledProgramIds = myRegs.map(r => r.selectedProgramId);

        root.innerHTML = \`
          <section class="py-12 max-w-[1200px] mx-auto px-6 space-y-6">
            <div class="bg-white border border-emerald-300 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span class="text-xs font-mono font-bold text-emerald-800 uppercase">AKUN PELAJAR TERHUBUNG · 1 AKUN UNTUK 4 LEVEL</span>
                <h2 class="text-lg font-bold text-slate-900 mt-0.5">\${session.fullName} (\${session.gender || 'Laki-laki'})</h2>
                <p class="text-xs text-slate-600">\${session.email} · \${session.city || 'Indonesia'}</p>
              </div>
              <div class="flex items-center gap-2">
                <a href="./pelajar.html" class="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg">Portal Pelajar (pelajar.html)</a>
                <button onclick="logoutStudentCpanel()" class="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg">Ganti Akun</button>
              </div>
            </div>

            <div class="bg-emerald-950 text-white rounded-xl p-6 sm:p-7 space-y-2">
              <p class="text-xs font-mono text-emerald-400">1 AKUN DAPAT DAFTAR HINGGA 4 PROGRAM LEVEL</p>
              <h1 class="text-xl sm:text-2xl font-bold font-display">Pilihan Program Tadribul Lughah (Level 1–4)</h1>
              <p class="text-xs sm:text-sm text-emerald-100/90">
                Biaya per level <strong>Rp 510.000</strong> (cicilan 6x <strong>Rp 85.000/bulan</strong>). Pilih level yang ingin Anda ikuti di bawah ini tanpa perlu membuat akun lagi:
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              \${state.programs.slice(0, 4).map(p => {
                const isEnrolled = enrolledProgramIds.includes(p.id);
                const matchingReg = myRegs.find(r => r.selectedProgramId === p.id);
                const isClosed = p.registrationOpen === false;
                return \`
                  <div class="rounded-xl border \${isEnrolled ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-slate-200'} p-5 flex flex-col justify-between gap-4">
                    <div class="space-y-1.5">
                      <div class="flex justify-between items-center">
                        <span class="text-xs font-mono font-bold text-emerald-800">\${p.code} · \${p.angkatan || 'Angkatan 1'}</span>
                        \${isEnrolled ? '<span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-semibold">Terdaftar</span>' : ''}
                      </div>
                      <h3 class="text-sm font-bold text-slate-900 leading-snug">\${p.title}</h3>
                      <p class="text-xs font-mono text-slate-600">\${p.scheduleDays} (\${p.scheduleTime})</p>
                      <p class="text-xs font-mono font-bold text-emerald-900">\${formatIDR(p.tuitionIDR)} / Level</p>
                      <p class="text-[11px] font-mono text-slate-500">Cicilan 6x: \${formatIDR(Math.round(p.tuitionIDR / 6))}/bln</p>
                    </div>

                    <div>
                      \${isEnrolled ? \`
                        <a href="./pelajar.html" class="w-full inline-block text-center py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 border border-emerald-300 rounded-lg hover:bg-emerald-200">
                          Buka di Pelajar.html (\${matchingReg ? matchingReg.registrationNumber : 'Terdaftar'}) →
                        </a>
                      \` : isClosed ? \`
                        <button disabled class="w-full py-2 text-xs font-semibold text-rose-900 bg-rose-100 border border-rose-300 rounded-lg cursor-not-allowed">Pendaftaran Ditutup (OFF)</button>
                      \` : \`
                        <button onclick="enrollLevelCpanel('\${p.id}')" class="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-900 rounded-lg transition-colors">
                          Daftar Level \${p.levelNumber} Ini →
                        </button>
                      \`}
                    </div>
                  </div>
                \`;
              }).join('')}
            </div>
          </section>
        \`;
        return;
      }

      if (state.page === 'cek-status') {
        const list = state.registrations.filter(r => {
          if (!state.searchQuery) return true;
          const q = state.searchQuery.toLowerCase();
          return r.registrationNumber.toLowerCase().includes(q) || r.fullName.toLowerCase().includes(q);
        });
        root.innerHTML = \`
          <section class="py-12 max-w-[1200px] mx-auto px-6 space-y-6">
            <div class="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h1 class="text-xl font-semibold text-slate-900">Cek Status & Direktori Peserta Tadribul Lughah</h1>
                  <p class="text-xs text-slate-500 mt-1">Cari berdasarkan Nomor Registrasi (TL-2026-xxxx) atau nama lengkap.</p>
                </div>
                <input type="search" value="\${state.searchQuery}" oninput="state.searchQuery=this.value; render();" placeholder="Cari No. Registrasi / Nama..." class="px-3.5 py-2 text-xs border border-slate-300 rounded-lg w-full sm:w-72" />
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr class="border-b border-slate-200 text-[11px] text-slate-500 uppercase">
                      <th class="py-3 pr-4">No. Registrasi</th>
                      <th class="py-3 px-4">Nama Peserta & Domisili</th>
                      <th class="py-3 px-4">Level & Jadwal Online</th>
                      <th class="py-3 px-4">Biaya</th>
                      <th class="py-3 pl-4">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-200">
                    \${list.map(r => \`
                      <tr>
                        <td class="py-3.5 pr-4 font-mono font-semibold text-emerald-900">\${r.registrationNumber}</td>
                        <td class="py-3.5 px-4"><strong>\${r.fullName}</strong><br><span class="text-slate-500">\${r.gender || 'Laki-laki'} · \${r.occupation} · \${r.city}</span></td>
                        <td class="py-3.5 px-4">\${r.selectedProgramName}<br><span class="font-mono text-slate-500">\${r.selectedScheduleSummary}</span></td>
                        <td class="py-3.5 px-4 font-mono font-semibold">\${formatIDR(r.totalTuitionIDR)}</td>
                        <td class="py-3.5 pl-4 text-emerald-800 font-medium">\${r.status}</td>
                      </tr>
                    \`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        \`;
        return;
      }
    }

    render();
    syncFromCpanelApi();
  </script>
</body>
</html>`;
}

export function generateStandaloneLoginHtml(): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Login Akun Pelajar & Superadmin (login.html) — Tadribul Lughah</title>
  <meta name="description" content="Halaman Login Terpisah (login.html): Pelajar terdaftar diarahkan ke pelajar.html, dan Superadmin diarahkan ke superadmin.html." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;600&family=Noto+Naskh+Arabic:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8FAFC; color: #0F172A; }
    .font-display { font-family: 'Fraunces', serif; }
    .font-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
    <div class="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
      <a href="./index.html" class="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0">
        Tadribul Lughah
      </a>
      <div class="hidden md:flex items-center gap-6 text-xs font-mono text-slate-500">
        <span>FILE LOGIN TERPISAH: login.html</span>
        <span>·</span>
        <span>PELAJAR (pelajar.html) & SUPERADMIN (superadmin.html)</span>
      </div>
      <a href="./index.html" class="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap">
        ← Kembali ke Beranda (index.html)
      </a>
    </div>
  </header>

  <main class="flex-1 flex items-center justify-center py-12 px-6">
    <div class="w-full max-w-lg bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div class="grid grid-cols-2 border-b border-slate-200 bg-slate-100 p-1.5 gap-1.5">
        <button id="tab-pelajar" onclick="switchRole('pelajar')" class="py-2.5 px-3 rounded-lg text-xs font-semibold bg-emerald-900 text-white">
          Login Pelajar Terdaftar (pelajar.html)
        </button>
        <button id="tab-superadmin" onclick="switchRole('superadmin')" class="py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-700">
          Login Superadmin (superadmin.html)
        </button>
      </div>

      <div class="bg-slate-900 text-white p-6 sm:p-8 border-b border-slate-800 space-y-2">
        <p id="role-badge" class="text-xs font-mono text-emerald-400">AKUN PELAJAR TERDAFTAR · MENUJU PELAJAR.HTML</p>
        <h1 id="role-title" class="text-2xl font-semibold tracking-tight text-white">Login Akun Pelajar Tadribul Lughah</h1>
        <p id="role-desc" class="text-xs text-slate-300 leading-relaxed">
          Halaman <span class="font-mono text-emerald-300">pelajar.html</span> hanya dapat diakses oleh pelajar yang sudah terdaftar dan memiliki akun. Jika Superadmin yang login, otomatis diarahkan ke <span class="font-mono text-emerald-300">superadmin.html</span>.
        </p>
      </div>

      <div class="p-6 sm:p-8 space-y-5">
        <div id="error-box" class="hidden p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 text-xs font-medium"></div>

        <!-- Form Login Pelajar -->
        <form id="form-pelajar" onsubmit="handleStudentLogin(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-800 mb-1">Email Pelajar Terdaftar / Nomor Registrasi *</label>
            <input id="studentId" type="text" required placeholder="Contoh: TL-2026-8419 atau email terdaftar" class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-800 mb-1">Kata Sandi Akun Pelajar *</label>
            <input id="studentPass" type="password" required placeholder="Kata sandi saat daftar (atau Nomor Registrasi)" class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800" />
          </div>
          <button type="submit" class="w-full py-3 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors">
            Masuk ke Portal Pelajar (pelajar.html) →
          </button>
        </form>

        <!-- Form Login Superadmin -->
        <form id="form-superadmin" onsubmit="handleSuperAdminLogin(event)" class="hidden space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-800 mb-1">Email Superadmin Terdaftar *</label>
            <input id="adminEmail" type="email" required placeholder="Masukkan email Superadmin" class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-800 mb-1">Kata Sandi / Kode Akses Superadmin *</label>
            <input id="adminPass" type="password" required placeholder="••••••••" class="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800" />
          </div>
          <button type="submit" class="w-full py-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors">
            Masuk & Buka superadmin.html →
          </button>
        </form>
      </div>
    </div>
  </main>

  <footer class="bg-slate-950 text-slate-400 py-8 border-t border-slate-800 text-xs">
    <div class="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p>File Login Terpisah (<span class="font-mono text-slate-200">login.html</span>) — Program Pembelajaran Bahasa Arab Tadribul Lughah</p>
      <a href="./index.html" class="text-emerald-400 hover:text-emerald-300 font-medium">← Kembali ke Halaman Utama (index.html)</a>
    </div>
  </footer>

  <script>
    const SUPERADMIN_SESSION_KEY = 'tl_superadmin_verified_session_v1';
    const STUDENT_SESSION_KEY = 'tl_student_verified_session_v1';
    const SUPERADMIN_EMAIL = 'mazharhajid@gmail.com';

    const DEFAULT_ACCOUNTS = [
      { registrationNumber: 'TL-2026-8419', fullName: 'Rizky Pratama Wijaya', email: 'rizky.wijaya@alumni.ui.ac.id', password: 'TL-2026-8419' },
      { registrationNumber: 'TL-2026-8452', fullName: 'Siti Aisyah Nurhaliza', email: 'aisyah.nurhaliza@gmail.com', password: 'TL-2026-8452' },
      { registrationNumber: 'TL-2026-8477', fullName: 'Muhammad Farhan Al-Farisi', email: 'farhan.alfarisi@ugm.ac.id', password: 'TL-2026-8477' }
    ];

    function switchRole(role) {
      document.getElementById('error-box').classList.add('hidden');
      if (role === 'superadmin') {
        document.getElementById('tab-superadmin').className = 'py-2.5 px-3 rounded-lg text-xs font-semibold bg-slate-900 text-white';
        document.getElementById('tab-pelajar').className = 'py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-700';
        document.getElementById('form-superadmin').classList.remove('hidden');
        document.getElementById('form-pelajar').classList.add('hidden');
        document.getElementById('role-badge').textContent = 'OTENTIKASI SUPERADMIN · MENUJU SUPERADMIN.HTML';
        document.getElementById('role-title').textContent = 'Login Superadmin Tadribul Lughah';
      } else {
        document.getElementById('tab-pelajar').className = 'py-2.5 px-3 rounded-lg text-xs font-semibold bg-emerald-900 text-white';
        document.getElementById('tab-superadmin').className = 'py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-700';
        document.getElementById('form-pelajar').classList.remove('hidden');
        document.getElementById('form-superadmin').classList.add('hidden');
        document.getElementById('role-badge').textContent = 'AKUN PELAJAR TERDAFTAR · MENUJU PELAJAR.HTML';
        document.getElementById('role-title').textContent = 'Login Akun Pelajar Tadribul Lughah';
      }
    }

    function handleStudentLogin(e) {
      e.preventDefault();
      const id = document.getElementById('studentId').value.trim().toLowerCase();
      const pass = document.getElementById('studentPass').value.trim();
      const errBox = document.getElementById('error-box');

      // Jika Superadmin login di form pelajar, langsung arahkan ke superadmin.html
      if (id === SUPERADMIN_EMAIL && pass.length >= 4) {
        sessionStorage.setItem(SUPERADMIN_SESSION_KEY, SUPERADMIN_EMAIL);
        window.location.replace('./superadmin.html');
        return;
      }

      const storedAccounts = JSON.parse(localStorage.getItem('tl_student_accounts_v1')) || [];
      const allAccounts = [...storedAccounts, ...DEFAULT_ACCOUNTS];
      const matched = allAccounts.find(a => a.registrationNumber.toLowerCase() === id || a.email.toLowerCase() === id);

      if (!matched) {
        errBox.textContent = 'Akun pelajar tidak ditemukan. Anda harus terdaftar sebagai peserta Tadribul Lughah dan memiliki akun untuk mengakses pelajar.html.';
        errBox.classList.remove('hidden');
        return;
      }

      if (matched.password !== pass && matched.registrationNumber.toLowerCase() !== pass.toLowerCase()) {
        errBox.textContent = 'Kata sandi akun pelajar tidak sesuai.';
        errBox.classList.remove('hidden');
        return;
      }

      sessionStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify({
        registrationNumber: matched.registrationNumber,
        email: matched.email,
        fullName: matched.fullName,
        loginAt: new Date().toISOString()
      }));
      window.location.replace('./pelajar.html');
    }

    function handleSuperAdminLogin(e) {
      e.preventDefault();
      const email = document.getElementById('adminEmail').value.trim().toLowerCase();
      const pass = document.getElementById('adminPass').value.trim();
      const errBox = document.getElementById('error-box');

      if (email !== SUPERADMIN_EMAIL) {
        errBox.textContent = 'Akses ditolak! Email "' + email + '" bukan Superadmin. Halaman superadmin.html hanya dapat diakses oleh Superadmin (' + SUPERADMIN_EMAIL + ').';
        errBox.classList.remove('hidden');
        return;
      }

      if (pass.length < 4) {
        errBox.textContent = 'Masukkan kata sandi / kode akses Superadmin minimal 4 karakter.';
        errBox.classList.remove('hidden');
        return;
      }

      sessionStorage.setItem(SUPERADMIN_SESSION_KEY, SUPERADMIN_EMAIL);
      window.location.replace('./superadmin.html');
    }
  </script>
</body>
</html>`;
}

export function generateStandaloneStudentPortalHtml(
  programs: ProgramTrack[],
  schedules: ClassSchedule[],
  registrations: RegistrationRecord[]
): string {
  const initialDataJson = JSON.stringify({
    programs,
    schedules,
    registrations
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Portal Pelajar Terdaftar (pelajar.html) — Tadribul Lughah</title>
  <meta name="description" content="Halaman terpisah khusus pelajar yang sudah terdaftar dan memiliki akun pada Program Pembelajaran Bahasa Arab Tadribul Lughah." />
  <script>
    // Proteksi Ketat: pelajar.html tidak bisa diakses kecuali oleh pelajar terdaftar yang sudah login akun
    if (!sessionStorage.getItem('tl_student_verified_session_v1')) {
      window.location.replace('./login.html?role=pelajar');
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;600&family=Noto+Naskh+Arabic:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8FAFC; color: #0F172A; }
    .font-display { font-family: 'Fraunces', serif; }
    .font-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
    .font-arabic { font-family: 'Noto Naskh Arabic', serif; line-height: 1.8; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
    <div class="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
      <a href="./pelajar.html" class="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0">
        Tadribul Lughah · Portal Pelajar (pelajar.html)
      </a>
      <div class="flex items-center gap-3">
        <a href="./index.html" class="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
          Beranda (index.html)
        </a>
        <button onclick="logoutStudent()" class="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg">
          Keluar Akun Pelajar
        </button>
      </div>
    </div>
  </header>

  <main id="pelajar-app" class="flex-1 py-10 max-w-[1200px] w-full mx-auto px-6 space-y-8"></main>

  <footer class="bg-slate-950 text-slate-400 py-8 border-t border-slate-800 text-xs">
    <div class="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p>File Terpisah Khusus Pelajar Terdaftar (<span class="font-mono text-slate-200">pelajar.html</span>) — Tadribul Lughah</p>
      <a href="./index.html" class="text-emerald-400 hover:text-emerald-300 font-medium">← Kembali ke Website Utama (index.html)</a>
    </div>
  </footer>

  <script>
    const INITIAL_DATA = ${initialDataJson};
    const sessionRaw = sessionStorage.getItem('tl_student_verified_session_v1');
    if (!sessionRaw) {
      window.location.replace('./login.html?role=pelajar');
    }
    const session = JSON.parse(sessionRaw || '{}');

    function formatIDR(amount) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
    }

    function logoutStudent() {
      sessionStorage.removeItem('tl_student_verified_session_v1');
      window.location.replace('./login.html?role=pelajar');
    }

    let activeProgramId = '';

    function switchActiveLevel(progId) {
      activeProgramId = progId;
      renderStudentPortal();
    }

    function enrollStudentAnotherLevel(progId) {
      const regs = JSON.parse(localStorage.getItem('tl_cpanel_registrations')) || INITIAL_DATA.registrations;
      const progs = JSON.parse(localStorage.getItem('tl_cpanel_programs')) || INITIAL_DATA.programs;
      const schs = JSON.parse(localStorage.getItem('tl_cpanel_schedules')) || INITIAL_DATA.schedules;
      const prog = progs.find(p => p.id === progId) || progs[0];
      const sch = schs.find(s => s.programId === prog.id) || schs[0];
      const regNo = 'TL-2026-' + Math.floor(1000 + Math.random() * 9000);
      const nowStr = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date()) + ' WIB';

      const newRec = {
        registrationNumber: regNo,
        fullName: session.fullName,
        gender: session.gender || 'Laki-laki',
        email: session.email,
        whatsapp: session.whatsapp || '0812-xxxx-xxxx',
        occupation: 'Pelajar Terdaftar',
        city: session.city || 'Indonesia',
        selectedProgramId: prog.id,
        selectedProgramName: prog.title,
        selectedScheduleId: sch.id,
        selectedScheduleSummary: sch.batchCode + ' · ' + sch.days + ' (' + sch.timeWIB + ') · Online',
        learningGoal: 'Menguasai materi ' + prog.title + ' dengan akun terdaftar.',
        totalTuitionIDR: prog.tuitionIDR,
        registeredAt: nowStr,
        status: 'Terverifikasi — Menunggu Orientasi'
      };

      regs.unshift(newRec);
      localStorage.setItem('tl_cpanel_registrations', JSON.stringify(regs));
      activeProgramId = prog.id;
      renderStudentPortal();
      alert('Alhamdulillah! Level ' + prog.levelNumber + ' (' + prog.title + ') berhasil didaftarkan di bawah akun Anda dengan Nomor Registrasi: ' + regNo);
    }

    function renderStudentPortal() {
      const regs = JSON.parse(localStorage.getItem('tl_cpanel_registrations')) || INITIAL_DATA.registrations;
      const progs = JSON.parse(localStorage.getItem('tl_cpanel_programs')) || INITIAL_DATA.programs;
      const schs = JSON.parse(localStorage.getItem('tl_cpanel_schedules')) || INITIAL_DATA.schedules;

      const userEmailLower = (session.email || '').toLowerCase();
      const myRegs = regs.filter(r => (r.email && r.email.toLowerCase() === userEmailLower) || (r.registrationNumber === session.registrationNumber));
      if (!activeProgramId && myRegs.length > 0) {
        activeProgramId = myRegs[0].selectedProgramId;
      }

      const myReg = myRegs.find(r => r.selectedProgramId === activeProgramId) || myRegs[0] || regs[0];
      const myProg = progs.find(p => p.id === myReg.selectedProgramId) || progs[0];
      const mySch = schs.find(s => s.id === myReg.selectedScheduleId) || schs.find(s => s.programId === myProg.id) || schs[0];
      const enrolledProgramIds = myRegs.map(r => r.selectedProgramId);

      document.getElementById('pelajar-app').innerHTML = \`
        <div class="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold text-slate-700 uppercase font-mono mr-1">Level Terdaftar Anda (\${myRegs.length}/4 Program):</span>
            \${myRegs.map(r => {
              const p = progs.find(x => x.id === r.selectedProgramId) || progs[0];
              const isSelected = r.selectedProgramId === myProg.id;
              return \`
                <button type="button" onclick="switchActiveLevel('\${r.selectedProgramId}')" class="px-3 py-1.5 text-xs font-semibold rounded-lg \${isSelected ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'}">
                  \${p.code} (\${r.registrationNumber})
                </button>
              \`;
            }).join('')}
          </div>
          <span class="text-xs text-slate-500 font-mono">1 Akun untuk 4 Program Level</span>
        </div>

        <div class="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 sm:p-8 space-y-3">
          <p class="text-xs font-mono text-emerald-400">AKUN PELAJAR TERVERIFIKASI · NO. REG: \${myReg.registrationNumber}</p>
          <h1 class="text-2xl sm:text-3xl font-bold font-display">Ahlan wa Sahlan, \${myReg.fullName}</h1>
          <p dir="rtl" class="font-arabic text-xl text-emerald-300">\${myProg.arabicTitle}</p>
          <p class="text-xs sm:text-sm text-slate-300">Level Terdaftar: <strong>\${myProg.title}</strong> · Jadwal Kelas Malam Online: <strong>\${mySch.days} (\${mySch.timeWIB})</strong></p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div class="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <h2 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Informasi Kelas Malam Online & Modul (\${mySch.batchCode})</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div class="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span class="text-slate-500 block">Hari & Jam Belajar Malam:</span>
                <strong class="font-mono text-sm text-slate-900">\${mySch.days} · \${mySch.timeWIB}</strong>
              </div>
              <div class="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span class="text-slate-500 block">Pengajar Pengampu:</span>
                <strong class="text-sm text-slate-900">\${mySch.instructor}</strong>
              </div>
              <div class="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span class="text-slate-500 block">Kitab Pegangan:</span>
                <strong class="text-sm text-slate-900">\${myProg.kitabReference}</strong>
              </div>
              <div class="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <span class="text-slate-500 block">Biaya Pendidikan:</span>
                <strong class="font-mono text-sm text-emerald-900">\${formatIDR(myProg.tuitionIDR)} / Level (Cicilan 6x \${formatIDR(Math.round(myProg.tuitionIDR / 6))}/bln)</strong>
              </div>
            </div>
          </div>

          <div class="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs">
            <h3 class="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">Kartu Tanda Pelajar Resmi</h3>
            <div class="space-y-2">
              <div class="flex justify-between"><span>No. Registrasi:</span><strong class="font-mono">\${myReg.registrationNumber}</strong></div>
              <div class="flex justify-between"><span>Nama Lengkap:</span><strong>\${myReg.fullName}</strong></div>
              <div class="flex justify-between"><span>Jenis Kelamin:</span><strong>\${myReg.gender || 'Laki-laki'}</strong></div>
              <div class="flex justify-between"><span>Angkatan:</span><strong class="font-mono text-emerald-900">\${myProg.angkatan || 'Angkatan 1'}</strong></div>
              <div class="flex justify-between"><span>Email Akun:</span><strong class="font-mono">\${session.email}</strong></div>
              <div class="flex justify-between"><span>Status:</span><strong class="text-emerald-800">\${myReg.status}</strong></div>
            </div>
            <button onclick="window.print()" class="w-full py-2.5 text-xs font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800">
              Cetak Kartu Pelajar
            </button>
          </div>
        </div>

        <!-- Silabus & Modul Belajar Pembelajaran -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <p class="text-xs font-mono uppercase text-emerald-800 font-semibold">SILABUS & MODUL BELAJAR LEVEL</p>
              <h3 class="text-lg font-bold text-slate-900 mt-0.5">Modul Pembelajaran: \${myProg.title}</h3>
              <p class="text-xs text-slate-600 mt-1">Klik pada setiap modul di bawah untuk membuka rangkuman materi, kaidah nahwu/shorof, dan contoh latihan.</p>
            </div>
            <span class="text-xs font-mono text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0">
              Total \${(myProg.modules || []).length} Modul Pekanan
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            \${(myProg.modules || []).map((m, idx) => \`
              <div onclick="window.location.href='./materi.html?program=' + encodeURIComponent(myProg.id) + '&pekan=' + \${idx * 3 + 1}" class="p-5 rounded-xl border border-slate-200 bg-[#FBF9F5] hover:border-emerald-700 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-3 group">
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-xs font-mono font-semibold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded">\${m.weekRange}</span>
                    <span dir="rtl" class="font-arabic text-base font-semibold text-slate-800">\${m.arabicTerm}</span>
                  </div>
                  <h4 class="text-sm font-bold text-slate-900 mt-2 group-hover:text-emerald-900 flex items-center justify-between">
                    <span>\${m.topic}</span>
                    <span class="text-emerald-800 text-xs font-mono font-semibold">Buka materi.html ↗</span>
                  </h4>
                  <p class="text-xs text-slate-600 mt-1">Target: \${m.outcome}</p>
                </div>
                <div class="pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                  <span class="text-emerald-800 font-semibold font-mono">Kitab: \${myProg.kitabReference}</span>
                  <button type="button" onclick="event.stopPropagation(); window.location.href='./materi.html?program=' + encodeURIComponent(myProg.id) + '&pekan=' + \${idx * 3 + 1}" class="px-3 py-1.5 font-semibold text-white bg-emerald-900 rounded hover:bg-emerald-800">
                    \${idx === 0 ? 'Buka Materi Muqaddimah (Pekan 1) →' : 'Buka Materi Pekan ' + (idx * 3 + 1) + ' →'}
                  </button>
                </div>
              </div>
            \`).join('')}
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div class="space-y-1">
            <p class="text-xs font-mono uppercase text-emerald-800 font-semibold">1 AKUN DAPAT DAFTAR HINGGA 4 PROGRAM</p>
            <h3 class="text-base font-bold text-slate-900">Daftar / Tambah Program Level Lainnya (Level 1–4)</h3>
            <p class="text-xs text-slate-600">Biaya per level Rp 510.000 (Cicilan 6x Rp 85.000/bln). Klik tombol untuk mengambil level berikutnya tanpa membuat akun lagi:</p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            \${progs.slice(0, 4).map(p => {
              const isEnrolled = enrolledProgramIds.includes(p.id);
              const isCurrent = p.id === myProg.id;
              const isClosed = p.registrationOpen === false;
              return \`
                <div class="p-4 rounded-xl border \${isCurrent ? 'bg-emerald-50 border-emerald-800' : isEnrolled ? 'bg-emerald-50/40 border-emerald-300' : 'bg-slate-50 border-slate-200'} flex flex-col justify-between gap-3 text-xs">
                  <div>
                    <div class="flex justify-between font-mono font-bold text-emerald-800 text-[11px]">
                      <span>\${p.code}</span>
                      \${isEnrolled ? '<span class="text-emerald-900">✓ Terdaftar</span>' : ''}
                    </div>
                    <h4 class="font-bold text-slate-900 mt-1">\${p.title}</h4>
                    <p class="text-slate-500 font-mono mt-0.5">\${p.scheduleDays} (\${p.scheduleTime})</p>
                    <p class="font-mono font-bold text-emerald-900 mt-1">\${formatIDR(p.tuitionIDR)}</p>
                  </div>
                  <div>
                    \${isCurrent ? \`
                      <button disabled class="w-full py-1.5 font-semibold bg-emerald-900 text-white rounded">Level Aktif</button>
                    \` : isEnrolled ? \`
                      <button onclick="switchActiveLevel('\${p.id}')" class="w-full py-1.5 font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded hover:bg-emerald-200">Buka Kelas Ini</button>
                    \` : isClosed ? \`
                      <button disabled class="w-full py-1.5 font-semibold bg-rose-100 text-rose-900 border border-rose-300 rounded cursor-not-allowed">Ditutup (OFF)</button>
                    \` : \`
                      <button onclick="enrollStudentAnotherLevel('\${p.id}')" class="w-full py-1.5 font-semibold bg-slate-900 text-white rounded hover:bg-emerald-900">+ Daftar Level \${p.levelNumber}</button>
                    \`}
                  </div>
                </div>
              \`;
            }).join('')}
          </div>
        </div>

        <!-- Modal Buka Modul / Materi Belajar -->
        <div id="module-modal-container" class="hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div class="bg-white border border-slate-300 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div class="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span id="modal-week-badge" class="text-xs font-mono font-semibold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded">Pekan</span>
                <h3 id="modal-module-title" class="text-lg sm:text-xl font-bold text-slate-900 mt-2">Materi Modul</h3>
                <p id="modal-arabic-term" dir="rtl" class="font-arabic text-xl text-emerald-800 mt-1"></p>
              </div>
              <button onclick="closeModuleDetailModal()" class="text-slate-400 hover:text-slate-700 text-2xl font-bold px-2 py-1 leading-none">&times;</button>
            </div>

            <div class="space-y-4 text-xs text-slate-700">
              <div class="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span class="font-bold text-emerald-950 block">Target Capaian Pembelajaran:</span>
                <p id="modal-outcome" class="text-emerald-900 leading-relaxed"></p>
              </div>

              <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span class="font-bold text-slate-900 block">Jadwal Kelas Malam & Fasilitas:</span>
                <p class="leading-relaxed">Sesi Live Zoom diadakan pukul <strong>\${mySch.timeWIB}</strong> (\${mySch.days}) bersama Pengajar <strong>\${mySch.instructor}</strong>. Seluruh sesi menyertakan Kitab Referensi (\${myProg.kitabReference}) dan rekaman video.</p>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
              <button onclick="downloadActiveModuleNotes()" class="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800">
                Unduh Ringkasan Materi (.TXT)
              </button>
              <button onclick="closeModuleDetailModal()" class="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">
                Tutup Modul
              </button>
            </div>
          </div>
        </div>
      \`;
    }

    let activeModalModIdx = null;

    function openModuleDetailModal(idx) {
      activeModalModIdx = idx;
      const progs = JSON.parse(localStorage.getItem('tl_cpanel_programs')) || INITIAL_DATA.programs;
      const myProg = progs.find(p => p.id === (activeProgramId || progs[0].id)) || progs[0];
      const mod = (myProg.modules || [])[idx];
      if (!mod) return;

      document.getElementById('modal-week-badge').textContent = mod.weekRange;
      document.getElementById('modal-module-title').textContent = mod.topic;
      document.getElementById('modal-arabic-term').textContent = mod.arabicTerm;
      document.getElementById('modal-outcome').textContent = mod.outcome;

      const modalEl = document.getElementById('module-modal-container');
      if (modalEl) modalEl.classList.remove('hidden');
    }

    function closeModuleDetailModal() {
      const modalEl = document.getElementById('module-modal-container');
      if (modalEl) modalEl.classList.add('hidden');
    }

    function downloadActiveModuleNotes() {
      const progs = JSON.parse(localStorage.getItem('tl_cpanel_programs')) || INITIAL_DATA.programs;
      const myProg = progs.find(p => p.id === (activeProgramId || progs[0].id)) || progs[0];
      const mod = (myProg.modules || [])[activeModalModIdx || 0];
      if (!mod) return;

      const content = [
        'MODUL MATERI TADRIBUL LUGHAH',
        'Level: ' + myProg.title,
        'Pekan: ' + mod.weekRange,
        'Topik: ' + mod.topic + ' (' + mod.arabicTerm + ')',
        'Target Capaian: ' + mod.outcome,
        'Kitab Rujukan: ' + myProg.kitabReference,
        'Waktu Kelas: Malam 20.00 – 22.00 WIB'
      ].join('\\n');

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Modul_' + mod.weekRange.replace(/\\s+/g, '_') + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    renderStudentPortal();
  </script>
</body>
</html>`;
}

export function generateStandaloneMateriHtml(
  programs: ProgramTrack[],
  schedules: ClassSchedule[],
  registrations: RegistrationRecord[]
): string {
  const initialDataJson = JSON.stringify({
    programs,
    schedules,
    registrations
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Materi & Modul Pembelajaran (materi.html) — Tadribul Lughah</title>
  <meta name="description" content="Halaman file terpisah khusus materi dan modul pembelajaran bahasa Arab Tadribul Lughah." />
  <script>
    if (!sessionStorage.getItem('tl_student_verified_session_v1')) {
      window.location.replace('./login.html?role=pelajar');
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;600&family=Noto+Naskh+Arabic:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8FAFC; color: #0F172A; }
    .font-display { font-family: 'Fraunces', serif; }
    .font-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
    .font-arabic { font-family: 'Noto Naskh Arabic', serif; line-height: 1.8; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
    <div class="max-w-[1240px] mx-auto px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <a href="./pelajar.html" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-100/80 hover:bg-emerald-200 rounded-lg transition-colors shrink-0">
          ← Kembali ke Portal Pelajar (pelajar.html)
        </a>
        <span class="hidden md:inline text-slate-300">|</span>
        <span class="hidden md:inline text-xs font-mono text-slate-600">File Terpisah: <strong class="text-slate-900">materi.html</strong></span>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="downloadModuleTxt()" class="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg">
          Unduh Rangkuman (.TXT)
        </button>
        <button onclick="window.print()" class="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
          Cetak Materi
        </button>
      </div>
    </div>
  </header>

  <main id="materi-app" class="flex-1 max-w-[1240px] w-full mx-auto px-6 py-8 space-y-8"></main>

  <footer class="bg-slate-950 text-slate-400 py-8 border-t border-slate-800 text-xs mt-12">
    <div class="max-w-[1240px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p>File Terpisah Khusus Materi Pembelajaran (<span class="font-mono text-slate-200">materi.html</span>) — Tadribul Lughah</p>
      <div class="flex items-center gap-4">
        <a href="./pelajar.html" class="text-emerald-400 hover:text-emerald-300 font-medium">Portal Pelajar (pelajar.html)</a>
        <span>·</span>
        <a href="./index.html" class="text-slate-400 hover:text-white">Website Utama (index.html)</a>
      </div>
    </div>
  </footer>

  <script>
    const INITIAL_DATA = ${initialDataJson};
    const params = new URLSearchParams(window.location.search);
    let currentProgId = params.get('program') || 'tl-level-1';
    let currentPekan = parseInt(params.get('pekan') || '', 10);
    if (isNaN(currentPekan) || currentPekan < 1 || currentPekan > 12) {
      const mod = parseInt(params.get('module') || '0', 10);
      currentPekan = isNaN(mod) ? 1 : (mod * 3) + 1;
    }

    let activeTab = 'silabus';

    function setTab(tab) {
      activeTab = tab;
      renderMateri();
    }

    function switchPekan(progId, pekanNum) {
      currentProgId = progId;
      currentPekan = pekanNum;
      activeTab = 'silabus';
      const newUrl = window.location.pathname + '?program=' + encodeURIComponent(progId) + '&pekan=' + pekanNum;
      window.history.pushState({}, '', newUrl);
      renderMateri();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const PEKAN_DATA_LV1 = {
      1: {
        title: 'Pekan 1: Muqaddimah & Pengenalan Program Tadribat',
        arabic: 'مُقَدِّمَةُ بَرْنَامَجِ التَّدْرِيبَات وَحَقِيقَةُ اللُّغَةِ العَرَبِيَّةِ',
        youtubeId: 'fC9zKq38_54',
        summary: 'Materi khusus Muqaddimah Pengenalan Program Tadribat membahas secara mendalam hakikat bahasa Arab, mengapa ilmu Nahwu wajib dipelajari sebelum membaca kitab gundul, serta batas keabsahan kalimat sempurna (Kalam Mufid) menurut kaidah ulama Nahwu.',
        points: [
          'Pengenalan Silabus Program Tadribul Lughah: Nahwu Level 1–3 & Shorof Level 4',
          'Keutamaan mempelajari bahasa Arab untuk menjaga lisan dari kesalahan (Al-Lahnu)',
          '4 Rukun Kalam: Al-Lafzhu (suara berhuruf), Al-Murakkabu (tersusun minimal 2 kata), Al-Mufidu (memberi pemahaman sempurna), dan Bil Wadh\'i (mengikuti pola bahasa Arab)',
          'Perbedaan antara Kalimah (kata tunggal) dan Kalam (kalimat sempurna)'
        ],
        rules: [
          'Definisi Kalam: هُوَ اللَّفْظُ الْمُرَكَّبُ الْمُفِيدُ بِالْوَضْعِ (Kalam adalah ucapan yang tersusun, memberi faedah sempurna kepada pendengar, dan berbahasa Arab).',
          'Rukun Kalam ada 4: Lafadz, Murakkab, Mufid, dan Bil Wadh\'i.',
          'Jika suatu ungkapan belum mufid (seperti "Jika Zaid berdiri..."), maka belum sah dinamakan Kalam menurut ilmu Nahwu.'
        ],
        examples: [
          { ar: 'قَامَ زَيْدٌ', tr: 'Zaid telah berdiri (Kalam Mufid tuntas maknanya).' },
          { ar: 'العِلْمُ نُورٌ', tr: 'Ilmu adalah cahaya (Kalam Mufid tersusun dari Mubtada dan Khobar).' }
        ]
      },
      2: {
        title: 'Pekan 2: Pembagian Kata (Isim, Fi\'il, dan Huruf)',
        arabic: 'أَقْسَامُ الكَلَامِ: الاِسْمُ وَالفِعْلُ وَالحَرْفُ',
        youtubeId: '7X1gX0C8VjA',
        summary: 'Materi pekan ke-2 membedah tiga unsur pembentuk bahasa Arab: Isim (kata benda/sifat tanpa waktu), Fi\'il (kata kerja terikat waktu), dan Huruf (kata tugas).',
        points: [
          'Isim (اسم): Makna mandiri tanpa dimensi waktu',
          'Fi\'il (فعل): Perbuatan terikat dimensi waktu (Madhi, Mudhari\', Amr)',
          'Huruf (حرف): Kata penghubung yang maknanya baru jelas saat disandingkan dengan kata lain'
        ],
        rules: [
          'Pembagian Kata ada tiga: اسْمٌ، وَفِعْلٌ، وَحَرْفٌ جَاءَ لِمَعْنًى.',
          'Isim tidak terikat waktu; Fi\'il terikat waktu lampau, sekarang, atau perintah.'
        ],
        examples: [
          { ar: 'ذَهَبَ عَلِيٌّ إِلَى الْمَسْجِدِ', tr: 'Ali telah pergi ke masjid (ذَهَبَ=Fi\'il, عَلِيٌّ=Isim, إِلَى=Huruf, الْمَسْجِدِ=Isim).' }
        ]
      },
      3: {
        title: 'Pekan 3: Karakteristik & Tanda-Tanda Isim',
        arabic: 'عَلَامَاتُ الاِسْمِ: الخَفْضُ، التَّنْوِينُ، الأَلِفُ وَاللَّامُ، وَحُرُوفُ الجَرِّ',
        youtubeId: '9k1GgM2Y8oE',
        summary: 'Materi pekan ke-3 mengkaji 4 tanda pengenal kata Isim yang membedakannya secara mutlak dari kata kerja dan huruf.',
        points: [
          'Tanda 1: Al-Khafdh / Harakat Kasrah',
          'Tanda 2: At-Tanwin',
          'Tanda 3: Diawali Alif Lam (ال)',
          'Tanda 4: Didahului oleh Huruf Jar (مِنْ, إِلَى, عَنْ, عَلَى, فِي, dll)'
        ],
        rules: [
          'Tanda Isim: فَالاسْمُ يُعْرَفُ بِالْخَفْضِ، وَالتَّنْوِينِ، وَدُخُولِ الأَلِفِ وَاللاَّمِ، وَحُرُوفِ الْخَفْضِ.',
          'Alif Lam dan Tanwin tidak boleh bertemu pada satu kata secara bersamaan.'
        ],
        examples: [
          { ar: 'مَرَرْتُ بِرَجُلٍ صَالِحٍ', tr: 'Saya berpapasan dengan lelaki shalih (ber-tanwin dan didahului huruf jar).' }
        ]
      }
    };

    function renderMateri() {
      const progs = JSON.parse(localStorage.getItem('tl_cpanel_programs')) || INITIAL_DATA.programs;
      const schs = JSON.parse(localStorage.getItem('tl_cpanel_schedules')) || INITIAL_DATA.schedules;
      const prog = progs.find(p => p.id === currentProgId) || progs[0];
      const sch = schs.find(s => s.programId === prog.id) || schs[0];

      const sessionRaw = sessionStorage.getItem('tl_student_verified_session_v1');
      const session = JSON.parse(sessionRaw || '{}');
      const regs = JSON.parse(localStorage.getItem('tl_cpanel_registrations')) || INITIAL_DATA.registrations;
      const myRegs = regs.filter(r => (r.email || '').toLowerCase() === (session.email || '').toLowerCase() || r.registrationNumber === session.registrationNumber);
      const myEnrolledIds = myRegs.map(r => r.selectedProgramId);
      const finalEnrolled = myEnrolledIds.length > 0 ? myEnrolledIds : [progs[0].id];

      const customOverrides = JSON.parse(localStorage.getItem('tadribul_lughah_custom_materi_v1') || '{}');
      const overrideKey = currentProgId + '-pekan-' + currentPekan;
      const customData = customOverrides[overrideKey];
      const pData = customData ? {
        title: customData.title,
        arabic: customData.arabicTitle || customData.arabic,
        youtubeId: customData.youtubeVideoId || customData.youtubeId || 'fC9zKq38_54',
        summary: customData.summary,
        points: customData.points || [],
        rules: customData.rules || [],
        examples: customData.examples || []
      } : (PEKAN_DATA_LV1[currentPekan] || {
        title: 'Pekan ' + currentPekan + ': Pembahasan Materi Terfokus',
        arabic: 'دِرَاسَةُ الأُسْبُوعِ ' + currentPekan + ' · بَرْنَامَجُ تَدْرِيبِ اللُّغَةِ',
        youtubeId: 'fC9zKq38_54',
        summary: 'Materi khusus Pekan ke-' + currentPekan + ' berfokus pada pendalaman kaidah tata bahasa Arab secara terarah.',
        points: ['Fokus materi khusus pekan ke-' + currentPekan, 'Penerapan pada teks kitab rujukan'],
        rules: ['Kaidah Pekan ' + currentPekan + ': Menjaga keutuhan tarkib kalimat dan ketepatan i\'rab.'],
        examples: [{ ar: 'تَعَلَّمْ فَإِنَّ العِلْمَ زَيْنٌ لِأَهْلِهِ', tr: 'Belajarlah, sungguh ilmu adalah perhiasan bagi pemiliknya.' }]
      });

      const container = document.getElementById('materi-app');
      container.innerHTML = \`
        <!-- Program & Pekan Switcher -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs font-mono uppercase text-slate-500 font-semibold mr-1">Level:</span>
              \${progs.map(p => {
                const isEnrolled = finalEnrolled.includes(p.id);
                const isSelected = p.id === prog.id;
                if (!isEnrolled) {
                  return \`
                    <button disabled title="Level belum Anda ikuti" class="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-40 inline-flex items-center gap-1 select-none">
                      <span>\${p.code}</span>
                      <span class="text-[10px]">🔒</span>
                    </button>
                  \`;
                }
                return \`
                  <button onclick="switchPekan('\${p.id}', 1)" class="px-2.5 py-1 text-xs font-semibold rounded cursor-pointer \${isSelected ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                    \${p.code} (\${p.levelNumber === 4 ? 'Shorof' : 'Nahwu'})
                  </button>
                \`;
              }).join('')}
              <span class="text-[10px] font-mono text-slate-400 hidden sm:inline ml-1">(Level belum diikuti terkunci 🔒)</span>
            </div>
            <span class="text-xs font-mono text-emerald-900 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              Menampilkan Khusus: Pekan ke-\${currentPekan}
            </span>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span class="text-[11px] font-mono uppercase text-slate-500 font-semibold shrink-0">Daftar Pekan:</span>
            \${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => \`
              <button onclick="switchPekan('\${prog.id}', \${num})" class="shrink-0 px-2.5 py-1 rounded border font-semibold \${num === currentPekan ? 'bg-emerald-900 text-white border-emerald-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}">
                Pekan \${num} \${num === 1 ? '(Muqaddimah)' : ''}
              </button>
            \`).join('')}
          </div>
        </div>

        <!-- Hero Banner Khusus Pekan -->
        <div class="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-4">
          <div class="flex flex-wrap items-center gap-2.5 text-xs font-mono text-emerald-400">
            <span class="bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded text-emerald-300">KHUSUS PEKAN \${currentPekan} · materi.html</span>
            <span>·</span>
            <span>\${prog.code} (\${prog.categoryLabel})</span>
            <span>·</span>
            <span>\${prog.angkatan || 'Angkatan 1'}</span>
          </div>
          <p dir="rtl" class="font-arabic text-2xl sm:text-3xl text-emerald-300 font-semibold">\${pData.arabic}</p>
          <h1 class="text-2xl sm:text-3xl font-bold font-display text-white">\${pData.title}</h1>
          <p class="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            \${pData.summary}
          </p>
          <div class="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
            <div>Jadwal Live Zoom: <strong class="text-white">\${sch.timeWIB} (\${sch.days})</strong></div>
            <div>Pengampu: <strong class="text-white">\${sch.instructor}</strong> · Kitab: <strong class="text-emerald-300">\${prog.kitabReference}</strong></div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="bg-white border border-slate-200 rounded-xl p-2.5 flex flex-wrap gap-2">
          <button onclick="setTab('video')" class="flex-1 min-w-[180px] py-2 px-3 text-xs font-bold rounded-lg cursor-pointer \${activeTab === 'video' ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'}">
            ▶ Simak Video (YouTube)
          </button>
          <button onclick="setTab('silabus')" class="flex-1 min-w-[140px] py-2 px-3 text-xs font-semibold rounded-lg cursor-pointer \${activeTab === 'silabus' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-100'}">
            Uraian Materi Pekan \${currentPekan}
          </button>
          <button onclick="setTab('kaidah')" class="flex-1 min-w-[140px] py-2 px-3 text-xs font-semibold rounded-lg cursor-pointer \${activeTab === 'kaidah' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-100'}">
            Kaidah Khusus Pekan \${currentPekan}
          </button>
          <button onclick="setTab('contoh')" class="flex-1 min-w-[140px] py-2 px-3 text-xs font-semibold rounded-lg cursor-pointer \${activeTab === 'contoh' ? 'bg-emerald-900 text-white' : 'text-slate-600 hover:bg-slate-100'}">
            Contoh & Amtsilah Pekan \${currentPekan}
          </button>
          <a href="https://www.youtube.com/watch?v=\${pData.youtubeId || 'fC9zKq38_54'}" target="_blank" rel="noopener noreferrer" class="px-3 py-2 text-xs font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg inline-flex items-center gap-1 shrink-0">
            Buka di YouTube ↗
          </a>
          <a href="./superadmin.html?tab=materi&program=\${currentProgId}&pekan=\${currentPekan}" class="px-3 py-2 text-xs font-semibold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg inline-flex items-center gap-1 shrink-0">
            Edit di Superadmin ⚙
          </a>
        </div>

        <!-- Content Area: ONLY Pekan-specific -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          \${activeTab === 'video' ? \`
            <div class="space-y-4">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <span class="text-xs font-mono font-bold text-rose-600 uppercase">Video Pembelajaran YouTube · Pekan \${currentPekan}</span>
                  <h3 class="text-xl font-bold text-slate-900 mt-0.5">\${pData.title}</h3>
                </div>
                <a href="https://www.youtube.com/watch?v=\${pData.youtubeId || 'fC9zKq38_54'}" target="_blank" rel="noopener noreferrer" class="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg inline-flex items-center gap-1.5 self-start sm:self-auto">
                  <span>Tonton di YouTube ↗</span>
                </a>
              </div>
              <div class="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-md border border-slate-800">
                <iframe class="w-full h-full" src="https://www.youtube-nocookie.com/embed/\${pData.youtubeId || 'fC9zKq38_54'}?rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
              </div>
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>Santri disarankan mencatat kaidah dan melatih harakat saat menyimak rekaman video ustadz.</span>
                <button onclick="setTab('kaidah')" class="px-3 py-1.5 font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg shrink-0">Pelajari Kaidah Pekan Ini →</button>
              </div>
            </div>
          \` : activeTab === 'silabus' ? \`
            <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Pokok Bahasan Khusus Pekan \${currentPekan}</h3>
            <div class="p-5 rounded-xl border border-slate-200 bg-[#FBF9F5] space-y-3">
              <h4 class="text-base font-bold text-slate-900">\${pData.title}</h4>
              <p class="text-xs sm:text-sm text-slate-700 leading-relaxed">\${pData.summary}</p>
              <div class="pt-3 border-t border-slate-200">
                <p class="text-xs font-semibold text-emerald-900 font-mono uppercase mb-2">Poin Materi Khusus Pekan \${currentPekan}:</p>
                <ul class="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                  \${pData.points.map(pt => '<li>' + pt + '</li>').join('')}
                </ul>
              </div>
            </div>
          \` : activeTab === 'kaidah' ? \`
            <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Kaidah Khusus Pekan \${currentPekan}</h3>
            <div class="space-y-3">
              \${pData.rules.map((r, i) => \`
                <div class="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-xs sm:text-sm text-slate-800 space-y-1">
                  <span class="font-bold text-emerald-950 block">Kaidah Pekan \${currentPekan} #\${i + 1}:</span>
                  <p class="leading-relaxed">\${r}</p>
                </div>
              \`).join('')}
            </div>
          \` : \`
            <h3 class="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3">Contoh & Penerapan Pekan \${currentPekan}</h3>
            <div class="space-y-3 text-xs sm:text-sm">
              \${pData.examples.map((ex, i) => \`
                <div class="p-5 rounded-xl border border-slate-200 bg-[#FBF9F5] space-y-2">
                  <p dir="rtl" class="font-arabic text-2xl text-slate-950 font-bold">\${ex.ar}</p>
                  <p class="text-slate-700"><strong>Terjemahan:</strong> \${ex.tr}</p>
                </div>
              \`).join('')}
            </div>
          \`}
        </div>

        <!-- Navigation Footer -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            \${currentPekan > 1 ? \`
              <button onclick="switchPekan('\${prog.id}', \${currentPekan - 1})" class="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg">
                ← Pekan Sebelumnya (Pekan \${currentPekan - 1})
              </button>
            \` : '<span class="text-xs text-slate-400 font-mono">Pekan Pertama (Muqaddimah)</span>'}
          </div>

          <a href="./pelajar.html" class="px-5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg">
            ← Kembali ke Portal Pelajar (pelajar.html)
          </a>

          <div>
            \${currentPekan < 12 ? \`
              <button onclick="switchPekan('\${prog.id}', \${currentPekan + 1})" class="px-4 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg">
                Pekan Selanjutnya (Pekan \${currentPekan + 1}) →
              </button>
            \` : '<span class="text-xs text-slate-400 font-mono">Pekan Terakhir</span>'}
          </div>
        </div>
      \`;
    }

    function downloadModuleTxt() {
      const progs = JSON.parse(localStorage.getItem('tl_cpanel_programs')) || INITIAL_DATA.programs;
      const prog = progs.find(p => p.id === currentProgId) || progs[0];
      const modules = prog.modules || [];
      const mod = modules[currentModIdx] || modules[0];

      const content = [
        '=========================================================================',
        'TADRIBUL LUGHAH — FILE MATERI PEMBELAJARAN (materi.html)',
        'Level: ' + prog.title + ' (' + prog.arabicTitle + ')',
        'Pekan: ' + (mod ? mod.weekRange : 'Pekan'),
        'Topik: ' + (mod ? mod.topic : ''),
        'Istilah Arab: ' + (mod ? mod.arabicTerm : ''),
        'Target Capaian: ' + (mod ? mod.outcome : ''),
        'Kitab Rujukan: ' + prog.kitabReference,
        'Waktu Belajar: Malam 20.00 – 22.00 WIB',
        '========================================================================='
      ].join('\\n');

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Materi_' + prog.code + '_' + (mod ? mod.weekRange.replace(/\\s+/g, '_') : 'Modul') + '.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    renderMateri();
  </script>
</body>
</html>`;
}

export function generateStandaloneSuperAdminHtml(
  programs: ProgramTrack[],
  schedules: ClassSchedule[],
  registrations: RegistrationRecord[]
): string {
  const initialDataJson = JSON.stringify({
    programs,
    schedules,
    registrations
  });

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Superadmin Tadribul Lughah (superadmin.html) — Pengelolaan Kurikulum, Jadwal Malam, & Pendaftar</title>
  <meta name="description" content="File Khusus Superadmin Tadribul Lughah (superadmin.html) untuk mengedit Level 1–4, Jadwal Kelas Malam 20.00–22.00 WIB, dan Data Pendaftar di Database MySQL cPanel." />
  <script>
    // Proteksi Ketat: Halaman superadmin.html tidak bisa diakses kecuali oleh Superadmin yang sudah login di login.html
    if (sessionStorage.getItem('tl_superadmin_verified_session_v1') !== 'mazharhajid@gmail.com') {
      window.location.replace('./login.html');
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;600&family=Noto+Naskh+Arabic:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8FAFC; color: #0F172A; }
    .font-display { font-family: 'Fraunces', serif; }
    .font-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
    .font-arabic { font-family: 'Noto Naskh Arabic', serif; line-height: 1.8; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <!-- Dedicated Header for superadmin.html -->
  <header class="sticky top-0 z-30 bg-slate-950 text-white border-b border-slate-800">
    <div class="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-8">
      <div class="flex items-center gap-2.5">
        <span class="text-base font-bold tracking-tight font-display whitespace-nowrap">
          Tadribul Lughah · File superadmin.html
        </span>
      </div>
      <div class="hidden md:flex items-center gap-6 text-xs font-mono text-slate-400">
        <span>TERVERIFIKASI: mazharhajid@gmail.com</span>
        <span>·</span>
        <span>DATABASE MYSQL CPANEL (api.php)</span>
      </div>
      <a href="./index.html" class="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap">
        ← Buka Website Utama (index.html)
      </a>
    </div>
  </header>

  <main id="superadmin-app" class="flex-1 py-10 sm:py-14 max-w-[1200px] w-full mx-auto px-6 space-y-8"></main>

  <footer class="bg-slate-950 text-slate-400 py-8 border-t border-slate-800 text-xs">
    <div class="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p>File Khusus Superadmin (<span class="font-mono text-slate-200">superadmin.html</span>) — Program Pembelajaran Bahasa Arab Tadribul Lughah</p>
      <a href="./index.html" class="text-emerald-400 hover:text-emerald-300 font-medium">Kembali ke Halaman Peserta (index.html) →</a>
    </div>
  </footer>

  <script>
    const INITIAL_DATA = ${initialDataJson};
    let state = {
      isAuthenticated: sessionStorage.getItem('tl_superadmin_verified_session_v1') === 'mazharhajid@gmail.com',
      activeTab: 'programs',
      programs: JSON.parse(localStorage.getItem('tl_cpanel_programs')) || INITIAL_DATA.programs,
      schedules: JSON.parse(localStorage.getItem('tl_cpanel_schedules')) || INITIAL_DATA.schedules,
      registrations: JSON.parse(localStorage.getItem('tl_cpanel_registrations')) || INITIAL_DATA.registrations,
      selectedProgramId: 'tl-level-1',
      selectedScheduleId: 'sch-lv1-malam',
      selectedRegNo: INITIAL_DATA.registrations[0]?.registrationNumber || '',
      searchQuery: '',
      filterLevel: 'all',
      filterGender: 'all',
      filterStatus: 'all',
      isDetailModalOpen: false,
      toastMessage: null
    };

    function formatIDR(amount) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
    }

    function persistLocal() {
      localStorage.setItem('tl_cpanel_programs', JSON.stringify(state.programs));
      localStorage.setItem('tl_cpanel_schedules', JSON.stringify(state.schedules));
      localStorage.setItem('tl_cpanel_registrations', JSON.stringify(state.registrations));
    }

    function showToast(msg) {
      state.toastMessage = msg;
      render();
      setTimeout(() => {
        if (state.toastMessage === msg) {
          state.toastMessage = null;
          render();
        }
      }, 4000);
    }

    function quickToggleStatus(regNo) {
      if (!state.isAuthenticated) {
        showToast('Akses ditolak: Hanya Superadmin (mazharhajid@gmail.com) yang berhak mengubah status pendaftaran.');
        return;
      }
      const idx = state.registrations.findIndex(r => r.registrationNumber === regNo);
      if (idx === -1) return;
      const isVerified = (state.registrations[idx].status || '').indexOf('Terverifikasi') !== -1;
      const nextStatus = isVerified ? 'Menunggu Konfirmasi Pembayaran' : 'Terverifikasi — Menunggu Orientasi';
      state.registrations[idx].status = nextStatus;
      persistLocal();
      fetch('./api.php?entity=registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.registrations[idx])
      }).catch(() => {});
      showToast('Status ' + state.registrations[idx].fullName + ' berhasil diubah oleh Superadmin menjadi ' + nextStatus);
    }

    function deleteRegistration(regNo) {
      if (!confirm('Hapus data peserta ' + regNo + '?')) return;
      state.registrations = state.registrations.filter(r => r.registrationNumber !== regNo);
      persistLocal();
      fetch('./api.php?entity=registration&action=delete&id=' + encodeURIComponent(regNo), {
        method: 'POST'
      }).catch(() => {});
      showToast('Data peserta ' + regNo + ' berhasil dihapus.');
    }

    function exportCsv() {
      const headers = ['No Registrasi', 'Nama Lengkap', 'Jenis Kelamin', 'Status', 'Program Level', 'No WhatsApp', 'Email', 'Kota', 'Total Biaya'];
      const rows = state.registrations.map(r => [
        '"' + r.registrationNumber + '"',
        '"' + (r.fullName || '').replace(/"/g, '""') + '"',
        '"' + (r.gender || 'Laki-laki') + '"',
        '"' + (r.status || '') + '"',
        '"' + (r.selectedProgramName || '').replace(/"/g, '""') + '"',
        '"' + (r.whatsapp || '') + '"',
        '"' + (r.email || '') + '"',
        '"' + (r.city || '').replace(/"/g, '""') + '"',
        '"' + (r.totalTuitionIDR || 510000) + '"'
      ]);
      const csv = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'data_peserta_tadribul_lughah.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('File CSV data peserta berhasil diunduh!');
    }

    async function syncFromCpanelApi() {
      try {
        const res = await fetch('./api.php');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.status === 'ok') {
          if (Array.isArray(data.programs) && data.programs.length > 0) {
            state.programs = data.programs.map(p => ({
              id: p.id,
              code: p.code,
              indexNumber: p.index_number,
              levelNumber: Number(p.level_number),
              title: p.title,
              arabicTitle: p.arabic_title,
              category: p.category,
              categoryLabel: p.category_label,
              scheduleDays: p.schedule_days,
              scheduleTime: p.schedule_time,
              levelRecommendation: p.level_recommendation,
              durationWeeks: Number(p.duration_weeks),
              sessionsCount: Number(p.sessions_count),
              sessionMinutes: Number(p.session_minutes),
              tuitionIDR: Number(p.tuition_idr),
              summary: p.summary,
              targetOutcome: p.target_outcome,
              kitabReference: p.kitab_reference,
              registrationOpen: p.registration_open !== undefined ? Boolean(Number(p.registration_open)) : true,
              angkatan: p.angkatan || 'Angkatan 1'
            }));
          }
          if (Array.isArray(data.schedules) && data.schedules.length > 0) {
            state.schedules = data.schedules.map(s => ({
              id: s.id,
              batchCode: s.batch_code,
              programId: s.program_id,
              levelNumber: Number(s.level_number),
              programName: s.program_name,
              levelName: s.level_name,
              modeLabel: s.mode_label,
              days: s.days,
              timeWIB: s.time_wib,
              startDate: s.start_date,
              instructor: s.instructor,
              capacity: Number(s.capacity),
              enrolled: Number(s.enrolled),
              feeIDR: Number(s.fee_idr)
            }));
          }
          if (Array.isArray(data.registrations) && data.registrations.length > 0) {
            state.registrations = data.registrations.map(r => ({
              registrationNumber: r.registration_number,
              fullName: r.full_name,
              gender: r.gender || 'Laki-laki',
              email: r.email,
              whatsapp: r.whatsapp,
              occupation: r.occupation,
              city: r.city,
              selectedProgramId: r.selected_program_id,
              selectedProgramName: r.selected_program_name,
              selectedScheduleId: r.selected_schedule_id,
              selectedScheduleSummary: r.selected_schedule_summary,
              learningGoal: r.learning_goal,
              totalTuitionIDR: Number(r.total_tuition_idr),
              registeredAt: r.registered_at,
              status: r.status
            }));
          }
          persistLocal();
          render();
        }
      } catch (e) {}
    }

    function handleLogout() {
      state.isAuthenticated = false;
      sessionStorage.removeItem('tl_superadmin_verified_session_v1');
      window.location.replace('./login.html');
    }

    function saveProgram(e) {
      e.preventDefault();
      const f = e.target;
      const idx = state.programs.findIndex(p => p.id === state.selectedProgramId);
      if (idx === -1) return;
      const updated = {
        ...state.programs[idx],
        title: f.title.value,
        arabicTitle: f.arabicTitle.value,
        angkatan: f.angkatan ? f.angkatan.value : (state.programs[idx].angkatan || 'Angkatan 1'),
        scheduleDays: f.scheduleDays.value,
        scheduleTime: f.scheduleTime.value,
        tuitionIDR: Number(f.tuitionIDR.value) || 510000,
        kitabReference: f.kitabReference.value,
        summary: f.summary.value,
        targetOutcome: f.targetOutcome.value
      };
      state.programs[idx] = updated;
      persistLocal();
      fetch('./api.php?entity=program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
      showToast('Perubahan kurikulum ' + updated.code + ' berhasil disimpan ke database!');
    }

    function toggleProgramRegistration(programId) {
      const idx = state.programs.findIndex(p => p.id === programId);
      if (idx === -1) return;
      const currentOpen = state.programs[idx].registrationOpen !== false;
      const updated = {
        ...state.programs[idx],
        registrationOpen: !currentOpen
      };
      state.programs[idx] = updated;
      persistLocal();
      fetch('./api.php?entity=program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
      showToast('Status pendaftaran Level ' + updated.levelNumber + ' diubah menjadi ' + (!currentOpen ? 'ON (Dibuka)' : 'OFF (Ditutup)'));
    }

    function saveSchedule(e) {
      e.preventDefault();
      const f = e.target;
      const idx = state.schedules.findIndex(s => s.id === state.selectedScheduleId);
      if (idx === -1) return;
      const updated = {
        ...state.schedules[idx],
        batchCode: f.batchCode.value,
        programName: f.programName.value,
        days: f.days.value,
        timeWIB: f.timeWIB.value,
        startDate: f.startDate.value,
        instructor: f.instructor.value,
        capacity: Number(f.capacity.value) || 25,
        enrolled: Number(f.enrolled.value) || 0,
        feeIDR: Number(f.feeIDR.value) || 510000
      };
      state.schedules[idx] = updated;
      persistLocal();
      fetch('./api.php?entity=schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
      showToast('Jadwal kelas ' + updated.batchCode + ' berhasil diperbarui!');
    }

    function saveRegistration(e) {
      e.preventDefault();
      const f = e.target;
      const idx = state.registrations.findIndex(r => r.registrationNumber === state.selectedRegNo);
      if (idx === -1) return;
      const updated = {
        ...state.registrations[idx],
        fullName: f.fullName.value,
        gender: f.gender ? f.gender.value : (state.registrations[idx].gender || 'Laki-laki'),
        email: f.email.value,
        whatsapp: f.whatsapp.value,
        city: f.city.value,
        status: f.status.value
      };
      state.registrations[idx] = updated;
      persistLocal();
      fetch('./api.php?entity=registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
      showToast('Data pendaftar ' + updated.registrationNumber + ' berhasil diperbarui!');
    }

    function render() {
      const root = document.getElementById('superadmin-app');
      if (!state.isAuthenticated) {
        window.location.replace('./login.html');
        return;
      }

      const prog = state.programs.find(p => p.id === state.selectedProgramId) || state.programs[0];
      const sch = state.schedules.find(s => s.id === state.selectedScheduleId) || state.schedules[0];
      const reg = state.registrations.find(r => r.registrationNumber === state.selectedRegNo) || state.registrations[0];

      root.innerHTML = \`
        <!-- Top Page Banner -->
        <div class="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p class="text-xs font-mono text-emerald-400">FILE KHUSUS SUPERADMIN · superadmin.html</p>
            <h1 class="text-2xl font-semibold mt-1">Panel Kendali Superadmin Tadribul Lughah</h1>
            <p class="text-xs text-slate-300 mt-1">Kelola Level 1–3 (Nahwu) & Level 4 (Shorof), Jadwal Malam (20.00 – 22.00 WIB), dan Verifikasi Peserta.</p>
          </div>
          <button onclick="handleLogout()" class="px-4 py-2 text-xs font-semibold bg-rose-900/80 hover:bg-rose-800 border border-rose-700 rounded-lg shrink-0">Keluar (mazharhajid@gmail.com)</button>
        </div>

        \${state.toastMessage ? \`
          <div class="p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-medium">
            ✓ \${state.toastMessage}
          </div>
        \` : ''}

        <!-- Kontrol Buka / Tutup Pendaftaran Level 1 s/d Level 4 -->
        <div class="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div class="border-b border-slate-200 pb-3">
            <p class="text-xs font-mono font-semibold text-emerald-800">KONTROL STATUS PENDAFTARAN PER LEVEL (ON / OFF)</p>
            <h2 class="text-base font-semibold text-slate-900 mt-0.5">Buka / Tutup Pendaftaran Level 1 s/d Level 4</h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            \${state.programs.map(p => {
              const isOpen = p.registrationOpen !== false;
              return \`
                <div class="p-4 rounded-xl border \${isOpen ? 'bg-emerald-50/40 border-emerald-300' : 'bg-rose-50/40 border-rose-300'} flex flex-col justify-between gap-3">
                  <div>
                    <div class="flex items-center justify-between text-xs font-mono font-bold">
                      <span>Level \${p.levelNumber} (\${p.code})</span>
                      <span class="px-2 py-0.5 rounded text-[10px] \${isOpen ? 'bg-emerald-900 text-white' : 'bg-rose-700 text-white'}">\${isOpen ? 'ON · DIBUKA' : 'OFF · DITUTUP'}</span>
                    </div>
                    <p class="text-xs font-semibold text-slate-900 mt-1.5">\${p.title}</p>
                  </div>
                  <button onclick="toggleProgramRegistration('\${p.id}')" class="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white \${isOpen ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-900 hover:bg-emerald-800'}">
                    \${isOpen ? 'Matikan (OFF) Level ' + p.levelNumber : 'Aktifkan (ON) Level ' + p.levelNumber}
                  </button>
                </div>
              \`;
            }).join('')}
          </div>
        </div>

        <!-- Tab Selector -->
        <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-2">
          <button onclick="state.activeTab='programs'; render();" class="px-4 py-2 text-xs font-semibold rounded-lg \${state.activeTab === 'programs' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}">
            1. Edit Level & Kurikulum (\${state.programs.length})
          </button>
          <button onclick="state.activeTab='schedules'; render();" class="px-4 py-2 text-xs font-semibold rounded-lg \${state.activeTab === 'schedules' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}">
            2. Edit Jadwal Kelas Malam (\${state.schedules.length})
          </button>
          <button onclick="state.activeTab='registrations'; render();" class="px-4 py-2 text-xs font-semibold rounded-lg \${state.activeTab === 'registrations' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}">
            3. Data Pendaftar (\${state.registrations.length})
          </button>
        </div>

        \${state.activeTab === 'programs' && prog ? \`
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div class="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <p class="text-xs font-semibold text-slate-500 uppercase px-2 pb-1">Pilih Level</p>
              \${state.programs.map(p => \`
                <button onclick="state.selectedProgramId='\${p.id}'; render();" class="w-full text-left p-3 rounded-lg border \${p.id === prog.id ? 'bg-emerald-50 border-emerald-800' : 'border-slate-200 hover:bg-slate-50'}">
                  <div class="flex justify-between text-xs font-mono font-semibold text-emerald-900">
                    <span>\${p.code}</span>
                    <span>\${formatIDR(p.tuitionIDR)}</span>
                  </div>
                  <p class="text-xs font-semibold text-slate-900 mt-1">\${p.title}</p>
                </button>
              \`).join('')}
            </div>
            <form onsubmit="saveProgram(event)" class="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div class="flex justify-between items-center border-b border-slate-200 pb-4">
                <h2 class="text-base font-semibold text-slate-900">Edit \${prog.code} — \${prog.title}</h2>
                <button type="submit" class="px-4 py-2 text-xs font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800">Simpan Level</button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold mb-1">Judul Level</label>
                  <input name="title" value="\${prog.title}" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold mb-1">Judul Arab</label>
                  <input name="arabicTitle" dir="rtl" value="\${prog.arabicTitle}" class="w-full px-3 py-2 text-base font-arabic border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Angkatan Berapa</label>
                  <input name="angkatan" value="\${prog.angkatan || 'Angkatan 1'}" placeholder="Contoh: Angkatan 1" class="w-full px-3 py-2 text-xs font-mono font-semibold border border-emerald-300 bg-emerald-50/40 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Hari Kelas Online</label>
                  <input name="scheduleDays" value="\${prog.scheduleDays}" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Jam Belajar Malam (WIB)</label>
                  <input name="scheduleTime" value="\${prog.scheduleTime}" class="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Biaya Pendaftaran (IDR)</label>
                  <input name="tuitionIDR" type="number" value="\${prog.tuitionIDR}" class="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Kitab / Modul Pegangan</label>
                  <input name="kitabReference" value="\${prog.kitabReference}" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold mb-1">Ringkasan Materi</label>
                  <textarea name="summary" rows="3" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">\${prog.summary}</textarea>
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-xs font-semibold mb-1">Target Capaian Lulusan</label>
                  <textarea name="targetOutcome" rows="2" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">\${prog.targetOutcome}</textarea>
                </div>
              </div>
            </form>
          </div>
        \` : ''}

        \${state.activeTab === 'schedules' && sch ? \`
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div class="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-2">
              <p class="text-xs font-semibold text-slate-500 uppercase px-2 pb-1">Pilih Jadwal Kelas</p>
              \${state.schedules.map(s => \`
                <button onclick="state.selectedScheduleId='\${s.id}'; render();" class="w-full text-left p-3 rounded-lg border \${s.id === sch.id ? 'bg-emerald-50 border-emerald-800' : 'border-slate-200 hover:bg-slate-50'}">
                  <div class="flex justify-between text-xs font-mono font-semibold text-emerald-900">
                    <span>\${s.batchCode}</span>
                    <span>\${formatIDR(s.feeIDR)}</span>
                  </div>
                  <p class="text-xs font-semibold text-slate-900 mt-1">\${s.programName}</p>
                  <p class="text-[11px] text-slate-500">\${s.days} · \${s.timeWIB}</p>
                </button>
              \`).join('')}
            </div>
            <form onsubmit="saveSchedule(event)" class="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div class="flex justify-between items-center border-b border-slate-200 pb-4">
                <h2 class="text-base font-semibold text-slate-900">Edit Jadwal \${sch.batchCode}</h2>
                <button type="submit" class="px-4 py-2 text-xs font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-800">Simpan Jadwal</button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold mb-1">Kode Kelas</label>
                  <input name="batchCode" value="\${sch.batchCode}" class="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Nama Kelas</label>
                  <input name="programName" value="\${sch.programName}" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Hari Perkuliahan</label>
                  <input name="days" value="\${sch.days}" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Jam Belajar Malam (WIB)</label>
                  <input name="timeWIB" value="\${sch.timeWIB}" class="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Tanggal Mulai</label>
                  <input name="startDate" value="\${sch.startDate}" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Pengajar / Mudarris</label>
                  <input name="instructor" value="\${sch.instructor}" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Kapasitas Kursi</label>
                  <input name="capacity" type="number" value="\${sch.capacity}" class="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Peserta Terdaftar</label>
                  <input name="enrolled" type="number" value="\${sch.enrolled}" class="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label class="block text-xs font-semibold mb-1">Biaya Pendaftaran (IDR)</label>
                  <input name="feeIDR" type="number" value="\${sch.feeIDR}" class="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg" />
                </div>
              </div>
            </form>
          </div>
        \` : ''}

        \${state.activeTab === 'registrations' ? (() => {
          const q = (state.searchQuery || '').trim().toLowerCase();
          const filtered = state.registrations.filter(r => {
            const matchesSearch = !q ||
              (r.fullName || '').toLowerCase().includes(q) ||
              (r.registrationNumber || '').toLowerCase().includes(q) ||
              (r.whatsapp || '').toLowerCase().includes(q) ||
              (r.email || '').toLowerCase().includes(q) ||
              (r.city || '').toLowerCase().includes(q);
            const matchesLevel = state.filterLevel === 'all' || r.selectedProgramId === state.filterLevel;
            const matchesGender = state.filterGender === 'all' || (r.gender || 'Laki-laki') === state.filterGender;
            const matchesStatus = state.filterStatus === 'all' || r.status === state.filterStatus;
            return matchesSearch && matchesLevel && matchesGender && matchesStatus;
          });

          const total = state.registrations.length;
          const ikhwan = state.registrations.filter(r => (r.gender || 'Laki-laki') === 'Laki-laki').length;
          const akhwat = state.registrations.filter(r => r.gender === 'Perempuan').length;
          const verified = state.registrations.filter(r => (r.status || '').indexOf('Terverifikasi') !== -1).length;
          const pending = state.registrations.filter(r => (r.status || '').indexOf('Terverifikasi') === -1).length;
          const activeReg = state.registrations.find(r => r.registrationNumber === state.selectedRegNo) || filtered[0] || state.registrations[0];

          return \`
            <div class="space-y-6">
              <!-- Top Action Bar -->
              <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p class="text-xs font-mono font-semibold text-emerald-800 uppercase">DIREKTORI DATA PESERTA CPANEL</p>
                  <h2 class="text-lg font-semibold text-slate-900 mt-0.5">List Data Peserta Terdaftar (\${total} Peserta)</h2>
                  <p class="text-xs text-slate-600 mt-0.5">Seluruh peserta yang mendaftar tersimpan di database MySQL cPanel dan dapat dikelola langsung.</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button onclick="exportCsv()" class="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-800">
                    Ekspor CSV (.csv)
                  </button>
                </div>
              </div>

              <!-- Summary Counters -->
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                  <p class="text-[11px] font-mono text-slate-500 uppercase">Total Peserta</p>
                  <p class="text-xl font-bold font-mono text-slate-900 mt-1">\${total}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                  <p class="text-[11px] font-mono text-blue-700 uppercase">Laki-laki (Ikhwan)</p>
                  <p class="text-xl font-bold font-mono text-blue-900 mt-1">\${ikhwan}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                  <p class="text-[11px] font-mono text-purple-700 uppercase">Perempuan (Akhwat)</p>
                  <p class="text-xl font-bold font-mono text-purple-900 mt-1">\${akhwat}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl p-4">
                  <p class="text-[11px] font-mono text-emerald-700 uppercase">Terverifikasi</p>
                  <p class="text-xl font-bold font-mono text-emerald-900 mt-1">\${verified}</p>
                </div>
                <div class="bg-white border border-slate-200 rounded-xl p-4 col-span-2 sm:col-span-1">
                  <p class="text-[11px] font-mono text-amber-700 uppercase">Menunggu</p>
                  <p class="text-xl font-bold font-mono text-amber-900 mt-1">\${pending}</p>
                </div>
              </div>

              <!-- Search & Filter Controls -->
              <div class="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div class="md:col-span-5">
                  <input
                    type="text"
                    value="\${state.searchQuery || ''}"
                    oninput="state.searchQuery=this.value; render();"
                    placeholder="Cari nama, No. Registrasi, WhatsApp, Kota..."
                    class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div class="md:col-span-3">
                  <select onchange="state.filterLevel=this.value; render();" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                    <option value="all" \${state.filterLevel === 'all' ? 'selected' : ''}>Semua Program Level</option>
                    \${state.programs.map(p => \`
                      <option value="\${p.id}" \${state.filterLevel === p.id ? 'selected' : ''}>\${p.code} (Level \${p.levelNumber})</option>
                    \`).join('')}
                  </select>
                </div>
                <div class="md:col-span-2">
                  <select onchange="state.filterGender=this.value; render();" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                    <option value="all" \${state.filterGender === 'all' ? 'selected' : ''}>Semua Gender</option>
                    <option value="Laki-laki" \${state.filterGender === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
                    <option value="Perempuan" \${state.filterGender === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
                  </select>
                </div>
                <div class="md:col-span-2">
                  <select onchange="state.filterStatus=this.value; render();" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                    <option value="all" \${state.filterStatus === 'all' ? 'selected' : ''}>Semua Status</option>
                    <option value="Terverifikasi — Menunggu Orientasi" \${state.filterStatus === 'Terverifikasi — Menunggu Orientasi' ? 'selected' : ''}>Terverifikasi</option>
                    <option value="Menunggu Konfirmasi Pembayaran" \${state.filterStatus === 'Menunggu Konfirmasi Pembayaran' ? 'selected' : ''}>Menunggu</option>
                  </select>
                </div>
              </div>

              <!-- Main Table of Registrants -->
              <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="bg-slate-900 text-white font-mono text-[11px] uppercase">
                        <th class="py-3 px-4 w-12 text-center">No</th>
                        <th class="py-3 px-4">No. Registrasi</th>
                        <th class="py-3 px-4">Nama Lengkap & Gender</th>
                        <th className="py-3 px-4">Program Level</th>
                        <th class="py-3 px-4">
                          <span class="inline-flex items-center gap-1">
                            Status Pendaftaran
                            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 uppercase">Khusus Superadmin</span>
                          </span>
                        </th>
                        <th class="py-3 px-4">WhatsApp / Kontak</th>
                        <th class="py-3 px-4">Domisili</th>
                        <th class="py-3 px-4">Biaya</th>
                        <th class="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200">
                      \${filtered.length > 0 ? filtered.map((r, idx) => {
                        const isVerif = (r.status || '').indexOf('Terverifikasi') !== -1;
                        const isMale = (r.gender || 'Laki-laki') === 'Laki-laki';
                        const waDigits = (r.whatsapp || '').replace(/[^0-9]/g, '');
                        const waFormatted = waDigits.startsWith('0') ? '62' + waDigits.slice(1) : waDigits;
                        const waLink = 'https://wa.me/' + waFormatted + '?text=' + encodeURIComponent('Assalamu\\\'alaikum Warahmatullahi Wabarakatuh, Sdr/i ' + r.fullName + '...');
                        return \`
                          <tr class="hover:bg-slate-50">
                            <td class="py-3 px-4 text-center font-mono text-slate-500">\${idx + 1}</td>
                            <td class="py-3 px-4 font-mono font-bold text-slate-900">\${r.registrationNumber}</td>
                            <td class="py-3 px-4">
                              <p class="font-semibold text-slate-900">\${r.fullName}</p>
                              <span class="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono \${isMale ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'bg-purple-50 text-purple-900 border border-purple-200'}">
                                \${isMale ? '♂ Laki-laki' : '♀ Perempuan'}
                              </span>
                            </td>
                            <td class="py-3 px-4 font-semibold text-slate-900">\${r.selectedProgramName}</td>
                            <td class="py-3 px-4">
                              <button onclick="quickToggleStatus('\${r.registrationNumber}')" class="px-2.5 py-1 rounded-full text-[11px] font-semibold border \${isVerif ? 'bg-emerald-50 text-emerald-950 border-emerald-300' : 'bg-amber-50 text-amber-950 border-amber-300'}">
                                \${r.status}
                              </button>
                            </td>
                            <td class="py-3 px-4 font-mono">
                              <a href="\${waLink}" target="_blank" class="text-emerald-800 hover:underline font-semibold">\${r.whatsapp}</a>
                              <p class="text-[10px] text-slate-500 font-sans">\${r.email}</p>
                            </td>
                            <td class="py-3 px-4 text-slate-700">\${r.city || '-'}</td>
                            <td class="py-3 px-4 font-mono text-slate-900 font-semibold">\${formatIDR(r.totalTuitionIDR)}</td>
                            <td class="py-3 px-4 text-center">
                              <div class="flex items-center justify-center gap-1.5">
                                <button onclick="state.selectedRegNo='\${r.registrationNumber}'; state.isDetailModalOpen=true; render();" class="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-800">
                                  Edit
                                </button>
                                <a href="\${waLink}" target="_blank" class="px-2 py-1 text-[11px] font-semibold bg-emerald-800 hover:bg-emerald-700 text-white rounded">
                                  WA
                                </a>
                                <button onclick="deleteRegistration('\${r.registrationNumber}')" class="px-2 py-1 text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded">
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        \`;
                      }).join('') : \`
                        <tr>
                          <td colspan="9" class="py-8 text-center text-slate-500">Tidak ada peserta yang cocok dengan filter pencarian.</td>
                        </tr>
                      \`}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Modal / Form Edit Peserta Terpilih -->
              \${state.isDetailModalOpen && activeReg ? \`
                <div class="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
                  <div class="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                    <div class="flex items-center justify-between border-b border-slate-200 pb-3">
                      <h3 class="text-base font-semibold text-slate-900">Edit Peserta: \${activeReg.fullName} (\${activeReg.registrationNumber})</h3>
                      <button onclick="state.isDetailModalOpen=false; render();" class="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
                    </div>
                    <form onsubmit="saveRegistration(event); state.isDetailModalOpen=false; render();" class="space-y-4">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-xs font-semibold mb-1">Nama Lengkap</label>
                          <input name="fullName" value="\${activeReg.fullName}" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" required />
                        </div>
                        <div>
                          <label class="block text-xs font-semibold mb-1">Jenis Kelamin</label>
                          <select name="gender" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg">
                            <option value="Laki-laki" \${(activeReg.gender || 'Laki-laki') === 'Laki-laki' ? 'selected' : ''}>Laki-laki</option>
                            <option value="Perempuan" \${activeReg.gender === 'Perempuan' ? 'selected' : ''}>Perempuan</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-xs font-semibold mb-1">Status Verifikasi</label>
                          <select name="status" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold text-emerald-900">
                            <option value="Terverifikasi — Menunggu Orientasi" \${activeReg.status === 'Terverifikasi — Menunggu Orientasi' ? 'selected' : ''}>Terverifikasi — Menunggu Orientasi</option>
                            <option value="Menunggu Konfirmasi Pembayaran" \${activeReg.status === 'Menunggu Konfirmasi Pembayaran' ? 'selected' : ''}>Menunggu Konfirmasi Pembayaran</option>
                          </select>
                        </div>
                        <div>
                          <label class="block text-xs font-semibold mb-1">Kota Domisili</label>
                          <input name="city" value="\${activeReg.city}" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" required />
                        </div>
                        <div>
                          <label class="block text-xs font-semibold mb-1">Nomor WhatsApp</label>
                          <input name="whatsapp" value="\${activeReg.whatsapp}" class="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg" required />
                        </div>
                        <div>
                          <label class="block text-xs font-semibold mb-1">Email Peserta</label>
                          <input name="email" type="email" value="\${activeReg.email}" class="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg" required />
                        </div>
                      </div>
                      <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                        <button type="button" onclick="state.isDetailModalOpen=false; render();" class="px-4 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg">Batal</button>
                        <button type="submit" class="px-4 py-2 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg">Simpan Perubahan</button>
                      </div>
                    </form>
                  </div>
                </div>
              \` : ''}
            </div>
          \`;
        })() : ''}
      \`;
    }

    render();
    syncFromCpanelApi();
  </script>
</body>
</html>`;
}

export function buildCpanelReadyZipBlob(
  programs: ProgramTrack[],
  schedules: ClassSchedule[],
  registrations: RegistrationRecord[],
  cpanelConfig: CpanelDbConfig
): Blob {
  const sqlDump = generateCpanelSqlDump(programs, schedules, registrations);
  const phpApi = generateCpanelPhpApi(cpanelConfig);
  const standaloneHtml = generateStandaloneCpanelHtml(
    programs,
    schedules,
    registrations
  );
  const standaloneLoginHtml = generateStandaloneLoginHtml();
  const standaloneStudentHtml = generateStandaloneStudentPortalHtml(
    programs,
    schedules,
    registrations
  );
  const standaloneSuperAdminHtml = generateStandaloneSuperAdminHtml(
    programs,
    schedules,
    registrations
  );
  const standaloneMateriHtml = generateStandaloneMateriHtml(
    programs,
    schedules,
    registrations
  );

  const htaccess = `# Konfigurasi Apache / LiteSpeed cPanel — Tadribul Lughah
DirectoryIndex index.html index.php
AddDefaultCharset UTF-8

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json
</IfModule>
`;

  const readmeTxt = `============================================================================
PANDUAN UPLOAD WEBSITE TADRIBUL LUGHAH (.ZIP) KE CPANEL HOSTING
============================================================================

Isi di dalam file ZIP ini sudah dipisahkan menjadi 5 file HTML terpisah + backend SQL:
1. index.html                 -> Website Multi-Halaman Publik & Formulir Pendaftaran
2. login.html                 -> File Terpisah Halaman Login (Pelajar -> pelajar.html, Superadmin -> superadmin.html)
3. pelajar.html               -> File Terpisah Khusus Pelajar yang Sudah Terdaftar & Memiliki Akun
4. materi.html                -> File Terpisah Khusus Membaca Materi & Modul Pembelajaran Berjenjang
5. superadmin.html            -> File Terpisah Khusus Halaman Superadmin (Terkunci khusus Superadmin)
6. api.php                    -> Script koneksi database MySQL cPanel (PDO REST API)
7. database_cpanel_mysql.sql  -> File tabel & data SQL untuk di-import ke phpMyAdmin cPanel
8. .htaccess                  -> Konfigurasi routing & kompresi server cPanel

----------------------------------------------------------------------------
LANGKAH 1: BUAT DATABASE MYSQL DI CPANEL & IMPORT FILE .SQL
----------------------------------------------------------------------------
1. Login ke cPanel hosting Anda.
2. Buka menu "MySQL® Databases":
   - Buat Database baru (contoh: ${cpanelConfig.dbName || 'cpaneluser_tadribullughah'})
   - Buat User MySQL baru (contoh: ${cpanelConfig.dbUser || 'cpaneluser_admin'}) beserta Password-nya.
   - Hubungkan User ke Database pada bagian "Add User To Database" dan centang "ALL PRIVILEGES".
3. Buka menu "phpMyAdmin" di cPanel:
   - Klik nama database yang baru Anda buat di sebelah kiri.
   - Klik tab "Import" di bagian atas.
   - Pilih file "database_cpanel_mysql.sql" (dari dalam ZIP ini) lalu klik tombol "Import" / "Go".

----------------------------------------------------------------------------
LANGKAH 2: UPLOAD & EXTRACT FILE ZIP KE PUBLIC_HTML CPANEL
----------------------------------------------------------------------------
1. Buka menu "File Manager" di cPanel.
2. Masuk ke folder "public_html" (atau folder subdomain Anda).
3. Klik tombol "Upload" di bagian atas, lalu pilih file ZIP ini.
4. Setelah terupload 100%, kembali ke File Manager, klik kanan pada file ZIP tersebut, lalu pilih "Extract".
5. Klik kanan pada file "api.php" -> pilih "Edit":
   - Pastikan DB_NAME, DB_USER, dan DB_PASS sesuai dengan database MySQL cPanel yang Anda buat pada Langkah 1.
   - Klik "Save Changes".

Cara Akses:
- Halaman Utama Publik: https://domain-anda.com/index.html
- Halaman Login (Pelajar & Superadmin): https://domain-anda.com/login.html
- Halaman Khusus Pelajar Terdaftar (Wajib Akun): https://domain-anda.com/pelajar.html
- Halaman Khusus Modul Belajar (File Terpisah): https://domain-anda.com/materi.html
- Halaman Khusus Superadmin (Terkunci): https://domain-anda.com/superadmin.html
============================================================================
`;

  return createZipArchiveBlob([
    { name: 'index.html', content: standaloneHtml },
    { name: 'login.html', content: standaloneLoginHtml },
    { name: 'pelajar.html', content: standaloneStudentHtml },
    { name: 'materi.html', content: standaloneMateriHtml },
    { name: 'superadmin.html', content: standaloneSuperAdminHtml },
    { name: 'api.php', content: phpApi },
    { name: 'database_cpanel_mysql.sql', content: sqlDump },
    { name: '.htaccess', content: htaccess },
    { name: 'PANDUAN_UPLOAD_CPANEL.txt', content: readmeTxt }
  ]);
}
