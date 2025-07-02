import React, { useState } from 'react';
import TablingManagement from './TablingManagement';

const ManageTournamentsPage = ({
  tournaments,
  deleteTournament,
  selectedEvent,
  registrations,
  setRegistrations,
  globalDisabledTables,
  setGlobalDisabledTables,
  onBack
}) => {
  const [selectedTournament, setSelectedTournament] = useState(null);

  const handleDeleteTournament = async (tournamentToDelete) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${tournamentToDelete.name}"?\n\nThis will also delete all players and registrations for this tournament.\n\nThis action cannot be undone.`
    );

    if (confirmDelete) {
      try {
        await deleteTournament(tournamentToDelete.id);
        alert(`Tournament "${tournamentToDelete.name}" deleted successfully.`);
      } catch (error) {
        alert(`Error deleting tournament: ${error.message}`);
      }
    }
  };

  const handleTournamentClick = (tournament) => {
    setSelectedTournament(tournament);
  };

  const handleBackToList = () => {
    setSelectedTournament(null);
  };

  if (selectedTournament) {
    return (
      <TablingManagement
        tournament={selectedTournament}
        registrations={registrations}
        setRegistrations={setRegistrations}
        globalDisabledTables={globalDisabledTables}
        setGlobalDisabledTables={setGlobalDisabledTables}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="container">
      <button onClick={onBack} className="link-back link-back-block">
        {'<'} Back to Event Selection
      </button>

      <h1 className="page-title">Manage Tournaments</h1>

      {tournaments.length === 0 ? (
        <p className="subheading">
          No custom tournaments yet.
        </p>
      ) : (
        <div>
          <p className="subheading">
            {tournaments.length} custom tournament{tournaments.length !== 1 ? 's' : ''}
          </p>

          {tournaments.map((tournament) => (
            <div
              key={tournament.id}
              className="card"
              style={{
                marginBottom: '12px',
                backgroundColor: selectedEvent === tournament.name ? '#f5f5f5' : '#f2f2f2',
                borderColor: selectedEvent === tournament.name ? '#8b0000' : '#d9d9d9',
                padding: '16px',
                cursor: 'default'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <p className="tournament-name">
                    {tournament.name}
                    {selectedEvent === tournament.name && (
                      <span style={{ color: '#8b0000', fontSize: '0.85rem', fontWeight: '600', marginLeft: '8px' }}>
                        (Currently Active)
                      </span>
                    )}
                  </p>
                  <p className="tournament-metadata">
                    Entry: ${tournament.entryCost} • Rebuy: ${tournament.rebuyCost} • Mulligan: ${tournament.mulliganCost}
                  </p>
                  {tournament.createdDate && (
                    <p className="tournament-metadata">
                      Created: {new Date(tournament.createdDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTournamentClick(tournament);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.9rem' }}
                  >
                    Manage Tournament
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedEvent === tournament.name) {
                        alert('Cannot delete the currently active tournament.');
                        return;
                      }
                      handleDeleteTournament(tournament);
                    }}
                    className="btn"
                    disabled={selectedEvent === tournament.name}
                    style={{ 
                      fontSize: '0.9rem',
                      backgroundColor: selectedEvent === tournament.name ? '#cccccc' : '#8b0000',
                      color: '#ffffff',
                      border: 'none',
                      cursor: selectedEvent === tournament.name ? 'not-allowed' : 'pointer',
                      opacity: selectedEvent === tournament.name ? 0.6 : 1
                    }}
                  >
                    Delete Tournament
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageTournamentsPage;