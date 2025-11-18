import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Save, AlertCircle, Check, Clock, Wifi, MapPin, Phone, Mail } from 'lucide-react';

const Settings = ({ etablissementId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-mono" style={{ color: '#00FF41' }}>
            PARAMÈTRES
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configuration de votre établissement
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={18} />
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
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <MapPin size={20} style={{ color: '#00FF41' }} />
          Informations générales
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Nom de l'établissement
            </label>
            <input
              type="text"
              value={settings.nom}
              onChange={(e) => setSettings({ ...settings, nom: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="Le Nightclub Bar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Mail size={16} className="inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="contact@nightclub.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Adresse
            </label>
            <input
              type="text"
              value={settings.adresse}
              onChange={(e) => setSettings({ ...settings, adresse: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="123 Main Street, New York"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Phone size={16} className="inline mr-1" />
              Téléphone
            </label>
            <input
              type="tel"
              value={settings.telephone}
              onChange={(e) => setSettings({ ...settings, telephone: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Horaires d'ouverture */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Clock size={20} style={{ color: '#00FF41' }} />
          Horaires d'ouverture
        </h3>

        <div className="space-y-3">
          {jours.map((jour) => (
            <div key={jour} className="flex items-center gap-4 p-3 bg-gray-800/30 rounded-xl">
              <div className="w-32">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.horaires[jour].ouvert}
                    onChange={(e) => updateHoraire(jour, 'ouvert', e.target.checked)}
                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-green-500 focus:ring-green-500"
                  />
                  <span className="text-white font-medium">{joursLabels[jour]}</span>
                </label>
              </div>

              {settings.horaires[jour].ouvert ? (
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="time"
                    value={settings.horaires[jour].debut}
                    onChange={(e) => updateHoraire(jour, 'debut', e.target.value)}
                    className="px-3 py-2 bg-gray-900/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-500">→</span>
                  <input
                    type="time"
                    value={settings.horaires[jour].fin}
                    onChange={(e) => updateHoraire(jour, 'fin', e.target.value)}
                    className="px-3 py-2 bg-gray-900/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ) : (
                <span className="text-gray-600 italic">Fermé</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* WiFi */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
          <Wifi size={20} style={{ color: '#00FF41' }} />
          Informations WiFi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Nom du réseau WiFi
            </label>
            <input
              type="text"
              value={settings.wifi.nom}
              onChange={(e) => setSettings({
                ...settings,
                wifi: { ...settings.wifi, nom: e.target.value }
              })}
              className="w-full px-4 py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="NightClub_WiFi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Mot de passe WiFi
            </label>
            <input
              type="text"
              value={settings.wifi.motDePasse}
              onChange={(e) => setSettings({
                ...settings,
                wifi: { ...settings.wifi, motDePasse: e.target.value }
              })}
              className="w-full px-4 py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-500/10 rounded-xl">
          <p className="text-sm text-blue-400">
            Ces informations seront affichées aux clients sur la page d'accueil
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
