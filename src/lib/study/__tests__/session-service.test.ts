import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SessionService } from '@/lib/study/session-service';
import type { StudySessionConfig } from '@/types/study';

describe('SessionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const config: StudySessionConfig = {
    questionCount: 5,
    timeLimit: null,
    timeLimitMode: null,
    topics: 'all',
    questionType: 'direct',
  };

  it('creates and retrieves an active session', async () => {
    const mockSession = { id: 'sess1', status: 'active', questionIds: ['q1', 'q2', 'q3'] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSession,
    });

    const session = await SessionService.createSession(config, ['q1', 'q2', 'q3']);
    expect(session.status).toBe('active');
    expect(session.questionIds).toEqual(['q1', 'q2', 'q3']);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockSession,
    });
    const active = await SessionService.getActiveSession();
    expect(active).not.toBeNull();
  });

  it('records an answer and advances index', async () => {
    const mockSession = { id: 'sess1', answers: [{ isCorrect: true }], currentIndex: 1 };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockSession });

    const updated = await SessionService.recordAnswer(
      { id: 'sess1' } as any,
      { questionId: 'q1', questionText: 'Q1', userAnswer: 'A1', correctAnswer: 'A1', isCorrect: true, modeUsed: 'direct', timeSpent: 5 }
    );

    expect(updated.answers).toHaveLength(1);
    expect(updated.currentIndex).toBe(1);
  });

  it('completes a session', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    await SessionService.completeSession('sess1');
    expect(fetch).toHaveBeenCalledWith('/api/study/sessions/sess1/complete', expect.any(Object));
  });

  it('abandons a session', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    await SessionService.abandonSession('sess1');
    expect(fetch).toHaveBeenCalledWith('/api/study/sessions/sess1/complete', expect.any(Object));
  });

  it('retrieves previous results', async () => {
    const mockResults = [{ id: 'r1', correctCount: 1 }];
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockResults });

    const prev = await SessionService.getPreviousResult(config);
    expect(prev).not.toBeNull();
    expect(prev?.correctCount).toBe(1);
  });
});
