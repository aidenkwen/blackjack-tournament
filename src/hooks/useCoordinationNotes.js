import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useCoordinationNotes = (tournamentId) => {
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all notes for the tournament
  const loadNotes = useCallback(async () => {
    if (!tournamentId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coordination_notes')
        .select('*')
        .eq('tournament_id', tournamentId);
      
      if (error) throw error;
      
      // Convert to a map for easy access
      const notesMap = {};
      (data || []).forEach(note => {
        const key = `${note.round}_${note.time_slot || 'all'}`;
        notesMap[key] = note.note;
      });
      
      setNotes(notesMap);
    } catch (err) {
      console.error('Error loading coordination notes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  // Save or update a note
  const saveNote = async (round, timeSlot, noteText, createdBy) => {
    if (!tournamentId) return;
    
    try {
      const noteData = {
        tournament_id: tournamentId,
        round: round,
        time_slot: timeSlot,
        note: noteText.trim(),
        created_by: createdBy
      };

      if (noteText.trim()) {
        // Upsert the note
        const { error } = await supabase
          .from('coordination_notes')
          .upsert(noteData, {
            onConflict: 'tournament_id,round,time_slot'
          });
        
        if (error) throw error;
      } else {
        // Delete if empty
        const { error } = await supabase
          .from('coordination_notes')
          .delete()
          .eq('tournament_id', tournamentId)
          .eq('round', round)
          .eq('time_slot', timeSlot);
        
        if (error) throw error;
      }
      
      // Update local state
      const key = `${round}_${timeSlot || 'all'}`;
      if (noteText.trim()) {
        setNotes(prev => ({ ...prev, [key]: noteText.trim() }));
      } else {
        setNotes(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      }
    } catch (err) {
      console.error('Error saving coordination note:', err);
      setError(err.message);
      throw err;
    }
  };

  // Get note for specific round/timeslot
  const getNote = (round, timeSlot) => {
    const key = `${round}_${timeSlot || 'all'}`;
    return notes[key] || '';
  };

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return {
    notes,
    getNote,
    saveNote,
    loading,
    error
  };
};