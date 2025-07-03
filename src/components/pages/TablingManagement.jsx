import React, { useState } from 'react';
import TablingOverview from './TablingOverview';
import PlayerSeatEdit from './PlayerSeatEdit';
import { useTournamentContext } from '../../context/TournamentContext';
import { useNavigate } from 'react-router-dom';

// Time slot utility function
const getTimeSlotName = (round, slotNumber) => {
  const timeSlotNames = {
    'round1': ['9 AM', '9:45 AM', '10:30 AM', '11:15 AM', '12:00 PM', '12:45 PM'],
    'rebuy1': ['1:30 PM', '2:15 PM'],
    'rebuy2': ['3 PM'],
    'round2': ['9 AM', '9:45 AM', '10:30 AM'],
    'superrebuy': ['11:15 AM', '12 PM'],
    'quarterfinals': ['12:45 PM', '1:30 PM'],
    'semifinals': ['2:30 PM']
  };
  
  const slots = timeSlotNames[round] || [];
  return slots[slotNumber - 1] || `Time Slot ${slotNumber}`;
};

const TablingManagement = () => {
  const navigate = useNavigate();
  const { selectedEvent, tournaments, registrations, setRegistrations } = useTournamentContext();
  const [activeTab, setActiveTab] = useState('tabling');
  const [showPaymentBreakdown, setShowPaymentBreakdown] = useState(false);
  
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
  const tournamentRegistrations = registrations;

  // Navigate back to registration preserving search state
  const handleBackToRegistration = () => {
    navigate('/register');
  };

  // FIXED: Separate payment breakdown by entry costs, rebuys, and mulligans with duplicate prevention
  const calculatePaymentTotals = () => {
    const entryTotals = { 'Cash': 0, 'Credit': 0, 'Chips': 0 };
    const rebuyTotals = { 'Cash': 0, 'Credit': 0, 'Chips': 0 };
    const mulliganTotals = { 'Cash': 0, 'Credit': 0, 'Chips': 0 };

    // Track processed registrations to avoid double counting updates
    const processedRegistrations = new Set();

    tournamentRegistrations.forEach(reg => {
      // Skip if we've already processed a registration for this player/round combination
      const registrationKey = `${reg.playerAccountNumber}-${reg.round}-${reg.isMulligan}`;
      if (processedRegistrations.has(registrationKey)) {
        return; // Skip duplicate/updated registration
      }
      processedRegistrations.add(registrationKey);

      let targetTotals;
      
      // Determine which category this registration belongs to
      if (reg.isMulligan) {
        targetTotals = mulliganTotals;
      } else if (reg.isRebuy) {
        targetTotals = rebuyTotals;
      } else {
        targetTotals = entryTotals;
      }

      // Add primary payment
      if (reg.paymentType && reg.paymentType !== 'Comp' && reg.paymentAmount > 0) {
        if (targetTotals.hasOwnProperty(reg.paymentType)) {
          targetTotals[reg.paymentType] += reg.paymentAmount;
        }
      }

      // Add secondary payment
      if (reg.paymentType2 && reg.paymentType2 !== 'Comp' && reg.paymentAmount2 > 0) {
        if (targetTotals.hasOwnProperty(reg.paymentType2)) {
          targetTotals[reg.paymentType2] += reg.paymentAmount2;
        }
      }
    });

    return { entryTotals, rebuyTotals, mulliganTotals };
  };

  const { entryTotals, rebuyTotals, mulliganTotals } = calculatePaymentTotals();

  const renderPaymentSection = (title, totals) => (
    <div style={{ marginBottom: '12px' }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: '600' }}>{title}</h4>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {Object.entries(totals).map(([type, total]) => (
          <div key={type} className="tournament-metadata" style={{ fontSize: '0.9rem', fontWeight: '500', color: '#333' }}>
            {type}: ${total.toLocaleString()}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container">
      <button onClick={handleBackToRegistration} className="link-back link-back-block">
        {'<'} Back to Registration
      </button>

      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">{currentTournament.name} / Player Seating</h1>
          <button 
            onClick={() => setShowPaymentBreakdown(!showPaymentBreakdown)}
            className="btn btn-secondary"
          >
            {showPaymentBreakdown ? 'Hide' : 'View'} Payment Breakdown
          </button>
        </div>
      </div>

      {/* Payment breakdown - now collapsible */}
      {showPaymentBreakdown && (
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Payment Breakdown</h3>
          {renderPaymentSection('Entry Costs', entryTotals)}
          {renderPaymentSection('Rebuys', rebuyTotals)}
          {renderPaymentSection('Mulligans', mulliganTotals)}
        </div>
      )}

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
          getTimeSlotName={getTimeSlotName}
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
          getTimeSlotName={getTimeSlotName}
        />
      )}
    </div>
  );
};

export default TablingManagement;