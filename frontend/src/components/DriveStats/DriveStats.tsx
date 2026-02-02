import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/settings';
import { driveApi } from '@/services/api';
import { Card } from '@/components/Card';
import { DriveStatsSummary } from '@/types';
import { formatDistance, formatSpeed, formatNumber } from '@/utils/format';
import { getThemeColors } from '@/utils/theme';
import { Loading } from '@/components/States';

interface Props {
    carId: number;
    startDate?: string;
    endDate?: string;
}

export function DriveStats({ carId, startDate, endDate }: Props) {
    const { theme, unit, language } = useSettingsStore();
    const [stats, setStats] = useState<DriveStatsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const colors = getThemeColors(theme);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await driveApi.getStatsSummary(carId, startDate, endDate);
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch drive stats', err);
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
                {/* Total Distance */}
                <Card>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm" style={{ color: colors.muted }}>
                                {language === 'zh' ? '记录距离' : 'Total Distance'}
                            </span>
                            <span className="text-lg md:text-2xl font-bold mt-1" style={{ color: colors.primary }}>
                                {formatDistance(stats.totalDistance, unit)}
                            </span>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                        </div>
                    </div>
                </Card>

                {/* Median Distance */}
                <Card>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm" style={{ color: colors.muted }}>
                                {language === 'zh' ? '中位距离' : 'Median Distance'}
                            </span>
                            <span className="text-lg md:text-2xl font-bold mt-1" style={{ color: colors.success }}>
                                {formatDistance(stats.medianDistance, unit)}
                            </span>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.success}15` }}>
                            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                        </div>
                    </div>
                </Card>

                {/* Avg Daily Distance */}
                <Card>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm" style={{ color: colors.muted }}>
                                {language === 'zh' ? '日均行驶' : 'Daily Average'}
                            </span>
                            <span className="text-lg md:text-2xl font-bold mt-1" style={{ color: colors.primary }}>
                                {formatDistance(stats.avgDailyDistance, unit)}
                            </span>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                    </div>
                </Card>

                {/* Max Speed */}
                <Card>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm" style={{ color: colors.muted }}>
                                {language === 'zh' ? '最高速度' : 'Max Speed'}
                            </span>
                            <span className="text-lg md:text-2xl font-bold mt-1" style={{ color: colors.accent }}>
                                {formatSpeed(stats.maxSpeed, unit)}
                            </span>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.accent}15` }}>
                            <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 1024 1024" fill={colors.accent}>
                                <path d="M512 85.333333c235.648 0 426.666667 191.018667 426.666667 426.666667 0 116.138667-46.421333 221.44-121.706667 298.282667a42.666667 42.666667 0 0 1-60.330667-60.330667A340.992 340.992 0 0 0 853.333333 512c0-188.522667-152.810667-341.333333-341.333333-341.333333S170.666667 323.477333 170.666667 512a340.992 340.992 0 0 0 96.704 237.952 42.666667 42.666667 0 0 1-60.330667 60.330667A425.472 425.472 0 0 1 85.333333 512c0-235.648 191.018667-426.666667 426.666667-426.666667z m0 256a42.666667 42.666667 0 0 1 42.56 39.893334L554.666667 384v120.341333l93.354666 85.205334a42.666667 42.666667 0 0 1-54.058666 65.962666l-3.541334-2.901333-106.666666-97.365333a42.666667 42.666667 0 0 1-14.016-28.416L469.333333 524.373333V384a42.666667 42.666667 0 0 1 42.666667-42.666667z m-229.546667 58.88a42.666667 42.666667 0 0 1 3.114667 56.661334l-2.901333 3.541333-36.053334 39.509333a42.666667 42.666667 0 0 1-66.048-54.016l2.901334-3.541333 36.053333-39.509333a42.666667 42.666667 0 0 1 62.933333-2.645334z m459.093334 0a42.666667 42.666667 0 0 1 62.933333 2.645334l36.053333 39.509333a42.666667 42.666667 0 0 1-63.146666 57.557333l-36.053334-39.509333a42.666667 42.666667 0 0 1 0.213334-60.202667z" />
                            </svg>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-2 gap-4">
                {/* Drive Count */}
                <Card>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm" style={{ color: colors.muted }}>
                                {language === 'zh' ? '驾驶次数' : 'Total Drives'}
                            </span>
                            <span className="text-lg md:text-2xl font-bold mt-1" style={{ color: colors.primary }}>
                                {formatNumber(stats.driveCount)}
                            </span>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                                <circle cx="7" cy="17" r="2" />
                                <path d="M9 17h6" />
                                <circle cx="17" cy="17" r="2" />
                            </svg>
                        </div>
                    </div>
                </Card>

                {/* Days in Period */}
                <Card>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm" style={{ color: colors.muted }}>
                                {language === 'zh' ? '统计天数' : 'Days in Period'}
                            </span>
                            <span className="text-lg md:text-2xl font-bold mt-1" style={{ color: colors.muted }}>
                                {formatNumber(stats.daysInPeriod)} {language === 'zh' ? '天' : 'days'}
                            </span>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center" style={{ background: `${colors.muted}15` }}>
                            <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke={colors.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
