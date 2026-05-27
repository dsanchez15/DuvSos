import type { StudyTopic } from '@/types/study'

const API_BASE = '/api/study'

export const TopicService = {
  async getAll(): Promise<StudyTopic[]> {
    const res = await fetch(`${API_BASE}/topics`)
    if (!res.ok) throw new Error('Failed to fetch topics')
    return res.json()
  },

  async getById(id: string): Promise<StudyTopic | undefined> {
    const all = await this.getAll()
    return all.find((t) => t.id === id)
  },

  async create(name: string): Promise<StudyTopic | null> {
    const res = await fetch(`${API_BASE}/topics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) return null
    return res.json()
  },

  async delete(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/topics/${id}`, { method: 'DELETE' })
    return res.ok
  },
}
