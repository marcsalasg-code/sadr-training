/**
 * useLiveSessionModals - Modal state management for live sessions
 * 
 * Extracted from useLiveSession to reduce hook complexity.
 * Manages visibility state for all session-related modals.
 */

import { useState } from 'react';

export interface UseLiveSessionModalsReturn {
    // Add Exercise Modal
    showAddExerciseModal: boolean;
    setShowAddExerciseModal: (show: boolean) => void;

    // Finish Session Modal
    showFinishModal: boolean;
    setShowFinishModal: (show: boolean) => void;

    // Remove Exercise Modal
    showRemoveExerciseModal: boolean;
    setShowRemoveExerciseModal: (show: boolean) => void;

    // Cancel Session Modal
    showCancelModal: boolean;
    setShowCancelModal: (show: boolean) => void;

    // Exit Confirmation Modal
    showExitModal: boolean;
    setShowExitModal: (show: boolean) => void;
}

/**
 * Hook to manage all modal states for live session view
 */
export function useLiveSessionModals(): UseLiveSessionModalsReturn {
    const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showRemoveExerciseModal, setShowRemoveExerciseModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    return {
        showAddExerciseModal,
        setShowAddExerciseModal,
        showFinishModal,
        setShowFinishModal,
        showRemoveExerciseModal,
        setShowRemoveExerciseModal,
        showCancelModal,
        setShowCancelModal,
        showExitModal,
        setShowExitModal,
    };
}

export default useLiveSessionModals;
