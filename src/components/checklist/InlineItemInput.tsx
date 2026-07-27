'use client'

import { useState, useRef } from 'react'
import { Button, Input, Select } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'
import type { ChecklistItem, Priority } from '@/types/checklist'

interface InlineItemInputProps {
  onAdd: (title: string, priority: Priority, parentId?: number | null) => void
  checklistItems: ChecklistItem[]
}

export default function InlineItemInput({ onAdd, checklistItems }: InlineItemInputProps) {
  const { t } = useAppTranslation()
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')
  const [parentId, setParentId] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim(), priority, parentId)
    setTitle('')
    setPriority('normal')
    setParentId(null)
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <Input
        ref={inputRef}
        fieldSize="sm"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('checklists.expandedItems.addItem')}
        className="flex-1"
      />
      <Select
        fieldSize="sm"
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        aria-label={t('checklists.expandedItems.normal')}
        className="w-auto text-xs"
      >
        <option value="low">{t('checklists.expandedItems.low')}</option>
        <option value="normal">{t('checklists.expandedItems.normal')}</option>
        <option value="high">{t('checklists.expandedItems.high')}</option>
      </Select>
      <Select
        fieldSize="sm"
        value={parentId ?? ''}
        onChange={(e) => setParentId(e.target.value ? parseInt(e.target.value) : null)}
        aria-label={t('checklists.expandedItems.noParent')}
        className="w-auto text-xs"
      >
        <option value="">{t('checklists.expandedItems.noParent')}</option>
        {checklistItems.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title.slice(0, 30)}
          </option>
        ))}
      </Select>
      <Button type="submit" size="sm" disabled={!title.trim()}>
        {t('checklists.expandedItems.add')}
      </Button>
    </form>
  )
}
