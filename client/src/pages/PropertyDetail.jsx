import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { properties as propertiesApi, formatPrice } from '../services/api';
import Map from '../components/Map';
import OwnerHistory from '../components/OwnerHistory';
import ActivityTimeline from '../components/ActivityTimeline';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    propertiesApi.get(id)
      .then(setProperty)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setError('');
    try {
      await propertiesApi.delete(id);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="property-detail">
        <div className="loading-screen"><div className="spinner" /> Loading...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="property-detail">
        <div className="empty-state"><p>Property not found.</p></div>
      </div>
    );
  }

  const location = [property.locality, property.area, property.city].filter(Boolean).join(', ');

  return (
    <div className="property-detail">
      <button className="detail-back" onClick={() => navigate('/')}>
        &#8592; Back to Dashboard
      </button>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="detail-header">
        <div>
          <h1>{location || 'Property'}</h1>
          <div className="detail-header-meta">
            <span className={`property-card-type ${property.property_type}`}>
              {property.property_type}
            </span>
            {property.status && (
              <span className={`status-badge ${property.status}`}>
                {property.status}
              </span>
            )}
            {property.total_price && (
              <span style={{ fontWeight: 600, fontSize: '18px' }}>
                ₹{formatPrice(property.total_price)}
              </span>
            )}
          </div>
        </div>
        <div className="detail-actions">
          <Link to={`/properties/${id}/edit`} className="btn btn-secondary">Edit</Link>
          {confirmDelete ? (
            <>
              <button className="btn btn-danger" onClick={handleDelete}>Confirm Delete</button>
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <h3>Location Details</h3>
          <dl>
            {property.city && <div className="detail-field"><dt>City</dt><dd>{property.city}</dd></div>}
            {property.area && <div className="detail-field"><dt>Area</dt><dd>{property.area}</dd></div>}
            {property.locality && <div className="detail-field"><dt>Locality</dt><dd>{property.locality}</dd></div>}
            {property.address && <div className="detail-field"><dt>Address</dt><dd>{property.address}</dd></div>}
            {property.lat && <div className="detail-field"><dt>Coordinates</dt><dd>{property.lat}, {property.lng}</dd></div>}
          </dl>
        </div>

        <div className="detail-card">
          <h3>Pricing & Dimensions</h3>
          <dl>
            {property.total_price && <div className="detail-field"><dt>Total Price</dt><dd>₹{formatPrice(property.total_price)}</dd></div>}
            {property.price_per_sqft && <div className="detail-field"><dt>Price/sq.ft</dt><dd>₹{Number(property.price_per_sqft).toLocaleString('en-IN')}</dd></div>}
            {property.plot_area && <div className="detail-field"><dt>Plot Area</dt><dd>{property.plot_area} sq.ft</dd></div>}
            {property.built_up_area && <div className="detail-field"><dt>Built-up Area</dt><dd>{property.built_up_area} sq.ft</dd></div>}
            {property.carpet_area && <div className="detail-field"><dt>Carpet Area</dt><dd>{property.carpet_area} sq.ft</dd></div>}
          </dl>
        </div>

        {property.property_type === 'residential' && (
          <div className="detail-card">
            <h3>Residential Details</h3>
            <dl>
              {property.bhk && <div className="detail-field"><dt>BHK</dt><dd>{property.bhk}</dd></div>}
              {property.furnished_status && <div className="detail-field"><dt>Furnished</dt><dd>{property.furnished_status}</dd></div>}
              {property.floor_number != null && <div className="detail-field"><dt>Floor</dt><dd>{property.floor_number}</dd></div>}
              {property.total_floors != null && <div className="detail-field"><dt>Total Floors</dt><dd>{property.total_floors}</dd></div>}
            </dl>
          </div>
        )}

        {(property.property_type === 'plot' || property.property_type === 'agriculture') && property.survey_no && (
          <div className="detail-card">
            <h3>{property.property_type === 'agriculture' ? 'Agriculture' : 'Plot'} Details</h3>
            <dl>
              <div className="detail-field"><dt>Survey No</dt><dd>{property.survey_no}</dd></div>
            </dl>
          </div>
        )}

        {property.lat && property.lng && (
          <div className="detail-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="detail-map">
              <Map
                properties={[property]}
                compact
                darkTheme
              />
            </div>
          </div>
        )}
      </div>

      {property.notes && (
        <div className="detail-card" style={{ marginBottom: 32 }}>
          <h3>Notes</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
            {property.notes}
          </p>
        </div>
      )}

      <OwnerHistory propertyId={id} />

      <ActivityTimeline propertyId={id} />
    </div>
  );
}
