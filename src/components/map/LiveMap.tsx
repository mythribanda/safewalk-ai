import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, useMap, Marker, Popup } from "react-leaflet";
import L from "leaflet";

export type IncidentPin = {
  id: string;
  lat: number;
  lng: number;
  category: "harassment" | "stalking" | "robbery" | "road" | "suspicious";
  label: string;
};

const CAT_COLOR: Record<IncidentPin["category"], string> = {
  harassment: "#EF4444",
  stalking: "#F59E0B",
  robbery: "#EC4899",
  road: "#06B6D4",
  suspicious: "#8B5CF6",
};

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.setView([lat, lng], map.getZoom(), { animate: true }); }, [lat, lng, map]);
  return null;
}

export function LiveMap({
  center, user, mode, incidents, geofenceRadius, route,
}: {
  center: { lat: number; lng: number };
  user?: { lat: number; lng: number } | null;
  mode: "day" | "evening" | "night" | "rush";
  incidents: IncidentPin[];
  geofenceRadius: number; // meters
  route?: Array<{ lat: number; lng: number }>;
}) {
  const overlay = mode === "day" ? "#10B981" : mode === "evening" ? "#F59E0B" : mode === "rush" ? "#EC4899" : "#EF4444";

  // Fake heat clusters around center for community risk
  const risk = [
    { lat: center.lat + 0.002, lng: center.lng + 0.002, r: 180 },
    { lat: center.lat - 0.0015, lng: center.lng + 0.003, r: 140 },
    { lat: center.lat + 0.0025, lng: center.lng - 0.0028, r: 220 },
  ];

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={16}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
      style={{ width: "100%", height: "100%", background: "#0a0d18" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains={["a", "b", "c", "d"]}
      />
      {user && <Recenter lat={user.lat} lng={user.lng} />}

      {/* Risk overlay zones */}
      {mode !== "day" && risk.map((r, i) => (
        <Circle key={i} center={[r.lat, r.lng]} radius={r.r}
          pathOptions={{ color: overlay, weight: 0, fillColor: overlay, fillOpacity: 0.18 }} />
      ))}

      {/* Geofence around user */}
      {user && (
        <Circle center={[user.lat, user.lng]} radius={geofenceRadius}
          pathOptions={{ color: "#10B981", weight: 1.5, dashArray: "6 8", fillColor: "#10B981", fillOpacity: 0.06 }} />
      )}

      {/* Route */}
      {route && route.length > 1 && (
        <Polyline positions={route.map((p) => [p.lat, p.lng]) as [number, number][]}
          pathOptions={{ color: "#8B5CF6", weight: 4, opacity: 0.9 }} />
      )}

      {/* User pulsing marker */}
      {user && (
        <>
          <CircleMarker center={[user.lat, user.lng]} radius={18}
            pathOptions={{ color: "#8B5CF6", weight: 0, fillColor: "#8B5CF6", fillOpacity: 0.18 }} />
          <CircleMarker center={[user.lat, user.lng]} radius={7}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#8B5CF6", fillOpacity: 1 }} />
        </>
      )}

      {/* Incident pins */}
      {incidents.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={buildPinIcon(CAT_COLOR[p.category])}>
          <Popup>{p.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function buildPinIcon(color: string) {
  const html = `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #08090F;box-shadow:0 0 0 2px ${color}55, 0 4px 12px rgba(0,0,0,.5)"></div>`;
  return L.divIcon({ html, className: "", iconSize: [22, 22], iconAnchor: [11, 22] });
}
