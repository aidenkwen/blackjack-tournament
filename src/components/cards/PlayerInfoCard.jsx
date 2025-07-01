import React from 'react';

const PlayerInfoCard = ({ currentPlayer, activeTab, selectedRound }) => {
  const showEntryType = activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1');

  return (
    <div style={{ marginBottom: '16px' }}>
      <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '4px' }}>
        {currentPlayer.FirstName} {currentPlayer.LastName}
      </p>
      {showEntryType && (
        <p style={{ margin: 0, color: '#666666', fontSize: '0.95rem' }}>
          Entry Type: {currentPlayer.EntryType}
        </p>
      )}
    </div>
  );
};

export default PlayerInfoCard;