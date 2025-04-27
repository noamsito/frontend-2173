// src/pages/EventLog.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth0Client } from '../auth0-config';
import { useAuth0 } from '@auth0/auth0-react';

const API_URL = import.meta.env.VITE_API_URL;

const EventLog = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, page]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(
        `${API_URL}/events?page=${page}&count=25`,
        { headers }
      );
      
      const newEvents = response.data.data || [];
      
      if (newEvents.length < 25) {
        setHasMore(false);
      }
      
      if (page === 1) {
        setEvents(newEvents);
      } else {
        setEvents(prev => [...prev, ...newEvents]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load event log");
    } finally {
      setLoading(false);
    }
  };

  const getToken = async () => {
    try {
      const auth0 = await getAuth0Client();
      return await auth0.getTokenSilently();
    } catch (error) {
      console.error("Error obtaining token:", error);
      return null;
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'STOCK_UPDATE': return '📊';
      case 'IPO': return '🚀';
      case 'EMIT': return '🔄';
      case 'PURCHASE_REQUEST': return '🛒';
      default: return '📝';
    }
  };

  if (loading && page === 1) return <div>Loading event log...</div>;

  if (!isAuthenticated) {
    return (
      <div className="event-log-container">
        <h2>Event Log</h2>
        <p>Please log in to view the event log</p>
        <button onClick={() => loginWithRedirect()}>Login</button>
      </div>
    );
  }

  return (
    <div className="event-log-container">
      <h2>Event Log</h2>
      
      {error && <p className="error">{error}</p>}
      
      {events.length > 0 ? (
        <>
          <ul className="event-list">
            {events.map((event, index) => (
              <li key={index} className={`event-item event-${event.type.toLowerCase()}`}>
                <div className="event-icon">{getEventIcon(event.type)}</div>
                <div className="event-content">
                  <h4>{event.type}</h4>
                  <p className="event-time">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                  <pre className="event-details">
                    {JSON.stringify(event.details, null, 2)}
                  </pre>
                </div>
              </li>
            ))}
          </ul>
          
          {hasMore && (
            <button 
              className="load-more" 
              onClick={() => setPage(prev => prev + 1)}
              disabled={loading}
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          )}
        </>
      ) : (
        <p>No events recorded yet</p>
      )}
    </div>
  );
};

export default EventLog;