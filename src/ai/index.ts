// AI Module Exports
export { AIEngine, type ProviderType } from './AIEngine';
export { useAIStore, useAISettings, useAILogs, useAIEnabled } from './aiStore';
export { MockProvider, RemoteProvider } from './providers';
export { useTemplateGenerator, useLoadPrediction, useAITest, useExerciseSuggestions } from './hooks';

export type {
    IAIProvider,
    AIRequest,
    AIResponse,
    GeneratedTemplate,
    LoadPrediction,
    AILogEntry,
    ExerciseSuggestion,
} from './types';

