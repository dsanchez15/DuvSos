'use client';

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import PlanningView from '@/components/PlanningView';
import ActionView from '@/components/ActionView';
import ArchiveView from '@/components/ArchiveView';
import { useAppTranslation } from '@/components/LanguageProvider'
import { Habit, Category, Objective, HabitFormData, HabitState } from '@/types/habit';

type ViewTab = 'planning' | 'action' | 'archive';

export default function HabitsPage() {
    const { t } = useAppTranslation();
    const [activeTab, setActiveTab] = useState<ViewTab>('action');
    const [habits, setHabits] = useState<Habit[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [objectives, setObjectives] = useState<Objective[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchHabits = useCallback(async () => {
        try {
            setLoading(true);
            const [habitsRes, catsRes, objsRes] = await Promise.all([
                fetch('/api/habits'),
                fetch('/api/habits/categories'),
                fetch('/api/habits/objectives'),
            ]);

            if (!habitsRes.ok) throw new Error(t('habits.errors.fetchHabits'));
            if (!catsRes.ok) throw new Error(t('habits.errors.fetchCategories'));
            if (!objsRes.ok) throw new Error(t('habits.errors.fetchObjectives'));

            const [habitsData, catsData, objsData] = await Promise.all([
                habitsRes.json(),
                catsRes.json(),
                objsRes.json(),
            ]);

            setHabits(habitsData);
            setCategories(catsData);
            setObjectives(objsData);
            setError('');
        } catch (err) {
            setError(t('habits.errors.loadData'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchHabits();
    }, [fetchHabits]);

    const handleCreateHabit = async (data: HabitFormData) => {
        const response = await fetch('/api/habits', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(t('habits.errors.create'));
        await fetchHabits();
    };

    const handleUpdateHabit = async (id: number, data: HabitFormData) => {
        const response = await fetch(`/api/habits/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(t('habits.errors.update'));
        await fetchHabits();
    };

    const handleDeleteHabit = async (id: number) => {
        const response = await fetch(`/api/habits/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(t('habits.errors.deleteHabit'));
        setHabits((prev) => prev.filter((h) => h.id !== id));
    };

    const handleStateChange = async (id: number, state: HabitState) => {
        const response = await fetch(`/api/habits/${id}/state`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state }),
        });
        if (!response.ok) throw new Error(t('habits.errors.changeState'));
        await fetchHabits();
    };

    const handleToggleCompletion = async (id: number, date: string, completed: boolean) => {
        if (completed) {
            const response = await fetch(`/api/habits/${id}/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date }),
            });
            if (!response.ok) {
                const err = await response.json();
                alert(err.message || t('habits.errors.complete'));
                throw new Error(err.error);
            }
            const data = await response.json();
            await fetchHabits();
            return data;
        } else {
            const response = await fetch(`/api/habits/${id}/completions?date=${date}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error(t('habits.errors.deleteCompletion'));
            await fetchHabits();
            return null;
        }
    };

    const tabs: { id: ViewTab; label: string; icon: string }[] = [
        { id: 'action', label: t('habits.tabs.action'), icon: 'bolt' },
        { id: 'planning', label: t('habits.tabs.planning'), icon: 'edit_calendar' },
        { id: 'archive', label: t('habits.tabs.archive'), icon: 'archive' },
    ];

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto">
                <div className="rounded-[8px] p-6" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                    {/* Tabs */}
                    <div className="habits-tabs flex gap-1 mb-6 p-1 rounded-[8px]" style={{ background: 'var(--color-bg-input)' }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                data-active={activeTab === tab.id}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] text-sm font-medium transition-all`}
                                style={
                                    activeTab === tab.id
                                        ? { background: 'var(--color-bg-surface)', color: 'var(--color-primary)', boxShadow: 'var(--shadow-sm)' }
                                        : { color: 'var(--color-text-secondary)' }
                                }
                            >
                                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="text-center py-4 mb-4">
                                <p className="text-red-500">{error}</p>
                            <button
                                onClick={fetchHabits}
                                className="mt-2 px-4 py-2 btn-neon bg-primary text-white rounded-[8px] hover:bg-primary/90"
                            >
                                {t('habits.retry')}
                            </button>
                        </div>
                    )}

                    {activeTab === 'planning' && (
                        <PlanningView
                            habits={habits}
                            categories={categories}
                            objectives={objectives}
                            onCreate={handleCreateHabit}
                            onUpdate={handleUpdateHabit}
                            onDelete={handleDeleteHabit}
                            onStateChange={handleStateChange}
                            loading={loading}
                        />
                    )}

                    {activeTab === 'action' && (
                        <ActionView
                            habits={habits}
                            onToggleCompletion={handleToggleCompletion}
                            loading={loading}
                        />
                    )}

                    {activeTab === 'archive' && (
                        <ArchiveView
                            habits={habits}
                            loading={loading}
                        />
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
