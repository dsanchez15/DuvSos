import type { StudySettings } from '@/types/study'

const API_BASE = '/api/study'

export const SettingsStore = {
  async getSettings(): Promise<StudySettings> {
    const res = await fetch(`${API_BASE}/settings`)
    if (!res.ok) throw new Error('Failed to fetch settings')
    return res.json()
  },

  async updateSettings(settings: Partial<StudySettings>): Promise<StudySettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (!res.ok) throw new Error('Failed to update settings')
    return res.json()
  },
}
