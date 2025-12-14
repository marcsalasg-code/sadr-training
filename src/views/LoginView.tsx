/**
 * LoginView - PIN-based authentication
 * 
 * Phase 15A: Simple login screen with Aura styling.
 * - Coach login with default PIN
 * - Athlete login by matching PIN to athlete.pin
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrainingStore } from '../store/store';
import { AuraButton } from '../components/ui/aura';

export function LoginView() {
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const login = useTrainingStore((s) => s.login);
    const athletes = useTrainingStore((s) => s.athletes);
    const isAuthenticated = useTrainingStore((s) => s.isAuthenticated);
    const currentUser = useTrainingStore((s) => s.currentUser);

    // If already authenticated, redirect
    if (isAuthenticated && currentUser) {
        const destination = currentUser.role === 'coach' ? '/' : '/me';
        navigate(destination, { replace: true });
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Small delay for UX
        await new Promise(r => setTimeout(r, 300));

        const success = login(pin, athletes);

        if (success) {
            const user = useTrainingStore.getState().currentUser;
            const destination = user?.role === 'coach' ? '/' : '/me';
            navigate(destination, { replace: true });
        } else {
            setError('PIN incorrecto');
            setPin('');
        }

        setIsLoading(false);
    };

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setPin(value);
        setError('');
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#1A1A1A] rounded-xl border border-[#333] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[var(--color-accent-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">SADR</h1>
                    <p className="text-xs text-gray-500 font-mono tracking-widest">TRAINING OS</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs text-gray-400 uppercase tracking-wider">
                            PIN de acceso
                        </label>
                        <input
                            type="password"
                            inputMode="numeric"
                            value={pin}
                            onChange={handlePinChange}
                            placeholder="••••"
                            autoFocus
                            className="w-full px-4 py-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white text-center text-2xl tracking-[0.5em] placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-accent-gold)] transition-colors"
                        />
                    </div>

                    {error && (
                        <div className="text-center text-red-400 text-sm py-2 bg-red-900/20 rounded-lg border border-red-800/50">
                            {error}
                        </div>
                    )}

                    <AuraButton
                        type="submit"
                        variant="gold"
                        size="lg"
                        className="w-full"
                        disabled={pin.length < 4 || isLoading}
                    >
                        {isLoading ? 'Verificando...' : 'Entrar'}
                    </AuraButton>
                </form>

                {/* Footer hint */}
                <p className="mt-8 text-center text-xs text-gray-600">
                    Coach PIN: 0000 (default)
                </p>
            </div>
        </div>
    );
}

export default LoginView;
