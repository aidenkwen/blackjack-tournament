import React, { useState } from 'react';
import './Blackjack.css';
import { useTournaments, useTournamentPlayers, useRegistrations } from './hooks/useapidata';
import EventSelectionPage from './components/pages/EventSelectionPage';
import AddTournamentPage from './components/pages/AddTournamentPage';
import ManageTournamentsPage from './components/pages/ManageTournamentsPage';
import RegistrationPage from './components/pages/RegistrationPage';
import SeatingAssignmentPage from './components/pages/SeatingAssignmentPage';
import TablingManagement from './components/pages/TablingManagement';
import ExportPage from './components/pages/ExportPage';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

const App = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [employee, setEmployee] = useState('');
  const [lastRegisteredPlayer, setLastRegisteredPlayer] = useState(null);
  const [pendingRegistration, setPendingRegistration] = useState(null);
  
  const [globalDisabledTables, setGlobalDisabledTables] = useState({});
  
  const [lastActiveTab, setLastActiveTab] = useState('registration');
  const [lastSelectedRound, setLastSelectedRound] = useState('round1');
  const [lastSelectedTimeSlot, setLastSelectedTimeSlot] = useState(1);

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

  const exportBackup = () => toast.error('Backup endpoint not implemented.');
  const importBackup = (event) => {
    toast.error('Restore endpoint not implemented.');
    event.target.value = '';
  };
  const clearAllData = () => {
    const confirmed = window.confirm(
      'This will delete ALL tournaments, players, and registrations from the database. This cannot be undone. Are you sure?'
    );
    if (confirmed) toast.error('Clear All Data endpoint not implemented.');
  };

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
      <Toaster 
        position="top-center"
        toastOptions={{
          // Default options for ALL toasts
          style: {
            background: '#EEEEEE', // Light Grey for ALL toasts
            color: '#000000',     // Dark text for ALL toasts
            border: '1px solid rgba(0, 0, 0, 0.1)',
          },
          
          // You can still have specific durations without changing the style
          error: {
            duration: 4000,
            // FIX: Removed the style block from here
          },
          success: {
            duration: 2500,
            // FIX: Removed the style block from here
          }
        }}
      />
      
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
          activeTab={lastActiveTab}
          selectedRound={lastSelectedRound}
          selectedTimeSlot={lastSelectedTimeSlot}
          setActiveTab={setLastActiveTab}
          setSelectedRound={setLastSelectedRound}
          setSelectedTimeSlot={setLastSelectedTimeSlot}
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
          globalDisabledTables={globalDisabledTables}
          setGlobalDisabledTables={setGlobalDisabledTables}
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
        <TablingManagement
          selectedEvent={selectedEvent}
          tournaments={tournaments}
          registrations={registrations}
          setRegistrations={setRegistrations}
          globalDisabledTables={globalDisabledTables}
          setGlobalDisabledTables={setGlobalDisabledTables}
          onBack={() => setCurrentPage(1)}
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