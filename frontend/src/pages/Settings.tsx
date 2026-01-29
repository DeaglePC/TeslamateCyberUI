import { useSettingsStore, type ThemeType, type UnitType, type LanguageType } from '@/store/settings';
import { Card } from '@/components/Card';
import { useTranslation } from '@/utils/i18n';
import clsx from 'clsx';

export default function SettingsPage() {
  const { theme, setTheme, unit, setUnit, language, setLanguage, amapKey, setAmapKey, baseUrl, setBaseUrl, apiKey, setApiKey } = useSettingsStore();
  const { t } = useTranslation(language);

  const themeColors: Record<string, { primary: string; muted: string; border: string }> = {
    cyber: { primary: '#00f0ff', muted: '#808080', border: 'rgba(0,240,255,0.3)' },
    tesla: { primary: '#cc0000', muted: '#888888', border: 'rgba(255,255,255,0.1)' },
    dark: { primary: '#4361ee', muted: '#8d99ae', border: 'rgba(67,97,238,0.3)' },
    tech: { primary: '#0077b6', muted: '#778da9', border: 'rgba(0,119,182,0.3)' },
    aurora: { primary: '#72efdd', muted: '#98c1d9', border: 'rgba(114,239,221,0.3)' },
  };

  const colors = themeColors[theme] || themeColors.cyber;

  const themes: { id: ThemeType; name: Record<LanguageType, string>; colors: { bg: string; primary: string } }[] = [
    { id: 'cyber', name: { zh: '赛博朋克', en: 'Cyberpunk' }, colors: { bg: '#0a0a0f', primary: '#00f0ff' } },
    { id: 'tesla', name: { zh: '特斯拉', en: 'Tesla' }, colors: { bg: '#111111', primary: '#cc0000' } },
    { id: 'dark', name: { zh: '暗夜', en: 'Dark' }, colors: { bg: '#1a1a2e', primary: '#4361ee' } },
    { id: 'tech', name: { zh: '科技蓝', en: 'Tech Blue' }, colors: { bg: '#0d1b2a', primary: '#0077b6' } },
    { id: 'aurora', name: { zh: '极光', en: 'Aurora' }, colors: { bg: '#0b132b', primary: '#72efdd' } },
  ];

  const units: { id: UnitType; name: string }[] = [
    { id: 'metric', name: t('metric') },
    { id: 'imperial', name: t('imperial') },
  ];

  const languages: { id: LanguageType; name: string }[] = [
    { id: 'zh', name: t('chinese') },
    { id: 'en', name: t('english') },
  ];

  return (
    <div className="space-y-6 animate-slideUp max-w-2xl">
      <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
        {t('settings')}
      </h1>

      {/* Theme Settings */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>{t('themeSettings')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {themes.map((th) => (
            <button
              key={th.id}
              onClick={() => setTheme(th.id)}
              className={clsx(
                'p-3 rounded-lg border-2 transition-all',
                theme === th.id ? 'scale-105' : 'opacity-70 hover:opacity-100'
              )}
              style={{
                background: th.colors.bg,
                borderColor: theme === th.id ? th.colors.primary : 'transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ background: th.colors.primary }}
                />
                <span style={{ color: th.colors.primary }}>{th.name[language]}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Language Settings */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>{t('languageSettings')}</h3>
        <div className="flex gap-3">
          {languages.map((l) => (
            <button
              key={l.id}
              onClick={() => setLanguage(l.id)}
              className={clsx(
                'flex-1 p-3 rounded-lg border transition-all',
                language === l.id ? '' : 'opacity-70 hover:opacity-100'
              )}
              style={{
                borderColor: language === l.id ? colors.primary : colors.border,
                background: language === l.id ? `${colors.primary}10` : 'transparent',
                color: language === l.id ? colors.primary : colors.muted,
              }}
            >
              {l.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Unit Settings */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>{t('unitSettings')}</h3>
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

      {/* API Settings */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>
          {language === 'zh' ? 'API 连接设置' : 'API Connection Settings'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: colors.muted }}>
              {language === 'zh' ? '后端地址' : 'Backend URL'}
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:8080"
              className="w-full p-3 rounded-lg border bg-transparent outline-none transition-all focus:ring-2"
              style={{
                borderColor: colors.border,
                color: colors.primary,
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: colors.muted }}>
              {language === 'zh' ? 'API Key' : 'API Key'}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={language === 'zh' ? '如果后端启用了鉴权' : 'If backend auth is enabled'}
              className="w-full p-3 rounded-lg border bg-transparent outline-none transition-all focus:ring-2"
              style={{
                borderColor: colors.border,
                color: colors.primary,
              }}
            />
          </div>
          <p className="text-xs" style={{ color: colors.muted }}>
            {language === 'zh'
              ? '修改后刷新页面生效'
              : 'Changes take effect after page refresh'}
          </p>
        </div>
      </Card>

      {/* AMap API Key */}
      <Card>
        <h3 className="font-semibold mb-2" style={{ color: colors.primary }}>{t('amapApiKey')}</h3>
        <p className="text-sm mb-2" style={{ color: colors.muted }}>
          {language === 'zh' ? '用于显示驾驶轨迹地图，请在' : 'Used for driving route map. Get key from '}
          <a
            href="https://console.amap.com/dev/key/app"
            target="_blank"
            rel="noopener noreferrer"
            className="underline mx-1"
            style={{ color: colors.primary }}
          >
            {language === 'zh' ? '高德开放平台' : 'AMap Console'}
          </a>
          {language === 'zh' ? '申请 API Key' : ''}
        </p>
        <div className="mb-4 p-3 rounded-lg border" style={{ backgroundColor: `${colors.primary}10`, borderColor: colors.primary }}>
          <p className="text-sm font-semibold mb-1" style={{ color: colors.primary }}>
            ⚠️ {language === 'zh' ? '重要提示' : 'Important'}
          </p>
          <p className="text-xs" style={{ color: colors.muted }}>
            {language === 'zh'
              ? '必须选择「Web端 (JS API)」类型的 Key，不能使用「Web服务」Key。'
              : 'Must use "Web (JS API)" type Key, not "Web Service" Key.'}
            <br />
            {language === 'zh'
              ? '如果配置错误，地图将无法加载并提示 USERKEY_PLAT_NOMATCH 错误。'
              : 'Incorrect key type will cause USERKEY_PLAT_NOMATCH error.'}
          </p>
        </div>
        <input
          type="text"
          value={amapKey}
          onChange={(e) => setAmapKey(e.target.value)}
          placeholder={t('amapKeyPlaceholder')}
          className="w-full p-3 rounded-lg border bg-transparent outline-none transition-all focus:ring-2"
          style={{
            borderColor: colors.border,
            color: colors.primary,
          }}
        />
      </Card>

      {/* About */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>
          {language === 'zh' ? '关于' : 'About'}
        </h3>
        <div className="space-y-2" style={{ color: colors.muted }}>
          <p>TeslaMate CyberUI v1.0.0</p>
          <p>{language === 'zh' ? '一个现代化的 TeslaMate 数据可视化面板' : 'A modern TeslaMate data visualization dashboard'}</p>
          <p className="text-sm">
            {language === 'zh' ? '基于 React + TypeScript + Tailwind CSS 构建' : 'Built with React + TypeScript + Tailwind CSS'}
          </p>
        </div>
      </Card>

      {/* Data Info */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>
          {language === 'zh' ? '数据说明' : 'Data Information'}
        </h3>
        <div className="space-y-2 text-sm" style={{ color: colors.muted }}>
          {language === 'zh' ? (
            <>
              <p>• 本应用以只读方式连接 TeslaMate PostgreSQL 数据库</p>
              <p>• 数据每 30 秒自动刷新</p>
              <p>• 能效计算基于续航里程变化估算</p>
              <p>• 电池衰减数据基于高电量充电记录分析</p>
            </>
          ) : (
            <>
              <p>• This app connects to TeslaMate PostgreSQL in read-only mode</p>
              <p>• Data refreshes automatically every 30 seconds</p>
              <p>• Efficiency is calculated based on range changes</p>
              <p>• Battery degradation is analyzed from high-SOC charging records</p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
