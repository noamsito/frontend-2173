// src/services/websocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        if (this.socket?.connected) {
            console.log('📡 WebSocket ya está conectado');
            return;
        }

        console.log('📡 Conectando a WebSocket...');
        
        this.socket = io('http://localhost:3000', {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: this.maxReconnectAttempts
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        // ✅ EVENTOS DE CONEXIÓN
        this.socket.on('connect', () => {
            console.log('✅ WebSocket conectado:', this.socket.id);
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.notifyListeners('connection_status', { connected: true });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket desconectado:', reason);
            this.isConnected = false;
            this.notifyListeners('connection_status', { connected: false, reason });
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Error de conexión WebSocket:', error);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('❌ Máximo de intentos de reconexión alcanzado');
                this.notifyListeners('connection_error', { 
                    error: 'Conexión perdida permanentemente' 
                });
            }
        });

        // ✅ MENSAJE DE BIENVENIDA DEL SERVIDOR
        this.socket.on('connected', (data) => {
            console.log('🎉 Mensaje del servidor:', data.message);
            this.notifyListeners('server_welcome', data);
        });

        // ✅ ACTUALIZACIONES DE STOCK (RF06)
        this.socket.on('stock-update', (update) => {
            console.log('📈 Actualización de stock recibida:', update);
            this.handleStockUpdate(update);
        });
    }

    handleStockUpdate(update) {
        const { type, data, timestamp } = update;

        switch (type) {
            case 'external_purchase':
                this.notifyListeners('external_purchase', {
                    message: `${data.group_id} compró ${data.quantity_purchased} acciones de ${data.symbol}`,
                    data: data,
                    timestamp: timestamp
                });
                break;

            case 'insufficient_stock':
                this.notifyListeners('insufficient_stock', {
                    message: `Stock insuficiente: ${data.symbol} (solicitado: ${data.requested_quantity}, disponible: ${data.available_quantity})`,
                    data: data,
                    timestamp: timestamp
                });
                break;

            case 'low_stock_alert':
                this.notifyListeners('low_stock_alert', {
                    message: `⚠️ Stock bajo: ${data.symbol} (${data.remaining_quantity} restantes)`,
                    data: data,
                    timestamp: timestamp
                });
                break;

            case 'out_of_stock':
                this.notifyListeners('out_of_stock', {
                    message: `🚫 Stock agotado: ${data.symbol}`,
                    data: data,
                    timestamp: timestamp
                });
                break;

            case 'external_purchase_error':
                this.notifyListeners('external_purchase_error', {
                    message: `Error en compra externa: ${data.error}`,
                    data: data,
                    timestamp: timestamp
                });
                break;

            default:
                console.log('📡 Tipo de actualización desconocido:', type, data);
        }
    }

    // ✅ SISTEMA DE SUSCRIPCIONES
    subscribe(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);

        // Retornar función para desuscribirse
        return () => this.unsubscribe(eventType, callback);
    }

    unsubscribe(eventType, callback) {
        if (this.listeners.has(eventType)) {
            const callbacks = this.listeners.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    notifyListeners(eventType, data) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en listener de ${eventType}:`, error);
                }
            });
        }
    }

    // ✅ MÉTODOS ÚTILES
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            socketId: this.socket?.id || null,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    disconnect() {
        if (this.socket) {
            console.log('📡 Desconectando WebSocket...');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }

    // ✅ MÉTODO PARA TESTING
    testConnection() {
        if (!this.isConnected) {
            console.error('❌ WebSocket no está conectado');
            return false;
        }

        // Enviar ping al servidor para verificar conexión
        this.socket.emit('ping', { timestamp: Date.now() });
        return true;
    }
}

// ✅ SINGLETON PARA USO GLOBAL
export const websocketService = new WebSocketService();
export default websocketService;