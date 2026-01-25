import { useSettingsStore } from '@/store/settings';
import clsx from 'clsx';

interface BatteryIndicatorProps {
  level: number;
  isCharging?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function BatteryIndicator({ level, isCharging = false, size = 'md' }: BatteryIndicatorProps) {
  const { theme } = useSettingsStore();

  const themeColors: Record<string, { primary: string }> = {
    cyber: { primary: '#00f0ff' },
    tesla: { primary: '#cc0000' },
    dark: { primary: '#4361ee' },
    tech: { primary: '#0077b6' },
    aurora: { primary: '#72efdd' },
  };

  const colors = themeColors[theme] || themeColors.cyber;

  const getBatteryColor = (level: number) => {
    if (level <= 20) return '#ff4444';
    if (level <= 50) return '#ffaa00';
    return '#00ff88';
  };

  const sizes = {
    sm: { width: 40, height: 20, cap: 4 },
    md: { width: 60, height: 28, cap: 6 },
    lg: { width: 80, height: 36, cap: 8 },
  };

  const s = sizes[size];

  return (
    <div className="flex items-center gap-1">
      <div 
        className="relative rounded-sm border-2 flex items-center p-0.5"
        style={{ 
          width: s.width, 
          height: s.height,
          borderColor: colors.primary 
        }}
      >
        <div 
          className={clsx(
            'h-full rounded-sm transition-all duration-500',
            isCharging && 'animate-pulse'
          )}
          style={{ 
            width: `${level}%`,
            background: getBatteryColor(level),
          }}
        />
        {isCharging && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z" />
            </svg>
          </div>
        )}
      </div>
      <div 
        className="rounded-sm"
        style={{ 
          width: s.cap, 
          height: s.height * 0.5,
          background: colors.primary 
        }}
      />
    </div>
  );
}

interface BatteryBarProps {
  startLevel: number;
  endLevel: number;
  showLabels?: boolean;
}

export function BatteryBar({ startLevel, endLevel, showLabels = true }: BatteryBarProps) {
  const { theme } = useSettingsStore();

  const themeColors: Record<string, { muted: string }> = {
    cyber: { muted: '#808080' },
    tesla: { muted: '#888888' },
    dark: { muted: '#8d99ae' },
    tech: { muted: '#778da9' },
    aurora: { muted: '#98c1d9' },
  };

  const colors = themeColors[theme] || themeColors.cyber;

  return (
    <div className="w-full">
      <div className="relative h-6 rounded-full overflow-hidden bg-gray-800">
        {/* 背景渐变 */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(90deg, #ff4444 0%, #ffaa00 25%, #00ff88 50%, #00f0ff 100%)'
          }}
        />
        {/* 起始位置标记 */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white/80"
          style={{ left: `${startLevel}%` }}
        />
        {/* 结束位置标记 */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white"
          style={{ left: `${endLevel}%` }}
        />
        {/* 充电区域高亮 */}
        <div 
          className="absolute top-0 bottom-0 bg-white/20"
          style={{ 
            left: `${Math.min(startLevel, endLevel)}%`,
            width: `${Math.abs(endLevel - startLevel)}%`
          }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1 text-xs" style={{ color: colors.muted }}>
          <span>{startLevel}%</span>
          <span>→</span>
          <span>{endLevel}%</span>
        </div>
      )}
    </div>
  );
}
