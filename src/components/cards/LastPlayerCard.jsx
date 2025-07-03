import React from 'react';

const LastPlayerCard = ({ lastPlayer, showSeatingInfo = false }) => {
  if (!lastPlayer) return null;

  return (
    <div className="card last-added" style={{ marginBottom: '16px' }}>
      <h3 className="card-title">Last Added ({lastPlayer.roundContext})</h3>
      <div className="card-content">
        <p className="last-added-line player-name-with-account compact">
          {lastPlayer.name}<span className="account-part">, {lastPlayer.playerAccountNumber}</span>
        </p>
        <p className="last-added-line player-metadata">{lastPlayer.purchases}</p>
        {showSeatingInfo && lastPlayer.seatingInfo && (
          <p className="last-added-line player-metadata">
            {lastPlayer.seatingInfo}
          </p>
        )}
      </div>
    </div>
  );
};

export default LastPlayerCard;