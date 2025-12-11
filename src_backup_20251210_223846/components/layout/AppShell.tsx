/**
 * AppShell - Root layout con estética Aura
 * Compone: BrowserTopBar + SidebarNav + ContentArea
 * 
 * UPDATED: Mobile sidebar with controlled state, overlay, and auto-close
 */

import { useState, useEffect } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { BrowserTopBar } from './BrowserTopBar';
import { SidebarNav } from './SidebarNav';
import { ContentArea } from './ContentArea';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    // NEW: Controlled state for mobile menu
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // NEW: Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    // NEW: Lock body scroll when menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const closeMobileMenu = () => setIsMobileMenuOpen(false);
    const openMobileMenu = () => setIsMobileMenuOpen(true);

    return (
        <div className="min-h-screen flex items-center justify-center p-0 lg:p-4 overflow-hidden bg-[var(--color-bg-primary)]">
            {/* Desktop App Shell */}
            <div className="hidden lg:flex flex-col w-full max-w-[1600px] h-[95vh] bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden shadow-[var(--shadow-shell)] border border-[var(--color-border-default)] relative">

                {/* Browser Top Bar */}
                <BrowserTopBar version="v1.0.0-beta" />

                {/* Main Layout */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Navigation */}
                    <SidebarNav />

                    {/* Content Area with Error Boundary */}
                    <ContentArea>
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </ContentArea>
                </div>
            </div>

            {/* Mobile Shell */}
            <div className="lg:hidden w-full min-h-screen bg-[var(--color-bg-primary)] flex flex-col">
                {/* Mobile Header - UPDATED with hamburger button */}
                <header className="h-14 flex items-center justify-between px-4 bg-[var(--color-bg-tertiary)]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[var(--color-border-default)]">
                    {/* Left: Hamburger + Logo */}
                    <div className="flex items-center gap-3">
                        {/* NEW: Hamburger button */}
                        <button
                            onClick={openMobileMenu}
                            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#2A2A2A] transition-colors"
                            aria-label="Open menu"
                        >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#1A1A1A] rounded border border-[#333] flex items-center justify-center">
                                <svg className="w-3 h-3 text-[var(--color-accent-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <span className="text-sm font-bold tracking-tight text-white uppercase">SADR</span>
                        </div>
                    </div>

                    {/* Right: Profile */}
                    <NavLink to="/settings" className="w-8 h-8 rounded-full bg-[#2A2A2A] border border-[#333] flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </NavLink>
                </header>

                {/* NEW: Mobile Sidebar Overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
                        onClick={closeMobileMenu}
                        aria-hidden="true"
                    />
                )}

                {/* NEW: Mobile Sidebar Panel */}
                <div
                    className={`fixed top-0 left-0 h-full w-72 bg-[#111111] z-[70] transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <MobileSidebarContent onClose={closeMobileMenu} />
                </div>

                {/* Mobile Content */}
                <main className="flex-1 overflow-y-auto pb-20">
                    <ErrorBoundary>
                        {children}
                    </ErrorBoundary>
                </main>

                {/* Mobile Bottom Nav */}
                <MobileBottomNav />
            </div>
        </div>
    );
}

// NEW: Mobile Sidebar Content Component
function MobileSidebarContent({ onClose }: { onClose: () => void }) {
    const navGroups = [
        {
            title: 'Main',
            items: [
                { path: '/', label: 'Dashboard', icon: 'dashboard' },
                { path: '/calendar', label: 'Schedule', icon: 'calendar' },
                { path: '/sessions', label: 'Sessions', icon: 'dumbbell' },
            ],
        },
        {
            title: 'Management',
            items: [
                { path: '/athletes', label: 'Athletes', icon: 'users' },
                { path: '/templates', label: 'Templates', icon: 'file' },
                { path: '/analytics', label: 'Analytics', icon: 'chart' },
            ],
        },
        {
            title: 'Tools',
            items: [
                { path: '/exercises', label: 'Library', icon: 'library' },
                { path: '/lab', label: 'Dev Lab', icon: 'flask' },
            ],
        },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Header with close button */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--color-border-default)]">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#1A1A1A] rounded border border-[#333] flex items-center justify-center">
                        <svg className="w-3 h-3 text-[var(--color-accent-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <span className="text-sm font-bold tracking-tight text-white uppercase">SADR</span>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#2A2A2A] transition-colors"
                    aria-label="Close menu"
                >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navGroups.map((group) => (
                    <div key={group.title}>
                        <div className="px-3 py-1 text-[10px] font-mono text-gray-600 uppercase tracking-widest mt-4 mb-2 first:mt-0">
                            {group.title}
                        </div>
                        {group.items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 text-sm font-medium rounded-md px-3 py-3 transition-all ${isActive
                                        ? 'text-white bg-[#1A1A1A] border border-[#333]'
                                        : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
                                    }`
                                }
                            >
                                <MobileNavIcon icon={item.icon} />
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                ))}
            </nav>

            {/* Footer - Settings */}
            <div className="p-4 border-t border-[var(--color-border-default)]">
                <NavLink
                    to="/settings"
                    onClick={onClose}
                    className="flex items-center gap-3 px-2 hover:bg-[#1A1A1A] rounded-md py-3 transition-all"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-black border border-gray-600" />
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-white">Coach Profile</span>
                        <span className="text-[10px] text-gray-500">Settings</span>
                    </div>
                </NavLink>
            </div>
        </div>
    );
}

// NEW: Icon component for mobile nav
function MobileNavIcon({ icon }: { icon: string }) {
    const iconClass = "w-4 h-4";

    switch (icon) {
        case 'dashboard':
            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>;
        case 'calendar':
            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
        case 'dumbbell':
            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6h2m14 0h2M3 18h2m14 0h2M7 6v12M17 6v12M7 8h10M7 16h10" /></svg>;
        case 'users':
            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
        case 'file':
            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
        case 'chart':
            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
        case 'library':
            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>;
        case 'flask':
            return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
        default:
            return null;
    }
}

function MobileBottomNav() {
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 w-full h-16 bg-[var(--color-bg-secondary)]/95 backdrop-blur-xl border-t border-[var(--color-border-default)] flex items-center justify-around px-2 z-50 lg:hidden">
            <NavButton icon="home" label="Home" href="/" isActive={isActive('/')} />
            <NavButton icon="calendar" label="Plan" href="/calendar" isActive={isActive('/calendar')} />
            <NavButton icon="plus" label="" href="/sessions" isCenter />
            <NavButton icon="chart" label="Stats" href="/analytics" isActive={isActive('/analytics')} />
            <NavButton icon="user" label="Profile" href="/settings" isActive={isActive('/settings')} />
        </nav>
    );
}

function NavButton({ icon, label, href, isActive = false, isCenter = false }: {
    icon: string;
    label: string;
    href: string;
    isActive?: boolean;
    isCenter?: boolean;
}) {
    const iconClass = isActive ? 'text-[var(--color-accent-gold)]' : 'text-gray-500';

    if (isCenter) {
        return (
            <NavLink to={href} className="relative -top-5">
                <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[var(--color-accent-gold)] flex items-center justify-center shadow-[0_0_15px_rgba(212,194,154,0.15)] text-[var(--color-accent-gold)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
            </NavLink>
        );
    }

    const icons: Record<string, React.ReactNode> = {
        home: <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>,
        calendar: <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
        chart: <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        user: <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    };

    return (
        <NavLink to={href} className={`flex flex-col items-center gap-1 p-2 ${iconClass}`}>
            {icons[icon]}
            <span className="text-[9px] font-medium">{label}</span>
        </NavLink>
    );
}
