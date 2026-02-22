import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../context/PropertyContext';
import Map from '../components/Map';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';

export default function Dashboard() {
  const { properties, loading, fetchProperties, searchProperties } = useProperties();
  const [selectedId, setSelectedId] = useState(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleSearch = useCallback((params) => {
    const hasFilters = Object.values(params).some((v) => v !== '' && v != null);
    if (hasFilters) {
      setIsSearchActive(true);
      searchProperties(params);
    } else {
      setIsSearchActive(false);
      fetchProperties();
    }
  }, [searchProperties, fetchProperties]);

  return (
    <div className="dashboard">
      <div className="dashboard-map">
        <Map
          properties={properties}
          selectedId={selectedId}
          onPropertySelect={setSelectedId}
          onPropertyNavigate={(id) => navigate(`/properties/${id}`)}
          darkTheme
        />
      </div>

      <div className="dashboard-sidebar">
        <div className="dashboard-header">
          <h2>Properties</h2>
          <SearchBar onSearch={handleSearch} />
        </div>

        <div className="dashboard-count">
          {loading ? 'Loading...' : `${properties.length} ${isSearchActive ? 'results' : 'properties'}`}
        </div>

        <div className="dashboard-list">
          {loading ? (
            <div className="loading-screen"><div className="spinner" /> Loading...</div>
          ) : properties.length === 0 ? (
            <div className="empty-state">
              <h3>{isSearchActive ? 'No results found' : 'No properties yet'}</h3>
              <p>{isSearchActive ? 'Try adjusting your filters' : 'Add your first property to get started'}</p>
              {!isSearchActive && (
                <p className="privacy-note">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  Your data is encrypted &amp; visible only to you
                </p>
              )}
            </div>
          ) : (
            properties.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                selected={p.id === selectedId}
                onHover={setSelectedId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
