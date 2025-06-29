import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export function RealtimeNotifications() {
    const { notifications, clearNotifications } = useWebSocket();
    const [visibleNotifications, setVisibleNotifications] = useState([]);

    useEffect(() => {
        if (notifications.length > 0) {
            // Mostrar solo las últimas 3 notificaciones
            setVisibleNotifications(notifications.slice(0, 3));
            
            // Auto-ocultar después de 5 segundos
            const timer = setTimeout(() => {
                setVisibleNotifications([]);
            }, 5000);
            
            return () => clearTimeout(timer);
        }
    }, [notifications]);

    if (visibleNotifications.length === 0) return null;

    return (
        <div className="realtime-notifications">
            {visibleNotifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`notification-toast ${notification.type}`}
                >
                    <div className="toast-content">
                        <span className="toast-icon">
                            {notification.type === 'success' ? '✅' : 
                             notification.type === 'error' ? '❌' : 
                             notification.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        <div className="toast-text">
                            <p className="toast-message">{notification.message}</p>
                            <p className="toast-time">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                    <button 
                        className="toast-close"
                        onClick={() => setVisibleNotifications(prev => 
                            prev.filter(n => n.id !== notification.id)
                        )}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}