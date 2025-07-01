import { useState, useEffect } from 'react';
import Papa from 'papaparse';

// localStorage keys
const STORAGE_KEYS = {
  TOURNAMENTS: 'blackjack_tournaments',
  TOURNAMENT_PLAYERS: 'blackjack_tournament_players',
  REGISTRATIONS: 'blackjack_registrations'
};

// Helper functions for localStorage
const getFromStorage = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
};

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
      
      const updatedTournaments = [newTournament, ...tournaments];
      setTournaments(updatedTournaments);
      setToStorage(STORAGE_KEYS.TOURNAMENTS, updatedTournaments);
      
      return newTournament;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTournament = async (tournamentId) => {
    try {
      setError(null);
      const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
      setTournaments(updatedTournaments);
      setToStorage(STORAGE_KEYS.TOURNAMENTS, updatedTournaments);
      
      // Also clean up related data
      const allPlayers = getFromStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, {});
      const tournamentToDelete = tournaments.find(t => t.id === tournamentId);
      if (tournamentToDelete && allPlayers[tournamentToDelete.name]) {
        delete allPlayers[tournamentToDelete.name];
        setToStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, allPlayers);
      }
      
      // Clean up registrations for this tournament
      const allRegistrations = getFromStorage(STORAGE_KEYS.REGISTRATIONS, []);
      const updatedRegistrations = allRegistrations.filter(r => r.eventName !== tournamentToDelete?.name);
      setToStorage(STORAGE_KEYS.REGISTRATIONS, updatedRegistrations);
      
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    loadTournaments();
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
      const updatedPlayers = {
        ...tournamentPlayers,
        [selectedEvent]: players
      };
      setTournamentPlayers(updatedPlayers);
      
      // Update localStorage
      const allPlayers = getFromStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, {});
      allPlayers[selectedEvent] = players;
      setToStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, allPlayers);
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
            
            // Store players
            const allPlayers = getFromStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, {});
            allPlayers[eventName] = players;
            setToStorage(STORAGE_KEYS.TOURNAMENT_PLAYERS, allPlayers);
            
            // Update state
            setTournamentPlayers(prev => ({
              ...prev,
              [eventName]: players
            }));
            
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

  useEffect(() => {
    if (selectedEvent) {
      loadPlayers(selectedEvent);
    }
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
      
      const allRegistrations = getFromStorage(STORAGE_KEYS.REGISTRATIONS, []);
      const updatedRegistrations = [...allRegistrations, newRegistration];
      setToStorage(STORAGE_KEYS.REGISTRATIONS, updatedRegistrations);
      
      // Update local state
      const eventRegistrations = updatedRegistrations.filter(r => r.eventName === selectedEvent);
      setRegistrations(eventRegistrations);
      
      return newRegistration;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Custom function to update registrations (used by seating assignment)
  const updateRegistrations = (newRegistrations) => {
    try {
      setError(null);
      
      // Get all registrations from storage
      const allRegistrations = getFromStorage(STORAGE_KEYS.REGISTRATIONS, []);
      
      // Filter out old registrations for this event
      const otherEventRegistrations = allRegistrations.filter(r => r.eventName !== selectedEvent);
      
      // Add new registrations for this event
      const eventRegistrations = newRegistrations.filter(r => r.eventName === selectedEvent);
      const updatedAllRegistrations = [...otherEventRegistrations, ...eventRegistrations];
      
      // Save to storage
      setToStorage(STORAGE_KEYS.REGISTRATIONS, updatedAllRegistrations);
      
      // Update local state
      setRegistrations(eventRegistrations);
      
    } catch (err) {
      setError(err.message);
      console.error('Error updating registrations:', err);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      loadRegistrations(selectedEvent);
    }
  }, [selectedEvent]);

  // Sync registrations with localStorage when they change
  useEffect(() => {
    if (selectedEvent && registrations.length > 0) {
      const allRegistrations = getFromStorage(STORAGE_KEYS.REGISTRATIONS, []);
      const otherEventRegistrations = allRegistrations.filter(r => r.eventName !== selectedEvent);
      const updatedAllRegistrations = [...otherEventRegistrations, ...registrations];
      setToStorage(STORAGE_KEYS.REGISTRATIONS, updatedAllRegistrations);
    }
  }, [registrations, selectedEvent]);

  return {
    registrations,
    setRegistrations: updateRegistrations,
    loading,
    error,
    loadRegistrations,
    addRegistration
  };
};