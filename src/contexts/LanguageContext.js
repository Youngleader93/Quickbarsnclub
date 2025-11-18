import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

const translations = {
  fr: {
    // Interface Client
    menu: 'Menu',
    ordersClosed: 'Commandes fermées - Consultation uniquement',
    validate: 'Valider la commande',
    orderSent: 'Commande Envoyée',
    orderReady: 'Commande Prête',
    orderNumber: 'Numéro de commande',
    totalAmount: 'Montant total',
    pickupOrder: 'Récupérez votre commande au comptoir',
    orderProcessing: 'Commande en cours...',
    yourOrder: 'Votre commande',
    orderInProgress: 'est en préparation',
    newOrderAfter: 'Vous pourrez passer une nouvelle commande une fois celle-ci récupérée',
    notifiedWhenReady: 'Vous serez notifié quand votre commande sera prête',

    // StartPage
    welcome: 'Bienvenue',
    connectWifi: 'Pour commander, connectez-vous d\'abord au WiFi',
    networkName: 'Nom du réseau',
    password: 'Mot de passe',
    imConnected: 'Je suis connecté',
    perfect: 'Parfait ! Accédez au menu',
    viewMenu: 'Voir le menu et commander',

    // Tip Screen
    addTip: 'Ajouter un pourboire',
    tipSubtitle: 'Montrez votre appréciation (optionnel)',
    customAmount: 'Montant personnalisé',
    enterCustom: 'Entrer un montant',
    confirm: 'Confirmer',
    back: 'Retour',
    subtotal: 'Sous-total',
    tip: 'Pourboire',
    total: 'Total',

    // Common
    items: 'articles',
    item: 'article',
    loading: 'Chargement...',
    loadingMenu: 'Chargement du menu...',
    establishment: 'Établissement',
    emptyCart: 'Panier vide. Ajoutez des articles avant de valider.'
  },

  en: {
    // Client Interface
    menu: 'Menu',
    ordersClosed: 'Orders closed - View only',
    validate: 'Validate order',
    orderSent: 'Order Sent',
    orderReady: 'Order Ready',
    orderNumber: 'Order number',
    totalAmount: 'Total amount',
    pickupOrder: 'Pick up your order at the counter',
    orderProcessing: 'Order processing...',
    yourOrder: 'Your order',
    orderInProgress: 'is being prepared',
    newOrderAfter: 'You can place a new order once this one is picked up',
    notifiedWhenReady: 'You will be notified when your order is ready',

    // StartPage
    welcome: 'Welcome',
    connectWifi: 'To order, first connect to WiFi',
    networkName: 'Network name',
    password: 'Password',
    imConnected: 'I\'m connected',
    perfect: 'Perfect! Access the menu',
    viewMenu: 'View menu and order',

    // Tip Screen
    addTip: 'Add a tip',
    tipSubtitle: 'Show your appreciation (optional)',
    customAmount: 'Custom amount',
    enterCustom: 'Enter an amount',
    confirm: 'Confirm',
    back: 'Back',
    subtotal: 'Subtotal',
    tip: 'Tip',
    total: 'Total',

    // Common
    items: 'items',
    item: 'item',
    loading: 'Loading...',
    loadingMenu: 'Loading menu...',
    establishment: 'Establishment',
    emptyCart: 'Empty cart. Add items before validating.'
  },

  es: {
    // Client Interface
    menu: 'Menú',
    ordersClosed: 'Pedidos cerrados - Solo consulta',
    validate: 'Validar pedido',
    orderSent: 'Pedido Enviado',
    orderReady: 'Pedido Listo',
    orderNumber: 'Número de pedido',
    totalAmount: 'Monto total',
    pickupOrder: 'Recoja su pedido en el mostrador',
    orderProcessing: 'Pedido en proceso...',
    yourOrder: 'Su pedido',
    orderInProgress: 'se está preparando',
    newOrderAfter: 'Podrás hacer un nuevo pedido una vez recogido este',
    notifiedWhenReady: 'Se le notificará cuando su pedido esté listo',

    // StartPage
    welcome: 'Bienvenido',
    connectWifi: 'Para pedir, primero conéctese al WiFi',
    networkName: 'Nombre de red',
    password: 'Contraseña',
    imConnected: 'Estoy conectado',
    perfect: '¡Perfecto! Accede al menú',
    viewMenu: 'Ver menú y pedir',

    // Tip Screen
    addTip: 'Agregar propina',
    tipSubtitle: 'Muestra tu aprecio (opcional)',
    customAmount: 'Monto personalizado',
    enterCustom: 'Ingresar un monto',
    confirm: 'Confirmar',
    back: 'Volver',
    subtotal: 'Subtotal',
    tip: 'Propina',
    total: 'Total',

    // Common
    items: 'artículos',
    item: 'artículo',
    loading: 'Cargando...',
    loadingMenu: 'Cargando menú...',
    establishment: 'Establecimiento',
    emptyCart: 'Carrito vacío. Agregue artículos antes de validar.'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Récupérer la langue depuis localStorage ou utiliser la langue du navigateur
    const savedLang = localStorage.getItem('quickbar_language');
    if (savedLang && ['fr', 'en', 'es'].includes(savedLang)) {
      return savedLang;
    }

    // Détecter la langue du navigateur
    const browserLang = navigator.language.split('-')[0];
    return ['fr', 'en', 'es'].includes(browserLang) ? browserLang : 'en';
  });

  useEffect(() => {
    localStorage.setItem('quickbar_language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const changeLanguage = (newLang) => {
    if (['fr', 'en', 'es'].includes(newLang)) {
      setLanguage(newLang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
