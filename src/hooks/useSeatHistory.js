import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useSeatHistory = (tournamentId) => {
  const [lastAssignment, setLastAssignment] = useState(null);
  const [loading, setLoading] = useState(false);

  // Record a seat assignment
  const recordAssignment = async (registrationId, round, timeSlot, previousSeat, newSeat, assignedBy) => {
    if (!tournamentId) return;
    
    try {
      const { data, error } = await supabase
        .from('seat_assignment_history')
        .insert([{
          tournament_id: tournamentId,
          registration_id: registrationId,
          round: round,
          time_slot: timeSlot,
          previous_table_number: previousSeat?.table || null,
          previous_seat_number: previousSeat?.seat || null,
          new_table_number: newSeat?.table || null,
          new_seat_number: newSeat?.seat || null,
          assigned_by: assignedBy
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      setLastAssignment(data);
      return data;
    } catch (err) {
      console.error('Error recording seat assignment:', err);
      throw err;
    }
  };

  // Get the last assignment for undo
  const getLastAssignment = useCallback(async () => {
    if (!tournamentId) return null;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('seat_assignment_history')
        .select(`
          *,
          registrations (
            id,
            first_name,
            last_name,
            account_number,
            round,
            time_slot
          )
        `)
        .eq('tournament_id', tournamentId)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      
      setLastAssignment(data);
      return data;
    } catch (err) {
      console.error('Error getting last assignment:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  // Undo the last assignment
  const undoLastAssignment = async () => {
    if (!lastAssignment) return null;
    
    try {
      setLoading(true);
      
      // Update the registration back to previous seat
      const { error } = await supabase
        .from('registrations')
        .update({
          table_number: lastAssignment.previous_table_number,
          seat_number: lastAssignment.previous_seat_number
        })
        .eq('id', lastAssignment.registration_id);
      
      if (error) throw error;
      
      // Delete this history entry
      await supabase
        .from('seat_assignment_history')
        .delete()
        .eq('id', lastAssignment.id);
      
      // Get the next most recent assignment
      await getLastAssignment();
      
      return {
        success: true,
        undoneAssignment: lastAssignment
      };
    } catch (err) {
      console.error('Error undoing assignment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    recordAssignment,
    undoLastAssignment,
    lastAssignment,
    loading,
    getLastAssignment
  };
};