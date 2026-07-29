import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { ShieldCheck, Save, CheckSquare, Square, CheckCircle } from 'lucide-react';

export const RoleMenus = () => {
  const [roles, setRoles] = useState([]);
  const [allMenus, setAllMenus] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [assignedMenuIds, setAssignedMenuIds] = useState([]);
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  const hideTimerRef = useRef(null);
  const clearTimerRef = useRef(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const [rolesRes, menusRes] = await Promise.all([
          api.get('/role-menus/roles'),
          api.get('/role-menus/menus'),
        ]);
        setRoles(rolesRes.data);
        setAllMenus(menusRes.data);

        if (rolesRes.data.length > 0) {
          selectRole(rolesRes.data[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    initData();

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const selectRole = async (role) => {
    setSelectedRole(role);
    setMessage('');
    setShowMessage(false);
    try {
      const res = await api.get(`/role-menus/role/${role.id}`);
      const menuIds = res.data.map((m) => m.id);
      setAssignedMenuIds(menuIds);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleMenuPermission = (menuId) => {
    if (assignedMenuIds.includes(menuId)) {
      setAssignedMenuIds(assignedMenuIds.filter((id) => id !== menuId));
    } else {
      setAssignedMenuIds([...assignedMenuIds, menuId]);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

    setMessage('');
    setShowMessage(false);

    try {
      await api.post('/role-menus/update', {
        roleId: selectedRole.id,
        menuIds: assignedMenuIds,
      });

      setMessage(`Permissions successfully updated for ${selectedRole.name.replace('ROLE_', '')}!`);
      setShowMessage(true);

      // Display Toast for 3 seconds, then 1 second transition fade out
      hideTimerRef.current = setTimeout(() => {
        setShowMessage(false); // Triggers 1s CSS opacity & translate fade-out
        clearTimerRef.current = setTimeout(() => {
          setMessage(''); // Clears Toast from DOM after 1s fade-out completes
        }, 1000);
      }, 3000);

    } catch (err) {
      alert('Failed to save role permissions');
    }
  };

  return (
    <div>
      {/* Toast Notification Container */}
      {message && (
        <div className="toast-container">
          <div className={`toast ${showMessage ? '' : 'hide'}`}>
            <div className="toast-icon">
              <CheckCircle size={20} />
            </div>
            <div>{message}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Role-Based Dynamic Menu Access</div>
          {selectedRole && (
            <button className="btn btn-primary" onClick={handleSavePermissions}>
              <Save size={16} />
              <span>Save</span>
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
          <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>Select Role</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectRole(r)}
                  className={`btn ${selectedRole?.id === r.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <ShieldCheck size={16} />
                  <span>{r.name.replace('ROLE_', '')}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase' }}>
              Configured Sidebar Menus for {selectedRole?.name.replace('ROLE_', '')}
            </h4>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Access</th>
                    <th>Menu Title</th>
                    <th>Path</th>
                    <th>Icon</th>
                  </tr>
                </thead>
                <tbody>
                  {allMenus.map((menu) => {
                    const isChecked = assignedMenuIds.includes(menu.id);
                    return (
                      <tr
                        key={menu.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleMenuPermission(menu.id)}
                      >
                        <td>
                          {isChecked ? (
                            <CheckSquare color="var(--primary)" size={20} />
                          ) : (
                            <Square color="var(--text-light)" size={20} />
                          )}
                        </td>
                        <td><strong>{menu.title}</strong></td>
                        <td><code>{menu.path}</code></td>
                        <td>{menu.icon}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
