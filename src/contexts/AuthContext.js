import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Écouter les changements d'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      // Note: Ne pas réinitialiser isLoggingOut ici pour éviter le flash "Accès refusé"
      // isLoggingOut sera réinitialisé uniquement par la redirection après logout
    });

    return unsubscribe;
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    setError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      setUser(result.user);
      return { success: true };
    } catch (error) {
      let errorMessage = 'Erreur de connexion';
      
      // Traduction des erreurs Firebase
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Email invalide';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Aucun compte trouvé avec cet email';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Mot de passe incorrect';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Email ou mot de passe incorrect';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Trop de tentatives. Réessayez plus tard';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erreur réseau. Vérifiez votre connexion';
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      setUser(null);
      return { success: true };
    } catch (error) {
      setError('Erreur lors de la déconnexion');
      setIsLoggingOut(false);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    error,
    isLoggingOut,
    login,
    logout,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};