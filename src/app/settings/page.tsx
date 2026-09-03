'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Toast from '@/components/Toast';
import { useAppTranslation } from '@/components/LanguageProvider';
import { apiClient, ApiError } from '@/lib/api-client';
import { SettingsStore } from '@/lib/study/settings-store';
import { TopicService } from '@/lib/study/topic-service';
import { QuestionService } from '@/lib/study/question-service';
import type { StudySettings, StudyTopic } from '@/types/study';
import SettingsTabs, { type SettingsTabKey } from '@/components/settings/SettingsTabs';
import AccountProfileCard, { type SettingsUser } from '@/components/settings/AccountProfileCard';
import DashboardConfigCard from '@/components/settings/DashboardConfigCard';
import FeatureFlagsCard from '@/components/settings/FeatureFlagsCard';
import NotificationsCard from '@/components/settings/NotificationsCard';
import ThemeAppearanceCard from '@/components/settings/ThemeAppearanceCard';
import DangerZoneCard from '@/components/settings/DangerZoneCard';
import StudySectionCard from '@/components/settings/StudySectionCard';
import TopicsManagerCard from '@/components/settings/TopicsManagerCard';
import CategoriesManagerCard, { type SettingsCategory } from '@/components/settings/CategoriesManagerCard';
import SettingsFooter from '@/components/settings/SettingsFooter';
import { useFeatureFlags, type FeatureFlag } from '@/hooks/useFeatureFlags';

type ThemeMode = 'light' | 'dark' | 'system';

function getInitialTheme(): ThemeMode {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('app-theme');
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
            return saved as ThemeMode;
        }
    }
    return 'system';
}

function getInitialLanguage(): 'en' | 'es' {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('app-language');
        if (saved && ['en', 'es'].includes(saved)) {
            return saved as 'en' | 'es';
        }
    }
    return 'en';
}

export default function SettingsPage() {
    const { t, setLanguage: setAppLanguage } = useAppTranslation();
    const [activeTab, setActiveTab] = useState<SettingsTabKey>('general');

    const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
    const [selectedLang, setSelectedLang] = useState<'en' | 'es'>(getInitialLanguage);
    const [cardLimit, setCardLimit] = useState(() => {
        if (typeof window === 'undefined') return 4;
        const savedLimit = window.localStorage.getItem('dashboard-card-limit');
        return savedLimit ? parseInt(savedLimit, 10) : 4;
    });
    const [checklistAlertDays, setChecklistAlertDays] = useState(3);
    const [isDirty, setIsDirty] = useState(false);
    const [user, setUser] = useState<SettingsUser | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [categories, setCategories] = useState<SettingsCategory[]>([]);
    const [studySettings, setStudySettings] = useState<StudySettings>({ showStudySection: true, maxQuestionsPerReview: 20 });
    const [topics, setTopics] = useState<StudyTopic[]>([]);
    const { flags: featureFlags, setFlag: setFeatureFlag } = useFeatureFlags();

    const fetchCategories = async () => {
        return apiClient.get<SettingsCategory[]>('/api/todo-categories');
    };

    const loadTopics = async () => {
        return TopicService.getAll();
    };

    const loadStudySettings = async () => {
        return SettingsStore.getSettings();
    };

    useEffect(() => {
        apiClient.get<{ user: SettingsUser & { theme?: string; checklistAlertDays?: number; language?: string } }>('/api/auth/me')
            .then((data) => {
                if (data?.user) {
                    setUser(data.user);
                    const userTheme = data.user.theme || 'system';
                    if (['light', 'dark', 'system'].includes(userTheme)) {
                        setTheme(userTheme as ThemeMode);
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
            .catch((err) => {
                if (err instanceof ApiError) {
                    window.location.href = '/login';
                } else {
                    console.error('Failed to fetch user', err);
                }
            });

        fetchCategories().then(setCategories).catch((err) => console.error('Failed to fetch categories', err));
        loadTopics().then(setTopics).catch((err) => console.error('Failed to fetch topics', err));
        loadStudySettings().then(setStudySettings).catch((err) => console.error('Failed to load study settings', err));
    }, []);

    // ─── Actions ───

    const handleCreateCategory = async (name: string, color: string) => {
        try {
            await apiClient.post('/api/categories', { name, color, icon: 'folder' });
            fetchCategories();
            setToast({ message: t('settings.toast.categoryCreated'), type: 'success' });
        } catch {
            setToast({ message: t('settings.toast.categoryCreateFailed'), type: 'error' });
        }
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm(t('settings.confirmDeleteCategory'))) return;
        try {
            await apiClient.delete(`/api/todo-categories/${id}`);
            fetchCategories();
            setToast({ message: t('settings.toast.categoryDeleted'), type: 'success' });
        } catch {
            setToast({ message: t('settings.toast.categoryDeleteFailed'), type: 'error' });
        }
    };

    const handleCreateTopic = async (name: string) => {
        try {
            const result = await TopicService.create(name);
            if (result) {
                loadTopics();
                setToast({ message: t('settings.toast.topicCreated'), type: 'success' });
            } else {
                setToast({ message: t('settings.toast.topicExists'), type: 'error' });
            }
        } catch {
            setToast({ message: t('settings.toast.topicCreateFailed'), type: 'error' });
        }
    };

    const handleDeleteTopic = async (id: string) => {
        const topic = topics.find((topic) => topic.id === id);
        if (!topic) return;
        const allQuestions = await QuestionService.getAll();
        const questionsWithTopic = allQuestions.filter((q) => q.topic?.name === topic.name);
        const msg = questionsWithTopic.length > 0
            ? t('settings.confirmDeleteTopicWithQuestions', { count: questionsWithTopic.length })
            : t('settings.confirmDeleteTopic');
        if (!confirm(msg)) return;
        try {
            await TopicService.delete(id);
            loadTopics();
            setToast({ message: t('settings.toast.topicDeleted'), type: 'success' });
        } catch {
            setToast({ message: t('settings.toast.topicDeleteFailed'), type: 'error' });
        }
    };

    const applyTheme = (mode: ThemeMode) => {
        const root = document.documentElement;
        let isDark: boolean;
        if (mode === 'dark') isDark = true;
        else if (mode === 'light') isDark = false;
        else isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) root.classList.add('dark');
        else root.classList.remove('dark');
    };

    const changeTheme = (newTheme: ThemeMode) => {
        setTheme(newTheme);
        applyTheme(newTheme);
        setIsDirty(true);
    };

    const changeLanguage = (newLang: 'en' | 'es') => {
        setSelectedLang(newLang);
        setAppLanguage(newLang);
        setIsDirty(true);
    };

    const handleStudySettingsChange = async (updated: StudySettings, persist: boolean) => {
        setStudySettings(updated);
        if (persist) await SettingsStore.updateSettings(updated);
        setIsDirty(true);
    };

    const handleFeatureFlagChange = async (key: FeatureFlag, value: boolean) => {
        await setFeatureFlag(key, value);
        setIsDirty(true);
    };

    const handleUserChange = (updated: SettingsUser) => {
        setUser(updated);
        setIsDirty(true);
    };

    const handleSave = async () => {
        try {
            localStorage.setItem('app-theme', theme);
            localStorage.setItem('app-visual-theme', 'classic');
            localStorage.setItem('app-language', selectedLang);
            localStorage.setItem('dashboard-card-limit', cardLimit.toString());
            await SettingsStore.updateSettings(studySettings);

            if (user) {
                await apiClient.patch('/api/auth/me', {
                    name: user.name,
                    email: user.email,
                    tagline: user.tagline,
                    theme: theme,
                    language: selectedLang,
                    checklistAlertDays: checklistAlertDays,
                });
            }
            setIsDirty(false);
            setToast({ message: t('settings.toast.settingsSaved'), type: 'success' });
        } catch (error) {
            console.error('Save failed', error);
            setToast({
                message: error instanceof Error ? error.message : t('settings.toast.settingsSaveFailed'),
                type: 'error',
            });
        }
    };

    const handleDiscard = () => {
        window.location.reload();
    };

    return (
        <AppLayout>
            <main className="flex-1">
                {toast && (
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                )}

                <header className="flex items-center justify-between bg-transparent p-6 lg:px-10">
                    <div>
                        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
                        <p className="text-sm text-text-muted">{t('settings.subtitle')}</p>
                    </div>
                </header>

                <div className="px-6 pb-4 lg:px-10">
                    <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />
                </div>

                <div className="custom-scrollbar flex-1 overflow-y-auto px-6 pb-32 lg:px-10">
                    <div className="mt-4 max-w-4xl space-y-8">
                        {activeTab === 'general' && (
                            <>
                                <AccountProfileCard user={user} onUserChange={handleUserChange} />
                                <DashboardConfigCard
                                    cardLimit={cardLimit}
                                    checklistAlertDays={checklistAlertDays}
                                    onCardLimitChange={(v) => { setCardLimit(v); setIsDirty(true); }}
                                    onAlertDaysChange={(v) => { setChecklistAlertDays(v); setIsDirty(true); }}
                                />
                                <NotificationsCard />
                                <ThemeAppearanceCard
                                    theme={theme}
                                    selectedLang={selectedLang}
                                    onThemeChange={changeTheme}
                                    onLanguageChange={changeLanguage}
                                />
                                <DangerZoneCard />
                            </>
                        )}

                        {activeTab === 'vistas' && (
                            <>
                                <FeatureFlagsCard flags={featureFlags} onChange={handleFeatureFlagChange} />
                                <StudySectionCard settings={studySettings} onChange={handleStudySettingsChange} />
                            </>
                        )}

                        {activeTab === 'admin' && (
                            <>
                                <TopicsManagerCard
                                    topics={topics}
                                    onCreateTopic={handleCreateTopic}
                                    onDeleteTopic={handleDeleteTopic}
                                />
                                <CategoriesManagerCard
                                    categories={categories}
                                    onCreateCategory={handleCreateCategory}
                                    onDeleteCategory={handleDeleteCategory}
                                />
                            </>
                        )}
                    </div>
                </div>

                <SettingsFooter isDirty={isDirty} onSave={handleSave} onDiscard={handleDiscard} />
            </main>
        </AppLayout>
    );
}
