// Create file: src/api/wallet.js
import axios from "axios";
import { getAuth0Client } from "../auth0-config";

const API_URL = import.meta.env.VITE_API_URL;

const getToken = async () => {
  try {
    const auth0 = await getAuth0Client();
    return await auth0.getTokenSilently();
  } catch (error) {
    console.error("Error obtaining token:", error);
    return null;
  }
};

export const getWalletBalance = async () => {
  try {
    const token = await getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get(
      `${API_URL}/wallet/balance`,
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error("Error fetching wallet balance:", err);
    return { balance: 0 };
  }
};

export const depositToWallet = async (amount) => {
  try {
    // Primero, asegurarse de que el usuario esté registrado
    await registerUserIfNeeded();
    
    const token = await getToken();
    
    if (!token) {
      throw new Error("No se pudo obtener un token de autenticación");
    }
    
    // Añadir logs para depuración
    console.log("Token obtenido:", token.substring(0, 10) + "...");
    
    const headers = { Authorization: `Bearer ${token}` };
    
    const response = await axios.post(
      `${API_URL}/wallet/deposit`,
      { amount },
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error("Error al depositar:", err);
    throw err;
  }
};

export const registerUserIfNeeded = async () => {
  try {
    const token = await getToken();
    if (!token) return false;
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Obtener datos del usuario de Auth0
    const auth0 = await getAuth0Client();
    const user = await auth0.getUser();
    
    console.log("Datos de usuario de Auth0:", user);
    
    // Si no tenemos email o name, no podemos registrar
    if (!user.email) {
      console.error("No se pudo obtener email del usuario");
      return false;
    }
    
    // Intentar registrar al usuario si no existe
    await axios.post(
      `${API_URL}/users/register`, 
      { 
        name: user.name || user.nickname || "Usuario", 
        email: user.email 
      },
      { headers }
    );
    
    return true;
  } catch (err) {
    // Si el error es porque el usuario ya existe (código 409), retornamos true
    if (err.response && err.response.status === 409) {
      console.log("Usuario ya registrado");
      return true;
    }
    console.error("Error verificando registro:", err);
    return false;
  }
};