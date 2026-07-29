import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { User, Bell, Sun, Moon } from 'lucide-react';

export const Navbar = ({ title }) => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <header className="header-navbar">
      <div className="header-title">
        <h2>{title}</h2>
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            padding: '8px 14px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease'
          }}
        >
          {theme === 'light' ? (
            <>
              <Moon size={16} color="#6366f1" />
              <span>Dark Mode</span>
            </>
          ) : (
            <>
              <Sun size={16} color="#f59e0b" />
              <span>Light Mode</span>
            </>
          )}
        </button>

        <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bell size={18} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
          <User size={18} color="var(--primary)" />
          <span>{user?.username}</span>
        </div>
      </div>
    </header>
  );
};
