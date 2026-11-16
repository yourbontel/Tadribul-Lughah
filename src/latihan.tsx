import { StrictMode, Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import LatihanApp from './LatihanApp.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LatihanErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Latihan App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <h2 className="text-base font-bold text-slate-900">
              Gagal Memuat Halaman Latihan
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {this.state.error?.message || 'Terjadi kesalahan saat memuat data latihan.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <a
                href="./materi.html"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-lg text-slate-700"
              >
                ← Kembali ke Materi
              </a>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-xs font-semibold rounded-lg text-white"
              >
                Muat Ulang Halaman
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('latihan-root')!).render(
  <StrictMode>
    <LatihanErrorBoundary>
      <LatihanApp />
    </LatihanErrorBoundary>
  </StrictMode>,
);
