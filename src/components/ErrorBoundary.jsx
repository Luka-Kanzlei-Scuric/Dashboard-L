import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-semibold text-red-600 mb-4">
              Es ist ein Fehler aufgetreten
            </h2>
            <p className="text-gray-700 mb-4">
              Bitte laden Sie die Seite neu oder kontaktieren Sie den Support, wenn das Problem weiterhin besteht.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-zinc-800 text-white rounded-md hover:bg-zinc-700 transition-colors"
            >
              Seite neu laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;