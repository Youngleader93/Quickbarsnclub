/**
 * Configuration Sentry pour QuickBar
 *
 * Pour activer Sentry:
 * 1. npm install @sentry/react
 * 2. Créer un compte sur https://sentry.io
 * 3. Créer un nouveau projet React
 * 4. Copier le DSN et l'ajouter dans .env:
 *    REACT_APP_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
 */

// Variable globale pour stocker Sentry
let SentryModule = null;

// Configuration Sentry (charge dynamiquement si disponible)
export const initSentry = async () => {
  const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;

  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN non configuré - monitoring désactivé');
    console.log('[Sentry] Pour activer: npm install @sentry/react puis ajouter REACT_APP_SENTRY_DSN dans .env');
    return;
  }

  try {
    // Essayer d'importer Sentry dynamiquement
    SentryModule = await import('@sentry/react');

    SentryModule.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.REACT_APP_VERSION || '1.0.0',

      // Échantillonnage des transactions (performance)
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Ne pas envoyer les erreurs en développement local
      enabled: process.env.NODE_ENV === 'production',

      // Filtrer les erreurs non pertinentes
      beforeSend(event, hint) {
        const error = hint.originalException;

        // Ignorer les erreurs réseau Firebase (connexion instable)
        if (error && error.message) {
          const ignoredErrors = [
            'Failed to fetch',
            'Network request failed',
            'Load failed',
            'NetworkError',
            'PERMISSION_DENIED',
            'quota-exceeded'
          ];

          if (ignoredErrors.some(msg => error.message.includes(msg))) {
            return null;
          }
        }

        return event;
      }
    });

    // Exposer Sentry globalement pour ErrorBoundary
    window.Sentry = SentryModule;

    console.log('[Sentry] Initialisé avec succès');
  } catch (error) {
    // Sentry n'est pas installé - ce n'est pas grave
    console.log('[Sentry] Package non installé - monitoring désactivé');
    console.log('[Sentry] Pour activer: npm install @sentry/react');
  }
};

// Fonction pour capturer manuellement une erreur
export const captureError = (error, context = {}) => {
  console.error('[Error]', error);

  if (window.Sentry) {
    window.Sentry.captureException(error, {
      extra: context
    });
  }
};

// Fonction pour capturer un message
export const captureMessage = (message, level = 'info') => {
  console.log(`[${level}]`, message);

  if (window.Sentry) {
    window.Sentry.captureMessage(message, level);
  }
};

// Fonction pour définir l'utilisateur courant
export const setUser = (user) => {
  if (window.Sentry && user) {
    window.Sentry.setUser({
      id: user.uid,
      email: user.email
    });
  }
};

// Fonction pour effacer l'utilisateur (logout)
export const clearUser = () => {
  if (window.Sentry) {
    window.Sentry.setUser(null);
  }
};

export default {
  initSentry,
  captureError,
  captureMessage,
  setUser,
  clearUser
};
