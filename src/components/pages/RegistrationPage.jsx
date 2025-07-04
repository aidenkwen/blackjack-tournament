import React, { useMemo, useState, useEffect } from 'react';
import { useRoundRegistration } from '../../hooks/useRoundRegistration';
import RoundRegistrationForm from '../forms/RoundRegistrationForm';
import { useTournamentContext } from '../../context/TournamentContext';
import { useNavigate } from 'react-router-dom';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const context = useTournamentContext();
  const [activeRound, setActiveRound] = useState('round1');

  const currentTournament = useMemo(() => 
    context.tournaments.find(t => t.name === context.selectedEvent) || { entryCost: 500, rebuyCost: 500, mulliganCost: 100 },
    [context.tournaments, context.selectedEvent]
  );

  const rounds = [
    { key: 'round1', name: 'Round 1', isRebuy: false, timeSlots: 6, cost: currentTournament.entryCost },
    { key: 'rebuy1', name: 'Rebuy 1', isRebuy: true, timeSlots: 2, cost: currentTournament.rebuyCost },
    { key: 'rebuy2', name: 'Rebuy 2', isRebuy: true, timeSlots: 1, cost: currentTournament.rebuyCost },
    { key: 'round2', name: 'Round 2', isRebuy: false, timeSlots: 3, cost: currentTournament.entryCost },
    { key: 'superrebuy', name: 'Super Rebuy', isRebuy: true, timeSlots: 2, cost: currentTournament.rebuyCost },
    { key: 'quarterfinals', name: 'Quarterfinals', isRebuy: false, timeSlots: 2, cost: currentTournament.entryCost },
    { key: 'semifinals', name: 'Semifinals', isRebuy: false, timeSlots: 1, cost: currentTournament.entryCost }
  ];

  const uniqueRound1Count = useMemo(() => {
    const round1Registrations = context.registrations.filter(
      r => r.eventName === context.selectedEvent && r.round === 'round1' && !r.isMulligan
    );
    const uniquePlayerAccounts = new Set(
      round1Registrations.map(r => r.playerAccountNumber)
    );
    return uniquePlayerAccounts.size;
  }, [context.registrations, context.selectedEvent]);

  const currentRoundInfo = rounds.find(r => r.key === activeRound);

  const registrationHook = useRoundRegistration({
    currentTournament,
    allRegistrations: context.registrations,
    setRegistrations: context.setRegistrations,
    selectedEvent: context.selectedEvent,
    masterData: context.masterData,
    setMasterData: context.setMasterData,
    employee: context.employee,
    currentRound: activeRound,
    currentRoundInfo,
    pendingRegistration: context.pendingRegistration,
    setPendingRegistration: context.setPendingRegistration,
    setLastRegisteredPlayer: context.setLastRegisteredPlayer,
    onSeatingNeeded: () => navigate('/seating'),
    lastRoundPreferences: context.lastRoundPreferences || {},
    setLastRoundPreferences: context.setLastRoundPreferences || (() => {}),
    saveSearchState: () => {},
    restoreSearchState: () => ({})
  });

  useEffect(() => {
    if (context.lastSelectedRound && context.lastSelectedRound !== activeRound) {
      setActiveRound(context.lastSelectedRound);
    }
  }, [context.lastSelectedRound, activeRound]);

  const handleRoundChange = (newRound) => {
    if (newRound !== activeRound) {
      if (context.setLastSelectedRound) {
        context.setLastSelectedRound(newRound);
      }
      
      if (registrationHook.clearForm) {
        registrationHook.clearForm();
      }
      
      setActiveRound(newRound);
    }
  };

  const handleNavigateWithContext = (path) => {
    if (context.setLastSelectedRound) {
      context.setLastSelectedRound(activeRound);
    }
    navigate(path);
  };

  const handleNavigateToEventSelection = () => {
    if (registrationHook.clearForm) {
      registrationHook.clearForm();
    }
    
    if (context.setLastSelectedRound) {
      context.setLastSelectedRound('round1');
    }
    if (context.setLastRoundPreferences) {
      context.setLastRoundPreferences({});
    }
    if (context.setPendingRegistration) {
      context.setPendingRegistration(null);
    }
    if (context.setLastRegisteredPlayer) {
      context.setLastRegisteredPlayer(null);
    }
    
    navigate('/');
  };

  return (
    <div className="container">
      <button 
        onClick={handleNavigateToEventSelection} 
        className="link-back link-back-block"
      >
        {'<'} Back to Event Selection
      </button>
      
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <h1 className="page-title">{context.selectedEvent || 'No Event Selected'}</h1>
            <p className="page-subtitle">
              {uniqueRound1Count} total registration{uniqueRound1Count !== 1 ? 's' : ''}, Employee: {context.employee || 'No Employee'}
            </p>
          </div>
          <div className="button-group">
            <button 
              onClick={() => handleNavigateWithContext('/tabling')} 
              className="btn btn-white-red"
            >
              Manage Tournament
            </button>
            <button 
              onClick={() => handleNavigateWithContext('/export')} 
              className="btn btn-primary"
            >
              Export Data
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal separator line */}
      <div style={{ 
        width: '100%', 
        height: '1px', 
        backgroundColor: '#ddd', 
        margin: '24px 0 0 0' 
      }}></div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Vertical Round Tabs */}
        <div className="vertical-tabs-container" style={{ 
          width: '200px', // Fixed width instead of minWidth
          flexShrink: 0, // Prevents shrinking
          flexGrow: 0 // Prevents growing
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {rounds.map((round) => (
              <button
                key={round.key}
                onClick={() => handleRoundChange(round.key)}
                className={`vertical-tab ${activeRound === round.key ? 'active' : ''}`}
              >
                {round.name}
              </button>
            ))}
          </div>
        </div>

        {/* Round Registration Form */}
        <div style={{ 
          flex: 1,
          minWidth: 0,
          maxWidth: 'calc(100% - 224px)', // Container width minus sidebar and gap
          overflow: 'hidden'
        }}>
          <RoundRegistrationForm
            hook={registrationHook}
            currentRound={activeRound}
            currentRoundInfo={currentRoundInfo}
            currentTournament={currentTournament}
            lastRegisteredPlayer={context.lastRegisteredPlayer}
            allRegistrations={context.registrations}
          />
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;