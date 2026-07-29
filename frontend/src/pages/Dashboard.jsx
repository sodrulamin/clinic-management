import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, UserPlus, Stethoscope, Calendar, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    pendingRequests: 0,
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
            <Calendar />
          </div>
          <div>
            <div className="stat-value">{stats.appointments}</div>
            <div className="stat-label">Appointments Today</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <Clock />
          </div>
          <div>
            <div className="stat-value">{stats.pendingRequests}</div>
            <div className="stat-label">Pending Requests</div>
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
            <span>Book Appointment</span>
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
