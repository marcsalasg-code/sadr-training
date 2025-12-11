/**
 * AthletePhysicalData - Physical data section with height, weight, BMI, level
 */

import { AuraPanel, AuraBadge, AuraDivider } from '../ui/aura';
import { calculateBMI, getBMICategory, experienceLevelLabels } from '../../utils';
import type { ExperienceLevel } from '../../types/types';

interface PersonalRecord {
    weight: number;
    reps: number;
    estimated1RM: number;
}

interface AthletePhysicalDataProps {
    heightCm?: number;
    currentWeightKg?: number;
    experienceLevel?: ExperienceLevel;
    personalRecords?: Record<string, PersonalRecord>;
}

export function AthletePhysicalData({
    heightCm,
    currentWeightKg,
    experienceLevel,
    personalRecords,
}: AthletePhysicalDataProps) {
    const bmi = heightCm && currentWeightKg ? calculateBMI(currentWeightKg, heightCm) : null;

    return (
        <AuraPanel header={<span className="text-white text-sm font-medium">📏 Datos Físicos</span>}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-[#141414]">
                    <p className="text-2xl font-mono text-[var(--color-accent-gold)]">
                        {heightCm ? `${heightCm}` : '-'}
                    </p>
                    <p className="text-xs text-gray-500">Altura (cm)</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#141414]">
                    <p className="text-2xl font-mono text-[var(--color-accent-gold)]">
                        {currentWeightKg ? `${currentWeightKg}` : '-'}
                    </p>
                    <p className="text-xs text-gray-500">Peso (kg)</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#141414]">
                    <p className="text-2xl font-mono text-white">
                        {bmi || '-'}
                    </p>
                    <p className="text-xs text-gray-500">
                        IMC {bmi && (
                            <span className="text-[var(--color-accent-gold)]">
                                ({getBMICategory(bmi)})
                            </span>
                        )}
                    </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#141414]">
                    <p className="text-lg font-medium text-white">
                        {experienceLevel
                            ? experienceLevelLabels[experienceLevel]?.split(' ')[0] || experienceLevel
                            : '-'}
                    </p>
                    <p className="text-xs text-gray-500">Nivel</p>
                </div>
            </div>

            {/* Personal Records Preview */}
            {personalRecords && Object.keys(personalRecords).length > 0 && (
                <>
                    <AuraDivider className="my-4" />
                    <div>
                        <p className="text-xs text-gray-500 mb-2">🏆 Records Personales (Top 3)</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(personalRecords)
                                .sort((a, b) => b[1].estimated1RM - a[1].estimated1RM)
                                .slice(0, 3)
                                .map(([exId, pr]) => (
                                    <AuraBadge key={exId} variant="gold" size="sm">
                                        {pr.weight}kg × {pr.reps} = {pr.estimated1RM}kg 1RM
                                    </AuraBadge>
                                ))}
                        </div>
                    </div>
                </>
            )}
        </AuraPanel>
    );
}
