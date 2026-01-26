import { useSettingsStore } from '@/store/settings';
import clsx from 'clsx';
import type { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  style?: CSSProperties;
}

export function Card({ children, className, onClick, hoverable = false, style }: CardProps) {
  const { theme } = useSettingsStore();

  return (
    <div
      onClick={onClick}
      className={clsx(
        'glass rounded-xl p-4',
        hoverable && 'cursor-pointer hover:scale-[1.02] transition-transform duration-200',
        onClick && 'cursor-pointer',
        className
      )}
      style={{
        ...style,
        borderColor: `var(--${theme}-border, rgba(255,255,255,0.1))`,
      }}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function StatCard({ label, value, unit, icon, trend, trendValue }: StatCardProps) {
  const { theme } = useSettingsStore();

  const themeColors: Record<string, { primary: string; muted: string }> = {
    cyber: { primary: '#00f0ff', muted: '#808080' },
    tesla: { primary: '#cc0000', muted: '#888888' },
    dark: { primary: '#4361ee', muted: '#8d99ae' },
    tech: { primary: '#0077b6', muted: '#778da9' },
    aurora: { primary: '#72efdd', muted: '#98c1d9' },
  };

  const colors = themeColors[theme] || themeColors.cyber;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: colors.muted }}>{label}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold" style={{ color: colors.primary }}>
              {value}
            </span>
            {unit && <span className="text-sm" style={{ color: colors.muted }}>{unit}</span>}
          </div>
          {trend && trendValue && (
            <div className={clsx(
              'flex items-center gap-1 mt-2 text-sm',
              trend === 'up' && 'text-green-400',
              trend === 'down' && 'text-red-400',
              trend === 'neutral' && 'text-gray-400'
            )}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'neutral' && '→'}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg" style={{
            background: `${colors.primary}20`,
            color: colors.primary
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
