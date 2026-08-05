import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserPlus, Search, Edit, Trash2, X, Eye, Filter } from 'lucide-react';

export const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [viewingPatient, setViewingPatient] = useState(null);

  // Input Filter States (Form inputs)
  const [inputName, setInputName] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [inputMinAge, setInputMinAge] = useState('');
  const [inputMaxAge, setInputMaxAge] = useState('');
  const [inputStartDate, setInputStartDate] = useState('');
  const [inputEndDate, setInputEndDate] = useState('');
  const [inputBloodGroup, setInputBloodGroup] = useState('ALL');

  // Applied Filter States (Passed to API)
  const [appliedFilters, setAppliedFilters] = useState({
    name: '',
    phone: '',
    minAge: '',
    maxAge: '',
    startDate: '',
    endDate: '',
    bloodGroup: 'ALL',
  });

  // Pagination & Sorting States
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('DESC');
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    bloodGroup: 'O+',
    medicalHistory: '',
  });

  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', pageSize);
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      if (appliedFilters.name.trim()) params.append('name', appliedFilters.name.trim());
      if (appliedFilters.phone.trim()) params.append('phone', appliedFilters.phone.trim());
      if (appliedFilters.minAge !== '') params.append('minAge', appliedFilters.minAge);
      if (appliedFilters.maxAge !== '') params.append('maxAge', appliedFilters.maxAge);
      if (appliedFilters.startDate) params.append('startDate', appliedFilters.startDate);
      if (appliedFilters.endDate) params.append('endDate', appliedFilters.endDate);
      if (appliedFilters.bloodGroup && appliedFilters.bloodGroup !== 'ALL') params.append('bloodGroup', appliedFilters.bloodGroup);

      const res = await api.get(`/patients?${params.toString()}`);
      if (res.data && res.data.content) {
        setPatients(res.data.content);
        setTotalElements(res.data.totalElements || 0);
        setTotalPages(res.data.totalPages || 0);
      } else if (Array.isArray(res.data)) {
        setPatients(res.data);
        setTotalElements(res.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, pageSize, sortBy, sortDir, appliedFilters]);

  const handleFilterSubmit = (e) => {
    if (e) e.preventDefault();
    setAppliedFilters({
      name: inputName,
      phone: inputPhone,
      minAge: inputMinAge,
      maxAge: inputMaxAge,
      startDate: inputStartDate,
      endDate: inputEndDate,
      bloodGroup: inputBloodGroup,
    });
    setPage(0);
  };

  const handleClearFilters = () => {
    setInputName('');
    setInputPhone('');
    setInputMinAge('');
    setInputMaxAge('');
    setInputStartDate('');
    setInputEndDate('');
    setInputBloodGroup('ALL');
    setAppliedFilters({
      name: '',
      phone: '',
      minAge: '',
      maxAge: '',
      startDate: '',
      endDate: '',
      bloodGroup: 'ALL',
    });
    setPage(0);
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(column);
      setSortDir('ASC');
    }
    setPage(0);
  };

  const renderSortIndicator = (column) => {
    if (sortBy !== column) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>;
    return <span style={{ color: 'var(--primary)', fontWeight: 'bold', marginLeft: '4px' }}>{sortDir === 'ASC' ? '▲' : '▼'}</span>;
  };

  const openModal = (patient = null) => {
    setViewingPatient(null);
    if (patient) {
      setEditingPatient(patient);
      setFormData({
        fullName: patient.fullName,
        age: patient.age || '',
        gender: patient.gender || 'Male',
        phone: patient.phone,
        email: patient.email || '',
        address: patient.address || '',
        bloodGroup: patient.bloodGroup || 'O+',
        medicalHistory: patient.medicalHistory || '',
      });
    } else {
      setEditingPatient(null);
      setFormData({
        fullName: '',
        age: '',
        gender: 'Male',
        phone: '',
        email: '',
        address: '',
        bloodGroup: 'O+',
        medicalHistory: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPatient) {
        await api.put(`/patients/${editingPatient.id}`, formData);
      } else {
        await api.post('/patients', formData);
      }
      setShowModal(false);
      fetchPatients();
    } catch (err) {
      alert(err.response?.data || 'Failed to save patient');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient record?')) {
      try {
        await api.delete(`/patients/${id}`);
        fetchPatients();
      } catch (err) {
        alert('Failed to delete patient');
      }
    }
  };

  const isFilterActive =
    inputName ||
    inputPhone ||
    inputMinAge ||
    inputMaxAge ||
    inputStartDate ||
    inputEndDate ||
    inputBloodGroup !== 'ALL' ||
    appliedFilters.name ||
    appliedFilters.phone ||
    appliedFilters.minAge ||
    appliedFilters.maxAge ||
    appliedFilters.startDate ||
    appliedFilters.endDate ||
    appliedFilters.bloodGroup !== 'ALL';

  return (
    <div>
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Patient Database</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Manage clinic patient profiles, history, and records
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => openModal()}>
            <UserPlus size={16} />
            <span>Add New Patient</span>
          </button>
        </div>

        {/* Advanced Filters Form Section */}
        <form
          onSubmit={handleFilterSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
            backgroundColor: 'var(--table-header-bg)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Patient Name:
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: '32px', fontSize: '0.82rem', padding: '4px 10px' }}
              placeholder="Filter by name..."
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Mobile Number:
            </label>
            <input
              type="text"
              className="form-input"
              style={{ height: '32px', fontSize: '0.82rem', padding: '4px 10px' }}
              placeholder="Filter by phone..."
              value={inputPhone}
              onChange={(e) => setInputPhone(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Age Range:
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="number"
                min="0"
                className="form-input"
                style={{ height: '32px', fontSize: '0.82rem', padding: '4px 6px', width: '50%' }}
                placeholder="Min"
                value={inputMinAge}
                onChange={(e) => setInputMinAge(e.target.value)}
              />
              <input
                type="number"
                min="0"
                className="form-input"
                style={{ height: '32px', fontSize: '0.82rem', padding: '4px 6px', width: '50%' }}
                placeholder="Max"
                value={inputMaxAge}
                onChange={(e) => setInputMaxAge(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Served Date (From):
            </label>
            <input
              type="date"
              className="form-input"
              style={{ height: '32px', fontSize: '0.82rem', padding: '4px 8px' }}
              value={inputStartDate}
              onChange={(e) => setInputStartDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Served Date (To):
            </label>
            <input
              type="date"
              className="form-input"
              style={{ height: '32px', fontSize: '0.82rem', padding: '4px 8px' }}
              value={inputEndDate}
              onChange={(e) => setInputEndDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Blood Group:
            </label>
            <select
              className="form-select"
              style={{ height: '32px', fontSize: '0.82rem', padding: '4px 8px' }}
              value={inputBloodGroup}
              onChange={(e) => setInputBloodGroup(e.target.value)}
            >
              <option value="ALL">-- All Groups --</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ height: '32px', fontSize: '0.8rem', flex: 1, gap: '4px' }}
            >
              <Search size={14} />
              <span>Apply Filters</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
              style={{ height: '32px', fontSize: '0.8rem' }}
            >
              Clear Filters
            </button>
          </div>
        </form>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>SL</th>
                <th onClick={() => handleSort('fullName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Patient Name {renderSortIndicator('fullName')}
                </th>
                <th onClick={() => handleSort('age')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Age / Gender {renderSortIndicator('age')}
                </th>
                <th onClick={() => handleSort('phone')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Phone {renderSortIndicator('phone')}
                </th>
                <th onClick={() => handleSort('bloodGroup')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Blood Group {renderSortIndicator('bloodGroup')}
                </th>
                <th onClick={() => handleSort('lastServedDate')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Last Served Date {renderSortIndicator('lastServedDate')}
                </th>
                <th>Medical History</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No patient records found matching your filters.
                  </td>
                </tr>
              ) : (
                patients.map((p, idx) => (
                  <tr key={p.id}>
                    <td style={{ textAlign: 'center', fontWeight: 500, color: 'var(--text-muted)' }}>
                      {page * pageSize + idx + 1}
                    </td>
                    <td><strong>{p.fullName}</strong></td>
                    <td>{p.age ? `${p.age} yrs` : '-'} / {p.gender || 'N/A'}</td>
                    <td>{p.phone}</td>
                    <td>
                      <span className="badge badge-info">{p.bloodGroup || 'N/A'}</span>
                    </td>
                    <td>
                      {p.lastServedDate ? (
                        <span className="badge badge-success">{p.lastServedDate}</span>
                      ) : (
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Never</span>
                      )}
                    </td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.medicalHistory || 'None'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" title="View Patient Details" onClick={() => setViewingPatient(p)}>
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-secondary btn-sm" title="Edit Patient" onClick={() => openModal(p)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-danger btn-sm" title="Delete Patient" onClick={() => handleDelete(p.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Showing {totalElements > 0 ? page * pageSize + 1 : 0} to {Math.min((page + 1) * pageSize, totalElements)} of {totalElements} patients
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              <span>Page Size:</span>
              <select
                className="form-select"
                style={{ height: '30px', fontSize: '0.82rem', padding: '2px 8px' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(0);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page === 0}
                onClick={() => setPage(0)}
                title="First Page"
              >
                «
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page === 0}
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              >
                Previous
              </button>

              <span style={{ fontSize: '0.84rem', fontWeight: 600, padding: '0 8px' }}>
                Page {totalPages > 0 ? page + 1 : 0} of {totalPages}
              </span>

              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
              >
                Next
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(totalPages - 1)}
                title="Last Page"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Patient View Modal */}
      {viewingPatient && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Patient Record Summary</h3>
              <button className="modal-close-btn" onClick={() => setViewingPatient(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ lineHeight: 1.8 }}>
              <p><strong>Full Name:</strong> {viewingPatient.fullName}</p>
              <p><strong>Phone:</strong> {viewingPatient.phone}</p>
              <p><strong>Email:</strong> {viewingPatient.email || 'N/A'}</p>
              <p><strong>Age & Gender:</strong> {viewingPatient.age ? `${viewingPatient.age} yrs` : 'N/A'}, {viewingPatient.gender}</p>
              <p><strong>Blood Group:</strong> {viewingPatient.bloodGroup || 'N/A'}</p>
              <p><strong>Address:</strong> {viewingPatient.address || 'N/A'}</p>
              <p><strong>Last Served Date:</strong> {viewingPatient.lastServedDate ? <span className="badge badge-success">{viewingPatient.lastServedDate}</span> : 'Never served'}</p>
              <p><strong>Created Date:</strong> {viewingPatient.createdAt ? new Date(viewingPatient.createdAt).toLocaleString() : 'N/A'}</p>
              <div style={{ marginTop: '12px', padding: '12px', background: 'var(--input-bg)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <strong>Medical History & Notes:</strong>
                <p>{viewingPatient.medicalHistory || 'No history recorded.'}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewingPatient(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Patient Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingPatient ? 'Edit Patient Details' : 'Register New Patient'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select
                    className="form-select"
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
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

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Medical History & Conditions</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  placeholder="e.g. Allergies, past surgeries, chronic illnesses..."
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
