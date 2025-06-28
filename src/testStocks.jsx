import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getStocks, getWalletBalance, buyStock } from "./api/apiService";
import { useNewRelicMonitoring } from './utils/newrelic';
import "./styles/stocks.css";

export default function TestStocks() {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [count, setCount] = useState(25);
    
    // Estados para compras
    const [purchaseLoading, setPurchaseLoading] = useState({});
    const [purchaseMessage, setPurchaseMessage] = useState('');
    
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
    const [showFilters, setShowFilters] = useState(false);

    // Estados para cantidades seleccionadas
    const [selectedQuantities, setSelectedQuantities] = useState({});
    const [userBalance, setUserBalance] = useState(() => {
        const saved = localStorage.getItem('walletBalance');
        return saved ? parseFloat(saved) : 0;
    });

    // Hook de New Relic
    const { trackStockPurchase, trackAPI, trackError, trackPageView } = useNewRelicMonitoring();

    useEffect(() => {
        // TRAZA FUNCIONAL 1: Trackear visualización de stocks (inicio del flujo)
        trackPageView('StocksListPage', performance.now());
        trackStockPurchase('view_stocks', {
            page: page,
            count: count,
            filtersApplied: Object.values(filters).some(f => f !== ''),
            stockCount: stocks.length
        });

        fetchStocks();
        fetchUserBalance();
    }, [page, count]);

    const fetchStocks = async (applyFilters = false) => {
        const startTime = Date.now();
        
        try {
            setLoading(true);
            
            // Si estamos aplicando filtros, volvemos a la página 1
            const currentPage = applyFilters ? 1 : page;
            if (applyFilters) {
                setPage(1);
            }
            
            // Construir parámetros de filtrado
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
            
            // Trackear llamada exitosa a API
            trackAPI('/stocks', 'GET', startTime, { ok: true, status: 200 }, null);
            
            setStocks(data.data || []);
            setError('');

            // TRAZA FUNCIONAL 1: Trackear stocks cargados exitosamente
            trackStockPurchase('view_stocks', {
                page: currentPage,
                count: count,
                filtersApplied: applyFilters,
                stockCount: data.data?.length || 0,
                success: true,
                duration: Date.now() - startTime
            });
            
        } catch (err) {
            // Trackear error en API
            trackAPI('/stocks', 'GET', startTime, null, err);
            trackError('fetch_stocks_error', err.message, {
                page: page,
                count: count,
                filtersApplied: applyFilters
            });
            
            setError('Error al cargar los stocks. Por favor, intenta de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserBalance = async () => {
        const startTime = Date.now();
        
        try {
            console.log('📡 testStocks - Llamando a getWalletBalance()...');
            const data = await getWalletBalance();
            
            // Trackear llamada exitosa a API
            trackAPI('/wallet/balance', 'GET', startTime, { ok: true, status: 200 }, null);
            
            console.log('✅ testStocks - Respuesta:', data);
            const balance = data.balance || 0;
            console.log('💰 testStocks - Actualizando balance a:', balance);
            setUserBalance(balance);
            localStorage.setItem('walletBalance', balance.toString());
        } catch (error) {
            // Trackear error en API
            trackAPI('/wallet/balance', 'GET', startTime, null, error);
            trackError('fetch_balance_error', error.message);
            
            console.error('❌ testStocks - Error al obtener saldo:', error);
        }
    };

    // Función mejorada para manejar selección de stock
    const handleStockSelection = (stock) => {
        // TRAZA FUNCIONAL 1: Trackear selección de stock específico
        trackStockPurchase('select_stock', {
            symbol: stock.symbol,
            price: stock.price,
            availableQuantity: stock.quantity,
            stockName: stock.long_name
        });
    };

    // Función mejorada para manejar cambio de cantidad
    const handleQuantityChange = (symbol, quantity) => {
        setSelectedQuantities(prev => ({
            ...prev,
            [symbol]: quantity
        }));

        // TRAZA FUNCIONAL 1: Trackear configuración de cantidad
        const stock = stocks.find(s => s.symbol === symbol);
        if (stock) {
            trackStockPurchase('set_quantity', {
                symbol: symbol,
                quantity: quantity,
                totalCost: stock.price * quantity,
                userBalance: userBalance,
                stockPrice: stock.price
            });
        }
    };

    // Función principal de compra con tracking completo
    const handlePurchase = async (stock) => {
        const startTime = Date.now();
        const quantity = selectedQuantities[stock.symbol] || 1;
        const totalCost = stock.price * quantity;
        
        // TRAZA FUNCIONAL 1: Trackear inicio de validación
        trackStockPurchase('validate_purchase', {
            symbol: stock.symbol,
            quantity: quantity,
            totalCost: totalCost,
            userBalance: userBalance,
            availableStock: stock.quantity
        });
        
        // Validaciones con tracking específico
        if (quantity > stock.quantity) {
            const errorMsg = `Solo hay ${stock.quantity} acciones disponibles de ${stock.symbol}`;
            
            // Trackear error de validación
            trackStockPurchase('purchase_error', {
                symbol: stock.symbol,
                quantity: quantity,
                errorType: 'insufficient_stock',
                errorMessage: errorMsg,
                duration: Date.now() - startTime
            });
            
            setPurchaseMessage(`❌ ${errorMsg}`);
            setTimeout(() => setPurchaseMessage(''), 5000);
            return;
        }

        if (userBalance < totalCost) {
            const errorMsg = `Saldo insuficiente. Necesitas $${totalCost.toLocaleString()} pero tienes $${userBalance.toLocaleString()}`;
            
            // Trackear error de validación
            trackStockPurchase('purchase_error', {
                symbol: stock.symbol,
                quantity: quantity,
                errorType: 'insufficient_funds',
                errorMessage: errorMsg,
                requiredAmount: totalCost,
                availableBalance: userBalance,
                duration: Date.now() - startTime
            });
            
            setPurchaseMessage(`❌ ${errorMsg}`);
            setTimeout(() => setPurchaseMessage(''), 5000);
            return;
        }

        setPurchaseLoading(prev => ({ ...prev, [stock.symbol]: true }));
        setPurchaseMessage('');

        // TRAZA FUNCIONAL 1: Trackear ejecución de compra
        trackStockPurchase('execute_purchase', {
            symbol: stock.symbol,
            quantity: quantity,
            totalCost: totalCost,
            userBalance: userBalance
        });

        try {
            const apiStartTime = Date.now();
            const result = await buyStock(stock.symbol, quantity);
            
            // Trackear llamada exitosa a API de compra
            trackAPI('/stocks/buy', 'POST', apiStartTime, { ok: true, status: 200 }, null);
            
            if (result.requiresPayment && result.webpayUrl) {
                // Si requiere pago con WebPay, redirigir
                window.location.href = result.webpayUrl;
                return;
            } else {
                // Actualizar saldo local
                setUserBalance(prev => prev - totalCost);
                
                // Resetear cantidad seleccionada
                setSelectedQuantities(prev => ({
                    ...prev,
                    [stock.symbol]: 1
                }));
                
                // TRAZA FUNCIONAL 1: Trackear compra exitosa
                trackStockPurchase('purchase_success', {
                    symbol: stock.symbol,
                    quantity: quantity,
                    totalCost: totalCost,
                    requestId: result.request_id,
                    newBalance: userBalance - totalCost,
                    duration: Date.now() - startTime
                });
                
                setPurchaseMessage(
                    `✅ Compra exitosa: ${quantity} acciones de ${stock.symbol} por $${totalCost.toLocaleString()}`
                );
                
                setTimeout(() => {
                    fetchStocks();
                    fetchUserBalance();
                    setPurchaseMessage('');
                }, 2000);
            }
        } catch (error) {
            // Trackear error en API de compra
            trackAPI('/stocks/buy', 'POST', Date.now(), null, error);
            
            // Trackear error de compra
            trackStockPurchase('purchase_error', {
                symbol: stock.symbol,
                quantity: quantity,
                errorType: 'api_error',
                errorMessage: error.message,
                duration: Date.now() - startTime
            });
            
            console.error('Error en compra:', error);
            setPurchaseMessage(`❌ Error de conexión: ${error.message}`);
            setTimeout(() => setPurchaseMessage(''), 5000);
        } finally {
            setPurchaseLoading(prev => ({ ...prev, [stock.symbol]: false }));
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
        
        // Trackear aplicación de filtros
        trackStockPurchase('view_stocks', {
            action: 'filters_applied',
            filters: filters,
            hasSymbolFilter: !!filters.symbol,
            hasPriceFilter: !!(filters.minPrice || filters.maxPrice),
            hasQuantityFilter: !!(filters.minQuantity || filters.maxQuantity)
        });
        
        fetchStocks(true);
    };
    
    const handleResetFilters = () => {
        // Trackear reset de filtros
        trackStockPurchase('view_stocks', {
            action: 'filters_reset'
        });
        
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

    return (
        <div className="stocks-container">
            <h2>📈 Listado de Stocks Disponibles</h2>
            
            {/* Mensaje de compras */}
            {purchaseMessage && (
                <div className={`purchase-message ${purchaseMessage.includes('✅') ? 'success' : 'error'}`}>
                    {purchaseMessage}
                </div>
            )}
            
            {/* Sección de billetera */}
            <div className="wallet-section" style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                margin: '15px 0',
                border: '1px solid #dee2e6'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: '0 0 5px 0', color: '#495057' }}>💳 Mi Billetera</h3>
                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                            Saldo disponible: ${userBalance.toLocaleString()}
                        </p>
                    </div>
                    <Link to="/wallet" className="button" style={{ textDecoration: 'none' }}>
                        Gestionar Billetera
                    </Link>
                </div>
            </div>
            
            {/* Sección de filtros */}
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
                                <th>🛒 Comprar</th>
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
                                    
                                    <td>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '4px',
                                            alignItems: 'center'
                                        }}>
                                            <button
                                                className="view-button"
                                                onClick={() => {
                                                    handleStockSelection(stock);
                                                    handlePurchase(stock);
                                                }}
                                                disabled={purchaseLoading[stock.symbol] || stock.quantity === 0 || userBalance < (stock.price * (selectedQuantities[stock.symbol] || 1))}
                                                title={`Comprar ${selectedQuantities[stock.symbol] || 1} acciones de ${stock.symbol}`}
                                            >
                                                {purchaseLoading[stock.symbol] ? '⏳' : `🛒 ${selectedQuantities[stock.symbol] || 1}`}
                                            </button>
                                            
                                            <select 
                                                value={selectedQuantities[stock.symbol] || 1}
                                                onChange={(e) => handleQuantityChange(stock.symbol, parseInt(e.target.value))}
                                                disabled={purchaseLoading[stock.symbol] || stock.quantity === 0}
                                                style={{
                                                    padding: '3px 6px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    minWidth: '45px'
                                                }}
                                            >
                                                {Array.from({ length: Math.min(stock.quantity, 50) }, (_, i) => i + 1).map(num => (
                                                    <option key={num} value={num}>{num}</option>
                                                ))}
                                            </select>
                                            
                                            {stock.quantity === 0 && (
                                                <span style={{ fontSize: '10px', color: 'red' }}>Sin stock</span>
                                            )}
                                            
                                            {userBalance < (stock.price * (selectedQuantities[stock.symbol] || 1)) && (
                                                <span style={{ fontSize: '10px', color: 'orange' }}>Saldo insuficiente</span>
                                            )}
                                        </div>
                                    </td>

                                    <td>${stock.price.toLocaleString()}</td>
                                    <td>{stock.quantity}</td>
                                    <td>{new Date(stock.timestamp).toLocaleDateString()}</td>
                                    <td>
                                        <Link 
                                            to={`/stocks/${stock.symbol}`} 
                                            className="view-button"
                                            onClick={() => handleStockSelection(stock)}
                                        >
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