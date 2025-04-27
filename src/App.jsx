import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { LoginButton, LogoutButton, Profile } from './components/AuthComponents';
import Navigation from './components/Navigation';
import TestStocks from './testStocks';
import MyPurchases from './pages/MyPurchases';
import Wallet from './pages/Wallet';
import StockDetail from './pages/StockDetail';
import EventLog from './pages/EventLog';

import './App.css';

function App() {
  const { isAuthenticated, isLoading } = useAuth0();
  
  if (isLoading) return <div>Cargando...</div>;

  return (
    <Router>
      <div className="app-container">
      {isAuthenticated ? (
      <>
        <header className="app-header">
          <div className="user-profile">
            <Profile />
          </div>
          <nav className="main-nav">
            <Link to="/stocks">Stocks</Link>
            <Link to="/my-purchases">Mis Compras</Link>
            <Link to="/wallet">Billetera</Link>
            <Link to="/event-log">Registro de Eventos</Link>
          </nav>
          <div className="logout-button">
            <LogoutButton />
          </div>
        </header>
            <main>
              <Routes>
                <Route path="/" element={<Navigate to="/stocks" />} />
                <Route path="/stocks" element={<TestStocks />} />
                <Route path="/stocks/:symbol" element={<StockDetail />} />
                <Route path="/my-purchases" element={<MyPurchases />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/event-log" element={<EventLog />} />
              </Routes>
            </main>
          </>
        ) : (
          <div className="login-container">
            <h1>Bienvenido al Sistema de Stocks</h1>
            <p>Por favor inicia sesión para continuar</p>
            <LoginButton />
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;