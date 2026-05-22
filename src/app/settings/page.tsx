'use client';

import React, { useState, useEffect } from 'react';
import SettingCard from '@/components/SettingCard';
import AppLayout from '@/components/AppLayout';
import Toast from '@/components/Toast';
import { useAppTranslation } from '@/components/LanguageProvider';
import { getStudySettings, saveStudySettings } from '@/lib/study/settings-store';
import { TopicService } from '@/lib/study/topic-service';
import { QuestionService } from '@/lib/study/question-service';
import type { StudySettings, StudyTopic } from '@/types/study';

const CATEGORY_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Slate', value: '#64748b' },
];

type TabKey = 'general' | 'vistas' | 'admin';

export default function SettingsPage() {
    const { t, setLanguage: setAppLanguage } = useAppTranslation();
    const [activeTab, setActiveTab] = useState<TabKey>('general');

    // ─── General Tab State ───
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('app-theme');
            if (saved && ['light', 'dark', 'system'].includes(saved)) {
                return saved as 'light' | 'dark' | 'system';
            }
        }
        return 'system';
    });
    const [selectedLang, setSelectedLang] = useState<'en' | 'es'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('app-language');
            if (saved && ['en', 'es'].includes(saved)) {
                return saved as 'en' | 'es';
            }
        }
        return 'en';
    });
    const [cardLimit, setCardLimit] = useState(4);
    const [checklistAlertDays, setChecklistAlertDays] = useState(3);
    const [isDirty, setIsDirty] = useState(false);
    const [user, setUser] = React.useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Todo Categories
    const [categories, setCategories] = useState<any[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0].value);
    const [showCategoryForm, setShowCategoryForm] = useState(false);

    // ─── Vistas Tab State ───
    const [studySettings, setStudySettings] = useState<StudySettings>(getStudySettings());

    // ─── Admin Tab State ───
    const [topics, setTopics] = useState<StudyTopic[]>([]);
    const [newTopicName, setNewTopicName] = useState('');
    const [showTopicForm, setShowTopicForm] = useState(false);

    useEffect(() => {
        const savedLimit = localStorage.getItem('dashboard-card-limit');
        if (savedLimit) setCardLimit(parseInt(savedLimit));

        fetch('/api/auth/me')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data?.user) {
                    setUser(data.user);
                    const userTheme = data.user.theme || 'system';
                    if (['light', 'dark', 'system'].includes(userTheme)) {
                        setTheme(userTheme as 'light' | 'dark' | 'system');
                    }
                    if (data.user.checklistAlertDays !== undefined) {
                        setChecklistAlertDays(data.user.checklistAlertDays);
                    }
                    if (data.user.language) {
                        setSelectedLang(data.user.language as 'en' | 'es');
                    }
                } else {
                    window.location.href = '/login';
                }
            })
            .catch(err => console.error('Failed to fetch user', err));

        fetchCategories();
        loadTopics();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/todo-categories');
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    const loadTopics = () => {
        setTopics(TopicService.getAll());
    };

    // ─── Actions ───
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        try {
            const res = await fetch('/api/todo-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newCategoryName.trim(),
                    color: newCategoryColor,
                    icon: 'folder',
                }),
            });
            if (!res.ok) throw new Error('Failed to create category');
            setNewCategoryName('');
            setNewCategoryColor(CATEGORY_COLORS[0].value);
            setShowCategoryForm(false);
            fetchCategories();
            setToast({ message: t('settings.toast.categoryCreated'), type: 'success' });
        } catch (err) {
            setToast({ message: t('settings.toast.categoryCreateFailed'), type: 'error' });
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm(t('settings.confirmDeleteCategory'))) return;
        try {
            const res = await fetch(`/api/todo-categories/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete category');
            fetchCategories();
            setToast({ message: t('settings.toast.categoryDeleted'), type: 'success' });
        } catch (err) {
            setToast({ message: t('settings.toast.categoryDeleteFailed'), type: 'error' });
        }
    };

    const handleCreateTopic = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTopicName.trim()) return;
        const result = TopicService.create(newTopicName.trim());
        if (result) {
            setNewTopicName('');
            setShowTopicForm(false);
            loadTopics();
            setToast({ message: 'Tema creado exitosamente', type: 'success' });
        } else {
            setToast({ message: 'El tema ya existe', type: 'error' });
        }
    };

    const handleDeleteTopic = (id: string) => {
        const questionsWithTopic = QuestionService.getAll().filter((q) => q.topic === topics.find((t) => t.id === id)?.name);
        const msg = questionsWithTopic.length > 0
            ? `Este tema tiene ${questionsWithTopic.length} pregunta(s) asociada(s). Al eliminarlo, las preguntas quedarán sin temática asignada. ¿Continuar?`
            : '¿Eliminar este tema?';
        if (!confirm(msg)) return;
        TopicService.delete(id);
        loadTopics();
        setToast({ message: 'Tema eliminado', type: 'success' });
    };

    const applyTheme = (t: 'light' | 'dark' | 'system') => {
        const root = document.documentElement;
        let isDark: boolean;
        if (t === 'dark') isDark = true;
        else if (t === 'light') isDark = false;
        else isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) root.classList.add('dark');
        else root.classList.remove('dark');
    };

    const changeTheme = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme);
        applyTheme(newTheme);
        setIsDirty(true);
    };

    const changeLanguage = (newLang: 'en' | 'es') => {
        setSelectedLang(newLang);
        setAppLanguage(newLang);
        setIsDirty(true);
    };

    const handleSave = async () => {
        try {
            localStorage.setItem('app-theme', theme);
            localStorage.setItem('app-visual-theme', 'classic');
            localStorage.setItem('app-language', selectedLang);
            localStorage.setItem('dashboard-card-limit', cardLimit.toString());
            saveStudySettings(studySettings);

            if (user) {
                const response = await fetch('/api/auth/me', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: user.name,
                        email: user.email,
                        tagline: user.tagline,
                        theme: theme,
                        language: selectedLang,
                        checklistAlertDays: checklistAlertDays,
                    }),
                });
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update profile');
                }
            }
            setIsDirty(false);
            setToast({ message: t('settings.toast.settingsSaved'), type: 'success' });
        } catch (error: any) {
            console.error('Save failed', error);
            setToast({ message: error.message || t('settings.toast.settingsSaveFailed'), type: 'error' });
        }
    };

    const handleDiscard = () => {
        window.location.reload();
    };

    const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const tabs: { key: TabKey; label: string; icon: string }[] = [
        { key: 'general', label: t('settings.tabs.general') || 'General', icon: 'tune' },
        { key: 'vistas', label: t('settings.tabs.vistas') || 'Vistas', icon: 'visibility' },
        { key: 'admin', label: t('settings.tabs.admin') || 'Administración', icon: 'admin_panel_settings' },
    ];

    return (
        <AppLayout>
            <main className="flex-1">
                {toast && (
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                )}

                <header className="p-6 lg:px-10 flex justify-between items-center bg-transparent">
                    <div>
                        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('settings.subtitle')}</p>
                    </div>
                </header>

                {/* Tabs */}
                <div className="px-6 lg:px-10 pb-4">
                    <div className="flex gap-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-[1px] ${
                                    activeTab === tab.key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                }`}
                            >
                                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-32 custom-scrollbar">
                    <div className="max-w-4xl space-y-8 mt-4">
                        {/* ═══════════════ GENERAL TAB ═══════════════ */}
                        {activeTab === 'general' && (
                            <>
                                {/* Account Profile */}
                                <SettingCard>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-primary">person</span>
                                        <h2 className="text-lg font-semibold">{t('settings.accountProfile')}</h2>
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        <div className="relative group">
                                            <img
                                                alt="Avatar"
                                                className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/20"
                                                src={user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                                            />
                                            <button className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="material-symbols-outlined text-white">photo_camera</span>
                                            </button>
                                        </div>
                                        <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('settings.fullName')}</label>
                                                <input
                                                    className="w-full border border-primary/20 rounded-[8px] px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                                    style={{ background: 'var(--color-bg-input)' }}
                                                    type="text"
                                                    value={user?.name || ''}
                                                    onChange={(e) => { setUser(user ? { ...user, name: e.target.value } : { name: e.target.value }); setIsDirty(true); }}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('settings.emailAddress')}</label>
                                                <input
                                                    className="w-full border border-primary/20 rounded-[8px] px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                                                    style={{ background: 'var(--color-bg-input)' }}
                                                    type="email"
                                                    value={user?.email || ''}
                                                    onChange={(e) => { setUser(user ? { ...user, email: e.target.value } : { email: e.target.value }); setIsDirty(true); }}
                                                />
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>{t('settings.bioTagline')}</label>
                                                <textarea
                                                    className="w-full border border-primary/20 rounded-[8px] px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none"
                                                    style={{ background: 'var(--color-bg-input)' }}
                                                    rows={3}
                                                    value={user?.tagline || ''}
                                                    onChange={(e) => { setUser(user ? { ...user, tagline: e.target.value } : { tagline: e.target.value }); setIsDirty(true); }}
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </SettingCard>

                                {/* Dashboard Config */}
                                <SettingCard>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-primary">dashboard_customize</span>
                                        <h2 className="text-lg font-semibold">{t('settings.dashboardConfig')}</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 rounded-[8px] settings-row-hover transition-colors">
                                            <div>
                                                <h3 className="font-medium">{t('settings.cardsToDisplay')}</h3>
                                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('settings.cardsToDisplayDesc')}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {[2, 4, 6, 8].map(num => (
                                                    <button key={num} onClick={() => { setCardLimit(num); setIsDirty(true); }}
                                                        className={`w-10 h-10 rounded-[8px] border-2 transition-all font-bold ${cardLimit === num ? 'border-primary bg-primary/10 text-primary' : 'settings-num-btn-inactive'}`}
                                                        style={cardLimit !== num ? { borderColor: 'var(--color-border)' } : undefined}>
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-[8px] settings-row-hover transition-colors">
                                            <div>
                                                <h3 className="font-medium">{t('settings.checklistAlert')}</h3>
                                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('settings.checklistAlertDesc')}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {[0, 1, 2, 3, 4, 5].map(num => (
                                                    <button key={num} onClick={() => { setChecklistAlertDays(num); setIsDirty(true); }}
                                                        className={`w-10 h-10 rounded-[8px] border-2 transition-all font-bold ${checklistAlertDays === num ? 'border-primary bg-primary/10 text-primary' : 'settings-num-btn-inactive'}`}
                                                        style={checklistAlertDays !== num ? { borderColor: 'var(--color-border)' } : undefined}>
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </SettingCard>

                                {/* Todo Categories */}
                                <SettingCard>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-primary">label</span>
                                        <h2 className="text-lg font-semibold">{t('settings.todoCategories')}</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {categories.length === 0 ? (
                                            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('settings.noCategories')}</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {categories.map((cat) => (
                                                    <div key={cat.id} className="flex items-center gap-2 px-3 py-2 rounded-[8px] border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
                                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                                        <span className="text-sm font-medium">{cat.name}</span>
                                                        {cat.name !== 'General' && (
                                                            <button onClick={() => handleDeleteCategory(cat.id)} className="settings-cat-delete-btn" style={{ color: 'var(--color-text-muted)' }}>
                                                                <span className="material-symbols-outlined text-sm">close</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {showCategoryForm ? (
                                            <form onSubmit={handleCreateCategory} className="space-y-3 p-4 rounded-[8px]" style={{ background: 'var(--color-bg-surface-hover)' }}>
                                                <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder={t('settings.categoryNamePlaceholder')}
                                                    className="w-full px-4 py-2 rounded-[8px] border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }} autoFocus />
                                                <div className="flex gap-2">
                                                    {CATEGORY_COLORS.map((c) => (
                                                        <button key={c.value} type="button" onClick={() => setNewCategoryColor(c.value)}
                                                            className={`w-8 h-8 rounded-full border-2 transition-all ${newCategoryColor === c.value ? 'scale-110' : 'border-transparent'}`}
                                                            style={{ backgroundColor: c.value, ...(newCategoryColor === c.value ? { borderColor: 'var(--color-text-primary)' } : {}) }} title={c.name} />
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => { setShowCategoryForm(false); setNewCategoryName(''); }}
                                                        className="px-4 py-2 settings-cancel-btn text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('common.cancel')}</button>
                                                    <button type="submit" disabled={!newCategoryName.trim()} className="px-4 py-2 bg-primary text-white rounded-[8px] text-sm hover:bg-primary/90 disabled:opacity-50">{t('common.create')}</button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button onClick={() => setShowCategoryForm(true)} className="px-4 py-2 border border-primary/30 text-primary rounded-[8px] hover:bg-primary/5 text-sm font-medium transition-colors">{t('settings.newCategory')}</button>
                                        )}
                                    </div>
                                </SettingCard>

                                {/* Notification Preferences */}
                                <SettingCard>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-primary">notifications</span>
                                        <h2 className="text-lg font-semibold">{t('settings.notifications')}</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { title: t('settings.dailyReminders'), desc: t('settings.dailyRemindersDesc') },
                                            { title: t('settings.weeklySummary'), desc: t('settings.weeklySummaryDesc') },
                                            { title: t('settings.soundEffects'), desc: t('settings.soundEffectsDesc') }
                                        ].map((pref, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-[8px] settings-row-hover transition-colors">
                                                <div>
                                                    <h3 className="font-medium">{pref.title}</h3>
                                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{pref.desc}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                                                    <div className="w-11 h-6 settings-toggle-track peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary rounded-full"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </SettingCard>

                                {/* Theme & Appearance */}
                                <SettingCard>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-primary">palette</span>
                                        <h2 className="text-lg font-semibold">{t('settings.themeAppearance')}</h2>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-sm font-medium block mb-3" style={{ color: 'var(--color-text-secondary)' }}>{t('settings.language')}</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                {([
                                                    { code: 'es' as const, label: 'Español', flag: '🇪🇸' },
                                                    { code: 'en' as const, label: 'English', flag: '🇬🇧' },
                                                ]).map((l) => (
                                                    <button key={l.code} onClick={() => changeLanguage(l.code)}
                                                        className={`flex items-center gap-3 p-4 border-2 rounded-[8px] transition-all ${selectedLang === l.code ? 'border-primary bg-primary/5' : 'border-primary/10 hover:border-primary/30'}`}>
                                                        <span className="text-2xl">{l.flag}</span>
                                                        <span className="text-sm font-medium">{l.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium block mb-3" style={{ color: 'var(--color-text-secondary)' }}>{t('settings.displayMode')}</label>
                                            <div className="grid grid-cols-3 gap-4">
                                                {(['light', 'dark', 'system'] as const).map((m) => (
                                                    <button key={m} onClick={() => changeTheme(m)}
                                                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-[8px] transition-all ${theme === m ? 'border-primary bg-primary/5' : 'border-primary/10 hover:border-primary/30'}`}>
                                                        <span className={`material-symbols-outlined ${theme === m ? 'text-primary' : ''}`} style={theme !== m ? { color: 'var(--color-text-muted)' } : undefined}>
                                                            {m === 'light' ? 'light_mode' : m === 'dark' ? 'dark_mode' : 'settings_brightness'}
                                                        </span>
                                                        <span className="text-sm font-medium capitalize">{m}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </SettingCard>
                            </>
                        )}

                        {/* ═══════════════ VISTAS TAB ═══════════════ */}
                        {activeTab === 'vistas' && (
                            <>
                                {/* Study Section */}
                                <SettingCard>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-primary">school</span>
                                        <h2 className="text-lg font-semibold">Estudio</h2>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-3 rounded-[8px] settings-row-hover transition-colors">
                                            <div>
                                                <h3 className="font-medium">Mostrar sección de Estudio</h3>
                                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Activa o desactiva la sección de Estudio en el sidebar</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={studySettings.showStudySection}
                                                    onChange={(e) => {
                                                        const updated = { ...studySettings, showStudySection: e.target.checked };
                                                        setStudySettings(updated);
                                                        saveStudySettings(updated);
                                                        setIsDirty(true);
                                                    }}
                                                />
                                                <div className="w-11 h-6 settings-toggle-track peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary rounded-full"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-3 rounded-[8px] settings-row-hover transition-colors">
                                            <div>
                                                <h3 className="font-medium">Máximo de preguntas por repaso</h3>
                                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Límite superior de preguntas en una sesión de repaso</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-bold text-primary w-8 text-center">{studySettings.maxQuestionsPerReview}</span>
                                                <input
                                                    type="range"
                                                    min={20}
                                                    max={50}
                                                    step={1}
                                                    value={studySettings.maxQuestionsPerReview}
                                                    onChange={(e) => {
                                                        const updated = { ...studySettings, maxQuestionsPerReview: parseInt(e.target.value) };
                                                        setStudySettings(updated);
                                                        setIsDirty(true);
                                                    }}
                                                    className="w-32 accent-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </SettingCard>
                            </>
                        )}

                        {/* ═══════════════ ADMIN TAB ═══════════════ */}
                        {activeTab === 'admin' && (
                            <>
                                {/* Study Topics Management */}
                                <SettingCard>
                                    <div className="flex items-center gap-2 mb-6">
                                        <span className="material-symbols-outlined text-primary">topic</span>
                                        <h2 className="text-lg font-semibold">Temas de Estudio</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {topics.length === 0 ? (
                                            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No hay temas creados aún</p>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {topics.map((topic) => (
                                                    <div key={topic.id} className="flex items-center gap-2 px-3 py-2 rounded-[8px] border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
                                                        <span className="material-symbols-outlined text-sm" style={{ color: 'var(--color-text-muted)' }}>tag</span>
                                                        <span className="text-sm font-medium">{topic.name}</span>
                                                        <button
                                                            onClick={() => handleDeleteTopic(topic.id)}
                                                            className="settings-cat-delete-btn"
                                                            style={{ color: 'var(--color-text-muted)' }}
                                                        >
                                                            <span className="material-symbols-outlined text-sm">close</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {showTopicForm ? (
                                            <form onSubmit={handleCreateTopic} className="space-y-3 p-4 rounded-[8px]" style={{ background: 'var(--color-bg-surface-hover)' }}>
                                                <input
                                                    type="text"
                                                    value={newTopicName}
                                                    onChange={(e) => setNewTopicName(e.target.value)}
                                                    placeholder="Nombre del tema"
                                                    className="w-full px-4 py-2 rounded-[8px] border"
                                                    style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setShowTopicForm(false); setNewTopicName(''); }}
                                                        className="px-4 py-2 settings-cancel-btn text-sm"
                                                        style={{ color: 'var(--color-text-muted)' }}
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={!newTopicName.trim()}
                                                        className="px-4 py-2 bg-primary text-white rounded-[8px] text-sm hover:bg-primary/90 disabled:opacity-50"
                                                    >
                                                        Crear
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button
                                                onClick={() => setShowTopicForm(true)}
                                                className="px-4 py-2 border border-primary/30 text-primary rounded-[8px] hover:bg-primary/5 text-sm font-medium transition-colors"
                                            >
                                                Nuevo Tema
                                            </button>
                                        )}
                                    </div>
                                </SettingCard>
                            </>
                        )}

                        {/* Danger Zone (always visible at bottom) */}
                        <SettingCard>
                            <div className="flex items-center gap-2 mb-4 text-red-500">
                                <span className="material-symbols-outlined">report_problem</span>
                                <h2 className="text-lg font-semibold">{t('settings.dangerZone')}</h2>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{t('settings.resetAllData')}</h3>
                                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('settings.resetAllDataDesc')}</p>
                                </div>
                                <button className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-[8px] font-medium transition-all">{t('settings.resetAccount')}</button>
                            </div>
                        </SettingCard>
                    </div>
                </div>

                {/* Sticky Footer */}
                <footer className="fixed bottom-0 left-0 lg:left-64 right-0 backdrop-blur-md border-t border-primary/10 p-4 lg:px-10 flex items-center justify-between z-10" style={{ background: 'color-mix(in srgb, var(--color-bg-surface) 80%, transparent)' }}>
                    <p className={`text-sm italic ${isDirty ? 'opacity-100' : 'opacity-0'}`} style={{ color: 'var(--color-text-muted)' }}>{t('settings.unsavedChanges')}</p>
                    <div className="flex gap-3 ml-auto">
                        <button onClick={handleDiscard} className="px-6 py-2 border rounded-[8px] font-medium transition-colors settings-discard-btn" style={{ borderColor: 'var(--color-border)' }}>
                            {t('settings.discard')}
                        </button>
                        <button onClick={handleSave} className="px-8 py-2 bg-primary text-white hover:bg-primary/90 rounded-[8px] font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">save</span>
                            {t('settings.saveChanges')}
                        </button>
                    </div>
                </footer>
            </main>
        </AppLayout>
    );
}
