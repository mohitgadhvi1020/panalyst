import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { properties as propertiesApi, owners as ownersApi } from '../services/api';
import PropertyForm from '../components/PropertyForm';

export default function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    propertiesApi.get(id)
      .then(setProperty)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async (data, owner) => {
    setSaving(true);
    setError('');
    try {
      await propertiesApi.update(id, data);
      if (owner) {
        const currentOwner = property?.property_owners?.find((o) => o.is_current_owner);
        if (currentOwner) {
          await ownersApi.update(currentOwner.id, {
            owner_name: owner.owner_name,
            phone_number: owner.phone_number,
          });
        } else {
          await ownersApi.create(id, {
            ...owner,
            is_current_owner: true,
            start_date: new Date().toISOString().split('T')[0],
          });
        }
      }
      navigate(`/properties/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="property-form-page">
        <div className="loading-screen"><div className="spinner" /> Loading...</div>
      </div>
    );
  }

  return (
    <div className="property-form-page">
      <h1>Edit Property</h1>
      {error && <div className="error-banner">{error}</div>}
      <PropertyForm initial={property} onSubmit={handleSubmit} loading={saving} isEdit />
    </div>
  );
}
