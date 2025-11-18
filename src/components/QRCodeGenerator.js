import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Plus, Trash2 } from 'lucide-react';

const QRCodeGenerator = ({ etablissementId }) => {
  const [tables, setTables] = useState([1, 2, 3, 4, 5]);
  const [newTableNumber, setNewTableNumber] = useState('');

  const baseUrl = window.location.origin;

  // Ajouter une table
  const addTable = () => {
    const tableNum = parseInt(newTableNumber);
    if (tableNum && !tables.includes(tableNum)) {
      setTables([...tables, tableNum].sort((a, b) => a - b));
      setNewTableNumber('');
    }
  };

  // Supprimer une table
  const removeTable = (tableNum) => {
    setTables(tables.filter(t => t !== tableNum));
  };

  // Télécharger QR code
  const downloadQRCode = (tableNumber) => {
    const canvas = document.getElementById(`qr-table-${tableNumber}`);
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${etablissementId}_table_${tableNumber}.png`;
      link.href = url;
      link.click();
    }
  };

  // Télécharger tous les QR codes en PDF
  const downloadAllQRCodes = () => {
    tables.forEach((table, index) => {
      setTimeout(() => {
        downloadQRCode(table);
      }, index * 100);
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-mono" style={{ color: '#00FF41' }}>
            GÉNÉRATEUR DE QR CODES
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Créez des QR codes pour vos tables
          </p>
        </div>
        <button
          onClick={downloadAllQRCodes}
          className="px-5 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-green-500/30"
        >
          <Download size={18} />
          Télécharger tous
        </button>
      </div>

      {/* Ajouter une table */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Ajouter une table</h3>
        <div className="flex gap-3">
          <input
            type="number"
            placeholder="Numéro de table"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTable()}
            className="flex-1 px-4 py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            min="1"
          />
          <button
            onClick={addTable}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Ajouter
          </button>
        </div>
      </div>

      {/* Liste des QR codes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map((tableNumber) => {
          // QR code pointe directement vers le menu (pas la page WiFi)
          const tableUrl = `${baseUrl}/${etablissementId}?table=${tableNumber}`;

          return (
            <div
              key={tableNumber}
              className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold" style={{ color: '#00FF41' }}>
                  Table {tableNumber}
                </h3>
                <button
                  onClick={() => removeTable(tableNumber)}
                  className="p-2 hover:bg-red-900/20 rounded-lg transition-all"
                  title="Supprimer"
                >
                  <Trash2 size={18} className="text-red-400" />
                </button>
              </div>

              {/* QR Code */}
              <div className="bg-white p-4 rounded-xl mb-4 flex items-center justify-center">
                <QRCodeCanvas
                  id={`qr-table-${tableNumber}`}
                  value={tableUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* URL */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">URL de scan :</p>
                <p className="text-sm text-gray-400 break-all font-mono bg-gray-800/50 p-2 rounded">
                  {tableUrl}
                </p>
              </div>

              {/* Bouton télécharger */}
              <button
                onClick={() => downloadQRCode(tableNumber)}
                className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Télécharger PNG
              </button>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Comment utiliser les QR codes ?</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-400 text-sm">
          <li>Téléchargez les QR codes pour chaque table</li>
          <li>Imprimez-les et placez-les sur les tables correspondantes</li>
          <li>Les clients scannent le QR code avec leur téléphone</li>
          <li>Ils accèdent <strong className="text-white">directement au menu</strong> et peuvent commander (avec ou sans WiFi)</li>
          <li>Un bouton "WiFi" est disponible en haut à droite pour ceux qui ont besoin de se connecter</li>
          <li>Le numéro de table est automatiquement associé à leur commande</li>
        </ol>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
