import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  RefreshCw,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import {
  INDO_MONTH_NAMES,
  dateStringToYMD,
  ymdToIndonesianDate,
  formatIndonesianFullDate,
  getHolidayInfo,
  getHolidaysInMonth,
  syncIndonesianHolidays
} from '../utils/indonesianHolidays';

interface IndonesianCalendarPickerProps {
  value: string; // e.g. "19 November 2026" or "2026-11-19"
  onChange: (formattedDate: string, ymd: string) => void;
  label?: string;
  helperText?: string;
  defaultOpen?: boolean;
}

export const IndonesianCalendarPicker: React.FC<IndonesianCalendarPickerProps> = ({
  value,
  onChange,
  label = 'Jadwal Mulai Program (Tanggal Perdana Kelas)',
  helperText,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Parse currently selected date
  const selectedYMD = useMemo(() => dateStringToYMD(value), [value]);

  // Current view in calendar (year and monthIndex: 0-11)
  const [viewYear, setViewYear] = useState<number>(() => {
    if (selectedYMD) {
      const y = parseInt(selectedYMD.split('-')[0], 10);
      if (!isNaN(y)) return y;
    }
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (selectedYMD) {
      const m = parseInt(selectedYMD.split('-')[1], 10) - 1;
      if (!isNaN(m) && m >= 0 && m < 12) return m;
    }
    return new Date().getMonth();
  });

  // Keep view in sync when value changes externally
  useEffect(() => {
    if (selectedYMD) {
      const parts = selectedYMD.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m) && m >= 0 && m < 12) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, [selectedYMD]);

  // Sync holidays on mount
  useEffect(() => {
    syncIndonesianHolidays(viewYear);
  }, [viewYear]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const ok = await syncIndonesianHolidays(viewYear);
      setSyncMessage(
        ok
          ? `Tersinkronisasi dengan SKB 3 Menteri RI & database libur nasional tahun ${viewYear}.`
          : `Kalender libur nasional tahun ${viewYear} telah dimuat dari database lokal.`
      );
    } catch (_) {
      setSyncMessage(`Memuat kalender libur nasional tahun ${viewYear}.`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleGoToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ymd = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const formatted = ymdToIndonesianDate(ymd);
    onChange(formatted, ymd);
  };

  const handleSelectDay = (day: number) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const ymd = `${viewYear}-${pad(viewMonth + 1)}-${pad(day)}`;
    const formatted = ymdToIndonesianDate(ymd);
    onChange(formatted, ymd);
  };

  // Calendar day cells calculation
  // Start day of week: Senin = 0, Selasa = 1, ... Ahad = 6
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    // getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
    // Convert to Monday = 0 ... Sunday = 6
    const dayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells: Array<{
      day: number;
      isCurrentMonth: boolean;
      ymd: string;
      isSunday: boolean;
      holidayInfo: ReturnType<typeof getHolidayInfo>;
    }> = [];

    const pad = (n: number) => n.toString().padStart(2, '0');

    // Previous month padding
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
      const ymd = `${prevY}-${pad(prevM + 1)}-${pad(d)}`;
      const hInfo = getHolidayInfo(ymd);
      cells.push({
        day: d,
        isCurrentMonth: false,
        ymd,
        isSunday: hInfo.isSunday,
        holidayInfo: hInfo
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const ymd = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
      const hInfo = getHolidayInfo(ymd);
      cells.push({
        day: d,
        isCurrentMonth: true,
        ymd,
        isSunday: hInfo.isSunday,
        holidayInfo: hInfo
      });
    }

    // Next month padding to fill rows to multiples of 7
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
        const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
        const ymd = `${nextY}-${pad(nextM + 1)}-${pad(d)}`;
        const hInfo = getHolidayInfo(ymd);
        cells.push({
          day: d,
          isCurrentMonth: false,
          ymd,
          isSunday: hInfo.isSunday,
          holidayInfo: hInfo
        });
      }
    }

    return cells;
  }, [viewYear, viewMonth]);

  // Selected date info
  const selectedInfo = useMemo(() => {
    return getHolidayInfo(selectedYMD);
  }, [selectedYMD]);

  // Holidays list in current view month
  const monthHolidays = useMemo(() => {
    return getHolidaysInMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  const todayYMD = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }, []);

  return (
    <div className="bg-emerald-50/70 p-4.5 rounded-xl border border-emerald-300 space-y-4">
      {/* Header with Title and Selected Date Preview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <label className="text-xs font-bold text-emerald-950 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-emerald-800" />
            <span>{label}</span>
          </label>
          {helperText && <p className="text-[11px] text-slate-600 mt-0.5">{helperText}</p>}
        </div>

        {/* Selected Date Summary Badge */}
        {value && (
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            <span className="text-xs font-mono font-bold text-emerald-950 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-2xs flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>{formatIndonesianFullDate(value)}</span>
            </span>

            {/* Tanggal Merah Status Tag */}
            {selectedInfo.isTanggalMerah ? (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-2xs border ${
                  selectedInfo.isHoliday
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
                title={selectedInfo.holidayName}
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                <span>🔴 Tanggal Merah ({selectedInfo.holidayName})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>Hari Kerja / Aktif</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Inputs: Calendar Trigger Button & Direct Indonesian Text Edit */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Toggle / Calendar Button */}
        <div className="sm:col-span-5">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <span>📅 Kalender Tanggal Merah:</span>
          </label>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`w-full px-3 py-2 text-xs font-semibold rounded-lg border flex items-center justify-between transition-all shadow-2xs ${
              isOpen
                ? 'bg-emerald-800 text-white border-emerald-800 ring-2 ring-emerald-600/30'
                : 'bg-white text-emerald-950 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarDays className="w-4 h-4 text-emerald-600" />
              <span>{isOpen ? 'Tutup Kalender Indonesia' : 'Buka Kalender Tanggal Merah'}</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isOpen ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
              }`}
            >
              🇮🇩 SKB 3 Menteri
            </span>
          </button>
        </div>

        {/* Text Input Format Indonesia */}
        <div className="sm:col-span-7">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Format Tanggal Indonesia (Otomatis / Ketik Manual):
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: 19 November 2026"
            value={value}
            onChange={(e) => {
              const val = e.target.value;
              const ymd = dateStringToYMD(val);
              onChange(val, ymd);
            }}
            className="w-full px-3 py-2 text-xs font-semibold text-emerald-950 bg-white border border-emerald-300 rounded-lg focus:outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/20 shadow-2xs"
          />
        </div>
      </div>

      {/* Warning Notice if Tanggal Merah is Selected */}
      {selectedInfo.isHoliday && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded-r-lg flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-950 leading-relaxed">
            <span className="font-bold text-rose-900">Perhatian Tanggal Merah: </span>
            Tanggal yang dipilih (<strong>{formatIndonesianFullDate(value)}</strong>) bertepatan dengan{' '}
            <strong className="underline text-rose-900">{selectedInfo.holidayName}</strong>.
            <span className="block text-[11px] text-rose-800 mt-0.5">
              Silakan pastikan apakah kelas perdana tetap dimulai di hari libur ini atau dijadwalkan ulang ke hari aktif berikutnya.
            </span>
          </div>
        </div>
      )}

      {/* EXPANDABLE FULL VISUAL CALENDAR WITH TANGGAL MERAH SINKRONISASI */}
      {isOpen && (
        <div className="bg-white border-2 border-emerald-300 rounded-xl p-4 shadow-sm space-y-4 transition-all">
          {/* Calendar Top Bar: Navigation, Selectors & Sync Button */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Prev / Next & Month-Year Picker */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Bulan Sebelumnya"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                {/* Month Dropdown */}
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                  className="px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 cursor-pointer"
                >
                  {INDO_MONTH_NAMES.map((m, idx) => (
                    <option key={`m-${idx}`} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                  className="px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-800 cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={`y-${y}`} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Bulan Berikutnya"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Hari Ini Shortcut */}
              <button
                type="button"
                onClick={handleGoToday}
                className="ml-1 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
              >
                Hari Ini
              </button>
            </div>

            {/* Sync Status Badge */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Sinkron SKB 3 Menteri ({viewYear})</span>
              </span>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Sinkronkan ulang data libur nasional dari server"
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
              </button>
            </div>
          </div>

          {syncMessage && (
            <div className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{syncMessage}</span>
            </div>
          )}

          {/* Calendar Day Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs select-none">
            <div className="py-1.5 text-slate-700 bg-slate-50 rounded">Sen</div>
            <div className="py-1.5 text-slate-700 bg-slate-50 rounded">Sel</div>
            <div className="py-1.5 text-slate-700 bg-slate-50 rounded">Rab</div>
            <div className="py-1.5 text-slate-700 bg-slate-50 rounded">Kam</div>
            <div className="py-1.5 text-slate-700 bg-slate-50 rounded">Jum</div>
            <div className="py-1.5 text-slate-700 bg-slate-50 rounded">Sab</div>
            <div className="py-1.5 text-rose-700 bg-rose-50 rounded border border-rose-200 font-extrabold" title="Hari Ahad (Tanggal Merah)">
              Ahd
            </div>
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((cell, idx) => {
              const isSelected = selectedYMD === cell.ymd;
              const isToday = todayYMD === cell.ymd;
              const hasHoliday = cell.holidayInfo.isHoliday;
              const isSun = cell.isSunday;

              // Cell color & style logic
              let cellClasses =
                'relative flex flex-col items-center justify-center p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none min-h-[46px] ';

              if (!cell.isCurrentMonth) {
                cellClasses += 'text-slate-300 hover:text-slate-500 hover:bg-slate-50/70 ';
              } else if (isSelected) {
                cellClasses +=
                  'bg-emerald-800 text-white font-extrabold ring-2 ring-emerald-500 shadow-sm hover:bg-emerald-900 ';
              } else if (hasHoliday) {
                // National Holiday or Cuti Bersama
                cellClasses +=
                  'text-rose-700 bg-rose-100/80 border border-rose-300 font-bold hover:bg-rose-200 ';
              } else if (isSun) {
                // Sunday
                cellClasses +=
                  'text-rose-600 bg-rose-50/70 hover:bg-rose-100 font-semibold ';
              } else {
                // Regular weekday
                cellClasses +=
                  'text-slate-800 hover:bg-slate-100 ';
              }

              if (isToday && !isSelected) {
                cellClasses += 'ring-1.5 ring-blue-500 font-bold ';
              }

              const tooltip = cell.holidayInfo.holidayName
                ? `${cell.day} ${INDO_MONTH_NAMES[viewMonth]}: ${cell.holidayInfo.holidayName}`
                : isSun
                ? `${cell.day} ${INDO_MONTH_NAMES[viewMonth]}: Hari Ahad`
                : undefined;

              return (
                <button
                  key={`day-cell-${cell.ymd}-${idx}`}
                  type="button"
                  title={tooltip}
                  onClick={() => {
                    handleSelectDay(cell.day);
                  }}
                  className={cellClasses}
                >
                  <span className="text-xs">{cell.day}</span>

                  {/* Holiday / Tanggal Merah Marker */}
                  {cell.isCurrentMonth && hasHoliday && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isSelected ? 'bg-amber-300' : 'bg-rose-600 animate-pulse'
                      }`}
                    />
                  )}

                  {/* Today subtle marker */}
                  {cell.isCurrentMonth && isToday && !hasHoliday && (
                    <span
                      className={`text-[9px] font-bold leading-none scale-75 ${
                        isSelected ? 'text-emerald-200' : 'text-blue-600'
                      }`}
                    >
                      Kini
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend / Keterangan Warna */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-600 border-t border-slate-100">
            <span className="font-semibold text-slate-700">Keterangan:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-800 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
              <span>Tanggal Terpilih</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 text-[9px] font-bold">🔴</span>
              <span>Libur Nasional / Cuti Bersama</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-50 text-rose-600 flex items-center justify-center text-[9px] font-bold">Ahd</span>
              <span>Hari Ahad (Minggu)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded ring-1.5 ring-blue-500 bg-white"></span>
              <span>Hari Ini</span>
            </span>
          </div>

          {/* Daftar Tanggal Merah & Libur Nasional di Bulan Ini */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-600" />
                <span>
                  Daftar Libur Nasional & Cuti Bersama ({INDO_MONTH_NAMES[viewMonth]} {viewYear})
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {monthHolidays.length} hari libur terdaftar
              </span>
            </div>

            {monthHolidays.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {monthHolidays.map((h) => {
                  const isCurrentSelected = selectedYMD === h.ymd;
                  return (
                    <button
                      key={`holiday-item-${h.ymd}`}
                      type="button"
                      onClick={() => handleSelectDay(h.day)}
                      className={`text-left p-2 rounded-lg border text-xs transition-colors flex items-start gap-2 ${
                        isCurrentSelected
                          ? 'bg-rose-100 border-rose-400 font-bold text-rose-900 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-rose-300 text-slate-800'
                      }`}
                    >
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shrink-0 mt-0.5">
                        {h.day} {INDO_MONTH_NAMES[viewMonth].slice(0, 3)}
                      </span>
                      <span className="leading-tight">
                        <span className="block font-semibold">{h.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {h.type === 'cuti' ? 'Cuti Bersama' : 'Hari Libur Nasional'}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic py-1">
                Tidak ada hari libur nasional atau cuti bersama di bulan {INDO_MONTH_NAMES[viewMonth]} {viewYear} selain hari Ahad (Minggu).
              </p>
            )}
          </div>

          {/* Close Calendar button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg transition-colors shadow-2xs"
            >
              Selesai & Gunakan Tanggal Ini
            </button>
          </div>
        </div>
      )}

      {/* Footnote helper */}
      <p className="text-[11px] text-slate-600 leading-relaxed">
        💡 <strong>Info Kalender:</strong> Kalender ini disinkronkan langsung dengan data <strong>Hari Libur Nasional & Cuti Bersama Indonesia (SKB 3 Menteri)</strong> serta menandai seluruh hari Ahad dan tanggal merah secara visual. Data ini akan otomatis tersinkron ke portal santri dan database pendaftaran.
      </p>
    </div>
  );
};
