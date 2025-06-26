import axios from "axios";
import { getAuth0Client } from "../auth0-config";
import { BYPASS_AUTH, API_URL } from "./apiConfig";

// Para obtener el token de Auth0
const getToken = async () => {
  if (BYPASS_AUTH) {
    console.log('🔧 Auth bypass enabled - skipping token');
    return null;
  }
  
  try {
    const auth0 = await getAuth0Client();
    return await auth0.getTokenSilently();
  } catch (error) {
    console.error("Error obteniendo token:", error);
    return null;
  }
};

export const getStocks = async (page = 1, count = 25) => {
    try {
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get(
          `${API_URL}/stocks?page=${page}&count=${count}`,
          { headers }
        );
        return response.data;
    } catch (err) {
        console.error("Error al obtener stocks:", err);
        return [];
    }
};

export const getStocksbySymbol = async (symbol) => {
    try {
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get(
          `${API_URL}/stocks/${symbol}`,
          { headers }
        );
        return response.data;
    } catch (err) {
        console.error(`Error al obtener detalles del simbolo ${symbol}:`, err);
        return null;
    }
};