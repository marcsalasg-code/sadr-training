/**
 * useReturnPath - Contextual Back Navigation Hook
 * 
 * Phase 28: Manages return context for predictable "Back" navigation.
 * Priority order:
 * 1. returnPath in URL search params
 * 2. location.state.from
 * 3. Fallback based on context
 */

import { useCallback, useMemo } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';

interface UseReturnPathOptions {
    /** Default fallback path if no context found */
    fallback?: string;
    /** Current athlete ID context (for athlete-scoped fallback) */
    athleteId?: string;
}

interface UseReturnPathResult {
    /** Resolved return path */
    returnPath: string;
    /** Navigate to return path */
    goBack: () => void;
    /** Encode return path for navigation */
    encodeReturnPath: (targetPath: string) => string;
}

export function useReturnPath(options: UseReturnPathOptions = {}): UseReturnPathResult {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const { fallback = '/', athleteId } = options;

    // Resolve return path with priority order
    const returnPath = useMemo(() => {
        // Priority 1: URL search param
        const urlReturnPath = searchParams.get('returnPath');
        if (urlReturnPath) {
            return decodeURIComponent(urlReturnPath);
        }

        // Priority 2: Location state
        const stateFrom = (location.state as { from?: string } | null)?.from;
        if (stateFrom) {
            return stateFrom;
        }

        // Priority 3: Contextual fallback
        if (athleteId) {
            return `/athletes/${athleteId}`;
        }

        // Priority 4: Default fallback
        return fallback;
    }, [searchParams, location.state, athleteId, fallback]);

    // Navigate to return path
    const goBack = useCallback(() => {
        // Prevent return path loops by checking if current path equals return path
        if (location.pathname === returnPath) {
            navigate(fallback, { replace: true });
        } else {
            navigate(returnPath, { replace: true });
        }
    }, [navigate, returnPath, location.pathname, fallback]);

    // Encode return path for navigation URLs
    const encodeReturnPath = useCallback((targetPath: string): string => {
        const currentFullPath = location.pathname + location.search;
        const separator = targetPath.includes('?') ? '&' : '?';
        return `${targetPath}${separator}returnPath=${encodeURIComponent(currentFullPath)}`;
    }, [location.pathname, location.search]);

    return {
        returnPath,
        goBack,
        encodeReturnPath,
    };
}
