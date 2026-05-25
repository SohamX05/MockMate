import React, { useState, useEffect, useRef } from 'react';

export default function InterviewRoom({ 
  activeInterview, 
  submitAnswer, 
  loading,
  setLoading
}) {
  const [answer, setAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const lastQuestionRef = useRef('');

  // 1. Get current question index
  const getQuestionIndex = () => {
    if (!activeInterview || !activeInterview.transcript) return 0;
    return activeInterview.transcript.filter(t => t.role === 'assistant').length;
  };

  // 2. Get latest question text
  const getLatestQuestionText = () => {
    if (!activeInterview || !activeInterview.transcript) return '';
    const assistantTurns = activeInterview.transcript.filter(t => t.role === 'assistant');
    if (assistantTurns.length === 0) return '';
    const latest = assistantTurns[assistantTurns.length - 1].content;
    lastQuestionRef.current = latest;
    return latest;
  };

  const currentQuestionNumber = getQuestionIndex();
  const latestQuestion = getLatestQuestionText();

  // 3. Count Up Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 4. Web Speech API Initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript + ' ';
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        if (finalText) {
          setAnswer(prev => prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalText);
        }
        setInterimTranscript(interimText);
      };

      rec.onerror = (err) => {
        console.error("Speech Recognition error:", err.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
        setInterimTranscript('');
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // 5. Speech Toggle
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or type manually.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setInterimTranscript('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start speech recognition:", err.message);
      }
    }
  };

  // 6. Answer Submission
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!answer.trim() || loading) return;
    
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const submittedAnswer = answer.trim();
    setAnswer('');
    submitAnswer(submittedAnswer);
  };

  return (
    <div className="interview-layout">
      {/* Sidebar - Visual Status Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Sleek Interviewer Card */}
        <div className={`avatar-panel ${isRecording ? 'wave-active' : ''}`}>
          <div className="avatar-indicator-box" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.15))' }}>
            <div className="listening-pulse-dot"></div>
            {/* Elegant SVG outline for AI interviewer */}
            <svg className="minimal-avatar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div className="interviewer-info">
            <h3 style={{ fontFamily: 'var(--font-heading)' }}>MockMate Bot</h3>
            <span className="interviewer-role" style={{ color: isRecording ? 'var(--danger)' : 'var(--secondary)' }}>
              {isRecording ? 'Listening...' : 'Active Session'}
            </span>
          </div>
        </div>

        {/* Live CSS Audio frequency waveform visualizer */}
        <div className={`waveform-canvas ${isRecording ? 'wave-active' : ''}`} style={{ background: 'rgba(12, 13, 20, 0.4)', boxShadow: 'inset 0 0 12px rgba(0,0,0,0.4)' }}>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
          <div className="wave-bar"></div>
        </div>

        {/* Progress Display */}
        <div className="progress-container glass-card" style={{ padding: '24px' }}>
          <div className="progress-label">
            <span>Round Progress</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
              Q{Math.min(5, currentQuestionNumber)} / 5
            </span>
          </div>
          <div className="progress-bar-bg" style={{ height: '8px', borderRadius: '4px' }}>
            <div 
              className="progress-bar-fill" 
              style={{ width: `${(Math.min(5, currentQuestionNumber) / 5) * 100}%`, height: '100%', borderRadius: '4px' }}
            ></div>
          </div>
        </div>

        {/* Timer Card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div className="timer">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--secondary)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span style={{ fontSize: '0.85rem' }}>Time Elapsed: <strong style={{ color: '#fff' }}>{formatTime(secondsElapsed)}</strong></span>
          </div>
        </div>
      </div>

      {/* Main chat box */}
      <div className="chat-board">
        {/* Minimal Question box */}
        <div className="glass-card question-box" style={{ borderLeft: '4px solid var(--primary)', background: 'rgba(99, 102, 241, 0.02)' }}>
          <div className="question-header" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800 }}>Interviewer Question</div>
          <div className="question-text" style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 500 }}>
            {loading && !latestQuestion ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)' }}>
                <svg width="16" height="16" viewBox="0 0 38 38" stroke="var(--primary)" style={{ animation: 'orbLiquid 1s linear infinite' }}>
                  <g fill="none" fillRule="evenodd">
                    <g transform="translate(1 1)" strokeWidth="3">
                      <circle strokeOpacity=".2" cx="18" cy="18" r="18"/>
                      <path d="M36 18c0-9.94-8.06-18-18-18" />
                    </g>
                  </g>
                </svg>
                Structuring next scenario...
              </div>
            ) : (
              latestQuestion
            )}
          </div>
        </div>

        {/* Answer textarea box */}
        <div className="glass-card response-box">
          <div className="question-header" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)', fontWeight: 800 }}>Your Answer</div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-container">
              <textarea 
                className="form-textarea response-textarea"
                placeholder="Compose your structured technical answer here. You can also click the microphone to speak..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSubmit(e);
                  }
                }}
                disabled={loading}
                required
                style={{ fontSize: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', color: '#fff' }}
              />

              <button
                type="button"
                className={`mic-btn ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                disabled={loading}
                title={isRecording ? "Stop listening" : "Dictate response"}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isRecording ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  )}
                </svg>
              </button>
            </div>

            {/* Speaking voice overlay */}
            {isRecording && interimTranscript && (
              <div className="transcript-preview" style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px dashed rgba(239, 68, 68, 0.2)' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 700 }}>Speaking: </span>
                {interimTranscript}
              </div>
            )}

            {/* Floating Workspace Toolbar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: 'rgba(255, 255, 255, 0.02)', 
              padding: '12px 18px', 
              borderRadius: '8px', 
              border: '1px solid var(--border-color)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span>Words: <strong style={{ color: '#fff' }}>{answer.trim() ? answer.trim().split(/\s+/).filter(Boolean).length : 0}</strong></span>
                <span>Characters: <strong style={{ color: '#fff' }}>{answer.length}</strong></span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: 700, color: '#fff' }}>Ctrl + Enter</span>
                <span>to submit</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !answer.trim()}
                style={{ padding: '12px 28px' }}
              >
                {loading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 38 38" stroke="#fff" style={{ animation: 'orbLiquid 1s linear infinite' }}>
                      <g fill="none" fillRule="evenodd">
                        <g transform="translate(1 1)" strokeWidth="3">
                          <circle strokeOpacity=".2" cx="18" cy="18" r="18"/>
                          <path d="M36 18c0-9.94-8.06-18-18-18" />
                        </g>
                      </g>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Submit Answer
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
