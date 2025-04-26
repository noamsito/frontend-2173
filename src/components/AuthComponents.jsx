import { useAuth0 } from '@auth0/auth0-react';

export const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();
  
  return (
    <button onClick={() => loginWithRedirect()}>
      Iniciar sesión
    </button>
  );
};

export const LogoutButton = () => {
  const { logout } = useAuth0();
  
  return (
    <button onClick={() => logout({ 
      logoutParams: { returnTo: window.location.origin } 
    })}>
      Cerrar sesión
    </button>
  );
};

export const Profile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  
  if (isLoading) return <div>Cargando...</div>;
  
  return (
    isAuthenticated && (
      <div>
        <img src={user.picture} alt={user.name} style={{width: 50, borderRadius: '50%'}} />
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    )
  );
};