import { useSettingsStore } from '@/store/settings';
import { getThemeColors } from '@/utils/theme';
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
}

export function BatteryBar({ startLevel, endLevel }: BatteryBarProps) {
  const { theme } = useSettingsStore();
  const colors = getThemeColors(theme);

  // 计算增加的电量
  const addedLevel = Math.max(0, endLevel - startLevel);
  // 用于行驶消耗的情况（endLevel < startLevel）
  const isConsuming = endLevel < startLevel;
  const consumedLevel = isConsuming ? startLevel - endLevel : 0;

  return (
    <div className="w-full">
      {/* 进度条容器 */}
      <div className="relative h-8 rounded-lg overflow-hidden bg-gray-800/60 border border-gray-700/50">
        {/* 起始电量部分（浅灰色/暗色） */}
        <div
          className="absolute top-0 bottom-0 left-0"
          style={{
            width: `${Math.min(startLevel, endLevel)}%`,
            background: isConsuming
              ? `linear-gradient(90deg, ${colors.primary}40 0%, ${colors.primary}60 100%)`
              : 'linear-gradient(90deg, rgba(80,80,100,0.6) 0%, rgba(100,100,120,0.7) 100%)',
          }}
        />

        {/* 新增电量部分（充电）或消耗部分（行驶） */}
        {!isConsuming && addedLevel > 0 && (
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${startLevel}%`,
              width: `${addedLevel}%`,
              background: `linear-gradient(90deg, ${colors.success}90 0%, ${colors.success} 50%, ${colors.primary}90 100%)`,
              boxShadow: `0 0 10px ${colors.success}50`,
            }}
          />
        )}

        {/* 消耗电量部分（行驶时显示为虚线框） */}
        {isConsuming && consumedLevel > 0 && (
          <div
            className="absolute top-0 bottom-0"
            style={{
              left: `${endLevel}%`,
              width: `${consumedLevel}%`,
              background: 'repeating-linear-gradient(90deg, rgba(255,100,100,0.2), rgba(255,100,100,0.2) 4px, transparent 4px, transparent 8px)',
              borderLeft: '2px dashed rgba(255,100,100,0.5)',
            }}
          />
        )}

        {/* 左侧起始电量标签 */}
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10"
          style={{
            color: '#ffffff',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)'
          }}
        >
          <span className="text-sm font-bold">{startLevel}%</span>
        </div>

        {/* 中间增量/消耗标签 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{
              color: '#ffffff',
              background: isConsuming ? 'rgba(255,107,107,0.4)' : 'rgba(0,0,0,0.3)', // Darker background for contrast
              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              backdropFilter: 'blur(2px)'
            }}
          >
            {isConsuming ? `${startLevel - endLevel}%` : `+${addedLevel}%`}
          </span>
        </div>

        {/* 右侧结束电量标签 */}
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10"
          style={{
            color: '#ffffff',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)'
          }}
        >
          <span className="text-sm font-bold">{endLevel}%</span>
        </div>
      </div>
    </div>
  );
}

