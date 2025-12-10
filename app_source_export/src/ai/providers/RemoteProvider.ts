/**
 * Remote AI Provider
 * Provider genérico para APIs remotas (OpenAI, Anthropic, Google AI, etc.)
 * 
 * Features:
 * - Centralized prompts from ai/prompts
 * - 30s timeout with AbortController
 * - Retry with exponential backoff (3 attempts)
 * - JSON response parsing
 */

import type { IAIProvider, AIRequest, AIResponse } from '../types';
import { getSystemPrompt, buildUserPrompt } from '../prompts';

export interface RemoteProviderConfig {
    apiUrl: string;
    apiKey: string;
    model?: string;
    headers?: Record<string, string>;
}

/** Default retry configuration */
const RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelayMs: 1000,  // 1s, 2s, 4s
    maxDelayMs: 8000,
};

export class RemoteProvider implements IAIProvider {
    readonly name = 'remote';
    private config: RemoteProviderConfig | null = null;

    get isAvailable(): boolean {
        return this.config !== null && !!this.config.apiKey;
    }

    async initialize(config?: RemoteProviderConfig): Promise<void> {
        if (config) {
            this.config = config;
        }
        console.log('[RemoteProvider] Initialized', this.isAvailable ? 'with config' : 'without config');
    }

    setConfig(config: RemoteProviderConfig): void {
        this.config = config;
    }

    async complete<T>(request: AIRequest): Promise<AIResponse<T>> {
        if (!this.config || !this.isAvailable) {
            return {
                success: false,
                error: 'RemoteProvider not configured. Please set API key.',
            };
        }

        // Retry loop with exponential backoff
        let lastError: string = 'Unknown error';

        for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
            try {
                const result = await this.attemptRequest<T>(request);

                if (result.success) {
                    return result;
                }

                // Don't retry on non-retryable errors
                if (this.isNonRetryableError(result.error || '')) {
                    return result;
                }

                lastError = result.error || 'Unknown error';

            } catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown error';

                // Don't retry on non-retryable errors
                if (this.isNonRetryableError(lastError)) {
                    return {
                        success: false,
                        error: lastError,
                    };
                }
            }

            // Wait before retry (exponential backoff)
            if (attempt < RETRY_CONFIG.maxAttempts) {
                const delay = Math.min(
                    RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt - 1),
                    RETRY_CONFIG.maxDelayMs
                );
                console.log(`[RemoteProvider] Retry ${attempt}/${RETRY_CONFIG.maxAttempts} in ${delay}ms`);
                await this.sleep(delay);
            }
        }

        return {
            success: false,
            error: `Failed after ${RETRY_CONFIG.maxAttempts} attempts: ${lastError}`,
        };
    }

    /**
     * Single request attempt with timeout
     */
    private async attemptRequest<T>(request: AIRequest): Promise<AIResponse<T>> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
            // Use centralized prompts
            const systemPrompt = getSystemPrompt(request.type);
            const userPrompt = buildUserPrompt(request.prompt, request.context);

            const response = await fetch(this.config!.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config!.apiKey}`,
                    ...this.config!.headers,
                },
                body: JSON.stringify({
                    model: this.config!.model || 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                    temperature: request.options?.temperature ?? 0.7,
                    max_tokens: request.options?.maxTokens ?? 2000,
                    response_format: { type: 'json_object' },
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }

            const result = await response.json();
            const content = result.choices?.[0]?.message?.content;

            if (!content) {
                throw new Error('Empty response from API');
            }

            const parsedData = JSON.parse(content) as T;

            return {
                success: true,
                data: parsedData,
                usage: {
                    promptTokens: result.usage?.prompt_tokens ?? 0,
                    completionTokens: result.usage?.completion_tokens ?? 0,
                },
                cached: false,
            };
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === 'AbortError') {
                return {
                    success: false,
                    error: 'Request timed out. Please try again.',
                };
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async testConnection(): Promise<boolean> {
        if (!this.config || !this.isAvailable) {
            return false;
        }

        try {
            const response = await this.complete({
                type: 'analysis',
                prompt: 'Respond only with: {"status": "ok"}',
            });
            return response.success;
        } catch {
            return false;
        }
    }

    /**
     * Check if error is non-retryable (auth, bad request, quota, etc.)
     */
    private isNonRetryableError(error: string): boolean {
        const nonRetryablePatterns = [
            '401',  // Unauthorized
            '403',  // Forbidden
            '400',  // Bad Request
            '429',  // Rate limit / Quota exceeded
            '529',  // Server overloaded
            'RESOURCE_EXHAUSTED',
            'quota',
            'Invalid API key',
            'not configured',
        ];
        return nonRetryablePatterns.some(pattern =>
            error.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    /**
     * Sleep utility for retry delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
