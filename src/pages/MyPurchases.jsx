import { useState, useEffect } from 'react';
import { getUserPurchases, resellStock } from '../api/purchases';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, useSearchParams } from 'react-router-dom';

const MyPurchases = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [searchParams, setSearchParams] = useSearchParams();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, symbol, value, performance
  const [filterBy, setFilterBy] = useState('all'); // all, profitable, losing
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para el modal de reventa
  const [showResaleModal, setShowResaleModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [resaleQuantity, setResaleQuantity] = useState('');
  const [resaleDiscount, setResaleDiscount] = useState(0);
  const [resaleLoading, setResaleLoading] = useState(false);

  // Verificar si el usuario es admin
  const isAdmin = () => {
    return user && (
      user['https://stockmarketu.com/roles']?.includes('admin') ||
      user.email === 'antonio@uc.cl' //Hardcodeado para testing
    );
  };

  useEffect(() => {

    // Manejo de exito de compra
    const status = searchParams.get('status');
    const message = searchParams.get('message');

    if (status === 'success' && message) {
      setSuccessMessage(message);
      setSearchParams({}); // Limpiar parámetros de búsqueda

      setTimeout(() => {
        setSuccessMessage('');
      }
      , 5000); // Ocultar mensaje después de 5 segundos
    }
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);

      // Obtener token de acceso
      let token = null;
      try {
        token = await getAccessTokenSilently();
        console.log("🔑 Token obtenido exitosamente"); // DEBUG
      } catch (tokenError) {
        console.warn('Error obteniendo token de acceso:', tokenError);
      }
      const data = await getUserPurchases(token);
      setPurchases(data || []);
      setError('');
    } catch (err) {
      setError('Error al cargar las compras. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de reventa
  const openResaleModal = (purchase) => {
    setSelectedPurchase(purchase);
    setResaleQuantity('');
    setResaleDiscount('');
    setShowResaleModal(true);
  };

  // Cerrar modal de reventa
  const closeResaleModal = () => {
    setShowResaleModal(false);
    setSelectedPurchase(null);
    setResaleQuantity('');
    setResaleDiscount('');
  };

  // Manejar reventa de acciones
  const handleResale = async () => {
    if (!selectedPurchase || !resaleQuantity || resaleDiscount < 0) {
      alert('Por favor, completa todos los campos correctamente.');
      return;
    }
    
    const quantity = parseInt(resaleQuantity);
    const discount = parseFloat(resaleDiscount) || 0;

    if (quantity <= 0 || quantity > selectedPurchase.quantity) {
      alert(`La cantidad debe ser entre 1 y ${selectedPurchase.quantity}.`);
      return;
    }

    if (discount < 0 || discount > 10) {
      alert('El descuento debe estar entre 0 y 10%');
      return;
    }

    try {
      setResaleLoading(true);
      const token = await getAccessTokenSilently();
      
      await resellStock(selectedPurchase.id, quantity, discount, token);
      
      // Actualizar la lista de compras localmente
      setPurchases(prevPurchases => 
        prevPurchases.map(purchase => {
          if (purchase.id === selectedPurchase.id) {
            const newQuantity = purchase.quantity - quantity;
            return newQuantity > 0 
              ? { ...purchase, quantity: newQuantity }
              : null; // Marcar para eliminación
          }
          return purchase;
        }).filter(purchase => purchase !== null) // Eliminar compras con cantidad 0
      );

      setSuccessMessage(`Se revendieron ${quantity} acciones de ${selectedPurchase.symbol} con ${discount}% de descuento`);
      closeResaleModal();
    } catch (error) {
      console.error('Error al revender:', error);
      alert('Error al procesar la reventa. Intenta de nuevo.');
    } finally {
      setResaleLoading(false);
    }
  };

      /*
      const data = await getUserPurchases(1); // Siempre usar userId = 1
      setPurchases(data || []);
      setError('');
    } catch (err) {
      setError('Error al cargar las compras. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  */

  // Función para formatear fechas
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Calcular valor total de una compra
  const getTotalValue = (quantity, price) => {
    return quantity * price;
  };

  // Simular rendimiento actual (en una app real vendría del backend)
  const getCurrentPerformance = (purchase) => {
    const mockCurrentPrices = {
      'AAPL': 175.30,
      'GOOGL': 142.56,
      'MSFT': 378.85,
      'TSLA': 248.12,
      'AMZN': 145.34
    };
    
    const currentPrice = mockCurrentPrices[purchase.symbol] || purchase.priceAtPurchase * (0.8 + Math.random() * 0.4);
    const currentValue = purchase.quantity * currentPrice;
    const initialValue = purchase.quantity * purchase.priceAtPurchase;
    const gainLoss = currentValue - initialValue;
    const gainLossPercentage = (gainLoss / initialValue) * 100;
    
    return {
      currentPrice,
      currentValue,
      gainLoss,
      gainLossPercentage
    };
  };

  // Filtrar y ordenar compras
  const getFilteredAndSortedPurchases = () => {
    let filtered = purchases.filter(purchase => {
      // Filtro de búsqueda
      if (searchTerm && !purchase.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtro de rendimiento
      if (filterBy !== 'all') {
        const performance = getCurrentPerformance(purchase);
        if (filterBy === 'profitable' && performance.gainLoss <= 0) return false;
        if (filterBy === 'losing' && performance.gainLoss >= 0) return false;
      }
      
      return true;
    });

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'value':
          return getTotalValue(b.quantity, b.priceAtPurchase) - getTotalValue(a.quantity, a.priceAtPurchase);
        case 'performance':
          const perfA = getCurrentPerformance(a);
          const perfB = getCurrentPerformance(b);
          return perfB.gainLossPercentage - perfA.gainLossPercentage;
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Calcular estadísticas totales
  const getTotalStats = () => {
    const totalInvested = purchases.reduce((sum, purchase) => 
      sum + getTotalValue(purchase.quantity, purchase.priceAtPurchase), 0
    );
    
    const currentTotalValue = purchases.reduce((sum, purchase) => {
      const performance = getCurrentPerformance(purchase);
      return sum + performance.currentValue;
    }, 0);
    
    const totalGainLoss = currentTotalValue - totalInvested;
    const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
    
    return {
      totalInvested,
      currentTotalValue,
      totalGainLoss,
      totalGainLossPercentage,
      totalPurchases: purchases.length
    };
  };

  const filteredPurchases = getFilteredAndSortedPurchases();
  const stats = getTotalStats();

  return (
    <div className="purchases-container">
      <div className="page-header">
        <h2>Mis Compras</h2>
        <p>Gestiona y analiza tu portafolio de inversiones</p>
      </div>

      {/* Mensaje de éxito de compra */}
      {successMessage && (
        <div className="success-message"> {successMessage} </div>
      )}

      {/* Estadísticas Generales */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-label">Total Invertido</div>
          <div className="stat-value">{formatCurrency(stats.totalInvested)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Valor Actual</div>
          <div className="stat-value">{formatCurrency(stats.currentTotalValue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ganancia/Pérdida</div>
          <div className={`stat-value ${stats.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(stats.totalGainLoss)} ({stats.totalGainLossPercentage >= 0 ? '+' : ''}{stats.totalGainLossPercentage.toFixed(2)}%)
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Compras</div>
          <div className="stat-value">{stats.totalPurchases}</div>
        </div>
      </div>

      {/* Controles de Filtro y Búsqueda */}
      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por símbolo (ej: AAPL)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="date">Ordenar por Fecha</option>
            <option value="symbol">Ordenar por Símbolo</option>
            <option value="value">Ordenar por Valor</option>
            <option value="performance">Ordenar por Rendimiento</option>
          </select>
          
          <select 
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todas las compras</option>
            <option value="profitable">Solo ganancias</option>
            <option value="losing">Solo pérdidas</option>
          </select>
        </div>
      </div>
      
      {loading && <div className="loading">Cargando compras...</div>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && purchases.length === 0 && !error && (
        <div className="empty-state">
          <h3>No tienes compras registradas</h3>
          <p>Comienza comprando acciones desde la sección de Stocks</p>
          <Link to="/stocks" className="button">Ver Stocks Disponibles</Link>
        </div>
      )}
      
      {!loading && filteredPurchases.length === 0 && purchases.length > 0 && (
        <div className="no-results">
          <h3>No se encontraron compras</h3>
          <p>Intenta cambiar los filtros de búsqueda</p>
        </div>
      )}
      
      {filteredPurchases.length > 0 && (
        <div className="purchases-grid">
          {filteredPurchases.map((purchase) => {
            const performance = getCurrentPerformance(purchase);
            
            return (
              <div key={purchase.id} className="purchase-card">
                <div className="purchase-header">
                  <div className="purchase-symbol">
                    <span className="symbol">{purchase.symbol}</span>
                    <span className={`performance-indicator ${performance.gainLoss >= 0 ? 'positive' : 'negative'}`}>
                      {performance.gainLossPercentage >= 0 ? '+' : ''}{performance.gainLossPercentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="purchase-date">
                    {formatDate(purchase.createdAt)}
                  </div>
                </div>
                
                <div className="purchase-details">
                  <div className="detail-row">
                    <span className="label">Cantidad:</span>
                    <span className="value">{purchase.quantity} acciones</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Precio de compra:</span>
                    <span className="value">
                      {/* Mostrar precio original tachado si es una reventa */}
                      {purchase.is_resale && purchase.discount_info?.original_price && (
                        <span className="original-price-crossed">
                          ${purchase.discount_info.original_price.toFixed(2)}
                        </span>
                      )}
                      {formatCurrency(purchase.priceAtPurchase)}
                      {/* Mostrar badge de descuento */}
                      {purchase.is_resale && purchase.discount_info?.discount_percentage > 0 && (
                        <span className="discount-badge">
                          -{purchase.discount_info.discount_percentage}%
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Precio actual:</span>
                    <span className="value">{formatCurrency(performance.currentPrice)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Valor invertido:</span>
                    <span className="value">{formatCurrency(getTotalValue(purchase.quantity, purchase.priceAtPurchase))}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Valor actual:</span>
                    <span className="value">{formatCurrency(performance.currentValue)}</span>
                  </div>
                  <div className="detail-row highlight">
                    <span className="label">Ganancia/Pérdida:</span>
                    <span className={`value ${performance.gainLoss >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(performance.gainLoss)}
                    </span>
                  </div>
                </div>
                
                <div className="purchase-actions">
                  <Link 
                    to={`/purchases/${purchase.id}`} 
                    className="button button-primary"
                  >
                    📊 Ver Estimación Detallada
                  </Link>
                  {isAdmin() && (
                    <button 
                      onClick={() => openResaleModal(purchase)} 
                      className="button button-secondary"
                    >
                      💰 Revender Acciones
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Botón de Actualizar */}
      <div className="actions-section">
        <button onClick={fetchPurchases} className="button button-secondary">
          🔄 Actualizar Compras
        </button>
        <Link to="/stocks" className="button button-primary">
          + Comprar Más Acciones
        </Link>
      </div>
      {/* Modal de Reventa */}
      {showResaleModal && (
        <div className="modal-overlay" onClick={closeResaleModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Revender Acciones de {selectedPurchase.symbol}</h3>
            <p>Cantidad disponible: <strong>{selectedPurchase.quantity}</strong> acciones</p>
            <div className="form-group">
              <label htmlFor="resale-quantity">Cantidad a revender:</label>
              <input
                type="number"
                id="resale-quantity"
                value={resaleQuantity}
                onChange={(e) => setResaleQuantity(e.target.value)}
                min="1"
                max={selectedPurchase.quantity}
              />
            </div>
            <div className="form-group">
              <label htmlFor="resale-discount">Descuento:</label>
              <input
                type="number"
                id="resale-discount"
                value={resaleDiscount}
                onChange={(e) => setResaleDiscount(e.target.value)}
                min="0"
                max="10"
                step="0.01"
                placeholder="0 - 10%"
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={closeResaleModal}
                className="button button-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResale}
                className="button button-primary"
                disabled={resaleLoading}
              >
                {resaleLoading ? 'Procesando...' : 'Revender'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPurchases;