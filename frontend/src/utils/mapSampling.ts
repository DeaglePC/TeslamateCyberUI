import type { DrivePosition } from '@/types';

/**
 * Douglas-Peucker 路径简化算法
 * 智能保留转弯拐点，丢弃直线段上冗余点，保持轨迹形状
 */

/** 计算点到线段的垂直距离 */
function perpendicularDistance(
    point: { latitude: number; longitude: number },
    lineStart: { latitude: number; longitude: number },
    lineEnd: { latitude: number; longitude: number }
): number {
    const dx = lineEnd.longitude - lineStart.longitude;
    const dy = lineEnd.latitude - lineStart.latitude;

    if (dx === 0 && dy === 0) {
        // lineStart and lineEnd are the same point
        const pdx = point.longitude - lineStart.longitude;
        const pdy = point.latitude - lineStart.latitude;
        return Math.sqrt(pdx * pdx + pdy * pdy);
    }

    const t = Math.max(0, Math.min(1,
        ((point.longitude - lineStart.longitude) * dx + (point.latitude - lineStart.latitude) * dy) /
        (dx * dx + dy * dy)
    ));

    const projLon = lineStart.longitude + t * dx;
    const projLat = lineStart.latitude + t * dy;
    const distLon = point.longitude - projLon;
    const distLat = point.latitude - projLat;

    return Math.sqrt(distLon * distLon + distLat * distLat);
}

/** Douglas-Peucker 核心递归 */
function douglasPeucker(
    points: DrivePosition[],
    epsilon: number,
    startIdx: number,
    endIdx: number,
    keep: boolean[]
): void {
    if (endIdx <= startIdx + 1) return;

    let maxDist = 0;
    let maxIdx = startIdx;

    for (let i = startIdx + 1; i < endIdx; i++) {
        const dist = perpendicularDistance(points[i], points[startIdx], points[endIdx]);
        if (dist > maxDist) {
            maxDist = dist;
            maxIdx = i;
        }
    }

    if (maxDist > epsilon) {
        keep[maxIdx] = true;
        douglasPeucker(points, epsilon, startIdx, maxIdx, keep);
        douglasPeucker(points, epsilon, maxIdx, endIdx, keep);
    }
}

/**
 * 简化轨迹点用于地图渲染
 * @param positions 原始轨迹点数组
 * @param maxPoints 最大保留点数，默认 500
 * @returns 简化后的轨迹点数组（保持原始顺序）
 */
export function simplifyPositions(positions: DrivePosition[], maxPoints: number = 500): DrivePosition[] {
    if (positions.length <= maxPoints) return positions;

    // 二分搜索最佳 epsilon 值，使结果点数接近但不超过 maxPoints
    let lo = 0;
    let hi = 0;

    // 估算初始 epsilon 上限：取对角线范围
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    for (const p of positions) {
        if (p.latitude < minLat) minLat = p.latitude;
        if (p.latitude > maxLat) maxLat = p.latitude;
        if (p.longitude < minLon) minLon = p.longitude;
        if (p.longitude > maxLon) maxLon = p.longitude;
    }
    hi = Math.sqrt((maxLat - minLat) ** 2 + (maxLon - minLon) ** 2) * 0.1;

    let bestKeep: boolean[] | null = null;

    // 二分查找 ~15 次迭代足以收敛
    for (let iter = 0; iter < 20; iter++) {
        const mid = (lo + hi) / 2;
        const keep = new Array<boolean>(positions.length).fill(false);
        keep[0] = true;
        keep[positions.length - 1] = true;
        douglasPeucker(positions, mid, 0, positions.length - 1, keep);

        const count = keep.filter(Boolean).length;

        if (count <= maxPoints) {
            bestKeep = keep;
            hi = mid; // try smaller epsilon to keep more points
        } else {
            lo = mid; // too many points, increase epsilon
        }

        // Good enough
        if (count >= maxPoints * 0.8 && count <= maxPoints) break;
    }

    // Fallback: if binary search didn't converge, use uniform sampling
    if (!bestKeep) {
        const step = positions.length / maxPoints;
        const result: DrivePosition[] = [];
        for (let i = 0; i < maxPoints; i++) {
            result.push(positions[Math.floor(i * step)]);
        }
        // Always include last point
        if (result[result.length - 1] !== positions[positions.length - 1]) {
            result[result.length - 1] = positions[positions.length - 1];
        }
        return result;
    }

    return positions.filter((_, i) => bestKeep![i]);
}
