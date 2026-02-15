'use client';

import { useEffect } from 'react';

export default function ThemeHandler() {
    useEffect(() => {
        const root = document.documentElement;

        // Function to apply theme and color
        const applyPreferences = () => {
            const theme = localStorage.getItem('app-theme') || 'auto';
            const accentColor = localStorage.getItem('app-accent-color') || '#37ec13';

            // Apply Theme
            if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }

            // Apply Accent Color
            root.style.setProperty('--color-primary', accentColor);
        };

        applyPreferences();

        // Listen for changes in localStorage (optional, for multi-tab support)
        window.addEventListener('storage', applyPreferences);

        // Listen for system theme changes if set to auto
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = () => {
            if (localStorage.getItem('app-theme') === 'auto' || !localStorage.getItem('app-theme')) {
                applyPreferences();
            }
        };
        mediaQuery.addEventListener('change', handleSystemChange);

        return () => {
            window.removeEventListener('storage', applyPreferences);
            mediaQuery.removeEventListener('change', handleSystemChange);
        };
    }, []);

    return null;
}
