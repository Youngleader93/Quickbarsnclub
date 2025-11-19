import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, addDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Eye, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

const PendingClubRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    // Écouter les demandes en attente
    const q = query(
      collection(db, 'club_requests'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsData.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const approveRequest = async (request) => {
    if (!window.confirm(`Approuver la demande de "${request.nom}" ?`)) {
      return;
    }

    setProcessing(request.id);

    try {
      // 1. Créer l'établissement
      await setDoc(doc(db, 'etablissements', request.etablissementId), {
        nom: request.nom,
        adresse: request.adresse || '',
        type: request.type || 'nightclub',
        actif: true,
        horaires: request.horaires || {},
        createdAt: serverTimestamp(),
        createdBy: 'system',
        telephone: request.telephone,
        contactEmail: request.email
      });

      // 2. Importer le menu
      if (request.menuItems && request.menuItems.length > 0) {
        for (const item of request.menuItems) {
          await addDoc(collection(db, 'etablissements', request.etablissementId, 'menu'), {
            name: item.nom,
            price: item.prix,
            category: item.categorie,
            description: item.description || '',
            available: true,
            createdAt: serverTimestamp()
          });
        }
      }

      // 3. Créer le compte admin
      const generatedPassword = generatePassword();
      let userCredential;
      let userId;

      try {
        userCredential = await createUserWithEmailAndPassword(auth, request.email, generatedPassword);
        userId = userCredential.user.uid;
      } catch (authError) {
        console.error('Erreur création compte Auth:', authError);
        throw new Error(`Impossible de créer le compte: ${authError.message}`);
      }

      // 4. Créer le document user
      await setDoc(doc(db, 'users', userId), {
        email: request.email,
        role: 'club_admin',
        etablissements: [request.etablissementId],
        displayName: request.nom,
        createdAt: serverTimestamp()
      });

      // 5. Marquer la demande comme approuvée
      await updateDoc(doc(db, 'club_requests', request.id), {
        status: 'approved',
        approvedAt: serverTimestamp(),
        generatedPassword: generatedPassword
      });

      alert(`✅ Établissement "${request.nom}" approuvé avec succès !\n\nEmail: ${request.email}\nMot de passe: ${generatedPassword}\n\n⚠️ Copiez ce mot de passe et envoyez-le au gérant !`);

    } catch (error) {
      console.error('Erreur approbation:', error);
      alert(`❌ Erreur lors de l'approbation: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const rejectRequest = async (requestId) => {
    if (!window.confirm('Rejeter cette demande définitivement ?')) {
      return;
    }

    setProcessing(requestId);

    try {
      await updateDoc(doc(db, 'club_requests', requestId), {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      });
      alert('Demande rejetée');
    } catch (error) {
      console.error('Erreur rejet:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const deleteRequest = async (requestId) => {
    if (!window.confirm('Supprimer définitivement cette demande ?')) {
      return;
    }

    setProcessing(requestId);

    try {
      await deleteDoc(doc(db, 'club_requests', requestId));
      alert('Demande supprimée');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Chargement des demandes...
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-12 text-center">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-2xl font-bold text-white mb-2">Aucune demande en attente</h3>
        <p className="text-gray-400">
          Les nouvelles demandes d'inscription apparaîtront ici
        </p>
        <div className="mt-6">
          <a
            href="/register-club"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
          >
            Tester le formulaire d'inscription
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          Demandes en attente ({requests.length})
        </h2>
        <a
          href="/register-club"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-all"
        >
          Voir le formulaire
        </a>
      </div>

      {requests.map(request => (
        <div
          key={request.id}
          className="bg-gray-900/30 backdrop-blur-sm rounded-2xl overflow-hidden"
        >
          {/* HEADER */}
          <div className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-white">{request.nom}</h3>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-mono rounded-full">
                    PENDING
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-400">
                  <div>📧 {request.email}</div>
                  <div>📱 {request.telephone}</div>
                  <div>🆔 /{request.etablissementId}</div>
                  <div>📅 {request.createdAt ? new Date(request.createdAt.seconds * 1000).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Date inconnue'}</div>
                  <div>🍹 {request.menuItems?.length || 0} items au menu</div>
                </div>
              </div>

              <div className="flex gap-3 w-full lg:w-auto">
                <button
                  onClick={() => approveRequest(request)}
                  disabled={processing === request.id}
                  className="flex-1 lg:flex-none px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  {processing === request.id ? 'En cours...' : 'Approuver'}
                </button>
                <button
                  onClick={() => rejectRequest(request.id)}
                  disabled={processing === request.id}
                  className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={() => toggleExpand(request.id)}
                  className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all"
                >
                  {expandedId === request.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* DÉTAILS EXPANDABLES */}
          {expandedId === request.id && (
            <div className="border-t border-gray-700 p-6 bg-gray-800/30">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* INFO ÉTABLISSEMENT */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-4">Informations</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white font-medium capitalize">{request.type}</span>
                    </div>
                    {request.adresse && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Adresse:</span>
                        <span className="text-white font-medium text-right">{request.adresse}</span>
                      </div>
                    )}
                    {request.message && (
                      <div>
                        <span className="text-gray-400">Message:</span>
                        <p className="text-white mt-1 p-3 bg-gray-700/50 rounded-lg">{request.message}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* HORAIRES */}
                <div>
                  <h4 className="text-lg font-bold text-white mb-4">Horaires</h4>
                  <div className="space-y-2 text-sm">
                    {request.horaires && Object.entries(request.horaires).map(([jour, info]) => (
                      <div key={jour} className="flex items-center justify-between">
                        <span className="text-gray-400 capitalize">{jour}:</span>
                        <span className="text-white font-medium">
                          {info.ouvert ? `${info.debut} - ${info.fin}` : 'Fermé'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MENU */}
              {request.menuItems && request.menuItems.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-white mb-4">
                    Menu ({request.menuItems.length} items)
                  </h4>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {request.menuItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono px-2 py-1 bg-green-500/20 text-green-400 rounded">
                              {item.categorie}
                            </span>
                            <span className="text-white font-semibold">{item.nom}</span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                          )}
                        </div>
                        <span className="text-green-400 font-bold text-lg">{item.prix}€</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTIONS SUPPLÉMENTAIRES */}
              <div className="mt-6 pt-6 border-t border-gray-700 flex justify-end">
                <button
                  onClick={() => deleteRequest(request.id)}
                  disabled={processing === request.id}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  Supprimer la demande
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PendingClubRequests;
