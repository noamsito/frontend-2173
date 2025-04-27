import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  
  // Determinar qué enlace está activo
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="nav-container">
      <div className="logo">
        <h2>StockMarketU</h2>
      </div>
      <div className="nav-links">
        <Link to="/stocks" className={isActive('/stocks')}>
          Acciones
        </Link>
        <Link to="/my-purchases" className={isActive('/my-purchases')}>
          Mis Compras
        </Link>
        <Link to="/wallet" className={isActive('/wallet')}>
          Billetera
        </Link>
        <Link to="/event-log" className={isActive('/event-log')}>
          Registro de Eventos
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;