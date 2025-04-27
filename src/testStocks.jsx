// src/testStocks.jsx
import { useEffect, useState } from "react";
import { getStocks } from "./api/stocks";
import { Link } from "react-router-dom";

export default function TestStocks() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [count, setCount] = useState(25);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        setLoading(true);
        getStocks(page, count).then((data) => {
            console.log("Respuesta del backend:", data);
            setStocks(data.data || []);
            setLoading(false);
        });
    }, [page, count]);

    // Filtrar stocks por término de búsqueda
    const filteredStocks = stocks.filter(stock => 
        stock.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.short_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.long_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="stocks-container">
            <h2>Stocks disponibles</h2>
            
            <div className="search-filters">
                <input
                    type="text"
                    placeholder="Buscar por símbolo o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>
            
            <div className="pagination-controls">
                <select 
                    value={count} 
                    onChange={(e) => {
                        setCount(Number(e.target.value));
                        setPage(1); // Reset to page 1 when changing items per page
                    }}
                >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                </select>
                
                <div className="page-buttons">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || loading}
                    >
                        &laquo; Anterior
                    </button>
                    <span>Página {page}</span>
                    <button 
                        onClick={() => setPage(p => p + 1)}
                        disabled={filteredStocks.length < count || loading}
                    >
                        Siguiente &raquo;
                    </button>
                </div>
            </div>
            
            {loading ? (
                <p>Cargando stocks...</p>
            ) : (
                <div className="stocks-list">
                    <table>
                        <thead>
                            <tr>
                                <th>Símbolo</th>
                                <th>Nombre corto</th>
                                <th>Precio</th>
                                <th>Cantidad</th>
                                <th>Origen</th>
                                <th>Última actualización</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStocks.length > 0 ? (
                                filteredStocks.map((stock, i) => (
                                    <tr key={i}>
                                        <td>
                                            <Link to={`/stocks/${stock.symbol}`}>
                                                {stock.symbol}
                                            </Link>
                                        </td>
                                        <td>{stock.short_name}</td>
                                        <td>${stock.price?.toFixed(2) || 'N/A'}</td>
                                        <td>{stock.quantity}</td>
                                        <td>
                                            {stock.kind === "IPO" ? (
                                                <span className="tag tag-ipo">IPO</span>
                                            ) : stock.kind === "EMIT" ? (
                                                <span className="tag tag-emit">EMIT</span>
                                            ) : (
                                                <span className="tag tag-regular">Regular</span>
                                            )}
                                        </td>
                                        <td>{new Date(stock.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">No se encontraron stocks</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}