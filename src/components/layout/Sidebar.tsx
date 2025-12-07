/**
 * Sidebar - Navegación principal de la aplicación
 */

import { NavLink } from 'react-router-dom';

interface NavItem {
    path: string;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/athletes', label: 'Atletas', icon: '👥' },
    { path: '/sessions', label: 'Sesiones', icon: '🏋️' },
    { path: '/templates', label: 'Plantillas', icon: '📋' },
    { path: '/calendar', label: 'Calendario', icon: '📅' },
    { path: '/analytics', label: 'Análisis', icon: '📈' },
    { path: '/lab', label: 'Lab', icon: '🔬' },
    { path: '/settings', label: 'Ajustes', icon: '⚙️' },
];

export function Sidebar() {
    return (
        <aside className="w-64 h-screen bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-default)] flex flex-col fixed left-0 top-0">
            {/* Logo */}
            <div className="p-6 border-b border-[var(--color-border-default)]">
                <h1 className="text-xl font-bold text-[var(--color-accent-beige)]">
                    Training Monitor
                </h1>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Sistema de entrenamiento
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-accent-gold)] border border-[var(--color-border-accent)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                            }`
                        }
                    >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--color-border-default)]">
                <div className="text-xs text-[var(--color-text-muted)]">
                    v1.0.0 • Dark Theme
                </div>
            </div>
        </aside>
    );
}
