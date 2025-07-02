import React, { useState } from 'react';
import TablingOverview from './TablingOverview';
import PlayerSeatEdit from './PlayerSeatEdit';
import { useTournamentContext } from '../../context/TournamentContext';
import { useNavigate } from 'react-router-dom';

const TablingManagement = () => {
  const navigate = useNavigate();
  const { selectedEvent, tournaments, registrations, setRegistrations } = useTournamentContext();
  const [activeTab, setActiveTab] = useState('tabling');
  
  // FIX: State Colocation - This state now lives here, where it's used.
  const [globalDisabledTables, setGlobalDisabledTables] = useState({});

  const getCurrentTournament = () => {
    if (!selectedEvent) {
      return { name: 'Unknown Tournament', entryCost: 500, rebuyCost: 500, mulliganCost: 100 };
    }
    const defaultTournament = { name: selectedEvent, entryCost: 500, rebuyCost: 500, mulliganCost: 100 };
    if (!tournaments || !Array.isArray(tournaments)) {
      return defaultTournament;
    }
    return tournaments.find(t => t.name === selectedEvent) || defaultTournament;
  };

  const currentTournament = getCurrentTournament();
  // The registrations from context are already for the selected event.
  const tournamentRegistrations = registrations;

  const calculatePaymentTotals = () => {
    const totals = { 'Cash': 0, 'Credit': 0, 'Chips': 0 };
    tournamentRegistrations.forEach(reg => {
      if (reg.paymentType && reg.paymentType !== 'Comp' && reg.paymentAmount > 0) {
        if (totals.hasOwnProperty(reg.paymentType)) {
          totals[reg.paymentType] += reg.paymentAmount;
        }
      }
      if (reg.paymentType2 && reg.paymentType2 !== 'Comp' && reg.paymentAmount2 > 0) {
        if (totals.hasOwnProperty(reg.paymentType2)) {
          totals[reg.paymentType2] += reg.paymentAmount2;
        }
      }
    });
    return totals;
  };

  const paymentTotals = calculatePaymentTotals();

  return (
    <div className="container">
      <button onClick={() => navigate('/register')} className="link-back link-back-block">
        {'<'} Back to Registration
      </button>

      <div className="page-header">
        <h1 className="page-title">{currentTournament.name} / Player Seating</h1>
      </div>

      <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Payment Breakdown</h3>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {Object.entries(paymentTotals).map(([type, total]) => (
            <div key={type} className="tournament-metadata" style={{ fontSize: '1rem', fontWeight: '600', color: '#333' }}>
              {type}: ${total.toLocaleString()}
            </div>
          ))}
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'tabling' ? 'active' : ''}`} onClick={() => setActiveTab('tabling')}>
          Tabling Overview
        </div>
        <div className={`tab ${activeTab === 'player-edit' ? 'active' : ''}`} onClick={() => setActiveTab('player-edit')}>
          Edit Player Seating
        </div>
      </div>

      {activeTab === 'tabling' && (
        <TablingOverview
          tournament={currentTournament}
          registrations={tournamentRegistrations}
          globalDisabledTables={globalDisabledTables}
          setGlobalDisabledTables={setGlobalDisabledTables}
        />
      )}
      {activeTab === 'player-edit' && (
        <PlayerSeatEdit
          tournament={currentTournament}
          registrations={tournamentRegistrations}
          setRegistrations={setRegistrations}
          allRegistrations={registrations} // Note: This might need to come from context if it's all registrations ever
          globalDisabledTables={globalDisabledTables}
          setGlobalDisabledTables={setGlobalDisabledTables}
        />
      )}
    </div>
  );
};

export default TablingManagement;