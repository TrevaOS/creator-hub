import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapBrand {
  id: number;
  name: string;
  lat: number;
  lng: number;
  [key: string]: unknown;
}

interface MapViewProps {
  brands: MapBrand[];
  selectedBrand: MapBrand;
  onSelectBrand: (brand: MapBrand) => void;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

export default function MapView({
  brands,
  selectedBrand,
  onSelectBrand,
  center = [77.6412, 12.9716],
  zoom = 12,
  height = '100%',
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ marker: maplibregl.Marker; el: HTMLDivElement }[]>([]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center,
      zoom,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      // Brand cluster markers
      brands.forEach((brand) => {
        const el = document.createElement('div');
        el.style.cssText = `
          width: 34px; height: 34px; border-radius: 50%;
          background: white; border: 2px solid #111;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 13px; color: #111;
          cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          transition: transform 0.15s;
        `;
        const initials = brand.name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();
        el.textContent = initials;
        el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.15)'; });
        el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
        el.addEventListener('click', () => onSelectBrand(brand));

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([brand.lng, brand.lat])
          .addTo(map);

        markersRef.current.push({ marker, el });
      });

      // User dot
      const userEl = document.createElement('div');
      userEl.style.cssText = `
        width: 14px; height: 14px; border-radius: 50%;
        background: #3B82F6; border: 2.5px solid white;
        box-shadow: 0 0 0 5px rgba(59,130,246,0.25);
      `;
      new maplibregl.Marker({ element: userEl })
        .setLngLat([77.6412, 12.965])
        .addTo(map);
    });

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Highlight selected
  useEffect(() => {
    markersRef.current.forEach(({ el }, i) => {
      if (brands[i]?.id === selectedBrand.id) {
        el.style.background = '#111827';
        el.style.color = 'white';
        el.style.borderColor = '#111827';
        el.style.transform = 'scale(1.1)';
      } else {
        el.style.background = 'white';
        el.style.color = '#111';
        el.style.borderColor = '#111';
        el.style.transform = 'scale(1)';
      }
    });
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedBrand.lng, selectedBrand.lat],
        zoom: 13,
        duration: 700,
        offset: [0, 140],
      });
    }
  }, [selectedBrand]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height }} />
  );
}
