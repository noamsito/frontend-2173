import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; // ✅ IMPORTAR PORTAL
import { useAuth0 } from '@auth0/auth0-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { WebSocketStatus } from './WebSocketStatus';
import { RealtimeNotifications } from './RealtimeNotifications';
import { getStocks } from '../api/apiService';

export function StockList() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [buttonRect, setButtonRect] = useState(null); // ✅ POSICIÓN DEL BOTÓN
    const buttonRef = useRef(null); // ✅ REF DEL BOTÓN
    const { stockUpdates, isConnected, notifications } = useWebSocket();
    const { isAuthenticated, getAccessTokenSilently } = useAuth0();

    // ✅ ACTUALIZAR STOCKS CUANDO LLEGUEN ACTUALIZACIONES
    useEffect(() => {
        if (stockUpdates.length > 0) {
            const latestUpdate = stockUpdates[0];
            
            if (latestUpdate.data) {
                setStocks(prevStocks => 
                    prevStocks.map(stock => 
                        stock.symbol === latestUpdate.data.symbol
                            ? { 
                                ...stock, 
                                quantity: latestUpdate.data.remaining_quantity || latestUpdate.data.available_quantity,
                                last_updated: latestUpdate.timestamp
                              }
                            : stock
                    )
                );
            }
        }
    }, [stockUpdates]);

    // ✅ CARGAR STOCKS INICIAL
    useEffect(() => {
        if (isAuthenticated) {
            fetchStocks();
        }
    }, [isAuthenticated]);

    // ✅ MANEJAR APERTURA/CIERRE DEL DROPDOWN
    const handleToggle = () => {
        if (!isOpen && buttonRef.current) {
            // Calcular posición del botón
            const rect = buttonRef.current.getBoundingClientRect();
            setButtonRect({
                top: rect.top,
                left: rect.right + 12, // 12px a la derecha del botón
                bottom: rect.bottom,
                right: rect.right
            });
        }
        setIsOpen(!isOpen);
    };

    // ✅ CERRAR DROPDOWN AL HACER CLICK FUERA
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && buttonRef.current && !buttonRef.current.contains(event.target)) {
                // Verificar si el click fue dentro del dropdown portal
                const dropdownPortal = document.querySelector('.realtime-dropdown-portal');
                if (!dropdownPortal || !dropdownPortal.contains(event.target)) {
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // ✅ CERRAR DROPDOWN AL HACER SCROLL O RESIZE
    useEffect(() => {
        const handleScroll = () => {
            if (isOpen) {
                setIsOpen(false);
            }
        };

        const handleResize = () => {
            if (isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    const fetchStocks = async () => {
        if (!isAuthenticated) return;
        
        try {
            setLoading(true);
            setError('');
            
            const token = await getAccessTokenSilently({
                audience: 'https://stockmarket-api/',
                scope: 'openid profile email'
            });
            
            const data = await getStocks({ page: 1, count: 5 }, token);
            setStocks(data.data || []);
        } catch (error) {
            console.error('Error fetching stocks:', error);
            setError('Error al cargar stocks');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    // ✅ COMPONENTE DROPDOWN SEPARADO
    const DropdownContent = () => (
        <div className="realtime-dropdown-content">
            {/* Header del dropdown */}
            <div className="realtime-dropdown-header">
                <h4>📊 Centro de Tiempo Real</h4>
                <WebSocketStatus />
            </div>

            {/* Estado de conexión */}
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                <span className="status-icon">{isConnected ? '🟢' : '🔴'}</span>
                <span className="status-text">
                    {isConnected ? 'Conectado - Recibiendo actualizaciones' : 'Desconectado'}
                </span>
            </div>

            {/* Lista de stocks recientes */}
            <div className="stocks-section">
                <h5>🔄 Stocks Monitoreados</h5>
                {loading && <div className="loading-text">Cargando...</div>}
                {error && <div className="error-text">{error}</div>}
                
                {stocks.length > 0 ? (
                    <div className="stocks-grid">
                        {stocks.map((stock) => (
                            <div key={stock.symbol} className="stock-card-mini">
                                <div className="stock-card-header">
                                    <span className="stock-symbol">{stock.symbol}</span>
                                    {stock.last_updated && (
                                        <span className="updated-badge">●</span>
                                    )}
                                </div>
                                <div className="stock-card-details">
                                    <span className="stock-price">${stock.price}</span>
                                    <span className="stock-qty">Qty: {stock.quantity}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-stocks">No hay stocks disponibles</div>
                )}
            </div>

            {/* Notificaciones dentro del dropdown */}
            <div className="notifications-section">
                <h5>🔔 Notificaciones Recientes</h5>
                {notifications.length > 0 ? (
                    <div className="notifications-list-dropdown">
                        {notifications.slice(0, 5).map((notification) => (
                            <div
                                key={notification.id}
                                className={`notification-item-dropdown ${notification.type}`}
                            >
                                <p className="notification-message-dropdown">
                                    {notification.message}
                                </p>
                                <p className="notification-time-dropdown">
                                    {new Date(notification.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-stocks">No hay notificaciones</div>
                )}
            </div>

            {/* Botón para cerrar */}
            <div className="dropdown-footer">
                <button 
                    className="close-dropdown-btn"
                    onClick={() => setIsOpen(false)}
                >
                    Cerrar Panel
                </button>
            </div>
        </div>
    );

    return (
        <div className="realtime-widget">
            {/* ✅ BOTÓN COMPACTO EN EL HEADER */}
            <button 
                ref={buttonRef} // ✅ REF PARA CALCULAR POSICIÓN
                className={`realtime-toggle ${isConnected ? 'connected' : 'disconnected'}`}
                onClick={handleToggle}
                title="Ver actualizaciones en tiempo real"
            >
                <span className="realtime-icon">📡</span>
                <span className="realtime-text">Tiempo Real</span>
                <span className={`connection-dot ${isConnected ? 'connected' : 'disconnected'}`}></span>
                <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▶</span>
            </button>

            {/* ✅ DROPDOWN USANDO PORTAL - SE RENDERIZA EN BODY */}
            {isOpen && buttonRect && createPortal(
                <div 
                    className="realtime-dropdown-portal"
                    style={{
                        position: 'fixed',
                        top: buttonRect.top,
                        left: buttonRect.left,
                        zIndex: 9999
                    }}
                >
                    {/* ✅ FLECHA APUNTANDO AL BOTÓN */}
                    <div className="dropdown-arrow-pointer"></div>
                    <DropdownContent />
                </div>,
                document.body // ✅ SE RENDERIZA DIRECTAMENTE EN EL BODY
            )}

            {/* ✅ NOTIFICACIONES TOAST */}
            <RealtimeNotifications />
        </div>
    );
}