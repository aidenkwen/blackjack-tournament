import React from 'react';

const PlayerInfoCard = ({ currentPlayer, activeTab, selectedRound }) => {
  const showEntryType = activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1');

  return (
    <div className="player-info-container">
      <p className="player-name-with-account">
        {currentPlayer.FirstName} {currentPlayer.LastName}<span className="account-part">, {currentPlayer.PlayerAccountNumber}</span>
      </p>
      {showEntryType && (
        <p className="player-metadata">
          Entry Type: {currentPlayer.EntryType}
        </p>
      )}
    </div>
  );
};

export default PlayerInfoCard;