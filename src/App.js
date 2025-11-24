import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoleProvider, useRole } from './contexts/RoleContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Login from './components/Login';
import Register from './components/Register';
import SuperAdminInterface from './components/SuperAdminInterface';
import ClubAdminInterface from './components/ClubAdminInterface';
import ClubsManager from './components/ClubsManager';
import UsersManager from './components/UsersManager';
import ShowUID from './components/ShowUID';
import LanguageSelector from './components/LanguageSelector';
import ClubRegistrationForm from './components/ClubRegistrationForm';

// Wrapper pour la logique principale avec auth
const RestaurantOrderSystemWithAuth = () => {
  const { user, loading, isLoggingOut } = useAuth();
  const { userRole, clubAccess, isSuperAdmin, isInitialized } = useRole();
  const pathParts = window.location.pathname.split('/').filter(p => p);
  const firstPart = pathParts[0] || 'demo';
  const secondPart = pathParts[1] || '';

  // Nettoyer le marqueur de déconnexion si on est sur /admin/login
  if (typeof window !== 'undefined' && firstPart === 'admin' && secondPart === 'login') {
    sessionStorage.removeItem('isLoggingOut');
  }

  // ⚠️ VÉRIFICATION CRITIQUE - Empêche tout flash pendant la déconnexion
  if (typeof window !== 'undefined' && sessionStorage.getItem('isLoggingOut') === 'true') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Déconnexion en cours...
        </div>
      </div>
    );
  }

  // LOADER PENDANT DÉCONNEXION (doublon de sécurité)
  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Déconnexion en cours...
        </div>
      </div>
    );
  }

  // LOADER GLOBAL : Si user connecté mais rôles pas encore chargés, afficher loader
  if (user && !isInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Chargement...
        </div>
      </div>
    );
  }

  // Route spéciale pour afficher UID (temporaire)
  if (firstPart === 'show-uid') {
    return <ShowUID />;
  }

  // Route d'inscription pour nouveaux établissements
  if (firstPart === 'register') {
    return <Register />;
  }

  // Route d'inscription des clubs (formulaire public)
  if (firstPart === 'register-club') {
    return <ClubRegistrationForm />;
  }

  // Routes admin
  if (firstPart === 'admin') {
    // Si loading auth ou rôles pas initialisés, afficher un loader
    if (loading || !isInitialized) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
            Chargement...
          </div>
        </div>
      );
    }

    // Route /admin/login
    if (secondPart === 'login') {
      // Nettoyer le marqueur de déconnexion
      sessionStorage.removeItem('isLoggingOut');

      // Récupérer le returnUrl depuis l'URL
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl');

      // Si déjà connecté, rediriger selon le returnUrl ou vers /admin
      if (user) {
        if (returnUrl) {
          window.location.href = returnUrl;
        } else {
          window.location.href = '/admin';
        }
        return null;
      }
      return <Login onLoginSuccess={() => window.location.href = '/admin'} />;
    }

    // Routes /admin/clubs et /admin/users
    if (secondPart === 'clubs' || secondPart === 'users') {
      // Si pas connecté, rediriger vers login
      if (!user) {
        window.location.href = '/admin/login';
        return (
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
              Chargement...
            </div>
          </div>
        );
      }

      // Si connecté, afficher la page appropriée
      const pageTitle = secondPart === 'clubs' ? 'GESTION DES CLUBS' : 'GESTION DES UTILISATEURS';
      const PageComponent = secondPart === 'clubs' ? ClubsManager : UsersManager;

      return (
        <div className="min-h-screen bg-black" style={{ color: '#00FF41' }}>
          <div className="border-b p-4" style={{ borderColor: '#00FF41' }}>
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <div className="text-2xl font-bold">{pageTitle}</div>
              <a
                href="/admin"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              >
                ← Retour Dashboard
              </a>
            </div>
          </div>
          <div className="max-w-7xl mx-auto p-6">
            <PageComponent />
          </div>
        </div>
      );
    }

    // Route /admin (et autres sous-routes admin)
    // Si pas connecté, rediriger vers login
    if (!user) {
      window.location.href = '/admin/login';
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
            Chargement...
          </div>
        </div>
      );
    }

    // Si connecté, rediriger selon le rôle
    // Serveur → rediriger vers la tablette de son établissement
    if (userRole === 'serveur' && clubAccess && clubAccess.length > 0) {
      const clubId = clubAccess[0];
      window.location.href = `/${clubId}/tablette`;
      return null;
    }

    // Super admin → SuperAdminInterface
    if (isSuperAdmin()) {
      return <SuperAdminInterface />;
    }

    // Club admin → rediriger vers son club
    if (userRole === 'club_admin' && clubAccess && clubAccess.length > 0) {
      // Si un seul club, rediriger directement
      const clubId = clubAccess[0];
      window.location.href = `/${clubId}/admin`;
      return null;
    }

    // Si pas de rôle approprié, rediriger vers login
    window.location.href = '/admin/login';
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Chargement...
        </div>
      </div>
    );
  }

  // Routes publiques et club admin
  const etablissementId = firstPart;
  const page = secondPart;

  // Route /{club-id}/admin (Admin Club)
  if (page === 'admin') {
    // Si loading auth ou rôles pas initialisés, afficher un loader
    if (loading || !isInitialized) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
            Chargement...
          </div>
        </div>
      );
    }

    // Si pas connecté, rediriger vers login avec returnUrl
    if (!user) {
      const returnUrl = `/${etablissementId}/admin`;
      window.location.href = `/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`;
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
            Chargement...
          </div>
        </div>
      );
    }

    // Si connecté, afficher ClubAdminInterface
    return <ClubAdminInterface clubId={etablissementId} />;
  }

  // Route tablette (PROTÉGÉE - nécessite authentification)
  if (page === 'tablette') {
    // Vérifier si déconnexion en cours via sessionStorage
    const isLoggingOutFromStorage = sessionStorage.getItem('isLoggingOut') === 'true';

    // Si loading ou déconnexion en cours, afficher un loader
    if (loading || isLoggingOut || isLoggingOutFromStorage) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
            {(isLoggingOut || isLoggingOutFromStorage) ? 'Déconnexion en cours...' : 'Chargement...'}
          </div>
        </div>
      );
    }

    // Si pas connecté, rediriger vers login
    if (!user) {
      // Redirection immédiate sans afficher "Accès Refusé"
      window.location.href = '/admin/login';
      // Afficher un loader pendant la redirection
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
            Chargement...
          </div>
        </div>
      );
    }

    // Si connecté, afficher la tablette
    return <TabletInterface etablissementId={etablissementId} />;
  }

  if (page === 'start') {
    return <StartPage etablissementId={etablissementId} />;
  }

  return <ClientInterface etablissementId={etablissementId} />;
};

// Composant principal avec AuthProvider
const RestaurantOrderSystem = () => {
  return (
    <AuthProvider>
      <RoleProvider>
        <LanguageProvider>
          <RestaurantOrderSystemWithAuth />
        </LanguageProvider>
      </RoleProvider>
    </AuthProvider>
  );
};

// StartPage Component - Design Moderne
const StartPage = ({ etablissementId }) => {
  const { t } = useLanguage();
  const [connected, setConnected] = useState(false);
  const [wifiInfo, setWifiInfo] = useState({ ssid: t('loading'), password: '...' });

  useEffect(() => {
    const loadWifiInfo = async () => {
      const docRef = doc(db, 'etablissements', etablissementId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setWifiInfo({
          ssid: data.wifi?.nom || data.wifi_ssid || 'WiFi non configuré',
          password: data.wifi?.motDePasse || data.wifi_password || '...'
        });
      } else {
        setWifiInfo({ ssid: 'Établissement non trouvé', password: '...' });
      }
    };

    loadWifiInfo();
  }, [etablissementId]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      {/* Language Selector */}
      <div className="fixed top-6 right-6 z-10">
        <LanguageSelector />
      </div>

      <div className="text-center max-w-md w-full">
        <h1 className="text-4xl font-bold mb-4 tracking-tight" style={{ color: '#00FF41' }}>{t('welcome')}</h1>

        {!connected ? (
          <>
            <p className="text-xl mb-12 text-gray-300 leading-relaxed">
              {t('connectWifi')}
            </p>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-xl">
              <div className="mb-8">
                <div className="text-sm text-gray-500 mb-3">{t('networkName')}</div>
                <div className="text-3xl font-bold" style={{ color: '#00FF41' }}>{wifiInfo.ssid}</div>
              </div>

              <div className="h-px bg-gray-700/50 mb-8"></div>

              <div>
                <div className="text-sm text-gray-500 mb-3">{t('password')}</div>
                <div className="text-2xl font-mono font-semibold" style={{ color: '#00FF41' }}>{wifiInfo.password}</div>
              </div>
            </div>

            <button
              onClick={() => setConnected(true)}
              className="w-full py-5 rounded-xl font-semibold text-lg transition-all duration-200 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black shadow-lg shadow-green-500/30"
            >
              {t('imConnected')}
            </button>
          </>
        ) : (
          <>
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center shadow-2xl shadow-green-500/50">
              <Check size={48} className="text-black" />
            </div>
            <p className="text-2xl mb-12 font-medium" style={{ color: '#00FF41' }}>
              {t('perfect')}
            </p>
            <a
              href={`/${etablissementId}`}
              className="block w-full py-5 rounded-xl font-semibold text-lg transition-all duration-200 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black shadow-lg shadow-green-500/30"
            >
              {t('viewMenu')}
            </a>
          </>
        )}
      </div>
    </div>
  );
};

// ClientInterface Component - Design Moderne
const ClientInterface = ({ etablissementId }) => {
  const { t } = useLanguage();
  const [quantities, setQuantities] = useState({});
  const [currentOrderNumber, setCurrentOrderNumber] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [menu, setMenu] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showTipScreen, setShowTipScreen] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [etablissementName, setEtablissementName] = useState('');
  // ============================================
  // PHASE 2.5 : STOP/START COMMANDES
  // ============================================
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [checkingOrdersOpen, setCheckingOrdersOpen] = useState(true);

  // Écoute en temps réel du statut ordersOpen et nom établissement
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'etablissements', etablissementId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOrdersOpen(data.ordersOpen ?? true);
          setEtablissementName(data.nom || etablissementId);
        }
        setCheckingOrdersOpen(false);
      },
      (error) => {
        console.error('Erreur écoute ordersOpen:', error);
        setCheckingOrdersOpen(false);
      }
    );

    return () => unsubscribe();
  }, [etablissementId]);

  useEffect(() => {
    console.log('🔍 Vue Client: Chargement menu pour:', etablissementId);

    // Pas de orderBy pour éviter les conflits avec d'autres listeners
    const q = query(
      collection(db, 'etablissements', etablissementId, 'menu')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('✅ Vue Client: Snapshot reçu, nombre de docs:', snapshot.docs.length);
      const menuItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Trier en mémoire par nom
      menuItems.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      console.log('📋 Vue Client: Items chargés et triés:', menuItems);
      setMenu(menuItems);
    }, (error) => {
      console.error('❌ Vue Client: Erreur chargement menu:', error);
      console.error('❌ Vue Client: Code erreur:', error.code);
      console.error('❌ Vue Client: Message:', error.message);
    });

    return () => unsubscribe();
  }, [etablissementId]);

  useEffect(() => {
    const savedOrderNumber = localStorage.getItem(`currentOrderNumber_${etablissementId}`);
    const savedOrderId = localStorage.getItem(`currentOrderId_${etablissementId}`);
    
    if (savedOrderNumber && savedOrderId) {
      setCurrentOrderNumber(savedOrderNumber);
      setCurrentOrderId(savedOrderId);
      setHasActiveOrder(true);
      setShowCart(true);
    }
  }, [etablissementId]);

  useEffect(() => {
    if (!currentOrderId) return;

    const orderRef = doc(db, 'etablissements', etablissementId, 'commandes', currentOrderId);
    
    const unsubscribe = onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        const orderData = { id: docSnap.id, ...docSnap.data() };
        setCurrentOrder(orderData);
        
        if (orderData.status === 'ready') {
          setShowCart(true);
        }
      } else {
        localStorage.removeItem(`currentOrderNumber_${etablissementId}`);
        localStorage.removeItem(`currentOrderId_${etablissementId}`);
        setCurrentOrder(null);
        setCurrentOrderNumber(null);
        setCurrentOrderId(null);
        setHasActiveOrder(false);
        setShowCart(false);
        setQuantities({});
      }
    }, (error) => {
      console.error('Erreur écoute commande:', error);
    });

    return () => unsubscribe();
  }, [currentOrderId, etablissementId]);

  const handleQuantityChange = (itemId, value) => {
    let numValue = parseInt(value) || 0;
    if (numValue > 20) numValue = 20;
    if (numValue < 0) numValue = 0;
    
    setQuantities(prev => ({
      ...prev,
      [itemId]: numValue
    }));
  };

  const getTotalItems = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(quantities).reduce((sum, [id, qty]) => {
      const item = menu.find(m => m.id === id);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  };

  const selectTipPercentage = (percentage) => {
    const subtotal = getTotalPrice();
    const tip = (subtotal * percentage) / 100;
    setTipAmount(Number(tip.toFixed(2)));
    setCustomTip('');
  };

  const handleCustomTipChange = (value) => {
    setCustomTip(value);
    const numValue = parseFloat(value) || 0;
    setTipAmount(Number(numValue.toFixed(2)));
  };

  const handleValidate = () => {
    const orderItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = menu.find(m => m.id === id);
        return { ...item, quantity: qty };
      });

    if (orderItems.length === 0) {
      alert(t('emptyCart'));
      return;
    }

    setShowTipScreen(true);
  };

  const confirmOrderWithTip = async () => {
    const orderItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = menu.find(m => m.id === id);
        return { ...item, quantity: qty };
      });

    // Génère un numéro de commande : 1 lettre (A-Z) + 3 chiffres (001-999)
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const digits = Math.floor(Math.random() * 999) + 1; // 1-999
    const newOrderNumber = `${letter}${digits.toString().padStart(3, '0')}`; // Ex: A123, B456
    const subtotal = getTotalPrice();
    const total = subtotal + tipAmount;

    const newOrder = {
      number: newOrderNumber,
      items: orderItems,
      subtotal: Number(subtotal.toFixed(2)),
      tip: tipAmount,
      total: Number(total.toFixed(2)),
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    try {
      const docRef = await addDoc(
        collection(db, 'etablissements', etablissementId, 'commandes'),
        newOrder
      );
      
      localStorage.setItem(`currentOrderNumber_${etablissementId}`, newOrderNumber);
      localStorage.setItem(`currentOrderId_${etablissementId}`, docRef.id);

      setCurrentOrderNumber(newOrderNumber);
      setCurrentOrderId(docRef.id);
      setHasActiveOrder(true);
      setShowCart(true);
      setShowTipScreen(false);
    } catch (error) {
      console.error('Erreur création commande:', error);
      alert('Erreur lors de la création de la commande');
    }
  };

  // ÉCRAN DE BLOCAGE SI COMMANDES FERMÉES
  if (checkingOrdersOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse" style={{ color: '#00FF41' }}>
            ⏳
          </div>
          <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
            Vérification disponibilité...
          </div>
        </div>
      </div>
    );
  }

  if (!ordersOpen && !hasActiveOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-red-500"></div>
          </div>

          <h1 className="text-3xl font-semibold text-red-500 mb-4 tracking-tight">
            Commandes temporairement fermées
          </h1>

          <p className="text-lg text-gray-400 mb-12 leading-relaxed">
            Nous avons trop de demandes en cours.
            <br />
            Veuillez réessayer dans quelques minutes.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-white px-8 py-4 rounded-xl font-semibold text-lg mb-4 transition-all duration-200 shadow-lg shadow-green-500/20"
          >
            Réessayer
          </button>

          <a
            href={`/${etablissementId}/start`}
            className="inline-block text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Retour
          </a>
        </div>
      </div>
    );
  }

  if (showTipScreen) {
    const subtotal = getTotalPrice();
    const total = subtotal + tipAmount;

    return (
      <div className="h-screen bg-black px-3 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-h-screen py-4">
          <h2 className="text-5xl sm:text-6xl font-light mb-6 text-center tracking-wide uppercase" style={{ color: '#00FF41', fontWeight: '300', letterSpacing: '0.15em' }}>
            {t('addTip')}
          </h2>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 mb-6 shadow-xl border border-gray-800/50">
            {/* Liste des produits */}
            <div className="mb-6 pb-6 border-b border-gray-700/50 space-y-3">
              {menu
                .filter(item => quantities[item.id] > 0)
                .map(item => (
                  <div key={item.id} className="flex justify-between items-center text-lg sm:text-xl text-gray-300">
                    <span className="font-normal">
                      {quantities[item.id]}X {item.name}
                    </span>
                    <span className="font-light text-gray-400">
                      ${(item.price * quantities[item.id]).toFixed(2)}
                    </span>
                  </div>
                ))}
            </div>

            {/* Subtotal */}
            <div className="flex justify-between mb-6 text-gray-300 text-2xl sm:text-3xl py-3">
              <span className="font-normal">{t('subtotal')}</span>
              <span className="font-light" style={{ color: '#00FF41', fontWeight: '300' }}>${subtotal.toFixed(2)}</span>
            </div>

            {/* Tip */}
            <div className="flex justify-between mb-6 text-gray-300 text-2xl sm:text-3xl py-3">
              <span className="font-normal">{t('tip')}</span>
              <span className="font-light" style={{ color: '#00FF41', fontWeight: '300' }}>${tipAmount.toFixed(2)}</span>
            </div>

            {/* Total */}
            <div className="pt-6 mt-6 border-t border-gray-700/50 flex justify-between text-4xl sm:text-5xl py-3">
              <span className="font-normal text-white">{t('total')}</span>
              <span className="font-light" style={{ color: '#00FF41', fontWeight: '300' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[15, 18, 20, 25].map(percentage => (
              <button
                key={percentage}
                onClick={() => selectTipPercentage(percentage)}
                className={`py-6 rounded-xl font-normal transition-all duration-200 hover:scale-105 text-xl sm:text-2xl ${
                  tipAmount === (subtotal * percentage) / 100
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
                style={{ fontWeight: '400' }}
              >
                {percentage}% (${(subtotal * percentage / 100).toFixed(2)})
              </button>
            ))}
            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0"
                value={customTip}
                onChange={(e) => handleCustomTipChange(e.target.value)}
                placeholder={t('customAmount')}
                className="w-full bg-gray-800/50 p-6 rounded-xl text-center font-light focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-xl sm:text-2xl"
                style={{ color: '#00FF41', fontWeight: '300' }}
              />
              <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                <span className="text-gray-500 text-xl">$</span>
              </div>
            </div>
          </div>

          <button
            onClick={confirmOrderWithTip}
            className="w-full py-6 rounded-xl font-normal text-2xl sm:text-3xl mb-4 transition-all duration-200 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black shadow-lg shadow-green-500/30 hover:scale-105"
            style={{ fontWeight: '400' }}
          >
            {t('confirm')}
          </button>

          <button
            onClick={() => {
              setShowTipScreen(false);
              setTipAmount(0);
              setCustomTip('');
            }}
            className="w-full py-5 rounded-xl font-light text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all text-xl sm:text-2xl"
            style={{ fontWeight: '300' }}
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  if (hasActiveOrder && !showCart) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <div className="max-w-md text-center">
          <div className="text-xl mb-4" style={{ color: '#00FF41' }}>{t('orderProcessing')}</div>
          <div className="text-gray-400 mb-4">
            {t('yourOrder')} #{currentOrderNumber} {t('orderInProgress')}.
          </div>
          <div className="text-gray-500 text-sm">
            {t('newOrderAfter')}
          </div>
        </div>
      </div>
    );
  }

  if (showCart && currentOrder) {
    const isReady = currentOrder.status === 'ready';

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <style>{`
          @keyframes pulseGlow {
            0%, 100% {
              opacity: 0.7;
              transform: scale(1);
              box-shadow: 0 0 40px rgba(0, 255, 65, 0.5), 0 0 80px rgba(0, 255, 65, 0.3);
            }
            50% {
              opacity: 1;
              transform: scale(1.2);
              box-shadow: 0 0 60px rgba(0, 255, 65, 0.8), 0 0 120px rgba(0, 255, 65, 0.6), 0 0 160px rgba(0, 255, 65, 0.4);
            }
          }
          .pulse-animation {
            animation: pulseGlow 1s ease-in-out infinite;
          }
          @keyframes textFlash {
            0%, 100% {
              opacity: 0.8;
              text-shadow: 0 0 20px rgba(0, 255, 65, 0.3);
            }
            50% {
              opacity: 1;
              text-shadow: 0 0 40px rgba(0, 255, 65, 0.8), 0 0 60px rgba(0, 255, 65, 0.5);
            }
          }
          .text-flash {
            animation: textFlash 1s ease-in-out infinite;
          }
        `}</style>

        <div className="max-w-md w-full text-center">
          {isReady ? (
            <>
              <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center pulse-animation">
                <Check size={64} className="text-black" />
              </div>
              <h1 className="text-4xl font-light mb-6 tracking-wide uppercase text-flash" style={{ color: '#00FF41', fontWeight: '300', letterSpacing: '0.15em' }}>
                {t('orderReady')}
              </h1>
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-xl border border-gray-800/50">
                <p className="text-gray-400 text-sm mb-2 font-normal">{t('orderNumber')}</p>
                <p className="text-6xl font-light mb-6 text-flash" style={{ color: '#00FF41', fontWeight: '300' }}>#{currentOrder.number}</p>
                <div className="h-px bg-gray-700/50 mb-6"></div>
                <p className="text-gray-400 text-sm mb-2 font-normal">{t('totalAmount')}</p>
                <p className="text-3xl font-light" style={{ color: '#00FF41', fontWeight: '300' }}>${currentOrder.total.toFixed(2)}</p>
              </div>
              <p className="text-lg text-gray-300 leading-relaxed font-normal" style={{ fontWeight: '400' }}>
                {t('pickupOrder')}
              </p>
            </>
          ) : (
            <>
              <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center shadow-2xl shadow-green-500/50 animate-pulse">
                <Check size={64} className="text-black" />
              </div>
              <h1 className="text-4xl font-light mb-6 tracking-wide uppercase" style={{ color: '#00FF41', fontWeight: '300', letterSpacing: '0.15em' }}>
                {t('orderSent')}
              </h1>
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-xl border border-gray-800/50">
                <p className="text-gray-400 text-sm mb-2 font-normal">{t('orderNumber')}</p>
                <p className="text-6xl font-light mb-6" style={{ color: '#00FF41', fontWeight: '300', textShadow: '0 0 20px rgba(0, 255, 65, 0.3)' }}>#{currentOrder.number}</p>
                <div className="h-px bg-gray-700/50 mb-6"></div>
                <p className="text-gray-400 text-sm mb-2 font-normal">{t('totalAmount')}</p>
                <p className="text-3xl font-light" style={{ color: '#00FF41', fontWeight: '300' }}>${currentOrder.total.toFixed(2)}</p>
              </div>
              <p className="text-lg text-gray-300 leading-relaxed font-normal" style={{ fontWeight: '400' }}>
                {t('notifiedWhenReady')}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (menu.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center" style={{ color: '#00FF41' }}>
          <div className="text-2xl mb-4">{t('loadingMenu')}</div>
          <div className="text-sm text-gray-500">{t('establishment')}: {etablissementId}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Language Selector & WiFi Button - Fixed Top Right */}
      <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-3">
        <a
          href={`/${etablissementId}/start`}
          className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 text-white rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 shadow-lg"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          <span className="hidden xs:inline">WiFi</span>
        </a>
        <LanguageSelector />
      </div>

      <div className="sticky top-0 bg-black/95 backdrop-blur-md z-10 shadow-lg">
        {/* Club name in absolute top-left */}
        {etablissementName && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <h2 className="text-lg sm:text-xl font-bold text-white truncate max-w-[40vw]">
              {etablissementName}
            </h2>
          </div>
        )}

        <div className="w-full px-2 py-3 sm:py-4">
          {!ordersOpen && (
            <div className="mb-3 mx-2 p-2 bg-red-500/10 rounded-xl text-center">
              <span className="text-red-400 text-sm font-medium">
                {t('ordersClosed')}
              </span>
            </div>
          )}

          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl font-light tracking-tight" style={{
              color: '#00FF41',
              fontWeight: '300',
              letterSpacing: '0.15em',
              textTransform: 'uppercase'
            }}>
              {t('menu')}
            </h1>
          </div>
        </div>
      </div>

      <div className="w-full px-2 py-4 pb-32">
        {/* Grouper par catégorie */}
        {(() => {
          // Définir toutes les catégories possibles
          const allCategories = [
            'Cocktails', 'Softs', 'Bières', 'Vins',
            'Champagne', 'Shots', 'Snacks', 'Plats', 'Desserts'
          ];

          // Grouper les items par catégorie
          const itemsByCategory = {};
          menu.forEach(item => {
            const cat = item.category || 'Plats';
            if (!itemsByCategory[cat]) {
              itemsByCategory[cat] = [];
            }
            itemsByCategory[cat].push(item);
          });

          // Afficher seulement les catégories non vides dans l'ordre défini
          return allCategories
            .filter(cat => itemsByCategory[cat] && itemsByCategory[cat].length > 0)
            .map((category, idx) => (
              <div key={category} className="mb-6">
                {/* En-tête de catégorie avec design amélioré */}
                <div className="relative mb-3">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 sm:px-6 py-1.5 text-3xl sm:text-4xl font-medium tracking-wide uppercase bg-black"
                          style={{
                            color: '#00FF41',
                            textShadow: '0 0 20px rgba(0, 255, 65, 0.3)',
                            letterSpacing: '0.15em',
                            fontWeight: '500'
                          }}>
                      {category}
                    </span>
                  </div>
                </div>

                {/* Items de la catégorie avec design raffiné */}
                <div className="space-y-2.5">
                  {itemsByCategory[category].map(item => (
                    <div
                      key={item.id}
                      className="group relative bg-gradient-to-br from-gray-900/40 to-gray-900/20 backdrop-blur-md rounded-2xl p-3 sm:p-5 border border-gray-800/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10"
                      style={{
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <div className="flex items-center justify-between gap-3 sm:gap-6">
                        {/* Info produit */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-2xl sm:text-3xl font-normal mb-0.5 sm:mb-1 truncate transition-colors duration-200"
                              style={{
                                color: '#00FF41',
                                textShadow: '0 0 10px rgba(0, 255, 65, 0.2)',
                                fontWeight: '400',
                                letterSpacing: '0.02em'
                              }}>
                            {item.name}
                          </h3>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl sm:text-5xl font-light tracking-tight"
                                  style={{
                                    color: '#00FF41',
                                    textShadow: '0 0 15px rgba(0, 255, 65, 0.3)',
                                    fontWeight: '300',
                                    letterSpacing: '0.01em'
                                  }}>
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Contrôles quantité */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <button
                            onClick={() => handleQuantityChange(item.id, Math.max(0, (quantities[item.id] || 0) - 1))}
                            disabled={hasActiveOrder || !ordersOpen || !quantities[item.id]}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-green-600 to-green-500 text-black font-light text-2xl sm:text-3xl disabled:opacity-20 disabled:cursor-not-allowed hover:from-green-500 hover:to-green-600 transition-all duration-200 shadow-lg hover:shadow-green-500/40 hover:scale-105 active:scale-95"
                            style={{ fontWeight: '400' }}
                          >
                            −
                          </button>

                          <div className="w-14 sm:w-18 text-center flex-shrink-0">
                            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-black/50 border-2 border-green-500/30">
                              <span className="text-3xl sm:text-4xl font-light" style={{ color: '#00FF41', fontWeight: '300' }}>
                                {quantities[item.id] || 0}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleQuantityChange(item.id, Math.min(20, (quantities[item.id] || 0) + 1))}
                            disabled={hasActiveOrder || !ordersOpen || (quantities[item.id] || 0) >= 20}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-green-600 to-green-500 text-black font-light text-2xl sm:text-3xl disabled:opacity-20 disabled:cursor-not-allowed hover:from-green-500 hover:to-green-600 transition-all duration-200 shadow-lg hover:shadow-green-500/40 hover:scale-105 active:scale-95"
                            style={{ fontWeight: '400' }}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Effet de brillance au survol */}
                      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                           style={{
                             background: 'radial-gradient(circle at center, rgba(0, 255, 65, 0.03) 0%, transparent 70%)'
                           }}>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ));
        })()}
      </div>

      {getTotalItems() > 0 && !hasActiveOrder && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md shadow-2xl z-10">
          <div className="w-full px-3 py-5 sm:py-6">
            <div className="flex justify-between mb-4 text-2xl sm:text-3xl text-white">
              <span className="font-medium">{getTotalItems()} {getTotalItems() > 1 ? t('items') : t('item')}</span>
              <span className="text-3xl sm:text-4xl font-bold" style={{ color: '#00FF41' }}>${getTotalPrice().toFixed(2)}</span>
            </div>
            <button
              onClick={handleValidate}
              className="w-full py-6 sm:py-8 rounded-xl font-semibold text-2xl sm:text-3xl flex items-center justify-center gap-3 transition-all duration-200 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black shadow-lg shadow-green-500/30 hover:scale-[1.02]"
            >
              <ShoppingCart size={24} className="sm:w-8 sm:h-8" />
              {t('validate')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// TabletInterface Component - Design Moderne
const TabletInterface = ({ etablissementId }) => {
  const { logout } = useAuth();
  const { userRole, displayName } = useRole();
  const [orders, setOrders] = useState([]);
  const [etablissementName, setEtablissementName] = useState('');
  const [isLocalLoggingOut, setIsLocalLoggingOut] = useState(false);
  // ============================================
  // PHASE 2.5 : STOP/START COMMANDES
  // ============================================
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vous déconnecter ?')) {
      // Marquer la déconnexion dans sessionStorage
      sessionStorage.setItem('isLoggingOut', 'true');

      // MASQUER TOUT AVEC CSS !important - Impossible de contourner
      const style = document.createElement('style');
      style.id = 'logout-hide';
      style.textContent = '* { display: none !important; } body::after { content: "Déconnexion..."; display: block !important; color: #00FF41; font-family: monospace; font-size: 20px; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); }';
      document.head.appendChild(style);

      // Déconnexion puis redirection immédiate
      try {
        await logout();
      } catch (e) {
        // Ignorer les erreurs, rediriger quand même
      }
      window.location.replace('/admin/login');
    }
  };

  // Écoute en temps réel du statut ordersOpen + initialisation
  useEffect(() => {
    const initializeOrdersOpen = async () => {
      const etablissementRef = doc(db, 'etablissements', etablissementId);
      const docSnap = await getDoc(etablissementRef);

      // Si le document existe mais n'a pas le champ ordersOpen, l'initialiser
      if (docSnap.exists() && docSnap.data().ordersOpen === undefined) {
        try {
          await updateDoc(etablissementRef, { ordersOpen: true });
          console.log('Champ ordersOpen initialisé à true');
        } catch (error) {
          console.error('Erreur initialisation ordersOpen:', error);
        }
      }
    };

    initializeOrdersOpen();

    const unsubscribe = onSnapshot(
      doc(db, 'etablissements', etablissementId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOrdersOpen(data.ordersOpen ?? true);
          setEtablissementName(data.nom || etablissementId);
        }
      },
      (error) => {
        console.error('Erreur écoute ordersOpen:', error);
      }
    );

    return () => unsubscribe();
  }, [etablissementId]);

  useEffect(() => {
    const q = query(
      collection(db, 'etablissements', etablissementId, 'commandes'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp || new Date().toISOString()
      }));
      setOrders(ordersData);
    });

    return () => unsubscribe();
  }, [etablissementId]);

  const markAsInPreparation = async (orderId) => {
    try {
      await updateDoc(
        doc(db, 'etablissements', etablissementId, 'commandes', orderId),
        { status: 'in_preparation' }
      );
    } catch (error) {
      console.error('Erreur marquage en préparation:', error);
    }
  };

  const markAsReady = async (orderId) => {
    try {
      await updateDoc(
        doc(db, 'etablissements', etablissementId, 'commandes', orderId),
        { status: 'ready' }
      );
    } catch (error) {
      console.error('Erreur marquage prêt:', error);
    }
  };

  const markAsDelivered = async (orderId) => {
    try {
      await updateDoc(
        doc(db, 'etablissements', etablissementId, 'commandes', orderId),
        {
          status: 'delivered',
          deliveredAt: new Date().toISOString()
        }
      );
    } catch (error) {
      console.error('Erreur marquage livré:', error);
    }
  };

  // Toggle pour ouvrir/fermer les commandes
  const toggleOrdersOpen = async () => {
    setIsUpdating(true);

    try {
      const etablissementRef = doc(db, 'etablissements', etablissementId);

      // Vérifier que le document existe
      const docSnap = await getDoc(etablissementRef);
      if (!docSnap.exists()) {
        throw new Error(`L'établissement ${etablissementId} n'existe pas`);
      }

      await updateDoc(etablissementRef, {
        ordersOpen: !ordersOpen,
        lastUpdated: new Date().toISOString()
      });

      console.log(`Commandes ${!ordersOpen ? 'ouvertes' : 'fermées'} avec succès`);
    } catch (error) {
      console.error('Erreur toggle ordersOpen:', error);
      console.error('Détails erreur:', error.message);
      alert(`Erreur lors du changement de statut: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtrer uniquement les commandes actives (pas delivered)
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const inPreparationOrders = orders.filter(o => o.status === 'in_preparation');
  const readyOrders = orders.filter(o => o.status === 'ready');
  // Les commandes delivered sont cachées de la vue tablette (visibles dans historique)

  // ⚠️ VÉRIFICATION CRITIQUE - Empêche le flash pendant la déconnexion
  if (typeof window !== 'undefined' && sessionStorage.getItem('isLoggingOut') === 'true') {
    return null; // Ne rien rendre du tout
  }

  // Si en train de se déconnecter, afficher loader
  if (isLocalLoggingOut) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Déconnexion en cours...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Club name and logout button in top-right */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-col items-end gap-2">
          <div className="text-right">
            {etablissementName && (
              <h2 className="text-base sm:text-xl font-bold text-white">
                {etablissementName}
              </h2>
            )}
            {userRole === 'serveur' && (
              <p className="text-xs sm:text-sm text-gray-400 italic">serveur</p>
            )}
          </div>
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-all shadow-lg"
            title="Se déconnecter"
          >
            Déconnexion
          </button>
        </div>

        <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${ordersOpen ? 'bg-green-500' : 'bg-red-500'} shadow-lg ${ordersOpen ? 'shadow-green-500/50' : 'shadow-red-500/50'}`}></div>
              <div>
                <div className={`text-lg sm:text-xl font-semibold ${ordersOpen ? 'text-green-400' : 'text-red-400'}`}>
                  Commandes {ordersOpen ? 'Ouvertes' : 'Fermées'}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  {ordersOpen ? 'Les clients peuvent commander' : 'Nouvelles commandes bloquées'}
                </div>
              </div>
            </div>

            <button
              onClick={toggleOrdersOpen}
              disabled={isUpdating}
              className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold transition-all duration-200 min-h-[44px] text-sm sm:text-base ${
                ordersOpen
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20'
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black shadow-lg shadow-green-500/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isUpdating ? 'Chargement...' : (ordersOpen ? 'Fermer les commandes' : 'Ouvrir les commandes')}
            </button>
          </div>

          <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
            <span className="text-gray-400 text-sm sm:text-base">Commandes en attente :</span>
            <span className={`text-2xl sm:text-3xl font-bold ${
              pendingOrders.length < 5 ? 'text-white' :
              pendingOrders.length < 10 ? 'text-yellow-500' :
              'text-red-500 animate-pulse'
            }`}>
              {pendingOrders.length}
            </span>
            {pendingOrders.length >= 10 && (
              <span className="text-red-500 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 bg-red-500/10 rounded-full">
                Alerte surcharge
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-yellow-400 flex items-center gap-2 sm:gap-3">
              En attente
              <span className="text-xs sm:text-sm font-normal bg-yellow-500/20 px-2 py-0.5 rounded text-yellow-400">({pendingOrders.length})</span>
            </h2>
            {pendingOrders.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-gray-900/20 rounded-xl">
                <p className="text-gray-400 font-medium text-sm sm:text-base">Aucune commande en attente</p>
                <p className="text-gray-600 text-xs mt-1">Les nouvelles commandes apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map(order => (
                  <div key={order.id} className="bg-yellow-500/5 backdrop-blur-sm rounded-2xl p-5 shadow-xl hover:bg-yellow-500/10 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-yellow-400">#{order.number}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.timestamp).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm text-gray-300">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 mb-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-2xl font-bold" style={{ color: '#00FF41' }}>${order.total.toFixed(2)}</span>
                      </div>
                      {order.tip > 0 && (
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          dont ${order.tip.toFixed(2)} de pourboire
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => markAsInPreparation(order.id)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                      <Check size={20} />
                      Prendre en charge
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-blue-400 flex items-center gap-2 sm:gap-3">
              En préparation
              <span className="text-xs sm:text-sm font-normal bg-blue-500/20 px-2 py-0.5 rounded text-blue-400">({inPreparationOrders.length})</span>
            </h2>
            {inPreparationOrders.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-gray-900/20 rounded-xl">
                <p className="text-gray-400 font-medium text-sm sm:text-base">Aucune commande en préparation</p>
                <p className="text-gray-600 text-xs mt-1">Les commandes prises en charge apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inPreparationOrders.map(order => (
                  <div key={order.id} className="bg-blue-500/5 backdrop-blur-sm rounded-2xl p-5 shadow-xl hover:bg-blue-500/10 transition-all border border-blue-500/20">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-blue-400">#{order.number}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.timestamp).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm text-gray-300">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 mb-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-2xl font-bold" style={{ color: '#00FF41' }}>${order.total.toFixed(2)}</span>
                      </div>
                      {order.tip > 0 && (
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          dont ${order.tip.toFixed(2)} de pourboire
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => markAsReady(order.id)}
                      className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
                    >
                      <Check size={20} />
                      Marquer comme prête
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3" style={{ color: '#00FF41' }}>
              Prêtes
              <span className="text-xs sm:text-sm font-normal bg-green-500/20 px-2 py-0.5 rounded" style={{ color: '#00FF41' }}>({readyOrders.length})</span>
            </h2>
            {readyOrders.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-gray-900/20 rounded-xl">
                <p className="text-gray-400 font-medium text-sm sm:text-base">Aucune commande prête</p>
                <p className="text-gray-600 text-xs mt-1">Les commandes prêtes apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-4">
                {readyOrders.map(order => (
                  <div key={order.id} className="bg-green-500/5 backdrop-blur-sm rounded-2xl p-5 shadow-xl hover:bg-green-500/10 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center">
                          <Check size={20} className="text-black" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold" style={{ color: '#00FF41' }}>#{order.number}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(order.timestamp).toLocaleTimeString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      {order.items.map((item, i) => (
                        <div key={i} className="text-sm text-gray-400">
                          {item.quantity}x {item.name}
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 mb-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-2xl font-bold" style={{ color: '#00FF41' }}>${order.total.toFixed(2)}</span>
                      </div>
                      {order.tip > 0 && (
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          dont ${order.tip.toFixed(2)} de pourboire
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => markAsDelivered(order.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-green-500/30"
                    >
                      ✓ Marquer Livrée
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantOrderSystem;