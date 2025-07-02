import React, { useState } from 'react';
import TablingOverview from './TablingOverview';
import PlayerSeatEdit from './PlayerSeatEdit';

const TablingManagement = ({
  tournament,
  selectedEvent,
  tournaments,
  registrations,
  setRegistrations,
  globalDisabledTables,
  setGlobalDisabledTables,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState('tabling');

  // Get current tournament info - handle both scenarios
  const getCurrentTournament = () => {
    // If tournament prop is passed directly (from ManageTournamentsPage), use it
    if (tournament) {
      return tournament;
    }
    
    // Otherwise, find tournament by selectedEvent (from Registration page)
    if (!selectedEvent) {
      return { name: 'Unknown Tournament', entryCost: 500, rebuyCost: 500, mulliganCost: 100 };
    }
    
    const defaultTournament = { name: selectedEvent, entryCost: 500, rebuyCost: 500, mulliganCost: 100 };
    
    if (!tournaments || !Array.isArray(tournaments)) {
      return defaultTournament;
    }
    
    const customTournament = tournaments.find(t => t.name === selectedEvent);
    return customTournament || defaultTournament;
  };

  const currentTournament = getCurrentTournament();
  const eventName = currentTournament.name || selectedEvent;
  const tournamentRegistrations = registrations.filter(r => r.eventName === eventName);

  // Calculate payment totals
  const calculatePaymentTotals = () => {
    const totals = {
      'Cash': 0,
      'Credit': 0,
      'Chips': 0
    };
    
    tournamentRegistrations.forEach(reg => {
      // Add primary payment
      if (reg.paymentType && reg.paymentType !== 'Comp' && reg.paymentAmount > 0) {
        if (totals.hasOwnProperty(reg.paymentType)) {
          totals[reg.paymentType] += reg.paymentAmount;
        }
      }
      
      // Add secondary payment (for split payments)
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
      <button onClick={onBack} className="link-back link-back-block">
        {'<'} Back to Registration
      </button>

      <div className="page-header">
        <h1 className="page-title">{eventName} / Player Seating</h1>
      </div>

      {/* Payment Details */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '16px', 
        backgroundColor: '#f9f9f9', 
        border: '1px solid #ddd', 
        borderRadius: '4px' 
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Payment Breakdown</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {Object.entries(paymentTotals).map(([paymentType, total]) => (
              <div key={paymentType} className="tournament-metadata" style={{ 
                fontSize: '1rem',
                fontWeight: '600',
                color: '#333'
              }}>
                {paymentType}: ${total.toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tabs">
        <div
          className={`tab ${activeTab === 'tabling' ? 'active' : ''}`}
          onClick={() => setActiveTab('tabling')}
        >
          Tabling Overview
        </div>
        <div
          className={`tab ${activeTab === 'player-edit' ? 'active' : ''}`}
          onClick={() => setActiveTab('player-edit')}
        >
          Edit Player Seating
        </div>
      </div>

      {activeTab === 'tabling' && (
        <TablingOverview
          tournament={currentTournament}
          registrations={tournamentRegistrations}
          setRegistrations={setRegistrations}
          allRegistrations={registrations}
          globalDisabledTables={globalDisabledTables}
          setGlobalDisabledTables={setGlobalDisabledTables}
        />
      )}

      {activeTab === 'player-edit' && (
        <PlayerSeatEdit
          tournament={currentTournament}
          registrations={tournamentRegistrations}
          setRegistrations={setRegistrations}
          allRegistrations={registrations}
          globalDisabledTables={globalDisabledTables}
          setGlobalDisabledTables={setGlobalDisabledTables}
        />
      )}
    </div>
  );
};

export default TablingManagement;
