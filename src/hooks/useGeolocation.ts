import { useEffect, useState } from "react";

export type GeoPos = { lat: number; lng: number; accuracy: number };

export function useGeolocation(enabled = true) {
  const [pos, setPos] = useState<GeoPos | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return { pos, error };
}
