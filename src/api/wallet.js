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
    const token = await getToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.post(
      `${API_URL}/wallet/deposit`,
      { amount },
      { headers }
    );
    return response.data;
  } catch (err) {
    console.error("Error depositing to wallet:", err);
    throw err;
  }
};