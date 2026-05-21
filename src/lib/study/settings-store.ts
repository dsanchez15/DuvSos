import type { StudySettings } from '@/types/study';
import { DEFAULT_STUDY_SETTINGS } from '@/types/study';

const SETTINGS_KEY = 'aure-study-settings';

export function getStudySettings(): StudySettings {
  if (typeof window === 'undefined') return DEFAULT_STUDY_SETTINGS;
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_STUDY_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    return {
      showStudySection: typeof parsed.showStudySection === 'boolean' ? parsed.showStudySection : DEFAULT_STUDY_SETTINGS.showStudySection,
      maxQuestionsPerReview: typeof parsed.maxQuestionsPerReview === 'number'
        ? Math.max(20, Math.min(50, parsed.maxQuestionsPerReview))
        : DEFAULT_STUDY_SETTINGS.maxQuestionsPerReview,
    };
  } catch {
    return DEFAULT_STUDY_SETTINGS;
  }
}

export function saveStudySettings(settings: StudySettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
