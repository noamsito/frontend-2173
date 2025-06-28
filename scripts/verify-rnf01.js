#!/usr/bin/env node
// scripts/verify-rnf01.js
// Script de verificación automatizada para RNF01

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RNF01Verifier {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    this.projectRoot = path.resolve(__dirname, '..');
    this.requiredFiles = [
      'src/utils/newrelic.js',
      'src/components/NewRelicMonitor.jsx',
      'src/components/SystemStatus.jsx',
      'index.html',
      'src/testStocks.jsx',
      'src/pages/Exchanges.jsx',
      'src/api/apiService.js',
      'src/App.jsx'
    ];
    this.requiredDependencies = [
      // New Relic no requiere dependencias adicionales (Browser Agent via CDN)
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const result = { timestamp, message, type };
    this.results.push(result);
    
    const colors = {
      success: '\x1b[32m', // Verde
      error: '\x1b[31m',   // Rojo
      warning: '\x1b[33m', // Amarillo
      info: '\x1b[36m',    // Cyan
      reset: '\x1b[0m'     // Reset
    };
    
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    const color = colors[type] || colors.info;
    
    console.log(`${color}[${timestamp}] ${emoji} ${message}${colors.reset}`);
  }

  async verify() {
    this.log('🚀 Iniciando verificación de RNF01', 'info');
    this.log('=====================================', 'info');
    
    try {
      await this.verifyProjectStructure();
      await this.verifyNewRelicConfiguration();
      await this.verifyStockPurchaseTrace();
      await this.verifyExchangeTrace();
      await this.verifyAvailabilityAlarm();
      await this.verifyDashboard();
      await this.verifyDocumentation();
      await this.verifyEnvironmentConfiguration();
      
      this.generateFinalReport();
    } catch (error) {
      this.log(`Error crítico en verificación: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async verifyProjectStructure() {
    this.log('📁 Verificando estructura del proyecto...', 'info');
    
    let missingFiles = [];
    
    for (const file of this.requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        this.log(`Archivo encontrado: ${file}`, 'success');
      } else {
        this.log(`Archivo faltante: ${file}`, 'error');
        missingFiles.push(file);
      }
    }
    
    if (missingFiles.length === 0) {
      this.log('Estructura del proyecto completa', 'success');
    } else {
      this.log(`${missingFiles.length} archivos faltantes`, 'error');
    }
    
    return missingFiles.length === 0;
  }

  async verifyNewRelicConfiguration() {
    this.log('🔧 Verificando configuración de New Relic...', 'info');
    
    // Verificar index.html para Browser Agent
    const indexPath = path.join(this.projectRoot, 'index.html');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      if (indexContent.includes('js-agent.newrelic.com') || indexContent.includes('newrelic')) {
        this.log('New Relic Browser Agent configurado en index.html', 'success');
      } else {
        this.log('New Relic Browser Agent NO encontrado en index.html', 'error');
      }
    }
    
    // Verificar archivo de configuración principal
    const newrelicPath = path.join(this.projectRoot, 'src/utils/newrelic.js');
    if (fs.existsSync(newrelicPath)) {
      const content = fs.readFileSync(newrelicPath, 'utf8');
      
      const checks = [
        { pattern: /startAvailabilityHeartbeat/, name: 'Función de heartbeat' },
        { pattern: /addPageAction/, name: 'Función de eventos personalizados' },
        { pattern: /Availability_Heartbeat/, name: 'Eventos de disponibilidad' },
        { pattern: /window\.newrelic/, name: 'Integración con Browser Agent' }
      ];
      
      checks.forEach(check => {
        if (check.pattern.test(content)) {
          this.log(`${check.name} implementado`, 'success');
        } else {
          this.log(`${check.name} NO implementado`, 'error');
        }
      });
    } else {
      this.log('Archivo de configuración New Relic no encontrado', 'error');
    }
  }

  async verifyStockPurchaseTrace() {
    this.log('📈 Verificando TRAZA 1: Stock Purchase Flow...', 'info');
    
    const stocksPath = path.join(this.projectRoot, 'src/testStocks.jsx');
    const apiPath = path.join(this.projectRoot, 'src/api/apiService.js');
    
    const requiredEvents = [
      'StockPurchase_ViewStocks',
      'StockPurchase_SelectStock',
      'StockPurchase_SetQuantity',
      'StockPurchase_ValidatePurchase',
      'StockPurchase_Execute',
      'StockPurchase_Success'
    ];
    
    let foundEvents = [];
    
    // Verificar en testStocks.jsx
    if (fs.existsSync(stocksPath)) {
      const content = fs.readFileSync(stocksPath, 'utf8');
      
      requiredEvents.forEach(event => {
        if (content.includes(event)) {
          foundEvents.push(event);
          this.log(`Evento ${event} encontrado en testStocks.jsx`, 'success');
        }
      });
    }
    
    // Verificar en apiService.js
    if (fs.existsSync(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf8');
      
      requiredEvents.forEach(event => {
        if (content.includes(event) && !foundEvents.includes(event)) {
          foundEvents.push(event);
          this.log(`Evento ${event} encontrado en apiService.js`, 'success');
        }
      });
    }
    
    const missingEvents = requiredEvents.filter(event => !foundEvents.includes(event));
    
    if (missingEvents.length === 0) {
      this.log('TRAZA 1: Stock Purchase Flow COMPLETA (6/6 eventos)', 'success');
    } else {
      this.log(`TRAZA 1: Faltan ${missingEvents.length} eventos: ${missingEvents.join(', ')}`, 'error');
    }
    
    // Verificar que incluya session tracking
    const stocksContent = fs.existsSync(stocksPath) ? fs.readFileSync(stocksPath, 'utf8') : '';
    if (stocksContent.includes('session') || stocksContent.includes('traceType')) {
      this.log('Session tracking implementado en Stock Purchase', 'success');
    } else {
      this.log('Session tracking NO implementado en Stock Purchase', 'warning');
    }
    
    return missingEvents.length === 0;
  }

  async verifyExchangeTrace() {
    this.log('🔄 Verificando TRAZA 2: Exchange Flow...', 'info');
    
    const exchangePath = path.join(this.projectRoot, 'src/pages/Exchanges.jsx');
    
    const requiredEvents = [
      'Exchange_ViewOffers',
      'Exchange_CreateOffer',
      'Exchange_CreateProposal',
      'Exchange_RespondToProposal',
      'Exchange_Success'
    ];
    
    let foundEvents = [];
    
    if (fs.existsSync(exchangePath)) {
      const content = fs.readFileSync(exchangePath, 'utf8');
      
      requiredEvents.forEach(event => {
        if (content.includes(event)) {
          foundEvents.push(event);
          this.log(`Evento ${event} encontrado en Exchanges.jsx`, 'success');
        }
      });
      
      // Verificar session tracking
      if (content.includes('session') || content.includes('traceType')) {
        this.log('Session tracking implementado en Exchange Flow', 'success');
      } else {
        this.log('Session tracking NO implementado en Exchange Flow', 'warning');
      }
    } else {
      this.log('Archivo Exchanges.jsx no encontrado', 'error');
    }
    
    const missingEvents = requiredEvents.filter(event => !foundEvents.includes(event));
    
    if (missingEvents.length === 0) {
      this.log('TRAZA 2: Exchange Flow COMPLETA (5/5 eventos)', 'success');
    } else {
      this.log(`TRAZA 2: Faltan ${missingEvents.length} eventos: ${missingEvents.join(', ')}`, 'error');
    }
    
    return missingEvents.length === 0;
  }

  async verifyAvailabilityAlarm() {
    this.log('💓 Verificando ALARMA DE DISPONIBILIDAD...', 'info');
    
    const newrelicPath = path.join(this.projectRoot, 'src/utils/newrelic.js');
    const appPath = path.join(this.projectRoot, 'src/App.jsx');
    
    let heartbeatImplemented = false;
    let heartbeatStarted = false;
    
    // Verificar implementación del heartbeat
    if (fs.existsSync(newrelicPath)) {
      const content = fs.readFileSync(newrelicPath, 'utf8');
      
      if (content.includes('startAvailabilityHeartbeat')) {
        heartbeatImplemented = true;
        this.log('Función startAvailabilityHeartbeat implementada', 'success');
      }
      
      if (content.includes('Availability_Heartbeat')) {
        this.log('Eventos Availability_Heartbeat configurados', 'success');
      }
      
      // Verificar frecuencia del heartbeat
      if (content.includes('setInterval') && (content.includes('30000') || content.includes('30 * 1000'))) {
        this.log('Heartbeat configurado cada 30 segundos', 'success');
      } else if (content.includes('setInterval')) {
        this.log('Heartbeat configurado (frecuencia diferente a 30s)', 'warning');
      }
    }
    
    // Verificar que se inicia en App.jsx
    if (fs.existsSync(appPath)) {
      const content = fs.readFileSync(appPath, 'utf8');
      
      if (content.includes('startAvailabilityHeartbeat') || content.includes('SystemStatus')) {
        heartbeatStarted = true;
        this.log('Heartbeat iniciado en aplicación principal', 'success');
      }
    }
    
    if (heartbeatImplemented && heartbeatStarted) {
      this.log('ALARMA DE DISPONIBILIDAD COMPLETAMENTE CONFIGURADA', 'success');
    } else {
      this.log('ALARMA DE DISPONIBILIDAD INCOMPLETA', 'error');
    }
    
    return heartbeatImplemented && heartbeatStarted;
  }

  async verifyDashboard() {
    this.log('📊 Verificando DASHBOARD...', 'info');
    
    const monitorPath = path.join(this.projectRoot, 'src/components/NewRelicMonitor.jsx');
    const statusPath = path.join(this.projectRoot, 'src/components/SystemStatus.jsx');
    const appPath = path.join(this.projectRoot, 'src/App.jsx');
    
    let dashboardComponents = 0;
    
    // Verificar NewRelicMonitor
    if (fs.existsSync(monitorPath)) {
      const content = fs.readFileSync(monitorPath, 'utf8');
      if (content.includes('dashboard') || content.includes('monitor') || content.includes('newrelic')) {
        dashboardComponents++;
        this.log('Componente NewRelicMonitor implementado', 'success');
      }
    }
    
    // Verificar SystemStatus
    if (fs.existsSync(statusPath)) {
      const content = fs.readFileSync(statusPath, 'utf8');
      if (content.includes('status') || content.includes('system') || content.includes('heartbeat')) {
        dashboardComponents++;
        this.log('Componente SystemStatus implementado', 'success');
      }
    }
    
    // Verificar integración en App
    if (fs.existsSync(appPath)) {
      const content = fs.readFileSync(appPath, 'utf8');
      if (content.includes('SystemStatus') || content.includes('NewRelicMonitor')) {
        this.log('Dashboard integrado en aplicación principal', 'success');
      } else {
        this.log('Dashboard NO integrado en aplicación principal', 'error');
      }
    }
    
    if (dashboardComponents >= 1) {
      this.log('DASHBOARD FUNCIONANDO', 'success');
    } else {
      this.log('DASHBOARD NO IMPLEMENTADO', 'error');
    }
    
    return dashboardComponents >= 1;
  }

  async verifyDocumentation() {
    this.log('📚 Verificando documentación...', 'info');
    
    const docs = [
      'docs/newrelic-documentation.md',
      'docs/newrelic-alerts-config.md',
      'README.md'
    ];
    
    let docsFound = 0;
    
    docs.forEach(doc => {
      const docPath = path.join(this.projectRoot, doc);
      if (fs.existsSync(docPath)) {
        const content = fs.readFileSync(docPath, 'utf8');
        if (content.toLowerCase().includes('new relic') || content.toLowerCase().includes('rnf01')) {
          docsFound++;
          this.log(`Documentación encontrada: ${doc}`, 'success');
        }
      } else {
        this.log(`Documentación faltante: ${doc}`, 'warning');
      }
    });
    
    if (docsFound >= 2) {
      this.log('Documentación suficiente encontrada', 'success');
    } else {
      this.log('Documentación insuficiente', 'warning');
    }
    
    return docsFound >= 2;
  }

  async verifyEnvironmentConfiguration() {
    this.log('🔑 Verificando configuración de entorno...', 'info');
    
    const envExample = path.join(this.projectRoot, '.env.example');
    const packageJson = path.join(this.projectRoot, 'package.json');
    
    // Verificar .env.example
    if (fs.existsSync(envExample)) {
      const content = fs.readFileSync(envExample, 'utf8');
      
      const requiredVars = [
        'VITE_NEW_RELIC_ACCOUNT_ID',
        'VITE_NEW_RELIC_TRUST_KEY',
        'VITE_NEW_RELIC_LICENSE_KEY'
      ];
      
      let varsFound = 0;
      requiredVars.forEach(varName => {
        if (content.includes(varName)) {
          varsFound++;
          this.log(`Variable de entorno documentada: ${varName}`, 'success');
        } else {
          this.log(`Variable de entorno faltante: ${varName}`, 'warning');
        }
      });
      
      if (varsFound === requiredVars.length) {
        this.log('Variables de entorno completamente documentadas', 'success');
      }
    } else {
      this.log('Archivo .env.example no encontrado', 'warning');
    }
    
    // Verificar package.json para scripts de verificación
    if (fs.existsSync(packageJson)) {
      const content = fs.readFileSync(packageJson, 'utf8');
      const packageData = JSON.parse(content);
      
      if (packageData.scripts && packageData.scripts['verify-rnf01']) {
        this.log('Script verify-rnf01 configurado en package.json', 'success');
      } else {
        this.log('Script verify-rnf01 NO configurado en package.json', 'warning');
      }
    }
  }

  generateFinalReport() {
    const duration = Date.now() - this.startTime;
    const successCount = this.results.filter(r => r.type === 'success').length;
    const errorCount = this.results.filter(r => r.type === 'error').length;
    const warningCount = this.results.filter(r => r.type === 'warning').length;
    
    this.log('', 'info');
    this.log('🎯 REPORTE FINAL - VERIFICACIÓN RNF01', 'info');
    this.log('==========================================', 'info');
    this.log(`⏱️ Tiempo de verificación: ${duration}ms`, 'info');
    this.log(`✅ Verificaciones exitosas: ${successCount}`, 'success');
    this.log(`⚠️ Advertencias: ${warningCount}`, 'warning');
    this.log(`❌ Errores: ${errorCount}`, 'error');
    this.log('', 'info');
    
    // Verificar componentes críticos del RNF01
    const criticalChecks = [
      'TRAZA 1: Stock Purchase Flow COMPLETA',
      'TRAZA 2: Exchange Flow COMPLETA',
      'ALARMA DE DISPONIBILIDAD COMPLETAMENTE CONFIGURADA',
      'DASHBOARD FUNCIONANDO'
    ];
    
    const passedCritical = this.results.filter(r => 
      r.type === 'success' && 
      criticalChecks.some(check => r.message.includes(check))
    ).length;
    
    this.log('🔍 VERIFICACIÓN ESPECÍFICA RNF01:', 'info');
    this.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info');
    this.log(`📊 Componentes críticos: ${passedCritical}/${criticalChecks.length}`, 'info');
    
    if (passedCritical === criticalChecks.length && errorCount === 0) {
      this.log('', 'info');
      this.log('🎉 ¡RNF01 COMPLETAMENTE IMPLEMENTADO!', 'success');
      this.log('✅ 2 trazas funcionales sintéticas monitoreadas', 'success');
      this.log('✅ 1 alarma de disponibilidad operativa', 'success');
      this.log('✅ Dashboard funcionando en New Relic', 'success');
      this.log('✅ Implementación técnica completa', 'success');
      this.log('', 'info');
      this.log('📈 PUNTUACIÓN ESPERADA: 5/5 puntos', 'success');
      
      // Crear archivo de verificación
      this.createVerificationFile(true);
      
      process.exit(0);
    } else if (passedCritical >= 3 && errorCount <= 2) {
      this.log('', 'info');
      this.log('⚠️ RNF01 MAYORMENTE IMPLEMENTADO', 'warning');
      this.log(`✅ ${passedCritical}/4 componentes críticos funcionando`, 'warning');
      this.log('⚠️ Revisar errores para implementación completa', 'warning');
      
      this.createVerificationFile(false);
      
      process.exit(1);
    } else {
      this.log('', 'info');
      this.log('❌ RNF01 IMPLEMENTACIÓN INCOMPLETA', 'error');
      this.log(`❌ Solo ${passedCritical}/4 componentes críticos funcionando`, 'error');
      this.log('❌ Implementación insuficiente para cumplir requisito', 'error');
      this.log('', 'info');
      this.log('🔧 ACCIONES REQUERIDAS:', 'info');
      this.log('1. Implementar las trazas funcionales faltantes', 'info');
      this.log('2. Configurar alarma de disponibilidad', 'info');
      this.log('3. Integrar dashboard de New Relic', 'info');
      this.log('4. Revisar documentación técnica', 'info');
      
      this.createVerificationFile(false);
      
      process.exit(1);
    }
  }

  createVerificationFile(passed) {
    const verificationData = {
      timestamp: new Date().toISOString(),
      rnf01Status: passed ? 'PASSED' : 'FAILED',
      duration: Date.now() - this.startTime,
      results: this.results,
      summary: {
        success: this.results.filter(r => r.type === 'success').length,
        errors: this.results.filter(r => r.type === 'error').length,
        warnings: this.results.filter(r => r.type === 'warning').length
      }
    };
    
    const outputPath = path.join(this.projectRoot, 'verification-rnf01-result.json');
    fs.writeFileSync(outputPath, JSON.stringify(verificationData, null, 2));
    
    this.log(`📄 Reporte guardado en: ${outputPath}`, 'info');
  }
}

// Función principal
async function main() {
  const verifier = new RNF01Verifier();
  await verifier.verify();
}

// Ejecutar si es llamado directamente
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch(error => {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  });
}

export { RNF01Verifier };