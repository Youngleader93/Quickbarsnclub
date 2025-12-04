/**
 * QuickBar Cloud Functions
 *
 * Fonctions de sécurité pour la validation des commandes:
 * - Validation de la structure des données
 * - Rate limiting (max 5 commandes/minute par IP)
 * - Validation des montants
 * - Protection contre le spam
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

// ============================================
// CONFIGURATION
// ============================================
const RATE_LIMIT = {
  maxRequests: 5,        // Max commandes par fenêtre
  windowMs: 60 * 1000,   // Fenêtre de 1 minute
};

const VALIDATION = {
  maxItemsPerOrder: 50,      // Max items par commande
  maxQuantityPerItem: 20,    // Max quantité par item
  maxTipPercentage: 100,     // Max 100% de pourboire
  maxOrderTotal: 10000,      // Max $10,000 par commande
  minOrderTotal: 0,          // Min $0 (commandes gratuites possibles si promos)
};

// ============================================
// RATE LIMITING - Stockage en mémoire simple
// Pour production à grande échelle, utiliser Redis
// ============================================
const rateLimitStore = new Map();

function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > RATE_LIMIT.windowMs * 2) {
      rateLimitStore.delete(key);
    }
  }
}

// Nettoyage périodique toutes les 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

function checkRateLimit(identifier) {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  let data = rateLimitStore.get(key);

  if (!data || now - data.windowStart > RATE_LIMIT.windowMs) {
    // Nouvelle fenêtre
    data = { windowStart: now, count: 1 };
    rateLimitStore.set(key, data);
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
  }

  if (data.count >= RATE_LIMIT.maxRequests) {
    const retryAfter = Math.ceil((data.windowStart + RATE_LIMIT.windowMs - now) / 1000);
    return { allowed: false, retryAfter, remaining: 0 };
  }

  data.count++;
  rateLimitStore.set(key, data);
  return { allowed: true, remaining: RATE_LIMIT.maxRequests - data.count };
}

// ============================================
// VALIDATION DES DONNÉES
// ============================================
function validateOrderData(data, etablissementId) {
  const errors = [];

  // Vérifier les champs obligatoires
  if (!data.items || !Array.isArray(data.items)) {
    errors.push('Le champ "items" est requis et doit être un tableau');
  }

  if (data.items && data.items.length === 0) {
    errors.push('La commande doit contenir au moins un item');
  }

  if (data.items && data.items.length > VALIDATION.maxItemsPerOrder) {
    errors.push(`Maximum ${VALIDATION.maxItemsPerOrder} items par commande`);
  }

  // Vérifier chaque item
  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item, index) => {
      if (!item.name || typeof item.name !== 'string') {
        errors.push(`Item ${index + 1}: nom invalide`);
      }

      if (typeof item.price !== 'number' || item.price < 0) {
        errors.push(`Item ${index + 1}: prix invalide`);
      }

      if (typeof item.quantity !== 'number' || item.quantity < 1) {
        errors.push(`Item ${index + 1}: quantité invalide`);
      }

      if (item.quantity > VALIDATION.maxQuantityPerItem) {
        errors.push(`Item ${index + 1}: quantité max ${VALIDATION.maxQuantityPerItem}`);
      }
    });
  }

  // Vérifier le numéro de commande (format: Lettre + 3 chiffres)
  if (!data.number || !/^[A-Z][0-9]{3}$/.test(data.number)) {
    errors.push('Numéro de commande invalide (format: A123)');
  }

  // Vérifier les montants
  if (typeof data.subtotal !== 'number' || data.subtotal < 0) {
    errors.push('Sous-total invalide');
  }

  if (typeof data.tip !== 'number' || data.tip < 0) {
    errors.push('Pourboire invalide');
  }

  if (typeof data.total !== 'number' || data.total < VALIDATION.minOrderTotal) {
    errors.push('Total invalide');
  }

  if (data.total > VALIDATION.maxOrderTotal) {
    errors.push(`Total maximum: $${VALIDATION.maxOrderTotal}`);
  }

  // Vérifier la cohérence des montants
  if (data.items && Array.isArray(data.items) && data.subtotal !== undefined) {
    const calculatedSubtotal = data.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Tolérance de 0.01 pour les erreurs d'arrondi
    if (Math.abs(calculatedSubtotal - data.subtotal) > 0.01) {
      errors.push('Sous-total ne correspond pas aux items');
    }
  }

  // Vérifier que total = subtotal + tip
  if (data.subtotal !== undefined && data.tip !== undefined && data.total !== undefined) {
    const expectedTotal = data.subtotal + data.tip;
    if (Math.abs(expectedTotal - data.total) > 0.01) {
      errors.push('Total ne correspond pas à sous-total + pourboire');
    }
  }

  // Vérifier le pourboire (max 100% du subtotal)
  if (data.subtotal > 0 && data.tip > data.subtotal * (VALIDATION.maxTipPercentage / 100)) {
    errors.push(`Pourboire maximum: ${VALIDATION.maxTipPercentage}% du sous-total`);
  }

  // Vérifier le statut
  if (data.status && data.status !== 'pending') {
    errors.push('Le statut initial doit être "pending"');
  }

  return errors;
}

// ============================================
// CLOUD FUNCTION: Créer une commande sécurisée
// ============================================
exports.createOrder = functions.https.onCall(async (data, context) => {
  try {
    // Extraire les données
    const { etablissementId, orderData } = data;

    // Vérifier que l'établissement est fourni
    if (!etablissementId || typeof etablissementId !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'ID établissement requis'
      );
    }

    // Rate limiting par IP (ou UID si authentifié)
    const identifier = context.rawRequest?.ip || context.auth?.uid || 'anonymous';
    const rateCheck = checkRateLimit(`${identifier}:${etablissementId}`);

    if (!rateCheck.allowed) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        `Trop de commandes. Réessayez dans ${rateCheck.retryAfter} secondes.`,
        { retryAfter: rateCheck.retryAfter }
      );
    }

    // Vérifier que l'établissement existe et accepte les commandes
    const etablissementRef = db.collection('etablissements').doc(etablissementId);
    const etablissementDoc = await etablissementRef.get();

    if (!etablissementDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Établissement non trouvé'
      );
    }

    const etablissementData = etablissementDoc.data();

    if (etablissementData.ordersOpen === false) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Les commandes sont actuellement fermées'
      );
    }

    // Valider les données de la commande
    const validationErrors = validateOrderData(orderData, etablissementId);

    if (validationErrors.length > 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Données de commande invalides',
        { errors: validationErrors }
      );
    }

    // Vérifier que les items du menu existent et sont disponibles
    const menuRef = etablissementRef.collection('menu');
    const menuSnapshot = await menuRef.get();
    const menuItems = new Map();

    menuSnapshot.forEach(doc => {
      menuItems.set(doc.id, { id: doc.id, ...doc.data() });
    });

    // Valider chaque item contre le menu réel
    for (const item of orderData.items) {
      if (item.id) {
        const menuItem = menuItems.get(item.id);
        if (!menuItem) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            `Item "${item.name}" non trouvé dans le menu`
          );
        }
        if (menuItem.available === false) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            `Item "${item.name}" n'est plus disponible`
          );
        }
        // Vérifier que le prix n'a pas été modifié côté client
        if (Math.abs(menuItem.price - item.price) > 0.01) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            `Prix incorrect pour "${item.name}"`
          );
        }
      }
    }

    // Créer la commande avec données sanitisées
    const sanitizedOrder = {
      number: orderData.number,
      items: orderData.items.map(item => ({
        id: item.id || null,
        name: String(item.name).substring(0, 100),
        price: Number(item.price.toFixed(2)),
        quantity: Math.min(Math.max(1, Math.floor(item.quantity)), VALIDATION.maxQuantityPerItem)
      })),
      subtotal: Number(orderData.subtotal.toFixed(2)),
      tip: Number(orderData.tip.toFixed(2)),
      total: Number(orderData.total.toFixed(2)),
      status: 'pending',
      timestamp: new Date().toISOString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // Métadonnées pour audit
      _meta: {
        createdVia: 'cloud-function',
        ipHash: identifier ? Buffer.from(identifier).toString('base64').substring(0, 10) : null,
        userAgent: context.rawRequest?.headers?.['user-agent']?.substring(0, 100) || null
      }
    };

    // Insérer la commande
    const commandeRef = await etablissementRef.collection('commandes').add(sanitizedOrder);

    console.log(`✅ Commande ${sanitizedOrder.number} créée pour ${etablissementId} (ID: ${commandeRef.id})`);

    return {
      success: true,
      orderId: commandeRef.id,
      orderNumber: sanitizedOrder.number,
      total: sanitizedOrder.total,
      remaining: rateCheck.remaining
    };

  } catch (error) {
    // Re-throw HttpsError as-is
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Log unexpected errors
    console.error('❌ Erreur création commande:', error);

    throw new functions.https.HttpsError(
      'internal',
      'Erreur lors de la création de la commande'
    );
  }
});

// ============================================
// CLOUD FUNCTION: Vérifier le statut d'une commande
// ============================================
exports.getOrderStatus = functions.https.onCall(async (data, context) => {
  const { etablissementId, orderId } = data;

  if (!etablissementId || !orderId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'ID établissement et ID commande requis'
    );
  }

  try {
    const orderDoc = await db
      .collection('etablissements')
      .doc(etablissementId)
      .collection('commandes')
      .doc(orderId)
      .get();

    if (!orderDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Commande non trouvée'
      );
    }

    const orderData = orderDoc.data();

    return {
      orderId: orderDoc.id,
      number: orderData.number,
      status: orderData.status,
      total: orderData.total,
      timestamp: orderData.timestamp
    };

  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    console.error('❌ Erreur récupération commande:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Erreur lors de la récupération de la commande'
    );
  }
});

// ============================================
// TRIGGER: Nettoyage automatique des vieilles commandes
// Exécuté chaque jour à 4h du matin
// ============================================
exports.cleanupOldOrders = functions.pubsub
  .schedule('0 4 * * *')
  .timeZone('Europe/Paris')
  .onRun(async (context) => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6); // 6 mois

    console.log(`🧹 Nettoyage des commandes avant ${cutoffDate.toISOString()}`);

    try {
      const etablissementsSnapshot = await db.collection('etablissements').get();
      let totalDeleted = 0;

      for (const etablissementDoc of etablissementsSnapshot.docs) {
        const commandesRef = etablissementDoc.ref.collection('commandes');
        const oldOrdersSnapshot = await commandesRef
          .where('timestamp', '<', cutoffDate.toISOString())
          .where('status', '==', 'delivered')
          .limit(500)
          .get();

        if (oldOrdersSnapshot.size > 0) {
          const batch = db.batch();
          oldOrdersSnapshot.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          totalDeleted += oldOrdersSnapshot.size;
          console.log(`  📁 ${etablissementDoc.id}: ${oldOrdersSnapshot.size} commandes supprimées`);
        }
      }

      console.log(`✅ Nettoyage terminé: ${totalDeleted} commandes supprimées`);
      return null;

    } catch (error) {
      console.error('❌ Erreur nettoyage:', error);
      return null;
    }
  });
