/**
 * Indonesian Public Holidays & "Tanggal Merah" Dataset & Utilities
 * Sumber data:
 * - SKB 3 Menteri (Menteri Agama, Menteri Ketenagakerjaan, Menteri PAN-RB)
 * - Hari Libur Nasional & Cuti Bersama Republik Indonesia (2024 - 2028)
 * - Sinkronisasi otomatis ke online API jika tersedia jaringan
 */

export interface IndonesianHoliday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'national' | 'cuti' | 'sunday';
  isJointLeave?: boolean;
}

export interface HolidayCheckResult {
  isTanggalMerah: boolean;
  isSunday: boolean;
  isHoliday: boolean;
  holidayName?: string;
  type?: 'national' | 'cuti' | 'sunday';
  badgeLabel?: string;
}

export const INDO_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const INDO_DAY_NAMES = [
  'Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
];

export const INDO_DAY_NAMES_SHORT = [
  'Ahd', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'
];

/**
 * Built-in Indonesian Holidays & Cuti Bersama (2024 – 2028)
 */
const BUILTIN_HOLIDAYS: Record<string, IndonesianHoliday> = {
  // === 2024 ===
  '2024-01-01': { date: '2024-01-01', name: 'Tahun Baru 2024 Masehi', type: 'national' },
  '2024-02-08': { date: '2024-02-08', name: 'Isra Mikraj Nabi Muhammad SAW', type: 'national' },
  '2024-02-09': { date: '2024-02-09', name: 'Cuti Bersama Tahun Baru Imlek 2575', type: 'cuti', isJointLeave: true },
  '2024-02-10': { date: '2024-02-10', name: 'Tahun Baru Imlek 2575 Kongzili', type: 'national' },
  '2024-03-11': { date: '2024-03-11', name: 'Hari Suci Nyepi (Tahun Baru Saka 1946)', type: 'national' },
  '2024-03-12': { date: '2024-03-12', name: 'Cuti Bersama Hari Suci Nyepi', type: 'cuti', isJointLeave: true },
  '2024-03-29': { date: '2024-03-29', name: 'Wafat Yesus Kristus', type: 'national' },
  '2024-03-31': { date: '2024-03-31', name: 'Hari Paskah', type: 'national' },
  '2024-04-08': { date: '2024-04-08', name: 'Cuti Bersama Idulfitri 1445 H', type: 'cuti', isJointLeave: true },
  '2024-04-09': { date: '2024-04-09', name: 'Cuti Bersama Idulfitri 1445 H', type: 'cuti', isJointLeave: true },
  '2024-04-10': { date: '2024-04-10', name: 'Hari Raya Idulfitri 1445 Hijriah', type: 'national' },
  '2024-04-11': { date: '2024-04-11', name: 'Hari Raya Idulfitri 1445 Hijriah', type: 'national' },
  '2024-04-12': { date: '2024-04-12', name: 'Cuti Bersama Idulfitri 1445 H', type: 'cuti', isJointLeave: true },
  '2024-04-15': { date: '2024-04-15', name: 'Cuti Bersama Idulfitri 1445 H', type: 'cuti', isJointLeave: true },
  '2024-05-01': { date: '2024-05-01', name: 'Hari Buruh Internasional', type: 'national' },
  '2024-05-09': { date: '2024-05-09', name: 'Kenaikan Yesus Kristus', type: 'national' },
  '2024-05-10': { date: '2024-05-10', name: 'Cuti Bersama Kenaikan Yesus Kristus', type: 'cuti', isJointLeave: true },
  '2024-05-23': { date: '2024-05-23', name: 'Hari Raya Waisak 2568 BE', type: 'national' },
  '2024-05-24': { date: '2024-05-24', name: 'Cuti Bersama Hari Raya Waisak', type: 'cuti', isJointLeave: true },
  '2024-06-01': { date: '2024-06-01', name: 'Hari Lahir Pancasila', type: 'national' },
  '2024-06-17': { date: '2024-06-17', name: 'Hari Raya Iduladha 1445 Hijriah', type: 'national' },
  '2024-06-18': { date: '2024-06-18', name: 'Cuti Bersama Iduladha 1445 H', type: 'cuti', isJointLeave: true },
  '2024-07-07': { date: '2024-07-07', name: 'Tahun Baru Islam 1446 Hijriah', type: 'national' },
  '2024-08-17': { date: '2024-08-17', name: 'Hari Kemerdekaan RI ke-79', type: 'national' },
  '2024-09-16': { date: '2024-09-16', name: 'Maulid Nabi Muhammad SAW', type: 'national' },
  '2024-12-25': { date: '2024-12-25', name: 'Hari Raya Natal', type: 'national' },
  '2024-12-26': { date: '2024-12-26', name: 'Cuti Bersama Hari Raya Natal', type: 'cuti', isJointLeave: true },

  // === 2025 ===
  '2025-01-01': { date: '2025-01-01', name: 'Tahun Baru 2025 Masehi', type: 'national' },
  '2025-01-27': { date: '2025-01-27', name: 'Isra Mikraj Nabi Muhammad SAW', type: 'national' },
  '2025-01-28': { date: '2025-01-28', name: 'Cuti Bersama Tahun Baru Imlek 2576', type: 'cuti', isJointLeave: true },
  '2025-01-29': { date: '2025-01-29', name: 'Tahun Baru Imlek 2576 Kongzili', type: 'national' },
  '2025-03-28': { date: '2025-03-28', name: 'Cuti Bersama Hari Suci Nyepi', type: 'cuti', isJointLeave: true },
  '2025-03-29': { date: '2025-03-29', name: 'Hari Suci Nyepi (Tahun Baru Saka 1947)', type: 'national' },
  '2025-03-31': { date: '2025-03-31', name: 'Hari Raya Idulfitri 1446 Hijriah', type: 'national' },
  '2025-04-01': { date: '2025-04-01', name: 'Hari Raya Idulfitri 1446 Hijriah (Hari Ke-2)', type: 'national' },
  '2025-04-02': { date: '2025-04-02', name: 'Cuti Bersama Idulfitri 1446 H', type: 'cuti', isJointLeave: true },
  '2025-04-03': { date: '2025-04-03', name: 'Cuti Bersama Idulfitri 1446 H', type: 'cuti', isJointLeave: true },
  '2025-04-04': { date: '2025-04-04', name: 'Cuti Bersama Idulfitri 1446 H', type: 'cuti', isJointLeave: true },
  '2025-04-07': { date: '2025-04-07', name: 'Cuti Bersama Idulfitri 1446 H', type: 'cuti', isJointLeave: true },
  '2025-04-18': { date: '2025-04-18', name: 'Wafat Yesus Kristus', type: 'national' },
  '2025-04-20': { date: '2025-04-20', name: 'Kebangkitan Yesus Kristus (Paskah)', type: 'national' },
  '2025-05-01': { date: '2025-05-01', name: 'Hari Buruh Internasional', type: 'national' },
  '2025-05-12': { date: '2025-05-12', name: 'Hari Raya Waisak 2569 BE', type: 'national' },
  '2025-05-13': { date: '2025-05-13', name: 'Cuti Bersama Hari Raya Waisak', type: 'cuti', isJointLeave: true },
  '2025-05-29': { date: '2025-05-29', name: 'Kenaikan Yesus Kristus', type: 'national' },
  '2025-05-30': { date: '2025-05-30', name: 'Cuti Bersama Kenaikan Yesus Kristus', type: 'cuti', isJointLeave: true },
  '2025-06-01': { date: '2025-06-01', name: 'Hari Lahir Pancasila', type: 'national' },
  '2025-06-06': { date: '2025-06-06', name: 'Hari Raya Iduladha 1446 Hijriah', type: 'national' },
  '2025-06-09': { date: '2025-06-09', name: 'Cuti Bersama Iduladha 1446 H', type: 'cuti', isJointLeave: true },
  '2025-06-27': { date: '2025-06-27', name: '1 Muharram Tahun Baru Islam 1447 Hijriah', type: 'national' },
  '2025-08-17': { date: '2025-08-17', name: 'Hari Proklamasi Kemerdekaan RI ke-80', type: 'national' },
  '2025-09-05': { date: '2025-09-05', name: 'Maulid Nabi Muhammad SAW', type: 'national' },
  '2025-12-25': { date: '2025-12-25', name: 'Hari Raya Natal', type: 'national' },
  '2025-12-26': { date: '2025-12-26', name: 'Cuti Bersama Hari Raya Natal', type: 'cuti', isJointLeave: true },

  // === 2026 ===
  '2026-01-01': { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi', type: 'national' },
  '2026-01-16': { date: '2026-01-16', name: 'Isra Mikraj Nabi Muhammad SAW', type: 'national' },
  '2026-02-16': { date: '2026-02-16', name: 'Cuti Bersama Tahun Baru Imlek 2577', type: 'cuti', isJointLeave: true },
  '2026-02-17': { date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili', type: 'national' },
  '2026-03-18': { date: '2026-03-18', name: 'Cuti Bersama Hari Suci Nyepi', type: 'cuti', isJointLeave: true },
  '2026-03-19': { date: '2026-03-19', name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', type: 'national' },
  '2026-03-20': { date: '2026-03-20', name: 'Cuti Bersama Idulfitri 1447 H', type: 'cuti', isJointLeave: true },
  '2026-03-21': { date: '2026-03-21', name: 'Hari Raya Idulfitri 1447 Hijriah', type: 'national' },
  '2026-03-22': { date: '2026-03-22', name: 'Hari Raya Idulfitri 1447 Hijriah (Hari Ke-2)', type: 'national' },
  '2026-03-23': { date: '2026-03-23', name: 'Cuti Bersama Idulfitri 1447 H', type: 'cuti', isJointLeave: true },
  '2026-03-24': { date: '2026-03-24', name: 'Cuti Bersama Idulfitri 1447 H', type: 'cuti', isJointLeave: true },
  '2026-04-03': { date: '2026-04-03', name: 'Wafat Yesus Kristus', type: 'national' },
  '2026-04-05': { date: '2026-04-05', name: 'Kebangkitan Yesus Kristus (Paskah)', type: 'national' },
  '2026-05-01': { date: '2026-05-01', name: 'Hari Buruh Internasional', type: 'national' },
  '2026-05-14': { date: '2026-05-14', name: 'Kenaikan Yesus Kristus', type: 'national' },
  '2026-05-15': { date: '2026-05-15', name: 'Cuti Bersama Kenaikan Yesus Kristus', type: 'cuti', isJointLeave: true },
  '2026-05-27': { date: '2026-05-27', name: 'Hari Raya Iduladha 1447 Hijriah', type: 'national' },
  '2026-05-28': { date: '2026-05-28', name: 'Cuti Bersama Iduladha 1447 H', type: 'cuti', isJointLeave: true },
  '2026-05-31': { date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE', type: 'national' },
  '2026-06-01': { date: '2026-06-01', name: 'Hari Lahir Pancasila', type: 'national' },
  '2026-06-16': { date: '2026-06-16', name: 'Tahun Baru Islam 1448 Hijriah (1 Muharram)', type: 'national' },
  '2026-08-17': { date: '2026-08-17', name: 'Hari Proklamasi Kemerdekaan RI ke-81', type: 'national' },
  '2026-08-25': { date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW', type: 'national' },
  '2026-12-24': { date: '2026-12-24', name: 'Cuti Bersama Hari Raya Natal', type: 'cuti', isJointLeave: true },
  '2026-12-25': { date: '2026-12-25', name: 'Hari Raya Natal', type: 'national' },
  '2026-12-26': { date: '2026-12-26', name: 'Cuti Bersama Hari Raya Natal', type: 'cuti', isJointLeave: true },

  // === 2027 ===
  '2027-01-01': { date: '2027-01-01', name: 'Tahun Baru 2027 Masehi', type: 'national' },
  '2027-01-05': { date: '2027-01-05', name: 'Isra Mikraj Nabi Muhammad SAW 1448 H', type: 'national' },
  '2027-02-05': { date: '2027-02-05', name: 'Cuti Bersama Tahun Baru Imlek 2578', type: 'cuti', isJointLeave: true },
  '2027-02-06': { date: '2027-02-06', name: 'Tahun Baru Imlek 2578 Kongzili', type: 'national' },
  '2027-03-08': { date: '2027-03-08', name: 'Hari Suci Nyepi (Tahun Baru Saka 1949)', type: 'national' },
  '2027-03-09': { date: '2027-03-09', name: 'Cuti Bersama Hari Suci Nyepi', type: 'cuti', isJointLeave: true },
  '2027-03-10': { date: '2027-03-10', name: 'Hari Raya Idulfitri 1448 Hijriah', type: 'national' },
  '2027-03-11': { date: '2027-03-11', name: 'Hari Raya Idulfitri 1448 Hijriah (Hari Ke-2)', type: 'national' },
  '2027-03-12': { date: '2027-03-12', name: 'Cuti Bersama Idulfitri 1448 H', type: 'cuti', isJointLeave: true },
  '2027-03-15': { date: '2027-03-15', name: 'Cuti Bersama Idulfitri 1448 H', type: 'cuti', isJointLeave: true },
  '2027-03-26': { date: '2027-03-26', name: 'Wafat Yesus Kristus', type: 'national' },
  '2027-03-28': { date: '2027-03-28', name: 'Kebangkitan Yesus Kristus (Paskah)', type: 'national' },
  '2027-05-01': { date: '2027-05-01', name: 'Hari Buruh Internasional', type: 'national' },
  '2027-05-06': { date: '2027-05-06', name: 'Kenaikan Yesus Kristus', type: 'national' },
  '2027-05-07': { date: '2027-05-07', name: 'Cuti Bersama Kenaikan Yesus Kristus', type: 'cuti', isJointLeave: true },
  '2027-05-16': { date: '2027-05-16', name: 'Hari Raya Iduladha 1448 Hijriah', type: 'national' },
  '2027-05-17': { date: '2027-05-17', name: 'Cuti Bersama Iduladha 1448 H', type: 'cuti', isJointLeave: true },
  '2027-05-20': { date: '2027-05-20', name: 'Hari Raya Waisak 2571 BE', type: 'national' },
  '2027-06-01': { date: '2027-06-01', name: 'Hari Lahir Pancasila', type: 'national' },
  '2027-06-06': { date: '2027-06-06', name: 'Tahun Baru Islam 1449 Hijriah (1 Muharram)', type: 'national' },
  '2027-08-15': { date: '2027-08-15', name: 'Maulid Nabi Muhammad SAW', type: 'national' },
  '2027-08-17': { date: '2027-08-17', name: 'Hari Proklamasi Kemerdekaan RI ke-82', type: 'national' },
  '2027-12-24': { date: '2027-12-24', name: 'Cuti Bersama Hari Raya Natal', type: 'cuti', isJointLeave: true },
  '2027-12-25': { date: '2027-12-25', name: 'Hari Raya Natal', type: 'national' },

  // === 2028 ===
  '2028-01-01': { date: '2028-01-01', name: 'Tahun Baru 2028 Masehi', type: 'national' },
  '2028-01-24': { date: '2028-01-24', name: 'Isra Mikraj Nabi Muhammad SAW', type: 'national' },
  '2028-01-26': { date: '2028-01-26', name: 'Tahun Baru Imlek 2579 Kongzili', type: 'national' },
  '2028-02-27': { date: '2028-02-27', name: 'Hari Raya Idulfitri 1449 Hijriah', type: 'national' },
  '2028-02-28': { date: '2028-02-28', name: 'Hari Raya Idulfitri 1449 Hijriah (Hari Ke-2)', type: 'national' },
  '2028-03-26': { date: '2028-03-26', name: 'Hari Suci Nyepi (Tahun Baru Saka 1950)', type: 'national' },
  '2028-04-14': { date: '2028-04-14', name: 'Wafat Yesus Kristus', type: 'national' },
  '2028-04-16': { date: '2028-04-16', name: 'Kebangkitan Yesus Kristus (Paskah)', type: 'national' },
  '2028-05-01': { date: '2028-05-01', name: 'Hari Buruh Internasional', type: 'national' },
  '2028-05-09': { date: '2028-05-09', name: 'Hari Raya Waisak 2572 BE', type: 'national' },
  '2028-05-25': { date: '2028-05-25', name: 'Kenaikan Yesus Kristus', type: 'national' },
  '2028-06-01': { date: '2028-06-01', name: 'Hari Lahir Pancasila', type: 'national' },
  '2028-06-05': { date: '2028-06-05', name: 'Hari Raya Iduladha 1449 Hijriah', type: 'national' },
  '2028-06-25': { date: '2028-06-25', name: 'Tahun Baru Islam 1450 Hijriah (1 Muharram)', type: 'national' },
  '2028-08-17': { date: '2028-08-17', name: 'Hari Proklamasi Kemerdekaan RI ke-83', type: 'national' },
  '2028-09-03': { date: '2028-09-03', name: 'Maulid Nabi Muhammad SAW', type: 'national' },
  '2028-12-25': { date: '2028-12-25', name: 'Hari Raya Natal', type: 'national' }
};

// Memory cache combined from built-in and online synced data
const holidayStore: Map<string, IndonesianHoliday> = new Map(Object.entries(BUILTIN_HOLIDAYS));

// Load cached holidays from localStorage on module init if in browser
if (typeof window !== 'undefined') {
  try {
    const cached = localStorage.getItem('indonesia_holidays_sync_v1');
    if (cached) {
      const parsed: Record<string, IndonesianHoliday> = JSON.parse(cached);
      Object.entries(parsed).forEach(([k, v]) => holidayStore.set(k, v));
    }
  } catch (e) {
    console.warn('Gagal membaca cache libur nasional:', e);
  }
}

/**
 * Sync holiday data from online API if accessible
 */
export async function syncIndonesianHolidays(year: number): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const response = await fetch(`https://apiindonesia.id/data/libur-nasional-${year}.json`);
    if (response.ok) {
      const items: Array<{ date: string; name: string; type: string; is_joint_leave?: number }> = await response.json();
      if (Array.isArray(items)) {
        items.forEach((item) => {
          if (item.date && item.name) {
            const isCuti = item.is_joint_leave === 1 || item.type?.includes('cuti');
            holidayStore.set(item.date, {
              date: item.date,
              name: item.name,
              type: isCuti ? 'cuti' : 'national',
              isJointLeave: isCuti
            });
          }
        });
        // Save to cache
        try {
          const serialized: Record<string, IndonesianHoliday> = {};
          holidayStore.forEach((v, k) => { serialized[k] = v; });
          localStorage.setItem('indonesia_holidays_sync_v1', JSON.stringify(serialized));
        } catch (_) {}
        return true;
      }
    }
  } catch (err) {
    // Silently fall back to built-in dictionary
  }

  // Backup fallback: guangrei calendar json
  try {
    const backupRes = await fetch('https://raw.githubusercontent.com/guangrei/APIHariLibur_V2/main/calendar.min.json');
    if (backupRes.ok) {
      const data: Record<string, { holiday?: boolean; summary?: string[]; description?: string[] }> = await backupRes.json();
      Object.entries(data).forEach(([dateKey, val]) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
          const name = val.summary?.[0] || val.description?.[0] || 'Hari Libur Nasional';
          const isCuti = name.toLowerCase().includes('cuti');
          holidayStore.set(dateKey, {
            date: dateKey,
            name,
            type: isCuti ? 'cuti' : 'national',
            isJointLeave: isCuti
          });
        }
      });
      return true;
    }
  } catch (_) {}

  return false;
}

/**
 * Format string e.g. "19 November 2026" or Date to "YYYY-MM-DD"
 */
export function dateStringToYMD(dateStr?: string | Date): string {
  if (!dateStr) return '';
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${dateStr.getFullYear()}-${pad(dateStr.getMonth() + 1)}-${pad(dateStr.getDate())}`;
  }
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthNames: Record<string, number> = {
      januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
      juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
    };
    const mStr = parts[1].toLowerCase();
    const month = monthNames[mStr] !== undefined ? monthNames[mStr] : -1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== -1 && !isNaN(year)) {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${year}-${pad(month + 1)}-${pad(day)}`;
    }
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
  }
  return '';
}

/**
 * Convert YYYY-MM-DD to Indonesian string, e.g. "19 November 2026"
 */
export function ymdToIndonesianDate(ymd: string): string {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (month >= 0 && month < 12 && !isNaN(day) && !isNaN(year)) {
      return `${day} ${INDO_MONTH_NAMES[month]} ${year}`;
    }
  }
  return ymd;
}

/**
 * Convert YYYY-MM-DD or Indonesian date string to full text format, e.g. "Kamis, 19 November 2026"
 */
export function formatIndonesianFullDate(dateVal?: string | Date): string {
  const ymd = dateStringToYMD(dateVal);
  if (!ymd) return typeof dateVal === 'string' ? dateVal : '';
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const dt = new Date(year, month, day);
  if (isNaN(dt.getTime())) return ymd;
  const dayName = INDO_DAY_NAMES[dt.getDay()];
  return `${dayName}, ${day} ${INDO_MONTH_NAMES[month]} ${year}`;
}

/**
 * Check if a date is a Tanggal Merah (Sunday, National Holiday, or Cuti Bersama)
 */
export function getHolidayInfo(dateVal?: string | Date): HolidayCheckResult {
  const ymd = dateStringToYMD(dateVal);
  if (!ymd) {
    return { isTanggalMerah: false, isSunday: false, isHoliday: false };
  }

  const parts = ymd.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const dt = new Date(year, month, day);
  const isSunday = !isNaN(dt.getTime()) && dt.getDay() === 0;

  const holiday = holidayStore.get(ymd);

  if (holiday) {
    const isCuti = holiday.type === 'cuti' || holiday.isJointLeave;
    return {
      isTanggalMerah: true,
      isSunday,
      isHoliday: true,
      holidayName: holiday.name,
      type: isCuti ? 'cuti' : 'national',
      badgeLabel: isCuti ? `Cuti Bersama: ${holiday.name}` : `Libur Nasional: ${holiday.name}`
    };
  }

  if (isSunday) {
    return {
      isTanggalMerah: true,
      isSunday: true,
      isHoliday: false,
      holidayName: 'Hari Ahad (Minggu)',
      type: 'sunday',
      badgeLabel: 'Hari Ahad (Minggu)'
    };
  }

  return {
    isTanggalMerah: false,
    isSunday: false,
    isHoliday: false
  };
}

/**
 * Get all Indonesian holidays in a given month (year and monthIndex: 0-11)
 */
export function getHolidaysInMonth(
  year: number,
  monthIndex: number
): Array<{ ymd: string; day: number; name: string; type: 'national' | 'cuti' }> {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const prefix = `${year}-${pad(monthIndex + 1)}-`;
  const result: Array<{ ymd: string; day: number; name: string; type: 'national' | 'cuti' }> = [];

  holidayStore.forEach((h, k) => {
    if (k.startsWith(prefix)) {
      const parts = k.split('-');
      const day = parseInt(parts[2], 10);
      result.push({
        ymd: k,
        day,
        name: h.name,
        type: h.type === 'cuti' ? 'cuti' : 'national'
      });
    }
  });

  return result.sort((a, b) => a.day - b.day);
}
