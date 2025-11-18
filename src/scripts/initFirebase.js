/**
 * Script d'initialisation Firebase
 *
 * Ce script crée automatiquement la structure Firestore complète :
 * - Collection users (avec super_admin)
 * - Collection etablissements (avec club-test)
 * - Sous-collection menu (avec items de test)
 *
 * UTILISATION :
 * 1. Assurez-vous que votre .env est configuré avec les nouvelles clés Firebase
 * 2. Exécutez : node src/scripts/initFirebase.js
 * 3. Suivez les instructions à l'écran
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const readline = require('readline');

// Configuration Firebase depuis variables d'environnement
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Interface pour poser des questions
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Données de test pour le menu
const menuItems = [
  {
    name: 'Burger Classic',
    price: 12.50,
    category: 'plats',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Pizza Margherita',
    price: 14.00,
    category: 'plats',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Salade César',
    price: 10.50,
    category: 'plats',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Pâtes Carbonara',
    price: 13.00,
    category: 'plats',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Fish & Chips',
    price: 15.50,
    category: 'plats',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Coca Cola',
    price: 3.50,
    category: 'boissons',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Sprite',
    price: 3.50,
    category: 'boissons',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Bière Heineken',
    price: 5.50,
    category: 'boissons',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Eau Minérale',
    price: 2.50,
    category: 'boissons',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Jus d\'Orange',
    price: 4.00,
    category: 'boissons',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Tiramisu',
    price: 6.00,
    category: 'desserts',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Crème Brûlée',
    price: 6.50,
    category: 'desserts',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Tarte Tatin',
    price: 7.00,
    category: 'desserts',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Mousse au Chocolat',
    price: 5.50,
    category: 'desserts',
    available: true,
    createdAt: new Date().toISOString()
  },
  {
    name: 'Cheesecake',
    price: 6.50,
    category: 'desserts',
    available: true,
    createdAt: new Date().toISOString()
  }
];

async function initializeFirebase() {
  console.log('\n🚀 SCRIPT D\'INITIALISATION FIREBASE QUICKBAR\n');
  console.log('Ce script va créer la structure complète Firestore.\n');

  try {
    // Étape 1 : Demander l'UID de l'utilisateur admin
    console.log('📋 ÉTAPE 1/4 : Configuration Utilisateur Admin\n');
    console.log('Pour récupérer votre UID :');
    console.log('1. Allez sur https://console.firebase.google.com');
    console.log('2. Sélectionnez votre projet');
    console.log('3. Authentication → Users');
    console.log('4. Copiez l\'UID de votre utilisateur admin\n');

    const adminUid = await question('Entrez l\'UID de votre utilisateur admin : ');

    if (!adminUid || adminUid.trim().length < 10) {
      console.log('\n❌ UID invalide. Abandon.');
      rl.close();
      return;
    }

    const adminEmail = await question('Entrez l\'email de cet admin : ');
    const adminName = await question('Entrez le nom d\'affichage (ex: Super Admin) : ');

    // Étape 2 : Créer le document user
    console.log('\n📝 ÉTAPE 2/4 : Création du document utilisateur...');

    const userRef = doc(db, 'users', adminUid.trim());
    await setDoc(userRef, {
      email: adminEmail.trim(),
      displayName: adminName.trim() || 'Super Admin',
      role: 'super_admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Utilisateur super_admin créé avec succès !');

    // Étape 3 : Créer l'établissement club-test
    console.log('\n🏢 ÉTAPE 3/4 : Création de l\'établissement "club-test"...');

    const clubRef = doc(db, 'etablissements', 'club-test');
    await setDoc(clubRef, {
      nom: 'Club Test',
      actif: true,
      ordersOpen: true,
      wifiSSID: 'WiFi-ClubTest',
      wifiPassword: 'test1234',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    console.log('✅ Établissement "club-test" créé avec succès !');

    // Étape 4 : Créer les items du menu
    console.log('\n🍔 ÉTAPE 4/4 : Création des items du menu...');
    console.log(`Ajout de ${menuItems.length} items...`);

    let count = 0;
    for (const item of menuItems) {
      // Utiliser un ID auto-généré par Firebase
      const menuRef = doc(collection(db, 'etablissements', 'club-test', 'menu'));
      await setDoc(menuRef, item);
      count++;
      process.stdout.write(`\r✅ ${count}/${menuItems.length} items créés`);
    }

    console.log('\n\n🎉 INITIALISATION TERMINÉE AVEC SUCCÈS !\n');
    console.log('Structure créée :');
    console.log('├── users/');
    console.log(`│   └── ${adminUid.trim()}/`);
    console.log('│       └── role: super_admin');
    console.log('└── etablissements/');
    console.log('    └── club-test/');
    console.log('        ├── nom: "Club Test"');
    console.log('        ├── ordersOpen: true');
    console.log(`        └── menu/ (${menuItems.length} items)`);
    console.log('            ├── Plats (5 items)');
    console.log('            ├── Boissons (5 items)');
    console.log('            └── Desserts (5 items)\n');

    console.log('🔗 Testez votre application :');
    console.log('   - Interface Admin : http://localhost:3000/admin');
    console.log('   - Interface Client : http://localhost:3000/club-test');
    console.log('   - Interface Tablette : http://localhost:3000/club-test/tablette\n');

  } catch (error) {
    console.error('\n❌ ERREUR lors de l\'initialisation :', error);
    console.error('\nVérifiez :');
    console.error('1. Que votre fichier .env contient les bonnes clés Firebase');
    console.error('2. Que Firestore est activé dans votre projet Firebase');
    console.error('3. Que les règles Firestore autorisent l\'écriture\n');
  } finally {
    rl.close();
  }
}

// Exécuter le script
initializeFirebase();
