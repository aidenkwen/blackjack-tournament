import React, { useState } from 'react';
import { UC } from '../../utils/formatting';
import PaymentCard from '../cards/PaymentCard';
import MulliganCard from '../cards/MulliganCard';

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
  const [entryType, setEntryType] = useState('PAY');
  const [registerForRound1, setRegisterForRound1] = useState(canRegisterForRound1);
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

  const handleEntryTypeChange = (newEntryType) => {
    setEntryType(newEntryType);
    if (newEntryType === 'COMP') {
      setPaymentType('Comp');
      setPaymentAmount('0');
    } else if (entryType === 'COMP' || paymentAmount === '0') {
      setPaymentType('');
      setPaymentAmount(currentTournament.entryCost.toString());
    }
  };

  const handlePaymentTypeChange = (newPaymentType) => {
    setPaymentType(newPaymentType);
    if (newPaymentType === 'Comp') {
      setPaymentAmount('0');
      setEntryType('COMP');
    } else if (paymentType === 'Comp' || paymentAmount === '0') {
      setPaymentAmount(currentTournament.entryCost.toString());
      setEntryType('PAY');
    }
  };

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert('Please enter both first and last name.');
      return;
    }

    const newPlayer = {
      playerAccountNumber: accountNumber,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      entryType: entryType,
      host: host
    };

    const registrationData = {
      paymentType,
      paymentAmount,
      splitPayment,
      paymentType2,
      paymentAmount2,
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
              <PaymentCard
                activeTab="registration"
                selectedRound="round1"
                paymentType={paymentType}
                setPaymentType={setPaymentType}
                paymentAmount={paymentAmount}
                setPaymentAmount={setPaymentAmount}
                splitPayment={splitPayment}
                setSplitPayment={setSplitPayment}
                paymentType2={paymentType2}
                setPaymentType2={setPaymentType2}
                paymentAmount2={paymentAmount2}
                setPaymentAmount2={setPaymentAmount2}
                currentPlayer={{ entryType }}
                currentTournament={currentTournament}
                getPaymentTypes={getPaymentTypes}
                handlePaymentTypeChange={handlePaymentTypeChange}
              />

              <MulliganCard
                addMulligan={addMulligan}
                setAddMulligan={setAddMulligan}
                mulliganPaymentType={mulliganPaymentType}
                setMulliganPaymentType={setMulliganPaymentType}
                mulliganAmount={mulliganAmount}
                setMulliganAmount={setMulliganAmount}
                splitMulliganPayment={splitMulliganPayment}
                setSplitMulliganPayment={setSplitMulliganPayment}
                mulliganPaymentType2={mulliganPaymentType2}
                setMulliganPaymentType2={setMulliganPaymentType2}
                mulliganAmount2={mulliganAmount2}
                setMulliganAmount2={setMulliganAmount2}
                currentTournament={currentTournament}
              />

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