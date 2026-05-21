'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSidebar } from '@/components/SidebarContext';
import { useAppTranslation } from '@/components/LanguageProvider';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useSidebarData } from '@/hooks/useSidebarData';
import SidebarItem from '@/components/SidebarItem';
import SidebarGroup from '@/components/SidebarGroup';

export default function Sidebar() {
    const { t } = useAppTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const { isExpanded, isMobileOverlayOpen, toggle, closeMobileOverlay } = useSidebar();
    const { user, expiringCount } = useSidebarData();

    const [planExpanded, setPlanExpanded] = useLocalStorageState('sidebar-plan-expanded', false);
    const [studyExpanded, setStudyExpanded] = useLocalStorageState('sidebar-study-expanded', false);
    const [showStudySection, setShowStudySection] = useState(true);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    const profileMenuRef = useRef<HTMLDivElement>(null);
    const profileTriggerRef = useRef<HTMLButtonElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);
    const sidebarRef = useRef<HTMLElement>(null);
    const firstFocusableRef = useRef<HTMLAnchorElement>(null);

    // Listen for study settings changes (cross-tab + same-tab via storage)
    useEffect(() => {
        const readStudyVisibility = () => {
            try {
                const raw = localStorage.getItem('aure-study-settings');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    setShowStudySection(Boolean(parsed.showStudySection));
                }
            } catch { /* ignore */ }
        };
        readStudyVisibility();
        window.addEventListener('storage', readStudyVisibility);
        return () => window.removeEventListener('storage', readStudyVisibility);
    }, []);

    // Close profile dropdown on click outside
    useClickOutside(profileMenuRef, () => setProfileMenuOpen(false), profileMenuOpen);

    // Close profile dropdown on Escape
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
        const base = 'flex items-center gap-4 px-4 py-3 rounded-[8px] transition-all group whitespace-nowrap';
        return isActive ? `${base} active` : `${base} text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]`;
    };

    // Focus trap for mobile overlay
    useEffect(() => {
        if (!isMobileOverlayOpen) return;
        const sidebar = sidebarRef.current;
        if (!sidebar) return;

        const focusable = sidebar.querySelectorAll<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };

        first?.focus();
        sidebar.addEventListener('keydown', handleKeyDown);
        return () => sidebar.removeEventListener('keydown', handleKeyDown);
    }, [isMobileOverlayOpen]);

    // Return focus to toggle when mobile overlay closes
    useEffect(() => {
        if (!isMobileOverlayOpen) toggleRef.current?.focus();
    }, [isMobileOverlayOpen]);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const handleToggleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
        }
    };

    const handleBackdropClick = useCallback(() => closeMobileOverlay(), [closeMobileOverlay]);

    const sidebarWidthClass = isExpanded ? 'w-64' : 'w-20';

    const checklistsBadge =
        expiringCount > 0 && isExpanded ? (
            <span className="ml-auto bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {expiringCount}
            </span>
        ) : undefined;

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
                {/* Decorative top line */}
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
                        className="w-10 h-10 rounded-[8px] flex items-center justify-center text-white shadow-lg shrink-0"
                        style={{ background: 'var(--deco-logo-bg)', boxShadow: 'var(--deco-logo-shadow)' }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                            <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" fill="currentColor" fillOpacity="0.3" />
                            <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M12 6L8 9V15L12 18L16 15V9L12 6Z" fill="currentColor" />
                        </svg>
                    </div>
                    <span
                        className={`text-xl font-bold tracking-tight overflow-hidden whitespace-nowrap transition-all duration-300 ${
                            isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                        }`}
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        Aure
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 w-full px-4 space-y-1 overflow-y-auto">
                    <SidebarItem
                        href="/dashboard"
                        icon="dashboard"
                        label={t('sidebar.dashboard')}
                        isExpanded={isExpanded}
                        isActive={pathname === '/dashboard'}
                        ref={pathname === '/dashboard' ? firstFocusableRef : undefined}
                    />
                    <SidebarItem
                        href="/todos"
                        icon="check_circle"
                        label={t('sidebar.todos')}
                        isExpanded={isExpanded}
                        isActive={pathname === '/todos'}
                    />
                    <SidebarItem
                        href="/checklists"
                        icon="fact_check"
                        label={t('sidebar.checklists')}
                        isExpanded={isExpanded}
                        isActive={pathname === '/checklists'}
                        badge={checklistsBadge}
                    />
                    <SidebarItem
                        href="/reminders"
                        icon="notifications_active"
                        label={t('sidebar.reminders')}
                        isExpanded={isExpanded}
                        isActive={pathname === '/reminders'}
                    />
                    <SidebarItem
                        href="/habits"
                        icon="routine"
                        label={t('sidebar.habits')}
                        isExpanded={isExpanded}
                        isActive={pathname === '/habits'}
                    />

                    {showStudySection && (
                        <SidebarGroup
                            icon="school"
                            label="Estudio"
                            isExpanded={isExpanded}
                            groupExpanded={studyExpanded}
                            onToggle={() => setStudyExpanded((v) => !v)}
                            isActive={pathname.startsWith('/study')}
                            pathname={pathname}
                            items={[
                                { href: '/study/review', icon: 'play_circle', label: 'Repaso' },
                                { href: '/study/questions', icon: 'quiz', label: 'Preguntas' },
                            ]}
                        />
                    )}

                    <SidebarGroup
                        icon="track_changes"
                        label={t('sidebar.plan')}
                        isExpanded={isExpanded}
                        groupExpanded={planExpanded}
                        onToggle={() => setPlanExpanded((v) => !v)}
                        isActive={pathname.startsWith('/goals') || pathname.startsWith('/progress')}
                        pathname={pathname}
                        items={[
                            { href: '/goals', icon: 'flag', label: t('sidebar.goals') },
                            { href: '/progress', icon: 'trending_up', label: t('sidebar.progressAndCheckIn') },
                        ]}
                    />
                </nav>

                {/* User Profile */}
                <div className="px-4 w-full mt-auto relative">
                    <button
                        ref={profileTriggerRef}
                        onClick={() => setProfileMenuOpen((open) => !open)}
                        aria-expanded={profileMenuOpen}
                        aria-haspopup="menu"
                        aria-controls="profile-menu"
                        className="flex items-center gap-3 w-full p-2 rounded-[8px] transition-colors text-left sidebar-profile-btn"
                    >
                        <img
                            src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                            alt="User Profile"
                            className="w-10 h-10 rounded-full border-2 border-primary/20 object-cover shrink-0"
                        />
                        <div
                            className={`overflow-hidden transition-all duration-300 flex-1 min-w-0 ${
                                isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
                            }`}
                        >
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
                                {user?.name || 'User'}
                            </p>
                            <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                                {user?.tagline || 'Productivity Enthusiast'}
                            </p>
                        </div>
                        <span
                            className={`material-symbols-outlined transition-transform duration-200 shrink-0 ${
                                profileMenuOpen ? 'rotate-180' : ''
                            } ${isExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            expand_more
                        </span>
                    </button>

                    {/* Profile Dropdown */}
                    {profileMenuOpen && (
                        <div
                            ref={profileMenuRef}
                            id="profile-menu"
                            role="menu"
                            className="absolute left-4 right-4 bottom-full mb-2 rounded-[8px] shadow-lg border py-1 z-50"
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
                                {t('sidebar.settings')}
                            </Link>
                            <Link
                                href="/support"
                                onClick={() => setProfileMenuOpen(false)}
                                role="menuitem"
                                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors sidebar-dropdown-item"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                <span className="material-symbols-outlined text-lg">help_outline</span>
                                {t('sidebar.support')}
                            </Link>
                            <div className="border-t my-1" style={{ borderColor: 'var(--color-border)' }} />
                            <button
                                onClick={() => {
                                    setProfileMenuOpen(false);
                                    handleLogout();
                                }}
                                role="menuitem"
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left"
                            >
                                <span className="material-symbols-outlined text-lg">logout</span>
                                {t('sidebar.logout')}
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
                className="fixed top-4 left-4 z-50 p-2 border border-primary/10 rounded-[8px] shadow-sm lg:hidden"
                style={{ background: 'var(--color-bg-surface)' }}
            >
                <span className="material-symbols-outlined">{isMobileOverlayOpen ? 'close' : 'menu'}</span>
            </button>
        </>
    );
}
