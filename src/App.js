// src/App.js
import React, { useState } from 'react';
import Survey from './components/Survey';
import Dashboard from './components/Dashboard';
import './index.css';

export default function App() {
  const [view, setView] = useState('survey'); // 'survey' | 'dashboard'

  return (
    <>
      {view === 'survey' && (
        <Survey onShowDashboard={() => setView('dashboard')} />
      )}
      {view === 'dashboard' && (
        <Dashboard onShowSurvey={() => setView('survey')} />
      )}
    </>
  );
}
