/**
 * CloudLoginView - Supabase Auth for Coach
 * 
 * Phase 22A: Simple email/password login for cloud sync.
 * This is separate from the PIN-based athlete/coach role selection.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AuraButton } from '../../components/ui/aura';

export function CloudLoginView() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
            } else {
                // Success - redirect to login (PIN selection)
                navigate('/login', { replace: true });
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async () => {
        setError('');
        setIsLoading(true);

        try {
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
            } else {
                setError('');
                alert('Cuenta creada. Revisa tu email para confirmar.');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSupabaseConfigured()) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
                <div className="w-full max-w-sm text-center">
                    <div className="text-6xl mb-4">☁️</div>
                    <h1 className="text-xl font-bold text-white mb-2">Cloud no configurado</h1>
                    <p className="text-gray-400 text-sm mb-6">
                        Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY a tu archivo .env
                    </p>
                    <AuraButton variant="ghost" onClick={() => navigate('/login')}>
                        Continuar sin cloud
                    </AuraButton>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#1A1A1A] rounded-xl border border-[#333] flex items-center justify-center">
                        <span className="text-3xl">☁️</span>
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-tight">SADR Cloud</h1>
                    <p className="text-xs text-gray-500 font-mono tracking-widest">SYNC ACCOUNT</p>
                    <p className="text-xs text-gray-400 mt-3 px-2">
                        Sincroniza datos entre dispositivos. Si no lo necesitas, continúa sin nube.
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-xs text-gray-400 uppercase tracking-wider">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="coach@gym.com"
                            autoFocus
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-accent-gold)] transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs text-gray-400 uppercase tracking-wider">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--color-accent-gold)] transition-colors"
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
                        disabled={!email || !password || isLoading}
                    >
                        {isLoading ? 'Conectando...' : 'Iniciar sesión'}
                    </AuraButton>

                    <AuraButton
                        type="button"
                        variant="ghost"
                        size="md"
                        className="w-full"
                        onClick={handleSignUp}
                        disabled={!email || !password || isLoading}
                    >
                        Crear cuenta nueva
                    </AuraButton>
                </form>

                {/* Skip option - visible button */}
                <div className="mt-4">
                    <AuraButton
                        variant="ghost"
                        size="md"
                        className="w-full"
                        onClick={() => {
                            localStorage.setItem('sadr_cloud_opt_out', 'true');
                            navigate('/login');
                        }}
                    >
                        ← Continuar sin nube
                    </AuraButton>
                </div>
            </div>
        </div>
    );
}

export default CloudLoginView;
