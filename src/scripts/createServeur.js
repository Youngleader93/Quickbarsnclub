/**
 * Script pour créer un compte serveur
 * Usage: node src/scripts/createServeur.js
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialiser Firebase Admin
const serviceAccount = require('../../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createServeur() {
  try {
    console.log('\n🍹 Création d\'un compte SERVEUR\n');

    // Demander les informations
    const email = await question('Email du serveur: ');
    const password = await question('Mot de passe (min 6 caractères): ');
    const displayName = await question('Nom d\'affichage (ex: Serveur 1): ');
    const etablissementId = await question('ID de l\'établissement (ex: phoenixclub): ');

    if (!email || !password || password.length < 6) {
      console.error('❌ Email et mot de passe (min 6 car.) requis');
      rl.close();
      return;
    }

    if (!etablissementId) {
      console.error('❌ ID d\'établissement requis');
      rl.close();
      return;
    }

    // Créer l'utilisateur dans Firebase Auth
    console.log('\n📝 Création du compte...');
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: displayName || email
    });

    console.log(`✅ Utilisateur créé: ${userRecord.uid}`);

    // Créer le document dans Firestore
    console.log('📝 Enregistrement dans Firestore...');
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      displayName: displayName || email,
      role: 'serveur',
      etablissementId: etablissementId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Document Firestore créé');
    console.log('\n✨ Compte serveur créé avec succès!');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Nom: ${displayName || email}`);
    console.log(`🏢 Établissement: ${etablissementId}`);
    console.log(`🔑 Rôle: serveur`);
    console.log(`🔗 Accès: https://quickbarsnclub.vercel.app/${etablissementId}/tablette`);
    console.log('\n⚠️  Le serveur n\'a accès QU\'À LA TABLETTE (pas à l\'admin)\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    rl.close();
    process.exit();
  }
}

createServeur();
