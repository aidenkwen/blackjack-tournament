// Default tournament configuration
export const DEFAULT_TOURNAMENT = {
  name: '',
  rounds: 0,
  timeSlots: 1,
  entryCost: 500,
  rebuyCost: 500,
  mulliganCost: 100,
  entry_cost: 500,
  rebuy_cost: 500,
  mulligan_cost: 100,
  time_slots: 1
};

// Helper to ensure tournament has all required properties
export const ensureTournamentDefaults = (tournament) => {
  if (!tournament) return DEFAULT_TOURNAMENT;
  
  return {
    ...DEFAULT_TOURNAMENT,
    ...tournament,
    // Ensure camelCase properties exist
    entryCost: tournament.entryCost || tournament.entry_cost || DEFAULT_TOURNAMENT.entryCost,
    rebuyCost: tournament.rebuyCost || tournament.rebuy_cost || DEFAULT_TOURNAMENT.rebuyCost,
    mulliganCost: tournament.mulliganCost || tournament.mulligan_cost || DEFAULT_TOURNAMENT.mulliganCost,
    timeSlots: tournament.timeSlots || tournament.time_slots || DEFAULT_TOURNAMENT.timeSlots
  };
};