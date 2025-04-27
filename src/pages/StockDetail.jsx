import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStockBySymbol, buyStock, getWalletBalance } from '../api/apiService';

const StockDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [buyingStatus, setBuyingStatus] = useState({ loading: false, error: '', success: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [stockData, walletData] = await Promise.all([
          getStockBySymbol(symbol),
          getWalletBalance()
        ]);
        
        setStock(stockData.data);
        setWallet(walletData);
        setError('');
      } catch (err) {
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  const handleBuy = async () => {
    if (!stock || stock.length === 0) return;
    
    const stockItem = stock[0];
    const totalCost = stockItem.price * quantity;
    
    if (totalCost > wallet.balance) {
      setBuyingStatus({
        loading: false,
        error: 'Saldo insuficiente en tu billetera',
        success: ''
      });
      return;
    }
    
    if (quantity <= 0 || quantity > stockItem.quantity) {
      setBuyingStatus({
        loading: false,
        error: 'Cantidad inválida',
        success: ''
      });
      return;
    }
    
    try {
      setBuyingStatus({ loading: true, error: '', success: '' });
      
      const result = await buyStock(symbol, quantity);
      
      setBuyingStatus({
        loading: false,
        error: '',
        success: `¡Compra exitosa! ID de solicitud: ${result.request_id}`
      });
      
      // Actualizar wallet y stock después de la compra
      const [newStockData, newWalletData] = await Promise.all([
        getStockBySymbol(symbol),
        getWalletBalance()
      ]);
      
      setStock(newStockData.data);
      setWallet(newWalletData);
      
      // Opcionalmente redirigir a compras después de un tiempo
      setTimeout(() => {
        navigate('/my-purchases');
      }, 3000);
      
    } catch (err) {
      setBuyingStatus({
        loading: false,
        error: err.response?.data?.error || 'Error al procesar la compra',
        success: ''
      });
    }
  };

  if (loading) return <div>Cargando detalles...</div>;
  
  if (!stock || stock.length === 0) {
    return (
      <div className="error-container">
        <h2>No se encontraron datos para {symbol}</h2>
        <button onClick={() => navigate('/stocks')}>Volver a Stocks</button>
      </div>
    );
  }

  const stockItem = stock[0];
  const totalCost = stockItem.price * quantity;
  const maxQuantity = stockItem.quantity;

  return (
    <div className="stock-detail-container">
      <button onClick={() => navigate('/stocks')} className="back-button">
        ← Volver a la lista
      </button>
      
      <h2>Detalles de {symbol}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="stock-details">
        <h3>{stockItem.long_name}</h3>
        <div className="info-grid">
          <div className="info-item">
            <span>Precio actual:</span>
            <span className="value">${stockItem.price}</span>
          </div>
          <div className="info-item">
            <span>Cantidad disponible:</span>
            <span className="value">{stockItem.quantity}</span>
          </div>
          <div className="info-item">
            <span>Última actualización:</span>
            <span className="value">{new Date(stockItem.timestamp).toLocaleString()}</span>
          </div>
        </div>

        <div className="buy-section">
          <h3>Comprar acciones</h3>
          <p>Tu saldo disponible: ${wallet.balance}</p>
          
          <div className="quantity-selector">
            <label htmlFor="quantity">Cantidad:</label>
            <input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
              disabled={buyingStatus.loading}
            />
          </div>
          
          <div className="total-cost">
            <p>Costo total: ${totalCost.toFixed(2)}</p>
            <p className={wallet.balance < totalCost ? 'error' : ''}>
              {wallet.balance < totalCost ? 'Saldo insuficiente' : 'Saldo suficiente'}
            </p>
          </div>
          
          {buyingStatus.error && (
            <div className="error-message">{buyingStatus.error}</div>
          )}
          
          {buyingStatus.success && (
            <div className="success-message">{buyingStatus.success}</div>
          )}
          
          <button
            onClick={handleBuy}
            disabled={buyingStatus.loading || wallet.balance < totalCost || quantity > maxQuantity}
            className="buy-button"
          >
            {buyingStatus.loading ? 'Procesando...' : 'Comprar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;