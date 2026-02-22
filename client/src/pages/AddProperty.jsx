import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { properties as propertiesApi, owners as ownersApi } from '../services/api';
import PropertyForm from '../components/PropertyForm';

export default function AddProperty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (data, owner) => {
    setLoading(true);
    setError('');
    try {
      const created = await propertiesApi.create(data);
      if (owner) {
        await ownersApi.create(created.id, {
          ...owner,
          is_current_owner: true,
          start_date: new Date().toISOString().split('T')[0],
        });
      }
      navigate(`/properties/${created.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="property-form-page">
      <h1>Add New Property</h1>
      {error && <div className="error-banner">{error}</div>}
      <PropertyForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
