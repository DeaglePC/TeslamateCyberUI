import { memo } from 'react';
import { UniversalMap } from '@/components/UniversalMap';
import { useSettingsStore } from '@/store/settings';
import { getThemeColors } from '@/utils/theme';
import { useTranslation } from '@/utils/i18n';
import { isOutOfChina, wgsToGcj } from '@/utils/geo';

interface MapCardProps {
    latitude?: number;
    longitude?: number;
    address?: string;
    timestamp?: string;
    className?: string;
    title?: string;
}

export const MapCard = memo(function MapCard({ latitude, longitude, address, timestamp, className = '', title }: MapCardProps) {
    const { theme, language, amapKey } = useSettingsStore();
    const { t } = useTranslation(language);
    const colors = getThemeColors(theme);

    const hasLocation = latitude !== undefined && longitude !== undefined;
    
    // Check if using AMap (in China and has API key)
    const isChina = hasLocation && !isOutOfChina(latitude!, longitude!);
    const useAmap = isChina && !!amapKey;

    // Generate AMap navigation URL
    const getAmapUrl = () => {
        if (!hasLocation) return '';
        // Convert WGS84 to GCJ02 for AMap
        const [gcjLat, gcjLon] = wgsToGcj(latitude!, longitude!);
        const locationName = address ? encodeURIComponent(address) : encodeURIComponent('当前位置');
        // AMap web URL format
        return `https://uri.amap.com/marker?position=${gcjLon},${gcjLat}&name=${locationName}&coordinate=gaode&callnative=1`;
    };

    // Generate Google Maps navigation URL
    // Note: In China, Google Maps uses GCJ-02 coordinates, so we need to convert
    // Outside China, Google Maps uses WGS-84 directly
    const getGoogleMapsUrl = () => {
        if (!hasLocation) return '';
        // If in China, convert to GCJ-02 for better accuracy on Google Maps China
        if (isChina) {
            const [gcjLat, gcjLon] = wgsToGcj(latitude!, longitude!);
            return `https://www.google.com/maps/search/?api=1&query=${gcjLat},${gcjLon}`;
        }
        // Outside China, use raw WGS-84 coordinates
        return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    };

    // Determine which map service to use based on language
    const useGoogleMaps = language === 'en';

    const handleOpenMap = (e: React.MouseEvent) => {
        e.stopPropagation();
        const url = useGoogleMaps ? getGoogleMapsUrl() : getAmapUrl();
        if (url) {
            window.open(url, '_blank');
        }
    };

    return (
        <div className={`glass rounded-2xl overflow-hidden flex flex-col w-full ${className}`}
            style={{
                borderColor: colors.border,
                borderWidth: '1px',
                borderStyle: 'solid'
            }}>
            {/* Map Container */}
            <div className="relative flex-1 min-h-[120px] sm:min-h-[200px]">
                {/* Timestamp Badge - Only show if timestamp provided */}
                {timestamp && (
                    <div className="absolute top-3 left-3 z-[401] px-3 py-1.5 rounded-full glass-strong flex items-center gap-2 pointer-events-none max-w-[calc(100%-1.5rem)]">
                        <div className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: colors.primary }}></div>
                        <span className="text-xs font-medium tracking-wide truncate" style={{ color: colors.muted }}>
                            {title || t('lastUpdated')}: {new Date(timestamp).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
                                month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
                            })}
                        </span>
                    </div>
                )}

                {/* Open in Map App Button */}
                {hasLocation && (
                    <button
                        onClick={handleOpenMap}
                        className="absolute top-3 right-3 z-[401] px-3 py-1.5 rounded-full glass-strong flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer"
                        style={{
                            background: `${colors.primary}20`,
                            border: `1px solid ${colors.primary}40`
                        }}
                        title={useGoogleMaps ? 'Open in Google Maps' : '在高德地图中打开'}
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                        <span className="text-xs font-medium" style={{ color: colors.primary }}>
                            {useGoogleMaps ? 'Google Maps' : '高德地图'}
                        </span>
                    </button>
                )}

                {hasLocation ? (
                    <UniversalMap
                        marker={{
                            latitude: latitude!,
                            longitude: longitude!
                        }}
                        className="w-full h-full"
                    />
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
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-white/5 shrink-0 bg-black/20 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0 max-w-full">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke={colors.primary}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs sm:text-sm font-medium truncate">{address}</span>
                    </div>
                </div>
            )}
        </div>
    );
});
