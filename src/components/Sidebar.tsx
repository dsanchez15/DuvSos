'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        fetch('/api/auth/me')
            .then(res => {
                if (res.ok) return res.json();
                return null;
            })
            .then(data => setUser(data.user))
            .catch(err => console.error('Failed to fetch user', err));
    }, []);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    const getLinkClass = (path: string) => {
        const isActive = pathname === path;
        const baseClass = "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group";
        const activeClass = "bg-primary/10 text-primary";
        const inactiveClass = "text-slate-500 hover:bg-primary/5 hover:text-primary";

        return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
    }

    return (
        <aside className="w-20 lg:w-64 bg-white dark:bg-background-dark/50 border-r border-primary/10 flex flex-col items-center lg:items-start py-8 fixed h-full z-20">
            <div className="px-6 mb-10 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined">grid_view</span>
                </div>
                <span className="text-xl font-bold hidden lg:block text-slate-900 dark:text-white tracking-tight">DuvSos</span>
            </div>

            <nav className="flex-1 w-full px-4 space-y-1">
                <Link href="/" className={getLinkClass('/')}>
                    <span className="material-symbols-outlined">dashboard</span>
                    <span className="font-medium hidden lg:block">Dashboard</span>
                </Link>
                <a href="#" className="flex items-center gap-4 px-4 py-3 text-slate-500 hover:bg-primary/5 hover:text-primary rounded-xl transition-all group">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="font-medium hidden lg:block">To-Do List</span>
                </a>
                <a href="#" className="flex items-center gap-4 px-4 py-3 text-slate-500 hover:bg-primary/5 hover:text-primary rounded-xl transition-all group">
                    <span className="material-symbols-outlined">payments</span>
                    <span className="font-medium hidden lg:block">Finances</span>
                </a>
                <a href="#" className="flex items-center gap-4 px-4 py-3 text-slate-500 hover:bg-primary/5 hover:text-primary rounded-xl transition-all group">
                    <span className="material-symbols-outlined">notifications_active</span>
                    <span className="font-medium hidden lg:block">Reminders</span>
                </a>
                <Link href="/habits" className={getLinkClass('/habits')}>
                    <span className="material-symbols-outlined">routine</span>
                    <span className="font-medium hidden lg:block">Habits</span>
                </Link>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                    <Link href="/settings" className={getLinkClass('/settings')}>
                        <span className="material-symbols-outlined">settings</span>
                        <span className="font-medium hidden lg:block">Settings</span>
                    </Link>
                    <a href="#" className="flex items-center gap-4 px-4 py-3 text-slate-500 hover:bg-primary/5 hover:text-primary rounded-xl transition-all group">
                        <span className="material-symbols-outlined">help_outline</span>
                        <span className="font-medium hidden lg:block">Support</span>
                    </a>
                </div>
            </nav>

            <div className="px-4 w-full mt-auto">
                <div className="flex items-center justify-between mt-6 lg:px-2">
                    <div className="flex items-center gap-3">
                        <img
                            src={user?.image || "https://ui-avatars.com/api/?name=" + (user?.name || "User") + "&background=random"}
                            alt="User Profile"
                            className="w-10 h-10 rounded-full border-2 border-primary/20 object-cover"
                        />
                        <div className="hidden lg:block overflow-hidden">
                            <p className="text-sm font-bold truncate">{user?.name || "User"}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.tagline || "Productivity Enthusiast"}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title="Logout"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
