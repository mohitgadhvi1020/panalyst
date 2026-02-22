import { useState, useEffect } from 'react';
import Map from './Map';

function extractCoordsFromUrl(url) {
  if (!url) return null;
  // @lat,lng pattern (most common — clicking a spot or sharing)
  const atMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  // ?q=lat,lng or query=lat,lng
  const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  // /place/lat,lng
  const placeMatch = url.match(/\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (placeMatch) return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
  // ll=lat,lng
  const llMatch = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
  // Bare coordinates: "22.3072, 70.7872"
  const bareMatch = url.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (bareMatch) return { lat: parseFloat(bareMatch[1]), lng: parseFloat(bareMatch[2]) };
  return null;
}

const EMPTY = {
  property_type: 'residential',
  status: 'available',
  city: '',
  area: '',
  locality: '',
  address: '',
  lat: '',
  lng: '',
  total_price: '',
  price_per_sqft: '',
  plot_area: '',
  built_up_area: '',
  carpet_area: '',
  bhk: '',
  furnished_status: '',
  floor_number: '',
  total_floors: '',
  survey_no: '',
  notes: '',
};

export default function PropertyForm({ initial, onSubmit, loading, isEdit = false }) {
  const [form, setForm] = useState(EMPTY);
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');

  useEffect(() => {
    if (initial) {
      setForm((prev) => ({
        ...prev,
        ...Object.fromEntries(
          Object.entries(initial).map(([k, v]) => [k, v ?? ''])
        ),
      }));
      const currentOwner = initial.property_owners?.find((o) => o.is_current_owner);
      if (currentOwner) {
        setOwnerName(currentOwner.owner_name || '');
        setOwnerPhone(currentOwner.phone_number || '');
      }
    }
  }, [initial]);

  const [mapsLink, setMapsLink] = useState('');
  const [linkStatus, setLinkStatus] = useState('');

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleMapsLink = async (e) => {
    const url = e.target.value;
    setMapsLink(url);

    const coords = extractCoordsFromUrl(url);
    if (coords) {
      setForm((prev) => ({ ...prev, lat: coords.lat.toFixed(6), lng: coords.lng.toFixed(6) }));
      setLinkStatus(`Detected: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`);
      return;
    }

    if (!url.trim()) { setLinkStatus(''); return; }

    const isShortUrl = /goo\.gl|maps\.app|bit\.ly|short/i.test(url);
    if (isShortUrl) {
      setLinkStatus('Resolving short link...');
      try {
        const res = await fetch(`/api/resolve-url?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data.url) {
          const resolved = extractCoordsFromUrl(data.url);
          if (resolved) {
            setForm((prev) => ({ ...prev, lat: resolved.lat.toFixed(6), lng: resolved.lng.toFixed(6) }));
            setLinkStatus(`Detected: ${resolved.lat.toFixed(6)}, ${resolved.lng.toFixed(6)}`);
            return;
          }
        }
      } catch { /* fall through */ }
      setLinkStatus('Could not detect coordinates from this link');
    } else {
      setLinkStatus('Could not detect coordinates from this link');
    }
  };

  const handleMapClick = (pos) => {
    setForm((prev) => ({
      ...prev,
      lat: pos.lat.toFixed(6),
      lng: pos.lng.toFixed(6),
    }));
    setLinkStatus(`Picked: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allowedFields = Object.keys(EMPTY);
    const data = {};
    for (const k of allowedFields) {
      if (form[k] !== '' && form[k] != null) data[k] = form[k];
    }
    ['total_price', 'price_per_sqft', 'plot_area', 'built_up_area', 'carpet_area', 'lat', 'lng'].forEach((k) => {
      if (data[k]) data[k] = Number(data[k]);
    });
    ['bhk', 'floor_number', 'total_floors'].forEach((k) => {
      if (data[k]) data[k] = parseInt(data[k], 10);
    });
    const owner = ownerName.trim()
      ? { owner_name: ownerName.trim(), phone_number: ownerPhone.trim() }
      : null;
    onSubmit(data, owner);
  };

  const isResidential = form.property_type === 'residential';
  const isPlotOrAgri = form.property_type === 'plot' || form.property_type === 'agriculture';

  const markerPos = form.lat && form.lng
    ? { lat: Number(form.lat), lng: Number(form.lng) }
    : null;

  return (
    <form className="property-form" onSubmit={handleSubmit}>
      {/* Type & Status */}
      <div className="form-section">
        <h3>Basic Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Property Type *</label>
            <select value={form.property_type} onChange={set('property_type')} required>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="plot">Plot</option>
              <option value="agriculture">Agriculture</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={set('status')}>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="form-section">
        <h3>Location</h3>
        <div className="form-row-3">
          <div className="form-group">
            <label>City</label>
            <input value={form.city} onChange={set('city')} placeholder="e.g. Rajkot" />
          </div>
          <div className="form-group">
            <label>Area</label>
            <input value={form.area} onChange={set('area')} placeholder="e.g. Kalawad Road" />
          </div>
          <div className="form-group">
            <label>Locality</label>
            <input value={form.locality} onChange={set('locality')} placeholder="e.g. Shanti Nagar" />
          </div>
        </div>
        <div className="form-group">
          <label>Full Address</label>
          <input value={form.address} onChange={set('address')} placeholder="Complete address" />
        </div>
        <div className="form-group">
          <label>Google Maps Link / Coordinates</label>
          <input
            value={mapsLink}
            onChange={handleMapsLink}
            placeholder="Paste Google Maps link or type lat,lng (e.g. 22.3072, 70.7872)"
          />
          {linkStatus && (
            <span style={{
              fontSize: '12px',
              marginTop: '4px',
              display: 'block',
              color: linkStatus.startsWith('Could') ? 'var(--danger)' : 'var(--success)',
            }}>
              {linkStatus}
            </span>
          )}
        </div>
        {form.lat && form.lng && (
          <div className="form-row" style={{ marginBottom: 8 }}>
            <div className="form-group">
              <label>Latitude</label>
              <input type="number" step="any" value={form.lat} onChange={set('lat')} readOnly style={{ background: 'var(--bg-secondary)' }} />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input type="number" step="any" value={form.lng} onChange={set('lng')} readOnly style={{ background: 'var(--bg-secondary)' }} />
            </div>
          </div>
        )}
        <div className="form-group">
          <label>Or click on map to pick location</label>
          <div className="map-picker">
            <Map
              interactive
              onMapClick={handleMapClick}
              markerPosition={markerPos}
              compact
              properties={[]}
            />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="form-section">
        <h3>Pricing</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Total Price (₹)</label>
            <input type="number" value={form.total_price} onChange={set('total_price')} placeholder="e.g. 5000000" />
          </div>
          <div className="form-group">
            <label>Price per sq.ft (₹)</label>
            <input type="number" value={form.price_per_sqft} onChange={set('price_per_sqft')} placeholder="e.g. 3500" />
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="form-section">
        <h3>Dimensions</h3>
        <div className="form-row-3">
          <div className="form-group">
            <label>Plot Area (sq.ft)</label>
            <input type="number" value={form.plot_area} onChange={set('plot_area')} />
          </div>
          {isResidential && (
            <>
              <div className="form-group">
                <label>Built-up Area (sq.ft)</label>
                <input type="number" value={form.built_up_area} onChange={set('built_up_area')} />
              </div>
              <div className="form-group">
                <label>Carpet Area (sq.ft)</label>
                <input type="number" value={form.carpet_area} onChange={set('carpet_area')} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Residential Fields */}
      {isResidential && (
        <div className="form-section">
          <h3>Residential Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>BHK</label>
              <select value={form.bhk} onChange={set('bhk')}>
                <option value="">Select</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n} BHK</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Furnished Status</label>
              <select value={form.furnished_status} onChange={set('furnished_status')}>
                <option value="">Select</option>
                <option value="furnished">Furnished</option>
                <option value="semi-furnished">Semi-Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Floor Number</label>
              <input type="number" value={form.floor_number} onChange={set('floor_number')} />
            </div>
            <div className="form-group">
              <label>Total Floors</label>
              <input type="number" value={form.total_floors} onChange={set('total_floors')} />
            </div>
          </div>
        </div>
      )}

      {/* Plot / Agriculture Fields */}
      {isPlotOrAgri && (
        <div className="form-section">
          <h3>{form.property_type === 'agriculture' ? 'Agriculture' : 'Plot'} Details</h3>
          <div className="form-group">
            <label>Survey Number</label>
            <input value={form.survey_no} onChange={set('survey_no')} placeholder="e.g. 123/A" />
          </div>
        </div>
      )}

      {/* Current Owner */}
      <div className="form-section">
        <h3>Current Owner</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Owner Name</label>
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. Ramesh Patel" />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="e.g. 9876543210" />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="form-section">
        <h3>Additional Notes</h3>
        <div className="form-group">
          <textarea value={form.notes} onChange={set('notes')} placeholder="Any additional information about the property..." rows={4} />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Property'}
        </button>
      </div>
    </form>
  );
}
