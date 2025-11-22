import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import MenuManager from './MenuManager';
import QRCodeGenerator from './QRCodeGenerator';
import OrderHistory from './OrderHistory';
import Settings from './Settings';

const ClubAdminInterface = ({ clubId }) => {
  const { user, logout, isLoggingOut } = useAuth();
  const { canAccessAdmin, isSuperAdmin, isServeur, userRole, displayName, isInitialized, clubAccess } = useRole();
  // Initialiser avec null, puis définir selon le rôle dans useEffect
  const [activeTab, setActiveTab] = useState(null);

  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vous déconnecter ?')) {
      // Marquer la déconnexion dans sessionStorage
      sessionStorage.setItem('isLoggingOut', 'true');

      // MASQUER TOUT AVEC CSS !important - Impossible de contourner
      const style = document.createElement('style');
      style.id = 'logout-hide';
      style.textContent = '* { display: none !important; } body::after { content: "Déconnexion..."; display: block !important; color: #00FF41; font-family: monospace; font-size: 20px; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); }';
      document.head.appendChild(style);

      // Déconnexion puis redirection immédiate
      try {
        await logout();
      } catch (e) {
        // Ignorer les erreurs, rediriger quand même
      }
      window.location.replace('/admin/login');
    }
  };

  // Définir l'onglet par défaut une fois le rôle chargé
  React.useEffect(() => {
    if (isInitialized && activeTab === null) {
      // Tout le monde commence sur Menu
      setActiveTab('menu');
    }
  }, [isInitialized, activeTab]);

  // ⚠️ VÉRIFICATION CRITIQUE - Empêche le flash pendant la déconnexion
  if (typeof window !== 'undefined' && sessionStorage.getItem('isLoggingOut') === 'true') {
    return null; // Ne rien rendre du tout
  }

  // Attendre que tout soit initialisé ET que l'onglet par défaut soit défini
  // Note: isLoggingOut est géré globalement dans App.js
  if (!isInitialized || activeTab === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Chargement...
        </div>
      </div>
    );
  }

  // Redirection spéciale pour les serveurs - rediriger directement vers la tablette
  if (isServeur(clubId)) {
    window.location.href = `/${clubId}/tablette`;
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Chargement...
        </div>
      </div>
    );
  }

  if (!canAccessAdmin(clubId)) {
    // Redirection immédiate sans afficher "Accès Refusé"
    window.location.href = '/admin/login';
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* HEADER */}
      <div className="bg-black/95 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 tracking-tight text-white">
                {displayName || user?.email || 'Admin'}
              </h1>
              <p className="text-sm text-gray-500">
                Club Admin
                {isSuperAdmin() && <span className="text-yellow-400"> • Super Admin</span>}
              </p>
            </div>
            <div className="flex gap-3 sm:gap-3 flex-wrap">
              {isSuperAdmin() && (
                <a
                  href="/admin"
                  className="px-5 sm:px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all text-sm sm:text-base min-h-[44px] flex items-center"
                >
                  Super Admin
                </a>
              )}
              <button
                onClick={handleLogout}
                className="px-5 sm:px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-500/20 text-sm sm:text-base min-h-[44px]"
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="flex gap-3 sm:gap-4 flex-wrap overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-5 sm:px-5 py-3 rounded-xl font-semibold transition-all text-sm sm:text-base whitespace-nowrap min-h-[44px] ${
                activeTab === 'menu'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                  : 'hover:bg-gray-800/50 text-gray-300 hover:text-white font-medium'
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setActiveTab('qrcodes')}
              className={`px-5 sm:px-5 py-3 rounded-xl font-semibold transition-all text-sm sm:text-base whitespace-nowrap min-h-[44px] ${
                activeTab === 'qrcodes'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                  : 'hover:bg-gray-800/50 text-gray-300 hover:text-white font-medium'
              }`}
            >
              QR Codes
            </button>
            <button
              onClick={() => setActiveTab('historique')}
              className={`px-5 sm:px-5 py-3 rounded-xl font-semibold transition-all text-sm sm:text-base whitespace-nowrap min-h-[44px] ${
                activeTab === 'historique'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                  : 'hover:bg-gray-800/50 text-gray-300 hover:text-white font-medium'
              }`}
            >
              Historique
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-5 sm:px-5 py-3 rounded-xl font-semibold transition-all text-sm sm:text-base whitespace-nowrap min-h-[44px] ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                  : 'hover:bg-gray-800/50 text-gray-300 hover:text-white font-medium'
              }`}
            >
              Paramètres
            </button>
            <a
              href={`/${clubId}/tablette`}
              className="px-5 sm:px-5 py-3 hover:bg-gray-800/50 text-gray-300 hover:text-white rounded-xl font-medium transition-all text-sm sm:text-base whitespace-nowrap min-h-[44px] flex items-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tablette
            </a>
            <a
              href={`/${clubId}`}
              className="px-5 sm:px-5 py-3 hover:bg-gray-800/50 text-gray-300 hover:text-white rounded-xl font-medium transition-all text-sm sm:text-base whitespace-nowrap min-h-[44px] flex items-center"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vue Client
            </a>
          </div>
        </div>
      </div>

      {/* CONTENU */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {activeTab === 'menu' && <MenuManager etablissementId={clubId} />}
        {activeTab === 'qrcodes' && <QRCodeGenerator etablissementId={clubId} />}
        {activeTab === 'historique' && <OrderHistory etablissementId={clubId} />}
        {activeTab === 'settings' && <Settings etablissementId={clubId} />}
      </div>
    </div>
  );
};

export default ClubAdminInterface;
