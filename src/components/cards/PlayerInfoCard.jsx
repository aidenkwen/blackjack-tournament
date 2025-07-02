import React from 'react';

const PlayerInfoCard = ({ currentPlayer }) => {
  // FIX: The 'rounds' array and 'getRoundName' function have been removed as they are no longer needed.

  return (
    <div className="player-info-container">
      <h3 className="player-name-with-account">
        {currentPlayer.firstName} {currentPlayer.lastName}
        <span className="account-part">, {currentPlayer.playerAccountNumber}</span>
      </h3>
      <p className="player-metadata">
        {/* FIX: Removed the "Registering for" text. */}
        Entry Type: {currentPlayer.entryType}
      </p>
    </div>
  );
};

export default PlayerInfoCard;