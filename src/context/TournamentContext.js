  import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
  import { useTournaments, useTournamentPlayers, useRegistrations, useDisabledTables } from '../hooks/useSupabaseData';
  import { supabase } from '../lib/supabase';

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
    const [realtimeConnected, setRealtimeConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting', 'connected', 'error'

  // Debug logging for selectedEvent changes
  useEffect(() => {
    console.log('SelectedEvent changed to:', selectedEvent);
    console.log('SelectedEvent type:', typeof selectedEvent);
    console.log('SelectedEvent stringified:', JSON.stringify(selectedEvent));
  }, [selectedEvent]);
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

    // Disabled tables now handled by Supabase hook

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
    const disabledTablesApi = useDisabledTables(selectedEvent);

    // Manual polling fallback when real-time is not available
    useEffect(() => {
      if (!selectedEvent || realtimeConnected) return;
      
      // Poll every 3 seconds when in offline mode
      const pollInterval = setInterval(async () => {
        if (connectionStatus === 'error') {
          console.log('Polling for updates (offline mode)');
          try {
            await registrationsApi.loadRegistrations(selectedEvent);
            await playersApi.loadPlayers(selectedEvent);
            await disabledTablesApi.loadDisabledTables(selectedEvent);
          } catch (error) {
            console.error('Polling error:', error);
          }
        }
      }, 3000);
      
      return () => clearInterval(pollInterval);
    }, [selectedEvent, realtimeConnected, connectionStatus, registrationsApi, playersApi, disabledTablesApi]);

    // Real-time subscriptions for live updates across all clients
    useEffect(() => {
      if (!selectedEvent) return;

      console.log('Setting up real-time subscriptions for tournament:', selectedEvent);
      
      const setupSubscriptions = async () => {
        try {
          // First, test if real-time is available at all
          const testChannel = supabase.channel('test-connection');
          const testPromise = new Promise((resolve) => {
            testChannel.subscribe((status) => {
              console.log('Test channel status:', status);
              if (status === 'SUBSCRIBED') {
                console.log('Real-time is available!');
                supabase.removeChannel(testChannel);
                resolve(true);
              } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('Real-time test failed:', status);
                supabase.removeChannel(testChannel);
                resolve(false);
              }
            });
          });
          
          // Wait up to 3 seconds for test
          const realtimeAvailable = await Promise.race([
            testPromise,
            new Promise(resolve => setTimeout(() => resolve(false), 3000))
          ]);
          
          if (!realtimeAvailable) {
            console.error('Real-time connection test failed - falling back to offline mode');
            setConnectionStatus('error');
            setRealtimeConnected(false);
            return;
          }
          
          // Get tournament ID for subscriptions
          const { data: tournament, error: tournamentError } = await supabase
            .from('tournaments')
            .select('id')
            .eq('name', selectedEvent)
            .single();
          
          if (tournamentError) {
            console.error('Error fetching tournament for real-time:', tournamentError);
            setConnectionStatus('error');
            return;
          }
          
          if (!tournament) {
            console.log('No tournament found for real-time subscription');
            setConnectionStatus('error');
            return;
          }

        const channels = [];
        let connectionStable = false;
        
        // Set initial connecting status
        setConnectionStatus('connecting');
        
        // Timeout to switch to offline mode if connection fails
        const connectionTimeout = setTimeout(() => {
          if (!connectionStable) {
            console.log('Real-time connection timeout - switching to offline mode');
            setConnectionStatus('error');
            setRealtimeConnected(false);
          }
        }, 10000); // 10 second timeout

        // 1. Subscribe to registration changes (most important for counter and seating)
        const registrationsChannel = supabase
          .channel(`registrations-context-${tournament.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'registrations',
              filter: `tournament_id=eq.${tournament.id}`
            },
            async (payload) => {
              console.log('Real-time registration update in context:', payload);
              
              // Reload registrations to get fresh data including counts
              await registrationsApi.loadRegistrations(selectedEvent);
              
              // Show notification for other users' actions
              if (payload.eventType === 'INSERT' && payload.new) {
                const reg = payload.new;
                if (reg.registered_by !== employee) {
                  console.log(`New registration by another user: ${reg.first_name} ${reg.last_name}`);
                }
              }
            }
          )
          .subscribe((status, error) => {
            console.log('Registrations channel subscription attempt:', status);
            if (error) {
              console.error('Channel subscription error:', error);
            }
            
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to registration updates');
              
              // Clear timeout and mark as connected
              if (!connectionStable) {
                connectionStable = true;
                clearTimeout(connectionTimeout);
                setRealtimeConnected(true);
                setConnectionStatus('connected');
                console.log('Real-time connection established');
              }
            } else if (status === 'CLOSED') {
              console.log('Channel closed');
              setConnectionStatus('error');
              setRealtimeConnected(false);
            } else if (status === 'CHANNEL_ERROR') {
              console.error('Channel error occurred');
              setConnectionStatus('error');
              setRealtimeConnected(false);
            } else if (status === 'TIMED_OUT') {
              console.error('Channel subscription timed out');
              setConnectionStatus('error');
              setRealtimeConnected(false);
            }
          });
        
        channels.push(registrationsChannel);

        // 2. Subscribe to player list changes
        const playersChannel = supabase
          .channel(`players-context-${tournament.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tournament_players',
              filter: `tournament_id=eq.${tournament.id}`
            },
            async (payload) => {
              console.log('Real-time player update in context:', payload);
              
              // Reload players to get fresh data
              await playersApi.loadPlayers(selectedEvent);
            }
          )
          .subscribe();
        
        channels.push(playersChannel);

        // 3. Subscribe to disabled tables changes
        const disabledTablesChannel = supabase
          .channel(`disabled-tables-context-${tournament.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'disabled_tables',
              filter: `tournament_id=eq.${tournament.id}`
            },
            async (payload) => {
              console.log('Real-time disabled tables update in context:', payload);
              
              // Reload disabled tables
              await disabledTablesApi.loadDisabledTables(selectedEvent);
            }
          )
          .subscribe();
        
        channels.push(disabledTablesChannel);

        // Cleanup function
        return () => {
          console.log('Cleaning up real-time subscriptions in context');
          connectionStable = false;
          setRealtimeConnected(false);
          setConnectionStatus('connecting');
          channels.forEach(channel => {
            supabase.removeChannel(channel);
          });
        };
        } catch (error) {
          console.error('Error setting up real-time subscriptions:', error);
          setConnectionStatus('error');
          setRealtimeConnected(false);
        }
      };

      const cleanupPromise = setupSubscriptions();
      
      // Cleanup when selectedEvent changes or component unmounts
      return () => {
        cleanupPromise.then(cleanup => {
          if (cleanup) cleanup();
        });
      };
    }, [selectedEvent, employee, registrationsApi, playersApi, disabledTablesApi]);

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
      globalDisabledTables: disabledTablesApi.disabledTables,
      realtimeConnected,
      connectionStatus,
      
      // Setters
      setSelectedEvent,
      setEmployee,
      setLastRegisteredPlayer,
      setPendingRegistration,
      setLastActiveTab,
      setLastSelectedRound,
      setLastSelectedTimeSlot,
      setLastRoundPreferences,
      setGlobalDisabledTables: disabledTablesApi.updateDisabledTables,

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
      persistentSearchData, disabledTablesApi.disabledTables, saveSearchState, clearSearchState, 
      clearTournamentContext, restoreSearchState, tournamentsApi.tournaments, 
      tournamentsApi.loading, tournamentsApi.error, tournamentsApi.addTournament, 
      tournamentsApi.deleteTournament, playersApi, registrationsApi.registrations, 
      registrationsApi.setRegistrations, registrationsApi.addRegistration, 
      registrationsApi.loading, registrationsApi.error, disabledTablesApi.updateDisabledTables
    ]);

    return (
      <TournamentContext.Provider value={contextValue}>
        {children}
      </TournamentContext.Provider>
    );
  };