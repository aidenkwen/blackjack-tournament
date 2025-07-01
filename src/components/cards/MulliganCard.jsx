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
  return (
    <div className="card mb-4">
      <div className="card-title">Mulligan</div>

      <div className="form-group">
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
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div className="form-group">
                <label className="mb-2">Mulligan Payment Type</label>
                <select
                  value={mulliganPaymentType}
                  onChange={(e) => setMulliganPaymentType(e.target.value)}
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

          <div className="form-group">
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
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div className="form-group">
                  <label className="mb-2">Mulligan Payment Type 2</label>
                  <select
                    value={mulliganPaymentType2}
                    onChange={(e) => setMulliganPaymentType2(e.target.value)}
                    className="select-field"
                  >
                    <option value="">-- Select payment type --</option>
                    {['Cash', 'Credit', 'Chips'].map((type) => (
                      <option
                        key={type}
                        value={type}
                        disabled={type === mulliganPaymentType}
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="form-group">
                  <label className="mb-2">Mulligan Amount 2</label>
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