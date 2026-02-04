import { useMemo } from 'react';
import { UniversalMap, HeatmapPoint } from '@/components/UniversalMap';
import { ChargeLocationStat } from '@/types';

interface Props {
    data: ChargeLocationStat[];
    className?: string;
}

export function ChargeLocationHeatmap({ data, className = '' }: Props) {
    // Use useMemo to cache heatmap data and avoid unnecessary map re-renders
    const validHeatmapData = useMemo(() => {
        const heatmapData: HeatmapPoint[] = data.map(stat => ({
            latitude: stat.latitude,
            longitude: stat.longitude,
            count: stat.count,
            value: stat.totalEnergy, // Use energy as weight
            label: stat.location
        }));

        // Filter invalid coordinates
        return heatmapData.filter(p => p.latitude && p.longitude);
    }, [data]);

    if (validHeatmapData.length === 0) {
        return null; // Or empty state
    }

    return (
        <UniversalMap
            heatmapData={validHeatmapData}
            className={className}
        />
    );
}
