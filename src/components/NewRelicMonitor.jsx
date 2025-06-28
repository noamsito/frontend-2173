import React, { useState, useEffect } from 'react';
import { useNewRelicMonitoring } from '../utils/newrelic';
import '../styles/NewRelicMonitor.css';

const NewRelicMonitor = () => {
  const [metrics, setMetrics] = useState({
    stockPurchases: { total: 0, successful: 0, failed: 0, avgDuration: 0 },
    exchanges: { total: 0, successful: 0, failed: 0, avgDuration: 0 },
    apiCalls: { total: 0, successful: 0, failed: 0, avgResponseTime: 0 },
    errors: { total: 0, types: {} },
    availability: { status: 'unknown', uptime: 0, lastCheck: null }
  });
  
  const [isNewRelicAvailable, setIsNewRelicAvailable] = useState(false);
  const [realTimeData, setRealTimeData] = useState([]);
  const { trackPageView } = useNewRelicMonitoring();

  useEffect(() => {
    // Verificar si New Relic está disponible
    setIsNewRelicAvailable(!!window.newrelic);
    
    if (window.newrelic) {
      trackPageView('NewRelicMonitor', null);
      
      // Configurar tracking en tiempo real
      startRealTimeTracking();
      
      // Consultar métricas iniciales
      fetchMetrics();
      
      // Actualizar métricas cada 30 segundos
      const interval = setInterval(fetchMetrics, 30000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const startRealTimeTracking = () => {
    // Interceptar eventos de Page Action para mostrar actividad en tiempo real
    const originalAddPageAction = window.newrelic.addPageAction;
    
    window.newrelic.addPageAction = function(actionName, attributes) {
      // Agregar a la lista de actividad en tiempo real
      const event = {
        id: Date.now() + Math.random(),
        actionName,
        attributes,
        timestamp: new Date()
      };
      
      setRealTimeData(prev => [event, ...prev.slice(0, 9)]); // Mantener solo los últimos 10
      
      // Llamar al método original
      return originalAddPageAction.call(this, actionName, attributes);
    };
  };

  const fetchMetrics = async () => {
    if (!window.newrelic) return;

    try {
      // Simular consulta de métricas (en producción, estas vendrían de New Relic GraphQL API)
      // Por ahora, calculamos métricas basadas en localStorage para demostración
      
      const stockPurchaseEvents = getStoredEvents('StockPurchase_');
      const exchangeEvents = getStoredEvents('Exchange_');
      const apiEvents = getStoredEvents('API_Call');
      const errorEvents = getStoredEvents('_Error');
      
      setMetrics({
        stockPurchases: calculateMetrics(stockPurchaseEvents, 'StockPurchase_Success'),
        exchanges: calculateMetrics(exchangeEvents, 'Exchange_Success'),
        apiCalls: calculateAPIMetrics(apiEvents),
        errors: calculateErrorMetrics(errorEvents),
        availability: calculateAvailabilityMetrics()
      });
      
    } catch (error) {
      console.error('Error fetching New Relic metrics:', error);
    }
  };

  const getStoredEvents = (prefix) => {
    // Obtener eventos del almacenamiento local (simulación)
    const events = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nr_event_' + prefix)) {
        try {
          events.push(JSON.parse(localStorage.getItem(key)));
        } catch (e) {
          // Ignorar eventos malformados
        }
      }
    }
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const calculateMetrics = (events, successEventName) => {
    const recent = events.filter(e => 
      new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    const successful = recent.filter(e => e.actionName === successEventName);
    const failed = recent.filter(e => e.actionName.includes('Error'));
    
    const avgDuration = successful.length > 0 
      ? successful.reduce((sum, e) => sum + (e.attributes?.duration || 0), 0) / successful.length 
      : 0;

    return {
      total: recent.length,
      successful: successful.length,
      failed: failed.length,
      avgDuration: Math.round(avgDuration)
    };
  };

  const calculateAPIMetrics = (events) => {
    const recent = events.filter(e => 
      new Date(e.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
    );
    
    const successful = recent.filter(e => e.attributes?.success);
    const failed = recent.filter(e => !e.attributes?.success);
    
    const avgResponseTime = recent.length > 0
      ? recent.reduce((sum, e) => sum + (e.attributes?.duration || 0), 0) / recent.length
      : 0;

    return {
      total: recent.length,
      successful: successful.length,
      failed: failed.length,
      avgResponseTime: Math.round(avgResponseTime)
    };
  };

  const calculateErrorMetrics = (events) => {
    const recent = events.filter(e => 
      new Date(e.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    
    const types = {};
    recent.forEach(e => {
      const errorType = e.attributes?.errorType || 'unknown';
      types[errorType] = (types[errorType] || 0) + 1;
    });

    return {
      total: recent.length,
      types
    };
  };

  const calculateAvailabilityMetrics = () => {
    const heartbeats = getStoredEvents('Availability_Heartbeat');
    const recentHeartbeats = heartbeats.filter(h => 
      new Date(h.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
    );
    
    if (recentHeartbeats.length === 0) {
      return { status: 'unknown', uptime: 0, lastCheck: null };
    }
    
    const successful = recentHeartbeats.filter(h => h.attributes?.status === 'up');
    const uptime = (successful.length / recentHeartbeats.length) * 100;
    const lastCheck = new Date(recentHeartbeats[0].timestamp);
    const status = uptime >= 95 ? 'healthy' : uptime >= 80 ? 'degraded' : 'unhealthy';
    
    return {
      status,
      uptime: Math.round(uptime * 100) / 100,
      lastCheck
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'degraded': return '#f59e0b';
      case 'unhealthy': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const openNewRelicDashboard = () => {
    const accountId = import.meta.env.VITE_NEW_RELIC_ACCOUNT_ID;
    if (accountId) {
      window.open(`https://one.newrelic.com/nr1-core?account=${accountId}`, '_blank');
    } else {
      window.open('https://one.newrelic.com/', '_blank');
    }
  };

  if (!isNewRelicAvailable) {
    return (
      <div className="newrelic-monitor disabled">
        <div className="monitor-header">
          <h3>🔍 New Relic Monitor</h3>
          <span className="status-badge disabled">No disponible</span>
        </div>
        <p>New Relic no está configurado o no se pudo cargar.</p>
      </div>
    );
  }

  return (
    <div className="newrelic-monitor">
      <div className="monitor-header">
        <h3>🔍 New Relic Monitor</h3>
        <div className="header-actions">
          <span 
            className={`status-badge ${metrics.availability.status}`}
            style={{ backgroundColor: getStatusColor(metrics.availability.status) }}
          >
            {metrics.availability.status.toUpperCase()}
          </span>
          <button className="dashboard-btn" onClick={openNewRelicDashboard}>
            📊 Dashboard
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        {/* TRAZA 1: Stock Purchases */}
        <div className="metric-card stock-purchases">
          <div className="metric-header">
            <h4>🛒 Compras de Acciones</h4>
            <span className="metric-total">{metrics.stockPurchases.total}</span>
          </div>
          <div className="metric-details">
            <div className="metric-row">
              <span>Exitosas:</span>
              <span className="success">{metrics.stockPurchases.successful}</span>
            </div>
            <div className="metric-row">
              <span>Fallidas:</span>
              <span className="error">{metrics.stockPurchases.failed}</span>
            </div>
            <div className="metric-row">
              <span>Duración promedio:</span>
              <span>{metrics.stockPurchases.avgDuration}ms</span>
            </div>
            <div className="success-rate">
              Tasa de éxito: {metrics.stockPurchases.total > 0 
                ? Math.round((metrics.stockPurchases.successful / metrics.stockPurchases.total) * 100)
                : 0}%
            </div>
          </div>
        </div>

        {/* TRAZA 2: Exchanges */}
        <div className="metric-card exchanges">
          <div className="metric-header">
            <h4>🔄 Intercambios</h4>
            <span className="metric-total">{metrics.exchanges.total}</span>
          </div>
          <div className="metric-details">
            <div className="metric-row">
              <span>Exitosos:</span>
              <span className="success">{metrics.exchanges.successful}</span>
            </div>
            <div className="metric-row">
              <span>Fallidos:</span>
              <span className="error">{metrics.exchanges.failed}</span>
            </div>
            <div className="metric-row">
              <span>Duración promedio:</span>
              <span>{metrics.exchanges.avgDuration}ms</span>
            </div>
            <div className="success-rate">
              Tasa de éxito: {metrics.exchanges.total > 0 
                ? Math.round((metrics.exchanges.successful / metrics.exchanges.total) * 100)
                : 0}%
            </div>
          </div>
        </div>

        {/* API Performance */}
        <div className="metric-card api-calls">
          <div className="metric-header">
            <h4>📡 API Calls</h4>
            <span className="metric-total">{metrics.apiCalls.total}</span>
          </div>
          <div className="metric-details">
            <div className="metric-row">
              <span>Exitosas:</span>
              <span className="success">{metrics.apiCalls.successful}</span>
            </div>
            <div className="metric-row">
              <span>Fallidas:</span>
              <span className="error">{metrics.apiCalls.failed}</span>
            </div>
            <div className="metric-row">
              <span>Tiempo respuesta:</span>
              <span>{metrics.apiCalls.avgResponseTime}ms</span>
            </div>
          </div>
        </div>

        {/* ALARMA: Availability */}
        <div className="metric-card availability">
          <div className="metric-header">
            <h4>🚨 Disponibilidad</h4>
            <span className="metric-total">{metrics.availability.uptime}%</span>
          </div>
          <div className="metric-details">
            <div className="metric-row">
              <span>Estado:</span>
              <span 
                className={`status ${metrics.availability.status}`}
                style={{ color: getStatusColor(metrics.availability.status) }}
              >
                {metrics.availability.status.toUpperCase()}
              </span>
            </div>
            <div className="metric-row">
              <span>Última verificación:</span>
              <span>
                {metrics.availability.lastCheck 
                  ? metrics.availability.lastCheck.toLocaleTimeString()
                  : 'Nunca'
                }
              </span>
            </div>
            <div className="metric-row">
              <span>Errores totales:</span>
              <span className="error">{metrics.errors.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actividad en tiempo real */}
      <div className="realtime-activity">
        <h4>📈 Actividad en Tiempo Real</h4>
        {realTimeData.length === 0 ? (
          <p className="no-activity">No hay actividad reciente</p>
        ) : (
          <div className="activity-list">
            {realTimeData.map(event => (
              <div key={event.id} className="activity-item">
                <div className="activity-time">
                  {event.timestamp.toLocaleTimeString()}
                </div>
                <div className="activity-action">
                  {getEventDisplayName(event.actionName)}
                </div>
                <div className="activity-details">
                  {getEventDetails(event.attributes)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Funciones de utilidad para mostrar eventos
const getEventDisplayName = (actionName) => {
  const displayNames = {
    'StockPurchase_ViewStocks': '👀 Ver Stocks',
    'StockPurchase_SelectStock': '🎯 Seleccionar Stock',
    'StockPurchase_SetQuantity': '🔢 Configurar Cantidad',
    'StockPurchase_Execute': '💳 Ejecutar Compra',
    'StockPurchase_Success': '✅ Compra Exitosa',
    'StockPurchase_Error': '❌ Error en Compra',
    'Exchange_ViewOffers': '👀 Ver Ofertas',
    'Exchange_CreateOffer': '📢 Crear Oferta',
    'Exchange_CreateProposal': '💬 Crear Propuesta',
    'Exchange_Success': '✅ Intercambio Exitoso',
    'Exchange_Error': '❌ Error en Intercambio',
    'API_Call': '📡 API Call',
    'Availability_Heartbeat': '💓 Heartbeat'
  };
  
  return displayNames[actionName] || actionName;
};

const getEventDetails = (attributes) => {
  if (!attributes) return '';
  
  const details = [];
  if (attributes.symbol) details.push(`${attributes.symbol}`);
  if (attributes.quantity) details.push(`×${attributes.quantity}`);
  if (attributes.duration) details.push(`${attributes.duration}ms`);
  if (attributes.status) details.push(attributes.status);
  
  return details.join(' | ');
};

export default NewRelicMonitor;