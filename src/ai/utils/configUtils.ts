/**
 * AI Configuration Utilities
 * Helper functions for detecting provider modes and validation
 */

export type AIProviderMode = 'openai-compatible' | 'native-gemini' | 'unknown';

/**
 * Detects the AI provider mode based on the API URL
 * Logic shared between RemoteProvider and AIEnginePanel
 */
export function detectProviderMode(url: string): AIProviderMode {
    if (!url) return 'unknown';

    // Check for OpenAI compatibility path
    if (url.includes('/openai/')) {
        return 'openai-compatible';
    }

    // Check for Native Gemini patterns
    if (url.includes('generativelanguage.googleapis.com') || url.includes('gemini')) {
        return 'native-gemini';
    }

    return 'unknown';
}
