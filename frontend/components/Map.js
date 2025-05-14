import { useEffect, useRef } from 'react';
import Head from 'next/head'; // To include Leaflet CSS

// It's good practice to load Leaflet dynamically if it's only used on specific pages/components
// or ensure it's loaded globally in _app.js or _document.js if used frequently.

let idCounter = 0;

export default function MapDisplay({ latitude, longitude, zoom = 13, mapClassName = 'h-64 w-full rounded-lg shadow-md', markerTitle = 'Location' }) {
  const mapIdRef = useRef(`leaflet-map-display-${idCounter++}`);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && Number.isFinite(latitude) && Number.isFinite(longitude) && window.L) {
      const L = window.L;

      if (!mapRef.current) { // Initialize map only once per component instance
        mapRef.current = L.map(mapIdRef.current).setView([latitude, longitude], zoom);
        
        tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapRef.current);
        
        markerRef.current = L.marker([latitude, longitude], { title: markerTitle }).addTo(mapRef.current);
      
      } else { // If map exists, just update view and marker position
        mapRef.current.setView([latitude, longitude], zoom);
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        } else {
          markerRef.current = L.marker([latitude, longitude], { title: markerTitle }).addTo(mapRef.current);
        }
      }
    } else if (mapRef.current && (!Number.isFinite(latitude) || !Number.isFinite(longitude))) {
        // If lat/lng become invalid, clear the map or show a placeholder
        // For now, just ensures no errors if L is not available or coords are bad
    }

    // Cleanup function
    return () => {
      // Do not remove mapRef.current here if the component might re-render with new props.
      // Only remove on full unmount if necessary, handled by parent usually or if map ID is dynamic.
      // If the map ID 'leaflet-map-display' is static and multiple instances are possible,
      // more careful cleanup or dynamic IDs would be needed.
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude, zoom, markerTitle]); // Re-run if these props change

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return <div className={`${mapClassName} flex items-center justify-center bg-gray-700 text-gray-400`}>Map data unavailable.</div>;
  }

  return (
    <>
      <Head>
        {/* Ensure Leaflet CSS is loaded. Best in _app.js or _document.js if used widely */}
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""/>
        {/* Leaflet JS should also be loaded, typically via <Script> in Next.js or globally */}
      </Head>
      <div id={mapIdRef.current} className={mapClassName} style={{zIndex: 0}}></div>
    </>
  );
} 