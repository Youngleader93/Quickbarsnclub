import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Plus, Trash2 } from 'lucide-react';

const QRCodeGenerator = ({ etablissementId }) => {
  const [tables, setTables] = useState([1, 2, 3, 4, 5]);
  const [newTableNumber, setNewTableNumber] = useState('');

  // Utilise l'URL de production ou l'URL locale selon l'environnement
  const baseUrl = process.env.REACT_APP_PRODUCTION_URL || window.location.origin;

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold font-mono text-white">
            GÉNÉRATEUR DE QR CODES
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Créez des QR codes pour vos tables
          </p>
        </div>
        <button
          onClick={downloadAllQRCodes}
          className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600 text-black rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 text-sm sm:text-base"
        >
          <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
          Télécharger tous
        </button>
      </div>

      {/* Ajouter une table */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Ajouter une table</h3>
        <div className="flex gap-2 sm:gap-3">
          <input
            type="number"
            placeholder="Numéro de table"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTable()}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-900/50 backdrop-blur-sm rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all text-sm sm:text-base"
            min="1"
          />
          <button
            onClick={addTable}
            className="px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 text-sm sm:text-base whitespace-nowrap"
          >
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Liste des QR codes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {tables.map((tableNumber) => {
          // QR code pointe directement vers le menu (pas la page WiFi)
          const tableUrl = `${baseUrl}/${etablissementId}?table=${tableNumber}`;

          return (
            <div
              key={tableNumber}
              className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold" style={{ color: '#00FF41' }}>
                  Table {tableNumber}
                </h3>
                <button
                  onClick={() => removeTable(tableNumber)}
                  className="p-1.5 sm:p-2 hover:bg-red-900/20 rounded-lg transition-all"
                  title="Supprimer"
                >
                  <Trash2 size={16} className="sm:w-[18px] sm:h-[18px] text-red-400" />
                </button>
              </div>

              {/* QR Code */}
              <div className="bg-white p-3 sm:p-4 rounded-xl mb-3 sm:mb-4 flex items-center justify-center">
                <QRCodeCanvas
                  id={`qr-table-${tableNumber}`}
                  value={tableUrl}
                  size={180}
                  className="sm:hidden"
                  level="H"
                  includeMargin={true}
                />
                <QRCodeCanvas
                  id={`qr-table-${tableNumber}-desktop`}
                  value={tableUrl}
                  size={200}
                  className="hidden sm:block"
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* URL */}
              <div className="mb-3 sm:mb-4">
                <p className="text-xs text-gray-500 mb-1">URL de scan :</p>
                <p className="text-xs sm:text-sm text-gray-400 break-all font-mono bg-gray-800/50 p-2 rounded">
                  {tableUrl}
                </p>
              </div>

              {/* Bouton télécharger */}
              <button
                onClick={() => downloadQRCode(tableNumber)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Download size={14} className="sm:w-4 sm:h-4" />
                Télécharger PNG
              </button>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3">Comment utiliser les QR codes ?</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-400 text-xs sm:text-sm">
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
