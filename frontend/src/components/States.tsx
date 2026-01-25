import { useSettingsStore } from '@/store/settings';

export function Loading() {
  const { theme } = useSettingsStore();

  const themeColors: Record<string, string> = {
    cyber: '#00f0ff',
    tesla: '#cc0000',
    dark: '#4361ee',
    tech: '#0077b6',
    aurora: '#72efdd',
  };

  const color = themeColors[theme] || themeColors.cyber;

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div 
        className="w-10 h-10 border-3 rounded-full animate-spin"
        style={{
          borderColor: `${color}30`,
          borderTopColor: color,
        }}
      />
    </div>
  );
}

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ message = '暂无数据', icon }: EmptyStateProps) {
  const { theme } = useSettingsStore();

  const themeColors: Record<string, string> = {
    cyber: '#808080',
    tesla: '#888888',
    dark: '#8d99ae',
    tech: '#778da9',
    aurora: '#98c1d9',
  };

  const color = themeColors[theme] || themeColors.cyber;

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4" style={{ color }}>
      {icon || (
        <svg className="w-16 h-16 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 15h8M9 9h.01M15 9h.01" />
        </svg>
      )}
      <p className="text-lg">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = '加载失败', onRetry }: ErrorStateProps) {
  const { theme } = useSettingsStore();

  const themeColors: Record<string, { error: string; primary: string }> = {
    cyber: { error: '#ff4444', primary: '#00f0ff' },
    tesla: { error: '#f44336', primary: '#cc0000' },
    dark: { error: '#ef476f', primary: '#4361ee' },
    tech: { error: '#e63946', primary: '#0077b6' },
    aurora: { error: '#d62828', primary: '#72efdd' },
  };

  const colors = themeColors[theme] || themeColors.cyber;

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
      <svg 
        className="w-16 h-16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke={colors.error}
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <p className="text-lg" style={{ color: colors.error }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg transition-all hover:opacity-80"
          style={{ 
            background: `${colors.primary}20`,
            color: colors.primary,
            border: `1px solid ${colors.primary}50`
          }}
        >
          重试
        </button>
      )}
    </div>
  );
}
