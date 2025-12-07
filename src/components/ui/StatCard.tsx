/**
 * StatCard - Tarjeta de estadística
 */

import { Card } from './Card';

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: string;
    trend?: {
        value: number;
        isPositive: boolean;
    };
}

export function StatCard({ label, value, icon, trend }: StatCardProps) {
    return (
        <Card hover className="flex items-start justify-between">
            <div>
                <p className="stat-label">{label}</p>
                <p className="stat-value mt-2">{value}</p>
                {trend && (
                    <p className={`text-xs mt-2 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </p>
                )}
            </div>
            {icon && (
                <span className="text-2xl opacity-60">{icon}</span>
            )}
        </Card>
    );
}
