import { useState, useMemo, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { normalizeAccount, amountsMatch, normalizePlayerData } from '../utils/formatting';

// FIXED: Add utility functions for consistent data handling
const normalizePaymentAmount = (amount) => {
  if (typeof amount === 'string') {
    const parsed = parseInt(amount.replace(/[^0-9]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  return typeof amount === 'number' ? amount : 0;
};

const validateTimeSlot = (timeSlot) => {
  const slot = typeof timeSlot === 'string' ? parseInt(timeSlot) : timeSlot;
  return !isNaN(slot) && slot > 0;
};

export const useRegistration = ({
  initialTournament,
  allRegistrations,
  setRegistrations,
  selectedEvent,
  masterData,
  setMasterData,
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

  // FIXED: Use useCallback to prevent unnecessary re-renders
  const clearForm = useCallback(() => {
    setPaymentType(''); 
    setPaymentAmount(''); 
    setSplitPayment(false); 
    setPaymentType2(''); 
    setPaymentAmount2('');
    setAddMulligan(false); 
    setMulliganPaymentType(''); 
    setMulliganAmount(() => initialTournament.mulliganCost.toString()); 
    setSplitMulliganPayment(false); 
    setMulliganPaymentType2(''); 
    setMulliganAmount2('');
    setComments(''); 
    setHost(''); 
    setCurrentPlayer(null); 
    setShowNewPlayerForm(false);
  }, [initialTournament.mulliganCost]);

  useEffect(() => {
    if (pendingRegistration) {
      const { player, ...regData } = pendingRegistration;
      setCurrentPlayer(normalizePlayerData(player));
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
    } else {
      clearForm();
    }
  }, [pendingRegistration, initialTournament.mulliganCost, clearForm]);

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
  
  // FIXED: Simplified eventType determination
  const determineEventType = useCallback((paymentType, playerEntryType, currentRound) => {
    if (paymentType === 'Comp') {
      return 'COMP';
    } else if (paymentType === 'Cash' || paymentType === 'Credit' || paymentType === 'Chips') {
      return 'PAY';
    } else if (currentRound === 'round1' && playerEntryType === 'COMP' && !paymentType) {
      return 'COMP';
    } else {
      return 'PAY';
    }
  }, []);
  
  // FIXED: Use useCallback for payment type change
  const handlePaymentTypeChange = useCallback((newType) => {
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
  }, [paymentType, activeTab, selectedRound, rounds, initialTournament.rebuyCost, initialTournament.entryCost]);

  const getPlayerEntryType = useCallback((playerAccountNumber) => {
    if (activeTab === 'registration') {
      const player = masterData.find(p => normalizeAccount(normalizePlayerData(p).playerAccountNumber) === normalizeAccount(playerAccountNumber));
      if (player && normalizePlayerData(player).entryType === 'COMP') return 'COMP';
    }
    const playerRegistrations = currentTournamentRegistrations
      .filter(r => normalizeAccount(r.playerAccountNumber) === normalizeAccount(playerAccountNumber))
      .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
    if (playerRegistrations.length > 0) {
      const mostRecent = playerRegistrations[0];
      return mostRecent.eventType === 'COMP' || mostRecent.eventType.includes('COMP') ? 'COMP' : 'PAY';
    }
    return 'PAY';
  }, [activeTab, masterData, currentTournamentRegistrations]);
  
  const playerHasMulligan = useCallback((playerAccountNumber, roundKey) => 
    currentTournamentRegistrations.some(r => 
      normalizeAccount(r.playerAccountNumber) === normalizeAccount(playerAccountNumber) && 
      r.round === roundKey && 
      r.isMulligan === true
    ), [currentTournamentRegistrations]);

  const isRegisteredForRound = useCallback((acct, roundKey) => 
    currentTournamentRegistrations.some(r => 
      normalizeAccount(r.playerAccountNumber) === normalizeAccount(acct) && 
      r.round === roundKey && 
      !r.isMulligan
    ), [currentTournamentRegistrations]);

  const isRegisteredRound1 = useCallback(acct => isRegisteredForRound(acct, 'round1'), [isRegisteredForRound]);
  const isRegisteredRebuy1 = useCallback(acct => isRegisteredForRound(acct, 'rebuy1'), [isRegisteredForRound]);

  const searchPlayer = useCallback((searchAccount) => {
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
    const player = masterData.find((p) => normalizeAccount(normalizePlayerData(p).playerAccountNumber) === normalizedInput);
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
        toast(`${normalizedPlayer.firstName} already has a mulligan for this round.`, { icon: 'ℹ️' });
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
  }, [masterData, activeTab, selectedRound, isRegisteredRound1, isRegisteredRebuy1, getPlayerEntryType, handlePaymentTypeChange, initialTournament.entryCost, initialTournament.rebuyCost, rounds, playerHasMulligan, setPendingRegistration, clearForm]);

  const handleNewPlayerSave = useCallback((newPlayer, registerForRound1, registrationData) => {
    if (masterData.some(p => normalizeAccount(normalizePlayerData(p).playerAccountNumber) === normalizeAccount(newPlayer.playerAccountNumber))) {
      toast.error('A player with this account number already exists.');
      return;
    }
    
    // FIXED: Use functional update for masterData
    setMasterData(prevMasterData => {
      const updatedMasterData = [...prevMasterData, newPlayer];
      toast.success(`${newPlayer.firstName} added to the master player list.`);
      return updatedMasterData;
    });
    
    if (registerForRound1) {
      // Set up the player and form data, then handle registration directly here
      const normalizedPlayer = normalizePlayerData(newPlayer);
      setCurrentPlayer(normalizedPlayer);
      setPaymentType(registrationData.paymentType);
      setPaymentAmount(registrationData.paymentAmount);
      setSplitPayment(registrationData.splitPayment);
      setPaymentType2(registrationData.paymentType2);
      setPaymentAmount2(registrationData.paymentAmount2);
      setAddMulligan(registrationData.addMulligan);
      setMulliganPaymentType(registrationData.mulliganPaymentType);
      setMulliganAmount(registrationData.mulliganAmount);
      setSplitMulliganPayment(registrationData.splitMulliganPayment);
      setMulliganPaymentType2(registrationData.mulliganPaymentType2);
      setMulliganAmount2(registrationData.mulliganAmount2);
      setComments(registrationData.comments);
      setHost(registrationData.host);
      setShowNewPlayerForm(false);
      
      // Handle the registration directly
      setTimeout(() => handleRegistrationForPlayer(normalizedPlayer, registrationData), 0);
    } else {
      clearForm();
    }
  }, [masterData, setMasterData, clearForm]);

  // FIXED: Simplified function to handle registration for a specific player with specific data
  const handleRegistrationForPlayer = useCallback((player, regData) => {
    const roundKey = activeTab === 'registration' ? 'round1' : selectedRound;
    const currentRoundInfo = rounds.find(r => r.key === roundKey);
    const isRebuyRound = currentRoundInfo?.isRebuy || false;
    const currentTimeSlot = validateTimeSlot(selectedTimeSlot) ? normalizePaymentAmount(selectedTimeSlot) : 1;
    
    // Validation with normalized amounts
    if (isRebuyRound && !regData.paymentType) { 
      toast.error(`Please select payment type for the ${currentRoundInfo.name}.`); 
      return; 
    }
    if (isRebuyRound) {
      const required = regData.paymentType === 'Comp' ? 0 : initialTournament.rebuyCost;
      const amount1 = normalizePaymentAmount(regData.paymentAmount);
      const amount2 = regData.splitPayment ? normalizePaymentAmount(regData.paymentAmount2) : 0;
      if (!amountsMatch(required, amount1, amount2)) {
        toast.error(`Payments for ${currentRoundInfo.name} must add up to $${required}.`);
        return;
      }
    }
    if (regData.addMulligan) {
      if (!regData.mulliganPaymentType) { 
        toast.error('Please select a payment type for the mulligan.'); 
        return; 
      }
      const mulAmount1 = normalizePaymentAmount(regData.mulliganAmount);
      const mulAmount2 = regData.splitMulliganPayment ? normalizePaymentAmount(regData.mulliganAmount2) : 0;
      if (!amountsMatch(initialTournament.mulliganCost, mulAmount1, mulAmount2)) {
        toast.error(`Mulligan payments must add up to $${initialTournament.mulliganCost}.`);
        return;
      }
    }
    
    // FIXED: Use functional update to batch all registration changes
    setRegistrations(prevRegistrations => {
      let updatedRegistrations = [...prevRegistrations];
      
      // SIMPLIFIED: Create the registration with simple eventType logic
      const eventType = determineEventType(regData.paymentType, player.entryType, roundKey);
      const finalPaymentType = eventType === 'COMP' ? 'Comp' : regData.paymentType;
      const finalPaymentAmount = eventType === 'COMP' ? 0 : normalizePaymentAmount(regData.paymentAmount);
      
      const baseReg = {
        id: crypto.randomUUID(), 
        playerAccountNumber: player.playerAccountNumber, 
        firstName: player.firstName, 
        lastName: player.lastName,
        eventName: selectedEvent, 
        eventType, // Simple: PAY, COMP
        entryType: player.entryType, // Original EntryType from import
        paymentType: finalPaymentType, 
        paymentAmount: finalPaymentAmount,
        paymentType2: regData.splitPayment ? regData.paymentType2 : null, 
        paymentAmount2: regData.splitPayment ? normalizePaymentAmount(regData.paymentAmount2) : null,
        registrationDate: new Date().toISOString(), 
        host: regData.host, 
        comment: regData.comments, 
        round: roundKey, 
        employee, 
        isRebuy: isRebuyRound, 
        isMulligan: false,
        timeSlot: currentTimeSlot, 
        tableNumber: null, 
        seatNumber: null
      };
      updatedRegistrations.push(baseReg);
      
      // Handle mulligan if needed - ALWAYS EventType = "Mulligan"
      if (regData.addMulligan) {
        const mulliganRegData = {
          id: crypto.randomUUID(),
          playerAccountNumber: player.playerAccountNumber, 
          firstName: player.firstName, 
          lastName: player.lastName,
          eventName: selectedEvent, 
          eventType: 'Mulligan', // Always "Mulligan"
          entryType: player.entryType, // Original EntryType from import
          paymentType: regData.mulliganPaymentType, 
          paymentAmount: normalizePaymentAmount(regData.mulliganAmount),
          paymentType2: regData.splitMulliganPayment ? regData.mulliganPaymentType2 : null, 
          paymentAmount2: regData.splitMulliganPayment ? normalizePaymentAmount(regData.mulliganAmount2) : null,
          registrationDate: new Date().toISOString(), 
          host: regData.host, 
          comment: regData.comments, 
          round: roundKey, 
          employee, 
          isRebuy: false, 
          isMulligan: true,
          timeSlot: currentTimeSlot, 
          tableNumber: null, 
          seatNumber: null
        };
        updatedRegistrations.push(mulliganRegData);
      }
      
      return updatedRegistrations;
    });
    
    // Set pending registration and last registered player after state update
    setTimeout(() => {
      setRegistrations(currentRegs => {
        const finalPendingRegs = currentRegs.filter(r => 
          r.playerAccountNumber === player.playerAccountNumber && 
          r.round === roundKey
        );
        
        setPendingRegistration({
          registrations: finalPendingRegs, 
          player: player, 
          activeTab, 
          selectedRound: roundKey, 
          selectedTimeSlot: currentTimeSlot,
          paymentType: regData.paymentType, 
          paymentAmount: regData.paymentAmount, 
          splitPayment: regData.splitPayment, 
          paymentType2: regData.paymentType2, 
          paymentAmount2: regData.paymentAmount2, 
          addMulligan: regData.addMulligan, 
          mulliganPaymentType: regData.mulliganPaymentType, 
          mulliganAmount: regData.mulliganAmount,
          splitMulliganPayment: regData.splitMulliganPayment, 
          mulliganPaymentType2: regData.mulliganPaymentType2, 
          mulliganAmount2: regData.mulliganAmount2, 
          host: regData.host, 
          comments: regData.comments
        });
        
        setLastRegisteredPlayer({ 
          playerAccountNumber: player.playerAccountNumber, 
          firstName: player.firstName, 
          lastName: player.lastName, 
          round: roundKey, 
          timeSlot: currentTimeSlot
        });
        
        return currentRegs;
      });
    }, 0);
    
    // Success message for new player registration - always needs seating since it's initial registration
    let successMessage = '';
    if (isRebuyRound) {
      successMessage = `${player.firstName} registered for ${currentRoundInfo.name}!`;
    } else {
      successMessage = `${player.firstName} registered for ${currentRoundInfo.name}!`;
    }
    
    toast.success(successMessage);
    setCurrentPage(2); // New players always go to seating
  }, [activeTab, selectedRound, rounds, selectedTimeSlot, initialTournament.rebuyCost, initialTournament.mulliganCost, selectedEvent, employee, setRegistrations, setPendingRegistration, setLastRegisteredPlayer, setCurrentPage, determineEventType]);
  
  const handleRegistration = useCallback(() => {
    if (!currentPlayer) return;
    
    const normalizedPlayer = normalizePlayerData(currentPlayer);
    const roundKey = activeTab === 'registration' ? 'round1' : selectedRound;
    const currentRoundInfo = rounds.find(r => r.key === roundKey);
    const isRebuyRound = currentRoundInfo?.isRebuy || false;
    const currentTimeSlot = validateTimeSlot(selectedTimeSlot) ? normalizePaymentAmount(selectedTimeSlot) : 1;
    
    // Find existing registrations for this player and round
    const existingRegIndex = allRegistrations.findIndex(r => 
      r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
      r.round === roundKey && 
      !r.isMulligan
    );
    const existingMulliganIndex = allRegistrations.findIndex(r => 
      r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
      r.round === roundKey && 
      r.isMulligan
    );

    // Determine if this is a first-time registration or update
    const isFirstTimeRegistration = existingRegIndex === -1;
    const isUpdate = !isFirstTimeRegistration;
    
    // Check if this is just a time slot change (same round, different time slot)
    const existingReg = existingRegIndex > -1 ? allRegistrations[existingRegIndex] : null;
    const isTimeSlotChange = existingReg && existingReg.timeSlot !== currentTimeSlot;

    if (activeTab === 'post-registration' && existingRegIndex === -1 && !addMulligan && !isRebuyRound) {
      toast.error(`Player is not in ${currentRoundInfo.name}. Please add a mulligan or perform a rebuy to register them.`);
      return;
    }

    if (isRebuyRound && existingRegIndex === -1) {
      if (!paymentType) { 
        toast.error(`Please select payment type for the ${currentRoundInfo.name}.`); 
        return; 
      }
      const required = paymentType === 'Comp' ? 0 : initialTournament.rebuyCost;
      const amount1 = normalizePaymentAmount(paymentAmount);
      const amount2 = splitPayment ? normalizePaymentAmount(paymentAmount2) : 0;
      if (!amountsMatch(required, amount1, amount2)) {
        toast.error(`Payments for ${currentRoundInfo.name} must add up to $${required}.`);
        return;
      }
    }

    if (addMulligan) {
      if (!mulliganPaymentType) { 
        toast.error('Please select a payment type for the mulligan.'); 
        return; 
      }
      const mulAmount1 = normalizePaymentAmount(mulliganAmount);
      const mulAmount2 = splitMulliganPayment ? normalizePaymentAmount(mulliganAmount2) : 0;
      if (!amountsMatch(initialTournament.mulliganCost, mulAmount1, mulAmount2)) {
        toast.error(`Mulligan payments must add up to $${initialTournament.mulliganCost}.`);
        return;
      }
    }
    
    let actionTaken = false;
    let needsSeating = false;

    // FIXED: Use functional update to batch all registration changes
    setRegistrations(prevRegistrations => {
      let updatedRegistrations = [...prevRegistrations];

      // Handle existing registration update
      if (isUpdate) {
        if (isTimeSlotChange) {
          // Just update the time slot and clear seating - don't remove the registration
          updatedRegistrations = updatedRegistrations.map(r => {
            if (r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
                r.round === roundKey && 
                !r.isMulligan) {
              
              // FIXED: When updating time slot, preserve existing payment details unless explicitly changing them
              const isPaymentChange = paymentType && paymentType !== r.paymentType;
              
              let newEventType, finalPaymentType, finalPaymentAmount;
              
              if (isPaymentChange) {
                // User is explicitly changing payment type, use new values
                newEventType = determineEventType(paymentType, normalizedPlayer.entryType, roundKey);
                finalPaymentType = newEventType === 'COMP' ? 'Comp' : paymentType;
                finalPaymentAmount = newEventType === 'COMP' ? 0 : normalizePaymentAmount(paymentAmount);
              } else {
                // Preserve existing payment details when just changing time slot or adding mulligan
                newEventType = r.eventType;
                finalPaymentType = r.paymentType;
                finalPaymentAmount = r.paymentAmount;
              }
              
              return {
                ...r,
                eventType: newEventType, // Simple: PAY, COMP
                entryType: normalizedPlayer.entryType, // Preserve original EntryType
                timeSlot: currentTimeSlot,
                tableNumber: null, // Clear seating when changing time slot
                seatNumber: null,
                // Update payment info only if explicitly changing
                paymentType: finalPaymentType,
                paymentAmount: finalPaymentAmount,
                paymentType2: isPaymentChange && splitPayment ? paymentType2 : r.paymentType2,
                paymentAmount2: isPaymentChange && splitPayment ? normalizePaymentAmount(paymentAmount2) : r.paymentAmount2,
                host: host || r.host,
                comment: comments || r.comment,
                registrationDate: new Date().toISOString() // Update timestamp
              };
            }
            return r;
          });
          actionTaken = true;
          needsSeating = true;
        } else {
          // Update other details but keep same time slot
          updatedRegistrations = updatedRegistrations.map(r => {
            if (r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
                r.round === roundKey && 
                !r.isMulligan) {
              
              // FIXED: When updating, preserve existing payment details unless explicitly changing them
              // Don't overwrite COMP player payment amounts when just adding/removing mulligans
              const isPaymentChange = paymentType && paymentType !== r.paymentType;
              
              let newEventType, finalPaymentType, finalPaymentAmount;
              
              if (isPaymentChange) {
                // User is explicitly changing payment type, use new values
                newEventType = determineEventType(paymentType, normalizedPlayer.entryType, roundKey);
                finalPaymentType = newEventType === 'COMP' ? 'Comp' : paymentType;
                finalPaymentAmount = newEventType === 'COMP' ? 0 : normalizePaymentAmount(paymentAmount);
              } else {
                // Preserve existing payment details (just adding/removing mulligan)
                newEventType = r.eventType;
                finalPaymentType = r.paymentType;
                finalPaymentAmount = r.paymentAmount;
              }
              
              return {
                ...r,
                eventType: newEventType, // Simple: PAY, COMP
                entryType: normalizedPlayer.entryType, // Preserve original EntryType
                paymentType: finalPaymentType,
                paymentAmount: finalPaymentAmount,
                paymentType2: isPaymentChange && splitPayment ? paymentType2 : r.paymentType2,
                paymentAmount2: isPaymentChange && splitPayment ? normalizePaymentAmount(paymentAmount2) : r.paymentAmount2,
                host: host || r.host,
                comment: comments || r.comment,
                registrationDate: new Date().toISOString()
              };
            }
            return r;
          });
          actionTaken = true;
        }
      }

      // Add new registration (first time only)
      if (isFirstTimeRegistration) {
        // SIMPLIFIED: EventType logic
        const eventType = determineEventType(paymentType, normalizedPlayer.entryType, roundKey);
        const finalPaymentType = eventType === 'COMP' ? 'Comp' : paymentType;
        const finalPaymentAmount = eventType === 'COMP' ? 0 : normalizePaymentAmount(paymentAmount);
        
        const baseReg = {
          id: crypto.randomUUID(), 
          playerAccountNumber: normalizedPlayer.playerAccountNumber, 
          firstName: normalizedPlayer.firstName, 
          lastName: normalizedPlayer.lastName,
          eventName: selectedEvent, 
          eventType, // Simple: PAY, COMP
          entryType: normalizedPlayer.entryType, // Original EntryType from import
          paymentType: finalPaymentType, 
          paymentAmount: finalPaymentAmount,
          paymentType2: splitPayment ? paymentType2 : null, 
          paymentAmount2: splitPayment ? normalizePaymentAmount(paymentAmount2) : null,
          registrationDate: new Date().toISOString(), 
          host, 
          comment: comments, 
          round: roundKey, 
          employee, 
          isRebuy: isRebuyRound, 
          isMulligan: false,
          timeSlot: currentTimeSlot,
          tableNumber: null, 
          seatNumber: null
        };
        updatedRegistrations.push(baseReg);
        actionTaken = true;
        needsSeating = true;
      }
      
      // Handle mulligan in the same update - ALWAYS EventType = "Mulligan"
      if (addMulligan) {
        actionTaken = true;
        const mulliganRegData = {
          playerAccountNumber: normalizedPlayer.playerAccountNumber, 
          firstName: normalizedPlayer.firstName, 
          lastName: normalizedPlayer.lastName,
          eventName: selectedEvent, 
          eventType: 'Mulligan', // Always "Mulligan"
          entryType: normalizedPlayer.entryType, // Original EntryType from import
          paymentType: mulliganPaymentType, 
          paymentAmount: normalizePaymentAmount(mulliganAmount),
          paymentType2: splitMulliganPayment ? mulliganPaymentType2 : null, 
          paymentAmount2: splitMulliganPayment ? normalizePaymentAmount(mulliganAmount2) : null,
          registrationDate: new Date().toISOString(), 
          host, 
          comment: comments, 
          round: roundKey, 
          employee, 
          isRebuy: false, 
          isMulligan: true,
          timeSlot: currentTimeSlot, 
          tableNumber: null, 
          seatNumber: null
        };
        if (existingMulliganIndex > -1) {
          // Update existing mulligan
          updatedRegistrations = updatedRegistrations.map(r => {
            if (r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
                r.round === roundKey && 
                r.isMulligan) {
              return { ...r, ...mulliganRegData };
            }
            return r;
          });
        } else {
          updatedRegistrations.push({ id: crypto.randomUUID(), ...mulliganRegData });
        }
      } else if (existingMulliganIndex > -1) {
        actionTaken = true;
        updatedRegistrations = updatedRegistrations.filter(r => 
          !(r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
            r.round === roundKey && 
            r.isMulligan)
        );
      }

      return updatedRegistrations;
    });

    if (!actionTaken) {
      toast.error("No changes to save.");
      return;
    }
    
    // Set pending registration and last registered player after state update
    if (needsSeating) {
      setTimeout(() => {
        setRegistrations(currentRegs => {
          const finalPendingRegs = currentRegs.filter(r => 
            r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
            r.round === roundKey
          );
          
          setPendingRegistration({
            registrations: finalPendingRegs, 
            player: normalizedPlayer, 
            activeTab, 
            selectedRound: roundKey, 
            selectedTimeSlot: currentTimeSlot,
            paymentType, paymentAmount, splitPayment, paymentType2, paymentAmount2, 
            addMulligan, mulliganPaymentType, mulliganAmount,
            splitMulliganPayment, mulliganPaymentType2, mulliganAmount2, host, comments
          });
          
          setLastRegisteredPlayer({ 
            playerAccountNumber: normalizedPlayer.playerAccountNumber, 
            firstName: normalizedPlayer.firstName, 
            lastName: normalizedPlayer.lastName, 
            round: roundKey, 
            timeSlot: currentTimeSlot
          });
          
          return currentRegs;
        });
      }, 0);
    }
    
    // Better success messages and determine if seating is needed
    let successMessage = '';
    
    if (isFirstTimeRegistration) {
      if (isRebuyRound) {
        successMessage = `${normalizedPlayer.firstName} registered for ${currentRoundInfo.name}!`;
      } else {
        successMessage = `${normalizedPlayer.firstName} registered for ${currentRoundInfo.name}!`;
      }
    } else if (isTimeSlotChange) {
      successMessage = `${normalizedPlayer.firstName} moved to Time Slot ${currentTimeSlot} for ${currentRoundInfo.name}!`;
    } else {
      successMessage = `${normalizedPlayer.firstName}'s registration for ${currentRoundInfo.name} updated!`;
    }
    
    if (existingMulliganIndex > -1 && !addMulligan) {
      toast.success('Mulligan removed.');
    }
    
    toast.success(successMessage);
    
    // Only go to seating if this is a first-time registration that needs seating
    if (needsSeating && isFirstTimeRegistration) {
      setCurrentPage(2);
    } else {
      // For post-registration actions, just clear the form and stay on the page
      clearForm();
    }
  }, [
    currentPlayer, activeTab, selectedRound, rounds, selectedTimeSlot, allRegistrations,
    addMulligan, paymentType, paymentAmount, splitPayment, paymentType2, paymentAmount2,
    mulliganPaymentType, mulliganAmount, splitMulliganPayment, mulliganPaymentType2,
    mulliganAmount2, comments, host, initialTournament.rebuyCost, initialTournament.mulliganCost,
    selectedEvent, employee, setRegistrations, setPendingRegistration, setLastRegisteredPlayer,
    setCurrentPage, clearForm, determineEventType
  ]);
  
  return {
    currentPlayer, showNewPlayerForm, paymentType, paymentAmount, splitPayment, paymentType2,
    paymentAmount2, addMulligan, mulliganPaymentType, mulliganAmount, splitMulliganPayment,
    mulliganPaymentType2, mulliganAmount2, comments, host,
    setShowNewPlayerForm, setPaymentType, setPaymentAmount, setSplitPayment, setPaymentType2,
    setPaymentAmount2, setAddMulligan, setMulliganPaymentType, setMulliganAmount,
    setSplitMulliganPayment, setMulliganPaymentType2, setMulliganAmount2, setComments, setHost,
    searchPlayer, handleRegistration, clearForm, handlePaymentTypeChange, handleNewPlayerSave,
    isRegisteredForRound, rounds,
  };
};