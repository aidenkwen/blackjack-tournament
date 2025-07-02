import React, { useState } from 'react';

const TablingPage = ({ 
  selectedEvent, 
  tournaments, 
  registrations, 
  setRegistrations, 
  setCurrentPage,
  globalDisabledTables,
  setGlobalDisabledTables
}) => {
  const [selectedRound, setSelectedRound] = useState('round1');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(1);

  const rounds = [
    { key: 'round1', name: 'Round 1', timeSlots: 6 },
    { key: 'rebuy1', name: 'Rebuy 1', timeSlots: 2 },
    { key: 'rebuy2', name: 'Rebuy 2', timeSlots: 1 },
    { key: 'round2', name: 'Round 2', timeSlots: 3 },
    { key: 'superrebuy', name: 'Super Rebuy', timeSlots: 2 },
    { key: 'quarterfinals', name: 'Quarterfinals', timeSlots: 2 },
    { key: 'semifinals', name: 'Semifinals', timeSlots: 1 }
  ];

  const currentRound = rounds.find(r => r.key === selectedRound);
  const availableTimeSlots = Array.from({ length: currentRound?.timeSlots || 1 }, (_, i) => i + 1);

  const getDisabledKey = (round, timeSlot, tableNumber) => `${selectedEvent}-${round}-${timeSlot}-${tableNumber}`;

  const toggleTable = (tableNumber) => {
    const hasPlayers = [1, 2, 3, 4, 5, 6].some(seat => getPlayerAtSeat(tableNumber, seat));
    if (hasPlayers) {
      alert('Cannot disable table - players are currently seated at this table.');
      return;
    }
    const key = getDisabledKey(selectedRound, selectedTimeSlot, tableNumber);
    setGlobalDisabledTables(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isTableDisabled = (tableNumber) => {
    if (selectedRound === 'semifinals' && tableNumber === 6) return true;
    const key = getDisabledKey(selectedRound, selectedTimeSlot, tableNumber);
    return globalDisabledTables[key] || false;
  };

  const getSeatedPlayers = () => {
    return registrations.filter(r => r.eventName === selectedEvent && r.round === selectedRound && r.timeSlot === selectedTimeSlot && r.tableNumber && r.seatNumber);
  };

  const getPlayerAtSeat = (tableNumber, seatNumber) => {
    return registrations.find(r => r.eventName === selectedEvent && r.round === selectedRound && r.timeSlot === selectedTimeSlot && r.tableNumber === tableNumber && r.seatNumber === seatNumber);
  };

  return (
    <div className="container">
      <button onClick={() => setCurrentPage(1)} className="link-back link-back-block">{'<'} Back to Registration</button>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: '0', display: 'inline' }}>{selectedEvent} / Player Seating</h1>
        <span className="round-info" style={{ marginLeft: '16px' }}>{currentRound?.name} - Time Slot {selectedTimeSlot}</span>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="mb-2">Round</label>
          <select value={selectedRound} onChange={(e) => { setSelectedRound(e.target.value); setSelectedTimeSlot(1); }} className="select-field">
            {rounds.map(round => (<option key={round.key} value={round.key}>{round.name}</option>))}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="mb-2">Time Slot</label>
          <select value={selectedTimeSlot} onChange={(e) => setSelectedTimeSlot(parseInt(e.target.value))} className="select-field">
            {availableTimeSlots.map(slot => (<option key={slot} value={slot}>Slot {slot}</option>))}
          </select>
        </div>
      </div>
      <div style={{ marginBottom: '16px' }}>
        <span className="player-metadata">Seated Players: {getSeatedPlayers().length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {[1, 2, 3, 4, 5, 6].map(tableNumber => (
          <div key={tableNumber} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', backgroundColor: '#f2f2f2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Table {tableNumber}</h3>
              <button onClick={() => toggleTable(tableNumber)} className={`btn ${isTableDisabled(tableNumber) ? 'btn-secondary' : 'btn-success'}`} style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: isTableDisabled(tableNumber) ? '#666666' : '#8b0000', color: '#ffffff', border: 'none' }}>
                {isTableDisabled(tableNumber) ? 'Disabled' : 'Active'}
              </button>
            </div>
            {isTableDisabled(tableNumber) ? (
              <div style={{ height: '80px', backgroundColor: '#666666', border: '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                {selectedRound === 'semifinals' && tableNumber === 6 ? 'Table Disabled (Semifinals)' : 'Table Disabled'}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5, 6].map(seatNumber => {
                  const player = getPlayerAtSeat(tableNumber, seatNumber);
                  return (
                    <div key={seatNumber} style={{ minHeight: '80px', minWidth: '80px', border: '2px solid #ccc', borderRadius: '4px', padding: '8px', backgroundColor: player ? '#666666' : '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                      <div className="seat-label" style={{ color: player ? '#ffffff' : '#000' }}>Seat {seatNumber}</div>
                      {player ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '4px' }}>
                          <span title={`${player.firstName} ${player.lastName}`} className="player-name-compact" style={{ flexGrow: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#ffffff' }}>
                            {player.firstName} {player.lastName}
                          </span>
                          {player.seatPreferences && (
                            <div style={{ display: 'flex', flexShrink: 0 }} title={`Needs End: ${player.seatPreferences.needsEndSeat ? 'Y' : 'N'}, Avoids Middle: ${player.seatPreferences.avoidsMiddle ? 'Y' : 'N'}`}>
                              <input type="checkbox" checked={!!player.seatPreferences.needsEndSeat} readOnly disabled style={{ margin: 0, cursor: 'default' }} />
                              <input type="checkbox" checked={!!player.seatPreferences.avoidsMiddle} readOnly disabled style={{ margin: 0, marginLeft: '2px', cursor: 'default' }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ color: '#999', flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Empty</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TablingPage;
