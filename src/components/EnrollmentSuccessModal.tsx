import React, { useEffect } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  X
} from 'lucide-react';

export interface EnrollmentSuccessInfo {
  registrationNumber: string;
  programTitle: string;
  angkatan: string;
  scheduleSummary?: string;
  days?: string;
  timeWIB?: string;
  isReEnrollment?: boolean;
}

interface EnrollmentSuccessModalProps {
  success: EnrollmentSuccessInfo | null;
  studentName: string;
  portalHref?: string;
  primaryButtonLabel?: string;
  onClose: () => void;
}

export const EnrollmentSuccessModal: React.FC<EnrollmentSuccessModalProps> = ({
  success,
  studentName,
  portalHref,
  primaryButtonLabel = 'Tutup & Lanjutkan',
  onClose
}) => {
  useEffect(() => {
    if (!success) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [success, onClose]);

  if (!success) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enrollment-success-title"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white border border-emerald-200 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white relative text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-800/80 border border-emerald-500/40 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-200 mb-2">
            <Sparkles className="w-3 h-3" />
            <span>
              {success.isReEnrollment
                ? 'Daftar Ulang Berhasil'
                : 'Pendaftaran Berhasil'}
            </span>
          </div>

          <h3
            id="enrollment-success-title"
            className="text-lg font-bold text-white"
          >
            Alhamdulillah, Pendaftaran Berhasil!
          </h3>
          <p className="text-xs text-emerald-100/90 mt-1">
            Selamat bergabung, <strong>{studentName}</strong>. Akun Anda telah terdaftar pada level pembelajaran pilihan Anda.
          </p>
        </div>

        {/* Details */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Nomor Registrasi</span>
              <span className="font-mono font-bold text-emerald-900 bg-white px-2.5 py-0.5 rounded border border-emerald-200">
                {success.registrationNumber}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3 pt-2 border-t border-emerald-200/70">
              <span className="text-slate-500 shrink-0">Level Program</span>
              <span className="font-bold text-slate-900 text-right">
                {success.programTitle}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500">Angkatan</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-900">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                <span>{success.angkatan}</span>
              </span>
            </div>

            {(success.days || success.timeWIB) && (
              <div className="flex items-start justify-between gap-3 pt-2 border-t border-emerald-200/70">
                <span className="text-slate-500 shrink-0">Jadwal Kelas</span>
                <div className="text-right space-y-0.5">
                  {success.days && (
                    <div className="inline-flex items-center justify-end gap-1 font-medium text-slate-800">
                      <Calendar className="w-3 h-3 text-emerald-700" />
                      <span>{success.days}</span>
                    </div>
                  )}
                  {success.timeWIB && (
                    <div className="flex items-center justify-end gap-1 font-mono text-[11px] text-slate-600">
                      <Clock className="w-3 h-3 text-emerald-700" />
                      <span>{success.timeWIB}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
            {portalHref && (
              <a
                href={portalHref}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
              >
                <span>Buka Portal Pelajar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`w-full ${
                portalHref ? 'sm:w-auto px-4' : 'flex-1 px-4'
              } py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                portalHref
                  ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                  : 'text-white bg-emerald-900 hover:bg-emerald-800 shadow-xs'
              }`}
            >
              {primaryButtonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
