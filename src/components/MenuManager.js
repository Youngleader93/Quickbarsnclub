import React, { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Edit2, Trash2, Save, X, AlertCircle, Coffee, Pizza, Beer, Check, Upload, Download } from 'lucide-react';


const MenuManager = ({ etablissementId = 'club-test' }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'plat' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Categories disponibles
  const categories = [
    { id: 'boisson', label: 'Boissons', icon: Beer },
    { id: 'plat', label: 'Plats', icon: Pizza },
    { id: 'dessert', label: 'Desserts', icon: Coffee }
  ];

  // Charger les items du menu
  useEffect(() => {
    const q = query(
      collection(db, 'etablissements', etablissementId, 'menu'),
      orderBy('category'),
      orderBy('name')
    );
    
    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMenuItems(items);
        setLoading(false);
        setError(''); // Clear any previous errors
      },
      (error) => {
        console.error('Erreur chargement menu:', error);
        // Don't show error if it's just permissions for empty collection
        // User can still add items
        setMenuItems([]);
        setLoading(false);
        // Only show error in console, not to user
      }
    );
    
    return () => unsubscribe();
  }, [etablissementId]);

  // Afficher message temporaire
  const showMessage = (type, message) => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(message);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Ajouter un item
  const handleAddItem = async () => {
    if (!newItem.name.trim() || !newItem.price) {
      showMessage('error', 'Nom et prix requis');
      return;
    }

    const price = parseFloat(newItem.price);
    if (isNaN(price) || price < 0) {
      showMessage('error', 'Prix invalide');
      return;
    }

    try {
      await addDoc(collection(db, 'etablissements', etablissementId, 'menu'), {
        name: newItem.name.trim(),
        price: price,
        category: newItem.category,
        available: true,
        createdAt: new Date().toISOString()
      });
      
      setNewItem({ name: '', price: '', category: 'plat' });
      setShowAddForm(false);
      showMessage('success', 'Item ajouté avec succès');
    } catch (error) {
      console.error('Erreur ajout:', error);
      showMessage('error', 'Erreur lors de l\'ajout');
    }
  };

  // Commencer l'édition
  const startEdit = (item) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category || 'plat'
    });
  };

  // Sauvegarder les modifications
  const handleSaveEdit = async () => {
    if (!editingItem.name.trim() || !editingItem.price) {
      showMessage('error', 'Nom et prix requis');
      return;
    }

    const price = parseFloat(editingItem.price);
    if (isNaN(price) || price < 0) {
      showMessage('error', 'Prix invalide');
      return;
    }

    try {
      await updateDoc(doc(db, 'etablissements', etablissementId, 'menu', editingItem.id), {
        name: editingItem.name.trim(),
        price: price,
        category: editingItem.category,
        updatedAt: new Date().toISOString()
      });
      
      setEditingItem(null);
      showMessage('success', 'Modifications sauvegardées');
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      showMessage('error', 'Erreur lors de la sauvegarde');
    }
  };

  // Toggle disponibilité
  const toggleAvailability = async (item) => {
    try {
      await updateDoc(doc(db, 'etablissements', etablissementId, 'menu', item.id), {
        available: !item.available,
        updatedAt: new Date().toISOString()
      });
      
      showMessage('success', `${item.name} ${!item.available ? 'disponible' : 'indisponible'}`);
    } catch (error) {
      console.error('Erreur toggle:', error);
      showMessage('error', 'Erreur lors de la modification');
    }
  };

  // Supprimer un item
  const handleDelete = async (itemId, itemName) => {
    if (!window.confirm(`Supprimer "${itemName}" du menu ?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'etablissements', etablissementId, 'menu', itemId));
      showMessage('success', 'Item supprimé');
    } catch (error) {
      console.error('Erreur suppression:', error);
      showMessage('error', 'Erreur lors de la suppression');
    }
  };

  // Télécharger template CSV
  const downloadTemplate = () => {
    const csvContent = `name,price,category,description
Vodka Red Bull,12.00,boisson,Vodka premium avec Red Bull
Mojito,10.00,boisson,Mojito classique menthe citron
Whisky Coca,11.00,boisson,Jack Daniel's avec Coca-Cola
Champagne Moët,150.00,boisson,Bouteille de Moët & Chandon
Nachos,8.00,plat,Nachos avec guacamole et salsa
Wings,9.00,plat,Ailes de poulet Buffalo style
Burger,12.00,plat,Burger classique avec frites
Tiramisu,6.00,dessert,Tiramisu maison`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'menu_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showMessage('success', 'Template téléchargé');
  };

  // Parser CSV
  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const items = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length >= 3) {
        const item = {};
        headers.forEach((header, index) => {
          item[header] = values[index] || '';
        });
        items.push(item);
      }
    }
    return items;
  };

  // Importer CSV
  const handleImportCSV = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError('');

    try {
      const text = await file.text();
      const items = parseCSV(text);

      if (items.length === 0) {
        showMessage('error', 'Aucun item trouvé dans le fichier');
        setImporting(false);
        return;
      }

      // Valider les items
      const validItems = items.filter(item => {
        const price = parseFloat(item.price);
        const validCategory = ['boisson', 'plat', 'dessert'].includes(item.category);
        return item.name && !isNaN(price) && price >= 0 && validCategory;
      });

      if (validItems.length === 0) {
        showMessage('error', 'Aucun item valide trouvé');
        setImporting(false);
        return;
      }

      // Utiliser batch pour ajouter plusieurs items
      const batch = writeBatch(db);
      const menuRef = collection(db, 'etablissements', etablissementId, 'menu');

      validItems.forEach(item => {
        const docRef = doc(menuRef);
        batch.set(docRef, {
          name: item.name.trim(),
          price: parseFloat(item.price),
          category: item.category,
          description: item.description || '',
          available: true,
          createdAt: new Date().toISOString()
        });
      });

      await batch.commit();

      showMessage('success', `${validItems.length} items importés avec succès`);
      if (validItems.length < items.length) {
        showMessage('error', `${items.length - validItems.length} items invalides ignorés`);
      }

    } catch (error) {
      console.error('Erreur import:', error);
      showMessage('error', 'Erreur lors de l\'import du fichier');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-xl font-mono" style={{ color: '#00FF41' }}>
          Chargement du menu...
        </div>
      </div>
    );
  }

  // Grouper les items par catégorie
  const itemsByCategory = categories.reduce((acc, cat) => {
    acc[cat.id] = menuItems.filter(item => (item.category || 'plat') === cat.id);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header avec boutons */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-mono" style={{ color: '#00FF41' }}>
          GESTION DU MENU ({menuItems.length} items)
        </h2>
        <div className="flex gap-3">
          {/* Télécharger template */}
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all flex items-center gap-2"
          >
            <Download size={18} />
            Template CSV
          </button>
          {/* Import CSV */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={18} />
            {importing ? 'Import...' : 'Importer CSV'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            className="hidden"
          />
          {/* Ajouter item */}
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-green-500/30"
          >
            <Plus size={18} />
            Ajouter un item
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 border rounded flex items-center gap-2" 
             style={{ borderColor: '#ff4141', backgroundColor: 'rgba(255, 65, 65, 0.1)' }}>
          <AlertCircle size={18} style={{ color: '#ff4141' }} />
          <span className="font-mono" style={{ color: '#ff4141' }}>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="p-3 border rounded flex items-center gap-2" 
             style={{ borderColor: '#00FF41', backgroundColor: 'rgba(0, 255, 65, 0.1)' }}>
          <Check size={18} style={{ color: '#00FF41' }} />
          <span className="font-mono" style={{ color: '#00FF41' }}>{success}</span>
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <div className="p-4 border rounded-lg" style={{ borderColor: '#00FF41' }}>
          <h3 className="text-lg font-bold mb-4 font-mono" style={{ color: '#00FF41' }}>
            Nouvel Item
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Nom de l'item"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="px-3 py-2 bg-black border font-mono focus:outline-none focus:border-green-300"
              style={{ borderColor: '#00FF41', color: '#00FF41' }}
              autoFocus
            />
            <input
              type="number"
              step="0.01"
              placeholder="Prix ($)"
              value={newItem.price}
              onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
              className="px-3 py-2 bg-black border font-mono focus:outline-none focus:border-green-300"
              style={{ borderColor: '#00FF41', color: '#00FF41' }}
            />
            <select
              value={newItem.category}
              onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              className="px-3 py-2 bg-black border font-mono focus:outline-none focus:border-green-300"
              style={{ borderColor: '#00FF41', color: '#00FF41' }}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddItem}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-mono flex items-center gap-1"
              >
                <Save size={16} />
                Ajouter
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewItem({ name: '', price: '', category: 'plat' });
                }}
                className="px-4 py-2 border rounded hover:bg-gray-900 font-mono flex items-center gap-1"
                style={{ borderColor: '#00FF41', color: '#00FF41' }}
              >
                <X size={16} />
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des items par catégorie */}
      {categories.map(category => {
        const CategoryIcon = category.icon;
        const items = itemsByCategory[category.id];

        return (
          <div key={category.id} className="border rounded-lg" style={{ borderColor: '#00FF41' }}>
            <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: '#00FF41' }}>
              <CategoryIcon size={20} style={{ color: '#00FF41' }} />
              <h3 className="text-lg font-bold font-mono" style={{ color: '#00FF41' }}>
                {category.label} ({items.length})
              </h3>
            </div>

            <div className="p-4">
              {items.length === 0 ? (
                <p className="text-gray-500 italic font-mono">Aucun item dans cette catégorie</p>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-3 rounded border ${
                        !item.available ? 'opacity-50' : ''
                      }`}
                      style={{ borderColor: '#00FF41', backgroundColor: 'rgba(0, 255, 65, 0.02)' }}
                    >
                      {editingItem && editingItem.id === item.id ? (
                        // Mode édition
                        <>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editingItem.name}
                              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                              className="px-2 py-1 bg-black border font-mono"
                              style={{ borderColor: '#00FF41', color: '#00FF41' }}
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={editingItem.price}
                              onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value })}
                              className="px-2 py-1 bg-black border font-mono"
                              style={{ borderColor: '#00FF41', color: '#00FF41' }}
                            />
                            <select
                              value={editingItem.category}
                              onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                              className="px-2 py-1 bg-black border font-mono"
                              style={{ borderColor: '#00FF41', color: '#00FF41' }}
                            >
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={handleSaveEdit}
                              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded"
                              title="Sauvegarder"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="p-2 border rounded hover:bg-gray-900"
                              style={{ borderColor: '#00FF41', color: '#00FF41' }}
                              title="Annuler"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </>
                      ) : (
                        // Mode affichage
                        <>
                          <div className="flex-1">
                            <span className="font-mono text-lg" style={{ color: '#00FF41' }}>
                              {item.name}
                            </span>
                            <span className="ml-4 font-mono" style={{ color: '#00FF41' }}>
                              ${item.price.toFixed(2)}
                            </span>
                            {!item.available && (
                              <span className="ml-4 text-sm font-mono text-red-400">
                                (Indisponible)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Toggle disponibilité */}
                            <button
                              onClick={() => toggleAvailability(item)}
                              className={`px-3 py-1 rounded font-mono text-sm ${
                                item.available 
                                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                                  : 'bg-gray-600 hover:bg-gray-700 text-white'
                              }`}
                            >
                              {item.available ? 'Disponible' : 'Indisponible'}
                            </button>
                            {/* Éditer */}
                            <button
                              onClick={() => startEdit(item)}
                              className="p-2 border rounded hover:bg-gray-900"
                              style={{ borderColor: '#00FF41', color: '#00FF41' }}
                              title="Modifier"
                            >
                              <Edit2 size={16} />
                            </button>
                            {/* Supprimer */}
                            <button
                              onClick={() => handleDelete(item.id, item.name)}
                              className="p-2 border rounded hover:bg-red-900"
                              style={{ borderColor: '#ff4141', color: '#ff4141' }}
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Info établissement */}
      <div className="text-center text-sm font-mono" style={{ color: '#00FF41', opacity: 0.5 }}>
        Établissement: {etablissementId} | Modifications en temps réel
      </div>
    </div>
  );
};

export default MenuManager;