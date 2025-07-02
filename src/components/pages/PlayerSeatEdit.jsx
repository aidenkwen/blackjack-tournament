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

  const rounds = [
    { key: 'round1', name: 'Round 1', timeSlots: 6 }, { key: 'rebuy1', name: 'Rebuy 1', timeSlots: 2 }, { key: 'rebuy2', name: 'Rebuy 2', timeSlots: 1 },
    { key: 'round2', name: 'Round 2', timeSlots: 3 }, { key: 'superrebuy', name: 'Super Rebuy', timeSlots: 2 }, { key: 'quarterfinals', name: 'Quarterfinals', timeSlots: 2 },
    { key: 'semifinals', name: 'Semifinals', timeSlots: 1 }
  ];

  const getDisabledKey = (round, timeSlot, tableNumber) => `${tournament.name}-${round}-${timeSlot}-${tableNumber}`;
  const isTableDisabled = (tableNumber, round, timeSlot) => {
    if (round === 'semifinals' && tableNumber === 6) return true;
    const key = getDisabledKey(round, timeSlot, tableNumber);
    return globalDisabledTables[key] || false;
  };

  const searchPlayers = () => {
    const searchTermString = String(searchTerm || '').trim();
    if (!searchTermString) { toast.error('Please enter a search term.'); return; }
    const foundRegs = registrations.filter(r => {
      if (!r || r.isMulligan) return false;
      const term = searchTermString.toLowerCase();
      return String(r.firstName || '').toLowerCase().includes(term) || String(r.lastName || '').toLowerCase().includes(term) || String(r.playerAccountNumber || '').includes(searchTermString);
    });

    if (foundRegs.length === 0) { toast.error('No players found.'); setPlayerRegistrations([]); return; }
    
    const playerGroups = {};
    foundRegs.forEach(reg => {
      if (!playerGroups[reg.playerAccountNumber]) playerGroups[reg.playerAccountNumber] = [];
      playerGroups[reg.playerAccountNumber].push(reg);
    });
    const uniquePlayers = Object.values(playerGroups).map(group => group[0]);

    if (uniquePlayers.length > 1) {
      const playerList = uniquePlayers.map((p, i) => `${i + 1}. ${p.firstName} ${p.lastName}`).join('\n');
      const choice = prompt(`Multiple players found:\n\n${playerList}\n\nEnter number:`);
      const index = parseInt(choice) - 1;
      if (index >= 0 && index < uniquePlayers.length) {
        const chosenAcct = uniquePlayers[index].playerAccountNumber;
        setPlayerRegistrations(foundRegs.filter(r => r.playerAccountNumber === chosenAcct));
      } else {
        toast.error('Invalid selection.');
        setPlayerRegistrations([]);
      }
    } else {
      setPlayerRegistrations(foundRegs);
    }
  };

  const showFullSeating = (round, timeSlot) => {
    if (!timeSlot) { toast.error("Player must be assigned a time slot to view seating."); return; }
    setModalRound(round);
    setModalTimeSlot(timeSlot);
    setShowSeatingModal(true);
    setSelectedPlayerInModal(null);
  };

  const getPlayerAtSeat = (table, seat, round, timeSlot) => registrations.find(r => r.round === round && r.timeSlot === timeSlot && r.tableNumber === table && r.seatNumber === seat);

  const confirmSeatMove = (player, newTable, newSeat) => {
    const roundName = rounds.find(r => r.key === modalRound)?.name;
    const confirmed = window.confirm(`Move ${player.firstName} to Table ${newTable}, Seat ${newSeat} in ${roundName}?`);
    if (confirmed) {
      const updatedRegistrations = allRegistrations.map(r => {
        if (r.id === player.id) return { ...r, tableNumber: newTable, seatNumber: newSeat };
        if (r.id !== player.id && r.round === modalRound && r.timeSlot === modalTimeSlot && r.tableNumber === newTable && r.seatNumber === newSeat) return { ...r, tableNumber: null, seatNumber: null };
        return r;
      });
      setRegistrations(updatedRegistrations);
      setSelectedPlayerInModal(null);
      toast.success(`${player.firstName} moved successfully.`);
    }
  };
  
  const handleSeatClickInModal = (tableNumber, seatNumber) => {
    if (isTableDisabled(tableNumber, modalRound, modalTimeSlot)) return;
    const playerAtTarget = getPlayerAtSeat(tableNumber, seatNumber, modalRound, modalTimeSlot);
    if (playerAtTarget) setSelectedPlayerInModal(playerAtTarget);
    else if (selectedPlayerInModal) confirmSeatMove(selectedPlayerInModal, tableNumber, seatNumber);
  };

  const removePlayerFromSeat = (player) => {
    const roundName = rounds.find(r => r.key === modalRound)?.name;
    const confirmed = window.confirm(`Remove ${player.firstName} from their seat in ${roundName}?`);
    if (confirmed) {
      const updatedRegistrations = allRegistrations.map(r => {
        if (r.id === player.id) return { ...r, tableNumber: null, seatNumber: null };
        return r;
      });
      setRegistrations(updatedRegistrations);
      setSelectedPlayerInModal(null);
      toast.success(`${player.firstName} removed from seat.`);
    }
  };

  const EditableSeatingModal = () => {
    if (!showSeatingModal || !modalRound || !modalTimeSlot) return null;
    const roundName = rounds.find(r => r.key === modalRound)?.name;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '1000px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }} className="round-info">{roundName} - Time Slot {modalTimeSlot} - Edit Seating</h3>
            <button onClick={() => setShowSeatingModal(false)} className="btn-close">×</button>
          </div>
          {selectedPlayerInModal && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f8ff', border: '1px solid #ccc', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span><strong>Selected:</strong> <span className="player-name-secondary">{selectedPlayerInModal.firstName} {selectedPlayerInModal.lastName}</span></span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => removePlayerFromSeat(selectedPlayerInModal)} className="btn" style={{ fontSize: '0.8rem', backgroundColor: '#dc3545', color: '#fff' }}>Remove from Seat</button>
                  <button onClick={() => setSelectedPlayerInModal(null)} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>Cancel</button>
                </div>
              </div>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#666' }}>Click an empty seat to move this player.</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
            {[1, 2, 3, 4, 5, 6].map(tableNumber => (
              <div key={tableNumber}>
                <h4 style={{marginTop: 0}}>Table {tableNumber}</h4>
                {isTableDisabled(tableNumber, modalRound, modalTimeSlot) ? (
                  <div style={{ height: '60px', backgroundColor: '#6c757d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>Table Disabled</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                    {[1, 2, 3, 4, 5, 6].map(seatNumber => {
                      const player = getPlayerAtSeat(tableNumber, seatNumber, modalRound, modalTimeSlot);
                      const isSelected = selectedPlayerInModal && selectedPlayerInModal.id === player?.id;
                      const bgColor = isSelected ? '#ffd700' : player ? '#6c757d' : '#fff';
                      const textColor = isSelected ? '#000' : player ? '#fff' : '#000';
                      return (
                        <div key={seatNumber} onClick={() => handleSeatClickInModal(tableNumber, seatNumber)} style={{ border: '1px solid #ccc', borderRadius: '4px', padding: '8px', backgroundColor: bgColor, color: textColor, textAlign: 'center', cursor: 'pointer' }}>
                          <div style={{ fontWeight: 'bold' }}>Seat {seatNumber}</div>
                          <div style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player ? `${player.firstName} ${player.lastName}` : 'Empty'}</div>
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
          <SearchBar searchValue={searchTerm} onSearchChange={setSearchTerm} onSearch={searchPlayers} placeholder="Enter name or account number" />
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
            return (
              <div key={reg.id} className="card" style={{ marginBottom: '16px' }}>
                <div className="card-content" style={{ paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0 }}>{roundInfo?.name}</h4>
                    <button onClick={() => showFullSeating(reg.round, reg.timeSlot)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                      Edit Seating
                    </button>
                  </div>
                  <p className="player-metadata" style={{ marginTop: '8px', marginBottom: 0 }}>
                    Current Seat: {reg.tableNumber ? `Table ${reg.tableNumber}, Seat ${reg.seatNumber}` : 'Not Seated'}
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