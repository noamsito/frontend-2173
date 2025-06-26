import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getWalletBalance, depositToWallet } from '../api/wallet';

// Modo bypass deshabilitado en master
const BYPASS_AUTH = false;

const Wallet = () => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  // Inicializar con el valor guardado en localStorage si existe
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('walletBalance');
    return saved ? parseFloat(saved) : 0;
  });
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [retryAvailable, setRetryAvailable] = useState(false);
  const [lastDepositAmount, setLastDepositAmount] = useState('');

  useEffect(() => {
    if (isAuthenticated || BYPASS_AUTH) {
      fetchBalance();
    }
  }, [isAuthenticated]);

  const fetchBalance = async () => {
    console.log('🔍 fetchBalance - isAuthenticated:', isAuthenticated);
    console.log('🔍 fetchBalance - BYPASS_AUTH:', BYPASS_AUTH);
    
    if (!isAuthenticated && !BYPASS_AUTH) {
      console.log('❌ No autenticado y sin bypass, no se puede obtener balance');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Llamando a getWalletBalance()...');
      const data = await getWalletBalance();
      console.log('✅ Respuesta de getWalletBalance:', data);
      
      const newBalance = data.balance || 0;
      console.log('💰 Actualizando balance a:', newBalance);
      setBalance(newBalance);
      // Guardar en localStorage
      localStorage.setItem('walletBalance', newBalance.toString());
      setError('');
    } catch (error) {
      console.error('❌ Error completo al obtener balance:', error);
      console.error('❌ Error response:', error.response);
      setError('Error al obtener el balance');
      // NO poner el balance en 0 si hay error
      // setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated && !BYPASS_AUTH) {
      setError('Debes estar autenticado para hacer un depósito');
      return;
    }
    
    console.log('🔍 INICIO DEBUG - handleDeposit');
    console.log('💰 Monto a depositar:', depositAmount);
    
    setLoading(true);
    setSuccessMessage('');
    setError('');
    
    try {
        // Validación inicial
        if (!depositAmount || depositAmount <= 0) {
            console.log('❌ Error: Monto inválido');
            setError('Por favor ingresa un monto válido');
            return;
        }

        let token = null;
        if (!BYPASS_AUTH) {
            token = await getAccessTokenSilently();
        }
        
        const requestData = {
            amount: parseFloat(depositAmount)
        };
        
        console.log('📤 Datos a enviar:', requestData);
        console.log('🚀 Realizando fetch...');

        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/wallet/deposit`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestData)
        });

        console.log('📨 Respuesta recibida - Status:', response.status);
        console.log('📨 Respuesta recibida - OK:', response.ok);

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Respuesta parseada:', data);
            
            if (data.success) {
                console.log('🎉 Depósito exitoso!');
                setSuccessMessage(`✅ ${data.message}`);
                setDepositAmount('');
                
                // Actualizar balance local
                console.log('🔄 Actualizando balance...');
                setBalance(data.balance);
                // Guardar en localStorage
                localStorage.setItem('walletBalance', data.balance.toString());
            } else {
                setError(`❌ Error: ${data.error || 'Error desconocido'}`);
            }
        } else {
            const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
            setError(`❌ Error: ${errorData.error || 'Error del servidor'}`);
        }

    } catch (error) {
        console.error('💥 ERROR COMPLETO:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            setError('❌ Error de conexión: No se puede conectar al servidor.');
        } else if (error.message.includes('CORS')) {
            setError('❌ Error de CORS: Problema de configuración del servidor.');
        } else {
            setError(`❌ Error: ${error.message}`);
        }
    } finally {
        setLoading(false);
        console.log('🏁 FIN DEBUG - handleDeposit');
    }
  };
  
  // Añadir función de reintento
  const handleRetry = async () => {
    if (!lastDepositAmount) return;
    
    try {
      setLoading(true);
      const amount = parseFloat(lastDepositAmount);
      const response = await depositToWallet(amount);
      
      if (response.success) {
        setBalance(response.balance);
        setDepositAmount('');
        setSuccessMessage('¡Depósito realizado con éxito en el reintento!');
        setError('');
        setRetryAvailable(false);
        setLastDepositAmount('');
        
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(response.error || 'Error en el reintento');
      }
    } catch (err) {
      setError('El depósito falló definitivamente después del reintento.');
      setRetryAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated && !BYPASS_AUTH) {
    return (
      <div className="wallet-container">
        <h2>Mi Billetera</h2>
        <p>Debes iniciar sesión para ver tu billetera.</p>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      <h2>Mi Billetera</h2>
      
      {loading && <p>Cargando...</p>}
      
      {error && (
        <div className="error-message">
          {error}
          {retryAvailable && (
            <button 
              onClick={handleRetry} 
              className="retry-button"
              disabled={loading}
            >
              Reintentar depósito
            </button>
          )}
        </div>
      )}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="wallet-info">
        <h3>Saldo disponible: ${balance}</h3>
        
        <form onSubmit={handleDeposit}>
          <div className="form-group">
            <label htmlFor="deposit-amount">Monto a depositar:</label>
            <input
              id="deposit-amount"
              type="number"
              min="1"
              step="0.01"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Ingresa el monto"
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading}>
            Recargar saldo
          </button>
        </form>
      </div>
    </div>
  );
};

export default Wallet;