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
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    if (isAuthenticated) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, page, filter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const filterParam = filter !== 'ALL' ? `&type=${filter}` : '';
      const response = await axios.get(
        `${API_URL}/events?page=${page}&count=25${filterParam}`,
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
      case 'UPDATE': return '📊';
      case 'IPO': return '🚀';
      case 'EMIT': return '🔄';
      case 'PURCHASE_REQUEST': return '🛒';
      case 'ACCEPTED': return '✅';
      case 'REJECTED': return '❌';
      default: return '📝';
    }
  };

  const formatEventDetails = (event) => {
    const { type, details } = event;
    
    switch (type) {
      case 'IPO':
        return (
          <div>
            <p><strong>Symbol:</strong> {details.symbol}</p>
            <p><strong>Name:</strong> {details.shortName}</p>
            <p><strong>Price:</strong> ${details.price?.toFixed(2)}</p>
            <p><strong>Quantity:</strong> {details.quantity}</p>
          </div>
        );
      case 'EMIT':
        return (
          <div>
            <p><strong>Symbol:</strong> {details.symbol}</p>
            <p><strong>New Price:</strong> ${details.price?.toFixed(2)}</p>
            <p><strong>Added Quantity:</strong> {details.quantity}</p>
          </div>
        );
      case 'UPDATE':
        return (
          <div>
            <p><strong>Symbol:</strong> {details.symbol}</p>
            <p><strong>New Price:</strong> ${details.price?.toFixed(2)}</p>
          </div>
        );
      case 'PURCHASE_REQUEST':
        return (
          <div>
            <p><strong>Request ID:</strong> {details.request_id}</p>
            <p><strong>Symbol:</strong> {details.symbol}</p>
            <p><strong>Quantity:</strong> {details.quantity}</p>
            <p><strong>Status:</strong> {details.status || 'PENDING'}</p>
          </div>
        );
      default:
        return (
          <pre className="event-details">
            {JSON.stringify(details, null, 2)}
          </pre>
        );
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
      
      <div className="event-filters">
        <select 
          value={filter} 
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
            setHasMore(true);
          }}
        >
          <option value="ALL">All Events</option>
          <option value="IPO">IPO Events</option>
          <option value="EMIT">EMIT Events</option>
          <option value="UPDATE">Price Updates</option>
          <option value="PURCHASE_REQUEST">Purchase Requests</option>
        </select>
      </div>
      
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
                  {formatEventDetails(event)}
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