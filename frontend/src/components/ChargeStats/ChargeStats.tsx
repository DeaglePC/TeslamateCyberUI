import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/settings';
import { chargeApi } from '@/services/api';
import { Card } from '@/components/Card';
import { ChargeStatsSummary } from '@/types';
import { ChargeCalendarHeatmap } from './ChargeCalendarHeatmap';
import { ChargeLocationHeatmap } from './ChargeLocationHeatmap';
import { formatEnergy, formatCurrency, formatNumber, formatDuration } from '@/utils/format';
import { getThemeColors } from '@/utils/theme';
import { Loading } from '@/components/States';

interface Props {
    carId: number;
    startDate?: string;
    endDate?: string;
}

export function ChargeStats({ carId, startDate, endDate }: Props) {
    const { theme, language } = useSettingsStore();
    const [stats, setStats] = useState<ChargeStatsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const colors = getThemeColors(theme);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await chargeApi.getStatsSummary(carId, startDate, endDate);
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch charge stats', err);
            } finally {
                setLoading(false);
            }
        };

        if (carId) {
            fetchStats();
        }
    }, [carId, startDate, endDate]);

    if (loading) {
        return <div className="h-40 flex items-center justify-center"><Loading /></div>;
    }

    if (!stats) return null;

    return (
        <div className="space-y-4 animate-slideUp">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Energy */}
                <Card>
                    <div className="flex flex-col">
                        <span className="text-sm" style={{ color: colors.muted }}>
                            {language === 'zh' ? '总充电量' : 'Total Energy'}
                        </span>
                        <span className="text-2xl font-bold mt-1" style={{ color: colors.primary }}>
                            {formatEnergy(stats.totalEnergy)}
                        </span>
                    </div>
                </Card>

                {/* Total Cost */}
                <Card>
                    <div className="flex flex-col">
                        <span className="text-sm" style={{ color: colors.muted }}>
                            {language === 'zh' ? '总费用' : 'Total Cost'}
                        </span>
                        <span className="text-2xl font-bold mt-1" style={{ color: colors.success }}>
                            {formatCurrency(stats.totalCost)}
                        </span>
                    </div>
                </Card>

                {/* Total Count */}
                <Card>
                    <div className="flex flex-col">
                        <span className="text-sm" style={{ color: colors.muted }}>
                            {language === 'zh' ? '充电次数' : 'Total Charges'}
                        </span>
                        <span className="text-2xl font-bold mt-1" style={{ color: colors.primary }}>
                            {formatNumber(stats.totalCount)}
                        </span>
                    </div>
                </Card>

                {/* Total Duration */}
                <Card>
                    <div className="flex flex-col">
                        <span className="text-sm" style={{ color: colors.muted }}>
                            {language === 'zh' ? '充电总时长' : 'Total Duration'}
                        </span>
                        <span className="text-2xl font-bold mt-1" style={{ color: colors.primary }}>
                            {formatDuration(stats.totalDuration, language === 'zh' ? 'zh' : 'en')}
                        </span>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Calendar Heatmap */}
                <Card className="min-h-[200px]">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
                        {language === 'zh' ? '充电日历' : 'Charging Calendar'}
                    </h3>
                    <ChargeCalendarHeatmap
                        data={stats.dailyStats}
                        startDate={startDate}
                        endDate={endDate}
                    />
                </Card>

                {/* Location Heatmap */}
                <Card className="min-h-[200px] flex flex-col">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
                        {language === 'zh' ? '充电热力图' : 'Charging Heatmap'}
                    </h3>
                    <div className="flex-1 w-full min-h-[200px] relative rounded-lg overflow-hidden">
                        <ChargeLocationHeatmap data={stats.locationStats} className="absolute inset-0" />
                    </div>
                </Card>
            </div>
        </div>
    );
}
