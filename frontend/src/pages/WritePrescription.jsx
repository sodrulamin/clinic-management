import React, { useState, useEffect, useContext, useRef } from 'react';
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

const AutoCompleteInput = ({ value, onChange, placeholder, fetchUrl, style }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef(null);

  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
      });
    }
  };

  useEffect(() => {
    let active = true;
    const fetchSuggestions = async () => {
      try {
        const res = await api.get(`${fetchUrl}?query=${encodeURIComponent(value || '')}`);
        if (active) {
          setSuggestions(res.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions', err);
      }
    };

    fetchSuggestions();

    return () => {
      active = false;
    };
  }, [value, fetchUrl]);

  useEffect(() => {
    if (showDropdown) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [showDropdown]);

  return (
    <div style={{ width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        className="form-input"
        style={style}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          updateCoords();
          setShowDropdown(true);
        }}
        onFocus={() => {
          updateCoords();
          setShowDropdown(true);
        }}
        onBlur={() => {
          setTimeout(() => setShowDropdown(false), 200);
        }}
      />

      {showDropdown && suggestions.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 999999,
            backgroundColor: 'var(--bg-card)',
            border: '1.5px solid var(--primary)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            maxHeight: '220px',
            overflowY: 'auto'
          }}
        >
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item);
                setShowDropdown(false);
              }}
              style={{
                padding: '9px 12px',
                fontSize: '0.88rem',
                fontWeight: 500,
                cursor: 'pointer',
                borderBottom: idx < suggestions.length - 1 ? '1px solid var(--border-color)' : 'none',
                color: 'var(--text-main)',
                backgroundColor: 'var(--bg-card)',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--table-header-bg)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card)')}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
    medicinesList: [],
    medicines: '',
    advice: '',
    reason: '',
    discount: 0,
    diagnoses: [],
  });

  const emptyMedicineRow = () => ({
    _key: Math.random().toString(36).slice(2),
    type: 'Tab.',
    name: '',
    instruction: '',
    doses: '',
    duration: '',
  });

  const addMedicineRow = () => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicinesList: [...prev.medicinesList, emptyMedicineRow()],
    }));
  };

  const updateMedicineRow = (key, patch) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicinesList: prev.medicinesList.map((r) => (r._key === key ? { ...r, ...patch } : r)),
    }));
  };

  const removeMedicineRow = (key) => {
    setPrescriptionForm((prev) => ({
      ...prev,
      medicinesList: prev.medicinesList.filter((r) => r._key !== key),
    }));
  };

  const emptyDiagnosisRow = () => ({
    _key: Math.random().toString(36).slice(2),
    diagnosisId: '',
    discountType: 'NONE',
    discountValue: 0,
    instructions: '',
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

        let medicinesList = [];
        let medicines = '';
        let advice = '';
        let reason = app.reason || '';
        let discount = app.discount || 0;
        let diagnoses = [];

        try {
          const rxRes = await api.get(`/prescriptions/appointment/${app.id}`);
          if (rxRes.data) {
            medicines = rxRes.data.medicines || '';
            advice = rxRes.data.advice || '';
            discount = app.discount !== undefined ? app.discount : (rxRes.data.appointment?.discount || 0);
            if (rxRes.data.appointment?.reason) {
              reason = rxRes.data.appointment.reason;
            }

            if (rxRes.data.prescriptionMedicines && rxRes.data.prescriptionMedicines.length > 0) {
              medicinesList = rxRes.data.prescriptionMedicines.map((pm) => ({
                _key: Math.random().toString(36).slice(2),
                type: pm.type || 'Tab.',
                name: pm.name || '',
                instruction: pm.instruction || '',
                doses: pm.doses || '',
                duration: pm.duration || '',
              }));
            }

            if (rxRes.data.prescriptionDiagnoses && rxRes.data.prescriptionDiagnoses.length > 0) {
              diagnoses = rxRes.data.prescriptionDiagnoses.map((pd) => ({
                _key: Math.random().toString(36).slice(2),
                diagnosisId: pd.diagnosis?.id ? String(pd.diagnosis.id) : '',
                discountType: pd.discountType || 'NONE',
                discountValue: pd.discountValue || 0,
                instructions: pd.instructions || '',
                _price: pd.diagnosisPrice || 0,
                _netPrice: pd.netPrice || 0,
                _error: '',
              }));
            }
          }
        } catch (rxErr) {
          // No existing prescription found yet (e.g. 404)
        }

        setPrescriptionForm({ medicinesList, medicines, advice, reason, discount, diagnoses });
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
          instructions: r.instructions || null,
        }));

      const medicinesListPayload = prescriptionForm.medicinesList
        .filter((m) => m.name && m.name.trim())
        .map((m) => ({
          type: m.type,
          name: m.name.trim(),
          instruction: m.instruction || null,
          doses: m.doses || null,
          duration: m.duration || null,
        }));

      await api.post('/prescriptions', {
        appointmentId: appointment.id,
        diagnoses: diagnosesPayload,
        medicinesList: medicinesListPayload,
        medicines: prescriptionForm.medicines,
        advice: prescriptionForm.advice,
        reason: prescriptionForm.reason,
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
      </div>

      <div className="card" style={{ padding: '28px' }}>
        {/* 1. Patient Details Header Banner */}
        <div
          style={{
            backgroundColor: 'var(--table-header-bg)',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="stat-icon teal" style={{ width: '48px', height: '48px', borderRadius: '50%' }}>
              <User size={24} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.15rem', fontWeight: 700 }}>
                {appointment.patient?.fullName}
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <span>Phone: <strong>{appointment.patient?.phone}</strong></span>
                {appointment.patient?.age && <span>Age: <strong>{appointment.patient.age} yrs</strong></span>}
                {appointment.patient?.gender && <span>Gender: <strong>{appointment.patient.gender}</strong></span>}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '2px' }}>
              <Calendar size={15} color="var(--primary)" />
              <span>{appointment.appointmentDate}</span>
              <Clock size={15} color="var(--primary)" style={{ marginLeft: '6px' }} />
              <span>{appointment.timeSlot}</span>
            </div>
            <div style={{ marginTop: '4px' }}>
              Doctor: <strong>{doctor?.fullName}</strong> ({doctor?.specialization})
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 1. Reason for Visit Segment (Editable) */}
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 700 }}>
              <Stethoscope size={18} color="var(--primary)" />
              <span>Reason for Visit</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Fever, cough, Routine checkup..."
              value={prescriptionForm.reason}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, reason: e.target.value })}
              style={{ fontSize: '0.92rem', padding: '10px 14px' }}
            />
          </div>

          {/* 3. Prescribed Medicines & Dosage (Editable Table with Auto-Suggestions) */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <label className="form-label" style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                  <Pill size={18} color="var(--primary)" />
                  <span>Prescribed Medicines & Dosage</span>
                </label>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Add prescribed medicines, dosages, and administration instructions for the patient.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addMedicineRow}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusCircle size={15} />
                <span>Add Medicine</span>
              </button>
            </div>

            {prescriptionForm.medicinesList.length === 0 ? (
              <div
                onClick={addMedicineRow}
                style={{
                  textAlign: 'center',
                  padding: '24px 16px',
                  backgroundColor: 'var(--table-header-bg)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <Pill size={24} style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--text-muted)' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>No Medicines Added Yet</div>
                <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>Click here or "+ Add Medicine" above to add a medicine entry.</div>
              </div>
            ) : (
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ width: '100%', minWidth: '780px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Type</th>
                      <th style={{ minWidth: '220px' }}>Medicine Name (with weight/size)</th>
                      <th style={{ width: '130px' }}>Doses</th>
                      <th style={{ minWidth: '200px' }}>Instruction</th>
                      <th style={{ width: '140px' }}>Prescribed Till</th>
                      <th style={{ width: '50px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptionForm.medicinesList.map((row) => (
                      <tr key={row._key}>
                        <td>
                          <select
                            className="form-select"
                            style={{ fontSize: '0.88rem', padding: '6px 10px' }}
                            value={row.type}
                            onChange={(e) => updateMedicineRow(row._key, { type: e.target.value })}
                          >
                            <option value="Tab.">Tab.</option>
                            <option value="Syr.">Syr.</option>
                            <option value="Cap.">Cap.</option>
                            <option value="Inj.">Inj.</option>
                            <option value="Drop">Drop</option>
                            <option value="Ointment">Ointment</option>
                            <option value="Suppos.">Suppos.</option>
                            <option value="Inhaler">Inhaler</option>
                            <option value="Other">Other</option>
                          </select>
                        </td>

                        <td>
                          <AutoCompleteInput
                            value={row.name}
                            onChange={(val) => updateMedicineRow(row._key, { name: val })}
                            placeholder="e.g. Napa 500mg"
                            fetchUrl="/prescriptions/medicine-suggestions"
                            style={{ fontSize: '0.88rem', padding: '6px 10px' }}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 1+0+1"
                            style={{ fontSize: '0.88rem', padding: '6px 10px' }}
                            value={row.doses}
                            onChange={(e) => updateMedicineRow(row._key, { doses: e.target.value })}
                          />
                        </td>

                        <td>
                          <AutoCompleteInput
                            value={row.instruction}
                            onChange={(val) => updateMedicineRow(row._key, { instruction: val })}
                            placeholder="e.g. After meal"
                            fetchUrl="/prescriptions/instruction-suggestions"
                            style={{ fontSize: '0.88rem', padding: '6px 10px' }}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. 7 Days"
                            style={{ fontSize: '0.88rem', padding: '6px 10px' }}
                            value={row.duration}
                            onChange={(e) => updateMedicineRow(row._key, { duration: e.target.value })}
                          />
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '6px 8px' }}
                            onClick={() => removeMedicineRow(row._key)}
                            title="Remove Medicine"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 4. Diagnoses & Prescribed Tests */}
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
                  padding: '24px 16px',
                  backgroundColor: 'var(--table-header-bg)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <Tag size={24} style={{ margin: '0 auto 8px auto', display: 'block', color: 'var(--text-muted)' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>No Diagnoses Added Yet</div>
                <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>Click here or "+ Add Diagnosis" above to add a diagnosis.</div>
              </div>
            )}

            {prescriptionForm.diagnoses.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--table-header-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {prescriptionForm.diagnoses.map((row, idx) => {
                    const foundDiag = diagnosesList.find((d) => String(d.id) === String(row.diagnosisId));
                    const diagCapPct = foundDiag?.maxDiscountPercent;
                    const diagCapFixed = foundDiag?.maxDiscountFixed;

                    return (
                      <div
                        key={row._key}
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: '10px',
                          border: row._error ? '1px solid #ef4444' : '1px solid var(--border-color)',
                          padding: '16px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                          <div>
                            <select
                              className="form-select"
                              value={row.diagnosisId}
                              onChange={(e) => updateDiagnosisRow(row._key, { diagnosisId: e.target.value }, doctor)}
                              style={{ fontSize: '0.9rem', height: '42px' }}
                            >
                              <option value="">-- Select Diagnosis --</option>
                              {diagnosesList.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name} {d.code ? `(${d.code})` : ''} - ৳{d.price}
                                </option>
                              ))}
                            </select>
                            {row.diagnosisId && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Base Price: <strong>৳{row._price}</strong>
                                {(diagCapPct || diagCapFixed) && (
                                  <span style={{ marginLeft: '8px', color: '#d97706' }}>
                                    (Diagnosis Cap: {diagCapPct || 0}% / ৳{diagCapFixed || 0})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div>
                            <select
                              className="form-select"
                              value={row.discountType}
                              onChange={(e) => updateDiagnosisRow(row._key, { discountType: e.target.value }, doctor)}
                              style={{ fontSize: '0.9rem', height: '42px' }}
                            >
                              <option value="NONE">No Discount</option>
                              <option value="PERCENT">Percent (%)</option>
                              <option value="FIXED">Fixed Amount (৳)</option>
                            </select>
                          </div>

                          <div>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              disabled={row.discountType === 'NONE'}
                              className="form-input"
                              placeholder={row.discountType === 'PERCENT' ? '%' : '৳'}
                              value={row.discountType === 'NONE' ? '' : row.discountValue}
                              onChange={(e) => updateDiagnosisRow(row._key, { discountValue: e.target.value }, doctor)}
                              style={{ fontSize: '0.9rem', height: '42px', boxSizing: 'border-box' }}
                            />
                          </div>

                          <div>
                            <div
                              style={{
                                height: '42px',
                                boxSizing: 'border-box',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'var(--table-header-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                fontWeight: 700,
                                fontSize: '0.92rem',
                                color: row._netPrice < row._price ? '#059669' : 'var(--text-main)'
                              }}
                            >
                              ৳{row._netPrice.toFixed(2)}
                            </div>
                          </div>

                          <div>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              style={{ height: '42px', width: '42px', padding: 0, justifyContent: 'center' }}
                              onClick={() => removeDiagnosisRow(row._key)}
                              title="Remove Diagnosis"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Special Instruction for Diagnosis / Process */}
                        <div style={{ marginTop: '12px' }}>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Special Instruction for Diagnosis / Process (e.g. Fasting 12 hours required before blood draw)"
                            value={row.instructions}
                            onChange={(e) => updateDiagnosisRow(row._key, { instructions: e.target.value }, doctor)}
                            style={{ fontSize: '0.85rem', padding: '8px 12px' }}
                          />
                        </div>

                        {row._error && (
                          <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={14} />
                            <span>{row._error}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 5. Special Advice & Follow-up Instructions */}
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', fontWeight: 700 }}>
              <CheckCircle size={18} color="var(--primary)" />
              <span>Special Advice & Follow-up Instructions</span>
            </label>
            <textarea
              className="form-textarea"
              rows="4"
              placeholder="e.g. Drink plenty of water, rest for 3 days, follow up after 1 week..."
              value={prescriptionForm.advice}
              onChange={(e) => setPrescriptionForm({ ...prescriptionForm, advice: e.target.value })}
              style={{ fontSize: '0.92rem', lineHeight: 1.5 }}
            />
          </div>

          {/* 6. Visiting Fee & Discount (Bottom of page) */}
          <div
            style={{
              backgroundColor: 'var(--table-header-bg)',
              padding: '18px 20px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              marginBottom: '28px'
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Doctor Visiting Fee Summary
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Standard Consultation Fee:</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                  ৳{(doctor?.consultationFee || 0).toFixed(2)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', margin: 0, marginBottom: '4px' }}>
                    Visiting Fee Discount (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={doctor?.consultationFee || 9999}
                    step="any"
                    className="form-input"
                    placeholder="0.00"
                    value={prescriptionForm.discount}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, discount: e.target.value })}
                    style={{ width: '160px', height: '42px', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textAlign: 'right' }}>
                    Net Visiting Fee Collected
                  </div>
                  <div
                    style={{
                      height: '42px',
                      padding: '0 16px',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      backgroundColor: 'var(--bg-card)',
                      border: '1.5px solid var(--primary)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: 'var(--primary)'
                    }}
                  >
                    ৳{Math.max(0, (doctor?.consultationFee || 0) - (parseFloat(prescriptionForm.discount) || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
              <CheckCircle size={18} />
              <span>{isEdit ? 'Update Prescription' : 'Save Prescription'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
