// Simplified NewPlayerForm 
import React, { useState } from 'react';
import { UC } from '../../utils/formatting';

const NewPlayerForm = ({
  accountNumber,
  currentTournament,
  onSave,
  onCancel,
  host,
  setHost,
  comments,
  setComments,
  canRegisterForRound1
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [entryType, setEntryType] = useState('PAY');
  const [registerForRound1, setRegisterForRound1] = useState(canRegisterForRound1);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(currentTournament.entryCost.toString());
  const [splitPayment, setSplitPayment] = useState(false);
  const [paymentType2, setPaymentType2] = useState('');
  const [paymentAmount2, setPaymentAmount2] = useState('');
  const [addMulligan, setAddMulligan] = useState(false);
  const [mulliganPaymentType, setMulliganPaymentType] = useState('');
  const [mulliganAmount, setMulliganAmount] = useState(currentTournament.mulliganCost.toString());
  const [splitMulliganPayment, setSplitMulliganPayment] = useState(false);
  const [mulliganPaymentType2, setMulliganPaymentType2] = useState('');
  const [mulliganAmount2, setMulliganAmount2] = useState('');

  // Time slots for Round 1
  const getTimeSlots = () => [
    { value: 1, name: '9:00 AM' },
    { value: 2, name: '9:45 AM' },
    { value: 3, name: '10:30 AM' },
    { value: 4, name: '11:15 AM' },
    { value: 5, name: '12:00 PM' },
    { value: 6, name: '12:45 PM' }
  ];

  // FIXED: Enhanced entry type change handler
  const handleEntryTypeChange = (newEntryType) => {
    setEntryType(newEntryType);
    if (newEntryType === 'COMP') {
      setPaymentType('Comp');
      setPaymentAmount('0');
      setSplitPayment(false);
      setPaymentType2('');
      setPaymentAmount2('');
    } else {
      setPaymentType('');
      setPaymentAmount(currentTournament.entryCost.toString());
    }
  };

  // FIXED: Enhanced payment type change handler
  const handlePaymentTypeChange = (newPaymentType) => {
    setPaymentType(newPaymentType);
    if (newPaymentType === 'Comp') {
      setPaymentAmount('0');
      setSplitPayment(false);
      setPaymentType2('');
      setPaymentAmount2('');
    } else {
      setPaymentAmount(currentTournament.entryCost.toString());
    }
  };

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert('Please enter both first and last name.');
      return;
    }

    if (registerForRound1 && !selectedTimeSlot) {
      alert('Please select a time slot for Round 1 registration.');
      return;
    }

    const newPlayer = {
      playerAccountNumber: accountNumber,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      entryType: entryType,
      host: host
    };

    // SIMPLIFIED: Registration data setup
    const registrationData = {
      selectedTimeSlot,
      paymentType: paymentType || (entryType === 'COMP' ? 'Comp' : ''),
      paymentAmount: paymentAmount,
      splitPayment: splitPayment,
      paymentType2: paymentType2,
      paymentAmount2: paymentAmount2,
      addMulligan,
      mulliganPaymentType,
      mulliganAmount,
      splitMulliganPayment,
      mulliganPaymentType2,
      mulliganAmount2,
      host,
      comments
    };

    onSave(newPlayer, registerForRound1, registrationData);
  };

  const getPaymentTypes = () => ['Cash', 'Credit', 'Chips', 'Comp'];

  return (
    <div style={{ marginBottom: '24px' }}>
      <div className="player-info-container">
        <h3 className="player-name-with-account">
          New Player<span className="account-part">, {accountNumber}</span>
        </h3>
        <p className="player-metadata">Create new player profile</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="mb-2">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(UC(e.target.value))}
            className="input-field"
            placeholder="Enter first name"
            required
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="mb-2">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(UC(e.target.value))}
            className="input-field"
            placeholder="Enter last name"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label className="mb-2">Entry Type</label>
        <select
          value={entryType}
          onChange={(e) => handleEntryTypeChange(e.target.value)}
          className="select-field"
        >
          <option value="PAY">PAY</option>
          <option value="COMP">COMP</option>
        </select>
      </div>

      {canRegisterForRound1 && (
        <>
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={registerForRound1}
                onChange={(e) => setRegisterForRound1(e.target.checked)}
              />
              <span>Register for Round 1 immediately</span>
            </label>
          </div>

          {registerForRound1 && (
            <>
              {/* Time Slot Selection */}
              <div className="card" style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Round 1 Registration</h4>
                <div className="form-group">
                  <label className="mb-2">Time Slot</label>
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="select-field"
                    style={{ maxWidth: '300px' }}
                  >
                    <option value="">-- Select Time Slot --</option>
                    {getTimeSlots().map(slot => (
                      <option key={slot.value} value={slot.value}>
                        {slot.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Card */}
              <div className="card" style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>Registration Payment</h4>
                
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div className="form-group">
                      <label className="mb-2">Payment Type</label>
                      <select
                        value={paymentType}
                        onChange={(e) => handlePaymentTypeChange(e.target.value)}
                        className="select-field"
                      >
                        <option value="">-- Select Payment Type --</option>
                        {getPaymentTypes().map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div className="form-group">
                      <label className="mb-2">Amount (Expected: ${currentTournament.entryCost})</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="input-field"
                        placeholder={currentTournament.entryCost.toString()}
                        disabled={paymentType === 'Comp'}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
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
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div className="form-group">
                        <label className="mb-2">Second Payment Type</label>
                        <select
                          value={paymentType2}
                          onChange={(e) => setPaymentType2(e.target.value)}
                          className="select-field"
                        >
                          <option value="">-- Select Second Payment Type --</option>
                          {getPaymentTypes().filter(type => type !== 'Comp' && type !== paymentType).map(type => (
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

              {/* Mulligan Card */}
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
                            {getPaymentTypes().map((type) => (
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
                            disabled={mulliganPaymentType === 'Comp'}
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
                          disabled={mulliganPaymentType === 'Comp'}
                        />
                        {' '}
                        Split Mulligan Payment
                      </label>
                    </div>

                    {splitMulliganPayment && mulliganPaymentType !== 'Comp' && (
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
                              {getPaymentTypes().filter(type => type !== mulliganPaymentType).map((type) => (
                                <option key={type} value={type}>
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
            </>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={handleSave} className="btn btn-success">
          {registerForRound1 ? 'Create Player and Register' : 'Create Player'}
        </button>
        <button onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default NewPlayerForm;