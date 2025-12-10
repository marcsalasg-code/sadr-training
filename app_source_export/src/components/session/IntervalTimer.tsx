/**
 * IntervalTimer.tsx - Timer especializado para entrenamientos de intervalos
 * Soporta: EMOM, AMRAP, Tabata, Custom
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AuraPanel, AuraButton, AuraBadge } from '../ui/aura';
import type { IntervalType, IntervalConfig } from '../../types/types';

interface IntervalTimerProps {
    config: IntervalConfig;
    onComplete: (result: IntervalResult) => void;
    onCancel: () => void;
    exerciseName?: string;
}

export interface IntervalResult {
    type: IntervalType;
    totalSeconds: number;
    roundsCompleted: number;
    extraReps?: number;
    completedAt: string;
}

type TimerState = 'idle' | 'running' | 'paused' | 'work' | 'rest' | 'completed';

export function IntervalTimer({ config, onComplete, onCancel, exerciseName }: IntervalTimerProps) {
    const [state, setState] = useState<TimerState>('idle');
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [currentRound, setCurrentRound] = useState(1);
    const [isWorkPhase, setIsWorkPhase] = useState(true);
    const [repsLogged, setRepsLogged] = useState(0);
    const [startTime] = useState<Date | null>(null);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Calculate total time based on config
    const getTotalSeconds = useCallback(() => {
        switch (config.type) {
            case 'emom':
                return (config.totalMinutes || 10) * 60;
            case 'amrap':
                return (config.totalMinutes || 10) * 60;
            case 'tabata':
                // 8 rounds of 20s work + 10s rest = 4 minutes
                return (config.roundsTarget || 8) * (config.workSeconds + (config.restSeconds || 10));
            default:
                return (config.totalMinutes || 10) * 60;
        }
    }, [config]);

    // Play beep sound
    const playBeep = useCallback((type: 'work' | 'rest' | 'complete') => {
        // Use Web Audio API for beeps
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = type === 'work' ? 880 : type === 'rest' ? 440 : 660;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();
            oscillator.stop(audioContext.currentTime + (type === 'complete' ? 0.5 : 0.15));
        } catch (e) {
            // Audio not supported
        }
    }, []);

    // Start timer
    const start = useCallback(() => {
        setState('running');
        setTimeRemaining(getTotalSeconds());
        setCurrentRound(1);
        setIsWorkPhase(true);
        playBeep('work');
    }, [getTotalSeconds, playBeep]);

    // Pause/Resume
    const togglePause = useCallback(() => {
        setState(prev => prev === 'paused' ? 'running' : 'paused');
    }, []);

    // Complete with result
    const completeTimer = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        const result: IntervalResult = {
            type: config.type,
            totalSeconds: getTotalSeconds() - timeRemaining,
            roundsCompleted: currentRound - 1,
            extraReps: repsLogged,
            completedAt: new Date().toISOString(),
        };

        setState('completed');
        playBeep('complete');
        onComplete(result);
    }, [config.type, getTotalSeconds, timeRemaining, currentRound, repsLogged, onComplete, playBeep]);

    // Timer tick logic
    useEffect(() => {
        if (state !== 'running') {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        intervalRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    completeTimer();
                    return 0;
                }

                // EMOM: every 60 seconds = new round
                if (config.type === 'emom') {
                    const totalElapsed = getTotalSeconds() - prev + 1;
                    const newRound = Math.floor(totalElapsed / 60) + 1;
                    if (newRound > currentRound) {
                        setCurrentRound(newRound);
                        playBeep('work');
                    }
                }

                // Tabata: work/rest phases
                if (config.type === 'tabata') {
                    const workDuration = config.workSeconds;
                    const restDuration = config.restSeconds || 10;
                    const cycleDuration = workDuration + restDuration;
                    const totalElapsed = getTotalSeconds() - prev + 1;
                    const withinCycle = totalElapsed % cycleDuration;

                    const shouldBeWork = withinCycle < workDuration;
                    if (shouldBeWork !== isWorkPhase) {
                        setIsWorkPhase(shouldBeWork);
                        playBeep(shouldBeWork ? 'work' : 'rest');
                        if (shouldBeWork) {
                            setCurrentRound(prev => prev + 1);
                        }
                    }
                }

                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [state, config, getTotalSeconds, currentRound, isWorkPhase, playBeep, completeTimer]);

    // Format time display
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Get phase label
    const getPhaseLabel = (): string => {
        switch (config.type) {
            case 'emom':
                return `Round ${currentRound}`;
            case 'amrap':
                return 'AMRAP';
            case 'tabata':
                return isWorkPhase ? 'WORK' : 'REST';
            default:
                return 'Interval';
        }
    };

    // Get phase color
    const getPhaseColor = (): string => {
        if (config.type === 'tabata') {
            return isWorkPhase
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
        }
        return 'bg-[var(--color-accent-gold)]/20 border-[var(--color-accent-gold)] text-[var(--color-accent-gold)]';
    };

    return (
        <AuraPanel className="text-center">
            <div className="space-y-6 py-4">
                {/* Timer Type Badge */}
                <div className="flex justify-center gap-2">
                    <AuraBadge variant="gold" size="sm">
                        {config.type.toUpperCase()}
                    </AuraBadge>
                    {exerciseName && (
                        <AuraBadge variant="default" size="sm">
                            {exerciseName}
                        </AuraBadge>
                    )}
                </div>

                {/* Phase Indicator */}
                {state !== 'idle' && (
                    <div className={`inline-block px-6 py-2 rounded-full border ${getPhaseColor()}`}>
                        <span className="text-lg font-bold">{getPhaseLabel()}</span>
                    </div>
                )}

                {/* Main Timer Display */}
                <div className="text-6xl font-mono font-bold text-white">
                    {state === 'idle'
                        ? formatTime(getTotalSeconds())
                        : formatTime(timeRemaining)
                    }
                </div>

                {/* Round Counter (for non-AMRAP) */}
                {config.type !== 'amrap' && state !== 'idle' && (
                    <p className="text-sm text-gray-400">
                        Round {currentRound} / {config.type === 'emom'
                            ? config.totalMinutes
                            : config.roundsTarget || 8}
                    </p>
                )}

                {/* AMRAP Reps Logger */}
                {config.type === 'amrap' && state !== 'idle' && (
                    <div className="flex items-center justify-center gap-4">
                        <AuraButton
                            variant="ghost"
                            onClick={() => setRepsLogged(prev => Math.max(0, prev - 1))}
                        >
                            −
                        </AuraButton>
                        <div className="text-center">
                            <p className="text-3xl font-mono text-[var(--color-accent-gold)]">
                                {repsLogged}
                            </p>
                            <p className="text-xs text-gray-500">Reps</p>
                        </div>
                        <AuraButton
                            variant="ghost"
                            onClick={() => setRepsLogged(prev => prev + 1)}
                        >
                            +
                        </AuraButton>
                    </div>
                )}

                {/* Controls */}
                <div className="flex justify-center gap-3">
                    {state === 'idle' && (
                        <>
                            <AuraButton variant="gold" onClick={start}>
                                ▶ Start
                            </AuraButton>
                            <AuraButton variant="ghost" onClick={onCancel}>
                                Cancel
                            </AuraButton>
                        </>
                    )}

                    {(state === 'running' || state === 'paused') && (
                        <>
                            <AuraButton
                                variant={state === 'paused' ? 'gold' : 'secondary'}
                                onClick={togglePause}
                            >
                                {state === 'paused' ? '▶ Resume' : '⏸ Pause'}
                            </AuraButton>
                            <AuraButton variant="ghost" onClick={completeTimer}>
                                ✓ Finish
                            </AuraButton>
                        </>
                    )}
                </div>

                {/* Config Summary */}
                {state === 'idle' && (
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>Work: {config.workSeconds}s</p>
                        {config.restSeconds && <p>Rest: {config.restSeconds}s</p>}
                        <p>Duration: {config.totalMinutes || Math.round((config.roundsTarget || 8) * ((config.workSeconds + (config.restSeconds || 0)) / 60))} min</p>
                    </div>
                )}
            </div>
        </AuraPanel>
    );
}

export default IntervalTimer;
