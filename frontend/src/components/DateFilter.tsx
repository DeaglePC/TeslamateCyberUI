import { useState } from 'react';
import { useSettingsStore } from '@/store/settings';
import { getThemeColors } from '@/utils/theme';

interface DateFilterProps {
    onFilter: (startDate: string | undefined, endDate: string | undefined) => void;
    className?: string;
}

type FilterPreset = 'all' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export function DateFilter({ onFilter, className = '' }: DateFilterProps) {
    const { theme, language } = useSettingsStore();
    const colors = getThemeColors(theme);

    const [preset, setPreset] = useState<FilterPreset>('all');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [showCustom, setShowCustom] = useState(false);

    const presets: { id: FilterPreset; label: { zh: string; en: string } }[] = [
        { id: 'all', label: { zh: '全部', en: 'All' } },
        { id: 'week', label: { zh: '近一周', en: 'Week' } },
        { id: 'month', label: { zh: '近一月', en: 'Month' } },
        { id: 'quarter', label: { zh: '近三月', en: '3 Months' } },
        { id: 'year', label: { zh: '近一年', en: 'Year' } },
        { id: 'custom', label: { zh: '自定义', en: 'Custom' } },
    ];

    const getDateRange = (presetId: FilterPreset): { start?: string; end?: string } => {
        const now = new Date();
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        switch (presetId) {
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

    const handlePresetClick = (presetId: FilterPreset) => {
        setPreset(presetId);
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
                    <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: colors.muted }}>
                            {language === 'zh' ? '从' : 'From'}
                        </span>
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="px-3 py-1.5 rounded-lg text-sm bg-transparent border outline-none"
                            style={{
                                borderColor: colors.border,
                                color: colors.primary,
                            }}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: colors.muted }}>
                            {language === 'zh' ? '到' : 'To'}
                        </span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="px-3 py-1.5 rounded-lg text-sm bg-transparent border outline-none"
                            style={{
                                borderColor: colors.border,
                                color: colors.primary,
                            }}
                        />
                    </div>
                    <button
                        onClick={handleCustomApply}
                        className="px-4 py-1.5 text-sm rounded-lg transition-all hover:opacity-80"
                        style={{
                            background: colors.primary,
                            color: '#000',
                        }}
                    >
                        {language === 'zh' ? '应用' : 'Apply'}
                    </button>
                </div>
            )}
        </div>
    );
}
