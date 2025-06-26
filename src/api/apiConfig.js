// Configuración para bypass de autenticación en frontend
export const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true' || 
                          import.meta.env.MODE === 'development' ||
                          window.location.hostname === 'localhost';

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

console.log('🔧 Frontend Auth Bypass:', BYPASS_AUTH ? 'ENABLED' : 'DISABLED');
console.log('🔧 API URL:', API_URL);

// Configuración unificada de API
export const apiConfig = {
    baseURL: API_URL,
    bypassAuth: BYPASS_AUTH,
    getHeaders: () => {
        return {
            'Content-Type': 'application/json',
            ...(BYPASS_AUTH ? {} : {
                // Si necesitas autenticación, agregar headers aquí
            })
        };
    }
}; 