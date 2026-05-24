import React, { useState } from 'react';

// API Base (Vite server handles proxy to port 5000 in dev)
const API_BASE = '';

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
    <div style={{ maxWidth: '420px', width: '100%', margin: '40px auto' }}>
      <div className="glass-card" style={{ padding: '40px 32px' }}>
        
        {/* Brand Shell */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="logo-icon" style={{ margin: '0 auto 12px auto', width: '36px', height: '36px', fontSize: '1.35rem' }}>M</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>MockMate</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {view === 'LOGIN' && 'Sign in to access your interview dashboard'}
            {view === 'REGISTER' && 'Create your account to start mock assessments'}
            {view === 'RESET_REQUEST' && 'Reset your candidate password'}
            {view === 'RESET_PASSWORD' && 'Enter your verification code and new password'}
          </p>
        </div>

        {/* Alert Dialog Boxes */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            color: 'var(--danger)',
            fontSize: '0.85rem',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            color: 'var(--success)',
            fontSize: '0.85rem',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            {success}
          </div>
        )}

        {/* =========================================
           VIEW: LOGIN FORM
           ========================================= */}
        {view === 'LOGIN' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <input
                type="email"
                id="login-email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" htmlFor="login-pass" style={{ margin: 0 }}>Password</label>
                <button 
                  type="button" 
                  onClick={() => switchView('RESET_REQUEST')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-pass"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '24px', color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <button 
                type="button" 
                onClick={() => switchView('REGISTER')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
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
              <input
                type="text"
                id="reg-name"
                className="form-input"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <input
                type="email"
                id="reg-email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-pass">Password</label>
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
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '24px', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => switchView('LOGIN')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
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
              <input
                type="email"
                id="reset-req-email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Requesting Reset...' : 'Get Verification Code'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '24px' }}>
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
              <input
                type="email"
                id="reset-email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-code">Verification Code</label>
              <input
                type="text"
                id="reset-code"
                className="form-input"
                placeholder="e.g. MOCK123"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-new-pass">New Password</label>
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
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.85rem', marginTop: '24px' }}>
              <button 
                type="button" 
                onClick={() => switchView('LOGIN')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none' }}
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
