import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useSettingsStore } from '@/store/settings';
import { DailyChargeStat } from '@/types';
import { getThemeColors } from '@/utils/theme';
import { formatEnergy } from '@/utils/format';

interface Props {
    data: DailyChargeStat[];
    startDate?: string;
    endDate?: string;
}

export function ChargeCalendarHeatmap({ data, startDate, endDate }: Props) {
    const { theme, language } = useSettingsStore();
    const colors = getThemeColors(theme);

    const option = useMemo(() => {
        // Prepare data: [[date, value]]
        const heatmapData = data.map(item => [
            item.date,
            item.energyAdded
        ]);

        const maxEnergy = Math.max(...data.map(d => d.energyAdded), 1);

        // Determine range: use provided props or fallback to current year
        let range: string | string[];
        if (startDate && endDate) {
            range = [startDate, endDate];
        } else {
            const currentYear = new Date().getFullYear();
            range = currentYear.toString();
        }

        return {
            backgroundColor: 'transparent', // Make chart background transparent
            tooltip: {
                position: 'top',
                formatter: (params: any) => {
                    const date = params.data[0];
                    const value = params.data[1];
                    return `${date}<br/>${language === 'zh' ? '充电量' : 'Energy'}: ${formatEnergy(value)}`;
                },
                backgroundColor: colors.bg,
                borderColor: colors.border,
                textStyle: {
                    color: colors.muted
                }
            },
            visualMap: {
                show: false,
                min: 0,
                max: maxEnergy,
                calculable: false,
                orient: 'horizontal',
                left: 'center',
                bottom: 0,
                inRange: {
                    color: [
                        `${colors.primary}15`, // Lower opacity to make gradient more obvious (was 40)
                        colors.primary
                    ]
                },
                textStyle: {
                    color: colors.muted
                },
                type: 'continuous'
            },
            calendar: {
                top: 30,
                left: 20,  // Keep space for day labels
                right: 5,  // Minimize right margin to maximize width
                cellSize: ['auto', 18], // Increased height (was 13) to fill space
                range: range,
                itemStyle: {
                    borderWidth: 1,
                    borderColor: `${colors.muted}20`,
                    color: 'transparent'
                },
                splitLine: {
                    show: false
                },
                yearLabel: { show: false },
                dayLabel: {
                    margin: 5, // Tighter labels
                    color: colors.muted,
                    nameMap: language === 'zh' ? 'cn' : 'en'
                },
                monthLabel: {
                    margin: 10,
                    color: colors.muted,
                    nameMap: language === 'zh' ? 'cn' : 'en'
                },
            },
            series: {
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: heatmapData,
                itemStyle: {
                    borderRadius: 2,
                    borderColor: `${colors.muted}20`,
                    borderWidth: 1
                }
            }
        };
    }, [data, colors, theme, language, startDate, endDate]);

    if (!data || data.length === 0) {
        return (
            <div className="h-32 flex items-center justify-center" style={{ color: colors.muted }}>
                {language === 'zh' ? '暂无数据' : 'No Data'}
            </div>
        );
    }

    return (
        <div className="w-full h-40 lg:h-48"> {/* PC模式下更高 */}
            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                theme={theme === 'dark' || theme === 'cyber' ? 'dark' : undefined}
            />
        </div>
    );
}
