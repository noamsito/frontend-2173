import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  
  // Determinar qué enlace está activo
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="nav-container">
      
      {/* Mensaje de admin prominente */}
      {!loading && userProfile?.isAdmin && (
        <div style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '10px 20px',
          textAlign: 'center',
          fontWeight: 'bold',
          marginBottom: '10px',
          borderRadius: '5px'
        }}>
          🔑 ERES ADMIN
        </div>
      )}
     
      <div className="nav-links">
        <Link to="/stocks" className={isActive('/stocks')}>
          Acciones
        </Link>
        <Link to="/my-purchases" className={isActive('/my-purchases')}>
          Mis Compras
        </Link>
        <Link to="/mis-acciones" className={isActive('/mis-acciones')}>
          📊 Mis Acciones
        </Link>
        <Link to="/event-log" className={isActive('/event-log')}>
          Registro de Eventos
        </Link>
        {/* <Link to="/auctions" className={isActive('/auctions')}>
          🏛️ Subastas
        </Link> */}
        <Link to="/exchanges" className={isActive('/exchanges')}>
          🔄 Intercambios
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;