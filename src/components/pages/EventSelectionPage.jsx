import React from 'react';
import { UC } from '../../utils/formatting';
import { useTournamentContext } from '../../context/TournamentContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const EventSelectionPage = () => {
  const navigate = useNavigate();
  const { 
    selectedEvent, setSelectedEvent, 
    employee, setEmployee, 
    tournaments, tournamentsLoading 
  } = useTournamentContext();

  const handleContinue = () => {
    if (!selectedEvent || !employee) {
      toast.error('Please select an event and enter an employee ID.');
      return;
    }
    navigate('/register');
  };

  const allEvents = tournaments.map(t => t.name);

  return (
    <div className="container">
      <h1 className="page-title select-event-title" style={{ marginTop: '40px' }}>
        Blackjack Tournament Registration
      </h1>
      
      <div className="form-group">
        <label className="mb-2">Select Event</label>
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="select-field"
        >
          <option value="">-- Select Event --</option>
          {allEvents.map((event) => (
            <option key={event} value={event}>
              {event}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label className="mb-2">Employee ID/Name</label>
        <input
          type="text"
          value={employee}
          onChange={(e) => setEmployee(UC(e.target.value))}
          className="input-field"
          placeholder="Enter Employee ID or Name"
        />
      </div>

      <div className="button-group">
        <button
          onClick={handleContinue}
          disabled={!selectedEvent || !employee || tournamentsLoading}
          className={`btn btn-primary ${
            !selectedEvent || !employee ? 'btn-disabled' : ''
          }`}
        >
          {tournamentsLoading ? 'Loading...' : 'Continue to Registration'}
        </button>
        
        <button
          onClick={() => navigate('/add-tournament')}
          className="btn btn-white-red"
        >
          Add Custom Tournament
        </button>

        <button
          onClick={() => navigate('/manage-tournaments')}
          className="btn btn-secondary"
        >
          Manage Tournaments
        </button>
      </div>
    </div>
  );
};

export default EventSelectionPage;