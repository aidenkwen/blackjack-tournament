import React, { useState } from 'react';
import Papa from 'papaparse';
import { useTournamentContext } from '../../context/TournamentContext';
import { useNavigate } from 'react-router-dom';

const ExportPage = () => {
  const navigate = useNavigate();
  const { selectedEvent, employee, masterData, registrations } = useTournamentContext();
  
  const [exportType, setExportType] = useState('registrations');
  const [selectedExportRound, setSelectedExportRound] = useState('');

  const rounds = [
    { key: 'round1', name: 'Round 1' },
    { key: 'rebuy1', name: 'Rebuy 1' },
    { key: 'rebuy2', name: 'Rebuy 2' },
    { key: 'round2', name: 'Round 2' },
    { key: 'superrebuy', name: 'Super Rebuy' },
    { key: 'quarterfinals', name: 'Quarterfinals' },
    { key: 'semifinals', name: 'Semifinals' }
  ];
  
  const handleBackToRegistration = () => {
    navigate('/register');
  };

  const normalizePlayerData = (playerData) => {
    if (!playerData) return {};
    return {
      playerAccountNumber: playerData.PlayerAccountNumber || playerData['Player Account Number'] || playerData.playerAccountNumber || playerData.AccountNumber,
      firstName: playerData.FirstName || playerData['First Name'] || playerData.firstName,
      lastName: playerData.LastName || playerData['Last Name'] || playerData.lastName,
      entryType: playerData.EntryType || playerData['Entry Type'] || playerData.entryType,
      host: playerData.Host || playerData.host || ''
    };
  };

  // Function to deduplicate registrations and keep only the most recent per player/round/type
  const deduplicateRegistrations = (regs) => {
    const grouped = {};
    
    regs.forEach(reg => {
      // Create a key that groups by player, round, and whether it's a mulligan
      const key = `${reg.playerAccountNumber}-${reg.round}-${reg.isMulligan ? 'mulligan' : 'main'}`;
      
      if (!grouped[key]) {
        grouped[key] = reg;
      } else {
        // Keep the one with the most recent registration date
        const existingDate = new Date(grouped[key].registrationDate);
        const newDate = new Date(reg.registrationDate);
        if (newDate > existingDate) {
          grouped[key] = reg;
        }
      }
    });
    
    return Object.values(grouped);
  };

  const exportData = () => {
    if (!selectedExportRound) {
      alert('Please select a round to export.');
      return;
    }

    const roundKey = selectedExportRound;
    let dataToExport = [];
    let filename = '';

    if (exportType === 'registrations') {
      // Deduplicate registrations before export
      const roundRegistrations = registrations.filter((r) => r.round === roundKey);
      const deduplicatedRegistrations = deduplicateRegistrations(roundRegistrations);
      
      dataToExport = deduplicatedRegistrations.map((r) => ({
        PlayerAccountNumber: r.playerAccountNumber,
        FirstName: r.firstName,
        LastName: r.lastName,
        EventName: r.eventName,
        EventType: r.eventType,
        PaymentType: r.paymentType,
        PaymentAmount: r.paymentAmount,
        PaymentType2: r.paymentType2,
        PaymentAmount2: r.paymentAmount2,
        RegistrationDate: r.registrationDate,
        Host: r.host,
        Comment: r.comment,
        Employee: r.employee,
        Round: r.round,
        TimeSlot: r.timeSlot
      }));

      filename = `${selectedEvent}_${roundKey}_Registrations_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      const combinedData = [];
      
      if (roundKey === 'round1') {
        combinedData.push(...masterData.map((player) => {
          const normalizedPlayer = normalizePlayerData(player);
          return {
            PlayerAccountNumber: normalizedPlayer.playerAccountNumber,
            FirstName: normalizedPlayer.firstName,
            LastName: normalizedPlayer.lastName,
            EventName: selectedEvent,
            EventType: normalizedPlayer.entryType,
            PaymentType: normalizedPlayer.entryType === 'COMP' ? 'Comp' : 'Cash',
            PaymentAmount: normalizedPlayer.entryType === 'COMP' ? 0 : 500,
            UploadedDate: new Date().toISOString(),
            Host: normalizedPlayer.host,
            Employee: employee,
            Round: null, 
            TimeSlot: null
          };
        }));
      }

      // Deduplicate registrations before adding to combined data
      const roundRegistrations = registrations.filter((r) => r.round === roundKey);
      const deduplicatedRegistrations = deduplicateRegistrations(roundRegistrations);
      
      combinedData.push(...deduplicatedRegistrations.map((reg) => ({
        PlayerAccountNumber: reg.playerAccountNumber,
        FirstName: reg.firstName,
        LastName: reg.lastName,
        EventName: reg.eventName,
        EventType: reg.eventType,
        PaymentType: reg.paymentType,
        PaymentAmount: reg.paymentAmount,
        PaymentType2: reg.paymentType2,
        PaymentAmount2: reg.paymentAmount2,
        RegistrationDate: reg.registrationDate,
        Host: reg.host,
        Comment: reg.comment,
        Employee: reg.employee,
        Round: reg.round,
        TimeSlot: reg.timeSlot
      })));

      dataToExport = combinedData;
      filename = `${selectedEvent}_${roundKey}_Complete_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    alert(`Exported ${dataToExport.length} records`);
  };

  return (
    <div className="container">
      <button onClick={handleBackToRegistration} className="link-back link-back-block">
        {'<'} Back to Registration
      </button>

      <div className="page-header">
        <h1 className="page-title">{selectedEvent} / Export Data</h1>
      </div>

      <div className="form-group">
        <label className="mb-2">Export Type</label>
        <select
          value={exportType}
          onChange={(e) => setExportType(e.target.value)}
          className="select-field"
        >
          <option value="registrations">New Registrations Only</option>
          <option value="combined">Master Data + New Registrations</option>
        </select>
      </div>

      <div className="form-group">
        <label className="mb-2">Select Round</label>
        <select
          value={selectedExportRound}
          onChange={(e) => setSelectedExportRound(e.target.value)}
          className="select-field"
        >
          <option value="">-- Select Round --</option>
          {rounds.map((round) => (
            <option key={round.key} value={round.key}>
              {round.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={exportData}
        disabled={!registrations || registrations.length === 0}
        className={`btn btn-success ${
          !registrations || registrations.length === 0 ? 'btn-disabled' : ''
        }`}
      >
        Export Data
      </button>
    </div>
  );
};

export default ExportPage;