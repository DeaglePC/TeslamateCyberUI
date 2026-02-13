import { useState, useEffect, useRef } from 'react';
import { useSettingsStore } from '@/store/settings';
import { getThemeColors } from '@/utils/theme';
import { DatePicker } from '@/components/DatePicker';

interface DateFilterProps {
    onFilter: (startDate: string | undefined, endDate: string | undefined) => void;
    className?: string;
    initialPreset?: FilterPreset;
    onPresetChange?: (preset: FilterPreset) => void;
    customHours?: number;
    onCustomHoursChange?: (hours: number) => void;
}

export type FilterPreset = 'last24h' | 'lastNHours' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export function DateFilter({ onFilter, className = '', initialPreset = 'last24h', onPresetChange, customHours: externalCustomHours, onCustomHoursChange }: DateFilterProps) {
    const { theme, language } = useSettingsStore();
    const colors = getThemeColors(theme);

    const [preset, setPreset] = useState<FilterPreset>(initialPreset);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [internalCustomHours, setInternalCustomHours] = useState<string>('6');
    const [showCustom, setShowCustom] = useState(false);
    const [showCustomHours, setShowCustomHours] = useState(false);
    const initialized = useRef(false);

    // Use external customHours if provided, otherwise use internal state
    // When externalCustomHours is 0, treat it as empty (user cleared input)
    const customHours = externalCustomHours !== undefined
        ? (externalCustomHours === 0 ? '' : externalCustomHours.toString())
        : internalCustomHours;
    const setCustomHours = (value: string) => {
        if (externalCustomHours !== undefined && onCustomHoursChange) {
            // Allow empty string during input, only convert to number on apply
            if (value === '') {
                onCustomHoursChange(0); // Use 0 to represent empty state
            } else {
                const num = parseInt(value);
                if (!isNaN(num)) {
                    onCustomHoursChange(num);
                }
            }
        } else {
            setInternalCustomHours(value);
        }
    };

    const presets: { id: FilterPreset | 'last24h'; label: { zh: string; en: string } }[] = [
        { id: 'last24h', label: { zh: '近24小时', en: 'Last 24h' } },
        { id: 'lastNHours', label: { zh: '近N小时', en: 'Last N h' } },
        { id: 'week', label: { zh: '近一周', en: 'Week' } },
        { id: 'month', label: { zh: '近一月', en: 'Month' } },
        { id: 'quarter', label: { zh: '近三月', en: '3 Months' } },
        { id: 'year', label: { zh: '近一年', en: 'Year' } },
        { id: 'custom', label: { zh: '自定义', en: 'Custom' } },
    ];

    const getDateRange = (presetId: FilterPreset | 'last24h'): { start?: string; end?: string } => {
        const now = new Date();
        // 统一使用 YYYY-MM-DD 格式（本地日期）
        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        // 本地时间格式（不带时区后缀）用于精确到秒的筛选
        const formatLocalDateTime = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };

        switch (presetId) {
            case 'last24h': {
                const start = new Date(now);
                start.setHours(start.getHours() - 24);
                return { start: formatLocalDateTime(start), end: formatLocalDateTime(now) };
            }
            case 'lastNHours': {
                const hours = parseInt(customHours) || 6;
                const validHours = Math.max(1, Math.min(99, hours)); // Ensure hours is between 1-99
                const start = new Date(now);
                start.setHours(start.getHours() - validHours);
                return { start: formatLocalDateTime(start), end: formatLocalDateTime(now) };
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
        onPresetChange?.(presetId as FilterPreset);
        if (presetId === 'custom') {
            setShowCustom(true);
            setShowCustomHours(false);
        } else if (presetId === 'lastNHours') {
            setShowCustomHours(true);
            setShowCustom(false);
            // 不立即应用筛选，让用户先输入小时数
        } else {
            setShowCustom(false);
            setShowCustomHours(false);
            const range = getDateRange(presetId);
            onFilter(range.start, range.end);
        }
    };

    const handleCustomApply = () => {
        const range = getDateRange('custom');
        onFilter(range.start, range.end);
    };

    // 初始化时应用默认筛选
    useEffect(() => {
        if (!initialized.current && initialPreset !== 'custom') {
            initialized.current = true;
            const range = getDateRange(initialPreset);
            onFilter(range.start, range.end);
        }
    }, []);  // eslint-disable-line react-hooks/exhaustive-deps

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
                            background: `linear-gradient(135deg, var(--card-bg-start) 0%, var(--card-bg-mid) 50%, var(--card-bg-end) 100%)`,
                            color: preset === p.id ? colors.primary : colors.muted,
                            border: `1px solid ${preset === p.id ? colors.primary : 'rgba(255, 255, 255, 0.08)'}`,
                            boxShadow: preset === p.id ? `0 0 0 1px ${colors.primary}40` : '0 8px 32px rgba(0, 0, 0, 0.2)',
                        }}
                    >
                        {p.label[language]}
                    </button>
                ))}
            </div>

            {/* Custom hours input */}
            {showCustomHours && (
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg" style={{ background: `${colors.primary}10` }}>
                    <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: colors.muted }}>
                            {language === 'zh' ? '小时数' : 'Hours'}
                        </span>
                        <input
                            type="number"
                            min="1"
                            max="99"
                            value={customHours}
                            onChange={(e) => {
                                const value = e.target.value;
                                // Allow empty string or valid numbers (for deletion and input)
                                if (value === '') {
                                    setCustomHours(value);
                                } else {
                                    const num = parseInt(value);
                                    if (!isNaN(num) && num >= 1 && num <= 99) {
                                        setCustomHours(value);
                                    }
                                }
                            }}
                            className="w-24 px-3 py-1.5 text-sm rounded-lg border"
                            style={{
                                color: '#e5e7eb',
                                borderColor: colors.primary + '40',
                                background: 'rgba(0, 0, 0, 0.2)',
                            }}
                            placeholder="6"
                        />
                    </div>
                    <button
                        onClick={() => {
                            const range = getDateRange('lastNHours');
                            onFilter(range.start, range.end);
                        }}
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
