import { useState, useEffect } from 'react';
import { getWalletBalance, depositToWallet } from '../api/apiService';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [retryAvailable, setRetryAvailable] = useState(false);
  const [lastDepositAmount, setLastDepositAmount] = useState('');

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    console.log('🔍 INICIO DEBUG - fetchBalance');
    setLoading(true); // Agregar esto
    
    try {
        console.log('🚀 Obteniendo balance de: http://localhost:3000/api/users/1/balance');
        
        const response = await fetch('http://localhost:3000/api/users/1/balance');
        
        console.log('📨 Balance response - Status:', response.status);
        console.log('📨 Balance response - OK:', response.ok);
        
        const responseText = await response.text();
        console.log('📄 Balance RAW:', responseText);
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            console.log('💰 Balance parseado:', data);
            setBalance(data.balance || 0);
        } else {
            console.error('❌ Error obteniendo balance:', responseText);
        }
    } catch (error) {
        console.error('💥 ERROR fetchBalance:', error);
        setBalance(0);
    } finally {
        setLoading(false); // ¡ESTO SIEMPRE SE EJECUTA!
    }
    
    console.log('🏁 FIN DEBUG - fetchBalance');
  };

  const handleDeposit = async (e) => {
    e.preventDefault(); // ¡ESTO FALTABA!
    
    console.log('🔍 INICIO DEBUG - handleDeposit');
    console.log('💰 Monto a depositar:', depositAmount);
    console.log('🌐 URL del backend:', 'http://localhost:3000/api/users/1/deposit');
    
    setLoading(true);
    setSuccessMessage('');
    setError('');
    
    try {
        // Validación inicial
        if (!depositAmount || depositAmount <= 0) {
            console.log('❌ Error: Monto inválido');
            setError('Por favor ingresa un monto válido');
            return; // Ya no necesita setLoading(false) aquí porque va al finally
        }

        const requestData = {
            amount: parseFloat(depositAmount)
        };
        
        console.log('📤 Datos a enviar:', requestData);
        console.log('🚀 Realizando fetch...');

        const response = await fetch('http://localhost:3000/api/users/1/deposit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        console.log('📨 Respuesta recibida - Status:', response.status);
        console.log('📨 Respuesta recibida - OK:', response.ok);

        const responseText = await response.text();
        console.log('📄 Respuesta RAW:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
            console.log('✅ JSON parseado:', data);
        } catch (parseError) {
            console.error('❌ Error parseando JSON:', parseError);
            throw new Error(`Error parseando respuesta: ${responseText.substring(0, 100)}`);
        }

        if (response.ok && data.success) {
            console.log('🎉 Depósito exitoso!');
            setSuccessMessage(`✅ ${data.message}`);
            setDepositAmount('');
            
            // Actualizar balance local
            console.log('🔄 Actualizando balance local...');
            await fetchBalance();
        } else {
            console.log('❌ Error en la respuesta:', data);
            setError(`❌ Error: ${data.error || 'Error desconocido'}`);
        }

    } catch (error) {
        console.error('💥 ERROR COMPLETO:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            setError('❌ Error de conexión: No se puede conectar al servidor. Verifica que Docker esté ejecutándose.');
        } else if (error.message.includes('CORS')) {
            setError('❌ Error de CORS: Problema de configuración del servidor.');
        } else {
            setError(`❌ Error: ${error.message}`);
        }
    } finally {
        setLoading(false); // ¡ESTO SIEMPRE SE EJECUTA!
        console.log('🏁 FIN DEBUG - handleDeposit');
    }
  };
  
  // Añadir función de reintento
  const handleRetry = async () => {
    if (!lastDepositAmount) return;
    
    try {
      setLoading(true);
      const amount = parseFloat(lastDepositAmount);
      const data = await depositToWallet(amount);
      
      setBalance(data.balance);
      setDepositAmount('');
      setSuccessMessage('¡Depósito realizado con éxito en el reintento!');
      setError('');
      setRetryAvailable(false);
      setLastDepositAmount('');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('El depósito falló definitivamente después del reintento.');
      setRetryAvailable(false);
    } finally {
      setLoading(false);
    }
  };

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