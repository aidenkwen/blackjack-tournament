import React from 'react';
import './Blackjack.css';
import { Routes, Route } from 'react-router-dom'; // Import routing components
import { useTournamentContext } from './context/TournamentContext'; // Import our hook

// Import Page Components
import EventSelectionPage from './components/pages/EventSelectionPage';
import AddTournamentPage from './components/pages/AddTournamentPage';
import ManageTournamentsPage from './components/pages/ManageTournamentsPage';
import RegistrationPage from './components/pages/RegistrationPage';
import SeatingAssignmentPage from './components/pages/SeatingAssignmentPage';
import TablingManagement from './components/pages/TablingManagement';
import ExportPage from './components/pages/ExportPage';
import { Toaster } from 'react-hot-toast';

const App = () => {
  // Get only what's needed for error checking from the context
  const { tournamentsError, playersError, registrationsError } = useTournamentContext();

  // Error boundary remains the same
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
          style: {
            background: '#EEEEEE',
            color: '#000000',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          },
          error: { duration: 4000 },
          success: { duration: 2500 },
        }}
      />
      
      {/* The old currentPage logic is replaced with declarative routing */}
      <Routes>
        <Route path="/" element={<EventSelectionPage />} />
        <Route path="/add-tournament" element={<AddTournamentPage />} />
        <Route path="/manage-tournaments" element={<ManageTournamentsPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/seating" element={<SeatingAssignmentPage />} />
        <Route path="/tabling" element={<TablingManagement />} />
        <Route path="/export" element={<ExportPage />} />
      </Routes>
    </>
  );
};

export default App;