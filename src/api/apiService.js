import axios from "axios";
import { getAuth0Client } from "../auth0-config.jsx"; // Cambia .js por .jsx


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

// Modificar la función getStocks para aceptar filtros

export const getStocks = async (params = {}) => {
  try {
    const headers = await getAuthHeaders();
    
    // Construir query string con todos los parámetros
    const queryParams = new URLSearchParams();
    
    // Parámetros de paginación
    if (params.page) queryParams.append('page', params.page);
    if (params.count) queryParams.append('count', params.count);
    
    // Parámetros de filtro
    if (params.symbol) queryParams.append('symbol', params.symbol);
    if (params.name) queryParams.append('name', params.name);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice);
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice);
    if (params.minQuantity) queryParams.append('minQuantity', params.minQuantity);
    if (params.maxQuantity) queryParams.append('maxQuantity', params.maxQuantity);
    if (params.date) queryParams.append('date', params.date);
    
    const url = `${API_URL}/stocks?${queryParams.toString()}`;
    
    const response = await axios.get(url, { headers });
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
    // Agregado de webpay
    const data = response.data;
    console.log("Respuesta del backend:", data); // DEBUG
    // Si hay datos de Webpay, redirigir a la URL de pago
    if (data.webpay && data.webpay.url && data.webpay.token) {
      return {
        ...data,
        requiresPayment: true,
        webpayUrl: data.webpay.url,
        webpayToken: data.webpay.token
      };
    }
    return data;
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
      
      // Procesar las fechas y asegurar que details sea un objeto
      const events = response.data.data.map(event => {
        // Si details es un string, convertirlo a objeto
        if (typeof event.details === 'string') {
          try {
            event.details = JSON.parse(event.details);
          } catch (e) {
            console.error("Error al parsear detalles del evento:", e);
          }
        }
        
        return {
          ...event,
          formatted_date: new Date(event.created_at).toLocaleString()
        };
      });
      
      return { data: events };
    } catch (err) {
      console.error("Error al obtener eventos:", err);
      throw err;
    }
  };