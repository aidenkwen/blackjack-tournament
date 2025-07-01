import React from 'react';

const PaymentCard = ({
  activeTab,
  selectedRound,
  paymentType,
  setPaymentType,
  paymentAmount,
  setPaymentAmount,
  splitPayment,
  setSplitPayment,
  paymentType2,
  setPaymentType2,
  paymentAmount2,
  setPaymentAmount2,
  currentPlayer,
  currentTournament,
  getPaymentTypes,
  handlePaymentTypeChange
}) => {
  
  // Get player's entry type to determine payment restrictions
  const getPlayerEntryType = () => {
    if (!currentPlayer) return null;
    return currentPlayer.EntryType;
  };

  const playerEntryType = getPlayerEntryType();

  // Enhanced payment type change handler with Entry/Payment sync
  const handlePaymentTypeChangeEnhanced = (newPaymentType) => {
    // Prevent selecting Comp if Entry Type is PAY
    if (newPaymentType === 'Comp' && playerEntryType === 'PAY') {
      return;
    }
    
    if (handlePaymentTypeChange) {
      handlePaymentTypeChange(newPaymentType);
    } else {
      setPaymentType(newPaymentType);
      
      if (newPaymentType === 'Comp') {
        setPaymentAmount('0');
        setSplitPayment(false);
      } else if (paymentType === 'Comp') {
        if (activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1')) {
          setPaymentAmount(currentTournament.entryCost.toString());
        } else if (selectedRound && rounds.find(r => r.key === selectedRound)?.isRebuy) {
          setPaymentAmount(currentTournament.rebuyCost.toString());
        }
      }
    }
    
    // If switching payment type and it matches the second payment type, clear the second payment type
    if (splitPayment && newPaymentType === paymentType2) {
      setPaymentType2('');
    }
  };

  const getAvailablePaymentTypes = () => {
    if (playerEntryType === 'COMP') {
      return ['Comp'];
    } else if (playerEntryType === 'PAY') {
      return ['Cash', 'Credit', 'Chips'];
    }
    return getPaymentTypes ? getPaymentTypes() : ['Cash', 'Credit', 'Chips', 'Comp'];
  };

  // Get available payment types for second payment (excluding the first selection)
  const getAvailablePaymentTypes2 = () => {
    return ['Cash', 'Credit', 'Chips'].filter(type => type !== paymentType);
  };

  const isPaymentAmountDisabled = () => {
    return paymentType === 'Comp' || playerEntryType === 'COMP';
  };

  const isSplitPaymentDisabled = () => {
    return paymentType === 'Comp' || playerEntryType === 'COMP';
  };

  const rounds = [
    { key: 'round1', name: 'Round 1', isRebuy: false, timeSlots: 6 },
    { key: 'rebuy1', name: 'Rebuy 1', isRebuy: true, timeSlots: 2 },
    { key: 'rebuy2', name: 'Rebuy 2', isRebuy: true, timeSlots: 1 },
    { key: 'round2', name: 'Round 2', isRebuy: false, timeSlots: 3 },
    { key: 'superrebuy', name: 'Super Rebuy', isRebuy: true, timeSlots: 2 },
    { key: 'quarterfinals', name: 'Quarterfinals', isRebuy: false, timeSlots: 2 },
    { key: 'semifinals', name: 'Semifinals', isRebuy: false, timeSlots: 1 }
  ];

  return (
    <div className="card mb-4">
      <div className="card-title">
        {activeTab === 'registration' ? 'Payment' : 
         selectedRound === 'round1' ? 'Round 1 Payment' : 'Rebuy Payment'}
      </div>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1 }}>
          <div className="form-group">
            <label className="mb-2">Payment Type</label>
            <select
              value={paymentType}
              onChange={(e) => handlePaymentTypeChangeEnhanced(e.target.value)}
              className="select-field"
              style={{ 
                backgroundColor: (playerEntryType === 'COMP' && paymentType === 'Comp') ? '#f5f5f5' : '#ffffff',
                color: (playerEntryType === 'COMP' && paymentType === 'Comp') ? '#666' : '#000'
              }}
            >
              <option value="">-- Select payment type --</option>
              {getAvailablePaymentTypes().map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="form-group">
            <label className="mb-2">Amount</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="input-field"
              disabled={isPaymentAmountDisabled()}
              style={{ 
                backgroundColor: isPaymentAmountDisabled() ? '#f5f5f5' : '#ffffff',
                color: isPaymentAmountDisabled() ? '#666' : '#000'
              }}
            />
          </div>
        </div>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={splitPayment}
            onChange={(e) => setSplitPayment(e.target.checked)}
            disabled={isSplitPaymentDisabled()}
          />{' '}
          Split Payment
        </label>
      </div>

      {splitPayment && (
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label className="mb-2">Payment Type 2</label>
              <select
                value={paymentType2}
                onChange={(e) => setPaymentType2(e.target.value)}
                className="select-field"
              >
                <option value="">-- Select payment type --</option>
                {getAvailablePaymentTypes2().map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label className="mb-2">Amount 2</label>
              <input
                type="number"
                value={paymentAmount2}
                onChange={(e) => setPaymentAmount2(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentCard;