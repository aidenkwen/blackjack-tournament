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
  const rounds = [
    { key: 'round1', name: 'Round 1', isRebuy: false },
    { key: 'rebuy1', name: 'Rebuy 1', isRebuy: true },
    { key: 'rebuy2', name: 'Rebuy 2', isRebuy: true },
    { key: 'round2', name: 'Round 2', isRebuy: false },
    { key: 'superrebuy', name: 'Super Rebuy', isRebuy: true },
    { key: 'quarterfinals', name: 'Quarterfinals', isRebuy: false },
    { key: 'semifinals', name: 'Semifinals', isRebuy: false }
  ];

  const getPaymentTitle = () => {
    if (activeTab === 'registration') {
      return 'Registration Payment';
    }
    const currentRoundInfo = rounds.find(r => r.key === selectedRound);
    return currentRoundInfo?.isRebuy ? `${currentRoundInfo.name} Payment` : 'Payment';
  };

  const getExpectedAmount = () => {
    if (activeTab === 'registration') {
      return currentTournament.entryCost;
    }
    const currentRoundInfo = rounds.find(r => r.key === selectedRound);
    return currentRoundInfo?.isRebuy ? currentTournament.rebuyCost : currentTournament.entryCost;
  };

  // SIMPLIFIED: All payment types available, always show all options
  const getAvailablePaymentTypes = () => {
    return ['Cash', 'Credit', 'Chips', 'Comp'];
  };

  return (
    <div className="card payment-card">
      <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>{getPaymentTitle()}</h4>
      
      <div className="payment-fields-row">
        <div style={{ flex: 1 }}>
          <div className="form-group">
            <label className="mb-2">Payment Type</label>
            <select
              value={paymentType}
              onChange={(e) => handlePaymentTypeChange(e.target.value)}
              className="select-field"
            >
              <option value="">-- Select Payment Type --</option>
              {getAvailablePaymentTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="form-group">
            <label className="mb-2">Amount (Expected: ${getExpectedAmount()})</label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="input-field"
              placeholder={getExpectedAmount().toString()}
              disabled={paymentType === 'Comp'}
            />
          </div>
        </div>
      </div>

      <div className="form-group split-payment-checkbox">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={splitPayment}
            onChange={(e) => setSplitPayment(e.target.checked)}
            disabled={paymentType === 'Comp'}
          />
          <span>Split Payment</span>
        </label>
      </div>

      {splitPayment && paymentType !== 'Comp' && (
        <div className="split-payment-fields">
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label className="mb-2">Second Payment Type</label>
              <select
                value={paymentType2}
                onChange={(e) => setPaymentType2(e.target.value)}
                className="select-field"
              >
                <option value="">-- Select Second Payment Type --</option>
                {getAvailablePaymentTypes().filter(type => type !== 'Comp' && type !== paymentType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label className="mb-2">Second Amount</label>
              <input
                type="number"
                value={paymentAmount2}
                onChange={(e) => setPaymentAmount2(e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentCard;