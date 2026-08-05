import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Users, UserPlus, Stethoscope, Calendar, Clock, ArrowRight, DollarSign, UserCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';
  const isDoctor = user?.role === 'ROLE_DOCTOR' || user?.role === 'DOCTOR';
  const canViewServedGraph = isAdmin || isDoctor;

  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    pendingRequests: 0,
    todayVisited: 0,
    todayIncome: 0,
  });

  const [comparisonStats, setComparisonStats] = useState(null);

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

        if (canViewServedGraph) {
          const compRes = await api.get('/appointments/served-comparison-stats');
          setComparisonStats(compRes.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats', err);
      }
    };

    fetchStats();
  }, [canViewServedGraph]);

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
            <div className="stat-value">৳{(stats.todayIncome || 0).toFixed(2)}</div>
            <div className="stat-label">Visiting Fees</div>
          </div>
        </div>
      </div>

      {/* Patient Served Comparison Graph (Restricted to Admin & Doctor) */}
      {canViewServedGraph && comparisonStats && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--primary)" />
                <span>Patient Served Comparison</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Comparing patients served Today vs Yesterday vs Same Day Last Week
              </p>
            </div>
            <div>
              <span
                className="badge"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid rgba(59, 130, 246, 0.25)'
                }}
              >
                {isAdmin ? '🏥 Clinic-Wide (All Doctors)' : '👨‍⚕️ My Patients Only'}
              </span>
            </div>
          </div>

          {/* Bar Chart Visual */}
          {(() => {
            const lastWk = comparisonStats.sameDayLastWeekCount || 0;
            const yest = comparisonStats.yesterdayCount || 0;
            const tod = comparisonStats.todayCount || 0;

            const maxVal = Math.max(lastWk, yest, tod, 1);

            const bars = [
              {
                label: 'Same Day Last Wk',
                subLabel: comparisonStats.sameDayLastWeekDate || '',
                count: lastWk,
                gradient: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#3b82f6',
              },
              {
                label: 'Yesterday',
                subLabel: comparisonStats.yesterdayDate || '',
                count: yest,
                gradient: 'linear-gradient(180deg, #8b5cf6 0%, #6d28d9 100%)',
                color: '#8b5cf6',
              },
              {
                label: 'Today',
                subLabel: comparisonStats.todayDate || '',
                count: tod,
                gradient: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
                color: '#10b981',
              },
            ];

            return (
              <div style={{ marginTop: '16px' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '24px',
                    alignItems: 'flex-end',
                    height: '210px',
                    backgroundColor: 'var(--input-bg)',
                    padding: '24px 20px 16px 20px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {bars.map((bar, index) => {
                    const heightPercent = Math.max(12, Math.round((bar.count / maxVal) * 100));
                    return (
                      <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <div
                          style={{
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            color: bar.color,
                            marginBottom: '8px',
                          }}
                        >
                          {bar.count} Patients
                        </div>

                        <div
                          style={{
                            width: '100%',
                            maxWidth: '70px',
                            height: `${heightPercent}%`,
                            background: bar.gradient,
                            borderRadius: '8px 8px 0 0',
                            transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                        />

                        <div style={{ marginTop: '12px', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
                            {bar.label}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {bar.subLabel}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Pills */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Vs Yesterday</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: tod >= yest ? '#10b981' : '#ef4444' }}>
                      {tod >= yest ? `+${tod - yest}` : `${tod - yest}`} Patients
                    </div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Vs Same Day Last Week</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: tod >= lastWk ? '#10b981' : '#ef4444' }}>
                      {tod >= lastWk ? `+${tod - lastWk}` : `${tod - lastWk}`} Patients
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

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
