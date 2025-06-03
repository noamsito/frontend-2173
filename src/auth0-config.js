import { createAuth0Client } from '@auth0/auth0-spa-js';

let auth0Client;

export const getAuth0Client = async () => {
  if (!auth0Client) {
    auth0Client = await createAuth0Client({
      domain: import.meta.env.VITE_AUTH0_DOMAIN,
      clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: "https://stockmarket-api/",
        scope: "openid profile email" // Añadir scope para asegurar que se incluya el sub
      }
    });
  }
  return auth0Client;
};