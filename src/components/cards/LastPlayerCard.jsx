import React from 'react';

const LastPlayerCard = ({ lastPlayer, showSeatingInfo = false }) => {
  if (!lastPlayer) return null;

  return (
    <div className="card last-added">
      <h3 className="card-title">Last Added ({lastPlayer.roundContext})</h3>
      <div className="card-content">
        <p className="last-added-line">{lastPlayer.name}, {lastPlayer.accountNumber}</p>
        <p className="last-added-line">{lastPlayer.purchases}</p>
        {showSeatingInfo && lastPlayer.seatingInfo && (
          <p className="last-added-line">
            {lastPlayer.seatingInfo}
          </p>
        )}
      </div>
    </div>
  );
};

export default LastPlayerCard;