/**
 * useRestTimer - Hook para cronómetro de descanso
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseRestTimerReturn {
    seconds: number;
    isRunning: boolean;
    isFinished: boolean;
    start: (duration?: number) => void;
    pause: () => void;
    resume: () => void;
    reset: () => void;
    setDuration: (duration: number) => void;
}

export function useRestTimer(defaultDuration: number = 90): UseRestTimerReturn {
    const [seconds, setSeconds] = useState(defaultDuration);
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const intervalRef = useRef<number | null>(null);
    const targetDurationRef = useRef(defaultDuration);

    // Limpiar intervalo al desmontar
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    // Timer tick
    useEffect(() => {
        if (isRunning && seconds > 0) {
            intervalRef.current = window.setInterval(() => {
                setSeconds((prev) => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        setIsFinished(true);
                        // Vibrar si está disponible
                        if (navigator.vibrate) {
                            navigator.vibrate([200, 100, 200]);
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, seconds]);

    const start = useCallback((duration?: number) => {
        const targetDuration = duration ?? targetDurationRef.current;
        targetDurationRef.current = targetDuration;
        setSeconds(targetDuration);
        setIsFinished(false);
        setIsRunning(true);
    }, []);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const resume = useCallback(() => {
        if (seconds > 0) {
            setIsRunning(true);
        }
    }, [seconds]);

    const reset = useCallback(() => {
        setSeconds(targetDurationRef.current);
        setIsRunning(false);
        setIsFinished(false);
    }, []);

    const setDuration = useCallback((duration: number) => {
        targetDurationRef.current = duration;
        if (!isRunning) {
            setSeconds(duration);
        }
    }, [isRunning]);

    return {
        seconds,
        isRunning,
        isFinished,
        start,
        pause,
        resume,
        reset,
        setDuration,
    };
}

// Formatear segundos a mm:ss
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
