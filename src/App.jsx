import { useAuth0 } from '@auth0/auth0-react';
import { LoginButton, LogoutButton, Profile } from './components/AuthComponents';
import TestStocks from './testStocks';
import './App.css';

function App() {
  const { isAuthenticated, isLoading } = useAuth0();
  
  if (isLoading) return <div>Cargando...</div>;
  
  return (
    <div className="app-container">
      {isAuthenticated ? (
        <>
          <header>
            <Profile />
            <LogoutButton />
          </header>
          <main>
            <TestStocks />
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
  );
}

export default App;