import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import MenuManager from './MenuManager';
import QRCodeGenerator from './QRCodeGenerator';
import Settings from './Settings';

const ClubAdminInterface = ({ clubId }) => {
  const { user, logout } = useAuth();
  const { canAccessClub, isSuperAdmin, userRole, loading } = useRole();
  const [activeTab, setActiveTab] = useState('menu');

  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vous déconnecter ?')) {
      const result = await logout();
      if (result.success) {
        // Rediriger vers login avec returnUrl pour revenir à ce club
        const returnUrl = `/${clubId}/admin`;
        window.location.href = `/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`;
      } else {
        alert('Erreur lors de la déconnexion');
      }
    }
  };

  // IMPORTANT : Attendre que le chargement soit terminé ET que les données soient chargées
  // Ne pas afficher "Accès Refusé" si on est encore en train de charger
  if (loading || (user && userRole === null)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Chargement des permissions...
        </div>
      </div>
    );
  }

  if (!canAccessClub(clubId)) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-red-500"></div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-red-500 tracking-tight">
            Accès Refusé
          </h1>
          <p className="text-base sm:text-lg text-gray-400 mb-3 sm:mb-4">
            Vous n'avez pas les permissions pour accéder à l'administration de <strong className="text-white">{clubId}</strong>.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 truncate">
            Connecté en tant que : {user?.email}
          </p>
          <div className="flex flex-col gap-3">
            {isSuperAdmin() && (
              <a
                href="/admin"
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black shadow-lg shadow-green-500/30"
              >
                Retour Dashboard
              </a>
            )}
            <button
              onClick={handleLogout}
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold text-base sm:text-lg transition-all"
            >
              Se déconnecter
            </button>
            <a
              href={`/${clubId}`}
              className="text-gray-500 hover:text-gray-300 text-xs sm:text-sm mt-2 sm:mt-4 transition-colors"
            >
              Retour au menu client
            </a>
          </div>
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
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 tracking-tight" style={{ color: '#00FF41' }}>
                Admin - {clubId}
              </h1>
              <p className="text-sm text-gray-500">
                {user?.email} {isSuperAdmin() && <span className="text-yellow-400">• Super Admin</span>}
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              {isSuperAdmin() && (
                <a
                  href="/admin"
                  className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all text-sm sm:text-base"
                >
                  Super Admin
                </a>
              )}
              <button
                onClick={handleLogout}
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-500/20 text-sm sm:text-base"
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* NAVIGATION */}
          <div className="flex gap-2 flex-wrap overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold transition-all text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'menu'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                  : 'hover:bg-gray-800/50 text-gray-300 hover:text-white font-medium'
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setActiveTab('qrcodes')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold transition-all text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'qrcodes'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                  : 'hover:bg-gray-800/50 text-gray-300 hover:text-white font-medium'
              }`}
            >
              QR Codes
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold transition-all text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                  : 'hover:bg-gray-800/50 text-gray-300 hover:text-white font-medium'
              }`}
            >
              Paramètres
            </button>
            <a
              href={`/${clubId}/tablette`}
              className="px-4 sm:px-5 py-2 sm:py-2.5 hover:bg-gray-800/50 text-gray-300 hover:text-white rounded-xl font-medium transition-all text-sm sm:text-base whitespace-nowrap"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tablette
            </a>
            <a
              href={`/${clubId}`}
              className="px-4 sm:px-5 py-2 sm:py-2.5 hover:bg-gray-800/50 text-gray-300 hover:text-white rounded-xl font-medium transition-all text-sm sm:text-base whitespace-nowrap"
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
        {activeTab === 'settings' && <Settings etablissementId={clubId} />}
      </div>
    </div>
  );
};

export default ClubAdminInterface;
