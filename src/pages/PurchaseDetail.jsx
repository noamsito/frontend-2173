import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPurchaseEstimation } from '../api/purchases';

const PurchaseDetail = () => {
  const { id } = useParams();
  const [estimation, setEstimation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchEstimation();
    }
  }, [id]);

  const fetchEstimation = async () => {
    try {
      setLoading(true);
      console.log('🔧 PurchaseDetail: fetchEstimation para ID:', id); // DEBUG
      const data = await getPurchaseEstimation(id);
      setEstimation(data);
      setError('');
    } catch (err) {
      setError('Error al cargar la estimación. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getGainLossColor = (percentage) => {
    if (percentage > 0) return 'text-green-600';
    if (percentage < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="purchase-detail-container">
        <div className="loading">Cargando estimación...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="purchase-detail-container">
        <div className="error-message">{error}</div>
        <Link to="/my-purchases" className="button">Volver a Mis Compras</Link>
      </div>
    );
  }

  if (!estimation) {
    return (
      <div className="purchase-detail-container">
        <div className="error-message">No se encontró la estimación</div>
        <Link to="/my-purchases" className="button">Volver a Mis Compras</Link>
      </div>
    );
  }

  const { purchase, currentPrice, totalInvested, currentValue, gainLoss, gainLossPercentage, linearEstimation } = estimation;

  return (
    <div className="purchase-detail-container">
      <div className="page-header">
        <h2>Estimación de Compra</h2>
        <Link to="/my-purchases" className="button button-secondary">← Volver a Mis Compras</Link>
      </div>

      {/* Información de la compra */}
      <div className="estimation-card">
        <div className="card-header">
          <h3>{purchase.symbol}</h3>
          <span className="purchase-date">
            Comprada el {formatDate(purchase.purchaseDate)}
          </span>
        </div>

        <div className="purchase-summary">
          <div className="summary-item">
            <span className="label">Cantidad:</span>
            <span className="value">{purchase.quantity} acciones</span>
          </div>
          <div className="summary-item">
            <span className="label">Precio de compra:</span>
            <span className="value">{formatCurrency(purchase.priceAtPurchase)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Inversión total:</span>
            <span className="value">{formatCurrency(totalInvested)}</span>
          </div>
        </div>
      </div>

      {/* Rendimiento actual */}
      <div className="estimation-card">
        <div className="card-header">
          <h3>Rendimiento Actual</h3>
        </div>

        <div className="performance-grid">
          <div className="performance-item">
            <span className="label">Precio actual:</span>
            <span className="value">{formatCurrency(currentPrice)}</span>
          </div>
          <div className="performance-item">
            <span className="label">Valor actual:</span>
            <span className="value">{formatCurrency(currentValue)}</span>
          </div>
          <div className="performance-item">
            <span className="label">Ganancia/Pérdida:</span>
            <span className={`value ${getGainLossColor(gainLossPercentage)}`}>
              {formatCurrency(gainLoss)} ({gainLossPercentage > 0 ? '+' : ''}{gainLossPercentage}%)
            </span>
          </div>
        </div>
      </div>

      {/* Estimación futura */}
      <div className="estimation-card">
        <div className="card-header">
          <h3>Estimación Lineal</h3>
          <span className="estimation-timeframe">Proyección a {linearEstimation.timeframe}</span>
        </div>

        <div className="estimation-grid">
          <div className="estimation-item">
            <span className="label">Precio estimado:</span>
            <span className="value">{formatCurrency(linearEstimation.estimatedPrice)}</span>
          </div>
          <div className="estimation-item">
            <span className="label">Valor estimado:</span>
            <span className="value">{formatCurrency(linearEstimation.estimatedValue)}</span>
          </div>
          <div className="estimation-item">
            <span className="label">Confianza:</span>
            <span className={`confidence confidence-${linearEstimation.confidence}`}>
              {linearEstimation.confidence.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="estimation-disclaimer">
          <p>⚠️ Esta estimación se basa en un modelo lineal simple y no debe considerarse como consejo de inversión.</p>
        </div>
      </div>

      <div className="actions-section">
        <button onClick={fetchEstimation} className="button button-primary">
          🔄 Actualizar Estimación
        </button>
        <Link to="/my-purchases" className="button button-secondary">
          Volver a Mis Compras
        </Link>
      </div>
    </div>
  );
};

export default PurchaseDetail;