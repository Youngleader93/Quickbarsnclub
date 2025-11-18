import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import PendingClubRequests from './PendingClubRequests';

const SuperAdminInterface = () => {
  const { user, logout } = useAuth();
  const { isSuperAdmin, userRole, displayName, loading: roleLoading, reloadRole } = useRole();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalClubs: 0,
    activeClubs: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const q = query(collection(db, 'etablissements'), orderBy('nom'));
      const snapshot = await getDocs(q);

      const clubsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setClubs(clubsData);

      // Calculer stats basiques
      setStats({
        totalClubs: clubsData.length,
        activeClubs: clubsData.filter(c => c.actif).length,
        totalRevenue: 0 // TODO: Phase 4
      });
    } catch (error) {
      console.error('Erreur chargement clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vous déconnecter ?')) {
      const result = await logout();
      if (result.success) {
        window.location.href = '/admin/login';
      } else {
        alert('Erreur lors de la déconnexion');
      }
    }
  };

  // Vérification permissions
  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Chargement...
        </div>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-red-500"></div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-red-500 tracking-tight">
            Accès Refusé
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mb-2">
            Vous devez être Super Admin pour accéder à cette page.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mb-1 truncate">Rôle actuel : {userRole || 'aucun'}</p>
          <p className="text-xs text-gray-600 mb-6 sm:mb-8 truncate">UID : {user?.uid}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={reloadRole}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 text-sm sm:text-base"
            >
              Recharger les permissions
            </button>
            <button
              onClick={async () => {
                await logout();
                window.location.href = '/admin/login';
              }}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30 text-sm sm:text-base"
            >
              Se déconnecter
            </button>
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 tracking-tight truncate" style={{ color: '#00FF41' }}>
                Super Admin Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                {displayName} • {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-5 sm:px-6 py-3 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-500/20 text-sm sm:text-base whitespace-nowrap min-h-[44px]"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="bg-gray-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-5 sm:px-6 py-3 rounded-xl font-semibold whitespace-nowrap text-sm sm:text-base min-h-[44px] flex items-center transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                  : 'hover:bg-gray-800/50 text-gray-300 hover:text-white font-medium'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-5 sm:px-6 py-3 rounded-xl font-semibold whitespace-nowrap text-sm sm:text-base min-h-[44px] flex items-center transition-all ${
                activeTab === 'requests'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                  : 'hover:bg-gray-800/50 text-gray-300 hover:text-white font-medium'
              }`}
            >
              Demandes
            </button>
            <a
              href="/admin/clubs"
              className="px-5 sm:px-6 py-3 hover:bg-gray-800/50 text-gray-300 hover:text-white rounded-xl font-medium transition-all whitespace-nowrap text-sm sm:text-base min-h-[44px] flex items-center"
            >
              Clubs
            </a>
            <a
              href="/admin/users"
              className="px-5 sm:px-6 py-3 hover:bg-gray-800/50 text-gray-300 hover:text-white rounded-xl font-medium transition-all whitespace-nowrap text-sm sm:text-base min-h-[44px] flex items-center"
            >
              Utilisateurs
            </a>
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <>
        {/* STATS GLOBALES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="text-gray-500 text-xs sm:text-sm mb-2">Total Clubs</div>
            <div className="text-4xl sm:text-5xl font-bold" style={{ color: '#00FF41' }}>{stats.totalClubs}</div>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="text-gray-500 text-xs sm:text-sm mb-2">Clubs Actifs</div>
            <div className="text-4xl sm:text-5xl font-bold" style={{ color: '#00FF41' }}>{stats.activeClubs}</div>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="text-gray-500 text-xs sm:text-sm mb-2">CA Total (Phase 4)</div>
            <div className="text-4xl sm:text-5xl font-bold text-gray-700">-</div>
          </div>
        </div>

        {/* LISTE CLUBS */}
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Établissements</h2>
            <a
              href="/admin/clubs"
              className="w-full sm:w-auto text-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30 text-sm sm:text-base"
            >
              Gérer les clubs
            </a>
          </div>

          <div className="space-y-3">
            {clubs.length === 0 ? (
              <div className="text-gray-600 text-center py-12">
                Aucun établissement trouvé
              </div>
            ) : (
              clubs.map(club => (
                <div
                  key={club.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 bg-gray-800/30 backdrop-blur-sm rounded-xl hover:bg-gray-800/50 transition-all gap-3 sm:gap-0"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${club.actif ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-600'}`}></div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-base sm:text-lg truncate">{club.nom}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">ID: {club.id}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:gap-3 w-full sm:w-auto">
                    <a
                      href={`/${club.id}/admin`}
                      className="flex-1 sm:flex-none text-center px-4 sm:px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-medium transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap min-h-[44px] flex items-center justify-center"
                    >
                      Admin Club
                    </a>
                    <a
                      href={`/${club.id}`}
                      className="flex-1 sm:flex-none text-center px-4 sm:px-5 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Vue Client
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
          </>
        )}

        {activeTab === 'requests' && (
          <PendingClubRequests />
        )}
      </div>
    </div>
  );
};

export default SuperAdminInterface;
