import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Activity, Lock, User as UserIcon, AlertCircle, Sun, Moon } from 'lucide-react';

export const Login = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  };

  const setQuickCreds = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ position: 'relative' }}>
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            padding: '6px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 600
          }}
        >
          {theme === 'light' ? <Moon size={14} color="#6366f1" /> : <Sun size={14} color="#f59e0b" />}
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>

        <div className="login-brand">
          <div className="login-logo">
            <Activity size={30} />
          </div>
          <h2>CarePulse</h2>
          <p>Clinic Management System Portal</p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '10px 14px', marginBottom: '18px', gap: '8px', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} disabled={submitting}>
            {submitting ? 'Authenticating...' : 'Login to System'}
          </button>
        </form>

        <div className="demo-credentials">
          <p style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>Click Demo Account to Test:</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setQuickCreds('admin', 'admin123')}>
              Admin
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setQuickCreds('doctor', 'doctor123')}>
              Doctor
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setQuickCreds('receptionist', 'rec123')}>
              Receptionist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
