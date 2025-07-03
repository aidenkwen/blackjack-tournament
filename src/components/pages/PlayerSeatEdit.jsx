import React, { useState } from 'react';
import SearchBar from '../common/SearchBar';
import toast from 'react-hot-toast';

const PlayerSeatEdit = ({ 
  tournament, 
  registrations, 
  setRegistrations, 
  allRegistrations,
  globalDisabledTables,
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
    setPlayerNeedsReseating(false); // Reset reseating flag
    setSelectedSeatInModal(null); // Reset selected seat
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
    
    // Set the selected seat for confirmation
    setSelectedSeatInModal({ table: tableNumber, seat: seatNumber });
  };

  const handleConfirmSeat = () => {
    if (!selectedPlayerInModal || !selectedSeatInModal) return;
    
    const { table: newTable, seat: newSeat } = selectedSeatInModal;
    const playerAtTarget = getPlayerAtSeat(newTable, newSeat, modalRound, modalSelectedTimeSlot);
    const currentPlayerId = selectedPlayerInModal.id;
    const playerName = selectedPlayerInModal.firstName;
    const playerAccountNumber = selectedPlayerInModal.playerAccountNumber;
    const playerRound = selectedPlayerInModal.round;
    
    const roundName = rounds.find(r => r.key === modalRound)?.name;
    const timeSlotName = getTimeSlotName(modalRound, modalSelectedTimeSlot);
    
    let confirmMessage = `Move ${selectedPlayerInModal.firstName} to Table ${newTable}, Seat ${newSeat} in ${roundName}, ${timeSlotName}?`;
    if (playerAtTarget && playerAtTarget.id !== selectedPlayerInModal.id) {
      confirmMessage += `\n\nThis will remove ${playerAtTarget.firstName} ${playerAtTarget.lastName} from this seat.`;
    }
    
    const confirmed = window.confirm(confirmMessage);
    
    if (confirmed) {
      const updatedRegistrations = allRegistrations.map(r => {
        if (r.id === currentPlayerId) {
          return { 
            ...r, 
            tableNumber: newTable, 
            seatNumber: newSeat,
            timeSlot: modalSelectedTimeSlot
          };
        }
        if (r.id !== currentPlayerId && 
            r.round === modalRound && 
            r.timeSlot === modalSelectedTimeSlot && 
            r.tableNumber === newTable && 
            r.seatNumber === newSeat) {
          return { ...r, tableNumber: null, seatNumber: null };
        }
        return r;
      });
      
      // Update global registrations
      setRegistrations(updatedRegistrations);
      
      // Update playerRegistrations immediately with the new data
      // Find the updated registration by player account and round (more reliable than ID)
      const updatedPlayerReg = updatedRegistrations.find(r => 
        r.playerAccountNumber === playerAccountNumber && 
        r.round === playerRound && 
        !r.isMulligan
      );
      
      if (updatedPlayerReg) {
        console.log('Setting updated player reg:', updatedPlayerReg);
        setPlayerRegistrations([updatedPlayerReg]);
      }
      
      // Clear modal state
      setSelectedPlayerInModal(null);
      setPlayerNeedsReseating(false);
      setSelectedSeatInModal(null);
      setShowSeatingModal(false);
      
      toast.success(`${playerName} moved successfully.`);
    }
  };

  const handleTimeSlotChange = (newTimeSlot) => {
    if (!selectedPlayerInModal) return;
    
    const newTimeSlotInt = parseInt(newTimeSlot);
    
    // If the time slot isn't actually changing, don't do anything
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
      const updatedRegistrations = allRegistrations.map(r => {
        if (r.id === selectedPlayerInModal.id) {
          return { 
            ...r, 
            timeSlot: newTimeSlotInt,
            tableNumber: null, 
            seatNumber: null 
          };
        }
        return r;
      });
      
      setRegistrations(updatedRegistrations);
      setModalSelectedTimeSlot(newTimeSlotInt);
      setModalTimeSlot(newTimeSlotInt);
      setPlayerNeedsReseating(true); // Set flag when player needs reseating
      setSelectedSeatInModal(null); // Clear selected seat when time slot changes
      
      const updatedPlayer = updatedRegistrations.find(r => r.id === selectedPlayerInModal.id);
      setSelectedPlayerInModal(updatedPlayer);
      
      if (updatedPlayer) {
        setPlayerRegistrations([updatedPlayer]);
      }
      
      toast.success(`${selectedPlayerInModal.firstName} moved to ${newTimeSlotName}.`);
    }
  };

  const handleCloseModal = () => {
    if (playerNeedsReseating && !selectedSeatInModal) {
      toast.error('Please select a new seat before closing. The player currently has no seat assigned.');
      return;
    }
    setShowSeatingModal(false);
  };

  const EditableSeatingModal = () => {
    if (!showSeatingModal || !modalRound || !modalSelectedTimeSlot) return null;
    const roundName = rounds.find(r => r.key === modalRound)?.name;
    const currentRound = rounds.find(r => r.key === modalRound);
    const availableTimeSlots = Array.from({ length: currentRound?.timeSlots || 1 }, (_, i) => i + 1);
    
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '1000px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }} className="round-info">{roundName} - Edit Seating</h3>
            <button onClick={handleCloseModal} className="btn-close">×</button>
          </div>
          
          {selectedPlayerInModal && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span><span className="player-name-secondary">{selectedPlayerInModal.firstName} {selectedPlayerInModal.lastName}</span></span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={handleConfirmSeat} 
                    className={`btn btn-success ${!selectedSeatInModal ? 'btn-disabled' : ''}`}
                    disabled={!selectedSeatInModal}
                  >
                    Confirm Seat
                  </button>
                </div>
              </div>
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
            {[1, 2, 3, 4, 5, 6].map(tableNumber => (
              <div key={tableNumber}>
                <h4 style={{marginTop: 0}}>Table {tableNumber}</h4>
                {isTableDisabled(tableNumber, modalRound, modalSelectedTimeSlot) ? (
                  <div style={{ height: '80px', boxSizing: 'border-box', borderRadius: '4px', backgroundColor: '#666666', border: '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.9rem', fontWeight: 'bold' }}>Table Disabled</div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5, 6].map(seatNumber => {
                      const player = getPlayerAtSeat(tableNumber, seatNumber, modalRound, modalSelectedTimeSlot);
                      const isCurrentPlayer = selectedPlayerInModal && selectedPlayerInModal.id === player?.id;
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
                        <div key={seatNumber} onClick={() => handleSeatClickInModal(tableNumber, seatNumber)} style={{ minHeight: '60px', minWidth: '80px', border: `2px solid ${borderColor}`, borderRadius: '4px', padding: '8px', backgroundColor, color: textColor, textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', fontSize: '0.8rem', flex: 1 }}>
                          <div className="seat-label" style={{ color: textColor, fontWeight: 'bold', marginBottom: '2px' }}>Seat {seatNumber}</div>
                          {player ? (
                            <div className="player-name-compact" style={{ color: textColor }}>{player.firstName} {player.lastName}</div>
                          ) : (
                            <div style={{ color: textColor }}>Empty</div>
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
                <div className="card-content" style={{ paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0 }}>{roundInfo?.name} - {timeSlotName}</h4>
                    <button onClick={() => showFullSeating(reg.round, reg.timeSlot, reg)} className="btn btn-secondary">
                      Edit Seating
                    </button>
                  </div>
                  <p className="player-metadata" style={{ marginTop: '8px', marginBottom: 0 }}>
                    Current Seat: {(reg.tableNumber != null && reg.seatNumber != null) ? `Table ${reg.tableNumber}, Seat ${reg.seatNumber}` : 'Not Seated'}
                  </p>
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