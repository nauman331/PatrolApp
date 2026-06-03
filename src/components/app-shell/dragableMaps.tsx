import { useEffect, useRef, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// ── Recenter map when lat/lng props change ────────────────────────────────────
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat, lng });
  }, [map, lat, lng]);
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
interface DraggableMapProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

function MapInner({ lat, lng, onChange }: DraggableMapProps) {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  // Click anywhere on the map to move the pin
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) onChange(e.latLng.lat(), e.latLng.lng());
    },
    [onChange]
  );

  // Drag end — read the new position from the marker element
  const handleDragEnd = useCallback(() => {
    const pos = markerRef.current?.position;
    if (!pos) return;
    if (typeof pos === "object" && "lat" in pos && "lng" in pos) {
      const lat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
      const lng = typeof pos.lng === "function" ? pos.lng() : pos.lng;
      onChange(lat as number, lng as number);
    }
  }, [onChange]);

  return (
    <Map
      defaultZoom={14}
      defaultCenter={{ lat, lng }}
      mapId="securewatch-map"           // create a Map ID in Google Cloud Console
      onClick={handleMapClick}
      gestureHandling="cooperative"
      disableDefaultUI={false}
      style={{ height: "100%", width: "100%" }}
    >
      <Recenter lat={lat} lng={lng} />
      <AdvancedMarker
        ref={markerRef}
        position={{ lat, lng }}
        draggable
        onDragEnd={handleDragEnd}
      />
    </Map>
  );
}

export default function DraggableMap({ lat, lng, onChange }: DraggableMapProps) {
  return (
    <div
      className="mb-4 overflow-hidden rounded-2xl border border-hairline"
      style={{ height: 200 }}
    >
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <MapInner lat={lat} lng={lng} onChange={onChange} />
      </APIProvider>
    </div>
  );
}