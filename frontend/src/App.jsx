import React, { useState, useEffect } from 'react';
import AuthForm from './AuthForm';
import Dashboard from './Dashboard';
import InterviewRoom from './InterviewRoom';
import EvaluationReport from './EvaluationReport';

// API Base (Vite server handles proxy to port 5000 in dev)
const API_BASE = '';

export default function App() {
  // Authentication states
  const [token, setToken] = useState(localStorage.getItem('mockmate_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('mockmate_user') || 'null'));
  
  // Navigation & Interview states
  const [currentView, setCurrentView] = useState('DASHBOARD'); // 'DASHBOARD' | 'INTERVIEW' | 'EVALUATION'
  const [activeInterview, setActiveInterview] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  
  // Status indicators
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
      setBackendOnline(false);
    }
  };

  // 2. Fetch past interviews (Protected with Bearer Token!)
  const loadInterviewHistory = async (sessionToken = token) => {
    if (!sessionToken) return;
    try {
      const response = await fetch(`${API_BASE}/api/interviews`, {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistoryList(data.interviews || []);
      }
    } catch (error) {
      console.error("Failed to load interview history:", error.message);
    }
  };

  // Run status check and load history on load if authenticated
  useEffect(() => {
    checkBackendStatus();
    if (token) {
      loadInterviewHistory(token);
    }

    // Check status periodically
    const interval = setInterval(checkBackendStatus, 20000);
    return () => clearInterval(interval);
  }, [token]);

  // 3. Action: Auth success handler
  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('mockmate_token', newToken);
    localStorage.setItem('mockmate_user', JSON.stringify(newUser));
    loadInterviewHistory(newToken); // Instantly pull their history!
  };

  // 4. Action: Sign Out handler
  const handleLogout = () => {
    setToken('');
    setUser(null);
    setHistoryList([]);
    setActiveInterview(null);
    setCurrentView('DASHBOARD');
    localStorage.removeItem('mockmate_token');
    localStorage.removeItem('mockmate_user');
  };

  // 5. Action: Start a new mock assessment (Protected!)
  const startNewInterview = async (name, role, resume) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/interviews/start`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      alert("Error contacting the backend interviewer engine. Please ensure your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // 6. Action: Submit turn response (Protected!)
  const submitAnswer = async (answerText) => {
    if (!activeInterview || !token) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/interviews/${activeInterview._id}/respond`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ answer: answerText })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveInterview(data.interview);

        if (data.completed) {
          setCurrentView('EVALUATION');
          loadInterviewHistory(); // Reload history in background
        }
      } else {
        const errorData = await response.json();
        alert(`Error submitting answer: ${errorData.error || 'Server error'}`);
      }
    } catch (error) {
      alert("Network error: failed to submit answer to the backend.");
    } finally {
      setLoading(false);
    }
  };

  // 7. Action: Return to main dashboard
  const handleBackToDashboard = () => {
    setActiveInterview(null);
    setCurrentView('DASHBOARD');
    loadInterviewHistory();
  };

  // 8. Action: Select a completed item from history list
  const handleSelectHistoryItem = (item) => {
    setActiveInterview(item);
    if (item.status === 'Completed' && item.evaluation) {
      setCurrentView('EVALUATION');
    } else {
      setCurrentView('INTERVIEW');
    }
  };

  return (
    <div className="app-container">
      {/* Global Header */}
      <header className="app-header">
        <div className="logo-container" onClick={token ? handleBackToDashboard : undefined} style={{ cursor: token ? 'pointer' : 'default' }}>
          <div className="logo-icon">M</div>
          <div className="logo-text">MockMate</div>
        </div>

        {/* Engine status indicators */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Main backend connectivity */}
          <div className="header-status">
            <span className={`status-dot ${backendOnline ? '' : 'offline'}`}></span>
            <span>
              {backendOnline ? 'Interviewer Online' : 'Simulated Offline'}
            </span>
          </div>

          {/* Mapped DB indicators */}
          {backendOnline && (
            <div className="header-status">
              <span className={`status-dot ${dbConnected ? '' : 'offline'}`}></span>
              <span>{dbConnected ? 'Mongoose DB' : 'Local Memory'}</span>
            </div>
          )}

          {/* Gemini AI Status */}
          {backendOnline && (
            <div className="header-status">
              <span className={`status-dot ${geminiActive ? '' : 'offline'}`} style={{ backgroundColor: geminiActive ? 'var(--primary)' : 'var(--warning)' }}></span>
              <span>{geminiActive ? 'Gemini AI' : 'Simulation'}</span>
            </div>
          )}

          {/* Logged in User Profile welcome tag & logout */}
          {token && user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                Hello, {user.name.split(' ')[0]}
              </span>
              <button 
                onClick={handleLogout} 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px' }}
                title="Sign out of your session"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Primary Application Workspace */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!token ? (
          /* GATED AUTHENTICATION VIEW */
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        ) : (
          /* SECURED PORTAL VIEWS */
          <>
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
          </>
        )}
      </main>
      
      {/* Visual Footer */}
      <footer style={{ marginTop: '48px', padding: '24px 0', borderTop: '1px solid var(--border-color)', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        MockMate • MERN Engine Powered by Google Gemini AI © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
