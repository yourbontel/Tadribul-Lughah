import React, { useState, useEffect } from 'react';
import { Headphones, Volume2, ExternalLink, Clock, Play } from 'lucide-react';
import {
  WeeklyAudioItem,
  getGoogleDriveAudioInfo
} from '../data/moduleContentData';

interface GoogleDriveAudioPlayerProps {
  items: WeeklyAudioItem[];
  pekanNumber?: number;
  compact?: boolean;
  emptyMessage?: string;
}

export const GoogleDriveAudioPlayer: React.FC<GoogleDriveAudioPlayerProps> = ({
  items,
  pekanNumber,
  compact = false,
  emptyMessage
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [pekanNumber, items.length]);

  if (!items || items.length === 0) {
    return (
      <div className="p-5 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-1.5">
        <Headphones className="w-6 h-6 text-slate-400 mx-auto" />
        <p className="text-xs font-semibold text-slate-700">
          {emptyMessage ||
            `Belum ada rekaman audio Google Drive untuk ${
              pekanNumber ? `Pekan ${pekanNumber}` : 'materi ini'
            }.`}
        </p>
        <p className="text-[11px] text-slate-500">
          Superadmin dapat menambahkan tautan audio Google Drive melalui panel Edit Materi &rarr; Audio Mendengar.
        </p>
      </div>
    );
  }

  const safeIndex = selectedIndex < items.length ? selectedIndex : 0;
  const activeItem = items[safeIndex];
  const audioInfo = getGoogleDriveAudioInfo(activeItem.driveUrl);

  return (
    <div className="space-y-3.5">
      {items.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => {
            const isActive = idx === safeIndex;
            return (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isActive
                    ? 'bg-emerald-900 text-white border-emerald-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/60'
                }`}
              >
                <Play className="w-3 h-3 shrink-0" />
                <span>
                  {idx + 1}. {item.title}
                </span>
                {item.duration && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.duration}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div
        className={`rounded-xl border border-emerald-200 bg-white overflow-hidden shadow-sm ${
          compact ? 'p-3.5' : 'p-4 sm:p-5'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
          <div className="space-y-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                <Volume2 className="w-3 h-3" />
                <span>
                  {audioInfo.isGoogleDrive ? 'Audio Google Drive' : 'Audio Langsung'}
                </span>
              </span>
              {activeItem.duration && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{activeItem.duration}</span>
                </span>
              )}
            </div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate">
              {activeItem.title}
            </h4>
            {activeItem.arabicTitle && (
              <p dir="rtl" className="font-arabic text-base font-bold text-emerald-900">
                {activeItem.arabicTitle}
              </p>
            )}
          </div>

          {audioInfo.viewUrl && (
            <a
              href={audioInfo.viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shrink-0"
            >
              <span>Buka di Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="mt-3">
          {audioInfo.isGoogleDrive && audioInfo.previewUrl ? (
            <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-950">
              <iframe
                key={audioInfo.previewUrl}
                src={audioInfo.previewUrl}
                title={activeItem.title}
                className="w-full h-[120px] sm:h-[135px] border-0"
                allow="autoplay"
              />
            </div>
          ) : audioInfo.directUrl ? (
            <audio
              key={audioInfo.directUrl}
              controls
              preload="metadata"
              className="w-full"
              src={audioInfo.directUrl}
            >
              Browser Anda tidak mendukung pemutar audio HTML5.
            </audio>
          ) : (
            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              Format tautan audio belum valid. Pastikan link Google Drive berformat seperti{' '}
              <code className="font-mono">https://drive.google.com/file/d/FILE_ID/view</code>.
            </p>
          )}
        </div>

        {activeItem.notes && (
          <p className="mt-2.5 text-xs text-slate-600 bg-[#FBF9F5] border border-slate-200 rounded-lg px-3 py-2">
            <strong className="text-emerald-900">Catatan Asatidz:</strong> {activeItem.notes}
          </p>
        )}
      </div>
    </div>
  );
};
