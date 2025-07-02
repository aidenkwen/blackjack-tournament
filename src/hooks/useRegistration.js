import { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import { normalizeAccount, amountsMatch, normalizePlayerData } from '../utils/formatting';

export const useRegistration = ({
  initialTournament,
  allRegistrations,
  selectedEvent,
  masterData,
  employee,
  activeTab,
  selectedRound,
  selectedTimeSlot,
  pendingRegistration,
  setPendingRegistration,
  setCurrentPage,
  setLastRegisteredPlayer
}) => {
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [paymentType, setPaymentType] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [splitPayment, setSplitPayment] = useState(false);
  const [paymentType2, setPaymentType2] = useState('');
  const [paymentAmount2, setPaymentAmount2] = useState('');
  const [addMulligan, setAddMulligan] = useState(false);
  const [mulliganPaymentType, setMulliganPaymentType] = useState('');
  const [mulliganAmount, setMulliganAmount] = useState(initialTournament.mulliganCost.toString());
  const [splitMulliganPayment, setSplitMulliganPayment] = useState(false);
  const [mulliganPaymentType2, setMulliganPaymentType2] = useState('');
  const [mulliganAmount2, setMulliganAmount2] = useState('');
  const [comments, setComments] = useState('');
  const [host, setHost] = useState('');

  useEffect(() => {
    if (pendingRegistration) {
      const { player, ...regData } = pendingRegistration;
      const normalizedPlayer = normalizePlayerData(player);
      
      setCurrentPlayer(normalizedPlayer);
      setShowNewPlayerForm(false);
      
      setPaymentType(regData.paymentType || '');
      setPaymentAmount(regData.paymentAmount || '');
      setSplitPayment(regData.splitPayment || false);
      setPaymentType2(regData.paymentType2 || '');
      setPaymentAmount2(regData.paymentAmount2 || '');
      
      setAddMulligan(regData.addMulligan || false);
      setMulliganPaymentType(regData.mulliganPaymentType || '');
      setMulliganAmount(regData.mulliganAmount || initialTournament.mulliganCost.toString());
      setSplitMulliganPayment(regData.splitMulliganPayment || false);
      setMulliganPaymentType2(regData.mulliganPaymentType2 || '');
      setMulliganAmount2(regData.mulliganAmount2 || '');
      
      setComments(regData.comments || '');
      setHost(regData.host || '');
    }
  }, [pendingRegistration, initialTournament.mulliganCost]);

  const rounds = useMemo(() => [
    { key: 'round1', name: 'Round 1', isRebuy: false, timeSlots: 6 },
    { key: 'rebuy1', name: 'Rebuy 1', isRebuy: true, timeSlots: 2 },
    { key: 'rebuy2', name: 'Rebuy 2', isRebuy: true, timeSlots: 1 },
    { key: 'round2', name: 'Round 2', isRebuy: false, timeSlots: 3 },
    { key: 'superrebuy', name: 'Super Rebuy', isRebuy: true, timeSlots: 2 },
    { key: 'quarterfinals', name: 'Quarterfinals', isRebuy: false, timeSlots: 2 },
    { key: 'semifinals', name: 'Semifinals', isRebuy: false, timeSlots: 1 }
  ], []);

  const currentTournamentRegistrations = useMemo(() => 
    allRegistrations.filter(r => r.eventName === selectedEvent),
    [allRegistrations, selectedEvent]
  );
  
  const handlePaymentTypeChange = (newType) => {
    const oldType = paymentType;
    setPaymentType(newType);
    if (newType === 'Comp') {
      setPaymentAmount('0');
      setSplitPayment(false);
    } else if (oldType === 'Comp') {
      const isRebuy = activeTab === 'post-registration' && rounds.find(r => r.key === selectedRound)?.isRebuy;
      const defaultAmount = isRebuy ? initialTournament.rebuyCost : initialTournament.entryCost;
      setPaymentAmount(defaultAmount.toString());
    }
  };

  const getPlayerEntryType = (playerAccountNumber) => {
    if (activeTab === 'registration') {
      const player = masterData.find(p => {
        const normalizedPlayer = normalizePlayerData(p);
        return normalizeAccount(normalizedPlayer.playerAccountNumber) === normalizeAccount(playerAccountNumber);
      });
      if (player) {
        const normalizedPlayer = normalizePlayerData(player);
        if (normalizedPlayer.entryType === 'COMP') {
          return 'COMP';
        }
      }
    }
    const playerRegistrations = currentTournamentRegistrations
      .filter(r => normalizeAccount(r.playerAccountNumber) === normalizeAccount(playerAccountNumber))
      .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
    if (playerRegistrations.length > 0) {
      const mostRecent = playerRegistrations[0];
      return mostRecent.eventType === 'COMP' || mostRecent.eventType.includes('COMP') ? 'COMP' : 'PAY';
    }
    return 'PAY';
  };
  
  const playerHasMulligan = (playerAccountNumber, roundKey) => {
    return currentTournamentRegistrations.some(r => 
      normalizeAccount(r.playerAccountNumber) === normalizeAccount(playerAccountNumber) && 
      r.round === roundKey && 
      r.isMulligan === true
    );
  };

  const isRegisteredForRound = (acct, roundKey) => {
    const normalizedAcct = normalizeAccount(acct);
    return currentTournamentRegistrations.some(r => 
      normalizeAccount(r.playerAccountNumber) === normalizedAcct && 
      r.round === roundKey && 
      !r.isMulligan
    );
  };

  const isRegisteredRound1 = acct => isRegisteredForRound(acct, 'round1');
  const isRegisteredRebuy1 = acct => isRegisteredForRound(acct, 'rebuy1');

  const clearForm = () => {
    setPaymentType('');
    setPaymentAmount('');
    setSplitPayment(false);
    setPaymentType2('');
    setPaymentAmount2('');
    setAddMulligan(false);
    setMulliganPaymentType('');
    setMulliganAmount(initialTournament.mulliganCost.toString());
    setSplitMulliganPayment(false);
    setMulliganPaymentType2('');
    setMulliganAmount2('');
    setComments('');
    setHost('');
    setCurrentPlayer(null);
    setShowNewPlayerForm(false);
  };

  const searchPlayer = (searchAccount) => {
    const accountNum = String(searchAccount || '').trim();
    if (!accountNum) return;
    
    setPendingRegistration(null);
    clearForm();
    
    if (!/^\d+$/.test(accountNum)) {
      toast.error('Account number must contain only numbers.');
      return;
    }
    if (accountNum.length !== 14) {
      toast.error(`Account number must be 14 digits. You entered ${accountNum.length}.`);
      return;
    }
    
    const normalizedInput = normalizeAccount(accountNum);
    
    if (activeTab === 'post-registration' && !selectedRound) {
      toast.error('Please select a round before searching.');
      return;
    }
    
    const player = masterData.find((p) => {
      const normalizedPlayer = normalizePlayerData(p);
      return normalizeAccount(normalizedPlayer.playerAccountNumber) === normalizedInput;
    });
    
    if (player) {
      const normalizedPlayer = normalizePlayerData(player);
      
      if (activeTab === 'post-registration' && !isRegisteredRound1(normalizedPlayer.playerAccountNumber)) {
        toast.error(`${normalizedPlayer.firstName} must be registered in Round 1 before post-registration actions.`);
        return;
      }
      if (activeTab === 'post-registration' && selectedRound === 'rebuy2' && !isRegisteredRebuy1(normalizedPlayer.playerAccountNumber)) {
        toast.error(`${normalizedPlayer.firstName} must be in Rebuy 1 to be eligible for Rebuy 2.`);
        return;
      }
      
      setCurrentPlayer(normalizedPlayer);
      setShowNewPlayerForm(false);
      setHost(normalizedPlayer.host || '');
      
      if (activeTab === 'registration') {
        const playerEntryType = getPlayerEntryType(normalizedPlayer.playerAccountNumber);
        if (playerEntryType === 'COMP') {
          handlePaymentTypeChange('Comp');
        } else {
          setPaymentType('');
          setPaymentAmount(initialTournament.entryCost.toString());
        }
      } else if (selectedRound && rounds.find(r => r.key === selectedRound)?.isRebuy) {
        setPaymentType('');
        setPaymentAmount(initialTournament.rebuyCost.toString());
      }
      
      const roundToCheck = activeTab === 'registration' ? 'round1' : selectedRound;
      if (roundToCheck && playerHasMulligan(normalizedPlayer.playerAccountNumber, roundToCheck)) {
        setAddMulligan(true);
        // FIX: Removed the custom icon to allow the default to show
        toast(`${normalizedPlayer.firstName} already has a mulligan for this round.`);
      } else {
        setAddMulligan(false);
      }
    } else {
      if (activeTab === 'registration') {
        setCurrentPlayer(null);
        setShowNewPlayerForm(true);
        setHost('');
      } else {
        toast.error(`Player not found. New players can only be added in the 'Registration' tab.`);
        setCurrentPlayer(null);
        setShowNewPlayerForm(false);
      }
    }
  };

  const handleRegistration = () => {
    if (!currentPlayer) return;
    
    const normalizedPlayer = normalizePlayerData(currentPlayer);
    const roundKey = activeTab === 'registration' ? 'round1' : selectedRound;
    const currentRoundInfo = rounds.find(r => r.key === roundKey);
    const isRebuyRound = currentRoundInfo?.isRebuy || false;
    
    const alreadyRegistered = isRegisteredForRound(normalizedPlayer.playerAccountNumber, roundKey);

    if (activeTab === 'post-registration' && alreadyRegistered && !addMulligan) {
        toast.error(`${normalizedPlayer.firstName} is already in ${currentRoundInfo.name}. You can only add a mulligan.`);
        return;
    }
    if (activeTab === 'post-registration' && !isRebuyRound && !addMulligan) {
        toast.error(`Please select an action for ${currentRoundInfo.name} (e.g., 'Include Mulligan').`);
        return;
    }
    
    if (isRebuyRound && !alreadyRegistered) {
      if (!paymentType) {
        toast.error(`Please select a payment type for the ${currentRoundInfo.name}.`);
        return;
      }
      let required = initialTournament.rebuyCost;
      if (paymentType === 'Comp') required = 0;
      if (!amountsMatch(required, paymentAmount, splitPayment ? paymentAmount2 : 0)) {
        toast.error(`Payments for ${currentRoundInfo.name} must add up to $${required}.`);
        return;
      }
    }
    
    if (addMulligan) {
      if (!mulliganPaymentType) {
        toast.error('Please select a payment type for the mulligan.');
        return;
      }
      if (!amountsMatch(initialTournament.mulliganCost, mulliganAmount, splitMulliganPayment ? mulliganAmount2 : 0)) {
        toast.error(`Mulligan payments must add up to $${initialTournament.mulliganCost}.`);
        return;
      }
    }
    
    const newRegs = [];
    
    if (!alreadyRegistered) {
      let eventType = 'CHECK-IN';
      let requiresPaymentForEventType = activeTab === 'registration' || isRebuyRound;

      if (requiresPaymentForEventType) {
          if (paymentType === 'Comp') {
              eventType = isRebuyRound ? 'COMP REBUY' : 'COMP $0';
          } else {
              const totalAmount = (parseInt(paymentAmount) || 0) + (splitPayment ? (parseInt(paymentAmount2) || 0) : 0);
              eventType = isRebuyRound ? `REBUY ${totalAmount}` : `PAY ${totalAmount}`;
          }
      }

      const baseReg = {
        id: crypto.randomUUID(),
        playerAccountNumber: normalizedPlayer.playerAccountNumber,
        firstName: normalizedPlayer.firstName,
        lastName: normalizedPlayer.lastName,
        eventName: selectedEvent,
        eventType,
        paymentType: requiresPaymentForEventType ? paymentType : null,
        paymentAmount: requiresPaymentForEventType ? (parseInt(paymentAmount) || 0) : 0,
        paymentType2: (requiresPaymentForEventType && splitPayment) ? paymentType2 : null,
        paymentAmount2: (requiresPaymentForEventType && splitPayment) ? (parseInt(paymentAmount2) || 0) : null,
        registrationDate: new Date().toISOString(),
        host,
        comment: comments,
        round: roundKey,
        employee,
        isRebuy: isRebuyRound,
        isMulligan: false,
        timeSlot: null,
        tableNumber: null,
        seatNumber: null
      };
      newRegs.push(baseReg);
    }
    
    if (addMulligan) {
      const mulliganReg = {
        id: crypto.randomUUID(),
        playerAccountNumber: normalizedPlayer.playerAccountNumber,
        firstName: normalizedPlayer.firstName,
        lastName: normalizedPlayer.lastName,
        eventName: selectedEvent,
        eventType: 'MULLIGAN',
        paymentType: mulliganPaymentType,
        paymentAmount: parseInt(mulliganAmount) || 0,
        paymentType2: splitMulliganPayment ? mulliganPaymentType2 : null,
        paymentAmount2: splitMulliganPayment ? (parseInt(mulliganAmount2) || 0) : null,
        registrationDate: new Date().toISOString(),
        host,
        comment: comments,
        round: roundKey,
        employee,
        isRebuy: false,
        isMulligan: true,
        timeSlot: null,
        tableNumber: null,
        seatNumber: null
      };
      newRegs.push(mulliganReg);
    }
    
    const pendingData = {
      registrations: newRegs,
      player: normalizedPlayer,
      activeTab,
      selectedRound: roundKey,
      selectedTimeSlot: selectedTimeSlot || 1,
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

    setPendingRegistration(pendingData);
    setLastRegisteredPlayer({
      playerAccountNumber: normalizedPlayer.playerAccountNumber,
      firstName: normalizedPlayer.firstName,
      lastName: normalizedPlayer.lastName,
      round: roundKey,
      timeSlot: selectedTimeSlot || 1
    });
    
    let actionText = '';
    if (activeTab === 'registration' || isRebuyRound) {
        actionText = 'Registered for';
    } else {
        actionText = 'Checked In to';
    }

    const mulliganText = addMulligan ? ' with Mulligan' : '';

    // FIX: Removed the custom icon to allow the default success icon (check) to show.
    toast.success(
        `${normalizedPlayer.firstName} ${actionText} ${currentRoundInfo.name}${mulliganText}`
    );

    setCurrentPage(2);
  };
  
  return {
    currentPlayer, showNewPlayerForm, paymentType, paymentAmount, splitPayment, paymentType2,
    paymentAmount2, addMulligan, mulliganPaymentType, mulliganAmount, splitMulliganPayment,
    mulliganPaymentType2, mulliganAmount2, comments, host,
    setShowNewPlayerForm, setPaymentType, setPaymentAmount, setSplitPayment, setPaymentType2,
    setPaymentAmount2, setAddMulligan, setMulliganPaymentType, setMulliganAmount,
    setSplitMulliganPayment, setMulliganPaymentType2, setMulliganAmount2, setComments, setHost,
    searchPlayer, handleRegistration, clearForm, handlePaymentTypeChange,
    isRegisteredForRound, rounds,
  };
};