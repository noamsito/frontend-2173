import { useState, useEffect } from 'react';
import { getUserPurchases } from '../api/apiService';

const MyPurchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const data = await getUserPurchases();
      setPurchases(data.data || []);
      setError('');
    } catch (err) {
      setError('Error al cargar las compras. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear el estado de la compra
  const formatStatus = (status) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'ACCEPTED': return 'Aceptada';
      case 'REJECTED': return 'Rechazada';
      default: return status;
    }
  };

  return (
    <div className="purchases-container">
      <h2>Mis Compras</h2>
      
      {loading && <p>Cargando compras...</p>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && purchases.length === 0 && !error && (
        <p>No tienes compras registradas</p>
      )}
      
      {purchases.length > 0 && (
        <table className="purchases-table">
          <thead>
            <tr>
              <th>Símbolo</th>
              <th>Nombre</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((purchase) => (
              <tr key={purchase.id} className={`status-${purchase.status.toLowerCase()}`}>
                <td>{purchase.symbol}</td>
                <td>{purchase.long_name}</td>
                <td>{purchase.quantity}</td>
                <td>${purchase.price}</td>
                <td>${(purchase.price * purchase.quantity).toFixed(2)}</td>
                <td>{formatStatus(purchase.status)}</td>
                <td>{new Date(purchase.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <button onClick={fetchPurchases} disabled={loading}>
        Actualizar
      </button>
    </div>
  );
};

export default MyPurchases;