// Updated SeatingAssignmentPage with coordination features
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useTournamentContext } from '../../context/TournamentContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useCoordinationNotes } from '../../hooks/useCoordinationNotes';
import { useSeatHistory } from '../../hooks/useSeatHistory';

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
  const [coordinationNote, setCoordinationNote] = useState('');
  
  // Initialize coordination hooks
  const { getNote, saveNote } = useCoordinationNotes(tournamentId);
  const { recordAssignment, undoLastAssignment, lastAssignment, loading: undoLoading } = useSeatHistory(tournamentId);

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

  // Set up real-time subscription for seat updates
  useEffect(() => {
    if (!selectedEvent) return;

    console.log('Setting up real-time subscription for:', selectedEvent);
    
    // Get tournament ID first
    const setupSubscription = async () => {
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('id')
        .eq('name', selectedEvent)
        .single();
      
      if (!tournament) return;

      // Subscribe to registration changes for this tournament
      const channel = supabase
        .channel(`registrations-${tournament.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'registrations',
            filter: `tournament_id=eq.${tournament.id}`
          },
          (payload) => {
            console.log('Real-time update received:', payload);
            
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const updatedReg = payload.new;
              
              // Show notification for seat assignments
              if (updatedReg.table_number && updatedReg.seat_number) {
                toast(`Seat ${updatedReg.table_number}-${updatedReg.seat_number} was just assigned to ${updatedReg.first_name} ${updatedReg.last_name}`, {
                  icon: '🪑',
                  duration: 3000,
                });
              }
              
              // Update local registrations state
              setRegistrations(prev => {
                const existingIndex = prev.findIndex(r => r.id === updatedReg.id);
                if (existingIndex >= 0) {
                  // Update existing registration
                  const updated = [...prev];
                  updated[existingIndex] = {
                    ...updated[existingIndex],
                    tableNumber: updatedReg.table_number,
                    seatNumber: updatedReg.seat_number,
                    timeSlot: updatedReg.time_slot,
                    // Update other fields that might have changed
                  };
                  return updated;
                } else {
                  // Add new registration
                  return [...prev, {
                    ...updatedReg,
                    eventName: selectedEvent,
                    accountNumber: updatedReg.account_number,
                    firstName: updatedReg.first_name,
                    lastName: updatedReg.last_name,
                    tableNumber: updatedReg.table_number,
                    seatNumber: updatedReg.seat_number,
                    timeSlot: updatedReg.time_slot,
                    entryType: updatedReg.entry_type,
                    registeredBy: updatedReg.registered_by,
                    createdAt: updatedReg.created_at,
                    playerAccountNumber: updatedReg.account_number,
                    paymentType: updatedReg.payment_type,
                    paymentAmount: updatedReg.payment_amount,
                    paymentType2: updatedReg.payment_type2,
                    paymentAmount2: updatedReg.payment_amount2,
                    comments: updatedReg.comments,
                    isMulligan: updatedReg.mulligan
                  }];
                }
              });
            }
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        console.log('Cleaning up real-time subscription');
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, [selectedEvent, setRegistrations]);

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

  // Load coordination note when round/timeslot changes - must be before early return
  useEffect(() => {
    if (currentPlayerRound && currentPlayerTimeSlot) {
      const note = getNote(currentPlayerRound, currentPlayerTimeSlot);
      setCoordinationNote(note);
    }
  }, [currentPlayerRound, currentPlayerTimeSlot, getNote]);
  
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
      // Remove the player's registrations
      setRegistrations(prevRegistrations => {
        return prevRegistrations.filter(r => 
          !(pendingRegistration.registrations.some(pr => pr.id === r.id))
        );
      });
      
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
      console.log('Looking for registration with:', {
        accountNumber: currentPlayer.playerAccountNumber,
        round: currentPlayerRound,
        eventName: selectedEvent
      });
      console.log('Total registrations to search:', registrations.length);
      
      // Log first few registrations to debug
      console.log('Sample registrations:', registrations.slice(0, 2).map(r => ({
        accountNumber: r.accountNumber,
        playerAccountNumber: r.playerAccountNumber,
        round: r.round,
        eventName: r.eventName,
        firstName: r.firstName,
        tableNumber: r.tableNumber,
        seatNumber: r.seatNumber
      })));
      
      // Update registrations with seating information
      let foundMatch = false;
      const updatedRegistrations = registrations.map(reg => {
        // Find the registration for this player in this round
        const isMatchingReg = (
          (reg.playerAccountNumber === currentPlayer.playerAccountNumber || 
           reg.accountNumber === currentPlayer.playerAccountNumber) &&
          reg.round === currentPlayerRound &&
          reg.eventName === selectedEvent &&
          !reg.mulligan && !reg.isMulligan
        );
        
        if (isMatchingReg) {
          foundMatch = true;
          console.log('Found matching registration:', reg.firstName, reg.lastName, reg.id);
          console.log('Setting tableNumber:', selectedSeat.table, 'seatNumber:', selectedSeat.seat);
          return {
            ...reg,
            tableNumber: selectedSeat.table,
            seatNumber: selectedSeat.seat,
            timeSlot: currentPlayerTimeSlot,
            // Ensure we have the correct account number field
            playerAccountNumber: reg.playerAccountNumber || reg.accountNumber
          };
        }
        return reg;
      });
      
      if (!foundMatch) {
        console.error('NO MATCHING REGISTRATION FOUND!');
        console.log('Was looking for:', {
          accountNumber: currentPlayer.playerAccountNumber,
          round: currentPlayerRound,
          eventName: selectedEvent
        });
      }
      
      console.log('Updated registrations array:', updatedRegistrations.filter(r => r.playerAccountNumber === currentPlayer.playerAccountNumber));
      console.log('Calling setRegistrations with updated data...');
      
      // Call setRegistrations which will persist to database
      await setRegistrations(updatedRegistrations);
      
      console.log('setRegistrations completed');
      
      // Record the assignment for undo functionality
      if (foundMatch) {
        const matchingReg = updatedRegistrations.find(reg => 
          (reg.playerAccountNumber === currentPlayer.playerAccountNumber || 
           reg.accountNumber === currentPlayer.playerAccountNumber) &&
          reg.round === currentPlayerRound &&
          !reg.mulligan && !reg.isMulligan
        );
        
        if (matchingReg && matchingReg.id) {
          await recordAssignment(
            matchingReg.id,
            currentPlayerRound,
            currentPlayerTimeSlot,
            null, // No previous seat for new assignments
            { table: selectedSeat.table, seat: selectedSeat.seat },
            employee
          );
        }
      }
      
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

      {/* Coordination Note Section */}
      <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder={`Add coordination note for ${currentRound?.name} - ${timeSlotName} (e.g., "Sarah working on this")`}
              value={coordinationNote}
              onChange={(e) => setCoordinationNote(e.target.value)}
              onBlur={() => saveNote(currentPlayerRound, currentPlayerTimeSlot, coordinationNote, employee)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: 'white'
              }}
            />
          </div>
          <div>
            <button 
              onClick={async () => {
                const result = await undoLastAssignment();
                if (result?.success) {
                  const undone = result.undoneAssignment;
                  if (undone?.registrations) {
                    toast.success(
                      `Undid assignment: ${undone.registrations.first_name} ${undone.registrations.last_name} removed from Table ${undone.new_table_number}-${undone.new_seat_number}`,
                      { icon: '↶' }
                    );
                    // Reload registrations to reflect the change
                    window.location.reload();
                  }
                }
              }}
              disabled={!lastAssignment || undoLoading}
              className="btn btn-secondary"
              style={{ opacity: (!lastAssignment || undoLoading) ? 0.5 : 1 }}
            >
              ↶ Undo Last Assignment
            </button>
          </div>
        </div>
        {coordinationNote && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            Note saved: "{coordinationNote}"
          </div>
        )}
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