import type { Question, ImportSummary, QuestionType } from '@/types/study'

const API_BASE = '/api/study'

export interface QuestionInput {
  question: string;
  categoryId: number | null;
  topic: string;
  type: QuestionType;
  directAnswer: string;
  options: string[];
  correctOptionIndex: number | null;
  supportsBothModes: boolean;
}

export const QuestionService = {
  async getAll(): Promise<Question[]> {
    const res = await fetch(`${API_BASE}/questions`)
    if (!res.ok) throw new Error('Failed to fetch questions')
    return res.json()
  },

  async getById(id: string): Promise<Question | undefined> {
    const all = await this.getAll()
    return all.find((q) => q.id === id)
  },

  async create(data: QuestionInput): Promise<Question> {
    const res = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to create question')
    return res.json()
  },

  async update(id: string, data: Partial<QuestionInput>): Promise<Question | null> {
    const res = await fetch(`${API_BASE}/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return null
    return res.json()
  },

  async delete(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/questions/${id}`, { method: 'DELETE' })
    return res.ok
  },

  async filter(filters: { categoryId?: number | null; topic?: string | null; mode?: 'direct' | 'multiple-choice' | 'dual' | null; searchText?: string | null }): Promise<Question[]> {
    const params = new URLSearchParams()
    if (filters.categoryId !== undefined && filters.categoryId !== null) params.set('categoryId', String(filters.categoryId))
    if (filters.topic) params.set('topic', filters.topic)
    if (filters.mode) params.set('mode', filters.mode)
    if (filters.searchText) params.set('search', filters.searchText)

    const res = await fetch(`${API_BASE}/questions?${params.toString()}`)
    if (!res.ok) throw new Error('Failed to filter questions')
    return res.json()
  },

  async getTopics(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/topics`)
    if (!res.ok) throw new Error('Failed to fetch topics')
    return res.json()
  },

  async getCategoriesUsed(): Promise<number[]> {
    const questions = await this.getAll()
    const cats = new Set(questions.map((q) => q.categoryId).filter((c): c is number => c !== null))
    return Array.from(cats)
  },

  async importFromJSON(jsonString: string, existingCategories: { id: number; name: string }[]): Promise<ImportSummary> {
    const parsed = JSON.parse(jsonString)
    const items = Array.isArray(parsed) ? parsed : [parsed]

    const res = await fetch(`${API_BASE}/questions/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    })

    if (!res.ok) throw new Error('Failed to import questions')
    return res.json()
  },
}
