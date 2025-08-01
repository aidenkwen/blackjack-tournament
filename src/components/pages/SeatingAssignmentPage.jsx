// Updated SeatingAssignmentPage with smart warnings
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTournamentContext } from '../../context/TournamentContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const SeatingAssignmentPage = () => {
  const navigate = useNavigate();
  const { 
    selectedEvent,
    registrations, setRegistrations,
    pendingRegistration, setPendingRegistration,
    setLastRegisteredPlayer,
    globalDisabledTables, // Use from context instead of local state
    employee
  } = useTournamentContext();

  const [selectedSeat, setSelectedSeat] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [seatPreferences, setSeatPreferences] = useState([]);
  const [conflictTables, setConflictTables] = useState(new Set());
  const [tournamentId, setTournamentId] = useState(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Get tournament ID for hooks
  useEffect(() => {
    const getTournamentId = async () => {
      if (!selectedEvent) return;
      
      const { data } = await supabase
        .from('tournaments')
        .select('id')
        .eq('name', selectedEvent)
        .single();
      
      if (data) setTournamentId(data.id);
    };
    
    getTournamentId();
  }, [selectedEvent]);

  // Note: Real-time subscriptions are now handled at the context level
  // This ensures all components see updates immediately

  const rounds = [
    { key: 'round1', name: 'Round 1', timeSlots: 6 },
    { key: 'rebuy1', name: 'Rebuy 1', timeSlots: 2 },
    { key: 'rebuy2', name: 'Rebuy 2', timeSlots: 1 },
    { key: 'round2', name: 'Round 2', timeSlots: 3 },
    { key: 'superrebuy', name: 'Super Rebuy', timeSlots: 2 },
    { key: 'quarterfinals', name: 'Quarterfinals', timeSlots: 2 },
    { key: 'semifinals', name: 'Semifinals', timeSlots: 1 }
  ];

  // Time slot utility function
  const getTimeSlotName = (round, slotNumber) => {
    const timeSlotNames = {
      'round1': ['9:00 AM', '9:45 AM', '10:30 AM', '11:15 AM', '12:00 PM', '12:45 PM'],
      'rebuy1': ['1:30 PM', '2:15 PM'],
      'rebuy2': ['3:00 PM'],
      'round2': ['9:00 AM', '9:45 AM', '10:30 AM'],
      'superrebuy': ['11:15 AM', '12:00 PM'],
      'quarterfinals': ['12:45 PM', '1:30 PM'],
      'semifinals': ['2:30 PM']
    };
    
    const slots = timeSlotNames[round] || [];
    return slots[slotNumber - 1] || `Slot ${slotNumber}`;
  };

  // Extract values from pending registration (they might be undefined)
  const currentPlayerRound = pendingRegistration?.selectedRound;
  const currentPlayerTimeSlot = pendingRegistration?.selectedTimeSlot;
  const currentPlayer = pendingRegistration?.player;

  
  if (!pendingRegistration) {
    return (
      <div className="container">
        <button onClick={() => navigate('/register')} className="link-back link-back-block">
          {'<'} Back to Registration
        </button>
        <h1 className="page-title">No Player to Assign</h1>
        <p>No pending player registration found. Please register a player first.</p>
      </div>
    );
  }
  
  const handleBack = () => {
    const confirmed = window.confirm(
      "Going back will cancel this player's registration. Are you sure?"
    );
    
    if (confirmed) {
      // Since registrations haven't been saved to database yet, 
      // we just need to clear the pendingRegistration
      
      setPendingRegistration(null);
      toast.success('Registration cancelled. Player removed from tournament.');
      navigate('/register');
    }
    // If not confirmed, do nothing (stay on seating page)
  };

  const currentRound = rounds.find(r => r.key === currentPlayerRound);
  const timeSlotName = getTimeSlotName(currentPlayerRound, currentPlayerTimeSlot);
  const getDisabledKey = (round, timeSlot, tableNumber) => `${selectedEvent}-${round}-${timeSlot}-${tableNumber}`;
  const isTableConflicted = (tableNumber) => conflictTables.has(tableNumber);
  const isTableDisabled = (tableNumber) => {
    if (currentPlayerRound === 'semifinals' && tableNumber === 6) return true;
    const key = getDisabledKey(currentPlayerRound, currentPlayerTimeSlot, tableNumber);
    return globalDisabledTables[key] || false;
  };
  const isTableUnavailable = (tableNumber) => isTableDisabled(tableNumber) || isTableConflicted(tableNumber);
  const getPlayerAtSeat = (tableNumber, seatNumber) => registrations.find(r => 
    r.eventName === selectedEvent && 
    r.round === currentPlayerRound && 
    r.timeSlot === currentPlayerTimeSlot && 
    r.tableNumber === tableNumber && 
    r.seatNumber === seatNumber
  );
  const isCurrentPlayerSeat = (tableNumber, seatNumber) => {
    const player = getPlayerAtSeat(tableNumber, seatNumber);
    return player && player.playerAccountNumber === currentPlayer.playerAccountNumber;
  };
  
  // Check if player is already seated elsewhere
  const getPlayerCurrentSeat = () => {
    const existingSeat = registrations.find(r => 
      (r.playerAccountNumber === currentPlayer.playerAccountNumber || 
       r.accountNumber === currentPlayer.playerAccountNumber) &&
      r.round === currentPlayerRound &&
      r.timeSlot === currentPlayerTimeSlot &&
      r.eventName === selectedEvent &&
      !r.mulligan && !r.isMulligan &&
      r.tableNumber && r.seatNumber
    );
    
    return existingSeat ? { table: existingSeat.tableNumber, seat: existingSeat.seatNumber } : null;
  };
  
  // Check if player is registered for this round
  const isPlayerRegistered = () => {
    return registrations.some(r => 
      (r.playerAccountNumber === currentPlayer.playerAccountNumber || 
       r.accountNumber === currentPlayer.playerAccountNumber) &&
      r.round === currentPlayerRound &&
      r.eventName === selectedEvent &&
      !r.mulligan && !r.isMulligan
    );
  };

  const getAvailableSeats = () => {
    const available = [];
    for (let table = 1; table <= 6; table++) {
      if (!isTableUnavailable(table)) {
        for (let seat = 1; seat <= 6; seat++) {
          if (!getPlayerAtSeat(table, seat) || isCurrentPlayerSeat(table, seat)) {
            if (seatPreferences.length === 0 || seatPreferences.includes(seat)) {
              available.push({ table, seat });
            }
          }
        }
      }
    }
    return available;
  };

  const assignRandomSeat = () => {
    const availableSeats = getAvailableSeats();
    if (availableSeats.length === 0) {
      toast.error('No available seats match your criteria.');
      return;
    }
    const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
    setSelectedSeat(randomSeat);
  };

  const toggleSeatPreference = (seatNumber) => setSeatPreferences(prev => prev.includes(seatNumber) ? prev.filter(s => s !== seatNumber) : [...prev, seatNumber].sort());
  const toggleConflictTable = (tableNumber) => setConflictTables(prev => {
    const newSet = new Set(prev);
    if (newSet.has(tableNumber)) newSet.delete(tableNumber);
    else {
      newSet.add(tableNumber);
      if (selectedSeat && selectedSeat.table === tableNumber) setSelectedSeat(null);
    }
    return newSet;
  });
  const isTableFull = (tableNumber) => {
    for (let seat = 1; seat <= 6; seat++) {
      if (!getPlayerAtSeat(tableNumber, seat)) return false;
    }
    return true;
  };
  const handlePlayerClick = (player, tableNumber) => { if (player && !confirming && !isTableFull(tableNumber)) toggleConflictTable(tableNumber); };
  const selectSeat = (tableNumber, seatNumber) => {
    const player = getPlayerAtSeat(tableNumber, seatNumber);
    if ((player && !isCurrentPlayerSeat(tableNumber, seatNumber)) || isTableUnavailable(tableNumber)) return;
    setSelectedSeat({ table: tableNumber, seat: seatNumber });
  };
  
  const confirmAssignment = async () => { 
    if (!selectedSeat) { 
      toast.error('Please select a seat first.'); 
      return; 
    } 
    setConfirming(true); 
    
    try {
      console.log('=== SEATING ASSIGNMENT DEBUG ===');
      console.log('selectedSeat:', JSON.stringify(selectedSeat));
      console.log('currentPlayer:', JSON.stringify(currentPlayer));
      console.log('currentPlayerRound:', currentPlayerRound);
      console.log('currentPlayerTimeSlot:', currentPlayerTimeSlot);
      console.log('selectedEvent:', selectedEvent);
      console.log('pendingRegistration:', pendingRegistration);
      
      // Get the registrations from pendingRegistration
      const pendingRegs = pendingRegistration?.registrations || [];
      console.log('Pending registrations to save:', pendingRegs.length);
      
      if (pendingRegs.length === 0) {
        console.error('NO PENDING REGISTRATIONS FOUND!');
        toast.error('No pending registrations found. Please go back and try again.');
        setConfirming(false);
        return;
      }
      
      // Update pending registrations with seat assignments
      const registrationsWithSeating = pendingRegs.map(reg => ({
        ...reg,
        tableNumber: selectedSeat.table,
        seatNumber: selectedSeat.seat,
        timeSlot: currentPlayerTimeSlot
      }));
      
      console.log('Registrations with seating:', registrationsWithSeating);
      
      // Check if we're updating existing registrations or adding new ones
      let updatedRegistrations = [...registrations];
      
      registrationsWithSeating.forEach(regWithSeating => {
        const existingIndex = updatedRegistrations.findIndex(r => 
          r.id === regWithSeating.id ||
          (r.playerAccountNumber === regWithSeating.playerAccountNumber && 
           r.round === regWithSeating.round && 
           r.isMulligan === regWithSeating.isMulligan)
        );
        
        if (existingIndex >= 0) {
          // Update existing registration
          console.log('Updating existing registration at index:', existingIndex);
          updatedRegistrations[existingIndex] = regWithSeating;
        } else {
          // Add new registration
          console.log('Adding new registration');
          updatedRegistrations.push(regWithSeating);
        }
      });
      
      console.log('Total registrations after update:', updatedRegistrations.length);
      console.log('Calling setRegistrations with updated data...');
      
      // Call setRegistrations which will persist to database
      await setRegistrations(updatedRegistrations);
      
      console.log('setRegistrations completed');
      
      // Set lastRegisteredPlayer since seating is complete
      setLastRegisteredPlayer({
        playerAccountNumber: currentPlayer.playerAccountNumber,
        firstName: currentPlayer.firstName,
        lastName: currentPlayer.lastName,
        round: currentPlayerRound,
        timeSlot: currentPlayerTimeSlot
      });
      
      toast.success(`${currentPlayer.firstName} assigned to Table ${selectedSeat.table}, Seat ${selectedSeat.seat}`); 
      setPendingRegistration(null); 
      navigate('/register');
    } catch (error) {
      console.error('Error saving seating assignment:', error);
      
      // Check if it's a unique constraint violation (seat already taken)
      if (error.message?.includes('unique_seat_assignment') || 
          error.code === '23505' || // PostgreSQL unique violation
          error.message?.includes('duplicate key value')) {
        toast.error(
          `Seat ${selectedSeat.table}-${selectedSeat.seat} was just taken by another user. Please select a different seat.`,
          { duration: 5000, icon: '⚠️' }
        );
        
        // Force reload registrations to get latest seat assignments
        try {
          const { loadRegistrations } = await import('../../hooks/useSupabaseData');
          await loadRegistrations(selectedEvent);
        } catch (reloadError) {
          console.error('Error reloading registrations:', reloadError);
        }
        
        // Clear selected seat
        setSelectedSeat(null);
      } else {
        toast.error('Failed to save seating assignment. Please try again.');
      }
      
      setConfirming(false);
    }
  };

  return (
    <div className="container">
      <button onClick={handleBack} className="link-back link-back-block" disabled={confirming}>
        {'<'} Back to Registration
      </button>
      
      <div className="page-header">
        <h1 className="page-title">
          {`${selectedEvent} / Player Seating (${currentRound?.name} - ${timeSlotName})`}
        </h1>
      </div>


      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', marginBottom: '8px' }}>
        <div>
          <div className="player-info-container">
            <h3 className="player-name-with-account">
              {currentPlayer.firstName} {currentPlayer.lastName}<span className="account-part">, {currentPlayer.playerAccountNumber}</span>
            </h3>
            <p className="player-metadata">Entry Type: {currentPlayer.entryType}</p>
            
            {/* Smart Warnings */}
            {(() => {
              const warnings = [];
              const currentSeat = getPlayerCurrentSeat();
              const isRegistered = isPlayerRegistered();
              
              if (!isRegistered) {
                warnings.push({
                  type: 'error',
                  message: `⚠️ ${currentPlayer.firstName} is not registered for ${currentRound?.name}!`,
                  color: '#dc3545'
                });
              }
              
              if (currentSeat) {
                warnings.push({
                  type: 'warning',
                  message: `ℹ️ ${currentPlayer.firstName} is already seated at Table ${currentSeat.table}, Seat ${currentSeat.seat}`,
                  color: '#0066cc'
                });
              }
              
              return warnings.map((warning, index) => (
                <div key={index} style={{ 
                  marginTop: '8px', 
                  padding: '8px 12px', 
                  backgroundColor: warning.color + '15',
                  border: `1px solid ${warning.color}`,
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: warning.color,
                  fontWeight: '500'
                }}>
                  {warning.message}
                </div>
              ));
            })()}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="player-metadata">Seat Preferences:</span>
          {[1, 2, 3, 4, 5, 6].map(seatNum => (
            <label key={seatNum} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '1rem', color: '#666666', fontWeight: 'normal' }}>
              <input type="checkbox" checked={seatPreferences.includes(seatNum)} onChange={() => toggleSeatPreference(seatNum)} disabled={confirming} />
              {seatNum}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}> 
        <button onClick={assignRandomSeat} className="btn btn-white-red" disabled={confirming}>
          {seatPreferences.length > 0 ? `Assign Random Seat (${seatPreferences.join(', ')})` : 'Assign Random Seat'}
        </button> 
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}> 
                    <button onClick={() => setSelectedSeat(null)} className="btn btn-secondary" disabled={confirming || !selectedSeat} style={{ opacity: (!selectedSeat || confirming) ? 0.5 : 1 }}>
            Clear
          </button> 
          <button onClick={confirmAssignment} className="btn btn-success" disabled={confirming || !selectedSeat} style={{ opacity: (!selectedSeat || confirming) ? 0.5 : 1 }}>
            {confirming ? 'Confirming...' : selectedSeat ? `Confirm: Table ${selectedSeat.table}, Seat ${selectedSeat.seat}` : 'Confirm Seat'}
          </button> 
        </div> 
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {[1, 2, 3, 4, 5, 6].map(tableNumber => (
          <div key={tableNumber} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', backgroundColor: '#f2f2f2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Table {tableNumber}</h3>
            </div>
            {isTableDisabled(tableNumber) ? (
              <div style={{ height: '80px', boxSizing: 'border-box', borderRadius: '4px', backgroundColor: '#666666', border: '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                {currentPlayerRound === 'semifinals' && tableNumber === 6 ? 'Table Disabled (Semifinals)' : 'Table Disabled'}
              </div>
            ) : isTableConflicted(tableNumber) ? (
              <div style={{ height: '80px', boxSizing: 'border-box', borderRadius: '4px', backgroundColor: '#666666', border: '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => toggleConflictTable(tableNumber)} title="Click to remove conflict restriction">
                Conflict of Interest (Click to Remove)
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5, 6].map(seatNumber => {
                  const player = getPlayerAtSeat(tableNumber, seatNumber);
                  const isCurrentSeat = isCurrentPlayerSeat(tableNumber, seatNumber);
                  const isSelected = selectedSeat?.table === tableNumber && selectedSeat?.seat === seatNumber;
                  let backgroundColor = '#ffffff', textColor = '#999', cursor = 'pointer', borderColor = '#ccc';
                  
                  if (player && !isCurrentSeat) { backgroundColor = '#666666'; textColor = '#ffffff'; cursor = 'pointer'; } 
                  else if (isCurrentSeat && !isSelected) { backgroundColor = '#e0e0e0'; textColor = '#666'; } 
                  else if (isSelected) { backgroundColor = '#8b0000'; textColor = '#ffffff'; borderColor = '#8b0000'; }
                  
                  return (
                    <div key={seatNumber} onClick={() => { if (player && !isCurrentSeat) { handlePlayerClick(player, tableNumber); } else if (!confirming) { selectSeat(tableNumber, seatNumber); } }} style={{ minHeight: '60px', minWidth: '80px', border: `2px solid ${borderColor}`, borderRadius: '4px', padding: '8px', backgroundColor, cursor: confirming ? 'not-allowed' : cursor, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem', textAlign: 'center', flex: 1, opacity: confirming ? 0.6 : 1 }} title={player && !isCurrentSeat ? (isTableFull(tableNumber) ? `${player.firstName} ${player.lastName} - Cannot mark conflict (table full)` : `${player.firstName} ${player.lastName} - Click to mark conflict table`) : isCurrentSeat ? 'Your current seat - click to select' : isSelected ? 'Selected seat - click Confirm to assign' : 'Click to select this seat'}>
                      <div className="seat-label" style={{ color: textColor }}>Seat {seatNumber}</div>
                      {player && !isCurrentSeat ? (<div className="player-name-compact" style={{ color: textColor }}>{player.firstName} {player.lastName}</div>) : isCurrentSeat ? (<div className="player-name-compact" style={{ color: textColor }}>Current Seat</div>) : isSelected ? (<div className="player-name-compact" style={{ color: textColor }}>SELECTED</div>) : (<div style={{ color: textColor }}>Available</div>)}
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