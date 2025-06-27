import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getUserProfile } from '../api/apiService';

const Navigation = () => {
  const location = useLocation();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar perfil del usuario al montar el componente
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
        console.log('Perfil de usuario:', profile); // Para debug
      } catch (error) {
        console.error('Error cargando perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Determinar qué enlace está activo
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="nav-container">
      <div className="logo">
        <h2>StockMarketU</h2>
      </div>
      
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
        <div className="nav-link-container">
          <Link to="/my-purchases" className={isActive('/my-purchases')}>
            Mis Compras
          </Link>
          {!loading && userProfile?.isAdmin && (
            <span 
              className="admin-badge" 
              style={{
                color: 'black',
                backgroundColor: '#28a745',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '8px',
                marginTop: '2px',
                fontWeight: '500'
              }}
            >
              Administrador
            </span>
          )}
        </div>
        <Link to="/event-log" className={isActive('/event-log')}>
          Registro de Eventos
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;