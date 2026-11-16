import React, { useEffect } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  ShieldCheck,
  X
} from 'lucide-react';
import {
  ClassSchedule,
  ProgramTrack,
  formatIDR,
  formatWhatsAppNumber
} from '../data/arabicAcademyData';

export interface PendingEnrollmentConfirmation {
  program: ProgramTrack;
  schedule: ClassSchedule;
  angkatan: string;
  learningGoal?: string;
  isReEnrollment?: boolean;
}

interface EnrollmentConfirmModalProps {
  pending: PendingEnrollmentConfirmation | null;
  studentName: string;
  studentEmail: string;
  studentWhatsapp: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const EnrollmentConfirmModal: React.FC<EnrollmentConfirmModalProps> = ({
  pending,
  studentName,
  studentEmail,
  studentWhatsapp,
  isSubmitting = false,
  onCancel,
  onConfirm
}) => {
  useEffect(() => {
    if (!pending) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pending, isSubmitting, onCancel]);

  if (!pending) return null;

  const { program, schedule, angkatan, learningGoal, isReEnrollment } = pending;
  const formattedWa = formatWhatsAppNumber(studentWhatsapp) || studentWhatsapp;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="enrollment-verify-title"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <div className="bg-white border border-emerald-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 to-emerald-900 text-white border-b border-emerald-800 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800/80 border border-emerald-500/40 text-emerald-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
              {isReEnrollment
                ? 'VERIFIKASI DAFTAR ULANG PROGRAM'
                : 'VERIFIKASI PENDAFTARAN PROGRAM'}
            </span>
            <h3
              id="enrollment-verify-title"
              className="text-base font-bold text-white mt-0.5"
            >
              Pastikan pilihan kelas Anda sudah benar
            </h3>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="p-1 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Tutup & Periksa Kembali"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-500 shrink-0">Nama Peserta</span>
              <span className="font-bold text-slate-900 text-right">{studentName}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-500 shrink-0">Email / WhatsApp</span>
              <span className="font-mono text-slate-800 text-right break-all">
                {studentEmail} · {formattedWa}
              </span>
            </div>

            <div className="border-t border-slate-200 pt-2.5 flex items-start justify-between gap-3">
              <span className="text-slate-500 shrink-0">Program / Level</span>
              <span className="font-bold text-slate-900 text-right">{program.title}</span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 shrink-0">Angkatan</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-950 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-800" />
                <span>{angkatan}</span>
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <span className="text-slate-500 shrink-0">Jadwal Kelas</span>
              <span className="font-medium text-slate-900 text-right inline-flex items-center gap-1 justify-end">
                <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>
                  {schedule.batchCode} · Hari {schedule.days} ({schedule.timeWIB})
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-500 shrink-0">Mulai Program</span>
              <span className="font-mono font-semibold text-emerald-900 inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>{schedule.startDate || program.startDate}</span>
              </span>
            </div>

            {learningGoal?.trim() && (
              <div className="flex items-start justify-between gap-3">
                <span className="text-slate-500 shrink-0">Target Belajar</span>
                <span className="text-slate-800 italic text-right">
                  "{learningGoal.trim()}"
                </span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-2.5 flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-900">Biaya Pendidikan</span>
              <div className="text-right">
                <span className="font-mono font-bold text-emerald-900 text-sm">
                  {formatIDR(program.tuitionIDR)}
                </span>
                <span className="block text-[11px] font-mono text-slate-500">
                  Cicilan 6x: {formatIDR(Math.round(program.tuitionIDR / 6))}/bln
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-950 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Periksa kembali <strong>Level</strong> dan <strong>Angkatan ({angkatan})</strong> pilihan Anda. Setiap akun hanya dapat mendaftar 1 kali per level pada angkatan yang sama.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Periksa Kembali
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isSubmitting
                ? 'Memproses Pendaftaran...'
                : isReEnrollment
                  ? `Ya, Konfirmasi Daftar Ulang (${angkatan})`
                  : `Ya, Konfirmasi Pendaftaran (${angkatan})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
