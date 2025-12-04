# Guide de déploiement des Cloud Functions QuickBar

## Prérequis

1. **Firebase CLI** installé globalement:
```bash
npm install -g firebase-tools
```

2. **Compte Firebase** avec le projet `quickbarsnclub` configuré

3. **Plan Blaze** (Pay-as-you-go) activé sur Firebase pour utiliser Cloud Functions

## Configuration

### 1. Connexion à Firebase
```bash
firebase login
```

### 2. Initialisation du projet (si pas encore fait)
```bash
cd C:\Users\young\quickbar
firebase init
```
Sélectionner:
- Firestore
- Functions
- Hosting (optionnel)

### 3. Installation des dépendances des Functions
```bash
cd functions
npm install
```

## Déploiement

### Déployer les règles Firestore
```bash
firebase deploy --only firestore:rules
```

### Déployer les Cloud Functions
```bash
firebase deploy --only functions
```

### Déployer tout
```bash
firebase deploy
```

## Fonctions disponibles

### `createOrder` (HTTPS Callable)
Crée une commande sécurisée avec:
- Validation de la structure des données
- Rate limiting (5 commandes/minute par IP)
- Vérification que l'établissement accepte les commandes
- Vérification des items contre le menu réel
- Validation des montants

**Utilisation côté client:**
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const createOrder = httpsCallable(functions, 'createOrder');

const result = await createOrder({
  etablissementId: 'demo',
  orderData: {
    number: 'A123',
    items: [...],
    subtotal: 25.00,
    tip: 5.00,
    total: 30.00,
    status: 'pending',
    timestamp: new Date().toISOString()
  }
});
```

### `getOrderStatus` (HTTPS Callable)
Récupère le statut d'une commande.

### `cleanupOldOrders` (Scheduled)
Nettoie automatiquement les commandes de plus de 6 mois (exécuté chaque jour à 4h).

## Monitoring

### Voir les logs
```bash
firebase functions:log
```

### Console Firebase
https://console.firebase.google.com/project/quickbarsnclub/functions

## Coûts estimés

Avec le plan Blaze, les Cloud Functions sont facturées:
- **Invocations:** 2M gratuites/mois, puis $0.40/million
- **Compute time:** 400K GB-secondes gratuites/mois
- **Réseau:** 5GB sortant gratuit/mois

Pour un bar moyen (~100 commandes/jour), coût estimé: **< $1/mois**

## Troubleshooting

### Erreur "PERMISSION_DENIED"
- Vérifier que les règles Firestore sont bien déployées
- Vérifier que l'utilisateur a le bon rôle dans la collection `users`

### Erreur "RESOURCE_EXHAUSTED"
- Rate limiting activé - attendre 1 minute

### Les commandes ne passent pas
1. Vérifier la console Firebase pour les logs
2. Vérifier que `ordersOpen: true` sur l'établissement
3. Vérifier que les items du menu sont `available: true`
