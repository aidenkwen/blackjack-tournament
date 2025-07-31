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

  // ENHANCED: Round prerequisite validation logic
  const validateRoundPrerequisites = useCallback((playerAccountNumber, targetRound, playerName) => {
    switch (targetRound) {
      case 'round1':
        // No prerequisites for Round 1
        return { isValid: true };
        
      case 'round2':
        // Round 2 requires Round 1 registration
        if (!isRegisteredForRound(playerAccountNumber, 'round1')) {
          return {
            isValid: false,
            message: `${playerName} must be registered in Round 1 before registering for Round 2.`
          };
        }
        return { isValid: true };
        
      case 'rebuy1':
        // Rebuy 1 requires Round 1 registration
        if (!isRegisteredForRound(playerAccountNumber, 'round1')) {
          return {
            isValid: false,
            message: `${playerName} must be registered in Round 1 before registering for Rebuy 1.`
          };
        }
        return { isValid: true };
        
      case 'rebuy2':
        // Rebuy 2 requires Rebuy 1 registration
        if (!isRegisteredForRound(playerAccountNumber, 'rebuy1')) {
          return {
            isValid: false,
            message: `${playerName} must be registered in Rebuy 1 before registering for Rebuy 2.`
          };
        }
        return { isValid: true };
        
      case 'superrebuy':
        // Super Rebuy requires Round 2 registration
        if (!isRegisteredForRound(playerAccountNumber, 'round2')) {
          return {
            isValid: false,
            message: `${playerName} must be registered in Round 2 before registering for Super Rebuy.`
          };
        }
        return { isValid: true };
        
      case 'quarters':
        // Quarters requires Round 2 registration
        if (!isRegisteredForRound(playerAccountNumber, 'round2')) {
          return {
            isValid: false,
            message: `${playerName} must be registered in Round 2 before registering for Quarterfinals.`
          };
        }
        return { isValid: true };
        
      case 'semis':
        // Semis requires Quarters registration
        if (!isRegisteredForRound(playerAccountNumber, 'quarters')) {
          return {
            isValid: false,
            message: `${playerName} must be registered in Quarterfinals before registering for Semifinals.`
          };
        }
        return { isValid: true };
        
      default:
        return { isValid: true };
    }
  }, [isRegisteredForRound]);

  // FIXED: Simplified eventType logic - it's just about how they paid
  const determineEventType = useCallback((paymentType, playerEntryType, currentRound) => {
    // Mulligan is always "Mulligan"
    if (paymentType === 'Comp') {
      return 'COMP'; // They got it for free
    } else if (paymentType === 'Cash' || paymentType === 'Credit' || paymentType === 'Chips') {
      return 'PAY'; // They paid money
    } else if (currentRound === 'round1' && playerEntryType === 'COMP' && !paymentType) {
      // COMP players in Round 1 without explicit payment selection default to COMP
      return 'COMP';
    } else {
      return 'PAY'; // Default to PAY
    }
  }, []);

  const handleRegistration = useCallback(() => {
    console.log('=== REGISTRATION DEBUG START ===');
    console.log('currentPlayer:', currentPlayer);
    console.log('selectedTimeSlot:', selectedTimeSlot);
    console.log('paymentType:', paymentType);
    console.log('paymentAmount:', paymentAmount);
    console.log('addMulligan:', addMulligan);
    console.log('currentRound:', currentRound);
    
    if (!currentPlayer) return;
    if (!validateTimeSlot(selectedTimeSlot)) {
      toast.error(`Please select a time slot for ${currentRoundInfo.name}.`);
      return;
    }

    const normalizedPlayer = normalizePlayerData(currentPlayer);
    const currentTimeSlot = normalizePaymentAmount(selectedTimeSlot);
    
    console.log('normalizedPlayer:', normalizedPlayer);
    console.log('currentTimeSlot:', currentTimeSlot);
    
    // ENHANCED: Validate round prerequisites
    const prerequisiteCheck = validateRoundPrerequisites(
      normalizedPlayer.playerAccountNumber, 
      currentRound, 
      normalizedPlayer.firstName
    );
    
    if (!prerequisiteCheck.isValid) {
      toast.error(prerequisiteCheck.message);
      return;
    }
    
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
    
    console.log('existingRegIndex:', existingRegIndex);
    console.log('existingMulliganIndex:', existingMulliganIndex);
    console.log('isFirstTimeRegistration:', isFirstTimeRegistration);
    console.log('isUpdate:', isUpdate);
    
    // FIXED: Check if payment is required based on round type
    const isPaymentRound = ['round1', 'rebuy1', 'rebuy2', 'superrebuy'].includes(currentRound);
    const needsPayment = isPaymentRound && !(currentRound === 'round1' && normalizedPlayer.entryType === 'COMP' && !paymentType);
    
    if (needsPayment && !paymentType) {
      toast.error(`Please select payment type for ${currentRoundInfo.name}.`);
      return;
    }
    
    if (paymentType && paymentType !== 'Comp') {
      const required = currentRoundInfo.cost;
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

    // Check if this is a time slot change
    const existingReg = existingRegIndex > -1 ? allRegistrations[existingRegIndex] : null;
    const isTimeSlotChange = existingReg && existingReg.timeSlot !== currentTimeSlot;

    console.log('existingReg:', existingReg);
    console.log('existingReg timeSlot:', existingReg?.timeSlot);
    console.log('currentTimeSlot:', currentTimeSlot);
    console.log('isTimeSlotChange:', isTimeSlotChange);

    let needsSeating = false;
    let actionTaken = false;
    
    console.log('Initial actionTaken:', actionTaken);

    // Use functional update to batch all registration changes
    setRegistrations(prevRegistrations => {
      let updatedRegistrations = [...prevRegistrations];

      // Handle main registration
      if (isUpdate) {
        // Update existing registration
        updatedRegistrations = updatedRegistrations.map(r => {
          if (r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
              r.round === currentRound && 
              !r.isMulligan) {
            
            // When updating, preserve existing payment details unless explicitly changing them
            // Don't overwrite COMP player payment amounts when just adding/removing mulligans
            const isPaymentChange = paymentType && paymentType !== r.paymentType;
            
            let newEventType, finalPaymentType, finalPaymentAmount;
            
            if (isPaymentChange) {
              // User is explicitly changing payment type, use new values
              newEventType = determineEventType(paymentType, normalizedPlayer.entryType, currentRound);
              finalPaymentType = newEventType === 'COMP' ? 'Comp' : paymentType;
              finalPaymentAmount = newEventType === 'COMP' ? 0 : normalizePaymentAmount(paymentAmount);
            } else {
              // Preserve existing payment details (just adding/removing mulligan or changing time slot)
              newEventType = r.eventType;
              finalPaymentType = r.paymentType;
              finalPaymentAmount = r.paymentAmount;
            }

            return {
              ...r,
              eventType: newEventType,
              entryType: normalizedPlayer.entryType,
              paymentType: finalPaymentType,
              paymentAmount: finalPaymentAmount,
              paymentType2: isPaymentChange && splitPayment ? paymentType2 : r.paymentType2,
              paymentAmount2: isPaymentChange && splitPayment ? normalizePaymentAmount(paymentAmount2) : r.paymentAmount2,
              registrationDate: new Date().toISOString(),
              host: host || r.host,
              comment: comments || r.comment,
              timeSlot: currentTimeSlot,
              tableNumber: isTimeSlotChange ? null : r.tableNumber,
              seatNumber: isTimeSlotChange ? null : r.seatNumber
            };
          }
          return r;
        });
        
        needsSeating = isTimeSlotChange;
        actionTaken = true;
        console.log('UPDATE path - actionTaken set to true');
      } else {
        // Create new registration
        
        // Simple eventType logic for non-payment rounds
        let eventType, finalPaymentType, finalPaymentAmount;
        
        if (isPaymentRound) {
          eventType = determineEventType(paymentType, normalizedPlayer.entryType, currentRound);
          finalPaymentType = eventType === 'COMP' ? 'Comp' : paymentType;
          finalPaymentAmount = eventType === 'COMP' ? 0 : normalizePaymentAmount(paymentAmount);
        } else {
          // For non-payment rounds (Round 2, Quarters, Semis), just mark as PAY with no payment
          eventType = 'PAY';
          finalPaymentType = null;
          finalPaymentAmount = 0;
        }

        const newReg = {
          id: crypto.randomUUID(),
          playerAccountNumber: normalizedPlayer.playerAccountNumber,
          firstName: normalizedPlayer.firstName,
          lastName: normalizedPlayer.lastName,
          eventName: selectedEvent,
          eventType: eventType, // Simple: PAY, COMP
          entryType: normalizedPlayer.entryType, // Original EntryType from import
          paymentType: finalPaymentType,
          paymentAmount: finalPaymentAmount,
          paymentType2: splitPayment ? paymentType2 : null,
          paymentAmount2: splitPayment ? normalizePaymentAmount(paymentAmount2) : null,
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
        console.log('NEW REGISTRATION path - actionTaken set to true');
        needsSeating = true;
      }

      // Handle mulligan separately - ALWAYS eventType = "Mulligan"
      if (addMulligan) {
        if (existingMulliganIndex > -1) {
          // Update existing mulligan
          updatedRegistrations = updatedRegistrations.map(r => {
            if (r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
                r.round === currentRound && 
                r.isMulligan) {
              return {
                ...r,
                eventType: 'Mulligan', // Always "Mulligan"
                entryType: normalizedPlayer.entryType,
                paymentType: mulliganPaymentType,
                paymentAmount: normalizePaymentAmount(mulliganAmount),
                paymentType2: splitMulliganPayment ? mulliganPaymentType2 : null,
                paymentAmount2: splitMulliganPayment ? normalizePaymentAmount(mulliganAmount2) : null,
                registrationDate: new Date().toISOString(),
                host,
                comment: comments,
                timeSlot: currentTimeSlot,
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
            eventType: 'Mulligan', // Always "Mulligan"
            entryType: normalizedPlayer.entryType,
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
        console.log('MULLIGAN path - actionTaken set to true');
      } else if (existingMulliganIndex > -1) {
        // Remove mulligan if checkbox is unchecked
        updatedRegistrations = updatedRegistrations.filter(r => 
          !(r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
            r.round === currentRound && 
            r.isMulligan)
        );
        actionTaken = true;
        console.log('REMOVE MULLIGAN path - actionTaken set to true');
      }

      return updatedRegistrations;
    });

    console.log('Final actionTaken value:', actionTaken);
    console.log('=== REGISTRATION DEBUG END ===');
    
    if (!actionTaken) {
      toast.error("No changes to save.");
      return;
    }

    // Set up pending registration for seating ONLY if needed
    if (needsSeating) {
      setTimeout(() => {
        setRegistrations(currentRegs => {
          const finalPendingRegs = currentRegs.filter(r => 
            r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
            r.round === currentRound
          );
          
          const pendingRegData = {
            registrations: finalPendingRegs,
            player: normalizedPlayer,
            activeTab: 'registration',
            selectedRound: currentRound,
            selectedTimeSlot: currentTimeSlot,
            paymentType, paymentAmount, splitPayment, paymentType2, paymentAmount2,
            addMulligan, mulliganPaymentType, mulliganAmount,
            splitMulliganPayment, mulliganPaymentType2, mulliganAmount2, host, comments
          };
          
          setPendingRegistration(pendingRegData);
          
          setTimeout(() => {
            onSeatingNeeded();
          }, 50);
          
          return currentRegs;
        });
      }, 100);
    } else {
      // Only set lastRegisteredPlayer for updates that don't need seating
      setLastRegisteredPlayer({
        playerAccountNumber: normalizedPlayer.playerAccountNumber,
        firstName: normalizedPlayer.firstName,
        lastName: normalizedPlayer.lastName,
        round: currentRound,
        timeSlot: currentTimeSlot
      });
    }

    // Better success messages that don't mention "check-in"
    let successMessage = '';
    if (isFirstTimeRegistration) {
      successMessage = `${normalizedPlayer.firstName} registered for ${currentRoundInfo.name}!`;
    } else if (isTimeSlotChange) {
      successMessage = `${normalizedPlayer.firstName} moved to Time Slot ${currentTimeSlot} for ${currentRoundInfo.name}!`;
    } else {
      successMessage = `${normalizedPlayer.firstName}'s registration for ${currentRoundInfo.name} updated!`;
    }

    toast.success(successMessage);

    if (!needsSeating) {
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
    setLastRegisteredPlayer, onSeatingNeeded, determineEventType, validateRoundPrerequisites
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
    console.log('Searching for player:', normalizedInput);
    console.log('Available masterData:', masterData);
    console.log('MasterData length:', masterData?.length);
    
    const player = masterData.find((p) => 
      normalizeAccount(normalizePlayerData(p).playerAccountNumber) === normalizedInput
    );
    
    console.log('Found player:', player);

    if (player) {
      const normalizedPlayer = normalizePlayerData(player);
      
      // ENHANCED: Use the new validateRoundPrerequisites function
      const prerequisiteCheck = validateRoundPrerequisites(
        normalizedPlayer.playerAccountNumber, 
        currentRound, 
        normalizedPlayer.firstName
      );
      
      if (!prerequisiteCheck.isValid) {
        toast.error(prerequisiteCheck.message);
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
        // Show toast notification for modification
        toast(`Modifying ${normalizedPlayer.firstName}'s registration for ${currentRoundInfo.name}`, { 
          icon: '✏️',
          duration: 3000
        });

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
        // New registration - set defaults based on round and EntryType
        setSelectedTimeSlot('');
        
        // Only set payment defaults for payment rounds
        const isPaymentRound = ['round1', 'rebuy1', 'rebuy2', 'superrebuy'].includes(currentRound);
        if (isPaymentRound) {
          if (currentRound === 'round1' && normalizedPlayer.entryType === 'COMP') {
            // COMP players get Comp pre-selected but can change it
            setPaymentType('Comp');
            setPaymentAmount('0');
          } else {
            setPaymentType('');
            setPaymentAmount(currentRoundInfo.cost.toString());
          }
        } else {
          // For non-payment rounds, clear payment fields
          setPaymentType('');
          setPaymentAmount('');
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
  }, [masterData, currentRound, currentRoundInfo.name, currentRoundInfo.cost, allRegistrations, currentTournament.mulliganCost, validateRoundPrerequisites]);

  const handleNewPlayerSave = useCallback((newPlayer, registerImmediately, registrationData) => {
    if (masterData.some(p => 
      normalizeAccount(normalizePlayerData(p).playerAccountNumber) === normalizeAccount(newPlayer.playerAccountNumber)
    )) {
      toast.error('A player with this account number already exists.');
      return;
    }

    // Add player to master data
    const updatedMasterData = [...masterData, newPlayer];
    setMasterData(updatedMasterData);
    
    // Show first toast
    toast.success(`${newPlayer.firstName} added to the master player list.`);

    if (registerImmediately) {
      const normalizedPlayer = normalizePlayerData(newPlayer);
      
      // Set form data from registration
      setCurrentPlayer(normalizedPlayer);
      setShowNewPlayerForm(false);
      setSelectedTimeSlot(registrationData.selectedTimeSlot.toString());
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

      // Process registration immediately without going through the normal handleRegistration flow
      // This bypasses the UI validation since we already validated in NewPlayerForm
      const currentTimeSlot = normalizePaymentAmount(registrationData.selectedTimeSlot);
      
      // Create registration records directly
      setRegistrations(prevRegistrations => {
        let updatedRegistrations = [...prevRegistrations];
        
        // Determine event type for main registration
        const isPaymentRound = ['round1', 'rebuy1', 'rebuy2', 'superrebuy'].includes(currentRound);
        let eventType, finalPaymentType, finalPaymentAmount;
        
        if (isPaymentRound) {
          eventType = determineEventType(registrationData.paymentType, normalizedPlayer.entryType, currentRound);
          finalPaymentType = eventType === 'COMP' ? 'Comp' : registrationData.paymentType;
          finalPaymentAmount = eventType === 'COMP' ? 0 : normalizePaymentAmount(registrationData.paymentAmount);
        } else {
          eventType = 'PAY';
          finalPaymentType = null;
          finalPaymentAmount = 0;
        }

        // Create main registration
        const newReg = {
          id: crypto.randomUUID(),
          playerAccountNumber: normalizedPlayer.playerAccountNumber,
          firstName: normalizedPlayer.firstName,
          lastName: normalizedPlayer.lastName,
          eventName: selectedEvent,
          eventType: eventType,
          entryType: normalizedPlayer.entryType,
          paymentType: finalPaymentType,
          paymentAmount: finalPaymentAmount,
          paymentType2: registrationData.splitPayment ? registrationData.paymentType2 : null,
          paymentAmount2: registrationData.splitPayment ? normalizePaymentAmount(registrationData.paymentAmount2) : null,
          registrationDate: new Date().toISOString(),
          host: registrationData.host,
          comment: registrationData.comments,
          round: currentRound,
          employee,
          isRebuy: currentRoundInfo.isRebuy,
          isMulligan: false,
          timeSlot: currentTimeSlot,
          tableNumber: null,
          seatNumber: null
        };
        
        updatedRegistrations.push(newReg);

        // Add mulligan if requested
        if (registrationData.addMulligan) {
          const mulliganData = {
            id: crypto.randomUUID(),
            playerAccountNumber: normalizedPlayer.playerAccountNumber,
            firstName: normalizedPlayer.firstName,
            lastName: normalizedPlayer.lastName,
            eventName: selectedEvent,
            eventType: 'Mulligan',
            entryType: normalizedPlayer.entryType,
            paymentType: registrationData.mulliganPaymentType,
            paymentAmount: normalizePaymentAmount(registrationData.mulliganAmount),
            paymentType2: registrationData.splitMulliganPayment ? registrationData.mulliganPaymentType2 : null,
            paymentAmount2: registrationData.splitMulliganPayment ? normalizePaymentAmount(registrationData.mulliganAmount2) : null,
            registrationDate: new Date().toISOString(),
            host: registrationData.host,
            comment: registrationData.comments,
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

        return updatedRegistrations;
      });

      // Show second toast and set up for seating
      setTimeout(() => {
        toast.success(`${normalizedPlayer.firstName} registered for ${currentRoundInfo.name}!`);
        
        // Set up pending registration for seating
        setRegistrations(currentRegs => {
          const finalPendingRegs = currentRegs.filter(r => 
            r.playerAccountNumber === normalizedPlayer.playerAccountNumber && 
            r.round === currentRound
          );
          
          const pendingRegData = {
            registrations: finalPendingRegs,
            player: normalizedPlayer,
            activeTab: 'registration',
            selectedRound: currentRound,
            selectedTimeSlot: currentTimeSlot,
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
          
          setPendingRegistration(pendingRegData);
          
          // Navigate to seating
          setTimeout(() => {
            onSeatingNeeded();
          }, 50);
          
          return currentRegs;
        });
      }, 100);
    } else {
      clearForm();
    }
  }, [masterData, setMasterData, clearForm, currentRound, currentRoundInfo, selectedEvent, employee, setRegistrations, setPendingRegistration, onSeatingNeeded, determineEventType]);

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
    playerHasMulligan,
    validateRoundPrerequisites
  };
};