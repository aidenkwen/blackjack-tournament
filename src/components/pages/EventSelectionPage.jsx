
import React from 'react';
import { UC } from '../../utils/formatting';

const EventSelectionPage = ({
  selectedEvent,
  setSelectedEvent,
  employee,
  setEmployee,
  tournaments,
  onContinue,
  onAddTournament,
  onManageTournaments
}) => {
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
          onClick={onContinue}
          disabled={!selectedEvent || !employee}
          className={`btn btn-primary ${
            !selectedEvent || !employee ? 'btn-disabled' : ''
          }`}
        >
          Continue to Registration
        </button>
        
        <button
          onClick={onAddTournament}
          className="btn btn-white-red"
        >
          Add Custom Tournament
        </button>

        <button
          onClick={onManageTournaments}
          className="btn btn-secondary"
        >
          Manage Tournaments
        </button>
      </div>
    </div>
  );
};

export default EventSelectionPage;