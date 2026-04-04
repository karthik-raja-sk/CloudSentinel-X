import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-white rounded-2xl shadow-sm border border-red-100 text-center">
          <div className="p-4 bg-red-50 rounded-full mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto font-medium">
            The page encountered a runtime error. This has been contained to prevent the entire app from crashing.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-8 text-left w-full max-w-lg border border-gray-200">
             <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-widest">Error Details</p>
             <code className="text-xs text-red-600 break-all">{this.state.error?.message || "Unknown Runtime Error"}</code>
          </div>

          <button
            onClick={this.handleReset}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-all"
          >
            <RefreshCcw className="w-5 h-5 mr-2" />
            Reload & Reset Workspace
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
