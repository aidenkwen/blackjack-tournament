import React, { useState } from 'react';
import { UC } from '../../utils/formatting';

const AddTournamentPage = ({
  tournaments,
  addTournament,
  uploadPlayersFile,
  loading,
  onBack
}) => {
  const [tournamentName, setTournamentName] = useState('');
  const [entryCost, setEntryCost] = useState('500');
  const [rebuyCost, setRebuyCost] = useState('500');
  const [mulliganCost, setMulliganCost] = useState('100');
  const [importing, setImporting] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleAddTournament = async () => {
    if (!tournamentName.trim()) {
      alert('Please enter a tournament name.');
      return;
    }

    if (tournaments.some(t => t.name.toLowerCase() === tournamentName.trim().toLowerCase())) {
      alert('A tournament with this name already exists.');
      return;
    }

    const entry = parseInt(entryCost);
    const rebuy = parseInt(rebuyCost);
    const mulligan = parseInt(mulliganCost);

    if (isNaN(entry) || entry < 0) {
      alert('Please enter a valid entry cost.');
      return;
    }
    if (isNaN(rebuy) || rebuy < 0) {
      alert('Please enter a valid rebuy cost.');
      return;
    }
    if (isNaN(mulligan) || mulligan < 0) {
      alert('Please enter a valid mulligan cost.');
      return;
    }

    try {
      setImporting(true);
      
      const newTournament = {
        name: tournamentName.trim(),
        entryCost: entry,
        rebuyCost: rebuy,
        mulliganCost: mulligan
      };

      await addTournament(newTournament);
      console.log('✅ Tournament created successfully');
      
      console.log('📁 Now uploading file to tournament...');
      
      const result = await uploadPlayersFile(tournamentName.trim(), selectedFile);
      
      let message = `Tournament "${newTournament.name}" created successfully!\n\n`;
      message += `Player upload: ${result.recordsInserted} out of ${result.totalRows} records processed.`;
      
      if (result.errorCount > 0) {
        message += `\n\n${result.errorCount} rows had errors and were skipped.`;
        if (result.errors && result.errors.length > 0) {
          message += '\n\nFirst few errors:';
          result.errors.forEach(error => {
            message += `\n• ${error}`;
          });
          if (result.hasMoreErrors) {
            message += '\n• ...and more';
          }
        }
      }
      
      alert(message);
      
      setTournamentName('');
      setEntryCost('500');
      setRebuyCost('500');
      setMulliganCost('100');
      setFileUploaded(false);
      setUploadedFileName('');
      setSelectedFile(null);
      
      onBack();
      
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!allowedTypes.includes(fileExtension)) {
        alert('Please select a valid CSV or Excel file (.csv, .xlsx, .xls).');
        return;
      }

      setSelectedFile(file);
      setUploadedFileName(file.name);
      setFileUploaded(true);
    }
  };

  const isFormValid = tournamentName.trim() && selectedFile && !importing;

  return (
    <div className="container">
      <button
        onClick={onBack}
        className="link-back link-back-block"
      >
        {'<'} Back to Event Selection
      </button>

      <h1 className="page-title">Add Custom Tournament</h1>

      {loading && (
        <div className="alert alert-info" style={{ backgroundColor: '#f8f9fa', color: '#6c757d', border: '1px solid #dee2e6' }}>
          Loading tournaments data...
        </div>
      )}

      <div className="form-group">
        <label className="mb-2">Tournament Name</label>
        <input
          type="text"
          value={tournamentName}
          onChange={(e) => setTournamentName(UC(e.target.value))}
          className="input-field"
          placeholder="Enter tournament name"
          disabled={importing}
          required
        />
      </div>

      <div className="form-group">
        <label className="mb-2">Cost of Entry</label>
        <input
          type="number"
          value={entryCost}
          onChange={(e) => setEntryCost(e.target.value)}
          className="input-field"
          placeholder="500"
          disabled={importing}
          required
        />
      </div>

      <div className="form-group">
        <label className="mb-2">Cost of Rebuys</label>
        <input
          type="number"
          value={rebuyCost}
          onChange={(e) => setRebuyCost(e.target.value)}
          className="input-field"
          placeholder="500"
          disabled={importing}
          required
        />
      </div>

      <div className="form-group">
        <label className="mb-2">Cost of Mulligans</label>
        <input
          type="number"
          value={mulliganCost}
          onChange={(e) => setMulliganCost(e.target.value)}
          className="input-field"
          placeholder="100"
          disabled={importing}
          required
        />
      </div>

      <div className="form-group">
        <label className="mb-2">
          Import Master Player Data
        </label>
        <div 
          style={{ 
            border: selectedFile ? '2px solid #8b0000' : '2px solid #666666', 
            borderRadius: '4px', 
            padding: '32px', 
            textAlign: 'center', 
            marginBottom: '24px',
            backgroundColor: selectedFile ? '#f8f9fa' : '#f5f5f5'
          }}
        >
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={importing}
            required
          />
          
          {importing ? (
            <div>
              <div 
                style={{ 
                  display: 'inline-block', 
                  width: '48px', 
                  height: '48px', 
                  border: '4px solid #CCCCCC', 
                  borderTop: '4px solid #8b0000', 
                  borderRadius: '50%', 
                  animation: 'spin 1s linear infinite',
                  marginBottom: '16px'
                }}
              ></div>
              <p className="tournament-name" style={{ margin: 0 }}>
                Creating tournament and uploading players...
              </p>
              <p className="tournament-metadata" style={{ margin: 0 }}>
                Please wait, this may take a while for large files
              </p>
            </div>
          ) : (
            <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '3rem' }}>📁</div>
              {fileUploaded ? (
                <>
                  <p className="tournament-name" style={{ margin: 0, color: '#8b0000' }}>
                    ✓ File selected
                  </p>
                  <p className="tournament-metadata" style={{ margin: 0 }}>
                    {uploadedFileName}
                  </p>
                  <p className="tournament-metadata" style={{ margin: '8px 0 0 0' }}>
                    File will be uploaded when tournament is created
                  </p>
                </>
              ) : (
                <>
                  <p className="tournament-name" style={{ margin: 0, color: '#666666' }}>
                    Click to select CSV or Excel file (Required)
                  </p>
                  <p className="tournament-metadata" style={{ margin: 0 }}>
                    Player data for this tournament
                  </p>
                </>
              )}
            </label>
          )}
        </div>
      </div>

      <button
        onClick={handleAddTournament}
        className={`btn ${isFormValid ? 'btn-success' : 'btn-secondary'}`}
        disabled={!isFormValid}
        style={{
          opacity: isFormValid ? 1 : 0.6,
          cursor: isFormValid ? 'pointer' : 'not-allowed'
        }}
      >
        {importing ? 'Creating Tournament...' : 'Create Tournament'}
      </button>
    </div>
  );
};

export default AddTournamentPage;