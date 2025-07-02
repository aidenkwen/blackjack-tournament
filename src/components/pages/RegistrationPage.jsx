import React, { useMemo, useEffect } from 'react';
import { useRegistration } from '../../hooks/useRegistration';
import RegistrationForm from '../forms/RegistrationForm';
import LastPlayerCard from '../cards/LastPlayerCard';
import { useTournamentContext } from '../../context/TournamentContext';
import { useNavigate } from 'react-router-dom';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const context = useTournamentContext();
  const { 
    lastActiveTab, setLastActiveTab, 
    lastSelectedRound, setLastSelectedRound, 
    lastSelectedTimeSlot, setLastSelectedTimeSlot 
  } = context;

  const currentTournament = useMemo(() => 
    context.tournaments.find(t => t.name === context.selectedEvent) || { entryCost: 500, rebuyCost: 500, mulliganCost: 100 },
    [context.tournaments, context.selectedEvent]
  );
  
  const registrationHook = useRegistration({
    initialTournament: currentTournament,
    allRegistrations: context.registrations,
    setRegistrations: context.setRegistrations,
    selectedEvent: context.selectedEvent,
    masterData: context.masterData,
    setMasterData: context.setMasterData,
    employee: context.employee,
    activeTab: lastActiveTab,
    selectedRound: lastSelectedRound,
    selectedTimeSlot: lastSelectedTimeSlot,
    pendingRegistration: context.pendingRegistration,
    setPendingRegistration: context.setPendingRegistration,
    setCurrentPage: (page) => navigate(page === 2 ? '/seating' : '/'),
    setLastRegisteredPlayer: context.setLastRegisteredPlayer,
  });

  const { clearForm } = registrationHook;
  useEffect(() => {
    // When the user changes the main context (tab, round, or slot), clear the form.
    // This prevents carrying over player data to a new context.
    clearForm();
  }, [lastActiveTab, lastSelectedRound, lastSelectedTimeSlot, clearForm]);

  const { rounds } = registrationHook;

  const getAvailableTimeSlots = () => {
    if (lastActiveTab === 'registration') return Array.from({ length: 6 }, (_, i) => i + 1);
    if (lastSelectedRound) {
      const round = rounds.find(r => r.key === lastSelectedRound);
      return Array.from({ length: round?.timeSlots || 1 }, (_, i) => i + 1);
    }
    return [];
  };

  const handleTabClick = (tab) => {
    setLastActiveTab(tab);
    if (tab === 'registration') {
      setLastSelectedRound('round1');
      setLastSelectedTimeSlot(1);
    } else {
      setLastSelectedRound('');
      setLastSelectedTimeSlot('');
    }
  };

  const showSearchBar = (lastActiveTab === 'registration' && lastSelectedTimeSlot) || (lastActiveTab === 'post-registration' && lastSelectedRound && lastSelectedTimeSlot);
  
  const lastPlayer = useMemo(() => {
    const fmtTypes = (t1, t2) => (t2 ? `${t1}+${t2}` : t1);
    const tournamentRegistrations = context.registrations.filter(r => r.eventName === context.selectedEvent);
    let contextRegistrations = [];
    let roundContext = '';

    if (lastActiveTab === 'registration') {
      contextRegistrations = tournamentRegistrations.filter(r => r.round === 'round1');
      roundContext = 'Round 1';
    } else if (lastSelectedRound) {
      contextRegistrations = tournamentRegistrations.filter(r => r.round === lastSelectedRound);
      const roundInfo = rounds.find(r => r.key === lastSelectedRound);
      roundContext = roundInfo ? roundInfo.name : lastSelectedRound;
    }
    if (contextRegistrations.length === 0) return null;
    const lastReg = [...contextRegistrations].sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))[0];
    if (!lastReg) return null;
    const playerTransactions = contextRegistrations.filter(r => r.playerAccountNumber === lastReg.playerAccountNumber && r.round === lastReg.round);
    const purchases = [];
    playerTransactions.forEach(t => {
      let purchaseDesc = '';
      if (t.isRebuy) purchaseDesc = `Rebuy (${fmtTypes(t.paymentType, t.paymentType2)})`;
      else if (t.isMulligan) purchaseDesc = `Mulligan (${fmtTypes(t.paymentType, t.paymentType2)})`;
      else if (t.eventType === 'CHECK-IN') purchaseDesc = 'Check-In';
      else if (t.paymentType === 'Comp') purchaseDesc = 'Registration (Comp)';
      else purchaseDesc = `Registration (${fmtTypes(t.paymentType, t.paymentType2)})`;
      if (purchaseDesc) purchases.push(purchaseDesc);
    });
    let seatingInfo = null;
    if (lastReg.tableNumber && lastReg.seatNumber) seatingInfo = `Seated: Table ${lastReg.tableNumber}, Seat ${lastReg.seatNumber}`;
    return {
      playerAccountNumber: lastReg.playerAccountNumber,
      name: `${lastReg.firstName} ${lastReg.lastName}`,
      purchases: purchases.length > 0 ? [...new Set(purchases)].join(', ') : 'Registration',
      roundContext,
      seatingInfo
    };
  }, [context.registrations, context.selectedEvent, lastActiveTab, lastSelectedRound, rounds]);

  return (
    <div className="container">
      <button onClick={() => navigate('/')} className="link-back link-back-block">
        {'<'} Back to Event Selection
      </button>
      
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <h1 className="page-title">{context.selectedEvent}</h1>
            <p className="page-subtitle">
              {context.registrations.filter(r => r.eventName === context.selectedEvent && r.round === 'round1' && !r.isMulligan).length} total registrations, Employee: {context.employee}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/tabling')} className="btn btn-white-red">Manage Tournament</button>
            <button onClick={() => navigate('/export')} className="btn btn-primary">Export Data</button>
          </div>
        </div>
      </div>
      
      <div className="tabs">
        <div className={`tab ${lastActiveTab === 'registration' ? 'active' : ''}`} onClick={() => handleTabClick('registration')}>Registration</div>
        <div className={`tab ${lastActiveTab === 'post-registration' ? 'active' : ''}`} onClick={() => handleTabClick('post-registration')}>Post-Registration</div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="mb-2">Round</label>
          {lastActiveTab === 'registration' ? (
            <select value="round1" disabled className="select-field" style={{ backgroundColor: '#f5f5f5', color: '#666' }}>
              <option value="round1">Round 1</option>
            </select>
          ) : (
            <select value={lastSelectedRound} onChange={(e) => setLastSelectedRound(e.target.value)} className="select-field">
              <option value="">-- Select Round --</option>
              {rounds.map((round) => (<option key={round.key} value={round.key}>{round.name}</option>))}
            </select>
          )}
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="mb-2">Time Slot</label>
          <select value={lastSelectedTimeSlot} onChange={(e) => setLastSelectedTimeSlot(e.target.value)} className="select-field">
            <option value="">-- Select Slot --</option>
            {getAvailableTimeSlots().map(slot => (<option key={slot} value={slot}>Slot {slot}</option>))}
          </select>
        </div>
      </div>
      
      {showSearchBar ? (
        <>
          <RegistrationForm
            hook={registrationHook}
            activeTab={lastActiveTab}
            selectedRound={lastSelectedRound}
            currentTournament={currentTournament}
          />
          {lastPlayer && <LastPlayerCard lastPlayer={lastPlayer} showSeatingInfo={true} />}
        </>
      ) : (
        <p className="subheading" style={{ textAlign: 'center' }}>
          {lastActiveTab === 'registration' ? 'Please select a time slot to begin.' : 'Please select a round and time slot to begin.'}
        </p>
      )}
    </div>
  );
};

export default RegistrationPage;