import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Lock, Unlock, Minus, Plus, Check, X } from 'lucide-react';

interface MateriLimitSelectorProps {
  pekans: { pekanNumber: number; title: string }[];
  currentLimit: number;
  totalCount: number;
  onSelectLimit: (maxPekan: number) => void;
  compact?: boolean;
}

export const MateriLimitSelector: React.FC<MateriLimitSelectorProps> = ({
  pekans,
  currentLimit,
  totalCount,
  onSelectLimit,
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredLimit, setHoveredLimit] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHoveredLimit(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setHoveredLimit(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const previewLimit = hoveredLimit !== null ? hoveredLimit : currentLimit;

  const getSummaryText = () => {
    if (currentLimit <= 0) return `Semua OFF (0/${totalCount})`;
    if (currentLimit >= totalCount) return `Semua Pekan ON (1–${totalCount})`;
    return `s/d Pekan ${currentLimit} ON · P${currentLimit + 1}+ OFF`;
  };

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <div className="flex items-stretch gap-1">
        {/* Step Down (-1) */}
        <button
          type="button"
          disabled={currentLimit <= 0}
          onClick={() => onSelectLimit(Math.max(0, currentLimit - 1))}
          className={`px-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center shrink-0 ${
            compact ? 'py-1' : 'py-1.5'
          }`}
          title={currentLimit <= 0 ? 'Sudah 0 pekan ON' : `Turunkan ke s/d Pekan ${currentLimit - 1}`}
        >
          <Minus className="w-3 h-3" />
        </button>

        {/* Custom Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          className={`flex-1 min-w-0 px-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 text-left ${
            compact ? 'py-1.5 text-[11px]' : 'py-2 text-xs'
          } ${
            isOpen
              ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950'
              : 'bg-white border-indigo-300 hover:border-indigo-500 text-slate-900 shadow-2xs'
          }`}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 ${
                currentLimit <= 0
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              {currentLimit <= 0 ? (
                <Lock className="w-2.5 h-2.5" />
              ) : (
                <Unlock className="w-2.5 h-2.5" />
              )}
              <span>
                {currentLimit <= 0 ? '0' : `1–${currentLimit}`}/{totalCount}
              </span>
            </span>
            <span className="font-semibold truncate">{getSummaryText()}</span>
          </span>

          <ChevronDown
            className={`w-3.5 h-3.5 text-indigo-700 shrink-0 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Step Up (+1) */}
        <button
          type="button"
          disabled={currentLimit >= totalCount}
          onClick={() => onSelectLimit(Math.min(totalCount, currentLimit + 1))}
          className={`px-2 rounded-lg border border-indigo-300 bg-indigo-50 hover:bg-indigo-900 hover:text-white hover:border-indigo-900 text-indigo-900 transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center shrink-0 ${
            compact ? 'py-1' : 'py-1.5'
          }`}
          title={
            currentLimit >= totalCount
              ? 'Semua pekan sudah ON'
              : `Buka sampai Pekan ${currentLimit + 1}`
          }
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Custom Visual Grid Popover */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 sm:right-auto sm:min-w-[380px] sm:max-w-[460px] mt-1.5 z-40 bg-white border border-indigo-200 rounded-2xl shadow-2xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150"
          onMouseLeave={() => setHoveredLimit(null)}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Pilih Batas Materi ON</span>
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-900 font-mono text-[10px] border border-indigo-200">
                  {previewLimit === 0
                    ? 'Semua OFF'
                    : previewLimit >= totalCount
                      ? `ON 1–${totalCount}`
                      : `ON 1–${previewLimit} · OFF ${previewLimit + 1}+`}
                </span>
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Klik pekan batas akhir; Pekan 1 s/d pekan terpilih otomatis <strong>ON</strong> dan sisanya <strong>OFF</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setHoveredLimit(null);
              }}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              title="Tutup"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4-Column Pekan Visual Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-[260px] overflow-y-auto pr-0.5">
            {pekans.map((p) => {
              const isSelectedExact = p.pekanNumber === currentLimit;
              const isInPreviewRange = p.pekanNumber <= previewLimit;

              return (
                <button
                  key={`limit-grid-p${p.pekanNumber}`}
                  type="button"
                  onMouseEnter={() => setHoveredLimit(p.pekanNumber)}
                  onClick={() => {
                    onSelectLimit(p.pekanNumber);
                    setIsOpen(false);
                    setHoveredLimit(null);
                  }}
                  title={`Buka Pekan 1 s/d Pekan ${p.pekanNumber} (${p.title})`}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                    isSelectedExact
                      ? 'bg-emerald-900 text-white border-emerald-950 shadow-xs ring-2 ring-emerald-500/30'
                      : isInPreviewRange
                        ? 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-slate-50/70 text-slate-600 border-slate-200 hover:bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono font-bold text-[11px]">
                      P{p.pekanNumber}
                    </span>
                    {isSelectedExact ? (
                      <Check className="w-3 h-3 text-emerald-300 shrink-0" />
                    ) : (
                      <span
                        className={`text-[9px] font-mono font-bold px-1 rounded ${
                          isInPreviewRange
                            ? 'bg-emerald-200/80 text-emerald-900'
                            : 'bg-slate-200/70 text-slate-500'
                        }`}
                      >
                        {isInPreviewRange ? 'ON' : 'OFF'}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] leading-tight line-clamp-1 ${
                      isSelectedExact ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    {p.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Presets Footer */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
            <button
              type="button"
              onMouseEnter={() => setHoveredLimit(0)}
              onClick={() => {
                onSelectLimit(0);
                setIsOpen(false);
                setHoveredLimit(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                currentLimit === 0
                  ? 'bg-rose-700 text-white border-rose-800'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
              }`}
            >
              Semua OFF (0/{totalCount})
            </button>

            <div className="flex items-center gap-1.5">
              {totalCount >= 1 && (
                <button
                  type="button"
                  onMouseEnter={() => setHoveredLimit(1)}
                  onClick={() => {
                    onSelectLimit(1);
                    setIsOpen(false);
                    setHoveredLimit(null);
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
                >
                  Hanya P1
                </button>
              )}
              <button
                type="button"
                onMouseEnter={() => setHoveredLimit(totalCount)}
                onClick={() => {
                  onSelectLimit(totalCount);
                  setIsOpen(false);
                  setHoveredLimit(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                  currentLimit >= totalCount
                    ? 'bg-emerald-900 text-white border-emerald-950'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
              >
                Semua ON (1–{totalCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
