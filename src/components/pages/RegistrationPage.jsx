import React, { useState, useEffect } from 'react';
import { normalizeAccount, amountsMatch, UC } from '../../utils/formatting';
import SearchBar from '../common/SearchBar';
import NewPlayerForm from '../forms/NewPlayerForm';
import PaymentCard from '../cards/PaymentCard';
import MulliganCard from '../cards/MulliganCard';
import PlayerInfoCard from '../cards/PlayerInfoCard';
import LastPlayerCard from '../cards/LastPlayerCard';

const RegistrationPage = ({
  selectedEvent,
  employee,
  tournaments,
  masterData,
  setMasterData,
  registrations,
  setRegistrations, // This is now only used by the Seating Page
  setCurrentPage,
  setLastRegisteredPlayer,
  pendingRegistration,
  setPendingRegistration,
  loading,
  lastActiveTab,
  setLastActiveTab,
  lastSelectedRound,
  setLastSelectedRound,
  lastSelectedTimeSlot,
  setLastSelectedTimeSlot,
  globalDisabledTables,
  setGlobalDisabledTables
}) => {
  // ... (all your existing state hooks are fine)
  const [activeTab, setActiveTab] = useState(lastActiveTab);
  const [searchAccount, setSearchAccount] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);

  // Time slot selection - persistent across registrations
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(lastSelectedTimeSlot);
  const [selectedRound, setSelectedRound] = useState(lastSelectedRound);

  const [paymentType, setPaymentType] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [splitPayment, setSplitPayment] = useState(false);
  const [paymentType2, setPaymentType2] = useState('');
  const [paymentAmount2, setPaymentAmount2] = useState('');

  const [addMulligan, setAddMulligan] = useState(false);
  const [mulliganPaymentType, setMulliganPaymentType] = useState('');
  const [mulliganAmount, setMulliganAmount] = useState('100');
  const [splitMulliganPayment, setSplitMulliganPayment] = useState(false);
  const [mulliganPaymentType2, setMulliganPaymentType2] = useState('');
  const [mulliganAmount2, setMulliganAmount2] = useState('');

  const [comments, setComments] = useState('');
  const [host, setHost] = useState('');
  const [showLastPlayer, setShowLastPlayer] = useState(true);
  const [showSearchBar, setShowSearchBar] = useState(false);

  // ... (all other functions before handleNewPlayerSave are fine)
  const currentTournamentRegistrations = registrations.filter(r => r.eventName === selectedEvent);

  const getCurrentTournament = () => {
    const defaultTournament = { entryCost: 500, rebuyCost: 500, mulliganCost: 100 };
    const customTournament = tournaments.find(t => t.name === selectedEvent);
    return customTournament || defaultTournament;
  };

  const currentTournament = getCurrentTournament();

  const rounds = [
    { key: 'round1', name: 'Round 1', isRebuy: false, timeSlots: 6 },
    { key: 'rebuy1', name: 'Rebuy 1', isRebuy: true, timeSlots: 2 },
    { key: 'rebuy2', name: 'Rebuy 2', isRebuy: true, timeSlots: 1 },
    { key: 'round2', name: 'Round 2', isRebuy: false, timeSlots: 3 },
    { key: 'superrebuy', name: 'Super Rebuy', isRebuy: true, timeSlots: 2 },
    { key: 'quarterfinals', name: 'Quarterfinals', isRebuy: false, timeSlots: 2 },
    { key: 'semifinals', name: 'Semifinals', isRebuy: false, timeSlots: 1 }
  ];

  // Update search bar visibility when round/time slot change
  useEffect(() => {
    if (activeTab === 'registration') {
      setShowSearchBar(!!selectedTimeSlot);
    } else {
      setShowSearchBar(!!(selectedRound && selectedTimeSlot));
    }
  }, [activeTab, selectedRound, selectedTimeSlot]);

  // Restore form state from pending registration if coming back from seating
  useEffect(() => {
    if (pendingRegistration) {
      setCurrentPlayer(pendingRegistration.player);
      setShowNewPlayerForm(false);
      setSearchAccount(pendingRegistration.player.PlayerAccountNumber);
      setActiveTab(pendingRegistration.activeTab);
      setSelectedRound(pendingRegistration.selectedRound);
      setSelectedTimeSlot(pendingRegistration.selectedTimeSlot);
      setPaymentType(pendingRegistration.paymentType);
      setPaymentAmount(pendingRegistration.paymentAmount);
      setSplitPayment(pendingRegistration.splitPayment);
      setPaymentType2(pendingRegistration.paymentType2);
      setPaymentAmount2(pendingRegistration.paymentAmount2);
      setAddMulligan(pendingRegistration.addMulligan);
      setMulliganPaymentType(pendingRegistration.mulliganPaymentType);
      setMulliganAmount(pendingRegistration.mulliganAmount);
      setSplitMulliganPayment(pendingRegistration.splitMulliganPayment);
      setMulliganPaymentType2(pendingRegistration.mulliganPaymentType2);
      setMulliganAmount2(pendingRegistration.mulliganAmount2);
      setComments(pendingRegistration.comments);
      setHost(pendingRegistration.host);
      setShowLastPlayer(false);
    }
  }, [pendingRegistration]);

  // Save tab and round/time slot state
  useEffect(() => {
    setLastActiveTab(activeTab);
  }, [activeTab, setLastActiveTab]);

  useEffect(() => {
    setLastSelectedRound(selectedRound);
  }, [selectedRound, setLastSelectedRound]);

  useEffect(() => {
    setLastSelectedTimeSlot(selectedTimeSlot);
  }, [selectedTimeSlot, setLastSelectedTimeSlot]);

  // Get first available time slot (accounting for disabled tables)
  const getFirstAvailableTimeSlot = () => {
    const currentRoundInfo = activeTab === 'registration' 
      ? { timeSlots: 6 } 
      : rounds.find(r => r.key === selectedRound);
    
    if (!currentRoundInfo) return 1;
    
    for (let slot = 1; slot <= currentRoundInfo.timeSlots; slot++) {
      // Check if this time slot has any available tables
      let hasAvailableTables = false;
      for (let table = 1; table <= 6; table++) {
        // Check if table is not disabled and has available seats
        // This is a simplified check - in a real implementation, 
        // you'd check against global disabled tables
        let availableSeats = 0;
        for (let seat = 1; seat <= 6; seat++) {
          const existingPlayer = registrations.find(r =>
            r.eventName === selectedEvent &&
            r.round === (activeTab === 'registration' ? 'round1' : selectedRound) &&
            r.timeSlot === slot &&
            r.tableNumber === table &&
            r.seatNumber === seat
          );
          if (!existingPlayer) availableSeats++;
        }
        if (availableSeats > 0) {
          hasAvailableTables = true;
          break;
        }
      }
      if (hasAvailableTables) return slot;
    }
    return 1; // Default to slot 1 if none available
  };

  // Set default time slot when round changes (only for post-registration)
  useEffect(() => {
    if (activeTab === 'registration' && !selectedTimeSlot) {
      const firstAvailable = getFirstAvailableTimeSlot();
      setSelectedTimeSlot(firstAvailable);
    } else if (activeTab === 'post-registration' && selectedRound && !selectedTimeSlot) {
      // Only set default time slot when a round is actually selected in post-registration
      const firstAvailable = getFirstAvailableTimeSlot();
      setSelectedTimeSlot(firstAvailable);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedRound]);

  const getAvailableTimeSlots = () => {
    if (activeTab === 'registration') {
      return Array.from({ length: 6 }, (_, i) => i + 1); // Round 1 has 6 slots
    } else if (selectedRound) {
      const round = rounds.find(r => r.key === selectedRound);
      return Array.from({ length: round?.timeSlots || 1 }, (_, i) => i + 1);
    }
    return [1];
  };

  const getPlayerEntryType = (playerAccountNumber) => {
    const playerRegistrations = currentTournamentRegistrations
      .filter(r => normalizeAccount(r.playerAccountNumber) === normalizeAccount(playerAccountNumber))
      .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
    
    if (playerRegistrations.length > 0) {
      const mostRecent = playerRegistrations[0];
      return mostRecent.eventType === 'COMP' || mostRecent.eventType.includes('COMP') ? 'COMP' : 'PAY';
    }
    
    const player = masterData.find(p => 
      normalizeAccount(p.PlayerAccountNumber) === normalizeAccount(playerAccountNumber)
    );
    
    if (player && player.EntryType === 'COMP') {
      return 'COMP';
    }
    
    return 'PAY'; 
  };

  const shouldShowPaymentCard = () => {
    return activeTab === 'registration' || 
           (activeTab === 'post-registration' && 
            selectedRound !== 'round1' && 
            rounds.find(r => r.key === selectedRound)?.isRebuy);
  };

  const isRegisteredRound1 = acct => {
    const normalizedAcct = normalizeAccount(acct);
    return currentTournamentRegistrations.some(
      r => normalizeAccount(r.playerAccountNumber) === normalizedAcct && r.round === 'round1'
    );
  };

  const isRegisteredRebuy1 = acct => {
    const normalizedAcct = normalizeAccount(acct);
    return currentTournamentRegistrations.some(
      r => normalizeAccount(r.playerAccountNumber) === normalizedAcct && r.round === 'rebuy1'
    );
  };

  const getPaymentTypes = () => {
    // All rounds can use all payment types including Comp
    return ['Cash', 'Credit', 'Chips', 'Comp'];
  };

  const canAddNewPlayers = () => {
    return activeTab === 'registration';
  };

  const fmtTypes = (t1, t2) => (t2 ? `${t1}+${t2}` : t1);

  const getLastRegisteredPlayer = () => {
    let contextRegistrations = [];
    let roundContext = '';
    
    if (activeTab === 'registration') {
      contextRegistrations = currentTournamentRegistrations.filter(r => r.round === 'round1');
      roundContext = 'Round 1';
    } else if (selectedRound) {
      contextRegistrations = currentTournamentRegistrations.filter(r => r.round === selectedRound);
      const roundInfo = rounds.find(r => r.key === selectedRound);
      roundContext = roundInfo ? roundInfo.name : selectedRound;
    }
    
    if (contextRegistrations.length === 0) return null;
    
    const lastReg = [...contextRegistrations].sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))[0];
    if(!lastReg) return null;

    const playerTransactions = contextRegistrations.filter(r => 
      r.playerAccountNumber === lastReg.playerAccountNumber
    );
    
    const purchases = [];
    playerTransactions.forEach(t => {
      let purchaseDesc = '';
      if (t.isRebuy) {
        purchaseDesc = `Rebuy (${fmtTypes(t.paymentType, t.paymentType2)})`;
      } else if (t.isMulligan) {
        purchaseDesc = `Mulligan (${fmtTypes(t.paymentType, t.paymentType2)})`;
      } else if (!t.isRebuy && !t.isMulligan) {
        purchaseDesc = `Registration (${fmtTypes(t.paymentType, t.paymentType2)})`;
      }

      if (purchaseDesc) purchases.push(purchaseDesc);
    });

    let seatingInfo = null;
    if (lastReg.tableNumber && lastReg.seatNumber) {
      seatingInfo = `Seated: Table ${lastReg.tableNumber}, Seat ${lastReg.seatNumber}`;
    }
    
    return {
      accountNumber: lastReg.playerAccountNumber,
      name: `${lastReg.firstName} ${lastReg.lastName}`,
      purchases: purchases.length > 0 ? purchases.join(', ') : 'Registration',
      roundContext: roundContext,
      seatingInfo: seatingInfo
    };
  };

  const clearForm = () => {
    setPaymentType('');
    setPaymentAmount('');
    setSplitPayment(false);
    setPaymentType2('');
    setPaymentAmount2('');
    setAddMulligan(false);
    setMulliganPaymentType('');
    setMulliganAmount(currentTournament.mulliganCost.toString());
    setSplitMulliganPayment(false);
    setMulliganPaymentType2('');
    setMulliganAmount2('');
    setComments('');
    setHost('');
  };

  const checkForZeroAmounts = (amount1, amount2, paymentDescription) => {
    const amt1 = parseInt(amount1) || 0;
    const amt2 = parseInt(amount2) || 0;
    
    if (amt1 === 0 || amt2 === 0) {
      alert(`Both payment amounts must be greater than 0 for split ${paymentDescription} payments.`);
      return false;
    }
    return true;
  };

  const searchPlayer = () => {
    const accountNum = searchAccount.trim();
    if (!accountNum) return;

    setPendingRegistration(null);
    setShowLastPlayer(false);
    clearForm();

    if (!/^\d+$/.test(accountNum)) {
      alert('Player account number must contain only numbers.');
      return;
    }

    if (accountNum.length === 1) {
      alert('Player account number cannot be just 1 digit. Please enter the full 14-digit account number.');
      return;
    }

    if (accountNum.length !== 14) {
      alert(`Player account number must be exactly 14 digits. You entered ${accountNum.length} digits.`);
      return;
    }

    const normalizedInput = normalizeAccount(accountNum);

    if (activeTab === 'post-registration' && selectedRound === '') {
      alert('Please select a round first.');
      return;
    }

    const player = masterData.find((p) => {
      const potentialFields = [ p.PlayerAccountNumber, p['Player Account Number'], p.playerAccountNumber, p.AccountNumber ];
      return potentialFields.some((field) => normalizeAccount(field) === normalizedInput );
    });

    if (player) {
      if (activeTab === 'post-registration' && selectedRound !== 'round1' && !isRegisteredRound1(player.PlayerAccountNumber)) {
        alert('That player is not registered in ROUND 1 yet. Register them first before adding rebuys or mulligans.');
        return;
      }
      if (activeTab === 'post-registration' && selectedRound === 'rebuy2' && !isRegisteredRebuy1(player.PlayerAccountNumber)) {
        alert('That player is not registered in REBUY 1 yet. Register them for Rebuy 1 first before adding Rebuy 2.');
        return;
      }
      setCurrentPlayer(player);
      setShowNewPlayerForm(false);
      setHost(player.Host || '');
      const playerEntryType = getPlayerEntryType(player.PlayerAccountNumber);
      if (playerEntryType === 'COMP' && (activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1'))) {
        setPaymentType('Comp');
        setPaymentAmount('0');
      } else {
        setPaymentType('');
        if (activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1')) {
          setPaymentAmount(currentTournament.entryCost.toString());
        } else if (selectedRound && rounds.find(r => r.key === selectedRound)?.isRebuy) {
          setPaymentAmount(currentTournament.rebuyCost.toString());
        }
      }
      setMulliganAmount(currentTournament.mulliganCost.toString());
    } else {
      if (canAddNewPlayers()) {
        setCurrentPlayer(null);
        setShowNewPlayerForm(true);
        setHost('');
      } else {
        alert(`Player not found. \nNew players can only be added in the Registration tab.`);
        setCurrentPlayer(null);
        setShowNewPlayerForm(false);
      }
    }
  };

  const handleNewPlayerSave = (newPlayer, registerForRound1, registrationData) => {
    // ... (validation logic is the same)
    if (masterData.some(p => normalizeAccount(p.PlayerAccountNumber) === normalizeAccount(newPlayer.PlayerAccountNumber))) {
        alert('That account is already in your master list.');
        return;
    }

    setMasterData([...masterData, newPlayer]);
    
    if (registerForRound1) {
        // ... (all validation logic for payments is the same)
        let required = currentTournament.entryCost;
        if (registrationData.paymentType === 'Comp') required = 0;
        if (registrationData.splitPayment) {
            if (!checkForZeroAmounts(registrationData.paymentAmount, registrationData.paymentAmount2, 'registration')) return;
        }
        const totalPayment = registrationData.splitPayment ? (parseInt(registrationData.paymentAmount) || 0) + (parseInt(registrationData.paymentAmount2) || 0) : (parseInt(registrationData.paymentAmount) || 0);
        if (!amountsMatch(required, totalPayment)) {
            alert(`Round-1 payment must add up to $${required}.`);
            return;
        }
        if (registrationData.addMulligan) {
            const need = currentTournament.mulliganCost;
            if (registrationData.splitMulliganPayment) {
                if (!checkForZeroAmounts(registrationData.mulliganAmount, registrationData.mulliganAmount2, 'mulligan')) return;
            }
            const totalMulliganPayment = registrationData.splitMulliganPayment ? (parseInt(registrationData.mulliganAmount) || 0) + (parseInt(registrationData.mulliganAmount2) || 0) : (parseInt(registrationData.mulliganAmount) || 0);
            if (!amountsMatch(need, totalMulliganPayment)) {
                alert(`Mulligan payment must be exactly $${need}.`);
                return;
            }
        }
        
      const newRegs = [];
      
      let eventType;
      if (registrationData.paymentType === 'Comp') {
        eventType = 'COMP $0';
      } else {
        const totalAmount = registrationData.splitPayment ? (parseInt(registrationData.paymentAmount) || 0) + (parseInt(registrationData.paymentAmount2) || 0) : (parseInt(registrationData.paymentAmount) || 0);
        eventType = `PAY $${totalAmount}`;
      }
      
      const registration = {
        id: Date.now(),
        playerAccountNumber: newPlayer.PlayerAccountNumber,
        firstName: newPlayer.FirstName,
        lastName: newPlayer.LastName,
        eventName: selectedEvent,
        eventType: eventType,
        paymentType: registrationData.paymentType,
        paymentAmount: parseInt(registrationData.paymentAmount) || 0,
        paymentType2: registrationData.splitPayment ? registrationData.paymentType2 : null,
        paymentAmount2: registrationData.splitPayment ? (parseInt(registrationData.paymentAmount2) || 0) : null,
        registrationDate: new Date().toISOString(),
        host: registrationData.host,
        comment: registrationData.comments,
        round: 'round1',
        employee: employee,
        isRebuy: false,
        isMulligan: false,
        timeSlot: null, tableNumber: null, seatNumber: null
      };
      newRegs.push(registration);

      if (registrationData.addMulligan) {
        const mulliganReg = {
          id: Date.now() + 1,
          playerAccountNumber: newPlayer.PlayerAccountNumber,
          firstName: newPlayer.FirstName,
          lastName: newPlayer.LastName,
          eventName: selectedEvent,
          eventType: 'MULLIGAN',
          paymentType: registrationData.mulliganPaymentType,
          paymentAmount: parseInt(registrationData.mulliganAmount) || 0,
          paymentType2: registrationData.splitMulliganPayment ? registrationData.mulliganPaymentType2 : null,
          paymentAmount2: registrationData.splitMulliganPayment ? (parseInt(registrationData.mulliganAmount2) || 0) : null,
          registrationDate: new Date().toISOString(),
          host: registrationData.host,
          comment: registrationData.comments,
          round: 'round1',
          employee: employee,
          isRebuy: false,
          isMulligan: true,
          timeSlot: null, tableNumber: null, seatNumber: null
        };
        newRegs.push(mulliganReg);
      }
      
      // *** CHANGE: DO NOT UPDATE REGISTRATIONS HERE ***
      // setRegistrations([...filteredRegistrations, ...newRegs]); // This was the bug!

      // Create pending registration object to pass to the seating page
      const pendingData = {
        registrations: newRegs,
        player: newPlayer,
        activeTab,
        selectedRound: 'round1',
        selectedTimeSlot: selectedTimeSlot || 1,
        // ... (rest of pending data is the same)
        paymentType: registrationData.paymentType,
        paymentAmount: registrationData.paymentAmount,
        splitPayment: registrationData.splitPayment,
        paymentType2: registrationData.paymentType2,
        paymentAmount2: registrationData.paymentAmount2,
        addMulligan: registrationData.addMulligan,
        mulliganPaymentType: registrationData.mulliganPaymentType,
        mulliganAmount: registrationData.mulliganAmount,
        splitMulliganPayment: registrationData.splitMulliganPayment,
        mulliganPaymentType2: registrationData.mulliganPaymentType2,
        mulliganAmount2: registrationData.mulliganAmount2,
        host: registrationData.host,
        comments: registrationData.comments
      };

      setPendingRegistration(pendingData);

      setLastRegisteredPlayer({
        playerAccountNumber: newPlayer.PlayerAccountNumber,
        firstName: newPlayer.FirstName,
        lastName: newPlayer.LastName,
        round: 'round1',
        timeSlot: selectedTimeSlot || 1
      });
      
      setCurrentPage(2);
    }

    setSearchAccount('');
    setShowNewPlayerForm(false);
    setCurrentPlayer(null);
    if (!registerForRound1) {
      setShowLastPlayer(true);
    }
  };

  const handleNewPlayerCancel = () => {
    setShowNewPlayerForm(false);
    setSearchAccount('');
  };

  const handlePaymentTypeChange = (newPaymentType) => {
    setPaymentType(newPaymentType);
    if (newPaymentType === 'Comp') {
      setPaymentAmount('0');
    } else if (paymentType === 'Comp' || paymentAmount === '0') {
      if (activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1')) {
        setPaymentAmount(currentTournament.entryCost.toString());
      } else if (selectedRound && rounds.find(r => r.key === selectedRound)?.isRebuy) {
        setPaymentAmount(currentTournament.rebuyCost.toString());
      }
    }
  };

  const handleRegistration = () => {
    if (!currentPlayer) return;

    // ... (All validation logic before creating new registrations is correct)
    const roundKey = activeTab === 'registration' ? 'round1' : selectedRound;
    const alreadyBaseReg = currentTournamentRegistrations.some(r => r.playerAccountNumber === currentPlayer.PlayerAccountNumber && r.round === roundKey && !r.isRebuy && !r.isMulligan);
    if (alreadyBaseReg && activeTab === 'post-registration' && selectedRound === 'round1' && !addMulligan) { alert('That player already has a Round 1 registration. You can only add mulligans.'); return; }
    if (activeTab === 'post-registration' && !isRegisteredRound1(currentPlayer.PlayerAccountNumber)) { alert('Player must be registered in ROUND 1 before any Post-Registration actions.'); return; }
    if (activeTab === 'post-registration' && selectedRound === 'rebuy2' && !isRegisteredRebuy1(currentPlayer.PlayerAccountNumber)) { alert('That player is not registered in REBUY 1 yet. Register them for Rebuy 1 first before adding Rebuy 2.'); return; }
    const currentRoundInfo = activeTab === 'registration' ? { key: 'round1', isRebuy: false } : rounds.find(r => r.key === selectedRound);
    const isRebuyRound = currentRoundInfo?.isRebuy || false;
    if (activeTab === 'registration') { if (!paymentType) { alert('Please select a payment type for registration.'); return; } if (paymentType !== 'Comp' && !paymentAmount) { alert('Please enter the registration amount.'); return; } if (splitPayment && (!paymentType2 || (paymentType2 !== 'Comp' && !paymentAmount2))) { alert('Please complete both parts of the split payment.'); return; } if (splitPayment && !checkForZeroAmounts(paymentAmount, paymentAmount2, 'registration')) { return; } } else if (activeTab === 'post-registration' && selectedRound === 'round1' && !addMulligan) { alert('Please select "Include Mulligan" to add a mulligan for this player.'); return; }
    if (activeTab === 'post-registration' && selectedRound !== 'round1' && isRebuyRound) { if (!paymentType) { alert('Please select a payment type for the rebuy.'); return; } if (!paymentAmount) { alert('Please enter the rebuy amount.'); return; } if (splitPayment && (!paymentType2 || !paymentAmount2)) { alert('Please complete both parts of the split rebuy payment.'); return; } if (splitPayment && !checkForZeroAmounts(paymentAmount, paymentAmount2, 'rebuy')) { return; } }
    if (addMulligan) { if (!mulliganPaymentType) { alert('Please select a payment type for the mulligan.'); return; } if (!mulliganAmount) { alert('Please enter an amount for the mulligan.'); return; } if (splitMulliganPayment && (!mulliganPaymentType2 || !mulliganAmount2)) { alert('Please complete both parts of the split mulligan payment.'); return; } if (splitMulliganPayment && !checkForZeroAmounts(mulliganAmount, mulliganAmount2, 'mulligan')) { return; } }
    const needsMainPayment = ((activeTab === 'registration') || (activeTab === 'post-registration' && selectedRound !== 'round1' && rounds.find(r => r.key === selectedRound)?.isRebuy));
    if (needsMainPayment) { let required = 0; if (activeTab === 'registration' || (activeTab === 'post-registration' && selectedRound === 'round1')) { required = currentTournament.entryCost; } else if (rounds.find(r => r.key === selectedRound)?.isRebuy) { required = currentTournament.rebuyCost; } if (paymentType === 'Comp') required = 0; if (!amountsMatch(required, paymentAmount, splitPayment ? paymentAmount2 : 0)) { alert(`Payments must add up to ${required}.`); return; } } else if (activeTab === 'post-registration' && !addMulligan) { alert('Please select either a mulligan or go to a rebuy round to make a registration.'); return; }
    if (addMulligan) { const need = currentTournament.mulliganCost; if (!amountsMatch(need, mulliganAmount, splitMulliganPayment ? mulliganAmount2 : 0)) { alert(`Mulligan payments must add up to ${need}.`); return; } }

    const newRegs = [];

    // This logic for creating new registration objects is correct.
    if (activeTab === 'registration') {
      let eventType;
      if (paymentType === 'Comp') { eventType = 'COMP $0'; } 
      else { const totalAmount = splitPayment ? (parseInt(paymentAmount) || 0) + (parseInt(paymentAmount2) || 0) : (parseInt(paymentAmount) || 0); eventType = `PAY ${totalAmount}`; }
      const baseReg = { id: Date.now(), playerAccountNumber: currentPlayer.PlayerAccountNumber, firstName: currentPlayer.FirstName, lastName: currentPlayer.LastName, eventName: selectedEvent, eventType: eventType, paymentType, paymentAmount: parseInt(paymentAmount) || 0, paymentType2: splitPayment ? paymentType2 : null, paymentAmount2: splitPayment ? parseInt(paymentAmount2) || 0 : null, registrationDate: new Date().toISOString(), host: host, comment: comments, round: 'round1', employee, isRebuy: false, isMulligan: false, timeSlot: null, tableNumber: null, seatNumber: null };
      newRegs.push(baseReg);
    }
    if (activeTab === 'post-registration' && selectedRound !== 'round1' && isRebuyRound) {
      const totalAmount = splitPayment ? (parseInt(paymentAmount) || 0) + (parseInt(paymentAmount2) || 0) : (parseInt(paymentAmount) || 0);
      const rebuyReg = { id: Date.now(), playerAccountNumber: currentPlayer.PlayerAccountNumber, firstName: currentPlayer.FirstName, lastName: currentPlayer.LastName, eventName: selectedEvent, eventType: `REBUY ${totalAmount}`, paymentType: paymentType, paymentAmount: parseInt(paymentAmount) || 0, paymentType2: splitPayment ? paymentType2 : null, paymentAmount2: splitPayment ? parseInt(paymentAmount2) || 0 : null, registrationDate: new Date().toISOString(), host: host, comment: comments, round: selectedRound, employee: employee, isRebuy: true, isMulligan: false, timeSlot: null, tableNumber: null, seatNumber: null };
      newRegs.push(rebuyReg);
    }
    if (addMulligan) {
      const mulliganReg = { id: Date.now() + 1, playerAccountNumber: currentPlayer.PlayerAccountNumber, firstName: currentPlayer.FirstName, lastName: currentPlayer.LastName, eventName: selectedEvent, eventType: 'MULLIGAN', paymentType: mulliganPaymentType, paymentAmount: parseInt(mulliganAmount) || 0, paymentType2: splitMulliganPayment ? mulliganPaymentType2 : null, paymentAmount2: splitMulliganPayment ? parseInt(mulliganAmount2) || 0 : null, registrationDate: new Date().toISOString(), host: host, comment: comments, round: roundKey, employee: employee, isRebuy: activeTab === 'post-registration' && selectedRound !== 'round1' && isRebuyRound, isMulligan: true, timeSlot: null, tableNumber: null, seatNumber: null };
      newRegs.push(mulliganReg);
    }

    // *** CHANGE: DO NOT UPDATE REGISTRATIONS HERE ***
    // setRegistrations([...filteredRegistrations, ...newRegs]); // This was the bug!

    const playerRound = activeTab === 'registration' ? 'round1' : selectedRound;

    // Create pending registration for existing player
    const pendingData = {
      registrations: newRegs,
      player: currentPlayer,
      activeTab,
      selectedRound: playerRound,
      selectedTimeSlot: selectedTimeSlot || 1,
      paymentType, paymentAmount, splitPayment, paymentType2, paymentAmount2,
      addMulligan, mulliganPaymentType, mulliganAmount, splitMulliganPayment, mulliganPaymentType2, mulliganAmount2,
      host, comments
    };
    setPendingRegistration(pendingData);

    setLastRegisteredPlayer({
      playerAccountNumber: currentPlayer.PlayerAccountNumber,
      firstName: currentPlayer.FirstName,
      lastName: currentPlayer.LastName,
      round: playerRound,
      timeSlot: selectedTimeSlot || 1
    });

    setCurrentPage(2);
    setSearchAccount('');
    setCurrentPlayer(null);
    clearForm();
  };

  const lastPlayer = getLastRegisteredPlayer();

  // ... (the entire JSX return statement is fine, no changes needed there)
  return (
    <div className="container">
      <button onClick={() => setCurrentPage(0)} className="link-back link-back-block">
        {'<'} Back to Event Selection
      </button>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <div>
            <h1 className="page-title">{selectedEvent}</h1>
            <p className="page-subtitle">
              {(() => {
                const registrationCount = currentTournamentRegistrations.filter(r => r.round === 'round1' && !r.isMulligan).length;
                return `${registrationCount} total registration${registrationCount === 1 ? '' : 's'}`;
              })()}, Employee: {employee}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setCurrentPage(2.5)} className="btn btn-white-red">Player Seating</button>
            <button onClick={() => setCurrentPage(3, true)} className="btn btn-primary">Export Data</button>
          </div>
        </div>
      </div>
      <div className="tabs">
        <div className={`tab ${activeTab === 'registration' ? 'active' : ''}`} onClick={() => { setActiveTab('registration'); setSearchAccount(''); setCurrentPlayer(null); setShowNewPlayerForm(false); setShowLastPlayer(true); setSelectedRound(''); }}>
          Registration
        </div>
        <div className={`tab ${activeTab === 'post-registration' ? 'active' : ''}`} onClick={() => { setActiveTab('post-registration'); setSearchAccount(''); setCurrentPlayer(null); setShowNewPlayerForm(false); setShowLastPlayer(true); setSelectedTimeSlot(''); }}>
          Post-Registration
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="mb-2">Round</label>
          {activeTab === 'registration' ? (
            <select value="round1" disabled className="select-field" style={{ backgroundColor: '#f5f5f5', color: '#666' }}><option value="round1">Round 1</option></select>
          ) : (
            <select value={selectedRound} onChange={(e) => { setSelectedRound(e.target.value); setSelectedTimeSlot(''); }} className="select-field">
              <option value="">-- Select Round --</option>
              {rounds.map((round) => (<option key={round.key} value={round.key}>{round.name}</option>))}
            </select>
          )}
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="mb-2">Time Slot</label>
          <select value={selectedTimeSlot} onChange={(e) => setSelectedTimeSlot(e.target.value)} className="select-field">
            <option value="">-- Select Slot --</option>
            {getAvailableTimeSlots().map(slot => (<option key={slot} value={slot}>Slot {slot}</option>))}
          </select>
        </div>
      </div>
      {showSearchBar && (<SearchBar searchValue={searchAccount} onSearchChange={setSearchAccount} onSearch={searchPlayer} placeholder="Enter 14-digit Player Account Number"/>)}
      {!showSearchBar && (
        <div style={{ padding: '16px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '16px', textAlign: 'center', color: '#666' }}>
          {activeTab === 'registration' ? 'Please select a time slot to begin player registration.' : 'Please select both a round and time slot to begin post-registration.'}
        </div>
      )}
      {showLastPlayer && showSearchBar && <LastPlayerCard lastPlayer={lastPlayer} showSeatingInfo={true} />}
      {showNewPlayerForm && (<NewPlayerForm accountNumber={searchAccount} currentTournament={currentTournament} onSave={handleNewPlayerSave} onCancel={handleNewPlayerCancel} selectedEvent={selectedEvent} employee={employee} host={host} setHost={setHost} comments={comments} setComments={setComments} canRegisterForRound1={canAddNewPlayers()}/>)}
      {currentPlayer && (
        <div>
          <PlayerInfoCard currentPlayer={currentPlayer} activeTab={activeTab} selectedRound={selectedRound}/>
          {shouldShowPaymentCard() && (
            <PaymentCard activeTab={activeTab} selectedRound={selectedRound} paymentType={paymentType} setPaymentType={setPaymentType} paymentAmount={paymentAmount} setPaymentAmount={setPaymentAmount} splitPayment={splitPayment} setSplitPayment={setSplitPayment} paymentType2={paymentType2} setPaymentType2={setPaymentType2} paymentAmount2={paymentAmount2} setPaymentAmount2={setPaymentAmount2} currentPlayer={currentPlayer} currentTournament={currentTournament} getPaymentTypes={getPaymentTypes} handlePaymentTypeChange={handlePaymentTypeChange}/>
          )}
          <MulliganCard addMulligan={addMulligan} setAddMulligan={setAddMulligan} mulliganPaymentType={mulliganPaymentType} setMulliganPaymentType={setMulliganPaymentType} mulliganAmount={mulliganAmount} setMulliganAmount={setMulliganAmount} splitMulliganPayment={splitMulliganPayment} setSplitMulliganPayment={setSplitMulliganPayment} mulliganPaymentType2={mulliganPaymentType2} setMulliganPaymentType2={setMulliganPaymentType2} mulliganAmount2={mulliganAmount2} setMulliganAmount2={setMulliganAmount2} currentTournament={currentTournament}/>
          {activeTab === 'registration' && (<div className="form-group"><label className="mb-2">Host</label><input type="text" value={host} onChange={(e) => setHost(UC(e.target.value))} className="input-field" placeholder="Enter host name"/></div>)}
          <div className="form-group"><label className="mb-2">Comments</label><textarea value={comments} onChange={(e) => setComments(UC(e.target.value))} className="textarea-field" rows="3"/></div>
          <button onClick={handleRegistration} className="btn btn-success">{(() => { if (activeTab === 'registration') { return addMulligan ? 'Register Player and Add Mulligan' : 'Register Player'; } const currentRoundInfo = rounds.find(r => r.key === selectedRound); const isRebuyRound = currentRoundInfo?.isRebuy || false; if (isRebuyRound) { return addMulligan ? 'Add Rebuy and Mulligan' : 'Add Rebuy'; } else { return 'Add Mulligan'; } })()}</button>
        </div>
      )}
    </div>
  );
};
export default RegistrationPage;