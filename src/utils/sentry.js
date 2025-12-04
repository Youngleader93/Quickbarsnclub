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

// Configuration Sentry (stub - activer quand @sentry/react est installé)
export const initSentry = async () => {
  const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN;

  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN non configuré - monitoring désactivé');
    return;
  }

  // Pour activer Sentry:
  // 1. npm install @sentry/react
  // 2. Décommenter le code ci-dessous
  console.log('[Sentry] Package non installé - monitoring désactivé');
  console.log('[Sentry] Pour activer: npm install @sentry/react');

  /*
  // Code à décommenter après installation de @sentry/react:
  try {
    const Sentry = await import('@sentry/react');

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.REACT_APP_VERSION || '1.0.0',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      enabled: process.env.NODE_ENV === 'production',
    });

    window.Sentry = Sentry;
    console.log('[Sentry] Initialisé avec succès');
  } catch (error) {
    console.log('[Sentry] Erreur initialisation:', error);
  }
  */
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
