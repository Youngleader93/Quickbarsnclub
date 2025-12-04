import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, Bell } from 'lucide-react';

const RestaurantOrderSystem = () => {
  const [mode, setMode] = useState('select');
  
  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {mode === 'select' && <ModeSelector setMode={setMode} />}
      {mode === 'client' && <ClientInterface setMode={setMode} />}
      {mode === 'tablet' && <TabletInterface setMode={setMode} />}
    </div>
  );
};

const ModeSelector = ({ setMode }) => {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <div className="text-xl mb-4">╔════════════════════════════════════╗</div>
        <div className="text-xl mb-4">║  SYSTÈME DE COMMANDE v2.0         ║</div>
        <div className="text-xl mb-4">╚════════════════════════════════════╝</div>
      </div>
      
      <div className="mb-4">
        <div className="mb-2">&gt; Sélectionnez le mode :</div>
        <div className="ml-4">
          <button 
            onClick={() => setMode('client')}
            className="block mb-2 hover:text-green-300 text-left"
          >
            [1] Interface Client (WebApp Mobile)
          </button>
          <button 
            onClick={() => setMode('tablet')}
            className="block hover:text-green-300 text-left"
          >
            [2] Interface Tablette (Restaurant)
          </button>
        </div>
      </div>
    </div>
  );
};

const ClientInterface = ({ setMode }) => {
  const [quantities, setQuantities] = useState({});
  const [currentOrderNumber, setCurrentOrderNumber] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);

  const menu = [
    { id: 1, name: 'Burger Classic', price: 12.50 },
    { id: 2, name: 'Pizza Margherita', price: 14.00 },
    { id: 3, name: 'Salade César', price: 10.00 },
    { id: 4, name: 'Pâtes Carbonara', price: 13.50 },
    { id: 5, name: 'Frites', price: 4.50 },
    { id: 6, name: 'Coca-Cola', price: 3.00 },
    { id: 7, name: 'Eau', price: 2.00 }
  ];

  useEffect(() => {
    const checkNotifications = () => {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      if (currentOrderNumber) {
        const currentOrder = orders.find(o => o.number === currentOrderNumber);
        
        if (!currentOrder) {
          setNotifications([]);
          setHasActiveOrder(false);
          setCurrentOrderNumber(null);
          setShowCart(false);
          setQuantities({});
          return;
        }
        
        if (currentOrder.status === 'ready' && !notifications.includes(currentOrder.number)) {
          setNotifications([currentOrder.number]);
        }
      }
    };

    const interval = setInterval(checkNotifications, 2000);
    return () => clearInterval(interval);
  }, [currentOrderNumber, notifications]);

  const handleQuantityChange = (itemId, value) => {
    let numValue = parseInt(value) || 0;
    if (numValue > 20) numValue = 20;
    if (numValue < 0) numValue = 0;
    
    setQuantities(prev => ({
      ...prev,
      [itemId]: numValue
    }));
  };

  const getTotalItems = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(quantities).reduce((sum, [id, qty]) => {
      const item = menu.find(m => m.id === parseInt(id));
      return sum + (item ? item.price * qty : 0);
    }, 0);
  };

  const handleValidate = () => {
    const orderItems = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => {
        const item = menu.find(m => m.id === parseInt(id));
        return { ...item, quantity: qty };
      });

    if (orderItems.length === 0) {
      alert('Panier vide. Ajoutez des articles avant de valider.');
      return;
    }

    const newOrderNumber = Date.now().toString().slice(-6);
    const total = getTotalPrice();

    const newOrder = {
      number: newOrderNumber,
      items: orderItems,
      total,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));

    setCurrentOrderNumber(newOrderNumber);
    setHasActiveOrder(true);
    setShowCart(true);
  };

  const handleNewOrder = () => {
    setQuantities({});
    setCurrentOrderNumber(null);
    setShowCart(false);
    setHasActiveOrder(false);
    setNotifications([]);
  };

  const dismissNotification = (orderNum) => {
    setNotifications(prev => prev.filter(n => n !== orderNum));
  };

  if (hasActiveOrder && !showCart && !notifications.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="text-xl text-green-400 mb-4">Commande en cours...</div>
          <div className="text-gray-400 mb-4">
            Votre commande #{currentOrderNumber} est en préparation.
          </div>
          <div className="text-gray-500 text-sm">
            Vous pourrez passer une nouvelle commande une fois celle-ci récupérée.
          </div>
        </div>
      </div>
    );
  }

  if (showCart && currentOrderNumber) {
    const currentTotal = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .reduce((sum, [id, qty]) => {
        const item = menu.find(m => m.id === parseInt(id));
        return sum + (item ? item.price * qty : 0);
      }, 0);

    const isReady = notifications.length > 0;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black">
        <style>{`
          @keyframes brightnessGlow {
            0%, 100% {
              opacity: 0.3;
            }
            50% {
              opacity: 1;
            }
          }
          .neon-text {
            animation: brightnessGlow 0.8s ease-in-out infinite;
            color: #00FF41;
            font-weight: bold;
          }
        `}</style>
        
        <div className="text-center">
          {isReady ? (
            <>
              <div className="text-6xl mb-12 neon-text">
                🔔
              </div>
              <div className="text-5xl font-bold mb-8 neon-text">
                Commande Prête !
              </div>
              <div className="text-3xl mb-6 neon-text">
                Numéro: #{currentOrderNumber}
              </div>
              <div className="text-2xl mb-8 neon-text">
                Total: {currentTotal.toFixed(2)}€
              </div>
              <div className="text-xl neon-text">
                Récupérer au comptoir
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-12 neon-text">
                ✓
              </div>
              <div className="text-5xl font-bold mb-8 neon-text">
                Commande Envoyée !
              </div>
              <div className="text-3xl mb-6 neon-text">
                Numéro: #{currentOrderNumber}
              </div>
              <div className="text-2xl mb-8 neon-text">
                Total: {currentTotal.toFixed(2)}€
              </div>
              <div className="text-lg neon-text">
                Vous recevrez une notification
                <br />
                quand votre commande sera prête
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="sticky bg-black border-b border-green-400 p-4 z-10">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">MENU</div>
          <button
            onClick={() => setMode('select')}
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            [Mode]
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 pb-32">
        {menu.map(item => (
          <div key={item.id} className="flex items-center py-3 border-b border-gray-800">
            <span className="text-green-400 font-mono flex-1">{item.name}</span>
            <span className="text-green-400 font-mono w-24 text-right">{item.price.toFixed(2)}€</span>
            <input
              type="number"
              min="0"
              max="20"
              value={quantities[item.id] || 0}
              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
              disabled={hasActiveOrder}
              className="w-16 bg-black border border-green-400 text-green-400 text-center py-1 font-mono ml-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        ))}
      </div>

      {getTotalItems() > 0 && !hasActiveOrder && (
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t-2 border-green-400 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between mb-3 text-lg">
              <span>{getTotalItems()} article(s)</span>
              <span className="font-bold">{getTotalPrice().toFixed(2)}€</span>
            </div>
            <button
              onClick={handleValidate}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2"
            >
              <ShoppingCart size={24} />
              VALIDER LA COMMANDE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TabletInterface = ({ setMode }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const loadOrders = () => {
      const stored = JSON.parse(localStorage.getItem('orders') || '[]');
      setOrders(stored);
    };

    loadOrders();
    const interval = setInterval(loadOrders, 1000);
    return () => clearInterval(interval);
  }, []);

  const markAsReady = (orderNumber) => {
    const updated = orders.map(o => 
      o.number === orderNumber ? { ...o, status: 'ready' } : o
    );
    localStorage.setItem('orders', JSON.stringify(updated));
    setOrders(updated);
  };

  const deleteOrder = (orderNumber) => {
    const updated = orders.filter(o => o.number !== orderNumber);
    localStorage.setItem('orders', JSON.stringify(updated));
    setOrders(updated);
  };

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const readyOrders = orders.filter(o => o.status === 'ready');

  return (
    <div className="min-h-screen p-8">
      <div className="mb-4 flex justify-between items-center border-b border-green-400 pb-2">
        <div className="text-xl">TABLETTE RESTAURANT v2.0</div>
        <button onClick={() => setMode('select')} className="text-sm hover:text-green-300">
          [ESC] Retour
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-lg mb-4 border-b border-green-400 pb-2">
            ═══ COMMANDES EN ATTENTE ({pendingOrders.length}) ═══
          </div>
          {pendingOrders.length === 0 ? (
            <div className="text-gray-500 italic">Aucune commande en attente</div>
          ) : (
            pendingOrders.map(order => (
              <div key={order.number} className="mb-4 p-4 border border-green-400 rounded bg-gray-900">
                <div className="text-yellow-400 font-bold mb-2">
                  COMMANDE #{order.number}
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  {new Date(order.timestamp).toLocaleTimeString('fr-FR')}
                </div>
                {order.items.map((item, i) => (
                  <div key={i} className="text-sm">
                    • {item.quantity}x {item.name} - {(item.price * item.quantity).toFixed(2)}€
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-green-400 font-bold">
                  TOTAL: {order.total.toFixed(2)}€
                </div>
                <button
                  onClick={() => markAsReady(order.number)}
                  className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  MARQUER COMME PRÊTE
                </button>
              </div>
            ))
          )}
        </div>

        <div>
          <div className="text-lg mb-4 border-b border-green-400 pb-2">
            ═══ COMMANDES PRÊTES ({readyOrders.length}) ═══
          </div>
          {readyOrders.length === 0 ? (
            <div className="text-gray-500 italic">Aucune commande prête</div>
          ) : (
            readyOrders.map(order => (
              <div key={order.number} className="mb-4 p-4 border border-green-400 rounded bg-gray-900">
                <div className="text-green-400 font-bold mb-2 flex items-center gap-2">
                  <Check size={16} />
                  COMMANDE #{order.number}
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  {new Date(order.timestamp).toLocaleTimeString('fr-FR')}
                </div>
                {order.items.map((item, i) => (
                  <div key={i} className="text-sm">
                    • {item.quantity}x {item.name}
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-green-400 font-bold">
                  TOTAL: {order.total.toFixed(2)}€
                </div>
                <button
                  onClick={() => deleteOrder(order.number)}
                  className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded"
                >
                  RETIRER (Livrée)
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantOrderSystem;