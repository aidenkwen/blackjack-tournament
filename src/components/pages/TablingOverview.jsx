import React, { useState, useEffect, useCallback } from 'react';

const TablingOverview = ({ 
  tournament, 
  registrations, 
  setRegistrations, 
  allRegistrations,
  globalDisabledTables,
  setGlobalDisabledTables
}) => {
  const rounds = [
    { key: 'round1', name: 'Round 1', timeSlots: 6 },
    { key: 'rebuy1', name: 'Rebuy 1', timeSlots: 2 },
    { key: 'rebuy2', name: 'Rebuy 2', timeSlots: 1 },
    { key: 'round2', name: 'Round 2', timeSlots: 3 },
    { key: 'superrebuy', name: 'Super Rebuy', timeSlots: 2 },
    { key: 'quarterfinals', name: 'Quarterfinals', timeSlots: 2 },
    { key: 'semifinals', name: 'Semifinals', timeSlots: 1 }
  ];

  // Function to get the most recent round with player activity
  const getMostRecentRound = useCallback(() => {
    if (!registrations || registrations.length === 0) {
      return 'round1';
    }

    const sortedRegistrations = [...registrations]
      .filter(r => r.registrationDate)
      .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));

    if (sortedRegistrations.length > 0) {
      return sortedRegistrations[0].round || 'round1';
    }
    
    return 'round1';
  }, [registrations]);

  const [selectedRound, setSelectedRound] = useState(() => getMostRecentRound());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  useEffect(() => {
    const mostRecentRound = getMostRecentRound();
    setSelectedRound(mostRecentRound);
  }, [getMostRecentRound]);

  const currentRound = rounds.find(r => r.key === selectedRound);
  const availableTimeSlots = Array.from({ length: currentRound?.timeSlots || 1 }, (_, i) => i + 1);

  const getDisabledKey = (round, timeSlot, tableNumber) => `${tournament.name}-${round}-${timeSlot}-${tableNumber}`;

  const toggleTable = (tableNumber) => {
    const hasPlayers = [1, 2, 3, 4, 5, 6].some(seat => getPlayerAtSeat(tableNumber, seat));
    
    if (hasPlayers) {
      alert('Cannot disable table - players are currently seated at this table.');
      return;
    }

    const key = getDisabledKey(selectedRound, selectedTimeSlot, tableNumber);
    setGlobalDisabledTables(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isTableDisabled = (tableNumber) => {
    if (selectedRound === 'semifinals' && tableNumber === 6) {
      return true;
    }
    
    const key = getDisabledKey(selectedRound, selectedTimeSlot, tableNumber);
    return globalDisabledTables[key] || false;
  };

  const getPlayerAtSeat = (tableNumber, seatNumber) => {
    return registrations.find(r =>
      r.round === selectedRound &&
      r.timeSlot === selectedTimeSlot &&
      r.tableNumber === tableNumber &&
      r.seatNumber === seatNumber
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="mb-2">Round</label>
          <select
            value={selectedRound}
            onChange={(e) => {
              setSelectedRound(e.target.value);
              setSelectedTimeSlot('');
            }}
            className="select-field"
          >
            {rounds.map(round => (
              <option key={round.key} value={round.key}>
                {round.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label className="mb-2">Time Slot</label>
          <select
            value={selectedTimeSlot}
            onChange={(e) => setSelectedTimeSlot(e.target.value)}
            className="select-field"
          >
            <option value="">-- Select Time Slot --</option>
            {availableTimeSlots.map(slot => (
              <option key={slot} value={slot}>
                Slot {slot}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedTimeSlot ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>Please select a time slot to view seating chart.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[1, 2, 3, 4, 5, 6].map(tableNumber => {
            const isDisabled = isTableDisabled(tableNumber);
            const isPermanentlyDisabled = selectedRound === 'semifinals' && tableNumber === 6;

            const switchTrackStyle = {
              position: 'relative',
              width: '50px',
              height: '26px',
              backgroundColor: isDisabled ? '#ccc' : '#8b0000',
              borderRadius: '13px',
              cursor: isPermanentlyDisabled ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              opacity: isPermanentlyDisabled ? 0.6 : 1,
            };

            const switchKnobStyle = {
              position: 'absolute',
              top: '2px',
              left: '2px',
              width: '22px',
              height: '22px',
              backgroundColor: '#fff',
              borderRadius: '50%',
              transition: 'transform 0.2s ease',
              transform: isDisabled ? 'translateX(0px)' : 'translateX(24px)',
            };
            
            return (
              <div 
                key={tableNumber} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '16px',
                  backgroundColor: '#f2f2f2'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Table {tableNumber}</h3>
                  <div 
                    style={switchTrackStyle} 
                    onClick={() => !isPermanentlyDisabled && toggleTable(tableNumber)}
                    title={isPermanentlyDisabled ? 'Cannot change status' : isDisabled ? 'Click to activate' : 'Click to disable'}
                  >
                    <div style={switchKnobStyle} />
                  </div>
                </div>

                {isDisabled ? (
                  <div style={{ 
                    height: '80px', 
                    boxSizing: 'border-box',
                    borderRadius: '4px',
                    backgroundColor: '#666666',
                    border: '2px solid #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}>
                    {isPermanentlyDisabled ? 'Table Disabled (Semifinals)' : 'Table Disabled'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5, 6].map(seatNumber => {
                      const player = getPlayerAtSeat(tableNumber, seatNumber);
                      return (
                        <div
                          key={seatNumber}
                          style={{
                            minHeight: '60px',
                            minWidth: '80px',
                            border: '2px solid #ccc',
                            borderRadius: '4px',
                            padding: '8px',
                            backgroundColor: player ? '#666666' : '#ffffff',
                            cursor: 'default',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            textAlign: 'center',
                            flex: 1
                          }}
                        >
                          <div className="seat-label" style={{ color: player ? '#ffffff' : '#000' }}>
                            Seat {seatNumber}
                          </div>
                          {player ? (
                            <div className="player-name-compact" style={{ color: '#ffffff' }}>
                              {player.firstName} {player.lastName}
                            </div>
                          ) : (
                            <div style={{ color: '#999' }}>Empty</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TablingOverview;