import React, { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  studentName?: string;
  isLoading?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  studentName,
  isLoading = false,
  title = 'Apakah Anda Yakin Ingin Keluar?',
  description,
  confirmLabel = 'Ya, Keluar',
  onCancel,
  onConfirm
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  const resolvedDescription =
    description ||
    (studentName
      ? `Anda akan keluar dari akun pelajar atas nama ${studentName}. Untuk mengakses kembali portal atau pendaftaran, Anda perlu masuk ulang.`
      : 'Anda akan keluar dari akun pelajar. Untuk mengakses kembali portal atau pendaftaran, Anda perlu masuk ulang.');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3
            id="logout-confirm-title"
            className="mt-4 text-base sm:text-lg font-bold text-slate-900"
          >
            {title}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
            {resolvedDescription}
          </p>
        </div>

        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-60"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Sedang keluar...' : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
