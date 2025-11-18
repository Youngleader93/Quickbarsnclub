# Guide de Recréation Architecture Firebase

## Vue d'ensemble

Ce guide vous permet de recréer entièrement la structure Firebase de QuickBar sur un nouveau projet.

---

## ÉTAPE 1 : Configuration Projet Firebase

### 1.1 Créer le Projet
1. Allez sur https://console.firebase.google.com
2. Cliquez sur **Créer un projet**
3. Nom du projet : `quickbar-v2` (ou autre nom)
4. Désactivez Google Analytics (optionnel)
5. Cliquez sur **Créer le projet**

### 1.2 Activer Authentication
1. Dans le menu latéral → **Authentication**
2. Cliquez sur **Commencer**
3. Onglet **Sign-in method**
4. Activez **Email/Password**
5. Cliquez sur **Enregistrer**

### 1.3 Créer un Utilisateur Admin
1. Onglet **Users**
2. Cliquez sur **Ajouter un utilisateur**
3. Email : `admin@quickbar.com` (ou votre email)
4. Mot de passe : Choisissez un mot de passe sécurisé
5. Cliquez sur **Ajouter un utilisateur**
6. **IMPORTANT** : Notez l'UID de cet utilisateur (ex: `ZeV8UmDJUVRDeTZvHB2JzuAA5FX2`)

### 1.4 Créer la Base de Données Firestore
1. Dans le menu latéral → **Firestore Database**
2. Cliquez sur **Créer une base de données**
3. Mode : **Commencer en mode test** (on changera les règles après)
4. Région : Choisissez la plus proche (ex: `us-east1`)
5. Cliquez sur **Activer**

### 1.5 Récupérer les Clés de Configuration
1. Allez dans **Project Settings** (⚙️ en haut à gauche)
2. Section **Vos applications** → Cliquez sur l'icône Web `</>`
3. Nom de l'app : `QuickBar Web`
4. NE PAS cocher Firebase Hosting
5. Cliquez sur **Enregistrer l'application**
6. **Copiez les valeurs de configuration** :
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## ÉTAPE 2 : Configuration Locale

### 2.1 Mettre à Jour le Fichier .env

Ouvrez le fichier `.env` à la racine du projet et remplacez TOUTES les valeurs :

```bash
# Firebase Configuration - NOUVEAU PROJET
REACT_APP_FIREBASE_API_KEY=votre_nouvelle_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=votre_nouveau_projet.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=votre_nouveau_projet_id
REACT_APP_FIREBASE_STORAGE_BUCKET=votre_nouveau_projet.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
REACT_APP_FIREBASE_APP_ID=votre_app_id
```

### 2.2 Tester la Connexion

```bash
npm start
```

Vérifiez dans la console du navigateur qu'il n'y a pas d'erreur Firebase.

---

## ÉTAPE 3 : Créer la Structure Firestore

### 3.1 Collection `users`

1. Dans Firestore Database → **Démarrer la collection**
2. ID de la collection : `users`
3. ID du document : **Utilisez l'UID de votre utilisateur admin** (récupéré à l'étape 1.3)
4. Ajoutez les champs :

| Champ | Type | Valeur |
|-------|------|--------|
| `email` | string | `admin@quickbar.com` |
| `displayName` | string | `Super Admin` |
| `role` | string | `super_admin` |
| `createdAt` | string | `2025-01-04T12:00:00Z` |
| `updatedAt` | string | `2025-01-04T12:00:00Z` |

5. Cliquez sur **Enregistrer**

**Note** : Les super_admin n'ont PAS besoin du champ `clubAccess`.

### 3.2 Collection `etablissements` - Club Test

1. Créez une nouvelle collection : `etablissements`
2. ID du document : `club-test` (ID personnalisé important !)
3. Ajoutez les champs :

| Champ | Type | Valeur |
|-------|------|--------|
| `nom` | string | `Club Test` |
| `actif` | boolean | `true` |
| `ordersOpen` | boolean | `true` |
| `wifiSSID` | string | `WiFi-ClubTest` |
| `wifiPassword` | string | `test1234` |
| `createdAt` | string | `2025-01-04T12:00:00Z` |
| `updatedAt` | string | `2025-01-04T12:00:00Z` |

4. Cliquez sur **Enregistrer**

### 3.3 Sous-collection `menu` du Club Test

1. Sélectionnez le document `club-test`
2. Cliquez sur **Démarrer une collection**
3. ID de la collection : `menu`
4. Créez plusieurs items de menu (laissez Firebase générer les IDs auto) :

**Item 1 - Burger Classic**
| Champ | Type | Valeur |
|-------|------|--------|
| `name` | string | `Burger Classic` |
| `price` | number | `12.50` |
| `category` | string | `plats` |
| `available` | boolean | `true` |
| `createdAt` | string | `2025-01-04T12:00:00Z` |

**Item 2 - Coca Cola**
| Champ | Type | Valeur |
|-------|------|--------|
| `name` | string | `Coca Cola` |
| `price` | number | `3.50` |
| `category` | string | `boissons` |
| `available` | boolean | `true` |
| `createdAt` | string | `2025-01-04T12:00:00Z` |

**Item 3 - Tiramisu**
| Champ | Type | Valeur |
|-------|------|--------|
| `name` | string | `Tiramisu` |
| `price` | number | `6.00` |
| `category` | string | `desserts` |
| `available` | boolean | `true` |
| `createdAt` | string | `2025-01-04T12:00:00Z` |

**Item 4 - Pizza Margherita**
| Champ | Type | Valeur |
|-------|------|--------|
| `name` | string | `Pizza Margherita` |
| `price` | number | `14.00` |
| `category` | string | `plats` |
| `available` | boolean | `true` |
| `createdAt` | string | `2025-01-04T12:00:00Z` |

**Item 5 - Bière Heineken**
| Champ | Type | Valeur |
|-------|------|--------|
| `name` | string | `Bière Heineken` |
| `price` | number | `5.50` |
| `category` | string | `boissons` |
| `available` | boolean | `true` |
| `createdAt` | string | `2025-01-04T12:00:00Z` |

5. Créez autant d'items que vous le souhaitez en suivant ce modèle

### 3.4 Sous-collection `commandes` (Optionnel - Vide au départ)

Cette collection sera créée automatiquement quand les clients passeront des commandes.

Si vous voulez la créer manuellement :
1. Dans le document `club-test` → **Démarrer une collection**
2. ID : `commandes`
3. Vous pouvez la laisser vide ou créer une commande de test

---

## ÉTAPE 4 : Configurer les Règles Firestore

1. Dans Firestore Database → Onglet **Règles**
2. Remplacez TOUT le contenu par :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Collection users
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }

    // Collection etablissements
    match /etablissements/{etablissementId} {
      allow read: if true;
      allow write: if request.auth != null;

      match /menu/{menuId} {
        allow read: if true;
        allow write: if request.auth != null;
      }

      match /commandes/{commandeId} {
        allow read: if true;
        allow write: if true;  // Clients non-auth peuvent créer commandes
      }
    }
  }
}
```

3. Cliquez sur **Publier**

---

## ÉTAPE 5 : Tester l'Application

### 5.1 Connexion Admin
1. Allez sur http://localhost:3000/admin/login
2. Email : `admin@quickbar.com`
3. Mot de passe : celui que vous avez créé
4. Vous devriez arriver sur le dashboard Super Admin

### 5.2 Tester Interface Client
1. Allez sur http://localhost:3000/club-test
2. Vous devriez voir le menu avec les items créés
3. Testez une commande

### 5.3 Tester Interface Tablette
1. Allez sur http://localhost:3000/club-test/tablette
2. Vous devriez voir les commandes en attente

---

## ÉTAPE 6 : Déploiement Vercel (Optionnel)

### 6.1 Créer un Nouveau Repo GitHub
1. Créez un nouveau repository sur GitHub (ex: `quickbar-v2`)
2. NE PAS initialiser avec README

```bash
git remote remove origin
git remote add origin https://github.com/VotreUsername/quickbar-v2.git
git branch -M main
git push -u origin main
```

### 6.2 Configurer Vercel
1. Allez sur https://vercel.com
2. **Importez** le nouveau repository
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les 6 variables Firebase (même valeurs que .env)
5. Redéployez

---

## 📋 Checklist de Vérification

- [ ] Projet Firebase créé
- [ ] Authentication activée (Email/Password)
- [ ] Utilisateur admin créé et UID noté
- [ ] Firestore Database activée
- [ ] Collection `users` créée avec document super_admin
- [ ] Collection `etablissements` créée avec `club-test`
- [ ] Sous-collection `menu` créée avec items de test
- [ ] Règles Firestore configurées
- [ ] Fichier .env local mis à jour
- [ ] Application testée localement
- [ ] Login admin fonctionne
- [ ] Interface client fonctionne
- [ ] Interface tablette fonctionne

---

## 🚀 Prochaines Étapes

Une fois la structure de base créée :

1. **Ajouter d'autres clubs** via l'interface `/admin/clubs`
2. **Ajouter d'autres utilisateurs** via l'interface `/admin/users`
3. **Personnaliser les menus** via `/{club-id}/admin`

---

## 🆘 Résolution de Problèmes

### Erreur "Permission denied"
- Vérifiez que les règles Firestore sont bien publiées
- Vérifiez que l'utilisateur est authentifié

### Menu vide sur l'interface client
- Vérifiez que la sous-collection `menu` existe bien dans `club-test`
- Vérifiez que les items ont `available: true`

### Impossible de se connecter
- Vérifiez que l'email/mot de passe sont corrects
- Vérifiez que le document `users/{uid}` existe avec `role: "super_admin"`

### Variables d'environnement non reconnues
- Redémarrez le serveur `npm start`
- Vérifiez que le fichier `.env` est à la racine du projet
- Vérifiez que les noms de variables commencent par `REACT_APP_`

---

**Guide créé le 04 Janvier 2025**
**Pour : QuickBar v2 - Nouveau projet Firebase**
