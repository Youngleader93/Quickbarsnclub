import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const SuperAdminInterface = () => {
  const { user, logout } = useAuth();
  const { isSuperAdmin, userRole, displayName, loading: roleLoading, reloadRole } = useRole();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
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
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-red-500"></div>
          </div>
          <h1 className="text-3xl font-bold mb-4 text-red-500 tracking-tight">
            Accès Refusé
          </h1>
          <p className="text-gray-400 mb-2">
            Vous devez être Super Admin pour accéder à cette page.
          </p>
          <p className="text-sm text-gray-500 mb-1">Rôle actuel : {userRole || 'aucun'}</p>
          <p className="text-xs text-gray-600 mb-8">UID : {user?.uid}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={reloadRole}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20"
            >
              Recharger les permissions
            </button>
            <button
              onClick={async () => {
                await logout();
                window.location.href = '/admin/login';
              }}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30"
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
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-1 tracking-tight" style={{ color: '#00FF41' }}>
                Super Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                {displayName} • {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-500/20"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="bg-gray-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex gap-2">
            <a
              href="/admin"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-black rounded-xl font-semibold shadow-lg shadow-green-500/30"
            >
              Dashboard
            </a>
            <a
              href="/admin/clubs"
              className="px-6 py-3 hover:bg-gray-800/50 text-gray-300 hover:text-white rounded-xl font-medium transition-all"
            >
              Clubs
            </a>
            <a
              href="/admin/users"
              className="px-6 py-3 hover:bg-gray-800/50 text-gray-300 hover:text-white rounded-xl font-medium transition-all"
            >
              Utilisateurs
            </a>
          </div>
        </div>
      </div>

      {/* STATS GLOBALES */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <div className="text-gray-500 text-sm mb-2">Total Clubs</div>
            <div className="text-5xl font-bold" style={{ color: '#00FF41' }}>{stats.totalClubs}</div>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <div className="text-gray-500 text-sm mb-2">Clubs Actifs</div>
            <div className="text-5xl font-bold" style={{ color: '#00FF41' }}>{stats.activeClubs}</div>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
            <div className="text-gray-500 text-sm mb-2">CA Total (Phase 4)</div>
            <div className="text-5xl font-bold text-gray-700">-</div>
          </div>
        </div>

        {/* LISTE CLUBS */}
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Établissements</h2>
            <a
              href="/admin/clubs"
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30"
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
                  className="flex items-center justify-between p-5 bg-gray-800/30 backdrop-blur-sm rounded-xl hover:bg-gray-800/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${club.actif ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-600'}`}></div>
                    <div>
                      <div className="font-semibold text-white text-lg">{club.nom}</div>
                      <div className="text-sm text-gray-500">ID: {club.id}</div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={`/${club.id}/admin`}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20"
                    >
                      Admin Club
                    </a>
                    <a
                      href={`/${club.id}`}
                      className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-all"
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
      </div>
    </div>
  );
};

export default SuperAdminInterface;
