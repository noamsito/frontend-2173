import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStocks } from "./api/apiService";

export default function TestStocks() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [count, setCount] = useState(25);

    useEffect(() => {
        fetchStocks();
    }, [page, count]);

    const fetchStocks = async () => {
        try {
            setLoading(true);
            const data = await getStocks(page, count);
            setStocks(data.data || []);
            setError('');
        } catch (err) {
            setError('Error al cargar los stocks. Por favor, intenta de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    const handleNextPage = () => {
        setPage(page + 1);
    };

    return (
        <div className="stocks-container">
            <h2>Listado de Stocks Disponibles</h2>
            
            {loading && <p>Cargando stocks...</p>}
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="filters">
                <label>
                    Items por página:
                    <select 
                        value={count} 
                        onChange={(e) => setCount(parseInt(e.target.value))}
                        disabled={loading}
                    >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </label>
            </div>
            
            {!loading && stocks.length === 0 && !error && (
                <p>No hay stocks disponibles</p>
            )}
            
            {stocks.length > 0 && (
                <div className="stocks-list">
                    <table>
                        <thead>
                            <tr>
                                <th>Símbolo</th>
                                <th>Nombre</th>
                                <th>Precio</th>
                                <th>Cantidad</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stocks.map((stock) => (
                                <tr key={stock.id}>
                                    <td>{stock.symbol}</td>
                                    <td>{stock.long_name}</td>
                                    <td>${stock.price}</td>
                                    <td>{stock.quantity}</td>
                                    <td>
                                        <Link to={`/stocks/${stock.symbol}`} className="view-button">
                                            Ver detalles
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="pagination">
                        <button onClick={handlePrevPage} disabled={page === 1 || loading}>
                            Anterior
                        </button>
                        <span>Página {page}</span>
                        <button onClick={handleNextPage} disabled={stocks.length < count || loading}>
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
            
            <button onClick={fetchStocks} disabled={loading} className="refresh-button">
                Actualizar
            </button>
        </div>
    );
}