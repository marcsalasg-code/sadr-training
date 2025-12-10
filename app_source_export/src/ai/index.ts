// AI Module Exports
export { AIEngine, type ProviderType } from './AIEngine';
export { useAIStore, useAISettings, useAILogs, useAIEnabled } from './aiStore';
export { MockProvider, RemoteProvider } from './providers';
export {
    useTemplateGenerator,
    useLoadPrediction,
    useAITest,
    useExerciseSuggestions,
    useSessionGenerator,
    createDefaultBlocks,
    DEFAULT_BLOCKS,
} from './hooks';

// Utils
export { mapCatalogForPrompt, mapGeneratedToSession, groupByBlock } from './utils';

// Prompts
export { getSystemPrompt, buildUserPrompt, SYSTEM_PROMPTS, PROMPT_TEMPLATES } from './prompts';

// Engines (FASE 3)
export * from './engines';

// Performance Engine (Sprint 5)
export * from './performance';

// Validation
export {
    validateAIResponse,
    validateGeneration,
    validatePrediction,
    validateSuggestion,
    validateAnalysis,
    getValidationErrors,
    GenerationResponseSchema,
    PredictionResponseSchema,
    SuggestionResponseSchema,
    AnalysisResponseSchema,
    type GenerationResponse,
    type PredictionResponse,
    type SuggestionResponse,
    type AnalysisResponse,
} from './validation';

export type {
    IAIProvider,
    AIRequest,
    AIResponse,
    GeneratedTemplate,
    LoadPrediction,
    AILogEntry,
    ExerciseSuggestion,
    SessionGenerationConfig,
    CatalogExercise,
    GeneratedSession,
    SessionGenerationResponse,
} from './types';

