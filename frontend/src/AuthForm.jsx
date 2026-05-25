import React, { useState } from 'react';

// API Base (Vite server handles proxy to port 5000 in dev; Vercel loads dynamic API base URL)
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function AuthForm({ onAuthSuccess }) {
  // Views: 'LOGIN' | 'REGISTER' | 'RESET_REQUEST' | 'RESET_PASSWORD'
  const [view, setView] = useState('LOGIN');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Helper: Switch views and clean states
  const switchView = (targetView) => {
    setView(targetView);
    setError('');
    setSuccess('');
    setPassword('');
    setNewPassword('');
  };

  // 1. Handle Login Submit
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Save token and user details to App state
        onAuthSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Cannot connect to the authorization server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Register Submit
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (response.ok) {
        onAuthSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Registration failed. Email may already be in use.');
      }
    } catch (err) {
      setError('Cannot connect to the authorization server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Request Reset Submit
  const handleResetRequest = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Verification code generated: "${data.resetCode}". Use this code to update your password below.`);
        setResetCode(data.resetCode); // Pre-fill for developer convenience!
        // Automatically slide into the next password reset completion form after 4 seconds
        setTimeout(() => {
          setView('RESET_PASSWORD');
          setError('');
        }, 4000);
      } else {
        setError(data.error || 'No registered user was found with this email.');
      }
    } catch (err) {
      setError('Cannot connect to the authorization server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Reset Password Submit
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email || !resetCode || !newPassword) return;

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: resetCode, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password updated successfully! Redirecting you to Login...');
        setTimeout(() => {
          switchView('LOGIN');
        }, 2500);
      } else {
        setError(data.error || 'Failed to update password. Code may be invalid.');
      }
    } catch (err) {
      setError('Cannot connect to the authorization server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '420px', width: '100%', margin: '60px auto' }}>
      <div className="glass-card" style={{ padding: '48px 36px', boxShadow: '0 24px 64px rgba(0,0,0,0.8), 0 0 80px rgba(99, 102, 241, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06)' }}>
        
        {/* Brand Shell with Glowing Security Lock */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            margin: '0 auto 16px auto', 
            width: '54px', 
            height: '54px', 
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)',
            color: '#fff',
            animation: 'cardScaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both'
          }}>
            {view === 'LOGIN' || view === 'RESET_PASSWORD' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            ) : view === 'REGISTER' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6"></path>
                <path d="M21 13a9 9 0 1 1-3-7.7L21 8"></path>
              </svg>
            )}
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--font-heading)', background: 'linear-gradient(to right, #ffffff, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MockMate</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 500 }}>
            {view === 'LOGIN' && 'Sign in to access your interview dashboard'}
            {view === 'REGISTER' && 'Create your account to start mock assessments'}
            {view === 'RESET_REQUEST' && 'Reset your candidate password'}
            {view === 'RESET_PASSWORD' && 'Enter your verification code and new password'}
          </p>
        </div>

        {/* Alert Dialog Boxes */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: 'var(--danger)',
            fontSize: '0.82rem',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            color: 'var(--success)',
            fontSize: '0.82rem',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            lineHeight: '1.4',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* =========================================
           VIEW: LOGIN FORM
           ========================================= */}
        {view === 'LOGIN' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input
                  type="email"
                  id="login-email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" htmlFor="login-pass" style={{ margin: 0 }}>Password</label>
                <button 
                  type="button" 
                  onClick={() => switchView('RESET_REQUEST')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', outline: 'none', transition: 'color var(--transition-fast)' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-pass"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingLeft: '44px', paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--text-muted)', 
                    cursor: 'pointer', 
                    outline: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '28px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => switchView('REGISTER')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
              >
                Sign Up
              </button>
            </p>
          </form>
        )}

        {/* =========================================
           VIEW: REGISTER FORM
           ========================================= */}
        {view === 'REGISTER' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  type="text"
                  id="reg-name"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input
                  type="email"
                  id="reg-email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-pass">Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type="password"
                  id="reg-pass"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '28px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => switchView('LOGIN')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', outline: 'none' }}
              >
                Sign In
              </button>
            </p>
          </form>
        )}

        {/* =========================================
           VIEW: PASSWORD RESET REQUEST
           ========================================= */}
        {view === 'RESET_REQUEST' && (
          <form onSubmit={handleResetRequest}>
            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label" htmlFor="reset-req-email">Registered Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input
                  type="email"
                  id="reset-req-email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Requesting Reset...' : 'Get Verification Code'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '28px', fontWeight: 600 }}>
              <button 
                type="button" 
                onClick={() => switchView('LOGIN')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none' }}
              >
                Back to Sign In
              </button>
              
              <button 
                type="button" 
                onClick={() => switchView('RESET_PASSWORD')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', outline: 'none' }}
              >
                I have a Code
              </button>
            </div>
          </form>
        )}

        {/* =========================================
           VIEW: PASSWORD RESET EXECUTION
           ========================================= */}
        {view === 'RESET_PASSWORD' && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input
                  type="email"
                  id="reset-email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-code">Verification Code</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type="text"
                  id="reset-code"
                  className="form-input"
                  placeholder="e.g. MOCK123"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-new-pass">New Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type="password"
                  id="reset-new-pass"
                  className="form-input"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '28px' }}>
              <button 
                type="button" 
                onClick={() => switchView('LOGIN')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
              >
                Cancel and return to Sign In
              </button>
            </p>
          </form>
        )}

      </div>
    </div>
  );
}
