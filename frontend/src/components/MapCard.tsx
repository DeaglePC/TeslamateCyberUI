import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useSettingsStore } from '@/store/settings';
import { useTranslation } from '@/utils/i18n';
import { isOutOfChina, wgsToGcj } from '@/utils/geo';
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

interface MapCardProps {
    latitude?: number;
    longitude?: number;
    address?: string;
    state?: string;
    className?: string;
}

// Component to handle map center updates in Leaflet
function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center);
    }, [center, map]);
    return null;
}

export function MapCard({ latitude, longitude, address, state, className = '' }: MapCardProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);
    const { theme, amapKey, language } = useSettingsStore();
    const { t, getStateLabel } = useTranslation(language);

    const themeColors: Record<string, { primary: string; muted: string }> = {
        cyber: { primary: '#00f0ff', muted: '#808080' },
        tesla: { primary: '#cc0000', muted: '#888888' },
        dark: { primary: '#4361ee', muted: '#8d99ae' },
        tech: { primary: '#0077b6', muted: '#778da9' },
        aurora: { primary: '#72efdd', muted: '#98c1d9' },
    };

    const colors = themeColors[theme] || themeColors.cyber;

    // State badge icons
    const stateIcons: Record<string, string> = {
        asleep: '🅿️',
        online: '🟢',
        offline: '⚫',
        charging: '⚡',
        driving: '🚗',
        updating: '🔄',
    };

    const icon = stateIcons[state || 'asleep'] || stateIcons.asleep;
    const label = getStateLabel(state || 'asleep').toUpperCase();

    // Strategy Determination
    const hasLocation = !!(latitude && longitude);
    const isChina = hasLocation && !isOutOfChina(latitude!, longitude!);
    const useAmap = isChina && !!amapKey;

    // AMap Effect
    useEffect(() => {
        if (!useAmap || !mapRef.current || !amapKey || !latitude || !longitude) return;

        let mounted = true;

        const initMap = async () => {
            try {
                const AMapLoader = await import('@amap/amap-jsapi-loader');
                const AMap = await AMapLoader.default.load({
                    key: amapKey,
                    version: '2.0',
                    plugins: ['AMap.Marker'],
                });

                if (!mounted || !mapRef.current) return;

                // Conversion for AMap (WGS-84 -> GCJ-02)
                const [gcjLat, gcjLon] = wgsToGcj(latitude, longitude);

                let map = mapInstanceRef.current;
                if (!map) {
                    map = new AMap.Map(mapRef.current, {
                        zoom: 15,
                        mapStyle: 'amap://styles/dark',
                        center: [gcjLon, gcjLat],
                    });
                    mapInstanceRef.current = map;
                } else {
                    // @ts-expect-error AMap setCenter
                    map.setCenter([gcjLon, gcjLat]);
                }

                // Clear previous markers
                // @ts-expect-error AMap clearMap
                map.clearMap();

                // Add marker
                const marker = new AMap.Marker({
                    position: [gcjLon, gcjLat],
                    offset: new AMap.Pixel(-10, -10),
                    content: `<div style="width: 20px; height: 20px; border-radius: 50%; background: ${colors.primary}; border: 3px solid white; box-shadow: 0 0 10px ${colors.primary};"></div>`,
                });

                // @ts-expect-error AMap add
                map.add(marker);

            } catch (error) {
                console.error('Failed to load AMap:', error);
            }
        };

        initMap();

        return () => {
            mounted = false;
            if (mapInstanceRef.current) {
                // We keep the instance alive for performance, or add cleanup if needed
                // mapInstanceRef.current.destroy?.(); 
            }
        };
    }, [useAmap, latitude, longitude, amapKey, colors.primary]);

    // Custom Leaflet Icon
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width: 20px; height: 20px; border-radius: 50%; background: ${colors.primary}; border: 3px solid white; box-shadow: 0 0 10px ${colors.primary};"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10], // Center it
    });

    return (
        <div className={`glass rounded-2xl overflow-hidden flex flex-col ${className}`}>
            {/* Map Container */}
            <div className="relative flex-1 min-h-[12rem]">
                {/* State Badge */}
                <div
                    className="absolute top-3 left-3 z-[401] px-3 py-1.5 rounded-full glass-strong flex items-center gap-2"
                    style={{ borderColor: colors.primary }}
                >
                    <span>{icon}</span>
                    <span className="text-xs font-semibold tracking-wider" style={{ color: colors.primary }}>
                        {label}
                    </span>
                </div>

                {/* Map Implementation */}
                {hasLocation ? (
                    useAmap ? (
                        <div ref={mapRef} className="w-full h-full" />
                    ) : (
                        <MapContainer
                            center={[latitude!, longitude!]}
                            zoom={15}
                            style={{ width: '100%', height: '100%', zIndex: 0 }}
                            zoomControl={false}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                            <Marker position={[latitude!, longitude!]} icon={customIcon} />
                            <MapUpdater center={[latitude!, longitude!]} />
                        </MapContainer>
                    )
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16162a 100%)' }}
                    >
                        <div className="text-center" style={{ color: colors.muted }}>
                            <p className="text-sm">{t('noLocation')}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Address Section */}
            {address && (
                <div className="px-4 py-3 border-t border-white/5 shrink-0 bg-black/20">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={colors.primary}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-medium truncate">{address}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
