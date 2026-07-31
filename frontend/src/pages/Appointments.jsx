import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  Calendar,
  Plus,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  Stethoscope,
  DollarSign,
  UserCheck,
  FileText,
  Printer,
  Pill,
  Edit3
} from 'lucide-react';

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

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showServeModal, setShowServeModal] = useState(false);
  const [showViewRxModal, setShowViewRxModal] = useState(false);

  const [servingAppointment, setServingAppointment] = useState(null);
  const [activePrescription, setActivePrescription] = useState(null);
  const [loadingRx, setLoadingRx] = useState(false);

  const [formData, setFormData] = useState({
    doctorId: '',
    patientId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    diagnosis: '',
    medicines: '',
    advice: '',
    discount: 0,
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

  // Serve & Write / Edit Prescription Handlers
  const openServeModal = async (app) => {
    setServingAppointment(app);
    let diagnosis = app.reason || '';
    let medicines = '';
    let advice = '';
    let discount = app.discount || 0;

    if (app.status === 'VISITED' || app.status === 'COMPLETED') {
      try {
        const res = await api.get(`/prescriptions/appointment/${app.id}`);
        if (res.data) {
          diagnosis = res.data.diagnosis || diagnosis;
          medicines = res.data.medicines || '';
          advice = res.data.advice || '';
          discount = app.discount !== undefined ? app.discount : (res.data.appointment?.discount || 0);
        }
      } catch (err) {
        console.error('No existing prescription found to prefill', err);
      }
    }

    setPrescriptionForm({
      diagnosis,
      medicines,
      advice,
      discount,
    });
    setShowServeModal(true);
  };

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!servingAppointment) return;
    try {
      await api.post('/prescriptions', {
        appointmentId: servingAppointment.id,
        diagnosis: prescriptionForm.diagnosis,
        medicines: prescriptionForm.medicines,
        advice: prescriptionForm.advice,
        discount: Number(prescriptionForm.discount) || 0,
      });
      setShowServeModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit prescription');
    }
  };

  // Format Prescription Creation Time (Local Time)
  const formatPrescriptionTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    try {
      if (Array.isArray(dateTimeStr)) {
        const [year, month, day, hour, minute, second] = dateTimeStr;
        const date = new Date(year, month - 1, day, hour, minute, second || 0);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      const isoStr = String(dateTimeStr);
      const date = new Date(isoStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return dateTimeStr;
    }
  };

  // View Prescription Handler
  const handleViewPrescription = async (app) => {
    setLoadingRx(true);
    setShowViewRxModal(true);
    setActivePrescription(null);
    try {
      const res = await api.get(`/prescriptions/appointment/${app.id}`);
      setActivePrescription(res.data);
    } catch (err) {
      alert('Prescription details not found for this appointment.');
      setShowViewRxModal(false);
    } finally {
      setLoadingRx(false);
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
                    {app.discount > 0 ? (
                      <div>
                        <div style={{ textDecoration: 'line-through', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          ৳{app.doctor?.consultationFee ? app.doctor.consultationFee.toFixed(2) : '0.00'}
                        </div>
                        <strong style={{ color: '#10b981' }}>
                          ৳{Math.max(0, (app.doctor?.consultationFee || 0) - app.discount).toFixed(2)}
                        </strong>
                        <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                          (-৳{app.discount.toFixed(2)} Discount)
                        </div>
                      </div>
                    ) : (
                      <strong>৳{app.doctor?.consultationFee ? app.doctor.consultationFee.toFixed(2) : '0.00'}</strong>
                    )}
                  </td>
                  <td>{app.reason || '-'}</td>
                  <td>
                    {app.status === 'SCHEDULED' && <span className="badge badge-info">Scheduled</span>}
                    {app.status === 'VISITED' && <span className="badge badge-success">Visited (Served)</span>}
                    {app.status === 'COMPLETED' && <span className="badge badge-success">Completed</span>}
                    {app.status === 'CANCELLED' && <span className="badge badge-danger">Cancelled</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {app.status === 'SCHEDULED' && (
                        <>
                          {isDoctor && (
                            <button
                              className="btn btn-primary btn-sm"
                              title="Serve Patient & Write Prescription"
                              onClick={() => openServeModal(app)}
                            >
                              <Stethoscope size={14} />
                              <span>Serve & Write Rx</span>
                            </button>
                          )}
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Mark Cancelled"
                            onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}
                          >
                            <XCircle size={14} color="#ef4444" />
                          </button>
                        </>
                      )}
                      {(app.status === 'VISITED' || app.status === 'COMPLETED') && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="View Prescription"
                            onClick={() => handleViewPrescription(app)}
                          >
                            <FileText size={14} color="var(--primary)" />
                            <span>View Rx</span>
                          </button>
                          {isDoctor && (
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Edit Prescription"
                              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                              onClick={() => openServeModal(app)}
                            >
                              <Edit3 size={14} />
                              <span>Edit Rx</span>
                            </button>
                          )}
                        </>
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

      {/* Booking Modal */}
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

      {/* Serve Patient & Write Prescription Modal */}
      {showServeModal && servingAppointment && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Stethoscope size={22} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>
                  {(servingAppointment.status === 'VISITED' || servingAppointment.status === 'COMPLETED')
                    ? 'Edit Prescription'
                    : 'Serve Patient & Write Prescription'}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowServeModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Patient Header Summary */}
            <div style={{ backgroundColor: 'var(--primary-light)', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.9rem', borderLeft: '4px solid var(--primary)' }}>
              <div><strong>Patient:</strong> {servingAppointment.patient?.fullName} ({servingAppointment.patient?.gender || 'N/A'}, {servingAppointment.patient?.age ? `${servingAppointment.patient.age} yrs` : 'N/A'})</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Date: {servingAppointment.appointmentDate} | Slot: {servingAppointment.timeSlot} | Consultation Fee: ৳{servingAppointment.doctor?.consultationFee}
              </div>
            </div>

            <form onSubmit={handlePrescriptionSubmit}>
              {/* Fee & Discount Section */}
              <div className="form-group" style={{ backgroundColor: 'var(--table-header-bg)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} color="var(--primary)" />
                    <span>Visiting Fee & Discount</span>
                  </label>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Standard Fee: <strong>৳{servingAppointment.doctor?.consultationFee || 0}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Discount Amount (৳)</label>
                    <input
                      type="number"
                      min="0"
                      max={servingAppointment.doctor?.consultationFee || 99999}
                      step="any"
                      className="form-input"
                      placeholder="0"
                      value={prescriptionForm.discount}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, discount: e.target.value })}
                    />
                  </div>
                  <div style={{ flex: '1 1 180px', backgroundColor: 'var(--primary-light)', padding: '8px 14px', borderRadius: '8px', textAlign: 'right', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>Net Visiting Fee Collected</span>
                    <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>
                      ৳{Math.max(0, (servingAppointment.doctor?.consultationFee || 0) - (Number(prescriptionForm.discount) || 0)).toFixed(2)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Diagnosis / Symptoms</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acute Pharyngitis, Mild Fever"
                  value={prescriptionForm.diagnosis}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, diagnosis: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Pill size={16} color="var(--primary)" />
                  <span>Prescribed Medicines & Dosage *</span>
                </label>
                <textarea
                  className="form-textarea"
                  rows="5"
                  placeholder={"1. Tab. Napa 500mg - 1 + 0 + 1 (After meal) - 5 days\n2. Syr. Histacin 5ml - 0 + 0 + 1 (Bedtime) - 3 days"}
                  value={prescriptionForm.medicines}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicines: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Special Advice & Follow-up Instructions</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="e.g. Gargle with warm salt water. Drink plenty of fluids. Follow up after 7 days if symptoms persist."
                  value={prescriptionForm.advice}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, advice: e.target.value })}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowServeModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle size={16} />
                  <span>
                    {(servingAppointment.status === 'VISITED' || servingAppointment.status === 'COMPLETED')
                      ? 'Save Changes'
                      : 'Submit Prescription & Mark Visited'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Prescription Modal */}
      {showViewRxModal && (
        <div className="modal-backdrop">
          <div className="modal-content prescription-modal-content" style={{ maxWidth: '720px', padding: '36px' }}>
            <div className="modal-header no-print" style={{ borderBottom: '2px solid var(--primary)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', backgroundColor: 'var(--primary)', color: '#fff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>CarePulse Medical Center</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Official Medical Prescription Record</span>
                </div>
              </div>
              <button className="modal-close-btn no-print" onClick={() => setShowViewRxModal(false)}>
                <X size={18} />
              </button>
            </div>

            {loadingRx ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading prescription details...</div>
            ) : activePrescription ? (
              <div id="printable-prescription">
                {/* Print Header (Visible only on print/download) */}
                <div className="print-only-header" style={{ display: 'none', borderBottom: '3px solid #0d9488', paddingBottom: '16px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0d9488', margin: 0 }}>CarePulse Medical Center</h2>
                      <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0 }}>Quality Healthcare & Medical Consultancy</p>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#475569' }}>
                      <div>Phone: +880 1700-000000</div>
                      <div>Email: info@carepulse.clinic</div>
                    </div>
                  </div>
                </div>

                {/* Doctor Header Block */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px dashed var(--border-color)' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', margin: '0 0 4px 0' }}>{activePrescription.doctor?.fullName}</h4>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{activePrescription.doctor?.specialization} | {activePrescription.doctor?.qualification || 'MBBS'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Room / Suite: {activePrescription.doctor?.roomNo || 'N/A'}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div><strong>Date:</strong> {activePrescription.appointment?.appointmentDate}</div>
                    <div><strong>Prescription Time:</strong> {formatPrescriptionTime(activePrescription.createdAt)}</div>
                  </div>
                </div>

                {/* Patient Bar */}
                <div style={{ backgroundColor: 'var(--table-header-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                  <div><strong>Patient Name:</strong> {activePrescription.patient?.fullName}</div>
                  <div><strong>Age / Gender:</strong> {activePrescription.patient?.age ? `${activePrescription.patient.age} yrs` : 'N/A'} / {activePrescription.patient?.gender || 'N/A'}</div>
                  <div><strong>Phone:</strong> {activePrescription.patient?.phone || 'N/A'}</div>
                </div>

                {/* Visiting Fee & Discount Summary Bar */}
                <div style={{ padding: '8px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--primary-light)', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
                  <div>Consultation Fee: <strong>৳{activePrescription.doctor?.consultationFee ? activePrescription.doctor.consultationFee.toFixed(2) : '0.00'}</strong></div>
                  {activePrescription.appointment?.discount > 0 && (
                    <div style={{ color: '#d97706', fontWeight: 600 }}>Discount: <strong>-৳{activePrescription.appointment.discount.toFixed(2)}</strong></div>
                  )}
                  <div>Net Visiting Fee Paid: <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>৳{Math.max(0, (activePrescription.doctor?.consultationFee || 0) - (activePrescription.appointment?.discount || 0)).toFixed(2)}</strong></div>
                </div>

                {/* Diagnosis Section */}
                {activePrescription.diagnosis && (
                  <div style={{ marginBottom: '14px' }}>
                    <h5 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Diagnosis</h5>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', backgroundColor: 'var(--primary-light)', padding: '6px 12px', borderRadius: '6px', display: 'inline-block' }}>
                      {activePrescription.diagnosis}
                    </div>
                  </div>
                )}

                {/* Rx Medicines Section */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'serif', color: 'var(--primary)' }}>Rx</span>
                    <h5 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prescribed Medications</h5>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '10px', fontSize: '0.92rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'Courier New, monospace, sans-serif' }}>
                    {activePrescription.medicines}
                  </div>
                </div>

                {/* Advice Section */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Advice & Instructions</h5>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontStyle: 'italic', backgroundColor: 'var(--table-header-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    {activePrescription.advice || 'N/A'}
                  </div>
                </div>

                {/* Doctor Signature Block (Visible on print) */}
                <div className="prescription-signature-block" style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Generated by CarePulse Medical System
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1.5px solid var(--text-main)', width: '180px', marginBottom: '4px' }}></div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{activePrescription.doctor?.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doctor's Signature</div>
                  </div>
                </div>

                {/* Modal Footer Actions (Hidden when printing) */}
                <div className="modal-footer no-print" style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowViewRxModal(false)}>
                    Close
                  </button>
                  {isDoctor && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      onClick={() => {
                        const targetApp = activePrescription.appointment || servingAppointment;
                        setShowViewRxModal(false);
                        if (targetApp) openServeModal(targetApp);
                      }}
                    >
                      <Edit3 size={16} />
                      <span>Edit Prescription</span>
                    </button>
                  )}
                  <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
