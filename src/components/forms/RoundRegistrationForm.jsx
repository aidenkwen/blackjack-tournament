// Updated RoundRegistrationForm with conditional PaymentCard visibility
import React from 'react';
import { UC } from '../../utils/formatting';
import SearchBar from '../common/SearchBar';
import NewPlayerForm from './NewPlayerForm';
import PaymentCard from '../cards/PaymentCard';
import MulliganCard from '../cards/MulliganCard';
import PlayerInfoCard from '../cards/PlayerInfoCard';
import LastPlayerCard from '../cards/LastPlayerCard';

const RoundRegistrationForm = ({ hook, currentRound, currentRoundInfo, currentTournament, lastRegisteredPlayer, allRegistrations }) => {
  const handleSearch = () => {
    hook.searchPlayer(hook.searchAccount);
  };

  const handleCardSwipe = (cardNumber) => {
    hook.setSearchAccount(cardNumber);
    setTimeout(() => hook.searchPlayer(cardNumber), 100);
  };

  const handleSearchChange = (value) => {
    hook.setSearchAccount(value);
  };

  const getAvailableTimeSlots = () => {
    const timeSlotNames = {
      'round1': [
        '9:00 AM',
        '9:45 AM', 
        '10:30 AM',
        '11:15 AM',
        '12:00 PM',
        '12:45 PM'
      ],
      'rebuy1': [
        '1:30 PM',
        '2:15 PM'
      ],
      'rebuy2': [
        '3:00 PM'
      ],
      'round2': [
        '9:00 AM',
        '9:45 AM',
        '10:30 AM'
      ],
      'superrebuy': [
        '11:15 AM',
        '12:00 PM'
      ],
      'quarterfinals': [
        '12:45 PM',
        '1:30 PM'
      ],
      'semifinals': [
        '2:30 PM'
      ]
    };

    const slots = timeSlotNames[currentRound] || [];
    return slots.map((name, index) => ({ value: index + 1, name }));
  };

  // FIXED: Simplified button text - no more "Check In"
  const getButtonText = () => {
    if (hook.addMulligan) {
      return `Register for ${currentRoundInfo.name} & Add Mulligan`;
    }
    return `Register for ${currentRoundInfo.name}`;
  };

  // FIXED: Only show PaymentCard for payment rounds
  const showPaymentCard = ['round1', 'rebuy1', 'rebuy2', 'superrebuy'].includes(currentRound);

  // SIMPLIFIED: Create lastPlayer object for LastPlayerCard
  const createLastPlayerData = () => {
    // Hide LastPlayerCard when there's a current player or new player form showing
    if (hook.currentPlayer || hook.showNewPlayerForm) return null;
    
    if (!lastRegisteredPlayer || lastRegisteredPlayer.round !== currentRound) return null;
    
    // Find all registrations for this player in this round
    const playerRegistrations = allRegistrations?.filter(r => 
      r.playerAccountNumber === lastRegisteredPlayer.playerAccountNumber && 
      r.round === lastRegisteredPlayer.round
    ) || [];
    
    const mainRegistration = playerRegistrations.find(r => !r.isMulligan);
    const mulliganRegistration = playerRegistrations.find(r => r.isMulligan);
    
    // SIMPLIFIED: Build purchases string using new eventType logic
    let purchases = '';
    if (mainRegistration) {
      if (mainRegistration.eventType === 'COMP') {
        purchases = `COMP ${currentRoundInfo.name}`;
      } else if (mainRegistration.eventType === 'PAY') {
        // Show payment method and amount for PAY
        if (mainRegistration.paymentType && mainRegistration.paymentAmount > 0) {
          purchases = `${currentRoundInfo.name} ${mainRegistration.paymentType} $${mainRegistration.paymentAmount}`;
        } else {
          purchases = `${currentRoundInfo.name}`;
        }
      } else {
        // Fallback
        purchases = `${currentRoundInfo.name} $${mainRegistration.paymentAmount || 0}`;
      }
    } else {
      purchases = `Registered for ${currentRoundInfo.name}`;
    }
    
    if (mulliganRegistration) {
      if (mulliganRegistration.paymentType === 'Comp') {
        purchases += ` + COMP Mulligan`;
      } else {
        purchases += ` + Mulligan ${mulliganRegistration.paymentType || 'Cash'} $${mulliganRegistration.paymentAmount}`;
      }
    }

    // Get the actual time name for the time slot
    const timeSlots = getAvailableTimeSlots();
    const timeSlotName = timeSlots.find(slot => slot.value === lastRegisteredPlayer.timeSlot)?.name || `Slot ${lastRegisteredPlayer.timeSlot}`;
    
    return {
      name: `${lastRegisteredPlayer.firstName} ${lastRegisteredPlayer.lastName}`,
      playerAccountNumber: lastRegisteredPlayer.playerAccountNumber,
      roundContext: `${currentRoundInfo.name} - ${timeSlotName}`,
      purchases: purchases,
      seatingInfo: null // No seating info
    };
  };

  return (
    <div style={{ minHeight: '500px' }}>
      {/* Round Title Header */}
      <h2 style={{ 
        margin: '0 0 24px 0', 
        fontSize: '1.6rem', 
        fontWeight: 'bold',
        color: '#000000',
        fontFamily: 'Figtree, sans-serif'
      }}>
        {currentRoundInfo.name}
      </h2>

      <SearchBar
        searchValue={hook.searchAccount}
        onSearchChange={handleSearchChange}
        onSearch={handleSearch}
        onCardSwipe={handleCardSwipe}
        placeholder="Enter 14-digit Player Account Number"
      />

      {/* LastPlayerCard under the search bar */}
      <LastPlayerCard 
        lastPlayer={createLastPlayerData()} 
        showSeatingInfo={true} 
      />

      {hook.showNewPlayerForm && currentRound === 'round1' && (
        <NewPlayerForm
          accountNumber={hook.searchAccount}
          currentTournament={currentTournament}
          onSave={hook.handleNewPlayerSave}
          onCancel={hook.clearForm}
          host={hook.host}
          setHost={hook.setHost}
          comments={hook.comments}
          setComments={hook.setComments}
          canRegisterForRound1={true}
        />
      )}

      {hook.currentPlayer && (
        <div>
          <PlayerInfoCard 
            currentPlayer={hook.currentPlayer} 
            activeTab="registration" 
            selectedRound={currentRound} 
          />

          {/* Time Slot Selection */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '1.1rem' }}>
              Time Slot for {currentRoundInfo.name}
            </h4>
            <div className="form-group">
              <label className="mb-2">Select Time Slot</label>
              <select
                value={hook.selectedTimeSlot}
                onChange={(e) => hook.setSelectedTimeSlot(e.target.value)}
                className="select-field"
                style={{ maxWidth: '300px' }}
              >
                <option value="">-- Select Time Slot --</option>
                {getAvailableTimeSlots().map(slot => (
                  <option key={slot.value} value={slot.value}>
                    {slot.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Card - Only show for payment rounds */}
          {showPaymentCard && (
            <PaymentCard
              activeTab="registration"
              selectedRound={currentRound}
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
            <label className="mb-2">Host</label>
            <input
              type="text"
              value={hook.host}
              onChange={(e) => hook.setHost(UC(e.target.value))}
              className="input-field"
              placeholder="Enter host name"
            />
          </div>

          <div className="form-group">
            <label className="mb-2">Comments</label>
            <textarea
              value={hook.comments}
              onChange={(e) => hook.setComments(UC(e.target.value))}
              className="textarea-field"
              rows="3"
            />
          </div>

          <button 
            onClick={hook.handleRegistration} 
            className="btn btn-success"
            disabled={!hook.selectedTimeSlot}
            style={{
              opacity: !hook.selectedTimeSlot ? 0.5 : 1,
              cursor: !hook.selectedTimeSlot ? 'not-allowed' : 'pointer'
            }}
          >
            {getButtonText()}
          </button>
        </div>
      )}
    </div>
  );
};

export default RoundRegistrationForm;