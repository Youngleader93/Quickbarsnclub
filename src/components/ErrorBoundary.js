import React from 'react';

/**
 * Error Boundary Component
 * Capture les erreurs React et affiche une interface de fallback
 * au lieu d'un écran blanc
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Mettre à jour l'état pour afficher l'UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logger l'erreur
    console.error('🔴 ErrorBoundary - Erreur capturée:', error);
    console.error('🔴 ErrorBoundary - Info:', errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Envoyer à Sentry si disponible
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack
        }
      });
    }

    // Stocker l'erreur pour debug
    try {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      localStorage.setItem('quickbar_last_error', JSON.stringify(errorLog));
    } catch (e) {
      // Ignorer les erreurs de stockage
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleClearAndRefresh = () => {
    // Nettoyer les données potentiellement corrompues
    try {
      sessionStorage.clear();
      // Ne pas effacer tout localStorage, juste les données de session
      localStorage.removeItem('quickbar_order_state');
    } catch (e) {
      // Ignorer
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Interface de fallback
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center">
            {/* Icône d'erreur */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Oups ! Une erreur s'est produite
            </h1>

            <p className="text-gray-400 mb-6 text-sm sm:text-base">
              L'application a rencontré un problème inattendu.
              Pas de panique, vos données sont en sécurité.
            </p>

            {/* Boutons d'action */}
            <div className="space-y-3">
              <button
                onClick={this.handleRefresh}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30"
              >
                Rafraîchir la page
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all"
              >
                Retour à l'accueil
              </button>

              <button
                onClick={this.handleClearAndRefresh}
                className="w-full px-6 py-3 bg-transparent hover:bg-gray-800 text-gray-400 rounded-xl font-medium transition-all text-sm"
              >
                Réinitialiser et rafraîchir
              </button>
            </div>

            {/* Détails de l'erreur (dev mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                  Détails techniques (développement)
                </summary>
                <div className="mt-2 p-3 bg-gray-800 rounded-lg overflow-auto max-h-40">
                  <pre className="text-xs text-red-400 whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
