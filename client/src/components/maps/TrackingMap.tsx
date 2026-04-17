import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SHOW_DEMO_DATA } from "../../config/features";

const defaultCenter: [number, number] = [-74.006, 40.7128];
const demoMarkers: Array<{ color: string; position: [number, number] }> = [
  { color: "#22C55E", position: [-95.7129, 37.0902] },
  { color: "#8B5CF6", position: [-3.7038, 40.4168] }
];

export default function TrackingMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<mapboxgl.Map | null>(null);
  const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  useEffect(() => {
    if (!mapRef.current || !token || instanceRef.current) return;
    mapboxgl.accessToken = token;

    instanceRef.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: defaultCenter,
      zoom: 2.6
    });

    instanceRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    if (SHOW_DEMO_DATA) {
      demoMarkers.forEach((marker) => {
        new mapboxgl.Marker({ color: marker.color }).setLngLat(marker.position).addTo(instanceRef.current as mapboxgl.Map);
      });
    }

    return () => {
      instanceRef.current?.remove();
      instanceRef.current = null;
    };
  }, [token]);

  if (!token) {
    return (
      <div className="grid h-[360px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        Set `VITE_MAPBOX_TOKEN` to enable live route map.
      </div>
    );
  }

  return <div ref={mapRef} className="h-[360px] rounded-2xl border border-slate-200 dark:border-slate-800" />;
}
