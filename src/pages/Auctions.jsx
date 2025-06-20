import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '../styles/auctions.css';

const Auctions = () => {
  const { getAccessTokenSilently, user, isAuthenticated } = useAuth0();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state para crear subasta
  const [newAuction, setNewAuction] = useState({
    symbol: '',
    quantity: '',
    starting_price: '',
    duration_minutes: '30'
  });

  // Cargar subastas activas
  const fetchAuctions = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions`);
      if (response.ok) {
        const data = await response.json();
        setAuctions(data.auctions || []);
      } else {
        throw new Error('Error cargando subastas');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuctions();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchAuctions, 30000);
    return () => clearInterval(interval);
  }, []);

  // Crear nueva subasta (RF04)
  const handleCreateAuction = async (e) => {
    e.preventDefault();
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newAuction,
          quantity: parseInt(newAuction.quantity),
          starting_price: parseFloat(newAuction.starting_price),
          duration_minutes: parseInt(newAuction.duration_minutes)
        }),
      });

      if (response.ok) {
        alert('✅ Subasta creada y publicada al broker exitosamente!');
        setShowCreateForm(false);
        setNewAuction({ symbol: '', quantity: '', starting_price: '', duration_minutes: '30' });
        fetchAuctions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando subasta');
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Hacer oferta en subasta (RF04)
  const handlePlaceBid = async (auctionId, currentPrice) => {
    const bidAmount = prompt(`Precio actual: $${currentPrice}\n¿Cuál es tu oferta?`);
    if (!bidAmount || isNaN(bidAmount)) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions/${auctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bid_amount: parseFloat(bidAmount) }),
      });

      if (response.ok) {
        alert('✅ Oferta realizada exitosamente!');
        fetchAuctions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error realizando oferta');
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  // Cerrar subasta (RF04)
  const handleCloseAuction = async (auctionId) => {
    if (!confirm('¿Estás seguro de cerrar esta subasta?')) return;

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auctions/${auctionId}/close`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('✅ Subasta cerrada exitosamente!');
        fetchAuctions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error cerrando subasta');
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  };

  if (loading) return <div className="loading">Cargando subastas...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="auctions-container">
      <div className="auctions-header">
        <h1>🏛️ Sistema de Subastas</h1>
        <div className="auction-stats">
          <span>📊 {auctions.length} subastas activas</span>
          <span>🔄 Actualización automática cada 30s</span>
        </div>
        {isAuthenticated && (
          <button 
            className="btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            ➕ Crear Subasta
          </button>
        )}
      </div>

      {/* Formulario para crear subasta */}
      {showCreateForm && isAuthenticated && (
        <div className="create-auction-form">
          <h3>Crear Nueva Subasta</h3>
          <form onSubmit={handleCreateAuction}>
            <div className="form-group">
              <label>Símbolo de Acción:</label>
              <input
                type="text"
                value={newAuction.symbol}
                onChange={(e) => setNewAuction({...newAuction, symbol: e.target.value.toUpperCase()})}
                placeholder="Ej: AAPL"
                required
              />
            </div>
            <div className="form-group">
              <label>Cantidad:</label>
              <input
                type="number"
                value={newAuction.quantity}
                onChange={(e) => setNewAuction({...newAuction, quantity: e.target.value})}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Precio Inicial ($):</label>
              <input
                type="number"
                step="0.01"
                value={newAuction.starting_price}
                onChange={(e) => setNewAuction({...newAuction, starting_price: e.target.value})}
                min="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Duración (minutos):</label>
              <select
                value={newAuction.duration_minutes}
                onChange={(e) => setNewAuction({...newAuction, duration_minutes: e.target.value})}
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="60">1 hora</option>
                <option value="120">2 horas</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">🚀 Crear y Publicar</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de subastas */}
      <div className="auctions-grid">
        {auctions.length === 0 ? (
          <div className="no-auctions">
            <h3>📭 No hay subastas activas</h3>
            <p>Las subastas aparecerán aquí cuando estén disponibles</p>
          </div>
        ) : (
          auctions.map((auction) => (
            <div key={auction.id} className="auction-card">
              <div className="auction-header">
                <h3>{auction.symbol}</h3>
                <span className="auction-status">🟢 ACTIVA</span>
              </div>
              
              <div className="auction-details">
                <div className="detail-row">
                  <span>📦 Cantidad:</span>
                  <span>{auction.quantity}</span>
                </div>
                <div className="detail-row">
                  <span>💰 Precio Actual:</span>
                  <span className="price">${auction.current_price}</span>
                </div>
                <div className="detail-row">
                  <span>🏁 Precio Inicial:</span>
                  <span>${auction.starting_price}</span>
                </div>
                <div className="detail-row">
                  <span>📊 Ofertas:</span>
                  <span>{auction.bid_count || 0}</span>
                </div>
                <div className="detail-row">
                  <span>⏰ Termina:</span>
                  <span>{new Date(auction.end_time).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span>👥 Grupo:</span>
                  <span>#{auction.group_id}</span>
                </div>
              </div>

              <div className="auction-actions">
                <button 
                  className="btn-bid"
                  onClick={() => handlePlaceBid(auction.id, auction.current_price)}
                >
                  💸 Hacer Oferta
                </button>
                {isAuthenticated && (
                  <button 
                    className="btn-danger"
                    onClick={() => handleCloseAuction(auction.id)}
                  >
                    🔒 Cerrar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="auctions-info">
        <h4>ℹ️ Información del Sistema</h4>
        <ul>
          <li><strong>RNF04:</strong> ✅ Recibiendo subastas de otros grupos via MQTT</li>
          <li><strong>RNF05:</strong> ✅ Publicando nuestras subastas al broker automáticamente</li>
          <li><strong>RF04:</strong> ✅ Sistema completo de subastas implementado</li>
        </ul>
      </div>
    </div>
  );
};

export default Auctions; 