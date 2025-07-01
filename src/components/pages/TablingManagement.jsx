import React, { useState } from 'react';
import TablingOverview from './TablingOverview';
import PlayerSeatEdit from './PlayerSeatEdit';

const TablingManagement = ({
  tournament,
  registrations,
  setRegistrations,
  globalDisabledTables,
  setGlobalDisabledTables,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState('tabling');

  const tournamentRegistrations = registrations.filter(r => r.eventName === tournament.name);

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
        {'<'} Back to Tournaments
      </button>

      <h1 className="page-title">{tournament.name} / Seating Management</h1>

      {/* Payment Summary */}
      <div style={{ 
        marginBottom: '24px', 
        padding: '16px', 
        backgroundColor: '#f9f9f9', 
        border: '1px solid #ddd', 
        borderRadius: '4px' 
      }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem' }}>Revenue Summary</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {Object.entries(paymentTotals).map(([paymentType, total]) => (
              <div key={paymentType} style={{ 
                fontSize: '1rem',
                fontWeight: '600',
                color: '#333'
              }}>
                {paymentType}: ${total.toLocaleString()}
              </div>
            ))}
          </div>
          <div style={{ 
            fontSize: '1rem', 
            fontWeight: 'bold', 
            color: '#8b0000' 
          }}>
            Total: ${Object.values(paymentTotals).reduce((sum, amount) => sum + amount, 0).toLocaleString()}
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
          tournament={tournament}
          registrations={tournamentRegistrations}
          setRegistrations={setRegistrations}
          allRegistrations={registrations}
          globalDisabledTables={globalDisabledTables}
          setGlobalDisabledTables={setGlobalDisabledTables}
        />
      )}

      {activeTab === 'player-edit' && (
        <PlayerSeatEdit
          tournament={tournament}
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