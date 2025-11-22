import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [clubAccess, setClubAccess] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  const reloadRole = async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loadUserRole(0);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadUserRole = async (retryCount = 0) => {
    // Toujours mettre loading à true au début
    setLoading(true);

    if (!user) {
      setUserRole(null);
      setClubAccess([]);
      setDisplayName('');
      setTimeout(() => setLoading(false), 0);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role || null;

        setUserRole(role);
        setDisplayName(userData.username || userData.displayName || userData.email || 'Utilisateur');

        // Super-admin n'a pas besoin de clubAccess (accès à tout)
        if (role === 'super_admin') {
          setClubAccess([]);
        } else if (role === 'club_admin') {
          setClubAccess(userData.etablissements || userData.clubAccess || []);
        } else if (role === 'serveur') {
          // Serveur a accès à un seul établissement (pour la tablette)
          const etablissementId = userData.etablissementId;
          setClubAccess(etablissementId ? [etablissementId] : []);
        } else {
          setClubAccess([]);
        }

        // Mettre loading à false APRÈS que tous les autres états soient mis à jour
        setTimeout(() => setLoading(false), 0);
      } else {
        // Si le document n'existe pas, considérer comme pas de rôle
        setUserRole(null);
        setClubAccess([]);
        setDisplayName('');
        setTimeout(() => setLoading(false), 0);
      }
    } catch (error) {
      // Retry jusqu'à 3 fois en cas d'erreur réseau
      if (retryCount < 3) {
        setTimeout(() => loadUserRole(retryCount + 1), 2000);
      } else {
        setUserRole(null);
        setClubAccess([]);
        setDisplayName('');
        setTimeout(() => setLoading(false), 0);
      }
    }
  };

  useEffect(() => {
    setIsInitialized(false);
    loadUserRole(0);
  }, [user]);

  // Mettre isInitialized à true seulement quand tout est vraiment prêt
  useEffect(() => {
    if (!loading) {
      // Attendre 150ms pour garantir que tous les états sont stables
      const timer = setTimeout(() => {
        setIsInitialized(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setIsInitialized(false);
    }
  }, [loading]);

  // Fonctions utilitaires
  const isSuperAdmin = () => userRole === 'super_admin';

  const isClubAdmin = (clubId = null) => {
    if (userRole === 'super_admin') return true; // Super admin a accès à tout
    if (userRole !== 'club_admin') return false;
    if (!clubId) return true; // Vérifie juste qu'il est club_admin
    return clubAccess.includes(clubId);
  };

  const isServeur = (clubId = null) => {
    if (userRole !== 'serveur') return false;
    if (!clubId) return true; // Vérifie juste qu'il est serveur
    return clubAccess.includes(clubId);
  };

  const canAccessClub = (clubId) => {
    // Si pas encore initialisé, ne pas bloquer l'accès (le loader global s'en charge)
    if (!isInitialized) return true;
    return isSuperAdmin() || isClubAdmin(clubId);
  };

  const canAccessTablet = (clubId) => {
    // Serveurs, admins et super-admins peuvent accéder à la tablette
    if (!isInitialized) return true;
    return isSuperAdmin() || isClubAdmin(clubId) || isServeur(clubId);
  };

  const canAccessAdmin = (clubId) => {
    // Seulement super-admin et club-admin (PAS les serveurs)
    if (!isInitialized) return true;
    return isSuperAdmin() || isClubAdmin(clubId);
  };

  const value = {
    userRole,
    clubAccess,
    displayName,
    loading,
    isInitialized,
    error,
    isSuperAdmin,
    isClubAdmin,
    isServeur,
    canAccessClub,
    canAccessTablet,
    canAccessAdmin,
    reloadRole
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};
