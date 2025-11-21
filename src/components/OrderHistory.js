import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { Calendar, Clock, DollarSign, Package } from 'lucide-react';

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

      // Date d'il y a 6 mois pour avoir plus d'historique
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const ordersRef = collection(db, 'etablissements', etablissementId, 'commandes');
      const q = query(
        ordersRef,
        where('timestamp', '>=', sixMonthsAgo.toISOString()),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setOrders(ordersData);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  // Générer les 6 derniers mois
  const getLastMonths = () => {
    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      months.push({ key: monthKey, label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) });
    }
    return months;
  };

  const months = getLastMonths();

  // Filtrer par mois
  const filteredOrders = orders.filter(order => {
    if (selectedMonth === 'all') return true;
    const orderDate = new Date(order.timestamp);
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
      completed: { label: 'Terminée', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
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
            const orderDate = new Date(order.timestamp);
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

      {/* Liste des commandes */}
      {filteredOrders.length === 0 ? (
        <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-8 text-center">
          <Package size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl hover:bg-gray-900/40 transition-all"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    #{order.number}
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                <div className="flex flex-col sm:items-end gap-1">
                  <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
                    <Calendar size={14} />
                    <span>{formatDate(order.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs sm:text-sm">
                    <Clock size={14} />
                    <span>{formatTime(order.timestamp)}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2 mb-4">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center py-2 border-b border-gray-800/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-medium">x{item.quantity}</span>
                      <span className="text-white text-sm sm:text-base">{item.name}</span>
                    </div>
                    <span className="text-gray-400 text-sm sm:text-base">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="bg-gray-800/30 rounded-xl p-3 sm:p-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Sous-total</span>
                  <span className="text-white">${order.subtotal?.toFixed(2) || '0.00'}</span>
                </div>
                {order.tip > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Pourboire</span>
                    <span className="text-green-400">+${order.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="h-px bg-gray-700/50"></div>
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold flex items-center gap-2">
                    <DollarSign size={16} />
                    TOTAL
                  </span>
                  <span className="text-xl font-bold" style={{ color: '#00FF41' }}>
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
