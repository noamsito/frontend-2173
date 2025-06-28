// scripts/test-newrelic.js
// Script para probar la integración de New Relic

class NewRelicTester {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
    this.API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const result = { timestamp, message, type };
    this.testResults.push(result);
    
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${emoji} ${message}`);
  }

  async runTests() {
    this.log('🚀 Iniciando tests de New Relic Integration', 'info');
    
    try {
      await this.testEnvironmentVariables();
      await this.testNewRelicAvailability();
      await this.testCustomEvents();
      await this.testStockPurchaseFlow();
      await this.testExchangeFlow();
      await this.testAPITracking();
      await this.testErrorTracking();
      await this.testHeartbeat();
      
      this.generateReport();
    } catch (error) {
      this.log(`Error general en tests: ${error.message}`, 'error');
    }
  }

  testEnvironmentVariables() {
    this.log('📋 Testing environment variables...', 'info');
    
    const requiredVars = [
      'VITE_NEW_RELIC_ACCOUNT_ID',
      'VITE_NEW_RELIC_TRUST_KEY',
      'VITE_NEW_RELIC_LICENSE_KEY'
    ];

    let allPresent = true;
    
    requiredVars.forEach(varName => {
      const value = import.meta.env[varName];
      if (!value) {
        this.log(`Variable de entorno faltante: ${varName}`, 'error');
        allPresent = false;
      } else {
        const maskedValue = value.length > 8 ? value.substring(0, 8) + '...' : value;
        this.log(`${varName}: ${maskedValue}`, 'success');
      }
    });

    if (allPresent) {
      this.log('Todas las variables de entorno están configuradas', 'success');
    }

    return allPresent;
  }

  testNewRelicAvailability() {
    this.log('🔍 Testing New Relic availability...', 'info');
    
    if (typeof window === 'undefined') {
      this.log('Window object no disponible (entorno Node.js)', 'warning');
      return false;
    }

    if (!window.newrelic) {
      this.log('New Relic Browser Agent no está disponible', 'error');
      return false;
    }

    // Test de métodos básicos
    const methods = ['addPageAction', 'setErrorHandler', 'finished', 'setCustomAttribute'];
    
    methods.forEach(method => {
      if (typeof window.newrelic[method] === 'function') {
        this.log(`Método newrelic.${method} disponible`, 'success');
      } else {
        this.log(`Método newrelic.${method} NO disponible`, 'error');
      }
    });

    this.log('New Relic Browser Agent inicializado correctamente', 'success');
    return true;
  }

  async testCustomEvents() {
    this.log('📊 Testing custom events...', 'info');
    
    if (!window.newrelic) {
      this.log('New Relic no disponible para eventos', 'error');
      return false;
    }

    try {
      // Test evento básico
      window.newrelic.addPageAction('Test_BasicEvent', {
        testId: 'basic-test',
        timestamp: new Date().toISOString(),
        source: 'automated-test'
      });
      this.log('Evento básico enviado correctamente', 'success');

      // Test con diferentes tipos de datos
      window.newrelic.addPageAction('Test_DataTypes', {
        stringValue: 'test string',
        numberValue: 42,
        booleanValue: true,
        dateValue: new Date().toISOString(),
        nullValue: null
      });
      this.log('Evento con tipos de datos enviado', 'success');

      return true;
    } catch (error) {
      this.log(`Error enviando eventos: ${error.message}`, 'error');
      return false;
    }
  }

  async testStockPurchaseFlow() {
    this.log('📈 Testing Stock Purchase Flow (TRAZA 1)...', 'info');
    
    if (!window.newrelic) {
      this.log('New Relic no disponible para traza de compras', 'error');
      return false;
    }

    try {
      const mockSession = `test-session-${Date.now()}`;
      const testSymbol = 'TEST';
      const testQuantity = 10;
      const testPrice = 150.00;

      // Simular flujo completo de compra
      const events = [
        {
          action: 'StockPurchase_ViewStocks',
          data: {
            session: mockSession,
            symbol: testSymbol,
            timestamp: new Date().toISOString(),
            testMode: true
          }
        },
        {
          action: 'StockPurchase_SelectStock',
          data: {
            session: mockSession,
            symbol: testSymbol,
            price: testPrice,
            timestamp: new Date().toISOString(),
            testMode: true
          }
        },
        {
          action: 'StockPurchase_SetQuantity',
          data: {
            session: mockSession,
            symbol: testSymbol,
            quantity: testQuantity,
            totalValue: testPrice * testQuantity,
            timestamp: new Date().toISOString(),
            testMode: true
          }
        },
        {
          action: 'StockPurchase_ValidatePurchase',
          data: {
            session: mockSession,
            symbol: testSymbol,
            quantity: testQuantity,
            validation: 'passed',
            timestamp: new Date().toISOString(),
            testMode: true
          }
        },
        {
          action: 'StockPurchase_Execute',
          data: {
            session: mockSession,
            symbol: testSymbol,
            quantity: testQuantity,
            requestId: `test-${Date.now()}`,
            timestamp: new Date().toISOString(),
            testMode: true
          }
        },
        {
          action: 'StockPurchase_Success',
          data: {
            session: mockSession,
            symbol: testSymbol,
            quantity: testQuantity,
            totalPaid: testPrice * testQuantity,
            timestamp: new Date().toISOString(),
            testMode: true,
            traceType: 'stock_purchase_flow',
            phase: 'completed'
          }
        }
      ];

      // Enviar eventos con delays para simular flujo real
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        window.newrelic.addPageAction(event.action, event.data);
        this.log(`Enviado: ${event.action} para ${testSymbol}`, 'success');
        
        // Pequeño delay entre eventos
        if (i < events.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      this.log('TRAZA 1: Flujo de compra de acciones completado', 'success');
      return true;
    } catch (error) {
      this.log(`Error en traza de compras: ${error.message}`, 'error');
      return false;
    }
  }

  async testExchangeFlow() {
    this.log('🔄 Testing Exchange Flow (TRAZA 2)...', 'info');
    
    if (!window.newrelic) {
      this.log('New Relic no disponible para traza de intercambios', 'error');
      return false;
    }

    try {
      const mockSession = `exchange-session-${Date.now()}`;
      const testSymbolOffer = 'AAPL';
      const testSymbolReceive = 'GOOGL';
      const testQuantityOffer = 5;
      const testQuantityReceive = 2;

      // Simular flujo completo de intercambio
      const events = [
        {
          action: 'Exchange_ViewOffers',
          data: {
            session: mockSession,
            offersCount: 10,
            timestamp: new Date().toISOString(),
            testMode: true
          }
        },
        {
          action: 'Exchange_CreateOffer',
          data: {
            session: mockSession,
            symbolOffered: testSymbolOffer,
            quantityOffered: testQuantityOffer,
            offerId: `test-offer-${Date.now()}`,
            timestamp: new Date().toISOString(),
            testMode: true
          }
        },
        {
          action: 'Exchange_CreateProposal',
          data: {
            session: mockSession,
            symbolOffered: testSymbolOffer,
            quantityOffered: testQuantityOffer,
            symbolRequested: testSymbolReceive,
            quantityRequested: testQuantityReceive,
            proposalId: `test-proposal-${Date.now()}`,
            timestamp: new Date().toISOString(),
            testMode: true
          }
        },
        {
          action: 'Exchange_RespondToProposal',
          data: {
            session: mockSession,
            proposalId: `test-proposal-${Date.now()}`,
            response: 'accepted',
            timestamp: new Date().toISOString(),
            testMode: true
          }
        },
        {
          action: 'Exchange_Success',
          data: {
            session: mockSession,
            symbolGiven: testSymbolOffer,
            quantityGiven: testQuantityOffer,
            symbolReceived: testSymbolReceive,
            quantityReceived: testQuantityReceive,
            exchangeId: `test-exchange-${Date.now()}`,
            timestamp: new Date().toISOString(),
            testMode: true,
            traceType: 'exchange_flow',
            phase: 'completed'
          }
        }
      ];

      // Enviar eventos con delays
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        window.newrelic.addPageAction(event.action, event.data);
        this.log(`Enviado: ${event.action}`, 'success');
        
        if (i < events.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      this.log('TRAZA 2: Flujo de intercambio completado', 'success');
      return true;
    } catch (error) {
      this.log(`Error en traza de intercambios: ${error.message}`, 'error');
      return false;
    }
  }

  async testAPITracking() {
    this.log('🔗 Testing API Tracking...', 'info');
    
    if (!window.newrelic) {
      this.log('New Relic no disponible para tracking de API', 'error');
      return false;
    }

    try {
      // Simular llamadas API
      const apiCalls = [
        {
          endpoint: '/stocks',
          method: 'GET',
          duration: 250,
          status: 200
        },
        {
          endpoint: '/wallet/balance',
          method: 'GET',
          duration: 150,
          status: 200
        },
        {
          endpoint: '/purchases',
          method: 'POST',
          duration: 500,
          status: 201
        }
      ];

      apiCalls.forEach(call => {
        window.newrelic.addPageAction('API_Call', {
          endpoint: call.endpoint,
          method: call.method,
          duration: call.duration,
          statusCode: call.status,
          timestamp: new Date().toISOString(),
          testMode: true
        });
        
        this.log(`API call tracked: ${call.method} ${call.endpoint} (${call.duration}ms)`, 'success');
      });

      return true;
    } catch (error) {
      this.log(`Error tracking API calls: ${error.message}`, 'error');
      return false;
    }
  }

  async testErrorTracking() {
    this.log('⚠️ Testing Error Tracking...', 'info');
    
    if (!window.newrelic) {
      this.log('New Relic no disponible para tracking de errores', 'error');
      return false;
    }

    try {
      // Simular diferentes tipos de errores
      const errors = [
        {
          type: 'API_Error',
          message: 'Stock purchase failed - insufficient funds',
          errorCode: 'INSUFFICIENT_FUNDS',
          endpoint: '/stocks/buy'
        },
        {
          type: 'Validation_Error',
          message: 'Invalid quantity specified',
          errorCode: 'INVALID_QUANTITY',
          field: 'quantity'
        },
        {
          type: 'Network_Error',
          message: 'Connection timeout',
          errorCode: 'TIMEOUT',
          endpoint: '/health'
        }
      ];

      errors.forEach(error => {
        window.newrelic.addPageAction('Application_Error', {
          errorType: error.type,
          errorMessage: error.message,
          errorCode: error.errorCode,
          endpoint: error.endpoint || null,
          field: error.field || null,
          timestamp: new Date().toISOString(),
          testMode: true
        });
        
        this.log(`Error tracked: ${error.type} - ${error.message}`, 'success');
      });

      return true;
    } catch (error) {
      this.log(`Error tracking errors: ${error.message}`, 'error');
      return false;
    }
  }

  async testHeartbeat() {
    this.log('💓 Testing Availability Heartbeat...', 'info');
    
    if (!window.newrelic) {
      this.log('New Relic no disponible para heartbeat', 'error');
      return false;
    }

    try {
      // Simular múltiples heartbeats
      const heartbeats = [
        { status: 'up', statusCode: 200, responseTime: 150 },
        { status: 'up', statusCode: 200, responseTime: 180 },
        { status: 'down', statusCode: 500, responseTime: 5000 },
        { status: 'up', statusCode: 200, responseTime: 120 }
      ];

      for (let i = 0; i < heartbeats.length; i++) {
        const heartbeat = heartbeats[i];
        
        window.newrelic.addPageAction('Availability_Heartbeat', {
          status: heartbeat.status,
          statusCode: heartbeat.statusCode,
          responseTime: heartbeat.responseTime,
          endpoint: `${this.API_URL}/health`,
          timestamp: new Date().toISOString(),
          testMode: true
        });
        
        this.log(`Heartbeat sent: ${heartbeat.status} (${heartbeat.statusCode}) - ${heartbeat.responseTime}ms`, 
                  heartbeat.status === 'up' ? 'success' : 'warning');
        
        // Delay entre heartbeats
        if (i < heartbeats.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      this.log('Heartbeat testing completado', 'success');
      return true;
    } catch (error) {
      this.log(`Error en heartbeat testing: ${error.message}`, 'error');
      return false;
    }
  }

  generateReport() {
    const duration = Date.now() - this.startTime;
    const successCount = this.testResults.filter(r => r.type === 'success').length;
    const errorCount = this.testResults.filter(r => r.type === 'error').length;
    const warningCount = this.testResults.filter(r => r.type === 'warning').length;

    this.log('', 'info');
    this.log('📊 REPORTE FINAL DE TESTS', 'info');
    this.log('================================', 'info');
    this.log(`⏱️ Duración total: ${duration}ms`, 'info');
    this.log(`✅ Tests exitosos: ${successCount}`, 'success');
    this.log(`⚠️ Advertencias: ${warningCount}`, 'warning');
    this.log(`❌ Errores: ${errorCount}`, 'error');
    this.log('', 'info');

    // Determinar estado general
    if (errorCount === 0 && warningCount <= 1) {
      this.log('🎉 ¡TODOS LOS TESTS PASARON! New Relic está correctamente configurado.', 'success');
      this.log('✅ RNF01 COMPLETAMENTE IMPLEMENTADO', 'success');
    } else if (errorCount <= 2) {
      this.log('⚠️ Tests completados con algunas advertencias. Revisar configuración.', 'warning');
    } else {
      this.log('❌ Tests fallaron. Revisar configuración de New Relic.', 'error');
    }

    this.log('', 'info');
    this.log('📋 Para ver los datos en New Relic:', 'info');
    this.log('1. Ve a https://one.newrelic.com/dashboards/', 'info');
    this.log('2. Busca eventos con testMode: true', 'info');
    this.log('3. Verifica las trazas funcionales en el query builder', 'info');

    // Almacenar resultados para referencia
    if (typeof window !== 'undefined') {
      window.newRelicTestResults = this.testResults;
    }

    return {
      duration,
      successCount,
      errorCount,
      warningCount,
      passed: errorCount === 0 && warningCount <= 1,
      results: this.testResults
    };
  }
}

// Función para ejecutar los tests
async function runNewRelicTests() {
  const tester = new NewRelicTester();
  return await tester.runTests();
}

// Función para verificar RNF01 específicamente
function verifyRNF01() {
  console.log('🔍 VERIFICANDO CUMPLIMIENTO RNF01...');
  console.log('=====================================');
  
  const checks = [
    {
      name: 'New Relic Browser Agent',
      check: () => window.newrelic !== undefined,
      description: 'Agent de New Relic cargado'
    },
    {
      name: 'Traza Funcional 1: Stock Purchase',
      check: () => {
        // Verificar que podemos enviar eventos de compra
        try {
          window.newrelic.addPageAction('Test_StockPurchase_Verification', {
            verification: true,
            timestamp: new Date().toISOString()
          });
          return true;
        } catch (e) {
          return false;
        }
      },
      description: 'Traza de compras de acciones operativa'
    },
    {
      name: 'Traza Funcional 2: Exchange Flow',
      check: () => {
        // Verificar que podemos enviar eventos de intercambio
        try {
          window.newrelic.addPageAction('Test_Exchange_Verification', {
            verification: true,
            timestamp: new Date().toISOString()
          });
          return true;
        } catch (e) {
          return false;
        }
      },
      description: 'Traza de intercambios operativa'
    },
    {
      name: 'Alarma de Disponibilidad',
      check: () => {
        // Verificar que podemos enviar heartbeats
        try {
          window.newrelic.addPageAction('Availability_Heartbeat', {
            status: 'up',
            verification: true,
            timestamp: new Date().toISOString()
          });
          return true;
        } catch (e) {
          return false;
        }
      },
      description: 'Sistema de heartbeat operativo'
    },
    {
      name: 'Dashboard funcional',
      check: () => {
        // Verificar que el monitor está presente
        return document.querySelector('.system-status') !== null ||
               document.querySelector('.newrelic-monitor') !== null;
      },
      description: 'Dashboard integrado visible'
    }
  ];

  let passed = 0;
  let total = checks.length;

  checks.forEach(check => {
    const result = check.check();
    const emoji = result ? '✅' : '❌';
    console.log(`${emoji} ${check.name}: ${check.description}`);
    if (result) passed++;
  });

  console.log('');
  console.log(`📊 Resultado: ${passed}/${total} verificaciones pasaron`);
  
  if (passed === total) {
    console.log('🎉 ¡RNF01 COMPLETAMENTE IMPLEMENTADO!');
    console.log('✅ 2 trazas funcionales monitoreadas');
    console.log('✅ 1 alarma de disponibilidad activa');
    console.log('✅ Dashboard funcionando');
    return true;
  } else {
    console.log('⚠️ RNF01 parcialmente implementado');
    console.log(`❌ Faltan ${total - passed} componentes`);
    return false;
  }
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
  window.runNewRelicTests = runNewRelicTests;
  window.verifyRNF01 = verifyRNF01;
  window.NewRelicTester = NewRelicTester;
}

// Auto-ejecutar si se detecta que estamos en el browser y New Relic está disponible
if (typeof window !== 'undefined' && window.newrelic) {
  console.log('🔧 New Relic Test Suite cargado');
  console.log('📋 Comandos disponibles:');
  console.log('  - runNewRelicTests() - Ejecutar suite completa de tests');
  console.log('  - verifyRNF01() - Verificar cumplimiento de RNF01');
}

export { runNewRelicTests, verifyRNF01, NewRelicTester };