import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="card max-w-lg text-center">
            <h1 className="mb-2 text-lg font-semibold text-red-600">
              Ocurrió un error inesperado
            </h1>
            <p className="text-sm text-slate-600">{this.state.error.message}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
