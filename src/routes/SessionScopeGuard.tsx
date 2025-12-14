/**
 * SessionScopeGuard - Protects session routes by ownership
 * 
 * Phase 15B: Ensures athletes can only access their own sessions.
 * - Coach can access any session
 * - Athlete can only access sessions where athleteId matches
 */

import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useTrainingStore } from '../store/store';
import { AuraEmptyState } from '../components/ui/aura';

export function SessionScopeGuard() {
    const { id } = useParams<{ id: string }>();
    const currentUser = useTrainingStore((s) => s.currentUser);
    const sessions = useTrainingStore((s) => s.sessions);

    // Find the session
    const session = sessions.find(s => s.id === id);

    // Session not found
    if (!session) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-8">
                <AuraEmptyState
                    icon="⚠️"
                    title="Sesión no encontrada"
                    description="Esta sesión no existe o ha sido eliminada."
                    action={{
                        label: "Volver al inicio",
                        onClick: () => window.history.back(),
                    }}
                />
            </div>
        );
    }

    // Coach can access any session
    if (currentUser?.role === 'coach') {
        return <Outlet />;
    }

    // Athlete can only access their own sessions
    if (currentUser?.role === 'athlete') {
        if (session.athleteId !== currentUser.athleteId) {
            // Not their session -> redirect to athlete home
            return <Navigate to="/me" replace />;
        }
    }

    // Authorized -> render child routes
    return <Outlet />;
}

export default SessionScopeGuard;
