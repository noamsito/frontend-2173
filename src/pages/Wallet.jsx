// src/pages/Wallet.jsx
import { useState, useEffect } from 'react';
import { getWalletBalance, depositToWallet } from '../api/wallet';
import { useAuth0 } from '@auth0/auth0-react';

const Wallet = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [balance, setBalance] = useState(0);
  const [depositAmount, setDepositAmount] = useState(100);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const data = await getWalletBalance();
      setBalance(data.balance || 0);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setError("Failed to load wallet balance");
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }

    if (depositAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      setDepositing(true);
      setError(null);
      
      const result = await depositToWallet(depositAmount);
      
      setBalance(result.balance);
      alert(`Successfully deposited $${depositAmount}`);
      setDepositAmount(100); // Reset to default
    } catch (error) {
      console.error("Deposit error:", error);
      setError("Failed to process deposit");
    } finally {
      setDepositing(false);
    }
  };

  if (loading) return <div>Loading wallet...</div>;

  if (!isAuthenticated) {
    return (
      <div className="wallet-container">
        <h2>My Wallet</h2>
        <p>Please log in to access your wallet</p>
        <button onClick={() => loginWithRedirect()}>Login</button>
      </div>
    );
  }

  return (
    <div className="wallet-container">
      <h2>My Wallet</h2>
      
      <div className="wallet-balance">
        <h3>Current Balance: ${balance.toFixed(2)}</h3>
      </div>
      
      <div className="deposit-form">
        <h3>Add Funds</h3>
        
        <div className="form-group">
          <label htmlFor="amount">Amount ($):</label>
          <input
            type="number"
            id="amount"
            min="10"
            value={depositAmount}
            onChange={(e) => setDepositAmount(parseFloat(e.target.value))}
          />
        </div>
        
        {error && <p className="error">{error}</p>}
        
        <button 
          onClick={handleDeposit} 
          disabled={depositing || depositAmount <= 0}
        >
          {depositing ? "Processing..." : "Deposit"}
        </button>
      </div>
    </div>
  );
};

export default Wallet;