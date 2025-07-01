import React, { useState } from 'react';
import './Blackjack.css';
import { useTournaments, useTournamentPlayers, useRegistrations } from './hooks/useapidata';
import EventSelectionPage from './components/pages/EventSelectionPage';
import AddTournamentPage from './components/pages/AddTournamentPage';
import ManageTournamentsPage from './components/pages/ManageTournamentsPage';
import RegistrationPage from './components/pages/RegistrationPage';
import SeatingAssignmentPage from './components/pages/SeatingAssignmentPage';
import TablingPage from './components/pages/TablingPage';
import ExportPage from './components/pages/ExportPage';

const App = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [employee, setEmployee] = useState('');
  const [lastRegisteredPlayer, setLastRegisteredPlayer] = useState(null);
  const [pendingRegistration, setPendingRegistration] = useState(null);
  
  // Global state for seating and table management
  const [globalDisabledTables, setGlobalDisabledTables] = useState({});
  
  // Tab persistence state
  const [lastActiveTab, setLastActiveTab] = useState('registration');
  const [lastSelectedRound, setLastSelectedRound] = useState('');
  const [lastSelectedTimeSlot, setLastSelectedTimeSlot] = useState('');

  // Your existing API hooks
  const { 
    tournaments, 
    loading: tournamentsLoading, 
    error: tournamentsError, 
    addTournament, 
    deleteTournament 
  } = useTournaments();

  const { 
    tournamentPlayers, 
    setTournamentPlayers,
    getCurrentTournamentPlayers, 
    setCurrentTournamentPlayers,
    uploadPlayersFile,
    loading: playersLoading,
    error: playersError 
  } = useTournamentPlayers(selectedEvent);

  const { 
    registrations, 
    setRegistrations,
    addRegistration,
    loading: registrationsLoading,
    error: registrationsError 
  } = useRegistrations(selectedEvent);

  // Your existing functions
  const exportBackup = () => alert('Database backup: Export SQL data or implement backup API endpoint');
  const importBackup = (event) => {
    alert('Database restore: Import SQL data or implement restore API endpoint');
    event.target.value = '';
  };
  const clearAllData = () => {
    const confirmed = window.confirm(
      'This will delete ALL tournaments, players, and registrations from the database. This cannot be undone. Are you sure?'
    );
    if (confirmed) alert('Database clear: Implement API endpoint to truncate all tables');
  };

  // Your existing error handling
  if (tournamentsError || playersError || registrationsError) {
    return (
      <div className="container">
        <div className="alert alert-error">
          <h3>Database Connection Error</h3>
          <p>{tournamentsError || playersError || registrationsError}</p>
          <p>Make sure your API server is running on http://localhost:3001</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">Retry Connection</button>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentPage === 0 && (
        <EventSelectionPage
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          employee={employee}
          setEmployee={setEmployee}
          tournaments={tournaments}
          loading={tournamentsLoading}
          onContinue={() => setCurrentPage(1)}
          onAddTournament={() => setCurrentPage(0.5)}
          onManageTournaments={() => setCurrentPage(0.6)}
          onExportBackup={exportBackup}
          onImportBackup={importBackup}
          onClearAllData={clearAllData}
        />
      )}
      {currentPage === 0.5 && (
        <AddTournamentPage
          tournaments={tournaments}
          addTournament={addTournament}
          masterData={getCurrentTournamentPlayers()}
          setMasterData={setCurrentTournamentPlayers}
          tournamentPlayers={tournamentPlayers}
          setTournamentPlayers={setTournamentPlayers}
          uploadPlayersFile={uploadPlayersFile}
          loading={playersLoading}
          onBack={() => setCurrentPage(0)}
        />
      )}
      {currentPage === 0.6 && (
        <ManageTournamentsPage
          tournaments={tournaments}
          deleteTournament={deleteTournament}
          selectedEvent={selectedEvent}
          registrations={registrations}
          setRegistrations={setRegistrations}
          globalDisabledTables={globalDisabledTables}
          setGlobalDisabledTables={setGlobalDisabledTables}
          onBack={() => setCurrentPage(0)}
        />
      )}
      {currentPage === 1 && (
        <RegistrationPage
          selectedEvent={selectedEvent}
          employee={employee}
          tournaments={tournaments}
          masterData={getCurrentTournamentPlayers()}
          setMasterData={setCurrentTournamentPlayers}
          registrations={registrations}
          setRegistrations={setRegistrations}
          addRegistration={addRegistration}
          setCurrentPage={setCurrentPage}
          setLastRegisteredPlayer={setLastRegisteredPlayer}
          pendingRegistration={pendingRegistration}
          setPendingRegistration={setPendingRegistration}
          loading={registrationsLoading}
          lastActiveTab={lastActiveTab}
          setLastActiveTab={setLastActiveTab}
          lastSelectedRound={lastSelectedRound}
          setLastSelectedRound={setLastSelectedRound}
          lastSelectedTimeSlot={lastSelectedTimeSlot}
          setLastSelectedTimeSlot={setLastSelectedTimeSlot}
        />
      )}
      {currentPage === 2 && (
        <SeatingAssignmentPage
          selectedEvent={selectedEvent}
          tournaments={tournaments}
          registrations={registrations}
          setRegistrations={setRegistrations}
          lastRegisteredPlayer={lastRegisteredPlayer}
          pendingRegistration={pendingRegistration}
          setPendingRegistration={setPendingRegistration}
          setCurrentPage={setCurrentPage}
          globalDisabledTables={globalDisabledTables}
          setGlobalDisabledTables={setGlobalDisabledTables}
        />
      )}
      {currentPage === 2.5 && (
        <TablingPage
          selectedEvent={selectedEvent}
          tournaments={tournaments}
          registrations={registrations}
          setRegistrations={setRegistrations}
          lastRegisteredPlayer={lastRegisteredPlayer}
          pendingRegistration={pendingRegistration}
          setCurrentPage={setCurrentPage}
          globalDisabledTables={globalDisabledTables}
          setGlobalDisabledTables={setGlobalDisabledTables}
        />
      )}
      {currentPage === 3 && (
        <ExportPage
          selectedEvent={selectedEvent}
          employee={employee}
          masterData={getCurrentTournamentPlayers()}
          registrations={registrations}
          setCurrentPage={setCurrentPage}
        />
      )}
    </>
  );
};

export default App;