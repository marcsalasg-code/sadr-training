/**
 * Sidebar - Navegación principal de la aplicación
 */

import { Link, useLocation } from 'react-router-dom';

interface NavItem {
    path: string;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/athletes', label: 'Atletas', icon: '👥' },
    { path: '/planning', label: 'Planificación', icon: '📋' },
    { path: '/analytics', label: 'Análisis', icon: '📈' },
    { path: '/settings', label: 'Ajustes', icon: '⚙️' },
];

export function Sidebar() {
    const location = useLocation();

    // Check if a nav item should be active
    const isItemActive = (path: string): boolean => {
        const pathname = location.pathname;

        // Exact match for root
        if (path === '/') {
            return pathname === '/';
        }

        // Planning section includes /sessions routes (live session, etc.)
        if (path === '/planning') {
            return pathname.startsWith('/planning') || pathname.startsWith('/sessions');
        }

        // For other paths, check if pathname starts with the path
        return pathname.startsWith(path);
    };

    return (
        <aside className="w-64 h-screen bg-[#0D0D0D] border-r border-[#2A2A2A] flex flex-col fixed left-0 top-0 z-50">
            {/* Logo */}
            <div className="p-6 border-b border-[#2A2A2A]">
                <h1 className="text-xl font-bold text-[#C5A572]">
                    Training Monitor
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                    Sistema de entrenamiento
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const active = isItemActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                                transition-all duration-200
                                ${active
                                    ? 'bg-[#C5A572] text-black'
                                    : 'text-gray-400 hover:bg-[#1A1A1A] hover:text-white'
                                }
                            `}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[#2A2A2A]">
                <div className="text-xs text-gray-500">
                    v1.0.0 • Dark Theme
                </div>
            </div>
        </aside>
    );
}
