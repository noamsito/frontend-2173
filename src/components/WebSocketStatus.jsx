import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export function WebSocketStatus() {
    const { connectionStatus, testConnection } = useWebSocket();

    const getStatusClass = () => {
        if (connectionStatus.connected) return 'websocket-status connected';
        if (connectionStatus.reconnectAttempts > 0) return 'websocket-status reconnecting';
        return 'websocket-status disconnected';
    };

    const getStatusText = () => {
        if (connectionStatus.connected) return 'Conectado';
        if (connectionStatus.reconnectAttempts > 0) return 'Reconectando...';
        return 'Desconectado';
    };

    const getStatusIcon = () => {
        if (connectionStatus.connected) return '🟢';
        if (connectionStatus.reconnectAttempts > 0) return '🟡';
        return '🔴';
    };

    return (
        <div className={getStatusClass()}>
            <span className="status-icon">{getStatusIcon()}</span>
            <span className="status-text">{getStatusText()}</span>
            {connectionStatus.connected && (
                <button 
                    onClick={testConnection}
                    className="status-test-btn"
                    title="Probar conexión"
                >
                    📡
                </button>
            )}
        </div>
    );
}