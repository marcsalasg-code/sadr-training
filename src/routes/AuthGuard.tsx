/**
 * AuthGuard - Route protection component
 * 
 * Phase 15B: Protects routes based on authentication and role.
 * - Redirects to /login if not authenticated
 * - Redirects to /me (athlete home) if role not allowed
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTrainingStore } from '../store/store';
import type { AuthRole } from '../store/authSlice';

interface AuthGuardProps {
    /** If specified, only these roles can access. If omitted, any authenticated user can access. */
    allowedRoles?: AuthRole[];
}

export function AuthGuard({ allowedRoles }: AuthGuardProps) {
    const location = useLocation();
    const isAuthenticated = useTrainingStore((s) => s.isAuthenticated);
    const currentUser = useTrainingStore((s) => s.currentUser);

    // Not authenticated -> go to login
    if (!isAuthenticated || !currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check role permissions if specified
    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        // Athlete trying to access coach-only route -> go to athlete home
        const fallback = currentUser.role === 'athlete' ? '/me' : '/';
        return <Navigate to={fallback} replace />;
    }

    // Authorized -> render child routes
    return <Outlet />;
}

export default AuthGuard;
