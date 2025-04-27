import { useState } from 'react';

const EventLog = () => {
  const [events, setEvents] = useState([]);

  return (
    <div>
      <h2>Registro de Eventos</h2>
      {events.length > 0 ? (
        <ul>
          {events.map((event, index) => (
            <li key={index}>
              Evento de ejemplo
            </li>
          ))}
        </ul>
      ) : (
        <p>No hay eventos registrados</p>
      )}
    </div>
  );
};

export default EventLog;