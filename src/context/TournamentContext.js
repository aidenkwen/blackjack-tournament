import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
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
  
  // Persistent round preferences that survive navigation
  const [lastRoundPreferences, setLastRoundPreferences] = useState({});
  
  // FIXED: Additional state for preserving search and form data across navigation
  const [persistentSearchData, setPersistentSearchData] = useState({
    searchAccount: '',
    currentPlayer: null,
    showNewPlayerForm: false,
    lastSearchResults: null
  });

  // Add disabled tables state with localStorage persistence
  const [globalDisabledTables, setGlobalDisabledTables] = useState(() => {
    try {
      const stored = localStorage.getItem('blackjack_disabled_tables');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading disabled tables:', error);
      return {};
    }
  });

  // Save to localStorage whenever globalDisabledTables changes
  useEffect(() => {
    try {
      localStorage.setItem('blackjack_disabled_tables', JSON.stringify(globalDisabledTables));
    } catch (error) {
      console.error('Error saving disabled tables:', error);
    }
  }, [globalDisabledTables]);

  // FIXED: Use useCallback for state management functions to prevent unnecessary re-renders
  const saveSearchState = useCallback((searchData) => {
    setPersistentSearchData(prevData => ({
      ...prevData,
      ...searchData
    }));
  }, []);

  const clearSearchState = useCallback(() => {
    setPersistentSearchData({
      searchAccount: '',
      currentPlayer: null,
      showNewPlayerForm: false,
      lastSearchResults: null
    });
  }, []);

  const clearTournamentContext = useCallback(() => {
    setLastRegisteredPlayer(null);
    setPendingRegistration(null);
    setLastActiveTab('registration');
    setLastSelectedRound('round1');
    setLastSelectedTimeSlot(1);
    setLastRoundPreferences({});
    clearSearchState();
  }, [clearSearchState]);

  const restoreSearchState = useCallback(() => {
    return persistentSearchData;
  }, [persistentSearchData]);

  // API Hooks
  const tournamentsApi = useTournaments();
  const playersApi = useTournamentPlayers(selectedEvent);
  const registrationsApi = useRegistrations(selectedEvent);

  // FIXED: Use useCallback for context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    // State
    selectedEvent,
    employee,
    lastRegisteredPlayer,
    pendingRegistration,
    lastActiveTab,
    lastSelectedRound,
    lastSelectedTimeSlot,
    lastRoundPreferences,
    persistentSearchData,
    globalDisabledTables,
    
    // Setters
    setSelectedEvent,
    setEmployee,
    setLastRegisteredPlayer,
    setPendingRegistration,
    setLastActiveTab,
    setLastSelectedRound,
    setLastSelectedTimeSlot,
    setLastRoundPreferences,
    setGlobalDisabledTables,

    // Search state management functions
    saveSearchState,
    clearSearchState,
    clearTournamentContext,
    restoreSearchState,

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
  }), [
    selectedEvent, employee, lastRegisteredPlayer, pendingRegistration,
    lastActiveTab, lastSelectedRound, lastSelectedTimeSlot, lastRoundPreferences,
    persistentSearchData, globalDisabledTables, saveSearchState, clearSearchState, 
    clearTournamentContext, restoreSearchState, tournamentsApi.tournaments, 
    tournamentsApi.loading, tournamentsApi.error, tournamentsApi.addTournament, 
    tournamentsApi.deleteTournament, playersApi, registrationsApi.registrations, 
    registrationsApi.setRegistrations, registrationsApi.addRegistration, 
    registrationsApi.loading, registrationsApi.error
  ]);

  return (
    <TournamentContext.Provider value={contextValue}>
      {children}
    </TournamentContext.Provider>
  );
};