import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/settings';
import { carApi, statsApi } from '@/services/api';
import { Card, StatCard } from '@/components/Card';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { MapCard } from '@/components/MapCard';
import { SocHistoryChart } from '@/components/SocHistoryChart';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { formatDistance, formatRelativeTime } from '@/utils/format';
import { useTranslation } from '@/utils/i18n';
import type { Car, CarStatus, OverviewStats, SocDataPoint, StateTimelineItem } from '@/types';
import clsx from 'clsx';

// Tesla Model images URLs (using public Tesla images)
const MODEL_IMAGES: Record<string, string> = {
  '3': 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS13,$PPSB,$WS90,$IBB1&view=FRONT34&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
  'S': 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS10,$PPSB,$WS90,$IBB1&view=FRONT34&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&',
  'X': 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX10,$PPSB,$WX00,$IBB1&view=FRONT34&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&',
  'Y': 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY07,$PPSB,$WY19B,$INPB0&view=FRONT34&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const themeColors: Record<string, { primary: string; muted: string; success: string; warning: string; bg: string }> = {
    cyber: { primary: '#00f0ff', muted: '#808080', success: '#00ff88', warning: '#ffaa00', bg: '#0d0d1a' },
    tesla: { primary: '#cc0000', muted: '#888888', success: '#4caf50', warning: '#ff9800', bg: '#0f0f0f' },
    dark: { primary: '#4361ee', muted: '#8d99ae', success: '#06d6a0', warning: '#ffd60a', bg: '#111827' },
    tech: { primary: '#0077b6', muted: '#778da9', success: '#52b788', warning: '#f4a261', bg: '#0f172a' },
    aurora: { primary: '#72efdd', muted: '#98c1d9', success: '#80ed99', warning: '#fcbf49', bg: '#0f172a' },
  };

  const colors = themeColors[theme] || themeColors.cyber;

  // Get current car info
  const currentCar = cars.find(c => c.id === selectedCarId) || cars[0];

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

        const [carStatus, overviewStats, socData, timelineData] = await Promise.all([
          carApi.getStatus(carId),
          statsApi.getOverview(carId),
          statsApi.getSocHistory(carId, 24),
          statsApi.getStatesTimeline(carId, 24),
        ]);

        setStatus(carStatus);
        setStats(overviewStats);
        setSocHistory(socData);
        setStatesTimeline(timelineData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCarId]);

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
      {status && currentCar && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left - Flip Card (Car Info) */}
          <div
            className="perspective-1000 cursor-pointer min-h-[200px]"
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
              {/* Front Side - Model + Image */}
              <Card
                className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-4"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Model Name */}
                <div className="text-center mb-2">
                  <p className="text-xs uppercase tracking-widest" style={{ color: colors.muted }}>
                    Tesla
                  </p>
                  <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {getModelName(currentCar.model)}
                  </h2>
                  {currentCar.name && (
                    <p className="text-lg mt-1" style={{ color: colors.muted }}>
                      "{currentCar.name}"
                    </p>
                  )}
                </div>

                {/* Car Image */}
                <div className="flex-1 flex items-center justify-center w-full">
                  {currentCar.model && MODEL_IMAGES[currentCar.model] ? (
                    <img
                      src={MODEL_IMAGES[currentCar.model]}
                      alt={`Tesla Model ${currentCar.model}`}
                      className="w-full max-w-[280px] object-contain drop-shadow-lg"
                      style={{ filter: `drop-shadow(0 0 20px ${colors.primary}40)` }}
                    />
                  ) : (
                    <svg viewBox="0 0 200 80" className="w-full max-w-xs opacity-80" fill="none">
                      <path
                        d="M20 50 Q40 45 60 45 L80 35 Q100 25 130 30 L160 35 Q180 40 190 50 L190 55 Q185 60 175 60 L165 60 Q160 55 155 55 L55 55 Q50 55 45 60 L35 60 Q25 60 20 55 Z"
                        fill="url(#carGradient)"
                        stroke={colors.primary}
                        strokeWidth="0.5"
                      />
                      <defs>
                        <linearGradient id="carGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={colors.bg} />
                          <stop offset="50%" stopColor="rgba(60,60,80,0.8)" />
                          <stop offset="100%" stopColor={colors.bg} />
                        </linearGradient>
                      </defs>
                    </svg>
                  )}
                </div>

                {/* Flip hint */}
                <p className="text-xs mt-2" style={{ color: colors.muted }}>
                  {language === 'zh' ? '点击查看详情' : 'Tap for details'}
                </p>
              </Card>

              {/* Back Side - Detailed Info */}
              <Card
                className="absolute inset-0 backface-hidden p-4"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="h-full flex flex-col">
                  <h3 className="text-lg font-bold mb-3" style={{ color: colors.primary }}>
                    {language === 'zh' ? '车辆详情' : 'Vehicle Details'}
                  </h3>

                  <div className="flex-1 space-y-2 text-sm overflow-hidden">
                    {/* VIN */}
                    <div className="flex justify-between gap-2">
                      <span className="shrink-0" style={{ color: colors.muted }}>VIN</span>
                      <span className="font-mono text-xs truncate">{currentCar.vin || '--'}</span>
                    </div>

                    {/* Model */}
                    <div className="flex justify-between gap-2">
                      <span className="shrink-0" style={{ color: colors.muted }}>
                        {language === 'zh' ? '型号' : 'Model'}
                      </span>
                      <span className="truncate">{getModelName(currentCar.model)}</span>
                    </div>

                    {/* Marketing Name */}
                    {currentCar.marketingName && (
                      <div className="flex justify-between gap-2">
                        <span className="shrink-0" style={{ color: colors.muted }}>
                          {language === 'zh' ? '版本' : 'Version'}
                        </span>
                        <span className="truncate">{currentCar.marketingName}</span>
                      </div>
                    )}

                    {/* Exterior Color */}
                    <div className="flex justify-between items-center gap-2">
                      <span style={{ color: colors.muted }}>
                        {language === 'zh' ? '外观颜色' : 'Color'}
                      </span>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{
                            background: currentCar.exteriorColor === 'SolidBlack' ? '#1a1a1a' :
                              currentCar.exteriorColor === 'PearlWhiteMultiCoat' ? '#f5f5f5' :
                                currentCar.exteriorColor === 'MidnightSilverMetallic' ? '#6b7280' :
                                  currentCar.exteriorColor === 'DeepBlueMetallic' ? '#1e40af' :
                                    currentCar.exteriorColor === 'RedMultiCoat' ? '#dc2626' :
                                      currentCar.exteriorColor === 'UltraWhite' ? '#ffffff' : '#6b7280'
                          }}
                        />
                        {getColorName(currentCar.exteriorColor)}
                      </span>
                    </div>

                    {/* Wheel Type */}
                    {currentCar.wheelType && (
                      <div className="flex justify-between gap-2">
                        <span className="shrink-0" style={{ color: colors.muted }}>
                          {language === 'zh' ? '轮毂' : 'Wheels'}
                        </span>
                        <span className="truncate">{currentCar.wheelType}</span>
                      </div>
                    )}
                  </div>

                  {/* Flip back hint */}
                  <p className="text-xs text-center mt-2" style={{ color: colors.muted }}>
                    {language === 'zh' ? '点击返回' : 'Tap to go back'}
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Center - Status Info */}
          <Card className="relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
              style={{ background: colors.primary }}
            />

            <div className="relative space-y-4">
              {/* Current State Header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: colors.muted }}>
                    {t('currentState')}
                  </p>
                  <h2 className="text-3xl font-bold uppercase tracking-tight">
                    {getStateLabel(status.state)}
                  </h2>
                </div>
                <span className="text-xs" style={{ color: colors.muted }}>
                  ID: #{status.carId}
                </span>
              </div>

              {/* Since Duration */}
              {status.since && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={colors.success}>
                    <circle cx="12" cy="12" r="10" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                  </svg>
                  <span style={{ color: colors.success }}>
                    {t('since')} {formatRelativeTime(status.since)}
                  </span>
                </div>
              )}

              {/* Battery Level */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span style={{ color: colors.muted }}>{t('batteryLevel')}</span>
                  <span className="text-xl font-bold" style={{ color: colors.primary }}>
                    {status.batteryLevel}%
                  </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${status.batteryLevel}%`,
                      background: `linear-gradient(90deg, ${colors.primary}, ${colors.success})`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Right - Map */}
          <MapCard
            latitude={status.latitude ?? stats?.lastLatitude}
            longitude={status.longitude ?? stats?.lastLongitude}
            address={status.geofence ?? stats?.lastAddress}
            state={status.state}
          />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SOC History */}
        <SocHistoryChart data={socHistory} />

        {/* Activity Timeline */}
        <ActivityTimeline data={statesTimeline} />
      </div>
    </div>
  );
}
