import { useState, useEffect } from 'react';
import { getWalletBalance, depositToWallet } from '../api/apiService';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      const data = await depositToWallet(parseFloat(depositAmount));
      setBalance(data.balance);
      setDepositAmount('');
      setSuccessMessage('¡Depósito realizado con éxito!');
      setError('');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error al realizar el depósito. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wallet-container">
      <h2>Mi Billetera</h2>
      
      {loading && <p>Cargando...</p>}
      
      {error && <div className="error-message">{error}</div>}
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