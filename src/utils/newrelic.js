// src/utils/newrelic.js
class NewRelicMonitor {
  constructor() {
    this.isInitialized = false;
    this.initialize();
  }

  initialize() {
    // Verificar si New Relic está disponible
    if (typeof window !== 'undefined' && window.newrelic) {
      this.isInitialized = true;
      console.log('🔍 New Relic inicializado correctamente');
      
      // Configurar atributos globales de la aplicación
      window.newrelic.setCustomAttribute('appName', 'StockMarketU-Frontend');
      window.newrelic.setCustomAttribute('environment', import.meta.env.MODE);
      window.newrelic.setCustomAttribute('version', '1.0.0');
    } else {
      console.warn('⚠️ New Relic no está disponible');
    }
  }

  // TRAZA FUNCIONAL 1: Flujo completo de compra de acciones
  trackStockPurchaseFlow(phase, data = {}) {
    if (!this.isInitialized) return;

    const baseAttributes = {
      traceType: 'stock_purchase_flow',
      phase: phase,
      timestamp: new Date().toISOString(),
      userId: data.userId || 'anonymous',
      ...data
    };

    switch (phase) {
      case 'view_stocks':
        window.newrelic.addPageAction('StockPurchase_ViewStocks', {
          ...baseAttributes,
          stockCount: data.stockCount,
          filtersApplied: data.filtersApplied || false,
          page: data.page || 1
        });
        break;

      case 'select_stock':
        window.newrelic.addPageAction('StockPurchase_SelectStock', {
          ...baseAttributes,
          symbol: data.symbol,
          price: data.price,
          availableQuantity: data.availableQuantity
        });
        break;

      case 'set_quantity':
        window.newrelic.addPageAction('StockPurchase_SetQuantity', {
          ...baseAttributes,
          symbol: data.symbol,
          quantity: data.quantity,
          totalCost: data.totalCost,
          userBalance: data.userBalance
        });
        break;

      case 'validate_purchase':
        window.newrelic.addPageAction('StockPurchase_Validate', {
          ...baseAttributes,
          symbol: data.symbol,
          quantity: data.quantity,
          totalCost: data.totalCost,
          validationResult: data.validationResult
        });
        break;

      case 'execute_purchase':
        window.newrelic.addPageAction('StockPurchase_Execute', {
          ...baseAttributes,
          symbol: data.symbol,
          quantity: data.quantity,
          totalCost: data.totalCost,
          requestId: data.requestId
        });
        break;

      case 'purchase_success':
        window.newrelic.addPageAction('StockPurchase_Success', {
          ...baseAttributes,
          symbol: data.symbol,
          quantity: data.quantity,
          totalCost: data.totalCost,
          requestId: data.requestId,
          duration: data.duration
        });
        break;

      case 'purchase_error':
        window.newrelic.addPageAction('StockPurchase_Error', {
          ...baseAttributes,
          symbol: data.symbol,
          quantity: data.quantity,
          errorType: data.errorType,
          errorMessage: data.errorMessage,
          duration: data.duration
        });
        break;
    }
  }

  // TRAZA FUNCIONAL 2: Flujo completo de intercambios/subastas
  trackExchangeFlow(phase, data = {}) {
    if (!this.isInitialized) return;

    const baseAttributes = {
      traceType: 'exchange_flow',
      phase: phase,
      timestamp: new Date().toISOString(),
      userId: data.userId || 'anonymous',
      ...data
    };

    switch (phase) {
      case 'view_offers':
        window.newrelic.addPageAction('Exchange_ViewOffers', {
          ...baseAttributes,
          externalOffersCount: data.externalOffersCount,
          userStocksCount: data.userStocksCount
        });
        break;

      case 'create_offer':
        window.newrelic.addPageAction('Exchange_CreateOffer', {
          ...baseAttributes,
          symbol: data.symbol,
          quantity: data.quantity,
          offerType: 'general'
        });
        break;

      case 'create_proposal':
        window.newrelic.addPageAction('Exchange_CreateProposal', {
          ...baseAttributes,
          proposalSymbol: data.proposalSymbol,
          proposalQuantity: data.proposalQuantity,
          targetAuctionId: data.targetAuctionId,
          targetGroup: data.targetGroup
        });
        break;

      case 'respond_to_proposal':
        window.newrelic.addPageAction('Exchange_RespondProposal', {
          ...baseAttributes,
          auctionId: data.auctionId,
          proposalId: data.proposalId,
          action: data.action, // 'accept' or 'reject'
          symbol: data.symbol,
          quantity: data.quantity
        });
        break;

      case 'exchange_success':
        window.newrelic.addPageAction('Exchange_Success', {
          ...baseAttributes,
          exchangeType: data.exchangeType,
          gaveSymbol: data.gaveSymbol,
          gaveQuantity: data.gaveQuantity,
          receivedSymbol: data.receivedSymbol,
          receivedQuantity: data.receivedQuantity,
          duration: data.duration
        });
        break;

      case 'exchange_error':
        window.newrelic.addPageAction('Exchange_Error', {
          ...baseAttributes,
          errorType: data.errorType,
          errorMessage: data.errorMessage,
          duration: data.duration
        });
        break;
    }
  }

  // Monitoreo de performance de API calls
  trackAPICall(apiEndpoint, method, startTime, response, error = null) {
    if (!this.isInitialized) return;

    const duration = Date.now() - startTime;
    const success = !error && response && response.ok !== false;

    window.newrelic.addPageAction('API_Call', {
      endpoint: apiEndpoint,
      method: method,
      duration: duration,
      success: success,
      statusCode: response?.status || (error ? 'error' : 'unknown'),
      timestamp: new Date().toISOString()
    });

    // Configurar atributos para el contexto actual
    window.newrelic.setCustomAttribute('lastAPICall', apiEndpoint);
    window.newrelic.setCustomAttribute('lastAPIStatus', success ? 'success' : 'error');
  }

  // Monitoreo de errores personalizados
  trackError(errorType, errorMessage, context = {}) {
    if (!this.isInitialized) return;

    window.newrelic.addPageAction('Application_Error', {
      errorType: errorType,
      errorMessage: errorMessage,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  // Monitoreo de navegación y rendimiento
  trackPageView(pageName, loadTime = null) {
    if (!this.isInitialized) return;

    window.newrelic.addPageAction('Page_View', {
      pageName: pageName,
      loadTime: loadTime,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    });
  }

  // Heartbeat para disponibilidad - ALARMA REQUERIDA
  startAvailabilityHeartbeat() {
    if (!this.isInitialized) return;

    const sendHeartbeat = async () => {
      try {
        const startTime = Date.now();
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/health`);
        const duration = Date.now() - startTime;
        
        window.newrelic.addPageAction('Availability_Heartbeat', {
          status: response.ok ? 'up' : 'down',
          statusCode: response.status,
          responseTime: duration,
          timestamp: new Date().toISOString(),
          endpoint: import.meta.env.VITE_API_URL || 'http://localhost:3000'
        });

        // Actualizar atributo de disponibilidad
        window.newrelic.setCustomAttribute('apiAvailable', response.ok);
        window.newrelic.setCustomAttribute('lastHeartbeat', new Date().toISOString());
        
      } catch (error) {
        window.newrelic.addPageAction('Availability_Heartbeat', {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
          endpoint: import.meta.env.VITE_API_URL || 'http://localhost:3000'
        });

        window.newrelic.setCustomAttribute('apiAvailable', false);
        window.newrelic.setCustomAttribute('lastHeartbeatError', error.message);
      }
    };

    // Enviar heartbeat inicial
    sendHeartbeat();
    
    // Configurar heartbeat cada 30 segundos
    return setInterval(sendHeartbeat, 30000);
  }
}

// Crear instancia singleton
export const newRelicMonitor = new NewRelicMonitor();

// Hook personalizado para React
export const useNewRelicMonitoring = () => {
  return {
    trackStockPurchase: (phase, data) => newRelicMonitor.trackStockPurchaseFlow(phase, data),
    trackExchange: (phase, data) => newRelicMonitor.trackExchangeFlow(phase, data),
    trackAPI: (endpoint, method, startTime, response, error) => 
      newRelicMonitor.trackAPICall(endpoint, method, startTime, response, error),
    trackError: (type, message, context) => newRelicMonitor.trackError(type, message, context),
    trackPageView: (page, loadTime) => newRelicMonitor.trackPageView(page, loadTime)
  };
};

export default newRelicMonitor;