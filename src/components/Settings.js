import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Save, AlertCircle, Check, Clock, Wifi, MapPin, Phone, Mail, UserPlus, Trash2, Users } from 'lucide-react';

const Settings = ({ etablissementId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Gestion des serveurs
  const [servers, setServers] = useState([]);
  const [loadingServers, setLoadingServers] = useState(false);
  const [creatingServer, setCreatingServer] = useState(false);
  const [newServer, setNewServer] = useState({
    email: '',
    password: '',
    displayName: ''
  });

  const [settings, setSettings] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    horaires: {
      lundi: { ouvert: true, debut: '17:00', fin: '02:00' },
      mardi: { ouvert: true, debut: '17:00', fin: '02:00' },
      mercredi: { ouvert: true, debut: '17:00', fin: '02:00' },
      jeudi: { ouvert: true, debut: '17:00', fin: '02:00' },
      vendredi: { ouvert: true, debut: '17:00', fin: '04:00' },
      samedi: { ouvert: true, debut: '17:00', fin: '04:00' },
      dimanche: { ouvert: true, debut: '17:00', fin: '02:00' }
    },
    wifi: {
      nom: '',
      motDePasse: ''
    }
  });

  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const joursLabels = {
    lundi: 'Lundi',
    mardi: 'Mardi',
    mercredi: 'Mercredi',
    jeudi: 'Jeudi',
    vendredi: 'Vendredi',
    samedi: 'Samedi',
    dimanche: 'Dimanche'
  };

  useEffect(() => {
    loadSettings();
    loadServers();
  }, [etablissementId]);

  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'etablissements', etablissementId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          nom: data.nom || '',
          adresse: data.adresse || '',
          telephone: data.telephone || '',
          email: data.email || '',
          horaires: data.horaires || settings.horaires,
          wifi: data.wifi || { nom: '', motDePasse: '' }
        });
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
      setError('Erreur lors du chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const loadServers = async () => {
    try {
      setLoadingServers(true);
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'serveur'),
        where('etablissementId', '==', etablissementId)
      );
      const snapshot = await getDocs(q);
      const serversList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setServers(serversList);
    } catch (error) {
      console.error('Erreur chargement serveurs:', error);
    } finally {
      setLoadingServers(false);
    }
  };

  const createServer = async () => {
    if (!newServer.email || !newServer.password || !newServer.displayName) {
      showMessage('error', 'Veuillez remplir tous les champs');
      return;
    }

    if (newServer.password.length < 6) {
      showMessage('error', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setCreatingServer(true);

    try {
      // Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newServer.email,
        newServer.password
      );

      // Créer le document dans Firestore avec l'UID comme ID de document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: newServer.email,
        displayName: newServer.displayName,
        role: 'serveur',
        etablissementId: etablissementId,
        createdAt: new Date().toISOString()
      });

      showMessage('success', `Serveur ${newServer.displayName} créé avec succès`);
      setNewServer({ email: '', password: '', displayName: '' });
      loadServers();
    } catch (error) {
      console.error('Erreur création serveur:', error);
      if (error.code === 'auth/email-already-in-use') {
        showMessage('error', 'Cet email est déjà utilisé');
      } else {
        showMessage('error', `Erreur: ${error.message}`);
      }
    } finally {
      setCreatingServer(false);
    }
  };

  const deleteServer = async (serverId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce serveur ?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', serverId));
      showMessage('success', 'Serveur supprimé');
      loadServers();
    } catch (error) {
      console.error('Erreur suppression serveur:', error);
      showMessage('error', 'Erreur lors de la suppression');
    }
  };

  const showMessage = (type, message) => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const docRef = doc(db, 'etablissements', etablissementId);
      await updateDoc(docRef, {
        nom: settings.nom.trim(),
        adresse: settings.adresse.trim(),
        telephone: settings.telephone.trim(),
        email: settings.email.trim(),
        horaires: settings.horaires,
        wifi: settings.wifi,
        updatedAt: new Date().toISOString()
      });

      showMessage('success', 'Paramètres sauvegardés avec succès');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showMessage('error', 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateHoraire = (jour, field, value) => {
    setSettings({
      ...settings,
      horaires: {
        ...settings.horaires,
        [jour]: {
          ...settings.horaires[jour],
          [field]: value
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold font-mono" style={{ color: '#00FF41' }}>
            PARAMÈTRES
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Configuration de votre établissement
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-500/10 backdrop-blur-sm rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 backdrop-blur-sm rounded-xl flex items-center gap-3">
          <Check size={20} style={{ color: '#00FF41' }} />
          <span className="text-sm" style={{ color: '#00FF41' }}>{success}</span>
        </div>
      )}

      {/* Informations générales */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <MapPin size={18} className="sm:w-5 sm:h-5" style={{ color: '#00FF41' }} />
          Informations générales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">
              Nom de l'établissement
            </label>
            <input
              type="text"
              value={settings.nom}
              onChange={(e) => setSettings({ ...settings, nom: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm sm:text-base"
              placeholder="Le Nightclub Bar"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">
              <Mail size={14} className="sm:w-4 sm:h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm sm:text-base"
              placeholder="contact@nightclub.com"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">
              <MapPin size={14} className="sm:w-4 sm:h-4 inline mr-1" />
              Adresse
            </label>
            <input
              type="text"
              value={settings.adresse}
              onChange={(e) => setSettings({ ...settings, adresse: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm sm:text-base"
              placeholder="123 Main Street, New York"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">
              <Phone size={14} className="sm:w-4 sm:h-4 inline mr-1" />
              Téléphone
            </label>
            <input
              type="tel"
              value={settings.telephone}
              onChange={(e) => setSettings({ ...settings, telephone: e.target.value })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm sm:text-base"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Horaires d'ouverture */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <Clock size={18} className="sm:w-5 sm:h-5" style={{ color: '#00FF41' }} />
          Horaires d'ouverture
        </h3>

        <div className="space-y-2 sm:space-y-3">
          {jours.map((jour) => (
            <div key={jour} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-2.5 sm:p-3 bg-gray-800/30 rounded-xl">
              <div className="w-full sm:w-32">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.horaires[jour].ouvert}
                    onChange={(e) => updateHoraire(jour, 'ouvert', e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-white font-medium text-sm sm:text-base">{joursLabels[jour]}</span>
                </label>
              </div>

              {settings.horaires[jour].ouvert ? (
                <div className="flex items-center gap-2 sm:gap-3 flex-1 w-full">
                  <input
                    type="time"
                    value={settings.horaires[jour].debut}
                    onChange={(e) => updateHoraire(jour, 'debut', e.target.value)}
                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-900/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-xs sm:text-sm"
                  />
                  <span className="text-gray-500 text-sm sm:text-base">→</span>
                  <input
                    type="time"
                    value={settings.horaires[jour].fin}
                    onChange={(e) => updateHoraire(jour, 'fin', e.target.value)}
                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-900/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-xs sm:text-sm"
                  />
                </div>
              ) : (
                <span className="text-gray-600 italic text-xs sm:text-sm">Fermé</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* WiFi */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <Wifi size={18} className="sm:w-5 sm:h-5" style={{ color: '#00FF41' }} />
          Informations WiFi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">
              Nom du réseau WiFi
            </label>
            <input
              type="text"
              value={settings.wifi.nom}
              onChange={(e) => setSettings({
                ...settings,
                wifi: { ...settings.wifi, nom: e.target.value }
              })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm sm:text-base"
              placeholder="NightClub_WiFi"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-2">
              Mot de passe WiFi
            </label>
            <input
              type="text"
              value={settings.wifi.motDePasse}
              onChange={(e) => setSettings({
                ...settings,
                wifi: { ...settings.wifi, motDePasse: e.target.value }
              })}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm sm:text-base"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-blue-500/10 rounded-xl">
          <p className="text-xs sm:text-sm text-blue-400">
            Ces informations seront affichées aux clients sur la page d'accueil
          </p>
        </div>
      </div>

      {/* Gestion des serveurs */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center gap-2">
          <Users size={18} className="sm:w-5 sm:h-5" style={{ color: '#00FF41' }} />
          Gestion des serveurs
        </h3>

        {/* Formulaire de création */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Créer un nouveau serveur</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                placeholder="Nom d'affichage"
                value={newServer.displayName}
                onChange={(e) => setNewServer({ ...newServer, displayName: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm sm:text-base"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={newServer.email}
                onChange={(e) => setNewServer({ ...newServer, email: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm sm:text-base"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Mot de passe (min 6 car.)"
                value={newServer.password}
                onChange={(e) => setNewServer({ ...newServer, password: e.target.value })}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm sm:text-base"
              />
            </div>
          </div>
          <button
            onClick={createServer}
            disabled={creatingServer}
            className="mt-3 w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            <UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />
            {creatingServer ? 'Création...' : 'Créer le serveur'}
          </button>
        </div>

        {/* Liste des serveurs */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-3">
            Serveurs existants ({servers.length})
          </h4>
          {loadingServers ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">Chargement...</p>
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-8 bg-gray-800/30 rounded-xl">
              <Users size={32} className="mx-auto text-gray-600 mb-2" />
              <p className="text-gray-500 text-sm">Aucun serveur créé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-all"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm sm:text-base">{server.displayName}</p>
                    <p className="text-gray-500 text-xs sm:text-sm">{server.email}</p>
                  </div>
                  <button
                    onClick={() => deleteServer(server.id)}
                    className="p-2 hover:bg-red-900/20 rounded-lg transition-all"
                    title="Supprimer"
                  >
                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px] text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-yellow-500/10 rounded-xl">
          <p className="text-xs sm:text-sm text-yellow-400">
            ⚠️ Les serveurs ont uniquement accès à la tablette et ne peuvent pas modifier les paramètres
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
