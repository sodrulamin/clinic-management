import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Stethoscope, Plus, Edit, Trash2, X, Upload, Camera } from 'lucide-react';

export const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const { user } = useContext(AuthContext);

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
      alert(err.response?.data?.message || 'Failed to save doctor details');
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

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Doctor Profiles & Schedules</div>
          {(isAdmin || isRec) && (
            <button className="btn btn-primary" onClick={() => openModal()}>
              <Plus size={16} />
              <span>Add New Doctor</span>
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {doctors.map((doc) => (
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
                <label className="form-label">Doctor Full Name</label>
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
