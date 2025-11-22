import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Calendar, Clock, DollarSign, Package, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const OrderHistory = ({ etablissementId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all'); // Format: 'YYYY-MM' ou 'all'

  useEffect(() => {
    loadOrders();
  }, [etablissementId]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      // Date d'il y a 3 mois
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const ordersRef = collection(db, 'etablissements', etablissementId, 'commandes');

      // Charger toutes les commandes des 3 derniers mois
      const snapshot = await getDocs(ordersRef);

      // Filtrer : delivered + 3 derniers mois
      const ordersData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(order =>
          order.status === 'delivered' &&
          order.deliveredAt &&
          order.deliveredAt >= threeMonthsAgo.toISOString()
        )
        .sort((a, b) => b.deliveredAt.localeCompare(a.deliveredAt)); // Trier par date de livraison décroissante

      setOrders(ordersData);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  // Générer les 3 derniers mois
  const getLastMonths = () => {
    const months = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      months.push({ key: monthKey, label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) });
    }
    return months;
  };

  const months = getLastMonths();

  // Filtrer par mois (utilise deliveredAt au lieu de timestamp)
  const filteredOrders = orders.filter(order => {
    if (selectedMonth === 'all') return true;
    const orderDate = new Date(order.deliveredAt || order.timestamp);
    const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
    return orderMonth === selectedMonth;
  });

  // Calculer le total du mois
  const monthTotal = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'En attente', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
      ready: { label: 'Prête', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
      delivered: { label: '✓ Livrée', color: 'bg-green-500/10 text-green-400 border-green-500/30' },
      completed: { label: 'Terminée', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' }
    };
    const badge = badges[status] || badges.delivered;
    return (
      <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const exportToExcel = () => {
    // Préparer les données pour Excel
    const excelData = filteredOrders.map(order => {
      const date = new Date(order.deliveredAt || order.timestamp);
      const dateStr = date.toLocaleDateString('fr-FR');
      const timeStr = date.toLocaleTimeString('fr-FR');
      const itemsText = order.items.map(item => `${item.quantity}x ${item.name}`).join(', ');

      return {
        'Numéro': order.number,
        'Date': dateStr,
        'Heure': timeStr,
        'Articles': itemsText,
        'Sous-total': order.subtotal?.toFixed(2) || '0.00',
        'Pourboire': order.tip?.toFixed(2) || '0.00',
        'Total': order.total.toFixed(2)
      };
    });

    // Créer le workbook et la feuille
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Générer le nom de fichier avec date
    const today = new Date();
    const filename = `transactions_${etablissementId}_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}.xlsx`;

    // Télécharger le fichier
    XLSX.writeFile(wb, filename);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mb-4"></div>
          <p className="text-gray-400">Chargement de l'historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold font-mono text-white">
            TRANSACTION
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {filteredOrders.length} commandes • Total : ${monthTotal.toFixed(2)}
          </p>
        </div>
        <button
          onClick={exportToExcel}
          disabled={filteredOrders.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <Download size={16} />
          Exporter Excel
        </button>
      </div>

      {/* Filtres par mois */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedMonth('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            selectedMonth === 'all'
              ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
          }`}
        >
          Tous les mois ({orders.length})
        </button>
        {months.map(month => {
          const count = orders.filter(order => {
            const orderDate = new Date(order.deliveredAt || order.timestamp);
            const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            return orderMonth === month.key;
          }).length;

          return (
            <button
              key={month.key}
              onClick={() => setSelectedMonth(month.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedMonth === month.key
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-black shadow-lg'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              {month.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste des commandes - Format compact */}
      {filteredOrders.length === 0 ? (
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-8 text-center">
          <Package size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl overflow-hidden">
          {/* Header du tableau */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-800/50 text-xs font-semibold text-gray-400 border-b border-gray-700/50">
            <div className="col-span-2">Numéro</div>
            <div className="col-span-2">Date/Heure</div>
            <div className="col-span-5">Articles</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1 text-center">✓</div>
          </div>

          {/* Lignes */}
          <div className="divide-y divide-gray-800/30">
            {filteredOrders.map((order) => {
              // Formater les articles sur une ligne
              const itemsText = order.items.map(item => `${item.quantity}x ${item.name}`).join(', ');
              const date = new Date(order.deliveredAt || order.timestamp);
              const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
              const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

              return (
                <div
                  key={order.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-800/30 transition-all text-sm"
                >
                  {/* Numéro */}
                  <div className="col-span-2 font-bold text-white">
                    #{order.number}
                  </div>

                  {/* Date/Heure */}
                  <div className="col-span-2 text-gray-400 text-xs">
                    {dateStr} {timeStr}
                  </div>

                  {/* Articles */}
                  <div className="col-span-5 text-gray-300 truncate text-xs" title={itemsText}>
                    {itemsText}
                  </div>

                  {/* Total */}
                  <div className="col-span-2 text-right font-semibold" style={{ color: '#00FF41' }}>
                    ${order.total.toFixed(2)}
                    {order.tip > 0 && (
                      <span className="text-xs text-gray-500 ml-1">(+${order.tip.toFixed(2)})</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-1 text-center">
                    <span className="text-green-400 text-lg">✓</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
