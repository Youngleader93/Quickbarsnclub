import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const { login, error: authError, setError } = useAuth();

  // Récupérer le returnUrl depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const returnUrl = urlParams.get('returnUrl');

  // Nettoyer les erreurs au montage du composant
  useEffect(() => {
    setError('');
    setLocalError('');
  }, [setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation basique
    if (!email || !password) {
      setLocalError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    setLocalError('');

    const result = await login(email, password);

    if (result.success) {
      // Si returnUrl existe, rediriger vers cette URL
      if (returnUrl) {
        window.location.href = returnUrl;
      } else if (onLoginSuccess) {
        // Sinon, utiliser le callback par défaut
        onLoginSuccess();
      }
    } else {
      setLocalError(result.error);
    }

    setIsLoading(false);
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 tracking-tight" style={{ color: '#00FF41' }}>
            QuickBar Admin
          </h1>
          <p className="text-gray-500 text-sm">Connexion administrateur</p>
          {returnUrl && (
            <div className="mt-6 p-4 bg-green-500/5 backdrop-blur-sm rounded-xl">
              <div className="text-xs text-gray-500 mb-2">Redirection après connexion</div>
              <div className="text-sm font-medium" style={{ color: '#00FF41' }}>
                {returnUrl}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-3 text-gray-300"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={20} className="text-gray-600" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50"
                placeholder="admin@quickbar.com"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-3 text-gray-300"
            >
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={20} className="text-gray-600" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          {displayError && (
            <div className="p-4 bg-red-500/10 backdrop-blur-sm rounded-xl flex items-center gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400">
                {displayError}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 rounded-xl font-semibold text-lg transition-all duration-200 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <p className="text-sm text-gray-500">
            Vous n'avez pas encore de compte ?{' '}
            <a href="/register" className="text-green-500 hover:text-green-400 font-medium transition-colors">
              Créer un établissement
            </a>
          </p>
          <p className="text-xs text-gray-600">
            Accès réservé aux administrateurs
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;