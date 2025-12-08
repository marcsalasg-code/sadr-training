/**
 * useAITest - Hook de prueba para verificar el flujo completo de IA
 * Solo para uso en InternalLab
 */

import { useState, useCallback } from 'react';
import { AIEngine } from '../AIEngine';
import type { GeneratedTemplate } from '../types';

interface TestResult {
    success: boolean;
    data?: unknown;
    error?: string;
    duration?: number;
    provider?: string;
}

interface UseAITestResult {
    runTest: () => Promise<void>;
    isRunning: boolean;
    result: TestResult | null;
    clearResult: () => void;
}

export function useAITest(): UseAITestResult {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<TestResult | null>(null);

    const runTest = useCallback(async () => {
        setIsRunning(true);
        setResult(null);

        const startTime = Date.now();

        try {
            // Hacer una petición de generación simple al AIEngine
            const response = await AIEngine.complete<GeneratedTemplate>({
                type: 'generation',
                prompt: 'Genera una rutina de prueba simple para verificar que el sistema funciona',
                options: {
                    temperature: 0.7,
                    maxTokens: 500,
                },
            });

            const duration = Date.now() - startTime;
            const status = AIEngine.getStatus();

            if (response.success) {
                setResult({
                    success: true,
                    data: response.data,
                    duration,
                    provider: status.provider,
                });
            } else {
                setResult({
                    success: false,
                    error: response.error || 'Error desconocido',
                    duration,
                    provider: status.provider,
                });
            }
        } catch (err) {
            const duration = Date.now() - startTime;
            setResult({
                success: false,
                error: err instanceof Error ? err.message : 'Error inesperado',
                duration,
            });
        } finally {
            setIsRunning(false);
        }
    }, []);

    const clearResult = useCallback(() => {
        setResult(null);
    }, []);

    return {
        runTest,
        isRunning,
        result,
        clearResult,
    };
}
