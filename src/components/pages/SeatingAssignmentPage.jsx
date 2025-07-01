import React, { useState } from 'react';

const SeatingAssignmentPage = ({ 
  selectedEvent, 
  tournaments, 
  registrations, 
  setRegistrations, 
  lastRegisteredPlayer,
  pendingRegistration,
  setPendingRegistration,
  setCurrentPage,
  globalDisabledTables,
  setGlobalDisabledTables
}) => {
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [seatPreferences, setSeatPreferences] = useState([]);
  const [conflictTables, setConflictTables] = useState(new Set());

  const rounds = [
    { key: 'round1', name: 'Round 1', timeSlots: 6 },
    { key: 'rebuy1', name: 'Rebuy 1', timeSlots: 1 },
    { key: 'rebuy2', name: 'Rebuy 2', timeSlots: 1 },
    { key: 'round2', name: 'Round 2', timeSlots: 3 },
    { key: 'superrebuy', name: 'Super Rebuy', timeSlots: 2 },
    { key: 'quarterfinals', name: 'Quarterfinals', timeSlots: 2 },
    { key: 'semifinals', name: 'Semifinals', timeSlots: 1 }
  ];

  if (!lastRegisteredPlayer || !pendingRegistration) {
    return (
      <div className="container">
        <button
          onClick={() => setCurrentPage(1)}
          className="link-back link-back-block"
        >
          {'<'} Back to Registration
        </button>
        <h1 className="page-title">No Player to Assign</h1>
        <p>No pending player registration found. Please register a player first.</p>
      </div>
    );
  }

  const currentRound = rounds.find(r => r.key === lastRegisteredPlayer.round);

  const getDisabledKey = (round, timeSlot, tableNumber) => `${selectedEvent}-${round}-${timeSlot}-${tableNumber}`;

  const isTableConflicted = (tableNumber) => {
    return conflictTables.has(tableNumber);
  };

  const isTableDisabled = (tableNumber) => {
    const key = getDisabledKey(lastRegisteredPlayer.round, lastRegisteredPlayer.timeSlot, tableNumber);
    return globalDisabledTables[key] || false;
  };

  const isTableUnavailable = (tableNumber) => {
    return isTableDisabled(tableNumber) || isTableConflicted(tableNumber);
  };

  const getPlayerAtSeat = (tableNumber, seatNumber) => {
    return registrations.find(r =>
      r.eventName === selectedEvent &&
      r.round === lastRegisteredPlayer.round &&
      r.timeSlot === lastRegisteredPlayer.timeSlot &&
      r.tableNumber === tableNumber &&
      r.seatNumber === seatNumber
    );
  };

  const getAvailableSeats = () => {
    const availableSeats = [];
    for (let table = 1; table <= 6; table++) {
      if (!isTableUnavailable(table)) {
        for (let seat = 1; seat <= 6; seat++) {
          if (!getPlayerAtSeat(table, seat)) {
            // If seat preferences are set, only include preferred seats
            if (seatPreferences.length > 0) {
              if (seatPreferences.includes(seat)) {
                availableSeats.push({ table, seat });
              }
            } else {
              // If no preferences, include all available seats
              availableSeats.push({ table, seat });
            }
          }
        }
      }
    }
    return availableSeats;
  };

  const assignRandomSeat = () => {
    const availableSeats = getAvailableSeats();
    
    if (availableSeats.length === 0) {
      if (seatPreferences.length > 0) {
        alert(`No available seats matching your preferences (seats ${seatPreferences.join(', ')}) in this round/time slot.`);
      } else {
        alert('No available seats in this round/time slot.');
      }
      return;
    }

    const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
    setSelectedSeat(randomSeat);
  };

  const toggleSeatPreference = (seatNumber) => {
    setSeatPreferences(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(seat => seat !== seatNumber);
      } else {
        return [...prev, seatNumber].sort();
      }
    });
  };

  const toggleConflictTable = (tableNumber) => {
    setConflictTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableNumber)) {
        newSet.delete(tableNumber);
      } else {
        newSet.add(tableNumber);
      }
      return newSet;
    });
  };

  const isTableFull = (tableNumber) => {
    let occupiedSeats = 0;
    for (let seat = 1; seat <= 6; seat++) {
      if (getPlayerAtSeat(tableNumber, seat)) {
        occupiedSeats++;
      }
    }
    return occupiedSeats === 6;
  };

  const handlePlayerClick = (player, tableNumber) => {
    // Only allow clicking on existing players to mark conflicts if table isn't full
    if (player && !confirming && !isTableFull(tableNumber)) {
      toggleConflictTable(tableNumber);
    }
  };

  const selectSeat = (tableNumber, seatNumber) => {
    if (getPlayerAtSeat(tableNumber, seatNumber) || isTableUnavailable(tableNumber)) {
      return; // Seat is occupied or table is unavailable
    }
    setSelectedSeat({ table: tableNumber, seat: seatNumber });
  };

  const confirmAssignment = () => {
    if (!selectedSeat) {
      alert('Please select a seat first.');
      return;
    }

    setConfirming(true);

    // Update existing registrations with seating information instead of adding new ones
    const updatedRegistrations = registrations.map(r => {
      // Find registrations that match the pending registration criteria
      if (pendingRegistration && pendingRegistration.registrations) {
        const matchingPendingReg = pendingRegistration.registrations.find(pendingReg => 
          pendingReg.playerAccountNumber === r.playerAccountNumber &&
          pendingReg.eventType === r.eventType &&
          pendingReg.isRebuy === r.isRebuy &&
          pendingReg.isMulligan === r.isMulligan &&
          Math.abs(new Date(pendingReg.registrationDate).getTime() - new Date(r.registrationDate).getTime()) < 5000 // Within 5 seconds
        );
        
        if (matchingPendingReg) {
          return {
            ...r,
            round: lastRegisteredPlayer.round,
            timeSlot: lastRegisteredPlayer.timeSlot,
            tableNumber: selectedSeat.table,
            seatNumber: selectedSeat.seat
          };
        }
      }
      
      // Fallback for existing registrations without seating
      if (r.playerAccountNumber === lastRegisteredPlayer.playerAccountNumber &&
          r.eventName === selectedEvent &&
          (!r.tableNumber || !r.seatNumber)) {
        return {
          ...r,
          round: lastRegisteredPlayer.round,
          timeSlot: lastRegisteredPlayer.timeSlot,
          tableNumber: selectedSeat.table,
          seatNumber: selectedSeat.seat
        };
      }
      
      return r;
    });

    setRegistrations(updatedRegistrations);

    // Show confirmation and navigate back
    alert(`${lastRegisteredPlayer.firstName} ${lastRegisteredPlayer.lastName} assigned to Table ${selectedSeat.table}, Seat ${selectedSeat.seat}`);
    
    // Clear pending registration after successful completion and navigate
    setPendingRegistration(null);
    setCurrentPage(1);
    
    setConfirming(false);
  };
  
  return (
    <div className="container">
      <button
        onClick={() => setCurrentPage(1)}
        className="link-back link-back-block"
        disabled={confirming}
      >
        {'<'} Back to Registration
      </button>

      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: '0', display: 'inline' }}>
          {selectedEvent} / Player Seating
        </h1>
        <span style={{ 
          fontSize: '1.2rem', 
          color: '#666', 
          marginLeft: '16px',
          fontWeight: '500' 
        }}>
          {currentRound?.name} - Time Slot {lastRegisteredPlayer.timeSlot}
        </span>
      </div>

      {/* Player Info with Seat Preferences */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '24px',
          marginBottom: '8px'
        }}>
          <h3 style={{ margin: '0' }}>
            <span style={{ fontWeight: 'bold' }}>{lastRegisteredPlayer.firstName} {lastRegisteredPlayer.lastName}</span>
          </h3>
        </div>
        
        <div style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '24px'
        }}>
          <p style={{ margin: '0', color: '#666' }}>
            Account: {lastRegisteredPlayer.playerAccountNumber}
          </p>
          
          {/* Seat Preferences */}
          <div style={{ flex: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ margin: '0 0 4px 0', color: '#666' }}>
                Seat Preferences (optional):
              </span>
              {[1, 2, 3, 4, 5, 6].map(seatNum => (
                <label 
                  key={seatNum}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: '#666'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={seatPreferences.includes(seatNum)}
                    onChange={() => toggleSeatPreference(seatNum)}
                    disabled={confirming}
                  />
                  {seatNum}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Controls - Top row layout */}
      <div style={{ 
        marginBottom: '24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={assignRandomSeat}
          className="btn btn-primary"
          disabled={confirming}
        >
          {seatPreferences.length > 0 
            ? `Assign Random Seat (${seatPreferences.join(', ')})` 
            : 'Assign Random Seat'
          }
        </button>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={confirmAssignment}
            className="btn btn-success"
            disabled={confirming || !selectedSeat}
            style={{
              opacity: (!selectedSeat || confirming) ? 0.5 : 1,
              cursor: (!selectedSeat || confirming) ? 'not-allowed' : 'pointer'
            }}
          >
            {confirming ? 'Confirming...' : selectedSeat ? `Confirm: Table ${selectedSeat.table}, Seat ${selectedSeat.seat}` : 'Confirm: Select a Seat'}
          </button>
          <button
            onClick={() => setSelectedSeat(null)}
            className="btn btn-secondary"
            disabled={confirming || !selectedSeat}
            style={{
              opacity: (!selectedSeat || confirming) ? 0.5 : 1,
              cursor: (!selectedSeat || confirming) ? 'not-allowed' : 'pointer'
            }}
          >
            Clear Selection
          </button>
        </div>
      </div>

      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>
        Click on any empty seat to select it manually, or use the random assignment button. Click on existing players to mark conflict tables (prevents assignment to that table).
      </p>

      {/* Tables Layout - Updated styling */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {[1, 2, 3, 4, 5, 6].map(tableNumber => (
          <div 
            key={tableNumber} 
            style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '16px',
              backgroundColor: '#f2f2f2' // Light grey table background
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: '0 0 0 0', fontSize: '1.1rem' }}>Table {tableNumber}</h3>
              {/* No table disabling controls on seating assignment page */}
            </div>
            
            {isTableDisabled(tableNumber) ? (
              <div style={{ 
                height: '80px', 
                backgroundColor: '#666666', 
                border: '2px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                Table Disabled
              </div>
            ) : isTableConflicted(tableNumber) ? (
              <div style={{ 
                height: '80px', 
                backgroundColor: '#666666', 
                border: '2px solid #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
              onClick={() => toggleConflictTable(tableNumber)}
              title="Click to remove conflict restriction"
              >
                Conflict of Interest (Click to Remove)
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5, 6].map(seatNumber => {
                  const player = getPlayerAtSeat(tableNumber, seatNumber);
                  const isSelected = selectedSeat?.table === tableNumber && selectedSeat?.seat === seatNumber;
                  
                  let backgroundColor = '#ffffff'; // White seats
                  let textColor = '#999';
                  let cursor = 'pointer';
                  let borderColor = '#ccc';
                  
                  if (player) {
                    backgroundColor = '#666666'; // Dark grey for occupied
                    textColor = '#ffffff'; // White text for occupied
                    cursor = 'pointer'; // Allow clicking on players for conflict marking
                    borderColor = '#ccc';
                  } else if (isSelected) {
                    backgroundColor = '#8b0000'; // Red for selected (new seating)
                    textColor = '#ffffff';
                    cursor = 'pointer';
                    borderColor = '#8b0000';
                  }
                  
                  return (
                    <div
                      key={seatNumber}
                      onClick={() => {
                        if (player) {
                          handlePlayerClick(player, tableNumber);
                        } else if (!confirming) {
                          selectSeat(tableNumber, seatNumber);
                        }
                      }}
                      style={{
                        minHeight: '60px',
                        minWidth: '80px',
                        border: `2px solid ${borderColor}`,
                        borderRadius: '4px',
                        padding: '8px',
                        backgroundColor,
                        cursor: confirming ? 'not-allowed' : cursor,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        textAlign: 'center',
                        flex: 1,
                        opacity: confirming ? 0.6 : 1
                      }}
                      title={
                        player 
                          ? isTableFull(tableNumber)
                            ? `${player.firstName} ${player.lastName} - Cannot mark conflict (table full)`
                            : `${player.firstName} ${player.lastName} - Click to mark conflict table`
                          : isSelected 
                          ? 'Selected seat (new assignment) - click Confirm to assign'
                          : 'Click to select this seat'
                      }
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '2px', color: textColor }}>
                        Seat {seatNumber}
                      </div>
                      {player ? (
                        <div style={{ color: textColor, fontSize: '0.75rem', fontWeight: 'bold' }}>
                          {player.firstName} {player.lastName}
                        </div>
                      ) : isSelected ? (
                        <div style={{ color: textColor, fontSize: '0.75rem', fontWeight: 'bold' }}>
                          SELECTED
                        </div>
                      ) : (
                        <div style={{ color: textColor }}>
                          Available
                        </div>
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

export default SeatingAssignmentPage;