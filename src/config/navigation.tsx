/**
 * Navigation Configuration - Central source of truth
 * 
 * Phase 13: Unified navigation for desktop + mobile with custom matchers
 * for handling active state with query parameters and redirects.
 */

import React from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type NavId =
    | 'dashboard'
    | 'live'
    | 'sessions'
    | 'calendar'
    | 'templates'
    | 'exercises'
    | 'athletes'
    | 'analytics'
    | 'settings'
    | 'lab';

export interface NavItemConfig {
    id: NavId;
    label: string;
    icon: React.ReactNode;
    to: string;
    /** Custom matcher to determine active state based on current location */
    matcher: (pathname: string, search: URLSearchParams) => boolean;
    /** Optional: roles that can see this item (future use) */
    roles?: Array<'coach' | 'athlete' | 'admin'>;
}

export interface NavGroupConfig {
    title: string;
    items: NavItemConfig[];
}

// =============================================================================
// ICONS (inline SVG to avoid dependencies)
// =============================================================================

const iconClass = "w-4 h-4";

export const NavIcons = {
    Dashboard: () => (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
    ),
    Sessions: () => (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6h2m14 0h2M3 18h2m14 0h2M7 6v12M17 6v12M7 8h10M7 16h10" />
        </svg>
    ),
    Calendar: () => (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    Templates: () => (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    Exercises: () => (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
    ),
    Athletes: () => (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
    ),
    Analytics: () => (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    Settings: () => (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    Lab: () => (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
    ),
    Play: () => (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

// =============================================================================
// NAVIGATION GROUPS CONFIGURATION
// =============================================================================

export const NAV_GROUPS: NavGroupConfig[] = [
    {
        title: 'Día a día',
        items: [
            {
                id: 'dashboard',
                label: 'Dashboard',
                icon: <NavIcons.Dashboard />,
                to: '/',
                matcher: (pathname) => pathname === '/',
            },
            // NOTE: Live Session is injected dynamically by useNavigation hook
        ],
    },
    {
        title: 'Planificación',
        items: [
            {
                id: 'sessions',
                label: 'Sesiones',
                icon: <NavIcons.Sessions />,
                to: '/planning?tab=sessions',
                // Active for sessions tab, including with sessionId and mode params
                matcher: (pathname, search) =>
                    pathname === '/planning' && search.get('tab') === 'sessions',
            },
            {
                id: 'calendar',
                label: 'Calendario',
                icon: <NavIcons.Calendar />,
                to: '/planning?tab=calendar',
                matcher: (pathname, search) =>
                    pathname === '/planning' && search.get('tab') === 'calendar',
            },
            {
                id: 'templates',
                label: 'Plantillas',
                icon: <NavIcons.Templates />,
                to: '/planning?tab=templates',
                matcher: (pathname, search) =>
                    pathname === '/planning' && search.get('tab') === 'templates',
            },
            {
                id: 'exercises',
                label: 'Ejercicios',
                icon: <NavIcons.Exercises />,
                to: '/planning?tab=exercises',
                matcher: (pathname, search) =>
                    pathname === '/planning' && search.get('tab') === 'exercises',
            },
        ],
    },
    {
        title: 'Gestión',
        items: [
            {
                id: 'athletes',
                label: 'Atletas',
                icon: <NavIcons.Athletes />,
                to: '/athletes',
                matcher: (pathname) =>
                    pathname === '/athletes' || pathname.startsWith('/athletes/'),
            },
        ],
    },
    {
        title: 'Análisis',
        items: [
            {
                id: 'analytics',
                label: 'Analytics',
                icon: <NavIcons.Analytics />,
                to: '/analytics',
                matcher: (pathname) => pathname === '/analytics',
            },
        ],
    },
    {
        title: 'Sistema',
        items: [
            {
                id: 'settings',
                label: 'Settings',
                icon: <NavIcons.Settings />,
                to: '/settings',
                // Active when on settings without tab or with general tab
                matcher: (pathname, search) => {
                    if (pathname !== '/settings') return false;
                    const tab = search.get('tab');
                    return !tab || tab === 'general' || tab === '';
                },
            },
            {
                id: 'lab',
                label: 'Dev Lab',
                icon: <NavIcons.Lab />,
                to: '/settings?tab=advanced',
                matcher: (pathname, search) =>
                    pathname === '/settings' && search.get('tab') === 'advanced',
            },
        ],
    },
];

// =============================================================================
// LIVE SESSION ITEM FACTORY (used by useNavigation hook)
// =============================================================================

export function createLiveSessionItem(sessionId: string): NavItemConfig {
    return {
        id: 'live',
        label: 'Live Session',
        icon: <NavIcons.Play />,
        to: `/sessions/live/${sessionId}`,
        matcher: (pathname) => pathname.startsWith('/sessions/live/'),
    };
}
