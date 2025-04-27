import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { LoginButton, LogoutButton, Profile } from './components/AuthComponents';
import TestStocks from './testStocks'; // Esta es la vista de listado de stocks, más adelante renombrarás
import MyPurchases from './pages/MyPurchases'; // Vas a crear esta carpeta y estos archivos
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
            <header>
              <Profile />
              <LogoutButton />
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
