import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const HEATMAP_POINTS = [
  [22.719, 75.857, 0.9], [22.714, 75.862, 0.8], [22.722, 75.850, 0.7],
  [22.708, 75.870, 0.9], [22.730, 75.845, 0.6], [22.705, 75.880, 0.8],
  [22.725, 75.835, 0.5], [22.712, 75.865, 0.9], [22.718, 75.872, 0.7],
  [22.700, 75.855, 0.8], [22.735, 75.860, 0.6], [22.710, 75.840, 0.7],
];

export default function LiveMap({ position, showHeatmap = false, online = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const heatRef = useRef(null);

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const center = position ? [position.lat, position.lng] : [22.7, 75.85];
    const map = L.map(mapRef.current, { zoomControl: false }).setView(center, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);
    mapInstanceRef.current = map;
  }, []);

  // Update marker when position changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !position) return;

    const driverIcon = L.divIcon({
      className: "",
      html: `<div style="
        background:${online ? "#22c55e" : "#eab308"};
        border:3px solid white;
        border-radius:50%;
        width:18px;height:18px;
        box-shadow:0 0 ${online ? "12px #22c55e" : "6px #eab308"};
      "></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([position.lat, position.lng]);
      markerRef.current.setIcon(driverIcon);
    } else {
      markerRef.current = L.marker([position.lat, position.lng], { icon: driverIcon }).addTo(map);
      map.setView([position.lat, position.lng], 14);
    }
  }, [position, online]);

  // Heatmap layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (showHeatmap && !heatRef.current) {
      heatRef.current = L.heatLayer(HEATMAP_POINTS, {
        radius: 35, blur: 25, maxZoom: 17,
        gradient: { 0.4: "#fbbf24", 0.6: "#f97316", 1.0: "#ef4444" },
      }).addTo(map);
    } else if (!showHeatmap && heatRef.current) {
      map.removeLayer(heatRef.current);
      heatRef.current = null;
    }
  }, [showHeatmap]);

  return <div ref={mapRef} style={{ height: "100%", width: "100%" }} />;
}
