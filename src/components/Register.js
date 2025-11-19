import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Building2, Mail, Lock, MapPin, Phone, AlertCircle, Check } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    establishmentName: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signup } = useAuth();

  // Générer un clubId unique à partir du nom
  const generateClubId = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Retirer accents
      .replace(/[^a-z0-9]/g, '-') // Remplacer caractères spéciaux par -
      .replace(/-+/g, '-') // Éviter doubles tirets
      .replace(/^-|-$/g, ''); // Retirer tirets début/fin
  };

  // Vérifier si le clubId existe déjà
  const checkClubIdExists = async (clubId) => {
    const q = query(collection(db, 'etablissements'), where('__name__', '==', clubId));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.establishmentName || !formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      // Générer clubId
      let clubId = generateClubId(formData.establishmentName);
      let counter = 1;

      // Si le clubId existe, ajouter un suffixe
      while (await checkClubIdExists(clubId)) {
        clubId = `${generateClubId(formData.establishmentName)}-${counter}`;
        counter++;
      }

      // Créer le compte utilisateur
      const signupResult = await signup(formData.email, formData.password);

      if (!signupResult.success) {
        setError(signupResult.error);
        setIsLoading(false);
        return;
      }

      const userId = signupResult.user.uid;

      // Créer l'établissement dans Firestore
      await setDoc(doc(db, 'etablissements', clubId), {
        nom: formData.establishmentName,
        adresse: formData.address || '',
        telephone: formData.phone || '',
        actif: true,
        createdAt: new Date().toISOString(),
        ownerId: userId
      });

      // Créer le rôle club_admin pour cet utilisateur
      await setDoc(doc(db, 'users', userId), {
        email: formData.email,
        role: 'club_admin',
        etablissements: [clubId],
        displayName: formData.establishmentName,
        createdAt: new Date().toISOString()
      });

      setSuccess(true);

      // Rediriger vers le dashboard de l'établissement après 2 secondes
      setTimeout(() => {
        window.location.href = `/${clubId}/admin`;
      }, 2000);

    } catch (error) {
      console.error('Erreur inscription:', error);
      setError('Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8 rounded-full bg-green-500/10 flex items-center justify-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center">
              <Check size={20} className="sm:hidden text-black" />
              <Check size={24} className="hidden sm:block text-black" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4" style={{ color: '#00FF41' }}>
            Inscription réussie !
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
            Votre établissement a été créé avec succès.
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Redirection vers votre dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-3 tracking-tight" style={{ color: '#00FF41' }}>
            QuickBar
          </h1>
          <p className="text-gray-400 text-base sm:text-lg">Créer votre compte professionnel</p>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Commencez à accepter des commandes en quelques minutes
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Nom de l'établissement */}
          <div>
            <label htmlFor="establishmentName" className="block text-sm font-medium mb-3 text-gray-300">
              Nom de l'établissement *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Building2 size={20} className="text-gray-600" />
              </div>
              <input
                id="establishmentName"
                type="text"
                value={formData.establishmentName}
                onChange={(e) => setFormData({ ...formData, establishmentName: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50"
                placeholder="Le Nightclub Bar"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-3 text-gray-300">
                Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-600" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50"
                  placeholder="admin@nightclub.com"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-3 text-gray-300">
                Téléphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone size={20} className="text-gray-600" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50"
                  placeholder="+1 (555) 123-4567"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-3 text-gray-300">
              Adresse
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin size={20} className="text-gray-600" />
              </div>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full pl-12 pr-4 py-4 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50"
                placeholder="123 Main Street, New York, NY"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-3 text-gray-300">
                Mot de passe *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-600" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50"
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-3 text-gray-300">
                Confirmer mot de passe *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-600" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50"
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 backdrop-blur-sm rounded-xl flex items-center gap-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 sm:py-5 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Création en cours...' : 'Créer mon établissement'}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 text-center">
          <p className="text-xs sm:text-sm text-gray-500">
            Vous avez déjà un compte ?{' '}
            <a href="/admin/login" className="text-green-500 hover:text-green-400 font-medium transition-colors">
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
