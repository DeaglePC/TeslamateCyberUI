import { memo } from 'react';
import { UniversalMap } from '@/components/UniversalMap';
import { useSettingsStore } from '@/store/settings';
import { getThemeColors } from '@/utils/theme';
import { useTranslation } from '@/utils/i18n';

interface MapCardProps {
    latitude?: number;
    longitude?: number;
    address?: string;
    timestamp?: string;
    className?: string;
    title?: string;
}

export const MapCard = memo(function MapCard({ latitude, longitude, address, timestamp, className = '', title }: MapCardProps) {
    const { theme, language } = useSettingsStore();
    const { t } = useTranslation(language);
    const colors = getThemeColors(theme);

    const hasLocation = latitude !== undefined && longitude !== undefined;

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
