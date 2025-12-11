/**
 * AthleteStatsGrid - Main stats metrics grid
 */

import { AuraGrid, AuraMetric } from '../ui/aura';

interface AthleteStatsGridProps {
    totalSessions: number;
    totalVolume: number;
    totalSets: number;
    avgDuration: number;
}

export function AthleteStatsGrid({
    totalSessions,
    totalVolume,
    totalSets,
    avgDuration,
}: AthleteStatsGridProps) {
    return (
        <AuraGrid cols={4} gap="md">
            <AuraMetric
                label="Sesiones Completadas"
                value={totalSessions}
                icon={<span className="text-xl">🏋️</span>}
            />
            <AuraMetric
                label="Volumen Total"
                value={`${(totalVolume / 1000).toFixed(1)}K`}
                icon={<span className="text-xl">📈</span>}
            />
            <AuraMetric
                label="Series Totales"
                value={totalSets}
                icon={<span className="text-xl">🔢</span>}
            />
            <AuraMetric
                label="Duración Media"
                value={`${avgDuration} min`}
                icon={<span className="text-xl">⏱️</span>}
            />
        </AuraGrid>
    );
}
