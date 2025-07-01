import React, { useState } from 'react';
import { UC } from '../../utils/formatting';

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
  const [selectedRegistrations, setSelectedRegistrations] = useState({});
  const [originalSeating, setOriginalSeating] = useState({});
  const [showSeatingModal, setShowSeatingModal] = useState(false);
  const [modalRound, setModalRound] = useState(null);
  const [modalTimeSlot, setModalTimeSlot] = useState(null);

  const rounds = [
    { key: 'round1', name: 'Round 1', timeSlots: 6 },
    { key: 'rebuy1', name: 'Rebuy 1', timeSlots: 1 },
    { key: 'rebuy2', name: 'Rebuy 2', timeSlots: 1 },
    { key: 'round2', name: 'Round 2', timeSlots: 3 },
    { key: 'superrebuy', name: 'Super Rebuy', timeSlots: 2 },
    { key: 'quarterfinals', name: 'Quarterfinals', timeSlots: 2 },
    { key: 'semifinals', name: 'Semifinals', timeSlots: 1 }
  ];

  const getDisabledKey = (round, timeSlot, tableNumber) => `${tournament.name}-${round}-${timeSlot}-${tableNumber}`;

  const isTableDisabled = (tableNumber, round, timeSlot) => {
    const key = getDisabledKey(round, timeSlot, tableNumber);
    return globalDisabledTables[key] || false;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchPlayers();
    }
  };

  const searchPlayers = () => {
    if (!searchTerm.trim()) {
      alert('Please enter a search term.');
      return;
    }

    // Find all registrations for this player across all rounds
    // Filter out duplicate registrations by only taking the primary registration for each round
    const found = registrations.filter(r => 
      r.eventName === tournament.name &&
      !r.isRebuy && // Only primary registrations, not rebuys
      !r.isMulligan && // Only primary registrations, not mulligans
      (r.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       r.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       r.playerAccountNumber.includes(searchTerm))
    );

    if (found.length === 0) {
      alert('No players found matching your search.');
      setPlayerRegistrations([]);
      setSelectedRegistrations({});
      setOriginalSeating({});
      return;
    }

    // Group registrations by player account number
    const playerGroups = {};
    found.forEach(reg => {
      const key = reg.playerAccountNumber;
      if (!playerGroups[key]) {
        playerGroups[key] = [];
      }
      playerGroups[key].push(reg);
    });

    // If multiple players found, let user choose
    if (Object.keys(playerGroups).length > 1) {
      const playerList = Object.values(playerGroups).map((group, i) => {
        const player = group[0];
        return `${i + 1}. ${player.firstName} ${player.lastName} (${player.playerAccountNumber})`;
      }).join('\n');
      
      const choice = prompt(`Multiple players found:\n\n${playerList}\n\nEnter the number of the player you want to edit:`);
      const index = parseInt(choice) - 1;
      const playerGroupsArray = Object.values(playerGroups);
      
      if (index >= 0 && index < playerGroupsArray.length) {
        setupPlayerRegistrations(playerGroupsArray[index]);
      }
    } else {
      // Single player found
      setupPlayerRegistrations(Object.values(playerGroups)[0]);
    }
  };

  const setupPlayerRegistrations = (regs) => {
    setPlayerRegistrations(regs);
    
    // Initialize selected registrations with current seating
    const selected = {};
    const original = {};
    
    regs.forEach(reg => {
      selected[reg.id] = {
        tableNumber: reg.tableNumber,
        seatNumber: reg.seatNumber
      };
      original[reg.id] = {
        tableNumber: reg.tableNumber,
        seatNumber: reg.seatNumber
      };
    });
    
    setSelectedRegistrations(selected);
    setOriginalSeating(original);
  };

  const updateRegistrationSeating = (regId, updates) => {
    setSelectedRegistrations(prev => ({
      ...prev,
      [regId]: { ...prev[regId], ...updates }
    }));
  };

  const hasChanges = (regId) => {
    const original = originalSeating[regId];
    const selected = selectedRegistrations[regId];
    
    if (!original || !selected) return false;
    
    return (
      original.tableNumber !== selected.tableNumber ||
      original.seatNumber !== selected.seatNumber
    );
  };

  const canUpdate = (regId) => {
    const selected = selectedRegistrations[regId];
    return selected && selected.tableNumber && selected.seatNumber && hasChanges(regId);
  };

  const confirmSeatingUpdate = (regId) => {
    const reg = playerRegistrations.find(r => r.id === regId);
    const selected = selectedRegistrations[regId];
    const roundName = rounds.find(r => r.key === reg.round)?.name;

    const confirmed = window.confirm(
      `Update ${reg.firstName} ${reg.lastName}'s seating for ${roundName} to Table ${selected.tableNumber}, Seat ${selected.seatNumber}?`
    );

    if (confirmed) {
      const updatedRegistrations = allRegistrations.map(r => {
        if (r.id === regId) {
          return { 
            ...r, 
            tableNumber: selected.tableNumber,
            seatNumber: selected.seatNumber
          };
        }
        return r;
      });

      setRegistrations(updatedRegistrations);
      
      // Update original seating to match new seating
      setOriginalSeating(prev => ({
        ...prev,
        [regId]: { ...selected }
      }));
      
      alert('Player seating updated successfully.');
    }
  };

  const showFullSeating = (round, timeSlot) => {
    setModalRound(round);
    setModalTimeSlot(timeSlot);
    setShowSeatingModal(true);
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

  const getAvailableSeats = (round, timeSlot, tableNumber, currentRegId) => {
    if (!round || !timeSlot || !tableNumber) return [];
    
    // Check if table is disabled
    if (isTableDisabled(tableNumber, round, timeSlot)) return [];
    
    const occupiedSeats = registrations
      .filter(r => 
        r.eventName === tournament.name &&
        r.round === round &&
        r.timeSlot === timeSlot &&
        r.tableNumber === tableNumber &&
        r.id !== currentRegId
      )
      .map(r => r.seatNumber);

    return [1, 2, 3, 4, 5, 6].filter(seat => !occupiedSeats.includes(seat));
  };

  const getAvailableTables = (round, timeSlot) => {
    return [1, 2, 3, 4, 5, 6].filter(table => !isTableDisabled(table, round, timeSlot));
  };

  // Modal component
  const SeatingModal = () => {
    if (!showSeatingModal || !modalRound || !modalTimeSlot) return null;

    const roundName = rounds.find(r => r.key === modalRound)?.name;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          maxWidth: '90%',
          maxHeight: '90%',
          overflow: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>{roundName} - Time Slot {modalTimeSlot} - Full Seating</h3>
            <button 
              onClick={() => setShowSeatingModal(false)}
              style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3, 4, 5, 6].map(tableNumber => {
              if (isTableDisabled(tableNumber, modalRound, modalTimeSlot)) return null;
              
              return (
                <div key={tableNumber} style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '12px',
                  backgroundColor: '#f2f2f2'
                }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>Table {tableNumber}</h4>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5, 6].map(seatNumber => {
                      const player = getPlayerAtSeat(tableNumber, seatNumber, modalRound, modalTimeSlot);
                      
                      return (
                        <div
                          key={seatNumber}
                          style={{
                            minHeight: '50px',
                            minWidth: '70px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '6px',
                            backgroundColor: player ? '#666666' : '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            flex: 1
                          }}
                        >
                          <div style={{ fontWeight: 'bold', marginBottom: '2px', color: player ? '#ffffff' : '#000' }}>
                            Seat {seatNumber}
                          </div>
                          {player ? (
                            <div style={{ color: '#ffffff', fontSize: '0.7rem' }}>
                              {player.firstName} {player.lastName}
                            </div>
                          ) : (
                            <div style={{ color: '#999', fontSize: '0.7rem' }}>Empty</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(UC(e.target.value))}
              onKeyPress={handleKeyPress}
              className="input-field"
              placeholder="Enter name or account number"
              style={{ flex: 1 }}
            />
            <button onClick={searchPlayers} className="btn btn-primary">
              Search
            </button>
          </div>
        </div>
      </div>

      {playerRegistrations.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>
              {playerRegistrations[0].firstName} {playerRegistrations[0].lastName}
            </h3>
            <p style={{ margin: '4px 0 0 0', color: '#666' }}>
              Account: {playerRegistrations[0].playerAccountNumber}
            </p>
          </div>

          {/* Display each registration separately */}
          {playerRegistrations.map((reg) => {
            const regId = reg.id;
            const selected = selectedRegistrations[regId] || {};
            const original = originalSeating[regId] || {};
            const roundName = rounds.find(r => r.key === reg.round)?.name;
            
            return (
              <div key={regId} style={{ 
                marginBottom: '16px', 
                padding: '16px', 
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0 }}>
                    {roundName} - Time Slot {reg.timeSlot}
                  </h4>
                  <button
                    onClick={() => showFullSeating(reg.round, reg.timeSlot)}
                    className="btn"
                    style={{ 
                      fontSize: '0.8rem',
                      backgroundColor: '#8b0000',
                      color: '#ffffff',
                      border: 'none',
                      padding: '4px 8px'
                    }}
                  >
                    View Full Seating
                  </button>
                </div>

                {original.tableNumber && original.seatNumber && (
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#666' }}>
                    Current: Table {original.tableNumber}, Seat {original.seatNumber}
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="mb-2">Table</label>
                    <select
                      value={selected.tableNumber || ''}
                      onChange={(e) => updateRegistrationSeating(regId, { 
                        tableNumber: parseInt(e.target.value) || null,
                        seatNumber: null
                      })}
                      className="select-field"
                    >
                      <option value="">-- Select Table --</option>
                      {getAvailableTables(reg.round, reg.timeSlot).map(table => (
                        <option key={table} value={table}>
                          Table {table}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selected.tableNumber && (
                    <div className="form-group">
                      <label className="mb-2">Seat</label>
                      <select
                        value={selected.seatNumber || ''}
                        onChange={(e) => updateRegistrationSeating(regId, { 
                          seatNumber: parseInt(e.target.value) || null
                        })}
                        className="select-field"
                      >
                        <option value="">-- Select Seat --</option>
                        {getAvailableSeats(reg.round, reg.timeSlot, selected.tableNumber, regId).map(seat => (
                          <option key={seat} value={seat}>
                            Seat {seat}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => confirmSeatingUpdate(regId)}
                    className="btn btn-success"
                    disabled={!canUpdate(regId)}
                    style={{
                      opacity: canUpdate(regId) ? 1 : 0.5,
                      cursor: canUpdate(regId) ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Update Seating
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SeatingModal />
    </div>
  );
};

export default PlayerSeatEdit;