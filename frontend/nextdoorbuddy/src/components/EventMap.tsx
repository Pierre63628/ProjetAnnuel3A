import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface EventMapProps {
  address: string;
  latitude?: number;
  longitude?: number;
  eventName: string;
  className?: string;
}

const EventMap: React.FC<EventMapProps> = ({ 
  address, 
  latitude, 
  longitude, 
  eventName, 
  className = '' 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Default to Paris coordinates if no coordinates provided
    const defaultLat = 48.8566;
    const defaultLng = 2.3522;
    const lat = latitude || defaultLat;
    const lng = longitude || defaultLng;

    // Initialize map
    const map = L.map(mapRef.current).setView([lat, lng], 15);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add marker
    const marker = L.marker([lat, lng]).addTo(map);
    
    // Add popup with event information
    marker.bindPopup(`
      <div class="p-2">
        <h3 class="font-semibold text-sm mb-1">${eventName}</h3>
        <p class="text-xs text-gray-600">${address}</p>
      </div>
    `);

    // If no coordinates provided, try to geocode the address
    if (!latitude || !longitude) {
      geocodeAddress(address, map, marker);
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [address, latitude, longitude, eventName]);

  const geocodeAddress = async (address: string, map: L.Map, marker: L.Marker) => {
    try {
      // Use French government geocoding API
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        map.setView([lat, lng], 15);
        marker.setLatLng([lat, lng]);
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
  };

  return (
    <div className={`h-64 w-full rounded-lg overflow-hidden border border-gray-200 ${className}`}>
      <div ref={mapRef} className="h-full w-full" />
    </div>
  );
};

export default EventMap;
