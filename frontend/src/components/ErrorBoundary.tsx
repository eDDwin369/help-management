/**
 * React error boundary.
 *
 * Catches render-time errors anywhere below it in the tree, logs to
 * Sentry, and renders a graceful fallback. Async/effect errors are
 * NOT caught by error boundaries — those are reported by the axios
 * interceptor and by Sentry's global handlers.
 *
 * Wrapped at the app root so any uncaught render error degrades into
 * a friendly screen rather than a white page.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Sentry } from '../config/sentry';
import { Button } from './Button';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack },
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="error-boundary" role="alert">
        <div className="error-boundary__card">
          <h2>Something went wrong</h2>
          <p>The error has been reported. Try reloading or going back.</p>
          <div className="error-boundary__actions">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Reload
            </Button>
            <Button variant="secondary" onClick={this.handleReset}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
