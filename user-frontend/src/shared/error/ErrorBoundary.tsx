import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorView } from "./ErrorView";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // اینجا بعداً Sentry.captureException(error, { extra: info }) وصل میشه
    console.error("[ErrorBoundary]", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorView
            title="مشکلی پیش آمد"
            description="بخشی از صفحه با خطا مواجه شد. لطفاً دوباره تلاش کنید."
            retry={this.handleRetry}
          />
        )
      );
    }

    return this.props.children;
  }
}