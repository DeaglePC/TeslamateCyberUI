import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/store/settings';
import { chargeApi } from '@/services/api';
import { Card } from '@/components/Card';
import { BatteryBar } from '@/components/Battery';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { formatDate, formatDuration, formatEnergy } from '@/utils/format';
import type { ChargeListItem, Pagination } from '@/types';
import clsx from 'clsx';

export default function ChargeListPage() {
  const navigate = useNavigate();
  const { theme, selectedCarId } = useSettingsStore();
  const [charges, setCharges] = useState<ChargeListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const themeColors: Record<string, { primary: string; muted: string; success: string }> = {
    cyber: { primary: '#00f0ff', muted: '#808080', success: '#00ff88' },
    tesla: { primary: '#cc0000', muted: '#888888', success: '#4caf50' },
    dark: { primary: '#4361ee', muted: '#8d99ae', success: '#06d6a0' },
    tech: { primary: '#0077b6', muted: '#778da9', success: '#52b788' },
    aurora: { primary: '#72efdd', muted: '#98c1d9', success: '#80ed99' },
  };

  const colors = themeColors[theme] || themeColors.cyber;

  const fetchData = async (page = 1) => {
    if (!selectedCarId) {
      setError('请先选择车辆');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await chargeApi.getList(selectedCarId, page, 20);
      setCharges(result.items || []);
      setPagination(result.pagination);
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
  if (error) return <ErrorState message={error} onRetry={() => fetchData()} />;
  if (charges.length === 0) return <EmptyState message="暂无充电记录" />;

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="space-y-4 animate-slideUp">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
          充电记录
        </h1>
        <p style={{ color: colors.muted }}>
          共 {pagination.total} 条记录
        </p>
      </div>

      {/* 充电记录列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {charges.map((charge, index) => (
          <Card
            key={charge.id}
            hoverable
            onClick={() => navigate(`/charges/${charge.id}`)}
            className=""
            style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
          >
            <div className="flex flex-col gap-4">
              {/* 顶部：时间和位置 */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${colors.success}15` }}>
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.success}
                    strokeWidth="2"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{charge.location}</p>
                  <p className="text-sm" style={{ color: colors.muted }}>
                    {formatDate(charge.startDate)}
                    {charge.endDate && ` - ${formatDate(charge.endDate, 'HH:mm')}`}
                  </p>
                </div>
              </div>

              {/* 电量条 */}
              <div>
                <BatteryBar
                  startLevel={charge.startBatteryLevel}
                  endLevel={charge.endBatteryLevel}
                />
              </div>

              {/* 底部：充电数据 - 网格布局 */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t" style={{ borderColor: `${colors.muted}20` }}>
                {/* 充电量 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                    <svg className="w-4 h-4" style={{ color: colors.primary }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
                      <line x1="23" y1="13" x2="23" y2="11" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.muted }}>充电量</p>
                    <p className="font-bold" style={{ color: colors.primary }}>
                      {formatEnergy(charge.chargeEnergyAdded)}
                    </p>
                  </div>
                </div>

                {/* 时长 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.success}15` }}>
                    <svg className="w-4 h-4" style={{ color: colors.success }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.muted }}>时长</p>
                    <p className="font-semibold">{formatDuration(charge.durationMin)}</p>
                  </div>
                </div>

                {/* 充电类型 AC/DC */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: charge.chargeType === 'DC' ? 'rgba(255,140,0,0.15)' : `${colors.primary}15`
                    }}
                  >
                    <svg
                      className="w-4 h-4"
                      style={{ color: charge.chargeType === 'DC' ? '#ff8c00' : colors.primary }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.muted }}>类型</p>
                    <p
                      className="font-bold"
                      style={{ color: charge.chargeType === 'DC' ? '#ff8c00' : colors.primary }}
                    >
                      {charge.chargeType || '--'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 查看详情箭头 - 仅在有费用时显示 */}
              {charge.cost !== undefined && charge.cost > 0 && (
                <div className="flex justify-end">
                  <svg
                    className="w-5 h-5"
                    style={{ color: colors.muted }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => fetchData(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className={clsx(
              'px-4 py-2 rounded-lg transition-all',
              pagination.page <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
            )}
            style={{
              background: `${colors.primary}20`,
              color: colors.primary,
            }}
          >
            上一页
          </button>
          <span style={{ color: colors.muted }}>
            {pagination.page} / {totalPages}
          </span>
          <button
            onClick={() => fetchData(pagination.page + 1)}
            disabled={pagination.page >= totalPages}
            className={clsx(
              'px-4 py-2 rounded-lg transition-all',
              pagination.page >= totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
            )}
            style={{
              background: `${colors.primary}20`,
              color: colors.primary,
            }}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
