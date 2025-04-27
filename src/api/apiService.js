import axios from "axios";
import { getAuth0Client } from "../auth0-config";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Para obtener el token de Auth0
const getToken = async () => {
  try {
    const auth0 = await getAuth0Client();
    return await auth0.getTokenSilently();
  } catch (error) {
    console.error("Error obteniendo token:", error);
    return null;
  }
};

// Función de ayuda para crear headers con autenticación
const getAuthHeaders = async () => {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API de Stocks
export const getStocks = async (page = 1, count = 25) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${API_URL}/stocks?page=${page}&count=${count}`,
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error("Error al obtener stocks:", err);
    throw err;
  }
};

export const getStockBySymbol = async (symbol) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${API_URL}/stocks/${symbol}`,
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error(`Error al obtener detalles del símbolo ${symbol}:`, err);
    throw err;
  }
};

export const buyStock = async (symbol, quantity) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_URL}/stocks/buy`,
      { symbol, quantity },
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error("Error al comprar acciones:", err);
    throw err;
  }
};

// API de Usuario y Wallet
export const getUserProfile = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/user/profile`, { headers });
    return response.data;
  } catch (err) {
    console.error("Error al obtener perfil de usuario:", err);
    throw err;
  }
};

export const getWalletBalance = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/wallet/balance`, { headers });
    return response.data;
  } catch (err) {
    console.error("Error al obtener saldo de la billetera:", err);
    throw err;
  }
};

export const depositToWallet = async (amount) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_URL}/wallet/deposit`,
      { amount },
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error("Error al depositar en la billetera:", err);
    throw err;
  }
};

// API de Compras
export const getUserPurchases = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_URL}/purchases`, { headers });
    return response.data;
  } catch (err) {
    console.error("Error al obtener compras del usuario:", err);
    throw err;
  }
};

// API de Eventos
export const getEvents = async (page = 1, count = 25, type = 'ALL') => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${API_URL}/events?page=${page}&count=${count}&type=${type}`,
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error("Error al obtener eventos:", err);
    throw err;
  }
};