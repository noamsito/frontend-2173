// ✅ USAR SOLO SOCKET.IO (más robusto para aplicaciones web)
import { io } from 'socket.io-client';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000; // ✅ DEFINIR INTERVALO
        this.connectionStatus = { // ✅ DEFINIR ESTADO DE CONEXIÓN
            connected: false,
            socketId: null,
            reconnectAttempts: 0
        };
    }

    connect() {
        // ✅ VERIFICAR SI YA ESTÁ CONECTADO (SOCKET.IO)
        if (this.socket && this.socket.connected) {
            console.log('✅ WebSocket ya está conectado');
            return;
        }

        try {
            console.log('🔄 Conectando con Socket.IO...');

            const connectionUrl = 'http://localhost:3000';
            console.log('🔄 Conectando con Socket.IO...');
            console.log('🎯 URL DE CONEXIÓN:', connectionUrl);
            console.log('🎯 Puerto extraído:', new URL(connectionUrl).port);
            console.log('🎯 Host extraído:', new URL(connectionUrl).hostname);
            
            // ✅ CREAR CONEXIÓN SOCKET.IO
            this.socket = io('http://localhost:3000', {
                transports: ['websocket', 'polling'],
                timeout: 10000,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: this.reconnectInterval,
            });
            // ✅ DEBUG: MOSTRAR CONFIGURACIÓN DEL SOCKET
        console.log('🔧 Socket configurado:', {
            url: this.socket.io.uri,
            transports: this.socket.io.opts.transports,
            timeout: this.socket.io.opts.timeout
        });

            this.setupEventListeners();

        } catch (error) {
            console.error('❌ Error connecting to Socket.IO:', error);
            this.attemptManualReconnect();
        }
    }

    setupEventListeners() {
        // ✅ EVENTOS DE CONEXIÓN SOCKET.IO
        this.socket.on('connected', () => {
            console.log('✅ Socket.IO conectado con ID:', this.socket.id);
            this.isConnected = true;
            this.connectionStatus.connected = true;
            this.connectionStatus.socketId = this.socket.id;
            this.reconnectAttempts = 0;
            this.connectionStatus.reconnectAttempts = 0;
            
            this.notifyListeners('connection_status', this.connectionStatus);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ Socket.IO desconectado:', reason);
            this.isConnected = false;
            this.connectionStatus.connected = false;
            this.connectionStatus.socketId = null;
            
            this.notifyListeners('connection_status', { 
                ...this.connectionStatus, 
                reason 
            });
        });

        this.socket.on('connect_error', (error) => {
            this.reconnectAttempts++;
            this.connectionStatus.reconnectAttempts = this.reconnectAttempts;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('❌ Máximo de intentos de reconexión alcanzado');
                this.notifyListeners('connection_error', { 
                    error: 'Conexión perdida permanentemente',
                    attempts: this.reconnectAttempts
                });
            }
        });

        // ✅ MENSAJE DE BIENVENIDA DEL SERVIDOR
        this.socket.on('connected', (data) => {
            console.log('🎉 Mensaje del servidor:', data.message);
            this.notifyListeners('server_welcome', data);
        });

        // ✅ ACTUALIZACIONES DE STOCK
        this.socket.on('stock-update', (update) => {
            console.log('📈 Actualización de stock recibida:', update);
            this.handleStockUpdate(update);
        });

        // ✅ RESPUESTA A PING
        this.socket.on('pong', (data) => {
            console.log('🏓 Pong recibido:', data);
        });
    }

    handleStockUpdate(update) {
        const { type, data, timestamp } = update;

        // ✅ CREAR ESTRUCTURA CONSISTENTE PARA NOTIFICACIONES
        const notification = {
            id: Date.now() + Math.random(),
            type: this.getNotificationType(type),
            message: this.getNotificationMessage(type, data),
            data: data,
            timestamp: timestamp || new Date().toISOString()
        };

        // ✅ NOTIFICAR TANTO AL TIPO ESPECÍFICO COMO AL GENÉRICO
        this.notifyListeners(type, notification);
        this.notifyListeners('stock_update', notification);
    }

    getNotificationType(type) {
        const typeMap = {
            'external_purchase': 'success',
            'insufficient_stock': 'warning',
            'low_stock_alert': 'warning', 
            'out_of_stock': 'error',
            'external_purchase_error': 'error'
        };
        return typeMap[type] || 'info';
    }

    getNotificationMessage(type, data) {
        switch (type) {
            case 'external_purchase':
                return `${data.group_id} compró ${data.quantity_purchased} acciones de ${data.symbol}`;
            
            case 'insufficient_stock':
                return `Stock insuficiente: ${data.symbol} (solicitado: ${data.requested_quantity}, disponible: ${data.available_quantity})`;
            
            case 'low_stock_alert':
                return `⚠️ Stock bajo: ${data.symbol} (${data.remaining_quantity} restantes)`;
            
            case 'out_of_stock':
                return `🚫 Stock agotado: ${data.symbol}`;
            
            case 'external_purchase_error':
                return `Error en compra externa: ${data.error}`;
            
            default:
                return `Actualización de stock: ${data.symbol || 'desconocido'}`;
        }
    }

    // ✅ SISTEMA DE SUSCRIPCIONES UNIFICADO
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
                    console.error(`❌ Error en listener de ${eventType}:`, error);
                }
            });
        }
    }

    // ✅ RECONEXIÓN MANUAL SI SOCKET.IO FALLA
    attemptManualReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.connectionStatus.reconnectAttempts = this.reconnectAttempts;
            
            console.log(`🔄 Reintentando conexión manual (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval);
        } else {
            console.log('❌ Se agotaron los intentos de reconexión manual');
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
            console.log('📡 Desconectando Socket.IO...');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.connectionStatus.connected = false;
            this.connectionStatus.socketId = null;
        }
    }

    // ✅ MÉTODO PARA TESTING
    testConnection() {
        if (!this.isConnected || !this.socket) {
            console.error('❌ Socket.IO no está conectado');
            return false;
        }

        // Enviar ping al servidor para verificar conexión
        this.socket.emit('ping', { timestamp: Date.now() });
        console.log('🏓 Ping enviado al servidor');
        return true;
    }

    // ✅ MÉTODO PARA ENVIAR MENSAJES
    send(eventName, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(eventName, data);
        } else {
            console.warn('⚠️ Socket.IO no está conectado - no se puede enviar mensaje');
        }
    }
}

// ✅ SINGLETON PARA USO GLOBAL
export const websocketService = new WebSocketService();
export default websocketService;