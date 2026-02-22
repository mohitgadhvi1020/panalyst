import { useState, useCallback } from 'react';

export default function SearchBar({ onSearch }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [bhk, setBhk] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const buildParams = useCallback(() => ({
    q, type, status, bhk, min_price: minPrice, max_price: maxPrice, owner_name: ownerName,
  }), [q, type, status, bhk, minPrice, maxPrice, ownerName]);

  const handleSearch = useCallback(() => {
    onSearch(buildParams());
  }, [onSearch, buildParams]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleQuickSearch = (e) => {
    const val = e.target.value;
    setQ(val);
    if (val === '' && !type && !status && !bhk && !minPrice && !maxPrice && !ownerName) {
      onSearch({});
    }
  };

  const handleReset = () => {
    setQ('');
    setType('');
    setStatus('');
    setBhk('');
    setMinPrice('');
    setMaxPrice('');
    setOwnerName('');
    onSearch({});
  };

  const hasAnyFilter = q || type || status || bhk || minPrice || maxPrice || ownerName;

  return (
    <div className="search-bar">
      <div className="search-quick">
        <span className="search-icon">&#128269;</span>
        <input
          type="text"
          placeholder="Search area, city, locality, address, notes..."
          value={q}
          onChange={handleQuickSearch}
          onKeyDown={handleKeyDown}
        />
        <button className="btn btn-primary btn-sm" onClick={handleSearch} style={{ flexShrink: 0 }}>
          Search
        </button>
      </div>

      <div className="search-filters-toggle">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowFilters(!showFilters)}
          style={{ fontSize: '12px' }}
        >
          {showFilters ? 'Hide Filters' : 'Filters'} {showFilters ? '▲' : '▼'}
        </button>
        {hasAnyFilter && (
          <button className="btn btn-ghost btn-sm" onClick={handleReset} style={{ fontSize: '12px', color: 'var(--danger)' }}>
            Clear All
          </button>
        )}
      </div>

      {showFilters && (
        <div className="search-filters">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="plot">Plot</option>
            <option value="agriculture">Agriculture</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
          </select>
          <select value={bhk} onChange={(e) => setBhk(e.target.value)}>
            <option value="">Any BHK</option>
            <option value="1">1 BHK</option>
            <option value="2">2 BHK</option>
            <option value="3">3 BHK</option>
            <option value="4">4 BHK</option>
            <option value="5">5+ BHK</option>
          </select>
          <input
            type="number"
            placeholder="Min Price"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            type="number"
            placeholder="Max Price"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            type="text"
            placeholder="Owner Name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      )}
    </div>
  );
}
