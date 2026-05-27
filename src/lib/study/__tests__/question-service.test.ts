import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestionService } from '@/lib/study/question-service';

describe('QuestionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getAll fetches questions from API', async () => {
    const mockQuestions = [
      { id: '1', question: 'Q1', topic: 'math', type: 'direct' },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockQuestions,
    });

    const result = await QuestionService.getAll();
    expect(result).toEqual(mockQuestions);
    expect(fetch).toHaveBeenCalledWith('/api/study/questions');
  });

  it('create sends POST request', async () => {
    const mockQuestion = { id: '1', question: 'Q1', topic: 'math', type: 'direct' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockQuestion,
    });

    const result = await QuestionService.create({
      question: 'Q1',
      categoryId: null,
      topic: 'math',
      type: 'direct',
      directAnswer: 'A1',
      options: ['', '', '', ''],
      correctOptionIndex: null,
      supportsBothModes: false,
    });
    expect(result).toEqual(mockQuestion);
  });

  it('delete sends DELETE request', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    const result = await QuestionService.delete('1');
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/study/questions/1', { method: 'DELETE' });
  });

  it('filter sends request with query params', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    await QuestionService.filter({ categoryId: 1, topic: 'math' });
    expect(fetch).toHaveBeenCalledWith('/api/study/questions?categoryId=1&topic=math');
  });

  it('importFromJSON sends POST request', async () => {
    const summary = { imported: 2, ignored: 0, errors: [] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => summary,
    });

    const result = await QuestionService.importFromJSON(
      JSON.stringify([{ question: 'Q1', answer: 'A1', topic: 'math', type: 'direct' }]),
      [{ id: 1, name: 'General' }]
    );
    expect(result).toEqual(summary);
  });
});
