'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/components/SidebarContext';

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = React.useState<any>(null);
    const [expiringCount, setExpiringCount] = React.useState(0);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const profileTriggerRef = useRef<HTMLButtonElement>(null);

    const {
        isExpanded,

        isMobileOverlayOpen,
        toggle,
        closeMobileOverlay,
    } = useSidebar();

    const toggleRef = useRef<HTMLButtonElement>(null);
    const sidebarRef = useRef<HTMLElement>(null);
    const firstFocusableRef = useRef<HTMLAnchorElement>(null);

    React.useEffect(() => {
        Promise.all([
            fetch('/api/auth/me').then(res => res.ok ? res.json() : null),
            fetch('/api/checklists').then(res => res.ok ? res.json() : []),
        ]).then(([userData, checklists]) => {
            if (userData?.user) setUser(userData.user);
            const days = userData?.user?.checklistAlertDays ?? 3;
            if (days > 0) {
                const now = new Date();
                const list = Array.isArray(checklists) ? checklists : [];
                setExpiringCount(list.filter((c: any) => {
                    if (!c.endDate) return false;
                    const d = Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / 86400000);
                    return d >= 0 && d <= days;
                }).length);
            }
        }).catch(err => console.error('Failed to fetch sidebar data', err));
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    // Click outside to close profile menu
    useEffect(() => {
        if (!profileMenuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(e.target as Node) &&
                profileTriggerRef.current &&
                !profileTriggerRef.current.contains(e.target as Node)
            ) {
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [profileMenuOpen]);

    // Close profile menu on Escape
    useEffect(() => {
        if (!profileMenuOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setProfileMenuOpen(false);
                profileTriggerRef.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [profileMenuOpen]);

    const getLinkClass = (path: string) => {
        const isActive = pathname === path;
        const baseClass = "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group whitespace-nowrap";
        return isActive ? `${baseClass} active` : `${baseClass} text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]`;
    };

    // Focus trap for mobile overlay
    useEffect(() => {
        if (!isMobileOverlayOpen) return;

        const sidebar = sidebarRef.current;
        if (!sidebar) return;

        const focusableElements = sidebar.querySelectorAll<HTMLElement>(
            'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        // Move focus to first element when overlay opens
        firstElement?.focus();

        sidebar.addEventListener('keydown', handleKeyDown);
        return () => sidebar.removeEventListener('keydown', handleKeyDown);
    }, [isMobileOverlayOpen]);

    // Return focus to toggle when mobile overlay closes
    useEffect(() => {
        if (!isMobileOverlayOpen) {
            toggleRef.current?.focus();
        }
    }, [isMobileOverlayOpen]);

    const handleBackdropClick = useCallback(() => {
        closeMobileOverlay();
    }, [closeMobileOverlay]);

    const handleToggleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    };

    const sidebarWidthClass = isExpanded ? 'w-64' : 'w-20';

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isMobileOverlayOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={handleBackdropClick}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                id="main-sidebar"
                className={`
                    border-r border-primary/10 flex flex-col py-8 fixed h-full z-40
                    ${isMobileOverlayOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${sidebarWidthClass}
                    transition-transform duration-300 ease-in-out
                    motion-reduce:transition-none
                `}
                style={{ background: 'var(--color-sidebar-bg)' }}
            >
                {/* Decorative top line (visible in retrofuturista, invisible in classic) */}
                <div style={{ height: '1px', background: 'var(--deco-sidebar-top-line)', opacity: 0.6 }} />

                {/* Toggle Button */}
                <button
                    ref={toggleRef}
                    onClick={toggle}
                    onKeyDown={handleToggleKeyDown}
                    aria-expanded={isExpanded || isMobileOverlayOpen}
                    aria-controls="main-sidebar"
                    aria-label={isExpanded || isMobileOverlayOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    className="absolute -right-2.5 top-9 w-5 h-5 rounded-full flex items-center justify-center shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-slate-400/50 hidden lg:flex backdrop-blur-sm transition-all"
                    style={{ background: 'var(--color-bg-surface-hover)', color: 'var(--color-text-secondary)' }}
                >
                    <span className="material-symbols-outlined text-xs">
                        {isExpanded ? 'chevron_left' : 'chevron_right'}
                    </span>
                </button>

                {/* Logo */}
                <div className="px-6 mb-10 flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg shrink-0"
                        style={{ background: 'var(--deco-logo-bg)', boxShadow: 'var(--deco-logo-shadow)' }}
                    >
                        <span className="material-symbols-outlined">grid_view</span>
                    </div>
                    <span className={[
                        'text-xl font-bold tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300',
                        isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0',
                    ].join(' ')} style={{ color: 'var(--color-text-primary)' }}>
                        DuvSos
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 w-full px-4 space-y-1 overflow-y-auto">
                    <Link href="/dashboard" className={getLinkClass('/dashboard')}
                        ref={pathname === '/dashboard' ? firstFocusableRef : undefined}>
                        <span className="material-symbols-outlined shrink-0">dashboard</span>
                        <span className={`
                            font-medium overflow-hidden whitespace-nowrap transition-all duration-300
                            ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                        `}>Dashboard</span>
                    </Link>
                    <Link href="/todos" className={getLinkClass('/todos')}>
                        <span className="material-symbols-outlined shrink-0">check_circle</span>
                        <span className={`
                            font-medium overflow-hidden whitespace-nowrap transition-all duration-300
                            ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                        `}>To-Do List</span>
                    </Link>
                    <Link href="/checklists" className={getLinkClass('/checklists')}>
                        <span className="material-symbols-outlined shrink-0">fact_check</span>
                        <span className={`
                            font-medium overflow-hidden whitespace-nowrap transition-all duration-300
                            ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                        `}>Checklists</span>
                        {expiringCount > 0 && isExpanded && (
                            <span className="ml-auto bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {expiringCount}
                            </span>
                        )}
                    </Link>
                    <Link href="/reminders" className={getLinkClass('/reminders')}>
                        <span className="material-symbols-outlined shrink-0">notifications_active</span>
                        <span className={`
                            font-medium overflow-hidden whitespace-nowrap transition-all duration-300
                            ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                        `}>Reminders</span>
                    </Link>
                    <Link href="/habits" className={getLinkClass('/habits')}>
                        <span className="material-symbols-outlined shrink-0">routine</span>
                        <span className={`
                            font-medium overflow-hidden whitespace-nowrap transition-all duration-300
                            ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                        `}>Habits</span>
                    </Link>

                </nav>

                {/* User Profile */}
                <div className="px-4 w-full mt-auto relative">
                    <button
                        ref={profileTriggerRef}
                        onClick={() => setProfileMenuOpen((open) => !open)}
                        aria-expanded={profileMenuOpen}
                        aria-haspopup="menu"
                        aria-controls="profile-menu"
                        className="flex items-center gap-3 w-full p-2 rounded-xl transition-colors text-left sidebar-profile-btn"
                    >
                        <img
                            src={user?.image || "https://ui-avatars.com/api/?name=" + (user?.name || "User") + "&background=random"}
                            alt="User Profile"
                            className="w-10 h-10 rounded-full border-2 border-primary/20 object-cover shrink-0"
                        />
                        <div className={[
                            'overflow-hidden transition-all duration-300 flex-1 min-w-0',
                            isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0',
                        ].join(' ')}>
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>{user?.name || "User"}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{user?.tagline || "Productivity Enthusiast"}</p>
                        </div>
                        <span className={[
                            'material-symbols-outlined transition-transform duration-200 shrink-0',
                            profileMenuOpen ? 'rotate-180' : '',
                            isExpanded ? 'opacity-100' : 'opacity-0 w-0',
                        ].join(' ')} style={{ color: 'var(--color-text-muted)' }}>
                            expand_more
                        </span>
                    </button>

                    {/* Profile Dropdown */}
                    {profileMenuOpen && (
                        <div
                            ref={profileMenuRef}
                            id="profile-menu"
                            role="menu"
                            className="absolute left-4 right-4 bottom-full mb-2 rounded-xl shadow-lg border py-1 z-50"
                            style={{ background: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
                        >
                            <Link
                                href="/settings"
                                onClick={() => setProfileMenuOpen(false)}
                                role="menuitem"
                                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors sidebar-dropdown-item"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                <span className="material-symbols-outlined text-lg">settings</span>
                                Settings
                            </Link>
                            <Link
                                href="/support"
                                onClick={() => setProfileMenuOpen(false)}
                                role="menuitem"
                                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors sidebar-dropdown-item"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                <span className="material-symbols-outlined text-lg">help_outline</span>
                                Support
                            </Link>
                            <div className="border-t my-1" style={{ borderColor: 'var(--color-border)' }} />
                            <button
                                onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                                role="menuitem"
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                            >
                                <span className="material-symbols-outlined text-lg">logout</span>
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile Header Toggle */}
            <button
                onClick={toggle}
                onKeyDown={handleToggleKeyDown}
                aria-expanded={isMobileOverlayOpen}
                aria-controls="main-sidebar"
                aria-label={isMobileOverlayOpen ? 'Close sidebar' : 'Open sidebar'}
                className="fixed top-4 left-4 z-50 p-2 border border-primary/10 rounded-lg shadow-sm lg:hidden"
                style={{ background: 'var(--color-bg-surface)' }}
            >
                <span className="material-symbols-outlined">{isMobileOverlayOpen ? 'close' : 'menu'}</span>
            </button>
        </>
    );
}
