import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import Image from 'next/image';
import 'leaflet/dist/leaflet.css';

// Override default icon paths (avoid bundler issues with Leaflet default images)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function LeafletMap({ properties, height = '500px' }) {
  const center = properties?.length ? [properties[0].latitude || 10.489, properties[0].longitude || -66.879] : [10.489, -66.879];

  return (
    <div className="w-full" style={{ height }}>
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full rounded-lg overflow-hidden">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {properties.map((p) => {
          if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') return null;
          const customIcon = p.image_url
            ? L.icon({
                iconUrl: p.image_url,
                iconSize: [40, 40],
                className: 'rounded-full shadow-lg object-cover',
              })
            : undefined;
          return (
            <Marker key={p.id} position={[p.latitude, p.longitude]} icon={customIcon}>
              <Tooltip direction="top" offset={[0, -10]} opacity={1} className="!p-0 !bg-transparent">
                <div className="bg-white rounded shadow-lg overflow-hidden w-40">
                  {p.image_url && (
                    <Image src={p.image_url} alt={p.title} width={160} height={90} className="object-cover" />
                  )}
                  <div className="p-2">
                    <p className="text-primary font-semibold text-xs mb-1">${p.price?.toLocaleString() || '—'}</p>
                    <p className="text-[10px] text-gray-700 line-clamp-2">{p.property_type}</p>
                  </div>
                </div>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
} 