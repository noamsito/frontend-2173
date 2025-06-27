import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { LoginButton, LogoutButton, Profile } from './components/AuthComponents';
import Navigation from './components/Navigation';
import SystemStatus from './components/SystemStatus';
import TestStocks from './testStocks';
import MyPurchases from './pages/MyPurchases';
import PurchaseDetail from './pages/PurchaseDetail';
import StockDetail from './pages/StockDetail';
import EventLog from './pages/EventLog';
import Exchanges from './pages/Exchanges';
import MisAcciones from './pages/MisAcciones';
import './styles/SystemStatus.css';
import './styles/EventLog.css';
import './styles/stock-detail.css';
import './styles/exchanges.css';
import './styles/misacciones.css';


function App() {
  const { isLoading, error, isAuthenticated, user } = useAuth0();

  if (error) {
    return <div className="error-container">¡Ups! Un error: {error.message}</div>;
  }

  if (isLoading) {
    return <div className="loading-container">Cargando...</div>;
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
            
            <SystemStatus />
            
            <main>
              <Routes>
                <Route path="/" element={<Navigate to="/stocks" replace />} />
                <Route path="/stocks" element={<TestStocks />} />
                <Route path="/stocks/:symbol" element={<StockDetail />} />
                <Route path="/my-purchases" element={<MyPurchases />} />
                <Route path="/purchases/:id" element={<PurchaseDetail />} />
                <Route path="/event-log" element={<EventLog />} />
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
                  <li>Gestión de compras inteligente</li>
                  <li>Registro de eventos del mercado</li>
                  <li>Interfaz intuitiva y profesional</li>
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