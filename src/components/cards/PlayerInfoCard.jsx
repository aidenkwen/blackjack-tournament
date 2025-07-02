import React from 'react';

const PlayerInfoCard = ({ currentPlayer, activeTab, selectedRound }) => {
  const rounds = [
    { key: 'round1', name: 'Round 1' },
    { key: 'rebuy1', name: 'Rebuy 1' },
    { key: 'rebuy2', name: 'Rebuy 2' },
    { key: 'round2', name: 'Round 2' },
    { key: 'superrebuy', name: 'Super Rebuy' },
    { key: 'quarterfinals', name: 'Quarterfinals' },
    { key: 'semifinals', name: 'Semifinals' }
  ];

  const getRoundName = () => {
    if (activeTab === 'registration') {
      return 'Round 1';
    }
    const round = rounds.find(r => r.key === selectedRound);
    return round ? round.name : selectedRound;
  };

  return (
    <div className="player-info-container">
      <h3 className="player-name-with-account">
        {currentPlayer.firstName} {currentPlayer.lastName}
        <span className="account-part">, {currentPlayer.playerAccountNumber}</span>
      </h3>
    </div>
  );
};

export default PlayerInfoCard;