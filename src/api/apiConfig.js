// Configuración de API para intercambios
export const apiConfig = {
    baseURL: 'http://localhost:3000',
    
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        // Intentar obtener token de Auth0 si existe
        try {
            const token = localStorage.getItem('auth0_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        } catch (error) {
            console.log('No se pudo obtener token de autenticación');
        }
        
        return headers;
    }
}; 