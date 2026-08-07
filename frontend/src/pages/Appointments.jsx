import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Edit3,
  PlusCircle,
  AlertCircle,
  Tag
} from 'lucide-react';

export const Appointments = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isDoctor = user?.role === 'ROLE_DOCTOR';

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedDoctorId, setSelectedDoctorId] = useState('ALL');

  // Text filters
  const [searchPatientPhone, setSearchPatientPhone] = useState('');
  const [searchPatientName, setSearchPatientName] = useState('');
  const [searchReason, setSearchReason] = useState('');

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [diagnosesList, setDiagnosesList] = useState([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    todayVisited: 0,
    todayIncome: 0,
  });

  // Filtered Appointments
  const filteredAppointments = appointments.filter((app) => {
    if (searchPatientName.trim()) {
      const qName = searchPatientName.toLowerCase().trim();
      const pName = app.patient?.fullName ? app.patient.fullName.toLowerCase() : '';
      if (!pName.includes(qName)) return false;
    }

    if (searchPatientPhone.trim()) {
      const qPhone = searchPatientPhone.trim();
      const pPhone = app.patient?.phone ? app.patient.phone.trim() : '';
      if (!pPhone.includes(qPhone)) return false;
    }

    if (searchReason.trim()) {
      const qReason = searchReason.toLowerCase().trim();
      const appReason = app.reason ? app.reason.toLowerCase() : '';
      if (!appReason.includes(qReason)) return false;
    }

    return true;
  });

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showServeModal, setShowServeModal] = useState(false);
  const [showViewRxModal, setShowViewRxModal] = useState(false);

  const [servingAppointment, setServingAppointment] = useState(null);
  const [activePrescription, setActivePrescription] = useState(null);
  const [loadingRx, setLoadingRx] = useState(false);

  // Booking form
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '',
    reason: '',
    age: '',
    gender: '',
  });

  const [availableShifts, setAvailableShifts] = useState([]);

  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      api.get(`/doctors/${formData.doctorId}/shifts?date=${formData.appointmentDate}`)
        .then((res) => {
          setAvailableShifts(res.data || []);
          if (res.data && res.data.length > 0) {
            setFormData((prev) => ({ ...prev, timeSlot: res.data[0].displayLabel }));
          }
        })
        .catch(() => setAvailableShifts([]));
    } else {
      setAvailableShifts([]);
    }
  }, [formData.doctorId, formData.appointmentDate]);

  // Prescription form state
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicines: '',
    advice: '',
    discount: 0,     // visiting fee discount
    diagnoses: [],   // array of { diagnosisId, customName, discountType, discountValue, _price, _netPrice, _error }
  });

  // ─── Diagnosis row helpers ──────────────────────────────────────────────────

  const emptyDiagnosisRow = () => ({
    _key: Math.random().toString(36).slice(2),
    diagnosisId: '',
    customName: '',
    discountType: 'NONE',
    discountValue: 0,
    _price: 0,
    _netPrice: 0,
    _error: '',
  });

  const computeRowNet = (row) => {
    const price = parseFloat(row._price) || 0;
    const val = parseFloat(row.discountValue) || 0;
    if (row.discountType === 'PERCENT') return Math.max(0, price - price * val / 100);
    if (row.discountType === 'FIXED') return Math.max(0, price - val);
    return price;
  };

  const validateRow = (row, doctor) => {
    const val = parseFloat(row.discountValue) || 0;
    if (row.discountType === 'PERCENT') {
      const max = doctor?.maxDiscountPercent ?? 0;
      if (val > max) return `Max allowed: ${max}%`;
    } else if (row.discountType === 'FIXED') {
      const max = doctor?.maxDiscountFixed ?? 0;
      if (val > max) return `Max allowed: ৳${max}`;
    }
    return '';
  };

  const updateDiagnosisRow = (key, patch, doctor) => {
    setPrescriptionForm((prev) => {
      const rows = prev.diagnoses.map((r) => {
        if (r._key !== key) return r;
        const updated = { ...r, ...patch };
        // auto-fill price if a master diagnosis is selected
        if (patch.diagnosisId !== undefined) {
          const found = diagnosesList.find((d) => String(d.id) === String(patch.diagnosisId));
          updated._price = found ? (found.price || 0) : 0;
          updated.customName = '';
        }
        updated._netPrice = computeRowNet(updated);
        updated._error = validateRow(updated, doctor);
        return updated;
      });
      return { ...prev, diagnoses: rows };
    });
  };

  const addDiagnosisRow = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      diagnoses: [...prev.diagnoses, emptyDiagnosisRow()],
    }));
  };

  const removeDiagnosisRow = (key) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      diagnoses: prev.diagnoses.filter((r) => r._key !== key),
    }));
  };

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      let appUrl = '/appointments';
      let statsUrl = '/appointments/stats';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (!startDate && !endDate) params.append('allDates', 'true');
      if (selectedDoctorId && selectedDoctorId !== 'ALL') {
        params.append('doctorId', selectedDoctorId);
      }

      if (params.toString()) {
        appUrl += `?${params.toString()}`;
        statsUrl += `?${params.toString()}`;
      }

      const [appRes, docRes, patRes, statsRes, diagRes] = await Promise.all([
        api.get(appUrl),
        api.get('/doctors'),
        api.get('/patients'),
        api.get(statsUrl),
        api.get('/diagnoses/active').catch(() => ({ data: [] })),
      ]);
      setAppointments(appRes.data);
      setDoctors(docRes.data);
      setPatients(patRes.data);
      setDiagnosesList(diagRes.data || []);
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
  }, [startDate, endDate, selectedDoctorId]);

  // ─── Booking ────────────────────────────────────────────────────────────────

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

  const todayStr = new Date().toISOString().split('T')[0];
  const selectedDoctorObj = doctors.find((d) => String(d.id) === String(formData.doctorId));
  const isPastDate = formData.appointmentDate ? formData.appointmentDate < todayStr : false;
  const isNonWorkingDay = Boolean(formData.doctorId && formData.appointmentDate && !isPastDate && availableShifts.length === 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPastDate) {
      alert('Cannot schedule appointment for a past date.');
      return;
    }
    if (isNonWorkingDay || availableShifts.length === 0) {
      alert(`Selected doctor does not have any configured slots on ${formData.appointmentDate}. Please select a working day.`);
      return;
    }
    try {
      const payload = {
        ...formData,
        patientId: formData.patientId ? parseInt(formData.patientId) : null,
        age: formData.age !== '' ? parseInt(formData.age) : null,
        gender: formData.gender || null,
      };
      await api.post('/appointments', payload);
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

  // ─── Serve / Edit Prescription ──────────────────────────────────────────────

  const openServeModal = async (app) => {
    setServingAppointment(app);

    let medicines = '';
    let advice = '';
    let discount = app.discount || 0;
    let diagnoses = []; // default: no rows (empty state)

    if (app.status === 'VISITED' || app.status === 'COMPLETED') {
      try {
        const res = await api.get(`/prescriptions/appointment/${app.id}`);
        if (res.data) {
          medicines = res.data.medicines || '';
          advice = res.data.advice || '';
          discount = app.discount !== undefined ? app.discount : (res.data.appointment?.discount || 0);

          // Re-hydrate structured diagnoses if present
          if (res.data.prescriptionDiagnoses && res.data.prescriptionDiagnoses.length > 0) {
            diagnoses = res.data.prescriptionDiagnoses.map((pd) => ({
              _key: Math.random().toString(36).slice(2),
              diagnosisId: pd.diagnosis?.id ? String(pd.diagnosis.id) : '',
              customName: pd.customName || '',
              discountType: pd.discountType || 'NONE',
              discountValue: pd.discountValue || 0,
              _price: pd.diagnosisPrice || 0,
              _netPrice: pd.netPrice || 0,
              _error: '',
            }));
          } else if (res.data.diagnosis) {
            // Legacy: old free-text prescription
            diagnoses = [{
              _key: Math.random().toString(36).slice(2),
              diagnosisId: '',
              customName: res.data.diagnosis,
              discountType: 'NONE',
              discountValue: 0,
              _price: 0,
              _netPrice: 0,
              _error: '',
            }];
          }
        }
      } catch (err) {
        console.error('No existing prescription found to prefill', err);
      }
    }

    setPrescriptionForm({ medicines, advice, discount, diagnoses });
    setShowServeModal(true);
  };

  const hasDiscountErrors = () =>
    prescriptionForm.diagnoses.some((r) => r._error);

  const handlePrescriptionSubmit = async (e) => {
    e.preventDefault();
    if (!servingAppointment) return;
    if (hasDiscountErrors()) {
      alert('Please fix discount errors before submitting.');
      return;
    }
    try {
      const diagnosesPayload = prescriptionForm.diagnoses
        .filter((r) => r.diagnosisId || r.customName.trim())
        .map((r) => ({
          diagnosisId: r.diagnosisId ? parseInt(r.diagnosisId) : null,
          customName: r.diagnosisId ? null : r.customName.trim(),
          discountType: r.discountType,
          discountValue: parseFloat(r.discountValue) || 0,
        }));

      await api.post('/prescriptions', {
        appointmentId: servingAppointment.id,
        diagnoses: diagnosesPayload,
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

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const formatPrescriptionTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    try {
      if (Array.isArray(dateTimeStr)) {
        const [year, month, day, hour, minute, second] = dateTimeStr;
        const date = new Date(year, month - 1, day, hour, minute, second || 0);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      const date = new Date(String(dateTimeStr));
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return dateTimeStr;
    }
  };

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

  // Total net diagnosis cost
  const getTotalDiagnosisCost = (rx) => {
    if (!rx?.prescriptionDiagnoses?.length) return null;
    return rx.prescriptionDiagnoses.reduce((sum, pd) => sum + (pd.netPrice || 0), 0);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Stats Bar */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon teal"><Calendar /></div>
          <div>
            <div className="stat-value">{stats.todayAppointments}</div>
            <div className="stat-label">
              {!startDate && !endDate ? 'Total Appointments' : startDate === endDate ? 'Appointments Today' : 'Appointments in Range'}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><UserCheck /></div>
          <div>
            <div className="stat-value">{stats.todayVisited}</div>
            <div className="stat-label">
              {!startDate && !endDate ? 'Total Patients Served' : startDate === endDate ? 'Patients Served Today' : 'Patients Served in Range'}
            </div>
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

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="filter-bar-group">
            <div className="card-title">Scheduled Appointments</div>

            <div className="filter-pill">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>From:</label>
                <input type="date" className="form-input" style={{ width: 'auto', padding: '4px 8px', fontSize: '0.82rem' }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>To:</label>
                <input type="date" className="form-input" style={{ width: 'auto', padding: '4px 8px', fontSize: '0.82rem' }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              {(startDate || endDate) && (
                <button className="btn btn-secondary btn-sm" onClick={() => { setStartDate(''); setEndDate(''); }} style={{ padding: '4px 8px', fontSize: '0.78rem' }}>
                  All Dates
                </button>
              )}
            </div>

            {!isDoctor && doctors.length > 0 && (
              <div className="filter-pill">
                <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Stethoscope size={14} color="var(--primary)" />
                  <span>Doctor:</span>
                </label>
                <select
                  className="form-select filter-select"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="ALL">-- All Doctors --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.specialization})
                    </option>
                  ))}
                </select>
                {selectedDoctorId !== 'ALL' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => setSelectedDoctorId('ALL')} style={{ padding: '4px 8px', fontSize: '0.78rem', flexShrink: 0 }}>
                    Reset Doctor
                  </button>
                )}
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} />
            <span>Book New Appointment</span>
          </button>
        </div>

        {/* Text Filters Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
            backgroundColor: 'var(--table-header-bg)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Patient Phone / Mobile:
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: '32px', fontSize: '0.82rem', padding: '4px 10px' }}
              placeholder="e.g. 01700..."
              value={searchPatientPhone}
              onChange={(e) => setSearchPatientPhone(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Patient Name:
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: '32px', fontSize: '0.82rem', padding: '4px 10px' }}
              placeholder="Filter by name..."
              value={searchPatientName}
              onChange={(e) => setSearchPatientName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Reason Text / Symptoms:
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: '32px', fontSize: '0.82rem', padding: '4px 10px' }}
              placeholder="Filter by reason text..."
              value={searchReason}
              onChange={(e) => setSearchReason(e.target.value)}
            />
          </div>

          {(searchPatientPhone || searchPatientName || searchReason) && (
            <div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchPatientPhone('');
                  setSearchPatientName('');
                  setSearchReason('');
                }}
                style={{ height: '32px', fontSize: '0.78rem', width: '100%' }}
              >
                Clear Text Filters
              </button>
            </div>
          )}
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
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No appointments matching search filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => (
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
                            <button className="btn btn-primary btn-sm" title="Serve Patient & Write Prescription" onClick={() => navigate(`/prescriptions/write/${app.id}`)}>
                              <Stethoscope size={14} />
                              <span>Serve & Write Rx</span>
                            </button>
                          )}
                          <button className="btn btn-secondary btn-sm" title="Mark Cancelled" onClick={() => handleUpdateStatus(app.id, 'CANCELLED')}>
                            <XCircle size={14} color="#ef4444" />
                          </button>
                        </>
                      )}
                      {(app.status === 'VISITED' || app.status === 'COMPLETED') && (
                        <>
                          <button className="btn btn-secondary btn-sm" title="View Prescription" onClick={() => handleViewPrescription(app)}>
                            <FileText size={14} color="var(--primary)" />
                            <span>View Rx</span>
                          </button>
                          {isDoctor && (
                            <button className="btn btn-secondary btn-sm" title="Edit Prescription" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }} onClick={() => navigate(`/prescriptions/write/${app.id}`)}>
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
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Booking Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Book Appointment</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Patient Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Full name of patient"
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
                    placeholder="e.g. patient@example.com"
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
                <label className="form-label">Select Doctor *</label>
                <select className="form-select" value={formData.doctorId} onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })} required>
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((d) => (<option key={d.id} value={d.id}>{d.fullName} - {d.specialization} (৳{d.consultationFee})</option>))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Appointment Date *</label>
                <input
                  type="date"
                  min={todayStr}
                  className="form-input"
                  value={formData.appointmentDate}
                  onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  required
                />
                {selectedDoctorObj && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    🗓️ Doctor Schedule: <strong>{selectedDoctorObj.workingHours || 'Everyday'}</strong>
                  </div>
                )}
                {isPastDate && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, marginTop: '6px', backgroundColor: '#fef2f2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                    ⚠️ Cannot select a past date. Please select today or a future date.
                  </div>
                )}
                {isNonWorkingDay && (
                  <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, marginTop: '6px', backgroundColor: '#fef2f2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                    ⚠️ {selectedDoctorObj?.fullName} has no configured slots on this date ({formData.appointmentDate}). Please select a working day.
                  </div>
                )}
              </div>

              {/* Doctor Shift Selector */}
              <div className="form-group">
                <label className="form-label">Doctor Shift *</label>
                {availableShifts.length > 0 ? (
                  <select
                    className="form-select"
                    value={formData.timeSlot || ''}
                    onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                    required
                  >
                    {availableShifts.map((shift, idx) => (
                      <option key={idx} value={shift.displayLabel}>
                        {shift.displayLabel}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="No available shifts on this date"
                    value={formData.timeSlot || ''}
                    disabled
                  />
                )}
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
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isPastDate || isNonWorkingDay || availableShifts.length === 0}
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Prescription Modal ────────────────────────────────────────── */}
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
              <button className="modal-close-btn no-print" onClick={() => setShowViewRxModal(false)}><X size={18} /></button>
            </div>

            {loadingRx ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading prescription details...</div>
            ) : activePrescription ? (
              <div id="printable-prescription">
                {/* Print Header */}
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

                {/* Doctor header */}
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

                {/* Patient bar */}
                <div style={{ backgroundColor: 'var(--table-header-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                  <div><strong>Patient Name:</strong> {activePrescription.patient?.fullName}</div>
                  <div><strong>Age / Gender:</strong> {activePrescription.patient?.age ? `${activePrescription.patient.age} yrs` : 'N/A'} / {activePrescription.patient?.gender || 'N/A'}</div>
                  <div><strong>Phone:</strong> {activePrescription.patient?.phone || 'N/A'}</div>
                </div>


                {/* ── Diagnoses Table (structured) ── */}
                {activePrescription.prescriptionDiagnoses && activePrescription.prescriptionDiagnoses.length > 0 ? (
                  <div style={{ marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Diagnoses & Prescribed Tests</h5>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--table-header-bg)' }}>
                          <th style={{ textAlign: 'left', padding: '7px 10px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, width: '40px' }}>#</th>
                          <th style={{ textAlign: 'left', padding: '7px 10px', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>Diagnosis</th>
                          {activePrescription.prescriptionDiagnoses.some((pd) => pd.discountType !== 'NONE') && (
                            <th style={{ textAlign: 'right', padding: '7px 10px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, width: '180px' }}>Discount</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {activePrescription.prescriptionDiagnoses.map((pd, i) => {
                          const hasDiscount = pd.discountType !== 'NONE';
                          const discountDisplay =
                            pd.discountType === 'PERCENT' ? `${pd.discountValue}% Discount`
                            : pd.discountType === 'FIXED'   ? `৳${pd.discountValue.toFixed(2)} Discount`
                            : '—';
                          const diagName = pd.diagnosis
                            ? pd.diagnosis.name + (pd.diagnosis.code ? ` (${pd.diagnosis.code})` : '')
                            : pd.customName || 'N/A';
                          return (
                            <tr key={pd.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{i + 1}</td>
                              <td style={{ padding: '7px 10px', fontWeight: 600 }}>
                                <div>{diagName}</div>
                                {pd.instructions && (
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 400, marginTop: '2px' }}>
                                    Note: {pd.instructions}
                                  </div>
                                )}
                              </td>
                              {activePrescription.prescriptionDiagnoses.some((p) => p.discountType !== 'NONE') && (
                                <td style={{ padding: '7px 10px', textAlign: 'right', color: hasDiscount ? '#d97706' : 'var(--text-muted)', fontWeight: hasDiscount ? 600 : 400 }}>
                                  {discountDisplay}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {/* Discount note */}
                    {activePrescription.prescriptionDiagnoses.some((pd) => pd.discountType !== 'NONE') && (
                      <div style={{ fontSize: '0.75rem', color: '#d97706', fontStyle: 'italic', marginTop: '6px', padding: '4px 8px', backgroundColor: 'rgba(245,158,11,0.07)', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.2)' }}>
                        ★ Discounts are applicable only if the above diagnoses are performed within this centre.
                      </div>
                    )}
                  </div>
                ) : activePrescription.diagnosis ? (
                  /* Legacy: show old free-text diagnosis */
                  <div style={{ marginBottom: '14px' }}>
                    <h5 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Diagnosis</h5>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', backgroundColor: 'var(--primary-light)', padding: '6px 12px', borderRadius: '6px', display: 'inline-block' }}>
                      {activePrescription.diagnosis}
                    </div>
                  </div>
                ) : null}

                {/* Medicines */}
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'serif', color: 'var(--primary)' }}>Rx</span>
                    <h5 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Prescribed Medications</h5>
                  </div>
                  {activePrescription.prescriptionMedicines && activePrescription.prescriptionMedicines.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--table-header-bg)' }}>
                          <th style={{ textAlign: 'left', padding: '7px 10px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, width: '35px' }}>#</th>
                          <th style={{ textAlign: 'left', padding: '7px 10px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, width: '70px' }}>Type</th>
                          <th style={{ textAlign: 'left', padding: '7px 10px', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>Medicine Name</th>
                          <th style={{ textAlign: 'left', padding: '7px 10px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, width: '90px' }}>Doses</th>
                          <th style={{ textAlign: 'left', padding: '7px 10px', borderBottom: '1px solid var(--border-color)', fontWeight: 700 }}>Instruction</th>
                          <th style={{ textAlign: 'left', padding: '7px 10px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, width: '100px' }}>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activePrescription.prescriptionMedicines.map((pm, i) => (
                          <tr key={pm.id || i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '7px 10px', color: 'var(--text-muted)' }}>{i + 1}</td>
                            <td style={{ padding: '7px 10px', fontWeight: 600, color: 'var(--primary)' }}>{pm.type}</td>
                            <td style={{ padding: '7px 10px', fontWeight: 700 }}>{pm.name}</td>
                            <td style={{ padding: '7px 10px', fontWeight: 600 }}>{pm.doses || '—'}</td>
                            <td style={{ padding: '7px 10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{pm.instruction || '—'}</td>
                            <td style={{ padding: '7px 10px', fontWeight: 600 }}>{pm.duration || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '14px', borderRadius: '10px', fontSize: '0.92rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'Courier New, monospace, sans-serif' }}>
                      {activePrescription.medicines}
                    </div>
                  )}
                </div>

                {/* Advice */}
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Advice & Instructions</h5>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontStyle: 'italic', backgroundColor: 'var(--table-header-bg)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    {activePrescription.advice || 'N/A'}
                  </div>
                </div>

                {/* Signature */}
                <div className="prescription-signature-block" style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Generated by CarePulse Medical System</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1.5px solid var(--text-main)', width: '180px', marginBottom: '4px' }}></div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{activePrescription.doctor?.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Doctor's Signature</div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="modal-footer no-print" style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowViewRxModal(false)}>Close</button>
                  {isDoctor && (
                    <button
                      type="button" className="btn btn-secondary"
                      style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                      onClick={() => {
                        const targetApp = activePrescription.appointment;
                        setShowViewRxModal(false);
                        if (targetApp?.id) navigate(`/prescriptions/write/${targetApp.id}`);
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
