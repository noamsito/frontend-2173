import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getStocksbySymbol } from '../api/stocks';

const StockDetail = () => {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const data = await getStocksbySymbol(symbol);
        setStock(data.data);
      } catch (error) {
        console.error("Error fetching stock details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [symbol]);

  if (loading) return <div>Cargando detalles...</div>;
  
  if (!stock || stock.length === 0) return <div>No se encontraron datos para {symbol}</div>;

  return (
    <div>
      <h2>Detalles de {symbol}</h2>
      <div className="stock-details">
        <h3>{stock[0].short_name}</h3>
        <p>Precio actual: ${stock[0].price}</p>
        <p>Nombre completo: {stock[0].long_name}</p>
        <p>Cantidad disponible: {stock[0].quantity}</p>
        <p>Última actualización: {new Date(stock[0].timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default StockDetail;