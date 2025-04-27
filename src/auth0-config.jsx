import { createAuth0Client } from '@auth0/auth0-spa-js';

let auth0Client;

export const getAuth0Client = async () => {
  if (!auth0Client) {
    auth0Client = await createAuth0Client({
      domain: "dev-ouxdigl1l6bn6n3r.us.auth0.com",
      clientId: "ioEcob7KVSQ883eYRrY0gnyknMFJDRCt",
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: "https://stockmarket-api/"
      }
    });
  }
  return auth0Client;
};