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

      {/* Comparison Graphs Grid (Side-by-side on PC view, responsive on Mobile) */}
      {canViewServedGraph && comparisonStats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {/* Card 1: Patient Served */}
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header" style={{ paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} color="var(--primary)" />
                <span>Patient Served</span>
              </h3>
            </div>

            {(() => {
              const lastWk = comparisonStats.sameDayLastWeekCount || 0;
              const yest = comparisonStats.yesterdayCount || 0;
              const tod = comparisonStats.todayCount || 0;
              const maxVal = Math.max(lastWk, yest, tod, 1);

              const bars = [
                {
                  label: 'Last Wk',
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
                <div style={{ marginTop: '8px' }}>
                  <div
                    className="preserve-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '4px',
                      backgroundColor: 'var(--input-bg)',
                      padding: '16px 4px 12px 4px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {bars.map((bar, index) => {
                      const heightPercent = Math.max(12, Math.round((bar.count / maxVal) * 100));
                      return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: bar.color, marginBottom: '4px', whiteSpace: 'nowrap' }}>
                            {bar.count}
                          </div>

                          <div style={{ height: '100px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                            <div
                              style={{
                                width: '100%',
                                maxWidth: '40px',
                                height: `${heightPercent}%`,
                                minHeight: '8px',
                                background: bar.gradient,
                                borderRadius: '6px 6px 0 0',
                                transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                              }}
                            />
                          </div>

                          <div style={{ marginTop: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                              {bar.label}
                            </div>
                            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                              {bar.subLabel}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="preserve-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '10px' }}>
                    <div style={{ padding: '8px 6px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Vs Yesterday</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: tod >= yest ? '#10b981' : '#ef4444' }}>
                        {tod >= yest ? `+${tod - yest}` : `${tod - yest}`}
                      </div>
                    </div>
                    <div style={{ padding: '8px 6px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Vs Same Day Last Wk</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: tod >= lastWk ? '#10b981' : '#ef4444' }}>
                        {tod >= lastWk ? `+${tod - lastWk}` : `${tod - lastWk}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Card 2: Earnings */}
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header" style={{ paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={20} color="#f59e0b" />
                <span>Earnings</span>
              </h3>
            </div>

            {(() => {
              const lastWkFee = comparisonStats.sameDayLastWeekIncome || 0;
              const yestFee = comparisonStats.yesterdayIncome || 0;
              const todFee = comparisonStats.todayIncome || 0;
              const maxValFee = Math.max(lastWkFee, yestFee, todFee, 1);

              const feeBars = [
                {
                  label: 'Last Wk',
                  subLabel: comparisonStats.sameDayLastWeekDate || '',
                  amount: lastWkFee,
                  gradient: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)',
                  color: '#f59e0b',
                },
                {
                  label: 'Yesterday',
                  subLabel: comparisonStats.yesterdayDate || '',
                  amount: yestFee,
                  gradient: 'linear-gradient(180deg, #ec4899 0%, #be185d 100%)',
                  color: '#ec4899',
                },
                {
                  label: 'Today',
                  subLabel: comparisonStats.todayDate || '',
                  amount: todFee,
                  gradient: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
                  color: '#10b981',
                },
              ];

              return (
                <div style={{ marginTop: '8px' }}>
                  <div
                    className="preserve-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '4px',
                      backgroundColor: 'var(--input-bg)',
                      padding: '16px 4px 12px 4px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {feeBars.map((bar, index) => {
                      const heightPercent = Math.max(12, Math.round((bar.amount / maxValFee) * 100));
                      return (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: bar.color, marginBottom: '4px', whiteSpace: 'nowrap' }}>
                            ৳{bar.amount.toFixed(0)}
                          </div>

                          <div style={{ height: '100px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                            <div
                              style={{
                                width: '100%',
                                maxWidth: '40px',
                                height: `${heightPercent}%`,
                                minHeight: '8px',
                                background: bar.gradient,
                                borderRadius: '6px 6px 0 0',
                                transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                              }}
                            />
                          </div>

                          <div style={{ marginTop: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                              {bar.label}
                            </div>
                            <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                              {bar.subLabel}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="preserve-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '10px' }}>
                    <div style={{ padding: '8px 6px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Vs Yesterday</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: todFee >= yestFee ? '#10b981' : '#ef4444' }}>
                        {todFee >= yestFee ? `+৳${(todFee - yestFee).toFixed(0)}` : `-৳${Math.abs(todFee - yestFee).toFixed(0)}`}
                      </div>
                    </div>
                    <div style={{ padding: '8px 6px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Vs Same Day Last Wk</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: todFee >= lastWkFee ? '#10b981' : '#ef4444' }}>
                        {todFee >= lastWkFee ? `+৳${(todFee - lastWkFee).toFixed(0)}` : `-৳${Math.abs(todFee - lastWkFee).toFixed(0)}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
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
