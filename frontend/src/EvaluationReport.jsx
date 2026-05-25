import React from 'react';

/**
 * A lightweight, highly robust, pure JS Markdown parser to format AI feedback
 * safely without requiring bulky external dependencies.
 */
function renderFeedbackMarkdown(text) {
  if (!text) return null;

  // Split text into lines
  const lines = text.split('\n');
  let result = [];
  let inList = false;
  let listItems = [];

  const flushList = (key) => {
    if (listItems.length > 0) {
      result.push(<ul key={`list-${key}`}>{listItems}</ul>);
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    let cleanLine = line.trim();

    // 1. Headers (### or ## or #)
    if (cleanLine.startsWith('###')) {
      flushList(index);
      const headerText = cleanLine.substring(3).trim();
      result.push(<h3 key={`h3-${index}`}>{parseInlineStyles(headerText)}</h3>);
    } else if (cleanLine.startsWith('##')) {
      flushList(index);
      const headerText = cleanLine.substring(2).trim();
      result.push(<h3 key={`h2-${index}`} style={{ fontSize: '1.25rem', marginTop: '20px' }}>{parseInlineStyles(headerText)}</h3>);
    } else if (cleanLine.startsWith('#')) {
      flushList(index);
      const headerText = cleanLine.substring(1).trim();
      result.push(<h2 key={`h1-${index}`} style={{ fontSize: '1.4rem', marginTop: '24px' }}>{parseInlineStyles(headerText)}</h2>);
    } 
    // 2. Unordered lists (* or -)
    else if (cleanLine.startsWith('*') || cleanLine.startsWith('-')) {
      inList = true;
      const bulletText = cleanLine.substring(1).trim();
      listItems.push(<li key={`li-${index}`}>{parseInlineStyles(bulletText)}</li>);
    } 
    // 3. Numbered lists (e.g. 1.)
    else if (/^\d+\./.test(cleanLine)) {
      flushList(index);
      // Let standard paragraphs handle it but styled neatly
      result.push(<p key={`num-${index}`} style={{ marginLeft: '10px' }}>{parseInlineStyles(cleanLine)}</p>);
    }
    // 4. Regular text paragraphs
    else {
      if (cleanLine === '') {
        flushList(index);
      } else {
        if (inList) {
          // If we had a list, flush it first
          flushList(index);
        }
        result.push(<p key={`p-${index}`}>{parseInlineStyles(cleanLine)}</p>);
      }
    }
  });

  // Final flush for remaining list items
  flushList('final');

  return <div className="feedback-markdown">{result}</div>;
}

/**
 * Replaces **bold** text with <strong> tags inline
 */
function parseInlineStyles(text) {
  const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
  if (parts.length === 1) return text;
  
  return parts.map((part, index) => {
    // Every odd item was surrounded by **
    if (index % 2 === 1) {
      return <strong key={index} style={{ color: '#fff', fontWeight: '700' }}>{part}</strong>;
    }
    return part;
  });
}

export default function EvaluationReport({ activeInterview, onBackToDashboard }) {
  if (!activeInterview || !activeInterview.evaluation) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
        <p>No evaluation data available. Return to Dashboard.</p>
        <button className="btn btn-primary" onClick={onBackToDashboard} style={{ marginTop: '20px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { evaluation, candidateName, targetRole } = activeInterview;
  const { overallScore, technicalAccuracy, communicationSkill, strengths, detailedFeedback } = evaluation;

  return (
    <div>
      {/* Overview Title Banner */}
      <div className="evaluation-header">
        <span style={{ 
          fontSize: '0.8rem', 
          background: 'rgba(6, 182, 212, 0.1)', 
          color: 'var(--secondary)', 
          padding: '6px 16px', 
          borderRadius: '20px',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: 600
        }}>
          Assessment Report Card
        </span>
        <h1 style={{ marginTop: '12px' }}>{candidateName}'s Interview Evaluation</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Target Position: <strong style={{ color: 'var(--primary)' }}>{targetRole}</strong>
        </p>
      </div>

      <div className="evaluation-grid">
        {/* Left scoring dial and core indicators */}
        <div className="score-cards-panel">
          {/* Radial score card */}
          <div className="glass-card radial-score-container">
            <div 
              className="circular-progress" 
              style={{ '--score': overallScore }}
            >
              <div className="circular-progress-val">
                {overallScore}<span>%</span>
              </div>
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>Overall Score</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Based on adaptive AI tech grading criteria
            </p>
          </div>

          {/* Subscores card */}
          <div className="glass-card linear-scores">
            <h3 style={{ fontSize: '1.15rem', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Metric Breakdown
            </h3>
            
            {/* Technical score */}
            <div className="linear-score-item">
              <div className="score-meta">
                <span>Technical Depth</span>
                <span style={{ color: 'var(--primary)' }}>{technicalAccuracy}%</span>
              </div>
              <div className="score-slider-bg">
                <div 
                  className="score-slider-fill" 
                  style={{ width: `${technicalAccuracy}%`, background: 'var(--primary)' }}
                ></div>
              </div>
            </div>

            {/* Communication score */}
            <div className="linear-score-item">
              <div className="score-meta">
                <span>Communication & Articulation</span>
                <span style={{ color: 'var(--secondary)' }}>{communicationSkill}%</span>
              </div>
              <div className="score-slider-bg">
                <div 
                  className="score-slider-fill" 
                  style={{ width: `${communicationSkill}%`, background: 'var(--secondary)' }}
                ></div>
              </div>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={onBackToDashboard} style={{ width: '100%' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to Dashboard
          </button>
        </div>

        {/* Right feedback and dialogue log */}
        <div className="feedback-details">
          {/* Strengths card */}
          {strengths && strengths.length > 0 && (
            <div className="glass-card strengths-panel">
              <h3>Key Interview Strengths</h3>
              <div className="strengths-list">
                {strengths.map((str, idx) => (
                  <div key={idx} className="strength-item">
                    <span className="strength-icon">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Comprehensive feedback card */}
          <div className="glass-card feedback-text-card">
            <h3>Detailed Recruiter Evaluation</h3>
            {renderFeedbackMarkdown(detailedFeedback)}
          </div>

          {/* Full Dialogue Transcript review */}
          <div className="transcript-review-panel">
            <h3>Full Conversation Transcript</h3>
            <div className="transcript-review-list">
              {activeInterview.transcript && activeInterview.transcript.map((turn, index) => {
                const isAssistant = turn.role === 'assistant';
                return (
                  <div 
                    key={index} 
                    className="transcript-turn" 
                    style={{ 
                      border: isAssistant ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(6, 182, 212, 0.25)', 
                      boxShadow: isAssistant ? '0 4px 20px rgba(139, 92, 246, 0.05)' : '0 4px 20px rgba(6, 182, 212, 0.05)',
                      background: isAssistant ? 'rgba(139, 92, 246, 0.01)' : 'rgba(6, 182, 212, 0.01)',
                      animation: 'cardScaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
                      animationDelay: `${index * 0.05}s`
                    }}
                  >
                    <div 
                      className={`turn-header ${turn.role}`}
                      style={{
                        background: isAssistant ? 'rgba(139, 92, 246, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                        color: isAssistant ? 'var(--accent)' : 'var(--secondary)',
                        borderBottom: isAssistant ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(6, 182, 212, 0.2)',
                        padding: '12px 18px',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700
                      }}
                    >
                      <span>{isAssistant ? 'Interviewer (MockMate AI)' : 'Candidate (You)'}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                        {turn.timestamp ? new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="turn-content" style={{ padding: '18px 20px', fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.65' }}>
                      {turn.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
