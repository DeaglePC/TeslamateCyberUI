import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/store/settings';
import { chargeApi } from '@/services/api';
import { Card } from '@/components/Card';
import { BatteryBar } from '@/components/Battery';
import { DateFilter } from '@/components/DateFilter';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { formatDate, formatDuration, formatEnergy } from '@/utils/format';
import { getThemeColors } from '@/utils/theme';
import type { ChargeListItem, Pagination } from '@/types';
import { ChargeStats } from '@/components/ChargeStats/ChargeStats';
import clsx from 'clsx';

export default function ChargeListPage() {
  const navigate = useNavigate();
  const { theme, selectedCarId, language } = useSettingsStore();
  const [charges, setCharges] = useState<ChargeListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 9, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>(() => {
    const now = new Date();
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 1);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    return {
      start: formatDate(start),
      end: formatDate(now)
    };
  });

  const colors = getThemeColors(theme);

  const fetchData = useCallback(async (page = 1) => {
    if (!selectedCarId) {
      setError(language === 'zh' ? '请先选择车辆' : 'Please select a car first');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await chargeApi.getList(selectedCarId, page, 9, dateRange.start, dateRange.end);
      setCharges(result.items || []);
      setPagination(result.pagination);
    } catch (err) {
      if (err instanceof Error && err.message !== 'no_api_config') {
        setError(err.message);
      } else if (!(err instanceof Error) || err.message !== 'no_api_config') {
        setError(language === 'zh' ? '加载失败' : 'Load failed');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCarId, dateRange, language]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateFilter = (start: string | undefined, end: string | undefined) => {
    setDateRange({ start, end });
  };

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="space-y-4 animate-slideUp">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
            {language === 'zh' ? '充电记录' : 'Charging Records'}
          </h1>
          <p style={{ color: colors.muted }}>
            {loading ? '...' : (language === 'zh' ? `共 ${pagination.total} 条记录` : `${pagination.total} records`)}
          </p>
        </div>

        {/* 日期筛选 */}
        <DateFilter onFilter={handleDateFilter} initialPreset="year" />
      </div>

      {/* 统计概览 */}
      {selectedCarId && (
        <ChargeStats
          carId={selectedCarId}
          startDate={dateRange.start}
          endDate={dateRange.end}
        />
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchData()} />
      ) : charges.length === 0 ? (
        <EmptyState message={language === 'zh' ? '暂无充电记录' : 'No charging records'} />
      ) : (
        <>
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
                    {/* 充电图标 + 类型角标 */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${colors.success}15` }}>
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
                      {/* 充电类型角标 */}
                      <div
                        className="absolute -right-1 -bottom-1 px-1.5 py-0.5 rounded text-xs font-bold"
                        style={{
                          background: charge.chargeType === 'DC' ? '#ff8c00' : colors.primary,
                          color: '#fff',
                          fontSize: '10px',
                          lineHeight: '1',
                          minWidth: '20px',
                          textAlign: 'center',
                        }}
                      >
                        {charge.chargeType || '--'}
                      </div>
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

                  {/* 底部：充电数据 */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: `${colors.muted}20` }}>
                    {/* 充电量 */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${colors.primary}15` }}>
                        <svg className="w-4 h-4" style={{ color: colors.primary }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="6" width="18" height="12" rx="2" ry="2" />
                          <line x1="23" y1="13" x2="23" y2="11" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs" style={{ color: colors.muted }}>{language === 'zh' ? '充电量' : 'Energy'}</p>
                        <p className="font-bold text-sm whitespace-nowrap" style={{ color: colors.primary }}>
                          {formatEnergy(charge.chargeEnergyAdded)}
                        </p>
                      </div>
                    </div>

                    {/* 时长 */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${colors.chart[1]}15` }}>
                        <svg className="w-4 h-4" style={{ color: colors.chart[1] }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs" style={{ color: colors.muted }}>{language === 'zh' ? '时长' : 'Duration'}</p>
                        <p className="font-bold text-sm whitespace-nowrap" style={{ color: colors.chart[1] }}>{formatDuration(charge.durationMin, language)}</p>
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
                {language === 'zh' ? '上一页' : 'Previous'}
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
                {language === 'zh' ? '下一页' : 'Next'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

