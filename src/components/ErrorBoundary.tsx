import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[CRITICAL] Uncaught UI error:", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-screen bg-[#02080b] flex items-center justify-center p-4 text-white font-sans">
          <div className="max-w-md w-full p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 backdrop-blur-xl shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-wide">Assistant Interface Recovered</h2>
              <p className="text-xs text-neutral-400">
                An unexpected interface issue occurred. Tap below to reload the session.
              </p>
            </div>
            {this.state.error && (
              <pre className="p-3 rounded-lg bg-black/50 text-[11px] text-amber-300/80 font-mono text-left overflow-auto max-h-24 scrollbar-hide border border-white/5">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <RefreshCw size={16} />
              Reload Assistant
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
