import { useMemo, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '@/store/settings';
import { useTranslation } from '@/utils/i18n';
import { getThemeColors } from '@/utils/theme';
import { DateFilter, FilterPreset } from '@/components/DateFilter';
import type { StateTimelineItem } from '@/types';
import dayjs from 'dayjs';

interface ActivityTimelineProps {
    data: StateTimelineItem[];
    className?: string;
    rangeLabel?: string;
    rangeStart?: string | Date;
    rangeEnd?: string | Date;
    onRangeChange?: (start: string | undefined, end: string | undefined) => void;
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

// Get state color from theme
const getStateColor = (state: number, timeline: {
    driving: string;
    charging: string;
    offline: string;
    asleep: string;
    online: string;
    updating: string;
}): string => {
    const colorMap: Record<number, string> = {
        [STATE.DRIVING]: timeline.driving,
        [STATE.CHARGING]: timeline.charging,
        [STATE.OFFLINE]: timeline.offline,
        [STATE.ASLEEP]: timeline.asleep,
        [STATE.ONLINE]: timeline.online,
        [STATE.UPDATING]: timeline.updating,
    };
    return colorMap[state] || timeline.offline;
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

    // 计算安全的位置，避免超出屏幕边缘
    const tooltipWidth = 180; // 估算的 tooltip 宽度
    const padding = 12; // 距离屏幕边缘的最小间距
    const screenWidth = window.innerWidth;
    
    // 计算水平位置
    let left = position.x;
    let translateX = '-50%';
    
    // 检查左边界
    if (position.x - tooltipWidth / 2 < padding) {
        left = padding;
        translateX = '0%';
    }
    // 检查右边界
    else if (position.x + tooltipWidth / 2 > screenWidth - padding) {
        left = screenWidth - padding;
        translateX = '-100%';
    }

    return createPortal(
        <div
            style={{
                position: 'fixed',
                left: left,
                top: position.y - 10,
                transform: `translateX(${translateX}) translateY(-100%)`,
                zIndex: 99999,
                minWidth: '160px',
                maxWidth: `calc(100vw - ${padding * 2}px)`,
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

export function ActivityTimeline({ data, className = '', rangeLabel, rangeStart, rangeEnd, onRangeChange }: ActivityTimelineProps) {
    const { theme, language } = useSettingsStore();
    const { t } = useTranslation(language);
    const [hoveredSegment, setHoveredSegment] = useState<TimelineSegment | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [mounted, setMounted] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [filterPos, setFilterPos] = useState({ top: 0, right: 0 });
    const [containerWidth, setContainerWidth] = useState(600);
    const containerRef = useRef<HTMLDivElement>(null);
    const isFirstMount = useRef(true);
    const [currentPreset, setCurrentPreset] = useState<FilterPreset>('last24h');

    // Get preset label for display
    const getPresetLabel = (preset: FilterPreset): string => {
        const labels: Record<FilterPreset, string> = {
            last24h: t('last24h'),
            week: t('lastWeek'),
            month: t('lastMonth'),
            quarter: t('lastQuarter'),
            year: t('lastYear'),
            custom: rangeLabel || t('custom'),
        };
        return labels[preset];
    };

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

    const colors = getThemeColors(theme);

    // Process data into continuous segments
    // Grafana State Timeline logic:
    // - States 1 (driving), 2 (charging), 6 (updating) have paired events: [start, end(=0)]
    // - States 3 (offline), 4 (asleep), 5 (online) are point events that persist until next state
    // - State 0 means "return to background state" (the last offline/asleep/online)
    const { segments, timeLabels } = useMemo(() => {
        const now = rangeEnd ? dayjs(rangeEnd) : dayjs();
        const dayStart = rangeStart ? dayjs(rangeStart) : now.subtract(24, 'hour');

        const totalMs = now.diff(dayStart);
        if (totalMs <= 0) return { segments: [], timeLabels: [] };

        const result: TimelineSegment[] = [];
        
        // Sort data by time, then by state (ensure consistent ordering)
        const sortedData = [...data].sort((a, b) => {
            const timeDiff = dayjs(a.time).valueOf() - dayjs(b.time).valueOf();
            if (timeDiff !== 0) return timeDiff;
            // At same time, process state=0 first (end events), then higher states
            return a.state - b.state;
        });

        // Background states (offline/asleep/online) persist until changed
        // Activity states (driving/charging/updating) temporarily override background
        let backgroundState: number = STATE.OFFLINE; // Default background
        let activeState: number | null = null; // Currently active override (driving/charging/updating)
        let segmentStart: dayjs.Dayjs = dayStart;

        const isBackgroundState = (s: number) => s === STATE.OFFLINE || s === STATE.ASLEEP || s === STATE.ONLINE;
        const isActivityState = (s: number) => s === STATE.DRIVING || s === STATE.CHARGING || s === STATE.UPDATING;

        const getCurrentState = () => activeState !== null ? activeState : backgroundState;

        const pushSegment = (endTime: dayjs.Dayjs, state: number) => {
            if (state === STATE.RESET) return;
            
            const startPct = Math.max(0, (segmentStart.valueOf() - dayStart.valueOf()) / totalMs * 100);
            const endPct = Math.min(100, (endTime.valueOf() - dayStart.valueOf()) / totalMs * 100);
            
            if (endPct > startPct) {
                const durationMin = Math.round(endTime.diff(segmentStart, 'minute'));
                result.push({
                    start: startPct,
                    width: endPct - startPct,
                    state: state,
                    color: getStateColor(state, colors.timeline),
                    label: getStateLabel(state, language),
                    startTime: segmentStart,
                    endTime: endTime,
                    durationMin,
                });
            }
        };

        // Group events by timestamp to handle simultaneous events correctly
        // This prevents tiny segments when state=0 and new background state arrive at same time
        const eventsByTime = new Map<number, Array<{time: dayjs.Dayjs, state: number}>>();
        for (const item of sortedData) {
            const time = dayjs(item.time);
            const state = Number(item.state);
            if (time.isBefore(dayStart) || time.isAfter(now)) continue;
            
            const timeKey = time.valueOf();
            if (!eventsByTime.has(timeKey)) {
                eventsByTime.set(timeKey, []);
            }
            eventsByTime.get(timeKey)!.push({ time, state });
        }

        // Process events grouped by timestamp
        for (const [, events] of Array.from(eventsByTime.entries()).sort((a, b) => a[0] - b[0])) {
            const time = events[0].time;
            
            // Extract all states at this timestamp
            const hasReset = events.some(e => e.state === STATE.RESET);
            const newBackground = events.find(e => isBackgroundState(e.state));
            const newActivity = events.find(e => isActivityState(e.state));

            const prevState = getCurrentState();

            // Process in order: first update background, then handle reset, then activity
            if (newBackground) {
                // Update background state (but don't create segment yet if activity is ending)
                if (activeState === null && !hasReset && newBackground.state !== backgroundState) {
                    pushSegment(time, prevState);
                    segmentStart = time;
                }
                backgroundState = newBackground.state;
            }

            if (hasReset && activeState !== null) {
                // End activity state - return to (possibly updated) background
                pushSegment(time, prevState);
                activeState = null;
                segmentStart = time;
            }

            if (newActivity && newActivity.state !== activeState) {
                // New activity state
                pushSegment(time, getCurrentState());
                activeState = newActivity.state;
                segmentStart = time;
            }
        }

        // Add final segment up to now/end
        const finalState = getCurrentState();
        if (finalState !== STATE.RESET && segmentStart.isBefore(now)) {
            pushSegment(now, finalState);
        }

        // Post-process: filter out very short background segments
        // These typically appear as visual artifacts at state transitions
        // The gaps will be filled by extending adjacent segments
        const MIN_SEGMENT_SECONDS = 120; // Minimum 2 minutes to show a background segment
        const filteredResult: TimelineSegment[] = [];
        
        for (let i = 0; i < result.length; i++) {
            const segment = result[i];
            const durationSeconds = segment.endTime.diff(segment.startTime, 'second');
            const isShortSegment = durationSeconds < MIN_SEGMENT_SECONDS;
            const isBackground = isBackgroundState(segment.state);
            
            // Skip very short background segments
            if (isShortSegment && isBackground) {
                continue;
            }
            
            filteredResult.push(segment);
        }
        
        // Now fill gaps by extending segments to meet their neighbors
        const mergedResult: TimelineSegment[] = [];
        for (let i = 0; i < filteredResult.length; i++) {
            const segment = { ...filteredResult[i] }; // Clone to avoid mutation
            const nextSegment = filteredResult[i + 1];
            
            // If there's a gap before next segment, extend current to fill it
            if (nextSegment) {
                const gapMs = nextSegment.startTime.valueOf() - segment.endTime.valueOf();
                if (gapMs > 0) {
                    // Extend current segment to next segment's start
                    const newEndPct = Math.min(100, (nextSegment.startTime.valueOf() - dayStart.valueOf()) / totalMs * 100);
                    const newDurationMin = Math.round(nextSegment.startTime.diff(segment.startTime, 'minute'));
                    segment.width = newEndPct - segment.start;
                    segment.endTime = nextSegment.startTime;
                    segment.durationMin = newDurationMin;
                }
            }
            
            mergedResult.push(segment);
        }

        // Generate time labels
        const totalHours = totalMs / (1000 * 60 * 60);
        const maxLabels = Math.floor(containerWidth / 80); // approx pixels per label
        let intervalHours = Math.max(1, Math.ceil(totalHours / maxLabels));

        // Snap to nice intervals
        const snapIntervals = [1, 2, 3, 4, 6, 8, 12, 24, 48, 72, 96, 168];
        for (const snap of snapIntervals) {
            if (snap >= intervalHours) {
                intervalHours = snap;
                break;
            }
        }

        const labels: string[] = [];
        // Align first label? No, just start from dayStart

        // If interval is >= 24h, align to start of day if possible?
        // Let's just step by intervalHours
        for (let h = 0; h <= totalHours; h += intervalHours) {
            const labelTime = dayStart.add(h, 'hour');
            // Format logic
            let fmt = 'HH:mm';
            if (totalHours > 24) fmt = 'MM-DD';
            if (totalHours > 24 && intervalHours < 24) fmt = 'MM-DD HH:mm';

            labels.push(labelTime.format(fmt));
        }

        return { segments: mergedResult, timeLabels: labels };
    }, [data, language, containerWidth, rangeStart, rangeEnd]);

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
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: colors.primary }} />
                    <h3 className="font-semibold">{t('activityTimeline').toUpperCase()}</h3>
                </div>

                <div className="relative">
                    <button
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setFilterPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                            setShowFilter(!showFilter);
                            isFirstMount.current = true; // Reset for new mount
                        }}
                        className="text-xs px-2 py-1 rounded glass-strong hover:brightness-125 transition-all flex items-center gap-1"
                        style={{ color: colors.muted }}
                    >
                        {getPresetLabel(currentPreset)}
                        <svg className={`w-3 h-3 transition-transform ${showFilter ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showFilter && createPortal(
                        <>
                            <div
                                className="fixed inset-0 z-[9999]"
                                onClick={() => setShowFilter(false)}
                            />
                            <div
                                className="fixed z-[10000] p-2 rounded-xl glass border border-white/10 shadow-2xl min-w-[280px]"
                                style={{
                                    top: filterPos.top,
                                    right: filterPos.right,
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DateFilter
                                    className="flex-col items-stretch"
                                    initialPreset={currentPreset}
                                    onFilter={(start, end) => {
                                        onRangeChange?.(start, end);
                                        // Skip closing on first mount (initial useEffect call)
                                        if (isFirstMount.current) {
                                            isFirstMount.current = false;
                                        } else {
                                            setShowFilter(false);
                                        }
                                    }}
                                    onPresetChange={(preset) => setCurrentPreset(preset)}
                                />
                            </div>
                        </>,
                        document.body
                    )}
                </div>
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
                    { state: STATE.UPDATING, label: language === 'zh' ? '更新' : 'Updating' },
                ].map((item) => (
                    <div key={item.state} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: getStateColor(item.state, colors.timeline) }}
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
