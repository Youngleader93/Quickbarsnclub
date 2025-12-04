import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { initSentry } from './utils/sentry';

// Initialiser Sentry pour le monitoring des erreurs
initSentry();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mesure des performances (optionnel: envoyer à Sentry)
reportWebVitals((metric) => {
  // Log en dev
  if (process.env.NODE_ENV === 'development') {
    console.log('[WebVitals]', metric.name, metric.value);
  }

  // Envoyer à Sentry en prod si configuré
  if (window.Sentry && process.env.NODE_ENV === 'production') {
    window.Sentry.captureMessage(`WebVital: ${metric.name}`, {
      level: 'info',
      extra: {
        name: metric.name,
        value: metric.value,
        rating: metric.rating
      }
    });
  }
});
