import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getStockBySymbol, buyStock, getWalletBalance } from '../api/apiService';

const StockDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [buyingStatus, setBuyingStatus] = useState({ loading: false, error: '', success: '' });
  const [retryData, setRetryData] = useState(null);
  const [redirectingToWebpay, setRedirectingToWebpay] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (symbol === 'cancelado') {
          setStock(null);
          setLoading(false);
        
          // Mostrar mensaje de cancelación
          const status = searchParams.get('status');
          const message = searchParams.get('message');
        
          if (status === 'cancelled') {
            setBuyingStatus({
              loading: false,
              error: message || 'Compra cancelada por el usuario',
              success: ''
            });
          
            // Redirigir a la lista de stocks después de 3 segundos
            setTimeout(() => {
              navigate('/stocks');
            }, 3000);
          }
          return; // ← IMPORTANTE: salir aquí
        }
        const [stockData, walletData] = await Promise.all([
          getStockBySymbol(symbol),
          getWalletBalance()
        ]);
        
        setStock(stockData.data);
        setWallet(walletData);

        const status = searchParams.get('status');
        const message = searchParams.get('message');
        const requestId = searchParams.get('request_id');
        
        if (status && message) {
          // Limpiar los parámetros de la URL
          setSearchParams({});
          
          // Resetear estado de redirección
          setRedirectingToWebpay(false);
          
          switch (status) {
            case 'cancelled':
              setBuyingStatus({
                loading: false,
                error: message || 'Compra cancelada por el usuario',
                success: ''
              });
              break;
              
            case 'success':
              setBuyingStatus({
                loading: false,
                error: '',
                success: message || '¡Compra realizada exitosamente!'
              });
              
              // Si la compra fue exitosa, redirigir a "Mis Compras" después de un momento
              setTimeout(() => {
                navigate('/my-purchases');
              }, 3000);
              break;
              
            case 'failed':
              setBuyingStatus({
                loading: false,
                error: message || 'El pago fue rechazado por el banco',
                success: ''
              });
              break;
              
            case 'error':
              setBuyingStatus({
                loading: false,
                error: message || 'Error al procesar el pago',
                success: ''
              });
              break;
          }
        }
      } catch (err) {
        setError('Error al cargar los datos. Por favor, intenta de nuevo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, searchParams, setSearchParams, navigate]); // Antes era }, [symbol]); 

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  if (symbol === 'cancelado') {
    return (
      <div className="stock-detail-container">
        <button onClick={() => navigate('/stocks')} className="back-button">
          ← Volver a la lista
        </button>
      
        <h2>Compra Cancelada</h2>
      
        {buyingStatus.error && (
          <div className="error-message">
            {buyingStatus.error}
          </div>
        )}
      
        <p>Tu compra fue cancelada. Serás redirigido a la lista de stocks en unos segundos...</p>
      </div>
    );
  }


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

      // Si la compra requiere pago con Webpay, redirigir al usuario
      if (result.requiresPayment && result.webpayUrl && result.webpayToken) {
        console.log('Redirigiendo a webpay:', result.webpayUrl);

        setRedirectingToWebpay(true);
      
        setBuyingStatus({
          loading: false,
          error: '',
          success: `¡Compra exitosa! ID de solicitud: ${result.request_id}`
        });

        // Crea formulario para redirigir a Webpay
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = result.webpayUrl;

        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token_ws';
        tokenInput.value = result.webpayToken;
        form.appendChild(tokenInput);
        document.body.appendChild(form);
        form.submit();
        return; // Salir después de redirigir
      }

      // Si no hay Webpay, continuar con la compra normal
      setBuyingStatus({
        loading: false,
        error: '',
        success: `¡Compra exitosa! ID de solicitud: ${result.request_id}`
      });
      
      setRetryData(null); // Limpiar datos de reintento si fue exitoso
      
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
      // Guardar datos para posible reintento
      setRetryData({ symbol, quantity });
      setBuyingStatus({
        loading: false,
        error: err.response?.data?.error || 'Error al procesar la compra. Puede intentar nuevamente.',
        success: ''
      });
    }
  };

  const handleRetry = async () => {
    if (!retryData) return;
    
    // Solo permitir un reintento
    const { symbol: retrySymbol, quantity: retryQuantity } = retryData;
    setRetryData(null);
    
    try {
      setBuyingStatus({ loading: true, error: '', success: '' });
      
      const result = await buyStock(retrySymbol, retryQuantity);

      // Si la compra requiere pago con Webpay, redirigir al usuario
      if (result.requiresPayment && result.webpayUrl && result.webpayToken) {
        console.log('Redirigiendo a webpay en reintento:', result.webpayUrl);

        setRedirectingToWebpay(true);
        
        setBuyingStatus({
          loading: false,
          error: '',
          success: `Redirigiendo a pagina de pago...`
        });

        // Crea formulario para redirigir a Webpay
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = result.webpayUrl;

        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token_ws';
        tokenInput.value = result.webpayToken;
        form.appendChild(tokenInput);
        document.body.appendChild(form);
        form.submit();
        return; // Salir después de redirigir
      }
      // Si no hay Webpay, continuar con la compra normal       
      setBuyingStatus({
        loading: false,
        error: '',
        success: `¡Compra exitosa en el reintento! ID de solicitud: ${result.request_id}`
      });
      
      // Actualizar wallet y stock
      const [newStockData, newWalletData] = await Promise.all([
        getStockBySymbol(symbol),
        getWalletBalance()
      ]);
      
      setStock(newStockData.data);
      setWallet(newWalletData);
      
      setTimeout(() => {
        navigate('/my-purchases');
      }, 3000);
      
    } catch (err) {
      setBuyingStatus({
        loading: false,
        error: 'La operación falló definitivamente después del reintento.',
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
            <div className="error-message">
              {buyingStatus.error}
              {retryData && (
                <button 
                  onClick={handleRetry} 
                  className="retry-button"
                  disabled={buyingStatus.loading}
                >
                  Reintentar compra
                </button>
              )}
            </div>
          )}
          
          {buyingStatus.success && (
            <div className="success-message">{buyingStatus.success}</div>
          )}
          
          <button
            onClick={handleBuy}
            disabled={
              buyingStatus.loading || 
              redirectingToWebpay ||
              wallet.balance < totalCost || 
              quantity > maxQuantity
            }
            className={`buy-button ${redirectingToWebpay ? 'redirecting' : ''}`}
          >
            {redirectingToWebpay
              ? 'Redirigiendo a Webpay...'
              : buyingStatus.loading
                ? 'Comprando...'
                : `Comprar`
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;