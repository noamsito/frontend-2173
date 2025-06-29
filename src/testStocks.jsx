import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { getStocks, updateResaleDiscount } from "./api/apiService";
import "./styles/stocks.css";

export default function TestStocks() {
    const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [count, setCount] = useState(25);
    
    // Estados para mensajes
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    
    // Estados para filtros
    const [filters, setFilters] = useState({
        symbol: '',
        name: '',
        minPrice: '',
        maxPrice: '',
        minQuantity: '',
        maxQuantity: '',
        date: ''
    });

    // Estados para edición de descuento
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [newDiscount, setNewDiscount] = useState('');
    const [updatingDiscount, setUpdatingDiscount] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const isAdmin = () => {
        return user && (
            user['https://stockmarket-api/roles']?.includes('admin') ||
            user.email === 'antonio@uc.cl'
        );
    };

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
        fetchStocks();
        }
    }, [page, count, isAuthenticated, isLoading]);

    const fetchStocks = async (applyFilters = false) => {
        try {
            if (!isAuthenticated) {
                setError('Debes iniciar sesión para ver los stocks');
                return;
            }

            setLoading(true);
            
            try {
                const token = await getAccessTokenSilently();
                console.log('🔑 DEBUG: Token obtenido en testStocks:', token ? 'SÍ' : 'NO');
            } catch (tokenError) {
                console.error('❌ DEBUG: Error obteniendo token:', tokenError);
            }
            
            const currentPage = applyFilters ? 1 : page;
            if (applyFilters) {
                setPage(1);
            }
            
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

    const showMessage = (text, type = 'info') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
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
        setTimeout(() => fetchStocks(true), 0);
    };

    // Funciones para manejo de descuento
    const handleDiscountEdit = (stock) => {
        setEditingDiscount(stock.symbol);
        setNewDiscount(stock.discount_info?.discount_percentage || '');
    };

    const handleDiscountCancel = () => {
        setEditingDiscount(null);
        setNewDiscount('');
    };

    const handleDiscountUpdate = async (stock) => {
        console.log('🔧 DEBUG: handleDiscountUpdate called');
        console.log('🔧 DEBUG: stock object:', stock);
        console.log('🔧 DEBUG: newDiscount:', newDiscount);
        if (!newDiscount || newDiscount < 0 || newDiscount > 10) {
            showMessage('El descuento debe estar entre 0% y 10%', 'error');
            return;
        }

        try {
            setUpdatingDiscount(true);
            
            // Extraer resale_id del símbolo (quitar el '_r')
            const resaleId = stock.purchase_id

            const result = await updateResaleDiscount(resaleId, parseFloat(newDiscount));
            
            showMessage(`Descuento actualizado: ${result.data.old_discount}% → ${result.data.new_discount}%`, 'success');
            
            // Actualizar la lista de stocks
            await fetchStocks();
            
            // Cerrar modal
            setEditingDiscount(null);
            setNewDiscount('');
            
        } catch (err) {
            showMessage(err.response?.data?.error || 'Error al actualizar descuento', 'error');
        } finally {
            setUpdatingDiscount(false);
        }
    };

    return (
        <div className="stocks-container">
            <div className="page-header">
                <h2>📈 Listado de Stocks Disponibles</h2>
                <p>Explora y compra acciones del mercado en tiempo real</p>
            </div>
            
            {message && (
                <div className={`message-banner ${messageType}`}>
                    {message}
                </div>
            )}
            
            <div className="filters-section">
                <div className="filters-header">
                    <div className="count-filter">
                        <label>
                            📊 Items por página:
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
                        disabled={loading}
                    >
                        {showFilters ? '🔒 Ocultar Filtros' : '🔍 Mostrar Filtros'}
                    </button>
                </div>
                
                {showFilters && (
                    <div className="advanced-filters">
                        <form onSubmit={handleApplyFilters}>
                            <div className="filters-grid">
                                <div className="filter-group">
                                    <label htmlFor="symbol">🏷️ Símbolo:</label>
                                    <input
                                        id="symbol"
                                        name="symbol"
                                        type="text"
                                        value={filters.symbol}
                                        onChange={handleFilterChange}
                                        placeholder="Ej: AAPL"
                                        disabled={loading}
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="name">🏢 Nombre:</label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={filters.name}
                                        onChange={handleFilterChange}
                                        placeholder="Ej: Apple Inc."
                                        disabled={loading}
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="minPrice">💰 Precio Mínimo:</label>
                                    <input
                                        id="minPrice"
                                        name="minPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={filters.minPrice}
                                        onChange={handleFilterChange}
                                        placeholder="Ej: 10.00"
                                        disabled={loading}
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="maxPrice">💸 Precio Máximo:</label>
                                    <input
                                        id="maxPrice"
                                        name="maxPrice"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={filters.maxPrice}
                                        onChange={handleFilterChange}
                                        placeholder="Ej: 100.00"
                                        disabled={loading}
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="minQuantity">📦 Cantidad Mínima:</label>
                                    <input
                                        id="minQuantity"
                                        name="minQuantity"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={filters.minQuantity}
                                        onChange={handleFilterChange}
                                        placeholder="Ej: 10"
                                        disabled={loading}
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="maxQuantity">📋 Cantidad Máxima:</label>
                                    <input
                                        id="maxQuantity"
                                        name="maxQuantity"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={filters.maxQuantity}
                                        onChange={handleFilterChange}
                                        placeholder="Ej: 1000"
                                        disabled={loading}
                                    />
                                </div>
                                
                                <div className="filter-group">
                                    <label htmlFor="date">📅 Fecha:</label>
                                    <input
                                        id="date"
                                        name="date"
                                        type="date"
                                        value={filters.date}
                                        onChange={handleFilterChange}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            
                            <div className="filter-actions">
                                <button 
                                    type="submit" 
                                    className="apply-filters-button"
                                    disabled={loading}
                                >
                                    ✅ Aplicar Filtros
                                </button>
                                <button
                                    type="button"
                                    className="reset-filters-button"
                                    onClick={handleResetFilters}
                                    disabled={loading}
                                >
                                    🔄 Limpiar Filtros
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
            
            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando stocks del mercado...</p>
                </div>
            )}
            
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}
            
            {!loading && stocks.length === 0 && !error && (
                <div className="empty-state">
                    <h3>📭 No hay stocks disponibles</h3>
                    <p>No se encontraron stocks con los filtros aplicados. Intenta modificar los criterios de búsqueda.</p>
                    <button 
                        onClick={handleResetFilters} 
                        className="btn btn-primary"
                    >
                        🔄 Resetear Filtros
                    </button>
                </div>
            )}
            
            {stocks.length > 0 && (
                <div className="stocks-list">
                    <div className="stocks-grid">
                        {stocks
                            .filter(stock => {
                                if (isAdmin()) {
                                    // Los admins ven todos los stocks
                                    return true;
                                } else {
                                    // Los usuarios normales solo ven reventas
                                    return stock.symbol.endsWith('_r');
                                }
                            })
                            
                            .map((stock) => (
                            
                            <div 
                                key={stock.symbol}  
                                className="stock-card"
                                data-resale={stock.symbol.endsWith('_r')}
                            >
                                <div className="stock-header">
                                    <div className="stock-symbol">{stock.symbol}</div>
                                    <div className="stock-price price-container">
                                        {stock.symbol.endsWith('_r') && stock.discount_info?.original_price && (
                                            <span className="original-price-crossed">
                                                ${stock.discount_info.original_price.toLocaleString()}
                                            </span>
                                        )}
                                        <span className="current-price">
                                            ${stock.price.toLocaleString()}
                                        </span>
                                        {stock.symbol.endsWith('_r') && stock.discount_info?.discount_percentage > 0 && (
                                            <span className="discount-badge">
                                                -{stock.discount_info.discount_percentage}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="stock-content">
                                    <h3 className="stock-name">{stock.long_name}</h3>
                                    
                                    <div className="stock-details">
                                        <div className="detail-row">
                                            <span className="label">📦 Cantidad disponible:</span>
                                            <span className="value">{stock.quantity.toLocaleString()}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">🕒 Última actualización:</span>
                                            <span className="value">
                                                {new Date(stock.timestamp).toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">💹 Valor de mercado:</span>
                                            <span className="value price-container">
                                                {/* Mostrar precio original del valor de mercado si es reventa */}
                                                {stock.symbol.endsWith('_r') && stock.discount_info?.original_price && (
                                                    <span className="original-price-crossed">
                                                        ${(stock.discount_info.original_price * stock.quantity).toLocaleString()}
                                                    </span>
                                                )}
                                                <span className="current-price">
                                                    ${(stock.price * stock.quantity).toLocaleString()}
                                                </span>
                                                {/* Badge de ahorro total */}
                                                {stock.symbol.endsWith('_r') && stock.discount_info?.original_price && (
                                                    <span className="savings-badge">
                                                        Ahorro: ${((stock.discount_info.original_price - stock.price) * stock.quantity).toLocaleString()}
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="stock-actions">
                                    <Link 
                                        to={`/stocks/${stock.symbol}`} 
                                        className="btn btn-success"
                                    >
                                        🛒 Comprar Acciones
                                    </Link>
                                    <Link 
                                        to={`/stocks/${stock.symbol}`} 
                                        className="btn btn-secondary"
                                    >
                                        📊 Ver Detalles
                                    </Link>

                                    {/* Botón de cambiar descuento solo para admins y reventas */}
                                    {isAdmin() && stock.symbol.endsWith('_r') && (
                                        <button
                                            onClick={() => handleDiscountEdit(stock)}
                                            className="btn btn-admin"
                                            disabled={editingDiscount === stock.symbol}
                                        >
                                            🔧 Cambiar Descuento
                                        </button>
                                    )}
                                </div>
                                {/* Modal de edición de descuento */}
                                {editingDiscount === stock.symbol && (
                                    <div className="discount-modal">
                                        <div className="discount-modal-content">
                                            <h4>💰 Cambiar Descuento</h4>
                                            <p>{stock.long_name}</p>
                                            <div className="discount-input-group">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    step="0.1"
                                                    value={newDiscount}
                                                    onChange={(e) => setNewDiscount(e.target.value)}
                                                    placeholder="% de descuento"
                                                    disabled={updatingDiscount}
                                                    autoFocus
                                                />
                                                <span className="discount-symbol">%</span>
                                            </div>
                                            <div className="discount-actions">
                                                <button
                                                    onClick={handleDiscountCancel}
                                                    className="btn btn-cancel"
                                                    disabled={updatingDiscount}
                                                >
                                                    ❌ Cancelar
                                                </button>
                                                <button
                                                    onClick={() => handleDiscountUpdate(stock)}
                                                    className="btn btn-confirm"
                                                    disabled={updatingDiscount || !newDiscount}
                                                >
                                                    {updatingDiscount ? '⏳ Actualizando...' : '✅ Cambiar'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <div className="pagination">
                        <button 
                            onClick={handlePrevPage} 
                            disabled={page === 1 || loading}
                            className="btn btn-secondary"
                        >
                            ← Anterior
                        </button>
                        <span className="page-info">
                            📄 Página {page} • {
                                stocks.filter(stock => isAdmin() || stock.symbol.endsWith('_r')).length
                            } elementos mostrados
                            {!isAdmin() && (
                                <span className="filter-info">
                                    {" "}(solo ofertas especiales)
                                </span>
                            )}
                        </span>
                        <button 
                            onClick={handleNextPage} 
                            disabled={stocks.length < count || loading}
                            className="btn btn-secondary"
                        >
                            Siguiente →
                        </button>
                    </div>
                </div>
            )}
            
            <div className="page-actions">
                <button 
                    onClick={() => fetchStocks()} 
                    disabled={loading} 
                    className="btn btn-outline"
                >
                    🔄 Actualizar Lista de Stocks
                </button>
            </div>
        </div>
    );
}