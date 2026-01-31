import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSettingsStore } from '@/store/settings';
import { useTranslation } from '@/utils/i18n';
import { getThemeColors } from '@/utils/theme';
import type { SocDataPoint } from '@/types';
import { DateFilter } from '@/components/DateFilter';
import dayjs from 'dayjs';
import { useState } from 'react';
import { createPortal } from 'react-dom';

interface SocHistoryChartProps {
    data: SocDataPoint[];
    className?: string;
    rangeLabel?: string;
    days?: number; // approx duration in days to decide format
    onRangeChange?: (start: string | undefined, end: string | undefined) => void;
}

export function SocHistoryChart({ data, className = '', rangeLabel, days = 1, onRangeChange }: SocHistoryChartProps) {
    const { theme, language } = useSettingsStore();
    const { t } = useTranslation(language);
    const [showFilter, setShowFilter] = useState(false);
    const [filterPos, setFilterPos] = useState({ top: 0, right: 0 });

    const colors = getThemeColors(theme);

    const option = useMemo(() => {
        // Sample data every N points for performance
        const sampledData = data.length > 200
            ? data.filter((_, i) => i % Math.ceil(data.length / 200) === 0)
            : data;

        const formatStr = days > 1 ? 'MM-DD HH:mm' : 'HH:mm';
        const xData = sampledData.map(d => dayjs(d.date).format(formatStr));
        const yData = sampledData.map(d => d.soc);

        return {
            backgroundColor: 'transparent',
            grid: {
                top: 20,
                right: 20,
                bottom: 40,
                left: 50,
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(20, 20, 35, 0.9)',
                borderColor: colors.primary,
                borderWidth: 1,
                textStyle: {
                    color: '#fff',
                },
                formatter: (params: { value: number; axisValue: string }[]) => {
                    if (!params.length) return '';
                    const p = params[0];
                    return `<div style="font-weight: 600;">${p.axisValue}</div>
                  <div style="color: ${colors.primary};">SOC: ${p.value}%</div>`;
                },
            },
            xAxis: {
                type: 'category',
                data: xData,
                axisLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.1)',
                    },
                },
                axisLabel: {
                    color: colors.muted,
                    fontSize: 10,
                    interval: 'auto',
                },
                axisTick: {
                    show: false,
                },
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: 100,
                splitNumber: 5,
                axisLine: {
                    show: false,
                },
                axisLabel: {
                    color: colors.muted,
                    formatter: '{value}%',
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.05)',
                    },
                },
            },
            series: [
                {
                    type: 'line',
                    data: yData,
                    smooth: true,
                    symbol: 'none',
                    lineStyle: {
                        color: colors.primary,
                        width: 2,
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: colors.gradient[0] },
                                { offset: 1, color: colors.gradient[1] },
                            ],
                        },
                    },
                },
            ],
        };
    }, [data, colors, days]);

    return (
        <div className={`glass rounded-2xl p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: colors.primary }} />
                    <h3 className="font-semibold">{t('socHistory').toUpperCase()}</h3>
                </div>

                <div className="relative">
                    <button
                        onClick={(e) => {
                            // Calculate position on click
                            const rect = e.currentTarget.getBoundingClientRect();
                            setFilterPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                            setShowFilter(!showFilter);
                        }}
                        className="text-xs px-2 py-1 rounded glass-strong hover:brightness-125 transition-all flex items-center gap-1"
                        style={{ color: colors.muted }}
                    >
                        {rangeLabel || t('last24h')}
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
                                    background: 'rgba(20, 20, 30, 0.95)'
                                }}
                            >
                                <DateFilter
                                    className="flex-col items-stretch"
                                    onFilter={(start, end) => {
                                        onRangeChange?.(start, end);
                                        setShowFilter(false);
                                    }}
                                />
                            </div>
                        </>,
                        document.body
                    )}
                </div>
            </div>

            {/* Chart */}
            {data.length > 0 ? (
                <ReactECharts option={option} style={{ height: 180 }} />
            ) : (
                <div
                    className="h-44 flex items-center justify-center"
                    style={{ color: colors.muted }}
                >
                    {t('noData')}
                </div>
            )}
        </div>
    );
}
