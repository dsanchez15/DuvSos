'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { apiClient, ApiError } from '@/lib/api-client'
import { recalcTodoParent } from '@/lib/todo-utils'
import type { Todo, TodoCategory, TodoMetrics, GroupedTodos } from '@/types/todo'

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

export interface TodoQuery {
  viewMode: string
  groupBy: string
  search: string
  priority: string
  category: string
  status: string
}

export interface EditTodoData {
  title: string
  description?: string
  priority: string
  dueDate?: string
  dueTime?: string
  effortMinutes: number
  categoryId: number | null
}

/**
 * Extracts the server-provided error message from an ApiError,
 * falling back to a translated generic message.
 */
function serverMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError && e.data && typeof (e.data as { error?: unknown }).error === 'string') {
    return (e.data as { error: string }).error
  }
  return fallback
}

export function useTodos(t: TranslateFn) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [groupedTodos, setGroupedTodos] = useState<GroupedTodos | null>(null)
  const [categories, setCategories] = useState<TodoCategory[]>([])
  const [metrics, setMetrics] = useState<TodoMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [apiError, setApiError] = useState('')
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)

  // Refs keep async callbacks stable while reading fresh state
  const todosRef = useRef(todos)
  const groupedRef = useRef(groupedTodos)
  const selectedRef = useRef(selectedTodo)
  const tRef = useRef(t)
  const queryRef = useRef<TodoQuery | null>(null)

  useEffect(() => { todosRef.current = todos }, [todos])
  useEffect(() => { groupedRef.current = groupedTodos }, [groupedTodos])
  useEffect(() => { selectedRef.current = selectedTodo }, [selectedTodo])
  useEffect(() => { tRef.current = t }, [t])

  const refreshMetrics = useCallback(async () => {
    try {
      const data = await apiClient.get<TodoMetrics>('/api/todos/metrics')
      setMetrics(data)
    } catch {
      // Metrics are best-effort; original code ignored failures
    }
  }, [])

  const fetchTodos = useCallback(async (query: TodoQuery) => {
    queryRef.current = query
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (query.viewMode !== 'all') params.set('view', query.viewMode)
      if (query.groupBy !== 'none') params.set('groupBy', query.groupBy)
      if (query.search) params.set('search', query.search)

      const filters = []
      if (query.priority) filters.push({ field: 'priority', op: 'eq', value: query.priority })
      if (query.category) filters.push({ field: 'category_id', op: 'eq', value: query.category })
      if (query.status) filters.push({ field: 'status', op: 'eq', value: query.status })
      if (filters.length > 0) params.set('filters', JSON.stringify(filters))

      const queryString = params.toString()
      const url = `/api/todos${queryString ? `?${queryString}` : ''}`

      let todosData: Todo[] | GroupedTodos
      let categoriesData: TodoCategory[]
      try {
        ;[todosData, categoriesData] = await Promise.all([
          apiClient.get<Todo[] | GroupedTodos>(url),
          apiClient.get<TodoCategory[]>('/api/todo-categories'),
        ])
      } catch (e) {
        throw new Error(serverMessage(e, tRef.current('todos.errors.fetchTodos')))
      }

      if (query.groupBy !== 'none' && !Array.isArray(todosData)) {
        setGroupedTodos(todosData)
        setTodos([])
      } else {
        setTodos(Array.isArray(todosData) ? todosData : [])
        setGroupedTodos(null)
      }

      setCategories(categoriesData)
      await refreshMetrics()
    } catch (err) {
      setError(err instanceof Error ? err.message : tRef.current('todos.errors.loadTodos'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [refreshMetrics])

  const refetchCurrent = useCallback(async () => {
    if (queryRef.current) await fetchTodos(queryRef.current)
  }, [fetchTodos])

  /** Applies an updater to every visible list (grouped or flat). */
  const applyToLists = useCallback((updater: (list: Todo[]) => Todo[]) => {
    setGroupedTodos((prev) =>
      prev ? Object.fromEntries(Object.entries(prev).map(([key, list]) => [key, updater(list)])) : prev
    )
    setTodos((prev) => updater(prev))
  }, [])

  const createTodo = useCallback(async (title: string): Promise<void> => {
    setApiError('')
    const tempId = -Date.now()
    const tempTodo: Todo = {
      id: tempId,
      title,
      completed: false,
      priority: 'normal',
      effortMinutes: 0,
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subTasks: [],
      progress: 0,
      subTasksCount: 0,
      completedSubTasksCount: 0,
    }

    if (!groupedRef.current) setTodos((prev) => [tempTodo, ...prev])

    try {
      const realTodo = await apiClient.post<Todo>('/api/todos', {
        title,
        priority: 'normal',
        effortMinutes: 0,
      })
      if (!groupedRef.current) {
        setTodos((prev) => prev.map((todo) => (todo.id === tempId ? realTodo : todo)))
      } else {
        await refetchCurrent()
      }
      await refreshMetrics()
    } catch (e) {
      console.error(e)
      setApiError(
        e instanceof ApiError
          ? serverMessage(e, tRef.current('todos.errors.createTodo'))
          : tRef.current('todos.errors.networkError')
      )
      if (!groupedRef.current) setTodos((prev) => prev.filter((todo) => todo.id !== tempId))
    }
  }, [refreshMetrics, refetchCurrent])

  const createSubtask = useCallback(async (parentId: number, title: string) => {
    const tempId = -Date.now()
    const tempSub = { id: tempId, title: title.trim(), completed: false, position: 0 }

    applyToLists((list) =>
      list.map((todo) =>
        todo.id === parentId
          ? recalcTodoParent({ ...todo, subTasks: [...(todo.subTasks || []), tempSub] })
          : todo
      )
    )

    try {
      const realSub = await apiClient.post<Todo>('/api/todos', {
        title: title.trim(),
        parentId,
        priority: 'normal',
      })

      applyToLists((list) =>
        list.map((todo) => {
          if (todo.id !== parentId) return todo
          const nextSubs = (todo.subTasks || []).map((s) =>
            s.id === tempId
              ? { id: realSub.id, title: realSub.title, completed: realSub.completed, position: realSub.position }
              : s
          )
          return recalcTodoParent({ ...todo, subTasks: nextSubs })
        })
      )

      if (selectedRef.current?.id === parentId) {
        try {
          setSelectedTodo(await apiClient.get<Todo>(`/api/todos/${parentId}`))
        } catch {
          // selected todo refresh is best-effort
        }
      }
      await refreshMetrics()
    } catch (err) {
      console.error(err)
      applyToLists((list) =>
        list.map((todo) =>
          todo.id === parentId
            ? recalcTodoParent({ ...todo, subTasks: (todo.subTasks || []).filter((s) => s.id !== tempId) })
            : todo
        )
      )
    }
  }, [applyToLists, refreshMetrics])

  const toggleTodo = useCallback(async (id: number, completed: boolean) => {
    const snapshotTodos = todosRef.current
    const snapshotGrouped = groupedRef.current

    applyToLists((list) =>
      list.map((todo) => {
        if (todo.id === id) {
          const nextSubs = (todo.subTasks || []).map((s) => ({ ...s, completed }))
          return recalcTodoParent({ ...todo, completed, subTasks: nextSubs })
        }
        if (todo.subTasks?.some((s) => s.id === id)) {
          const nextSubs = todo.subTasks.map((s) => (s.id === id ? { ...s, completed } : s))
          const parentCompleted = nextSubs.every((s) => s.completed)
          return recalcTodoParent({ ...todo, completed: parentCompleted, subTasks: nextSubs })
        }
        return todo
      })
    )

    if (selectedRef.current?.id === id) {
      setSelectedTodo((prev) => (prev ? { ...prev, completed } : prev))
    }

    try {
      await apiClient.put('/api/todos', { id, completed })
      await refreshMetrics()
      if (selectedRef.current?.id === id) {
        try {
          setSelectedTodo(await apiClient.get<Todo>(`/api/todos/${id}`))
        } catch {
          // selected todo refresh is best-effort
        }
      }
    } catch (err) {
      console.error(err)
      setTodos(snapshotTodos)
      setGroupedTodos(snapshotGrouped)
    }
  }, [applyToLists, refreshMetrics])

  const deleteTodo = useCallback(async (id: number) => {
    const snapshotTodos = todosRef.current
    const snapshotGrouped = groupedRef.current

    applyToLists((list) =>
      list
        .filter((todo) => todo.id !== id)
        .map((todo) =>
          todo.subTasks?.some((s) => s.id === id)
            ? recalcTodoParent({ ...todo, subTasks: todo.subTasks.filter((s) => s.id !== id) })
            : todo
        )
    )

    if (selectedRef.current?.id === id) setSelectedTodo(null)

    try {
      await apiClient.delete(`/api/todos/${id}`)
      await refreshMetrics()
    } catch (err) {
      console.error(err)
      setTodos(snapshotTodos)
      setGroupedTodos(snapshotGrouped)
    }
  }, [applyToLists, refreshMetrics])

  const editTodo = useCallback(async (id: number, data: EditTodoData): Promise<boolean> => {
    setApiError('')
    const snapshotTodos = todosRef.current
    const snapshotGrouped = groupedRef.current
    const category = categories.find((c) => c.id === (data.categoryId ?? undefined))

    applyToLists((list) =>
      list.map((todo) =>
        todo.id === id
          ? recalcTodoParent({
              ...todo,
              title: data.title,
              description: data.description,
              priority: data.priority,
              dueDate: data.dueDate,
              dueTime: data.dueTime,
              effortMinutes: data.effortMinutes,
              categoryId: data.categoryId ?? undefined,
              category: category || todo.category,
            })
          : todo
      )
    )

    try {
      const updatedTodo = await apiClient.put<Todo>('/api/todos', { id, ...data })
      if (selectedRef.current?.id === id) setSelectedTodo(updatedTodo)
      await refreshMetrics()
      return true
    } catch (e) {
      console.error(e)
      setApiError(
        e instanceof ApiError
          ? serverMessage(e, tRef.current('todos.errors.updateTodo'))
          : tRef.current('todos.errors.networkError')
      )
      setTodos(snapshotTodos)
      setGroupedTodos(snapshotGrouped)
      return false
    }
  }, [applyToLists, categories, refreshMetrics])

  return {
    todos,
    groupedTodos,
    categories,
    metrics,
    loading,
    error,
    apiError,
    selectedTodo,
    setApiError,
    setSelectedTodo,
    fetchTodos,
    createTodo,
    createSubtask,
    toggleTodo,
    deleteTodo,
    editTodo,
  }
}
