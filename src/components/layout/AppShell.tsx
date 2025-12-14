/**
 * AppShell - Root layout with Aura aesthetic
 * Composes: BrowserTopBar + SidebarNav + ContentArea
 * 
 * Phase 13: Mobile sidebar now uses shared SidebarNavContent component.
 * Off-canvas, closed by default, with overlay + auto-close on navigation.
 */

import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { BrowserTopBar } from './BrowserTopBar';
import { SidebarNav } from './SidebarNav';
import { SidebarNavContent } from './SidebarNavContent';
import { ContentArea } from './ContentArea';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    // Controlled state for mobile menu
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname, location.search]);

    // Lock body scroll when menu is open
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
        <div className="min-h-screen flex items-center justify-center p-0 md:p-4 overflow-hidden bg-[var(--color-bg-primary)]">
            {/* Desktop App Shell */}
            <div className="hidden md:flex flex-col w-full max-w-[1600px] h-[95vh] bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden shadow-[var(--shadow-shell)] border border-[var(--color-border-default)] relative">

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
            <div className="md:hidden w-full min-h-[100dvh] bg-[var(--color-bg-primary)] flex flex-col">
                {/* Mobile Header */}
                <header className="h-14 flex items-center justify-between px-4 bg-[var(--color-bg-tertiary)]/90 backdrop-blur-md sticky top-0 z-50 border-b border-[var(--color-border-default)]">
                    {/* Left: Hamburger + Logo */}
                    <div className="flex items-center gap-3">
                        {/* Hamburger button */}
                        <button
                            onClick={openMobileMenu}
                            className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#2A2A2A] transition-colors"
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
                    <Link to="/settings" className="w-10 h-10 rounded-full bg-[#2A2A2A] border border-[#333] flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </Link>
                </header>

                {/* Mobile Sidebar Overlay */}
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
                        onClick={closeMobileMenu}
                        aria-hidden="true"
                    />
                )}

                {/* Mobile Sidebar Panel (off-canvas, closed by default) */}
                <div
                    className={`fixed top-0 left-0 h-[100dvh] w-[80vw] max-w-80 bg-[#111111] z-[70] transform transition-transform duration-300 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    {/* Close button header */}
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
                            onClick={closeMobileMenu}
                            className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-[#2A2A2A] transition-colors"
                            aria-label="Close menu"
                        >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Shared Navigation Content (with onNavigate callback to close menu) */}
                    <div className="h-[calc(100%-3.5rem)] overflow-hidden">
                        <SidebarNavContent onNavigate={closeMobileMenu} />
                    </div>
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

// =============================================================================
// MOBILE BOTTOM NAV (kept for quick access to key routes)
// =============================================================================

function MobileBottomNav() {
    const location = useLocation();

    const isActive = (path: string, exactMatch = false) => {
        if (exactMatch) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    // Check for planning tab active states
    const isPlanningTab = (tab: string) => {
        return location.pathname === '/planning' &&
            new URLSearchParams(location.search).get('tab') === tab;
    };

    return (
        <nav className="fixed bottom-0 w-full h-16 bg-[var(--color-bg-secondary)]/95 backdrop-blur-xl border-t border-[var(--color-border-default)] flex items-center justify-around px-2 z-50 md:hidden">
            <NavButton icon="home" label="Home" href="/" isActive={isActive('/', true)} />
            <NavButton icon="calendar" label="Plan" href="/planning?tab=calendar" isActive={isPlanningTab('calendar')} />
            <NavButton icon="plus" label="" href="/planning?tab=sessions" isCenter />
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
            <Link to={href} className="relative -top-5">
                <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border border-[var(--color-accent-gold)] flex items-center justify-center shadow-[0_0_15px_rgba(212,194,154,0.15)] text-[var(--color-accent-gold)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
            </Link>
        );
    }

    const icons: Record<string, React.ReactNode> = {
        home: <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>,
        calendar: <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
        chart: <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        user: <svg className={`w-5 h-5 ${iconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    };

    return (
        <Link to={href} className={`flex flex-col items-center gap-1 p-2 ${iconClass}`}>
            {icons[icon]}
            <span className="text-[9px] font-medium">{label}</span>
        </Link>
    );
}
