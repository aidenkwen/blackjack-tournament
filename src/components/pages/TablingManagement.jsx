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
  const { 
    selectedEvent, 
    tournaments, 
    registrations, 
    setRegistrations,
    globalDisabledTables,
    setGlobalDisabledTables // Use from context instead of local state
  } = useTournamentContext();
  
  const [activeTab, setActiveTab] = useState('tabling');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  const PaymentBreakdownModal = () => {
    if (!showPaymentModal) return null;
    
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '600px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #ddd' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Payment Breakdown</h3>
            <button 
              onClick={() => setShowPaymentModal(false)} 
              className="btn-close"
            >
              ×
            </button>
          </div>
          
          <div>
            {renderPaymentSection('Entry Costs', entryTotals)}
            {renderPaymentSection('Rebuys', rebuyTotals)}
            {renderPaymentSection('Mulligans', mulliganTotals)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <button onClick={handleBackToRegistration} className="link-back link-back-block">
        {'<'} Back to Registration
      </button>

      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">{currentTournament.name} / Player Seating</h1>
          <button 
            onClick={() => setShowPaymentModal(true)}
            className="btn btn-secondary"
          >
            View Payment Breakdown
          </button>
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
      
      <PaymentBreakdownModal />
    </div>
  );
};

export default TablingManagement;