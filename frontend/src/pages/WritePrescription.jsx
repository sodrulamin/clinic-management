import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  ArrowLeft,
  Stethoscope,
  DollarSign,
  Pill,
  Tag,
  PlusCircle,
  Trash2,
  AlertCircle,
  CheckCircle,
  User,
  Calendar,
  Clock
} from 'lucide-react';

export const WritePrescription = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [appointment, setAppointment] = useState(null);
  const [diagnosesList, setDiagnosesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [bulkDiscount, setBulkDiscount] = useState({
    type: 'NONE',
    value: '',
  });

  const [prescriptionForm, setPrescriptionForm] = useState({
    medicines: '',
    advice: '',
    discount: 0,
    diagnoses: [],
  });

  const emptyDiagnosisRow = () => ({
    _key: Math.random().toString(36).slice(2),
    diagnosisId: '',
    discountType: 'NONE',
    discountValue: 0,
    _price: 0,
    _netPrice: 0,
    _error: '',
  });

  const computeRowNet = (row) => {
    const price = parseFloat(row._price) || 0;
    const val = parseFloat(row.discountValue) || 0;
    if (row.discountType === 'PERCENT') return Math.max(0, price - (price * val) / 100);
    if (row.discountType === 'FIXED') return Math.max(0, price - val);
    return price;
  };

  const getEffectiveMax = (row, doctor) => {
    const docPct = doctor?.maxDiscountPercent ?? 0;
    const docFixed = doctor?.maxDiscountFixed ?? 0;
    const found = diagnosesList.find((d) => String(d.id) === String(row.diagnosisId));
    const diagPct = found?.maxDiscountPercent;
    const diagFixed = found?.maxDiscountFixed;

    const effPct = (diagPct !== undefined && diagPct !== null && Number(diagPct) > 0)
      ? Math.min(docPct, Number(diagPct))
      : docPct;

    const effFixed = (diagFixed !== undefined && diagFixed !== null && Number(diagFixed) > 0)
      ? Math.min(docFixed, Number(diagFixed))
      : docFixed;

    return { effPct, effFixed };
  };

  const validateRow = (row, doctor) => {
    const val = parseFloat(row.discountValue) || 0;
    const { effPct, effFixed } = getEffectiveMax(row, doctor);
    if (row.discountType === 'PERCENT') {
      if (val > effPct) return `Max allowed: ${effPct}%`;
    } else if (row.discountType === 'FIXED') {
      if (val > effFixed) return `Max allowed: ৳${effFixed}`;
    }
    return '';
  };

  const handleApplyBulkDiscount = (type, value, doctor) => {
    setBulkDiscount({ type, value });
    const numVal = parseFloat(value) || 0;
    setPrescriptionForm((prev) => {
      const rows = prev.diagnoses.map((r) => {
        const { effPct, effFixed } = getEffectiveMax(r, doctor);
        let updatedType = type;
        let updatedVal = 0;

        if (type === 'PERCENT') {
          updatedVal = Math.min(numVal, effPct);
        } else if (type === 'FIXED') {
          updatedVal = Math.min(numVal, effFixed);
        } else {
          updatedType = 'NONE';
          updatedVal = 0;
        }

        const updated = {
          ...r,
          discountType: updatedType,
          discountValue: updatedVal,
        };
        updated._netPrice = computeRowNet(updated);
        updated._error = validateRow(updated, doctor);
        return updated;
      });
      return { ...prev, diagnoses: rows };
    });
  };

  const updateDiagnosisRow = (key, patch, doctor) => {
    setPrescriptionForm((prev) => {
      const rows = prev.diagnoses.map((r) => {
        if (r._key !== key) return r;
        const updated = { ...r, ...patch };
        if (patch.diagnosisId !== undefined) {
          const found = diagnosesList.find((d) => String(d.id) === String(patch.diagnosisId));
          updated._price = found ? (found.price || 0) : 0;
        }
        updated._netPrice = computeRowNet(updated);
        updated._error = validateRow(updated, doctor);
        return updated;
      });
      return { ...prev, diagnoses: rows };
    });
  };

  const addDiagnosisRow = (doctor) => {
    const newRow = emptyDiagnosisRow();
    if (bulkDiscount.type !== 'NONE' && bulkDiscount.value) {
      newRow.discountType = bulkDiscount.type;
      newRow.discountValue = parseFloat(bulkDiscount.value) || 0;
    }
    setPrescriptionForm((prev) => {
      const updatedRows = [...prev.diagnoses, newRow];
      // If bulk discount is active, also run validate/net calculations
      const finalized = updatedRows.map((r) => {
        if (r._key !== newRow._key) return r;
        const { effPct, effFixed } = getEffectiveMax(r, doctor);
        if (r.discountType === 'PERCENT') r.discountValue = Math.min(r.discountValue, effPct);
        if (r.discountType === 'FIXED') r.discountValue = Math.min(r.discountValue, effFixed);
        r._netPrice = computeRowNet(r);
        r._error = validateRow(r, doctor);
        return r;
      });
      return { ...prev, diagnoses: finalized };
    });
  };

  const removeDiagnosisRow = (key) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      diagnoses: prev.diagnoses.filter((r) => r._key !== key),
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const [appRes, diagRes] = await Promise.all([
          api.get(`/appointments/${appointmentId}`),
          api.get('/diagnoses/active').catch(() => ({ data: [] })),
        ]);

        const app = appRes.data;
        setAppointment(app);
        setDiagnosesList(diagRes.data || []);

        let medicines = '';
        let advice = '';
        let discount = app.discount || 0;
        let diagnoses = [];

        try {
          const rxRes = await api.get(`/prescriptions/appointment/${app.id}`);
          if (rxRes.data) {
            medicines = rxRes.data.medicines || '';
            advice = rxRes.data.advice || '';
            discount = app.discount !== undefined ? app.discount : (rxRes.data.appointment?.discount || 0);

            if (rxRes.data.prescriptionDiagnoses && rxRes.data.prescriptionDiagnoses.length > 0) {
              diagnoses = rxRes.data.prescriptionDiagnoses.map((pd) => ({
                _key: Math.random().toString(36).slice(2),
                diagnosisId: pd.diagnosis?.id ? String(pd.diagnosis.id) : '',
                discountType: pd.discountType || 'NONE',
                discountValue: pd.discountValue || 0,
                _price: pd.diagnosisPrice || 0,
                _netPrice: pd.netPrice || 0,
                _error: '',
              }));
            }
          }
        } catch (rxErr) {
          // No existing prescription found yet (e.g. 404), start with clean prescription form
        }

        setPrescriptionForm({ medicines, advice, discount, diagnoses });
      } catch (err) {
        console.error('Failed to load appointment details', err);
        setError('Failed to load appointment details or prescription.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [appointmentId]);

  const hasDiscountErrors = () => prescriptionForm.diagnoses.some((r) => r._error);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appointment) return;
    if (hasDiscountErrors()) {
      alert('Please fix discount errors before submitting.');
      return;
    }

    try {
      const diagnosesPayload = prescriptionForm.diagnoses
        .filter((r) => r.diagnosisId)
        .map((r) => ({
          diagnosisId: parseInt(r.diagnosisId),
          customName: null,
          discountType: r.discountType,
          discountValue: parseFloat(r.discountValue) || 0,
        }));

      await api.post('/prescriptions', {
        appointmentId: appointment.id,
        diagnoses: diagnosesPayload,
        medicines: prescriptionForm.medicines,
        advice: prescriptionForm.advice,
        discount: Number(prescriptionForm.discount) || 0,
      });

      // Navigate back to previous page
      navigate(-1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit prescription');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading appointment and prescription data...
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
        <h4 style={{ color: '#ef4444' }}>{error || 'Appointment record not found.'}</h4>
        <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back to Appointments
        </button>
      </div>
    );
  }

  const doctor = appointment.doctor;
  const maxPct = doctor?.maxDiscountPercent ?? 0;
  const maxFixed = doctor?.maxDiscountFixed ?? 0;
  const totalDiagNet = prescriptionForm.diagnoses.reduce((s, r) => s + (parseFloat(r._netPrice) || 0), 0);
  const isEdit = appointment.status === 'VISITED' || appointment.status === 'COMPLETED';

  return (
    <div style={{ width: '100%', paddingBottom: '40px' }}>
      {/* Header bar with Back button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Stethoscope size={24} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
            {isEdit ? 'Edit Prescription' : 'Write Patient Prescription'}
          </h2>
        </div>
        <div style={{ width: '80px' }}></div> {/* Spacer for symmetry */}
      </div>

      <div className="card" style={{ padding: '28px' }}>
        {/* Patient & Doctor Banner */}
        <div
          style={{
            backgroundColor: 'var(--primary-light)',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '24px',
            borderLeft: '5px solid var(--primary)',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--primary)" />
              {appointment.patient?.fullName}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                ({appointment.patient?.gender || 'N/A'}, {appointment.patient?.age ? `${appointment.patient.age} yrs` : 'N/A'})
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '16px' }}>
              <span>Phone: <strong>{appointment.patient?.phone || 'N/A'}</strong></span>
              <span>Reason: <strong>{appointment.reason || 'Consultation'}</strong></span>
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              <Calendar size={14} /> <strong>{appointment.appointmentDate}</strong>
              <Clock size={14} style={{ marginLeft: '8px' }} /> <strong>{appointment.timeSlot}</strong>
            </div>
            <div style={{ marginTop: '4px' }}>
              Doctor: <strong>{doctor?.fullName}</strong> ({doctor?.specialization})
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Visiting Fee & Discount Section */}
          <div
            className="form-group"
            style={{
              backgroundColor: 'var(--table-header-bg)',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                <DollarSign size={18} color="var(--primary)" />
                <span>Visiting Fee & Discount</span>
              </label>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Standard Fee: <strong>৳{doctor?.consultationFee || 0}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Visiting Fee Discount (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="form-input"
                  placeholder="0"
                  value={prescriptionForm.discount}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, discount: e.target.value })}
                />
              </div>
              <div
                style={{
                  flex: '1 1 200px',
                  backgroundColor: 'var(--primary-light)',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  textAlign: 'right',
                  border: '1px solid rgba(13, 148, 136, 0.2)'
                }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', fontWeight: 500 }}>
                  Net Visiting Fee Collected
                </span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--primary)' }}>
                  ৳{Math.max(0, (doctor?.consultationFee || 0) - (Number(prescriptionForm.discount) || 0)).toFixed(2)}
                </strong>
              </div>
            </div>
          </div>

          {/* Diagnoses Section */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                  <Tag size={18} color="var(--primary)" />
                  <span>Diagnoses & Prescribed Tests</span>
                </label>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Select diagnoses to prescribe. Doctor authority limit: {maxPct}% / ৳{maxFixed} discount.
                </div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => addDiagnosisRow(doctor)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PlusCircle size={15} />
                <span>Add Diagnosis</span>
              </button>
            </div>

            {/* Bulk Discount Toolbar */}
            {prescriptionForm.diagnoses.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--table-header-bg)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  <Tag size={16} color="var(--primary)" />
                  <span>Discount for Diagnoses:</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <select
                    className="form-select"
                    style={{ width: '170px', padding: '6px 12px', minHeight: '40px', lineHeight: '1.4', fontSize: '0.88rem' }}
                    value={bulkDiscount.type}
                    onChange={(e) => handleApplyBulkDiscount(e.target.value, bulkDiscount.value, doctor)}
                  >
                    <option value="NONE">No Bulk Discount</option>
                    <option value="PERCENT">Percent (%)</option>
                    <option value="FIXED">Fixed Amount (৳)</option>
                  </select>

                  {bulkDiscount.type !== 'NONE' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder={bulkDiscount.type === 'PERCENT' ? 'e.g. 15%' : 'e.g. 200'}
                        className="form-input"
                        style={{ width: '140px', padding: '6px 12px', minHeight: '40px', lineHeight: '1.4', fontSize: '0.88rem' }}
                        value={bulkDiscount.value}
                        onChange={(e) => handleApplyBulkDiscount(bulkDiscount.type, e.target.value, doctor)}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {prescriptionForm.diagnoses.length === 0 && (
              <div
                onClick={() => addDiagnosisRow(doctor)}
                style={{
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  padding: '28px 24px',
                  border: '2px dashed var(--border-color)',
                  borderRadius: '10px',
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  backgroundColor: 'var(--table-header-bg)',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'var(--primary-light)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.backgroundColor = 'var(--table-header-bg)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                <PlusCircle size={24} style={{ display: 'block', margin: '0 auto 8px auto' }} />
                <strong>No diagnoses added yet.</strong>
                <div style={{ fontSize: '0.84rem', marginTop: '4px' }}>
                  Click anywhere in this box or the "Add Diagnosis" button to add diagnosis entries.
                </div>
              </div>
            )}

            {prescriptionForm.diagnoses.map((row, idx) => {
              const { effPct, effFixed } = getEffectiveMax(row, doctor);
              return (
                <div
                  key={row._key}
                  style={{
                    border: `1px solid ${row._error ? '#ef4444' : 'var(--border-color)'}`,
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '12px',
                    backgroundColor: 'var(--bg-main)'
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* Diagnosis dropdown */}
                    <div style={{ flex: '4 1 260px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                        #{idx + 1} Select Diagnosis
                      </label>
                      <select
                        className="form-select"
                        value={row.diagnosisId}
                        onChange={(e) => updateDiagnosisRow(row._key, { diagnosisId: e.target.value }, doctor)}
                      >
                        <option value="">-- Select a Diagnosis --</option>
                        {diagnosesList.map((d) => (
                          <option key={d.id} value={String(d.id)}>
                            {d.name}{d.code ? ` (${d.code})` : ''} — ৳{d.price || 0}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price */}
                    <div style={{ flex: '1 1 100px', minWidth: '90px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px', whiteSpace: 'nowrap' }}>Price (৳)</label>
                      <input
                        type="number"
                        className="form-input"
                        readOnly
                        value={row._price}
                        style={{ backgroundColor: 'var(--table-header-bg)', cursor: 'default' }}
                      />
                    </div>

                    {/* Discount type */}
                    <div style={{ flex: '1.5 1 140px', minWidth: '130px' }}>
                      <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px', whiteSpace: 'nowrap' }}>Discount Type</label>
                      <select
                        className="form-select"
                        value={row.discountType}
                        onChange={(e) => updateDiagnosisRow(row._key, { discountType: e.target.value, discountValue: 0 }, doctor)}
                      >
                        <option value="NONE">None</option>
                        <option value="PERCENT">Percent (%)</option>
                        <option value="FIXED">Fixed (৳)</option>
                      </select>
                    </div>

                    {/* Discount value */}
                    {row.discountType !== 'NONE' && (
                      <div style={{ flex: '2 1 160px', minWidth: '150px' }}>
                        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                          {row.discountType === 'PERCENT' ? `Value (max ${effPct}%)` : `Amount (max ৳${effFixed})`}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          className="form-input"
                          value={row.discountValue}
                          onChange={(e) => updateDiagnosisRow(row._key, { discountValue: e.target.value }, doctor)}
                          style={{ borderColor: row._error ? '#ef4444' : '' }}
                        />
                      </div>
                    )}

                  {/* Net price */}
                  <div style={{ flex: '0 0 100px' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Net (৳)</label>
                    <div
                      style={{
                        padding: '8px 12px',
                        backgroundColor: 'var(--primary-light)',
                        borderRadius: '6px',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        textAlign: 'right',
                        border: '1px solid rgba(13,148,136,0.2)',
                        height: '38px',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'flex-end'
                      }}
                    >
                      ৳{(parseFloat(row._netPrice) || 0).toFixed(2)}
                    </div>
                  </div>

                  {/* Remove button */}
                  <div style={{ flex: '0 0 36px', display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
                    <button
                      type="button"
                      onClick={() => removeDiagnosisRow(row._key)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '6px' }}
                      title="Remove Diagnosis"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Error text */}
                {row._error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
                    <AlertCircle size={14} />
                    {row._error}
                  </div>
                )}
              </div>
            );
          })}

            {prescriptionForm.diagnoses.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '10px 4px', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Total Diagnosis Net Cost:</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>৳{totalDiagNet.toFixed(2)}</strong>
              </div>
            )}

            {prescriptionForm.diagnoses.some((r) => r.discountType !== 'NONE') && (
              <div style={{ fontSize: '0.8rem', color: '#d97706', fontStyle: 'italic', padding: '8px 12px', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)', marginTop: '6px' }}>
                ★ Discounts are applicable only if diagnoses are performed within this centre.
              </div>
            )}
          </div>

          {/* Medicines Section */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 700 }}>
              <Pill size={18} color="var(--primary)" />
              <span>Prescribed Medicines & Dosage *</span>
            </label>
            <textarea
              className="form-textarea"
              rows="6"
              required
              placeholder={"1. Tab. Napa 500mg - 1 + 0 + 1 (After meal) - 5 days\n2. Syr. Histacin 5ml - 0 + 0 + 1 (Bedtime) - 3 days"}
              value={prescriptionForm.medicines}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicines: e.target.value })}
              style={{ fontFamily: 'Courier New, monospace', fontSize: '0.95rem', lineHeight: 1.6 }}
            />
          </div>

          {/* Special Advice Section */}
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
              Special Advice & Follow-up Instructions
            </label>
            <textarea
              className="form-textarea"
              rows="4"
              placeholder="e.g. Gargle with warm salt water. Drink plenty of fluids. Follow up after 7 days if symptoms persist."
              value={prescriptionForm.advice}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, advice: e.target.value })}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} style={{ padding: '10px 20px' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={hasDiscountErrors()} style={{ padding: '10px 24px', fontSize: '0.95rem' }}>
              <CheckCircle size={18} />
              <span>{isEdit ? 'Save Prescription Changes' : 'Submit Prescription & Mark Visited'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
