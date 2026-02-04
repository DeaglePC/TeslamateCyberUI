import { useState } from 'react';
import { useSettingsStore, type ThemeType, type UnitType, type LanguageType } from '@/store/settings';
import { Card } from '@/components/Card';
import { useTranslation } from '@/utils/i18n';
import { getThemeColors, themeConfigs } from '@/utils/theme';
import clsx from 'clsx';

export default function SettingsPage() {
  const { theme, setTheme, unit, setUnit, language, setLanguage, amapKey, setAmapKey, baseUrl, setBaseUrl, apiKey, setApiKey } = useSettingsStore();
  const { t } = useTranslation(language);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const colors = getThemeColors(theme);

  // Test API connection
  const testConnection = async () => {
    if (!baseUrl) {
      setTestResult({ success: false, message: language === 'zh' ? '请输入后端地址' : 'Please enter backend URL' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const url = baseUrl.replace(/\/$/, '');
      const response = await fetch(`${url}/health`, {
        method: 'GET',
        headers: apiKey ? { 'X-API-Key': apiKey } : {},
      });

      if (response.ok) {
        setTestResult({ success: true, message: language === 'zh' ? '连接成功！页面将刷新...' : 'Connected! Page will reload...' });
        // Reload page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else if (response.status === 401) {
        setTestResult({ success: false, message: language === 'zh' ? 'API Key 错误或未配置' : 'Invalid or missing API Key' });
      } else {
        setTestResult({ success: false, message: language === 'zh' ? '连接失败' : 'Connection failed' });
      }
    } catch {
      setTestResult({ success: false, message: language === 'zh' ? '无法连接到服务器' : 'Cannot connect to server' });
    } finally {
      setTesting(false);
    }
  };

  // Theme options for UI display
  const themes: { id: ThemeType; name: Record<LanguageType, string>; colors: { bg: string; primary: string } }[] = [
    { id: 'cyber', name: { zh: '赛博朋克', en: 'Cyberpunk' }, colors: { bg: themeConfigs.cyber.bg, primary: themeConfigs.cyber.primary } },
    { id: 'tesla', name: { zh: '特斯拉', en: 'Tesla' }, colors: { bg: themeConfigs.tesla.bg, primary: themeConfigs.tesla.primary } },
    { id: 'dark', name: { zh: '暗夜', en: 'Dark' }, colors: { bg: themeConfigs.dark.bg, primary: themeConfigs.dark.primary } },
    { id: 'tech', name: { zh: '科技蓝', en: 'Tech Blue' }, colors: { bg: themeConfigs.tech.bg, primary: themeConfigs.tech.primary } },
    { id: 'aurora', name: { zh: '极光', en: 'Aurora' }, colors: { bg: themeConfigs.aurora.bg, primary: themeConfigs.aurora.primary } },
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
    <div className="space-y-6 animate-slideUp max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
        {t('settings')}
      </h1>

      {/* Theme Settings */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <h3 className="font-semibold" style={{ color: colors.primary }}>{language === 'zh' ? '界面主题' : 'INTERFACE THEME'}</h3>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {themes.map((th) => {
            const isActive = theme === th.id;
            return (
              <div key={th.id} className="flex flex-col gap-2 group items-center">
                <button
                  onClick={() => setTheme(th.id)}
                  className={clsx(
                    'relative w-full aspect-[4/3] rounded-lg border-2 transition-all duration-300 overflow-hidden',
                    isActive ? 'scale-105 ring-2 ring-offset-2 ring-offset-black/50' : 'hover:scale-105 opacity-80 hover:opacity-100 hover:border-white/20'
                  )}
                  style={{
                    backgroundColor: th.colors.bg,
                    borderColor: isActive ? th.colors.primary : 'rgba(255,255,255,0.1)',
                    boxShadow: isActive ? `0 0 15px ${th.colors.primary}60, inset 0 0 15px ${th.colors.primary}20` : 'none',
                    '--theme-primary': th.colors.primary,
                  } as React.CSSProperties}
                >
                  {/* Grid Pattern Overlay */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: `radial-gradient(${th.colors.primary} 1px, transparent 1px)`,
                      backgroundSize: '8px 8px'
                    }}
                  />

                  {/* Active Badge - Scaled down for smaller cards */}
                  {isActive && (
                    <div
                      className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider z-20 shadow-lg leading-none"
                      style={{
                        backgroundColor: th.colors.primary,
                        color: '#000000',
                        boxShadow: `0 0 8px ${th.colors.primary}`
                      }}
                    >
                      ACTIVE
                    </div>
                  )}

                  {/* Preview Elements */}
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Glowing Circle - Scaled */}
                    <div
                      className="absolute top-2 left-2 w-7 h-7 rounded-full border-[1.5px] transition-transform duration-300 group-hover:scale-110"
                      style={{
                        borderColor: th.colors.primary,
                        boxShadow: `0 0 10px ${th.colors.primary}, inset 0 0 5px ${th.colors.primary}40`,
                        background: `${th.colors.primary}10`
                      }}
                    />

                    {/* Glowing Bar - Scaled */}
                    <div
                      className="absolute bottom-3 right-3 w-10 h-2 rounded-full transition-all duration-300 group-hover:w-12"
                      style={{
                        backgroundColor: th.colors.primary,
                        boxShadow: `0 0 8px ${th.colors.primary}`
                      }}
                    />
                  </div>
                </button>

                {/* Theme Name */}
                <span className={clsx(
                  "text-xs font-medium tracking-wide transition-colors duration-300 text-center",
                  isActive ? "font-bold text-white shadow-glow" : "text-gray-400 group-hover:text-gray-200"
                )}>
                  {th.name[language]}
                </span>
              </div>
            );
          })}
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
              ? '修改后点击测试连接'
              : 'Click Test Connection after changes'}
          </p>

          {/* Test result message */}
          {testResult && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: testResult.success ? `${colors.success}15` : 'rgba(255,0,0,0.1)',
                color: testResult.success ? colors.success : '#ff6b6b',
                border: `1px solid ${testResult.success ? colors.success : 'rgba(255,0,0,0.3)'}`,
              }}
            >
              {testResult.message}
            </div>
          )}

          {/* Test connection button */}
          <button
            onClick={testConnection}
            disabled={testing}
            className={clsx(
              'w-full p-3 rounded-lg font-semibold transition-all',
              testing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
            )}
            style={{
              backgroundColor: colors.primary,
              color: colors.bg,
            }}
          >
            {testing
              ? (language === 'zh' ? '测试中...' : 'Testing...')
              : (language === 'zh' ? '测试连接' : 'Test Connection')}
          </button>
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
          type="password"
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
