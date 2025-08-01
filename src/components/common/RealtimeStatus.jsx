import React, { useState, useEffect } from 'react';
import { useTournamentContext } from '../../context/TournamentContext';

const RealtimeStatus = () => {
  const { realtimeConnected, connectionStatus } = useTournamentContext();
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenConnected, setHasBeenConnected] = useState(false);
  
  // Hide the indicator after stable connection
  useEffect(() => {
    if (realtimeConnected && !hasBeenConnected) {
      setHasBeenConnected(true);
      // Hide after 3 seconds of stable connection
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    // Show again if connection lost
    if (!realtimeConnected && hasBeenConnected) {
      setIsVisible(true);
    }
  }, [realtimeConnected, hasBeenConnected]);
  
  // Don't render if hidden (after stable connection)
  if (!isVisible && realtimeConnected) {
    return null;
  }
  
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'error': return '#f44336';
      default: return '#ff9800'; // orange for connecting
    }
  };
  
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live Updates Active';
      case 'error': return 'Offline Mode (Auto-Refresh Active)';
      default: return 'Connecting...';
    }
  };
  
  const handleClick = () => {
    // Disabled - refresh loses event context
    return;
  };
  
  return (
    <div 
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '8px 16px',
        backgroundColor: getStatusColor(),
        color: 'white',
        borderRadius: '20px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        opacity: isVisible ? 1 : 0,
        transform: `translateY(${isVisible ? '0' : '20px'})`,
        cursor: 'default',
        userSelect: 'none'
      }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: 'white',
        animation: connectionStatus === 'connected' ? 'pulse 2s infinite' : 
                   connectionStatus === 'connecting' ? 'spin 1s linear infinite' : 'none'
      }} />
      {getStatusText()}
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RealtimeStatus;