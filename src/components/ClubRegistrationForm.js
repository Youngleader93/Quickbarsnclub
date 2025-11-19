import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const ClubRegistrationForm = () => {
  const [formData, setFormData] = useState({
    etablissementId: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    type: 'nightclub',
    message: ''
  });

  const [horaires, setHoraires] = useState({
    lundi: { ouvert: false, debut: '22:00', fin: '05:00' },
    mardi: { ouvert: false, debut: '22:00', fin: '05:00' },
    mercredi: { ouvert: true, debut: '22:00', fin: '05:00' },
    jeudi: { ouvert: true, debut: '22:00', fin: '05:00' },
    vendredi: { ouvert: true, debut: '22:00', fin: '05:00' },
    samedi: { ouvert: true, debut: '22:00', fin: '05:00' },
    dimanche: { ouvert: false, debut: '22:00', fin: '05:00' }
  });

  const [menuItems, setMenuItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    categorie: '',
    nom: '',
    prix: '',
    description: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Cocktails',
    'Spiritueux',
    'Softs',
    'Bières',
    'Vins',
    'Champagne',
    'Shots',
    'Snacks',
    'Plats',
    'Desserts'
  ];

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleHoraireChange = (jour, field, value) => {
    setHoraires({
      ...horaires,
      [jour]: {
        ...horaires[jour],
        [field]: value
      }
    });
  };

  const handleItemChange = (e) => {
    setCurrentItem({
      ...currentItem,
      [e.target.name]: e.target.value
    });
  };

  const addMenuItem = () => {
    if (!currentItem.categorie || !currentItem.nom || !currentItem.prix) {
      alert('Veuillez remplir au minimum: Catégorie, Nom et Prix');
      return;
    }

    setMenuItems([
      ...menuItems,
      {
        ...currentItem,
        prix: parseFloat(currentItem.prix),
        id: Date.now() // ID temporaire
      }
    ]);

    // Reset form
    setCurrentItem({
      categorie: '',
      nom: '',
      prix: '',
      description: ''
    });
  };

  const removeMenuItem = (id) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Validation
      if (!formData.etablissementId || !formData.nom || !formData.email || !formData.telephone) {
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      if (menuItems.length === 0) {
        throw new Error('Veuillez ajouter au moins un item au menu');
      }

      // Validation de l'ID (alphanumerique uniquement)
      if (!/^[a-z0-9]+$/.test(formData.etablissementId)) {
        throw new Error('L\'ID doit contenir uniquement des lettres minuscules et chiffres (sans espaces ni caractères spéciaux)');
      }

      // Soumettre à Firestore
      await addDoc(collection(db, 'club_requests'), {
        ...formData,
        horaires,
        menuItems: menuItems.map(({ id, ...item }) => item), // Enlever l'ID temporaire
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      // Reset form
      setFormData({
        etablissementId: '',
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        type: 'nightclub',
        message: ''
      });
      setMenuItems([]);
    } catch (err) {
      console.error('Erreur soumission:', err);
      setError(err.message || 'Erreur lors de la soumission. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <div className="text-4xl">✓</div>
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{ color: '#00FF41' }}>
            Demande envoyée !
          </h1>
          <p className="text-gray-300 mb-6">
            Votre demande d'inscription a été envoyée avec succès. Nous allons l'examiner et vous contacterons très prochainement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#00FF41' }}>
            Inscription QuickBar
          </h1>
          <p className="text-gray-400 text-lg">
            Rejoignez la révolution de la commande digitale pour votre établissement
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* INFORMATIONS ÉTABLISSEMENT */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-white">Informations de l'établissement</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom de l'établissement *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
                  placeholder="Le Phoenix Club"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ID de l'établissement * (URL: quickbar.com/votre-id)
                </label>
                <input
                  type="text"
                  name="etablissementId"
                  value={formData.etablissementId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500 font-mono"
                  placeholder="phoenixclub"
                  pattern="[a-z0-9]+"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Lettres minuscules et chiffres uniquement, sans espaces</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email du gérant *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="contact@phoenixclub.fr"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="+33 6 12 34 56 78"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse complète
                </label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
                  placeholder="123 Rue de la Soif, 75001 Paris"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type d'établissement *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="nightclub">Nightclub</option>
                  <option value="bar">Bar</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="lounge">Lounge Bar</option>
                  <option value="pub">Pub</option>
                </select>
              </div>
            </div>
          </div>

          {/* HORAIRES */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-white">Horaires d'ouverture</h2>

            <div className="space-y-3">
              {Object.keys(horaires).map(jour => (
                <div key={jour} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-3 w-full sm:w-40">
                    <input
                      type="checkbox"
                      checked={horaires[jour].ouvert}
                      onChange={(e) => handleHoraireChange(jour, 'ouvert', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-white font-medium capitalize">{jour}</span>
                  </div>

                  {horaires[jour].ouvert && (
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <input
                        type="time"
                        value={horaires[jour].debut}
                        onChange={(e) => handleHoraireChange(jour, 'debut', e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      />
                      <span className="text-gray-400">à</span>
                      <input
                        type="time"
                        value={horaires[jour].fin}
                        onChange={(e) => handleHoraireChange(jour, 'fin', e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* MENU */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-white">Menu de l'établissement</h2>

            {/* Formulaire d'ajout d'item */}
            <div className="space-y-4 mb-6 p-4 bg-gray-800/50 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-300">Ajouter un item</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Catégorie *</label>
                  <select
                    name="categorie"
                    value={currentItem.categorie}
                    onChange={handleItemChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-green-500"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nom *</label>
                  <input
                    type="text"
                    name="nom"
                    value={currentItem.nom}
                    onChange={handleItemChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Mojito"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prix (€) *</label>
                  <input
                    type="number"
                    name="prix"
                    value={currentItem.prix}
                    onChange={handleItemChange}
                    step="0.50"
                    min="0"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="12.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={currentItem.description}
                    onChange={handleItemChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-green-500"
                    placeholder="Rhum - Menthe - Citron vert"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={addMenuItem}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all"
              >
                + Ajouter cet item au menu
              </button>
            </div>

            {/* Liste des items ajoutés */}
            {menuItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-300 mb-4">
                  Items ajoutés ({menuItems.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {menuItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono px-2 py-1 bg-green-500/20 text-green-400 rounded">
                            {item.categorie}
                          </span>
                          <span className="text-white font-semibold">{item.nom}</span>
                          <span className="text-green-400 font-bold">{item.prix}€</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMenuItem(item.id)}
                        className="ml-4 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {menuItems.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun item ajouté. Ajoutez au moins un item pour continuer.
              </div>
            )}
          </div>

          {/* MESSAGE OPTIONNEL */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-white">Message (optionnel)</h2>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-500"
              placeholder="Questions, demandes spéciales, informations complémentaires..."
            />
          </div>

          {/* ERREUR */}
          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 text-red-400">
              {error}
            </div>
          )}

          {/* SUBMIT */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={submitting || menuItems.length === 0}
              className="px-12 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-bold text-lg transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClubRegistrationForm;
