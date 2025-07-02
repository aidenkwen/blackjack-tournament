import React, { useState } from 'react';
import { UC } from '../../utils/formatting';
import { useTournamentContext } from '../../context/TournamentContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AddTournamentPage = () => {
  const navigate = useNavigate();
  const { 
    tournaments, 
    addTournament, 
    uploadPlayersFile, 
    playersLoading 
  } = useTournamentContext();

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
      toast.error('Please enter a tournament name.');
      return;
    }
    if (tournaments.some(t => t.name.toLowerCase() === tournamentName.trim().toLowerCase())) {
      toast.error('A tournament with this name already exists.');
      return;
    }
    const entry = parseInt(entryCost);
    const rebuy = parseInt(rebuyCost);
    const mulligan = parseInt(mulliganCost);
    if (isNaN(entry) || entry < 0) {
      toast.error('Please enter a valid entry cost.');
      return;
    }
    if (isNaN(rebuy) || rebuy < 0) {
      toast.error('Please enter a valid rebuy cost.');
      return;
    }
    if (isNaN(mulligan) || mulligan < 0) {
      toast.error('Please enter a valid mulligan cost.');
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
      toast.success(`Tournament "${newTournament.name}" created!`);
      
      const result = await uploadPlayersFile(tournamentName.trim(), selectedFile);
      
      let message = `Player upload: ${result.recordsInserted} of ${result.totalRows} processed.`;
      if (result.errorCount > 0) message += `\n${result.errorCount} rows had errors.`;
      toast.success(message, { duration: 5000 });
      
      navigate('/');
      
    } catch (error) {
      toast.error(`Error: ${error.message}`);
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
        toast.error('Please select a valid CSV or Excel file.');
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
        onClick={() => navigate('/')}
        className="link-back link-back-block"
      >
        {'<'} Back to Event Selection
      </button>

      <h1 className="page-title">Add Custom Tournament</h1>

      {playersLoading && (
        <div className="alert alert-info">Loading...</div>
      )}

      {/* Form elements remain the same */}
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
      >
        {importing ? 'Creating Tournament...' : 'Create Tournament'}
      </button>
    </div>
  );
};

export default AddTournamentPage;