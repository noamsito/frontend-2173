// src/hooks/useWebSocket.js
import { useEffect, useState, useCallback } from 'react';
import { websocketService } from '../services/websocketService';

export function useWebSocket() {
    const [connectionStatus, setConnectionStatus] = useState({
        connected: false,
        socketId: null,
        reconnectAttempts: 0
    });
    const [stockUpdates, setStockUpdates] = useState([]);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Conectar al montar el componente
        websocketService.connect();

        // ✅ SUSCRIBIRSE A EVENTOS DE CONEXIÓN
        const unsubscribeConnection = websocketService.subscribe(
            'connection_status', 
            (status) => {
                setConnectionStatus(websocketService.getConnectionStatus());
            }
        );

        // ✅ SUSCRIBIRSE A ACTUALIZACIONES DE STOCK
        const unsubscribeStockUpdates = websocketService.subscribe(
            'external_purchase',
            (update) => {
                setStockUpdates(prev => [update, ...prev.slice(0, 49)]); // Mantener solo 50
                addNotification(update.message, 'info');
            }
        );

        const unsubscribeLowStock = websocketService.subscribe(
            'low_stock_alert',
            (update) => {
                addNotification(update.message, 'warning');
            }
        );

        const unsubscribeOutOfStock = websocketService.subscribe(
            'out_of_stock',
            (update) => {
                addNotification(update.message, 'error');
            }
        );

        const unsubscribeInsufficientStock = websocketService.subscribe(
            'insufficient_stock',
            (update) => {
                addNotification(update.message, 'warning');
            }
        );

        // ✅ CLEANUP AL DESMONTAR
        return () => {
            unsubscribeConnection();
            unsubscribeStockUpdates();
            unsubscribeLowStock();
            unsubscribeOutOfStock();
            unsubscribeInsufficientStock();
            // NO desconectar aquí - mantener conexión global
        };
    }, []);

    const addNotification = useCallback((message, type = 'info') => {
        const notification = {
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: new Date().toISOString()
        };
        
        setNotifications(prev => [notification, ...prev.slice(0, 19)]); // Mantener solo 20
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const clearStockUpdates = useCallback(() => {
        setStockUpdates([]);
    }, []);

    return {
        connectionStatus,
        stockUpdates,
        notifications,
        clearNotifications,
        clearStockUpdates,
        isConnected: connectionStatus.connected,
        testConnection: websocketService.testConnection.bind(websocketService)
    };
}  