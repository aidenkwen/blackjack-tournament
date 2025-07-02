import React, { useState } from 'react';
import { UC } from '../../utils/formatting';
import SearchBar from '../common/SearchBar';
import NewPlayerForm from './NewPlayerForm';
import PaymentCard from '../cards/PaymentCard';
import MulliganCard from '../cards/MulliganCard';
import PlayerInfoCard from '../cards/PlayerInfoCard';

const RegistrationForm = ({ hook, activeTab, selectedRound, currentTournament }) => {
  const [searchAccount, setSearchAccount] = useState('');

  const handleSearch = () => {
    hook.searchPlayer(searchAccount);
  };

  const handleCardSwipe = (cardNumber) => {
    setSearchAccount(cardNumber);
    setTimeout(() => hook.searchPlayer(cardNumber), 100);
  };
  
  const getButtonText = () => {
    if (activeTab === 'registration') {
      return hook.addMulligan ? 'Register Player and Add Mulligan' : 'Register Player';
    }
    return hook.addMulligan ? 'Check In and Add Mulligan' : 'Check In';
  };
  
  // Determine if the payment card should be shown
  const showPaymentCard = activeTab === 'registration' || (hook.rounds.find(r => r.key === selectedRound)?.isRebuy);

  return (
    <>
      <SearchBar
        searchValue={searchAccount}
        onSearchChange={setSearchAccount}
        onSearch={handleSearch}
        onCardSwipe={handleCardSwipe}
        placeholder="Enter 14-digit Player Account Number"
      />

      {hook.showNewPlayerForm && (
        <NewPlayerForm
          accountNumber={searchAccount}
          currentTournament={currentTournament}
          // onSave, onCancel would need to be passed down from the hook
        />
      )}

      {hook.currentPlayer && (
        <div>
          <PlayerInfoCard currentPlayer={hook.currentPlayer} activeTab={activeTab} selectedRound={selectedRound} />
          
          {showPaymentCard && (
            <PaymentCard
              activeTab={activeTab}
              selectedRound={selectedRound}
              paymentType={hook.paymentType}
              setPaymentType={hook.setPaymentType}
              paymentAmount={hook.paymentAmount}
              setPaymentAmount={hook.setPaymentAmount}
              splitPayment={hook.splitPayment}
              setSplitPayment={hook.setSplitPayment}
              paymentType2={hook.paymentType2}
              setPaymentType2={hook.setPaymentType2}
              paymentAmount2={hook.paymentAmount2}
              setPaymentAmount2={hook.setPaymentAmount2}
              currentPlayer={hook.currentPlayer}
              currentTournament={currentTournament}
              getPaymentTypes={() => ['Cash', 'Credit', 'Chips', 'Comp']}
              handlePaymentTypeChange={hook.handlePaymentTypeChange}
            />
          )}

          <MulliganCard
            addMulligan={hook.addMulligan}
            setAddMulligan={hook.setAddMulligan}
            mulliganPaymentType={hook.mulliganPaymentType}
            setMulliganPaymentType={hook.setMulliganPaymentType}
            mulliganAmount={hook.mulliganAmount}
            setMulliganAmount={hook.setMulliganAmount}
            splitMulliganPayment={hook.splitMulliganPayment}
            setSplitMulliganPayment={hook.setSplitMulliganPayment}
            mulliganPaymentType2={hook.mulliganPaymentType2}
            setMulliganPaymentType2={hook.setMulliganPaymentType2}
            mulliganAmount2={hook.mulliganAmount2}
            setMulliganAmount2={hook.setMulliganAmount2}
            currentTournament={currentTournament}
          />
          
          <div className="form-group">
            <label className="mb-2">Comments</label>
            <textarea value={hook.comments} onChange={(e) => hook.setComments(UC(e.target.value))} className="textarea-field" rows="3"/>
          </div>

          <button onClick={hook.handleRegistration} className="btn btn-success">
            {getButtonText()}
          </button>
        </div>
      )}
    </>
  );
};

export default RegistrationForm;