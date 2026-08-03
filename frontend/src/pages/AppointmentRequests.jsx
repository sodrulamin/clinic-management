import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ClipboardList, Check, X, Plus } from 'lucide-react';

export const AppointmentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    age: '',
    gender: '',
    patientId: '',
    doctorId: '',
    preferredDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const [patients, setPatients] = useState([]);

  const fetchRequests = async () => {
    try {
      const url = filterStatus === 'ALL' ? '/appointment-requests' : `/appointment-requests?status=${filterStatus}`;
      const res = await api.get(url);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
      if (res.data.length > 0) {
        setFormData((prev) => ({ ...prev, doctorId: res.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchDoctors();
    fetchPatients();
  }, [filterStatus]);

  const matchingPatients = formData.patientPhone.trim().length >= 3
    ? patients.filter((p) => p.phone && p.phone.trim().includes(formData.patientPhone.trim()))
    : [];

  const handleSelectExistingPatient = (patientId) => {
    if (!patientId) {
      setFormData((prev) => ({ ...prev, patientId: '' }));
      return;
    }
    const p = patients.find((pat) => String(pat.id) === String(patientId));
    if (p) {
      setFormData((prev) => ({
        ...prev,
        patientId: p.id,
        patientName: p.fullName || prev.patientName,
        patientPhone: p.phone || prev.patientPhone,
        patientEmail: p.email || prev.patientEmail,
        age: p.age !== undefined && p.age !== null ? String(p.age) : prev.age,
        gender: p.gender || prev.gender,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        patientId: formData.patientId ? parseInt(formData.patientId) : null,
      };
      await api.post('/appointment-requests', payload);
      setShowModal(false);
      fetchRequests();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit appointment request';
      alert(msg);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/appointment-requests/${id}/approve`);
      alert('Request Approved! Patient and scheduled appointment created.');
      fetchRequests();
    } catch (err) {
      alert('Failed to approve request');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/appointment-requests/${id}/reject`);
      fetchRequests();
    } catch (err) {
      alert('Failed to reject request');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="card-title">Appointment Requests Queue</div>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending Only</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            <span>Submit Appointment Request</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Requested Doctor</th>
                <th>Preferred Date & Time</th>
                <th>Reason / Illness</th>
                <th>Status</th>
                <th>Review Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <strong>{req.patientName}</strong>
                    {(req.gender || req.age) && (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        ({req.gender || ''}{req.gender && req.age ? ', ' : ''}{req.age ? `${req.age} yrs` : ''})
                      </span>
                    )}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.patientPhone}</div>
                    {req.patientEmail && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{req.patientEmail}</div>
                    )}
                  </td>
                  <td>
                    <strong>{req.doctor?.fullName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.doctor?.specialization}</div>
                  </td>
                  <td>
                    <strong>{req.preferredDate}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.preferredTime}</div>
                  </td>
                  <td>{req.reason || '-'}</td>
                  <td>
                    {req.status === 'PENDING' && <span className="badge badge-warning">Pending Review</span>}
                    {req.status === 'APPROVED' && <span className="badge badge-success">Approved</span>}
                    {req.status === 'REJECTED' && <span className="badge badge-danger">Rejected</span>}
                  </td>
                  <td>
                    {req.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleApprove(req.id)}>
                          <Check size={14} /> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(req.id)}>
                          <X size={14} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Decision Finalized</span>
                    )}
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
              <h3>Submit Appointment Request</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Patient Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value, patientId: '' })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Patient Phone *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 01700000000"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value, patientId: '' })}
                    required
                  />
                  {matchingPatients.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        💡 Found {matchingPatients.length} Existing Patient(s) — Select to Auto-Fill:
                      </label>
                      <select
                        className="form-select"
                        style={{
                          fontSize: '0.86rem',
                          borderColor: 'var(--primary)',
                          backgroundColor: 'var(--bg-card)',
                          color: 'var(--text-main)',
                          padding: '8px 12px'
                        }}
                        onChange={(e) => handleSelectExistingPatient(e.target.value)}
                      >
                        <option value="" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>
                          -- Choose Patient Profile --
                        </option>
                        {matchingPatients.map((p) => (
                          <option key={p.id} value={p.id} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>
                            {p.fullName} ({p.gender || 'N/A'}, {p.age ? `${p.age} yrs` : 'Age N/A'}) {p.email ? `- ${p.email}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Patient Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.patientEmail}
                    onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                  />
                </div>
              </div>

              {/* Patient Age & Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Patient Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    className="form-input"
                    placeholder="e.g. 35"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Patient Gender</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Target Doctor</label>
                <select
                  className="form-select"
                  value={formData.doctorId}
                  onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                  required
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} - {d.specialization} (৳{d.consultationFee})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Symptoms</label>
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
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
