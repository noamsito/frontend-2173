import { useState, useEffect } from 'react';
import { getEvents } from '../api/apiService';
import '../styles/EventLog.css';

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

  // Obtener el ícono según el tipo de evento
  const getEventIcon = (type) => {
    switch(type) {
      case 'IPO': return '🚀';
      case 'EMIT': return '📈';
      case 'PURCHASE_VALIDATION': return '✅';
      case 'EXTERNAL_PURCHASE': return '🌐';
      default: return '📝';
    }
  };

  return (
    <div className="event-log-container">
      <h2>Registro de Eventos</h2>
      
      <div className="event-filters">
        <label>
          Tipo de evento:
          <select 
            value={eventType} 
            onChange={(e) => setEventType(e.target.value)}
            disabled={loading}
          >
            <option value="ALL">Todos</option>
            <option value="IPO">Nuevas acciones (IPO)</option>
            <option value="EMIT">Emisiones adicionales</option>
            <option value="PURCHASE_VALIDATION">Compras exitosas</option>
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
            <div key={event.id} className="event-item" data-type={event.type}>
              <div className="event-icon">
                {getEventIcon(event.type)}
              </div>
              <div className="event-content">
                <div className="event-time">{event.formatted_date}</div>
                <div className="event-message">
                  {event.details.event_text || getDefaultEventText(event)}
                </div>
              </div>
            </div>
          ))}
          
          <div className="pagination">
            <button onClick={() => setPage(prev => Math.max(1, prev - 1))} disabled={page === 1 || loading}>
              Anterior
            </button>
            <span>Página {page}</span>
            <button onClick={() => setPage(prev => prev + 1)} disabled={events.length < 25 || loading}>
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Función para generar texto por defecto si no hay event_text
function getDefaultEventText(event) {
  const details = event.details;
  
  switch(event.type) {
    case 'IPO':
      return `Se realizó una IPO de ${details.quantity || ''} acciones de ${details.symbol || ''} (${details.long_name || ''}) a un precio de $${details.price || ''}`;
    
    case 'EMIT':
      return `Se realizó un EMIT de ${details.quantity || ''} acciones adicionales de ${details.symbol || ''} (${details.long_name || ''}) a un precio de $${details.price || ''}`;
    
    case 'PURCHASE_VALIDATION':
      if (details.status === 'ACCEPTED') {
        // Calcular el monto total si tenemos cantidad y precio
        const totalAmount = details.quantity && details.price 
          ? (details.quantity * details.price).toFixed(2)
          : 'desconocido';
        
        return `Compraste ${details.quantity || ''} acciones de ${details.symbol || ''} por un total de $${totalAmount}`;
      }
      return '';
    
    case 'EXTERNAL_PURCHASE':
      return `El grupo ${details.group_id || ''} compró ${details.quantity || ''} acciones de ${details.symbol || ''}`;
    
    default:
      return details.event_text || JSON.stringify(details);
  }
}

export default EventLog;