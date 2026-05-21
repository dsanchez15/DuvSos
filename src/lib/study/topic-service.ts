import type { StudyTopic } from '@/types/study';

const STORAGE_KEY = 'aure-study-topics';

function getTopics(): StudyTopic[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTopics(topics: StudyTopic[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
}

export function normalizeTopicName(name: string): string {
  return name.trim().toLowerCase();
}

export const TopicService = {
  getAll(): StudyTopic[] {
    return getTopics().sort((a, b) => a.normalizedName.localeCompare(b.normalizedName));
  },

  create(name: string): StudyTopic | null {
    const normalized = normalizeTopicName(name);
    if (!normalized) return null;
    const topics = getTopics();
    if (topics.some((t) => t.normalizedName === normalized)) {
      return null;
    }
    const topic: StudyTopic = {
      id: crypto.randomUUID(),
      name: name.trim(),
      normalizedName: normalized,
      createdAt: new Date().toISOString(),
    };
    topics.push(topic);
    saveTopics(topics);
    return topic;
  },

  delete(id: string): boolean {
    const topics = getTopics();
    const filtered = topics.filter((t) => t.id !== id);
    if (filtered.length === topics.length) return false;
    saveTopics(filtered);
    return true;
  },

  getByName(name: string): StudyTopic | undefined {
    const normalized = normalizeTopicName(name);
    return getTopics().find((t) => t.normalizedName === normalized);
  },

  getNames(): string[] {
    return this.getAll().map((t) => t.name);
  },
};
