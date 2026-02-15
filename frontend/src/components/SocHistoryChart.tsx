import { useMemo, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSettingsStore } from '@/store/settings';
import { useTranslation } from '@/utils/i18n';
import { getThemeColors } from '@/utils/theme';
import type { SocDataPoint } from '@/types';
import { DateFilter, FilterPreset } from '@/components/DateFilter';
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
    const isFirstMount = useRef(true);
    const [currentPreset, setCurrentPreset] = useState<FilterPreset>('last24h');

    const colors = getThemeColors(theme);

    // 根据预设获取显示标签
    const getPresetLabel = (preset: FilterPreset): string => {
        const labels: Record<FilterPreset, string> = {
            last24h: t('last24h'),
            lastNHours: language === 'zh' ? '近N小时' : 'Last N h',
            week: t('lastWeek'),
            month: t('lastMonth'),
            quarter: t('lastQuarter'),
            year: t('lastYear'),
            custom: rangeLabel || t('custom'),
        };
        return labels[preset];
    };

    const option = useMemo(() => {
        // 使用 ECharts 内置的 LTTB 采样算法，保持曲线平滑同时保留关键特征
        const formatStr = days > 1 ? 'MM-DD HH:mm' : 'HH:mm';
        const xData = data.map(d => dayjs(d.date).format(formatStr));
        const socData = data.map(d => d.soc);

        // 计算满电续航里程（100% SOC对应的续航）
        // 从数据中找到 rangeKm 和 soc 的比例关系
        let maxRangeKm = 0;
        for (const d of data) {
            if (d.rangeKm && d.soc > 0) {
                const estimatedFullRange = (d.rangeKm / d.soc) * 100;
                if (estimatedFullRange > maxRangeKm) {
                    maxRangeKm = estimatedFullRange;
                }
            }
        }
        // 默认值
        if (maxRangeKm === 0) maxRangeKm = 500;

        return {
            backgroundColor: 'transparent',
            grid: {
                top: 20,
                right: 45,
                bottom: 35,
                left: 40,
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(20, 20, 35, 0.9)',
                borderColor: colors.primary,
                borderWidth: 1,
                textStyle: {
                    color: '#fff',
                },
                formatter: (params: { seriesName: string; value: number; axisValue: string; color: string }[]) => {
                    if (!params.length) return '';
                    const time = params[0].axisValue;
                    let html = `<div style="font-weight: 600; margin-bottom: 4px;">${time}</div>`;
                    params.forEach(p => {
                        if (p.value !== null && p.value !== undefined) {
                            const soc = Math.round(p.value);
                            const rangeKm = Math.round((soc / 100) * maxRangeKm);
                            html += `<div style="color: ${p.color};">SOC: ${soc}% (~${rangeKm}km)</div>`;
                        }
                    });
                    return html;
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
            yAxis: [
                {
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
                {
                    type: 'value',
                    min: 0,
                    max: maxRangeKm,
                    splitNumber: 5,
                    position: 'right',
                    axisLine: {
                        show: false,
                    },
                    axisLabel: {
                        color: colors.muted,
                        fontSize: 10,
                        formatter: (value: number) => `${Math.round(value)}km`,
                    },
                    splitLine: {
                        show: false,
                    },
                },
            ],
            series: [
                {
                    name: 'SOC',
                    type: 'line',
                    data: socData,
                    smooth: 0.4,
                    symbol: 'none',
                    sampling: 'lttb',
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
                    {/* 时间筛选按钮 */}
                    <button
                        onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setFilterPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                            setShowFilter(!showFilter);
                            isFirstMount.current = true;
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
                                    background: 'rgba(20, 20, 30, 0.95)'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <DateFilter
                                    className="flex-col items-stretch"
                                    initialPreset={currentPreset}
                                    onFilter={(start, end) => {
                                        onRangeChange?.(start, end);
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
