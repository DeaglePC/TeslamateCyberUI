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
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm" style={{ color: colors.muted }}>
                                {language === 'zh' ? '总充电量' : 'Total Energy'}
                            </span>
                            <span className="text-lg md:text-2xl font-bold mt-1" style={{ color: colors.primary }}>
                                {formatEnergy(stats.totalEnergy)}
                            </span>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                            </svg>
                        </div>
                    </div>
                </Card>

                {/* Total Cost */}
                <Card>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm" style={{ color: colors.muted }}>
                                {language === 'zh' ? '总费用' : 'Total Cost'}
                            </span>
                            <span className="text-lg md:text-2xl font-bold mt-1" style={{ color: colors.success }}>
                                {formatCurrency(stats.totalCost)}
                            </span>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.success}15` }}>
                            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="1" x2="12" y2="23"></line>
                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                            </svg>
                        </div>
                    </div>
                </Card>

                {/* Total Count */}
                <Card>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm" style={{ color: colors.muted }}>
                                {language === 'zh' ? '充电次数' : 'Total Charges'}
                            </span>
                            <span className="text-lg md:text-2xl font-bold mt-1" style={{ color: colors.primary }}>
                                {formatNumber(stats.totalCount)}
                            </span>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 12h-2" />
                                <path d="M1 12h2" />
                                <path d="M12 2v2" />
                                <path d="M12 20v2" />
                                <path d="M20.66 20.66l-1.41-1.41" />
                                <path d="M4.75 4.75L3.34 3.34" />
                                <path d="M20.66 3.34l-1.41 1.41" />
                                <path d="M4.75 19.25l-1.41 1.41" />
                                <path d="M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1 5-5z" />
                                <line x1="12" y1="10" x2="12" y2="10" />
                            </svg>
                        </div>
                    </div>
                </Card>

                {/* Total Duration */}
                <Card>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm" style={{ color: colors.muted }}>
                                {language === 'zh' ? '充电总时长' : 'Total Duration'}
                            </span>
                            <span className="text-lg md:text-2xl font-bold mt-1" style={{ color: colors.primary }}>
                                {formatDuration(stats.totalDuration, language === 'zh' ? 'zh' : 'en')}
                            </span>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Calendar Heatmap - 独占一行 */}
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

            {/* Location Heatmap - 独占一行 */}
            <Card className="flex flex-col">
                <h3 className="text-lg font-semibold mb-4" style={{ color: colors.primary }}>
                    {language === 'zh' ? '充电热力图' : 'Charging Heatmap'}
                </h3>
                <div className="w-full h-[300px] lg:h-[400px] relative rounded-lg overflow-hidden">
                    <ChargeLocationHeatmap data={stats.locationStats} className="absolute inset-0" />
                </div>
            </Card>
        </div>
    );
}
