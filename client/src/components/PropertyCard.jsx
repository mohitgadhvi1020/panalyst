import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../services/api';

export default function PropertyCard({ property, selected, onHover }) {
  const navigate = useNavigate();
  const currentOwner = property.property_owners?.find((o) => o.is_current_owner);

  const location = [property.locality, property.area, property.city]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className={`property-card${selected ? ' selected' : ''}`}
      onClick={() => navigate(`/properties/${property.id}`)}
      onMouseEnter={() => onHover?.(property.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="property-card-header">
        <span className={`property-card-type ${property.property_type}`}>
          {property.property_type}
        </span>
        <span className="property-card-price">
          {property.total_price ? `₹${formatPrice(property.total_price)}` : '—'}
        </span>
      </div>

      <div className="property-card-location">
        {location || 'No location'}
      </div>

      <div className="property-card-meta">
        {property.bhk && <span>{property.bhk} BHK</span>}
        {property.plot_area && <span>{property.plot_area} sq.ft</span>}
        {property.survey_no && <span>Survey: {property.survey_no}</span>}
        {property.status && (
          <span className={`status-badge ${property.status}`}>{property.status}</span>
        )}
      </div>

      {currentOwner && (
        <div className="property-card-owner">
          Owner: {currentOwner.owner_name}
          {currentOwner.phone_number && ` · ${currentOwner.phone_number}`}
        </div>
      )}
    </div>
  );
}
