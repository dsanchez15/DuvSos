'use client'

import { useState, useEffect, useCallback } from 'react'
import AppLayout from '@/components/AppLayout'
import ChecklistList from '@/components/ChecklistList'
import ChecklistForm from '@/components/ChecklistForm'
import CategoryManager from '@/components/CategoryManager'
import Toast from '@/components/Toast'
import { useAppTranslation } from '@/components/LanguageProvider'
import { Checklist, ChecklistCategory, ChecklistFilter, ChecklistFormData, ChecklistItem, Priority, ChecklistTab } from '@/types/checklist'
import { SortOption } from '@/components/ChecklistList'

export default function ChecklistsPage() {
  const { t } = useAppTranslation()
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [templates, setTemplates] = useState<Checklist[]>([])
  const [history, setHistory] = useState<Checklist[]>([])
  const [categories, setCategories] = useState<ChecklistCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [tab, setTab] = useState<ChecklistTab>('active')
  const [filter, setFilter] = useState<ChecklistFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [toast, setToast] = useState<string | null>(null)
  const [instantiatingTemplate, setInstantiatingTemplate] = useState<Checklist | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [cl, tmpl, hist, cat] = await Promise.all([
        fetch('/api/checklists').then(r => r.json()),
        fetch('/api/checklists/templates').then(r => r.json()),
        fetch('/api/checklists/history').then(r => r.json()),
        fetch('/api/checklist-categories').then(r => r.json()),
      ])
      setChecklists(Array.isArray(cl) ? cl : [])
      setTemplates(Array.isArray(tmpl) ? tmpl : [])
      setHistory(Array.isArray(hist) ? hist : [])
      setCategories(cat)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const api = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) })
    if (!res.ok) throw new Error(t('checklists.errors.api'))
    return res.json()
  }

  const getActiveChecklists = () => checklists.filter(c => c.lifecycleState !== 'Archived' && !c.isTemplate)

  // Helper to update items in any of the three lists
  const updateChecklistItems = (checklistId: number, updater: (items: ChecklistItem[]) => ChecklistItem[]) => {
    setChecklists(prev => prev.map(c => c.id === checklistId ? { ...c, items: updater(c.items) } : c))
    setTemplates(prev => prev.map(c => c.id === checklistId ? { ...c, items: updater(c.items) } : c))
    setHistory(prev => prev.map(c => c.id === checklistId ? { ...c, items: updater(c.items) } : c))
  }

  const handleSaveChecklist = async (data: ChecklistFormData) => {
    if (instantiatingTemplate) {
      const instance = await api(`/api/checklists/templates/${instantiatingTemplate.id}/instantiate`, 'POST', {
        title: data.title,
        description: data.description,
        color: data.color,
        startDate: data.startDate,
        endDate: data.endDate,
        categoryId: data.categoryId,
      })
      setChecklists(prev => [instance, ...prev])
      setTab('active')
      setExpandedId(instance.id)
      setInstantiatingTemplate(null)
      setEditingChecklist(null)
      setToast(t('checklists.toast.templateInstantiated'))
    } else if (editingChecklist) {
      const updated = await api(`/api/checklists/${editingChecklist.id}`, 'PUT', data)
      if (updated.isTemplate) {
        setTemplates(prev => prev.map(c => c.id === updated.id ? updated : c))
      } else {
        setChecklists(prev => prev.map(c => c.id === updated.id ? updated : c))
      }
    } else {
      if (data.isTemplate) {
        const created = await api('/api/checklists/templates', 'POST', data)
        setTemplates(prev => [created, ...prev])
      } else {
        const created = await api('/api/checklists', 'POST', data)
        setChecklists(prev => [created, ...prev])
        setExpandedId(created.id)
      }
    }
    setShowForm(false)
    setEditingChecklist(null)
  }

  const handleDeleteChecklist = async (id: number) => {
    await api(`/api/checklists/${id}`, 'DELETE')
    setChecklists(prev => prev.filter(c => c.id !== id))
    setTemplates(prev => prev.filter(c => c.id !== id))
    setHistory(prev => prev.filter(c => c.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const handleDuplicate = async (id: number) => {
    const copy = await api(`/api/checklists/${id}/duplicate`, 'POST')
    if (copy.isTemplate) {
      setTemplates(prev => [copy, ...prev])
    } else {
      setChecklists(prev => [copy, ...prev])
    }
  }

  const handleArchive = async (id: number) => {
    const archived = await api(`/api/checklists/${id}/archive`, 'POST')
    setChecklists(prev => prev.filter(c => c.id !== id))
    setTemplates(prev => prev.filter(c => c.id !== id))
    setHistory(prev => [archived, ...prev])
  }

  const handleInstantiateTemplate = (template: Checklist) => {
    const draft: Checklist = { ...template, isTemplate: false }
    setInstantiatingTemplate(template)
    setEditingChecklist(draft)
    setShowForm(true)
  }

  // Item operations - update all three states
  const handleAddItem = async (checklistId: number, title: string, priority: Priority, parentId?: number | null) => {
    const item = await api(`/api/checklists/${checklistId}/items`, 'POST', { title, priority, parentId })
    updateChecklistItems(checklistId, items => [...items, item])
  }

  const handleToggleItem = async (checklistId: number, item: ChecklistItem) => {
    const updated = await api(`/api/checklists/${checklistId}/items/${item.id}`, 'PUT', { completed: !item.completed })
    updateChecklistItems(checklistId, items => items.map(i => i.id === updated.id ? updated : i))
  }

  const handleDeleteItem = async (checklistId: number, itemId: number) => {
    await api(`/api/checklists/${checklistId}/items/${itemId}`, 'DELETE')
    updateChecklistItems(checklistId, items => items.filter(i => i.id !== itemId))
  }

  const handleUpdateItem = async (checklistId: number, item: ChecklistItem, data: Partial<ChecklistItem>) => {
    const updated = await api(`/api/checklists/${checklistId}/items/${item.id}`, 'PUT', data)
    updateChecklistItems(checklistId, items => items.map(i => i.id === updated.id ? updated : i))
  }

  const handleReorder = async (checklistId: number, items: ChecklistItem[]) => {
    updateChecklistItems(checklistId, () => items)
    await Promise.all(items.map(item => api(`/api/checklists/${checklistId}/items/${item.id}`, 'PUT', { position: item.position })))
  }

  const handleCreateReminder = async (checklistId: number, item: ChecklistItem) => {
    const checklist = [...checklists, ...templates, ...history].find(c => c.id === checklistId)
    const dueDate = checklist?.endDate || new Date(Date.now() + 86400000).toISOString()
    await api('/api/reminders', 'POST', {
      title: item.title,
      description: checklist ? `${t('checklists.reminderFromChecklist')}: ${checklist.title}` : null,
      dueDate,
      priority: item.priority,
    })
    setToast(t('checklists.reminderCreated', { title: item.title }))
  }

  // Category CRUD
  const handleAddCategory = async (name: string, color: string, icon: string) => {
    const cat = await api('/api/checklist-categories', 'POST', { name, color, icon })
    setCategories(prev => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)))
  }

  const handleUpdateCategory = async (id: number, data: Partial<ChecklistCategory>) => {
    const updated = await api(`/api/checklist-categories/${id}`, 'PUT', data)
    setCategories(prev => prev.map(c => c.id === id ? updated : c))
  }

  const handleDeleteCategory = async (id: number) => {
    await api(`/api/checklist-categories/${id}`, 'DELETE')
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AppLayout>
    )
  }

  const currentData = tab === 'active' ? getActiveChecklists() : tab === 'templates' ? templates : history

  return (
    <AppLayout>
      <ChecklistList
        tab={tab} checklists={currentData} categories={categories}
        filter={filter} categoryFilter={categoryFilter} expandedId={expandedId}
        search={search} sort={sort}
        onTabChange={setTab}
        onSearchChange={setSearch} onSortChange={setSort}
        onFilterChange={setFilter} onCategoryFilterChange={setCategoryFilter}
        onToggleExpand={id => setExpandedId(expandedId === id ? null : id)}
        onEdit={c => { setEditingChecklist(c); setShowForm(true) }}
        onNew={() => { setEditingChecklist(null); setShowForm(true) }}
        onDuplicate={handleDuplicate} onDelete={handleDeleteChecklist}
        onArchive={handleArchive}
        onInstantiateTemplate={handleInstantiateTemplate}
        onToggleItem={handleToggleItem} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem}
        onUpdateItem={handleUpdateItem} onReorder={handleReorder}
        onCreateReminder={handleCreateReminder}
      />

      {showForm && (
        <ChecklistForm
          checklist={editingChecklist} categories={categories}
          onSave={handleSaveChecklist}
          onCancel={() => { setShowForm(false); setEditingChecklist(null); setInstantiatingTemplate(null) }}
          onManageCategories={() => setShowCategories(true)}
        />
      )}

      {showCategories && (
        <CategoryManager
          categories={categories}
          onAdd={handleAddCategory} onUpdate={handleUpdateCategory} onDelete={handleDeleteCategory}
          onClose={() => setShowCategories(false)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AppLayout>
  )
}
