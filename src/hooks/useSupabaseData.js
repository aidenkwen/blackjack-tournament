// Seating persistence fix - deployed version
import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { supabase, handleSupabaseError } from '../lib/supabase';

export const useTournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match expected format - handle missing cost columns
      const transformedData = (data || []).map(tournament => ({
        ...tournament,
        // Use defaults since cost columns don't exist in current schema
        entryCost: 500,
        rebuyCost: 500,
        mulliganCost: 100,
        timeSlots: tournament.time_slots || 1
      }));
      
      setTournaments(transformedData);
      return transformedData;
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      console.error('Error loading tournaments:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addTournament = async (tournament) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('tournaments')
        .insert([{
          name: tournament.name,
          rounds: tournament.rounds || 0,
          time_slots: tournament.timeSlots || 1
          // Skip cost columns since they don't exist in current schema
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Transform returned data - use defaults since cost columns don't exist
      const transformedData = {
        ...data,
        entryCost: 500,
        rebuyCost: 500,  
        mulliganCost: 100,
        timeSlots: data.time_slots || 1
      };
      
      setTournaments(prev => [transformedData, ...prev]);
      return transformedData;
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      throw err;
    }
  };

  const deleteTournament = async (tournamentId) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);
      
      if (error) throw error;
      
      setTournaments(prev => prev.filter(t => t.id !== tournamentId));
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
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

  const loadPlayers = useCallback(async (tournamentName) => {
    if (!tournamentName) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Looking for tournament:', tournamentName);
      
      // Ensure tournament name is clean
      const cleanTournamentName = String(tournamentName).trim();
      console.log('Clean tournament name for load:', cleanTournamentName);
      
      // First get the tournament ID
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, name')
        .eq('name', cleanTournamentName)
        .single();
      
      console.log('Found tournament:', tournament);
      if (tournamentError) {
        console.error('Tournament error:', tournamentError);
        throw tournamentError;
      }
      if (!tournament) {
        console.log('No tournament found with name:', tournamentName);
        return [];
      }
      
      // Then get the players
      const { data, error } = await supabase
        .from('tournament_players')
        .select('*')
        .eq('tournament_id', tournament.id)
        .order('created_at', { ascending: true });
      
      console.log('Player query result:', { data, error, tournament_id: tournament.id });
      if (error) throw error;
      
      // Transform the data to match the expected format
      const players = (data || []).map(player => ({
        id: player.id,
        PlayerAccountNumber: player.player_account_number,
        FirstName: player.first_name,
        LastName: player.last_name,
        EntryType: player.entry_type,
        Host: player.host,
        ...player.additional_data
      }));
      
      console.log('Loaded players from Supabase:', players);
      console.log('Tournament name:', tournamentName);
      
      setTournamentPlayers(prev => ({
        ...prev,
        [tournamentName]: players
      }));
      
      return players;
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      console.error('Error loading players:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentTournamentPlayers = () => {
    return selectedEvent ? tournamentPlayers[selectedEvent] || [] : [];
  };

  const setCurrentTournamentPlayers = async (players, forceTournamentName = null) => {
    const tournamentName = forceTournamentName || selectedEvent;
    if (!tournamentName) return;
    
    try {
      setError(null);
      console.log('Uploading players for tournament:', tournamentName);
      console.log('Number of players to upload:', players.length);
      
      // Ensure tournament name is a clean string
      const cleanTournamentName = String(tournamentName).trim();
      console.log('Clean tournament name:', cleanTournamentName);
      
      // Get tournament ID
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, name')
        .eq('name', cleanTournamentName)
        .single();
      
      console.log('Tournament found for upload:', tournament);
      if (tournamentError) throw tournamentError;
      if (!tournament) throw new Error('Tournament not found');
      
      // Delete existing players for this tournament
      await supabase
        .from('tournament_players')
        .delete()
        .eq('tournament_id', tournament.id);
      
      // Insert new players
      if (players.length > 0) {
        const playersToInsert = players.map(player => {
          // Try multiple field name variations for account number
          const accountNumber = player.PlayerAccountNumber || 
                              player.playerAccountNumber || 
                              player['Player Account Number'] || 
                              player.AccountNumber || 
                              player.accountNumber ||
                              player.account_number;
          
          const firstName = player.FirstName || 
                          player.firstName || 
                          player['First Name'] || 
                          player.first_name;
          
          const lastName = player.LastName || 
                         player.lastName || 
                         player['Last Name'] || 
                         player.last_name;
          
          // Only log if mapping fails
          if (!accountNumber || !firstName || !lastName) {
            console.log('FAILED mapping player:', { 
              original: player, 
              accountNumber, 
              firstName, 
              lastName 
            });
          }
          
          return {
            tournament_id: tournament.id,
            player_account_number: accountNumber,
            first_name: firstName,
            last_name: lastName,
            entry_type: player.EntryType || player.entryType || player['Entry Type'] || 'PAY',
            host: player.Host || player.host || null,
            additional_data: {
              ...Object.keys(player).reduce((acc, key) => {
                if (!['id', 'PlayerAccountNumber', 'FirstName', 'LastName', 'EntryType', 'Host', 'playerAccountNumber', 'firstName', 'lastName', 'entryType', 'host'].includes(key)) {
                  acc[key] = player[key];
                }
                return acc;
              }, {})
            }
          };
        });
        
        console.log('Players to insert:', playersToInsert.slice(0, 2)); // Log first 2 players
        
        const { error: insertError, data: insertResult } = await supabase
          .from('tournament_players')
          .insert(playersToInsert)
          .select();
        
        console.log('Insert result:', { insertResult, insertError });
        if (insertError) {
          console.error('Insert error details:', insertError);
          throw insertError;
        }
        console.log(`Successfully inserted ${insertResult?.length || 0} players`);
      }
      
      setTournamentPlayers(prev => ({
        ...prev,
        [tournamentName]: players
      }));
      
      // Force reload players to refresh the hook
      await loadPlayers(tournamentName);
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      throw err;
    }
  };

  const uploadPlayersFile = async (eventName, file) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('uploadPlayersFile called with eventName:', eventName);
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const content = e.target.result;
            
            // Parse CSV using PapaParse
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
                  ...record
                };
                return player;
              });
            
            if (players.length === 0) {
              reject(new Error('No valid player data found in file.'));
              return;
            }
            
            // Save players to Supabase - FORCE the tournament name
            console.log('Forcing tournament name to:', eventName);
            await setCurrentTournamentPlayers(players, eventName);
            
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
  }, [selectedEvent, loadPlayers]);

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

  const loadRegistrations = useCallback(async (eventName) => {
    if (!eventName) return [];
    
    try {
      setLoading(true);
      setError(null);
      
      // Get tournament ID
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('name', eventName)
        .single();
      
      if (tournamentError) throw tournamentError;
      if (!tournament) return [];
      
      // Get registrations
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('tournament_id', tournament.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      console.log('=== LOAD REGISTRATIONS ===');
      console.log('Raw data from database:', (data || []).length, 'registrations');
      if (data && data.length > 0) {
        console.log('Sample raw registration:', {
          id: data[0].id,
          first_name: data[0].first_name,
          last_name: data[0].last_name,
          table_number: data[0].table_number,
          seat_number: data[0].seat_number,
          round: data[0].round
        });
      }
      
      // Transform data to match expected format
      const transformedData = (data || []).map(reg => ({
        ...reg,
        eventName: eventName,
        accountNumber: reg.account_number,
        firstName: reg.first_name,
        lastName: reg.last_name,
        tableNumber: reg.table_number,
        seatNumber: reg.seat_number,
        timeSlot: reg.time_slot,
        entryType: reg.entry_type,
        registeredBy: reg.registered_by,
        createdAt: reg.created_at,
        playerAccountNumber: reg.account_number, // Add this for consistency
        paymentType: reg.payment_type,
        paymentAmount: reg.payment_amount,
        paymentType2: reg.payment_type2,
        paymentAmount2: reg.payment_amount2,
        comments: reg.comments,
        isMulligan: reg.mulligan
      }));
      
      console.log('Transformed registrations with seating:', transformedData.filter(r => r.tableNumber !== null).map(r => ({
        name: `${r.firstName} ${r.lastName}`,
        table: r.tableNumber,
        seat: r.seatNumber,
        round: r.round
      })));
      
      setRegistrations(transformedData);
      return transformedData;
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      console.error('Error loading registrations:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const addRegistration = async (registration) => {
    try {
      setError(null);
      
      // Get tournament ID
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('name', selectedEvent)
        .single();
      
      if (tournamentError) throw tournamentError;
      if (!tournament) throw new Error('Tournament not found');
      
      // Find player ID if exists
      let playerId = null;
      if (registration.accountNumber) {
        const { data: player } = await supabase
          .from('tournament_players')
          .select('id')
          .eq('tournament_id', tournament.id)
          .eq('player_account_number', registration.accountNumber)
          .single();
        
        if (player) playerId = player.id;
      }
      
      // Insert registration
      const { data, error } = await supabase
        .from('registrations')
        .insert([{
          tournament_id: tournament.id,
          player_id: playerId,
          event_name: selectedEvent,
          first_name: registration.firstName,
          last_name: registration.lastName,
          account_number: registration.accountNumber,
          round: registration.round,
          time_slot: registration.timeSlot,
          table_number: registration.tableNumber,
          seat_number: registration.seatNumber,
          host: registration.host || null,
          mulligan: registration.mulligan || registration.isMulligan || false,
          last_player: registration.lastPlayer || false,
          entry_type: registration.entryType || 'PAY',
          registered_by: registration.registeredBy || null,
          payment_type: registration.paymentType || null,
          payment_amount: parseFloat(registration.paymentAmount) || 0,
          payment_type2: registration.paymentType2 || null,
          payment_amount2: parseFloat(registration.paymentAmount2) || 0,
          comments: registration.comments || registration.comment || null
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      const transformedData = {
        ...data,
        eventName: selectedEvent,
        accountNumber: data.account_number,
        firstName: data.first_name,
        lastName: data.last_name,
        tableNumber: data.table_number,
        seatNumber: data.seat_number,
        timeSlot: data.time_slot,
        entryType: data.entry_type,
        registeredBy: data.registered_by,
        createdAt: data.created_at,
        paymentType: data.payment_type,
        paymentAmount: data.payment_amount,
        paymentType2: data.payment_type2,
        paymentAmount2: data.payment_amount2,
        comments: data.comments,
        isMulligan: data.mulligan
      };
      
      setRegistrations(prev => [...prev, transformedData]);
      return transformedData;
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      throw err;
    }
  };

  const updateRegistrations = async (newRegistrationsOrUpdater) => {
    try {
      setError(null);
      
      // Get tournament ID
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('name', selectedEvent)
        .single();
      
      if (tournamentError) throw tournamentError;
      if (!tournament) throw new Error('Tournament not found');
      
      let updatedRegistrations;
      
      // Handle functional update
      if (typeof newRegistrationsOrUpdater === 'function') {
        updatedRegistrations = newRegistrationsOrUpdater(registrations);
      } else if (Array.isArray(newRegistrationsOrUpdater)) {
        updatedRegistrations = newRegistrationsOrUpdater;
      } else {
        console.error('updateRegistrations called with invalid input:', newRegistrationsOrUpdater);
        return;
      }
      
      console.log('=== UPDATE REGISTRATIONS START ===');
      console.log('About to process registrations:', updatedRegistrations.length);
      console.log('Selected event:', selectedEvent);
      console.log('Tournament ID:', tournament.id);
      
      // Process each registration - either insert new ones or update existing ones
      const updatePromises = [];
      for (const reg of updatedRegistrations) {
        console.log('\nProcessing registration:', {
          firstName: reg.firstName,
          lastName: reg.lastName,
          accountNumber: reg.playerAccountNumber || reg.accountNumber,
          round: reg.round,
          tableNumber: reg.tableNumber,
          seatNumber: reg.seatNumber,
          timeSlot: reg.timeSlot,
          isMulligan: reg.isMulligan || false
        });
        // Check if this registration exists in the database
        const { data: existingReg, error: fetchError } = await supabase
          .from('registrations')
          .select('id')
          .eq('tournament_id', tournament.id)
          .eq('account_number', reg.playerAccountNumber || reg.accountNumber)
          .eq('round', reg.round)
          .eq('mulligan', reg.isMulligan || false)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Error checking existing registration:', fetchError);
          continue;
        }
        
        if (existingReg) {
          // Update existing registration
          console.log('Found existing registration in DB:', existingReg.id);
          console.log('Seating data being updated:', {
            table_number: reg.tableNumber,
            seat_number: reg.seatNumber,
            time_slot: reg.timeSlot,
            full_reg: JSON.stringify(reg, null, 2)
          });
          
          const updatePayload = {
            first_name: reg.firstName,
            last_name: reg.lastName,
            account_number: reg.playerAccountNumber || reg.accountNumber,
            round: reg.round,
            time_slot: reg.timeSlot,
            table_number: reg.tableNumber,
            seat_number: reg.seatNumber,
            host: reg.host,
            mulligan: reg.isMulligan || reg.mulligan || false,
            last_player: reg.lastPlayer || false,
            entry_type: reg.entryType || 'PAY',
            registered_by: reg.employee || reg.registeredBy,
            payment_type: reg.paymentType,
            payment_amount: parseFloat(reg.paymentAmount) || 0,
            payment_type2: reg.paymentType2,
            payment_amount2: parseFloat(reg.paymentAmount2) || 0,
            comments: reg.comments || reg.comment
          };
          
          console.log('UPDATE PAYLOAD:', JSON.stringify(updatePayload, null, 2));
          const { data: updateData, error: updateError } = await supabase
            .from('registrations')
            .update(updatePayload)
            .eq('id', existingReg.id)
            .select();
          
          if (updateError) {
            console.error('Error updating registration:', updateError);
            console.error('Failed update payload:', updatePayload);
            throw updateError;
          } else {
            console.log('Update successful! Returned data:', updateData);
          }
        } else {
          // Insert new registration
          console.log('Inserting new registration for:', reg.firstName, reg.lastName);
          console.log('Seating data being inserted:', 
            'tableNumber:', reg.tableNumber,
            'seatNumber:', reg.seatNumber,
            'timeSlot:', reg.timeSlot
          );
          const { error: insertError } = await supabase
            .from('registrations')
            .insert([{
              tournament_id: tournament.id,
              event_name: selectedEvent,
              first_name: reg.firstName,
              last_name: reg.lastName,
              account_number: reg.playerAccountNumber || reg.accountNumber,
              round: reg.round,
              time_slot: reg.timeSlot,
              table_number: reg.tableNumber,
              seat_number: reg.seatNumber,
              host: reg.host,
              mulligan: reg.isMulligan || reg.mulligan || false,
              last_player: reg.lastPlayer || false,
              entry_type: reg.entryType || 'PAY',
              registered_by: reg.employee || reg.registeredBy,
              payment_type: reg.paymentType,
              payment_amount: parseFloat(reg.paymentAmount) || 0,
              payment_type2: reg.paymentType2,
              payment_amount2: parseFloat(reg.paymentAmount2) || 0,
              comments: reg.comments || reg.comment
            }]);
          
          if (insertError) {
            console.error('Error inserting registration:', insertError);
            throw insertError;
          }
        }
      }
      
      // Reload registrations from database to get the latest data
      console.log('\\n=== RELOADING REGISTRATIONS AFTER UPDATE ===');
      const reloadedData = await loadRegistrations(selectedEvent);
      console.log('Reloaded data includes seating assignments:', reloadedData.filter(r => r.tableNumber !== null).length);
      console.log('=== UPDATE REGISTRATIONS END ===\\n');
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      console.error('Error updating registrations:', err);
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      loadRegistrations(selectedEvent);
    }
  }, [selectedEvent, loadRegistrations]);

  return {
    registrations,
    setRegistrations: updateRegistrations,
    loading,
    error,
    loadRegistrations,
    addRegistration
  };
};

// Hook for disabled tables
export const useDisabledTables = (selectedEvent) => {
  const [disabledTables, setDisabledTables] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDisabledTables = useCallback(async (eventName) => {
    if (!eventName) return {};
    
    try {
      setLoading(true);
      setError(null);
      
      // Get tournament ID
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('name', eventName)
        .single();
      
      if (tournamentError) throw tournamentError;
      if (!tournament) return {};
      
      // Get disabled tables
      const { data, error } = await supabase
        .from('disabled_tables')
        .select('*')
        .eq('tournament_id', tournament.id);
      
      if (error) throw error;
      
      // Transform to the expected format
      const tableMap = {};
      (data || []).forEach(table => {
        const key = `${eventName}_${table.round}_${table.time_slot}`;
        if (!tableMap[key]) tableMap[key] = [];
        tableMap[key].push(table.table_number);
      });
      
      setDisabledTables(tableMap);
      return tableMap;
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      console.error('Error loading disabled tables:', err);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDisabledTables = async (eventName, round, timeSlot, tables) => {
    try {
      setError(null);
      
      // Get tournament ID
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('name', eventName)
        .single();
      
      if (tournamentError) throw tournamentError;
      if (!tournament) throw new Error('Tournament not found');
      
      // Delete existing disabled tables for this round/timeslot
      await supabase
        .from('disabled_tables')
        .delete()
        .eq('tournament_id', tournament.id)
        .eq('round', round)
        .eq('time_slot', timeSlot);
      
      // Insert new disabled tables
      if (tables.length > 0) {
        const tablesToInsert = tables.map(tableNumber => ({
          tournament_id: tournament.id,
          round: round,
          time_slot: timeSlot,
          table_number: tableNumber
        }));
        
        const { error: insertError } = await supabase
          .from('disabled_tables')
          .insert(tablesToInsert);
        
        if (insertError) throw insertError;
      }
      
      // Update local state
      const key = `${eventName}_${round}_${timeSlot}`;
      setDisabledTables(prev => ({
        ...prev,
        [key]: tables
      }));
    } catch (err) {
      const errorMessage = handleSupabaseError(err);
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      loadDisabledTables(selectedEvent);
    }
  }, [selectedEvent, loadDisabledTables]);

  return {
    disabledTables,
    setDisabledTables,
    updateDisabledTables,
    loading,
    error
  };
};