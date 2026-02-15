'use client';

import React, { useState, useEffect } from 'react';
import SettingCard from '@/components/SettingCard';
import Sidebar from '@/components/Sidebar';

const ACCENT_COLORS = [
    { name: 'Primary Green', color: '#37ec13', class: 'bg-[#37ec13]' },
    { name: 'Blue', color: '#3b82f6', class: 'bg-blue-500' },
    { name: 'Purple', color: '#a855f7', class: 'bg-purple-500' },
    { name: 'Indigo', color: '#6366f1', class: 'bg-indigo-500' },
    { name: 'Rose', color: '#f43f5e', class: 'bg-rose-500' },
    { name: 'Amber', color: '#f59e0b', class: 'bg-amber-500' },
    { name: 'Cyan', color: '#06b6d4', class: 'bg-cyan-500' },
    { name: 'Slate', color: '#475569', class: 'bg-slate-600' },
];

export default function SettingsPage() {
    const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
    const [accentColor, setAccentColor] = useState('#37ec13');
    const [cardLimit, setCardLimit] = useState(4);
    const [isDirty, setIsDirty] = useState(false);
    const [user, setUser] = React.useState<any>(null);

    // Initial load from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem('app-theme') as any;
        const savedColor = localStorage.getItem('app-accent-color');
        const savedLimit = localStorage.getItem('dashboard-card-limit');

        if (savedTheme) setTheme(savedTheme);
        if (savedColor) setAccentColor(savedColor);
        if (savedLimit) setCardLimit(parseInt(savedLimit));

        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.user) {
                    setUser(data.user);
                } else {
                    console.warn('Session invalid or user not found. Redirecting to login to refresh token.');
                    window.location.href = '/login';
                }
            })
            .catch(err => console.error('Failed to fetch user', err));
    }, []);

    // Apply changes
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        root.style.setProperty('--color-primary', accentColor);
    }, [theme, accentColor]);

    const handleSave = async () => {
        try {
            localStorage.setItem('app-theme', theme);
            localStorage.setItem('app-accent-color', accentColor);
            localStorage.setItem('dashboard-card-limit', cardLimit.toString());

            // Save user profile to database
            if (user) {
                const response = await fetch('/api/auth/me', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: user.name,
                        email: user.email,
                        tagline: user.tagline,
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update profile');
                }
            }

            setIsDirty(false);
            alert('Settings saved successfully!');
        } catch (error: any) {
            console.error('Save failed', error);
            alert(error.message || 'Failed to save settings');
        }
    };

    const handleDiscard = () => {
        window.location.reload();
    };

    const changeTheme = (newTheme: 'light' | 'dark' | 'auto') => {
        setTheme(newTheme);
        setIsDirty(true);
    };

    const changeAccentColor = (newColor: string) => {
        setAccentColor(newColor);
        setIsDirty(true);
    };

    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100">
            <Sidebar />

            <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8">
                {/* Header */}
                <header className="p-6 lg:px-10 flex justify-between items-center bg-transparent">
                    <div>
                        <h1 className="text-2xl font-bold">Settings</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your account preferences and app appearance.</p>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-32 custom-scrollbar">
                    <div className="max-w-4xl space-y-8 mt-4">
                        {/* Account Profile Section */}
                        <SettingCard>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary">person</span>
                                <h2 className="text-lg font-semibold">Account Profile</h2>
                            </div>
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="relative group">
                                    <img
                                        alt="Large Avatar"
                                        className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20"
                                        src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                                    />
                                    <button className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="material-symbols-outlined text-white">photo_camera</span>
                                    </button>
                                </div>
                                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Full Name</label>
                                        <input
                                            className="w-full bg-background-light dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                            type="text"
                                            value={user?.name || ''}
                                            onChange={(e) => {
                                                setUser(user ? { ...user, name: e.target.value } : { name: e.target.value });
                                                setIsDirty(true);
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email Address</label>
                                        <input
                                            className="w-full bg-background-light dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                            type="email"
                                            value={user?.email || ''}
                                            onChange={(e) => {
                                                setUser(user ? { ...user, email: e.target.value } : { email: e.target.value });
                                                setIsDirty(true);
                                            }}
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Bio / Tagline</label>
                                        <textarea
                                            className="w-full bg-background-light dark:bg-background-dark border border-primary/20 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none"
                                            rows={3}
                                            value={user?.tagline || ''}
                                            onChange={(e) => {
                                                setUser(user ? { ...user, tagline: e.target.value } : { tagline: e.target.value });
                                                setIsDirty(true);
                                            }}
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </SettingCard>

                        {/* Dashboard Config Section */}
                        <SettingCard>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary">dashboard_customize</span>
                                <h2 className="text-lg font-semibold">Dashboard Configuration</h2>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors">
                                    <div>
                                        <h3 className="font-medium">Cards to display</h3>
                                        <p className="text-xs text-slate-500">Number of habit cards to show in the central hub.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {[2, 4, 6, 8].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => { setCardLimit(num); setIsDirty(true); }}
                                                className={`w-10 h-10 rounded-lg border-2 transition-all font-bold ${cardLimit === num ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 dark:border-slate-700 hover:border-primary/30'}`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </SettingCard>

                        {/* Notification Preferences Section */}
                        <SettingCard>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-icons text-primary">notifications</span>
                                <h2 className="text-lg font-semibold">Notification Preferences</h2>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { title: 'Daily Reminders', desc: 'Get a nudge to complete your habits every morning.' },
                                    { title: 'Weekly Summary', desc: 'A detailed report of your progress every Sunday.' },
                                    { title: 'Sound Effects', desc: 'Play a sound when you complete a habit.' }
                                ].map((pref, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-background-light dark:hover:bg-background-dark transition-colors">
                                        <div>
                                            <h3 className="font-medium">{pref.title}</h3>
                                            <p className="text-xs text-slate-500">{pref.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </SettingCard>

                        {/* Theme & Appearance Section */}
                        <SettingCard>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-icons text-primary">palette</span>
                                <h2 className="text-lg font-semibold">Theme &amp; Appearance</h2>
                            </div>
                            <div className="space-y-8">
                                {/* Mode Selector */}
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Display Mode</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {(['light', 'dark', 'auto'] as const).map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => changeTheme(m)}
                                                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all ${theme === m ? 'border-primary bg-primary/5' : 'border-primary/10 hover:border-primary/30'}`}
                                            >
                                                <span className={`material-icons ${theme === m ? 'text-primary' : 'text-slate-400'}`}>
                                                    {m === 'light' ? 'light_mode' : m === 'dark' ? 'dark_mode' : 'settings_brightness'}
                                                </span>
                                                <span className="text-sm font-medium capitalize">{m}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Accent Color Gallery */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Accent Color</label>
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                            {ACCENT_COLORS.find(c => c.color === accentColor)?.name || 'Custom'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        {ACCENT_COLORS.map((color) => (
                                            <button
                                                key={color.color}
                                                onClick={() => changeAccentColor(color.color)}
                                                className={`w-12 h-12 rounded-full ${color.class} transition-transform hover:scale-110 flex items-center justify-center ${accentColor === color.color ? 'ring-4 ring-primary/20 scale-110' : ''}`}
                                            >
                                                {accentColor === color.color && (
                                                    <span className="material-icons text-white text-base">check</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Preview Area */}
                                <div className="p-4 bg-background-light dark:bg-background-dark rounded-xl border border-dashed border-primary/30">
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">Live Preview</p>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white">
                                            <span className="material-icons">water_drop</span>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Habit Preview</h4>
                                            <div className="flex gap-1 mt-1">
                                                <div className="w-4 h-1 bg-primary rounded-full"></div>
                                                <div className="w-4 h-1 bg-primary rounded-full"></div>
                                                <div className="w-4 h-1 bg-primary rounded-full"></div>
                                                <div className="w-4 h-1 bg-primary/20 rounded-full"></div>
                                                <div className="w-4 h-1 bg-primary/20 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SettingCard>

                        {/* Dangerous Zone */}
                        <SettingCard>
                            <div className="flex items-center gap-2 mb-4 text-red-500">
                                <span className="material-icons">report_problem</span>
                                <h2 className="text-lg font-semibold">Danger Zone</h2>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-medium text-slate-800 dark:text-slate-200">Reset All Data</h3>
                                    <p className="text-xs text-slate-500">Permanently delete all your habit history and preferences. This cannot be undone.</p>
                                </div>
                                <button className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-medium transition-all">Reset Account</button>
                            </div>
                        </SettingCard>
                    </div>
                </div>

                {/* Sticky Footer */}
                <footer className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-t border-primary/10 p-4 lg:px-10 flex items-center justify-between z-10">
                    <p className={`text-sm text-slate-500 italic ${isDirty ? 'opacity-100' : 'opacity-0'}`}>You have unsaved changes</p>
                    <div className="flex gap-3 ml-auto">
                        <button
                            onClick={handleDiscard}
                            className="px-6 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-8 py-2 bg-primary text-white hover:bg-opacity-90 rounded-lg font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                        >
                            <span className="material-icons text-sm">save</span>
                            Save Changes
                        </button>
                    </div>
                </footer>
            </main>
        </div>
    );
}