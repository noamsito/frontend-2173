import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStocks } from "./api/apiService";

export default function TestStocks() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [count, setCount] = useState(25);
    
    // Nuevos estados para filtros
    const [filters, setFilters] = useState({
        symbol: '',
        name: '',
        minPrice: '',
        maxPrice: '',
        minQuantity: '',
        maxQuantity: '',
        date: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchStocks();
    }, [page, count]);

    const fetchStocks = async (applyFilters = false) => {
        try {
            setLoading(true);
            
            // Si estamos aplicando filtros, volvemos a la página 1
            const currentPage = applyFilters ? 1 : page;
            if (applyFilters) {
                setPage(1);
            }
            
            // Construir parámetros de filtrado - Modificación para manejar valores vacíos mejor
            const params = {
                page: currentPage,
                count: count
            };
            
            // Solo agregar filtros si tienen valor
            if (filters.symbol.trim()) params.symbol = filters.symbol;
            if (filters.name.trim()) params.name = filters.name;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice) params.maxPrice = filters.maxPrice;
            if (filters.minQuantity) params.minQuantity = filters.minQuantity;
            if (filters.maxQuantity) params.maxQuantity = filters.maxQuantity;
            if (filters.date) params.date = filters.date;
            
            const data = await getStocks(params);
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
    
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleApplyFilters = (e) => {
        e.preventDefault();
        fetchStocks(true);
    };
    
    const handleResetFilters = () => {
        setFilters({
            symbol: '',
            name: '',
            minPrice: '',
            maxPrice: '',
            minQuantity: '',
            maxQuantity: '',
            date: ''
        });
        // Esperar al siguiente ciclo para que los inputs se actualicen
        setTimeout(() => fetchStocks(true), 0);
    };

    return (
        <div className="stocks-container">
            <h2>Listado de Stocks Disponibles</h2>
            
            <div className="filters-section">
                <div className="filters-header">
                    <div className="count-filter">
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
                    <button 
                        className="toggle-filters-button"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                    </button>
                </div>
                
                {showFilters && (
                    <div className="advanced-filters">
                        <form onSubmit={handleApplyFilters}>
                            <div className="filters-grid">
                                <div className="filter-group">
                                    <label htmlFor="symbol">Símbolo:</label>
                                    <input
                                        id="symbol"
                                        name="symbol"
                                        type="text"
                                        value={filters.symbol}
                                        onChange={handleFilterChange}
                                        placeholder="Ej: AAPL"
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="name">Nombre:</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={filters.name}
                                        onChange={handleFilterChange}
                                        placeholder="Ej: Apple Inc."
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="minPrice">Precio mínimo:</label>
                                    <input
                                        id="minPrice"
                                        name="minPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={filters.minPrice}
                                        onChange={handleFilterChange}
                                        placeholder="Ej: 10.00"
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="maxPrice">Precio máximo:</label>
                                    <input
                                        id="maxPrice"
                                        name="maxPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={filters.maxPrice}
                                        onChange={handleFilterChange}
                                        placeholder="Ej: 100.00"
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="minQuantity">Cantidad mínima:</label>
                                    <input
                                        id="minQuantity"
                                        name="minQuantity"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={filters.minQuantity}
                                        onChange={handleFilterChange}
                                        placeholder="Ej: 10"
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="maxQuantity">Cantidad máxima:</label>
                                    <input
                                        id="maxQuantity"
                                        name="maxQuantity"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={filters.maxQuantity}
                                        onChange={handleFilterChange}
                                        placeholder="Ej: 1000"
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="date">Fecha:</label>
                                    <input
                                        id="date"
                                        name="date"
                                        type="date"
                                        value={filters.date}
                                        onChange={handleFilterChange}
                                    />
                                </div>
                            </div>
                            
                            <div className="filter-actions">
                                <button 
                                    type="submit" 
                                    className="apply-filters-button"
                                    disabled={loading}
                                >
                                    Aplicar filtros
                                </button>
                                <button
                                    type="button"
                                    className="reset-filters-button"
                                    onClick={handleResetFilters}
                                    disabled={loading}
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
            
            {loading && <p>Cargando stocks...</p>}
            
            {error && <div className="error-message">{error}</div>}
            
            {!loading && stocks.length === 0 && !error && (
                <p>No hay stocks disponibles con los filtros aplicados</p>
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
                                <th>Fecha</th>
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
                                    <td>{new Date(stock.timestamp).toLocaleDateString()}</td>
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
            
            <button onClick={() => fetchStocks()} disabled={loading} className="refresh-button">
                Actualizar
            </button>
        </div>
    );
}