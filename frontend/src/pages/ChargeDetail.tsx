import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { useSettingsStore } from '@/store/settings';
import { chargeApi } from '@/services/api';
import { Card, StatCard } from '@/components/Card';
import { BatteryBar } from '@/components/Battery';
import { Loading, ErrorState } from '@/components/States';
import { formatDate, formatDuration, formatEnergy, formatCurrency, formatTemperature } from '@/utils/format';
import { getThemeColors } from '@/utils/theme';
import type { ChargeDetail, ChargeStats } from '@/types';

export default function ChargeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme, unit } = useSettingsStore();
  const [detail, setDetail] = useState<ChargeDetail | null>(null);
  const [stats, setStats] = useState<ChargeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = getThemeColors(theme);
  const secondaryColor = colors.chart?.[1] || colors.accent;

  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const [chargeDetail, chargeStats] = await Promise.all([
        chargeApi.getDetail(parseInt(id)),
        chargeApi.getStats(parseInt(id)),
      ]);
      setDetail(chargeDetail);
      setStats(chargeStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!detail) return <ErrorState message="充电记录不存在" />;

  // 充电曲线图表配置
  const getChartOption = () => {
    if (!stats || !stats.dataPoints || stats.dataPoints.length === 0) {
      return null;
    }

    const times = stats.dataPoints.map(p => formatDate(p.date, 'HH:mm'));
    const batteryLevels = stats.dataPoints.map(p => p.batteryLevel);
    const chargerPowers = stats.dataPoints.map(p => p.chargerPower);

    return {
      backgroundColor: 'transparent',
      grid: {
        top: 50,
        right: 10,
        bottom: 25,
        left: 10,
        containLabel: true,
      },
      legend: {
        data: ['电量 %', '功率 kW'],
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
        axisLabel: { color: colors.muted },
      },
      yAxis: [
        {
          type: 'value',
          name: '电量 %',
          min: 0,
          max: 100,
          axisLine: { lineStyle: { color: colors.primary } },
          axisLabel: { color: colors.primary },
          splitLine: { lineStyle: { color: `${colors.muted}20` } },
        },
        {
          type: 'value',
          name: '功率 kW',
          axisLine: { lineStyle: { color: secondaryColor } },
          axisLabel: { color: secondaryColor },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '电量 %',
          type: 'line',
          data: batteryLevels,
          smooth: 0.6, // 增加平滑度 (0-1)
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false, // 默认隐藏点
          emphasis: {
            focus: 'series',
            itemStyle: { borderWidth: 2 }
          },
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
        },
        {
          name: '功率 kW',
          type: 'line',
          yAxisIndex: 1,
          data: chargerPowers,
          smooth: 0.6,
          symbol: 'circle',
          symbolSize: 4,
          showSymbol: false,
          emphasis: {
            focus: 'series',
            itemStyle: { borderWidth: 2 }
          },
          lineStyle: { color: secondaryColor, width: 2 },
          itemStyle: { color: secondaryColor },
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
          充电详情
        </h1>
        <p style={{ color: colors.muted }}>
          {formatDate(detail.startDate)} @ {detail.location}
        </p>
      </div>

      {/* 电量变化 */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>电量变化</h3>
        <BatteryBar startLevel={detail.startBatteryLevel} endLevel={detail.endBatteryLevel} />
        <div className="flex justify-between mt-4 mb-6" style={{ color: colors.muted }}>
          <span>续航 {detail.startIdealRangeKm.toFixed(0)} km</span>
          <span>续航 {detail.endIdealRangeKm.toFixed(0)} km</span>
        </div>

        {/* Time Info Integration */}
        <div className="pt-4 border-t" style={{ borderColor: `${colors.muted}20` }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm" style={{ color: colors.muted }}>开始时间</p>
              <p className="font-semibold">{formatDate(detail.startDate)}</p>
            </div>
            {detail.endDate && (
              <div>
                <p className="text-sm" style={{ color: colors.muted }}>结束时间</p>
                <p className="font-semibold">{formatDate(detail.endDate)}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="充电量" value={formatEnergy(detail.chargeEnergyAdded)} />
        <StatCard label="充电时长" value={formatDuration(detail.durationMin)} />
        {detail.chargeEnergyUsed !== undefined && (
          <StatCard label="耗电量" value={formatEnergy(detail.chargeEnergyUsed)} />
        )}
        {detail.efficiency !== undefined && (
          <StatCard label="充电效率" value={`${detail.efficiency.toFixed(1)}%`} />
        )}
        {detail.outsideTempAvg !== undefined && (
          <StatCard label="平均温度" value={formatTemperature(detail.outsideTempAvg, unit)} />
        )}
        {detail.cost !== undefined && detail.cost > 0 && (
          <StatCard label="充电费用" value={formatCurrency(detail.cost)} />
        )}
      </div>

      {/* 充电曲线 */}
      {chartOption && (
        <Card>
          <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>充电曲线</h3>
          <ReactECharts
            option={chartOption}
            style={{ height: 'min(450px, 55vh)' }}
            opts={{ renderer: 'svg' }}
            className="!min-h-[320px]"
          />
        </Card>
      )}


    </div>
  );
}
