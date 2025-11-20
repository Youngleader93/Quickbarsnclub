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
      setLoading(false);
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role || null;

        setUserRole(role);
        setDisplayName(userData.displayName || userData.email || 'Utilisateur');

        // Super-admin n'a pas besoin de clubAccess (accès à tout)
        if (role === 'super_admin') {
          setClubAccess([]);
        } else if (role === 'club_admin') {
          setClubAccess(userData.etablissements || userData.clubAccess || []);
        } else {
          setClubAccess([]);
        }
        setLoading(false);
      } else {
        // Si le document n'existe pas, considérer comme pas de rôle
        setUserRole(null);
        setClubAccess([]);
        setDisplayName('');
        setLoading(false);
      }
    } catch (error) {
      // Retry jusqu'à 3 fois en cas d'erreur réseau
      if (retryCount < 3) {
        setTimeout(() => loadUserRole(retryCount + 1), 2000);
      } else {
        setUserRole(null);
        setClubAccess([]);
        setDisplayName('');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadUserRole(0);
  }, [user]);

  // Fonctions utilitaires
  const isSuperAdmin = () => userRole === 'super_admin';

  const isClubAdmin = (clubId = null) => {
    if (userRole === 'super_admin') return true; // Super admin a accès à tout
    if (userRole !== 'club_admin') return false;
    if (!clubId) return true; // Vérifie juste qu'il est club_admin
    return clubAccess.includes(clubId);
  };

  const canAccessClub = (clubId) => {
    return isSuperAdmin() || isClubAdmin(clubId);
  };

  const value = {
    userRole,
    clubAccess,
    displayName,
    loading,
    error,
    isSuperAdmin,
    isClubAdmin,
    canAccessClub,
    reloadRole
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};
