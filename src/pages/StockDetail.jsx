// src/pages/StockDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStocksbySymbol } from '../api/stocks';
import { purchaseStock } from '../api/purchases';
import { getWalletBalance } from '../api/wallet';
import { useAuth0 } from '@auth0/auth0-react';

const StockDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth0();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [walletBalance, setWalletBalance] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stockData = await getStocksbySymbol(symbol);
        setStock(stockData.data);
        
        if (isAuthenticated) {
          const walletData = await getWalletBalance();
          setWalletBalance(walletData.balance || 0);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load stock data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, isAuthenticated]);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      setError("Please login to purchase stocks");
      return;
    }

    if (quantity <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    const totalCost = stock[0].price * quantity;
    if (totalCost > walletBalance) {
      setError("Insufficient funds in wallet");
      return;
    }

    try {
      setPurchasing(true);
      setError(null);
      
      await purchaseStock(symbol, quantity);
      
      alert("Purchase request sent! Check your purchases page for updates.");
      navigate('/my-purchases');
    } catch (error) {
      console.error("Purchase error:", error);
      setError(error.response?.data?.error || "Failed to purchase stock");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) return <div>Loading details...</div>;
  
  if (!stock || stock.length === 0) return <div>No data found for {symbol}</div>;

  return (
    <div className="stock-detail-container">
      <h2>Details for {symbol}</h2>
      
      <div className="stock-info">
        <h3>{stock[0].short_name}</h3>
        <p>Long name: {stock[0].long_name}</p>
        <p>Current price: ${stock[0].price.toFixed(2)}</p>
        <p>Available: {stock[0].quantity} shares</p>
        <p>Last updated: {new Date(stock[0].timestamp).toLocaleString()}</p>
      </div>
      
      {isAuthenticated && (
        <div className="purchase-form">
          <h3>Buy Shares</h3>
          <p>Your wallet balance: ${walletBalance.toFixed(2)}</p>
          
          <div className="form-group">
            <label htmlFor="quantity">Quantity:</label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={stock[0].quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
            />
          </div>
          
          <div className="price-calculation">
            <p>Total cost: ${(stock[0].price * quantity).toFixed(2)}</p>
          </div>
          
          {error && <p className="error">{error}</p>}
          
          <button 
            onClick={handlePurchase} 
            disabled={purchasing || quantity <= 0 || quantity > stock[0].quantity}
          >
            {purchasing ? "Processing..." : "Buy Now"}
          </button>
        </div>
      )}
    </div>
  );
};

export default StockDetail;