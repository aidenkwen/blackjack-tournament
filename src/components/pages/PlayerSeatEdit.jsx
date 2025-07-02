
// ============================================================================
// COMPLETE FIXED PlayerSeatEdit.js with robust search
// ============================================================================

import React, { useState } from 'react';
import { UC } from '../../utils/formatting';
import SearchBar from '../common/SearchBar';

const PlayerSeatEdit = ({ 
  tournament, 
  registrations, 
  setRegistrations, 
  allRegistrations,
  globalDisabledTables,
  setGlobalDisabledTables
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [playerRegistrations, setPlayerRegistrations] = useState([]);
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [modalRound, setModalRound] = useState(null);
  const [modalTimeSlot, setModalTimeSlot] = useState(null);
  const [selectedPlayerInModal, setSelectedPlayerInModal] = useState(null);
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

  const getDisabledKey = (round, timeSlot, tableNumber) => `${tournament.name}-${round}-${timeSlot}-${tableNumber}`;

  const isTableDisabled = (tableNumber, round, timeSlot) => {
    // Auto-disable table 6 in semifinals
    if (round === 'semifinals' && tableNumber === 6) {
      return true;
    }
    
    const key = getDisabledKey(round, timeSlot, tableNumber);
    return globalDisabledTables[key] || false;
  };

  // FIXED: Robust search function that handles null/undefined values properly
  const searchPlayers = () => {
    // Ensure searchTerm is always a string and handle null/undefined
    const searchTermString = String(searchTerm || '').trim();
    
    if (!searchTermString) {
      alert('Please enter a search term.');
      return;
    }

    // Make search more robust to handle null/undefined data
    const found = registrations.filter(r => {
      // Ensure the registration belongs to the current tournament
      if (!r || r.eventName !== tournament.name) return false;

      // Only search primary registrations, not rebuys or mulligans
      if (r.isRebuy || r.isMulligan) return false;

      const term = searchTermString.toLowerCase();
      
      // Safely check each field with proper null/undefined handling
      const firstName = r.firstName ? String(r.firstName).toLowerCase() : '';
      const lastName = r.lastName ? String(r.lastName).toLowerCase() : '';
      const accountNumber = r.playerAccountNumber ? String(r.playerAccountNumber) : '';

      const matchesFirstName = firstName.includes(term);
      const matchesLastName = lastName.includes(term);
      const matchesAccount = accountNumber.includes(searchTermString);

      return matchesFirstName || matchesLastName || matchesAccount;
    });

    if (found.length === 0) {
      alert('No players found matching your search.');
      setPlayerRegistrations([]);
      return;
    }

    // Group by player account number
    const playerGroups = {};
    found.forEach(reg => {
      const key = reg.playerAccountNumber;
      if (!playerGroups[key]) playerGroups[key] = [];
      playerGroups[key].push(reg);
    });

    if (Object.keys(playerGroups).length > 1) {
      const playerList = Object.values(playerGroups).map((group, i) => {
        const player = group[0];
        const firstName = player.firstName || 'Unknown';
        const lastName = player.lastName || 'Unknown';
        const accountNumber = player.playerAccountNumber || 'Unknown';
        return `${i + 1}. ${firstName} ${lastName} (${accountNumber})`;
      }).join('\n');
      
      const choice = prompt(`Multiple players found:\n\n${playerList}\n\nEnter the number of the player you want to edit:`);
      const index = parseInt(choice) - 1;
      const playerGroupsArray = Object.values(playerGroups);
      
      if (index >= 0 && index < playerGroupsArray.length) {
        setPlayerRegistrations(playerGroupsArray[index]);
      } else {
        alert('Invalid selection.');
        setPlayerRegistrations([]);
      }
    } else {
      setPlayerRegistrations(Object.values(playerGroups)[0]);
    }
  };

  const showFullSeating = (round, timeSlot) => {
    setModalRound(round);
    setModalTimeSlot(timeSlot);
    setShowSeatingModal(true);
    setSelectedPlayerInModal(null);
    setSelectedSeatInModal(null);
  };

  const getPlayerAtSeat = (tableNumber, seatNumber, round, timeSlot) => {
    return registrations.find(r =>
      r.eventName === tournament.name &&
      r.round === round &&
      r.timeSlot === timeSlot &&
      r.tableNumber === tableNumber &&
      r.seatNumber === seatNumber
    );
  };

  const handleSeatClickInModal = (tableNumber, seatNumber) => {
    if (isTableDisabled(tableNumber, modalRound, modalTimeSlot)) return;
    
    const player = getPlayerAtSeat(tableNumber, seatNumber, modalRound, modalTimeSlot);
    
    if (player) {
      // Player clicked - select them for moving
      setSelectedPlayerInModal(player);
      setSelectedSeatInModal(null);
    } else {
      // Empty seat clicked
      if (selectedPlayerInModal) {
        // Move the selected player to this seat
        confirmSeatMove(selectedPlayerInModal, tableNumber, seatNumber);
      } else {
        setSelectedSeatInModal({ table: tableNumber, seat: seatNumber });
      }
    }
  };

  const confirmSeatMove = (player, newTable, newSeat) => {
    const roundName = rounds.find(r => r.key === modalRound)?.name;
    
    const confirmed = window.confirm(
      `Move ${player.firstName || 'Unknown'} ${player.lastName || 'Unknown'} to Table ${newTable}, Seat ${newSeat} in ${roundName}?`
    );

    if (confirmed) {
      const updatedRegistrations = allRegistrations.map(r => {
        // Move the selected player
        if (r.id === player.id) {
          return { 
            ...r, 
            tableNumber: newTable,
            seatNumber: newSeat
          };
        }
        
        // Evict anyone currently in the target seat
        if (
          r.id !== player.id &&
          r.round === modalRound &&
          r.timeSlot === modalTimeSlot &&
          r.tableNumber === newTable &&
          r.seatNumber === newSeat
        ) {
          return { ...r, tableNumber: null, seatNumber: null };
        }
        
        return r;
      });

      setRegistrations(updatedRegistrations);
      setSelectedPlayerInModal(null);
      setSelectedSeatInModal(null);
      
      alert(`${player.firstName || 'Unknown'} ${player.lastName || 'Unknown'} moved successfully.`);
    }
  };

  const removePlayerFromSeat = (player) => {
    const roundName = rounds.find(r => r.key === modalRound)?.name;
    
    const confirmed = window.confirm(
      `Remove ${player.firstName || 'Unknown'} ${player.lastName || 'Unknown'} from their seat in ${roundName}?`
    );

    if (confirmed) {
      const updatedRegistrations = allRegistrations.map(r => {
        if (r.id === player.id) {
          return { ...r, tableNumber: null, seatNumber: null };
        }
        return r;
      });

      setRegistrations(updatedRegistrations);
      setSelectedPlayerInModal(null);
      alert(`${player.firstName || 'Unknown'} ${player.lastName || 'Unknown'} removed from seat.`);
    }
  };

  const EditableSeatingModal = () => {
    if (!showSeatingModal || !modalRound || !modalTimeSlot) return null;
    const roundName = rounds.find(r => r.key === modalRound)?.name;
    
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', maxWidth: '95%', maxHeight: '90%', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }} className="round-info">{roundName} - Time Slot {modalTimeSlot} - Edit Seating</h3>
            <button 
              onClick={() => {
                setShowSeatingModal(false);
                setSelectedPlayerInModal(null);
                setSelectedSeatInModal(null);
              }} 
              style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
          
          {selectedPlayerInModal && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f8ff', border: '1px solid #ccc', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <strong>Selected:</strong> 
                  <span className="player-name-secondary"> {selectedPlayerInModal.firstName || 'Unknown'} {selectedPlayerInModal.lastName || 'Unknown'}</span>
                  {selectedPlayerInModal.tableNumber && selectedPlayerInModal.seatNumber && 
                    <span className="player-metadata"> (Table {selectedPlayerInModal.tableNumber}, Seat {selectedPlayerInModal.seatNumber})</span>
                  }
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => removePlayerFromSeat(selectedPlayerInModal)}
                    className="btn"
                    style={{ fontSize: '0.8rem', backgroundColor: '#dc3545', color: '#ffffff', border: 'none', padding: '4px 8px' }}
                  >
                    Remove from Seat
                  </button>
                  <button 
                    onClick={() => setSelectedPlayerInModal(null)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#666' }}>
                Click on an empty seat to move this player there.
              </p>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3, 4, 5, 6].map(tableNumber => {
              if (isTableDisabled(tableNumber, modalRound, modalTimeSlot)) {
                return (
                  <div key={tableNumber} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px', backgroundColor: '#f2f2f2' }}>
                    <h4 style={{ margin: '0 0 8px 0' }}>Table {tableNumber}</h4>
                    <div style={{ 
                      height: '60px', 
                      backgroundColor: '#666666',
                      border: '2px solid #ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
                    }}>
                      {modalRound === 'semifinals' && tableNumber === 6 ? 'Table Disabled (Semifinals)' : 'Table Disabled'}
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={tableNumber} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '12px', backgroundColor: '#f2f2f2' }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>Table {tableNumber}</h4>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5, 6].map(seatNumber => {
                      const player = getPlayerAtSeat(tableNumber, seatNumber, modalRound, modalTimeSlot);
                      const isSelected = selectedPlayerInModal && selectedPlayerInModal.id === player?.id;
                      const isTargetSeat = selectedSeatInModal?.table === tableNumber && selectedSeatInModal?.seat === seatNumber;
                      
                      let backgroundColor = '#ffffff';
                      let textColor = '#000';
                      let borderColor = '#ccc';
                      
                      if (player) {
                        if (isSelected) {
                          backgroundColor = '#ffd700'; // Gold for selected player
                          textColor = '#000';
                          borderColor = '#ffd700';
                        } else {
                          backgroundColor = '#666666';
                          textColor = '#ffffff';
                        }
                      } else if (isTargetSeat) {
                        backgroundColor = '#8b0000';
                        textColor = '#ffffff';
                        borderColor = '#8b0000';
                      }
                      
                      return (
                        <div 
                          key={seatNumber} 
                          onClick={() => handleSeatClickInModal(tableNumber, seatNumber)}
                          style={{ 
                            minHeight: '50px', 
                            minWidth: '70px', 
                            border: `2px solid ${borderColor}`, 
                            borderRadius: '4px', 
                            padding: '6px', 
                            backgroundColor, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            fontSize: '0.75rem', 
                            textAlign: 'center', 
                            flex: 1,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          title={
                            player 
                              ? `${player.firstName || 'Unknown'} ${player.lastName || 'Unknown'} - Click to select`
                              : selectedPlayerInModal 
                                ? 'Click to move selected player here'
                                : 'Empty seat'
                          }
                        >
                          <div className="seat-label" style={{ color: textColor }}>
                            Seat {seatNumber}
                          </div>
                          {player ? (
                            <div className="player-name-compact" style={{ color: textColor }}>
                              {player.firstName || 'Unknown'} {player.lastName || 'Unknown'}
                            </div>
                          ) : (
                            <div style={{ color: textColor === '#ffffff' ? textColor : '#999', fontSize: '0.7rem' }}>
                              Empty
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ marginTop: '16px', fontSize: '0.85rem', color: '#666' }}>
            <p style={{ margin: '4px 0' }}><strong>Instructions:</strong></p>
            <p style={{ margin: '4px 0' }}>• Click on a player to select them for moving</p>
            <p style={{ margin: '4px 0' }}>• Click on an empty seat to move the selected player there</p>
            <p style={{ margin: '4px 0' }}>• Use "Remove from Seat" to unseat a player</p>
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
            onSearchChange={(value) => setSearchTerm(UC(value))} 
            onSearch={searchPlayers} 
            placeholder="Enter name, account number, or swipe card" 
            onCardSwipe={(cardNumber) => { 
              setSearchTerm(UC(cardNumber)); 
              setTimeout(() => searchPlayers(), 100); 
            }}
          />
        </div>
      </div>

      {playerRegistrations.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div className="player-info-container">
            <h3 className="player-name-with-account">
              {playerRegistrations[0].firstName || 'Unknown'} {playerRegistrations[0].lastName || 'Unknown'}<span className="account-part">, {playerRegistrations[0].playerAccountNumber || 'Unknown'}</span>
            </h3>
          </div>
          {playerRegistrations.map((reg) => {
            const roundName = rounds.find(r => r.key === reg.round)?.name;
            return (
              <div key={reg.id} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 className="round-info">{roundName} - Time Slot {reg.timeSlot}</h4>
                  <button 
                    onClick={() => showFullSeating(reg.round, reg.timeSlot)} 
                    className="btn" 
                    style={{ fontSize: '0.8rem', backgroundColor: '#8b0000', color: '#ffffff', border: 'none', padding: '4px 8px' }}
                  >
                    Edit Seating
                  </button>
                </div>
                <p className="player-metadata">
                  Current Seating: {reg.tableNumber && reg.seatNumber 
                    ? `Table ${reg.tableNumber}, Seat ${reg.seatNumber}` 
                    : 'Not seated'}
                </p>
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