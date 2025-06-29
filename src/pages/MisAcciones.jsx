import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import '../styles/misacciones.css';

const MisAcciones = () => {
    const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdate, setLastUpdate] = useState(null);

    // Helper para hacer requests autenticados
    const makeAuthenticatedRequest = async (url, options = {}) => {
        if (!isAuthenticated) {
            throw new Error('Usuario no autenticado');
        }
        
        try {
            const token = await getAccessTokenSilently();
            return fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    ...options.headers
                }
            });
        } catch (error) {
            console.error('Error obteniendo token:', error);
            throw error;
        }
    };

    const fetchMyStocks = async () => {
        if (!isAuthenticated) {
            console.log('Usuario no autenticado, saltando fetchMyStocks');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest('http://localhost:3000/my-stocks');
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    setStocks(data.stocks);
                    setLastUpdate(new Date(data.calculatedAt));
                    setError('');
                } else {
                    setError('Error al obtener las acciones');
                }
            } else {
                throw new Error(`Error ${response.status}`);
            }
        } catch (err) {
            console.error('Error fetching stocks:', err);
            setError('Error de conexión al obtener las acciones');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Solo cargar datos cuando Auth0 haya terminado de cargar y el usuario esté autenticado
        if (!isLoading && isAuthenticated) {
            fetchMyStocks();
            
            // Auto-actualizar cada 30 segundos
            const interval = setInterval(fetchMyStocks, 30000);
            return () => clearInterval(interval);
        }
    }, [isLoading, isAuthenticated]);

    const getTotalStocks = () => {
        return stocks.reduce((total, stock) => total + stock.quantity, 0);
    };

    // Mostrar loading mientras Auth0 está cargando
    if (isLoading) {
        return (
            <div className="mis-acciones-container">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>⏳ Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    // Verificar autenticación
    if (!isAuthenticated) {
        return (
            <div className="mis-acciones-container">
                <div className="header">
                    <h1>📊 Mis Acciones</h1>
                    <div className="error-message">
                        ⚠️ Necesitas estar autenticado para ver tu inventario de acciones.
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="mis-acciones-container">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Cargando tu inventario de acciones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mis-acciones-container">
            <div className="header">
                <h1>📊 Mis Acciones</h1>
                <p className="subtitle">Tu inventario completo de acciones</p>
                <div className="stats">
                    <div className="stat-card">
                        <span className="stat-number">{stocks.length}</span>
                        <span className="stat-label">Símbolos Diferentes</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">{getTotalStocks()}</span>
                        <span className="stat-label">Total de Acciones</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <span>❌ {error}</span>
                    <button onClick={fetchMyStocks} className="retry-btn">
                        🔄 Reintentar
                    </button>
                </div>
            )}

            <div className="controls">
                <button 
                    onClick={fetchMyStocks}
                    className="refresh-btn"
                    disabled={loading}
                >
                    🔄 Actualizar Inventario
                </button>
                {lastUpdate && (
                    <span className="last-update">
                        Última actualización: {lastUpdate.toLocaleString()}
                    </span>
                )}
            </div>

            {stocks.length === 0 ? (
                <div className="no-stocks">
                    <div className="no-stocks-icon">📦</div>
                    <h3>No tienes acciones aún</h3>
                    <p>Compra acciones, gana subastas o realiza intercambios para agregar acciones a tu inventario.</p>
                    <div className="suggestions">
                        <p><strong>💡 Formas de obtener acciones:</strong></p>
                        <ul>
                            <li>🛒 Comprar acciones directamente</li>
                            <li>🏆 Ganar subastas de otros grupos</li>
                            <li>🔄 Intercambiar con otros grupos</li>
                            <li>🎁 Recibir de ofertas aceptadas</li>
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="stocks-grid">
                    {stocks.map((stock, index) => (
                        <div key={stock.symbol} className="stock-card">
                            <div className="stock-header">
                                <h3 className="stock-symbol">{stock.symbol}</h3>
                                <div className="stock-quantity">
                                    <span className="quantity-number">{stock.quantity}</span>
                                    <span className="quantity-label">acciones</span>
                                </div>
                            </div>
                            
                            <div className="stock-details">
                                <div className="detail-row">
                                    <span className="detail-label">📈 Cantidad:</span>
                                    <span className="detail-value">{stock.quantity} unidades</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">🔢 Transacciones:</span>
                                    <span className="detail-value">{stock.transactions}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">⏰ Última transacción:</span>
                                    <span className="detail-value">
                                        {new Date(stock.lastTransaction).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="stock-actions">
                                <button className="action-btn offer">
                                    📢 Crear Oferta
                                </button>
                                <button className="action-btn auction">
                                    🏺 Subastar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="info-panel">
                <h3>ℹ️ Información sobre tu inventario</h3>
                <div className="info-content">
                    <p><strong>¿Qué incluye "Mis Acciones"?</strong></p>
                    <ul>
                        <li>✅ Acciones compradas directamente</li>
                        <li>✅ Acciones recibidas por intercambios</li>
                        <li>✅ Cualquier acción que actualmente poseas</li>
                    </ul>
                    <p><strong>Cálculo automático:</strong> Tu inventario se calcula en tiempo real sumando todas las transacciones positivas y restando las entregas/ventas.</p>
                </div>
            </div>
        </div>
    );
};

export default MisAcciones; 