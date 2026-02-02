import { useEffect, useRef, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap, Tooltip, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useSettingsStore } from '@/store/settings';
import { isOutOfChina, wgsToGcj } from '@/utils/geo';
import { DrivePosition } from '@/types';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export interface HeatmapPoint {
    latitude: number;
    longitude: number;
    count: number;
    value: number; // energy or other weight
    label?: string;
}

interface UniversalMapProps {
    // For Path mode (Drive)
    positions?: DrivePosition[];
    // For Single Point mode (Charge)
    marker?: {
        latitude: number;
        longitude: number;
    };
    // For Heatmap mode
    heatmapData?: HeatmapPoint[];
    className?: string;
}

// Helper to fit bounds
function BoundsFitter({ positions, marker, heatmapData }: { positions?: [number, number][]; marker?: [number, number]; heatmapData?: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (positions && positions.length > 0) {
            map.fitBounds(positions, { padding: [50, 50] });
        } else if (heatmapData && heatmapData.length > 0) {
            map.fitBounds(heatmapData, { padding: [50, 50] });
        } else if (marker) {
            map.setView(marker, 15);
        }
    }, [positions, marker, heatmapData, map]);
    return null;
}

export function UniversalMap({ positions = [], marker, heatmapData = [], className = '' }: UniversalMapProps) {
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

    const colors = useMemo(() => themeColors[theme] || themeColors.cyber, [theme]);

    // Strategy Determination
    const isPathMode = positions.length > 0;
    const isMarkerMode = !!marker;
    const isHeatmapMode = heatmapData.length > 0;
    const hasData = isPathMode || isMarkerMode || isHeatmapMode;

    // Check location for China checking
    let checkLat = 0, checkLon = 0;
    if (isPathMode) { checkLat = positions[0].latitude; checkLon = positions[0].longitude; }
    else if (isMarkerMode && marker) { checkLat = marker.latitude; checkLon = marker.longitude; }
    else if (isHeatmapMode && heatmapData.length > 0) { checkLat = heatmapData[0].latitude; checkLon = heatmapData[0].longitude; }

    const isChina = hasData && !isOutOfChina(checkLat, checkLon);
    const useAmap = isChina && !!amapKey;

    // Leaflet Icons
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

    const singleIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width: 20px; height: 20px; border-radius: 50%; background: ${colors.primary}; border: 3px solid white; box-shadow: 0 0 10px ${colors.primary};"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
    });

    // Data prep
    const leafletPathPositions = positions.map(p => [p.latitude, p.longitude] as [number, number]);
    const leafletMarkerPosition = marker ? [marker.latitude, marker.longitude] as [number, number] : undefined;
    const leafletHeatmapPositions = heatmapData.map(p => [p.latitude, p.longitude] as [number, number]);

    let center: [number, number] = [0, 0];
    if (isPathMode && leafletPathPositions.length > 0) center = leafletPathPositions[0];
    else if (isMarkerMode && leafletMarkerPosition) center = leafletMarkerPosition;
    else if (isHeatmapMode && leafletHeatmapPositions.length > 0) center = leafletHeatmapPositions[0];

    // AMap Effect
    useEffect(() => {
        if (!useAmap || !mapRef.current || !amapKey || !hasData) return;

        let mounted = true;

        const initMap = async () => {
            try {
                const AMapLoader = await import('@amap/amap-jsapi-loader');
                const AMap = await AMapLoader.default.load({
                    key: amapKey,
                    version: '2.0',
                    plugins: ['AMap.Polyline', 'AMap.Marker', 'AMap.CircleMarker'],
                });

                if (!mounted || !mapRef.current) return;

                const map = new AMap.Map(mapRef.current, {
                    zoom: 14,
                    mapStyle: 'amap://styles/dark',
                });

                // Path Mode
                if (isPathMode) {
                    const path = positions.map(p => {
                        const [gLat, gLon] = wgsToGcj(p.latitude, p.longitude);
                        return [gLon, gLat];
                    });

                    const polyline = new AMap.Polyline({
                        path,
                        strokeColor: colors.primary,
                        strokeWeight: 4,
                        strokeOpacity: 0.8,
                    });
                    map.add(polyline);

                    const startMarker = new AMap.Marker({
                        position: path[0],
                        content: `<div style="background:${colors.primary};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
                        anchor: 'center',
                        offset: new AMap.Pixel(0, 0),
                    });

                    const endMarker = new AMap.Marker({
                        position: path[path.length - 1],
                        content: `<div style="background:${colors.secondary};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
                        anchor: 'center',
                        offset: new AMap.Pixel(0, 0),
                    });

                    map.add([startMarker, endMarker]);
                    map.setFitView();
                }
                // Single Marker Mode
                else if (isMarkerMode && marker) {
                    const [gLat, gLon] = wgsToGcj(marker.latitude, marker.longitude);
                    const center = [gLon, gLat];
                    map.setZoomAndCenter(15, center);

                    const amapMarker = new AMap.Marker({
                        position: center,
                        offset: new AMap.Pixel(-10, -10),
                        content: `<div style="width: 20px; height: 20px; border-radius: 50%; background: ${colors.primary}; border: 3px solid white; box-shadow: 0 0 10px ${colors.primary};"></div>`,
                    });
                    map.add(amapMarker);
                }
                // Heatmap Mode (Circles)
                else if (isHeatmapMode) {
                    const circles = heatmapData.map(p => {
                        const [gLat, gLon] = wgsToGcj(p.latitude, p.longitude);
                        // Scale radius by value (energy)
                        const radius = Math.max(10, Math.min(100, Math.sqrt(p.value) * 5));

                        return new AMap.CircleMarker({
                            center: [gLon, gLat],
                            radius: radius,
                            strokeColor: colors.primary,
                            strokeWeight: 1,
                            strokeOpacity: 0.5,
                            fillColor: colors.primary,
                            fillOpacity: 0.4,
                            zIndex: 10,
                            bubble: true,
                        });
                    });
                    map.add(circles);
                    map.setFitView();
                }

                mapInstanceRef.current = map;
            } catch (err) {
                console.error('Map init error:', err);
            }
        };

        initMap();

        return () => {
            mounted = false;
            if (mapInstanceRef.current) {
                // @ts-expect-error AMap destroy
                mapInstanceRef.current.destroy?.();
                mapInstanceRef.current = null;
            }
        };
    }, [useAmap, positions, marker, heatmapData, amapKey, colors, isPathMode, isMarkerMode, isHeatmapMode]);

    if (!hasData) return null;

    if (useAmap) {
        return <div ref={mapRef} className={`w-full h-full rounded-lg overflow-hidden ${className}`} />;
    }

    return (
        <MapContainer
            center={center}
            zoom={13}
            className={`w-full h-full rounded-lg overflow-hidden ${className}`}
            style={{ zIndex: 0 }}
            zoomControl={false}
            attributionControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {isPathMode && (
                <>
                    <Polyline
                        positions={leafletPathPositions}
                        pathOptions={{ color: colors.primary, weight: 4, opacity: 0.8 }}
                    />
                    <Marker position={leafletPathPositions[0]} icon={startIcon}>
                        <Tooltip>起点</Tooltip>
                    </Marker>
                    <Marker position={leafletPathPositions[leafletPathPositions.length - 1]} icon={endIcon}>
                        <Tooltip>终点</Tooltip>
                    </Marker>
                    <BoundsFitter positions={leafletPathPositions} />
                </>
            )}

            {isMarkerMode && !isPathMode && leafletMarkerPosition && (
                <>
                    <Marker position={leafletMarkerPosition} icon={singleIcon} />
                    <BoundsFitter marker={leafletMarkerPosition} />
                </>
            )}

            {isHeatmapMode && !isPathMode && heatmapData.map((p, i) => (
                <CircleMarker
                    key={i}
                    center={[p.latitude, p.longitude]}
                    pathOptions={{
                        color: colors.primary,
                        fillColor: colors.primary,
                        fillOpacity: 0.4,
                        weight: 1
                    }}
                    radius={Math.max(5, Math.min(30, Math.sqrt(p.value)))}
                >
                    <Tooltip>
                        <div className="text-sm">
                            <div className="font-bold">{p.label}</div>
                            <div>{p.count} charges</div>
                            <div>{p.value.toFixed(1)} kWh</div>
                        </div>
                    </Tooltip>
                </CircleMarker>
            ))}
            {isHeatmapMode && <BoundsFitter heatmapData={leafletHeatmapPositions} />}

        </MapContainer>
    );
}
