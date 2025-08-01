// Deployment: 2024-08-01 22:45 - Seating persistence fix included
import React from 'react';
import './Blackjack.css';
import { Routes, Route } from 'react-router-dom';
import { useTournamentContext } from './context/TournamentContext';

// Import Page Components
import EventSelectionPage from './components/pages/EventSelectionPage';
import AddTournamentPage from './components/pages/AddTournamentPage';
import ManageTournamentsPage from './components/pages/ManageTournamentsPage';
import RegistrationPage from './components/pages/RegistrationPage';
import SeatingAssignmentPage from './components/pages/SeatingAssignmentPage';
import TablingManagement from './components/pages/TablingManagement';
import ExportPage from './components/pages/ExportPage';
import RealtimeStatus from './components/common/RealtimeStatus';
import { Toaster } from 'react-hot-toast';

// Debug environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('REACT_APP_SUPABASE_ANON_KEY exists:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Yes' : 'No');

// FIXED: Add Error Boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container">
          <div className="alert alert-error" style={{ marginTop: '40px' }}>
            <h3>Something went wrong</h3>
            <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
            <details style={{ marginTop: '16px', fontSize: '0.9rem', color: '#666' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Error Details</summary>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px', 
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {this.state.error?.stack || 'No stack trace available'}
              </pre>
            </details>
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="btn btn-primary"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  // Get only what's needed for error checking from the context
  const { tournamentsError, playersError, registrationsError } = useTournamentContext();

  // FIXED: Better error handling with more detailed error messages
  const hasApiError = tournamentsError || playersError || registrationsError;
  const errorMessage = tournamentsError || playersError || registrationsError;

  if (hasApiError) {
    return (
      <div className="container">
        <div className="alert alert-error" style={{ marginTop: '40px' }}>
          <h3>Storage Error</h3>
          <p>{errorMessage}</p>
          <p>This might be due to:</p>
          <ul style={{ textAlign: 'left', marginTop: '8px' }}>
            <li>Browser storage being full</li>
            <li>Private browsing mode restrictions</li>
            <li>Browser security settings</li>
          </ul>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => {
                try {
                  localStorage.clear();
                  window.location.reload();
                } catch (e) {
                  alert('Unable to clear storage. Please try refreshing the page.');
                }
              }} 
              className="btn btn-primary"
            >
              Clear Storage & Reload
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-secondary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
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
      
      {selectedEvent && <RealtimeStatus />}
      
      <Routes>
        <Route path="/" element={<EventSelectionPage />} />
        <Route path="/add-tournament" element={<AddTournamentPage />} />
        <Route path="/manage-tournaments" element={<ManageTournamentsPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/seating" element={<SeatingAssignmentPage />} />
        <Route path="/tabling" element={<TablingManagement />} />
        <Route path="/export" element={<ExportPage />} />
      </Routes>
    </ErrorBoundary>
  );
};

export default App;