import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('BAG_currentUser');
      localStorage.removeItem('BAG_activeMenu');
    } catch (e) {
      console.warn(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-slate-800">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tampilan Mengalami Kendala</h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Terjadi kesalahan saat memuat komponen antarmuka. Silakan muat ulang halaman untuk memulihkan sesi kerja Anda.
              </p>
              {this.state.error && (
                <div className="mt-3 p-2.5 rounded-lg bg-slate-100 text-left font-mono text-[11px] text-rose-700 overflow-x-auto max-h-24">
                  {this.state.error.message || String(this.state.error)}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Muat Ulang Aplikasi</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
