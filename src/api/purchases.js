// Create file: src/api/purchases.js
import axios from "axios";
import { getAuth0Client } from "../auth0-config";

const API_URL = import.meta.env.VITE_API_URL;

// For obtaining the Auth0 token
const getToken = async () => {
  try {
    const auth0 = await getAuth0Client();
    return await auth0.getTokenSilently();
  } catch (error) {
    console.error("Error obtaining token:", error);
    return null;
  }
};

export const purchaseStock = async (symbol, quantity) => {
  try {
    const token = await getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.post(
      `${API_URL}/stocks/buy`,
      { symbol, quantity },
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error("Error purchasing stock:", err);
    throw err;
  }
};

export const getUserPurchases = async () => {
  try {
    const token = await getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get(
      `${API_URL}/purchases`,
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error("Error fetching user purchases:", err);
    return { data: [] };
  }
};