import { useEffect, useRef, useCallback } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

const DARK_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

const DEFAULT_CENTER = { lat: 22.3072, lng: 70.7872 };
const DEFAULT_ZOOM = 12;

let mapsLoadPromise = null;

function loadGoogleMaps(apiKey) {
  if (mapsLoadPromise) return mapsLoadPromise;

  mapsLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      resolve(window.google);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

export default function Map({
  properties = [],
  selectedId,
  onPropertySelect,
  onPropertyNavigate,
  onMapClick,
  interactive = false,
  markerPosition,
  darkTheme = true,
  compact = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const clustererRef = useRef(null);
  const infoWindowRef = useRef(null);
  const clickMarkerRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const initMap = useCallback(async () => {
    if (!apiKey || !containerRef.current) return;

    try {
      const google = await loadGoogleMaps(apiKey);

      const center = properties.length > 0 && properties[0].lat && properties[0].lng
        ? { lat: Number(properties[0].lat), lng: Number(properties[0].lng) }
        : DEFAULT_CENTER;

      const map = new google.maps.Map(containerRef.current, {
        center,
        zoom: DEFAULT_ZOOM,
        styles: darkTheme ? DARK_STYLES : [],
        disableDefaultUI: compact,
        zoomControl: true,
        mapTypeControl: !compact,
        streetViewControl: false,
        fullscreenControl: !compact,
      });

      mapRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();

      if (interactive && onMapClick) {
        map.addListener('click', (e) => {
          const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          onMapClick(pos);

          if (clickMarkerRef.current) clickMarkerRef.current.setMap(null);
          clickMarkerRef.current = new google.maps.Marker({
            position: pos,
            map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#2563EB',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
          });
        });
      }
    } catch (err) {
      console.error('Google Maps failed to load:', err);
    }
  }, [apiKey, darkTheme, compact, interactive, onMapClick]);

  useEffect(() => {
    initMap();
    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      if (clustererRef.current) clustererRef.current.clearMarkers();
    };
  }, [initMap]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
      clustererRef.current = null;
    }

    const google = window.google;
    const markers = properties
      .filter((p) => p.lat && p.lng)
      .map((p) => {
        const marker = new google.maps.Marker({
          position: { lat: Number(p.lat), lng: Number(p.lng) },
          title: `${p.property_type} — ${p.locality || p.area || p.city || 'Property'}`,
        });

        marker.addListener('click', () => {
          const currentOwner = p.property_owners?.find((o) => o.is_current_owner);
          const btnId = `map-nav-${p.id}`;
          infoWindowRef.current.setContent(`
            <div style="font-family:Inter,sans-serif;font-size:13px;max-width:240px;line-height:1.5;cursor:pointer" id="${btnId}">
              <strong style="font-size:14px">${p.locality || p.area || 'Property'}</strong><br/>
              <span style="color:#6b7280">${p.property_type} · ${p.city || ''}</span><br/>
              ${p.total_price ? `<strong style="color:#2563eb">₹${Number(p.total_price) >= 10000000 ? (Number(p.total_price) / 10000000).toFixed(2) + ' Cr' : Number(p.total_price) >= 100000 ? (Number(p.total_price) / 100000).toFixed(2) + ' L' : Number(p.total_price).toLocaleString('en-IN')}</strong><br/>` : ''}
              ${currentOwner ? `<span style="color:#6b7280">Owner: ${currentOwner.owner_name}</span><br/>` : ''}
              <span style="color:#2563eb;font-size:12px;font-weight:500;margin-top:4px;display:inline-block">View / Edit Details →</span>
            </div>
          `);
          infoWindowRef.current.open(mapRef.current, marker);
          onPropertySelect?.(p.id);

          setTimeout(() => {
            const el = document.getElementById(btnId);
            if (el) el.addEventListener('click', () => onPropertyNavigate?.(p.id));
          }, 100);
        });

        return marker;
      });

    markersRef.current = markers;

    if (markers.length > 0) {
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers,
      });

      if (markers.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach((m) => bounds.extend(m.getPosition()));
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [properties, onPropertySelect]);

  useEffect(() => {
    if (!mapRef.current || !selectedId || !window.google) return;
    const prop = properties.find((p) => p.id === selectedId);
    if (prop?.lat && prop?.lng) {
      mapRef.current.panTo({ lat: Number(prop.lat), lng: Number(prop.lng) });
      mapRef.current.setZoom(16);
    }
  }, [selectedId, properties]);

  useEffect(() => {
    if (!mapRef.current || !markerPosition || !window.google) return;
    if (clickMarkerRef.current) clickMarkerRef.current.setMap(null);
    const google = window.google;
    clickMarkerRef.current = new google.maps.Marker({
      position: markerPosition,
      map: mapRef.current,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#2563EB',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
    });
    mapRef.current.panTo(markerPosition);
  }, [markerPosition]);

  if (!apiKey) {
    return (
      <div className="map-placeholder">
        Set VITE_GOOGLE_MAPS_API_KEY in .env to enable maps
      </div>
    );
  }

  return <div ref={containerRef} className="map-container" />;
}
