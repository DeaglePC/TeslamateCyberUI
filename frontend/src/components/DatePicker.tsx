import { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import clsx from 'clsx';
import { useSettingsStore } from '@/store/settings';
import { getThemeColors } from '@/utils/theme';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
    className?: string;
}

export function DatePicker({ value, onChange, label, className }: DatePickerProps) {
    const { theme, language } = useSettingsStore();
    const colors = getThemeColors(theme);

    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(value ? dayjs(value) : dayjs());
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const daysInMonth = viewDate.daysInMonth();
    const firstDayOfMonth = viewDate.startOf('month').day(); // 0 (Sunday) to 6 (Saturday)

    // Calendar grid generation
    const days = [];
    // Padding for prev month
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const handleDateClick = (day: number) => {
        const newDate = viewDate.date(day);
        onChange(newDate.format('YYYY-MM-DD'));
        setIsOpen(false);
    };

    const changeMonth = (delta: number) => {
        setViewDate(viewDate.add(delta, 'month'));
    };

    const weekDays = language === 'zh'
        ? ['日', '一', '二', '三', '四', '五', '六']
        : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
        <div className={clsx("relative", className)} ref={containerRef}>
            {/* Input Trigger */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors"
                style={{
                    borderColor: colors.border,
                    background: `${colors.primary}05`
                }}
            >
                {label && (
                    <span className="text-sm select-none" style={{ color: colors.muted }}>
                        {label}
                    </span>
                )}
                <span className={clsx("text-sm flex-1", !value && "opacity-50")} style={{ color: colors.primary }}>
                    {value || (language === 'zh' ? '选择日期' : 'Select Date')}
                </span>
                <svg className="w-4 h-4" style={{ color: colors.muted }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </div>

            {/* Calendar Popup */}
            {isOpen && (
                <div
                    className="absolute top-full left-0 mt-2 p-4 rounded-xl shadow-2xl z-50 glass-strong min-w-[280px] animate-fadeIn"
                    style={{
                        borderColor: colors.border,
                        borderWidth: 1,
                        background: colors.cardBg, // Opaque-ish background
                        backdropFilter: 'blur(20px)'
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => changeMonth(-1)}
                            className="p-1 rounded hover:bg-white/10"
                            style={{ color: colors.muted }}
                        >
                            &lt;
                        </button>
                        <span className="font-bold" style={{ color: colors.primary }}>
                            {viewDate.format(language === 'zh' ? 'YYYY年 M月' : 'MMM YYYY')}
                        </span>
                        <button
                            onClick={() => changeMonth(1)}
                            className="p-1 rounded hover:bg-white/10"
                            style={{ color: colors.muted }}
                        >
                            &gt;
                        </button>
                    </div>

                    {/* Week Days */}
                    <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs opacity-70" style={{ color: colors.muted }}>
                        {weekDays.map(d => <div key={d}>{d}</div>)}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} />;

                            const currentDayDate = viewDate.date(day);
                            const isSelected = value === currentDayDate.format('YYYY-MM-DD');
                            const isToday = currentDayDate.format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

                            return (
                                <button
                                    key={day}
                                    onClick={() => handleDateClick(day)}
                                    className="h-8 w-8 rounded-full text-sm flex items-center justify-center transition-all hover:scale-110"
                                    style={{
                                        background: isSelected ? colors.primary : (isToday ? `${colors.primary}20` : 'transparent'),
                                        color: isSelected ? '#000' : (isToday ? colors.primary : colors.muted),
                                        fontWeight: isSelected || isToday ? 'bold' : 'normal',
                                        boxShadow: isSelected ? `0 0 10px ${colors.primary}80` : 'none'
                                    }}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Today Button */}
                    <div className="mt-3 pt-3 border-t border-white/10 text-center">
                        <button
                            onClick={() => {
                                const today = dayjs();
                                onChange(today.format('YYYY-MM-DD'));
                                setViewDate(today);
                                setIsOpen(false);
                            }}
                            className="text-xs hover:underline"
                            style={{ color: colors.primary }}
                        >
                            {language === 'zh' ? '今天' : 'Today'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
