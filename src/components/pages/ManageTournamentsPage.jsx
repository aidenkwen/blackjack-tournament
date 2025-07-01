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
                cursor: 'default' // Remove pointer cursor since clicking is handled by buttons
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {tournament.name}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#666666', fontSize: '0.9rem' }}>
                    Entry: ${tournament.entryCost} • Rebuy: ${tournament.rebuyCost} • Mulligan: ${tournament.mulliganCost}
                  </p>
                  {tournament.createdDate && (
                    <p style={{ margin: '4px 0 0 0', color: '#999999', fontSize: '0.8rem' }}>
                      Created: {new Date(tournament.createdDate).toLocaleDateString()}
                    </p>
                  )}
                  {selectedEvent === tournament.name && (
                    <p style={{ margin: '4px 0 0 0', color: '#8b0000', fontSize: '0.85rem', fontWeight: '600' }}>
                      ✓ Currently Active
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
                    Manage Tabling
                  </button>
                  
                  {selectedEvent !== tournament.name && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTournament(tournament);
                      }}
                      className="btn"
                      style={{ 
                        fontSize: '0.9rem',
                        backgroundColor: '#8b0000',
                        color: '#ffffff',
                        border: 'none'
                      }}
                    >
                      Delete Tournament
                    </button>
                  )}
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