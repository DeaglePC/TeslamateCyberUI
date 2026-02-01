import { useState } from 'react';
import { useSettingsStore } from '@/store/settings';
import { getThemeColors } from '@/utils/theme';
import { DatePicker } from '@/components/DatePicker';

interface DateFilterProps {
    onFilter: (startDate: string | undefined, endDate: string | undefined) => void;
    className?: string;
    initialPreset?: FilterPreset;
}

type FilterPreset = 'last24h' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export function DateFilter({ onFilter, className = '', initialPreset = 'last24h' }: DateFilterProps) {
    const { theme, language } = useSettingsStore();
    const colors = getThemeColors(theme);

    const [preset, setPreset] = useState<FilterPreset>(initialPreset);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    const presets: { id: FilterPreset | 'last24h'; label: { zh: string; en: string } }[] = [
        { id: 'last24h', label: { zh: '近24小时', en: 'Last 24h' } },
        { id: 'week', label: { zh: '近一周', en: 'Week' } },
        { id: 'month', label: { zh: '近一月', en: 'Month' } },
        { id: 'quarter', label: { zh: '近三月', en: '3 Months' } },
        { id: 'year', label: { zh: '近一年', en: 'Year' } },
        { id: 'custom', label: { zh: '自定义', en: 'Custom' } },
    ];

    const getDateRange = (presetId: FilterPreset | 'last24h'): { start?: string; end?: string } => {
        const now = new Date();
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        // Reset time to end of day for end date, or just date part is handled by backend?
        // Usually APIs taking T00:00:00.
        // The implementation here just takes YYYY-MM-DD.

        switch (presetId) {
            case 'last24h': {
                const start = new Date(now);
                start.setHours(start.getHours() - 24);
                return { start: start.toISOString(), end: now.toISOString() };
            }
            case 'week': {
                const start = new Date(now);
                start.setDate(start.getDate() - 7);
                return { start: formatDate(start), end: formatDate(now) };
            }
            case 'month': {
                const start = new Date(now);
                start.setMonth(start.getMonth() - 1);
                return { start: formatDate(start), end: formatDate(now) };
            }
            case 'quarter': {
                const start = new Date(now);
                start.setMonth(start.getMonth() - 3);
                return { start: formatDate(start), end: formatDate(now) };
            }
            case 'year': {
                const start = new Date(now);
                start.setFullYear(start.getFullYear() - 1);
                return { start: formatDate(start), end: formatDate(now) };
            }
            case 'custom':
                return { start: customStart || undefined, end: customEnd || undefined };
            default:
                return {};
        }
    };

    const handlePresetClick = (presetId: FilterPreset | 'last24h') => {
        setPreset(presetId as FilterPreset);
        if (presetId === 'custom') {
            setShowCustom(true);
        } else {
            setShowCustom(false);
            const range = getDateRange(presetId);
            onFilter(range.start, range.end);
        }
    };

    const handleCustomApply = () => {
        const range = getDateRange('custom');
        onFilter(range.start, range.end);
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => handlePresetClick(p.id)}
                        className="px-3 py-1.5 text-sm rounded-lg transition-all"
                        style={{
                            background: preset === p.id ? `${colors.primary}30` : 'transparent',
                            color: preset === p.id ? colors.primary : colors.muted,
                            border: `1px solid ${preset === p.id ? colors.primary : colors.border}`,
                        }}
                    >
                        {p.label[language]}
                    </button>
                ))}
            </div>

            {/* Custom date inputs */}
            {showCustom && (
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg" style={{ background: `${colors.primary}10` }}>
                    <div className="flex items-center gap-2 z-20">
                        <span className="text-sm" style={{ color: colors.muted }}>
                            {language === 'zh' ? '从' : 'From'}
                        </span>
                        <DatePicker
                            value={customStart}
                            onChange={setCustomStart}
                            className="w-40"
                        />
                    </div>
                    <div className="flex items-center gap-2 z-10">
                        <span className="text-sm" style={{ color: colors.muted }}>
                            {language === 'zh' ? '到' : 'To'}
                        </span>
                        <DatePicker
                            value={customEnd}
                            onChange={setCustomEnd}
                            className="w-40"
                        />
                    </div>
                    <button
                        onClick={handleCustomApply}
                        className="px-4 py-1.5 text-sm rounded-lg transition-all hover:opacity-80 ml-auto md:ml-0"
                        style={{
                            background: colors.primary,
                            color: '#000',
                            fontWeight: 'bold'
                        }}
                    >
                        {language === 'zh' ? '应用' : 'Apply'}
                    </button>
                </div>
            )}
        </div>
    );
}
