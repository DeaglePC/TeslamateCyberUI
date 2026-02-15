import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap, Tooltip, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useSettingsStore } from '@/store/settings';
import { isOutOfChina, wgsToGcj } from '@/utils/geo';
import { getThemeColors } from '@/utils/theme';
import { DrivePosition, DriveTrack } from '@/types';
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

// Global AMap SDK cache to avoid repeated loading
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let amapSDKPromise: Promise<any> | null = null;
let amapSDKLoadedKey: string | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadAMapSDK(amapKey: string): Promise<any> {
    // If already loading/loaded with same key, return cached promise
    if (amapSDKPromise && amapSDKLoadedKey === amapKey) {
        return amapSDKPromise;
    }

    // Start new loading
    amapSDKLoadedKey = amapKey;
    amapSDKPromise = (async () => {
        const AMapLoader = await import('@amap/amap-jsapi-loader');
        return await AMapLoader.default.load({
            key: amapKey,
            version: '2.0',
            plugins: ['AMap.Polyline', 'AMap.Marker', 'AMap.CircleMarker'],
        });
    })();

    return amapSDKPromise;
}

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
    // For Multi-track mode (multiple drives)
    tracks?: DriveTrack[];
    // For Single Point mode (Charge)
    marker?: {
        latitude: number;
        longitude: number;
    };
    // For Heatmap mode
    heatmapData?: HeatmapPoint[];
    className?: string;
}

// Generate colors for multiple tracks
function getTrackColor(index: number, totalTracks: number, baseColor: string): string {
    // For single track, use the base color
    if (totalTracks === 1) return baseColor;
    
    // Generate colors with varying hue based on index
    const hue = (index * 360 / totalTracks) % 360;
    return `hsl(${hue}, 70%, 50%)`;
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

export function UniversalMap({ positions = [], tracks = [], marker, heatmapData = [], className = '' }: UniversalMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);
    const { theme, amapKey, mapType } = useSettingsStore();

    // Memoize heatmapData to avoid unnecessary re-renders when data content is the same
    const stableHeatmapData = useMemo(() => heatmapData, [JSON.stringify(heatmapData)]);
    const stablePositions = useMemo(() => positions, [JSON.stringify(positions)]);
    const stableTracks = useMemo(() => tracks, [JSON.stringify(tracks)]);
    const stableMarker = useMemo(() => marker, [marker?.latitude, marker?.longitude]);

    // Use global theme colors for consistency with DriveDetail page
    const themeColors = useMemo(() => getThemeColors(theme), [theme]);
    const colors = useMemo(() => ({
        primary: themeColors.primary,
        secondary: themeColors.chart?.[1] || themeColors.accent,  // Same as DriveDetail
        bg: themeColors.bg
    }), [themeColors]);

    // Strategy Determination - use stable refs
    const isPathMode = stablePositions.length > 0;
    const isMultiTrackMode = stableTracks.length > 0;
    const isMarkerMode = !!stableMarker;
    const isHeatmapMode = stableHeatmapData.length > 0;
    const hasData = isPathMode || isMultiTrackMode || isMarkerMode || isHeatmapMode;

    // Check location for China checking
    let checkLat = 0, checkLon = 0;
    if (isPathMode) { checkLat = stablePositions[0].latitude; checkLon = stablePositions[0].longitude; }
    else if (isMultiTrackMode && stableTracks[0]?.positions?.length > 0) {
        checkLat = stableTracks[0].positions[0].latitude;
        checkLon = stableTracks[0].positions[0].longitude;
    }
    else if (isMarkerMode && stableMarker) { checkLat = stableMarker.latitude; checkLon = stableMarker.longitude; }
    else if (isHeatmapMode && stableHeatmapData.length > 0) { checkLat = stableHeatmapData[0].latitude; checkLon = stableHeatmapData[0].longitude; }

    const isChina = hasData && !isOutOfChina(checkLat, checkLon);
    
    // 使用高德地图的条件：
    // 1. 用户选择了高德地图 (mapType === 'amap')
    // 2. 并且配置了高德地图 API Key
    // 3. 并且位置在中国境内（高德地图在境外数据不准确）
    const useAmap = mapType === 'amap' && !!amapKey && isChina;

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

    // Multi-track data prep
    const leafletTracks = tracks.map(track => ({
        driveId: track.driveId,
        startDate: track.startDate,
        positions: track.positions.map(p => [p.latitude, p.longitude] as [number, number])
    }));

    // Get all positions for bounds fitting in multi-track mode
    const allTrackPositions: [number, number][] = leafletTracks.flatMap(t => t.positions);

    let center: [number, number] = [0, 0];
    if (isPathMode && leafletPathPositions.length > 0) center = leafletPathPositions[0];
    else if (isMultiTrackMode && allTrackPositions.length > 0) center = allTrackPositions[0];
    else if (isMarkerMode && leafletMarkerPosition) center = leafletMarkerPosition;
    else if (isHeatmapMode && leafletHeatmapPositions.length > 0) center = leafletHeatmapPositions[0];

    // AMap Effect
    useEffect(() => {
        if (!useAmap || !mapRef.current || !amapKey || !hasData) return;

        let mounted = true;

        const initMap = async () => {
            try {
                // Use cached SDK loader to avoid repeated API calls
                const AMap = await loadAMapSDK(amapKey);

                if (!mounted || !mapRef.current) return;

                const map = new AMap.Map(mapRef.current, {
                    zoom: 14,
                    mapStyle: 'amap://styles/dark',
                });

                // Path Mode
                if (isPathMode) {
                    const path = stablePositions.map(p => {
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
                // Multi-track Mode
                else if (isMultiTrackMode) {
                    const polylines: unknown[] = [];
                    stableTracks.forEach((track, idx) => {
                        if (track.positions.length < 2) return;
                        
                        const path = track.positions.map(p => {
                            const [gLat, gLon] = wgsToGcj(p.latitude, p.longitude);
                            return [gLon, gLat];
                        });

                        const trackColor = getTrackColor(idx, stableTracks.length, colors.primary);
                        const polyline = new AMap.Polyline({
                            path,
                            strokeColor: trackColor,
                            strokeWeight: 3,
                            strokeOpacity: 0.7,
                        });
                        polylines.push(polyline);
                    });
                    map.add(polylines);
                    map.setFitView();
                }
                // Single Marker Mode
                else if (isMarkerMode && stableMarker) {
                    const [gLat, gLon] = wgsToGcj(stableMarker.latitude, stableMarker.longitude);
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
                    const circles = stableHeatmapData.map(p => {
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
    }, [useAmap, stablePositions, stableTracks, stableMarker, stableHeatmapData, amapKey, colors, isPathMode, isMultiTrackMode, isMarkerMode, isHeatmapMode]);

    if (!hasData) return null;

    if (useAmap) {
        return (
            <div 
                ref={mapRef} 
                className={`w-full h-full rounded-lg overflow-hidden ${className}`}
                data-no-swipe
            />
        );
    }

    return (
        <div 
            className={`w-full h-full ${className}`}
            data-no-swipe
        >
            <MapContainer
                center={center}
                zoom={13}
                className="w-full h-full rounded-lg overflow-hidden"
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

            {isMultiTrackMode && !isPathMode && (
                <>
                    {leafletTracks.map((track, idx) => {
                        if (track.positions.length < 2) return null;
                        const trackColor = getTrackColor(idx, leafletTracks.length, colors.primary);
                        return (
                            <Polyline
                                key={track.driveId}
                                positions={track.positions}
                                pathOptions={{ color: trackColor, weight: 3, opacity: 0.7 }}
                            />
                        );
                    })}
                    <BoundsFitter positions={allTrackPositions} />
                </>
            )}

            {isMarkerMode && !isPathMode && !isMultiTrackMode && leafletMarkerPosition && (
                <>
                    <Marker position={leafletMarkerPosition} icon={singleIcon} />
                    <BoundsFitter marker={leafletMarkerPosition} />
                </>
            )}

            {isHeatmapMode && !isPathMode && !isMultiTrackMode && heatmapData.map((p, i) => (
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
        </div>
    );
}
