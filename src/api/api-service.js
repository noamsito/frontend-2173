// api-service.js
// Servicio centralizado para todas las llamadas a la API

import { CONFIG, buildApiUrl, buildAuthHeaders } from './frontend-env-config.js';

class ApiService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.timeout = 30000;
  }

  // Helper para manejar respuestas
  async handleResponse(response) {
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  }

  // Request base con manejo de errores y CORS
  async request(endpoint, options = {}) {
    const url = buildApiUrl(endpoint);
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Para cookies de sesión
      ...options
    };

    console.log(`🌐 API Request: ${defaultOptions.method} ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return await this.handleResponse(response);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - el servidor no respondió en tiempo esperado');
      }
      
      console.error(`❌ API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Requests autenticados
  async authenticatedRequest(endpoint, options = {}, token) {
    const authHeaders = token ? buildAuthHeaders(token) : {};
    
    return this.request(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        ...authHeaders
      }
    });
  }

  // ===== STOCKS API =====
  async getStocks(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/stocks?${queryParams}` : '/stocks';
    return this.request(endpoint);
  }

  async getStock(symbol, filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/stocks/${symbol}?${queryParams}` : `/stocks/${symbol}`;
    return this.request(endpoint);
  }

  // ===== USER API =====
  async getUserProfile(token) {
    return this.authenticatedRequest('/user/profile', { method: 'GET' }, token);
  }

  async registerUser(userData, token) {
    return this.authenticatedRequest('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }, token);
  }

  // ===== WALLET API =====
  async getWalletBalance(token) {
    return this.authenticatedRequest('/wallet/balance', { method: 'GET' }, token);
  }

  async depositToWallet(amount, token) {
    return this.authenticatedRequest('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount })
    }, token);
  }

  // ===== PURCHASES API =====
  async buyStock(purchaseData, token) {
    return this.authenticatedRequest('/stocks/buy', {
      method: 'POST',
      body: JSON.stringify(purchaseData)
    }, token);
  }

  async getUserPurchases(token) {
    return this.authenticatedRequest('/purchases', { method: 'GET' }, token);
  }

  async getPurchaseEstimation(purchaseId, token) {
    return this.authenticatedRequest(`/purchase/${purchaseId}/estimation`, { method: 'GET' }, token);
  }

  // ===== WEBPAY API =====
  async initWebpayTransaction(transactionData, token) {
    return this.authenticatedRequest('/webpay/init', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    }, token);
  }

  async getWebpayStatus(token, token) {
    return this.authenticatedRequest(`/webpay/status/${token}`, { method: 'GET' }, token);
  }

  // ===== EVENTS API =====
  async getEvents(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/events?${queryParams}` : '/events';
    return this.request(endpoint);
  }

  // ===== BOLETAS API =====
  async generateBoleta(boletaData, token) {
    const url = `${CONFIG.BOLETAS_API_URL}/generate-boleta`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...buildAuthHeaders(token)
        },
        body: JSON.stringify(boletaData)
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error generando boleta:', error);
      throw error;
    }
  }

  async getBoletaStatus(boletaId) {
    const url = `${CONFIG.BOLETAS_API_URL}/boleta/${boletaId}`;
    
    try {
      const response = await fetch(url);
      return await this.handleResponse(response);
    } catch (error) {
      console.error('❌ Error obteniendo estado de boleta:', error);
      throw error;
    }
  }

  // ===== SYSTEM STATUS =====
  async getSystemHealth() {
    return this.request('/health');
  }

  async getWorkersHealth() {
    return this.request('/workers/health');
  }

  async getBoletasServiceHealth() {
    return this.request('/boletas/service-status');
  }
}

// Crear instancia singleton
const apiService = new ApiService();

// Helper functions para usar en componentes
export const useApiService = () => apiService;

export default apiService;

// Funciones de conveniencia para importación directa
export const {
  getStocks,
  getStock,
  getUserProfile,
  registerUser,
  getWalletBalance,
  depositToWallet,
  buyStock,
  getUserPurchases,
  getPurchaseEstimation,
  initWebpayTransaction,
  getWebpayStatus,
  getEvents,
  generateBoleta,
  getBoletaStatus,
  getSystemHealth,
  getWorkersHealth,
  getBoletasServiceHealth
} = apiService;