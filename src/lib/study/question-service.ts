import type {
  Question,
  StudyTopic,
  QuestionFilter,
  ImportSummary,
} from '@/types/study';

const STORAGE_KEY = 'aure-study-questions';

function getQuestions(): Question[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveQuestions(questions: Question[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

export const QuestionService = {
  getAll(): Question[] {
    return getQuestions();
  },

  getById(id: string): Question | undefined {
    return getQuestions().find((q) => q.id === id);
  },

  create(data: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Question {
    const questions = getQuestions();
    const now = new Date().toISOString();
    const question: Question = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    questions.push(question);
    saveQuestions(questions);
    return question;
  },

  update(id: string, data: Partial<Omit<Question, 'id' | 'createdAt'>>): Question | null {
    const questions = getQuestions();
    const index = questions.findIndex((q) => q.id === id);
    if (index === -1) return null;
    questions[index] = {
      ...questions[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveQuestions(questions);
    return questions[index];
  },

  delete(id: string): boolean {
    const questions = getQuestions();
    const filtered = questions.filter((q) => q.id !== id);
    if (filtered.length === questions.length) return false;
    saveQuestions(filtered);
    return true;
  },

  filter(filters: QuestionFilter): Question[] {
    let questions = getQuestions();
    if (filters.categoryId !== undefined && filters.categoryId !== null) {
      questions = questions.filter((q) => q.categoryId === filters.categoryId);
    }
    if (filters.topic) {
      questions = questions.filter((q) => q.topic === filters.topic);
    }
    if (filters.type) {
      questions = questions.filter((q) => q.type === filters.type);
    }
    if (filters.supportsBothModes !== undefined && filters.supportsBothModes !== null) {
      questions = questions.filter((q) => q.supportsBothModes === filters.supportsBothModes);
    }
    if (filters.searchText) {
      const text = filters.searchText.toLowerCase();
      questions = questions.filter((q) => q.question.toLowerCase().includes(text));
    }
    return questions;
  },

  getTopics(): string[] {
    const questions = getQuestions();
    const topics = new Set(questions.map((q) => q.topic).filter(Boolean));
    return Array.from(topics).sort();
  },

  getCategoriesUsed(): number[] {
    const questions = getQuestions();
    const cats = new Set(questions.map((q) => q.categoryId).filter((c): c is number => c !== null));
    return Array.from(cats);
  },

  importFromJSON(jsonString: string, existingCategories: { id: number; name: string }[]): ImportSummary {
    const summary: ImportSummary = { imported: 0, ignored: 0, errors: [] };
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      summary.errors.push('Invalid JSON format');
      return summary;
    }

    const items = Array.isArray(parsed) ? parsed : [parsed];
    const validCategoryIds = new Set(existingCategories.map((c) => c.id));

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || typeof item !== 'object') {
        summary.ignored++;
        summary.errors.push(`Item ${i + 1}: Not an object`);
        continue;
      }

      const q = item as Record<string, unknown>;
      const questionText = typeof q.question === 'string' ? q.question.trim() : '';
      const answer = typeof q.answer === 'string' ? q.answer.trim() : '';
      const topic = typeof q.topic === 'string' ? q.topic.trim() : '';
      const categoryId = typeof q.categoryId === 'number' ? q.categoryId : null;
      const type = q.type === 'multiple-choice' || q.type === 'direct' ? q.type : null;
      const supportsBothModes = typeof q.supportsBothModes === 'boolean' ? q.supportsBothModes : false;

      if (!questionText || !answer || !topic || !type) {
        summary.ignored++;
        summary.errors.push(`Item ${i + 1}: Missing required fields`);
        continue;
      }

      if (categoryId !== null && !validCategoryIds.has(categoryId)) {
        summary.ignored++;
        summary.errors.push(`Item ${i + 1}: Category ${categoryId} does not exist`);
        continue;
      }

      let options: string[] = [];
      let correctOptionIndex: number | null = null;

      if (type === 'multiple-choice') {
        const opts = Array.isArray(q.options) ? q.options.filter((o): o is string => typeof o === 'string') : [];
        if (opts.length !== 4 || opts.some((o) => !o.trim())) {
          summary.ignored++;
          summary.errors.push(`Item ${i + 1}: Multiple-choice requires exactly 4 non-empty options`);
          continue;
        }
        options = opts.map((o) => o.trim());
        const idx = typeof q.correctOptionIndex === 'number' ? q.correctOptionIndex : null;
        if (idx === null || idx < 0 || idx > 3) {
          summary.ignored++;
          summary.errors.push(`Item ${i + 1}: Invalid correctOptionIndex`);
          continue;
        }
        correctOptionIndex = idx;
      }

      this.create({
        question: questionText,
        categoryId,
        topic,
        type,
        directAnswer: answer,
        options: options.length ? options : ['', '', '', ''],
        correctOptionIndex,
        supportsBothModes,
      });
      summary.imported++;
    }

    return summary;
  },
};
