import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoleProvider } from './contexts/RoleContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import Login from './components/Login';
import Register from './components/Register';
import SuperAdminInterface from './components/SuperAdminInterface';
import ClubAdminInterface from './components/ClubAdminInterface';
import ClubsManager from './components/ClubsManager';
import UsersManager from './components/UsersManager';
import ShowUID from './components/ShowUID';
import LanguageSelector from './components/LanguageSelector';

// Wrapper pour la logique principale avec auth
const RestaurantOrderSystemWithAuth = () => {
  const { user, loading } = useAuth();
  const pathParts = window.location.pathname.split('/').filter(p => p);
  const firstPart = pathParts[0] || 'demo';
  const secondPart = pathParts[1] || '';
  
  // Route spéciale pour afficher UID (temporaire)
  if (firstPart === 'show-uid') {
    return <ShowUID />;
  }

  // Route d'inscription pour nouveaux établissements
  if (firstPart === 'register') {
    return <Register />;
  }

  // Routes admin
  if (firstPart === 'admin') {
    // Si loading, afficher un loader
    if (loading) {
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
      // Si pas connecté, afficher écran connexion requise
      if (!user) {
        return (
          <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="max-w-md text-center">
              <div className="text-6xl mb-8" style={{ color: '#00FF41' }}>🔒</div>
              <div className="text-3xl font-bold mb-4" style={{ color: '#00FF41' }}>
                Connexion Requise
              </div>
              <div className="text-lg text-gray-400 mb-8">
                Vous devez être connecté en tant que super-admin pour accéder à cette page.
              </div>
              <a
                href="/admin/login"
                className="inline-block px-8 py-4 rounded-lg font-bold text-lg hover:opacity-80"
                style={{ backgroundColor: '#00FF41', color: '#000000' }}
              >
                SE CONNECTER
              </a>
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
    // Si pas connecté, afficher écran connexion requise
    if (!user) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-8" style={{ color: '#00FF41' }}>🔒</div>
            <div className="text-3xl font-bold mb-4" style={{ color: '#00FF41' }}>
              Connexion Requise
            </div>
            <div className="text-lg text-gray-400 mb-8">
              Vous devez être connecté pour accéder à l'administration.
            </div>
            <a
              href="/admin/login"
              className="inline-block px-8 py-4 rounded-lg font-bold text-lg hover:opacity-80"
              style={{ backgroundColor: '#00FF41', color: '#000000' }}
            >
              SE CONNECTER
            </a>
          </div>
        </div>
      );
    }

    // Si connecté, afficher SuperAdminInterface
    return <SuperAdminInterface />;
  }

  // Routes publiques et club admin
  const etablissementId = firstPart;
  const page = secondPart;

  // Route /{club-id}/admin (Admin Club)
  if (page === 'admin') {
    // Si loading, afficher un loader
    if (loading) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
            Chargement...
          </div>
        </div>
      );
    }

    // Si pas connecté, afficher écran de connexion requis
    if (!user) {
      const returnUrl = `/${etablissementId}/admin`;
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-8" style={{ color: '#00FF41' }}>🔒</div>
            <div className="text-3xl font-bold mb-4" style={{ color: '#00FF41' }}>
              Connexion Requise
            </div>
            <div className="text-lg text-gray-400 mb-4">
              Vous devez être connecté pour accéder à l'interface admin de <strong className="text-white">{etablissementId}</strong>.
            </div>
            <div className="text-sm text-gray-500 mb-8">
              Connectez-vous avec un compte ayant accès à cet établissement.
            </div>
            <a
              href={`/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`}
              className="inline-block px-8 py-4 rounded-lg font-bold text-lg hover:opacity-80 mb-4"
              style={{ backgroundColor: '#00FF41', color: '#000000' }}
            >
              SE CONNECTER
            </a>
            <div className="mt-6">
              <a
                href={`/${etablissementId}`}
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                ← Retour au menu client
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Si connecté, afficher ClubAdminInterface
    return <ClubAdminInterface clubId={etablissementId} />;
  }

  // Route tablette (PROTÉGÉE - nécessite authentification)
  if (page === 'tablette') {
    // Si loading, afficher un loader
    if (loading) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
            Chargement...
          </div>
        </div>
      );
    }

    // Si pas connecté, afficher écran d'accès réservé
    if (!user) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-8" style={{ color: '#00FF41' }}>🔒</div>
            <div className="text-3xl font-bold mb-4" style={{ color: '#00FF41' }}>
              Accès Réservé
            </div>
            <div className="text-lg text-gray-400 mb-8">
              Cette page est réservée au personnel.
              <br />
              Veuillez vous connecter pour continuer.
            </div>
            <a
              href="/admin/login"
              className="inline-block px-8 py-4 rounded-lg font-bold text-lg hover:opacity-80"
              style={{ backgroundColor: '#00FF41', color: '#000000' }}
            >
              SE CONNECTER
            </a>
            <div className="mt-6">
              <a
                href={`/${etablissementId}`}
                className="text-gray-500 hover:text-gray-300 text-sm"
              >
                ← Retour au menu client
              </a>
            </div>
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
    const q = query(
      collection(db, 'etablissements', etablissementId, 'menu'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const menuItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMenu(menuItems);
    }, (error) => {
      console.error('Erreur chargement menu:', error);
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

    const newOrderNumber = Date.now().toString().slice(-6);
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
      <div className="min-h-screen bg-black p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <h2 className="text-3xl font-semibold mb-8 text-center tracking-tight" style={{ color: '#00FF41' }}>
            {t('addTip')}
          </h2>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-xl">
            <div className="flex justify-between mb-3 text-gray-300">
              <span>{t('subtotal')}</span>
              <span className="font-semibold" style={{ color: '#00FF41' }}>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4 text-gray-300">
              <span>{t('tip')}</span>
              <span className="font-semibold" style={{ color: '#00FF41' }}>${tipAmount.toFixed(2)}</span>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-700/50 flex justify-between text-2xl">
              <span className="font-semibold text-white">{t('total')}</span>
              <span className="font-bold" style={{ color: '#00FF41' }}>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[15, 18, 20, 25].map(percentage => (
              <button
                key={percentage}
                onClick={() => selectTipPercentage(percentage)}
                className={`py-4 rounded-xl font-semibold transition-all duration-200 ${
                  tipAmount === (subtotal * percentage) / 100
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg shadow-green-500/30'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                }`}
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
                className="w-full bg-gray-800/50 p-4 rounded-xl text-center font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                style={{ color: '#00FF41' }}
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
            </div>
          </div>

          <button
            onClick={confirmOrderWithTip}
            className="w-full py-5 rounded-xl font-semibold text-lg mb-3 transition-all duration-200 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black shadow-lg shadow-green-500/30"
          >
            {t('confirm')}
          </button>

          <button
            onClick={() => {
              setShowTipScreen(false);
              setTipAmount(0);
              setCustomTip('');
            }}
            className="w-full py-4 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all"
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
              opacity: 0.5;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
          }
          .pulse-animation {
            animation: pulseGlow 2s ease-in-out infinite;
          }
        `}</style>

        <div className="max-w-md w-full text-center">
          {isReady ? (
            <>
              <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center pulse-animation shadow-2xl shadow-green-500/50">
                <Check size={64} className="text-black" />
              </div>
              <h1 className="text-4xl font-bold mb-6 tracking-tight" style={{ color: '#00FF41' }}>
                {t('orderReady')}
              </h1>
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-xl">
                <p className="text-gray-400 text-sm mb-2">{t('orderNumber')}</p>
                <p className="text-6xl font-bold mb-6" style={{ color: '#00FF41' }}>#{currentOrder.number}</p>
                <div className="h-px bg-gray-700/50 mb-6"></div>
                <p className="text-gray-400 text-sm mb-2">{t('totalAmount')}</p>
                <p className="text-3xl font-bold" style={{ color: '#00FF41' }}>${currentOrder.total.toFixed(2)}</p>
              </div>
              <p className="text-xl text-white font-medium">
                {t('pickupOrder')}
              </p>
            </>
          ) : (
            <>
              <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-center shadow-2xl shadow-green-500/50">
                <Check size={64} className="text-black" />
              </div>
              <h1 className="text-4xl font-bold mb-6 tracking-tight" style={{ color: '#00FF41' }}>
                {t('orderSent')}
              </h1>
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 mb-8 shadow-xl">
                <p className="text-gray-400 text-sm mb-2">{t('orderNumber')}</p>
                <p className="text-6xl font-bold mb-6" style={{ color: '#00FF41' }}>#{currentOrder.number}</p>
                <div className="h-px bg-gray-700/50 mb-6"></div>
                <p className="text-gray-400 text-sm mb-2">{t('totalAmount')}</p>
                <p className="text-3xl font-bold" style={{ color: '#00FF41' }}>${currentOrder.total.toFixed(2)}</p>
              </div>
              <p className="text-lg text-gray-300 leading-relaxed">
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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {!ordersOpen && (
            <div className="mb-4 p-3 bg-red-500/10 rounded-xl text-center">
              <span className="text-red-400 text-sm font-medium">
                {t('ordersClosed')}
              </span>
            </div>
          )}

          {/* Club name in top-left */}
          {etablissementName && (
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">
                {etablissementName}
              </h2>
            </div>
          )}

          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{
              color: '#00FF41',
              fontWeight: '600',
              letterSpacing: '-0.02em'
            }}>
              {t('menu')}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32">
        <div className="space-y-3">
          {menu.map(item => (
            <div key={item.id} className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-5 hover:bg-gray-900/50 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1" style={{ color: '#00FF41' }}>{item.name}</h3>
                  <p className="text-2xl font-bold" style={{ color: '#00FF41' }}>${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleQuantityChange(item.id, Math.max(0, (quantities[item.id] || 0) - 1))}
                    disabled={hasActiveOrder || !ordersOpen || !quantities[item.id]}
                    className="w-10 h-10 rounded-xl bg-gray-800 text-white font-bold text-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                  >
                    −
                  </button>
                  <div className="w-12 text-center">
                    <span className="text-2xl font-bold" style={{ color: '#00FF41' }}>
                      {quantities[item.id] || 0}
                    </span>
                  </div>
                  <button
                    onClick={() => handleQuantityChange(item.id, Math.min(20, (quantities[item.id] || 0) + 1))}
                    disabled={hasActiveOrder || !ordersOpen || (quantities[item.id] || 0) >= 20}
                    className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-black font-bold text-xl disabled:opacity-30 disabled:cursor-not-allowed hover:from-green-500 hover:to-green-600 transition-all shadow-lg shadow-green-500/20"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {getTotalItems() > 0 && !hasActiveOrder && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md shadow-2xl z-10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex justify-between mb-3 sm:mb-4 text-base sm:text-lg text-white">
              <span className="font-medium">{getTotalItems()} {getTotalItems() > 1 ? t('items') : t('item')}</span>
              <span className="text-xl sm:text-2xl font-bold" style={{ color: '#00FF41' }}>${getTotalPrice().toFixed(2)}</span>
            </div>
            <button
              onClick={handleValidate}
              className="w-full py-4 sm:py-5 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all duration-200 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black shadow-lg shadow-green-500/30"
            >
              <ShoppingCart size={20} className="sm:w-6 sm:h-6" />
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
  const [orders, setOrders] = useState([]);
  const [etablissementName, setEtablissementName] = useState('');
  // ============================================
  // PHASE 2.5 : STOP/START COMMANDES
  // ============================================
  const [ordersOpen, setOrdersOpen] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

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

  const deleteOrder = async (orderId) => {
    try {
      await deleteDoc(
        doc(db, 'etablissements', etablissementId, 'commandes', orderId)
      );
    } catch (error) {
      console.error('Erreur suppression:', error);
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

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Club name in top-right */}
        {etablissementName && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <h2 className="text-base sm:text-xl font-bold text-white">
              {etablissementName}
            </h2>
          </div>
        )}

        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight" style={{
            color: '#00FF41',
            fontWeight: '600',
            letterSpacing: '-0.02em'
          }}>
            Tablette de Gestion
          </h1>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                      onClick={() => deleteOrder(order.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-red-500/20"
                    >
                      Retirer (Livrée)
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