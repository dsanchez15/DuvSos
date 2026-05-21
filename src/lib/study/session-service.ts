import type {
  StudySession,
  StudySessionConfig,
  SessionResult,
  SessionAnswer,
  SessionStatus,
} from '@/types/study';

const SESSIONS_KEY = 'aure-study-sessions';
const RESULTS_KEY = 'aure-study-results';
const ACTIVE_SESSION_KEY = 'aure-study-active-session';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getStoredSessions(): StudySession[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(SESSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSessions(sessions: StudySession[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function getStoredResults(): SessionResult[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(RESULTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveResults(results: SessionResult[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(RESULTS_KEY, JSON.stringify(results));
}

export const StudySessionService = {
  getActiveSession(): StudySession | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    try {
      const session: StudySession = JSON.parse(raw);
      const age = Date.now() - new Date(session.startedAt).getTime();
      if (age > ONE_WEEK_MS) {
        this.discardActiveSession();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  hasActiveSession(): boolean {
    return this.getActiveSession() !== null;
  },

  isActiveSessionExpired(): boolean {
    if (typeof window === 'undefined') return false;
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return false;
    try {
      const session: StudySession = JSON.parse(raw);
      const age = Date.now() - new Date(session.startedAt).getTime();
      return age > ONE_WEEK_MS;
    } catch {
      return false;
    }
  },

  createSession(config: StudySessionConfig, questionIds: string[]): StudySession {
    const now = new Date().toISOString();
    const session: StudySession = {
      id: crypto.randomUUID(),
      config,
      status: 'active',
      startedAt: now,
      lastActivityAt: now,
      questionIds,
      currentIndex: 0,
      answers: [],
      totalTimeSpent: 0,
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    return session;
  },

  saveActiveSession(session: StudySession): void {
    if (typeof window === 'undefined') return;
    session.lastActivityAt = new Date().toISOString();
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  },

  discardActiveSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  },

  recordAnswer(session: StudySession, answer: SessionAnswer): StudySession {
    session.answers.push(answer);
    session.totalTimeSpent += answer.timeSpent;
    session.currentIndex++;
    session.lastActivityAt = new Date().toISOString();
    this.saveActiveSession(session);
    return session;
  },

  completeSession(session: StudySession): SessionResult {
    session.status = 'completed';
    const now = new Date().toISOString();
    const result: SessionResult = {
      id: crypto.randomUUID(),
      sessionId: session.id,
      config: session.config,
      totalQuestions: session.answers.length,
      correctCount: session.answers.filter((a) => a.isCorrect).length,
      incorrectCount: session.answers.filter((a) => !a.isCorrect).length,
      accuracyPercentage: session.answers.length > 0
        ? Math.round((session.answers.filter((a) => a.isCorrect).length / session.answers.length) * 100)
        : 0,
      totalTimeSpent: session.totalTimeSpent,
      completedAt: now,
    };

    // Save to history
    const sessions = getStoredSessions();
    sessions.push(session);
    saveSessions(sessions);

    const results = getStoredResults();
    results.push(result);
    saveResults(results);

    this.discardActiveSession();
    return result;
  },

  abandonSession(session: StudySession): SessionResult {
    session.status = 'abandoned';
    return this.completeSession(session);
  },

  getResults(): SessionResult[] {
    return getStoredResults();
  },

  getPreviousResult(config: StudySessionConfig): SessionResult | null {
    const results = getStoredResults();
    const matching = results.filter((r) => {
      const sameType = r.config.questionType === config.questionType;
      const sameTopics =
        config.topics === 'all'
          ? r.config.topics === 'all'
          : Array.isArray(r.config.topics) &&
            Array.isArray(config.topics) &&
            r.config.topics.length === config.topics.length &&
            r.config.topics.every((t) => config.topics.includes(t));
      return sameType && sameTopics;
    });
    if (matching.length === 0) return null;
    return matching.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
  },

  cleanupExpiredSessions(): void {
    if (typeof window === 'undefined') return;
    const sessions = getStoredSessions();
    const now = Date.now();
    const filtered = sessions.filter((s) => {
      const age = now - new Date(s.startedAt).getTime();
      return age <= ONE_WEEK_MS;
    });
    if (filtered.length !== sessions.length) {
      saveSessions(filtered);
    }
    // Also check active session
    if (this.isActiveSessionExpired()) {
      this.discardActiveSession();
    }
  },
};
