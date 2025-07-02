import React, { useMemo } from 'react';
import { useRegistration } from '../../hooks/useRegistration';
import RegistrationForm from '../forms/RegistrationForm';
import LastPlayerCard from '../cards/LastPlayerCard';

const RegistrationPage = (props) => {
  const {
    activeTab,
    setActiveTab,
    selectedRound,
    setSelectedRound,
    selectedTimeSlot,
    setSelectedTimeSlot,
  } = props;
  
  const currentTournament = useMemo(() => 
    props.tournaments.find(t => t.name === props.selectedEvent) || { entryCost: 500, rebuyCost: 500, mulliganCost: 100 },
    [props.tournaments, props.selectedEvent]
  );
  
  const registrationHook = useRegistration({
    initialTournament: currentTournament,
    allRegistrations: props.registrations,
    selectedEvent: props.selectedEvent,
    masterData: props.masterData,
    employee: props.employee,
    activeTab,
    selectedRound,
    selectedTimeSlot,
    pendingRegistration: props.pendingRegistration, // Pass prop to hook
    setPendingRegistration: props.setPendingRegistration,
    setCurrentPage: props.setCurrentPage,
    setLastRegisteredPlayer: props.setLastRegisteredPlayer
  });

  const { rounds } = registrationHook;

  const getAvailableTimeSlots = () => {
    if (activeTab === 'registration') {
      return Array.from({ length: 6 }, (_, i) => i + 1);
    } else if (selectedRound) {
      const round = rounds.find(r => r.key === selectedRound);
      return Array.from({ length: round?.timeSlots || 1 }, (_, i) => i + 1);
    }
    return [];
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    registrationHook.clearForm();
    if (tab === 'registration') {
      setSelectedRound('round1');
      setSelectedTimeSlot(1);
    } else {
      setSelectedRound('');
      setSelectedTimeSlot('');
    }
  };

  const showSearchBar = (activeTab === 'registration' && selectedTimeSlot) || (activeTab === 'post-registration' && selectedRound && selectedTimeSlot);
  
  const lastPlayer = useMemo(() => {
    const fmtTypes = (t1, t2) => (t2 ? `${t1}+${t2}` : t1);
    const tournamentRegistrations = props.registrations.filter(r => r.eventName === props.selectedEvent);
    
    let contextRegistrations = [];
    let roundContext = '';

    if (activeTab === 'registration') {
      contextRegistrations = tournamentRegistrations.filter(r => r.round === 'round1');
      roundContext = 'Round 1';
    } else if (selectedRound) {
      contextRegistrations = tournamentRegistrations.filter(r => r.round === selectedRound);
      const roundInfo = rounds.find(r => r.key === selectedRound);
      roundContext = roundInfo ? roundInfo.name : selectedRound;
    }
    
    if (contextRegistrations.length === 0) return null;
    
    const lastReg = [...contextRegistrations]
      .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))[0];
    
    if (!lastReg) return null;
    
    const playerTransactions = contextRegistrations.filter(r => r.playerAccountNumber === lastReg.playerAccountNumber && r.round === lastReg.round);
    const purchases = [];
    
    playerTransactions.forEach(t => {
      let purchaseDesc = '';
      if (t.isRebuy) {
        purchaseDesc = `Rebuy (${fmtTypes(t.paymentType, t.paymentType2)})`;
      } else if (t.isMulligan) {
        purchaseDesc = `Mulligan (${fmtTypes(t.paymentType, t.paymentType2)})`;
      } else {
        if (t.eventType === 'CHECK-IN') {
          purchaseDesc = 'Check-In';
        } else if (t.paymentType === 'Comp') {
          purchaseDesc = 'Registration (Comp)';
        } else {
          purchaseDesc = `Registration (${fmtTypes(t.paymentType, t.paymentType2)})`;
        }
      }
      if (purchaseDesc) purchases.push(purchaseDesc);
    });
    
    let seatingInfo = null;
    if (lastReg.tableNumber && lastReg.seatNumber) {
      seatingInfo = `Seated: Table ${lastReg.tableNumber}, Seat ${lastReg.seatNumber}`;
    }
    
    return {
      playerAccountNumber: lastReg.playerAccountNumber,
      name: `${lastReg.firstName} ${lastReg.lastName}`,
      purchases: purchases.length > 0 ? [...new Set(purchases)].join(', ') : 'Registration',
      roundContext: roundContext,
      seatingInfo: seatingInfo
    };
  }, [props.registrations, props.selectedEvent, activeTab, selectedRound, rounds]);

  return (
    <div className="container">
      <button onClick={() => props.setCurrentPage(0)} className="link-back link-back-block">
        {'<'} Back to Event Selection
      </button>
      
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <h1 className="page-title">{props.selectedEvent}</h1>
            <p className="page-subtitle">
              {props.registrations.filter(r => r.eventName === props.selectedEvent && r.round === 'round1' && !r.isMulligan).length} total registrations, Employee: {props.employee}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => props.setCurrentPage(2.5)} className="btn btn-white-red">Manage Tournament</button>
            <button onClick={() => props.setCurrentPage(3, true)} className="btn btn-primary">Export Data</button>
          </div>
        </div>
      </div>
      
      <div className="tabs">
        <div className={`tab ${activeTab === 'registration' ? 'active' : ''}`} onClick={() => handleTabClick('registration')}>
          Registration
        </div>
        <div className={`tab ${activeTab === 'post-registration' ? 'active' : ''}`} onClick={() => handleTabClick('post-registration')}>
          Post-Registration
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="mb-2">Round</label>
          {activeTab === 'registration' ? (
            <select value="round1" disabled className="select-field" style={{ backgroundColor: '#f5f5f5', color: '#666' }}>
              <option value="round1">Round 1</option>
            </select>
          ) : (
            <select value={selectedRound} onChange={(e) => { setSelectedRound(e.target.value); setSelectedTimeSlot(''); }} className="select-field">
              <option value="">-- Select Round --</option>
              {rounds.map((round) => (
                <option key={round.key} value={round.key}>{round.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="mb-2">Time Slot</label>
          <select value={selectedTimeSlot} onChange={(e) => setSelectedTimeSlot(e.target.value)} className="select-field">
            <option value="">-- Select Slot --</option>
            {getAvailableTimeSlots().map(slot => (
              <option key={slot} value={slot}>Slot {slot}</option>
            ))}
          </select>
        </div>
      </div>
      
      {showSearchBar ? (
        <>
            {lastPlayer && <LastPlayerCard lastPlayer={lastPlayer} showSeatingInfo={true} />}
            <RegistrationForm
                hook={registrationHook}
                activeTab={activeTab}
                selectedRound={selectedRound}
                currentTournament={currentTournament}
            />
        </>
      ) : (
        <p className="subheading" style={{ textAlign: 'center' }}>
          {activeTab === 'registration' ? 'Please select a time slot to begin player registration.' : 'Please select a round and time slot to begin post-registration.'}
        </p>
      )}
    </div>
  );
};

export default RegistrationPage;