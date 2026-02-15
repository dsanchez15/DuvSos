'use client';

import Sidebar from '@/components/Sidebar';
import HabitList from '@/components/HabitList';

export default function HabitsPage() {
    return (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100">
            <Sidebar />
            <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Habit Management</h1>
                    <div className="bg-white dark:bg-background-dark/40 border border-primary/10 rounded-2xl p-6 shadow-sm">
                        <HabitList />
                    </div>
                </div>
            </main>

            {/* Mobile Action Button */}
            <div className="fixed bottom-6 right-6 lg:hidden z-30">
                <button className="w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
                    <span className="material-symbols-outlined">bolt</span>
                </button>
            </div>
        </div>
    );
}
