import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getStockBySymbol, buyStock } from '../api/apiService';
import { useAuth0 } from '@auth0/auth0-react';
import '../styles/stock-detail.css';

const StockDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [buyingStatus, setBuyingStatus] = useState({ loading: false, error: '', success: '' });
  const [retryData, setRetryData] = useState(null);
  const [redirectingToWebpay, setRedirectingToWebpay] = useState(false);
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
    
        // Manejo del estado cancelado
        if (symbol === 'cancelado') {
          setStock(null);
          setLoading(false);
        
          const status = searchParams.get('status');
          const message = searchParams.get('message');
        
          if (status === 'cancelled' || status === 'error') {
            setBuyingStatus({
              loading: false,
              error: message || 'Compra cancelada por el usuario',
              success: ''
            });
          
            setTimeout(() => {
              navigate('/stocks');
            }, 4000);
          }
          return;
        }
    
        // Obtener datos del stock
        const stockData = await getStockBySymbol(symbol);
        console.log('📊 DEBUG: Raw response from backend:', stockData);
        console.log('📊 DEBUG: stockData.data:', stockData.data);
        console.log('📊 DEBUG: typeof stockData.data:', typeof stockData.data);
        console.log('📊 DEBUG: Array.isArray(stockData.data):', Array.isArray(stockData.data));
        setStock(stockData.data);
    
        // Manejo de parámetros de retorno WebPay
        const status = searchParams.get('status');
        const message = searchParams.get('message');
        
        if (status && message) {
          setRedirectingToWebpay(false);
          setTimeout(() => setSearchParams({}), 100);
          
          switch (status) {
            case 'cancelled':
            case 'error':
              setBuyingStatus({
                loading: false,
                error: message || 'Error en el procesamiento del pago',
                success: ''
              });
              break;
              
            case 'success':
              setBuyingStatus({
                loading: false,
                error: '',
                success: message || '¡Compra realizada exitosamente!'
              });
              
              setTimeout(() => {
                navigate('/my-purchases?status=success&message=' + encodeURIComponent(message));
              }, 3000);
              break;
              
            case 'failed':
              setBuyingStatus({
                loading: false,
                error: message || 'El pago fue rechazado por el banco',
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
  }, [symbol, searchParams, navigate]);

  const handleBuy = async () => {
    if (!stock) return;
    
    const stockItem = stock;
    const totalCost = stockItem.price * quantity;
    
    // Validaciones básicas
    if (quantity <= 0 || quantity > stockItem.quantity) {
      setBuyingStatus({
        loading: false,
        error: `Cantidad inválida. Disponible: ${stockItem.quantity} acciones`,
        success: ''
      });
      return;
    }
    
    try {
      setBuyingStatus({ loading: true, error: '', success: '' });

      let token = null;
      try {
        token = await getAccessTokenSilently({
          audience: 'https://stockmarket-api/',
          scope: 'openid profile email'
        });
        console.log('🔧 DEBUG: Token obtenido para compra:', token ? 'SÍ' : 'NO');
      } catch (tokenError) {
        console.error('❌ Error obteniendo token para compra:', tokenError);
        setBuyingStatus({
          loading: false,
          error: 'Error de autenticación. Por favor, recarga la página.',
          success: ''
        });
        return;
      }

      const result = await buyStock(symbol, quantity, token);

      // Si la compra requiere pago con Webpay, redirigir
      if (result.requiresPayment && result.webpayUrl && result.webpayToken) {
        console.log('Redirigiendo a webpay:', result.webpayUrl);
  
        setRedirectingToWebpay(true);
      
        setBuyingStatus({
          loading: false,
          error: '',
          success: `Redirigiendo a página de pago... Total: $${totalCost.toFixed(2)}`
        });
  
        // Crear formulario para redirigir a Webpay
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
        return;
      }
  
      // Si no hay Webpay, continuar con la compra normal
      setBuyingStatus({
        loading: false,
        error: '',
        success: `¡Compra exitosa! ID de solicitud: ${result.request_id}`
      });
      
      setRetryData(null);
      
      // Actualizar stock después de la compra
      const newStockData = await getStockBySymbol(symbol);
      setStock(newStockData.data);
      
      // Redirigir a compras después de un tiempo
      setTimeout(() => {
        navigate('/my-purchases');
      }, 3000);
      
    } catch (err) {
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
    
    const { symbol: retrySymbol, quantity: retryQuantity } = retryData;
    setRetryData(null);
    
    try {
      setBuyingStatus({ loading: true, error: '', success: '' });

      // OBTENER TOKEN para retry
      let token = null;
      try {
        token = await getAccessTokenSilently({
          audience: 'https://stockmarket-api/',
          scope: 'openid profile email'
        });
        console.log('🔧 DEBUG: Token obtenido para retry:', token ? 'SÍ' : 'NO');
      } catch (tokenError) {
        console.error('❌ Error obteniendo token para retry:', tokenError);
        setBuyingStatus({
          loading: false,
          error: 'Error de autenticación en reintento.',
          success: ''
        });
        return;
      }

      const result = await buyStock(retrySymbol, retryQuantity, token);

      if (result.requiresPayment && result.webpayUrl && result.webpayToken) {
        console.log('Redirigiendo a webpay en reintento:', result.webpayUrl);

        setRedirectingToWebpay(true);
        
        setBuyingStatus({
          loading: false,
          error: '',
          success: 'Redirigiendo a página de pago...'
        });

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
        return;
      }
      
      setBuyingStatus({
        loading: false,
        error: '',
        success: `¡Compra exitosa en el reintento! ID de solicitud: ${result.request_id}`
      });
      
      const newStockData = await getStockBySymbol(symbol);
      setStock(newStockData.data);
      
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

  if (loading) {
    return (
      <div className="stock-detail-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando detalles...</p>
        </div>
      </div>
    );
  }
  
  if (symbol === 'cancelado') {
    return (
      <div className="stock-detail-container">
        <button onClick={() => navigate('/stocks')} className="btn btn-secondary back-button">
          ← Volver a la lista
        </button>
      
        <div className="error-container">
          <h2>Compra Cancelada</h2>
          {buyingStatus.error && (
            <div className="error-message">
              {buyingStatus.error}
            </div>
          )}
          <p>Tu compra fue cancelada. Serás redirigido a la lista de stocks en unos segundos...</p>
        </div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="stock-detail-container">
        <button onClick={() => navigate('/stocks')} className="btn btn-secondary back-button">
          ← Volver a la lista
        </button>
        <div className="error-container">
          <h2>No se encontraron datos para {symbol}</h2>
          <p>El stock solicitado no está disponible en este momento.</p>
        </div>
      </div>
    );
  }

  const stockItem = stock;
  const totalCost = stockItem.price * quantity;
  const maxQuantity = stockItem.quantity;

  return (
    <div className="stock-detail-container">
      <button onClick={() => navigate('/stocks')} className="btn btn-secondary back-button">
        ← Volver a la lista
      </button>
      
      <div className="stock-detail-header">
        <div className="stock-symbol-badge">{stockItem.original_symbol || symbol.replace('_r', '')}</div>
        <h1>{stockItem.long_name}</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="stock-details">
        <div className="stock-info-card">
          <h3>Información del Stock</h3>
          {stockItem.is_resale && (
            <div className="resale-indicator">
              🏷️ <strong>Oferta Especial - {stockItem.discount_percentage}% descuento</strong>
            </div>
          )}
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Precio actual:</span>
              <span className="value price-container">
                {stockItem.is_resale && stockItem.original_price && (
                  <span className="original-price-crossed">
                    ${stockItem.original_price.toLocaleString()}
                  </span>
                )}
                <span className="price">${stockItem.price.toLocaleString()}</span>
                {stockItem.is_resale && stockItem.discount_percentage > 0 && (
                  <span className="discount-badge">
                    -{stockItem.discount_percentage}%
                  </span>
                )}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Cantidad disponible:</span>
              <span className="value quantity">{stockItem.quantity.toLocaleString()}</span>
            </div>
            {stockItem.is_resale && stockItem.original_price && (
              <div className="info-item highlight">
                <span className="label">Ahorro por acción:</span>
                <span className="value savings">
                  ${(stockItem.original_price - stockItem.price).toLocaleString()}
                </span>
              </div>
            )}
            <div className="info-item">
              <span className="label">Última actualización:</span>
              <span className="value date">{new Date(stockItem.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="purchase-card">
          <h3>💰 Realizar Compra</h3>
          <p className="payment-info">
            🔒 Pago seguro procesado via WebPay
          </p>
          
          <div className="purchase-form">
            <div className="quantity-section">
              <label htmlFor="quantity">Cantidad de acciones:</label>
              <div className="quantity-input-group">
                <button 
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || buyingStatus.loading}
                  className="quantity-btn"
                >
                  -
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                  disabled={buyingStatus.loading}
                  className="quantity-input"
                />
                <button 
                  type="button"
                  onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                  disabled={quantity >= maxQuantity || buyingStatus.loading}
                  className="quantity-btn"
                >
                  +
                </button>
              </div>
              <small className="quantity-info">
                Máximo disponible: {maxQuantity.toLocaleString()} acciones
              </small>
            </div>
            
            <div className="cost-summary">
              <div className="cost-breakdown">
                <div className="cost-row">
                  <span>Precio por acción:</span>
                  <span className="price-container">
                    {stockItem.is_resale && stockItem.original_price && (
                      <span className="original-price-crossed">
                        ${stockItem.original_price.toLocaleString()}
                      </span>
                    )}
                    <span>${stockItem.price.toLocaleString()}</span>
                  </span>
                </div>
                <div className="cost-row">
                  <span>Cantidad:</span>
                  <span>{quantity.toLocaleString()}</span>
                </div>
                {stockItem.is_resale && stockItem.original_price && (
                  <div className="cost-row savings-row">
                    <span>Ahorro total:</span>
                    <span className="savings">
                      ${((stockItem.original_price - stockItem.price) * quantity).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="cost-row total">
                  <span>Total a pagar:</span>
                  <span>${totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {buyingStatus.error && (
              <div className="error-message">
                {buyingStatus.error}
                {retryData && (
                  <button 
                    onClick={handleRetry} 
                    className="btn btn-outline retry-button"
                    disabled={buyingStatus.loading}
                  >
                    🔄 Reintentar compra
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
                quantity > maxQuantity ||
                stockItem.quantity === 0
              }
              className={`btn btn-primary purchase-button ${redirectingToWebpay ? 'redirecting' : ''}`}
            >
              {redirectingToWebpay
                ? '🔄 Redirigiendo a WebPay...'
                : buyingStatus.loading
                  ? '⏳ Procesando...'
                  : stockItem.quantity === 0
                    ? '❌ Sin Stock'
                    : `💳 Comprar por $${totalCost.toLocaleString()}`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;