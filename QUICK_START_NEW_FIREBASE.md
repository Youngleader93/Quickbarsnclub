# QuickBar - Démarrage Rapide Nouveau Firebase

## 🚀 Procédure Express (15 minutes)

Vous avez créé un nouveau projet Firebase et voulez recréer l'architecture QuickBar ? Suivez ces étapes.

---

## Option 1 : Script Automatique (RECOMMANDÉ)

### Prérequis
1. Nouveau projet Firebase créé sur https://console.firebase.google.com
2. Authentication activée (Email/Password)
3. Un utilisateur admin créé dans Authentication
4. Firestore Database activée (mode test)

### Étapes

**1. Récupérez vos nouvelles clés Firebase**
- Firebase Console → Project Settings → Your apps → Web
- Copiez les 6 valeurs de configuration

**2. Mettez à jour le fichier .env**
```bash
REACT_APP_FIREBASE_API_KEY=votre_nouvelle_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=votre_projet_id
REACT_APP_FIREBASE_STORAGE_BUCKET=votre_projet.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
REACT_APP_FIREBASE_APP_ID=votre_app_id
```

**3. Installez dotenv (si pas déjà fait)**
```bash
npm install dotenv
```

**4. Exécutez le script d'initialisation**
```bash
node src/scripts/initFirebase.js
```

**5. Suivez les instructions à l'écran**
- Entrez l'UID de votre admin (depuis Firebase Console → Authentication → Users)
- Entrez l'email et le nom d'affichage
- Le script créera automatiquement toute la structure !

**6. Configurez les règles Firestore**

Firebase Console → Firestore Database → Règles

Remplacez le contenu par :
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
    match /etablissements/{etablissementId} {
      allow read: if true;
      allow write: if request.auth != null;
      match /menu/{menuId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
      match /commandes/{commandeId} {
        allow read: if true;
        allow write: if true;
      }
    }
  }
}
```

Cliquez sur **Publier**.

**7. Testez l'application**
```bash
npm start
```

Testez les URLs :
- http://localhost:3000/admin/login
- http://localhost:3000/club-test
- http://localhost:3000/club-test/tablette

---

## Option 2 : Configuration Manuelle

Si vous préférez créer la structure manuellement, consultez le guide détaillé :

📖 **[FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)**

---

## ✅ Structure Créée Automatiquement

Le script crée :

```
Firestore/
├── users/
│   └── {votre-uid}/
│       ├── email: "admin@quickbar.com"
│       ├── displayName: "Super Admin"
│       ├── role: "super_admin"
│       └── timestamps
│
└── etablissements/
    └── club-test/
        ├── nom: "Club Test"
        ├── actif: true
        ├── ordersOpen: true
        ├── wifiSSID: "WiFi-ClubTest"
        ├── wifiPassword: "test1234"
        ├── timestamps
        │
        └── menu/ (15 items)
            ├── 5 Plats (Burger, Pizza, Salade, Pâtes, Fish&Chips)
            ├── 5 Boissons (Coca, Sprite, Bière, Eau, Jus)
            └── 5 Desserts (Tiramisu, Crème Brûlée, Tarte, Mousse, Cheesecake)
```

---

## 🔐 Sécurité Post-Installation

### 1. Vérifiez les Règles Firestore
- Mode test expire après 30 jours
- Configurez les règles de production (voir ci-dessus)

### 2. Configurez App Check (Recommandé)
- Firebase Console → App Check
- Protège contre les abus et le spam

### 3. Restrictions API (Optionnel)
- Project Settings → Restrictions API
- Limitez les domaines autorisés

---

## 🆘 Dépannage

### "Module not found: dotenv"
```bash
npm install dotenv
```

### "Permission denied" lors du script
Vérifiez que Firestore est en mode test ou que les règles autorisent l'écriture temporairement.

### "UID invalide"
L'UID doit faire au moins 10 caractères. Copiez-le directement depuis Firebase Console → Authentication.

### Menu vide après initialisation
1. Vérifiez dans Firebase Console que la sous-collection `menu` existe
2. Vérifiez les règles Firestore
3. Relancez le script

---

## 📚 Documentation Complète

- **Guide d'installation détaillé** : [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)
- **Architecture du projet** : [CONTEXT.md](./CONTEXT.md)
- **Script d'initialisation** : [src/scripts/initFirebase.js](./src/scripts/initFirebase.js)

---

## 🎯 Prochaines Étapes

Après l'initialisation :

1. **Ajoutez d'autres clubs** : http://localhost:3000/admin/clubs
2. **Ajoutez d'autres utilisateurs** : http://localhost:3000/admin/users
3. **Personnalisez le menu** : http://localhost:3000/club-test/admin
4. **Déployez sur Vercel** (configurez les variables d'environnement)

---

**Guide créé le 04 Janvier 2025**
