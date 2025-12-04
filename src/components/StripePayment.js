import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { CreditCard, Lock, AlertCircle, CheckCircle, Loader } from 'lucide-react';

// Cache pour les instances Stripe par établissement
const stripePromiseCache = new Map();

// Récupérer ou créer l'instance Stripe pour un établissement
const getStripePromise = (publicKey) => {
  if (!publicKey) return null;

  if (!stripePromiseCache.has(publicKey)) {
    stripePromiseCache.set(publicKey, loadStripe(publicKey));
  }
  return stripePromiseCache.get(publicKey);
};

// Composant formulaire de paiement
const CheckoutForm = ({ onSuccess, onError, orderData, etablissementId, t }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      // Confirmer le paiement avec Stripe
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href, // Pas utilisé car on gère manuellement
        },
        redirect: 'if_required'
      });

      if (error) {
        // Erreur côté Stripe (carte refusée, etc.)
        setMessage(error.message);
        onError && onError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Paiement réussi - créer la commande via Cloud Function
        const functions = getFunctions();
        const confirmPayment = httpsCallable(functions, 'confirmPaymentAndCreateOrder');

        const result = await confirmPayment({
          etablissementId,
          paymentIntentId: paymentIntent.id,
          orderData
        });

        if (result.data.success) {
          onSuccess && onSuccess(result.data);
        } else {
          throw new Error('Erreur lors de la création de la commande');
        }
      }
    } catch (err) {
      console.error('Erreur paiement:', err);
      setMessage(err.message || 'Une erreur est survenue');
      onError && onError(err);
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gray-900/50 rounded-xl p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
            theme: 'night',
            variables: {
              colorPrimary: '#00FF41',
              colorBackground: '#1a1a2e',
              colorText: '#ffffff',
              colorDanger: '#ff4444',
              fontFamily: 'system-ui, sans-serif',
              borderRadius: '12px'
            }
          }}
        />
      </div>

      {message && (
        <div className="p-3 bg-red-500/10 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400">{message}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={isProcessing || !stripe || !elements}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
      >
        {isProcessing ? (
          <>
            <Loader size={20} className="animate-spin" />
            {t?.processing || 'Traitement en cours...'}
          </>
        ) : (
          <>
            <Lock size={20} />
            {t?.payNow || 'Payer maintenant'}
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
        <Lock size={12} />
        <span>{t?.securePayment || 'Paiement sécurisé par Stripe'}</span>
      </div>
    </form>
  );
};

// Composant principal de paiement
const StripePayment = ({
  etablissementId,
  stripePublicKey,
  orderData,
  total,
  onSuccess,
  onCancel,
  t = {}
}) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    // Créer le Payment Intent au chargement
    const createIntent = async () => {
      try {
        setLoading(true);
        setError(null);

        const functions = getFunctions();
        const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');

        const result = await createPaymentIntent({
          etablissementId,
          amount: Math.round(total * 100), // Convertir en cents
          currency: 'cad',
          orderData
        });

        setClientSecret(result.data.clientSecret);
      } catch (err) {
        console.error('Erreur création PaymentIntent:', err);
        setError(err.message || 'Impossible d\'initialiser le paiement');
      } finally {
        setLoading(false);
      }
    };

    if (etablissementId && total > 0) {
      createIntent();
    }
  }, [etablissementId, total, orderData]);

  const handleSuccess = (data) => {
    setPaymentSuccess(true);
    setTimeout(() => {
      onSuccess && onSuccess(data);
    }, 2000);
  };

  const handleError = (err) => {
    console.error('Erreur paiement:', err);
  };

  // Écran de succès
  if (paymentSuccess) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle size={48} style={{ color: '#00FF41' }} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {t?.paymentSuccess || 'Paiement réussi !'}
          </h2>
          <p className="text-gray-400">
            {t?.orderConfirmed || 'Votre commande a été confirmée'}
          </p>
        </div>
      </div>
    );
  }

  // Chargement
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center">
          <Loader size={48} className="animate-spin mx-auto mb-4" style={{ color: '#00FF41' }} />
          <p className="text-gray-400">{t?.initPayment || 'Initialisation du paiement...'}</p>
        </div>
      </div>
    );
  }

  // Erreur
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold text-white mb-2">
              {t?.paymentError || 'Erreur de paiement'}
            </h2>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
          <button
            onClick={onCancel}
            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-all"
          >
            {t?.back || 'Retour'}
          </button>
        </div>
      </div>
    );
  }

  const stripePromise = getStripePromise(stripePublicKey);

  if (!stripePromise || !clientSecret) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <CreditCard size={32} style={{ color: '#00FF41' }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            {t?.payment || 'Paiement'}
          </h2>
          <p className="text-3xl font-bold" style={{ color: '#00FF41' }}>
            ${total.toFixed(2)} CAD
          </p>
        </div>

        {/* Résumé de la commande */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-2">
            {t?.orderSummary || 'Résumé de la commande'}
          </h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {orderData.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-white">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-gray-400">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          {orderData.tip > 0 && (
            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-700">
              <span className="text-white">{t?.tip || 'Pourboire'}</span>
              <span className="text-gray-400">${orderData.tip.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Formulaire Stripe */}
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#00FF41',
                colorBackground: '#1a1a2e',
                colorText: '#ffffff'
              }
            }
          }}
        >
          <CheckoutForm
            onSuccess={handleSuccess}
            onError={handleError}
            orderData={orderData}
            etablissementId={etablissementId}
            t={t}
          />
        </Elements>

        {/* Bouton annuler */}
        <button
          onClick={onCancel}
          className="w-full mt-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-xl font-medium transition-all"
        >
          {t?.cancel || 'Annuler'}
        </button>
      </div>
    </div>
  );
};

export default StripePayment;
