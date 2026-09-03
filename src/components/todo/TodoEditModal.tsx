'use client'

import { useState } from 'react'
import { Modal, Button, Input, Select, Textarea } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { Todo, TodoCategory } from '@/types/todo'
import type { EditTodoData } from '@/hooks/useTodos'

interface TodoEditModalProps {
  todo: Todo
  categories: TodoCategory[]
  onSave: (id: number, data: EditTodoData) => Promise<boolean>
  onClose: () => void
}

export default function TodoEditModal({ todo, categories, onSave, onClose }: TodoEditModalProps) {
  const { t } = useAppTranslation()
  const [title, setTitle] = useState(todo.title)
  const [description, setDescription] = useState(todo.description || '')
  const [priority, setPriority] = useState(todo.priority)
  const [dueDate, setDueDate] = useState(todo.dueDate ? todo.dueDate.split('T')[0] : '')
  const [dueTime, setDueTime] = useState(todo.dueTime || '')
  const [effort, setEffort] = useState(todo.effortMinutes ? (todo.effortMinutes / 60).toString() : '')
  const [categoryId, setCategoryId] = useState(todo.categoryId ? todo.categoryId.toString() : '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    const success = await onSave(todo.id, {
      title: title.trim(),
      description: description || undefined,
      priority,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      effortMinutes: effort ? Math.round(parseFloat(effort) * 60) : 0,
      categoryId: categoryId ? parseInt(categoryId) : null,
    })
    setSaving(false)
    if (success) onClose()
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('todos.editTitle')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || saving}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label={t('todos.form.title')} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea
          label={t('todos.form.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t('todos.form.priority')}
            fieldSize="sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">{t('todos.priorities.low')}</option>
            <option value="normal">{t('todos.priorities.normal')}</option>
            <option value="high">{t('todos.priorities.high')}</option>
          </Select>
          <Select
            label={t('todos.form.category')}
            fieldSize="sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">{t('todos.noCategory')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t('todos.form.dueDate')}
            fieldSize="sm"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Input
            label={t('todos.form.dueTime')}
            fieldSize="sm"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </div>
        <Input
          label={t('todos.form.effort')}
          fieldSize="sm"
          type="number"
          value={effort}
          onChange={(e) => setEffort(e.target.value)}
          min="0"
          step="0.5"
        />
      </div>
    </Modal>
  )
}
