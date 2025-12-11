/**
 * AthleteChartsRow - Row with weekly volume and monthly sessions charts
 */

import { AuraGrid, AuraPanel } from '../ui/aura';
import { WeeklyVolumeChart, MonthlySessionsChart } from './index';

interface AthleteChartsRowProps {
    weeklyVolumeData: Array<{ label: string; volume: number }>;
    monthlySessionsData: Array<{ label: string; count: number }>;
}

export function AthleteChartsRow({
    weeklyVolumeData,
    monthlySessionsData,
}: AthleteChartsRowProps) {
    return (
        <AuraGrid cols={2} gap="lg">
            {/* Weekly Volume Chart */}
            <AuraPanel header={<span className="text-white text-sm font-medium">📊 Volumen Semanal (8 semanas)</span>}>
                <WeeklyVolumeChart data={weeklyVolumeData} />
            </AuraPanel>

            {/* Monthly Sessions Chart */}
            <AuraPanel header={<span className="text-white text-sm font-medium">📅 Sesiones por Mes (6 meses)</span>}>
                <MonthlySessionsChart data={monthlySessionsData} />
            </AuraPanel>
        </AuraGrid>
    );
}
