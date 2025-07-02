import React from 'react';
import { useTournamentContext } from '../../context/TournamentContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ManageTournamentsPage = () => {
  const navigate = useNavigate();
  const { tournaments, deleteTournament, selectedEvent, setSelectedEvent } = useTournamentContext();

  const handleDeleteTournament = async (tournamentToDelete) => {
    if (selectedEvent === tournamentToDelete.name) {
      toast.error('Cannot delete the currently active tournament. Please select a different event first.');
      return;
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${tournamentToDelete.name}"? This will delete all associated players and registrations. This action cannot be undone.`
    );
    if (confirmDelete) {
      try {
        await deleteTournament(tournamentToDelete.id);
        toast.success(`Tournament "${tournamentToDelete.name}" deleted successfully.`);
      } catch (error) {
        toast.error(`Error deleting tournament: ${error.message}`);
      }
    }
  };

  const handleManageClick = (tournament) => {
    setSelectedEvent(tournament.name);
    navigate('/tabling');
  };

  return (
    <div className="container">
      <button onClick={() => navigate('/')} className="link-back link-back-block">
        {'<'} Back to Event Selection
      </button>

      <h1 className="page-title">Manage Tournaments</h1>

      {tournaments.length === 0 ? (
        <p className="subheading">No custom tournaments yet.</p>
      ) : (
        <div>
          <p className="subheading">
            {tournaments.length} custom tournament{tournaments.length !== 1 ? 's' : ''}
          </p>

          {tournaments.map((tournament) => (
            <div key={tournament.id} className="card" style={{ /* ... */ }}>
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
                  {tournament.createdAt && (
                    <p className="tournament-metadata">
                      Created: {new Date(tournament.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button onClick={() => handleManageClick(tournament)} className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
                    Manage Seating
                  </button>
                  <button onClick={() => handleDeleteTournament(tournament)} className="btn" disabled={selectedEvent === tournament.name} style={{ /* ... */ }}>
                    Delete
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