import React, { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useRole } from '../contexts/RoleContext';

const UsersManager = () => {
  const { isSuperAdmin } = useRole();
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    uid: '',
    email: '',
    displayName: '',
    role: 'club_admin',
    clubAccess: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les utilisateurs
      console.log('🔍 Chargement des utilisateurs...');
      const usersQuery = query(collection(db, 'users'), orderBy('email'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs
        .map(doc => ({
          uid: doc.id,
          ...doc.data()
        }))
        // Filtrer les serveurs - ils sont gérés au niveau club
        .filter(user => user.role !== 'serveur');
      console.log('✅ Utilisateurs chargés (hors serveurs):', usersData.length);
      setUsers(usersData);

      // Charger les clubs pour la sélection
      console.log('🔍 Chargement des clubs...');
      const clubsQuery = query(collection(db, 'etablissements'), orderBy('nom'));
      const clubsSnapshot = await getDocs(clubsQuery);
      const clubsData = clubsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('✅ Clubs chargés:', clubsData.length, clubsData);
      setClubs(clubsData);
    } catch (error) {
      console.error('❌ Erreur chargement données:', error);
      alert('Erreur lors du chargement des données: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.uid || !formData.email) {
      alert('UID et Email sont obligatoires');
      return;
    }

    if (formData.role === 'club_admin' && formData.clubAccess.length === 0) {
      alert('Un admin de club doit avoir accès à au moins un club');
      return;
    }

    try {
      const userData = {
        email: formData.email,
        displayName: formData.displayName || formData.email,
        role: formData.role,
        updatedAt: new Date().toISOString()
      };

      // Super-admin n'a pas besoin de clubAccess
      if (formData.role === 'club_admin') {
        userData.clubAccess = formData.clubAccess;
      }

      if (editingUser) {
        // Mise à jour
        await updateDoc(doc(db, 'users', formData.uid), userData);
        alert('Utilisateur mis à jour avec succès');
      } else {
        // Création - utiliser setDoc avec l'UID fourni
        userData.createdAt = new Date().toISOString();
        await setDoc(doc(db, 'users', formData.uid), userData);
        alert('Utilisateur créé avec succès');
      }

      // Réinitialiser le formulaire
      setFormData({
        uid: '',
        email: '',
        displayName: '',
        role: 'club_admin',
        clubAccess: []
      });
      setShowForm(false);
      setEditingUser(null);
      loadData();
    } catch (error) {
      console.error('Erreur sauvegarde utilisateur:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      role: user.role || 'club_admin',
      clubAccess: user.clubAccess || []
    });
    setShowForm(true);
  };

  const handleDelete = async (uid) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', uid));
      alert('Utilisateur supprimé avec succès');
      loadData();
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      uid: '',
      email: '',
      displayName: '',
      role: 'club_admin',
      clubAccess: []
    });
    setShowForm(false);
    setEditingUser(null);
  };

  const toggleClubAccess = (clubId) => {
    setFormData(prev => {
      const newClubAccess = prev.clubAccess.includes(clubId)
        ? prev.clubAccess.filter(id => id !== clubId)
        : [...prev.clubAccess, clubId];
      return { ...prev, clubAccess: newClubAccess };
    });
  };

  if (!isSuperAdmin()) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 text-xl">Accès réservé aux Super Admins</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-xl" style={{ color: '#00FF41' }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#00FF41' }}>
          Gestion des Utilisateurs
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold"
          >
            + Nouvel Utilisateur
          </button>
        )}
      </div>

      {/* INFO BOX */}
      <div className="border rounded p-4 mb-6" style={{ borderColor: '#FFD700', backgroundColor: '#2a2a1a' }}>
        <div className="text-yellow-400 font-bold mb-2">ℹ️ Comment obtenir l'UID Firebase</div>
        <div className="text-sm text-gray-300">
          1. L'utilisateur doit d'abord se créer un compte via <a href="/admin/login" className="underline text-blue-400">/admin/login</a>
          <br />
          2. Après connexion, accéder à <a href="/show-uid" className="underline text-blue-400">/show-uid</a> pour copier son UID
          <br />
          3. Fournir l'UID au super-admin pour créer le document utilisateur avec les permissions
        </div>
      </div>

      {/* FORMULAIRE */}
      {showForm && (
        <div className="border rounded p-6 mb-6" style={{ borderColor: '#00FF41', backgroundColor: '#1a1a1a' }}>
          <h3 className="text-xl font-bold mb-4" style={{ color: '#00FF41' }}>
            {editingUser ? 'Modifier l\'Utilisateur' : 'Nouvel Utilisateur'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">UID Firebase *</label>
                <input
                  type="text"
                  value={formData.uid}
                  onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                  disabled={editingUser !== null}
                  className="w-full px-3 py-2 bg-black border rounded text-white font-mono text-sm"
                  style={{ borderColor: '#00FF41' }}
                  placeholder="ex: ZeV8UmDJUVRDeTZvHB2JzuAA5FX2"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  L'utilisateur obtient son UID via /show-uid
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-black border rounded text-white"
                  style={{ borderColor: '#00FF41' }}
                  placeholder="ex: admin@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Nom d'affichage</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-black border rounded text-white"
                  style={{ borderColor: '#00FF41' }}
                  placeholder="ex: John Doe"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Rôle *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, clubAccess: [] })}
                  className="w-full px-3 py-2 bg-black border rounded text-white"
                  style={{ borderColor: '#00FF41' }}
                  required
                >
                  <option value="club_admin">Admin Club</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>

            {/* Sélection des clubs pour club_admin */}
            {formData.role === 'club_admin' && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Accès aux clubs * (au moins 1)
                </label>
                <div className="border rounded p-3" style={{ borderColor: '#00FF41', backgroundColor: '#0a0a0a' }}>
                  {clubs.length === 0 ? (
                    <div className="text-gray-500 text-sm">
                      Aucun club disponible. Créez d'abord des clubs dans /admin/clubs
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {clubs.map(club => (
                        <label key={club.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.clubAccess.includes(club.id)}
                            onChange={() => toggleClubAccess(club.id)}
                            className="w-4 h-4"
                          />
                          <span className="text-gray-300 text-sm">
                            {club.nom} ({club.id})
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {formData.role === 'super_admin' && (
              <div className="mb-4 p-3 border rounded" style={{ borderColor: '#FFD700', backgroundColor: '#2a2a1a' }}>
                <div className="text-yellow-400 text-sm">
                  ⚠️ Super Admin a accès à tous les clubs automatiquement
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold"
              >
                {editingUser ? 'Mettre à jour' : 'Créer'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTE DES UTILISATEURS */}
      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun utilisateur trouvé. Créez-en un pour commencer.
          </div>
        ) : (
          users.map(user => (
            <div
              key={user.uid}
              className="border rounded p-4"
              style={{ borderColor: '#00FF41', backgroundColor: '#0a0a0a' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {user.role === 'super_admin' ? '👑' : '👤'}
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ color: '#00FF41' }}>
                      {user.displayName || user.email}
                    </div>
                    <div className="text-sm text-gray-400">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      UID: {user.uid}
                    </div>
                    <div className="mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        user.role === 'super_admin'
                          ? 'bg-yellow-600 text-yellow-100'
                          : 'bg-blue-600 text-blue-100'
                      }`}>
                        {user.role === 'super_admin' ? 'SUPER ADMIN' : 'ADMIN CLUB'}
                      </span>
                    </div>
                    {user.role === 'club_admin' && user.clubAccess && user.clubAccess.length > 0 && (
                      <div className="text-xs text-gray-400 mt-1">
                        Accès: {user.clubAccess.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(user.uid)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UsersManager;
