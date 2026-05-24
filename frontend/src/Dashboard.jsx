import React, { useState } from 'react';

export default function Dashboard({ 
  startNewInterview, 
  historyList, 
  onSelectHistoryItem, 
  loading,
  dbConnected,
  geminiActive
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Frontend Engineer');
  const [customRole, setCustomRole] = useState('');
  const [resumeText, setResumeText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const finalRole = role === 'Other' ? customRole.trim() : role;
    if (!finalRole) return;

    startNewInterview(name.trim(), finalRole, resumeText.trim());
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }) + ' ' + date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-grid">
      {/* Starting Card Form */}
      <div className="glass-card start-interview-card">
        <h2>Start Mock Interview</h2>
        <p className="subtitle" style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Enter your details and let MockMate conduct a professional, adaptive technical interview.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="candidate-name">Candidate Name</label>
            <input 
              type="text" 
              id="candidate-name" 
              className="form-input" 
              placeholder="e.g. John Doe"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="target-role">Target Role</label>
            <select 
              id="target-role" 
              className="form-select"
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="Frontend Engineer">Frontend Engineer</option>
              <option value="Backend Engineer">Backend Engineer</option>
              <option value="Fullstack Engineer">Fullstack Engineer</option>
              <option value="Data Scientist">Data Scientist</option>
              <option value="Product Manager">Product Manager</option>
              <option value="Other">Other (Custom Write-in)</option>
            </select>
          </div>

          {role === 'Other' && (
            <div className="form-group">
              <label className="form-label" htmlFor="custom-role">Enter Custom Role</label>
              <input 
                type="text" 
                id="custom-role" 
                className="form-input" 
                placeholder="e.g. DevOps Engineer"
                value={customRole} 
                onChange={(e) => setCustomRole(e.target.value)} 
                required
                disabled={loading}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="resume-text">
              Resume Summary / Experience Details (Optional)
            </label>
            <textarea 
              id="resume-text" 
              className="form-textarea" 
              placeholder="Paste parts of your resume, key skills, or a job description to make the interview highly relevant..."
              value={resumeText} 
              onChange={(e) => setResumeText(e.target.value)}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg width="20" height="20" viewBox="0 0 38 38" stroke="#fff" style={{ animation: 'orbLiquid 1s linear infinite' }}>
                  <g fill="none" fillRule="evenodd">
                    <g transform="translate(1 1)" strokeWidth="3">
                      <circle strokeOpacity=".2" cx="18" cy="18" r="18"/>
                      <path d="M36 18c0-9.94-8.06-18-18-18" />
                    </g>
                  </g>
                </svg>
                Assembling Interviewer...
              </>
            ) : (
              <>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Begin Assessment
              </>
            )}
          </button>
        </form>
      </div>

      {/* History Card list */}
      <div className="glass-card history-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2>Interview History</h2>
        
        {!dbConnected && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '10px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '0.85rem',
            color: '#fcd34d',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Operating in Offline In-Memory Storage Mode. History will clear on server restart.
          </div>
        )}

        <div className="history-list">
          {historyList && historyList.length > 0 ? (
            historyList.map((item) => (
              <div 
                key={item._id} 
                className="history-item"
                onClick={() => onSelectHistoryItem(item)}
              >
                <div className="history-info">
                  <h4>{item.candidateName}</h4>
                  <div className="history-meta">
                    <span style={{ color: 'var(--primary)' }}>{item.targetRole}</span>
                    <span>•</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      background: item.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                      color: item.status === 'Completed' ? 'var(--success)' : 'var(--primary)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      border: `1px solid ${item.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)'}`
                    }}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {item.evaluation ? (
                  <div className="history-score">
                    <span className="score-badge">{item.evaluation.overallScore}</span>
                    <span className="score-label">OVERALL</span>
                  </div>
                ) : (
                  <div className="history-score" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Pending
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-history">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ opacity: 0.3, marginBottom: '12px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p>No previous interviews found.</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Your completed assessments will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
