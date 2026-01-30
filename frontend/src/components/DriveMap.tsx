import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useSettingsStore } from '@/store/settings';
import { isOutOfChina, wgsToGcj } from '@/utils/geo';
import { DrivePosition } from '@/types';
import 'leaflet/dist/leaflet.css';

// Reuse the fix for default marker icon in Leaflet from MapCard or duplicate it here
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DriveMapProps {
    positions: DrivePosition[];
    className?: string;
}

// Helper to fit bounds
function BoundsFitter({ positions }: { positions: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length > 0) {
            map.fitBounds(positions, { padding: [50, 50] });
        }
    }, [positions, map]);
    return null;
}

export function DriveMap({ positions, className = '' }: DriveMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);
    const { theme, amapKey } = useSettingsStore();

    const themeColors: Record<string, { primary: string; secondary: string; bg: string }> = {
        cyber: { primary: '#00f0ff', secondary: '#ff00aa', bg: '#0a0a0f' },
        tesla: { primary: '#cc0000', secondary: '#ffffff', bg: '#111111' },
        dark: { primary: '#4361ee', secondary: '#f72585', bg: '#1a1a2e' },
        tech: { primary: '#0077b6', secondary: '#90e0ef', bg: '#0d1b2a' },
        aurora: { primary: '#72efdd', secondary: '#7678ed', bg: '#0b132b' },
    };

    const colors = themeColors[theme] || themeColors.cyber;

    // Strategy Determination
    const hasData = positions.length > 0;
    // Check first point for location
    const isChina = hasData && !isOutOfChina(positions[0].latitude, positions[0].longitude);
    const useAmap = isChina && !!amapKey;

    // Prepare helper icons for Leaflet
    const startIcon = L.divIcon({
        className: 'start-marker',
        html: `<div style="background:${colors.primary};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    const endIcon = L.divIcon({
        className: 'end-marker',
        html: `<div style="background:${colors.secondary};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });

    // Leaflet Data
    const leafletPositions = positions.map(p => [p.latitude, p.longitude] as [number, number]);

    // AMap Effect
    useEffect(() => {
        if (!useAmap || !mapRef.current || !amapKey || positions.length === 0) return;

        let mounted = true;

        const initMap = async () => {
            try {
                const AMapLoader = await import('@amap/amap-jsapi-loader');
                const AMap = await AMapLoader.default.load({
                    key: amapKey,
                    version: '2.0',
                    plugins: ['AMap.Polyline', 'AMap.Marker'],
                });

                if (!mounted || !mapRef.current) return;

                // 1. Transform Data Standard -> GCJ-02
                const path = positions.map(p => {
                    const [gLat, gLon] = wgsToGcj(p.latitude, p.longitude);
                    return [gLon, gLat]; // AMap uses [lng, lat]
                });

                const map = new AMap.Map(mapRef.current, {
                    zoom: 14,
                    mapStyle: 'amap://styles/dark',
                });

                const polyline = new AMap.Polyline({
                    path,
                    strokeColor: colors.primary,
                    strokeWeight: 4,
                    strokeOpacity: 0.8,
                });

                map.add(polyline);

                // Start Marker
                const startMarker = new AMap.Marker({
                    position: path[0],
                    content: `<div style="background:${colors.primary};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
                    anchor: 'center',
                    offset: new AMap.Pixel(0, 0),
                });

                // End Marker
                const endMarker = new AMap.Marker({
                    position: path[path.length - 1],
                    content: `<div style="background:${colors.secondary};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
                    anchor: 'center',
                    offset: new AMap.Pixel(0, 0),
                });

                map.add([startMarker, endMarker]);
                map.setFitView();

                mapInstanceRef.current = map;
            } catch (err) {
                console.error('Map init error:', err);
            }
        };

        initMap();

        return () => {
            mounted = false;
            if (mapInstanceRef.current) {
                // @ts-expect-error AMap destroy method
                mapInstanceRef.current.destroy?.();
                mapInstanceRef.current = null;
            }
        };
    }, [useAmap, positions, amapKey, colors]);

    if (!hasData) return null;

    if (useAmap) {
        return <div ref={mapRef} className={`w-full h-full rounded-lg overflow-hidden ${className}`} />;
    }

    // Default to OpenStreetMap / Leaflet
    return (
        <MapContainer
            center={leafletPositions[0]}
            zoom={13}
            className={`w-full h-full rounded-lg overflow-hidden ${className}`}
            style={{ zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <Polyline
                positions={leafletPositions}
                pathOptions={{ color: colors.primary, weight: 4, opacity: 0.8 }}
            />
            <Marker position={leafletPositions[0]} icon={startIcon}>
                <Tooltip>起点</Tooltip>
            </Marker>
            <Marker position={leafletPositions[leafletPositions.length - 1]} icon={endIcon}>
                <Tooltip>终点</Tooltip>
            </Marker>
            <BoundsFitter positions={leafletPositions} />
        </MapContainer>
    );
}
