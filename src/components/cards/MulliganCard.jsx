import React from 'react';

const MulliganCard = ({
  addMulligan,
  setAddMulligan,
  mulliganPaymentType,
  setMulliganPaymentType,
  mulliganAmount,
  setMulliganAmount,
  splitMulliganPayment,
  setSplitMulliganPayment,
  mulliganPaymentType2,
  setMulliganPaymentType2,
  mulliganAmount2,
  setMulliganAmount2,
  currentTournament
}) => {
  // Get available payment types for second mulligan payment (excluding the first selection)
  const getAvailableMulliganPaymentTypes2 = () => {
    return ['Cash', 'Credit', 'Chips'].filter(type => type !== mulliganPaymentType);
  };

  return (
    <div className="card mulligan-card">
      <div className="card-title">Mulligan</div>

      <div className="form-group mulligan-checkbox">
        <label>
          <input
            type="checkbox"
            checked={addMulligan}
            onChange={(e) => setAddMulligan(e.target.checked)}
          />{' '}
          Include Mulligan
        </label>
      </div>

      {addMulligan && (
        <>
          <div className="mulligan-fields-row">
            <div style={{ flex: 1 }}>
              <div className="form-group">
                <label className="mb-2">Mulligan Payment Type</label>
                <select
                  value={mulliganPaymentType}
                  onChange={(e) => {
                    setMulliganPaymentType(e.target.value);
                    // If switching payment type and it matches the second payment type, clear the second payment type
                    if (splitMulliganPayment && e.target.value === mulliganPaymentType2) {
                      setMulliganPaymentType2('');
                    }
                  }}
                  className="select-field"
                >
                  <option value="">-- Select payment type --</option>
                  {['Cash', 'Credit', 'Chips'].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div className="form-group">
                <label className="mb-2">Mulligan Amount</label>
                <input
                  type="number"
                  value={mulliganAmount}
                  onChange={(e) => setMulliganAmount(e.target.value)}
                  className="input-field"
                  placeholder={currentTournament.mulliganCost.toString()}
                />
              </div>
            </div>
          </div>

          <div className="form-group split-mulligan-checkbox">
            <label>
              <input
                type="checkbox"
                checked={splitMulliganPayment}
                onChange={(e) => setSplitMulliganPayment(e.target.checked)}
              />
              {' '}
              Split Mulligan Payment
            </label>
          </div>

          {splitMulliganPayment && (
            <div className="split-mulligan-fields">
              <div style={{ flex: 1 }}>
                <div className="form-group">
                  <label className="mb-2">Second Mulligan Payment Type</label>
                  <select
                    value={mulliganPaymentType2}
                    onChange={(e) => setMulliganPaymentType2(e.target.value)}
                    className="select-field"
                  >
                    <option value="">-- Select payment type --</option>
                    {getAvailableMulliganPaymentTypes2().map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="form-group">
                  <label className="mb-2">Second Mulligan Amount</label>
                  <input
                    type="number"
                    value={mulliganAmount2}
                    onChange={(e) => setMulliganAmount2(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MulliganCard;