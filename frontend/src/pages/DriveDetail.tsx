import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { useSettingsStore } from '@/store/settings';
import { driveApi } from '@/services/api';
import { Card, StatCard } from '@/components/Card';
import { BatteryBar } from '@/components/Battery';
import { Loading, ErrorState } from '@/components/States';
import { formatDate, formatDuration, formatDistance, formatSpeed, formatTemperature } from '@/utils/format';
import type { DriveDetail, DrivePosition } from '@/types';

export default function DriveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme, unit, amapKey } = useSettingsStore();
  const [detail, setDetail] = useState<DriveDetail | null>(null);
  const [positions, setPositions] = useState<DrivePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);

  const themeColors: Record<string, { primary: string; secondary: string; muted: string; bg: string }> = {
    cyber: { primary: '#00f0ff', secondary: '#ff00aa', muted: '#808080', bg: '#0a0a0f' },
    tesla: { primary: '#cc0000', secondary: '#ffffff', muted: '#888888', bg: '#111111' },
    dark: { primary: '#4361ee', secondary: '#f72585', muted: '#8d99ae', bg: '#1a1a2e' },
    tech: { primary: '#0077b6', secondary: '#90e0ef', muted: '#778da9', bg: '#0d1b2a' },
    aurora: { primary: '#72efdd', secondary: '#7678ed', muted: '#98c1d9', bg: '#0b132b' },
  };

  const colors = themeColors[theme] || themeColors.cyber;

  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const [driveDetail, drivePositions] = await Promise.all([
        driveApi.getDetail(parseInt(id)),
        driveApi.getPositions(parseInt(id)),
      ]);
      setDetail(driveDetail);
      setPositions(drivePositions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化高德地图
  useEffect(() => {
    if (!positions.length || !mapRef.current || !amapKey) return;

    const initMap = async () => {
      try {
        const AMapLoader = await import('@amap/amap-jsapi-loader');
        const AMap = await AMapLoader.default.load({
          key: amapKey,
          version: '2.0',
          plugins: ['AMap.Polyline', 'AMap.Marker'],
        });

        const map = new AMap.Map(mapRef.current, {
          zoom: 14,
          mapStyle: 'amap://styles/dark',
        });

        // 绘制轨迹
        const path = positions.map(p => [p.longitude, p.latitude]);

        const polyline = new AMap.Polyline({
          path,
          strokeColor: colors.primary,
          strokeWeight: 4,
          strokeOpacity: 0.8,
        });

        map.add(polyline);

        // 起点标记
        const startMarker = new AMap.Marker({
          position: [positions[0].longitude, positions[0].latitude],
          content: `<div style="background:${colors.primary};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
          anchor: 'center',
          offset: new AMap.Pixel(0, 0),
        });

        // 终点标记
        const endMarker = new AMap.Marker({
          position: [positions[positions.length - 1].longitude, positions[positions.length - 1].latitude],
          content: `<div style="background:${colors.secondary};width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
          anchor: 'center',
          offset: new AMap.Pixel(0, 0),
        });

        // 调试日志
        console.log('Start position:', positions[0].longitude, positions[0].latitude);
        console.log('End position:', positions[positions.length - 1].longitude, positions[positions.length - 1].latitude);
        console.log('Total positions:', positions.length);

        map.add([startMarker, endMarker]);
        map.setFitView();

        mapInstance.current = map;
      } catch (err) {
        console.error('Map init error:', err);
        if (err instanceof Error && err.message.includes('USERKEY_PLAT_NOMATCH')) {
          console.error('高德地图 API Key 类型错误：请使用 Web端 (JS API) 类型的 Key，而不是 Web服务 Key');
        }
      }
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        // @ts-expect-error AMap destroy method
        mapInstance.current.destroy?.();
      }
    };
  }, [positions, amapKey, colors]);

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!detail) return <ErrorState message="驾驶记录不存在" />;

  // 速度/功率图表配置
  const getChartOption = () => {
    if (positions.length === 0) return null;

    const times = positions.map(p => formatDate(p.date, 'HH:mm'));
    const speeds = positions.map(p => p.speed);
    const powers = positions.map(p => p.power);

    return {
      backgroundColor: 'transparent',
      grid: {
        top: 60,
        right: 60,
        bottom: 30,
        left: 60,
      },
      legend: {
        data: ['速度 km/h', '功率 kW'],
        textStyle: { color: colors.muted },
        top: 10,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: colors.bg,
        borderColor: colors.primary,
        textStyle: { color: colors.muted },
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: colors.muted } },
        axisLabel: { color: colors.muted, interval: 'auto' },
      },
      yAxis: [
        {
          type: 'value',
          name: '速度 km/h',
          axisLine: { lineStyle: { color: colors.primary } },
          axisLabel: { color: colors.primary },
          splitLine: { lineStyle: { color: `${colors.muted}20` } },
        },
        {
          type: 'value',
          name: '功率 kW',
          axisLine: { lineStyle: { color: colors.secondary } },
          axisLabel: { color: colors.secondary },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '速度 km/h',
          type: 'line',
          data: speeds,
          smooth: true,
          lineStyle: { color: colors.primary, width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${colors.primary}40` },
                { offset: 1, color: `${colors.primary}00` },
              ],
            },
          },
          itemStyle: { color: colors.primary },
          showSymbol: false,
        },
        {
          name: '功率 kW',
          type: 'line',
          yAxisIndex: 1,
          data: powers,
          smooth: true,
          lineStyle: { color: colors.secondary, width: 2 },
          itemStyle: { color: colors.secondary },
          showSymbol: false,
        },
      ],
    };
  };

  const chartOption = getChartOption();

  return (
    <div className="space-y-6 animate-slideUp">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
        style={{ color: colors.muted }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        返回
      </button>

      {/* 标题 */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
          驾驶详情
        </h1>
        <p style={{ color: colors.muted }}>
          {formatDate(detail.startDate)}
        </p>
      </div>

      {/* 路线信息 */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
              style={{
                background: colors.primary,
                boxShadow: `0 0 8px ${colors.primary}60`
              }}
            >
              <span style={{ color: '#fff', fontWeight: 'bold' }}>起</span>
            </div>
            <div className="w-0.5 h-12 my-1" style={{ background: `${colors.muted}40` }} />
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
              style={{
                background: colors.secondary,
                boxShadow: `0 0 8px ${colors.secondary}60`
              }}
            >
              <span style={{ color: '#fff', fontWeight: 'bold' }}>终</span>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-around h-32">
            <div>
              <p className="font-medium">{detail.startLocation}</p>
              <p className="text-sm" style={{ color: colors.muted }}>
                {formatDate(detail.startDate)}
              </p>
            </div>
            <div>
              <p className="font-medium">{detail.endLocation}</p>
              <p className="text-sm" style={{ color: colors.muted }}>
                {detail.endDate ? formatDate(detail.endDate) : '-'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 电量变化 */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>电量消耗</h3>
        <BatteryBar startLevel={detail.startBatteryLevel} endLevel={detail.endBatteryLevel} />
        <div className="flex justify-between mt-4" style={{ color: colors.muted }}>
          <span>续航 {detail.startIdealRangeKm.toFixed(0)} km</span>
          <span>续航 {detail.endIdealRangeKm.toFixed(0)} km</span>
        </div>
      </Card>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="行驶距离" value={formatDistance(detail.distance, unit)} />
        <StatCard label="行驶时长" value={formatDuration(detail.durationMin)} />
        <StatCard label="平均速度" value={formatSpeed(detail.speedAvg, unit)} />
        <StatCard label="最高速度" value={formatSpeed(detail.speedMax, unit)} />
        <StatCard label="能效" value={`${detail.efficiency.toFixed(0)} Wh/km`} />
        <StatCard label="最大功率" value={`${detail.powerMax} kW`} />
        <StatCard label="最大回收" value={`${Math.abs(detail.powerMin)} kW`} />
        {detail.outsideTempAvg !== undefined && (
          <StatCard label="室外温度" value={formatTemperature(detail.outsideTempAvg, unit)} />
        )}
      </div>

      {/* 地图轨迹 */}
      {amapKey && positions.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>行驶轨迹</h3>
          <div ref={mapRef} className="w-full h-64 md:h-96 rounded-lg overflow-hidden" />
        </Card>
      )}

      {!amapKey && (
        <Card>
          <div className="text-center py-8" style={{ color: colors.muted }}>
            <p>请在设置页面配置高德地图 API Key 以查看轨迹</p>
          </div>
        </Card>
      )}

      {/* 速度/功率曲线 */}
      {chartOption && (
        <Card>
          <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>速度/功率曲线</h3>
          <ReactECharts
            option={chartOption}
            style={{ height: 300 }}
            opts={{ renderer: 'svg' }}
          />
        </Card>
      )}
    </div>
  );
}
