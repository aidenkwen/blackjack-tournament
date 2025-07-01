import React, { useState, useEffect } from 'react';
import { UC } from '../../utils/formatting';

const NewPlayerForm = ({ 
  accountNumber, 
  currentTournament, 
  onSave, 
  onCancel,
  selectedEvent,
  employee,
  host,
  setHost,
  comments,
  setComments,
  canRegisterForRound1
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [entryType, setEntryType] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(currentTournament.entryCost.toString());
  const [splitPayment, setSplitPayment] = useState(false);
  const [paymentType2, setPaymentType2] = useState('');
  const [paymentAmount2, setPaymentAmount2] = useState('');
  const [registerForRound1, setRegisterForRound1] = useState(canRegisterForRound1);
  
  const [addMulligan, setAddMulligan] = useState(false);
  const [mulliganPaymentType, setMulliganPaymentType] = useState('');
  const [mulliganAmount, setMulliganAmount] = useState(currentTournament.mulliganCost.toString());
  const [splitMulliganPayment, setSplitMulliganPayment] = useState(false);
  const [mulliganPaymentType2, setMulliganPaymentType2] = useState('');
  const [mulliganAmount2, setMulliganAmount2] = useState('');

  // Sync Entry Type with Payment Type
  useEffect(() => {
    if (entryType === 'COMP') {
      setPaymentType('Comp');
      setPaymentAmount('0');
      setSplitPayment(false);
      setPaymentType2('');
      setPaymentAmount2('');
    } else if (entryType === 'PAY' && paymentType === 'Comp') {
      setPaymentType('');
      setPaymentAmount(currentTournament.entryCost.toString());
    }
  }, [entryType, currentTournament.entryCost, paymentType]);

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert('Please enter both first and last name.');
      return;
    }

    if (!entryType) {
      alert('Please select an entry type.');
      return;
    }

    if (registerForRound1 && !paymentType) {
      alert('Please select a payment type for Round 1 registration.');
      return;
    }

    if (registerForRound1 && splitPayment && (!paymentType2 || !paymentAmount2 || parseInt(paymentAmount2) === 0)) {
      alert('Please complete both parts of the split payment with non-zero amounts.');
      return;
    }

    if (addMulligan && registerForRound1) {
      if (!mulliganPaymentType) {
        alert('Please select a payment type for the mulligan.');
        return;
      }
      if (!mulliganAmount) {
        alert('Please enter an amount for the mulligan.');
        return;
      }
      if (splitMulliganPayment && (!mulliganPaymentType2 || !mulliganAmount2 || parseInt(mulliganAmount2) === 0)) {
        alert('Please complete both parts of the split mulligan payment with non-zero amounts.');
        return;
      }
    }

    const newPlayer = {
      PlayerAccountNumber: accountNumber,
      FirstName: firstName.trim(),
      LastName: lastName.trim(),
      EntryType: entryType,
      Mention: host,
      EventName: selectedEvent
    };

    onSave(newPlayer, registerForRound1, {
      paymentType,
      paymentAmount: parseInt(paymentAmount) || 0,
      splitPayment,
      paymentType2,
      paymentAmount2: parseInt(paymentAmount2) || 0,
      host,
      comments,
      addMulligan,
      mulliganPaymentType,
      mulliganAmount: parseInt(mulliganAmount) || 0,
      splitMulliganPayment,
      mulliganPaymentType2,
      mulliganAmount2: parseInt(mulliganAmount2) || 0
    });
  };

  const handlePaymentTypeChange = (newPaymentType) => {
    // Prevent selecting Comp if Entry Type is PAY
    if (newPaymentType === 'Comp' && entryType === 'PAY') {
      return;
    }
    
    setPaymentType(newPaymentType);
    
    if (newPaymentType === 'Comp') {
      setPaymentAmount('0');
      setSplitPayment(false);
    } else if (paymentType === 'Comp') {
      setPaymentAmount(currentTournament.entryCost.toString());
    }
  };

  const handleSplitPaymentChange = (checked) => {
    setSplitPayment(checked);
    if (!checked) {
      setPaymentType2('');
      setPaymentAmount2('');
    }
  };

  const handleSplitMulliganPaymentChange = (checked) => {
    setSplitMulliganPayment(checked);
    if (!checked) {
      setMulliganPaymentType2('');
      setMulliganAmount2('');
    }
  };

  const getAvailablePaymentTypes = () => {
    const baseTypes = ['Cash', 'Credit', 'Chips'];
    if (entryType === 'COMP') {
      return ['Comp'];
    } else if (entryType === 'PAY') {
      return baseTypes;
    }
    return [...baseTypes, 'Comp'];
  };

  const isPaymentAmountDisabled = () => {
    return paymentType === 'Comp' || entryType === 'COMP';
  };

  return (
    <div className="mb-4">
      <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        New Player - Account: {accountNumber}
      </p>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label className="mb-2">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(UC(e.target.value))}
                className="input-field"
                placeholder="Enter first name"
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="form-group">
              <label className="mb-2">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(UC(e.target.value))}
                className="input-field"
                placeholder="Enter last name"
              />
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label className="mb-2">Entry Type</label>
          <select
            value={entryType}
            onChange={(e) => setEntryType(e.target.value)}
            className="select-field"
          >
            <option value="">-- Select entry type --</option>
            <option value="PAY">Pay</option>
            <option value="COMP">Comp</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="mb-2">Host</label>
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(UC(e.target.value))}
          className="input-field"
          placeholder="Enter host name"
        />
      </div>

      <div className="form-group">
        <label className="mb-2">Comments</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(UC(e.target.value))}
          className="textarea-field"
          rows="3"
        />
      </div>

      {canRegisterForRound1 && (
        <>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={registerForRound1}
                onChange={(e) => setRegisterForRound1(e.target.checked)}
              />{' '}
              Register this player for Round 1
            </label>
          </div>

          {registerForRound1 && (
            <>
              <div className="card mb-4">
                <div className="card-title">Payment</div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div className="form-group">
                      <label className="mb-2">Payment Type</label>
                      <select
                        value={paymentType}
                        onChange={(e) => handlePaymentTypeChange(e.target.value)}
                        className="select-field"
                        style={{ 
                          backgroundColor: entryType === 'COMP' && paymentType === 'Comp' ? '#f5f5f5' : '#ffffff',
                          color: entryType === 'COMP' && paymentType === 'Comp' ? '#666' : '#000'
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
                      onChange={(e) => handleSplitPaymentChange(e.target.checked)}
                      disabled={paymentType === 'Comp' || entryType === 'COMP'}
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
                          <option value="Cash">Cash</option>
                          <option value="Credit">Credit</option>
                          <option value="Chips">Chips</option>
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
                            <option value="Cash">Cash</option>
                            <option value="Credit">Credit</option>
                            <option value="Chips">Chips</option>
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
                          onChange={(e) => handleSplitMulliganPaymentChange(e.target.checked)}
                        />{' '}
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
                              <option value="Cash">Cash</option>
                              <option value="Credit">Credit</option>
                              <option value="Chips">Chips</option>
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
            </>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={handleSave} className="btn btn-success">
          {canRegisterForRound1 && registerForRound1 ? 'Add Player & Register for Round 1' : 'Add Player to Database'}
        </button>
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default NewPlayerForm;