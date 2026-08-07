import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Stethoscope, Plus, Edit, Trash2, X, Upload, Camera, Search, Filter } from 'lucide-react';

const DAYS = [
  { short: 'Mon', full: 'Monday' },
  { short: 'Tue', full: 'Tuesday' },
  { short: 'Wed', full: 'Wednesday' },
  { short: 'Thu', full: 'Thursday' },
  { short: 'Fri', full: 'Friday' },
  { short: 'Sat', full: 'Saturday' },
  { short: 'Sun', full: 'Sunday' },
];

const matchesDay = (workingHoursStr, selectedDayShort) => {
  if (!selectedDayShort) return true;
  if (!workingHoursStr) return false;
  const str = workingHoursStr.toLowerCase();

  if (str.includes('everyday') || str.includes('daily') || str.includes('all days') || str.includes('7 days')) {
    return true;
  }

  const dayIndex = DAYS.findIndex((d) => d.short === selectedDayShort);
  if (dayIndex === -1) return true;

  const dayObj = DAYS[dayIndex];
  if (str.includes(dayObj.short.toLowerCase()) || str.includes(dayObj.full.toLowerCase())) {
    return true;
  }

  for (let startIdx = 0; startIdx < DAYS.length; startIdx++) {
    for (let endIdx = 0; endIdx < DAYS.length; endIdx++) {
      if (startIdx === endIdx) continue;
      const startD = DAYS[startIdx];
      const endD = DAYS[endIdx];

      const rangeRegex = new RegExp(`(${startD.short}|${startD.full})\\s*-\\s*(${endD.short}|${endD.full})`, 'i');
      if (rangeRegex.test(str)) {
        let i = startIdx;
        while (true) {
          if (i === dayIndex) return true;
          if (i === endIdx) break;
          i = (i + 1) % DAYS.length;
        }
      }
    }
  }

  return false;
};

export const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const { user } = useContext(AuthContext);

  const [searchFilters, setSearchFilters] = useState({
    name: '',
    speciality: '',
    day: '',
  });

  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isRec = user?.role === 'ROLE_RECEPTIONIST';
  const isDoctor = user?.role === 'ROLE_DOCTOR';

  const canEditDoctor = (doc) => {
    if (isAdmin) return true;
    if (isDoctor) {
      return (
        (user?.email && doc?.email && doc.email.toLowerCase() === user.email.toLowerCase()) ||
        (user?.fullName && doc?.fullName && doc.fullName.toLowerCase() === user.fullName.toLowerCase())
      );
    }
    return false;
  };

  const [usernameError, setUsernameError] = useState(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);

  const [formData, setFormData] = useState({
    fullName: '',
    specialization: '',
    qualification: '',
    phone: '',
    email: '',
    roomNo: '',
    consultationFee: 100,
    maxDiscountPercent: 0,
    maxDiscountFixed: 0,
    workingHours: 'Mon-Fri 09:00 - 17:00',
    appointmentDurationMinutes: 20,
    profileImage: '',
    active: true,
    username: '',
    password: '',
  });

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const openModal = (doctor = null) => {
    setUsernameError(null);
    setUsernameSuggestions([]);
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        fullName: doctor.fullName,
        specialization: doctor.specialization,
        qualification: doctor.qualification || '',
        phone: doctor.phone || '',
        email: doctor.email || '',
        roomNo: doctor.roomNo || '',
        consultationFee: doctor.consultationFee || 100,
        maxDiscountPercent: doctor.maxDiscountPercent ?? 0,
        maxDiscountFixed: doctor.maxDiscountFixed ?? 0,
        workingHours: doctor.workingHours || 'Mon-Fri 09:00 - 17:00',
        appointmentDurationMinutes: doctor.appointmentDurationMinutes || 20,
        profileImage: doctor.profileImage || '',
        active: doctor.active,
        username: '',
        password: '',
      });
    } else {
      setEditingDoctor(null);
      setFormData({
        fullName: '',
        specialization: '',
        qualification: '',
        phone: '',
        email: '',
        roomNo: '',
        consultationFee: 100,
        maxDiscountPercent: 0,
        maxDiscountFixed: 0,
        workingHours: 'Mon-Fri 09:00 - 17:00',
        appointmentDurationMinutes: 20,
        profileImage: '',
        active: true,
        username: '',
        password: '',
      });
    }
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please select an image smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuggestions([]);

    if (!editingDoctor) {
      if (!formData.username || !formData.username.trim()) {
        setUsernameError('Username is required for doctor creation.');
        return;
      }
      if (!formData.password || formData.password.trim().length < 6) {
        setUsernameError('Password must be at least 6 characters long.');
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        maxDiscountPercent: formData.maxDiscountPercent === '' ? 0 : Number(formData.maxDiscountPercent),
        maxDiscountFixed: formData.maxDiscountFixed === '' ? 0 : Number(formData.maxDiscountFixed),
      };
      if (editingDoctor) {
        await api.put(`/doctors/${editingDoctor.id}`, payload);
      } else {
        await api.post('/doctors', payload);
      }
      setShowModal(false);
      fetchDoctors();
    } catch (err) {
      const resData = err.response?.data;
      if (resData?.suggestions) {
        setUsernameError(resData.message || 'Username is already taken');
        setUsernameSuggestions(resData.suggestions || []);
      } else {
        alert(resData?.message || 'Failed to save doctor details');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete doctor record?')) {
      try {
        await api.delete(`/doctors/${id}`);
        fetchDoctors();
      } catch (err) {
        alert('Failed to delete doctor');
      }
    }
  };

  const allSpecialities = Array.from(
    new Set(doctors.map((d) => d.specialization).filter(Boolean))
  ).sort();

  const filteredDoctors = doctors.filter((doc) => {
    if (searchFilters.name.trim()) {
      const q = searchFilters.name.toLowerCase().trim();
      const matchName = doc.fullName && doc.fullName.toLowerCase().includes(q);
      if (!matchName) return false;
    }

    if (searchFilters.speciality) {
      if (doc.specialization !== searchFilters.speciality) return false;
    }

    if (searchFilters.day) {
      if (!matchesDay(doc.workingHours, searchFilters.day)) return false;
    }

    return true;
  });

  return (
    <div>
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="card-title">Doctor Profiles & Schedules</div>
          {(isAdmin || isRec) && (
            <button className="btn btn-primary" onClick={() => openModal()}>
              <Plus size={16} />
              <span>Add New Doctor</span>
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            backgroundColor: 'var(--table-header-bg)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
            <Filter size={18} color="var(--primary)" />
            <span>Search & Filter:</span>
          </div>

          {/* 1. Doctor Name Search */}
          <div style={{ flex: '1 1 220px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Doctor Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by doctor name..."
                value={searchFilters.name}
                onChange={(e) => setSearchFilters({ ...searchFilters, name: e.target.value })}
                style={{ paddingLeft: '34px', fontSize: '0.88rem' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* 2. Doctor Speciality */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Doctor Speciality
            </label>
            <select
              className="form-select"
              style={{ fontSize: '0.88rem' }}
              value={searchFilters.speciality}
              onChange={(e) => setSearchFilters({ ...searchFilters, speciality: e.target.value })}
            >
              <option value="">All Specialities</option>
              {allSpecialities.map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          {/* 3. Doctor Available Day */}
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Available Day
            </label>
            <select
              className="form-select"
              style={{ fontSize: '0.88rem' }}
              value={searchFilters.day}
              onChange={(e) => setSearchFilters({ ...searchFilters, day: e.target.value })}
            >
              <option value="">All Days</option>
              <option value="Mon">Monday</option>
              <option value="Tue">Tuesday</option>
              <option value="Wed">Wednesday</option>
              <option value="Thu">Thursday</option>
              <option value="Fri">Friday</option>
              <option value="Sat">Saturday</option>
              <option value="Sun">Sunday</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchFilters.name || searchFilters.speciality || searchFilters.day) && (
            <div style={{ flex: '0 0 auto', alignSelf: 'flex-end', paddingBottom: '2px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSearchFilters({ name: '', speciality: '', day: '' })}
                style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              >
                <X size={14} /> Clear Filters
              </button>
            </div>
          )}
        </div>

        {filteredDoctors.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: 'var(--table-header-bg)',
              borderRadius: '12px',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-muted)'
            }}
          >
            <Stethoscope size={32} style={{ margin: '0 auto 12px auto', display: 'block', color: 'var(--text-muted)' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              No Doctors Found
            </h4>
            <p style={{ fontSize: '0.88rem', margin: 0 }}>
              No doctor profiles match your selected search filters.
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setSearchFilters({ name: '', speciality: '', day: '' })}
              style={{ marginTop: '14px' }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {filteredDoctors.map((doc) => (
              <div key={doc.id} className="card" style={{ marginBottom: 0, padding: '20px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  {doc.profileImage ? (
                    <img
                      src={doc.profileImage}
                      alt={doc.fullName}
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                    />
                  ) : (
                    <div className="stat-icon teal" style={{ width: '56px', height: '56px', borderRadius: '50%' }}>
                      <Stethoscope size={26} />
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{doc.fullName}</h3>
                    <span className="badge badge-info">{doc.specialization}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  <p><strong>Qualification:</strong> {doc.qualification || 'N/A'}</p>
                  <p><strong>Room:</strong> {doc.roomNo || 'N/A'}</p>
                  <p><strong>Fee:</strong> ৳{doc.consultationFee}</p>
                  <p><strong>Max Discount Auth:</strong> {doc.maxDiscountPercent || 0}% / ৳{doc.maxDiscountFixed || 0}</p>
                  <p><strong>Hours:</strong> {doc.workingHours}</p>
                  <p><strong>Slot Duration:</strong> {doc.appointmentDurationMinutes || 20} mins</p>
                  <p><strong>Contact:</strong> {doc.phone || doc.email}</p>
                </div>

                {canEditDoctor(doc) && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openModal(doc)}>
                      <Edit size={14} /> {isDoctor && !isAdmin ? 'Update My Profile' : 'Update Profile'}
                    </button>
                    {isAdmin && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(doc.id)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingDoctor ? 'Update Doctor Profile' : 'Register Doctor Profile'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Profile Image Section */}
              <div className="form-group" style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt="Preview"
                      style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
                    />
                  ) : (
                    <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                      <Camera size={36} />
                    </div>
                  )}

                  <label
                    htmlFor="profile-image-upload"
                    className="btn btn-primary btn-sm"
                    style={{ position: 'absolute', bottom: '0', right: '-10px', borderRadius: '50%', width: '32px', height: '32px', padding: 0, justifyContent: 'center', cursor: 'pointer' }}
                    title="Upload Profile Picture"
                  >
                    <Upload size={14} />
                  </label>
                  <input
                    id="profile-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Click icon to upload doctor photo
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Doctor Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cardiology"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Qualification</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. MD, MBBS"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Room / Suite No.</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.roomNo}
                    onChange={(e) => setFormData({ ...formData, roomNo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Fee (৳)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                  />
                </div>
              </div>

              {/* Discount caps — admin only */}
              {isAdmin && (
                <div style={{ backgroundColor: 'var(--table-header-bg)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Max Diagnosis Discount Authority
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Max Discount (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        className="form-input"
                        placeholder="e.g. 20"
                        value={formData.maxDiscountPercent}
                        onChange={(e) => setFormData({ ...formData, maxDiscountPercent: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Max Discount (৳)</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="form-input"
                        placeholder="e.g. 500"
                        value={formData.maxDiscountFixed}
                        onChange={(e) => setFormData({ ...formData, maxDiscountFixed: e.target.value })}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Set to 0 to disallow discounts. Doctor can apply up to the maximum on any single diagnosis.
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Working Hours / Days</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.workingHours}
                    onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Appointment Duration (Mins)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.appointmentDurationMinutes}
                    onChange={(e) => setFormData({ ...formData, appointmentDurationMinutes: parseInt(e.target.value) || 20 })}
                  />
                </div>
              </div>

              {/* Doctor User Login Credentials (New Doctor Only) - Placed at Bottom */}
              {!editingDoctor && (
                <div style={{ backgroundColor: 'var(--table-header-bg)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginTop: '12px', marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🔑 Doctor User Account Credentials
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Username *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. dr_jenkins"
                        value={formData.username}
                        onChange={(e) => {
                          setFormData({ ...formData, username: e.target.value });
                          setUsernameError(null);
                        }}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Password *</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Min 6 characters"
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          setUsernameError(null);
                        }}
                        required
                      />
                    </div>
                  </div>

                  {usernameError && (
                    <div style={{ marginTop: '12px', padding: '10px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px' }}>
                      <div style={{ color: 'var(--danger)', fontSize: '0.84rem', fontWeight: 600, marginBottom: usernameSuggestions.length > 0 ? '8px' : 0 }}>
                        ⚠️ {usernameError}
                      </div>
                      {usernameSuggestions.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-main)', marginBottom: '6px', fontWeight: 600 }}>
                            Available Username Suggestions (click to select):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {usernameSuggestions.map((sug, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.78rem', borderRadius: '6px', fontWeight: 600, borderColor: 'var(--primary)', color: 'var(--primary)' }}
                                onClick={() => {
                                  setFormData({ ...formData, username: sug });
                                  setUsernameError(null);
                                }}
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Doctor Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
