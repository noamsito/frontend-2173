import React, { useState, useEffect } from 'react';

const SystemStatus = () => {
  const [status, setStatus] = useState({
    total: 0,
    processed: 0,
    pending: 0,
    failed: 0,
    lastUpdate: null,
    isOnline: false
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/purchases/stats`);
        
        if (response.ok) {
          const data = await response.json();
          setStatus({
            ...data,
            lastUpdate: new Date(),
            isOnline: true
          });
        } else {
          setStatus(prev => ({ ...prev, isOnline: false }));
        }
      } catch (error) {
        console.error('Error fetching system status:', error);
        setStatus(prev => ({ ...prev, isOnline: false }));
      }
    };

    // Fetch inicial
    fetchStatus();

    // Heartbeat cada 5 segundos
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (!status.isOnline) return '#ef4444'; // Red
    if (status.failed > 0) return '#f59e0b'; // Yellow
    return '#10b981'; // Green
  };

  const getStatusText = () => {
    if (!status.isOnline) return 'Sistema Desconectado';
    if (status.failed > 0) return 'Sistema con Errores';
    return 'Sistema Operativo';
  };

  return (
    <div className="system-status">
      <div className="status-header">
        <h3>Estado del Sistema</h3>
        <div className="status-indicator-container">
          <div 
            className="status-indicator" 
            style={{ backgroundColor: getStatusColor() }}
          ></div>
          <span 
            className="status-text"
            style={{ color: getStatusColor() }}
          >
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-number">{status.total}</div>
          <div className="stat-label">Total</div>
        </div>
        
        <div className="stat-card processed">
          <div className="stat-number">{status.processed}</div>
          <div className="stat-label">Procesadas</div>
        </div>
        
        <div className="stat-card pending">
          <div className="stat-number">{status.pending}</div>
          <div className="stat-label">Pendientes</div>
        </div>
        
        <div className="stat-card failed">
          <div className="stat-number">{status.failed}</div>
          <div className="stat-label">Fallidas</div>
        </div>
      </div>

      {status.lastUpdate && (
        <div className="last-update">
          Última actualización: {status.lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default SystemStatus;