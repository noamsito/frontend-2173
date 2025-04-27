import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles.css'  // Importamos los nuevos estilos
import App from './App.jsx'
import { Auth0Provider } from '@auth0/auth0-react'

const domain = import.meta.env.VITE_AUTH0_DOMAIN || "dev-ouxdigl1l6bn6n3r.us.auth0.com";
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "ioEcob7KVSQ883eYRrY0gnyknMFJDRCt";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://stockmarket-api/"
      }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
)