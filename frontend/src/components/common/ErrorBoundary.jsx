import React from "react";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, remountKey: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an unhandled rendering error:", error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && this.props.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, idx) => key !== prevProps.resetKeys?.[idx]
      );
      if (hasChanged) {
        this.setState((prev) => ({
          hasError: false,
          error: null,
          errorInfo: null,
          remountKey: prev.remountKey + 1,
        }));
      }
    }
  }

  handleReset = () => {
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (err) {
        console.error("Error in ErrorBoundary onReset:", err);
      }
    }
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      remountKey: prev.remountKey + 1,
    }));
  };

  handleReloadPage = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { title = "Phân hệ này" } = this.props;
      const isDev = Boolean(import.meta.env?.DEV);

      return (
        <div className="min-h-[320px] w-full p-6 flex items-center justify-center">
          <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/50 p-6 shadow-lg shadow-red-500/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Đã xảy ra lỗi hiển thị
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {title} gặp sự cố ngoài dự kiến trong quá trình xử lý giao diện.
                </p>
              </div>
            </div>

            {isDev && this.state.error && (
              <div className="mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left overflow-x-auto text-[11px] font-mono text-red-600 dark:text-red-400 max-h-36">
                <div className="font-semibold mb-1">{String(this.state.error)}</div>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-slate-500 whitespace-pre-wrap leading-tight">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tải lại giao diện</span>
              </button>
              <button
                type="button"
                onClick={this.handleReloadPage}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tải lại trang</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <React.Fragment key={this.state.remountKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
