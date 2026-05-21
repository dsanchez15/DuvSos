import { describe, it, expect, beforeEach } from 'vitest';
import { QuestionService } from '@/lib/study/question-service';
import type { Question } from '@/types/study';

const STORAGE_KEY = 'aure-study-questions';

describe('QuestionService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates a question with all fields', () => {
    const q = QuestionService.create({
      question: 'What is 2+2?',
      categoryId: 1,
      topic: 'math',
      type: 'direct',
      directAnswer: '4',
      options: ['', '', '', ''],
      correctOptionIndex: null,
      supportsBothModes: false,
    });

    expect(q.id).toBeDefined();
    expect(q.question).toBe('What is 2+2?');
    expect(q.categoryId).toBe(1);
    expect(q.topic).toBe('math');
    expect(q.type).toBe('direct');
    expect(q.directAnswer).toBe('4');
    expect(q.supportsBothModes).toBe(false);
    expect(q.createdAt).toBeDefined();
    expect(q.updatedAt).toBeDefined();
  });

  it('lists all questions', () => {
    QuestionService.create({ question: 'Q1', categoryId: null, topic: 'a', type: 'direct', directAnswer: 'A1', options: ['', '', '', ''], correctOptionIndex: null, supportsBothModes: false });
    QuestionService.create({ question: 'Q2', categoryId: null, topic: 'b', type: 'direct', directAnswer: 'A2', options: ['', '', '', ''], correctOptionIndex: null, supportsBothModes: false });

    const all = QuestionService.getAll();
    expect(all).toHaveLength(2);
  });

  it('updates a question', () => {
    const q = QuestionService.create({ question: 'Old', categoryId: null, topic: 'a', type: 'direct', directAnswer: 'A', options: ['', '', '', ''], correctOptionIndex: null, supportsBothModes: false });
    const updated = QuestionService.update(q.id, { question: 'New' });
    expect(updated?.question).toBe('New');
  });

  it('deletes a question', () => {
    const q = QuestionService.create({ question: 'Q', categoryId: null, topic: 'a', type: 'direct', directAnswer: 'A', options: ['', '', '', ''], correctOptionIndex: null, supportsBothModes: false });
    expect(QuestionService.getAll()).toHaveLength(1);
    QuestionService.delete(q.id);
    expect(QuestionService.getAll()).toHaveLength(0);
  });

  it('filters by category', () => {
    QuestionService.create({ question: 'Q1', categoryId: 1, topic: 'a', type: 'direct', directAnswer: 'A1', options: ['', '', '', ''], correctOptionIndex: null, supportsBothModes: false });
    QuestionService.create({ question: 'Q2', categoryId: 2, topic: 'a', type: 'direct', directAnswer: 'A2', options: ['', '', '', ''], correctOptionIndex: null, supportsBothModes: false });

    const filtered = QuestionService.filter({ categoryId: 1 });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].question).toBe('Q1');
  });

  it('filters by topic', () => {
    QuestionService.create({ question: 'Q1', categoryId: null, topic: 'math', type: 'direct', directAnswer: 'A1', options: ['', '', '', ''], correctOptionIndex: null, supportsBothModes: false });
    QuestionService.create({ question: 'Q2', categoryId: null, topic: 'science', type: 'direct', directAnswer: 'A2', options: ['', '', '', ''], correctOptionIndex: null, supportsBothModes: false });

    const filtered = QuestionService.filter({ topic: 'math' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].question).toBe('Q1');
  });

  it('filters by supportsBothModes', () => {
    QuestionService.create({ question: 'Q1', categoryId: null, topic: 'a', type: 'direct', directAnswer: 'A1', options: ['', '', '', ''], correctOptionIndex: null, supportsBothModes: true });
    QuestionService.create({ question: 'Q2', categoryId: null, topic: 'a', type: 'direct', directAnswer: 'A2', options: ['', '', '', ''], correctOptionIndex: null, supportsBothModes: false });

    const filtered = QuestionService.filter({ supportsBothModes: true });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].question).toBe('Q1');
  });

  it('filters by search text', () => {
    QuestionService.create({ question: 'What is JavaScript?', categoryId: null, topic: 'a', type: 'direct', directAnswer: 'A1', options: ['', '', '', ''], correctOptionIndex: null, supportsBothModes: false });
    QuestionService.create({ question: 'What is Python?', categoryId: null, topic: 'a', type: 'direct', directAnswer: 'A2', options: ['', '', '', ''], correctOptionIndex: null, supportsBothModes: false });

    const filtered = QuestionService.filter({ searchText: 'java' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].question).toBe('What is JavaScript?');
  });

  it('imports valid JSON questions', () => {
    const categories = [{ id: 1, name: 'General' }];
    const json = JSON.stringify([
      { question: 'Q1', answer: 'A1', topic: 'math', categoryId: 1, type: 'direct' },
      { question: 'Q2', answer: 'A2', topic: 'math', categoryId: 1, type: 'multiple-choice', options: ['A', 'B', 'C', 'D'], correctOptionIndex: 0 },
    ]);

    const summary = QuestionService.importFromJSON(json, categories);
    expect(summary.imported).toBe(2);
    expect(summary.ignored).toBe(0);
    expect(QuestionService.getAll()).toHaveLength(2);
  });

  it('ignores invalid JSON entries', () => {
    const categories = [{ id: 1, name: 'General' }];
    const json = JSON.stringify([
      { question: '', answer: 'A1', topic: 'math', type: 'direct' },
      { question: 'Q2', answer: 'A2', topic: 'math', type: 'multiple-choice', options: ['A', 'B', 'C'], correctOptionIndex: 0 },
      { question: 'Q3', answer: 'A3', topic: 'math', categoryId: 999, type: 'direct' },
    ]);

    const summary = QuestionService.importFromJSON(json, categories);
    expect(summary.imported).toBe(0);
    expect(summary.ignored).toBe(3);
    expect(summary.errors.length).toBe(3);
  });
});
