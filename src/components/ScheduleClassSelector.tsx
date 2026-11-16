import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Check, ChevronDown, Clock } from 'lucide-react';
import { ClassSchedule } from '../data/arabicAcademyData';

interface ScheduleClassSelectorProps {
  id?: string;
  schedules: ClassSchedule[];
  selectedScheduleId: string;
  programAngkatan?: string;
  onSelect: (scheduleId: string) => void;
  isScheduleAlreadyEnrolled?: (sch: ClassSchedule) => boolean;
}

export const ScheduleClassSelector: React.FC<ScheduleClassSelectorProps> = ({
  id,
  schedules,
  selectedScheduleId,
  programAngkatan = 'Angkatan 1',
  onSelect,
  isScheduleAlreadyEnrolled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeSchedule =
    schedules.find((s) => s.id === selectedScheduleId) || schedules[0];

  if (!activeSchedule) {
    return (
      <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800">
        Belum ada jadwal kelas yang dibuka saat ini.
      </div>
    );
  }

  const activeAngkatan = activeSchedule.angkatan?.trim() || programAngkatan;
  const activeAlreadyEnrolled = isScheduleAlreadyEnrolled
    ? isScheduleAlreadyEnrolled(activeSchedule)
    : false;

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
          isOpen
            ? 'bg-emerald-50/70 border-emerald-700 ring-2 ring-emerald-200 shadow-xs'
            : 'bg-white border-emerald-700/60 hover:border-emerald-800 hover:bg-emerald-50/30 shadow-2xs'
        }`}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-950 border border-emerald-300">
              {activeAngkatan}
            </span>
            <span className="text-[11px] font-mono font-semibold text-slate-500">
              {activeSchedule.batchCode}
            </span>
            {activeAlreadyEnrolled && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                Sudah Terdaftar
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-800">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
              <Clock className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
              <span>
                Hari {activeSchedule.days} ({activeSchedule.timeWIB})
              </span>
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-emerald-900">
              <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Mulai {activeSchedule.startDate}</span>
            </span>
          </div>
        </div>

        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            isOpen
              ? 'bg-emerald-900 text-white rotate-180'
              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-labelledby={id}
          className="absolute left-0 right-0 mt-1.5 z-30 bg-white border border-emerald-200 rounded-xl shadow-xl p-1.5 space-y-1 max-h-64 overflow-y-auto"
        >
          {schedules.map((sch) => {
            const schAngkatan = sch.angkatan?.trim() || programAngkatan;
            const isSelected = sch.id === activeSchedule.id;
            const isEnrolled = isScheduleAlreadyEnrolled
              ? isScheduleAlreadyEnrolled(sch)
              : false;

            return (
              <button
                key={sch.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={isEnrolled}
                onClick={() => {
                  if (isEnrolled) return;
                  onSelect(sch.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                  isEnrolled
                    ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                    : isSelected
                      ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs cursor-pointer'
                      : 'bg-white border-transparent hover:bg-emerald-50 hover:border-emerald-200 text-slate-800 cursor-pointer'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        isSelected && !isEnrolled
                          ? 'bg-emerald-800 text-emerald-100 border border-emerald-600'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      {schAngkatan}
                    </span>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        isSelected && !isEnrolled ? 'text-emerald-200' : 'text-slate-500'
                      }`}
                    >
                      {sch.batchCode}
                    </span>
                    {isEnrolled && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        SUDAH TERDAFTAR
                      </span>
                    )}
                  </div>

                  <div
                    className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs ${
                      isSelected && !isEnrolled ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Clock
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected && !isEnrolled ? 'text-emerald-300' : 'text-emerald-700'
                        }`}
                      />
                      <span>
                        Hari {sch.days} ({sch.timeWIB})
                      </span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        isSelected && !isEnrolled ? 'text-emerald-200' : 'text-emerald-800'
                      }`}
                    >
                      <Calendar
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected && !isEnrolled ? 'text-emerald-300' : 'text-emerald-700'
                        }`}
                      />
                      <span>Mulai {sch.startDate}</span>
                    </span>
                  </div>
                </div>

                {isSelected && !isEnrolled && (
                  <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
