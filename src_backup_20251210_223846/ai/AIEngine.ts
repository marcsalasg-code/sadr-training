/**
 * AI Engine - Singleton principal del sistema de IA
 * Gestiona providers, cache y logging
 */

import { MockProvider } from './providers/MockProvider';
import { RemoteProvider, type RemoteProviderConfig } from './providers/RemoteProvider';
import type { IAIProvider, AIRequest, AIResponse, AILogEntry } from './types';

export type ProviderType = 'mock' | 'remote' | 'none';

class AIEngineClass {
    private static instance: AIEngineClass;
    private mockProvider: MockProvider;
    private remoteProvider: RemoteProvider;
    private currentProvider: ProviderType = 'mock';
    private isEnabled: boolean = true;
    private logs: AILogEntry[] = [];
    private onLogCallback?: (log: AILogEntry) => void;

    private constructor() {
        this.mockProvider = new MockProvider();
        this.remoteProvider = new RemoteProvider();
    }

    static getInstance(): AIEngineClass {
        if (!AIEngineClass.instance) {
            AIEngineClass.instance = new AIEngineClass();
        }
        return AIEngineClass.instance;
    }

    async initialize(): Promise<void> {
        await this.mockProvider.initialize();
        await this.remoteProvider.initialize();
        console.log('[AIEngine] Initialized');
    }

    // Configuración
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        this.log('request', 'system', 'analysis', true, `AI ${enabled ? 'enabled' : 'disabled'}`);
    }

    setProvider(provider: ProviderType): void {
        this.currentProvider = provider;
        this.log('request', 'system', 'analysis', true, `Provider changed to: ${provider}`);
    }

    configureRemote(config: RemoteProviderConfig): void {
        this.remoteProvider.setConfig(config);
    }

    getStatus(): { enabled: boolean; provider: ProviderType; remoteAvailable: boolean } {
        return {
            enabled: this.isEnabled,
            provider: this.currentProvider,
            remoteAvailable: this.remoteProvider.isAvailable,
        };
    }

    // Operaciones principales
    async complete<T>(request: AIRequest): Promise<AIResponse<T>> {
        if (!this.isEnabled || this.currentProvider === 'none') {
            return {
                success: false,
                error: 'AI is disabled',
            };
        }

        const startTime = Date.now();
        const provider = this.getActiveProvider();

        if (!provider) {
            return {
                success: false,
                error: 'No provider available',
            };
        }

        try {
            const response = await provider.complete<T>(request);
            const duration = Date.now() - startTime;

            // Check for quota errors and fallback to mock
            if (!response.success && this.isQuotaError(response.error)) {
                this.log('fallback', provider.name, request.type, true,
                    'Quota exceeded, falling back to mock provider');
                return this.mockProvider.complete<T>(request);
            }

            this.log(
                'response',
                provider.name,
                request.type,
                response.success,
                response.success ? `Completed in ${duration}ms` : response.error,
                duration,
                response.usage?.promptTokens
            );

            return response;
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            // Check for quota errors and fallback to mock
            if (this.isQuotaError(errorMessage)) {
                this.log('fallback', provider.name, request.type, true,
                    'Quota exceeded, falling back to mock provider');
                return this.mockProvider.complete<T>(request);
            }

            this.log('error', provider.name, request.type, false, errorMessage, duration);

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Check if error is related to API quota/rate limiting
     */
    private isQuotaError(error?: string): boolean {
        if (!error) return false;
        const quotaPatterns = ['429', 'quota', 'RESOURCE_EXHAUSTED', 'rate limit'];
        return quotaPatterns.some(pattern =>
            error.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    async testConnection(): Promise<boolean> {
        const provider = this.getActiveProvider();
        if (!provider) return false;
        return provider.testConnection();
    }

    // Logs
    onLog(callback: (log: AILogEntry) => void): void {
        this.onLogCallback = callback;
    }

    getLogs(): AILogEntry[] {
        return [...this.logs];
    }

    clearLogs(): void {
        this.logs = [];
    }

    private log(
        type: AILogEntry['type'],
        provider: string,
        requestType: AIRequest['type'],
        success: boolean,
        details?: string,
        duration?: number,
        tokenUsage?: number
    ): void {
        const entry: AILogEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type,
            provider,
            requestType,
            success,
            details,
            duration,
            tokenUsage,
        };

        // Mantener últimos 100 logs
        this.logs = [...this.logs.slice(-99), entry];

        if (this.onLogCallback) {
            this.onLogCallback(entry);
        }
    }

    private getActiveProvider(): IAIProvider | null {
        switch (this.currentProvider) {
            case 'mock':
                return this.mockProvider;
            case 'remote':
                return this.remoteProvider.isAvailable ? this.remoteProvider : this.mockProvider;
            default:
                return null;
        }
    }
}

// Exportar singleton
export const AIEngine = AIEngineClass.getInstance();
