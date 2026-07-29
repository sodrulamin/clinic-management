import React, { useContext } from 'react';
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
  LogOut
} from 'lucide-react';

const iconMap = {
  LayoutDashboard,
  Users,
  ShieldCheck,
  UserPlus,
  Stethoscope,
  Calendar,
  ClipboardList
};

export const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  const menus = user?.menus || [];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <Activity size={22} />
        </div>
        <div className="sidebar-logo-text">CarePulse</div>
      </div>

      <nav className="sidebar-nav">
        {menus.map((menu) => {
          const IconComponent = iconMap[menu.icon] || LayoutDashboard;
          return (
            <NavLink
              key={menu.id}
              to={menu.path}
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
          <div className="user-avatar">
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
  );
};
