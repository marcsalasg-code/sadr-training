/**
 * FatiguePrompt - Non-blocking prompt for pre-session fatigue rating
 * 
 * Asks "How does the athlete feel today?" with 1-10 scale
 * Can be skipped without consequences
 * NO recommendations, just data collection
 */

import React, { useState } from 'react';
import { AuraButton, AuraCard } from '../ui/aura';

export interface FatiguePromptProps {
    initialValue?: number;
    onConfirm: (value: number) => void;
    onSkip: () => void;
}

export const FatiguePrompt: React.FC<FatiguePromptProps> = ({
    initialValue = 5,
    onConfirm,
    onSkip,
}) => {
    const [value, setValue] = useState(initialValue);

    return (
        <AuraCard className="mb-4 border border-[var(--color-accent-gold)]/30 bg-[var(--color-accent-gold)]/5">
            <div className="flex items-start gap-4">
                <div className="text-2xl">🏃</div>
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-white mb-1">
                        ¿Cómo llega hoy el atleta?
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                        Fatiga previa (1 = muy descansado, 10 = muy fatigado)
                    </p>

                    {/* Slider */}
                    <div className="mb-3">
                        <input
                            type="range"
                            min={1}
                            max={10}
                            value={value}
                            onChange={(e) => setValue(Number(e.target.value))}
                            className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:w-4
                                [&::-webkit-slider-thumb]:h-4
                                [&::-webkit-slider-thumb]:rounded-full
                                [&::-webkit-slider-thumb]:bg-[var(--color-accent-gold)]
                                [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                            <span>1</span>
                            <span className="text-lg font-bold text-[var(--color-accent-gold)]">
                                {value}
                            </span>
                            <span>10</span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                        <AuraButton
                            variant="gold"
                            size="sm"
                            onClick={() => onConfirm(value)}
                        >
                            Guardar
                        </AuraButton>
                        <AuraButton
                            variant="ghost"
                            size="sm"
                            onClick={onSkip}
                        >
                            Omitir
                        </AuraButton>
                    </div>
                </div>
            </div>
        </AuraCard>
    );
};

export default FatiguePrompt;
