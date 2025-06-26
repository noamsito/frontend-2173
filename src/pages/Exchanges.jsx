import React, { useState, useEffect } from 'react';
import { apiConfig } from '../api/apiConfig';
import '../styles/exchanges.css';

const Exchanges = () => {
    const [symbol, setSymbol] = useState('');
    const [quantity, setQuantity] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [externalOffers, setExternalOffers] = useState([]);
    const [selectedOffer, setSelectedOffer] = useState(null);
    const [proposalQuantity, setProposalQuantity] = useState('');
    const [proposalSymbol, setProposalSymbol] = useState('');
    const [lastUpdate, setLastUpdate] = useState(null);
  const [exchangeHistory, setExchangeHistory] = useState([]);
    const [userStocks, setUserStocks] = useState([]);

    // Función para obtener las acciones que posee el usuario
    const fetchUserStocks = async () => {
    try {
            const response = await fetch('http://localhost:3000/admin/my-stocks');
      if (response.ok) {
        const data = await response.json();
                console.log('📦 Inventario real recibido desde MIS ACCIONES:', data);
                
                if (data.status === 'success' && data.stocks) {
                    // Los datos ya vienen procesados desde el backend
                    setUserStocks(data.stocks);
                    console.log('📊 Acciones disponibles (inventario real):', data.stocks);
                } else {
                    console.error('Error en respuesta del inventario:', data);
                    setUserStocks([]);
                }
            } else {
                console.error('Error HTTP al obtener inventario:', response.status, response.statusText);
                setUserStocks([]);
      }
    } catch (error) {
            console.error('Error fetching user stocks:', error);
            setUserStocks([]);
    }
  };

    // Función para obtener historial de intercambios
  const fetchExchangeHistory = async () => {
    try {
            const response = await fetch('http://localhost:3000/admin/exchange-history');
      if (response.ok) {
        const data = await response.json();
                setExchangeHistory(data.history || []);
      }
    } catch (error) {
            console.error('Error fetching exchange history:', error);
    }
  };

  useEffect(() => {
        // Cargar ofertas al inicializar
        loadExternalOffers();
        fetchExchangeHistory();
        fetchUserStocks();
        
        // Auto-actualizar cada 10 segundos
        const interval = setInterval(() => {
            loadExternalOffers();
            fetchExchangeHistory();
            fetchUserStocks();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const loadExternalOffers = async () => {
        try {
            const response = await fetch(`${apiConfig.baseURL}/admin/external-offers`, {
                headers: apiConfig.getHeaders()
            });
            const data = await response.json();
            if (data.status === 'success') {
                setExternalOffers(data.offers);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Error al cargar ofertas externas:', error);
        }
    };

    // Crear oferta general
    const handleCreateOffer = async () => {
        if (!symbol || !quantity) {
            setMessage('⚠️ Por favor, completa todos los campos');
            return;
        }

        // Verificar que el usuario tiene suficientes acciones del símbolo seleccionado
        const userStock = userStocks.find(stock => stock.symbol === symbol);
        if (!userStock) {
            alert(`No posees acciones de ${symbol}`);
            return;
        }
        
        if (parseInt(quantity) > userStock.quantity) {
            alert(`Solo posees ${userStock.quantity} acciones de ${symbol}. No puedes ofrecer ${quantity}.`);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/admin/auctions/offer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    symbol: symbol,
                    quantity: parseInt(quantity)
                })
            });

            if (response.ok) {
                const result = await response.json();
                setMessage(`✅ ${result.message}`);
                console.log('🎯 Oferta creada:', result.auction);
                
                // Limpiar formulario
                setSymbol('');
                setQuantity('');
                
                // Actualizar datos
                await fetchUserStocks();
                await fetchExchangeHistory();
            } else {
                const errorData = await response.json();
                setMessage(`❌ ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('❌ Error de conexión');
        } finally {
        setLoading(false);
      }
    };

    // Crear propuesta como respuesta a una oferta existente
    const handleCreateProposal = async (originalOffer) => {
        if (!proposalQuantity || !proposalSymbol) {
            alert('Por favor completa el símbolo y la cantidad');
            return;
        }

        // Verificar que el usuario tiene suficientes acciones del símbolo seleccionado
        const userStock = userStocks.find(stock => stock.symbol === proposalSymbol);
        if (!userStock) {
            alert(`No posees acciones de ${proposalSymbol}`);
            return;
        }
        
        if (parseInt(proposalQuantity) > userStock.quantity) {
            alert(`Solo posees ${userStock.quantity} acciones de ${proposalSymbol}. No puedes ofrecer ${proposalQuantity}.`);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/admin/auctions/proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
                    symbol: proposalSymbol, // Usar el símbolo seleccionado
                    quantity: parseInt(proposalQuantity),
                    auction_id: originalOffer.auction_id,
                    target_group_id: originalOffer.group_id
                })
      });

      if (response.ok) {
                const result = await response.json();
                console.log('✅ Propuesta creada:', result);
                alert(`¡Contrapropuesta enviada! Ofreces ${proposalQuantity} ${proposalSymbol} por ${originalOffer.quantity} ${originalOffer.symbol}`);
                
                // Limpiar formulario
                setSelectedOffer(null);
                setProposalQuantity('');
                setProposalSymbol('');
                
                // Actualizar datos
                await fetchUserStocks();
                await fetchExchangeHistory();
      } else {
                throw new Error(`Error ${response.status}`);
      }
    } catch (error) {
            console.error('Error enviando propuesta:', error);
            alert('Error al enviar la contrapropuesta');
        } finally {
            setLoading(false);
    }
  };

    // Aceptar o rechazar propuesta
    const handleAcceptProposal = async (proposal) => {
        setLoading(true);
    try {
            const response = await fetch('http://localhost:3000/admin/auctions/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
                body: JSON.stringify({
                    auction_id: proposal.auction_id,
                    proposal_id: proposal.proposal_id,
                    action: 'accept',
                    symbol: proposal.symbol, // Mantener símbolo de la propuesta
                    quantity: proposal.quantity // Mantener cantidad de la propuesta
                })
      });

      if (response.ok) {
                const result = await response.json();
                console.log('✅ Propuesta aceptada:', result);
                alert(`¡Propuesta aceptada! Intercambio: ${proposal.quantity} ${proposal.symbol}`);
                await loadExternalOffers(); // Actualizar lista
                await fetchExchangeHistory(); // Actualizar historial
                await fetchUserStocks(); // Actualizar inventario
      } else {
                throw new Error(`Error ${response.status}`);
      }
    } catch (error) {
            console.error('Error aceptando propuesta:', error);
            alert('Error al aceptar la propuesta');
        } finally {
            setLoading(false);
    }
  };

    const handleRejectProposal = async (proposal) => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3000/admin/auctions/respond', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    auction_id: proposal.auction_id,
                    proposal_id: proposal.proposal_id,
                    action: 'reject',
                    symbol: proposal.symbol, // Mantener símbolo de la propuesta
                    quantity: proposal.quantity // Mantener cantidad de la propuesta
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Propuesta rechazada:', result);
                alert(`Propuesta rechazada: ${proposal.quantity} ${proposal.symbol}`);
                await loadExternalOffers(); // Actualizar lista
                await fetchExchangeHistory(); // Actualizar historial
            } else {
                throw new Error(`Error ${response.status}`);
            }
        } catch (error) {
            console.error('Error rechazando propuesta:', error);
            alert('Error al rechazar la propuesta');
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="exchanges-container">
            <h1>🔄 Sistema de Ofertas e Intercambios</h1>

            {message && (
                <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            {/* Formulario para crear ofertas generales */}
            <div className="exchange-form">
                <h2>📢 Crear Oferta General</h2>
                <p>Publica una oferta que será visible para todos los grupos</p>
                
                <div className="form-group">
                    <label>Símbolo de la Acción que Posees:</label>
                    <select
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value)}
                    >
                        <option value="">Selecciona un símbolo que posees</option>
                        {userStocks.map(stock => (
                            <option key={stock.symbol} value={stock.symbol}>
                                {stock.symbol} (Disponibles: {stock.quantity})
                            </option>
                        ))}
                    </select>
                    {userStocks.length === 0 && (
                        <small className="no-stocks-warning">
                            ⚠️ No posees acciones para ofrecer. Ve a "Mis Acciones" para ver tu inventario.
                        </small>
                    )}
                </div>

                <div className="form-group">
                  <label>Cantidad:</label>
                  <input
                    type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Número de acciones"
                    min="1"
                        max={userStocks.find(s => s.symbol === symbol)?.quantity || 0}
                    />
                    {symbol && userStocks.find(s => s.symbol === symbol) && (
                        <small>
                            💼 Tienes {userStocks.find(s => s.symbol === symbol).quantity} acciones de {symbol} disponibles
                        </small>
                    )}
            </div>

                <button 
                    onClick={handleCreateOffer}
                    className="submit-btn offer"
                    disabled={loading || !symbol || !quantity || userStocks.length === 0}
                >
                    {loading ? '⏳ Procesando...' : '📢 Publicar Oferta General'}
              </button>
            </div>

            {/* Lista de ofertas externas */}
            <div className="external-offers">
                <div className="offers-header">
                    <h2>📋 Ofertas de Otros Grupos</h2>
                    <div className="offers-controls">
        <button 
                            onClick={loadExternalOffers}
                            className="refresh-btn"
                            disabled={loading}
        >
                            🔄 Actualizar
        </button>
                        {lastUpdate && (
                            <span className="last-update">
                                Última actualización: {lastUpdate.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
      </div>

                <p>Responde a ofertas con propuestas dirigidas • Auto-actualización cada 10 segundos</p>

                {externalOffers.length > 0 ? (
                    <div className="offers-list">
                        {externalOffers.map((offer, index) => (
                            <div key={`${offer.auction_id}-${offer.proposal_id}-${index}`} className="offer-card">
                                <div className="offer-header">
                                    <h3>
                                        {offer.operation === 'offer' && '📢 Oferta'}
                                        {offer.operation === 'proposal' && '💬 Propuesta'}
                                        {offer.operation === 'acceptance' && '✅ Aceptación'}
                                        {offer.operation === 'rejection' && '❌ Rechazo'}
                                        {' '}#{offer.auction_id.slice(0, 8)}...
                                    </h3>
                                    <span className="group-badge">Grupo {offer.group_id}</span>
              </div>
                                
                                <div className="offer-details">
                                    <p><strong>Símbolo:</strong> {offer.symbol}</p>
                                    <p><strong>Cantidad:</strong> {offer.quantity}</p>
                                    <p><strong>Operación:</strong> {offer.operation}</p>
                                    <p><strong>Timestamp:</strong> {new Date(offer.timestamp).toLocaleString()}</p>
                                    {offer.proposal_id && (
                                        <p><strong>Propuesta ID:</strong> {offer.proposal_id.slice(0, 8)}...</p>
                                    )}
                                    <p><strong>Recibido:</strong> {new Date(offer.received_at).toLocaleString()}</p>
                  </div>
                  
                                {offer.operation === 'offer' && (
                                    <div className="proposal-section">
                                        {selectedOffer?.auction_id === offer.auction_id ? (
                                            <div className="proposal-form">
                                                <div className="offer-context">
                                                    <h4>📝 Responder a oferta del Grupo {offer.group_id}</h4>
                                                    <div className="context-info">
                                                        <p><strong>Oferta recibida:</strong> {offer.quantity} acciones de {offer.symbol}</p>
                                                        <p><strong>Tu contrapropuesta:</strong> Ofrece algo diferente a cambio</p>
                        </div>
                      </div>
                      
                                                <div className="proposal-input-group">
                                                    <label>Símbolo que ofreces:</label>
                                                    <select
                                                        value={proposalSymbol}
                                                        onChange={(e) => setProposalSymbol(e.target.value)}
                                                    >
                                                        <option value="">Selecciona un símbolo que posees</option>
                                                        {userStocks.map(stock => (
                                                            <option key={stock.symbol} value={stock.symbol}>
                                                                {stock.symbol} (Disponibles: {stock.quantity})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {userStocks.length === 0 && (
                                                        <small className="no-stocks-warning">
                                                            ⚠️ No posees acciones para intercambiar. Ve a "Mis Acciones" para ver tu inventario.
                                                        </small>
                                                    )}
                                                </div>

                                                <div className="proposal-input-group">
                                                    <label>Cantidad que ofreces:</label>
                                                    <input
                                                        type="number"
                                                        value={proposalQuantity}
                                                        onChange={(e) => setProposalQuantity(e.target.value)}
                                                        placeholder="Cantidad a ofrecer"
                                                        min="1"
                                                        max={userStocks.find(s => s.symbol === proposalSymbol)?.quantity || 0}
                                                    />
                                                    {proposalSymbol && userStocks.find(s => s.symbol === proposalSymbol) && (
                                                        <small>
                                                            💼 Tienes {userStocks.find(s => s.symbol === proposalSymbol).quantity} acciones de {proposalSymbol} disponibles
                                                        </small>
                                                    )}
                        </div>

                                                <div className="exchange-summary">
                                                    <h5>📋 Resumen del Intercambio:</h5>
                                                    <p><strong>Grupo {offer.group_id} ofrece:</strong> {offer.quantity} {offer.symbol}</p>
                                                    <p><strong>Tú ofreces:</strong> {proposalQuantity || '___'} {proposalSymbol || '___'}</p>
                                                    <small>💡 Si aceptan, recibirás {offer.quantity} {offer.symbol} y darás {proposalQuantity || '___'} {proposalSymbol || '___'}</small>
                    </div>
                    
                                                <div className="proposal-buttons">
                                                    <button 
                                                        onClick={() => handleCreateProposal(offer)}
                                                        className="propose-btn"
                                                        disabled={loading || !proposalQuantity || !proposalSymbol}
                                                    >
                                                        🎯 Enviar Contrapropuesta
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedOffer(null);
                                                            setProposalQuantity('');
                                                            setProposalSymbol('');
                                                        }}
                                                        className="cancel-btn"
                                                    >
                                                        ❌ Cancelar
                                                    </button>
                    </div>
                  </div>
                                        ) : (
                                            <button 
                                                onClick={() => setSelectedOffer(offer)}
                                                className="respond-btn"
                                            >
                                                💬 Responder a esta Oferta
                                            </button>
                                        )}
                                    </div>
                                )}

                                {offer.operation === 'proposal' && offer.proposal_id && (
                                    <div className="response-section">
                                        <div className="response-buttons">
                      <button 
                                                onClick={() => handleAcceptProposal(offer)}
                                                className="accept-btn"
                                                disabled={loading}
                      >
                        ✅ Aceptar
                      </button>
                      <button 
                                                onClick={() => handleRejectProposal(offer)}
                                                className="reject-btn"
                                                disabled={loading}
                      >
                        ❌ Rechazar
                      </button>
                                        </div>
                    </div>
                  )}
                </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-offers">
                        <p>📭 No hay ofertas externas disponibles</p>
                        <button 
                            onClick={loadExternalOffers}
                            className="refresh-btn-large"
                        >
                            🔄 Verificar Ofertas
                        </button>
                    </div>
            )}
          </div>

            {/* Historial de Intercambios */}
            <div className="section">
                <h2 className="section-title">
                    📋 Mi Historial de Intercambios
                    <span className="history-count">({exchangeHistory.length})</span>
                </h2>
                
            {exchangeHistory.length === 0 ? (
                    <p className="no-data">No tienes historial de intercambios aún</p>
                ) : (
                    <div className="history-list">
                        {exchangeHistory.map((entry, index) => (
                            <div key={entry.id || index} className={`history-item ${entry.type.toLowerCase()}`}>
                                <div className="history-header">
                                    <span className="history-type">
                                        {entry.type === 'OFFER_CREATED' && '📢 Oferta Creada'}
                                        {entry.type === 'PROPOSAL_SENT' && '📤 Propuesta Enviada'}
                                        {entry.type === 'PROPOSAL_ACCEPTED' && '✅ Propuesta Aceptada'}
                                        {entry.type === 'PROPOSAL_REJECTED' && '❌ Propuesta Rechazada'}
                                        {entry.type === 'EXCHANGE_COMPLETED' && '🔄 Intercambio Completado'}
                                    </span>
                                    <span className="history-date">
                                        {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                                <div className="history-details">
                                    {entry.type === 'EXCHANGE_COMPLETED' ? (
                                        <div className="exchange-completed-details">
                    <div className="exchange-flow">
                                                <div className="exchange-gave">
                                                    <span className="exchange-label">📤 Entregué:</span>
                                                    <span className="exchange-amount">{entry.gave?.quantity} {entry.gave?.symbol}</span>
                        </div>
                                                <div className="exchange-arrow">→</div>
                                                <div className="exchange-received">
                                                    <span className="exchange-label">📥 Recibí:</span>
                                                    <span className="exchange-amount">{entry.received?.quantity} {entry.received?.symbol}</span>
                        </div>
                      </div>
                                            <p><strong>Intercambio con:</strong> Grupo {entry.counterpart_group}</p>
                                            <p><strong>Estado:</strong> {entry.status}</p>
                    </div>
                                    ) : (
                                        <>
                                            <p><strong>Símbolo:</strong> {entry.symbol || 'N/A'}</p>
                                            <p><strong>Cantidad:</strong> {entry.quantity || 'N/A'}</p>
                                            <p><strong>Estado:</strong> {entry.status}</p>
                                            {entry.target_group_id && (
                                                <p><strong>Grupo:</strong> {entry.target_group_id}</p>
                                            )}
                                        </>
                      )}
                    </div>
                  </div>
                        ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Exchanges; 