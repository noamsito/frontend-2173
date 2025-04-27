// src/pages/MyPurchases.jsx
import { useState, useEffect } from 'react';
import { getUserPurchases } from '../api/purchases';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';

const MyPurchases = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPurchases();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const result = await getUserPurchases();
      setPurchases(result.data || []);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setError("Failed to load purchase history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'status-success';
      case 'REJECTED': return 'status-error';
      case 'PENDING': return 'status-pending';
      default: return '';
    }
  };

  if (loading) return <div>Loading purchases...</div>;

  if (!isAuthenticated) {
    return (
      <div className="purchases-container">
        <h2>My Purchases</h2>
        <p>Please log in to view your purchase history</p>
        <button onClick={() => loginWithRedirect()}>Login</button>
      </div>
    );
  }

  return (
    <div className="purchases-container">
      <h2>My Purchases</h2>
      
      {error && <p className="error">{error}</p>}
      
      {purchases.length > 0 ? (
        <div className="purchases-list">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td>
                    <Link to={`/stocks/${purchase.symbol}`}>
                      {purchase.symbol}
                    </Link>
                  </td>
                  <td>{purchase.short_name}</td>
                  <td>{purchase.quantity}</td>
                  <td>${purchase.price.toFixed(2)}</td>
                  <td>${(purchase.price * purchase.quantity).toFixed(2)}</td>
                  <td>{new Date(purchase.created_at).toLocaleString()}</td>
                  <td className={getStatusClass(purchase.status)}>
                    {purchase.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>You haven't made any purchases yet</p>
      )}
      
      <div className="actions">
        <Link to="/stocks" className="button">
          Browse Stocks
        </Link>
      </div>
    </div>
  );
};

export default MyPurchases;