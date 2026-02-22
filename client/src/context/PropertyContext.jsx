import { createContext, useContext, useState, useCallback } from 'react';
import { properties as propertiesApi } from '../services/api';

const PropertyContext = createContext(null);

export function PropertyProvider({ children }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const data = await propertiesApi.list();
      setProperties(data);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProperties = useCallback(async (params) => {
    setLoading(true);
    try {
      const data = await propertiesApi.search(params);
      setProperties(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PropertyContext.Provider value={{ properties, loading, fetchProperties, searchProperties, setProperties }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperties() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error('useProperties must be used within PropertyProvider');
  return ctx;
}
