import React, { createContext, useState, useContext } from 'react';
import { useTournaments, useTournamentPlayers, useRegistrations } from '../hooks/useapidata';

// 1. Create the Context
const TournamentContext = createContext();

// 2. Create a custom hook for easy access to the context
export const useTournamentContext = () => {
  return useContext(TournamentContext);
};

// 3. Create the Provider Component
export const TournamentProvider = ({ children }) => {
  // All the state that was in App.jsx now lives here
  const [selectedEvent, setSelectedEvent] = useState('');
  const [employee, setEmployee] = useState('');
  const [lastRegisteredPlayer, setLastRegisteredPlayer] = useState(null);
  const [pendingRegistration, setPendingRegistration] = useState(null);

  // State for preserving the registration tab/round selection across navigation
  const [lastActiveTab, setLastActiveTab] = useState('registration');
  const [lastSelectedRound, setLastSelectedRound] = useState('round1');
  const [lastSelectedTimeSlot, setLastSelectedTimeSlot] = useState(1);
  
  // API Hooks
  const tournamentsApi = useTournaments();
  const playersApi = useTournamentPlayers(selectedEvent);
  const registrationsApi = useRegistrations(selectedEvent);

  // Consolidate all state and functions into a single value object
  const value = {
    // State
    selectedEvent,
    employee,
    lastRegisteredPlayer,
    pendingRegistration,
    lastActiveTab,
    lastSelectedRound,
    lastSelectedTimeSlot,
    
    // Setters
    setSelectedEvent,
    setEmployee,
    setLastRegisteredPlayer,
    setPendingRegistration,
    setLastActiveTab,
    setLastSelectedRound,
    setLastSelectedTimeSlot,

    // Data from API Hooks
    tournaments: tournamentsApi.tournaments,
    tournamentsLoading: tournamentsApi.loading,
    tournamentsError: tournamentsApi.error,
    addTournament: tournamentsApi.addTournament,
    deleteTournament: tournamentsApi.deleteTournament,

    masterData: playersApi.getCurrentTournamentPlayers(),
    setMasterData: playersApi.setCurrentTournamentPlayers,
    uploadPlayersFile: playersApi.uploadPlayersFile,
    playersLoading: playersApi.loading,
    playersError: playersApi.error,

    registrations: registrationsApi.registrations,
    setRegistrations: registrationsApi.setRegistrations,
    addRegistration: registrationsApi.addRegistration,
    registrationsLoading: registrationsApi.loading,
    registrationsError: registrationsApi.error,
  };

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};