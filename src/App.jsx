import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { LoginButton, LogoutButton, Profile } from './components/AuthComponents';
import Navigation from './components/Navigation';
import SystemStatus from './components/SystemStatus';
import NewRelicMonitor from './components/NewRelicMonitor';
import TestStocks from './testStocks';
import MyPurchases from './pages/MyPurchases';
import PurchaseDetail from './pages/PurchaseDetail';
import Wallet from './pages/Wallet';
import StockDetail from './pages/StockDetail';
import EventLog from './pages/EventLog';
import Auctions from './pages/Auctions';
import Exchanges from './pages/Exchanges';
import MisAcciones from './pages/MisAcciones';
import { BYPASS_AUTH } from './api/apiConfig';
import { newRelicMonitor } from './utils/newrelic';

import './App.css';
import './styles/purchases.css';
import './styles/SystemStatus.css';
import './styles/NewRelicMonitor.css';
import './styles/auctions.css';
import './styles/exchanges.css';
import './styles/misacciones.css';

function App() {
  const { isLoading, error, isAuthenticated, user } = useAuth0();

  useEffect(() => {
    // INICIALIZAR NEW RELIC MONITORING AUTOMÁTICAMENTE
    if (window.newrelic) {
      console.log('🔍 Inicializando New Relic monitoring...');
      
      // Configurar atributos iniciales de la aplicación
      window.newrelic.setCustomAttribute('application', 'StockMarketU-Frontend');
      window.newrelic.setCustomAttribute('environment', import.meta.env.MODE);
      window.newrelic.setCustomAttribute('bypassAuth', BYPASS_AUTH);
      window.newrelic.setCustomAttribute('userAgent', navigator.userAgent);
      window.newrelic.setCustomAttribute('timestamp', new Date().toISOString());
      
      // Trackear evento de aplicación iniciada
      window.newrelic.addPageAction('Application_Started', {
        timestamp: new Date().toISOString(),
        loadTime: performance.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        bypassAuth: BYPASS_AUTH,
        environment: import.meta.env.MODE
      });

      // INICIAR HEARTBEAT DE DISPONIBILIDAD (ALARMA REQUERIDA)
      console.log('💓 Iniciando heartbeat de disponibilidad...');
      const heartbeatInterval = newRelicMonitor.startAvailabilityHeartbeat();
      
      // Limpiar interval al desmontar
      return () => {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
      };
    } else {
      console.warn('⚠️ New Relic Browser Agent no disponible');
    }
  }, []);

  useEffect(() => {
    // Trackear cambios de autenticación
    if (window.newrelic) {
      window.newrelic.addPageAction('Authentication_StateChange', {
        isAuthenticated: isAuthenticated,
        isLoading: isLoading,
        hasError: !!error,
        bypassAuth: BYPASS_AUTH,
        timestamp: new Date().toISOString()
      });

      // Configurar atributos de usuario si está autenticado
      if (isAuthenticated && user) {
        window.newrelic.setCustomAttribute('userId', user.sub);
        window.newrelic.setCustomAttribute('userEmail', user.email);
        window.newrelic.setCustomAttribute('userName', user.name);
        window.newrelic.setCustomAttribute('isAuthenticated', true);
      } else if (BYPASS_AUTH) {
        window.newrelic.setCustomAttribute('userId', 'bypass-user');
        window.newrelic.setCustomAttribute('isAuthenticated', 'bypassed');
      }
    }
  }, [isAuthenticated, isLoading, error, user]);

  // Configurar error handler global para New Relic
  useEffect(() => {
    const handleGlobalError = (event) => {
      if (window.newrelic) {
        window.newrelic.addPageAction('Application_Error', {
          errorType: 'global_error',
          errorMessage: event.error?.message || 'Unknown error',
          errorStack: event.error?.stack,
          timestamp: new Date().toISOString(),
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      }
    };

    const handleUnhandledRejection = (event) => {
      if (window.newrelic) {
        window.newrelic.addPageAction('Application_Error', {
          errorType: 'unhandled_promise_rejection',
          errorMessage: event.reason?.message || event.reason || 'Unhandled promise rejection',
          timestamp: new Date().toISOString()
        });
      }
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // En modo bypass, saltamos la autenticación
  if (BYPASS_AUTH) {
    return (
      <Router>
        <div className="app-container">
          <header className="app-header">
            <h1>StockMarketU (Modo Prueba)</h1>
            <Navigation />
            <div className="user-profile">
              <span>👤 Usuario de Prueba</span>
            </div>
          </header>
          
          {/* COMPONENTES DE MONITOREO - OBLIGATORIOS PARA RNF01 */}
          <SystemStatus />
          <NewRelicMonitor />
          
          <main>
            <Routes>
              <Route path="/" element={<Navigate to="/stocks" replace />} />
              <Route path="/stocks" element={<TestStocks />} />
              <Route path="/stocks/:symbol" element={<StockDetail />} />
              <Route path="/my-purchases" element={<MyPurchases />} />
              <Route path="/purchases/:id" element={<PurchaseDetail />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/event-log" element={<EventLog />} />
              <Route path="/auctions" element={<Auctions />} />
              <Route path="/exchanges" element={<Exchanges />} />
              <Route path="/mis-acciones" element={<MisAcciones />} />
            </Routes>
          </main>
        </div>
      </Router>
    );
  }

  if (error) {
    // Trackear error de autenticación
    if (window.newrelic) {
      window.newrelic.addPageAction('Authentication_Error', {
        errorMessage: error.message,
        timestamp: new Date().toISOString()
      });
    }
    return <div>¡Ups! Un error: {error.message}</div>;
  }

  if (isLoading) {
    // Trackear estado de carga
    if (window.newrelic) {
      window.newrelic.addPageAction('Application_Loading', {
        timestamp: new Date().toISOString()
      });
    }
    return <div>Cargando...</div>;
  }

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated ? (
          <>
            <header className="app-header">
              <h1>StockMarketU</h1>
              <Navigation />
              <div className="user-profile">
                <Profile />
                <LogoutButton />
              </div>
            </header>
            
            {/* COMPONENTES DE MONITOREO - OBLIGATORIOS PARA RNF01 */}
            <SystemStatus />
            <NewRelicMonitor />
            
            <main>
              <Routes>
                <Route path="/" element={<Navigate to="/stocks" replace />} />
                <Route path="/stocks" element={<TestStocks />} />
                <Route path="/stocks/:symbol" element={<StockDetail />} />
                <Route path="/my-purchases" element={<MyPurchases />} />
                <Route path="/purchases/:id" element={<PurchaseDetail />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/event-log" element={<EventLog />} />
                <Route path="/auctions" element={<Auctions />} />
                <Route path="/exchanges" element={<Exchanges />} />
                <Route path="/mis-acciones" element={<MisAcciones />} />
              </Routes>
            </main>
          </>
        ) : (
          <div className="login-container">
            <div className="landing-content">
              <div className="landing-text">
                <h1>Bienvenido al Sistema de Stocks</h1>
                <p>La plataforma más sofisticada para el seguimiento y compra de acciones en tiempo real</p>
                <ul className="feature-list">
                  <li>Seguimiento de acciones IPO y EMIT</li>
                  <li>Gestión de compras y billetera</li>
                  <li>Registro de eventos del mercado</li>
                  <li>Interfaz intuitiva y profesional</li>
                  <li>Monitoreo en tiempo real con New Relic</li>
                </ul>
              </div>
              <div className="landing-image">
                <img src="/web-traffic.png" alt="Análisis de stocks" />
              </div>
            </div>
            <LoginButton />
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;