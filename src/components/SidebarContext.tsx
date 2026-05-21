'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type SidebarMode = 'expanded' | 'collapsed' | 'mobile-overlay';

interface SidebarContextValue {
    mode: SidebarMode;
    isExpanded: boolean;
    isCollapsed: boolean;
    isMobileOverlayOpen: boolean;
    toggle: () => void;
    expand: () => void;
    collapse: () => void;
    openMobileOverlay: () => void;
    closeMobileOverlay: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

const STORAGE_KEY = 'sidebar-state';
const MOBILE_BREAKPOINT = 1024;

function getIsMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
}

function getSavedState(): { collapsed: boolean } | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        // ignore
    }
    return null;
}

function saveState(collapsed: boolean) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ collapsed }));
    } catch {
        // ignore
    }
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [mobileOverlayOpen, setMobileOverlayOpen] = useState<boolean>(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const mobile = getIsMobile();
        setIsMobile(mobile);

        if (mobile) {
            setCollapsed(true);
            setMobileOverlayOpen(false);
        } else {
            const saved = getSavedState();
            setCollapsed(saved ? saved.collapsed : false);
        }

        const handleResize = () => {
            const nowMobile = getIsMobile();
            setIsMobile(nowMobile);
            if (nowMobile) {
                setCollapsed(true);
                setMobileOverlayOpen(false);
            } else {
                const saved = getSavedState();
                setCollapsed(saved ? saved.collapsed : false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggle = useCallback(() => {
        if (isMobile) {
            setMobileOverlayOpen(prev => !prev);
        } else {
            setCollapsed(prev => {
                const next = !prev;
                saveState(next);
                return next;
            });
        }
    }, [isMobile]);

    const expand = useCallback(() => {
        if (isMobile) {
            setMobileOverlayOpen(true);
        } else {
            setCollapsed(false);
            saveState(false);
        }
    }, [isMobile]);

    const collapse = useCallback(() => {
        if (isMobile) {
            setMobileOverlayOpen(false);
        } else {
            setCollapsed(true);
            saveState(true);
        }
    }, [isMobile]);

    const openMobileOverlay = useCallback(() => {
        if (isMobile) setMobileOverlayOpen(true);
    }, [isMobile]);

    const closeMobileOverlay = useCallback(() => {
        if (isMobile) setMobileOverlayOpen(false);
    }, [isMobile]);

    const mode: SidebarMode = isMobile
        ? mobileOverlayOpen
            ? 'mobile-overlay'
            : 'collapsed'
        : collapsed
            ? 'collapsed'
            : 'expanded';

    const value: SidebarContextValue = {
        mode,
        isExpanded: mode === 'expanded',
        isCollapsed: mode === 'collapsed',
        isMobileOverlayOpen: mode === 'mobile-overlay',
        toggle,
        expand,
        collapse,
        openMobileOverlay,
        closeMobileOverlay,
    };

    // Prevent hydration mismatch by rendering children only after mount
    // or by providing a stable initial value. We'll provide the value
    // immediately but default to expanded on server.
    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar(): SidebarContextValue {
    const ctx = useContext(SidebarContext);
    if (!ctx) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return ctx;
}
