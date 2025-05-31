// Create file: src/api/purchases.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

console.log("🔧 API_URL configurada:", API_URL); // DEBUG

// Función de ayuda para crear headers sin autenticación (temporal)
const getAuthHeaders = async () => {
  return {}; // Sin headers por ahora
};

// Obtener compras de un usuario - usar userId hardcodeado para testing
export const getUserPurchases = async (userId = 1) => {
  try {
    console.log("📡 Llamando a getUserPurchases para userId:", userId); // DEBUG
    console.log("📡 URL completa:", `${API_URL}/api/purchases/user/${userId}`); // DEBUG
    
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${API_URL}/api/purchases/user/${userId}`,
      { headers }
    );
    
    console.log("✅ Respuesta exitosa:", response.data); // DEBUG
    return response.data;
  } catch (err) {
    console.error("❌ Error detallado:", err); // DEBUG
    console.error("❌ Response:", err.response?.data); // DEBUG
    console.error("❌ Status:", err.response?.status); // DEBUG
    throw err;
  }
};

// Crear nueva compra
export const createPurchase = async (purchaseData) => {
  try {
    console.log("📡 Creando compra:", purchaseData); // DEBUG
    
    const headers = await getAuthHeaders();
    const dataWithUserId = { ...purchaseData, userId: 1 };
    
    console.log("📡 Data final:", dataWithUserId); // DEBUG
    
    const response = await axios.post(
      `${API_URL}/api/purchases`,
      dataWithUserId,
      { headers }
    );
    
    console.log("✅ Compra creada:", response.data); // DEBUG
    return response.data;
  } catch (err) {
    console.error("❌ Error al crear compra:", err);
    throw err;
  }
};

// Obtener estimación de una compra
export const getPurchaseEstimation = async (purchaseId) => {
  try {
    console.log("📡 Obteniendo estimación para:", purchaseId);
    
    const headers = await getAuthHeaders();
    const response = await axios.get(
      `${API_URL}/api/purchases/${purchaseId}/estimate`,
      { headers }
    );
    
    console.log("✅ Estimación obtenida:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Error al obtener estimación:", err);
    throw err;
  }
};