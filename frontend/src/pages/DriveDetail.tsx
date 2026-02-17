import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { useSettingsStore } from '@/store/settings';
import { driveApi } from '@/services/api';
import { Card, StatCard } from '@/components/Card';
import { BatteryBar } from '@/components/Battery';
import { Loading, ErrorState } from '@/components/States';
import { UniversalMap } from '@/components/UniversalMap';
import { SpeedHistogram } from '@/components/DriveStats';
import { formatDate, formatDuration, formatDistance, formatSpeed, formatTemperature } from '@/utils/format';
import { getThemeColors } from '@/utils/theme';
import { useTranslation } from '@/utils/i18n';
import { domToPng } from 'modern-screenshot';
import type { DriveDetail, DrivePosition } from '@/types';

export default function DriveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme, unit, language } = useSettingsStore();
  const { t } = useTranslation(language);
  const [detail, setDetail] = useState<DriveDetail | null>(null);
  const [positions, setPositions] = useState<DrivePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const colors = getThemeColors(theme);
  const secondaryColor = colors.chart?.[1] || colors.accent;
  const chartColors = [
    colors.primary,
    secondaryColor,
    colors.chart?.[2] || '#10B981',
    colors.chart?.[3] || '#F59E0B',
  ];

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
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // 分享截图
  const handleShare = useCallback(async () => {
    if (!contentRef.current || sharing) return;
    setSharing(true);
    try {
      const { backgroundImage } = useSettingsStore.getState();
      const padding = 24;
      const scaleFactor = 2;

      // Step 1: 原样截取内容（不修改任何样式）
      const contentDataUrl = await domToPng(contentRef.current, {
        scale: scaleFactor,
        filter: (node: Node) => {
          if (node instanceof HTMLElement) {
            return !node.hasAttribute('data-hide-on-share');
          }
          return true;
        },
      });

      // Step 2: 后期合成 — 在 canvas 上绘制背景 + 内容
      const contentImg = new Image();
      contentImg.src = contentDataUrl;
      await new Promise<void>((resolve, reject) => {
        contentImg.onload = () => resolve();
        contentImg.onerror = reject;
      });

      const canvasW = contentImg.width + padding * 2 * scaleFactor;
      const canvasH = contentImg.height + padding * 2 * scaleFactor;
      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d')!;

      // 绘制背景
      if (backgroundImage) {
        const bgImg = new Image();
        bgImg.src = backgroundImage;
        await new Promise<void>((resolve) => {
          bgImg.onload = () => resolve();
          bgImg.onerror = () => resolve(); // 背景加载失败则用纯色
        });
        if (bgImg.complete && bgImg.naturalWidth > 0) {
          // cover 模式绘制背景
          const scale = Math.max(canvasW / bgImg.width, canvasH / bgImg.height);
          const w = bgImg.width * scale;
          const h = bgImg.height * scale;
          ctx.drawImage(bgImg, (canvasW - w) / 2, (canvasH - h) / 2, w, h);
          // 暗色遮罩
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(0, 0, canvasW, canvasH);
        } else {
          ctx.fillStyle = colors.bg;
          ctx.fillRect(0, 0, canvasW, canvasH);
        }
      } else {
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, canvasW, canvasH);
      }

      // 绘制内容（居中，四周留白）
      ctx.drawImage(contentImg, padding * scaleFactor, padding * scaleFactor);

      // Step 3: 下载
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStr = detail ? formatDate(detail.startDate, 'YYYY-MM-DD') : '';
        link.download = `drive_detail_${id}_${dateStr}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (err) {
      console.error('Screenshot failed:', err);
    } finally {
      setSharing(false);
    }
  }, [sharing, colors.bg, detail, id]);

  // 检查是否有温度数据 - 必须在 early return 之前
  const hasTempData = useMemo(() => {
    return positions.some(p => p.outsideTemp !== undefined || p.insideTemp !== undefined);
  }, [positions]);

  // 检查是否有胎压数据 - 必须在 early return 之前
  const hasTirePressureData = useMemo(() => {
    return positions.some(p =>
      p.tpmsPressureFL !== undefined ||
      p.tpmsPressureFR !== undefined ||
      p.tpmsPressureRL !== undefined ||
      p.tpmsPressureRR !== undefined
    );
  }, [positions]);

  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;
  if (!detail) return <ErrorState message={t('driveRecordNotFound')} />;

  // 数据采样函数 - 对密集数据进行降采样
  // mode: 'max' 保留区间最大值（适用于速度，确保峰值显示）
  // mode: 'avg' 取区间平均值（适用于平滑曲线）
  const sampleData = (data: number[], targetPoints: number = 150, mode: 'max' | 'avg' = 'avg'): number[] => {
    if (data.length <= targetPoints) return data;

    const step = data.length / targetPoints;
    const sampled: number[] = [];

    for (let i = 0; i < targetPoints; i++) {
      const startIdx = Math.floor(i * step);
      const endIdx = Math.min(Math.floor((i + 1) * step), data.length);

      if (mode === 'max') {
        // 保留区间最大值，确保峰值速度能够显示
        let maxVal = data[startIdx];
        for (let j = startIdx + 1; j < endIdx; j++) {
          if (data[j] > maxVal) maxVal = data[j];
        }
        sampled.push(maxVal);
      } else {
        // 计算窗口内的平均值（简单移动平均）
        let sum = 0;
        for (let j = startIdx; j < endIdx; j++) {
          sum += data[j];
        }
        sampled.push(Math.round(sum / (endIdx - startIdx)));
      }
    }

    return sampled;
  };

  // 速度/功率图表配置
  const getChartOption = () => {
    if (positions.length === 0) return null;

    // 采样数据，目标约 150 个点
    const targetPoints = Math.min(positions.length, 150);
    const step = positions.length / targetPoints;

    const sampledTimes: string[] = [];
    const rawSpeeds: number[] = [];
    const rawPowers: number[] = [];

    for (let i = 0; i < targetPoints; i++) {
      const idx = Math.floor(i * step);
      sampledTimes.push(formatDate(positions[idx].date, 'HH:mm'));
      rawSpeeds.push(positions[idx].speed);
      rawPowers.push(positions[idx].power);
    }

    // 速度使用最大值采样（保留峰值速度），功率使用平均值采样（保留正负趋势，包括动能回收）
    const speeds = sampleData(positions.map(p => p.speed), targetPoints, 'max');
    const powers = sampleData(positions.map(p => p.power), targetPoints, 'avg');

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
        data: [t('speedKmh'), t('power')],
        textStyle: { color: colors.muted },
        top: 10,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: colors.bg,
        borderColor: colors.primary,
        textStyle: { color: colors.muted },
        axisPointer: {
          type: 'cross',
          crossStyle: { color: colors.muted },
          lineStyle: { color: `${colors.primary}60` }
        }
      },
      xAxis: {
        type: 'category',
        data: sampledTimes,
        axisLine: { lineStyle: { color: colors.muted } },
        axisLabel: { color: colors.muted, interval: 'auto' },
        boundaryGap: false,
      },
      yAxis: [
        {
          type: 'value',
          name: t('speedKmh'),
          axisLine: { lineStyle: { color: colors.primary } },
          axisLabel: { color: colors.primary },
          splitLine: { lineStyle: { color: `${colors.muted}15` } },
        },
        {
          type: 'value',
          name: t('power'),
          scale: true, // 自动缩放以包含负值（动能回收）
          axisLine: { lineStyle: { color: secondaryColor } },
          axisLabel: { color: secondaryColor },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: t('speedKmh'),
          type: 'line',
          data: speeds,
          smooth: 0.4,
          symbol: 'none',
          sampling: 'lttb', // Largest-Triangle-Three-Buckets 采样算法
          lineStyle: {
            color: colors.primary,
            width: 2,
            shadowColor: `${colors.primary}40`,
            shadowBlur: 4,
            shadowOffsetY: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${colors.primary}30` },
                { offset: 0.7, color: `${colors.primary}10` },
                { offset: 1, color: `${colors.primary}00` },
              ],
            },
          },
          itemStyle: { color: colors.primary },
        },
        {
          name: t('power'),
          type: 'line',
          yAxisIndex: 1,
          data: powers,
          smooth: 0.4,
          symbol: 'none',
          sampling: 'lttb',
          lineStyle: {
            color: secondaryColor,
            width: 1.5,
            shadowColor: `${secondaryColor}30`,
            shadowBlur: 3,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: `${secondaryColor}25` },
                { offset: 1, color: `${secondaryColor}00` },
              ],
            },
          },
          itemStyle: { color: secondaryColor },
        },
      ],
    };
  };

  const chartOption = getChartOption();

  // 温度图表配置
  const getTempChartOption = () => {
    if (!hasTempData) return null;

    const tempPositions = positions.filter(p => p.outsideTemp !== undefined || p.insideTemp !== undefined);
    const sampledTimes = tempPositions.filter((_, i) => i % Math.max(1, Math.floor(tempPositions.length / 100)) === 0).map(p => formatDate(p.date, 'HH:mm'));
    const outsideTemps = tempPositions.filter((_, i) => i % Math.max(1, Math.floor(tempPositions.length / 100)) === 0).map(p => p.outsideTemp);
    const insideTemps = tempPositions.filter((_, i) => i % Math.max(1, Math.floor(tempPositions.length / 100)) === 0).map(p => p.insideTemp);

    return {
      backgroundColor: 'transparent',
      grid: { top: 50, right: 10, bottom: 25, left: 10, containLabel: true },
      legend: {
        data: [t('outsideTemp'), t('insideTemp')],
        textStyle: { color: colors.muted },
        top: 10,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: colors.bg,
        borderColor: colors.primary,
        textStyle: { color: colors.muted },
        formatter: (params: { seriesName: string; value: number; axisValue: string }[]) => {
          let html = `<div style="font-weight: 600;">${params[0]?.axisValue || ''}</div>`;
          params.forEach(p => {
            if (p.value !== undefined && p.value !== null) {
              const temp = unit === 'imperial' ? (p.value * 9 / 5 + 32).toFixed(1) : p.value.toFixed(1);
              const unitStr = unit === 'imperial' ? '°F' : '°C';
              html += `<div>${p.seriesName}: ${temp}${unitStr}</div>`;
            }
          });
          return html;
        }
      },
      xAxis: {
        type: 'category',
        data: sampledTimes,
        axisLine: { lineStyle: { color: colors.muted } },
        axisLabel: { color: colors.muted, interval: 'auto' },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: colors.muted } },
        axisLabel: { color: colors.muted, formatter: (val: number) => unit === 'imperial' ? `${(val * 9 / 5 + 32).toFixed(0)}°F` : `${val.toFixed(0)}°C` },
        splitLine: { lineStyle: { color: `${colors.muted}15` } },
      },
      series: [
        {
          name: t('outsideTemp'),
          type: 'line',
          data: outsideTemps,
          smooth: 0.6,
          symbol: 'none',
          lineStyle: { color: '#8AB8FF', width: 2 },
          itemStyle: { color: '#8AB8FF' },
        },
        {
          name: t('insideTemp'),
          type: 'line',
          data: insideTemps,
          smooth: 0.6,
          symbol: 'none',
          lineStyle: { color: '#F2CC0C', width: 2 },
          itemStyle: { color: '#F2CC0C' },
        },
      ],
    };
  };

  // 胎压图表配置
  const getTirePressureChartOption = () => {
    if (!hasTirePressureData) return null;

    const tpPositions = positions.filter(p => p.tpmsPressureFL !== undefined);
    const sampledTimes = tpPositions.filter((_, i) => i % Math.max(1, Math.floor(tpPositions.length / 100)) === 0).map(p => formatDate(p.date, 'HH:mm'));
    const flPressures = tpPositions.filter((_, i) => i % Math.max(1, Math.floor(tpPositions.length / 100)) === 0).map(p => p.tpmsPressureFL);
    const frPressures = tpPositions.filter((_, i) => i % Math.max(1, Math.floor(tpPositions.length / 100)) === 0).map(p => p.tpmsPressureFR);
    const rlPressures = tpPositions.filter((_, i) => i % Math.max(1, Math.floor(tpPositions.length / 100)) === 0).map(p => p.tpmsPressureRL);
    const rrPressures = tpPositions.filter((_, i) => i % Math.max(1, Math.floor(tpPositions.length / 100)) === 0).map(p => p.tpmsPressureRR);

    return {
      backgroundColor: 'transparent',
      grid: { top: 50, right: 10, bottom: 25, left: 10, containLabel: true },
      legend: {
        data: [t('frontLeft'), t('frontRight'), t('rearLeft'), t('rearRight')],
        textStyle: { color: colors.muted },
        top: 10,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: colors.bg,
        borderColor: colors.primary,
        textStyle: { color: colors.muted },
        formatter: (params: { seriesName: string; value: number; axisValue: string }[]) => {
          let html = `<div style="font-weight: 600;">${params[0]?.axisValue || ''}</div>`;
          params.forEach(p => {
            if (p.value !== undefined && p.value !== null) {
              html += `<div>${p.seriesName}: ${p.value.toFixed(2)} bar</div>`;
            }
          });
          return html;
        }
      },
      xAxis: {
        type: 'category',
        data: sampledTimes,
        axisLine: { lineStyle: { color: colors.muted } },
        axisLabel: { color: colors.muted, interval: 'auto' },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: 'bar',
        axisLine: { lineStyle: { color: colors.muted } },
        axisLabel: { color: colors.muted },
        splitLine: { lineStyle: { color: `${colors.muted}15` } },
      },
      series: [
        { name: t('frontLeft'), type: 'line', data: flPressures, smooth: 0.5, symbol: 'none', lineStyle: { color: chartColors[0], width: 1.5 }, itemStyle: { color: chartColors[0] } },
        { name: t('frontRight'), type: 'line', data: frPressures, smooth: 0.5, symbol: 'none', lineStyle: { color: chartColors[1], width: 1.5 }, itemStyle: { color: chartColors[1] } },
        { name: t('rearLeft'), type: 'line', data: rlPressures, smooth: 0.5, symbol: 'none', lineStyle: { color: chartColors[2], width: 1.5 }, itemStyle: { color: chartColors[2] } },
        { name: t('rearRight'), type: 'line', data: rrPressures, smooth: 0.5, symbol: 'none', lineStyle: { color: chartColors[3], width: 1.5 }, itemStyle: { color: chartColors[3] } },
      ],
    };
  };

  const tempChartOption = getTempChartOption();
  const tirePressureChartOption = getTirePressureChartOption();

  return (
    <div className="space-y-6 animate-slideUp" ref={contentRef}>
      {/* 返回按钮 */}
      <button
        data-hide-on-share
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
        style={{ color: colors.muted }}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('back')}
      </button>

      {/* 标题 + 分享按钮 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
            {t('driveDetail')}
          </h1>
          <p style={{ color: colors.muted }}>
            {formatDate(detail.startDate)}
          </p>
        </div>
        <button
          data-hide-on-share
          onClick={handleShare}
          disabled={sharing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all origin-right hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{
            background: `${colors.primary}20`,
            color: colors.primary,
            border: `1px solid ${colors.primary}40`,
          }}
          title={t('share')}
        >
          {sharing ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="60" strokeDashoffset="20" />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          )}
          <span className="text-sm font-medium hidden sm:inline">{sharing ? t('generatingImage') : t('share')}</span>
        </button>
      </div>

      {/* 路线信息 */}
      <Card>
        <div className="grid grid-cols-[24px_1fr] gap-x-3">
          {/* Start Row */}
          <div className="relative flex flex-col items-center justify-center self-stretch">
            <div
              className="absolute top-1/2 bottom-0 w-0.5 left-1/2 -translate-x-1/2"
              style={{ background: `${colors.muted}40` }}
            />
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-xs relative z-10 shrink-0"
              style={{
                background: colors.primary,
                boxShadow: `0 0 8px ${colors.primary}60`
              }}
            >
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{t('start')}</span>
            </div>
          </div>
          <div className="py-3 min-w-0">
            <p className="font-medium break-words leading-tight">{detail.startLocation}</p>
            <p className="text-sm mt-1" style={{ color: colors.muted }}>
              {formatDate(detail.startDate)}
            </p>
          </div>

          {/* End Row */}
          <div className="relative flex flex-col items-center justify-center self-stretch">
            <div
              className="absolute top-0 bottom-1/2 w-0.5 left-1/2 -translate-x-1/2"
              style={{ background: `${colors.muted}40` }}
            />
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-xs relative z-10 shrink-0"
              style={{
                background: secondaryColor,
                boxShadow: `0 0 8px ${secondaryColor}60`
              }}
            >
              <span style={{ color: '#fff', fontWeight: 'bold' }}>{t('end')}</span>
            </div>
          </div>
          <div className="py-3 min-w-0">
            <p className="font-medium break-words leading-tight">{detail.endLocation}</p>
            <p className="text-sm mt-1" style={{ color: colors.muted }}>
              {detail.endDate ? formatDate(detail.endDate) : '-'}
            </p>
          </div>
        </div>
      </Card>

      {/* 电量变化 */}
      <Card>
        <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>{t('batteryConsumption')}</h3>
        <BatteryBar startLevel={detail.startBatteryLevel} endLevel={detail.endBatteryLevel} />
        <div className="flex justify-between mt-4" style={{ color: colors.muted }}>
          <span>{t('range')} {detail.startIdealRangeKm.toFixed(0)} km</span>
          <span>{t('range')} {detail.endIdealRangeKm.toFixed(0)} km</span>
        </div>
      </Card>

      {/* 统计数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('driveDistance')} value={formatDistance(detail.distance, unit)} />
        <StatCard label={t('driveDuration')} value={formatDuration(detail.durationMin)} />
        <StatCard label={t('avgSpeed')} value={formatSpeed(detail.speedAvg, unit)} />
        <StatCard label={t('maxSpeed')} value={formatSpeed(detail.speedMax, unit)} />
        <StatCard label={t('efficiency')} value={`${detail.efficiency.toFixed(0)} Wh/km`} />
        <StatCard label={t('maxPower')} value={`${detail.powerMax} kW`} />
        <StatCard label={t('maxRegen')} value={`${Math.abs(detail.powerMin)} kW`} />
        {detail.outsideTempAvg !== undefined && (
          <StatCard label={t('outsideTemp')} value={formatTemperature(detail.outsideTempAvg, unit)} />
        )}
      </div>

      {/* 地图轨迹 - 无需Key也能显示 */}
      {positions.length > 0 && (
        <Card>
          <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>{t('driveRoute')}</h3>
          <div className="h-64 md:h-96 w-full relative z-0">
            <UniversalMap
              positions={positions}
              startMarker={{ latitude: detail.startLatitude, longitude: detail.startLongitude }}
              endMarker={{ latitude: detail.endLatitude, longitude: detail.endLongitude }}
            />
          </div>
        </Card>
      )}

      {/* 速度/功率曲线 */}
      {chartOption && (
        <Card>
          <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>{t('speedPowerCurve')}</h3>
          <ReactECharts
            option={chartOption}
            style={{ height: 'min(400px, 50vh)' }}
            opts={{ renderer: 'svg' }}
            className="!min-h-[280px]"
          />
        </Card>
      )}

      {/* 速度直方图 */}
      {id && <SpeedHistogram driveId={parseInt(id)} />}

      {/* 温度曲线 */}
      {tempChartOption && (
        <Card>
          <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>{t('temperatures')}</h3>
          <ReactECharts
            option={tempChartOption}
            style={{ height: 'min(300px, 40vh)' }}
            opts={{ renderer: 'svg' }}
            className="!min-h-[240px]"
          />
        </Card>
      )}

      {/* 胎压曲线 */}
      {tirePressureChartOption && (
        <Card>
          <h3 className="font-semibold mb-4" style={{ color: colors.primary }}>{t('tirePressure')}</h3>
          <ReactECharts
            option={tirePressureChartOption}
            style={{ height: 'min(300px, 40vh)' }}
            opts={{ renderer: 'svg' }}
            className="!min-h-[240px]"
          />
        </Card>
      )}
    </div>
  );
}

