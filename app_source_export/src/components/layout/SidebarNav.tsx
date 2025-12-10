/**
 * SidebarNav - Navegación lateral estilo Aura
 * Diseño premium con agrupaciones y estética metálica
 */

import { NavLink } from 'react-router-dom';
import { useSessions } from '../../store/store';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

// Iconos SVG inline para evitar dependencias
const Icons = {
    Dashboard: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
    ),
    Calendar: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Dumbbell: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6h2m14 0h2M3 18h2m14 0h2M7 6v12M17 6v12M7 8h10M7 16h10" />
        </svg>
    ),
    Users: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    FileText: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    Library: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
    ),
    BarChart: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    Flask: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
    ),
    Settings: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Layers: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
    ),
    Play: () => (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

const navGroups: NavGroup[] = [
    {
        title: 'Día a día',
        items: [
            { path: '/', label: 'Dashboard', icon: <Icons.Dashboard /> },
            { path: '/sessions', label: 'Session Builder', icon: <Icons.Dumbbell /> },
            // Live Session added dynamically when active
        ],
    },
    {
        title: 'Planificación',
        items: [
            { path: '/calendar', label: 'Calendar', icon: <Icons.Calendar /> },
            { path: '/templates', label: 'Templates', icon: <Icons.FileText /> },
        ],
    },
    {
        title: 'Análisis',
        items: [
            { path: '/analytics', label: 'Analytics', icon: <Icons.BarChart /> },
            { path: '/athletes', label: 'Athletes', icon: <Icons.Users /> },
            { path: '/exercises', label: 'Exercise Library', icon: <Icons.Library /> },
        ],
    },
    {
        title: 'Herramientas',
        items: [
            { path: '/lab', label: 'Dev Lab', icon: <Icons.Flask /> },
        ],
    },
];

export function SidebarNav() {
    const sessions = useSessions();
    const activeSession = sessions.find(s => s.status === 'in_progress');

    return (
        <aside className="w-64 bg-[#111111] border-r border-[var(--color-border-default)] flex flex-col relative z-40">
            {/* Logo */}
            <div className="p-6 pb-2">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 bg-[#1A1A1A] rounded border border-[#333] flex items-center justify-center">
                        <Icons.Layers />
                    </div>
                    <div>
                        <span className="block text-sm font-bold text-white tracking-tight">SADR</span>
                        <span className="block text-[9px] text-gray-500 font-mono tracking-widest">TRAINING OS</span>
                    </div>
                </div>

                {/* Navigation Groups */}
                <nav className="space-y-1">
                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <div className="px-3 py-1 text-[10px] font-mono text-gray-600 uppercase tracking-widest mt-4 mb-2">
                                {group.title}
                            </div>
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === '/'}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 text-sm font-medium rounded-md px-3 py-2 transition-all ${isActive
                                            ? 'text-white bg-[#1A1A1A] border border-[#333]'
                                            : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                                        }`
                                    }
                                >
                                    <span className={`transition-colors`}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </NavLink>
                            ))}
                            {/* Conditional Live Session - only in "Día a día" group */}
                            {group.title === 'Día a día' && activeSession && (
                                <NavLink
                                    to={`/sessions/live/${activeSession.id}`}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 text-sm font-medium rounded-md px-3 py-2 transition-all ${isActive
                                            ? 'text-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10 border border-[var(--color-accent-gold)]/30'
                                            : 'text-[var(--color-accent-gold)] hover:bg-[var(--color-accent-gold)]/10'
                                        }`
                                    }
                                >
                                    <span className="relative">
                                        <Icons.Play />
                                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[var(--color-accent-gold)] rounded-full animate-pulse" />
                                    </span>
                                    Live Session
                                </NavLink>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            {/* Footer - Profile */}
            <div className="mt-auto p-4 border-t border-[var(--color-border-default)]">
                <NavLink
                    to="/settings"
                    className="flex items-center gap-3 px-2 hover:bg-[#1A1A1A] rounded-md py-2 transition-all group"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black border border-gray-600" />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-white">Coach Profile</span>
                        <span className="text-[10px] text-gray-500">Settings</span>
                    </div>
                    <div className="ml-auto">
                        <Icons.Settings />
                    </div>
                </NavLink>
            </div>
        </aside>
    );
}
