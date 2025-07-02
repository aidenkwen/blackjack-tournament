import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import { TournamentProvider } from './context/TournamentContext'; // Import our new Provider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <TournamentProvider>
        <App />
      </TournamentProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();