import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Users, UserPlus, Stethoscope, Calendar, Clock, ArrowRight, DollarSign, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const isDoctor = user?.role === 'ROLE_DOCTOR';

  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    pendingRequests: 0,
    todayVisited: 0,
    todayIncome: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [patientsRes, doctorsRes, appointmentsRes, requestsRes] = await Promise.all([
          api.get('/patients'),
          api.get('/doctors'),
          api.get('/appointments/stats'),
          api.get('/appointment-requests?status=PENDING'),
        ]);

        setStats({
          patients: patientsRes.data.length || 0,
          doctors: doctorsRes.data.length || 0,
          appointments: appointmentsRes.data.todayAppointments || 0,
          pendingRequests: requestsRes.data.length || 0,
          todayVisited: appointmentsRes.data.todayVisited || 0,
          todayIncome: appointmentsRes.data.todayIncome || 0,
        });
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon teal">
            <UserPlus />
          </div>
          <div>
            <div className="stat-value">{stats.patients}</div>
            <div className="stat-label">Total Patients</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Stethoscope />
          </div>
          <div>
            <div className="stat-value">{stats.doctors}</div>
            <div className="stat-label">Active Doctors</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <UserCheck />
          </div>
          <div>
            <div className="stat-value">{stats.todayVisited}</div>
            <div className="stat-label">{isDoctor ? "Patients Served Today" : "Patients Visited Today"}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <DollarSign />
          </div>
          <div>
            <div className="stat-value">${(stats.todayIncome || 0).toFixed(2)}</div>
            <div className="stat-label">{isDoctor ? "Today's Income" : "Clinic Income Today"}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Quick Actions & Shortcuts</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <Link to="/patients" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px' }}>
            <span>Manage Patients</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/doctors" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px' }}>
            <span>Doctor Profiles</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/appointments" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px' }}>
            <span>Manage Appointments</span>
            <ArrowRight size={16} />
          </Link>
          <Link to="/appointment-requests" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px' }}>
            <span>Review Requests</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};
