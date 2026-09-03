'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { QuestionService, type QuestionInput } from '@/lib/study/question-service'
import { TopicService } from '@/lib/study/topic-service'
import type { Question, QuestionFilter, ImportSummary } from '@/types/study'

export interface CategoryOption {
  id: number
  name: string
}

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [topics, setTopics] = useState<string[]>([])
  const [filters, setFilters] = useState<QuestionFilter>({})
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    const qs = await QuestionService.filter(filters)
    setQuestions(qs)
    const ts = await TopicService.getAll()
    setTopics(ts.map((topic) => topic.name))
  }, [filters])

  useEffect(() => {
    loadData()
    apiClient
      .get<CategoryOption[]>('/api/todo-categories')
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [loadData])

  const applySearch = useCallback(() => {
    setFilters((f) => ({ ...f, searchText: searchQuery.trim() || null }))
  }, [searchQuery])

  const clearFilters = useCallback(() => {
    setFilters({})
    setSearchQuery('')
  }, [])

  const saveQuestion = useCallback(
    async (editingId: string | null, data: QuestionInput) => {
      if (editingId) {
        await QuestionService.update(editingId, data)
      } else {
        await QuestionService.create(data)
      }
      await loadData()
    },
    [loadData]
  )

  const deleteQuestion = useCallback(
    async (id: string) => {
      await QuestionService.delete(id)
      await loadData()
    },
    [loadData]
  )

  const importQuestions = useCallback(
    async (jsonText: string): Promise<ImportSummary> => {
      const summary = await QuestionService.importFromJSON(jsonText, categories)
      await loadData()
      return summary
    },
    [categories, loadData]
  )

  return {
    questions,
    categories,
    topics,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    applySearch,
    clearFilters,
    saveQuestion,
    deleteQuestion,
    importQuestions,
  }
}
