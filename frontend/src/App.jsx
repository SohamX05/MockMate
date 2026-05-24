import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import InterviewRoom from './InterviewRoom';
import EvaluationReport from './EvaluationReport';

// Dynamic API Base detection for dev (Vite port 5173 -> Express port 5000) or production builds
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : '';

export default function App() {
  const [currentView, setCurrentView] = useState('DASHBOARD'); // 'DASHBOARD' | 'INTERVIEW' | 'EVALUATION'
  const [activeInterview, setActiveInterview] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  
  // Status check variables
  const [backendOnline, setBackendOnline] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [geminiActive, setGeminiActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Verify backend health and check capabilities
  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/status`);
      if (response.ok) {
        const data = await response.json();
        setBackendOnline(true);
        setDbConnected(data.dbConnected);
        setGeminiActive(data.geminiActive);
      } else {
        setBackendOnline(false);
      }
    } catch (error) {
      console.warn("Backend server not responding. Operating in simulated offline mode.");
      setBackendOnline(false);
    }
  };

  // 2. Fetch past interviews history list
  const loadInterviewHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/interviews`);
      if (response.ok) {
        const data = await response.json();
        setHistoryList(data.interviews || []);
      }
    } catch (error) {
      console.error("Failed to load interview history:", error.message);
    }
  };

  // Run status check and load history on load
  useEffect(() => {
    const initialize = async () => {
      await checkBackendStatus();
      loadInterviewHistory();
    };
    initialize();

    // Check status periodically
    const interval = setInterval(checkBackendStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // 3. Action: Start a new mock assessment
  const startNewInterview = async (name, role, resume) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/interviews/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          candidateName: name, 
          targetRole: role, 
          resumeText: resume 
        })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveInterview(data.interview);
        setCurrentView('INTERVIEW');
      } else {
        const errorData = await response.json();
        alert(`Failed to start interview: ${errorData.error || 'Server error'}`);
      }
    } catch (error) {
      alert("Error contacting the backend interviewer engine. Please ensure your Express backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  // 4. Action: Submit turn response (candidate answer)
  const submitAnswer = async (answerText) => {
    if (!activeInterview) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/interviews/${activeInterview._id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answerText })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveInterview(data.interview);

        if (data.completed) {
          // Completed & evaluated! Move to scorecard view
          setCurrentView('EVALUATION');
          loadInterviewHistory(); // Reload history in background
        }
      } else {
        const errorData = await response.json();
        alert(`Error submitting answer: ${errorData.error || 'Server error'}`);
      }
    } catch (error) {
      alert("Network error: failed to submit answer to the backend. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // 5. Action: Return to main dashboard
  const handleBackToDashboard = () => {
    setActiveInterview(null);
    setCurrentView('DASHBOARD');
    loadInterviewHistory(); // Refresh historical reviews
  };

  // 6. Action: Select a completed item from history list
  const handleSelectHistoryItem = (item) => {
    setActiveInterview(item);
    if (item.status === 'Completed' && item.evaluation) {
      setCurrentView('EVALUATION');
    } else {
      // If it is in-progress, let them continue!
      setCurrentView('INTERVIEW');
    }
  };

  return (
    <div className="app-container">
      {/* Global Brand Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">M</div>
          <div className="logo-text">MockMate</div>
        </div>

        {/* Engine status indicator display */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Main backend connectivity */}
          <div className="header-status">
            <span className={`status-dot ${backendOnline ? '' : 'offline'}`}></span>
            <span>
              {backendOnline ? 'Interviewer Online' : 'Interviewer Offline (Demo Mode)'}
            </span>
          </div>

          {/* Mapped DB indicators */}
          {backendOnline && (
            <div className="header-status">
              <span className={`status-dot ${dbConnected ? '' : 'offline'}`}></span>
              <span>{dbConnected ? 'Mongoose DB' : 'Local In-Memory'}</span>
            </div>
          )}

          {/* Gemini AI Status */}
          {backendOnline && (
            <div className="header-status">
              <span className={`status-dot ${geminiActive ? '' : 'offline'}`} style={{ backgroundColor: geminiActive ? 'var(--secondary)' : 'var(--warning)', boxShadow: `0 0 10px ${geminiActive ? 'var(--secondary)' : 'var(--warning)'}` }}></span>
              <span>{geminiActive ? 'Gemini AI' : 'Smart Simulation'}</span>
            </div>
          )}
        </div>
      </header>

      {/* Primary Application Workspace */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentView === 'DASHBOARD' && (
          <Dashboard 
            startNewInterview={startNewInterview}
            historyList={historyList}
            onSelectHistoryItem={handleSelectHistoryItem}
            loading={loading}
            dbConnected={dbConnected}
            geminiActive={geminiActive}
          />
        )}

        {currentView === 'INTERVIEW' && (
          <InterviewRoom 
            activeInterview={activeInterview}
            submitAnswer={submitAnswer}
            loading={loading}
            setLoading={setLoading}
          />
        )}

        {currentView === 'EVALUATION' && (
          <EvaluationReport 
            activeInterview={activeInterview}
            onBackToDashboard={handleBackToDashboard}
          />
        )}
      </main>
      
      {/* Visual Footer */}
      <footer style={{ marginTop: '40px', padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.03)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        MockMate • Premium Agentic Assessment Engine © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
