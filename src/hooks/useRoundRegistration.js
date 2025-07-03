import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { normalizeAccount, amountsMatch, normalizePlayerData } from '../utils/formatting';

// Utility functions
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

export const useRoundRegistration = ({
  currentTournament,
  allRegistrations,
  setRegistrations,
  selectedEvent,
  masterData,
  setMasterData,
  employee,
  currentRound,
  currentRoundInfo,
  pendingRegistration,
  setPendingRegistration,
  setLastRegisteredPlayer,
  onSeatingNeeded,
  // Keep these for compatibility but make them optional
  lastRoundPreferences = {},
  setLastRoundPreferences = () => {},
  saveSearchState = () => {},
  restoreSearchState = () => ({})
}) => {
  // Form state - simple and clean
  const [searchAccount, setSearchAccount] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [showNewPlayerForm, setShowNewPlayerForm] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [splitPayment, setSplitPayment] = useState(false);
  const [paymentType2, setPaymentType2] = useState('');
  const [paymentAmount2, setPaymentAmount2] = useState('');
  const [addMulligan, setAddMulligan] = useState(false);
  const [mulliganPaymentType, setMulliganPaymentType] = useState('');
  const [mulliganAmount, setMulliganAmount] = useState(currentTournament.mulliganCost.toString());
  const [splitMulliganPayment, setSplitMulliganPayment] = useState(false);
  const [mulliganPaymentType2, setMulliganPaymentType2] = useState('');
  const [mulliganAmount2, setMulliganAmount2] = useState('');
  const [comments, setComments] = useState('');
  const [host, setHost] = useState('');

  // Simple clear form function with useCallback to prevent unnecessary re-renders
  const clearForm = useCallback(() => {
    setSearchAccount('');
    setCurrentPlayer(null);
    setShowNewPlayerForm(false);
    setSelectedTimeSlot('');
    setPaymentType('');
    setPaymentAmount(() => currentRoundInfo.cost.toString());
    setSplitPayment(false);
    setPaymentType2('');
    setPaymentAmount2('');
    setAddMulligan(false);
    setMulliganPaymentType('');
    setMulliganAmount(() => currentTournament.mulliganCost.toString());
    setSplitMulliganPayment(false);
    setMulliganPaymentType2('');
    setMulliganAmount2('');
    setComments('');
    setHost('');
  }, [currentTournament.mulliganCost, currentRoundInfo.cost]);

  const currentTournamentRegistrations = useMemo(() => 
    allRegistrations.filter(r => r.eventName === selectedEvent), 
    [allRegistrations, selectedEvent]
  );

  const handlePaymentTypeChange = useCallback((newType) => {
    setPaymentType(newType);
    if (newType === 'Comp') {
      setPaymentAmount('0');
      setSplitPayment(false);
    } else {
      setPaymentAmount(currentRoundInfo.cost.toString());
    }
  }, [currentRoundInfo.cost]);

  const isRegisteredForRound = useCallback((playerAccountNumber, roundKey) => 
    currentTournamentRegistrations.some(r => 
      normalizeAccount(r.playerAccountNumber) === normalizeAccount(playerAccountNumber) && 
      r.round === roundKey && 
      !r.isMulligan
    ), [currentTournamentRegistrations]);

  const playerHasMulligan = useCallback((playerAccountNumber, roundKey) => 
    currentTournamentRegistrations.some(r => 
      normalizeAccount(r.playerAccountNumber) === normalizeAccount(playerAccountNumber) && 
      r.round === roundKey && 
      r.isMulligan === true
    ), [currentTournamentRegistrations]);

  const handleRegistration = useCallback(() => {
    if (!currentPlayer) return;
    if (!validateTimeSlot(selectedTimeSlot)) {
      toast.error(`Please select a time slot for ${currentRoundInfo.name}.`);
      return;
    }

    const normalizedPlayer = normalizePlayerData(currentPlayer);
    const currentTimeSlot = normalizePaymentAmount(selectedTimeSlot);
    
    // Find existing registration for this player and round
    const existingRegIndex = allRegistrations.findIndex(r => 
      r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
      r.round === currentRound && 
      !r.isMulligan
    );
    const existingMulliganIndex = allRegistrations.findIndex(r => 
      r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
      r.round === currentRound && 
      r.isMulligan
    );

    const isFirstTimeRegistration = existingRegIndex === -1;
    const isUpdate = !isFirstTimeRegistration;
    
    // Check if this is a time slot change
    const existingReg = existingRegIndex > -1 ? allRegistrations[existingRegIndex] : null;
    const isTimeSlotChange = existingReg && existingReg.timeSlot !== currentTimeSlot;

    // Validate payment amounts with normalized values
    if (currentRoundInfo.isRebuy || currentRound !== 'round1') {
      if (!paymentType) {
        toast.error(`Please select payment type for ${currentRoundInfo.name}.`);
        return;
      }
      const required = paymentType === 'Comp' ? 0 : currentRoundInfo.cost;
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
      if (!amountsMatch(currentTournament.mulliganCost, mulAmount1, mulAmount2)) {
        toast.error(`Mulligan payments must add up to $${currentTournament.mulliganCost}.`);
        return;
      }
    }

    let needsSeating = false;
    let actionTaken = false;

    // FIXED: Use functional update to batch all registration changes
    setRegistrations(prevRegistrations => {
      let updatedRegistrations = [...prevRegistrations];

      // Handle main registration
      if (isUpdate) {
        // Always update existing registration in place (never create duplicates)
        updatedRegistrations = updatedRegistrations.map(r => {
          if (r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
              r.round === currentRound && 
              !r.isMulligan) {
            let eventType = 'CHECK-IN';
            let reqPayment = currentRound !== 'round1' || paymentType !== 'Comp';
            
            if (reqPayment && paymentType) {
              const totalAmount = normalizePaymentAmount(paymentAmount) + (splitPayment ? normalizePaymentAmount(paymentAmount2) : 0);
              if (paymentType === 'Comp') {
                eventType = currentRoundInfo.isRebuy ? 'COMP REBUY' : 'COMP $0';
              } else {
                eventType = currentRoundInfo.isRebuy ? `REBUY ${totalAmount}` : `PAY ${totalAmount}`;
              }
            }

            return {
              ...r,
              eventType,
              paymentType: reqPayment ? paymentType : null,
              paymentAmount: reqPayment ? normalizePaymentAmount(paymentAmount) : 0,
              paymentType2: (reqPayment && splitPayment) ? paymentType2 : null,
              paymentAmount2: (reqPayment && splitPayment) ? normalizePaymentAmount(paymentAmount2) : null,
              registrationDate: new Date().toISOString(), // Update timestamp
              host,
              comment: comments,
              timeSlot: currentTimeSlot,
              // FIXED: Only clear seating when time slot changes
              tableNumber: isTimeSlotChange ? null : r.tableNumber,
              seatNumber: isTimeSlotChange ? null : r.seatNumber
            };
          }
          return r;
        });
        
        needsSeating = isTimeSlotChange; // Only need reseating if time slot changed
        actionTaken = true;
      } else {
        // Create new registration (first time only)
        let eventType = 'CHECK-IN';
        let reqPayment = currentRound !== 'round1' || paymentType !== 'Comp';
        
        if (reqPayment && paymentType) {
          const totalAmount = normalizePaymentAmount(paymentAmount) + (splitPayment ? normalizePaymentAmount(paymentAmount2) : 0);
          if (paymentType === 'Comp') {
            eventType = currentRoundInfo.isRebuy ? 'COMP REBUY' : 'COMP $0';
          } else {
            eventType = currentRoundInfo.isRebuy ? `REBUY ${totalAmount}` : `PAY ${totalAmount}`;
          }
        }

        const newReg = {
          id: crypto.randomUUID(),
          playerAccountNumber: normalizedPlayer.playerAccountNumber,
          firstName: normalizedPlayer.firstName,
          lastName: normalizedPlayer.lastName,
          eventName: selectedEvent,
          eventType,
          paymentType: reqPayment ? paymentType : null,
          paymentAmount: reqPayment ? normalizePaymentAmount(paymentAmount) : 0,
          paymentType2: (reqPayment && splitPayment) ? paymentType2 : null,
          paymentAmount2: (reqPayment && splitPayment) ? normalizePaymentAmount(paymentAmount2) : null,
          registrationDate: new Date().toISOString(),
          host,
          comment: comments,
          round: currentRound,
          employee,
          isRebuy: currentRoundInfo.isRebuy,
          isMulligan: false,
          timeSlot: currentTimeSlot,
          tableNumber: null,
          seatNumber: null
        };
        
        updatedRegistrations.push(newReg);
        actionTaken = true;
        needsSeating = true;
      }

      // Handle mulligan separately
      if (addMulligan) {
        if (existingMulliganIndex > -1) {
          // Update existing mulligan in place
          updatedRegistrations = updatedRegistrations.map(r => {
            if (r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
                r.round === currentRound && 
                r.isMulligan) {
              return {
                ...r,
                paymentType: mulliganPaymentType,
                paymentAmount: normalizePaymentAmount(mulliganAmount),
                paymentType2: splitMulliganPayment ? mulliganPaymentType2 : null,
                paymentAmount2: splitMulliganPayment ? normalizePaymentAmount(mulliganAmount2) : null,
                registrationDate: new Date().toISOString(), // Update timestamp
                host,
                comment: comments,
                timeSlot: currentTimeSlot,
                // Only clear mulligan seating if time slot changed
                tableNumber: isTimeSlotChange ? null : r.tableNumber,
                seatNumber: isTimeSlotChange ? null : r.seatNumber
              };
            }
            return r;
          });
        } else {
          // Create new mulligan
          const mulliganData = {
            id: crypto.randomUUID(),
            playerAccountNumber: normalizedPlayer.playerAccountNumber,
            firstName: normalizedPlayer.firstName,
            lastName: normalizedPlayer.lastName,
            eventName: selectedEvent,
            eventType: 'MULLIGAN',
            paymentType: mulliganPaymentType,
            paymentAmount: normalizePaymentAmount(mulliganAmount),
            paymentType2: splitMulliganPayment ? mulliganPaymentType2 : null,
            paymentAmount2: splitMulliganPayment ? normalizePaymentAmount(mulliganAmount2) : null,
            registrationDate: new Date().toISOString(),
            host,
            comment: comments,
            round: currentRound,
            employee,
            isRebuy: false,
            isMulligan: true,
            timeSlot: currentTimeSlot,
            tableNumber: null,
            seatNumber: null
          };
          updatedRegistrations.push(mulliganData);
        }
        actionTaken = true;
      } else if (existingMulliganIndex > -1) {
        // Remove mulligan if checkbox is unchecked (don't affect main registration)
        updatedRegistrations = updatedRegistrations.filter(r => 
          !(r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
            r.round === currentRound && 
            r.isMulligan)
        );
        actionTaken = true;
      }

      return updatedRegistrations;
    });

    if (!actionTaken) {
      toast.error("No changes to save.");
      return;
    }

    // Set up pending registration for seating ONLY if needed
    if (needsSeating) {
      // Use setTimeout to ensure registrations state has updated
      setTimeout(() => {
        setRegistrations(currentRegs => {
          const finalPendingRegs = currentRegs.filter(r => 
            r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
            r.round === currentRound
          );
          
          setPendingRegistration({
            registrations: finalPendingRegs,
            player: normalizedPlayer,
            activeTab: 'registration',
            selectedRound: currentRound,
            selectedTimeSlot: currentTimeSlot,
            paymentType, paymentAmount, splitPayment, paymentType2, paymentAmount2,
            addMulligan, mulliganPaymentType, mulliganAmount,
            splitMulliganPayment, mulliganPaymentType2, mulliganAmount2, host, comments
          });

          setLastRegisteredPlayer({
            playerAccountNumber: normalizedPlayer.playerAccountNumber,
            firstName: normalizedPlayer.firstName,
            lastName: normalizedPlayer.lastName,
            round: currentRound,
            timeSlot: currentTimeSlot
          });

          return currentRegs;
        });
      }, 0);
    }

    // Success messages
    let successMessage = '';
    if (isFirstTimeRegistration) {
      if (currentRoundInfo.isRebuy) {
        successMessage = `${normalizedPlayer.firstName} checked in for ${currentRoundInfo.name}!`;
      } else {
        successMessage = `${normalizedPlayer.firstName} registered for ${currentRoundInfo.name}!`;
      }
    } else if (isTimeSlotChange) {
      successMessage = `${normalizedPlayer.firstName} moved to Time Slot ${currentTimeSlot} for ${currentRoundInfo.name}!`;
    } else {
      successMessage = `${normalizedPlayer.firstName}'s registration for ${currentRoundInfo.name} updated!`;
    }

    toast.success(successMessage);

    if (needsSeating) {
      onSeatingNeeded();
    } else {
      // Clear the form and search result after successful update
      setComments('');
      setCurrentPlayer(null);
      setSearchAccount('');
    }
  }, [
    currentPlayer, selectedTimeSlot, currentRoundInfo, paymentType, paymentAmount, 
    splitPayment, paymentType2, paymentAmount2, addMulligan, mulliganPaymentType, 
    mulliganAmount, splitMulliganPayment, mulliganPaymentType2, mulliganAmount2, 
    comments, host, allRegistrations, currentRound, selectedEvent, employee, 
    currentTournament.mulliganCost, setRegistrations, setPendingRegistration, 
    setLastRegisteredPlayer, onSeatingNeeded
  ]);

  const searchPlayer = useCallback((searchAccountParam) => {
    const accountNum = String(searchAccountParam || '').trim();
    if (!accountNum) return;
    
    if (!/^\d+$/.test(accountNum)) {
      toast.error('Account number must contain only numbers.');
      return;
    }
    if (accountNum.length !== 14) {
      toast.error(`Account number must be 14 digits. You entered ${accountNum.length}.`);
      return;
    }

    const normalizedInput = normalizeAccount(accountNum);
    const player = masterData.find((p) => 
      normalizeAccount(normalizePlayerData(p).playerAccountNumber) === normalizedInput
    );

    if (player) {
      const normalizedPlayer = normalizePlayerData(player);
      
      // Validate player eligibility for this round
      if (currentRound !== 'round1' && !isRegisteredForRound(normalizedPlayer.playerAccountNumber, 'round1')) {
        toast.error(`${normalizedPlayer.firstName} must be registered in Round 1 first.`);
        return;
      }
      if (currentRound === 'rebuy2' && !isRegisteredForRound(normalizedPlayer.playerAccountNumber, 'rebuy1')) {
        toast.error(`${normalizedPlayer.firstName} must be in Rebuy 1 to be eligible for Rebuy 2.`);
        return;
      }

      // Set player info
      setCurrentPlayer(normalizedPlayer);
      setShowNewPlayerForm(false);
      setComments('');
      setHost(normalizedPlayer.host || '');

      // Find existing registration for this player and round to auto-populate
      const existingReg = allRegistrations.find(r => 
        r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
        r.round === currentRound && 
        !r.isMulligan
      );

      if (existingReg) {
        // Auto-populate with existing registration data
        setSelectedTimeSlot(existingReg.timeSlot ? existingReg.timeSlot.toString() : '');
        setPaymentType(existingReg.paymentType || '');
        setPaymentAmount(existingReg.paymentAmount ? existingReg.paymentAmount.toString() : currentRoundInfo.cost.toString());
        setSplitPayment(!!existingReg.paymentType2);
        setPaymentType2(existingReg.paymentType2 || '');
        setPaymentAmount2(existingReg.paymentAmount2 ? existingReg.paymentAmount2.toString() : '');
        setHost(existingReg.host || '');
        setComments(existingReg.comment || '');
      } else {
        // New registration - set defaults
        setSelectedTimeSlot('');
        if (currentRound === 'round1') {
          const playerEntryType = normalizedPlayer.entryType === 'COMP' ? 'COMP' : 'PAY';
          if (playerEntryType === 'COMP') {
            handlePaymentTypeChange('Comp');
          } else {
            setPaymentAmount(currentRoundInfo.cost.toString());
          }
        } else {
          setPaymentAmount(currentRoundInfo.cost.toString());
        }
      }

      // Check for existing mulligan and auto-populate
      const existingMulligan = allRegistrations.find(r => 
        r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
        r.round === currentRound && 
        r.isMulligan
      );

      if (existingMulligan) {
        setAddMulligan(true);
        setMulliganPaymentType(existingMulligan.paymentType || '');
        setMulliganAmount(existingMulligan.paymentAmount ? existingMulligan.paymentAmount.toString() : currentTournament.mulliganCost.toString());
        setSplitMulliganPayment(!!existingMulligan.paymentType2);
        setMulliganPaymentType2(existingMulligan.paymentType2 || '');
        setMulliganAmount2(existingMulligan.paymentAmount2 ? existingMulligan.paymentAmount2.toString() : '');
        toast(`${normalizedPlayer.firstName} already has a mulligan for ${currentRoundInfo.name}.`, { icon: 'ℹ️' });
      } else {
        setAddMulligan(false);
      }
    } else {
      // Only allow new players in Round 1
      if (currentRound === 'round1') {
        setCurrentPlayer(null);
        setShowNewPlayerForm(true);
        setComments('');
        setHost('');
      } else {
        toast.error('Player not found. New players can only be added in Round 1.');
      }
    }
  }, [masterData, currentRound, currentRoundInfo.name, currentRoundInfo.cost, isRegisteredForRound, handlePaymentTypeChange, allRegistrations, currentTournament.mulliganCost]);

  const handleNewPlayerSave = useCallback((newPlayer, registerImmediately, registrationData) => {
    if (masterData.some(p => 
      normalizeAccount(normalizePlayerData(p).playerAccountNumber) === normalizeAccount(newPlayer.playerAccountNumber)
    )) {
      toast.error('A player with this account number already exists.');
      return;
    }

    const updatedMasterData = [...masterData, newPlayer];
    setMasterData(updatedMasterData);
    toast.success(`${newPlayer.firstName} added to the master player list.`);

    if (registerImmediately) {
      const normalizedPlayer = normalizePlayerData(newPlayer);
      setCurrentPlayer(normalizedPlayer);
      setShowNewPlayerForm(false);
      
      // Set form data from registration - use functional updates
      setSelectedTimeSlot(() => registrationData.selectedTimeSlot);
      setPaymentType(() => registrationData.paymentType);
      setPaymentAmount(() => registrationData.paymentAmount);
      setSplitPayment(() => registrationData.splitPayment);
      setPaymentType2(() => registrationData.paymentType2);
      setPaymentAmount2(() => registrationData.paymentAmount2);
      setAddMulligan(() => registrationData.addMulligan);
      setMulliganPaymentType(() => registrationData.mulliganPaymentType);
      setMulliganAmount(() => registrationData.mulliganAmount);
      setSplitMulliganPayment(() => registrationData.splitMulliganPayment);
      setMulliganPaymentType2(() => registrationData.mulliganPaymentType2);
      setMulliganAmount2(() => registrationData.mulliganAmount2);
      setComments(() => registrationData.comments);
      setHost(() => registrationData.host);

      // Process registration immediately
      setTimeout(() => handleRegistration(), 100);
    } else {
      clearForm();
    }
  }, [masterData, setMasterData, clearForm, handleRegistration]);

  return {
    // State
    searchAccount,
    currentPlayer,
    showNewPlayerForm,
    selectedTimeSlot,
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
    comments,
    host,

    // Setters
    setSearchAccount,
    setCurrentPlayer,
    setShowNewPlayerForm,
    setSelectedTimeSlot,
    setPaymentType,
    setPaymentAmount,
    setSplitPayment,
    setPaymentType2,
    setPaymentAmount2,
    setAddMulligan,
    setMulliganPaymentType,
    setMulliganAmount,
    setSplitMulliganPayment,
    setMulliganPaymentType2,
    setMulliganAmount2,
    setComments,
    setHost,

    // Actions
    searchPlayer,
    handleRegistration,
    handleNewPlayerSave,
    handlePaymentTypeChange,
    clearForm,

    // Utilities
    isRegisteredForRound,
    playerHasMulligan
  };
};