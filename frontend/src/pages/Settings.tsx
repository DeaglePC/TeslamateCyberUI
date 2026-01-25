import { useSettingsStore, type ThemeType, type UnitType } from '@/store/settings';
import { Card } from '@/components/Card';
import clsx from 'clsx';

const themes: { id: ThemeType; name: string; colors: { bg: string; primary: string } }[] = [
  { id: 'cyber', name: '赛博朋克', colors: { bg: '#0a0a0f', primary: '#00f0ff' } },
  { id: 'tesla', name: '特斯拉', colors: { bg: '#111111', primary: '#cc0000' } },
  { id: 'dark', name: '暗夜', colors: { bg: '#1a1a2e', primary: '#4361ee' } },
  { id: 'tech', name: '科技蓝', colors: { bg: '#0d1b2a', primary: '#0077b6' } },
  { id: 'aurora', name: '极光', colors: { bg: '#0b132b', primary: '#72efdd' } },
];

const units: { id: UnitType; name: string }[] = [
  { id: 'metric', name: '公制 (km, °C)' },
  { id: 'imperial', name: '英制 (mi, °F)' },
];

export default function SettingsPage() {
  const { theme, setTheme, unit, setUnit, amapKey, setAmapKey } = useSettingsStore();

  const themeColors: Record<string, { primary: string; muted: string; border: string }> = {
    cyber: { primary: '#00f0ff', muted: '#808080', border: 'rgba(0,240,255,0.3)' },
    tesla: { primary: '#cc0000', muted: '#888888', border: 'rgba(255,255,255,0.1)' },
    dark: { primary: '#4361ee', muted: '#8d99ae', border: 'rgba(67,97,238,0.3)' },
    tech: { primary: '#0077b6', muted: '#778da9', border: 'rgba(0,119,182,0.3)' },
    aurora: { primary: '#72efdd', muted: '#98c1d9', border: 'rgba(114,239,221,0.3)' },
  };

  const colors = themeColors[theme] || themeColors.cyber;

  return (
    <div className="space-y-6 animate-slideUp max-w-2xl">
      <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
        设置
      </h1>

      {/* 主题设置 */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>主题</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={clsx(
                'p-3 rounded-lg border-2 transition-all',
                theme === t.id ? 'scale-105' : 'opacity-70 hover:opacity-100'
              )}
              style={{
                background: t.colors.bg,
                borderColor: theme === t.id ? t.colors.primary : 'transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ background: t.colors.primary }}
                />
                <span style={{ color: t.colors.primary }}>{t.name}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* 单位设置 */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>单位</h3>
        <div className="flex gap-3">
          {units.map((u) => (
            <button
              key={u.id}
              onClick={() => setUnit(u.id)}
              className={clsx(
                'flex-1 p-3 rounded-lg border transition-all',
                unit === u.id ? '' : 'opacity-70 hover:opacity-100'
              )}
              style={{
                borderColor: unit === u.id ? colors.primary : colors.border,
                background: unit === u.id ? `${colors.primary}10` : 'transparent',
                color: unit === u.id ? colors.primary : colors.muted,
              }}
            >
              {u.name}
            </button>
          ))}
        </div>
      </Card>

      {/* 高德地图 API Key */}
      <Card>
        <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>高德地图 API Key</h3>
        <p className="text-sm mb-2" style={{ color: colors.muted }}>
          用于显示驾驶轨迹地图，请在
          <a
            href="https://console.amap.com/dev/key/app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline mx-1"
            style={{ color: colors.primary }}
          >
            高德开放平台
          </a>
          申请 API Key
        </p>
        <div className="mb-4 p-3 rounded-lg border" style={{ backgroundColor: `${colors.primary}10`, borderColor: colors.primary }}>
          <p className="text-sm font-semibold mb-1" style={{ color: colors.primary }}>
            ⚠️ 重要提示
          </p>
          <p className="text-xs" style={{ color: colors.muted }}>
            必须选择「Web端 (JS API)」类型的 Key，不能使用「Web服务」Key。
            <br />
            如果配置错误，地图将无法加载并提示 USERKEY_PLAT_NOMATCH 错误。
          </p>
        </div>
        <input
          type="text"
          value={amapKey}
          onChange={(e) => setAmapKey(e.target.value)}
          placeholder="请输入高德地图 API Key"
          className="w-full p-3 rounded-lg border bg-transparent outline-none transition-all focus:ring-2"
          style={{
            borderColor: colors.border,
            color: colors.primary,
          }}
        />
      </Card>

      {/* 关于 */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>关于</h3>
        <div className="space-y-2" style={{ color: colors.muted }}>
          <p>TeslaMate CyberUI v1.0.0</p>
          <p>一个现代化的 TeslaMate 数据可视化面板</p>
          <p className="text-sm">
            基于 React + TypeScript + Tailwind CSS 构建
          </p>
        </div>
      </Card>

      {/* 数据说明 */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>数据说明</h3>
        <div className="space-y-2 text-sm" style={{ color: colors.muted }}>
          <p>• 本应用以只读方式连接 TeslaMate PostgreSQL 数据库</p>
          <p>• 数据每 30 秒自动刷新</p>
          <p>• 能效计算基于续航里程变化估算</p>
          <p>• 电池衰减数据基于高电量充电记录分析</p>
        </div>
      </Card>
    </div>
  );
}
