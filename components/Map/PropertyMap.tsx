'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatCurrency, STAGE_COLORS } from '@/lib/utils';
import type { Property } from '@/lib/types';

// Fix Leaflet's default icon paths (Webpack/Next.js loses them otherwise)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

// Continental US default view
const US_CENTER: [number, number] = [39.5, -98.5];
const US_ZOOM = 4;

function FitToMarkers({ properties }: { properties: Property[] }) {
  const map = useMap();
  useEffect(() => {
    const points = properties
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number]);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [map, properties]);
  return null;
}

export function PropertyMap({ properties }: { properties: Property[] }) {
  const geocoded = properties.filter((p) => p.latitude != null && p.longitude != null);
  const ungeocoded = properties.length - geocoded.length;

  return (
    <div className="space-y-3">
      {ungeocoded > 0 && (
        <div className="rounded-md border border-yellow-500/50 bg-yellow-50 p-3 text-sm dark:bg-yellow-900/20">
          {ungeocoded} {ungeocoded === 1 ? 'property is' : 'properties are'} missing coordinates.
          Edit the address (or just save without changing) to trigger geocoding.
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-border" style={{ height: '70vh' }}>
        <MapContainer
          center={US_CENTER}
          zoom={US_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <FitToMarkers properties={geocoded} />
          {geocoded.map((p) => (
            <Marker
              key={p.id}
              position={[Number(p.latitude), Number(p.longitude)]}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{p.address}</div>
                  <div>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs ${STAGE_COLORS[p.current_stage] || ''}`}
                    >
                      {p.current_stage}
                    </span>
                  </div>
                  {p.purchase_price != null && (
                    <div className="text-xs">Purchase: {formatCurrency(Number(p.purchase_price))}</div>
                  )}
                  {p.estimated_arv != null && (
                    <div className="text-xs">ARV: {formatCurrency(Number(p.estimated_arv))}</div>
                  )}
                  <Link
                    href={`/properties/${p.id}`}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    View details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
