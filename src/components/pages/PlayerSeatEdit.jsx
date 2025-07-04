import React, { useState } from 'react';
import SearchBar from '../common/SearchBar';
import toast from 'react-hot-toast';

const PlayerSeatEdit = ({ 
  tournament, 
  registrations, 
  setRegistrations, 
  allRegistrations,
  globalDisabledTables,
  setGlobalDisabledTables,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [playerRegistrations, setPlayerRegistrations] = useState([]);
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [modalRound, setModalRound] = useState(null);
  const [modalTimeSlot, setModalTimeSlot] = useState(null);
  const [selectedPlayerInModal, setSelectedPlayerInModal] = useState(null);
  const [modalSelectedTimeSlot, setModalSelectedTimeSlot] = useState(null);
  const [playerNeedsReseating, setPlayerNeedsReseating] = useState(false);
  const [selectedSeatInModal, setSelectedSeatInModal] = useState(null);

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

  const getDisabledKey = (round, timeSlot, tableNumber) => `${tournament.name}-${round}-${timeSlot}-${tableNumber}`;

  const isTableDisabled = (tableNumber, round, timeSlot) => {
    if (round === 'semifinals' && tableNumber === 6) return true;
    const key = getDisabledKey(round, timeSlot, tableNumber);
    return globalDisabledTables[key] || false;
  };

  const getFurthestRoundForPlayer = (playerAccountNumber) => {
    const playerRegs = registrations.filter(r => 
      r.playerAccountNumber === playerAccountNumber && !r.isMulligan
    );
    
    if (playerRegs.length === 0) return null;

    const roundOrder = ['round1', 'rebuy1', 'rebuy2', 'round2', 'superrebuy', 'quarterfinals', 'semifinals'];
    
    let furthestRoundIndex = -1;
    let furthestReg = null;

    playerRegs.forEach(reg => {
      const roundIndex = roundOrder.indexOf(reg.round);
      if (roundIndex > furthestRoundIndex) {
        furthestRoundIndex = roundIndex;
        furthestReg = reg;
      }
    });

    return furthestReg;
  };

  const searchPlayers = () => {
    const searchTermString = String(searchTerm || '').trim();
    if (!searchTermString) {
      toast.error('Please enter a search term.');
      return;
    }

    const foundRegs = registrations.filter(r => {
      if (!r || r.isMulligan) return false;
      const term = searchTermString.toLowerCase();
      const firstName = String(r.firstName || '').toLowerCase();
      const lastName = String(r.lastName || '').toLowerCase();
      const accountNumber = String(r.playerAccountNumber || '');
      return firstName.includes(term) || lastName.includes(term) || accountNumber.includes(searchTermString);
    });

    if (foundRegs.length === 0) {
      toast.error('No players found matching your search.');
      setPlayerRegistrations([]);
      return;
    }
    
    const playerGroups = {};
    foundRegs.forEach(reg => {
      const key = reg.playerAccountNumber;
      if (!playerGroups[key]) playerGroups[key] = [];
      playerGroups[key].push(reg);
    });

    const uniquePlayers = Object.values(playerGroups).map(group => group[0]);

    if (uniquePlayers.length > 1) {
      const playerList = uniquePlayers.map((player, i) => 
        `${i + 1}. ${player.firstName || 'N/A'} ${player.lastName || 'N/A'} (${player.playerAccountNumber || 'N/A'})`
      ).join('\n');
      
      const choice = prompt(`Multiple players found:\n\n${playerList}\n\nEnter the number of the player you want to edit:`);
      const index = parseInt(choice) - 1;
      
      if (index >= 0 && index < uniquePlayers.length) {
        const chosenPlayerAccount = uniquePlayers[index].playerAccountNumber;
        const furthestReg = getFurthestRoundForPlayer(chosenPlayerAccount);
        setPlayerRegistrations(furthestReg ? [furthestReg] : []);
      } else {
        toast.error('Invalid selection.');
        setPlayerRegistrations([]);
      }
    } else {
      const furthestReg = getFurthestRoundForPlayer(uniquePlayers[0].playerAccountNumber);
      setPlayerRegistrations(furthestReg ? [furthestReg] : []);
    }
  };

  const showFullSeating = (round, timeSlot, playerReg) => {
    if (!timeSlot) { 
      toast.error("Player must be assigned a time slot to view seating."); 
      return; 
    }
    setModalRound(round);
    setModalTimeSlot(timeSlot);
    setModalSelectedTimeSlot(timeSlot);
    setShowSeatingModal(true);
    setSelectedPlayerInModal(playerReg || null);
    setPlayerNeedsReseating(false);
    setSelectedSeatInModal(null);
  };

  const getPlayerAtSeat = (table, seat, round, timeSlot) => 
    registrations.find(r => 
      r.round === round && 
      r.timeSlot === timeSlot && 
      r.tableNumber === table && 
      r.seatNumber === seat
    );

  const handleSeatClickInModal = (tableNumber, seatNumber) => {
    if (isTableDisabled(tableNumber, modalRound, modalSelectedTimeSlot)) return;
    setSelectedSeatInModal({ table: tableNumber, seat: seatNumber });
  };

  const handleConfirmSeat = () => {
    if (!selectedPlayerInModal || !selectedSeatInModal) return;
    
    const { table: newTable, seat: newSeat } = selectedSeatInModal;
    const playerAtTarget = getPlayerAtSeat(newTable, newSeat, modalRound, modalSelectedTimeSlot);
    const playerAccountNumber = selectedPlayerInModal.playerAccountNumber;
    const playerRound = selectedPlayerInModal.round;
    
    const roundName = rounds.find(r => r.key === modalRound)?.name;
    const timeSlotName = getTimeSlotName(modalRound, modalSelectedTimeSlot);
    
    let confirmMessage = `Move ${selectedPlayerInModal.firstName} to Table ${newTable}, Seat ${newSeat} in ${roundName}, ${timeSlotName}?`;
    if (playerAtTarget && playerAtTarget.playerAccountNumber !== selectedPlayerInModal.playerAccountNumber) {
      confirmMessage += `\n\nThis will remove ${playerAtTarget.firstName} ${playerAtTarget.lastName} from this seat.`;
    }
    
    const confirmed = window.confirm(confirmMessage);
    
    if (confirmed) {
      setRegistrations(prevRegistrations => {
        return prevRegistrations.map(r => {
          if (r.playerAccountNumber === playerAccountNumber && 
              r.round === playerRound && 
              !r.isMulligan) {
            return { 
              ...r, 
              tableNumber: newTable, 
              seatNumber: newSeat,
              timeSlot: modalSelectedTimeSlot
            };
          }
          if (r.round === modalRound && 
              r.timeSlot === modalSelectedTimeSlot && 
              r.tableNumber === newTable && 
              r.seatNumber === newSeat &&
              r.playerAccountNumber !== playerAccountNumber) {
            return { ...r, tableNumber: null, seatNumber: null };
          }
          return r;
        });
      });
      
      setPlayerRegistrations(prevRegs => 
        prevRegs.map(reg => 
          reg.playerAccountNumber === playerAccountNumber && reg.round === playerRound && !reg.isMulligan
            ? { ...reg, tableNumber: newTable, seatNumber: newSeat, timeSlot: modalSelectedTimeSlot }
            : reg
        )
      );
      
      setSelectedPlayerInModal(null);
      setPlayerNeedsReseating(false);
      setSelectedSeatInModal(null);
      setShowSeatingModal(false);
      
      toast.success(`${selectedPlayerInModal.firstName} moved successfully.`);
    }
  };

  const handleTimeSlotChange = (newTimeSlot) => {
    if (!selectedPlayerInModal) return;
    
    const newTimeSlotInt = parseInt(newTimeSlot);
    
    if (newTimeSlotInt === modalTimeSlot) {
      return;
    }
    
    const roundName = rounds.find(r => r.key === modalRound)?.name;
    const oldTimeSlotName = getTimeSlotName(modalRound, modalTimeSlot);
    const newTimeSlotName = getTimeSlotName(modalRound, newTimeSlotInt);
    const confirmed = window.confirm(
      `Move ${selectedPlayerInModal.firstName} from ${oldTimeSlotName} to ${newTimeSlotName} in ${roundName}? This will remove their current seating.`
    );
    
    if (confirmed) {
      setRegistrations(prevRegistrations => {
        return prevRegistrations.map(r => {
          if (r.playerAccountNumber === selectedPlayerInModal.playerAccountNumber && 
              r.round === selectedPlayerInModal.round && 
              !r.isMulligan) {
            return { 
              ...r, 
              timeSlot: newTimeSlotInt,
              tableNumber: null, 
              seatNumber: null 
            };
          }
          return r;
        });
      });
      
      setModalSelectedTimeSlot(newTimeSlotInt);
      setModalTimeSlot(newTimeSlotInt);
      setPlayerNeedsReseating(true);
      setSelectedSeatInModal(null);
      
      const updatedPlayer = { ...selectedPlayerInModal, timeSlot: newTimeSlotInt, tableNumber: null, seatNumber: null };
      setSelectedPlayerInModal(updatedPlayer);
      setPlayerRegistrations([updatedPlayer]);
      
      toast.success(`${selectedPlayerInModal.firstName} moved to ${newTimeSlotName}.`);
    }
  };

  // FIXED: Prevent closing modal if player needs reseating OR has pending changes
  const handleCloseModal = () => {
    // Check if player needs reseating (time slot changed but no seat confirmed)
    if (playerNeedsReseating && !selectedSeatInModal) {
      toast.error('Please select a new seat before closing. The player currently has no seat assigned.');
      return;
    }
    
    // Check if player has selected a seat but hasn't confirmed it yet
    if (selectedSeatInModal && playerNeedsReseating) {
      toast.error('Please click "Confirm Seat" to save the seat assignment before closing.');
      return;
    }
    
    setShowSeatingModal(false);
    setSelectedSeatInModal(null);
    setPlayerNeedsReseating(false);
  };

  // FIXED: Add escape key handler that respects the same rules
  React.useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showSeatingModal) {
        event.preventDefault();
        // Inline the close logic to avoid dependency issues
        
        // Check if player needs reseating (time slot changed but no seat confirmed)
        if (playerNeedsReseating && !selectedSeatInModal) {
          toast.error('Please select a new seat before closing. The player currently has no seat assigned.');
          return;
        }
        
        // Check if player has selected a seat but hasn't confirmed it yet
        if (selectedSeatInModal && playerNeedsReseating) {
          toast.error('Please click "Confirm Seat" to save the seat assignment before closing.');
          return;
        }
        
        setShowSeatingModal(false);
        setSelectedSeatInModal(null);
        setPlayerNeedsReseating(false);
      }
    };

    if (showSeatingModal) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [showSeatingModal, playerNeedsReseating, selectedSeatInModal]);

  const EditableSeatingModal = () => {
    if (!showSeatingModal || !modalRound || !modalSelectedTimeSlot) return null;
    const roundName = rounds.find(r => r.key === modalRound)?.name;
    const currentRound = rounds.find(r => r.key === modalRound);
    const availableTimeSlots = Array.from({ length: currentRound?.timeSlots || 1 }, (_, i) => i + 1);
    
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '1000px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #ddd' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }} className="round-info">{roundName} - Edit Seating</h3>
            {/* FIXED: Show different close button styling when disabled */}
            <button 
              onClick={handleCloseModal} 
              className={`btn-close ${(playerNeedsReseating && !selectedSeatInModal) || (selectedSeatInModal && playerNeedsReseating) ? 'btn-close-disabled' : ''}`}
              style={{
                opacity: (playerNeedsReseating && !selectedSeatInModal) || (selectedSeatInModal && playerNeedsReseating) ? 0.5 : 1,
                cursor: (playerNeedsReseating && !selectedSeatInModal) || (selectedSeatInModal && playerNeedsReseating) ? 'not-allowed' : 'pointer'
              }}
              title={
                playerNeedsReseating && !selectedSeatInModal 
                  ? 'Please select a seat before closing' 
                  : selectedSeatInModal && playerNeedsReseating 
                    ? 'Please confirm seat assignment before closing'
                    : 'Close'
              }
            >
              ×
            </button>
          </div>
          
          {/* FIXED: Show warning message when player needs reseating */}
          {playerNeedsReseating && !selectedSeatInModal && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: '#f8d7da', 
              border: '1px solid #f5c6cb', 
              borderRadius: '4px',
              color: '#721c24'
            }}>
              <strong>⚠️ Action Required:</strong> {selectedPlayerInModal?.firstName} needs a new seat assignment. Please select a seat before closing this window.
            </div>
          )}
          
          {/* FIXED: Show different warning when seat is selected but not confirmed */}
          {selectedSeatInModal && playerNeedsReseating && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: '#f8d7da', 
              border: '1px solid #f5c6cb', 
              borderRadius: '4px',
              color: '#721c24'
            }}>
              <strong>📍 Confirmation Required:</strong> You've selected Table {selectedSeatInModal.table}, Seat {selectedSeatInModal.seat} for {selectedPlayerInModal?.firstName}. Click "Confirm Seat" to save this assignment.
            </div>
          )}
          
          {selectedPlayerInModal && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span className="player-name-secondary">{selectedPlayerInModal.firstName} {selectedPlayerInModal.lastName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: '600' }}>Time Slot:</label>
                  <select 
                    value={modalSelectedTimeSlot} 
                    onChange={(e) => handleTimeSlotChange(e.target.value)}
                    className="select-field" 
                    style={{ width: 'auto', minWidth: '150px' }}
                  >
                    {availableTimeSlots.map(slot => (
                      <option key={slot} value={slot}>{getTimeSlotName(modalRound, slot)}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={handleConfirmSeat} 
                  className={`btn btn-success ${!selectedSeatInModal ? 'btn-disabled' : ''}`}
                  disabled={!selectedSeatInModal}
                >
                  Confirm Seat
                </button>
              </div>
              {selectedSeatInModal ? (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                  Selected: Table {selectedSeatInModal.table}, Seat {selectedSeatInModal.seat}. Click "Confirm Seat" to assign.
                </p>
              ) : (
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#666' }}>Click a seat to select it.</p>
              )}
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
            {[1, 2, 3, 4, 5, 6].map(tableNumber => {
              const isDisabled = isTableDisabled(tableNumber, modalRound, modalSelectedTimeSlot);
              const isPermanentlyDisabled = modalRound === 'semifinals' && tableNumber === 6;

              return (
                <div key={tableNumber} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '16px', backgroundColor: '#f2f2f2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Table {tableNumber}</h4>
                  </div>
                  {isDisabled ? (
                    <div style={{ height: '80px', boxSizing: 'border-box', borderRadius: '4px', backgroundColor: '#666666', border: '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {isPermanentlyDisabled ? 'Table Disabled (Semifinals)' : 'Table Disabled'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5, 6].map(seatNumber => {
                        const player = getPlayerAtSeat(tableNumber, seatNumber, modalRound, modalSelectedTimeSlot);
                        const isCurrentPlayer = selectedPlayerInModal && selectedPlayerInModal.playerAccountNumber === player?.playerAccountNumber;
                        const isSelectedSeat = selectedSeatInModal && selectedSeatInModal.table === tableNumber && selectedSeatInModal.seat === seatNumber;
                        
                        let backgroundColor = '#ffffff';
                        let textColor = '#000';
                        let borderColor = '#ccc';
                        
                        if (isSelectedSeat) { 
                          backgroundColor = '#8b0000'; 
                          textColor = '#ffffff'; 
                          borderColor = '#8b0000';
                        } else if (isCurrentPlayer) {
                          backgroundColor = '#8b0000'; 
                          textColor = '#ffffff'; 
                          borderColor = '#8b0000';
                        } else if (player) { 
                          backgroundColor = '#666666'; 
                          textColor = '#ffffff'; 
                          borderColor = '#ccc';
                        }
                        
                        return (
                          <div 
                            key={seatNumber} 
                            onClick={() => handleSeatClickInModal(tableNumber, seatNumber)} 
                            style={{ 
                              minHeight: '60px', 
                              minWidth: '80px', 
                              border: `2px solid ${borderColor}`, 
                              borderRadius: '4px', 
                              padding: '8px', 
                              backgroundColor, 
                              color: textColor, 
                              textAlign: 'center', 
                              cursor: 'pointer', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              justifyContent: 'center', 
                              alignItems: 'center', 
                              fontSize: '0.8rem', 
                              flex: 1 
                            }}
                          >
                            <div className="seat-label" style={{ color: textColor, fontWeight: 'bold', marginBottom: '2px' }}>Seat {seatNumber}</div>
                            {player ? (
                              isCurrentPlayer ? (
                                <div className="player-name-compact" style={{ color: textColor }}>CURRENT SEAT</div>
                              ) : (
                                <div className="player-name-compact" style={{ color: textColor }}>{player.firstName} {player.lastName}</div>
                              )
                            ) : (
                              <div style={{ color: textColor }}>Empty</div>
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
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div className="form-group">
          <label className="mb-2">Search Player</label>
          <SearchBar 
            searchValue={searchTerm} 
            onSearchChange={setSearchTerm} 
            onSearch={searchPlayers} 
            placeholder="Enter name or account number" 
          />
        </div>
      </div>

      {playerRegistrations.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div className="player-info-container">
            <h3 className="player-name-with-account">
              {playerRegistrations[0].firstName} {playerRegistrations[0].lastName}
              <span className="account-part">, {playerRegistrations[0].playerAccountNumber}</span>
            </h3>
          </div>
          {playerRegistrations.map(reg => {
            const roundInfo = rounds.find(r => r.key === reg.round);
            const timeSlotName = getTimeSlotName(reg.round, reg.timeSlot);
            return (
              <div key={reg.id} style={{ backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
                <div className="card-content" style={{ paddingBottom: '0' }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>{roundInfo?.name} - {timeSlotName}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p className="player-metadata" style={{ margin: 0 }}>
                      Current Seat: {(reg.tableNumber != null && reg.seatNumber != null) ? `Table ${reg.tableNumber}, Seat ${reg.seatNumber}` : 'Not Seated'}
                    </p>
                    <button onClick={() => showFullSeating(reg.round, reg.timeSlot, reg)} className="btn btn-primary">
                      Edit Seating
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <EditableSeatingModal />
    </div>
  );
};

export default PlayerSeatEdit;