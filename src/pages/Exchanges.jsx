import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '../styles/exchanges.css';

const Exchanges = () => {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();
  const [pendingExchanges, setPendingExchanges] = useState([]);
  const [exchangeHistory, setExchangeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  // Form state para crear intercambio
  const [newExchange, setNewExchange] = useState({
    target_group_id: '',
    offered_symbol: '',
    offered_quantity: '',
    requested_symbol: '',
    requested_quantity: ''
  });

  // Cargar intercambios pendientes (RF05)
  const fetchPendingExchanges = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/exchanges/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingExchanges(data.exchanges || []);
      }
    } catch (error) {
      console.error('Error cargando intercambios pendientes:', error);
    }
  };

  // Cargar historial de intercambios (RF05)
  const fetchExchangeHistory = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/exchanges/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setExchangeHistory(data.exchanges || []);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        setLoading(true);
        await Promise.all([fetchPendingExchanges(), fetchExchangeHistory()]);
        setLoading(false);
      }
    };

    loadData();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [getAccessTokenSilently, isAuthenticated]);

  // Proponer intercambio (RF05)
  const handleCreateExchange = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/exchanges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newExchange,
          target_group_id: parseInt(newExchange.target_group_id),
          offered_quantity: parseInt(newExchange.offered_quantity),
          requested_quantity: parseInt(newExchange.requested_quantity)
        }),
      });

      if (response.ok) {
        alert('✅ Propuesta de intercambio enviada y publicada al broker!');
        setShowCreateForm(false);
        setNewExchange({
          target_group_id: '',
          offered_symbol: '',
          offered_quantity: '',
          requested_symbol: '',
          requested_quantity: ''
        });
        fetchPendingExchanges();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando intercambio');
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Responder a intercambio (RF05 - aceptar/rechazar)
  const handleRespondToExchange = async (exchangeId, action, reason = '') => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/exchanges/${exchangeId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, reason }),
      });

      if (response.ok) {
        const actionText = action === 'accept' ? 'aceptado' : 'rechazado';
        alert(`✅ Intercambio ${actionText} exitosamente!`);
        fetchPendingExchanges();
        fetchExchangeHistory();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error respondiendo intercambio');
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleAcceptExchange = (exchangeId) => {
    if (confirm('¿Estás seguro de aceptar este intercambio?')) {
      handleRespondToExchange(exchangeId, 'accept');
    }
  };

  const handleRejectExchange = (exchangeId) => {
    const reason = prompt('¿Por qué rechazas este intercambio? (opcional)');
    if (reason !== null) {
      handleRespondToExchange(exchangeId, 'reject', reason);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return '⏳';
      case 'ACCEPTED': return '✅';
      case 'REJECTED': return '❌';
      case 'CANCELLED': return '🚫';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#f39c12';
      case 'ACCEPTED': return '#27ae60';
      case 'REJECTED': return '#e74c3c';
      case 'CANCELLED': return '#95a5a6';
      default: return '#bdc3c7';
    }
  };

  if (loading) return <div className="loading">Cargando intercambios...</div>;

  return (
    <div className="exchanges-container">
      <div className="exchanges-header">
        <h1>🔄 Sistema de Intercambios</h1>
        <div className="exchange-stats">
          <span>📥 {pendingExchanges.length} pendientes</span>
          <span>📋 {exchangeHistory.length} en historial</span>
        </div>
        {isAuthenticated && (
          <button 
            className="btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            ➕ Proponer Intercambio
          </button>
        )}
      </div>

      {/* Formulario para crear intercambio */}
      {showCreateForm && isAuthenticated && (
        <div className="create-exchange-form">
          <h3>Proponer Nuevo Intercambio</h3>
          <form onSubmit={handleCreateExchange}>
            <div className="form-row">
              <div className="form-group">
                <label>Grupo Objetivo:</label>
                <input
                  type="number"
                  value={newExchange.target_group_id}
                  onChange={(e) => setNewExchange({...newExchange, target_group_id: e.target.value})}
                  placeholder="Ej: 2"
                  min="1"
                  required
                />
              </div>
            </div>
            
            <div className="exchange-sides">
              <div className="offer-side">
                <h4>🤝 Ofrecemos</h4>
                <div className="form-group">
                  <label>Símbolo:</label>
                  <input
                    type="text"
                    value={newExchange.offered_symbol}
                    onChange={(e) => setNewExchange({...newExchange, offered_symbol: e.target.value.toUpperCase()})}
                    placeholder="Ej: AAPL"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Cantidad:</label>
                  <input
                    type="number"
                    value={newExchange.offered_quantity}
                    onChange={(e) => setNewExchange({...newExchange, offered_quantity: e.target.value})}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="exchange-arrow">⇄</div>

              <div className="request-side">
                <h4>🎯 Solicitamos</h4>
                <div className="form-group">
                  <label>Símbolo:</label>
                  <input
                    type="text"
                    value={newExchange.requested_symbol}
                    onChange={(e) => setNewExchange({...newExchange, requested_symbol: e.target.value.toUpperCase()})}
                    placeholder="Ej: GOOGL"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Cantidad:</label>
                  <input
                    type="number"
                    value={newExchange.requested_quantity}
                    onChange={(e) => setNewExchange({...newExchange, requested_quantity: e.target.value})}
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">🚀 Enviar Propuesta</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs para pendientes e historial */}
      <div className="exchange-tabs">
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          📥 Pendientes ({pendingExchanges.length})
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📋 Historial ({exchangeHistory.length})
        </button>
      </div>

      {/* Contenido de las tabs */}
      <div className="exchanges-content">
        {activeTab === 'pending' ? (
          <div className="exchanges-grid">
            {pendingExchanges.length === 0 ? (
              <div className="no-exchanges">
                <h3>📭 No hay intercambios pendientes</h3>
                <p>Las propuestas aparecerán aquí cuando lleguen</p>
              </div>
            ) : (
              pendingExchanges.map((exchange) => (
                <div key={exchange.id} className="exchange-card pending">
                  <div className="exchange-header">
                    <h3>Intercambio #{exchange.id.slice(0, 8)}</h3>
                    <span 
                      className="exchange-status"
                      style={{ backgroundColor: getStatusColor(exchange.status) }}
                    >
                      {getStatusIcon(exchange.status)} {exchange.status}
                    </span>
                  </div>
                  
                  <div className="exchange-details">
                    <div className="exchange-flow">
                      <div className="flow-side">
                        <h4>👥 Grupo #{exchange.origin_group_id}</h4>
                        <div className="flow-item">
                          <span className="flow-label">Ofrece:</span>
                          <span className="flow-value">
                            {exchange.offered_quantity} {exchange.offered_symbol}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flow-arrow">→</div>
                      
                      <div className="flow-side">
                        <h4>👥 Grupo #{exchange.target_group_id}</h4>
                        <div className="flow-item">
                          <span className="flow-label">Solicita:</span>
                          <span className="flow-value">
                            {exchange.requested_quantity} {exchange.requested_symbol}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="exchange-meta">
                      <span>📅 {new Date(exchange.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {isAuthenticated && exchange.status === 'PENDING' && (
                    <div className="exchange-actions">
                      <button 
                        className="btn-success"
                        onClick={() => handleAcceptExchange(exchange.id)}
                      >
                        ✅ Aceptar
                      </button>
                      <button 
                        className="btn-danger"
                        onClick={() => handleRejectExchange(exchange.id)}
                      >
                        ❌ Rechazar
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="exchanges-grid">
            {exchangeHistory.length === 0 ? (
              <div className="no-exchanges">
                <h3>📭 No hay historial de intercambios</h3>
                <p>Los intercambios completados aparecerán aquí</p>
              </div>
            ) : (
              exchangeHistory.map((exchange) => (
                <div key={exchange.id} className="exchange-card history">
                  <div className="exchange-header">
                    <h3>Intercambio #{exchange.id.slice(0, 8)}</h3>
                    <span 
                      className="exchange-status"
                      style={{ backgroundColor: getStatusColor(exchange.status) }}
                    >
                      {getStatusIcon(exchange.status)} {exchange.status}
                    </span>
                  </div>
                  
                  <div className="exchange-details">
                    <div className="exchange-flow">
                      <div className="flow-side">
                        <h4>👥 Grupo #{exchange.origin_group_id}</h4>
                        <div className="flow-item">
                          <span className="flow-label">Ofreció:</span>
                          <span className="flow-value">
                            {exchange.offered_quantity} {exchange.offered_symbol}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flow-arrow">→</div>
                      
                      <div className="flow-side">
                        <h4>👥 Grupo #{exchange.target_group_id}</h4>
                        <div className="flow-item">
                          <span className="flow-label">Solicitó:</span>
                          <span className="flow-value">
                            {exchange.requested_quantity} {exchange.requested_symbol}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="exchange-meta">
                      <span>📅 Creado: {new Date(exchange.created_at).toLocaleString()}</span>
                      <span>🔄 Actualizado: {new Date(exchange.updated_at).toLocaleString()}</span>
                      {exchange.reason && (
                        <span>💬 Motivo: {exchange.reason}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="exchanges-info">
        <h4>ℹ️ Información del Sistema</h4>
        <ul>
          <li><strong>RF05:</strong> ✅ Sistema completo de intercambios implementado</li>
          <li><strong>RNF04:</strong> ✅ Recibiendo propuestas de otros grupos via MQTT</li>
          <li><strong>RNF05:</strong> ✅ Publicando nuestras propuestas al broker automáticamente</li>
        </ul>
      </div>
    </div>
  );
};

export default Exchanges; 