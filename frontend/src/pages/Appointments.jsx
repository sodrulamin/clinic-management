import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Calendar, Plus, X, Trash2, CheckCircle, XCircle, Stethoscope, DollarSign, UserCheck } from 'lucide-react';

export const Appointments = () => {
  const { user } = useContext(AuthContext);
  const isDoctor = user?.role === 'ROLE_DOCTOR';

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    todayVisited: 0,
    todayIncome: 0,
  });
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    doctorId: '',
    patientId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const fetchData = async () => {
    try {
      let appUrl = '/appointments';
      let statsUrl = '/appointments/stats';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (!startDate && !endDate) params.append('allDates', 'true');

      if (params.toString()) {
        appUrl += `?${params.toString()}`;
        statsUrl += `?${params.toString()}`;
      }

      const [appRes, docRes, patRes, statsRes] = await Promise.all([
        api.get(appUrl),
        api.get('/doctors'),
        api.get('/patients'),
        api.get(statsUrl),
      ]);
      setAppointments(appRes.data);
      setDoctors(docRes.data);
      setPatients(patRes.data);
      if (statsRes.data) {
        setStats(statsRes.data);
      }

      if (docRes.data.length > 0 && !formData.doctorId) formData.doctorId = docRes.data[0].id;
      if (patRes.data.length > 0 && !formData.patientId) formData.patientId = patRes.data[0].id;
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to schedule appointment';
      alert(msg);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status?status=${status}`);
      fetchData();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Cancel and delete appointment?')) {
      try {
        await api.delete(`/appointments/${id}`);
        fetchData();
      } catch (err) {
        alert('Failed to delete appointment');
      }
    }
  };

  return (
    <div>
      {/* Metrics & Income Summary Bar */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon teal">
            <Calendar />
          </div>
          <div>
            <div className="stat-value">{stats.todayAppointments}</div>
            <div className="stat-label">
              {!startDate && !endDate ? "Total Appointments" : (startDate === endDate ? "Appointments Today" : "Appointments in Range")}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <UserCheck />
          </div>
          <div>
            <div className="stat-value">{stats.todayVisited}</div>
            <div className="stat-label">
              {!startDate && !endDate ? "Total Patients Served" : (startDate === endDate ? "Patients Served Today" : "Patients Served in Range")}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <DollarSign />
          </div>
          <div>
            <div className="stat-value">৳{(stats.todayIncome || 0).toFixed(2)}</div>
            <div className="stat-label">
              {isDoctor
                ? (!startDate && !endDate ? "Total Income" : (startDate === endDate ? "Today's Income" : "Income in Range"))
                : (!startDate && !endDate ? "Total Clinic Income" : (startDate === endDate ? "Clinic Income Today" : "Clinic Income in Range"))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="card-title">Scheduled Appointments</div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', backgroundColor: 'var(--bg-muted, rgba(0,0,0,0.03))', padding: '4px 10px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>From:</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto', padding: '4px 8px', fontSize: '0.82rem' }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>To:</label>
                <input
                  type="date"
                  className="form-input"
                  style={{ width: 'auto', padding: '4px 8px', fontSize: '0.82rem' }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              {(startDate || endDate) && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setStartDate(''); setEndDate(''); }}
                  style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                >
                  All Dates
                </button>
              )}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            <span>Book New Appointment</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date & Time Slot</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Fee</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((app) => (
                <tr key={app.id}>
                  <td>
                    <strong>{app.appointmentDate}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.timeSlot}</div>
                  </td>
                  <td>
                    <strong>{app.patient?.fullName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.patient?.phone}</div>
                  </td>
                  <td>
                    <strong>{app.doctor?.fullName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.doctor?.specialization}</div>
                  </td>
                  <td>
                    <strong>৳{app.doctor?.consultationFee ? app.doctor.consultationFee.toFixed(2) : '0.00'}</strong>
                  </td>
                  <td>{app.reason || '-'}</td>
                  <td>
                    {app.status === 'SCHEDULED' && <span className="badge badge-info">Scheduled</span>}
                    {app.status === 'VISITED' && <span className="badge badge-success">Visited (Served)</span>}
                    {app.status === 'COMPLETED' && <span className="badge badge-success">Completed</span>}
                    {app.status === 'CANCELLED' && <span className="badge badge-danger">Cancelled</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {app.status === 'SCHEDULED' && (
                        <>
                          <button
                            className="btn btn-primary btn-sm"
                            title="Serve Patient"
                            onClick={() => handleUpdateStatus(app.id, 'VISITED')}
                          >
                            <Stethoscope size={14} />
                            <span>Serve Patient</span>
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Mark Cancelled"
                            onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}
                          >
                            <XCircle size={14} color="#ef4444" />
                          </button>
                        </>
                      )}
                      {app.status === 'VISITED' && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Fee Credited
                        </span>
                      )}
                      {!isDoctor && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(app.id)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Book Appointment</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Patient</label>
                <select
                  className="form-select"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Doctor</label>
                <select
                  className="form-select"
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} - {d.specialization} (৳{d.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Appointment Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Consultation Details</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
