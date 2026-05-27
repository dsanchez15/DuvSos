import type { StudySession, StudySessionConfig, SessionResult, SessionAnswer, Question } from '@/types/study'

const API_BASE = '/api/study'

export const SessionService = {
  async getActiveSession(): Promise<StudySession | null> {
    const res = await fetch(`${API_BASE}/sessions/active`)
    if (!res.ok) return null
    const data = await res.json()
    return data || null
  },

  async startSession(config: StudySessionConfig, questionIds: string[]): Promise<StudySession> {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, questionIds }),
    })
    if (!res.ok) throw new Error('Failed to start session')
    return res.json()
  },

  async saveAnswer(sessionId: string, answer: SessionAnswer): Promise<void> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answer),
    })
    if (!res.ok) throw new Error('Failed to save answer')
  },

  async completeSession(sessionId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
    if (!res.ok) throw new Error('Failed to complete session')
  },

  async abandonSession(sessionId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'abandoned' }),
    })
    if (!res.ok) throw new Error('Failed to abandon session')
  },

  async getResults(): Promise<SessionResult[]> {
    const res = await fetch(`${API_BASE}/sessions/results`)
    if (!res.ok) throw new Error('Failed to fetch results')
    return res.json()
  },

  // Compatibility methods for old API
  async createSession(config: StudySessionConfig, questionIds: string[]): Promise<StudySession> {
    return this.startSession(config, questionIds)
  },

  async saveActiveSession(_session: StudySession): Promise<void> {
    // No-op in new API; session is already persisted
  },

  async recordAnswer(session: StudySession, answer: SessionAnswer): Promise<StudySession> {
    await this.saveAnswer(session.id, answer)
    // Re-fetch session to get updated state
    const res = await fetch(`${API_BASE}/sessions/active`)
    if (!res.ok) return session
    return res.json()
  },

  async getPreviousResult(_config: StudySessionConfig): Promise<SessionResult | null> {
    const results = await this.getResults()
    return results[0] || null
  },

  async discardActiveSession(): Promise<void> {
    const active = await this.getActiveSession()
    if (active) {
      await this.abandonSession(active.id)
    }
  },

  cleanupExpiredSessions(): void {
    // No-op in new API; sessions are managed server-side
  },
}
