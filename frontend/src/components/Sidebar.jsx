import React, { useContext, useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  UserPlus,
  Stethoscope,
  Calendar,
  ClipboardList,
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const iconMap = {
  LayoutDashboard,
  Users,
  ShieldCheck,
  UserPlus,
  Stethoscope,
  Calendar,
  ClipboardList,
  Activity
};

const MIN_WIDTH = 72;
const MAX_WIDTH = 450;
const DEFAULT_EXPANDED_WIDTH = 260;
const COLLAPSE_THRESHOLD = 130;

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { user, logout } = useContext(AuthContext);

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar_width');
    return saved ? parseInt(saved, 10) : DEFAULT_EXPANDED_WIDTH;
  });

  const [lastExpandedWidth, setLastExpandedWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar_last_expanded_width');
    return saved ? parseInt(saved, 10) : DEFAULT_EXPANDED_WIDTH;
  });

  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);

  const isCollapsed = sidebarWidth <= COLLAPSE_THRESHOLD;

  useEffect(() => {
    localStorage.setItem('sidebar_width', String(sidebarWidth));
    if (sidebarWidth > COLLAPSE_THRESHOLD) {
      localStorage.setItem('sidebar_last_expanded_width', String(sidebarWidth));
      setLastExpandedWidth(sidebarWidth);
    }
  }, [sidebarWidth]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      let newWidth = e.clientX;
      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        isDraggingRef.current = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleDoubleClickEdge = () => {
    if (isCollapsed) {
      setSidebarWidth(lastExpandedWidth > COLLAPSE_THRESHOLD ? lastExpandedWidth : DEFAULT_EXPANDED_WIDTH);
    } else {
      setSidebarWidth(MIN_WIDTH);
    }
  };

  const toggleSidebar = () => {
    if (isCollapsed) {
      setSidebarWidth(lastExpandedWidth > COLLAPSE_THRESHOLD ? lastExpandedWidth : DEFAULT_EXPANDED_WIDTH);
    } else {
      setSidebarWidth(MIN_WIDTH);
    }
  };

  const menus = user?.menus || [];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isDragging ? 'is-dragging' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Resizer Handle Edge */}
        <div
          className="sidebar-resizer"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClickEdge}
          title="Drag to adjust width | Double click edge to toggle minimize/maximize"
        />

        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            <div className="sidebar-logo-icon">
              <Activity size={22} />
            </div>
            <div className="sidebar-logo-text">CarePulse</div>
          </div>

          <button
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            title={isCollapsed ? 'Expand Sidebar' : 'Minimize Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menus.map((menu) => {
            const IconComponent = iconMap[menu.icon] || LayoutDashboard;
            return (
              <NavLink
                key={menu.id}
                to={menu.path}
                onClick={onCloseMobile}
                title={isCollapsed ? menu.title : ''}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <IconComponent size={19} />
                <span>{menu.title}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <div className="user-info">
            <div className="user-avatar" title={isCollapsed ? `${user?.fullName} (${user?.role?.replace('ROLE_', '')})` : ''}>
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-details">
              <h4>{user?.fullName}</h4>
              <span>{user?.role?.replace('ROLE_', '')}</span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
};
