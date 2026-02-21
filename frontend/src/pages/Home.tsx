import { useEffect, useState, useCallback } from 'react';
import { useSettingsStore } from '@/store/settings';
import { carApi, statsApi } from '@/services/api';
import { Card, StatCard } from '@/components/Card';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { MapCard } from '@/components/MapCard';
import { SocHistoryChart } from '@/components/SocHistoryChart';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { formatDistance, formatRelativeTime } from '@/utils/format';
import { useTranslation } from '@/utils/i18n';
import { getThemeColors } from '@/utils/theme';
import { getCachedImage, setCachedImage } from '@/utils/imageCache';
import type { Car, CarStatus, OverviewStats, SocDataPoint, StateTimelineItem } from '@/types';
import clsx from 'clsx';
import dayjs from 'dayjs';

// Tesla color option codes for configurator API
const COLOR_OPTION_CODES: Record<string, string> = {
  // Model 3 / Model Y colors
  'SolidBlack': 'PBSB',
  'MidnightSilverMetallic': 'PMNG',
  'DeepBlueMetallic': 'PPSB',
  'PearlWhiteMultiCoat': 'PPSW',
  'RedMultiCoat': 'PPMR',
  'UltraWhite': 'PN01',
  'QuicksilverMetallic': 'PR01',  // Highland
  'MidnightCherryRed': 'PPSR',    // Highland
  // Older colors
  'SilverMetallic': 'PMSS',
  'ObsidianBlackMetallic': 'PMBL',
  'TitaniumMetallic': 'PMTG',
  'BlueMetallic': 'PMMB',
};

// Get Tesla configurator image URL based on model, color, and trim
const getCarImageUrl = (model?: string, exteriorColor?: string, _trimBadging?: string): string => {
  if (!model) return '';

  const modelLower = model.toLowerCase();
  const colorCode = exteriorColor ? (COLOR_OPTION_CODES[exteriorColor] || 'PPSW') : 'PPSW';

  // Build Tesla configurator URL
  const baseUrl = 'https://static-assets.tesla.com/configurator/compositor';

  // Model-specific configurations using Tesla's actual format
  if (modelLower === '3' || modelLower === 'model3') {
    return `${baseUrl}?context=design_studio_2&options=$MT372,$${colorCode},$W38A,$IPB2,$DRRH&view=STUD_FRONT34&model=m3&size=1920&bkba_opt=1&crop=0,0,0,0&overlay=0&`;
  } else if (modelLower === 's' || modelLower === 'models') {
    return `${baseUrl}?context=design_studio_2&options=$MTS13,$${colorCode},$WT20,$IBC00&view=STUD_FRONT34&model=ms&size=1920&bkba_opt=1&crop=0,0,0,0&overlay=0&`;
  } else if (modelLower === 'x' || modelLower === 'modelx') {
    return `${baseUrl}?context=design_studio_2&options=$MTX13,$${colorCode},$WX00,$IBC00&view=STUD_FRONT34&model=mx&size=1920&bkba_opt=1&crop=0,0,0,0&overlay=0&`;
  } else if (modelLower === 'y' || modelLower === 'modely') {
    return `${baseUrl}?context=design_studio_2&options=$MTY13,$${colorCode},$WY19B,$INPB0&view=STUD_FRONT34&model=my&size=1920&bkba_opt=1&crop=0,0,0,0&overlay=0&`;
  }

  // Fallback to Tesla digital assets
  const fallbackImages: Record<string, string> = {
    '3': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-3.png',
    'model3': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-3.png',
    's': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-S.png',
    'models': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-S.png',
    'x': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-X.png',
    'modelx': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-X.png',
    'y': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-Y.png',
    'modely': 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-Y.png',
  };

  return fallbackImages[modelLower] || '';
};

// Color name mapping
const COLOR_NAMES: Record<string, { zh: string; en: string }> = {
  'SolidBlack': { zh: '纯黑色', en: 'Solid Black' },
  'MidnightSilverMetallic': { zh: '午夜银', en: 'Midnight Silver' },
  'DeepBlueMetallic': { zh: '深海蓝', en: 'Deep Blue' },
  'PearlWhiteMultiCoat': { zh: '珍珠白', en: 'Pearl White' },
  'RedMultiCoat': { zh: '中国红', en: 'Red Multi-Coat' },
  'UltraWhite': { zh: '冷光白', en: 'Ultra White' },
};

export default function HomePage() {
  const { theme, selectedCarId, setSelectedCarId, unit, language } = useSettingsStore();
  const { t, getStateLabel } = useTranslation(language);
  const [cars, setCars] = useState<Car[]>([]);
  const [status, setStatus] = useState<CarStatus | null>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [socHistory, setSocHistory] = useState<SocDataPoint[]>([]);
  const [statesTimeline, setStatesTimeline] = useState<StateTimelineItem[]>([]);
  const [socDateRange, setSocDateRange] = useState<{ start?: string; end?: string }>({});
  const [timelineDateRange, setTimelineDateRange] = useState<{ start?: string; end?: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [cachedCarImageUrl, setCachedCarImageUrl] = useState<string>('');

  const colors = getThemeColors(theme);

  // Get current car info
  const currentCar = cars.find(c => c.id === selectedCarId) || cars[0];

  // Get car image URL with caching
  const carImageUrl = currentCar ? getCarImageUrl(currentCar.model, currentCar.exteriorColor, currentCar.trimBadging) : '';

  // Load and cache car image
  const loadCarImage = useCallback(async (url: string) => {
    if (!url) {
      setCachedCarImageUrl('');
      return;
    }

    // Check cache first
    const cached = getCachedImage(url);
    if (cached) {
      setCachedCarImageUrl(cached);
      return;
    }

    // Load image and cache it
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          setCachedImage(url, dataUrl);
          setCachedCarImageUrl(dataUrl);
        } else {
          setCachedCarImageUrl(url);
        }
      } catch {
        // CORS error, use original URL
        setCachedCarImageUrl(url);
      }
    };

    img.onerror = () => {
      setCachedCarImageUrl(url);
    };

    img.src = url;
  }, []);

  // Effect to load car image when URL changes
  useEffect(() => {
    loadCarImage(carImageUrl);
  }, [carImageUrl, loadCarImage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const carList = await carApi.getAll();
      setCars(carList);

      if (carList.length > 0) {
        const carId = selectedCarId || carList[0].id;
        if (!selectedCarId) {
          setSelectedCarId(carId);
        }

        const [carStatus, overviewStats] = await Promise.all([
          carApi.getStatus(carId),
          statsApi.getOverview(carId),
        ]);

        setStatus(carStatus);
        setStats(overviewStats);
      }
    } catch (err) {
      if (err instanceof Error && err.message !== 'no_api_config') {
        setError(err.message);
      } else if (!(err instanceof Error) || err.message !== 'no_api_config') {
        setError(t('error'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCarId]);

  // Fetch SOC History independently
  useEffect(() => {
    if (!currentCar) return;
    const fetchSoc = async () => {
      try {
        const data = await statsApi.getSocHistory(currentCar.id, 24, socDateRange.start, socDateRange.end);
        setSocHistory(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSoc();
  }, [currentCar?.id, socDateRange]);

  // Fetch Timeline independently
  useEffect(() => {
    if (!currentCar) return;
    const fetchTimeline = async () => {
      try {
        const data = await statsApi.getStatesTimeline(currentCar.id, 24, timelineDateRange.start, timelineDateRange.end);
        setStatesTimeline(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTimeline();
  }, [currentCar?.id, timelineDateRange]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (cars.length === 0) return <EmptyState message={t('noCarsFound')} />;

  // Get model display name
  const getModelName = (model?: string) => {
    if (!model) return 'Tesla';
    return `Model ${model.toUpperCase()}`;
  };

  // Get color display name
  const getColorName = (colorCode?: string) => {
    if (!colorCode) return language === 'zh' ? '未知' : 'Unknown';
    const color = COLOR_NAMES[colorCode];
    return color ? color[language] : colorCode;
  };

  return (
    <div className="space-y-6 animate-slideUp">
      {/* Car Selector */}
      {cars.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {cars.map((car) => (
            <button
              key={car.id}
              onClick={() => setSelectedCarId(car.id)}
              className={clsx(
                'px-4 py-2 rounded-lg whitespace-nowrap transition-all',
                selectedCarId === car.id
                  ? 'glass border'
                  : 'opacity-60 hover:opacity-100'
              )}
              style={{
                borderColor: selectedCarId === car.id ? colors.primary : 'transparent',
                color: selectedCarId === car.id ? colors.primary : colors.muted,
              }}
            >
              {car.name || car.model || `${t('vehicle')} ${car.id}`}
            </button>
          ))}
        </div>
      )}

      {/* Hero Section - 3 Column Layout */}
      {/* Hero Section - 2 Column Layout (Car Card + Map) */}
      {status && currentCar && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left - Combined Car & Status Card */}
          <div
            className="perspective-1000 cursor-pointer min-h-[240px] lg:min-h-[420px]"
            onClick={() => setIsCardFlipped(!isCardFlipped)}
          >
            <div
              className={clsx(
                'relative w-full h-full transition-transform duration-500 preserve-3d',
                isCardFlipped && 'rotate-y-180'
              )}
              style={{
                transformStyle: 'preserve-3d',
                transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front Side - Status + Image */}
              <Card
                className="absolute inset-0 backface-hidden flex flex-col p-6 overflow-hidden"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div
                  className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
                  style={{ background: colors.primary }}
                />

                {/* Header Row */}
                <div className="flex justify-between items-start z-10 relative">
                  {/* Left: Tesla App Style Info */}
                  <div className="space-y-1">
                    {/* 1. Battery Icon + Percentage */}
                    <div className="flex items-center gap-2">
                      {/* Battery Icon */}
                      <div className="relative w-8 h-3.5 border border-white/30 rounded-[2px] flex items-center p-[1px]"
                        style={{ borderColor: colors.muted }}>
                        {/* Battery Tip */}
                        <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-1.5 rounded-r-[1px]"
                          style={{ background: colors.muted }} />
                        {/* Fill */}
                        <div
                          className="h-full rounded-[1px] transition-all duration-500"
                          style={{
                            width: `${status.batteryLevel}%`,
                            background: status.batteryLevel <= 20 ? '#ff4444' : colors.primary,
                          }}
                        />
                      </div>

                      {/* Percentage Text */}
                      <span className="text-sm font-bold tracking-tight" style={{ color: colors.primary }}>
                        {status.batteryLevel}%
                      </span>
                    </div>

                    {/* 2. Status Text */}
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium" style={{ color: colors.muted }}>
                        {getStateLabel(status.state)}
                        <span className="ml-1">
                          {status.since && formatRelativeTime(status.since, language).replace('ago', '').replace('前', '')}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Car Name */}
                  {currentCar.name && (
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: colors.primary }}>
                        {currentCar.name}
                      </p>
                      <p className="text-xs" style={{ color: colors.muted }}>
                        {getModelName(currentCar.model)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Center - Large Car Image */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-12">
                  {currentCar.model ? (
                    <img
                      src={cachedCarImageUrl || carImageUrl}
                      alt={`Tesla Model ${currentCar.model}`}
                      className="w-full object-contain drop-shadow-xl
                        max-w-[600px] scale-[1.4] mx-auto
                        lg:max-w-[800px] lg:scale-[1.6] lg:mx-auto"
                      style={{ filter: `drop-shadow(0 10px 40px ${colors.primary}40)` }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Mega-Menu-Vehicles-Model-3.png';
                      }}
                    />
                  ) : (
                    <div className="opacity-50 mb-10">
                      <p>No Image Available</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Back Side - Detailed Info (Same as before) */}
              <Card
                className="absolute inset-0 backface-hidden p-5"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold" style={{ color: colors.primary }}>
                      {language === 'zh' ? '车辆详情' : 'Vehicle Details'}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded bg-white/5" style={{ color: colors.muted }}>
                      ID: #{currentCar.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    {/* VIN */}
                    <div className="space-y-1">
                      <p style={{ color: colors.muted }}>VIN</p>
                      <p className="font-mono">{currentCar.vin || '--'}</p>
                    </div>

                    {/* Model */}
                    <div className="space-y-1">
                      <p style={{ color: colors.muted }}>{language === 'zh' ? '型号' : 'Model'}</p>
                      <p>{getModelName(currentCar.model)}</p>
                    </div>

                    {/* Version */}
                    {currentCar.marketingName && (
                      <div className="space-y-1">
                        <p style={{ color: colors.muted }}>{language === 'zh' ? '版本' : 'Version'}</p>
                        <p>{currentCar.marketingName}</p>
                      </div>
                    )}

                    {/* Color */}
                    <div className="space-y-1">
                      <p style={{ color: colors.muted }}>{language === 'zh' ? '外观颜色' : 'Color'}</p>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{
                            background: currentCar.exteriorColor === 'SolidBlack' ? '#1a1a1a' :
                              currentCar.exteriorColor === 'PearlWhiteMultiCoat' ? '#f5f5f5' :
                                '#6b7280'
                          }}
                        />
                        <span>{getColorName(currentCar.exteriorColor)}</span>
                      </div>
                    </div>

                    {/* Software */}
                    <div className="space-y-1">
                      <p style={{ color: colors.muted }}>{language === 'zh' ? '软件版本' : 'Software'}</p>
                      <p className="font-mono">{status.softwareVersion}</p>
                    </div>

                    {/* Odometer */}
                    <div className="space-y-1">
                      <p style={{ color: colors.muted }}>{language === 'zh' ? '总里程' : 'Odometer'}</p>
                      <p>{formatDistance(stats?.totalDistance || 0, unit)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Right - Map */}
          <div className="h-auto lg:h-full">
            <MapCard
              className="h-full min-h-[220px] lg:min-h-[300px]"
              latitude={status.latitude ?? stats?.lastLatitude}
              longitude={status.longitude ?? stats?.lastLongitude}
              address={status.geofence ?? stats?.lastAddress}
              timestamp={stats?.lastLocationTime}
            />
          </div>
        </div>
      )}

      {/* Stats Row */}
      {status && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t('range').toUpperCase()}
            value={formatDistance(status.idealRange, unit)}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            }
          />
          <StatCard
            label={t('odometer').toUpperCase()}
            value={formatDistance(stats.totalDistance, unit)}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            }
          />
          <StatCard
            label={t('softwareVersion').toUpperCase()}
            value={status.softwareVersion || '--'}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M9 9h6v6H9z" />
                <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
              </svg>
            }
          />
          <StatCard
            label={t('temperature').toUpperCase()}
            value={stats.outsideTemp != null ? `${stats.outsideTemp.toFixed(0)}°` : '--'}
            unit={stats.insideTemp != null ? `${language === 'zh' ? '内' : 'In'} ${stats.insideTemp.toFixed(0)}°` : undefined}
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Charging Status Section - 充电时显示 */}
      {status && stats && stats.isCharging && (
        <div className="space-y-4">
          {/* 充电状态标题 */}
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{
                background: colors.success,
                boxShadow: `0 0 12px ${colors.success}80`
              }}
            />
            <h3 className="font-semibold" style={{ color: colors.success }}>
              {language === 'zh' ? '正在充电中' : 'Charging in Progress'}
            </h3>
          </div>

          {/* 充电信息卡片 */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label={language === 'zh' ? '充电电压' : 'CHARGING VOLTAGE'}
              value={stats.chargingVoltage != null ? stats.chargingVoltage : '--'}
              unit="V"
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              }
            />
            <StatCard
              label={language === 'zh' ? '充电功率' : 'CHARGING POWER'}
              value={stats.chargingPower != null ? stats.chargingPower : '--'}
              unit="kW"
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              }
            />
          </div>
        </div>
      )}

      {/* Bottom Section - Charts */}
      {/* SOC History - 独占一行 */}
      <SocHistoryChart
        data={socHistory}
        rangeLabel={socDateRange.start ? `${socDateRange.start} ~ ${socDateRange.end || t('today')}` : undefined}
        days={socDateRange.start ? dayjs(socDateRange.end || undefined).diff(dayjs(socDateRange.start), 'day') : 1}
        onRangeChange={(start, end) => setSocDateRange({ start, end })}
      />

      {/* Activity Timeline - 独占一行 */}
      <ActivityTimeline
        data={statesTimeline}
        rangeLabel={timelineDateRange.start ? `${timelineDateRange.start} ~ ${timelineDateRange.end || t('today')}` : undefined}
        rangeStart={timelineDateRange.start}
        rangeEnd={timelineDateRange.end}
        onRangeChange={(start, end) => setTimelineDateRange({ start, end })}
      />
    </div>
  );
}
