import { useState, useEffect, useCallback } from 'react';
import { owners as ownersApi } from '../services/api';

export default function OwnerHistory({ propertyId }) {
  const [ownerList, setOwnerList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({
    owner_name: '',
    phone_number: '',
    start_date: '',
    end_date: '',
    is_current_owner: true,
    notes: '',
  });

  const fetchOwners = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const data = await ownersApi.list(propertyId);
      setOwnerList(data);
    } catch (err) {
      console.error('Failed to fetch owners:', err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchOwners();
  }, [fetchOwners]);

  const resetForm = () => {
    setForm({ owner_name: '', phone_number: '', start_date: '', end_date: '', is_current_owner: true, notes: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await ownersApi.update(editingId, form);
      } else {
        await ownersApi.create(propertyId, form);
      }
      resetForm();
      fetchOwners();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (owner) => {
    setForm({
      owner_name: owner.owner_name || '',
      phone_number: owner.phone_number || '',
      start_date: owner.start_date || '',
      end_date: owner.end_date || '',
      is_current_owner: owner.is_current_owner || false,
      notes: owner.notes || '',
    });
    setEditingId(owner.id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id) => {
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }
    setError('');
    try {
      await ownersApi.delete(id);
      setDeletingId(null);
      fetchOwners();
    } catch (err) {
      setError(err.message);
    }
  };

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  return (
    <div className="owner-history">
      <h2>
        Ownership History
        <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? 'Cancel' : '+ Add Owner'}
        </button>
      </h2>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      {showForm && (
        <form className="owner-form" onSubmit={handleSubmit}>
          <h4>{editingId ? 'Edit Owner' : 'New Owner'}</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Owner Name *</label>
              <input value={form.owner_name} onChange={set('owner_name')} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input value={form.phone_number} onChange={set('phone_number')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={2} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="is_current"
              checked={form.is_current_owner}
              onChange={set('is_current_owner')}
              style={{ width: 'auto' }}
            />
            <label htmlFor="is_current" style={{ margin: 0 }}>Current Owner</label>
          </div>
          <button type="submit" className="btn btn-primary btn-sm">
            {editingId ? 'Update' : 'Add'} Owner
          </button>
        </form>
      )}

      {loading ? (
        <div className="loading-screen"><div className="spinner" /> Loading...</div>
      ) : ownerList.length === 0 ? (
        <div className="empty-state">
          <p>No ownership records yet.</p>
        </div>
      ) : (
        <div className="owner-timeline">
          {ownerList.map((owner) => (
            <div key={owner.id} className={`owner-item${owner.is_current_owner ? ' current' : ''}`}>
              <div className="owner-item-header">
                <span className="owner-item-name">{owner.owner_name}</span>
                {owner.is_current_owner && (
                  <span className="owner-item-badge">Current</span>
                )}
              </div>
              <div className="owner-item-details">
                {owner.phone_number && <span>Phone: {owner.phone_number}</span>}
                {owner.start_date && <span>From: {owner.start_date}</span>}
                {owner.end_date && <span>To: {owner.end_date}</span>}
                {owner.notes && <span>Notes: {owner.notes}</span>}
              </div>
              <div className="owner-item-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(owner)}>Edit</button>
                {deletingId === owner.id ? (
                  <>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(owner.id)}
                    >
                      Confirm Delete
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setDeletingId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => handleDelete(owner.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
