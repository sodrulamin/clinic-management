import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  Activity,
  Plus,
  Search,
  X,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
  FileText
} from 'lucide-react';

export const Diagnoses = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === 'ROLE_ADMIN';

  const [diagnoses, setDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const [showModal, setShowModal] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: '',
    description: '',
    price: 0,
    maxDiscountPercent: '',
    maxDiscountFixed: '',
    active: true,
  });

  const fetchDiagnoses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diagnoses');
      setDiagnoses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch diagnoses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnoses();
  }, []);

  // Unique categories list
  const categories = ['ALL', ...Array.from(new Set(diagnoses.map((d) => d.category).filter(Boolean)))];

  const handleOpenAdd = () => {
    setEditingDiagnosis(null);
    setFormData({
      name: '',
      code: '',
      category: '',
      description: '',
      price: 0,
      maxDiscountPercent: '',
      maxDiscountFixed: '',
      active: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (diag) => {
    setEditingDiagnosis(diag);
    setFormData({
      name: diag.name || '',
      code: diag.code || '',
      category: diag.category || '',
      description: diag.description || '',
      price: diag.price !== undefined ? diag.price : 0,
      maxDiscountPercent: diag.maxDiscountPercent ?? '',
      maxDiscountFixed: diag.maxDiscountFixed ?? '',
      active: diag.active !== undefined ? diag.active : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Diagnosis name is required.');
      return;
    }

    try {
      const payload = {
        ...formData,
        maxDiscountPercent: formData.maxDiscountPercent === '' ? null : Number(formData.maxDiscountPercent),
        maxDiscountFixed: formData.maxDiscountFixed === '' ? null : Number(formData.maxDiscountFixed),
      };
      if (editingDiagnosis) {
        await api.put(`/diagnoses/${editingDiagnosis.id}`, payload);
      } else {
        await api.post('/diagnoses', payload);
      }
      setShowModal(false);
      fetchDiagnoses();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleDelete = async (diag) => {
    if (window.confirm(`Are you sure you want to delete diagnosis "${diag.name}"?`)) {
      try {
        await api.delete(`/diagnoses/${diag.id}`);
        fetchDiagnoses();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete diagnosis');
      }
    }
  };

  const handleToggleActive = async (diag) => {
    try {
      await api.put(`/diagnoses/${diag.id}`, {
        ...diag,
        active: !diag.active,
      });
      fetchDiagnoses();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredDiagnoses = diagnoses.filter((d) => {
    const matchesSearch =
      (d.name && d.name.toLowerCase().includes(search.toLowerCase())) ||
      (d.code && d.code.toLowerCase().includes(search.toLowerCase())) ||
      (d.category && d.category.toLowerCase().includes(search.toLowerCase())) ||
      (d.description && d.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || d.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalCount = diagnoses.length;
  const activeCount = diagnoses.filter((d) => d.active).length;

  return (
    <div>
      {/* Top Header Metrics & Title */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon teal">
            <Activity />
          </div>
          <div>
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">Total Diagnosis Types</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <CheckCircle />
          </div>
          <div>
            <div className="stat-value">{activeCount}</div>
            <div className="stat-label">Active Diagnoses</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Tag />
          </div>
          <div>
            <div className="stat-value">{categories.length - 1}</div>
            <div className="stat-label">Medical Categories</div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div className="search-filter-group" style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: '1 1 300px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px' }}
                placeholder="Search diagnosis by name, ICD code, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ width: 'auto', minWidth: '160px' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {isAdmin && (
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              <Plus size={16} />
              <span>Add New Diagnosis</span>
            </button>
          )}
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Diagnosis Name</th>
                <th>ICD / Code</th>
                <th>Category</th>
                <th>Description</th>
                <th>Price (৳)</th>
                <th>Max Discount Cap</th>
                <th>Status</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Loading diagnoses list...
                  </td>
                </tr>
              ) : filteredDiagnoses.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No diagnoses found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredDiagnoses.map((diag) => (
                  <tr key={diag.id}>
                    <td>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{diag.name}</strong>
                    </td>
                    <td>
                      {diag.code ? (
                        <span style={{ fontFamily: 'monospace', backgroundColor: 'var(--input-bg)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.85rem' }}>
                          {diag.code}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">{diag.category || 'General'}</span>
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '0.88rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {diag.description || '-'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                      ৳{Number(diag.price || 0).toFixed(2)}
                    </td>
                    <td>
                      {diag.maxDiscountPercent > 0 || diag.maxDiscountFixed > 0 ? (
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b' }}>
                          {diag.maxDiscountPercent > 0 ? `${diag.maxDiscountPercent}%` : ''}
                          {diag.maxDiscountPercent > 0 && diag.maxDiscountFixed > 0 ? ' / ' : ''}
                          {diag.maxDiscountFixed > 0 ? `৳${diag.maxDiscountFixed}` : ''}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Doctor Default</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${diag.active ? 'badge-success' : 'badge-danger'}`}
                        style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                        onClick={() => isAdmin && handleToggleActive(diag)}
                        title={isAdmin ? 'Click to toggle active/inactive status' : ''}
                      >
                        {diag.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Edit Diagnosis"
                            onClick={() => handleOpenEdit(diag)}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            title="Delete Diagnosis"
                            onClick={() => handleDelete(diag)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Diagnosis Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="var(--primary)" />
                <h3 style={{ margin: 0 }}>{editingDiagnosis ? 'Edit Diagnosis Type' : 'Define New Diagnosis Type'}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Diagnosis Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acute Pharyngitis, Type 2 Diabetes"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">ICD / Short Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. J02.9"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ENT"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Price / Fee (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Max Discount Config */}
              <div style={{ backgroundColor: 'var(--table-header-bg)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Diagnosis Max Discount Config (Optional)
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
                      placeholder="Doctor Default"
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
                      placeholder="Doctor Default"
                      value={formData.maxDiscountFixed}
                      onChange={(e) => setFormData({ ...formData, maxDiscountFixed: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Leave empty to use doctor's default limit. If set, minimum of doctor's limit and diagnosis limit applies.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description / Medical Notes</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Provide brief medical description or diagnostic criteria..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <input
                  type="checkbox"
                  id="diagActive"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="diagActive" style={{ cursor: 'pointer', margin: 0, fontWeight: 600 }}>
                  Active (Available for Doctor Prescriptions)
                </label>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle size={16} />
                  <span>{editingDiagnosis ? 'Update Diagnosis' : 'Save Diagnosis'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
