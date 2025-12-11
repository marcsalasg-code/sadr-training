/**
 * LiveSessionStats - Stats bar with sets, volume, exercises, and rest timer
 */

import { AuraGrid, AuraCard } from '../ui/aura';
import { formatTime } from '../../hooks';

interface RestTimer {
    seconds: number;
    isRunning: boolean;
    isFinished: boolean;
    start: () => void;
    pause: () => void;
    setDuration: (seconds: number) => void;
}

interface LiveStats {
    completedSets: number;
    totalSets: number;
    progressPercent: number;
    totalVolume: number;
}

interface LiveSessionStatsProps {
    stats: LiveStats;
    exerciseCount: number;
    restTimer: RestTimer;
}

export function LiveSessionStats({
    stats,
    exerciseCount,
    restTimer,
}: LiveSessionStatsProps) {
    return (
        <AuraGrid cols={4} gap="md">
            {/* Sets Progress */}
            <AuraCard className="relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Sets</span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-mono text-white">{stats.completedSets}</span>
                        <span className="text-sm text-gray-500">/ {stats.totalSets}</span>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#222]">
                    <div
                        className="h-full bg-[var(--color-accent-gold)] transition-all"
                        style={{ width: `${stats.progressPercent}%` }}
                    />
                </div>
            </AuraCard>

            {/* Volume */}
            <AuraCard>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Volume</span>
                <div className="mt-1">
                    <span className="text-2xl font-mono text-white">
                        {stats.totalVolume >= 1000
                            ? `${(stats.totalVolume / 1000).toFixed(1)}k`
                            : stats.totalVolume}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">kg</span>
                </div>
            </AuraCard>

            {/* Exercises */}
            <AuraCard>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">Exercises</span>
                <div className="mt-1">
                    <span className="text-2xl font-mono text-white">{exerciseCount}</span>
                </div>
            </AuraCard>

            {/* Rest Timer */}
            <AuraCard
                className={`transition-all ${restTimer.isRunning
                    ? 'border-[var(--color-accent-gold)] shadow-[0_0_20px_rgba(212,194,154,0.15)]'
                    : ''
                    } ${restTimer.isFinished ? '!border-green-500 !bg-green-500/5' : ''}`}
            >
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                    {restTimer.isFinished ? 'Ready!' : restTimer.isRunning ? 'Rest' : 'Timer'}
                </span>
                <div className="flex items-center justify-center gap-3 mt-1">
                    <button
                        onClick={() => restTimer.setDuration(Math.max(0, restTimer.seconds - 15))}
                        className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] flex items-center justify-center text-lg font-bold transition-colors"
                        title="-15s"
                    >
                        −
                    </button>
                    <button
                        onClick={() => restTimer.isRunning ? restTimer.pause() : restTimer.start()}
                        className={`text-2xl font-mono cursor-pointer hover:opacity-80 transition-opacity ${restTimer.isFinished
                            ? 'text-green-400'
                            : restTimer.isRunning
                                ? 'text-[var(--color-accent-gold)]'
                                : 'text-gray-500'
                            }`}
                        title="Click to start/pause"
                    >
                        {formatTime(restTimer.seconds)}
                    </button>
                    <button
                        onClick={() => restTimer.setDuration(restTimer.seconds + 15)}
                        className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] flex items-center justify-center text-lg font-bold transition-colors"
                        title="+15s"
                    >
                        +
                    </button>
                </div>
            </AuraCard>
        </AuraGrid>
    );
}
