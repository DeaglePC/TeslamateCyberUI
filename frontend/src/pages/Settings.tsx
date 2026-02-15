import { useState, useRef, useEffect } from 'react';
import { useSettingsStore, type ThemeType, type UnitType, type LanguageType } from '@/store/settings';
import { Card } from '@/components/Card';
import { ImageCropper } from '@/components/ImageCropper';
import { useTranslation } from '@/utils/i18n';
import { getThemeColors, themeConfigs, setAutoThemeColor } from '@/utils/theme';
import { extractDominantColor, generateThemeFromColor } from '@/utils/colorExtractor';
import type { ThemeColors } from '@/utils/theme';
import clsx from 'clsx';

// 自动主题色全部颜色预览组件
function AutoThemeColorPreview({
  primaryColor,
  language,
  themeColors,
}: {
  primaryColor: string;
  language: LanguageType;
  themeColors: ThemeColors;
}) {
  const [expanded, setExpanded] = useState(false);
  const generated = generateThemeFromColor(primaryColor);

  const baseColors: { label: Record<LanguageType, string>; color: string }[] = [
    { label: { zh: '主色', en: 'Primary' }, color: generated.primary },
    { label: { zh: '辅色', en: 'Accent' }, color: generated.accent },
    { label: { zh: '柔和', en: 'Muted' }, color: generated.muted },
    { label: { zh: '成功', en: 'Success' }, color: generated.success },
    { label: { zh: '警告', en: 'Warning' }, color: generated.warning },
    { label: { zh: '危险', en: 'Danger' }, color: generated.danger },
    { label: { zh: '背景', en: 'BG' }, color: generated.bg },
  ];

  const timelineColors: { label: Record<LanguageType, string>; color: string }[] = [
    { label: { zh: '行驶', en: 'Drive' }, color: generated.timeline.driving },
    { label: { zh: '充电', en: 'Charge' }, color: generated.timeline.charging },
    { label: { zh: '在线', en: 'Online' }, color: generated.timeline.online },
    { label: { zh: '更新', en: 'Update' }, color: generated.timeline.updating },
    { label: { zh: '离线', en: 'Offline' }, color: generated.timeline.offline },
  ];

  const getHex = (color: string) => color.startsWith('#') ? color.toUpperCase() : '';

  return (
    <div className="mt-3">
      {/* 折叠标题栏：色块摘要 + 展开/收起 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          {/* 主色+辅色小色块摘要 */}
          <div
            className="w-5 h-5 rounded"
            style={{ backgroundColor: generated.primary, boxShadow: `0 0 6px ${generated.primary}50` }}
          />
          <div
            className="w-5 h-5 rounded"
            style={{ backgroundColor: generated.accent, boxShadow: `0 0 6px ${generated.accent}50` }}
          />
          <span className="text-xs font-mono" style={{ color: themeColors.primary }}>
            {generated.primary.toUpperCase()}
          </span>
          <span className="text-xs" style={{ color: themeColors.muted }}>
            {language === 'zh' ? '从背景图提取' : 'Extracted from BG'}
          </span>
        </div>
        <svg
          className="w-4 h-4 transition-transform duration-300"
          style={{
            color: themeColors.muted,
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* 可折叠内容 */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{
          maxHeight: expanded ? '500px' : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="pt-3 space-y-3">
          {/* 基础色 */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: themeColors.muted }}>
              {language === 'zh' ? '基础配色' : 'Base Colors'}
            </p>
            <div className="flex flex-wrap gap-3">
              {baseColors.map((entry) => (
                <div key={entry.label.en} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-md border shadow-sm"
                    style={{
                      backgroundColor: entry.color,
                      borderColor: 'rgba(255,255,255,0.15)',
                      boxShadow: `0 0 6px ${entry.color}40`,
                    }}
                  />
                  <span className="text-[11px] leading-tight" style={{ color: themeColors.muted }}>
                    {entry.label[language]}
                  </span>
                  {getHex(entry.color) && (
                    <span className="text-[9px] font-mono leading-tight" style={{ color: `${themeColors.primary}80` }}>
                      {getHex(entry.color)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 时间线色 */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: themeColors.muted }}>
              {language === 'zh' ? '时间线配色' : 'Timeline Colors'}
            </p>
            <div className="flex flex-wrap gap-3">
              {timelineColors.map((entry) => (
                <div key={entry.label.en} className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-md border shadow-sm"
                    style={{
                      backgroundColor: entry.color,
                      borderColor: 'rgba(255,255,255,0.15)',
                      boxShadow: `0 0 6px ${entry.color}40`,
                    }}
                  />
                  <span className="text-[11px] leading-tight" style={{ color: themeColors.muted }}>
                    {entry.label[language]}
                  </span>
                  {getHex(entry.color) && (
                    <span className="text-[9px] font-mono leading-tight" style={{ color: `${themeColors.primary}80` }}>
                      {getHex(entry.color)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 图表色 */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: themeColors.muted }}>
              {language === 'zh' ? '图表配色' : 'Chart Colors'}
            </p>
            <div className="flex gap-1.5">
              {generated.chart.map((color, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-5 rounded-sm first:rounded-l-md last:rounded-r-md"
                  style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}40` }}
                  title={color.toUpperCase()}
                />
              ))}
            </div>
          </div>

          {/* 渐变预览 */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: themeColors.muted }}>
              {language === 'zh' ? '渐变色' : 'Gradient'}
            </p>
            <div
              className="h-4 rounded-md"
              style={{
                background: `linear-gradient(to right, ${generated.gradient[0]}, ${generated.gradient[1]})`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { 
    theme, setTheme, unit, setUnit, language, setLanguage, 
    amapKey, setAmapKey, baseUrl, setBaseUrl, apiKey, setApiKey, 
    mapType, setMapType,
    backgroundImage, backgroundOriginalImage, uploadBackgroundImage, deleteBackgroundImage,
    cardOpacity, setCardOpacity,
    autoThemeFromBg, setAutoThemeFromBg, autoThemePrimaryColor, setAutoThemePrimaryColor
  } = useSettingsStore();
  const { t } = useTranslation(language);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractingColor, setExtractingColor] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [isReCropping, setIsReCropping] = useState(false); // 是否正在重新调整
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bgImageRatio, setBgImageRatio] = useState<number | null>(null); // 背景图片宽高比

  const colors = getThemeColors(theme);

  // 检测背景图片尺寸
  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        setBgImageRatio(img.width / img.height);
      };
      img.src = backgroundImage;
    } else {
      setBgImageRatio(null);
    }
  }, [backgroundImage]);

  // 当背景图片变化且开启了自动主题时，重新提取颜色
  useEffect(() => {
    if (autoThemeFromBg && backgroundImage) {
      setExtractingColor(true);
      extractDominantColor(backgroundImage)
        .then((primaryColor) => {
          setAutoThemePrimaryColor(primaryColor);
          setAutoThemeColor(primaryColor);
          if (theme !== 'auto') {
            setTheme('auto');
          }
        })
        .catch((err) => {
          console.error('Failed to extract color:', err);
        })
        .finally(() => {
          setExtractingColor(false);
        });
    }
  }, [backgroundImage, autoThemeFromBg]);

  // 初始化时如果已有自动主题色，恢复缓存
  useEffect(() => {
    if (autoThemeFromBg && autoThemePrimaryColor && theme === 'auto') {
      setAutoThemeColor(autoThemePrimaryColor);
    }
  }, []);

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

  // 处理背景图片上传 - 显示裁剪器
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

    setUploadError(null);

    try {
      // 读取文件为 Base64，显示裁剪器
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setCropperImage(base64);
      };
      reader.onerror = () => {
        setUploadError(language === 'zh' ? '读取文件失败' : 'Failed to read file');
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadError(language === 'zh' ? '处理图片失败' : 'Failed to process image');
    }

    // 清空 input 以便再次选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理裁剪完成
  const handleCropComplete = async (croppedImage: string) => {
    // 如果是重新调整，使用已保存的原始图片；否则使用当前裁剪器的源图片作为原始图片
    const originalImage = isReCropping ? backgroundOriginalImage : cropperImage;
    setCropperImage(null);
    setIsReCropping(false);
    setUploading(true);
    try {
      await uploadBackgroundImage(croppedImage, originalImage ?? undefined);
      setUploadError(null);
    } catch (err) {
      setUploadError(language === 'zh' ? '上传失败，请重试' : 'Upload failed, please try again');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  // 取消裁剪
  const handleCropCancel = () => {
    setCropperImage(null);
    setIsReCropping(false);
  };

  // 重新调整已上传的图片
  const handleReCrop = () => {
    if (backgroundOriginalImage) {
      setCropperImage(backgroundOriginalImage);
      setIsReCropping(true);
    } else {
      // 没有原始图片，提示用户重新上传
      setUploadError(language === 'zh' 
        ? '请重新上传图片以启用调整功能' 
        : 'Please re-upload image to enable cropping');
      // 触发文件选择
      fileInputRef.current?.click();
    }
  };

  // 删除背景图片
  const handleDeleteBackground = async () => {
    try {
      await deleteBackgroundImage();
      setUploadError(null);
      // 删除背景图后，自动关闭自动主题色并回退到 cyber 主题
      if (autoThemeFromBg) {
        setAutoThemeFromBg(false);
        setTheme('cyber');
      }
    } catch (err) {
      setUploadError(language === 'zh' ? '删除失败' : 'Delete failed');
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="space-y-6 animate-slideUp max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
          {t('settings')}
        </h1>
        {/* GitHub Link */}
        <a
          href="https://github.com/DeaglePC/TeslamateCyberUI"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-white/10"
          style={{ color: colors.muted }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span className="text-sm font-medium">GitHub</span>
        </a>
      </div>

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
                  onClick={() => {
                    if (autoThemeFromBg && th.id !== 'auto') {
                      setAutoThemeFromBg(false);
                    }
                    setTheme(th.id);
                  }}
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

        {/* Auto Theme from Background Image */}
        <div className="mt-5 pt-4 border-t" style={{ borderColor: colors.border }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <div>
                <p className="text-sm font-medium" style={{ color: colors.primary }}>
                  {t('autoThemeFromBg')}
                </p>
                <p className="text-xs" style={{ color: colors.muted }}>
                  {t('autoThemeFromBgDesc')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (!autoThemeFromBg && !backgroundImage) return;
                setAutoThemeFromBg(!autoThemeFromBg);
                if (!autoThemeFromBg && backgroundImage) {
                  // 开启时立即提取颜色
                  setExtractingColor(true);
                  extractDominantColor(backgroundImage)
                    .then((primaryColor) => {
                      setAutoThemePrimaryColor(primaryColor);
                      setAutoThemeColor(primaryColor);
                    })
                    .catch(console.error)
                    .finally(() => setExtractingColor(false));
                }
              }}
              className={clsx(
                'relative w-12 h-6 rounded-full transition-all duration-300',
                !backgroundImage && !autoThemeFromBg && 'opacity-40 cursor-not-allowed'
              )}
              style={{
                backgroundColor: autoThemeFromBg ? colors.primary : 'rgba(255,255,255,0.15)',
              }}
              disabled={!backgroundImage && !autoThemeFromBg}
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300"
                style={{
                  transform: autoThemeFromBg ? 'translateX(26px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>

          {/* 无背景图提示 */}
          {!backgroundImage && !autoThemeFromBg && (
            <p className="text-xs mt-2" style={{ color: colors.warning }}>
              {t('autoThemeNoBg')}
            </p>
          )}

          {/* 正在提取颜色 */}
          {extractingColor && (
            <div className="flex items-center gap-2 mt-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
              </svg>
              <span className="text-xs" style={{ color: colors.muted }}>
                {t('autoThemeExtracting')}
              </span>
            </div>
          )}

          {/* 当前提取的全部颜色预览 */}
          {autoThemeFromBg && autoThemePrimaryColor && !extractingColor && (
            <AutoThemeColorPreview
              primaryColor={autoThemePrimaryColor}
              language={language}
              themeColors={colors}
            />
          )}
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

        {/* 背景图片预览和上传区域 */}
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading}
          />

          {backgroundImage ? (
            // 有背景图片时：显示真实比例预览 + 叠加操作按钮
            <div
              className="relative w-full rounded-lg border overflow-hidden cursor-pointer group"
              style={{
                borderColor: colors.border,
                // 根据图片比例动态设置高度，限制最大高度
                aspectRatio: bgImageRatio ? `${bgImageRatio}` : undefined,
                maxHeight: '400px',
                backgroundColor: 'transparent',
              }}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              {/* 使用 img 标签，object-contain 完整显示图片 */}
              <img
                src={backgroundImage}
                alt="Background preview"
                className="w-full h-full object-contain"
                style={{ backgroundColor: 'transparent' }}
              />
              {/* 半透明遮罩层 - hover 时显示 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                {/* 更换图片提示 - hover 时显示 */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-1">
                  <svg className="w-10 h-10 text-white drop-shadow-lg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="text-white text-sm font-medium drop-shadow-lg">
                    {uploading 
                      ? (language === 'zh' ? '上传中...' : 'Uploading...')
                      : (language === 'zh' ? '点击更换背景图片' : 'Click to change background')}
                  </span>
                </div>
              </div>

              {/* 操作按钮组 - 始终显示在右上角 */}
              <div className="absolute top-2 right-2 flex gap-2 z-10">
                {/* 上传中指示器 */}
                {uploading && (
                  <div className="p-2 rounded-full bg-black/50">
                    <svg className="w-4 h-4 text-white animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                {/* 重新调整按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReCrop();
                  }}
                  className="p-2 rounded-full bg-black/50 hover:bg-blue-500/80 transition-colors"
                  title={backgroundOriginalImage 
                    ? (language === 'zh' ? '重新调整区域' : 'Re-crop image')
                    : (language === 'zh' ? '重新上传以启用调整功能' : 'Re-upload to enable cropping')}
                >
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    <path d="M10 7v6m3-3H7" strokeLinecap="round" />
                  </svg>
                </button>
                {/* 删除按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBackground();
                  }}
                  className="p-2 rounded-full bg-black/50 hover:bg-red-500/80 transition-colors"
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
            </div>
          ) : (
            // 无背景图片时：显示上传区域
            <div
              className={clsx(
                'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
                uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-opacity-100'
              )}
              style={{ borderColor: `${colors.primary}50` }}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
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
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span className="font-medium" style={{ color: colors.primary }}>
                    {language === 'zh' ? '点击上传背景图片' : 'Click to upload background'}
                  </span>
                  <span className="text-xs" style={{ color: colors.muted }}>
                    {language === 'zh' ? '支持 JPG、PNG、WebP，最大 5MB' : 'Supports JPG, PNG, WebP, max 5MB'}
                  </span>
                </div>
              )}
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

      {/* Card Effect Settings */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
          <h3 className="font-semibold" style={{ color: colors.primary }}>
            {language === 'zh' ? '卡片效果' : 'Card Effect'}
          </h3>
        </div>

        {/* 透明度 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm" style={{ color: colors.muted }}>
              {language === 'zh' ? '卡片透明度' : 'Card Opacity'}
            </label>
            <span className="text-sm font-medium" style={{ color: colors.primary }}>
              {cardOpacity}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={cardOpacity}
            onChange={(e) => setCardOpacity(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${cardOpacity}%, rgba(255,255,255,0.1) ${cardOpacity}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs mt-1" style={{ color: colors.muted }}>
            <span>{language === 'zh' ? '全透明' : 'Transparent'}</span>
            <span>{language === 'zh' ? '不透明' : 'Opaque'}</span>
          </div>
        </div>

        {/* 说明 */}
        <p className="text-xs mt-4" style={{ color: colors.muted }}>
          {language === 'zh' 
            ? '调整卡片的透明度，设置会自动保存。'
            : 'Adjust card opacity. Settings are saved automatically.'}
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

      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          onCrop={handleCropComplete}
          onCancel={handleCropCancel}
          language={language}
          theme={theme}
        />
      )}
    </div>
  );
}
