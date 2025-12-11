/**
 * ExerciseTabs - Horizontal tabs for switching between exercises
 */

interface Exercise {
    id: string;
    exerciseId: string;
    sets: Array<{ isCompleted: boolean }>;
}

interface ExerciseInfo {
    name?: string;
}

interface ExerciseTabsProps {
    exercises: Exercise[];
    activeExerciseIndex: number;
    onSelectExercise: (index: number) => void;
    onAddExercise: () => void;
    getExerciseInfo: (exerciseId: string) => ExerciseInfo | undefined;
}

export function ExerciseTabs({
    exercises,
    activeExerciseIndex,
    onSelectExercise,
    onAddExercise,
    getExerciseInfo,
}: ExerciseTabsProps) {
    if (exercises.length === 0) return null;

    return (
        <div className="flex gap-2 overflow-x-auto pb-2">
            {exercises.map((ex, index) => {
                const exInfo = getExerciseInfo(ex.exerciseId);
                const completedSets = ex.sets.filter(s => s.isCompleted).length;
                const isComplete = completedSets === ex.sets.length;
                const isActive = activeExerciseIndex === index;

                return (
                    <button
                        key={ex.id}
                        onClick={() => onSelectExercise(index)}
                        className={`
                            flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${isActive
                                ? 'bg-[var(--color-accent-gold)] text-black'
                                : isComplete
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                                    : 'bg-[#1A1A1A] text-gray-400 border border-[#2A2A2A] hover:border-[#333]'
                            }
                        `}
                    >
                        {exInfo?.name || `Exercise ${index + 1}`}
                        <span className="ml-2 text-xs opacity-70">{completedSets}/{ex.sets.length}</span>
                    </button>
                );
            })}
            <button
                onClick={onAddExercise}
                className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium bg-transparent text-gray-600 border border-dashed border-[#333] hover:border-[var(--color-accent-gold)] hover:text-[var(--color-accent-gold)] transition-colors"
            >
                + Add
            </button>
        </div>
    );
}
