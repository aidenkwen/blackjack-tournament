import React from 'react';
import { useTournamentContext } from '../../context/TournamentContext';

const RealtimeStatus = () => {
  const { realtimeConnected } = useTournamentContext();
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '8px 16px',
      backgroundColor: realtimeConnected ? '#4CAF50' : '#f44336',
      color: 'white',
      borderRadius: '20px',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      zIndex: 1000
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: 'white',
        animation: realtimeConnected ? 'pulse 2s infinite' : 'none'
      }} />
      {realtimeConnected ? 'Live Updates Active' : 'Connecting...'}
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default RealtimeStatus;