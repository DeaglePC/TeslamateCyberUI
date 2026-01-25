import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/store/settings';
import { chargeApi } from '@/services/api';
import { Card } from '@/components/Card';
import { BatteryBar } from '@/components/Battery';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { formatDate, formatDuration, formatEnergy, formatCurrency } from '@/utils/format';
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
      <div className="space-y-3">
        {charges.map((charge, index) => (
          <Card
            key={charge.id}
            hoverable
            onClick={() => navigate(`/charges/${charge.id}`)}
            className="animate-slideIn"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* 顶部：时间和位置 */}
              <div className="flex items-start gap-2 mb-2 md:mb-0 md:flex-1 md:min-w-0">
                <svg
                  className="w-4 h-4 flex-shrink-0 mt-1 md:mt-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.success}
                  strokeWidth="2"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{charge.location}</p>
                  <p className="text-sm" style={{ color: colors.muted }}>
                    {formatDate(charge.startDate)}
                    {charge.endDate && ` - ${formatDate(charge.endDate, 'HH:mm')}`}
                  </p>
                </div>
              </div>

              {/* 电量条 */}
              <div className="w-full md:w-auto md:flex-1">
                <BatteryBar
                  startLevel={charge.startBatteryLevel}
                  endLevel={charge.endBatteryLevel}
                />
              </div>

              {/* 底部：充电数据 */}
              <div className="flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-6 w-full md:w-auto">
                <div className="flex items-center gap-1 md:gap-2">
                  <p className="text-lg font-bold" style={{ color: colors.primary }}>
                    {formatEnergy(charge.chargeEnergyAdded)}
                  </p>
                  <span className="text-sm" style={{ color: colors.muted }}>充电量</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                  <p className="font-semibold">{formatDuration(charge.durationMin)}</p>
                  <span className="text-sm" style={{ color: colors.muted }}>时长</span>
                </div>
                {charge.cost !== undefined && charge.cost > 0 && (
                  <div className="flex items-center gap-1 md:gap-2">
                    <p className="font-semibold">{formatCurrency(charge.cost)}</p>
                    <span className="text-sm" style={{ color: colors.muted }}>费用</span>
                  </div>
                )}
                <svg
                  className="w-5 h-5 flex-shrink-0 md:ml-auto"
                  style={{ color: colors.muted }}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
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
