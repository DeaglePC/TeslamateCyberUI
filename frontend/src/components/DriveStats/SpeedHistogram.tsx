import { useEffect, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSettingsStore } from '@/store/settings';
import { driveApi } from '@/services/api';
import { Card } from '@/components/Card';
import { SpeedHistogramItem } from '@/types';
import { getThemeColors } from '@/utils/theme';
import { Loading } from '@/components/States';
import { useTranslation } from '@/utils/i18n';

interface Props {
    // 模式1：通过 carId + 日期范围获取（驾驶记录页面）
    carId?: number;
    startDate?: string;
    endDate?: string;
    // 模式2：通过 driveId 获取单次驾驶数据（驾驶详情页面）
    driveId?: number;
    // 可选：不包裹 Card
    noCard?: boolean;
}

// 格式化时间显示
const formatTime = (seconds: number): string => {
    if (seconds < 60) {
        return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
};

export function SpeedHistogram({ carId, startDate, endDate, driveId, noCard }: Props) {
    const { theme, unit, language } = useSettingsStore();
    const { t } = useTranslation(language);
    const [data, setData] = useState<SpeedHistogramItem[]>([]);
    const [loading, setLoading] = useState(true);
    const colors = getThemeColors(theme);

    const isImperial = unit === 'imperial';
    const speedUnit = isImperial ? 'mph' : 'km/h';
    const convertSpeed = (speed: number) => isImperial ? Math.round(speed * 0.621371) : speed;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                let result: SpeedHistogramItem[] = [];
                if (driveId) {
                    result = await driveApi.getDriveSpeedHistogram(driveId);
                } else if (carId) {
                    result = await driveApi.getSpeedHistogram(carId, startDate, endDate);
                }
                setData(result || []);
            } catch (err) {
                console.error('Failed to fetch speed histogram', err);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        if (driveId || carId) {
            fetchData();
        }
    }, [carId, startDate, endDate, driveId]);

    const option = useMemo(() => {
        if (!data || data.length === 0) return {};

        const speeds = data.map(item => `${convertSpeed(item.speed)}`);
        const percentages = data.map(item => item.elapsed);
        const timeSeconds = data.map(item => item.timeSeconds);

        // 计算最大值用于颜色渐变
        const maxPercentage = Math.max(...percentages);

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow'
                },
                backgroundColor: colors.cardBg,
                borderColor: `${colors.muted}30`,
                textStyle: {
                    color: colors.primary
                },
                formatter: (params: any) => {
                    const dataIndex = params[0].dataIndex;
                    const speed = speeds[dataIndex];
                    const percentage = percentages[dataIndex];
                    const time = timeSeconds[dataIndex];
                    return `
                        <div style="padding: 8px;">
                            <div style="font-weight: bold; margin-bottom: 4px;">${speed} ${speedUnit}</div>
                            <div style="color: ${colors.accent};">${percentage.toFixed(1)}%</div>
                            <div style="color: ${colors.muted}; font-size: 12px;">${formatTime(time)}</div>
                        </div>
                    `;
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '10%',
                top: '10%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: speeds,
                axisLabel: {
                    color: colors.muted,
                    fontSize: 11,
                    interval: 0,
                    rotate: data.length > 15 ? 45 : 0
                },
                axisLine: {
                    lineStyle: {
                        color: `${colors.muted}30`
                    }
                },
                axisTick: {
                    show: false
                },
                name: speedUnit,
                nameLocation: 'end',
                nameTextStyle: {
                    color: colors.muted,
                    fontSize: 11
                }
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    color: colors.muted,
                    fontSize: 11,
                    formatter: '{value}%'
                },
                axisLine: {
                    show: false
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    lineStyle: {
                        color: `${colors.muted}15`
                    }
                }
            },
            series: [
                {
                    name: language === 'zh' ? '时间占比' : 'Time Percentage',
                    type: 'bar',
                    data: percentages.map((value) => ({
                        value,
                        itemStyle: {
                            color: {
                                type: 'linear',
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [
                                    {
                                        offset: 0,
                                        color: colors.accent
                                    },
                                    {
                                        offset: 1,
                                        color: `${colors.accent}80`
                                    }
                                ]
                            },
                            borderRadius: [4, 4, 0, 0],
                            // 根据百分比调整透明度，让高的柱子更亮
                            opacity: 0.5 + (value / maxPercentage) * 0.5
                        }
                    })),
                    barWidth: '60%',
                    emphasis: {
                        itemStyle: {
                            color: colors.primary
                        }
                    }
                }
            ]
        };
    }, [data, colors, language, isImperial, speedUnit]);

    if (loading) {
        if (noCard) {
            return <div className="h-64 flex items-center justify-center"><Loading /></div>;
        }
        return (
            <Card>
                <div className="h-64 flex items-center justify-center">
                    <Loading />
                </div>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return null;
    }

    const content = (
        <div className="flex flex-col">
            {!noCard && (
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: colors.primary }}>
                        {t('speedHistogram')}
                    </h3>
                    <span className="text-sm" style={{ color: colors.muted }}>
                        {language === 'zh' ? '各速度区间时间占比' : 'Time distribution by speed'}
                    </span>
                </div>
            )}
            <ReactECharts
                option={option}
                style={{ height: '280px', width: '100%' }}
                opts={{ renderer: 'svg' }}
            />
        </div>
    );

    if (noCard) {
        return content;
    }

    return (
        <Card>
            {content}
        </Card>
    );
}
