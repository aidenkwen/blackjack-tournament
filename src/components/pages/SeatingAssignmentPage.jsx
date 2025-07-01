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
    { key: 'rebuy1', name: 'Rebuy 1', timeSlots: 2 },
    { key: 'rebuy2', name: 'Rebuy 2', timeSlots: 1 },
    { key: 'round2', name: 'Round 2', timeSlots: 3 },
    { key: 'superrebuy', name: 'Super Rebuy', timeSlots: 2 },
    { key: 'quarterfinals', name: 'Quarterfinals', timeSlots: 2 },
    { key: 'semifinals', name: 'Semifinals', timeSlots: 1 }
  ];

  if (!lastRegisteredPlayer || !pendingRegistration) {
    return (
      <div className="container">
        <button onClick={() => setCurrentPage(1)} className="link-back link-back-block">
          {'<'} Back to Registration
        </button>
        <h1 className="page-title">No Player to Assign</h1>
        <p>No pending player registration found. Please register a player first.</p>
      </div>
    );
  }

  const currentRound = rounds.find(r => r.key === lastRegisteredPlayer.round);

  // ... (all helper functions before confirmAssignment are fine)
  const getDisabledKey = (round, timeSlot, tableNumber) => `${selectedEvent}-${round}-${timeSlot}-${tableNumber}`;
  const isTableConflicted = (tableNumber) => conflictTables.has(tableNumber);
  const isTableDisabled = (tableNumber) => {
    const key = getDisabledKey(lastRegisteredPlayer.round, lastRegisteredPlayer.timeSlot, tableNumber);
    return globalDisabledTables[key] || false;
  };
  const isTableUnavailable = (tableNumber) => isTableDisabled(tableNumber) || isTableConflicted(tableNumber);

  const getPlayerAtSeat = (tableNumber, seatNumber) => {
    // This now works because the old registration info is preserved until confirmation
    return registrations.find(r =>
      r.eventName === selectedEvent &&
      r.round === lastRegisteredPlayer.round &&
      r.timeSlot === lastRegisteredPlayer.timeSlot &&
      r.tableNumber === tableNumber &&
      r.seatNumber === seatNumber
    );
  };
  const isCurrentPlayerSeat = (tableNumber, seatNumber) => {
    const player = getPlayerAtSeat(tableNumber, seatNumber);
    return player && player.playerAccountNumber === lastRegisteredPlayer.playerAccountNumber;
  };
  const getAvailableSeats = () => {
    const availableSeats = [];
    for (let table = 1; table <= 6; table++) {
      if (!isTableUnavailable(table)) {
        for (let seat = 1; seat <= 6; seat++) {
          const player = getPlayerAtSeat(table, seat);
          const isCurrentSeat = isCurrentPlayerSeat(table, seat);
          if (!player || isCurrentSeat) {
            if (seatPreferences.length > 0) {
              if (seatPreferences.includes(seat)) availableSeats.push({ table, seat });
            } else {
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
      alert(seatPreferences.length > 0 ? `No available seats matching your preferences (seats ${seatPreferences.join(', ')}) in this round/time slot.` : 'No available seats in this round/time slot.');
      return;
    }
    const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
    setSelectedSeat(randomSeat);
  };
  const toggleSeatPreference = (seatNumber) => {
    setSeatPreferences(prev => prev.includes(seatNumber) ? prev.filter(seat => seat !== seatNumber) : [...prev, seatNumber].sort());
  };
  const toggleConflictTable = (tableNumber) => {
    setConflictTables(prev => { const newSet = new Set(prev); if (newSet.has(tableNumber)) { newSet.delete(tableNumber); } else { newSet.add(tableNumber); } return newSet; });
  };
  const isTableFull = (tableNumber) => {
    let occupiedSeats = 0;
    for (let seat = 1; seat <= 6; seat++) { if (getPlayerAtSeat(tableNumber, seat)) { occupiedSeats++; } }
    return occupiedSeats === 6;
  };
  const handlePlayerClick = (player, tableNumber) => {
    if (player && !confirming && !isTableFull(tableNumber)) toggleConflictTable(tableNumber);
  };
  const selectSeat = (tableNumber, seatNumber) => {
    const player = getPlayerAtSeat(tableNumber, seatNumber);
    const isCurrentSeat = isCurrentPlayerSeat(tableNumber, seatNumber);
    if ((player && !isCurrentSeat) || isTableUnavailable(tableNumber)) return;
    setSelectedSeat({ table: tableNumber, seat: seatNumber });
  };

  /**
   * *** THIS IS THE CORRECTED LOGIC ***
   * This function now performs a transactional update.
   * 1. It identifies which existing registrations for the player need to be replaced.
   * 2. It filters them out of the main array.
   * 3. It takes the new registrations from `pendingRegistration`, injects the
   *    selected seat info, and adds them to the array.
   * 4. It commits this new, correct array to the state.
   */
  const confirmAssignment = () => {
    if (!selectedSeat) {
      alert('Please select a seat first.');
      return;
    }

    setConfirming(true);

    // Create a set of "keys" for the new/pending registrations.
    // This helps identify which old registrations to remove.
    const pendingRegKeys = new Set(
      pendingRegistration.registrations.map(p => `${p.eventType}-${p.isRebuy}-${p.isMulligan}`)
    );

    // 1. Filter out the old registrations that are being replaced by this transaction.
    const registrationsWithoutOldEntries = registrations.filter(reg => {
      // Keep if it's not the player we're currently seating.
      if (reg.playerAccountNumber !== lastRegisteredPlayer.playerAccountNumber) {
        return true;
      }
      
      // For the current player, create a key for their existing registration.
      const currentRegKey = `${reg.eventType}-${reg.isRebuy}-${reg.isMulligan}`;

      // If this registration's key is in our set of pending keys, it means
      // it's being replaced. So, we filter it out (return false).
      if (pendingRegKeys.has(currentRegKey)) {
        return false;
      }

      // Otherwise, keep it (e.g., a mulligan from a different round).
      return true;
    });

    // 2. Prepare the new registration objects with the selected seat information.
    const newRegistrationsWithSeats = pendingRegistration.registrations.map(pendingReg => ({
      ...pendingReg,
      round: lastRegisteredPlayer.round,
      timeSlot: lastRegisteredPlayer.timeSlot,
      tableNumber: selectedSeat.table,
      seatNumber: selectedSeat.seat,
    }));

    // 3. Combine the remaining old registrations with the new, seated ones.
    const finalRegistrations = [...registrationsWithoutOldEntries, ...newRegistrationsWithSeats];

    // 4. Commit the final state.
    setRegistrations(finalRegistrations);

    alert(`${lastRegisteredPlayer.firstName} ${lastRegisteredPlayer.lastName} assigned to Table ${selectedSeat.table}, Seat ${selectedSeat.seat}`);
    
    setPendingRegistration(null);
    setCurrentPage(1);
    setConfirming(false);
  };
  
  // ... (The entire JSX return statement is fine, no changes needed there)
  return (
    <div className="container">
      <button onClick={() => setCurrentPage(1)} className="link-back link-back-block" disabled={confirming}>
        {'<'} Back to Registration
      </button>
      <div className="page-header">
        <h1 className="page-title">{selectedEvent} / Player Seating</h1>
        <p className="page-subtitle">{currentRound?.name} - Time Slot {lastRegisteredPlayer.timeSlot}</p>
      </div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', marginBottom: '4px' }}>
          <h3 style={{ margin: '0' }}><span style={{ fontWeight: 'bold' }}>{lastRegisteredPlayer.firstName} {lastRegisteredPlayer.lastName}</span></h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          <p style={{ margin: '0', color: '#666' }}>Account: {lastRegisteredPlayer.playerAccountNumber}</p>
          <div style={{ flex: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ margin: '0 0 4px 0', color: '#666' }}>Seat Preferences (optional):</span>
              {[1, 2, 3, 4, 5, 6].map(seatNum => (<label key={seatNum} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.85rem', color: '#666' }}><input type="checkbox" checked={seatPreferences.includes(seatNum)} onChange={() => toggleSeatPreference(seatNum)} disabled={confirming}/>{seatNum}</label>))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <button onClick={assignRandomSeat} className="btn btn-primary" disabled={confirming}>{seatPreferences.length > 0 ? `Assign Random Seat (${seatPreferences.join(', ')})` : 'Assign Random Seat'}</button>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={confirmAssignment} className="btn btn-success" disabled={confirming || !selectedSeat} style={{ opacity: (!selectedSeat || confirming) ? 0.5 : 1, cursor: (!selectedSeat || confirming) ? 'not-allowed' : 'pointer' }}>{confirming ? 'Confirming...' : selectedSeat ? `Confirm: Table ${selectedSeat.table}, Seat ${selectedSeat.seat}` : 'Confirm: Select a Seat'}</button>
          <button onClick={() => setSelectedSeat(null)} className="btn btn-secondary" disabled={confirming || !selectedSeat} style={{ opacity: (!selectedSeat || confirming) ? 0.5 : 1, cursor: (!selectedSeat || confirming) ? 'not-allowed' : 'pointer' }}>Clear Selection</button>
        </div>
      </div>
      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>Click on any empty seat to select it manually, or use the random assignment button. Click on existing players to mark conflict tables (prevents assignment to that table).</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {[1, 2, 3, 4, 5, 6].map(tableNumber => (
          <div key={tableNumber} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', backgroundColor: '#f2f2f2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: '0 0 0 0', fontSize: '1.1rem' }}>Table {tableNumber}</h3>
            </div>
            {isTableDisabled(tableNumber) ? (
              <div style={{ height: '80px', backgroundColor: '#666666', border: '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold' }}>Table Disabled</div>
            ) : isTableConflicted(tableNumber) ? (
              <div style={{ height: '80px', backgroundColor: '#666666', border: '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => toggleConflictTable(tableNumber)} title="Click to remove conflict restriction">Conflict of Interest (Click to Remove)</div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5, 6].map(seatNumber => {
                  const player = getPlayerAtSeat(tableNumber, seatNumber);
                  const isCurrentSeat = isCurrentPlayerSeat(tableNumber, seatNumber);
                  const isSelected = selectedSeat?.table === tableNumber && selectedSeat?.seat === seatNumber;
                  let backgroundColor = '#ffffff', textColor = '#999', cursor = 'pointer', borderColor = '#ccc';
                  if (player && !isCurrentSeat) { backgroundColor = '#666666'; textColor = '#ffffff'; cursor = 'pointer'; borderColor = '#ccc'; } 
                  else if (isCurrentSeat && !isSelected) { backgroundColor = '#e0e0e0'; textColor = '#666'; cursor = 'pointer'; borderColor = '#ccc'; } 
                  else if (isSelected) { backgroundColor = '#8b0000'; textColor = '#ffffff'; cursor = 'pointer'; borderColor = '#8b0000'; }
                  return (
                    <div key={seatNumber} onClick={() => { if (player && !isCurrentSeat) { handlePlayerClick(player, tableNumber); } else if (!confirming) { selectSeat(tableNumber, seatNumber); } }} style={{ minHeight: '60px', minWidth: '80px', border: `2px solid ${borderColor}`, borderRadius: '4px', padding: '8px', backgroundColor, cursor: confirming ? 'not-allowed' : cursor, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem', textAlign: 'center', flex: 1, opacity: confirming ? 0.6 : 1 }} title={player && !isCurrentSeat ? isTableFull(tableNumber) ? `${player.firstName} ${player.lastName} - Cannot mark conflict (table full)` : `${player.firstName} ${player.lastName} - Click to mark conflict table` : isCurrentSeat ? 'Your current seat - click to select' : isSelected ? 'Selected seat - click Confirm to assign' : 'Click to select this seat'}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px', color: textColor }}>Seat {seatNumber}</div>
                      {player && !isCurrentSeat ? (<div style={{ color: textColor, fontSize: '0.75rem', fontWeight: 'bold' }}>{player.firstName} {player.lastName}</div>) : isCurrentSeat ? (<div style={{ color: textColor, fontSize: '0.75rem', fontWeight: 'bold' }}>Current Seat</div>) : isSelected ? (<div style={{ color: textColor, fontSize: '0.75rem', fontWeight: 'bold' }}>SELECTED</div>) : (<div style={{ color: textColor }}>Available</div>)}
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