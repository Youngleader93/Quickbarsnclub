import React, { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useRole } from '../contexts/RoleContext';

const ClubsManager = () => {
  const { isSuperAdmin } = useRole();
  const [clubs, setClubs] = useState([]);
  const [clubAdmins, setClubAdmins] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    nom: '',
    actif: true,
    wifiSSID: '',
    wifiPassword: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les clubs
      const q = query(collection(db, 'etablissements'), orderBy('nom'));
      const snapshot = await getDocs(q);
      const clubsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClubs(clubsData);

      // Charger les admins de clubs
      await loadClubAdmins();
    } catch (error) {
      console.error('Erreur chargement données:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadClubAdmins = async () => {
    try {
      console.log('🔍 Chargement des admins de clubs...');
      // Charger tous les club_admin
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'club_admin')
      );
      const snapshot = await getDocs(q);
      console.log(`✅ ${snapshot.docs.length} admin(s) club_admin trouvé(s)`);

      // Organiser les admins par club
      const adminsByClub = {};
      snapshot.docs.forEach(doc => {
        const userData = doc.data();
        const clubAccess = userData.clubAccess || [];
        console.log(`👤 Admin: ${userData.email} (${userData.displayName || 'pas de nom'}) - clubAccess:`, clubAccess);

        // Pour chaque club auquel cet admin a accès
        clubAccess.forEach(clubId => {
          if (!adminsByClub[clubId]) {
            adminsByClub[clubId] = [];
          }
          adminsByClub[clubId].push({
            email: userData.email,
            displayName: userData.displayName || userData.email
          });
        });
      });

      console.log('📊 Mapping admins par club:', adminsByClub);
      setClubAdmins(adminsByClub);
    } catch (error) {
      console.error('Erreur chargement admins:', error);
    }
  };

  const loadClubs = async () => {
    await loadData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.id || !formData.nom) {
      alert('ID et Nom sont obligatoires');
      return;
    }

    try {
      if (editingClub) {
        // Mise à jour
        await updateDoc(doc(db, 'etablissements', editingClub.id), {
          nom: formData.nom,
          actif: formData.actif,
          wifiSSID: formData.wifiSSID || '',
          wifiPassword: formData.wifiPassword || '',
          updatedAt: new Date().toISOString()
        });
        alert('Club mis à jour avec succès');
      } else {
        // Vérifier que l'ID n'existe pas déjà
        if (clubs.some(c => c.id === formData.id)) {
          alert('Un club avec cet ID existe déjà');
          return;
        }

        // Création avec ID personnalisé
        await setDoc(doc(db, 'etablissements', formData.id), {
          nom: formData.nom,
          actif: formData.actif,
          wifiSSID: formData.wifiSSID || '',
          wifiPassword: formData.wifiPassword || '',
          createdAt: new Date().toISOString(),
          ordersOpen: true // Par défaut, les commandes sont ouvertes
        });

        alert('Club créé avec succès');
      }

      // Réinitialiser le formulaire
      setFormData({
        id: '',
        nom: '',
        actif: true,
        wifiSSID: '',
        wifiPassword: ''
      });
      setShowForm(false);
      setEditingClub(null);
      loadClubs();
    } catch (error) {
      console.error('Erreur sauvegarde club:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    }
  };

  const handleEdit = (club) => {
    setEditingClub(club);
    setFormData({
      id: club.id,
      nom: club.nom,
      actif: club.actif,
      wifiSSID: club.wifiSSID || '',
      wifiPassword: club.wifiPassword || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (clubId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce club ? Cette action est irréversible.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'etablissements', clubId));
      alert('Club supprimé avec succès');
      loadClubs();
    } catch (error) {
      console.error('Erreur suppression club:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      id: '',
      nom: '',
      actif: true,
      wifiSSID: '',
      wifiPassword: ''
    });
    setShowForm(false);
    setEditingClub(null);
  };

  if (!isSuperAdmin()) {
    window.location.href = '/admin/login';
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Chargement...
        </div>
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
          Gestion des Clubs
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold"
          >
            + Nouveau Club
          </button>
        )}
      </div>

      {/* FORMULAIRE */}
      {showForm && (
        <div className="border rounded p-6 mb-6" style={{ borderColor: '#00FF41', backgroundColor: '#1a1a1a' }}>
          <h3 className="text-xl font-bold mb-4" style={{ color: '#00FF41' }}>
            {editingClub ? 'Modifier le Club' : 'Nouveau Club'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">ID du Club *</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  disabled={editingClub !== null}
                  className="w-full px-3 py-2 bg-black border rounded text-white"
                  style={{ borderColor: '#00FF41' }}
                  placeholder="ex: demo, bar-snclub"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  Utilisé dans l'URL (ex: /{formData.id || 'club-id'})
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Nom du Club *</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 bg-black border rounded text-white"
                  style={{ borderColor: '#00FF41' }}
                  placeholder="ex: Bar SnClub"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">WiFi SSID</label>
                <input
                  type="text"
                  value={formData.wifiSSID}
                  onChange={(e) => setFormData({ ...formData, wifiSSID: e.target.value })}
                  className="w-full px-3 py-2 bg-black border rounded text-white"
                  style={{ borderColor: '#00FF41' }}
                  placeholder="Nom du réseau WiFi"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">WiFi Password</label>
                <input
                  type="text"
                  value={formData.wifiPassword}
                  onChange={(e) => setFormData({ ...formData, wifiPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-black border rounded text-white"
                  style={{ borderColor: '#00FF41' }}
                  placeholder="Mot de passe WiFi"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-gray-400">Club actif</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold"
              >
                {editingClub ? 'Mettre à jour' : 'Créer'}
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

      {/* LISTE DES CLUBS */}
      <div className="space-y-3">
        {clubs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucun club trouvé. Créez-en un pour commencer.
          </div>
        ) : (
          clubs.map(club => (
            <div
              key={club.id}
              className="border rounded p-4"
              style={{ borderColor: '#00FF41', backgroundColor: '#0a0a0a' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`text-3xl ${club.actif ? 'text-green-400' : 'text-gray-600'}`}>
                    {club.actif ? '🟢' : '⚫'}
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ color: '#00FF41' }}>
                      {club.nom}
                    </div>
                    <div className="text-sm text-gray-400">
                      ID: {club.id}
                    </div>
                    {club.wifiSSID && (
                      <div className="text-xs text-gray-500">
                        WiFi: {club.wifiSSID}
                      </div>
                    )}
                    {clubAdmins[club.id] && clubAdmins[club.id].length > 0 && (
                      <div className="mt-2 p-2 bg-blue-900/20 rounded border border-blue-500/30">
                        <div className="text-xs font-semibold text-blue-400 mb-1">
                          Admin(s) du club:
                        </div>
                        {clubAdmins[club.id].map((admin, idx) => (
                          <div key={idx} className="text-xs text-gray-300">
                            📧 {admin.email}
                            {admin.displayName !== admin.email && (
                              <span className="text-gray-500"> ({admin.displayName})</span>
                            )}
                          </div>
                        ))}
                        <div className="text-xs text-yellow-400 mt-1 italic">
                          ⚠️ Les mots de passe ne sont pas affichés pour des raisons de sécurité
                        </div>
                      </div>
                    )}
                    {(!clubAdmins[club.id] || clubAdmins[club.id].length === 0) && (
                      <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-500/30">
                        <div className="text-xs text-red-400">
                          ⚠️ Aucun admin assigné à ce club
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`/${club.id}/admin`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    Admin
                  </a>
                  <a
                    href={`/${club.id}`}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Client
                  </a>
                  <button
                    onClick={() => handleEdit(club)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(club.id)}
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

export default ClubsManager;
