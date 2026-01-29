import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSettingsStore } from '@/store/settings';
import { useTranslation } from '@/utils/i18n';
import { getThemeColors } from '@/utils/theme';
import type { SocDataPoint } from '@/types';
import dayjs from 'dayjs';

interface SocHistoryChartProps {
    data: SocDataPoint[];
    className?: string;
}

export function SocHistoryChart({ data, className = '' }: SocHistoryChartProps) {
    const { theme, language } = useSettingsStore();
    const { t } = useTranslation(language);

    const colors = getThemeColors(theme);

    const option = useMemo(() => {
        // Sample data every N points for performance
        const sampledData = data.length > 200
            ? data.filter((_, i) => i % Math.ceil(data.length / 200) === 0)
            : data;

        const xData = sampledData.map(d => dayjs(d.date).format('HH:mm'));
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
    }, [data, colors]);

    return (
        <div className={`glass rounded-2xl p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: colors.primary }} />
                    <h3 className="font-semibold">{t('socHistory').toUpperCase()}</h3>
                </div>
                <span className="text-xs px-2 py-1 rounded glass-strong" style={{ color: colors.muted }}>
                    {t('last24h')}
                </span>
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
