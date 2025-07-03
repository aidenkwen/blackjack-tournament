import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// localStorage keys
const STORAGE_KEYS = {
  TOURNAMENTS: 'blackjack_tournaments',
  TOURNAMENT_PLAYERS: 'blackjack_tournament_players',
  REGISTRATIONS: 'blackjack_registrations'
};

// FIXED: Better localStorage error handling
const safeLocalStorage = {
  getItem: (key, defaultValue = []) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`LocalStorage read error for ${key}:`, error);
      return defaultValue;
    }
  },
  
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`LocalStorage write error for ${key}:`, error);
      return false;
    }
  }
};

// Helper functions for localStorage (using safe version)
const getFromStorage = (key, defaultValue = []) => safeLocalStorage.getItem(key, defaultValue);
const setToStorage = (key, value) => safeLocalStorage.setItem(key, value);

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = getFromStorage(STORAGE_KEYS.TOURNAMENTS, []);
      setTournaments(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error loading tournaments:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addTournament = async (tournament) => {
    try {
      setError(null);
      const newTournament = {
        id: Date.now().toString(),
        ...tournament,
        createdAt: new Date().toISOString()
      };
      
      // FIXED: Use functional update to prevent stale state
      setTournaments(prevTournaments => {
        const updatedTournaments = [newTournament, ...prevTournaments];
        setToStorage(STORAGE_KEYS.TOURNAMENTS, updatedTournaments);
        return updatedTournaments;
      });
      
      return newTournament;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTournament = async (tournamentId) => {
    try {
      setError(null);
      
      // FIXED: Use functional update and find tournament before filtering
      setTournaments(prevTournaments => {
        // Find the tournament to delete BEFORE filtering it out
        const tournamentToDelete = prevTournaments.find(t => t.id === tournamentId);
        
        // Remove tournament from the list
        const updatedTournaments = prevTournaments.filter(t => t.id !== tournamentId);
        setToStorage(STORAGE_KEYS.TOURNAMENTS, updatedTournaments);
        
        // Clean up related data only if tournament was found
        if (tournamentToDelete) {
          const allPlayers = getFromStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, {});
          if (allPlayers[tournamentToDelete.name]) {
            delete allPlayers[tournamentToDelete.name];
            setToStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, allPlayers);
          }
          
          // Clean up registrations for this tournament
          const allRegistrations = getFromStorage(STORAGE_KEYS.REGISTRATIONS, []);
          const updatedRegistrations = allRegistrations.filter(r => r.eventName !== tournamentToDelete.name);
          setToStorage(STORAGE_KEYS.REGISTRATIONS, updatedRegistrations);
        }
        
        return updatedTournaments;
      });
      
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // FIXED: Add cleanup for useEffect
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        await loadTournaments();
        // Data already set in loadTournaments, no need to use returned data
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load tournaments:', error);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    tournaments,
    setTournaments,
    loading,
    error,
    loadTournaments,
    addTournament,
    deleteTournament
  };
};

export const useTournamentPlayers = (selectedEvent) => {
  const [tournamentPlayers, setTournamentPlayers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPlayers = async (eventName) => {
    if (!eventName) return [];
    
    try {
      setLoading(true);
      setError(null);
      const allPlayers = getFromStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, {});
      const players = allPlayers[eventName] || [];
      
      // FIXED: Use functional update
      setTournamentPlayers(prev => ({
        ...prev,
        [eventName]: players
      }));
      
      return players;
    } catch (err) {
      setError(err.message);
      console.error('Error loading players:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTournamentPlayers = () => {
    return selectedEvent ? tournamentPlayers[selectedEvent] || [] : [];
  };

  const setCurrentTournamentPlayers = (players) => {
    if (selectedEvent) {
      // FIXED: Use functional update
      setTournamentPlayers(prev => {
        const updatedPlayers = {
          ...prev,
          [selectedEvent]: players
        };
        
        // Update localStorage
        const allPlayers = getFromStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, {});
        allPlayers[selectedEvent] = players;
        setToStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, allPlayers);
        
        return updatedPlayers;
      });
    }
  };

  const uploadPlayersFile = async (eventName, file) => {
    try {
      setLoading(true);
      setError(null);
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const content = e.target.result;
            
            // Parse CSV using PapaParse (same logic as your server)
            const results = Papa.parse(content, {
              header: true,
              skipEmptyLines: true,
              trimHeaders: true,
              dynamicTyping: true,
              transformHeader: header => header.trim()
            });
            
            if (results.errors && results.errors.length > 0) {
              console.log('Parse warnings/errors:', results.errors);
            }
            
            // Transform records for blackjack tournament players
            const players = results.data
              .filter(record => {
                return Object.values(record).some(value => value !== null && value !== undefined && value !== '');
              })
              .map((record, index) => {
                const player = {
                  id: Date.now() + index,
                  PlayerAccountNumber: record.PlayerAccountNumber || record.playerAccountNumber || record['Player Account Number'] || '',
                  FirstName: record.FirstName || record.firstName || record['First Name'] || '',
                  LastName: record.LastName || record.lastName || record['Last Name'] || '',
                  EntryType: record.EntryType || record.entryType || record['Entry Type'] || 'PAY',
                  Host: record.Host || record.host || '',
                  // Keep all original fields as well
                  ...record
                };
                return player;
              });
            
            if (players.length === 0) {
              reject(new Error('No valid player data found in file.'));
              return;
            }
            
            // FIXED: Use functional update for state
            setTournamentPlayers(prev => {
              const updatedPlayers = {
                ...prev,
                [eventName]: players
              };
              
              // Store players
              const allPlayers = getFromStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, {});
              allPlayers[eventName] = players;
              setToStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, allPlayers);
              
              return updatedPlayers;
            });
            
            console.log(`Parsed ${players.length} players for tournament: ${eventName}`);
            
            const result = {
              recordsInserted: players.length,
              totalRows: results.data.length,
              errorCount: results.data.length - players.length,
              errors: results.errors?.slice(0, 5).map(err => err.message) || [],
              hasMoreErrors: (results.errors?.length || 0) > 5
            };
            
            resolve(result);
            
          } catch (parseError) {
            reject(new Error(`CSV parsing failed: ${parseError.message}`));
          }
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
      });
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Add cleanup for useEffect
  useEffect(() => {
    let isMounted = true;
    
    if (selectedEvent) {
      const loadData = async () => {
        try {
          await loadPlayers(selectedEvent);
        } catch (error) {
          if (isMounted) {
            console.error('Failed to load players:', error);
          }
        }
      };

      loadData();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  return {
    tournamentPlayers,
    setTournamentPlayers,
    getCurrentTournamentPlayers,
    setCurrentTournamentPlayers,
    uploadPlayersFile,
    loading,
    error
  };
};

export const useRegistrations = (selectedEvent) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadRegistrations = async (eventName) => {
    if (!eventName) return [];
    
    try {
      setLoading(true);
      setError(null);
      const allRegistrations = getFromStorage(STORAGE_KEYS.REGISTRATIONS, []);
      const eventRegistrations = allRegistrations.filter(r => r.eventName === eventName);
      setRegistrations(eventRegistrations);
      return eventRegistrations;
    } catch (err) {
      setError(err.message);
      console.error('Error loading registrations:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addRegistration = async (registration) => {
    try {
      setError(null);
      const newRegistration = {
        id: Date.now().toString(),
        ...registration,
        createdAt: new Date().toISOString()
      };
      
      // FIXED: Use functional update
      setRegistrations(prevRegistrations => {
        const allRegistrations = getFromStorage(STORAGE_KEYS.REGISTRATIONS, []);
        const updatedRegistrations = [...allRegistrations, newRegistration];
        setToStorage(STORAGE_KEYS.REGISTRATIONS, updatedRegistrations);
        
        // Update local state
        const eventRegistrations = updatedRegistrations.filter(r => r.eventName === selectedEvent);
        return eventRegistrations;
      });
      
      return newRegistration;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // FIXED: Registration update function that handles both arrays and functional updates
  const updateRegistrations = (newRegistrationsOrUpdater) => {
    try {
      setError(null);
      
      setRegistrations(prevRegistrations => {
        // Handle functional update
        if (typeof newRegistrationsOrUpdater === 'function') {
          const updatedRegistrations = newRegistrationsOrUpdater(prevRegistrations);
          
          // Update localStorage with all registrations
          const allRegistrations = getFromStorage(STORAGE_KEYS.REGISTRATIONS, []);
          const otherEventRegistrations = allRegistrations.filter(r => r.eventName !== selectedEvent);
          const updatedAllRegistrations = [...otherEventRegistrations, ...updatedRegistrations];
          setToStorage(STORAGE_KEYS.REGISTRATIONS, updatedAllRegistrations);
          
          return updatedRegistrations;
        }
        
        // Handle direct array update
        if (Array.isArray(newRegistrationsOrUpdater)) {
          const allRegistrations = getFromStorage(STORAGE_KEYS.REGISTRATIONS, []);
          const otherEventRegistrations = allRegistrations.filter(r => r.eventName !== selectedEvent);
          const eventRegistrations = newRegistrationsOrUpdater.filter(r => r.eventName === selectedEvent);
          const updatedAllRegistrations = [...otherEventRegistrations, ...eventRegistrations];
          setToStorage(STORAGE_KEYS.REGISTRATIONS, updatedAllRegistrations);
          return eventRegistrations;
        }
        
        // Invalid input - return previous state unchanged
        console.error('updateRegistrations called with invalid input:', newRegistrationsOrUpdater);
        return prevRegistrations;
      });
      
    } catch (err) {
      setError(err.message);
      console.error('Error updating registrations:', err);
    }
  };

  // FIXED: Add cleanup for useEffect
  useEffect(() => {
    let isMounted = true;
    
    if (selectedEvent) {
      const loadData = async () => {
        try {
          await loadRegistrations(selectedEvent);
        } catch (error) {
          if (isMounted) {
            console.error('Failed to load registrations:', error);
          }
        }
      };

      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [selectedEvent]);

  // FIXED: Remove problematic sync effect that could cause infinite loops
  // The updateRegistrations function now handles localStorage directly

  return {
    registrations,
    setRegistrations: updateRegistrations,
    loading,
    error,
    loadRegistrations,
    addRegistration
  };
};