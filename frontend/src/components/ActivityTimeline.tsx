import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '@/store/settings';
import { useTranslation } from '@/utils/i18n';
import type { StateTimelineItem } from '@/types';
import dayjs from 'dayjs';

interface ActivityTimelineProps {
    data: StateTimelineItem[];
    className?: string;
}

// State type constants matching backend
const STATE = {
    RESET: 0,      // Reset to previous state
    DRIVING: 1,    // Driving
    CHARGING: 2,   // Charging
    OFFLINE: 3,    // Offline
    ASLEEP: 4,     // Asleep
    ONLINE: 5,     // Online
    UPDATING: 6,   // Updating
} as const;

// State colors matching Grafana
const STATE_COLORS: Record<number, string> = {
    [STATE.DRIVING]: '#a855f7',   // Purple
    [STATE.CHARGING]: '#a855f7',  // Purple (same as driving in Grafana)
    [STATE.OFFLINE]: '#f97316',   // Orange
    [STATE.ASLEEP]: '#22c55e',    // Green
    [STATE.ONLINE]: '#06b6d4',    // Cyan/Teal
    [STATE.UPDATING]: '#a855f7',  // Purple
};

// State labels
const getStateLabel = (state: number, language: 'zh' | 'en'): string => {
    const labels: Record<number, { zh: string; en: string }> = {
        [STATE.DRIVING]: { zh: '行驶', en: 'Driving' },
        [STATE.CHARGING]: { zh: '充电', en: 'Charging' },
        [STATE.OFFLINE]: { zh: '离线', en: 'Offline' },
        [STATE.ASLEEP]: { zh: '休眠', en: 'Asleep' },
        [STATE.ONLINE]: { zh: '在线', en: 'Online' },
        [STATE.UPDATING]: { zh: '更新', en: 'Updating' },
    };
    return labels[state]?.[language] || '';
};

interface TimelineSegment {
    start: number;  // percentage 0-100
    width: number;  // percentage
    state: number;
    color: string;
    label: string;
    startTime: dayjs.Dayjs;
    endTime: dayjs.Dayjs;
    durationMin: number;
}

// Tooltip component rendered via portal
function Tooltip({
    segment,
    position,
    language,
    primaryColor,
    mutedColor,
}: {
    segment: TimelineSegment;
    position: { x: number; y: number };
    language: 'zh' | 'en';
    primaryColor: string;
    mutedColor: string;
}) {
    const formatDuration = (minutes: number) => {
        if (minutes < 60) {
            return language === 'zh' ? `${minutes} 分钟` : `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (language === 'zh') {
            return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
        }
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    return createPortal(
        <div
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y - 10,
                transform: 'translate(-50%, -100%)',
                zIndex: 99999,
                minWidth: '160px',
                padding: '12px',
                borderRadius: '8px',
                background: 'linear-gradient(145deg, rgba(35, 35, 60, 0.95), rgba(25, 25, 45, 0.95))',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${segment.color}50`,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                pointerEvents: 'none',
            }}
        >
            {/* State Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div
                    style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '4px',
                        backgroundColor: segment.color,
                    }}
                />
                <span style={{ fontWeight: 600, color: segment.color }}>
                    {segment.label}
                </span>
            </div>

            {/* Time Range */}
            <div style={{ fontSize: '12px', color: mutedColor }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
                    <span>{language === 'zh' ? '开始' : 'Start'}</span>
                    <span style={{ fontFamily: 'monospace' }}>{segment.startTime.format('HH:mm')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '4px' }}>
                    <span>{language === 'zh' ? '结束' : 'End'}</span>
                    <span style={{ fontFamily: 'monospace' }}>{segment.endTime.format('HH:mm')}</span>
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '16px',
                    paddingTop: '4px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <span>{language === 'zh' ? '时长' : 'Duration'}</span>
                    <span style={{ fontWeight: 600, color: primaryColor }}>
                        {formatDuration(segment.durationMin)}
                    </span>
                </div>
            </div>
        </div>,
        document.body
    );
}

export function ActivityTimeline({ data, className = '' }: ActivityTimelineProps) {
    const { theme, language } = useSettingsStore();
    const { t } = useTranslation(language);
    const [hoveredSegment, setHoveredSegment] = useState<TimelineSegment | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);
    const [containerWidth, setContainerWidth] = useState(600);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Track container width for responsive time labels
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const themeColors: Record<string, { primary: string; muted: string }> = {
        cyber: { primary: '#00f0ff', muted: '#808080' },
        tesla: { primary: '#cc0000', muted: '#888888' },
        dark: { primary: '#4361ee', muted: '#8d99ae' },
        tech: { primary: '#0077b6', muted: '#778da9' },
        aurora: { primary: '#72efdd', muted: '#98c1d9' },
    };

    const colors = themeColors[theme] || themeColors.cyber;

    // Process data into continuous segments
    const { segments, timeLabels } = useMemo(() => {
        if (!data.length) return { segments: [], timeLabels: [] };

        const now = dayjs();
        const dayStart = now.subtract(24, 'hour');
        const totalMs = 24 * 60 * 60 * 1000;

        const result: TimelineSegment[] = [];
        let currentState: number = STATE.OFFLINE; // Default state
        let segmentStart = dayStart;

        // Sort data by time
        const sortedData = [...data].sort((a, b) =>
            dayjs(a.time).valueOf() - dayjs(b.time).valueOf()
        );

        for (const item of sortedData) {
            const time = dayjs(item.time);

            // Skip if time is before our range
            if (time.isBefore(dayStart)) continue;

            // If state changes (not a reset to 0)
            if (Number(item.state) !== STATE.RESET && Number(item.state) !== currentState) {
                // End previous segment
                const startPct = Math.max(0, (segmentStart.valueOf() - dayStart.valueOf()) / totalMs * 100);
                const endPct = Math.min(100, (time.valueOf() - dayStart.valueOf()) / totalMs * 100);

                if (endPct > startPct && Number(currentState) !== 0) {
                    const durationMin = Math.round(time.diff(segmentStart, 'minute'));
                    result.push({
                        start: startPct,
                        width: endPct - startPct,
                        state: currentState,
                        color: STATE_COLORS[currentState] || STATE_COLORS[STATE.OFFLINE],
                        label: getStateLabel(currentState, language),
                        startTime: segmentStart,
                        endTime: time,
                        durationMin,
                    });
                }

                // Start new segment
                currentState = Number(item.state);
                segmentStart = time;
            } else if (Number(item.state) === STATE.RESET) {
                // Reset means end of current activity, go back to previous base state
            }
        }

        // Add final segment up to now
        if (Number(currentState) !== 0) {
            const startPct = Math.max(0, (segmentStart.valueOf() - dayStart.valueOf()) / totalMs * 100);
            const durationMin = Math.round(now.diff(segmentStart, 'minute'));
            result.push({
                start: startPct,
                width: 100 - startPct,
                state: currentState,
                color: STATE_COLORS[currentState] || STATE_COLORS[STATE.OFFLINE],
                label: getStateLabel(currentState, language),
                startTime: segmentStart,
                endTime: now,
                durationMin,
            });
        }

        // Generate time labels - adjust interval based on container width
        // Wide screens: every 2 hours (13 labels)
        // Medium screens: every 4 hours (7 labels)
        // Narrow screens: every 6 hours (5 labels)
        const hourInterval = containerWidth > 500 ? 2 : containerWidth > 300 ? 4 : 6;
        const labels: string[] = [];
        for (let i = 0; i <= 24; i += hourInterval) {
            labels.push(dayStart.add(i, 'hour').format('HH:mm'));
        }

        return { segments: result, timeLabels: labels };
    }, [data, language, containerWidth]);

    // Handle mouse move on segment
    const handleMouseMove = (seg: TimelineSegment, e: React.MouseEvent) => {
        setHoveredSegment(seg);
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMousePosition({
            x: e.clientX,
            y: rect.top,
        });
    };

    // Handle mouse leave
    const handleMouseLeave = () => {
        setHoveredSegment(null);
    };

    return (
        <div className={`glass rounded-2xl p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: colors.primary }} />
                    <h3 className="font-semibold">{t('activityTimeline').toUpperCase()}</h3>
                </div>
                <span className="text-xs px-2 py-1 rounded glass-strong" style={{ color: colors.muted }}>
                    {t('last24h')}
                </span>
            </div>

            {/* Timeline Bar */}
            <div className="relative" ref={containerRef}>
                {/* Main timeline bar */}
                <div
                    className="relative h-20 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                    {segments.map((seg, idx) => (
                        <div
                            key={idx}
                            className="absolute top-0 h-full flex items-center justify-center cursor-pointer"
                            style={{
                                left: `${seg.start}%`,
                                width: `${seg.width}%`,
                                backgroundColor: seg.color,
                                transition: 'filter 0.15s, transform 0.15s',
                            }}
                            onMouseEnter={(e) => handleMouseMove(seg, e)}
                            onMouseMove={(e) => handleMouseMove(seg, e)}
                            onMouseLeave={handleMouseLeave}
                        >
                            {/* Show label if segment is wide enough */}
                            {seg.width > 8 && (
                                <span className="text-xs text-white/80 font-medium truncate px-1">
                                    {seg.label}
                                </span>
                            )}
                        </div>
                    ))}

                    {/* State label on left */}
                    <div
                        className="absolute left-0 top-0 bottom-0 flex items-center pl-2 pointer-events-none"
                        style={{ color: colors.muted }}
                    >
                        <span className="text-xs font-medium bg-black/50 px-1 rounded">state</span>
                    </div>
                </div>

                {/* Time labels */}
                <div className="flex justify-between mt-2">
                    {timeLabels.map((label, idx) => (
                        <span
                            key={idx}
                            className="text-xs"
                            style={{ color: colors.muted }}
                        >
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Tooltip - rendered via portal to body */}
            {mounted && hoveredSegment && (
                <Tooltip
                    segment={hoveredSegment}
                    position={mousePosition}
                    language={language}
                    primaryColor={colors.primary}
                    mutedColor={colors.muted}
                />
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-white/5">
                {[
                    { state: STATE.OFFLINE, label: language === 'zh' ? '离线' : 'Offline' },
                    { state: STATE.ONLINE, label: language === 'zh' ? '在线' : 'Online' },
                    { state: STATE.ASLEEP, label: language === 'zh' ? '休眠' : 'Asleep' },
                    { state: STATE.DRIVING, label: language === 'zh' ? '行驶' : 'Driving' },
                    { state: STATE.CHARGING, label: language === 'zh' ? '充电' : 'Charging' },
                ].map((item) => (
                    <div key={item.state} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: STATE_COLORS[item.state] }}
                        />
                        <span className="text-xs" style={{ color: colors.muted }}>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* No data state */}
            {segments.length === 0 && (
                <div
                    className="mt-4 text-center text-sm"
                    style={{ color: colors.muted }}
                >
                    {t('noActivityToday')}
                </div>
            )}
        </div>
    );
}
