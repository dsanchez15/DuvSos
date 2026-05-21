import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StudySessionService } from '@/lib/study/session-service';
import type { StudySessionConfig } from '@/types/study';

const ACTIVE_SESSION_KEY = 'aure-study-active-session';
const SESSIONS_KEY = 'aure-study-sessions';
const RESULTS_KEY = 'aure-study-results';

describe('StudySessionService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const config: StudySessionConfig = {
    questionCount: 5,
    timeLimit: null,
    timeLimitMode: null,
    topics: 'all',
    questionType: 'direct',
  };

  it('creates and retrieves an active session', () => {
    const session = StudySessionService.createSession(config, ['q1', 'q2', 'q3']);
    expect(session.status).toBe('active');
    expect(session.questionIds).toEqual(['q1', 'q2', 'q3']);

    const active = StudySessionService.getActiveSession();
    expect(active).not.toBeNull();
    expect(active?.id).toBe(session.id);
  });

  it('records an answer and advances index', () => {
    const session = StudySessionService.createSession(config, ['q1', 'q2']);
    const updated = StudySessionService.recordAnswer(session, {
      questionId: 'q1',
      questionText: 'Q1',
      userAnswer: 'A1',
      correctAnswer: 'A1',
      isCorrect: true,
      modeUsed: 'direct',
      timeSpent: 5,
    });

    expect(updated.answers).toHaveLength(1);
    expect(updated.currentIndex).toBe(1);
    expect(updated.answers[0].isCorrect).toBe(true);
  });

  it('completes a session and stores result', () => {
    const session = StudySessionService.createSession(config, ['q1', 'q2']);
    StudySessionService.recordAnswer(session, {
      questionId: 'q1', questionText: 'Q1', userAnswer: 'A1', correctAnswer: 'A1', isCorrect: true, modeUsed: 'direct', timeSpent: 5,
    });
    StudySessionService.recordAnswer(session, {
      questionId: 'q2', questionText: 'Q2', userAnswer: 'B2', correctAnswer: 'A2', isCorrect: false, modeUsed: 'direct', timeSpent: 3,
    });

    const result = StudySessionService.completeSession(session);
    expect(result.totalQuestions).toBe(2);
    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(1);
    expect(result.accuracyPercentage).toBe(50);
    expect(StudySessionService.getActiveSession()).toBeNull();
  });

  it('abandons a session with partial results', () => {
    const session = StudySessionService.createSession(config, ['q1', 'q2', 'q3']);
    StudySessionService.recordAnswer(session, {
      questionId: 'q1', questionText: 'Q1', userAnswer: 'A1', correctAnswer: 'A1', isCorrect: true, modeUsed: 'direct', timeSpent: 5,
    });

    const result = StudySessionService.abandonSession(session);
    expect(result.totalQuestions).toBe(1);
    expect(result.correctCount).toBe(1);
    expect(result.status ?? 'abandoned').toBeTruthy();
  });

  it('retrieves previous result for same config', () => {
    const session1 = StudySessionService.createSession(config, ['q1']);
    StudySessionService.recordAnswer(session1, {
      questionId: 'q1', questionText: 'Q1', userAnswer: 'A1', correctAnswer: 'A1', isCorrect: true, modeUsed: 'direct', timeSpent: 5,
    });
    StudySessionService.completeSession(session1);

    const prev = StudySessionService.getPreviousResult(config);
    expect(prev).not.toBeNull();
    expect(prev?.correctCount).toBe(1);
  });

  it('expires sessions older than 7 days', () => {
    const session = StudySessionService.createSession(config, ['q1']);
    // Simulate 8 days passing
    const eightDaysLater = Date.now() + 8 * 24 * 60 * 60 * 1000;
    vi.setSystemTime(eightDaysLater);

    const active = StudySessionService.getActiveSession();
    expect(active).toBeNull();
  });

  it('cleans up expired sessions from storage', () => {
    const session = StudySessionService.createSession(config, ['q1']);
    StudySessionService.recordAnswer(session, {
      questionId: 'q1', questionText: 'Q1', userAnswer: 'A1', correctAnswer: 'A1', isCorrect: true, modeUsed: 'direct', timeSpent: 5,
    });
    StudySessionService.completeSession(session);

    const eightDaysLater = Date.now() + 8 * 24 * 60 * 60 * 1000;
    vi.setSystemTime(eightDaysLater);

    StudySessionService.cleanupExpiredSessions();
    // cleanup removes expired sessions from stored sessions key
    const storedSessionsRaw = localStorage.getItem(SESSIONS_KEY);
    const storedSessions = storedSessionsRaw ? JSON.parse(storedSessionsRaw) : [];
    expect(storedSessions).toHaveLength(0);
  });
});
