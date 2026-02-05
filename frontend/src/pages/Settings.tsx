import { useState, useRef } from 'react';
import { useSettingsStore, type ThemeType, type UnitType, type LanguageType, type MapType } from '@/store/settings';
import { Card } from '@/components/Card';
import { useTranslation } from '@/utils/i18n';
import { getThemeColors, themeConfigs } from '@/utils/theme';
import clsx from 'clsx';

export default function SettingsPage() {
  const { 
    theme, setTheme, unit, setUnit, language, setLanguage, 
    amapKey, setAmapKey, baseUrl, setBaseUrl, apiKey, setApiKey, 
    mapType, setMapType,
    backgroundImage, uploadBackgroundImage, deleteBackgroundImage 
  } = useSettingsStore();
  const { t } = useTranslation(language);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = getThemeColors(theme);

  // 高德地图是否可用（需要配置 API Key）
  const isAmapAvailable = !!amapKey;

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

  // 处理背景图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setUploadError(language === 'zh' ? '请选择图片文件' : 'Please select an image file');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(language === 'zh' ? '图片大小不能超过 5MB' : 'Image size cannot exceed 5MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 读取文件为 Base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        try {
          await uploadBackgroundImage(base64);
          setUploadError(null);
        } catch (err) {
          setUploadError(language === 'zh' ? '上传失败，请重试' : 'Upload failed, please try again');
          console.error('Upload error:', err);
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError(language === 'zh' ? '读取文件失败' : 'Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadError(language === 'zh' ? '处理图片失败' : 'Failed to process image');
      setUploading(false);
    }

    // 清空 input 以便再次选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 删除背景图片
  const handleDeleteBackground = async () => {
    try {
      await deleteBackgroundImage();
      setUploadError(null);
    } catch (err) {
      setUploadError(language === 'zh' ? '删除失败' : 'Delete failed');
      console.error('Delete error:', err);
    }
  };

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

      {/* Background Image Settings */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <h3 className="font-semibold" style={{ color: colors.primary }}>
            {language === 'zh' ? '背景图片' : 'Background Image'}
          </h3>
        </div>

        {/* 当前背景预览 */}
        {backgroundImage && (
          <div className="mb-4 relative">
            <div 
              className="w-full h-32 rounded-lg bg-cover bg-center border"
              style={{ 
                backgroundImage: `url(${backgroundImage})`,
                borderColor: colors.border 
              }}
            />
            <button
              onClick={handleDeleteBackground}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-red-500/80 transition-colors"
              title={language === 'zh' ? '删除背景' : 'Delete background'}
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        )}

        {/* 上传区域 */}
        <div 
          className={clsx(
            'border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer',
            uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-opacity-100'
          )}
          style={{ borderColor: `${colors.primary}50` }}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
              <span style={{ color: colors.muted }}>
                {language === 'zh' ? '上传中...' : 'Uploading...'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span style={{ color: colors.muted }}>
                {language === 'zh' 
                  ? (backgroundImage ? '点击更换背景图片' : '点击上传背景图片')
                  : (backgroundImage ? 'Click to change background' : 'Click to upload background')}
              </span>
              <span className="text-xs" style={{ color: colors.muted }}>
                {language === 'zh' ? '支持 JPG、PNG、WebP，最大 5MB' : 'Supports JPG, PNG, WebP, max 5MB'}
              </span>
            </div>
          )}
        </div>

        {/* 错误提示 */}
        {uploadError && (
          <div 
            className="mt-3 p-2 rounded-lg text-sm"
            style={{ backgroundColor: 'rgba(255,0,0,0.1)', color: '#ff6b6b' }}
          >
            {uploadError}
          </div>
        )}

        {/* 说明 */}
        <p className="text-xs mt-3" style={{ color: colors.muted }}>
          {language === 'zh' 
            ? '背景图片会保存到服务端，所有设备同步显示。建议使用深色图片以获得更好的视觉效果。'
            : 'Background image is saved on server and synced across devices. Dark images work best.'}
        </p>
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

      {/* Map Settings */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="font-semibold" style={{ color: colors.primary }}>
            {language === 'zh' ? '地图设置' : 'Map Settings'}
          </h3>
        </div>
        
        <div className="flex gap-3">
          {/* OpenStreetMap */}
          <button
            onClick={() => setMapType('openstreet')}
            className={clsx(
              'flex-1 p-3 rounded-lg border transition-all',
              mapType === 'openstreet' ? '' : 'opacity-70 hover:opacity-100'
            )}
            style={{
              borderColor: mapType === 'openstreet' ? colors.primary : colors.border,
              background: mapType === 'openstreet' ? `${colors.primary}10` : 'transparent',
              color: mapType === 'openstreet' ? colors.primary : colors.muted,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="text-sm font-medium">
                {language === 'zh' ? '开源地图' : 'OpenStreetMap'}
              </span>
              <span className="text-xs opacity-70">
                {language === 'zh' ? '无需配置' : 'No config needed'}
              </span>
            </div>
          </button>

          {/* AMap / 高德地图 */}
          <button
            onClick={() => isAmapAvailable && setMapType('amap')}
            disabled={!isAmapAvailable}
            className={clsx(
              'flex-1 p-3 rounded-lg border transition-all relative',
              !isAmapAvailable && 'cursor-not-allowed',
              mapType === 'amap' ? '' : isAmapAvailable ? 'opacity-70 hover:opacity-100' : 'opacity-40'
            )}
            style={{
              borderColor: mapType === 'amap' ? colors.primary : colors.border,
              background: mapType === 'amap' ? `${colors.primary}10` : 'transparent',
              color: mapType === 'amap' ? colors.primary : colors.muted,
            }}
          >
            <div className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">
                {language === 'zh' ? '高德地图' : 'AMap'}
              </span>
              <span className="text-xs opacity-70">
                {isAmapAvailable 
                  ? (language === 'zh' ? '中国地区推荐' : 'Best for China')
                  : (language === 'zh' ? '需配置 API Key' : 'API Key required')
                }
              </span>
            </div>
            {/* 锁定图标 */}
            {!isAmapAvailable && (
              <div className="absolute top-2 right-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* 提示信息 */}
        <p className="text-xs mt-3" style={{ color: colors.muted }}>
          {language === 'zh' 
            ? '高德地图在中国地区有更精确的坐标纠偏，国外地区请使用开源地图。'
            : 'AMap provides better accuracy in China. Use OpenStreetMap for other regions.'}
        </p>
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
