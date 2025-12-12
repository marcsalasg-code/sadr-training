/**
 * Session Structure Model - Estructura interna de sesiones y plantillas
 * 
 * Este modelo es compartido entre:
 * - SessionTemplate (plantillas)
 * - WorkoutSession (sesiones reales)
 * - Motor de IA (generación de plantillas/sesiones)
 */

// ============================================
// STRUCTURE TYPES
// ============================================

/**
 * Session structure type - tipo de organización del bloque
 */
export type SessionStructureType =
    | 'linear'      // Ejercicios en secuencia simple
    | 'blocks'      // Bloques separados (calentamiento, fuerza, accesorios)
    | 'circuit'     // Circuitos / rondas
    | 'emom'        // Every Minute On the Minute
    | 'amrap'       // As Many Reps/Rounds As Possible
    | 'custom';     // Configuraciones avanzadas

/**
 * Labels for structure types (Spanish)
 */
export const STRUCTURE_TYPE_LABELS: Record<SessionStructureType, string> = {
    linear: 'Lineal',
    blocks: 'Bloques',
    circuit: 'Circuito',
    emom: 'EMOM',
    amrap: 'AMRAP',
    custom: 'Personalizado',
};

// ============================================
// BLOCK CONFIG
// ============================================

/**
 * EMOM parameters
 */
export interface EMOMParams {
    intervalSeconds: number;    // 60 = 1 min
    totalMinutes: number;       // Duración total
    repsPerRound?: number;      // Reps objetivo por ronda
}

/**
 * AMRAP parameters
 */
export interface AMRAPParams {
    durationMinutes: number;    // Tiempo límite
    targetRounds?: number;      // Rondas objetivo
}

/**
 * Circuit parameters
 */
export interface CircuitParams {
    rounds: number;             // Número de rondas
    restBetweenRounds?: number; // Descanso entre rondas (seg)
    restBetweenExercises?: number; // Descanso entre ejercicios (seg)
}

/**
 * Block parameters - union of all possible params
 */
export type BlockParams = EMOMParams | AMRAPParams | CircuitParams | Record<string, unknown>;

/**
 * Session block configuration
 * Representa un bloque dentro de la estructura de sesión
 */
export interface SessionBlockConfig {
    id: string;                         // UUID único
    title: string;                      // "Calentamiento", "Fuerza principal", etc.
    type: SessionStructureType;         // Tipo de bloque
    order: number;                      // Posición en la sesión
    notes?: string;                     // Notas del bloque
    tags?: string[];                    // Tags para filtrado/análisis
    params?: BlockParams;               // Parámetros específicos del tipo
    estimatedDuration?: number;         // Duración estimada (min)
}

// ============================================
// SESSION STRUCTURE
// ============================================

/**
 * Session structure - estructura completa de una sesión
 * Usado tanto en SessionTemplate como WorkoutSession
 */
export interface SessionStructure {
    id: string;                         // UUID de la estructura
    name?: string;                      // Nombre opcional
    blocks: SessionBlockConfig[];       // Lista de bloques
}

// ============================================
// DEFAULTS
// ============================================

/**
 * Default block for new sessions/templates
 */
export const DEFAULT_MAIN_BLOCK: SessionBlockConfig = {
    id: 'main',
    title: 'Principal',
    type: 'linear',
    order: 0,
    notes: '',
    tags: [],
};

/**
 * Default warmup block
 */
export const DEFAULT_WARMUP_BLOCK: SessionBlockConfig = {
    id: 'warmup',
    title: 'Calentamiento',
    type: 'linear',
    order: 0,
    estimatedDuration: 10,
    tags: ['warmup'],
};

/**
 * Default strength block
 */
export const DEFAULT_STRENGTH_BLOCK: SessionBlockConfig = {
    id: 'strength',
    title: 'Fuerza principal',
    type: 'linear',
    order: 1,
    estimatedDuration: 30,
    tags: ['strength', 'compound'],
};

/**
 * Default accessories block
 */
export const DEFAULT_ACCESSORIES_BLOCK: SessionBlockConfig = {
    id: 'accessories',
    title: 'Accesorios',
    type: 'linear',
    order: 2,
    estimatedDuration: 15,
    tags: ['accessories', 'isolation'],
};

/**
 * Default EMOM block
 */
export const DEFAULT_EMOM_BLOCK: SessionBlockConfig = {
    id: 'emom',
    title: 'EMOM',
    type: 'emom',
    order: 3,
    estimatedDuration: 10,
    params: {
        intervalSeconds: 60,
        totalMinutes: 10,
    } as EMOMParams,
    tags: ['conditioning'],
};

/**
 * Default session structure (single main block)
 */
export function createDefaultStructure(sessionId?: string): SessionStructure {
    return {
        id: sessionId ? `structure-${sessionId}` : `structure-${crypto.randomUUID()}`,
        blocks: [{ ...DEFAULT_MAIN_BLOCK, id: crypto.randomUUID() }],
    };
}

/**
 * Create full structured session (warmup + strength + accessories)
 */
export function createFullStructure(): SessionStructure {
    return {
        id: `structure-${crypto.randomUUID()}`,
        blocks: [
            { ...DEFAULT_WARMUP_BLOCK, id: crypto.randomUUID() },
            { ...DEFAULT_STRENGTH_BLOCK, id: crypto.randomUUID() },
            { ...DEFAULT_ACCESSORIES_BLOCK, id: crypto.randomUUID() },
        ],
    };
}

// ============================================
// HELPERS
// ============================================

/**
 * Get block by ID
 */
export function getBlockById(structure: SessionStructure, blockId: string): SessionBlockConfig | undefined {
    return structure.blocks.find(b => b.id === blockId);
}

/**
 * Get blocks sorted by order
 */
export function getSortedBlocks(structure: SessionStructure): SessionBlockConfig[] {
    return [...structure.blocks].sort((a, b) => a.order - b.order);
}

/**
 * Add block to structure
 */
export function addBlock(structure: SessionStructure, block: Omit<SessionBlockConfig, 'id' | 'order'>): SessionStructure {
    const newOrder = structure.blocks.length;
    const newBlock: SessionBlockConfig = {
        ...block,
        id: crypto.randomUUID(),
        order: newOrder,
    };
    return {
        ...structure,
        blocks: [...structure.blocks, newBlock],
    };
}

/**
 * Remove block from structure
 */
export function removeBlock(structure: SessionStructure, blockId: string): SessionStructure {
    const filtered = structure.blocks.filter(b => b.id !== blockId);
    // Reorder remaining blocks
    const reordered = filtered.map((b, idx) => ({ ...b, order: idx }));
    return {
        ...structure,
        blocks: reordered,
    };
}

/**
 * Update block in structure
 */
export function updateBlock(
    structure: SessionStructure,
    blockId: string,
    updates: Partial<SessionBlockConfig>
): SessionStructure {
    return {
        ...structure,
        blocks: structure.blocks.map(b =>
            b.id === blockId ? { ...b, ...updates } : b
        ),
    };
}

/**
 * Reorder blocks
 */
export function reorderBlocks(structure: SessionStructure, fromIndex: number, toIndex: number): SessionStructure {
    const sorted = getSortedBlocks(structure);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);

    return {
        ...structure,
        blocks: sorted.map((b, idx) => ({ ...b, order: idx })),
    };
}

/**
 * Calculate total estimated duration from structure blocks
 */
export function calculateStructureDuration(structure: SessionStructure): number {
    return structure.blocks.reduce((sum, b) => sum + (b.estimatedDuration || 0), 0);
}
