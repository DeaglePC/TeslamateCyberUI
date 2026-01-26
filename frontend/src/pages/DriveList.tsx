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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {drives.map((drive, index) => (
          <Card
            key={drive.id}
            hoverable
            onClick={() => navigate(`/drives/${drive.id}`)}
            className=""
            style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
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

              {/* 电量条 */}
              <div className="w-full">
                <BatteryBar
                  startLevel={drive.startBatteryLevel}
                  endLevel={drive.endBatteryLevel}
                />
              </div>

              {/* 行程数据 - 2x2 网格布局 */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t" style={{ borderColor: `${colors.muted}20` }}>
                {/* 距离 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                    <svg className="w-4 h-4" style={{ color: colors.primary }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.muted }}>距离</p>
                    <p className="font-bold" style={{ color: colors.primary }}>
                      {formatDistance(drive.distance, unit)}
                    </p>
                  </div>
                </div>

                {/* 时长 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.accent}15` }}>
                    <svg className="w-4 h-4" style={{ color: colors.accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.muted }}>时长</p>
                    <p className="font-semibold">{formatDuration(drive.durationMin)}</p>
                  </div>
                </div>

                {/* 最高速度 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.primary}15` }}>
                    <svg className="w-4 h-4" style={{ color: colors.primary }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.muted }}>最高速度</p>
                    <p className="font-semibold">{formatSpeed(drive.speedMax, unit)}</p>
                  </div>
                </div>

                {/* 能效 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${colors.accent}15` }}>
                    <svg className="w-4 h-4" style={{ color: colors.accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: colors.muted }}>能效</p>
                    <p className="font-semibold">{drive.efficiency.toFixed(0)} Wh/km</p>
                  </div>
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
