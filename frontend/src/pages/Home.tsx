import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/settings';
import { carApi, statsApi } from '@/services/api';
import { Card, StatCard } from '@/components/Card';
import { BatteryIndicator } from '@/components/Battery';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { formatDistance, formatEnergy, formatDuration, formatTemperature, formatRelativeTime } from '@/utils/format';
import type { Car, CarStatus, OverviewStats } from '@/types';
import clsx from 'clsx';

export default function HomePage() {
  const { theme, selectedCarId, setSelectedCarId, unit } = useSettingsStore();
  const [cars, setCars] = useState<Car[]>([]);
  const [status, setStatus] = useState<CarStatus | null>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const themeColors: Record<string, { primary: string; muted: string; success: string; warning: string }> = {
    cyber: { primary: '#00f0ff', muted: '#808080', success: '#00ff88', warning: '#ffaa00' },
    tesla: { primary: '#cc0000', muted: '#888888', success: '#4caf50', warning: '#ff9800' },
    dark: { primary: '#4361ee', muted: '#8d99ae', success: '#06d6a0', warning: '#ffd60a' },
    tech: { primary: '#0077b6', muted: '#778da9', success: '#52b788', warning: '#f4a261' },
    aurora: { primary: '#72efdd', muted: '#98c1d9', success: '#80ed99', warning: '#fcbf49' },
  };

  const colors = themeColors[theme] || themeColors.cyber;

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
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCarId]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (cars.length === 0) return <EmptyState message="未找到车辆" />;

  const stateLabels: Record<string, string> = {
    online: '在线',
    offline: '离线',
    asleep: '休眠',
    charging: '充电中',
    driving: '行驶中',
    updating: '更新中',
  };

  const stateColors: Record<string, string> = {
    online: colors.success,
    offline: colors.muted,
    asleep: colors.muted,
    charging: colors.warning,
    driving: colors.primary,
    updating: colors.warning,
  };

  return (
    <div className="space-y-6 animate-slideUp">
      {/* 车辆选择器（多车时显示） */}
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
              {car.name || car.model || `车辆 ${car.id}`}
            </button>
          ))}
        </div>
      )}

      {/* 车辆状态卡片 */}
      {status && (
        <Card className="relative overflow-hidden">
          {/* 背景装饰 */}
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
            style={{ background: colors.primary }}
          />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: colors.primary }}>
                  {status.name || status.model}
                </h2>
                <p style={{ color: colors.muted }}>{status.model}</p>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ background: stateColors[status.state] || colors.muted }}
                />
                <span style={{ color: stateColors[status.state] || colors.muted }}>
                  {stateLabels[status.state] || status.state}
                </span>
              </div>
            </div>

            {/* 电池状态 */}
            <div className="flex items-center gap-4 mb-6">
              <BatteryIndicator 
                level={status.batteryLevel} 
                isCharging={status.state === 'charging'}
                size="lg"
              />
              <div>
                <span className="text-3xl font-bold" style={{ color: colors.primary }}>
                  {status.batteryLevel}%
                </span>
                <p className="text-sm" style={{ color: colors.muted }}>
                  续航 {formatDistance(status.idealRange, unit)}
                </p>
              </div>
            </div>

            {/* 快速信息 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm" style={{ color: colors.muted }}>里程</p>
                <p className="font-semibold">{formatDistance(status.odometer, unit)}</p>
              </div>
              {status.insideTemp !== undefined && (
                <div>
                  <p className="text-sm" style={{ color: colors.muted }}>车内温度</p>
                  <p className="font-semibold">{formatTemperature(status.insideTemp, unit)}</p>
                </div>
              )}
              {status.outsideTemp !== undefined && (
                <div>
                  <p className="text-sm" style={{ color: colors.muted }}>室外温度</p>
                  <p className="font-semibold">{formatTemperature(status.outsideTemp, unit)}</p>
                </div>
              )}
              {status.geofence && (
                <div>
                  <p className="text-sm" style={{ color: colors.muted }}>位置</p>
                  <p className="font-semibold">{status.geofence}</p>
                </div>
              )}
              {status.softwareVersion && (
                <div>
                  <p className="text-sm" style={{ color: colors.muted }}>软件版本</p>
                  <p className="font-semibold">{status.softwareVersion}</p>
                </div>
              )}
              {status.since && (
                <div>
                  <p className="text-sm" style={{ color: colors.muted }}>状态持续</p>
                  <p className="font-semibold">{formatRelativeTime(status.since)}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 统计概览 */}
      {stats && (
        <>
          <h3 className="text-lg font-semibold" style={{ color: colors.primary }}>统计概览</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="总里程"
              value={formatDistance(stats.totalDistance, unit)}
              icon={
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              }
            />
            <StatCard
              label="驾驶次数"
              value={stats.totalDrives}
              unit="次"
              icon={
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-6.75A1 1 0 0 0 12.36 4H7.64a1 1 0 0 0-.93.63L4 11l-5.16.86a1 1 0 0 0-.84.99V16h3" />
                  <circle cx="6.5" cy="16.5" r="2.5" />
                  <circle cx="16.5" cy="16.5" r="2.5" />
                </svg>
              }
            />
            <StatCard
              label="充电次数"
              value={stats.totalCharges}
              unit="次"
              icon={
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              }
            />
            <StatCard
              label="总充电量"
              value={formatEnergy(stats.totalEnergyAdded)}
              icon={
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
                  <line x1="23" y1="13" x2="23" y2="11" />
                </svg>
              }
            />
            <StatCard
              label="驾驶时长"
              value={formatDuration(stats.totalDriveDuration)}
            />
            <StatCard
              label="充电时长"
              value={formatDuration(stats.totalChargeDuration)}
            />
            <StatCard
              label="平均能效"
              value={stats.avgEfficiency.toFixed(0)}
              unit="Wh/km"
            />
            {stats.totalEnergyCost !== undefined && stats.totalEnergyCost > 0 && (
              <StatCard
                label="总充电费用"
                value={`¥${stats.totalEnergyCost.toFixed(2)}`}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
