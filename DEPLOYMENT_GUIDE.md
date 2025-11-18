# Guide de Déploiement sur Vercel

## Prérequis

1. Un compte GitHub
2. Un compte Vercel (gratuit)
3. Git installé sur votre machine

## Étape 1 : Préparer le Repository Git

### 1.1 Initialiser Git (si pas déjà fait)
```bash
git init
git add .
git commit -m "Initial commit - Ready for Vercel deployment"
```

### 1.2 Créer un Repository sur GitHub

1. Allez sur https://github.com/new
2. Créez un nouveau repository **PRIVÉ** (important pour protéger vos clés Firebase)
3. Ne cochez PAS "Initialize this repository with a README"

### 1.3 Connecter votre projet local au repository GitHub

```bash
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
git branch -M main
git push -u origin main
```

## Étape 2 : Déployer sur Vercel

### 2.1 Méthode 1 : Via le Dashboard Vercel (Recommandé)

1. **Allez sur Vercel**
   - Visitez https://vercel.com
   - Connectez-vous avec votre compte GitHub

2. **Importer le Project**
   - Cliquez sur "Add New..." → "Project"
   - Sélectionnez votre repository GitHub `quickbar`

3. **Configurer les Variables d'Environnement**
   - Dans la section "Environment Variables", ajoutez les variables suivantes :

   ```
   REACT_APP_FIREBASE_API_KEY=AIzaSyAzfR5GGJQ-2o7WXOWyMxvIGbF68k80JvM
   REACT_APP_FIREBASE_AUTH_DOMAIN=quickbarsnclubs.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=quickbarsnclubs
   REACT_APP_FIREBASE_STORAGE_BUCKET=quickbarsnclubs.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=673854990229
   REACT_APP_FIREBASE_APP_ID=1:673854990229:web:a0e28ba0d63bdda3aa7edc
   REACT_APP_FIREBASE_MEASUREMENT_ID=G-FTMWHH3E0T
   ```

   ⚠️ **IMPORTANT** : Ces variables doivent être ajoutées à TOUS les environnements (Production, Preview, Development)

4. **Déployer**
   - Cliquez sur "Deploy"
   - Vercel va automatiquement :
     - Détecter qu'il s'agit d'une app React
     - Installer les dépendances (`npm install`)
     - Builder l'application (`npm run build`)
     - Déployer sur un CDN global

5. **Vérifier le déploiement**
   - Une fois terminé, Vercel vous donnera une URL (ex: `https://quickbar-xyz.vercel.app`)
   - Testez votre application !

### 2.2 Méthode 2 : Via la CLI Vercel

1. **Installer Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Se connecter**
   ```bash
   vercel login
   ```

3. **Déployer**
   ```bash
   vercel
   ```

   - Suivez les instructions
   - Quand demandé pour les variables d'environnement, vous pouvez les ajouter manuellement ou via le dashboard

4. **Pour déployer en production**
   ```bash
   vercel --prod
   ```

## Étape 3 : Configurer les Variables d'Environnement (si pas fait à l'étape 2.1)

1. Allez dans votre projet sur Vercel Dashboard
2. Cliquez sur "Settings" → "Environment Variables"
3. Ajoutez toutes les variables `REACT_APP_FIREBASE_*` mentionnées ci-dessus
4. **Redéployez** : Settings → Deployments → trois points sur le dernier déploiement → "Redeploy"

## Étape 4 : Déploiements Automatiques

Vercel est maintenant connecté à votre repository GitHub. À chaque `git push` :
- Les commits sur `main` déploient automatiquement en **Production**
- Les commits sur d'autres branches créent des **Preview Deployments**

## Commandes Git pour les futures mises à jour

```bash
# Après avoir fait des modifications
git add .
git commit -m "Description des changements"
git push

# Vercel déploiera automatiquement !
```

## Vérifications Post-Déploiement

✅ L'application se charge correctement
✅ Firebase fonctionne (connexion, authentification)
✅ Les routes fonctionnent (/{clubId}, /{clubId}/admin, etc.)
✅ Les variables d'environnement sont bien configurées

## Troubleshooting

### Erreur : "Firebase not configured"
→ Vérifiez que toutes les variables d'environnement sont bien configurées dans Vercel

### Erreur 404 sur les routes
→ Le fichier `vercel.json` devrait gérer cela. Vérifiez qu'il est bien présent dans le repository

### Build échoue
→ Vérifiez les logs de build dans Vercel Dashboard
→ Assurez-vous que `npm run build` fonctionne localement

## Domaine Personnalisé (Optionnel)

1. Dans Vercel Dashboard → Settings → Domains
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions pour configurer les DNS

## Sécurité

⚠️ **IMPORTANT**
- Le repository GitHub doit rester **PRIVÉ**
- Ne jamais committer le fichier `.env`
- Les clés Firebase sont configurées comme variables d'environnement sur Vercel
- Configurez les règles de sécurité Firestore en production

## Support

- Documentation Vercel : https://vercel.com/docs
- En cas de problème, vérifiez les logs dans Vercel Dashboard → Deployments
