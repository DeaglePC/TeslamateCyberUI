import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/store/settings';
import { driveApi } from '@/services/api';
import { Card } from '@/components/Card';
import { BatteryBar } from '@/components/Battery';
import { Loading, ErrorState, EmptyState } from '@/components/States';
import { formatDate, formatDuration, formatDistance, formatSpeed } from '@/utils/format';
import type { DriveListItem, Pagination } from '@/types';
import clsx from 'clsx';

export default function DriveListPage() {
  const navigate = useNavigate();
  const { theme, selectedCarId, unit } = useSettingsStore();
  const [drives, setDrives] = useState<DriveListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const themeColors: Record<string, { primary: string; muted: string; accent: string }> = {
    cyber: { primary: '#00f0ff', muted: '#808080', accent: '#ff00aa' },
    tesla: { primary: '#cc0000', muted: '#888888', accent: '#ffffff' },
    dark: { primary: '#4361ee', muted: '#8d99ae', accent: '#f72585' },
    tech: { primary: '#0077b6', muted: '#778da9', accent: '#90e0ef' },
    aurora: { primary: '#72efdd', muted: '#98c1d9', accent: '#7678ed' },
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
      const result = await driveApi.getList(selectedCarId, page, 20);
      setDrives(result.items || []);
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
  if (drives.length === 0) return <EmptyState message="暂无驾驶记录" />;

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div className="space-y-4 animate-slideUp">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
          驾驶记录
        </h1>
        <p style={{ color: colors.muted }}>
          共 {pagination.total} 条记录
        </p>
      </div>

      {/* 驾驶记录列表 */}
      <div className="space-y-3">
        {drives.map((drive, index) => (
          <Card
            key={drive.id}
            hoverable
            onClick={() => navigate(`/drives/${drive.id}`)}
            className="animate-slideIn"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex flex-col gap-4">
              {/* 路线信息 */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center py-1">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ background: colors.primary }}
                  />
                  <div 
                    className="w-0.5 h-8 my-1"
                    style={{ background: `${colors.muted}40` }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ background: colors.accent }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="mb-2">
                    <p className="font-medium truncate">{drive.startLocation}</p>
                    <p className="text-sm" style={{ color: colors.muted }}>
                      {formatDate(drive.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium truncate">{drive.endLocation}</p>
                    <p className="text-sm" style={{ color: colors.muted }}>
                      {drive.endDate ? formatDate(drive.endDate, 'HH:mm') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 行程数据 */}
              <div className="pt-2 border-t" style={{ borderColor: `${colors.muted}20` }}>
                <div className="flex flex-wrap md:flex-nowrap items-center justify-between md:justify-start gap-3 md:gap-6">
                  <div className="flex items-center gap-1 md:gap-2">
                    <p className="text-lg font-bold" style={{ color: colors.primary }}>
                      {formatDistance(drive.distance, unit)}
                    </p>
                    <span className="text-xs" style={{ color: colors.muted }}>距离</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <p className="font-semibold">{formatDuration(drive.durationMin)}</p>
                    <span className="text-xs" style={{ color: colors.muted }}>时长</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <p className="font-semibold">{formatSpeed(drive.speedMax, unit)}</p>
                    <span className="text-xs" style={{ color: colors.muted }}>最高速度</span>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    <p className="font-semibold">{drive.efficiency.toFixed(0)} Wh/km</p>
                    <span className="text-xs" style={{ color: colors.muted }}>能效</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2 md:mt-0 w-full md:w-auto">
                  {/* 电量变化 */}
                  <div className="w-24 md:w-24 shrink-0">
                    <BatteryBar
                      startLevel={drive.startBatteryLevel}
                      endLevel={drive.endBatteryLevel}
                      showLabels={false}
                    />
                    <div className="flex justify-between text-xs mt-1" style={{ color: colors.muted }}>
                      <span>{drive.startBatteryLevel}%</span>
                      <span>{drive.endBatteryLevel}%</span>
                    </div>
                  </div>
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
