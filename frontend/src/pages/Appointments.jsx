import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Plus, X, Trash2, CheckCircle, XCircle } from 'lucide-react';

export const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    doctorId: '',
    patientId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 10:30 AM',
    reason: '',
  });

  const fetchData = async () => {
    try {
      const [appRes, docRes, patRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/doctors'),
        api.get('/patients'),
      ]);
      setAppointments(appRes.data);
      setDoctors(docRes.data);
      setPatients(patRes.data);

      if (docRes.data.length > 0) formData.doctorId = docRes.data[0].id;
      if (patRes.data.length > 0) formData.patientId = patRes.data[0].id;
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', formData);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to schedule appointment');
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
      <div className="card">
        <div className="card-header">
          <div className="card-title">Scheduled Appointments</div>
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
                  <td>{app.reason || '-'}</td>
                  <td>
                    {app.status === 'SCHEDULED' && <span className="badge badge-info">Scheduled</span>}
                    {app.status === 'COMPLETED' && <span className="badge badge-success">Completed</span>}
                    {app.status === 'CANCELLED' && <span className="badge badge-danger">Cancelled</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {app.status === 'SCHEDULED' && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Mark Completed"
                            onClick={() => handleUpdateStatus(app.id, 'COMPLETED')}
                          >
                            <CheckCircle size={14} color="#10b981" />
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
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(app.id)}>
                        <Trash2 size={14} />
                      </button>
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
                      {d.fullName} - {d.specialization} (${d.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                  <label className="form-label">Time Slot</label>
                  <select
                    className="form-select"
                    value={formData.timeSlot}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  >
                    <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                    <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                    <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                    <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                    <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                  </select>
                </div>
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
