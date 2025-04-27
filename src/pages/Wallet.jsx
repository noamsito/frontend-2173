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
    try {
      setLoading(true);
      const data = await getWalletBalance();
      setBalance(data.balance);
      setError('');
    } catch (err) {
      setError('No se pudo cargar el saldo. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || isNaN(parseFloat(depositAmount)) || parseFloat(depositAmount) <= 0) {
      setError('Por favor, ingresa un monto válido mayor a cero.');
      return;
    }
  
    try {
      setLoading(true);
      const amount = parseFloat(depositAmount);
      const data = await depositToWallet(amount);
      
      setBalance(data.balance);
      setDepositAmount('');
      setSuccessMessage('¡Depósito realizado con éxito!');
      setError('');
      setRetryAvailable(false);
      setLastDepositAmount('');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error al realizar el depósito. Puedes intentar una vez más.');
      setRetryAvailable(true);
      setLastDepositAmount(depositAmount);
    } finally {
      setLoading(false);
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