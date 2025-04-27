import { useState, useEffect } from 'react';
import { getEvents } from '../api/apiService';

const EventLog = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState('ALL');

  useEffect(() => {
    fetchEvents();
  }, [page, eventType]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents(page, 25, eventType);
      setEvents(data.data || []);
      setError('');
    } catch (err) {
      setError('Error al cargar los eventos. Por favor, intenta de nuevo.');
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
    <div className="events-container">
      <h2>Registro de Eventos</h2>
      
      <div className="filters">
        <label>
          Tipo de evento:
          <select 
            value={eventType} 
            onChange={(e) => setEventType(e.target.value)}
            disabled={loading}
          >
            <option value="ALL">Todos</option>
            <option value="WALLET_DEPOSIT">Depósitos en billetera</option>
            <option value="PURCHASE_REQUEST">Solicitudes de compra</option>
            <option value="PURCHASE_VALIDATION">Validaciones de compra</option>
            <option value="EXTERNAL_PURCHASE">Compras externas</option>
          </select>
        </label>
      </div>
      
      {loading && <p>Cargando eventos...</p>}
      
      {error && <div className="error-message">{error}</div>}
      
      {!loading && events.length === 0 && !error && (
        <p>No hay eventos registrados</p>
      )}
      
      {events.length > 0 && (
        <div className="events-list">
          {events.map((event) => (
            <div key={event.id} className="event-card">
              <h3>{event.type}</h3>
              <p>Fecha: {new Date(event.created_at).toLocaleString()}</p>
              <pre>{JSON.stringify(event.details, null, 2)}</pre>
            </div>
          ))}
          
          <div className="pagination">
            <button onClick={handlePrevPage} disabled={page === 1 || loading}>
              Anterior
            </button>
            <span>Página {page}</span>
            <button onClick={handleNextPage} disabled={events.length < 25 || loading}>
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventLog;