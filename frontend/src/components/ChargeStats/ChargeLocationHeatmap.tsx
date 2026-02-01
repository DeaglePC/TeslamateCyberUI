import { UniversalMap, HeatmapPoint } from '@/components/UniversalMap';
import { ChargeLocationStat } from '@/types';

interface Props {
    data: ChargeLocationStat[];
    className?: string;
}

export function ChargeLocationHeatmap({ data, className = '' }: Props) {
    // Transform data to HeatmapPoints
    const heatmapData: HeatmapPoint[] = data.map(stat => ({
        latitude: stat.latitude,
        longitude: stat.longitude,
        count: stat.count,
        value: stat.totalEnergy, // Use energy as weight
        label: stat.location
    }));

    // Filter invalid coordinates
    const validData = heatmapData.filter(p => p.latitude && p.longitude);

    if (validData.length === 0) {
        return null; // Or empty state
    }

    return (
        <UniversalMap
            heatmapData={validData}
            className={className}
        />
    );
}
