import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { User, Bell, Sun, Moon, Menu } from 'lucide-react';

export const Navbar = ({ title, onToggleMobileSidebar }) => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <header className="header-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleMobileSidebar}
          title="Toggle Mobile Navigation Menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-title">
          <h2>{title}</h2>
        </div>
      </div>

      <div className="header-actions">
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
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
              <span className="hide-mobile-text">Dark Mode</span>
            </>
          ) : (
            <>
              <Sun size={16} color="#f59e0b" />
              <span className="hide-mobile-text">Light Mode</span>
            </>
          )}
        </button>

        <div className="header-icon-btn">
          <Bell size={18} />
        </div>

        <div className="header-user-pill">
          <User size={18} color="var(--primary)" />
          <span className="hide-mobile-text">{user?.username}</span>
        </div>
      </div>
    </header>
  );
};
